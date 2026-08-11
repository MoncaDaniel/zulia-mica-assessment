-- Standalone table for the public registry's "request an assessment" form
-- (email + phone, no auth). No foreign keys — the token asked about may not
-- have a matching Assessment row.

-- CreateTable
CREATE TABLE "LeadRequest" (
    "id" TEXT NOT NULL,
    "tokenName" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadRequest_pkey" PRIMARY KEY ("id")
);
