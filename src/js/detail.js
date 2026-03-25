<<<<<<< HEAD
import "../css/style.css";
import { initNavAuth } from "./auth.js";
import { fetchMovieDetail, imgUrl, toFilmData } from "./fetchData.js";
import { bindMyListBtn } from "./addlist.js";

// ── DOM refs ──────────────────────────────────────────────────────────────────
const skeletonEl = document.getElementById("skeleton-detail");
const detailEl = document.getElementById("film-detail");
const posterEl = document.getElementById("detail-poster");
const breadcrumb = document.getElementById("breadcrumb-title");
const titleEl = document.getElementById("detail-title");
const yearEl = document.getElementById("detail-year");
const runtimeEl = document.getElementById("detail-runtime");
const languageEl = document.getElementById("detail-language");
const taglineEl = document.getElementById("detail-tagline");
const overviewEl = document.getElementById("detail-overview");
const ratingEl = document.getElementById("detail-rating");
const votesEl = document.getElementById("detail-votes");
const popularityEl = document.getElementById("detail-popularity");
const genresEl = document.getElementById("detail-genres");
const tmdbBtn = document.getElementById("btn-tmdb");

=======
import '../css/style.css';
import { fetchMovieDetail, imgUrl, toFilmData, escHtml } from './fetchData.js';
import { bindMyListBtn } from './addlist.js';

>>>>>>> parent of 9423db2 (refactor : change code from html inject to dom)
// ── Utilities ─────────────────────────────────────────────────────────────────
function formatRuntime(min) {
  if (!min) return "";
  const h = Math.floor(min / 60),
    m = min % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
}

<<<<<<< HEAD
function showError(message, linkText = null, linkHref = null) {
  const p = document.createElement("p");
  p.className = "py-8 text-center";
  p.textContent = message;
  if (linkText && linkHref) {
    p.appendChild(document.createTextNode(" "));
    const a = document.createElement("a");
    a.href = linkHref;
    a.textContent = linkText;
    p.appendChild(a);
  }
  skeletonEl.replaceChildren(p);
}

=======
>>>>>>> parent of 9423db2 (refactor : change code from html inject to dom)
// ── Load & render ─────────────────────────────────────────────────────────────
async function loadDetail(movieId) {
  try {
    const detail = await fetchMovieDetail(movieId);

<<<<<<< HEAD
    skeletonEl.classList.add("hidden");
    detailEl.classList.remove("hidden");

    document.title = `MovieSpace — ${detail.title}`;
    breadcrumb.textContent = detail.title;
=======
    document.getElementById('skeleton-detail').classList.add('hidden');
    document.getElementById('film-detail').classList.remove('hidden');

    document.title = `MovieSpace — ${detail.title}`;

    // Breadcrumb
    document.getElementById('breadcrumb-title').textContent = detail.title;
>>>>>>> parent of 9423db2 (refactor : change code from html inject to dom)

    // Poster
    const poster    = document.getElementById('detail-poster');
    const posterUrl = imgUrl(detail.poster_path);
    if (posterUrl) {
      poster.src = posterUrl;
      poster.alt = detail.title;
    } else {
<<<<<<< HEAD
      posterEl.closest("div").style.display = "none";
    }

    // Basic info
    titleEl.textContent = detail.title;
    yearEl.textContent = detail.release_date
      ? detail.release_date.split("-")[0]
      : "";
    runtimeEl.textContent = formatRuntime(detail.runtime);
    languageEl.textContent = detail.original_language || "";
    taglineEl.textContent = detail.tagline || "";
    overviewEl.textContent = detail.overview || "No description available.";

    // Rating
    const rating = detail.vote_average ? detail.vote_average.toFixed(1) : "N/A";
    ratingEl.textContent = `${rating} ★`;
    votesEl.textContent = detail.vote_count
      ? `(${detail.vote_count.toLocaleString()} votes)`
      : "";
    popularityEl.textContent = detail.popularity
      ? `Popularity: ${detail.popularity.toFixed(0)}`
      : "";

    // Genres
    const tags = (detail.genres || []).map((g) => {
      const span = document.createElement("span");
      span.className = "tag";
      span.textContent = g.name;
      return span;
    });
    genresEl.replaceChildren(...tags);
=======
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
      `<span class="tag">${escHtml(g.name)}</span>`
    ).join('');
>>>>>>> parent of 9423db2 (refactor : change code from html inject to dom)

    // TMDB link
    document.getElementById('btn-tmdb').href = `https://www.themoviedb.org/movie/${movieId}`;

    // My List button — uses addlist.js
    bindMyListBtn(toFilmData(detail));
  } catch (err) {
<<<<<<< HEAD
    console.error(err);
    showError(
      err.message.includes("VITE_API_KEY")
        ? "⚠️ API Key belum diset. Tambahkan VITE_API_KEY di file .env"
        : "Gagal memuat data. Coba refresh halaman.",
    );
=======
    document.getElementById('skeleton-detail').innerHTML =
      err.message.includes('VITE_API_KEY')
        ? `<div class="py-8 text-center">⚠️ API Key belum diset. Tambahkan VITE_API_KEY di file .env</div>`
        : `<div class="py-8 text-center">Gagal memuat data. Coba refresh halaman.</div>`;
    console.error(err);
>>>>>>> parent of 9423db2 (refactor : change code from html inject to dom)
  }
}

// ── Init ──────────────────────────────────────────────────────────────────────
<<<<<<< HEAD
const movieId = new URLSearchParams(location.search).get("id");

initNavAuth();

if (!movieId) {
  showError("Film tidak ditemukan.", "← Back", "films.html");
=======
const params  = new URLSearchParams(location.search);
const movieId = params.get('id');

if (!movieId) {
  document.getElementById('skeleton-detail').innerHTML =
    `<div class="py-8 text-center">Film tidak ditemukan. <a href="films.html">← Back</a></div>`;
>>>>>>> parent of 9423db2 (refactor : change code from html inject to dom)
} else {
  loadDetail(movieId);
}
