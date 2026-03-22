import '../css/style.css';

// --- Config from Vite env (replaces Express /config.json endpoint) ---
const BASE_URL = import.meta.env.VITE_BASE_URL || 'https://api.themoviedb.org/3';
const IMG_BASE = import.meta.env.VITE_IMG_BASE || 'https://image.tmdb.org/t/p/w500';
const API_KEY  = import.meta.env.VITE_API_KEY  || '';

// --- State ---
let allFilms        = [];
let filteredFilms   = [];
let genres          = {};
let activeGenreId   = 0;
let sortDesc        = true;
let currentPage     = 1;
let perPage         = 50;
let searchQuery     = '';
let searchTimer     = null;
let totalTMDBPages  = 1;
let currentTMDBPage = 1;

// --- API ---
async function tmdbFetch(path, params = {}) {
  const url = new URL(BASE_URL + path);
  url.searchParams.set('api_key', API_KEY);
  url.searchParams.set('language', 'en-US');
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  return res.json();
}

// --- Data Loading ---
async function loadFilms() {
  showSkeleton();
  try {
    let data;
    if (searchQuery.trim()) {
      data = await tmdbFetch('/search/movie', { query: searchQuery, page: currentTMDBPage });
    } else if (activeGenreId) {
      data = await tmdbFetch('/discover/movie', {
        with_genres: activeGenreId,
        sort_by: sortDesc ? 'vote_average.desc' : 'vote_average.asc',
        'vote_count.gte': 200,
        page: currentTMDBPage,
      });
    } else {
      data = await tmdbFetch('/discover/movie', {
        sort_by: sortDesc ? 'vote_average.desc' : 'vote_average.asc',
        'vote_count.gte': 500,
        page: currentTMDBPage,
      });
    }

    totalTMDBPages = Math.min(data.total_pages || 1, 250);
    allFilms       = data.results || [];
    filteredFilms  = allFilms;

    renderFilms();
    renderPagination(data.total_results || 0);
  } catch {
    document.getElementById('film-list').innerHTML =
      '<div class="no-results">Gagal memuat data. Coba refresh halaman.</div>';
  }
}

// --- Rendering ---
function buildGenreMenu(list) {
  const menu = document.getElementById('genre-menu');
  menu.innerHTML = '<div class="dropdown-item" data-genre-id="0">All Genres</div>';
  list.forEach(g => {
    const el = document.createElement('div');
    el.className       = 'dropdown-item';
    el.textContent     = g.name;
    el.dataset.genreId   = g.id;
    el.dataset.genreName = g.name;
    menu.appendChild(el);
  });

  menu.addEventListener('click', e => {
    const item = e.target.closest('.dropdown-item');
    if (!item) return;
    filterGenre(Number(item.dataset.genreId), item.textContent.trim());
  });
}

