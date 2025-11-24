const puppeteer = require("puppeteer");

async function searchPlaces({ keyword, location, limit }) {
  console.log("SCRAPER.JS ÇALIŞAN SÜRÜM: PUPPETEER (Chrome yüklü)");

  const browser = await puppeteer.launch({
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--no-zygote",
      "--no-first-run",
      "--window-size=1920,1080"
    ]
  });

  const page = await browser.newPage();

  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36"
  );

  const query = encodeURIComponent(`${keyword} ${location}`);
  const url = `https://www.google.com/maps/search/${query}`;

  await page.goto(url, { waitUntil: "networkidle2", timeout: 120000 });

  await page.waitForSelector('div[role="feed"]', { timeout: 60000 });

  for (let i = 0; i < 6; i++) {
    await page.evaluate(() => {
      const feed = document.querySelector('div[role="feed"]');
      if (feed) feed.scrollBy(0, 1500);
    });
    await page.waitForTimeout(600);
  }

  const results = await page.evaluate((max) => {
    const out = [];
    const items = document.querySelectorAll('div[role="article"]');

    for (const item of items) {
      if (out.length >= max) break;

      const name = item.querySelector('div[role="heading"]')?.textContent?.trim() || null;

      const address =
        item.querySelector('[aria-label*="Adres"], [aria-label*="Address"]')
          ?.textContent?.trim() || null;

      out.push({
        name,
        address,
        rating: null,
        phone: null,
        website: null,
        reviews_count: null,
        lat: null,
        lng: null
      });
    }
    return out;
  }, limit || 20);

  await browser.close();
  return results;
}

module.exports = { searchPlaces };
