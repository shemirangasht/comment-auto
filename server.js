const express = require('express');
const bodyParser = require('body-parser');
const db = require('./database');
const schedule = require('node-schedule');
const cors = require('cors');
const { chromium } = require('playwright');

const app = express();
app.use(bodyParser.json());
app.use(cors());

// ثبت کامنت جدید
app.post('/add-comment', (req, res) => {
  const { post_url, name, email, comment, scheduled_time } = req.body;

  try {
    const stmt = db.prepare(`INSERT INTO comments (post_url, name, email, comment, scheduled_time) VALUES (?, ?, ?, ?, ?)`);
    const info = stmt.run(post_url, name, email, comment, scheduled_time);

    scheduleComment(info.lastInsertRowid, scheduled_time);
    res.send('✅ کامنت ثبت و زمان‌بندی شد');
  } catch (err) {
    console.error('❌ خطا در افزودن کامنت:', err);
    res.status(500).send('خطا در افزودن کامنت');
  }
});

// اجرای زمان‌بندی
function scheduleComment(id, time) {
  schedule.scheduleJob(new Date(time), async () => {
    try {
      const row = db.prepare(`SELECT * FROM comments WHERE id = ?`).get(id);
      if (!row) return;

      console.log(`🕒 در حال ارسال کامنت برای: ${row.post_url}`);
      const browser = await chromium.launch({
  headless: true,
});

      const page = await browser.newPage();

      await page.goto(row.post_url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.type('#author', row.name);
      await page.type('#email', row.email);
      await page.type('#comment', row.comment);
      await page.click('#submit');

      console.log('✅ کامنت ارسال شد!');
      await new Promise(resolve => setTimeout(resolve, 3000));
      await browser.close();

      db.prepare(`UPDATE comments SET status = 'sent' WHERE id = ?`).run(id);

    } catch (error) {
      console.error('❌ اشکال در ارسال کامنت:', error.message);
    }
  });
}

// زمان‌بندی مجدد کامنت‌های در انتظار هنگام شروع
try {
  const now = new Date();
  const rows = db.prepare(`SELECT id, scheduled_time FROM comments WHERE status = 'pending'`).all();

  rows.forEach(row => {
    const scheduledTime = new Date(row.scheduled_time);
    if (scheduledTime <= now) {
      console.log(`⚠️ زمان گذشته برای ID ${row.id} → اجرای فوری در 2 ثانیه...`);
      scheduleComment(row.id, new Date(Date.now() + 2000));
    } else {
      scheduleComment(row.id, scheduledTime);
    }
  });
} catch (err) {
  console.error('❌ خطا در زمان‌بندی اولیه:', err.message);
}

// نمایش لیست کامنت‌ها
app.get('/comments', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM comments ORDER BY scheduled_time DESC').all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'خطا در دریافت کامنت‌ها' });
  }
});

// حذف کامنت
app.delete('/comments/:id', (req, res) => {
  const id = req.params.id;
  try {
    db.prepare('DELETE FROM comments WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'خطا در حذف کامنت' });
  }
});

// راه‌اندازی سرور
app.listen(3000, () => {
  console.log('🚀 سرور روی پورت 3000 اجرا شد');
});
