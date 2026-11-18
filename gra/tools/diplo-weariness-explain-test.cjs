'use strict';
/**
 * diplo-weariness-explain-test.cjs — R-WEB-UI-DIPLO-WEARINESS-PEACE-EXPLAIN-Q1.
 * Podpowiedzi panelu dyplomacji wyjaśniają skalę zmęczenia wojną (0% start … 100% pokój wymuszony),
 * narastanie (2,5%/turę + 10% za miasto), desperację (tylko przegrywający, decyduje o ofercie miast)
 * i liczbę tur do pokoju wymuszonego. Liczby sprawdzane względem war-weariness-params.json (nie na sztywno).
 * Run: node tools/diplo-weariness-explain-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.resolve(GRA, 'src', '.dip-explain-entry.ts');
const BUNDLE = path.resolve(__dirname, '.dip-explain-bundle.cjs');
const PARAMS = JSON.parse(fs.readFileSync(path.resolve(GRA, 'data', 'war-weariness-params.json'), 'utf8'));

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' — ' + JSON.stringify(detail) : '')); }
}

const ENTRY_SRC = [
  "export { warWearinessLabelPl } from './game/diplomacy-display';",
  "export { warWearinessTurnsToLevel } from './game/war-weariness-view';",
  "export { warWearinessForcedRowPl } from './game/diplomacy-display';",
  '',
].join('\n');

function cleanup() {
  for (const p of [ENTRY, BUNDLE]) {
    try { fs.unlinkSync(p); } catch (_) { /* ok */ }
  }
}

async function main() {
  fs.writeFileSync(ENTRY, ENTRY_SRC);
  try {
    await esbuild.build({
      entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
      outfile: BUNDLE, absWorkingDir: GRA, loader: { '.ts': 'ts', '.json': 'json' }, logLevel: 'silent',
    });
    const mod = require(BUNDLE);
    const Z = PARAMS.zmeczenie;
    const L = PARAMS.przegrywajacy;
    const pctTxt = (v) => Math.round(v * 100) + '%';

    // E1: zmęczenie — skala 0% = start, 100% = pokój wymuszony, progi z parametrów.
    const lvl = 0.2;
    const z = mod.warWearinessLabelPl({ zmeczenie: lvl });
    check('E1 etykieta zmęczenia z procentem', z && z.label === 'Zmęczenie wojną 20%', z);
    const t = z.tooltip;
    check('E2 skala: 0% = start wojny, 100% = pokój wymuszony', t.includes('0% = start wojny') && t.includes('100% = pokój wymuszony'), t);
    const perTurnTxt = (100 / Z.pelneTur).toFixed(1).replace('.', ',') + '%';
    check('E3 narastanie z parametrów (100/pelneTur % na turę, wagaStratMiasta za miasto)',
      t.includes(perTurnTxt + ' za każdą turę wojny') && t.includes(pctTxt(Z.wagaStratMiasta) + ' za każde miasto'), { perTurnTxt, t });
    check('E4 progi z parametrów (50/80/100%)',
      t.includes(pctTxt(Z.progChetnosci)) && t.includes(pctTxt(Z.progKoncaZmeczenia)) && t.includes(pctTxt(Z.progWymuszonyPokoj)), t);
    const turnsToForced = mod.warWearinessTurnsToLevel(lvl, Z.progWymuszonyPokoj);
    check('E5 „Pokój wymuszony za N tur” liczone z parametrów',
      t.includes('Pokój wymuszony za ') && turnsToForced === Math.ceil((1 - lvl) * Z.pelneTur - 1e-9), { turnsToForced, t });
    const turnsTo50 = Math.ceil((0.5 - lvl) * Z.pelneTur - 1e-9);
    check('E6 zachowano podpowiedź następnego etapu (tury z parametrów) i pełną listę',
      t.includes('Za ' + turnsTo50 + ' tur') && t.includes('Etapy: 50%'), { turnsTo50, t });

    // E13: wiersz „Pokój wymuszony” — wartość z parametrów; przy 100% „już trwa”.
    const row = mod.warWearinessForcedRowPl(lvl);
    const turnsForced = Math.ceil((1 - lvl) * Z.pelneTur - 1e-9);
    check('E13 wiersz „Pokój wymuszony” z liczbą tur z parametrów (pelneTur)',
      row.label === 'Pokój wymuszony' && row.value.startsWith('za ≈') && row.value.includes(String(turnsForced)), { row, turnsForced });
    check('E13b wiersz przy 100% = „już trwa”', mod.warWearinessForcedRowPl(1).value.includes('już trwa'), mod.warWearinessForcedRowPl(1));

    // E7: przy 100% — pokój wymuszony już trwa.
    const z100 = mod.warWearinessLabelPl({ zmeczenie: 1 });
    check('E7 przy 100% komunikat „już trwa”', z100.tooltip.includes('Pokój wymuszony już trwa'), z100.tooltip);

    // E8: desperacja — dotyczy tylko przegrywającego, decyduje o ofercie miast, nie wymusza pokoju.
    const d = mod.warWearinessLabelPl({ desperacja: 0.3 });
    check('E8 etykieta desperacji z procentem', d && d.label === 'Desperacja 30%', d);
    check('E9 desperacja: skala 0–100%, tylko przegrywający, oferta miast, brak wymuszenia',
      d.tooltip.includes('skala 0–100%') && d.tooltip.includes('Dotyczy tylko strony przegrywającej')
      && d.tooltip.includes('ofertę miast') && d.tooltip.includes('nie wymusza pokoju'), d.tooltip);
    check('E10 próg oferty desperacji i bramki tur z parametrów',
      d.tooltip.includes(pctTxt(L.progiStopni[0])) && d.tooltip.includes(pctTxt(L.udzialWyraznie))
      && d.tooltip.includes('po ' + L.ofertaOdTurWojny + ' turach') && d.tooltip.includes('po ' + L.ofertaBezStratOdTur + ' turach'), d.tooltip);

    // E12: Civpedia — hasło zgodne z progami z parametrów (źródło wikiBundle).
    const civ = fs.readFileSync(path.resolve(GRA, '..', 'docs', 'encyklopedia', 'pojecia', 'zmeczenie-wojna.md'), 'utf8');
    check('E12 Civpedia: skala 0–100% i progi z parametrów',
      civ.includes('0–100%') && civ.includes('0% oznacza start wojny') && civ.includes('100% oznacza pokój wymuszony')
      && civ.includes(pctTxt(Z.progChetnosci)) && civ.includes(pctTxt(Z.progKoncaZmeczenia)) && civ.includes(pctTxt(Z.progWymuszonyPokoj))
      && civ.includes('Desperacja') && civ.includes('Nie wymusza pokoju'), 'zmeczenie-wojna.md');

    // E11: teksty bez surowych ID i bez angielskich słów z listy kontrolnej.
    const all = [t, d.tooltip, z100.tooltip].join(' ');
    check('E11 brak surowych ID (np. „war_”, „_pct”, klucze JSON)', !/\b(war_|_pct|zmeczenie\.|przegrywajacy\.|progWymuszonyPokoj)/.test(all), all);
  } finally {
    cleanup();
  }
  console.log('\ndiplo-weariness-explain-test: ' + pass + ' pass / ' + fail + ' fail');
  if (fail > 0) process.exit(1);
}

main().catch((e) => { cleanup(); console.error(e); process.exit(1); });
