/**
 * diplomacy-display.ts — dane prezentacyjne dyplomacji (D3-UX BBBB, lane CYW).
 * UI / SILNIK: tagi charakteru, stosunek Mocy, tooltip Respekt.
 */
import civsRaw from '../../data/civs.json';
import { civMatrixParam, loadCivMatrix } from './civ-matrix';
import type { DiplomacyPerNacjaRow } from './civ-ai-data';
import { diplomacyPerNacjaRow } from './civ-ai-data';
import { computeRespekt } from './diplomacy';
import { RodzajTraktatu } from '../types/diplomacy';
import type { ActiveDeal, TreatyKind } from './diplomacy-treaties';
import { normalizeTreatyKind } from './diplomacy-treaties';
import type { BasketItem } from './diplomacy-pn-engine';
import type { ProposalPayload } from './diplomacy-proposals';
import { diplomacyHandelSurowcePakietWielkosc } from './diplomacy-value-catalog';

const MATRIX = loadCivMatrix();

const RESPEKT_TOOLTIP_PL =
  'Respekt pokazuje, jak duża jest wasza Moc w porównaniu z tą nacją. ' +
  '50 = równi. Wyżej = jesteś silniejszy.';

interface TagRule {
  paramId: string;
  perNacjaKey?: keyof DiplomacyPerNacjaRow;
  scale: '1_10' | '0_1';
  highLabel: string;
  lowLabel: string;
  highAt: number;
  lowAt: number;
}

const TAG_RULES: readonly TagRule[] = [
  {
    paramId: 'dip_otwartosc_handel',
    perNacjaKey: 'otwartoscHandel',
    scale: '1_10',
    highLabel: 'Handlowy',
    lowLabel: 'Izolacjonista',
    highAt: 7,
    lowAt: 3,
  },
  {
    paramId: 'dip_sklonnosc_sojusze',
    perNacjaKey: 'sklonnoscSojusze',
    scale: '1_10',
    highLabel: 'Sojuszniczy',
    lowLabel: 'Samotny wilk',
    highAt: 7,
    lowAt: 3,
  },
  {
    paramId: 'dip_lojalnosc',
    perNacjaKey: 'lojalnosc',
    scale: '1_10',
    highLabel: 'Lojalny',
    lowLabel: 'Zdradziecki',
    highAt: 7,
    lowAt: 3,
  },
  {
    paramId: 'dip_prog_wojny',
    perNacjaKey: 'progWojny',
    scale: '1_10',
    highLabel: 'Wojowniczy',
    lowLabel: 'Ostrożny',
    highAt: 7,
    lowAt: 3,
  },
  {
    paramId: 'dip_pamietliwosc',
    perNacjaKey: 'pamietliwosc',
    scale: '1_10',
    highLabel: 'Pamiętliwy',
    lowLabel: 'Wybaczający',
    highAt: 7,
    lowAt: 3,
  },
];

function civKeyNorm(civKey: string): string {
  return civKey.trim().toLowerCase();
}

function matrixHasCiv(civKey: string): boolean {
  const key = civKeyNorm(civKey);
  return MATRIX.cywilizacje.some(c =>
    c.ikonaId.toLowerCase() === key ||
    c.typCywilizacji.toLowerCase() === key ||
    c.Cywilizacja.toLowerCase() === key,
  );
}

function perNacjaByCivKey(civKey: string): DiplomacyPerNacjaRow | undefined {
  const key = civKeyNorm(civKey);
  const civ = civsRaw.cywilizacje.find(c =>
    String(c.ikonaId ?? '').toLowerCase() === key ||
    String(c.typCywilizacji ?? '').toLowerCase() === key ||
    String(c.Cywilizacja ?? '').toLowerCase() === key,
  );
  if (!civ?.Cywilizacja) return undefined;
  return diplomacyPerNacjaRow(civ.Cywilizacja);
}

