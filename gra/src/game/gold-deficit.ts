/**
 * gold-deficit.ts — kara za deficyt Złota (R-DEFICYT-ZLOTA-KARA-Q1=A), próg
 * poprawiony w R-DEFICYT-ZLOTA-TRIGGER-Q1=B: analogia do głodu wojska
 * (empire-food.ts / army-starvation.ts), ale dla Skarbca (Złoto/Pieniądz)
 * zamiast zapasów Żywności.
 *
 * PRÓG (Q1=B): ownerTreasury(ownerId) < 0 PO zbankowaniu Skarbca tej tury
 * (dochód − utrzymanie) — wierna analogia do głodu wojska, który sprawdza
 * wyczerpanie ZAPASU państwa (central < 0), NIE chwilowy zły przepływ jednej
 * tury (`upkeepBalance().deficyt`, odrzucone w pierwszej rundzie AutoBot).
 *
 *   Warstwa A (natychmiast): Skarbiec < 0 w tej turze → zlotoDeficytStatMult
 *     (domyślnie 0,75, bez pancerza) mnoży staty bojowe — patrz
 *     applyGoldDeficitStatMultToCombatUnit (wzorzec:
 *     applyArmyHungerStatMultToCombatUnit, army-starvation.ts).
 *   Warstwa B (atrycja, po karencji): Skarbiec < 0 przez ≥
 *     zlotoDeficytKarencjaTur tur Z RZĘDU → applyGoldDeficitHpLoss() odejmuje
 *     co turę max(1, floor(maxHp × zlotoDeficytHpFrac)) HP; przy hp<=0
 *     jednostka jest trwale usuwana z gry (wzorzec:
 *     applyArmyStarvationHpLoss, army-starvation.ts).
 *
 * Dotyczy gracza i AI identycznie (PARYTET AI, jak głód wojska).
 *
 * Osobny, nazwany zestaw parametrów (zloto_deficyt_*, econ-params.json,
 * sekcja "ekonomia_miasta") — NIE reużywa literalnie stałych Żywności
 * (glod_wojska_*), zgodnie z ECHO R-DEFICYT-ZLOTA-KARA-Q1=A.
 */
import { isCivilianUnit } from '../units/setup';
import type { CombatUnit } from './combat';

export interface GoldDeficitState {
  /** Liczba kolejnych tur Z RZĘDU ze Skarbcem < 0 (0 gdy Skarbiec >= 0). */
  turyDeficytuZlota: number;
}

export interface GoldDeficitParams {
  /** Mnożnik statów bojowych (bez armor) gdy Skarbiec<0 tej tury — domyślnie 0,75. */
  zlotoDeficytStatMult: number;
  /** Liczba kolejnych tur Skarbca<0 zanim ruszy atrycja HP — domyślnie 3. */
  zlotoDeficytKarencjaTur: number;
  /** Ułamek max HP tracony co turę atrycji — domyślnie 0,08 (8%). */
  zlotoDeficytHpFrac: number;
}

export interface GoldDeficitTick {
  ownerId: number;
  /** Skarbiec właściciela odczytany PO zbankowaniu tej tury (main.ts, "Bank treasury"). */
  skarbiec: number;
  /** Skarbiec < 0 w tej turze. */
  deficytZlota: boolean;
  /** Kolejne tury Z RZĘDU ze Skarbcem<0, licząc tę turę (0 gdy nie ma deficytu). */
  turyDeficytuZlotaPo: number;
  /** Atrycja HP aktywna — turyDeficytuZlotaPo >= zlotoDeficytKarencjaTur. */
  zlotoDeficytAtrycjaAktywna: boolean;
}

export interface GoldDeficitTickResult {
  perOwner: GoldDeficitTick[];
  byOwner: Map<number, GoldDeficitTick>;
}

type Difficulty = 'easy' | 'normal' | 'hard';
interface RawParamRow { easy?: number; normal?: number; hard?: number; }

function pick(row: RawParamRow | undefined, d: Difficulty, fallback: number): number {
  if (!row) return fallback;
  const v = row[d];
  return Number.isFinite(v) ? (v as number) : fallback;
}

export function buildGoldDeficitParams(
  raw: {
    ekonomia_miasta?: Record<string, RawParamRow>;
    globalne?: Record<string, RawParamRow>;
    zloto_deficyt_stat_mult?: RawParamRow;
    zloto_deficyt_karencja_tur?: RawParamRow;
    zloto_deficyt_hp_frac?: RawParamRow;
  },
  difficulty: Difficulty = 'normal',
): GoldDeficitParams {
  const em = raw.ekonomia_miasta ?? raw;
  return {
    zlotoDeficytStatMult: pick(em.zloto_deficyt_stat_mult, difficulty, 0.75),
    zlotoDeficytKarencjaTur: pick(em.zloto_deficyt_karencja_tur, difficulty, 3),
    zlotoDeficytHpFrac: pick(em.zloto_deficyt_hp_frac, difficulty, 0.08),
  };
}

export function freshGoldDeficitState(): GoldDeficitState {
  return { turyDeficytuZlota: 0 };
}

/**
 * Rozlicza deficyt Złota dla wszystkich ownerów.
 *
 * WAŻNE (kolejność w main.ts): wołać PO zbankowaniu Skarbca tej tury (dochód
 * − utrzymanie, sekcja "Bank treasury" w main.ts) — `getOwnerTreasury` musi
 * zwracać stan PO aktualizacji, inaczej próg czyta saldo sprzed bankowania
 * (dawny błąd — próg na `upkeepBalance().deficyt`, R-DEFICYT-ZLOTA-TRIGGER-Q1).
 */
