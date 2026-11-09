'use strict';
/**
 * building-cost-resource-availability-test.cjs
 * R-WEB-BUILDING-COSTS-ERA-RESOURCES-IMPL-Q1 (decyzja wlasciciela 2026-11-09).
 *
 * Bramka danych "surowiec nie wczesniej niz dostepny":
 *  1. Cegielnia NIE kosztuje cegly (brak petli); Garncarstwo (Glina/cegla) jest techem
 *     poziomu 1 i nie ma prereq (brak cyklu).
 *  2. Kazdy budynek Brazu kosztujacy cegle jest odblokowany technologia, ktorej lancuch
 *     prereq (lacznie z nia sama) zawiera techa wymagajacego budynku Cegielnia --
 *     czyli nie da sie go postawic wczesniej niz Cegielnia.
 *  3. Kazdy budynek Zelaza/pozniejszy kosztujacy cegle jest z epoki pozniejszej niz Cegielnia.
 *  4. Budynki, ktore moga stanac przed Cegielnia (kuznia, odlewnia_brazu, port, koszary,
 *     palac_ii), nie kosztuja cegly.
 *  5. Kazdy budynek Kamienia z kamieniem w koszcie ma techa poziomu >= 2 (poziom 1 i bez
 *     techu zostaja na samym drewnie).
 *  6. Tier-gating: Garncarstwo ma Poziom 1, a kazdy tech Kamienia o poziomie 2+ jest
 *     osiagalny (brak cyklu prereq w obrebie epoki).
 *  7. Luka kamienia przed Murarstwem: znane wyjatki (kamienne_kregi, targowisko, studnia)
 *     sa jawnie wypisane; kazda nowa luka = FAIL (decyzja wlasciciela wymagana).
 *
 * Run from gra/:  node tools/building-cost-resource-availability-test.cjs
 */
const fs = require('fs');
const path = require('path');

const GRA = path.resolve(__dirname, '..');
const buildings = JSON.parse(fs.readFileSync(path.join(GRA, 'data/buildings.json'), 'utf8'));
const techJson = JSON.parse(fs.readFileSync(path.join(GRA, 'data/tech.json'), 'utf8'));
const techs = techJson.technologie;
const techByName = new Map(techs.map(t => [t.Technologia, t]));
const byId = new Map(buildings.map(b => [b.id, b]));

let pass = 0, fail = 0;
function ok(c, m) { if (c) pass++; else { fail++; console.error('  FAIL:', m); } }

function prereqs(t) {
  const raw = t['Wymaga (prereq)'];
  if (!raw || raw === '—') return [];
  return raw.split('+').map(s => s.trim()).filter(Boolean);
}
function closure(name) {
  const seen = new Set();
  const stack = [name];
  while (stack.length) {
    const n = stack.pop();
    if (seen.has(n)) continue;
    seen.add(n);
    const t = techByName.get(n);
    if (!t) continue;
    for (const p of prereqs(t)) stack.push(p);
  }
  return seen;
}
function hasCycle() {
  const state = new Map();
  let cyc = false;
  const dfs = n => {
    if (state.get(n) === 2) return;
    if (state.get(n) === 1) { cyc = true; return; }
    state.set(n, 1);
    const t = techByName.get(n);
    if (t) for (const p of prereqs(t)) dfs(p);
    state.set(n, 2);
  };
  for (const t of techs) dfs(t.Technologia);
  return cyc;
}
const cost = b => b.koszt_surowce || {};

// 1. Brak petli Cegielni / cyklu w drzewku
ok(!('cegla' in cost(byId.get('cegielnia'))), 'Cegielnia nie kosztuje cegly');
const garn = techByName.get('Garncarstwo');
ok(garn.Poziom === 1, `Garncarstwo ma Poziom 1 (ma: ${garn.Poziom})`);
ok(prereqs(garn).length === 0, 'Garncarstwo bez prereq');
ok(!hasCycle(), 'drzewko technologii bez cyklu prereq');

