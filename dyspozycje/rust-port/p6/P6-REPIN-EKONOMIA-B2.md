# P6-REPIN-EKONOMIA-B2 - partia 2a: pierwsze 12 hunkow `production.ts` (pin webu 91dc998a)

**Temat:** `R-RUSTPORT-REPIN-EKONOMIA-B2-Q1` · **Runda:** 2/5 (Operator-obrona po FAIL rundy 1) · **Pin portu:** `edb8fb56` (bez zmiany pinu w manifestach) · **Cel webu:** `91dc998a5f1b51ad29e0f4785edfd45655445c53`
**Baza:** `6f14cfa9` (commit Operatora rundy 1, `abe5b053` potomek `9f48ae57`); poprawka rundy 2 na `4c807fc4`.

## 1. Zakres partii (ZALOZENIE)

Lista wejsciowa: `git diff -U0 edb8fb56 91dc998a -- gra/src/game/production.ts` = **44 hunki** (44 naglowki `@@`; poprzednia wersja dossier podawala 31 - blad faktyczny, poprawiony). Ta runda obejmuje hunki **1-12** w kolejnosci pliku (dispatch: „pierwsze 12 hunkow”). Numeracja jak w tabeli §2; numery linii weba = strona po zmianie (`91dc998a`).

Zaleznosc ZALOZENIE: hunki **13 i 14** (`-571,4 +633,5` i `-577 +640,17`) to cialo `civRecruitmentDiscount` (13) oraz `civMatrixCostDiscount` + `applyCostDiscount` (14), czyli funkcje, ktorych zmiany zawieraja hunki 9, 11-12. Port funkcji bez ciala nie jest zachowaniowo rownowazny, wiec obejmuje je ta runda (poza liczba 12, jawnie). Hunki 15-44 = kolejne partie (B3+), `turn-economy.ts` poza zakresem.

## 2. Tabela: zmiana -> web:linia -> Rust:linia -> test/wektor -> status

Rust:linia = `rust-port/engine/src/domain/building_costs.rs` (modul `repin_b2`, linie 1591+) lub `production_units.rs`.

