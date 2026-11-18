STATUS: PASS-WITH-NOTES
DOMAIN: INFORMATIONAL/GAME (treść Civpedii + wikiBundle)
TEMAT: R-WEB-DOC-CIVPEDIA-MELEE-ZERO-DAMAGE-AND-ARCHER-FLEE-NOTES-Q1
GOAL: obrona kandydata 31d97edf7 wobec zarzutów Evaluatora (db6d74f02); poprawka notki o łucznikach i odsuwaniu; regeneracja wikiBundle generatorem.
BAZA: 31d97edf7a27d1af5d32e0b3fa9f76632baa453e (start obrony), runda 2 obrony.

ODPOWIEDZI NA ZARZUTY:
- Zarzut 1 (osłona wręcz, −50% morale strzelców): PRZYJMUJĘ. Dopisano zdanie o regule i progu ucieczki. Dowód: battleScene.ts:10341-10361 (_checkMeleeScreenLost: u.morale*0.5, potem _checkRout).
- Zarzut 2 (odsuwanie): PRZYJMUJĘ. Zdanie zmienione z „odzyskać odstęp co najmniej 2 pól” na: strzelec cofa się o krok, gdy podszedł wróg WRĘCZ w odległości do 2 pól; wrogowie dystansowi nie wywołują. Dowód: battleScene.ts:989 (MELEE_SAFE_GAP = 2), 7021 (warunek rangedKite !== false), 7023 (manhattan <= MELEE_SAFE_GAP), 8833 (_nearestEnemyMelee pomija primaryRanged). Stała RANGED_MIN_GAP (l.979) nie jest już źródłem opisu i nie występuje w notce.
- Zarzut 3 (zakres 1–3 zdania): PRZYJMUJĘ częściowo. Dwa podrozdziały skrócono do 3 + 5 zdań, bez treści poza dwiema poprawkami. Sprzeczność „minimum 1 vs 0” NIE jest rozstrzygana w tekście: notka opisuje oba stany, bo decyzja wymaga ABC (patrz BLOKADY).

ZMIANY/COMMIT: docs/encyklopedia/pojecia/ruch-i-cios-w-bitwie.md (sekcje „Obrażenia wręcz a pancerz” i „Morale i ucieczka”, skrócone i poprawione); gra/src/data/wikiBundle.json (regeneracja: node gra/tools/bundle-wiki-for-game.cjs, diff 2 linie); raport 30-obrona-claude.md. Zero zmian w gra/src poza wikiBundle.json.

TESTY (surowe wyniki, po npm ci --ignore-scripts w gra/):
- npx tsc --noEmit: exit 0
- civpedia-historia-infra-test: 18 pass, 0 fail
- civpedia-oslabienie-docs-guard-test: 7 PASS, 0 FAIL
- civpedia-cuda-historia-test: 126 pass, 0 fail
- polish-language-audit-q1-guard-test: 7497 ok, 0 fail
- regeneracja bundle: ponowne uruchomienie generatora nie zmienia pliku (stabilna)
- git diff --check: czysto. Dowód mutacyjny: NIE ZMIERZONO (zmiana wyłącznie treściowa, jak w ocenie Evaluatora).

BLOKADY:
1. DECYZJA WŁAŚCICIELA (ABC): w bitwie ręcznej cios wręcz daje minimum 1 (battleScene.ts:9576), w auto-walce 0 (combat.ts:1186, 1208). Notka opisuje oba stany. Trzeba wybrać: ujednolicić kod albo opis.
2. NIE ZMIERZONO: odsuw łuczników w bitwie ręcznej (brak testu na żywo).

RUNDY: 2/5 (obrona)
NASTĘPNY KROK: Evaluator/Final Control weryfikują poprawki 1–3 i regenerację bundle; decyzja ABC z BLOKADY 1 przed deployem tekstu.
DEPLOY/PUSH: NIE WYKONANO
