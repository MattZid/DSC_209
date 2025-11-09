import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

async function loadData() {
  const data = await d3.csv('loc.csv', (row) => ({
    ...row,
    line: Number(row.line),
    depth: Number(row.depth),
    length: Number(row.length),
    date: new Date(row.date + 'T00:00' + row.timezone),
    datetime: new Date(row.datetime),
  }));

  return data;
}

function processCommits(data) {
  return d3
    .groups(data, (d) => d.commit)
    .map(([commit, lines]) => {
      let first = lines[0];
      let { author, date, time, timezone, datetime } = first;
      let ret = {
        id: commit,
        url: 'https://github.com/vis-society/lab-7/commit/' + commit,
        author,
        date,
        time,
        timezone,
        datetime,
        hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
        totalLines: lines.length,
      };

      Object.defineProperty(ret, 'lines', {
        value: lines,
        configurable: false,
        writable: false,
        enumerable: false,
      });

      return ret;
    });
}

function renderCommitInfo(data, commits) {
  const container = d3.select('#stats');
  if (!container.node()) return;
  container.html('');

  const fileLineCounts = d3.rollups(
    data,
    (lines) => lines.length,
    (d) => d.file
  );
  const uniqueFiles = fileLineCounts.length;
  const longestFileEntry =
    fileLineCounts.reduce(
      (max, entry) => (entry[1] > max[1] ? entry : max),
      fileLineCounts[0] ?? ['', 0]
    );
  const averageLineLength = d3.mean(data, (d) => d.length) ?? 0;
  const maxDepth = d3.max(data, (d) => d.depth) ?? 0;
  const deepestLine = data.find((d) => d.depth === maxDepth);

  const stats = [
    { label: 'Commits analyzed', value: commits.length.toLocaleString() },
    { label: 'Lines tracked', value: data.length.toLocaleString() },
    { label: 'Unique files', value: uniqueFiles.toLocaleString() },
    {
      label: 'Longest file (lines)',
      value:
        longestFileEntry[0] === ''
          ? 'N/A'
          : `${longestFileEntry[0]} (${longestFileEntry[1].toLocaleString()} lines)`,
    },
    {
      label: 'Average line length',
      value: `${averageLineLength.toFixed(1)} characters`,
    },
    {
      label: 'Maximum depth',
      value:
        maxDepth === 0
          ? 'N/A'
          : `${maxDepth.toLocaleString()}${
              deepestLine ? ` (line ${deepestLine.line} in ${deepestLine.file})` : ''
            }`,
    },
  ];

  container.append('h2').text('Codebase at a Glance');
  const grid = container.append('div').attr('class', 'stats-grid');
  stats.forEach((stat) => {
    const cell = grid.append('div').attr('class', 'stat-item');
    cell.append('div').attr('class', 'stat-label').text(stat.label);
    cell.append('div').attr('class', 'stat-value').text(stat.value);
  });
}


function renderScatterPlot(data, commits) {
  const container = d3.select('#chart');
  const sortedCommits = d3.sort(commits, (d) => -d.totalLines);

  if (!container.node()) return;
  container.html('');

  const width = 900;
  const height = 360;
  const margin = { top: 40, right: 28, bottom: 46, left: 52 };

  const xScale = d3
    .scaleTime()
    .domain(d3.extent(commits, (d) => d.datetime))
    .range([margin.left, width - margin.right]);

  const yScale = d3
    .scaleLinear()
    .domain([0, 24])
    .range([height - margin.bottom, margin.top]);

  const svg = container
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('aria-label', 'Commits by time of day');

  createBrushSelector(svg, xScale, yScale, sortedCommits);

  let [minLines = 0, maxLines = 1] = d3.extent(commits, (d) => d.totalLines);
  if (minLines === maxLines) maxLines = minLines + 1;
  const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([4, 16]);

  const innerWidth = width - margin.left - margin.right;

  svg
    .append('g')
    .attr('class', 'gridlines')
    .attr('transform', `translate(${margin.left}, 0)`)
    .call(
      d3
        .axisLeft(yScale)
        .tickFormat('')
        .tickSize(-innerWidth)
    )
    .selectAll('line')
    .attr('stroke', '#1f2937')
    .attr('stroke-opacity', 0.08);

  svg
    .append('g')
    .attr('class', 'dots')
    .selectAll('circle')
    .data(sortedCommits)
    .join('circle')
    .attr('cx', (d) => xScale(d.datetime))
    .attr('cy', (d) => yScale(d.hourFrac))
    .attr('r', (d) => rScale(d.totalLines))
    .attr('fill', '#3b82f6')
    .style('fill-opacity', 0.75)
    .on('mouseenter', (event, d) => {
      d3.select(event.currentTarget).style('fill-opacity', 1);
      renderTooltipContent(d);
      positionTooltip(event);
    })
    .on('mousemove', (event) => positionTooltip(event))
    .on('mouseleave', (event) => {
      d3.select(event.currentTarget).style('fill-opacity', 0.75);
      renderTooltipContent({});
    });

  const xAxis = d3.axisBottom(xScale).ticks(5).tickFormat(d3.timeFormat('%b %d'));
  const yAxis = d3
    .axisLeft(yScale)
    .ticks(6)
    .tickFormat((d) => `${d}:00`);

  svg
    .append('g')
    .attr('class', 'x-axis')
    .attr('transform', `translate(0, ${height - margin.bottom})`)
    .call(xAxis);

  svg
    .append('g')
    .attr('class', 'y-axis')
    .attr('transform', `translate(${margin.left}, 0)`)
    .call(yAxis);

  svg
    .append('text')
    .attr('x', margin.left)
    .attr('y', margin.top - 12)
    .attr('font-size', '1.1rem')
    .attr('font-weight', 600)
    .text('Commits by time of day');
}

