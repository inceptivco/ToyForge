-- Figma Plugin Auth Codes Table
-- This table stores temporary auth tokens for the Figma plugin to retrieve
-- after the user completes magic link authentication in the browser.
--
-- SECURITY: Direct table access is restricted. Use the get_figma_auth_tokens()
-- function to retrieve tokens by code, which prevents bulk token exfiltration.

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

-- Policy: Allow inserting auth codes for authenticated users only
CREATE POLICY "Users can insert their own auth codes"
    ON public.figma_auth_codes
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Only the owning user can read their own auth codes directly
-- This prevents bulk exfiltration while still allowing the secure function to work
CREATE POLICY "Users can read their own auth codes"
    ON public.figma_auth_codes
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Only the owning user can update their auth codes
CREATE POLICY "Users can update their own auth codes"
    ON public.figma_auth_codes
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Secure function to retrieve auth tokens by code
-- This is the ONLY way for the plugin to get tokens - requires knowing the exact code
-- The function runs with SECURITY DEFINER to bypass RLS, but only returns data for
-- the specific code provided, preventing bulk access
CREATE OR REPLACE FUNCTION public.get_figma_auth_tokens(p_code varchar(10))
RETURNS TABLE (
    access_token text,
    refresh_token text
)
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Only return tokens for:
    -- 1. Exact code match
    -- 2. Not expired
    -- 3. Not already used
    RETURN QUERY
    SELECT
        fac.access_token,
        fac.refresh_token
    FROM public.figma_auth_codes fac
    WHERE fac.code = p_code
      AND fac.expires_at > now()
      AND fac.used = false
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to mark a code as used (also requires knowing the exact code)
CREATE OR REPLACE FUNCTION public.mark_figma_auth_code_used(p_code varchar(10))
RETURNS boolean
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    rows_updated integer;
BEGIN
    UPDATE public.figma_auth_codes
    SET used = true
    WHERE code = p_code
      AND used = false;

    GET DIAGNOSTICS rows_updated = ROW_COUNT;
    RETURN rows_updated > 0;
END;
$$ LANGUAGE plpgsql;

-- Cleanup function to remove expired codes
CREATE OR REPLACE FUNCTION public.cleanup_expired_figma_auth_codes()
RETURNS void AS $$
BEGIN
    DELETE FROM public.figma_auth_codes
    WHERE expires_at < now()
       OR (used = true AND created_at < now() - interval '1 hour');
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions on the functions to anonymous and authenticated users
GRANT EXECUTE ON FUNCTION public.get_figma_auth_tokens(varchar) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mark_figma_auth_code_used(varchar) TO anon, authenticated;

-- Comment explaining the table purpose and security model
COMMENT ON TABLE public.figma_auth_codes IS 'Temporary storage for Figma plugin authentication tokens. Codes expire after 10 minutes. Direct table access is restricted - use get_figma_auth_tokens() function.';
COMMENT ON FUNCTION public.get_figma_auth_tokens IS 'Securely retrieves auth tokens for a specific code. Requires knowing the exact 6-character code.';
