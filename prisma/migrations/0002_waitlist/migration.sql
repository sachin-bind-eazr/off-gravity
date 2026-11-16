-- AlterEnum
ALTER TYPE "EventStatus" ADD VALUE 'WAITLIST_OPEN' BEFORE 'SALES_OPEN';

-- CreateTable
CREATE TABLE "WaitlistEntry" (
    "id" SERIAL NOT NULL,
    "eventId" INTEGER NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "whatsappNumber" TEXT,
    "consent" BOOLEAN NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'site',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WaitlistEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WaitlistEntry_eventId_idx" ON "WaitlistEntry"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "WaitlistEntry_eventId_email_key" ON "WaitlistEntry"("eventId", "email");

-- AddForeignKey
ALTER TABLE "WaitlistEntry" ADD CONSTRAINT "WaitlistEntry_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
