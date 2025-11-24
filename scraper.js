const puppeteer = require("puppeteer");
const path = require("path");

async function searchPlaces({ keyword, location, limit }) {
  console.log("SCRAPER.JS: Render için özel Chrome path'i kullanılıyor");

  const chromePath = "/opt/render/.cache/puppeteer/chrome/linux-127.0.6533.88/chrome-linux64/chrome";

  const browser = await puppeteer.launch({
    headless: "new",
    executablePath: chromePath,       // 🔥 ÖNEMLİ SATIR
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

  console.log("Gidilen URL:", url);
  await page.goto(url, { waitUntil: "networkidle2", timeout: 120000 });

  await page.waitForSelector('div[role="feed"]', { timeout: 60000 });

  const results = await page.evaluate((max) => {
    const out = [];
    const items = document.querySelectorAll('div[role="article"]');

    items.forEach((item) => {
      if (out.length >= max) return;

      const name = item.querySelector('div[role="heading"]')?.textContent?.trim() || null;
      const address = item.querySelector('[aria-label*="Adres"], [aria-label*="Address"]')?.textContent?.trim() || null;

      out.push({
        name,
        address,
        rating: null,
        phone: null,
        website: null,
        lat: null,
        lng: null,
        reviews_count: null,
      });
    });

    return out;
  }, limit || 20);

  await browser.close();
  return results;
}

module.exports = { searchPlaces };
