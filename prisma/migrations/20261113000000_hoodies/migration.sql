-- Data: the "Qodiriy | Qish" hoodies go on sale (owner's decision 2026-11-13: 350 000 so'm, in stock).
-- Category "Xudilar" + two products; photos are the brand shoot (public/photos/jd). Idempotent:
-- skipped when the slugs already exist (e.g. created by hand in the admin).
DO $$
DECLARE
  cat TEXT;
BEGIN
  SELECT id INTO cat FROM "Category" WHERE slug = 'xudilar';
  IF cat IS NULL THEN
    cat := 'cat_xudilar_qish';
    INSERT INTO "Category" (id, slug, "nameUz", "nameRu", "descriptionUz", "descriptionRu", "sortOrder", "isVisible", "createdAt", "updatedAt")
    VALUES (cat, 'xudilar', 'Xudilar', 'Худи',
      'Qodiriy | Qish — Abdulla Qodiriy xotirasiga bag''ishlangan qishki kolleksiya.',
      'Qodiriy | Qish — зимняя коллекция в память об Абдулле Кадыри.', 2, true, now(), now());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM "Product" WHERE slug = 'men-osha-xudi') THEN
    INSERT INTO "Product" (id, slug, "nameUz", "nameRu", "descriptionUz", "descriptionRu", "categoryId", fit, price,
      "compositionUz", "compositionRu", "careUz", "careRu", "isNew", "isBestseller", "isFeatured", "isHidden", "sortOrder", "createdAt", "updatedAt")
    VALUES ('prod_men_osha_xudi', 'men-osha-xudi', 'Xudi "Men o''sha"', 'Худи «Men o''sha»',
      'Oldida — «Men o''sha» —Jadeeed. Orqasida — Abdulla Qodiriy naqshi: to''rtta buta va ustozning hayot sanalari. Keng bichim, issiq ichki tukli mato.',
      'Спереди — «Men o''sha» —Jadeeed. На спине — орнамент «Abdulla Qodiriy»: четыре буты и даты жизни мастера. Свободный крой, тёплая ткань с начёсом.',
      cat, 'OVERSIZE', 350000, '', '', '30 °C da teskari tomonidan yuving, bosmani dazmollamang.', 'Стирать при 30 °C наизнанку, принт не гладить.',
      true, false, true, false, 0, now(), now());

    INSERT INTO "ProductColor" (id, "productId", "nameUz", "nameRu", hex, "sortOrder") VALUES
      ('col_men_osha_xudi_black', 'prod_men_osha_xudi', 'Qora', 'Чёрная', '#1C1A1B', 0),
      ('col_men_osha_xudi_ash', 'prod_men_osha_xudi', 'Kulrang', 'Пепельная', '#D3D1CC', 1);

    INSERT INTO "ProductImage" (id, "colorId", url, position) VALUES
      ('img_mox_b0', 'col_men_osha_xudi_black', '/photos/jd/qish-black-front.webp', 0),
      ('img_mox_b1', 'col_men_osha_xudi_black', '/photos/jd/qish-black-back.webp', 1),
      ('img_mox_b2', 'col_men_osha_xudi_black', '/photos/jd/hero-men-osha.webp', 2),
      ('img_mox_b3', 'col_men_osha_xudi_black', '/photos/jd/look-column.webp', 3),
      ('img_mox_a0', 'col_men_osha_xudi_ash', '/photos/jd/qish-ash-front.webp', 0),
      ('img_mox_a1', 'col_men_osha_xudi_ash', '/photos/jd/qish-ash-back.webp', 1),
      ('img_mox_a2', 'col_men_osha_xudi_ash', '/photos/jd/qish-ash-brick.webp', 2),
      ('img_mox_a3', 'col_men_osha_xudi_ash', '/photos/jd/qish-ash-suzani.webp', 3);

    INSERT INTO "Stock" (id, "colorId", size, quantity)
    SELECT 'stk_mox_' || c.k || '_' || s.size, c.id, s.size::"Size", 5
    FROM (VALUES ('b', 'col_men_osha_xudi_black'), ('a', 'col_men_osha_xudi_ash')) AS c(k, id)
    CROSS JOIN (VALUES ('S'), ('M'), ('L'), ('XL'), ('XXL')) AS s(size);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM "Product" WHERE slug = 'siz-oshami-xudi') THEN
    INSERT INTO "Product" (id, slug, "nameUz", "nameRu", "descriptionUz", "descriptionRu", "categoryId", fit, price,
      "compositionUz", "compositionRu", "careUz", "careRu", "isNew", "isBestseller", "isFeatured", "isHidden", "sortOrder", "createdAt", "updatedAt")
    VALUES ('prod_siz_oshami_xudi', 'siz-oshami-xudi', 'Xudi "Siz o''shami?"', 'Худи «Siz o''shami?»',
      'Oldida — «Siz o''shami?» —Jadeeed, «Men o''sha»ga savol. Orqasida — Abdulla Qodiriy naqshi. Keng bichim, issiq ichki tukli mato.',
      'Спереди — «Siz o''shami?» —Jadeeed, вопрос к «Men o''sha». На спине — орнамент «Abdulla Qodiriy». Свободный крой, тёплая ткань с начёсом.',
      cat, 'OVERSIZE', 350000, '', '', '30 °C da teskari tomonidan yuving, bosmani dazmollamang.', 'Стирать при 30 °C наизнанку, принт не гладить.',
      true, false, true, false, 1, now(), now());

    INSERT INTO "ProductColor" (id, "productId", "nameUz", "nameRu", hex, "sortOrder") VALUES
      ('col_siz_oshami_xudi_ash', 'prod_siz_oshami_xudi', 'Kulrang', 'Пепельная', '#D3D1CC', 0);

    INSERT INTO "ProductImage" (id, "colorId", url, position) VALUES
      ('img_sox_a0', 'col_siz_oshami_xudi_ash', '/photos/jd/siz-oshami-front.webp', 0),
      ('img_sox_a1', 'col_siz_oshami_xudi_ash', '/photos/jd/qish-ash-back.webp', 1),
      ('img_sox_a2', 'col_siz_oshami_xudi_ash', '/photos/jd/siz-oshami-column.webp', 2),
      ('img_sox_a3', 'col_siz_oshami_xudi_ash', '/photos/jd/look-ceiling.webp', 3);

    INSERT INTO "Stock" (id, "colorId", size, quantity)
    SELECT 'stk_sox_a_' || s.size, 'col_siz_oshami_xudi_ash', s.size::"Size", 5
    FROM (VALUES ('S'), ('M'), ('L'), ('XL'), ('XXL')) AS s(size);
  END IF;
END $$;
