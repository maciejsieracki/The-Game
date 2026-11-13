'use strict';
/**
 * annex-citystate-spoils-test.cjs — R-WEB-ANNEX-CITYSTATE-SPOILS-Q1.
 *
 * Decyzja wlasciciela 2026-11-03: aneksja (wchloniecie) panstwa-miasta droga dyplomatyczna
 * (`annexCityStateToOwner`, main.ts) przenosi MAJATEK panstwa-miasta na przejmujacego tak
 * jak eliminacja przez zdobycie: surowce, Prace, Nauke, zloto skarbca, zywnosc Spichlerza
 * (do pojemnosci przejmujacego, nadwyzka ginie); komunikat pokazuje komplet.
 *
 * PRAWDZIWE: `applyAnnexCityStateSpoils` / `applyCapitalCapturePlunder` z
 * src/game/capital-capture.ts (esbuild), `buildCityCaptureReportRows` z BLOKU CZYSTEGO
 * main.ts (wyciety po markerach). Wiazanie main.ts -> rdzen sprawdzane po zrodle
 * (main.ts jest jednym domknieciem). Mutacje rdzenia musza czerwienic test.
 *
 * Usage (z gra/): node tools/annex-citystate-spoils-test.cjs
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const esbuild = require('esbuild');

const GRA = path.resolve(__dirname, '..');
const SRC = (...p) => path.resolve(GRA, 'src', ...p);
const mainSrc = fs.readFileSync(SRC('main.ts'), 'utf8');
const coreSrc = fs.readFileSync(SRC('game', 'capital-capture.ts'), 'utf8');
const stockSrc = fs.readFileSync(SRC('game', 'building-stock-cost.ts'), 'utf8');

let pass = 0;
let fail = 0;
function ok(cond, label) {
  if (cond) { pass++; console.log('  OK: ' + label); } else { fail++; console.log('  FAIL: ' + label); }
}
function eq(a, b, label) { ok(a === b, `${label} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }
function stripComments(code) {
  return code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
}
function sliceBetween(src, a, b) {
  const i = src.indexOf(a);
  if (i < 0) return null;
  const j = src.indexOf(b, i + a.length);
  return j < 0 ? null : src.slice(i, j);
}
function runTs(code, tail) {
  const js = esbuild.transformSync(code + '\n' + tail, { loader: 'ts', format: 'cjs' }).code;
  // eslint-disable-next-line no-new-func
  return new Function(js)();
}

const TMP = fs.mkdtempSync(path.join(fs.existsSync('/dev/shm') ? '/dev/shm' : os.tmpdir(), 'annex-spoils-'));
let seq = 0;
function loadCore(source) {
  const dir = path.join(TMP, 'c' + (seq++));
  fs.mkdirSync(dir, { recursive: true });
  const f = path.join(dir, 'capital-capture.ts');
  fs.writeFileSync(f, source, 'utf8');
  const out = path.join(dir, 'out.cjs');
  esbuild.buildSync({ entryPoints: [f], bundle: true, platform: 'node', format: 'cjs', outfile: out, logLevel: 'silent' });
  return require(out);
}
function tryLoadCore(source) { try { return loadCore(source); } catch (e) { return null; } }

const pureBlock = sliceBetween(mainSrc, '// R-MIASTA-ZDOBYCIE-RAPORT-TROFEA-Q1 — BLOK CZYSTY: POCZATEK',
  '// R-MIASTA-ZDOBYCIE-RAPORT-TROFEA-Q1 — BLOK CZYSTY: KONIEC');
const dStart = stockSrc.indexOf('export const STOCK_RESOURCE_LABEL');
const dEnd = stockSrc.indexOf('\n}', stockSrc.indexOf('export function stockResourceLabel'));
const stockDeps = stockSrc.slice(dStart, dEnd + 2).replace(/^export /gm, '');
const reportApi = runTs(stockDeps + '\n' + pureBlock, 'return { buildCityCaptureReportRows, captureReportOneLine };');

// --- model swiata ----------------------------------------------------------------------
const SUROWCE8 = { drewno: 11, kamien: 22, glina: 134, ruda: 40, ruda_zelaza: 5, cegla: 17, sol: 9, wegiel: 3 };
const BARB = 99;
const isBarb = o => o === BARB;
function city(id, ownerId, surowce, pop) { return { id, ownerId, q: 0, r: 0, name: id, population: pop ?? 4, surowce: surowce ? { ...surowce } : undefined }; }
function makeAccess(seed) {
  const m = o => new Map(Object.entries(o || {}).map(([k, v]) => [Number(k), v]));
  const S = { sk: m(seed.skarbiec), pr: m(seed.praca), na: m(seed.nauka), food: m(seed.food), cap: m(seed.cap),
    techy: new Map(Object.entries(seed.techy || {}).map(([k, v]) => [Number(k), new Set(v)])) };
  const acc = {
    getTreasury: o => S.sk.get(o) ?? 0, setTreasury: (o, v) => S.sk.set(o, Math.max(0, v)),
    getPracaPool: o => S.pr.get(o) ?? 0, setPracaPool: (o, v) => S.pr.set(o, Math.max(0, v)),
    getNaukaPool: o => S.na.get(o) ?? 0, setNaukaPool: (o, v) => S.na.set(o, Math.max(0, v)),
    getResearchedTechs: o => S.techy.get(o) ?? new Set(),
    addResearchedTechs: (o, ids) => { const s = S.techy.get(o) ?? new Set(); for (const i of ids) s.add(i); S.techy.set(o, s); },
    getFoodReserve: o => S.food.get(o) ?? 0, setFoodReserve: (o, v) => S.food.set(o, Math.max(0, v)),
    getFoodCapacity: o => S.cap.get(o) ?? 0,
  };
  return { acc, S };
}
function stockOf(cities, owner) {
  const t = {};
  for (const c of cities) if (c.ownerId === owner) for (const [k, v] of Object.entries(c.surowce || {})) t[k] = (t[k] || 0) + v;
  return t;
}

/** Aneksja: miasta MP przechodza na annexera (ownerId zmienione PRZED wywolaniem rdzenia, jak w main.ts). */
function scenarioAnnex(core, annexer, extra, csCitiesOverride) {
  const CS = 7;
  const cs = csCitiesOverride || [city('mp1', CS, SUROWCE8, 5)];
  const cities = [city('home', annexer, { drewno: 100 }), ...cs];
  const before = stockOf(cities, annexer);
  const { acc, S } = makeAccess({
    skarbiec: { [annexer]: 50, [CS]: 500 }, praca: { [annexer]: 10, [CS]: 300 }, nauka: { [annexer]: 5, [CS]: 900 },
    food: { [annexer]: 40, [CS]: 1200 }, cap: { [annexer]: 100000 }, techy: { [annexer]: ['a'], [CS]: ['a', 'b'] }, ...(extra || {}),
  });
  for (const c of cs) c.ownerId = annexer;
  const res = core.applyAnnexCityStateSpoils(CS, annexer, cs, acc, isBarb);
  return { cities, cs, before, after: stockOf(cities, annexer), acc, S, res, CS };
}

