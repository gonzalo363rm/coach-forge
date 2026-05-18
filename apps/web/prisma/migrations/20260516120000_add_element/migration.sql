-- CreateTable
CREATE TABLE "Element" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sportId" TEXT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'image',
    "image" TEXT NOT NULL,
    "width" DOUBLE PRECISION NOT NULL,
    "height" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Element_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Element_sportId_idx" ON "Element"("sportId");

-- AddForeignKey
ALTER TABLE "Element"
ADD CONSTRAINT "Element_sportId_fkey"
FOREIGN KEY ("sportId") REFERENCES "Sport"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

-- Seed: elementos por defecto (ids compatibles con definitionId en canvas existentes)
INSERT INTO "Element" ("id", "updatedAt", "name", "type", "image", "width", "height")
VALUES
    ('table-tennis-table', CURRENT_TIMESTAMP, 'Mesa de tenis de mesa', 'image', '/assets/images/defaults-elements/table-tennis-table.png', 274, 152.5),
    ('table-tennis-ball', CURRENT_TIMESTAMP, 'Pelota tenis de mesa', 'image', '/assets/images/defaults-elements/table-tennis-ball.svg', 4, 4),
    ('table-tennis-paddle', CURRENT_TIMESTAMP, 'Paleta tenis de mesa', 'image', '/assets/images/defaults-elements/table-tennis-paddle.svg', 15, 20),
    ('tennis-ball', CURRENT_TIMESTAMP, 'Pelota tenis', 'image', '/assets/images/defaults-elements/tennis-ball.svg', 6.5, 6.5),
    ('ball-machine', CURRENT_TIMESTAMP, 'Robot lanza pelotas', 'image', 'https://cdn-icons-png.flaticon.com/512/3043/3043184.png', 45, 45)
ON CONFLICT ("id") DO NOTHING;
