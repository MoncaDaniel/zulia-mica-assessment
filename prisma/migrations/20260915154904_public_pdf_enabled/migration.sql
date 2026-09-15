-- Second, separate opt-in for making a registry-listed assessment's full
-- PDF report publicly downloadable. Not implied by listedPublicly — see
-- the field comment in schema.prisma.
ALTER TABLE "Assessment" ADD COLUMN "publicPdfEnabled" BOOLEAN NOT NULL DEFAULT false;