const core = loadCore(coreSrc);

console.log('1. Aneksja przez gracza (0): komplet majatku, MP wyzerowane');
{
  const r = scenarioAnnex(core, 0);
  ok(r.res !== null, '1a: wynik niepusty');
  eq(r.S.sk.get(0), 550, '1b: zloto 50 + 500');
  eq(r.S.sk.get(r.CS), 0, '1c: skarbiec MP 0');
  eq(r.S.pr.get(0), 310, '1d: Praca 10 + 300');
  eq(r.S.pr.get(r.CS), 0, '1e: Praca MP 0');
  eq(r.S.na.get(0), 905, '1f: Nauka 5 + 900');
  eq(r.S.na.get(r.CS), 0, '1g: Nauka MP 0');
  eq(r.S.food.get(0), 1240, '1h: zywnosc 40 + 1200');
  eq(r.S.food.get(r.CS), 0, '1i: zywnosc MP 0');
  for (const k of Object.keys(SUROWCE8)) eq((r.after[k] || 0) - (r.before[k] || 0), SUROWCE8[k], `1j: surowiec ${k} +${SUROWCE8[k]}`);
  eq(Object.keys(r.res.surowcePrzejete).length, 8, '1k: 8 surowcow na liscie');
  eq(stockOf(r.cities, r.CS).glina || 0, 0, '1l: magazyn MP wyzerowany (miasta przeszly)');
  ok(!r.S.techy.get(0).has('b'), '1m: aneksja NIE kopiuje technologii (nie jest zdobyciem)');
}

