// R-WEB-UI-DIPLO-WEARINESS-DESPAIR-DISPLAY-Q1 — cienki selektor do panelu dyplomacji (PURE, bez DOM i bez stanu gry).
//
// Dla jednej wojny (para a↔b) zwraca, co panel ma pokazać każdej stronie:
//  - strona WYGRYWAJĄCA (siła militarna, reguła compareMilitaryStrength z progiem przewagi) → zmęczenie wojną;
//  - strona PRZEGRYWAJĄCA → desperacja (loserDespair, ta sama formuła co w war-weariness.ts);
//  - REMIS (brak przewagi wg progu parytetu) → obie strony pokazują zmęczenie.
// Wartości NIE są kopiowane: czytane z warWearinessLevel / loserDespair (war-weariness.ts) i parametrów JSON.
//
// Wejścia podaje main.ts (stan gry: tury wojny, utracone miasta, siła militarna). Ten plik tylko je układa.
// Dwa tryby zgodności z ticiem (WarWearinessReference):
//  - 'tick' — para AI↔AI, jak runWarWearinessTick: poziom = szczyt pary, udział przycięty do udzialWyraznie;
//  - 'ai'   — para gracz↔AI (panel): poziom = bieżący, udział nieprzycięty, desperacja = loserDespair BEZ bramki
//             isWarWeary (R-WEB-DIPLO-DESPAIR-SHOW-FORMULA-IMPL-Q1: panel pokazuje wynik wzoru; ai.ts desperacji nie liczy).

import {
  loserDespair,
  warWearinessLevel,
  WAR_WEARINESS_PARAMS,
  wearinessMilitaryShare,
  type WarWearinessParams,
} from './war-weariness';
import { compareMilitaryStrength, type MilitarySide } from './diplomacy-military-strength';
import { formatTurCountAcc } from '../ui/formatPl';

/** Rola strony w wojnie wg siły militarnej (remis = w progu parytetu). */
export type WarWearinessRole = 'wygrywa' | 'przegrywa' | 'rowny';

/** Który tick odwzorowujemy: 'tick' = AI↔AI (runWarWearinessTick), 'ai' = gracz↔AI (panel). */
export type WarWearinessReference = 'tick' | 'ai';

/** Dane jednej strony pary. `id` służy wyłącznie do rozstrzygnięcia remisu siły (jak w compareMilitaryStrength). */
export interface WarWearinessSideInput {
  id: string;
  /** Siła militarna strony (diplomacy-military-strength.ts, computeMilitaryStrength). */
  sila: number;
  /** Składnik armii z Power (do rozstrzygnięcia remisu siły). */
  armiaPkt: number;
  /** Miasta utracone przez TĘ stronę w tej wojnie. */
  lostCities: number;
}

export interface WarWearinessPairInput {
  /** Tury trwania wojny pary (warInfo.turnsAtWar w main.ts). */
  turnsAtWar: number;
  /** Tury od ostatniej zmiany posiadania miast (undefined = od początku wojny). */
  turnsSinceCityChange?: number;
  a: WarWearinessSideInput;
  b: WarWearinessSideInput;
  /**
   * Szczyt zmęczenia pary = `warWearinessByPairKey.get(key).peak` (stepPairState), tylko dla wojny bieżącej
   * (peakForCurrentWar). Używany w trybie 'tick' — runWarWearinessTick bierze szczyt do decyzji i loserDespair.
   * Tryb 'ai' ignoruje go (panel gracz↔AI liczy z bieżącego poziomu).
   */
  peak?: number;
  /** Domyślnie 'tick'. */
  reference?: WarWearinessReference;
}

/** Widok jednej strony. `zmeczenie` dla 'wygrywa' i 'rowny'; `desperacja` dla 'przegrywa'. Wszystko 0..1. */
export interface WarWearinessView {
  rola: WarWearinessRole;
  zmeczenie?: number;
  desperacja?: number;
}

