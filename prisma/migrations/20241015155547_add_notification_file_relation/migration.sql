-- AlterTable
ALTER TABLE "File" ADD COLUMN     "notificationId" TEXT;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "Notification"("id") ON DELETE SET NULL ON UPDATE CASCADE;
