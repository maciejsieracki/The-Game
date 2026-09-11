/**
 * cluster-start.ts — orchestracja startu klastra (SILNIK / handoff).
 * Składa MAPA cluster-spawn + CYWILIZACJE civ-names w plan gotowy do main.ts.
 */

import type { CivsData } from '../data/loader';
import type { GameMap } from '../types/map';
import type { CityNamesPoolsData } from './city-names-pool';
import {
  buildClusterSpawnPlan,
  buildSameTypeRivalCandidateHexes,
  displayLabelForSlot,
  pickSecondHumanStartHex,
  type ClusterSpawnPlan,
  type ClusterSpawnSlot,
  type ForeignTypeClusterGroup,
  type HumanDistanceMode,
} from '../map/cluster-spawn';
import { startRelationForPair } from './diplomacy-layers';
import type { Relation } from './diplomacy';
import { hexDistance } from '../units/setup';
import { MIN_CITY_DISTANCE, MIN_CITY_DISTANCE_START_CITY_STATE } from './cities';

export type { ClusterSpawnSlot, ClusterSpawnPlan, ForeignTypeClusterGroup, HumanDistanceMode };
export { buildSameTypeRivalSlots, buildSameTypeRivalCandidateHexes } from '../map/cluster-spawn';

export interface ClusterStartPlan {
  playerStartHex: { q: number; r: number };
  playerStartCityName: string;
  /**
   * R-HOTSEAT-ETAP6F-PART2-DATA-Q1: heks startowy DRUGIEGO człowieka
   * (hot-seat), algorytmicznie zarezerwowany przez generator (ABC-Q1) — `null`
   * gdy `BuildClusterStartInput.secondHumanCivId` nie było podane (dzisiejsze
   * single-player, no-op) LUB gdy generator nie znalazł żadnego legalnego
   * heksu (skrajny przypadek bardzo małej mapy).
   */
  secondPlayerStartHex: { q: number; r: number } | null;
  /**
   * ownerId zarezerwowany dla drugiego człowieka — wyliczony jako pierwszy
   * wolny numer PO wszystkich ownerId zajętych przez AI/rywali tego samego
   * typu w TYM planie (zero kolizji z rosterem AI). `null` symetrycznie do
   * `secondPlayerStartHex`.
   */
  secondPlayerOwnerId: number | null;
  aiStartHexes: Array<{ q: number; r: number; ownerId: number }>;
  spawnCities: Array<{ q: number; r: number; ownerId: number; name: string }>;
  /** Obcy typ → pełny klaster (MAP-P1-01). */
  foreignTypeClusters: ForeignTypeClusterGroup[];
  aiOwnerCivMap: Map<number, string>;
  ownerDisplayName: Map<number, string>;
  simplifiedDiplomacyOwners: Set<number>;
  /** Obcy typ — pełna dyplomacja dopiero po kontakcie (D-START-3A). */
  foreignTypeOwners: Set<number>;
  /** Wszystkie miasta AI z klastra — profil kopia_typu_obronna. */
  typCityCopyOwners: Set<number>;
  startRelations: Map<number, Relation>;
  placement: ClusterSpawnPlan['placement'];
  /** Liczba miast-państw do spawnu wokół pierwszego miasta gracza. */
  pendingSameTypeRivals: number;
  /** Pre-planowane hexy państw gracza (klaster z mapgen). */
  pendingSameTypeRivalHexes: Array<{ q: number; r: number }>;
  /** Zarezerwowane ownerId dla deferred same-type rivals (BUG-MP-NAZWA-CIV-MISMATCH). */
  pendingSameTypeRivalOwnerIds: number[];
  /**
   * R-HOTSEAT-FOTEL2-CYWILIZACJA-BLEDNA-Q1 (defekt C): liczba miast-państw
   * WŁASNEJ cywilizacji drugiego fotela ludzkiego, do spawnu wokół JEGO
   * faktycznej stolicy — niezależna od `pendingSameTypeRivals` (fotel 1),
   * zamiast drenować tę samą, jednorazową kolejkę. `0` gdy `secondHumanCivId`
   * nie było podane LUB generator nie zarezerwował `secondPlayerStartHex`.
   * Rozmiar lustrzany do `pendingSameTypeRivals` (ten sam `rywaleNaKlaster`
   * przeliczony przez `buildClusterSpawnPlan` dla gracza pierwszego) — nie
   * duplikujemy tu logiki mapgen (poza allowlistą tego tematu).
   */
  pendingSameTypeRivalsSecond: number;
  /** Zarezerwowane ownerId dla deferred same-type rivals DRUGIEGO fotela — rozłączne
   *  od `pendingSameTypeRivalOwnerIds`, `aiStartHexes` i `secondPlayerOwnerId`. */
  pendingSameTypeRivalOwnerIdsSecond: number[];
  /** Stolice klastrów obcych typów — ekspansyjna AI (faza 1). */
  clusterCapitalOwnerIds: number[];
}