function dipScalar(civKey: string, rule: TagRule): number {
  if (matrixHasCiv(civKey)) {
    return civMatrixParam(civKey, rule.paramId);
  }
  const pn = perNacjaByCivKey(civKey);
  if (rule.perNacjaKey && pn) {
    const v = pn[rule.perNacjaKey];
    if (typeof v === 'number') {
      return rule.scale === '0_1' ? v : v;
    }
  }
  return MATRIX.defaults[rule.paramId] ?? (rule.scale === '0_1' ? 0.5 : 5);
}

function tagCandidates(civKey: string): { label: string; weight: number }[] {
  const out: { label: string; weight: number }[] = [];
  for (const rule of TAG_RULES) {
    const v = dipScalar(civKey, rule);
    const mid = rule.scale === '0_1' ? 0.5 : 5;
    if (v >= rule.highAt) {
      out.push({ label: rule.highLabel, weight: Math.abs(v - mid) });
    } else if (v <= rule.lowAt) {
      out.push({ label: rule.lowLabel, weight: Math.abs(v - mid) });
    }
  }
  out.sort((a, b) => b.weight - a.weight);
  return out;
}

/**
 * Tagi charakteru nacji (D3-UX-3B) — max 3, bez liczb z Excela.
 * @param civKey ikonaId / typCywilizacji / nazwa PL z civs.json
 */
export function diplomacyPersonalityTags(civKey: string, maxTags = 3): string[] {
  if (!civKey.trim()) return [];
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const c of tagCandidates(civKey)) {
    if (seen.has(c.label)) continue;
    seen.add(c.label);
    tags.push(c.label);
    if (tags.length >= maxTags) break;
  }
  return tags;
}

/** typCywilizacji / ikonaId → etykieta okręgu kulturowego (przymiotnik PL, jak w units.json). */
const CIV_KEY_TO_CULTURE_LABEL: Readonly<Record<string, string>> = {
  grecy: 'Grecka',
  rzymianie: 'Rzymska',
  chinczycy: 'Chińska',
  inkowie: 'Inkańska',
  zulusi: 'Zuluska',
  egipt: 'Egipska',
  sumer: 'Sumeryjska',
  sumerowie: 'Sumeryjska',
  babilon: 'Sumeryjska',
  celtowie: 'Celtycka',
  germanie: 'Germańska',
  harappa: 'Harappańska',
  hetyci: 'Chetycka',
  slowianie: 'Słowiańska',
  babilonia: 'Babilońska',
  asyria: 'Asyryjska',
  fenicjanie: 'Fenicka',
};

/** Etykieta kultury państwa (np. „Grecka", „Chetycka") — bez prefiksu „Kultura:". */
export function civCultureLabelForKey(civKey: string | null | undefined): string | undefined {
  if (!civKey?.trim()) return undefined;
  const key = civKeyNorm(civKey);
  const direct = CIV_KEY_TO_CULTURE_LABEL[key];
  if (direct) return direct;
  const civ = civsRaw.cywilizacje.find(c =>
    String(c.ikonaId ?? '').toLowerCase() === key ||
    String(c.typCywilizacji ?? '').toLowerCase() === key ||
    String(c.Cywilizacja ?? '').toLowerCase() === key,
  );
  const name = civ?.Cywilizacja;
  if (typeof name !== 'string' || !name.trim()) return undefined;
  return CIV_KEY_TO_CULTURE_LABEL[String(civ?.typCywilizacji ?? civ?.ikonaId ?? '').toLowerCase()] ?? name;
}

/** typCywilizacji (okręg kulturowy) — np. ateny i sparta → „grecy”. */
function civTypCywilizacjiKey(civKey: string): string {
  const key = civKeyNorm(civKey);
  const civ = civsRaw.cywilizacje.find(c =>
    String(c.ikonaId ?? '').toLowerCase() === key ||
    String(c.typCywilizacji ?? '').toLowerCase() === key ||
    String(c.Cywilizacja ?? '').toLowerCase() === key,
  );
  const typ = civ?.typCywilizacji;
  if (typeof typ === 'string' && typ.trim()) return typ.trim().toLowerCase();
  return key;
}

