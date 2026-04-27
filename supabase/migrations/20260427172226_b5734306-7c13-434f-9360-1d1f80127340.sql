
-- 1. set search_path on tg_set_updated_at
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

-- 2. restrict public bucket listing - drop broad SELECT, add scoped one
DROP POLICY IF EXISTS "evidencias_public_read" ON storage.objects;
CREATE POLICY "evidencias_auth_read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'evidencias');

-- 3. revoke EXECUTE on security definer functions from public/anon
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_set_updated_at() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