export interface BuildClusterStartInput {
  map: GameMap;
  civs: CivsData;
  seed: number;
  playerCivId: string;
  rywaleNaKlaster: number;
  aktywneTypy?: number;
  /** Epoka startu — filtr puli typów na mapie (kamien | braz | zelazo). */
  startEpochId?: string;
  cityNamesPools?: CityNamesPoolsData;
  /**
   * R-KONFIGURATOR-WYBOR-CYWILIZACJI-PRZECIWNIKA runda 2: typy AI wybrane przez
   * gracza w kreatorze, w kolejności zaznaczenia — przekazane do
   * buildClusterSpawnPlan()/computeClusters(). Puste/undefined = zachowanie bez
   * zmian (dzisiejszy deterministyczny ROSTER_KLUCZE).
   * / EN: AI types chosen by the player in the wizard, in selection order —
   * passed to buildClusterSpawnPlan()/computeClusters(). Empty/undefined =
   * unchanged behaviour (today's deterministic ROSTER_KLUCZE).
   */
  preferredCivIds?: readonly string[];
  /**
   * R-HOTSEAT-ETAP6F-PART2-DATA-Q1: cywilizacja DRUGIEGO fotela ludzkiego
   * (hot-seat). `undefined` = brak drugiego człowieka — generator zachowuje
   * się DOKŁADNIE jak dziś (zero nowego heksu, zero nowego ownerId, dowód
   * no-op tego tematu). Musi różnić się od `playerCivId` — inaczej
   * `buildClusterStartPlan` rzuca (ABC-Q3, wykluczenie duplikatu, symetrycznie
   * do wykluczenia cywilizacji AI przez `_menuSelectedAiCivIds`).
   */
  secondHumanCivId?: string;
  /**
   * Tryb dystansu między dwoma heksami-ludźmi (ABC-Q4). Domyślnie `'losowo'`
   * gdy `secondHumanCivId` jest podane, a tryb pominięty. Bez efektu, gdy
   * `secondHumanCivId` nie jest podane.
   */
  humanDistanceMode?: HumanDistanceMode;
  /**
   * Jawne ownerId dla drugiego człowieka (np. z `humanSeats.humanOwnerIds[1]`
   * po stronie wołającego). Gdy pominięte, generator wylicza pierwszy wolny
   * numer po wszystkich ownerId AI z tego planu — bezpieczny fallback dla
   * wołających, którzy jeszcze nie mają ustalonej numeracji foteli.
   */
  secondHumanOwnerId?: number;
}

