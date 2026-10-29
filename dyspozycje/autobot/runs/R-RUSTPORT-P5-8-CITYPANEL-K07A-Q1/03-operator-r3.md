STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P5-8-CITYPANEL-K07A-Q1
GOAL: Port CAŁOŚCI nie-DOM bloku K07A (8 jednostek) z pinu edb8fb56 do frontend-v2 bez DOM, z harnessem pin-vs-port, mutacjami, bramką kopii i selektorem zsynchronizowanym ze stanem (runda 3).
ZMIANY/COMMIT: commit SHA podany w wiadomości końcowej Operatora (baza: c17d7f8e, detached HEAD). Pliki: `src-tauri/frontend-v2/src/ui/cityPanel/k07a-fundament.ts` (generowany), `src-tauri/frontend-v2/tools/dom-harness/{gen-k07a-port.mjs,k07a-subs.mjs}` (nowe), `{select-k07a.mjs,verify-k07a-copies.mjs,run-k07a-units.mjs,mutate-k07a-units.mjs}` (zmienione), `src-tauri/frontend-v2/PORTING-QUEUE.md`, `dyspozycje/rust-port/p5/P5-8-K07A.md`, `dyspozycje/autobot/runs/R-RUSTPORT-P5-8-CITYPANEL-K07A-Q1/r3-logi/**`. Brak zmian w `gra/**`, `package.json`, `WERSJE.md`, lockfile.
TESTY:
- select-k07a.mjs --r3: 8 jednostek nie-DOM (399 LOC), 15 DOM odroczone (`r3-logi/podsumowanie.json`).
- gen-k07a-port.mjs: 8 bloków wygenerowanych z pinu + k07a-subs.mjs.
- verify-k07a-copies.mjs: EXIT 0, blocks=8, units=8, lineSubs=5, ORPHAN=0, TEXT OK (`r3-logi/verify-k07a-copies-r3.log/.json`).
- run-k07a-units.mjs: EXIT 0, 5 296 porównań, 0 różnic (`r3-logi/run-k07a-units-r3.log`).
- mutate-k07a-units.mjs: 67 mutantów: 66 ZABITE, 1 PRZEZYLA (`eq-null-return`, równoważna), 0 NIE_ZMIERZONO (`r3-logi/mutacje-r3-cz{0..3}.json`).
- npm run check: EXIT 0 (`r3-logi/check-r3.log`). npm run typecheck: EXIT 0 (`r3-logi/typecheck-r3.log`). npm ci wykonany w worktree (katalog gitignorowany).
BLOKADY:
- 15 jednostek DOM → K07B (osobny temat).
- Wiring kontrolera (setK07aDeps, setK07aExt, setK07aActiveCity, setK07aDrawerTab, setK07aScalePx) z prawdziwym stanem: NIE_ZMIERZONO, K07B/integracja.
- Prawdziwe buildChipDeltaStockHtml i adaptery DTO (mapowanie CityRefDto→CityK07, parzystość fallbacków cfg.* z pinem): NIE_ZMIERZONO (w harnessie ten sam fixture po obu stronach).
- Formatery v2 i atrapa ikon (brandAssets): po obu stronach ta sama implementacja, parytet w ich harnessach.
- Przeglądarka: nie dotyczy (jednostki bez DOM), nie wykonano.
ODPOWIEDZI NA ZARZUTY (r3):
1. Zakres (PRZYJMUJĘ w części, ODRZUCAM liczbę 26): skeleton, buildCityOnlyW3FlankChips, buildCityResourceStatItems zaportowane w r3 (commit wyżej). Liczba „26 jednostek bez DOM” ODRZUCONA: selektor --r3 zwraca 8 jednostek nie-DOM, a K07 ma 23 jednostki = 15 DOM + 8 nie-DOM (`r3-logi/podsumowanie.json`, `r3-logi/wybrane.json`). Selektor r2 zwracał 7 (bez klas T/P) — naprawione.
2. Fałszywe uzasadnienie odroczenia (PRZYJMUJĘ): zweryfikowano grepem — `readPodzialHandlu` = `src/ui/cityPanel/k05b-host.ts:228` (wrapper hosta), `cityPracaSplitK04b` = `k04b-podzial.ts:71` (sygnatura DTO, inna niż pin), `resolveEmpireSnapK` = `k04c-model.ts:29` (sygnatura inna niż pin). Zależności wchodzą przez adaptery K07A-Z4 (`ext.cityPracaSplit`, `ext.readPodzialHandlu`, `ext.resolveEmpireSnap`), nie przez odroczenie. Dokument §1 poprawiony.
3. Selektor niezsynchronizowany (PRZYJMUJĘ, z wyjątkiem pustej listy kopii): select-k07a.mjs przepisany — nagłówek dotyczy K07A (nie k06a/K05), tryb --r3 włącza klasy T/P i klasę R rozstrzyganą adapterem, zakresy liczone przez `codeEndLine` (`k07a-subs.mjs`), wynik zapisany w `r3-logi/`. ODRZUCAM wpisanie `City` do K07A_LOCAL_COPIES jako warunek wyniku: zmierzone, że wynik selektora jest identyczny dla `[]` i `[{name:'City'}]` (3 i 3 jednostki przy wariancie R3 „tylko klasa R”). Lista jest pusta, bo lib dopuszcza lokalne kopie tylko dla importów typów z logiki, a typ K07A-Z1 (`CityK07`) nie jest importem; nazwy kopii są w `LOCAL_NAMES` (`k07a-subs.mjs`) i bramce `verify-k07a-copies.mjs`.
4. Odstępstwo od pinu bez deps (PRZYJMUJĘ): `requireK07aDeps()` rzuca wyjątek zamiast pomijać tempo/zapas; harness sprawdza ten kontrakt (`w3CityChip`: `{threw:true}`), mutant `w3-delta-require` zabity. Część „parzystość zależy od niezmierzonego wiringu” — PRZYJMUJĘ jako NIE_ZMIERZONO (§7 dokumentu).
5. Słabe pokrycie buildChipDeltaStockHtml (PRZYJMUJĘ w części): stub z fixture pozostaje (NIE_ZMIERZONO, §7). ODRZUCAM „iluzoryczne” dla samego wywołania: mutanty zamiany argumentów tempo/zapas, undefined i niesk. wartości są zabite (`w3-delta-swap`, `w3-delta-undef`, `w3-delta-nonfinite`, `w3-stock-nonfinite`).
6. Brak mutacji pól DTO (PRZYJMUJĘ): dodano 33 mutanty (`sk-*`, `ow-*`, `rs-*`, `ad-*`): pole pracaPool/pracaRate, zapas skarbca, `civ.zloto` wejściowe, progi (60, zero), adaptery isMeCity/ownerCities/civWide/formatManpower, settery. Wszystkie zabite poza równoważną. Fixture wymusza brzegi (getEpoch undefined, porPct 60, religia Infinity, kultura NaN). Mapowanie CityRefDto→CityK07 jest zakresem K07B (ZAŁOŻENIE K07A-Z1), NIE_ZMIERZONO.
7. Dokument bez tabeli API / status CZĘŚCIOWO (PRZYJMUJĘ): `P5-8-K07A.md` ma pełną tabelę było/jest (8 jednostek, stan K07A-Z3, typy, setery, wrappery), listę importów, ZAŁOŻENIA Z1..Z5 i status KOMPLETNE dla nie-DOM.
RUNDY: 3/5
NASTĘPNY KROK: bramka Evaluator i Final Control na commicie wyżej; po PASS — integracja orkiestratora; następnie K07B (15 jednostek DOM).
DEPLOY/PUSH: NIE WYKONANO
