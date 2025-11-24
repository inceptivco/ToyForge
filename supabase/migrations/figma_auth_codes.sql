-- Figma Plugin Auth Codes Table
-- This table stores temporary auth tokens for the Figma plugin to retrieve
-- after the user completes magic link authentication in the browser.

CREATE TABLE IF NOT EXISTS public.figma_auth_codes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    code varchar(10) UNIQUE NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    access_token text NOT NULL,
    refresh_token text NOT NULL,
    expires_at timestamptz NOT NULL DEFAULT (now() + interval '10 minutes'),
    used boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- Index for efficient lookup by code
CREATE INDEX IF NOT EXISTS idx_figma_auth_codes_code ON public.figma_auth_codes(code);

-- Index for cleanup of expired codes
CREATE INDEX IF NOT EXISTS idx_figma_auth_codes_expires_at ON public.figma_auth_codes(expires_at);

-- Enable Row Level Security
ALTER TABLE public.figma_auth_codes ENABLE ROW LEVEL SECURITY;

-- Policy: Allow inserting auth codes for authenticated users
CREATE POLICY "Users can insert their own auth codes"
    ON public.figma_auth_codes
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Allow reading auth codes by code (for plugin polling)
-- This allows anonymous access since the plugin needs to poll before auth is complete
CREATE POLICY "Anyone can read auth codes by code"
    ON public.figma_auth_codes
    FOR SELECT
    USING (true);

-- Policy: Allow updating auth codes (marking as used)
CREATE POLICY "Anyone can mark codes as used"
    ON public.figma_auth_codes
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Cleanup function to remove expired codes
CREATE OR REPLACE FUNCTION cleanup_expired_figma_auth_codes()
RETURNS void AS $$
BEGIN
    DELETE FROM public.figma_auth_codes
    WHERE expires_at < now() OR (used = true AND created_at < now() - interval '1 hour');
END;
$$ LANGUAGE plpgsql;

-- Comment explaining the table purpose
COMMENT ON TABLE public.figma_auth_codes IS 'Temporary storage for Figma plugin authentication tokens. Codes expire after 10 minutes.';
