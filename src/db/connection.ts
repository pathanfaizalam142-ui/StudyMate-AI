import { DatabaseSync, StatementSync } from "node:sqlite";
import path from "node:path";

export interface RunResult {
  changes: number | bigint;
  lastInsertRowid: number | bigint;
}

/**
 * Synchronous SQLite connection wrapper around Node 22 built-in `node:sqlite`
 * with mandatory WAL mode, strict foreign key enforcement, and nested transaction support.
 */
export class AppDatabase {
  public readonly raw: DatabaseSync;
  public readonly dbPath: string;
  private txDepth = 0;

  constructor(dbPath?: string) {
    this.dbPath = dbPath || process.env.SQLITE_DB_PATH || path.resolve(process.cwd(), "studymate.db");
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

  public close(): void {
    this.raw.close();
  }
}

let singletonDb: AppDatabase | null = null;

export function getDatabase(customPath?: string): AppDatabase {
  if (customPath) {
    return new AppDatabase(customPath);
  }
  if (!singletonDb) {
    singletonDb = new AppDatabase();
  }
  return singletonDb;
}