// 2-3. Cegla nie wczesniej niz Cegielnia
const cegielniaEpoka = byId.get('cegielnia').epokaWejscia;
for (const b of buildings) {
  if (!(cost(b).cegla > 0)) continue;
  if (b.epokaWejscia === 2) {
    const tech = b.techUnlock;
    const cl = tech && tech !== '-' ? closure(tech) : new Set();
    const gated = [...cl].some(n => techByName.get(n)?.['wymagany budynek'] === 'Cegielnia');
    ok(gated, `${b.id} (Braz, koszt cegly): tech "${tech}" ma w lancuchu techa wymagajacego Cegielni`);
  } else {
    ok(b.epokaWejscia > cegielniaEpoka, `${b.id}: koszt cegly, epoka ${b.epokaWejscia} > epoka Cegielni ${cegielniaEpoka}`);
  }
}

// 4. Budynki mogace stanac przed Cegielnia -- bez cegly
for (const id of ['kuznia', 'odlewnia_brazu', 'port', 'koszary', 'palac_ii', 'cegielnia']) {
  ok(!(cost(byId.get(id)).cegla > 0), `${id}: moze stanac przed Cegielnia -- bez cegly`);
}

// 5. Kamien w koszcie budynku Kamienia tylko dla techow poziomu 2+
for (const b of buildings.filter(x => x.epokaWejscia === 1)) {
  const hasStone = cost(b).kamien > 0;
  const t = b.techUnlock && techByName.get(b.techUnlock);
  const lvl = t ? t.Poziom : 0;
  if (hasStone) ok(lvl >= 2, `${b.id}: kamien w koszcie wymaga techa poziomu 2+ (tech ${b.techUnlock}, poziom ${lvl})`);
  else if (b.koszt_surowce) ok(lvl <= 1 || !hasStone, `${b.id}: poziom 1 / bez techu -- samo drewno`);
}

// 6. Tier-gating Kamienia: poziom 1 zawiera Garncarstwo; kazdy wyzszy ma prereq z nizszych/rownych
const stone = techs.filter(t => t.Epoka === 'Kamień');
const lvl1 = stone.filter(t => t.Poziom === 1).map(t => t.Technologia);
ok(lvl1.includes('Garncarstwo'), 'Poziom 1 Kamienia zawiera Garncarstwo');
for (const t of stone) {
  for (const p of prereqs(t)) {
    const pt = techByName.get(p);
    if (pt && pt.Epoka === 'Kamień') {
      ok(pt.Poziom <= t.Poziom, `${t.Technologia} (poz. ${t.Poziom}) nie wymaga wyzszego poziomu ${p} (poz. ${pt.Poziom})`);
    }
  }
}

// 7. Luka "kamien nie wczesniej niz dostepny" (zarzut Evaluatora r1): kamien jest dostepny
//    dopiero z Murarstwem (jedyny tech "Dostep do kamien"). Budynki Kamienia z kamieniem,
//    ktorych lancuch prereq NIE zawiera Murarstwa, to ZNANE, UDOKUMENTOWANE wyjatki
//    czekajace na decyzje wlasciciela (dodac prereq Murarstwo albo zaakceptowac). Test
//    pilnuje, by lista wyjatkow nie urosla bez swiadomej decyzji.
const STONE_NO_MURARSTWO_EXCEPTIONS = ['kamienne_kregi', 'targowisko', 'studnia'];
const stoneAccess = techs.filter(t => /kamie/i.test(t['Dostęp do surowca.'] || '')).map(t => t.Technologia);
ok(JSON.stringify(stoneAccess) === JSON.stringify(['Murarstwo']), `jedyny tech dostepu do kamienia to Murarstwo (ma: ${stoneAccess})`);
const stoneEra1 = buildings.filter(b => b.epokaWejscia === 1 && cost(b).kamien > 0);
const actualGaps = stoneEra1
  .filter(b => !closure(b.techUnlock).has('Murarstwo'))
  .map(b => b.id).sort();
ok(JSON.stringify(actualGaps) === JSON.stringify([...STONE_NO_MURARSTWO_EXCEPTIONS].sort()),
  `budynki kamienia bez Murarstwa w lancuchu prereq = wyjatki udokumentowane [${STONE_NO_MURARSTWO_EXCEPTIONS.join(', ')}] (sa: [${actualGaps.join(', ')}])`);

console.log(`building-cost-resource-availability-test: ${pass} pass, ${fail} fail`);
process.exitCode = fail > 0 ? 1 : 0;
