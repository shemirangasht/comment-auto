// database.js
const Database = require('better-sqlite3');
const db = new Database('comments.db');

// ساخت جدول اگر وجود ندارد
db.exec(`
  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_url TEXT,
    name TEXT,
    email TEXT,
    comment TEXT,
    scheduled_time TEXT,
    status TEXT DEFAULT 'pending'
  )
`);

module.exports = db;
