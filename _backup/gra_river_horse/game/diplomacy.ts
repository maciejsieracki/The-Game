/**
 * diplomacy.ts
 * Pure diplomacy model for The Game.
 *
 * Model: Relacja (ogolna) = Zaufanie + Respekt  (range 0-200)
 *   Zaufanie (0-100, start 20): soft power / goodwill -- driven by actions & treaties
 *   Respekt  (0-100, start 30): hard power -- driven by military strength & battles
 *
 * Sources:
 *   data/diplomacy.json  -- params, thresholds, panel A-E
 *   Dyplomacja-szablon.md -- events, action availability, AI rules
 *   src/types/diplomacy.ts -- RelacjaDyplomatyczna, StanWojny, TypCywilizacji
 *
 * NO DOM, NO THREE, NO side effects. All functions are pure / deterministic.
 */

import type { RelacjaDyplomatyczna } from '../types/diplomacy';
import { StanWojny }                 from '../types/diplomacy';
import { TypCywilizacji }            from '../types/player';
import type { Player }               from '../types/player';

// ---------------------------------------------------------------------------
// Re-exported Relation interface (spec-aligned alias over RelacjaDyplomatyczna)
// ---------------------------------------------------------------------------

/**
 * Slim relation value object used by the pure functions in this module.
 * Matches the field names from diplomacy.json / Dyplomacja-szablon.md:
 *   zaufanie   = Zaufanie (0-100)
 *   respekt    = Respekt / Strach (0-100)
 *   status     = current war/peace state
 *
 * Can be projected from / into RelacjaDyplomatyczna at the call site.
 */
export interface Relation {
  zaufanie: number;
  respekt:  number;
  /**
   * Diplomatic status labels in Polish (from the spec):
   *   'wojna'    = war (StanWojny.Wojna)
   *   'pokoj'    = peace (StanWojny.Pokoj)
   *   'sojusz'   = active SojuszWojskowy treaty
   *   'neutralni'= no significant relationship yet (no contact / early game)
   */
  status: 'wojna' | 'pokoj' | 'sojusz' | 'neutralni';
}

// ---------------------------------------------------------------------------
// Param names mirror diplomacy.json exactly (camelCase of JSON keys)
// ---------------------------------------------------------------------------

/**
 * One-shot delta values for applyDiplomaticEvent.
 * Named after "Zdarzenie / Dzialanie" entries in diplomacy.json.zmiany_parametrow.
 */
