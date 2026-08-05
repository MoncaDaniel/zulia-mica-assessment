-- This migration targets the *actual* deployed DB state, which already has
-- "pdfPath"/"pdfName" columns on "Assessment" from the init migration even
-- though committed schema.prisma stopped declaring them at some point
-- (pre-existing schema/migration drift, not introduced by this change).
--
-- pdfPath is dropped in favor of DB-stored bytes (local disk doesn't survive
-- Vercel's ephemeral filesystem). pdfName is left as-is. pdfSourceUrl is new,
-- set only when a whitepaper was ingested via URL fetch instead of upload.

-- AlterTable
ALTER TABLE "Assessment" DROP COLUMN "pdfPath";
ALTER TABLE "Assessment" ADD COLUMN "pdfSourceUrl" TEXT;

-- CreateTable
CREATE TABLE "AssessmentPdf" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssessmentPdf_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentPdf_assessmentId_key" ON "AssessmentPdf"("assessmentId");

-- AddForeignKey
ALTER TABLE "AssessmentPdf" ADD CONSTRAINT "AssessmentPdf_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
