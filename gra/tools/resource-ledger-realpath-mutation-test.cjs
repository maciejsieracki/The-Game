'use strict';
/**
 * resource-ledger-realpath-mutation-test.cjs — R-WEB-UI-RESOURCE-SOURCE-LEDGER-REALPATH-TESTS-Q1.
 *
 * MUTACJE NA REALNYM BUILDZIE: dla kazdej mutacji (pominiecie wpisu do ksiegi, wycinka = 0, usuniecie
 * commitLedgerHistoryTick / restoreLedgerHistoryFromSave, zapis dziennika wszystkich wlascicieli) skrypt
 *   1. podmienia dokladnie jedno wystapienie tekstu w gra/src/**,
 *   2. buduje bundle vite POZA repo (/tmp/civ-ledger-mut),
 *   3. uruchamia tools/resource-ledger-realpath-live-test.cjs (odpowiednia czesc),
 *   4. wymaga kodu wyjscia != 0 (czerwono) — mutacja ZABITA; zielono = mutacja PRZEZYLA (blad testu),
 *   5. przywraca plik (finally + SIGINT/SIGTERM).
 *
 * Uzycie (z gra/): node tools/resource-ledger-realpath-mutation-test.cjs [--ids m01,m02,...] [--list]
 * Kod wyjscia 0 = wszystkie wybrane mutacje zabite.
 */
const { TMPDIR_RUN_ID } = require('./_tmp-unique.cjs');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i >= 0 ? process.argv[i + 1] : d; };
const GRA = path.resolve(__dirname, '..');
const MAIN = path.join(GRA, 'src', 'main.ts');
const DIST = arg('dist', `${require('os').tmpdir()}/civ-ledger-mut-${TMPDIR_RUN_ID}`);
const IDS = arg('ids', '').split(',').filter(Boolean);
const LIVE = path.join(__dirname, 'resource-ledger-realpath-live-test.cjs');

// `void (` zamienia wywolanie zapisu na wyrazenie bez efektu (ten sam kod, brak wpisu do ksiegi).
const skip = (call) => ({ find: call, replace: 'void (' + call.slice(call.indexOf('(') + 1), file: MAIN });
const MUTATIONS = [
  { id: 'm01', name: 'pominiecie lupu z bitwy', ...skip('recordOwnersStockDeltaToPending(ledgerLootBefore,'), part: 'sources', only: 'lup' },
  { id: 'm02', name: 'pominiecie zwrotu z rekrutacji', ...skip('recordOwnersStockDeltaToPending(ledgerRecruitRefundBefore,'), part: 'sources', only: 'zwrot-rekrutacja' },
  { id: 'm03', name: 'pominiecie zwrotu z rozwiazania (gracz)', ...skip('recordOwnersStockDeltaToPending(ledgerDisbandBefore,'), part: 'sources', only: 'zwrot-rozwiazanie' },
  { id: 'm04', name: 'pominiecie zwrotu z rozwiazania (AI)', ...skip('recordOwnersStockDeltaToPending(ledgerAiDisbandBefore,'), part: 'sources', only: 'zwrot-rozwiazanie' },
  { id: 'm05', name: 'pominiecie zdobycia/oddania miasta (kapitulacja)', ...skip('recordOwnersStockDeltaToPending(ledgerCaptureBefore,'), part: 'sources', only: 'zdobycie' },
  { id: 'm06', name: 'pominiecie cesji miasta', ...skip('recordOwnersStockDeltaToPending(ledgerCessionBefore,'), part: 'sources', only: 'cesja' },
  { id: 'm07', name: 'pominiecie przylaczenia miasta-panstwa', ...skip('recordOwnersStockDeltaToPending(ledgerAnnexBefore,'), part: 'sources', only: 'przylaczenie' },
  { id: 'm08', name: 'pominiecie buntu miasta', ...skip('recordOwnersStockDeltaToPending(ledgerRebelBefore,'), part: 'sources', only: 'bunt' },
  { id: 'm09', name: 'pominiecie daru/umowy (strona nadawcy)', ...skip('recordStockDeltaToPending(fromOwnerId, ledgerFromBeforeB,'), part: 'sources', only: 'dar' },
  // m09b: strona ODBIORCY daru (zarzut Evaluatora r1 (3)); m09 tnie tylko strone nadawcy.
  { id: 'm09b', name: 'pominiecie daru/umowy (strona odbiorcy)', ...skip('recordStockDeltaToPending(toOwnerId, ledgerToBeforeB,'), part: 'sources', only: 'dar' },
  // m17: bunt w petli tury (main.ts, markCityRebellionStarted) zamiast funkcji ksiegi -- gola zmiana wlasciciela.
  // Oczekiwanie: PRZEZYLA (test nie wywoluje petli tury); luka opisana w raporcie obrony.
  { id: 'm17', name: 'bunt w petli tury: gola zmiana wlasciciela bez ksiegi', file: MAIN, find: 'transferCityToRebelFactionWithLedger(city);', replace: 'city.ownerId = REBEL_FACTION_OWNER_ID;', part: 'sources', only: 'bunt' },
  { id: 'm10', name: 'Zastap bez sinku ksiegi', file: MAIN, find: ", pendingLedgerSink(ownerId, 'rekrutacja', 'Zastąp jednostkę')", replace: '', part: 'sources', only: 'zastap' },
  { id: 'm11', name: 'machina oblezmicza bez sinku ksiegi', file: MAIN, find: ", pendingLedgerSink(besiegerOwnerId, 'budowa', 'Machina oblężnicza')", replace: '', part: 'sources', only: 'machina' },
  { id: 'm12', name: 'Stadnina bez sinku ksiegi', file: MAIN, find: ", pendingLedgerSink(0, 'wejscie', 'Stadnina (koń)')", replace: '', part: 'sources', only: 'stadnina' },
  { id: 'm13', name: 'wycinka lasu gracza: kwota wpisu 0', file: MAIN, find: "{ kind: 'wycinka', label: 'Wycinka lasu' }, wycinkaGot);", replace: "{ kind: 'wycinka', label: 'Wycinka lasu' }, 0);", part: 'wycinka' },
  { id: 'm14', name: 'usuniecie commitLedgerHistoryTick', file: MAIN, find: 'commitLedgerHistoryTick(econ.resourceLedgerByOwner, readLedgerHistoryTurns(data.econParams, _menuDifficulty));', replace: 'void 0;', part: 'save' },
  { id: 'm15', name: 'usuniecie restoreLedgerHistoryFromSave przy wczytaniu', file: MAIN, find: 'restoreLedgerHistoryFromSave(saved.resourceLedgerHistory, readLedgerHistoryTurns(data.econParams, _menuDifficulty));', replace: 'void 0;', part: 'save' },
  { id: 'm16', name: 'zapis dziennika wszystkich wlascicieli (bez ograniczenia rozmiaru)', file: MAIN, find: 'resourceLedgerHistory: ledgerHistoryToSave(ownerId => isHuman(ownerId)),', replace: 'resourceLedgerHistory: ledgerHistoryToSave(),', part: 'size', extra: ['--turns', '12'] },
];

