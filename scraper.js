const puppeteer = require('puppeteer');

/**
 * Google Maps Scraper (Render uyumlu + gelişmiş)
 */
async function searchPlaces({ keyword, location, limit, filters }) {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--no-zygote',
      '--no-first-run',
      '--window-size=1920,1080'
    ]
  });

  const page = await browser.newPage();

  // Bot algılamasını azalt
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'
  );

  const query = encodeURIComponent(`${keyword} ${location}`);
  const url = `https://www.google.com/maps/search/${query}`;

  console.log("Maps URL:", url);

  await page.goto(url, { waitUntil: 'networkidle0', timeout: 120000 });

  // Liste panelinin yüklenmesini bekle
  await page.waitForSelector('div[role="feed"]', { timeout: 60000 });

  // Scroll ederek daha fazla sonuç yükle
  const scrollContainer = 'div[role="feed"]';

  for (let i = 0; i < 10; i++) {
    try {
      await page.evaluate((sel) => {
        const el = document.querySelector(sel);
        if (el) el.scrollBy(0, 1000);
      }, scrollContainer);
      await page.waitForTimeout(800);
    } catch (_) {}
  }

  // Artık sonuçları toplayalım
  const results = await page.evaluate((max) => {
    const out = [];

    const items = document.querySelectorAll('div[role="article"]');

    items.forEach((el) => {
      if (out.length >= max) return;

      // İsim
      const nameEl = el.querySelector('div[role="heading"]');
      const name = nameEl ? nameEl.textContent.trim() : null;

      // Rating
      let rating = null;
      const ratingEl = el.querySelector('span[aria-label*="yıldız"], span[aria-label*="star"]');
      if (ratingEl) {
        const m = ratingEl.getAttribute('aria-label').match(/([\d,.]+)/);
        rating = m ? parseFloat(m[1].replace(',', '.')) : null;
      }

      // Adres
      const addressEl = el.querySelector('[aria-label*="Adres"], [aria-label*="Address"]');
      const address = addressEl ? addressEl.textContent.trim() : null;

      // (Telefon / Website / Review / Koordinat için detay paneline girmek gerek — sonra eklenebilir)

      out.push({
        name,
        address,
        rating,
        reviews_count: null,
        phone: null,
        website: null,
        lat: null,
        lng: null
      });
    });

    return out;
  }, limit || 20);

  await browser.close();
  return results;
}

module.exports = { searchPlaces };
