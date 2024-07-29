-- DropForeignKey
ALTER TABLE "Incident" DROP CONSTRAINT "Incident_associateId_fkey";

-- AlterTable
ALTER TABLE "Incident" ALTER COLUMN "date" SET DATA TYPE TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_associateId_fkey" FOREIGN KEY ("associateId") REFERENCES "Associate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
