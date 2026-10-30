# Operator-impl, runda 2/5 (poprawka po FC r1)

Plik nazwany `01-operator-r1.md` wg zlecenia; dispatch (`00-dispatch.md`) oznacza ten etap jako RUNDA 2/5.

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-M06B1-WYBRZEZE-FINALIZACJA-Q1
GOAL: M06B1 (6 symboli finalizacji wybrzeza, web `gen-helpers.ts` 4649-4939, pin `edb8fb56`) w `landsea.rs`; runda 2 usuwa dwa zarzuty FC r1 (NAPRAW 1: cap 12 obserwowalny; NAPRAW 2: niezalezny weryfikator Python).

ZMIANY/COMMIT: baza `f8cc5781` (`origin/backup/m06b1-f8cc5781`). Commit `6b695cb8` (kod nie zmieniony; testy, wektory, weryfikator, dokument, logi).
- `rust-port/engine/tests/p6_m06b1_cap.rs` (nowy, 2 testy)
- `rust-port/engine/tests/p6_m06b1_vectors/web-cap.json` (nowy, 270 KB, wektory z weba cap 12 + flagi cap 11/13)
- `dyspozycje/autobot/runs/R-RUSTPORT-P6-M06B1-WYBRZEZE-FINALIZACJA-Q1/`: `m06b1-r2-cap-search.mjs`, `gen-m06b1-cap-vectors.mjs`, `evidence-r2-cap-both.json`, `verify-m06b1-r2.py`, `verifier-python-r2.txt`, gate logs `gate-*-r2.log`, `mut-logs/r2-M16-cap11.log`, `mut-logs/r2-M17-cap13.log`
- `dyspozycje/rust-port/p6/P6-M06B1-WYBRZEZE-FINALIZACJA.md` (§9.2 rozstrzygniete, §9.6 runda 2, §4 zakres 3186-4374 = 0 hunkow)

TESTY:
- Cap (NAPRAW 1): web z capem 11/12/13 (kopie pina, jedyna zmiana `gen-helpers.ts:4852`). Na 1500 mapach LCG 12345: cap11 != cap12 na 379, cap13 != cap12 na 302, oba na 302. Mapa m=5 (W=32, H=40, p=0.4866): cap11 i cap13 zmieniaja po 1 heksie.
- Mutanty reczne (przywrocenie pliku cmp-identyczne): M16 (cap 11) EXIT=101, FAILED `cap12_thicken_maps_match_web_cap12`; M17 (cap 13) EXIT=101.
- Weryfikator Python (NAPRAW 2): `python3 -I verify-m06b1-r2.py`, EXIT=0, 1469 sprawdzonych, 0 rozbieznosci. Kategorie: ocean 330, purge 228, trim 80, finalize 420, thicken 296, flatten 88, granice 11, cap 4 + flagi cap 11/13 odtworzone z weba (sha256 stanu zgodny).
- Bramki (EXIT z logow): `cargo fmt -- --check` EXIT=0; `cargo clippy --offline --all-targets -- -D warnings` EXIT=0; `cargo test --offline --no-fail-fast` EXIT=0, 1438 passed / 0 failed (1436 + 2 nowe). `git diff --check` EXIT=0.
- Zero zmian istniejacych testow i plikow poza allowlista (`relief.rs`, `bridge.rs`, `Cargo.toml`, `gra/**`, `renderer/**`, `src-tauri/**`, `domain/mod.rs`, `p6_m00_skeleton.rs` nietkniete). `Cargo.lock` nie zacommitowany.

BLOKADY: brak technicznych. Luki:
- Mutacje M01-M28 nie powtorzone w calosci (w rundzie 2 tylko M16/M17); wynik r1 (23 zabite, M12/M19/M20 rownowazne z dowodem) zostaje.
- Weryfikator i port uzywaja tych samych wektorow z weba (wartosci referencyjne); niezaleznosc dotyczy implementacji.

RUNDY: 2/5 (r1: FAIL z FC; r2: ten etap). Zalozenie: nazwa pliku `01-operator-r1.md` zachowana wg zlecenia.

NASTEPNY KROK: Evaluator (Sonnet), potem Final Control. Po PASS integracja z aktualnym `origin/rust-port/parity-v2` przez orkiestratora (nie w tym temacie).

DEPLOY/PUSH: NIE WYKONANO
