const puppeteer = require('puppeteer');

/**
 * NOT:
 * Google Maps arayüzü zamanla değişebilir.
 * Selektörleri gerektiğinde güncelleyebilmen için kodu basit tuttum.
 */

async function searchPlaces({ keyword, location, limit, filters }) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  const query = encodeURIComponent(`${keyword} ${location}`);
  const url = `https://www.google.com/maps/search/${query}`;
  await page.goto(url, { waitUntil: 'networkidle2' });

  // Liste elemanlarını al
  await page.waitForTimeout(5000);

  const results = await page.evaluate((maxResults) => {
    const data = [];
    const items = document.querySelectorAll('div[role="article"]');
    for (let i = 0; i < items.length && data.length < maxResults; i++) {
      const el = items[i];
      const nameEl = el.querySelector('div[aria-level="3"]');
      const name = nameEl ? nameEl.textContent.trim() : null;

      const ratingEl = el.querySelector('span[aria-label*="yıldız"]');
      let rating = null;
      if (ratingEl) {
        const m = ratingEl.getAttribute('aria-label').match(/([\d,\.]+)/);
        rating = m ? parseFloat(m[1].replace(',', '.')) : null;
      }

      const addressEl = el.querySelector('div[aria-label*="Adres"]');
      const address = addressEl ? addressEl.textContent.trim() : null;

      // Detaya girmeden basit liste bilgisi
      data.push({
        name,
        address,
        rating,
        reviews_count: null,
        phone: null,
        website: null,
        lat: null,
        lng: null
      });
    }
    return data;
  }, limit || 20);

  await browser.close();

  // Basit filtreler (şimdilik telefon/website info yok, ileride detay sayfasına girip çekebilirsin)
  return results;
}

module.exports = { searchPlaces };
