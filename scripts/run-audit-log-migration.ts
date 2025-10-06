/**
 * Run AuditLog schema enhancement migration
 * Sprint 3 Week 8 - Audit Log System Implementation
 *
 * This script executes the SQL migration to enhance the audit_logs table
 * with additional fields for comprehensive audit logging.
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { Client } from 'pg';

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('📊 Connecting to database...');
    await client.connect();
    console.log('✅ Database connected successfully');

    // Read migration SQL file
    const migrationPath = join(__dirname, '../prisma/migrations/002_enhance_audit_log_schema.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    console.log('\n📝 Executing AuditLog schema enhancement migration...');
    console.log('Migration file: 002_enhance_audit_log_schema.sql');

    // Execute migration
    const result = await client.query(migrationSQL);

    console.log('\n✅ Migration completed successfully!');
    console.log('📋 Migration details:');
    console.log('   - Added user_name, user_email, user_role columns');
    console.log('   - Added severity (AuditSeverity enum) column');
    console.log('   - Added success (boolean) column');
    console.log('   - Added error_message, request_id, session_id columns');
    console.log('   - Added details (JSONB) column');
    console.log('   - Created additional indexes for query optimization');
    console.log('\n🎉 audit_logs table is now ready for Sprint 3 Week 8 implementation!');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n📊 Database connection closed');
  }
}

// Run migration
runMigration().catch(console.error);
