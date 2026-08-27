/**
 * map/improvement-build.ts (lane Grupa A / MAPA)
 * D4=A — front akcji „buduj ulepszenie z mapy": kwalifikacja heksów, koszt Pracy,
 * callbacki do wpiecia przez MASTER (tryb Budowa jak „Załóż miasto").
 */

import type { GameMap } from '../types/map';
import { TerenBazowy, Nakladka, Ulepszenie } from '../types/hex';
import type { ImprovementKey } from '../render/improvements';
import { IMPROVEMENTS } from '../render/improvements';
import {
  isInTerritory,
  isPlayerTerritoryHex,
  territoryOwnerAt,
  axialDistance,
  cityTerritoryRadius,
  type CityNode,
  type TerritoryNode,
} from './territory';
import { isTerritoryHexOwnedBy } from './territory-work';
import { hexKeysWithinRadius } from '../game/okolica';
import terrainImprovements from '../../data/terrain-improvements.json';
import {
  computeEmpireLivestockUnlocks,
  isLivestockAllowed,
  isLivestockUnlockedForPlacement,
  livestockKeyFromImprovement,
} from '../game/livestock-unlock';
import {
  improvementDisplayName,
  improvementKeysForHex,
  normalizeImprovementKey,
} from '../game/terrain-improvements';
import { hexHasRoad, isRoadImprovementKey } from './road-movement';
import {
  getImprovementMeta,
  isImprovementTechUnlocked,
  getImprovementLockHint,
  type ImprovementActionTyp,
} from '../game/improvement-tech';
import { scaleImprovementWorkCost } from '../game/r-stawki-strojenie';

// ---------------------------------------------------------------------------
// Typy kontraktu
// ---------------------------------------------------------------------------

/** Heks z opcjonalnym znacznikiem złoża (wegiel, sól — patrz gen-helpers). */
type HexWithZloze = GameMap['hexes'][string] & { zloze?: string };

export interface ImprovementBuildState {
  map: GameMap;
  cityNodes: CityNode[];
  /** Klucze heksów z ukończonymi / w trakcie ulepszeniami (q,r). */
  placedKeys?: Set<string>;
  /** Klucze heksów z drogami (q,r) — aktualizowane po postawieniu drogi. */
  roadKeys?: Set<string>;
  /** Archetyp cywilizacji gracza (np. `inkowie`) — wymagane dla tarasów. */
  playerCivArchetype?: string;
  /** Epoka gracza (Inkowie: hodowla poza lamą od epoki 3). */
  playerEra?: number;
  /** Właściciel imperium — unlock hodowli po pierwszym złożu. */
  playerOwnerId?: string | null;
  /** Wszystkie węzły terytorium (ownerId) — overlap → territoryOwnerAt. */
  territoryNodes?: readonly TerritoryNode[];
  /** Numeryczny owner gracza (domyślnie 0). */
  playerOwnerIdNum?: number;
  /** Heks → klucze ulepszeń (warstwy); fallback: hex.ulepszenia / hex.ulepszenie. */
  placedImprovements?: ReadonlyMap<string, string | readonly string[]>;
  /** Zbadane technologie gracza (nazwy z tech.json). */
  researchedTechs?: ReadonlySet<string>;
  /** Heksy z trwającą wycinką lasu (wyrąb) — blokada ponownego wyboru. */
  clearingHexKeys?: ReadonlySet<string>;
  /** Id pending w tej turze (`hexKey:improvementKey`) — ponowny klik = cofnięcie. */
  pendingUndoKeys?: ReadonlySet<string>;
  /**
   * Temat #4 (Handel E3b): gracz ma aktywny grant "z trasy handlowej" na Konia
   * (partner ma odblokowaną Stadninę u siebie) — traktowane tak samo jak własne
   * empireUnlocks.has('kon') (stadnina bez wymogu złoża konia). Liczone przez
   * wołającego (main.ts: hasTradeRouteResourceAccess(tradeRouteResourceGrants,
   * playerOwnerIdNum, 'kon')) — ten moduł nie zna tras handlowych.
   */
  tradeRouteKonUnlocked?: boolean;
  /**
   * R-FORT-STRAZNICA-ROZSZERZA-ZASIEG-ZAKLADANIA krok 2, Q1=B doprecyzowanie
   * (Maciej 2026-08-09): klucze "q,r" heksow, na ktorych aktualnie stoi WLASNA
   * jednostka budowniczego (playerOwnerIdNum) — wymog fizycznej obecnosci przy
   * budowie fort/posterunek POZA wlasnym terytorium (fog of war jest wtedy
   * automatycznie zdjeta, bo jednostka tam stoi). Brak pola / pusty zbior =
   * fort/posterunek NIE kwalifikuje sie poza wlasnym terytorium (fail-closed).
   * / EN: "q,r" keys of hexes currently occupied by the builder's OWN unit —
   * physical-presence requirement for building fort/outpost OUTSIDE own
   * territory (fog of war is then automatically lifted by that unit standing
   * there). Missing/empty = fort/outpost does NOT qualify outside own
   * territory (fail-closed).
   */
  ownUnitHexKeys?: ReadonlySet<string>;
}

export interface ImprovementTypeInfo {
  key: ImprovementKey;
  label: string;
  kosztPraca: number;
  epoka: number;
  typ: ImprovementActionTyp;
  techId: string | null;
  techUnlocked: boolean;
  techLabel: string | null;
  lockHint: string | null;
}

export interface ImprovementBuildRequest {
  type: 'buildImprovement';
  key: ImprovementKey;
  q: number;
  r: number;
  hexKey: string;
  kosztPraca: number;
  /** wycinka = wyrąb (bez stałego ulepszenia); ulepszenie = normalne. */
  action: ImprovementActionTyp;
}

export interface ImprovementBuildCallbacks {
  /** Lista typów z kosztem Pracy (terrain-improvements.json). */
  listTypes(): ImprovementTypeInfo[];
  /** Koszt Pracy dla typu. */
  getWorkCost(key: ImprovementKey): number;
  /** Czy heks kwalifikuje się do danego typu. */
  canBuild(key: ImprovementKey, q: number, r: number): boolean;
  /** Wszystkie kwalifikujące heksy (podświetlenie UX). */
  getQualifyingHexes(key: ImprovementKey): Array<{ q: number; r: number }>;
  /** Propozycja akcji budowy (MASTER wpina w turę / ekonomię). */
  createBuildRequest(key: ImprovementKey, q: number, r: number): ImprovementBuildRequest | null;
  /** Raycaster mapy — gdy activeKey ustawiony w createImprovementBuildApi. */
  handleHexClick?(q: number, r: number): ImprovementBuildRequest | null;
}

export interface ImprovementBuildModeOptions {
  /** Aktywny typ ulepszenia (null = tryb podglądu). */
  activeKey: ImprovementKey | null;
  /** Wywoływane po kliknięciu kwalifikującego heksa. */
  onSelect?: (req: ImprovementBuildRequest) => void;
}

// ---------------------------------------------------------------------------
// Pomocnicze — kwalifikacja (logika z placementpreview, territory.ts)
// ---------------------------------------------------------------------------

// ZADANIE 1 (2026-07-20, Q3=A): Wybrzeże jest teraz WODĄ konsekwentnie (jak w ruchu/miastach/
// AI/wioskach/złożach/renderze) — usunięte z TERENY_LADU/TARTAK_TERENY. Skutek: droga/
// droga_brukowana/fort/posterunek/tartak znikają z Wybrzeża (budowalne tylko lodzie_rybackie
// i warzelnia_soli — patrz sektor 'woda' niżej).
const TERENY_LADU = new Set<TerenBazowy>([
  TerenBazowy.Laka, TerenBazowy.Rownina, TerenBazowy.Wzgorza,
  TerenBazowy.Gory, TerenBazowy.Pustynia,
]);

/** Tartak — ląd bez szczytów górskich (Góry) i bez Wybrzeża (ZADANIE 1 — Wybrzeże = woda). */
const TARTAK_TERENY = new Set<TerenBazowy>([
  TerenBazowy.Laka, TerenBazowy.Rownina, TerenBazowy.Wzgorza,
  TerenBazowy.Pustynia,
]);

/**
 * Ulepszenia, dla których nakładka Las jest warunkiem KONIECZNYM istnienia — po wyrębie
 * tracą podstawę i znikają z heksa.
 *
 * R-ULEPSZENIA-OBOZ-LOWIECKI-TYLKO-LAS-Q1, runda 2, ECHO właściciela 2026-08-27 (wariant A):
 * „obóz znika przy wyrębie" — skoro obóz może istnieć wyłącznie w lesie, zniknięcie lasu
 * znosi warunek jego istnienia. Praca NIE jest zwracana (świadoma decyzja właściciela).
 * Bez tego wyrąb spod obozu zostawiał `["oboz_lowiecki"]` przy `nakladka = Brak`, czyli
 * obóz poza lasem powstający normalną rozgrywką (gracz i AI) — dziura P7 znaleziona przez
 * Evaluatora i Final Control rundy 1.
 *
 * Świadomie POZA tym zbiorem (nie dopisywać bez decyzji właściciela):
 *  • `tartak`   — kanon wprost: las zostaje przy tartaku (asercja
 *                 tools/map-improvement-qualify-test.cjs: „tartak stays when forest removed").
 *  • `farma`    — od 2026-08-27 (R-ULEPSZENIA-FARMA-NIE-W-LESIE-Q1) farma w ogóle nie
 *                 kwalifikuje się na heksie z lasem, więc Las nie jest jej warunkiem —
 *                 jest jej przeszkodą. Farma JUŻ STOJĄCA na lesie (postawiona legalnie wg
 *                 reguły z 2026-07-21) zostaje na heksie po wyrębie; jej ewentualne
 *                 usunięcie to otwarte pytanie właściciela
 *                 (P-ULEPSZENIA-FARMY-JUZ-STOJACE-W-LESIE-Q1), nie ten temat.
 *  • `glinianka`— warunkiem jest złoże gliny (hexHasClayDeposit), nie las.
 *  • `wyrab`    — akcja, nigdy trwała warstwa heksa.
 */
