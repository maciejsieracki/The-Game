STATUS: PASS
DOMAIN: GAME
TEMAT: R-WEB-TEST-DEBT-BASELINE-Q4
GOAL: Panel „Rozbicie obrony” nie pokazuje wpisów o wartości 0 (decyzja A); defense-breakdown-test wraca do 0 FAIL z mutacją; 5 testów pr141 (ledger v1, v3, v4, evidence-ledger-behavior, runtime-ordinary-scope) wycofane jako dowody historyczne (wariant: wczesne wyjście z kodem 0 i komunikatem „WYCOFANY: dowód historyczny”); pętla pr141 = 33/33 zielone lub wycofane. Dane Greków NIE zmienione; wspolnaReligia (main.ts:44101) NIE ruszana.
ZMIANY/COMMIT: baza a5fd45ff4066fb4b0a6baba23dc38efa617f0b76 (origin/main ef6e8ea1e NIE jest przodkiem; patrz merge-tree niżej). Allowlista:
  - gra/src/game/defenseBreakdown.ts: defenderCivBonusBreakdown -- dodany filtr `if (b.wartosc === 0) continue;` (ukrycie wpisów zerowych w panelu; dane civ-matrix bez zmian).
  - gra/tools/defense-breakdown-test.cjs: nowa sekcja H (mutacja) -- kopia źródła z WYCIĘTYM filtrem budowana w os.tmpdir() (importy zamienione na ścieżki absolutne), asercja: wynik mutanta dla Grekow na rosterze z samej piechoty różni się od produkcji (mut=2, prod=1) + asercja PRODUKCJA (każda linia affectedCount>0) + asercja obecności filtra w produkcyjnym źródle.
  - gra/tools/pr141-current-evidence-ledger-test.cjs, -v3-test.cjs, -v4-test.cjs, pr141-evidence-ledger-behavior-test.cjs, pr141-runtime-ordinary-scope-test.cjs: na początku (po 'use strict' / shebang) dopisany komentarz WYCOFANY z powodem + console.log('WYCOFANY: dowód historyczny -- ...') + process.exit(0). Wariant wybrany: wycofanie in-place (brak konwencji `_retired/` w repo; plik i historia zachowane).
  - Brak zmian w gra/data, WERSJE.md, manifeście, gra-robocza/, rust-port/.
  - Brak commitów poza tym tematem; nie użyto git add -A.
TESTY:
  - npm ci (gra/): added 71 packages, exit 0.
  - node tools/defense-breakdown-test.cjs PRZED zmianą: exit=1, 33 pass, 6 fail (Falanga/roster kawalerii, cityDefenseBreakdownLines 5 zamiast 4 linii, difficultyMult=1.0 3 linie, REGRESJA Falanga Rownina).
  - node tools/defense-breakdown-test.cjs PO zmianie (filtr): exit=0, 46 pass, 0 fail.
  - node tools/defense-breakdown-test.cjs PO dopisaniu sekcji H (mutacja): exit=0, === 49 pass, 0 fail === (3 nowe asercje H: MUTACJA obecność filtra OK; MUTACJA mut=2 vs prod=1 OK; PRODUKCJA affectedCount>0 OK).
  - Pętla `for f in tools/pr141-*test.cjs` (33 plików), exit code każdego: 33 x 0. Przed zmianą 5 z nich kończyło się exit 1 (current-evidence-ledger-test: „raw value differs from matrix meta_mnoznik_waluta/asyria”; v3: „current per-cell status differs from semantic API prod_szybkosc_jednostki_proc/grecy”; v4: ENOENT matrix-93x15-current-evidence-ledger-v4.json; evidence-ledger-behavior: ENOENT /workspace/pr141-review/current-consumers.json; runtime-ordinary-scope: ENOENT dyspozycje/autobot/runs/R-PR141-CODEX-RUNTIME-ORDINARY-PREP-20261019). Pozostałe 28 było zielone już przed zmianą (exit 0), wynik po zmianie też 0.
  - tsc --noEmit -p gra/tsconfig.json: exit=0, 0 linii wyjścia.
  - git diff --check: pusty wynik (czysto).
  - git grep -l defenderCivBonusBreakdown -- gra/tools: tylko gra/tools/defense-breakdown-test.cjs (brak innych testów UI do uruchomienia).
  - Chromium/testy live panelu: NIE ZMIERZONO (zmiana czysto logiczna; brak testu live panelu obrony w gra/tools dla defenderCivBonusBreakdown).
  - „5 referencyjnych po npm ci”: NIE ZMIERZONO (nie zidentyfikowano w dispatchu listy 5 referencyjnych testów; pętla pr141 wykonana w całości).
  - merge-tree vs origin/main: patrz sekcja niżej (wpisano po commicie).
BLOKADY: brak. Uwaga: wycofanie in-place (nie przeniesienie do _retired/) -- w repo nie ma konwencji _retired; brak też rejestru testów/README tools (gra/tools zawiera tylko ai-economy-measure-README.md), więc adnotacja jest w nagłówku każdego wycofanego pliku.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (SONNET) weryfikuje: filtr w defenderCivBonusBreakdown, mutację H (czy faktycznie czerwona przy cofnięciu), pętlę 33/33 i poprawność wycofań; FC (SONNET) po Evaluatorze. Orkiestrator integruje po Final Control (nie Operator).
DEPLOY/PUSH: NIE WYKONANO
UWAGI-DLA-ORKIESTRATORA: (1) Wybrany wariant wycofania: wczesne process.exit(0) w pliku (zamiast przeniesienia). (2) Operator nie zrobił push ani merge; gałąź wynikowa to detached HEAD w worktree. (3) Dług do osobnego tematu (poza zakresem): wspolnaReligia w main.ts:44101 -- zgodnie z dispatchem nie ruszane.
