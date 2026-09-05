'use strict';
/**
 * structure-defense-bonus-test.cjs
 *
 * Decyzja Maciej C-COMBAT-Q1 (2026-07-26): bonus budynkow obronnych
 * (Mury/Cytadela/Baszta, miasto-params.json) ma podnosic WYLACZNIE Obrone
 * bronacego sie, NIGDY Atak -- i ma dzialac IDENTYCZNIE w kazdej z trzech
 * sciezek rozstrzygania walki (Auto-moc / bitwa taktyczna / "Pomin").
 *
 * Co sprawdza ten test:
 *
 *   CZESC A (sciezka Auto -- main.ts effectiveDefenderM):
 *     Reimplementuje 1:1 nowy wzor effectiveDefenderM (main.ts ~L12168,
 *     mapFieldBattle.ts ~L171) z gotowych, PRAWDZIWYCH cegielek
 *     (unit-power.ts armyFieldPowerSplit + auto-battle-power.ts
 *     sumRosterFieldMSplit + combat.ts terrainDefenseMultiplier) -- zaden
 *     wzor nie jest tu "wymyslony na nowo", tylko re-eksponowany z tych
 *     samych funkcji, ktorych main.ts faktycznie uzywa. Sprawdza, ze
 *     zwiekszenie structBonusPct skaluje WYLACZNIE skladowa Obrony (nie
 *     Ataku) i ze wynik NIE odpowiada staremu, blednemu wzorowi
 *     raw*terrMult*structMult (ktory mnozyl obie skladowe razem).
 *
 *   CZESC B (wspolny fundament sciezki taktycznej i "Pomin" -- combat.ts
 *   resolveCombat + structureDefBonusPct):
 *     _singleBlow (battleScene.ts, bitwa taktyczna) i computeInstantResult
 *     (battleScene.ts, "Pomin") licza teraz Obrone obroncy TA SAMA regula:
 *     Obrona_final = Obrona_baza * terrMult * (1 + structureDefBonusPct/100).
 *     computeInstantResult realizuje ja wprost przez resolveCombat()
 *     (skip wola resolveCombat z structureDefBonusPct -- naprawiony w tym
 *     zadaniu). _singleBlow ma wlasna, rownolegla implementacje tej samej
 *     regoly (this.wallDefenseMult jako terrDefMult dla onWallWalkway) --
 *     nie da sie jej odpalic w izolacji (battleScene.ts importuje THREE.js +
 *     zasoby Vite ?raw / import.meta.glob, wiec esbuild --bundle nie
 *     rozwiazuje grafu poza Vite), wiec ten test weryfikuje SPOLNY wzor
 *     matematyczny przez resolveCombat -- ten sam wzor (Obrona*terrMult*
 *     structMult), ktorego _singleBlow jest rownolegla, juz wczesniej
 *     poprawna implementacja (patrz raport zadania). Test dowodzi:
 *       - structureDefBonusPct WIEKSZE Obrony broniacego -> nizsza szansa
 *         trafienia atakujacego (Faza dystansowa R1[Dyst-ATK] hitPct spada).
 *       - Atak broniacego (jego WLASNA skladowa ofensywna, R1[Dyst-DEF]
 *         hitPct) jest IDENTYCZNY niezaleznie od structureDefBonusPct --
 *         bonus muru obroncy nie moze podnosic jego wlasnego Ataku.
 *
 * Usage (z gra/): node tools/structure-defense-bonus-test.cjs
 */

