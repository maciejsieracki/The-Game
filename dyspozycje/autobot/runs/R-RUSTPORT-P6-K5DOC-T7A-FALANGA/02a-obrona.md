# Obrona Operatora — R-RUSTPORT-P6-K5DOC-T7A-FALANGA (runda 1, odpowiedź na zarzuty Evaluatora)

STATUS: BLOCK (INFRA — tylko bramka `cargo test --all-targets --no-fail-fast`; dysk 7,7 GB < 8 GB)
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5DOC-T7A-FALANGA
BAZA: `f85622878` (origin/rust-port/parity-v2), kod operatora `0964e67a1`, raport `8eef448b9`
SHA obrony: `409477d73` (wektory + generator; modul `siege_tactics_phalanx.rs` bez zmian od `0964e67a1`)
PIN: `07d2fbd72`, `gra/src/battle/battleScene.ts`

## Odpowiedzi na zarzuty

### Zarzut 1 — mutant bez premii +6 za sąsiada falangi przeżył: PRZYJMUJĘ
- Poprawka: nowy wektor `remis_E_z_sasiadem_wygrywa_nad_N_bez_sasiada` w `rust-port/engine/tests/p6_k5doc_t7a_gen.mjs`
  (`battleScene.ts:6627-6633`). Jednostka (7,10), sojusznik (8,11), wróg (12,8). Kroki N (7,9) i E (8,10) mają ten sam zysk
  (dNow 7 → 6). N jest pierwszy w kolejności N,E,S,W i nie ma sąsiada falangi; E stoi przy (8,11) i dostaje +6.
  Wynik z wykonania pina: `move (8,10)`.
- Dowód: mutant `touches_phalanx { 6.0 }` → `{ 0.0 }` w `siege_tactics_phalanx.rs` daje FAIL w `action_matches_pinned_vectors`
  (`remis_E_z_sasiadem_wygrywa_nad_N_bez_sasiada`, pole `col`). Moduł przywrócony z kopii; `git status` czysty.
- Commit: `409477d73`.

### Zarzut 2 — mutant `nr >= BF_ROWS` → `nr > BF_ROWS` przeżył: PRZYJMUJĘ
- Poprawka: cztery wektory graniczne z wykonania pina (`battleScene.ts:6608`), wszystkie z krokiem poza pole i wrogiem
  w kierunku kroku, dzięki czemu krok poza pole byłby zbliżający:
  - `granica_N_row0_krok_poza_pole_odrzucony` (nr < 0) → done
  - `granica_W_col0_krok_poza_pole_odrzucony` (nc < 0) → done
  - `granica_S_rowBF_ROWS-1_krok_poza_pole_odrzucony` (nr = BF_ROWS = 156) → done
  - `granica_E_colBF_COLS-1_krok_poza_pole_odrzucony` (nc = BF_COLS = 68) → done
  - `granica_S_row_BF_ROWS-2_krok_w_polu_dozwolony` (nr = 155, w polu) → move (7,155)
  Ostatni wektor pilnuje, żeby granica nie była zbyt ostra.
- Dowód: mutant `nr >= BF_ROWS as f64` → `nr > BF_ROWS as f64` daje FAIL w `action_matches_pinned_vectors`
  (`granica_S_rowBF_ROWS-1...`, asercja `kind`/`col`). Przeprowadzony tylko ten mutant. Mutanty dla pozostałych
  trzech krawędzi NIE_ZMIERZONO (wektory są, zachowanie wynika z analizy: ten sam mechanizm porównania `nc`/`nr`).
- Commit: `409477d73`.

### Zarzut 3 — clippy i pełny `cargo test` nie odtworzone (BLOCK INFRA): PRZYJMUJĘ, częściowo odtworzone
- Ponowne sprawdzenie w tej rundzie (przed każdą bramką `df -h /`):
  - `cargo fmt --check -p civ-engine`: EXIT 0 (dysk nie był limitem).
  - `cargo clippy --all-targets -- -D warnings` w `rust-port/engine`: EXIT 0 (start na 9,0 GB; `Finished dev profile`).
  - `cargo test --all-targets --no-fail-fast`: NIE uruchomiono. Dysk przed bramką 7,6–7,7 GB (< 8 GB, wymóg dispatchu).
    BLOCK INFRA, do powtórzenia po zwolnieniu dysku do ≥ 8 GB.
- Wynik `cargo test --test p6_k5doc_t7a`: 10/10 zielone, 0 ignored, EXIT 0 (na zacommitowanym module).

