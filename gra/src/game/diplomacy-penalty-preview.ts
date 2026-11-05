/**
 * diplomacy-penalty-preview.ts — podgląd kar Wiarygodności / Zaufania PRZED akcją gracza.
 * PURE (bez mutacji stanu) — do modali „czy na pewno?".
 */
import { RodzajTraktatu } from '../types/diplomacy';
import type { ActiveDeal } from './diplomacy-treaties';
import {
  hasTreaty,
  normalizeTreatyKind,
  treatiesBrokenByWar,
  type TreatyKind,
} from './diplomacy-treaties';

export interface DiplomacyPenaltyParams {
  zlamanaPaktGracz_zaufanie: number;
  wiarygodnoscN1BezOstrzezenia: number;
  wiarygodnoscN2ZlamaniePaktuNap: number;
  wiarygodnoscN2ZlamaniePaktuSojusz: number;
  wiarygodnoscN3AtakWOknieKarencji: number;
  wiarygodnoscN3KarencjaBezterminoweTur: number;
  wiarygodnoscN5ZerwanieTraktatCzasowy: number;
  wiarygodnoscN5ZerwanieHandelCzasowy: number;
}

export interface DiploPenaltyLine {
  kind: 'wiarygodnosc' | 'zaufanie' | 'info';
  delta: number;
  reason: string;
}

export interface DiploPenaltyPreview {
  lines: DiploPenaltyLine[];
  wiarygodnoscTotal: number;
  zaufanieTotal: number;
}

function signed(n: number): string {
  return n > 0 ? `+${n}` : String(n);
}

function pushLine(
  lines: DiploPenaltyLine[],
  kind: DiploPenaltyLine['kind'],
  delta: number,
  reason: string,
): void {
  if (kind === 'info' || delta !== 0) lines.push({ kind, delta, reason });
}

function totals(lines: readonly DiploPenaltyLine[]): Pick<DiploPenaltyPreview, 'wiarygodnoscTotal' | 'zaufanieTotal'> {
  let wiarygodnoscTotal = 0;
  let zaufanieTotal = 0;
  for (const l of lines) {
    if (l.kind === 'wiarygodnosc') wiarygodnoscTotal += l.delta;
    if (l.kind === 'zaufanie') zaufanieTotal += l.delta;
  }
  return { wiarygodnoscTotal, zaufanieTotal };
}

function isAllianceKind(rodzaj: TreatyKind): boolean {
  const k = normalizeTreatyKind(rodzaj);
  return k === 'sojusz_pelny' || k === 'sojusz_defensywny' || k === RodzajTraktatu.SojuszWojskowy;
}

function isHandelTreatyKind(rodzaj: TreatyKind): boolean {
  const k = normalizeTreatyKind(rodzaj);
  return k === RodzajTraktatu.UmowaHandlowa
    || k === RodzajTraktatu.UmowaSzlakow
    || k === RodzajTraktatu.UmowaWymiany;
}

function dealInvolvesOwners(deal: ActiveDeal, a: number, b: number): boolean {
  const p0 = Math.min(a, b);
  const p1 = Math.max(a, b);
  return deal.strony[0] === p0 && deal.strony[1] === p1;
}

/** Krótki opis kar (tooltip w tabeli traktatów). */
export function formatDiploPenaltyShort(p: DiploPenaltyPreview): string {
  const parts: string[] = [];
  if (p.wiarygodnoscTotal !== 0) parts.push(`Wiarygodność ${signed(p.wiarygodnoscTotal)}`);
  if (p.zaufanieTotal !== 0) parts.push(`Zaufanie ${signed(p.zaufanieTotal)}`);
  const info = p.lines.filter(l => l.kind === 'info').map(l => l.reason);
  parts.push(...info);
  return parts.join(' · ') || 'brak kary';
}