export const DIPLOMACY_PARAMS = {
  // ---- one-shot Zaufanie deltas (jednorazowo) ----
  /** "Zawarcie umowy handlowej" (+2 Zaufanie, jednorazowo) */
  handelZawarcie_zaufanie:          2,
  /** "Pomoc w wojnie sojusznikowi" (+10 Zaufanie, jednorazowo) */
  pomocSojusznikowi_zaufanie:       10,
  /** "Wspolny wrog -- nawiazanie kooperacji" (+5 Zaufanie, jednorazowo) */
  wspolnyWrogNawiazanie_zaufanie:   5,
  /** "Podarunek surowca / Pieniadza (gratis)" (+6 Zaufanie, jednorazowo) */
  dar_zaufanie:                     6,
  /** "Zlamany pakt przez gracza" (-40 Zaufanie, jednorazowo) */
  zlamanaPaktGracz_zaufanie:       -40,
  /** "Zlamany pakt przez AI" (-20 Zaufanie, jednorazowo) */
  zlamanaPaktAI_zaufanie:          -20,
  /** "Zdrada / atak z zaskoczenia (na gracza)" (-50 Zaufanie, jednorazowo) */
  zdrada_zaufanie:                 -50,
  /** "Szpiegostwo wykryte przez przeciwnika" (-15 Zaufanie, jednorazowo) */
  szpiegWykryty_zaufanie:          -15,
  /** "Rywalizacja tego samego typu (start gry)" (-20 Zaufanie, jednorazowo) */
  rywalizacjaTenSamTyp_zaufanie:   -20,
  /** "Duza roznica kulturowa (rozny typ)" (-5 Zaufanie, jednorazowo) */
  roznicaKulturowa_zaufanie:       -5,

  // ---- one-shot Respekt deltas (jednorazowo) ----
  /** "Znaczaca przewaga militarna gracza" (+15 Respekt, jednorazowo; 2x or 5x threshold) */
  przewagaMilitarna_respekt:        15,
  /** "Gracz slabszy militarnie od partnera" (-10 Respekt, jednorazowo) */
  slabszyMilitarnie_respekt:       -10,
  /** "Wygrana bitwa (historia bojowa)" (+5 Respekt, jednorazowo) */
  wygraBitwa_respekt:               5,
  /** "Akceptacja zadania trybutu" (+10 Respekt, jednorazowo) */
  trybut_respekt:                   10,
  /** "Wspolny wrog zaakceptowany" (+10 Respekt, jednorazowo) */
  wspolnyWrogAkceptacja_respekt:    10,

  // ---- per-turn Zaufanie deltas (co ture) ----
  /** "Aktywny handel (trwa umowa handlowa)" (+1/ture) */
  handel_zaufanie_perTura:          1,
  /** "Dotrzymany pakt (NAP lub sojusz trwa)" (+1/ture) */
  aktywnyPakt_zaufanie_perTura:     1,
  /** "Efekt dobrej woli (podarunek)" (+1/ture przez kilka tur) */
  dobraWola_zaufanie_perTura:       1,
  /** "Wspolny wrog (kooperacja trwa)" (+1/ture) */
  wspolnyWrog_zaufanie_perTura:     1,
  /** "Wspolna religia" (+0.5/ture, max +15) */
  wspolnaReligia_zaufanie_perTura:  0.5,
  /** "Odmienna religia" (-0.5/ture, max -10) */
  odmiennaReligia_zaufanie_perTura: -0.5,
  /** "Ekspansja przy granicy" (-2/ture) */
  ekspansjaGranica_zaufanie_perTura: -2,
  /** "Urazy historyczne (zanikajace)" (-2/ture; fades every 20 turns) */
  urazyHistoryczne_zaufanie_perTura: -2,

  // ---- thresholds (progi akcji; sekcja C) ----
  /** Zaufanie >= 60 required for SojuszWojskowy */
  progSojuszZaufanie:        60,
  /** Zaufanie >= 70 required for WymianaTechnologii */
  progWymianaTechZaufanie:   70,
  /** Respekt >= 70 required to demand Wasalizacja */
  progWasalizacjaRespekt:    70,
  /** Respekt >= 90 required to demand Wchloniecie */
  progWchloniecieRespekt:    90,
  /** Relacja < 30 = diplomacy nearly impossible */
  progMinimalnyRelacja:      30,
  /** Relacja >= 120 = alliances realistic */
  progSojuszRelacja:         120,

  // ---- starting values (wartosci startowe) ----
  startZaufanie: 20,
  startRespekt:  30,

  // ---- global multipliers (sekcja E) ----
  mnoznikZaufania:     1,
  mnoznikRespektu:     1,
  mnoznikPodarunku:    1,
  turyEfektuPodarunku: 5,

  // ---- simplified minor-civ threshold (paragraph 5.2) ----
  /** Minor civ accepts tribute / NAP / annexation when player Respekt > this */
  progPoboczneAkceptacja: 60,
  /** Minor civ at peace when Relacja > this */
  progPoboczneHandel:     30,
  /** Minor civ goes to war when Relacja < this (negative score floor) */
  progPoboczneWojna:     -40,
} as const;

// ---------------------------------------------------------------------------
// Clamp helper
// ---------------------------------------------------------------------------

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// ---------------------------------------------------------------------------
// relationScore
// ---------------------------------------------------------------------------

/**
 * Returns the combined relation value: Zaufanie + Respekt (0-200).
 * This is "Relacja ogolna" from diplomacy.json panel_sterowania.B.
 * Formula: Relacja = Zaufanie * wagaZaufania + Respekt * wagaRespektu
 * (both weights = 1 per the spec's defaults).
 */
export function relationScore(rel: Relation): number {
  return clamp(
    rel.zaufanie * DIPLOMACY_PARAMS.mnoznikZaufania +
    rel.respekt  * DIPLOMACY_PARAMS.mnoznikRespektu,
    0,
    200
  );
}

// ---------------------------------------------------------------------------
// DiplomaticEvent type
// ---------------------------------------------------------------------------

/**
 * Events that can be passed to applyDiplomaticEvent.
 * Names come from diplomacy.json "Zdarzenie / Dzialanie" column and
 * Dyplomacja-szablon.md section 1 action names.
 */
