'use strict';
/**
 * city-militia-regen-cooldown-test.cjs — R-WEB-CITY-MILITIA-REGEN-COOLDOWN-Q1 (zgloszenie wlasciciela 2026-11-03).
 *
 * Prawdziwe funkcje (esbuild bundle src/): collectCityDefRoster, hasCityDefenders,
 * applyMilitiaPopulationLoss, applyMilitiaDestroyedCooldown, militiaRegenTurnsLeft, serializeGame/deserializeGame.
 * Kontrakt: cala Milicja polegla w turze T => tury T+1..T+4 BEZ Milicji, tura T+5 Milicja w pelnej liczbie
 * (aktualna ludnosc); straty czesciowe nie uruchamiaja odnowy; realni obroncy bez zmian; brak Garnizonu bez zmian;
 * zapis/odczyt zachowuje licznik; stary zapis bez pola = brak odnowy; main.ts podpina currentTurn i licznik.
 * Uzycie: node tools/city-militia-regen-cooldown-test.cjs   (MILITIA_TEST_ROOT=<gra/> — inne drzewo => RED na bazie)
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

const HERE = path.resolve(__dirname, '..');
const ROOT = process.env.MILITIA_TEST_ROOT ? path.resolve(process.env.MILITIA_TEST_ROOT) : HERE;
const esbuild = require(path.resolve(HERE, 'node_modules', 'esbuild'));
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'city-militia-regen-'));
const fwd = (p) => p.replace(/\\/g, '/');

async function bundle(mutation) {
  const tag = mutation ? mutation.name : 'base';
  const entry = path.join(tempDir, 'entry-' + tag + '.ts');
  fs.writeFileSync(entry, `
export * as SD from '${fwd(path.join(ROOT, 'src/game/siegeDefenders'))}';
export * as AB from '${fwd(path.join(ROOT, 'src/game/auto-battle-power'))}';
export * as SV from '${fwd(path.join(ROOT, 'src/game/save'))}';
`, 'utf8');
  const outfile = path.join(tempDir, 'bundle-' + tag + '.cjs');
  await esbuild.build({
    entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', outfile,
    absWorkingDir: ROOT, logLevel: 'silent',
    plugins: mutation ? [{
      name: 'mutate',
      setup(b) {
        b.onLoad({ filter: /game[\\/]siegeDefenders\.ts$/ }, (args) => {
          const src = fs.readFileSync(args.path, 'utf8');
          if (!src.includes(mutation.from)) throw new Error('mutation anchor missing: ' + mutation.name);
          return { contents: src.replace(mutation.from, mutation.to), loader: 'ts' };
        });
      },
    }] : [],
  });
  delete require.cache[outfile];
  return require(outfile);
}

const MUTATIONS = [
  { name: 'cooldown-ignored-in-roster', from: 'if (militiaRegenTurnsLeft(city, options?.currentTurn) > 0) return { roster, militiaDefs };', to: '' },
  { name: 'cooldown-ignored-in-hasDefenders', from: '&& militiaRegenTurnsLeft(city, options?.currentTurn) === 0', to: '' },
  { name: 'cooldown-off-by-one-long', from: 'return Math.max(0, at - currentTurn);', to: 'return Math.max(0, at - currentTurn + 1);' },
  { name: 'cooldown-off-by-one-short', from: 'return Math.max(0, at - currentTurn);', to: 'return Math.max(0, at - currentTurn - 1);' },
  { name: 'partial-triggers-cooldown', from: 'if (!militia.every(m => fallenIds.has(String(m.id)))) return false;', to: 'if (!militia.some(m => fallenIds.has(String(m.id)))) return false;' },
  { name: 'auto-win-not-destroyed', from: 'if (!ctx.isAutoBattle || !ctx.attackerWon) return new Set(fallen);', to: 'return new Set(fallen);' },
  { name: 'turns-not-applied', from: 'city.militiaRegenAtTurn = currentTurn + MILITIA_REGEN_TURNS;', to: 'city.militiaRegenAtTurn = currentTurn;' },
];

function checks(M, rec) {
  const SD = M.SD;
  const ok = ['collectCityDefRoster', 'hasCityDefenders', 'applyMilitiaDestroyedCooldown', 'militiaRegenTurnsLeft', 'militiaIdsDestroyedForCooldown']
    .every((n) => typeof SD[n] === 'function');
  rec(ok, 'API: applyMilitiaDestroyedCooldown / militiaRegenTurnsLeft istnieja');
  if (!ok) return;

  const gar = (turn) => ({ completedBuildingIds: ['garnizon'], ownerEra: 1, currentTurn: turn });
  const mkCity = (pop) => ({ id: 'c1', ownerId: 1, q: 4, r: 7, name: 'M', maMur: false, population: pop, garnizon: 0 });
  const militiaOf = (r) => r.roster.filter((u) => u.isMilitia === true);

  // Sciezka jak main.ts: zbierz -> bitwa -> polegli -> ludnosc -> licznik.
  const battle = (city, turn, deadPredicate) => {
    const r = SD.collectCityDefRoster(city, [], gar(turn));
    const fallen = new Set(r.roster.filter((u) => u.isMilitia && deadPredicate(u)).map((u) => String(u.id)));
    SD.applyMilitiaPopulationLoss(city, r.roster, fallen);
    SD.applyMilitiaDestroyedCooldown(city, r.roster, fallen, turn);
    return r;
  };

  // --- scenariusz glowny: atak w turze 10 niszczy cala Milicje ---
  const city = mkCity(8);
  const a1 = battle(city, 10, () => true);
  rec(militiaOf(a1).length === 8, 'atak 1 (tura 10): Milicja w pelnym skladzie (8)');
  rec(city.population === 1, 'atak 1: ludnosc spadla do 1 (min.), a Milicja jest zniszczona');
  rec(city.militiaRegenAtTurn === 15, 'atak 1: militiaRegenAtTurn = 10 + 5 = 15');
  city.population = 8; // miasto urosło (ludnosc aktualna)
  for (const t of [11, 12, 13, 14]) {
    const r = SD.collectCityDefRoster(city, [], gar(t));
    rec(militiaOf(r).length === 0 && r.roster.length === 0 && r.militiaDefs.size === 0,
      `tura ${t} (T+${t - 10}): zero Milicji w rosterze`);
    rec(SD.hasCityDefenders(city, [], gar(t)) === false, `tura ${t}: hasCityDefenders=false (miasto bez obroncow)`);
    rec(SD.militiaRegenTurnsLeft(city, t) === 15 - t, `tura ${t}: do odnowy zostalo ${15 - t}`);
  }
  const a5 = SD.collectCityDefRoster(city, [], gar(15));
  rec(militiaOf(a5).length === 8 && SD.hasCityDefenders(city, [], gar(15)) === true,
    'tura 15 (T+5): Milicja odnowiona, pelna liczba = aktualna ludnosc (8)');
  rec(militiaOf(SD.collectCityDefRoster(city, [], gar(40))).length === 8, 'tura 40: Milicja nadal dostepna');

  // --- czesciowe straty NIE uruchamiaja odnowy ---
  const c2 = mkCity(8);
  battle(c2, 10, (u) => Number(String(u.id).split('-').pop()) < 3);
  rec(c2.militiaRegenAtTurn === undefined, 'straty czesciowe (3 z 8): brak odnowy');
  rec(c2.population === 5, 'straty czesciowe: ludnosc 8 - 3 = 5 (jak dotad)');
  rec(militiaOf(SD.collectCityDefRoster(c2, [], gar(11))).length === 5, 'straty czesciowe: nastepny atak -> Milicja 5');

  // --- realni obroncy: w okresie odnowy zostaja, Milicji brak ---
  const c3 = mkCity(6);
  c3.militiaRegenAtTurn = 15;
  const real = { id: 'u1', ownerId: 1, typeId: 'Wojownik', category: 'domyslny', q: 4, r: 7, ruch: 2, ruchLeft: 2 };
  const r3 = SD.collectCityDefRoster(c3, [real], gar(12));
  rec(r3.roster.length === 1 && r3.roster[0].id === 'u1' && militiaOf(r3).length === 0,
    'realny obronca w okresie odnowy: walczy sam, bez Milicji');
  rec(SD.hasCityDefenders(c3, [real], gar(12)) === true, 'realny obronca: hasCityDefenders=true');
  const r3b = SD.collectCityDefRoster(c3, [real], gar(15));
  rec(r3b.roster.length === 7 && militiaOf(r3b).length === 6, 'po odnowie: realny obronca + Milicja 6');

  // --- brak Garnizonu: bez zmian ---
  const c4 = mkCity(6);
  const r4 = SD.collectCityDefRoster(c4, [], { completedBuildingIds: [], currentTurn: 50 });
  rec(r4.roster.length === 0, 'brak budynku Garnizon: nadal brak Milicji');
  rec(SD.applyMilitiaDestroyedCooldown(c4, [], new Set(), 5) === false && c4.militiaRegenAtTurn === undefined,
    'brak Milicji w rosterze: licznik nie ustawiany');

  // --- brak currentTurn / stary zapis ---
  const c5 = mkCity(5);
  rec(militiaOf(SD.collectCityDefRoster(c5, [], { completedBuildingIds: ['garnizon'] })).length === 5,
    'miasto bez pola militiaRegenAtTurn: Milicja dostepna');
  c5.militiaRegenAtTurn = 99;
  rec(militiaOf(SD.collectCityDefRoster(c5, [], { completedBuildingIds: ['garnizon'] })).length === 5,
    'brak currentTurn w opcjach: zgodnosc wsteczna (bez odnowy)');

  // --- RUNDA 2: sciezka Pomin/Auto z PRAWDZIWYM applyLossPctToRoster (wagi linii) ---
  if (M.AB && typeof M.AB.applyLossPctToRoster === 'function') {
    const autoPath = (pop, era, lossPct, attackerWon, turn, isAuto = true) => {
      const c = mkCity(pop);
      const r = SD.collectCityDefRoster(c, [], { completedBuildingIds: ['garnizon'], ownerEra: era, currentTurn: turn });
      const rows = r.roster.map((m) => ({ id: String(m.id), typeId: m.typeId, def: r.militiaDefs.get(String(m.id)) || r.militiaDefs.get(m.typeId) || m, hp: m.hp }));
      const dead = new Set();
      try {
        for (const row of M.AB.applyLossPctToRoster(rows, lossPct, () => 16)) if (row.dead) dead.add(row.id);
      } catch (_) { /* def shape: fallback ponizej */ }
      const fallen = SD.fallenMilitiaIds(r.roster, { autoDeadIds: dead });
      SD.applyMilitiaPopulationLoss(c, r.roster, fallen);
      const destroyed = SD.militiaIdsDestroyedForCooldown(r.roster, fallen, { isAutoBattle: isAuto, attackerWon });
      SD.applyMilitiaDestroyedCooldown(c, r.roster, destroyed, turn);
      return { c, r, fallen };
    };
    for (const loss of [0.7, 0.97, 1.0]) {
      const o = autoPath(10, 3, loss, true, 20);
      rec(o.c.militiaRegenAtTurn === 25, `Pomin/Auto, atakujacy wygrywa, lossDefPct ${loss}: licznik odnowy = 25 (dystansowi tez zniszczeni)`);
      rec(SD.collectCityDefRoster(o.c, [], gar(22)).roster.length === 0, `Pomin/Auto ${loss}: tura 22 bez Milicji`);
      rec(SD.collectCityDefRoster(o.c, [], gar(25)).roster.length === o.c.population, `Pomin/Auto ${loss}: tura 25 Milicja = ludnosc`);
    }
    rec(autoPath(10, 3, 0.97, false, 20).c.militiaRegenAtTurn === undefined, 'Pomin/Auto: wygrana obrony (obronca) NIE uruchamia odnowy');
    // remis = attackerWon false
    rec(autoPath(10, 3, 0.3, false, 20).c.militiaRegenAtTurn === undefined, 'Pomin/Auto: remis NIE uruchamia odnowy');
    // reczna bitwa (survivors zdefiniowane) wygrana atakujacego, ocaleni zyja => brak odnowy
    {
      const c = mkCity(6);
      const r = SD.collectCityDefRoster(c, [], gar(20));
      const surv = r.roster.slice(0, 2).map((m) => ({ id: String(m.id), hp: 5 }));
      const fallen = SD.fallenMilitiaIds(r.roster, { survivors: surv });
      const d = SD.militiaIdsDestroyedForCooldown(r.roster, fallen, { isAutoBattle: false, attackerWon: true });
      rec(!SD.applyMilitiaDestroyedCooldown(c, r.roster, d, 20) && c.militiaRegenAtTurn === undefined,
        'reczna bitwa, ocaleni zyja: brak odnowy (auto-regula nie dotyczy trybu recznego)');
    }
  } else {
    rec(false, 'auto-battle-power.ts: applyLossPctToRoster niedostepne w bundlu');
  }

  // --- zapis / odczyt ---
  if (M.SV && typeof M.SV.serializeGame === 'function') {
    const base = { wersja: 3, tura: 18, units: [], gracze: [], exploredByHuman: [], humanOwnerIds: [0], activeHumanOwnerId: 0 };
    const c6 = mkCity(7);
    c6.militiaRegenAtTurn = 21;
    const back = M.SV.deserializeGame(M.SV.serializeGame({ ...base, cities: [c6] }));
    rec(back.cities.length === 1 && back.cities[0].militiaRegenAtTurn === 21, 'save/load: militiaRegenAtTurn zachowane');
    rec(SD.militiaRegenTurnsLeft(back.cities[0], 18) === 3, 'save/load: po wczytaniu zostaly 3 tury');
    const old = M.SV.deserializeGame(M.SV.serializeGame({ ...base, cities: [mkCity(7)] }));
    rec(old.cities[0].militiaRegenAtTurn === undefined
      && militiaOf(SD.collectCityDefRoster(old.cities[0], [], gar(18))).length === 7,
      'stary zapis bez pola: Milicja dostepna');
  } else {
    rec(false, 'save.ts: serializeGame niedostepne w bundlu');
  }
}

