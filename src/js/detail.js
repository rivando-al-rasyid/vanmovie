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

// ── Utilities ─────────────────────────────────────────────────────────────────
function formatRuntime(min) {
  if (!min) return "";
  const h = Math.floor(min / 60),
    m = min % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
}

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

// ── Load & render ─────────────────────────────────────────────────────────────
async function loadDetail(movieId) {
  try {
    const detail = await fetchMovieDetail(movieId);

    skeletonEl.classList.add("hidden");
    detailEl.classList.remove("hidden");

    document.title = `MovieSpace — ${detail.title}`;
    breadcrumb.textContent = detail.title;

    // Poster
    const posterUrl = imgUrl(detail.poster_path);
    if (posterUrl) {
      posterEl.src = posterUrl;
      posterEl.alt = detail.title;
    } else {
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

    // TMDB link
    tmdbBtn.href = `https://www.themoviedb.org/movie/${movieId}`;

    // My List button
    bindMyListBtn(toFilmData(detail));
  } catch (err) {
    console.error(err);
    showError(
      err.message.includes("VITE_API_KEY")
        ? "⚠️ API Key belum diset. Tambahkan VITE_API_KEY di file .env"
        : "Gagal memuat data. Coba refresh halaman.",
    );
  }
}

// ── Init ──────────────────────────────────────────────────────────────────────
const movieId = new URLSearchParams(location.search).get("id");

initNavAuth();

if (!movieId) {
  showError("Film tidak ditemukan.", "← Back", "films.html");
} else {
  loadDetail(movieId);
}
