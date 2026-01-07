-- CreateTable
CREATE TABLE "DesignationVisibility" (
    "id" TEXT NOT NULL,
    "designation" "Designation" NOT NULL,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DesignationVisibility_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DesignationVisibility_designation_key" ON "DesignationVisibility"("designation");
