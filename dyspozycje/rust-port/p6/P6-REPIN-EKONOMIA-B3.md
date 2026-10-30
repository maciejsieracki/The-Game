# P6-REPIN-EKONOMIA-B3 - odswiezenie portu ekonomii do webu 91dc998a (czesc B3)

**Temat:** `R-RUSTPORT-REPIN-EKONOMIA-B3-Q1` · **Runda:** 1/5 (Operator-impl; weryfikacja niezalezna r2 i odpowiedzi na zarzuty w tej samej rundzie) · **Pin portu:** `edb8fb56` (bez zmiany pinu) · **Cel:** `91dc998a5f1b51ad29e0f4785edfd45655445c53` · **Baza kodu:** `4c005237` (origin/rust-port/parity-v2)

## 1. Zakres i zalozenia

- **ZALOZENIE Z1 (wybor partii).** Dispatch: "kolejne 12 hunkow `turn-economy.ts` po tych z B1 (kolejnosc pliku)". Numeracja `git diff -U0 edb8fb56 91dc998a -- gra/src/game/turn-economy.ts` = **51 hunkow** (zgodnie z dispatchem). Hunki z B1 (era Racji, `computeCityFoodBalanceV85` i `recomputeCityFoodBalancesInEcon`) to hunki **15-17** tej listy (`@@ -1645`, `-1652`, `-1685`). Partia B3 = hunki **18-29** w kolejnosci pliku (`@@ -1902` ... `@@ -2138`).
- **ZALOZENIE Z2 (hunki 1-14 poza partia).** Hunki 1-14 (importy, `applyOrderYieldMults` export, `wealthParamsForOwner` (hunk 7), `routeCashForCity` (hunk 8, definicja), usuniecie `religionTradeWalutaOverride` (hunk 9), `buildEconParams` (hunk 10), pola `CityEconomyTick` (hunki 11-13), komentarz `OwnerEconomySum` (hunk 14)) nie naleza do partii. Dwie zaleznosci z tej grupy zostaly przeniesione swiadomie, bo partia 18-29 wola je wprost: `routeCashForCity` (hunk 8) i `wealthParamsForOwner` (hunk 7) - zob. sekcja 3. Pozostale hunki 1-14 zostaja w statusie z dossier B (NASTEPNA-PARTIA / NIE-DOTYCZY).
- **ZALOZENIE Z3 (brak tiku ekonomii w Rust).** `previewCityEconomy` i `advanceCityEconomy` nie maja odpowiednika w `rust-port/engine/src` (grep `fn preview_city_economy|fn advance_city_economy` = 0 trafien; stwierdzone w dossier B, potwierdzone ponownie). Hunki, ktorych jedynym celem jest wiring wewnatrz tych funkcji, nie maja miejsca wykonania w porcie - ich status to NASTEPNA-PARTIA (tick) albo NIE-DOTYCZY, z uzasadnieniem.
- **ZALOZENIE Z4 (`routeCashForCity` nieeksportowany).** W webie funkcja nie jest eksportowana. Generator wycina jej tekst dosłownie z `gra/src/game/turn-economy.ts` @ 91dc998a i kompiluje obok prawdziwego `civ-matrix.ts` @ 91dc998a (plik pomocniczy tylko w katalogu tymczasowym poza repo). Logika weba nie jest zmieniana.
- **ZALOZENIE Z5 (podzbior WealthParams).** Rust nie ma `WealthParams` ani `advanceWealth`. `WealthModParams` niesie tylko pola czytane przez modyfikatory (`capNaEpoke`, `mnoznikNaPoziom`); pozostale pola przechodza przez web bez zmian (kopia `...spread`) i nie wplywaja na funkcje.
- **ZALOZENIE Z6 (dossier).** `dyspozycje/rust-port/p6/P6-REPIN-EKONOMIA-B.md` (B1) istnieje, ale brak w nim tabeli hunkow turn-economy 18-29; ten dokument jest NOWY (allowlista) i jest jedyna tabela partii B3.
- **ZALOZENIE Z7 (wektory z fixture).** W realnej macierzy `civ-matrix.json` @ 91dc998a parametry `wealth_cap_proc` i `wealth_mnoznik_proc` = 0 dla wszystkich cywilizacji, a `eko_pieniadz_port_proc` != 0 tylko dla Grecy/Hetyci/Fenicjanie. Dla pokrycia niezerowych modyfikatorow wygenerowano dodatkowo wektory z **kopii macierzy weba** z podniesionymi wartosciami (trzy cywilizacje) - `tests/p6_repin_b3_vectors/civ_matrix_mod.json`. To fixture testowy, nie dane gry; kod weba liczy oba warianty bez zmian.
- **ZALOZENIE Z8 (kodowanie liczb w wektorach).** Liczby w wektorach sa napisami `String(x)` (najkrotsza forma round-trip JS). Powod: `serde_json` w `rust-port/engine` (bez `float_roundtrip`) parsuje czesc liczb JSON o 1 ulp inaczej niz JS (zmierzone: `9.915000000000001` -> `9.915`). Porownanie: bitowe f64, zero bez znaku, NaN == NaN.

