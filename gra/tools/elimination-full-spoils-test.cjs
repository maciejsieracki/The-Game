'use strict';
/**
 * elimination-full-spoils-test.cjs — R-WEB-ELIMINATION-FULL-SPOILS-Q1.
 *
 * Zgloszenie wlasciciela (2026-11-03): okno „ELIMINACJA!" po zdobyciu ostatniego miasta
 * pokazalo tylko Glina +134 / Ruda +40. Oczekiwane: przy ELIMINACJI zwyciezca przejmuje
 * CALY majatek panstwa: wszystkie surowce magazynu, Prace, Nauke, zloto ze skarbca i
 * CALA zywnosc ze Spichlerza -- a okno pokazuje komplet.
 *
 * Co jest PRAWDZIWE (nie atrapa):
 *   - `applyCapitalCapturePlunder` / `applyBarbarianAwareCapitalCapturePlunder` z
 *     src/game/capital-capture.ts, zbundlowane esbuildem i uruchomione na fake'owym
 *     City[] + OwnerResourceAccess (lustro akcesorow z main.ts);
 *   - `buildCityCaptureReportRows` z BLOKU CZYSTEGO main.ts (wyciety po markerach i
 *     uruchomiony) oraz `reportRowsHtml` z ui/cityCaptureNotice.ts (wyciety i uruchomiony);
 *   - wiazanie main.ts -> rdzen (akcesory Spichlerza, przekazanie outcome do raportu)
 *     sprawdzane po zrodle (main.ts jest jednym domknieciem, nie da sie go wykonac).
 * Mutacje: rdzen jest bundlowany ponownie ze zmutowanego zrodla (usuniete zerowanie
 * ofiary / przyciecie do limitu / transfer zywnosci / zbieranie surowcow) -- test musi
 * zczerwienic sie na KAZDEJ z nich.
 *
 * Usage (z gra/): node tools/elimination-full-spoils-test.cjs
 * Zrzuty okna PRZED/PO: env SPOILS_DUMP_DIR=<katalog> (zapisuje okno-przed/po.html).
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const esbuild = require('esbuild');

const GRA = path.resolve(__dirname, '..');
const SRC = (...p) => path.resolve(GRA, 'src', ...p);
const mainSrc = fs.readFileSync(SRC('main.ts'), 'utf8');
const coreSrc = fs.readFileSync(SRC('game', 'capital-capture.ts'), 'utf8');
const noticeSrc = fs.readFileSync(SRC('ui', 'cityCaptureNotice.ts'), 'utf8');
const stockSrc = fs.readFileSync(SRC('game', 'building-stock-cost.ts'), 'utf8');

let pass = 0;
let fail = 0;
function ok(cond, label) {
  if (cond) { pass++; console.log('  OK: ' + label); }
  else { fail++; console.log('  FAIL: ' + label); }
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

// --- rdzen: bundle z (opcjonalnie zmutowanego) zrodla -------------------------------
const TMP = fs.mkdtempSync(path.join(os.tmpdir().startsWith('/tmp') && fs.existsSync('/dev/shm') ? '/dev/shm' : os.tmpdir(), 'spoils-'));
let bundleSeq = 0;
function loadCore(source) {
  const dir = path.join(TMP, 'c' + (bundleSeq++));
  fs.mkdirSync(dir, { recursive: true });
  const f = path.join(dir, 'capital-capture.ts');
  fs.writeFileSync(f, source, 'utf8');
  const out = path.join(dir, 'out.cjs');
  esbuild.buildSync({ entryPoints: [f], bundle: true, platform: 'node', format: 'cjs', outfile: out, logLevel: 'silent' });
  return require(out);
}

// --- blok czysty (raport) + zaleznosci slownika surowcow -----------------------------
const PURE_START = '// R-MIASTA-ZDOBYCIE-RAPORT-TROFEA-Q1 — BLOK CZYSTY: POCZATEK';
const PURE_END = '// R-MIASTA-ZDOBYCIE-RAPORT-TROFEA-Q1 — BLOK CZYSTY: KONIEC';
const pureBlock = sliceBetween(mainSrc, PURE_START, PURE_END);
const dStart = stockSrc.indexOf('export const STOCK_RESOURCE_LABEL');
const dEnd = stockSrc.indexOf('\n}', stockSrc.indexOf('export function stockResourceLabel'));
const stockDeps = stockSrc.slice(dStart, dEnd + 2).replace(/^export /gm, '');
const reportApi = runTs(stockDeps + '\n' + pureBlock,
  'return { buildCityCaptureReportRows, captureReportOneLine, captureReportShortLine };');
const build = reportApi.buildCityCaptureReportRows;
const rStart = noticeSrc.indexOf('function rowHtml(');
const rEnd = noticeSrc.indexOf('\nfunction modalIcon(', rStart);
const renderRows = runTs('function esc(s: string): string { return s; }\n' + noticeSrc.slice(rStart, rEnd),
  'return reportRowsHtml;');

// --- model swiata ---------------------------------------------------------------------
const SUROWCE8 = { drewno: 11, kamien: 22, glina: 134, ruda: 40, ruda_zelaza: 5, cegla: 17, sol: 9, wegiel: 3 };
function city(id, ownerId, surowce) { return { id, ownerId, q: 0, r: 0, name: id, population: 6, surowce: surowce ? { ...surowce } : undefined }; }

/** Lustro akcesorow main.ts: skarbiec/praca/nauka/techy/zywnosc per owner + pojemnosc. */
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
/** Stan zdobywcy: magazyn panstwa = suma City.surowce po jego miastach (SUROW-CIV-01). */
function stockOf(cities, owner) {
  const t = {};
  for (const c of cities) if (c.ownerId === owner) for (const [k, v] of Object.entries(c.surowce || {})) t[k] = (t[k] || 0) + v;
  return t;
}
const WINNER = 0, LOSER = 2;