export interface WarWearinessPairView {
  /** Wspólny poziom zmęczenia wojną pary (0..1). */
  level: number;
  /** Id strony a i b (jak podane na wejściu) — do rozstrzygnięcia, która strona to która. */
  aId: string;
  bId: string;
  a: WarWearinessView;
  b: WarWearinessView;
}

const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));

/** Widok obu stron wojny pary. Czysta funkcja; parametry domyślnie z war-weariness-params.json. */
export function warWearinessPairView(
  inp: WarWearinessPairInput,
  P: WarWearinessParams = WAR_WEARINESS_PARAMS,
): WarWearinessPairView {
  const ref: WarWearinessReference = inp.reference ?? 'tick';
  const current = clamp01(warWearinessLevel(
    {
      turnsAtWar: inp.turnsAtWar,
      lostCitiesTotal: Math.max(0, inp.a.lostCities) + Math.max(0, inp.b.lostCities),
      turnsSinceCityChange: inp.turnsSinceCityChange,
    },
    P,
  ));
  // Tick AI↔AI: lvl = st.peak (szczyt, gdy podany). Panel gracz↔AI: zawsze bieżący poziom.
  const level = ref === 'tick' && inp.peak !== undefined ? clamp01(inp.peak) : current;

  const sideA: MilitarySide = { id: inp.a.id, sila: inp.a.sila, armiaPkt: inp.a.armiaPkt };
  const sideB: MilitarySide = { id: inp.b.id, sila: inp.b.sila, armiaPkt: inp.b.armiaPkt };
  const cmp = compareMilitaryStrength(sideA, sideB);

  if (cmp.przewaga === 'brak') {
    return {
      level, aId: inp.a.id, bId: inp.b.id,
      a: { rola: 'rowny', zmeczenie: level }, b: { rola: 'rowny', zmeczenie: level },
    };
  }

  const aWins = cmp.przewaga === 'A';
  const loser = aWins ? inp.b : inp.a;
  const shareA = wearinessMilitaryShare(inp.a.sila, inp.b.sila);
  const loserShare = aWins ? 1 - shareA : shareA;
  let despair: number;
  if (ref === 'ai') {
    // Panel gracz↔AI: wynik wzoru loserDespair bez bramki zmęczenia (udział nieprzycięty; udział > udzialWyraznie → 0 we wzorze).
    despair = loserDespair({ level, share: loserShare, lostCities: loser.lostCities }, P);
  } else {
    // runWarWearinessTick: udział przycięty do „wyraźnie" (remis nie wypada z desperacji).
    const shareForDespair = Math.min(loserShare, P.przegrywajacy.udzialWyraznie);
    despair = loserDespair({ level, share: shareForDespair, lostCities: loser.lostCities }, P);
  }
  despair = clamp01(despair);

  const winnerView: WarWearinessView = { rola: 'wygrywa', zmeczenie: level };
  const loserView: WarWearinessView = { rola: 'przegrywa', desperacja: despair };
  return aWins
    ? { level, aId: inp.a.id, bId: inp.b.id, a: winnerView, b: loserView }
    : { level, aId: inp.a.id, bId: inp.b.id, a: loserView, b: winnerView };
}

/**
 * Szczyt pary z warWearinessByPairKey, TYLKO gdy stan dotyczy bieżącej wojny (warStart zgodny z tickiem).
 * Brak stanu albo stary stan → undefined (wtedy widok liczy z bieżącego poziomu).
 */
export function peakForCurrentWar(
  st: { warStart: number; peak: number } | undefined,
  warStart: number,
): number | undefined {
  return st !== undefined && st.warStart === warStart ? st.peak : undefined;
}

/**
 * Strona widoku o podanym id („own") i druga strona („rival"). Rozstrzyga po id, nie po kolejności a/b —
 * dzięki temu wartości rozmówcy nie mogą trafić na stronę gracza (i odwrotnie).
 */
export function warWearinessSideView(
  view: WarWearinessPairView,
  ownId: string,
): { own: WarWearinessView; rival: WarWearinessView } {
  if (view.aId === ownId) return { own: view.a, rival: view.b };
  if (view.bId === ownId) return { own: view.b, rival: view.a };
  throw new Error(`warWearinessSideView: brak strony o id ${ownId}`);
}

