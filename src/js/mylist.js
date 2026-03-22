import '../css/style.css';

const IMG_BASE = import.meta.env.VITE_IMG_BASE || 'https://image.tmdb.org/t/p/w500';

function getMyList() {
  try { return JSON.parse(localStorage.getItem('moviespace_mylist') || '[]'); } catch { return []; }
}
function saveMyList(list) {
  localStorage.setItem('moviespace_mylist', JSON.stringify(list));
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderMyList() {
  const list   = getMyList();
  const listEl = document.getElementById('mylist-films');
  const emptyEl = document.getElementById('empty-state');
  const countEl = document.getElementById('list-count');
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
    const poster     = film.poster_path ? IMG_BASE + film.poster_path : '';
    const rating     = film.vote_average ? film.vote_average.toFixed(1) : 'N/A';
    const year       = film.release_date ? film.release_date.split('-')[0] : '';
    const desc       = film.overview || 'No description available.';
    const truncDesc  = desc.length > 200 ? desc.slice(0, 200) + '...' : desc;

    return `
      <div class="flex gap-4 bg-[#1a1a1a] border border-white/5 rounded-xl p-4 hover:border-white/10 transition-colors" data-id="${film.id}">
        ${poster
          ? `<img class="w-20 h-28 object-cover rounded-lg shrink-0 bg-[#111]" src="${poster}" alt="${escHtml(film.title)}" loading="lazy" onerror="this.style.background='#1a1a1a';this.src=''">` 
          : `<div class="w-20 h-28 shrink-0 rounded-lg bg-[#111] flex items-center justify-center text-gray-600 text-xs text-center p-1">No Poster</div>`
        }
        <div class="flex flex-col gap-1.5 min-w-0 flex-1">
          <div class="text-sm font-semibold text-white">
            ${escHtml(film.title)} <span class="text-gray-500 font-normal text-xs">${year}</span>
          </div>
          <div class="flex items-center gap-2 text-xs">
            <span class="px-1.5 py-0.5 bg-[#032541] text-blue-300 rounded text-[10px] font-bold">TMDB</span>
            <span class="text-orange-400 font-semibold">${rating} ★</span>
            <span class="text-gray-600">(${(film.vote_count || 0).toLocaleString()} votes)</span>
          </div>
          <div class="text-xs text-gray-500 leading-relaxed">${escHtml(truncDesc)}</div>
          <div class="flex gap-2 mt-1">
            <a href="detail.html?id=${film.id}" class="text-xs px-3 py-1.5 bg-orange-500 hover:bg-orange-400 text-black font-semibold rounded-lg transition-colors no-underline">View Details</a>
            <button class="btn-remove text-xs px-3 py-1.5 border border-white/10 text-gray-400 hover:border-red-500 hover:text-red-400 rounded-lg transition-colors cursor-pointer bg-transparent" data-id="${film.id}">
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
      const id   = Number(btn.dataset.id);
      const list = getMyList().filter(f => f.id !== id);
      saveMyList(list);
      renderMyList();
    });
  });
}

// Clear all
document.getElementById('btn-clear-all').addEventListener('click', () => {
  if (confirm('Remove all films from your list?')) {
    saveMyList([]);
    renderMyList();
  }
});

renderMyList();
