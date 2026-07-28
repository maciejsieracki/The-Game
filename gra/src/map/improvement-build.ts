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
import { improvementKeysForHex, normalizeImprovementKey } from '../game/terrain-improvements';
import { hexHasRoad, isRoadImprovementKey } from './road-movement';
import {
  getImprovementMeta,
  isImprovementTechUnlocked,
  getImprovementLockHint,
  type ImprovementActionTyp,
} from '../game/improvement-tech';

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

/** Po usunięciu lasu z heksa — odfiltruj ulepszenia zależne od nakładki Las (tartak NIE — kanon: las zostaje przy tartaku). */
export function stripImprovementsWhenForestRemoved(layers: readonly string[]): string[] {
  return [...layers];
}

const FLAT_FARM = new Set<TerenBazowy>([TerenBazowy.Laka, TerenBazowy.Rownina]);
const FLAT_IRR = new Set<TerenBazowy>([
  TerenBazowy.Laka, TerenBazowy.Rownina, TerenBazowy.Pustynia,
]);

/** Maciej 2026-07-21: farma bez wycinki lasu — Łąka/Równina zawsze; Wzgórza gdy nakładka Las. */
export function isFarmBaseTerrain(teren: TerenBazowy, nakladka: Nakladka): boolean {
  if (FLAT_FARM.has(teren)) return true;
  return nakladka === Nakladka.Las && teren === TerenBazowy.Wzgorza;
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
  kopalnia: 'surowiec', glinianka: 'surowiec',
  stadnina: 'surowiec', kopalnia_miedzi: 'surowiec',
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
  // las (bok 1 — surowiec leśny)
  wyrab: 'las', tartak: 'las', oboz_lowiecki: 'las',
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

type TerenSet = Set<TerenBazowy>;

const TERRAIN_ALLOW: Partial<Record<ImprovementKey, TerenSet | null>> = {
  farma: FLAT_FARM,
  irygacja: FLAT_IRR,
  bydlo: FLAT_FARM,
  owce: new Set([TerenBazowy.Wzgorza]),
  lama: new Set([TerenBazowy.Wzgorza, TerenBazowy.Gory]), // decyzja 3a: lama tylko wzgórza + góry
  stadnina: new Set([TerenBazowy.Laka, TerenBazowy.Rownina]),
  kopalnia: new Set([TerenBazowy.Wzgorza, TerenBazowy.Gory]),
  glinianka: null,
  kamieniolom: new Set([TerenBazowy.Wzgorza, TerenBazowy.Gory]), // Maciej 2026-07-24: Wzgórza+Góry (nie zawsze mamy dostęp do gór); teren, bez złoża
  oboz_lowiecki: null,
  wyrab: null,
  lodzie_rybackie: new Set([TerenBazowy.Wybrzeze, TerenBazowy.Morze]),
  tarasy: new Set([TerenBazowy.Wzgorza]),
  fort: null,
  droga: null,
  droga_brukowana: null,
  posterunek: null,
  kopalnia_miedzi: new Set([TerenBazowy.Wzgorza, TerenBazowy.Gory]),
  // Maciej 2026-07-25: złoto żyłowe — Wzgórza/Góry, jak kopalnia_miedzi (patrz DEPOSIT_RULES
  // gen-helpers.ts id='zloto').
  kopalnia_zlota: new Set([TerenBazowy.Wzgorza, TerenBazowy.Gory]),
};

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
      return nakladka === Nakladka.ZlozeGliny;
    case 'kopalnia': // Maciej 2026-07-09: kopalnia żelaza — żelazo/węgiel/generyczna ruda (NIE miedź)
      if (teren === TerenBazowy.Gory) {
        return zloze === 'zelazo' || zloze === 'wegiel'
          || nakladka === Nakladka.ZlozeRudy;
      }
      return nakladka === Nakladka.ZlozeRudy;
    case 'warzelnia_soli':
      return zloze === 'sol';
    case 'kopalnia_miedzi': // kopalnia miedzi — TYLKO ruda miedzi
      return zloze === 'miedz';
    case 'kopalnia_zlota': // kopalnia złota — TYLKO złoże złota (Maciej 2026-07-25)
      return zloze === 'zloto';
    case 'bydlo':
      return nakladka === Nakladka.ZlozeBydla;
    case 'owce':
      return nakladka === Nakladka.ZlozeOwiec;
    case 'lama':
      return nakladka === Nakladka.ZlozeLamy;
    case 'stadnina':
      return hex.nakladka === Nakladka.ZlozeKonia;
    case 'oboz_lowiecki':
      return nakladka === Nakladka.Las || hasAnimalDeposit(nakladka);
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
  return entry?.koszt_praca ?? 20;
}

