STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-ELIMINACJA-Q1
GOAL: (1) zmierzenie na pinie 07d2fbd72, co robi eliminacja wlasciciela; (2) czysta funkcja eliminacji w Rust z jawnymi wejsciami i czyszczeniem akumulatorow mocy przez clear_power_accumulators_for_owner; (3) wektory pinu >= 150 przypadkow wykonane w node; (4) test zgodnosci wstecznej, jesli dodano pola serde.

## 1. Pomiar na pinie (07d2fbd72, gra/src)

- `main.ts:35348` `function eliminateOwner(ownerId)` (zakres 35348-35506). Wczesny `return` dla `ownerId === 0` lub gdy wlasciciel jest w `eliminatedOwners` (linia 35349). Potem `eliminatedOwners.add` (35350).
- Jednostki: `units.filter` / `units.length = 0; units.push(...)` wewnatrz eliminateOwner; helper `disbandOwnerUnits` = `capital-capture.ts:392` (`units.filter(u => u.ownerId !== ownerId)`).
- Miasta: eliminateOwner NIE usuwa miast. Dotyka `cities` tylko przez `oblegajacyOwnerId` / `oblegane` (zerowanie oblezen prowadzonych przez wlasciciela).
- Akumulatory mocy: `battlePowerPtsByOwner.delete` main.ts:35399, `zdobyczePowerByOwner.delete` main.ts:35410.
- Dyplomacja: `diplomacyRelations`, `diplomacyPairMeta`, `diplomacyFactorLog` (kasowanie po kluczu `a_b`, helper `diploPairKeyHasOwner` main.ts:35242); `activeDeals` (filtr po `strony`); rejestry wiarygodnosci (`wiarygodnosc*`); cykle wymuszonych wojen (bronze/stone/iron `ForceWar*`, `forcedWarWavesByPairKey`, `regularWarCapturedByPairKey`).
- Zasoby i pule AI: `aiSkarbiecByOwner`, `aiPracaPoolByOwner`, `aiNaukaPoolByOwner`, `aiBadanaByOwner`, `aiResearchDone`, `aiOwnerCivMap`, `ownerDisplayName`, `capitalCityIdByOwner`, `aiSliderStateByOwner`, `aiSurplusRedirectedOwners`, `ownerEraByOwner`, `ownerStartEraByOwner`, `clusterCapitalOwnerIds`, `typCityCopyOwners`, `foreignTypeOwners`, `simplifiedDiplomacyOwners`.
- Oblezenia: `siegeBesiegerByCity`, `siegeTurnByCity`, `siegeAiStateByKey`.

Liczba linii mutujacych w zakresie 35348-35506 policzona z `grep` (`.delete(`, `.add(`, `.length =`, `.push(`, `.filter(`, `for (const`): ok. 60 wystapien; dokladna lista wyzej.

## 2. Kod Rust

- `rust-port/engine/src/domain/eliminacja.rs` (nowy): `eliminate_owner(state: &mut PlayableState, wyeliminowani: &mut Vec<i64>, owner_id: i64) -> EliminacjaWynik`.
  - `owner_id == 0` lub juz w `wyeliminowani` -> no-op, `pominieta = true`.
  - Inaczej: dopisuje do `wyeliminowani`; usuwa jednostki wlasciciela (`units.retain`); wola `power_clear_eliminated_owner` (istniejacy adapter do `WarTurnState::clear_power_accumulators_for_owner`); usuwa z `state.war.diplomacy.relations` pary, w ktorych wlasciciel jest `first` albo `second`.
  - Ujemne `owner_id` nie maja odpowiednika `PlayerId` (`u64`), wiec nie dopasowuja jednostek ani par (zgodne z webem: brak takich wlascicieli).
