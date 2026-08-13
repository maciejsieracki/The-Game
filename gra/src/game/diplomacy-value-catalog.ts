/**
 * diplomacy-value-catalog.ts — wspólny katalog PN (handel, dar, przekupstwo).
 * Maciej D3-KATALOG-PN: jednostka=Pieniądz(koszt); surowiec boolean=min koszt_praca odblokowującego.
 * Ulepszenia terenu i budynki miasta — NIE handlowalne.
 */
import diplomacyJson from '../../data/diplomacy.json';
import techJson from '../../data/tech.json';
import terrainImprovementsJson from '../../data/terrain-improvements.json';
import unitsJson from '../../data/units.json';
import buildingsJson from '../../data/buildings.json';
import econParamsJson from '../../data/econ-params.json';
import { diplomacyDepositBasePrice } from './diplomacy-deposit-trade';
import { applyTempoKoszt, type TempoGry } from './tech-tempo';
import { scaleRelationThreshold, getBaseDiplomacyParams } from './diplomacy';
import type { GameDifficulty } from './difficulty-cost';

/** Typ pozycji w koszyku wymiany / daru (v1.0). Ulepszenia terenu — poza koszykiem. */
export type WartoscPozycjaTyp =
  | 'zloto'
  | 'praca'
  | 'zloze'
  | 'tech'
  | 'jednostka'
  | 'surowiec_boolean'
  | 'surowiec_ilosc'
  | 'zywnosc';

export type WartoscKatalogReguly = {
  pn_zloto?: { skala?: number };
  pn_praca?: { skala?: number };
  pn_budynek_skalowanie?: number;
  pn_zywnosc?: { jednostki_na_pn?: number };
};

const BUILDING_PN_FACTOR = 1.1;

type JsonImprovement = {
  koszt_praca?: number;
  surowiecOdblokowany?: string | null;
};

type JsonUnit = {
  Jednostka?: string;
  'Pieniądz (koszt)'?: number;
  'Rola (linia)'?: string;
};

type JsonBuilding = {
  id?: string;
  kosztBudowy?: number;
};

type JsonTech = {
  Technologia?: string;
  'Koszt nauki'?: number;
};

function loadReguly(): WartoscKatalogReguly {
  const block = (diplomacyJson as { wartosc_katalog?: WartoscKatalogReguly }).wartosc_katalog;
  return block ?? {};
}

const _reguly = loadReguly();

function improvementMap(): Record<string, JsonImprovement> {
  const raw = terrainImprovementsJson as Record<string, JsonImprovement | unknown>;
  const out: Record<string, JsonImprovement> = {};
  for (const [key, val] of Object.entries(raw)) {
    if (key.startsWith('_') || typeof val !== 'object' || val == null) continue;
    out[key] = val as JsonImprovement;
  }
  return out;
}

function buildResourceAccessIndex(): Map<string, number> {
  const map = new Map<string, number>();
  for (const row of Object.values(improvementMap())) {
    const key = row.surowiecOdblokowany?.trim().toLowerCase();
    const koszt = row.koszt_praca;
    if (!key || typeof koszt !== 'number' || !Number.isFinite(koszt) || koszt <= 0) continue;
    const prev = map.get(key);
    if (prev == null || koszt < prev) map.set(key, koszt);
  }
  return map;
}

const _improvements = improvementMap();
const _resourceAccessPn = buildResourceAccessIndex();

const _units = (unitsJson as JsonUnit[]).filter(u => typeof u.Jednostka === 'string');
const _buildings = (buildingsJson as JsonBuilding[]).filter(b => typeof b.id === 'string');

const _techByName = new Map<string, number>();
for (const row of (techJson as { technologie?: JsonTech[] }).technologie ?? []) {
  const name = row.Technologia?.trim();
  const koszt = row['Koszt nauki'];
  if (name && typeof koszt === 'number' && Number.isFinite(koszt)) {
    _techByName.set(name, koszt);
  }
}

/** 1 PN = N ¤ (domyślnie 1:1). */
export function diplomacyPnZloto(amount: number): number {
  const skala = _reguly.pn_zloto?.skala ?? 1;
  return Math.max(0, Math.round(amount * skala));
}

