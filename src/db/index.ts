import { AppDatabase, getDatabase } from "./connection";
import { MigrationReport, runMigrations } from "./migrate";
import { getSeedReport, isCanonicalSeedRequired, SeedReport, seedDatabase } from "./seed";
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
  seedApplied: boolean;
}

export interface DatabaseInitOptions {
  forceSeed?: boolean;
}

/**
 * Initializes the canonical SQLite database (`studymate.db` or `SQLITE_DB_PATH`),
 * applies pending migrations transactionally (with pre-migration backup if an existing DB had tables),
 * runs the canonical seed only when migrations were applied, canonical tables are empty, or `forceSeed` is set,
 * and optionally bootstraps an initial administrator from environment variables ONLY when zero active admins exist.
 */
export function initializeDatabase(
  customPath?: string,
  options?: DatabaseInitOptions
): DatabaseInitResult {
  const db = getDatabase(customPath);
  const migrationReport = runMigrations(db);
  const shouldSeed =
    Boolean(options?.forceSeed) ||
    migrationReport.applied.length > 0 ||
    isCanonicalSeedRequired(db);

  const seedReport = shouldSeed ? seedDatabase(db) : getSeedReport(db);

  const activeAdminRow = db
    .prepare("SELECT COUNT(*) AS c FROM users WHERE role = 'admin' AND is_active = 1")
    .get() as { c: number };
  const bootstrapEmail = (process.env.BOOTSTRAP_ADMIN_EMAIL || "").trim();
  const bootstrapPassword = process.env.BOOTSTRAP_ADMIN_PASSWORD || "";
  const bootstrapName = (process.env.BOOTSTRAP_ADMIN_NAME || "").trim() || "StudyMate Administrator";

  if (Number(activeAdminRow.c) === 0 && bootstrapEmail && bootstrapPassword) {
    upsertAdminUserAccount(db, {
      email: bootstrapEmail,
      password: bootstrapPassword,
      name: bootstrapName,
    });
  }

  return {
    db,
    migrationReport,
    seedReport,
    seedApplied: shouldSeed,
  };
}
