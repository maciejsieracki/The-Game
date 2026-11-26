'use strict';
/**
 * alliance-label-clean-test.cjs — R-WEB-DIPLO-ALLIANCE-LABEL-AFTER-DEAL-Q1 (tag ALLYCLEAN, odp. 7A).
 * Run from gra/:  node tools/alliance-label-clean-test.cjs   (opcjonalnie ESBUILD_PATH=...)
 *
 * Pokrywa:
 *  A) para ze statusem „sojusz” i aktywną umową sojuszu NIE jest nieaktualna (etykieta zostaje);
 *  B) po usunięciu umowy sojuszu (wygaśnięcie / zerwanie / odmowa) status „sojusz” jest nieaktualny → wraca do pokoju;
 *  C) NAP bez sojuszu nie podtrzymuje statusu „sojusz”;
 *  D) umowa sojuszu innej pary nie podtrzymuje statusu tej pary;
 *  E) statusy inne niż „sojusz” (wojna, pokój, neutralni) nigdy nie są oznaczane jako nieaktualne;
 *  F) wszystkie rodzaje sojuszu (wojskowy legacy, obronny, pełny) są rozpoznawane;
 *  G) main.ts: reconcileAllianceStatusAfterDeals wołana po każdej ścieżce usunięcia umowy sojuszu
 *     (odmowa wezwania, wygaśnięcie, zerwanie trybutu, wasalizacja, odmowa obrony sojusznika);
 *     ciało wywołuje alliancePairsToReset z wyłączeniem same-civ (text-check — main.ts nie jest
 *     ładowalny w node; zachowanie czystej funkcji pokrywają H–J);
 *  H) para same-civ (major AI ↔ MP, exempt) z „sojusz” bez umowy NIE jest nieaktualna (regres z review);
 *  I) alliancePairsToReset: pary nieaktualne wybierane, exempt i statusy inne niż „sojusz” pomijane;
 *  J) alliancePairsToReset: kolejność owners i brak fałszywych trafień dla wielu par.
 */
const fs = require('fs');
const path = require('path');
let esbuild;
for (const p of [process.env.ESBUILD_PATH, path.resolve(__dirname, '..', 'node_modules', 'esbuild')]) {
  if (!p) continue;
  try { esbuild = require(p); break; } catch (e) { /* next */ }
}
if (!esbuild) { console.error('esbuild not found (npm install w gra/ lub ESBUILD_PATH)'); process.exit(1); }

const SRC = path.resolve(__dirname, '..', 'src');
const ENTRY = path.resolve(__dirname, '.alliance-label-clean-entry.ts');
const OUT = path.resolve(__dirname, '.alliance-label-clean-bundle.cjs');
fs.writeFileSync(ENTRY, `
export { isStaleAllianceStatus, alliancePairsToReset } from ${JSON.stringify(SRC + '/game/diplomacy-treaties')};
export { RodzajTraktatu } from ${JSON.stringify(SRC + '/types/diplomacy')};
`);
try {
  esbuild.buildSync({ entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: OUT, logLevel: 'silent' });
} catch (e) { console.error(e.message || e); process.exit(1); }
const B = require(OUT);
fs.unlinkSync(ENTRY); fs.unlinkSync(OUT);

let pass = 0, fail = 0;
function ok(c, m) { if (c) { pass++; } else { fail++; console.error('FAIL: ' + m); } }

const R = B.RodzajTraktatu;
const deal = (id, rodzaj, a, b) => ({ id, rodzaj, strony: [Math.min(a, b), Math.max(a, b)], wygasaTura: null, zawartaTura: 1 });
const SOJ = deal('s12', R.SojuszWojskowy, 1, 2);

// A) aktywna umowa sojuszu → etykieta „sojusz” uzasadniona
ok(B.isStaleAllianceStatus([SOJ], 1, 2, 'sojusz') === false, 'A: sojusz z aktywną umową nie jest nieaktualny');
ok(B.isStaleAllianceStatus([SOJ], 2, 1, 'sojusz') === false, 'A: kolejność argumentów nie ma znaczenia');

// B) po usunięciu umowy → nieaktualny (wraca do pokoju)
ok(B.isStaleAllianceStatus([], 1, 2, 'sojusz') === true, 'B: pusta lista umów + sojusz = nieaktualny');
ok(B.isStaleAllianceStatus([deal('x', R.SojuszWojskowy, 3, 4)], 1, 2, 'sojusz') === true, 'B: umowa innej pary nie podtrzymuje');

// C) sam NAP nie podtrzymuje „sojusz”
ok(B.isStaleAllianceStatus([deal('n', R.PaktNieagresji, 1, 2)], 1, 2, 'sojusz') === true, 'C: NAP bez sojuszu = nieaktualny');

// D) inna para z sojuszem nie podtrzymuje tej pary
ok(B.isStaleAllianceStatus([deal('y', 'sojusz_pelny', 2, 3)], 1, 2, 'sojusz') === true, 'D: sojusz 2-3 nie podtrzymuje 1-2');

