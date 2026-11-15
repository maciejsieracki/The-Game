//! Migawka `gra/src/types/hex.ts` z pinu `07d2fbd72` (P6-M01-R2, dispatch R-RUSTPORT-P6-M01-MAPHEX-Q1).
//! Plik zawiera tresc pinu bajt w bajt (4141 bajtow, SHA-256 07eb0ee905c2aac56c1f99127f36fd2a058a9d2822bbc4c92d753d9056867df1).
//! Odtworzenie: `git show 07d2fbd72:gra/src/types/hex.ts | sha256sum`.
//! Uzywany przez `p6_m01_maphex_types.rs` (przez `#[path]`); sam nie zawiera testow.
#![allow(dead_code)]
#![forbid(unsafe_code)]

/// Tresc `gra/src/types/hex.ts` z pinu `07d2fbd72`, bez zmian.
pub const HEX_TS_PIN_07D2FBD72: &str = r###"/**
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
  /** Płytkie morze — teren WODNY (patrz isWaterTerrain w units/setup.ts); nazwa "wybrzeże"
   *  myliła (P-MAPGEN-PANGEA-OBRYS P4, 2026-09-03) — zmieniona na PlytkieMorze/'plytkie_morze'. */
  PlytkieMorze = 'plytkie_morze',
  Morze    = 'morze',
  Pustynia = 'pustynia',
  /** Strefa polarna (śnieg) — niezamieszkana, C-MAP-Q3b. */
  Polarny  = 'polarny',
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
  Droga          = 'droga',
  DrogaBrukowana = 'droga_brukowana',
  Pastwisko      = 'pastwisko',
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
"###;
