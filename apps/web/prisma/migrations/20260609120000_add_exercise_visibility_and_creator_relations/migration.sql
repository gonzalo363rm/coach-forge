-- AlterTable
ALTER TABLE "Exercise" ADD COLUMN "isPublic" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Exercise" ADD COLUMN "creatorId" TEXT;

-- CreateIndex
CREATE INDEX "Exercise_creatorId_idx" ON "Exercise"("creatorId");

-- CreateIndex
CREATE INDEX "TrainingClass_creatorId_idx" ON "TrainingClass"("creatorId");

-- AddForeignKey
ALTER TABLE "Exercise" ADD CONSTRAINT "Exercise_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingClass" ADD CONSTRAINT "TrainingClass_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