## 2. Tabela hunkow partii B3 (turn-economy.ts, hunki 18-29)

| # | Hunk (-U0, web 91dc998a) | Zmiana webu | Plik:linia weba | Rust | Test / wektor | Status |
|---|---|---|---|---|---|---|
| 18 | `@@ -1902` (+4) | `previewCityEconomy`: nowe parametry `maritimeTradeIncomeByCity`, `additionalTaxByCity` | `turn-economy.ts:1855-1858` | brak (tick ekonomii nie ma portu, Z3) | - | NASTEPNA-PARTIA (tick) |
| 19 | `@@ -2014` (-1) | usuniecie `cityReligion` w preview | `turn-economy.ts:1969` (usuniete) | brak (w Rust nigdy nie bylo `religionTradeWalutaOverride`) | grep `waluta\|religionTrade\|resolveWaluta` w `rust-port/engine/src` = 0 | NIE-DOTYCZY (brak odpowiednika w porcie) |
| 20 | `@@ -2023` (-10) | usuniecie `walutaMnoznikOverride` (`resolveWalutaMnoznikOverride`) | `turn-economy.ts:1977-1986` (usuniete) | brak (j.w.) | j.w. | NIE-DOTYCZY (brak odpowiednika w porcie) |
| 21 | `@@ -2059` (+2) | ctx: `dochodTrasHandlowych` -> `additionalTax` z `additionalTaxByCity` | `turn-economy.ts:2004-2005` | brak (tick) | - | NASTEPNA-PARTIA (tick) |
| 22 | `@@ -2070` (-1) | usuniecie pola ctx `walutaMnoznikOverride` | `turn-economy.ts:2010` (usuniete) | brak | j.w. | NIE-DOTYCZY (brak odpowiednika w porcie) |
| 23 | `@@ -2074` (+3->+1) | komentarz Mennica (IMPERIUM-WIDE, bez zmiany logiki `maMennica`) | `turn-economy.ts:2014` | brak | - | NIE-DOTYCZY (komentarz) |
| 24 | `@@ -2093` (+1) | `computeCityFoodBalanceV85(..., ownerEra)` w preview | `turn-economy.ts:2031` | funkcja `city_growth::growth_v85::compute_city_food_balance_v85(..., owner_era)` (B1); wywolanie w ticku brak | `tests/p6_repin_b_ration_era.rs`, `p6_repin_b_recompute_era.rs` (B1) | PORTOWANE (funkcja, B1); wywolanie: NASTEPNA-PARTIA (tick) |
| 25 | `@@ -2097` (+2) | `wealthCivKey` + `cityWealthParams = wealthParamsForOwner(...)` | `turn-economy.ts:2036-2037` | `city_growth::repin_b3::wealth_params_for_owner` | `tests/p6_repin_b3_wealth.rs` (wektory `wealth_owner.json`, `wealth_owner_mod.json`) | PORTOWANE (funkcja); wiring w ticku: NASTEPNA-PARTIA |
| 26 | `@@ -2105` (1->1) | `advanceWealth(..., cityWealthParams, ...)` zamiast `wealthParams` | `turn-economy.ts:2045` | brak (`advanceWealth` nie ma portu, Z5) | - | NASTEPNA-PARTIA (tick + wealth) |
| 27 | `@@ -2108` (2->0) | komentarz `pieniadzPoWealth` (wealth dotyczy tylko podatku) | `turn-economy.ts:2046-2047` | - | - | NIE-DOTYCZY (komentarz) |
| 28 | `@@ -2111` (+5) | `pieniadzZTras = routeCashForCity(total, maritime, civKey)` | `turn-economy.ts:2050-2054` | `city_growth::repin_b3::route_cash_for_city` | `tests/p6_repin_b3_route.rs` (wektory `route_cash.json`, `route_cash_mod.json`) | PORTOWANE (funkcja); wiring w ticku: NASTEPNA-PARTIA |
| 29 | `@@ -2138` (+1) | `perCity.push({ ownerEra, ... })` (pole ery w wyniku preview) | `turn-economy.ts:2081` | pole `CityEconomyTick.owner_era` (B1); brak wyniku preview | - | NASTEPNA-PARTIA (tick) |

