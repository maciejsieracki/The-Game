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

/** Podgląd kar za dobrowolne zerwanie traktatu (przycisk „Zerwij"). */
export function previewVoluntaryTreatyBreakPenalties(
  deal: Pick<ActiveDeal, 'rodzaj' | 'wygasaTura'>,
  params: DiplomacyPenaltyParams,
): DiploPenaltyPreview {
  const lines: DiploPenaltyLine[] = [];
  const isTrade = isHandelTreatyKind(deal.rodzaj);

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

  return { lines, ...totals(lines) };
}