/** 1 PN = N Praca (domyślnie 1:1). */
export function diplomacyPnPraca(amount: number): number {
  const skala = _reguly.pn_praca?.skala ?? 1;
  return Math.max(0, Math.round(amount * skala));
}

const DEFAULT_ZYWNOSC_NA_PN = 1;

/** PN żywności ze spichlerza — floor(sztuki ÷ jednostki_na_pn). Maciej: 1 PN = 1 żywność. */
export function diplomacyPnZywnosc(amount: number): number {
  const perPn = _reguly.pn_zywnosc?.jednostki_na_pn ?? DEFAULT_ZYWNOSC_NA_PN;
  if (perPn <= 0 || !Number.isFinite(amount) || amount <= 0) return 0;
  return Math.floor(amount / perPn);
}

export function diplomacyZywnoscNaPn(): number {
  return _reguly.pn_zywnosc?.jednostki_na_pn ?? DEFAULT_ZYWNOSC_NA_PN;
}

/** PN dostępu do złoża mineralnego (hex) — cennik handel_zloze. */
export function diplomacyPnZloze(zlozeId: string): number | null {
  return diplomacyDepositBasePrice(zlozeId);
}

/**
 * Mnożnik PN koszyka — strona „My oddajemy" (Maciej 2026-07-29, wszystkie elementy).
 * Hard: ×0,5 (gorzej wyceniane); Easy: ×1,5; Normal: ×1,0.
 */
export const BASKET_PN_DIFFICULTY_MULT_PLAYER_GIVE: Readonly<Record<GameDifficulty, number>> = Object.freeze({
  easy: 1.5,
  normal: 1.0,
  hard: 0.5,
});

/**
 * Mnożnik PN koszyka — strona „My dostajemy" (Maciej 2026-07-29, wszystkie elementy).
 * Hard: ×1,5 (lepiej wyceniane); Easy: ×0,5; Normal: ×1,0.
 */
export const BASKET_PN_DIFFICULTY_MULT_PLAYER_RECEIVE: Readonly<Record<GameDifficulty, number>> = Object.freeze({
  easy: 0.5,
  normal: 1.0,
  hard: 1.5,
});

export type BasketSideTradeRole = 'sell' | 'buy';

/**
 * Rola strony koszyka z perspektywy gracza (ownerId 0):
 * give/receive względem proponenta → sprzedaż (My oddajemy) lub kupno (My dostajemy).
 */
export function basketSideTradeRoleFromProposal(
  side: 'give' | 'receive',
  proposerOwnerId: number,
  playerOwnerId = 0,
): BasketSideTradeRole {
  const playerIsProposer = proposerOwnerId === playerOwnerId;
  if (side === 'give') return playerIsProposer ? 'sell' : 'buy';
  return playerIsProposer ? 'buy' : 'sell';
}

/** @deprecated alias — użyj basketSideTradeRoleFromProposal */
export const techTradeRoleFromBasketSide = basketSideTradeRoleFromProposal;

/**
 * Mnożnik trudności dla strony koszyka (wszystkie typy pozycji, w tym tech).
 * Wymaga `side`, `difficulty` i `proposerOwnerId` — inaczej ×1.
 */
export function basketSidePnDifficultyMultiplier(
  side: 'give' | 'receive',
  difficulty: GameDifficulty,
  proposerOwnerId: number,
  playerOwnerId = 0,
): number {
  const role = basketSideTradeRoleFromProposal(side, proposerOwnerId, playerOwnerId);
  return role === 'sell'
    ? BASKET_PN_DIFFICULTY_MULT_PLAYER_GIVE[difficulty]
    : BASKET_PN_DIFFICULTY_MULT_PLAYER_RECEIVE[difficulty];
}

/**
 * PN technologii = Koszt nauki (tech.json) × tempo gry.
 * Modyfikator trudności stosuje `diplomacySumPn` (globalnie per strona koszyka).
 */
export function diplomacyPnTech(
  techName: string,
  tempo: TempoGry | number = 'standardowa',
): number | null {
  const base = _techByName.get(techName.trim());
  if (base == null) return null;
  return applyTempoKoszt(base, tempo);
}

/** @internal Cennik referencyjny — tylko do indeksu surowiec_boolean; nie pozycja handlu. */
export function diplomacyPnUlepszenie(improvementId: string): number | null {
  const row = _improvements[improvementId.trim().toLowerCase()];
  const v = row?.koszt_praca;
  if (typeof v !== 'number' || !Number.isFinite(v) || v < 0) return null;
  return v;
}