/** Eliminacja: ostatnie miasto LOSER (city9, surowce8) przechodzi na WINNER (juz po zmianie ownerId). */
function scenarioElimination(core, extra) {
  const cities = [city('city1', WINNER, { drewno: 100 }), city('city9', WINNER, SUROWCE8)]; // city9 juz zdobyte
  const before = stockOf([cities[0]], WINNER); // stan zdobywcy PRZED przejeciem city9
  const { acc, S } = makeAccess({
    skarbiec: { 0: 50, 2: 500 }, praca: { 0: 10, 2: 300 }, nauka: { 0: 5, 2: 900 }, food: { 0: 40, 2: 1200 },
    cap: { 0: 100000 }, techy: { 0: ['a'], 2: ['a', 'b'] }, ...(extra || {}),
  });
  const outcome = core.applyCapitalCapturePlunder(cities[1], LOSER, WINNER, cities, acc, null);
  return { cities, before, after: stockOf(cities, WINNER), acc, S, outcome };
}

const core = loadCore(coreSrc);

// ===========================================================================
console.log('1. Eliminacja: zwyciezca przejmuje 100% majatku, ofiara wyzerowana');
{
  const r = scenarioElimination(core);
  const o = r.outcome;
  ok(o && o.eliminacja === true && o.event === 'eliminacja', '1a: zdarzenie to eliminacja');
  eq(r.S.sk.get(WINNER), 550, '1b: skarbiec zdobywcy 50 + 500');
  eq(r.S.sk.get(LOSER), 0, '1c: skarbiec ofiary 0');
  eq(r.S.pr.get(WINNER), 310, '1d: Praca zdobywcy 10 + 300');
  eq(r.S.pr.get(LOSER), 0, '1e: Praca ofiary 0');
  eq(r.S.na.get(WINNER), 905, '1f: Nauka zdobywcy 5 + 900');
  eq(r.S.na.get(LOSER), 0, '1g: Nauka ofiary 0');
  eq(r.S.food.get(WINNER), 1240, '1h: Spichlerz zdobywcy 40 + 1200');
  eq(r.S.food.get(LOSER), 0, '1i: Spichlerz ofiary 0');
  eq(o.zywnoscPrzejeta, 1200, '1j: outcome.zywnoscPrzejeta 1200');
  eq(o.zywnoscUtracona, 0, '1k: nic nie ginie przy duzym limicie');
  eq(o.zywnoscOfiaryRazem, 1200, '1l: outcome.zywnoscOfiaryRazem');
  eq(Object.keys(o.surowcePrzejete).length, 8, '1m: outcome niesie WSZYSTKIE 8 surowcow');
  for (const [k, v] of Object.entries(SUROWCE8)) eq(o.surowcePrzejete[k], v, `1n: surowiec ${k}`);
  for (const [k, v] of Object.entries(SUROWCE8)) {
    eq(r.after[k] - (r.before[k] || 0), v, `1o: magazyn zdobywcy +${k}`);
  }
  eq(Object.keys(stockOf(r.cities, LOSER)).length, 0, '1p: magazyn ofiary pusty (zero miast)');
}