Zaleznosci przeniesione z hunkow 1-14 (tylko funkcje, wiring w ticku nadal NASTEPNA-PARTIA):

| Hunk | Zmiana webu | Plik:linia weba | Rust | Test / wektor | Status |
|---|---|---|---|---|---|
| 7 | `wealthParamsForOwner` (eksport) | `turn-economy.ts:186-197` | `city_growth::repin_b3::wealth_params_for_owner` | `p6_repin_b3_wealth` | PORTOWANE (funkcja) |
| 8 | `routeCashForCity` (definicja) | `turn-economy.ts:228-231` (nieeksportowana, Z4) | `city_growth::repin_b3::route_cash_for_city` | `p6_repin_b3_route` | PORTOWANE (funkcja) |
| - | `wealth.ts` `wealthParamsWithCapModifier`, `wealthParamsWithMultiplierModifier` (+20 linii) | `gra/src/game/wealth.ts:59-75` | `repin_b3::wealth_params_with_cap_modifier` / `..._multiplier_modifier` | `p6_repin_b3_wealth` (60 + 60 przypadkow, realne i `_mod`) | PORTOWANE |

## 3. Kod i testy (commity)

| Commit | Zawartosc |
|---|---|
| `b240d834` | `routeCashForCity` (`repin_b3::route_cash_for_city`), testy `p6_repin_b3_route.rs`, wektory `route_cash.json`, `route_cash_mod.json`, `civ_matrix_mod.json` |
| `7d25ad56` | `wealthParamsForOwner` + modyfikatory Wealth, testy `p6_repin_b3_wealth.rs`, wektory `wealth_owner.json`, `wealth_owner_mod.json`, dossier i generator |

Generator wektorow: `dyspozycje/autobot/runs/R-RUSTPORT-REPIN-EKONOMIA-B3-Q1/gen-repin-b3-vectors.mjs` (Node v22.22.0, loader `repin-b-loader-*.mjs` jak w B2). Wejscie: `git archive 91dc998a gra/src gra/data` do katalogu tymczasowego poza repo.

