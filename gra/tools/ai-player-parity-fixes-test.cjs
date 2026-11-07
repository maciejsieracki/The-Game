'use strict';
/**
 * ai-player-parity-fixes-test.cjs -- R-WEB-AI-PLAYER-PARITY-FIXES-Q1.
 *
 * Cztery poprawki asymetrii AI vs gracz (audyt R-WEB-AI-VS-PLAYER-ECONOMY-AUDIT-Q1):
 *   1. seed podziału Daniny AI w turze 1 = 60/60/20 (140%) -> suma 100% (aiSeedPodzialHandlu),
 *   2. buildDiploTreasury().add: podłoga 0 tylko dla AI -> jedna reguła (bez podłogi; płatnik
 *      i tak jest sprawdzany przez applyOneShotGoldTransfer),
 *   3. miasta-państwa: zakup (purchaseRecruitmentUnit) liczył na globalnej trudności, produkcja
 *      na trudności miast-państw -> effectiveGameDifficultyForOwner wszędzie,
 *   4. zastępcza epoka `ownerId === 0 ? playerEra : 1` w turn-economy.ts: jedno miejsce
 *      (legacyEraForOwner) + dowód, że main.ts zawsze podaje resolver (gałąź martwa w grze).
 * Każda asercja pada na bazie (origin/main fcaa10300+), przechodzi po poprawce.
 *
 * Run from gra/:  node tools/ai-player-parity-fixes-test.cjs
 */
const fs = require('fs');
const path = require('path');

const GRA = path.resolve(__dirname, '..');
const esbuild = (() => {
  try { return require(path.resolve(GRA, 'node_modules', 'esbuild')); }
  catch (e) { console.error('[ai-player-parity-fixes-test] esbuild not found. Run: npm install (from gra/)'); process.exit(1); }
})();

const ENTRY_FILE = path.resolve(__dirname, '.ai-player-parity-fixes-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.ai-player-parity-fixes-bundle.cjs');

fs.writeFileSync(ENTRY_FILE, `
import * as AI from '../src/game/ai';
export const aiSeedPodzialHandlu: undefined | (() => { procentNauka: number; procentPieniadz: number; procentLuksus: number }) = (AI as any).aiSeedPodzialHandlu;
export const decideAIEconomySliders = (AI as any).decideAIEconomySliders;
export const loadAiSliderParams = (AI as any).loadAiSliderParams;
export { generateMap, DEFAULT_WIDTH, DEFAULT_HEIGHT } from '../src/map/generator';
export { computeStartPlacements } from '../src/units/setup';
export { foundCity, cityName, DEFAULT_PODZIAL_HANDLU, AI_FIXED_PROCENT_NAUKA, normalizePodzialHandlu } from '../src/game/cities';
export { freshOwnerDefaultPodzialHandlu } from '../src/game/empire-handel-split';
export { loadGameData } from '../src/data/loader';
export { DEFAULT_PODZIAL_PRACY, DEFAULT_PROCENT_ROZWOJ } from '../src/game/cities';
export { previewCityEconomy, advanceCityEconomy } from '../src/game/turn-economy';
export { applyOneShotGoldTransfer } from '../src/game/diplomacy-economy';
export { unitProductionItem } from '../src/game/production';
export { effectiveGameDifficultyForOwnerPure } from '../src/game/effective-difficulty-for-owner';
`, 'utf8');

