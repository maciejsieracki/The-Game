'use strict';
/**
 * teren-walki-etapy-test.cjs
 *
 * C-TEREN-Q1 (2026-07-26): decyzja wlasciciela wdrazana etapami w
 * gra/src/battle/battleScene.ts + battle-terrain.ts + gra/src/game/combat.ts.
 * Test sprawdza trzy nowe reguly terenu bitwy reczne/ogladane, wszystkie
 * czytane z data/terrain-combat.json (nie zaszyte jako liczby w kodzie):
 *
 *   ETAP 1: Gory = +75% Obrony broniacego (nie +50% jak Wzgorza) -- battle-
 *           terrain.ts's combatTerrainName musi zwracac 'Gory', nie zawsze
 *           'Wzgorza', gdy plansza pochodzi ze swiatowego heksu Gory.
 *   ETAP 2: Delta Zasieg (dystansowi) -- Las -1, Wzgorza/Gory +1.
 *   ETAP 3: Kawaleria/Rydwan -- Las koszt x2, Gory NIEDOSTEPNE.
 *
 * Strategia: esbuild-uje src/game/combat.ts i src/battle/battle-terrain.ts
 * (czyste, THREE.js-niezalezne moduly), laduje realny data/terrain-combat.json
 * i wywoluje eksportowane funkcje wprost -- bez instancjonowania calej
 * BattleScene (wymaga WebGL/canvas, poza zasiegiem testu node).
 *
 * Usage (from gra/): node tools/teren-walki-etapy-test.cjs
 */

const path = require('path');
const fs = require('fs');
const os = require('os');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA_DIR = path.resolve(__dirname, '..');
const TERRAIN_JSON = path.join(GRA_DIR, 'data/terrain-combat.json');

const ENTRY = path.join(__dirname, '.teren-walki-etapy-entry.ts');
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
const OUT = path.join(os.tmpdir(), `teren-walki-etapy-bundle-${TMPDIR_RUN_ID}.cjs`);

fs.writeFileSync(
  ENTRY,
  [
    "export { terrainDefenseMultiplier, terrainRangeDelta, cavalryTerrainMultiplier } from '../src/game/combat';",
    "export { presetForWorldTerrain, generateBattleTerrain, BTerrain } from '../src/battle/battle-terrain';",
    "export { buildTerrainTerenTooltipParts, terrainTerenTooltipColor } from '../src/battle/battleTerrainTooltip';",
  ].join('\n'),
  'utf8',
);

esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: OUT,
  absWorkingDir: GRA_DIR,
  logLevel: 'silent',
});

const {
  terrainDefenseMultiplier,
  terrainRangeDelta,
  cavalryTerrainMultiplier,
  presetForWorldTerrain,
  generateBattleTerrain,
  BTerrain,
  buildTerrainTerenTooltipParts,
  terrainTerenTooltipColor,
} = require(OUT);

const terrainData = JSON.parse(fs.readFileSync(TERRAIN_JSON, 'utf8'));

let ok = 0;
let fail = 0;
function assert(cond, msg) {
  if (cond) { console.log('  [OK]', msg); ok++; }
  else { console.error('  [FAIL]', msg); fail++; }
}
function assertEq(actual, expected, msg) {
  assert(actual === expected, msg + ' (expected ' + expected + ', got ' + actual + ')');
}

console.log('teren-walki-etapy-test (C-TEREN-Q1)');

// ---------------------------------------------------------------------------
// ETAP 1: Gory battlefield reports combat name 'Gory' (not 'Wzgorza'), which
// makes combat.ts's terrainDefenseMultiplier resolve +75% (1.75x) Obrona for
// a defender standing there -- vs +50% (1.5x) on an actual Wzgorza battlefield.
// ---------------------------------------------------------------------------
console.log('ETAP 1 -- Gory = +75% Obrona broniacego');
{
  const goryPreset = presetForWorldTerrain({ baza: 'gory' });
  const wzgPreset = presetForWorldTerrain({ baza: 'wzgorza' });
  assertEq(goryPreset.isMountain, true, 'preset Gory ma isMountain=true');
  assertEq(wzgPreset.isMountain, false, 'preset Wzgorza ma isMountain=false');

  const goryMap = generateBattleTerrain({ cols: 34, rows: 28, seed: 'etapy-test-gory', preset: goryPreset });
  const wzgMap = generateBattleTerrain({ cols: 34, rows: 28, seed: 'etapy-test-wzg', preset: wzgPreset });

  let goryHills = 0, goryNamedGory = 0;
  for (let r = 0; r < goryMap.rows; r++) {
    for (let c = 0; c < goryMap.cols; c++) {
      if (goryMap.at(c, r) === BTerrain.Hills) {
        goryHills++;
        if (goryMap.combatTerrainName(c, r) === 'Gory') goryNamedGory++;
      }
    }
  }
  assert(goryHills > 0, 'plansza Gory wygenerowala kafle wzniesien (Hills)');
  assertEq(goryNamedGory, goryHills, 'KAZDY kafel Hills na planszy Gory raportuje nazwe bojowa Gory');

  let wzgHills = 0, wzgNamedWzg = 0;
  for (let r = 0; r < wzgMap.rows; r++) {
    for (let c = 0; c < wzgMap.cols; c++) {
      if (wzgMap.at(c, r) === BTerrain.Hills) {
        wzgHills++;
        if (wzgMap.combatTerrainName(c, r) === 'Wzgorza') wzgNamedWzg++;
      }
    }
  }
  assert(wzgHills > 0, 'plansza Wzgorza wygenerowala kafle wzniesien (Hills)');
  assertEq(wzgNamedWzg, wzgHills, 'KAZDY kafel Hills na planszy Wzgorza raportuje nazwe bojowa Wzgorza (nie Gory)');

  const defGory = terrainDefenseMultiplier('Gory', 'Wrecz', terrainData);
  const defWzg = terrainDefenseMultiplier('Wzgorza', 'Wrecz', terrainData);
  assertEq(defGory, 1.75, 'Obrona broniacego na Gory: x1.75 (+75%)');
  assertEq(defWzg, 1.5, 'Obrona broniacego na Wzgorza: x1.5 (+50%), rozne od Gory');
}

