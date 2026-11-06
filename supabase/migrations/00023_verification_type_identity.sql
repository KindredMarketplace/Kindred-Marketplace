-- 00023 — Kindred Standard needs an explicit ID-verification record.
-- (Enum values must be committed before any function can reference them,
-- so this lives in its own migration ahead of 00024.)
alter type public.verification_type add value if not exists 'identity';
