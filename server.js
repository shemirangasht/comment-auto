const express = require('express');
const bodyParser = require('body-parser');
const db = require('./database');
const schedule = require('node-schedule');
const cors = require('cors');
const puppeteer = require('puppeteer-core');


const app = express();
app.use(bodyParser.json());
app.use(cors());


// ثبت کامنت جدید
app.post('/add-comment', (req, res) => {
  const { post_url, name, email, comment, scheduled_time } = req.body;

  db.run(
    `INSERT INTO comments (post_url, name, email, comment, scheduled_time) VALUES (?, ?, ?, ?, ?)`,
    [post_url, name, email, comment, scheduled_time],
    function (err) {
      if (err) {
        console.error('❌ خطا در افزودن کامنت:', err);
        return res.status(500).send('خطا در افزودن کامنت');
      }

      // زمان‌بندی اجرای ارسال
      scheduleComment(this.lastID, scheduled_time);
      res.send('✅ کامنت ثبت و زمان‌بندی شد');
    }
  );
});

// اجرای زمان‌بندی
function scheduleComment(id, time) {
  schedule.scheduleJob(new Date(time), async () => {
    db.get(`SELECT * FROM comments WHERE id = ?`, [id], async (err, row) => {
      if (err || !row) return;

   try {
  console.log(`🕒 در حال ارسال کامنت برای: ${row.post_url}`);
  const browser = await puppeteer.launch({
    headless: true,
executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
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

  db.run(`UPDATE comments SET status = 'sent' WHERE id = ?`, [id]);
} catch (error) {
  console.error('❌ اشکال در ارسال کامنت:', error.message);
}

    });
  });
}

// هنگام شروع، همه کامنت‌های در انتظار رو دوباره زمان‌بندی کن
db.all(`SELECT id, scheduled_time FROM comments WHERE status = 'pending'`, [], (err, rows) => {
  if (!err) {
    const now = new Date();

    rows.forEach(row => {
      const scheduledTime = new Date(row.scheduled_time);

      if (scheduledTime <= now) {
        console.log(`⚠️ زمان گذشته برای ID ${row.id} → اجرای فوری در 2 ثانیه...`);
        scheduleComment(row.id, new Date(Date.now() + 2000));
      } else {
        scheduleComment(row.id, scheduledTime);
      }
    });
  }
});


// راه‌اندازی سرور
app.listen(3000, () => {
  console.log('🚀 سرور روی پورت 3000 اجرا شد');
});

// نمایش لیست کامنت‌ها
app.get('/comments', (req, res) => {
  db.all('SELECT * FROM comments ORDER BY scheduled_time DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: 'خطا در دریافت کامنت‌ها' });
    res.json(rows);
  });
});

// حذف کامنت
app.delete('/comments/:id', (req, res) => {
  const id = req.params.id;
  db.run('DELETE FROM comments WHERE id = ?', [id], function(err) {
    if (err) return res.status(500).json({ error: 'خطا در حذف کامنت' });
    res.json({ success: true });
  });
});