export type DiplomaticEvent =
  // war / peace
  | 'wojna_wypowiedziana'       // declare war (no casus belli)
  | 'pokoj'                     // peace treaty accepted
  // commerce & treaties
  | 'handel'                    // trade deal concluded (one-shot bonus)
  | 'wspolny_wrog'              // mutual-enemy cooperation established
  // trust penalties
  | 'zlamana_obietnica'         // player broke a pact (-40 Zaufanie)
  | 'zlamana_obietnica_ai'      // AI broke a pact (-20 Zaufanie)
  | 'zdrada'                    // surprise attack (-50 Zaufanie)
  | 'tarcia_graniczne'          // border friction / expansion near border (one-shot -2)
  // trust bonuses
  | 'dar'                       // gift (free resource / Pieniadz)
  | 'wspolna_religia'           // same religion established (one-shot +1 seed)
  | 'pomoc_sojusznikowi'        // helped ally in war (+10 Zaufanie)
  // respect events
  | 'wygrana_bitwa'             // won a battle (+5 Respekt)
  | 'przewaga_militarna'        // crossed 2x or 5x military threshold (+15 Respekt)
  | 'slabszy_militarnie'        // player weaker than partner (-10 Respekt)
  | 'trybut_zaakceptowany';     // tribute demand accepted (+10 Respekt)

// ---------------------------------------------------------------------------
// applyDiplomaticEvent
// ---------------------------------------------------------------------------

/**
 * Applies a one-shot diplomatic event to a Relation and returns a NEW Relation
 * (immutable -- does NOT mutate the input).
 *
 * `params` is optional; defaults to DIPLOMACY_PARAMS. Pass a partial override
 * for testing different calibrations without changing the module constants.
 *
 * All values are clamped to [0, 100] per component after application.
 */
export function applyDiplomaticEvent(
  rel:    Relation,
  event:  DiplomaticEvent,
  params: Partial<typeof DIPLOMACY_PARAMS> = {}
): Relation {
  const p = { ...DIPLOMACY_PARAMS, ...params };

  let dZ = 0;              // delta Zaufanie
  let dR = 0;              // delta Respekt
  let newStatus = rel.status;

  switch (event) {

    // ---- war / peace ----

    case 'wojna_wypowiedziana':
      // paragraph 1.11: without casus belli -> -25 Relacja, -20 Zaufanie globally.
      // We model the Zaufanie hit here; Relacja derives from Z+R automatically.
      dZ = -20;
      newStatus = 'wojna';
      break;

    case 'pokoj':
      // paragraph 1.10: +5 Relacja after time -- soft approximation as +5 Zaufanie.
      dZ = 5;
      newStatus = 'pokoj';
      break;

    // ---- commerce & treaties ----

    case 'handel':
      // "Zawarcie umowy handlowej" +2 Zaufanie jednorazowo
      dZ = p.handelZawarcie_zaufanie;
      break;

    case 'wspolny_wrog':
      // "Wspolny wrog -- nawiazanie kooperacji" +5 Zaufanie + +10 Respekt jednorazowo
      dZ = p.wspolnyWrogNawiazanie_zaufanie;
      dR = p.wspolnyWrogAkceptacja_respekt;
      break;

    // ---- trust penalties ----

    case 'zlamana_obietnica':
      // "Zlamany pakt przez gracza" -40 Zaufanie jednorazowo
      dZ = p.zlamanaPaktGracz_zaufanie;
      break;

    case 'zlamana_obietnica_ai':
      // "Zlamany pakt przez AI" -20 Zaufanie jednorazowo
      dZ = p.zlamanaPaktAI_zaufanie;
      break;

    case 'zdrada':
      // "Zdrada / atak z zaskoczenia" -50 Zaufanie jednorazowo
      dZ = p.zdrada_zaufanie;
      newStatus = 'wojna';
      break;

    case 'tarcia_graniczne':
      // "Ekspansja przy granicy" -- modelled as one-shot -2 Zaufanie
      dZ = p.ekspansjaGranica_zaufanie_perTura;
      break;

    // ---- trust bonuses ----

    case 'dar':
      // "Podarunek surowca / Pieniadza (gratis)" +6 Zaufanie jednorazowo
      // multiplied by mnoznikPodarunku (sekcja E)
      dZ = p.dar_zaufanie * p.mnoznikPodarunku;
      break;

    case 'wspolna_religia':
      // Approximated as one-shot seed: +1 Zaufanie (per-turn handled by engine)
      dZ = 1;
      break;

    case 'pomoc_sojusznikowi':
      // "Pomoc w wojnie sojusznikowi" +10 Zaufanie jednorazowo
      dZ = p.pomocSojusznikowi_zaufanie;
      break;

    // ---- respect events ----

    case 'wygrana_bitwa':
      // "Wygrana bitwa (historia bojowa)" +5 Respekt jednorazowo
      dR = p.wygraBitwa_respekt;
      break;

    case 'przewaga_militarna':
      // "Znaczaca przewaga militarna gracza" +15 Respekt jednorazowo
      dR = p.przewagaMilitarna_respekt;
      break;

    case 'slabszy_militarnie':
      // "Gracz slabszy militarnie od partnera" -10 Respekt jednorazowo
      dR = p.slabszyMilitarnie_respekt;
      break;

    case 'trybut_zaakceptowany':
      // "Akceptacja zadania trybutu" +10 Respekt jednorazowo
      dR = p.trybut_respekt;
      break;
  }

  const newZ = clamp(rel.zaufanie + dZ, 0, 100);
  const newR = clamp(rel.respekt  + dR, 0, 100);

  return {
    zaufanie: newZ,
    respekt:  newR,
    status:   newStatus,
  };
}

