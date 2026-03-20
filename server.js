import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files (css, js, pages)
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));

// Expose only safe, non-secret env vars to frontend
// API_KEY is safe to expose here since TMDB keys are public-facing
app.get('/config.json', (req, res) => {
  res.json({
    BASE_URL: process.env.BASE_URL || 'https://api.themoviedb.org/3',
    IMG_BASE: process.env.IMG_BASE || 'https://image.tmdb.org/t/p/w500',
    API_KEY: process.env.API_KEY || '',
  });
});

// Serve HTML pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'login.html'));
});

app.use('/pages', express.static(path.join(__dirname, 'pages')));

app.listen(PORT, () => {
  console.log(`🎬 MovieSpace running at http://localhost:${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
});
