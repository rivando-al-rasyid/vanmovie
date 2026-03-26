/**
 * header.js - Reusable Navbar Component
 */

const createHeader = () => {
  const currentPath = window.location.pathname;
  const isIndex = currentPath.endsWith('index.html') || currentPath === '/';
  const isFilms = currentPath.endsWith('films.html');
  const isMyList = currentPath.endsWith('mylist.html');
  const isSignUp = currentPath.endsWith('signup.html');

  const headerHTML = `
    <header class="navbar fixed top-0 left-0 right-0 z-50 backdrop-blur">
      <nav class="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <a href="index.html" class="flex items-center gap-2 font-semibold no-underline">
          <img src="./src/asset/icon.svg" alt="Icon">
          <span>MovieSpace</span>
        </a>
        <ul class="flex items-center gap-4 list-none m-0 p-0">
          <li>
            <a href="films.html" class="nav-link text-sm no-underline ${isFilms ? 'active' : ''}">
              All Films
            </a>
          </li>
          <li>
            <a href="mylist.html" class="nav-link text-sm no-underline ${isMyList ? 'active' : ''}">
              My Watchlists
            </a>
          </li>
          <li>
            <a href="index.html" class="btn-nav text-sm no-underline ${isIndex || isSignUp ? 'active' : ''}">
              Login
            </a>
          </li>
        </ul>
      </nav>
    </header>
  `;

  document.body.insertAdjacentHTML('afterbegin', headerHTML);
};

// Initialize header when DOM is loaded
document.addEventListener('DOMContentLoaded', createHeader);