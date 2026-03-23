import '../css/style.css';
import {
  fetchMovies,
  fetchGenreList,
  imgUrl,
  toFilmData,
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

// ── DOM refs ──────────────────────────────────────────────────────────────────
const filmList    = document.getElementById('film-list');
const pageTitle   = document.getElementById('page-title');
const paginInfo   = document.getElementById('pagination-info');
const pageBtns    = document.getElementById('page-btns');
const genreMenu   = document.getElementById('genre-menu');
const genreBtn    = document.getElementById('genre-btn');
const sortBtn     = document.getElementById('sort-btn');

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
    const msg = document.createElement('p');
    msg.className   = 'py-8 text-center';
    msg.textContent = 'Gagal memuat data. Coba refresh halaman.';
    filmList.replaceChildren(msg);
  }
}

// ── Genre menu ────────────────────────────────────────────────────────────────
function buildGenreMenu(list) {
  const allItem = document.createElement('li');
  allItem.className       = 'dropdown-item px-4 py-2 text-sm cursor-pointer';
  allItem.textContent     = 'All Genres';
  allItem.dataset.genreId = '0';

  const items = [allItem, ...list.map(g => {
    const li = document.createElement('li');
    li.className       = 'dropdown-item px-4 py-2 text-sm cursor-pointer';
    li.textContent     = g.name;
    li.dataset.genreId = g.id;
    return li;
  })];

  genreMenu.replaceChildren(...items);

  genreMenu.addEventListener('click', e => {
    const item = e.target.closest('.dropdown-item');
    if (!item) return;
    filterGenre(Number(item.dataset.genreId), item.textContent.trim());
  });
}

// ── Film card ─────────────────────────────────────────────────────────────────
function createFilmCard(film) {
  const poster     = imgUrl(film.poster_path);
  const rating     = film.vote_average ? film.vote_average.toFixed(1) : 'N/A';
  const year       = film.release_date ? film.release_date.split('-')[0] : '';
  const filmGenres = (film.genre_ids || []).map(id => genres[id]).filter(Boolean);
  const desc       = film.overview || 'No description available.';
  const truncDesc  = desc.length > 200 ? desc.slice(0, 200) + '...' : desc;

  const li = document.createElement('li');
  li.dataset.filmId = film.id;
  li.className      = 'flex gap-4 rounded-xl p-4 transition-colors';
  li.style.cssText  = 'background-color:var(--bg-card);border:1px solid var(--border-subtle)';
  li.addEventListener('mouseover', () => li.style.borderColor = 'var(--border)');
  li.addEventListener('mouseout',  () => li.style.borderColor = 'var(--border-subtle)');

  // Poster
  if (poster) {
    const img = document.createElement('img');
    img.src       = poster;
    img.alt       = film.title;
    img.loading   = 'lazy';
    img.className = 'w-20 h-28 object-cover rounded-lg shrink-0';
    img.style.backgroundColor = 'var(--bg-card)';
    img.addEventListener('error', () => { img.style.background = 'var(--bg-card)'; img.src = ''; });
    li.appendChild(img);
  } else {
    const placeholder = document.createElement('div');
    placeholder.className = 'w-20 h-28 shrink-0 rounded-lg flex items-center justify-center text-xs text-center p-1';
    placeholder.style.cssText = 'background-color:var(--bg-card);color:var(--text-faint)';
    placeholder.textContent = 'No Poster';
    li.appendChild(placeholder);
  }

  // Info
  const info = document.createElement('div');
  info.className = 'flex flex-col gap-1.5 min-w-0';

  // Title row
  const titleRow = document.createElement('div');
  titleRow.className = 'text-sm font-semibold';
  titleRow.appendChild(document.createTextNode(film.title + ' '));
  const yearSpan = document.createElement('span');
  yearSpan.className   = 'font-normal text-xs';
  yearSpan.textContent = year;
  titleRow.appendChild(yearSpan);

  // Genre tags
  const tagsRow = document.createElement('div');
  tagsRow.className = 'flex flex-wrap gap-1';
  filmGenres.forEach(g => {
    const tag = document.createElement('span');
    tag.className   = 'tag';
    tag.textContent = g;
    tagsRow.appendChild(tag);
  });

  // Rating row
  const ratingRow = document.createElement('div');
  ratingRow.className = 'flex items-center gap-2 text-xs';
  const badge = document.createElement('span');
  badge.className   = 'tmdb-badge';
  badge.textContent = 'IMDb';
  const ratingVal = document.createElement('span');
  ratingVal.className   = 'font-semibold';
  ratingVal.textContent = `${rating} ★`;
  const votes = document.createElement('span');
  votes.textContent = `(${(film.vote_count || 0).toLocaleString()} votes)`;
  ratingRow.append(badge, ratingVal, votes);

  // Overview
  const overview = document.createElement('p');
  overview.className   = 'text-xs leading-relaxed m-0';
  overview.textContent = truncDesc;

  // Actions
  const actions = document.createElement('div');
  actions.className = 'flex gap-2 mt-1';

  const detailLink = document.createElement('a');
  detailLink.href        = `detail.html?id=${film.id}`;
  detailLink.className   = 'btn-primary text-xs px-3 py-1.5 rounded-full no-underline';
  detailLink.textContent = 'View Details';

  const watchlistBtn = createWatchlistBtn(toFilmData(film), 'text-xs px-3 py-1.5 rounded-full');

  actions.append(detailLink, watchlistBtn);
  info.append(titleRow, tagsRow, ratingRow, overview, actions);
  li.appendChild(info);

  return li;
}