/** Pełny plan startu — konsumuje SILNIK w doStartGame(). */
export function buildClusterStartPlan(input: BuildClusterStartInput): ClusterStartPlan {
  // ABC-Q3 (wykluczenie duplikatu): fotel 2 NIE może wybrać tę samą
  // cywilizację co fotel 1 — symetrycznie do wykluczenia cywilizacji AI przez
  // `_menuSelectedAiCivIds`. Rzucamy tu, w generatorze, bo to jedyne miejsce
  // tego pod-tematu (dane/generator, zero UI) gwarantowane do wywołania przed
  // faktycznym rezerwowaniem drugiego heksu — cichy fallback ukryłby błędne
  // wywołanie zamiast go zgłosić.
  if (input.secondHumanCivId !== undefined && input.secondHumanCivId === input.playerCivId) {
    throw new Error(
      `buildClusterStartPlan: secondHumanCivId ('${input.secondHumanCivId}') nie może być ` +
      `identyczne z playerCivId — ABC-Q3, wykluczenie duplikatu cywilizacji fotela 2.`,
    );
  }

  const spawnPlan = buildClusterSpawnPlan({
    map: input.map,
    civs: input.civs,
    seed: input.seed,
    playerTyp: input.playerCivId,
    rywaleNaKlaster: input.rywaleNaKlaster,
    aktywneTypy: input.aktywneTypy,
    startEpochId: input.startEpochId,
    cityNamesPools: input.cityNamesPools,
    preferredCivIds: input.preferredCivIds,
  });

  const aiOwnerCivMap = new Map<number, string>();
  const ownerDisplayName = new Map<number, string>();
  const simplifiedDiplomacyOwners = new Set<number>();
  const foreignTypeOwners = new Set<number>();
  const typCityCopyOwners = new Set<number>();
  const startRelations = new Map<number, Relation>();
  const spawnCities: ClusterStartPlan['spawnCities'] = [];
  const aiStartHexes: ClusterStartPlan['aiStartHexes'] = [];
  // P-MIASTA-ZBYT-BLISKO-SIEBIE-Q1 runda 2: ownerId faktycznie zaakceptowanych
  // (nieodrzuconych kolizją) slotów — używane PO pętli do filtrowania
  // `foreignTypeClusters`/`clusterCapitalOwnerIds`, patrz komentarz przy ich
  // budowie niżej.
  const acceptedOwnerIds = new Set<number>();

  // P-MIASTA-ZBYT-BLISKO-SIEBIE-Q1: dystans MIĘDZY RÓŻNYMI klastrami/miastami-
  // -państwami nie był nigdzie weryfikowany — komentarz przy polu `clusterStartSlot`
  // w `cities.ts` zakładał, że jest "już zweryfikowany w map/clusters", ale to
  // dotyczy wyłącznie rozstawu BRYŁ/stolic (`clusterBodySeparationForMap`,
  // `capitalMinSeparationForMap`), nie realnego `canFoundCity`/`MIN_CITY_DISTANCE`
  // per para miast. Dowód empiryczny: `tools/miasta-zbyt-blisko-test.cjs`
  // (6/20 wygenerowanych map miało parę miast-państw z RÓŻNYCH klastrów bliżej niż
  // próg). Naprawa: sekwencyjna weryfikacja każdego nowego slotu względem
  // WSZYSTKICH już zaakceptowanych miast (gracz + wcześniejsze sloty, niezależnie
  // od klastra) — dokładnie ta sama reguła progu co `canFoundCity`
  // (MIN_CITY_DISTANCE / MIN_CITY_DISTANCE_START_CITY_STATE, próg 3 gdy któreś z
  // dwóch miast jest miastem-państwem). Slot kolidujący jest ODRZUCANY (miasto się
  // nie zakłada) — ten sam wzorzec co istniejące `extraCitiesBlocked` w
  // `ai-difficulty-bonus.ts`, żadna nowa liczba balansu. Sloty WEWNĄTRZ jednego
  // klastra nie są tym w praktyce dotknięte (0 naruszeń zmierzonych empirycznie
  // bez tej poprawki) — rozstaw wewnątrz bryły był już wystarczający.
  const acceptedForDistance: Array<{ q: number; r: number; isCityState: boolean }> = [
    { q: spawnPlan.playerStartHex.q, r: spawnPlan.playerStartHex.r, isCityState: false },
  ];

  for (const slot of spawnPlan.slots) {
    // P-MIASTA-ZBYT-BLISKO-SIEBIE-Q1 runda 2 (Zarzut 1 Evaluatora, POTWIERDZONY
    // własną symulacją Evaluatora: 3/20 map, w tym seed=42 owner 37 — DOKŁADNIE
    // przypadek cytowany w diagnozie runda 1 jako dowód kolizji). Runda 1
    // rejestrowała właściciela (aiOwnerCivMap/ownerDisplayName/
    // simplifiedDiplomacyOwners|foreignTypeOwners/typCityCopyOwners/
    // startRelations) PRZED sprawdzeniem kolizji dystansu — odrzucony slot
    // (`continue`) zostawiał wtedy "widmowego" właściciela zarejestrowanego jako
    // pełnoprawna cywilizacja/miasto-państwo bez ŻADNEGO miasta na mapie. Naprawa:
    // rejestracja właściciela przeniesiona PO sprawdzeniu kolizji, symetrycznie do
    // spawnCities/aiStartHexes/acceptedForDistance — odrzucony slot nie rejestruje
    // już nic.

    // Miasto-państwo / kopia typu (nie stolica klastra) dostaje próg 3, tak jak
    // w `canFoundCity` — ten sam warunek, który stosuje `spawnPendingForeignClusters`
    // po stronie main.ts (`isCS = simplifiedDiplomacyOwners.has(...) || typCityCopyOwners.has(...)`).
    const slotIsCityState = slot.isSameTypeRival || !slot.isClusterCapital;
    const collides = acceptedForDistance.some(prev => {
      const minDist = (prev.isCityState || slotIsCityState)
        ? MIN_CITY_DISTANCE_START_CITY_STATE
        : MIN_CITY_DISTANCE;
      return hexDistance(slot.q, slot.r, prev.q, prev.r) < minDist;
    });
    if (collides) continue;

    aiOwnerCivMap.set(slot.ownerId, slot.typ);
    ownerDisplayName.set(slot.ownerId, displayLabelForSlot(input.civs, slot));
    if (slot.isSameTypeRival) simplifiedDiplomacyOwners.add(slot.ownerId);
    else foreignTypeOwners.add(slot.ownerId);
    if (!slot.isClusterCapital) typCityCopyOwners.add(slot.ownerId);
    startRelations.set(slot.ownerId, startRelationForPair(slot.isSameTypeRival));

    spawnCities.push({
      q: slot.q,
      r: slot.r,
      ownerId: slot.ownerId,
      name: slot.nazwaMiasta,
    });
    aiStartHexes.push({ q: slot.q, r: slot.r, ownerId: slot.ownerId });
    acceptedForDistance.push({ q: slot.q, r: slot.r, isCityState: slotIsCityState });
    acceptedOwnerIds.add(slot.ownerId);
  }

  // P-MIASTA-ZBYT-BLISKO-SIEBIE-Q1 runda 2: `foreignTypeClusters` i
  // `clusterCapitalOwnerIds` z `spawnPlan` (buildClusterSpawnPlan) opisują
  // sloty SPRZED weryfikacji kolizji powyżej — bez tego filtrowania mogły
  // nadal wymieniać ownerId odrzuconego slotu, mimo że ten sam ownerId już
  // nie istnieje w `aiOwnerCivMap`/`typCityCopyOwners`/itd. (naprawione w
  // Zarzucie 1). Filtrujemy symetrycznie, tym samym zbiorem `acceptedOwnerIds`:
  // - `foreignTypeClusters`: usuwamy z każdej grupy ownerId+pozycję odrzuconego
  //   slotu (parami, żeby `ownerIds.length === positions.length` zostało
  //   zachowane — sprawdzane wprost przez `cluster-start-test.cjs`); grupę,
  //   której WSZYSTKIE sloty odrzucono, usuwamy w całości (0 miast na mapie —
  //   nic nie ma sensu reprezentować).
  // - `clusterCapitalOwnerIds`: usuwamy odrzucone id stolic klastrów.
  //
  // Runda 3: jeśli WŁAŚNIE stolica klastra (`group.ownerIds[0]` —
  // `groupForeignTypeClusters` w map/cluster-spawn.ts gwarantuje kolejność
  // "stolica → rywale") koliduje i zostaje odrzucona, a inny slot (kopia typu)
  // TEGO SAMEGO klastra przetrwa — grupa nadal ma miasta na mapie, więc
  // PROMUJEMY pierwszy przetrwały slot tego klastra na substytut stolicy w
  // `clusterCapitalOwnerIds` (ekspansyjna AI/portret/priorytet ataku w main.ts
  // wymagają jakiejś zarejestrowanej stolicy klastra dla każdego obcego typu
  // obecnego na mapie). Decyzja orkiestratora (runda 3, na BLOKADĘ 1 rundy 2):
  // opcja (a) — allowlista tej rundy rozszerzona o `typCityCopyOwners`
  // WYŁĄCZNIE po to, żeby usunąć z niej promowany substytut — bo formalnie
  // staje się "stolicą" klastra, więc NIE MOŻE równocześnie zostać w zbiorze
  // "państwa bez stolic klastrów" (asercja `typCityCopyOwners = państwa bez
  // stolic klastrów` w cluster-start-test.cjs wymaga rozłączności obu
  // zbiorów). Slot ten był dodany do `typCityCopyOwners` wcześniej w pętli
  // powyżej (linia z `if (!slot.isClusterCapital) typCityCopyOwners.add(...)`,
  // na podstawie ORYGINALNEJ flagi `isClusterCapital=false`) — tu wyłącznie
  // korygujemy to jednym `.delete()`, nic więcej w `typCityCopyOwners` się nie
  // zmienia. Klaster BEZ żadnego przetrwałego slotu (wszystkie odrzucone) jest
  // usuwany w całości pętlą niżej (ownerIds.length === 0 → continue) — nie ma
  // wtedy nic do promocji, przypadek nieistotny dla tej naprawy.
  const promotedCapitalOwnerIds: number[] = [];
  const foreignTypeClusters: ClusterStartPlan['foreignTypeClusters'] = [];
  for (const group of spawnPlan.foreignTypeClusters) {
    const ownerIds: number[] = [];
    const positions: Array<{ q: number; r: number }> = [];
    group.ownerIds.forEach((oid, i) => {
      if (!acceptedOwnerIds.has(oid)) return;
      const pos = group.positions[i];
      if (!pos) return;
      ownerIds.push(oid);
      positions.push(pos);
    });
    if (ownerIds.length === 0) continue;
    foreignTypeClusters.push({ typ: group.typ, ownerIds, positions });

    const originalCapitalOwnerId = group.ownerIds[0];
    const substituteCapitalOwnerId = ownerIds[0];
    if (
      originalCapitalOwnerId !== undefined &&
      substituteCapitalOwnerId !== undefined &&
      !acceptedOwnerIds.has(originalCapitalOwnerId)
    ) {
      promotedCapitalOwnerIds.push(substituteCapitalOwnerId);
      typCityCopyOwners.delete(substituteCapitalOwnerId);
    }
  }
  const clusterCapitalOwnerIds = [
    ...spawnPlan.clusterCapitalOwnerIds.filter(oid => acceptedOwnerIds.has(oid)),
    ...promotedCapitalOwnerIds,
  ];

  // R-HOTSEAT-ETAP6F-PART2-DATA-Q1: rezerwacja algorytmiczna drugiego heksu
  // startowego (ABC-Q1) — WYŁĄCZNIE gdy wołający jawnie poprosił o drugą
  // cywilizację człowieka. Bez `input.secondHumanCivId` te dwa pola zostają
  // `null` i reszta funkcji jest nietknięta — dowód no-op dla single-player.
  let secondPlayerStartHex: { q: number; r: number } | null = null;
  let secondPlayerOwnerId: number | null = null;
  if (input.secondHumanCivId !== undefined) {
    const mode: HumanDistanceMode = input.humanDistanceMode ?? 'losowo';
    // Zarzut 1 Evaluatora (runda 2): wyklucz kolizję drugiego heksu z
    // WSZYSTKIMI już umiejscowionymi/zarezerwowanymi miastami tego planu —
    // zaakceptowane miasta AI (`aiStartHexes`/`spawnCities`, PO filtrze
    // kolizji z pętli wyżej, więc bez "widmowych" odrzuconych slotów) oraz
    // zarezerwowane-ale-jeszcze-niespawnione miasta-państwa
    // (`spawnPlan.pendingSameTypeRivalHexes`) — dokładnie ten sam zestaw
    // pozycji, którego dystans do siebie nawzajem generator już pilnuje
    // (`acceptedForDistance` wyżej), rozszerzony o drugiego człowieka.
    const occupiedHexes: Array<{ q: number; r: number }> = [
      ...aiStartHexes.map(a => ({ q: a.q, r: a.r })),
      ...spawnPlan.pendingSameTypeRivalHexes,
    ];
    secondPlayerStartHex = pickSecondHumanStartHex(
      input.map,
      spawnPlan.playerStartHex,
      mode,
      input.seed,
      MIN_CITY_DISTANCE_START_CITY_STATE,
      occupiedHexes,
    );
    if (secondPlayerStartHex) {
      // Zero kolizji z rosterem AI tego planu: pierwszy wolny numer PO
      // wszystkich ownerId już zajętych (sloty zaakceptowane + deferred
      // same-type rivals), chyba że wołający jawnie podał własny.
      const reservedOwnerIds = [
        ...aiStartHexes.map(a => a.ownerId),
        ...spawnPlan.pendingSameTypeRivalOwnerIds,
      ];
      secondPlayerOwnerId = input.secondHumanOwnerId
        ?? Math.max(0, ...reservedOwnerIds) + 1;
    }
  }

  // R-HOTSEAT-FOTEL2-CYWILIZACJA-BLEDNA-Q1 (defekt C): rezerwa ownerId DLA WŁASNEGO
  // klastra miast-państw drugiego fotela — WYŁĄCZNIE gdy drugi heks faktycznie
  // zarezerwowany. Rozmiar = `spawnPlan.pendingSameTypeRivals` (ten sam licznik co
  // dla fotela 1, ten sam `rywaleNaKlaster`/mapa/epoka — symetryczny klaster).
  // Numeracja PO wszystkich ownerId już zajętych w tym planie (AI + rywale fotela 1
  // + `secondPlayerOwnerId` sam) — kolizje resztkowe (np. z `pendingForeignSpawnCities`
  // dodanym poza tym planem) łapie i realokuje runtime fallback
  // `allocFreeRivalOwnerId()` w `spawnPendingSameTypeRivals` (main.ts), dokładnie jak
  // dziś dla fotela 1.
  let pendingSameTypeRivalOwnerIdsSecond: number[] = [];
  if (secondPlayerStartHex !== null && secondPlayerOwnerId !== null) {
    const targetCountSecond = spawnPlan.pendingSameTypeRivals;
    const reservedOwnerIdsSecond = [
      ...aiStartHexes.map(a => a.ownerId),
      ...spawnPlan.pendingSameTypeRivalOwnerIds,
      secondPlayerOwnerId,
    ];
    let nextRivalOwnerId = Math.max(0, ...reservedOwnerIdsSecond) + 1;
    for (let i = 0; i < targetCountSecond; i++) {
      pendingSameTypeRivalOwnerIdsSecond.push(nextRivalOwnerId);
      nextRivalOwnerId += 1;
    }
  }
  const pendingSameTypeRivalsSecond = pendingSameTypeRivalOwnerIdsSecond.length;

  return {
    playerStartHex: spawnPlan.playerStartHex,
    playerStartCityName: spawnPlan.playerStartCityName,
    secondPlayerStartHex,
    secondPlayerOwnerId,
    aiStartHexes,
    spawnCities,
    foreignTypeClusters,
    aiOwnerCivMap,
    ownerDisplayName,
    simplifiedDiplomacyOwners,
    foreignTypeOwners,
    typCityCopyOwners,
    startRelations,
    placement: spawnPlan.placement,
    pendingSameTypeRivals: spawnPlan.pendingSameTypeRivals,
    pendingSameTypeRivalHexes: spawnPlan.pendingSameTypeRivalHexes,
    clusterCapitalOwnerIds,
    pendingSameTypeRivalOwnerIds: spawnPlan.pendingSameTypeRivalOwnerIds,
    pendingSameTypeRivalsSecond,
    pendingSameTypeRivalOwnerIdsSecond,
  };
}
