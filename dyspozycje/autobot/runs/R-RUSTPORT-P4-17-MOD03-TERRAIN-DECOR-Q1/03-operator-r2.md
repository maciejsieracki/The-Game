STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-17-MOD03-TERRAIN-DECOR-Q1
GOAL: Paczka MOD-03 z P4-4-MODEL-CATALOG. Dekoracje terenu w Rust 1:1 z webem `edb8fb56`, bitowo. Rust reużywa `core`/`pick::terrain` i `jsmath`.

ZMIANY/COMMIT:
- Baza: `origin/rust-port/parity-v2` @ `bf59164b`. Commit r1 `0e48c7e4` przeniesiono przez cherry-pick (bez konfliktów); na tej bazie ma SHA `b057709e`. Nad nim jest commit poprawek r2.
- Pliki dodane jawnym `git add`, bez push.
- Pliki zmienione w r2:
  - `src/decor/{js,relief,style}.rs`;
  - `tests/decor_web_parity.rs`;
  - `tests/fixtures/decor/{gen.ts, README.md, relief.json}`, nowy plik `relief_builders.json`;
  - dokument P4-17 (§0–§10);
  - w tym katalogu: `mutacje/*`, `logs/*.txt` i ten raport.

ODPOWIEDZI NA ZARZUTY (szczegóły: dokument §10):
1. Duplikaty: PRZYJMUJĘ. Usunąłem 6 kopii i reużywam `core::map_style` oraz `pick::terrain::TERRAIN_SOLID_VARIANTS`. Nowy strażnik `decor_reuses_core_instead_of_copies` blokuje kopie; mutant M33 jest zabity.
2. `jsmath`: PRZYJMUJĘ.
   - `decor::js` re-eksportuje `crate::jsmath::{sin, cos, pow, hypot, atan2}`, a oba `atan2` przechodzą przez `js_atan2`.
   - Usunąłem `quat_from_euler`/`local_matrix`; macierz lokalna pochodzi z `SceneNode::local_matrix()`.
   - Strażnik `decor_uses_jsmath_not_platform_libm`.
3. Guard ≥50: PRZYJMUJĘ.
   - Asercja liczy teraz RÓŻNE ziarna na wynik; mutant M34 jest zabity.
   - Wektory zregenerowane z uruchomionego kodu weba. MountainPeak, HillBump i sampler mają po 50 różnych ziaren na każdy wariant; asercje M35/M36 są zabite.
   - Pozostałe 4 JSON-y są bajtowo identyczne z r1.
4. Mutacje: PRZYJMUJĘ.
   - Skrypty są odtwarzalne z repo (`git rev-parse`, `mktemp`, `trap`, `mutants.txt` z katalogu skryptu).
   - M07/M14 opisane jako luka pokrycia numerycznego zamknięta strażnikiem i `jsmath_v8_parity`, a nie jako mutanty równoważne.
   - Poprawiłem nieaktualny wzorzec M06.

TESTY (czysty `CARGO_TARGET_DIR`, logi w `logs/`):
- `fmt`: EXIT=0.
- `clippy -D warnings`: EXIT=0. To samo z `--features gpu`: EXIT=0.
- `cargo test --locked --all-targets`: EXIT=0, 19 binarek, w tym `decor_web_parity` 8/8, `jsmath_v8_parity` 13/13 i `jsmath_wiring` 4/4.
- Parytet: 571 623 skalary, 0 rozbieżności bitowych.
- Mutacje: 36, z czego 33 zabite. Przeżyły 3 mutanty równoważne (M05, M12, M18).

BLOKADY: brak. Ocena wzrokowa: NIE_ZMIERZONO (brak GPU), lista do sprawdzenia w dokumencie §7.
RUNDY: 2/5
NASTĘPNY KROK: ponowny Evaluator.
DEPLOY/PUSH: NIE WYKONANO
