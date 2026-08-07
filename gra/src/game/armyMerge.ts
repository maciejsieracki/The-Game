/**
 * armyMerge.ts — stosy armii na mapie: widoczność, merge, split (v1.0).
 */

import type { RuntimeUnit } from '../units/setup';
import { keyOf } from '../units/setup';
import type { UnitPowerInput } from './unit-power';
import { sumRosterFieldM } from './auto-battle-power';
import {
  armorPathBadgeLevel,
  softPathBadgeLevel,
  type UnitPathBadgeLevel,
} from './unit-building-bonuses';
import { veteranLevel, veteranStarCount, type VeteranLevel } from './veteran';

const NEIGH: ReadonlyArray<readonly [number, number]> = [
  [1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1],
];

export interface StackDisplayInfo {
  /** Jednostki widoczne na mapie (1 reprezentant na stos). */
  visibleIds: Set<string>;
  /** rep unit id → liczba jednostek na heksie (gdy > 1). */
  badgeByRepId: Map<string, number>;
  /** MAP-Q1: rep token ids z ikoną GŁODU WOJSKA (isArmyHungry — zapasy Żywności państwa < 0). */
  starvingRepIds?: Set<string>;
  /**
   * R-STATUS-PRZYCZYNA-CIERPIENIA-Q1=C: rep token ids z ikoną DEFICYTU ZŁOTA
   * (isGoldDeficit — Skarbiec właściciela < 0 po zbankowaniu tury). Zbiór
   * NIEZALEŻNY od `starvingRepIds` — ta sama jednostka może być w obu naraz
   * (renderer rysuje wtedy dwie ikony obok siebie, żadna nie znika).
   */
  goldDeficitRepIds?: Set<string>;
  /**
   * R-ZETON-PASKI (Maciej 2026-07-29): rep unit id → wartości CAŁEGO stosu
   * pokazywane na tabliczce nad żetonem (Ruch / pula HP / Moc pola M).
   * Wypełniane tylko wtedy, gdy `computeStackDisplay` dostanie `vitalsDeps`
   * (silnik gry je ma; podglądy i galeria wołają sync() bez StackDisplayInfo
   * i tabliczka spada wtedy na wartości pojedynczej jednostki).
   */
  vitalsByRepId?: Map<string, StackVitals>;
}

export function visibleStackOnHex(
  units: RuntimeUnit[],
  q: number,
  r: number,
  ownerId: number,
): RuntimeUnit[] {
  return units.filter(
    u => u.ownerId === ownerId && u.q === q && u.r === r && u.inGarnizon !== true,
  );
}

/**
 * Jednostki właściciela na heksie kwalifikujące się do promptu / logiki merge
 * (widoczne + ukryte w garnizonie; bez oblegających).
 */
export function coLocatedForMergePrompt(
  units: ReadonlyArray<RuntimeUnit>,
  q: number,
  r: number,
  ownerId: number,
): RuntimeUnit[] {
  return units.filter(
    u => u.ownerId === ownerId
      && u.q === q
      && u.r === r
      && !u.oblegaCityId,
  );
}

/** Sąsiednie heksy z widocznym stosem armii właściciela. */
export function adjacentVisibleArmyHexes(
  units: ReadonlyArray<RuntimeUnit>,
  q: number,
  r: number,
  ownerId: number,
): Array<{ q: number; r: number; stack: RuntimeUnit[] }> {
  const out: Array<{ q: number; r: number; stack: RuntimeUnit[] }> = [];
  for (const [dq, dr] of NEIGH) {
    const nq = q + dq;
    const nr = r + dr;
    const stack = visibleStackOnHex(units as RuntimeUnit[], nq, nr, ownerId);
    if (stack.length > 0) out.push({ q: nq, r: nr, stack });
  }
  return out;
}

/**
 * C-GARN-Q1 rozszerzenie (Maciej 2026-07-26): "Ufortyfikuj" chowa jednostkę
 * (RuntimeUnit.inGarnizon=true) do garnizonu miasta — na mapie gracza widać
 * reprezentanta stosu w koszarach (computeStackDisplay); merge/ruch na heksie
 * nadal ignoruje garnizon (visibleStackOnHex).
 *
 * `activeUnitStack` daje "stos do działania" dla JUŻ ZAZNACZONEJ jednostki:
 * ukryta w garnizonie -> cały garnizon na heksie (garrisonUnitsOnHex);
 * w przeciwnym razie zwykły, widoczny stos na jej heksie (bez zmian).
 */
