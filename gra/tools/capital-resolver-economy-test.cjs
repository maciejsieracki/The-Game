'use strict';
/**
 * capital-resolver-economy-test.cjs -- R-WEB-CAPITAL-RESOLVER-ECONOMY-Q1 (MINTDEBT #165).
 *
 * Kontrakt: WSZYSTKIE efekty zależne od stolicy w tickach ekonomii (advanceCityEconomy i podgląd
 * previewCityEconomy: korupcja -- dystans 0 dla stolicy i odległość od niej dla reszty; Mennica)
 * używają JEDNEJ stolicy: resolvera (capitalCityIdForOwner z main.ts), a nie heurystyki
 * „pierwsze miasto ownera w tablicy cities”.
 *
 * Scenariusze (behawioralnie, realny silnik, mapa seed 9191):
 *  A. Stolica PRZENIESIONA do miasta B (reg0), które w tablicy stoi jako drugie -> wyniki per miasto
 *     muszą być identyczne jak gdy B stoi pierwsze i stolicę wyznacza heurystyka (symetria).
 *  B. Wskazanie resolvera zgodne z pierwszym miastem == zachowanie bez resolvera (kompatybilność).
 *  C. Przeniesienie stolicy zmienia wynik (test ma moc: resolver faktycznie wpływa na wartości).
 *  D. ownersWithMennica i capitalCityIdByOwnerForTick wybierają stolicę z resolvera.
 *  E. Mutacja czerwona: wyłączenie resolvera w jednym jedynym miejscu (capitalCityIdByOwnerForTick)
 *     musi wywalić scenariusz A -- sprawdzane ręcznie, patrz raport operatora.
 *
 * Run from gra/:  node tools/capital-resolver-economy-test.cjs
 */

const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) { console.error('[capital-resolver-economy-test] esbuild not found. Run: npm install (from gra/)'); process.exit(1); }
})();

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.cre-entry.ts');
const BUNDLE = path.resolve(__dirname, '.cre-bundle.cjs');

fs.writeFileSync(ENTRY, `
import { generateMap, DEFAULT_WIDTH, DEFAULT_HEIGHT } from '../src/map/generator';
import { computeStartPlacements } from '../src/units/setup';
import { foundCity, cityName } from '../src/game/cities';
import { loadGameData } from '../src/data/loader';
import { advanceCityEconomy, previewCityEconomy, ownersWithMennica, capitalCityIdByOwnerForTick, setOwnerCapitalCityResolver } from '../src/game/turn-economy';
export { generateMap, DEFAULT_WIDTH, DEFAULT_HEIGHT, computeStartPlacements, foundCity, cityName, loadGameData, advanceCityEconomy, previewCityEconomy, ownersWithMennica, capitalCityIdByOwnerForTick, setOwnerCapitalCityResolver };
`, 'utf8');

let passed = 0;
let failed = 0;
function check(name, cond, detail) {
  if (cond) { passed++; console.log('  PASS ' + name); }
  else { failed++; console.log('  FAIL ' + name + (detail !== undefined ? ' -- ' + detail : '')); }
}