// ===========================================================================
console.log('2. Okno „Bilans zdobycia": komplet pozycji');
let rowsAfter;
{
  const r = scenarioElimination(core);
  const o = r.outcome;
  rowsAfter = build({
    kind: 'eliminacja', mocEtykieta: 'Moc', ludnosc: 3, budynki: 3,
    zloto: o.skarbiecPrzejety, nauka: o.naukaPrzejeta, technologie: o.techSkopiowane.length, moc: 2866,
    barbarzyncaZdobywca: false, surowce: o.surowcePrzejete, pracaPoolPrzejeta: o.pracaPoolPrzejeta,
    zywnoscPrzejeta: o.zywnoscPrzejeta, zywnoscUtracona: o.zywnoscUtracona, zywnoscOfiaryRazem: o.zywnoscOfiaryRazem,
  });
  const row = l => rowsAfter.find(x => x.label === l);
  ok(row('Ludność') && row('Budynki') && row('Punkty nauki') && row('Moc'), '2a: pozycje glowne Ludnosc/Budynki/Punkty nauki/Moc');
  eq(row('Punkty nauki')?.value, '+900', '2b: Punkty nauki +900');
  eq(row('Złoto ze skarbca')?.value, '+500', '2c: Zloto ze skarbca +500');
  eq(row('Żywność ze spichlerza')?.value, '+1200', '2d: Zywnosc ze spichlerza +1200');
  ok(row('Pula pracy') && row('Pula pracy').value.startsWith('+300'), '2e: Pula pracy +300');
  const collapsible = rowsAfter.filter(x => x.collapsible);
  eq(collapsible.length, 8, '2f: 8 surowcow w rozwijanej liscie');
  eq(row('Glina')?.value, '+134', '2g: Glina +134');
  ok(rowsAfter.every(x => !/^\+?0$/.test(x.value)), '2h: zadnej pozycji zerowej');
  ok(!rowsAfter.some(x => x.label === 'Łup' && x.value === 'brak'), '2i: brak falszywego „Lup: brak"');
  const html = renderRows(rowsAfter, 'Bilans zdobycia');
  for (const l of ['Ludność', 'Budynki', 'Punkty nauki', 'Moc', 'Pula pracy', 'Złoto ze skarbca', 'Żywność ze spichlerza',
    'Drewno', 'Kamień', 'Glina', 'Ruda', 'Cegła', 'Sól', 'Węgiel']) {
    ok(html.includes('>' + l + '<'), `2j: HTML okna zawiera „${l}"`);
  }
  ok(/Pokaż wszystkie surowce \(8\)/.test(html), '2k: rozwijana sekcja „Pokaz wszystkie surowce (8)"');
  // PRZED: ten sam przypadek wg starej logiki (surowce tylko ostatniego miasta, bez zywnosci).
  const before = build({
    kind: 'eliminacja', mocEtykieta: 'Moc', ludnosc: 3, budynki: 3, zloto: 0, nauka: 188, technologie: 0, moc: 2866,
    barbarzyncaZdobywca: false, surowce: { glina: 134, ruda: 40 }, pracaPoolPrzejeta: 15,
  });
  if (process.env.SPOILS_DUMP_DIR) {
    const d = process.env.SPOILS_DUMP_DIR;
    fs.mkdirSync(d, { recursive: true });
    const wrap = (t, h) => `<!doctype html><meta charset="utf-8"><title>${t}</title><body style="font:13px sans-serif;background:#0e1424;color:#e8ebf0;max-width:420px;margin:16px">` +
      `<h3>ELIMINACJA! ${t}</h3><style>.civ-ccn-row{display:flex;justify-content:space-between}</style>${h}</body>`;
    fs.writeFileSync(path.join(d, 'okno-przed.html'), wrap('PRZED (zrzut zgloszenia: 2 surowce, bez zywnosci/skarbca)', renderRows(before, 'Bilans zdobycia')));
    fs.writeFileSync(path.join(d, 'okno-po.html'), wrap('PO (pelny majatek)', html));
  }
  ok(!before.some(x => x.label === 'Żywność ze spichlerza'), '2l: PRZED okno nie mialo pozycji Spichlerza (potwierdzenie luki)');
}

