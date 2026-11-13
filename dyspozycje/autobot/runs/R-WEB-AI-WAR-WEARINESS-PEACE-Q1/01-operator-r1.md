STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-AI-WAR-WEARINESS-PEACE-Q1
GOAL: (1) postepujace zmeczenie wojna - po ~200 turach obie strony chca pokoju; (2) wyraznie przegrywajacy eskaluje oferte pokoju (zloto/surowce, potem miasto/miasta) az do akceptacji.

## POMIAR PRZED (kod, plik:linia na origin/main 488d94364)
- Zmeczenie JUZ istnieje, ale krotkie: `diplomacy-war-peace-profile.ts` `warWearinessFraction` (T <= 20 tur, params `diplomacy-war-peace-params.json` zmeczenie.maksTur=20); uzywane TYLKO w `diplomacy.ts:1300` (wazenie pokoju AI->gracz) i sygnale (e) `aiPeaceSignals`. Brak zmeczenia rosnacego do ~200 tur, brak strat/stagnacji w modelu.
- AI->gracz: po 20 turach bramka `evaluatePeaceAiGate` zdjeta; AI przegrywajace proponuje pokoj (ai.ts ~6370) i oddaje miasto tylko gdy rw <= 0.15 i >= 3 miasta (`aiMiastoPrzekazRwProg`, `AI_MIASTO_PRZEKAZ_MIN_MIAST`, ai.ts ~5795-5830) - bez eskalacji w czasie.
- AI<->AI (main.ts ~33092 `registerAiAiPeaceRequest`): prosba rejestrowana TYLKO gdy prosacy ma udzial sily <= 0.45 (`isClearlyLosing`) i para NIE jest wojna wymuszona epoki (`isForcedPeaceEligiblePair`); pokoj wymuszony po 2 turach (`diplomacy-ai-forced-peace.ts`), cesja max 1 miasta. LUKA: wojna o rownowadze sil (udzial 0.45-0.55) oraz wojna wymuszona epoki AI<->AI nie maja zadnej drogi do pokoju poza auto-pokojem po 2 zdobytych miastach (`maybeResolveRegularWarOnCityCapture`); zwyciezca nigdy sam nie proponuje. To jest zrodlo "walki do upadlego" bez pokoju.
- Pelne przebiegi AI (4-6 AI, 3 ziarna, 250-300 tur): NIE_ZMIERZONO (brak Chromium w srodowisku; gra uruchamia sie wylacznie w przegladarce, `main.ts` nie ma trybu headless; wczesniejsze pomiary perf: 60-76 s/tura). Rozklad dlugosci wojen, odsetek wojen > 100/200 tur, odsetek pokoj/eliminacja, liczba zmian wlasciciela miast: NIE_ZMIERZONO (PRZED i PO).

## ZMIANY
- NOWY `gra/src/game/war-weariness.ts` (PURE): `warWearinessLevel` (min(1, tury/200 + 0.03*utraty miast obu stron + stagnacja)), szczyt monotoniczny w stanie pary (`stepPairState`), `loserDespair` (zmeczenie + slabosc sily + utrata miast), `despairStage` 0..3, `offerMultiplier` (stopien + przyrost za kazda odrzucona oferte), `planEscalatedPeacePayment` (zloto -> surowce -> miasta, limit miast, zakazane/stolica/ostatnie nigdy), `runWarWearinessTick` (DI).
- NOWY plik parametrow `gra/data/war-weariness-params.json` (wszystkie progi: pelneTur=200, progChetnosci=0.5, progWzajemnyPokoj=0.8, udzialWyraznie=0.45, progiStopni, mnozniki, maxMiastNaPokoj=2, minMiastPoOddaniu=1, cooldownOfertTur=3, czlowiek.rwProgBonusMax=0.25, czlowiek.minMiastAi=2).
- `gra/src/main.ts`: `tickAiAiWarWeariness` (po `tickAiAiPeaceRequests`, ta sama wycena: `peaceOfferAiRequestPn`/`peaceOfferAiOwnBilans`/`aiOfferPwSurplusTolerance`, `cityCessionPlanFor`, `transferBasketItems`, `finalizePeaceTreatyBetween`), mapa `warWearinessByPairKey` w save/load (meta), reset w `cleanupRegularWarOnPeace`, nowej grze i wczytaniu. Brak wpisu w starym zapisie = pusty stan (zmeczenie liczone od nowa z dlugosci wojny).
- `gra/src/game/ai.ts` (TYLKO sciezka AI->gracz oddania miasta, bramki obrony/ataku nietkniete): prog rw oddania miasta rosnie o rwProgBonusMax*desperacja, min. miast AI spada do 2, wymagana wartosc miasta rosnie ze stopniem (fallback do ceny bazowej). Aktywne dopiero przy zmeczeniu >= 0.5 i stopniu >= 2, wiec wojny krotkie bez zmian.
- `gra/tools/ai-war-weariness-peace-test.cjs` (NOWY test).

