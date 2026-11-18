'use strict';
/**
 * diplo-forced-peace-d2-guard-test.cjs -- R-WEB-DIPLO-FORCED-PEACE-D2-HOOKS-Q1 (strażnik z mutacją).
 *
 * Strażnik źródłowy dla kluczowych wywołań ścieżek D2 / S / A (bez zmiany logiki gry):
 *   G1 acceptPendingForcedPeace wywołuje showNextPendingForcedPeace() (drugie okno po akceptacji pierwszego, D2);
 *   G2 start tury gracza wraca na okno oczekującego pokoju (showNextPendingForcedPeace w endTurn-owym bloku, S);
 *   G3 odroczenie: pokój wymuszony trafia do kolejki gracza TYLKO gdy wygrany/przegrany to gracz (A);
 *   G4 deferForcedPeace = tylko pary z graczem (A);
 *   G5 hooki civTest saveForTest / loadForTest istnieją w bloku ?civTest=1 (S, live).
 * Mutacja: dla G1 usunięcie wywołania z acceptPendingForcedPeace MUSI dać wynik CZERWONY (strażnik wykrywa).
 *
 * Usage: node tools/diplo-forced-peace-d2-guard-test.cjs   (z gra/; bez przeglądarki)
 * Wynik: kod 0 = wszystkie strażniki zielone i mutant czerwony.
 */
const fs = require('fs');
const path = require('path');

const SRC = path.resolve(__dirname, '..', 'src', 'main.ts');
const src = fs.readFileSync(SRC, 'utf8');

/** Ciało funkcji acceptPendingForcedPeace (od deklaracji do następnego komentarza DIPLO-PEACE-AUTO). */
function acceptBody(text) {
  const start = text.indexOf('function acceptPendingForcedPeace(): void {');
  if (start < 0) return null;
  const end = text.indexOf('DIPLO-PEACE-AUTO-NO-CITIES-STALE-OFFER-DIAG-Q1 (Z7)', start);
  return end < 0 ? null : text.slice(start, end);
}
const CALL = 'showNextPendingForcedPeace();';
/** Kluczowe wywołanie D2: kolejne okno po akceptacji (ostatnie wywołanie w ciele, po logPeaceVazne). */
const g1 = (text) => {
  const b = acceptBody(text);
  if (!b) return false;
  const at = b.indexOf('logPeaceVazne(p.loser');
  return at >= 0 && b.indexOf(CALL, at) >= 0;
};

// Mutant: ta sama funkcja, bez kluczowego (ostatniego) wywołania kolejnego okna.
function mutateAccept(text) {
  const b = acceptBody(text);
  if (!b) return text;
  const k = b.lastIndexOf(CALL);
  if (k < 0) return text;
  const mutated = b.slice(0, k) + b.slice(k + CALL.length);
  return text.replace(b, mutated);
}

const checks = [];
const ok = (name, cond, detail) => { checks.push({ name, ok: !!cond }); console.log(`${cond ? 'PASS' : 'FAIL'} ${name}${detail ? ' -- ' + detail : ''}`); };

ok('G1 acceptPendingForcedPeace -> showNextPendingForcedPeace()', g1(src));
const mut = mutateAccept(src);
ok('G1-mutant: bez wywołania w acceptPendingForcedPeace strażnik CZERWIENI (mutacja wykryta)', mut !== src && !g1(mut), mut === src ? 'mutacja nie zmieniła źródła' : '');

ok('G2 start tury gracza: if (pending.length > 0) showNextPendingForcedPeace()',
  /if \(pendingForcedPeaceTreaties\.length > 0\) showNextPendingForcedPeace\(\);\s*\n\s*chronicleTickEmpireSizes/.test(src));

ok('G3 pokój do kolejki gracza tylko gdy gracz jest stroną',
  /if \(o\.winner !== humanOwner && o\.loser !== humanOwner\) continue;/.test(src));

ok('G4 deferForcedPeace tylko dla pary z graczem',
  /deferForcedPeace: \(loser, winner\) => loser === humanOwner \|\| winner === humanOwner/.test(src));

ok('G5a hak saveForTest w bloku civTest',
  /__truceTestDebug\.saveForTest = async \(slot: string\)[^\n]*persistSaveToSlot\(slot,/.test(src));
ok('G5b hak loadForTest w bloku civTest',
  /__truceTestDebug\.loadForTest = async \(slot: string\)[^\n]*loadGameFromSlot\(slot, false\)/.test(src));

ok('G5c hak setPairWarAgeForTest (setup pary AI<->AI) w bloku civTest, tylko diplomacyPairMeta',
  (() => { const i = src.indexOf('__truceTestDebug.setPairWarAgeForTest ='); if (i < 0) return false; const body = src.slice(i, src.indexOf('};', i)); return /diplomacyPairMeta\.set\(key, \{ \.\.\.meta, wojnaStartTura: turn - turnsAtWar \}/.test(body) && !/setDiploRelation|pendingForcedPeaceTreaties/.test(body); })());
ok('G5d hak wearDiagForTest tylko odczyt (bez set/push/delete w ciele)',
  (() => { const i = src.indexOf('__truceTestDebug.wearDiagForTest ='); if (i < 0) return false; const body = src.slice(i, src.indexOf('__truceTestDebug.playerProposeTruceForTest', i)); return !/\.(set|push|delete|splice)\(/.test(body); })());

const failed = checks.filter(c => !c.ok);
console.log(failed.length === 0 ? `GUARD OK (${checks.length}/${checks.length})` : `GUARD FAIL (${failed.length} z ${checks.length})`);
process.exit(failed.length === 0 ? 0 : 1);
