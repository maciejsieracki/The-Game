'use strict';
/**
 * city-capture-pop-loss-test.cjs — R-WEB-CITY-MILITIA-NO-POPULATION-LOSS-Q1 (doprecyzowanie wlasciciela 2026-11-03):
 * zdobycie OBCEGO miasta = -1 obywatel (min. 1), jeden wspolny punkt. Prawdziwe funkcje (esbuild bundle src/).
 * RED na bazie: MILITIA_TEST_ROOT=<gra/ bazy> (brak applyCapturePopulationLoss => FAIL).
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const HERE = path.resolve(__dirname, '..');
const ROOT = process.env.MILITIA_TEST_ROOT ? path.resolve(process.env.MILITIA_TEST_ROOT) : HERE;
const esbuild = require(path.resolve(HERE, 'node_modules', 'esbuild'));
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'city-capture-poploss-'));
const fwd = (p) => p.replace(/\\/g, '/');

async function bundle(mutation) {
  const tag = mutation ? mutation.name : 'base';
  const entry = path.join(tempDir, 'entry-' + tag + '.ts');
  fs.writeFileSync(entry, `
export * as C from '${fwd(path.join(ROOT, 'src/game/cities'))}';
export * as PB from '${fwd(path.join(ROOT, 'src/game/post-battle-map'))}';
`, 'utf8');
  const outfile = path.join(tempDir, 'bundle-' + tag + '.cjs');
  await esbuild.build({
    entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', outfile,
    absWorkingDir: ROOT, logLevel: 'silent', loader: { '.png': 'dataurl' },
    plugins: mutation ? [{
      name: 'mutate',
      setup(b) {
        b.onLoad({ filter: mutation.filter }, (args) => {
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
  { name: 'loss-two', filter: /game[\\/]cities\.ts$/, from: 'const after = Math.max(1, before - CAPTURE_POP_LOSS);', to: 'const after = Math.max(1, before - CAPTURE_POP_LOSS - 1);' },
  { name: 'no-min-one', filter: /game[\\/]cities\.ts$/, from: 'if (before <= 1) return 0;\n  const after = Math.max(1, before - CAPTURE_POP_LOSS);', to: 'const after = before - CAPTURE_POP_LOSS;' },
  { name: 'reclaim-not-excluded', filter: /game[\\/]cities\.ts$/, from: '(city.capturedFromOwnerId !== undefined && city.capturedFromOwnerId === newOwner)', to: 'false' },
  { name: 'pb-call-removed', filter: /game[\\/]post-battle-map\.ts$/, from: 'applyCapturePopulationLoss(city, atkOwner, prevOwner, city.rebelPreviousOwnerId);', to: '' },
  { name: 'rebel-snapshot-ignored', filter: /game[\\/]post-battle-map\.ts$/, from: 'applyCapturePopulationLoss(city, atkOwner, prevOwner, city.rebelPreviousOwnerId);', to: 'applyCapturePopulationLoss(city, atkOwner, prevOwner, undefined);' },
];

const mk = (pop, owner, extra) => Object.assign({ id: 'c1', ownerId: owner, q: 4, r: 7, name: 'M', maMur: false, population: pop, garnizon: 0 }, extra || {});

function checks(M, rec) {
  const C = M.C, PB = M.PB;
  rec(typeof C.applyCapturePopulationLoss === 'function', 'API: applyCapturePopulationLoss istnieje');
  if (typeof C.applyCapturePopulationLoss !== 'function') return;
  rec(C.CAPTURE_POP_LOSS === 1, 'parametr capture_pop_loss z data/miasto-params.json = 1 (jest ' + C.CAPTURE_POP_LOSS + ')');

  // 1. Wspolny punkt zbrojny: bitwa o miasto / szturm / puste miasto / AI / panstwo-miasto / barbarzyncy
  // wszystkie koncza w applyCityCaptureAfterBattle (patrz kontrole statyczne main.ts nizej).
  const capture = (city, atkOwner) => {
    PB.applyCityCaptureAfterBattle(city, [], atkOwner, [], '', {});
    return city;
  };
  let c = capture(mk(10, 1), 0);
  rec(c.population === 9 && c.ownerId === 0, 'gracz zdobywa obce miasto: 10 -> 9 (jest ' + c.population + ')');
  c = capture(mk(6, 0), 2);
  rec(c.population === 5, 'AI zdobywa miasto gracza: 6 -> 5 (jest ' + c.population + ')');
  c = capture(mk(4, 5, { startCityState: true }), 0);
  rec(c.population === 3, 'miasto-panstwo zdobyte: 4 -> 3 (jest ' + c.population + ')');
  c = capture(mk(8, 0), -1);
  rec(c.population === 7, 'barbarzyncy zdobywaja: 8 -> 7 (jest ' + c.population + ')');
  c = capture(mk(1, 1), 0);
  rec(c.population === 1 && c.ownerId === 0, 'miasto o ludnosci 1 zostaje przy 1 (nie niszczone)');
  let exact = true;
  for (let p = 2; p <= 40; p++) { if (capture(mk(p, 1), 0).population !== p - 1) exact = false; }
  rec(exact, 'dla ludnosci 2..40 strata zawsze dokladnie 1 (bez podwojnego naliczenia)');

  // 2. Przypadki wylaczone
  // DECYZJA: odzyskanie = zdobywca jest poprzednim wlascicielem (capturedFromOwnerId) albo wlascicielem sprzed buntu.
  c = mk(10, 1);
  capture(c, 2);
  rec(c.population === 9 && c.capturedFromOwnerId === 1, 'A traci miasto: 10 -> 9, zapamietany poprzedni wlasciciel');
  capture(c, 1);
  rec(c.population === 9 && c.ownerId === 1, 'odzyskanie WLASNEGO miasta: bez -1 (zostaje 9, jest ' + c.population + ')');
  capture(c, 3);
  rec(c.population === 8, 'zdobycie przez trzecia cywilizacje: -1 (jest ' + c.population + ')');
  c = mk(7, -99, { rebelState: true, rebelPreviousOwnerId: 1 });
  capture(c, 1);
  rec(c.population === 7, 'odzyskanie miasta po buncie przez dawnego wlasciciela: bez -1 (jest ' + c.population + ')');
  c = mk(7, -99, { rebelState: true, rebelPreviousOwnerId: 1 });
  capture(c, 2);
  rec(c.population === 6, 'zbuntowane miasto zdobyte przez INNEGO niz dawny wlasciciel: -1 (jest ' + c.population + ')');
  c = mk(5, 3);
  rec(C.applyCapturePopulationLoss(c, 3, 3) === 0 && c.population === 5, 'newOwner===prevOwner: 0');

  // 3. Wiersz raportu
  const row = C.capturePopLossReportRow(1);
  rec(!!row && row.label === 'Ludność' && /^−1/.test(row.value) && row.tone === 'loss', 'wiersz raportu "Ludnosc: -1"');
  rec(C.capturePopLossReportRow(0) === null, 'brak wiersza przy braku straty (odzyskanie / pop 1)');
}

(async () => {
  let fail = 0, pass = 0;
  const rec = (ok, msg) => { if (ok) { pass++; console.log('PASS ' + msg); } else { fail++; console.log('FAIL ' + msg); } };
  const base = await bundle(null);
  checks(base, rec);

  const mainSrc = fs.readFileSync(path.join(ROOT, 'src/main.ts'), 'utf8');
  rec(/applyCapturePopulationLoss\(city, newOwner, oldOwner, rebelPrevOwnerSnapshot\)/.test(mainSrc), 'main.ts: kapitulacja glodowa wola applyCapturePopulationLoss');
  rec(/capturePopLossReportRow\(Math\.max\(0, popBeforeCapture - city\.population\)\)/.test(mainSrc), 'main.ts: applyCityCaptureToMap dodaje wiersz Ludnosc -N');
  rec(/capturePopLossReportRow\(surrenderPopLoss\)/.test(mainSrc), 'main.ts: kapitulacja dodaje wiersz Ludnosc -N');
  const i1 = mainSrc.indexOf('function captureCityWithoutBattle(');
  rec(i1 > 0 && /applyCityCaptureToMap\(city, atkRoster, atkOwner, anchor\)/.test(mainSrc.slice(i1, i1 + 900)), 'main.ts: captureCityWithoutBattle -> applyCityCaptureToMap (wspolny punkt)');
  rec(/applyCityCaptureToMap\(cityOnHex, atkRoster, atkOwner/.test(mainSrc), 'main.ts: bitwa o miasto / szturm -> applyCityCaptureToMap');
  const i2 = mainSrc.indexOf('function applyCityCaptureToMap(');
  rec(i2 > 0 && /applyCityCaptureAfterBattle\(/.test(mainSrc.slice(i2, i2 + 2500)), 'main.ts: applyCityCaptureToMap -> applyCityCaptureAfterBattle (punkt straty)');
  const i3 = mainSrc.indexOf('function transferCityByTreaty(');
  const i4 = mainSrc.indexOf('function annexCityStateToOwner(');
  rec(i3 > 0 && !/applyCapturePopulationLoss/.test(mainSrc.slice(i3, i3 + 2500)), 'cesja traktatowa: bez straty ludnosci');
  rec(i4 > 0 && !/applyCapturePopulationLoss/.test(mainSrc.slice(i4, i4 + 2500)), 'aneksja dyplomatyczna: bez straty ludnosci');

  for (const m of MUTATIONS) {
    let caught = false;
    try {
      const mod = await bundle(m);
      let f = 0; checks(mod, (ok) => { if (!ok) f++; });
      caught = f > 0;
    } catch (e) { caught = !/anchor missing/.test(String(e)); }
    rec(caught, 'mutacja zlapana: ' + m.name);
  }
  try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (_) {}
  console.log('\n' + pass + ' PASS, ' + fail + ' FAIL');
  process.exit(fail ? 1 : 0);
})();
