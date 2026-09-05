'use strict';
/**
 * city-defense-terrain-gate-test.cjs
 *
 * Decyzja Maciej C-COMBAT-Q2 (2026-07-26): bonus terenu przy OBRONIE MIASTA
 * dolicza sie WYLACZNIE gdy miasto ma budynek obronny (Mury/Cytadela/Baszta),
 * i to IDENTYCZNIE we wszystkich trzech trybach walki (Auto-moc / bitwa
 * taktyczna / "Pomin"). Z terenow liczy sie WYLACZNIE wzniesienie (Wzgorza;
 * teoretycznie Gory) -- Las, Rzeka i pozostale tereny NIE dodaja nic do
 * obrony miasta. Bitwy w polu (poza miastem) zostaja BEZ ZMIAN.
 *
 * Docelowa siatka (Obrona broniacego) -- patrz raport zadania:
 *   Sytuacja                                  | Struct | Teren | Razem
 *   Miasto bez budynku obronnego, plasko      |   0%   |  0%   |  0%
 *   Miasto bez budynku obronnego, na wzgorzu  |   0%   |  0%   |  0%  (zmiana)
 *   Miasto z Murami, plasko                   | 200%   |  0%   | 200%
 *   Miasto z Murami, na wzgorzu               | 200%   | +50%  | 250%
 *   Mury+Cytadela+Baszta, na wzgorzu          | 400%   | +50%  | 450%
 *
 * Co sprawdza ten test:
 *
 *   CZESC A -- cityGatedTerrainMultiplier (game/city-defense.ts) w izolacji:
 *     funkcja WSPOLNA uzywana przez wszystkie trzy sciezki -- caly grid 5
 *     wierszy x 2 terenow (plasko/wzgorze), plus Gory (teoretyczny wzgledem
 *     miasta) i Las (musi NIE dawac nic, nawet z murem).
 *
 *   CZESC B -- sciezka Auto (main.ts effectiveDefenderM, galaz "isCity"):
 *     reimplementacja 1:1 nowego wzoru (main.ts ~L12262) z prawdziwych
 *     cegielek (unit-power.ts armyFieldPowerSplit + auto-battle-power.ts
 *     sumRosterFieldMSplit + cityGatedTerrainMultiplier) -- caly grid.
 *     Kontrola (a): bitwa w polu (isCity=false) na wzgorzu -- pelny,
 *     niegated terrainDefenseMultiplier dalej dziala (bez zmian).
 *
 *   CZESC C -- fundament wspolny taktycznej/"Pomin" (combat.ts resolveCombat
 *   + structureDefBonusPct + defenderTerrainDefMultOverride): _singleBlow
 *   (battleScene.ts) i computeInstantResult ("Pomin") licza teraz Obrone
 *   broniacego W MIESCIE TA SAMA regola: terrDefMult=1 (neutralizowany przez
 *   defenderTerrainDefMultOverride gdy isCityDefense), structMult = 1 +
 *   (struct% + (cityGatedTerrainMultiplier-1)*100)/100 -- DOKLADNIE formula
 *   _singleBlow (battleScene.ts ~L7433-7440) i computeInstantResult
 *   (~L18154-18168). battleScene.ts nie da sie zbundlowac w izolacji (THREE.js
 *   + zasoby Vite ?raw/import.meta.glob), wiec ten test weryfikuje SAM WZOR
 *   przez resolveCombat -- ta sama arytmetyka co obie sciezki batleScene.ts
 *   (patrz komentarze w kodzie przy defenderTerrainDefMultOverride/terrDefMult).
 *   Caly grid + kontrola (b): "miasto z murem na wzgorzu" daje IDENTYCZNY
 *   combinedMult jak sciezka Auto (Czesc B).
 *
 *   CZESC D -- ZRODLO main.ts (P-BRAMKA-MUR-PARADOKS-REALNA-OBRONA-NIEPOKRYTA,
 *   nota N1 Evaluatora moc-mur-revert, 2026-08-08): Czesc B reimplementuje
 *   effectiveDefenderMCity WLASNA funkcja (main.ts nie da sie zaimportowac w
 *   izolacji -- caly silnik gry/DOM), wiec NIE lapie dryfu SAMEGO WZORU w
 *   produkcyjnym main.ts::effectiveDefenderM -- dowod mutacyjny: wyzerowanie
 *   bonusu muru w REALNEJ bitwie (main.ts) zostawialo caly ten plik zielonym.
 *   Literalna asercja zrodlowa pinuje formule combinedDefPct w galezi isCity.
 *
 * Usage (z gra/): node tools/city-defense-terrain-gate-test.cjs
 */

