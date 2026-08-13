'use strict';
/**
 * node tools/era-gate-ui-test.cjs
 * R-EPOKA-CUD-ZAKRES-Q1=B — UI "co brakuje do awansu epoki" (era-gate-ui.ts). Bramka
 * sama (owner-epoch.ts) NIE JEST tu testowana ponownie (patrz era-cud-warunek-awansu-test.cjs) —
 * tu weryfikujemy WYŁĄCZNIE, że computeEraGateInfo/formatEraGateSummary poprawnie OPISUJĄ
 * jej stan graczowi w czterech scenariuszach z zadania:
 *   (i)   brakujące technologie
 *   (ii)  brakujący NIEZBUDOWANY cud
 *   (iii) brak przypisanego cudu (warunek nieaktywny)
 *   (iv)  oba warunki spełnione (można awansować)
 */

const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const GRA = path.resolve(__dirname, '..');
const entry = path.join(__dirname, '.era-gate-ui-entry.ts');
const bundle = path.join(__dirname, '.era-gate-ui-bundle.cjs');

fs.writeFileSync(entry, `
export { computeEraGateInfo, formatEraGateSummary, eraLabelForNumber } from '../src/game/era-gate-ui';
`, 'utf8');

esbuild.buildSync({
  entryPoints: [entry],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  loader: { '.ts': 'ts', '.json': 'json' },
  outfile: bundle,
  absWorkingDir: GRA,
  logLevel: 'silent',
});

const { computeEraGateInfo, formatEraGateSummary, eraLabelForNumber } = require(bundle);
const tech = require('../data/tech.json').technologie;

let passed = 0;
let failed = 0;
function assert(c, msg) {
  if (c) { passed++; console.log('PASS:', msg); }
  else { failed++; console.error('FAIL:', msg); }
}

console.log('era-gate-ui-test\n');

const era1Techs = tech.filter(t => t.Epoka === 'Kamień').map(t => t.Technologia).filter(Boolean);
const era2Techs = tech.filter(t => t.Epoka === 'Brąz').map(t => t.Technologia).filter(Boolean);

// ---------------------------------------------------------------------------
// (i) Brakujące technologie (Grecja epoka 1, brak przypisanego cudu tej epoce)
// ---------------------------------------------------------------------------
{
  const done = new Set(era1Techs.slice(1)); // brakuje dokładnie 1 tech
  const info = computeEraGateInfo({
    era: 1,
    techRows: tech,
    done,
    civType: 'grecy',
    completedWonderIds: [],
  });
  assert(info.techsComplete === false, '(i) techsComplete=false gdy brakuje tech');
  assert(info.missingTechs.length === 1, '(i) missingTechs zawiera dokładnie 1 wpis');
  assert(info.missingTechs[0].name === era1Techs[0], '(i) missingTechs wskazuje właściwą brakującą technologię');
  assert(info.wonderRequired === false, '(i) Grecja epoka 1 → brak wymogu cudu (Kolos jest w epoce 3)');
  assert(info.wonderSatisfied === true, '(i) wonderSatisfied=true gdy warunek nieaktywny (nawet przy brakujących tech)');
  assert(info.canAdvance === false, '(i) canAdvance=false — tech blokuje mimo braku wymogu cudu');
  assert(info.blocked === true, '(i) blocked=true');
  const summary = formatEraGateSummary(info);
  assert(typeof summary === 'string' && summary.includes('1 technologii'), '(i) formatEraGateSummary wspomina liczbę brakujących tech');
  assert(!summary.includes('cud'), '(i) formatEraGateSummary NIE wspomina cudu gdy warunek nieaktywny');
}

