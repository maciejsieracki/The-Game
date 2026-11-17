# 30-obrona-claude — R-WEB-DEFEAT-SCREEN-SUMMARY-LOAD-OR-NEW-Q1 (Obrona Operatora HAIKU, runda 1/5)

STATUS: PASS-WITH-NOTES (obrona przyjęła zarzuty 1, 2, 3 i 4 w zakresie, który dało się zmierzyć; cząstka zarzutu 4 NIE ZMIERZONA, patrz niżej)
DOMAIN: GAME (UI końca gry)
TEMAT: R-WEB-DEFEAT-SCREEN-SUMMARY-LOAD-OR-NEW-Q1
GOAL: porażka = pełny koniec gry z podsumowaniem (osiągnięcia / straty) i wyborem „Wczytaj grę” / „Rozpocznij od nowa”.
BAZA: 8265bbec0e8d040562fc73bbafaf57ae3aef50ed (origin/main; ancestor kandydata 4e16da0fc: TAK)
KANDYDAT EVALUATORA: 4e16da0fc5561b2f81d606609befd542b1facfa7 (kod 1a021cbd3 + raport Operatora 4e16da0fc)
KOD OBRONY (commit z poprawkami): **247093c6fdbd46edaeed0b18361fc9f3614b6767** (parent = 4e16da0fc)
RAPORT EVALUATORA: a3926deabb50d22a38524f7e11be89399de0ddc1 (zarzuty czytane z `20-evaluator-claude.md`)

## Odpowiedzi na zarzuty Evaluatora

### Zarzut 1 — przyciski poza oknem 1280x720 i 1400x900, stopka nachodzi na kartę — PRZYJMUJĘ
- Dowód przed poprawką: Evaluator ma rację co do zrzutu z 1400x900. Test stary sprawdzał tylko `textContent`.
- Poprawka: `gra/src/ui/victoryScreen.ts`, nowe reguły CSS `.vsc-overlay.lose ...` (zwarty układ: mniejsza emblemat, nagłówek, karty, odstępy, przyciski 52 px; stopka `bottom:12px`). Zakres zmian tylko dla porażki (`lose`); układ zwycięstwa bez zmian.
- Asercje dodane do `gra/tools/defeat-screen-summary-live-test.cjs` (funkcja `checkBtns`): dla `#vsc-load-game` i `#vsc-new-game` przy 1400x900 **i** 1280x720 — `boundingBox` mieści się w `innerWidth`/`innerHeight`; `document.elementFromPoint` w środku przycisku zwraca ten przycisk lub jego potomka (nie zasłonięty); prostokąt przycisku nie nachodzi na prostokąt stopki.
- Wynik: wszystkie 18 asercji z tej grupy OK w przebiegu końcowym (log: `/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/logs/run3.log`).
- Dowód wizualny: `/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/defeat-live/defeat-summary-L1-ekran-porazki-1280x720.png` — oba przyciski widoczne w oknie, stopka pod nimi, bez nakładania. Zrzut 1400x900: `.../defeat-live/defeat-summary-L1-ekran-porazki.png`.

### Zarzut 2 — surowe ID „rzymianie” w karcie „Cywilizacja” i podtytule — PRZYJMUJĘ
- Dowód przed poprawką: `main.ts` przekazywał `civLabel: player.civType` (klucz małymi literami).
- Poprawka: `gra/src/main.ts` — `civLabel: civDisplayNameForKey(String(player.civType ?? ''))`, w dwóch miejscach: porażka (`sprawdzPrzegranaPoUtracieMiasta`, ~36517) i wspólne pole zwycięstw (~46375). `civDisplayNameForKey` (~19950) czyta `data.civs.cywilizacje[].Cywilizacja`, a przy braku wpisu zwraca klucz (bez crasha).
- Uwaga o zakresie: zmiana w ~46375 dotyczy też zwycięstw dominacji i nauki (to to samo pole `civLabel`). Zwycięstwa zostały zmienione świadomie, bo jest to ten sam defekt tekstu dla gracza (kryterium d). Patrz ABC B.
- Dowód po poprawce: asercja „karta Cywilizacja pokazuje nazwę wyświetlaną (wielka litera, nie klucz)” OK; asercja „podtytuł/flavor nie zaczyna się małą literą” OK. Zrzut pokazuje „Rzymianie” w karcie i „Rzymianie — koniec epoki”.

### Zarzut 3 — klawiatura/mapa pod ekranem porażki nie zweryfikowane w żywej grze — PRZYJMUJĘ (zweryfikowane)
- Kod (ZMIERZONO statycznie, `gra/src/main.ts`): klawisz N (zakończ turę / następny fotel) przechodzi przez `canPlayerInitiateEndTurn()`, a ten sprawdza `gameOver` (komentarz przy ~46715–46730 i guard w ~40749). Spacja (`cycleToAdjacentPlayerUnit`, ~46821) zmienia tylko zaznaczenie jednostki — nie zmienia tury ani stanu gry.
- Dodane asercje w teście live: po ekranie porażki naciśnięte `n` i `Space`; tura i `gameOver=true` bez zmian; ekran porażki nadal otwarty; `document.elementFromPoint` w środku okna zwraca element wewnątrz `#__victory_screen__` (mapa zasłonięta). Wynik: OK, OK, OK, OK.
- Poza zakresem (nie zmieniam): w zrzucie widoczny jest chip „Czasy ostatniej mapy” (`src/ui/perfReport.ts` ~207–218, `z-index:2500000`, dokładany do `documentElement`, pokazywany tylko gdy w localStorage jest zapisany raport). Jest ponad overlayem. To narzędzie diagnostyczne sprzed tej zmiany, nie część tego tematu — patrz UWAGI.