/** PN jednostki = Pieniądz (koszt) z units.json. */
export function diplomacyPnJednostka(unitName: string): number | null {
  const row = _units.find(u => u.Jednostka === unitName.trim());
  const v = row?.['Pieniądz (koszt)'];
  if (typeof v !== 'number' || !Number.isFinite(v) || v <= 0) return null;
  return v;
}

/** @internal — budynki miasta nie są pozycją handlu (D3-KAT-NO-BLD). */
export function diplomacyPnBudynek(buildingId: string, level = 1): number | null {
  const row = _buildings.find(b => b.id === buildingId.trim());
  const base = row?.kosztBudowy;
  if (typeof base !== 'number' || !Number.isFinite(base) || base <= 0) return null;
  const lv = Math.max(1, Math.floor(level));
  const factor = _reguly.pn_budynek_skalowanie ?? BUILDING_PN_FACTOR;
  return Math.round(base * Math.pow(factor, lv - 1));
}

/** PN dostępu boolean do surowca = min koszt_praca ulepszeń z surowiecOdblokowany. */
export function diplomacyPnSurowiecBoolean(surowiecKey: string): number | null {
  const v = _resourceAccessPn.get(surowiecKey.trim().toLowerCase());
  return v != null ? v : null;
}

/** Lista kluczy surowców z mapowaniem PN (debug / UI). */
export function diplomacyResourceAccessCatalog(): Readonly<Record<string, number>> {
  return Object.freeze(Object.fromEntries(_resourceAccessPn));
}

// ---------------------------------------------------------------------------
// C-DYP-SUROWCE-Q1=B (2026-07-23) + Maciej 2026-07-29: handel ILOŚCIOWY
// surowcami miejskimi (surowiec_ilosc) — PN/szt. z econ-params.json handel_surowce.
// PN pozycji = cena_PN/szt. × ilość sztuk. R-DYP-PAKIET-USUN (2026-08-08, Maciej):
// koszyk handlu podaje sztuki wprost (bez pakietów) — `ilosc` na BasketItem
// surowiec_ilosc to zawsze SZTUKI, nie krotność pakietu.
// ---------------------------------------------------------------------------

type RawHandelSurowceRow = Record<string, number | string | undefined>;

interface RawEconParamsJsonHandelSurowce {
  handel_surowce?: Record<string, RawHandelSurowceRow>;
}

const _handelSurowce = (econParamsJson as RawEconParamsJsonHandelSurowce).handel_surowce ?? {};

/**
 * Klucz ASCII surowca (cities.ts City.surowce) → klucz wiersza cennika w econ-params.json.
 * Maciej 2026-07-29: wycena za 1 szt. (PN/szt.); PN pozycji = cena × ilość sztuk wprost.
 */
const HANDEL_SUROWCE_CENA_ROW: Readonly<Record<string, string>> = {
  drewno: 'cena_drewno',
  glina: 'cena_glina',
  kamien: 'cena_kamien',
  ruda: 'cena_ruda',
  ruda_zelaza: 'cena_ruda_zelaza',
  ruda_cyny: 'cena_ruda_cyny',
  cegla: 'cena_cegla',
  sol: 'cena_sol',
  kon: 'cena_kon',
  ceramika: 'cena_ceramika',
  braz: 'cena_braz',
  zelazo: 'cena_zelazo',
  stal: 'cena_stal',
  zloto: 'cena_zloto',
  wegiel: 'cena_wegiel',
};

const DEFAULT_HANDEL_SUROWCE_PAKIET = 10;

function readHandelSurowceParam(rowKey: string, fallback: number): number {
  const row = _handelSurowce[rowKey];
  const v = row?.normal;
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}

