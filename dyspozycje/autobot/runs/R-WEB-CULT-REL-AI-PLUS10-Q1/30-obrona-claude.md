STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-CULT-REL-AI-PLUS10-Q1
GOAL: Obrona po FAIL rundy 1 (kandydat 19c5234ea). Plus +10 Kultury i Religii tylko dla AI (rosnący z epoką), gracz bez zmian; osobny poziom „Kultura i religia” dla AI w kreatorze, zapisie i silniku; plumbing typu właściciela w widoku miasta.
BAZA: 19c5234ea (kandydat), obrona na HEAD tej rundy (czubek w polu sha orkiestratora).

## Odpowiedź na zarzuty Evaluatora

1. Gracz: plus additive (normalny 5/11/18, trudny 0/6/13) — ODRZUCAM (z dowodem).
   Dowód: relayed prośba właściciela 2026-11-27, pkt 4: „Wyraźnie powiedziałem, tematem było AI, a nie zasady gracza. Plus dziesięć zawsze stałe miało być tylko dla AI. Dla gracza nic nie zmieniamy.” Gracz zostaje przy dzisiejszym wzorze mnożonym (kod: `(D + (G − D)·s)·k` dla ownerIsHuman=true). Macierz testowa sprawdza gracza: normalny 5/8/11,5, trudny 0/0/0 (ai-plus10-matrix-test.cjs, sekcja 2).

2. Minusy D addytywnie — PRZYJMUJĘ dla AI, ODRZUCAM dla gracza.
   AI: D_AI(e) = D − Δ, Δ = x_epoki − x_epoki1 (0/6/13) → łatwy −10/−16/−23, normalny −15/−21/−28, trudny −20/−26/−33 (DODATEK 2 wprost obejmuje AI; temat rundy = AI).
   Gracz: D nadal mnożone przez skalę (−15/−24/−34,5 itd.) — ta sama podstawa co pkt 1 (dowód jak wyżej).

3. Brak osobnego poziomu AI — PRZYJMUJĘ, WDROŻONE.
   - `culture-religion-level.ts`: `activeLevelAi`, `setCulturaReligiaLevel(raw, rawAi?)`, `getCulturaReligiaLevelAi()`, `getCulturaReligiaLevelForOwner(ownerIsHuman)`. Brak pola AI = poziom gracza; gracz null → AI null (zgodność).
   - `society-breakdown.ts`: `computeHappinessBreakdown` i `computeLawBreakdown` biorą poziom wg typu właściciela (`ownerIsHuman`).
   - `newGameFlow.ts`: `NewGameAdvancedOptions.kulturaReligiaLevelAI`, DEFAULT 'latwy', normalizacja (brak/zła = poziom gracza), drugi selektor „Kultura i religia — dla komputera (AI)”, wiersz w podsumowaniu.
   - `main.ts`: zapis (getSettings), wczytanie (`saved.meta.newGameParams.advanced.kulturaReligiaLevelAI`), start nowej gry; `aiGarrisonNeedApplies` dla AI czyta poziom AI.
   - Pole zapisu `kulturaReligiaLevelAI` jest częścią `advanced`, więc zapisuje się i wczytuje tak samo jak `kulturaReligiaLevel`.

4. Brak testów — PRZYJMUJĘ, WDROŻONE: nowy `gra/tools/ai-plus10-matrix-test.cjs` — 190 pass / 0 fail.
   Zakres: wartości 3×2 właścicieli × 3 epoki (100%/0%/50%); macierz 3×3 poziomów gracz × AI przez pełne `computeHappinessBreakdown` (kultura) dla epok 1–3; hotseat (człowiek = gracz); round-trip obu pól; stary zapis (tylko pole gracza); zła wartość AI; zgodność null.
   Mutacja (ręczna, przywrócona): `getCulturaReligiaLevelForOwner(ownerIsHuman)` → `getCulturaReligiaLevelForOwner(true)` (AI czyta poziom gracza): 18 fail / 172 pass → czerwone, po przywróceniu 190/0.
   Pozostałe mutacje (G AI zależne od poziomu, D AI mnożone) nie były uruchamiane osobno; pokrywa je matryca AI D w epokach 2/3 (−21/−26/−28/−33 — mnożenie daje inne wartości).
   Istniejące testy: ai-plus10-culture-test 69/0; culture-religion-level-test 59/0; culture-religion-test 65/0; society-breakdown-test 56/0; ai-city-order-need-test 35/0; ai-city-order-need-wiring-test 231/0 (bez zmiany asercji — wszystkie ich oczekiwania dla AI pokrywają się z nową formułą w epoce 1 i dla gracza).

5. Weryfikacja UI w przeglądarce — NIE ZMIERZONO. Nie uruchomiono vite ani Chromium w tej rundzie. Zrzut kreatora z dwoma selektorami i odczyt przez civTest dla kombinacji gracz trudny / AI łatwy nie wykonane. Kod kreatora sprawdzony tylko przez tsc i logikę ustawień.

