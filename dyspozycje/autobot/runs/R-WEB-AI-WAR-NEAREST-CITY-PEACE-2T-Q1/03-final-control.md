STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-AI-WAR-NEAREST-CITY-PEACE-2T-Q1
GOAL: (A) cel ataku AI wobec AI = najblizsze miasto wroga. (B) Pokoj AI<->AI najpozniej w 2. turze od prosby, z cena. (C) AI zajmuja miasta AI.

ZMIANY/COMMIT: SHA do integracji = 905f25ff9 (kod e4ea552a5 na bazie Operatora a5bb11156/3f6a35d66; baza ae292911f). Final Control nie zmienia kodu; poza tym raportem brak zmian.
Zakres: gra/src/main.ts, game/ai-war-target-select.ts (nowy), game/diplomacy-ai-forced-peace.ts (nowy), game/diplomacy-siege-war-gate.ts, game/warAllInCapital.ts, gra/data/ai-params.json (klucz tury_do_pokoju_po_prosbie=2), nowy test, runs/<ID>/**. Zero zmian w gra-robocza, WERSJE.md, rust-port.

WERDYKT ZARZUTOW (FC R1):
1 rozejm=pokoj: ODDAL (naprawione w e4ea552a5: pole kind, baza 200 PW, truceTurns; testy B10/B11 + mutacja zabita).
2 cena z wlasnego wzoru: ODDAL (naprawione: peaceOfferAiRequestPn, peaceOfferAiOwnBilans, cityCessionPlanFor, diploMiastaWycenaDla; bilans liczony, nie tautologia). Znak bilansu przez evaluate_proposal w pelnej grze: NIE_ZMIERZONO.
3 brak pomiarow pelnych gier: ODDAL do orkiestratora jako pomiar po integracji. Powod: ok. 40-60 min/ziarno, limit 590 s, zakaz pracy w tle; ograniczenie srodowiska, nie wada kodu. Zastepczo: skan 300 miast x 600 jednostek < 400 ms (C10), war-allin-capital-perf EXIT=0 (ON/OFF 1.51, powtorzone przeze mnie). Liczba zajec/wojne, opoznienie pokoju, histogram przyczyn: NIE_ZMIERZONO. Harness: sim-harness-war-sim.cjs + sim-harness-prep-war.cjs w runie.
4 test nie uruchamia logiki main.ts: ODDAL (naprawione: logika w runAiAiPeaceTick z wstrzykiwanymi zaleznosciami, test uruchamia go naprawde; skan = autoSiegeCandidateForScan, ta sama funkcja co w main.ts; plus straznik tekstowy okablowania). E2E w przegladarce: NIE_ZMIERZONO.
5 luka T+2 przy bitwie: ODDAL (naprawione: tick poza galezia !aiTurnAwaitingBattle, bez cesji miast przy bitwie; B12 + straznik pozycji, zweryfikowane w main.ts).
6 przegrany niezweryfikowany: ODDAL (naprawione: rejestracja przy udziale sily <= 0.45, wygasanie > 0.5; B13, mutacje zabite). Progi to stale modulu (allowlista nie dopuszcza nowych kluczy JSON) - akceptowalne.
7 regresje niepelne: ODDAL. Powtorzone na PO i bazie: sensible-deals 7/0, relacje-ai-ai-audiencja 19/0, iron-player-target 10/2 = baza 10/2, direct-negotiation FAIL identycznie na bazie (przestarzaly hak), trojstronna-domino / war-era-counter-live / war-rules-multiwar-live TIMEOUT na PO i bazie (artefakt srodowiska). ai-buduje-budynki-test i diplo-war-peace-live-test: NIE_ZMIERZONO (timeout/crash takze na bazie), brak dowodu regresji.
8 zakres poza literalna allowlista: ODDAL. Zmiany konieczne dla A i C; remis po defenders dziala tylko gdy oba cele maja pole, ustawiane wylacznie przez buildWarCityTargets dla par AI->AI; inne planery zachowuja porzadek (q,r,id); ruch/zbiorka nietkniete. Akceptacja zakresu = decyzja orkiestratora (nie produktowa).
Brak NAPRAW, brak DO DECYZJI CZLOWIEKA.

TESTY (odtworzone przeze mnie na 905f25ff9): npm ci --ignore-scripts OK; tsc --noEmit EXIT=0; ai-war-nearest-city-peace-2t-test.cjs 40/40 PASS, mutacje 16/16 zabite, EXIT=0; war-allin-capital-perf EXIT=0 (1.51); git diff --check ae292911f..905f25ff9 puste; git diff --name-only: tylko gra/** i runs/<ID>/**. Przejrzane: runAiAiPeaceTick, diff main.ts (rejestracja, tick, cele, skan, zapis/wczytanie, czyszczenie).

BLOKADY: NIE_ZMIERZONO: pelne symulacje PRZED/PO (>=6 ziaren, 150+ tur), znak bilansu przez evaluate_proposal w grze, E2E przegladarkowe ticka i skanu, ai-buduje-budynki-test, diplo-war-peace-live-test.

KOLEJNOSC INTEGRACJI: web (gra/**) i rust-port/parity-v2 (e1c040160) sa rozlaczne (brak wspolnych plikow); kolejnosc dowolna. Wzgledem origin/main (c1581619f, poszedl do przodu od bazy ae292911f, m.in. main.ts, ai.ts) merge-tree 905f25ff9 vs main jest CZYSTY, bez konfliktow. Po merge orkiestrator powinien powtorzyc tsc i ten test oraz (zalecane) uruchomic harnessy symulacji poza limitem 590 s. Sekwencyjnie wzgledem MARCH-AVOID / ARMY-CONCENTRATION / MOVE-FULL-RANGE (te same pliki ai.ts/main.ts).

RUNDY: 1/5 (Final Control R1)
NASTEPNY KROK: integracja orkiestratora (merge 905f25ff9, tsc + test po merge, opcjonalnie symulacje), potem READY_FOR_DEPLOY.
DEPLOY/PUSH: NIE WYKONANO