### Zarzut 4 — „tura rośnie po wczytaniu” nie zmierzona; Autozapis, Esc, uszkodzony zapis — CZĘŚCIOWO PRZYJMUJĘ, CZĘŚCIOWO ODRZUCAM (z dowodem)
- ODRZUCAM zarzut, że blokada endTurn po wczytaniu wynika z tej funkcji: kontrola C0 (ten sam harness, zwykły zapis i wczytanie **bez porażki**) daje `endTurn przesunął turę=false` (log: `C0 kontrola (bez porażki): po wczytaniu tura=2, endTurn przesunął turę=false, startTura=2`). Logi endTurn po wczytaniu w L1: `warning: [EndTurn] blocked: prognoza skarbca/spichlerza < 0 (NNS)`. Blokada pochodzi z bramki NNS (dług #417), nie z ekranu porażki.
- PRZYJMUJĘ, że kryterium „tura rośnie po wczytaniu” NIE jest spełnione i nie zostało zmierzone. Asercja pozostaje osłabiona warunkowo (brak ekranu porażki i `gameOver=false`) i jest oznaczona w logu jako INFO. Nie obchodzę bramki NNS testowym hakiem — to decyzja poza tematem (ABC 3).
- PRZYJMUJĘ i ZMIERZONO: ścieżka Esc w dialogu wczytania (L2b w teście): po Esc ekran porażki wraca, dialog zamknięty. OK, OK.
- NIE ZMIERZONO (bez zmian w kodzie): wczytanie „Autozapisu” zrobionego po porażce (na liście widoczny „Autozapis · tura 2”); nieudane wczytanie uszkodzonego zapisu. Powód: wymaga osobnego scenariusza i czasu boota Chromium; oznaczone jako dług w ABC 2.
- ZNALEZIONE I NAPRAWIONE PRZY OKAZJI (to było w zarzucie 4 jako „zachowanie w żywej grze”): po kliknięciu „Wczytaj grę” dialog wczytania był przykryty przez stary overlay „Broni się: łąka przy Ateny” (`src/ui/preBattle.ts`, klasa `.pb-overlay`). Overlay był już otwarty w chwili porażki (potwierdzone diagnostyką przed klawiszami; klawisze nie są przyczyną). Bitwa z tury porażki nie może się już rozstrzygnąć. Poprawka: `main.ts`, `pokazEkranPorazki` — przed `showVictoryScreen` wołane `clearDeferredAutoPreBattleQueue()` i `hidePreBattle()` (gdy `isPreBattleOpen()`), w `try/catch`. Asercje: „pod ekranem porażki nie ma stale otwartej bitwy (pb-overlay)” OK; „dialog wczytania nie jest przykryty bitwą” OK.

## Zmiany w commicie 247093c6f (allowlista: gra/src/main.ts, gra/src/ui/victoryScreen.ts, gra/tools/defeat-screen-summary-live-test.cjs)
- `gra/src/ui/victoryScreen.ts`: +15 linii CSS (`.vsc-overlay.lose ...`), bez zmiany logiki i API.
- `gra/src/main.ts`: `pokazEkranPorazki` (+5 linii: czyszczenie kolejki bitew i zamknięcie pre-battle), `civLabel` w dwóch miejscach (±2 linie). Brak zmian w `checkDefeat`, `SaveGame`, balansie, `WERSJE.md`, manifeście, `gra-robocza/`, `rust-port/`.
- `gra/tools/defeat-screen-summary-live-test.cjs`: +78 linii asercji (widoczność przycisków 2 rozdzielczości, klawisze N/Space, zasłonięcie mapy, nazwa cywilizacji, pb-overlay, Esc w L2b).
- `git diff --check`: czysty.
- NIE dotykane: `gra/tools/.victory-screen-bundle.css` (generowany przez `victory-screen-test`; przywrócony `git checkout`, nie w commicie).

## TESTY (wyniki z surowego wyjścia, wszystko na 247093c6f; build vite poza repo do katalogu w scratchpad)
- `tsc --noEmit`: exit 0.
- `tools/defeat-screen-summary-test.cjs` (jsdom): `passed=23 failed=0` (po wszystkich edycjach).
- `tools/defeat-screen-summary-live-test.cjs` (Chromium, playtest): **`45 passed, 0 failed`**, log `scratchpad/logs/run3.log`, exit 0. Przed poprawką pb-overlay: przebieg 1 przerwany w kliknięciu „Wczytaj”, przebieg 2 (diagnostyka) potwierdził pb-overlay przed klawiszami.
- Bramki referencyjne:
  - `logic-test.cjs`: `LOGIC OK (213/213)`, exit 0
  - `tech-tree-test.cjs`: `20 pass, 0 fail`, exit 0
  - `research-test.cjs`: `PASSED: 33 / FAILED: 0 / TOTAL: 33`, exit 0
  - `unit-replace-test.cjs`: `WSZYSTKIE TESTY ZIELONE (21/21)`, exit 0
  - `combat-test.cjs`: `COMBAT TEST: 6/6 pass`, exit 0
  - `load-game-regression-test.cjs`: `34 PASS / 0 FAIL`, exit 0
  - `victory-test.cjs`: `12 passed, 0 failed`, exit 0
  - `victory-screen-test.cjs`: `11 passed, 0 failed`, exit 0
- Nie wykonano: mutacji na kopiach `victoryScreen.ts` w tej rundzie (Evaluator wykonał 4; kod `buildDefeatSummary` i przyciski nie zmieniły się w sposób, który wymagałby nowej mutacji; nowe asercje są na DOM/geometrii, a nie na logice).

## BLOKADY
- Kryterium „tura rośnie po wczytaniu” nie spełnione — blokuje bramka NNS (#417). Poza zakresem tematu.
- Autozapis po porażce i uszkodzony zapis: NIE ZMIERZONO (patrz zarzut 4).

## RUNDY
- Runda 1/5 (obrona). Ostatni werdykt Evaluatora: PASS-WITH-NOTES (bez werdyktu końcowego), zarzuty 1–4.

## NASTĘPNY KROK
Evaluator (SONNET) ponownie: weryfikacja commitu 247093c6f, potem Final Control. Decyzje ABC niżej (do właściciela, przez orkiestratora).

## DEPLOY/PUSH: NIE WYKONANO

## UWAGI-DLA-ORKIESTRATORA
1. **Pytania ABC do właściciela** (zgodnie z prośbą: „jeżeli są decyzje, daj pytania ABC”):
   - **ABC 1 — sekcja „Straty”**: (A) zostaje stała „Wszystkie / utracone miasta” (rekomendacja: A, bo liczniki strat wymagałyby nowych pól w stanie gry); (B) dodać liczniki (np. utracone jednostki w tej turze) jako pola opcjonalne z wartością domyślną, z testem starego zapisu; (C) usunąć sekcję „Straty”, zostawić jedno zdanie o utracie miast.
   - **ABC 2 — autozapis po porażce na liście dialogu wczytania** („Autozapis · tura 2”): (A) ukryć zapisy zrobione w stanie `gameOver` (rekomendacja: A, bo wczytanie takiego zapisu powtarza porażkę); (B) zostawić z podpisem „po porażce”.
   - **ABC 3 — bramka NNS po wczytaniu (dług #417)**: blokuje „Zakończ turę” także w kontroli bez porażki. (A) domknąć #417 przed FC tego tematu (rekomendacja, bo kryterium „tura rośnie” wymaga tego); (B) zaakceptować i zamknąć kryterium jako NIE ZMIERZONE.
   - **ABC 4 — zasięg `civLabel` (nazwa wyświetlana)**: poprawka objęła też zwycięstwa dominacji i nauki (wspólne pole). (A) zostaje (rekomendacja: ten sam defekt tekstu); (B) tylko porażka.
2. **Znalezisko poza zakresem (nie naprawiane, allowlista)**: `src/ui/perfReport.ts` — chip „Czasy ostatniej mapy” (`z-index:2500000`) pojawia się ponad każdym overlayem, gdy w localStorage jest raport. Wyłącznie diagnostyka; warto temat osobny (np. ukrywanie chipu przy `isVictoryScreenOpen()` lub w trybie gry).
3. **Pre-battle stale**: poprawka w `pokazEkranPorazki` czyści kolejkę i zamyka pre-battle przy porażce. Ryzyko do sprawdzenia przez FC: `hidePreBattle()` czyści `activePreBattleCb` (callback bitwy nie jest wołany). Po porażce to zamierzone, ale FC powinien potwierdzić, że po „Wczytaj grę” nie zostaje flaga `endTurnInProgress` / `aiCmdResume` (w teście L1 po wczytaniu endTurn nie dochodzi do wykonania z powodu NNS, więc to NIE ZMIERZONO).
4. Tooling: `victory-screen-test.cjs` przepisuje śledzony `gra/tools/.victory-screen-bundle.css` przy każdym uruchomieniu (już zgłoszone przez Evaluatora); w tej rundzie przywrócony `git checkout`.
5. `npm ci` w `gra/` wykonany w worktree (71 pakietów); `gra/node_modules` do usunięcia przy sprzątaniu worktree.

## SHA
- Kod obrony: 247093c6fdbd46edaeed0b18361fc9f3614b6767
- Raport obrony: patrz commit wykonany po zapisie tego pliku (`git rev-parse HEAD` po commicie)
