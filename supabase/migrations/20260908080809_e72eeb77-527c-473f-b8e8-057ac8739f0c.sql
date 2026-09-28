CREATE TABLE public.shop_vouchers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL,
  description text NOT NULL DEFAULT '',
  kind text NOT NULL DEFAULT 'percent' CHECK (kind IN ('percent','fixed')),
  value integer NOT NULL DEFAULT 0,
  min_spend_cents integer NOT NULL DEFAULT 0,
  applies_to text NOT NULL DEFAULT 'all' CHECK (applies_to IN ('all','membership','apparel','accessories')),
  expires_at date,
  max_uses integer,
  uses integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX shop_vouchers_code_key ON public.shop_vouchers (upper(code));

GRANT SELECT ON public.shop_vouchers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shop_vouchers TO authenticated;
GRANT ALL ON public.shop_vouchers TO service_role;

ALTER TABLE public.shop_vouchers ENABLE ROW LEVEL SECURITY;

CREATE POLICY shop_vouchers_anon_read ON public.shop_vouchers FOR SELECT TO anon USING (active);
CREATE POLICY shop_vouchers_auth_read ON public.shop_vouchers FOR SELECT TO authenticated USING (active OR private.is_staff(auth.uid()));
CREATE POLICY shop_vouchers_staff_insert ON public.shop_vouchers FOR INSERT TO authenticated WITH CHECK (private.is_staff(auth.uid()));
CREATE POLICY shop_vouchers_staff_update ON public.shop_vouchers FOR UPDATE TO authenticated USING (private.is_staff(auth.uid())) WITH CHECK (private.is_staff(auth.uid()));
CREATE POLICY shop_vouchers_admin_delete ON public.shop_vouchers FOR DELETE TO authenticated USING (private.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER shop_vouchers_touch BEFORE UPDATE ON public.shop_vouchers FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.shop_requests
  ADD COLUMN voucher_code text,
  ADD COLUMN discount_cents integer NOT NULL DEFAULT 0;

ALTER TABLE public.memberships
  ADD COLUMN voucher_code text,
  ADD COLUMN discount_cents integer NOT NULL DEFAULT 0;
