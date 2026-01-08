-- CreateEnum
CREATE TYPE "TemplateType" AS ENUM ('CA', 'OCC');

-- CreateTable
CREATE TABLE "TemplateMapping" (
    "id" TEXT NOT NULL,
    "templateType" "TemplateType" NOT NULL,
    "dataPoint" TEXT NOT NULL,
    "cellValue" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TemplateMapping_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TemplateMapping_templateType_idx" ON "TemplateMapping"("templateType");

-- CreateIndex
CREATE UNIQUE INDEX "TemplateMapping_templateType_dataPoint_key" ON "TemplateMapping"("templateType", "dataPoint");
