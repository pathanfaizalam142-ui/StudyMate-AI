import { AppDatabase, getDatabase } from "./connection";
import { MigrationReport, runMigrations } from "./migrate";
import { SeedReport, seedDatabase } from "./seed";
import { upsertAdminUserAccount } from "./adminRepository";

export * from "./connection";
export * from "./hash";
export * from "./schema";
export * from "./migrate";
export * from "./seed";
export * from "./repository";
export * from "./adminRepository";

export interface DatabaseInitResult {
  db: AppDatabase;
  migrationReport: MigrationReport;
  seedReport: SeedReport;
}

const OWNER_ADMIN_EMAIL = "Pathanfaizalam142@gmail.com";
const OWNER_ADMIN_SCRYPT_HASH = "c4d5e6f7a8b90123456789abcdef0123:e8b75023be82432241df6dcf39d45d76dd8f45b5779b5c8c8c0c5b0f30c1483e2778d9c01ce79ae05a8bc5f7f2e87d0adeb88b7a52db0241cff87e1d2e8f5d46";

/**
 * Initializes the canonical SQLite database (`studymate.db`), applies pending migrations
 * transactionally (with pre-migration backup if an existing DB had tables), and executes
 * the idempotent canonical curriculum/paper/question seed.
 */
export function initializeDatabase(customPath?: string): DatabaseInitResult {
  const db = getDatabase(customPath);
  const migrationReport = runMigrations(db);
  const seedReport = seedDatabase(db);

  upsertAdminUserAccount(db, {
    email: OWNER_ADMIN_EMAIL,
    name: "Faiz Alam Pathan",
    precomputedScryptHash: OWNER_ADMIN_SCRYPT_HASH,
  });

  return {
    db,
    migrationReport,
    seedReport,
  };
}
