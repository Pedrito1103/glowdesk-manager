
-- ============ ENUM ROLES ============
CREATE TYPE public.app_role AS ENUM ('admin', 'mantenimiento', 'transporte');

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL DEFAULT '',
  apellido TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  estado TEXT NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo','inactivo')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============ USER_ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ============ has_role security definer ============
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  );
$$;

-- ============ ACCIONES ============
CREATE TABLE public.acciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.acciones ENABLE ROW LEVEL SECURITY;

-- ============ PERMISOS (rol-accion) ============
CREATE TABLE public.permisos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role public.app_role NOT NULL,
  accion_id UUID NOT NULL REFERENCES public.acciones(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (role, accion_id)
);
ALTER TABLE public.permisos ENABLE ROW LEVEL SECURITY;

-- ============ AREAS ============
CREATE TABLE public.areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL UNIQUE,
  descripcion TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;

-- ============ ASIGNACIONES ============
CREATE TABLE public.asignaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  area_id UUID NOT NULL REFERENCES public.areas(id) ON DELETE CASCADE,
  role public.app_role,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, area_id)
);
ALTER TABLE public.asignaciones ENABLE ROW LEVEL SECURITY;

-- ============ CATEGORIAS ============
CREATE TABLE public.categorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL UNIQUE,
  descripcion TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;

-- ============ ESTADOS ============
CREATE TABLE public.estados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL UNIQUE,
  orden INT NOT NULL DEFAULT 0,
  color TEXT DEFAULT '#9e9e9e',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.estados ENABLE ROW LEVEL SECURITY;

-- ============ PROBLEMAS ============
CREATE TABLE public.problemas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  descripcion TEXT NOT NULL,
  categoria_id UUID REFERENCES public.categorias(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.problemas ENABLE ROW LEVEL SECURITY;

-- ============ MANTENIMIENTOS ============
CREATE TABLE public.mantenimientos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL DEFAULT 'preventivo' CHECK (tipo IN ('preventivo','correctivo')),
  estado_id UUID REFERENCES public.estados(id) ON DELETE SET NULL,
  fecha_inicio DATE,
  fecha_fin DATE,
  descripcion TEXT,
  responsable_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  problema_id UUID REFERENCES public.problemas(id) ON DELETE SET NULL,
  area_id UUID REFERENCES public.areas(id) ON DELETE SET NULL,
  categoria_id UUID REFERENCES public.categorias(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.mantenimientos ENABLE ROW LEVEL SECURITY;

-- ============ SOLUCIONES ============
CREATE TABLE public.soluciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mantenimiento_id UUID REFERENCES public.mantenimientos(id) ON DELETE CASCADE,
  problema_id UUID REFERENCES public.problemas(id) ON DELETE SET NULL,
  descripcion TEXT NOT NULL,
  responsable_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  fecha_inicio DATE,
  fecha_fin DATE,
  evidencia_url TEXT,
  implementada BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.soluciones ENABLE ROW LEVEL SECURITY;

-- ============ POLICIES ============
-- profiles
CREATE POLICY "profiles_select_all_auth" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update_self_or_admin" ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "profiles_insert_self" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_delete_admin" ON public.profiles FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- user_roles
CREATE POLICY "user_roles_select_auth" ON public.user_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "user_roles_admin_all" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- helpers for catalogs: read all auth, write admin
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['acciones','permisos','areas','asignaciones','categorias','estados']
  LOOP
    EXECUTE format('CREATE POLICY "%I_select_auth" ON public.%I FOR SELECT TO authenticated USING (true);', t, t);
    EXECUTE format('CREATE POLICY "%I_admin_write" ON public.%I FOR ALL TO authenticated USING (public.has_role(auth.uid(),''admin'')) WITH CHECK (public.has_role(auth.uid(),''admin''));', t, t);
  END LOOP;
END $$;

-- problemas, mantenimientos, soluciones: read all, write admin/mantenimiento
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['problemas','mantenimientos','soluciones']
  LOOP
    EXECUTE format('CREATE POLICY "%I_select_auth" ON public.%I FOR SELECT TO authenticated USING (true);', t, t);
    EXECUTE format('CREATE POLICY "%I_mant_write" ON public.%I FOR ALL TO authenticated USING (public.has_role(auth.uid(),''admin'') OR public.has_role(auth.uid(),''mantenimiento'')) WITH CHECK (public.has_role(auth.uid(),''admin'') OR public.has_role(auth.uid(),''mantenimiento''));', t, t);
  END LOOP;
END $$;

-- ============ updated_at trigger ============
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER profiles_set_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER areas_set_updated BEFORE UPDATE ON public.areas FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER mant_set_updated BEFORE UPDATE ON public.mantenimientos FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER sol_set_updated BEFORE UPDATE ON public.soluciones FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============ handle_new_user trigger ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_count INT;
  default_role public.app_role;
BEGIN
  INSERT INTO public.profiles (id, email, nombre, apellido)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nombre',''),
    COALESCE(NEW.raw_user_meta_data->>'apellido','')
  );

  SELECT COUNT(*) INTO user_count FROM public.user_roles;
  IF user_count = 0 THEN
    default_role := 'admin';
  ELSE
    default_role := 'mantenimiento';
  END IF;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, default_role);
  RETURN NEW;
END $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ STORAGE bucket ============
INSERT INTO storage.buckets (id, name, public) VALUES ('evidencias','evidencias', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "evidencias_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'evidencias');
CREATE POLICY "evidencias_auth_upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'evidencias');
CREATE POLICY "evidencias_auth_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'evidencias');
CREATE POLICY "evidencias_auth_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'evidencias');
