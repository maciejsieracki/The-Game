STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-SAVELOAD-HOTSEAT-PRACA-Q1
GOAL: Zapis/odczyt puli Pracy KAZDEGO fotela hot-seat (decyzja wlasciciela A, 2026-10-31): nowe pole `meta.pracaPoolByHuman` = tablica par [ownerId, pula]; stare zapisy bez pola wczytuja sie bez bledu; ten sam sanitizer `sanitizeLoadedPracaPool`.

## ZMIANY/COMMIT

SHA-COMMIT: 1545269a05e0bd10eb13aa45a88a92439d37011f (commit funkcjonalny; ten raport dopisany w commicie poprawkowym na tej samej galezi worktree-wf_99334725-a8b-1)

Allowlista (jawny `git add`):
- `gra/src/main.ts` (+42 linii, tylko pula Pracy per fotel):
  - zapis: `meta.pracaPoolByHuman` w `buildSaveGameSnapshot` (obok `playerPracaPool`, ktory zostaje dla zgodnosci; plik: `gra/src/main.ts`, blok `meta:` przy polu `playerPracaPool,`).
  - odczyt: w `restoreGameFromSave`, zaraz po `_lastPraca = playerPracaPool;`: (a) kasuje wpisy fotelow != 0 w `pracaPoolByHuman`, (b) zaklada `{praca:0}` dla KAZDEGO fotela z `humanSeats.humanOwnerIds` (bez tego `ownerPracaPool` rzuca, patrz pomiar), (c) wczytuje pary z zapisu przez `sanitizeLoadedPracaPool`, ignorujac wpisy smieciowe (nie-tablica, ownerId nie-liczba, owner nie bedacy fotelem, brak wartosci) oraz pare fotela 0 (autorytatywny pozostaje `playerPracaPool`, komorka-alias fotela 0 nietknieta), (d) `setOwnerLastPraca(oid, pula)` dla kazdego fotela (symetria z `_lastPraca = playerPracaPool` fotela 0).
  - hak testowy `__pracaPoolSaveLoadTestDebug`: dodane `roundTripMeta`, `seatPoolRaw`, `seatLastPraca`, `savedSeatPools`, `writeLegacySlot` (tylko do nowego testu; zero logiki decyzyjnej).
- `gra/tools/saveload-praca-pool-hotseat-live-test.cjs` (NOWY, realny Chromium + realny vite build do `os.tmpdir()`).
- `dyspozycje/autobot/runs/R-WEB-SAVELOAD-HOTSEAT-PRACA-Q1/**` (raport, logi `gate-*.txt`, `pomiar-green.json`; pomiaru czerwonego dowodzi `gate-hotseat-red.txt`, osobnego `pomiar-red.json` NIE MA).
- `gra/src/game/save.ts`: BEZ zmian (`meta` jest przekazywane bez filtrowania: `save.ts` `meta: obj.meta`), `SAVE_VERSION` bez bumpu (pole opcjonalne).
Zero zmian: `gra-robocza/**`, `dyspozycje/WERSJE.md`, `rust-port/**`, `auto-improvements.ts`.

## TESTY

