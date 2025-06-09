const Database = require('better-sqlite3');
const db = new Database('comments.db');

// اطمینان از وجود جدول
db.prepare(`
  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_url TEXT,
    name TEXT,
    email TEXT,
    comment TEXT,
    scheduled_time TEXT,
    status TEXT
  )
`).run();

module.exports = db;