Fixture `civ_matrix_mod.json` (r2, zamkniecie luki procesowej): generator `dyspozycje/autobot/runs/R-RUSTPORT-REPIN-EKONOMIA-B3-Q1/gen-civ-matrix-mod.mjs <realna civ-matrix.json> <wyjscie>` nanosi 9 komorek `params` (Grecy, Rzymianie, Inkowie x `eko_pieniadz_port_proc`, `wealth_cap_proc`, `wealth_mnoznik_proc`) i zapisuje bajt-w-bajt plik commitowany. Wariant `_mod` wektorow = ten sam generator `gen-repin-b3-vectors.mjs` uruchomiony na kopii weba, w ktorej `gra/data/civ-matrix.json` zastapiono wynikiem `gen-civ-matrix-mod.mjs`. Odtworzenie lancucha (5 plikow, 0 rozbieznosci): log `R-RUSTPORT-REPIN-EKONOMIA-B3-Q1/verify-civ-mod-r2.log`.

Wynik weryfikacji wektorow z URUCHOMIONEGO weba 91dc998a:

| Wektor | Przypadki | Wynik Rust vs web |
|---|---|---|
| `route_cash.json` (realna macierz) | 5200 | 0 rozbieznosci (bitowo) |
| `route_cash_mod.json` (fixture mod) | 5200 (510 zmienia wynik) | 0 rozbieznosci |
| `wealth_owner.json` (realna) | 312 | 0 rozbieznosci; 0 zmian (parametry = 0) |
| `wealth_owner_mod.json` (fixture mod) | 312 (36 zmienia wynik) | 0 rozbieznosci |
| modyfikatory cap / mnoznik (realne i `_mod`) | 60 + 60 (x2 wektory) | 0 rozbieznosci |

## 4. Mutacje (jedna naraz, plik przywracany z kopii, `cmp` potwierdzony)

| Mutant | Miejsce | Wynik |
|---|---|---|
| R-M1 brak mnoznika cywilizacji (`sea_cash = sea`) | `route_cash_for_city` | ZABITY: 4/4 testow `p6_repin_b3_route` FAILED |
| R-M2 zamiana min/max w klamrze morskiej | `route_cash_for_city` | ZABITY: 4/4 FAILED |
| R-M3 pusty klucz traktowany jak klucz (`Some(key)` bez `!is_empty`) | `route_cash_for_city` | NIE-ZABITY, mutant rownowazny: `civMatrixParam('')` zwraca `defaults.eko_pieniadz_port_proc` = 0, wiec `sea*(1+0)=sea`. Dowod: `civ-matrix.json` defaults = 0 |
| W-M1 brak klamry `max(0, 1+m)` w capie | `wealth_params_with_cap_modifier` | ZABITY: `wealth_modifiers_match_web_vectors` FAILED |
| W-M2 zamiana kluczy `wealth_cap_proc` <-> `wealth_mnoznik_proc` | `wealth_params_for_owner` | ZABITY: `wealth_owner_matches_web_vectors_modified_matrix` FAILED |

## 5. Gate'y

| Bramka | Wynik |
|---|---|
| `cargo fmt --all -- --check` | EXIT=0 (po `cargo fmt --all` na plikach tej partii) |
| `cargo clippy --all-targets -- -D warnings` | EXIT=0 |
| `cargo test --no-fail-fast` | 1396 passed / 0 failed (baseline 1388; +8 nowych: 4 route, 4 wealth) |

Surowe logi: katalog runu `R-RUSTPORT-REPIN-EKONOMIA-B3-Q1/` (`gate-*.log`).

## 6. Co zostaje (NASTEPNA-PARTIA)