### Zarzut 4 — odtworzone elementy: PRZYJMUJĘ (potwierdzone, bez zmian)
- `cargo fmt --check`: EXIT 0. `cargo test --test p6_k5doc_t7a`: 10/10, EXIT 0.
- Generator po zmianach: `node rust-port/engine/tests/p6_k5doc_t7a_gen.mjs` EXIT 0, `git status` czysty
  (vectors.json regeneruje się bez diffu względem `409477d73`).
- Bez `#[ignore]`, bez osłabionych asercji, allowlista zachowana (zmiany tylko w `p6_k5doc_t7a_gen.mjs` i `p6_k5doc_t7a_vectors/vectors.json`).

### Zarzut 5 — drobne (rozpoznanie, rozbieżności dispatch vs pin): PRZYJMUJĘ jako udokumentowane, ODRZUCAM jako blokadę
- Brak pliku rozpoznania w `f85622878`: NIE_ZMIERZONO względem rozpoznania (sprawdzone: brak ścieżki w tej bazie). Decyzja z dispatchu.
- Brak wariantu `Schedule`: zgodne z pinem (`_doMove(..., () => done())`, `battleScene.ts:6635`), zapisane w module.
- Wariant `AdvanceStep` dla `lineFront === null`: zgodne z `battleScene.ts:6555-6556`.
- Mutant `d_enemy > d_now` jest równoważny: krok zmienia odległość Manhattan dokładnie o ±1 (parzystość), więc
  `d_enemy >= d_now` ⇔ `d_enemy > d_now` ⇔ `d_enemy == d_now + 1`. Zgadzam się z oceną Evaluatora.

### Zarzut 6 — drobne: PRZYJMUJĘ jako znany dług, bez zmiany kodu
- NFD w `norm_name` (`siege_tactics_classify::norm_name`) obejmuje tylko U+00C0..U+017F. Dług NFD, znany (kategoria NFD-CCC).
  Wektory `is_phalanx` nie zawierają innych diakrytyków; sprawdzono, że `kategoria_falanga_diakrytyk` (Ą) i `łódź` przechodzą.
- Trailery commitów: dispatch zabrania nazwy modelu, a reguła sesji dodaje trailer `Co-Authored-By: Claude Haiku 5.5`.
  Ten konflikt NIE jest rozstrzygany przez Operatora. Commity (`0964e67a1`, `8eef448b9`, `409477d73`) używają trailera
  zgodnego z regułą sesji. Decyzja należy do orkiestratora.

## Mutacje (wyniki w tej rundzie)

| Mutant | Wynik |
|---|---|
| (a) bez premii +6 za sąsiada falangi | FAIL (`remis_E_z_sasiadem...`, col) |
| (b) `nr >= BF_ROWS` → `nr > BF_ROWS` | FAIL (`granica_S_rowBF_ROWS-1...`) |
| (c) mutanty z raportu Operatora (tolerancja 3, filtr primary_ranged, negacja isPhalanx) | wykryte wcześniej (nie powtarzano) |

## Bramki (ta runda)

| Bramka | Wynik |
|---|---|
| `cargo fmt --check -p civ-engine` | EXIT 0 |
| `cargo test --test p6_k5doc_t7a` | 10/10, EXIT 0 |
| generator (regeneracja vectors.json) | EXIT 0, bez diffu |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 (dysk 9,0 GB na starcie) |
| `cargo test --all-targets --no-fail-fast` | NIE_ZMIERZONO — BLOCK INFRA (dysk 7,6–7,7 GB < 8 GB) |

## Sprzątanie
- Target w scratchpadzie (`t7a-target`) usunięty po bramkach; moduł `siege_tactics_phalanx.rs` przywrócony z kopii (zero diffu).
- Brak push. Brak zmian poza allowlistą. Brak `Cargo.lock`.

## Werdykt tej obrony
- Zarzuty 1, 2 — przyjęte, naprawione wektorami z wykonania pina, dowód mutacyjny (commit `409477d73`).
- Zarzut 3 — częściowo odtworzony (fmt, clippy EXIT 0). Pełny `cargo test --all-targets` do powtórzenia przy ≥ 8 GB.
- Zarzuty 4, 5, 6 — potwierdzone lub odrzucone jako blokada (uzasadnienie wyżej).

RUNDY: 1/5 (obrona), wynik: BLOCK INFRA dla bramki pełnego testu.
NASTĘPNY KROK: zwolnić dysk do ≥ 8 GB; uruchomić `cargo test --all-targets --no-fail-fast` w `rust-port/engine` z `CARGO_TARGET_DIR` poza repo; następnie Evaluator r2 (weryfikacja `409477d73`).
DEPLOY/PUSH: NIE WYKONANO
