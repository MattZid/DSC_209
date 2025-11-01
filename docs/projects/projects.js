import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

const projectsUrl = new URL('../lib/projects.json', import.meta.url);
const projects = await fetchJSON(projectsUrl);

const counterDisplay = document.getElementById("project_count");
const projectsContainer = document.querySelector('.projects');
let selectedYear = null;


function renderProjectList(list) {
  projectsContainer.innerHTML = '';
  let count = 0;

  for (const project of list) {
    renderProjects(project, projectsContainer, 'h2');
    count++;
  }

  counterDisplay.textContent = `${count} Projects`;
}

renderProjectList(projects);

const svg = d3.select('#projects-pie-plot');
const colors = d3.scaleOrdinal(d3.schemeTableau10);

function buildPieData(projectsGiven) {
  return d3
    .rollups(
      projectsGiven,
      (v) => v.length,
      (d) => d.year,
    )
    .map(([year, count]) => ({ value: count, label: year }));
}

const pie = d3.pie().value((d) => d.value);
const arcGenerator = d3.arc().innerRadius(0).outerRadius(50);

const legend = d3.select('.legend');

function renderPieChart(projectList) {
  const data = buildPieData(projectList);
  const filteredByYear = selectedYear
    ? projectList.filter((project) => project.year === selectedYear)
    : projectList;

  svg
    .selectAll('path')
    .data(pie(data))
    .join('path')
    .attr('d', arcGenerator)
    .attr('fill', (d) => colors(d.data.label))
    .attr('stroke', 'none')
    .classed('selected', (d) => selectedYear === d.data.label)
    .on('click', (event, d) => {
      selectedYear = selectedYear === d.data.label ? null : d.data.label;
      const filteredProjectsByYear = selectedYear
        ? projectList.filter((project) => project.year === selectedYear)
        : projectList;
      renderPieChart(projectList);
      renderProjectList(filteredProjectsByYear);
    });

  const legendItems = legend.selectAll('li').data(data, (d) => d.label);

  legendItems.exit().remove();

  legendItems
    .enter()
    .append('li')
    .merge(legendItems)
    .attr('style', (d) => `--color:${colors(d.label)}`)
    .classed('selected', (d) => selectedYear === d.label)
    .html((d) => `<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
    .on('click', (event, d) => {
      selectedYear = selectedYear === d.label ? null : d.label;
      const filteredProjectsByYear = selectedYear
        ? projectList.filter((project) => project.year === selectedYear)
        : projectList;
      renderPieChart(projectList);
      renderProjectList(filteredProjectsByYear);
    });

  renderProjectList(filteredByYear);
}

renderPieChart(projects);

let query = '';
const searchInput = document.querySelector('.searchBar');

if (searchInput) {
  searchInput.addEventListener('input', (event) => {
    query = event.target.value;
    const filteredProjects = projects.filter((project) => {
      if (!query) return true;
      const normalizedQuery = query.toLowerCase();
      return (
        project.title.toLowerCase().includes(normalizedQuery) ||
        project.description.toLowerCase().includes(normalizedQuery)
      );
    });
    renderProjectList(filteredProjects);
    selectedYear = null;
    renderPieChart(filteredProjects);
  });
}
