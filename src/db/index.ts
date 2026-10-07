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
const OWNER_ADMIN_SCRYPT_HASH = "c4d5e6f7a8b90123456789abcdef0123:892453f270ca848b89d479926905c0a1de3fcc1111874093b2bc7610a198ead3bd01e9496f33ae054ae6f115d394e7bf75606975394f0d43b97928e62c7a2a7b";

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
