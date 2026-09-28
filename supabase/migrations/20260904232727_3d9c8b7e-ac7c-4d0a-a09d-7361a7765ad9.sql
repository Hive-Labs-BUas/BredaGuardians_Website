ALTER TABLE public.orders ADD COLUMN receipt_url text;

COMMENT ON COLUMN public.orders.receipt_url IS 'Stripe receipt URL, populated from checkout.session.completed webhook.';