-- NaijaBulk demo data: 50 sample suppliers and listings (at least 5 per category).
-- Run once in the Supabase SQL Editor AFTER naijabulk_all.sql. Remove later with demo_cleanup.sql.
-- All companies are fictional and marked (Demo). None are verified. Prices are illustrative.
-- Photos are placeholder images by keyword from loremflickr.com and may not match the product exactly.
-- Replace them with real supplier photos for a live launch (edit listings.image_url or re-upload).

do $$
begin
  if exists (select 1 from auth.users where email like '%@demo.naijabulk.test') then
    raise exception 'Demo data is already loaded. Run demo_cleanup.sql first if you want to reload it.';
  end if;

  create temp table demo_seed on commit drop as
  select md5('naijabulk-demo-supplier-' || n)::uuid as uid, t.*
  from (values
    (1, 'Ondo Cocoa Growers', 'Ondo', 'Agricultural Commodities', 'Cocoa', 'Dried fermented cocoa beans, main crop', 'bulk', 'tonne', null, 25, 3400, 'cocoa'),
    (2, 'Kogi Cashew Cooperative', 'Kogi', 'Agricultural Commodities', 'Cashew', 'Raw cashew nuts in shell, 2026 crop', 'bulk', 'tonne', null, 20, 1150, 'cashew'),
    (3, 'Benue Sesame Aggregators', 'Benue', 'Agricultural Commodities', 'Sesame', 'Hulled white sesame seed, 99% purity', 'bulk', 'tonne', null, 22, 1750, 'sesame'),
    (4, 'Kaduna Ginger Processors', 'Kaduna', 'Agricultural Commodities', 'Ginger', 'Split dried ginger, export grade', 'bulk', 'tonne', null, 18, 2300, 'ginger'),
    (5, 'Niger Shea Women Group', 'Niger', 'Agricultural Commodities', 'Shea', 'Shea nuts, cleaned and bagged', 'bulk', 'tonne', null, 30, 620, 'shea'),
    (6, 'Jigawa Hibiscus Traders', 'Jigawa', 'Agricultural Commodities', 'Hibiscus', 'Dried hibiscus flowers, Grade A', 'bulk', 'tonne', null, 15, 1900, 'hibiscus'),
    (7, 'Edo Palm Mills', 'Edo', 'Agricultural Commodities', 'Palm products', 'Palm kernel, bulk', 'bulk', 'tonne', null, 40, 540, 'palm'),
    (8, 'Plateau Groundnut Exporters', 'Plateau', 'Agricultural Commodities', 'Groundnuts', 'Shelled groundnuts, 40/50 count', 'bulk', 'tonne', null, 25, 1250, 'peanuts'),
    (9, 'Oyo Soybean Farms', 'Oyo', 'Agricultural Commodities', 'Soybeans', 'Soybeans, non-GMO', 'bulk', 'tonne', null, 50, 610, 'soybean'),
    (10, 'Ijebu Garri Works', 'Ogun', 'Nigerian Foodstuff', 'Garri', 'White garri, Ijebu style', 'retail', 'pack', 'Price shown per 1 kg pack. Also 5 kg, 10 kg and 25 kg', 1, 3.5, 'cassava'),
    (11, 'Abeokuta Egusi Foods', 'Ogun', 'Nigerian Foodstuff', 'Egusi', 'Ground egusi, cleaned melon seed', 'retail', 'pack', 'Price shown per 500 g pack. Also 1 kg and 5 kg', 1, 6.5, 'seeds'),
    (12, 'Cross River Ogbono Company', 'Cross River', 'Nigerian Foodstuff', 'Ogbono', 'Whole ogbono seeds', 'retail', 'pack', 'Price shown per 500 g pack. Also 1 kg', 1, 9, 'seeds'),
    (13, 'Ofada Rice Growers', 'Ogun', 'Nigerian Foodstuff', 'Ofada rice', 'Unpolished Ofada rice', 'bulk', 'bag', '50 kg bags', 20, 45, 'rice'),
    (14, 'Benue Yam Flour Mill', 'Benue', 'Nigerian Foodstuff', 'Yam flour', 'Elubo (yam flour)', 'retail', 'pack', 'Price shown per 1 kg pack. Also 5 kg', 1, 4, 'flour'),
    (15, 'Edo Red Oil Producers', 'Edo', 'Nigerian Foodstuff', 'Palm oil', 'Red palm oil, unrefined', 'retail', 'pack', 'Price shown per 1 litre bottle. Also 5 litres and 25 litres', 1, 5, 'oil'),
    (16, 'Lagos Lagoon Fish Smokers', 'Lagos', 'Fish and Seafood', 'Smoked catfish', 'Smoked catfish, whole', 'retail', 'pack', 'Price shown per 1 kg pack. Also 5 kg', 1, 14, 'catfish'),
    (17, 'Kainji Dried Fish Traders', 'Niger', 'Fish and Seafood', 'Dried catfish', 'Dried catfish, export grade', 'bulk', 'carton', '10 kg cartons', 50, 120, 'fish'),
    (18, 'Delta Crayfish Merchants', 'Delta', 'Fish and Seafood', 'Dried crayfish', 'Dried crayfish, whole', 'retail', 'pack', 'Price shown per 500 g pack. Also 1 kg', 1, 12, 'shrimp'),
    (19, 'Bayelsa Bonga Fish Company', 'Bayelsa', 'Fish and Seafood', 'Bonga fish', 'Smoked bonga fish (shawa)', 'retail', 'pack', 'Price shown per 1 kg pack', 1, 11, 'fish'),
    (20, 'Stockfish Traders Lagos', 'Lagos', 'Fish and Seafood', 'Stockfish', 'Stockfish, cut portions', 'retail', 'pack', 'Price shown per 1 kg pack. Head, body and fins available', 1, 28, 'stockfish'),
    (21, 'Kano Suya Spice House', 'Kano', 'Spices and Seasonings', 'Suya spice', 'Suya spice (yaji) blend', 'retail', 'pack', 'Price shown per 250 g jar. Also 500 g', 1, 5, 'spices'),
    (22, 'Ondo Pepper Growers', 'Ondo', 'Spices and Seasonings', 'Dried pepper', 'Dried pepper flakes', 'retail', 'pack', 'Price shown per 500 g pack', 1, 8, 'chili'),
    (23, 'Ibadan Seasoning Company', 'Oyo', 'Spices and Seasonings', 'Iru', 'Iru (locust beans), dried', 'retail', 'pack', 'Price shown per 250 g pack', 1, 6, 'spices'),
    (24, 'Kaduna Turmeric Farms', 'Kaduna', 'Spices and Seasonings', 'Turmeric', 'Turmeric fingers, dried', 'bulk', 'tonne', null, 15, 1600, 'turmeric'),
    (25, 'Jos Pepper Traders', 'Plateau', 'Spices and Seasonings', 'Cameroon pepper', 'Cameroon pepper, ground', 'retail', 'pack', 'Price shown per 250 g pack', 1, 7, 'pepper'),
    (26, 'Lagos Chin Chin Bakery', 'Lagos', 'Snacks and Packaged Foods', 'Chin chin', 'Crunchy chin chin', 'retail', 'pack', 'Price shown per 500 g bag. Cartons of 20 available', 1, 6, 'snacks'),
    (27, 'Kano Kuli-Kuli Makers', 'Kano', 'Snacks and Packaged Foods', 'Kuli-kuli', 'Kuli-kuli (groundnut cakes)', 'retail', 'pack', 'Price shown per 250 g pack', 1, 4, 'peanuts'),
    (28, 'Ogun Plantain Chips Company', 'Ogun', 'Snacks and Packaged Foods', 'Plantain chips', 'Plantain chips, salted', 'retail', 'pack', 'Price shown per 200 g pack. 24 per carton', 1, 3, 'plantain'),
    (29, 'Abuja Kilishi House', 'FCT', 'Snacks and Packaged Foods', 'Kilishi', 'Kilishi (spiced dried beef)', 'retail', 'pack', 'Price shown per 200 g pack', 1, 12, 'jerky'),
    (30, 'Oyo Yam Chips Foods', 'Oyo', 'Snacks and Packaged Foods', 'Yam chips', 'Yam chips, ready to fry', 'retail', 'pack', 'Price shown per 500 g pack', 1, 5, 'yam'),
    (31, 'Sokoto Zobo Leaves Company', 'Sokoto', 'Drinks and Beverage Ingredients', 'Zobo leaves', 'Dried zobo (hibiscus) leaves', 'retail', 'pack', 'Price shown per 500 g pack. Also 1 kg', 1, 7, 'hibiscus'),
    (32, 'Zaria Kunu Mix', 'Kaduna', 'Drinks and Beverage Ingredients', 'Kunu mix', 'Kunu drink mix, instant', 'retail', 'pack', 'Price shown per 500 g pack', 1, 6, 'drink'),
    (33, 'Kano Tiger Nut Growers', 'Kano', 'Drinks and Beverage Ingredients', 'Tiger nuts', 'Tiger nuts, dried', 'bulk', 'bag', '25 kg bags', 40, 45, 'nuts'),
    (34, 'Lagos Herbal Tea Blends', 'Lagos', 'Drinks and Beverage Ingredients', 'Herbal teas', 'Nigerian herbal tea blend', 'retail', 'pack', 'Price shown per box of 20 tea bags', 1, 5, 'tea'),
    (35, 'Ondo Cocoa Powder Works', 'Ondo', 'Drinks and Beverage Ingredients', 'Cocoa powder', 'Natural cocoa powder', 'bulk', 'carton', 'Cartons of 12 x 1 kg', 20, 60, 'cocoa'),
    (36, 'Kwara Shea Butter Collective', 'Kwara', 'Beauty and Natural Products', 'Shea butter', 'Raw unrefined shea butter', 'retail', 'pack', 'Price shown per 500 g tub. Also 1 kg and 5 kg', 1, 10, 'shea'),
    (37, 'Osun Black Soap Makers', 'Osun', 'Beauty and Natural Products', 'Black soap', 'African black soap, handmade', 'retail', 'pack', 'Price shown per 200 g bar', 1, 4, 'soap'),
    (38, 'Ogun Cocoa Butter Company', 'Ogun', 'Beauty and Natural Products', 'Cocoa butter', 'Cocoa butter, food and cosmetic grade', 'bulk', 'kg', null, 500, 8.5, 'cocoa'),
    (39, 'Ikorodu Coconut Oil Press', 'Lagos', 'Beauty and Natural Products', 'Coconut oil', 'Cold-pressed coconut oil', 'retail', 'pack', 'Price shown per 500 ml bottle', 1, 7, 'coconut'),
    (40, 'Ibadan Natural Hair Oils', 'Oyo', 'Beauty and Natural Products', 'Hair oils', 'Natural hair oil blend', 'retail', 'pack', 'Price shown per 100 ml bottle', 1, 8, 'haircare'),
    (41, 'Abeokuta Adire Studio', 'Ogun', 'Fashion and Textiles', 'Adire', 'Hand-dyed Adire fabric', 'retail', 'pack', 'Price shown per 6 yard piece', 1, 45, 'textile'),
    (42, 'Lagos Ankara Wholesale', 'Lagos', 'Fashion and Textiles', 'Ankara', 'Ankara wax print fabric', 'bulk', 'pack', 'Price shown per 6 yard piece', 50, 12, 'fabric'),
    (43, 'Iseyin Aso-Oke Weavers', 'Oyo', 'Fashion and Textiles', 'Aso-oke', 'Hand-woven Aso-oke', 'retail', 'pack', 'Price shown per set', 1, 90, 'weaving'),
    (44, 'Kano Leather Footwear', 'Kano', 'Fashion and Textiles', 'Footwear', 'Handmade leather sandals', 'retail', 'pack', 'Price shown per pair', 1, 35, 'sandals'),
    (45, 'Abuja Bags and Accessories', 'FCT', 'Fashion and Textiles', 'Bags', 'Handcrafted tote bags', 'retail', 'pack', 'Price shown per bag', 1, 25, 'handbag'),
    (46, 'Benue Basket Weavers', 'Benue', 'Arts, Crafts and Home Products', 'Baskets', 'Woven raffia baskets', 'retail', 'pack', 'Price shown per set of 3', 1, 30, 'basket'),
    (47, 'Lagos Beads and Jewellery', 'Lagos', 'Arts, Crafts and Home Products', 'Jewellery', 'Handmade beaded jewellery', 'retail', 'pack', 'Price shown per piece', 1, 18, 'jewelry'),
    (48, 'Abuja Pottery Studio', 'FCT', 'Arts, Crafts and Home Products', 'Pottery', 'Hand-thrown clay pots', 'retail', 'pack', 'Price shown per piece', 1, 22, 'pottery'),
    (49, 'Ogun Wood Carvers', 'Ogun', 'Arts, Crafts and Home Products', 'Wooden crafts', 'Carved wooden stools', 'retail', 'pack', 'Price shown per stool', 1, 55, 'woodcarving'),
    (50, 'Ibadan Furniture Makers', 'Oyo', 'Arts, Crafts and Home Products', 'Furniture', 'Solid wood dining chair', 'retail', 'pack', 'Price shown per chair', 1, 140, 'furniture')
  ) as t(n, company, state, category, commodity, title, sale, unit, packs, moq, price, kw);

  insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, email_confirmed_at, created_at, updated_at)
  select uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         'demo' || n || '@demo.naijabulk.test',
         '{"provider":"email","providers":["email"]}'::jsonb,
         jsonb_build_object('role', 'supplier', 'company', company || ' (Demo)', 'country', 'Nigeria'),
         now(), now(), now()
  from demo_seed;

  insert into listings (supplier_id, commodity, title, category, sale_type, unit, pack_sizes, origin_state, moq_tons, price_usd_per_ton, image_url)
  select uid, commodity, title, category, sale, unit, packs, state, moq, price,
         'https://loremflickr.com/600/600/' || kw || '?lock=' || n
  from demo_seed;
end $$;
