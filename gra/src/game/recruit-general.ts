/**
 * R-WEB-ARMY-AUTO-RECRUIT-GENERAL-Q1 — generał „rekrutujący” dla panelu Rekrutacja (cała cywilizacja).
 *
 * Moduł CZYSTY (bez DOM i stanu gry). Zamówienia z panelu zbiorczego wymagają wybranego własnego
 * generała; każda zamówiona sztuka niesie jego id (`rallyGeneralId`) i po zrodzeniu idzie do TEGO
 * generała. Bez wyboru panel nie rekrutuje. Rekrutacja ręczna (Armia, miasto) nie korzysta z tego modułu.
 */

export interface RecruitGeneralCandidate {
  id: string;
  ownerId: number;
  q: number;
  r: number;
  isGeneral?: boolean;
  hp?: number;
  dead?: boolean;
  removed?: boolean;
  routed?: boolean;
}

export type RecruitGeneralStatus = 'none' | 'ok' | 'lost';

export interface RecruitGeneralResolution<T extends RecruitGeneralCandidate> {
  status: RecruitGeneralStatus;
  general?: T;
}

function isLivingGeneral(u: RecruitGeneralCandidate, ownerId: number): boolean {
  return u.ownerId === ownerId && u.isGeneral === true
    && u.dead !== true && u.removed !== true && u.routed !== true
    && (u.hp == null || u.hp > 0);
}

/** Żywi generałowie właściciela, w stałej kolejności (id). */
export function livingGeneralsOf<T extends RecruitGeneralCandidate>(units: readonly T[], ownerId: number): T[] {
  return units.filter(u => isLivingGeneral(u, ownerId)).sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

/**
 * 'none' = nic nie wybrano; 'ok' = wybrany żyje; 'lost' = wybrany zginął/zniknął
 * (wołający czyści wybór i powiadamia gracza).
 */
export function resolveRecruitGeneral<T extends RecruitGeneralCandidate>(
  selectedId: string | null | undefined,
  units: readonly T[],
  ownerId: number,
): RecruitGeneralResolution<T> {
  if (!selectedId) return { status: 'none' };
  const general = units.find(u => u.id === selectedId && isLivingGeneral(u, ownerId));
  return general ? { status: 'ok', general } : { status: 'lost' };
}

/** Pola doklejane do wpisu kolejki z panelu Rekrutacja: marsz do wybranego generała. */
export function recruitRallyStamp(generalId: string): { followGeneral: true; rallyGeneralId: string } {
  return { followGeneral: true, rallyGeneralId: generalId };
}

/**
 * Cel marszu świeżej jednostki: wybrany generał z zamówienia, jeśli żyje; w przeciwnym razie
 * (brak pola = zamówienie ręczne, albo generał zginął) — `fallback` (najbliższy generał, dotychczasowa reguła).
 */
export function pickRallyGeneral<T extends RecruitGeneralCandidate>(
  unit: { ownerId: number; rallyGeneralId?: string },
  units: readonly T[],
  fallback: () => T | undefined,
): T | undefined {
  if (unit.rallyGeneralId) {
    const g = units.find(u => u.id === unit.rallyGeneralId && isLivingGeneral(u, unit.ownerId));
    if (g) return g;
  }
  return fallback();
}