// ---------------------------------------------------------------------------
// AIDiplomacyContext
// ---------------------------------------------------------------------------

/**
 * Context snapshot fed to aiDiplomacyStance.
 * All values are plain numbers -- no DOM / game-loop references.
 */
export interface AIDiplomacyContext {
  /** Is the AI player a minor/peripheral civilization (DrobnaCywilizacja)? */
  isMinorCiv: boolean;
  /**
   * Ratio of AI military power to other player's military power.
   * > 1 means AI is stronger; < 1 means AI is weaker.
   * Corresponds to "Stosunek wojska gracza do wojska partnera" (sekcja A, waga 25%).
   */
  militaryRatio: number;
  /** Current game turn. */
  currentTurn: number;
  /**
   * Number of turns the current war (if any) has been going on.
   * 0 when at peace.
   */
  turnsAtWar: number;
}

// ---------------------------------------------------------------------------
// AIDiplomacyStance result
// ---------------------------------------------------------------------------

/**
 * Willingness scores returned by aiDiplomacyStance.
 * All values in [0, 1]: 0 = will never, 1 = will always.
 * The game engine maps these to actual probability / decision thresholds.
 */
export interface AIDiplomacyStance {
  /**
   * Willingness to declare war on the other player.
   * Driven by Respekt (hard power), archetype aggression, and low relation.
   */
  willingnessWar: number;
  /**
   * Willingness to accept or propose a peace treaty.
   * High when losing (low militaryRatio), long war, or moderate Zaufanie.
   */
  willingnessPeace: number;
  /**
   * Willingness to engage in trade (UmowaHandlowa).
   * High when relationScore is above progMinimalnyRelacja (30).
   */
  willingnessTrade: number;
  /**
   * Willingness to form or accept a SojuszWojskowy.
   * Requires Zaufanie >= progSojuszZaufanie (60) AND Relacja >= progSojuszRelacja (120).
   */
  willingnessAlly: number;
}

// ---------------------------------------------------------------------------
// Archetype aggression table (from Dyplomacja-szablon.md paragraph 4)
// ---------------------------------------------------------------------------

/**
 * Base aggression coefficient per civilization type (0 = pacifist, 1 = maximally aggressive).
 * Derived from "Tendencja do wojny" column in Dyplomacja-szablon.md paragraph 4.
 */
const ARCHETYPE_AGGRESSION: Record<TypCywilizacji, number> = {
  [TypCywilizacji.Grecy]:             0.40, // Srednia
  [TypCywilizacji.Rzymianie]:         0.75, // Wysoka
  [TypCywilizacji.Chinczycy]:         0.20, // Niska
  [TypCywilizacji.Inkowie]:           0.45, // Srednia (izolacjonizm; offensive when threatened)
  [TypCywilizacji.Zulusi]:            0.90, // Bardzo wysoka
  [TypCywilizacji.Egipt]:             0.35, // not in paragraph 4; reasonable middle
  [TypCywilizacji.Babilon]:           0.30, // not in paragraph 4; reasonable middle
  [TypCywilizacji.DrobnaCywilizacja]: 0.15, // Minor civs rarely initiate war (paragraph 5.2)
};

/**
 * Base trade willingness coefficient per civilization type.
 * Derived from "Tendencja do handlu" column in Dyplomacja-szablon.md paragraph 4.
 */
