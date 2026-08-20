-- Persists the CoinGecko market-data snapshot fetched during analysis
-- (CoinFinancials shape). Informational only — never an input to the
-- whitepaper-disclosure score. Nullable, additive-only.

ALTER TABLE "Assessment" ADD COLUMN "aiFinancials" JSONB;
