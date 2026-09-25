-- Add 2FA fields to users table
ALTER TABLE "users" ADD COLUMN "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN "twoFactorSecret" TEXT;

-- Create audit_logs table
CREATE TABLE "audit_logs" (
    "id"         TEXT NOT NULL,
    "tenantId"   TEXT,
    "userId"     TEXT,
    "action"     TEXT NOT NULL,
    "resource"   TEXT NOT NULL,
    "resourceId" TEXT,
    "details"    JSONB,
    "ipAddress"  TEXT,
    "userAgent"  TEXT,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX "audit_logs_tenantId_createdAt_idx" ON "audit_logs"("tenantId", "createdAt");
CREATE INDEX "audit_logs_userId_idx"              ON "audit_logs"("userId");
CREATE INDEX "audit_logs_action_resource_idx"     ON "audit_logs"("action", "resource");

-- FK
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