function renderFilms() {
  if (!filteredFilms.length) {
    const msg = document.createElement('p');
    msg.className   = 'py-8 text-center';
    msg.textContent = 'Tidak ada film ditemukan.';
    filmList.replaceChildren(msg);
    pageTitle.textContent = 'All Films (0)';
    return;
  }

  const start     = (currentPage - 1) * perPage;
  const pageFilms = filteredFilms.slice(start, start + perPage);
  filmList.replaceChildren(...pageFilms.map(createFilmCard));
}

function renderPagination(totalResults) {
  const localPages = Math.ceil(filteredFilms.length / perPage);
  const grandTotal = Math.min(totalResults, 5000);

  pageTitle.textContent = `All Films (${grandTotal.toLocaleString()}+)`;

  const startItem = (currentTMDBPage - 1) * 20 + (currentPage - 1) * perPage + 1;
  const endItem   = Math.min(startItem + perPage - 1, grandTotal);
  paginInfo.textContent = `${startItem} - ${endItem} of ${grandTotal.toLocaleString()}`;

  const isFirst = currentPage <= 1 && currentTMDBPage <= 1;
  const isLast  = currentPage >= localPages && currentTMDBPage >= totalTMDBPages;

  const makeArrow = (label, symbol, disabled, onClick) => {
    const btn = document.createElement('button');
    btn.type          = 'button';
    btn.ariaLabel     = label;
    btn.textContent   = symbol;
    btn.disabled      = disabled;
    btn.className     = 'disabled:opacity-25 disabled:cursor-not-allowed transition-colors text-lg leading-none cursor-pointer bg-transparent border-none p-0';
    btn.style.color   = 'var(--text-muted)';
    btn.addEventListener('mouseover', () => { if (!disabled) btn.style.color = 'var(--text)'; });
    btn.addEventListener('mouseout',  () => { btn.style.color = 'var(--text-muted)'; });
    btn.addEventListener('click', onClick);
    return btn;
  };

  const prevBtn = makeArrow('Previous page', '‹', isFirst, () => {
    if (currentPage > 1) { currentPage--; renderFilms(); renderPagination(totalResults); }
    else if (currentTMDBPage > 1) { currentTMDBPage--; currentPage = Math.ceil(20 / perPage); loadFilms(); }
    window.scrollTo(0, 0);
  });

  const nextBtn = makeArrow('Next page', '›', isLast, () => {
    if (currentPage < localPages) { currentPage++; renderFilms(); renderPagination(totalResults); }
    else if (currentTMDBPage < totalTMDBPages) { currentTMDBPage++; currentPage = 1; loadFilms(); }
    window.scrollTo(0, 0);
  });

  pageBtns.replaceChildren(prevBtn, nextBtn);
}

// ── Controls ──────────────────────────────────────────────────────────────────
function toggleGenreMenu() {
  genreMenu.classList.toggle('hidden');
  genreMenu.classList.toggle('open');
}

function filterGenre(id, name) {
  activeGenreId   = id;
  currentTMDBPage = 1;
  currentPage     = 1;

  genreMenu.classList.add('hidden');
  genreMenu.classList.remove('open');

  // Update button label
  genreBtn.replaceChildren(
    document.createTextNode(name.toUpperCase() + ' '),
    (() => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('width', '12'); svg.setAttribute('height', '12');
      svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('fill', 'none');
      svg.setAttribute('stroke', 'currentColor'); svg.setAttribute('stroke-width', '2.5');
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', 'M6 9l6 6 6-6');
      svg.appendChild(path);
      return svg;
    })()
  );
  genreBtn.classList.toggle('active-filter', id !== 0);
  loadFilms();
}

function toggleSort() {
  sortDesc = !sortDesc;

  sortBtn.replaceChildren(
    document.createTextNode(`SORT BY IMDb ${sortDesc ? '↓' : '↑'} `),
    (() => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('width', '13'); svg.setAttribute('height', '13');
      svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('fill', 'none');
      svg.setAttribute('stroke', 'currentColor'); svg.setAttribute('stroke-width', '2.5');
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', 'M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4');
      svg.appendChild(path);
      return svg;
    })()
  );

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
  genreBtn.addEventListener('click', toggleGenreMenu);
  sortBtn.addEventListener('click', toggleSort);
  document.getElementById('per-page').addEventListener('change', onPerPageChange);

  document.addEventListener('click', e => {
    if (!e.target.closest('#genre-btn') && !e.target.closest('#genre-menu')) {
      genreMenu.classList.add('hidden');
      genreMenu.classList.remove('open');
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
    const msg = document.createElement('p');
    msg.className   = 'py-8 text-center';
    msg.textContent = err.message.includes('VITE_API_KEY')
      ? '⚠️ API Key belum diset. Tambahkan VITE_API_KEY di file .env'
      : 'Gagal memuat data dari TMDB.';
    filmList.replaceChildren(msg);
  }
}

initEventListeners();
init();
