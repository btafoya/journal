-- CreateIndex: Add indexes for better search performance
CREATE INDEX IF NOT EXISTS "Entry_title_idx" ON "Entry"("title");
CREATE INDEX IF NOT EXISTS "Entry_userId_updatedAt_idx" ON "Entry"("userId", "updatedAt" DESC);
CREATE INDEX IF NOT EXISTS "Entry_userId_published_idx" ON "Entry"("userId", "published");
CREATE INDEX IF NOT EXISTS "Entry_userId_workspaceId_idx" ON "Entry"("userId", "workspaceId");
CREATE INDEX IF NOT EXISTS "Entry_createdAt_idx" ON "Entry"("createdAt");
CREATE INDEX IF NOT EXISTS "Entry_title_content_search_idx" ON "Entry" USING GIN (to_tsvector('english', title || ' ' || COALESCE(content, '')));
CREATE INDEX IF NOT EXISTS "SearchHistory_userId_createdAt_idx" ON "SearchHistory"("userId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "AuditLog_userId_createdAt_idx" ON "AuditLog"("userId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "AuditLog_action_idx" ON "AuditLog"("action");
CREATE INDEX IF NOT EXISTS "AuditLog_resourceType_resourceId_idx" ON "AuditLog"("resourceType", "resourceId");
CREATE INDEX IF NOT EXISTS "Category_userId_displayOrder_idx" ON "Category"("userId", "displayOrder");
CREATE INDEX IF NOT EXISTS "Workspace_userId_isDefault_idx" ON "Workspace"("userId", "isDefault");
