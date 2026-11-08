STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-CITY-MILITIA-NO-POPULATION-LOSS-Q1
GOAL: Straty Milicji nie zmieniaja ludnosci; zdobycie OBCEGO miasta pomniejsza ludnosc o dokladnie 1 (min. 1).
RUNDY: obrona 2/5 (po FAIL Evaluatora r1)

## Odpowiedz na zarzuty

1. PRZYJMUJE (poprawka + dowod). Mechanizm -1 nie istnial (grep `population -=` w siege.ts: brak; jedyny spadek to migracja po rewolcie main.ts, nie zdobycie). Dodano:
   - dane: `gra/data/miasto-params.json` -> `capture_pop_loss` = 1;
   - JEDEN punkt wspolny: `applyCapturePopulationLoss` + `capturePopLossReportRow` w `gra/src/game/cities.ts`;
   - wywolanie w `applyCityCaptureAfterBattle` (`gra/src/game/post-battle-map.ts`) = wspolna droga bitwy o miasto, szturmu, wejscia do pustego miasta (`captureCityWithoutBattle` -> `applyCityCaptureToMap` -> `applyCityCaptureAfterBattle`), AI, miast-panstw i barbarzyncow;
   - drugie wejscie zmieniajace wlasciciela w wyniku wojny: kapitulacja glodowa (`gra/src/main.ts`, przed `applyPostCaptureLawOnCapture`);
   - UI: wiersz „Ludnosc: -1 (straty zdobycia)" (grupa `strata`, ton `loss`) dolaczany do `reportRows` obu sciezek (applyCityCaptureToMap, kapitulacja);
   - dokumentacja: jedno zdanie w `PROJEKT-GRY-master.md` §9c.
   DECYZJA o odzyskaniu: NIE ma -1, gdy zdobywca = poprzedni wlasciciel (nowe pole opcjonalne `City.capturedFromOwnerId`, zapisywane przy kazdym zdobyciu) albo wlasciciel sprzed buntu (`rebelPreviousOwnerId`, snapshot przed jego skasowaniem). Zbuntowane miasto zdobyte przez INNEGO niz dawny wlasciciel: -1. ZAŁOZENIE: ludnosc 1 zostaje 1 (miasto nie jest niszczone).
   WYLACZONE (kod bez wywolania, test statyczny): cesja traktatowa `transferCityByTreaty`, aneksja `annexCityStateToOwner`, zwykla bitwa bez zdobycia, straty Milicji. Rebelia (`city.ownerId = REBEL...`) to nie zdobycie przez atakujacego.
   Testy: `gra/tools/city-capture-pop-loss-test.cjs` — 29 PASS / 0 FAIL, 5 mutacji zlapanych (loss-two, no-min-one, reclaim-not-excluded, pb-call-removed, rebel-snapshot-ignored). RED na drzewie src/data z `d4ca8b748` (stan sprzed r2): 10 FAIL, EXIT=1 (`gate-capture-test-r2-red-base.txt`). Przypadki: gracz/AI/miasto-panstwo/barbarzyncy, ludnosc 1, ludnosc 2..40 = dokladnie -1 (brak podwojnego naliczenia), odzyskanie wlasnego, odzyskanie po buncie, trzecia cywilizacja, wiersz raportu.
2. PRZYJMUJE. Stwierdzenie: mechanizm utraty ludnosci przy zdobyciu NIE istnial (siege.ts `captureCity` zmienia tylko ownerId/garrison/fortified; post-battle-map nie ruszal `population`). Zamierzonych przyczyn spadku ludnosci przy zdobyciu brak; dodany -1 jest jedyna. Inne przyczyny (koszt ludnosci akcji main.ts, migracja po rewolcie) nie dotycza zdobycia i zostaja.
3. CZESCIOWO PRZYJMUJE. `budynek-garnizon-test`: zmierzono PRZED i PO — EXIT=1 w obu (ten sam wynik, przed zmiana: ta sama porazka, `gate-regresja-przed-r2.txt` vs `gate-regresja-po-r2.txt`); wczesniej niezmierzone PRZED jest teraz zmierzone. Ten sam zestaw padajacych testow PRZED i PO (ai-wojny-zwykle-cap-dwa-miasta, ai-zdobycie-miasta-adiacencja, mgla-sciezka-inwariant, okolica-ownership-change-reconcile, weterani, wydarzenia-eliminacja-podboj-karta, budynek-garnizon) = brak regresji; pozostale 16 testow EXIT=0 po zmianie. `wall-defenders-bonus-range-test`: NIE_ZMIERZONO — uruchamia `vite build`, zakazany w `gra/` (ZAKAZ dispatchu).
4. ODRZUCAM jako brak mozliwosci (nie jako blad): pomiar w Chromium/harnessie nie wykonany — `main.ts` nie bundluje sie w node, a bundle przegladarkowy wymaga `vite`. Dowod zastepczy mocniejszy niz sam test statyczny: prawdziwe funkcje `applyCityCaptureAfterBattle`/`applyCapturePopulationLoss` wykonane w tescie (bitwa/szturm/puste miasto ida ta sama funkcja), plus kontrola statyczna lancucha wywolan w main.ts. Weryfikacja wizualna wiersza raportu: NIE_ZMIERZONO (do Evaluatora/Final Control).

TESTY: tsc --noEmit EXIT=0 (`gate-tsc-r2.txt`); nowy test 29 PASS; city-militia-no-population-loss/no-defenders/regen-cooldown EXIT=0; regresja PRZED vs PO identyczna.
ZMIANY: gra/data/miasto-params.json, gra/src/game/cities.ts, gra/src/game/post-battle-map.ts, gra/src/main.ts, gra/tools/city-capture-pop-loss-test.cjs, PROJEKT-GRY-master.md, run-dir. Zero zmian: gra-robocza, WERSJE.md, rust-port.
UWAGA ZAKRESU: dispatch dopuszczal `cities.ts`/dane/UI wiersz; `post-battle-map.ts` dodany jako wspolny punkt zdobycia (jedyny pure modul wspolny dla wszystkich sciezek).
BLOKADY: brak
NASTEPNY KROK: Evaluator
DEPLOY/PUSH: NIE WYKONANO
