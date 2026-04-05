-- CreateTable
CREATE TABLE "Exercise" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sportId" TEXT,
    "title" TEXT NOT NULL,
    "minPlayers" INTEGER,
    "maxPlayers" INTEGER,
    "difficulty" INTEGER NOT NULL,
    "videoLink" TEXT,
    "canvas" JSONB NOT NULL,

    CONSTRAINT "Exercise_pkey" PRIMARY KEY ("id")
);
