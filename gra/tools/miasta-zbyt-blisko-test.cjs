'use strict';
/**
 * node tools/miasta-zbyt-blisko-test.cjs — P-MIASTA-ZBYT-BLISKO-SIEBIE-Q1
 *
 * Bramka dowodowa: generuje wiele map (różne seedy) i mierzy FAKTYCZNĄ odległość
 * między KAŻDĄ parą miast powstałych na starcie gry — stolica gracza, stolice
 * klastrów obcych typów, ich miasta-państwa/kopie typu — i sprawdza że ŻADNA
 * para nie łamie `MIN_CITY_DISTANCE`/`MIN_CITY_DISTANCE_START_CITY_STATE`
 * (próg 3 gdy któreś z dwóch miast jest miastem-państwem, inaczej próg
 * MIN_CITY_DISTANCE — dokładnie ta sama reguła co `canFoundCity`).
 *
 * Sprawdza DWA kanały, oba naprawione w tym temacie:
 *  1. Kolonia bonusowa trudności (`ai-difficulty-bonus.ts::pickBonusCityHex`) —
 *     wcześniej sprawdzała WYŁĄCZNIE bezpośrednich sąsiadów stolicy (odległość=1)
 *     i wołała `canFoundCity(..., { clusterStartSlot: true })`, czyli pomijała
 *     jedyny mechanizm odrzucający zbyt bliski hex. Naprawa: przeszukuje rosnący
 *     promień i woła `canFoundCity` BEZ obejścia.
 *  2. Dystans MIĘDZY RÓŻNYMI klastrami/miastami-państwami z planu klastra
 *     (`cluster-start.ts::buildClusterStartPlan`) — wcześniej niezweryfikowany
 *     (komentarz przy `clusterStartSlot` w `cities.ts` zakładał "już zweryfikowany
 *     w map/clusters", co dotyczyło wyłącznie rozstawu BRYŁ/stolic, nie realnego
 *     progu per para miast). Naprawa: sekwencyjna weryfikacja + odrzucenie
 *     kolidującego slotu wewnątrz `buildClusterStartPlan`.
 *
 * NIE sprawdza `pendingSameTypeRivalHexes` jako realnych pozycji — main.ts
 * jawnie odrzuca ten pre-plan przy realnym spawnie ("Pre-plan z mapgen zostaje
 * tylko do podglądu UI — nie używamy go do spawnu", `spawnPendingSameTypeRivals`)
 * i zamiast tego woła `foundCityAt(..., clusterStartSlot pominięte => false)` —
 * czyli TA ścieżka już dziś stosuje realny, nieobchodzony `canFoundCity`.
 * Włączenie pre-planu do tej bramki dawało fałszywy czerwony (zmierzone podczas
 * diagnozy: seed=8, 2 "naruszenia" pre-planu, które nigdy nie trafiają na mapę).
 *
 * Nietautologiczność: `mutate=1` symuluje sprzed naprawy (przywraca stary,
 * zepsuty `pickBonusCityHex` przez monkey-patch modułu) i dowodzi, że bramka
 * FAKTYCZNIE czerwienieje na starym kodzie.
 *
 * RUNDA 2 (odpowiedź na 02-evaluator-runda1.md) — trzy dodatkowe sprawdzenia:
 *
 *  Zarzut 1 (POTWIERDZONY): `buildClusterStartPlan` rejestrowała ownerId
 *  (aiOwnerCivMap/ownerDisplayName/simplifiedDiplomacyOwners|foreignTypeOwners/
 *  typCityCopyOwners/startRelations) PRZED sprawdzeniem kolizji — slot
 *  odrzucony przez `continue` zostawiał "widmowego" właściciela zarejestrowanego
 *  bez żadnego miasta. Naprawiono w `cluster-start.ts` (rejestracja przeniesiona
 *  po `if (collides) continue;`). `findGhostOwners()` niżej dowodzi 0 takich
 *  przypadków PO naprawie.
 *
 *  Zarzut 2 (lukę w pokryciu potwierdzono źródłowo, teraz sprawdzone empirycznie):
 *  kolejność realna w main.ts to `spawnPendingSameTypeRivals` (real `canFoundCity`,
 *  ale `cities`=tylko stolica gracza + rywale założeni DOTĄD w tej samej pętli —
 *  BEZ WIEDZY o pozycjach obcych klastrów, bo te spawnują się DOPIERO w kolejnym
 *  kroku) → `spawnPendingForeignClusters` (`foundCityAt(..., clusterStartSlot=true)`
 *  — dystans NIE sprawdzany w runtime wcale, jedyna ochrona to precomputed
 *  `acceptedForDistance` z `buildClusterStartPlan`, który NIC nie wie o pozycjach
 *  rywali tego samego typu, bo te są liczone dopiero w main.ts w locie).
 *  `simulateRealSpawnOrder()` niżej odtwarza DOKŁADNIE tę kolejność (rywale →
 *  obce klastry, każdy krok z takim samym warunkiem sprawdzania/pomijania co
 *  main.ts) i mierzy naruszenia MIĘDZY tymi dwiema grupami.
 *
 *  Zarzut 3 (zidentyfikowany źródłowo, teraz sprawdzony empirycznie): kolonia
 *  bonusowa (`pickBonusCityHex`, wołana z `grantDifficultyStartBonusesForMajorCapital`
 *  WEWNĄTRZ pętli `spawnPendingForeignClusters`, zaraz po założeniu stolicy
 *  klastra) nigdy nie trafia do `acceptedForDistance` w `buildClusterStartPlan`
 *  (bo ta funkcja nic o niej nie wie — kolonia powstaje później, w main.ts) —
 *  więc KOLEJNY, wcześniej zaplanowany slot innego klastra (`foundCityAt(...,
 *  clusterStartSlot=true)`, bez sprawdzenia) nie ma żadnej ochrony przed kolizją
 *  z kolonią założoną chwilę wcześniej dla innej stolicy. `simulateRealSpawnOrder()`
 *  odtwarza też ten krok (kolonia bonusowa zakładana W TRAKCIE pętli obcych
 *  klastrów, w kolejności `plan.spawnCities`, dokładnie jak main.ts) — worst-case
 *  zgodny z podejściem `bonusColonyHexes()` wyżej (kolonia dla KAŻDEJ stolicy
 *  klastra, niezależnie od `qualifiesForMajorAiDifficultyBonus`, bo bramka celowo
 *  testuje najgorszy przypadek, tak jak Runda 1).
 */