export function activeUnitStack(
  units: RuntimeUnit[],
  active: RuntimeUnit,
): RuntimeUnit[] {
  if (active.inGarnizon === true) {
    return garrisonUnitsOnHex(units, active.q, active.r, active.ownerId);
  }
  return visibleStackOnHex(units, active.q, active.r, active.ownerId);
}

/**
 * Wchodzi do ukrytego garnizonu miasta — zapisuje snapshot ruchLeft (ODFORT-Q2),
 * zeruje ruch na resztę tury (FORTIFY-MP0-Q1: wejście dozwolone także przy MP=0).
 */
export function enterGarnizon(u: RuntimeUnit): void {
  if (u.inGarnizon === true) return;
  u.fortifyRuchSnapshot = u.ruchLeft;
  u.inGarnizon = true;
  u.ruchLeft = 0;
}

/**
 * Wyprowadza jednostkę z ukrytego garnizonu: odfortyfikowanie + budzenie
 * (sentry) w jednym kroku — dokładnie to, czego oczekuje właściciel przy
 * rozkazie ruchu wydanym jednostce z listy armii ("wtedy automatycznie
 * następuje odfortyfikowanie albo odśpienie"), a także przycisk „Opuść
 * garnizon" w panelu miasta i w panelu akcji jednostki.
 * Mutuje `u` w miejscu; zwraca `true`, jeśli coś się rzeczywiście zmieniło
 * (żeby wołający zsynchronizował licznik garnizonu miasta — `city.garnizon`).
 * ODFORT-Q2: przywraca `ruchLeft` ze snapshota z momentu fortyfikacji.
 */
export function exitGarnizon(u: RuntimeUnit): boolean {
  if (u.inGarnizon !== true) return false;
  u.inGarnizon = false;
  u.sentry = false;
  if (u.fortifyRuchSnapshot !== undefined) {
    u.ruchLeft = u.fortifyRuchSnapshot;
    delete u.fortifyRuchSnapshot;
  }
  return true;
}

/**
 * Fortyfikacja W POLU (Maciej 2026-07-26, dyspozycja "oblężenie + fortyfikacja") --
 * OSOBNA od garnizonu miasta (inGarnizon powyżej): nie ukrywa jednostkę, działa
 * poza hexem własnego miasta (w tym KAŻDA jednostka oblegająca -- oblegający stoją
 * przy murze, hexDistance===1, nigdy na samym hexie miasta, patrz main.ts
 * commitBesiege). Mutuje `u` w miejscu.
 *
 * enterFieldFortify: zapisuje snapshot ruchLeft (ODFORT-Q2), zeruje ruchLeft
 * (koszt = CAŁY pozostały ruch tury, zgodnie
 * ze słowami właściciela -- nie tylko część) i ustawia flagę. NIE dotyka
 * oblegaCityId -- jednostka oblegająca zostaje w oblężeniu (main.ts turn-loop
 * i tak zeruje jej ruchLeft co turę, patrz `if (u.oblegaCityId) u.ruchLeft = 0`,
 * więc to nie jest dodatkowa kara dla oblegających, tylko formalność zgodna z
 * jednostką NIE oblegającą, która wchodzi w ten stan z realnym ruchem do stracenia).
 */
export function enterFieldFortify(u: RuntimeUnit): void {
  u.fortifyRuchSnapshot = u.ruchLeft;
  u.ufortyfikowanyWPolu = true;
  u.ruchLeft = 0;
}

/**
 * Zdejmuje fortyfikację w polu -- BEZ kosztu ruchu (parytet z "Czuwaj"/"Obudź" i
 * exitGarnizon powyżej: wyjście z trybu nigdy nie kosztuje, tylko wejście).
 * ODFORT-Q2: przywraca `ruchLeft` ze snapshota z momentu fortyfikacji.
 * Zwraca `true`, jeśli coś się rzeczywiście zmieniło (jak exitGarnizon).
 */