const NAKLADKI_ZWIERZECZE = new Set<Nakladka>([
  Nakladka.ZlozeKonia, Nakladka.ZlozeOwiec,
  Nakladka.ZlozeBydla, Nakladka.ZlozeLamy,
]);

function hasAnimalDeposit(nakladka: Nakladka): boolean {
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

    // WOLNE WSPÓŁISTNIENIE + „jeden per bok" (Maciej 2026-07-09, §5): ulepszenia różnych sektorów
    // współistnieją; w obrębie jednego sektora maks. jedno; brak duplikatu klucza. Droga = środek (osobno).
    if (key !== 'droga') {
      if (existing.includes(key)) return false;                     // brak duplikatu tego samego ulepszenia
      const sekt = SEKTOR_OF[key];
      if (sekt && EXCLUSIVE_SEKTORY.has(sekt)
        && existing.some(k => SEKTOR_OF[k] === sekt)) return false; // jeden per bok
    } else if (placedKeys.has(hexKey)) {
      return false;
    }

    switch (key) {
      case 'farma':
        if (!isFarmBaseTerrain(teren, nakladka)) return false;
        if (hasBlockingDepositForFarm(hex)) return false;
        if (!inPlayerTerritory(q, r)) return false;
        return true;
      case 'irygacja':
        if (!FLAT_IRR.has(teren)) return false;
        if (hasBlockingDepositForFarm(hex)) return false;
        if (!inPlayerTerritory(q, r)) return false;
        return isRiverAdjacent(q, r);
      case 'bydlo':
        if (!FLAT_FARM.has(teren)) return false;
        if (!inPlayerTerritory(q, r)) return false;
        if (!isLivestockAllowed(playerCivArchetype, key, playerEra)) return false;
        return isLivestockUnlockedForPlacement(key, hex, empireUnlocks);
      case 'owce':
        if (teren !== TerenBazowy.Wzgorza) return false;
        if (!inPlayerTerritory(q, r)) return false;
        if (!isLivestockAllowed(playerCivArchetype, key, playerEra)) return false;
        return isLivestockUnlockedForPlacement(key, hex, empireUnlocks);
      case 'lama':
        if (teren === TerenBazowy.Pustynia) return false;
        if (!TERRAIN_ALLOW.lama?.has(teren)) return false;
        if (!inPlayerTerritory(q, r)) return false;
        if (!isLivestockAllowed(playerCivArchetype, key, playerEra)) return false;
        return isLivestockUnlockedForPlacement(key, hex, empireUnlocks);
      case 'stadnina':
        if (!inPlayerTerritory(q, r)) return false;
        if (teren !== TerenBazowy.Laka && teren !== TerenBazowy.Rownina) return false;
        if (!isLivestockAllowed(playerCivArchetype, key, playerEra)) return false;
        return hex.nakladka === Nakladka.ZlozeKonia
          || isLivestockUnlockedForPlacement(key, hex, empireUnlocks);
      case 'droga':
        return TERENY_LADU.has(teren) && inPlayerTerritory(q, r) && isRoadQualified(q, r);
      case 'posterunek':
        return TERENY_LADU.has(teren) && inPlayerTerritory(q, r);
      case 'fort':
        return TERENY_LADU.has(teren) && inPlayerTerritory(q, r);
      case 'glinianka':
        return nakladka === Nakladka.ZlozeGliny && inPlayerTerritory(q, r);
      case 'kopalnia': // Maciej 2026-07-09: kopalnia żelaza — żelazo/węgiel/generyczna ruda (NIE miedź)
        if (!inPlayerTerritory(q, r)) return false;
        if (teren !== TerenBazowy.Gory) return nakladka === Nakladka.ZlozeRudy;
        return zloze === 'zelazo' || zloze === 'wegiel' ||
          nakladka === Nakladka.ZlozeRudy;
      case 'wyrab':
        if (state.pendingUndoKeys?.has(`${hexKey}:wyrab`)) return true;
        if (state.clearingHexKeys?.has(hexKey)) return false;
        return nakladka === Nakladka.Las && inPlayerTerritory(q, r);
      case 'tartak': {
        if (!inPlayerTerritory(q, r)) return false;
        if (nakladka !== Nakladka.Las) return false;
        return TARTAK_TERENY.has(teren);
      }
      case 'oboz_lowiecki': {
        if (!inPlayerTerritory(q, r)) return false;
        return nakladka === Nakladka.Las || hasAnimalDeposit(nakladka);
      }
      case 'warzelnia_soli':
        if (!inPlayerTerritory(q, r)) return false;
        // ZADANIE 1: Wybrzeże = woda — sól z morza, jak lodzie_rybackie (bez wymogu złoża).
        if (teren === TerenBazowy.Wybrzeze) return true;
        return zloze === 'sol';
      case 'kopalnia_miedzi': // Maciej 2026-07-09: kopalnia miedzi — TYLKO ruda miedzi
        if (!inPlayerTerritory(q, r)) return false;
        if (teren !== TerenBazowy.Wzgorza && teren !== TerenBazowy.Gory) return false;
        return zloze === 'miedz';
      case 'kopalnia_zlota': // Maciej 2026-07-25: kopalnia złota — TYLKO złoże złota
        if (!inPlayerTerritory(q, r)) return false;
        if (teren !== TerenBazowy.Wzgorza && teren !== TerenBazowy.Gory) return false;
        return zloze === 'zloto';
      case 'tarasy': {
        if (!inPlayerTerritory(q, r)) return false;
        if (hasBlockingDepositForFarm(hex)) return false;
        return teren === TerenBazowy.Wzgorza;
      }
      case 'lodzie_rybackie':
        if (!inPlayerTerritory(q, r)) return false;
        return teren === TerenBazowy.Wybrzeze || teren === TerenBazowy.Morze;
      default: {
        const allowed = TERRAIN_ALLOW[key];
        if (!TERENY_LADU.has(teren)) return false;
        if (!inPlayerTerritory(q, r)) return false;
        if (allowed && !allowed.has(teren)) return false;
        return true;
      }
    }
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
      return FLAT_FARM.has(teren) || teren === TerenBazowy.Wzgorza;
    case 'bydlo':
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
    case 'kopalnia':
    case 'kamieniolom':
    case 'kopalnia_miedzi':
    case 'kopalnia_zlota':
      return teren === TerenBazowy.Wzgorza || teren === TerenBazowy.Gory;
    case 'wyrab':
      return teren === TerenBazowy.Laka || teren === TerenBazowy.Rownina
        || teren === TerenBazowy.Wzgorza;
    case 'glinianka':
      return teren === TerenBazowy.Laka || teren === TerenBazowy.Rownina;
    case 'oboz_lowiecki':
      return teren === TerenBazowy.Laka || teren === TerenBazowy.Rownina;
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
  //   • placedKeys / pendingUndoKeys     (ścieżki w qualifies() zwracające true poza terytorium).
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
