STATUS: PASS
DOMAIN: GAME (WEB — `gra/`)
TEMAT: R-WEB-CITY-CLEARS-FOREST-Q1
GOAL: heks, na którym stoi miasto, nigdy nie ma nakładki Las; założenie miasta usuwa las natychmiast (bez kosztu Pracy); stare zapisy po wczytaniu nie mają lasu pod miastem.
ZMIANY/COMMIT: SHA w sekcji „COMMIT" na końcu (commit w worktree; baza `ac952c567`). Pliki: `gra/src/game/city-hex-clear.ts`, `gra/src/main.ts`, `gra/tools/city-clears-forest-test.cjs` (nowy), `gra/tools/city-clears-forest-live-test.cjs` (nowy), katalog runu. Zero zmian: `gra-robocza/**`, `WERSJE.md`, `rust-port/**`, `src-tauri/**`, `auto-improvements.ts`.
TESTY: patrz niżej.
BLOKADY: brak. Konflikt ECHO/komentarzy z regułą: NIE znaleziono (grep „miasto na lesie / las pod miastem": `lasy-modele.ts:37` i `oboz-lowiecki-fc-r2-nowa-sciezka.cjs:112` — oba POTWIERDZAJĄ regułę) -> brak DECISION_REQUIRED.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (ten sam ID), potem Final Control.
DEPLOY/PUSH: NIE WYKONANO

## 1. Rozpoznanie (stan DZIŚ, plik:linia na bazie ac952c567)

Reguła „miasto kasuje las" JUŻ ISTNIAŁA jako macierz B (F-CITY-HEX) i działa na wszystkich ścieżkach założenia:
- `gra/src/game/city-hex-clear.ts` `applyCityFoundingToHex` -> `clearHexForCityCenter` (las ZNIKA; złoża naturalne/zwierzęce ZOSTAJĄ; Góry kasują wszystko).
- `gra/src/main.ts` `finalizeCityFounding` (~14360): filtr warstw `cityKeepsImprovement` (tartak i obóz łowiecki NIE są na liście ZOSTAJE -> znikają), `applyCityFoundingToHex`, `hideDecorAtHex` (mesh lasu/dekor ukryty), `spawnImprovementMesh`, `hexClearingStates.delete`, `removeClearingMesh`, `syncResourceOverlayAtHex`.
- Wszystkie miejsca tworzenia miasta (`foundCityAt(` w main.ts): 9919 (stolica startowa/miasta-państwa klastra), 10038 (dodatkowe miasto klastra), 10091 (spawn miast-państw/kopii), 14664 (`tryFoundPlayerCityAt` — gracz/osadnik), 38179 (AI `cmd foundCityAt`) — KAŻDE woła `finalizeCityFounding` (plus hooki testowe 25032/25850/26044). Miasta barbarzyńców NIE są zakładane — powstają wyłącznie przez przejęcie istniejącego miasta (las usunięty już przy założeniu). `foundCityFromVillage` (cities.ts:1374) nie ma wołającego w main.ts. Generator mapy układa las (`reapplyForestOverlay`, generator.ts:623) PRZED miastami; nigdzie w czasie gry nie jest dosadzany las na heks miasta (grep `nakladka = Nakladka.Las`: tylko gen-helpers.ts:1069/12442 i fixture playtestu).

POMIAR (live, REALNY Chromium, PRZED zmianą): `red-live-PRE.txt` — założenie miasta na lesie (stolica z lasem+tartakiem, 12 miast-państw/klastrów, drugie miasto gracza z lasem+tartakiem) = ZIELONE (L1.2-L1.4, L2.3): las pod miastem po założeniu NIE występuje, tartak pod miastem znika. Odpowiedź na pytanie dispatchu „czy dziś miasto może stać na lesie": przy założeniu NIE.

LUKI (zmierzone czerwone PRZED):
- (a) Wczytanie zapisu z lasem pod miastem: `loadGameFromSlot` (~41583) robił tylko `applyCityFoundingToHex` gdy brak `centerWorkedTile` i hex ma nakładkę — zapis, gdzie `centerWorkedTile` jest, a pod miastem leży Las (+ tartak/obóz), zostawał z lasem. Pomiar: `red-live-PRE.txt` L4.1 „16 miast na Las", L4.2 tartak został.
- (b) Presety playtestu (`reapplyCityHexDecorHides` 40894/41163/41334) i każda nieznana ścieżka — brak domknięcia stanu.
- (c) Granica tury — brak siatki (L5.1 czerwone).

## 2. Implementacja

- `city-hex-clear.ts`: nowe `clearForestFromHex(hex)` i `clearForestUnderCity(map,q,r)` (jedna wspólna reguła, zwraca czy usunięto, idempotentna); `clearHexForCityCenter` używa jej (ścieżka założenia = ta sama funkcja).
- `main.ts`: `enforceNoForestUnderCities(reason)` — siatka bezpieczeństwa: dla każdego miasta `clearForestUnderCity` + `stripForestDependentImprovements` (tartak/obóz, istniejąca ścieżka wyrębu) + `hexClearingStates.delete` + `removeClearingMesh` + `hideDecorAtHex` + `syncResourceOverlayAtHex`. Wołana z `reapplyCityHexDecorHides` (wczytanie zapisu + presety) i na granicy tury obok `sweepLegacyFarmsOnForest`. Plus hak testowy `__cityForestTestDebug` (odczyt + fixture + REALNE `tryFoundPlayerCityAt` / snapshot->restore->reapply).
- Migracja starego zapisu — BEZPIECZEŃSTWO: zmienia tylko nakładkę Las i tartak/obóz NA HEKSIE MIASTA (stan nielegalny wg macierzy B); nie dotyka `centerWorkedTile` (snapshot plonów z chwili założenia; ekonomia nie czyta Las miasta — NIE_ZMIERZONO wpływu na plon, bo snapshot jest niezmieniony), innych ulepszeń (farma/droga/kopalnie zostają), innych heksów. Idempotentna (L4.3). Nie zmienia formatu zapisu ani `SAVE_VERSION`. Kosztu Pracy nie zwraca (jak w precedensie farm w lesie).
- `auto-improvements.ts` NIE ruszany.

## 3. Testy (czerwony PRZED -> zielony PO)

- Unit/okablowanie `node tools/city-clears-forest-test.cjs`: PRZED 11 pass / 4 fail (`red-unit-PRE.txt`: A3a, B3a-c), PO 18 pass / 0 fail. Pokrycie: (a) las na 40 realnych heksach lasu -> brak Las; (b) heks bez lasu i złoże zwierzęce bez zmian; (c) tartak/obóz nie przeżywają, droga/farma zostają; wszystkie `foundCityAt(` mają `finalizeCityFounding(` w oknie 30 linii.
- Live Chromium `node tools/city-clears-forest-live-test.cjs`: PRZED 14/3 fail (`red-live-PRE.txt`: L4.1, L4.2, L5.1), PO 17/0 (`green-live-PO.txt`, exit 0): L1 stolica+12 miast-państw bez Las; L2 drugie miasto na lesie+tartak; L3 lasy poza miastami zostają (1373->1360); L4 stary zapis — las+tartak pod 15 miastami -> po wczytaniu brak, idempotencja; L5 granica tury; zero pageerror. Zrzuty: `evidence/forest-city-L1-stolica.png`, `evidence/forest-city-L4-po-wczytaniu.png`.
- NIE_ZMIERZONO live: miasto AI (`cmd foundCityAt`) — pokryte tylko okablowaniem (B1, mutacja M3).
- Mutacje (pliki `mut-*.txt`): M1 usunięcie `enforceNoForestUnderCities` z `reapplyCityHexDecorHides` -> unit B3b FAIL, live L4.1/L4.2 FAIL; M2 usunięcie `applyCityFoundingToHex` z `finalizeCityFounding` -> unit B2 FAIL, live L1.2/L1.3/L1.4/L2.3 FAIL; M3 usunięcie `finalizeCityFounding` w ścieżce AI -> unit B1b FAIL. Po każdej mutacji źródło przywrócone (potwierdzone 18/0).
- `tsc --noEmit` PASS (`gate-PO-tsc.txt`, EXIT=0).
- Bramki PRZED = PO (logi `gate-PRE-*.txt`, `gate-PO-*.txt`, ostatnia linia `EXIT=0`): diplomacy 148/0, war-era-counter 82/0, ring (unit-owner-emblem-ring-civ-color) 15/0, autoimprove-stages-q1 111/0, auto-improvements 45/0, ai-improvements 53/0, hodowla-las 113/0, battle-standoff 9/9, defeat-last-city 14/0. Znane czerwone (civ-matrix 42/1, ai-test 274/20) NIE uruchamiane — nietknięte.
- Build do `os.tmpdir()` przez `node ./node_modules/vite/bin/vite.js build --outDir <tmp>`; zero `npm run build/dev`. `gra/node_modules` usunięty po etapie.

## 4. Uwaga dla Evaluatora
Stary test `oboz-lowiecki-fc-r2-nowa-sciezka.cjs` (C1: wczytanie zapisu nie przepuszcza warstw przez strip) dotyczy `restorePlacedImprovementsFromSave` — niezmieniona; nowa siatka działa tylko na heksach pod miastem.

## COMMIT
c1bc0443546c0f50520122c7ab5c1f5a1bfe40bc (kod, testy, logi); ten wpis SHA dodany kolejnym commitem dokumentacyjnym.