// ---------------------------------------------------------------------------
// R-DYPLO-CENNIK-SKALA-5X-Q1 (Maciej 2026-08-13): po ×5 rebalansie produkcji surowców
// fizycznych (R-EKONOMIA-SUROWCE-SKALA-5X-Q1) właściciel odrzucił dzielenie cena_* przez 5
// (dawałoby ułamki — Drewno 1→0,2 itd., dokładnie ten sam floor-do-zera, który rebalans miał
// wyeliminować). Zamiast tego cena_* zostaje NUMERYCZNIE bez zmian, a minimalny krok/
// wielokrotność wymiany handlowej rośnie z 1 szt. na 5 szt.: „stara 1 szt. to wartościowo
// nowe 5 szt." (Maciej, dosłownie). Złoto (surowiec w magazynie, id `zloto` — odrębne od
// Pieniądza/¤) i Węgiel zostają przy kroku 1 — Złoto świadomie WYŁĄCZONE z ×5
// (R-EKONOMIA-SUROWCE-SKALA-5X-Q1 pkt 8), Węgiel nie ma ŻADNEJ produkcji objętej ×5
// rebalansem (brak wpisów w terrain-improvements.json/buildings.json — sprawdzone grepem),
// więc jego cena/krok też zostają nietknięte z tego samego powodu co Złoto.
// / EN: after the ×5 physical-resource production rebalance, the owner rejected dividing
// cena_* by 5 (fractions again). Instead cena_* stays numerically unchanged and the minimum
// trade increment becomes 5 units for resources actually touched by ×5 — Gold and Coal (never
// touched by ×5) keep step 1.
// ---------------------------------------------------------------------------

/** Surowce ilościowe dotknięte ×5 rebalansem produkcji — krok handlu 5 szt. (patrz wyżej). */
const HANDEL_SUROWCE_KROK5: ReadonlySet<string> = new Set([
  'drewno', 'glina', 'kamien', 'ruda', 'ruda_zelaza', 'ruda_cyny', 'cegla', 'sol', 'kon',
  'ceramika', 'braz', 'zelazo', 'stal',
]);

/**
 * Minimalny krok/wielokrotność wymiany handlowej (szt.) dla danego surowca ilościowego.
 * 5 dla surowców fizycznych dotkniętych ×5 (patrz `HANDEL_SUROWCE_KROK5`), 1 dla
 * Złota/Węgla (świadomie wyłączone z ×5) i dla wszystkiego spoza katalogu (bezpieczny
 * fallback — brak krotności = brak ograniczenia).
 */
export function diplomacyHandelSurowiecKrok(surowiecKey: string): number {
  return HANDEL_SUROWCE_KROK5.has(surowiecKey.trim().toLowerCase()) ? 5 : 1;
}

/**
 * Normalizuje `rawQty` sztuk surowca `surowiecKey` do wielokrotności kroku handlu
 * (`diplomacyHandelSurowiecKrok`) — floor W DÓŁ, nigdy w górę (żeby przycięcie do `max`
 * zapasu nigdy nie przekroczyło go). Gdy podany jest `max` (zapas dostępny), przycina
 * do niego PRZED floorowaniem — floorowanie PO przycięciu jest konieczne, bo `max` sam
 * w sobie zwykle NIE jest wielokrotnością 5 (magazyn miejski rośnie/maleje o dowolne
 * ilości z produkcji minus zużycie, nie tylko o wielokrotności 5).
 * Zwraca 0, gdy wynik < kroku (za mało nawet na jeden blok) — spójne z istniejącym
 * traktowaniem ilosc<=0 jako "brak/nieprawidłowa pozycja" w readItemFromForm/
 * diplomacyPnSurowiecIlosc (nigdy nie zaokrągla w GÓRĘ do minimalnego bloku — to byłoby
 * cichym PODWYŻSZENIEM ilości ponad to, co gracz/AI faktycznie zażądali).
 * Używane przez WSZYSTKIE punkty decydujące o ilości surowiec_ilosc (UI koszyka, silnik PN,
 * transfer wykonawczy, generatory ofert AI/Szybkiej umowy) — jeden wspólny mechanizm zamiast
 * duplikowanej logiki floor/clamp w każdym miejscu z osobna.
 * / EN: normalizes rawQty down to the nearest multiple of the trade step for surowiecKey,
 * flooring AFTER capping to max (max itself is rarely already a multiple of 5). Returns 0
 * when the result is below one step — never rounds UP to the minimum block, which would
 * silently inflate a requested quantity.
 */
