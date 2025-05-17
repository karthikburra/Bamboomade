-- Add event end date & timings
ALTER TABLE ai_knowledge_content ADD COLUMN IF NOT EXISTS event_end_date TEXT;
ALTER TABLE ai_knowledge_content ADD COLUMN IF NOT EXISTS event_timings TEXT;

-- Add price information 
ALTER TABLE ai_knowledge_content ADD COLUMN IF NOT EXISTS price TEXT;
ALTER TABLE ai_knowledge_content ADD COLUMN IF NOT EXISTS currency TEXT;
ALTER TABLE ai_knowledge_content ADD COLUMN IF NOT EXISTS price_range TEXT;
ALTER TABLE ai_knowledge_content ADD COLUMN IF NOT EXISTS discount_price TEXT;
