-- =========================================================
-- Kiwu Club · Iniciar sesión desde el móvil con el QR del kiosko
-- El cliente escanea el QR de la tablet, entra en su móvil con un código
-- por email y reclama la tablet. El pedido que hace allí queda a su nombre:
-- lo sigue en directo y recibe un aviso cuando está listo.
-- =========================================================

-- ---------- Pedidos de cada cliente ----------
alter table public.orders
  add column customer_id uuid references auth.users (id) on delete set null;

create index on public.orders (customer_id, created_at desc);

-- ---------- Rol de cliente al registrarse ----------
-- Toda cuenta nueva empieza como cliente, que apenas da permisos: reclamar un
-- código y ver sus propios pedidos. Staff y kiosko se asignan después con un
-- upsert (insert ... on conflict (user_id) do update).
create or replace function private.assign_customer_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.user_roles (user_id, role)
  values (new.id, 'customer')
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.assign_customer_role();

-- ---------- Emparejamiento tablet ↔ móvil ----------
-- Un código de un solo uso por pedido. Lo genera el servidor (122 bits
-- aleatorios), caduca a los 5 minutos si nadie lo reclama y, una vez
-- reclamado, sirve para un único pedido.
create table public.kiosk_pairings (
  id uuid primary key default gen_random_uuid(),
  code text not null unique default replace(gen_random_uuid()::text, '-', ''),
  customer_id uuid references auth.users (id) on delete cascade,
  customer_name text check (char_length(customer_name) between 1 and 40),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '5 minutes',
  claimed_at timestamptz,
  consumed_at timestamptz,
  order_id uuid references public.orders (id) on delete set null
);

create index on public.kiosk_pairings (created_at);

-- La tablet pide un código nuevo para el siguiente cliente.
create or replace function public.create_pairing()
returns public.kiosk_pairings
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pairing public.kiosk_pairings;
begin
  if not (private.has_role('kiosk') or private.has_role('staff')) then
    raise exception 'Not allowed' using errcode = '42501';
  end if;

  -- Los códigos viejos ya no sirven para nada; la tabla se mantiene pequeña.
  delete from public.kiosk_pairings where created_at < now() - interval '1 day';

  insert into public.kiosk_pairings default values returning * into v_pairing;
  return v_pairing;
end;
$$;

-- El móvil reclama la tablet. Es una sola actualización condicionada, así que
-- dos móviles no pueden ganar el mismo código. Reclamarlo otra vez desde la
-- misma cuenta solo cambia el nombre.
create or replace function public.claim_pairing(p_code text, p_name text)
returns public.kiosk_pairings
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pairing public.kiosk_pairings;
begin
  if not private.has_role('customer') then
    raise exception 'Not allowed' using errcode = '42501';
  end if;

  if char_length(trim(coalesce(p_name, ''))) not between 1 and 40 then
    raise exception 'Enter your name (up to 40 characters).';
  end if;

  update public.kiosk_pairings
  set customer_id = (select auth.uid()), customer_name = trim(p_name), claimed_at = now()
  where code = p_code
    and consumed_at is null
    and expires_at > now()
    and (claimed_at is null or customer_id = (select auth.uid()))
  returning * into v_pairing;

  if not found then
    raise exception 'This code has expired or was already used. Scan the new one on the tablet.';
  end if;

  return v_pairing;
end;
$$;

