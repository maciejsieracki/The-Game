'use strict';
/**
 * civpedia-oslabienie-docs-guard-test.cjs — strażnik dokumentacji kary ×0,75
 * (głód wojska i deficyt złota w walce, R-WEB-DEBT-HOTSEAT-...-AND-DOCS-Q1, temat #397).
 *
 * Pilnuje, żeby:
 *  1. hasło `pojecia/oslabienie-glod-deficyt` istniało w wikiBundle (encyklopedia),
 *  2. jego treść zawierała mnożnik „0,75” (źródło prawdy dla poradnika),
 *  3. hasło o walce (`pojecia/brod`, „Bród (Ford) w bitwie”) linkowało do niego,
 *  4. poradnik gracza §50.3 (08-ekonomia-imperium) opisywał karę ×0,75.
 *
 * Czyta wyłącznie src/data/wikiBundle.json (bez buildu, bez przeglądarki).
 * Run from gra/: node tools/civpedia-oslabienie-docs-guard-test.cjs
 */

const path = require('path');
const fs = require('fs');

const GRA_DIR = path.resolve(__dirname, '..');
const BUNDLE = path.join(GRA_DIR, 'src', 'data', 'wikiBundle.json');
const HASLO_ID = 'pojecia/oslabienie-glod-deficyt';
const WALKA_ID = 'pojecia/brod';
const MNOZNIK = '0,75';
const PORADNIK_ID = '08-ekonomia-imperium';

function entryText(entry) {
  return JSON.stringify(entry);
}

function main() {
  const failures = [];
  const check = (cond, label) => { if (!cond) failures.push(label); };

  const bundle = JSON.parse(fs.readFileSync(BUNDLE, 'utf8'));
  const enc = Array.isArray(bundle.encyklopedia) ? bundle.encyklopedia : [];
  const haslo = enc.find(e => e.id === HASLO_ID);
  const walka = enc.find(e => e.id === WALKA_ID);
  const poradnik = (Array.isArray(bundle.poradnik) ? bundle.poradnik : []).find(p => p.id === PORADNIK_ID);

  check(!!haslo, `hasło ${HASLO_ID} istnieje w wikiBundle`);
  check(!!haslo && entryText(haslo).includes(MNOZNIK), `hasło ${HASLO_ID} zawiera „${MNOZNIK}”`);
  check(!!walka, `hasło o walce ${WALKA_ID} istnieje w wikiBundle`);
  check(!!walka && entryText(walka).includes('oslabienie-glod-deficyt'),
    `hasło o walce ${WALKA_ID} linkuje do ${HASLO_ID}`);
  check(!!poradnik, `rozdział poradnika ${PORADNIK_ID} istnieje w wikiBundle`);
  check(!!poradnik && (poradnik.content || '').includes(MNOZNIK),
    `poradnik ${PORADNIK_ID} (§50.3) opisuje karę „${MNOZNIK}”`);

  if (failures.length > 0) {
    console.error('RED: ' + failures.join(' | '));
    process.exitCode = 1;
  } else {
    console.log('GREEN: civpedia-oslabienie-docs-guard-test: 6 PASS, 0 FAIL');
  }
}

main();
