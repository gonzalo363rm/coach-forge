-- CreateTable
CREATE TABLE "Sport" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "Sport_pkey" PRIMARY KEY ("id")
);

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

-- CreateIndex
CREATE INDEX "Exercise_sportId_idx" ON "Exercise"("sportId");

-- AddForeignKey
ALTER TABLE "Exercise"
ADD CONSTRAINT "Exercise_sportId_fkey"
FOREIGN KEY ("sportId") REFERENCES "Sport"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

