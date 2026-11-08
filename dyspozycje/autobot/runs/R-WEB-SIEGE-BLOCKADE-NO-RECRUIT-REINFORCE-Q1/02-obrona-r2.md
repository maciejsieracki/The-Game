STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-SIEGE-BLOCKADE-NO-RECRUIT-REINFORCE-Q1
GOAL: Obległe miasto nie rekrutuje, nie dostaje posiłków, nie przyjmuje obcych jednostek (gracz, AI, barbarzyńcy).

## Odpowiedzi na zarzuty (stan z 963cfd2dc)
1. PRZYJMUJĘ (poprawka). Odwrót/rozproszenie po bitwie mógł skończyć się na heksie obleganego miasta. Nowa `retreatHexPassable` w main.ts (mapHexPassableForUnit + wykluczenie `besiegedCityAtHex`) użyta w obu punktach (applyDefenderPreBattleRetreat i post-battle). Test E1 RED (bez wykluczenia obrońca ląduje w mieście), E2 GREEN, E3-E5 strukturalne + mutacja. spawnTransferredUnit: ZMIERZONE, zero wywołań w src (dar jednostki to `case 'jednostka': break`), martwa ścieżka (E14). spawnDifficultyBonusUnit: wołany tylko z grantów startowych przy zakładaniu stolicy/miasta-państwa (E15), miasto nie może być wtedy oblegane.
2. PRZYJMUJĘ. Dodane E6-E13: AI (własna armia nie wchodzi do własnego obleganego miasta), barbarzyńcy (własny obóz zablokowany, jako wróg wchodzi), hot-seat (trzeci fotel/sojusznik zablokowany, brak zależności od aktywnego gracza), zapis/odczyt (round-trip JSON City[] + save.ts wczytuje miasta wholesale), ai.ts/barbarians.ts/warAllInCapital.ts ruszają armie przez computePath/computeReachable. NIE_ZMIERZONO: żywa pętla tury AI w Chromium (tylko silnik + strukturalnie).
3. ODRZUCAM jako zmianę kodu, przyjmuję jako ujawnioną lukę: DOM przycisku i przejście tury z zablokowaną kolejką pozostają NIE_ZMIERZONO behawioralnie w Chromium (C3, C4, C6 strukturalne; D2/D3 zakup żywy w Chromium działa). D7 sprawdza tylko hak wroga; relację wojny pokrywa A5/E8/E10 w silniku.
4. Odstępstwo setup.ts: do świadomej akceptacji orkiestratora (jedyny wspólny punkt ruchu, hak null domyślnie). Dodatkowo main.ts: retreatHexPassable (w allowliście).
5. ODRZUCAM: hak `__siegeBlockTestDebug` jest za `?civTest=1`, nie wpływa na grę. pr141-f04-unit-speed: PASS EXIT=0 (15 approved source zeros).

## TESTY
- Nowy test: 57 OK / 0 FAIL (Chromium, gate-r2-new-test.txt). tsc EXIT=0 (gate-r2-tsc.txt).
- Regresje (gate-r2-regresje.txt): post-battle-map 32/0, pre-battle-defender-retreat OK, retreat-garnizon-fortyfikacja 27/0, recruitment-batch 17/0, oblezenie 27/0, siege-ai 17/0, map-siege 6/0, city-siege-wall-rules 50/0, roster-space 32/0, siege-defenders 12/0, unit-speed PASS.
- pre-battle-retreat-exhausted 27/6: identycznie na bazie 95a4b25ab (dług sprzed tematu).

BLOKADY: brak
RUNDY: 2/5
NASTĘPNY KROK: Final Control
DEPLOY/PUSH: NIE WYKONANO