// ---------------------------------------------------------------------------
// ETAP 2: Delta Zasieg (dystansowi) czytane z terrain-combat.json.
// ---------------------------------------------------------------------------
console.log('ETAP 2 -- Delta Zasieg (dystansowi)');
{
  assertEq(terrainRangeDelta('Las', terrainData), -1, 'Zasieg dystansowego: -1 pole (Las, zaslona)');
  assertEq(terrainRangeDelta('Wzgorza', terrainData), 1, 'Zasieg dystansowego: +1 pole (Wzgorza, elewacja)');
  assertEq(terrainRangeDelta('Gory', terrainData), 1, 'Zasieg dystansowego: +1 pole (Gory, elewacja)');
  assertEq(terrainRangeDelta('Plaskie (rownina/laka)', terrainData), 0, 'Zasieg dystansowego: +-0 (Plaskie)');
  assertEq(terrainRangeDelta('Pustynia', terrainData), 0, 'Zasieg dystansowego: +-0 (Pustynia)');
}

// ---------------------------------------------------------------------------
// ETAP 3: Kawaleria/Rydwan -- koszt wejscia x2 (Las), NIEDOSTEPNE (Gory).
// Combines cavalryTerrainMultiplier (combat.ts) with battle-terrain.ts's own
// base moveCost, exactly the way battleScene.ts's _moveCostForUnit does --
// proving the SHARED rule composes correctly for a mounted unit.
// ---------------------------------------------------------------------------
console.log('ETAP 3 -- przejezdnosc/koszt konnicy i rydwanow');
{
  assertEq(cavalryTerrainMultiplier('Las', terrainData), 2, 'mnoznik kosztu ruchu konnicy: x2 (Las)');
  assertEq(cavalryTerrainMultiplier('Gory', terrainData), Infinity, 'mnoznik kosztu ruchu konnicy: NIEDOSTEPNE (Gory)');
  assertEq(cavalryTerrainMultiplier('Wzgorza', terrainData), 1, 'mnoznik kosztu ruchu konnicy: brak kary jawnej (Wzgorza -- tylko "spowolnione", bez liczby/blokady)');
  assertEq(cavalryTerrainMultiplier('Plaskie (rownina/laka)', terrainData), 1, 'mnoznik kosztu ruchu konnicy: x1 (Plaskie)');

  const goryPreset = presetForWorldTerrain({ baza: 'gory' });
  const map = generateBattleTerrain({ cols: 34, rows: 28, seed: 'etapy-test-cav', preset: goryPreset });

  // Same combined rule as battleScene.ts's _moveCostForUnit:
  //   passable(c,r) -> false => Infinity
  //   else moveCost(c,r) * (mounted ? cavalryTerrainMultiplier(combatTerrainName(c,r)) : 1)
  function moveCostForUnit(mounted, c, r) {
    if (!map.passable(c, r)) return Infinity;
    const base = map.moveCost(c, r);
    if (!mounted) return base;
    const mult = cavalryTerrainMultiplier(map.combatTerrainName(c, r), terrainData);
    if (!Number.isFinite(mult)) return Infinity;
    return base * mult;
  }

  let forestTile = null, hillsTile = null;
  for (let r = 0; r < map.rows && (!forestTile || !hillsTile); r++) {
    for (let c = 0; c < map.cols && (!forestTile || !hillsTile); c++) {
      if (!forestTile && map.at(c, r) === BTerrain.Forest) forestTile = [c, r];
      if (!hillsTile && map.at(c, r) === BTerrain.Hills) hillsTile = [c, r];
    }
  }
  assert(!!forestTile, 'plansza Gory ma przynajmniej 1 kafel Lasu do testu');
  assert(!!hillsTile, 'plansza Gory ma przynajmniej 1 kafel Gor (Hills) do testu');

  if (forestTile) {
    const [fc, fr] = forestTile;
    const footCost = moveCostForUnit(false, fc, fr);
    const cavCost = moveCostForUnit(true, fc, fr);
    assertEq(footCost, 2, 'koszt wejscia piechoty w Las: 2 (bazowy)');
    assertEq(cavCost, 4, 'koszt wejscia konnicy w Las: 4 (bazowy 2 x mnoznik x2)');
  }
  if (hillsTile) {
    const [hc, hr] = hillsTile;
    assertEq(map.combatTerrainName(hc, hr), 'Gory', 'kafel Hills na planszy Gory nazywa sie Gory (spojnosc z ETAP 1)');
    const footCost = moveCostForUnit(false, hc, hr);
    const cavCost = moveCostForUnit(true, hc, hr);
    assert(Number.isFinite(footCost), 'piechota MOZE wejsc w Gory (koszt skonczony)');
    assertEq(cavCost, Infinity, 'konnica/rydwan NIE MOZE wejsc w Gory (koszt Infinity, NIEDOSTEPNE)');
  }

  // Wzgorza (hills, NOT mountains) must NOT block cavalry -- only Gory does.
  const wzgPreset = presetForWorldTerrain({ baza: 'wzgorza' });
  const wzgMap = generateBattleTerrain({ cols: 34, rows: 28, seed: 'etapy-test-cav-wzg', preset: wzgPreset });
  let wzgHillsTile = null;
  for (let r = 0; r < wzgMap.rows && !wzgHillsTile; r++) {
    for (let c = 0; c < wzgMap.cols && !wzgHillsTile; c++) {
      if (wzgMap.at(c, r) === BTerrain.Hills) wzgHillsTile = [c, r];
    }
  }
  assert(!!wzgHillsTile, 'plansza Wzgorza ma przynajmniej 1 kafel Hills do testu');
  if (wzgHillsTile) {
    const [hc, hr] = wzgHillsTile;
    const mult = cavalryTerrainMultiplier(wzgMap.combatTerrainName(hc, hr), terrainData);
    assert(Number.isFinite(mult), 'konnica MOZE wejsc na Wzgorza (nie Gory) -- tylko Gory jest NIEDOSTEPNE');
  }
}