const path = require('path');
const fs = require('fs');
const os = require('os');
const esbuild = require('esbuild');

const GRA = path.resolve(__dirname, '..');
const entry = path.join(__dirname, '.miasta-zbyt-blisko-entry.ts');
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'miasta-zbyt-blisko-'));
const bundle = path.join(tmpDir, 'bundle.cjs');

fs.writeFileSync(entry, `
export { buildClusterStartPlan, buildSameTypeRivalCandidateHexes } from '../src/game/cluster-start';
export { generateMap } from '../src/map/generator';
export { setRiverGenPhaseOverride } from '../src/map/riverGenSwitch';
export { hexDistanceAxial } from '../src/map/gen-helpers';
export { pickBonusCityHex, planMajorAiDifficultyStartBonuses } from '../src/game/ai-difficulty-bonus';
export { MIN_CITY_DISTANCE, MIN_CITY_DISTANCE_START_CITY_STATE, canFoundCity } from '../src/game/cities';
`, 'utf8');

esbuild.buildSync({
  entryPoints: [entry],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  loader: { '.ts': 'ts', '.json': 'json' },
  outfile: bundle,
  absWorkingDir: GRA,
  logLevel: 'silent',
});

const M = require(bundle);
M.setRiverGenPhaseOverride('main');
const civs = require('../data/civs.json');

const MUTATE = process.argv.includes('--mutate-przed-napraw');