// E) pozostałe statusy nigdy nieaktualne
for (const st of ['wojna', 'pokoj', 'neutralni']) {
  ok(B.isStaleAllianceStatus([], 1, 2, st) === false, `E: status ${st} nie jest oznaczany`);
}

// F) rodzaje sojuszu
ok(B.isStaleAllianceStatus([deal('d', 'sojusz_defensywny', 1, 2)], 1, 2, 'sojusz') === false, 'F: sojusz obronny podtrzymuje');
ok(B.isStaleAllianceStatus([deal('p', 'sojusz_pelny', 1, 2)], 1, 2, 'sojusz') === false, 'F: sojusz pełny podtrzymuje');
ok(B.isStaleAllianceStatus([deal('w', R.SojuszWojskowy, 1, 2)], 1, 2, 'sojusz') === false, 'F: sojusz wojskowy (legacy) podtrzymuje');

// H) same-civ exempt: status „sojusz” bez umowy jest utrzymany przez maintainAiMajorSameCivRelation
ok(B.isStaleAllianceStatus([], 1, 2, 'sojusz', true) === false, 'H: exempt same-civ nie jest nieaktualny');
ok(B.isStaleAllianceStatus([], 1, 2, 'sojusz', false) === true, 'H: bez exempt bez umowy = nieaktualny');

// I) alliancePairsToReset
const stA = (map) => (a, b) => map[`${Math.min(a, b)}-${Math.max(a, b)}`] || 'pokoj';
ok(JSON.stringify(B.alliancePairsToReset([], [0, 1, 2], stA({ '1-2': 'sojusz' }))) === '[[1,2]]',
  'I: sojusz bez umowy wybrany do resetu');
ok(JSON.stringify(B.alliancePairsToReset([], [0, 1, 2], stA({ '1-2': 'sojusz' }), (a, b) => a === 1 && b === 2)) === '[]',
  'I: exempt para nie jest resetowana');
ok(JSON.stringify(B.alliancePairsToReset([], [0, 1, 2], stA({ '1-2': 'wojna', '0-1': 'sojusz' }))) === '[[0,1]]',
  'I: wojna nie jest resetowana, sojusz bez umowy tak');
ok(JSON.stringify(B.alliancePairsToReset([SOJ], [0, 1, 2], stA({ '1-2': 'sojusz' }))) === '[]',
  'I: sojusz z aktywną umową zostaje');

// J) wiele par, kolejność owners
const jr = B.alliancePairsToReset([], [3, 0, 2], stA({ '0-2': 'sojusz', '2-3': 'sojusz' }));
ok(jr.length === 2 && jr.some(([a, b]) => a === 0 && b === 2) && jr.some(([a, b]) => a === 3 && b === 2),
  'J: obie pary sojuszu bez umowy wybrane (niezależnie od kolejności owners)');

// G) main.ts — punkty wywołania wspólnego porządkowania
const mainSrc = fs.readFileSync(path.resolve(SRC, 'main.ts'), 'utf8');
const defCount = (mainSrc.match(/function reconcileAllianceStatusAfterDeals\(\): void/g) || []).length;
const callCount = (mainSrc.match(/reconcileAllianceStatusAfterDeals\(\);/g) || []).length;
ok(defCount === 1, 'G: jedna definicja reconcileAllianceStatusAfterDeals');
ok(/alliancePairsToReset\(/.test(mainSrc) && /isAiMajorToSameCivCityStatePair\(a, b, pairOpts\)/.test(mainSrc),
  'G: reconcile wyłącza pary same-civ (exempt)');
ok(callCount >= 5, `G: wołania po usunięciu umowy >= 5 (jest ${callCount})`);
ok(/activeDeals = expireTreaties\(activeDeals, turn\);\s*reconcileAllianceStatusAfterDeals\(\);/.test(mainSrc),
  'G: wygaśnięcie traktatu porządkuje status');
ok(/removeTreatiesById\(activeDeals, brokenTreatyIds\);\s*reconcileAllianceStatusAfterDeals\(\);/.test(mainSrc),
  'G: odmowa obrony sojusznika porządkuje status');
ok(/if \(wasalDeal\) activeDeals = removeTreatiesById\(activeDeals, \[wasalDeal\.id\]\);\s*reconcileAllianceStatusAfterDeals\(\);/.test(mainSrc),
  'G: wasalizacja porządkuje status');
ok(/if \(brokenIds\.length\) activeDeals = removeTreatiesById\(activeDeals, brokenIds\);\s*reconcileAllianceStatusAfterDeals\(\);/.test(mainSrc),
  'G: odmowa wezwania do wojny porządkuje status');

console.log(`alliance-label-clean-test: PASS=${pass} FAIL=${fail}`);
process.exit(fail === 0 ? 0 : 1);
