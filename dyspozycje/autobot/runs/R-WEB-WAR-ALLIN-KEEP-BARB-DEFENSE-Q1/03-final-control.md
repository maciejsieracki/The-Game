STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-WAR-ALLIN-KEEP-BARB-DEFENSE-Q1
GOAL: war-allin nie przejmuje obroncow przydzielonych do obrony domu przed barbarzyncami; reszta armii maszeruje jak dotad.
ZMIANY/COMMIT: weryfikowano 8349ce8ee (raport) na cf2bc8d71 (fix), baza c3d859a40 = origin/main. Diff do bazy: tylko gra/src/game/ai.ts, gra/tools/war-allin-keep-barb-defense-test.cjs, runs/<ID>/**. Brak zakazanych sciezek. git diff --check czysto.

WERDYKTY ZARZUTOW
1. Zakres tylko barbarzyncy: ODDAL. Dispatch dopuszcza "barbarzyncy lub, jak w DEFEND-HOME, najezdzcy"; szersza wersja psuje ai-war-defend-home (25/5, zmierzone przez Obrone). Najezdzcy zostaja przy DEFEND-HOME. Wymaga ewentualnego osobnego tematu, nie wada.
2. Allowlista (krok 4b2 w ai.ts): ODDAL, z jawna akceptacja orkiestratora. Zmiana minimalna (zbior homeDefenseMoveIds + 1 linia), konieczna - tylko tam wiadomo, kto jest obronca.
3. Sciezka wodza (drugie wywolanie war-allin) i brak pomiaru pelnej rozgrywki: ODDAL jako znana, udokumentowana luka (NIE_ZMIERZONO); proponowany osobny temat.
4. Interakcja obroncow z planWarReplacementRally (kotwice skupiska): ODDAL jako ryzyko male, nieudowodnione; ten sam mechanizm co dla jednostek w keep. NIE_ZMIERZONO.
Zadnego NAPRAW. Zadnej decyzji produktowej.

TESTY (wlasna weryfikacja na 8349ce8ee)
- nowy test: 8/0; na ai.ts z bazy: 7/1 (RED potwierdzony); mutacja Operatora EXIT=1.
- ai-war-defend-home 30/0, ai-home-defense-vs-barbarians 46/0, ai-war-gate 24/0, army-concentration 56/0, ai-army-scattered-merge 33/0, ai-general-war-campaign 51/0, ai-move-full-range 20/0, war-allin-capital 98/0.
- tsc --noEmit EXIT=0.
- war-allin-capital-regress: NIEZIELONE 0 - stan zastany, nie powtarzano.
- Determinizm war-allin-capital-quick: hashe identyczne z baza (potwierdzone przez Evaluatora).
BLOKADY: brak blokujacych; luki z pkt 3-4.
RUNDY: FC 1/5 (lacznie runda 2/5)
NASTEPNY KROK: integracja orkiestratora (cherry-pick cf2bc8d71 + 8349ce8ee na origin/main), potem deploy po osobnej autoryzacji.
DEPLOY/PUSH: NIE WYKONANO
