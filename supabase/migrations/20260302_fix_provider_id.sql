-- Make provider_id nullable so affiliate links can be created without it
ALTER TABLE affiliate_links ALTER COLUMN provider_id DROP NOT NULL;