6. Plumbing typu właściciela — PRZYJMUJĘ CZĘŚCIOWO.
   - cityPanel.ts: WDROŻONE. `CityPanelConfig.isHumanOwner?` (domyślnie gracz), przekazane do `evaluateOrderFromBreakdown` jako `ownerIsHuman`; main.ts podaje `isHumanOwner: (oid) => isHuman(oid)` w obu konfiguracjach panelu.
   - growth-happiness.ts i turn-economy.ts: ODRZUCAM. Nie wywołują `computeHappinessBreakdown`/`evaluateOrderFromBreakdown`/`computeLawBreakdown` (grep: w turn-economy.ts 0 wywołań, w growth-happiness.ts tylko komentarze). Nie ma tam widoku wartości, który zmieniałby się dla AI.

7. Pomiar PRZED/PO — NIE ZMIERZONO w tej rundzie. Runner `gra/tools/ai-cult-rel-measure-run.cjs` wymaga żywego bundla vite i headless Chromium; poprzednie biegi Chromium padały (SIGSEGV ok. tury 18). Dodatkowo zmieniła się formuła AI (minusy addytywne), więc wcześniejszy PO z kandydata nie obowiązuje. Pomiar do wykonania po integracji (seed 4242 i 7, 60 tur, Trudny/Kultura trudna dla gracza, AI też trudna, Koszty jednostek Wysoki ×4).

## Zmiany w kodzie (ścieżki)

- gra/src/game/culture-religion-level.ts — poziom AI, wybór poziomu wg typu właściciela, formuła addytywna AI (D − Δ, GAi + Δ), gracz bez zmian.
- gra/src/game/society-breakdown.ts — poziom wg `ownerIsHuman` w Szczęściu i Prawie; `basePts` = x_epoki1.
- gra/src/main.ts — import `getCulturaReligiaLevelAi`; zapis/wczytanie/start pola AI; `aiGarrisonNeedApplies` dla AI; `isHumanOwner` w dwóch konfiguracjach panelu.
- gra/src/ui/cityPanel.ts — `isHumanOwner?` w `CityPanelConfig`, `ownerIsHuman` w wejściu fallbacku.
- gra/src/ui/newGameFlow.ts — pole `kulturaReligiaLevelAI`, domyślne, normalizacja, drugi selektor, podsumowanie; etykieta gracza „— dla gracza”.
- gra/data/society-params.json — opis `_opis` zaktualizowany do addytywnego AI (wartości bez zmian).
- gra/tools/ai-plus10-matrix-test.cjs — nowy test macierzy (190/0).

## TESTY (surowe wyniki w tej rundzie)

- tsc --noEmit (gra/tsconfig.json): bez błędów, exit 0.
- logic-test: LOGIC OK (213/213)
- tech-tree-test: 20 pass, 0 fail
- research-test: PASSED 33 / FAILED 0
- combat-test: COMBAT TEST 6/6 pass
- ai-test: 297 passed, 0 failed
- ai-plus10-matrix-test (nowy): 190 pass / 0 fail
- ai-plus10-culture-test: 69 pass / 0 fail
- culture-religion-level-test: 59 pass / 0 fail
- culture-religion-test: 65 passed, 0 failed
- society-breakdown-test: 56 OK, 0 FAIL
- ai-city-order-need-test: 35 passed, 0 failed
- ai-city-order-need-wiring-test: 231 passed, 0 failed

## Założenia (do potwierdzenia przez orkiestratora)

A. Gracz: pozostaje przy dzisiejszych wartościach (G mnożone, D mnożone), zgodnie z relayed prośbą właściciela („Dla gracza nic nie zmieniamy”). DODATEK 1 i część DODATKU 2 dotyczące gracza zostały odrzucone. To jest rozbieżność z treścią DODATKÓW, nie z relayed prośbą — orkiestrator powinien potwierdzić u właściciela (ABC), zanim wdroży.
B. AI minus D: addytywny (DODATEK 2 wprost obejmuje AI). Gdyby właściciel chciał mnożenie także dla AI, zmiana to jedna gałąź w `cultureReligionLineValue` (ownerIsHuman=false).
C. Stare zapisy z polem gracza: AI dostaje poziom gracza (zgodnie z DODATKIEM 3).

## Uwagi dla orkiestratora

- Dokument `dyspozycje/analizy/AI-PLUS10-KULTURA-RELIGIA-2026-11-27.md` (z kandydata) nie został zaktualizowany do addytywnego AI i nowego poziomu — do aktualizacji przed integracją.
- Poziom AI używa tego samego pola `advanced`, więc `NewGameParams` ma nowe pole opcjonalne; stare zapisy działają bez migracji.
- Brak zmian w gra-robocza/, gra-kanon/, WERSJE.md, rust-port/.

## NASTĘPNY KROK

Final Control dla tej rundy (testy wyżej), potem decyzja właściciela o założeniu A (gracz) i pomiar PRZED/PO po integracji (seed 4242 i 7, 60 tur, poziom maksymalny).

RUNDY: 2/5 (obrona po FAIL rundy 1)
DEPLOY/PUSH: NIE WYKONANO
