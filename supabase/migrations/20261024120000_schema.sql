-- =========================================================
-- Kiwu Club · Esquema
-- =========================================================

-- Tipos
create type public.order_status as enum ('pending', 'preparing', 'ready', 'completed', 'cancelled');
create type public.order_type as enum ('dine_in', 'takeaway');
create type public.selection_type as enum ('single', 'multiple');
create type public.app_role as enum ('staff', 'kiosk', 'customer');

-- ---------- Roles ----------
-- Sin fila en user_roles no hay privilegios, aunque la cuenta exista.
-- Los roles solo se asignan desde el SQL editor o con la service role.
create table public.user_roles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role public.app_role not null
);

create schema private;
grant usage on schema private to authenticated;

-- Fuera del esquema expuesto por la API. security definer evita la
-- recursión de RLS sobre user_roles.
create or replace function private.has_role(r public.app_role)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid()) and role = r
  );
$$;

revoke execute on function private.has_role(public.app_role) from public, anon;
grant execute on function private.has_role(public.app_role) to authenticated;

-- ---------- Menú ----------
create table public.categories (
  id bigint generated always as identity primary key,
  name text not null,
  sort_order int not null default 0
);

create table public.products (
  id bigint generated always as identity primary key,
  category_id bigint not null references public.categories (id) on delete restrict,
  name text not null,
  description text,
  price_cents int not null check (price_cents >= 0),
  image_url text,
  is_available boolean not null default true,
  sort_order int not null default 0
);

create table public.modifier_groups (
  id bigint generated always as identity primary key,
  name text not null,
  selection_type public.selection_type not null,
  is_required boolean not null default false,
  sort_order int not null default 0
);

create table public.modifier_options (
  id bigint generated always as identity primary key,
  modifier_group_id bigint not null references public.modifier_groups (id) on delete cascade,
  name text not null,
  price_delta_cents int not null default 0 check (price_delta_cents >= 0),
  is_available boolean not null default true,
  sort_order int not null default 0
);

create table public.product_modifier_groups (
  product_id bigint not null references public.products (id) on delete cascade,
  modifier_group_id bigint not null references public.modifier_groups (id) on delete cascade,
  primary key (product_id, modifier_group_id)
);

