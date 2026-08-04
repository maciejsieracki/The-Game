/**
 * diplomacy-layers.ts — warstwy dyplomacji D-START-2B / 3A.
 * Uproszczona (klaster, ten sam typ): pokój, wojna, handel.
 * Pełna: istniejący model diplomacy.ts (obcy typ po kontakcie).
 */

import type { AIDiplomacyCommand } from './ai';
import { DIPLOMACY_PARAMS, type Relation } from './diplomacy';
import { zaufaniePierwszyKontaktZD4 } from './diplomacy-credibility';
import { isBarbarian } from './barbarians';

export type DiplomacyLayer = 'simplified' | 'full' | 'pre_contact';

/** Komendy trybutu — zabronione u miast-państw (UI + silnik, Maciej 2026-08-02). */
export const CITY_STATE_TRIBUTE_CMDS = new Set<string>([
  'zadaj_trybut',
  'oferuj_trybut_za_pokoj',
]);

const SIMPLIFIED_CMD = new Set<string>([
  'wypowiedz_wojne',
  'zaproponuj_pokoj',
  'zaproponuj_handel',
  // R-MP-HANDEL-SUROWCE (Maciej, wariant A — pełny handel): miasta-państwa mogą
  // proponować graczowi cykliczny handel surowcem (Priorytet 5c decideAIDiplomacy),
  // tak jak pełne cywilizacje AI. Bez tego wpisu filterDiplomacyCommandsForLayer
  // ucinał komendę dla warstwy 'simplified' mimo że decideAIDiplomacy ją generował
  // (main.ts pickResourceSurplusForOwnerPair jest już ownerId-agnostyczne).
  'zaproponuj_handel_surowiec',
  'zaproponuj_audiencje',
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
 * REL-MP-SAME-Q1 — start gracz ↔ miasto-państwo kopii typu gracza (wspólnota +20).
 * Bez rywalizacjaTenSamTyp_zaufanie (−20); AI↔AI ten sam typ nadal startRelationForPair(true).
 */
export function startRelationForPlayerSameCivCityState(): Relation {
  const p = DIPLOMACY_PARAMS;
  const zaufanie = clamp(p.startZaufanie + p.miastoPanstwoSameCiv_zaufanie, 0, 100);
  return {
    zaufanie,
    respekt: p.startRespekt,
    status: 'neutralni',
  };
}

/**
 * MP-DIPLO-Q1=A (Maciej 2026-08-04) — start AI major ↔ same-civ MP w klastrze obcego typu.
 * Nie dotyka gracza ↔ MP (startRelationForPlayerSameCivCityState).
 */
export function startRelationForAiMajorSameCivCityState(): Relation {
  const p = DIPLOMACY_PARAMS;
  return {
    zaufanie: 100,
    respekt: p.progWchloniecieRespekt,
    status: 'sojusz',
  };
}

/** Utrzymuje wysokie Zaufanie/Respekt major↔MP same civ (bez wojny). */
export function maintainAiMajorSameCivRelation(rel: Relation): Relation {
  if (rel.status === 'wojna') return rel;
  const floor = startRelationForAiMajorSameCivCityState();
  const zaufanie = Math.max(rel.zaufanie, floor.zaufanie);
  const respekt = Math.max(rel.respekt, floor.respekt);
  const status =
    rel.status === 'sojusz' || zaufanie >= floor.zaufanie ? 'sojusz' : rel.status;
  return { zaufanie, respekt, status };
}

export interface AiMajorSameCivPairOpts {
  clusterCapitalOwnerIds: ReadonlySet<number>;
  typCityCopyOwners: ReadonlySet<number>;
  civOf: (ownerId: number) => string | undefined;
}

/** Para AI major (stolica klastra) ↔ miasto-państwo kopii tego samego typu cywilizacji. */
export function isAiMajorToSameCivCityStatePair(
  ownerA: number,
  ownerB: number,
  opts: AiMajorSameCivPairOpts,
): boolean {
  const civA = opts.civOf(ownerA);
  const civB = opts.civOf(ownerB);
  if (!civA || !civB || civA !== civB) return false;
  const aMajor = opts.clusterCapitalOwnerIds.has(ownerA);
  const bMajor = opts.clusterCapitalOwnerIds.has(ownerB);
  const aMp = opts.typCityCopyOwners.has(ownerA);
  const bMp = opts.typCityCopyOwners.has(ownerB);
  return (aMajor && bMp) || (bMajor && aMp);
}

/**
 * C-WIAR-D4=A — nakłada Dźwignię 4 na relację startową (pierwszy kontakt / lazy init).
 * Symetrycznie: każda strona wnosi `round(W/20)` pkt Zaufania.
 */
export function startRelationForPairWithWiarygodnosc(
  sameType: boolean,
  wiarygodnoscOwnerA: number,
  wiarygodnoscOwnerB: number,
): Relation {
  const base = startRelationForPair(sameType);
  return {
    ...base,
    zaufanie: zaufaniePierwszyKontaktZD4(base.zaufanie, wiarygodnoscOwnerA, wiarygodnoscOwnerB),
  };
}

/** D4 na gotowej relacji (np. po korekcie trudności miasta-państwa). */
export function applyWiarygodnoscD4ToRelation(
  rel: Relation,
  wiarygodnoscOwnerA: number,
  wiarygodnoscOwnerB: number,
): Relation {
  return {
    ...rel,
    zaufanie: zaufaniePierwszyKontaktZD4(rel.zaufanie, wiarygodnoscOwnerA, wiarygodnoscOwnerB),
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
 * WARIANT B (Maciej 2026-07-21, po recon podlogi skali): baza miasta-panstwa gracza
 * (REL-MP-SAME-Q1: startRelationForPlayerSameCivCityState = startZaufanie(20) +
 * miastoPanstwoSameCiv_zaufanie(+20) = 40) -- delta ujemna na hard bylaby wchlaniana przez clamp i
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
 * C-BARB-Q1 (Maciej 2026-07-26, decyzja B): barbarzyńcy są w REALNEJ relacji
 * „wojna" ze WSZYSTKIMI niebarbarzyńcami (gracz, każde AI, każde miasto-państwo) —
 * ta sama struktura Relation co reszta ownerów w diplomacyRelations (main.ts
 * getDiploRelation wymusza ten status dla każdej pary z udziałem barbarzyńcy),
 * NIE osobny wyjątek w bramce walki. Zaufanie 0 (nigdy nie negocjują, brak
 * zaufania z definicji); respekt neutralny -- pole nieużywane w praktyce, bo
 * barbarzyńcy nie przechodzą przez aiDiplomacyStance/tickDiplomacy (main.ts
 * aiOwnerList filtruje tylko ownerId > 0).
 */
export function barbarianWarRelation(): Relation {
  const p = DIPLOMACY_PARAMS;
  return {
    zaufanie: 0,
    respekt: p.startRespekt,
    status: 'wojna',
  };
}

/**
 * D-START-3A: odkrycie na mapie = heks miasta AI lub jednostki AI w bieżącym
 * zasięgu widzenia (visible — NIE explored). Explored utrzymywał fałszywe kontakty:
 * miasto znika z renderu poza zasięgiem, ale hex zostaje w explored → wpis w dyplomacji.
 *
 * C-BARB-Q1/Q2 (Maciej 2026-07-26): barbarzyńcy WYKLUCZENI -- nie są "cywilizacją"
 * do negocjacji (brak miast, więc tylko jednostki mogłyby wpaść tu przez
 * `units`). Bez tego filtra widoczny obóz/jednostka barbarzyńców trafiał do
 * `diplomaticallyDiscoveredOwners` i mógł otworzyć graczowi pełną audiencję
 * dyplomatyczną z "Barbarzyńcami" (checkNewDiplomaticContacts w main.ts).
 */
export function computeDiplomaticContacts(
  visible: ReadonlySet<string>,
  cities: ReadonlyArray<{ ownerId: number; q: number; r: number }>,
  units: ReadonlyArray<{ ownerId: number; q: number; r: number }>,
  playerOwnerId = 0,
): Set<number> {
  const contacted = new Set<number>();
  for (const c of cities) {
    if (c.ownerId === playerOwnerId || isBarbarian(c.ownerId)) continue;
    if (visible.has(hexKey(c.q, c.r))) contacted.add(c.ownerId);
  }
  for (const u of units) {
    if (u.ownerId === playerOwnerId || isBarbarian(u.ownerId)) continue;
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

/**
 * Miasta-państwa (klaster, kopie typu) nie oferują ani nie żądają trybutu —
 * spójnie z audiencją (action 8 = „Niedostępne u miasta-państwa").
 */
export function filterCityStateTributeCommands(
  cmds: AIDiplomacyCommand[] | null | undefined,
  ownerIsCityState: boolean,
): AIDiplomacyCommand[] {
  const list = cmds ?? [];
  if (!ownerIsCityState) return list;
  return list.filter(c => !CITY_STATE_TRIBUTE_CMDS.has(c.type));
}

const ESTABLISHED_CONTACT_CMDS = new Set<string>([
  'zaproponuj_pokoj',
  'zaproponuj_sojusz',
  'zaproponuj_pakt',
  'zaproponuj_handel',
  'zaproponuj_umowe_handlowa',
  'zaproponuj_handel_surowiec',
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

/** Maciej 2026-07-29 — tooltip/kafelek wyszarzonej akcji na audiencji. */
export const AUDIENCE_LOCK_NOTE_CITY_STATE = 'Niedostępne u miasta-państwa';
export const AUDIENCE_LOCK_NOTE_SAME_TYPE_RIVAL = 'Niedostępne u rywala tego samego typu';

/**
 * Powód blokady akcji spoza pakietu podstawowego (D3-Q4 poboczni / warstwa uproszczona).
 * Rywal tego samego typu (simplifiedDiplomacyOwners) ma osobną etykietę od obcego MP.
 */
export function audienceRestrictedActionLockNote(
  ownerId: number,
  simplifiedOwners: ReadonlySet<number>,
): string {
  if (simplifiedOwners.has(ownerId)) return AUDIENCE_LOCK_NOTE_SAME_TYPE_RIVAL;
  return AUDIENCE_LOCK_NOTE_CITY_STATE;
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