| # | Hunk diff (edb8->91dc) | Zmiana webu | Web:linia | Rust:linia | Test / wektor | Status |
|---|---|---|---|---|---|---|
| 1 | `-65 +65` | import: `buildingCostAfterCivDiscount` -> `civMatrixParam, loadCivMatrix` | production.ts:65 | - | - | NIE-DOTYCZY (import; usuniecie uzycia `buildingCostAfterCivDiscount` w hunku 7) |
| 2 | `-128 +129,2` | pole `ProductionItem.isGeneral?: boolean` | production.ts:129-130 | - | - | NASTEPNA-PARTIA (B3). Dowod: `grep isGeneral` w `production.ts` = tylko deklaracja (l.130); odczyty to pola jednostek (`ai.ts:4253`, `armyMerge.ts:952`, `generals.ts:48`), nie `ProductionItem`. Rust: `isGeneral` tylko w `ai_general_war_campaign.rs` (`GeneralRef`), brak `ProductionItem` w tej partii |
| 3 | `-204 +207,20` | `newestAvailableSameTypeUnit` + `epochNumber`/`EPOCH_BY_NAME` | production.ts:190-226 | `production_units.rs` `epoch_number` (l.25), `newest_available_same_type_unit` (l.39) | `newest_same_type_unit_matches_web_vectors` (`unit_newest.json`: 88 przypadkow, 11 bieżacych x 8 zbiorow kandydatow, 14 jednostek), `epoch_number_matches_web_vectors`, `newest_same_type_unit_trims_current_typ_like_web`, `newest_same_type_unit_trims_unicode_whitespace_like_js` (NBSP/BOM), testy brzegowe | PORTOWANE (mutanty M3-M6 z rundy 1 zabite; M4 w rundzie 1) |
| 4 | `-397 +420` | `unitProductionItem(...)`: argument `u.Jednostka` jako `unitTypeName` | production.ts:400-425 (`unitMoneyCost(..., u.Jednostka)` l.414-421) | parametr `unit_type_name` w `unit_money_cost_web` (l.1717) | `unit_money_cost_matches_web_vectors` (`unit_money_cost.json`: 21464 przypadkow), mutant M16 (typ jednostki ignorowany) ZABITY | PORTOWANE (przez parametr; jedyny odczyt `unitTypeName` to `civRecruitmentDiscount`, hunk 12). Konstruktor `unitProductionItem` nie ma odpowiednika Rust w tej partii (ZALOZENIE: B3) |
| 5 | `-424 +448,2` | `AvailabilityContext.civKey?: string` | production.ts:448-449 | - | - | NASTEPNA-PARTIA (B3, razem z hunkiem 15 `availabilityCivNation`). Dowod: `ctx.civKey` czytany tylko w `production.ts:739` (`availabilityCivNation`, poza tym zakresem) |
| 6 | `-462 +488,16` | `AvailabilityContext.showStockGatedUnits` / `showResourceGatedBuildings` (flagi widoku, domyslnie `false`) | production.ts:488-503 | - | - | NASTEPNA-PARTIA (B3). Sama deklaracja nie zmienia zachowania; odczyty w hunkach 17-21 (`production.ts` ~983, ~1044-1063 nowe numery) |
| 7 | `-521 +562,2` | `buildingWorkCost`: rabat z markera `prod_koszt_budynku_proc` zamiast `buildingCostAfterCivDiscount` | production.ts:555-571 | `repin_b2::building_work_cost_web` (l.1786), `civ_matrix_cost_discount` (l.1631), `apply_cost_discount` (l.1777), `building_pace_truthy` | `building_work_cost_matches_web_vectors` (`building_work_cost.json`: 14580 przypadkow: 17 zbiorow markerow x 9 baz x 10 tempo x 3 wlasciciele x 3 trudnosci + siatka `brak`; NaN/Infinity, pace `0`/`NaN`/`''`, marker NaN/Infinity/string jako pierwszy, duplikaty), `matrix_discount_floor_and_minimum_one`, `pace_zero_nan_and_empty_key_are_falsy_like_web`, `civ_matrix_cost_discount_uses_first_marker_only`, `building_work_cost_nan_and_infinity_propagate_like_web` | PORTOWANE-NIEPODPIETE (ZALOZENIE, decyzja rundy 2): funkcja przeniesiona, zywa sciezka `building_work_cost` (l.222 `building_costs.rs`) NIE zmieniona. Podpiecie zmienia zachowanie publicznego eksportu `building_work_cost` (`lib.rs`; w `src/` brak wolajacych poza definicja) przed przesunieciem pinu; wektory `p6_*` nie byly regenerowane i NIE_ZMIERZONO, czy by padly. Podpiecie = krok przesuniecia pinu (REPIN-DELTA §5). Mutanty M1, M2, M7, M8 (runda 1) i M13 (pierwszy marker), M14 (pace `0` falsy) ZABITE |
| 8 | `-540 +583` | `unitMoneyCost`: parametr `unitTypeName?` | production.ts:577-584 | `unit_money_cost_web` (l.1717), parametr `unit_type_name` | `unit_money_cost_matches_web_vectors` (wektor: 8 nazw typu z NBSP/BOM/`İmpi`/`IMPI`/pusta), mutanty M11 (regula Impi wylaczona) i M15 (`trim` zamiast JS `trim`) ZABITE | PORTOWANE-NIEPODPIETE (jak hunk 7: brak wolajacych w zywym silniku) |
| 9 | `-544 +587,2` | `unitMoneyCost`: rabat `prod_koszt_jednostki_proc` dodany do `recDisc` | production.ts:585-594 | `unit_money_cost_web` (`civ_matrix_cost_discount(markers, PARAM_KOSZT_JEDNOSTKI)`) | `unit_money_cost_matches_web_vectors` (zbiory `jedn01`, `jednNan`, `jednFirstNanSecondOk`, `jednInf`, `jednStr`, `jednNeg`, `recImpiPlusJedn`, `recBig`), mutant M9 (rabat matrycy pominiety) ZABITY | PORTOWANE-NIEPODPIETE |
| 10 | `-564 +608,18` | `civProductionCostBonusyForCivKey` (markery F-04) | production.ts:608-621 | `civ_production_cost_markers` (l.1675) | `civ_production_cost_markers_match_web_vectors` (`civ_cost_markers.json`: 51 kluczy: id/typ/nazwa cywilizacji w wariantach case, klucz pusty, nieznany), mutant M10 (zamiana parametrow markerow) ZABITY. Pola `typ` i `opis` pominiete: nie sa czytane przez `civMatrixCostDiscount` (l.644-652) ani `civRecruitmentDiscount` (l.626-641); dowod: `grep opis` w zakresie 555-660 daje tylko l.603 i 617 | PORTOWANE-NIEPODPIETE |
| 11 | `-566 +628` | `civRecruitmentDiscount(bonusy, unitTypeName?)`: sygnatura | production.ts:626-629 | `civ_recruitment_discount` (l.1644), parametr `unit_type_name` | `civ_recruitment_discount_impi_rule_and_realizuje`, mutant M16 (typ ignorowany) ZABITY | PORTOWANE-NIEPODPIETE |
| 12 | `-568,2 +630,2` | `civRecruitmentDiscount`: tylko `walka_koszt_rekrutacji_proc`; `cel=impi` tylko dla typu Impi; sumowanie | production.ts:630-641 | `civ_recruitment_discount` (l.1644-1670) | `unit_money_cost_matches_web_vectors` (`recImpi01`, `recImpiCapitalCel`, `recSumImpi`, `recStrOnly`, `recNoMatrixParam`), `civ_recruitment_discount_impi_rule_and_realizuje`; mutanty M11 (regula Impi off), M12 (`realizuje` off), M15 (trim) ZABITE | PORTOWANE-NIEPODPIETE |
| 13 | `-571,4 +633,5` (poza ciecia 12, zaleznosc funkcji 12) | cialo `civRecruitmentDiscount`: filtr `matrixParamId` zamiast `opis`, `Number.isFinite`, sumowanie | production.ts:632-638 | `civ_recruitment_discount` (l.1644-1670) | `recNoCelField`, `recWrongRealizuje`, `recNan`, `recNeg`, `recOnly` (wektor) | PORTOWANE-W-FUNKCJI (ZALOZENIE: cialo funkcji z hunku 12 nie da sie oddzielic; wykazane jawnie poza liczba 12) |
| 14 | `-577 +640,17` (poza ciecia 12) | `civMatrixCostDiscount` (pierwszy marker, skonczona wartosc) + `applyCostDiscount` | production.ts:644-657 | `civ_matrix_cost_discount` (l.1631), `apply_cost_discount` (l.1777) | `civ_matrix_cost_discount_uses_first_marker_only`, wektor zbiory `nanFirst`, `infFirst`, `strFirst`, `dupFirst`, `jednostkiThenBudynku`, `jednFirstNanSecondOk`; mutant M13 (pierwszy skonczony zamiast pierwszego) ZABITY | PORTOWANE (semantyka `find` z testu-pomocnika przeniesiona do kodu Rust; wczesniej w tescie) |