/**
 * Etapy zmęczenia wojną do wyświetlenia w panelu dyplomacji — wyłącznie z parametrów (bez zahardkodowanych progów):
 * 50% = chęć pokoju, 80% = AI proponuje pokój z miastami, 100% = pokój wymuszony (DIPLO-WAR-WEARINESS-40-TURNS-…-Q1).
 */
export interface WarWearinessStagePl {
  /** Próg w procentach (z parametru × 100, zaokrąglony). */
  procent: number;
  /** Opis etapu po polsku. */
  opis: string;
}

export function warWearinessStagesPl(P: WarWearinessParams = WAR_WEARINESS_PARAMS): WarWearinessStagePl[] {
  return [
    { procent: Math.round(P.zmeczenie.progChetnosci * 100), opis: 'chęć pokoju' },
    { procent: Math.round(P.zmeczenie.progKoncaZmeczenia * 100), opis: 'AI proponuje pokój z miastami' },
    { procent: Math.round(P.zmeczenie.progWymuszonyPokoj * 100), opis: 'pokój wymuszony' },
  ];
}

/**
 * Liczba tur, po których poziom zmęczenia (0..1) osiągnie `target`. Zmęczenie rośnie o 1/pelneTur na turę
 * (plus zmienione miasta), więc tury = ceil((target − level) × pelneTur). Już osiągnięty próg → 0.
 */
export function warWearinessTurnsToLevel(
  level: number,
  target: number,
  P: WarWearinessParams = WAR_WEARINESS_PARAMS,
): number {
  const gap = clamp01(target) - clamp01(level);
  if (gap <= 0) return 0;
  return Math.ceil(gap * P.zmeczenie.pelneTur - 1e-9);
}

/** Podpowiedź „za ile tur” dla następnego etapu (przy 100% — pokój wymuszony). Czysta funkcja z parametrów. */
export function warWearinessNextStagePl(
  level: number,
  P: WarWearinessParams = WAR_WEARINESS_PARAMS,
): string {
  const lvl = clamp01(level);
  const next = warWearinessStagesPl(P).find((s) => lvl < s.procent / 100 - 1e-9);
  if (next === undefined) return 'Pokój wymuszony (100%).';
  const turns = warWearinessTurnsToLevel(lvl, next.procent / 100, P);
  return `Za ${formatTurCountAcc(turns)}: ${next.procent}% — ${next.opis}. Przy 100% pokój wymuszony.`;
}

/** Pełna lista etapów do panelu dyplomacji (wszystkie 3 progi naraz, z parametrów). */
export function warWearinessStagesSummaryPl(P: WarWearinessParams = WAR_WEARINESS_PARAMS): string {
  return 'Etapy: ' + warWearinessStagesPl(P).map((s) => `${s.procent}% — ${s.opis}`).join('; ') + '.';
}

export interface ForcedPeaceTextInput {
  /** Nazwa drugiej strony pokoju (AI). */
  otherName: string;
  /** true = gracz oddaje miasta (przegrywający); false = gracz otrzymuje miasta. */
  humanIsLoser: boolean;
  /** Nazwy miast przeniesionych w pokoju wymuszonym (pusta lista = pokój bez wymiany miast). */
  cityNames: readonly string[];
  /** PENDING-FORCED-PEACE-Q1: zmęczenie wojną w % (poziom pary przy wymuszeniu, zwykle 100). */
  levelPct?: number;
  /** PENDING-FORCED-PEACE-Q1: liczba tur trwania wojny. */
  turnsAtWar?: number;
  /** PENDING-FORCED-PEACE-Q1: liczba miast, które zmieniły właściciela w tej wojnie. */
  citiesChanged?: number;
  /** PENDING-FORCED-PEACE-Q1: karencja po pokoju (tury) — pokazywana w oknie. */
  lockTurns?: number;
}

