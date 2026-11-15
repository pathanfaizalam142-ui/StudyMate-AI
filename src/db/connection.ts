import { DatabaseSync, StatementSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";

export interface RunResult {
  changes: number | bigint;
  lastInsertRowid: number | bigint;
}

export type WalCheckpointMode = "PASSIVE" | "FULL" | "RESTART" | "TRUNCATE";

export interface WalCheckpointResult {
  mode: WalCheckpointMode;
  busy: number;
  log: number;
  checkpointed: number;
}

export interface BackupVerificationResult {
  backupPath: string;
  sizeBytes: number;
  integrityCheck: string;
  foreignKeyViolations: number;
}

/**
 * Resolves the canonical SQLite database file path without changing the default
 * `./studymate.db` location when `SQLITE_DB_PATH` is unset or blank.
 */
export function resolveDatabasePath(customPath?: string): string {
  const candidate =
    (typeof customPath === "string" ? customPath.trim() : "") ||
    (typeof process.env.SQLITE_DB_PATH === "string" ? process.env.SQLITE_DB_PATH.trim() : "");

  if (!candidate) {
    return path.resolve(process.cwd(), "studymate.db");
  }
  if (candidate === ":memory:") {
    return candidate;
  }
  return path.isAbsolute(candidate) ? candidate : path.resolve(process.cwd(), candidate);
}

/**
 * Synchronous SQLite connection wrapper around Node 22 built-in `node:sqlite`
 * with mandatory WAL mode, strict foreign key enforcement, and nested transaction support.
 */
export class AppDatabase {
  public readonly raw: DatabaseSync;
  public readonly dbPath: string;
  private txDepth = 0;
  private closed = false;

  constructor(dbPath?: string) {
    this.dbPath = resolveDatabasePath(dbPath);

    if (this.dbPath !== ":memory:") {
      fs.mkdirSync(path.dirname(this.dbPath), { recursive: true });
    }

    this.raw = new DatabaseSync(this.dbPath);

    // Mandatory Phase 1.1 Contract PRAGMAs on every connection open
    this.raw.exec("PRAGMA journal_mode = WAL;");
    this.raw.exec("PRAGMA foreign_keys = ON;");
    this.raw.exec("PRAGMA synchronous = NORMAL;");
    this.raw.exec("PRAGMA busy_timeout = 5000;");
  }

  public exec(sql: string): void {
    this.raw.exec(sql);
  }

  public prepare(sql: string): StatementSync {
    return this.raw.prepare(sql);
  }

  public pragma<T = unknown>(pragmaStatement: string): T[] {
    return this.raw.prepare(`PRAGMA ${pragmaStatement}`).all() as T[];
  }

  /**
   * Safely checkpoints committed WAL frames back into the primary database file.
   */
  public checkpointWal(mode: WalCheckpointMode = "PASSIVE"): WalCheckpointResult {
    if (this.closed || this.dbPath === ":memory:") {
      return { mode, busy: 0, log: 0, checkpointed: 0 };
    }
    const rows = this.raw.prepare(`PRAGMA wal_checkpoint(${mode})`).all() as Array<{
      busy?: number;
      log?: number;
      checkpointed?: number;
    }>;
    const row = rows[0] || {};
    return {
      mode,
      busy: Number(row.busy ?? 0),
      log: Number(row.log ?? 0),
      checkpointed: Number(row.checkpointed ?? 0),
    };
  }

  /**
   * Creates a consistent single-file SQLite snapshot (including all committed WAL frames)
   * using `VACUUM INTO`, then verifies integrity and foreign keys in read-only mode.
   * Never overwrites an existing file or modifies the active database.
   */
  public createConsistentBackup(backupTargetPath?: string): BackupVerificationResult {
    if (this.closed || this.dbPath === ":memory:") {
      throw new Error("Cannot create file backup from a closed or in-memory database.");
    }

    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    const targetPath = backupTargetPath
      ? path.isAbsolute(backupTargetPath)
        ? backupTargetPath
        : path.resolve(process.cwd(), backupTargetPath)
      : `${this.dbPath}.backup_${ts}`;

    if (fs.existsSync(targetPath)) {
      throw new Error(`Refusing to overwrite existing backup file: ${targetPath}`);
    }

    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    const escaped = targetPath.replace(/'/g, "''");
    this.raw.exec(`VACUUM INTO '${escaped}';`);

    const ro = new DatabaseSync(`file:${targetPath}?mode=ro`, { readOnly: true });
    try {
      const integrityRow = ro.prepare("PRAGMA integrity_check").get() as
        | { integrity_check?: string }
        | undefined;
      const integrityCheck = integrityRow?.integrity_check || "unknown";
      const fkViolations = ro.prepare("PRAGMA foreign_key_check").all();

      if (integrityCheck !== "ok" || fkViolations.length > 0) {
        throw new Error(
          `Backup verification failed (integrity=${integrityCheck}, fkViolations=${fkViolations.length})`
        );
      }

      return {
        backupPath: targetPath,
        sizeBytes: fs.statSync(targetPath).size,
        integrityCheck,
        foreignKeyViolations: fkViolations.length,
      };
    } finally {
      ro.close();
    }
  }

  /**
   * Executes `fn` inside an atomic SQLite transaction (`BEGIN IMMEDIATE` at top level,
   * or `SAVEPOINT` if nested inside an outer transaction).
   */
  public transaction<T>(fn: () => T): () => T {
    return (): T => {
      const isTopLevel = this.txDepth === 0;
      const savepointName = `sp_nested_${this.txDepth}`;
      this.txDepth++;

      if (isTopLevel) {
        this.raw.exec("BEGIN IMMEDIATE;");
      } else {
        this.raw.exec(`SAVEPOINT ${savepointName};`);
      }

      try {
        const result = fn();
        if (isTopLevel) {
          this.raw.exec("COMMIT;");
        } else {
          this.raw.exec(`RELEASE SAVEPOINT ${savepointName};`);
        }
        return result;
      } catch (err) {
        if (isTopLevel) {
          try {
            this.raw.exec("ROLLBACK;");
          } catch {
            // Ignore rollback error if transaction was already rolled back by SQLite
          }
        } else {
          try {
            this.raw.exec(`ROLLBACK TO SAVEPOINT ${savepointName};`);
            this.raw.exec(`RELEASE SAVEPOINT ${savepointName};`);
          } catch {
            // Ignore savepoint rollback error if already aborted
          }
        }
        throw err;
      } finally {
        this.txDepth--;
      }
    };
  }

  public isClosed(): boolean {
    return this.closed;
  }

  public close(): void {
    if (this.closed) return;
    this.closed = true;
    if (singletonDb === this) {
      singletonDb = null;
    }
    this.raw.close();
  }
}

let singletonDb: AppDatabase | null = null;

export function getDatabase(customPath?: string): AppDatabase {
  if (customPath) {
    return new AppDatabase(customPath);
  }
  const desiredPath = resolveDatabasePath();
  if (!singletonDb || singletonDb.isClosed() || singletonDb.dbPath !== desiredPath) {
    if (singletonDb && !singletonDb.isClosed()) {
      singletonDb.close();
    }
    singletonDb = new AppDatabase(desiredPath);
  }
  return singletonDb;
}
