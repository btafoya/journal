-- CreateEnum
CREATE TYPE "PluginStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ERROR', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "PluginPermission" AS ENUM ('READ_ENTRIES', 'WRITE_ENTRIES', 'DELETE_ENTRIES', 'READ_USER_DATA', 'MANAGE_FILES', 'NETWORK_ACCESS', 'DATABASE_ACCESS', 'EXECUTE_SCRIPTS', 'MODIFY_UI', 'ACCESS_SETTINGS');

-- CreateTable
CREATE TABLE "installed_plugins" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pluginId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "status" "PluginStatus" NOT NULL DEFAULT 'INACTIVE',
    "config" JSONB,
    "permissions" TEXT[],
    "installedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastEnabled" TIMESTAMP(3),
    "lastDisabled" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "installed_plugins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plugin_hooks" (
    "id" TEXT NOT NULL,
    "pluginId" TEXT NOT NULL,
    "hookName" TEXT NOT NULL,
    "handlerPath" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 10,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plugin_hooks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plugin_storage" (
    "id" TEXT NOT NULL,
    "pluginId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "encrypted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plugin_storage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plugin_registry" (
    "id" TEXT NOT NULL,
    "pluginId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "authorEmail" TEXT,
    "authorUrl" TEXT,
    "version" TEXT NOT NULL,
    "minAppVersion" TEXT NOT NULL,
    "manifest" JSONB NOT NULL,
    "homepage" TEXT,
    "repository" TEXT,
    "license" TEXT DEFAULT 'MIT',
    "category" TEXT NOT NULL,
    "tags" TEXT[],
    "requiredPermissions" TEXT[],
    "downloadUrl" TEXT,
    "checksum" TEXT,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "activeInstalls" INTEGER NOT NULL DEFAULT 0,
    "rating" DOUBLE PRECISION DEFAULT 0,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "deprecated" BOOLEAN NOT NULL DEFAULT false,
    "securityScan" JSONB,
    "lastScanned" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plugin_registry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "installed_plugins_userId_idx" ON "installed_plugins"("userId");

-- CreateIndex
CREATE INDEX "installed_plugins_pluginId_idx" ON "installed_plugins"("pluginId");

-- CreateIndex
CREATE INDEX "installed_plugins_status_idx" ON "installed_plugins"("status");

-- CreateIndex
CREATE UNIQUE INDEX "installed_plugins_userId_pluginId_key" ON "installed_plugins"("userId", "pluginId");

-- CreateIndex
CREATE INDEX "plugin_hooks_hookName_idx" ON "plugin_hooks"("hookName");

-- CreateIndex
CREATE INDEX "plugin_hooks_priority_idx" ON "plugin_hooks"("priority");

-- CreateIndex
CREATE UNIQUE INDEX "plugin_hooks_pluginId_hookName_handlerPath_key" ON "plugin_hooks"("pluginId", "hookName", "handlerPath");

-- CreateIndex
CREATE INDEX "plugin_storage_pluginId_idx" ON "plugin_storage"("pluginId");

-- CreateIndex
CREATE UNIQUE INDEX "plugin_storage_pluginId_key_key" ON "plugin_storage"("pluginId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "plugin_registry_pluginId_key" ON "plugin_registry"("pluginId");

-- CreateIndex
CREATE INDEX "plugin_registry_pluginId_idx" ON "plugin_registry"("pluginId");

-- CreateIndex
CREATE INDEX "plugin_registry_category_idx" ON "plugin_registry"("category");

-- CreateIndex
CREATE INDEX "plugin_registry_featured_idx" ON "plugin_registry"("featured");

-- CreateIndex
CREATE INDEX "plugin_registry_verified_idx" ON "plugin_registry"("verified");

-- AddForeignKey
ALTER TABLE "installed_plugins" ADD CONSTRAINT "installed_plugins_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plugin_hooks" ADD CONSTRAINT "plugin_hooks_pluginId_fkey" FOREIGN KEY ("pluginId") REFERENCES "installed_plugins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plugin_storage" ADD CONSTRAINT "plugin_storage_pluginId_fkey" FOREIGN KEY ("pluginId") REFERENCES "installed_plugins"("id") ON DELETE CASCADE ON UPDATE CASCADE;