/** Podgląd kar za wypowiedzenie wojny (i ewentualny atak w tej samej turze). */
export function previewWarDeclarationPenalties(input: {
  declarerId: number;
  targetId: number;
  activeDeals: readonly ActiveDeal[];
  params: DiplomacyPenaltyParams;
  isRetaliation: boolean;
  /** Atak / marsz w tej samej turze co deklaracja → kara N1. */
  attackSameTurn: boolean;
}): DiploPenaltyPreview {
  const { declarerId, targetId, activeDeals, params, isRetaliation, attackSameTurn } = input;
  const lines: DiploPenaltyLine[] = [];
  const deals = [...activeDeals];

  if (!isRetaliation) {
    const hasAlliance = deals.some(
      d => dealInvolvesOwners(d, declarerId, targetId) && isAllianceKind(d.rodzaj),
    );
    const hasNap = hasTreaty(deals, declarerId, targetId, RodzajTraktatu.PaktNieagresji);
    if (hasAlliance) {
      pushLine(lines, 'wiarygodnosc', params.wiarygodnoscN2ZlamaniePaktuSojusz,
        'zerwanie sojuszu przez wypowiedzenie wojny');
    } else if (hasNap) {
      pushLine(lines, 'wiarygodnosc', params.wiarygodnoscN2ZlamaniePaktuNap,
        'zerwanie paktu o nieagresji przez wypowiedzenie wojny');
    }
  }

  const brokenIds = treatiesBrokenByWar(deals, declarerId, targetId);
  if (brokenIds.length > 0) {
    const hasTrade = deals.some(
      d => brokenIds.includes(d.id) && isHandelTreatyKind(d.rodzaj),
    );
    pushLine(lines, 'zaufanie', params.zlamanaPaktGracz_zaufanie,
      hasTrade
        ? 'zerwanie aktywnej umowy handlowej (w tym cyklicznej) przez wojnę'
        : 'zerwanie aktywnego traktatu przez wojnę');
  }

  // C-WIAR-N1-UX: sama deklaracja z karencją (bez ataku w tej turze) nie obniża Zaufania.
  // Kara N1 (Wiarygodność) dotyczy wyłącznie ataku w tej samej turze co wypowiedzenie.
  if (attackSameTurn && !isRetaliation) {
    pushLine(lines, 'wiarygodnosc', params.wiarygodnoscN1BezOstrzezenia,
      'atak w tej samej turze co wypowiedzenie wojny (bez ostrzeżenia)');
  }

  return { lines, ...totals(lines) };
}

/** Podgląd kar za odmowę obowiązku sojuszu (N4 — modal „Wypełnij sojusz / odmów"). */
export function previewAllianceObligationRefusal(
  wiarygodnoscN4: number,
): DiploPenaltyPreview {
  const lines: DiploPenaltyLine[] = [];
  pushLine(lines, 'wiarygodnosc', wiarygodnoscN4, 'N4: odmowa obowiązku sojuszu');
  pushLine(lines, 'info', 0, 'Sojusz zostanie zerwany');
  return { lines, ...totals(lines) };
}

/**
 * R-WEB-TREATY-TRADE-FREE-BREAK-AFTER-10-Q1 — po ilu turach od zawarcia dobrowolne zerwanie
 * UMOWY HANDLOWEJ jest bez kary (Zaufanie i Wiarygodność; także okno N3/N5). Decyzja właściciela
 * 2026-11-05. Dotyczy wyłącznie traktatów handlowych (isHandelTreatyKind), terminowych i bezterminowych.
 */
export const TRADE_TREATY_BREAK_PENALTY_FREE_AGE_TURNS = 10;

/** Wiek traktatu w turach; undefined gdy nieznany (brak `zawartaTura` w starym zapisie) lub brak tury. */
export function treatyAgeTurns(
  deal: Pick<ActiveDeal, 'zawartaTura'>,
  turn: number | undefined,
): number | undefined {
  if (turn === undefined || deal.zawartaTura === undefined || deal.zawartaTura === null) return undefined;
  return Math.max(0, turn - deal.zawartaTura);
}

/**
 * Czy dobrowolne zerwanie tego traktatu w tej turze jest BEZ KARY. Czysta, niezależna od właściciela
 * (ta sama reguła dla gracza i AI). Wiek nieznany → false (kary jak dziś).
 */
export function tradeTreatyBreakPenaltyFree(
  deal: Pick<ActiveDeal, 'rodzaj' | 'zawartaTura'>,
  turn: number | undefined,
): boolean {
  if (!isHandelTreatyKind(deal.rodzaj)) return false;
  const age = treatyAgeTurns(deal, turn);
  return age !== undefined && age >= TRADE_TREATY_BREAK_PENALTY_FREE_AGE_TURNS;
}

