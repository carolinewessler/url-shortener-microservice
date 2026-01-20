require('dotenv').config();

const express = require('express');
const app = express();
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const dns = require('node:dns');

app.use(cors());
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// --- Schema + Model (UMA ÚNICA VEZ) ---
const urlSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    short_url: { type: Number, required: true, unique: true }
  },
  { versionKey: false }
);

const Url = mongoose.model('Url', urlSchema);

// --- Routes ---
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'views', 'index.html'));
});

function getHostnameIfValidUrl(input) {
  try {
    const parsed = new URL(input);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    return parsed.hostname;
  } catch {
    return null;
  }
}

function dnsLookup(hostname) {
  return new Promise((resolve, reject) => {
    dns.lookup(hostname, (err, address) => {
      if (err || !address) reject(err);
      else resolve(address);
    });
  });
}


app.post('/api/shorturl', async (req, res) => {
  const hostname = getHostnameIfValidUrl(req.body.url);
  if (!hostname) return res.json({ error: 'invalid url' });

  try {
    await dnsLookup(hostname);

    const existing = await Url.findOne({ url: req.body.url });
    if (existing) {
      return res.json({
        url: existing.url,
        short_url: existing.short_url
      });
    }

    const count = await Url.countDocuments();
    const created = await Url.create({
      url: req.body.url,
      short_url: count + 1
    });

    return res.json({
      original_url: created.url,
      short_url: created.short_url
    });
  } catch (err) {
    return res.json({ error: 'invalid url' });
  }
});


app.get('/api/shorturl/:short_url', async (req, res) => {
  try {
    const found = await Url.findOne({ short_url: req.params.short_url });

    if (found) {
      return res.redirect(found.url);
    } else {
      return res.status(404).json({ error: 'No short URL found for the given input' });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'database error' });
  }
});

module.exports = app;
