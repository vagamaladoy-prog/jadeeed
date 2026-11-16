-- Data: Uzbek texts move to the new Latin alphabet (law of 21.10.2026): Oʻ→Ö, Gʻ→Ğ, Sh→Ş, Ch→Ç.
-- Same rules as scripts/uz-new-alphabet.mjs. Brand phrases stay exactly as printed on the clothes.
-- Only the shop's own Uzbek texts change; order history and brand phrases are left untouched.
CREATE FUNCTION pg_temp.uz_new(s TEXT) RETURNS TEXT LANGUAGE plpgsql AS $fn$
DECLARE
  brands TEXT[] := ARRAY['Men o''sha', 'Siz o''shami', 'Aylanib ketay', 'Ko''z tegmasin', 'Qodiriy | Qish'];
  i INT;
BEGIN
  IF s IS NULL OR s = '' THEN RETURN s; END IF;
  -- every apostrophe variant after o/g becomes a plain one first
  s := regexp_replace(s, '([oOgG])[ʻ‘’`]', '\1''', 'g');
  FOR i IN 1 .. array_length(brands, 1) LOOP
    s := regexp_replace(s, replace(replace(brands[i], '|', '\|'), '?', '\?'), chr(1) || i || chr(2), 'gi');
  END LOOP;
  s := replace(s, 'O''', 'Ö');
  s := replace(s, 'o''', 'ö');
  s := replace(s, 'G''', 'Ğ');
  s := replace(s, 'g''', 'ğ');
  s := replace(s, 'SH', 'Ş');
  s := replace(s, 'Sh', 'Ş');
  s := replace(s, 'sh', 'ş');
  s := replace(s, 'CH', 'Ç');
  s := replace(s, 'Ch', 'Ç');
  s := replace(s, 'ch', 'ç');
  FOR i IN 1 .. array_length(brands, 1) LOOP
    s := replace(s, chr(1) || i || chr(2), brands[i]);
  END LOOP;
  RETURN s;
END
$fn$;

UPDATE "Category" SET "nameUz" = pg_temp.uz_new("nameUz"), "descriptionUz" = pg_temp.uz_new("descriptionUz");
UPDATE "SizeChart" SET "noteUz" = pg_temp.uz_new("noteUz");
UPDATE "Product" SET "nameUz" = pg_temp.uz_new("nameUz"), "descriptionUz" = pg_temp.uz_new("descriptionUz"),
  "compositionUz" = pg_temp.uz_new("compositionUz"), "careUz" = pg_temp.uz_new("careUz");
UPDATE "ProductColor" SET "nameUz" = pg_temp.uz_new("nameUz");
UPDATE "Settings" SET "addressUz" = pg_temp.uz_new("addressUz"), "workHoursUz" = pg_temp.uz_new("workHoursUz"),
  "aboutUz" = pg_temp.uz_new("aboutUz"), "deliveryUz" = pg_temp.uz_new("deliveryUz"),
  "preorderNoteUz" = pg_temp.uz_new("preorderNoteUz");
