import { fetchJSON, renderProjects } from '../global.js';

const projects = await fetchJSON('../lib/projects.json');

const projectsContainer = document.querySelector('.projects');

projectsContainer.innerHTML = '';

let counter = 0;

const counterDisplay = document.getElementById("project_count");


for (const project of projects) {
  renderProjects(project, projectsContainer, 'h2');
  counter++;
}

counterDisplay.textContent = counter + " Projects";