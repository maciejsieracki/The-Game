/**
 * ai-march-guard.ts -- R-WEB-AI-MARCH-AVOID-FOREIGN-TERRITORY-Q1.
 *
 * Regula wlasciciela (2026-11-03): cywilizacja AI w wojnie NIE prowadzi jednostek wojennych przez
 * teren TRZECIEJ cywilizacji bez umowy przemarszu. Teren cudzy bez zgody = TWARDA PRZESZKODA w
 * planowaniu trasy (koszt Infinity w costFn computePath); brak trasy okreznej = marsz odroczony;
 * w obu przypadkach AI PROSI o umowe przemarszu (istniejacy mechanizm 'granice' + borderMilitary,
 * wywolanie przez `requestPassage`, cooldown po stronie silnika).
 *
 * Modul czysty (bez DOM/THREE). Autoryzacja (`isPassageAllowed`) i prosba (`requestPassage`)
 * wstrzykiwane przez silnik (main.ts: hasAuthorizedBorderCrossing + diplomacy-proposals).
 */
import type { Hex } from '../types/hex';
import type { RuntimeUnit } from '../units/setup';
import type { TerritoryNode } from '../map/territory';
import { territoryOwnerAt, cityTerritoryRadius, axialDistance } from '../map/territory';

export type MarchGuardRequestReason = 'no-route' | 'detour';

export interface AiMarchGuardStats {
  /** Trasa wprost przecinala zakazany teren i zostala zastapiona okrezna (liczone tam, gdzie trasa wprost jest znana). */
  detours: number;
  /** Trasy policzone przez straz (Dijkstra z zakazanym terenem jako przeszkoda) i znalezione. */
  routed: number;
  /** Brak trasy okreznej -- marsz odroczony (brak kroku). */
  deferred: number;
  /** Cel marszu lezy na zakazanym terenie -- brak kroku. */
  destinationBlocked: number;
  /** Jednostka stoi na zakazanym terenie, brak wyjscia bez przecinania -- wyjatek (wyjscie). */
  exitExceptions: number;
  /** Wywolania requestPassage (przed cooldownem silnika). */
  requests: number;
  /** Brak trasy ladowej -- wybrana trasa morska (zaokretowanie) omijajaca zakazany teren. */
  seaRoutes: number;
}

export interface AiMarchGuard {
  readonly ownerId: number;
  readonly stats: AiMarchGuardStats;
  /** Wlasciciel terenu na heksie albo -1 (wolny teren). Memoizowane na czas zycia strazy. */
  territoryOwnerAtHex(q: number, r: number): number;
  /** Czy marsz wojsk wlasciciela przez teren `territoryOwnerId` jest dozwolony (wlasny/wojna/umowa). */
  isPassageAllowed(territoryOwnerId: number): boolean;
  /** Czy heks jest dla tej cywilizacji zakazany (cudzy teren bez zgody). */
  isBlockedHex(q: number, r: number, extraAllowedOwner?: number): boolean;
  /** Opakowuje koszt wejscia: zakazany heks => Infinity. */
  wrapCost(base: (hex: Hex) => number, extraAllowedOwner?: number): (hex: Hex) => number;
  requestPassage(territoryOwnerId: number, reason: MarchGuardRequestReason): void;
  /** Koszt ruchu z woda przejezdna dla jednostki (Zegluga) albo undefined (jednostka nie moze plynac). */
  seaCostFor(unit: RuntimeUnit): ((hex: Hex) => number) | undefined;
  /**
   * Klucze "q,r" WSZYSTKICH zakazanych heksow (teren cudzych cywilizacji bez zgody) -- dla
   * planerow z gotowym zbiorem `blocked` (warAllInCapital). `exceptOwners` = wlasciciele terenu,
   * na ktorym jednostki juz stoja (wyjatek wyjscia).
   */
  blockedHexKeys(exceptOwners?: ReadonlySet<number>): Set<string>;
  /**
   * Pamiec tras na czas jednego decideAITurn: jednostki ze stosu (ten sam start i cel) dostaja
   * te sama trase bez ponownego Dijkstry (cel jest zawsze wchodzalny, wiec zajetosc celu nie ma
   * znaczenia). Mapa/pozycje sa niezmienne w obrebie planowania jednej tury.
   */
  /**
   * Tani test geometryczny: czy jakikolwiek zakazany teren lezy w odleglosci <= promien + margines od
   * linii prostej (q1,r1)-(q2,r2). Brak => trasa wprost nie moze go przecinac (pomijamy droga analize).
   */
  nearBlockedTerritory(q1: number, r1: number, q2: number, r2: number, margin: number): boolean;
  readonly pathCache: Map<string, ReadonlyArray<{ q: number; r: number }>>;
}

export interface CreateAiMarchGuardOpts {
  ownerId: number;
  /** Wezly terytorium WSZYSTKICH wlascicieli (AITurnOpts.territoryNodes). */
  nodes: readonly TerritoryNode[];
  /** Silnik: wlasny teren / wojna / sojusz / wasal / umowa przemarszu => true. */
  isPassageAllowed: (territoryOwnerId: number) => boolean;
  /** Silnik: zloz prosbe o przemarsz (cooldown i wiarygodnosc po stronie silnika). */
  onRequestPassage?: (territoryOwnerId: number, reason: MarchGuardRequestReason) => void;
  /** Silnik: moveCostFnForUnit (woda przejezdna przy Zegludze) -- trasa morska gdy brak ladowej. */
  seaCostFn?: (unit: RuntimeUnit) => ((hex: Hex) => number) | undefined;
}