// ---------------------------------------------------------------------------
// ETAP 4 (C-TEREN-IMPL-3=B): tooltip TEREN — teksty modyfikatorow terenu.
// ---------------------------------------------------------------------------
console.log('ETAP 4 -- tooltip TEREN (C-TEREN-IMPL-3=B)');
{
  const goryFoot = buildTerrainTerenTooltipParts({
    terrain: 'Gory',
    onWallWalkway: false,
    onFord: false,
    onShore: false,
    rangedUnit: false,
    isCatapult: false,
    rangeBase: 0,
    mounted: false,
    moveCost: 2,
    baseMoveCost: 2,
    terrainData,
  });
  assert(goryFoot.some((p) => p.text.includes('+75%')), 'Gory piechota: obrona +75% w tooltipie');
  assert(goryFoot.some((p) => p.text.includes('Koszt ruchu: 2')), 'Gory piechota: koszt ruchu 2 pkt');

  const goryCav = buildTerrainTerenTooltipParts({
    terrain: 'Gory',
    onWallWalkway: false,
    onFord: false,
    onShore: false,
    rangedUnit: false,
    isCatapult: false,
    rangeBase: 0,
    mounted: true,
    moveCost: Infinity,
    baseMoveCost: 2,
    terrainData,
  });
  assert(goryCav.some((p) => /NIEDOST[EĘ]PNE/i.test(p.text)), 'Gory konnica: NIEDOSTEPNE w tooltipie');

  const lasArcher = buildTerrainTerenTooltipParts({
    terrain: 'Las',
    onWallWalkway: false,
    onFord: false,
    onShore: false,
    rangedUnit: true,
    isCatapult: false,
    rangeBase: 2,
    mounted: false,
    moveCost: 2,
    baseMoveCost: 2,
    terrainData,
  });
  assert(lasArcher.some((p) => p.text.includes('vs dystans')), 'Las: obrona vs dystans');
  assert(lasArcher.some((p) => /Zasi[eę]g/i.test(p.text) && p.text.includes('-1')), 'Las lucznik: -1 hex zasieg');

  const fordParts = buildTerrainTerenTooltipParts({
    terrain: 'Plaskie (rownina/laka)',
    onWallWalkway: false,
    onFord: true,
    onShore: false,
    rangedUnit: false,
    isCatapult: false,
    rangeBase: 0,
    mounted: false,
    moveCost: 1,
    baseMoveCost: 1,
    terrainData,
  });
  assert(fordParts.some((p) => p.text.includes('brodzie')), 'Brod: tekst kary w tooltipie');
  assertEq(terrainTerenTooltipColor(fordParts), '#e08a8a', 'kolor tooltipu: czerwony gdy kara (brod)');
}

console.log('');
console.log('--- ' + ok + ' ok, ' + fail + ' fail ---');
process.exit(fail > 0 ? 1 : 0);