const FOREST_DEPENDENT_IMPROVEMENT_KEYS = new Set<string>([
  'oboz_lowiecki',
]);

/** Po usunięciu lasu z heksa — odfiltruj ulepszenia zależne od nakładki Las (tartak NIE — kanon: las zostaje przy tartaku). */
export function stripImprovementsWhenForestRemoved(layers: readonly string[]): string[] {
  return layers.filter(key => !FOREST_DEPENDENT_IMPROVEMENT_KEYS.has(key));
}

// ---------------------------------------------------------------------------
// R-ULEPSZENIA-FARMA-LESIE-USUN-ISTNIEJACE-Q1 (ECHO właściciela 2026-08-27,
// wariant C turnieju): SPRZĄTANIE ISTNIEJĄCEGO STANU — farmy postawione
// legalnie wg uchylonej reguły z 2026-07-21 („farma MOŻE na lesie") znikają
// z każdego heksa z nakładką Las. Cytat właściciela: „W ogóle nie powinno być
// farm w lesie; farm nie wolno stawiać w lesie (...) w lesie nie powinno być
// farm." Reguła jest NIEWARUNKOWA — dotyczy STANU, nie tylko czynności
// budowania, więc nie wystarczy zablokowanie kwalifikacji
// (R-ULEPSZENIA-FARMA-NIE-W-LESIE-Q1, ten sam dzień).
//
// Skutek zdefiniowany jawnie (wzorzec z decyzji o obozie łowieckim, ten sam
// dzień): praca włożona w farmę NIE wraca, heks wraca do stanu „las, bez
// ulepszenia", las ZOSTAJE nietknięty. Miasto traci żywność z tej farmy od
// kolejnej tury (przeliczenie ekonomii następnej tury czyta już czysty heks).
// Dotyczy też farm na Wzgórzach — te są farmami leśnymi z definicji starej
// reguły (jedyna droga na Wzgórza wiodła przez `nakladka === Las`), więc
// znikają identycznie, bez wyjątku terenowego.
//
// DLACZEGO OSOBNO OD `stripImprovementsWhenForestRemoved` (wyżej), a nie
// przez dopisanie 'farma' do FOREST_DEPENDENT_IMPROVEMENT_KEYS: tamten zbiór
// odpowiada na PRZECIWNE pytanie — „co znika, gdy znika LAS" (las jest
// warunkiem koniecznym istnienia obozu łowieckiego). Tu las jest PRZESZKODĄ,
// nie warunkiem: znika farma, a las zostaje. Zlanie tych dwóch reguł w jedną
// listę kasowałoby farmę przy wyrębie — dokładnie odwrotnie niż kanon
// („wyrąb zostaje jedyną drogą do farmy na zalesionym heksie").
//
// ZAKRES (§14 — nie poszerzać): WYŁĄCZNIE `farma` na `Nakladka.Las`. Tartak i
// obóz łowiecki mają własne, odrębne zasady; irygacja/tarasy na lesie to
// osobny, nieotwarty temat.
// ---------------------------------------------------------------------------

/**
 * Czy warstwa `key` na heksie o nakładce `nakladka` to farma-relikt starej
 * reguły (farma stojąca w lesie). Jedyne miejsce, w którym ta reguła jest
 * wyrażona dla ŻYWEGO stanu gry.
 *
 * `normalizeImprovementKey` — bo w zapisach żyją aliasy legacy; farma nie ma
 * dziś aliasu, ale przejście przez normalizację jest odporne na przyszły.
 */
export function isLegacyFarmOnForestLayer(key: string, nakladka: Nakladka): boolean {
  if (nakladka !== Nakladka.Las) return false;
  return normalizeImprovementKey(key) === 'farma';
}

/** Warstwy heksa BEZ farmy-reliktu (gdy heks nie jest lasem — kopia bez zmian). */
export function stripLegacyFarmOnForest(
  layers: readonly string[],
  nakladka: Nakladka,
): string[] {
  if (nakladka !== Nakladka.Las) return [...layers];
  return layers.filter(key => !isLegacyFarmOnForestLayer(key, nakladka));
}

/**
 * Minimalny widok heksa wymagany przez sprzątanie — celowo NIE `Hex`, żeby
 * bramka tematu mogła podać syntetyk bez budowania pełnej mapy.
 * `ulepszenie`/`ulepszenia` to pola czytane przez `improvementKeysForHex`
 * (game/terrain-improvements.ts) — TO one, a nie `placedImprovements`, są
 * źródłem plonów w turn-economy.ts, więc sprzątanie musi je widzieć.
 */
export interface LegacyFarmHexView {
  nakladka: Nakladka;
  ulepszenie?: unknown;
  ulepszenia?: readonly string[] | null;
}

/** Jeden heks do posprzątania: warstwy przed i po usunięciu farmy. */
export interface LegacyFarmOnForestChange {
  hexKey: string;
  before: string[];
  after: string[];
  /**
   * true = warstwy pochodziły z rejestru `placedImprovements` (wtedy wołający
   * ma go zaktualizować). false = heks miał farmę WYŁĄCZNIE w polach
   * `hex.ulepszenie`/`hex.ulepszenia` (np. z mapSnapshotu zapisu, bez wpisu w
   * `meta.placedImprovements`) — wtedy rejestru NIE dopisujemy, żeby
   * sprzątanie nie tworzyło wpisów, których wcześniej nie było.
   */
  fromPlaced: boolean;
}

export interface LegacyFarmOnForestReport {
  changes: LegacyFarmOnForestChange[];
  /** Ile heksów straciło farmę (= changes.length). */
  removed: number;
  /** Ile heksów przejrzano — kontrola istotności pomiaru (0 = nic nie badano). */
  scanned: number;
  /** Ile farm stoi na heksach BEZ lasu (Łąka/Równina) — dowód, że naprawa nie jest za szeroka. */
  farmsOnOpenTerrain: number;
}

/**
 * PLAN sprzątania — czysta funkcja, ZERO mutacji. Zwraca listę heksów, na
 * których stoi farma-relikt, oraz licznik farm na otwartym terenie (te MUSZĄ
 * przetrwać — kontrola „naprawa nie jest za szeroka").
 */
export function planLegacyFarmOnForestRemoval(
  hexes: Readonly<Record<string, LegacyFarmHexView | undefined>>,
  placed?: ReadonlyMap<string, readonly string[]>,
): LegacyFarmOnForestReport {
  const changes: LegacyFarmOnForestChange[] = [];
  let scanned = 0;
  let farmsOnOpenTerrain = 0;
  for (const hexKey of Object.keys(hexes)) {
    const hex = hexes[hexKey];
    if (!hex) continue;
    scanned++;
    const fromPlacedLayers = placed?.get(hexKey);
    const before = fromPlacedLayers ? [...fromPlacedLayers] : improvementKeysForHex(hex);
    if (before.length === 0) continue;
    if (hex.nakladka !== Nakladka.Las) {
      if (before.some(k => normalizeImprovementKey(k) === 'farma')) farmsOnOpenTerrain++;
      continue;
    }
    const after = stripLegacyFarmOnForest(before, hex.nakladka);
    if (after.length === before.length) continue;
    changes.push({ hexKey, before, after, fromPlaced: fromPlacedLayers !== undefined });
  }
  return { changes, removed: changes.length, scanned, farmsOnOpenTerrain };
}

/**
 * Wykonuje sprzątanie: aktualizuje rejestr `placed` i zgłasza każdy zmieniony
 * heks przez `onHexChanged`, żeby wołający zsynchronizował pola heksa
 * (main.ts::syncHexUlepszenieFields) i render. Sam NIE dotyka obiektów heksów
 * — mapowanie warstwa→`Ulepszenie` żyje w main.ts i nie jest tu powielane.
 *
 * IDEMPOTENTNA z konstrukcji: drugie wywołanie na tym samym stanie nie
 * znajduje już żadnej farmy na lesie, więc zwraca `removed: 0`, nie mutuje
 * niczego i nie woła `onHexChanged` ani razu.
 */
export function removeLegacyFarmsOnForest(
  hexes: Readonly<Record<string, LegacyFarmHexView | undefined>>,
  placed: Map<string, string[]>,
  onHexChanged?: (hexKey: string, layers: string[]) => void,
): LegacyFarmOnForestReport {
  const report = planLegacyFarmOnForestRemoval(hexes, placed);
  for (const ch of report.changes) {
    if (ch.fromPlaced) {
      if (ch.after.length > 0) placed.set(ch.hexKey, ch.after);
      else placed.delete(ch.hexKey);
    }
    onHexChanged?.(ch.hexKey, ch.after);
  }
  return report;
}

const FLAT_FARM = new Set<TerenBazowy>([TerenBazowy.Laka, TerenBazowy.Rownina]);
const FLAT_IRR = new Set<TerenBazowy>([
  TerenBazowy.Laka, TerenBazowy.Rownina, TerenBazowy.Pustynia,
]);

