#!/bin/bash
echo "Running migration to add refund fields..."
NODE_ENV=development tsx migrations/add-refund-fields.ts