-- CreateTable
CREATE TABLE "Associate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "currentPoints" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currentNotification" TEXT NOT NULL DEFAULT 'None',

    CONSTRAINT "Associate_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "AttendanceOccurrence" (
    "id" TEXT NOT NULL,
    "associateId" TEXT NOT NULL,
    "typeId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "pointsAtTime" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttendanceOccurrence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OccurrenceType_code_key" ON "OccurrenceType"("code");

-- AddForeignKey
ALTER TABLE "AttendanceOccurrence" ADD CONSTRAINT "AttendanceOccurrence_associateId_fkey" FOREIGN KEY ("associateId") REFERENCES "Associate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceOccurrence" ADD CONSTRAINT "AttendanceOccurrence_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "OccurrenceType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
