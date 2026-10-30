# P6-REPIN-EKONOMIA-B2 - partia 2a: pierwsze 12 hunkow `production.ts` (pin webu 91dc998a)

**Temat:** `R-RUSTPORT-REPIN-EKONOMIA-B2-Q1` · **Runda:** 1/5 (Operator-impl) · **Pin portu:** `edb8fb56` (bez zmiany pinu w manifestach) · **Cel webu:** `91dc998a5f1b51ad29e0f4785edfd45655445c53`
**Baza:** `abe5b053` (potomek `9f48ae57`, origin/rust-port/parity-v2).

## 1. Zakres partii (ZALOZENIE)

Lista wejsciowa: `git diff -U0 edb8fb56 91dc998a -- gra/src/game/production.ts` = 31 hunkow w pliku (w tym 4 importy/komentarze). Ta runda obejmuje pierwsze 12 hunkow w kolejnosci pliku (numeracja wg `git diff -U0`; numery linii weba = strona po zmianie, `91dc998a`). Hunki 13+ i `turn-economy.ts` = kolejne partie.

## 2. Tabela: zmiana -> web:linia -> Rust:linia -> test/wektor -> status

| # | Hunk diff (edb8->91dc) | Zmiana webu | Web:linia | Rust:linia | Test / wektor | Status |
|---|---|---|---|---|---|---|
| 1 | `-65 +65` | import (bez zmiany zachowania) | production.ts:65 | - | - | NIE-DOTYCZY (import) |
| 2 | `-128 +129,2` | pole `ProductionItem.isGeneral?: boolean` (Generał przy zakupie) | production.ts:129-130 | - | - | NASTEPNA-PARTIA (B3: pole uzywane w zakupie, brak Rust-owego odpowiednika) |
| 3 | `-204 +207,20` | `newestAvailableSameTypeUnit` + `epochNumber`/`EPOCH_BY_NAME` | production.ts:190-226 | `rust-port/engine/src/domain/production_units.rs` `epoch_number`, `newest_available_same_type_unit` | `tests/p6_repin_b2_production.rs::newest_same_type_unit_matches_web_vectors`, `epoch_number_matches_web_vectors` (wektor `unit_newest.json`: 70 + 10 przypadkow), testy brzegowe (remis, brak Typ, pusty Typ po trim, brak Epoka), `newest_same_type_unit_trims_current_typ_like_web` (DODANY w pomiarach: bieżąca `Typ` z białymi znakami; wynik web = `Y`, zweryfikowane na 91dc998a) | PORTOWANE (mutanty M3, M4, M5, M6 zabite) |
| 4 | `-397 +420` | `unitProductionItem`: dodatkowy argument `u.Jednostka` | production.ts:420 | - | - | NASTEPNA-PARTIA (kontekst wywolania NIE_ZMIERZONO w tej rundzie) |
| 5 | `-424 +448,2` | `AvailabilityContext.civKey?: string` (matrix-only roster) | production.ts:448-449 | - | - | NASTEPNA-PARTIA (B3, razem z `civProductionCostBonusyForCivKey`) |
| 6 | `-462 +488,16` | `AvailabilityContext.showStockGatedUnits` / `showResourceGatedBuildings` (flagi TYLKO widoku, domyslnie `false`; reguly gry bez zmian wg komentarza web) | production.ts:488-503 | - | - | NIE-DOTYCZY (widok UI; domyslne `false` = zachowanie silnika bez zmian; Rust nie ma warstwy widoku) |
| 7 | `-521 +562,2` | `buildingWorkCost`: rabat z markera `prod_koszt_budynku_proc` zamiast `buildingCostAfterCivDiscount` | production.ts:555-571 | `rust-port/engine/src/domain/building_costs.rs` `repin_b2::building_work_cost_web` (+ `apply_cost_discount`, `apply_difficulty_cost_multiplier`, `cost_multiplier_for_owner`) | `tests/p6_repin_b2_production.rs::building_work_cost_matches_web_vectors` (wektor `building_work_cost.json`: 9240 przypadkow: 14 baz x 11 wariantow bonusow x 5 tempo x 4 wlasciciele x 3 trudnosci; NaN/Infinity; rabat 0/0.1/0.25/0.5/0.99/1/ujemny/inny parametr/brak markera), `matrix_discount_floor_and_minimum_one`, `difficulty_multiplier_thresholds_exact`, `building_work_cost_nan_and_infinity_propagate_like_web` | PORTOWANE-FUNKCJA: nowa funkcja, NIE podpieta pod wywolania (`building_work_cost` bez zmian; podpiecie = B3). Mutanty M1 (GLOBAL 0.25->0.5), M2 (odwrocona kontrola wlasciciela), M7 (floor->round w rabacie), M8 (rabat cywilizacyjny ignorowany) zabite |
| 8 | `-540 +583` | `unitMoneyCost`: parametr `unitTypeName?` | production.ts:583 | - | - | NASTEPNA-PARTIA (B3) |
| 9 | `-544 +587,2` | `unitMoneyCost`: rabat z markera `prod_koszt_jednostki_proc` dodany do `recDisc` | production.ts:587-588 | - | - | NASTEPNA-PARTIA (B3) |
| 10 | `-564 +608,18` | `civProductionCostBonusyForCivKey` (nowa funkcja, markery F-04 z `civMatrixParam`) | production.ts:608-621 | - | - | NASTEPNA-PARTIA (B3) |
| 11 | `-566 +628` | `civRecruitmentDiscount(bonusy, unitTypeName?)`: sygnatura | production.ts:626-629 | - | - | NASTEPNA-PARTIA (B3) |
| 12 | `-568 +630,2` | `civRecruitmentDiscount`: tylko `walka_koszt_rekrutacji_proc`, `cel=impi` tylko dla typu Impi, sumowanie | production.ts:631-641 | - | - | NASTEPNA-PARTIA (B3) |

