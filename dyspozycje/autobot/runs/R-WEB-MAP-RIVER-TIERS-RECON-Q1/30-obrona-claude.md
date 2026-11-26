STATUS: BLOCK
DOMAIN: GAME (recon, bez zmian kodu gry)
TEMAT: R-WEB-MAP-RIVER-TIERS-RECON-Q1
GOAL: dokument faktów pod zmianę generatora rzek (trzeci poziom + 2× źródeł), zero zmian w gra/**
ZMIANY/COMMIT: dyspozycje/analizy/MAPA-RZEKI-POZIOMY-I-LICZBA-2026-11-26.md (poprawiony po zarzutach, nowa sekcja 9 z surowymi wyjściami) + ten raport. Baza obrony: f24beaba1 (kod gry bez zmian). SHA czubka: pole sha w odpowiedzi.
TESTY:
- Ponowny pomiar (ZMIERZONO, kopia scratch, esbuild@0.28.2, load ~3 na 4 rdzeniach):
  - 84×60 s1 V0: 47/25/8 tras, hex 425/273/98, 11 872 ms, nonAdjacentPaths 0 (zgodne z tabelą 3.1).
  - 168×120 s42 V0: 120/42/67 tras, hex 1423/580/1023, 128 591 ms, visibleDefault 162.
  - 168×120 s42 V3 (RIVER_PATHSEP=1): 270/29/15 tras, hex 3193/329/200, 128 223 ms, visibleDefault 299.
  Surowe linie JSON: sekcja 9 dokumentu.
- Zarzuty 1–5 Evaluatora: patrz ODPOWIEDZI NA ZARZUTY.
- Testy rzek uruchomione w rundzie 3 (medium-river-test 38/0 itd.) — bez zmian w tej obronie, nie odtwarzane.
- `git status`: tylko dwa pliki allowlisty; gra/** nietknięte.

ODPOWIEDZI NA ZARZUTY (raport Evaluatora na f24beaba1):

1. PRZYJMUJĘ Z POPRAWKĄ. Przypis 3.1 odsyłający do `10-operator-claude.md` r2 i do „surowych wyjść w sekcji 7” usunięty; sekcja 7 nie była źródłem hexów. Dodano sekcję 9 z surowymi wyjściami dla 84×60 s1 (V0) i 168×120 s42 (V0 i V3), odtworzonymi w tej obronie. Hexy dla 168×120 s1/s7/s99/s2026, 240×168 (V0 i V1–V3) oraz V1/V2 nie są podparte i zostały oznaczone NIE ZMIERZONO w obronie. Zauważono: tabela 3.1 zawiera tylko liczby tras, hexy nie są w niej.
2. PRZYJMUJĘ. Pkt 6 dispatchu NIE jest spełniony w pełni. Dokument oznacza to jawnie (sekcja 6 i 8): nieuruchomione river-path-adjacency-test, river-grid-coverage-test, map-gen-regression-test, river-map-scale-test, map-continents-rivers-test, world-density-test, river-turn-window-test, river-fog-visibility-test. Lista pinów jest niepełna. Nie uruchamiano ich w tej obronie (limit czasu 590 s na wywołanie, brak czasu na 8 ciężkich testów).
3. PRZYJMUJĘ. Czasy są pojedynczymi przebiegami na maszynie z load ~3 (4 rdzenie). Dodano czasy z obrony (168×120 s42: V0 128,6 s, V3 128,2 s) jako kierunkowe. Porównanie z r1–r2 (123 s nieobciążony) potwierdza zgodność rzędu wielkości, nie dowodzi czystego pomiaru. Teza „V1 najdroższy, V3 nie podnosi kosztu” pozostaje kierunkowa; dla 240×168 nadal NIE ZMIERZONO w obronie.
4. PRZYJMUJĘ. Brak V2 dla „Pangea” oznaczono jako NIE ZMIERZONO; dopisano, że dla map stałych (Ziemia, Pangea) NIE MA ilościowej rekomendacji „2×” (dane z jednego ziarna 168×120, bez powtórzeń).
5. PRZYJMUJĘ. Deklaracja „brak +12%” zastąpiona sformułowaniem: deklaracja z commita NIE POTWIERDZONA i NIE OBALONA; 6 przebiegów 84×60 (11 243 vs 11 265 ms, różnica 0,2%) to za mało, by rozstrzygnąć. Zmieniono też streszczenie (pkt 4) i sekcję 8. Nie odtwarzano w obronie.

Dodatkowe korekty z własnej kontroli (bez zarzutu Evaluatora): wiersze tabeli 4.2 poza 168×120 s42 (84×60 ×5, 168×120 s99, wyspy) oznaczono jako dane rundy 3 bez surowego wyjścia w repo i NIE POTWIERDZONE w obronie.

BLOKADY:
- Pkt 6 (pełna lista testów/pinów): NIE SPEŁNIONE — 8 testów nieuruchomionych (lista w ODPOWIEDZI 2).
- Pkt 3 dla map stałych/Ziemia i Pangea V2: NIE ZMIERZONO, brak ilościowej rekomendacji 2×.
- Pkt 4 (RIVMOUTH): deklaracja +12% NIE POTWIERDZONA; kombinacja V3+RIVMOUTH NIE ZMIERZONO.
- Hexy 168×120 (poza s42) i 240×168: NIE ZMIERZONO w obronie.
- Decyzje dla właściciela (nie rozstrzyga Operator): wariant A/B/C trzeciego poziomu; widoczność `tributary` domyślnie; odstęp 1 (rzeki w sąsiednich heksach) — łamie regułę z 2026-08-01.
- Rozstrzygnięcie N=15 vs mainCell=5 zapisane w dokumencie (15 = siatka wody/miedzi fair play; siatka rzek = 10/5/5 w kodzie). Dokument „20:34” jako osobny plik nie istnieje w repo.

RUNDY: 3/5 (obrona po raporcie Evaluatora na f24beaba1; Operator Sonnet r3 zgodnie z dispatchem).
NASTĘPNY KROK: Evaluator/Final Control ponownie ocenia pkt 1–6. Przy pozostałym pkt 6 wynik BLOCK. Do domknięcia potrzebna runda z uruchomieniem 8 testów nieuruchomionych (w tym river-path-adjacency-test i river-grid-coverage-test) oraz pomiarem hexów dla 168×120 i 240×168.
DEPLOY/PUSH: NIE WYKONANO
UWAGI-DLA-ORKIESTRATORA:
- Gałąź RIVMOUTH-wip/fc3 (bde050bcf) jest oparta na starszym main: nie scalać całościowo; cherry-pick tylko gen-helpers.ts (patch `git diff e80d07efb bde050bcf -- gra/src/map/gen-helpers.ts`).
- river-sea-buffer-test jest już czerwony w bazie (3 pady); river-mouth-gap-enforce-test czerwony po cherry-picku (2 pady).
- Instalacja esbuild wymagała `npm install --prefix <SCRATCH> --no-save --ignore-scripts esbuild@0.28.2` przed `prepare` (skrypt pomiarowy tego nie robi automatycznie); dopisać do komentarza w river-count-measure-2x.cjs przy następnej rundzie.