// ===========================================================================
console.log('3. Zwykle zdobycie / stolica z przezywajaca cywilizacja: bez zmian');
{
  const cities = [city('city1', WINNER, { drewno: 1 }), city('city5', WINNER, { glina: 7 }), city('city6', LOSER, { ruda: 3 })];
  const { acc, S } = makeAccess({ skarbiec: { 2: 80 }, praca: { 2: 30 }, nauka: { 2: 40 }, food: { 0: 10, 2: 700 }, cap: { 0: 99999 } });
  // zdobyte city5 (najstarsze miasto LOSER), a LOSER ma jeszcze city6 -> Zdarzenie 1
  const o = core.applyCapitalCapturePlunder(cities[1], LOSER, WINNER, cities, acc, null);
  ok(o && o.event === 'przejecie_stolicy' && !o.eliminacja, '3a: Zdarzenie 1 (nie eliminacja)');
  eq(S.food.get(LOSER), 700, '3b: Spichlerz ofiary NIETKNIETY (cywilizacja przezywa)');
  eq(S.food.get(WINNER), 10, '3c: Spichlerz zdobywcy bez zmian');
  eq(o.zywnoscPrzejeta, 0, '3d: zywnoscPrzejeta 0');
  eq(Object.keys(o.surowcePrzejete).length, 0, '3e: lista surowcow pusta (surowce jadą z miastem jak dotad)');
  eq(S.sk.get(WINNER), 80, '3f: skarbiec stolicy jak dotad (Zdarzenie 1)');
  eq(S.pr.get(WINNER) ?? 0, 0, '3g: Praca przepada jak dotad (nie do zwyciezcy)');
  eq(S.na.get(WINNER) ?? 0, 0, '3h: Nauka bez zmian jak dotad');
  // miasto niestoleczne -> null, zero transferow
  const { acc: a2, S: S2 } = makeAccess({ food: { 2: 500 } });
  const c2 = [city('city2', WINNER), city('city9', LOSER), city('city1', LOSER)];
  eq(core.applyCapitalCapturePlunder(c2[0], LOSER, WINNER, c2, a2, null), null, '3i: miasto niestoleczne -> null');
  eq(S2.food.get(LOSER), 500, '3j: Spichlerz ofiary nietkniety przy niestolecznym');
  // wiersze zwyklego zdobycia: zadnej pozycji Spichlerza
  const rows = build({ kind: 'stolica', mocEtykieta: 'Moc', ludnosc: 4, budynki: 2, zloto: 80, nauka: 0, technologie: 0, moc: 0,
    barbarzyncaZdobywca: false, surowce: { glina: 7 }, pracaPoolPrzejeta: 0 });
  ok(!rows.some(x => x.label === 'Żywność ze spichlerza'), '3k: stolica bez eliminacji nie pokazuje Spichlerza');
}