const ARCHETYPE_TRADE: Record<TypCywilizacji, number> = {
  [TypCywilizacji.Grecy]:             0.75, // Wysoka
  [TypCywilizacji.Rzymianie]:         0.50, // Srednia
  [TypCywilizacji.Chinczycy]:         0.85, // Wysoka (priorytet handel i technologia)
  [TypCywilizacji.Inkowie]:           0.25, // Niska (izolacjonizm)
  [TypCywilizacji.Zulusi]:            0.20, // Niska
  [TypCywilizacji.Egipt]:             0.60,
  [TypCywilizacji.Babilon]:           0.65,
  [TypCywilizacji.DrobnaCywilizacja]: 0.60, // Easy to trade per paragraph 5.2
};

// ---------------------------------------------------------------------------
// aiDiplomacyStance
// ---------------------------------------------------------------------------

/**
 * Returns the AI player's stance toward another player based on:
 *   - Current Relation (Zaufanie + Respekt)
 *   - DIPLOMACY_PARAMS thresholds (sekcja C)
 *   - Civilization archetype tendencies (Dyplomacja-szablon.md paragraph 4)
 *   - Context (military ratio, war duration)
 *
 * Minor civs (DrobnaCywilizacja) use the simplified rule from paragraph 5.2:
 *   - Mostly neutral; rarely initiate war (willingnessWar capped ~0.15)
 *   - Easy to trade when Relacja > 30
 *   - Accept almost everything when player Respekt > 60
 *   - Cannot form military alliances (willingnessAlly = 0)
 *
 * All logic is pure / deterministic.
 */
export function aiDiplomacyStance(
  aiPlayer:    Player,
  otherPlayer: Player,
  rel:         Relation,
  context:     AIDiplomacyContext
): AIDiplomacyStance {
  // Suppress unused-variable warning for otherPlayer (available for future use).
  void otherPlayer;

  const score = relationScore(rel);
  const { zaufanie, respekt } = rel;
  const p = DIPLOMACY_PARAMS;

  // ---- Minor civ simplified path (paragraph 5.2) ----
  if (context.isMinorCiv || aiPlayer.typCywilizacji === TypCywilizacji.DrobnaCywilizacja) {
    // When player Respekt is high, minor civs accept almost anything.
    const fearFactor = respekt > p.progPoboczneAkceptacja
      ? 0.9
      : respekt / p.progPoboczneAkceptacja;

    // Minor civs trade easily when Relacja > 30.
    const tradeOpen = score > p.progPoboczneHandel ? 0.6 : 0.2;

    // Minor civs only fight if pushed very hard (Relacja very low).
    const warWilling = score < p.progPoboczneWojna ? 0.2 : 0.05;

    return {
      willingnessWar:   warWilling,
      willingnessPeace: fearFactor,
      willingnessTrade: tradeOpen,
      willingnessAlly:  0,  // minor civs cannot form military alliances (paragraph 2 table)
    };
  }

  // ---- Full AI path (main civilizations) ----

  const archAggression = ARCHETYPE_AGGRESSION[aiPlayer.typCywilizacji] ?? 0.40;
  const archTrade      = ARCHETYPE_TRADE[aiPlayer.typCywilizacji] ?? 0.50;

  // -- War willingness --
  // Higher Respekt (military superiority) + archetype aggression + low Relacja -> war.
  // Not applicable when already at war.
  let warW = 0;
  if (rel.status !== 'wojna') {
    const respektNorm = respekt / 100;
    const relPenalty  = 1 - clamp(score / 200, 0, 1);
    warW = clamp(
      archAggression * 0.50 +
      respektNorm    * 0.30 +
      relPenalty     * 0.20,
      0, 1
    );
  }

  // -- Peace willingness --
  // High when: weaker militarily, war drags on, or moderate goodwill.
  let peaceW: number;
  if (rel.status === 'wojna') {
    const warWeariness     = clamp(context.turnsAtWar / 20, 0, 0.50);
    const militaryPressure = context.militaryRatio < 1
      ? (1 - context.militaryRatio) * 0.40
      : 0;
    const goodwill = (zaufanie / 100) * 0.20;
    peaceW = clamp(warWeariness + militaryPressure + goodwill, 0, 1);
  } else {
    // Not at war: willing to maintain peace by default.
    peaceW = 0.80;
  }

  // -- Trade willingness --
  // Only above the minimum relation threshold (Relacja >= 30).
  let tradeW = 0;
  if (score >= p.progMinimalnyRelacja) {
    const relFactor = clamp(score / 200, 0, 1) * 0.40;
    tradeW = clamp(archTrade * 0.60 + relFactor, 0, 1);
  }

  // -- Alliance willingness --
  // Requires Zaufanie >= 60 AND Relacja >= 120.
  let allyW = 0;
  if (zaufanie >= p.progSojuszZaufanie && score >= p.progSojuszRelacja) {
    // "Tendencja do lojalnosci" from paragraph 4 influences alliance depth.
    const loyaltyBonus: number =
      aiPlayer.typCywilizacji === TypCywilizacji.Chinczycy ? 0.20  // Wysoka lojalnosc
      : aiPlayer.typCywilizacji === TypCywilizacji.Inkowie ? 0.15  // Wysoka lojalnosc
      : aiPlayer.typCywilizacji === TypCywilizacji.Grecy   ? 0.10  // Srednia
      : aiPlayer.typCywilizacji === TypCywilizacji.Zulusi  ? -0.20 // Niska (rzadkie sojusze)
      : 0;
    const trustFactor  = (zaufanie / 100) * 0.60;
    const scoreFactor  = clamp((score - p.progSojuszRelacja) / 80, 0, 0.30);
    allyW = clamp(trustFactor + loyaltyBonus + scoreFactor, 0, 1);
  }

  return {
    willingnessWar:   parseFloat(warW.toFixed(4)),
    willingnessPeace: parseFloat(peaceW.toFixed(4)),
    willingnessTrade: parseFloat(tradeW.toFixed(4)),
    willingnessAlly:  parseFloat(allyW.toFixed(4)),
  };
}

