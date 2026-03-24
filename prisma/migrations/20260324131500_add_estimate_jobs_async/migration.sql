-- CreateEnum
CREATE TYPE "EstimateJobStatus" AS ENUM ('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "EstimateJob" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "photoUrls" TEXT[],
    "photoCount" INTEGER NOT NULL,
    "status" "EstimateJobStatus" NOT NULL DEFAULT 'QUEUED',
    "result" JSONB,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "EstimateJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EstimateJob_userId_status_idx" ON "EstimateJob"("userId", "status");

-- CreateIndex
CREATE INDEX "EstimateJob_createdAt_idx" ON "EstimateJob"("createdAt");

-- AddForeignKey
ALTER TABLE "EstimateJob" ADD CONSTRAINT "EstimateJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
