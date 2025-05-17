-- Chat folders table
CREATE TABLE IF NOT EXISTS chat_folders (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_by INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Add folder_id column to chat_messages table
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS folder_id INTEGER REFERENCES chat_folders(id);

-- Create index on folder_id for better query performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_folder_id ON chat_messages(folder_id);
