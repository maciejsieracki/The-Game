# DYSPOZYCJA — PACZKA „DRZEWKO-TECH-v1" (2026-07-23)
Odpowiedź na ZLECENIE 3 (GŁÓWNE) z DYSPOZYCJA-DLA-DESIGN-TURA-2.md.

## Zawartość → dokąd
Wgraj do `docs/ux/claude-design/01-propozycje-z-design/brand-book/` (struktura paczki = docelowa):

| Plik | Dokąd | Uwaga |
|---|---|---|
| `brand-book/KANON/mockupy/The Game - Drzewko technologii graf v1 (1E).dc.html` | `.../KANON/mockupy/` | NOWY — 3 klatki |
| `brand-book/KANON/mockupy/support.js` | `.../KANON/mockupy/` | tylko jeśli brak |
| `brand-book/KANON/CANON.md` | `.../KANON/` | NADPISZ (wiersz: Badania — GRAF) |
| `brand-book/KANON/START - KANON aktualny (1E).dc.html` | `.../KANON/` | NADPISZ (karta ★ Badania · GRAF) |
| `WYMIANA-UI-DESIGN.md` | katalog statusu | NADPISZ (log) |

Commit: `DRZEWKO TECHNOLOGII graf v1 → KANON (Zlecenie 3, TURA 2)`
Wymaga w repo: `eksport/icons/epochs/` (ikony epok — makieta czyta `../eksport/icons/epochs/*.svg`; dojechały w paczce PREBATTLE).

## Co jest w makiecie (3 klatki)
1. **PRZEGLĄD** — 32 technologie 1:1 z `gra/data/tech.json`, oś liniowa wg Poziomów 1–9, pasma epok
   (Kamień P1–3 · Brąz P4–6 · Żelazo P7–9) rozdzielone strefami. Stany: ODKRYTA (złota, ✓) /
   DOSTĘPNA (jasna obwódka + glow, klik) / W TRAKCIE (pierścień % + pasek, przykład: Matematyka 64%) /
   ZABLOKOWANA (wyszarzona + kłódka + powód — brak techa-rodzica LUB brak budynku, np. „wymaga
   budynku: Piec hutniczy" dla Hutnictwa). Gwiazdki awansu epok (Brązownictwo ★, Hutnictwo ★, Waluta ★, Sztuka wojenna ★).
2. **KARTA WĘZŁA** — hover/klik: nazwa, epoka+Poziom, koszt PN (z mnożnikiem tempa ×1/×2/×4),
   tury do końca przy bieżącym tempie, zależności AND (✓/✗), chipy odblokowań (budynki/jednostki/surowce), stopka akcji.
3. **NAWIGACJA** — zoom-pill (−/%/+/dopasuj), pasek epok = szybki skok, minimapa drzewa z ramką
   viewportu, „Pokaż ścieżkę do: Sztuka wojenna" — podświetlony pełny łańcuch zależności (AND-closure), reszta wygaszona.

## Krawędzie i przecięcia (decyzja projektowa — do wiadomości integratora)
Graf z tech.json to DAG z bramkami AND (43 krawędzie, wiele multi-prereq) — bogatszy niż drzewo
z referencyjnej makiety „bez przecięć" (tam prereqi były zredukowane do pojedynczych). Zastosowano:
- trasowanie magistralowe per-źródło (szyna w rynnie + odnogi) + korytarz międzyepokowy,
- programową minimalizację przecięć (permutacje kolejności szyn per rynna — wybór wariantu o min. koszcie),
- na rezydualnych przecięciach **MOSTKI** (łuk-przeskok jak w schematach elektrycznych) —
  0 dwuznaczności odczytu; badge w nagłówku pokazuje realną liczbę („Przecięcia zmostkowane: N").
Jeśli silnik gry ułoży węzły inaczej (np. force-layout), zasada zostaje: mostek na każdym przecięciu.

## Weryfikacja po wgraniu
START hub → karta „★ Badania · GRAF drzewa v1" → 3 klatki; krawędzie widoczne, badge z liczbą, minimapa w klatce C.

## Status pozostałych zleceń TURY 2
- Zlecenie 4 (CUDA ŚWIATA): w przygotowaniu — dane z wonders.json (19 cudów) wciągnięte, makieta jutro/następna paczka.
- Zlecenie 5 (KANON-SYNC-6): WYSŁANE osobną paczką.
- Zlecenie 6 (PORTRETY ŻELAZA): czeka na arkusz od Macieja.
