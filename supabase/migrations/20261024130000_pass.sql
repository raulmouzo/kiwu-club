-- =========================================================
-- Kiwu Club · El pase
-- Barra de tickets: datos del pedido, fidelidad, descuentos,
-- happy hour y pago simulado.
-- =========================================================

create type public.discount_kind as enum ('percent', 'amount');

-- ---------- Menú: alérgenos, dieta y tiempo de preparación ----------
alter table public.products
  add column allergens text[] not null default '{}',
  add column dietary text[] not null default '{}',
  add column prep_seconds int not null default 90 check (prep_seconds between 0 and 900);

-- ---------- Pedido: mesa, recogida, propina, descuento, pago ----------
alter table public.orders
  add column table_number int check (table_number between 1 and 40),
  add column pickup_at timestamptz,
  add column note text check (char_length(note) <= 120),
  add column tip_cents int not null default 0 check (tip_cents >= 0),
  add column discount_cents int not null default 0 check (discount_cents >= 0),
  add column discount_code text,
  add column payment_method text not null default 'card'
    check (payment_method in ('card', 'cash')),
  add column payment_status text not null default 'paid'
    check (payment_status in ('paid', 'pending')),
  add column phone text check (phone ~ '^[0-9]{9}$');

-- ---------- Descuentos y happy hour ----------
create table public.discount_codes (
  code text primary key check (code ~ '^[A-Z0-9]{3,16}$'),
  kind public.discount_kind not null,
  value int not null check (value > 0),
  min_cents int not null default 0 check (min_cents >= 0),
  active boolean not null default true,
  expires_at timestamptz
);

create table public.happy_hours (
  id bigint generated always as identity primary key,
  label text not null,
  weekday int not null check (weekday between 0 and 6),
  start_minute int not null check (start_minute between 0 and 1439),
  end_minute int not null check (end_minute between 0 and 1439),
  percent int not null check (percent between 1 and 100)
);

-- ---------- Fidelidad ----------
create table public.loyalty_cards (
  phone text primary key check (phone ~ '^[0-9]{9}$'),
  stamps int not null default 0 check (stamps between 0 and 9),
  rewards int not null default 0 check (rewards >= 0),
  updated_at timestamptz not null default now()
);

-- ---------- Happy hour vigente ----------
create or replace function public.current_happy_hour()
returns int
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(max(percent), 0)
  from public.happy_hours
  where weekday = extract(dow from now() at time zone 'Europe/Madrid')::int
    and extract(hour from now() at time zone 'Europe/Madrid') * 60
        + extract(minute from now() at time zone 'Europe/Madrid')
        between start_minute and end_minute;
$$;

-- ---------- Estado público de un pedido ----------
create or replace function public.get_order_status(p_number bigint)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'order_number', o.order_number,
    'customer_name', o.customer_name,
    'status', o.status,
    'created_at', o.created_at,
    'total_cents', o.total_cents,
    'table_number', o.table_number,
    'pickup_at', o.pickup_at,
    'queue_ahead', (
      select count(*) from public.orders q
      where q.status in ('pending', 'preparing') and q.created_at < o.created_at
    ),
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'name', i.product_name,
        'quantity', i.quantity,
        'options', coalesce((
          select jsonb_agg(io.option_name)
          from public.order_item_options io where io.order_item_id = i.id
        ), '[]'::jsonb)
      ) order by i.id)
      from public.order_items i where i.order_id = o.id
    ), '[]'::jsonb)
  )
  from public.orders o
  where o.order_number = p_number;
$$;

