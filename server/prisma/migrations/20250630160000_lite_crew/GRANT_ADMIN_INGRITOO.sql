-- Optional: also persist Pro in DB for @ingritoo (code bypass works without this)
UPDATE users
SET is_pro = true, pro_until = NULL, lite_crew_until = '2099-12-31'::timestamptz
WHERE lower(username) = 'ingritoo';