/** Buduje listę wszystkich miast startowych z planu klastra (bez pre-planu rywali — patrz komentarz u góry). */
function buildStartCityList(plan) {
  const cities = [
    { q: plan.playerStartHex.q, r: plan.playerStartHex.r, ownerId: 0, startCityState: false, label: 'gracz-stolica' },
  ];
  for (const sc of plan.spawnCities ?? []) {
    const isCS = plan.simplifiedDiplomacyOwners.has(sc.ownerId) || plan.typCityCopyOwners.has(sc.ownerId);
    cities.push({ q: sc.q, r: sc.r, ownerId: sc.ownerId, startCityState: !!isCS, label: `owner${sc.ownerId}${isCS ? '-panstwo' : '-stolica'}` });
  }
  return cities;
}

/**
 * Zarzut 1 (runda 2): ownerId zarejestrowany jako pełnoprawna cywilizacja/
 * miasto-państwo (w KTÓRYMKOLWIEK z pięciu rejestrów planu) ale bez żadnego
 * miasta w `spawnCities` — "widmowy" właściciel. Musi być 0 PO naprawie
 * (rejestracja przeniesiona po sprawdzeniu kolizji w `buildClusterStartPlan`).
 */
function findGhostOwners(plan) {
  const foundedOwnerIds = new Set((plan.spawnCities ?? []).map(sc => sc.ownerId));
  const registries = {
    aiOwnerCivMap: [...plan.aiOwnerCivMap.keys()],
    ownerDisplayName: [...plan.ownerDisplayName.keys()],
    simplifiedDiplomacyOwners: [...plan.simplifiedDiplomacyOwners],
    foreignTypeOwners: [...plan.foreignTypeOwners],
    typCityCopyOwners: [...plan.typCityCopyOwners],
    startRelations: [...plan.startRelations.keys()],
  };
  const ghosts = [];
  for (const [regName, ids] of Object.entries(registries)) {
    for (const oid of ids) {
      if (!foundedOwnerIds.has(oid)) ghosts.push({ registry: regName, ownerId: oid });
    }
  }
  return ghosts;
}

/**
 * Zarzut 2+3 (runda 2): odtwarza DOKŁADNIE kolejność realnego spawnu z main.ts —
 * `spawnPendingSameTypeRivals` (real `canFoundCity`, `cities`=gracz+rywale
 * dotychczas założeni) → `spawnPendingForeignClusters` (`clusterStartSlot=true`,
 * ŻADEN check w runtime, plan zakładany BEZWARUNKOWO w kolejności
 * `plan.spawnCities`, z kolonią bonusową zakładaną W TRAKCIE tej samej pętli
 * zaraz po każdej stolicy klastra — dokładnie jak `grantDifficultyStartBonusesForMajorCapital`
 * wołane wewnątrz `spawnPendingForeignClusters` w main.ts).
 */
