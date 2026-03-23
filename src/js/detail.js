import '../css/style.css';
import { fetchMovieDetail, imgUrl, toFilmData } from './fetchData.js';
import { bindMyListBtn } from './addlist.js';

// ── Utilities ─────────────────────────────────────────────────────────────────
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

// ── Load & render ─────────────────────────────────────────────────────────────
async function loadDetail(movieId) {
  try {
    const detail = await fetchMovieDetail(movieId);

    document.getElementById('skeleton-detail').classList.add('hidden');
    document.getElementById('film-detail').classList.remove('hidden');

    document.title = `MovieSpace — ${detail.title}`;

    // Breadcrumb
    document.getElementById('breadcrumb-title').textContent = detail.title;

    // Poster
    const poster    = document.getElementById('detail-poster');
    const posterUrl = imgUrl(detail.poster_path);
    if (posterUrl) {
      poster.src = posterUrl;
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
      `<span class="tag">${escHtml(g.name)}</span>`
    ).join('');

    // TMDB link
    document.getElementById('btn-tmdb').href = `https://www.themoviedb.org/movie/${movieId}`;

    // My List button — uses addlist.js
    bindMyListBtn(toFilmData(detail));

  } catch (err) {
    document.getElementById('skeleton-detail').innerHTML =
      err.message.includes('VITE_API_KEY')
        ? `<div class="py-8 text-center">⚠️ API Key belum diset. Tambahkan VITE_API_KEY di file .env</div>`
        : `<div class="py-8 text-center">Gagal memuat data. Coba refresh halaman.</div>`;
    console.error(err);
  }
}

// ── Init ──────────────────────────────────────────────────────────────────────
const params  = new URLSearchParams(location.search);
const movieId = params.get('id');

if (!movieId) {
  document.getElementById('skeleton-detail').innerHTML =
    `<div class="py-8 text-center">Film tidak ditemukan. <a href="films.html">← Back</a></div>`;
} else {
  loadDetail(movieId);
}