function renderTooltipContent(commit) {
  const tooltip = document.getElementById('commit-tooltip');
  const link = document.getElementById('commit-link');
  const date = document.getElementById('commit-date');

  if (!tooltip || !link || !date) return;

  if (!commit || Object.keys(commit).length === 0) {
    tooltip.classList.add('tooltip-hidden');
    return;
  }

  tooltip.classList.remove('tooltip-hidden');
  link.href = commit.url;
  link.textContent = commit.id;
  date.textContent = commit.datetime?.toLocaleString('en', {
    dateStyle: 'full',
  });
}

function positionTooltip(event) {
  const tooltip = document.getElementById('commit-tooltip');
  if (!tooltip) return;

  const offset = 16;
  const tooltipWidth = tooltip.offsetWidth;
  const tooltipHeight = tooltip.offsetHeight;
  const maxX = window.scrollX + document.documentElement.clientWidth - tooltipWidth - offset;
  const maxY = window.scrollY + document.documentElement.clientHeight - tooltipHeight - offset;
  const minX = window.scrollX + offset;
  const minY = window.scrollY + offset;
  const clampedMaxX = Math.max(maxX, minX);
  const clampedMaxY = Math.max(maxY, minY);

  const x = Math.min(Math.max(event.pageX + offset, minX), clampedMaxX);
  const y = Math.min(Math.max(event.pageY + offset, minY), clampedMaxY);

  tooltip.style.left = `${x}px`;
  tooltip.style.top = `${y}px`;
}

function createBrushSelector(svg, xScale, yScale, commits) {
  const brush = d3
    .brush()
    .on('start brush end', (event) => brushed(event, xScale, yScale, commits));

  svg.append('g').attr('class', 'brush').call(brush);
  svg.selectAll('.dots, .brush ~ *').raise();
}

function brushed(event, xScale, yScale, commits) {
  const selection = event.selection;
  d3.selectAll('.dots circle').classed('selected', (d) =>
    isCommitSelected(selection, d, xScale, yScale)
  );
  renderSelectionCount(selection, commits, xScale, yScale);
  renderLanguageBreakdown(selection, commits, xScale, yScale);
}

function isCommitSelected(selection, commit, xScale, yScale) {
  if (!selection) return false;
  const [[x0, y0], [x1, y1]] = selection;
  const x = xScale(commit.datetime);
  const y = yScale(commit.hourFrac);
  return x0 <= x && x <= x1 && y0 <= y && y <= y1;
}

function renderSelectionCount(selection, commits, xScale, yScale) {
  const countElement = document.getElementById('selection-count');
  if (!countElement) return;
  const selectedCommits = selection
    ? commits.filter((d) => isCommitSelected(selection, d, xScale, yScale))
    : [];
  countElement.textContent =
    selectedCommits.length === 0
      ? 'No commits selected'
      : `${selectedCommits.length.toLocaleString()} commit${
          selectedCommits.length === 1 ? '' : 's'
        } selected`;
}

function renderLanguageBreakdown(selection, commits, xScale, yScale) {
  const container = document.getElementById('language-breakdown');
  if (!container) return;

  const selectedCommits = selection
    ? commits.filter((d) => isCommitSelected(selection, d, xScale, yScale))
    : [];

  if (selectedCommits.length === 0) {
    container.innerHTML = '';
    return;
  }

  const lines = selectedCommits.flatMap((d) => d.lines);
  const breakdown = d3.rollup(
    lines,
    (v) => v.length,
    (d) => d.type || 'Unknown'
  );

  container.innerHTML = '';
  for (const [language, count] of breakdown) {
    const proportion = count / lines.length;
    const formatted = d3.format('.1~%')(proportion);
    container.innerHTML += `
      <dt>${language}</dt>
      <dd>${count.toLocaleString()} lines (${formatted})</dd>
    `;
  }
}



let data = await loadData();
let commits = processCommits(data);
renderCommitInfo(data, commits);
renderScatterPlot(data, commits);
renderTooltipContent({});

console.log(commits);
