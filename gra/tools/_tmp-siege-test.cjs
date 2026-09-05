'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ENTRY = path.join(__dirname, '.siege-defenders-entry.ts');
// --- P-BRAMKA-WSPOLDZIELONY-DIST-TMPDIR-Q1: katalogi/pliki tymczasowe unikalne per przebieg ---
// Stala nazwa pod os.tmpdir() jest wspoldzielona przez KAZDY rownolegly przebieg (takze
// uruchomiony z innego worktree). Skutek dziala w obie strony: raz falszywy CZERWONY
// (jeden bieg czysci drugiemu katalog w locie), raz falszywy ZIELONY (dwa biegi mierza
// ten sam artefakt, wiec "parytet" jest artefaktem kolizji, nie dowodem). Sufiks
// per-proces to rozlacza; asercje i progi bramki pozostaja nietkniete.
const TMPDIR_RUN_ID = `${process.pid}-${Math.random().toString(36).slice(2, 8)}`;
// Unikalnosc BEZ sprzatania zamienilaby kolizje w staly wyciek dysku (brak miejsca to
// ta sama klasa problemu z drugiej strony), wiec kasujemy WLASNE artefakty tego biegu.
// Dopasowanie po TMPDIR_RUN_ID nie moze trafic w cudzy katalog. Zrzuty/podglady
// zostaja na dysku celowo — sa DOWODEM wizualnym (R-PROC-AUTOBOT.md §9 pkt 6).
process.on('exit', () => {
  // `require` lokalnie: hak musi dzialac takze w plikach, ktore nie maja `fs`/`path`
  // w zasiegu modulu — inaczej ReferenceError wpada w catch i sprzatanie milczy.
  const nfs = require('fs'); const npath = require('path'); const nos = require('os');
  try {
    for (const ent of nfs.readdirSync(nos.tmpdir())) {
      if (!ent.includes(TMPDIR_RUN_ID)) continue;
      if (/shots|preview|zrzut/i.test(ent)) continue;
      try { nfs.rmSync(npath.join(nos.tmpdir(), ent), { recursive: true, force: true }); } catch { /* best-effort */ }
    }
  } catch { /* best-effort */ }
});
const OUT = path.join(os.tmpdir(), `siege-defenders-bundle-test-${TMPDIR_RUN_ID}.cjs`);

fs.writeFileSync(ENTRY, `
export {
  hasCityDefenders, canCaptureCityWithoutBattle, defenderUnitsNearCity,
  survivorsLiveSet,
} from '../src/game/siegeDefenders';
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: OUT,
  absWorkingDir: path.resolve(__dirname, '..'),
  logLevel: 'silent',
});

const M = require(OUT);
let ok = 0, fail = 0;
function assert(c, msg) {
  if (c) { console.log('  [OK]', msg); ok++; }
  else { console.error('  [FAIL]', msg); fail++; }
}

const city = { id: 'at', ownerId: 1, q: 10, r: 5, name: 'Ateny', maMur: true, population: 8, garnizon: 0 };
const archer = { id: 'e0', ownerId: 1, typeId: 'Lucznik', q: 10, r: 5, ruchLeft: 0 };
const far = { id: 'e1', ownerId: 1, typeId: 'Falanga', q: 12, r: 5, ruchLeft: 0 };
const atk = { id: 'p0', ownerId: 0, typeId: 'Hastati', q: 9, r: 5, ruchLeft: 1 };

console.log('siege-defenders-test (temp bundle)');
assert(!M.hasCityDefenders(city, [atk]), 'pop only, no garnizon, no units → no defenders');
assert(M.canCaptureCityWithoutBattle(city, [atk]), 'can capture without battle when empty');
const atkOnHex = { ...atk, q: 10, r: 5 };
assert(M.canCaptureCityWithoutBattle(city, [atkOnHex]), 'combat unit ON empty enemy city hex → can capture');
assert(M.hasCityDefenders(city, [atk, archer]), 'enemy unit on city hex → defenders');
assert(M.defenderUnitsNearCity(city, [archer]).length === 1, 'defenderUnitsNearCity on hex');
assert(!M.hasCityDefenders(city, [atk, far]), 'unit dist 2 → not defender');
const cityG = { ...city, garnizon: 3 };
assert(M.hasCityDefenders(cityG, [atk]), 'garnizon>0 alone → defenders');
assert(!M.canCaptureCityWithoutBattle(cityG, [atk]), 'garnizon blocks instant capture');
const adj = { id: 'e2', ownerId: 1, typeId: 'Milicja', q: 11, r: 5, ruchLeft: 0 };
assert(M.hasCityDefenders(city, [atk, adj]), 'adjacent defender dist=1 → defenders');
assert(M.survivorsLiveSet([]) === null, 'empty survivors → null');
assert(M.survivorsLiveSet(undefined) === null, 'undefined survivors → null');

console.log(`RESULT: ${ok}/${ok + fail}`);
process.exit(fail > 0 ? 1 : 0);
