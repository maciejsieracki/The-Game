STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-AI-TARGET-NEAREST-CITY-NOT-CAPITAL-Q1
GOAL: AI w wojnie z graczem lub z inną AI idzie na NAJBLIŻSZE miasto wroga, nie na stolicę. Barbarzyńcy jako atakujący bez zmian.
RUNDA: 2/5 (odpowiedź Operatora na zarzuty Obrony z 01-operator-r1 / commit 54cdf4abd)
BAZA: 54cdf4abd (r1) -> poprawka r2 w commicie opisanym w sekcji ZMIANY/COMMIT

## Odpowiedź na zarzuty

Z1 (kluczowy): kampania wodza prowadzi armię na STOLICĘ wroga -> PRZYJMUJĘ.
Dowód przed poprawką (odtworzony na 54cdf4abd): prepareAiGeneralWarCampaign (gra/src/main.ts) buduje `candidates` tylko ze stolic (capitalCityIdForOwner); appendAiGeneralCampaignOrders (gra/src/game/ai.ts) wołał applyWarAllInCapitalToCommands z `targets: [campaign.target]` = stolica. Test C4 (kampania bez pola targets) potwierdza, że bez nowej listy celów kampania idzie na stolicę.
Poprawka:
- gra/src/main.ts, prepareAiGeneralWarCampaign: po wyborze właściciela celu (wybór właściciela bez zmian: chooseAiGeneralWarTarget, routeAvailability, preferSeaReachableWarTargets) buduje listę celów marszu `campaignTargets` przez buildWarCityTargets (ta sama reguła co war-allin: AI/gracz -> wszystkie miasta wroga, barbarzyńca -> stolica). Zwraca ją jako pole `targets`. Brak miast -> fallback na dotychczasową stolicę.
- gra/src/game/ai.ts, appendAiGeneralCampaignOrders: `targets: campaign.targets ?? [campaign.target]` (brak pola = zgodność wsteczna); keepCampaignFields przenosi `targets`; typ opts.aiGeneralWarCampaign dostał pole `targets?`.
- Planer (planWarAllInCapital) sam wybiera najbliższe miasto od kotwicy grupy, więc nie ma ręcznego wyboru stolicy.
- Uwaga o allowliście: r2 dotyka prepareAiGeneralWarCampaign w main.ts (poza warAllInContextFor) oraz appendAiGeneralCampaignOrders/typu w ai.ts. Zakres ograniczony do wyboru celu kampanii; jest to dokładnie miejsce zarzutu. FC proszony o zatwierdzenie tej rozszerzonej allowlisty.

Z2 (brak testu na ścieżce kampanii) -> PRZYJMUJĘ.
Nowe testy w gra/tools/ai-target-nearest-city-test.cjs (wołają prawdziwe decideAITurn z opts.aiGeneralWarCampaign, stage 'attacking', wódz w armii):
- C1 kampania AI->gracz: 3 miasta, stolica NIE najbliższa -> wszystkie ruchy na najbliższe miasto gracza. PASS.
- C2 kampania AI->AI: 3 miasta wroga, stolica NIE najbliższa -> najbliższe miasto. PASS.
- C3 kampania, stolica JEST najbliższa -> cel = stolica (bez zmian). PASS.
- C4 kampania bez pola targets (zapis sprzed zmiany) -> stara stolica (zgodność wsteczna; dowodzi, że C1 rozróżnia). PASS.
- W2 / W3 (wiązanie źródłowe): słabsze, dodatkowe; C1-C4 są właściwym dowodem zachowania.
Wynik: 18/18 PASS (było 12/12).

Z3 (brak dowodu behawioralnego w grze/e2e) -> PRZYJMUJĘ CZĘŚCIOWO: pomiar w grze NIE_ZMIERZONO. Dowód = testy silnika na prawdziwym decideAITurn; pełny prepareAiGeneralWarCampaign (zamknięcie w main.ts) nie jest uruchamialny w teście jednostkowym. Pomiar live (przeglądarka, tura z wodzem i 3 miastami gracza) zostawiam FC/QA jako NIE_ZMIERZONO.

Z4 (uwaga o pozostałych ścieżkach) -> PRZYJMUJĘ, tabela kompletna poniżej.

Z5 (war-allin-capital-test 96/2 nieodtworzone) -> ODTWORZONE NIE; NIE_ZMIERZONO w tej rundzie. Pozostałe testy war-allin z listy wykonane (patrz TESTY).

## Tabela: plik:linia -> co wybiera cel (PO poprawce r2)

