-- Add income/expense type to transactions table
-- All existing rows default to 'expense' (the table was originally expenses-only)

ALTER TABLE transactions
  ADD COLUMN type text NOT NULL DEFAULT 'expense'
  CHECK (type IN ('income', 'expense'));

-- Update the entry_source check to include the new type column in the comment
COMMENT ON COLUMN transactions.type IS 'income or expense — distinguishes money in vs money out';