- `rust-port/engine/src/domain/mod.rs`: 1 linia `pub mod eliminacja;`.
- Nie wpieto w tury, walke, `turn_war_*`, `combat.rs`, `war_turn_state.rs` ani `playable.rs` (zgodnie z ZAKAZ dispatchu; wolajacy = osobny temat #114).
- `playable.rs` i `war_turn_state.rs` nie zmienione: uzyto istniejacych funkcji.

## 3. Wektory pinu

- `rust-port/engine/tests/p6_eliminacja_gen.mjs`: WYKONUJE tekst `eliminateOwner` (main.ts:35348) oraz `diploPairKeyHasOwner` (main.ts:35242) i `disbandOwnerUnits` (capital-capture.ts:392) w node. Straznik SHA-256 dla `main.ts` (e80f9cb4...) i `capital-capture.ts` (27167659...). Zmienne wolne tworzone jako swieze Map/Set/tablice wg deklaracji w main.ts; funkcje UI jako stuby (`syncUnitsRender`, `refreshFog` zapisuja wywolanie); `hexDistance` i `endMapSiege` RZUCAJA (wektory nie generuja oblezen, wiec nie sa wolane - potwierdzone wynikiem).
- `rust-port/engine/tests/p6_eliminacja_vectors/vectors.json`: 180 przypadkow, 417 krokow (123 kroki z usunieciem jednostek, 151 krokow no-op: wlasciciel 0 lub powtorka). Snapshot po kazdym kroku: id jednostek w kolejnosci, `eliminatedOwners`, `battlePowerPtsByOwner`, `zdobyczePowerByOwner`, klucze par `diplomacyRelations`, plus `pominieta`, liczba usunietych jednostek i par.
- Generator wykryl blad wlasny w pierwszym przebiegu (zapis ids zamiast wlascicieli jednostek w `init`); naprawiony w generatorze, nie w Rust.

## 4. Testy Rust

- `rust-port/engine/tests/p6_eliminacja.rs`: 3 testy: wektory krok po kroku (wszystkie pola snapshotu), no-op dla 0 i powtorki, ujemny wlasciciel.
- Mutacja kontrolna: wylaczenie `power_clear_eliminated_owner` -> test wektorowy pada (potwierdzone, plik przywrocony).

## 5. Bramki (EXIT)

- `cargo fmt --check` (rust-port/engine): PASS (exit 0).
- `cargo clippy --all-targets -- -D warnings`: PASS (exit 0) po poprawce `sort_by_key` w tescie.
- `cargo test --lib`: PASS, 94 passed, 0 failed.
- `cargo test --test p6_eliminacja`: PASS, 3 passed.
- `cargo test --test p6_power_battle_acc`: PASS, 3 passed.
- `cargo test --test p6_power_acc_wiring`: PASS, 11 passed.
- Env: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie sesji (poza repo), usuniety po bramkach.

## 6. Zgodnosc wsteczna (punkt 4 celu)

- NIE_DOTYCZY: nie dodano pol serde do `PlayableState` ani `WarTurnState`. Zbior `eliminatedOwners` jest parametrem wejsciowym, nie polem stanu.

## NIE_ZMIERZONO / BLOKADY

- Zakres porownania wektorow to snapshot: jednostki, `eliminatedOwners`, akumulatory bitwy i zdobyczy, klucze par `diplomacyRelations`. Pozostale struktury z listy w punkcie 1 (pule AI, zasoby, cykle wojen wymuszonych, wiarygodnosc, `activeDeals`, `diplomacyPairMeta`, `diplomacyFactorLog`, oblezenia, `capitalCityIdByOwner`, `cities.oblegajacyOwnerId`) sa wykonywane przez harness, ale NIE porownywane z Rust. Rust ich nie czysci: swiadomy zakres, nie blad.
- Brak wolajacego w produkcji (temat #114: produkcyjna sciezka eliminacji). Funkcja nieuzywana poza testami.
- Brak wektorow dla oblezen (brak `oblegaCityId` w generatorze); `hexDistance`/`endMapSiege` poza zakresem.
- Dane `units.json` i balans: NIE dotykane.

## RUNDY / DECYZJE

- RUNDY: 1/5. Operator HAIKU (bez eskalacji na Sonnet; brak 2 nieudanych rund).
- DECYZJA_WYMAGANA: brak.

NASTĘPNY KROK: Evaluator (Sonnet) - weryfikacja zakresu snapshotu wobec pinu i listy NIE_ZMIERZONO; potem Final Control.
DEPLOY/PUSH: NIE WYKONANO (zakaz dispatchu; galaz lokalna `R-RUSTPORT-P6-ELIMINACJA-Q1-wip/operator-r1`).
SHA kodu: 86f039ebfc2e1eeb05b5f55316c5d8e8117f921f
