# 50-final-control-claude — R-WEB-DEFEAT-SCREEN-SUMMARY-LOAD-OR-NEW-Q1 (Final Control SONNET)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (UI końca gry)
TEMAT: R-WEB-DEFEAT-SCREEN-SUMMARY-LOAD-OR-NEW-Q1
GOAL: porażka = pełny koniec gry z podsumowaniem (osiągnięcia / straty) i wyborem „Wczytaj grę” / „Rozpocznij od nowa”.
ZMIANY/COMMIT: kandydat a470f0327c106ecee5e43c0fdcd29e0265d56e80 (kod 1a021cbd3 + 247093c6f; reszta to raporty). Zakres diffu vs baza 8265bbec0: gra/src/main.ts, gra/src/ui/victoryScreen.ts, gra/tools/defeat-screen-summary-test.cjs, gra/tools/defeat-screen-summary-live-test.cjs, runs/<ID>/*. Mieści się w allowliście. Kandydat jest potomkiem bazy 8265bbec0 (merge-base --is-ancestor: TAK). Origin/main poszedł dalej do 8319e53ef (FALA 771); `git merge-tree` kandydat+8319e53ef: czysto, bez konfliktów (tree 10b1a41b9) — integracja wymaga merge z aktualnym main, nie FF.
INTEGRATION_SHA: a470f0327c106ecee5e43c0fdcd29e0265d56e80

## Ocena zarzutów
1. Widoczność przycisków 1280x720/1400x900, stopka — ODDAL (naprawione w 247093c6f; zweryfikowane). Zrzuty FC 1280x720 i 1400x900: oba przyciski w oknie, stopka pod nimi, brak nachodzenia; test ma asercje boundingBox/elementFromPoint/brak nakładania w obu rozdzielczościach.
2. Surowe ID „rzymianie” — ODDAL (naprawione: civDisplayNameForKey; zrzut pokazuje „Rzymianie”). Zasięg także na zwycięstwa — mała, spójna poprawka tego samego pola; do wiadomości właściciela (ABC 4), nie blokuje.
3. Klawiatura/mapa pod ekranem — ODDAL (zmierzone w teście live: N i Spacja nie zmieniają tury ani gameOver, ekran zostaje, środek ekranu zasłonięty overlayem). Chip „Czasy ostatniej mapy” widoczny nad overlayem = osobne znalezisko (UWAGI).
4. Tura rośnie po wczytaniu — ODDAL jako wina tej funkcji, NIE ZMIERZONE jako kryterium: endTurn po wczytaniu jest blokowany bramką NNS także w kontroli C0 bez porażki (INFO w wyjściu live). Esc w dialogu zmierzony OK. Autozapis po porażce i uszkodzony zapis: NIE ZMIERZONO. Nic z tego nie wymaga NAPRAW w tym temacie.
Żaden zarzut nie wymaga NAPRAW => brak FAIL.

## DO DECYZJI CZŁOWIEKA (realne decyzje produktowe; pytania ABC do właściciela)
- ABC 1 sekcja „Straty”: A stała „Wszystkie / utracone miasta” (rekomendacja), B liczniki opcjonalne (utracone jednostki) z testem starego zapisu, C usunąć sekcję.
- ABC 2 autozapis po porażce na liście wczytania: A ukryć zapisy ze stanu gameOver (rekomendacja), B zostawić z podpisem.
- ABC 3 bramka NNS po wczytaniu: A osobny temat harnessu, B zaakceptować NIE ZMIERZONO tury po wczytaniu.
- ABC 4 nazwa cywilizacji także dla zwycięstw: A zostaje (rekomendacja), B tylko porażka.

## TESTY (FC, samodzielnie, na a470f0327; surowe wyjście)
- tsc --noEmit: exit 0
- defeat-screen-summary-test: passed=23 failed=0
- defeat-screen-summary-live-test (Chromium, vite build poza repo, ?playtest=mapa): 45 passed, 0 failed; zero pageerror/console.error
- logic-test: LOGIC OK (213/213)
- tech-tree-test: 20 pass, 0 fail
- research-test: PASSED 33 / FAILED 0
- unit-replace-test: 21/21 zielone
- combat-test: 6/6 pass
- load-game-regression-test: 34 PASS / 0 FAIL
- victory-test: 12 passed, 0 failed; victory-screen-test: 11 passed, 0 failed (plik .victory-screen-bundle.css przywrócony git checkout, nie w commicie)
- Czerwone bramki: brak, porównanie z bazą niepotrzebne.
- Przegląd kodu: pokazEkranPorazki czyści kolejkę/pre-battle, „Wczytaj” chowa ekran dopiero po wyborze, Anuluj/brak zapisów przywraca ekran, „Rozpocznij od nowa” = reload; checkDefeat, SaveGame, balans nietknięte.
- Test live uruchomiony przez file:// (build vite w katalogu tymczasowym), nie przez serwer HTTP; ocena wizualna ze zrzutów 1280x720 i 1400x900.

## BLOKADY
Brak blokujących. NIE ZMIERZONO: tura rośnie po wczytaniu (NNS), Autozapis po porażce, uszkodzony zapis, flagi endTurnInProgress/aiCmdResume po „Wczytaj” (hidePreBattle czyści callback bitwy).

## UWAGI-DLA-ORKIESTRATORA
- Chip „Czasy ostatniej mapy” (perfReport.ts, z-index 2500000) wystaje nad overlay końca gry — osobny mały temat.
- Przy integracji: merge z main 8319e53ef (czysty); wersja/MD5 po deployu poza zakresem. Dług Rust: REPIN ekranu końca gry.
- Sprzątanie: gra/node_modules w worktree FC, /tmp/fc-defeat.

RUNDY: Final Control, runda 1/5
NASTĘPNY KROK: integracja orkiestratora (merge a470f0327 z main), deploy ROBOCZA jako FALA 772; ABC 1–4 do właściciela.
DEPLOY/PUSH: NIE WYKONANO
