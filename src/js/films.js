import "../css/style.css";
import { initNavAuth } from "./auth.js";
import {
  fetchMovies,
  fetchGenreList,
  imgUrl,
  toFilmData,
<<<<<<< HEAD
} from "./fetchData.js";
import { createWatchlistBtn } from "./addlist.js";
=======
  escHtml,
} from './fetchData.js';
import { createWatchlistBtn } from './addlist.js';
>>>>>>> parent of 9423db2 (refactor : change code from html inject to dom)

// ── State ─────────────────────────────────────────────────────────────────────
let allFilms = [];
let filteredFilms = [];
let genres = {};
let activeGenreId = 0;
let sortDesc = true;
let currentPage = 1;
let perPage = 50;
let totalTMDBPages = 1;
let currentTMDBPage = 1;

<<<<<<< HEAD
// ── DOM refs ──────────────────────────────────────────────────────────────────
const filmList = document.getElementById("film-list");
const pageTitle = document.getElementById("page-title");
const paginInfo = document.getElementById("pagination-info");
const pageBtns = document.getElementById("page-btns");
const genreMenu = document.getElementById("genre-menu");
const genreBtn = document.getElementById("genre-btn");
const sortBtn = document.getElementById("sort-btn");

=======
>>>>>>> parent of 9423db2 (refactor : change code from html inject to dom)
// ── Data loading ──────────────────────────────────────────────────────────────
async function loadFilms() {
  try {
    const data = await fetchMovies({
      page: currentTMDBPage,
      sortDesc,
      genreId: activeGenreId,
      minVotes: 500,
    });

    totalTMDBPages = Math.min(data.total_pages || 1, 250);
    allFilms = data.results || [];
    filteredFilms = allFilms;

    renderFilms();
    renderPagination(data.total_results || 0);
  } catch {
<<<<<<< HEAD
    const msg = document.createElement("p");
    msg.className = "py-8 text-center";
    msg.textContent = "Gagal memuat data. Coba refresh halaman.";
    filmList.replaceChildren(msg);
=======
    document.getElementById('film-list').innerHTML =
      `<div class="py-8 text-center">Gagal memuat data. Coba refresh halaman.</div>`;
>>>>>>> parent of 9423db2 (refactor : change code from html inject to dom)
  }
}

// ── Genre menu ────────────────────────────────────────────────────────────────
function buildGenreMenu(list) {
<<<<<<< HEAD
  const allItem = document.createElement("li");
  allItem.className = "dropdown-item px-4 py-2 text-sm cursor-pointer";
  allItem.textContent = "All Genres";
  allItem.dataset.genreId = "0";

  const items = [
    allItem,
    ...list.map((g) => {
      const li = document.createElement("li");
      li.className = "dropdown-item px-4 py-2 text-sm cursor-pointer";
      li.textContent = g.name;
      li.dataset.genreId = g.id;
      return li;
    }),
  ];

  genreMenu.replaceChildren(...items);

  genreMenu.addEventListener("click", (e) => {
    const item = e.target.closest(".dropdown-item");
=======
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
>>>>>>> parent of 9423db2 (refactor : change code from html inject to dom)
    if (!item) return;
    filterGenre(Number(item.dataset.genreId), item.textContent.trim());
  });
}

