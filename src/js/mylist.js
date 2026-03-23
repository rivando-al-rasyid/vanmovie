import '../css/style.css';
import { imgUrl } from './fetchData.js';

// ── Watchlist helpers ─────────────────────────────────────────────────────────
function getMyList() {
  try { return JSON.parse(localStorage.getItem('moviespace_mylist') || '[]'); } catch { return []; }
}
function saveMyList(list) {
  localStorage.setItem('moviespace_mylist', JSON.stringify(list));
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── Render ────────────────────────────────────────────────────────────────────
function renderMyList() {
  const list     = getMyList();
  const listEl   = document.getElementById('mylist-films');
  const emptyEl  = document.getElementById('empty-state');
  const countEl  = document.getElementById('list-count');
  const clearBtn = document.getElementById('btn-clear-all');

  countEl.textContent = list.length ? `(${list.length})` : '';
  clearBtn.classList.toggle('hidden', list.length === 0);

  if (!list.length) {
    listEl.innerHTML = '';
    emptyEl.classList.remove('hidden');
    return;
  }

  emptyEl.classList.add('hidden');

  listEl.innerHTML = list.map(film => {
    const poster    = imgUrl(film.poster_path) || '';
    const rating    = film.vote_average ? film.vote_average.toFixed(1) : 'N/A';
    const year      = film.release_date ? film.release_date.split('-')[0] : '';
    const desc      = film.overview || 'No description available.';
    const truncDesc = desc.length > 200 ? desc.slice(0, 200) + '...' : desc;

    const posterEl = poster
      ? `<img class="w-20 h-28 object-cover rounded-lg shrink-0" style="background-color:var(--bg-card)" src="${poster}" alt="${escHtml(film.title)}" loading="lazy" onerror="this.style.background='var(--bg-card)';this.src=''">`
      : `<div class="w-20 h-28 shrink-0 rounded-lg flex items-center justify-center text-xs text-center p-1" style="background-color:var(--bg-card);color:var(--text-faint)">No Poster</div>`;

    return `
      <div class="flex gap-4 rounded-xl p-4 transition-colors" style="background-color:var(--bg-card);border:1px solid var(--border-subtle)" data-id="${film.id}" onmouseover="this.style.borderColor='var(--border)'" onmouseout="this.style.borderColor='var(--border-subtle)'">
        ${posterEl}
        <div class="flex flex-col gap-1.5 min-w-0 flex-1">
          <div class="text-sm font-semibold">
            ${escHtml(film.title)} <span class="font-normal text-xs">${year}</span>
          </div>
          <div class="flex items-center gap-2 text-xs">
            <span class="tmdb-badge">IMDb</span>
            <span class="font-semibold">${rating} ★</span>
            <span>(${(film.vote_count || 0).toLocaleString()} votes)</span>
          </div>
          <div class="text-xs leading-relaxed">${escHtml(truncDesc)}</div>
          <div class="flex gap-2 mt-1">
            <a href="detail.html?id=${film.id}" class="btn-primary text-xs px-3 py-1.5 rounded-full no-underline">View Details</a>
            <button class="btn-remove text-xs px-3 py-1.5 rounded-full transition-colors cursor-pointer bg-transparent" style="border:1px solid var(--border-subtle);color:var(--text-muted)" onmouseover="this.style.borderColor='var(--error)';this.style.color='var(--error)'" onmouseout="this.style.borderColor='var(--border-subtle)';this.style.color='var(--text-muted)'" data-id="${film.id}">
              Remove
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Remove button events
  listEl.querySelectorAll('.btn-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      const id      = Number(btn.dataset.id);
      const updated = getMyList().filter(f => f.id !== id);
      saveMyList(updated);
      renderMyList();
    });
  });
}

// ── Clear all ─────────────────────────────────────────────────────────────────
document.getElementById('btn-clear-all').addEventListener('click', () => {
  if (confirm('Remove all films from your list?')) {
    saveMyList([]);
    renderMyList();
  }
});

renderMyList();