function renderFilms() {
  const list = document.getElementById('film-list');
  if (!filteredFilms.length) {
    list.innerHTML = '<div class="no-results">Tidak ada film ditemukan.</div>';
    document.getElementById('page-title').textContent = 'All Films (0)';
    return;
  }

  const start     = (currentPage - 1) * perPage;
  const pageFilms = filteredFilms.slice(start, start + perPage);

  list.innerHTML = pageFilms.map(film => {
    const poster     = film.poster_path ? IMG_BASE + film.poster_path : '';
    const rating     = film.vote_average ? film.vote_average.toFixed(1) : 'N/A';
    const year       = film.release_date ? film.release_date.split('-')[0] : '';
    const filmGenres = (film.genre_ids || []).map(id => genres[id]).filter(Boolean);
    const desc       = film.overview || 'No description available.';
    const truncDesc  = desc.length > 200 ? desc.slice(0, 200) + '...' : desc;

    return `
      <div class="film-item">
        ${poster
          ? `<img class="film-poster" src="${poster}" alt="${escHtml(film.title)}" loading="lazy" onerror="this.style.background='#1a1a1a';this.src=''">` 
          : `<div class="film-poster" style="display:flex;align-items:center;justify-content:center;color:#333;font-size:0.7rem;text-align:center;padding:0.5rem;">No Poster</div>`
        }
        <div class="film-info">
          <div class="film-title">${escHtml(film.title)} <span class="film-year">${year}</span></div>
          <div class="film-tags">${filmGenres.map(g => `<span class="tag">${g}</span>`).join('')}</div>
          <div class="imdb-row">
            <span class="imdb-badge">TMDB</span>
            <span class="imdb-score">${rating} <span class="star">★</span></span>
            <span style="font-size:0.72rem;color:#555;">(${(film.vote_count || 0).toLocaleString()} votes)</span>
          </div>
          <div class="film-desc">${escHtml(truncDesc)}</div>
          <div class="film-actions">
            <a href="https://www.themoviedb.org/movie/${film.id}" target="_blank" class="btn-view">View Details</a>
            <button class="btn-watchlist" data-title="${escAttr(film.title)}">Add to Watchlists</button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  list.querySelectorAll('.btn-watchlist').forEach(btn => {
    btn.addEventListener('click', () => addToWatchlist(btn, btn.dataset.title));
  });
}

function renderPagination(totalResults) {
  const localPages  = Math.ceil(filteredFilms.length / perPage);
  const grandTotal  = Math.min(totalResults, 5000);

  document.getElementById('page-title').textContent = `All Films (${grandTotal.toLocaleString()}+)`;

  const startItem = (currentTMDBPage - 1) * 20 + (currentPage - 1) * perPage + 1;
  const endItem   = Math.min(startItem + perPage - 1, grandTotal);
  document.getElementById('pagination-info').textContent = `${startItem} - ${endItem} of ${grandTotal.toLocaleString()}`;

  const btns = document.getElementById('page-btns');
  btns.innerHTML = '';

  const makeBtn = (html, disabled, title, onClick) => {
    const btn      = document.createElement('button');
    btn.className  = 'page-btn';
    btn.innerHTML  = html;
    btn.disabled   = disabled;
    if (title) btn.title = title;
    btn.addEventListener('click', onClick);
    return btn;
  };

  btns.append(
    makeBtn('&#171;', currentTMDBPage <= 1, 'Previous batch', () => {
      currentTMDBPage--; currentPage = 1; loadFilms(); scrollToTop();
    }),
    makeBtn('&#8249;', currentPage <= 1 && currentTMDBPage <= 1, null, () => {
      if (currentPage > 1) { currentPage--; renderFilms(); renderPagination(totalResults); }
      else if (currentTMDBPage > 1) { currentTMDBPage--; currentPage = Math.ceil(20 / perPage); loadFilms(); }
      scrollToTop();
    }),
  );

  for (let i = 1; i <= localPages; i++) {
    const btn = makeBtn(String(i), false, null, () => {
      currentPage = i; renderFilms(); renderPagination(totalResults); scrollToTop();
    });
    if (i === currentPage) btn.classList.add('active');
    btns.appendChild(btn);
  }

  btns.append(
    makeBtn('&#8250;', currentPage >= localPages && currentTMDBPage >= totalTMDBPages, null, () => {
      if (currentPage < localPages) { currentPage++; renderFilms(); renderPagination(totalResults); }
      else if (currentTMDBPage < totalTMDBPages) { currentTMDBPage++; currentPage = 1; loadFilms(); }
      scrollToTop();
    }),
    makeBtn('&#187;', currentTMDBPage >= totalTMDBPages, 'Next batch', () => {
      currentTMDBPage++; currentPage = 1; loadFilms(); scrollToTop();
    }),
  );
}

function showSkeleton() {
  document.getElementById('film-list').innerHTML = Array(5).fill(`
    <div class="skeleton-item">
      <div class="skeleton-poster"></div>
      <div class="skeleton-info">
        <div class="skeleton-line" style="width:55%;height:18px"></div>
        <div class="skeleton-line" style="width:40%;height:12px"></div>
        <div class="skeleton-line" style="width:20%;height:12px"></div>
        <div class="skeleton-line" style="width:90%;height:12px"></div>
        <div class="skeleton-line" style="width:80%;height:12px"></div>
        <div class="skeleton-line" style="width:35%;height:12px"></div>
      </div>
    </div>
  `).join('');
}

// --- UI Interactions ---
function toggleGenre() {
  document.getElementById('genre-menu').classList.toggle('open');
}

function filterGenre(id, name) {
  activeGenreId   = id;
  currentTMDBPage = 1;
  currentPage     = 1;
  document.getElementById('genre-menu').classList.remove('open');

  const btn = document.getElementById('genre-btn');
  btn.innerHTML = `${name.toUpperCase()} <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg>`;
  btn.classList.toggle('active-filter', id !== 0);

  loadFilms();
}

function toggleSort() {
  sortDesc = !sortDesc;
  document.getElementById('sort-btn').innerHTML =
    `SORT BY TMDB ${sortDesc ? '↓' : '↑'} <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4"/></svg>`;
  currentTMDBPage = 1;
  currentPage     = 1;
  if (!searchQuery) loadFilms();
}

function onSearch() {
  clearTimeout(searchTimer);
  searchQuery = document.getElementById('search-input').value;
  searchTimer = setTimeout(() => {
    currentTMDBPage = 1;
    currentPage     = 1;
    loadFilms();
  }, 500);
}

function onPerPageChange() {
  perPage     = parseInt(document.getElementById('per-page').value, 10);
  currentPage = 1;
  renderFilms();
}

function addToWatchlist(btn, title) {
  btn.textContent          = '✓ Added';
  btn.style.borderColor    = 'var(--orange)';
  btn.style.color          = 'var(--orange)';
  setTimeout(() => {
    btn.textContent       = 'Add to Watchlists';
    btn.style.borderColor = '';
    btn.style.color       = '';
  }, 2000);
}

// --- Utilities ---
function escHtml(str) {
  return String(str)
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;');
}

function escAttr(str) {
  return String(str).replace(/'/g, "\\'");
}

function scrollToTop() {
  window.scrollTo(0, 0);
}

// --- Event Listeners ---
function initEventListeners() {
  document.getElementById('genre-btn').addEventListener('click', toggleGenre);
  document.getElementById('sort-btn').addEventListener('click', toggleSort);
  document.getElementById('search-input').addEventListener('input', onSearch);
  document.getElementById('per-page').addEventListener('change', onPerPageChange);

  document.addEventListener('click', e => {
    if (!e.target.closest('.dropdown-wrapper')) {
      document.getElementById('genre-menu').classList.remove('open');
    }
  });
}

// --- Init ---
async function init() {
  if (!API_KEY) {
    document.getElementById('film-list').innerHTML =
      '<div class="no-results">⚠️ API Key belum diset. Tambahkan VITE_API_KEY di file .env</div>';
    return;
  }

  try {
    const genreRes = await tmdbFetch('/genre/movie/list');
    genreRes.genres.forEach(g => (genres[g.id] = g.name));
    buildGenreMenu(genreRes.genres);
    document.getElementById('main-container').style.display = 'block';
    await loadFilms();
  } catch {
    document.getElementById('film-list').innerHTML =
      '<div class="no-results">Gagal memuat data dari TMDB.</div>';
  }
}

initEventListeners();
init();