### (1) Pomiar CZERWONY na zywej grze PRZED zmiana (`gate-hotseat-red.txt`; surowy log, bez pliku JSON)
Scenariusz: nowa gra, stolica, `seedSecondSeat(1)`, pula fotela 0 = 405, fotela 1 = 77, REALNY zapis do slotu IndexedDB (`persistSaveToSlot`), PELNE `page.reload`, REALNE `loadGameFromSlot`.
- snapshot nie zawiera pola: `savedSeatPools() = null` (FAIL H5).
- fotel 0 po swiezym wczytaniu = 405 (OK).
- fotel 1: NIE "prawdopodobnie 0" (hipoteza z R-WEB-SAVELOAD-PRACA-POOL-Q1), tylko GORZEJ: wpis `pracaPoolByHuman.get(1)` NIE ISTNIEJE po swiezym wczytaniu, `ownerPracaPool(1)` rzuca `TypeError: Cannot read properties of undefined (reading 'praca')` (main.ts `ownerPracaPool`: `pracaPoolByHuman.get(ownerId)!.praca`), a `setOwnerPracaPool(1, ...)` rzuca `Cannot set properties of undefined (setting 'praca')`. Czyli po wczytaniu hot-seat zapisu kazda operacja na puli fotela 2+ (handel Praca, koniec tury, HUD) do pierwszego `switchActiveHuman(1)`, ktory dopiero zaklada wpis, ma wyjatek. NIE_ZMIERZONO: dokladna sciezka UI, ktora jako pierwsza trafia w wyjatek w prawdziwej rozgrywce (zmierzono wywolanie funkcji, nie klik).
- `_lastPraca` fotela 1 po wczytaniu = 0 (FAIL H1.3).
- Test zakonczyl sie EXIT=2 na wyjatku (H2 wymaga istniejacego wpisu) - to jest czerwony (log: `gate-hotseat-red.txt`).

### (2) Test nowy ZIELONY PO: `node tools/saveload-praca-pool-hotseat-live-test.cjs` = 22 pass / 0 fail (`gate-hotseat-green.txt`, EXIT=0)
Przypadki: H5 snapshot niesie [[0,405],[1,77]]; H1 fresh-page (405/77/cache HUD 77); H2 round-trip fotela 1 = 0 i 1500, izolacja 11/22; H4 wartosci graniczne fotela 1: 5e9 -> 1_000_000, 1_000_000, 999_999, -5 -> 0, 'abc' -> 0, null -> 0, 0 (przy parze fotela 0 = 999 w zapisie, fotel 0 nadal 405 = para fotela 0 ignorowana), pole nie-tablica -> 0, wpisy smieciowe ignorowane przy poprawnym [1,31], brak pola -> 0; H3 stary zapis (kopia slotu bez pola) po pelnym przeladowaniu: fotel 0 = 405, fotel 1 = 0, zero bledow.
Uwaga uczciwosci: pierwsze uruchomienie zielone mialo 15/7, bo asercje H4 mialy blad fixture (pula fotela 0 = 11 zamiast 405 po poprzednim kroku); poprawiony fixture testu (`setPool(405)` przed petla), nie kod gry; wynik koncowy 22/0.

### (3) Mutacja (`gate-hotseat-mutacja.txt`)
Usuniecie linii zapisu `pracaPoolByHuman` z `meta` (odczyt bez zmian) -> 17 pass / 5 fail (EXIT=1): H5, H1.2 (po=0), H1.3, H2 (1500 -> 0), H2.3 pada. Przywrocono kod; `main.ts` w commicie zawiera linie zapisu (`grep -c "pracaPoolByHuman: Array.from"` = 1).

### (4) Bramki PO (logi `gate-po-*.txt`, kazdy z jedna linia EXIT=)
| bramka | wynik | referencja z dispatchu |
|---|---|---|
| `node ./node_modules/typescript/bin/tsc --noEmit` | EXIT=0 | 0 bledow |
| diplomacy-test | 148/0 | 148 |
| war-era-counter-test | 82/0 | 82 |
| unit-owner-emblem-ring-civ-color-test | 15/0 | 15 |
| autoimprove-stages-q1-test | 184/0 | zielony |
| auto-improvements-test | 46/0 | zielony |
| ai-improvements-test | 53/0 | zielony |
| fort-outpost-hard-territory-test | 80/0 | 80/0 |
| saveload-praca-pool-live-test | 13/0 | 13/0 |
| defeat-last-city-test | 14/0 | 14/0 |
PRZED (poza nowym testem czerwonym): NIE_ZMIERZONO osobnym przebiegiem na `0f9f60a10`; za punkt odniesienia sluza wartosci z dispatchu, wszystkie zgodne po zmianie. Znane czerwone (civ-matrix 42/1, ai-test) nie uruchamiane (bez zmiany).
Build: `vite build --outDir <os.tmpdir()>` w tescie (zakaz `npm run build/dev` zachowany). Po etapie usunieto `gra/node_modules` i katalogi scratch.