export function exitFieldFortify(u: RuntimeUnit): boolean {
  if (u.ufortyfikowanyWPolu !== true) return false;
  u.ufortyfikowanyWPolu = false;
  if (u.fortifyRuchSnapshot !== undefined) {
    u.ruchLeft = u.fortifyRuchSnapshot;
    delete u.fortifyRuchSnapshot;
  }
  return true;
}

/** Najmocniejsza jednostka stosu (Atak → id). */
export function pickStackRepresentative(
  stack: RuntimeUnit[],
  attackOf: (u: RuntimeUnit) => number,
): RuntimeUnit {
  return stack.reduce((best, u) => {
    const a = attackOf(u);
    const b = attackOf(best);
    if (a !== b) return a > b ? u : best;
    return u.id < best.id ? u : best;
  });
}

/** Jednostki ufortyfikowane w garnizonie miasta na danym heksie. */
export function garrisonUnitsOnHex(
  units: ReadonlyArray<RuntimeUnit>,
  q: number,
  r: number,
  ownerId: number,
): RuntimeUnit[] {
  return units.filter(
    u => u.ownerId === ownerId
      && u.q === q
      && u.r === r
      && u.inGarnizon === true,
  );
}

/** 1 token na heks — reprezentant najmocniejszy + badge ×N. */
export function computeStackDisplay(
  units: RuntimeUnit[],
  attackOf: (u: RuntimeUnit) => number,
  /**
   * R-ZETON-PASKI: gdy podane, do wyniku dochodzi `vitalsByRepId` — wartości
   * CAŁEGO stosu (min ruchu / pula HP / Moc pola M) pod id reprezentanta,
   * czyli pod jedynym żetonem, który na tym heksie jest widoczny. Grupowanie
   * jest już policzone tutaj, więc rachunek nie dubluje się w warstwie renderu.
   */
  vitalsDeps?: StackVitalsDeps,
): StackDisplayInfo {
  const byStack = new Map<string, RuntimeUnit[]>();
  for (const u of units) {
    const k = u.inGarnizon === true
      ? u.ownerId + '|' + u.q + ',' + u.r + '|g'
      : u.ownerId + '|' + u.q + ',' + u.r;
    const arr = byStack.get(k);
    if (arr) arr.push(u);
    else byStack.set(k, [u]);
  }

  const visibleIds = new Set<string>();
  const badgeByRepId = new Map<string, number>();
  const vitalsByRepId = vitalsDeps ? new Map<string, StackVitals>() : undefined;

  for (const stack of byStack.values()) {
    const rep = pickStackRepresentative(stack, attackOf);
    visibleIds.add(rep.id);
    if (stack.length > 1) badgeByRepId.set(rep.id, stack.length);
    if (vitalsByRepId && vitalsDeps) vitalsByRepId.set(rep.id, stackVitals(stack, vitalsDeps));
  }

  return vitalsByRepId
    ? { visibleIds, badgeByRepId, vitalsByRepId }
    : { visibleIds, badgeByRepId };
}

/** Klik na heks — reprezentant stosu (nie losowa jednostka z kupy). */
export function unitAtRepresentative(
  q: number,
  r: number,
  units: RuntimeUnit[],
  attackOf: (u: RuntimeUnit) => number,
): RuntimeUnit | null {
  const stack = units.filter(
    u => u.q === q && u.r === r && u.inGarnizon !== true,
  );
  if (stack.length === 0) return null;
  if (stack.length === 1) return stack[0]!;
  return pickStackRepresentative(stack, attackOf);
}

/** Sąsiednie puste heksy (split cel). */
export function findAdjacentEmptyHexes(
  units: RuntimeUnit[],
  q: number,
  r: number,
  isPassable: (q: number, r: number) => boolean,
): Array<{ q: number; r: number }> {
  const out: Array<{ q: number; r: number }> = [];
  for (const [dq, dr] of NEIGH) {
    const nq = q + dq;
    const nr = r + dr;
    if (!isPassable(nq, nr)) continue;
    const occupied = units.some(
      u => u.q === nq && u.r === nr && u.inGarnizon !== true,
    );
    if (!occupied) out.push({ q: nq, r: nr });
  }
  return out;
}

