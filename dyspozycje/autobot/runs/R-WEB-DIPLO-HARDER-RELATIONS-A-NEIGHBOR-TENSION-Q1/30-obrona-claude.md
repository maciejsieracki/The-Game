STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-HARDER-RELATIONS-A-NEIGHBOR-TENSION-Q1
GOAL: Obrona rundy 1 (A1 napięcie graniczne, A2 handel bez przyjaźni, A3 zazdrość lidera) za flagą twardaDyplomacjaAktywna=false; bez zmiany zachowania gry przy OFF.
ZMIANY-COMMIT: baza 62ad1dc25. Zmienione pliki: gra/src/game/diplomacy-harder.ts (karaGranicaZNapieciem, harderPairDeltas, resetNeighborTenureSession, reset licznika przy cofniętej turze), gra/src/main.ts (wpięcie przez harderPairDeltas; reset w initAllAiOwnersForNewGame i prepareSessionForLoad), gra/tools/diplomacy-harder-unit-test.cjs (+19 asercji), dyspozycje/autobot/runs/R-WEB-DIPLO-HARDER-RELATIONS-A-NEIGHBOR-TENSION-Q1/30-obrona-claude.md. SHA: patrz pole sha.
TESTY (surowe wyniki):
- tsc --noEmit: exit 0.
- diplomacy-harder-unit-test: PASS 50 FAIL 0 (wcześniej 31/0).
- Mutacje na kopii (przywrócono): usunięty wiersz zazdrości w buildRelationBreakdown -> FAIL 1; usunięty cap łączny granicaMax -> FAIL 1 (got -9 want -6).
- tech-tree-test: 20 pass, 0 fail.
- logic-test: LOGIC OK (213/213); research-test: ALL GREEN; ai-unit-replace-same-rules: 45 passed, 0 failed; combat-test: All sanity checks passed.
- diplomacy-test: 149 passed, 0 failed; diplo-trust-numbers-test: 22 pass, 0 fail; diplo-tick-war-brake-unit-test: 69 pass / 0 fail; diplo-factors-military-row-current-only-test: prod pass=20 fail=0; diplo-trust-war-drift-test: PASS=14 FAIL=0.
- (c) bieg dymny ON/OFF w żywej grze: NIE_ZMIERZONO. Brak przeglądarki Playwright (~/.cache/ms-playwright nieobecny) i zakaz npm run build w gra/ uniemożliwiły bundle; runnera/analizatora nie dostarczono w tej rundzie.
- npm ci --ignore-scripts w gra/ wykonany (df / 16 GB wolne przed startem).

ODPOWIEDZI NA ZARZUTY:
1. PRZYJMUJĘ. Runner/analizator (c) nie dostarczony; NIE_ZMIERZONO, do decyzji orkiestratora (wymaga bundla poza repo i Chromium dla Playwright).
2. PRZYJMUJĘ CZĘŚCIOWO. Dodano test parytetu na poziomie ctx: computeTickZaufanieDelta(ctx, atWar, z) == wynik bazowy dla 4 kontekstów x 5 wartości zaufania x 2 stany wojny (PASS). Przed/po na zapisanym stanie gry nie wykonano (NIE_ZMIERZONO). Gałąź main.ts przy OFF to `return ctxBazowy` przed jakąkolwiek zmianą.
3. PRZYJMUJĘ CZĘŚCIOWO. Logika wpięcia przeniesiona do czystej funkcji harderPairDeltas (main.ts tylko ją wywołuje); testy pokrywają A1 w ctx (granica bazowa + napięcie, cap łączny), A3 (lider/AI/gracz/sojusz) i cap wymiany P7 (capZaufanieZaHandel). Sam call-site w boot() bez testu live.
4. PRZYJMUJĘ I NAPRAWIONO. Założenie: "łącznie -6" = łączna kara za granicę (baza + napięcie) ucięta do -granicaMax (karaGranicaZNapieciem). Przykłady: baza -3, tura 60 -> -6 (nie -9); baza -5, tura 10 -> -6.
5. PRZYJMUJĘ I NAPRAWIONO. Licznik czyszczony w initAllAiOwnersForNewGame (nowa gra) i prepareSessionForLoad (wczytanie); cofnięta tura (since > turn) też resetuje licznik. Test: reset sesji (bez resetu byłoby 10, jest 0). Nie zweryfikowano, że initAllAiOwnersForNewGame jest wołane we WSZYSTKICH ścieżkach nowej gry; guard cofniętej tury to częściowe zabezpieczenie.
6. ODRZUCAM CZĘŚCIOWO (dowód). Dispatch: zazdrość od "każdej AI, która NIE jest sojusznikiem"; partner-gracz = 0 jest zgodne z dispatchem (test: "para lider-gracz: zazdrość 0"). Pary AI<->AI przechodzą przez buildDiplomacyTickCtxForPair: main.ts:12581 (tickDiplomacy w pętli AI-AI) i main.ts:24614 (pairTickCtx). Test: para lider-AI bez sojusznika = -2.
7. PRZYJMUJĘ I DODANO TEST. Wiersz "Zazdrość wobec lidera" w buildRelationBreakdown: widoczny gdy ≠0, ukryty gdy 0 lub brak pola; mutacja usuwa wiersz -> FAIL.
8. ODRZUCAM Z DOWODEM. tools/tech-tree-test.cjs: 20 pass, 0 fail (surowe wyjście powyżej).

BLOKADY:
- Licznik A1 (neighborSinceTurn) nadal w pamięci modułu, nie w SaveGame. Po wczytaniu zapisu startuje od nowa. Decyzja ABC przed włączeniem flagi.
- Pomiar live (c) NIE_ZMIERZONO (patrz wyżej).
RUNDY: 2/5 (obrona rundy 1)
NASTĘPNY KROK: Orkiestrator: (1) decyzja o zapisie licznika A1 w SaveGame; (2) bieg dymny ON/OFF (runner poza repo, bundle budowany poza gra/); (3) Evaluator rundy 2.
UWAGI-DLA-ORKIESTRATORA: granicaMax interpretowane jako cap łączny (baza + napięcie); jeśli właściciel miał na myśli cap samego napięcia, zmiana to jedna linia w karaGranicaZNapieciem.
DEPLOY/PUSH: NIE WYKONANO
