# P6.8B — PRODUKCJA: dostępność, rekrutacja, praca (dokument tematu)

**TEMAT:** `R-RUSTPORT-P6-8B-PRODUKCJA-DOSTEPNOSC-REKRUTACJA-Q1`
**Pin webu:** `91dc998a5f1b51ad29e0f4785edfd45655445c53` (`gra/src/game/production.ts`, 682–1252 i 1977–2541)
**Podział:** `dyspozycje/rust-port/p6/P6-8-MIASTA-PODZIAL.md` §9 (8B), §11 (wiersze `8B-P1`, `8B-P2`)
**Run:** `dyspozycje/autobot/runs/R-RUSTPORT-P6-8B-PRODUKCJA-DOSTEPNOSC-REKRUTACJA-Q1/`

## Stan

| Partia | Zakres | Status | Commit |
|---|---|---|---|
| 8B-P1a | helpery: nacja jednostek, zamienniki, kolejka ulepszeń, tokeny jednostek specjalnych, koszt kupna za złoto (web 694–905) | **ZROBIONE (kod + wektory + mutacje), runda 2 Operatora** | kod `7a8c9927b`, pomiary r1 `8bc151ddc`, runda 2 = commit opisany w raporcie |
| 8B-P1b | `availableProduction` (923–1135), `availableReplacementsFor` (1136–1252), `setPaused`, `populationCostOf`, `UNIT_POPULATION_COST`, `manpowerCostOf` (1977–1995) | NIEWYKONANE | — |
| 8B-P1 (poza P1a/P1b) | `unitStockShortfallLabel` (682–693) | NIEWYKONANE (P1b) | — |
| 8B-P2 | rekrutacja, rush, praca/podział, katalog epok, podział wyjścia (2004–2541) | NIEWYKONANE; wymaga zamknięcia B3 (`recruitment.rs`, §4 podziału) | — |

Kryteria końca tematu **nie są spełnione**. Temat pozostaje OTWARTY.

## Partia 8B-P1a — symbole (web 694–905)

Zrobione w `rust-port/engine/src/domain/production_units.rs` (sekcja P6.8B-P1a, na końcu pliku):

| Web | Symbol | Rust | Status |
|---|---|---|---|
| 694 | `CIV_KEY_TO_UNIT_NACJA` | `CIV_KEY_TO_UNIT_NACJA` (tablica 17 par) | ZROBIONE, wektory `civKey` |
| 722 | `unitNacjaForCivKey` | `unit_nacja_for_civ_key` | ZROBIONE (odstępstwo: klucze prototypowe, patrz niżej) |
| 727 | `unitAllowedForCivNation` | `unit_allowed_for_civ_nation` | ZROBIONE, wektory `allowed` |
| 738 | `availabilityCivNation` | `availability_civ_nation` | ZROBIONE (j.w., `availability`) |
| 742 | `isCivSpecialReplacement` | `is_civ_special_replacement` | ZROBIONE, wektory `specialReplacement` |
| 751 | `civHasReplacementFor` | `civ_has_replacement_for` | ZROBIONE, wektory `hasReplacement` |
| 763 | `BUILDING_GOLD_PURCHASE_MULT` | `BUILDING_GOLD_PURCHASE_MULT` | ZROBIONE |
| 765 | `buildingGoldPurchaseCost` | `building_gold_purchase_cost` | ZROBIONE, wektory `goldCost` + testy progów i NaN/±Infinity/-0 |
| 770 | `buildingTypeCommitted` | `building_type_committed` | ZROBIONE, wektory `committed` |
| 783 | `isBuildingSupersededByUpgrade` | `is_building_superseded_by_upgrade` | ZROBIONE, wektory `superseded` |
| 798 | `applyCompletedBuildingIds` | `apply_completed_building_ids` | ZROBIONE, wektory `applyCompleted` |
| 833 | `buildingUnlockFlagFor` | `building_unlock_flag_for` | ZROBIONE, wektory `unlockFlag` |
| 843 | `buildingTypeQueued` | `building_type_queued` | ZROBIONE, wektory `queued` |
| 853 | `isBlankReplacement` | `is_blank_replacement` | ZROBIONE, wektory `blank` |
| 865 | `civSpecialUnitNameTokens` | `civ_special_unit_name_tokens` | ZROBIONE, wektory `tokens` |
| 891 | `unitMatchesSpecialName` | `unit_matches_special_name` | ZROBIONE, wektory `matchName` + test gałęzi |

