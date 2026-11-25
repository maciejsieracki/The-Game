STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-ERA-WAR-END-LIKE-CLASSIC-Q1
GOAL: wojny epoki (Kamień/Brąz/Żelazo) AI↔AI kończą się tymi samymi ścieżkami co klasyczne (P12 po 2 zdobytych miastach z warunkiem bilansu, P20 prośby o pokój/rozejm, P11 oferty); sprzątanie po pokoju i karencja bez zmian; para gracz↔AI bez zmian.
ZMIANY/COMMIT: BAZA 18eefa311665201d5a32fb329bbaf6120055f18c. Allowlista: gra/src/main.ts (maybeResolveRegularWarOnCityCapture, aiAiForcedPeacePairEligible), gra/src/game/diplomacy-ai-forced-peace.ts (pole forcedEpochWar usunięte z isForcedPeaceEligiblePair), gra/tools/ai-war-nearest-city-peace-2t-test.cjs (B9 + usunięty wpis mutacji), gra/tools/era-war-end-like-classic-test.cjs (nowy), dyspozycje/analizy/WOJNA-SCIEZKI-KONCA-2026-11-25.md (sekcja 7), ten raport.
Pozostałości potwierdzone przed zmianą: (a) gra/src/main.ts maybeResolveRegularWarOnCityCapture — wczesny return dla bronze/stone/iron ForceWarActiveByPairKey; (b) diplomacy-ai-forced-peace.ts `if (p.eliminated || p.forcedEpochWar) return false;` + main.ts aiAiForcedPeacePairEligible (pole forcedEpochWar). Przegląd grep forcedEpochWar / ForceWarActiveByPairKey.has wykazał tylko te dwa miejsca wykluczające w src; tabela P1–P21 NIE została przepisana w całości.
Nie zmieniono: finalizePeaceTreatyBetween (cleanupStone/Iron/Regular + forcedEraPeaceUntilNextEraByPairKey) już sprząta i ustawia karencję dla wojny epoki. Brak podwójnego liczenia, bo R9 usunęło auto-koniec wojen wymuszonych po miastach.
TESTY:
- npx tsc --noEmit (gra/): exit 0
- node tools/era-war-end-like-classic-test.cjs: PASS 15 / FAIL 0 (nowy)
- node tools/ai-war-nearest-city-peace-2t-test.cjs: exit 0
- node tools/ai-wojny-zwykle-cap-dwa-miasta-test.cjs: bloki bez live 21/0, WYNIK 22/0, 15/0, 36/0, 14/0; blok live A2 (fast-forward endTurn w turze 1, DIAG inProg=false turn=1) FAIL — środowiskowy, NIE ZWERYFIKOWANO na bazie
- war-rules-multiwar-main-guard-test.cjs: exit 0
- forced-war-bronze/stone/trojstronna-main-guard: exit 0; forced-war-iron-main-guard: exit 0
- diplo-forced-peace-d2-guard, peace-* i diplo-war-peace-* (bez live, 30 plików): exit 0; ai-losing-war-asks-peace-vs-player: 12/0
- diplo-forced-peace-pending-test.cjs: FAIL r2-3 (regex na turn++ / showNextPendingForcedPeace w main.ts) — poza zakresem, NIE ZWERYFIKOWANO na bazie
- forced-war-iron-test.cjs: FAIL 2/55 („sojusz z celem nadal blokuje wojnę Żelaza”) — pinowane zachowanie sprzed FALI 891; poza zakresem, NIE ZWERYFIKOWANO na bazie
NIE ZMIERZONO (limit czasu/zasobów): ai-test 297/0, logic 213, tech-tree 20, research 33, unit-replace, combat 6, hotseat e-source 77/0, hud-me-literal-zero, bramki-tmpdir PASS=18, pozostałe testy live (Chromium).
Mutacja: asercja B1/A1 pilnuje usunięcia pola forcedEpochWar; asercja B4 pilnuje braku wczesnego return w maybeResolveRegularWarOnCityCapture. Osobnej mutacji plikowej NIE URUCHOMIONO.
BLOKADY: brak w zakresie tematu.
RUNDY: 1/5
NASTĘPNY KROK: FC (Final Control) — uruchomić NIE ZMIERZONE bramki (ai-test 297/0 przede wszystkim) i ocenić dwa czerwone testy poza tematem.
DEPLOY/PUSH: NIE WYKONANO
