'use strict';
/**
 * city-militia-no-defenders-test.cjs — R-WEB-CITY-MILITIA-NO-DEFENDERS-Q1 (spec wlasciciela 2026-11-03).
 *
 * Prawdziwe funkcje (esbuild bundle src/): collectCityDefRoster, buildMilitiaSquad, hasCityDefenders,
 * applyMilitiaPopulationLoss, defenderSideTitle, effectiveGarrison, resolveSiegeAttack.
 *
 * Kontrakt:
 *  M1  liczba milicjantow = ludnosc (1 mieszkaniec = 1 jednostka),
 *  M2  milicja ZAWSZE (takze gdy sa realni obroncy), warunek = UKONCZONY budynek Garnizon
 *      (licznik city.garnizon nie ma znaczenia),
 *  M3  polowa wrecz / polowa dystans (nieparzysta: dodatkowa wrecz), typy wg EPOKI wlasciciela,
 *      dystans = PELNE staty, wrecz = x0,5 (min 1), morale nizsze (ale ponad progiem ucieczki),
 *  M4  bonusy obrony (teren/mur) dotycza milicji, polegli zmniejszaja ludnosc (min. 1),
 *  mutacje zrodla lamia test.
 *
 * Uzycie: node tools/city-militia-no-defenders-test.cjs
 *   MILITIA_TEST_ROOT=<katalog gra/ z src+data> — test na innym drzewie (np. baza origin/main => RED).
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

const HERE = path.resolve(__dirname, '..');
const ROOT = process.env.MILITIA_TEST_ROOT ? path.resolve(process.env.MILITIA_TEST_ROOT) : HERE;
const esbuild = require(path.resolve(HERE, 'node_modules', 'esbuild'));
const UNITS = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'units.json'), 'utf8'));
const unitRow = (n) => UNITS.find((r) => r['Jednostka'] === n);

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'city-militia-nodef-'));
const fwd = (p) => p.replace(/\\/g, '/');

async function bundle(mutation) {
  const entry = path.join(tempDir, 'entry.ts');
  fs.writeFileSync(entry, `
export * as SD from '${fwd(path.join(ROOT, 'src/game/siegeDefenders'))}';
export * as SG from '${fwd(path.join(ROOT, 'src/game/siege'))}';
export * as BB from '${fwd(path.join(ROOT, 'src/game/barbarians'))}';
`, 'utf8');
  const outfile = path.join(tempDir, 'bundle-' + (mutation ? mutation.name : 'base') + '.cjs');
  await esbuild.build({
    entryPoints: [entry],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    outfile,
    absWorkingDir: ROOT,
    logLevel: 'silent',
    plugins: mutation ? [{
      name: 'mutate',
      setup(b) {
        b.onLoad({ filter: mutation.file === 'barbarians' ? /game[\\/]barbarians\.ts$/ : /game[\\/]siegeDefenders\.ts$/ }, (args) => {
          let src = fs.readFileSync(args.path, 'utf8');
          if (!src.includes(mutation.from)) throw new Error('mutation anchor missing: ' + mutation.name);
          src = src.replace(mutation.from, mutation.to);
          return { contents: src, loader: 'ts' };
        });
      },
    }] : [],
  });
  delete require.cache[outfile];
  return require(outfile);
}

const MUTATIONS = [
  { name: 'split-floor', from: 'Math.ceil(c / 2)', to: 'Math.floor(c / 2)' },
  { name: 'no-garrison-gate', from: 'if (!isGarrisonBuildingCompleted(options)) return { roster, militiaDefs };', to: '' },
  { name: 'melee-not-scaled', from: "if (kind === 'wrecz') {", to: 'if (false) {' },
  { name: 'ranged-scaled-too', from: "if (kind === 'wrecz') {", to: 'if (true) {' },
  { name: 'era-iron-shifted', from: 'if (e >= 3) return', to: 'if (e >= 4) return' },
  { name: 'pop-floor-zero', from: 'Math.max(1, before - fallen)', to: 'Math.max(0, before - fallen)' },
  { name: 'replace-not-append', from: 'roster: [...roster, ...virtual]', to: 'roster: virtual' },
  { name: 'barb-ignores-garrison-building', file: 'barbarians', from: 'canCaptureCityWithoutBattle(destCity, units, defenderOptions)', to: 'canCaptureCityWithoutBattle(destCity, units)' },
  { name: 'fallen-partial-log-inferred', from: 'if (logged && !logged.has(id)) continue;', to: '' },
  { name: 'morale-not-reduced', from: "def['Morale bazowe'] = Math.min(", to: "def['Morale bazowe'] = base + 0 * Math.min(" },
];

/** Rdzen asercji; `rec(cond, msg)` zlicza. */
function checks(M, rec) {
  const SD = M.SD;
  const SG = M.SG;
  const fn = (n) => typeof SD[n] === 'function';
  rec(fn('buildMilitiaSquad') && fn('collectCityDefRoster') && fn('applyMilitiaPopulationLoss'),
    'API: buildMilitiaSquad / collectCityDefRoster / applyMilitiaPopulationLoss istnieja');
  if (!fn('buildMilitiaSquad')) return;

  const completed = { completedBuildingIds: ['garnizon'] };
  const mkCity = (pop, garnizon = 0) => ({
    id: 'c1', ownerId: 1, q: 4, r: 7, name: 'M', maMur: false, population: pop, garnizon,
  });
  const EPOCHS = [
    { era: 1, key: 'Kamien', melee: 'Wojownik', ranged: 'Oszczepnik' },
    { era: 2, key: 'Braz', melee: 'Włócznik', ranged: 'Łucznik' },
    { era: 3, key: 'Zelazo', melee: 'Wojownik z mieczem i tarczą', ranged: 'Procarz' },
  ];
  const num = (v) => (typeof v === 'number' ? v : NaN);

  // ---- M1/M2/M3: liczba, podzial, typy, staty --------------------------------------------------
  for (const pop of [3, 10, 30, 60]) {
    for (const E of EPOCHS) {
      const { roster, militiaDefs } = SD.collectCityDefRoster(
        mkCity(pop), [], { ...completed, ownerEra: E.era });
      const mil = roster.filter((u) => u.isMilitia === true);
      const wantMelee = Math.ceil(pop / 2);
      const wantRanged = pop - wantMelee;
      const nm = mil.filter((u) => u.typeId === E.melee).length;
      const nr = mil.filter((u) => u.typeId === E.ranged).length;
      rec(roster.length === pop && mil.length === pop && militiaDefs.size === pop,
        `pop ${pop} era ${E.key}: dokladnie ${pop} jednostek milicji (1 mieszkaniec = 1 jednostka)`);
      rec(nm === wantMelee && nr === wantRanged,
        `pop ${pop} era ${E.key}: ${wantMelee}x ${E.melee} (wrecz) + ${wantRanged}x ${E.ranged} (dystans)`);
      rec(new Set(mil.map((u) => u.id)).size === pop && mil.every((u) => u.q === 4 && u.r === 7 && u.ownerId === 1),
        `pop ${pop} era ${E.key}: unikalne id, pozycja = heks miasta, wlasciciel miasta`);
    }
  }

  for (const E of EPOCHS) {
    const squad = SD.buildMilitiaSquad(10, E.era);
    const m = squad.find((x) => x.kind === 'wrecz');
    const r = squad.find((x) => x.kind === 'dystans');
    const mo = unitRow(E.melee);
    const ro = unitRow(E.ranged);
    rec(!!m && !!r && !!mo && !!ro, `era ${E.key}: wiersze units.json (${E.melee}, ${E.ranged}) istnieja`);
    if (!m || !r || !mo || !ro) continue;
    // dystans: PELNE staty (wszystko poza morale/fieldPower/znacznikami milicji)
    const skip = new Set(['Morale bazowe', 'fieldPower', 'isMilitia', 'militiaKind']);
    const diff = Object.keys(ro).filter((k) => !skip.has(k) && JSON.stringify(ro[k]) !== JSON.stringify(r.def[k]));
    rec(diff.length === 0, `era ${E.key}: ${E.ranged} (dystans) ma PELNE staty z units.json (rozbieznosci: ${diff.join(',') || 'brak'})`);
    rec(r.def.missileAttack === ro.missileAttack && r.def['Zasięg ataku (hex)'] === ro['Zasięg ataku (hex)']
      && r.def['Ilość pocisków'] === ro['Ilość pocisków'] && r.def.health === ro.health && r.def.armor === ro.armor,
      `era ${E.key}: dystans — atak dyst./zasieg/amunicja/HP/pancerz bez zmian`);
    // wrecz: x0,5 (min 1 gdy > 0)
    const half = (v) => (v > 0 ? Math.max(1, Math.floor(v * 0.5 + 0.5)) : v);
    const keys = ['meleeAttack', 'meleeDefence', 'weaponDamage', 'chargeBonus', 'armor', 'piercing', 'health',
      'Atak', 'Obrona', 'Uderzenie', 'Pancerz', 'Przebicie', 'Health'];
    const bad = keys.filter((k) => num(mo[k]) === num(mo[k]) && half(mo[k]) !== m.def[k]);
    rec(bad.length === 0, `era ${E.key}: ${E.melee} (wrecz) ma staty x0,5 (min 1) — odchylenia: ${bad.join(',') || 'brak'}`);
    rec(m.def.meleeAttack < mo.meleeAttack && m.def.health < mo.health, `era ${E.key}: wrecz realnie slabszy niz oryginal`);
    // morale
    for (const [lab, x, o] of [['wrecz', m, mo], ['dystans', r, ro]]) {
      const flee = o['Morale ucieczki'];
      rec(x.def['Morale bazowe'] < o['Morale bazowe'] && x.def['Morale bazowe'] > flee,
        `era ${E.key} ${lab}: morale ${o['Morale bazowe']} -> ${x.def['Morale bazowe']} (nizsze, ale ponad prog ucieczki ${flee})`);
      rec(x.def['Morale ucieczki'] === flee, `era ${E.key} ${lab}: prog ucieczki nie ruszony`);
      rec(x.def.fieldPower === undefined, `era ${E.key} ${lab}: cache fieldPower usuniety (moc liczona z nowych statow)`);
    }
  }

  // ---- M2: warunek budynku, licznik garnizon, realni obroncy -----------------------------------
  const none = SD.collectCityDefRoster(mkCity(30), [], { completedBuildingIds: [] });
  rec(none.roster.length === 0, 'brak budynku Garnizon (ludnosc 30) -> brak milicji');
  const queued = SD.collectCityDefRoster(mkCity(30), [], { completedBuildingIds: [], queuedBuildingIds: ['garnizon'] });
  rec(queued.roster.length === 0, 'Garnizon tylko w kolejce -> brak milicji');
  rec(SD.hasCityDefenders(mkCity(30), [], { completedBuildingIds: [] }) === false, 'bez budynku i bez wojska: hasCityDefenders = false');
  const c0 = SD.collectCityDefRoster(mkCity(10, 0), [], completed).roster.length;
  const c5 = SD.collectCityDefRoster(mkCity(10, 5), [], completed).roster.length;
  rec(c0 === 10 && c5 === 10, 'licznik city.garnizon (0 i 5) nie wplywa na liczbe milicji');
  rec(SD.hasCityDefenders(mkCity(10, 0), [], completed) && !SD.canCaptureCityWithoutBattle(mkCity(10, 0), [], completed),
    'budynek Garnizon + ludnosc: miasto nie jest zdobywane bez walki');
  rec(SD.hasCityDefenders(mkCity(10, 0), [], { ...completed }) === true, 'hasCityDefenders = true dla samej milicji');
  const real = (id, tid = 'Wojownik') => ({ id, ownerId: 1, typeId: tid, category: 'miecznik', q: 4, r: 7, ruch: 2, ruchLeft: 0 });
  const withReal = SD.collectCityDefRoster(mkCity(10), [real('r1'), real('r2', 'Łucznik')], completed);
  rec(withReal.roster.length === 12 && withReal.roster[0].id === 'r1' && withReal.roster[1].id === 'r2'
    && withReal.roster.slice(2).every((u) => u.isMilitia === true),
    'z realnymi obroncami: realni pierwsi + 10 milicjantow dolaczonych (milicja nie zastepuje)');
  const realNoBuilding = SD.collectCityDefRoster(mkCity(10), [real('r1')], { completedBuildingIds: [] });
  rec(realNoBuilding.roster.length === 1 && !realNoBuilding.roster[0].isMilitia, 'realny obronca bez budynku Garnizon: broni sie sam, bez milicji');
  const zeroPop = SD.collectCityDefRoster(mkCity(0), [], completed);
  rec(zeroPop.roster.length === 0, 'ludnosc 0 -> brak milicji (nie ma z czego)');
  const pop1 = SD.collectCityDefRoster(mkCity(1), [], completed);
  rec(pop1.roster.length === 1 && pop1.roster[0].typeId === 'Wojownik', 'ludnosc 1 -> 1 milicjant wrecz');
  const c = mkCity(12);
  SD.collectCityDefRoster(c, [], completed);
  rec(c.population === 12, 'tworzenie rosteru nie zmienia ludnosci');
  rec(SD.collectCityDefRoster(mkCity(5), [], { ...completed, unitRows: UNITS }).roster.length === 5, 'opcja unitRows akceptowana');

  // ---- M4: bonusy obrony (teren) dotycza milicji (abstrakcyjne oblezenie, ta sama kolejka) -----
  const siegeCity = {
    id: 'c1', ownerId: 1, q: 4, r: 7, wallLevel: 0, garrison: [], terrain: 'Wzgórza', population: 10,
    completedBuildingIds: ['garnizon'],
  };
  const att = { typNazwa: 'A', rola: 'Wrecz', Atak: 6, Obrona: 6, Uderzenie: 2, Pancerz: 2, Przebicie: 1, weaponDamage: 5, Health: 60 };
  const res = SG.resolveSiegeAttack(att, siegeCity, { rng: () => 0.5, completedBuildingIds: ['garnizon'] });
  const pooled = SG.makeMilitia(10);
  rec(pooled && pooled.militiaCount === 10, 'makeMilitia(10) -> 10 milicjantow (udzial 1,0)');
  rec(res.engagedDefender && res.engagedDefender.isMilitia === true
    && res.appliedBonus.terrainMult > 1
    && Math.abs(res.engagedDefender.Obrona - pooled.Obrona * res.appliedBonus.terrainMult) < 1e-9,
    'bonus terenu (wzgorze) naliczony milicji (Obrona x mnoznik)');
  const withGarr = SG.effectiveGarrison({ ...siegeCity, garrison: [{ ...att, typNazwa: 'Obronca' }] }, undefined, ['garnizon']);
  rec(withGarr.length === 2 && withGarr[0].typNazwa === 'Obronca' && withGarr[1].isMilitia === true,
    'effectiveGarrison: realny obronca pierwszy + milicja dolaczona');
  rec(SG.effectiveGarrison({ ...siegeCity, garrison: [] }, undefined, []).length === 0, 'effectiveGarrison bez budynku: pusto');

  // ---- M4: straty ludnosci ----------------------------------------------------------------------
  if (fn('applyMilitiaPopulationLoss')) {
    const city = mkCity(10);
    const { roster } = SD.collectCityDefRoster(city, [real('r1')], completed);
    const ids = roster.filter((u) => u.isMilitia).map((u) => u.id);
    const lost = SD.applyMilitiaPopulationLoss(city, roster, new Set([...ids.slice(0, 4), 'r1']));
    rec(lost === 4 && city.population === 6, 'poleglo 4 milicjantow (+1 realny, ignorowany) -> ludnosc 10 -> 6');
    const city2 = mkCity(10);
    const r2 = SD.collectCityDefRoster(city2, [], completed).roster;
    SD.applyMilitiaPopulationLoss(city2, r2, new Set(r2.map((u) => u.id)));
    rec(city2.population === 1, 'wszyscy polegli -> zostaje minimum 1 mieszkaniec');
    const city3 = mkCity(10);
    const r3 = SD.collectCityDefRoster(city3, [], completed).roster;
    rec(SD.applyMilitiaPopulationLoss(city3, r3, new Set()) === 0 && city3.population === 10, 'brak poleglych -> ludnosc bez zmian');
  }

  // ---- zarzut 1 (runda 2): barbarzyncy -- miasto z budynkiem Garnizon NIE jest puste -----------
  if (M.BB && typeof M.BB.canBarbarianWalkIntoEmptyCity === 'function') {
    const BB = M.BB;
    const bc = mkCity(10);
    rec(BB.canBarbarianWalkIntoEmptyCity(bc, [], 'hard', false, completed) === false,
      'barbarzyncy hard: miasto z budynkiem Garnizon (pop 10, bez wojska) NIE jest puste -> nie wchodza');
    rec(BB.canBarbarianWalkIntoEmptyCity(bc, [], 'hard', false, { completedBuildingIds: [] }) === true,
      'barbarzyncy hard: miasto bez budynku Garnizon i bez wojska nadal puste (zdobycie bez walki, bez zmian)');
    rec(BB.canBarbarianWalkIntoEmptyCity(bc, [], 'hard', false) === true,
      'barbarzyncy: bez opcji zachowanie wsteczne (puste)');
    rec(BB.canBarbarianWalkIntoEmptyCity(mkCity(0), [], 'hard', false, completed) === true,
      'barbarzyncy: Garnizon, ale ludnosc 0 (brak milicji) -> puste');
  } else {
    rec(false, 'API: barbarians.canBarbarianWalkIntoEmptyCity');
  }

  // ---- zarzut 4 (runda 2): polegli milicjanci -- semantyka czesciowego logu ---------------------
  if (fn('fallenMilitiaIds')) {
    const fc = mkCity(6);
    const fr = SD.collectCityDefRoster(fc, [real('r1')], completed).roster;
    const mids = fr.filter((u) => u.isMilitia).map((u) => u.id);
    const survivors = [{ id: 'r1', hp: 5 }, { id: mids[0], hp: 3 }];
    const all = SD.fallenMilitiaIds(fr, { survivors, loggedDefenderIds: new Set(fr.map((u) => String(u.id))) });
    rec(all.size === 5 && !all.has(mids[0]) && !all.has('r1'), 'recznie, pelny log: polegli = milicjanci bez wpisu w survivors (5 z 6)');
    const partial = SD.fallenMilitiaIds(fr, { survivors, loggedDefenderIds: new Set(['r1', mids[0], mids[1]]) });
    rec(partial.size === 1 && partial.has(mids[1]), 'recznie, CZESCIOWY log: milicjant bez wpisu w logu NIE jest poleglym (tylko ten z logu)');
    const legacy = SD.fallenMilitiaIds(fr, { survivors, loggedDefenderIds: null });
    rec(legacy.size === 5, 'recznie, brak logu (legacy): jak pelny log');
    const hp0 = SD.fallenMilitiaIds(fr, { survivors: [{ id: mids[0], hp: 0 }], loggedDefenderIds: null });
    rec(hp0.has(mids[0]), 'recznie: survivor z hp<=0 = polegly');
    const auto = SD.fallenMilitiaIds(fr, { autoDeadIds: new Set([mids[2], 'r1']), loggedDefenderIds: new Set(fr.map((u) => String(u.id))) });
    rec(auto.size === 1 && auto.has(mids[2]), 'auto: polegli = autoDeadIds przeciete z milicja (realny ignorowany)');
    const autoPartial = SD.fallenMilitiaIds(fr, { autoDeadIds: new Set([mids[2]]), loggedDefenderIds: new Set(['r1']) });
    rec(autoPartial.size === 0, 'auto, czesciowy log bez milicjanta: nikt nie polegl');
  } else {
    rec(false, 'API: fallenMilitiaIds');
  }

  // ---- zarzut 2 (runda 2): abstrakcyjna pula = ZAŁOZENIE (zbiorczy model, 1 mieszkaniec = 1 HP-share) ----
  const pool60 = SG.makeMilitia(60);
  const halfHp = 9; // STONE_WARRIOR.Health 17 x 0,5 (roundHalfUp) — stala siege.ts, nie units.json
  rec(pool60 && pool60.militiaCount === 60 && pool60.Health === 60 * halfHp,
    'abstrakcyjna pula: 60 mieszkancow -> HP = 60 x 9 (polowa HP STONE_WARRIOR; model zbiorczy; tylko estymacja/oblezenie abstrakcyjne, nie bitwa rosterowa)');

  // ---- tytul strony obroncy ---------------------------------------------------------------------
  const tCity = mkCity(10);
  const tRoster = SD.collectCityDefRoster(tCity, [], completed).roster;
  rec(SD.defenderSideTitle(tCity, tRoster) === 'Milicja (10)', 'tytul: "Milicja (10)"');
  const tMixed = SD.collectCityDefRoster(tCity, [real('r1')], completed).roster;
  rec(SD.defenderSideTitle(tCity, tMixed) === 'Wojownik + Milicja (10)', 'tytul mieszany: "Wojownik + Milicja (10)"');
  rec(SD.defenderSideTitle(tCity, []) === 'Brak', 'tytul pusty: "Brak"');
}