// ===========================================================================
console.log('4. Limit pojemnosci Spichlerza zdobywcy');
{
  const r = scenarioElimination(core, { cap: { 0: 500 } }); // zdobywca ma 40, limit 500 -> miejsce 460
  eq(r.S.food.get(WINNER), 500, '4a: Spichlerz zdobywcy przyciety do limitu 500');
  eq(r.outcome.zywnoscPrzejeta, 460, '4b: przejeto 460');
  eq(r.outcome.zywnoscUtracona, 740, '4c: nadwyzka 740 ginie');
  eq(r.outcome.zywnoscOfiaryRazem, 1200, '4d: ofiara miala 1200');
  eq(r.S.food.get(LOSER), 0, '4e: ofiara wyzerowana mimo limitu');
  const rows = build({ kind: 'eliminacja', mocEtykieta: 'Moc', ludnosc: 3, budynki: 3, zloto: 0, nauka: 0, technologie: 0, moc: 0,
    barbarzyncaZdobywca: false, surowce: {}, pracaPoolPrzejeta: 0,
    zywnoscPrzejeta: 460, zywnoscUtracona: 740, zywnoscOfiaryRazem: 1200 });
  const f = rows.find(x => x.label === 'Żywność ze spichlerza');
  ok(f && f.value.includes('przejęto 460 z 1200 (limit pojemności)'), '4f: okno: „przejeto 460 z 1200 (limit pojemnosci)"');
  const full = scenarioElimination(core, { cap: { 0: 10 } }); // zdobywca 40 > limit 10 -> miejsca 0
  eq(full.S.food.get(WINNER), 40, '4g: pelny spichlerz zdobywcy nie rosnie');
  eq(full.outcome.zywnoscPrzejeta, 0, '4h: przejeto 0');
  eq(full.outcome.zywnoscUtracona, 1200, '4i: cale 1200 ginie');
  const none = scenarioElimination(core, { cap: { 0: 0 } }); // 0 = limit nieznany
  eq(none.S.food.get(WINNER), 1240, '4j: nieznany limit (0) -> bez przyciecia (ZALOZENIE: tick przytnie)');
}

// ===========================================================================
console.log('5. AI jako zwyciezca, AI jako ofiara, hot-seat (drugi czlowiek), barbarzyncy');
{
  // AI (3) eliminuje AI (2)
  const cities = [city('city9', 3, SUROWCE8)];
  const { acc, S } = makeAccess({ skarbiec: { 2: 70 }, praca: { 2: 5 }, nauka: { 2: 9 }, food: { 2: 300, 3: 10 }, cap: { 3: 1e6 } });
  const o = core.applyCapitalCapturePlunder(cities[0], 2, 3, cities, acc, null);
  eq(S.food.get(3), 310, '5a: AI przejmuje Spichlerz AI tak samo');
  eq(S.food.get(2), 0, '5b: AI-ofiara wyzerowana');
  eq(Object.keys(o.surowcePrzejete).length, 8, '5c: AI: komplet surowcow w outcome');
  // gracz (fotel 1, hot-seat) jako ofiara AI
  const c2 = [city('city9', 3, { glina: 4 })];
  const m = makeAccess({ food: { 1: 900, 3: 0 }, cap: { 3: 1e6 } });
  core.applyCapitalCapturePlunder(c2[0], 1, 3, c2, m.acc, null);
  eq(m.S.food.get(3), 900, '5d: ofiara-gracz (fotel 1) traci Spichlerz na rzecz AI');
  eq(m.S.food.get(1), 0, '5e: fotel 1 wyzerowany');
  // barbarzyncy zdobywcami: ofiara traci, barbarzyncy nic nie dziedzicza
  const BARB = 99;
  const isBarb = o => o === BARB;
  const c3 = [city('city9', BARB, { glina: 4 })];
  const b = makeAccess({ food: { 2: 600 }, skarbiec: { 2: 10 } });
  const ob = core.applyBarbarianAwareCapitalCapturePlunder(c3[0], 2, BARB, c3, b.acc, null, isBarb);
  eq(b.S.food.get(2), 0, '5f: barbarzyncy: ofiara traci Spichlerz');
  eq(b.S.food.get(BARB) ?? 0, 0, '5g: barbarzyncy NIE dziedzicza zywnosci');
  ok(ob && ob.eliminacja, '5h: eliminacja nadal nastepuje');
  const brows = build({ kind: 'eliminacja', mocEtykieta: 'Moc', ludnosc: 3, budynki: 1, zloto: 10, nauka: 0, technologie: 0, moc: 0,
    barbarzyncaZdobywca: true, surowce: {}, pracaPoolPrzejeta: 0, zywnoscPrzejeta: 600, zywnoscUtracona: 0, zywnoscOfiaryRazem: 600 });
  ok(!brows.some(x => x.label === 'Żywność ze spichlerza'), '5i: okno barbarzyncow nie pokazuje „+zywnosc" (przepadla)');
  // barbarzynca-ofiara: null (jak dotad)
  const c4 = [city('city9', 0, {})];
  const nb = makeAccess({ food: { [BARB]: 50 } });
  eq(core.applyBarbarianAwareCapitalCapturePlunder(c4[0], BARB, 0, c4, nb.acc, null, isBarb), null, '5j: barbarzynca-ofiara -> null, nic nie przeniesione');
  eq(nb.S.food.get(BARB), 50, '5k: stan barbarzyncow nietkniety');
}

