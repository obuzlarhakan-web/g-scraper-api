const express = require('express');
const bodyParser = require('body-parser');
const scraper = require('./scraper');

const app = express();
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'G-Scraper API çalışıyor' });
});

app.post('/scrape', async (req, res) => {
  try {
    const { keyword, location, limit, filters } = req.body || {};
    if (!keyword || !location) {
      return res.status(400).json({ error: 'keyword ve location gerekli' });
    }

    const results = await scraper.searchPlaces({
      keyword,
      location,
      limit: limit || 20,
      filters: filters || {}
    });

    res.json({ results });
  } catch (err) {
    console.error('Scraper hata:', err);
    res.status(500).json({ error: 'Scraping hatası', detail: String(err) });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Scraper API listening on port', PORT);
});