let ok = 0;
let fail = 0;
const log = (...a) => console.log(...a);
function mkRec(quiet) {
  return (cond, msg) => {
    if (cond) { ok++; if (!quiet) log('  [OK]', msg); } else { fail++; if (!quiet) console.error('  [FAIL]', msg); }
  };
}

log('city-militia-no-defenders-test (root: ' + ROOT + ')');
(async () => {
try {
  const base = await bundle(null);
  checks(base, mkRec(false));

  // ---- mutacje --------------------------------------------------------------------------------
  log('--- mutacje (kazda musi zlamac test) ---');
  for (const mu of MUTATIONS) {
    let failures = 0;
    try {
      const mod = await bundle(mu);
      checks(mod, (cond) => { if (!cond) failures++; });
    } catch (e) {
      if (/anchor missing/.test(String(e && e.message))) { console.error("  [FAIL] kotwica mutacji nie istnieje: " + mu.name); failures = 0; } else { failures++; if (process.env.MUT_DEBUG) console.error(String(e && e.message).slice(0,300)); } // rzut wyjatku tez zlamal kontrakt
    }
    if (failures > 0) { ok++; log('  [OK] mutacja ' + mu.name + ' lamie test (' + failures + ' asercji)'); } else { fail++; console.error('  [FAIL] mutacja ' + mu.name + ' PRZESZLA niezauwazona'); }
  }
} catch (e) {
  fail++;
  console.error('  [FAIL] wyjatek:', e && e.stack ? e.stack : e);
} finally {
  try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (_) { /* ignore */ }
}
log('wynik: ' + ok + ' OK, ' + fail + ' FAIL');
process.exit(fail === 0 ? 0 : 1);
})();
