import "../css/style.css";
import { imgUrl } from "./fetchData.js";
import { getMyList, saveMyList } from "./addlist.js";

// ── Card builder ──────────────────────────────────────────────────────────────
function createFilmCard(film) {
  const poster = imgUrl(film.poster_path);
  const rating = film.vote_average ? film.vote_average.toFixed(1) : "N/A";
  const year = film.release_date ? film.release_date.split("-")[0] : "";
  const desc = film.overview || "No description available.";
  const truncDesc = desc.length > 200 ? desc.slice(0, 200) + "..." : desc;

  // Article card
  const article = document.createElement("li");
  article.dataset.id = film.id;
  article.className = "flex gap-4 rounded-xl p-4 transition-colors";
  article.style.cssText =
    "background-color:var(--bg-card);border:1px solid var(--border-subtle)";
  article.addEventListener(
    "mouseover",
    () => (article.style.borderColor = "var(--border)"),
  );
  article.addEventListener(
    "mouseout",
    () => (article.style.borderColor = "var(--border-subtle)"),
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
    article.appendChild(img);
  } else {
    const placeholder = document.createElement("div");
    placeholder.className =
      "w-20 h-28 shrink-0 rounded-lg flex items-center justify-center text-xs text-center p-1";
    placeholder.style.cssText =
      "background-color:var(--bg-card);color:var(--text-faint)";
    placeholder.textContent = "No Poster";
    article.appendChild(placeholder);
  }

  // Info
  const info = document.createElement("div");
  info.className = "flex flex-col gap-1.5 min-w-0 flex-1";

  const titleRow = document.createElement("div");
  titleRow.className = "text-sm font-semibold";
  const titleText = document.createTextNode(film.title + " ");
  const yearSpan = document.createElement("span");
  yearSpan.className = "font-normal text-xs";
  yearSpan.textContent = year;
  titleRow.appendChild(titleText);
  titleRow.appendChild(yearSpan);

  const ratingRow = document.createElement("div");
  ratingRow.className = "flex items-center gap-2 text-xs";
  ratingRow.innerHTML = `<span class="tmdb-badge">IMDb</span><span class="font-semibold">${rating} ★</span><span>(${(film.vote_count || 0).toLocaleString()} votes)</span>`;

  const overview = document.createElement("p");
  overview.className = "text-xs leading-relaxed m-0";
  overview.textContent = truncDesc;

  const actions = document.createElement("div");
  actions.className = "flex gap-2 mt-1";

  const detailLink = document.createElement("a");
  detailLink.href = `detail.html?id=${film.id}`;
  detailLink.className =
    "btn-primary text-xs px-3 py-1.5 rounded-full no-underline";
  detailLink.textContent = "View Details";

  const removeBtn = document.createElement("button");
  removeBtn.type = "button";
  removeBtn.className =
    "btn-remove text-xs px-3 py-1.5 rounded-full transition-colors cursor-pointer bg-transparent";
  removeBtn.style.cssText =
    "border:1px solid var(--border-subtle);color:var(--text-muted)";
  removeBtn.textContent = "Remove";
  removeBtn.addEventListener("mouseover", () => {
    removeBtn.style.borderColor = "var(--error)";
    removeBtn.style.color = "var(--error)";
  });
  removeBtn.addEventListener("mouseout", () => {
    removeBtn.style.borderColor = "var(--border-subtle)";
    removeBtn.style.color = "var(--text-muted)";
  });
  removeBtn.addEventListener("click", () => {
    saveMyList(getMyList().filter((f) => f.id !== film.id));
    renderMyList();
  });

  actions.appendChild(detailLink);
  actions.appendChild(removeBtn);
  info.append(titleRow, ratingRow, overview, actions);
  article.appendChild(info);

  return article;
}

// ── Render ────────────────────────────────────────────────────────────────────
function renderMyList() {
  const list = getMyList();
  const listEl = document.getElementById("mylist-films");
  const emptyEl = document.getElementById("empty-state");
  const countEl = document.getElementById("list-count");

  countEl.textContent = list.length ? `(${list.length})` : "";

  if (!list.length) {
    listEl.replaceChildren();
    emptyEl.classList.remove("hidden");
    return;
  }

  emptyEl.classList.add("hidden");
  listEl.replaceChildren(...list.map(createFilmCard));
}

renderMyList();
