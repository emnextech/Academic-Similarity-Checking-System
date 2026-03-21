-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING_REVIEW', 'IN_REVIEW', 'MARKED');

-- AlterTable
ALTER TABLE "Result" ADD COLUMN     "markScore" DOUBLE PRECISION,
ADD COLUMN     "markedAt" TIMESTAMP(3),
ADD COLUMN     "markedById" TEXT,
ADD COLUMN     "markerComment" TEXT,
ADD COLUMN     "reviewStatus" "ReviewStatus" NOT NULL DEFAULT 'PENDING_REVIEW';

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_markedById_fkey" FOREIGN KEY ("markedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
