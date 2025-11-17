-- CreateEnum
CREATE TYPE "ThemeStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ERROR');

-- AlterTable
ALTER TABLE "users" ADD COLUMN "preferredTheme" TEXT;

-- CreateTable
CREATE TABLE "installed_themes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "themeId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "status" "ThemeStatus" NOT NULL DEFAULT 'INACTIVE',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "config" JSONB,
    "installedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastEnabled" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "installed_themes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "theme_registry" (
    "id" TEXT NOT NULL,
    "themeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "authorEmail" TEXT,
    "authorUrl" TEXT,
    "version" TEXT NOT NULL,
    "minAppVersion" TEXT NOT NULL,
    "colors" JSONB NOT NULL,
    "typography" JSONB,
    "spacing" JSONB,
    "radius" TEXT,
    "category" TEXT NOT NULL,
    "tags" TEXT[],
    "previewUrl" TEXT,
    "homepage" TEXT,
    "repository" TEXT,
    "license" TEXT DEFAULT 'MIT',
    "downloadUrl" TEXT,
    "packageUrl" TEXT,
    "checksum" TEXT,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "activeInstalls" INTEGER NOT NULL DEFAULT 0,
    "rating" DOUBLE PRECISION DEFAULT 0,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "deprecated" BOOLEAN NOT NULL DEFAULT false,
    "compatibleWith" TEXT[],
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "theme_registry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "installed_themes_userId_idx" ON "installed_themes"("userId");

-- CreateIndex
CREATE INDEX "installed_themes_themeId_idx" ON "installed_themes"("themeId");

-- CreateIndex
CREATE INDEX "installed_themes_isActive_idx" ON "installed_themes"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "installed_themes_userId_themeId_key" ON "installed_themes"("userId", "themeId");

-- CreateIndex
CREATE UNIQUE INDEX "theme_registry_themeId_key" ON "theme_registry"("themeId");

-- CreateIndex
CREATE INDEX "theme_registry_themeId_idx" ON "theme_registry"("themeId");

-- CreateIndex
CREATE INDEX "theme_registry_category_idx" ON "theme_registry"("category");

-- CreateIndex
CREATE INDEX "theme_registry_featured_idx" ON "theme_registry"("featured");

-- CreateIndex
CREATE INDEX "theme_registry_verified_idx" ON "theme_registry"("verified");

-- AddForeignKey
ALTER TABLE "installed_themes" ADD CONSTRAINT "installed_themes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
