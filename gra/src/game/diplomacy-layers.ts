/**
 * diplomacy-layers.ts — warstwy dyplomacji D-START-2B / 3A.
 * Uproszczona (klaster, ten sam typ): pokój, wojna, handel.
 * Pełna: istniejący model diplomacy.ts (obcy typ po kontakcie).
 */

import type { AIDiplomacyCommand } from './ai';
import { DIPLOMACY_PARAMS, type Relation } from './diplomacy';

export type DiplomacyLayer = 'simplified' | 'full' | 'pre_contact';

const SIMPLIFIED_CMD = new Set<string>([
  'wypowiedz_wojne',
  'zaproponuj_pokoj',
  'zaproponuj_handel',
]);

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function hexKey(q: number, r: number): string {
  return `${q},${r}`;
}

/** Relacja startowa gracz ↔ AI (z modyfikatorem typu). */
export function startRelationForPair(sameType: boolean): Relation {
  const p = DIPLOMACY_PARAMS;
  let zaufanie = p.startZaufanie;
  if (sameType) {
    zaufanie += p.rywalizacjaTenSamTyp_zaufanie;
  } else {
    zaufanie += p.roznicaKulturowa_zaufanie;
  }
  return {
    zaufanie: clamp(zaufanie, 0, 100),
    respekt: p.startRespekt,
    status: 'neutralni',
  };
}

/**
 * D-MP-DYPL Q1 (Maciej 2026-07-21, C-MP-DYPL-Q1=B, część 1): korekta startowego
 * zaufania miast-panstw (isSameTypeRival — kopie typu gracza, `simplifiedDiplomacyOwners`)
 * wg poziomu trudnosci gry. WYLACZNIE miasta-panstwa — NIE dotyka relacji z glownymi
 * cywilizacjami obcego typu (te zostaja na globalnym startRelationForPair(false),
 * niezmienione, zeby nie ruszyc balansu glownych cyw).
 *
 * Wyzsza trudnosc = mniej zaufania (miasta-panstwa bardziej nieufne wobec gracza).
 * Status pozostaje 'neutralni' — to nastawienie startowe, nie wojna od tury 1.
 *
 * WARIANT B (Maciej 2026-07-21, po recon podlogi skali): baza miasta-panstwa
 * (startRelationForPair(true) = startZaufanie(20) + rywalizacjaTenSamTyp_zaufanie(-20) = 0)
 * jest juz na dole skali 0-100 -- delta ujemna na hard bylaby wchlaniana przez clamp i
 * nieodrozniablna od normal. Zamiast tego skala PRZESUNIETA W GORE: hard=0 (dzisiejsze
 * zero -- zero regresji na trudnym, najbardziej nieufne), normal=+5 (lekko cieplej),
 * easy=+10 (najcieplej) -- monotonicznie "wyzsza trudnosc = mniej zaufania", i hard ma
 * realny, widoczny sens (nie jest identyczny z normal).
 *
 * Liczby (zaakceptowane przez wlasciciela): easy +10 / normal +5 / hard 0 (skala 0-100).
 */
export const CITY_STATE_TRUST_DELTA_BY_DIFFICULTY: Record<'easy' | 'normal' | 'hard', number> = {
  easy: 10,
  normal: 5,
  hard: 0,
};

/** Stosuje korektę zaufania miast-panstw wg trudności do relacji startowej. */
export function applyCityStateDifficultyTrust(
  base: Relation,
  difficulty: 'easy' | 'normal' | 'hard',
): Relation {
  const delta = CITY_STATE_TRUST_DELTA_BY_DIFFICULTY[difficulty];
  if (delta === 0) return base;
  return { ...base, zaufanie: clamp(base.zaufanie + delta, 0, 100) };
}

/** Domyślna relacja neutralna (lazy init bez kontekstu typu). */
export function defaultNeutralRelation(): Relation {
  const p = DIPLOMACY_PARAMS;
  return {
    zaufanie: p.startZaufanie,
    respekt: p.startRespekt,
    status: 'neutralni',
  };
}