export function diplomacyNormalizeSurowiecIlosc(
  surowiecKey: string,
  rawQty: number,
  max?: number,
): number {
  if (!Number.isFinite(rawQty)) return 0;
  const capped = max != null && Number.isFinite(max) ? Math.min(rawQty, max) : rawQty;
  if (!(capped > 0)) return 0;
  const krok = diplomacyHandelSurowiecKrok(surowiecKey);
  if (krok <= 1) return Math.floor(capped);
  return Math.floor(capped / krok) * krok;
}

/**
 * R-DYP-PAKIET-USUN (2026-08-08, Maciej): koszyk handlu NIE liczy już w pakietach —
 * gracz podaje sztuki wprost (patrz diplomacyPnSurowiecIlosc, main.ts transferBasketItems).
 * Ta wartość (econ-params.json handel_surowce.pakiet_wielkosc) zostaje WYŁĄCZNIE jako
 * wewnętrzny próg heurystyki AI (detectPricedResourceDeficits / ai-resource-needs.ts —
 * "zapas poniżej X sztuk = deficyt") — nie mnoży już żadnej realnej ilości transferu.
 */
export function diplomacyHandelSurowcePakietWielkosc(): number {
  const v = readHandelSurowceParam('pakiet_wielkosc', DEFAULT_HANDEL_SUROWCE_PAKIET);
  return v > 0 ? Math.floor(v) : DEFAULT_HANDEL_SUROWCE_PAKIET;
}

/** Cena jednostkowa (PN/szt.) surowca ilościowego, lub null gdy surowiec spoza cennika. */
export function diplomacyHandelSurowiecCenaJednostkowa(surowiecKey: string): number | null {
  const rowKey = HANDEL_SUROWCE_CENA_ROW[surowiecKey.trim().toLowerCase()];
  if (!rowKey) return null;
  const v = readHandelSurowceParam(rowKey, NaN);
  return Number.isFinite(v) && v >= 0 ? v : null;
}

/**
 * PN pozycji koszyka surowiec_ilosc = sztuki × cena_PN/szt.
 * R-DYP-PAKIET-USUN (2026-08-08): `iloscSztuk` to SZTUKI wprost — spójne z polem
 * `ilosc` w BasketItem (dawniej „pakiety", usunięte na życzenie właściciela: „podajemy
 * sztuki. Jeden, dziesięć, sto — żadnych pakietów").
 * R-DYPLO-CENNIK-SKALA-5X-Q1 (2026-08-13): `iloscSztuk` przechodzi PRZEZ
 * `diplomacyNormalizeSurowiecIlosc` — floor do wielokrotności kroku handlu (5 szt. dla
 * surowców dotkniętych ×5, patrz wyżej) — ZANIM policzona zostanie cena. To jest jedyny
 * choke-point, przez który przechodzi KAŻDA wycena PN pozycji surowiec_ilosc (UI koszyka,
 * generatory ofert AI, Szybka umowa, walidacja przy zatwierdzeniu) — więc dowolna ilość
 * niebędąca wielokrotnością 5, z DOWOLNEGO źródła (w tym ręcznie edytowany save), jest tu
 * bezpiecznie przycinana w dół, NIGDY cicho zaakceptowana jako-jest.
 */
export function diplomacyPnSurowiecIlosc(surowiecKey: string, iloscSztuk: number): number | null {
  const cena = diplomacyHandelSurowiecCenaJednostkowa(surowiecKey);
  if (cena == null) return null;
  const sztuki = diplomacyNormalizeSurowiecIlosc(surowiecKey, iloscSztuk);
  if (sztuki <= 0) return 0;
  return Math.max(0, Math.round(sztuki * cena));
}

/** Lista surowców ilościowych z ceną jednostkową (debug / UI fallback). */
export function diplomacyHandelSurowceCatalog(): Readonly<Record<string, number>> {
  const out: Record<string, number> = {};
  for (const key of Object.keys(HANDEL_SUROWCE_CENA_ROW)) {
    const cena = diplomacyHandelSurowiecCenaJednostkowa(key);
    if (cena != null) out[key] = cena;
  }
  return Object.freeze(out);
}

