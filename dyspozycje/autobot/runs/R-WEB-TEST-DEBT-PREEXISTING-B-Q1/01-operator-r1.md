STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB) — dług testowy (klasyfikacja A/B/C)
TEMAT: R-WEB-TEST-DEBT-PREEXISTING-B-Q1
GOAL: partia 1 splaty listy B (133 czerwone testy przedistniejące, R-WEB-FULL-REGRESSION-MAIN-Q1 sekcja B): bramki §6 w kolejności + rodziny. Cel partii: min. 15 testów z listy B zielonych albo usuniętych z uzasadnieniem. WYNIK: 3/15 — ZIELONE: unit-power-test, unit-replace-test, unit-recruit-nazwa-test. Pozostałe: sklasyfikowane częściowo albo nieruszone (patrz tabela). Cel partii NIE OSIĄGNIĘTY.
BAZA: origin/main a8823b16b (detached). Dispatch: origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0.
ZMIANY-COMMIT: allowlista — gra/tools/unit-power-test.cjs, gra/tools/unit-replace-test.cjs, gra/tools/unit-recruit-nazwa-test.cjs, ten katalog runu. Zero zmian w gra/src/**, gra/data/**, gra-robocza/**, WERSJE.md, rust-port/**. SHA commitu: w sekcji „Commit” na końcu.
TESTY (przed → po):
- unit-power-test: 4/6 → 6/6 ZIELONY (klasa A)
- unit-replace-test: 12/15 → 15/15 ZIELONY (klasa A)
- unit-recruit-nazwa-test: 16/17 → 17/17 ZIELONY (klasa A)
- logic-test (regresja): 213/213 OK
- git diff --check: czysto
- tsc --noEmit: NIE_ZMIERZONO w tej rundzie (brak zmian w TS)
BLOKADY:
- mgla-sciezka-inwariant-test: 39 pass / 3 fail — klasa B (niżej); whitelisty NIE zmieniano bez ECHO.
- ai-zdobycie-miasta-adiacencja-test: czerwony, przyczyna NIEROZSTRZYGNIĘTA (wymaga diagnozy).
- ai-test: NIE_ZMIERZONO (2927 linii, 20 FAIL w baseline) — klasyfikacja 20 pozycji nie wykonana.
- unit-detail-card, unit-info-card-army-interaction, unit-info-card-wiring, unit-power-sort, unit-resource-upkeep: NIE sklasyfikowano.
- DYSK: przy starcie 3,1 GB wolnego (próg orkiestratora dla webu: 4 GB). node_modules (134 MB) usunięto po pracy.
RUNDY: 1/5 (partia 1)
NASTĘPNY KROK: Evaluator (Sonnet) weryfikuje trzy zmiany fixture/wartości i klasyfikację. Kolejna runda Operatora (dopisek do dispatchu): (a) ai-zdobycie — diagnoza K1b/K2 i mutacji „nounblock” (kotwica nie znaleziona); (b) ai-test — 20 FAIL; (c) unit-resource-upkeep — 4 FAIL, podejrzenie klasy A względem 4c1126de1 / 7d4ad9690 (do potwierdzenia, nie zakładać); (d) unit-detail / info-card / power-sort — diagnoza.
DEPLOY/PUSH: NIE WYKONANO

## Klasyfikacja i dowody

| Test | Kl. | Akcja | Dowód | Wynik |
|---|---|---|---|---|
| unit-power-test (Hastati M_pole; sumArmyFieldPower) | A | oczekiwane 50→57.5 (Hastati), 45→52.5 (Falanga) | 37db6cdc4 „Balans: 2x zywnosc…” zmienił Hastati fieldPower 50.0→57.5 w units.json; formuła runtime = wartość w JSON (57.5) | 4/6 → 6/6 |
| unit-replace-test (Evocati, scenariusze 1/2/4) | A | fixture: dodano 'koszary' do builtBuildingIds | bramka Koszar dla epok >= Braz (production.ts, passesAvailabilityGates i availableProduction) pochodzi z e06ad53c8, po ostatniej zmianie testu; Evocati (Epoka Żelazo) wymaga koszar | 12/15 → 15/15 |
| unit-recruit-nazwa-test (galąź B, Evocati) | A | fixture: 'koszary' (2 miejsca) | ta sama bramka | 16/17 → 17/17 |
| mgla-sciezka-inwariant-test [1] | B | NIE zmieniano | nowe zapisy pozycji bez wpisu w KLASYFIKACJA: battleScene.ts:8607-8608, siege-enter-city.ts:99-100, main.ts:4275, main.ts:26414, main.ts:34805-34806 — od b4a97ae4b (SIEGE-SURRENDER-ENTER-CITY) i b41876183 (ARMY-STACK-LIMIT). Ocena, czy to przesunięcia >1 heks bez odkrycia mgły, wymaga przeglądu kodu; zmiana whitelisty = ECHO | czerwony |
| mgla-sciezka-inwariant-test [whitelist] | B | NIE zmieniano | martwy wpis „battleScene.ts ru.r = wallRow; #1” (kod zniknął) — usunięcie to zmiana whitelisty | czerwony |
| mgla-sciezka-inwariant-test [1c] | A-kandydat | NIE zmieniano | `Object.assign(snap.meta as any, patch)` (main.ts:28165): cel to meta zapisu, nie pozycja jednostki — skaner łapie fałszywie (od 1545269a0). Poprawka skanera = ECHO | czerwony |
| ai-zdobycie-miasta-adiacencja-test | NIEROZSTRZYGNIĘTE | NIE zmieniano | K1b: plan.move.targetCityId undefined (oczekiwano 'wrog-c1'); K2b–K2g: rozkaz nieprzyjęty, brak przejęcia; A5c/A5d/A6c: asercje wzorców źródłowych; mutacja „nounblock”: kotwica nie znaleziona (przerwanie). Czy regresja kodu (ai.ts ~4120; main.ts ~40690 onCapture), czy nieaktualny harness — do ustalenia | czerwony, przerwany |
| ai-test | NIE_ZMIERZONO | — | 20 FAIL w baseline; plik 2927 linii | — |
| unit-detail-card-entitycard-migration-test | NIE_SKLASYFIKOWANO | — | 2 FAIL | 38/40 |
| unit-info-card-army-interaction-test | NIE_SKLASYFIKOWANO | — | „status runtime jest pobierany z właściwej jednostki” | 6/7 |
| unit-info-card-wiring-test | NIE_SKLASYFIKOWANO | — | „wiring rozpoznaje właściwą jednostkę runtime” | 5/6 |
| unit-power-sort-test | NIE_SKLASYFIKOWANO | — | „city panel detail and recruitment lists both sort at the display boundary” | 12/13 |
| unit-resource-upkeep-test | NIE_SKLASYFIKOWANO (podejrzenie A) | — | Wojownik/Włócznik: koszty rekrutacji i utrzymania różne od oczekiwanych; zbieżne z commitami 4c1126de1 („half recruitment…”) i 7d4ad9690 („×5 rekrutacja”) — wymaga potwierdzenia | 3/7 |

Klasa B do osobnego tematu (NIE naprawiano, zgodnie z zasadą): mgla-sciezka [1] — ocena nowych miejsc przesunięcia jednostki (siege-enter-city.ts:99, main.ts:4275/26414/34805) względem inwariantu odkrywania wzdłuż ścieżki. Proponowany temat: R-WEB-TEST-DEBT-MGLA-INWARIANT-NEW-SITES-Q1.

## Commit
Commit obejmuje wyłącznie 3 pliki testów i ten raport (git add jawnie, per plik). Push NIE wykonano.
