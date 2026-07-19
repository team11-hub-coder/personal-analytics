-- Allow chat_id to be nullable (used as placeholder before user messages bot)
-- The unique constraint still works: multiple NULLs are allowed in Postgres

ALTER TABLE telegram_links ALTER COLUMN chat_id DROP NOT NULL;
ALTER TABLE telegram_links ALTER COLUMN chat_id SET DEFAULT NULL;