export interface DiplomacySumPnOptions {
  /** Poziom trudności partii gracza (easy/normal/hard). */
  difficulty?: GameDifficulty;
  /** Kto złożył propozycję — do ustalenia roli tech sell/buy. */
  proposerOwnerId?: number;
  /** Gracz ludzki (domyślnie 0). */
  playerOwnerId?: number;
  /** Która strona koszyka jest sumowana (give = oddajemy, receive = oczekujemy). */
  side?: 'give' | 'receive';
  tempo?: TempoGry | number;
  /** Handel cykliczny — mnożnik pełnego cyklu (turns tur). */
  turnsMultiplier?: number;
  /** Gdy true + turnsMultiplier>1 — mnoży PN pozycji ilościowych (¤/Praca/żywność/sztuki surowca). */
  perTurn?: boolean;
}

function applyBasketSideDifficultyPn(
  basePn: number,
  opts?: DiplomacySumPnOptions,
): number {
  if (
    basePn <= 0 ||
    !opts?.difficulty ||
    opts.side == null ||
    opts.proposerOwnerId == null
  ) {
    return basePn;
  }
  const mult = basketSidePnDifficultyMultiplier(
    opts.side,
    opts.difficulty,
    opts.proposerOwnerId,
    opts.playerOwnerId ?? 0,
  );
  return Math.max(0, Math.round(basePn * mult));
}

/** Suma PN pozycji w koszyku (null jeśli któraś pozycja nieznana). */
export function diplomacySumPn(
  items: Array<{ typ: WartoscPozycjaTyp; id: string; ilosc?: number; level?: number; tempo?: TempoGry | number }>,
  opts?: DiplomacySumPnOptions,
): number | null {
  let sum = 0;
  for (const item of items) {
    const qty = item.ilosc ?? 1;
    if (qty <= 0 || !Number.isFinite(qty)) continue;
    let pn: number | null = null;
    switch (item.typ) {
      case 'zloto':
        pn = diplomacyPnZloto(qty);
        break;
      case 'praca':
        pn = diplomacyPnPraca(qty);
        break;
      case 'zywnosc':
        pn = diplomacyPnZywnosc(qty);
        break;
      case 'zloze':
        pn = diplomacyPnZloze(item.id);
        break;
      case 'tech':
        pn = diplomacyPnTech(item.id, item.tempo ?? opts?.tempo ?? 'standardowa');
        break;
      case 'jednostka':
        pn = diplomacyPnJednostka(item.id);
        break;
      case 'surowiec_boolean':
        pn = diplomacyPnSurowiecBoolean(item.id);
        break;
      case 'surowiec_ilosc':
        // diplomacyPnSurowiecIlosc już mnoży przez qty (sztuki) — jak zloto/praca/zywnosc.
        pn = diplomacyPnSurowiecIlosc(item.id, qty);
        break;
      default:
        return null;
    }
    if (pn == null) return null;
    const qtyMult =
      item.typ === 'zloto' || item.typ === 'praca' || item.typ === 'zywnosc' || item.typ === 'surowiec_ilosc'
        ? 1
        : qty;
    let linePn = applyBasketSideDifficultyPn(pn * qtyMult, opts);
    const turnsMult = Math.max(1, opts?.turnsMultiplier ?? 1);
    if (opts?.perTurn && turnsMult > 1) {
      const perTurnTyp = item.typ === 'zloto' || item.typ === 'praca' || item.typ === 'zywnosc'
        || item.typ === 'surowiec_ilosc';
      if (perTurnTyp) linePn *= turnsMult;
    }
    sum += linePn;
  }
  return sum;
}

/**
 * Czy deal jest fair @ Rel: partner oczekuje receivePn × (100/Rel) ≤ givePn
 * (lub symetrycznie przy barterze: |give − receive×(100/Rel)| w tolerancji).
 */
export function diplomacyDealFairAtRel(
  givePn: number,
  receivePn: number,
  relacja: number,
  tolerance = 0.2,
): boolean {
  const rel = Math.max(1, relacja);
  const adjustedReceive = receivePn * (100 / rel);
  if (givePn <= 0 && adjustedReceive <= 0) return true;
  const ratio = givePn / Math.max(adjustedReceive, 1);
  return ratio >= 1 - tolerance && ratio <= 1 + tolerance;
}

// ---------------------------------------------------------------------------
// PN → Zaufanie (handel: nadmiar; dar: cała wartość)
// Maciej 2026-06-30: dar głównie W handlu; nadmiar poprawia relacje.
// ---------------------------------------------------------------------------

