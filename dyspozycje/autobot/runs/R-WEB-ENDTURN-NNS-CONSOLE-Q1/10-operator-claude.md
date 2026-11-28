# R-WEB-ENDTURN-NNS-CONSOLE-Q1 (tag ENDNNS) — raport Operatora, runda 1/5

STATUS: PASS-WITH-NOTES (kryterium binarne spełnione w wariancie „opis prób i NIE ZMIERZONO”; pomiar stanu c NIE wykonany)
DOMAIN: GAME (pomiar, zero zmian gra/src)
TEMAT: R-WEB-ENDTURN-NNS-CONSOLE-Q1
GOAL: konsola „Zakończ turę” w stanie blokady NNS (stan c) PRZED (6afdec814) vs PO (d7b4dd3a9) FALI 934 + maksimum ustawień z kodu
BAZA: origin/main d7b4dd3a9af2df6057a2965991c788bfa406559b (worktree w trybie detached)

## ZMIANY/COMMIT

- Nowe: `gra/tools/endturn-nns-console.cjs` (narzędzie pomiaru; okno konsoli bez kliknięć i bez `gateInfo()`).
- Nowe: `dyspozycje/analizy/KONIEC-TURY-NNS-KONSOLA-2026-11-27.md` (wynik, próby, NIE ZMIERZONO).
- Nowe: `dyspozycje/autobot/runs/R-WEB-ENDTURN-NNS-CONSOLE-Q1/` — `readback-ustawien-maksimum.txt`, dwa logi faz i dwa pliki JSON prób.
- `gra/src/**`, `gra/data/**`, WERSJE.md, manifest: bez zmian. Brak `git add -A`, brak push.
- SHA commita: patrz pole `sha` w StructuredOutput (commit wykonany po zapisie raportu).

## MAKSIMUM USTAWIEŃ (z kodu, do readback)

- Rozmiar mapy: **Super Huge** (ostatnia opcja; ~80000 hex) — data/ui-params.json.
- Prędkość gry: **Długa** (4× koszt badań, najdłuższa gra).
- Rywale: miasta-państwa **9** (MAX_MIAST_PANSTWA, newGameMapDefaults.ts:528) oraz liczba cywilizacji **15** (MAX_TYPY_CYWILIZACJI_MENU, :547). NIEJEDNOZNACZNE, który suwak to „rywale”; oba zapisane.
- Limit miast (baza): **20** (newGameFlow.ts:1877).
- Trudny / barbarzyńcy Trudny / kultura trudny / dyplomacja trudna / Wysoki x4 budynki / Wysoki jednostki i ludność / Długi ruch x6.
- Uwaga: wcześniejsze pomiary ENDCLICK użyły `Maly`, `Normalna`, rywale 2, limit 10 — nie były maksimum.

## TESTY / BRAMKI

- `tsc --noEmit` (gra/): EXIT 0, 0 linii wyjścia (surowe wyjście).
- logic 213 i ai-test 297/0: NIE URUCHOMIONO (gra/src bez zmian; nie było powodu do przebiegu w tej rundzie; wymagane przez dispatch — orkiestrator decyduje, czy dopiąć).
- Pomiar stanu c (PRZED/PO, seed 4242 i 7): NIE ZMIERZONO. Szczegóły prób poniżej.

## PRÓBY POMIARU (wszystkie na PO d7b4dd3a9, seed 4242)

1. P1 — Super Huge, czekanie na `[ClusterStart]` 600 s: brak sygnału, po 600 s strona zamknięta (`Target page, context or browser has been closed`). Log: `runs/.../log-PO-superhuge-s4242.txt`.
2. P2 — Ogromny (~20000 hex), czekanie 60/400 s: `[ClusterStart]` nie pojawił się; `awaitingFirstCity` było prawdziwe już na świecie podglądu, więc nie potwierdza nowej gry.
3. P3 — Ogromny, klik tury 1: przycisk przykryty przez `DIV.civ-map-load-overlay` (elementFromPoint) przez >5 min. Brak kliku, brak tury 2, brak stanu c. Log: `runs/.../log-PO-ogromny-s4242.txt`.
- Nie uruchomiono PRE (6afdec814) ani ziarna 7: bez działającego przejścia do stanu c nie było czego porównywać. Bundle PRE zbudowany (z `git archive` 6afdec814) i usunięty po pracy.

## BLOKADY

- Super Huge nie dochodzi do świata nowej gry w ~10 min (headless). Nieustalona przyczyna: czas generacji czy pad Chromium.
- Ogromny: overlay ładowania mapy (`src/ui/mapLoadingOverlay.ts`) nie znika w headless w ciągu 5 min; sygnał `[ClusterStart]` nie działa jako warunek gotowości w tej ścieżce.
- Zakaz `run_in_background`: dwa przebiegi przekroczyły 590 s foreground i harness sam przeniósł je do tła (bez mojego `run_in_background`). Oba zakończyły się przed raportem; żaden nie jest uruchomiony.
- Procesy Chromium: po przebiegach nie znaleziono osieroconych procesów powiązanych z tą pracą (sprawdzone po ścieżce skryptu). Inne procesy chrom na maszynie należą do innych sesji — nie ruszane.

## RUNDY

1/5. Brak drugiej rundy: kolejna runda wymaga decyzji orkiestratora (sekcja NASTĘPNY KROK).

## UWAGI-DLA-ORKIESTRATORA

- Poprzedni raport ENDCLICK (KONIEC-TURY-KLIK-NA-ZYWO) i jego dane nie są na maksimum mapy/prędkości; tabela rozdziału „Ustawienia” tam wymaga korekty.
- Do decyzji: „rywale” = miasta-państwa 9 czy liczba cywilizacji 15 (oba sufitami z kodu).
- Do decyzji: czy pomiar stanu c dopuścić na mapie `Ogromny` (zmierzona gotowość świata niepewna) jako opis „nie-maksimum”, czy najpierw naprawić ścieżkę gotowości na Super Huge.
- Zgłoszenie do rozważenia (nie wdrażane): overlay ładowania mapy utrzymuje się w headless >5 min na świecie nowej gry — możliwy problem gotowości w testach, nie błąd gry ustalony.

## NASTĘPNY KROK

Orkiestrator: (1) zdecydować o mapie dla pomiaru stanu c; (2) jeśli Super Huge jest wymagane — osobny temat na przyczynę braku gotowości świata (generacja vs pad Chromium); (3) po zielonym przebiegu stanu c na obu buildach — tabela PRZED/PO dla ziaren 4242 i 7.

DEPLOY/PUSH: NIE WYKONANO
