STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-WAR-RULES-MULTIWAR-Q1
GOAL: Runda 5 (ostatnia): zamknąć zadania (1)-(5) z dispatchu -- ZAŁOŻENIA, test okablowania main.ts z mutacjami, pomiar live w Chromium, diagnoza "dlaczego nikt nie wypowiada wojny graczowi", bramki regresji.
BAZA: b4828f4c (r4), checkout --detach.

ZMIANY/COMMIT: allowlista
- NOWY gra/tools/war-rules-multiwar-main-guard-test.cjs (18 PASS/0 FAIL; mutacje: WAR_MAIN_TS=<kopia main.ts>).
- NOWY gra/tools/war-rules-multiwar-live-test.cjs (pomiar live, 6 PASS/0 FAIL).
- NOWE: dyspozycje/autobot/runs/R-WEB-WAR-RULES-MULTIWAR-Q1/{01-operator-r5.md, live-46-r5-results.json, mutacje-r5.txt}.
- Zero zmian w src/ (kod r4 bez zmian; mutacje wykonane na kopiach / przywrócone bit-w-bit, RESTORE_OK=true).
- Commit: patrz sekcja końcowa (jawne git add, bez push).

ZAŁOŻENIA (przyjęte, bez pytań):
- Z1: R3 liczony globalnie po etykiecie epoki w powodzie (R-EPOKA-*-WYMUSZONA-WOJNA).
- Z2: zablokowana wojna epoki zostaje pending (nie konsumowana), próba ponawiana.
- Z3: R3 nie liczy dołączeń sojuszniczych.
- Z4: gracz jako napastnik nieograniczony (R2 dotyczy AI-napastnika i AI-celu).

TESTY:
(1) Bramki modułu: war-rules-multiwar-test 50/0; forced-war-stone 0; bronze 0; iron 0; waves 0; trojstronna 0; stone-main-guard 19/0; iron-main-guard 37/0; trojstronna-main-guard 14/0; iron-era-enter-turn-save-load 20/0; reguly-multi-turn 0; diplomacy-war-gates 19/0; alliance-war-obligation 14/0; ai-war-gate 24/0.
  CZERWONE TAKŻE PRZED ZMIANAMI (potwierdzone w r3 na 00fe8dc4, poza zakresem): forced-war-bronze-main-guard 27/1 (finalizePeaceTreatyBetween); forced-war-bronze-new-game-reset exit 1 (ReferenceError: forcedWarWavesByPairKey is not defined).
(2) Okablowanie main.ts (war-rules-multiwar-main-guard-test.cjs, 18/0 na bazie). Mutacje (kopia main.ts z usuniętą jedną bramką) -- wszystkie CZERWONE:
  M1 werdykt R1/R2 w wypowiedz_wojne -> RED; M2 blokada R3 -> RED; M3 klaster państw-miast bez bramki -> RED; M4 sojusznik dołączający bez bramki -> RED; M5 interCivWarBlockedForAi ignoruje flagę -> RED; M6 garnizony w puli W1 -> RED; M7 reset opóźnienia R1 -> RED; M8 licznik R3 bezwarunkowo -> RED (test wzmocniony w r5 po pierwszym przebiegu, gdzie M8 przechodziło); M9 cywile/zwiadowcy w puli -> RED.
  Mutacje modułu (war-rules-multiwar-test; X7 w warAllInCapital): X1 R1 -> RED; X2 R2 napastnik -> RED; X3 R2 cel -> RED; X4 R3 -> RED; X5 promień W1 -> RED; X6 podział W2 -> RED; X7 wybór celu W1 w warAllInCapital -> RED (przez asercję tekstową war-rules-multiwar-test, NIE przez war-allin-capital-test).
  LUKA: war-allin-capital-test (95/0) NIE wykrywa żadnej z mutacji X1-X7 -- jego pokrycie W1/W2/R1-R3 jest zerowe. Do zgłoszenia jako dług testowy.