Podsumowanie 12 hunkow (+ zaleznosci 13-14): PORTOWANE 2 (hunk 3, hunk 14), PORTOWANE-W-FUNKCJI 1 (hunk 13), PORTOWANE-NIEPODPIETE 5 (hunki 7-12), NIE-DOTYCZY 1 (hunk 1), NASTEPNA-PARTIA 3 (hunki 2, 5, 6).

Zmiana wzgledem rundy 1 (odpowiedz na zarzuty Obrony): hunki 8-12 zaportowane (poprzednio NASTEPNA-PARTIA); hunk 4 przeniesiony z „kontekst NIE_ZMIERZONO” na dowod z kodu; hunki 2, 5, 6 ocenione dowodem z kodu (poprzednio NIE-DOTYCZY/NASTEPNA bez dowodu); hunk 7 (i 8-12) - status niepodpiety z uzasadnieniem zamiast etykiety „PORTOWANE-FUNKCJA”.

## 3. Zalozenia przy portowaniu (ZALOZENIE)

* **Markery (CostMarker):** Rust przyjmuje liste markerow tak jak web `civBonusy`. Rabat z markera liczy kod Rust: `civ_matrix_cost_discount` = PIERWSZY marker o `matrixParamId`; gdy jego `wartosc` nie jest skonczona liczba, wynik to `None` i kolejny marker NIE jest szukany (jak web `find` + `typeof`/`isFinite`). Wczesniej ta semantyka siedziala w tescie-pomocniku; usunieta.
* **Wartosc markera:** `MarkerValue::Number(f64)` (takze NaN/Infinity) albo `NotNumber` (napis/tablica). Wektory: `{"js":"NaN"}` dla liczb niefinite; napis zostaje napisem.
* **Tempo (pace):** web `pace ?` i `pace ? ... : ...` traktuje falsy jako brak tempa. Rust mapuje to sam (`building_pace_truthy`, `unit_pace_truthy`): `Key("")`, `Multiplier(0)` (takze `-0`), `Multiplier(NaN)` = brak tempa. Poprzednio obowiazek wolajacego (ZALOZENIE usuniete; test `pace_zero_nan_and_empty_key_are_falsy_like_web` + wektor `{"t":"num","v":0}`).
* **Klucz tempa nieznany** (np. `nieznany`): web daje `undefined` w mnozeniu -> `NaN`; Rust (`apply_unit_cost_pace`, `building_cost_pace_multiplier`) takze `NaN`. Objete wektorem.
* **Rabat `prod_koszt_jednostki_proc`:** dodawany do `recDisc` bez clampu (web `civRecruitmentDiscount(...) + (matrixDiscount ?? 0)`); ujemny rabat matrycy przy zerowym `recDisc` nie wchodzi w galaz `recDisc > 0`.
* **Porownania tekstowe:** `cel`, `realizuje`, `matrixParamId`, nazwa `Impi` - dokladne; typ jednostki: `js_trim` + `toLowerCase` (web `unitTypeName?.trim().toLowerCase()`). Wektory zawieraja `İmpi` (lowercase daje `i̇mpi`, nie `impi`) i NBSP/BOM.
* **Brak `opis` w logice kosztu:** web po zmianie nie czyta `opis` w `civRecruitmentDiscount` ani `civMatrixCostDiscount`; wektor `opisOnly` potwierdza brak wplywu.
* **Humanowie:** `humanOwnerIds` = domyslne `[0]` (jak w webie dla `buildingWorkCost` / `unitMoneyCost` bez podanego argumentu).
* **Porownanie bitowe:** liczby skonczone bitowo, z wyjatkiem zera (JSON nie niesie `-0`), NaN == NaN.
* **Epoki (hunk 3):** klucze dokladne jak `EPOCH_BY_NAME` (ASCII i z diakrytykami); brak / nieznana = 1.
* **Commit:** odchylenie od reguly „commit po partii ≤4 hunki”: pliki (`building_costs.rs`, testy, wektory) sa wspolne dla hunkow 7-14, wiec jeden commit rundy (ZALOZENIE; rozbicie wymagaloby sztucznego podzialu plikow).

