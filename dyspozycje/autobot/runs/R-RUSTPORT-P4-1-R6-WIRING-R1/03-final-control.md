# R-RUSTPORT-P4-1-R6-WIRING-R1 — Final Control r1

STATUS: PASS-WITH-NOTES
DOMAIN: INFORMATIONAL (renderer: wpięcie DTO → renderer; gameplay bez zmian)
TEMAT: R-RUSTPORT-P4-1-R6-WIRING-R1
GOAL: `RevoltRenderer::sync` wołany przez adapter miast po `CityRenderer::sync` z tym samym `cities[]` (pin `render/cities.ts:541,551,586,597-599`).

## Przedmiot kontroli
- Baza z dispatchu: `26e3666bd` (= `origin/rust-port/parity-v2`, sprawdzone `git rev-parse`).
- Kontrolowany szczyt: `9700b1fe9` (raport Obrony), kod Obrony `139ad0b87`, kod Operatora `d5a495640`.
- Ancestry: `git merge-base --is-ancestor 26e3666bd 9700b1fe9` → prawda. Liniowo: 26e3666bd → d5a495640 → ec8d76bf3 → 139ad0b87 → 9700b1fe9.

## Allowlista (zweryfikowane samodzielnie)
`git diff --stat 26e3666bd 9700b1fe9`:
- `rust-port/renderer/src/view/cities.rs` (+33/−2)
- `rust-port/renderer/tests/revolt_wiring_r6.rs` (nowy, 267 linii)
- `dyspozycje/autobot/runs/R-RUSTPORT-P4-1-R6-WIRING-R1/01-operator-r1.md`, `02a-obrona.md`

Brak zmian w `src/cities/**` i `src/models/**` (logika RevoltRenderer/CityRenderer nietknięta, `cities/mod.rs` bez zmian). Brak `Cargo.lock`, brak `gra/`, brak `#[ignore]`. `git diff --check` czysty. Trailery commitów bez nazwy modelu.

## Bramki (odtworzone przez FC, `rust-port/renderer`, CARGO_TARGET_DIR w scratchpadzie poza repo, usunięty po bramkach)
Env: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`.
1. `cargo fmt --check` — EXIT 0
2. `cargo clippy --all-targets -- -D warnings` — EXIT 0
3. `cargo test --test revolt_wiring_r6` — EXIT 0, 7 passed, 0 failed, 0 ignored
4. `cargo test --all-targets --no-fail-fast` — EXIT 0; 77 × `test result: ok`; 666 passed, 0 failed, 0 ignored; 0 linii FAILED/panicked

Dysk przed bramką 4: 12 GB wolnego (`df -h /`), próg dispatchu ≥ 12 GB spełniony (na granicy).

## Orzeczenia zarzutów Evaluatora

1. **Brak wołającego poza crate'em renderera — ODDAL.** Dispatch zamawia wpięcie na poziomie adaptera (`view/cities.rs`), nie w aplikacji/bridge. Obrona dopisała w doc-komentarzu `sync_revolt` jawną zależność od drogi DTO engine → renderer (audyt L6). Notatka dla orkiestratora: w rejestrze R6 = „wpięte w adapter”, NIE „wołane w grze”; zależność od #308.
2. **Kolejność sync → sync_revolt tylko opisana — ODDAL.** Obrona dodała `CityInputs::sync_with_revolt(&mut CityRenderer, &mut RevoltRenderer)` wykonujące oba kroki w kolejności webu; test `sync_with_revolt_matches_two_step_order` potwierdza równość z dwoma krokami. `sync_revolt` pozostaje (wymagany literą dispatchu) z ostrzeżeniem w dokumentacji.
3. **Getter `revolt_inputs()` poza zakresem — ODDAL.** Usunięty (jedyne trafienie `revolt_inputs` w repo to nazwa niezwiązanego testu `cities_revolt_r6.rs:457`). Równoważność z bezpośrednim `RevoltRenderer::sync` nadal sprawdzana (`sync_revolt_matches_direct_revolt_sync`, porównanie przez `RevoltInputs::from_dto` z tego samego `cities[]`).
4. **Wektory ręczne / brak ścieżki przebudowy grupy — ODDAL.** Wektory ręczne są zgodne z zamówieniem dispatchu (sekwencja dwóch miast); logikę względem pinu pokrywa `cities_revolt_r6.rs`. Luka przebudowy grupy zamknięta testem `sprite_reattached_when_group_rebuilt` (mury none → Stone, zmiana visualKey, nowy sprite z większym serialem przypięty do nowej grupy, dokładnie jeden).

Brak zarzutów NAPRAW. Brak decyzji wymagających człowieka.

## Uwagi FC (nie blokują)
- `sync_with_revolt` to API ponad literę dispatchu, ale w pliku z allowlisty i bez zmiany logiki; przyjęte jako realizacja kolejności webu.
- `RevoltInputs` budowane jest w `CityInputs::from_dto` (pole prywatne), bo `CityInputs::cities` to `Vec<City>`, nie DTO — techniczne odstępstwo od brzmienia dispatchu (`RevoltInputs::from_dto(&self.cities)`), semantycznie równoważne (test równoważności).

ZMIANY/COMMIT: kod `139ad0b87`; szczyt przed FC `9700b1fe9`; raport FC na gałęzi lokalnej `rust-port-wip/R-RUSTPORT-P4-1-R6-WIRING-R1-fc1` (SHA w odpowiedzi FC).
TESTY: jak wyżej, wszystkie 4 bramki EXIT 0.
BLOKADY: brak.
RUNDY: 1/5.
NASTĘPNY KROK: integracja orkiestratora (FF parity-v2 do `139ad0b87`/szczytu raportów), wpis w REJESTR-RUST: „R6 wpięte w adapter, wołanie w grze zależy od #308”.
DEPLOY/PUSH: NIE WYKONANO.
