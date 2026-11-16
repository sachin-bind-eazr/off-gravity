-- CreateEnum
CREATE TYPE "TicketVisibility" AS ENUM ('HIDDEN', 'PREVIEW');

-- AlterTable
ALTER TABLE "TicketType" ADD COLUMN "visibility" "TicketVisibility" NOT NULL DEFAULT 'HIDDEN',
ADD COLUMN "limited" BOOLEAN NOT NULL DEFAULT false;

-- Data: previously shown tiers, and every seeded "Ways in" tier (tierKey set), become PREVIEW for all cities.
UPDATE "TicketType" SET "visibility" = 'PREVIEW' WHERE "showOnHomepage" = true OR "tierKey" IS NOT NULL;
-- Glow Night pass is the only tier that is limited by default.
UPDATE "TicketType" SET "limited" = true WHERE "tierKey" = 'glow';
-- Solo runner is the default "Most popular" tier where no admin choice exists yet.
UPDATE "TicketType" t SET "mostPicked" = true WHERE t."tierKey" = 'solo'
  AND NOT EXISTS (SELECT 1 FROM "TicketType" o WHERE o."eventId" = t."eventId" AND o."mostPicked" = true);

-- AlterTable
ALTER TABLE "TicketType" DROP COLUMN "showOnHomepage";
