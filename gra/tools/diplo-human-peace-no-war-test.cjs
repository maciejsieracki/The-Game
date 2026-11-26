'use strict';
/**
 * diplo-human-peace-no-war-test.cjs — R-WEB-DIPLO-HUMAN-PEACE-AND-WAR-TRIBUTE-FIX-Q1 (P21c).
 * Pokój między dwoma fotelami ludzkimi wymaga trwającej wojny (status 'wojna').
 *
 * Test BEHAWIORALNY: wyciąga PRODUKCYJNE ciała funkcji humanPeaceRejectReason i proposeToHuman
 * z gra/src/main.ts i wykonuje je z atrapami zależności (relacja dyplomatyczna, skrzynka, podpowiedź).
 * Mutacja w kodzie źródłowym (np. zamiana warunku typu, usunięcie strażnika) zmienia wynik wykonania.
 * Dwa sprawdzenia pozostają źródłowe (kolejność w respondToHumanProposal i zwracany wynik kontrpropozycji).
 *
 * Użycie (z katalogu gra/): node tools/diplo-human-peace-no-war-test.cjs
 */
const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'main.ts'), 'utf8');

let pass = 0;
let fail = 0;
function check(label, ok) {
  if (ok) pass++; else fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}: ${label}`);
}

/** Zwraca [start, end) ciała funkcji `name` (między nawiasami klamrowymi) oraz tekst listy parametrów. */
function extractFunction(name) {
  const start = src.indexOf(`function ${name}(`);
  if (start < 0) throw new Error('brak funkcji ' + name + ' w main.ts');
  const paramOpen = src.indexOf('(', start);
  const paramClose = src.indexOf(')', paramOpen);
  const open = src.indexOf('{', paramClose);
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') {
      depth--;
      if (depth === 0) {
        const params = src.slice(paramOpen + 1, paramClose)
          .split(',').map(s => s.split(':')[0].trim()).filter(Boolean);
        return { params, body: src.slice(open + 1, i) };
      }
    }
  }
  throw new Error('niedomknięte ciało ' + name);
}

/** Buduje wykonywalną funkcję z produkcyjnego ciała; `deps` to atrapy wstrzykiwane po nazwie. */
function buildFn(name, deps) {
  const { params, body } = extractFunction(name);
  const depNames = Object.keys(deps);
  const fn = new Function(...depNames, ...params, body);
  return (...args) => fn(...depNames.map(k => deps[k]), ...args);
}

// Atrapy stanu gry
let statusRelacji = 'wojna';
const hints = [];
const inbox = [];
const turn = 7;
const DIPLOMACY_MSG_PREFIX = 'Dyplomacja:';
const getDiploRelation = () => ({ status: statusRelacji });
const showHintMessage = (msg) => hints.push(msg);

const humanPeaceRejectReason = buildFn('humanPeaceRejectReason', { getDiploRelation });
const proposeToHuman = buildFn('proposeToHuman', {
  humanPeaceRejectReason, showHintMessage, DIPLOMACY_MSG_PREFIX, turn,
  interHumanDiplomacyInbox: inbox,
});

const POKOJ = { type: 'zaproponuj_pokoj' };
const INNA = { type: 'zaproponuj_sojusz' };
const KOMUNIKAT = 'Pokój — brak trwającej wojny';

// 1. Strażnik: pokój w wojnie dopuszczony, pokój poza wojną odrzucony z powodem zgodnym z AI
statusRelacji = 'wojna';
check('pokój w trwającej wojnie: strażnik zwraca null (dopuszczony)',
  humanPeaceRejectReason(0, 1, POKOJ) === null);
statusRelacji = 'pokoj';
check('pokój bez wojny (status pokoj): strażnik zwraca dokładny powód',
  humanPeaceRejectReason(0, 1, POKOJ) === KOMUNIKAT);
statusRelacji = 'sojusz';
check('pokój przy sojuszu: strażnik zwraca dokładny powód',
  humanPeaceRejectReason(0, 1, POKOJ) === KOMUNIKAT);
statusRelacji = 'neutralnosc';
check('inne propozycje (nie pokój) poza wojną: strażnik nie blokuje (null)',
  humanPeaceRejectReason(0, 1, INNA) === null);

// 2. proposeToHuman: odrzucenie pokoju bez wojny nie dopisuje do skrzynki i pokazuje podpowiedź
statusRelacji = 'pokoj';
hints.length = 0; inbox.length = 0;
const idBezWojny = proposeToHuman(0, 1, POKOJ, 'test');
check('proposeToHuman pokój bez wojny: zwraca pusty identyfikator',
  idBezWojny === '');
check('proposeToHuman pokój bez wojny: skrzynka bez zmian',
  inbox.length === 0);
check('proposeToHuman pokój bez wojny: podpowiedź z komunikatem zgodnym z AI',
  hints.length === 1 && hints[0] === DIPLOMACY_MSG_PREFIX + ' ' + KOMUNIKAT);

// 3. proposeToHuman: pokój w wojnie i inne propozycje bez zmian
statusRelacji = 'wojna';
hints.length = 0; inbox.length = 0;
const idWojna = proposeToHuman(0, 1, POKOJ, 'test');
check('proposeToHuman pokój w wojnie: zwraca identyfikator i dopisuje do skrzynki',
  typeof idWojna === 'string' && idWojna.startsWith('inter-human-diplo-0-1-zaproponuj_pokoj-') && inbox.length === 1);
check('proposeToHuman pokój w wojnie: brak podpowiedzi odrzucenia',
  hints.length === 0);

statusRelacji = 'pokoj';
hints.length = 0; inbox.length = 0;
const idInna = proposeToHuman(0, 1, INNA, 'test');
check('proposeToHuman inna propozycja poza wojną: dopisana do skrzynki (bez zmian)',
  typeof idInna === 'string' && idInna !== '' && inbox.length === 1 && hints.length === 0);

// 4. Ścieżki wejścia w respondToHumanProposal (akceptacja) — kolejność w kodzie źródłowym
const respondBody = extractFunction('respondToHumanProposal').body;
check('respondToHumanProposal (accept pokoju) sprawdza strażnika przed finalizePeaceTreatyBetween',
  respondBody.indexOf('humanPeaceRejectReason(p.fromOwnerId') >= 0 &&
  respondBody.indexOf('humanPeaceRejectReason(p.fromOwnerId') <
    respondBody.indexOf('finalizePeaceTreatyBetween(p.fromOwnerId'));
check('respondToHumanProposal (counter): wynik proposeToHuman steruje zwracaną wartością',
  /const wyslano = proposeToHuman\([^;]*\);\s*return wyslano !== '';/.test(respondBody));
check('brak nowej stałej bramki czasu (10 tur nietknięte)',
  !/PEACE_HUMAN_MIN_TURNS/.test(src));

console.log(`\nWYNIK: PASS=${pass} FAIL=${fail}`);
process.exit(fail ? 1 : 0);
