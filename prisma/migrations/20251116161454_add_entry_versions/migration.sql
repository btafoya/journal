-- CreateTable
CREATE TABLE "entry_versions" (
    "id" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "wordCount" INTEGER NOT NULL,
    "charCount" INTEGER NOT NULL,
    "changeSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "entry_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "entry_versions_entryId_idx" ON "entry_versions"("entryId");

-- CreateIndex
CREATE INDEX "entry_versions_versionNumber_idx" ON "entry_versions"("versionNumber");

-- CreateIndex
CREATE INDEX "entry_versions_createdAt_idx" ON "entry_versions"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "entry_versions_entryId_versionNumber_key" ON "entry_versions"("entryId", "versionNumber");

-- AddForeignKey
ALTER TABLE "entry_versions" ADD CONSTRAINT "entry_versions_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
