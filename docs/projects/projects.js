import { fetchJSON, renderProjects } from '../global.js';

const projects = await fetchJSON('../lib/projects.json');

const projectsContainer = document.querySelector('.projects');
// renderProjects(projects, projectsContainer, 'h2');

projectsContainer.innerHTML = '';

for (const project of projects) {
  renderProjects(project, projectsContainer, 'h2');
}