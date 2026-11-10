STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-24-MISC-RELIEF-WIRE-Q1
GOAL: niezależna, adwersaryjna ocena Operatora r1 (commit `aa657c2b` na bazie `f1a1740c`).
ZMIANY/COMMIT: ten raport + `eval-r1-gate-test.log`. Kod nie był zmieniany.

## Sprawdzenia (wszystkie wykonane realnie)

1. Allowlista i baza: `git diff --stat f1a1740c aa657c2b` daje 22 pliki, wszystkie z allowlisty. `models.rs` zmienia tylko komentarz. `Cargo.toml`/`Cargo.lock` niezmienione, nie ma `unsafe`. `f1a1740c` jest przodkiem. `git diff --check` jest czysty.
2. Wektory odtworzone w scratch poza repo (`git archive edb8fb56`, `three@0.169.0` + `esbuild@0.24.0`, node v22.22.0):
   - `build_relief.mjs` wypisał "real reliefSurfaceSampler, no shim". W bundlu jest 0 trafień `relief_shim|__MISC_RELIEF|analytic`.
   - `gen_relief.mjs` wypisał: range=432, reliefHexesDraped=1136, samplers=904, probes=16560.
   - SHA-256 `relief_real.json` = `f3cfbdcd…fec8`, `to_fixed.txt` = `fd883070…8d45`, zgodne z README.
   - `models.json`, `siege.json` i `overlays.json` regenerowane z P4.22 dały SHA identyczne z README, więc fixtury MOD-13 są bez zmian.
3. `GameRelief` reużywa `decor::style::ReliefSampler` (P4.17) i `core::jsnum::js_to_uint32`, bez kopii. Nie dodaje nowego typu ani wywołań `sin`/`cos`/`powi` w `src/`.
4. `toFixed` ma jedną implementację: `overlay::js_to_fixed` to `pub use`, a `js_to_fixed3` deleguje do niej. Grep po `src/` nie znajduje innej implementacji. Test V8 obejmuje 27 808 przypadków.
5. Bramki w czystym `CARGO_TARGET_DIR` (katalog usunięty po pracy): fmt, clippy, clippy `--features gpu` i test dały EXIT=0. Testy: 137 zaliczonych, 0 niezaliczonych.
6. Mutacje: zestaw Operatora daje 16/16 (`mut.log`). Własne mutacje Evaluatora E1–E7 zostały wszystkie wykryte:
   - E1: `abs` na ziarnie;
   - E2: `null` dla `Wzgorza`;
   - E3: `-0` ze znakiem;
   - E4: pominięte `pop` przy remisie;
   - E5: próg 1e20;
   - E6: przeniesienie przy 9;
   - E7: remisy tylko dla `a < 1e15`.
7. Sonda scalenia z aktualnym `origin/rust-port/parity-v2` (`e810d0d3`): `git merge-tree` przechodzi bez konfliktów.

## Zarzuty

Brak.

## Uwagi (nie blokują)

- U1: po scaleniu z P4.21 (`pub mod cities;`) wyliczanka partii w komentarzu `models.rs` będzie niepełna. Do uzupełnienia przy integracji albo przez ogólniejsze sformułowanie.
- U2: „domyślność” `GameRelief` jest zrealizowana przez `build_range_overlay_group_game`; sygnatura z jawnym `relief` zostaje (założenie Z1). Akceptuję je jako zgodne z wymogiem zachowania ścieżek publicznych.

RUNDY: 1/5
NASTĘPNY KROK: Final Control r1
DEPLOY/PUSH: NIE WYKONANO