## ZASADY (zalozenia w dokumencie)
- Rowna wojna (udzial przegrywajacego > 0.45): gdy szczyt zmeczenia >= 0.8 (ok. 160 tur lub mniej przy stratach) -> pokoj bez zaplaty (wzajemne wyczerpanie); dotyczy tez wojen wymuszonych epoki (po pokoju dzialaja istniejace reguly: `finalizePeaceTreatyBetween`).
- Wyraznie przegrywa: stopien 1 = zloto+surowce; 2 = + 1 miasto; 3 = + max 2 miasta; wygrywajacy akceptuje gdy bilans po zaplacie >= -tolerancja (istniejaca wycena); odrzucona oferta podnosi mnoznik; cooldown 3 tury; stopien nie spada (histereza). Stolica/ostatnie miasto nigdy (ZALOZENIE: wyjatek "stolica gdy alternatywa eliminacja" NIE zaimplementowany - konserwatywnie). Gracz-czlowiek nie jest zmuszany (AI->gracz tylko propozycja).
- Tor 2T (`runAiAiPeaceTick`) nietkniety; tick zmeczenia dziala po nim i przy sukcesie pokoj kasuje obie prosby.
- Stagnacja liczona z `turnsSinceCityChange` (istniejacy rekord wojny); szczyt zapobiega spadkowi po zmianie miasta.

## TESTY
- `node tools/ai-war-weariness-peace-test.cjs`: PASS=49 FAIL=0 (monotonicznosc, 200 tur => pelne, straty/stagnacja przyspieszaja, reset nowej wojny, round-trip save, rowna wojna => pokoj, krotka wojna bez zmian, eskalacja + miasto + limit + brak stolicy, cooldown, histereza, brak oddania ostatniego miasta, determinizm, decideAIDiplomacy AI->gracz, straznik okablowania main.ts). RED: bez modulu (`AI_SRC_DIR` na baze) exit 1.
- `node ./node_modules/typescript/bin/tsc --noEmit`: czyste (0 bledow).
- Regresje PRZED vs PO (`gra/tools/*{peace,pokoj,diplomacy,forced-war,ai-war,war-rules,dyplo,diplo}*test.cjs` bez live/real-render/ui/e2e, 102 pliki): zbior padajacych identyczny PRZED i PO (8 testow padajacych na bazie niezaleznie od zmiany: civ-matrix-ai-diplomacy-wiring, diplomacy-audience-close-flush, diplomacy-lista-podglad-przed-wizyta, diplomacy-negotiation-table, diplomacy-package-ai-counter-actionable, diplomacy-proposal, dyplo-bilans-gate-n-e1-reprodukcja (+runda2, runda3), dyplo-warunek-niespelniony-czerwony-tooltip, forced-war-bronze-main-guard, forced-war-bronze-new-game-reset, granice-relacja-dyplomatyczna, hotseat-dyplo-kontakt-per-fotel, hotseat-etap8-dyplomacja-dane, pr141-hotseat-diplomacy-owner); 0 nowych regresji. `ai-war-nearest-city-peace-2t-test`, `diplomacy-city-cession-r3-test`, `diplo-war-peace-*` PASS.
- Metryki PRZED/PO z pelnych przebiegow (odsetek wojen konczacych sie pokojem po 200 turach, mediana dlugosci, liczba przekazan miast, brak eliminacji bez prob pokoju): NIE_ZMIERZONO. Wymagaja Chromium + budowy poza repo; do wykonania przez Evaluatora/orkiestratora lub osobny temat.
- Wizualna weryfikacja w przegladarce: NIE DOTYCZY (brak zmian UI).

## BLOKADY
Brak twardych. Uwaga: pelne przebiegi AI niedostepne (NIE_ZMIERZONO); log `gate-*.txt` nie tworzono (wyniki powyzej z konsoli).

## RUNDY
1/5
## NASTEPNY KROK
Evaluator R1 (zwrocic uwage: pomiar na pelnych przebiegach, wyjatek stolica-przy-eliminacji, wplyw na wojny wymuszone epoki AI<->AI). Po wdrozeniu REPIN Rust (dyplomacja/AI) - orkiestrator.
DEPLOY/PUSH: NIE WYKONANO
COMMIT: patrz SHA w odpowiedzi koncowej (commit zawiera ten raport).
