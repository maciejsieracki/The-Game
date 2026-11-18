'use strict';
/**
 * R-WEB-UI-DIPLO-FACTORS-MILITARY-ROW-CURRENT-ONLY-Q1 — panel „ZA CO CIĘ LUBIĄ" (rozbicie czynników):
 *  - wiersz „Przewaga militarna" / „Słabszy militarnie" tylko JEDEN, odpowiadający AKTUALNEMU stanowi progu
 *    (respektMilStan 'A' → +respektMilOffset w pozytywnych; 'B' → −10 w negatywnych; 'brak'/null → brak),
 *    starsze wpisy tych zdarzeń z historii NIE są pokazywane;
 *  - wpisy „Wygrana bitwa (historia)" (wygrana_bitwa_respekt) NIE są pokazywane (decyzja B, 2026-11-18);
 *  - pozostałe wiersze historii bez zmian;
 *  - mutacja (wyłączenie filtra ukrywania = przywrócenie wyświetlania historii) musi czerwienić test.
 * Run from gra/:  node tools/diplo-factors-military-row-current-only-test.cjs
 * Bez Chromium, bez DOM — czysta funkcja buildRelationBreakdown.
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const SRC = path.resolve(__dirname, '..', 'src');
const ENTRY = path.resolve(__dirname, '.diplo-mil-row-entry.ts');
const BUNDLE = path.resolve(__dirname, '.diplo-mil-row-bundle.cjs');
const MUT_BUNDLE = path.resolve(__dirname, '.diplo-mil-row-mut-bundle.cjs');
const FACTORS_FILE = path.join(SRC, 'game', 'diplomacy-factors.ts');

fs.writeFileSync(ENTRY, `
export { getEffectiveDiplomacyParams } from ${JSON.stringify(path.join(SRC, 'game', 'diplomacy'))};
export { buildRelationBreakdown } from ${JSON.stringify(FACTORS_FILE)};
`);

async function bundleAndLoad(outfile, mutate) {
  const plugins = mutate ? [{
    name: 'mutant-show-history',
    setup(build) {
      build.onLoad({ filter: /diplomacy-factors\.ts$/ }, () => {
        const src = fs.readFileSync(FACTORS_FILE, 'utf8');
        const needle = 'if (HIDDEN_BREAKDOWN_EVENT_KEYS.has(entry.eventKey)) continue;';
        if (!src.includes(needle)) throw new Error('mutacja: brak punktu wstawienia (filtr historii)');
        return { contents: src.replace(needle, ''), loader: 'ts' };
      });
    },
  }] : [];
  await esbuild.build({ entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs',
    target: 'node18', outfile, logLevel: 'silent', plugins });
  return require(outfile);
}

let pass = 0;
let fail = 0;
function ok(cond, msg) {
  if (cond) { pass++; console.log('  OK:', msg); }
  else { fail++; console.error('  FAIL:', msg); }
}
function eq(a, b, msg) { ok(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

function runScenarios(M, label) {
  pass = 0; fail = 0;
  const params = M.getEffectiveDiplomacyParams('normal');
  const build = (log, extra) => M.buildRelationBreakdown(log, Object.assign({}, extra), params);
  const mil = (brk) => [...brk.pozytywne, ...brk.negatywne]
    .filter(r => r.label === 'Przewaga militarna' || r.label === 'Słabszy militarnie');
  const all = (brk) => [...brk.pozytywne, ...brk.negatywne];

  console.log(`[${label}] S1: historia [A@2, A@6, B@8] przy stanie B (−10) -> jeden wiersz „Słabszy militarnie −10”`);
  const h1 = [
    { eventKey: 'przewaga_militarna_respekt', delta: 15, tura: 2 },
    { eventKey: 'przewaga_militarna_respekt', delta: 15, tura: 6 },
    { eventKey: 'slabszy_militarnie_respekt', delta: -10, tura: 8 },
  ];
  const b1 = build(h1, { respektMilStan: 'B', respektMilOffset: -10 });
  eq(b1.negatywne.filter(r => r.label === 'Słabszy militarnie').length, 1, 'S1 liczba wierszy „Słabszy militarnie”');
  eq(b1.negatywne.find(r => r.label === 'Słabszy militarnie')?.value, -10, 'S1 wartość wiersza = −10');
  eq(all(b1).filter(r => r.label === 'Przewaga militarna').length, 0, 'S1 zero wierszy „Przewaga militarna”');
  eq(mil(b1).length, 1, 'S1 łącznie jeden wiersz militarny');

  console.log(`[${label}] S2: historia [A@2, B@4, A@6] przy stanie A (+15) -> jeden wiersz +15`);
  const h2 = [
    { eventKey: 'przewaga_militarna_respekt', delta: 15, tura: 2 },
    { eventKey: 'slabszy_militarnie_respekt', delta: -10, tura: 4 },
    { eventKey: 'przewaga_militarna_respekt', delta: 15, tura: 6 },
  ];
  const b2 = build(h2, { respektMilStan: 'A', respektMilOffset: 15 });
  eq(b2.pozytywne.filter(r => r.label === 'Przewaga militarna').length, 1, 'S2 liczba wierszy „Przewaga militarna”');
  eq(b2.pozytywne.find(r => r.label === 'Przewaga militarna')?.value, 15, 'S2 wartość wiersza = +15');
  eq(all(b2).filter(r => r.label === 'Słabszy militarnie').length, 0, 'S2 zero wierszy „Słabszy militarnie”');
  eq(mil(b2).reduce((s, r) => s + r.value, 0), 15, 'S2 suma wierszy militarnych = respektMilOffset (+15)');

  console.log(`[${label}] S3: brak zdarzeń / stan brak / brak pola -> zero wierszy militarnych`);
  eq(mil(build([], { respektMilStan: 'A', respektMilOffset: 15 })).length, 1, 'S3a stan A bez historii daje jeden wiersz');
  eq(mil(build([], { respektMilStan: 'brak', respektMilOffset: 0 })).length, 0, 'S3b stan brak -> zero');
  eq(mil(build([], {})).length, 0, 'S3c brak pola stanu -> zero');
  eq(mil(build(h1, { respektMilStan: null, respektMilOffset: 0 })).length, 0, 'S3d stan null z historią -> zero wierszy (historia ukryta)');

  console.log(`[${label}] S4: suma wierszy militarnych = respektMilOffset dla obu stanów`);
  const sumA = mil(build(h2, { respektMilStan: 'A', respektMilOffset: 15 })).reduce((s, r) => s + r.value, 0);
  const sumB = mil(build(h1, { respektMilStan: 'B', respektMilOffset: -10 })).reduce((s, r) => s + r.value, 0);
  eq(sumA, 15, 'S4a suma = +15');
  eq(sumB, -10, 'S4b suma = −10');

  console.log(`[${label}] S5: wygrane bitwy (historia) x4 -> zero wierszy; pozostałe wiersze bez zmian`);
  const hWin = [
    { eventKey: 'wygrana_bitwa_respekt', delta: 5, tura: 1 },
    { eventKey: 'wygrana_bitwa_respekt', delta: 5, tura: 2 },
    { eventKey: 'wygrana_bitwa_respekt', delta: 5, tura: 3 },
    { eventKey: 'wygrana_bitwa_respekt', delta: 5, tura: 4 },
  ];
  const bWin = build(hWin, {});
  eq(all(bWin).filter(r => r.label === 'Wygrana bitwa (historia)').length, 0, 'S5a zero wierszy „Wygrana bitwa (historia)”');
  eq(all(bWin).length, 0, 'S5b bez innych czynników -> pusta lista');
  const hMix = [...hWin, { eventKey: 'pokoj', delta: 20, tura: 5 }, { eventKey: 'zlamana_obietnica', delta: -15, tura: 6 }];
  const bMix = build(hMix, {});
  const bMixNoWin = build([hMix[4], hMix[5]], {});
  eq(JSON.stringify(bMix), JSON.stringify(bMixNoWin), 'S5c pozostałe wiersze identyczne jak bez wpisów bitew');
  eq(bMix.pozytywne.find(r => r.label === 'Zawarcie pokoju')?.value, 20, 'S5d „Zawarcie pokoju” +20 zachowane');
  eq(bMix.negatywne.find(r => r.label === 'Złamana umowa (Ty)')?.value, -15, 'S5e „Złamana umowa (Ty)” −15 zachowane');

  console.log(`[${label}] S6: rejestr zdarzeń (log) nie jest modyfikowany przez buildRelationBreakdown`);
  const logCopy = JSON.stringify(hMix);
  build(hMix, { respektMilStan: 'A', respektMilOffset: 15 });
  eq(JSON.stringify(hMix), logCopy, 'S6 wejściowy log bez zmian');

  console.log(`[${label}] wynik: pass=${pass} fail=${fail}`);
  return { pass, fail };
}

async function main() {
let exitCode = 0;

console.log('== wariant produkcyjny (filtr aktywny) ==');
const good = runScenarios(await bundleAndLoad(BUNDLE, false), "PROD");
if (good.fail !== 0) { console.error('FAIL: wariant produkcyjny ma niezaliczone asercje'); exitCode = 1; }

console.log('== mutacja: przywrócenie wyświetlania historii (filtr wyłączony) — ma CZERWIENIĆ ==');
const mut = runScenarios(await bundleAndLoad(MUT_BUNDLE, true), "MUT");
if (mut.fail === 0) { console.error('FAIL: mutacja nie czerwieni testu'); exitCode = 1; }
else console.log(`mutacja czerwieni test jak trzeba (fail=${mut.fail})`);

for (const f of [ENTRY, BUNDLE, MUT_BUNDLE]) { try { fs.unlinkSync(f); } catch (_) { /* ignore */ } }
console.log(`\nRESULT prod pass=${good.pass} fail=${good.fail} | mutant fail=${mut.fail}`);
process.exit(exitCode);
}
main().catch(e => { console.error(e); process.exit(2); });