/** Cel rozdzielenia armii — opcjonalnie ten sam heks (własne miasto). */
export interface SplitDestHex {
  q: number;
  r: number;
  /** Etykieta UI; brak → „(q,r)”. */
  label?: string;
}

/**
 * Split: sąsiednie wolne heksy + (gdy allowSameHex) „zostaje w mieście”.
 * Na heksie miasta dwa widoczne stosy mogą współistnieć (garnizon vs pole).
 */
export function findSplitDestHexes(
  units: RuntimeUnit[],
  q: number,
  r: number,
  isPassable: (q: number, r: number) => boolean,
  allowSameHex = false,
): SplitDestHex[] {
  const out: SplitDestHex[] = [];
  if (allowSameHex) {
    out.push({ q, r, label: 'W mieście (ten heks)' });
  }
  for (const d of findAdjacentEmptyHexes(units, q, r, isPassable)) {
    out.push(d);
  }
  return out;
}

/** Cofnięcie wielu jednostek (np. cały przybywający stos) — po jednym heksie każda. */
export function assignBounceHexesForUnits(
  units: RuntimeUnit[],
  preferQ: number,
  preferR: number,
  unitIds: readonly string[],
  isPassable?: (q: number, r: number) => boolean,
): Map<string, { q: number; r: number }> {
  const passable = (q: number, r: number): boolean =>
    isPassable ? isPassable(q, r) : true;
  const out = new Map<string, { q: number; r: number }>();
  const virtualOcc = new Set<string>();

  const isOccupied = (q: number, r: number, exceptId: string): boolean => {
    const k = keyOf(q, r);
    if (virtualOcc.has(k)) return true;
    return units.some(
      u => u.id !== exceptId
        && !unitIds.includes(u.id)
        && u.q === q
        && u.r === r
        && u.inGarnizon !== true,
    );
  };

  const trySpot = (exceptId: string): { q: number; r: number } | null => {
    if (!isOccupied(preferQ, preferR, exceptId) && passable(preferQ, preferR)) {
      return { q: preferQ, r: preferR };
    }
    for (const [dq, dr] of NEIGH) {
      const q = preferQ + dq;
      const r = preferR + dr;
      if (!passable(q, r)) continue;
      if (!isOccupied(q, r, exceptId)) return { q, r };
    }
    return null;
  };

  for (const uid of unitIds) {
    const spot = trySpot(uid);
    if (!spot) continue;
    out.set(uid, spot);
    virtualOcc.add(keyOf(spot.q, spot.r));
  }
  return out;
}

/** Heks startowy ruchu (skąd przyszła) lub wolny sąsiad lądu — bez zwrotu punktów ruchu. */
export function findBounceHexFromOrigin(
  units: RuntimeUnit[],
  fromQ: number,
  fromR: number,
  exceptUnitId: string,
  isPassable?: (q: number, r: number) => boolean,
): { q: number; r: number } | null {
  return findRejectHex(units, fromQ, fromR, exceptUnitId, isPassable);
}

function findRejectHex(
  units: RuntimeUnit[],
  fromQ: number,
  fromR: number,
  exceptUnitId: string,
  isPassable?: (q: number, r: number) => boolean,
): { q: number; r: number } | null {
  const passable = (q: number, r: number): boolean =>
    isPassable ? isPassable(q, r) : true;

  const occupied = (q: number, r: number): boolean =>
    units.some(u => u.id !== exceptUnitId && u.q === q && u.r === r && u.inGarnizon !== true);

  if (!occupied(fromQ, fromR) && passable(fromQ, fromR)) return { q: fromQ, r: fromR };

  for (const [dq, dr] of NEIGH) {
    const q = fromQ + dq;
    const r = fromR + dr;
    if (!passable(q, r)) continue;
    if (!occupied(q, r)) return { q, r };
  }
  return null;
}

export function stackKey(q: number, r: number): string {
  return keyOf(q, r);
}

