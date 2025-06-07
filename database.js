const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('comments.db');

// ایجاد جدول اگر وجود نداشته باشد
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_url TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    comment TEXT NOT NULL,
    scheduled_time TEXT NOT NULL,
    status TEXT DEFAULT 'pending'
  )`);
});

module.exports = db;
