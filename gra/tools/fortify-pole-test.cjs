'use strict';
/**
 * fortify-pole-test.cjs
 *
 * DYSPOZYCJA Macieja 2026-07-26 ("oblężenie + fortyfikacja w polu"): jednostka
 * może się ufortyfikować W POLU (RuntimeUnit.ufortyfikowanyWPolu) -- OSOBNE od
 * garnizonu miasta (inGarnizon) -- w tym KAŻDA jednostka oblegająca (oblegający
 * stoją przy murze, nigdy na hexie miasta, więc nigdy nie mogą wejść w garnizon).
 * Koszt: CAŁY pozostały ruch (ruchLeft=0). NIE przerywa oblężenia (oblegaCityId
 * zostaje). Bonus Obrony +50% (combat-params.json "oblężenie".fortify_obrona_proc)
 * we WSZYSTKICH trzech ścieżkach walki (Auto/taktyczna/Pomiń), wzorem bonusu
 * muru (cityGatedTerrainMultiplier) -- wspólna funkcja fieldFortifyDefenseBonus
 * (game/city-defense.ts) wołana z trzech miejsc.
 *
 * Co sprawdza ten test:
 *   CZĘŚĆ A -- enterFieldFortify/exitFieldFortify (game/armyMerge.ts) w izolacji:
 *     ustawiają/zdejmują flagę, zerują ruch WYŁĄCZNIE na wejściu, NIE dotykają
 *     oblegaCityId (oblężenie trwa dalej) ani inGarnizon (stany ortogonalne).
 *   CZĘŚĆ B -- fieldFortifyDefenseBonus (game/city-defense.ts) w izolacji:
 *     +50% Obrony WYŁĄCZNIE gdy flaga=true, zero regresji gdy false.
 *   CZĘŚĆ C -- ścieżka Auto (main.ts effectiveDefenderM, gałąź "bitwa w polu"):
 *     reimplementacja z prawdziwych cegiełek (unit-power.ts armyFieldPowerSplit
 *     + auto-battle-power.ts sumRosterFieldMSplit + fieldFortifyDefenseBonus) --
 *     bonus SKALUJE się z terenem (% na Obronie przed mnożnikami, jak mur).
 *   CZĘŚĆ D -- fundament wspólny Taktyczna/"Pomiń" (combat.ts resolveCombat):
 *     _singleBlow i computeInstantResult dodają bonus do meleeDefence PRZED
 *     wywołaniem resolveCombat -- ten test odtwarza dokładnie ten punkt wpięcia
 *     i sprawdza, że wynikowy hitChanceTw spada dokładnie tak, jak przewiduje
 *     ręczna formuła Obrona×(1+proc/100)×terrDefMult.
 *   CZĘŚĆ E -- przetrwanie zapisu gry: stare zapisy (obiekt bez pola) = false.
 *
 * Usage (z gra/): node tools/fortify-pole-test.cjs
 */

const path = require('path');
const fs = require('fs');
const os = require('os');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA_DIR = path.resolve(__dirname, '..');
const UNITS_JSON = path.join(GRA_DIR, 'data/units.json');
const TERRAIN_JSON = path.join(GRA_DIR, 'data/terrain-combat.json');
const COMBAT_PARAMS_JSON = path.join(GRA_DIR, 'data/combat-params.json');

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

console.log('fortify-pole-test (dyspozycja 2026-07-26 "oblężenie + fortyfikacja w polu")\n');

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------
const combatParams = JSON.parse(fs.readFileSync(COMBAT_PARAMS_JSON, 'utf8'));
const FORTIFY_OBRONA_PROC = combatParams['oblężenie'].fortify_obrona_proc;
assert(typeof FORTIFY_OBRONA_PROC === 'number' && FORTIFY_OBRONA_PROC > 0,
  'combat-params.json "oblężenie".fortify_obrona_proc jest liczbą dodatnią (' + FORTIFY_OBRONA_PROC + '%)');

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

