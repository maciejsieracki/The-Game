STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-ARMY-TO-NEAREST-LEADER-Q1
GOAL: Jednostki/armie zbierane do wodza idą do NAJBLIŻSZEGO dostępnego wodza (odległość = długość realnej trasy), a nie do "pierwszego".
ROLA/RUNDA: Operator, runda 1/5. Baza: origin/main f54fb5c18 (R-WEB-AI-ARMY-CONCENTRATION-REPLACEMENT-Q1 już wdrożony; jego reguł nie ruszano).

## Ustalenia (gdzie wybierany jest "pierwszy" wódz)
"Wódz" = jednostka `isGeneral`. Cztery miejsca (stan origin/main):
1. `main.ts` `planSpawnedUnitFollowGeneral`: `units.find(x => x.ownerId===u.ownerId && x.isGeneral===true)` = pierwszy na liście, bez odległości (nowe jednostki gracza z "Idź do wodza").
2. `main.ts` `prepareAiGeneralWarCampaign` (~7107): wódz kampanii AI = `sort(id)[0]` (pierwszy alfabetycznie).
3. `ai.ts` `appendAiGeneralCampaignOrders` (~4575): cała zbiórka AI idzie do JEDNEGO wodza kampanii niezależnie od odległości.
4. `generals.ts` `nearestLivingGeneral` (używane przez przycisk "Idź do wodza" i `planEnabledGeneralFollowMarches`): linia prosta, nie trasa; wódz bez ścieżki nie jest pomijany. (plik poza allowlistą — obejście w main.ts, patrz niżej)

## Zmiany (commit e7d290059 + poprawka testu)
- `army-concentration.ts`: nowe `pickNearestAvailableLeader(from, leaders, pathLength)` (czysta funkcja): trasa null = wódz pomijany; wódz `onExpedition` tylko gdy brak dostępnego zbierającego; remis -> większa armia -> id.
- `ai.ts`: `firstStep` -> wydzielone `marchPathFor` (to samo wyrażenie, zero zmiany zachowania) + `leaderPathLengthFor`; w `appendAiGeneralCampaignOrders` każda jednostka wybiera najbliższego dostępnego wodza (w recruiting bez `blockedGeneralIds`); brak wodza/trasy -> dotychczasowy punkt kampanii.
- `main.ts`: `pickNearestLeaderForUnit` (trasa `marchPathPlan`, wyprawa = `plannedMarches.has(general)`), użyte w `planSpawnedUnitFollowGeneral`, przycisku "Idź do wodza" (roster zawężony do wybranego, bez edycji generalQuickFollow.ts) i `syncGeneralMarchTargets` (ponowny wybór po zniknięciu wodza: istniejące `syncTrackedGeneralFollowMarches` kasuje marsz, następny sync wybiera na nowo); wódz kampanii AI = najbliższy stolicy po trasie (brak trasy -> stare zachowanie).
- `tools/army-to-nearest-leader-test.cjs` (NOWY), `tools/ai-march-avoid-foreign-territory-test.cjs`: tylko wzorzec mutacji MUT_NOGUARD (kod przeniesiony do `marchPathFor`; uzasadnienie: refaktor bez zmiany zachowania).

## Testy
- RED na bazie (ATL_SRC=origin/main): `gate-nearest-leader-test-RED-baza.txt` EXIT=1 (2 PASS / 7 FAIL: brak funkcji, B1, B4, B5, D, E1, E2).
- GREEN: `gate-nearest-leader-test.txt` EXIT=0, 21 PASS: picker A1-A9, scenariusze decideAITurn B1 (dwóch wodzów), B2 (wódz za zablokowanym terenem pomijany), B3 (jeden wódz bez zmian), B4 (zniknięcie wodza kampanii), B5 (remis), 4 mutacje łamią asercje, statyka main.ts.
- Symulacja AI (3 ziarna x 120 tur, prawdziwe decideAITurn, atrapa ruchu/rekrutacji, 2 wodzów stojących, wódz kampanii daleki): jednostki stojące na końcu u nie-najbliższego wodza PRZED 54/109 (15/36, 18/36, 21/37), PO 0/114; ruchów jednostek 1041 -> 195 (koniec marszy przez całą mapę). Metryka "kierunek marszu" jest heurystyką (5.6% -> 0%); NIE_ZMIERZONO w pełnej grze w przeglądarce.
- `gate-tsc.txt` EXIT=0. `gate-regresja-przed-po.txt` EXIT=0: 26 plików nie-zerowych identycznie PRZED i PO (istniejące awarie środowiskowe), nowych regresji 0; `ai-march-avoid-foreign-territory-test` EXIT=0 po poprawce wzorca.

## Założenia / uwagi
- Odległość = liczba kroków trasy (nie koszt terenu). Wódz "na wyprawie": gracz = ma plan marszu; AI = brak (AI zbiera tylko w gathering).
- AI: przy kilku wodzach jednostki mogą zbierać się u dwóch punktów w fazie gathering; atak (5 tur) rusza wszystkimi jak dotąd.
- Poza allowlistą nie zmieniano nic (generals.ts, generalQuickFollow.ts nietknięte). Zmiany w main.ts nietestowane w przeglądarce (NIE_ZMIERZONO; tylko statyka + tsc).

BLOKADY: brak
NASTĘPNY KROK: Evaluator
DEPLOY/PUSH: NIE WYKONANO
