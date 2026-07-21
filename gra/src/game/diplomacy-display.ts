/**
 * diplomacy-display.ts — dane prezentacyjne dyplomacji (D3-UX BBBB, lane CYW).
 * UI / SILNIK: tagi charakteru, stosunek Mocy, tooltip Respekt.
 */
import civsRaw from '../../data/civs.json';
import { civMatrixParam, loadCivMatrix } from './civ-matrix';
import type { DiplomacyPerNacjaRow } from './civ-ai-data';
import { diplomacyPerNacjaRow } from './civ-ai-data';
import { computeRespekt } from './diplomacy';

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

/** Czy oba klucze należą do tego samego okręgu kulturowego (typCywilizacji / ikonaId). */
export function sameCultureCircle(
  playerCivKey: string | null | undefined,
  otherCivKey: string | null | undefined,
): boolean {
  if (!playerCivKey?.trim() || !otherCivKey?.trim()) return false;
  return civKeyNorm(playerCivKey) === civKeyNorm(otherCivKey);
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
