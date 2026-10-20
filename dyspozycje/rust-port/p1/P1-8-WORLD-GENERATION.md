# P1.8 — Generowanie świata (kilka rozmiarów, żywy Chromium)

**Temat:** R-RUSTPORT-P1-8-WORLD-GENERATION-Q1 · **Runda:** 2/5 · **Pin:** `main` = `edb8fb56`

Zmiany w rundzie 2 (wyłącznie poprawki opisu, bez nowego pomiaru): doprecyzowano ścieżkę wykonania determinizmu (§3), rozróżnienie dwóch liczników postępu (§2), oraz ograniczenie wniosków o czasie (§2, §5).

## 1. Metoda i dowody

- Izolacja: świeży `git worktree` na `edb8fb56` w scratchpadzie sesji, `npm ci` w `gra/` (exit 0). Worktree usunięty po teście.
- Dev server wyłącznie bezpośrednio: `node ./node_modules/vite/bin/vite.js --port 5184 --strictPort` (PID 15138), `predev` pominięty. Przed startem i po teście `git status gra/data` = 0 linii.
- Przeglądarka: Playwright na `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`, viewport 1600×900.
- Ścieżka UI: menu → „▶ Rozpocznij grę" → „Rozpocznij konfigurację →" → „Dalej →" (epoka) → „Dalej →" (cywilizacja) → krok 4 „Ustawienia" (wiersz „Rozmiar mapy", strzałki ‹ ›) → „◆ ROZPOCZNIJ GRE ◆". Postęp czytany z `#civ-map-load-phase` i `#civ-map-load-elapsed` (overlay `src/ui/mapLoadingOverlay.ts`), próbkowanie co 1 s.
- Ubicie procesu: PID 15138 zakończony, port 5184 zamknięty (`kill -0` nie znajduje procesu, `vite.js --port 5184` nieobecny w `ps`).
- Uwaga: w `ps` widoczny inny proces `vite.js --port 5185` (PID 17268), nieuruchomiony przez ten temat. Nie był dotykany.

## 2. Wyniki per rozmiar mapy

Rozmiary z `gra/data/ui-params.json` (klucz `map_size`): Malenki (~1000 hex, 38×26), Mały, Standardowy (domyślny, ~5000 hex, 84×60), Duży, Ogromny, Super Huge.