if (process.argv.includes('--list')) { for (const m of MUTATIONS) console.log(m.id + ' ' + m.name); process.exit(0); }

const original = fs.readFileSync(MAIN, 'utf8');
const restore = () => { try { fs.writeFileSync(MAIN, original, 'utf8'); } catch (e) { /* ignore */ } };
process.on('SIGINT', () => { restore(); process.exit(130); });
process.on('SIGTERM', () => { restore(); process.exit(143); });

let killed = 0; let survived = 0; const summary = [];
try {
  for (const m of MUTATIONS) {
    if (IDS.length && !IDS.includes(m.id)) continue;
    const count = original.split(m.find).length - 1;
    if (count !== 1) { console.log(`[${m.id}] BLAD: wzorzec wystepuje ${count}x (wymagane 1) — ${m.name}`); survived++; summary.push({ id: m.id, name: m.name, result: 'PATTERN-' + count }); continue; }
    fs.writeFileSync(MAIN, original.replace(m.find, m.replace), 'utf8');
    const b = spawnSync('node', ['./node_modules/vite/bin/vite.js', 'build', '--outDir', DIST, '--emptyOutDir'], { cwd: GRA, encoding: 'utf8', timeout: 400000 });
    restore();
    if (b.status !== 0) { console.log(`[${m.id}] BLAD BUILDU mutacji: ${(b.stderr || b.stdout || '').slice(-300)}`); survived++; summary.push({ id: m.id, name: m.name, result: 'BUILD-FAIL' }); continue; }
    const args = [LIVE, '--dist', DIST, '--part', m.part].concat(m.only ? ['--only', m.only] : []).concat(m.extra || []);
    const t = spawnSync('node', args, { cwd: GRA, encoding: 'utf8', timeout: 300000 });
    const out = (t.stdout || '') + (t.stderr || '');
    const failLines = out.split('\n').filter((l) => /FAIL|FATAL/.test(l)).slice(0, 3).map((l) => l.trim().slice(0, 140));
    const red = t.status !== 0;
    if (red) { killed++; summary.push({ id: m.id, name: m.name, result: 'ZABITA', exit: t.status, firstFails: failLines }); console.log(`[${m.id}] ZABITA (exit ${t.status}) — ${m.name} :: ${failLines[0] || ''}`); }
    else { survived++; summary.push({ id: m.id, name: m.name, result: 'PRZEZYLA' }); console.log(`[${m.id}] PRZEZYLA (test zielony mimo mutacji!) — ${m.name}`); }
  }
} finally { restore(); }
console.log(`\nMUTACJE: zabite=${killed} przezyly/bledy=${survived}`);
console.log(JSON.stringify(summary));
process.exit(survived === 0 ? 0 : 1);