export type PnRelacjaParams = {
  pn_na_zaufanie?: number;
  max_zaufanie_na_ture?: number;
  min_nadmiar_pn?: number;
  prog_dar_relacja?: number;
  dobra_wola_min_nadmiar_pn?: number;
  dobra_wola_tur?: number;
  dobra_wola_zaufanie_per_tura?: number;
};

const DEFAULT_PROG_DAR_RELACJA = 30;
const DEFAULT_DOBRA_WOLA_MIN_PN = 100;
const DEFAULT_DOBRA_WOLA_TUR = 3;

const DEFAULT_PN_NA_ZAUFANIE = 100;
const DEFAULT_MAX_ZAUFANIE_NA_TURE = 5;
const DEFAULT_MIN_NADMIAR = 1;

type PnRelacjaBlock = PnRelacjaParams & {
  dobra_wola_po_wymianie?: boolean;
  /** @deprecated użyj max_zaufanie_na_ture */
  max_zaufanie_jednorazowo?: number;
};

type PnRelacjaLoaded = Required<PnRelacjaParams>;

function loadPnRelacjaParams(): PnRelacjaLoaded {
  const block = (diplomacyJson as { pn_relacja?: PnRelacjaBlock }).pn_relacja ?? {};
  const maxNaTure =
    typeof block.max_zaufanie_na_ture === 'number' && block.max_zaufanie_na_ture > 0
      ? block.max_zaufanie_na_ture
      : typeof block.max_zaufanie_jednorazowo === 'number' && block.max_zaufanie_jednorazowo > 0
        ? block.max_zaufanie_jednorazowo
        : DEFAULT_MAX_ZAUFANIE_NA_TURE;
  return {
    pn_na_zaufanie:
      typeof block.pn_na_zaufanie === 'number' && block.pn_na_zaufanie > 0
        ? block.pn_na_zaufanie
        : DEFAULT_PN_NA_ZAUFANIE,
    max_zaufanie_na_ture: maxNaTure,
    min_nadmiar_pn:
      typeof block.min_nadmiar_pn === 'number' && block.min_nadmiar_pn >= 0
        ? block.min_nadmiar_pn
        : DEFAULT_MIN_NADMIAR,
    prog_dar_relacja:
      typeof block.prog_dar_relacja === 'number' && block.prog_dar_relacja >= 0
        ? block.prog_dar_relacja
        : DEFAULT_PROG_DAR_RELACJA,
    dobra_wola_min_nadmiar_pn:
      typeof block.dobra_wola_min_nadmiar_pn === 'number' && block.dobra_wola_min_nadmiar_pn > 0
        ? block.dobra_wola_min_nadmiar_pn
        : DEFAULT_DOBRA_WOLA_MIN_PN,
    dobra_wola_tur:
      typeof block.dobra_wola_tur === 'number' && block.dobra_wola_tur > 0
        ? block.dobra_wola_tur
        : DEFAULT_DOBRA_WOLA_TUR,
    dobra_wola_zaufanie_per_tura:
      typeof block.dobra_wola_zaufanie_per_tura === 'number' && block.dobra_wola_zaufanie_per_tura > 0
        ? block.dobra_wola_zaufanie_per_tura
        : 1,
  };
}

const _pnRelacja = loadPnRelacjaParams();

/**
 * Minimalna suma PN, którą oddajesz przy uczciwej wymianie @ Relacji
 * (partner dostaje receivePn — ty musisz dać receivePn × 100/Rel).
 */
export function diplomacyFairGivePn(receivePn: number, relacja: number): number {
  const rel = Math.max(1, relacja);
  return Math.ceil(Math.max(0, receivePn) * (100 / rel));
}

/**
 * Nadmiar PN po Twojej stronie w handlu: max(0, oddajesz − uczciwa wartość).
 * Przy czystym darze: receivePn = 0 → nadmiar = cała wartość oddana.
 */
export function diplomacySurplusPn(
  givePn: number,
  receivePn: number,
  relacja: number,
): number {
  const fair = diplomacyFairGivePn(receivePn, relacja);
  return Math.max(0, givePn - fair);
}

/** Nadmiar PN → surowa zmiana Zaufania (floor); limit na turę stosuje silnik przez diplomacyClampTrustGainNaTure. */
export function diplomacyPnToZaufanieDelta(
  surplusPn: number,
  params: PnRelacjaParams = _pnRelacja,
): number {
  const cfg = { ..._pnRelacja, ...params };
  if (surplusPn < cfg.min_nadmiar_pn) return 0;
  return Math.max(0, Math.floor(surplusPn / cfg.pn_na_zaufanie));
}

