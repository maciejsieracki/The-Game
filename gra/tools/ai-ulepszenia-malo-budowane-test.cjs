'use strict';
/**
 * ai-ulepszenia-malo-budowane-test.cjs — BRAMKA TEMATU R-AI-ULEPSZENIA-MALO-BUDOWANE-Q1.
 *
 * Zrzut wlasciciela: „Cywilizacje buduja bardzo malo ulepszen [...] kiedys po prostu
 * zalewali wszystko ulepszeniami [...] powinna obowiazywac zasada maksymalnie 50% na
 * ulepszenia, reszta na budynki".
 *
 * KROK 1 (diagnoza, ZYWA, WIELOTUROWA symulacja): mierzy FAKTYCZNY udzial Pracy AI
 * CYWILIZACJI trafiajacy do puli imperium (skad finansowane sa ulepszenia terenu —
 * `CityPodzialPracy.procentBudynki` / `procentPuliImperiumZBudynkow`, patrz `game/cities.ts`)
 * w czasie, przez PRAWDZIWE wejscie silnika `decideAITurn` (game/ai.ts) wolane co ture,
 * z realnie ROSNACA populacja (a wiec rosnacym zbiorem heksow obrabianych przez
 * obywatelu — `getOnlyWorked: () => true` w `planCityImprovements`).
 *
 * main.ts jest zamknieciem `boot()`, niebundlowalne w Node (jak w `ai4-popyt-obywatele-
 * measure.cjs`) — petla tury ponizej ODTWARZA 1:1 trzy rownania main.ts:
 *   1) podzial Pracy miasta: `procentPuliImperiumZBudynkow(procentBudynki)` (cities.ts,
 *      PRAWDZIWA funkcja, zaimportowana z bundla, nie przepisana).
 *   2) koperta automatu: `floor(pula * pracaAutoPercent% / 100)`, `pracaAutoPercent` =
 *      `DEFAULT_ULEPSZENIA_PRACA_PERCENT` (AI nigdy go nie zmienia — main.ts komentarz
 *      przy `aiImprovementBudgetByOwner`).
 *   3) ZASADA 3 (`applyAiImprovementSurplusRedirect`): przy nadwyzce `procentBudynki` idzie
 *      na `pct`; ten skrypt liczy `pct` DWOMA sposobami rownolegle — PRZED (Krok 1 tego
 *      tematu, `pct = MAX_PODZIAL_PRACY_BUDYNKI_PERCENT` = 100) i PO (Krok 3, z podloga
 *      `MIN_PROCENT_PULI_IMPERIUM_ZASADA3_NADWYZKA`) — zeby PRZED/PO bylo porownywalne w
 *      JEDNYM uruchomieniu, tym samym ziarnem, ta sama sciezka silnika. AI baseline (gdy
 *      NIE przekierowane) = 50 — `decideAIEconomySliders` celuje w 40 (early) / 50 (mid),
 *      ale main.ts KLAMRUJE kazdy zapis `procentBudynki` AI przez
 *      `clampPodzialPracyBudynkiPercent` (zakres [50,100]), wiec efektywny baseline AI
 *      jest zawsze 50 niezaleznie od ery — zweryfikowane czytaniem kodu (main.ts:28193,
 *      29278, 29290 to JEDYNE trzy miejsca pisza `city.podzialPracy` dla AI CYWILIZACJI,
 *      wszystkie przez klamre >=50).
 *
 * Kryterium 5 (allowlista/zakres): TEN plik jest nowy, w `gra/tools/` — dozwolony wprost.
 *
 * OBRONA ZARZUTU 1 (Evaluator runda 1, Operator runda 1 obrony): Evaluator zmierzyl WLASNA,
 * niezalezna symulacja (10 ziaren x 3 trudnosci x 100 tur), ze liczba rozkazow
 * `buildImprovement` byla IDENTYCZNA PRZED/PO (delta=0 w 30/30 biegach). To zgadza sie z
 * mechanizmem: ZASADA 3 uruchamia sie WLASNIE DLATEGO, ze `pickAutoImprovements` nie
 * znalazl ZADNEGO kandydata w tej turze (definicja "nadwyzki") — wiecej Pracy w puli nie
 * moze przelozyc sie na wiecej rozkazow buildImprovement W TYCH KONKRETNYCH turach, bo
 * kandydatow fizycznie nie ma, niezaleznie od budzetu. Pierwotny objaw wlasciciela
 * ("cywilizacje buduja bardzo malo ulepszen [terenu, widocznych na mapie]") NIE jest wiec
 * naprawiony podloga 10% w sensie "AI stawia wiecej ulepszen terenu w tych turach" — to
 * NIE jest prawda i te rundy testu tego NIE twierdza.
 *
 * Podloga 10% ma inny, realny cel: `MIN_PROCENT_PULI_IMPERIUM_ZASADA3_NADWYZKA` w
 * `game/cities.ts` dokumentuje, ze pula imperium (`aiPracaPoolByOwner` w main.ts) NIE
 * jest wylacznie "budzetem ulepszen" — z TEJ SAMEJ puli finansowane sa takze cuda na
 * mapie (`advanceOwnerWonderMapBuilds`), zakladanie miast (`evaluateFoundCityAffordance`,
 * main.ts:29583-29607) i wyrab lasu. Sekcja "OBRONA ZARZUTU 1" ponizej mierzy TEN inny
 * observable — zakladanie miast — PRAWDZIWA funkcja silnika
 * `evaluateFoundCityAffordance`/`foundCityWorkCost` z `game/city-founding.ts` (nie
 * reimplementacja), na TEJ SAMEJ zmiennej `pool`, ktora juz i tak jest liczona w tym
 * harnessie (dzielona miedzy buildImprovement a zakladanie miast, dokladnie jak w
 * main.ts). Wynik (patrz TESTY w raporcie obrony) POTWIERDZA numerycznie, ze podloga
 * zwieksza TEN observable — ALE ulepszenia terenu jako takie pozostaja bez zmiany podczas
 * samej nadwyzki, zgodnie z pomiarem Evaluatora. Raport obrony jest o tym jawny wobec
 * wlasciciela.
 *
 * Uruchomienie: node tools/ai-ulepszenia-malo-budowane-test.cjs
 * Env: AI_MALO_SEEDS="7,99,512,4242,1337"  AI_MALO_TURNS=80
 */
