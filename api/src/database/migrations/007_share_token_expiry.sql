-- Add share token expiry for session-scoped access
ALTER TABLE documents ADD COLUMN IF NOT EXISTS share_token_expires_at TIMESTAMP;

-- Index for efficient expiry checks
CREATE INDEX IF NOT EXISTS idx_documents_share_token_expiry 
ON documents(share_token, share_token_expires_at) 
WHERE is_public = TRUE AND share_token IS NOT NULL;