console.log('2. Aneksja przez AI (ownerId 3): to samo');
{
  const r = scenarioAnnex(core, 3);
  eq(r.S.sk.get(3), 550, '2a: zloto AI'); eq(r.S.pr.get(3), 310, '2b: Praca AI'); eq(r.S.na.get(3), 905, '2c: Nauka AI');
  eq(r.S.food.get(3), 1240, '2d: zywnosc AI'); eq((r.after.glina || 0) - (r.before.glina || 0), 134, '2e: glina AI');
  eq(r.S.sk.get(r.CS) + r.S.food.get(r.CS) + r.S.pr.get(r.CS) + r.S.na.get(r.CS), 0, '2f: MP wyzerowane');
}

console.log('3. Limit Spichlerza przejmujacego');
{
  const r = scenarioAnnex(core, 0, { cap: { 0: 1000 } }); // wolne 960 z 1200
  eq(r.S.food.get(0), 1000, '3a: przycieto do pojemnosci');
  eq(r.res.zywnoscPrzejeta, 960, '3b: przejeta 960'); eq(r.res.zywnoscUtracona, 240, '3c: utracona 240');
  eq(r.res.zywnoscOfiaryRazem, 1200, '3d: razem 1200'); eq(r.S.food.get(r.CS), 0, '3e: MP wyzerowane mimo nadwyzki');
  const full = scenarioAnnex(core, 0, { cap: { 0: 40 } });
  eq(full.S.food.get(0), 40, '3f: Spichlerz pelny -> nic nie wchodzi'); eq(full.res.zywnoscUtracona, 1200, '3g: calosc ginie');
  const unk = scenarioAnnex(core, 0, { cap: { 0: 0 } });
  eq(unk.S.food.get(0), 1240, '3h: pojemnosc nieznana (0) -> bez przyciecia');
}

console.log('4. Wiele miast MP: surowce sumowane');
{
  const r = scenarioAnnex(core, 0, null, [city('mp1', 7, { glina: 10, ruda: 5 }), city('mp2', 7, { glina: 7, sol: 2 })]);
  eq(r.res.surowcePrzejete.glina, 17, '4a: glina 10+7'); eq(r.res.surowcePrzejete.ruda, 5, '4b: ruda'); eq(r.res.surowcePrzejete.sol, 2, '4c: sol');
  eq((r.after.glina || 0) - (r.before.glina || 0), 17, '4d: stan zwyciezcy +17');
}

console.log('5. Barbarzyncy');
{
  const bsv = makeAccess({ skarbiec: { 0: 50, [BARB]: 500 } });
  const bres = core.applyAnnexCityStateSpoils(BARB, 0, [city('b1', BARB, { glina: 5 })], bsv.acc, isBarb);
  eq(bres, null, '5a: barbarzynski "MP" nie jest aneksowalny (null)'); eq(bsv.S.sk.get(0), 50, '5b: nic nie przeszlo');
  const r = scenarioAnnex(core, BARB);
  eq(r.S.sk.get(BARB) ?? 0, 50, '5c: barbarzynca NIE dostaje zlota'); eq(r.S.sk.get(r.CS), 0, '5d: MP i tak traci skarbiec');
  eq(r.S.pr.get(BARB), 10, '5e: Praca barbarzyncy bez zmian'); eq(r.S.na.get(BARB), 5, '5f: Nauka barbarzyncy bez zmian');
  eq(r.S.food.get(BARB), 40, '5g: zywnosc barbarzyncy bez zmian');
}

console.log('6. Idempotencja i brak majatku');
{
  const r = scenarioAnnex(core, 0);
  const sk = r.S.sk.get(0), food = r.S.food.get(0);
  const again = core.applyAnnexCityStateSpoils(r.CS, 0, [], r.acc, isBarb);
  eq(r.S.sk.get(0), sk, '6a: drugie wywolanie nie dubluje zlota'); eq(r.S.food.get(0), food, '6b: ... ani zywnosci');
  eq(again.skarbiecPrzejety + again.zywnoscOfiaryRazem + again.pracaPoolPrzejeta + again.naukaPrzejeta, 0, '6c: puste MP = zero');
  eq(core.applyAnnexCityStateSpoils(5, 5, [], r.acc, isBarb), null, '6d: sam na siebie = null');
}