- Tick ekonomii miasta (`previewCityEconomy` / `advanceCityEconomy`, hunki 18, 21, 26, 29 oraz wiring hunkow 24, 25, 28) - brak portu w Rust (Z3); wymaga osobnej decyzji zakresu.
- Hunki 1-6, 9-14 i 30-51 (`turn-economy.ts`) wg klasyfikacji dossier B: NASTEPNA-PARTIA lub NIE-DOTYCZY. W tym: hunk z `civManpowerMatrixMults` (web :2741) i blok `mp_regen_proc` / `mp_max_proc` / `mp_koszt_jednostki_proc` (web :2885-2893) - kolejne partie manpower.
- Regeneracja wektorow `edge.json`, `post_central.json`, `params.json`: NIE w tej partii. Hunki manpower (`civManpowerMatrixMults`, `mp_regen_proc` w `advanceCityEconomy`) sa poza partia 18-29; roznice edge/post_central opisane w dossier B (partia 4).
- `meta.pin` i manifesty: bez zmian (REPIN-DELTA §6).

Status tematu: **PASS-WITH-NOTES** dla partii B3 (kod i wektory tej partii zgodne z webem 91dc998a; wiring ticku i reszta hunkow otwarte). DEPLOY/PUSH: NIE WYKONANO.

## 7. Weryfikacja niezalezna (runda 1, Operator-pomiary, kontynuacja)

Wykonane w tej samej rundzie 1/5 (bez zwrotu FAIL). Kod nie zmieniony: `git diff` przed i po pomiarach = pusty.

- **Regeneracja wektorow z weba 91dc998a (bajt-po-bajcie).** Generator z runu uruchomiony na swiezym `git archive 91dc998a gra/src gra/data` poza repo: `route_cash.json` i `wealth_owner.json` zgodne bitowo z commitowanymi (cmp = 0). Wynik: `route=5200 wealthOwner=312 capMod=60 mulMod=60`, EXIT=0. Log: `R-RUSTPORT-REPIN-EKONOMIA-B3-Q1/verify-vectors-r2.log`.
- **Wektory `_mod`.** Generator nie zawiera trybu `_mod`; odtworzono go, podmieniajac w kopii weba `gra/data/civ-matrix.json` na `tests/p6_repin_b3_vectors/civ_matrix_mod.json`. Wynik: `route_cash_mod.json` i `wealth_owner_mod.json` zgodne bitowo (cmp = 0). Roznica semantyczna `civ_matrix_mod.json` vs realna macierz: dokladnie 9 komorek `params` (3 wiersze: Grecy, Rzymianie, Inkowie; 3 klucze): `eko_pieniadz_port_proc` -> 0.4 (Grecy 0.15->0.4, Rzymianie 0->0.4, Inkowie 0->0.4), `wealth_cap_proc` -> 0.2 i `wealth_mnoznik_proc` -> -0.3 (wszystkie trzy cywilizacje, 0->wartosc). (Poprawka r2: wczesniej bledne "3 komorki" i "(Grecy, Inkowie)".) Pozostale klucze top-level bez zmian.
- **Zgodnosc logiki z webem (odczyt zrodla 91dc998a).** `wealth.ts:59-75`: cap `Number.isFinite(m) ? Math.max(0, 1+m) : 1`, mnoznik `Number.isFinite(m) ? 1+m : 1` - zgodne z `wealth_params_with_cap_modifier` / `..._multiplier_modifier`. `turn-economy.ts:186-197` (`wealthParamsForOwner`: falsy key => baza, kolejnosc cap potem mnoznik) i `turn-economy.ts:228-231` (`routeCashForCity`: `Math.min(total, Math.max(0, maritime))`, `civKey` falsy => bez mnoznika) - zgodne z portem.
- **Mutacje (weryfikator, jedna naraz, plik przywracany, `git diff` pusty po restore):**
  - R-M1 (brak mnoznika cywilizacji w `route_cash_for_city`): ZABITY, 4/4 FAILED (`mutant-R-M1-route-r2.log`).
  - W-M1 (brak klamry `max(0, 1+m)` w capie): ZABITY, `wealth_modifiers_match_web_vectors` FAILED, 3 pozostale testy ok (`mutant-W-M1-cap-clamp-r2.log`).
