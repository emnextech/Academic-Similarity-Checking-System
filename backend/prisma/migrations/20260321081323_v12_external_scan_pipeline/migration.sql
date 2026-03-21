-- CreateEnum
CREATE TYPE "ExternalScanStatus" AS ENUM ('QUEUED', 'SUBMITTED', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "ExternalScan" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerScanId" TEXT NOT NULL,
    "status" "ExternalScanStatus" NOT NULL DEFAULT 'QUEUED',
    "rawPayload" JSONB,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ExternalScan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExternalSourceMatch" (
    "id" TEXT NOT NULL,
    "externalScanId" TEXT NOT NULL,
    "sourceType" TEXT,
    "title" TEXT,
    "url" TEXT,
    "matchedWords" INTEGER,
    "similarity" INTEGER,
    "snippet" TEXT,
    "sourceSnippet" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExternalSourceMatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExternalScan_submissionId_key" ON "ExternalScan"("submissionId");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalScan_providerScanId_key" ON "ExternalScan"("providerScanId");

-- AddForeignKey
ALTER TABLE "ExternalScan" ADD CONSTRAINT "ExternalScan_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalSourceMatch" ADD CONSTRAINT "ExternalSourceMatch_externalScanId_fkey" FOREIGN KEY ("externalScanId") REFERENCES "ExternalScan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