console.log('7. Eliminacja przez zdobycie bez regresji (ten sam rdzen)');
{
  const cities = [city('city1', 0, { drewno: 100 }), city('city9', 0, SUROWCE8)];
  const { acc, S } = makeAccess({ skarbiec: { 0: 50, 2: 500 }, praca: { 0: 10, 2: 300 }, nauka: { 0: 5, 2: 900 }, food: { 0: 40, 2: 1200 }, cap: { 0: 100000 }, techy: { 0: ['a'], 2: ['a', 'b'] } });
  const o = core.applyCapitalCapturePlunder(cities[1], 2, 0, cities, acc, null);
  eq(o.event, 'eliminacja', '7a: eliminacja'); eq(S.sk.get(0), 550, '7b: zloto'); eq(S.pr.get(0), 310, '7c: Praca');
  eq(S.na.get(0), 905, '7d: Nauka'); eq(S.food.get(0), 1240, '7e: zywnosc'); ok(S.techy.get(0).has('b'), '7f: techy skopiowane (tylko eliminacja)');
  eq(Object.keys(o.surowcePrzejete).length, 8, '7g: 8 surowcow');
}

console.log('8. Komunikat (okno) zawiera komplet');
{
  const r = scenarioAnnex(core, 0);
  const s = r.res;
  const rows = reportApi.buildCityCaptureReportRows({
    kind: 'eliminacja', mocEtykieta: 'Moc', ludnosc: 5, budynki: 3, zloto: s.skarbiecPrzejety, nauka: s.naukaPrzejeta,
    technologie: 0, moc: 0, barbarzyncaZdobywca: false, surowce: s.surowcePrzejete, zywnoscPrzejeta: s.zywnoscPrzejeta,
    zywnoscUtracona: s.zywnoscUtracona, zywnoscOfiaryRazem: s.zywnoscOfiaryRazem, pracaPoolPrzejeta: s.pracaPoolPrzejeta,
  });
  const line = reportApi.captureReportOneLine(rows);
  for (const [lab, val] of [['Złoto ze skarbca', '+500'], ['Żywność ze spichlerza', '+1200'], ['Punkty nauki', '+900'], ['Pula pracy', '+300']]) {
    ok(line.includes(lab + ': ' + val), `8: "${lab}: ${val}"`);
  }
  eq(rows.filter(x => x.collapsible).length, 8, '8: 8 pozycji surowcow w raporcie');
  ok(/: \+134/.test(line), '8: glina +134 w komunikacie');
  const lim = scenarioAnnex(core, 0, { cap: { 0: 1000 } }).res;
  const rows2 = reportApi.buildCityCaptureReportRows({ kind: 'eliminacja', mocEtykieta: 'Moc', ludnosc: 5, budynki: 0, zloto: 0, nauka: 0, technologie: 0, moc: 0,
    barbarzyncaZdobywca: false, surowce: {}, zywnoscPrzejeta: lim.zywnoscPrzejeta, zywnoscUtracona: lim.zywnoscUtracona, zywnoscOfiaryRazem: lim.zywnoscOfiaryRazem, pracaPoolPrzejeta: 0 });
  ok(reportApi.captureReportOneLine(rows2).includes('przejęto 960 z 1200 (limit pojemności)'), '8: limit Spichlerza widoczny w komunikacie');
}