export interface ForcedPeaceText {
  title: string;
  lead: string;
  /** PENDING-FORCED-PEACE-Q1: pełny tekst „z czego to wynika” (wyliczenia) — w oknie w tooltipie. */
  why: string;
  /** DECLUTTER-WINDOW (2026-11-18): jedno zdanie „dlaczego” widoczne na wierzchu okna. */
  whyShort: string;
  /** Pełny tekst warunków (warunki + karencja + zaufanie) — w oknie w tooltipie. */
  terms: string;
  /** DECLUTTER-WINDOW (2026-11-18): tylko warunki widoczne na wierzchu (co oddajesz / co otrzymujesz / bez miast). */
  termsShort: string;
  /** PENDING-FORCED-PEACE-Q1: etykieta jedynego przycisku (bez opcji odmowy). */
  acceptLabel: string;
}

/**
 * Tekst natywnego okna „pokój wymuszony” (DIPLO-WAR-WEARINESS-40-TURNS-FORCED-PEACE-AT-100-Q1, DODATEK 1 pkt 1–2).
 * Czysta funkcja: okno (ui/diplomacyAudience.ts) tylko ją wyświetla.
 */
export function forcedPeaceModalTextPl(inp: ForcedPeaceTextInput, P: WarWearinessParams = WAR_WEARINESS_PARAMS): ForcedPeaceText {
  // Liczby wzoru zmęczenia wyliczone z parametrów (nie wpisane na sztywno): 100/pelneTur na turę, wagaStratMiasta×100 za miasto.
  const fmtPct = (v: number): string => (Math.round(v * 10) / 10).toString().replace('.', ',');
  const perTurnPct = fmtPct(100 / P.zmeczenie.pelneTur);
  const perCityPct = fmtPct(P.zmeczenie.wagaStratMiasta * 100);
  // DECLUTTER-WINDOW: warunki widoczne (termsShort) i szczegóły (zapłata, karencja, zaufanie) — łącznie = terms.
  const termsShort = inp.cityNames.length === 0
    ? 'Pokój bez wymiany miast.'
    : (inp.humanIsLoser ? 'Oddajesz: ' : 'Otrzymujesz: ') + inp.cityNames.join(', ') + '.';
  const termsDetail = (inp.cityNames.length === 0 ? ' Zapłata: 0 PN.' : '')
    + (inp.lockTurns !== undefined ? ` Po pokoju karencja: ${inp.lockTurns} tur.` : '')
    + ' Zaufanie po pokoju: 20.';
  const terms = termsShort + termsDetail;
  const pct = inp.levelPct ?? 100;
  const wojna = inp.turnsAtWar !== undefined ? `, wojna trwa ${inp.turnsAtWar} tur` : '';
  const zmiany = inp.citiesChanged !== undefined ? `, miast zmieniło właściciela: ${inp.citiesChanged}` : '';
  // Przegrywający = strona o słabszej sile militarnej (weakerOf → compareMilitaryStrength); zmęczenie jest jedną wartością pary.
  const kto = inp.humanIsLoser
    ? ' Przegrywasz tę wojnę, bo Twoja siła militarna jest niższa (zmęczenie jest wspólne dla obu stron).'
    : ' Wygrywasz tę wojnę, bo Twoja siła militarna jest wyższa (zmęczenie jest wspólne dla obu stron).';
  return {
    title: 'Pokój wymuszony',
    lead: `Wojna z ${inp.otherName} osiągnęła ${pct}% zmęczenia — pokój wymuszony.`,
    why: `Zmęczenie wojną ${pct}% (próg wymuszenia 100%)${wojna}${zmiany}.${kto} ` +
      `Zmęczenie rośnie o ${perTurnPct}% za każdą turę wojny i o ${perCityPct}% za każde miasto, które zmieniło właściciela. ` +
      'Nie da się odrzucić tego pokoju: gra nie pozwoli zakończyć tury, dopóki nie zaakceptujesz warunków.',
    whyShort: `Zmęczenie wojną osiągnęło ${pct}% — pokój jest wymuszony.`,
    terms,
    termsShort,
    acceptLabel: 'Akceptuję warunki pokoju',
  };
}