// ── Film card ─────────────────────────────────────────────────────────────────
<<<<<<< HEAD
function createFilmCard(film) {
  const poster = imgUrl(film.poster_path);
  const rating = film.vote_average ? film.vote_average.toFixed(1) : "N/A";
  const year = film.release_date ? film.release_date.split("-")[0] : "";
  const filmGenres = (film.genre_ids || [])
    .map((id) => genres[id])
    .filter(Boolean);
  const desc = film.overview || "No description available.";
  const truncDesc = desc.length > 200 ? desc.slice(0, 200) + "..." : desc;

  const li = document.createElement("li");
  li.dataset.filmId = film.id;
  li.className = "flex gap-4 rounded-xl p-4 transition-colors";
  li.style.cssText =
    "background-color:var(--bg-card);border:1px solid var(--border-subtle)";
  li.addEventListener(
    "mouseover",
    () => (li.style.borderColor = "var(--border)"),
  );
  li.addEventListener(
    "mouseout",
    () => (li.style.borderColor = "var(--border-subtle)"),
  );

  // Poster
  if (poster) {
    const img = document.createElement("img");
    img.src = poster;
    img.alt = film.title;
    img.loading = "lazy";
    img.className = "w-20 h-28 object-cover rounded-lg shrink-0";
    img.style.backgroundColor = "var(--bg-card)";
    img.addEventListener("error", () => {
      img.style.background = "var(--bg-card)";
      img.src = "";
    });
    li.appendChild(img);
  } else {
    const placeholder = document.createElement("div");
    placeholder.className =
      "w-20 h-28 shrink-0 rounded-lg flex items-center justify-center text-xs text-center p-1";
    placeholder.style.cssText =
      "background-color:var(--bg-card);color:var(--text-faint)";
    placeholder.textContent = "No Poster";
    li.appendChild(placeholder);
  }

  // Info
  const info = document.createElement("div");
  info.className = "flex flex-col gap-1.5 min-w-0";

  // Title row
  const titleRow = document.createElement("div");
  titleRow.className = "text-sm font-semibold";
  titleRow.appendChild(document.createTextNode(film.title + " "));
  const yearSpan = document.createElement("span");
  yearSpan.className = "font-normal text-xs";
  yearSpan.textContent = year;
  titleRow.appendChild(yearSpan);

  // Genre tags
  const tagsRow = document.createElement("div");
  tagsRow.className = "flex flex-wrap gap-1";
  filmGenres.forEach((g) => {
    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = g;
    tagsRow.appendChild(tag);
  });

  // Rating row
  const ratingRow = document.createElement("div");
  ratingRow.className = "flex items-center gap-2 text-xs";
  const badge = document.createElement("span");
  badge.className = "tmdb-badge";
  badge.textContent = "IMDb";
  const ratingVal = document.createElement("span");
  ratingVal.className = "font-semibold";
  ratingVal.textContent = `${rating} ★`;
  const votes = document.createElement("span");
  votes.textContent = `(${(film.vote_count || 0).toLocaleString()} votes)`;
  ratingRow.append(badge, ratingVal, votes);

  // Overview
  const overview = document.createElement("p");
  overview.className = "text-xs leading-relaxed m-0";
  overview.textContent = truncDesc;

  // Actions
  const actions = document.createElement("div");
  actions.className = "flex gap-2 mt-1";

  const detailLink = document.createElement("a");
  detailLink.href = `detail.html?id=${film.id}`;
  detailLink.className =
    "btn-primary text-xs px-3 py-1.5 rounded-full no-underline";
  detailLink.textContent = "View Details";

  const watchlistBtn = createWatchlistBtn(
    toFilmData(film),
    "text-xs px-3 py-1.5 rounded-full",
  );

  actions.append(detailLink, watchlistBtn);
  info.append(titleRow, tagsRow, ratingRow, overview, actions);
  li.appendChild(info);

  return li;
=======
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
>>>>>>> parent of 9423db2 (refactor : change code from html inject to dom)
}

