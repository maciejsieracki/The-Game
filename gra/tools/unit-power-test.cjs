/**
 * unit-power-test.cjs — testy mocy jednostki (TW v3 M).
 * Usage: node gra/tools/unit-power-test.cjs
 */
'use strict';

const path = require('path');
const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');

const GRA_DIR = path.resolve(__dirname, '..');
const UNIT_POWER_TS = path.join(GRA_DIR, 'src/game/unit-power.ts');
const UNITS_JSON = path.join(GRA_DIR, 'data/units.json');
const ESBUILD_BIN = path.join(GRA_DIR, 'node_modules/.bin/esbuild');
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
// SPRZATANIE PO PRZERWANYM PRZEBIEGU — BEZ dotykania dyspozycji sygnalow.
// Wczesniejsza wersja rejestrowala tu handlery SIGINT/SIGTERM/SIGHUP. To bylo GORSZE niz
// wyciek katalogu. Rejestracja handlera zdejmuje domyslna akcje sygnalu, a sygnal
// dostarczony w trakcie synchronicznego `execSync` (`vite build` — czyli wiekszosc czasu
// zycia tej bramki) NIE odpala handlera JS w ogole i zostaje POLKNIETY. Zmierzone na
// minimalnej reprodukcji i na tej bramce: bez handlera SIGTERM daje `exit=143` natychmiast,
// z handlerem proces zyje dalej i konczy sie `exit=0`. Bramka tracila zabijalnosc, a
// przerwany przebieg raportowal SUKCES — dokladnie ten falszywy ZIELONY, ktory ten temat
// ma likwidowac. Dlatego handlerow sygnalow tu nie ma i byc nie moze.
// Zamiast tego przy STARCIE kasujemy wlasne osierocone katalogi z poprzednich przebiegow,
// ktorych proces juz nie zyje. Dziala takze po SIGKILL, nieprzechwytywalnym z definicji.
(() => {
  const nfs = require('fs'); const npath = require('path'); const nos = require('os');
  // Sygnatura nazw nadawana przez ten temat: `<baza>-<pid>-<6 znakow>` (+ ewent. rozszerzenie).
  const STALE = /-(\d+)-[a-z0-9]{6}(?:\.[A-Za-z0-9]+)?$/;
  const alive = (pid) => {
    try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; }
  };
  try {
    for (const ent of nfs.readdirSync(nos.tmpdir())) {
      const m = STALE.exec(ent);
      if (!m) continue;
      if (/shots|preview|zrzut/i.test(ent)) continue;   // zrzuty sa DOWODEM (§9 pkt 6)
      const pid = Number(m[1]);
      // Cudzy (albo wlasny) ZYWY przebieg zostaje nietkniety — kasujemy wylacznie sieroty.
      if (!Number.isInteger(pid) || pid === process.pid || alive(pid)) continue;
      try { nfs.rmSync(npath.join(nos.tmpdir(), ent), { recursive: true, force: true }); } catch { /* best-effort */ }
    }
  } catch { /* best-effort */ }
})();
const BUNDLE_PATH = path.join(os.tmpdir(), `unit-power-bundle-${TMPDIR_RUN_ID}.cjs`);

console.log('Bundling unit-power.ts...');
execSync(
  '"' + ESBUILD_BIN + '" "' + UNIT_POWER_TS + '" --bundle --platform=node --format=cjs --outfile="' + BUNDLE_PATH + '"',
  { stdio: 'inherit' }
);

const {
  fieldPower,
  siegePower,
  armyFieldPower,
  isSiegeUnit,
  sumArmyFieldPower,
} = require(BUNDLE_PATH);

const units = JSON.parse(fs.readFileSync(UNITS_JSON, 'utf8'));
const byName = Object.fromEntries(units.map(u => [u.Jednostka, u]));

let pass = 0;
let fail = 0;

function assert(cond, msg) {
  if (cond) {
    pass++;
    console.log('  OK:', msg);
  } else {
    fail++;
    console.error('  FAIL:', msg);
  }
}

const hastati = byName['Hastati'];
const fp = fieldPower(hastati);
assert(fp.total === 50, 'Hastati M_pole=50 (got ' + fp.total + ')');

const kat = byName['Katapulta'];
assert(isSiegeUnit(kat), 'Katapulta is siege');
assert(armyFieldPower(kat) === 0, 'Katapulta armyFieldPower=0 (excluded from army sum)');
const sp = siegePower(kat);
assert(sp.total > 0, 'Katapulta M_siege>0 (got ' + sp.total + ')');

const wojsko = [hastati, hastati, byName['Falanga']];
const sum = sumArmyFieldPower(wojsko);
assert(sum === 50 + 50 + 45, 'sumArmyFieldPower 3 units (got ' + sum + ')');

const cached = byName['Triari'];
if (typeof cached.fieldPower === 'number') {
  assert(
    fieldPower(cached).total === cached.fieldPower,
    'JSON fieldPower matches runtime for Triari (' + cached.fieldPower + ')'
  );
} else {
  console.log('  SKIP: fieldPower not in JSON yet — run gen-panel-c.py');
}

console.log('\n=== unit-power-test: ' + pass + ' pass, ' + fail + ' fail ===');
process.exit(fail > 0 ? 1 : 0);
