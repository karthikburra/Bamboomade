-- Add payment_status column if it doesn't exist
ALTER TABLE project_guidance_sessions 
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'Pending';

-- Update existing records with confirmed payments
UPDATE project_guidance_sessions 
SET payment_status = 'Paid' 
WHERE payment_confirmed = true AND payment_id IS NOT NULL;