-- Tras crear el pedido, la tablet lo pone a nombre del cliente y gasta el
-- código. No toca create_order: el pedido se crea igual, con o sin móvil.
create or replace function public.link_order_to_pairing(p_order_id uuid, p_code text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pairing public.kiosk_pairings;
begin
  if not (private.has_role('kiosk') or private.has_role('staff')) then
    raise exception 'Not allowed' using errcode = '42501';
  end if;

  update public.kiosk_pairings
  set consumed_at = now(), order_id = p_order_id
  where code = p_code
    and claimed_at is not null
    and consumed_at is null
    and claimed_at > now() - interval '30 minutes'
  returning * into v_pairing;

  if not found then
    raise exception 'The phone is no longer connected to this order.';
  end if;

  update public.orders
  set customer_id = v_pairing.customer_id
  where id = p_order_id
    and customer_id is null
    and created_at > now() - interval '10 minutes';

  if not found then
    raise exception 'Order not found.';
  end if;
end;
$$;

-- "¿No eres tú?" o la tablet se queda sin uso: el código deja de servir.
create or replace function public.cancel_pairing(p_code text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (private.has_role('kiosk') or private.has_role('staff')) then
    raise exception 'Not allowed' using errcode = '42501';
  end if;

  update public.kiosk_pairings
  set consumed_at = now()
  where code = p_code and consumed_at is null;
end;
$$;

-- ---------- Avisos push ----------
-- Se escriben y leen solo a través de funciones: el navegador guarda la suya
-- y el staff obtiene a quién avisar sin necesitar la clave de servicio.
create table public.push_subscriptions (
  endpoint text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create index on public.push_subscriptions (user_id);

-- Un mismo navegador puede pasar de una cuenta a otra: la suscripción pasa a
-- quien la guarda ahora.
create or replace function public.save_push_subscription(p_endpoint text, p_p256dh text, p_auth text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'Not allowed' using errcode = '42501';
  end if;

  insert into public.push_subscriptions (endpoint, user_id, p256dh, auth)
  values (p_endpoint, (select auth.uid()), p_p256dh, p_auth)
  on conflict (endpoint) do update
    set user_id = excluded.user_id, p256dh = excluded.p256dh, auth = excluded.auth;
end;
$$;

create or replace function public.delete_push_subscription(p_endpoint text)
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.push_subscriptions
  where endpoint = p_endpoint and user_id = (select auth.uid());
$$;

-- A quién avisar de un pedido. Solo el staff; para cualquier otro, nada.
create or replace function public.order_push_targets(p_order_id uuid)
returns table (endpoint text, p256dh text, auth text)
language sql
stable
security definer
set search_path = ''
as $$
  select s.endpoint, s.p256dh, s.auth
  from public.orders o
  join public.push_subscriptions s on s.user_id = o.customer_id
  where o.id = p_order_id and (select private.has_role('staff'));
$$;

-- El servicio de push dice que la suscripción ya no existe: se borra.
create or replace function public.forget_push_subscription(p_endpoint text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.has_role('staff') then
    raise exception 'Not allowed' using errcode = '42501';
  end if;
  delete from public.push_subscriptions where endpoint = p_endpoint;
end;
$$;

-- ---------- Permisos ----------
revoke all on public.kiosk_pairings, public.push_subscriptions from anon, authenticated;
grant select on public.kiosk_pairings to authenticated;

revoke execute on function private.assign_customer_role() from public, anon, authenticated;
revoke execute on function public.create_pairing() from public, anon, authenticated;
revoke execute on function public.claim_pairing(text, text) from public, anon, authenticated;
revoke execute on function public.link_order_to_pairing(uuid, text) from public, anon, authenticated;
revoke execute on function public.cancel_pairing(text) from public, anon, authenticated;
revoke execute on function public.save_push_subscription(text, text, text) from public, anon, authenticated;
revoke execute on function public.delete_push_subscription(text) from public, anon, authenticated;
revoke execute on function public.order_push_targets(uuid) from public, anon, authenticated;
revoke execute on function public.forget_push_subscription(text) from public, anon, authenticated;

grant execute on function public.create_pairing() to authenticated;
grant execute on function public.claim_pairing(text, text) to authenticated;
grant execute on function public.link_order_to_pairing(uuid, text) to authenticated;
grant execute on function public.cancel_pairing(text) to authenticated;
grant execute on function public.save_push_subscription(text, text, text) to authenticated;
grant execute on function public.delete_push_subscription(text) to authenticated;
grant execute on function public.order_push_targets(uuid) to authenticated;
grant execute on function public.forget_push_subscription(text) to authenticated;

-- ---------- RLS ----------
alter table public.kiosk_pairings enable row level security;
alter table public.push_subscriptions enable row level security;

-- La tablet necesita leer su código para enterarse por Realtime de quién lo reclama.
create policy "Kiosk and staff read pairings" on public.kiosk_pairings
  for select to authenticated
  using ((select private.has_role('kiosk')) or (select private.has_role('staff')));

-- Cada cliente ve sus pedidos, con sus líneas y opciones.
create policy "Customers read their orders" on public.orders
  for select to authenticated
  using (customer_id = (select auth.uid()));

create policy "Customers read their order items" on public.order_items
  for select to authenticated
  using (exists (
    select 1 from public.orders o
    where o.id = order_id and o.customer_id = (select auth.uid())
  ));

create policy "Customers read their order item options" on public.order_item_options
  for select to authenticated
  using (exists (
    select 1 from public.order_items i
    join public.orders o on o.id = i.order_id
    where i.id = order_item_id and o.customer_id = (select auth.uid())
  ));

-- ---------- Tiempo real ----------
alter publication supabase_realtime add table public.kiosk_pairings;
