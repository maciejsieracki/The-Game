/**
 * unitVitalsPalette.ts
 *
 * JEDNO ŹRÓDŁO PRAWDY dla kolorów pasków ŻYCIA (HP) i RUCHU — używane w DWÓCH
 * miejscach naraz:
 *   1. panel/tooltip jednostki  → ui/hexContextTooltip.ts (paski CSS na kartach stosu),
 *   2. tabliczka nad żetonem    → render/unitStatPlate.ts (paski 3D na mapie).
 *
 * ── DLACZEGO OSOBNY MODUŁ (a nie dwie kopie liczb) ────────────────────────
 * Wymóg właściciela (Maciej, 2026-07-29, R-ZETON-PASKI): „pasek ruchu musi być
 * niebieski, a nie zielony, żeby się odróżniał” — i ma to być TEN SAM niebieski,
 * którego używa już panel jednostki, „żeby mapa i panel nie mogły się rozjechać”.
 * Wartości pochodzą z gradientów, które do 2026-07-29 były WPISANE NA SZTYWNO
 * w bloku CSS w ui/hexContextTooltip.ts:
 *     .sp-unit-stack-bar-hp  i { background: linear-gradient(90deg,#1a6020,#50b070) }
 *     .sp-unit-stack-bar-mov i { background: linear-gradient(90deg,#2a5080,#60a8e8) }
 * Zostały stąd wyciągnięte i oba miejsca importują je teraz z tego pliku.
 *
 * ── DLACZEGO W render/, A NIE W ui/ ───────────────────────────────────────
 * Katalog render/ NIE MOŻE zależeć od ui/ (ui/ wciąga assety przez
 * `import.meta.glob` / `?raw`, dostępne wyłącznie w buildzie Vite, a render/ jest
 * bundlowany także esbuildem w podglądach tools/build-*-preview.cjs). Zależność
 * w drugą stronę (ui/ → render/) już istnieje i jest bezpieczna — np.
 * ui/hexContextTooltip.ts importuje typ z render/improvements.ts, a
 * ui/cityPanel.ts stałe z render/hexutil.ts. Ten moduł jest CZYSTYMI STAŁYMI:
 * nie importuje THREE ani niczego innego, więc jego import nie wciąga do UI
 * ani grama silnika 3D.
 */

// ---------------------------------------------------------------------------
// ŻYCIE (HP)
// ---------------------------------------------------------------------------

/** Ciemny koniec gradientu paska HP w panelu (lewa krawędź paska CSS). */
export const VITALS_HP_DARK_CSS = '#1a6020';
/** Jasny koniec gradientu paska HP w panelu — to jest „zieleń zdrowia” gry. */
export const VITALS_HP_FULL_CSS = '#50b070';

/**
 * Ta sama zieleń jako liczba dla THREE (mapa). Pasek na tabliczce jest jednolity,
 * więc bierze JASNY koniec gradientu panelu — na mapie pasek ma kilka pikseli
 * wysokości i gradient i tak nie byłby czytelny, a ciemny koniec zlewałby się
 * z ciemnym korytem paska.
 */
export const VITALS_HP_FULL = 0x50b070;

/**
 * Dwa DODATKOWE progi ostrzegawcze — WYŁĄCZNIE dla mapy. Panel jednostki podaje
 * liczby („34/48”), więc tam kolor nie musi ostrzegać; na mapie liczb nie ma
 * i jednolita zieleń przy 4/48 HP czytałaby się jak jednostka zdrowa.
 * Progi: > 60% zieleń · 30–60% bursztyn · ≤ 30% czerwień.
 * ŚWIADOMY ROZJAZD Z PANELEM: panel zawsze rysuje zieleń. Gdyby kiedyś miał
 * ostrzegać kolorem, ma użyć tych samych dwóch stałych, nie własnych.
 */
export const VITALS_HP_MID = 0xd9a133;
export const VITALS_HP_LOW = 0xd44b3c;

/** Próg (ułamek HP), poniżej którego pasek robi się bursztynowy. */
export const VITALS_HP_MID_FRAC = 0.60;
/** Próg (ułamek HP), poniżej którego pasek robi się czerwony. */
export const VITALS_HP_LOW_FRAC = 0.30;

// ---------------------------------------------------------------------------
// RUCH — NIEBIESKI (wymóg właściciela: musi się odróżniać od HP)
// ---------------------------------------------------------------------------

/** Ciemny koniec gradientu paska Ruchu w panelu (lewa krawędź paska CSS). */
export const VITALS_MOVE_DARK_CSS = '#2a5080';
/** Jasny koniec gradientu paska Ruchu w panelu — „błękit ruchu” gry. */
export const VITALS_MOVE_FULL_CSS = '#60a8e8';

/**
 * Ten sam błękit jako liczba dla THREE (mapa). NIE dobieraj tu nowego odcienia —
 * gracz ma widzieć w panelu i na mapie dokładnie ten sam kolor „punktów ruchu”.
 */
export const VITALS_MOVE_FULL = 0x60a8e8;

// ---------------------------------------------------------------------------
// Wspólne tło pasków
// ---------------------------------------------------------------------------

/**
 * Koryto paska (część niewypełniona) — bardzo ciemne i NIEPRZEZROCZYSTE.
 * To ono, a nie sam kolor wypełnienia, gwarantuje czytelność paska na każdym
 * terenie: nad wodą (błękit terenu!) i nad śniegiem błękitny pasek Ruchu bez
 * ciemnego koryta zlałby się z tłem. Patrz też PLATE_BORDER_CSS w
 * render/unitStatPlate.ts — obwódka tabliczki dokłada drugi, ciepły kontur.
 */
export const VITALS_TROUGH_CSS = 'rgba(0,0,0,0.62)';
