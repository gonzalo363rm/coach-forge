-- Soft-delete users: free email uniqueness among active accounts only.
ALTER TABLE "User" ADD COLUMN "deletedAt" TIMESTAMP(3);

DROP INDEX IF EXISTS "User_email_key";

CREATE INDEX "User_email_idx" ON "User"("email");
CREATE INDEX "User_deletedAt_idx" ON "User"("deletedAt");

CREATE UNIQUE INDEX "User_email_active_key" ON "User"("email") WHERE "deletedAt" IS NULL;