## 4. Wektory (generator z URUCHOMIONEGO weba 91dc998a)

Generator: `dyspozycje/autobot/runs/R-RUSTPORT-REPIN-EKONOMIA-B2-Q1/gen-repin-b2-vectors.mjs` (uruchomiony przez `repin-b-loader-register.mjs` na `git archive 91dc998a gra/src gra/data` w katalogu tymczasowym poza repo; Node v22.22.0).

| Plik | Przypadki | Zakres |
|---|---|---|
| `building_work_cost.json` | 14580 | `buildingWorkCost`: 17 zbiorow markerow x 9 baz (0, 1, 2.5, 10, 100, 999.9, -3, NaN, Infinity) x 10 tempo (brak, 4 klucze + `''` + `nieznany`, `0`, `NaN`, `1.5`, `0.5`) x 3 wlasciciele x 3 trudnosci (zbior `brak` wystepuje dwa razy: osobna petla bazowa) |
| `unit_money_cost.json` | 21464 | `unitMoneyCost`: 23 zbiory markerow (w tym `brak`, `pusta`) x 8 nazw typu x tempa x bazy x wlasciciele x trudnosci (pelna siatka dla nazwy `Impi`, przekroj dla pozostalych) |
| `civ_cost_markers.json` | 51 | `civProductionCostBonusyForCivKey` dla kluczy z `civ-matrix.json` (ikonaId, typCywilizacji, Cywilizacja, wielkosc liter) + pusty / nieznany |
| `unit_newest.json` | 88 | `newestAvailableSameTypeUnit` (11 bieżacych x 8 zbiorow) + `epochNumber` (10 wartosci) |

Rozmiary: 2.1 MB, 3.7 MB, 16 KB, 12 KB (limit 10 MB na plik).

Istniejace wektory `p6_*` NIE zostaly regenerowane (zmiany partii sa addytywne). NIE_ZMIERZONO: czy ktorys istniejacy wektor `p6_*` zmienilby sie po pelnej regeneracji z 91dc998a (poza znanym driftem `manpower`, dossier B-§3, partia 4). Rust-owa kopia `rust-port/engine/data/civ-matrix.json` (70801 B) rozni sie formatowaniem od `gra/data/civ-matrix.json` (83010 B); zgodnosc semantyczna potwierdzona wektorem `civ_cost_markers.json` (51 przypadkow, bitowo).

## 5. Mutacje (jedna naraz, plik przywracany przez Edit; wszystkie ZABITE)