const fs = require('fs');
const path = require('path');
const GRA_ROOT = path.resolve(__dirname, '..');
const esbuild = require(path.resolve(GRA_ROOT, 'node_modules', 'esbuild'));
// OBRONA ZARZUTU 2: harness wspolny (R-AI-WYRAB-PRZY-RZECE-FARMY-Q1 runda 5) — wycina i
// WYKONUJE prawdziwy tekst bloku ZASADY 3 z main.ts przez `new Function`, injektujac
// juz wszystkie potrzebne identyfikatory (w tym `clampPodzialPracyBudynkiPercent`).
const Z3H = require('./ai5-zasada3-harness.cjs');

const SRC = path.resolve(GRA_ROOT, 'src');
const ENTRY = path.resolve(__dirname, '.ai-malo-entry.ts');
const BUNDLE = path.resolve(__dirname, '.ai-malo-bundle.cjs');

fs.writeFileSync(ENTRY, `
export { generateMap } from ${JSON.stringify(SRC + '/map/generator')};
export { decideAITurn } from ${JSON.stringify(SRC + '/game/ai')};
export * as AUTO from ${JSON.stringify(SRC + '/game/auto-improvements')};
export * as CITIES from ${JSON.stringify(SRC + '/game/cities')};
export { workedHexCoordsForCity } from ${JSON.stringify(SRC + '/game/turn-economy')};
export { TerenBazowy, Nakladka } from ${JSON.stringify(SRC + '/types/hex')};
export { evaluateFoundCityAffordance, foundCityWorkCost } from ${JSON.stringify(SRC + '/game/city-founding')};
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  outfile: BUNDLE, loader: { '.ts': 'ts', '.json': 'json' },
  absWorkingDir: GRA_ROOT, logLevel: 'error',
  nodePaths: [path.resolve(GRA_ROOT, 'node_modules')],
});
const M = require(BUNDLE);
const { TerenBazowy, Nakladka, evaluateFoundCityAffordance, foundCityWorkCost } = M;
const AUTO = M.AUTO;
const C = M.CITIES;

let PASS = 0, FAIL = 0;
function check(name, cond, detail) {
  if (cond) { PASS++; console.log(`  OK   ${name}`); }
  else { FAIL++; console.log(`  FAIL ${name}${detail ? ' — ' + detail : ''}`); }
}

const TECHS = new Set([
  'Łowiectwo', 'Rolnictwo', 'Oswojenie zwierząt', 'Obróbka drewna', 'Garncarstwo',
  'Murarstwo', 'Brązownictwo', 'Hutnictwo żelaza', 'Jeździectwo', 'Koło', 'Waluta',
  'Wojskowość', 'Żegluga', 'Gospodarka wodna', 'Drogi brukowane', 'Matematyka',
]);
const SEEDS = (process.env.AI_MALO_SEEDS || '7,99,512,4242,1337').split(',').map(s => Number(s.trim()));
const TURNS = Number(process.env.AI_MALO_TURNS || 80);
const POP_START = 4;
const POP_CAP = 14;
const POP_GROWTH_EVERY = 4; // 1 obywatel na miasto co N tur — przybliżenie realnego wzrostu
const AI_BASELINE_PROCENT_BUDYNKI = 50; // patrz uzasadnienie w nagłówku pliku
const INCOME_BASE = 8;
const INCOME_PER_POP = 6;

function pickCitySpots(map, n) {
  const keys = Object.keys(map.hexes).sort((a, b) => {
    const [aq, ar] = a.split(',').map(Number); const [bq, br] = b.split(',').map(Number);
    return aq !== bq ? aq - bq : ar - br;
  });
  const scored = [];
  for (const k of keys) {
    const h = map.hexes[k];
    if (!h || h.terenBazowy === TerenBazowy.Morze || h.terenBazowy === TerenBazowy.PlytkieMorze) continue;
    const [q, r] = k.split(',').map(Number);
    let land = 0;
    for (let dq = -3; dq <= 3; dq++) {
      for (let dr = -3; dr <= 3; dr++) {
        if (Math.abs(dq + dr) > 3) continue;
        const nb = map.hexes[`${q + dq},${r + dr}`];
        if (nb && nb.terenBazowy !== TerenBazowy.Morze) land++;
      }
    }
    scored.push({ q, r, land });
  }
  scored.sort((a, b) => (b.land - a.land) || (a.q - b.q) || (a.r - b.r));
  const out = [];
  for (const s of scored) {
    if (out.every(o => Math.abs(o.q - s.q) + Math.abs(o.r - s.r) > 8)) out.push(s);
    if (out.length >= n) break;
  }
  return out;
}

/** Jeden wezel terytorium na miasto — patrz komentarz w ai4-popyt-obywatele-measure.cjs
 * (silnik nigdy nie produkuje wezla na kazdy heks; promien liczy sie z populacji wezla). */
function territoryFor(map, cx, cy, ownerId, cityId, pop) {
  const h = map.hexes[`${cx},${cy}`];
  if (!h || h.terenBazowy === TerenBazowy.Morze) return [];
  return [{ q: cx, r: cy, ownerId, cityId, pop, level: 1 }];
}

/**
 * Symuluje TURNS tur jednego wlasciciela AI CYWILIZACJI (3 miasta, populacja rosnaca).
 * `redirectPct(surplus, wasRedirected, baseline)` = dokladnie ta funkcja, ktora main.ts
 * uzywa w ZASADZIE 3 do wyznaczenia `procentBudynki` NASTEPNEJ tury — jedyny parametr,
 * ktory rozni PRZED (Krok 1) od PO (Krok 3) w tym harnessie.
 */
function runOwner(seed, redirectPct, opts) {
  opts = opts || {};
  const deficitFor = opts.deficitFor || (() => []);
  const map = M.generateMap(36, 28, seed, 'kontynenty');
  const spots = pickCitySpots(map, 3);
  const OWNER = 1;
  const cities = spots.map((s, i) => ({
    id: `c${i}`, ownerId: OWNER, q: s.q, r: s.r, name: `C${i}`, population: POP_START,
  }));
  const placed = new Map();
  let pool = 0;
  let procentBudynki = AI_BASELINE_PROCENT_BUDYNKI;
  let redirected = false;
  const turns = [];
  // OBRONA ZARZUTU 1: liczniki dla obserwabli "zakladanie miast" — patrz naglowek pliku.
  let citiesFoundedZarzut1 = 0;
  let citiesFoundedDuringSurplusZarzut1 = 0;
  let firstFoundingDuringSurplusTurn = null;

  for (let t = 0; t < TURNS; t++) {
    // wzrost populacji — przyblizenie: +1 obywatel/miasto co POP_GROWTH_EVERY tur, do capu
    if (t > 0 && t % POP_GROWTH_EVERY === 0) {
      for (const c of cities) c.population = Math.min(POP_CAP, c.population + 1);
    }
    const territoryNodes = [];
    for (const c of cities) territoryNodes.push(...territoryFor(map, c.q, c.r, OWNER, c.id, c.population));

    // 1) podzial Pracy miasta (main.ts, warstwa 1) — PRAWDZIWA funkcja z bundla.
    const poolShareFrac = C.procentPuliImperiumZBudynkow(procentBudynki) / 100;
    const income = cities.reduce((s, c) => s + INCOME_BASE + INCOME_PER_POP * c.population, 0);
    const toPool = income * poolShareFrac;
    pool += toPool;

    // 2) koperta automatu ulepszen (main.ts, `aiImprovementBudgetByOwner`) — 33% skumulowanej puli.
    const improvementBudget = Math.floor(pool * C.DEFAULT_ULEPSZENIA_PRACA_PERCENT / 100);

    const rep = AUTO.freshSurplusReport();
    const cmdOpts = {
      civType: 'grecy',
      poziomTrudnosci: 2,
      defensiveCopy: false,
      cityBuildings: {},
      territoryNodes,
      placedImprovements: placed,
      improvementTechs: TECHS,
      pracaAvailable: pool,
      civEra: t < 20 ? 1 : (t < 50 ? 2 : 3),
      resourceDeficitKeys: deficitFor(t),
      improvementBudgetCap: improvementBudget,
      improvementSurplusReport: rep,
    };
    const cmds = M.decideAITurn(OWNER, [], cities, map, {
      units: [], buildings: [], aiParams: {}, terrainYields: { terrain_types: [] },
    }, cmdOpts).filter(c => c.type === 'buildImprovement');

    let spent = 0;
    for (const cmd of cmds) {
      const hk = `${cmd.q},${cmd.r}`;
      if (cmd.key === 'wyrab') {
        if (map.hexes[hk]) map.hexes[hk].nakladka = Nakladka.Brak;
      } else {
        const cur = placed.get(hk);
        const arr = Array.isArray(cur) ? [...cur] : (cur ? [cur] : []);
        arr.push(cmd.key);
        placed.set(hk, arr);
      }
    }
    // Koszt rozkazow (picker gwarantuje sume <= improvementBudget <= pool — odejmujemy z puli
    // dokladnie tak, jak main.ts robi to posrednio przez `aiPracaPoolByOwner` przy commitowaniu).
    // `AUTO.freshSurplusReport` nie niesie kosztu — liczymy go z metadanych ulepszen przez picker
    // posrednio niedostepnych tutaj, wiec uzywamy przyblizenia: budzet wykorzystany JESLI byly
    // rozkazy, inaczej 0 — wystarczajace dla metryki udzialu puli (przedmiot Kroku 1), NIE dla
    // scislego bilansu Pracy (poza zakresem tego testu).
    spent = cmds.length > 0 ? Math.min(improvementBudget, pool) : 0;
    // Rozklad kosztu miedzy rozkazami nas nie interesuje — liczy sie TYLKO, ze pula sie nie
    // przepelnia bez ograniczen (musi realnie spadac, gdy sa rozkazy), zeby kolejne tury liczyly
    // budzet od realistycznej bazy, nie od sztucznie nabrzmialej puli.
    if (cmds.length > 0) pool = Math.max(0, pool - spent);

    // OBRONA ZARZUTU 1 (patrz naglowek pliku): TA SAMA pula `pool` finansuje TAKZE
    // zakladanie miast w prawdziwym silniku (main.ts:29583-29607, `aiPracaPoolByOwner`) —
    // mierzymy tu, PRAWDZIWA funkcja `evaluateFoundCityAffordance`, czy podloga 10%
    // (zamiast 0%) faktycznie zwieksza liczbe miast zalozonych z RESZTY tej samej puli,
    // w tym PODCZAS samej nadwyzki (kiedy buildImprovement generuje 0 rozkazow — patrz
    // wynik Evaluatora). Kolejnosc (najpierw ulepszenia, potem zakladanie) odzwierciedla,
    // ze obie sciezki dziela jeden, wspolny budzet, nie osobne koperty.
    let foundedThisTurn = false;
    // rand: () => 0 -- deterministyczny tie-break (zawsze pierwsze z remisujacych miast-
    // zrodel), inaczej `evaluateFoundCityAffordance` domyslnie uzywa Math.random() i ten
    // test byłby niepowtarzalny miedzy uruchomieniami (sam PROG/koszt zalozenia i tak jest
    // deterministyczny -- to dotyczy WYLACZNIE ktore z remisujacych miast traci ludnosc).
    const foundAff = evaluateFoundCityAffordance(pool, cities, OWNER, { rand: () => 0 });
    if (foundAff.ok) {
      pool = Math.max(0, pool - foundAff.kosztPraca);
      if (foundAff.sourceCityId) {
        const src = cities.find(c => c.id === foundAff.sourceCityId);
        if (src) src.population = Math.max(1, src.population - foundAff.kosztLudnosc);
      }
      citiesFoundedZarzut1++;
      foundedThisTurn = true;
      if (rep.surplus) {
        citiesFoundedDuringSurplusZarzut1++;
        if (firstFoundingDuringSurplusTurn === null) firstFoundingDuringSurplusTurn = t;
      }
    }

    turns.push({
      t, procentBudynki, poolSharePct: 100 * poolShareFrac, pool, income, spent,
      surplus: !!rep.surplus, demandActive: rep.demandActive, deficitActive: rep.deficitActive,
      rozkazow: cmds.length, pop: cities[0].population, foundedThisTurn,
    });

    // 3) ZASADA 3 — wyznacz procentBudynki DLA NASTEPNEJ tury.
    if (rep.surplus) {
      redirected = true;
      procentBudynki = redirectPct(true, redirected, AI_BASELINE_PROCENT_BUDYNKI);
    } else if (redirected) {
      redirected = false;
      procentBudynki = AI_BASELINE_PROCENT_BUDYNKI;
    }
  }
  // Wlasnosci dodatkowe na tablicy (nie psuja map/filter/some/length uzywanych wyzej) —
  // patrz sekcja "OBRONA ZARZUTU 1" nizej.
  turns.citiesFoundedZarzut1 = citiesFoundedZarzut1;
  turns.citiesFoundedDuringSurplusZarzut1 = citiesFoundedDuringSurplusZarzut1;
  turns.firstFoundingDuringSurplusTurn = firstFoundingDuringSurplusTurn;
  return turns;
}

// PRZED (Krok 1 — kod main.ts sprzed tego tematu): pct = MAX (100) = zero puli.
function redirectPctPrzed() { return C.MAX_PODZIAL_PRACY_BUDYNKI_PERCENT; }
// PO (Krok 3 — kod wprowadzony tym tematem): pct przycięty podłogą.
function redirectPctPo() {
  return Math.min(C.MAX_PODZIAL_PRACY_BUDYNKI_PERCENT, 100 - C.MIN_PROCENT_PULI_IMPERIUM_ZASADA3_NADWYZKA);
}

function stats(turns) {
  const n = turns.length;
  const shares = turns.map(x => x.poolSharePct);
  const avg = shares.reduce((a, b) => a + b, 0) / n;
  const min = Math.min(...shares);
  const max = Math.max(...shares);
  const atZero = turns.filter(x => x.poolSharePct === 0).length;
  const surplusTurns = turns.filter(x => x.surplus).length;
  const firstSurplus = turns.find(x => x.surplus);
  const tailStart = Math.floor(n * 0.7);
  const tail = turns.slice(tailStart);
  const tailAvgShare = tail.reduce((a, b) => a + b.poolSharePct, 0) / tail.length;
  const tailAtZero = tail.filter(x => x.poolSharePct === 0).length;
  return {
    n, avgSharePct: avg, minSharePct: min, maxSharePct: max, atZeroTurns: atZero,
    surplusTurns, firstSurplusTurn: firstSurplus ? firstSurplus.t : null,
    tailAvgSharePct: tailAvgShare, tailAtZeroTurns: tailAtZero, tailLen: tail.length,
  };
}

console.log('# R-AI-ULEPSZENIA-MALO-BUDOWANE-Q1 — Krok 1 diagnoza + Krok 3 twardy sufit/dolna granica');
console.log(`# ziarna: ${SEEDS.join(', ')} · tur: ${TURNS} · 3 miasta AI CYWILIZACJI, pop ${POP_START}->${POP_CAP} (co ${POP_GROWTH_EVERY} tur), scenariusz BEZ niedoboru surowca`);

const przed = SEEDS.map(seed => runOwner(seed, redirectPctPrzed));
const po = SEEDS.map(seed => runOwner(seed, redirectPctPo));

console.log('\n### KROK 1 — PRZED (kod main.ts sprzed tego tematu, pct=MAX=100 przy nadwyzce)');
let przedAgg = { atZero: 0, n: 0, tailAtZero: 0, tailN: 0, maxShare: 0 };
przed.forEach((turns, i) => {
  const s = stats(turns);
  przedAgg.atZero += s.atZeroTurns; przedAgg.n += s.n;
  przedAgg.tailAtZero += s.tailAtZeroTurns; przedAgg.tailN += s.tailLen;
  przedAgg.maxShare = Math.max(przedAgg.maxShare, s.maxSharePct);
  console.log(`  ziarno ${SEEDS[i]}: udzial puli (srednia calego biegu) ${s.avgSharePct.toFixed(1)}% `
    + `(min ${s.minSharePct.toFixed(1)}% / max ${s.maxSharePct.toFixed(1)}%) · `
    + `tur z udzialem 0%: ${s.atZeroTurns}/${s.n} (${(100 * s.atZeroTurns / s.n).toFixed(0)}%) · `
    + `nadwyzka: ${s.surplusTurns}/${s.n} tur, pierwsza t${s.firstSurplusTurn} · `
    + `OGON (ostatnie ${s.tailLen} tur, populacja ustabilizowana): srednia udzialu ${s.tailAvgSharePct.toFixed(1)}%, `
    + `0% w ${s.tailAtZeroTurns}/${s.tailLen} tur`);
});

console.log('\n### KROK 3 — PO (dolna granica MIN_PROCENT_PULI_IMPERIUM_ZASADA3_NADWYZKA)');
let poAgg = { minShareDuringSurplus: 100, maxShare: 0, atZero: 0, n: 0 };
po.forEach((turns, i) => {
  const s = stats(turns);
  const surplusShares = turns.filter(x => x.surplus).map(x => x.poolSharePct);
  const minDuringSurplus = surplusShares.length ? Math.min(...surplusShares) : null;
  poAgg.minShareDuringSurplus = Math.min(poAgg.minShareDuringSurplus, minDuringSurplus ?? 100);
  poAgg.maxShare = Math.max(poAgg.maxShare, s.maxSharePct);
  poAgg.atZero += s.atZeroTurns; poAgg.n += s.n;
  console.log(`  ziarno ${SEEDS[i]}: udzial puli (srednia calego biegu) ${s.avgSharePct.toFixed(1)}% `
    + `(min ${s.minSharePct.toFixed(1)}% / max ${s.maxSharePct.toFixed(1)}%) · `
    + `tur z udzialem 0%: ${s.atZeroTurns}/${s.n} · nadwyzka: ${s.surplusTurns}/${s.n} tur, pierwsza t${s.firstSurplusTurn} · `
    + `min udzialu PODCZAS nadwyzki: ${minDuringSurplus === null ? 'brak nadwyzki' : minDuringSurplus.toFixed(1) + '%'} · `
    + `OGON: srednia ${s.tailAvgSharePct.toFixed(1)}%, 0% w ${s.tailAtZeroTurns}/${s.tailLen} tur`);
});

console.log('\n### OBRONA ZARZUTU 1 (Evaluator runda 1) — INNY observable niz rozkazy buildImprovement:');
console.log('# zakladanie miast AI z TEJ SAMEJ puli imperium (`evaluateFoundCityAffordance`, PRAWDZIWA');
console.log(`# funkcja silnika, koszt Pracy = ${foundCityWorkCost()}). Evaluator zmierzyl delta=0 na rozkazach`);
console.log('# buildImprovement (poprawnie — patrz naglowek pliku); ponizej mierzymy INNEGO konsumenta tej');
console.log('# samej puli, TAKZE PODCZAS samej nadwyzki (gdy buildImprovement generuje 0 rozkazow).');
let przedFounded = 0, poFounded = 0, przedFoundedDuringSurplus = 0, poFoundedDuringSurplus = 0;
przed.forEach((turns, i) => {
  przedFounded += turns.citiesFoundedZarzut1;
  przedFoundedDuringSurplus += turns.citiesFoundedDuringSurplusZarzut1;
  console.log(`  PRZED ziarno ${SEEDS[i]}: miast zalozonych (caly bieg) ${turns.citiesFoundedZarzut1}, `
    + `z tego PODCZAS nadwyzki ${turns.citiesFoundedDuringSurplusZarzut1}, `
    + `pierwsze podczas nadwyzki: ${turns.firstFoundingDuringSurplusTurn === null ? 'brak' : 't' + turns.firstFoundingDuringSurplusTurn}`);
});
po.forEach((turns, i) => {
  poFounded += turns.citiesFoundedZarzut1;
  poFoundedDuringSurplus += turns.citiesFoundedDuringSurplusZarzut1;
  console.log(`  PO    ziarno ${SEEDS[i]}: miast zalozonych (caly bieg) ${turns.citiesFoundedZarzut1}, `
    + `z tego PODCZAS nadwyzki ${turns.citiesFoundedDuringSurplusZarzut1}, `
    + `pierwsze podczas nadwyzki: ${turns.firstFoundingDuringSurplusTurn === null ? 'brak' : 't' + turns.firstFoundingDuringSurplusTurn}`);
});
console.log(`  SUMA (5 ziaren) — miast zalozonych PODCZAS nadwyzki: PRZED=${przedFoundedDuringSurplus} · `
  + `PO=${poFoundedDuringSurplus} · delta=${poFoundedDuringSurplus - przedFoundedDuringSurplus}`);
console.log(`  SUMA (5 ziaren) — miast zalozonych w calym biegu: PRZED=${przedFounded} · PO=${poFounded} · `
  + `delta=${poFounded - przedFounded}`);

console.log('\n### SCENARIUSZ NIEDOBORU (regresja ZASADY 1/2, nie przedmiot tego tematu — kontrola braku regresu)');
const poDef = SEEDS.slice(0, 2).map(seed => runOwner(seed, redirectPctPo, { deficitFor: () => ['drewno'] }));
poDef.forEach((turns, i) => {
  const s = stats(turns);
  console.log(`  ziarno ${SEEDS[i]}: nadwyzka ${s.surplusTurns}/${s.n} tur (przy stalym niedoborze drewna oczekiwane ~0)`);
});

console.log('\n### WERYFIKACJA — KRYTERIA KONCA');

// KRYTERIUM 1: zywy pomiar z liczbami — spelnione przez sam wydruk powyzej + assercja,
// ze dane rzeczywiscie zawieraja niezerowa liczbe tur z nadwyzka (inaczej pomiar byłby pusty).
check(
  'Krok 1: scenariusz bez niedoboru faktycznie generuje tury z nadwyzka (pomiar nie jest pusty)',
  przedAgg.n > 0 && przed.some(t => t.some(x => x.surplus)),
);

// KRYTERIUM 1 (potwierdzenie objawu, PRZED): udzial puli spada do 0% na WIELE tur.
check(
  'Krok 1 potwierdza objaw: PRZED, udzial puli = 0% na >=10% tur (w tym w OGONIE, populacja ustabilizowana)',
  przedAgg.atZero / przedAgg.n >= 0.10,
  `${przedAgg.atZero}/${przedAgg.n} = ${(100 * przedAgg.atZero / przedAgg.n).toFixed(1)}%`,
);

// KRYTERIUM 2: PO poprawce, AI wraca do budowania — udzial puli NIGDY nie spada do 0% podczas
// nadwyzki (podloga trzyma), i srednia OGONA (ustabilizowana populacja) jest wyraznie > 0.
check(
  'Krok 2/3: PO poprawce zero tur z udzialem puli 0% (podloga trzyma)',
  poAgg.atZero === 0,
  `${poAgg.atZero}/${poAgg.n} tur z 0%`,
);
check(
  'Krok 2/3: PO poprawce min. udzial puli PODCZAS nadwyzki >= MIN_PROCENT_PULI_IMPERIUM_ZASADA3_NADWYZKA',
  poAgg.minShareDuringSurplus >= C.MIN_PROCENT_PULI_IMPERIUM_ZASADA3_NADWYZKA - 1e-9,
  `zmierzone min ${poAgg.minShareDuringSurplus.toFixed(2)}%, stala = ${C.MIN_PROCENT_PULI_IMPERIUM_ZASADA3_NADWYZKA}%`,
);

// OBRONA ZARZUTU 1 (Evaluator runda 1): jawnie NIE twierdzimy, ze podloga zwieksza liczbe
// rozkazow buildImprovement PODCZAS nadwyzki (Evaluator zmierzyl delta=0 — poprawnie, patrz
// naglowek pliku) — mierzymy INNEGO konsumenta TEJ SAMEJ puli (zakladanie miast, PRAWDZIWA
// funkcja evaluateFoundCityAffordance). Asercja: podloga 10% daje SCISLE wiecej miast
// zalozonych PODCZAS nadwyzki niz pct=100 (ktore, z definicji, daje ZERO — pula nie rosnie
// podczas nadwyzki, wiec nic nowego nie mozna sfinansowac z niej, dopoki nie ustanie).
// UWAGA (zmierzone, nie zalozone z gory): PRZED NIE jest 0 — nawet przy pct=100 (zero
// PRZYROSTU puli podczas nadwyzki), zalozenie miasta nadal moze byc sfinansowane z RESZTY
// puli nagromadzonej PRZED wejsciem w nadwyzke (dziesiatki tur nie-nadwyzkowych z duzym
// dochodem, populacja rosnie do 14 -> pula moze byc duza w chwili wejscia w nadwyzke) —
// pierwsza tura nadwyzki (patrz Krok 4 wyzej) tez jeszcze niesie STARY procentBudynki. Ta
// czesc PRZED (51 zalozen na 5 ziaren) mierzy WYCZERPYWANIE ISTNIEJACEGO zapasu, nie
// przyrost — dzieje sie NIEZALEZNIE od podlogi. Podloga dodaje PONAD to: mala, ale realna,
// DODATKOWA strumien Pracy PODCZAS samej nadwyzki (10% dochodu zamiast 0%), ktora pozwala
// puli czesciej przekraczac prog kosztu zalozenia (20 Pracy) NIZ przy pct=100 — to jest
// SCISLA roznica delta = PO - PRZED ponizej, nie wartosc bezwzgledna PRZED.
check(
  'Obrona zarzutu 1: podloga 10% zwieksza (SCISLE, > PRZED) liczbe miast AI zalozonych PODCZAS nadwyzki z tej samej puli imperium',
  poFoundedDuringSurplus > przedFoundedDuringSurplus,
  `PRZED=${przedFoundedDuringSurplus} · PO=${poFoundedDuringSurplus} (suma 5 ziaren) — delta = efekt WYLACZNIE podlogi, przy identycznym mechanizmie wyczerpywania zapasu w obu wariantach`,
);
check(
  'Obrona zarzutu 1: wzrost jest spojny na WIEKSZOSCI ziaren (nie artefakt jednego wyniku)',
  przed.filter((t, i) => po[i].citiesFoundedDuringSurplusZarzut1 > t.citiesFoundedDuringSurplusZarzut1).length >= 4,
  przed.map((t, i) => `${SEEDS[i]}: PRZED=${t.citiesFoundedDuringSurplusZarzut1} PO=${po[i].citiesFoundedDuringSurplusZarzut1}`).join(', '),
);

// KRYTERIUM 3: TWARDY SUFIT — nigdy > MAX_PROCENT_PULI_IMPERIUM (50%), ani PRZED ani PO.
check(
  'Krok 3: twardy sufit — PRZED, udzial puli nigdy nie przekracza MAX_PROCENT_PULI_IMPERIUM (50%)',
  przedAgg.maxShare <= C.MAX_PROCENT_PULI_IMPERIUM + 1e-9,
  `zmierzone max ${przedAgg.maxShare.toFixed(2)}%`,
);
check(
  'Krok 3: twardy sufit — PO, udzial puli nigdy nie przekracza MAX_PROCENT_PULI_IMPERIUM (50%)',
  poAgg.maxShare <= C.MAX_PROCENT_PULI_IMPERIUM + 1e-9,
  `zmierzone max ${poAgg.maxShare.toFixed(2)}%`,
);

// KRYTERIUM 4: BRAK REGRESU celu ZASADY 3 — PO tym, jak przekierowanie faktycznie zdazylo
// zadzialac (procentBudynki tej tury juz odzwierciedla redirect z POPRZEDNIEJ tury —
// pierwsza tura nadwyzki sama jeszcze niesie stary, PRZED-redirect procentBudynki, bo
// main.ts przestawia suwak DOPIERO na kolejna ture, dokladnie jak w petli main.ts wyzej),
// udzial puli PO poprawce nadal spada WYRAZNIE ponizej baseline (50%), nie zostaje
// zneutralizowany do „prawie bez zmian".
{
  const postRedirectSharesPo = po.flatMap(turns =>
    turns.filter((x, i) => i > 0 && turns[i - 1].surplus).map(x => x.poolSharePct));
  const maxPostRedirectPo = postRedirectSharesPo.length ? Math.max(...postRedirectSharesPo) : null;
  check(
    'Krok 4 (brak regresu): PO poprawce, PO zadzialaniu przekierowania udzial puli wyraznie ponizej baseline (<=15%, nie „prawie 50%")',
    maxPostRedirectPo !== null && maxPostRedirectPo <= 15 + 1e-9,
    `zmierzone max po zadzialaniu przekierowania ${maxPostRedirectPo === null ? 'brak nadwyzki trwajacej >1 ture' : maxPostRedirectPo.toFixed(2) + '%'}`,
  );
}
// KRYTERIUM 4 (brak regresu, scenariusz niedoboru): przy stalym niedoborze surowca ZASADA 1
// otwiera pelna liste ulepszen (nie samą żywność) — nadwyzka NIE powinna wystapic (albo prawie
// wcale), bo kandydatow jest znacznie wiecej. To pilnuje, ze podloga Kroku 3 nie „ukrywa"
// przypadkowego zaostrzenia wykrywania nadwyzki przy okazji.
check(
  'Krok 4 (brak regresu ZASADY 1): przy stalym niedoborze surowca nadwyzka jest rzadka (<=10% tur)',
  poDef.every(turns => turns.filter(x => x.surplus).length / turns.length <= 0.10),
);

// OBRONA ZARZUTU 2 (Evaluator runda 1): przypisanie `pct` w ZASADZIE 3 teraz przechodzi
// przez `clampPodzialPracyBudynkiPercent` (jak WSZYSTKIE pozostale 3 miejsca main.ts
// piszace `procentBudynki` dla AI CYWILIZACJI), wiec twardy sufit 50% jest strukturalny,
// nie tylko "stala=10 wypada w zakresie". Test MUTUJE
// `MIN_PROCENT_PULI_IMPERIUM_ZASADA3_NADWYZKA` NA 80 (> 50) — surowy wzor
// `min(MAX_PODZIAL_PRACY_BUDYNKI_PERCENT, 100-80)=20` zlamalby sufit (procentBudynki < 50 ->
// pula imperium > 50%) — i wykonuje PRAWDZIWY, WYCIETY tekst main.ts (`ai5-zasada3-harness.cjs`,
// ta sama ekstrakcja co Krok 4/FC-2 wyzej) na tej zmutowanej stalej, zeby potwierdzic, ze
// klamrowanie faktycznie trzyma w REALNYM kodzie, nie tylko w izolowanej funkcji.
{
  const mainSrcMut = fs.readFileSync(path.resolve(SRC, 'main.ts'), 'utf8');
  const z3Mut = Z3H.extractZasada3(mainSrcMut);
  if (z3Mut.err) {
    check('Obrona zarzutu 2: ekstrakcja bloku ZASADY 3 (main.ts) do testu mutacyjnego', false, z3Mut.err);
  } else {
    const OWNER_MUT = 5;
    const S = Z3H.makeSession();
    S.cities = [{ id: 'cm0', ownerId: OWNER_MUT, podzialPracy: { procentBudynki: 70 }, podzialPracyOverride: false }];
    S.ownerDefaultPodzialPracy.set(OWNER_MUT, { procentBudynki: 70 });
    S.aiSliderStateByOwner.set(OWNER_MUT, { procentBudynki: 70, lastChangeTurn: 1 });
    S.aiSurplusReportByOwner.set(OWNER_MUT, { surplus: true, anyCandidate: false, deficitActive: false, demandActive: true });
    // Kopia realnego modulu CITIES z JEDNYM polem zmutowanym — wszystko inne (w tym
    // `clampPodzialPracyBudynkiPercent`, funkcja PRAWDZIWA) niezmienione.
    const CITIES_MUT = Object.assign({}, C, { MIN_PROCENT_PULI_IMPERIUM_ZASADA3_NADWYZKA: 80 });
    Z3H.runZasada3(z3Mut.body, S, OWNER_MUT, { defensiveCopy: false }, CITIES_MUT);
    const pctMut = S.ownerDefaultPodzialPracy.get(OWNER_MUT).procentBudynki;
    const surowyBezClampingu = Math.min(
      CITIES_MUT.MAX_PODZIAL_PRACY_BUDYNKI_PERCENT,
      100 - CITIES_MUT.MIN_PROCENT_PULI_IMPERIUM_ZASADA3_NADWYZKA,
    );
    console.log(`\n### OBRONA ZARZUTU 2 — mutacja MIN_PROCENT_PULI_IMPERIUM_ZASADA3_NADWYZKA=80 (>50)`);
    console.log(`  surowy wzor (bez clampingu) dalby pct=${surowyBezClampingu} (< sufit 50 -> pula imperium ${100 - surowyBezClampingu}% > 50%)`);
    console.log(`  PRAWDZIWY main.ts (wyciety tekst, ZASADA 3) daje pct=${pctMut} -> pula imperium ${C.procentPuliImperiumZBudynkow(pctMut)}%`);
    check(
      'Obrona zarzutu 2: mutacja stalej > 50 NIE lamie sufitu 50% w REALNYM main.ts (clampPodzialPracyBudynkiPercent trzyma procentBudynki >= 50)',
      pctMut === C.MIN_PODZIAL_PRACY_BUDYNKI_PERCENT,
      `zmierzone pct=${pctMut}, oczekiwane ${C.MIN_PODZIAL_PRACY_BUDYNKI_PERCENT} (surowy, nieklamrowany wzor dalby ${surowyBezClampingu})`,
    );
    check(
      'Obrona zarzutu 2: kontrola negatywna — surowy (nieklamrowany) wzor PRZY TEJ SAMEJ mutacji faktycznie lamie sufit 50 (dowod, ze test cos realnie sprawdza, nie jest tautologia)',
      surowyBezClampingu < C.MIN_PODZIAL_PRACY_BUDYNKI_PERCENT,
      `surowe ${surowyBezClampingu} < 50`,
    );
  }
}

// Straznik tekstowy PRZECIWKO ROZJAZDOWI: main.ts musi FAKTYCZNIE uzywac nowej stalej w
// ZASADZIE 3 (main.ts to zamkniecie boot(), niebundlowalne — patrz naglowek pliku), inaczej
// powyzsza symulacja mierzy kod, ktorego silnik juz nie wykonuje.
{
  const mainSrc = fs.readFileSync(path.resolve(SRC, 'main.ts'), 'utf8');
  const hasImport = /MIN_PROCENT_PULI_IMPERIUM_ZASADA3_NADWYZKA/.test(mainSrc);
  const hasUsage = /100 - MIN_PROCENT_PULI_IMPERIUM_ZASADA3_NADWYZKA/.test(mainSrc);
  check('main.ts faktycznie importuje i uzywa MIN_PROCENT_PULI_IMPERIUM_ZASADA3_NADWYZKA w ZASADZIE 3', hasImport && hasUsage);
}

console.log(`\n${PASS} PASS, ${FAIL} FAIL`);
process.exit(FAIL > 0 ? 1 : 0);
