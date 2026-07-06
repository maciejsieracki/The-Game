const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..', '..');
const src = JSON.parse(fs.readFileSync(path.join(root, 'gra', 'data', 'units.json'), 'utf8'));
const byName = Object.fromEntries(src.map(u => [u.Jednostka, u]));

const paths = [
  path.join(root, 'gra-kanon', 'Gra-KANON.html'),
  path.join(root, 'gra-robocza', 'Gra-ROBOCZA.html'),
  path.join(root, 'Gra-FINALNA.html'),
  path.join(root, 'gra-kanon', 'data — kopia', 'units.json'),
  path.join(root, 'gra-robocza', 'data — kopia', 'units.json'),
];

function extractUnitsFromHtml(html) {
  const idx = html.indexOf('"units":');
  if (idx < 0) return null;
  const start = html.indexOf('[', idx);
  if (start < 0) return null;
  let depth = 0;
  for (let i = start; i < html.length; i++) {
    if (html[i] === '[') depth++;
    else if (html[i] === ']') {
      depth--;
      if (depth === 0) {
        try {
          return JSON.parse(html.slice(start, i + 1));
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

const crypto = require('crypto');
const srcMd5 = crypto.createHash('md5').update(fs.readFileSync(path.join(root, 'gra', 'data', 'units.json'))).digest('hex');

console.log('=== ŹRÓDŁO gra/data/units.json ===');
console.log('Liczba:', src.length);
console.log('md5:', srcMd5);

function fromBundle(html, name) {
  const idx = html.indexOf('Jednostka:"' + name + '"');
  if (idx < 0) return null;
  const slice = html.slice(Math.max(0, idx - 200), idx + 900);
  const pick = (k) => {
    const m = slice.match(new RegExp(k + ':([^,}\]]+)'));
    return m ? m[1].replace(/^"|"$/g, '') : undefined;
  };
  return {
    Atak: pick('Atak'),
    Obrona: pick('Obrona'),
    meleeAttack: pick('meleeAttack'),
    meleeDefence: pick('meleeDefence'),
    health: pick('health'),
    Health: pick('Health'),
    fieldPower: pick('fieldPower'),
  };
}

const sampleNames = ['Hastati', 'Soldurii', 'Thorakites', 'Wojownik', 'Gaesatae', 'Legionarius'];
const kanonHtml = fs.existsSync(path.join(root, 'gra-kanon', 'Gra-KANON.html'))
  ? fs.readFileSync(path.join(root, 'gra-kanon', 'Gra-KANON.html'), 'utf8')
  : '';

console.log('\n=== Porównanie próbek: gra/data vs KANON bundle ===');
for (const name of sampleNames) {
  const g = byName[name];
  const k = fromBundle(kanonHtml, name);
  console.log('\n' + name + ':');
  console.log('  gra/data:', {
    Atak: g?.Atak, Obrona: g?.Obrona,
    meleeAttack: g?.meleeAttack, meleeDefence: g?.meleeDefence, health: g?.health,
  });
  console.log('  kanon bundle:', k);
}

for (const p of paths) {
  console.log('\n---', path.relative(root, p), '---');
  if (!fs.existsSync(p)) {
    console.log('BRAK pliku');
    continue;
  }
  if (p.endsWith('.html')) {
    const html = fs.readFileSync(p, 'utf8');
    const units = extractUnitsFromHtml(html);
    if (!units) {
      console.log('Nie wyciągnięto JSON units z bundla');
      continue;
    }
    console.log('Jednostek w bundlu:', units.length);
    let diff = 0;
    const samples = [];
    for (const u of units) {
      const s = byName[u.Jednostka];
      if (!s) {
        diff++;
        continue;
      }
      for (const k of ['meleeAttack', 'meleeDefence', 'health', 'missileAttack', 'weaponDamage']) {
        const a = s[k];
        const b = u[k];
        if (a !== b && !(a == null && b == null)) {
          diff++;
          if (samples.length < 5) samples.push({ n: u.Jednostka, k, src: a, bundle: b });
        }
      }
    }
    console.log('Różnice pól TW vs gra/data (próbka kluczy):', diff);
    if (samples.length) console.log('Przykłady:', JSON.stringify(samples, null, 2));
    else console.log('Staty TW ( próbka ) = IDENTYCZNE z gra/data');
  } else {
    const other = JSON.parse(fs.readFileSync(p, 'utf8'));
    console.log('Liczba:', other.length);
    const h = require('crypto').createHash('md5').update(fs.readFileSync(p)).digest('hex');
    console.log('md5:', h);
    const same = JSON.stringify(src) === JSON.stringify(other);
    console.log('Identyczny z gra/data:', same ? 'TAK' : 'NIE');
  }
}
