-- CreateTable
CREATE TABLE "TrainingClass" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "sportId" TEXT,
    "difficulty" INTEGER NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "creatorId" TEXT,

    CONSTRAINT "TrainingClass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingClassExercise" (
    "id" TEXT NOT NULL,
    "trainingClassId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "durationMinutes" INTEGER,
    "isOptional" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "TrainingClassExercise_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TrainingClass_sportId_idx" ON "TrainingClass"("sportId");

-- CreateIndex
CREATE INDEX "TrainingClassExercise_trainingClassId_sortOrder_idx" ON "TrainingClassExercise"("trainingClassId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingClassExercise_trainingClassId_exerciseId_key" ON "TrainingClassExercise"("trainingClassId", "exerciseId");

-- AddForeignKey
ALTER TABLE "TrainingClass" ADD CONSTRAINT "TrainingClass_sportId_fkey" FOREIGN KEY ("sportId") REFERENCES "Sport"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingClassExercise" ADD CONSTRAINT "TrainingClassExercise_trainingClassId_fkey" FOREIGN KEY ("trainingClassId") REFERENCES "TrainingClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingClassExercise" ADD CONSTRAINT "TrainingClassExercise_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
