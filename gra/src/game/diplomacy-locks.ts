/**
 * diplomacy-locks.ts — logika blokad akcji dyplomatycznych (Makieta DYPLOMACJA
 * v1.1, KROK 3 pkt 4 — DYSPOZYCJA-WDROZENIE.md, 2026-07-23, FAZA 1).
 *
 * Pure moduł: zero DOM/THREE/side-effects. SILNIK (main.ts) zbiera realne
 * wartości (Zaufanie/Respekt/progi z getEffectiveDiplomacyParams(), stan
 * traktatów z activeDeals) w `DiplomacyActionLockContext` i woła
 * `resolveDiplomacyActionLock` — funkcja zwraca ujednoliconą notkę w formacie
 * makiety: „zablokowana — wymaga Zaufania 90 (masz 34)".
 *
 * Progi pochodzą z SILNIKA (DIPLOMACY_PARAMS / diplomacy.json), NIE z makiety —
 * np. Sojusz wojskowy w makiecie pokazuje „wymaga Zaufania 90", silnik ma
 * progSojuszZaufanie=91 (po przeskalowaniu wg trudności) → używamy 91.
 *
 * Id akcji odpowiadają data/diplomacy.json `akcje_dyplomatyczne` (main.ts
 * buildAudienceActions, diplomacyActionIdFromLabel):
 *   1 kontakt · 2 pakt nieagresji · 3 sojusz wojskowy · 4 otwarte granice ·
 *   5 umowa handlowa · 6 wymiana technologii · 7 namowa do wojny ·
 *   8 żądanie/oferta trybutu · 9 ultimatum · 10 propozycja pokoju ·
 *   11 wypowiedzenie wojny · 12 wasalizacja/wchłonięcie · 13 dar.
 */

export type DiplomacyLockKind = 'zaufanie' | 'respekt' | 'stan';

export interface DiplomacyLockRequirement {
  kind: DiplomacyLockKind;
  /** Wartość progowa wymagana silnikiem (już przeskalowana wg trudności). */
  prog: number;
  /** Wartość, którą aktualnie ma gracz (Zaufanie/Respekt/Relacja — wg `kind`). */
  masz: number;
}

export interface DiplomacyLockResult {
  locked: boolean;
  requirement?: DiplomacyLockRequirement;
  /** Notka w formacie makiety, gotowa do wyświetlenia. */
  note: string;
  /** Traktat/umowa już zawarta między stronami (stan `active` z makiety v1.1). */
  active?: boolean;
}

/** Kontekst zebrany przez SILNIK dla JEDNEJ akcji (jednego `actionId`). */
export interface DiplomacyActionLockContext {
  actionId: string;
  /** Czy nawiązano formalny kontakt dyplomatyczny (poza akcją '1'). */
  contact: boolean;
  atWar: boolean;
  /** Relacja ogólna (Zaufanie + Respekt wg silnika, 0–200). */
  relTotal: number;
  zaufanie: number;
  respekt: number;
  /** Aktywne traktaty między stronami (z activeDeals, uwzględnia sojusz_defensywny/pelny). */
  hasNap: boolean;
  /** Traktat szlaków (`umowa_szlakow`) — szlaki + +1 Zaufanie/turę. */
  hasHandel: boolean;
  /** Umowa wymiany surowców (`umowa_wymiany`). */
  hasWymiana?: boolean;
  hasSojusz: boolean;
  /** Etykieta traktatu, który zrywa wypowiedzenie wojny (np. „Pakt o nieagresji"); undefined = brak. */
  breaksTreatyLabel?: string;
  sellableTechCount: number;
  knownRivalsCount: number;
  progNapRelacja: number;
  progHandelRelacja: number;
  progSojuszRelacja: number;
  progSojuszZaufanie: number;
  progGraniceRelacja: number;
  progGraniceZaufanie: number;
  progWymianaTechZaufanie: number;
  progNamowWojneZaufanie: number;
  progWasalizacjaRespekt: number;
  /** R-GRACZ-WCHLONIECIE: próg Respektu na wchłonięcie MP */
  progWchloniecieRespekt?: number;
  progTrybutZadanieMinRespekt: number;
  progDarRelacja: number;
  /** Partner to miasto-państwo (akcja 15) */
  isCityStatePartner?: boolean;
  /** Aktywna wasalizacja gracz→partner */
  hasWasal?: boolean;
  /** Wiek aktywnego wasalu w turach */
  wasalAgeTurns?: number;
  /** Min tur wasalu przed wchłonięciem */
  graczWchlonieciePoWasaluTur?: number;
}

