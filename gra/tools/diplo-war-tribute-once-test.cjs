'use strict';
/**
 * diplo-war-tribute-once-test.cjs — R-WEB-DIPLO-HUMAN-PEACE-AND-WAR-TRIBUTE-FIX-Q1 (P17b).
 * W wojnie „zaproponuj trybut” z modala idzie jako jednorazowy (goldOnce), poza wojną bez zmian.
 *
 * Test BEHAWIORALNY: wyciąga PRODUKCYJNE ciało gałęzi case '8' z readPayload
 * (gra/src/ui/diplomacyNegotiationModal.ts) i wykonuje je z atrapą DOM i kontekstu wojny.
 *
 * Użycie (z katalogu gra/): node tools/diplo-war-tribute-once-test.cjs
 */
const fs = require('fs');
const path = require('path');

const modal = fs.readFileSync(path.join(__dirname, '..', 'src', 'ui', 'diplomacyNegotiationModal.ts'), 'utf8');

let pass = 0;
let fail = 0;
function check(label, ok) {
  if (ok) pass++; else fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}: ${label}`);
}

/** Ciało bloku `case '8': { ... }` z readPayload (bez klamer zewnętrznych), z usuniętymi adnotacjami TS. */
function extractCase8Body() {
  const fnStart = modal.indexOf('function readPayload(');
  const caseStart = modal.indexOf("case '8': {", fnStart);
  if (fnStart < 0 || caseStart < 0) return null;
  const open = modal.indexOf('{', caseStart + "case '8': ".length);
  let depth = 0;
  for (let i = open; i < modal.length; i++) {
    if (modal[i] === '{') depth++;
    else if (modal[i] === '}') {
      depth--;
      if (depth === 0) {
        return modal.slice(open + 1, i)
          .replace(/ as HTMLSelectElement/g, '')
          .replace(/ as HTMLInputElement/g, '');
      }
    }
  }
  return null;
}

const body = extractCase8Body();
check('gałąź case 8 w readPayload istnieje i domyka się', body !== null);

/** Uruchamia produkcyjną gałąź z podaną wartością trybu, ilością i kontekstem wojny. */
function runCase8({ mode, gpt, atWar }) {
  const values = {
    'cdn-trib-mode': mode,
    'cdn-gpt': String(gpt),
    'cdn-turns-trib': '0',
  };
  const document = {
    getElementById: (id) => ({ value: values[id] }),
  };
  const base = { actionId: '8' };
  const ctx = { atWar };
  const withSweetener = (payload) => payload;
  const fn = new Function('document', 'base', 'ctx', 'withSweetener', body);
  return fn(document, base, ctx, withSweetener);
}

if (body !== null) {
  const wojnaOferta = runCase8({ mode: 'offer', gpt: 15, atWar: true });
  check('w wojnie „zaproponuj trybut”: goldOnce = kwota (jednorazowy jak w koszyku)',
    wojnaOferta.goldOnce === 15);
  check('w wojnie „zaproponuj trybut”: goldPerTurn nadal = kwota, tributeMode offer',
    wojnaOferta.goldPerTurn === 15 && wojnaOferta.tributeMode === 'offer');

  const pokojOferta = runCase8({ mode: 'offer', gpt: 15, atWar: false });
  check('poza wojną „zaproponuj trybut”: brak goldOnce (cykliczny bez zmian)',
    !('goldOnce' in pokojOferta));
  check('poza wojną „zaproponuj trybut”: goldPerTurn i tributeMode offer bez zmian',
    pokojOferta.goldPerTurn === 15 && pokojOferta.tributeMode === 'offer');

  const wojnaZadanie = runCase8({ mode: 'demand', gpt: 15, atWar: true });
  check('w wojnie „żądaj trybutu”: brak goldOnce (cykliczne żądanie bez zmian)',
    !('goldOnce' in wojnaZadanie));
  check('w wojnie „żądaj trybutu”: tributeMode demand',
    wojnaZadanie.tributeMode === 'demand' && wojnaZadanie.goldPerTurn === 15);

  const pokojZadanie = runCase8({ mode: 'demand', gpt: 10, atWar: false });
  check('poza wojną „żądaj trybutu”: bez zmian (brak goldOnce, tributeMode demand)',
    !('goldOnce' in pokojZadanie) && pokojZadanie.tributeMode === 'demand');
}

console.log(`\nWYNIK: PASS=${pass} FAIL=${fail}`);
process.exit(fail ? 1 : 0);
