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
];

let nav = document.createElement('nav');
document.body.prepend(nav);

for (let p of pages) {
  let url = p.url.startsWith('http') ? p.url : `/docs/${p.url}`;  
  let title = p.title;
  //nav.insertAdjacentHTML('beforeend', `<a href="${url}">${title}</a>`);
  let a = document.createElement('a');
  a.href = url;
  a.textContent = title;
  nav.append(a);
  if (a.host === location.host && a.pathname === location.pathname) {
    a.classList.add('current');
    a.classList.toggle('current', a.host === location.host && a.pathname === location.pathname,);
    }
  if (p.url.startsWith('http')) {
    a.target = "_blank";
  }
}

const BASE_PATH =
  location.hostname === 'localhost' || location.hostname === '127.0.0.1'
    ? '/' // Local server
    : '/website/'; // GitHub Pages repo name

if (!url.startsWith('http')) {
  url = BASE_PATH + url;
}
