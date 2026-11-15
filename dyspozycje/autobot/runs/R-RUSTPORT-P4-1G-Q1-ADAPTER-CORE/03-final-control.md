# 03 — Final Control, R-RUSTPORT-P4-1G-Q1-ADAPTER-CORE (runda 1)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (grafika / adapter DTO renderera)
TEMAT: R-RUSTPORT-P4-1G-Q1-ADAPTER-CORE
GOAL: rdzeń adaptera `view` (DTO `civ-view-model` → wejścia renderera): konwersje §2, `FogSets` z `prism_hidden`, wspólne `geom::js_num::to_int32`, komentarz `view.rs` wg D-DTO-1.
ZMIANY/COMMIT: oceniany SHA `652bf1c1f` (Obrona), rodzic `9cdb62ba7` (raport Operatora), a pod nim `aa66e8384` (kod). Baza `be49ff3c3` = `origin/rust-port/parity-v2` (sprawdzone: `git merge-base --is-ancestor be49ff3c3 652bf1c1f` → OK). Ten raport: commit FC na `652bf1c1f`, gałąź lokalna `fc/R-RUSTPORT-P4-1G-Q1-ADAPTER-CORE-r1`.
TESTY: odtworzone samodzielnie (niżej).
BLOKADY: brak.
RUNDY: 1/5.
NASTĘPNY KROK: integracja orkiestratora na `rust-port/parity-v2` (fast-forward z `be49ff3c3`).
DEPLOY/PUSH: NIE WYKONANO.

## Allowlista (`git diff --stat be49ff3c3 652bf1c1f`)

Zmienione pliki:
- `rust-port/renderer/Cargo.toml`;
- `src/geom/earcut.rs`: tylko usunięcie lokalnego `to_int32` i dodanie `use super::js_num::to_int32`;
- `src/geom/js_num.rs` (NOWY);
- `src/geom/mod.rs`: `pub(crate) mod js_num;`;
- `src/view.rs`;
- `src/view/convert.rs` i `src/view/fog.rs` (NOWE);
- `tests/view_adapter_core.rs` (NOWY);
- raporty w `dyspozycje/autobot/runs/R-RUSTPORT-P4-1G-Q1-ADAPTER-CORE/`.

`lib.rs` bez zmian. `Cargo.lock` niezacommitowany. Brak nowych `#[ignore]`. Wszystko mieści się w allowliście.

## Bramki (FC, `rust-port/renderer` na `652bf1c1f`, CARGO_TARGET_DIR w scratchpadzie, usunięty)

- `cargo fmt --check` → EXIT 0.
- `cargo clippy --all-targets -- -D warnings` → EXIT 0.
- `cargo test --all-targets --no-fail-fast` → EXIT 0.
  - Mój log: 127 bloków `test result`, łącznie 1018 passed, 0 failed, 0 ignored.
  - `view_adapter_core` 23/23, `geom_three_parity` 17/17 (earcut), lib 109/109 (w tym `geom::js_num::tests::wraps_like_js`).

Uwaga: Operator, Evaluator i Obrona podali „64 zestawy, 502 passed”, a mój pomiar tego samego SHA daje 127 zestawów i 1018 passed. Przyczyny nie ustalałem; możliwe, że liczono inaczej albo w innym zakresie (NIE_ZMIERZONO). Wynik bramki jest w obu pomiarach ten sam: EXIT 0, 0 failed. W raportach kolejnych tematów liczby trzeba brać z `grep -a "^test result"`.

## Mutacje (FC, każda cofnięta, potem 23/23)

| Mutacja | Zmiana | Wynik |
|---|---|---|
| M1 | `seed as i32` zamiast `to_int32` | FAIL (`seed_is_js_to_int32`) |
| M2 | `prism_hidden.push(false)` | FAIL (2 testy) |
| M3 | `Ok(value as i32)` zamiast błędu przepełnienia | FAIL (1 test) |

## Pin

`refreshFog` (`git show 07d2fbd72:gra/src/main.ts`, linie 13475–13520):
- przy mgle: `setFog(vis, exploredForRender)`, `cityRenderer.applyFogVisibility(vis, true, ME())`, `syncWorkerFieldOverlayFog(…, vis, exploredForRender, true)`;
- bez mgły: `ALL_KEYS` i `false`.

`FogSets::from_dto` odwzorowuje to 1:1: visible = stan 2, explored = stan ≥ 1, wyłączona mgła = wszystkie klucze.

## Orzeczenia zarzutów

1. **Brak produkcyjnego wołającego `view::*` i `FogSets` → ODDAL.**
   - Wpięcie w sceny jest poza dispatchem Q1 i allowlistą; dispatch obejmuje tylko rdzeń.
   - `view.rs` wskazuje tematy Q2–Q6.
   - `to_int32` ma produkcyjnego wołającego w `earcut::z_order`.
   - Wymóg dla dispatchu Q2+: wpiąć adapter.
2. **`#[derive(Default)]` na `FogSets` → ODDAL, bo Obrona już to naprawiła w `652bf1c1f`.**
   - `Default` jest usunięty, a doc-komentarz mówi, że „bez mgły” to `from_dto(…, false)`.
   - Sprawdziłem diff `9cdb62ba7..652bf1c1f` i bramki.
3. **Brak `revealAllLand` i `riverRevealKeys` w DTO (luki L1/L2; pin liczy `useFogRender = fogOn || revealAllLand`) → ODDAL dla Q1.**
   - Zamknięcie luki wymaga zmian w `rust-port/view-model`, poza allowlistą.
   - Luka jest jawnie opisana w `fog.rs` i `01-operator-r1.md`.
   - Warunek wejścia dla tematu, który wpina `FogSets` w sceny: najpierw zamknąć L1/L2 w DTO. To warunek techniczny, nie decyzja właściciela, bo regułę rozstrzyga pin.
4. **Test enumów sprawdza serde, nie adapter → ODDAL.**
   - Adapter to wyczerpujące `match` bez wildcard, więc pilnuje go kompilator.
   - Test serde dowodzi, że nieznany napis nie daje domyślnego wariantu.
   - Wymóg dispatchu jest spełniony.
5. **`serde_json` w dev-dependencies → ODDAL.**
   - `Cargo.toml` jest na allowliście, zależność jest tylko testowa, z tą samą wersją i feature co w view-model.
6. **Zakres realnych id graczy NIE_ZMIERZONO → ODDAL.**
   - To uwaga informacyjna.
   - Przepełnienie daje błąd zgodnie z dispatchem, co potwierdza mutacja M3.

NAPRAW: 0. DO DECYZJI CZŁOWIEKA: 0.

WERDYKT: PASS-WITH-NOTES. Uwagi:
- warunek L1/L2 dla tematu, który wpina mgłę;
- rozbieżność liczników testów w raportach.