/** Split/merge przyciski paska akcji jednostki (testowalne, main.ts). */
export function stackHudMergeSplitActions(
  stackLength: number,
  canMerge: boolean,
  splitDestinationCount: number,
): Array<{ id: 'split' | 'merge'; label: string; disabled: boolean }> {
  const actions: Array<{ id: 'split' | 'merge'; label: string; disabled: boolean }> = [];
  if (stackLength >= 2) {
    actions.push({
      id: 'split',
      label: 'Rozdziel',
      disabled: splitDestinationCount === 0,
    });
    actions.push({
      id: 'merge',
      label: 'Po\u0142\u0105cz',
      disabled: !canMerge,
    });
  } else if (canMerge) {
    actions.push({ id: 'merge', label: 'Po\u0142\u0105cz', disabled: false });
  }
  return actions;
}

/** Wspólny pul ruchu stosu — minimum z członków (par. 6b: armia rusza łącznie). */
export function stackRuchLeft(stack: ReadonlyArray<RuntimeUnit>): number {
  if (stack.length === 0) return 0;
  return Math.min(...stack.map(u => u.ruchLeft));
}

/**
 * Pul ruchu do planowania rozkazu (reachable, marsz) ZANIM jednostka opuści
 * garnizon / fortyfikację w polu. Symuluje stan po exitGarnizon/exitFieldFortify
 * (fortifyRuchSnapshot), bez mutacji — widoczność na liście armii + klik na mapę.
 */
export function planningStackRuchLeft(stack: ReadonlyArray<RuntimeUnit>): number {
  if (stack.length === 0) return 0;
  return Math.min(...stack.map(planningUnitRuchLeft));
}

export function planningUnitRuchLeft(u: RuntimeUnit): number {
  if ((u.inGarnizon === true || u.ufortyfikowanyWPolu === true)
    && u.fortifyRuchSnapshot !== undefined) {
    return u.fortifyRuchSnapshot;
  }
  return u.ruchLeft;
}

/**
 * Wyjście z trybów ufortyfikowania/uśpienia przy wykonaniu rozkazu ruchu
 * (C-GARN-Q1=A + R-GARN-AKCJE-A). Mutuje członków stosu; zwraca true, gdy
 * którykolwiek opuścił garnizon (do sync city.garnizon).
 */
export function wakeStackForMoveOrder(stack: ReadonlyArray<RuntimeUnit>): boolean {
  let leftGarnizon = false;
  for (const su of stack) {
    if (exitGarnizon(su)) leftGarnizon = true;
    exitFieldFortify(su);
    if (su.sentry === true) su.sentry = false;
  }
  return leftGarnizon;
}

/**
 * Maksimum wspólnego pulu ruchu stosu — MINIMUM z `ruch` członków.
 *
 * Symetryczne do `stackRuchLeft()` powyżej i z tego samego powodu (par. 6b:
 * armia rusza łącznie, więc pul jest ograniczony najwolniejszym). Dzięki temu
 * ułamek `stackRuchLeft / stackRuchMax` jest spójny: świeża armia z pełnym
 * pulem daje dokładnie 1,0, a nie „2 z 4", gdyby maksimum wzięło szybszego
 * członka. Jednostka: punkty ruchu (pkt ruchu / turę).
 */
export function stackRuchMax(stack: ReadonlyArray<RuntimeUnit>): number {
  if (stack.length === 0) return 0;
  return Math.min(...stack.map(u => u.ruch));
}

/**
 * PULA ŻYCIA stosu: Σ punktów życia członków / Σ ich maksimów.
 *
 * ŚWIADOMIE NIE JEST TO ŚREDNIA Z PROCENTÓW (decyzja przekazana przez
 * właściciela, 2026-07-29, przy R-ZETON-PASKI). Dwa powody:
 *   1. średnia z procentów UKRYWA rannego — 3 jednostki po 100% + 1 na 8%
 *      dają 77%, choć armia jest już o jedną jednostkę słabsza niż wygląda;
 *   2. średnia z procentów traktuje Zwiadowcę i Włócznika jako równych, mimo
 *      że wnoszą do walki inną masę punktów życia.
 * Pula odpowiada na pytanie, które gracz faktycznie zadaje: ILE TA ARMIA
 * JESZCZE WYTRZYMA.
 *
 * Jednostka OBU zwracanych liczb: punkty życia (HP).
 * `RuntimeUnit.hp === undefined` znaczy „pełne z definicji jednostki”
 * (kontrakt z units/setup.ts), więc taki członek wnosi maxHpOf(u) do obu sum.
 */
