-- Role: club_manager
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'club_manager';

-- ContentVisibility enum
CREATE TYPE "ContentVisibility" AS ENUM ('private', 'club', 'public');

-- Club table
CREATE TABLE "Club" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "logoUrl" TEXT,
    "maxMembers" INTEGER NOT NULL DEFAULT 20,
    "managerId" TEXT NOT NULL,

    CONSTRAINT "Club_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Club_managerId_key" ON "Club"("managerId");
CREATE INDEX "Club_managerId_idx" ON "Club"("managerId");

-- User.clubId
ALTER TABLE "User" ADD COLUMN "clubId" TEXT;
CREATE INDEX "User_clubId_idx" ON "User"("clubId");
CREATE INDEX "User_role_idx" ON "User"("role");

-- Exercise.visibility
ALTER TABLE "Exercise" ADD COLUMN "visibility" "ContentVisibility" NOT NULL DEFAULT 'private';
UPDATE "Exercise" SET "visibility" = 'public' WHERE "isPublic" = true;
ALTER TABLE "Exercise" DROP COLUMN "isPublic";
CREATE INDEX "Exercise_visibility_idx" ON "Exercise"("visibility");

-- TrainingClass.visibility
ALTER TABLE "TrainingClass" ADD COLUMN "visibility" "ContentVisibility" NOT NULL DEFAULT 'private';
UPDATE "TrainingClass" SET "visibility" = 'public' WHERE "isPublic" = true;
ALTER TABLE "TrainingClass" DROP COLUMN "isPublic";
CREATE INDEX "TrainingClass_visibility_idx" ON "TrainingClass"("visibility");

-- Club FKs
ALTER TABLE "Club" ADD CONSTRAINT "Club_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "User" ADD CONSTRAINT "User_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE SET NULL ON UPDATE CASCADE;
