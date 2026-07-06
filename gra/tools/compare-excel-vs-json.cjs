/**
 * Porównanie: gra/data + robocza bundle vs propozycje Excel (gen-jednostki-staty-maciej)
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', '..');
const TW = [
  'meleeAttack', 'meleeDefence', 'weaponDamage', 'piercing', 'armor',
  'chargeBonus', 'health', 'missileAttack', 'wallAttack', 'Morale bazowe',
];

const PROPS = {
  Soldurii: { meleeAttack: 7, meleeDefence: 2, weaponDamage: 5, piercing: 1, armor: 1, chargeBonus: 5, health: 11, missileAttack: 0, wallAttack: 0, 'Morale bazowe': 100 },
  'Konnica lancowa asyryjska': { meleeAttack: 9, meleeDefence: 4, weaponDamage: 8, piercing: 7, armor: 3, chargeBonus: 12, health: 17, missileAttack: 0, wallAttack: 0, 'Morale bazowe': 75 },
  'Konnica łucznicza asyryjska': { meleeAttack: 4, meleeDefence: 2, weaponDamage: 3, piercing: 2, armor: 2, chargeBonus: 6, health: 15, missileAttack: 4, wallAttack: 0, 'Morale bazowe': 70 },
  'Łucznik asyryjski': { meleeAttack: 2, meleeDefence: 3, weaponDamage: 2, piercing: 1, armor: 2, chargeBonus: 0, health: 8, missileAttack: 4, wallAttack: 0, 'Morale bazowe': 55 },
  Drużynnik: { meleeAttack: 7, meleeDefence: 3, weaponDamage: 5, piercing: 2, armor: 2, chargeBonus: 4, health: 11, missileAttack: 0, wallAttack: 0, 'Morale bazowe': 80 },
  'Jeździec z szczepnikami': { meleeAttack: 6, meleeDefence: 3, weaponDamage: 5, piercing: 4, armor: 2, chargeBonus: 8, health: 14, missileAttack: 2, wallAttack: 0, 'Morale bazowe': 75 },
  'Strażnik bram Harappy': { meleeAttack: 4, meleeDefence: 7, weaponDamage: 4, piercing: 3, armor: 5, chargeBonus: 2, health: 14, missileAttack: 0, wallAttack: 0, 'Morale bazowe': 70 },
  'Piechota induska': { meleeAttack: 6, meleeDefence: 5, weaponDamage: 5, piercing: 2, armor: 3, chargeBonus: 3, health: 12, missileAttack: 0, wallAttack: 0, 'Morale bazowe': 60 },
  'Garnizon Harappy': { meleeAttack: 5, meleeDefence: 8, weaponDamage: 4, piercing: 3, armor: 5, chargeBonus: 2, health: 13, missileAttack: 0, wallAttack: 0, 'Morale bazowe': 72 },
  'Rydwan Kapadokijski': { meleeAttack: 7, meleeDefence: 3, weaponDamage: 6, piercing: 3, armor: 2, chargeBonus: 10, health: 18, missileAttack: 0, wallAttack: 0, 'Morale bazowe': 85 },
  'Piechota hetycka': { meleeAttack: 5, meleeDefence: 7, weaponDamage: 4, piercing: 3, armor: 4, chargeBonus: 3, health: 13, missileAttack: 0, wallAttack: 0, 'Morale bazowe': 65 },
  'Gwardia hetycka': { meleeAttack: 7, meleeDefence: 7, weaponDamage: 6, piercing: 3, armor: 6, chargeBonus: 5, health: 14, missileAttack: 0, wallAttack: 0, 'Morale bazowe': 80 },
  'Gwardia Ishtar': { meleeAttack: 8, meleeDefence: 7, weaponDamage: 7, piercing: 3, armor: 5, chargeBonus: 4, health: 15, missileAttack: 0, wallAttack: 0, 'Morale bazowe': 85 },
  'Wojownik babiloński': { meleeAttack: 6, meleeDefence: 5, weaponDamage: 5, piercing: 2, armor: 3, chargeBonus: 3, health: 11, missileAttack: 0, wallAttack: 0, 'Morale bazowe': 58 },
  'Piechota neobabilońska': { meleeAttack: 6, meleeDefence: 7, weaponDamage: 5, piercing: 3, armor: 6, chargeBonus: 4, health: 13, missileAttack: 0, wallAttack: 0, 'Morale bazowe': 70 },
  'Tyrski miecznik': { meleeAttack: 7, meleeDefence: 3, weaponDamage: 6, piercing: 2, armor: 2, chargeBonus: 6, health: 11, missileAttack: 0, wallAttack: 0, 'Morale bazowe': 75 },
  'Wojownik fenicki': { meleeAttack: 5, meleeDefence: 4, weaponDamage: 4, piercing: 1, armor: 2, chargeBonus: 2, health: 10, missileAttack: 0, wallAttack: 0, 'Morale bazowe': 55 },
  'Gwardia Tyr': { meleeAttack: 7, meleeDefence: 6, weaponDamage: 6, piercing: 2, armor: 4, chargeBonus: 4, health: 12, missileAttack: 0, wallAttack: 0, 'Morale bazowe': 78 },
  Thorakites: { meleeAttack: 5, meleeDefence: 7, weaponDamage: 5, piercing: 2, armor: 5, chargeBonus: 3, health: 13, missileAttack: 0, wallAttack: 0, 'Morale bazowe': 65 },
  Legionarius: { meleeAttack: 6, meleeDefence: 6, weaponDamage: 6, piercing: 2, armor: 4, chargeBonus: 4, health: 12, missileAttack: 0, wallAttack: 0, 'Morale bazowe': 70 },
  Evocati: { meleeAttack: 8, meleeDefence: 8, weaponDamage: 8, piercing: 3, armor: 6, chargeBonus: 5, health: 15, missileAttack: 0, wallAttack: 0, 'Morale bazowe': 90 },
  'iButho z iklwa': { meleeAttack: 5, meleeDefence: 7, weaponDamage: 4, piercing: 4, armor: 3, chargeBonus: 6, health: 18, missileAttack: 0, wallAttack: 0, 'Morale bazowe': 95 },
  'Gwardzista z champi': { meleeAttack: 7, meleeDefence: 5, weaponDamage: 6, piercing: 2, armor: 3, chargeBonus: 5, health: 12, missileAttack: 0, wallAttack: 0, 'Morale bazowe': 80 },
  'Wojownik z żelaznym khopesh': { meleeAttack: 6, meleeDefence: 6, weaponDamage: 6, piercing: 3, armor: 4, chargeBonus: 4, health: 12, missileAttack: 0, wallAttack: 0, 'Morale bazowe': 65 },
  'Mur tarcz (Sargonid)': { meleeAttack: 4, meleeDefence: 8, weaponDamage: 3, piercing: 1, armor: 6, chargeBonus: 1, health: 17, missileAttack: 0, wallAttack: 0, 'Morale bazowe': 75 },
  'Miecznik galijski': { meleeAttack: 8, meleeDefence: 2, weaponDamage: 6, piercing: 2, armor: 1, chargeBonus: 7, health: 12, missileAttack: 0, wallAttack: 0, 'Morale bazowe': 90 },
};

const ORDER = Object.keys(PROPS);

function loadJson(p) {
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function extractFromRoboczaBundle() {
  const htmlPath = path.join(root, 'gra-robocza', 'Gra-ROBOCZA.html');
  if (!fs.existsSync(htmlPath)) return null;
  const html = fs.readFileSync(htmlPath, 'utf8');
  const marker = 'Jednostka:"Wojownik"';
  const idx = html.indexOf(marker);
  if (idx < 0) return null;
  // find array start before first unit
  const chunk = html.slice(0, idx + 50000);
  const lastBracket = chunk.lastIndexOf('units:[');
  if (lastBracket < 0) return null;
  const start = chunk.indexOf('[', lastBracket);
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

function val(u, k) {
  const v = u[k];
  if (v === undefined || v === null || v === '' || v === '—') return null;
  return v;
}

function compareLayer(label, units) {
  if (!units) {
    console.log('\n[' + label + '] BRAK DANYCH');
    return { matchExcel: 0, hasEn: 0, missingEn: 0, partialDiff: 0 };
  }
  const by = Object.fromEntries(units.map(u => [u.Jednostka, u]));
  let matchExcel = 0;
  let hasEnPartial = 0;
  let missingEn = 0;
  let diffFromExcel = 0;
  const rows = [];

  for (const name of ORDER) {
    const u = by[name];
    const prop = PROPS[name];
    if (!u) {
      rows.push({ name, status: 'BRAK W JSON' });
      continue;
    }
    const hasMa = val(u, 'meleeAttack') !== null;
    const hasMd = val(u, 'meleeDefence') !== null;
    if (!hasMa || !hasMd) {
      missingEn++;
    } else {
      hasEnPartial++;
    }
    let diffs = [];
    for (const k of TW) {
      const cur = val(u, k);
      const want = prop[k];
      if (cur === want) continue;
      if (cur === null && want !== undefined) diffs.push(k + ': brak→' + want);
      else if (cur !== want) diffs.push(k + ': ' + cur + '→' + want);
    }
    if (diffs.length === 0 && hasMa && hasMd) matchExcel++;
    else if (hasMa && hasMd && diffs.length) diffFromExcel++;
    rows.push({
      name,
      en: hasMa && hasMd ? 'TAK' : 'NIE',
      pl: `A${u.Atak}/O${u.Obrona}/AD${u['Atak dystansowy'] ?? 0}/HP${u.Health}`,
      diffs: diffs.length ? diffs.join('; ') : (hasMa && hasMd ? 'Zgodne z Excel' : 'Brak EN — Excel czeka'),
    });
  }
  console.log('\n=== ' + label + ' ===');
  console.log('Zgodne z Excel (TW):', matchExcel + '/' + ORDER.length);
  console.log('Ma EN (częściowo):', hasEnPartial, '| Bez EN:', missingEn, '| Ma EN ale ≠ Excel:', diffFromExcel);
  for (const r of rows) {
    console.log(`  ${r.name.padEnd(28)} EN:${r.en.padEnd(3)} PL[${r.pl}]  ${r.diffs}`);
  }
  return { matchExcel, missingEn, diffFromExcel };
}

const graData = loadJson(path.join(root, 'gra', 'data', 'units.json'));
const roboczaKopia = loadJson(path.join(root, 'gra-robocza', 'data — kopia', 'units.json'));
const bundleUnits = extractFromRoboczaBundle();

console.log('Porównanie 26 jednostek · propozycje Excel 2026-07-06');
console.log('gra/data md5:', require('crypto').createHash('md5').update(fs.readFileSync(path.join(root, 'gra', 'data', 'units.json'))).digest('hex').slice(0, 12));

compareLayer('gra/data/units.json (źródło buildu)', graData);
compareLayer('gra-robocza/data — kopia/units.json (stara kopia)', roboczaKopia);
compareLayer('Gra-ROBOCZA.html (bundel grywalny)', bundleUnits);

if (graData && bundleUnits) {
  let same = 0;
  for (const name of ORDER) {
    const a = graData.find(x => x.Jednostka === name);
    const b = bundleUnits.find(x => x.Jednostka === name);
    if (!a || !b) continue;
    let ok = true;
    for (const k of TW) {
      if (val(a, k) !== val(b, k)) { ok = false; break; }
    }
    if (ok && val(a, 'meleeAttack') !== null) same++;
  }
  console.log('\n=== gra/data vs bundel ROBOCZA (TW pola) ===');
  console.log('Identyczne TW:', same + '/' + ORDER.length, '(reszta: brak EN w obu lub rozjazd)');
}