Podsumowanie 12 hunkow: PORTOWANE 1 (hunk 3), PORTOWANE-FUNKCJA 1 (hunk 7), NIE-DOTYCZY 2 (hunki 1, 6), NASTEPNA-PARTIA 8 (hunki 2, 4, 5, 8-12).

## 3. Zalozenia przy portowaniu (ZALOZENIE)

* **Rabat cywilizacyjny (hunk 7):** web czyta marker `matrixParamId === 'prod_koszt_budynku_proc'` (pierwszy, wartosc skonczona). Rust przyjmuje gotowe `Option<f64>`; wolajacy mapuje brak / niefinite na `None`. Stary rabat `buildingCostAfterCivDiscount` (oparty o `bonusy.opis`) nie jest portowany; `civ_bonuses::civ_building_cost_discount` pozostaje dla starych wywolan i do usuniecia/przepiecia w B3.
* **Tempo zerowe (hunk 7):** web `pace ?` traktuje `0` jako brak tempa. Rust przyjmuje `Option<PaceInput>`; wolajacy ma mapowac falsy pace na `None`. Wektory nie zawieraja `pace = 0` (typ `BuildingCostPace` nie zawiera 0).
* **Trudnosc (hunk 7):** `humanOwnerIds` = domyslne `[0]` (jak w webie dla wywolania `buildingWorkCost`).
* **Porownanie bitowe:** liczby skonczone bitowo, z wyjatkiem zera (JSON nie niesie znaku `-0`), NaN == NaN.
* **Epoki (hunk 3):** klucze dokladne jak `EPOCH_BY_NAME` (ASCII i z diakrytykami); brak / nieznana = 1.

## 4. Gate'y (runda 1)

| Bramka | Wynik |
|---|---|
| `cargo fmt --all -- --check` | EXIT=0 (po `cargo fmt --all` na plikach tej partii) |
| `cargo clippy --all-targets -- -D warnings` | EXIT=0 |
| `cargo test --no-fail-fast` | 1341 passed / 0 failed (baseline 1331 + 10 nowych) |
| `cargo test --test p6_repin_b2_production` | 10 passed / 0 failed |

Surowe logi: `dyspozycje/autobot/runs/R-RUSTPORT-REPIN-EKONOMIA-B2-Q1/gate-*-r1.log`.

## 5. Mutacje (jedna naraz, plik przywracany z kopii)

| Mutant | Miejsce | Wynik |
|---|---|---|
| M1 `GLOBAL_BUILDING_PROD_MULT` 0.25 -> 0.5 | `building_costs.rs` `repin_b2` | ZABITY: `building_work_cost_matches_web_vectors` FAILED |
| M2 `is_player = owner_id != 0` | `cost_multiplier_for_owner` | ZABITY: `difficulty_multiplier_thresholds_exact` + wektor FAILED |
| M3 `epoch < current_epoch` (remis dozwolony) | `production_units.rs` `newest_available_same_type_unit` | ZABITY: wektor + `newest_same_type_unit_only_strictly_newer_epoch` FAILED |

## 6. Wektory

