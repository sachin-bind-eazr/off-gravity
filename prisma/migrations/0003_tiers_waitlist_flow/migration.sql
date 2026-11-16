-- CreateEnum
CREATE TYPE "WaitlistTier" AS ENUM ('SOLO', 'SQUAD', 'GLOW', 'FAMILY', 'UNDECIDED');

-- AlterTable: TicketType homepage tier presentation
ALTER TABLE "TicketType" ADD COLUMN "tierKey" TEXT,
ADD COLUMN "hook" TEXT,
ADD COLUMN "perks" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "stubColour" TEXT,
ADD COLUMN "showOnHomepage" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "mostPicked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- AlterTable: WaitlistEntry (reference is added nullable, backfilled for existing rows, then made required)
ALTER TABLE "WaitlistEntry" ADD COLUMN "tierInterest" "WaitlistTier" NOT NULL DEFAULT 'UNDECIDED',
ADD COLUMN "partySize" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "whatsappOptIn" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "reference" TEXT;

UPDATE "WaitlistEntry" w
SET "reference" = 'WL-' || e."cityCode" || '-' || upper(translate(substr(md5(w."id"::text || 'og'), 1, 5), '01', '23'))
FROM "Event" e WHERE e."id" = w."eventId";

ALTER TABLE "WaitlistEntry" ALTER COLUMN "reference" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "WaitlistEntry_reference_key" ON "WaitlistEntry"("reference");