function fmtProg(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

/** Notka „zablokowana — wymaga X N (masz M)" — format makiety v1.1. */
export function formatLockedNote(label: string, prog: number, masz: number): string {
  return `zablokowana — wymaga ${label} ${fmtProg(prog)} (masz ${fmtProg(masz)})`;
}

function zaufanieGate(prog: number, masz: number): DiplomacyLockResult | null {
  if (masz >= prog) return null;
  return {
    locked: true,
    requirement: { kind: 'zaufanie', prog, masz },
    note: formatLockedNote('Zaufania', prog, masz),
  };
}

function respektGate(prog: number, masz: number): DiplomacyLockResult | null {
  if (masz >= prog) return null;
  return {
    locked: true,
    requirement: { kind: 'respekt', prog, masz },
    note: formatLockedNote('Respektu', prog, masz),
  };
}

function relacjaGate(prog: number, masz: number): DiplomacyLockResult | null {
  if (masz >= prog) return null;
  return {
    locked: true,
    requirement: { kind: 'stan', prog, masz },
    note: formatLockedNote('Relacji', prog, masz),
  };
}

/** Dual-gate Relacja+Zaufanie (sojusz/otwarte granice/wymiana tech) — jak diplomacyDualGateTooltip,
 *  ale zwraca kształt DiplomacyLockResult; preferuje zgłoszenie Zaufania (widoczne w makiecie). */
function dualGate(
  relTotal: number, zaufanie: number, minRel: number, minZauf: number,
): DiplomacyLockResult | null {
  const relOk = relTotal >= minRel;
  const zaufOk = zaufanie >= minZauf;
  if (relOk && zaufOk) return null;
  if (!zaufOk && !relOk) {
    return {
      locked: true,
      requirement: { kind: 'zaufanie', prog: minZauf, masz: zaufanie },
      note:
        `zablokowana — wymaga Zaufania ${fmtProg(minZauf)} (masz ${fmtProg(zaufanie)}) ` +
        `i Relacji ${fmtProg(minRel)} (masz ${fmtProg(relTotal)})`,
    };
  }
  if (!zaufOk) return zaufanieGate(minZauf, zaufanie);
  return relacjaGate(minRel, relTotal);
}

const ALREADY_NOTE: Record<string, string> = {
  '2': 'już zawarty',
  '3': 'już zawarty',
  '5': 'już zawarta',
  '14': 'już zawarta',
};

/**
 * Rdzeń logiki blokad — dla danego `actionId` zwraca `{ locked, requirement?, note, active? }`.
 * Kontakt ('1') i stan „brak kontaktu" dla pozostałych akcji SILNIK sprawdza przed wywołaniem
 * tej funkcji (buildAudienceActions) — tu zakładamy `ctx.contact === true` już ustalone.
 */
export function resolveDiplomacyActionLock(ctx: DiplomacyActionLockContext): DiplomacyLockResult {
  const { actionId } = ctx;

  switch (actionId) {
    case '2': { // Pakt o nieagresji
      if (ctx.hasNap) return { locked: false, active: true, note: ALREADY_NOTE['2']! };
      if (ctx.atWar) return { locked: true, note: 'zablokowany — trwa wojna' };
      const gate = relacjaGate(ctx.progNapRelacja, ctx.relTotal);
      if (gate) return gate;
      return { locked: false, note: '' };
    }

    case '3': { // Sojusz wojskowy
      if (ctx.hasSojusz) return { locked: false, active: true, note: ALREADY_NOTE['3']! };
      if (ctx.atWar) return { locked: true, note: 'zablokowany — trwa wojna' };
      const gate = dualGate(ctx.relTotal, ctx.zaufanie, ctx.progSojuszRelacja, ctx.progSojuszZaufanie);
      if (gate) return gate;
      return { locked: false, note: '' };
    }

    case '4': { // Otwarte granice / prawo przemarszu
      if (ctx.atWar) return { locked: true, note: 'zablokowane — trwa wojna' };
      const gate = dualGate(ctx.relTotal, ctx.zaufanie, ctx.progGraniceRelacja, ctx.progGraniceZaufanie);
      if (gate) return gate;
      return { locked: false, note: 'przemarsz wojsk dozwolony' };
    }

    case '5': { // Traktat handlowy (HANDEL-SPLIT-Q1=B)
      if (ctx.atWar) return { locked: true, note: 'handel niedostępny w wojnie' };
      if (ctx.hasHandel) return { locked: false, active: true, note: ALREADY_NOTE['5']! };
      const gate = relacjaGate(ctx.progHandelRelacja, ctx.relTotal);
      if (gate) return gate;
      return { locked: false, note: 'szlaki handlowe, +1 Zaufanie/turę' };
    }

    case '14': { // Umowa wymiany surowców
      if (ctx.atWar) return { locked: true, note: 'handel niedostępny w wojnie' };
      if (ctx.hasWymiana) return { locked: false, active: true, note: ALREADY_NOTE['14']! };
      const gate = relacjaGate(ctx.progHandelRelacja, ctx.relTotal);
      if (gate) return gate;
      return { locked: false, note: 'koszyk towarów jednorazowo / co turę' };
    }

    case '6': { // Wymiana / sprzedaż technologii
      const gate = dualGate(ctx.relTotal, ctx.zaufanie, ctx.progHandelRelacja, ctx.progWymianaTechZaufanie);
      if (gate) return gate;
      if (ctx.sellableTechCount === 0) {
        return { locked: true, note: 'zablokowana — brak technologii do wymiany' };
      }
      return { locked: false, note: '' };
    }

    case '7': { // Wspólny wróg / namowa do wojny
      const gate = zaufanieGate(ctx.progNamowWojneZaufanie, ctx.zaufanie);
      if (gate) return gate;
      if (ctx.knownRivalsCount === 0) {
        return { locked: true, note: 'zablokowana — brak znanych celów wojny' };
      }
      return { locked: false, note: '' };
    }

    case '8': { // Żądanie / oferta trybutu
      // KRYTYCZNE (v1.1 CHANGELOG): silnik dotąd NIE gate'ował tej akcji na Respekt —
      // klikalne przy Respekt 61 < prog 70. Naprawione tutaj.
      if (ctx.atWar) {
        // W wojnie: tylko oferta jednorazowych reparacji za pokój — zawsze dostępne.
        return { locked: false, note: 'oferta reparacji za pokój' };
      }
      const gate = respektGate(ctx.progTrybutZadanieMinRespekt, ctx.respekt);
      if (gate) return gate;
      return { locked: false, note: '' };
    }

    case '9': { // Ultimatum / groźba
      // Zachowanie 1:1 z poprzednim silnikiem (main.ts, przed FAZA 1) — NIE zmieniamy
      // gameplayu poza zakresem zlecenia (id '9' nie jest na liście KRYTYCZNE CHANGELOG).
      if (ctx.atWar) return { locked: true, note: 'zablokowane — wymaga pokoju (trwa wojna)' };
      return { locked: false, note: '' };
    }

    case '10': { // Propozycja pokoju / zawieszenia broni
      if (!ctx.atWar) {
        return { locked: true, note: 'niedostępna — nie trwa wojna' };
      }
      return { locked: false, note: '' };
    }

    case '11': { // Wypowiedzenie wojny
      if (ctx.atWar) return { locked: true, note: 'już w stanie wojny' };
      if (ctx.breaksTreatyLabel) {
        return { locked: false, note: `zrywa ${ctx.breaksTreatyLabel}` };
      }
      return { locked: false, note: '' };
    }

    case '12': { // Wasalizacja
      if (ctx.atWar) return { locked: true, note: 'zablokowana — trwa wojna' };
      const gate = respektGate(ctx.progWasalizacjaRespekt, ctx.respekt);
      if (gate) return gate;
      return { locked: false, note: '' };
    }

    case '15': { // Wchłonięcie miasta-państwa (R-GRACZ-WCHLONIECIE)
      if (ctx.atWar) return { locked: true, note: 'zablokowana — trwa wojna' };
      if (!ctx.isCityStatePartner) {
        return { locked: true, note: 'zablokowana — tylko miasta-państwa' };
      }
      if (!ctx.hasWasal) {
        return { locked: true, note: 'zablokowana — brak aktywnej wasalizacji' };
      }
      const minAge = ctx.graczWchlonieciePoWasaluTur ?? 10;
      const age = ctx.wasalAgeTurns ?? 0;
      if (age < minAge) {
        const remain = minAge - age;
        return {
          locked: true,
          note: `zablokowana — wasal musi trwać ≥ ${minAge} tur (pozostało ${remain})`,
        };
      }
      const wchRespekt = ctx.progWchloniecieRespekt ?? 90;
      const gate = respektGate(wchRespekt, ctx.respekt);
      if (gate) return gate;
      return { locked: false, note: 'jednorazowa opłata ¤ + zgoda wasala' };
    }

    case '13': { // Prezent / dar
      if (ctx.atWar) return { locked: true, note: 'dar niedostępny w wojnie' };
      const gate = relacjaGate(ctx.progDarRelacja, ctx.relTotal);
      if (gate) return gate;
      return { locked: false, note: '' };
    }

    default:
      return { locked: false, note: '' };
  }
}
