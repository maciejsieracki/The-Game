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
  type ClusterSpawnPlan,
  type ClusterSpawnSlot,
  type ForeignTypeClusterGroup,
} from '../map/cluster-spawn';
import { startRelationForPair } from './diplomacy-layers';
import type { Relation } from './diplomacy';
import { hexDistance } from '../units/setup';
import { MIN_CITY_DISTANCE, MIN_CITY_DISTANCE_START_CITY_STATE } from './cities';

export type { ClusterSpawnSlot, ClusterSpawnPlan, ForeignTypeClusterGroup };
export { buildSameTypeRivalSlots, buildSameTypeRivalCandidateHexes } from '../map/cluster-spawn';

export interface ClusterStartPlan {
  playerStartHex: { q: number; r: number };
  playerStartCityName: string;
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
}

/** Pełny plan startu — konsumuje SILNIK w doStartGame(). */
export function buildClusterStartPlan(input: BuildClusterStartInput): ClusterStartPlan {
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

  return {
    playerStartHex: spawnPlan.playerStartHex,
    playerStartCityName: spawnPlan.playerStartCityName,
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
  };
}