/**
 * Farma — WYŁĄCZNIE Łąka/Równina BEZ nakładki Las.
 *
 * R-ULEPSZENIA-FARMA-NIE-W-LESIE-Q1, ECHO właściciela 2026-08-27: „w lesie nie powinno być
 * możliwości budowania farm zarówno na wzgórzach, jak i na innych terenach, bo to się wyklucza.
 * W lesie można wybudować tylko tartak i ewentualnie obozowisko, i tego się trzymajmy."
 *
 * Ta decyzja UCHYLA regułę z 2026-07-21 („farma MOŻE na lesie — bez wyrębu; Łąka/Równina
 * zawsze, Wzgórza gdy nakładka Las"). Ślad uchylonej reguły zostaje tu świadomie — historia
 * decyzji nie jest wymazywana, tylko zastępowana.
 *
 * Skutek uboczny wprost nazwany w dyspozycji: farma na Wzgórzach staje się niemożliwa
 * CAŁKOWICIE, bo Wzgórza nigdy nie należały do `FLAT_FARM`, a jedyna droga na Wzgórza wiodła
 * przez `nakladka === Las`. Dopisanie Wzgórz do terenów farmowych byłoby poszerzeniem zakresu
 * (§14) i wymaga osobnego ECHO właściciela — NIE robić tego „przy okazji".
 *
 * Wyrąb zostaje jedyną drogą do farmy na zalesionym heksie (skutek odnotowany jako
 * P-ULEPSZENIA-FARMA-W-LESIE-WPLYW-NA-TEMAT-AI-Q1).
 */
export function isFarmBaseTerrain(teren: TerenBazowy, nakladka: Nakladka): boolean {
  if (nakladka === Nakladka.Las) return false;
  return FLAT_FARM.has(teren);
}

/**
 * Stadnina na nakładce Las — JEDYNA pozostałość zakazu „hodowla nie w lesie"
 * (Maciej 2026-07-29).
 *
 * R-ULEPSZENIA-HODOWLA-LAS-ODBLOKOWANA-Q1 (ECHO właściciela 2026-08-27: „Tak, odwracamy —
 * wszystkie trzy"): zakaz z 2026-07-29 zostaje COFNIĘTY dla `owce`, `bydlo` i `lama` —
 * kwalifikują się na heksie z Lasem dokładnie wg własnej reguły terenu bazowego
 * (Wzgórza dla owiec, Łąka/Równina dla bydła, Wzgórza/Góry dla lamy).
 *
 * Dlaczego funkcja nie znika całkowicie, tylko zwęża się do `stadnina`: poprzedni predykat
 * pytał `isLivestockImprovementKey()`, a ten zwraca `true` także dla `stadnina`
 * (`terrain-improvements.json`: `stadnina.surowiecOdblokowany === 'kon'`, a `kon` należy do
 * `LIVESTOCK_SUROWIEC_KEYS`). Stadnina zagarnęła się do zakazu POCHODNĄ definicji, nie
 * decyzją — i NIE ma jej w ECHO właściciela („wszystkie trzy" = owce, bydło, lama).
 * Zdjęcie zakazu także ze stadniny byłoby czwartą, niezamówioną zmianą reguły terenu (§14),
 * i byłoby realnie obserwowalne w rozgrywce: stadnina po imperialnym odblokowaniu `kon`
 * (`isLivestockUnlockedForPlacement`) nie wymaga już złoża konia na heksie, więc zacząłby ją
 * przepuszczać każdy zalesiony heks Łąki/Równiny. Zostaje jak było; pytanie „czy stadnina
 * też ma wejść do lasu" jest zgłoszone właścicielowi osobno.
 */
export function isStadninaBlockedOnForest(key: string, nakladka: Nakladka): boolean {
  return nakladka === Nakladka.Las && key === 'stadnina';
}

/**
 * Ulepszenia które MOGĄ stać na nakładce Las bez wyrębu (kanon).
 * tartak / obóz łowiecki — ulepszenia leśne (tartak: las zostaje przy tartaku).
 * glinianka — złoże gliny pod lasem (placeDeposits: nakladka=Las, zloze='glina').
 *
 * `farma` USUNIĘTA stąd 2026-08-27 (R-ULEPSZENIA-FARMA-NIE-W-LESIE-Q1, ECHO właściciela:
 * „w lesie można wybudować tylko tartak i ewentualnie obozowisko") — była tu od 2026-07-21
 * i przeszła do `FOREST_BLOCKED_IMPROVEMENT_KEYS` niżej.
 *
 * `owce`/`bydlo`/`lama` DOPISANE 2026-08-27 (R-ULEPSZENIA-HODOWLA-LAS-ODBLOKOWANA-Q1, ECHO
 * właściciela „Tak, odwracamy — wszystkie trzy", uchyla zakaz z 2026-07-29). Wpis jest tu
 * jawny, a nie „przez brak w zbiorze zakazanych", żeby ten zbiór pozostał czytelnym kanonem
 * tego, co wolno postawić w lesie. Zachowanie `isImprovementBlockedOnForest` jest dla tych
 * trzech kluczy identyczne w obu wariantach (przed dopisaniem wpadały w końcowe
 * `FOREST_BLOCKED_IMPROVEMENT_KEYS.has(key) === false`).
 */
const FOREST_COEXIST_IMPROVEMENT_KEYS = new Set<string>([
  'tartak', 'oboz_lowiecki', 'glinianka',
  'owce', 'bydlo', 'lama',
]);

/**
 * Ulepszenia zabronione na lesie — wymagają wolnego terenu; gracz musi najpierw wyrąbić.
 * (Wyrąb `wyrab` wymaga lasu — osobna ścieżka qualifies, nie tu.)
 */
const FOREST_BLOCKED_IMPROVEMENT_KEYS = new Set<string>([
  'irygacja',
  'tarasy',
  // R-ULEPSZENIA-FARMA-NIE-W-LESIE-Q1 (ECHO właściciela 2026-08-27, uchyla 2026-07-21):
  // farma nie stoi w lesie na żadnym terenie bazowym. To DRUGI, niezależny gate za
  // `qualifies()` — `applyBuildRequest` (main.ts) nie powtarza `qualifies()`, więc bez
  // tego wpisu farmę dałoby się zacommitować ścieżką pomijającą panel budowy (dokładnie
  // ta dziura, którą temat obozu łowieckiego znalazł jako P7).
  'farma',
]);

/** Budowa na Nakladka.Las zabroniona — bez automatycznego usuwania lasu. */
export function isImprovementBlockedOnForest(key: string, nakladka: Nakladka): boolean {
  if (nakladka !== Nakladka.Las) return false;
  if (FOREST_COEXIST_IMPROVEMENT_KEYS.has(key)) return false;
  if (key === 'wyrab') return false;
  if (isStadninaBlockedOnForest(key, nakladka)) return true;
  return FOREST_BLOCKED_IMPROVEMENT_KEYS.has(key);
}

/**
 * Podpowiedź przy próbie budowy na lesie (styl istniejących hintów w main.ts).
 *
 * R-ULEPSZENIA-HODOWLA-LAS-ODBLOKOWANA-Q1 (2026-08-27): gałąź „hodowla → postaw obóz
 * łowiecki" USUNIĘTA. Po cofnięciu zakazu owce/bydło/lama nigdy już nie trafiają do tej
 * funkcji (`isImprovementBlockedOnForest` zwraca dla nich `false`), więc tekst byłby martwy
 * i — gorzej — kłamałby, gdyby ktoś zawołał go wprost. Jedyna hodowlana pozostałość to
 * `stadnina`, dla której wyrąb JEST poprawną radą (po wyrębie kwalifikuje się na
 * Łące/Równinie), czyli obsługuje ją zdanie ogólne niżej.
 */
export function getImprovementForestBlockHint(key: string): string {
  const name = improvementDisplayName(key);
  return `${name} na lesie zabroniona — najpierw wyrąb las (Wyrąb w panelu ulepszeń).`;
}

/**
 * Owce — solo na Wzgórzu (otwartym LUB zalesionym) albo pierwsze pastwisko na złożu owiec.
 *
 * R-ULEPSZENIA-HODOWLA-LAS-ODBLOKOWANA-Q1 (ECHO właściciela 2026-08-27 „Tak, odwracamy —
 * wszystkie trzy"): linia `if (nakladka === Nakladka.Las) return false;` USUNIĘTA, a Las
 * dopisany jawnie jako dozwolona nakładka — sam brak tej linii NIE wystarczał, bo funkcja
 * kończy się `return nakladka === Nakladka.Brak`, więc Las i tak wypadłby przez ostatni
 * warunek. Ślad uchylonej reguły z 2026-07-29 („nie na lesie — obóz łowiecki / tartak OK")
 * zostaje tu świadomie; historia decyzji nie jest wymazywana, tylko zastępowana.
 *
 * Reszta reguły BEZ ZMIAN: teren bazowy musi być Wzgórzami, a nakładki inne niż
 * Brak/Las/ZłożeOwiec (np. złoże gliny, rudy, konia) nadal wykluczają owce.
 */
export function isOwceBaseTerrain(teren: TerenBazowy, nakladka: Nakladka): boolean {
  if (teren !== TerenBazowy.Wzgorza) return false;
  if (nakladka === Nakladka.ZlozeOwiec) return true;
  if (nakladka === Nakladka.Las) return true;
  return nakladka === Nakladka.Brak;
}

export const FOOD_LAYER_KEYS = new Set<string>([
  'farma', 'irygacja', 'bydlo', 'owce', 'lama', 'tarasy',
]);

const SOLO_FOOD_KEYS = new Set<string>(['tarasy', 'owce', 'lama']);

