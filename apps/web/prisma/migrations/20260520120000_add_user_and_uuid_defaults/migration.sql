-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'coach');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'coach',
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- UUID defaults for new rows (existing IDs unchanged)
ALTER TABLE "Exercise" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
ALTER TABLE "TrainingClass" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
ALTER TABLE "TrainingClassExercise" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
ALTER TABLE "Sport" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
ALTER TABLE "User" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