/**
 * D-START-3A: odkrycie na mapie = heks miasta AI lub jednostki AI w bieżącym
 * zasięgu widzenia (visible — NIE explored). Explored utrzymywał fałszywe kontakty:
 * miasto znika z renderu poza zasięgiem, ale hex zostaje w explored → wpis w dyplomacji.
 */
export function computeDiplomaticContacts(
  visible: ReadonlySet<string>,
  cities: ReadonlyArray<{ ownerId: number; q: number; r: number }>,
  units: ReadonlyArray<{ ownerId: number; q: number; r: number }>,
  playerOwnerId = 0,
): Set<number> {
  const contacted = new Set<number>();
  for (const c of cities) {
    if (c.ownerId === playerOwnerId) continue;
    if (visible.has(hexKey(c.q, c.r))) contacted.add(c.ownerId);
  }
  for (const u of units) {
    if (u.ownerId === playerOwnerId) continue;
    if (visible.has(hexKey(u.q, u.r))) contacted.add(u.ownerId);
  }
  return contacted;
}

/** Backward-compatible overload (testy / stare wywołania). */
export function diplomacyLayerForOwner(
  ownerId: number,
  simplifiedOwners: ReadonlySet<number>,
  foreignTypeOwners?: ReadonlySet<number>,
  contactedOwners?: ReadonlySet<number>,
): DiplomacyLayer {
  if (foreignTypeOwners === undefined || contactedOwners === undefined) {
    return simplifiedOwners.has(ownerId) ? 'simplified' : 'full';
  }
  // D3-Q2 (Maciej 2026-07-21): brak odkrycia w mgle → brak dyplomacji AI/UI.
  // Dotyczy WSZYSTKICH ownerów, w tym miast-panstw (simplifiedOwners) — wcześniej
  // omijały bramkę i wysyłały zaproponuj_handel bez kontaktu z graczem.
  if (!contactedOwners.has(ownerId)) {
    return 'pre_contact';
  }
  if (simplifiedOwners.has(ownerId)) return 'simplified';
  return 'full';
}

/** Filtruje komendy AI — uproszczony tryb bez sojuszu/trybutu; brak akcji przed kontaktem. */
export function filterDiplomacyCommandsForLayer(
  cmds: AIDiplomacyCommand[] | null | undefined,
  layer: DiplomacyLayer,
): AIDiplomacyCommand[] {
  const list = cmds ?? [];
  if (layer === 'pre_contact') return [];
  if (layer === 'full') return list;
  return list.filter(c => SIMPLIFIED_CMD.has(c.type));
}

const ESTABLISHED_CONTACT_CMDS = new Set<string>([
  'zaproponuj_pokoj',
  'zaproponuj_sojusz',
  'zaproponuj_handel',
  'zaproponuj_umowe_handlowa',
  'zadaj_trybut',
  'oferuj_trybut_za_pokoj',
]);

/**
 * Dar/handele/trybut/sojusz dopiero po formalnym kontakcie w audiencji (D3-Q2).
 * Wojna może nastąpić po samym odkryciu na mapie.
 */
export function filterDiplomacyCommandsForEstablishedContact(
  cmds: AIDiplomacyCommand[],
  contactEstablished: boolean,
): AIDiplomacyCommand[] {
  if (contactEstablished) return cmds;
  return cmds.filter(c => !ESTABLISHED_CONTACT_CMDS.has(c.type));
}

/** Etykiety dozwolonych akcji w UI (podgląd v1). */
export function allowedActionsForLayer(layer: DiplomacyLayer): readonly string[] {
  if (layer === 'pre_contact') return ['Brak kontaktu'];
  if (layer === 'simplified') return ['Pokój', 'Wojna', 'Handel'];
  return ['Pełna dyplomacja'];
}

/** Czy gracz może wykonać akcję dyplomatyczną w panelu. */
export function playerDiplomacyActionAllowed(
  layer: DiplomacyLayer,
  action: 'war' | 'peace' | 'trade',
): boolean {
  if (layer === 'pre_contact') return false;
  if (layer === 'simplified') return true;
  return action === 'war' || action === 'peace' || action === 'trade';
}
