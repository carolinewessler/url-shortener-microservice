require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const dns = require('node:dns');

const app = express();

app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use('/public', express.static(path.join(process.cwd(), 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'views', 'index.html'));
});

// --- Mongo connection ---
async function connectDB() {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI não encontrada no .env');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB conectado ✅ DB:', mongoose.connection.name);
}

connectDB().catch((err) => {
  console.error('Falha ao conectar no MongoDB:', err);
  process.exit(1);
});

// --- Models ---
const urlSchema = new mongoose.Schema(
  {
    original_url: { type: String, required: true },
    short_url: { type: Number, required: true, unique: true },
  },
  { versionKey: false }
);

const Url = mongoose.model('Url', urlSchema);

// contador atômico para short_url
const counterSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true }, // ex: 'url'
    seq: { type: Number, default: 0 },
  },
  { versionKey: false }
);

const Counter = mongoose.model('Counter', counterSchema);

async function getNextSequence(name) {
  const doc = await Counter.findOneAndUpdate(
    { _id: name },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  ).lean();

  return doc.seq;
}

function isValidUrlAndHostname(input) {
  try {
    const u = new URL(input);
    // garante http/https (FTP e outros devem falhar no FCC)
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    return u.hostname;
  } catch {
    return null;
  }
}

// --- Routes ---
app.post('/api/shorturl', (req, res) => {
  const originalUrl = req.body.url;
  const hostname = isValidUrlAndHostname(originalUrl);

  if (!hostname) return res.json({ error: 'invalid url' });

  dns.lookup(hostname, async (err) => {
    if (err) return res.json({ error: 'invalid url' });

    try {
      // Se já existe, retorna o existente (isso costuma agradar testes/repetições)
      const existing = await Url.findOne({ original_url: originalUrl }).lean();
      if (existing) {
        return res.json({
          original_url: existing.original_url,
          short_url: existing.short_url,
        });
      }

      const nextShort = await getNextSequence('url');

      const created = await Url.create({
        original_url: originalUrl,
        short_url: nextShort,
      });

      return res.json({
        original_url: created.original_url,
        short_url: created.short_url,
      });
    } catch (e) {
      console.error('Erro ao salvar URL:', e);
      return res.status(500).json({ error: 'internal error' });
    }
  });
});

app.get('/api/shorturl/:short_url', async (req, res) => {
  const shortUrl = Number(req.params.short_url);
  if (!Number.isFinite(shortUrl)) {
    return res.json({ error: 'No short URL found for the given input' });
  }

  try {
    const doc = await Url.findOne({ short_url: shortUrl }).lean();
    if (!doc) return res.json({ error: 'No short URL found for the given input' });

    return res.redirect(doc.original_url);
  } catch (e) {
    console.error('Erro no redirect:', e);
    return res.status(500).json({ error: 'internal error' });
  }
});

module.exports = app;