* `rust-port/engine/tests/p6_repin_b2_vectors/building_work_cost.json` (~1.06 MB) i `unit_newest.json` (~10 KB): wygenerowane z URUCHOMIONEGO weba 91dc998a (`git archive 91dc998a gra/src gra/data` do katalogu tymczasowego poza repo, Node v22.22.0, loader `repin-b-loader-*.mjs`, generator `gen-repin-b2-vectors.mjs`).
* Istniejace wektory `p6_*` NIE zostaly regenerowane (zmiany partii sa addytywne: nowe funkcje, istniejace sciezki bez zmian). NIE_ZMIERZONO: czy ktorys istniejacy wektor `p6_*` zmieniłby sie po pelnej regeneracji z 91dc998a (poza znanym driftem `manpower` z dossier B-§3, partia 4).

## 7. Pozostale hunki (B3+)

Hunki 2, 4, 5, 8-12 (wyzej) oraz 13-31 w `production.ts`: kolejne partie wg tabeli §2 i dossier `P6-REPIN-EKONOMIA-B.md` §4. `turn-economy.ts` (36 hunkow) poza zakresem tej rundy.

Pin nie przesuniety (`meta.pin` i manifesty bez zmian). DEPLOY/PUSH: NIE WYKONANO

## 8. Weryfikacja pomiarowa (Operator-pomiary, ta sama runda 1/5)

* **Regeneracja wektorow z webu 91dc998a:** `git archive 91dc998a gra/src gra/data` do katalogu tymczasowego poza repo; `gen-repin-b2-vectors.mjs` uruchomiony ponownie. Oba pliki (`building_work_cost.json` 9240 przypadkow, `unit_newest.json`) identyczne bajt w bajt z zacommitowanymi (`cmp`). 0 rozbieznosci.
* **Rozszerzenie testow:** dodany `newest_same_type_unit_trims_current_typ_like_web`. Luka wykryta mutacja: wektory nie pokrywaja przycinania `Typ` po stronie BIEZACEJ jednostki (web `production.ts`, `currentTyp = (current?.Typ ?? '').trim()`). Probe na webie 91dc998a: `X(Typ " Piechota ")` -> kandydat `Y(Typ "Piechota")` daje `Y`; test zamyka luke.
* **Mutanty (jedna naraz, plik przywracany `git checkout --`):**

| Mutant | Miejsce | Wynik |
|---|---|---|
| M4 `Zelazo` epoka 3 -> 2 | `production_units.rs` `epoch_number` | ZABITY: 3 testy FAILED (`epoch_number_*`, `newest_same_type_unit_matches_web_vectors`) |
| M5 bez `trim` bieżącej `Typ` | `production_units.rs` `newest_available_same_type_unit` | ZABITY: nowy test FAILED (luka wykryta analiza wektorow: wektory nie maja bieżącej `Typ` z bialymi znakami) |
| M6 bez `trim` `Typ` kandydata | `production_units.rs` (`unit.typ`) | ZABITY: `newest_same_type_unit_matches_web_vectors` FAILED |
| M7 `floor` -> `round` w rabacie | `building_costs.rs` `repin_b2::apply_cost_discount` | ZABITY: `matrix_discount_floor_and_minimum_one` + wektor FAILED |
| M8 rabat markera ignorowany | `building_costs.rs` `repin_b2::building_work_cost_web` | ZABITY: wektor `building_work_cost_matches_web_vectors` FAILED |

Pliki mutantow przywrocone do wersji z commita (`git status`: tylko testy i dokument).
* **Bramki (stan koncowy):** `cargo fmt --all -- --check` EXIT=0; `cargo clippy --all-targets -- -D warnings` EXIT=0; `cargo test --no-fail-fast` 1342 passed / 0 failed / EXIT=0 (1341 + nowy test). Logi: `gate-*-pomiar-r1.log` w katalogu runu.
* **Uwagi:** (a) pierwsza proba pelnego testu zakonczyla sie EXIT=101 z powodu braku miejsca na dysku (`No space left on device` przy budowie `civ-engine`); usunieto wylacznie wlasny podkatalog `cargo-target-shared/wf_cabd5916-6d2-2`, po czym test przeszedl. Inne katalogi wspoldzielone nie byly ruszane. (b) Komentarz w `repin-b-loader-hooks.mjs` nadal mowi `pin edb8fb56`; generator faktycznie uruchamia `91dc998a` (komentarz do poprawy, bez wplywu na wynik). (c) `Cargo.lock` jest niesledzony (wygenerowany przez cargo) i NIE jest commitowany.
* **Dalej bez zmian:** hunki 2, 4, 5, 8-12 -> B3; `building_work_cost_web` nie podpieta (B3); pin nie przesuniety; DEPLOY/PUSH: NIE WYKONANO..
