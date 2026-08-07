-- CreateTable
CREATE TABLE "Word" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "spanish" TEXT NOT NULL,
    "english" TEXT NOT NULL,
    "imageUrl" TEXT,
    "order" INTEGER NOT NULL,
    "groupId" TEXT NOT NULL,
    CONSTRAINT "Word_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "WordGroup" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WordGroup" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Progress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "wordGroupId" TEXT NOT NULL,
    "phase" TEXT NOT NULL,
    "wordId" TEXT NOT NULL,
    "completedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Progress_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Progress_wordGroupId_fkey" FOREIGN KEY ("wordGroupId") REFERENCES "WordGroup" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Progress_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Word_groupId_order_key" ON "Word"("groupId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "WordGroup_order_key" ON "WordGroup"("order");

-- CreateIndex
CREATE UNIQUE INDEX "Student_name_key" ON "Student"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Progress_studentId_wordGroupId_phase_wordId_key" ON "Progress"("studentId", "wordGroupId", "phase", "wordId");