-- ---------- Pedidos ----------
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number bigint generated always as identity unique,
  customer_name text not null check (char_length(customer_name) between 1 and 40),
  order_type public.order_type not null,
  status public.order_status not null default 'pending',
  total_cents int not null default 0 check (total_cents >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Copias de nombre y precio: el histórico no cambia si cambia el menú
create table public.order_items (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id bigint references public.products (id) on delete set null,
  product_name text not null,
  unit_price_cents int not null check (unit_price_cents >= 0),
  quantity int not null check (quantity between 1 and 20)
);

create table public.order_item_options (
  id bigint generated always as identity primary key,
  order_item_id bigint not null references public.order_items (id) on delete cascade,
  modifier_option_id bigint references public.modifier_options (id) on delete set null,
  group_name text not null,
  option_name text not null,
  price_delta_cents int not null check (price_delta_cents >= 0)
);

-- Índices (claves foráneas y consultas del KDS)
create index on public.products (category_id);
create index on public.modifier_options (modifier_group_id);
create index on public.product_modifier_groups (modifier_group_id);
create index on public.orders (status, created_at);
create index on public.order_items (order_id);
create index on public.order_items (product_id);
create index on public.order_item_options (order_item_id);
create index on public.order_item_options (modifier_option_id);

-- ---------- Estados: solo transiciones válidas ----------
create or replace function public.validate_order_status_transition()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status is distinct from old.status and not (
       (old.status = 'pending'   and new.status in ('preparing', 'cancelled'))
    or (old.status = 'preparing' and new.status in ('ready', 'cancelled'))
    or (old.status = 'ready'     and new.status = 'completed')
  ) then
    raise exception 'Invalid status transition: % -> %', old.status, new.status;
  end if;

  new.updated_at := now();
  return new;
end;
$$;

create trigger orders_validate_status
before update on public.orders
for each row execute function public.validate_order_status_transition();

-- ---------- Crear pedido (el servidor valida y calcula precios) ----------
-- Solo la tablet (kiosk) o el staff, con sesión. anon no puede llamarla.
-- p_items: [{ "product_id": 1, "quantity": 2, "option_ids": [3, 7] }, ...]
create or replace function public.create_order(
  p_customer_name text,
  p_order_type public.order_type,
  p_items jsonb
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
  v_order_item_id bigint;
  v_total int := 0;
begin
  if not (private.has_role('kiosk') or private.has_role('staff')) then
    raise exception 'Not allowed' using errcode = '42501';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) = 0 or jsonb_array_length(p_items) > 30 then
    raise exception 'Order must have between 1 and 30 items';
  end if;

  insert into public.orders (customer_name, order_type)
  values (trim(p_customer_name), p_order_type)
  returning * into v_order;

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

    -- Todas las opciones existen, están disponibles y pertenecen a este producto
    if (
      select count(*)
      from public.modifier_options mo
      join public.product_modifier_groups pmg
        on pmg.modifier_group_id = mo.modifier_group_id and pmg.product_id = v_product.id
      where mo.id = any (v_option_ids) and mo.is_available
    ) <> cardinality(v_option_ids) then
      raise exception 'Invalid option for %', v_product.name;
    end if;

    -- Grupos obligatorios cubiertos y como mucho una opción en grupos "single"
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

    insert into public.order_items (order_id, product_id, product_name, unit_price_cents, quantity)
    values (v_order.id, v_product.id, v_product.name, v_product.price_cents + v_options_cents, v_quantity)
    returning id into v_order_item_id;

    insert into public.order_item_options
      (order_item_id, modifier_option_id, group_name, option_name, price_delta_cents)
    select v_order_item_id, mo.id, mg.name, mo.name, mo.price_delta_cents
    from public.modifier_options mo
    join public.modifier_groups mg on mg.id = mo.modifier_group_id
    where mo.id = any (v_option_ids);

    v_total := v_total + (v_product.price_cents + v_options_cents) * v_quantity;
  end loop;

  update public.orders set total_cents = v_total
  where id = v_order.id
  returning * into v_order;

  return v_order;
end;
$$;

-- ---------- Permisos ----------
-- Se parte de cero y se concede solo lo necesario
revoke all on public.categories, public.products, public.modifier_groups,
  public.modifier_options, public.product_modifier_groups, public.orders,
  public.order_items, public.order_item_options, public.user_roles
  from anon, authenticated;
revoke execute on function public.validate_order_status_transition() from public, anon, authenticated;
revoke execute on function public.create_order(text, public.order_type, jsonb) from public, anon, authenticated;

-- Menú: lectura para todos (la tablet puede mostrarlo antes de iniciar sesión)
grant select on public.categories, public.products, public.modifier_groups,
  public.modifier_options, public.product_modifier_groups to anon, authenticated;
grant update (is_available) on public.products, public.modifier_options to authenticated;

-- Pedidos y roles: RLS filtra por rol, los grants solo abren la puerta
grant select on public.orders, public.order_items, public.order_item_options to authenticated;
grant update (status) on public.orders to authenticated;
grant select on public.user_roles to authenticated;

-- Crear pedidos: solo con sesión (la función además exige rol kiosk o staff)
grant execute on function public.create_order(text, public.order_type, jsonb) to authenticated;

-- ---------- RLS ----------
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.modifier_groups enable row level security;
alter table public.modifier_options enable row level security;
alter table public.product_modifier_groups enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_item_options enable row level security;
alter table public.user_roles enable row level security;

create policy "Users can read own role" on public.user_roles
  for select to authenticated using (user_id = (select auth.uid()));

create policy "Menu readable by everyone" on public.categories
  for select to anon, authenticated using (true);
create policy "Menu readable by everyone" on public.products
  for select to anon, authenticated using (true);
create policy "Menu readable by everyone" on public.modifier_groups
  for select to anon, authenticated using (true);
create policy "Menu readable by everyone" on public.modifier_options
  for select to anon, authenticated using (true);
create policy "Menu readable by everyone" on public.product_modifier_groups
  for select to anon, authenticated using (true);

create policy "Staff can update products" on public.products
  for update to authenticated
  using ((select private.has_role('staff')))
  with check ((select private.has_role('staff')));
create policy "Staff can update options" on public.modifier_options
  for update to authenticated
  using ((select private.has_role('staff')))
  with check ((select private.has_role('staff')));

create policy "Staff can read orders" on public.orders
  for select to authenticated using ((select private.has_role('staff')));
create policy "Staff can update orders" on public.orders
  for update to authenticated
  using ((select private.has_role('staff')))
  with check ((select private.has_role('staff')));
create policy "Staff can read order items" on public.order_items
  for select to authenticated using ((select private.has_role('staff')));
create policy "Staff can read order item options" on public.order_item_options
  for select to authenticated using ((select private.has_role('staff')));

-- ---------- Tiempo real ----------
alter publication supabase_realtime add table public.orders;
