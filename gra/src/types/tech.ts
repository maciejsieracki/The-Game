/**
 * tech.ts
 * Stan drzewka technologicznego gracza.
 * Lista technologii i ich prereqow pochodzi z data/tech.json.
 */

// ---------------------------------------------------------------------------
// Enumeracje
// ---------------------------------------------------------------------------

/**
 * Identyfikatory wszystkich technologii (v0.1 = Kamien + Braz).
 * Kolejnosc odpowiada poziomom w drzewku (data/tech.json, pole "Poziom").
 */
export enum TechId {
  // Epoka Kamienia — Poziom 1
  ObrobkaDrewna    = 'obrobka_drewna',
  Garncarstwo      = 'garncarstwo',
  Murarstwo        = 'murarstwo',
  Lucznictwo       = 'lucznictwo',
  OswojenieZwierzat = 'oswojenie_zwierzat',

  // Epoka Kamienia — Poziom 2
  Kolo             = 'kolo',
  Brazownictwo     = 'brazownictwo',

  // Epoka Brazu — Poziom 2–5
  Zegluga          = 'zegluga',
  Pismo            = 'pismo',
  Religia          = 'religia',
  Jezdziectwo      = 'jezdziectwo',
  Matematyka       = 'matematyka',
  Handel           = 'handel',
  PrawoKodeks      = 'prawo_kodeks',
  Budownictwo      = 'budownictwo',
  Waluta           = 'waluta',       // konczy Epoke 2; odblokuje Pieniadz wlasciwy
}

// ---------------------------------------------------------------------------
// Glowny interfejs
// ---------------------------------------------------------------------------

/**
 * Stan drzewka technologicznego gracza.
 * Technologie sa zbadane natychmiast po osiagnieciu kosztu (KosztNauki z tech.json).
 */
export interface TechState {
  /** Lista id technologii juz calkowicie zbadanych przez tego gracza. */
  zbadane: TechId[];

  /**
   * Id technologii aktualnie badanej.
   * null = gracz nie wybral technologii do badania.
   */
  badana: TechId | null;

  /**
   * Punkty nauki zainwestowane w aktualnie badana technologie.
   * Po osiagnieciu KosztNauki tech przechodzi do `zbadane`, `badana` = null, `postep` = 0.
   */
  postep: number;
}
