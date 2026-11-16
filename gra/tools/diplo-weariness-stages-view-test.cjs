'use strict';
/**
 * diplo-weariness-stages-view-test.cjs — R-WEB-DIPLO-WAR-WEARINESS-40-TURNS-FORCED-PEACE-AT-100-Q1 (runda 3, pkt 5 FC).
 * Widok zmęczenia wojną w panelu dyplomacji: etapy 50/80/100% i „za ile tur” liczone Z PARAMETRÓW
 * (war-weariness-params.json: pelneTur=40, 2,5%/turę), nie z zahardkodowanych liczb.
 * Sprawdza czyste funkcje z src/game/war-weariness-view.ts oraz podpowiedź w diplomacy-display.ts.
 * Run: node tools/diplo-weariness-stages-view-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.resolve(GRA, 'src', '.dip-stages-view-entry.ts');
const BUNDLE = path.resolve(__dirname, '.dip-stages-view-bundle.cjs');

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' — ' + JSON.stringify(detail) : '')); }
}

const ENTRY_SRC = [
  "export { warWearinessStagesPl, warWearinessTurnsToLevel, warWearinessNextStagePl, warWearinessStagesSummaryPl, forcedPeaceModalTextPl } from './game/war-weariness-view';",
  "export { warWearinessLabelPl } from './game/diplomacy-display';",
  "export { WAR_WEARINESS_PARAMS } from './game/war-weariness';",
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
    const { warWearinessStagesPl: stages, warWearinessTurnsToLevel: turns, warWearinessNextStagePl: next,
      warWearinessLabelPl: label, WAR_WEARINESS_PARAMS: P, warWearinessStagesSummaryPl: summary,
      forcedPeaceModalTextPl: modalText } = mod;

    // (1) Etapy z parametrów: 50 / 80 / 100 % (wartości zgodne z JSON, nie z kodu).
    const st = stages(P);
    check('st1 etapy: progi 50/80/100 % z parametrów',
      st.length === 3 && st[0].procent === 50 && st[1].procent === 80 && st[2].procent === 100, st);
    check('st2 etap 100% opisany jako pokój wymuszony', st[2].opis === 'pokój wymuszony', st[2]);
    check('st3 etap 80% opisany jako propozycja pokoju z miastami', st[1].opis === 'AI proponuje pokój z miastami', st[1]);

    // (2) Liczba tur do progu = ceil((cel − poziom) × pelneTur). Skala 40 tur ⇒ 2,5 % na turę.
    check('tr1 od zera do 100%: 40 tur (pelneTur=40)', turns(0, 1, P) === 40, turns(0, 1, P));
    check('tr2 od 50% do 80%: 12 tur (0,30 × 40)', turns(0.5, 0.8, P) === 12, turns(0.5, 0.8, P));
    check('tr3 próg już osiągnięty: 0 tur', turns(0.8, 0.8, P) === 0 && turns(0.9, 0.8, P) === 0, [turns(0.8, 0.8, P), turns(0.9, 0.8, P)]);
    check('tr4 ułamek zaokrąglany w górę: 0,99 → 100% = 1 tura', turns(0.99, 1, P) === 1, turns(0.99, 1, P));

    // (3) Podpowiedź „za ile tur” dla następnego etapu.
    const n20 = next(0.2, P);
    check('nx1 poziom 20% → „Za 12 tur: 50%” (chęć pokoju)', n20.startsWith('Za 12 tur: 50%') && n20.includes('chęć pokoju'), n20);
    const n85 = next(0.85, P);
    check('nx2 poziom 85% → następny etap 100% za 6 tur (pokój wymuszony)', n85.startsWith('Za 6 tur: 100%') && n85.includes('pokój wymuszony'), n85);
    check('nx3 poziom 100% → komunikat pokoju wymuszonego', next(1, P) === 'Pokój wymuszony (100%).', next(1, P));
    check('nx4 podpowiedź zawiera przy 100% pokój wymuszony', n20.includes('Przy 100% pokój wymuszony'), n20);

    // (4) Panel dyplomacji: etykieta „Zmęczenie wojną” ma w podpowiedzi etap i liczbę tur (z tej samej logiki).
    const lab = label({ zmeczenie: 0.2 });
    check('lb1 etykieta zmęczenia zawiera „za ile tur” z widoku', lab && lab.label === 'Zmęczenie wojną 20%' && lab.tooltip.includes('Za 12 tur: 50%'), lab);
    const lab100 = label({ zmeczenie: 1 });
    check('lb2 przy 100% podpowiedź mówi o pokoju wymuszonym', lab100 && lab100.tooltip.includes('Pokój wymuszony (100%).'), lab100);

    // (5) Odmiana „tur” po liczebniku (biernik po „Za”): 1 turę / 2 tury / 5 tur / 12 tur.
    const g1 = next(0.975, P);
    check('gr1 1 tura → „Za 1 turę” (nie „Za 1 tur”)', g1.startsWith('Za 1 turę: 100%'), g1);
    const g2 = next(0.95, P);
    check('gr2 2 tury → „Za 2 tury”', g2.startsWith('Za 2 tury: 100%'), g2);
    const g5 = next(0.875, P);
    check('gr3 5 tur → „Za 5 tur”', g5.startsWith('Za 5 tur: 100%'), g5);
    check('gr4 12 tur → „Za 12 tur” (wyjątek 12–14)', n20.startsWith('Za 12 tur: 50%'), n20);

    // (6) Pełna lista etapów do panelu (tooltip zmęczenia).
    check('sm1 lista etapów: 50/80/100 % z parametrów',
      summary(P) === 'Etapy: 50% — chęć pokoju; 80% — AI proponuje pokój z miastami; 100% — pokój wymuszony.', summary(P));
    check('lb3 tooltip zmęczenia zawiera pełną listę etapów', lab.tooltip.includes(summary(P)), lab.tooltip);

    // (7) Tekst okna „pokój wymuszony” (czysta funkcja; okno DOM tylko wyświetla).
    const mLoser = modalText({ otherName: 'Egipt', humanIsLoser: true, cityNames: ['Memfis', 'Teby'] });
    check('mt1 gracz przegrywa: lead + „Oddajesz: Memfis, Teby.”',
      mLoser.title === 'Pokój wymuszony'
      && mLoser.lead === 'Wojna z Egipt osiągnęła 100% zmęczenia — pokój wymuszony.'
      && mLoser.terms === 'Oddajesz: Memfis, Teby.', mLoser);
    const mWinner = modalText({ otherName: 'Egipt', humanIsLoser: false, cityNames: ['Memfis'] });
    check('mt2 gracz wygrywa: „Otrzymujesz: Memfis.”', mWinner.terms === 'Otrzymujesz: Memfis.', mWinner);
    const mNone = modalText({ otherName: 'Egipt', humanIsLoser: true, cityNames: [] });
    check('mt3 bez miast: „Pokój bez wymiany miast.”', mNone.terms === 'Pokój bez wymiany miast.', mNone);

    console.log('');
    console.log('diplo-weariness-stages-view-test: ' + pass + ' pass / ' + fail + ' fail');
  } finally {
    cleanup();
  }
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => { cleanup(); console.error(e); process.exit(1); });
