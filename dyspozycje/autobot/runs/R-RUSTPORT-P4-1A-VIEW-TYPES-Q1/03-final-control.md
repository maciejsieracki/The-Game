# R-RUSTPORT-P4-1A-VIEW-TYPES-Q1 — Final Control r1

```text
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1A-VIEW-TYPES-Q1
GOAL: typy DTO z P4-1 §3 w crate rust-port/view-model (serde camelCase, JSON-safe), testy JSON (round-trip, nazwy kluczy, niezmiennik ID), pomiar rozmiaru snapshotu 3000/8000 heksów
ZMIANY/COMMIT: kod = fb3d1b95b (Obrona r1) <- b54dffb9a (Evaluator r1) <- 011de8664 <- 86032cd28 <- 525a2ef7b (baza); ten raport w jednym commicie na lokalnej gałęzi fc/P4-1A-r1 (rodzic fb3d1b95b); SHA w wyniku Workflow
TESTY: fmt --check EXIT 0; clippy --all-targets -D warnings EXIT 0; cargo test --all-targets EXIT 0 (68 testów, 0 ignored) na 1.97.0 i 1.87.0 (rust-version); git diff --check 525a2ef7b..fb3d1b95b pusty; gen_pin_literals.py --check EXIT 0; własna fala mutacji FC 71 mutantów, 70 zabitych, 1 przeżywa (N1)
BLOKADY: kryterium 4 (liczby w P4-1 §4.1) wymaga działania orkiestratora przy integracji (Z3) — poza allowlistą tematu
RUNDY: 1/5 (Operator r1 -> Evaluator r1 FAIL -> Obrona r1 -> FC r1)
NASTĘPNY KROK: integracja orkiestratora na rust-port/parity-v2 + łatka §4.1 na claude/rust-sivvrn + wpis D-VM-OPT-IN w REJESTR-RUST.md
DEPLOY/PUSH: NIE WYKONANO
```

## 1. Baza, ancestry, izolacja

- Dispatch czytany z `origin/claude/rust-sivvrn:dyspozycje/autobot/runs/R-RUSTPORT-P4-1A-VIEW-TYPES-Q1/00-dispatch.md`. **DODATKU r2 w pliku nie ma** (stwierdzam to samo co Operator, Evaluator i Obrona).
- `git merge-base --is-ancestor 525a2ef7b fb3d1b95b` → 0; `7817ef0c` → 0.
- Czubek `origin/rust-port/parity-v2` = `4a686b902` (przesunął się od dispatchu). `merge-base(fb3d1b95b, parity-v2)` = `525a2ef7b`; `git diff --name-only 525a2ef7b origin/rust-port/parity-v2 -- rust-port/view-model rust-port/Cargo.toml dyspozycje/autobot/runs/R-RUSTPORT-P4-1A-VIEW-TYPES-Q1` pusty; `git merge-tree --write-tree origin/rust-port/parity-v2 fb3d1b95b` → drzewo `7de02f67a`, bez konfliktów.
- Allowlista (`git diff --name-only 525a2ef7b fb3d1b95b`, 35 plików): wyłącznie `rust-port/view-model/**` i `dyspozycje/autobot/runs/R-RUSTPORT-P4-1A-VIEW-TYPES-Q1/**`. Zero zmian w `gra/**`, `rust-port/engine/**`, `rust-port/renderer/**`, `src-tauri/**`. `rust-port/Cargo.toml` nie istnieje (brak workspace; crate samodzielny jak engine/renderer). `Cargo.lock` niecommitowany (`rust-port/view-model/.gitignore`).
- `#![forbid(unsafe_code)]` w `src/lib.rs:28`; zero `#[ignore]` w `src/` i `tests/`.

## 2. Bramki (odtworzone samodzielnie, czysty CARGO_TARGET_DIR w scratchpadzie, usunięty)

