console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

document.body.insertAdjacentHTML(
  'afterbegin',
  `
	<label class="color-scheme">
		Theme:
		<select>
      <option value="light">Light</option>
      <option value="dark" selected>Dark</option>
      <option value="light dark">Automatic</option>
    </select>
	</label>`,
);
const select = document.querySelector('.color-scheme select');

if (localStorage.colorScheme) {
  select.value = localStorage.colorScheme;
  document.documentElement.style.setProperty('color-scheme', localStorage.colorScheme);
}

select.addEventListener('input', function (event) {
  console.log('color scheme changed to', event.target.value);
  document.documentElement.style.setProperty('color-scheme', event.target.value);
  localStorage.colorScheme = event.target.value
});


let pages = [
  { url: '', title: 'Home' },
  { url: 'projects/', title: 'Projects' },
  { url: 'contact/', title: 'Contact' },
  { url: 'portfolio/', title: 'Portfolio' },
  { url:'https://github.com/MattZid', title: 'GitHub' },
  { url:'P2/', title: 'Project 2' },
];

let nav = document.createElement('nav');
document.body.prepend(nav);


const BASE_PATH =
  (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
    ? '/docs/'
    : '/DSC_209/';

const IMG_BASE_PATH =
  (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
    ? '/docs/'
    : '/DSC_209/';
    
const isLocalHost = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
const isFileProtocol = location.protocol === 'file:';
    
for (let p of pages) {
  let url = p.url.startsWith('http') ? p.url : BASE_PATH + (p.url || '');
  let title = p.title;

  let a = document.createElement('a');
  a.href = url;
  a.textContent = title;
  nav.append(a);

  if (a.host === location.host && a.pathname === location.pathname) {
    a.classList.add('current');
    a.classList.toggle('current', a.host === location.host && a.pathname === location.pathname);
  }
  if (p.url.startsWith('http')) a.target = "_blank";
}

export async function fetchJSON(url) {
  try {
    const requestUrl = url instanceof URL ? url : new URL(url, import.meta.url);
    const response = await fetch(requestUrl);
    console.log('Response object:', response);
    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    console.log('Parsed JSON:', data);
    return data;

  } catch (error) {
    console.error('Error fetching or parsing JSON data:', error);
    try {
      const requestUrl = url instanceof URL ? url : new URL(url, import.meta.url);
      const module = await import(requestUrl.href, { assert: { type: 'json' } });
      return module.default;
    } catch (importError) {
      console.error('Fallback JSON import failed:', importError);
      return [];
    }
  }
}

export function renderProjects(project, containerElement, headingLevel = 'h2') {  
  const article = document.createElement('article');

  const resolveImagePath = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;

    const normalizedPath = path.replace(/^\.?\/*/, '');

    if (isFileProtocol) {
      return new URL(normalizedPath, import.meta.url).href;
    }

    if (isLocalHost) {
      return IMG_BASE_PATH + normalizedPath.replace(/^docs\//, '');
    }

    return IMG_BASE_PATH + normalizedPath.replace(/^docs\//, '');
  };

  const imgSrc = resolveImagePath(project.image);

  article.innerHTML = `
    <h3>${project.title}</h3>
    <img src="${imgSrc}" alt="${project.title}" width="300" height="300">
    <p>${project.description}</p>
    `;
  containerElement.appendChild(article);
}

export async function fetchGitHubData(username) {
  return fetchJSON(`https://api.github.com/users/${username}`);
}
