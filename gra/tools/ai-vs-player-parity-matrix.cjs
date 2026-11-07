'use strict';
/**
 * ai-vs-player-parity-matrix.cjs -- R-WEB-AI-VS-PLAYER-ECONOMY-AUDIT-Q1 (runda 3), ZADANIE GLOWNE (A-D).
 * Macierz parytetu GRACZ (ownerId 0) vs AI (ownerId 1) x 15 cywilizacji x epoki, liczona REALNYMI funkcjami gry
 * (bundle esbuild poza repo, tylko odczyt, zero zmian w gra/src i gra/data).
 *
 *   node tools/ai-vs-player-parity-matrix.cjs --out <katalog> --esbuild <sciezka do modulu esbuild> [--nodepaths <node_modules>]
 *
 * Wyjscie (w --out):
 *   results-koszty-budynkow.csv   A) koszt Pracy / surowcow / zlota / czas budowy: budynek x poziom x trudnosc x civ x owner
 *   results-koszty-ulepszen.csv   B) ulepszenia terenu: koszt Pracy x epoka x civ x owner (+ dostepnosc civ)
 *   results-koszty-jednostek.csv  C) jednostki: koszt zlota / MP / surowce / utrzymanie x civ x owner x trudnosc
 *   results-przychody.csv         D) dwa identyczne miasta (owner 0 vs 1): strumienie brutto/netto per budynek x civ x epoka
 *   results-parity-summary.csv    zbiorcze liczniki rozbieznosci owner0 vs owner1 (wlasciwy wynik macierzy)
 *   coverage.json                 pokrycie: ile kombinacji sprawdzono / pominieto i dlaczego
 */
const fs = require('fs');
const path = require('path');

