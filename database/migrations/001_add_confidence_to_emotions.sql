-- Migration: Add confidence column to emotions table
-- Description: Adds confidence level tracking for emotion detection

ALTER TABLE emotions ADD COLUMN IF NOT EXISTS confidence DECIMAL(3,2) DEFAULT 0.00;

-- Update existing records to have default confidence
UPDATE emotions SET confidence = 0.50 WHERE confidence IS NULL;

COMMENT ON COLUMN emotions.confidence IS 'Confidence level of emotion detection (0.00-1.00)';