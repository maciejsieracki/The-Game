/**
 * side-panel-event-link.ts — P-WYDARZENIA-AUDYT-PRZEKIEROWANIA-Q1.
 *
 * ZGŁOSZENIE (właściciel, 2026-08-22): „każde wydarzenie powinno być zweryfikowane, czy nie
 * prowadzi do jakiegoś większego opisu lub miejsca. […] Część rzeczy jest ogólna i informacyjna,
 * ale część wydarzeń powinna być przekierowana do innych miejsc."
 *
 * Ten moduł jest JEDYNYM źródłem prawdy odpowiadającym na pytanie „czy TA karta panelu
 * bocznego prowadzi gdzieś dalej i pod jaką etykietą" — dla DWÓCH konsumentów naraz:
 *   1. `sidePanelHud.ts` — czy narysować widoczny skrót („Pokaż na mapie →") na karcie
 *      NIE-blokującej (dziś takie karty wyglądają identycznie niezależnie od tego, czy
 *      kliknięcie coś robi, czy jest martwe — patrz audyt w raporcie tematu);
 *   2. `main.ts` (`onEventClick`) — do jakiego istniejącego widoku faktycznie skoczyć.
 * Dzięki wspólnemu źródłu afordancja i handler NIE MOGĄ się rozjechać: karta dostaje skrót
 * dokładnie wtedy, gdy klik faktycznie ma dokąd prowadzić.
 *
 * ZAKRES: wyłącznie zdarzenia NIE-blokujące o POTWIERDZONYM, JUŻ ISTNIEJĄCYM miejscu
 * docelowym w grze. Zdarzenia czysto informacyjne (np. `eot-hint-*` — generyczna kolejka
 * końca tury, `edu-veteran-enemy-q3` — porada odsyłająca do dowolnej obcej jednostki na
 * mapie) świadomie NIE mają tu wpisu i zostają bez zmian.
 *
 * EN: single source of truth for "does this side-panel card lead somewhere, and under what
 * label" — shared by the renderer (draws the visible shortcut) and by main.ts (performs the
 * jump), so the affordance and the handler cannot drift apart. Scope: non-blocking events
 * with a CONFIRMED, ALREADY EXISTING destination only.
 */

export type SidePanelEventLinkKind =
  /** `war-*` — panel dyplomacji, lista cywilizacji, z którymi gracz jest w stanie wojny. */
  | 'diplo-wars'
  /** `elim-cs-*` — modal ELIMINACJA! z pełną treścią (civElimNotice.ts). */
  | 'civ-elim'
  /** `border-march-*`, `village-*` — skok kamery na heks, na którym rzecz się wydarzyła. */
  | 'map-focus'
  /** `trade-new-*` / `trade-lost-*` — panel miasta GRACZA będącego końcem szlaku. */
  | 'city-panel'
  /** `auto-ration-t*` — panel imperium, blok „Spichlerz" (treść karty wprost o nim mówi). */
  | 'empire-spichlerz'
  /** `era-*` — drzewo technologii (ten sam widok, który oferuje popup odkrycia epokowego). */
  | 'tech-tree';

export interface SidePanelEventLink {
  kind: SidePanelEventLinkKind;
  /** Etykieta skrótu na karcie; renderer dokleja strzałkę „→". */
  label: string;
}

/** Etykiety skrótów — krótkie, mówiące DOKĄD, nie „kliknij". */
const LINK_LABEL: Record<SidePanelEventLinkKind, string> = {
  'diplo-wars': 'Dyplomacja',
  'civ-elim': 'Szczegóły',
  'map-focus': 'Pokaż na mapie',
  'city-panel': 'Panel miasta',
  'empire-spichlerz': 'Spichlerz',
  'tech-tree': 'Drzewo technologii',
};

export function sidePanelEventLinkLabel(kind: SidePanelEventLinkKind): string {
  return LINK_LABEL[kind];
}

/**
 * Prefiksy id → rodzaj skrótu. Kolejność sprawdzania nie ma dziś znaczenia (prefiksy są
 * rozłączne), ale trzymamy je jako jawną tablicę, żeby dopisanie kolejnego typu było
 * jedną linią, a nie kolejnym `if`-em rozsianym po `main.ts`.
 *
 * ŚWIADOMIE POZA TABLICĄ (kategoria „czysto informacyjne" / „wymaga decyzji produktowej"
 * z audytu tematu):
 *   • `eot-hint-*`   — generyczna kolejka końca tury; jeden wpis nie niesie ŻADNEGO id bytu
 *                      (miasta/jednostki/cywilizacji), tylko gotowy tekst toastu, więc nie
 *                      da się z niego wyprowadzić miejsca docelowego bez zmiany emitera;
 *   • `edu-veteran-enemy-q3` — porada („Kliknij obcą jednostkę po pełną kartę") celuje w
 *                      DOWOLNĄ obcą jednostkę, nie w jedną konkretną;
 *   • zdarzenia blokujące (`revolt-*`, `prod-empty-*`, `diplo-pend-*`, `negot-*`) — mają już
 *                      własny, mocniejszy przycisk „Otwórz →"/„Rozpatrz →" i osobną ścieżkę
 *                      w `onEventClick`; ten moduł ich nie dotyka.
 */
const LINK_BY_PREFIX: ReadonlyArray<readonly [string, SidePanelEventLinkKind]> = [
  ['border-march-', 'map-focus'],
  ['village-', 'map-focus'],
  ['war-', 'diplo-wars'],
  ['elim-cs-', 'civ-elim'],
  ['trade-new-', 'city-panel'],
  ['trade-lost-', 'city-panel'],
  ['auto-ration-t', 'empire-spichlerz'],
  ['era-', 'tech-tree'],
];

/**
 * Statyczny kontrakt: czy id zdarzenia W OGÓLE należy do rodziny mającej miejsce docelowe.
 * `null` = zdarzenie czysto informacyjne albo blokujące (inna ścieżka).
 *
 * UWAGA: to jest wyłącznie warstwa „po id". Czy cel FAKTYCZNIE istnieje w tej chwili
 * (miasto nadal stoi, heks pary został zapamiętany, szczegóły eliminacji są w mapie) —
 * sprawdza `main.ts` osobno, PRZED pokazaniem skrótu. Karta bez gotowego celu nie dostaje
 * afordancji i klik w nią jest no-opem, tak jak dziś.
 */
export function sidePanelEventLinkKind(id: string): SidePanelEventLinkKind | null {
  for (const [prefix, kind] of LINK_BY_PREFIX) {
    if (id.startsWith(prefix)) return kind;
  }
  return null;
}

/**
 * Heks zdarzenia chatki z jego id (`village-<turn>-<q>-<r>`, main.ts). `q`/`r` bywają
 * ujemne (osie axial), `turn` nigdy — stąd asymetria we wzorcu. `null` gdy id nie pasuje.
 * EN: hex of a hut event parsed back out of its id; q/r may be negative, turn never is.
 */
export function villageEventHex(id: string): { q: number; r: number } | null {
  const m = /^village-\d+-(-?\d+)-(-?\d+)$/.exec(id);
  if (m === null) return null;
  return { q: Number(m[1]), r: Number(m[2]) };
}
