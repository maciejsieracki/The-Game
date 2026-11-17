# R-RUSTPORT-P4-1F2-TERRITORY-RANGES-R1 — Final Control r1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1F2-TERRITORY-RANGES-R1
GOAL: Dodać `TerritoryRangesDto` w adapterze nakładek, zgodnie z webem (pin `07d2fbd72`).
ZMIANY/COMMIT: oceniany kod to `d3fda2f1f` (obrona), wcześniej `51e58037d` (Evaluator) i `0f683d9cc` (Operator). Raport FC jest commitem na gałęzi `rust-port-wip/p4-1f2-territory-ranges-r1-fc`, której rodzicem jest `d3fda2f1f`.
TESTY: niżej. Wszystkie bramki zwróciły EXIT 0 i wszystkie mutacje dały FAIL.
BLOKADY: brak blokad technicznych. Uwagi dla orkiestratora są niżej.
RUNDY: 1/5
NASTĘPNY KROK: integracja przez orkiestratora (FF lub merge na `rust-port/parity-v2`) i wpisy w `REJESTR-RUST.md`.
DEPLOY/PUSH: NIE WYKONANO

## Ancestry
- Baza z dispatchu to `82db9b370`, równa `origin/rust-port/parity-v2` w chwili kontroli.
- `git merge-base --is-ancestor 82db9b370 d3fda2f1f` daje OK. Łańcuch to `82db9b370` → `0f683d9cc` → `51e58037d` → `d3fda2f1f` → commit FC.

## Allowlista (`git diff --stat 82db9b370 d3fda2f1f`)
Zmieniło się 9 plików, +1350 −1:
- `rust-port/view-model/src/lib.rs`, `rust-port/view-model/src/territory_ranges_view.rs`: OK, `view-model/src/`.
- `rust-port/renderer/src/view/overlays.rs`: OK.
- `rust-port/renderer/tests/territory_ranges_f2.rs`: OK.
- `rust-port/renderer/tests/territory_ranges_f2_gen.mjs`: OK, to generator `.mjs`.
- `rust-port/renderer/tests/territory_ranges_f2_vectors/vectors.json`: nie mieści się w literze allowlisty, ale to wynik generatora z allowlisty (zarzut 4, ODDAL).
- `dyspozycje/autobot/runs/R-RUSTPORT-P4-1F2-TERRITORY-RANGES-R1/*`: OK.
- Bez `Cargo.lock`, `gra/`, `engine/` i `origin/main`.