// ---------------------------------------------------------------------------
// Bundle 1: game/armyMerge.ts (enterFieldFortify / exitFieldFortify)
// ---------------------------------------------------------------------------
const ARMY_ENTRY = path.join(__dirname, '.fortify-pole-army-entry.ts');
const ARMY_BUNDLE = path.join(__dirname, '.fortify-pole-army-bundle.cjs');
fs.writeFileSync(
  ARMY_ENTRY,
  [
    "export { enterFieldFortify, exitFieldFortify, exitGarnizon } from '../src/game/armyMerge';",
  ].join('\n'),
  'utf8',
);
esbuild.buildSync({
  entryPoints: [ARMY_ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: ARMY_BUNDLE,
  logLevel: 'silent',
});
const { enterFieldFortify, exitFieldFortify, exitGarnizon } = require(ARMY_BUNDLE);
fs.unlinkSync(ARMY_ENTRY);

// ---------------------------------------------------------------------------
// Bundle 2: game/city-defense.ts (fieldFortifyDefenseBonus)
// ---------------------------------------------------------------------------
const CITY_BUNDLE = path.join(os.tmpdir(), 'fortify-pole-city-bundle.cjs');
esbuild.buildSync({
  entryPoints: [path.join(GRA_DIR, 'src/game/city-defense.ts')],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: CITY_BUNDLE,
  logLevel: 'silent',
});
const { fieldFortifyDefenseBonus, shouldApplyGarrisonFortifyBonus, unitGetsFortifyDefenseBonus } = require(CITY_BUNDLE);

// ---------------------------------------------------------------------------
// Bundle 3: game/combat.ts (resolveCombat, hitChanceTw, terrainDefenseMultiplier)
// ---------------------------------------------------------------------------
const COMBAT_BUNDLE = path.join(os.tmpdir(), 'fortify-pole-combat-bundle.cjs');
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
// Bundle 4: unit-power.ts + auto-battle-power.ts (Auto-moc split ATK/OBR)
// ---------------------------------------------------------------------------
const AUTO_ENTRY = path.join(__dirname, '.fortify-pole-auto-entry.ts');
const AUTO_BUNDLE = path.join(__dirname, '.fortify-pole-auto-bundle.cjs');
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
const { sumRosterFieldMSplit } = require(AUTO_BUNDLE);
fs.unlinkSync(AUTO_ENTRY);

// ===========================================================================
// CZĘŚĆ A -- enterFieldFortify / exitFieldFortify (game/armyMerge.ts)
// ===========================================================================
console.log('--- A. enterFieldFortify / exitFieldFortify (armyMerge.ts) ---');

function makeUnit(overrides) {
  return {
    id: 'u1',
    ownerId: 0,
    q: 3,
    r: 4,
    ruch: 2,
    ruchLeft: 2,
    typeId: 'Wojownik',
    ...overrides,
  };
}

{
  const u = makeUnit({});
  enterFieldFortify(u);
  assert(u.ufortyfikowanyWPolu === true, 'enterFieldFortify: ustawia ufortyfikowanyWPolu=true');
  assert(u.ruchLeft === 0, 'enterFieldFortify: zeruje ruchLeft (CAŁY pozostały ruch, nie część)');
}

{
  // Jednostka OBLEGAJĄCA (oblegaCityId ustawione) -- fortyfikacja NIE przerywa
  // oblężenia: oblegaCityId musi zostać nietknięte.
  const u = makeUnit({ oblegaCityId: 'city-42', ruchLeft: 0 });
  enterFieldFortify(u);
  assert(u.oblegaCityId === 'city-42', 'enterFieldFortify na jednostce oblegającej: oblegaCityId NIETKNIĘTE (oblężenie trwa)');
  assert(u.ufortyfikowanyWPolu === true, 'enterFieldFortify na jednostce oblegającej: flaga ustawiona mimo trwającego oblężenia');

  const changed = exitFieldFortify(u);
  assert(changed === true, 'exitFieldFortify zwraca true, gdy jednostka była ufortyfikowana w polu');
  assert(u.ufortyfikowanyWPolu === false, 'exitFieldFortify: ufortyfikowanyWPolu -> false');
  assert(u.oblegaCityId === 'city-42', 'exitFieldFortify: oblegaCityId dalej NIETKNIĘTE (oblężenie nadal trwa po zdjęciu fortyfikacji)');

  const again = exitFieldFortify(u);
  assert(again === false, 'exitFieldFortify jest no-opem (zwraca false) dla jednostki już nieufortyfikowanej');
}

{
  // Zdjęcie fortyfikacji przywraca snapshot ruchLeft (ODFORT-Q2), bez dodatkowego kosztu.
  const u = makeUnit({ ruchLeft: 2, ruch: 2 });
  enterFieldFortify(u);
  assert(u.ruchLeft === 0, 'enterFieldFortify: zeruje ruchLeft');
  assert(u.fortifyRuchSnapshot === 2, 'enterFieldFortify: zapisuje snapshot');
  exitFieldFortify(u);
  assert(u.ruchLeft === 2, 'exitFieldFortify przywraca snapshot (pełna pula gdy brak ruchów w turze)');
}

{
  const u = makeUnit({ ruchLeft: 0, ruch: 2 });
  enterFieldFortify(u);
  exitFieldFortify(u);
  assert(u.ruchLeft === 0, 'anti-exploit pole: wejście z MP=0 -> odfort. nadal 0, nie pełna pula');
}

{
  // Ortogonalność względem inGarnizon: dwa NIEZALEŻNE stany, exitGarnizon nie
  // dotyka ufortyfikowanyWPolu i odwrotnie.
  const u = makeUnit({ inGarnizon: true, ufortyfikowanyWPolu: false });
  const changed = exitGarnizon(u);
  assert(changed === true && u.inGarnizon === false, 'exitGarnizon działa niezależnie od pola ufortyfikowanyWPolu');
  assert(u.ufortyfikowanyWPolu === false, 'exitGarnizon nie ustawia ufortyfikowanyWPolu (stany ortogonalne)');
}

{
  // C-025 (Maciej, znalezisko Evaluatora): ufortyfikowanyWPolu i autoExplore
  // wykluczają się wzajemnie -- wejście w fortyfikację w polu MUSI zdjąć
  // autoExplore (inaczej runScoutsAutoExplore przesuwa jednostkę mimo
  // aktywnej flagi fortyfikacji -- zwiadowca "ufortyfikowany" faktycznie
  // się rusza). Drugi kierunek (włączenie Zwiedzaj zdejmuje fortyfikację,
  // main.ts handler 'scout-explore' -> exitFieldFortify) pokrywa istniejąca
  // suita CZĘŚĆ A wyżej dla exitFieldFortify -- tu tylko kierunek
  // enterFieldFortify -> autoExplore=false.
  const scout = makeUnit({ typeId: 'Zwiadowca', autoExplore: true });
  enterFieldFortify(scout);
  assert(scout.ufortyfikowanyWPolu === true, 'enterFieldFortify: ustawia ufortyfikowanyWPolu=true (zwiadowca z autoExplore aktywnym)');
  assert(scout.autoExplore === false, 'C-025: enterFieldFortify zdejmuje autoExplore -- oba stany nigdy nie współistnieją');

  // Jednostka oblegająca z aktywnym autoExplore (skrajny przypadek) -- ten sam
  // wymóg, oblegaCityId dalej nietknięte (jak reszta CZĘŚCI A wyżej).
  const siegeScout = makeUnit({ typeId: 'Zwiadowca', autoExplore: true, oblegaCityId: 'city-42' });
  enterFieldFortify(siegeScout);
  assert(siegeScout.autoExplore === false, 'C-025: enterFieldFortify zdejmuje autoExplore także na jednostce oblegającej');
  assert(siegeScout.oblegaCityId === 'city-42', 'C-025: oblegaCityId dalej nietknięte przy okazji zdjęcia autoExplore');

  // Kontrola: jednostka bez autoExplore -- brak regresji (pole zostaje false/undefined -> false).
  const plain = makeUnit({});
  enterFieldFortify(plain);
  assert(plain.autoExplore === false, 'C-025 kontrola: enterFieldFortify na jednostce bez autoExplore -- pole ustawione na false (brak regresji, brak wyjątku)');
}

// ===========================================================================
// CZĘŚĆ B -- fieldFortifyDefenseBonus (game/city-defense.ts) w izolacji
// ===========================================================================
console.log('\n--- B. fieldFortifyDefenseBonus (city-defense.ts) ---');

{
  const baseObrona = 10;
  assert(
    fieldFortifyDefenseBonus(baseObrona, false, FORTIFY_OBRONA_PROC) === baseObrona,
    'fieldFortifyDefenseBonus(false): zwraca Obronę BEZ ZMIAN (zero regresji dla niefortyfikowanych)',
  );
  assert(
    fieldFortifyDefenseBonus(baseObrona, true, FORTIFY_OBRONA_PROC) === baseObrona * (1 + FORTIFY_OBRONA_PROC / 100),
    'fieldFortifyDefenseBonus(true): mnoży Obronę ×' + (1 + FORTIFY_OBRONA_PROC / 100) + ' (+' + FORTIFY_OBRONA_PROC + '% z combat-params.json)',
  );
}

// ===========================================================================
// CZĘŚĆ C -- ścieżka Auto (main.ts effectiveDefenderM, gałąź "bitwa w polu")
// ===========================================================================
console.log('\n--- C. Ścieżka Auto (effectiveDefenderM, bitwa w polu) ---');

const konnica = getUnit('Konnica');
const splitBase = sumRosterFieldMSplit([{ typeId: 'Konnica', def: konnica }]);
assert(splitBase.attack > 0 && splitBase.defense > 0, 'Konnica ma niezerowy Atak i Obronę w rozbiciu M');

/**
 * Reimplementacja main.ts fortifyFieldScaledDefFor: +50% Obrony na
 * meleeDefence PRZED policzeniem M (armyFieldPowerSplit sumuje meleeDefence
 * 1:1, bez dzielników -- patrz unit-power.ts fieldPower).
 */
function fortifyScaledUnitDef(unitDef, isFortified) {
  if (!isFortified) return unitDef;
  return {
    ...unitDef,
    meleeDefence: fieldFortifyDefenseBonus(Number(unitDef.meleeDefence) || 0, true, FORTIFY_OBRONA_PROC),
  };
}

/** Reimplementacja main.ts effectiveDefenderM, gałąź "bitwa w polu" (else, C-COMBAT-Q2). */
function effectiveDefenderMField(unitSplit, structBonusPct, terrain) {
  const terrMult = terrainDefenseMultiplier(terrain, 'Wrecz', terrainRaw);
  const structMult = 1 + structBonusPct / 100;
  const terrAdjAttack = unitSplit.attack * terrMult;
  const terrAdjDefense = unitSplit.defense * terrMult * structMult;
  return Math.round((terrAdjAttack + terrAdjDefense) * 10) / 10;
}

for (const [label, terrain] of [['płasko', FLAT], ['na wzgórzu', HILL]]) {
  const splitFortified = sumRosterFieldMSplit([
    { typeId: 'Konnica', def: fortifyScaledUnitDef(konnica, true) },
  ]);
  const mBase = effectiveDefenderMField(splitBase, 0, terrain);
  const mFortified = effectiveDefenderMField(splitFortified, 0, terrain);
  const terrMult = terrainDefenseMultiplier(terrain, 'Wrecz', terrainRaw);
  const defIncrease = splitFortified.defense - splitBase.defense;
  const expectedDelta = Math.round(defIncrease * terrMult * 10) / 10;
  const actualDelta = Math.round((mFortified - mBase) * 10) / 10;
  assert(
    Math.abs(actualDelta - expectedDelta) < 0.05,
    'Auto, ' + label + ': przyrost M z fortyfikacji w polu (' + actualDelta
      + ') == +' + FORTIFY_OBRONA_PROC + '% Obrony × mnożnik terenu (' + terrMult + ') = ' + expectedDelta
      + ' -- bonus SKALUJE się z terenem (% na Obronie przed mnożnikami)',
  );
}

// KONTROLA: jednostka NIE fortyfikowana -- zero zmiany względem baseline.
{
  const splitUnfortified = sumRosterFieldMSplit([
    { typeId: 'Konnica', def: fortifyScaledUnitDef(konnica, false) },
  ]);
  assert(
    splitUnfortified.defense === splitBase.defense,
    'KONTROLA: jednostka NIE fortyfikowana -- Obrona w rozbiciu M identyczna jak baseline (zero regresji)',
  );
}

// ===========================================================================
// CZĘŚĆ D -- fundament wspólny Taktyczna/"Pomiń" (resolveCombat)
// ===========================================================================
console.log('\n--- D. Fundament Taktyczna/"Pomiń" (resolveCombat) ---');

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
 * Reimplementuje DOKŁADNIE punkt wpięcia _singleBlow (~L7509-7516) i
 * computeInstantResult (~L18208-18216): bonus fortyfikacji w polu dodany do
 * meleeDefence PRZED wywołaniem resolveCombat (analogicznie do brodu, patrz
 * BROD_KARA_OBRONA w battleScene.ts) -- bitwa w polu (poza miastem), więc
 * ŻADEN structureDefBonusPct/override (to WYŁĄCZNIE dla obrony miasta).
 */
function runFieldBattleWithFortify(terrain, isFortified) {
  const defUnit = toCombatUnit(defenderRow);
  if (isFortified) {
    defUnit.meleeDefence = fieldFortifyDefenseBonus(defUnit.meleeDefence, true, FORTIFY_OBRONA_PROC);
  }
  const rng = makeLCG(7);
  const res = resolveCombat(toCombatUnit(attackerRow), defUnit, {
    defenderTerrain: terrain,
    terrainData: terrainRaw,
    counters: [],
    rng,
    attackerMoved: true,
    attackerPosition: 'front',
  });
  return { atkHitPct: firstHitPct(res.log, '[Dyst-ATK]') };
}

for (const [label, terrain] of [['płasko', FLAT], ['na wzgórzu', HILL]]) {
  const withoutFortify = runFieldBattleWithFortify(terrain, false);
  const withFortify = runFieldBattleWithFortify(terrain, true);
  assert(
    withFortify.atkHitPct <= withoutFortify.atkHitPct,
    'Taktyczna/Pomiń, ' + label + ': ufortyfikowany obrońca trudniejszy do trafienia (' + withFortify.atkHitPct
      + '% <= ' + withoutFortify.atkHitPct + '% bez fortyfikacji)',
  );

  // Dowód numeryczny: hitChanceTw(atak, (Obrona+bonus)*terrDefMult) musi dać
  // DOKŁADNIE ten sam wynik co resolveCombat z bonusem już wliczonym do
  // meleeDefence (front, brak civ/building mods -- mnożniki = 1).
  const atkUnit = toCombatUnit(attackerRow);
  const rawDef = toCombatUnit(defenderRow).meleeDefence;
  const terrMult = terrainDefenseMultiplier(terrain, atkUnit.rola, terrainRaw);
  const boostedDef = fieldFortifyDefenseBonus(rawDef, true, FORTIFY_OBRONA_PROC);
  const expectedHit = hitChanceTw(atkUnit.meleeAttack, boostedDef * terrMult);
  assert(
    expectedHit === withFortify.atkHitPct,
    'Taktyczna/Pomiń, ' + label + ': hitChanceTw(atak, Obrona×(1+' + FORTIFY_OBRONA_PROC + '%)×terrMult) (' + expectedHit
      + '%) == resolveCombat z bonusem wliczonym do meleeDefence (' + withFortify.atkHitPct + '%)',
  );
}

// ===========================================================================
// CZĘŚĆ E -- przetrwanie zapisu gry (stary zapis bez pola = false)
// ===========================================================================
console.log('\n--- E. Przetrwanie zapisu gry (JSON round-trip) ---');

{
  const unit = makeUnit({ ufortyfikowanyWPolu: true, oblegaCityId: 'city-9' });
  const roundTripped = JSON.parse(JSON.stringify(unit));
  assert(
    roundTripped.ufortyfikowanyWPolu === true && roundTripped.oblegaCityId === 'city-9',
    'JSON round-trip (save->load): ufortyfikowanyWPolu i oblegaCityId przetrwały bez zmian',
  );
}

{
  // Stary zapis sprzed tej funkcji -- brak pola w ogóle (nie "false", NIEOBECNE).
  const oldSaveUnit = makeUnit({});
  delete oldSaveUnit.ufortyfikowanyWPolu;
  const loaded = JSON.parse(JSON.stringify(oldSaveUnit));
  assert(
    loaded.ufortyfikowanyWPolu === undefined,
    'Stary zapis (pole nieobecne) pozostaje undefined po wczytaniu',
  );
  assert(
    (loaded.ufortyfikowanyWPolu === true) === false,
    'Stary zapis traktowany jako false wszędzie, gdzie kod sprawdza "=== true" (bez wyjątku/NaN)',
  );
}

// ===========================================================================
// CZĘŚĆ F -- garnizon w mieście bez murów (Maciej 2026-07-31)
// ===========================================================================
console.log('\n--- F. Garnizon bez palisady/murów (+50% Obrony) ---');

const CITY_DEF_PARAMS = { mur: 200, cytadela: 100, baszta: 100, palisada: 100 };

{
  assert(
    shouldApplyGarrisonFortifyBonus([], CITY_DEF_PARAMS) === true,
    'shouldApplyGarrisonFortifyBonus([]): brak budynków obronnych → true',
  );
  assert(
    shouldApplyGarrisonFortifyBonus(['palisada'], CITY_DEF_PARAMS) === false,
    'shouldApplyGarrisonFortifyBonus([palisada]): palisada → false (bonus budynku, nie fortify)',
  );
  assert(
    shouldApplyGarrisonFortifyBonus(['mury'], CITY_DEF_PARAMS) === false,
    'shouldApplyGarrisonFortifyBonus([mury]): mury → false',
  );
  assert(
    shouldApplyGarrisonFortifyBonus(['baszta'], CITY_DEF_PARAMS) === false,
    'shouldApplyGarrisonFortifyBonus([baszta]): sama baszta → false (cityWallDefenseBonusPercent > 0)',
  );
}

{
  const baseObrona = 12;
  const ctxGarnizonNoWall = {
    inGarnizon: true,
    builtBuildingIds: [],
    cityDefenseParams: CITY_DEF_PARAMS,
  };
  const ctxGarnizonPalisada = {
    inGarnizon: true,
    builtBuildingIds: ['palisada'],
    cityDefenseParams: CITY_DEF_PARAMS,
  };
  assert(
    unitGetsFortifyDefenseBonus(ctxGarnizonNoWall) === true,
    'unitGetsFortifyDefenseBonus: garnizon + brak palisady → +50% (jak pole)',
  );
  assert(
    unitGetsFortifyDefenseBonus(ctxGarnizonPalisada) === false,
    'unitGetsFortifyDefenseBonus: garnizon + palisada → bez ×1.5 od fortify',
  );
  assert(
    fieldFortifyDefenseBonus(baseObrona, unitGetsFortifyDefenseBonus(ctxGarnizonNoWall), FORTIFY_OBRONA_PROC)
      === baseObrona * (1 + FORTIFY_OBRONA_PROC / 100),
    'garnizon bez murów: Obrona ×' + (1 + FORTIFY_OBRONA_PROC / 100) + ' (parity z polem)',
  );
  assert(
    fieldFortifyDefenseBonus(baseObrona, unitGetsFortifyDefenseBonus(ctxGarnizonPalisada), FORTIFY_OBRONA_PROC)
      === baseObrona,
    'garnizon z palisadą: Obrona bez zmian od fortify (budynek osobno)',
  );
}

// ---------------------------------------------------------------------------
console.log('\n=== fortify-pole-test: ' + pass + ' pass, ' + fail + ' fail ===');
process.exit(fail > 0 ? 1 : 0);