// ---------------------------------------------------------------------------
// (ii) Brakujący NIEZBUDOWANY cud (Egipt epoka 1, komplet tech, Piramidy nie zbudowane)
// ---------------------------------------------------------------------------
{
  const done = new Set(era1Techs);
  const info = computeEraGateInfo({
    era: 1,
    techRows: tech,
    done,
    civType: 'egipt',
    completedWonderIds: [],
  });
  assert(info.techsComplete === true, '(ii) techsComplete=true (komplet tech epoki 1)');
  assert(info.missingTechs.length === 0, '(ii) missingTechs pusta');
  assert(info.wonderRequired === true, '(ii) Egipt epoka 1 → wymóg cudu aktywny (Piramidy)');
  assert(info.wonders.length === 1 && info.wonders[0].id === 'piramidy', '(ii) wonders zawiera Piramidy');
  assert(info.wonders[0].name === 'Piramidy', '(ii) nazwa cudu odczytana z wonders.json (Piramidy)');
  assert(info.wonders[0].built === false, '(ii) Piramidy NIE zbudowane');
  assert(info.wonders[0].inProgress === false, '(ii) Piramidy bez inProgressWonderIds → nie w budowie');
  assert(info.wonderSatisfied === false, '(ii) wonderSatisfied=false');
  assert(info.canAdvance === false, '(ii) canAdvance=false');
  assert(info.blocked === true, '(ii) blocked=true — WYŁĄCZNIE brak cudu blokuje (tech komplet)');
  const summary = formatEraGateSummary(info);
  assert(summary.includes('Piramidy'), '(ii) formatEraGateSummary wymienia z nazwy brakujący cud');
  assert(!summary.includes('technologii'), '(ii) formatEraGateSummary NIE wspomina tech gdy komplet');

  // Wariant: cud zakolejkowany, ale jeszcze nie ukończony -> inProgress=true, nadal blocked.
  const infoInProgress = computeEraGateInfo({
    era: 1,
    techRows: tech,
    done,
    civType: 'egipt',
    completedWonderIds: [],
    inProgressWonderIds: ['piramidy'],
  });
  assert(infoInProgress.wonders[0].inProgress === true, '(ii) inProgressWonderIds=[piramidy] -> inProgress=true');
  assert(infoInProgress.wonders[0].built === false, '(ii) w budowie != zbudowany');
  assert(infoInProgress.blocked === true, '(ii) w budowie nadal blocked (jeszcze nie ukończony)');
}

// ---------------------------------------------------------------------------
// (iii) Brak przypisanego cudu (warunek nieaktywny) — Fenicjanie epoka 1 (Petra jest w epoce 3
// od naprawy ECHO A 2026-08-13, wcześniej epoka 2 — w obu przypadkach NIE epoka 1)
// ---------------------------------------------------------------------------
{
  const done = new Set(era1Techs);
  const info = computeEraGateInfo({
    era: 1,
    techRows: tech,
    done,
    civType: 'fenicjanie',
    completedWonderIds: [],
  });
  assert(info.wonderRequired === false, '(iii) Fenicjanie epoka 1 → brak cudu przypisanego (Petra jest w epoce 3)');
  assert(info.wonders.length === 0, '(iii) wonders pusta lista');
  assert(info.wonderSatisfied === true, '(iii) wonderSatisfied=true — warunek nieaktywny');
  assert(info.techsComplete === true, '(iii) techsComplete=true (komplet tech epoki 1)');
  assert(info.canAdvance === true, '(iii) canAdvance=true — oba warunki spełnione (jeden nieaktywny)');
  assert(info.blocked === false, '(iii) blocked=false — nic nie blokuje, panel NIE powinien się pokazać');
  assert(formatEraGateSummary(info) === null, '(iii) formatEraGateSummary=null gdy nie zablokowane (panel/tooltip ukryty)');
}