function sourceChecks(rec) {
  const main = fs.readFileSync(path.join(ROOT, 'src/main.ts'), 'utf8');
  rec(/currentTurn:\s*turn/.test(main), 'main.ts: cityDefenderOptions przekazuje currentTurn: turn (gracz/AI/taktyczna/Pomin)');
  rec(/applyMilitiaDestroyedCooldown\(\s*cityOnHex,\s*defRoster,\s*militiaIdsDestroyedForCooldown\(defRoster,\s*fallenMilitia,\s*\{\s*isAutoBattle:\s*survivors === undefined,\s*attackerWon:\s*mapWinner === 'atakujacy'/.test(main),
    'main.ts: applyMapBattleOutcome ustawia licznik po bitwie (auto: przegrana obrona = zniszczona)');
  const params = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/combat-params.json'), 'utf8'));
  rec(params['oblężenie'] && params['oblężenie'].militia_regen_turns === 5, 'combat-params.json: militia_regen_turns = 5');
}

(async () => {
  let pass = 0;
  let fail = 0;
  const rec = (cond, msg) => { if (cond) pass++; else { fail++; console.log('FAIL: ' + msg); } };
  try {
    const base = await bundle(null);
    checks(base, rec);
    sourceChecks(rec);
    for (const mut of MUTATIONS) {
      let f = 0;
      try {
        const m = await bundle(mut);
        checks(m, (c) => { if (!c) f++; });
      } catch (e) { f++; }
      rec(f > 0, 'mutacja ' + mut.name + ' lamie test');
    }
  } catch (e) {
    fail++;
    console.log('FAIL: wyjatek ' + ((e && e.stack) || e));
  }
  try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (_) { /* ignore */ }
  console.log(`city-militia-regen-cooldown-test: ${pass} PASS / ${fail} FAIL`);
  process.exit(fail === 0 ? 0 : 1);
})();
