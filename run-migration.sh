#!/bin/bash

# Create the SQL file for the deleted_users table
cat > create_deleted_users.sql << 'EOL'
CREATE TABLE IF NOT EXISTS "deleted_users" (
  "id" SERIAL PRIMARY KEY,
  "originalUserId" INTEGER NOT NULL,
  "username" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "fullName" TEXT,
  "profileImageUrl" TEXT,
  "phoneNumber" TEXT,
  "role" TEXT NOT NULL,
  "isVerified" BOOLEAN NOT NULL,
  "tokens" INTEGER NOT NULL,
  "deletedAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "scheduledForDeletion" TIMESTAMP NOT NULL,
  "deletedBy" INTEGER,
  "deletionReason" TEXT
);
EOL

# Run the SQL file
echo "Creating deleted_users table..."
PGPASSWORD=$PGPASSWORD psql -h $PGHOST -U $PGUSER -d $PGDATABASE -f create_deleted_users.sql

# Cleanup
rm create_deleted_users.sql

echo "Migration completed successfully!"