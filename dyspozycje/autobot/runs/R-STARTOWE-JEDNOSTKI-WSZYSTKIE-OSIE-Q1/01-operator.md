# 01 — OPERATOR

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
ROLE: Operator
PROCESS_PHASE: operator
TEMAT: R-STARTOWE-JEDNOSTKI-WSZYSTKIE-OSIE-Q1
KANBAN_CARD: t_af4dfeb8
RUNDY: 1/5
ATTEMPT: 1
GOAL: Zgodność startowych jednostek z właściwym arkuszem właściciela dla wszystkich czterech osi, z zachowaniem rozdzielenia gracza, głównego AI, obcych państw-miast i państw-miast typu gracza.

## Readback wejścia i Git

- Właściwy plik wejściowy: `/home/ubuntu/.hermes/attachments/The-Game-startowe-jednostki-do-korekty.xlsx`.
- SHA-256 właściwego Excela: `e04a427c5f761b19471b11855a236f280949b9b3be04682c09fcec2f03739cce`.
- Odczyt arkusza wykonany przez `zipfile`/XML; oba arkusze potwierdzają wartości poniżej.
- HEAD przy zakończeniu etapu: `8e5e81255449bc98c9674c6a6e5505d408b343fc`.
- Baza odczytana z Git: `origin/main` / merge-base `ff9ce26a663c53c9f711e50536eb10f59dc4b70b`.
- Faktyczna gałąź Git: `hermes/R-GRACZ-STARTOWE-JEDNOSTKI-TRUDNOSC-Q1`.
- Worktree: `/home/ubuntu/projects/The-Game-worktrees/R-GRACZ-STARTOWE-JEDNOSTKI-TRUDNOSC-Q1`.
- Dispatch deklaruje nazwę gałęzi `hermes/R-STARTOWE-JEDNOSTKI-WSZYSTKIE-OSIE-Q1`; raport zachowuje faktyczny odczyt Git bez normalizacji.

## Kontrakt i wynik czterech tabel

1. Gracz, główna trudność gry: `easy=2`, `normal=1`, `hard=0`.
2. Główna cywilizacja AI, główna trudność gry: dodatkowe jednostki `easy=0`, `normal=1`, `hard=2`; na `hard` pozostaje `+1` dodatkowe miasto, a przy zablokowanym legalnym heksie zachowany jest fallback jednostkowy.
3. Obce państwo-miasto, główna trudność gry: `easy=2`, `normal=1`, `hard=0`.
4. Państwo-miasto typu gracza, osobny suwak trudności państw-miast: `easy=0`, `normal=1`, `hard=2`; główna trudność gry nie zmienia tej osi.

## Zmiany

- `gra/src/game/ai-difficulty-bonus.ts`: zmieniono wyłącznie mapowanie `playerStartUnitCount` na `2/1/0`; zaktualizowano komentarz kontraktu.
- `gra/src/game/ai.ts`: fallback `startoweJednostki` dla poziomu 3 zmieniono z `0` na `2`.
- `gra/data/ai-params.json`: rzeczywisty parametr `trudnosc_poziom3_startowe_jednostki.wartosc` zmieniono z `0` na `2`.
- `gra/tools/ai-difficulty-bonus-test.cjs`: testuje pełne tabele JSON/fallback, hard `2` jednostki + `1` miasto, fallback `3` jednostki oraz aktualne mapowania gracza/AI/PM.
- `gra/tools/city-state-start-units-live-test.cjs`: izoluje bundle w katalogu tymczasowym systemu, czyści go po przebiegu i jawnie potwierdza istnienie stolicy gracza po realnym founding; zachowuje test niezależności PM od głównej trudności.
- `gra/tools/starting-army-first-city-live-test.cjs`: oczekiwania hot-seat zmienione na `1` jednostkę dla trudności `normal`; drugi founding nie przyznaje armii ponownie, a drugi fotel dostaje własną armię.
- `gra/src/main.ts`: brak zmian. Odczytane miejsca wywołania pozostają poprawnie rozdzielone: `main.ts:8951` osobny suwak PM dla rywali tego samego typu, `main.ts:9001` główna trudność gracza, `main.ts:9086` główna trudność obcego PM, `main.ts:9112` bonus major AI; guard pierwszego miasta jest per owner/fotel (`main.ts:13166-13182`, `main.ts:10006-10008`).

Realny diff roboczy: 6 plików allowlisty, `38` linii dodanych / `20` usuniętych; `git diff --check` przechodzi. Brak zmian poza allowlistą, bez commitowania, pushu, PR, merge i deployu.

## Weryfikacja

- `node --check` dla czterech skryptów: exit `0`.
- `node tools/ai-difficulty-bonus-test.cjs`: `90 passed, 0 failed`.
- `node tools/city-state-start-units-test.cjs`: `16 PASS, 0 FAIL`.
- `node tools/ai-balans-step5-test.cjs`: `18 passed, 0 failed`.
- `node tools/city-state-cluster-diff-test.cjs`: `31 passed, 0 failed`.
- `node tools/miasta-zbyt-blisko-test.cjs`: `20` map, `23281` par planu i `25463` par w symulacji realnej kolejności, `0` naruszeń.
- `node_modules/.bin/tsc --noEmit`: exit `0`.
- Chromium live `city-state-start-units-live-test.cjs`: `25 pass, 0 fail`; trzy pełne generacje świata; gracz `hard/normal/easy` odpowiednio `0/1/2`, obce PM `0/1/2`, PM typu gracza przy stałym PM `normal` zawsze `1`.
- Chromium live `starting-army-first-city-live-test.cjs`: `13 pass, 0 fail`; dwa fotele, pierwszy founding każdego fotela, brak ponownego bonusu na drugim mieście.
- Test mutacyjny: w izolowanej kopii przywrócono stare mapowanie `1/2/3`; test zakończył się `87 passed, 3 failed`, exit `1`, a wrapper potwierdził `mutant_killed=YES`.

`node tools/ai-test.cjs` ma `291 passed, 4 failed` (T2S-b, T2S-b2, T10b — handel/dyplomacja). Ten sam wynik i te same cztery komunikaty występują na czystym archiwum `HEAD`; to istniejący baseline poza zakresem zmiany startowych jednostek, odnotowany jako `PASS-WITH-NOTES`, bez maskowania i bez modyfikowania obcych ścieżek.

BLOKADY: brak blokady merytorycznej; uwaga środowiskowa/baseline: pełny `ai-test.cjs` ma cztery reprodukowalne, niezwiązane z tym tematem błędy handlu/dyplomacji.
DEPLOY/PUSH: NIE WYKONANO
NASTĘPNY KROK: Evaluator — niezależny readback diffu, allowlisty, testów i dowodów.
