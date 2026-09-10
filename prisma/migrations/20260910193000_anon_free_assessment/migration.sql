-- AlterTable
ALTER TABLE "LeadRequest" ADD COLUMN     "grantedAt" TIMESTAMP(3),
ADD COLUMN     "ipHash" TEXT,
ADD COLUMN     "note" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'NEW',
ALTER COLUMN "phone" DROP NOT NULL;

-- CreateTable
CREATE TABLE "AnonRun" (
    "id" TEXT NOT NULL,
    "ipHash" TEXT NOT NULL,
    "runs" INTEGER NOT NULL DEFAULT 0,
    "lastAssessmentId" TEXT,
    "firstRunAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastRunAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnonRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RunGrant" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "note" TEXT,
    "usedAt" TIMESTAMP(3),
    "usedIpHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RunGrant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AnonRun_ipHash_key" ON "AnonRun"("ipHash");

-- CreateIndex
CREATE UNIQUE INDEX "RunGrant_token_key" ON "RunGrant"("token");

-- CreateIndex
CREATE INDEX "RunGrant_email_idx" ON "RunGrant"("email");

-- CreateIndex
CREATE INDEX "LeadRequest_email_idx" ON "LeadRequest"("email");

-- CreateIndex
CREATE INDEX "LeadRequest_ipHash_idx" ON "LeadRequest"("ipHash");

-- CreateIndex
CREATE INDEX "LeadRequest_status_createdAt_idx" ON "LeadRequest"("status", "createdAt");