// ---------------------------------------------------------------------------
// (iv) Oba warunki spełnione (można awansować) — Egipt epoka 1, komplet tech + Piramidy zbudowane
// ---------------------------------------------------------------------------
{
  const done = new Set(era1Techs);
  const info = computeEraGateInfo({
    era: 1,
    techRows: tech,
    done,
    civType: 'egipt',
    completedWonderIds: ['piramidy'],
  });
  assert(info.techsComplete === true, '(iv) techsComplete=true');
  assert(info.wonderRequired === true, '(iv) wonderRequired=true (Egipt ma Piramidy epoki 1)');
  assert(info.wonders[0].built === true, '(iv) Piramidy zbudowane -> built=true');
  assert(info.wonderSatisfied === true, '(iv) wonderSatisfied=true');
  assert(info.canAdvance === true, '(iv) canAdvance=true — oba warunki spełnione');
  assert(info.blocked === false, '(iv) blocked=false — panel/tooltip NIE powinien się pokazać');
  assert(formatEraGateSummary(info) === null, '(iv) formatEraGateSummary=null');
}

// ---------------------------------------------------------------------------
// Chińczycy: 2 cuda w epoce 3 — TYLKO JEDEN zbudowany wystarcza (wonderSatisfied=true),
// ale panel musi nadal wymienić OBA (żeby gracz wiedział, że miał wybór).
// ---------------------------------------------------------------------------
{
  const era3Techs = tech.filter(t => t.Epoka === 'Żelazo').map(t => t.Technologia).filter(Boolean);
  const doneAll = new Set([...era1Techs, ...era2Techs, ...era3Techs]);
  const info = computeEraGateInfo({
    era: 3,
    techRows: tech,
    done: doneAll,
    civType: 'chinczycy',
    completedWonderIds: ['terakotowa_armia'],
  });
  assert(info.wonders.length === 2, 'Chińczycy epoka 3: wonders lista zawiera OBA cuda (nie tylko zbudowany)');
  assert(info.wonders.some(w => w.id === 'terakotowa_armia' && w.built === true),
    'Chińczycy: terakotowa_armia oznaczona built=true');
  assert(info.wonders.some(w => w.id === 'palac_weiyang' && w.built === false),
    'Chińczycy: palac_weiyang oznaczona built=false (niezbudowany, ale nie blokuje)');
  assert(info.wonderSatisfied === true, 'Chińczycy: wonderSatisfied=true (wystarczy JEDEN z dwóch)');
  // era 3 = maxDefinedEra (dziś 3) -> isMaxEra=true -> blocked=false niezależnie od reszty.
  assert(info.isMaxEra === true, 'Chińczycy epoka 3 = maxDefinedEra (dziś 3) -> isMaxEra=true');
  assert(info.blocked === false, 'Chińczycy epoka 3: blocked=false (max epoka, nic dalej do odblokowania)');
}

// ---------------------------------------------------------------------------
// isMaxEra: przy najwyższej zdefiniowanej epoce panel nigdy nie blokuje, NAWET gdy
// warunki formalnie nie są spełnione (nie ma dokąd awansować).
// ---------------------------------------------------------------------------
{
  const info = computeEraGateInfo({
    era: 3,
    techRows: tech,
    done: new Set(), // celowo pusty — zero tech epoki 3 zbadanych
    civType: 'grecy',
    completedWonderIds: [],
  });
  assert(info.isMaxEra === true, 'isMaxEra: era=3=maxDefinedEra -> true');
  assert(info.techsComplete === false, 'isMaxEra: techsComplete formalnie false (zero tech zbadanych)');
  assert(info.blocked === false, 'isMaxEra: blocked=false MIMO niekompletnych tech — brak epoki 4 do odblokowania');
  assert(formatEraGateSummary(info) === null, 'isMaxEra: formatEraGateSummary=null');
}

// ---------------------------------------------------------------------------
// eraLabelForNumber — spójność etykiet z tech.json ('Kamień'/'Brąz'/'Żelazo')
// ---------------------------------------------------------------------------
assert(eraLabelForNumber(1) === 'Kamień', 'eraLabelForNumber(1) === Kamień');
assert(eraLabelForNumber(2) === 'Brąz', 'eraLabelForNumber(2) === Brąz');
assert(eraLabelForNumber(3) === 'Żelazo', 'eraLabelForNumber(3) === Żelazo');

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
