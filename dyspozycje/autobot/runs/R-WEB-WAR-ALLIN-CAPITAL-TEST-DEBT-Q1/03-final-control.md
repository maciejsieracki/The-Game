STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB), dlug testowy
TEMAT: R-WEB-WAR-ALLIN-CAPITAL-TEST-DEBT-Q1
GOAL: Zmierzyc i sklasyfikowac czerwone testy wojny, doprowadzic do zielonych bez oslabiania asercji.
ZMIANY/COMMIT: b6b94e127 (rodzic 56aa8c68d); 6 plikow gra/tools + dowody w runie; gra/src bez zmian; allowlista czysta.
TESTY (niezaleznie, po npm ci --ignore-scripts, EXIT=0 wszystkie): war-allin-capital 98/0, ai-siege-requires-war 49/0, forced-war-waves 17/0, march-attack-queue-persist 57/0, promote-to-front 129/0; tsc --noEmit EXIT=0; git diff --check 56aa8c68d b6b94e127 EXIT=0.
ZARZUTY: brak (Evaluator: zarzuty=[]). NAPRAW: 0, ODDAL: 0, DO DECYZJI: 0.
WERYFIKACJA DIFFU: harness honoruje allowFriendlyStack tylko dla heksu docelowego i tylko dla wlasnych jednostek (obce/wrogie nadal blokuja); asercja 1a bez zmian; sekcja 15 przepisana na kontrakt P-REKRUTACJA-JEDNOSTEK-TYLKO-SKARBIEC-Q1=B z zachowanym pokryciem B2 w wariancie z budynkiem; 24a celuje w migrated.prod + nowa 24a2.
NOTATKI: hashe flagi OFF przypiete na nowo (chronia nowy stan referencyjny); mutacji nie powtarzano (wg Operatora 94/4 po wylaczeniu honorowania flagi); pelne globy regresji NIE_ZMIERZONO; main.ts:4142/4165 insertAtFront dla jednostki -> do tematu SIEGE-BLOCKADE.
BLOKADY: brak
RUNDY: 1/5
KOLEJNOSC INTEGRACJI: origin/main (6983bbb4d) jest przed b6b94e127 (baza 56aa8c68d) -- zrebase'owac/zmergowac na origin/main i ponowic 5 testow + tsc; origin/rust-port/parity-v2 (b520768b0) niezalezny (zmiany tylko gra/tools), brak wymaganej kolejnosci wzgledem parity-v2.
NASTEPNY KROK: integracja orkiestratora
DEPLOY/PUSH: NIE WYKONANO
