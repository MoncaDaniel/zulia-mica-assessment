-- Adds opt-in public listing so an "already assessed?" search can be exposed
-- to unauthenticated visitors without leaking confidential client work by
-- default. Existing rows default to false (private) — nothing already in
-- the DB becomes publicly visible from this migration alone; a REVIEWER or
-- ADMIN must explicitly flip it per-assessment via the /registry route.

-- AlterTable
ALTER TABLE "Assessment" ADD COLUMN "listedPublicly" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Assessment_tokenName_idx" ON "Assessment"("tokenName");

-- CreateIndex
CREATE INDEX "Assessment_ticker_idx" ON "Assessment"("ticker");

-- CreateIndex
CREATE INDEX "Assessment_listedPublicly_status_idx" ON "Assessment"("listedPublicly", "status");
