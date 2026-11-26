STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-ALLIANCE-LABEL-AFTER-DEAL-Q1
GOAL: po usunięciu umowy sojuszu relacja pary przestaje być "sojusz"; same-civ major AI <-> miasto-państwo zachowuje status.
KANDYDAT: eb4d249d0c22a56b7c9fd658b8f66e76eadf6a5a (kod 93d6f9d71), baza b1e4e04ab3af27a1241282d5cea1e9a97c2d4617.

ZMIANY/COMMIT:
- merge-base --is-ancestor baza -> kandydat: OK.
- diff --stat (5 plików, +282/-2): diplomacy-treaties.ts (+45: isStaleAllianceStatus z exempt, alliancePairsToReset, export isAllianceKind), main.ts (+26: reconcileAllianceStatusAfterDeals + 5 wywołań), alliance-label-clean-test.cjs (+112), 10-operator-claude.md, 30-obrona-claude.md. Wszystko w allowliście; brak gra-robocza/kanon/WERSJE/rust-port.
- Żadna asercja starego testu nie została osłabiona (zmieniony wyłącznie nowy test).

OCENA ZARZUTÓW (per zarzut):
1 (regres same-civ major AI <-> MP): NAPRAWIONY. reconcile przekazuje exempt = isAiMajorToSameCivCityStatePair(a,b,pairOpts); funkcja symetryczna (major/MP w obu kolejnościach). Mutacja własna: exempt -> () => false => alliance-label-clean-test PASS=25 FAIL=1 (zabita).
2 (test tylko tekstowy dla main.ts): CZĘŚCIOWO. Logika decyzji to czysta funkcja testowana na danych (testy I-J); wywołanie w main.ts sprawdza test tekstowy G. Mutacja własna: pairs -> [] w reconcile => PASS=25 FAIL=1 (zabita; wcześniej mutant żył). Luka resztkowa: main.ts nieładowalny w node, wykonanie reconcile w żywej grze NIE ZMIERZONO (nota, nie FAIL).
3 (tsc 177 błędów): ODRZUCONY słusznie. npm ci --ignore-scripts; npx tsc --noEmit -p tsconfig.json => exit 0, 0 błędów (własne uruchomienie).
4 (opis pokrycia): korekta opisu, bez wpływu na kod. Wywołania reconcile: odmowa wezwania (~22870), odmowa sojuszu finalize (~26340), expire w ticku (~26732), trybut (~26796), wasalizacja (~27264); reconcile w każdym ticku pokrywa pozostałe ścieżki znikania umowy. Luki nie stwierdzono.
5 (migracja zapisów): zachowanie zaakceptowane; stare statusy "sojusz" bez umowy czyszczone przy najbliższym ticku; pary same-civ chronione przez exempt.

Analiza dodatkowa: jedyny inny zapis status:'sojusz' w main.ts to syncRelationFromDeals (z umowy); pary same-civ ustawia startRelationForAiMajorSameCivCityState/maintain (chronione exempt). Wojna nietknięta (isStaleAllianceStatus zwraca false dla status != 'sojusz'). Zaufanie/respekt zachowane ({...getDiploRelation, status:'pokoj'}).

TESTY (własne, surowe wyjście, w gra/, node_modules z npm ci --ignore-scripts):
- tsc --noEmit -p tsconfig.json: exit 0, 0 błędów
- logic-test: 213/213
- tech-tree-test: 20 pass, 0 fail
- research-test: 33/33
- unit-replace-test: 21/21
- combat-test: 6/6
- ai-test: 297 passed, 0 failed
- war-rules-multiwar-main-guard-test: 21 PASS / 0 FAIL
- alliance-label-clean-test: PASS=26 FAIL=0
- Stare testy sojuszy/dyplomacji bez przeglądarki (wszystkie zielone): ai-ai-alliance-limit (mutanty 4/4), ai-ai-alliance-measure-hook, ai-ai-alliance-surcharge, ai-ai-alliance-tick (19/19, mutanty 8/8), alliance-limit-ai-t66 6/6, alliance-war-call-saveload 7/0, alliance-war-obligation 14/0, diplo-alliance-gate 21/0, diplo-forced-peace-pending 40/0, diplo-forced-peace-d2-guard 9/9, diplo-human-peace-no-war 13/0, diplo-aggressor-* (21 / 73 / 19 killed / 15), diplo-active-treaties-resource-deals 15/0, pozostałe diplo-* z listy 0 FAIL.
- Mutacje własne (main.ts przywrócony): exempt -> () => false: FAIL=1; pairs -> []: FAIL=1.

POMIAR liczby sojuszy AI przed/po: NIE ZMIERZONO (Chromium, znany crash #90). Próg DECISION_REQUIRED (spadek >30%) nie sprawdzony. Kryterium dopuszcza "NIE ZMIERZONO z powodem". Ryzyko resztkowe: podmiana sojuszu AI<->AI (okno 1 tura) mogła opierać się na pozostającej etykiecie; testy ai-ai-alliance-tick/limit zielone, żywy bieg niezweryfikowany.

BLOKADY: brak blokujących. Noty: (a) pomiar przed/po NIE ZMIERZONO, (b) wykonanie reconcile w main.ts pokryte testem tekstowym + czystą funkcją.
RUNDY: FC po rundzie 2/5.
NASTĘPNY KROK: integracja orkiestratora (kandydat eb4d249d0), deploy na ROBOCZĄ jako FALA po osobnej autoryzacji; pomiar liczby sojuszy AI seed 4242/7 do t67 po ustabilizowaniu Chromium (VERIFY-LIVE).
UWAGI-DLA-ORKIESTRATORA: do integracji użyj eb4d249d0 (kod + raporty operatora/obrony).
DEPLOY/PUSH: NIE WYKONANO
