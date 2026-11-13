'use strict';
/**
 * city-militia-no-population-loss-test.cjs — R-WEB-CITY-MILITIA-NO-POPULATION-LOSS-Q1 (zgloszenie wlasciciela 2026-11-03).
 * Prawdziwe funkcje (esbuild bundle src/). Kontrakt: straty Milicji w bitwie NIE zmieniaja city.population
 * (inwariant: ludnosc po bitwie = ludnosc przed), jedyna konsekwencja calkowitego zniszczenia = odnowa 5 tur.
 * Inwariant dopuszcza spadek ludnosci WYLACZNIE z przyczyn zamierzonych spoza Milicji (w sciezce Milicji brak takich).
 * Uzycie: node tools/city-militia-no-population-loss-test.cjs  (MILITIA_TEST_ROOT=<gra/> — inne drzewo, np. baza => RED)
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const HERE = path.resolve(__dirname, '..');
const ROOT = process.env.MILITIA_TEST_ROOT ? path.resolve(process.env.MILITIA_TEST_ROOT) : HERE;
const esbuild = require(path.resolve(HERE, 'node_modules', 'esbuild'));
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'city-militia-nopoploss-'));
const fwd = (p) => p.replace(/\\/g, '/');

async function bundle(mutation) {
  const tag = mutation ? mutation.name : 'base';
  const entry = path.join(tempDir, 'entry-' + tag + '.ts');
  fs.writeFileSync(entry, `
export * as SD from '${fwd(path.join(ROOT, 'src/game/siegeDefenders'))}';
export * as AB from '${fwd(path.join(ROOT, 'src/game/auto-battle-power'))}';
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

// Mutacje przywracaja stary kontrakt (redukcja ludnosci) lub psuja odnowe; test musi je zlapac.
const MUTATIONS = [
  { name: 'restore-pop-loss-in-cooldown', from: 'city.militiaRegenAtTurn = currentTurn + MILITIA_REGEN_TURNS;',
    to: 'city.militiaRegenAtTurn = currentTurn + MILITIA_REGEN_TURNS; city.population = Math.max(1, (city.population ?? 0) - 9);' },
  { name: 'cooldown-turns-zero', from: 'city.militiaRegenAtTurn = currentTurn + MILITIA_REGEN_TURNS;', to: 'city.militiaRegenAtTurn = currentTurn;' },
  { name: 'headcount-off-by-one', from: 'return Math.floor(Math.max(0, population ?? 0) * MILITIA_POP_FRACTION);', to: 'return Math.floor(Math.max(0, population ?? 0) * MILITIA_POP_FRACTION) + 1;' },
];

function checks(M, rec) {
  const SD = M.SD;
  const gar = (turn) => ({ completedBuildingIds: ['garnizon'], ownerEra: 1, currentTurn: turn });
  const mkCity = (pop) => ({ id: 'c1', ownerId: 1, q: 4, r: 7, name: 'M', maMur: false, population: pop, garnizon: 0 });
  rec(typeof SD.applyMilitiaPopulationLoss === 'undefined', 'API: applyMilitiaPopulationLoss usuniete (zrodlo redukcji ludnosci)');

  // Sciezka jak main.ts po zmianie: zbierz -> polegli -> (BRAK redukcji ludnosci) -> odnowa.
  const pipeline = (city, turn, roster, fallen, ctx) => {
    const destroyed = SD.militiaIdsDestroyedForCooldown(roster, fallen, ctx);
    SD.applyMilitiaDestroyedCooldown(city, roster, destroyed, turn);
  };

  // 1) pop 10, bez wojska, cala Milicja ginie (bitwa taktyczna)
  {
    const c = mkCity(10);
    const r = SD.collectCityDefRoster(c, [], gar(10));
    rec(r.roster.length === 10, 'pop 10: Milicja = 10');
    const fallen = SD.fallenMilitiaIds(r.roster, { survivors: [], loggedDefenderIds: null });
    rec(fallen.size === 10, 'pop 10: cala Milicja polegla (10)');
    pipeline(c, 10, r.roster, fallen, { isAutoBattle: false, attackerWon: true });
    rec(c.population === 10, 'cala Milicja polegla: ludnosc nadal 10');
    rec(c.militiaRegenAtTurn === 15, 'cala Milicja polegla: odnowa 5 tur (15)');
    rec(SD.collectCityDefRoster(c, [], gar(12)).roster.length === 0, 'tura 12: bez Milicji');
    rec(SD.collectCityDefRoster(c, [], gar(15)).roster.length === 10, 'tura 15: Milicja 10 (ludnosc nienaruszona)');
  }

  // 2) czesciowe straty
  {
    const c = mkCity(10);
    const r = SD.collectCityDefRoster(c, [], gar(10));
    const surv = r.roster.slice(0, 6).map((m) => ({ id: String(m.id), hp: 5 }));
    const fallen = SD.fallenMilitiaIds(r.roster, { survivors: surv });
    rec(fallen.size === 4, 'czesciowe: 4 polegle');
    pipeline(c, 10, r.roster, fallen, { isAutoBattle: false, attackerWon: true });
    rec(c.population === 10 && c.militiaRegenAtTurn === undefined, 'czesciowe straty: ludnosc 10, brak odnowy');
    rec(SD.collectCityDefRoster(c, [], gar(11)).roster.length === 10, 'czesciowe straty: nastepny atak Milicja nadal 10');
  }

  // 3) Pomin/Auto, przegrana obrony (prawdziwy applyLossPctToRoster)
  for (const loss of [0.5, 0.97, 1.0]) {
    const c = mkCity(10);
    const r = SD.collectCityDefRoster(c, [], gar(20));
    const rows = r.roster.map((m) => ({ id: String(m.id), typeId: m.typeId, def: r.militiaDefs.get(String(m.id)) || r.militiaDefs.get(m.typeId) || m, hp: m.hp }));
    const dead = new Set();
    try { for (const row of M.AB.applyLossPctToRoster(rows, loss, () => 16)) if (row.dead) dead.add(row.id); } catch (_) { /* fallback */ }
    const fallen = SD.fallenMilitiaIds(r.roster, { autoDeadIds: dead });
    pipeline(c, 20, r.roster, fallen, { isAutoBattle: true, attackerWon: true });
    rec(c.population === 10, `Pomin/Auto lossDefPct ${loss}: ludnosc nadal 10`);
    rec(c.militiaRegenAtTurn === 25, `Pomin/Auto lossDefPct ${loss}: odnowa 25`);
  }

  // 4) prawdziwi obroncy + Milicja
  {
    const c = mkCity(7);
    const real = { id: 'u1', ownerId: 1, typeId: 'Wojownik', category: 'domyslny', q: 4, r: 7, ruch: 2, ruchLeft: 2 };
    const r = SD.collectCityDefRoster(c, [real], gar(10));
    const fallen = SD.fallenMilitiaIds(r.roster, { survivors: [], loggedDefenderIds: null });
    pipeline(c, 10, r.roster, fallen, { isAutoBattle: false, attackerWon: true });
    rec(c.population === 7, 'realny obronca + Milicja: ludnosc 7 po bitwie');
  }

  // 5) inwariant na wielu rozmiarach i ulamkach strat
  let inv = true;
  for (const pop of [1, 2, 3, 10, 25, 60]) {
    for (const keep of [0, 0.25, 0.5, 1]) {
      const c = mkCity(pop);
      const r = SD.collectCityDefRoster(c, [], gar(30));
      const n = Math.round(r.roster.length * keep);
      const surv = r.roster.slice(0, n).map((m) => ({ id: String(m.id), hp: 5 }));
      pipeline(c, 30, r.roster, SD.fallenMilitiaIds(r.roster, { survivors: surv }), { isAutoBattle: false, attackerWon: true });
      if (c.population !== pop) inv = false;
    }
  }
  rec(inv, 'inwariant: ludnosc po bitwie = ludnosc przed (pop 1..60, straty 0..100%)');

  // 6) main.ts nie wola usunietej funkcji (statycznie)
  const main = fs.readFileSync(path.join(ROOT, 'src/main.ts'), 'utf8');
  rec(!/applyMilitiaPopulationLoss/.test(main), 'main.ts: brak wywolania/importu applyMilitiaPopulationLoss');
  rec(/applyMilitiaDestroyedCooldown\(/.test(main), 'main.ts: odnowa (applyMilitiaDestroyedCooldown) nadal podpieta');
}

(async () => {
  let pass = 0;
  let fail = 0;
  const mk = (label) => (c, m) => { if (c) pass++; else { fail++; console.log('FAIL [' + label + '] ' + m); } };
  checks(await bundle(null), mk('base'));
  console.log(`BASE: ${pass} PASS, ${fail} FAIL`);
  let survived = 0;
  for (const mu of MUTATIONS) {
    let f = 0;
    try { checks(await bundle(mu), (c) => { if (!c) f++; }); } catch (e) { f = 1; }
    console.log(`mutacja ${mu.name}: ${f > 0 ? 'ZLAPANA' : 'PRZEZYLA'}`);
    if (f === 0) survived++;
  }
  fs.rmSync(tempDir, { recursive: true, force: true });
  const bad = fail > 0 || survived > 0;
  console.log(bad ? 'RESULT: FAIL' : 'RESULT: PASS');
  process.exit(bad ? 1 : 0);
})();