// ---------------------------------------------------------------------------
// Utility: build a default starting Relation for a pair of players
// ---------------------------------------------------------------------------

/**
 * Creates the initial Relation for two players at game start.
 * Applies:
 *   - startZaufanie (20) + startRespekt (30) as base
 *   - "Rywalizacja tego samego typu (start gry)" -20 Zaufanie when same TypCywilizacji
 *   - "Duza roznica kulturowa (rozny typ)" -5 Zaufanie when types differ and neither minor
 */
export function initialRelation(
  playerA: Player,
  playerB: Player
): Relation {
  const p = DIPLOMACY_PARAMS;
  let zaufanie = p.startZaufanie;

  if (playerA.typCywilizacji === playerB.typCywilizacji) {
    // "Rywalizacja tego samego typu (start gry)" -20 Zaufanie
    zaufanie += p.rywalizacjaTenSamTyp_zaufanie;
  } else if (
    playerA.typCywilizacji !== TypCywilizacji.DrobnaCywilizacja &&
    playerB.typCywilizacji !== TypCywilizacji.DrobnaCywilizacja
  ) {
    // "Duza roznica kulturowa (rozny typ)" -5 Zaufanie
    zaufanie += p.roznicaKulturowa_zaufanie;
  }

  return {
    zaufanie: clamp(zaufanie, 0, 100),
    respekt:  p.startRespekt,
    status:   'neutralni',
  };
}

// ---------------------------------------------------------------------------
// Utility: project RelacjaDyplomatyczna -> Relation
// ---------------------------------------------------------------------------

/**
 * Projects a RelacjaDyplomatyczna (full game-state object) into the slim
 * Relation value object used by this module's pure functions.
 *
 * Status mapping:
 *   StanWojny.Wojna | CasusBelli -> 'wojna'
 *   StanWojny.Rozejm | Pokoj     -> 'pokoj' (or 'sojusz' if treaty present)
 *   default (no war)             -> 'sojusz' if treaty present, else 'neutralni'
 */
export function toRelation(rdip: RelacjaDyplomatyczna): Relation {
  const hasSojusz = rdip.traktaty.some(t => t.rodzaj === 'sojusz_wojskowy');

  let status: Relation['status'];
  switch (rdip.stanWojny) {
    case StanWojny.Wojna:
    case StanWojny.CasusBelli:
      status = 'wojna';
      break;
    case StanWojny.Rozejm:
    case StanWojny.Pokoj:
      status = hasSojusz ? 'sojusz' : 'pokoj';
      break;
    default:
      status = hasSojusz ? 'sojusz' : 'neutralni';
  }

  return {
    zaufanie: rdip.zaufanie,
    respekt:  rdip.respekt,
    status,
  };
}
