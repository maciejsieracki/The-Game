/**
 * R-WEB-SIEGE-LAST-STAND-SORTIE-Q1 -- „atak ostatniej woli" obleganej armii.
 *
 * Reguła właściciela (2026-11-04): zanim oblegana armia skapituluje, w OSTATNIEJ turze próbuje
 * zaatakować oblegających -- ale tylko gdy nie jest słabsza o więcej niż 20% (stosunek
 * oblegający : oblężony <= 10 : 8, czyli siła oblężonych >= 80% siły oblegających; silniejsza też
 * atakuje). W każdym innym wypadku zostaje w oblężeniu i nie atakuje.
 *
 * ZAŁOŻENIA (zapisane w raporcie, bez pytań ABC):
 *  - „Ostatnia tura przed kapitulacją" = miasto `oblegane` ORAZ `siegeCapitulationPending`
 *    (flaga ustawiana w main.ts handleSiegeCapitulationPhase gdy zapasy = 0; następny tick
 *    ekonomii wywołuje resolveSiegeSurrender). Tick ekonomii biegnie PRZED fazą AI/barbarzyńców
 *    w tym samym przejściu tury, więc faza, w której flaga jest już true, jest ostatnią turą.
 *  - Siła = ta sama funkcja co siegeAi (estimateUnitCombatStrength: Atak, Obrona, Pancerz,
 *    weaponDamage, Uderzenie, skala HP). Wypad walczy w polu -- mury i wirtualna Milicja NIE
 *    wchodzą do siły obleganych (nie wychodzą z miasta).
 *  - Dotyczy wyłącznie właścicieli sterowanych automatycznie (AI, barbarzyńcy); gracz decyduje sam.
 *
 * Czysty moduł: bez DOM/THREE/stanu globalnego. Wszystko deterministyczne (sortowanie po id).
 */

/** Licznik/mianownik progu: siła oblężonych * 10 >= siła oblegających * 8 (10 : 8 = -20%). */
export const LAST_STAND_BESIEGER_PARTS = 10;
export const LAST_STAND_BESIEGED_PARTS = 8;
const EPS = 1e-9;

/** Minimalny kształt miasta potrzebny do predykatu ostatniej tury. */
export interface LastStandCity {
  id: string;
  q: number;
  r: number;
  ownerId: number;
  oblegane?: boolean;
  oblegajacyOwnerId?: number;
  siegeCapitulationPending?: boolean;
}

/**
 * JEDNOZNACZNY predykat: miasto oblegane, zapasy wyczerpane, a następny tick ekonomii przekaże
 * je oblegającemu => ta tura jest ostatnią przed kapitulacją.
 */
export function isLastTurnBeforeCapitulation(
  city: Pick<LastStandCity, 'oblegane' | 'siegeCapitulationPending'>,
): boolean {
  return city.oblegane === true && city.siegeCapitulationPending === true;
}

/**
 * Czysta funkcja decyzji. Wypad TAK <=> ostatnia tura ORAZ obie strony mają siłę > 0 ORAZ
 * siła oblężonych >= 80% siły oblegających (10 : 8; dokładnie 80% atakuje, 79% nie).
 */
export function shouldLastStandSortie(
  besiegedStrength: number,
  besiegerStrength: number,
  isLastTurn: boolean,
): boolean {
  if (!isLastTurn) return false;
  if (!(besiegedStrength > 0) || !(besiegerStrength > 0)) return false;
  return besiegedStrength * LAST_STAND_BESIEGER_PARTS + EPS >= besiegerStrength * LAST_STAND_BESIEGED_PARTS;
}

/** Jednostka widziana przez planer (RuntimeUnit spełnia ten kształt). */
export interface LastStandUnit {
  id: string;
  ownerId: number;
  q: number;
  r: number;
  ruchLeft: number;
  embarked?: boolean;
  sentry?: boolean;
  ufortyfikowanyWPolu?: boolean;
  oblegaCityId?: string;
}

export interface LastStandDeps<U extends LastStandUnit> {
  /** Wspólna ocena siły jednostki (siegeAi.estimateUnitCombatStrength po runtimeUnitToSiegeUnit). */
  strengthOf: (u: U) => number;
  /** false dla cywilów (osadnik/robotnik/zwiadowca) -- nie liczą się do siły ani nie atakują. */
  isMilitary: (u: U) => boolean;
  /** Relacja wojny (ta sama co w startMapSiege / egzekucji ataku AI). */
  isEnemy: (a: number, b: number) => boolean;
  hexDistance: (q1: number, r1: number, q2: number, r2: number) => number;
}