try {
  esbuild.buildSync({
    entryPoints: [ENTRY_FILE], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
    loader: { '.ts': 'ts', '.json': 'json' }, outfile: BUNDLE_FILE, absWorkingDir: GRA, logLevel: 'silent',
  });
} catch (e) {
  console.error('[ai-player-parity-fixes-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
} finally {
  try { fs.unlinkSync(ENTRY_FILE); } catch {}
}

const B = require(BUNDLE_FILE);
const MAIN = fs.readFileSync(path.resolve(GRA, 'src', 'main.ts'), 'utf8');
const TURN_ECON = fs.readFileSync(path.resolve(GRA, 'src', 'game', 'turn-economy.ts'), 'utf8');

let passed = 0, failed = 0;
function ok(c, msg, detail) {
  if (c) { passed++; console.log(`PASS: ${msg}`); }
  else { failed++; console.log(`FAIL: ${msg}${detail !== undefined ? ' -- ' + detail : ''}`); }
}
function eq(a, b, msg) { ok(a === b, msg, `got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`); }

// --- helpers do statycznej analizy main.ts ---
function matchClose(src, openIdx, open, close) {
  let depth = 0;
  let inStr = null;
  for (let i = openIdx; i < src.length; i++) {
    const ch = src[i];
    if (inStr) {
      if (ch === '\\') { i++; continue; }
      if (ch === inStr) inStr = null;
      continue;
    }
    if (ch === '\'' || ch === '"' || ch === '`') { inStr = ch; continue; }
    if (ch === '/' && src[i + 1] === '/') { while (i < src.length && src[i] !== '\n') i++; continue; }
    if (ch === open) depth++;
    else if (ch === close) { depth--; if (depth === 0) return i; }
  }
  return -1;
}
function functionSource(src, header) {
  const start = src.indexOf(header);
  if (start < 0) return null;
  const brace = src.indexOf('{', src.indexOf(')', start));
  const end = matchClose(src, brace, '{', '}');
  return src.slice(start, end + 1);
}
function stripComments(s) {
  return s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s\/\/.*$/gm, '');
}
function splitTopLevelArgs(argText) {
  const out = []; let depth = 0; let cur = ''; let inStr = null;
  for (let i = 0; i < argText.length; i++) {
    const ch = argText[i];
    if (inStr) { cur += ch; if (ch === '\\') { cur += argText[++i]; continue; } if (ch === inStr) inStr = null; continue; }
    if (ch === '\'' || ch === '"' || ch === '`') { inStr = ch; cur += ch; continue; }
    if ('([{'.includes(ch)) depth++;
    if (')]}'.includes(ch)) depth--;
    if (ch === ',' && depth === 0) { out.push(cur.trim()); cur = ''; continue; }
    cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}
function callsOf(src, name) {
  const calls = [];
  const re = new RegExp(`\\b${name}\\(`, 'g');
  let m;
  while ((m = re.exec(src))) {
    const open = m.index + name.length;
    const prefix = src.slice(Math.max(0, m.index - 12), m.index);
    if (/function\s+$|import\s+\{\s*$/.test(prefix)) continue; // deklaracja
    const close = matchClose(src, open, '(', ')');
    if (close < 0) continue;
    calls.push(splitTopLevelArgs(stripComments(src.slice(open + 1, close))));
  }
  return calls;
}

// ===========================================================================
// 1. SEED PODZIAŁU DANINY AI
// ===========================================================================
console.log('\n-- 1. seed podziału Daniny AI (suma 100%) --');
const { aiSeedPodzialHandlu, normalizePodzialHandlu, DEFAULT_PODZIAL_HANDLU, AI_FIXED_PROCENT_NAUKA,
  freshOwnerDefaultPodzialHandlu } = B;

ok(typeof aiSeedPodzialHandlu === 'function', 'ai.ts eksportuje aiSeedPodzialHandlu()');
const oldSeed = { ...DEFAULT_PODZIAL_HANDLU, procentNauka: AI_FIXED_PROCENT_NAUKA };
eq(oldSeed.procentNauka + oldSeed.procentPieniadz + oldSeed.procentLuksus, 140, 'fixture: dawny seed AI = 140% (60/60/20)');
const oldEffective = normalizePodzialHandlu(oldSeed);
if (typeof aiSeedPodzialHandlu === 'function') {
  const seed = aiSeedPodzialHandlu();
  eq(seed.procentNauka + seed.procentPieniadz + seed.procentLuksus, 100, 'nowy seed AI sumuje się do 100%');
  eq(seed.procentNauka, AI_FIXED_PROCENT_NAUKA, 'nowy seed zachowuje politykę AI: Nauka = AI_FIXED_PROCENT_NAUKA');
  eq(seed.procentLuksus, DEFAULT_PODZIAL_HANDLU.procentLuksus, 'nowy seed zachowuje Zamożność z domyślnego podziału gracza');
  const norm = normalizePodzialHandlu(seed);
  ok(norm.procentNauka === seed.procentNauka && norm.procentPieniadz === seed.procentPieniadz
    && norm.procentLuksus === seed.procentLuksus, 'normalizePodzialHandlu(seed) nic nie zmienia (nie ma cichej korekty)');
  ok(!(oldEffective.procentNauka === seed.procentNauka && oldEffective.procentLuksus === seed.procentLuksus),
    'dawny seed po cichej normalizacji dawał INNY podział w turze 1 niż docelowy',
    `dawny efektywny N/S/Z = ${oldEffective.procentNauka}/${oldEffective.procentPieniadz}/${oldEffective.procentLuksus}`);

  // Spójność z pierwszą korekcją suwaków (main.ts: nextPieniadz = default.pieniadz - delta Nauki).
  // Z bazą korekty = faktyczny seed (poprawka w main.ts) AI zostaje na tym samym podziale.
  const nextNauka = AI_FIXED_PROCENT_NAUKA;
  const baseNauka = seed.procentNauka; // nowa baza (z mapy ownerDefault)
  const nextPieniadz = Math.max(0, Math.min(100, seed.procentPieniadz - (nextNauka - baseNauka)));
  const nextLuksus = Math.max(0, 100 - nextNauka - nextPieniadz);
  ok(nextNauka === seed.procentNauka && nextPieniadz === seed.procentPieniadz && nextLuksus === seed.procentLuksus,
    'pierwsza korekta suwaków (baza = seed) nie zmienia podziału: tura 1 == tura 2+');
  // Stara baza (20) przy nowym seedzie zepsułaby podział -- pilnujemy, że main.ts jej nie używa.
  const brokenPieniadz = Math.max(0, Math.min(100, seed.procentPieniadz - (nextNauka - DEFAULT_PODZIAL_HANDLU.procentNauka)));
  ok(brokenPieniadz !== seed.procentPieniadz, 'fixture: baza korekty = default gracza (20) zepsułaby podział (Skarb->0)');
}
ok(!/\.\.\.DEFAULT_PODZIAL_HANDLU,\s*procentNauka:\s*AI_FIXED_PROCENT_NAUKA/.test(MAIN),
  'main.ts nie zawiera już seeda {...DEFAULT_PODZIAL_HANDLU, procentNauka: AI_FIXED_PROCENT_NAUKA}');
eq((MAIN.match(/aiSeedPodzialHandlu\(\)/g) || []).length, 4, 'main.ts: 4 miejsca seedu AI używają aiSeedPodzialHandlu()');
ok(/ownerDefaultPodzialHandlu\.get\(ownerId\)\?\.procentNauka/.test(MAIN),
  'main.ts: baza pierwszej korekty suwaków czytana z faktycznego seeda ownera');
{
  const pl = freshOwnerDefaultPodzialHandlu();
  eq(`${pl.procentNauka}/${pl.procentPieniadz}/${pl.procentLuksus}`, '20/60/20', 'gracz nadal startuje na 20/60/20 (bez zmian)');
}

// --- pomiar dochodu AI T1-T10 przed/po (realny silnik) ---
console.log('\n-- 1b. pomiar dochodu AI T1-T10 (advanceCityEconomy, stare vs nowy seed) --');
{
  const { generateMap, DEFAULT_WIDTH, DEFAULT_HEIGHT, computeStartPlacements, foundCity, cityName, loadGameData,
    advanceCityEconomy, decideAIEconomySliders, loadAiSliderParams, normalizePodzialHandlu,
    DEFAULT_PODZIAL_PRACY, DEFAULT_PROCENT_ROZWOJ } = B;
  const data = loadGameData();
  const sliderParams = loadAiSliderParams(data.econParams, 'normal');
  // Pętla suwaków AI odtworzona 1:1 z main.ts (blok decideAIEconomySliders, ok. 39046-39152), dla
  // major AI BEZ profilu pilotażowego (profil ma tylko 'grecy' -> tam split = profil od T1, pętla pominięta):
  //  - sliderSt startuje z ownerDefaultPodzialHandlu ownera (seed), procentBudynki = DEFAULT_PODZIAL_PRACY;
  //  - korekta: nextNauka = decyzja AI; nextPieniadz = clamp(pieniadz_ZAPISANY_seedu - (nauka_nowa - nauka_stara));
  //    nextLuksus = 100 - nauka - pieniądz; zapis ownerDefaultPodzialHandlu = normalizePodzialHandlu(...).
  //  Wejścia zapasów/skarbca/utrzymania wpływają tylko na procentRozwoj, nie na podział handlu -> neutralne (0).
  //  Ekonomia tury t liczy się PRZED blokiem suwaków tej tury (tura 1 zużywa seed, jak w grze).
  function run(seedSplit) {
    const map = generateMap(DEFAULT_WIDTH, DEFAULT_HEIGHT, 9191);
    const start = computeStartPlacements(map, data);
    const a = start.aiStarts[0];
    const settler = { id: 'parity_s', ownerId: 1, typeId: 'Osadnik', category: 'osadnik', q: a.q, r: a.r, ruch: 2, ruchLeft: 2 };
    const city = foundCity(settler, [], map, cityName(1));
    city.podzialHandluOverride = false; delete city.podzialHandlu;
    const cities = [city]; const built = new Map();
    let own = seedSplit;
    let st = { procentRozwoj: DEFAULT_PROCENT_ROZWOJ, procentBudynki: DEFAULT_PODZIAL_PRACY.procentBudynki,
      procentNauka: own.procentNauka, lastChangeTurn: null };
    const rows = [];
    for (let t = 1; t <= 10; t++) {
      const econ = advanceCityEconomy(
        cities, map, data, 'normal', [], new Map(), built, 1, new Set(), new Map(), new Map(),
        undefined, undefined, 'wysoki', undefined, undefined, undefined, undefined, undefined, undefined, undefined,
        new Map([[1, { ...own }]]), undefined, new Map(),
      );
      const tk = econ.perCity.find(x => x.cityId === city.id);
      rows.push({ t, split: { ...own }, pieniadz: tk.pieniadz, nauka: tk.nauka, luksus: tk.luksus ?? tk.zamoznosc ?? 0 });
      const dec = decideAIEconomySliders({
        zapasyPanstwa: 0, atWar: false, turn: t, lastSliderChangeTurn: st.lastChangeTurn,
        current: { procentRozwoj: st.procentRozwoj, procentBudynki: st.procentBudynki, procentNauka: st.procentNauka },
        isMajorAi: true, isEarlyGame: t <= 30, treasuryGold: 0, upkeepGoldCost: 0,
      }, sliderParams);
      if (dec.changed) {
        const nextNauka = dec.procentNauka;
        const nextPieniadz = Math.max(0, Math.min(100, own.procentPieniadz - (nextNauka - st.procentNauka)));
        const nextLuksus = Math.max(0, 100 - nextNauka - nextPieniadz);
        own = normalizePodzialHandlu({ procentNauka: nextNauka, procentPieniadz: nextPieniadz, procentLuksus: nextLuksus });
        st = { procentRozwoj: dec.procentRozwoj, procentBudynki: dec.procentBudynki, procentNauka: nextNauka, lastChangeTurn: t };
      }
    }
    return rows;
  }
  const beforeSeed = normalizePodzialHandlu(oldSeed); // stary seed: suma 140% -> po normalizacji w silniku
  const before = run(oldSeed);
  const after = run(typeof aiSeedPodzialHandlu === 'function' ? aiSeedPodzialHandlu() : oldSeed);
  const sum = (rows, k, n) => rows.slice(0, n).reduce((s, r) => s + r[k], 0);
  const fmt = sp => `${sp.procentNauka}/${sp.procentPieniadz}/${sp.procentLuksus}`;
  console.log('   tura | podział N/S/Z przed | przed: Skarb/Nauka/Zam. | podział N/S/Z po | po: Skarb/Nauka/Zam.');
  for (let i = 0; i < 10; i++) {
    const b = before[i], a = after[i];
    console.log(`   T${String(b.t).padStart(2)}  | ${fmt(b.split)} | ${b.pieniadz.toFixed(2)} / ${b.nauka.toFixed(2)} / ${b.luksus.toFixed(2)} | ${fmt(a.split)} | ${a.pieniadz.toFixed(2)} / ${a.nauka.toFixed(2)} / ${a.luksus.toFixed(2)}`);
  }
  console.log(`   SUMA T1-T10: Skarb ${sum(before, 'pieniadz', 10).toFixed(2)} -> ${sum(after, 'pieniadz', 10).toFixed(2)}; Nauka ${sum(before, 'nauka', 10).toFixed(2)} -> ${sum(after, 'nauka', 10).toFixed(2)}; Zamożność ${sum(before, 'luksus', 10).toFixed(2)} -> ${sum(after, 'luksus', 10).toFixed(2)}`);
  console.log(`   seed przed (po normalizacji silnika) = ${fmt(beforeSeed)}; seed po = ${fmt(typeof aiSeedPodzialHandlu === 'function' ? aiSeedPodzialHandlu() : oldSeed)}`);
  if (typeof aiSeedPodzialHandlu === 'function') {
    ok(before[0].pieniadz !== after[0].pieniadz || before[0].nauka !== after[0].nauka,
      'pomiar: tura 1 AI różni się po poprawce (seed 140% -> 100%)');
    // Stan docelowy po poprawce dla major AI bez profilu: 60/20/20 od T2 (ta sama pętla co w grze).
    ok(after.slice(1).every(r => r.split.procentNauka === 60 && r.split.procentPieniadz === 20 && r.split.procentLuksus === 20),
      'po poprawce: T2-T10 podział AI = 60/20/20 (pętla suwaków, bez profilu civ)');
    // Ten sam pomiar dla bazy: T2+ NIE jest identyczny -- zapisujemy to jawnie (nie zakładamy "bez zmian").
    let sameFrom2 = true;
    for (let i = 1; i < 10; i++) if (Math.abs(before[i].pieniadz - after[i].pieniadz) > 1e-9) sameFrom2 = false;
    console.log(`   T2-T10 Skarb identyczny przed/po: ${sameFrom2 ? 'TAK' : 'NIE'} (odnotowane, nie asercja)`);
  }
}

// ===========================================================================
// 2. SKARBIEC W DYPLOMACJI: JEDNA REGUŁA
// ===========================================================================
console.log('\n-- 2. buildDiploTreasury: jedna reguła gracz/AI --');
{
  const src = functionSource(MAIN, 'function buildDiploTreasury()');
  ok(!!src, 'znaleziono buildDiploTreasury w main.ts');
  const js = esbuild.transformSync(src, { loader: 'ts' }).code;
  function makeTreasury(humanBal, aiBal) {
    const playerStateByHuman = new Map([[0, { skarbiec: humanBal }]]);
    const aiSkarbiecByOwner = new Map([[5, aiBal]]);
    const isHuman = (id) => playerStateByHuman.has(id);
    const ownerTreasury = (id) => (isHuman(id) ? playerStateByHuman.get(id).skarbiec : (aiSkarbiecByOwner.get(id) ?? 0));
    const t = new Function('isHuman', 'ownerTreasury', 'playerStateByHuman', 'aiSkarbiecByOwner',
      `${js}\nreturn buildDiploTreasury();`)(isHuman, ownerTreasury, playerStateByHuman, aiSkarbiecByOwner);
    return t;
  }
  // Odbiorca z długiem: gracz -30 i AI -30 dostają +10 -> oba -20 (dług nie jest kasowany).
  {
    const t = makeTreasury(-30, -30);
    t.add(0, 10); t.add(5, 10);
    eq(t.getPieniadze(0), -20, 'gracz z długiem -30 po +10: -20');
    eq(t.getPieniadze(5), -20, 'AI z długiem -30 po +10: -20 (parytet; dawniej 0 = skasowany dług)');
  }
  // Dar większy niż dług: obie strony dodatnie identycznie.
  {
    const t = makeTreasury(-30, -30);
    t.add(0, 100); t.add(5, 100);
    eq(t.getPieniadze(0), 70, 'gracz -30 +100 = 70');
    eq(t.getPieniadze(5), 70, 'AI -30 +100 = 70');
  }
  // Płatnik: nie da się oddać więcej niż się ma (gracz i AI, ta sama funkcja silnika).
  for (const [who, id] of [['gracz', 0], ['AI', 5]]) {
    const t = makeTreasury(50, 50);
    const other = id === 0 ? 5 : 0;
    const r = B.applyOneShotGoldTransfer(id, other, 80, t);
    ok(r.ok === false, `${who} z 50 ¤ nie może oddać 80 ¤ (odmowa)`);
    eq(t.getPieniadze(id), 50, `${who}: saldo bez zmian po odmowie`);
    eq(t.getPieniadze(other), 50, `${who}: saldo odbiorcy bez zmian po odmowie`);
    const r2 = B.applyOneShotGoldTransfer(id, other, 50, t);
    ok(r2.ok === true && t.getPieniadze(id) === 0 && t.getPieniadze(other) === 100, `${who}: oddanie całego salda 50 -> 0, odbiorca 100`);
  }
  ok(!/Math\.max\(0,\s*\(aiSkarbiecByOwner/.test(src), 'buildDiploTreasury nie podłogowuje salda AI');
}

// ===========================================================================
// 3. MIASTA-PAŃSTWA: JEDNA TRUDNOŚĆ W ZAKUPIE I PRODUKCJI
// ===========================================================================
console.log('\n-- 3. miasta-państwa: trudność w zakupie == trudność w produkcji --');
{
  const { loadGameData, unitProductionItem, effectiveGameDifficultyForOwnerPure } = B;
  const data = loadGameData();
  const csOwners = new Set([7]);
  // Gra Easy, trudność miast-państw odwrócona (hard): produkcja liczy ×1, globalna Easy dla AI ×2.
  const effEasyGame = effectiveGameDifficultyForOwnerPure(7, 'easy', 'hard', csOwners);
  eq(effEasyGame, 'hard', 'fixture: gra Easy -> trudność miasta-państwa (owner 7) = hard');
  const unitId = (data.units.find(u => u.Jednostka === 'Wojownik') || data.units[0]).Jednostka;
  const viaGlobal = unitProductionItem(unitId, data, undefined, 'niski', 7, 'easy');
  const viaOwner = unitProductionItem(unitId, data, undefined, 'niski', 7, effEasyGame);
  console.log(`   ${unitId}: koszt miasta-państwa przy globalnej Easy = ${viaGlobal && viaGlobal.koszt}, przy trudności właściciela (hard) = ${viaOwner && viaOwner.koszt}`);
  ok(viaGlobal && viaOwner && viaGlobal.koszt !== viaOwner.koszt, 'fixture: globalna i właścicielska trudność dają RÓŻNY koszt (stąd asymetria)');

  // BEHAWIORALNIE (stan decyzji zakupu): dla każdej kombinacji trudności gry x miasta-państwa,
  // cena, którą zakup dostaje z trudnością właściciela (ta sama wartość co w purchaseRecruitmentUnit),
  // musi równać się cenie produkcji miasta-państwa (trudność miasta-państwa), a gracz (owner 0) dalej
  // płaci trudnością gry. Pełne wywołanie closure purchaseRecruitmentUnit nie jest importowalne bez DOM.
  {
    const mism = [];
    const buyDiffersFromGlobal = [];
    for (const game of ['easy', 'normal', 'hard']) for (const cs of ['easy', 'normal', 'hard']) {
      const effCs = effectiveGameDifficultyForOwnerPure(7, game, cs, csOwners);
      const effPl = effectiveGameDifficultyForOwnerPure(0, game, cs, csOwners);
      const buy = unitProductionItem(unitId, data, undefined, 'niski', 7, effCs);
      const prod = unitProductionItem(unitId, data, undefined, 'niski', 7, cs);
      const plBuy = unitProductionItem(unitId, data, undefined, 'niski', 0, effPl);
      const plRef = unitProductionItem(unitId, data, undefined, 'niski', 0, game);
      if (effCs !== cs || effPl !== game || !buy || !prod || buy.koszt !== prod.koszt || plBuy.koszt !== plRef.koszt) {
        mism.push(`${game}/${cs}`);
      }
      if (game !== cs && buy && viaGlobal && buy.koszt !== unitProductionItem(unitId, data, undefined, 'niski', 7, game).koszt) {
        buyDiffersFromGlobal.push(`${game}/${cs}`);
      }
    }
    eq(mism.length, 0, 'zakup miasta-państwa == produkcja miasta-państwa dla 9 kombinacji (gracz nietknięty)');
    if (mism.length) console.log('   niezgodne: ' + mism.join(', '));
    ok(buyDiffersFromGlobal.length > 0, 'zakup miasta-państwa: przy różnych trudnościach cena ZMIENIA się względem globalnej (poprawka działa)',
      `kombinacje: ${buyDiffersFromGlobal.join(', ') || 'brak'}`);
  }

  const purchase = functionSource(MAIN, 'function purchaseRecruitmentUnit(');
  ok(!!purchase, 'znaleziono purchaseRecruitmentUnit w main.ts');
  const calls = purchase ? callsOf(stripComments(purchase), 'unitProductionItem') : [];
  eq(calls.length, 1, 'purchaseRecruitmentUnit: jedno wywołanie unitProductionItem');
  ok(calls.length === 1 && /effectiveGameDifficultyForOwner\(ownerId\)/.test(calls[0][calls[0].length - 1]),
    'purchaseRecruitmentUnit: trudność = effectiveGameDifficultyForOwner(ownerId)',
    calls[0] && calls[0][calls[0].length - 1]);

  // Globalnie: żadne wywołanie *ProductionItem z _menuDifficulty nie dotyczy ownera innego niż literał 0.
  const offenders = [];
  for (const name of ['unitProductionItem', 'buildingProductionItem']) {
    for (const args of callsOf(MAIN, name)) {
      const last = args[args.length - 1];
      const ownerArg = args[args.length - 2];
      if (/^_menuDifficulty$/.test(last) && ownerArg !== '0') offenders.push(`${name}(.., ${ownerArg}, ${last})`);
    }
  }
  eq(offenders.length, 0, 'main.ts: *ProductionItem z globalną trudnością tylko dla gracza (literał 0)');
  if (offenders.length) console.log('   ' + offenders.join('\n   '));

  // Kontekst zastępowania jednostek (AI upgrade) też per właściciel.
  const ctxFns = ['function buildReplaceAvailabilityCtxForCity', 'function replaceAvailabilityCtxEmpireWide('];
  const empireWide = functionSource(MAIN, 'function replaceAvailabilityCtxEmpireWide(');
  ok(empireWide && /difficulty:\s*effectiveGameDifficultyForOwner\(ownerId\)/.test(empireWide),
    'replaceAvailabilityCtxEmpireWide: difficulty per właściciel');
  ok(/difficulty:\s*effectiveGameDifficultyForOwner\(city\.ownerId\)/.test(MAIN),
    'kontekst zastępowania dla miasta: difficulty per właściciel');
  void ctxFns;
}

// ===========================================================================
// 4. ZASTĘPCZA EPOKA ownerId === 0 W turn-economy.ts
// ===========================================================================
console.log('\n-- 4. fallback epoki ownerId===0 --');
{
  eq((stripComments(TURN_ECON).match(/ownerId === 0 \? playerEra : 1/g) || []).length, 1,
    'turn-economy.ts: literał `ownerId === 0 ? playerEra : 1` występuje raz (legacyEraForOwner)');
  ok(/function legacyEraForOwner\(/.test(TURN_ECON), 'turn-economy.ts: helper legacyEraForOwner zdefiniowany');
  const adv = callsOf(MAIN, 'advanceCityEconomy');
  const prev = callsOf(MAIN, 'previewCityEconomy');
  ok(adv.length >= 1 && prev.length >= 1, `main.ts: wywołania advance=${adv.length}, preview=${prev.length}`);
  ok(adv.every(a => a[11] === 'empireEpochForOwner'),
    'main.ts: KAŻDE advanceCityEconomy podaje resolveOwnerEra (empireEpochForOwner) -> fallback martwy w grze');
  ok(prev.every(a => a[9] === 'empireEpochForOwner'),
    'main.ts: KAŻDE previewCityEconomy podaje resolveOwnerEra (empireEpochForOwner) -> fallback martwy w grze');
}

console.log(`\n${passed} passed, ${failed} failed`);
try { fs.unlinkSync(BUNDLE_FILE); } catch {}
process.exit(failed === 0 ? 0 : 1);