| Ścieżka | plik:linia | Cel |
|---|---|---|
| Kampania wodza, wybór WŁAŚCICIELA (stolice jako kandydaci) | gra/src/main.ts ~7512-7531 (candidates, chooseAiGeneralWarTarget) | właściciel; kandydat = stolica (tylko do wyboru właściciela) |
| Kampania wodza, LISTA CELÓW marszu | gra/src/main.ts 7541 (buildWarCityTargets), 7551 (campaignTargets), 7599 (targets) | AI/gracz: wszystkie miasta wroga; barbarzyńca: stolica |
| Kampania wodza, marsz (attacking) | gra/src/game/ai.ts 5086 (`targets: campaign.targets ?? [campaign.target]`) -> applyWarAllInCapitalToCommands (ai.ts 4388) | planer: najbliższe miasto od kotwicy |
| Kampania wodza, zbiórka (recruiting/gathering) | gra/src/game/ai.ts ~5010-5035 | brak celu miasta: punkt zbiórki pod wodzem (najbliższy wódz) |
| Wczesny endTurn kampanii | gra/src/game/ai.ts 3674 i ~5190 (appendAiGeneralCampaignOrders zwraca true) | brak nowego wyboru celu, tylko przekazuje powyższe |
| war-allin (gdy brak kampanii) | gra/src/main.ts 33462 (warAllInContextFor -> buildWarCityTargets) | AI/gracz: najbliższe miasto; barbarzyńca: stolica |
| Planer war-allin, AI | gra/src/game/ai.ts 4570 (ctx.targets), 4719 (groupTargets) | planWarAllInCapital: najbliższe od kotwicy |
| Barbarzyńcy jako atakujący | gra/src/game/barbarians.ts 1828-1860 (allInTargets z warAllIn) | stolica (bez zmian, zgodnie z zasadą) |
| Obrona domu (krok 4b2, FALA 551) | gra/src/game/ai.ts 3696, 3965 | obrona miasta własnego; nie wybiera celu ataku |
| Ruch w tickach (move, pochód) | gra/src/game/ai.ts ~4975-5110 (pochód kampanii) | nie wybiera celu, wykonuje plan planera |

Kolejność potwierdzona grep-em po src/ (planWarAllInCapital: ai.ts 4570, 4719; barbarians.ts 1860). Brak innych wywołań planera.

## Testy (wykonane na commicie r2, worktree bez node_modules, esbuild z symlinku poza repo)

- ai-target-nearest-city-test.cjs: 18/18 PASS, EXIT 0 (C1-C4, W2, W3 nowe).
- ai-war-nearest-city-peace-2t-test.cjs: MUTACJE 16/16, WYNIK PASS, EXIT 0.
- ai-war-defend-home-test.cjs: 30 passed, 0 failed.
- ai-war-gate-test.cjs: 24 passed, 0 failed.
- ai-defend-recapture-attack-priority-test.cjs: 55 passed, 0 failed.
- war-allin-keep-barb-defense-test.cjs: 8 passed, 0 failed.
- war-allin-general-path-barb-defense-test.cjs: 24 passed, 0 failed.
- war-allin-capital-regress.cjs: NIEZIELONE 0, EXIT 0.
- ai-general-war-campaign-test.cjs: 51 passed, 0 failed, EXIT 0.
- tsc: `tsc --noEmit -p tsconfig.json` daje EXIT 2 w tym środowisku (brak node_modules projektu, globalny TypeScript; błąd TS5101 baseUrl i ~172 błędy typów w plikach niezmienionych, m.in. 'three', audio/filePlayer.ts). Jedyny błąd w zmienionych liniach (main.ts 7543: enemyOwnerIds z number|null) NAPRAWIONY w r2; po poprawce liczba błędów 173 -> 172, żaden nie dotyczy zmienionych linii. NIE_ZMIERZONO: EXIT 0 z pełnym toolchainem projektu.
- logic-test, ai-test, war-allin-capital-test (96/2): NIE uruchamiane w tej rundzie (NIE_ZMIERZONO).

## Notatki

- Wybór właściciela kampanii pozostaje oparty o stolice (świadoma decyzja: zarzut dotyczy celu marszu, nie wyboru wojny). Gdy właściciel zostanie wybrany, armia idzie do najbliższego miasta tego właściciela.
- Planer nie sprawdza osobno trasy dla miast spoza stolicy poza nav planera (distanceField); miasto bez trasy jest pomijane przez planer.
- Zapisy sprzed zmiany: pole targets nie jest zapisywane w aiGeneralCampaignToSave; kampania odtwarza je każdej tury z main.ts, więc nie wymaga migracji.

ZMIANY/COMMIT: patrz SHA w sekcji DEPLOY/PUSH poniżej (commit r2 na gałęzi roboczej, nie pushowany).
BLOKADY: brak techniczny; NIE_ZMIERZONO (pomiar live, pełny tsc, war-allin-capital-test 96/2, logic-test, ai-test).
RUNDY: 2/5. Ostatni werdykt Obrony: FAIL (zarzuty Z1-Z3 przyjęte, Z5 nieodtworzone w tej rundzie).
NASTĘPNY KROK: Evaluator (Sonnet) i Final Control (Sonnet) na commicie r2; FC zatwierdza rozszerzoną allowlistę (main.ts prepareAiGeneralWarCampaign, ai.ts appendAiGeneralCampaignOrders + typ opts).
DEPLOY/PUSH: NIE WYKONANO
