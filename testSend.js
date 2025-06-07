const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: false, slowMo: 100 });
  const page = await browser.newPage();

  await page.goto("https://shemirangasht.com/ireland-residency-fintech-step/", {
    waitUntil: 'domcontentloaded',
    timeout: 60000
  });

  await page.type('#author', 'تست دستی');
  await page.type('#email', 'test@example.com');
  await page.type('#comment', 'این یک تست مستقیم است');
  await page.click('#submit');

  console.log("کامنت ارسال شد!");
  await page.waitForTimeout(5000);
  await browser.close();
})();