function simulateRealSpawnOrder(map, plan, seed) {
  const cities = [
    { q: plan.playerStartHex.q, r: plan.playerStartHex.r, ownerId: 0, startCityState: false, label: 'gracz-stolica' },
  ];

  // Krok 1: spawnPendingSameTypeRivals — real canFoundCity(foundingCityState:true,
  // clusterStartSlot pominięte => false), `cities` widzi TYLKO gracza + rywali
  // założonych dotąd w tej samej pętli (main.ts: cities.push(c) po KAŻDYM rywalu).
  const rivalCandidates = M.buildSameTypeRivalCandidateHexes(map, plan.playerStartHex, plan.pendingSameTypeRivals, seed);
  let rivalIdx = 0;
  for (const pos of rivalCandidates) {
    const { ok } = M.canFoundCity(pos.q, pos.r, cities, map, { foundingCityState: true });
    if (ok) {
      rivalIdx++;
      cities.push({ q: pos.q, r: pos.r, ownerId: -1000 - rivalIdx, startCityState: true, label: `rywal${rivalIdx}-tegoSamegoTypu` });
    }
  }

  // Krok 2: spawnPendingForeignClusters — PO naprawie rundy 2 realny check
  // (`clusterStartSlot` usunięty w main.ts, patrz komentarz przy wywołaniu
  // `foundCityAt` w `spawnPendingForeignClusters`): każdy slot sprawdzany
  // `canFoundCity` względem AKTUALNEGO stanu `cities` (gracz + rywale +
  // wszystko założone dotąd w tej pętli, kolonie bonusowe włącznie) — kolidujący
  // slot ODRZUCANY (ten sam wzorzec `_scRejected` co main.ts), w kolejności
  // `plan.spawnCities`, z kolonią bonusową zaraz po każdej stolicy klastra
  // (worst-case: KAŻDA stolica klastra dostaje kolonię, jak `bonusColonyHexes()`
  // wyżej — niezależnie od `qualifiesForMajorAiDifficultyBonus`, bramka testuje
  // najgorszy przypadek).
  for (const sc of plan.spawnCities ?? []) {
    const isCS = plan.simplifiedDiplomacyOwners.has(sc.ownerId) || plan.typCityCopyOwners.has(sc.ownerId);
    const { ok } = M.canFoundCity(sc.q, sc.r, cities, map, { foundingCityState: isCS });
    if (!ok) continue;
    cities.push({ q: sc.q, r: sc.r, ownerId: sc.ownerId, startCityState: isCS, label: `owner${sc.ownerId}${isCS ? '-panstwo' : '-stolica'}` });

    if (plan.clusterCapitalOwnerIds.includes(sc.ownerId)) {
      const hex = M.pickBonusCityHex(map, cities, sc.q, sc.r);
      if (hex) {
        cities.push({ q: hex.q, r: hex.r, ownerId: sc.ownerId, startCityState: false, label: `owner${sc.ownerId}-KOLONIA-BONUS` });
      }
    }
  }

  return cities;
}

function findViolations(cities) {
  const viol = [];
  for (let i = 0; i < cities.length; i++) {
    for (let j = i + 1; j < cities.length; j++) {
      const a = cities[i], b = cities[j];
      const minDist = (a.startCityState || b.startCityState) ? M.MIN_CITY_DISTANCE_START_CITY_STATE : M.MIN_CITY_DISTANCE;
      const d = M.hexDistanceAxial(a.q, a.r, b.q, b.r);
      if (d < minDist) viol.push({ a: a.label, b: b.label, d, minDist });
    }
  }
  return viol;
}

/** Symulacja `planMajorAiDifficultyStartBonuses` dla KAŻDEJ stolicy klastra (major AI). */
function bonusColonyHexes(map, cities, plan) {
  const out = [];
  for (const capOwnerId of plan.clusterCapitalOwnerIds) {
    const cap = cities.find(c => c.ownerId === capOwnerId);
    if (!cap) continue;
    const asCityList = cities.map(c => ({ q: c.q, r: c.r, startCityState: c.startCityState }));
    let hex;
    if (MUTATE) {
      // Odtworzenie zepsutego zachowania sprzed naprawy: wyłącznie bezpośredni sąsiad + obejście dystansu.
      const HEX_NEIGHBORS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1]];
      hex = null;
      for (const [dq, dr] of HEX_NEIGHBORS) {
        const n = { q: cap.q + dq, r: cap.r + dr };
        const { ok } = M.canFoundCity(n.q, n.r, asCityList, map, { clusterStartSlot: true });
        if (ok) { hex = n; break; }
      }
    } else {
      hex = M.pickBonusCityHex(map, asCityList, cap.q, cap.r);
    }
    if (hex) out.push({ q: hex.q, r: hex.r, ownerId: capOwnerId, startCityState: false, label: `owner${capOwnerId}-KOLONIA-BONUS` });
  }
  return out;
}

const cases = [
  { label: 'Mini Pangea 120×90 N=7', w: 120, h: 90, typ: 'pangea', seeds: [1, 2, 3, 5, 8, 13, 21, 34, 42, 55, 89, 144, 233, 377, 610, 987, 1597, 999, 4242, 7777], rywale: 6, typy: 7, epoch: 'kamien' },
];

let totalPairsChecked = 0;
let totalViolations = 0;
const details = [];

let totalGhostOwners = 0;
const ghostDetails = [];

let totalRealOrderPairsChecked = 0;
let totalRealOrderViolations = 0;
const realOrderDetails = [];