// WOLNE WSPÓŁISTNIENIE + „jeden per bok" (Maciej 2026-07-09, §5 SCHEMAT-SEKTORY-WSPOLISTNIENIE.md).
// Każde ulepszenie należy do sektora (boku). Ulepszenia RÓŻNYCH sektorów współistnieją swobodnie;
// w obrębie jednego sektora — maks. jedno. Teren/tech/cyw egzekwuje switch w qualifies(). Balans =
// próg wzrostu miasta, nie limit ulepszeń. Droga = pas przez środek (poza sektorami). Irygacja =
// nakładka (współistnieje z food). Uwaga: teren i tak wyklucza większość par (płaski≠wzgórza).
const SEKTOR_OF: Record<string, string> = {
  // bok 1 — surowce + ich ulepszenia
  glinianka: 'surowiec',
  stadnina: 'surowiec', kopalnia_miedzi: 'surowiec', kopalnia_zelaza: 'surowiec',
  // Cyna (Maciej 2026-08-13): jak kopalnia miedzi/żelaza — jedno złoże na heks (placeDeposits
  // break po pierwszym trafieniu), więc nigdy nie koliduje z pozostałymi kopalniami rudy.
  kopalnia_cyny: 'surowiec',
  // Maciej 2026-07-25: Kopalnia złota — dedykowane ulepszenie jak kopalnia_miedzi (tylko na
  // hex.zloze==='zloto'); sektor 'surowiec' jest tu bezpieczny bo tylko JEDNO złoże może
  // istnieć na heksie (placeDeposits — break po pierwszym trafieniu), więc nigdy nie koliduje
  // z kopalnią miedzi/węgla/żelaza na tym samym polu.
  kopalnia_zlota: 'surowiec',
  // Kamieniołom = WŁASNY sektor NIE-wykluczający (Maciej 2026-07-24, C-SUR kamień=b): kamień to
  // zasób terenowy i ma współistnieć z kopalniami rudy / glinianką / stadniną na tym samym heksie
  // — żeby budowa kamieniołomu nie zablokowała późniejszego wydobycia rudy (zwłaszcza żelaza,
  // ukrytego do epoki 3). Zostaje unikalny wobec samego siebie (existing.includes w qualifies).
  kamieniolom: 'kamien',
  // las (bok 1 — surowiec leśny); obóz łowiecki osobny sektor — współistnieje z tartakiem (Maciej 2026-07-29)
  wyrab: 'las', tartak: 'las',
  oboz_lowiecki: 'lowiectwo',
  // bok 2 — pole (food-teren)
  farma: 'foodteren', tarasy: 'foodteren',
  // bok 3 — hodowla
  bydlo: 'hodowla', owce: 'hodowla', lama: 'hodowla', pastwisko: 'hodowla',
  // bok 4 — militaria
  fort: 'militaria', posterunek: 'militaria',
  // nakładki / poza sektorem — współistnieją bez limitu
  irygacja: 'overlay', pole_irygowane: 'overlay',
  droga: 'droga', droga_brukowana: 'droga',
  // ZADANIE 1 (2026-07-20): warzelnia_soli przeniesiona do sektora 'woda' — na Wybrzeżu
  // działa jak lodzie_rybackie (bez wymogu złoża, „sól z morza"); na lądzie (Pustynia/
  // Rownina) nadal wymaga złoża 'sol' w qualifies() poniżej.
  lodzie_rybackie: 'woda', warzelnia_soli: 'woda',
};
/** Sektory z limitem „jeden na heks". Overlay/droga/woda — bez limitu (współistnieją). */
const EXCLUSIVE_SEKTORY = new Set<string>(['surowiec', 'las', 'foodteren', 'hodowla', 'militaria']);

export interface ImprovementBuildImpact {
  /** Istniejące ulepszenia zdjęte przed postawieniem nowego. */
  removedImprovements: string[];
  /** Nakładka lasu zostanie usunięta (jak po wyrębie). */
  removesForest: boolean;
}

/** Ulepszenia z tego samego sektora wykluczającego + konflikty solo-hodowla/żywność. */
export function improvementsReplacedByBuild(
  key: ImprovementKey,
  existing: readonly string[],
): string[] {
  const removed: string[] = [];
  const add = (k: string): void => {
    if (k !== key && !removed.includes(k)) removed.push(k);
  };

  const sekt = SEKTOR_OF[key];
  if (sekt && EXCLUSIVE_SEKTORY.has(sekt)) {
    for (const k of existing) {
      if (SEKTOR_OF[k] === sekt) add(k);
    }
  }

  if (SOLO_FOOD_KEYS.has(key)) {
    for (const k of existing) {
      if (FOOD_LAYER_KEYS.has(k)) add(k);
    }
  } else if (isFoodKey(key)) {
    for (const k of existing) {
      if (SOLO_FOOD_KEYS.has(k)) add(k);
    }
  }

  return removed;
}

function existingAfterSimulatedRemoval(
  existing: readonly string[],
  removed: readonly string[],
): string[] {
  const rm = new Set(removed);
  return existing.filter(k => !rm.has(k));
}

/**
 * Skutek budowy na heksie z istniejącymi warstwami — null = twarda blokada (np. irygacja na
 * lesie, obóz łowiecki poza lasem).
 * Nie usuwa farma+irygacja (kanon) — wtedy qualifies() zwraca false bez impactu.
 */
export function computeImprovementBuildImpact(
  key: ImprovementKey,
  hex: { terenBazowy: TerenBazowy; nakladka: Nakladka },
  existing: readonly string[],
): ImprovementBuildImpact | null {
  if (isImprovementBlockedOnForest(key, hex.nakladka)) return null;
  if (key === 'owce' && !isOwceBaseTerrain(hex.terenBazowy, hex.nakladka)) {
    return null;
  }
  // R-ULEPSZENIA-OBOZ-LOWIECKI-TYLKO-LAS-Q1: twarda blokada commitu (drugi, niezależny gate
  // za `qualifies()`/`canBuild` — ta sama rola co gałąź `owce` wyżej). `applyBuildRequest`
  // (main.ts) nie powtarza `qualifies()`, więc bez tego warunku obóz poza lasem dałoby się
  // zacommitować ścieżką pomijającą panel budowy. Dokładne porównanie enumu, nie podciąg.
  if (key === 'oboz_lowiecki' && hex.nakladka !== Nakladka.Las) {
    return null;
  }

  const removedImprovements = improvementsReplacedByBuild(key, existing);
  const after = existingAfterSimulatedRemoval(existing, removedImprovements);

  if (after.includes(key)) {
    return null;
  }
  const sekt = SEKTOR_OF[key];
  if (key !== 'droga' && sekt && EXCLUSIVE_SEKTORY.has(sekt)
    && after.some(k => SEKTOR_OF[k] === sekt)) {
    return null;
  }
  if (isFoodKey(key) && !canAddFoodLayer(after, key)) {
    return null;
  }

  const removesForest = false;
  return { removedImprovements, removesForest };
}

/** Tekst listy znikających elementów (UI potwierdzenia). */
export function formatImprovementBuildImpactList(impact: ImprovementBuildImpact): string {
  const parts: string[] = [];
  for (const k of impact.removedImprovements) {
    parts.push(improvementDisplayName(k));
  }
  if (impact.removesForest) {
    parts.push('Las');
  }
  return parts.join(', ');
}

type TerenSet = Set<TerenBazowy>;

const TERRAIN_ALLOW: Partial<Record<ImprovementKey, TerenSet | null>> = {
  farma: FLAT_FARM,
  irygacja: FLAT_IRR,
  bydlo: FLAT_FARM,
  owce: new Set([TerenBazowy.Wzgorza]),
  lama: new Set([TerenBazowy.Wzgorza, TerenBazowy.Gory]), // decyzja 3a: lama tylko wzgórza + góry
  stadnina: new Set([TerenBazowy.Laka, TerenBazowy.Rownina]),
  glinianka: null,
  kamieniolom: new Set([TerenBazowy.Wzgorza, TerenBazowy.Gory]), // Maciej 2026-07-24: Wzgórza+Góry
  oboz_lowiecki: null,
  wyrab: null,
  lodzie_rybackie: new Set([TerenBazowy.Wybrzeze, TerenBazowy.Morze]),
  tarasy: new Set([TerenBazowy.Wzgorza]),
  fort: null,
  droga: null,
  droga_brukowana: null,
  posterunek: null,
  kopalnia_miedzi: new Set([TerenBazowy.Wzgorza, TerenBazowy.Gory]),
  kopalnia_zelaza: new Set([TerenBazowy.Wzgorza, TerenBazowy.Gory]),
  // Maciej 2026-07-25: złoto żyłowe — Wzgórza/Góry, jak kopalnia_miedzi (patrz DEPOSIT_RULES
  // gen-helpers.ts id='zloto').
  kopalnia_zlota: new Set([TerenBazowy.Wzgorza, TerenBazowy.Gory]),
  // Maciej 2026-08-13: cyna — Wzgórza/Góry, jak złoto (DEPOSIT_RULES gen-helpers.ts id='cyna').
  kopalnia_cyny: new Set([TerenBazowy.Wzgorza, TerenBazowy.Gory]),
};

/**
 * Cztery ulepszenia będące KOPALNIĄ konkretnego złoża — R-KOPALNIA-PODSWIETLENIE-HEKSOW-Q1
 * (Maciej): tylko dla nich tryb budowy podświetla zbiorczo heksy terytorium, na których dana
 * kopalnia jest dopuszczalna. `kamieniolom` NIE należy do tej grupy (nie jest kopalnią złoża
 * surowca), tak samo tartak / glinianka / warzelnia soli / stadnina.
 * / EN: the four improvements that are a MINE of a specific deposit; only these get the
 * collective eligible-hex highlight. `kamieniolom` (quarry) is deliberately excluded.
 */
export const MINE_IMPROVEMENT_KEYS: ReadonlySet<ImprovementKey> = new Set<ImprovementKey>([
  'kopalnia_miedzi',
  'kopalnia_zelaza',
  'kopalnia_cyny',
  'kopalnia_zlota',
]);

/** Czy `key` to jedna z czterech kopalń złoża (patrz MINE_IMPROVEMENT_KEYS). */
export function isMineImprovementKey(key: ImprovementKey | null | undefined): boolean {
  return key != null && MINE_IMPROVEMENT_KEYS.has(key);
}

/**
 * Panel 🔨 ULEPSZENIA TERENU — pozycje niedostępne dla cywilizacji są UKRYTE (nie wyszarzone).
 * Lama: tylko Inkowie (`typCywilizacji` inkowie / isIncaCiv). Hodowla Nowego Świata: epoka ≥3.
 */
