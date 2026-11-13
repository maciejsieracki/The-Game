STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-SIEGE-MACHINES-ONLY-TECH-AVAILABLE-VISIBLE-Q1
GOAL: widoczne wylacznie machiny dostepne wg technologii; obwarowane miasto bez machin = szturm niemozliwy (zostaje oblezenie)
ZMIANY/COMMIT: start 100b041d5; poprawki: gra/src/game/city-fortification.ts (+stormBlockedForRoster), gra/src/main.ts (wrapper deleguje; isStormBlocked w 2 wywolaniach showCityAttackChoice), gra/src/ui/cityAttackChoice.ts (isStormBlocked: przycisk disabled + komunikat + klawisz 2), gra/tools/siege-storm-needs-machines-test.cjs, gra/tools/city-siege-wall-rules-test.cjs (2 nieaktualne regexy). SHA koncowy: patrz commit tego raportu.

ODPOWIEDZI NA ZARZUTY
1. PRZYJMUJE (czesciowo domkniete). Logika wyciagnieta do czystej stormBlockedForRoster(fortified, roster, isSiege); test wykonuje ja na prawdziwych definicjach jednostek (Wojownik / +Taran / pusty / brak obwarowania). Dodany pin, ze wrapper w main.ts wywoluje ja z cityIsFortified + isSiegeUnit po appendReadyMachinesToRoster. Mutacje: M2 (wrapper `return false`) 32/1 (wczesniej 24/0); M3 (funkcja `return false`) 31/2; M5 (menu bez blokady) 32/1; M1/M4 jak dotad. Residuum: pin wrappera jest regexem na zrodle (brak testu behawioralnego calego main.ts w Chromium -- NIE_ZMIERZONO).
2. PRZYJMUJE w czesci. Dlug city-siege-wall-rules-test (4 FAIL) NAPRAWIONY: 2 nieaktualne regexy (murKamienny w battleScene; cityHasDefenders(city, anchor.ownerId) w main) -> 50 OK / 0 FAIL, mutacje pinow lamia. To przywraca czerwony->zielony pin R1 dla szturmu gracza (puste obwarowane miasto bez machin nie pada). Pomiar: ze zrodla -- szturm AUTO bez machin: autoStormBreach(false)=false => canCaptureCity(true,false)=false (test 'spojnosc z R1'); puste miasto: fortifiedCityCaptureBlocked blokuje wejscie; AI: executeSilentSiegeStorm blokuje (pin). Wniosek: przed zmiana miasto obwarowane NIE padalo bez machin (R1 juz dzialal); nowe jest zablokowanie samego Szturmu w UI/launch. NIE_ZMIERZONO: pelny przebieg gry w Chromium (reczna bitwa i AUTO na realnym swiecie) -- ODRZUCAM jako zakres tej rundy, zostaje do Final Control / osobnego tematu live.
3. PRZYJMUJE. showCityAttackChoice dostaje isStormBlocked (obie sciezki w main.ts: offerCityAttackChoice i akcja attack_choice); Szturm disabled + opis 'Potrzebne machiny oblężnicze — pozostaje oblężenie', klawisz 2 ignorowany. Test LIVE w Chromium (prawdziwy cityAttackChoice.ts): zablokowany => disabled, klik i klawisz nie odpalaja onStorm; z machina => odpala; bez isStormBlocked => jak dotad.
4. PRZYJMUJE. Test czeka 500 ms na koniec animacji przed zrzutem; zrzuty (--shots) czytelne: 01 start (brak sekcji machin, Szturm wyszarzony z komunikatem), 02 po Obrobce drewna (sam Taran), 03 po Brazownictwie, 04 menu ataku zablokowane. Zrzuty w /tmp (nieskomitowane, zgodnie z zasada repo).
5. ODRZUCAM jako defekt, przyjmuje jako notatke: main.ts i city-fortification.ts sa konieczne -- blokada musi sie wywolac w main.ts (kontekst miasta/rosteru) a regule trzyma jedna funkcja obok autoStormBreach (jedno zrodlo prawdy). Dodana tylko czysta funkcja i stala komunikatu, bez zmian balansu/danych. Do oceny FC.

TESTY (surowe wyjscia)
tsc --noEmit: 0 bledow. siege-storm-needs-machines-test --vite: 33 PASS / 0 FAIL. city-siege-wall-rules-test: 50 OK / 0 FAIL. logic-test 213/213; tech-tree-test 20 pass/0 fail; research-test ALL GREEN; unit-replace-test 21/21; combat-test All sanity checks passed. map-siege-test 6/0; siege-ai-test 17/0; siege-defenders-test 12/0; siege-engines-built-during-siege-test 33/0; siege-nearby-lock-join-test 23/0; siege-tower-breach-everywhere-test 47/0.
BLOKADY: brak (poza NIE_ZMIERZONO w pkt 1-2)
RUNDY: obrona po rundzie 1 (Evaluator PASS-WITH-NOTES)
NASTEPNY KROK: Final Control
DEPLOY/PUSH: NIE WYKONANO
