STATUS: PASS-WITH-NOTES (Obrona r1; zarzuty Evaluatora: 2 przyjęte z dowodem, 1 przyjęty częściowo, 1 odrzucony jako poza zakresem)
DOMAIN: GAME
TEMAT: R-WEB-TEST-DEBT-BASELINE-Q4
GOAL: ukrycie wpisów zerowych w „Rozbicie obrony” (kod, nie dane) + wycofanie 5 testów pr141 jako dowodów historycznych; defense-breakdown 0 FAIL z mutacją; pętla pr141 33/33 zielone lub wycofane.
ZMIANY-COMMIT: baza kandydata f83aefc45 (Operator r1). Obrona dokłada jeden nowy plik: gra/tools/README-WYCOFANE-TESTY-pr141.md (rejestr 5 wycofanych testów; allowlista: gra/tools/README*). Commit obrony: patrz SHA końcowy w polu sha zwrotki. Brak zmian w kodzie gry i w testach w tej rundzie.

ODPOWIEDZI NA ZARZUTY EVALUATORA (83ccc3da7):
1. (merge-tree, brak sekcji w 10-operator) PRZYJĘTE. Zmierzone w tej rundzie: `git merge-tree --write-tree origin/main f83aefc45` -> exit 0, tree 5743483147fd10418954252fc177589b76f608e7 (czysto, zgodne z pomiarem Evaluatora). Wynik wpisany tutaj; 10-operator-claude.md nie jest modyfikowany (zasada: nie przepisujemy raportu Operatora).
2. (sekcja H częściowo tautologiczna) ODRZUCONE z dowodem. Asercja „źródło zawiera filtr” jest tylko strażnikiem preconditions budowy mutanta. Asercja behawioralna `mutLines.length !== prodLines.length` zależy od WYNIKU uruchomienia zmutowanej kopii, nie od tekstu. Pomiar w tej rundzie (sed usuwający linię filtra z src/game/defenseBreakdown.ts, potem `git checkout --` przywracający plik; git status po przywróceniu czysty):
   - produkcja: `=== defense-breakdown-test: 49 pass, 0 fail ===` (exit 0)
   - bez filtra: `=== defense-breakdown-test: 34 pass, 8 fail ===` (exit 1)
   Zgodnie z ocenami Evaluatora: 8 FAIL = 6 asercji Falangi/cityDefenseBreakdownLines + 2 asercje sekcji H. Sekcja H wnosi więc własną ochronę, nie tylko dublując Falangę.
3. (brak adnotacji w rejestrze/README tools) PRZYJĘTE. Dodany plik gra/tools/README-WYCOFANE-TESTY-pr141.md z tabelą 5 testów, powodem wycofania i sposobem przywrócenia. Mieści się w allowliście (gra/tools/README*). Nagłówki plików pozostają (adnotacja w pliku + rejestr).
4. (informacyjne: process.exit(0) maskuje 5 testów trwale; brak flagi historycznej) ODRZUCONE jako zmiana w tym temacie. Wariant wycofania in-place jest decyzją właściciela (ABC A, 2026-11-16). Dodanie flagi uruchamiającej dowód historyczny to nowa funkcja poza dispatchem. ZNALEZISKO przekazane do UWAGI-DLA-ORKIESTRATORA (orkiestrator decyduje, bez nowej sesji ani zadania).

TESTY (ZMIERZONO w tej rundzie, surowe wyniki):
- `npm ci` w gra/: exit 0.
- `npx tsc --noEmit -p tsconfig.json`: exit 0, bez wyjścia.
- `node tools/defense-breakdown-test.cjs`: exit 0, `=== defense-breakdown-test: 49 pass, 0 fail ===`.
- Mutacja (usunięcie linii `if (b.wartosc === 0) continue;`): exit 1, `=== defense-breakdown-test: 34 pass, 8 fail ===`; przywrócone (git checkout), git status czysty przed commitem.
- Pętla `for f in tools/pr141-*test.cjs` (33 pliki): 33 x exit 0; 5 wypisuje „WYCOFANY: dowód historyczny” (grep po wyjściu).
- `git diff --check`: exit 0, bez wyjścia.
- `git merge-tree --write-tree origin/main f83aefc45`: exit 0, tree 5743483147fd10418954252fc177589b76f608e7.
- `git merge-base --is-ancestor f83aefc45 HEAD`: TAK (kandydat jest przodkiem gałęzi obrony).
- Pięć referencyjnych testów (logic, tech-tree, research, unit-replace, combat): NIE ZMIERZONO w tej rundzie (kod gry nie był zmieniany; wyniki Evaluatora 213/213, 20/0, 33/33, 21/21, 6/6 nie były powtarzane przeze mnie).
- Chromium / test live panelu: NIE ZMIERZONO (zmiana czysto logiczna; `git grep -l defenderCivBonusBreakdown gra/tools` = tylko defense-breakdown-test.cjs).

BLOKADY: brak.
RUNDY: 1/5 (obrona r1 po zarzutach Evaluatora r1).
NASTĘPNY KROK: Final Control (SONNET) na gałęzi/SHA obrony; integrację i push wykonuje orkiestrator po FC.
DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA:
- Operator r1 zostawił detached HEAD w worktree; obrona pracuje na tym samym detached HEAD (commit obrony nad f83aefc45). Orkiestrator zdecyduje o gałęzi/refs/keep.
- Znalezisko (poza zakresem, bez działań): skrypty pr141 wycofane przez process.exit(0) nie mają trybu uruchomienia dowodu historycznego. Ewentualny temat na przyszłość: flaga `PR141_HISTORIC=1`. Nie zakładano sesji/zadania.
- Dług poza zakresem: wspolnaReligia w main.ts:44101 nie była ruszana (zgodnie z dispatchem).
- Sprzątanie: gra/node_modules usuwany po zapisie raportu; /tmp pliki tej rundy usunięte.
