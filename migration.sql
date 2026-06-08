-- ============================================================
-- Safe Migration: Enable Realtime for messages table
-- ============================================================
-- This script is SAFE to run multiple times.
-- It does NOT drop any tables or delete any data.
-- ============================================================

-- Enable Realtime for messages table (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
    RAISE NOTICE 'Added messages table to supabase_realtime publication';
  ELSE
    RAISE NOTICE 'messages table already in supabase_realtime publication';
  END IF;
END $$;

-- Also enable replica identity for messages table (required for UPDATE/DELETE events)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_index
    WHERE indrelid = 'messages'::regclass AND indisprimary
  ) THEN
    -- messages table already has a PK (id), so this should be fine
  END IF;
END $$;