| Mutant | Miejsce | Test ktory zabil | Hunk |
|---|---|---|---|
| M1 `GLOBAL_BUILDING_PROD_MULT` 0.25 -> 0.5 | `repin_b2` | `building_work_cost_matches_web_vectors` (runda 1) | 7 |
| M2 `is_player = owner_id != 0` | `cost_multiplier_for_owner` | `difficulty_multiplier_thresholds_exact` + wektor (runda 1) | 7 |
| M3 `epoch < current_epoch` (remis dozwolony) | `newest_available_same_type_unit` | wektor + `newest_same_type_unit_only_strictly_newer_epoch` (runda 1) | 3 |
| M4 `Zelazo` epoka 3 -> 2 | `epoch_number` | `epoch_number_*` (runda 1) | 3 |
| M5 bez `trim` bieżącej `Typ` | `newest_available_same_type_unit` | `newest_same_type_unit_trims_current_typ_like_web` (runda 1) | 3 |
| M6 bez `trim` `Typ` kandydata | `newest_available_same_type_unit` | wektor `newest_same_type_unit_matches_web_vectors` (runda 1) | 3 |
| M7 `floor` -> `round` w rabacie | `apply_cost_discount` | `matrix_discount_floor_and_minimum_one` + wektor (runda 1) | 7 |
| M8 rabat markera ignorowany | `building_work_cost_web` | wektor (runda 1) | 7 |
| M9 rabat `prod_koszt_jednostki_proc` pominiety w `recDisc` | `unit_money_cost_web` | `unit_money_cost_matches_web_vectors` | 9 |
| M10 parametry markerow zamienione (budynki <-> jednostki) | `civ_production_cost_markers` | `civ_production_cost_markers_match_web_vectors` | 10 |
| M11 regula `cel=impi` wylaczona | `civ_recruitment_discount` | `civ_recruitment_discount_impi_rule_and_realizuje` + wektor | 11-12 |
| M12 filtr `realizuje='ekonomia'` wylaczony | `civ_recruitment_discount` | `civ_recruitment_discount_impi_rule_and_realizuje` + wektor | 12-13 |
| M13 pierwszy SKONCZONY marker zamiast pierwszego | `civ_matrix_cost_discount` | `civ_matrix_cost_discount_uses_first_marker_only` + wektor | 14 |
| M14 `Multiplier(0)` traktowane jak tempo (bez `m == 0.0`) | `building_pace_truthy` | `pace_zero_nan_and_empty_key_are_falsy_like_web` + wektor | 7 |
| M15 `str::trim` zamiast JS `trim` w typie | `civ_recruitment_discount` | `unit_money_cost_matches_web_vectors` (NBSP/BOM) | 12 |
| M16 `unit_type_name` ignorowany | `unit_money_cost_web` | `unit_money_cost_matches_web_vectors` | 4, 8, 11 |

## 6. Gate'y (runda 2, stan koncowy)

| Bramka | Wynik | Log |
|---|---|---|
| `cargo fmt --all -- --check` | EXIT=0 | `gate-fmt-obrona-r1.log` |
| `cargo clippy --all-targets -- -D warnings` | EXIT=0 (po poprawie 2x `redundant_guards`) | `gate-clippy-obrona-r1.log` |
| `cargo test --no-fail-fast` | 1348 passed / 0 failed, EXIT=0 (1342 + 6 nowych testow) | `gate-test-obrona-r1.log` |
| `git diff --check` | czysty | - |

Build: `CARGO_INCREMENTAL=0 CARGO_TARGET_DIR=/home/user/cargo-target-shared/wf_cabd5916-6d2-4 CARGO_PROFILE_DEV_DEBUG=0`. Logi gate'ow zawieraja surowe wyjscie z `EXIT=`.

## 7. Pozostale hunki (B3+) i otwarte punkty

* B3: hunki 2, 5, 6, 15-44 (w tym 15 `availabilityCivNation`, odczyty flag widoku 17-21), podpiecie `building_work_cost_web` i `unit_money_cost_web` w zywej sciezce (razem z przesunieciem pinu, REPIN-DELTA §5), konstruktor `unitProductionItem` po stronie Rust.
* `turn-economy.ts` (36 hunkow) poza zakresem.
* Pin nie przesuniety (`meta.pin` i manifesty bez zmian); `Cargo.lock` niesledzony (nie commitowany).
* Komentarz w `repin-b-loader-hooks.mjs` poprawiony na `91dc998a` (byl `edb8fb56`).

DEPLOY/PUSH: NIE WYKONANO