| Bramka | Wynik |
|---|---|
| `cargo fmt --check` | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| `cargo test --all-targets` (1.97.0) | EXIT 0; 10+11+13+3+18+13 = 68 testów, 0 ignored |
| `cargo +1.87.0 test --all-targets` (MSRV z Cargo.toml) | EXIT 0, te same liczby |
| `git diff --check 525a2ef7b fb3d1b95b` | pusty |
| `gen_pin_literals.py --check` (pin 07d2fbd72) | EXIT 0; SHA-256 fikstury `5baee288…dc15` = `sha256sum` pliku = stała w `tests/pin_vectors.rs` |
| `gen_pin_literals.py --pin d27471925 --check` (kontrola wykrycia przesunięcia pinu) | EXIT 1, `DRIFT` fikstury i stałej SHA — przesunięcie pinu jest wykrywane |
| `cargo run --release --example snapshot_size` | bajty identyczne z 01b/02a: 754285 / 910987 / 2011660 / 2427740 B, mapa 222170 / 593927 B, hexState+fog 177,2 B/heks |

## 3. Orzeczenia per zarzut

| Zarzut | Orzeczenie | Dowód FC |
|---|---|---|
| Z1 testy walidatora | **ODDAL (usunięte)** | `tests/validate.rs`: `every_float_field_rejects_non_finite` (26 pól × NaN/+Inf/−Inf, obie drogi validate), `float_table_covers_every_f64_field` (tabela == liście liści f64 w JSON; niezależnie `grep 'pub .*: (Option<)?f64' src/*.rs` = 26), `every_ranged_integer_rejects_out_of_range` (15 pól, granice wpisane literałami kontraktu). Moja fala: każde z 47 wywołań `finite/finite_opt/badge/color/range/len` w `src/validate.rs` usunięte osobno → 47/47 zabite (w tym wszystkie 21 przeżywające u Evaluatora i E1 `ammoMax`). |
| Z2 wektory pinu | **ODDAL (usunięte)** | generator `02a-obrona/gen_pin_literals.py` czyta `git show 07d2fbd72:gra/src/...` (24 deklaracje, 16 plików z SHA-256); `tests/pin_vectors.rs` włącza fiksturę `include_bytes!` i sprawdza jej SHA-256 (własna implementacja z wektorami znanymi); klucze StackVitals i CityMapBadgeInput z fikstury. Wykrycie dryfu sprawdzone na innym pinie (§2). |
| Z3 kryterium 4 vs allowlista | **DO DECYZJI CZŁOWIEKA (orkiestrator)** | Sprzeczność leży w dispatchu, nie w pracy. Pomiar odtworzony przez FC bajt w bajt. Łatka `02a-obrona/P4-1-par-4.1-pomiar.patch` celuje w blob `2f9aadd4e` = obecny `origin/claude/rust-sivvrn:dyspozycje/rust-port/p4/P4-1-RENDER-DTO-CONTRACT.md`. Do czasu jej zastosowania kryterium 4 jest formalnie niespełnione. |
| Z4 kształt i kolejność mapy, facing, kafle | **ODDAL (usunięte)** | `validate_map` (`src/validate.rs:187-220`): `hexes.len() == width*height` + `hexes[i].coord == (i % width, i / width)` (wyklucza duplikaty i dziury); `facing` 0..=3, `grid.tiles[]` 0..=7. Cytat `map/generator.ts:216-219` @07d2fbd72 sprawdzony (`for r … for q …`). Mutanty FC: kolejność wyłączona, zamiana q/r, MAX_FACING ±1, MAX_BATTLE_TILE ±1, min kafla 0→1 — wszystkie zabite. Test producenta w silniku pozostaje w P4-1B (§8 kontraktu) — poprawnie poza zakresem. |
| Z5 `civIconId` barbarzyńców | **ODDAL (usunięte)**; luka kontraktu → orkiestrator | doc `src/owners.rs:85-97`; cytaty `main.ts:10377` @07d2fbd72 (`civId: isBarbarian(ownerId) ? null : …`) i `renderer/src/units/overlay/emblem.rs:29` @525a2ef7b (`civ_id: Option<String>`) sprawdzone. Wartość producenta dla barbarzyńców = NIE_ZMIERZONO — do dopisania w P4-1 §3.4. |
| Z6 brak klucza `Option` = `None` | **DO DECYZJI CZŁOWIEKA (orkiestrator, wpis rejestru)** | zachowanie opisane w doc `src/lib.rs:15-21`, przypięte `tests/json_strict.rs`; wpis D-VM-OPT-IN do `REJESTR-RUST.md` (tekst w `02a-obrona.md` §3 Z6) jest poza allowlistą. Decyzja techniczna — orkiestrator zapisuje (zasada 9). |
| Z7 komentarz `tests/common/mod.rs` | **ODDAL (usunięte)** | `tests/common/mod.rs:1-12` opisuje stan faktyczny (minimal ≠ „każdy Option None”). |