/** Czy oba klucze należą do tego samego okręgu kulturowego (typCywilizacji). */
export function sameCultureCircle(
  playerCivKey: string | null | undefined,
  otherCivKey: string | null | undefined,
): boolean {
  if (!playerCivKey?.trim() || !otherCivKey?.trim()) return false;
  return civTypCywilizacjiKey(playerCivKey) === civTypCywilizacjiKey(otherCivKey);
}

/** Tooltip PL dla paska Respekt (D3-UX-4B). */
export function respektTooltipPl(): string {
  return RESPEKT_TOOLTIP_PL;
}

/** Formalny stan umów między państwami (odrębny od nastawienia / score). */
export type FormalDiplomaticKind = 'wojna' | 'sojusz' | 'pakt' | 'handel' | 'pokoj' | 'brak';

export interface FormalDiplomaticStatus {
  label: string;
  kind: FormalDiplomaticKind;
}

export interface FormalDiplomaticInput {
  relationStatus: 'wojna' | 'pokoj' | 'sojusz' | 'neutralni';
  hasAlliance: boolean;
  hasNap: boolean;
  hasTrade: boolean;
  contactEstablished: boolean;
}

/**
 * Jeden jawny stan formalny — priorytet: wojna > sojusz > pakt > handel > pokój > brak kontaktu.
 * Etykiety PL dla gracza; bez mieszania z nastawieniem (score).
 */
export function resolveFormalDiplomaticStatus(input: FormalDiplomaticInput): FormalDiplomaticStatus {
  if (input.relationStatus === 'wojna') {
    return { label: 'Wojna', kind: 'wojna' };
  }
  if (input.hasAlliance || input.relationStatus === 'sojusz') {
    return { label: 'Sojusz wojskowy', kind: 'sojusz' };
  }
  if (input.hasNap) {
    return { label: 'Pakt o nieagresji', kind: 'pakt' };
  }
  if (input.hasTrade) {
    return { label: 'Umowa handlowa', kind: 'handel' };
  }
  if (input.contactEstablished) {
    return { label: 'Pokój', kind: 'pokoj' };
  }
  return { label: 'Brak kontaktu', kind: 'brak' };
}

/** Nastawienie (score zaufania+respektu) — niezależne od formalnej wojny/traktatu. */
export function nastawienieLabelFromScore(zaufanie: number, respekt: number): string {
  const s = Math.max(0, Math.min(200, Math.round(zaufanie + respekt)));
  if (s < 30) return 'Wrogi';
  if (s < 45) return 'Nieufny';
  if (s < 60) return 'Neutralny';
  if (s < 120) return 'Życzliwy';
  return 'Przyjazny';
}

/** Krótki podpis pod etykietą nastawienia w audiencji. */
export function nastawienieHintPl(): string {
  return 'Ocena relacji i zachowania — niezależna od formalnej wojny i traktatów.';
}

/** Etykieta PL aktywnego traktatu (lista dyplomacji, audiencja, banner). */
export function treatyDisplayLabel(rodzaj: TreatyKind): string {
  const k = normalizeTreatyKind(rodzaj);
  switch (k) {
    case RodzajTraktatu.PaktNieagresji: return 'Pakt nieagresji';
    case 'sojusz_defensywny': return 'Sojusz defensywny';
    case 'sojusz_pelny': return 'Sojusz pełny';
    case RodzajTraktatu.UmowaHandlowa: return 'Umowa handlowa';
    case RodzajTraktatu.OtwartGranice: return 'Otwarte granice';
    case RodzajTraktatu.PrawoWojskowePrzemarszu: return 'Prawo przemarszu wojskowego';
    case RodzajTraktatu.Wasalizacja: return 'Wasalizacja';
    case RodzajTraktatu.Rozejm: return 'Rozejm';
    default: return String(k);
  }
}

function canonicalOwnerPair(a: number, b: number): [number, number] {
  return a < b ? [a, b] : [b, a];
}