-- ---------- Tablón de listos ----------
create or replace function public.ready_orders()
returns table (order_number bigint, customer_name text, ready_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select o.order_number, o.customer_name, o.updated_at
  from public.orders o
  where o.status = 'ready'
  order by o.updated_at asc
  limit 12;
$$;

-- ---------- Fidelidad: consulta y canje ----------
create or replace function public.loyalty_status(p_phone text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'phone', c.phone, 'stamps', c.stamps, 'rewards', c.rewards
  )
  from public.loyalty_cards c
  where c.phone = p_phone;
$$;

-- ---------- Crear pedido (v2) ----------
drop function public.create_order(text, public.order_type, jsonb);

create or replace function public.create_order(
  p_customer_name text,
  p_order_type public.order_type,
  p_items jsonb,
  p_table_number int default null,
  p_pickup_at timestamptz default null,
  p_tip_cents int default 0,
  p_discount_code text default null,
  p_payment_method text default 'card',
  p_note text default null,
  p_phone text default null,
  p_redeem_reward boolean default false
)
returns public.orders
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders;
  v_item jsonb;
  v_product public.products;
  v_quantity int;
  v_option_ids bigint[];
  v_options_cents int;
  v_unit int;
  v_lines jsonb := '[]'::jsonb;
  v_subtotal int := 0;
  v_discount int := 0;
  v_code public.discount_codes;
  v_cheapest int;
  v_card public.loyalty_cards;
  v_line_id bigint;
begin
  if not (private.has_role('kiosk') or private.has_role('staff')) then
    raise exception 'Not allowed' using errcode = '42501';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) = 0 or jsonb_array_length(p_items) > 30 then
    raise exception 'Order must have between 1 and 30 items';
  end if;

  if p_order_type = 'dine_in' and p_table_number is null then
    raise exception 'Dine in needs a table';
  end if;

  -- Se validan y valoran todas las líneas antes de crear nada.
  for v_item in select * from jsonb_array_elements(p_items) loop
    v_quantity := (v_item ->> 'quantity')::int;
    if v_quantity is null or v_quantity not between 1 and 20 then
      raise exception 'Invalid quantity';
    end if;

    select * into v_product
    from public.products
    where id = (v_item ->> 'product_id')::bigint and is_available;
    if not found then
      raise exception 'Product not available';
    end if;

    select coalesce(array_agg(distinct value::bigint), '{}')
    into v_option_ids
    from jsonb_array_elements_text(coalesce(v_item -> 'option_ids', '[]'::jsonb));

    if (
      select count(*)
      from public.modifier_options mo
      join public.product_modifier_groups pmg
        on pmg.modifier_group_id = mo.modifier_group_id and pmg.product_id = v_product.id
      where mo.id = any (v_option_ids) and mo.is_available
    ) <> cardinality(v_option_ids) then
      raise exception 'Invalid option for %', v_product.name;
    end if;

    if exists (
      select 1
      from public.product_modifier_groups pmg
      join public.modifier_groups mg on mg.id = pmg.modifier_group_id
      left join public.modifier_options mo
        on mo.modifier_group_id = mg.id and mo.id = any (v_option_ids)
      where pmg.product_id = v_product.id
      group by mg.id
      having (bool_or(mg.is_required) and count(mo.id) = 0)
          or (bool_or(mg.selection_type = 'single') and count(mo.id) > 1)
    ) then
      raise exception 'Missing or incompatible options for %', v_product.name;
    end if;

    select coalesce(sum(price_delta_cents), 0)
    into v_options_cents
    from public.modifier_options
    where id = any (v_option_ids);

    v_unit := v_product.price_cents + v_options_cents;
    v_subtotal := v_subtotal + v_unit * v_quantity;
    v_cheapest := least(coalesce(v_cheapest, v_unit), v_unit);

    v_lines := v_lines || jsonb_build_object(
      'product_id', v_product.id,
      'name', v_product.name,
      'unit', v_unit,
      'quantity', v_quantity,
      'options', coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', mo.id, 'group', mg.name, 'name', mo.name, 'delta', mo.price_delta_cents))
        from public.modifier_options mo
        join public.modifier_groups mg on mg.id = mo.modifier_group_id
        where mo.id = any (v_option_ids)
      ), '[]'::jsonb)
    );
  end loop;

  -- Código de descuento
  if p_discount_code is not null and p_discount_code <> '' then
    select * into v_code from public.discount_codes
    where code = upper(p_discount_code) and active
      and (expires_at is null or expires_at > now())
      and min_cents <= v_subtotal;
    if not found then
      raise exception 'Discount code not valid';
    end if;
    v_discount := case v_code.kind
      when 'percent' then floor(v_subtotal * v_code.value / 100.0)::int
      else v_code.value
    end;
  end if;

  -- Recompensa de fidelidad: una bebida gratis (la más barata del pedido)
  if p_redeem_reward and p_phone is not null then
    select * into v_card from public.loyalty_cards
    where phone = p_phone and rewards > 0
    for update;
    if found then
      update public.loyalty_cards
      set rewards = rewards - 1, updated_at = now()
      where phone = p_phone;
      v_discount := v_discount + least(v_cheapest, 400);
    end if;
  end if;

  v_discount := least(v_discount, v_subtotal);

  insert into public.orders (
    customer_name, order_type, table_number, pickup_at, tip_cents,
    discount_cents, discount_code, payment_method, payment_status, note, phone, total_cents
  ) values (
    trim(p_customer_name), p_order_type, p_table_number, p_pickup_at, p_tip_cents,
    v_discount, nullif(upper(p_discount_code), ''), p_payment_method, 'paid',
    nullif(trim(p_note), ''), p_phone, v_subtotal + p_tip_cents - v_discount
  )
  returning * into v_order;

  for v_item in select * from jsonb_array_elements(v_lines) loop
    insert into public.order_items (order_id, product_id, product_name, unit_price_cents, quantity)
    values (
      v_order.id, (v_item ->> 'product_id')::bigint, v_item ->> 'name',
      (v_item ->> 'unit')::int, (v_item ->> 'quantity')::int
    )
    returning id into v_line_id;

    insert into public.order_item_options
      (order_item_id, modifier_option_id, group_name, option_name, price_delta_cents)
    select v_line_id, (o ->> 'id')::bigint, o ->> 'group', o ->> 'name', (o ->> 'delta')::int
    from jsonb_array_elements(v_item -> 'options') o;
  end loop;

  -- Sello de fidelidad: a los 10 se cambia por una bebida gratis.
  if p_phone is not null then
    insert into public.loyalty_cards (phone, stamps)
    values (p_phone, 1)
    on conflict (phone) do update
      set stamps = case when public.loyalty_cards.stamps >= 9 then 0
                        else public.loyalty_cards.stamps + 1 end,
          rewards = case when public.loyalty_cards.stamps >= 9
                         then public.loyalty_cards.rewards + 1
                         else public.loyalty_cards.rewards end,
          updated_at = now();
  end if;

  return v_order;