try {
  esbuild.buildSync({
    entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
    outfile: BUNDLE, loader: { '.json': 'json', '.ts': 'ts' }, absWorkingDir: GRA, logLevel: 'silent',
  });
  const M = require(BUNDLE);
  const map = M.generateMap(M.DEFAULT_WIDTH, M.DEFAULT_HEIGHT, 9191);
  const data = M.loadGameData();
  const start = M.computeStartPlacements(map, data);

  const mk = (id, owner, q, r, n, existing) => {
    const c = M.foundCity({ id, ownerId: owner, typeId: 'Osadnik', category: 'osadnik', q, r, ruch: 2, ruchLeft: 2 }, existing || [], map, M.cityName(n));
    if (c) c.id = id;
    return c;
  };

  // Dwa imperia: owner 0 (cap0 + reg0), owner 1 (cap1 + reg1). Kolejność w tablicy dla owner 0
  // zależy od `order`: 'capFirst' = [cap0, reg0], 'regFirst' = [reg0, cap0].
  function world(order) {
    const owner0 = [];
    const owner1 = [];
    const s0 = start.aiStarts[0];
    const s1 = start.aiStarts[1];
    const cap0 = mk('cap0', 0, s0.q, s0.r, 1, []);
    if (!cap0) throw new Error('stolica owner 0 nie założona');
    let reg0 = null;
    for (let d = 5; d <= 12 && !reg0; d++) for (let dq = -d; dq <= d && !reg0; dq++) for (const sg of [1, -1]) {
      reg0 = mk('reg0', 0, s0.q + dq, s0.r + sg * (d - Math.abs(dq)), 2, [cap0]);
      if (reg0) break;
    }
    if (!reg0) throw new Error('miasto regionalne owner 0 nie założone');
    const cap1 = mk('cap1', 1, s1.q, s1.r, 3, [cap0, reg0]);
    if (!cap1) throw new Error('stolica owner 1 nie założona');
    let reg1 = null;
    for (let d = 5; d <= 12 && !reg1; d++) for (let dq = -d; dq <= d && !reg1; dq++) for (const sg of [1, -1]) {
      reg1 = mk('reg1', 1, s1.q + dq, s1.r + sg * (d - Math.abs(dq)), 4, [cap0, reg0, cap1]);
      if (reg1) break;
    }
    if (!reg1) throw new Error('miasto regionalne owner 1 nie założone');
    cap0.population = 8;
    reg0.population = 80; // duże miasto: efekty procentowe nie giną w zaokrągleniu
    cap1.population = 8;
    reg1.population = 80;
    owner0.push(...(order === 'capFirst' ? [cap0, reg0] : [reg0, cap0]));
    owner1.push(cap1, reg1);
    const cities = [...owner0, ...owner1];
    // Mennica stoi w reg0 (miasto B). Gdy B jest stolicą -> bonus Waluta+Mennica; gdy nie -> brak.
    const built = new Map([
      ['cap0', ['mury']],
      ['reg0', ['mennica', 'mury']],
      ['cap1', ['mury']],
      ['reg1', ['mury']],
    ]);
    return { cities, built };
  }

  const RES_MOVED = (oid) => (oid === 0 ? 'reg0' : oid === 1 ? 'cap1' : null); // stolica przeniesiona do B
  const RES_FIRST = (oid) => (oid === 0 ? 'cap0' : oid === 1 ? 'cap1' : null); // stolica = pierwsze miasto
  const pick = (res) => {
    // Klucze posortowane: kolejność perCity zależy od kolejności tablicy miast (to jest testowane).
    const out = {};
    for (const p of [...res.perCity].sort((a, b) => (a.cityId < b.cityId ? -1 : a.cityId > b.cityId ? 1 : 0))) {
      out[p.cityId] = JSON.stringify({ praca: p.praca, pb: p.pieniadzBrutto, p: p.pieniadz, z: p.zywnoscNetto });
    }
    return out;
  };
  const sameMap = (a, b) => JSON.stringify(a) === JSON.stringify(b);

  const runTick = (order, resolver) => {
    M.setOwnerCapitalCityResolver(resolver);
    const { cities, built } = world(order);
    const res = M.advanceCityEconomy(cities, map, data, 'normal', [], new Map(), built, 1, new Set(['Waluta']), new Map(), new Map(),
      undefined, undefined, 'wysoki', undefined, undefined, undefined, undefined, undefined, undefined, undefined,
      new Map(), undefined, new Map(), new Map(), new Map(), undefined);
    return pick(res);
  };
  const runPreview = (order, resolver) => {
    M.setOwnerCapitalCityResolver(resolver);
    const { cities, built } = world(order);
    const res = M.previewCityEconomy(cities, map, data, 'normal', built, 1, new Set(['Waluta']), new Map(), new Map());
    return pick(res);
  };

  console.log('capital-resolver-economy-test');

  // A. Symmetria: stolica przeniesiona (resolver -> reg0, stoi drugie) == stolica heurystyczna (reg0 stoi pierwsze).
  const tickMoved = runTick('capFirst', RES_MOVED);
  const tickHeurFirstIsB = runTick('regFirst', null);
  check('A1 tick: przeniesiona stolica (B drugie w tablicy) == B pierwsze w tablicy',
    sameMap(tickMoved, tickHeurFirstIsB),
    'różnice: ' + Object.keys(tickMoved).filter(k => tickMoved[k] !== tickHeurFirstIsB[k]).join(','));
  const prevMoved = runPreview('capFirst', RES_MOVED);
  const prevHeurFirstIsB = runPreview('regFirst', null);
  check('A2 preview (HUD): przeniesiona stolica == B pierwsze w tablicy',
    sameMap(prevMoved, prevHeurFirstIsB),
    'różnice: ' + Object.keys(prevMoved).filter(k => prevMoved[k] !== prevHeurFirstIsB[k]).join(','));

  // B. Resolver zgodny z pierwszym miastem == brak resolvera (kompatybilność z dotychczasowym zachowaniem).
  const tickFirstRes = runTick('capFirst', RES_FIRST);
  const tickNoRes = runTick('capFirst', null);
  check('B1 tick: resolver = pierwsze miasto == brak resolvera', sameMap(tickFirstRes, tickNoRes));
  const prevFirstRes = runPreview('capFirst', RES_FIRST);
  const prevNoRes = runPreview('capFirst', null);
  check('B2 preview: resolver = pierwsze miasto == brak resolvera', sameMap(prevFirstRes, prevNoRes));

  // C. Test ma moc: przeniesienie stolicy zmienia wartości miast (korupcja + Mennica).
  check('C1 tick: przeniesienie stolicy zmienia wynik (resolver działa)', !sameMap(tickMoved, tickFirstRes),
    'brak różnicy -- resolver nie wpływa na efekty');
  check('C2 tick: miasto dawnej stolicy (cap0) traci status stolicy (inny wynik niż przy stolicy)',
    tickMoved['cap0'] !== tickFirstRes['cap0']);

  // D. Stolica dla Mennicy i dla tiku z resolvera.
  M.setOwnerCapitalCityResolver(RES_MOVED);
  {
    const { cities, built } = world('capFirst');
    const ids = M.capitalCityIdByOwnerForTick(cities);
    check('D1 capitalCityIdByOwnerForTick: resolver wskazuje B (reg0), nie pierwsze miasto', ids.get(0) === 'reg0', String(ids.get(0)));
    check('D2 ownersWithMennica: Mennica w przeniesionej stolicy daje bonus owner 0',
      M.ownersWithMennica(cities, built).has(0));
    const builtOld = new Map([['cap0', ['mennica']], ['reg0', ['mury']]]);
    check('D3 ownersWithMennica: osierocona Mennica w dawnej stolicy nie daje bonusu',
      !M.ownersWithMennica(cities, builtOld).has(0));
  }
  M.setOwnerCapitalCityResolver(null);
  {
    const { cities } = world('capFirst');
    const ids = M.capitalCityIdByOwnerForTick(cities);
    check('D4 bez resolvera: stolica = pierwsze miasto ownera (heurystyka zachowana)', ids.get(0) === 'cap0' && ids.get(1) === 'cap1');
  }

  M.setOwnerCapitalCityResolver(null);
  console.log('');
  console.log('capital-resolver-economy-test: ' + passed + ' passed, ' + failed + ' failed');
} catch (e) {
  console.error('[capital-resolver-economy-test] error:', e && e.stack ? e.stack : e);
  failed++;
} finally {
  try { fs.unlinkSync(ENTRY); } catch (e) { /* ignore */ }
  try { fs.unlinkSync(BUNDLE); } catch (e) { /* ignore */ }
}
process.exit(failed === 0 ? 0 : 1);