export function isImprovementVisibleInBuildPanel(
  key: ImprovementKey,
  civType: string | undefined | null,
  era: number = 1,
): boolean {
  if (!livestockKeyFromImprovement(key)) return true;
  return isLivestockAllowed(civType, key, era);
}

/** @deprecated T-TECH-4 (2026-07-05): tarasy po Rolnictwie dla wszystkich cyw — funkcja zostaje dla testów legacy. */
export function isTarasyCiv(civ: string | undefined | null): boolean {
  if (!civ) return false;
  const t = civ.toLowerCase().trim();
  return t.includes('inkow') || t.includes('inka') || t.includes('incas')
    || t.includes('chinc') || t === 'chiny';
}

/** Farma / irygacja — zakaz na złożu surowcowym; wyjątek: bydło/owce = już ulepszenie. */
export function hasBlockingDepositForFarm(_hex: HexWithZloze): boolean {
  // WOLNE WSPÓŁISTNIENIE (Maciej 2026-07-09): złoża (ruda/koń/sól/glina) NIE blokują farmy/irygacji/tarasów —
  // współistnieją (surowiec = bok 1, pole = bok 2). Teren i tak wyklucza niepasujące (ruda=wzgórza itd.).
  return false;
}

/** Heks ze złożem rudy — Popalnia brązu (ABC-14). */
function hexHasRudaDeposit(hex: HexWithZloze): boolean {
  const zloze = hex.zloze;
  if (zloze === 'ruda' || zloze === 'miedz' || zloze === 'zelazo' || zloze === 'wegiel') return true;
  return hex.nakladka === Nakladka.ZlozeRudy;
}

/** Złoże gliny — nakładka ZlozeGliny albo zloze='glina' pod lasem (placeDeposits). */
export function hexHasClayDeposit(hex: HexWithZloze): boolean {
  return hex.nakladka === Nakladka.ZlozeGliny
    || hex.zloze?.trim().toLowerCase() === 'glina';
}

/** REMIND-START-A (2026-06-26): hex ze złożem zarezerwowany — blokada ulepszeń gracza. */
export function hexHasDepositReserve(hex: HexWithZloze): boolean {
  if (hex.zloze) return true;
  if (hex.nakladka !== Nakladka.Brak && hex.nakladka !== Nakladka.Las) return true;
  return false;
}

/** Wyjątki: ulepszenie bezpośrednio wykorzystujące dane złoże (nie kolizja warstw). */
export function depositAllowsPlayerImprovement(
  key: ImprovementKey,
  hex: HexWithZloze,
): boolean {
  const nakladka = hex.nakladka;
  const zloze = hex.zloze;
  const teren = hex.terenBazowy;
  switch (key) {
    case 'glinianka':
      return hexHasClayDeposit(hex);
    case 'warzelnia_soli':
      return zloze === 'sol';
    case 'kopalnia_miedzi': // kopalnia miedzi — miedź lub legacy ZlozeRudy
      return zloze === 'miedz' || nakladka === Nakladka.ZlozeRudy || zloze === 'ruda';
    case 'kopalnia_zelaza': // kopalnia żelaza — TYLKO złoże żelaza (R-KOPALNIA-UNIWERSALNA-Q1=B)
      return zloze === 'zelazo';
    case 'kopalnia_zlota': // kopalnia złota — TYLKO złoże złota (Maciej 2026-07-25)
      return zloze === 'zloto';
    case 'kopalnia_cyny': // kopalnia cyny — TYLKO złoże cyny (Maciej 2026-08-13)
      return zloze === 'cyna';
    case 'bydlo':
      return nakladka === Nakladka.ZlozeBydla;
    case 'owce':
      return nakladka === Nakladka.ZlozeOwiec;
    case 'lama':
      return nakladka === Nakladka.ZlozeLamy;
    case 'stadnina':
      return hex.nakladka === Nakladka.ZlozeKonia;
    // R-ULEPSZENIA-OBOZ-LOWIECKI-TYLKO-LAS-Q1: obóz przestaje być wyjątkiem rezerwy złoża
    // na złożu zwierzęcym BEZ lasu — wyjątkiem jest wyłącznie las (dowolny teren pod nim).
    case 'oboz_lowiecki':
      return nakladka === Nakladka.Las;
    default:
      return false;
  }
}

/** Czy można dodać warstwę żywności na heksie z istniejącymi warstwami (kanon §3). */
export function canAddFoodLayer(existing: readonly string[], newKey: string): boolean {
  const ex = existing.filter(k => FOOD_LAYER_KEYS.has(k));
  if (ex.includes(newKey)) return false;

  if (SOLO_FOOD_KEYS.has(newKey)) return ex.length === 0;
  if (ex.some(k => SOLO_FOOD_KEYS.has(k))) return false;

  const hasF = ex.includes('farma');
  const hasI = ex.includes('irygacja');
  const hasB = ex.includes('bydlo');

  switch (newKey) {
    case 'farma':
      if (ex.length === 0) return true;
      return ex.length === 1 && (hasI || hasB);
    case 'irygacja':
      if (ex.length === 0) return true;
      return ex.length === 1 && hasF && !hasB;
    case 'bydlo':
      if (ex.length === 0) return true;
      return ex.length === 1 && hasF && !hasI;
    default:
      return false;
  }
}

function keysOnPlacedHex(imp: string | readonly string[]): string[] {
  if (typeof imp === 'string') return imp ? [imp] : [];
  return imp.map(String);
}

function getHexLayers(
  hexKey: string,
  hex: HexWithZloze,
  placedImprovements?: ReadonlyMap<string, string | readonly string[]>,
): string[] {
  const keys = new Set<string>(improvementKeysForHex(hex));
  const ext = placedImprovements?.get(hexKey);
  if (ext) {
    for (const k of keysOnPlacedHex(ext)) {
      const n = k.toLowerCase().trim();
      if (n && n !== 'brak') keys.add(n);
    }
  }
  return [...keys];
}

function isFoodKey(key: ImprovementKey): boolean {
  return FOOD_LAYER_KEYS.has(key);
}

function buildPlacedImprovementsMap(
  map: GameMap,
  placedImprovements?: ReadonlyMap<string, string | readonly string[]>,
): ReadonlyMap<string, string | readonly string[]> {
  if (placedImprovements) return placedImprovements;
  const m = new Map<string, string[]>();
  for (const [key, hex] of Object.entries(map.hexes)) {
    const keys = improvementKeysForHex(hex);
    if (keys.length) m.set(key, keys);
    else {
      const single = normalizeImprovementKey(String(hex.ulepszenie ?? 'brak'));
      if (single) m.set(key, [single]);
    }
  }
  return m;
}

function hexNeighbors(q: number, r: number): Array<{ q: number; r: number }> {
  return [
    { q: q + 1, r }, { q: q - 1, r },
    { q, r: r + 1 }, { q, r: r - 1 },
    { q: q + 1, r: r - 1 }, { q: q - 1, r: r + 1 },
  ];
}

function buildRiverHexSet(map: GameMap): Set<string> {
  const set = new Set<string>();
  for (const path of map.riverPaths) {
    for (const p of path) set.add(`${p.q},${p.r}`);
  }
  return set;
}

type JsonImprovement = { koszt_praca?: number; nazwa?: string; epoka?: number };

function readWorkCost(key: ImprovementKey): number {
  const entry = (terrainImprovements as unknown as Record<string, JsonImprovement>)[key];
  return scaleImprovementWorkCost(entry?.koszt_praca ?? 20);
}

const NAKLADKI_ZWIERZECZE = new Set<Nakladka>([
  Nakladka.ZlozeKonia, Nakladka.ZlozeOwiec,
  Nakladka.ZlozeBydla, Nakladka.ZlozeLamy,
]);

/** Nakladka ze zlozem zwierzecym (kon/owce/bydlo/lama) — uzywane m.in. przez obóz łowiecki.
 * EN: overlay with an animal deposit (horse/sheep/cattle/llama) — used e.g. by the hunting camp. */
export function hasAnimalDeposit(nakladka: Nakladka): boolean {
  return NAKLADKI_ZWIERZECZE.has(nakladka);
}

function hexZloze(hex: HexWithZloze | undefined): string | undefined {
  return hex?.zloze;
}