export interface LastStandAttackCmd {
  type: 'attack';
  unitId: string;
  targetUnitId: string;
}

export interface LastStandPlan {
  cityId: string;
  isLastTurn: boolean;
  besiegedStrength: number;
  besiegerStrength: number;
  sortie: boolean;
  /** Powód (PL) -- do logu i testów. */
  reason: string;
  /** 0 lub 1 komenda ataku (kotwica = pierwsza ruchoma jednostka wg id). */
  commands: LastStandAttackCmd[];
}

/** Jednostka może wyjść: ma ruch, nie jest zaokrętowana/uśpiona/ufortyfikowana w polu/oblegająca. */
export function canUnitSortie(u: LastStandUnit): boolean {
  if (u.ruchLeft <= 0) return false;
  if (u.embarked === true) return false;
  if (u.sentry === true) return false;
  if (u.ufortyfikowanyWPolu === true) return false;
  if (u.oblegaCityId) return false;
  return true;
}

function byId(a: LastStandUnit, b: LastStandUnit): number {
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/**
 * Plan wypadu dla JEDNEGO oblężonego miasta. Nie mutuje wejścia. Komendy mają kształt
 * AICmdAttack, więc wykonuje je istniejąca ścieżka ataku AI / barbarzyńców w main.ts
 * (wojna, widoczność, bitwa z graczem, zwykłe zasady walki).
 *
 * `besiegerOwnerId` -- właściciel oblegających (city.oblegajacyOwnerId / siegeBesiegerByCity).
 */
export function planLastStandSortie<U extends LastStandUnit>(
  city: LastStandCity,
  besiegerOwnerId: number | null | undefined,
  units: ReadonlyArray<U>,
  deps: LastStandDeps<U>,
): LastStandPlan {
  const isLastTurn = isLastTurnBeforeCapitulation(city);
  const none = (reason: string, bd = 0, br = 0): LastStandPlan => ({
    cityId: city.id, isLastTurn, besiegedStrength: bd, besiegerStrength: br,
    sortie: false, reason, commands: [],
  });

  if (city.oblegane !== true) return none('miasto nie jest oblegane');
  if (!isLastTurn) return none('nie ostatnia tura przed kapitulacją -- zostaje w oblężeniu');
  if (besiegerOwnerId === null || besiegerOwnerId === undefined) return none('brak oblegającego');
  if (besiegerOwnerId === city.ownerId || !deps.isEnemy(city.ownerId, besiegerOwnerId)) {
    return none('oblegający nie jest wrogiem');
  }

  // Oblegana armia = wojskowe jednostki właściciela na heksie miasta.
  const defenders = units
    .filter(u => u.ownerId === city.ownerId && u.q === city.q && u.r === city.r && deps.isMilitary(u))
    .sort(byId);
  // Oblegający = wojskowe jednostki oblegającego przy murach (dystans 1).
  const besiegers = units
    .filter(u => u.ownerId === besiegerOwnerId && deps.hexDistance(u.q, u.r, city.q, city.r) === 1
      && u.embarked !== true && deps.isMilitary(u))
    .sort(byId);

  let bd = 0;
  for (const u of defenders) bd += deps.strengthOf(u);
  let br = 0;
  for (const u of besiegers) br += deps.strengthOf(u);

  if (defenders.length === 0) return none('brak obrońców', bd, br);
  if (besiegers.length === 0) return none('brak oblegających przy murach', bd, br);
  if (!shouldLastStandSortie(bd, br, isLastTurn)) {
    return none('siła obleganych poniżej 80% oblegających -- zostaje w oblężeniu', bd, br);
  }

  const anchor = defenders.find(canUnitSortie);
  if (!anchor) return none('żadna jednostka nie może się ruszyć -- zostaje', bd, br);

  // Cel: oblegający, wokół którego (dystans <= 1) stoi najwięcej oblegających (roster obrońcy
  // w main.ts zbiera jednostki w promieniu 1 od kotwicy); remis -> najniższe id.
  let target = besiegers[0]!;
  let bestCover = -1;
  for (const cand of besiegers) {
    let cover = 0;
    for (const o of besiegers) {
      if (deps.hexDistance(cand.q, cand.r, o.q, o.r) <= 1) cover++;
    }
    if (cover > bestCover) { bestCover = cover; target = cand; }
  }

  return {
    cityId: city.id, isLastTurn, besiegedStrength: bd, besiegerStrength: br, sortie: true,
    reason: 'atak ostatniej woli (siła obleganych >= 80% oblegających)',
    commands: [{ type: 'attack', unitId: anchor.id, targetUnitId: target.id }],
  };
}