const path = require('path');
const fs = require('fs');
const os = require('os');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA_DIR = path.resolve(__dirname, '..');
const MAIN_TS = path.join(GRA_DIR, 'src/main.ts');
const UNITS_JSON = path.join(GRA_DIR, 'data/units.json');
const TERRAIN_JSON = path.join(GRA_DIR, 'data/terrain-combat.json');

let pass = 0;
let fail = 0;
function assert(cond, msg) {
  if (cond) {
    pass++;
    console.log('  [OK]', msg);
  } else {
    fail++;
    console.error('  [FAIL]', msg);
  }
}

// ---------------------------------------------------------------------------
// Bundle 1: game/city-defense.ts (cityGatedTerrainMultiplier, cityWallDefenseBonusPercent)
// pulls in game/combat.ts transitively (normTerrain, terrainDefenseMultiplier).
// ---------------------------------------------------------------------------
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
// Przerwanie (SIGTERM z `timeout`, SIGINT z Ctrl-C, SIGHUP) nie odpala haka `exit`.
// Przekierowujemy je na process.exit(), zeby sprzatanie wyzej wykonalo sie tak samo.
// SIGKILL jest nieprzechwytywalny i zostawi katalog — to jedyna luka i jest swiadoma.
for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
  process.on(sig, () => { process.exit(130); });
}
const CITY_BUNDLE = path.join(os.tmpdir(), `cdtg-city-bundle-${TMPDIR_RUN_ID}.cjs`);
esbuild.buildSync({
  entryPoints: [path.join(GRA_DIR, 'src/game/city-defense.ts')],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: CITY_BUNDLE,
  logLevel: 'silent',
});
const { cityGatedTerrainMultiplier, cityWallDefenseBonusPercent } = require(CITY_BUNDLE);

// ---------------------------------------------------------------------------
// Bundle 2: game/combat.ts (resolveCombat, hitChanceTw, terrainDefenseMultiplier)
// ---------------------------------------------------------------------------
const COMBAT_BUNDLE = path.join(os.tmpdir(), `cdtg-combat-bundle-${TMPDIR_RUN_ID}.cjs`);
esbuild.buildSync({
  entryPoints: [path.join(GRA_DIR, 'src/game/combat.ts')],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: COMBAT_BUNDLE,
  logLevel: 'silent',
});
const { resolveCombat, hitChanceTw, terrainDefenseMultiplier } = require(COMBAT_BUNDLE);