// ===========================================================================
console.log('6. Idempotencja: powtorne wywolanie nie podwaja lupu');
{
  const r = scenarioElimination(core);
  const second = core.applyCapitalCapturePlunder(r.cities[1], LOSER, WINNER, r.cities, r.acc, null);
  eq(r.S.food.get(WINNER), 1240, '6a: zywnosc zdobywcy nie wzrosla po drugim wywolaniu');
  eq(r.S.sk.get(WINNER), 550, '6b: skarbiec nie wzrosl');
  eq(r.S.pr.get(WINNER), 310, '6c: Praca nie wzrosla');
  eq(r.S.na.get(WINNER), 905, '6d: Nauka nie wzrosla');
  eq(second.zywnoscPrzejeta, 0, '6e: drugie przejecie zywnosci = 0 (ofiara wyzerowana)');
  eq(second.skarbiecPrzejety + second.naukaPrzejeta + second.pracaPoolPrzejeta, 0, '6f: drugi lup finansowy = 0');
  // zapis/wczytanie: stan ofiary 0 jest tym, co trafia do zapisu -> wczytanie nie ma co przejac
  eq(r.acc.getFoodReserve(LOSER) + r.acc.getTreasury(LOSER) + r.acc.getPracaPool(LOSER) + r.acc.getNaukaPool(LOSER), 0, '6g: stan ofiary po przejeciu = 0');
}

