'use strict';
/** Jednorazowy audyt: tech.json vs cuda/budynki/jednostki — node tools/audit-tech-crossref.cjs */
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..', 'data');

const techRoot = JSON.parse(fs.readFileSync(path.join(root, 'tech.json'), 'utf8'));
const tech = techRoot.technologie;
const wonders = JSON.parse(fs.readFileSync(path.join(root, 'wonders.json'), 'utf8'));
const buildings = JSON.parse(fs.readFileSync(path.join(root, 'buildings.json'), 'utf8'));
const units = JSON.parse(fs.readFileSync(path.join(root, 'units.json'), 'utf8'));
const civs = JSON.parse(fs.readFileSync(path.join(root, 'civs.json'), 'utf8'));

const techNames = new Set(tech.map((t) => t.Technologia));
const techByName = Object.fromEntries(tech.map((t) => [t.Technologia, t]));

function epochNum(ep) {
  const m = { Kamień: 1, Kamien: 1, kamien: 1, Brąz: 2, Braz: 2, braz: 2, Żelazo: 3, Zelazo: 3, zelazo: 3 };
  return m[ep] ?? 99;
}

function norm(s) {
  return String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function fuzzyFind(name) {
  const n = norm(name);
  for (const t of tech) {
    if (norm(t.Technologia) === n) return t.Technologia;
  }
  return null;
}

const wonderTechRefs = new Map();
for (const w of [...(wonders.cuda || []), ...(wonders.parkowane_epoka4plus || [])]) {
  for (const t of w.techUnlock || []) {
    if (!wonderTechRefs.has(t)) wonderTechRefs.set(t, []);
    wonderTechRefs.get(t).push(w.id);
  }
}

const bldTechRefs = new Map();
for (const b of buildings) {
  const t = b.techUnlock;
  if (t && String(t).trim()) {
    if (!bldTechRefs.has(t)) bldTechRefs.set(t, []);
    bldTechRefs.get(t).push(b.id);
  }
}

const unitTechRefs = new Map();
for (const u of units) {
  const t = u.Tech;
  if (t && String(t).trim()) {
    if (!unitTechRefs.has(t)) unitTechRefs.set(t, []);
    unitTechRefs.get(t).push(u.Jednostka);
  }
}

const civEntry = { kamien: 1, braz: 2, zelazo: 3 };
function civEntryEpoch(ikonaId) {
  const c = civs.cywilizacje.find((x) => x.ikonaId === ikonaId);
  if (!c) return 1;
  return civEntry[c.epokaWejscia || 'kamien'] || 1;
}

console.log('=== TECH TREE ===');
console.log('Model:', techRoot.drzewko_model);
console.log('Count:', tech.length);
const byEp = {};
for (const t of tech) byEp[t.Epoka || '?'] = (byEp[t.Epoka || '?'] || 0) + 1;
console.log('By epoka:', byEp);

console.log('\n=== MISSING tech.json (exact name) ===');
function reportMissing(label, refs) {
  console.log(`\n-- ${label} --`);
  let n = 0;
  for (const [t, ids] of [...refs].sort()) {
    if (!techNames.has(t)) {
      const fuzzy = fuzzyFind(t);
      console.log(`  MISSING: "${t}" -> ${ids.join(', ')}${fuzzy ? ` (fuzzy match: "${fuzzy}")` : ''}`);
      n++;
    }
  }
  if (!n) console.log('  (none)');
  return n;
}
const missW = reportMissing('wonders', wonderTechRefs);
const missB = reportMissing('buildings', bldTechRefs);
const missU = reportMissing('units', unitTechRefs);

console.log('\n=== tech.json "Odblokowuje budynek" vs buildings.id ===');
const bldIds = new Set(buildings.map((b) => b.id));
const bldNames = new Set(buildings.map((b) => b.nazwa));
let techBldGap = 0;
for (const t of tech) {
  const ob = t['Odblokowuje budynek'];
  if (!ob) continue;
  const parts = String(ob).split(/[;,]/).map((s) => s.trim()).filter(Boolean);
  for (const p of parts) {
    const byId = bldIds.has(p);
    const byName = [...bldNames].some((n) => norm(n) === norm(p) || norm(n).includes(norm(p)) || norm(p).includes(norm(n)));
    if (!byId && !byName) {
      console.log(`  Tech "${t.Technologia}" unlocks unknown building: "${p}"`);
      techBldGap++;
    }
  }
}
if (!techBldGap) console.log('  (no obvious gaps — names may differ from ids)');

console.log('\n=== buildings.techUnlock empty but epoka>1 sample ===');
const emptyTechBld = buildings.filter((b) => !b.techUnlock || !String(b.techUnlock).trim());
console.log('  Buildings without techUnlock:', emptyTechBld.length, '/', buildings.length);

console.log('\n=== WONDER E: tech vs civ epokaWejscia ===');
let viol = 0;
for (const w of wonders.cuda || []) {
  if (w.dostep !== 'E') continue;
  const civ = w.cywilizacje[0];
  const entry = civEntryEpoch(civ);
  for (const tn of w.techUnlock || []) {
    const td = techByName[tn];
    if (!td) continue;
    const te = epochNum(td.Epoka);
    if (te < entry) {
      console.log(`  VIOLATION ${w.id} (${civ} entry=${entry}): ${tn} ep=${te}`);
      viol++;
    }
  }
}
if (!viol) console.log('  (none)');

console.log('\n=== WONDER catalog (active) ===');
for (const w of wonders.cuda || []) {
  const techs = (w.techUnlock || []).join(' + ');
  console.log(`  ep${w.epokaWejscia} ${w.dostep} ${w.id}: ${techs} | ${w.cywilizacje.slice(0, 2).join(',')}${w.cywilizacje.length > 2 ? '...' : ''}`);
}

console.log('\n=== TECH used by wonders — unlocks field in tech.json? ===');
for (const [tn, wids] of [...wonderTechRefs].sort()) {
  const td = techByName[tn];
  if (!td) continue;
  const ob = td['Odblokowuje budynek'] || '';
  const uw = td.Uwagi || '';
  const mentionsCud = norm(ob + uw).includes('cud') || norm(ob).includes('wonder');
  if (!mentionsCud) {
    console.log(`  "${tn}" used by wonders [${wids.join(',')}] — tech row has NO "cud" in Odblokowuje/uwagi`);
  }
}

console.log('\n=== ORPHAN TECH (not in wonder/building/unit Tech column) ===');
const used = new Set([...wonderTechRefs.keys(), ...bldTechRefs.keys(), ...unitTechRefs.keys()]);
const orphan = tech.filter((t) => !used.has(t.Technologia));
console.log('Count:', orphan.length);
orphan.forEach((t) => console.log(`  ${t.Epoka} L${t.Poziom} ${t.Technologia}`));

console.log('\n=== FULL TECH ORDER ===');
[...tech]
  .sort((a, b) => epochNum(a.Epoka) - epochNum(b.Epoka) || (a.Poziom || 0) - (b.Poziom || 0))
  .forEach((t) => {
    const pre = t['Wymaga (prereq)'] || '—';
    console.log(`${epochNum(t.Epoka)}.${String(t.Poziom || 0).padStart(2, '0')} ${t.Technologia} | pre: ${pre} | koszt: ${t['Koszt nauki']}`);
  });

console.log('\n=== SUMMARY ===');
console.log('Missing wonder refs:', missW);
console.log('Missing building refs:', missB);
console.log('Missing unit refs:', missU);
console.log('Wonder civ-entry violations:', viol);
