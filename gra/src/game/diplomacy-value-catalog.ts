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
import { scaleRelationThreshold, DIPLOMACY_PARAMS } from './diplomacy';
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
// PN pozycji = cena_PN/szt. × ilość sztuk (pakiety × pakiet_wielkosc).
// ---------------------------------------------------------------------------

type RawHandelSurowceRow = Record<string, number | string | undefined>;

interface RawEconParamsJsonHandelSurowce {
  handel_surowce?: Record<string, RawHandelSurowceRow>;
}

const _handelSurowce = (econParamsJson as RawEconParamsJsonHandelSurowce).handel_surowce ?? {};

/**
 * Klucz ASCII surowca (cities.ts City.surowce) → klucz wiersza cennika w econ-params.json.
 * Maciej 2026-07-29: wycena za 1 szt. (PN/szt.); PN pozycji = cena × ilość sztuk
 * (pakiety × pakiet_wielkosc gdy koszyk liczy w pakietach).
 */
const HANDEL_SUROWCE_CENA_ROW: Readonly<Record<string, string>> = {
  drewno: 'cena_drewno',
  glina: 'cena_glina',
  kamien: 'cena_kamien',
  ruda: 'cena_ruda',
  ruda_zelaza: 'cena_ruda_zelaza',
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

/** Wielkość pakietu handlu ilościowego (econ-params.json handel_surowce.pakiet_wielkosc). */
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
 * PN pozycji koszyka surowiec_ilosc = pakiety × pakiet_wielkosc × cena_PN/szt.
 * `pakietyQty` = liczba pakietów (nie sztuk) — spójne z polem `ilosc` w BasketItem.
 * Efekt: PN/szt. × łączna liczba sztuk w pozycji.
 */
export function diplomacyPnSurowiecIlosc(surowiecKey: string, pakietyQty: number): number | null {
  const cena = diplomacyHandelSurowiecCenaJednostkowa(surowiecKey);
  if (cena == null) return null;
  const pakiety = Math.floor(pakietyQty);
  if (!Number.isFinite(pakiety) || pakiety <= 0) return 0;
  const pakiet = diplomacyHandelSurowcePakietWielkosc();
  return Math.max(0, Math.round(pakiety * pakiet * cena));
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
  /** Gdy true + turnsMultiplier>1 — mnoży PN pozycji ilościowych (¤/Praca/żywność/pakiety). */
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
        // diplomacyPnSurowiecIlosc już mnoży przez qty (pakiety) — jak zloto/praca/zywnosc.
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
  /**
   * WIARYGODNOSC-SPECYFIKACJA.md §5 Dźwignia 2 (decyzja właściciela WIAR-9.5b=B,
   * 2026-07-26): NIE budujemy nowego sufitu Zaufania — Wiarygodność CYWILIZACJI
   * (globalna, sprawcy DARU/nadwyżki handlowej — proposerId) obniża TEN limit
   * zamiast go zastępować. Reputacja dodatnia (W>=0, pasma "Uczciwy"/"Wzór
   * cnoty") NIE zmienia limitu — zostaje `max_zaufanie_na_ture` (dzisiejsze 5) —
   * kara dotyczy WYŁĄCZNIE złej reputacji, nigdy nagrody za dobrą (wprost wg
   * zlecenia). Cztery pasma limitu (pkt Zaufania/turę):
   *   W ∈ [0,100]                                          → max_zaufanie_na_ture (bez zmian, dziś 5)
   *   W ∈ (DIPLOMACY_PARAMS.wiarygodnoscProgWiarolomny, 0)  → wiarygodnosc_limit_zaufanie_chwiejny
   *   W ∈ (wiarygodnosc_limit_prog_dno, DIPLOMACY_PARAMS.wiarygodnoscProgWiarolomny] → wiarygodnosc_limit_zaufanie_wiarolomny
   *   W ∈ [-100, wiarygodnosc_limit_prog_dno]              → wiarygodnosc_limit_zaufanie_dno
   * Granica "Chwiejny/Wiarołomny" reużywa `DIPLOMACY_PARAMS.wiarygodnoscProgWiarolomny`
   * (§1, próg pasma "Wiarołomny", dziś -40) — jedna definicja granicy pasm, nie
   * duplikat; TYLKO dolny próg "dna" (wiarygodnosc_limit_prog_dno) jest nowym,
   * osobnym parametrem tej dźwigni.
   */
  wiarygodnosc_limit_zaufanie_chwiejny?: number;
  wiarygodnosc_limit_zaufanie_wiarolomny?: number;
  wiarygodnosc_limit_zaufanie_dno?: number;
  wiarygodnosc_limit_prog_dno?: number;
};

const DEFAULT_PROG_DAR_RELACJA = 30;
const DEFAULT_DOBRA_WOLA_MIN_PN = 100;
const DEFAULT_DOBRA_WOLA_TUR = 3;

const DEFAULT_PN_NA_ZAUFANIE = 100;
const DEFAULT_MAX_ZAUFANIE_NA_TURE = 5;
const DEFAULT_MIN_NADMIAR = 1;

/** Dźwignia 2 (§5, WIAR-9.5b=B) — siatka domyślna, patrz komentarz `PnRelacjaParams` wyżej. */
const DEFAULT_WIARYGODNOSC_LIMIT_CHWIEJNY = 3;
const DEFAULT_WIARYGODNOSC_LIMIT_WIAROLOMNY = 1;
const DEFAULT_WIARYGODNOSC_LIMIT_DNO = 0;
const DEFAULT_WIARYGODNOSC_LIMIT_PROG_DNO = -70;

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
    wiarygodnosc_limit_zaufanie_chwiejny:
      typeof block.wiarygodnosc_limit_zaufanie_chwiejny === 'number' && block.wiarygodnosc_limit_zaufanie_chwiejny >= 0
        ? block.wiarygodnosc_limit_zaufanie_chwiejny
        : DEFAULT_WIARYGODNOSC_LIMIT_CHWIEJNY,
    wiarygodnosc_limit_zaufanie_wiarolomny:
      typeof block.wiarygodnosc_limit_zaufanie_wiarolomny === 'number' && block.wiarygodnosc_limit_zaufanie_wiarolomny >= 0
        ? block.wiarygodnosc_limit_zaufanie_wiarolomny
        : DEFAULT_WIARYGODNOSC_LIMIT_WIAROLOMNY,
    wiarygodnosc_limit_zaufanie_dno:
      typeof block.wiarygodnosc_limit_zaufanie_dno === 'number' && block.wiarygodnosc_limit_zaufanie_dno >= 0
        ? block.wiarygodnosc_limit_zaufanie_dno
        : DEFAULT_WIARYGODNOSC_LIMIT_DNO,
    wiarygodnosc_limit_prog_dno:
      typeof block.wiarygodnosc_limit_prog_dno === 'number'
        ? block.wiarygodnosc_limit_prog_dno
        : DEFAULT_WIARYGODNOSC_LIMIT_PROG_DNO,
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
 * Dźwignia 2 (WIARYGODNOSC-SPECYFIKACJA.md §5, decyzja WIAR-9.5b=B) — limit
 * Zaufania kupowalnego darem/nadwyżką handlową NA TURĘ, w funkcji Wiarygodności
 * SPRAWCY daru/handlu (proposerId — ten, kto usiłuje "kupić" Zaufanie, nie
 * odbiorca). Nie budujemy nowego sufitu: to WYŁĄCZNIE modyfikacja istniejącego
 * `max_zaufanie_na_ture` — reputacja dodatnia (W>=0) NIE zmienia niczego
 * (zostaje dzisiejsze 5/turę), zła reputacja zawęża okno kupowania Zaufania:
 *
 *   W ∈ [0, 100]                                        → max_zaufanie_na_ture (bez zmian)
 *   W ∈ (wiarygodnoscProgWiarolomny, 0)                 → wiarygodnosc_limit_zaufanie_chwiejny
 *   W ∈ (wiarygodnosc_limit_prog_dno, wiarygodnoscProgWiarolomny] → wiarygodnosc_limit_zaufanie_wiarolomny
 *   W ∈ [-100, wiarygodnosc_limit_prog_dno]             → wiarygodnosc_limit_zaufanie_dno
 *
 * Klamruje W wejściowe do −100…+100 (§4 pkt 10 specyfikacji — obowiązkowe
 * wszędzie, gdzie W wchodzi do wzoru). Czysta funkcja — `ownerId` nie wchodzi
 * w żadnej postaci (parytet); wywołujący (main.ts) dobiera Wiarygodność
 * właściwego ownera (proposerId) przed wywołaniem.
 */
export function diplomacyMaxZaufanieNaTureForWiarygodnosc(
  wiarygodnoscProposera: number,
  params: PnRelacjaParams = _pnRelacja,
): number {
  const cfg = { ..._pnRelacja, ...params };
  const w = Math.min(100, Math.max(-100, wiarygodnoscProposera));
  if (w >= 0) return cfg.max_zaufanie_na_ture;
  if (w > DIPLOMACY_PARAMS.wiarygodnoscProgWiarolomny) return cfg.wiarygodnosc_limit_zaufanie_chwiejny;
  if (w > cfg.wiarygodnosc_limit_prog_dno) return cfg.wiarygodnosc_limit_zaufanie_wiarolomny;
  return cfg.wiarygodnosc_limit_zaufanie_dno;
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
  return DIPLOMACY_PARAMS.handel_zaufanie_perTura;
}
