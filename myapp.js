require('dotenv').config();
const express = require('express')
const app = express()
const port = 3000

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const cors = require('cors');
app.use(cors({optionsSuccessStatus: 200}));

app.use(express.static('public'));

////////////////////////////////////////////////////////////

const urls = [];

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
})

app.get('/api', (req, res) => {
    res.send('Oh, hi there! Welcome to my URL Shortener Microservice API. To use this service, append "/new/[your-url]" to the URL.');
})

app.post('/api/shorturl', (req, res) => {
    const originalUrl = req.body.url;
    urls.push(originalUrl);

    const urlIndex = urls.indexOf(originalUrl) + 1;

    res.json({ original_url: originalUrl, short_url: urlIndex });
    console.log(urls);
});

app.get('/api/shorturl/:index', (req, res) => {
    const index = parseInt(req.params.index) - 1;
    const originalUrl = urls[index];

    if (originalUrl) {
        res.redirect(originalUrl);
    } else {
        res.json({ error: 'No short URL found for the given input' });
    }
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})