function createQualifier(state: ImprovementBuildState) {
  const { map, cityNodes, playerCivArchetype } = state;
  const playerEra = state.playerEra ?? 1;
  const playerOwnerIdNum = state.playerOwnerIdNum ?? 0;
  const territoryNodes = state.territoryNodes ?? [];
  const placedKeys = state.placedKeys ?? new Set<string>();
  const roadKeys = state.roadKeys ?? new Set<string>();
  const ownUnitHexKeys = state.ownUnitHexKeys ?? new Set<string>();
  const riverHexSet = buildRiverHexSet(map);
  const placedMap = buildPlacedImprovementsMap(map, state.placedImprovements);
  const empireUnlocks = computeEmpireLivestockUnlocks(
    placedMap as ReadonlyMap<string, string | readonly string[]>,
    map,
    state.playerOwnerId,
  );
  // Temat #4: grant "z trasy handlowej" dolicza się do własnego odblokowania —
  // OR, nie substytut (własny grant zawsze wygrywa, trasa tylko dokłada 'kon'
  // gdy jeszcze go nie ma).
  if (state.tradeRouteKonUnlocked) empireUnlocks.add('kon');

  function inPlayerTerritory(q: number, r: number): boolean {
    if (territoryNodes.length > 0) {
      return isTerritoryHexOwnedBy(q, r, playerOwnerIdNum, territoryNodes);
    }
    return isPlayerTerritoryHex(q, r, cityNodes, territoryNodes, playerOwnerIdNum);
  }

  function isRoadQualified(q: number, r: number): boolean {
    for (const nb of hexNeighbors(q, r)) {
      const nbKey = `${nb.q},${nb.r}`;
      if (roadKeys.has(nbKey)) return true;
      const nbHex = map.hexes[nbKey];
      if (nbHex && hexHasRoad(nbHex)) return true;
      for (const node of cityNodes) {
        if (nb.q === node.q && nb.r === node.r) return true;
      }
    }
    for (const node of cityNodes) {
      if (axialDistance(q, r, node.q, node.r) === 1) return true;
    }
    return false;
  }

  function isRiverAdjacent(q: number, r: number): boolean {
    const hex = map.hexes[`${q},${r}`];
    if (hex?.rzeka?.obecna) return true;
    if (riverHexSet.has(`${q},${r}`)) return true;
    for (const nb of hexNeighbors(q, r)) {
      if (riverHexSet.has(`${nb.q},${nb.r}`)) return true;
    }
    return false;
  }

  function qualifies(key: ImprovementKey, q: number, r: number): boolean {
    const hexKey = `${q},${r}`;

    const hex = map.hexes[hexKey] as HexWithZloze | undefined;
    if (!hex) return false;
    const teren = hex.terenBazowy;
    const nakladka = hex.nakladka;
    const zloze = hexZloze(hex);
    const existing = getHexLayers(hexKey, hex, placedMap);

    // WOLNE WSPÓŁISTNIENIE (Maciej 2026-07-09): złoża NIE rezerwują heksa — inne ulepszenia
    // (farma/hodowla/fort…) współistnieją z ulepszeniem surowca. Limit egzekwuje sektor + switch niżej.
    // (dawna bramka rezerwy złóż usunięta; hexHasDepositReserve/depositAllowsPlayerImprovement zostają eksportowane.)

    if (key === 'droga_brukowana') {
      if (!TERENY_LADU.has(teren)) return false;
      if (!inPlayerTerritory(q, r)) return false;
      const hasDroga = existing.includes('droga') || hex.ulepszenie === Ulepszenie.Droga;
      const hasBruk = existing.includes('droga_brukowana')
        || hex.ulepszenie === Ulepszenie.DrogaBrukowana;
      return hasDroga && !hasBruk;
    }

    if (state.pendingUndoKeys?.has(`${hexKey}:${key}`)) return true;

    // WOLNE WSPÓŁISTNIENIE + „jeden per bok" (Maciej 2026-07-09, §5): różne sektory współistnieją;
    // kolizja w tym samym sektorze / solo-hodowla → computeImprovementBuildImpact + confirm w UI.
    if (key !== 'droga' && existing.includes(key)) return false;
    if (key === 'droga' && placedKeys.has(hexKey)) return false;

    let terrainOk = false;
    switch (key) {
      case 'farma':
        terrainOk = isFarmBaseTerrain(teren, nakladka)
          && !hasBlockingDepositForFarm(hex)
          && inPlayerTerritory(q, r);
        break;
      case 'irygacja':
        terrainOk = FLAT_IRR.has(teren)
          && !hasBlockingDepositForFarm(hex)
          && inPlayerTerritory(q, r)
          && isRiverAdjacent(q, r);
        break;
      // R-ULEPSZENIA-HODOWLA-LAS-ODBLOKOWANA-Q1 (2026-08-27): `!isLivestockImprovementBlocked
      // OnForest(key, nakladka)` USUNIĘTE — bydło kwalifikuje się na Łące/Równinie niezależnie
      // od nakładki Las (ECHO właściciela „Tak, odwracamy — wszystkie trzy").
      case 'bydlo':
        terrainOk = FLAT_FARM.has(teren)
          && inPlayerTerritory(q, r)
          && isLivestockAllowed(playerCivArchetype, key, playerEra)
          && isLivestockUnlockedForPlacement(key, hex, empireUnlocks);
        break;
      case 'owce':
        terrainOk = isOwceBaseTerrain(teren, nakladka)
          && inPlayerTerritory(q, r)
          && isLivestockAllowed(playerCivArchetype, key, playerEra)
          && isLivestockUnlockedForPlacement(key, hex, empireUnlocks);
        break;
      // R-ULEPSZENIA-HODOWLA-LAS-ODBLOKOWANA-Q1 (2026-08-27): jw. — lama kwalifikuje się na
      // Wzgórzach/Górach niezależnie od nakładki Las (bramka cywilizacji Inków bez zmian).
      case 'lama':
        terrainOk = teren !== TerenBazowy.Pustynia
          && (TERRAIN_ALLOW.lama?.has(teren) ?? false)
          && inPlayerTerritory(q, r)
          && isLivestockAllowed(playerCivArchetype, key, playerEra)
          && isLivestockUnlockedForPlacement(key, hex, empireUnlocks);
        break;
      // Stadnina ZOSTAJE zabroniona na lesie — patrz `isStadninaBlockedOnForest`
      // (poza ECHO właściciela z 2026-08-27, które objęło wyłącznie owce/bydło/lamę).
      case 'stadnina':
        terrainOk = inPlayerTerritory(q, r)
          && !isStadninaBlockedOnForest(key, nakladka)
          && (teren === TerenBazowy.Laka || teren === TerenBazowy.Rownina)
          && isLivestockAllowed(playerCivArchetype, key, playerEra)
          && (hex.nakladka === Nakladka.ZlozeKonia
            || isLivestockUnlockedForPlacement(key, hex, empireUnlocks));
        break;
      case 'droga':
        return TERENY_LADU.has(teren) && inPlayerTerritory(q, r) && isRoadQualified(q, r);
      // R-FORT-STRAZNICA-ROZSZERZA-ZASIEG-ZAKLADANIA krok 2 (Maciej 2026-08-09,
      // ECHO Q1=B): fort/posterunek NIE wymagaja juz wlasnego terytorium (regula
      // 1 — dozwolone wszedzie poza terenem NALEZACYM JUZ do innej cywilizacji,
      // czyli poza terytorium CUDZEGO MIASTA; regula 2 — same forty/posterunki
      // nie tworza wylacznosci, wiec CUDZY fort na tym hexie NIE blokuje), za to
      // wymagaja fizycznej obecnosci WLASNEJ jednostki na hexie w chwili budowy
      // (Q1 doprecyzowanie — jednoczesnie zdejmuje fog of war, wiec osobny
      // warunek widocznosci jest zbedny). / EN: fort/outpost no longer require
      // own territory (rule 1 — allowed anywhere except a hex already belonging
      // to another civ's CITY territory; rule 2 — a rival fort there does NOT
      // block), but require the builder's OWN unit physically present on the hex
      // at build time (Q1 clarification — also lifts fog of war by construction).
      case 'posterunek':
      case 'fort': {
        const owner = territoryNodes.length > 0 ? territoryOwnerAt(q, r, territoryNodes) : null;
        const rivalCityTerritory = owner !== null && owner !== playerOwnerIdNum;
        // Wewnatrz WLASNEGO terytorium zachowanie sprzed kroku 2 (bez wymogu
        // jednostki -- teren juz kontrolowany/widoczny). Wymog fizycznej
        // obecnosci (Q1 doprecyzowanie) dotyczy WYLACZNIE nowej mozliwosci --
        // budowy POZA wlasnym terytorium (unika regresji auto-ulepszen AI/gracza,
        // ktore nie przekazuja ownUnitHexKeys i budowaly fort/posterunek w
        // terytorium bez tego wymogu od zawsze). / EN: inside OWN territory,
        // pre-step-2 behaviour (no unit requirement -- ground already
        // controlled/visible). The physical-presence requirement (Q1
        // clarification) applies ONLY to the new capability -- building OUTSIDE
        // own territory (avoids regressing AI/player auto-improvements, which
        // don't pass ownUnitHexKeys and have always built fort/outpost inside
        // territory without this requirement).
        const ownTerritory = owner === playerOwnerIdNum || inPlayerTerritory(q, r);
        terrainOk = TERENY_LADU.has(teren) && !rivalCityTerritory
          && (ownTerritory || ownUnitHexKeys.has(hexKey));
        break;
      }
      case 'glinianka':
        terrainOk = hexHasClayDeposit(hex) && inPlayerTerritory(q, r);
        break;
      case 'kopalnia_zelaza':
        terrainOk = inPlayerTerritory(q, r)
          && (teren === TerenBazowy.Wzgorza || teren === TerenBazowy.Gory)
          && zloze === 'zelazo';
        break;
      case 'wyrab':
        if (state.pendingUndoKeys?.has(`${hexKey}:wyrab`)) return true;
        terrainOk = !state.clearingHexKeys?.has(hexKey)
          && nakladka === Nakladka.Las
          && inPlayerTerritory(q, r);
        break;
      case 'tartak':
        terrainOk = inPlayerTerritory(q, r)
          && nakladka === Nakladka.Las
          && TARTAK_TERENY.has(teren);
        break;
      // R-ULEPSZENIA-OBOZ-LOWIECKI-TYLKO-LAS-Q1 (Maciej): obóz łowiecki WYŁĄCZNIE na
      // nakładce Las — dowolny teren POD lasem (łąka, równina, WZGÓRZE), nigdy poza lasem.
      // Było: `Las LUB złoże zwierzęce` — stąd obozy poza lasem (złoże koni na równinie).
      // Dokładne porównanie enumu `Nakladka.Las`, NIGDY dopasowanie po podciągu nazwy terenu:
      // `normTerrain('Plaskie (rownina/laka)')` zawiera podciąg „las" (udowodniony błąd,
      // combat.ts:638-646). Bramka tematu: tools/oboz-lowiecki-las-test.cjs.
      case 'oboz_lowiecki':
        terrainOk = inPlayerTerritory(q, r) && nakladka === Nakladka.Las;
        break;
      case 'warzelnia_soli':
        terrainOk = inPlayerTerritory(q, r)
          && (teren === TerenBazowy.Wybrzeze || zloze === 'sol');
        break;
      case 'kopalnia_miedzi':
        terrainOk = inPlayerTerritory(q, r)
          && (teren === TerenBazowy.Wzgorza || teren === TerenBazowy.Gory)
          && (zloze === 'miedz' || nakladka === Nakladka.ZlozeRudy || zloze === 'ruda');
        break;
      case 'kopalnia_zlota':
        terrainOk = inPlayerTerritory(q, r)
          && (teren === TerenBazowy.Wzgorza || teren === TerenBazowy.Gory)
          && zloze === 'zloto';
        break;
      case 'kopalnia_cyny':
        terrainOk = inPlayerTerritory(q, r)
          && (teren === TerenBazowy.Wzgorza || teren === TerenBazowy.Gory)
          && zloze === 'cyna';
        break;
      case 'tarasy':
        terrainOk = inPlayerTerritory(q, r)
          && !hasBlockingDepositForFarm(hex)
          && teren === TerenBazowy.Wzgorza;
        break;
      case 'lodzie_rybackie':
        terrainOk = inPlayerTerritory(q, r)
          && (teren === TerenBazowy.Wybrzeze || teren === TerenBazowy.Morze);
        break;
      default: {
        const allowed = TERRAIN_ALLOW[key];
        terrainOk = TERENY_LADU.has(teren)
          && inPlayerTerritory(q, r)
          && (!allowed || allowed.has(teren));
        break;
      }
    }

    if (!terrainOk) return false;
    return computeImprovementBuildImpact(key, hex, existing) !== null;
  }

  return qualifies;
}