/** Tury pozostałe do końca okresu kary umowy handlowej (1..9); undefined gdy nie dotyczy / wiek nieznany. */
export function tradeTreatyBreakPenaltyTurnsLeft(
  deal: Pick<ActiveDeal, 'rodzaj' | 'zawartaTura'>,
  turn: number | undefined,
): number | undefined {
  if (!isHandelTreatyKind(deal.rodzaj)) return undefined;
  const age = treatyAgeTurns(deal, turn);
  if (age === undefined || age >= TRADE_TREATY_BREAK_PENALTY_FREE_AGE_TURNS) return undefined;
  return TRADE_TREATY_BREAK_PENALTY_FREE_AGE_TURNS - age;
}

/**
 * Plan skutków DOBROWOLNEGO zerwania traktatu (wspólny dla gracza i AI; bez parametru właściciela).
 * `openN3Window` — otwiera okno karencji N3 (traktat bezterminowy, kara). `n5Charged` — nalicza N5
 * (traktat czasowy, kara). Przy `penaltyFree` oba są false: brak okna N3 i brak N5.
 */
export function voluntaryTreatyBreakPlan(
  deal: Pick<ActiveDeal, 'rodzaj' | 'wygasaTura' | 'zawartaTura'>,
  turn: number | undefined,
): { penaltyFree: boolean; openN3Window: boolean; n5Charged: boolean } {
  const penaltyFree = tradeTreatyBreakPenaltyFree(deal, turn);
  return {
    penaltyFree,
    openN3Window: !penaltyFree && deal.wygasaTura === null,
    n5Charged: !penaltyFree && deal.wygasaTura !== null,
  };
}

function turnsPl(n: number): string {
  if (n === 1) return '1 tura';
  if (n >= 2 && n <= 4) return `${n} tury`;
  return `${n} tur`;
}

/**
 * Podgląd kar za dobrowolne zerwanie traktatu (przycisk „Zerwij”).
 * `turn` (opcjonalnie) — bieżąca tura; bez niej wiek traktatu nieznany → kary jak dotąd.
 */
export function previewVoluntaryTreatyBreakPenalties(
  deal: Pick<ActiveDeal, 'rodzaj' | 'wygasaTura' | 'zawartaTura'>,
  params: DiplomacyPenaltyParams,
  turn?: number,
): DiploPenaltyPreview {
  const lines: DiploPenaltyLine[] = [];
  const isTrade = isHandelTreatyKind(deal.rodzaj);

  if (tradeTreatyBreakPenaltyFree(deal, turn)) {
    pushLine(lines, 'info', 0,
      `brak kary — umowa handlowa zawarta ${TRADE_TREATY_BREAK_PENALTY_FREE_AGE_TURNS} tur temu lub wcześniej`);
    return { lines, ...totals(lines) };
  }

  if (deal.wygasaTura === null) {
    pushLine(lines, 'info', 0,
      `brak kary Wiarygodności za samo zerwanie; przez ${params.wiarygodnoscN3KarencjaBezterminoweTur} tur `
      + `atak na tego partnera kosztuje ${signed(params.wiarygodnoscN3AtakWOknieKarencji)} Wiarygodności`);
  } else {
    pushLine(
      lines,
      'wiarygodnosc',
      isTrade ? params.wiarygodnoscN5ZerwanieHandelCzasowy : params.wiarygodnoscN5ZerwanieTraktatCzasowy,
      isTrade ? 'dobrowolne zerwanie umowy handlowej' : 'dobrowolne zerwanie traktatu',
    );
  }

  pushLine(lines, 'zaufanie', isTrade ? -10 : -15,
    isTrade ? 'zerwanie umowy handlowej' : 'zerwanie traktatu');

  const left = tradeTreatyBreakPenaltyTurnsLeft(deal, turn);
  if (left !== undefined) {
    pushLine(lines, 'info', 0, `kara jeszcze ${turnsPl(left)}`);
  }

  return { lines, ...totals(lines) };
}
