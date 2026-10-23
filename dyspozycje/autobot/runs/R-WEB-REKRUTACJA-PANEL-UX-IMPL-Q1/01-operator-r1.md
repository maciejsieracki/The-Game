STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-REKRUTACJA-PANEL-UX-IMPL-Q1
GOAL: Wariant A panelu „Rekrutacja” (web): wiersz jednostki w jednej linii (~32 px), pula rekrutów jedną linią nad listą, na wierszu „potrzebne” + „brak N”; działa przy 340/307/280 px.
ZMIANY/COMMIT: `gra/src/ui/unitRecruitCard.ts`, `gra/src/ui/cityPanel.ts` (+16 linii w `renderPurchasableUnits`: linia `.unit-recruit-pool`), `gra/tools/recruit-card-manpower-real-render-test.cjs`, `gra/tools/recruitment-panel-height-real-render-test.cjs`, `gra/tools/recruitment-panel-compact-row-test.cjs` (NOWY), ten katalog runu. `hudLayout.ts`/`cityUxFrame.ts` nietknięte. SHA: w odpowiedzi Operatora (commit lokalny, bez push).
TESTY: niżej.
BLOKADY: brak.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator → Obrona → Final Control.
DEPLOY/PUSH: NIE WYKONANO

Rola: Operator · Opus 5.5 medium · baza `origin/main` `c11f5087`.

## Co zrobione

- Wiersz (`unitRecruitCard.ts`, CSS): flex w jednej linii: ikona · kolumna tekstu · stepper `−[n]+` · Rekrutuj. Kolumna tekstu ma dwie drobne linie: (1) nazwa (wielokropek, pełna nazwa w `title`) … wskaźnik rekrutów; (2) koszt: złoto + chipy surowców poziomo (+ utrzymanie) · typ · epoka. Meta (typ · epoka) skraca się pierwsza.
- Rekruci: `.unit-recruit-manpower` zostaje na każdym wierszu z `data-available/required/missing`. Widać ikonę SVG i liczbę POTRZEBNYCH, a przy braku czerwone `brak N` (`#e88a7a`). Tooltip: `Rekruci: dostępne X / potrzebne Y[ — brakuje N]`. Pula państwa jest raz nad listą: `Rekruci: dostępne 1 mln` (`cityPanel.ts`, `.unit-recruit-pool`). Emoji 👤 zastąpione ikoną SVG.
- Container query na wierszu (≤ 300 px treści, czyli panel ≤ 340 px): utrzymanie chowane (zostaje w DOM i w karcie szczegółów), przycisk jako ikona (etykieta „Rekrutuj” zostaje w DOM, w `aria-label` i `title`). Na nieaktywnych wierszach stepper jest ukryty (był `disabled`).
- Bez zmian: callback rekrutacji, bramki (złoto/rekruci/surowiec), `maxQuantity`, klawisze, `title` z przyczyną blokady, `attachHoverDetail`.

## ZAŁOŻENIA

- Z1: Czysta „jedna linia” (koszt jako osobna kolumna obok nazwy) dała przy 340 px **12/13 uciętych nazw** (pomiar tego runu, 1. iteracja). Dlatego koszt jest drugą drobną linią kolumny tekstu, w tym samym wierszu ≤ 36 px.
- Z2: Ikona zamiast etykiety „Rekrutuj” już przy 340 px, zgodnie z makietą A (≤ 400 px). Z etykietą przy 340 px były **3/13 ucięte nazwy** (> 2).
- Z3: „Blok Produkcji” to realna ramka miasta (`showCityPanel`) z 3 pozycjami w kolejce rekrutacji, okno 1080 px.
- Z4: Sekcje KONTEKST i BINARNE KRYTERIUM w dispatchu (pomiar tur 70–80, determinizm) są skopiowane z tematu o spowolnieniu. Stosuję kryteria z GOAL.

## Pomiar (`recruitment-panel-compact-row-test.cjs`, Chromium, 13 jednostek, okno 1080 px)

| panel | wys. wiersza max | widoczne 13/13 | ucięte nazwy | poziomy scroll |
|---|---|---|---|---|
| przed (`origin/main`) 340 | 171–190 px | 3/13 | 11/13 | – |
| po 340 | 34,3 px | 13/13 | 1/13 | 0 |
| po 307 | 34,3 px | 13/13 | 3/13 | 0 |
| po 280 | 34,3 px | 13/13 | 5/13 | 0 |

Kontrola negatywna `--baseline origin/main`: 18 fail, K1/K2/K3 czerwone. Logi: `compact-row-test-po.log`, `compact-row-test-przed-baseline.log`. Zrzuty `zrzuty/przed-*` i `zrzuty/po-*` (340/307/280 + 280 z brakiem rekrutów), 113–169 KB.

## Zmienione asercje (było → jest)

- B2: summary = `Rekruci: dostępne 0 / potrzebne R` → summary = `R` **i** title = `Rekruci: dostępne 0 / potrzebne R — brakuje R`.
- B3: `Brakuje: R` → `brak R`, widoczny, kolor `rgb(232,138,122)`.
- B8: summary = `Rekruci: dostępne P / potrzebne R` → summary = `R` i title z `— brakuje M`.
- B9: `Brakuje: M` → `brak M`, widoczny, `data-missing` = M.
- B12: summary pełny tekst → summary = `R`, title bez „brakuje”.
- B1 bez zmian (widoczny status). Mutacja `--mutate`: 10 fail (było 10).
- height `:382–383`: `/Rekruci: dostępne/` zostaje. Dodane: dokładnie 1 linia `.unit-recruit-pool` oraz 1 wystąpienie tekstu. `manpowerStatusCount` liczy teraz tylko WIDOCZNY status z `data-required` i pełnym tooltipem.
- height `recruitButtonCount`: wszystkie `button` w wierszu → `.unit-recruit-submit`. Na `origin/main` ta asercja była czerwona: 3 przyciski na kartę ≠ liczba kart.
- height „dokładnie jeden scrollbar” (duży viewport) → „≤ 1, tylko lista”: 13 kart mieści się teraz bez przewijania. Mały viewport nadal wymaga przewijania listy.

## Testy

- compact-row 38/0
- manpower 20/0 (mutacja 10 fail)
- height 12/0 (na `origin/main` 10/2)
- quantity 25/0
- stock-chip 15/0
- resource-strip 18/0
- unit-recruit-nazwa 17/0
- city-panel-growth 29/0
- citypanel-konwerter 83/0
- citypanel-uwagi-abc 44/0
- citypanel-uwagi-hostcard 12/0
- spichlerz-cap 12/0
- entity-card-contract 75/0
- side-list-hud 74/74
- `tsc --noEmit` 0 błędów
- direct Vite build do scratch: OK (1 min 15 s), katalog usunięty

UWAGA: `hud-tooltip-body-mounted-panels-test` (panel Imperium `.civ-emp-info-tip`) daje 13/3, a w 1. biegu TIMEOUT. Diff nie dotyka tego panelu ani `hudTitleTooltip`. Bieg bazowy na `origin/main` padł na ENOSPC (dysk pełny), więc baseline to NIE_ZMIERZONO. Harnessy `pr141-*` NIE_URUCHOMIONE: zachowane są `.unit-compact-cost` (pierwszy węzeł = złoto), `data-*` i `.unit-recruit-manpower-summary`.