export function stackHpPool(
  stack: ReadonlyArray<RuntimeUnit>,
  maxHpOf: (u: RuntimeUnit) => number,
): { hp: number; hpMax: number } {
  let hp = 0;
  let hpMax = 0;
  for (const u of stack) {
    const m = maxHpOf(u);
    if (!Number.isFinite(m) || m <= 0) continue;
    hpMax += m;
    const cur = typeof u.hp === 'number' && Number.isFinite(u.hp) ? Math.max(0, Math.min(m, u.hp)) : m;
    hp += cur;
  }
  return { hp, hpMax };
}

/**
 * MOC POLA (M) całego stosu — JEDYNE miejsce, z którego tabliczka nad żetonem
 * bierze liczbę „Moc armii”.
 *
 * Liczy ją `sumRosterFieldM()` z game/auto-battle-power.ts, czyli DOKŁADNIE ta
 * sama funkcja, której gra używa do werdyktu auto-bitwy — zero równoległego
 * rachunku. Konsekwencje tego wyboru, które MUSZĄ być widoczne w interfejsie:
 *
 *   • `isFieldBattleUnit()` WYKLUCZA Zwiadowcę, Osadnika i jednostki oblężnicze,
 *     więc stos samych Zwiadowców ma Moc pola = 0. To nie jest błąd — ta armia
 *     naprawdę nie liczy się w bitwie polowej. Warstwa renderu ma wtedy
 *     NIE RYSOWAĆ pola Mocy (tak jak nie rysuje ikony Koszar przy poziomie 0),
 *     bo gołe „0” gracz odczytałby jako awarię.
 *   • `defOf(u)` NIE jest zapisane w tym pliku — to zależność wstrzykiwana
 *     przez wołającego (StackVitalsDeps, patrz niżej). DOMYŚLNIE OD
 *     R-MOC-TABLICZKA-CO-POKAZYWAC-Q1 = B (Maciej 2026-08-07) main.ts
 *     wstrzykuje `combatPowerScaledDefFor` (main.ts, obok
 *     `veteranScaledDefFor`/`rosterFieldPowerM`) — czyli DEFINICJĘ już
 *     PRZESKALOWANĄ premią weterana (game/veteran.ts), fortyfikacją polową/
 *     garnizonem bez muru i mnożnikiem trudności AI. Liczba na tabliczce jest
 *     więc dziś MOCĄ EFEKTYWNĄ, tą samą, którą realnie rozstrzyga auto-bitwa
 *     (rosterFieldPowerM()/resolveAutoBattleByPower() w main.ts) — CEL z
 *     C-MOC-Q1 domknięty, `stackFieldPowerM` sam się nie zmienił, zmieniło
 *     się WYŁĄCZNIE `defOf` wstrzyknięte z main.ts (syncUnitsRender).
 *     Zakres decyzji R-MOC-TABLICZKA-CO-POKAZYWAC-Q1 = B jest DOSŁOWNY:
 *     dotyczy WYŁĄCZNIE tabliczki nad żetonem. Panel pre-battle
 *     (main.ts::preBattleUnitFromRuntime, battle/mapFieldBattle.ts::
 *     preBattleUnitFromRuntime) NIE jest tym objęty i nadal liczy „Moc"
 *     z definicji NOMINALNEJ (`armyFieldPower(def)`) — to jest osobny temat
 *     (Evaluator, 2026-08-07): jedyny faktyczny konsument pola `.moc` w
 *     panelu pre-battle to etykieta „Szarża +X" dla jednostek konnych
 *     (preBattle.ts), niezwiązana z „Szacunkową przewagą".
 *   • Gdyby przyszły wołający chciał z powrotem Mocy NOMINALNEJ, wystarczy
 *     przekazać `defOf: (u) => defForUnit(u)` (surowa definicja
 *     units.json, bez żadnego skalowania) — ta funkcja i `sumRosterFieldM`
 *     nie wymagają zmiany.
 *
 * Jednostka: punkty Mocy pola M (ta sama skala co mAtk/mDef w auto-bitwie).
 */
export function stackFieldPowerM(
  stack: ReadonlyArray<RuntimeUnit>,
  defOf: (u: RuntimeUnit) => UnitPowerInput,
): number {
  if (stack.length === 0) return 0;
  return sumRosterFieldM(stack.map(u => ({ typeId: u.typeId, def: defOf(u) })));
}

