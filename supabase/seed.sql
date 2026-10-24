-- =========================================================
-- Kiwu Club · Menú de prueba (precios en céntimos)
-- =========================================================
insert into public.categories (name, sort_order) values
  ('Hot', 1), ('Iced', 2);

insert into public.products (category_id, name, description, price_cents, image_url, sort_order)
select c.id, p.name, p.description, p.price_cents, p.image_url, p.sort_order
from (values
  ('Hot',  'Espresso',           'Short and intense',                          160, '/products/espresso.webp',           1),
  ('Hot',  'Americano',          'Espresso topped with hot water',             200, '/products/americano.webp',          2),
  ('Hot',  'Cappuccino',         'Espresso, milk and thick foam',              280, '/products/cappuccino.webp',         3),
  ('Hot',  'Latte',              'Espresso with plenty of steamed milk',       300, '/products/latte.webp',              4),
  ('Hot',  'Mocha',              'Espresso, chocolate and whipped cream',      340, '/products/mocha.webp',              5),
  ('Hot',  'Matcha Latte',       'Ceremonial matcha with steamed milk',        360, '/products/matcha-latte.webp',       6),
  ('Iced', 'Iced Latte',         'Espresso poured over cold milk and ice',     320, '/products/iced-latte.webp',         1),
  ('Iced', 'Cold Brew',          'Steeped for 18 hours, smooth and strong',    330, '/products/cold-brew.webp',          2),
  ('Iced', 'Iced Americano',     'Espresso over ice and cold water',           240, '/products/iced-americano.webp',     3),
  ('Iced', 'Iced Matcha Latte',  'Matcha whisked with cold milk and ice',      380, '/products/iced-matcha-latte.webp',  4),
  ('Iced', 'Iced Caramel Latte', 'Iced latte with caramel drizzle',            350, '/products/iced-caramel-latte.webp', 5),
  ('Iced', 'Espresso Tonic',     'Espresso over tonic water and ice',          340, '/products/espresso-tonic.webp',     6)
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

-- Qué grupos de opciones ofrece cada bebida
--   Espresso / Espresso Tonic: sin tamaño ni leche
--   Americano, Cold Brew: tamaño
--   Con leche: tamaño + leche
--   Matcha: sin "Extras" (el shot de café no encaja)
insert into public.product_modifier_groups (product_id, modifier_group_id)
select p.id, g.id
from (values
  ('Espresso',           'Sweetener'), ('Espresso',           'Extras'),
  ('Americano',          'Size'), ('Americano',          'Sweetener'), ('Americano',          'Extras'),
  ('Cappuccino',         'Size'), ('Cappuccino',         'Milk'), ('Cappuccino',         'Sweetener'), ('Cappuccino',         'Extras'),
  ('Latte',              'Size'), ('Latte',              'Milk'), ('Latte',              'Sweetener'), ('Latte',              'Extras'),
  ('Mocha',              'Size'), ('Mocha',              'Milk'), ('Mocha',              'Sweetener'), ('Mocha',              'Extras'),
  ('Matcha Latte',       'Size'), ('Matcha Latte',       'Milk'), ('Matcha Latte',       'Sweetener'),
  ('Iced Latte',         'Size'), ('Iced Latte',         'Milk'), ('Iced Latte',         'Sweetener'), ('Iced Latte',         'Extras'),
  ('Cold Brew',          'Size'), ('Cold Brew',          'Sweetener'),
  ('Iced Americano',     'Size'), ('Iced Americano',     'Sweetener'), ('Iced Americano',     'Extras'),
  ('Iced Matcha Latte',  'Size'), ('Iced Matcha Latte',  'Milk'), ('Iced Matcha Latte',  'Sweetener'),
  ('Iced Caramel Latte', 'Size'), ('Iced Caramel Latte', 'Milk'), ('Iced Caramel Latte', 'Sweetener'), ('Iced Caramel Latte', 'Extras'),
  ('Espresso Tonic',     'Sweetener'), ('Espresso Tonic',     'Extras')
) as l (product_name, group_name)
join public.products p on p.name = l.product_name
join public.modifier_groups g on g.name = l.group_name;
