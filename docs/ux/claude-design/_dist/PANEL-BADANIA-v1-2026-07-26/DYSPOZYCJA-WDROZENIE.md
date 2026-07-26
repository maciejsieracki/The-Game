# DYSPOZYCJA — PACZKA „PANEL-BADANIA-v1" (2026-07-26)
Odpowiedź na `dyspozycje/DO-DESIGN-EKRAN-BADAN-2026-07-25.md`. Zlecenie 1 z 4 z tury 2026-07-25.

## Wgranie → `docs/ux/claude-design/01-propozycje-z-design/brand-book/`
| Plik | Uwaga |
|---|---|
| KANON/mockupy/The Game - Panel boczny Badania v1 (1E).dc.html | NOWY KANON — 4 klatki |
| KANON/mockupy/support.js | runtime (jeśli brak) |
| KANON/CANON.md · KANON/START….dc.html · WYMIANA-UI-DESIGN.md | NADPISZ — §3.2 wykonane |
| standalone/Panel boczny Badania v1 - STANDALONE.html | podgląd za proxy |

Commit: `PANEL BADANIA v1 → KANON (DO-DESIGN-EKRAN-BADAN) + sprzątanie KANON`
Wymaga w repo: `eksport/icons/tech/` (32 ikony, dostarczone 2026-07-23) + `eksport/icons/tier2/tb-science-24.svg`.

## Odpowiedzi na pytania (§4)
- **C-DESIGN-BADANIA-Q1 = A** — stary `Ekran Badania (1E).dc.html` dostaje „(stare)"; karta „Badania"
  w hubie i wiersz w CANON.md wskazują teraz na nową makietę. **Wykonane w tej paczce**, nie trzeba nic robić ręcznie.
- **C-DESIGN-BADANIA-Q2 = B, z jednym zastrzeżeniem** — legacy `sciencePicker.ts` zostaje osobnym tematem,
  ALE odpala się z sekcji „Wkrótce" tego panelu, więc gracz dostaje skok do sprzecznego świata wizualnego
  wprost z ekranu, który właśnie porządkujemy. Zalecenie: do czasu ujednolicenia przekierować „Wkrótce"
  na **siatkę v1.1** (`techTreeView`, przewiniętą do węzła) — zmiana jednej linii wywołania, bez ruszania renderera.
- **C-DESIGN-BADANIA-Q3 = A** — Klatka D dostarczona (numerek planu na węźle siatki).

## Co jest w makiecie (4 klatki)
**A · Panel w kontekście** — 340px zadokowany do lewej (top 56 / bottom 56+2mm, `left: calc(58px+10px)`),
na tle mapy, z podświetlonym przyciskiem „Nauka" w toolbarze. Kolejność bloków 1:1 z `render()`:
nagłówek+X → postęp aktywnego celu (ikona, nazwa, „Pula 87/136 PN · 64% · ETA 6 tur · +17 PN/t", pasek) →
złoty przycisk „Drzewo technologii" → Plan badań (3/3) → „Możesz wybrać" (5) → „Wkrótce · zablokowane" → hint.

**B · Plan badań — 3 stany**: pusty (ramka przerywana + plus, nie komunikat błędu) · 1 pozycja
(+ **wolne miejsca jako przerywane wiersze 2 i 3** — nowość: dziś widać tylko licznik n/3) ·
drag&drop (wiersz źródłowy 40% + uchwyt, wiersz docelowy niebieski ring `#5a9bd4` + „TU UPUŚĆ").
Pozycja 1 dodatkowo dostaje chip **„BADA SIĘ"** — samo tło za słabo ją odróżniało.

**C · Wiersz listy — 6 stanów**: domyślny · hover (**ujawnia akcję „+ PLAN"** — dziś klik enqueue'uje
bez żadnej wizualnej obietnicy) · **focus-visible** (nowy, dziś nie istnieje) · w planie (numerek 1/2/3) ·
zablokowany (kłódka + powód + chevron „pokaż w drzewku") · pusta lista.

**D · Numerek planu na węźle siatki v1.1** — krążek w **lewym górnym** rogu węzła (prawy zajęty
przez badge stanu ✓/chevron/zegar/kłódka), ten sam gradient co w panelu + 2px ciemna obwódka,
bo leży na krawędzi karty. Widoczny wyłącznie gdy tech jest w planie.

## Ikony — wyłącznie realne pliki brandu (zero rysowania od nowa)
| Miejsce w panelu | Plik | Dziś w kodzie |
|---|---|---|
| Nagłówek „Badania" | `eksport/icons/res-science.svg` (= `tier1/res-science-24.svg`, sowa z biretem) | `scienceOwlIconHtml()` — **ta sama grafika**, zmienia się tylko kolor na `#e8d88a` |
| Zamknij (X) + × w wierszach planu | `eksport/icons/ui-close.svg` | `brandIconSvg('ui-close', 20/16)` — bez zmian |
| Wiersze „Wkrótce" | `eksport/icons/ui-lock.svg` | `brandIconSvg('ui-lock', 20)` — bez zmian |
| Technologie (postęp, plan, lista) | `eksport/icons/tech/tech-<slug>.svg` | `techIconSvg()` — bez zmian |
| Przycisk „Drzewo technologii" | **propozycja zmiany**: ikona grafu (4 węzły + krawędzie) zamiast `res-science` | dziś `brandIconSvg('res-science', 20)` — czyli **ta sama sowa co nagłówek**, przycisk czyta się jak duplikat tytułu |

Uwaga dla integratora: w makiecie ikony wstawione jako `<img>`, więc nie dziedziczą `currentColor` — w kodzie zostaje
dotychczasowy mechanizm `brandIconSvg()` + `currentColor` (X wyciszony `#8a8070`, kłódka przygaszona przez `opacity` wiersza).

## Zmiany wizualne do wdrożenia w `scienceHubHud.ts`| Dziś w kodzie | Docelowo |
|---|---|
| `--gold:#e0b24a` | `#e8d88a` (1E), gradient krążków `#f0dc88→#c9a938`, tekst na krążku `#2e2708` |
| `--sci:#6bc4e8` jako akcent tytułów i sekcji | tokenowy `#5a9bd4`/`#8fb6e0` **tylko** na pasku postępu i ringu drop-target; tytuły/sekcje na złocie i `#8a8070` |
| `--panel:#1e2430` płaski | `linear-gradient(180deg,rgba(22,28,38,.95),rgba(10,13,20,.96))`, `border-radius:8px`, obwódka `rgba(232,216,138,.28)` |
| Nazwy technologii Segoe UI bold | **Georgia/serif** (jak w siatce v1.1 i całym 1E) |
| Licznik w nagłówku sekcji „Możesz wybrać (5)" | etykieta lewo / licznik prawo, `letter-spacing:.16em` |
| `sh-hint` 2 linie kursywą w środku panelu | 1 linia, `9.5px`, oddzielona kreską, na dole karty listy |
| brak `:focus-visible` | `outline:2px solid #f4e6a8; outline-offset:2px` na wierszach i pozycjach planu |

## Poza zakresem (świadomie)
Pełnoekranowa siatka v1.1 — bez zmian (poza opcjonalnym numerkiem z Klatki D).
Legacy `sciencePicker.ts` — osobny temat (Q2=B).