function arg(name, def) {
  const i = process.argv.indexOf('--' + name);
  return i >= 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : def;
}
const GRA = path.resolve(__dirname, '..');
const OUT = path.resolve(arg('out', path.join(GRA, '..', 'dyspozycje/autobot/runs/R-WEB-AI-VS-PLAYER-ECONOMY-AUDIT-Q1')));
const esbuild = (() => {
  const cands = [arg('esbuild', ''), path.join(GRA, 'node_modules', 'esbuild')].filter(Boolean);
  for (const c of cands) { try { return require(c); } catch (e) { /* next */ } }
  console.error('esbuild not found; pass --esbuild <path>'); process.exit(2);
})();
fs.mkdirSync(OUT, { recursive: true });
const ENTRY = path.join(OUT, '.parity-entry.ts');
const BUNDLE = path.join(OUT, '.parity-bundle.cjs');
const rel = (p) => path.relative(OUT, path.join(GRA, p)).split(path.sep).join('/');
fs.writeFileSync(ENTRY, `
export { advanceCityEconomy, sumEconomyForOwner } from '${rel('src/game/turn-economy')}';
export { generateMap } from '${rel('src/map/generator')}';
export { foundCityAt, canFoundCity } from '${rel('src/game/cities')}';
export { buildingProductionItem, unitProductionItem, itemCost, buildingGoldPurchaseCost, buildingWorkCost, unitMoneyCost, availableProduction,
  civProductionCostBonusyForCivKey, buildingWorkPerTurn, epochNumber, unitNacjaForCivKey, unitPurchaseCost } from '${rel('src/game/production')}';
export { civMatrixBonusyForCivKey } from '${rel('src/game/civ-bonuses')}';
export { civMatrixParam, loadCivMatrix } from '${rel('src/game/civ-matrix')}';
export { buildingStockCost, unitStockCost } from '${rel('src/game/building-stock-cost')}';
export { getCostMultiplierForOwner } from '${rel('src/game/difficulty-cost')}';
export { unitManpowerCostForType, cityManpowerMax, manpowerRegenGain, civManpowerMatrixMults } from '${rel('src/game/manpower')}';
export { scaleTerrainImprovementWorkCost, isImprovementAllowedForCiv, terrainImprovementEraMultiplier, IMPROVEMENT_KEYS } from '${rel('src/game/terrain-improvements')}';
`, 'utf8');
esbuild.buildSync({
  entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  loader: { '.ts': 'ts', '.json': 'json' }, nodePaths: arg('nodepaths', '') ? [arg('nodepaths')] : [], outfile: BUNDLE, absWorkingDir: GRA, logLevel: 'silent',
});
const M = require(BUNDLE);
const J = (f) => JSON.parse(fs.readFileSync(path.join(GRA, 'data', f), 'utf8'));
const data = {
  civs: J('civs.json'), econParams: J('econ-params.json'), societyParams: J('society-params.json'),
  buildings: J('buildings.json'), units: J('units.json'), tech: J('tech.json'), aiParams: J('ai-params.json'),
};
const IMPR = J('terrain-improvements.json');
const ALL_TECHS = new Set((data.tech.technologie || []).map((t) => t.Technologia));
// Klucz civ jak w main.ts civKeyForOwnerId: civs.json.ikonaId -> civ-matrix ikonaId. Wszystkie 15 rozwiazuja sie (sprawdzone ponizej).
const CIV_KEYS = data.civs.cywilizacje.map((c) => c.ikonaId);
const matrixRows = M.loadCivMatrix().cywilizacje;
function resolveCivKey(ikona) {
  const k = ikona.toLowerCase();
  const row = matrixRows.find((c) => [c.ikonaId, c.typCywilizacji, c.Cywilizacja].some((v) => v.trim().toLowerCase() === k));
  return row ? row.ikonaId : '';
}
const CIVS = CIV_KEYS.map((ik) => ({ ikona: ik, key: resolveCivKey(ik), nazwa: data.civs.cywilizacje.find((c) => c.ikonaId === ik).Cywilizacja }));
const unresolved = CIVS.filter((c) => !c.key);
const OWNERS = [0, 1];
const DIFFS = ['easy', 'normal', 'hard'];
const civBonusy = (key) => (key ? [...M.civMatrixBonusyForCivKey(key), ...M.civProductionCostBonusyForCivKey(key)] : []);
const pct = (base, v) => (base === 0 ? (v === 0 ? 0 : 'n/d') : Math.round(((v - base) / Math.abs(base)) * 10000) / 100);
const q = (c) => { const s = String(c); return /[",\n;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
const writeCsv = (name, rows) => fs.writeFileSync(path.join(OUT, name), rows.map((r) => r.map(q).join(',')).join('\n') + '\n', 'utf8');
const cover = { civs: CIVS.length, civsNierozwiazane: unresolved.map((c) => c.ikona), sekcje: {} };
const summary = [['sekcja', 'opis', 'sprawdzone_kombinacje', 'rozne_owner0_vs_owner1', 'uwagi']];

// ---------------- A) KOSZTY BUDYNKOW ----------------
{
  const rows = [['budynek', 'epoka', 'poziom', 'trudnosc', 'civ', 'owner', 'koszt_praca', 'koszt_surowce', 'koszt_zloto_zakup', 'czas_tur_przy_Praca20', 'prod_szybkosc_proc', 'roznica_vs_gracz_%', 'roznica_vs_grecy_%']];
  let checked = 0, differ = 0; const diffList = [];
  const ref = new Map();
  for (const b of data.buildings) {
    const maxLv = Math.min(Math.max(1, b.maksPoziom || 1), 3);
    for (let lv = 1; lv <= maxLv; lv++) for (const diff of DIFFS) for (const civ of CIVS) {
      const speed = civ.key ? M.civMatrixParam(civ.key, 'prod_szybkosc_budynku_proc') : 0;
      const vals = {};
      for (const owner of OWNERS) {
        const it = M.buildingProductionItem(b.id, data, lv, civBonusy(civ.key), 'niski', owner, diff);
        const stock = M.buildingStockCost(b);
        vals[owner] = { it, stock };
      }
      for (const owner of OWNERS) {
        const { it, stock } = vals[owner];
        const gold = M.buildingGoldPurchaseCost(it.koszt);
        const eta = Math.ceil(it.koszt / M.buildingWorkPerTurn(20, speed));
        const k0 = vals[0].it.koszt;
        const kg = ref.get(`${b.id}|${lv}|${diff}|${owner}`);
        if (civ.ikona === 'grecy') ref.set(`${b.id}|${lv}|${diff}|${owner}`, it.koszt);
        rows.push([b.id, b.epokaWejscia, lv, diff, civ.ikona, owner, it.koszt, JSON.stringify(stock), gold, eta, speed, pct(k0, it.koszt), kg === undefined ? '' : pct(kg, it.koszt)]);
      }
      checked++;
      const same = vals[0].it.koszt === vals[1].it.koszt && JSON.stringify(vals[0].stock) === JSON.stringify(vals[1].stock);
      if (!same) { differ++; if (diffList.length < 40) diffList.push(`${b.id} lv${lv} ${diff} ${civ.ikona}: ${vals[0].it.koszt} vs ${vals[1].it.koszt}`); }
    }
  }
  writeCsv('results-koszty-budynkow.csv', rows);
  // rozbicie po trudnosci
  const byDiff = {};
  for (const r of rows.slice(1)) { if (r[5] === 1 && r[11] !== 0) { byDiff[r[3]] = (byDiff[r[3]] || 0) + 1; } }
  summary.push(['A_koszty_budynkow', 'koszt Pracy+surowce budynku, owner0 vs owner1 (wszystkie trudnosci)', checked, differ, JSON.stringify(byDiff) + ' (wiersze z roznica, wg trudnosci); normal=0 oznacza parytet na Normalnym']);
  const normalDiff = rows.slice(1).filter((r) => r[3] === 'normal' && r[5] === 1 && r[11] !== 0).length;
  summary.push(['A_koszty_budynkow', 'JAK WYZEJ, ale tylko poziom trudnosci NORMAL', rows.slice(1).filter((r) => r[3] === 'normal' && r[5] === 1).length, normalDiff, 'wynik glowny audytu (poziom Normalny)']);
  // krzyzowo civ: ile par (budynek,poziom) ma rozny koszt miedzy cywilizacjami (normal, owner 0)
  const perCiv = new Map();
  for (const r of rows.slice(1)) if (r[3] === 'normal' && r[5] === 0) {
    const k = r[0] + '|' + r[2]; if (!perCiv.has(k)) perCiv.set(k, new Map()); perCiv.get(k).set(r[4], r[6]);
  }
  let civDiffers = 0; const civDiffExamples = [];
  for (const [k, m] of perCiv) { const s = new Set(m.values()); if (s.size > 1) { civDiffers++; if (civDiffExamples.length < 8) civDiffExamples.push(k + ':' + [...s].join('/')); } }
  const allCivNames = (pred) => CIVS.filter((c) => pred(c)).map((c) => c.ikona).join(',');
  summary.push(['A_koszty_budynkow', 'ROZNICA MIEDZY CYWILIZACJAMI (normal, owner0): pary (budynek,poziom) o roznym koszcie Pracy', perCiv.size, civDiffers,
    'prod_koszt_budynku_proc=0.2 dla: ' + allCivNames((c) => M.civMatrixParam(c.key, 'prod_koszt_budynku_proc') !== 0) + '; przyklady ' + civDiffExamples.join(' ')]);
  cover.sekcje.A = { budynkow: data.buildings.length, civ: CIVS.length, owner: 2, trudnosci: 3, wierszy: rows.length - 1, kombinacjeDoPorownania: checked, przyklady: diffList.slice(0, 5) };
}

// ---------------- A') availableProduction: REALNA sciezka UI/AI, owner 0 vs 1 ----------------
{
  let checked = 0, differ = 0; const ex = [];
  const pd = { buildings: data.buildings, units: data.units };
  for (const civ of CIVS) for (const era of [1, 2, 3, 4]) for (const pace of ['niski', 'normalny', 'wysoki']) for (const cap of [true, false]) {
    const res = {};
    for (const owner of OWNERS) {
      const ctx = {
        epoch: era, builtBuildingIds: [], productionQueue: [], buildingLevel: 1, civBonusy: civBonusy(civ.key), civKey: civ.key,
        civUnitNacja: M.unitNacjaForCivKey(civ.key), buildingCostPace: pace, kosztJednostekPace: pace, ownerId: owner, difficulty: 'normal',
        showResourceGatedBuildings: true, showStockGatedUnits: true, cityHasCoastOrRiver: true, cityHasRiver: true, isCapital: cap,
        empireResourceStock: { braz: 99, zelazo: 99, drewno: 99 }, aliveUnitTypeNames: new Set(),
      };
      res[owner] = M.availableProduction({}, pd, [...ALL_TECHS], ctx);
    }
    checked++;
    const a = JSON.stringify(res[0].map((x) => [x.kind, x.id, x.koszt])), b = JSON.stringify(res[1].map((x) => [x.kind, x.id, x.koszt]));
    if (a !== b) { differ++; if (ex.length < 5) ex.push(`${civ.ikona} e${era} ${pace}`); }
  }
  summary.push(['A_availableProduction', 'pelna lista produkcji (budynki+jednostki) owner0 vs owner1: id i koszt, civ x epoka 1-4 x tempo x stolica/region', checked, differ, 'ex: ' + ex.join(';')]);
  cover.sekcje.Aprime = { kombinacje: checked };
}

// ---------------- C) KOSZTY JEDNOSTEK + UTRZYMANIE ----------------
// utrzymanie: jedna jednostka w jednym miescie, tick ekonomii (realny kod upkeep), per owner/civ.
const map = M.generateMap(40, 40, 7777, 'kontynenty');
function pickHex() {
  const list = [];
  for (const h of Object.values(map.hexes)) { const c = { q: h.coords.q, r: h.coords.r }; if (M.canFoundCity(c.q, c.r, [], map).ok) list.push(c); }
  return list[Math.floor(list.length / 2)];
}
const HEX = pickHex();
function tick(ownerId, civ, era, built, units, difficulty = 'normal', pop = 8) {
  const cs = [];
  const city = M.foundCityAt(HEX.q, HEX.r, ownerId, cs, map, 'T' + ownerId);
  city.population = pop;
  cs.push(city);
  const civMap = new Map([[ownerId, civ.key]]);
  const econ = M.advanceCityEconomy(
    cs, map, data, difficulty, units.map((t) => ({ ownerId, typeId: t, camping: false })), new Map(), new Map([[city.id, built]]), era,
    ALL_TECHS, civMap, new Map(), () => era, () => ALL_TECHS, 'wysoki', new Map(), new Map(), new Map(), new Map(), () => true,
    undefined, undefined, new Map(), undefined, new Map(),
  );
  const tk = econ.perCity.find((t) => t.ownerId === ownerId) || econ.perCity[0];
  if (!tk) throw new Error('brak ticku miasta: owner=' + ownerId + ' era=' + era + ' built=' + built.join(',') + ' perCity=' + econ.perCity.length + ' cs=' + cs.length);
  const up = econ.upkeepByOwner.get(ownerId) || {};
  return { tk, up, econ, resUp: econ.resourceUpkeepByOwner.get(ownerId) || {}, sum: M.sumEconomyForOwner(econ, ownerId) };
}
{
  const rows = [['jednostka', 'epoka', 'nacja_jednostki', 'civ', 'owner', 'trudnosc', 'koszt_zloto', 'koszt_MP', 'koszt_surowce', 'utrzymanie_zloto_tura', 'utrzymanie_surowce_tura', 'roznica_koszt_vs_gracz_%', 'roznica_utrzymanie_vs_gracz_%']];
  let checked = 0, differ = 0, differUp = 0; const ex = [];
  let upkeepTicks = 0;
  const upCache = new Map();
  for (const u of data.units) {
    const era = M.epochNumber(u.Epoka);
    for (const civ of CIVS) {
      const mp = M.civManpowerMatrixMults(civ.key || undefined);
      for (const diff of DIFFS) {
        const vals = {};
        for (const owner of OWNERS) {
          const it = M.unitProductionItem(u.Jednostka, data, civBonusy(civ.key), 'niski', owner, diff);
          // utrzymanie: tylko na Normalnym (tick jest kosztowny); easy/hard dziedzicza ta sama funkcje (upkeepParams per difficulty, bez ownerId)
          let up = null;
          if (diff === 'normal') {
            const ck = `${u.Jednostka}|${civ.ikona}|${owner}`;
            if (!upCache.has(ck)) { const t = tick(owner, civ, Math.max(era, 1), [], [u.Jednostka]); upkeepTicks++; upCache.set(ck, { z: t.up.utrzymanieJednostki || 0, s: JSON.stringify(t.resUp) }); }
            up = upCache.get(ck);
          }
          vals[owner] = { it, up, mp: M.unitManpowerCostForType(u.Jednostka, era, mp.maxMult, mp.costMult), stock: M.unitStockCost(u) };
        }
        checked++;
        const k = (o) => JSON.stringify([vals[o].it.koszt, vals[o].mp, vals[o].stock]);
        if (k(0) !== k(1)) { differ++; if (ex.length < 6) ex.push(`${u.Jednostka} ${civ.ikona} ${diff}: ${k(0)} vs ${k(1)}`); }
        if (diff === 'normal' && JSON.stringify(vals[0].up) !== JSON.stringify(vals[1].up)) differUp++;
        for (const owner of OWNERS) {
          const v = vals[owner];
          rows.push([u.Jednostka, u.Epoka, u.Nacja || '', civ.ikona, owner, diff, v.it.koszt, v.mp, JSON.stringify(v.stock),
            v.up ? v.up.z : '', v.up ? v.up.s : '', pct(vals[0].it.koszt, v.it.koszt), v.up ? pct(vals[0].up.z, v.up.z) : '']);
        }
      }
    }
  }
  writeCsv('results-koszty-jednostek.csv', rows);
  const normalRows = rows.slice(1).filter((r) => r[5] === 'normal' && r[4] === 1);
  summary.push(['C_koszty_jednostek', 'koszt zlota/MP/surowce jednostki owner0 vs owner1 (wszystkie trudnosci)', checked, differ, 'ex: ' + ex.join(' | ')]);
  summary.push(['C_koszty_jednostek', 'jak wyzej, tylko NORMAL', normalRows.length, normalRows.filter((r) => r[11] !== 0).length, 'wynik glowny audytu']);
  summary.push(['C_utrzymanie_jednostek', 'utrzymanie zlota+surowcow jednostki (tick ekonomii) owner0 vs owner1, Normal', checked / 3, differUp, `${upkeepTicks} tickow ekonomii (jednostka x civ x owner)`]);
  // cross-civ: unit gold cost differences normal owner0 (discount civs)
  const perUnit = new Map();
  for (const r of rows.slice(1)) if (r[5] === 'normal' && r[4] === 0) { if (!perUnit.has(r[0])) perUnit.set(r[0], new Map()); perUnit.get(r[0]).set(r[3], r[6]); }
  let uciv = 0; for (const [, m] of perUnit) if (new Set(m.values()).size > 1) uciv++;
  summary.push(['C_koszty_jednostek', 'ROZNICA MIEDZY CYWILIZACJAMI (normal, owner0): jednostki o roznym koszcie zlota', perUnit.size, uciv,
    'prod_koszt_jednostki_proc=0.1 dla: ' + CIVS.filter((c) => M.civMatrixParam(c.key, 'prod_koszt_jednostki_proc') !== 0).map((c) => c.ikona).join(',') + '; walka_koszt_rekrutacji_proc: ' + CIVS.filter((c) => M.civMatrixParam(c.key, 'walka_koszt_rekrutacji_proc') !== 0).map((c) => c.ikona + '=' + M.civMatrixParam(c.key, 'walka_koszt_rekrutacji_proc')).join(',')]);
  cover.sekcje.C = { jednostek: data.units.length, civ: CIVS.length, owner: 2, trudnosci: 3, wierszy: rows.length - 1, tickiUtrzymania: upkeepTicks };
}

// ---------------- B) ULEPSZENIA TERENU ----------------
{
  const rows = [['ulepszenie', 'epoka_wpisu', 'era_gry', 'civ', 'owner', 'dozwolone_dla_civ', 'koszt_praca', 'roznica_vs_gracz_%']];
  let checked = 0, differ = 0;
  const keys = Object.keys(IMPR).filter((k) => !k.startsWith('_') && typeof IMPR[k] === 'object' && IMPR[k].koszt_praca !== undefined);
  for (const key of keys) for (const civ of CIVS) for (const era of [1, 2, 3, 4]) {
    const costs = OWNERS.map(() => M.scaleTerrainImprovementWorkCost(IMPR[key].koszt_praca, IMPR[key].epoka));
    const allowed = M.isImprovementAllowedForCiv(key, civ.key);
    checked++;
    if (costs[0] !== costs[1]) differ++;
    for (const owner of OWNERS) rows.push([key, IMPR[key].epoka, era, civ.ikona, owner, allowed, costs[owner], pct(costs[0], costs[owner])]);
  }
  writeCsv('results-koszty-ulepszen.csv', rows);
  summary.push(['B_koszty_ulepszen_terenu', 'koszt Pracy ulepszenia terenu (scaleTerrainImprovementWorkCost; funkcja BEZ parametru ownerId/trudnosci/civ)', checked, differ,
    'koszt zalezy wylacznie od koszt_praca i epoka WPISU w JSON (nie od epoki gry/ownera); ulepszenia civ-specyficzne (cywilizacje[]): ' + keys.filter((k) => IMPR[k].cywilizacje).map((k) => k + '=' + IMPR[k].cywilizacje.join('/')).join('; ')]);
  cover.sekcje.B = { ulepszen: keys.length, civ: CIVS.length, era: 4, owner: 2, wierszy: rows.length - 1 };
}

// ---------------- D) PRZYCHODY: dwa identyczne miasta ----------------
{
  const FIELDS = ['praca', 'pieniadz', 'pieniadzBrutto', 'nauka', 'luksus', 'kultura', 'zywnoscNetto', 'zywnoscBrutto', 'doBudynkow', 'doPuli', 'zdrowie', 'wealthMnoznik', 'wealthZadowolenie', 'kosztRacji'];
  const rows = [['scenariusz', 'epoka', 'civ', 'owner', ...FIELDS, 'utrzymanie_budynki', 'utrzymanie_jednostki', 'roznica_max_vs_gracz_%', 'pieniadz_vs_grecy_%', 'praca_vs_grecy_%']];
  let checked = 0, differ = 0; const ex = [];
  const refG = new Map();
  const eraOf = (b) => b.epokaWejscia;
  const t0 = Date.now();
  const scenarios = [{ name: 'BAZA(0 budynkow)', built: () => [] }];
  for (const b of data.buildings) scenarios.push({ name: b.id, built: () => [b.id], minEra: eraOf(b) });
  scenarios.push({ name: 'WSZYSTKIE budynki epoki', built: (era) => data.buildings.filter((b) => eraOf(b) <= era).map((b) => b.id) });
  for (const sc of scenarios) for (const era of [1, 2, 3, 4]) {
    if (sc.minEra && sc.minEra > era) continue;
    for (const civ of CIVS) {
      const res = {};
      for (const owner of OWNERS) res[owner] = tick(owner, civ, era, sc.built(era), []);
      checked++;
      let maxD = 0;
      const vecs = {};
      for (const owner of OWNERS) vecs[owner] = FIELDS.map((f) => { const v = res[owner].tk[f]; return typeof v === 'number' ? Math.round(v * 1000) / 1000 : (v === undefined ? '' : v); });
      for (let i = 0; i < FIELDS.length; i++) {
        const a = vecs[0][i], b = vecs[1][i];
        if (typeof a === 'number' && typeof b === 'number') { const d = a === 0 ? (b === 0 ? 0 : 100) : Math.abs((b - a) / a * 100); if (d > maxD) maxD = d; }
      }
      const upk = (o) => [res[o].up.utrzymanieBudynki || 0, res[o].up.utrzymanieJednostki || 0];
      const same = JSON.stringify(vecs[0]) === JSON.stringify(vecs[1]) && JSON.stringify(upk(0)) === JSON.stringify(upk(1));
      if (!same) { differ++; if (ex.length < 8) ex.push(`${sc.name} e${era} ${civ.ikona}: maxD=${maxD.toFixed(2)}%`); }
      for (const owner of OWNERS) {
        const gk = `${sc.name}|${era}|${owner}`;
        if (civ.ikona === 'grecy') refG.set(gk, { p: vecs[owner][FIELDS.indexOf('pieniadz')], w: vecs[owner][FIELDS.indexOf('praca')] });
        const g = refG.get(gk);
        rows.push([sc.name, era, civ.ikona, owner, ...vecs[owner], ...upk(owner), +maxD.toFixed(3),
          g ? pct(g.p, vecs[owner][FIELDS.indexOf('pieniadz')]) : '', g ? pct(g.w, vecs[owner][FIELDS.indexOf('praca')]) : '']);
      }
    }
  }
  writeCsv('results-przychody.csv', rows);
  summary.push(['D_przychody', 'strumienie miasta (Praca, Pieniadz, Nauka, Zywnosc, Kultura, Luksus, doPuli ...) + utrzymanie: dwa identyczne miasta owner0 vs owner1 przez advanceCityEconomy', checked, differ,
    'scenariusze: baza + kazdy z ' + data.buildings.length + ' budynkow osobno + komplet budynkow epoki; epoki 1-4; 15 civ; pop=8; Normal; ex: ' + ex.join(' | ') + `; czas ${Math.round((Date.now() - t0) / 1000)}s`]);
  // cross-civ spread w scenariuszu BAZA i WSZYSTKIE (owner0, era 2)
  for (const scn of ['BAZA(0 budynkow)', 'WSZYSTKIE budynki epoki']) {
    const sub = rows.slice(1).filter((r) => r[0] === scn && r[1] === 2 && r[3] === 0);
    const pi = rows[0].indexOf('pieniadz');
    const vals = sub.map((r) => [r[2], r[pi]]).sort((a, b) => b[1] - a[1]);
    if (vals.length) summary.push(['D_przychody_miedzy_civ', `${scn}, epoka 2, owner0: Pieniadz/tura per civ (najwyzszy vs najnizszy)`, vals.length, 'n/d', vals.map((v) => v[0] + '=' + v[1]).join(' ') + ` ; rozstep ${vals[0][1]} vs ${vals[vals.length - 1][1]} = ${pct(vals[vals.length - 1][1], vals[0][1])}%`]);
  }
  cover.sekcje.D = { scenariuszy: scenarios.length, epok: 4, civ: CIVS.length, owner: 2, tickow: checked * 2, wierszy: rows.length - 1 };
}


// ---------------- E') parametry ekonomiczne cywilizacji (civ-matrix.json) -- roznice MIEDZY civ (nie gracz vs AI) ----------------
{
  const P = ['meta_mnoznik_waluta', 'eko_praca_proc', 'eko_pieniadz_proc', 'eko_pieniadz_port_proc', 'eko_zywnosc_proc', 'eko_nauka_proc', 'eko_handel_brutto_proc', 'eko_korupcja_proc',
    'prod_koszt_budynku_proc', 'prod_koszt_jednostki_proc', 'walka_koszt_rekrutacji_proc', 'prod_szybkosc_budynku_proc', 'prod_szybkosc_jednostki_proc', 'lud_wzrost_proc', 'lud_limit_populacji',
    'mp_regen_proc', 'mp_max_proc', 'mp_koszt_jednostki_proc', 'wealth_cap_proc', 'wealth_mnoznik_proc'];
  const rows = [['civ', 'klucz_macierzy', ...P]];
  for (const civ of CIVS) rows.push([civ.ikona, civ.key, ...P.map((id) => M.civMatrixParam(civ.key, id))]);
  writeCsv('results-civ-parametry.csv', rows);
  summary.push(['E_civ_parametry', 'parametry ekonomii/kosztow/MP z civ-matrix.json per cywilizacja (te same wartosci dla gracza i AI wybierajacego te civ)', CIVS.length, 'n/d', 'patrz results-civ-parametry.csv']);
}

writeCsv('results-parity-summary.csv', summary);
fs.writeFileSync(path.join(OUT, 'coverage.json'), JSON.stringify(cover, null, 2) + '\n', 'utf8');
for (const f of [ENTRY, BUNDLE]) { try { fs.unlinkSync(f); } catch (e) { /* ok */ } }
console.log('OK');
for (const r of summary.slice(1)) console.log(r.slice(0, 4).join(' | '));
