import '../css/style.css';

const BASE_URL = import.meta.env.VITE_BASE_URL || 'https://api.themoviedb.org/3';
const IMG_BASE  = import.meta.env.VITE_IMG_BASE  || 'https://image.tmdb.org/t/p/w500';
const API_KEY   = import.meta.env.VITE_API_KEY   || '';

// ── Watchlist helpers (same as films.js) ─────────────────────────────────────
function getMyList() {
  try { return JSON.parse(localStorage.getItem('moviespace_mylist') || '[]'); } catch { return []; }
}
function saveMyList(list) {
  localStorage.setItem('moviespace_mylist', JSON.stringify(list));
}
function isInList(id) {
  return getMyList().some(f => f.id === id);
}

async function tmdbFetch(path, params = {}) {
  const url = new URL(BASE_URL + path);
  url.searchParams.set('api_key', API_KEY);
  url.searchParams.set('language', 'en-US');
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  return res.json();
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatRuntime(min) {
  if (!min) return '';
  const h = Math.floor(min / 60), m = min % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
}

// ── My List button — same logic as films.js ───────────────────────────────────
function bindMyListBtn(filmData) {
  const btn = document.getElementById('btn-mylist');

  const update = () => {
    if (isInList(filmData.id)) {
      btn.textContent = '✓ In My List';
      btn.classList.add('border-orange-500', 'text-orange-400');
      btn.classList.remove('border-white/10', 'text-gray-400');
    } else {
      btn.textContent = 'Add to My List';
      btn.classList.remove('border-orange-500', 'text-orange-400');
      btn.classList.add('border-white/10', 'text-gray-400');
    }
  };

  btn.dataset.film = JSON.stringify(filmData);
  update();

  btn.addEventListener('click', () => {
    const data = JSON.parse(btn.dataset.film);
    const list = getMyList();
    const idx  = list.findIndex(f => f.id === data.id);
    if (idx === -1) { list.push(data); } else { list.splice(idx, 1); }
    saveMyList(list);
    update();
  });
}

async function loadDetail(movieId) {
  try {
    const detail = await tmdbFetch(`/movie/${movieId}`);

    document.getElementById('skeleton-detail').classList.add('hidden');
    document.getElementById('film-detail').classList.remove('hidden');

    document.title = `MovieSpace — ${detail.title}`;

    // Breadcrumb
    document.getElementById('breadcrumb-title').textContent = detail.title;

    // Poster
    const poster = document.getElementById('detail-poster');
    if (detail.poster_path) {
      poster.src = IMG_BASE + detail.poster_path;
      poster.alt = detail.title;
    } else {
      poster.closest('div').style.display = 'none';
    }

    // Basic info
    document.getElementById('detail-title').textContent    = detail.title;
    document.getElementById('detail-year').textContent     = detail.release_date ? detail.release_date.split('-')[0] : '';
    document.getElementById('detail-runtime').textContent  = formatRuntime(detail.runtime);
    document.getElementById('detail-language').textContent = detail.original_language || '';
    document.getElementById('detail-tagline').textContent  = detail.tagline || '';
    document.getElementById('detail-overview').textContent = detail.overview || 'No description available.';

    // Rating
    const rating = detail.vote_average ? detail.vote_average.toFixed(1) : 'N/A';
    document.getElementById('detail-rating').textContent     = `${rating} ★`;
    document.getElementById('detail-votes').textContent      = detail.vote_count ? `(${detail.vote_count.toLocaleString()} votes)` : '';
    document.getElementById('detail-popularity').textContent = detail.popularity ? `Popularity: ${detail.popularity.toFixed(0)}` : '';

    // Genres
    document.getElementById('detail-genres').innerHTML = (detail.genres || []).map(g =>
      `<span class="text-xs px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">${escHtml(g.name)}</span>`
    ).join('');

    // TMDB link
    document.getElementById('btn-tmdb').href = `https://www.themoviedb.org/movie/${movieId}`;

    // My List button
    const filmData = {
      id:           detail.id,
      title:        detail.title,
      poster_path:  detail.poster_path,
      vote_average: detail.vote_average,
      vote_count:   detail.vote_count,
      release_date: detail.release_date,
      genre_ids:    (detail.genres || []).map(g => g.id),
      overview:     detail.overview,
    };
    bindMyListBtn(filmData);

  } catch (err) {
    document.getElementById('skeleton-detail').innerHTML =
      '<div class="py-8 text-center text-gray-500">Gagal memuat data. Coba refresh halaman.</div>';
    console.error(err);
  }
}

// ── Init ──────────────────────────────────────────────────────────────────────
const params  = new URLSearchParams(location.search);
const movieId = params.get('id');

if (!movieId) {
  document.getElementById('skeleton-detail').innerHTML =
    '<div class="py-8 text-center text-gray-500">Film tidak ditemukan. <a href="films.html" class="text-orange-400">← Back</a></div>';
} else if (!API_KEY) {
  document.getElementById('skeleton-detail').innerHTML =
    '<div class="py-8 text-center text-gray-500">⚠️ API Key belum diset. Tambahkan VITE_API_KEY di file .env</div>';
} else {
  loadDetail(movieId);
}
