# R-WEB-BATTLE-SUMMARY-ANNIHILATION-LINE-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (UI + podsumowanie bitwy)
TEMAT: R-WEB-BATTLE-SUMMARY-ANNIHILATION-LINE-Q1
GOAL: Gdy czwarty odwrót w turze niszczy armię (wyczerpany limit odwrotów), podsumowanie bitwy pokazuje OSOBNĄ linię „Unicestwienie” (kto, ile jednostek, powód po polsku) — nie tylko straty. Bez wyczerpanego limitu linii brak.

ZMIANY-COMMIT: patrz sekcja „Zmiany” poniżej; commit zawiera wyłącznie allowlistowane pliki (bez `git add -A`).

## Baza kodu (rozbieżność z dispatchem)
- Dispatch wskazywał kandydata/bazę `52c44be1b` jako „origin/main”. Ten SHA jest commitem gałęzi dispatchów `claude/sprawdzenie-funkcjonalnosci-ek4ra0` (commit „Dispatch: aktualizacja bazy UPKEEP-Q2, ANNIHILATION”) i NIE jest przodkiem `origin/main`; różni się od `origin/main` w 577 plikach (w tym 52 w `gra/src`).
- DODATEK orkiestratora nakazuje pracę na aktualnym `origin/main` (po FALI 738/739) i zakazuje używania gałęzi dispatchów jako bazy kodu. Zastosowano to: worktree `--detach origin/main` = `392aa14c1` (ROBOCZA d61d8e2a, FALA 737 na czubku; FALA 738 w `origin/main` nie była widoczna w momencie pracy).
- Orkiestrator powinien zweryfikować, czy `52c44be1b` miał być bazą; pracę wykonano na `origin/main` zgodnie z DODATKIEM.

## Zmiany
1. `gra/src/game/post-battle-map.ts` — `PostBattleMapResult` dostaje `defenderAnnihilatedUnitCount` i `attackerAnnihilatedUnitCount` (liczba jednostek usuniętych przez gałąź unicestwienia; 0 = brak). Logika odwrotów bez zmian.
2. `gra/src/game/battle-summary.ts` — typ `BattleSummaryAnnihilation` (strona, etykieta, liczba, powód), pole `annihilation?` w `PostBattleSummaryData`, funkcja `buildAnnihilationNote` (zwraca undefined, gdy liczniki 0), `formatAnnihilationLine` (tekst „Unicestwienie: <strona> — N jednostek/jednostka/jednostek zniszczonych; powód: wyczerpany limit odwrotów (trzy odwroty w tej turze).”), odmiana polska liczebników.
3. `gra/src/ui/postBattleSummary.ts` — osobna linia (kolor wroga, `data-annihilation` = strona) pod linią strat, przed łupami, tylko gdy `data.annihilation`.
4. `gra/src/main.ts` — `applyMapBattleOutcome` przyjmuje opcjonalny `onPostBattleResult` i wywołuje go po `applyPostBattleMap`; `applyMapBattleOutcomeWithSummary` przechwytuje wynik (holder `pbHolder`) i przekazuje liczniki do `buildPostBattleSummary`. Import typu `PostBattleMapResult`. Reszta main.ts (komunikaty `showHintMessage`, pinowane testami) nietknięta.
5. `gra/tools/battle-summary-annihilation-test.cjs` (nowy) — test realnej ścieżki `applyPostBattleMap` (esbuild bundle) + pin UI/main.ts.

Linia dotyczy obu stron jednakowo (gracz i AI): side `obronca` gdy obrona unicestwiona, `atakujacy` gdy atakujący. Nazwa strony = `defLabel`/`atkLabel` już użyte w podsumowaniu (cywilizacja/wódz).

