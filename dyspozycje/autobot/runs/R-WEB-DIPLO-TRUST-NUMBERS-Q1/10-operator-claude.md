# R-WEB-DIPLO-TRUST-NUMBERS-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-TRUST-NUMBERS-Q1
GOAL: cztery liczbowe zmiany zaufania: (1) rozejm ustawia zaufanie 10, pokój 20 (rozejm→pokój = 20); (2) kara za sąsiedztwo −3/−4/−5 (Kamień/Brąz/Żelazo); (3) religia nie zmienia zaufania; (4) kara za sąsiedztwo = 0 w karencji po pokoju lub rozejmie.
BAZA: origin/main d09df3e0b (checkout --detach, worktree wf_113eb7fe-7b2-1).

## ZMIANY / COMMIT

Allowlista (zgodna z DODATKIEM): gra/src/game/diplomacy.ts, gra/src/game/diplomacy-factors.ts, gra/src/main.ts (wyłącznie miejsca z DODATKU), gra/data/diplomacy.json, istniejące testy gra/tools/*.cjs z asercjami liczb, NOWY gra/tools/diplo-trust-numbers-test.cjs, dyspozycje/autobot/runs/R-WEB-DIPLO-TRUST-NUMBERS-Q1/**.

- diplomacy.json + DIPLOMACY_PARAMS: ekspansjaGranica −3 / Braz −4 / Zelazo −5; wspolnaReligia_zaufanie_perTura i odmiennaReligia_zaufanie_perTura = 0; NOWE rozejm_zaufanie_ustawienie = 10, pokoj_zaufanie_ustawienie = 20 (w JSON, nie w kodzie).
- diplomacy.ts computeTickZaufanieDelta: usunięte dodawanie religii (flagi ctx ignorowane).
- diplomacy-factors.ts: usunięte wiersze „Wspólna religia” / „Odmienna religia”; wiersz „Kara za wspólną granicę” nie pokazuje się, gdy wartość = 0 (karencja).
- main.ts finalizePeaceTreatyBetween (linia ~12061): zaufanie pary USTAWIANE w chwili zawarcia — rozejm: `trustSetpoint = rozejm_zaufanie_ustawienie` (10), pokój: `pokoj_zaufanie_ustawienie` (20). Rozejm nadal ustawia status 'pokoj' + truceUntilTurn; pokój stały ustawia zaufanie 20 (zostaje; kolejne zmiany dzienne liczą się normalnie). Zdarzenie 'pokoj' w silniku (applyDiplomaticEvent, +5) NIE zostało zmienione — zaufanie ustawia finalizacja.
- main.ts buildDiplomacyTickCtxForPair (linia ~23183): karaWspolnaGranicaDelta = 0, gdy para w karencji (isPeaceLockedBetween(a,b) || isTruceActive(truceUntilTurn, turn)); inaczej sharedBorderPenaltyForEpochs. Flaga karaWspolnaGranica (relacja/NAP) bez zmian.
- main.ts: usunięte wspolnaReligia/odmiennaReligia z ctx pary i z kontekstu czynników; import isTruceActive z diplomacy-peace-lock.

Testy zaktualizowane (TYLKO asercje liczbowe / wiring wynikający z nowego mechanizmu):
- tools/diplomacy-test.cjs: religia 0.5/−0.5 → 0; ekspansja −2 → −3; tarcia −2 → −3 (18→17); tickDiplomacy ekspansja 48 → 47.
- tools/diplomacy-border-era-penalty-test.cjs: wszystkie oczekiwania kar o jeden krok (−2/−3/−4 → −3/−4/−5).
- tools/wiarygodnosc-test.cjs: ekspansja −3 w dryfie (wyniki 50 i 41), tarcia −3 (18.5 i 15.5).
- tools/diplo-truce-impl-test.cjs: regex struktury gałęzi pokoju (wiring) dostosowany do nowego kształtu: w gałęzi pokoju stałego wywoływane jest applyDiplomaticEvent(cur,'pokoj') zamiast applyDiploEventTracked; zaufanie ustawiane setpointem. Asercja „pokój stały +5 (applyDiplomaticEvent)” bez zmian.

Nowy test gra/tools/diplo-trust-numbers-test.cjs: 21/21 PASS, pokrywa (a) (b) (c) (d) (e) (f) (g) z DODATKU (wartości params/JSON, wiring finalize, kary −3/−4/−5, karencja 0 i powrót, religia 0, brak wierszy religii, mutacja starych liczb).

### Ścieżki zawarcia pokoju/rozejmu (wszystkie wchodzą przez finalizePeaceTreatyBetween → ustawienie zaufania)

Pliki: gra/src/main.ts
- 21587 — gracz ↔ AI: akceptacja propozycji `zaproponuj_pokoj` z skrzynki.
- 21745 — akceptacja pokoju z pary (p.fromOwnerId, p.toOwnerId) (propozycja stołowa AI / inter-human).
- 24999 — cywAction 'pokoj' (zaakceptowany stół/cywilizacja).
- 25008 — cywAction 'rozejm' (truceLen 5/10/15).
- 36486 — AI↔AI: prośba przegrywającego o pokój/rozejm zaakceptowana przez zwycięzcę (runAiAiPeaceTick).
- 36554 — pokój wzajemny z przemęczenia wojną (finalize w callbacku).
- 36616 — pokój wymuszony na końcu cooldownu wojny (WOJNA_WYMUSZONA_COOLDOWN).
- 12259 — finalizePeace w portach cyklu oferty pokoju po rozejmie (diplomacy-peace-lock, zgoda drugiej strony).
- Pominięte (nie są zawarciem): 29246 `endWarByPeaceForTest` (hak testowy); 28251/29895 (wstrzyknięcie stanu testowego); 23085/23134 (synchronizacja statusu NAP/sojusz, nie zawarcie pokoju).

### Wpływ na progi umów (tylko opis, bez zmian progów)
- Pakt o nieagresji wymaga Zaufania ≥30 (progNapZaufanie 30) — po pokoju przy 20 pakt jest niedostępny do czasu wzrostu zaufania (opis, progów nie zmieniano).
- Sojusz wojskowy progSojuszZaufanie 90, wymiana technologii 70 — bez zmian; po rozejmie 10 i pokoju 20 są poza zasięgiem od razu.
- Kara za sąsiedztwo: wcześniej −2/−3/−4 działała nawet w karencji; teraz zawieszona w karencji, więc para po pokoju nie traci zaufania przez 10 tur karencji (PEACE_TREATY_LOCK_TURNS) ani przez okno rozejmu.

## TESTY

Bramki referencyjne (po wszystkich zmianach, cwd gra/):
- tsc --noEmit: exit 0.
- logic-test: LOGIC OK (213/213), exit 0.
- tech-tree-test: 20 pass, 0 fail, exit 0.
- research-test: PASSED 33 / FAILED 0 / TOTAL 33, exit 0.
- unit-replace-test: WSZYSTKIE TESTY ZIELONE (21/21), exit 0.
- combat-test: COMBAT TEST 6/6 pass, exit 0.
- diplomacy-test: 148 passed, 0 failed, exit 0 (po aktualizacji liczb).
- diplo-war-trust-only-test: 11 OK, 0 FAIL, exit 0.
- diplomacy-border-era-penalty-test: 39 pass, 0 fail, exit 0.
- diplomacy-peace-lock-test: 9 pass, 0 fail, exit 0.
- diplo-truce-impl-test: 94 PASS, 0 FAIL, exit 0 (po dostosowaniu regexu wiring).
- diplo-tick-war-brake-test: 51 pass / 0 fail, exit 0.
- wiarygodnosc-test: 270 pass, 0 fail, exit 0 (po aktualizacji liczb −3).
- diplo-trust-numbers-test (NOWY): 21 pass, 0 fail, exit 0.

Pozostałe testy diplomacy (nie-live), uruchomione na zmienionym drzewie: 109 z 120 z exit 0 (wiarygodnosc-test po aktualizacji liczb — exit 0). Siedem pozycji NIE przechodzi i są PRE-EXISTING — zweryfikowane na bazie d09df3e0b (wyeksportowanej przez git archive do katalogu poza worktree; wynik tam identyczny):
- diplomacy-stol-pw-sum-test — exit 1 na bazie i na zmianie.
- granice-relacja-dyplomatyczna-test — exit 1 na bazie i na zmianie.
- pr141-hotseat-diplomacy-owner-test — exit 1 na bazie i na zmianie (diploBrakeBonusFlags not defined w harnessie testu).
- diplo-truce-r1-test (P1/P2: „10 pełnych turach wojny") — exit 1 na bazie i na zmianie.
- civ-matrix-ai-diplomacy-wiring-test — exit 1 na bazie i na zmianie.
- culture-religion-test — exit 1 na bazie i na zmianie (B9 mnożnik handlu, nie zaufanie).
- diplo-war-peace-sim-test — exit 1 na bazie i na zmianie (bramka 10 tur wojny).
Testy live (przeglądarka, sidepanel-diplo-dismiss, diplo-*-live-*): NIE_ZMIERZONO — w tym środowisku timeout 124 (brak przeglądarki); nie uruchamiałem pełnego przebiegu live.

NIE_ZMIERZONO: pełny przebieg wszystkich ~120 testów diplomacy na bazie (przerwany z powodu czasu live-testów; ich wynik bazowy nie jest kompletny). Pomiar pre-existing dla 7 pozycji powyżej wykonany osobno na bazie.

## BLOKADY
- Encyklopedia (Civpedia) z opisami −2 i religii w tekstach — poza allowlistą tematu; NIE zmieniano (do osobnego tematu, jeśli właściciel chce).
- Test 1 (czy „rośnie do 10” oznacza podniesienie do co najmniej 10, a nie ustawienie) — ZAŁOŻENIE: ustawienie absolutne (zaufanie = 10 / 20), zgodnie z kryterium (a) „rozejm ustawia zaufanie 10”. Jeśli właściciel chce tylko podnosić do minimum 10/20 (nigdy obniżać), to jedna zmiana w finalizePeaceTreatyBetween (Math.max).
- Zaufanie w silniku 'pokoj' (+5 w applyDiplomaticEvent) zostaje bez zmian; używany tylko przez testy silnika. Zawarcie pokoju ignoruje ten +5 (ustawienie zaufania).

## RUNDY
1/5 — pierwsza runda Operatora.

## NASTĘPNY KROK
Evaluator (SONNET) i Final Control: przegląd diffu i testów; w szczególności decyzja o ustawieniu absolutnym (założenie powyżej) oraz pełne bramki live w środowisku z przeglądarką.

DEPLOY/PUSH: NIE WYKONANO