// ===========================================================================
console.log('7. Wiazanie main.ts -> rdzen (po zrodle, bez komentarzy)');
{
  const m = stripComments(mainSrc);
  const accIdx = m.indexOf('const capitalCaptureResourceAccess: OwnerResourceAccess = {');
  const accBody = m.slice(accIdx, m.indexOf('};', accIdx));
  ok(accIdx > 0 && /getFoodReserve:/.test(accBody) && /setFoodReserve:/.test(accBody) && /getFoodCapacity:\s*\(oid: number\) => getEmpireFoodMaxCap\(oid\)/.test(accBody),
    '7a: akcesory Spichlerza podpiete pod empireFoodStates + getEmpireFoodMaxCap');
  ok(/empireFoodStates\.get\(oid\)/.test(accBody) && /empireFoodStates\.set\(oid, st\)/.test(accBody),
    '7b: Spichlerz dla gracza i AI to ten sam stan empireFoodStates (owner-agnostycznie)');
  const fnIdx = m.indexOf('function runCapitalCapturePlunder(');
  const fn = m.slice(fnIdx, m.indexOf('\n    function ', fnIdx + 20) > 0 ? fnIdx + 20000 : fnIdx + 20000);
  const elimIdx = fn.indexOf("kind: 'eliminacja'");
  const elim = fn.slice(elimIdx, elimIdx + 1500);
  ok(/surowce:\s*outcome\.surowcePrzejete/.test(elim), '7c: raport eliminacji bierze surowce z outcome.surowcePrzejete (nie tylko city.surowce)');
  ok(/zywnoscPrzejeta:\s*outcome\.zywnoscPrzejeta/.test(elim) && /zywnoscUtracona:\s*outcome\.zywnoscUtracona/.test(elim)
    && /zywnoscOfiaryRazem:\s*outcome\.zywnoscOfiaryRazem/.test(elim), '7d: raport eliminacji dostaje zywnosc z outcome');
  const stolicaIdx = fn.indexOf("kind: 'stolica'");
  ok(/surowce:\s*city\.surowce/.test(fn.slice(stolicaIdx, stolicaIdx + 700)) && !/zywnosc/.test(fn.slice(stolicaIdx, stolicaIdx + 700)),
    '7e: stolica bez eliminacji: surowce jak dotad, zero zywnosci');
  ok(/pracaPoolPrzejeta:\s*Math\.floor\(outcome\.pracaPoolPrzejeta\)/.test(elim), '7f: Praca nadal z outcome');
  ok(!/eliminateOwner\(/.test(accBody), '7g: reguly eliminacji nie zmienione w akcesorach');
}

// ===========================================================================
console.log('8. Mutacje rdzenia musza czerwienic test');
function surviving(mut) {
  try {
    const c = loadCore(mut);
    const r = scenarioElimination(c);
    const o = r.outcome;
    const good = r.S.food.get(WINNER) === 1240 && r.S.food.get(LOSER) === 0 && o.zywnoscPrzejeta === 1200
      && Object.keys(o.surowcePrzejete).length === 8;
    const lim = scenarioElimination(c, { cap: { 0: 500 } });
    const goodLim = lim.S.food.get(WINNER) === 500 && lim.outcome.zywnoscUtracona === 740;
    const again = c.applyCapitalCapturePlunder(r.cities[1], LOSER, WINNER, r.cities, r.acc, null);
    const idem = r.S.food.get(WINNER) === 1240 && again.zywnoscPrzejeta === 0;
    return good && goodLim && idem;
  } catch { return false; }
}
function mutate(from, to, label) {
  ok(coreSrc.includes(from), `8: mutacja „${label}" ma punkt zaczepienia`);
  ok(!surviving(coreSrc.replace(from, to)), `8: mutacja „${label}" CZERWIENI test`);
}
ok(surviving(coreSrc), '8-0: niezmutowany rdzen przechodzi (kontrola)');
mutate('access.setFoodReserve(oldOwner, 0);', '', 'ofiara nie jest zerowana');
mutate('if (zywnoscPrzejeta > 0) access.setFoodReserve(newOwner, winnerFood + zywnoscPrzejeta);', '', 'zywnosc nie trafia do zdobywcy');
mutate('zywnoscPrzejeta = Math.min(zywnoscOfiaryRazem, room);', 'zywnoscPrzejeta = zywnoscOfiaryRazem;', 'brak przyciecia do limitu');
mutate('if (v > 0) surowcePrzejete[key] = v;', '', 'surowce nie sa zbierane');
mutate('if (access.getFoodReserve && access.setFoodReserve) {', 'if (false) {', 'zywnosc w ogole pominieta');
mutate('const winnerFood = access.getFoodReserve(newOwner);', 'const winnerFood = 0;', 'zywnosc nadpisuje zapas zdobywcy');

fs.rmSync(TMP, { recursive: true, force: true });
console.log(`\nPODSUMOWANIE: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
