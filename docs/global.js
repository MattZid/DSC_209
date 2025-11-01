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
let select = document.querySelector('.color-scheme select');

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
    // Fetch the JSON file from the given URL
    const response = await fetch(url);
    console.log('Response object:', response);
    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.statusText}`);
    }
    const data = await response.json();
    console.log('Parsed JSON:', data);
    return data;

  } catch (error) {
    console.error('Error fetching or parsing JSON data:', error);
  }
}

export function renderProjects(project, containerElement, headingLevel = 'h2') {  
  const article = document.createElement('article');
  article.innerHTML = `
    <h3>${project.title}</h3>
    <img src="${project.image}" alt="${project.title}" width="300" height="300">
    <p>${project.description}</p>
    `;
  containerElement.appendChild(article);
}



export async function fetchGitHubData(username) {
  return fetchJSON(`https://api.github.com/users/${username}`);
}
