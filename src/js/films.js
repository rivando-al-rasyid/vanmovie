import '../css/style.css';
import {
  fetchMovies,
  fetchGenreList,
  imgUrl,
  toFilmData,
  escHtml,
} from './fetchData.js';
import { createWatchlistBtn } from './addlist.js';

// ── State ─────────────────────────────────────────────────────────────────────
let allFilms        = [];
let filteredFilms   = [];
let genres          = {};
let activeGenreId   = 0;
let sortDesc        = true;
let currentPage     = 1;
let perPage         = 50;
let totalTMDBPages  = 1;
let currentTMDBPage = 1;

// ── Data loading ──────────────────────────────────────────────────────────────
async function loadFilms() {
  try {
    const data = await fetchMovies({
      page:     currentTMDBPage,
      sortDesc,
      genreId:  activeGenreId,
      minVotes: 500,
    });

    totalTMDBPages = Math.min(data.total_pages || 1, 250);
    allFilms       = data.results || [];
    filteredFilms  = allFilms;

    renderFilms();
    renderPagination(data.total_results || 0);
  } catch {
    document.getElementById('film-list').innerHTML =
      `<div class="py-8 text-center">Gagal memuat data. Coba refresh halaman.</div>`;
  }
}

// ── Genre menu ────────────────────────────────────────────────────────────────
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

// ── Film card ─────────────────────────────────────────────────────────────────
function filmCardHTML(film) {
  const poster     = imgUrl(film.poster_path) || '';
  const rating     = film.vote_average ? film.vote_average.toFixed(1) : 'N/A';
  const year       = film.release_date ? film.release_date.split('-')[0] : '';
  const filmGenres = (film.genre_ids || []).map(id => genres[id]).filter(Boolean);
  const desc       = film.overview || 'No description available.';
  const truncDesc  = desc.length > 200 ? desc.slice(0, 200) + '...' : desc;

  const posterEl = poster
    ? `<img class="w-20 h-28 object-cover rounded-lg shrink-0" style="background-color:var(--bg-card)" src="${poster}" alt="${escHtml(film.title)}" loading="lazy" onerror="this.style.background='var(--bg-card)';this.src=''">`
    : `<div class="w-20 h-28 shrink-0 rounded-lg flex items-center justify-center text-xs text-center p-1" style="background-color:var(--bg-card);color:var(--text-faint)">No Poster</div>`;

  return `
    <div class="flex gap-4 rounded-xl p-4 transition-colors" style="background-color:var(--bg-card);border:1px solid var(--border-subtle)" data-film-id="${film.id}" onmouseover="this.style.borderColor='var(--border)'" onmouseout="this.style.borderColor='var(--border-subtle)'">
      ${posterEl}
      <div class="flex flex-col gap-1.5 min-w-0">
        <div class="text-sm font-semibold">
          ${escHtml(film.title)} <span class="font-normal text-xs">${year}</span>
        </div>
        <div class="flex flex-wrap gap-1">
          ${filmGenres.map(g => `<span class="tag">${g}</span>`).join('')}
        </div>
        <div class="flex items-center gap-2 text-xs">
          <span class="tmdb-badge">IMDb</span>
          <span class="font-semibold">${rating} ★</span>
          <span>(${(film.vote_count || 0).toLocaleString()} votes)</span>
        </div>
        <div class="text-xs leading-relaxed">${escHtml(truncDesc)}</div>
        <div class="flex gap-2 mt-1 card-btn-row">
          <a href="detail.html?id=${film.id}" class="btn-primary text-xs px-3 py-1.5 rounded-full no-underline">View Details</a>
        </div>
      </div>
    </div>
  `;
}

function renderFilms() {
  const list = document.getElementById('film-list');
  if (!filteredFilms.length) {
    list.innerHTML = `<div class="py-8 text-center">Tidak ada film ditemukan.</div>`;
    document.getElementById('page-title').textContent = 'All Films (0)';
    return;
  }

  const start     = (currentPage - 1) * perPage;
  const pageFilms = filteredFilms.slice(start, start + perPage);
  list.innerHTML  = pageFilms.map(filmCardHTML).join('');

  // Mount watchlist buttons via addlist.js createWatchlistBtn
  pageFilms.forEach(film => {
    const card = list.querySelector(`[data-film-id="${film.id}"] .card-btn-row`);
    if (!card) return;
    const btn = createWatchlistBtn(toFilmData(film), 'text-xs px-3 py-1.5 rounded-full');
    card.appendChild(btn);
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

  btns.appendChild(makeArrow('&#8249;', isFirst, () => {
    if (currentPage > 1) { currentPage--; renderFilms(); renderPagination(totalResults); }
    else if (currentTMDBPage > 1) { currentTMDBPage--; currentPage = Math.ceil(20 / perPage); loadFilms(); }
    window.scrollTo(0, 0);
  }));

  btns.appendChild(makeArrow('&#8250;', isLast, () => {
    if (currentPage < localPages) { currentPage++; renderFilms(); renderPagination(totalResults); }
    else if (currentTMDBPage < totalTMDBPages) { currentTMDBPage++; currentPage = 1; loadFilms(); }
    window.scrollTo(0, 0);
  }));
}

// ── Controls ──────────────────────────────────────────────────────────────────
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
  loadFilms();
}

function onPerPageChange() {
  perPage     = parseInt(document.getElementById('per-page').value, 10);
  currentPage = 1;
  renderFilms();
}

// ── Event listeners ───────────────────────────────────────────────────────────
function initEventListeners() {
  document.getElementById('genre-btn').addEventListener('click', toggleGenre);
  document.getElementById('sort-btn').addEventListener('click', toggleSort);
  document.getElementById('per-page').addEventListener('change', onPerPageChange);

  document.addEventListener('click', e => {
    if (!e.target.closest('#genre-btn') && !e.target.closest('#genre-menu')) {
      const menu = document.getElementById('genre-menu');
      menu.classList.add('hidden');
      menu.classList.remove('open');
    }
  });
}

// ── Init ──────────────────────────────────────────────────────────────────────
async function init() {
  try {
    const genreList = await fetchGenreList();
    genreList.forEach(g => (genres[g.id] = g.name));
    buildGenreMenu(genreList);
    document.getElementById('main-container').style.display = 'block';
    await loadFilms();
  } catch (err) {
    document.getElementById('film-list').innerHTML =
      err.message.includes('VITE_API_KEY')
        ? `<div class="py-8 text-center">⚠️ API Key belum diset. Tambahkan VITE_API_KEY di file .env</div>`
        : `<div class="py-8 text-center">Gagal memuat data dari TMDB.</div>`;
  }
}

initEventListeners();
init();