/**
 * Limit na turę: handel + dary łącznie nie mogą dać więcej niż max Zaufania.
 * @param alreadyGainedThisTurn ile już dodano w tej turze z PN (handel/dar)
 */
export function diplomacyClampTrustGainNaTure(
  proposedDelta: number,
  alreadyGainedThisTurn: number,
  params: PnRelacjaParams = _pnRelacja,
): number {
  const cfg = { ..._pnRelacja, ...params };
  const room = Math.max(0, cfg.max_zaufanie_na_ture - Math.max(0, alreadyGainedThisTurn));
  return Math.min(Math.max(0, proposedDelta), room);
}

/** Nadmiar PN → ΔZaufanie z uwzględnieniem limitu na turę. */
export function diplomacyTrustFromSurplus(
  surplusPn: number,
  alreadyGainedThisTurn: number,
  params?: PnRelacjaParams,
): { surplusPn: number; deltaZaufanieRaw: number; deltaZaufanie: number } {
  const raw = diplomacyPnToZaufanieDelta(surplusPn, params);
  return {
    surplusPn,
    deltaZaufanieRaw: raw,
    deltaZaufanie: diplomacyClampTrustGainNaTure(raw, alreadyGainedThisTurn, params),
  };
}

/** Handel zakończony: ΔZaufanie z nadmiaru (bonus zawarcia umowy — osobno w silniku). */
export function diplomacyTradeTrustFromDeal(
  givePn: number,
  receivePn: number,
  relacja: number,
  alreadyGainedThisTurn = 0,
  params?: PnRelacjaParams,
): { surplusPn: number; deltaZaufanieRaw: number; deltaZaufanie: number } {
  const surplusPn = diplomacySurplusPn(givePn, receivePn, relacja);
  return diplomacyTrustFromSurplus(surplusPn, alreadyGainedThisTurn, params);
}

/** Czysty dar: cała wartość w PN → Zaufanie (ten sam kurs + limit na turę). */
export function diplomacyGiftTrustFromPn(
  givePn: number,
  alreadyGainedThisTurn = 0,
  params?: PnRelacjaParams,
): { surplusPn: number; deltaZaufanieRaw: number; deltaZaufanie: number } {
  return diplomacyTradeTrustFromDeal(givePn, 0, 100, alreadyGainedThisTurn, params);
}

export function diplomacyPnRelacjaParams(): Readonly<PnRelacjaLoaded> {
  return _pnRelacja;
}

/** D3-W2-C: dobra wola +1/turę × 3 tury gdy nadmiar ≥ 100 PN. */
export function diplomacyDobraWolaFromSurplus(
  surplusPn: number,
  params: PnRelacjaParams = _pnRelacja,
): { active: boolean; tur: number; zaufaniePerTura: number } {
  const cfg = { ..._pnRelacja, ...params };
  if (surplusPn < cfg.dobra_wola_min_nadmiar_pn) {
    return { active: false, tur: 0, zaufaniePerTura: 0 };
  }
  return {
    active: true,
    tur: cfg.dobra_wola_tur,
    zaufaniePerTura: cfg.dobra_wola_zaufanie_per_tura,
  };
}

/** D3-W3-B: minimalna Relacja na czysty dar (skalowana wg trudności). */
export function diplomacyProgDarRelacja(
  params: PnRelacjaParams = _pnRelacja,
  difficulty: GameDifficulty = 'normal',
): number {
  const base = { ..._pnRelacja, ...params }.prog_dar_relacja;
  return scaleRelationThreshold(base, difficulty);
}

/**
 * FAZA 2 (Makieta DYPLOMACJA v1.1, KROK 3 pkt 7) — Zaufanie/turę z AKTYWNEJ umowy
 * handlowej (dostęp do surowców/złóż, trwa dealTurns tur). Ekspozycja dla UI (bilans
 * oferty: „co turę" vs „jednorazowo") — informacyjna, silnik nalicza to osobno w ticku.
 */
export function diplomacyHandelZaufaniePerTura(): number {
  const P = getBaseDiplomacyParams();
  return P.handel_zaufanie_perTura;
}
