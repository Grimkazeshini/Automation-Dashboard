import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.DATABASE_URL || path.join(__dirname, 'database.db');
const db = new Database(dbPath);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

// Initialize database schema
function initDatabase() {
  // Workflows table
  db.exec(`
    CREATE TABLE IF NOT EXISTS workflows (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      status TEXT NOT NULL,
      started_at TEXT NOT NULL,
      completed_at TEXT,
      result TEXT,
      error TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Logs table
  db.exec(`
    CREATE TABLE IF NOT EXISTS logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workflow_id TEXT NOT NULL,
      level TEXT NOT NULL,
      message TEXT NOT NULL,
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (workflow_id) REFERENCES workflows(id)
    )
  `);

  // Summaries table
  db.exec(`
    CREATE TABLE IF NOT EXISTS summaries (
      id TEXT PRIMARY KEY,
      workflow_id TEXT,
      content TEXT NOT NULL,
      token_count INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (workflow_id) REFERENCES workflows(id)
    )
  `);

  console.log('Database initialized successfully');
}

// Workflow operations
export const workflowDb = {
  create(workflow) {
    const stmt = db.prepare(`
      INSERT INTO workflows (id, type, status, started_at, completed_at, result, error)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    return stmt.run(
      workflow.id,
      workflow.type,
      workflow.status,
      workflow.started_at,
      workflow.completed_at || null,
      workflow.result ? JSON.stringify(workflow.result) : null,
      workflow.error || null
    );
  },

  update(id, updates) {
    const fields = [];
    const values = [];

    Object.entries(updates).forEach(([key, value]) => {
      fields.push(`${key} = ?`);
      values.push(key === 'result' && value ? JSON.stringify(value) : value);
    });

    const stmt = db.prepare(`
      UPDATE workflows SET ${fields.join(', ')} WHERE id = ?
    `);

    return stmt.run(...values, id);
  },

  getById(id) {
    const stmt = db.prepare('SELECT * FROM workflows WHERE id = ?');
    const row = stmt.get(id);
    if (row && row.result) {
      row.result = JSON.parse(row.result);
    }
    return row;
  },

  getAll(limit = 100) {
    const stmt = db.prepare(
      'SELECT * FROM workflows ORDER BY created_at DESC LIMIT ?'
    );
    const rows = stmt.all(limit);
    return rows.map(row => {
      if (row.result) {
        row.result = JSON.parse(row.result);
      }
      return row;
    });
  },

  getByStatus(status) {
    const stmt = db.prepare('SELECT * FROM workflows WHERE status = ? ORDER BY created_at DESC');
    const rows = stmt.all(status);
    return rows.map(row => {
      if (row.result) {
        row.result = JSON.parse(row.result);
      }
      return row;
    });
  }
};

// Log operations
export const logDb = {
  create(log) {
    const stmt = db.prepare(`
      INSERT INTO logs (workflow_id, level, message, timestamp)
      VALUES (?, ?, ?, ?)
    `);

    return stmt.run(
      log.workflow_id,
      log.level,
      log.message,
      log.timestamp || new Date().toISOString()
    );
  },

  getByWorkflowId(workflowId) {
    const stmt = db.prepare('SELECT * FROM logs WHERE workflow_id = ? ORDER BY timestamp ASC');
    return stmt.all(workflowId);
  },

  getAll(limit = 500) {
    const stmt = db.prepare('SELECT * FROM logs ORDER BY timestamp DESC LIMIT ?');
    return stmt.all(limit);
  }
};

// Summary operations
export const summaryDb = {
  create(summary) {
    const stmt = db.prepare(`
      INSERT INTO summaries (id, workflow_id, content, token_count)
      VALUES (?, ?, ?, ?)
    `);

    return stmt.run(
      summary.id,
      summary.workflow_id || null,
      summary.content,
      summary.token_count || null
    );
  },

  getById(id) {
    const stmt = db.prepare('SELECT * FROM summaries WHERE id = ?');
    return stmt.get(id);
  },

  getAll(limit = 50) {
    const stmt = db.prepare('SELECT * FROM summaries ORDER BY created_at DESC LIMIT ?');
    return stmt.all(limit);
  }
};

// Initialize database on import
initDatabase();

export default db;