- **Bramki (surowe logi z EXIT):** `cargo fmt --all -- --check` EXIT=0; `cargo clippy --all-targets -- -D warnings` EXIT=0; `cargo test --no-fail-fast` EXIT=0, 1396 passed / 0 failed (baseline 1388). Logi: `gate-fmt-r2.log`, `gate-clippy-r2.log`, `gate-test-r2.log`.
- **Stan nieosiagniety w tej partii (bez zmian wzgledem sekcji 2 i 6):** wiring w ticku (hunki 24, 25, 28 w `advanceCityEconomy`) i hunki 18, 21, 26, 29 - NASTEPNA-PARTIA (tick). Brak tiku ekonomii w Rust (Z3).
- **Luka procesowa (zamknieta w r2):** wczesniej `civ_matrix_mod.json` powstal poza generatorem. Teraz powstaje skryptem `gen-civ-matrix-mod.mjs` (sekcja 3); wynik jest bajt-w-bajt identyczny z commitowanym plikiem, a caly lancuch (fixture -> kopia weba -> 4 wektory) odtworzony w `verify-civ-mod-r2.log`.

Status partii B3 bez zmian: **PASS-WITH-NOTES** (kod i wektory zgodne z webem 91dc998a). DEPLOY/PUSH: NIE WYKONANO.

## 8. Odpowiedzi na zarzuty i notatki weryfikatora (runda 1, r2)

Werdykt weryfikatora: PASS-WITH-NOTES, zero zarzutow blokujacych. Kazda nota ma odpowiedz PRZYJMUJE (poprawka + dowod) albo ODRZUCAM (uzasadnienie).

- **Nota 1 - kosmetyka dossier (pusta komorka SHA w sekcji 3, naglowek "Runda"): PRZYJMUJE.** Wiersz tabeli ma `7d25ad56` (commit `REPIN B3b`, `git show --stat 7d25ad56`); naglowek opisuje runde 1/5 z weryfikacja r2.
- **Nota 2 - luka procesowa `civ_matrix_mod.json` (brak skryptu): PRZYJMUJE.** Dodano `gen-civ-matrix-mod.mjs` (realna macierz -> 9 komorek `params`); wynik bajt-w-bajt identyczny z commitowanym plikiem. Caly lancuch (fixture -> kopia weba -> wektory realne i `_mod`) odtworzony: 5 plikow, 0 rozbieznosci, log `R-RUSTPORT-REPIN-EKONOMIA-B3-Q1/verify-civ-mod-r2.log`. Korekta bledu w tym dossier: zmiana to 9 komorek (3 wiersze x 3 klucze), a `wealth_cap_proc`/`wealth_mnoznik_proc` dotycza wszystkich trzech cywilizacji, nie dwoch.
- **Nota 3 - realna macierz daje 0 zmian w `wealth_owner.json`, pokrycie niezerowych modyfikatorow tylko przez `_mod`: ODRZUCAM jako defekt.** To swiadome zalozenie Z7 (sekcja 1). Weryfikator sam stwierdza, ze kod liczy oba warianty bez zmian. Wektory realne sa zgodne z webem (cmp = 0). Brak zmian w kodzie.
- **Nota 4 - brak wiringu w ticku ekonomii (hunki 18, 21, 24-26, 28, 29): ODRZUCAM jako zarzut tej partii.** Zakres partii wg dispatchu: "Wiring w ticku ekonomii nie jest w zakresie tej partii (brak tiku w Rust)". Hunki sa w NASTEPNA-PARTIA (sekcja 6, Z3). Decyzja o zakresie tiku nalezy do orkiestratora. Brak zmian.
- **Nota 5 - hunki 7 i 8 poza numeracja 18-29: ODRZUCAM jako defekt.** Przeniesienie jest udokumentowane w Z2 (zaleznosci `routeCashForCity` i `wealthParamsForOwner` wolane przez hunki 25 i 28). Weryfikator potwierdza zgodnosc logiki z webem. Brak zmian.