// ---------------------------------------------------------------------------
// Bundle 3: unit-power.ts + auto-battle-power.ts (Auto-moc split ATK/OBR)
// ---------------------------------------------------------------------------
const AUTO_ENTRY = path.join(__dirname, '.cdtg-auto-entry.ts');
const AUTO_BUNDLE = path.join(__dirname, '.cdtg-auto-bundle.cjs');
fs.writeFileSync(
  AUTO_ENTRY,
  [
    "export { armyFieldPowerSplit } from '../src/game/unit-power';",
    "export { sumRosterFieldMSplit } from '../src/game/auto-battle-power';",
  ].join('\n'),
  'utf8',
);
esbuild.buildSync({
  entryPoints: [AUTO_ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: AUTO_BUNDLE,
  absWorkingDir: GRA_DIR,
  logLevel: 'silent',
});
const { armyFieldPowerSplit } = require(AUTO_BUNDLE);
fs.unlinkSync(AUTO_ENTRY);

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------
const unitsRaw = JSON.parse(fs.readFileSync(UNITS_JSON, 'utf8'));
const terrainRaw = JSON.parse(fs.readFileSync(TERRAIN_JSON, 'utf8'));
const unitsByName = {};
for (const u of unitsRaw) unitsByName[u['Jednostka']] = u;
function getUnit(name) {
  const u = unitsByName[name];
  if (!u) throw new Error('Unit not found: "' + name + '"');
  return u;
}

const FLAT = 'rownina';
const HILL = 'wzgorza';
const MOUNTAIN = 'gory';
// World baza terrain has no "las"/"rzeka" base value -- Las/Rzeka only ever
// appear as the tactical battlefield's own tile name (battle-terrain.ts's
// combatTerrainName) -- covered directly below via those literal strings.
const LAS_TILE = 'Las';
const RZEKA_TILE = 'Rzeka';

// miasto-params.json defaults (bonus_obrona_mur_proc/cytadela/baszta) -- patrz
// main.ts MUR_BONUS_PROC/CYTADELA_BONUS_PROC/BASZTA_BONUS_PROC.
const MUR = 200, CYTADELA = 100, BASZTA = 100, PALISADA = 100;
function structPctFor(builtIds) {
  return cityWallDefenseBonusPercent(builtIds, { mur: MUR, cytadela: CYTADELA, baszta: BASZTA, palisada: PALISADA });
}

// Docelowa siatka (5 wierszy) -- [label, builtIds, terrain, expectedStructPct, expectedRazemPct]
const GRID = [
  ['Miasto bez budynku obronnego, plasko', [], FLAT, 0, 0],
  ['Miasto bez budynku obronnego, na wzgorzu', [], HILL, 0, 0],
  ['Miasto z Murami, plasko', ['mury'], FLAT, 200, 200],
  ['Miasto z Murami, na wzgorzu', ['mury'], HILL, 200, 250],
  ['Mury+Cytadela+Baszta, na wzgorzu', ['mury', 'fort', 'baszta'], HILL, 400, 450],
];

console.log('city-defense-terrain-gate-test (C-COMBAT-Q2)\n');

// ===========================================================================
// CZESC A -- cityGatedTerrainMultiplier w izolacji
// ===========================================================================
console.log('--- A. cityGatedTerrainMultiplier (game/city-defense.ts) ---');

for (const [label, builtIds, terrain, expStructPct, expRazemPct] of GRID) {
  const hasMur = structPctFor(builtIds) > 0;
  const mult = cityGatedTerrainMultiplier(hasMur, terrain, terrainRaw);
  const expTerrAddPct = expRazemPct - expStructPct;
  const actTerrAddPct = Math.round((mult - 1) * 100 * 100) / 100;
  assert(
    Math.abs(actTerrAddPct - expTerrAddPct) < 0.01,
    label + ': bonus terenu = +' + actTerrAddPct + '% (oczekiwano +' + expTerrAddPct + '%), mult=' + mult,
  );
}

// hasMur=false zawsze neutralizuje, NIEZALEZNIE od terenu (nawet Wzgorza/Gory).
assert(
  cityGatedTerrainMultiplier(false, HILL, terrainRaw) === 1
  && cityGatedTerrainMultiplier(false, MOUNTAIN, terrainRaw) === 1,
  'Brak muru: Wzgorza/Gory dalej daja mult=1.0 (zero bonusu terenu bez budynku obronnego)',
);

// hasMur=true + Gory (teoretyczny przypadek -- miasta nie da sie tam zalozyc,
// ale funkcja musi byc odporna) -- musi dac IDENTYCZNA wartosc co pelny,
// niegated terrainDefenseMultiplier dla Gory (1.75), bo Gory to tez wzniesienie.
{
  const gatedGory = cityGatedTerrainMultiplier(true, MOUNTAIN, terrainRaw);
  const ungatedGory = terrainDefenseMultiplier(MOUNTAIN, 'Wrecz', terrainRaw);
  assert(
    gatedGory === ungatedGory,
    'Mur + Gory (teoretyczny): cityGatedTerrainMultiplier (' + gatedGory + ') == terrainDefenseMultiplier pelny (' + ungatedGory + ')',
  );
}

// Las/Rzeka NIE licza sie do obrony miasta, NAWET z murem (tylko wzniesienie).
assert(
  cityGatedTerrainMultiplier(true, LAS_TILE, terrainRaw) === 1,
  'Mur + Las: mult=1.0 (Las nie chroni miasta, tylko wzniesienie liczy sie)',
);
assert(
  cityGatedTerrainMultiplier(true, RZEKA_TILE, terrainRaw) === 1,
  'Mur + Rzeka: mult=1.0 (Rzeka nie chroni miasta, tylko wzniesienie liczy sie)',
);

// ===========================================================================
// CZESC B -- sciezka Auto (main.ts effectiveDefenderM, galaz "isCity")
// ===========================================================================
console.log('\n--- B. Sciezka Auto (effectiveDefenderM, obrona MIASTA) ---');

const konnica = getUnit('Konnica');
const split = armyFieldPowerSplit(konnica);
assert(split.attack > 0 && split.defense > 0, 'Konnica ma niezerowy Atak i Obrone w rozbiciu M');

/**
 * Reimplementacja 1:1 galezi "isCity" main.ts effectiveDefenderM (~L12303-
 * L12312) -- ADDYTYWNA kombinacja struct%+teren%, TYLKO na czesc Obrony,
 * czesc Ataku obroncy BEZ zadnego bonusu terenu w obronie miasta.
 */
function effectiveDefenderMCity(unitSplit, structBonusPct, hasMur, terrain) {
  const cityTerrMult = cityGatedTerrainMultiplier(hasMur, terrain, terrainRaw);
  const combinedDefPct = structBonusPct + (cityTerrMult - 1) * 100;
  const terrAdjAttack = unitSplit.attack;
  const terrAdjDefense = unitSplit.defense * (1 + combinedDefPct / 100);
  return { m: Math.round((terrAdjAttack + terrAdjDefense) * 10) / 10, combinedDefPct };
}

/** Galaz "bitwa w polu" (isCity=false) -- BEZ ZMIAN, mnozone (nie dodawane). */
function effectiveDefenderMField(unitSplit, structBonusPct, terrain) {
  const terrMult = terrainDefenseMultiplier(terrain, 'Wrecz', terrainRaw);
  const structMult = 1 + structBonusPct / 100;
  const terrAdjAttack = unitSplit.attack * terrMult;
  const terrAdjDefense = unitSplit.defense * terrMult * structMult;
  return Math.round((terrAdjAttack + terrAdjDefense) * 10) / 10;
}

const gridResultsAuto = {};
for (const [label, builtIds, terrain, expStructPct, expRazemPct] of GRID) {
  const structPct = structPctFor(builtIds);
  assert(structPct === expStructPct, label + ': structPct (' + structPct + ') == oczekiwany (' + expStructPct + ')');
  const hasMur = structPct > 0;
  const { m, combinedDefPct } = effectiveDefenderMCity(split, structPct, hasMur, terrain);
  assert(
    Math.abs(combinedDefPct - expRazemPct) < 0.01,
    label + ' (Auto): Razem = +' + combinedDefPct + '% (oczekiwano +' + expRazemPct + '%)',
  );
  gridResultsAuto[label] = { m, combinedDefPct };
}

// Kontrola (a): bitwa w polu (poza miastem) na wzgorzu -- bonus terenu DALEJ
// DZIALA w pelni (Wzgorza +50%), niezaleznie od "muru" (fort/posterunek w
// polu to inny mechanizm, ale terenu sie nie gate'uje tam w ogole).
{
  const mFieldFlat = effectiveDefenderMField(split, 0, FLAT);
  const mFieldHill = effectiveDefenderMField(split, 0, HILL);
  assert(
    mFieldHill > mFieldFlat,
    'KONTROLA (a): bitwa w polu na wzgorzu (' + mFieldHill + ') > plasko (' + mFieldFlat + ') -- bonus terenu w polu dziala jak dzis',
  );
  // Bitwa w polu: terrMult mnozy CALE M (atak+obrona zlane, bez zmian per ta
  // decyzja -- patrz main.ts effectiveDefenderM galaz "else"), wiec przyrost
  // na wzgorzu to (attack+defense)*(1.5-1), NIE tylko defense*(1.5-1).
  const expectedFieldHillDelta = Math.round((split.attack + split.defense) * 0.5 * 10) / 10;
  const actualFieldHillDelta = Math.round((mFieldHill - mFieldFlat) * 10) / 10;
  assert(
    Math.abs(actualFieldHillDelta - expectedFieldHillDelta) < 0.05,
    'KONTROLA (a): przyrost M w polu na wzgorzu (' + actualFieldHillDelta + ') == oczekiwane +50% na calym M, atak+obrona (' + expectedFieldHillDelta + ')',
  );
  // Fort terenowy (+100%, poza miastem) MNOZY sie z terenem -- bez zmian.
  const mFieldFort = effectiveDefenderMField(split, 100, HILL);
  const expectedMultiplicative = Math.round(split.defense * terrainDefenseMultiplier(HILL, 'Wrecz', terrainRaw) * 2 * 10) / 10;
  const actualFortDefContribution = Math.round((mFieldFort - split.attack * terrainDefenseMultiplier(HILL, 'Wrecz', terrainRaw)) * 10) / 10;
  assert(
    Math.abs(actualFortDefContribution - expectedMultiplicative) < 0.05,
    'KONTROLA (a): fort terenowy (+100%) na wzgorzu w polu MNOZY sie z terenem (bez zmian z ta decyzja)',
  );
}

// ===========================================================================
// CZESC C -- fundament wspolny Taktyczna/"Pomin" (resolveCombat)
// ===========================================================================
console.log('\n--- C. Fundament Taktyczna/"Pomin" (resolveCombat + override) ---');

const attackerRow = getUnit('Łucznik');
const defenderRow = getUnit('Łucznik egipski');

function toCombatUnit(raw) {
  const num = (v, fb) => (v === null || v === undefined || v === '' || v === '—' ? fb : Number(v));
  return {
    typNazwa: raw['Jednostka'],
    counterTyp: String(raw['Typ'] ?? raw['Jednostka'] ?? ''),
    rola: raw['Rola (linia)'],
    meleeAttack: num(raw.meleeAttack, 0),
    meleeDefence: num(raw.meleeDefence, 0),
    weaponDamage: num(raw.weaponDamage, num(raw.meleeAttack, 0)),
    armor: num(raw.armor, 0),
    piercing: num(raw.piercing, 0),
    chargeBonus: num(raw.chargeBonus, 0),
    health: num(raw.health, 30),
    'Prog dezercji (% health)': raw['Próg dezercji (% health)'],
    missileAttack: num(raw.missileAttack, 0),
    'Zasieg ataku (hex)': raw['Zasięg ataku (hex)'] || '—',
    'Ilosc pociskow': raw['Ilość pocisków'] || '—',
    'Ruch w bitwie (heksy)': raw['Ruch w bitwie (heksy)'] || '—',
    'Kara obrony z flanki (%)': raw['Kara obrony z flanki (%)'] || '—',
    'Kara obrony z tyłu (%)': raw['Kara obrony z tyłu (%)'] || '—',
    'Super-jednostka': raw['Super-jednostka'],
  };
}

function makeLCG(seed) {
  let s = seed >>> 0;
  return function lcg() {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

function firstHitPct(log, tag) {
  const line = log.find((l) => l.includes(tag));
  const m = /<([\d.]+)%|>=([\d.]+)%/.exec(line);
  return parseFloat(m[1] ?? m[2]);
}

/**
 * Reimplementuje DOKLADNIE ta sama arytmetyke co battleScene.ts _singleBlow
 * (~L7433-7440) ORAZ computeInstantResult (~L18154-18168) w obronie MIASTA:
 * terrDefMult neutralizowany (override=1 w resolveCombat, rownowaznik
 * `this.isCityDefenseBattle` w _singleBlow), a caly bonus (mur+teren) trafia
 * ADDYTYWNIE do structureDefBonusPct.
 */
function runCityDefense(structBonusPct, hasMur, terrain) {
  const cityTerrMult = cityGatedTerrainMultiplier(hasMur, terrain, terrainRaw);
  const combinedPct = structBonusPct + (cityTerrMult - 1) * 100;
  const rng = makeLCG(7);
  const res = resolveCombat(toCombatUnit(attackerRow), toCombatUnit(defenderRow), {
    defenderTerrain: terrain, // realny teren -- kontekst bonusow cyw/rzeki NIETKNIETY
    terrainData: terrainRaw,
    counters: [],
    rng,
    attackerMoved: true,
    attackerPosition: 'front',
    structureDefBonusPct: combinedPct,
    defenderTerrainDefMultOverride: 1, // C-COMBAT-Q2: neutralizuje terrDefMult wewnetrzny
  });
  return { combinedPct, atkHitPct: firstHitPct(res.log, '[Dyst-ATK]') };
}

for (const [label, builtIds, terrain, expStructPct, expRazemPct] of GRID) {
  const structPct = structPctFor(builtIds);
  const hasMur = structPct > 0;
  const { combinedPct } = runCityDefense(structPct, hasMur, terrain);
  assert(
    Math.abs(combinedPct - expRazemPct) < 0.01,
    label + ' (Taktyczna/Pomin): Razem = +' + combinedPct + '% (oczekiwano +' + expRazemPct + '%)',
  );
}

// KONTROLA (b): "miasto z murem na wzgorzu" -- Taktyczna/Pomin daja TEN SAM
// wynik co Auto (Czesc B) -- ta sama arytmetyka, wiec identyczny hitPct
// wynikajacy z tego samego defFinalObrona = Obrona*(1+Razem/100).
{
  const rowMuryHill = GRID.find((g) => g[0] === 'Miasto z Murami, na wzgorzu');
  const [label, builtIds, terrain] = rowMuryHill;
  const structPct = structPctFor(builtIds);
  const hasMur = structPct > 0;

  const autoResult = effectiveDefenderMCity(split, structPct, hasMur, terrain);
  const tacticalResult = runCityDefense(structPct, hasMur, terrain);

  assert(
    Math.abs(autoResult.combinedDefPct - tacticalResult.combinedPct) < 0.01,
    'KONTROLA (b): ' + label + ' -- Auto Razem (+' + autoResult.combinedDefPct
      + '%) == Taktyczna/Pomin Razem (+' + tacticalResult.combinedPct + '%)',
  );

  // Dowod numeryczny dodatkowy: hitChanceTw(atak, Obrona*(1+Razem/100)) musi
  // dac DOKLADNIE ten sam wynik co resolveCombat z override -- czyli Auto i
  // Taktyczna/Pomin licza NAPRAWDE ta sama liczbe, nie tylko ten sam procent.
  const defUnit = toCombatUnit(defenderRow);
  const atkUnit = toCombatUnit(attackerRow);
  const expectedHit = hitChanceTw(atkUnit.meleeAttack, defUnit.meleeDefence * (1 + tacticalResult.combinedPct / 100));
  assert(
    expectedHit === tacticalResult.atkHitPct,
    'KONTROLA (b): hitChanceTw(atak, Obrona*(1+Razem/100)) (' + expectedHit + '%) == resolveCombat z override (' + tacticalResult.atkHitPct + '%)',
  );
}

// Kontrola (a) w resolveCombat/tryb "Pomin": bitwa w polu na wzgorzu (isCity
// false w battleScene.ts -> defenderTerrainDefMultOverride NIE ustawiany,
// structureDefBonusPct=0) -- terrDefMult wewnetrzny resolveCombat dalej liczy
// pelny bonus terenu (bez override).
{
  const rng1 = makeLCG(7);
  const resFlat = resolveCombat(toCombatUnit(attackerRow), toCombatUnit(defenderRow), {
    defenderTerrain: FLAT, terrainData: terrainRaw, counters: [], rng: rng1,
    attackerMoved: true, attackerPosition: 'front', structureDefBonusPct: 0,
  });
  const rng2 = makeLCG(7);
  const resHill = resolveCombat(toCombatUnit(attackerRow), toCombatUnit(defenderRow), {
    defenderTerrain: HILL, terrainData: terrainRaw, counters: [], rng: rng2,
    attackerMoved: true, attackerPosition: 'front', structureDefBonusPct: 0,
  });
  const hitFlat = firstHitPct(resFlat.log, '[Dyst-ATK]');
  const hitHill = firstHitPct(resHill.log, '[Dyst-ATK]');
  assert(
    hitHill < hitFlat,
    'KONTROLA (a), Taktyczna/Pomin: bitwa w polu na wzgorzu (hitPct atakujacego ' + hitHill
      + '% < plasko ' + hitFlat + '%) -- bonus terenu w polu bez zmian (brak override/gate)',
  );
}

// ===========================================================================
// CZESC D -- ZRODLO main.ts (P-BRAMKA-MUR-PARADOKS-REALNA-OBRONA-NIEPOKRYTA,
// nota N1 Evaluatora moc-mur-revert, 2026-08-08): Czesc B wyzej reimplementuje
// effectiveDefenderMCity WLASNA funkcja (main.ts uruchamia caly silnik gry/
// DOM, nie da sie go zaimportowac w izolacji), wiec NIE lapie dryfu SAMEGO
// WZORU wewnatrz produkcyjnego main.ts::effectiveDefenderM -- dowod mutacyjny
// Evaluatora: wstrzykniecie `combinedDefPct = 0 * structBonusPct + (cityTerrMult
// - 1) * 100` (zerowanie bonusu muru w REALNEJ bitwie) zostawialo caly ten
// plik zielonym. Literalna asercja zrodlowa pinuje formule w galezi isCity.
// ===========================================================================
console.log('\n--- D. Zrodlo main.ts (effectiveDefenderM, galaz isCity, REALNA bitwa) ---');

const mainTsSrc = fs.readFileSync(MAIN_TS, 'utf8');
const effectiveDefenderMMatch = mainTsSrc.match(
  /function effectiveDefenderM\(\s*defRoster: RuntimeUnit\[\],\s*terrain: string,\s*structBonusPct: number,\s*atkLeadDef: Record<string, unknown>,\s*q: number,\s*r: number,\s*\): number \{([\s\S]*?)\n {4}\}/,
);
assert(!!effectiveDefenderMMatch, 'effectiveDefenderM() znaleziona w main.ts (funkcja produkcyjna realnej bitwy)');
if (effectiveDefenderMMatch) {
  const body = effectiveDefenderMMatch[1];
  assert(
    /const combinedDefPct = structBonusPct \+ \(cityTerrMult - 1\) \* 100;/.test(body),
    'effectiveDefenderM() (galaz isCity, REALNA bitwa) liczy combinedDefPct = structBonusPct + (cityTerrMult - 1) * 100 -- ' +
      'ta sama ADDYTYWNA formula co Czesc B wyzej (reimplementacja) -- lapie dryf/wyzerowanie bonusu muru w produkcyjnym kodzie',
  );
  assert(
    /terrAdjDefense = split\.defense \* \(1 \+ combinedDefPct \/ 100\);/.test(body),
    'effectiveDefenderM() stosuje combinedDefPct WYLACZNIE na czesc Obrony (terrAdjDefense = split.defense * (1 + combinedDefPct / 100))',
  );
}

// ---------------------------------------------------------------------------
console.log('\n=== city-defense-terrain-gate-test: ' + pass + ' pass, ' + fail + ' fail ===');
try { fs.unlinkSync(AUTO_BUNDLE); } catch (e) {}
process.exit(fail > 0 ? 1 : 0);