Wektory: `rust-port/engine/tests/p6_8b_vectors/helpers.json` (generator `gen-p6-8b-helpers-vectors.mjs` w runie; wynik z uruchomionego weba `91dc998a`, Node 22). Test: `rust-port/engine/tests/p6_8b_helpers_vectors.rs` (18 testów).

### Odstępstwa i ustalenia (udokumentowane, przypięte testami)

1. **Klucze prototypowe w `unitNacjaForCivKey` / `availabilityCivNation`.** Web trzyma mapę w zwykłym obiekcie JS, więc `CIV_KEY_TO_UNIT_NACJA['constructor']` i `['__proto__']` zwracają wartość dziedziczoną (funkcja / obiekt), a nie napis. Rust zwraca `None`. Wektory zapisują ten wynik jako `{"$js": "function"|"object"}`; test `prototype_keys_deviation_is_pinned` przypina `None`. Nazwy takie jak `hasOwnProperty` czy `toString` NIE są prototypowe po `toLowerCase()` (web zwraca `undefined`, Rust `None`, zgodnie).
2. **Diakrytyki i `ł`.** Web `stripDiacritics` (NFD + usunięcie U+0300–U+036F + lower) NIE składa `ł`: `Słowianie` ≠ `Slowianie`. Pary testowe dla „tylko diakrytyki” używają znaków złożonych (np. `Sumér` = `Sumer`), a nie `ł`/`l`.
3. **Puste wejścia po strip.** Wektory zawierają nacje/cywilizacje złożone wyłącznie ze znaków diakrytycznych (po strip = pusty napis).

## Partie 8B-P1b i 8B-P2 — do wykonania

- P1b: `availableProduction` (213 LOC), `availableReplacementsFor` (117 LOC), `setPaused`, `populationCostOf`, `UNIT_POPULATION_COST`, `manpowerCostOf`, `unitStockShortfallLabel`. Wektory z weba `91dc998a` przed implementacją.
- P2 (28 symboli, ok. 538 LOC): `enqueueRecruitment`, `dequeueRecruitment`, `AdvanceRecruitmentResult`, `AdvanceRecruitmentGatedResult`, `advanceRecruitmentGated`, `advanceRecruitment`, `rushCost`, `rushProduction`, `cityPracaInteger`, `PodzialPracyMiasta`, `splitPraca`, `pracaImperialPoolGain`, `PracaSplitTick`, `previewPracaPoolBrutto`, `unitCostMode`, `unitPurchaseCost`, `buildableProduction`, `purchasableUnits`, `EPOCH_NUMBER_TO_NAME`, `BuildingCatalogStatus`, `BuildingCatalogEntry`, `eraBuildingCatalog`, `OutputShares`, `OutputSplit`, `DEFAULT_OUTPUT_SHARES`, `splitOutput`, `cityScienceOutput`, `cityMoneyOutput`. Przed P2: zamknięcie B3 (`recruitment.rs`).

## Mutacje (runda 2, plik `mut-p6-8b-helpers-r2.py` w runie)

56 mutantów na gałęziach sterujących `production_units.rs` (sekcja P1a). Wynik: 48 KILLED (test padł), 8 oczekiwanych przeżyć z uzasadnieniem równoważności w skrypcie (M5, E12, E27, E40, E45, E47, E48, E54). Klasa „COMPILE-ERROR” nie jest liczona jako zabicie. Log: `dyspozycje/autobot/runs/R-RUSTPORT-P6-8B-PRODUKCJA-DOSTEPNOSC-REKRUTACJA-Q1/dowody/pomiar-mutacje-r2.txt`.
