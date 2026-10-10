-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  Catégories produit dynamiques                                       ║
-- ║  L'énumération ProductCategory (ciment, fer à béton…) est remplacée  ║
-- ║  par une table « categories » propre à chaque boutique, afin que     ║
-- ║  l'application serve n'importe quel type de commerce.                ║
-- ║  Les produits existants sont rattachés sans perte de données.        ║
-- ╚══════════════════════════════════════════════════════════════════════╝

-- CreateTable: categories
CREATE TABLE "categories" (
    "id"        TEXT         NOT NULL,
    "tenantId"  TEXT         NOT NULL,
    "name"      TEXT         NOT NULL,
    "color"     TEXT,
    "position"  INTEGER      NOT NULL DEFAULT 0,
    "isActive"  BOOLEAN      NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "categories_tenantId_name_key" ON "categories"("tenantId", "name");
CREATE INDEX "categories_tenantId_idx" ON "categories"("tenantId");

ALTER TABLE "categories"
    ADD CONSTRAINT "categories_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable: products.categoryId
ALTER TABLE "products" ADD COLUMN "categoryId" TEXT;

-- Reprise des données : une catégorie par couple (boutique, ancienne valeur)
INSERT INTO "categories" ("id", "tenantId", "name", "position", "createdAt", "updatedAt")
SELECT
    gen_random_uuid()::text,
    d."tenantId",
    CASE d."category"::text
        WHEN 'CIMENT'      THEN 'Ciment'
        WHEN 'FER_BETON'   THEN 'Fer à béton'
        WHEN 'TOLE'        THEN 'Tôle'
        WHEN 'PEINTURE'    THEN 'Peinture'
        WHEN 'CARRELAGE'   THEN 'Carrelage'
        WHEN 'PLOMBERIE'   THEN 'Plomberie'
        WHEN 'ELECTRICITE' THEN 'Électricité'
        WHEN 'BOIS'        THEN 'Bois'
        ELSE                    'Autre'
    END,
    0,
    NOW(),
    NOW()
FROM (SELECT DISTINCT "tenantId", "category" FROM "products") d
ON CONFLICT ("tenantId", "name") DO NOTHING;

UPDATE "products" p
SET "categoryId" = c."id"
FROM "categories" c
WHERE c."tenantId" = p."tenantId"
  AND c."name" = CASE p."category"::text
        WHEN 'CIMENT'      THEN 'Ciment'
        WHEN 'FER_BETON'   THEN 'Fer à béton'
        WHEN 'TOLE'        THEN 'Tôle'
        WHEN 'PEINTURE'    THEN 'Peinture'
        WHEN 'CARRELAGE'   THEN 'Carrelage'
        WHEN 'PLOMBERIE'   THEN 'Plomberie'
        WHEN 'ELECTRICITE' THEN 'Électricité'
        WHEN 'BOIS'        THEN 'Bois'
        ELSE                    'Autre'
    END;

-- Suppression de l'ancienne colonne et de son énumération
DROP INDEX "products_tenantId_category_idx";
ALTER TABLE "products" DROP COLUMN "category";
DROP TYPE "ProductCategory";

CREATE INDEX "products_tenantId_categoryId_idx" ON "products"("tenantId", "categoryId");

ALTER TABLE "products"
    ADD CONSTRAINT "products_categoryId_fkey"
    FOREIGN KEY ("categoryId") REFERENCES "categories"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