function renderFilms() {
  const list = document.getElementById('film-list');
  if (!filteredFilms.length) {
<<<<<<< HEAD
    const msg = document.createElement("p");
    msg.className = "py-8 text-center";
    msg.textContent = "Tidak ada film ditemukan.";
    filmList.replaceChildren(msg);
    pageTitle.textContent = "All Films (0)";
=======
    list.innerHTML = `<div class="py-8 text-center">Tidak ada film ditemukan.</div>`;
    document.getElementById('page-title').textContent = 'All Films (0)';
>>>>>>> parent of 9423db2 (refactor : change code from html inject to dom)
    return;
  }

  const start = (currentPage - 1) * perPage;
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

<<<<<<< HEAD
  const startItem =
    (currentTMDBPage - 1) * 20 + (currentPage - 1) * perPage + 1;
  const endItem = Math.min(startItem + perPage - 1, grandTotal);
  paginInfo.textContent = `${startItem} - ${endItem} of ${grandTotal.toLocaleString()}`;
=======
  const startItem = (currentTMDBPage - 1) * 20 + (currentPage - 1) * perPage + 1;
  const endItem   = Math.min(startItem + perPage - 1, grandTotal);
  document.getElementById('pagination-info').textContent =
    `${startItem} - ${endItem} of ${grandTotal.toLocaleString()}`;

  const btns = document.getElementById('page-btns');
  btns.innerHTML = '';
>>>>>>> parent of 9423db2 (refactor : change code from html inject to dom)

  const isFirst = currentPage <= 1 && currentTMDBPage <= 1;
  const isLast = currentPage >= localPages && currentTMDBPage >= totalTMDBPages;

<<<<<<< HEAD
  const makeArrow = (label, symbol, disabled, onClick) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.ariaLabel = label;
    btn.textContent = symbol;
    btn.disabled = disabled;
    btn.className =
      "disabled:opacity-25 disabled:cursor-not-allowed transition-colors text-lg leading-none cursor-pointer bg-transparent border-none p-0";
    btn.style.color = "var(--text-muted)";
    btn.addEventListener("mouseover", () => {
      if (!disabled) btn.style.color = "var(--text)";
    });
    btn.addEventListener("mouseout", () => {
      btn.style.color = "var(--text-muted)";
    });
    btn.addEventListener("click", onClick);
    return btn;
  };

  const prevBtn = makeArrow("Previous page", "‹", isFirst, () => {
    if (currentPage > 1) {
      currentPage--;
      renderFilms();
      renderPagination(totalResults);
    } else if (currentTMDBPage > 1) {
      currentTMDBPage--;
      currentPage = Math.ceil(20 / perPage);
      loadFilms();
    }
=======
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
>>>>>>> parent of 9423db2 (refactor : change code from html inject to dom)
    window.scrollTo(0, 0);
  }));

<<<<<<< HEAD
  const nextBtn = makeArrow("Next page", "›", isLast, () => {
    if (currentPage < localPages) {
      currentPage++;
      renderFilms();
      renderPagination(totalResults);
    } else if (currentTMDBPage < totalTMDBPages) {
      currentTMDBPage++;
      currentPage = 1;
      loadFilms();
    }
=======
  btns.appendChild(makeArrow('&#8250;', isLast, () => {
    if (currentPage < localPages) { currentPage++; renderFilms(); renderPagination(totalResults); }
    else if (currentTMDBPage < totalTMDBPages) { currentTMDBPage++; currentPage = 1; loadFilms(); }
>>>>>>> parent of 9423db2 (refactor : change code from html inject to dom)
    window.scrollTo(0, 0);
  }));
}

// ── Controls ──────────────────────────────────────────────────────────────────
<<<<<<< HEAD
function toggleGenreMenu() {
  genreMenu.classList.toggle("hidden");
  genreMenu.classList.toggle("open");
=======
function toggleGenre() {
  document.getElementById('genre-menu').classList.toggle('hidden');
  document.getElementById('genre-menu').classList.toggle('open');
>>>>>>> parent of 9423db2 (refactor : change code from html inject to dom)
}

function filterGenre(id, name) {
  activeGenreId = id;
  currentTMDBPage = 1;
<<<<<<< HEAD
  currentPage = 1;

  genreMenu.classList.add("hidden");
  genreMenu.classList.remove("open");

  // Update button label
  genreBtn.replaceChildren(
    document.createTextNode(name.toUpperCase() + " "),
    (() => {
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("width", "12");
      svg.setAttribute("height", "12");
      svg.setAttribute("viewBox", "0 0 24 24");
      svg.setAttribute("fill", "none");
      svg.setAttribute("stroke", "currentColor");
      svg.setAttribute("stroke-width", "2.5");
      const path = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path",
      );
      path.setAttribute("d", "M6 9l6 6 6-6");
      svg.appendChild(path);
      return svg;
    })(),
  );
  genreBtn.classList.toggle("active-filter", id !== 0);
=======
  currentPage     = 1;
  const menu = document.getElementById('genre-menu');
  menu.classList.add('hidden');
  menu.classList.remove('open');

  const btn = document.getElementById('genre-btn');
  btn.innerHTML = `${name.toUpperCase()} <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg>`;
  btn.classList.toggle('active-filter', id !== 0);
>>>>>>> parent of 9423db2 (refactor : change code from html inject to dom)
  loadFilms();
}

function toggleSort() {
  sortDesc = !sortDesc;
<<<<<<< HEAD

  sortBtn.replaceChildren(
    document.createTextNode(`SORT BY IMDb ${sortDesc ? "↓" : "↑"} `),
    (() => {
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("width", "13");
      svg.setAttribute("height", "13");
      svg.setAttribute("viewBox", "0 0 24 24");
      svg.setAttribute("fill", "none");
      svg.setAttribute("stroke", "currentColor");
      svg.setAttribute("stroke-width", "2.5");
      const path = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path",
      );
      path.setAttribute(
        "d",
        "M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4",
      );
      svg.appendChild(path);
      return svg;
    })(),
  );

=======
  document.getElementById('sort-btn').innerHTML =
    `SORT BY IMDb ${sortDesc ? '↓' : '↑'} <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4"/></svg>`;
>>>>>>> parent of 9423db2 (refactor : change code from html inject to dom)
  currentTMDBPage = 1;
  currentPage = 1;
  loadFilms();
}