export function advanceGoldDeficit(
  ownerIds: Iterable<number>,
  states: Map<number, GoldDeficitState>,
  getOwnerTreasury: (ownerId: number) => number,
  params: GoldDeficitParams,
): GoldDeficitTickResult {
  const perOwner: GoldDeficitTick[] = [];
  const byOwner = new Map<number, GoldDeficitTick>();

  for (const ownerId of ownerIds) {
    const st = states.get(ownerId) ?? freshGoldDeficitState();
    if (!states.has(ownerId)) states.set(ownerId, st);

    const skarbiec = getOwnerTreasury(ownerId);
    const deficytZlota = skarbiec < 0;

    const turyPrzed = st.turyDeficytuZlota ?? 0;
    const turyPo = deficytZlota ? turyPrzed + 1 : 0;
    st.turyDeficytuZlota = turyPo;

    const tick: GoldDeficitTick = {
      ownerId,
      skarbiec,
      deficytZlota,
      turyDeficytuZlotaPo: turyPo,
      zlotoDeficytAtrycjaAktywna: turyPo >= params.zlotoDeficytKarencjaTur,
    };
    perOwner.push(tick);
    byOwner.set(ownerId, tick);
  }

  _setLastGoldDeficitTicks(byOwner);
  return { perOwner, byOwner };
}

// --- Runtime accessors (HUD / combat wiring) ---

let _lastTicks = new Map<number, GoldDeficitTick>();

export function _setLastGoldDeficitTicks(ticks: Map<number, GoldDeficitTick>): void {
  _lastTicks = ticks;
}

export function clearLastGoldDeficitTicks(): void {
  _lastTicks = new Map();
}

/** Deficyt Złota — osłabienie statów bojowych (bez armor) gdy Skarbiec<0 tej tury. */
export function isGoldDeficit(ownerId: number): boolean {
  return _lastTicks.get(ownerId)?.deficytZlota ?? false;
}

/** Atrycja HP — aktywna PO karencji zlotoDeficytKarencjaTur tur ze Skarbcem<0 z rzędu. */
export function isGoldDeficitStarving(ownerId: number): boolean {
  return _lastTicks.get(ownerId)?.zlotoDeficytAtrycjaAktywna ?? false;
}

export function getGoldDeficitCountdown(ownerId: number, karencjaTur: number): number | null {
  const t = _lastTicks.get(ownerId);
  if (!t || !t.deficytZlota || t.zlotoDeficytAtrycjaAktywna) return null;
  return Math.max(1, karencjaTur - t.turyDeficytuZlotaPo);
}

export function getLastGoldDeficitTick(ownerId: number): GoldDeficitTick | undefined {
  return _lastTicks.get(ownerId);
}

// ---------------------------------------------------------------------------
// Combat / HP loss — wzorzec army-starvation.ts (patrz uzasadnienie w nagłówku).
// ---------------------------------------------------------------------------

function round4(x: number): number {
  return Math.round(x * 10000) / 10000;
}

/**
 * Osłabia staty bojowe jednostki przy deficycie Złota (mult < 1). Identyczny
 * mechanizm co applyArmyHungerStatMultToCombatUnit (army-starvation.ts), ale
 * osobna funkcja/nazwa — parametr mult (zlotoDeficytStatMult) jest osobny od
 * Żywności (glodWojskaStatMult), zgodnie z ECHO R-DEFICYT-ZLOTA-KARA-Q1=A.
 */
export function applyGoldDeficitStatMultToCombatUnit(cu: CombatUnit, mult: number): CombatUnit {
  if (mult >= 1 || mult <= 0) return cu;
  const progRaw = cu['Prog dezercji (% health)'];
  const progScaled = progRaw === null || progRaw === undefined
    ? progRaw
    : round4(progRaw * (2 - mult));
  return {
    ...cu,
    meleeAttack: cu.meleeAttack * mult,
    meleeDefence: cu.meleeDefence * mult,
    weaponDamage: cu.weaponDamage * mult,
    piercing: cu.piercing * mult,
    chargeBonus: cu.chargeBonus * mult,
    health: cu.health * mult,
    missileAttack: cu.missileAttack * mult,
    'Prog dezercji (% health)': progScaled,
  };
}

export interface GoldDeficitStarvationUnit {
  id: string;
  ownerId: number;
  typeId: string;
  category: string;
  hp?: number;
  hpMax?: number;
}

export interface GoldDeficitStarvationResult {
  /** id jednostek zniszczonych (hp <= 0 po ticku). */
  destroyedIds: string[];
  /** Liczba jednostek, którym zmniejszono HP. */
  damagedCount: number;
}

/**
 * Stosuje stratę HP z atrycji deficytu Złota — identyczna logika co
 * applyArmyStarvationHpLoss (army-starvation.ts). Jednostki cywilne pomijane.
 */
export function applyGoldDeficitHpLoss(
  units: GoldDeficitStarvationUnit[],
  ownerId: number,
  hpFrac: number,
  getMaxHp: (typeId: string) => number,
): GoldDeficitStarvationResult {
  const frac = Math.max(0, Math.min(1, hpFrac));
  if (frac <= 0) return { destroyedIds: [], damagedCount: 0 };

  const destroyedIds: string[] = [];
  let damagedCount = 0;

  for (const u of units) {
    if (u.ownerId !== ownerId) continue;
    if (isCivilianUnit(u)) continue;
    const maxHp = u.hpMax ?? getMaxHp(u.typeId);
    if (maxHp <= 0) continue;

    if (u.hpMax == null) u.hpMax = maxHp;
    if (u.hp == null) u.hp = maxHp;

    const loss = Math.max(1, Math.floor(maxHp * frac));
    u.hp = Math.max(0, u.hp - loss);
    damagedCount++;

    if (u.hp <= 0) destroyedIds.push(u.id);
  }

  return { destroyedIds, damagedCount };
}