/** Aktywne traktaty między dwoma ownerId — etykiety PL do chipów na liście dyplomacji. */
export function activeTreatyLabelsForPair(
  deals: readonly ActiveDeal[],
  ownerA: number,
  ownerB: number,
): string[] {
  const [p0, p1] = canonicalOwnerPair(ownerA, ownerB);
  return deals
    .filter(d => d.strony[0] === p0 && d.strony[1] === p1)
    .map(d => treatyDisplayLabel(d.rodzaj));
}

/**
 * Etykieta stosunku Mocy z perspektywy self (D3-UX-4B).
 * Np. 4020 vs 1980 → "2:1".
 */
export function formatPowerRatioLabel(selfPower: number, otherPower: number): string {
  const self = Math.max(0, Math.round(selfPower));
  const other = Math.max(0, Math.round(otherPower));
  if (self === 0 && other === 0) return '1:1';
  if (other === 0) return self > 0 ? '—' : '1:1';
  const ratio = self / other;
  if (ratio >= 10) return `${Math.round(ratio)}:1`;
  if (ratio >= 1) {
    const r = Math.round(ratio * 10) / 10;
    return Number.isInteger(r) ? `${r}:1` : `${r.toFixed(1)}:1`;
  }
  const inv = other / Math.max(self, 1);
  if (inv >= 10) return `1:${Math.round(inv)}`;
  const ri = Math.round(inv * 10) / 10;
  return Number.isInteger(ri) ? `1:${ri}` : `1:${ri.toFixed(1)}`;
}

/** Jedna linia Moc + stosunek + Respekt (D3-UX-4B). */
export function formatPowerRelationLine(
  selfPower: number,
  otherPower: number,
): { ratioLabel: string; respekt: number } {
  return {
    ratioLabel: formatPowerRatioLabel(selfPower, otherPower),
    respekt: computeRespekt(selfPower, otherPower),
  };
}

/** Krótka etykieta jednej pozycji koszyka PN (UI + podsumowania stołu negocjacji). */
export function formatBasketItemBrief(item: BasketItem): string {
  switch (item.typ) {
    case 'zloto':
      return `${item.ilosc ?? 0} ¤`;
    case 'praca':
      return `${item.ilosc ?? 0} pracy`;
    case 'zywnosc':
      return `${item.ilosc ?? 0} żywności`;
    case 'zloze':
      return `dostęp do złoża: ${item.id}`;
    case 'tech':
      return `technologia: ${item.id}`;
    case 'jednostka':
      return `jednostka: ${item.id}`;
    case 'surowiec_boolean':
      return `dostęp do surowca: ${item.id}`;
    case 'surowiec_ilosc': {
      const pakiet = diplomacyHandelSurowcePakietWielkosc();
      const pakiety = item.ilosc ?? 1;
      return `${item.id} ×${pakiety * pakiet} (${pakiety} pak.)`;
    }
    default:
      return item.id ?? item.typ;
  }
}

export function formatBasketListBrief(items: readonly BasketItem[] | undefined): string {
  if (!items?.length) return '—';
  return items.map(formatBasketItemBrief).join(' · ');
}

/** Dane wejściowe do podsumowania gracza na liście dyplomacji (tylko realne pola stanu). */
export interface DiploPlayerSummaryInput {
  militaryPower: number;
  powerRank?: { rank: number; total: number };
  /** Wiarygodność cywilizacji (0–100) — stat imperium, nie per-para. */
  wiarygodnosc?: number;
  population?: number;
  armyCount?: number;
}

/** Linie statystyk gracza — spójne z kartami obcych cywilizacji (detail + meta). */
export function formatDiploPlayerSummaryLines(input: DiploPlayerSummaryInput): {
  detailLine: string;
  metaLine: string;
} {
  const detailParts: string[] = [
    `Moc: ${Math.round(Math.max(0, input.militaryPower))}`,
  ];
  if (input.powerRank && input.powerRank.total > 0) {
    detailParts.push(`Ranking mocy: ${input.powerRank.rank}. z ${input.powerRank.total}`);
  }
  if (input.population !== undefined) {
    detailParts.push(`Ludność: ${Math.floor(input.population)}`);
  }
  if (input.armyCount !== undefined) {
    detailParts.push(`Armia: ${input.armyCount}`);
  }
  const metaParts: string[] = [];
  if (input.wiarygodnosc !== undefined) {
    metaParts.push(`Wiarygodność: ${Math.round(Math.max(0, Math.min(100, input.wiarygodnosc)))}`);
  }
  return {
    detailLine: detailParts.join(' · '),
    metaLine: metaParts.join(' · '),
  };
}