/**
 * ODZNAKI STOSU — MAKSIMUM Z KAŻDEJ ŚCIEŻKI OSOBNO (decyzja właściciela
 * C-ZETON-STOS-Q1 = A, Maciej 2026-07-29).
 *
 * Uzasadnienie właściciela: przy armii gracz podejmuje decyzję o STARCIU, nie
 * o pojedynczej jednostce — maksimum mówi mu, z czym najgorszym się zmierzy,
 * i jest spójne z sumowaniem Mocy oraz puli HP.
 *
 * ⚠ ŚWIADOMIE PRZYJĘTY KOSZT — NIE JEST TO BŁĄD DO „NAPRAWIENIA”:
 * tak złożony zestaw odznak NIE OPISUJE ŻADNEJ REALNEJ JEDNOSTKI. Ikona Koszar
 * może pochodzić z innego członka stosu niż ikona Kuźni, a JEDNA oweteranowana
 * jednostka wśród trzech rekrutów daje gwiazdki CAŁEJ armii. Tak ma być.
 */
export function stackArmorBadgeLevel(stack: ReadonlyArray<RuntimeUnit>): UnitPathBadgeLevel {
  let best: UnitPathBadgeLevel = 0;
  for (const u of stack) {
    const lvl = armorPathBadgeLevel(u);
    if (lvl > best) best = lvl;
  }
  return best;
}

/** Jak `stackArmorBadgeLevel`, ale dla ścieżki B (Parametry → ikona Koszar). */
export function stackSoftBadgeLevel(stack: ReadonlyArray<RuntimeUnit>): UnitPathBadgeLevel {
  let best: UnitPathBadgeLevel = 0;
  for (const u of stack) {
    const lvl = softPathBadgeLevel(u);
    if (lvl > best) best = lvl;
  }
  return best;
}

/** Najwyższy poziom premii weterana w stosie (game/veteran.ts). Patrz koszt przy stackArmorBadgeLevel. */
export function stackVeteranLevel(stack: ReadonlyArray<RuntimeUnit>): VeteranLevel {
  let best: VeteranLevel = 1;
  for (const u of stack) {
    const lvl = veteranLevel(u);
    if (lvl > best) best = lvl;
  }
  return best;
}

/**
 * Najwyższa LICZBA GWIAZDEK w stosie (0–3).
 *
 * ⚠ NIE wyprowadzaj jej z poziomu premii. Po fali 106 gwiazdka = JEDNA WYGRANA
 * BITWA (`veteranStarCount`), a poziom premii ma tylko trzy stopnie
 * (1 wygrana → poziom 2, ale JEDNA gwiazdka). Stary rachunek
 * `veteranStars(poziom)` pokazałby jednostce po jednej wygranej DWIE gwiazdki,
 * czyli co innego niż pojedynczy żeton i co innego niż panel jednostki.
 */
export function stackVeteranStarCount(stack: ReadonlyArray<RuntimeUnit>): number {
  let best = 0;
  for (const u of stack) {
    const n = veteranStarCount(u);
    if (n > best) best = n;
  }
  return best;
}

/** Komplet liczb pokazywanych na tabliczce nad żetonem (R-ZETON-PASKI). */
export interface StackVitals {
  /** Pozostały wspólny pul ruchu stosu (pkt ruchu) — minimum z członków. */
  ruchLeft: number;
  /** Maksimum wspólnego pulu ruchu (pkt ruchu) — minimum z członków. */
  ruchMax: number;
  /** Suma bieżących punktów życia członków (HP). */
  hp: number;
  /** Suma maksymalnych punktów życia członków (HP). */
  hpMax: number;
  /** Moc pola M całego stosu (pkt Mocy); 0 = stos nie walczy w polu → pole Mocy się nie rysuje. */
  fieldPowerM: number;
  /** Liczba jednostek w stosie (1 = pojedyncza jednostka). */
  count: number;
  /** Ścieżka A (Pancerz → ikona Kuźni): NAJWYŻSZY poziom w stosie, 0–3. */
  armorBadgeLevel: UnitPathBadgeLevel;
  /** Ścieżka B (Parametry → ikona Koszar): NAJWYŻSZY poziom w stosie, 0–3. */
  softBadgeLevel: UnitPathBadgeLevel;
  /** NAJWYŻSZY poziom premii weterana w stosie (1–3). */
  veteranLevel: VeteranLevel;
  /** NAJWYŻSZA liczba gwiazdek w stosie (0–3) = najwięcej wygranych bitew. */
  veteranStars: number;
}

