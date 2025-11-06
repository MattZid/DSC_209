import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

console.log(d3);

async function loadEmissionData() {
  try {
    const response = await fetch('./Data/quarterly_greenhouse_long.json');
    const emissionData = await response.json();
    return emissionData;
  } catch (error) {
    console.error('Error loading data:', error);
  }
}

const emissionData = await loadEmissionData();

console.log(emissionData);
