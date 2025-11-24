const chromium = require("@sparticuz/chromium");
const puppeteer = require("puppeteer-core");

async function searchPlaces({ keyword, location, limit }) {
  const browser = await puppeteer.launch({
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
  });

  const page = await browser.newPage();

  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36"
  );

  const query = encodeURIComponent(`${keyword} ${location}`);
  const url = `https://www.google.com/maps/search/${query}`;

  await page.goto(url, { waitUntil: "networkidle2", timeout: 120000 });

  // Sonuç listesi yüklenene kadar bekle
  await page.waitForSelector('div[role="feed"]', { timeout: 60000 });

  // Birkaç kez scroll edip daha fazla sonuç yüklüyoruz
  for (let i = 0; i < 8; i++) {
    await page.evaluate(() => {
      const feed = document.querySelector('div[role="feed"]');
      if (feed) feed.scrollBy(0, 1000);
    });
    await page.waitForTimeout(800);
  }

  const results = await page.evaluate((max) => {
    const out = [];
    const items = document.querySelectorAll('div[role="article"]');

    for (const item of items) {
      if (out.length >= max) break;

      const name =
        item.querySelector('div[role="heading"]')?.textContent?.trim() || null;

      const address =
        item.querySelector('[aria-label*="Adres"], [aria-label*="Address"]')
          ?.textContent?.trim() || null;

      let rating = null;
      const rat = item.querySelector(
        'span[aria-label*="yıldız"], span[aria-label*="star"]'
      );
      if (rat) {
        const m = rat.getAttribute("aria-label").match(/([\d,.]+)/);
        rating = m ? parseFloat(m[1].replace(",", ".")) : null;
      }

      out.push({
        name,
        address,
        rating,
        phone: null,
        website: null,
        lat: null,
        lng: null,
        reviews_count: null,
      });
    }

    return out;
  }, limit || 20);

  await browser.close();
  return results;
}

module.exports = { searchPlaces };
