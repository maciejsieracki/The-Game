/**
 * hex.ts
 * Typy opisujące pojedynczy heks mapy (tile/pole).
 * Model dwuwarstwowy: teren bazowy + nakładka (las / złoże / rzeka).
 */

// ---------------------------------------------------------------------------
// Enumeracje
// ---------------------------------------------------------------------------

/** Typ terenu bazowego heksa. */
export enum TerenBazowy {
  Laka     = 'laka',
  Rownina  = 'rownina',
  Wzgorza  = 'wzgorza',
  Gory     = 'gory',
  Wybrzeze = 'wybrzeze',
  Morze    = 'morze',
  Pustynia = 'pustynia',
}

/**
 * Nakładka na teren bazowy (las, złoże surowcowe lub brak).
 * Las i złoża to warstwa nad terenem — las daje drewno i modyfikuje plony.
 */
export enum Nakladka {
  Brak       = 'brak',
  Las        = 'las',
  ZlozeGliny = 'zloze_gliny',
  ZlozeRudy  = 'zloze_rudy',
  ZlozeKonia = 'zloze_konia',
  ZlozeOwiec = 'zloze_owiec',
  ZlozeBydla = 'zloze_bydla',
  ZlozeLamy  = 'zloze_lamy',   // tylko Inkowie / Ameryka Pd.
}

/**
 * Ulepszenie terenu zbudowane przez Robotnika.
 * Budowane w terenie — nie w kolejce produkcji miasta.
 */
export enum Ulepszenie {
  Brak      = 'brak',
  Farma     = 'farma',
  Irygacja  = 'irygacja',
  Kopalnia  = 'kopalnia',
  Droga     = 'droga',
  Pastwisko = 'pastwisko',
  Tartak    = 'tartak',  // tartak terenowy (rozny od budynku miejskiego)
}

/**
 * Stan widocznosci heksa z perspektywy danego gracza (fog of war).
 * Sprawdzany per-gracz.
 */
export enum Widocznosc {
  Nieodkryty = 'nieodkryty',  // nigdy niewidziany — czarna chmura
  Odkryty    = 'odkryty',     // kiedys widziany, poza zasiagiem — szara chmura
  Widoczny   = 'widoczny',    // aktualnie w polu widzenia jednostki/miasta
}

// ---------------------------------------------------------------------------
// Interfejsy
// ---------------------------------------------------------------------------

/** Wspolrzedne aksjalne heksa (uklad q, r). s = -q-r (nie przechowujemy). */
export interface HexCoords {
  readonly q: number;
  readonly r: number;
}

/**
 * Wioska na heksie.
 * Kazdy zamieszkiwalny heks (>=1 zywnosci) startuje z 1 wioska i 1 ludnoscia.
 * Wioska jest warunkiem koniecznym do zalozenia miasta (par. 8a).
 */
export interface Wioska {
  /** Czy na tym heksie istnieje wioska. */
  istnieje: boolean;
  /** Liczba ludnosci przypisana do wioski (0 gdy brak lub niezamieszkaly teren). */
  ludnosc: number;
}

/**
 * Rzeka na krawedziach heksa.
 * Rzeka biegnie krawedziami (nie centrum) — zapisujemy flage ogolna
 * i indeksy krawedzi (0–5, flat-top hex convention).
 */
export interface RzekaInfo {
  /** Czy heks ma rzeke na ktorymkolwiek ze swoich krawedzi. */
  obecna: boolean;
  /**
   * Ktore krawedzie heksa granicza z rzeka (indeksy 0–5, flat-top).
   * Pusta tablica gdy obecna = false.
   */
  krawedzie: number[];
}

/**
 * Pojedynczy heks mapy swiata.
 * Wszystkie pola sa zawsze obecne — domyslne wartosci ustawia generator mapy.
 */
export interface Hex {
  /** Pozycja na mapie (wspolrzedne aksjalne). */
  coords: HexCoords;

  /** Typ terenu bazowego. */
  terenBazowy: TerenBazowy;

  /**
   * Nakladka na teren (las, zloze lub brak).
   * Las: -1 zywnosci, -1 handel, +3 drewna; zloze: dostep do surowca.
   */
  nakladka: Nakladka;

  /** Ulepszenie zbudowane przez Robotnika (farma, kopalnia, droga…). */
  ulepszenie: Ulepszenie;

  /**
   * Wlasciciel heksa — playerId lub null gdy niczyje.
   * Zmienia sie przy podboju / ekspansji kulturowej.
   */
  wlasciciel: string | null;

  /** Wioska i jej ludnosc. */
  wioska: Wioska;

  /**
   * Widocznosc per gracz.
   * Klucz = playerId; nieobecnosc klucza = Nieodkryty.
   */
  widocznosc: Record<string, Widocznosc>;

  /** Informacja o rzece na krawedziach. Bonus: +3 zywn / +2 Praca / +2 Handel. */
  rzeka: RzekaInfo;
}