/** Wspólna kwalifikacja — używać w podglądach (placementpreview, mainview). */
export function buildImprovementQualifier(state: ImprovementBuildState): (
  key: ImprovementKey,
  q: number,
  r: number,
) => boolean {
  return createQualifier(state);
}

/**
 * Galeria 3D (improvepreview) — czy pokazać model na danym terenie.
 * Bez terytorium / złoża / rzeki — tylko reguła „na jakim terenie w ogóle może stać”.
 */
export function galleryTerrainEligible(key: ImprovementKey, teren: TerenBazowy): boolean {
  switch (key) {
    case 'farma':
      // R-ULEPSZENIA-FARMA-NIE-W-LESIE-Q1 (2026-08-27): `|| teren === Wzgorza` USUNIĘTE.
      // Wzgórza były tu wpuszczane WYŁĄCZNIE po to, by „Wzgórza z lasem" (reguła 2026-07-21)
      // przeszły przez tę wstępną bramkę do warstwy `isFarmBaseTerrain`. Po uchyleniu tamtej
      // reguły Wzgórza nie mają już ŻADNEJ drogi do farmy, więc galeria 3D i tooltip nie mogą
      // obiecywać więcej niż silnik.
      return FLAT_FARM.has(teren);
    case 'bydlo':
      return FLAT_FARM.has(teren);
    // N5 (P-HEX-TOOLTIP-MOZLIWE-ULEPSZENIA-BRAK-FILTRA-ZLOZA, Maciej 2026-08-14): stadnina i
    // kopalnia_cyny nie miały tu case'a -- wpadały w default -> false, więc tooltip heksu
    // (hexContextTooltip.ts) nigdy ich nie pokazywał, mimo że silnik (createQualifier) na nie
    // pozwalał. Dopisane tu terenowo -- ta sama para terenów co TERRAIN_ALLOW.stadnina (=
    // FLAT_FARM) / grupa kopalń niżej; zawężenie do konkretnego złoża (ZlozeKonia / zloze==='cyna')
    // zostaje w warstwie wyżej (listTerrainPossibleImprovements), tak jak dla bydlo/owce/lama i
    // pozostałych kopalń.
    // EN: stadnina and kopalnia_cyny had no case here -- fell through to default -> false, so the
    // hex tooltip never showed them even though the engine (createQualifier) allowed them. Added
    // here by terrain only -- same terrain pair as TERRAIN_ALLOW.stadnina (= FLAT_FARM) / the mine
    // group below; narrowing to the specific deposit (ZlozeKonia / zloze==='cyna') stays in the
    // layer above (listTerrainPossibleImprovements), same as bydlo/owce/lama and the other mines.
    case 'stadnina':
      return FLAT_FARM.has(teren);
    case 'irygacja':
      return FLAT_IRR.has(teren);
    case 'owce':
    case 'tarasy':
      return teren === TerenBazowy.Wzgorza;
    case 'lama':
      if (teren === TerenBazowy.Pustynia || teren === TerenBazowy.Morze) return false;
      return TERRAIN_ALLOW.lama?.has(teren) ?? false;
    case 'lodzie_rybackie':
      return teren === TerenBazowy.Wybrzeze || teren === TerenBazowy.Morze;
    case 'kamieniolom':
    case 'kopalnia_miedzi':
    case 'kopalnia_zelaza':
    case 'kopalnia_zlota':
    case 'kopalnia_cyny':
      return teren === TerenBazowy.Wzgorza || teren === TerenBazowy.Gory;
    case 'wyrab':
      return teren === TerenBazowy.Laka || teren === TerenBazowy.Rownina
        || teren === TerenBazowy.Wzgorza;
    case 'glinianka':
      return teren === TerenBazowy.Laka || teren === TerenBazowy.Rownina;
    // R-ULEPSZENIA-OBOZ-LOWIECKI-TYLKO-LAS-Q1: jedynym warunkiem obozu jest nakładka Las —
    // teren POD lasem jest bez znaczenia (Maciej: „niezależnie, czy to jest las na wzgórzu,
    // czy na innym terenie"). Poprzednie `Łąka|Równina` gubiło LAS NA WZGÓRZU: ta funkcja
    // jest pierwszym filtrem listy w tooltipie heksu (hexContextTooltip), więc obóz nie
    // pojawiał się na zalesionym wzgórzu mimo że budowa była dozwolona — asymetria
    // tooltip↔`qualifies()`. Ta funkcja nie widzi nakładki; warunek lasu egzekwuje
    // wywołujący (tooltip) i `createQualifier`. Wykluczamy tylko wodę.
    case 'oboz_lowiecki':
      return teren !== TerenBazowy.Morze && teren !== TerenBazowy.Wybrzeze;
    case 'warzelnia_soli':
      return teren === TerenBazowy.Wybrzeze || teren === TerenBazowy.Rownina;
    case 'droga':
    case 'droga_brukowana':
    case 'fort':
      return TERENY_LADU.has(teren);
    case 'tartak':
      return TARTAK_TERENY.has(teren);
    case 'posterunek':
      return teren !== TerenBazowy.Morze
        && teren !== TerenBazowy.Wybrzeze
        && TERENY_LADU.has(teren);
    default:
      return false;
  }
}

/** Galeria — czy combo warstw jest dozwolone na terenie (kanon §3). */
export function galleryComboEligible(keys: readonly string[], teren: TerenBazowy): boolean {
  const ks = keys.filter(k => k && k !== 'brak');
  if (ks.includes('farma') && ks.includes('bydlo') && ks.includes('owce')) {
    return false;
  }
  if (ks.includes('bydlo') && ks.includes('owce') && !ks.includes('farma')) {
    return false;
  }
  if (ks.includes('farma') && ks.includes('owce') && !ks.includes('bydlo')) {
    return false;
  }
  if (ks.includes('farma') && ks.includes('irygacja')) {
    return galleryTerrainEligible('farma', teren) && galleryTerrainEligible('irygacja', teren);
  }
  if (ks.includes('farma') && ks.includes('bydlo')) {
    return galleryTerrainEligible('farma', teren) && galleryTerrainEligible('bydlo', teren);
  }
  return ks.every(k => galleryTerrainEligible(k as ImprovementKey, teren));
}

/**
 * Galeria 3D — czy pokazać złożony model combo (≠ reguła gry dla podglądów wizualnych).
 * previewOnly: np. farma+bydło+owce — renderuj tam gdzie działa farma+bydło.
 */
export function galleryComboShowModel(
  keys: readonly string[],
  teren: TerenBazowy,
  previewOnly = false,
): boolean {
  const ks = keys.filter(k => k && k !== 'brak');
  if (previewOnly && ks.includes('farma') && ks.includes('bydlo') && ks.includes('owce')) {
    return galleryComboEligible(['farma', 'bydlo'], teren);
  }
  if (previewOnly && ks.includes('bydlo') && ks.includes('owce') && !ks.includes('farma')) {
    return galleryTerrainEligible('bydlo', teren);
  }
  if (previewOnly && ks.includes('farma') && ks.includes('owce') && !ks.includes('bydlo')) {
    return teren === TerenBazowy.Wzgorza || galleryTerrainEligible('farma', teren);
  }
  return galleryComboEligible(keys, teren);
}

// ---------------------------------------------------------------------------
// Podpowiedzi UX — tartak / wyrąb (las vs terytorium)
// ---------------------------------------------------------------------------

type ForestBuildKey = 'tartak' | 'wyrab';

interface ForestPlacementScan {
  /** Las z nakładką Las w terytorium gracza (dowolny teren). */
  lasInPlayerTerritory: number;
  /** Las kwalifikujący się do budowy danego typu. */
  qualifyingInPlayerTerritory: number;
  /** Las na mapie, ale poza zasięgiem miast gracza. */
  lasOutsidePlayerReach: number;
  /** Las w zasięgu, lecz należący do innej cywilizacji (overlap terytoriów). */
  lasInEnemyTerritory: number;
  /** Tartak: las gracza na terenie bez tartaku (góry, wybrzeże…). */
  lasWrongTerrainForTartak: number;
  /** Wyrąb: las gracza już w trakcie wycinki. */
  lasBeingCleared: number;
}