(3) POMIAR LIVE (war-rules-multiwar-live-test.cjs; realny vite build, Chromium headless, realne endTurn, ?playtest=mapa):
  Sandbox = 2 cywilizacje (gracz 0 + AI 1). NIE spełnia wymogu 4-6 AI, >=2 seedów i >=60 tur.
  | wariant | tury | wojny w stanie startowym | nowe wojny przed T40 (maks.) | wojny na koniec (46 t.) | maks. wojen/właściciel | śr. czas tury | console.error (silnik) | pageerror |
  | ON  | 46/46 | 1 (0,1) | 0 | 1 | 1 | 3003 ms | 8 | 0 |
  | OFF | 46/46 | 1 (0,1) | 0 | 1 | 1 | 3068 ms | 23 | 0 |
  Czas tury ON/OFF = 0,98 (limit x1,15: OK). Przy wcześniejszym przebiegu było 3019/2899 ms (ratio 1,04).
  Wojna startowa (0,1) jest w stanie początkowym sandboksa w obu wariantach (nie powstaje przez reguły).
  Liczby 8 vs 23: komunikat silnika "[Wojna wymuszona] DECISION_REQUIRED: brak niezablokowanej ... dla ownerów [0]" -- ON ma mniej prób pary przed T40 (R1 blokuje pulę).
  NIE_ZMIERZONO: pomiar 4-6 AI, >=2 seedy, >=60 tur, liczba miast zdobytych, liczba minięć armii bez walki (wymaga pełnej gry z wieloma AI; w repo nie ma haka headless do startu nowej gry z N AI i kontrolą seeda; ?playtest=mapa to 2 cywilizacje; brak zmian w main.ts pod to wykonano).
(4) DIAGNOZA "dlaczego nikt nie wypowiada wojny graczowi" (z kodu; NIE zmierzone liczbowo w wielu AI):
  a. Gracz wchodzi do puli wymuszeń tylko jako LEFTOVER: main.ts:34231-34236 dodaje ownerId 0 wyłącznie gdy turn>=25 i totalActiveForcedWarsByOwner(0)===0.
  b. Gracz nigdy nie jest STRONĄ AKCJI: forced-war-common.ts ~155, 210-211, 383-384 (addAssignment: era==null -> return; leftover=gracz -> wybrana strona pary dostaje cel=gracz).
  c. Trigger AI wymuszeń NIE uwzględnia gracza: forced-war-stone.ts:42-50 (isEligibleForStoneForcedWar: isMainAiCiv && epoka && tura && !wojna); to samo dla brązu/żelaza -- gracz nie jest podmiotem wyzwalania.
  d. Wybór celu: forced-war-common.ts:44-66 pickForcedWarTargetId -- najbliższy kandydat wg odległości od miasta referencyjnego, remis = mniejszy ownerId; BEZ wagi za gracza, bez kryterium kontaktu/siły. Gracz z odległą stolicą przegrywa z sąsiadami.
  e. Kontakt: main.ts ~35252 filterDiplomacyCommandsForEstablishedContact(..., diplomaticContactEstablishedSet().has(ownerId)) -- komendy AI skierowane do gracza są odfiltrowane, dopóki nie ma kontaktu; dodatkowo filterDiplomacyCommandsForLayer (mgła gracza) ~35238.
  f. Sandbox (zmierzone): 46 tur, OFF -- 23 komunikaty "brak niezablokowanej pary ... ownerów [0]" = wyszukiwanie pary dla gracza kończy się brakiem partnera, ON -- 8.
  Wniosek: przyczyną jest kombinacja (b)+(c)+(d): gracz może być tylko celem, a cel wybiera się najbliższym dystansem; przy wielu AI wojny AI<->AI zjadają kandydatów (warless) przed graczem. Proponowana poprawka (NIE wprowadzona, wymaga decyzji właściciela): osobna waga wyboru celu dla gracza -- niezmierzone.
(5) Bramki regresji: war-rules-multiwar 50/0; war-allin-capital 95/0; ai-move-range 46/0; tsc --noEmit exit 0; forced-war-* jak w (1).
  NIE_ZMIERZONO w tej rundzie: barbarzyncy-krazenie 249/0, barb-city-behavior 178/0, logic-test 213/213, ai-test 276/18, endturn-battle-deadlock 38/0 i exec 46/0, bezpośredni build Vite do katalogu roboczego (nie uruchamiane -- poza czasem tej rundy).

BLOKADY: brak blokad technicznych; pomiar 4-6 AI niewykonalny bez haka do startu wieloagentowej gry (poza zakresem allowlisty tej rundy).
ZAŁOŻENIA_LUKI: pomiar sandboksa traktowany jako pomiar czasu tury i R1 dla pary gracz-AI; wojny AI<->AI nieobserwowalne.

RUNDY: 5/5 (OSTATNIA). Oddano z NIE_ZMIERZONO wymienionym wyżej.
NASTĘPNY KROK: osobny temat na headless start gry z N AI + seed (hak testowy) i pełny pomiar 60 tur x 5 seedów; osobny temat na testy X1-X7 w war-allin-capital-test; decyzja właściciela co do wagi wyboru celu dla gracza (diagnoza 4).
DEPLOY/PUSH: NIE WYKONANO