end;
$$;

-- ---------- Permisos ----------
revoke all on public.discount_codes, public.happy_hours, public.loyalty_cards
  from anon, authenticated;
grant select on public.discount_codes, public.happy_hours to anon, authenticated;

revoke execute on function public.current_happy_hour() from public, anon, authenticated;
revoke execute on function public.get_order_status(bigint) from public, anon, authenticated;
revoke execute on function public.ready_orders() from public, anon, authenticated;
revoke execute on function public.loyalty_status(text) from public, anon, authenticated;
revoke execute on function public.create_order(
  text, public.order_type, jsonb, int, timestamptz, int, text, text, text, text, boolean
) from public, anon, authenticated;

grant execute on function public.current_happy_hour() to anon, authenticated;
grant execute on function public.get_order_status(bigint) to anon, authenticated;
grant execute on function public.ready_orders() to anon, authenticated;
grant execute on function public.loyalty_status(text) to anon, authenticated;
grant execute on function public.create_order(
  text, public.order_type, jsonb, int, timestamptz, int, text, text, text, text, boolean
) to authenticated;

-- Menú: el staff lo edita entero desde la app
grant insert, update, delete on public.categories, public.products,
  public.modifier_groups, public.modifier_options, public.product_modifier_groups
  to authenticated;
grant insert, update, delete on public.discount_codes, public.happy_hours to authenticated;
grant insert, update, delete on public.user_roles to authenticated;

alter table public.discount_codes enable row level security;
alter table public.happy_hours enable row level security;
alter table public.loyalty_cards enable row level security;

create policy "Codes readable by everyone" on public.discount_codes
  for select to anon, authenticated using (true);
create policy "Happy hours readable by everyone" on public.happy_hours
  for select to anon, authenticated using (true);
create policy "Staff manage codes" on public.discount_codes
  for all to authenticated
  using ((select private.has_role('staff')))
  with check ((select private.has_role('staff')));
create policy "Staff manage happy hours" on public.happy_hours
  for all to authenticated
  using ((select private.has_role('staff')))
  with check ((select private.has_role('staff')));

create policy "Staff manage menu" on public.categories
  for all to authenticated
  using ((select private.has_role('staff')))
  with check ((select private.has_role('staff')));
create policy "Staff manage products" on public.products
  for all to authenticated
  using ((select private.has_role('staff')))
  with check ((select private.has_role('staff')));
create policy "Staff manage groups" on public.modifier_groups
  for all to authenticated
  using ((select private.has_role('staff')))
  with check ((select private.has_role('staff')));
create policy "Staff manage options" on public.modifier_options
  for all to authenticated
  using ((select private.has_role('staff')))
  with check ((select private.has_role('staff')));
create policy "Staff manage links" on public.product_modifier_groups
  for all to authenticated
  using ((select private.has_role('staff')))
  with check ((select private.has_role('staff')));

create policy "Staff read all roles" on public.user_roles
  for select to authenticated using ((select private.has_role('staff')));
create policy "Staff manage roles" on public.user_roles
  for all to authenticated
  using ((select private.has_role('staff')))
  with check ((select private.has_role('staff')));

-- ---------- Semilla de descuentos y happy hour ----------
insert into public.discount_codes (code, kind, value, min_cents) values
  ('KIWU10', 'percent', 10, 0),
  ('PRIMERA', 'amount', 100, 200);

insert into public.happy_hours (label, weekday, start_minute, end_minute, percent) values
  ('Tarde de filtro', 1, 900, 1080, 20),
  ('Tarde de filtro', 2, 900, 1080, 20),
  ('Tarde de filtro', 3, 900, 1080, 20),
  ('Tarde de filtro', 4, 900, 1080, 20),
  ('Tarde de filtro', 5, 900, 1080, 20);
