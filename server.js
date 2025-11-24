const express = require('express');
const bodyParser = require('body-parser');
const scraper = require('./api/scraper');

const app = express();
app.use(bodyParser.json());

// API canlı mı kontrol için
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'G-Scraper API çalışıyor' });
});

// Scraping endpoint
app.post('/scrape', async (req, res) => {
  try {
    const { keyword, location, limit, filters } = req.body || {};

    if (!keyword || !location) {
      return res.status(400).json({
        error: 'keyword ve location gerekli'
      });
    }

    console.log("Scrape isteği alındı:", {
      keyword,
      location,
      limit,
      filters
    });

    const results = await scraper.searchPlaces({
      keyword,
      location,
      limit: limit || 20,
      filters: filters || {}
    });

    return res.json({ results });

  } catch (err) {
    console.error('Scraper HATA:', err);
    return res.status(500).json({
      error: 'Scraping hatası',
      detail: String(err)
    });
  }
});

// Render ve Railway ile uyumlu port seçimi
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Scraper API listening on port ${PORT}`);
});
