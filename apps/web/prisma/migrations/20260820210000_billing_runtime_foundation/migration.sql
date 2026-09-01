-- CreateEnum
CREATE TYPE "PlanCatalogRole" AS ENUM ('none', 'free', 'full');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "clubAccessEnabled" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Plan" ADD COLUMN "catalogRole" "PlanCatalogRole" NOT NULL DEFAULT 'none';

-- CreateIndex
CREATE INDEX "Plan_catalogRole_idx" ON "Plan"("catalogRole");