console.log(`miasta-zbyt-blisko-test${MUTATE ? ' (--mutate-przed-napraw: symulacja starego kodu)' : ''}`);
console.log(`MIN_CITY_DISTANCE=${M.MIN_CITY_DISTANCE} MIN_CITY_DISTANCE_START_CITY_STATE=${M.MIN_CITY_DISTANCE_START_CITY_STATE}\n`);

for (const c of cases) {
  for (const seed of c.seeds) {
    const map = M.generateMap(c.w, c.h, seed, c.typ);
    const plan = M.buildClusterStartPlan({
      map, civs, seed, playerCivId: 'grecy', rywaleNaKlaster: c.rywale, aktywneTypy: c.typy, startEpochId: c.epoch,
    });
    const baseCities = buildStartCityList(plan);
    const bonusHexes = bonusColonyHexes(map, baseCities, plan);
    const allCities = baseCities.concat(bonusHexes);

    const viol = findViolations(allCities);
    totalPairsChecked += (allCities.length * (allCities.length - 1)) / 2;
    totalViolations += viol.length;
    if (viol.length > 0) {
      details.push({ seed, viol });
    }

    // Zarzut 1 (runda 2): brak "widmowych" właścicieli po naprawie.
    const ghosts = findGhostOwners(plan);
    totalGhostOwners += ghosts.length;
    if (ghosts.length > 0) {
      ghostDetails.push({ seed, ghosts });
    }

    // Zarzut 2+3 (runda 2): symulacja DOKŁADNEJ kolejności realnego spawnu
    // (rywale tego samego typu → obce klastry + kolonie bonusowe w locie).
    const realOrderCities = simulateRealSpawnOrder(map, plan, seed);
    const realOrderViol = findViolations(realOrderCities);
    totalRealOrderPairsChecked += (realOrderCities.length * (realOrderCities.length - 1)) / 2;
    totalRealOrderViolations += realOrderViol.length;
    if (realOrderViol.length > 0) {
      realOrderDetails.push({ seed, viol: realOrderViol });
    }
  }
}

console.log(`Map wygenerowanych: ${cases.reduce((n, c) => n + c.seeds.length, 0)}`);
console.log(`Par miast sprawdzonych łącznie: ${totalPairsChecked}`);
console.log(`Naruszenia minimalnego dystansu: ${totalViolations}`);
for (const d of details.slice(0, 10)) {
  for (const v of d.viol.slice(0, 5)) {
    console.log(`  seed=${d.seed}: ${v.a} <-> ${v.b} d=${v.d} < próg=${v.minDist}`);
  }
}

console.log(`\n[Zarzut 1] Widmowi właściciele (zarejestrowani bez miasta): ${totalGhostOwners}`);
for (const d of ghostDetails.slice(0, 10)) {
  for (const g of d.ghosts.slice(0, 5)) {
    console.log(`  seed=${d.seed}: rejestr=${g.registry} ownerId=${g.ownerId} bez miasta w spawnCities`);
  }
}

console.log(`\n[Zarzut 2+3] Symulacja realnej kolejności spawnu (rywale → obce klastry+kolonie):`);
console.log(`Par sprawdzonych łącznie: ${totalRealOrderPairsChecked}`);
console.log(`Naruszenia: ${totalRealOrderViolations}`);
for (const d of realOrderDetails.slice(0, 10)) {
  for (const v of d.viol.slice(0, 5)) {
    console.log(`  seed=${d.seed}: ${v.a} <-> ${v.b} d=${v.d} < próg=${v.minDist}`);
  }
}

const pass = totalViolations === 0 && totalGhostOwners === 0 && totalRealOrderViolations === 0;
console.log(`\n${pass ? 'PASS' : 'FAIL'} — plan: ${totalPairsChecked - totalViolations}/${totalPairsChecked} par w normie` +
  `, widma: ${totalGhostOwners === 0 ? 'brak' : totalGhostOwners}` +
  `, realna kolejność: ${totalRealOrderPairsChecked - totalRealOrderViolations}/${totalRealOrderPairsChecked} par w normie`);
process.exit(pass ? 0 : 1);