/** Zależności, których warstwa stosów nie zna sama (definicje jednostek żyją w main.ts). */
export interface StackVitalsDeps {
  /** Maksymalne HP jednostki — TA SAMA liczba, którą pokazuje panel/tooltip. */
  maxHpOf: (u: RuntimeUnit) => number;
  /** Definicja jednostki do rachunku Mocy pola (units.json). */
  defOf: (u: RuntimeUnit) => UnitPowerInput;
}

/** Komplet wartości stosu na tabliczkę — jedno wejście dla renderu mapy. */
export function stackVitals(
  stack: ReadonlyArray<RuntimeUnit>,
  deps: StackVitalsDeps,
): StackVitals {
  const pool = stackHpPool(stack, deps.maxHpOf);
  return {
    ruchLeft: stackRuchLeft(stack),
    ruchMax: stackRuchMax(stack),
    hp: pool.hp,
    hpMax: pool.hpMax,
    fieldPowerM: stackFieldPowerM(stack, deps.defOf),
    count: stack.length,
    armorBadgeLevel: stackArmorBadgeLevel(stack),
    softBadgeLevel: stackSoftBadgeLevel(stack),
    veteranLevel: stackVeteranLevel(stack),
    veteranStars: stackVeteranStarCount(stack),
  };
}

/** Ujednolic ruchLeft wszystkich członków stosu (domyślnie = min obecnych). */
export function syncStackRuchLeft(stack: RuntimeUnit[], ruchLeft?: number): void {
  if (stack.length === 0) return;
  const v = ruchLeft ?? stackRuchLeft(stack);
  for (const u of stack) u.ruchLeft = v;
}

/** Odejmij koszt ruchu od wspólnego pulu stosu. */
export function deductStackRuchLeft(stack: RuntimeUnit[], cost: number): void {
  syncStackRuchLeft(stack, Math.max(0, stackRuchLeft(stack) - cost));
}

/** Jednostka z ruchLeft = pul stosu (do pathfindingu). */
export function unitWithStackRuch(
  unit: RuntimeUnit,
  stack: ReadonlyArray<RuntimeUnit>,
): RuntimeUnit {
  if (stack.length <= 1) return unit;
  const pooled = stackRuchLeft(stack);
  return pooled === unit.ruchLeft ? unit : { ...unit, ruchLeft: pooled };
}

/** Jak unitWithStackRuch, ale z planningStackRuchLeft (jednostka wciąż w garnizonie). */
export function unitWithPlanningStackRuch(
  unit: RuntimeUnit,
  stack: ReadonlyArray<RuntimeUnit>,
): RuntimeUnit {
  const pooled = planningStackRuchLeft(stack);
  return pooled === unit.ruchLeft ? unit : { ...unit, ruchLeft: pooled };
}

/**
 * Jednostki właściciela na heksie miasta → bonus Prawo (Porządek).
 * Liczy stojące na polu miasta i ukryte w garnizonie (inGarnizon); pomija oblegających.
 */
export function countLawGarrisonOnCityHex(
  units: ReadonlyArray<RuntimeUnit>,
  cityQ: number,
  cityR: number,
  ownerId: number,
): number {
  return units.filter(
    u => u.ownerId === ownerId
      && u.q === cityQ
      && u.r === cityR
      && !u.oblegaCityId,
  ).length;
}

/** Jednostki na heksie miasta (do panelu Porządek / lista garnizonu). */
export function unitsOnCityHexForLaw(
  units: ReadonlyArray<RuntimeUnit>,
  cityQ: number,
  cityR: number,
  ownerId: number,
): RuntimeUnit[] {
  return units.filter(
    u => u.ownerId === ownerId
      && u.q === cityQ
      && u.r === cityR
      && !u.oblegaCityId,
  );
}