function onPerPageChange() {
  perPage = parseInt(document.getElementById("per-page").value, 10);
  currentPage = 1;
  renderFilms();
}

// ── Event listeners ───────────────────────────────────────────────────────────
function initEventListeners() {
<<<<<<< HEAD
  genreBtn.addEventListener("click", toggleGenreMenu);
  sortBtn.addEventListener("click", toggleSort);
  document
    .getElementById("per-page")
    .addEventListener("change", onPerPageChange);

  document.addEventListener("click", (e) => {
    if (!e.target.closest("#genre-btn") && !e.target.closest("#genre-menu")) {
      genreMenu.classList.add("hidden");
      genreMenu.classList.remove("open");
=======
  document.getElementById('genre-btn').addEventListener('click', toggleGenre);
  document.getElementById('sort-btn').addEventListener('click', toggleSort);
  document.getElementById('per-page').addEventListener('change', onPerPageChange);

  document.addEventListener('click', e => {
    if (!e.target.closest('#genre-btn') && !e.target.closest('#genre-menu')) {
      const menu = document.getElementById('genre-menu');
      menu.classList.add('hidden');
      menu.classList.remove('open');
>>>>>>> parent of 9423db2 (refactor : change code from html inject to dom)
    }
  });
}

// ── Init ──────────────────────────────────────────────────────────────────────
async function init() {
  try {
    const genreList = await fetchGenreList();
    genreList.forEach((g) => (genres[g.id] = g.name));
    buildGenreMenu(genreList);
    document.getElementById("main-container").style.display = "block";
    await loadFilms();
  } catch (err) {
<<<<<<< HEAD
    const msg = document.createElement("p");
    msg.className = "py-8 text-center";
    msg.textContent = err.message.includes("VITE_API_KEY")
      ? "⚠️ API Key belum diset. Tambahkan VITE_API_KEY di file .env"
      : "Gagal memuat data dari TMDB.";
    filmList.replaceChildren(msg);
=======
    document.getElementById('film-list').innerHTML =
      err.message.includes('VITE_API_KEY')
        ? `<div class="py-8 text-center">⚠️ API Key belum diset. Tambahkan VITE_API_KEY di file .env</div>`
        : `<div class="py-8 text-center">Gagal memuat data dari TMDB.</div>`;
>>>>>>> parent of 9423db2 (refactor : change code from html inject to dom)
  }
}

initNavAuth();
initEventListeners();
init();
