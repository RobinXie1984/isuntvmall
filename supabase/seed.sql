insert into public.products
  (id, sku, slug, title, description, price_amount, currency, stock_qty, category, status, featured)
values
  ('11111111-1111-4111-8111-111111111111', 'SUN-TEE-200-WHT-XL', 'sun-200-cotton-tee', '阳光 200支纯棉 T恤', '轻盈亲肤的 200 支纯棉男士 T 恤，镜头前后都利落。', 5800, 'hkd', 42, 'Apparel', 'published', true),
  ('22222222-2222-4222-8222-222222222222', 'SUN-SHIRT-NVY-XL', 'navy-travel-shirt', '海风免烫旅行衬衫', '为跨城、跨境和直播日程设计的免烫衬衫。', 8900, 'hkd', 28, 'Apparel', 'published', true),
  ('33333333-3333-4333-8333-333333333333', 'SUN-FAN-PORTABLE', 'harbor-pocket-fan', '维港随身小风扇', '三档静音风力，USB-C 充电，轻装出门。', 2900, 'hkd', 120, 'Lifestyle', 'published', true),
  ('44444444-4444-4444-8444-444444444444', 'SUN-TEA-GIFT', 'mountain-tea-gift', '东方山韵茶礼', '适合拜访与节庆的精选茶叶礼盒。', 6800, 'hkd', 36, 'Gifts', 'published', false),
  ('55555555-5555-4555-8555-555555555555', 'SUN-TRAVEL-PACK', 'city-travel-pack', '城市轻行背包', '适合一日差旅的防泼水轻量背包。', 7600, 'hkd', 22, 'Travel', 'published', false),
  ('66666666-6666-4666-8666-666666666666', 'SUN-EARBUDS-01', 'studio-wireless-earbuds', '直播间无线耳机', '低延迟、清晰通话，日常与直播两用。', 9900, 'hkd', 18, 'Tech', 'published', false)
on conflict (sku) do nothing;

insert into public.product_images (product_id, source_url, alt_text, position)
values
  ('11111111-1111-4111-8111-111111111111', '/demo/tee.svg', '阳光白色纯棉 T 恤', 0),
  ('22222222-2222-4222-8222-222222222222', '/demo/shirt.svg', '深蓝免烫旅行衬衫', 0),
  ('33333333-3333-4333-8333-333333333333', '/demo/fan.svg', '蓝色随身小风扇', 0),
  ('44444444-4444-4444-8444-444444444444', '/demo/tea.svg', '金色东方茶礼盒', 0),
  ('55555555-5555-4555-8555-555555555555', '/demo/bag.svg', '深蓝城市轻行背包', 0),
  ('66666666-6666-4666-8666-666666666666', '/demo/earbuds.svg', '黑色无线耳机', 0)
on conflict (product_id, position) do nothing;

-- Fictional preview identities and rooms, never current live broadcasts.
insert into public.kols(id,slug,display_name,bio,status) values
('dddddddd-dddd-4ddd-8ddd-dddddddddddd','style-studio','Style Studio · 穿搭演示','Fictional demonstration host / 虚构演示主播','active'),
('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee','home-studio','Home Studio · 生活演示','Fictional demonstration host / 虚构演示主播','active'),
('ffffffff-ffff-4fff-8fff-ffffffffffff','travel-studio','Travel Studio · 旅行演示','Fictional demonstration host / 虚构演示主播','active') on conflict(id) do nothing;
insert into public.live_sessions(id,slug,title,description,host_name,kol_id,platform,external_url,embed_id,status,starts_at,poster_url) values
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','style-studio','Everyday, considered · 日常好物','YouTube player demonstration, not a live broadcast / 非直播','Style Studio · 穿搭演示','dddddddd-dddd-4ddd-8ddd-dddddddddddd','youtube','https://www.youtube.com/watch?v=M7lc1UVf-VE','M7lc1UVf-VE','preview','2026-08-18T08:00:00Z','/demo/live-hero.svg'),
('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','home-studio','A little more home · 生活小确幸','Demo room, no broadcast connected / 演示间','Home Studio · 生活演示','eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee','facebook','https://www.facebook.com/',null,'preview','2026-08-18T08:00:00Z','/demo/live-founders.svg'),
('cccccccc-cccc-4ccc-8ccc-cccccccccccc','travel-studio','Go somewhere good · 轻装出发','Instagram outbound demo / 原平台观看演示','Travel Studio · 旅行演示','ffffffff-ffff-4fff-8fff-ffffffffffff','instagram','https://www.instagram.com/',null,'preview','2026-08-18T08:00:00Z','/demo/live-style.svg') on conflict(id) do nothing;
insert into public.live_products(live_session_id,product_id,position) values
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','11111111-1111-4111-8111-111111111111',0),
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','22222222-2222-4222-8222-222222222222',1),
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','33333333-3333-4333-8333-333333333333',2),
('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','44444444-4444-4444-8444-444444444444',0),
('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','33333333-3333-4333-8333-333333333333',1),
('cccccccc-cccc-4ccc-8ccc-cccccccccccc','55555555-5555-4555-8555-555555555555',0),
('cccccccc-cccc-4ccc-8ccc-cccccccccccc','66666666-6666-4666-8666-666666666666',1) on conflict(live_session_id,product_id) do nothing;

-- Seed products are examples even when a local test database is configured.
update public.products set is_demo=true where id in ('11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222','33333333-3333-4333-8333-333333333333','44444444-4444-4444-8444-444444444444','55555555-5555-4555-8555-555555555555','66666666-6666-4666-8666-666666666666');
