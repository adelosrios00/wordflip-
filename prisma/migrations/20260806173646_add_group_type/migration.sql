-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_WordGroup" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'words'
);
INSERT INTO "new_WordGroup" ("id", "name", "order") SELECT "id", "name", "order" FROM "WordGroup";
DROP TABLE "WordGroup";
ALTER TABLE "new_WordGroup" RENAME TO "WordGroup";
CREATE UNIQUE INDEX "WordGroup_order_key" ON "WordGroup"("order");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