**NAPRAW: 0.**

## 4. Własna fala mutacji FC

Skrypt `03-fc/fcmut.py`, wynik `03-fc/fcmut.out` (kopia crate'u w scratchpadzie, `cargo test --tests`).

| Grupa | Mutanty | Zabite | Przeżywa |
|---|---|---|---|
| usunięcie każdego wywołania kontroli w `src/validate.rs` (`?` → `.ok()`) | 47 | 47 | 0 |
| każda stała `MAX_*` ±1 (7 × 2) | 14 | 14 | 0 |
| strażnicy logiczni (kolejność heksów, q/r, wersja kontraktu, ringHex: długość, zakres a..f, wielkie litery, wyłączenie; veteranLevel min 1→0; kafel min 0→1) | 10 | 9 | **1** |
| **Razem** | **71** | **70** | **1** |

## 5. Uwagi (nie blokują)

- **N1 (nowa, test).** Mutant „usunięcie `&& b[0] == b'#'`” w `is_ring_hex` (`src/validate.rs:177`) przeżywa: lista złych wartości w `tests/pin_vectors.rs:709` nie ma 7-znakowego ciągu bez `#` (`"00e539"` odpada na długości). Kod jest poprawny (sprawdzone odczytem), brakuje jednego przypadku testowego, np. `"x00e539"` / `"000e539"`. Orzeczenie: uwaga, nie NAPRAW — kontrola jest zaimplementowana, a Z1 (zero przeżywających w kontrolach per pole) jest spełnione. Dopisać przy najbliższym dotknięciu crate'u (P4-1B/P4-1G).
- **N2.** Wykrycie przesunięcia pinu wymaga uruchomienia `gen_pin_literals.py --check`; `cargo test` sam pilnuje tylko integralności fikstury (SHA). Przy przesunięciu pinu orkiestrator musi uruchomić generator (instrukcja w `tests/fixtures/README.md`).
- **N3.** Generator leży w katalogu runu (`dyspozycje/autobot/runs/…/02a-obrona/`), a README fikstury wskazuje tę ścieżkę. Przeniesienie obok crate'u to ewentualna decyzja techniczna orkiestratora; dziś ścieżka jest stabilna w repo.

## 6. Do decyzji orkiestratora (przy integracji)

1. Z3: zastosować `02a-obrona/P4-1-par-4.1-pomiar.patch` do `dyspozycje/rust-port/p4/P4-1-RENDER-DTO-CONTRACT.md` (blob `2f9aadd4e`) albo dopisać §4.1 równoważnie — warunek spełnienia kryterium 4 przed READY_FOR_DEPLOY.
2. Z6: wpis D-VM-OPT-IN w `dyspozycje/rust-port/REJESTR-RUST.md` (tekst w `02a-obrona.md` §3).
3. Z5: luka kontraktu P4-1 §3.4 — wartość `civIconId` producenta dla barbarzyńców (NIE_ZMIERZONO).
4. Integracja `fb3d1b95b` (lub commitu tego raportu) na `rust-port/parity-v2` (czubek `4a686b902`): merge-tree czysty, brak nakładania ścieżek.

Dysk po sprzątaniu: 9,6 GB wolne.