/** Dane wejściowe do karty obcej cywilizacji na liście dyplomacji. */
export interface DiploCivListEntryInput {
  cultureLabel?: string;
  epochLabel?: string;
  /** Ich strona — jak oni nas widzą (demografia + ich respekt wobec gracza). */
  theirPopulation?: number;
  theirArmyCount?: number;
  theirRespektTowardPlayer?: number;
  /** Nasza strona — jak my ich widzimy. */
  ourRespektTowardThem?: number;
  zaufanie?: number;
  relationTierLabel?: string;
}

/** Linie karty obcej cywilizacji — kultura/epoka + dwie kropkowane sekcje statystyk. */
export function formatDiploCivListLines(input: DiploCivListEntryInput): {
  metaLine: string;
  detailLine: string;
  perspectiveLine: string;
} {
  const subtitleParts: string[] = [];
  if (input.cultureLabel) subtitleParts.push(input.cultureLabel);
  if (input.epochLabel) subtitleParts.push(input.epochLabel);

  const theirParts: string[] = [];
  if (input.theirPopulation !== undefined) {
    theirParts.push(`Ludność: ${Math.floor(input.theirPopulation)}`);
  }
  if (input.theirArmyCount !== undefined) {
    theirParts.push(`Armia: ${input.theirArmyCount}`);
  }
  if (input.theirRespektTowardPlayer !== undefined) {
    theirParts.push(`Ich respekt: ${Math.round(input.theirRespektTowardPlayer)}`);
  }

  const ourParts: string[] = [];
  if (input.ourRespektTowardThem !== undefined) {
    ourParts.push(`Nasz respekt: ${Math.round(input.ourRespektTowardThem)}`);
  }
  if (input.zaufanie !== undefined) {
    ourParts.push(`Zaufanie: ${Math.round(input.zaufanie)}`);
  }
  if (input.relationTierLabel) {
    ourParts.push(`Relacja: ${input.relationTierLabel}`);
  }

  return {
    metaLine: subtitleParts.join(' · '),
    detailLine: theirParts.join(' · '),
    perspectiveLine: ourParts.join(' · '),
  };
}

/**
 * Czytelne podsumowanie warunków na stole — perspektywa gracza (incoming) lub
 * proponenta (własna propozycja gracza).
 */
export function formatNegotiationDealSummary(
  payload: ProposalPayload,
  opts: { fromPlayerPerspective?: boolean } = {},
): string {
  const give = payload.giveItems ?? [];
  const receive = payload.receiveItems ?? [];
  if (give.length > 0 || receive.length > 0) {
    const parts: string[] = [];
    if (opts.fromPlayerPerspective) {
      parts.push(`Oni dają: ${formatBasketListBrief(give)}`);
      parts.push(`Oni chcą: ${formatBasketListBrief(receive)}`);
    } else {
      parts.push(`Ty dajesz: ${formatBasketListBrief(give)}`);
      parts.push(`Ty dostajesz: ${formatBasketListBrief(receive)}`);
    }
    if (payload.turns != null && payload.turns > 0) {
      const mode = payload.resourceTradeMode === 'per_turn' ? 'co turę' : 'umowa';
      parts.push(`${mode}: ${payload.turns} tur`);
    }
    return parts.join(' · ');
  }
  if (payload.isGift && (payload.givePn ?? 0) > 0) {
    return `Dar: ${payload.givePn} PN`;
  }
  if (payload.goldOnce) return `Jednorazowo: ${payload.goldOnce} ¤`;
  if (payload.goldPerTurn) return `Co turę: ${payload.goldPerTurn} ¤`;
  return '';
}
