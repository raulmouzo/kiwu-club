-- =========================================================
-- Kiwu Club · Menú de prueba (precios en céntimos)
-- =========================================================
insert into public.categories (name, sort_order) values
  ('Coffee', 1), ('Tea', 2), ('Bakery', 3);

insert into public.products (category_id, name, description, price_cents, image_url, sort_order)
select c.id, p.name, p.description, p.price_cents, p.image_url, p.sort_order
from (values
  ('Coffee', 'Espresso',   'Short and intense',                    160, '/products/espresso.webp',   1),
  ('Coffee', 'Americano',  'Espresso topped with hot water',        200, '/products/americano.webp',  2),
  ('Coffee', 'Flat White', 'Double espresso with velvety milk',     260, '/products/flat-white.webp', 3),
  ('Coffee', 'Latte',      'Espresso with plenty of steamed milk',  280, '/products/latte.webp',      4),
  ('Coffee', 'Cappuccino', 'Espresso, milk and thick foam',         280, '/products/cappuccino.webp', 5),
  ('Coffee', 'Mocha',      'Espresso, chocolate and milk',          320, '/products/mocha.webp',      6),
  ('Tea',    'Green Tea',  'Japanese sencha',                       220, '/products/green-tea.webp',  1),
  ('Tea',    'Chai Latte', 'Spiced tea with milk',                  300, '/products/chai-latte.webp', 2),
  ('Bakery', 'Croissant',  'Butter croissant, baked today',         180, '/products/croissant.webp',  1),
  ('Bakery', 'Cookie',     'Chocolate chip with a pinch of salt',   200, '/products/cookie.webp',     2)
) as p (category, name, description, price_cents, image_url, sort_order)
join public.categories c on c.name = p.category;

insert into public.modifier_groups (name, selection_type, is_required, sort_order) values
  ('Size',      'single',   true,  1),
  ('Milk',      'single',   true,  2),
  ('Sweetener', 'single',   false, 3),
  ('Extras',    'multiple', false, 4);

insert into public.modifier_options (modifier_group_id, name, price_delta_cents, sort_order)
select g.id, o.name, o.price_delta_cents, o.sort_order
from (values
  ('Size',      'Small',          0, 1),
  ('Size',      'Medium',        40, 2),
  ('Size',      'Large',         80, 3),
  ('Milk',      'Whole',          0, 1),
  ('Milk',      'Skimmed',        0, 2),
  ('Milk',      'Lactose-free',   0, 3),
  ('Milk',      'Oat',           40, 4),
  ('Milk',      'Soy',           40, 5),
  ('Sweetener', 'Sugar',          0, 1),
  ('Sweetener', 'Brown sugar',    0, 2),
  ('Sweetener', 'Sweetener',      0, 3),
  ('Extras',    'Extra shot',    60, 1),
  ('Extras',    'Vanilla syrup', 40, 2),
  ('Extras',    'Caramel syrup', 40, 3),
  ('Extras',    'Whipped cream', 50, 4)
) as o (group_name, name, price_delta_cents, sort_order)
join public.modifier_groups g on g.name = o.group_name;

insert into public.product_modifier_groups (product_id, modifier_group_id)
select p.id, g.id
from (values
  ('Espresso',   'Extras'),
  ('Americano',  'Size'), ('Americano',  'Extras'),
  ('Flat White', 'Milk'), ('Flat White', 'Extras'),
  ('Latte',      'Size'), ('Latte',      'Milk'), ('Latte',      'Extras'),
  ('Cappuccino', 'Size'), ('Cappuccino', 'Milk'), ('Cappuccino', 'Extras'),
  ('Mocha',      'Size'), ('Mocha',      'Milk'), ('Mocha',      'Extras'),
  ('Green Tea',  'Size'),
  ('Chai Latte', 'Size'), ('Chai Latte', 'Milk')
) as l (product_name, group_name)
join public.products p on p.name = l.product_name
join public.modifier_groups g on g.name = l.group_name;

-- Sweetener en todos los cafés y tés
insert into public.product_modifier_groups (product_id, modifier_group_id)
select p.id, g.id
from public.products p
join public.categories c on c.id = p.category_id
cross join public.modifier_groups g
where c.name in ('Coffee', 'Tea') and g.name = 'Sweetener';
