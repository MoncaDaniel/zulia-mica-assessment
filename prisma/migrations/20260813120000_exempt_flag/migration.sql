-- New ComplianceFlag value for assets with no identifiable issuer/offeror
-- (Art. 4(3) / Recital 22 exemption) — distinct from PASS/REVIEW/FAIL since
-- no whitepaper-disclosure obligation ever attached, so none of those three
-- verdicts is accurate. Additive only — existing rows are untouched.

ALTER TYPE "ComplianceFlag" ADD VALUE IF NOT EXISTS 'EXEMPT';
