-- Sprint 3 Week 8: Enhance AuditLog schema for comprehensive audit logging
-- Date: 2025-10-07
-- Purpose: Add user_role, severity, success status, and additional context fields to audit_logs table

-- Step 1: Create AuditSeverity enum type
DO $$ BEGIN
    CREATE TYPE "AuditSeverity" AS ENUM ('INFO', 'WARNING', 'ERROR', 'CRITICAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 2: Add new columns to audit_logs table
ALTER TABLE audit_logs
ADD COLUMN IF NOT EXISTS user_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS user_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS user_role "UserRole",
ADD COLUMN IF NOT EXISTS severity "AuditSeverity" NOT NULL DEFAULT 'INFO',
ADD COLUMN IF NOT EXISTS success BOOLEAN NOT NULL DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS error_message TEXT,
ADD COLUMN IF NOT EXISTS request_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS session_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS details JSONB;

-- Step 3: Create additional indexes for improved query performance
CREATE INDEX IF NOT EXISTS "IX_Audit_Severity_Date" ON audit_logs(severity, created_at);
CREATE INDEX IF NOT EXISTS "IX_Audit_Success_Date" ON audit_logs(success, created_at);
CREATE INDEX IF NOT EXISTS "IX_Audit_UserRole" ON audit_logs(user_role) WHERE user_role IS NOT NULL;

-- Step 4: Add comments for documentation
COMMENT ON COLUMN audit_logs.user_name IS 'Full name of the user who performed the action';
COMMENT ON COLUMN audit_logs.user_email IS 'Email address of the user';
COMMENT ON COLUMN audit_logs.user_role IS 'Role of the user at the time of the action';
COMMENT ON COLUMN audit_logs.severity IS 'Severity level of the audit event (INFO, WARNING, ERROR, CRITICAL)';
COMMENT ON COLUMN audit_logs.success IS 'Whether the operation was successful';
COMMENT ON COLUMN audit_logs.error_message IS 'Error message if operation failed';
COMMENT ON COLUMN audit_logs.request_id IS 'Unique request identifier for tracing';
COMMENT ON COLUMN audit_logs.session_id IS 'Session identifier for correlating user actions';
COMMENT ON COLUMN audit_logs.details IS 'Additional contextual information in JSON format';

-- Step 5: Verify migration
DO $$
DECLARE
    column_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns
    WHERE table_name = 'audit_logs'
    AND column_name IN ('user_name', 'user_email', 'user_role', 'severity', 'success', 'error_message', 'request_id', 'session_id', 'details');

    IF column_count < 9 THEN
        RAISE EXCEPTION 'AuditLog schema enhancement migration failed: expected 9 new columns, found %', column_count;
    END IF;

    RAISE NOTICE 'AuditLog schema enhancement completed successfully. Added % columns.', column_count;
END $$;