## TESTY (liczby z surowego wyjścia)
- `npx tsc --noEmit` (w `gra/`): exit 0, 0 linii wyjścia.
- `node tools/battle-summary-annihilation-test.cjs`: `pass=16 fail=0`, exit 0. Pierwsze uruchomienie: 5 FAIL — błąd w fixturach testu (w ścieżce polowej dwaj polegli byli już usunięci przez `applyManualSurvivors`, więc liczony był tylko ocalały; poprawiono fixture: ocaleli obrony d0+d1, ocaleli atakującego a0+a1). Kod nie został zmieniony w odpowiedzi na ten FAIL; semantyka „ile jednostek zniszczył mechanizm unicestwienia” = jednostki wciąż żywe w chwili unicestwienia.
- Mutacja (c): usunięcie linii `annLine.textContent = formatAnnihilationLine(data.annihilation);` z `postBattleSummary.ts` daje `mutant match: false` w pinie d1 (sprawdzone w pamięci regexem testu; test pina byłby czerwony). Mutacja realnego pliku nie była uruchamiana w przeglądarce.
- `node tools/battle-retreat-limit-test.cjs`: `43 pass, 0 fail`.
- `node tools/battle-summary-test.cjs`: `OK`.
- `node tools/battle-damage-colors-test.cjs`: `27 PASS / 0 FAIL`.
- `node tools/bitwa-podsumowanie-dispose-test.cjs`: `16 passed, 0 failed`.
- `node tools/escape-overlay-stack-test.cjs`: `84 pass, 0 fail`.
- `node tools/r-bitwa-etykieta-tozsamosc-strony-zrodlo-test.cjs`: `PASS (38 checks)`.
- `node tools/r-bitwa-kolory-gracz-przeciwnik-q1-test.cjs`: `PASS (26 checks)`.
- `node tools/r-bitwa-etykieta-tozsamosc-strony-real-render-test.cjs`: FAIL (exit 1): `page.evaluate: TypeError: Cannot read properties of undefined (reading 'children')` — test wymaga buildu vite i przeglądarki; NIE_ZMIERZONO, czy błąd istnieje też na bazie (nie budowano bazy osobno). Test odwołuje się do kart dowódców (`corner.children`), a zmiana nie dotyka struktury kart (tylko dodaje linię, gdy `annihilation` jest ustawione, czego ten scenariusz nie generuje) — przyczyna niezweryfikowana.
- `git diff --check`: czysto (brak wyjścia).
- Pozostałe bramki z dispatchu (test pełny `gra/tools/battle-*`, `npm run build` poza repo): NIE_ZMIERZONO (nie uruchamiano pełnego zestawu ani buildu vite).

## Dowód wizualny (e) i test na żywo (a/d w przeglądarce)
- NIE_ZMIERZONO: zrzut Chromium podsumowania z linią unicestwienia nie został wykonany (brak buildu vite poza repo i scenariusza w przeglądarce w tej rundzie). Kryterium (e) i test realnej ścieżki w przeglądarce są do dokończenia w kolejnej rundzie lub przez Evaluatora.
- Kryterium (a)/(b)/(d) zweryfikowane na poziomie funkcji czystych i prawdziwego `applyPostBattleMap` (strona obrony i atakującego; brak linii bez wyczerpania), nie na poziomie DOM.

## Wiki / Civpedia
- Brak tekstu w `gra/src`, `gra/docs`, `gra/data`, `*.md`, opisującego linię podsumowania ani wyczerpanie odwrotów poza komunikatami kodu (`battle-retreat-limit.ts`, `preBattle.ts`). Nie zmieniano danych wiki, więc regeneracja `wikiBundle` nie była potrzebna (NIE_ZMIERZONO = nie uruchamiano `bundle-wiki-for-game.cjs`).

## BLOKADY
- Brak blokad procesowych. Dług testowy: `r-bitwa-etykieta-tozsamosc-strony-real-render-test.cjs` czerwony (patrz wyżej, do oceny Evaluatora względem bazy).
- Test w przeglądarce i screenshot (e) nie wykonane w tej rundzie.

## UWAGI-DLA-ORKIESTRATORA
- Rozbieżność bazy: `52c44be1b` (dispatch) vs `origin/main` (DODATEK). Pracowano na `origin/main` = `392aa14c1`.
- Dług Rust „REPIN prezentacji” z dispatchu: nie dotyczy zakresu operatora; nie zakładano żadnego tematu.
- Nie zakładano żadnych nowych sesji ani zadań (zakaz właściciela).

## RUNDY
1/5

## NASTĘPNY KROK
Evaluator: przejrzeć diff (4 pliki kodu + test), ocenić real-render test względem bazy; Operator r2 (jeśli FC zażąda): zrzut Chromium podsumowania z liniami unicestwienia obrony i atakującego oraz test DOM w przeglądarce.

DEPLOY/PUSH: NIE WYKONANO