## Bramki (FC sprawdził samodzielnie na `d3fda2f1f`)
- Środowisko: `CARGO_INCREMENTAL=0`, `CARGO_PROFILE_DEV_DEBUG=0`, `CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie (usunięty po bramkach). Przed pełną bramką było 13 GB wolnego miejsca i nie działał żaden inny cargo.
- `cargo fmt --check`: EXIT 0 dla view-model i dla renderer.
- `cargo clippy --all-targets -- -D warnings`: EXIT 0 dla view-model i dla renderer.
- `cargo test --test territory_ranges_f2` (renderer): EXIT 0, 8 passed i 0 failed.
- `cargo test --all-targets --no-fail-fast` dla view-model: EXIT 0, 13 binarek, 109 passed i 0 failed.
- `cargo test --all-targets --no-fail-fast` dla renderer: EXIT 0, 79 binarek, 680 passed i 0 failed. Ta pełna bramka obejmuje już komentarz dodany w obronie.
- `node rust-port/renderer/tests/territory_ranges_f2_gen.mjs --check`: EXIT 0 („vectors.json matches the pin”).

## Mutacje (FC, każda na kodzie produkcyjnym view-model, przywracane z kopii)
| Mutant | Wynik |
|---|---|
| M1 `population.floor()` → `round()` (zarzut 1) | FAIL 2/8 |
| M2 `o.seq < b.seq` → `<=` (zarzut 2) | FAIL 2/8 |
| M3 każdy bok jest granicą, sąsiad ignorowany (dispatch 4a) | FAIL 4/8 |
| M4 brak filtra mgły ME() (dispatch 4b) | FAIL 2/8 |
| M5 `dist > radius` → `>=` | FAIL 2/8 |

Po mutacjach plik jest identyczny z oryginałem (`diff -q`).

## Zgodność z pinem (odczyt własny `07d2fbd72`)
- `territoryOwnerAt` (`map/territory.ts:122-160`): miasto wygrywa przed fortem, remis odległości rozstrzyga pierwszy węzeł (`<`), spór fortów porównuje `order` tylko wtedy, gdy oba węzły go mają, w przeciwnym razie decyduje odległość. Port jest 1:1.
- `cityRangeForPopulation` (`game/okolica.ts:46-50`): `floor`, `<=0 → 0`, `min(max(MIN,pop),CAP)`. Port jest 1:1.
- `collectTerritoryHexKeysByOwner` (`map/range-hexes.ts:28-53`) z filtrem `main.ts:15596-15601` (`isMe` → `!fogOn` → visible ∪ explored): kolejność wstawiania jest zachowana, port 1:1.

## Orzeczenia zarzutów Evaluatora
1. Brak wektora dla `Math.floor` populacji: **ODDAL**. Obrona dodała scenariusz `pop_fraction_floor`, a FC potwierdził, że M1 daje FAIL.
2. Remis `seq` przy równym `turn`: **ODDAL**. Obrona dodała `fort_order_seq_tie`, a FC potwierdził, że M2 daje FAIL. Mutant `turn <` → `<=` jest równoważny, bo ta gałąź wykonuje się tylko przy `turn !=`.
3. Brak wołającego produkcyjnego i niespełnione „z PlayableState”: **ODDAL** jako wada tej rundy. Allowlista wyklucza `engine/`, a view-model zależy tylko od `serde` (D-DTO-1), więc wpięcie jest niewykonalne w zakresie tematu. Uwaga dla orkiestratora: wpisać w REJESTR-RUST jawną zależność wpięcia od DTO-BRIDGE (#364) lub FOG-WIRE i nie oznaczać tematu jako „wołany w produkcji”.
4. `vectors.json` poza literą allowlisty: **ODDAL**. To wynik generatora z allowlisty, `--check` daje EXIT 0, a bez tego pliku punkt 3 dispatchu jest niewykonalny. Ma precedens G5.
5. Trzecia kopia reguł terytorium: **ODDAL** w tej rundzie, bo `engine/` jest poza allowlistą. Kopii z engine nie da się użyć wprost, bo `BTreeMap` sortuje, a web zachowuje kolejność wstawiania. Komentarz modułu wymienia kopie i wymóg testu równoważności. Uwaga dla orkiestratora: wpisać D-F2-4 (źródło prawdy dla nakładki to view-model sprawdzany wektorami pinu, dla reguł gry to engine) i test równoważności jako kryterium tematu wpięcia.
6. Trailer z nazwą modelu: **ODDAL** jako wada kodu, bo dotyczy tylko metadanych. Zadanie #289 rozstrzygnięto „wg reguły harnessu”, a reguła atrybucji tej sesji wymaga trailera z nazwą modelu. Commit FC też ma ten trailer, zgodnie z tą samą regułą. Jeśli orkiestrator stosuje literalnie kryterium dispatchu, może zrobić squash z własnym trailerem przy integracji. Kod się przez to nie zmienia.

Wynik: 0 × NAPRAW, 6 × ODDAL, więc werdykt to PASS-WITH-NOTES.

## Uwagi dla orkiestratora (do rejestru, bez decyzji gameplay)
- D-F2-1..D-F2-3 (Operator) i D-F2-4 (Obrona): wpisać do `REJESTR-RUST.md`.
- Wpięcie `territory_ranges_dto` z `PlayableState` (engine) wraz z testem równoważności z `engine::domain::territory::territory_owner_at`: temat DTO-BRIDGE (#364) lub FOG-WIRE.
- Trailer #289: rozstrzygnąć przy integracji.
