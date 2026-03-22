import '../css/style.css';

// Watchlist helpers
function getMyList() {
  try { return JSON.parse(localStorage.getItem('moviespace_mylist') || '[]'); } catch { return []; }
}
function saveMyList(list) {
  localStorage.setItem('moviespace_mylist', JSON.stringify(list));
}
function isInList(id) {
  return getMyList().some(f => f.id === id);
}

const BASE_URL = import.meta.env.VITE_BASE_URL || 'https://api.themoviedb.org/3';
const IMG_BASE = import.meta.env.VITE_IMG_BASE || 'https://image.tmdb.org/t/p/w500';
const API_KEY  = import.meta.env.VITE_API_KEY  || '';

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

async function tmdbFetch(path, params = {}) {
  const url = new URL(BASE_URL + path);
  url.searchParams.set('api_key', API_KEY);
  url.searchParams.set('language', 'en-US');
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  return res.json();
}

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
      `<div class="py-8 text-center" >Gagal memuat data. Coba refresh halaman.</div>`;
  }
}

function buildGenreMenu(list) {
  const menu = document.getElementById('genre-menu');
  menu.innerHTML = `<div class="dropdown-item px-4 py-2 text-sm cursor-pointer" data-genre-id="0">All Genres</div>`;
  list.forEach(g => {
    const el = document.createElement('div');
    el.className         = 'dropdown-item px-4 py-2 text-sm cursor-pointer';
    el.textContent       = g.name;
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

// ── Film card HTML ────────────────────────────────────────────────────────────
function filmCardHTML(film) {
  const poster    = film.poster_path ? IMG_BASE + film.poster_path : '';
  const rating    = film.vote_average ? film.vote_average.toFixed(1) : 'N/A';
  const year      = film.release_date ? film.release_date.split('-')[0] : '';
  const filmGenres = (film.genre_ids || []).map(id => genres[id]).filter(Boolean);
  const desc      = film.overview || 'No description available.';
  const truncDesc = desc.length > 200 ? desc.slice(0, 200) + '...' : desc;
  const inList    = isInList(film.id);
  const filmJSON  = JSON.stringify({ id: film.id, title: film.title, poster_path: film.poster_path, vote_average: film.vote_average, vote_count: film.vote_count, release_date: film.release_date, genre_ids: film.genre_ids, overview: film.overview });

  const posterEl = poster
    ? `<img class="w-20 h-28 object-cover rounded-lg shrink-0" style="background-color:var(--bg-card)" src="${poster}" alt="${escHtml(film.title)}" loading="lazy" onerror="this.style.background='var(--bg-card)';this.src=''">`
    : `<div class="w-20 h-28 shrink-0 rounded-lg flex items-center justify-center text-xs text-center p-1" style="background-color:var(--bg-card);color:var(--text-faint)">No Poster</div>`;

  const watchlistStyle = inList
    ? `style="border-color:var(--accent);color:var(--accent)"`
    : `style="border-color:var(--border-subtle);color:var(--text-muted)"`;

  return `
    <div class="flex gap-4 rounded-xl p-4 transition-colors" style="background-color:var(--bg-card);border:1px solid var(--border-subtle)" onmouseover="this.style.borderColor='var(--border)'" onmouseout="this.style.borderColor='var(--border-subtle)'">
      ${posterEl}
      <div class="flex flex-col gap-1.5 min-w-0">
        <div class="text-sm font-semibold" >
          ${escHtml(film.title)} <span class="font-normal text-xs" >${year}</span>
        </div>
        <div class="flex flex-wrap gap-1">
          ${filmGenres.map(g => `<span class="tag">${g}</span>`).join('')}
        </div>
        <div class="flex items-center gap-2 text-xs">
          <span class="tmdb-badge">IMDb</span>
          <span class="font-semibold" >${rating} ★</span>
          <span >(${(film.vote_count || 0).toLocaleString()} votes)</span>
        </div>
        <div class="text-xs leading-relaxed" >${escHtml(truncDesc)}</div>
        <div class="flex gap-2 mt-1">
          <a href="detail.html?id=${film.id}" class="btn-primary text-xs px-3 py-1.5 rounded-lg no-underline">View Details</a>
          <button class="btn-watchlist text-xs px-3 py-1.5 rounded-lg transition-colors cursor-pointer bg-transparent" ${watchlistStyle} data-id="${film.id}" data-film='${escAttr(filmJSON)}'>${inList ? 'Remove from Watchlist' : 'Add to Watchlists'}</button>
        </div>
      </div>
    </div>
  `;
}

function renderFilms() {
  const list = document.getElementById('film-list');
  if (!filteredFilms.length) {
    list.innerHTML = `<div class="py-8 text-center" >Tidak ada film ditemukan.</div>`;
    document.getElementById('page-title').textContent = 'All Films (0)';
    return;
  }

  const start     = (currentPage - 1) * perPage;
  const pageFilms = filteredFilms.slice(start, start + perPage);

  list.innerHTML = pageFilms.map(filmCardHTML).join('');

  list.querySelectorAll('.btn-watchlist').forEach(btn => {
    btn.addEventListener('click', () => {
      const filmData = JSON.parse(btn.dataset.film);
      const saved    = getMyList();
      const idx      = saved.findIndex(f => f.id === filmData.id);
      if (idx === -1) {
        saved.push(filmData);
        btn.textContent = 'Remove from Watchlist';
        btn.style.borderColor = 'var(--accent)';
        btn.style.color       = 'var(--accent)';
      } else {
        saved.splice(idx, 1);
        btn.textContent = 'Add to Watchlists';
        btn.style.borderColor = 'var(--border-subtle)';
        btn.style.color       = 'var(--text-muted)';
      }
      saveMyList(saved);
    });
  });
}

function renderPagination(totalResults) {
  const localPages = Math.ceil(filteredFilms.length / perPage);
  const grandTotal = Math.min(totalResults, 5000);

  document.getElementById('page-title').textContent = `All Films (${grandTotal.toLocaleString()}+)`;

  const startItem = (currentTMDBPage - 1) * 20 + (currentPage - 1) * perPage + 1;
  const endItem   = Math.min(startItem + perPage - 1, grandTotal);
  document.getElementById('pagination-info').textContent =
    `${startItem} - ${endItem} of ${grandTotal.toLocaleString()}`;

  const btns = document.getElementById('page-btns');
  btns.innerHTML = '';

  const isFirst = currentPage <= 1 && currentTMDBPage <= 1;
  const isLast  = currentPage >= localPages && currentTMDBPage >= totalTMDBPages;

  const makeArrow = (symbol, disabled, onClick) => {
    const btn     = document.createElement('button');
    btn.innerHTML = symbol;
    btn.disabled  = disabled;
    btn.className = 'disabled:opacity-25 disabled:cursor-not-allowed transition-colors text-lg leading-none cursor-pointer bg-transparent border-none p-0';
    btn.style.color = 'var(--text-muted)';
    btn.addEventListener('mouseover', () => { if (!disabled) btn.style.color = 'var(--text)'; });
    btn.addEventListener('mouseout',  () => { btn.style.color = 'var(--text-muted)'; });
    btn.addEventListener('click', onClick);
    return btn;
  };

  // Prev ‹
  btns.appendChild(makeArrow('&#8249;', isFirst, () => {
    if (currentPage > 1) { currentPage--; renderFilms(); renderPagination(totalResults); }
    else if (currentTMDBPage > 1) { currentTMDBPage--; currentPage = Math.ceil(20 / perPage); loadFilms(); }
    scrollToTop();
  }));

  // Next ›
  btns.appendChild(makeArrow('&#8250;', isLast, () => {
    if (currentPage < localPages) { currentPage++; renderFilms(); renderPagination(totalResults); }
    else if (currentTMDBPage < totalTMDBPages) { currentTMDBPage++; currentPage = 1; loadFilms(); }
    scrollToTop();
  }));
}

function showSkeleton() {
  document.getElementById('film-list').innerHTML = Array(5).fill(`
    <div class="flex gap-4 rounded-xl p-4" style="background-color:var(--bg-card);border:1px solid var(--border-subtle)">
      <div class="skeleton-line w-20 h-28 shrink-0 rounded-lg" style="margin-bottom:0"></div>
      <div class="flex flex-col gap-2 flex-1 pt-1">
        <div class="skeleton-line" style="width:55%;height:16px"></div>
        <div class="skeleton-line" style="width:38%;height:11px"></div>
        <div class="skeleton-line" style="width:20%;height:11px"></div>
        <div class="skeleton-line" style="width:90%;height:11px"></div>
        <div class="skeleton-line" style="width:75%;height:11px"></div>
      </div>
    </div>
  `).join('');
}

function toggleGenre() {
  document.getElementById('genre-menu').classList.toggle('hidden');
  document.getElementById('genre-menu').classList.toggle('open');
}

function filterGenre(id, name) {
  activeGenreId   = id;
  currentTMDBPage = 1;
  currentPage     = 1;
  const menu = document.getElementById('genre-menu');
  menu.classList.add('hidden');
  menu.classList.remove('open');

  const btn = document.getElementById('genre-btn');
  btn.innerHTML = `${name.toUpperCase()} <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg>`;
  btn.classList.toggle('active-filter', id !== 0);

  loadFilms();
}

function toggleSort() {
  sortDesc = !sortDesc;
  document.getElementById('sort-btn').innerHTML =
    `SORT BY IMDb ${sortDesc ? '↓' : '↑'} <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4"/></svg>`;
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

function initEventListeners() {
  document.getElementById('genre-btn').addEventListener('click', toggleGenre);
  document.getElementById('sort-btn').addEventListener('click', toggleSort);
  document.getElementById('search-input').addEventListener('input', onSearch);
  document.getElementById('per-page').addEventListener('change', onPerPageChange);

  document.addEventListener('click', e => {
    if (!e.target.closest('#genre-btn') && !e.target.closest('#genre-menu')) {
      const menu = document.getElementById('genre-menu');
      menu.classList.add('hidden');
      menu.classList.remove('open');
    }
  });
}

async function init() {
  if (!API_KEY) {
    document.getElementById('film-list').innerHTML =
      `<div class="py-8 text-center" >⚠️ API Key belum diset. Tambahkan VITE_API_KEY di file .env</div>`;
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
      `<div class="py-8 text-center" >Gagal memuat data dari TMDB.</div>`;
  }
}

initEventListeners();
init();
