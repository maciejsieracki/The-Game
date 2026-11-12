# OBRONA — R-RUSTPORT-P6-SIEGE-TAKTYKA-K1-Q1 (Operator, obrona r1)

STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-SIEGE-TAKTYKA-K1-Q1
GOAL: obrona przed zarzutami 1-4 z przeglądu; kod bazowy 40ec02d18 (Operator r1).
ZMIANY/COMMIT: commit obrony na lokalnej gałęzi `rust-port-wip/SIEGE-TAKTYKA-K1-Q1` (nie wypchnięto), SHA: patrz sekcja SHA. Zmieniono: `rust-port/engine/tests/p6_siege_tactics_approach_k1.rs` (+2 testy kompozycji), `dyspozycje/rust-port/p6/P6-SIEGE-TAKTYKA.md` (doprecyzowanie etykiety statusu), ten plik. Brak zmian w gra/**, Cargo.toml, Cargo.lock (untracked, nie commitowany), WERSJE.md, mod.rs, vectors.json.

## Odpowiedzi na zarzuty

### Zarzut 1 — kryterium (1) niespełnione dla wiersza 30 (PARTIAL)
ODPOWIEDŹ: PRZYJMUJĘ jako fakt, NIE naprawiam w tej rundzie.
- Dowód faktu: `P6-SIEGE-TAKTYKA.md` wiersz 30 = PARTIAL; port obejmuje tylko `siege_safe_approach_goal` (część decyzyjna). Niezportowane: `_siegeWalkTo`, `_bfsFirstStep`, `_doMove`, `_schedule` (efekty sceny). Potwierdzone w 01-operator-r1.md, blokada 1.
- Dlaczego nie poprawiam: port marszu wymaga modelu efektów sceny (kolejka ruchu, schedule), czyli zakresu K1b, a nie poprawki w obronie. Zmiana zakresu jest decyzją właściciela (ABC), nie korektą Operatora.
- Stan: kryterium (1) dispatchu jest literalnie niespełnione dla wiersza 30. Wymagana decyzja: (A) zaakceptować PARTIAL dla wiersza 30 do czasu K1b, albo (B) zaplanować K1b.

### Zarzut 2 — baza: parity-v2 nie zawiera siege_tactics_approach.rs ani K0b
ODPOWIEDŹ: PRZYJMUJĘ jako fakt, NIE rozstrzygam w obronie (decyzja orkiestratora).
- Dowód (wykonany w tej rundzie):
  - `git cat-file -t 0bd7fcc99` = commit (obiekt istnieje lokalnie);
  - `git merge-base --is-ancestor 0bd7fcc99 origin/rust-port/parity-v2` → NIE jest przodkiem;
  - `git merge-base --is-ancestor 0bd7fcc99 f207ea6b1` → NIE jest przodkiem;
  - `git merge-base --is-ancestor 95d0bfe62 f207ea6b1` → NIE jest przodkiem;
  - tip `origin/rust-port/parity-v2` = b9800e0a7.
- Wybrana baza: 0bd7fcc99 (FC K0b), zgodnie z dispatchem, bo tylko tam istnieje `siege_tactics_approach.rs` i wektory K0b. Kod K1 nie da się zintegrować na parity-v2 bez K0b. Rozstrzygnięcie łańcucha integracji należy do orkiestratora/właściciela.

### Zarzut 3 — brak testu kompozycji `siege_shooter_threats` z `siege_move_refused`
ODPOWIEDŹ: PRZYJMUJĘ, naprawione.
- Dodano w `p6_siege_tactics_approach_k1.rs`:
  - `kompozycja_zagrozenia_strzelcow_i_wiezy_z_odmowa_kroku`: obrońca (0,0) zasięg 2 + wieża (10,3) zasięg 2 → lista 2 zagrożeń; krok (3,0)→(1,0) odmowa (slack celu -1 < slack startu 1); krok (0,0)→(1,0) dopuszczony (-2 → -1); wieża sama (8,3)→(9,3) odmowa (-1 < 0). Oczekiwania liczone ręcznie ze wzoru slack = |c-q|+|r-r0|-zasięg.
  - `kompozycja_bez_strzelca_z_amunicja_i_bez_wiezy_daje_pusta_liste`: obrońca bez amunicji i zniszczona wieża → pusta lista → krok dopuszczony; zniszczona wieża pomijana.
- Dowód: `cargo test --test p6_siege_tactics_approach_k1` → 8 passed (wcześniej 6); `cargo fmt --check` EXIT 0; `cargo clippy --all-targets -- -D warnings` EXIT 0.

### Zarzut 4 — mylenie etykiety „K1” (stall PAT) z tematem K1-Q1
ODPOWIEDŹ: PRZYJMUJĘ, naprawione w dokumencie.
- W `P6-SIEGE-TAKTYKA.md` status tematu przemianowano na „K1-Q1 (wiersze 29–30 ...; etykieta NIE oznacza klocka K1 z tabeli klocków)”; klocek K1 z tabeli (stall PAT, `_checkEnd`, wiersz 9) opisany jako odrębny. Tabela klocków bez zmian.

## Bramki (po obronie, lokalnie, EXIT)
- `cargo fmt --check`: EXIT 0
- `cargo clippy --all-targets -- -D warnings`: EXIT 0
- `cargo test --lib`: 48 passed, 0 failed
- `cargo test --test p6_siege_tactics_approach`: 5 passed
- `cargo test --test p6_siege_tactics_end`: 8 passed
- `cargo test --test p6_siege_tactics_approach_k1`: 8 passed (6 + 2 nowe)
- Brak `#[ignore]`, brak osłabień istniejących testów, `vectors.json` nietknięty.

## SHA
Baza: 40ec02d18 (Operator r1, lokalnie, gałąź `rust-port-wip/SIEGE-TAKTYKA-K1-Q1`).
Commit obrony: patrz SHA podane w odpowiedzi tekstowej Operatora (`git rev-parse --short` na gałęzi `rust-port-wip/SIEGE-TAKTYKA-K1-Q1-obrona-r1`).

## BLOKADY
1. Zarzut 1: decyzja właściciela (A: PARTIAL dla wiersza 30 / B: K1b). Kod nie zmieniony w tym zakresie.
2. Zarzut 2: decyzja łańcucha bazy (0bd7fcc99 vs parity-v2). Kod nie zmieniony.

RUNDY: 1/5 (obrona)
NASTĘPNY KROK: decyzja właściciela w zarzutach 1 i 2; następnie Evaluator r2 i Final Control dla tego samego ID.
DEPLOY/PUSH: NIE WYKONANO