| Rozmiar | Próba | Wynik | Czas (dev server) | Zrzut |
|---|---|---|---|---|
| Malenki | 1 | Ukończono, HUD i mapa widoczne | ok. 19–20 s (overlay zniknął; ostatnia faza „8/9 · Po scenie — mgła startowa" przy 18,2 s) | `screenshots/P1-8-worldgen-malenki.png` |
| Standardowy | 1 (limit 90 s) | **Przerwano po 90,5 s** — nieukończone; faza „7/10 · Rzeki — uzupełnianie" od ok. 74 s | 90,5 s (timeout) | brak |
| Standardowy | 2 (limit 240 s) | Ukończono, mapa widoczna | **211,9 s** (faza 6/10 od ok. 13 s do ok. 88 s; faza 7/10 od ok. 88 s do końca) | `screenshots/P1-8-worldgen-standardowy.png` |

Dwa różne liczniki postępu — nie należy ich porównywać: „7/10 · Rzeki — uzupełnianie” i „6/10” to fazy generatora mapy (`MAP_GEN_PHASE_TOTAL = 10`, `src/map/mapGenProgress.ts`). „8/9 · Po scenie — mgła startowa” to osobny licznik loadera po wygenerowaniu mapy: `postSceneProgress` w `src/main.ts` (l. 111), którego total (9) podaje wywołujący jako `POST_SCENE_STEPS`, a nie `MAP_GEN_PHASE_TOTAL`.

Pochodzenie liczb: czasy całkowite (19–20 s, 90,5 s, 211,9 s) są w `01-operator.md` (runda 1). Wartości pośrednie (18,2 s; ok. 13 s, 74 s, 88 s — momenty zmian faz) pochodzą z odczytu overlayu próbkowanego co 1 s podczas rundy 1 i występują tylko w tym pliku. Log konsoli ani zapis overlayu nie zostały zachowane w repozytorium, więc wartości pośrednie nie są odtwarzalne z plików.

Obserwacje:
- Standardowy: w tej rundzie jeden przebieg przerwano po 90,5 s, a drugi (limit 240 s) ukończono w 211,9 s. Fazy postępu zmieniały się (6 → 7), licznik „Upłynęło" rósł bez przerw. Nie zmierzono postępu w obrębie fazy 7, więc z tego raportu nie wynika, czy był to stall, czy długa praca bez raportowania postępu.
- Dane to tylko 2 próby dla Standardowy (1 timeout, 1 ukończenie) i brak serii powtórzeń. Nie ma podstaw do wniosku „wolne, ponad 90 s” jako cechy stabilnej; opis zawiera wyłącznie sformułowanie „tylko 2 próby, brak serii”. Osobny temat wydajnościowy nie jest przesądzony — decyzja dopiero po serii pomiarów.
- Stary audyt (archiwum) opisywał stall; na tym pinie nie został potwierdzony jako nieskończony. Pomiar dotyczy dev servera (nie builda produkcyjnego) — bezwzględne czasy nie są miarodajne dla wydajności, służą tylko do porównań w obrębie tej samej metody.
- Ścieżka generacji: `src/map/mapGenAsync.ts` (`generujSwiatAsync`, worker z fallbackiem na wątek główny), `src/map/generator.ts` (`generujSwiat`, l. ~829), fazy postępu `src/map/mapGenProgress.ts` (`MAP_GEN_PHASE_TOTAL = 10`, faza 7 = „Rzeki — uzupełnianie").

## 3. Determinizm (ten sam seed → ten sam wynik)

- **Przez UI niemożliwe do sprawdzenia:** seed jest losowany przy każdym starcie gry (`src/ui/newGameFlow.ts` ~l. 2018, `Math.floor(Math.random() * 1_000_000)`) i nie jest wystawiony w kreatorze.
- **Sprawdzone bezpośrednio na module** (dev server, `import('/src/map/mapGenAsync.ts')` w stronie, `generujSwiatAsync(seed, 'malenki', 'kontynenty')`, JSON bez `mapGenTimings`, hash FNV-like):
  - seed 42, próba A: hash `3b46d84`, długość 856 930 znaków;
  - seed 42, próba B: hash `3b46d84`, długość 856 930 znaków → **identyczne**;
  - seed 43: hash `f0a69060` → różny od seeda 42 (wynik zależy od seeda).
- **Ścieżka wykonania hashowanych wywołań — nieustalona.** `generujSwiatAsync` najpierw próbuje Workera i przy błędzie przechodzi na wątek główny (`src/map/mapGenAsync.ts` l. 29, ostrzeżenie `[mapGenAsync] Worker niedostępny — fallback main thread`). Zapis tej rundy nie mówi, czy wywołania poszły przez Worker, czy przez fallback, ani czy to ostrzeżenie pojawiło się w konsoli podczas testu. Nie sprawdzono tego; hashe są wynikiem, którego źródło ścieżki pozostaje nieznane.
- **Zakres wniosku o determinizmie:** potwierdzony wyłącznie dla bezpośredniego wywołania `generujSwiatAsync` w przeglądarce, przy nieustalonej ścieżce (Worker lub fallback). Dla ścieżki UI (losowy seed bez pola w kreatorze) determinizm nie został sprawdzony i nie jest w tym raporcie twierdzeniem.
- Pole `mapGenTimings` zawiera czasy wykonania i jest celowo wykluczone z porównania (różniłoby się zawsze).

## 4. Anomalie

- Konsola: przy każdym załadowaniu 1× `Failed to load resource: 404 (Not Found)` — ta sama anomalia co w P1.3/P1.4/P1.5, URL nadal nieustalony. Nie blokuje generowania. Do P1.16.
- Konsola: ostrzeżenia `[EndTurn] blocked: awaitingFirstPlayerCity` (oczekiwane przed założeniem miasta) oraz `GPU stall due to ReadPixels` (sterownik WebGL, bez wpływu na wynik).

## 5. Ograniczenia

- Czasy z dev servera Vite (bez minifikacji), jednorazowe próby (Standardowy: 2 przebiegi o różnym limicie). Brak serii powtórzeń, więc rozrzut czasów nie jest znany.
- Nie przetestowano Mały, Duży, Ogromny, Super Huge (zakres tematu: co najmniej 2 rozmiary, spełnione).
- Historia gita: plik `P1-8-WORLD-GENERATION.md` ma jeden commit w historii (`cea1c383`, wspólny z innym tematem, zawierający już poprawki rundy 2). Nie istnieje wersja z rundy 1 do porównania diffem, więc twierdzenie „liczby z rundy 1 nietknięte” opiera się na deklaracji Operatora; zgodność czasów całkowitych sprawdzono z `01-operator.md`.
