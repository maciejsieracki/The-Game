STATUS: FAIL
DOMAIN: GAME (POMIAR; kod gry nietkniety)
TEMAT: R-WEB-DIPLO-LEVEL-MEASURE-3-LEVELS-Q1
GOAL: pomiar 3 poziomow "Dyplomacja i wojna" x seed 4242/7 x 90 tur + pin B2b
ZMIANY-COMMIT: kandydat 8413b4c12 (rodzic e5edebb45, baza 83da0fb18 jest przodkiem). Allowlista OK: git diff --name-only 83da0fb18..8413b4c12 = 10-operator-claude.md, seed4242-all1-lvl-latwa.jsonl.gz, gra/tools/diplomacy-harder-measure-hook-test.cjs, gra/tools/diplomacy-harder-measure-run.cjs. Zero zmian gra/src, gra/data, main.ts. Brak oslabionych asercji (B2b zmieniona na reset===dataDefault && reset===true, wartosc z data/diplomacy-harder-params.json; pozostale bez zmian).
TESTY (wlasne, surowe wyniki, bundle z kandydata poza repo): tsc --noEmit exit 0; logic 213/213; tech-tree 20/0; research 33/0; unit-replace 21/21; combat 6/6; diplomacy-measure-resume-test 8 zielonych/0; diplomacy-harder-measure-hook-test z bundlem 21 zielonych/0 (B2b zielona); diplomacy-all-flags-measure-hook-test 35/0 (mutacje czerwone).
Wlasny przebieg --diplo-level (seed 7, 3 tury, all-flags 1): trudna x2 i normalna x1 -> Chromium zamyka sie (SIGSEGV) w openGame po startNewGame (linia 173, waitForFunction), 3/3 prob; ten sam bieg BEZ --diplo-level (seed 7) przechodzi (tury 2,3 OK). Nie rozstrzygniete, czy to srodowisko, czy sciezka startNewGame; NIE ZMIERZONO sciezki --diplo-level dla trudna/normalna. Operator mial jeden udany start (latwa, seed 4242: 15 wierszy t5..75, diploLevel=latwa w kazdym wierszu).
Wlasna mutacja dla testu dowodowego B2b: nie wykonana (bundle zawiera dane, edycja gra/data zakazana); asercja jest jawna (=== true), stara wartosc false dawalaby czerwone na obecnym bundlu.
BLOKADY: brak dokumentu POMIAR-POZIOMY-DYPLOMACJI-2026-11-20.md; dane tylko 1 z 6 biegow, tylko do t75.
RUNDY: ocena rundy 1/5
NASTEPNY KROK: runda 2 Operatora: wznowic seed 4242 latwa ze slotu, potem normalna/trudna i seed 7; rozwazyc restart Chromium miedzy odcinkami; zbadac crash przy startNewGame dla normalna/trudna.
DEPLOY-PUSH: NIE WYKONANO

ZARZUTY:
1. Zadanie (3): brak dokumentu dyspozycje/analizy/POMIAR-POZIOMY-DYPLOMACJI-2026-11-20.md (allowlista go przewiduje, nie istnieje).
2. Zadanie (2): wykonano 1 z 6 biegow (seed 4242 latwa) i tylko do tury 75 z 90; brak normalna/trudna i seed 7; brak runs/<ID>/*.jsonl.gz dla 5 biegow.
3. Bramki: operator zadeklarowal NIE ZMIERZONO (tsc, logic, tech-tree, research, unit-replace, combat, hook-testy, resume-test); ewaluator odtworzyl je wszystkie zielone, ale kandydat nie dostarczyl dowodu sam.
4. Opcja --diplo-level: w srodowisku ewaluatora nieweryfikowalna dla normalna/trudna (crash Chromium po startNewGame, 3/3); latwa potwierdzona tylko danymi operatora.

UWAGI-DLA-ORKIESTRATORA: kod runnera i pin B2b wygladaja poprawnie i spelniaja zakres (e5edebb45 mozna przeniesc do nastepnej rundy jako baze). Wymagany tylko dokonczony pomiar.