export function createAiMarchGuard(o: CreateAiMarchGuardOpts): AiMarchGuard {
  const ownerCache = new Map<number, number>();
  const allowedCache = new Map<number, boolean>();
  const stats: AiMarchGuardStats = { detours: 0, routed: 0, deferred: 0, destinationBlocked: 0, exitExceptions: 0, requests: 0, seaRoutes: 0 };

  const keyNum = (q: number, r: number): number => (q + 4096) * 8192 + (r + 4096);

  const guard: AiMarchGuard = {
    ownerId: o.ownerId,
    stats,
    pathCache: new Map(),
    territoryOwnerAtHex(q, r) {
      const k = keyNum(q, r);
      let v = ownerCache.get(k);
      if (v === undefined) {
        v = territoryOwnerAt(q, r, o.nodes) ?? -1;
        ownerCache.set(k, v);
      }
      return v;
    },
    isPassageAllowed(territoryOwnerId) {
      if (territoryOwnerId === o.ownerId) return true;
      let v = allowedCache.get(territoryOwnerId);
      if (v === undefined) {
        v = o.isPassageAllowed(territoryOwnerId);
        allowedCache.set(territoryOwnerId, v);
      }
      return v;
    },
    isBlockedHex(q, r, extraAllowedOwner) {
      const t = guard.territoryOwnerAtHex(q, r);
      if (t < 0 || t === o.ownerId || t === extraAllowedOwner) return false;
      return !guard.isPassageAllowed(t);
    },
    wrapCost(base, extraAllowedOwner) {
      return (hex: Hex): number => {
        const c = base(hex);
        if (c === Infinity) return c;
        return guard.isBlockedHex(hex.coords.q, hex.coords.r, extraAllowedOwner) ? Infinity : c;
      };
    },
    requestPassage(territoryOwnerId, reason) {
      stats.requests++;
      o.onRequestPassage?.(territoryOwnerId, reason);
    },
    seaCostFor(unit) {
      return o.seaCostFn?.(unit);
    },
    nearBlockedTerritory(q1, r1, q2, r2, margin) {
      const n = Math.max(1, axialDistance(q1, r1, q2, r2));
      for (const node of o.nodes) {
        if (node.ownerId === o.ownerId || guard.isPassageAllowed(node.ownerId)) continue;
        const reach = cityTerritoryRadius(node) + margin;
        for (let i = 0; i <= n; i++) {
          const t = i / n;
          // interpolacja w osiach kostkowych (x=q, z=r, y=-x-z) i zaokraglenie do heksu
          const fx = q1 + (q2 - q1) * t;
          const fz = r1 + (r2 - r1) * t;
          const fy = -fx - fz;
          let rx = Math.round(fx);
          let ry = Math.round(fy);
          let rz = Math.round(fz);
          const dx = Math.abs(rx - fx);
          const dy = Math.abs(ry - fy);
          const dz = Math.abs(rz - fz);
          if (dx > dy && dx > dz) rx = -ry - rz;
          else if (dy > dz) ry = -rx - rz;
          else rz = -rx - ry;
          if (axialDistance(rx, rz, node.q, node.r) <= reach) return true;
        }
      }
      return false;
    },
    blockedHexKeys(exceptOwners) {
      const keys = new Set<string>();
      for (const n of o.nodes) {
        if (n.ownerId === o.ownerId || exceptOwners?.has(n.ownerId)) continue;
        if (guard.isPassageAllowed(n.ownerId)) continue;
        const R = cityTerritoryRadius(n);
        for (let dq = -R; dq <= R; dq++) {
          for (let dr = Math.max(-R, -dq - R); dr <= Math.min(R, -dq + R); dr++) {
            const q = n.q + dq;
            const r = n.r + dr;
            if (guard.territoryOwnerAtHex(q, r) === n.ownerId) keys.add(`${q},${r}`);
          }
        }
      }
      return keys;
    },
  };
  return guard;
}

/**
 * Cooldown prosby o przemarsz: true = prosba wyciszona. Wpis z PRZYSZLOSCI (`last > turn`: nowa gra /
 * wczytany wczesniejszy zapis ze stara mapa) NIE wycisza -- inaczej AI milczalaby do `last + cooldown`.
 */
export function isMarchPassageCooldownActive(last: number | undefined, turn: number, cooldownTurns: number): boolean {
  return last !== undefined && last <= turn && turn - last < cooldownTurns;
}

/** Pierwszy zakazany heks na trasie -> wlasciciel terenu (do prosby o przemarsz) albo null. */
export function firstBlockedOwnerOnPath(
  guard: AiMarchGuard,
  path: ReadonlyArray<{ q: number; r: number }>,
  extraAllowedOwner?: number,
): number | null {
  for (const h of path) {
    if (guard.isBlockedHex(h.q, h.r, extraAllowedOwner)) return guard.territoryOwnerAtHex(h.q, h.r);
  }
  return null;
}

/** Trasa jest "znacznie gorsza" gdy okrezna kosztuje > 1,5x + 3 kosztu trasy wprost (ZALOZENIE). */
export function isDetourSignificant(directCost: number, detourCost: number): boolean {
  return detourCost > directCost * 1.5 + 3;
}
