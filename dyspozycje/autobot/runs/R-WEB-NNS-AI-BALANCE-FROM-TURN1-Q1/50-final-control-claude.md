STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-NNS-AI-BALANCE-FROM-TURN1-Q1
GOAL: Rownowazenie skarbca/spichlerza AI aktywne od tury 1 (NNS_AI_BALANCE_TURN_MIN = 1); gracz bez zmian (NNS_WOLNE_TURY = 10).
ZMIANY/COMMIT: kandydat 4c37994f15954fa1250066c2464aa6c3f4b10fc0 (potomek b0311c92f: merge-base --is-ancestor OK). Kod gry: tylko gra/src/game/no-negative-stocks.ts (stala = 1 + komentarze); main.ts bez zmian (l.7522 `turn < NNS_AI_BALANCE_TURN_MIN` przy T>=1 nigdy nie wraca; wlasciciele liczeni tylko z miast AI, wiec AI bez miast nie wchodzi w rownowazenie). Testy: c2-test, c3-turn-test (komentarze), headless-measure (komentarze), nowy ai-from-turn1-test. Allowlista zachowana, git diff --check czysty.
TESTY (surowe wyniki; node_modules z npm ci, usuniete po pracy):
- tsc --noEmit: 0 bledow (pusty output)
- logic-test 213/213; tech-tree-test 20/0; research-test 33/0; unit-replace-test 21/21; combat-test 6/6; unit-power-test 6/0
- no-negative-stocks-c2-test 44/0; ai-from-turn1-test 27/0; ai-test 8/0; diplo-peace-ai-ai-nonnegative-test 21/0
- Czerwony na bazie: ai-from-turn1-test z no-negative-stocks.ts z b0311c92f -> 16 pass, 11 fail (np. "AI tura 1: minus spichlerza aktywuje rownowazenie").
- Bramki poza zestawem szybkim (generator mapy, AI buduje budynki, Chromium): NIE_ZMIERZONO; zmiana to jedna stala, nie dotyka ich kodu.
WERDYKT ZARZUTOW:
1 (brak pelnego pomiaru przed/po): ODDAL. Obrona dostarczyla pomiar seed 11 (naruszenia major T1-10 70->0, T11-30 48->5, min skarbiec T10 -155->0, mediana miast AI T30 8->8, jednostki T30 60->60, eliminacje 26->26): brak spowolnienia. Seed 22/33 NIE_ZMIERZONO. Pomiaru FC nie powtarzalem (NIE_ZMIERZONO).
2 (live Chromium): ODDAL; NIE_ZMIERZONO osobno, pomiar headless w bundlu pokrywa ujemne stany AI T1-10 dla seed 11.
3 (brak testu integracji main.ts T1-10): ODDAL jako dlug testowy; w main.ts brak galezi zaleznej od tury poza stala, funkcje czyste pokryte.
4 (komentarze progu 11): naprawione przez Obrone (bf1ebfbcc), sprawdzone.
5 (dlug Rust REPIN): ODDAL - zadanie orkiestratora.
Zadnego NAPRAW.
BLOKADY: brak.
RUNDY: 1/5 (FC)
NASTEPNY KROK: orkiestrator integruje 4c37994f1, zaklada dlug REPIN Rust (prog rownowazenia AI = 1), opcjonalnie pomiar seed 22/33 i live.
UWAGI-DLA-ORKIESTRATORA: dlug testowy - test integracyjny T1-10 przez main.ts; pomiar seed 22/33; REPIN Rust.
DEPLOY/PUSH: NIE WYKONANO
