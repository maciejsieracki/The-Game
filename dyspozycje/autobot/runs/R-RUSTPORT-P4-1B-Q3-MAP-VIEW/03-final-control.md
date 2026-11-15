# R-RUSTPORT-P4-1B-Q3-MAP-VIEW — Final Control r1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1B-Q3-MAP-VIEW
GOAL: producent `MapViewDto` + `HexDynDto` z `&SnapshotMap` (P4-1B / #211), wektory pinu `07d2fbd72`, reguła długości `riverRenderPaths` w `view-model`.
ZMIANY/COMMIT: gałąź `fc/q3-map-view`; SHA końcowy = commit tego raportu (rodzic `c4d45da91` = merge raportu Evaluatora `c187edb44` do `2eeca6fc9`). Kod producenta bez zmian `6b1b5c8ed`; test poprawiony przez Obronę `b82c98983`.
TESTY: niżej (odtworzone samodzielnie przez FC).
BLOKADY: brak.
RUNDY: 1/5
NASTĘPNY KROK: integracja orkiestratora (merge, nie podmiana drzewa) na `origin/rust-port/parity-v2` + pełny `cargo test` silnika.
DEPLOY/PUSH: NIE WYKONANO

## Ancestry

- Baza dispatchu: `2f9a12786` (= `origin/rust-port/parity-v2` przy starcie).
- Łańcuch: `2f9a12786` → `6b1b5c8ed` (kod) → `81befe806` (raport Op.) → `b82c98983` (test Obrony) → `2eeca6fc9` (raport Obrony) → `c4d45da91` (merge `c187edb44`, raport Evaluatora) → commit FC.
- `2f9a12786` jest przodkiem; `6b1b5c8ed` jest przodkiem.
- Bieżące `origin/rust-port/parity-v2` = `2799cdd4b` (przesunięte o P4-1J generalTarget i P4-1D Q1 STACK-REPIN). `git merge-tree --write-tree origin/rust-port/parity-v2 HEAD` = `261e28f94`, bez konfliktów.

## Allowlista (`git diff --stat 2f9a12786 HEAD`)

Wyłącznie: `engine/src/domain/map_view.rs` (nowy), `engine/src/domain/mod.rs` (+1 linia `pub mod map_view;`), `view-model/src/validate.rs` (reguła długości + komentarz wariantu), `view-model/tests/validate.rs`, `engine/tests/p4_1b_map_view.rs` (nowy), `engine/tests/p4_1b_map_view_vectors/{gen.mjs,vectors.json}` (nowe), `dyspozycje/autobot/runs/R-RUSTPORT-P4-1B-Q3-MAP-VIEW/**`. `Cargo.lock` nieśledzony, niecommitowany. Brak `#[ignore]`/`should_panic` w nowych testach.

## Bramki (FC, HEAD `c4d45da91`, CARGO_TARGET_DIR poza repo, usunięty po bramkach)

| Bramka | Wynik |
|---|---|
| `cargo fmt --check` engine | EXIT 0 |
| `cargo fmt --check` view-model | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` engine | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` view-model | EXIT 0 |
| `cargo test --lib` engine | EXIT 0, 121 passed |
| `cargo test --test p4_1b_map_view` | EXIT 0, 12 passed |
| `cargo test` view-model | EXIT 0 (10/11/13/3/18/14 passed) |
| `node gen.mjs --check` (Node v22.23.4) | EXIT 0, „vectors.json zgodny (6 map)” |

Własne mutacje producenta FC (sed na `map_view.rs`, przywrócony `cmp`-em):

| Mutacja | Wynik testu wektorów |
|---|---|
| brak sortowania `(r,q)` | EXIT 101, 5 failed |
| brak trimu/medium-ścieżki dla `medium` | EXIT 101, 2 failed |
| wioska bez warunku miasta | EXIT 101, 1 failed |
| `None` → nie-`main` (`Short`) | EXIT 101, 2 failed |
| `terraces` nigdy prawdziwe | EXIT 101, 1 failed |

Wniosek: bramka cargo (testy bajt w bajt) wykrywa mutacje KODU PRODUCENTA, nie tylko mutanty budowane w teście.

## Orzeczenia zarzutów

1. Z-Q3-2 (`Result<_, MapViewError>` zamiast gołego DTO) — **ODDAL**. Uzasadnione: pola `SnapshotMap` są tekstowe, DTO typowane; cicha podmiana byłaby gorsza. Adnotacja dla orkiestratora: wpis w `REJESTR-RUST.md` przy integracji, P4-1G obsługuje błąd jawnie.
2. Brak nowego wariantu błędu (użyty `ViewError::LengthMismatch`) — **ODDAL**. Wariant semantycznie dokładnie opisuje regułę (kolekcja równoległa), dokumentacja wariantu rozszerzona o `map.riverRenderPaths`; dispatch „reguła + wariant” spełniony co do celu (rozróżnialny błąd z polem, expected, actual). Nowy wariant byłby duplikatem.
3. Testy `mutacja_*` nie mutują producenta — **ODDAL**. FC zmierzyło: 5/5 mutacji kodu producenta łapie bramka cargo (tabela wyżej); Obrona: 7/7 skryptem `mutate-r1.py`.
4. Słaba mutacja bez sortowania — **ODDAL** (naprawione przez Obronę w `b82c98983`: asercja bajt w bajt z wektorami; FC dodatkowo potwierdziło mutacją producenta).
5. Node ≥ 22.18 (`stripTypeScriptTypes`, ExperimentalWarning) — **ODDAL** jako adnotacja; generator nie jest bramką cargo, `--check` zielony.
6. Jednorazowy EXIT 101 `cargo test --lib` u Evaluatora — **ODDAL**: nieodtworzony (Obrona 2×, FC 1× EXIT 0, 121 passed). Przyczyna: NIE_ZMIERZONO.
7. Pełny `cargo test` silnika i merge z przesuniętym parity — **ODDAL** jako krok integratora: merge-tree z `2799cdd4b` czysty; pełny `cargo test` silnika NIE_ZMIERZONO w FC — obowiązkowy po merge'u przy integracji.
8. NIE_ZMIERZONO (wołający w rendererze P4-1G, `placedImprovements` jako źródło tarasów, zmiana terenu w trakcie gry) — **ODDAL**: poza zakresem dispatchu, zapisane zgodnie z kryterium 4.

Brak orzeczeń NAPRAW → PASS-WITH-NOTES. Decyzje człowieka: brak.

## NIE_ZMIERZONO

- Pełny `cargo test` silnika (wszystkie pliki testowe) — dla integratora po merge'u z `2799cdd4b`.
- Wołający producenta w rendererze (P4-1G).
- `placedImprovements` jako źródło tarasów; zmiana terenu w trakcie gry.