const path = require('path');
const fs = require('fs');
const os = require('os');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA_DIR = path.resolve(__dirname, '..');
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
// Bundle 1: combat.ts (resolveCombat, hitChanceTw, terrainDefenseMultiplier)
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
const COMBAT_BUNDLE = path.join(os.tmpdir(), `sdb-combat-bundle-${TMPDIR_RUN_ID}.cjs`);
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
// Bundle 2: unit-power.ts + auto-battle-power.ts (Auto-moc split ATK/OBR)
// ---------------------------------------------------------------------------
const AUTO_ENTRY = path.join(__dirname, '.sdb-auto-entry.ts');
const AUTO_BUNDLE = path.join(__dirname, '.sdb-auto-bundle.cjs');
fs.writeFileSync(
  AUTO_ENTRY,
  [
    "export { armyFieldPowerSplit, fieldPower } from '../src/game/unit-power';",
    "export { sumRosterFieldMSplit, sumRosterFieldM } from '../src/game/auto-battle-power';",
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
const { armyFieldPowerSplit, sumRosterFieldMSplit, sumRosterFieldM } = require(AUTO_BUNDLE);
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

function makeLCG(seed) {
  let s = seed >>> 0;
  return function lcg() {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

console.log('structure-defense-bonus-test (C-COMBAT-Q1)\n');

// ===========================================================================
// CZESC A -- sciezka Auto (main.ts effectiveDefenderM, mapFieldBattle.ts idem)
// ===========================================================================
console.log('--- A. Sciezka Auto (effectiveDefenderM) ---');

// Konnica: Atak i Obrona wyraznie rozne (dobry przypadek demonstracyjny --
// patrz raport zadania dla wyliczen recznych).
const konnica = getUnit('Konnica');
const split = armyFieldPowerSplit(konnica);
assert(split.attack > 0 && split.defense > 0, 'Konnica ma niezerowy Atak i Obrone w rozbiciu M');

/**
 * Reimplementacja 1:1 NOWEGO effectiveDefenderM (main.ts ~L12168) -- jedyna
 * roznica wzgledem produkcyjnego kodu: brak embarkMult/RuntimeUnit (poza
 * zakresem tego testu, patrz raport -- embarkMult nie byl w zakresie decyzji).
 */
function effectiveDefenderMFixed(unitDef, terrain, structBonusPct, terrainData) {
  const s = armyFieldPowerSplit(unitDef);
  const terrMult = terrainDefenseMultiplier(terrain, 'Wręcz', terrainData);
  const structMult = 1 + structBonusPct / 100;
  const terrAdjAttack = s.attack * terrMult;
  const terrAdjDefense = s.defense * terrMult * structMult;
  return Math.round((terrAdjAttack + terrAdjDefense) * 10) / 10;
}

/** Stary, BLEDNY wzor sprzed naprawy -- do porownania (raw = attack+defense zlane). */
function effectiveDefenderMBuggy(unitDef, terrain, structBonusPct, terrainData) {
  const raw = split.attack + split.defense; // == fieldPower total
  const terrMult = terrainDefenseMultiplier(terrain, 'Wręcz', terrainData);
  const structMult = 1 + structBonusPct / 100;
  return Math.round(raw * terrMult * structMult * 10) / 10;
}

const FLAT = 'Płaskie (równina/łąka)';

const mNoMur = effectiveDefenderMFixed(konnica, FLAT, 0, terrainRaw);
const mMur = effectiveDefenderMFixed(konnica, FLAT, 200, terrainRaw); // Mury = +200%

assert(mNoMur === Math.round((split.attack + split.defense) * 10) / 10,
  'Bez muru: effectiveDefenderM == M bazowe (' + mNoMur + ')');

const expectedDelta = Math.round(split.defense * 2 * 10) / 10; // structMult 1->3, delta = defense*(3-1)
const actualDelta = Math.round((mMur - mNoMur) * 10) / 10;
assert(
  Math.abs(actualDelta - expectedDelta) < 0.05,
  'Mury (+200%): caly przyrost M (' + actualDelta + ') pochodzi WYLACZNIE z Obrony (oczekiwano ' + expectedDelta + '), Atak (' + split.attack + ') nie ruszony',
);

const mMurBuggy = effectiveDefenderMBuggy(konnica, FLAT, 200, terrainRaw);
assert(
  mMur < mMurBuggy,
  'Naprawiony wynik (' + mMur + ') jest NIZSZY niz stary bledny wzor (' + mMurBuggy + ') -- mur juz nie mnozy Ataku',
);
console.log('    (kontekst: Atak=' + split.attack + ' Obrona=' + split.defense
  + ' | bez muru M=' + mNoMur + ' | z murem (naprawione) M=' + mMur
  + ' | z murem (stary blad) M=' + mMurBuggy + ')');

// sumRosterFieldMSplit (roster-poziom) musi sumowac sie identycznie jak
// sumRosterFieldM (M total) -- zeby attack+defense pokrywalo dokladnie
// istniejacy ranking Mocy / AI (armyFieldPower NIE zmieniony).
const roster = [
  { typeId: 'Konnica', def: konnica },
  { typeId: 'Hastati', def: getUnit('Hastati') },
];
const rosterSplit = sumRosterFieldMSplit(roster);
const rosterTotal = sumRosterFieldM(roster);
assert(
  Math.abs((rosterSplit.attack + rosterSplit.defense) - rosterTotal) < 0.05,
  'sumRosterFieldMSplit.attack+defense (' + (rosterSplit.attack + rosterSplit.defense)
    + ') == sumRosterFieldM (' + rosterTotal + ') -- zgodnosc z rankingiem Mocy/AI',
);

// ===========================================================================
// CZESC B -- fundament sciezki taktycznej + "Pomin" (resolveCombat)
// ===========================================================================
console.log('\n--- B. Fundament Taktyczna/Pomin (resolveCombat + structureDefBonusPct) ---');

// Obaj Dystans, zeby faza 0 (dystansowa) dala natychmiast R1[Dyst-ATK] i
// R1[Dyst-DEF] z jawnym hitPct w logu -- najprostszy sposob odczytania
// "efektywnej Obrony" i "efektywnego Ataku" bez grzebania w internals.
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

function runOnce(structPct) {
  const rng = makeLCG(7);
  const res = resolveCombat(toCombatUnit(attackerRow), toCombatUnit(defenderRow), {
    defenderTerrain: FLAT,
    terrainData: terrainRaw,
    counters: [],
    rng,
    attackerMoved: true,
    attackerPosition: 'front',
    structureDefBonusPct: structPct,
  });
  const atkHitLine = res.log.find((l) => l.includes('[Dyst-ATK]'));
  const defHitLine = res.log.find((l) => l.includes('[Dyst-DEF]'));
  const atkHitPct = parseFloat(/<([\d.]+)%|>=([\d.]+)%/.exec(atkHitLine)[1] ?? /<([\d.]+)%|>=([\d.]+)%/.exec(atkHitLine)[2]);
  const defHitPct = parseFloat(/<([\d.]+)%|>=([\d.]+)%/.exec(defHitLine)[1] ?? /<([\d.]+)%|>=([\d.]+)%/.exec(defHitLine)[2]);
  return { atkHitPct, defHitPct, log: res.log };
}

const runNoMur = runOnce(0);
const runMur = runOnce(200);

assert(
  runMur.atkHitPct < runNoMur.atkHitPct,
  'Mur (+200% Obrona broniacego): szansa ATAKUJACEGO na trafienie SPADA (' + runNoMur.atkHitPct + '% -> ' + runMur.atkHitPct + '%)',
);
assert(
  runMur.defHitPct === runNoMur.defHitPct,
  'Mur broniacego NIE zmienia jego WLASNEGO Ataku -- szansa OBRONCY na trafienie identyczna (' + runNoMur.defHitPct + '% == ' + runMur.defHitPct + '%)',
);
console.log('    (kontekst: atk hitPct bez muru=' + runNoMur.atkHitPct + '% z murem=' + runMur.atkHitPct
  + '% | def hitPct bez muru=' + runNoMur.defHitPct + '% z murem=' + runMur.defHitPct + '%)');

// Numeryczna zgodnosc z formula defFinalObrona = Obrona*terrMult*structMult:
// resolveCombat liczy szanse trafienia W FAZIE DYSTANSOWEJ jako
// hitChanceTw(atkEffMelee, defFinalObrona) -- UWAGA: to atakujacego
// meleeAttack (nie missileAttack) kontra obroncy Obrona (patrz combat.ts
// linia ~821/795-796). Przy FLAT terrMult=1, wiec structMult=3 (mur +200%)
// musi dac hitChanceTw(meleeAttack, meleeDefence*3) == runMur.atkHitPct
// (dowod, ze structMult trafia w OBRONA, nie w inny parametr).
const atkUnit = toCombatUnit(attackerRow);
const defUnit = toCombatUnit(defenderRow);
const expectedHitMur = hitChanceTw(atkUnit.meleeAttack, defUnit.meleeDefence * 3);
assert(
  expectedHitMur === runMur.atkHitPct,
  'hitChanceTw(atak, Obrona*3) == hitPct z resolveCombat(structureDefBonusPct=200) (' + expectedHitMur + '% == ' + runMur.atkHitPct + '%)',
);

// ---------------------------------------------------------------------------
console.log('\n=== structure-defense-bonus-test: ' + pass + ' pass, ' + fail + ' fail ===');
try { fs.unlinkSync(AUTO_BUNDLE); } catch (e) {}
process.exit(fail > 0 ? 1 : 0);
