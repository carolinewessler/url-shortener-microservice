require('dotenv').config();
const express = require('express')
const app = express()
const port = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const cors = require('cors');
app.use(cors({optionsSuccessStatus: 200}));

app.use(express.static('public'));

const dns = require('node:dns');
////////////////////////////////////////////////////////////

const urls = [];

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
})

app.post('/api/shorturl', (req, res) => {
  const originalUrl = req.body.url;
  let hostname;

  try {
    hostname = new URL(originalUrl).hostname;
  } catch {
    return res.json({ error: 'invalid url' });
  }

  dns.lookup(hostname, (err) => {
    if (err) return res.json({ error: 'invalid url' });

    urls.push(originalUrl);
    const shortUrl = urls.length;

    return res.json({ original_url: originalUrl, short_url: shortUrl });
  });
});


app.get('/api/shorturl/:short_url', (req, res) => {
    const short_url = parseInt(req.params.short_url) - 1;
    const originalUrl = urls[short_url];

    if (originalUrl) {
        res.redirect(originalUrl);
    } else {
        res.json({ error: 'No short URL found for the given input' });
    }
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})