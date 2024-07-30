-- CreateTable
CREATE TABLE "Associate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Associate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncidentType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "IncidentType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Incident" (
    "id" TEXT NOT NULL,
    "associateId" TEXT NOT NULL,
    "typeId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "isVerbal" BOOLEAN NOT NULL,

    CONSTRAINT "Incident_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IncidentType_name_key" ON "IncidentType"("name");

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_associateId_fkey" FOREIGN KEY ("associateId") REFERENCES "Associate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "IncidentType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
