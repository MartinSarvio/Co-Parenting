-- Seed affiliate_links med de 4 default sponsors der tidligere var hardcoded
INSERT INTO affiliate_links (name, affiliate_url, store, category, banner_image, banner_position_y, enabled)
VALUES
  ('Bulk', 'https://www.awin1.com/cread.php?s=2784306&v=18540&q=403732&r=900803', 'Bulk', 'Kosttilskud', 'https://www.awin1.com/cshow.php?s=2784306&v=18540&q=403732&r=900803', 50, true),
  ('Nelly', 'https://www.awin1.com/cread.php?s=4696224&v=19564&q=589370&r=900803', 'Nelly', 'Mode', 'https://www.awin1.com/cshow.php?s=4696224&v=19564&q=589370&r=900803', 50, true),
  ('Myprotein', 'https://www.awin1.com/cread.php?s=3487002&v=8983&q=349344&r=900803', 'Myprotein', 'Kosttilskud', 'https://www.awin1.com/cshow.php?s=3487002&v=8983&q=349344&r=900803', 50, true),
  ('Myprotein', 'https://www.awin1.com/cread.php?s=4680362&v=8983&q=596085&r=900803', 'Myprotein', 'Kosttilskud', 'https://www.awin1.com/cshow.php?s=4680362&v=8983&q=596085&r=900803', 50, true);
