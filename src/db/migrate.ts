import fs from "node:fs";
import { AppDatabase } from "./connection";
import { computeSha256Hex, hashPasswordScrypt } from "./hash";
import { PHASE_1_1_SCHEMA_SQL, PHASE_1_1_SCHEMA_VERSION } from "./schema";

export interface MigrationRecord {
  version: string;
  name: string;
  checksum: string;
  applied_at: string;
}

export interface MigrationReport {
  applied: string[];
  alreadyApplied: string[];
  schemaVersion: string;
  backupCreated: string | null;
}

/**
 * Deterministic SQLite Migration Runner (Phase 1.1 Section 15 Contract).
 * - Checks whether an existing database with pre-existing tables is present and creates a timestamped backup before applying new migrations.
 * - Runs inside an atomic transaction (`BEGIN IMMEDIATE ... COMMIT`).
 * - Verifies SHA-256 checksum of applied migrations.
 * - Upgrades any legacy plaintext passwords in `users` to scrypt format `<salt>:<derivedKey>`.
 */
export function runMigrations(db: AppDatabase): MigrationReport {
  let backupCreated: string | null = null;

  // Check if pre-existing user tables exist prior to schema_migrations initialization
  const existingTables = db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name != 'schema_migrations'"
    )
    .all() as Array<{ name: string }>;

  // Ensure schema_migrations exists before querying applied versions
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      checksum TEXT NOT NULL,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  const applied: string[] = [];
  const alreadyApplied: string[] = [];

  const checksum = computeSha256Hex(PHASE_1_1_SCHEMA_SQL);
  const existing = db
    .prepare("SELECT version, name, checksum, applied_at FROM schema_migrations WHERE version = ?")
    .get(PHASE_1_1_SCHEMA_VERSION) as unknown as MigrationRecord | undefined;

  if (existing) {
    if (existing.checksum !== checksum) {
      throw new Error(
        `Migration checksum mismatch for ${PHASE_1_1_SCHEMA_VERSION}: expected ${existing.checksum}, got ${checksum}`
      );
    }
    alreadyApplied.push(existing.version);
  } else {
    // If the database file already had tables before this migration, create a timestamped backup first (Rule 15)
    if (
      existingTables.length > 0 &&
      db.dbPath !== ":memory:" &&
      fs.existsSync(db.dbPath)
    ) {
      const ts = new Date().toISOString().replace(/[:.]/g, "-");
      const backupPath = `${db.dbPath}.bak.${ts}`;
      fs.copyFileSync(db.dbPath, backupPath);
      backupCreated = backupPath;
    }

    const applyTx = db.transaction(() => {
      db.exec(PHASE_1_1_SCHEMA_SQL);

      // Migrate any legacy users with plaintext passwords (not matching `<32-hex-salt>:<128-hex-key>`)
      const users = db
        .prepare("SELECT id, password_hash FROM users")
        .all() as Array<{ id: string; password_hash: string }>;

      const updatePwdStmt = db.prepare(
        "UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?"
      );
      for (const u of users) {
        if (!u.password_hash || !/^[0-9a-f]{32}:[0-9a-f]{128}$/i.test(u.password_hash)) {
          updatePwdStmt.run(hashPasswordScrypt(u.password_hash || "student123"), u.id);
        }
      }

      db.prepare(
        "INSERT INTO schema_migrations (version, name, checksum) VALUES (?, ?, ?)"
      ).run(
        PHASE_1_1_SCHEMA_VERSION,
        "Phase 1.1 Canonical Academic & Quiz Relational Schema",
        checksum
      );
    });

    applyTx();
    applied.push(PHASE_1_1_SCHEMA_VERSION);
  }

  return {
    applied,
    alreadyApplied,
    schemaVersion: PHASE_1_1_SCHEMA_VERSION,
    backupCreated,
  };
}
