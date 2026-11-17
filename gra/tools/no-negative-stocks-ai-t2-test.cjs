'use strict';
/**
 * no-negative-stocks-ai-t2-test.cjs — R-WEB-NNS-AI-TURN2-NEGATIVE-TREASURY-Q1.
 *
 * Sprawdza:
 *  - równoważenie AI aktywne od tury 1 (NNS_AI_BALANCE_TURN_MIN = 1); czerwone na bazie (próg 11),
 *  - tura 2 z niedoborem skarbca -1 → AI wstrzymuje zakupy i rozwiązuje jednostkę wsparcia,
 *  - flaga wyłączona (mutacja pomiarowa) nadal wyłącza równoważenie,
 *  - bramka gracza (NNS_WOLNE_TURY = 10) bez zmian,
 *  - wiązanie z main.ts (statyczne): dług AI bez pokrycia jest zamykany w 0 przy bankowaniu
 *    (aiNnsUncoveredOwners), a pomiar (nnsRecordPostBank) liczony jest PRZED zamknięciem.
 * Uruchomienie: node tools/no-negative-stocks-ai-t2-test.cjs (z gra/).
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA_ROOT = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.no-negative-stocks-ai-t2-entry.ts');
const BUNDLE = path.resolve(__dirname, '.no-negative-stocks-ai-t2-bundle.cjs');

fs.writeFileSync(ENTRY, `
export {
  buildAiLevers,
  decideAiOwnerBalance,
  setNnsAiBalanceEnabled,
  NNS_AI_BALANCE_TURN_MIN,
  NNS_WOLNE_TURY,
} from '../src/game/no-negative-stocks';
`, 'utf8');

let M;
try {
  esbuild.buildSync({
    entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs',
    target: 'node18', outfile: BUNDLE, absWorkingDir: GRA_ROOT, logLevel: 'silent',
  });
  M = require(BUNDLE);
} finally {
  try { fs.unlinkSync(ENTRY); } catch (_) {}
  try { fs.unlinkSync(BUNDLE); } catch (_) {}
}

let passed = 0, failed = 0;
function ok(cond, label) {
  if (cond) { passed++; } else { failed++; console.error('FAIL:', label); }
}

const levers = M.buildAiLevers({
  podatekSkarbiec: 0,
  jednostkiWsparcia: [{ id: 'tani', stock: 'skarbiec', zysk: 2, koszt: 3 }],
  jednostkiObronne: [],
});

ok(M.NNS_AI_BALANCE_TURN_MIN === 1, 'prog rownowazenia AI = 1 (AI od tury 1)');
ok(M.NNS_WOLNE_TURY === 10, 'bramka gracza: NNS_WOLNE_TURY bez zmian (10)');

const t2 = M.decideAiOwnerBalance(2, -1, 0, levers);
ok(t2.aktywne === true, 'tura 2, skarbiec -1: rownowazenie aktywne');
ok(t2.wstrzymajZakupy === true, 'tura 2: zakupy AI wstrzymane');
ok(t2.rozwiazJednostki.includes('tani'), 'tura 2: jednostka wsparcia rozwiazywana');

const t1 = M.decideAiOwnerBalance(1, 0, -2, levers);
ok(t1.aktywne === true, 'tura 1, spichlerz -2: rownowazenie aktywne');

const czysto = M.decideAiOwnerBalance(2, 5, 5, levers);
ok(czysto.aktywne === false, 'brak minusa: nieaktywne');

M.setNnsAiBalanceEnabled(false);
const off = M.decideAiOwnerBalance(2, -1, 0, levers);
ok(off.aktywne === false && off.rozwiazJednostki.length === 0, 'mutacja: flaga wylaczona -> brak rownowazenia');
M.setNnsAiBalanceEnabled(true);

const mainSrc = fs.readFileSync(path.resolve(GRA_ROOT, 'src', 'main.ts'), 'utf8');
ok(mainSrc.includes('aiNnsUncoveredOwners.add(oid)'), 'main.ts: oznaczenie ownera bez pokrycia');
ok(mainSrc.includes('if (aiNnsUncoveredOwners.has(oid) && aiSkarb < 0) aiSkarb = 0;'), 'main.ts: zamkniecie dlugu AI w 0 tylko dla ownera bez pokrycia');
const idxRec = mainSrc.indexOf('nnsRecordPostBank(oid, aiSkarb);');
const idxClamp = mainSrc.indexOf('if (aiNnsUncoveredOwners.has(oid) && aiSkarb < 0) aiSkarb = 0;');
ok(idxRec > 0 && idxClamp > idxRec, 'main.ts: pomiar (nnsRecordPostBank) przed zamknieciem w 0');

console.log('no-negative-stocks-ai-t2-test: ' + passed + ' passed, ' + failed + ' failed');
process.exit(failed === 0 ? 0 : 1);
