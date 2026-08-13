UPDATE public.categories SET image_url = v.img FROM (VALUES
 ('silk-sarees','/images/silk-1.jpg'),('cotton-sarees','/images/cotton-1.jpg'),
 ('salwar-sets','/images/salwar-1.jpg'),('kurtis','/images/kurti-1.jpg'),
 ('dhotis-shirts','/images/men-1.jpg'),('kids-wear','/images/kids-1.jpg')
) AS v(slug,img) WHERE public.categories.slug = v.slug;

UPDATE public.products SET image_url = v.img FROM (VALUES
 ('kanchipuram-pure-silk-saree','/images/silk-1.jpg'),
 ('soft-silk-temple-border-saree','/images/silk-2.jpg'),
 ('bridal-zari-silk-saree','/images/silk-2.jpg'),
 ('mysore-crepe-silk-saree','/images/silk-1.jpg'),
 ('handloom-cotton-saree','/images/cotton-1.jpg'),
 ('chettinad-cotton-saree','/images/cotton-2.jpg'),
 ('kalamkari-print-cotton-saree','/images/cotton-2.jpg'),
 ('linen-blend-daily-saree','/images/cotton-1.jpg'),
 ('embroidered-anarkali-set','/images/salwar-1.jpg'),
 ('unstitched-cotton-salwar-material','/images/salwar-2.jpg'),
 ('silk-blend-palazzo-set','/images/salwar-1.jpg'),
 ('printed-a-line-kurti','/images/kurti-1.jpg'),
 ('chikankari-straight-kurti','/images/kurti-2.jpg'),
 ('festive-silk-kurti','/images/kurti-1.jpg'),
 ('pure-cotton-dhoti-angavastram','/images/men-1.jpg'),
 ('formal-cotton-shirt','/images/men-2.jpg'),
 ('girls-pattu-pavadai','/images/kids-1.jpg'),
 ('boys-silk-kurta-set','/images/kids-2.jpg')
) AS v(slug,img) WHERE public.products.slug = v.slug;