### (5) Inne wartosci per-fotelowe (`setOwnerLast*`) - ustalenia, NIE rozszerzono bez decyzji
- Zapisywane per fotel i OK: `gracze[]` (skarbiec/nauka/era/badania), `exploredByHuman`, `ownerDefault*`, `ulepszeniaEmpireByOwner`, `pendingManualWorkTaxByOwner`, `aiPracaPoolByOwner`.
- Cache HUD `_last*` (Rate, Upkeep, AutoUlepszeniaKoszt, CudaKoszt, Kultura, KulturaRate) dla foteli 2+: NIE sa zapisywane i NIE sa zerowane przy wczytaniu w sesji (zerowana jest tylko zmienna fotela 0, `main.ts` blok `_lastPracaRate = 0;` w `restoreGameFromSave`); po swiezym przeladowaniu strony = 0 (fallback `makeOwnerCacheSlot`). Sa to wartosci pochodne, przeliczane w `refreshLiveEmpireRatesUnsafe` dla aktywnego fotela, wiec ryzyko to co najwyzej migniecie starej wartosci w HUD/panelu imperium fotela 2+ po wczytaniu w trakcie sesji. NIE_ZMIERZONO (brak testu na zywej grze); nie zmieniano. Do pytania ABC (Q-1 nizej).
- Flaga `_pracaRateFreshFromEndTurn` pozostaje singletonem globalnym (opisane juz w komentarzu przy fabryce slotow); nie zapisywana; poza zakresem.
- Dodatkowo: `ownerLastPraca` jest ustawiany (nowe) z puli wczytanej dla kazdego fotela, wiec H1.3 zielone.

## BLOKADY
Brak. Zero decyzji wymagajacych wlasciciela do kontynuacji (luki rozstrzygniete zalozeniami ponizej).

Zalozenia: (Z1) para fotela 0 w `pracaPoolByHuman` jest ignorowana przy odczycie - `playerPracaPool` zostaje jedynym zrodlem prawdy fotela 0 (stary format, zgodnosc); (Z2) pary dla ownerow nie bedacych fotelem w `humanOwnerIds` sa ignorowane; (Z3) bez bumpu `SAVE_VERSION` (pole opcjonalne, wzorzec jak `tradeRoutes`).

## PYTANIA ABC (dla orkiestratora, nie zadawane przez Operatora)
- Q-1: Cache HUD `_last*` foteli 2+ po wczytaniu w sesji: (A) zerowac je przy wczytaniu jak dla fotela 0 (maly dodatek w `restoreGameFromSave`), (B) zapisywac i odtwarzac (zmiana formatu, wartosci pochodne - niezalecane), (C) zostawic (przeliczane przy pierwszym refresh aktywnego fotela). Rekomendacja: A albo C; wplyw tylko kosmetyczny HUD, NIE_ZMIERZONO.
- Q-2 (informacyjne, wynik pomiaru): przed zmiana wczytanie hot-seat zapisu na swiezej stronie dawalo wyjatek `TypeError` na puli fotela 2+, nie "pule 0" - to znaczaco podnosi wage naprawy; ewentualny osobny temat na sprawdzenie innych `Map.get(id)!` per fotel po wczytaniu (np. `exploredByHuman`/`playerStateByHuman` sa odtwarzane z zapisu - OK; `pracaPoolByHuman` bylo jedyna pominieta, zmierzono tylko ta mape).

## RUNDY: 1/5
## NASTĘPNY KROK: Evaluator (runda 1) - weryfikacja niezalezna: uruchom `node tools/saveload-praca-pool-hotseat-live-test.cjs` (22/0), mutacja (usun linie zapisu -> 17/5), bramki z tabeli, przeglad diffu `gra/src/main.ts` (tylko pula per fotel + hak testowy).
## DEPLOY/PUSH: NIE WYKONANO
