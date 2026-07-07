'use strict';
const fs = require('fs');
const path = require('path');

const mapPath = process.argv[2] || path.join(process.env.TEMP, 'civ-dist-sm', 'index-CYDEEV5y.js.map');
if (!fs.existsSync(mapPath)) {
  console.error('No map:', mapPath);
  process.exit(1);
}

const map = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
const names = map.names || [];
const sources = map.sources || [];
const contents = map.sourcesContent || [];

console.log('sources:', sources.length, 'names:', names.length);

// Find Mt in names array and trace to source
const mtIndices = [];
names.forEach((n, i) => { if (n === 'Mt') mtIndices.push(i); });
console.log('Mt name indices:', mtIndices.length);

// Search original source for exports that could cause TDZ
const targets = [
  'city-names-pool',
  'civ-names',
  'display-names',
  'loader.ts',
  'cluster-spawn',
  'cluster-start',
  'civ-visual',
  'planned-march',
  'okolica',
  'workerFieldOverlay',
];

for (let si = 0; si < sources.length; si++) {
  const src = sources[si].replace(/\\/g, '/');
  if (!targets.some(t => src.includes(t))) continue;
  const content = contents[si] || '';
  const exports = [...content.matchAll(/export\s+(?:const|let|function|async function)\s+(\w+)/g)].map(m => m[1]);
  console.log('\n---', src);
  console.log('exports:', exports.slice(0, 20).join(', '));
}

// Parse mappings for Mt - use source-map if available
async function main() {
  try {
    const { SourceMapConsumer } = require('source-map');
    await SourceMapConsumer.with(map, null, consumer => {
      // Sample positions in gra-robocza error zone - search HTML line ~23496 area
      // Instead search generated file for "Mt" identifier in mappings
      const found = new Map();
      consumer.eachMapping(m => {
        if (m.name === 'Mt' || (names[m.name] === 'Mt')) {
          const key = `${m.source}:${m.line}:${m.column}`;
          if (!found.has(key)) found.set(key, m);
        }
      });
      console.log('\nMappings named Mt:', found.size);
      for (const m of [...found.values()].slice(0, 15)) {
        console.log(`  ${m.source}:${m.line}:${m.column} (gen ${m.generatedLine}:${m.generatedColumn})`);
      }
    });
  } catch (e) {
    console.log('source-map pkg unavailable:', e.message);
    // Fallback: grep bundled HTML for patterns around civ-names re-exports
    const htmlPath = path.resolve(__dirname, '../../gra-robocza/Gra-ROBOCZA.html');
    if (fs.existsSync(htmlPath)) {
      const html = fs.readFileSync(htmlPath, 'utf8');
      const scripts = [...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)];
      const main = scripts.map(s => s[2]).sort((a, b) => b.length - a.length)[0] || '';
      const re = /\b(let|const)\s+Mt\b/g;
      let hit;
      const positions = [];
      while ((hit = re.exec(main)) !== null) positions.push(hit.index);
      console.log('Mt let/const in gra-robocza bundle:', positions.length);
      if (positions[0] != null) {
        const i = positions[0];
        console.log('context:', main.slice(i - 120, i + 200));
      }
    }
  }
}
main();
