-- CreateEnum
CREATE TYPE "Designation" AS ENUM ('MH', 'CLERK', 'INACTIVE', 'NONE');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('OCCURRENCE', 'CORRECTIVE_ACTION');

-- CreateEnum
CREATE TYPE "RuleType" AS ENUM ('SAFETY', 'WORK');

-- CreateTable
CREATE TABLE "Associate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "currentPoints" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "designation" "Designation" NOT NULL DEFAULT 'NONE',
    "ssoid" TEXT,
    "departmentId" TEXT,
    "locationId" TEXT,

    CONSTRAINT "Associate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceOccurrence" (
    "id" TEXT NOT NULL,
    "associateId" TEXT NOT NULL,
    "typeId" TEXT NOT NULL,
    "pointsAtTime" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "AttendanceOccurrence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CorrectiveAction" (
    "id" TEXT NOT NULL,
    "associateId" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CorrectiveAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExportRecord" (
    "id" TEXT NOT NULL,
    "associateId" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "exportedAt" TIMESTAMP(3) NOT NULL,
    "exportedBy" TEXT NOT NULL,

    CONSTRAINT "ExportRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "associateId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "type" "NotificationType" NOT NULL,
    "level" TEXT NOT NULL,
    "totalPoints" DOUBLE PRECISION,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationLevel" (
    "id" TEXT NOT NULL,
    "designation" "Designation" NOT NULL,
    "level" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "pointThreshold" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "NotificationLevel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OccurrenceType" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "points" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "OccurrenceType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rule" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "RuleType" NOT NULL,

    CONSTRAINT "Rule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Associate_name_key" ON "Associate"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Associate_ssoid_key" ON "Associate"("ssoid");

-- CreateIndex
CREATE UNIQUE INDEX "Department_name_key" ON "Department"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Location_name_key" ON "Location"("name");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationLevel_designation_level_key" ON "NotificationLevel"("designation", "level");

-- CreateIndex
CREATE UNIQUE INDEX "OccurrenceType_code_key" ON "OccurrenceType"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Rule_code_key" ON "Rule"("code");

-- AddForeignKey
ALTER TABLE "Associate" ADD CONSTRAINT "Associate_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Associate" ADD CONSTRAINT "Associate_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceOccurrence" ADD CONSTRAINT "AttendanceOccurrence_associateId_fkey" FOREIGN KEY ("associateId") REFERENCES "Associate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceOccurrence" ADD CONSTRAINT "AttendanceOccurrence_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "OccurrenceType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorrectiveAction" ADD CONSTRAINT "CorrectiveAction_associateId_fkey" FOREIGN KEY ("associateId") REFERENCES "Associate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorrectiveAction" ADD CONSTRAINT "CorrectiveAction_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "Rule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExportRecord" ADD CONSTRAINT "ExportRecord_associateId_fkey" FOREIGN KEY ("associateId") REFERENCES "Associate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_associateId_fkey" FOREIGN KEY ("associateId") REFERENCES "Associate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