function scanForestPlacement(
  state: ImprovementBuildState,
  key: ForestBuildKey,
): ForestPlacementScan {
  const { map, cityNodes } = state;
  const playerOwnerIdNum = state.playerOwnerIdNum ?? 0;
  const territoryNodes = state.territoryNodes ?? [];
  const clearing = state.clearingHexKeys;
  const out: ForestPlacementScan = {
    lasInPlayerTerritory: 0,
    qualifyingInPlayerTerritory: 0,
    lasOutsidePlayerReach: 0,
    lasInEnemyTerritory: 0,
    lasWrongTerrainForTartak: 0,
    lasBeingCleared: 0,
  };

  for (const hex of Object.values(map.hexes)) {
    if (hex.nakladka !== Nakladka.Las) continue;
    const { q, r } = hex.coords;
    const hexKey = `${q},${r}`;
    const inReach = cityNodes.length > 0 && isInTerritory(q, r, cityNodes);
    if (!inReach) {
      out.lasOutsidePlayerReach++;
      continue;
    }
    const isPlayer = isPlayerTerritoryHex(q, r, cityNodes, territoryNodes, playerOwnerIdNum);
    if (!isPlayer) {
      out.lasInEnemyTerritory++;
      continue;
    }
    out.lasInPlayerTerritory++;

    if (key === 'tartak' && !TARTAK_TERENY.has(hex.terenBazowy)) {
      out.lasWrongTerrainForTartak++;
      continue;
    }
    if (key === 'wyrab' && clearing?.has(hexKey)) {
      out.lasBeingCleared++;
      continue;
    }
    out.qualifyingInPlayerTerritory++;
  }

  return out;
}

/**
 * Dokładna podpowiedź gdy tartak/wyrąb odblokowany technologicznie,
 * ale brak heksa do postawienia — rozróżnia brak miasta, las poza terytorium,
 * las wroga, zły teren (tartak) i trwającą wycinkę (wyrąb).
 */
export function getForestBuildBlockReason(
  state: ImprovementBuildState,
  key: ForestBuildKey,
): string | null {
  if (state.cityNodes.length === 0) {
    return 'Najpierw załóż miasto — bez terytorium nie zbudujesz na lesie.';
  }

  const scan = scanForestPlacement(state, key);

  if (scan.qualifyingInPlayerTerritory > 0) {
    return null;
  }

  if (key === 'wyrab' && scan.lasInPlayerTerritory > 0 && scan.lasBeingCleared >= scan.lasInPlayerTerritory) {
    return 'Wszystkie lasy w twoim terytorium są już w trakcie wycinki.';
  }

  if (key === 'tartak' && scan.lasWrongTerrainForTartak > 0 && scan.qualifyingInPlayerTerritory === 0) {
    if (scan.lasWrongTerrainForTartak >= scan.lasInPlayerTerritory) {
      return 'Las w twoim terytorium jest na górach lub wybrzeżu — tartak wymaga łąki, równiny lub wzgórza.';
    }
    return 'Część lasu w twoim terytorium jest na złym terenie — tartak stawia się na łące, równinie lub wzgórzu.';
  }

  if (scan.lasInEnemyTerritory > 0 && scan.lasInPlayerTerritory === 0) {
    return 'Las w zasięgu miasta należy do innej cywilizacji — najpierw przejmij ten obszar.';
  }

  if (scan.lasOutsidePlayerReach > 0 && scan.lasInPlayerTerritory === 0) {
    return 'Las widać na mapie, ale jest poza twoim terytorium. Powiększ miasto albo postaw posterunek bliżej lasu.';
  }

  if (scan.lasInPlayerTerritory === 0) {
    return 'W twoim terytorium nie ma lasu — poszukaj zielonych pól z drzewami i rozszerz zasięg miasta.';
  }

  return 'Brak lasu w twoim terytorium';
}

// ---------------------------------------------------------------------------
// Fabryka API
// ---------------------------------------------------------------------------

/**
 * Tworzy callbacki frontu budowy ulepszeń z mapy (D4=A).
 * MASTER wpina onSelect → kolejka tury / turn-economy (koszt Pracy).
 */
export function createImprovementBuildApi(
  state: ImprovementBuildState,
  mode: ImprovementBuildModeOptions = { activeKey: null },
): ImprovementBuildCallbacks {
  const qualifies = createQualifier(state);
  const { map } = state;

  const researched = state.researchedTechs ?? new Set<string>();

  // D13 (perf): zamiast skanować całe map.hexes (~320k) w getQualifyingHexes —
  // a listTypes() robi to dla KAŻDEGO typu (~19×) na każdy render HUD budowy —
  // budujemy zbiór kandydatów RAZ. To wszystkie heksy, które w ogóle MOGĄ przejść
  // qualifies() dla dowolnego klucza:
  //   • terytorium gracza + 1 pierścień  (posterunek: isOnTerritoryEdge = sąsiad terytorium),
  //   • istniejące drogi                 (droga_brukowana nie sprawdza terytorium),
  //   • placedKeys / pendingUndoKeys     (ścieżki w qualifies() zwracające true poza terytorium),
  //   • ownUnitHexKeys                   (R-FORT-STRAZNICA krok 2: fort/posterunek poza
  //     terytorium kwalifikują się WYŁĄCZNIE na hexie z własną jednostką — patrz Q1=B).
  // Każdy heks SPOZA tego zbioru zwróciłby z qualifies() false, więc wynik jest
  // IDENTYCZNY jak przy pełnym skanie (predykat qualifies bez zmian).
  const candidateHexKeys: Set<string> = (() => {
    const set = new Set<string>();
    for (const node of state.cityNodes) {
      const rad = cityTerritoryRadius(node) + 1;
      for (const k of hexKeysWithinRadius(node.q, node.r, rad, map)) set.add(k);
    }
    if (state.roadKeys) for (const k of state.roadKeys) set.add(k);
    if (state.placedKeys) for (const k of state.placedKeys) set.add(k);
    if (state.pendingUndoKeys) {
      for (const composite of state.pendingUndoKeys) {
        const idx = composite.lastIndexOf(':');
        if (idx > 0) set.add(composite.slice(0, idx));
      }
    }
    if (state.ownUnitHexKeys) for (const k of state.ownUnitHexKeys) set.add(k);
    return set;
  })();

  const getWorkCost = (key: ImprovementKey): number =>
    getImprovementMeta(key)?.kosztPraca ?? readWorkCost(key);

  const canBuild = (key: ImprovementKey, q: number, r: number): boolean =>
    qualifies(key, q, r);

  const getQualifyingHexes = (key: ImprovementKey): Array<{ q: number; r: number }> => {
    const out: Array<{ q: number; r: number }> = [];
    for (const hk of candidateHexKeys) {
      const hex = map.hexes[hk];
      if (!hex) continue;
      const { q, r } = hex.coords;
      if (qualifies(key, q, r)) out.push({ q, r });
    }
    return out;
  };

  const playerCiv = state.playerCivArchetype;
  const playerEraNum = state.playerEra ?? 1;

  const listTypes = (): ImprovementTypeInfo[] =>
    IMPROVEMENTS.filter(({ key }) =>
      isImprovementVisibleInBuildPanel(key, playerCiv, playerEraNum),
    ).map(({ key, label, epoka }) => {
      const meta = getImprovementMeta(key);
      const techId = meta?.techId ?? null;
      const typ = meta?.typ ?? 'ulepszenie';
      const koszt = meta?.kosztPraca ?? readWorkCost(key);
      const unlocked = isImprovementTechUnlocked(key, researched);
      const canPlaceAny = getQualifyingHexes(key).length > 0;
      const territoryHint = unlocked && !canPlaceAny
        ? (key === 'wyrab' || key === 'tartak'
          ? (getForestBuildBlockReason(state, key) ?? 'Brak lasu w twoim terytorium')
          : 'Brak heksów w twoim terytorium')
        : null;
      return {
        key,
        label: meta?.nazwa ?? label,
        kosztPraca: koszt,
        epoka,
        typ,
        techId,
        techUnlocked: unlocked && canPlaceAny,
        techLabel: techId,
        lockHint: !unlocked
          ? getImprovementLockHint(key, researched)
          : territoryHint,
      };
    });

  const createBuildRequest = (
    key: ImprovementKey,
    q: number,
    r: number,
  ): ImprovementBuildRequest | null => {
    if (!qualifies(key, q, r)) return null;
    if (!isImprovementTechUnlocked(key, researched)) return null;
    const hexKey = `${q},${r}`;
    const meta = getImprovementMeta(key);
    return {
      type: 'buildImprovement',
      key,
      q,
      r,
      hexKey,
      kosztPraca: meta?.kosztPraca ?? readWorkCost(key),
      action: meta?.typ ?? 'ulepszenie',
    };
  };

  const handleHexClick = (q: number, r: number): ImprovementBuildRequest | null => {
    const key = mode.activeKey;
    if (!key) return null;
    const hexKey = `${q},${r}`;
    if (state.pendingUndoKeys?.has(`${hexKey}:${key}`)) {
      const meta = getImprovementMeta(key);
      const req: ImprovementBuildRequest = {
        type: 'buildImprovement',
        key,
        q,
        r,
        hexKey,
        kosztPraca: meta?.kosztPraca ?? readWorkCost(key),
        action: meta?.typ ?? 'ulepszenie',
      };
      mode.onSelect?.(req);
      return req;
    }
    const req = createBuildRequest(key, q, r);
    if (req) mode.onSelect?.(req);
    return req;
  };

  const api: ImprovementBuildCallbacks = {
    listTypes,
    getWorkCost,
    canBuild,
    getQualifyingHexes,
    createBuildRequest,
  };
  if (mode.activeKey) {
    api.handleHexClick = handleHexClick;
  }
  return api;
}

/** Eksport pomocniczy: buduje Set kluczy dróg z mapy (droga + droga brukowana). */
export function collectRoadKeys(map: GameMap): Set<string> {
  const keys = new Set<string>();
  for (const [key, hex] of Object.entries(map.hexes)) {
    if (hexHasRoad(hex)) keys.add(key);
  }
  return keys;
}

/** Klucze ulepszeń drogowych (sieć dróg). */
export { isRoadImprovementKey };