console.log('9. Wiazanie main.ts (po zrodle)');
{
  const fnStart = mainSrc.indexOf('function annexCityStateToOwner(');
  const fnEnd = mainSrc.indexOf('function eliminateOwner(', fnStart);
  const body = stripComments(mainSrc.slice(fnStart, fnEnd));
  ok(fnStart > 0 && body.length > 200, '9a: znaleziono annexCityStateToOwner');
  ok(/applyAnnexCityStateSpoils\(\s*csOwnerId,\s*annexerId,\s*csCities,\s*capitalCaptureResourceAccess,\s*isBarbarian/.test(body), '9b: wola rdzen z tymi samymi akcesorami co eliminacja i isBarbarian');
  ok(body.indexOf('applyAnnexCityStateSpoils(') < body.indexOf('eliminateOwner(csOwnerId)'), '9c: majatek przejety PRZED eliminateOwner (ktore kasuje skarbiec MP)');
  ok(body.indexOf('city.ownerId = annexerId') < body.indexOf('applyAnnexCityStateSpoils('), '9d: po zmianie ownerId miast');
  ok(!/runCapitalCapturePlunder|setDiploRelation|applyDiploEvent|zdobyczePowerByOwner|addResearchedTechs/.test(body), '9e: aneksja nie jest zdobyciem (brak kar/relacji/Mocy/technologii)');
  ok(/buildCityCaptureReportRows\(\{\s*kind: 'eliminacja'/.test(body) && /annexSpoils\.surowcePrzejete/.test(body), '9f: komunikat budowany z wierszy bilansu (te same co okno zdobycia)');
  ok(/recordCivElimEvent\(csOwnerId, csLabel, annexDetails\)/.test(body), '9g: komunikat niesie annexDetails');
  const callers = (stripComments(mainSrc).match(/annexCityStateToOwner\(/g) || []).length;
  eq(callers, 4, '9h: definicja + 3 wywolania (propozycja gracz/AI, AI MP, AI major) -- wszystkie przez jedna funkcje');
  ok(/if \(annexPay\.ok\) \{\s*capitalCaptureResourceAccess\.setTreasury\(\s*responderId,\s*Math\.max\(0, capitalCaptureResourceAccess\.getTreasury\(responderId\) - koszt\)/.test(stripComments(mainSrc)), '9i: cena aneksji odjeta ze skarbca MP przed przejeciem (nie wraca do platnika)');
}

console.log('10. Mutacje rdzenia musza czerwienic test');
{
  const muts = [
    ['brak zerowania skarbca ofiary', 'access.setTreasury(oldOwner, 0);\n\n  // --- Pula pracy (ECHO', '\n\n  // --- Pula pracy (ECHO'],
    ['brak transferu Pracy', 'access.setPracaPool(newOwner, access.getPracaPool(newOwner) + pracaPoolPrzejeta);', ''],
    ['brak przyciecia do pojemnosci', 'zywnoscPrzejeta = Math.min(zywnoscOfiaryRazem, room);', 'zywnoscPrzejeta = zywnoscOfiaryRazem;'],
    ['brak zerowania zywnosci ofiary', '    access.setFoodReserve(oldOwner, 0);\n  }\n\n  // --- Nauka', '  }\n\n  // --- Nauka'],
    ['surowce nie sumowane (nadpisanie)', 'surowcePrzejete[key] = (surowcePrzejete[key] ?? 0) + v;', 'surowcePrzejete[key] = v;'],
    ['brak transferu Nauki', 'access.setNaukaPool(newOwner, access.getNaukaPool(newOwner) + naukaPrzejeta);', ''],
    ['brak guardu barbarzynca-ofiara', 'if (csOwner === annexer || isBarbarianOwner(csOwner)) return null;', 'if (csOwner === annexer) return null;'],
  ];
  for (const [name, a, b] of muts) {
    if (coreSrc.indexOf(a) < 0) { ok(false, `10: mutacja "${name}" -- nie znaleziono fragmentu`); continue; }
    const m = tryLoadCore(coreSrc.replace(a, b));
    let killed = false;
    if (!m) killed = true;
    else {
      try {
        const a1 = scenarioAnnex(m, 0), a2 = scenarioAnnex(m, 0, { cap: { 0: 1000 } });
        const a3 = scenarioAnnex(m, 0, null, [city('x', 7, { glina: 10 }), city('y', 7, { glina: 7 })]);
        const bsv = makeAccess({ skarbiec: { 0: 50, [BARB]: 500 } });
        const bres = m.applyAnnexCityStateSpoils(BARB, 0, [city('b', BARB, { glina: 5 })], bsv.acc, isBarb);
        killed = !(a1.S.sk.get(7) === 0 && a1.S.pr.get(0) === 310 && a1.S.pr.get(7) === 0 && a1.S.na.get(0) === 905
          && a1.S.food.get(7) === 0 && a2.S.food.get(0) === 1000 && a3.res.surowcePrzejete.glina === 17 && bres === null);
      } catch (e) { killed = true; }
    }
    ok(killed, `10: mutacja "${name}" zczerwienia test`);
  }
}

fs.rmSync(TMP, { recursive: true, force: true });
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
