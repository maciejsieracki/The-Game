STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-3D-A4-Q1
GOAL: Final Control rundy 1 partii A4 REPIN-3D: wektory cz. 3 (`units.json`) na nowym szyku, konstruktor z `fortKind`
(`build_battle_scene_with_units_fort`), Milicja i wieża oblężnicza jako DTO, odnotowanie backlogu weba pkt 3.

ZMIANY/COMMIT:
- Ocenione: `8db7a9d04` (kod/fixtury), `351f58851` (raport Operatora), `7c35d3aa4` (obrona: 1 linia §12.3 + `02-operator-obrona-r1.md`).
  Ten raport: commit FC na gałęzi `rust-port/repin3d-a4-q1-fc` (rodzic `7c35d3aa4`).
- Allowlista: `git diff --name-only 54c481e81...7c35d3aa4` = 23 pliki, wszystkie w `rust-port/renderer/src/battle/{mod,units}.rs`,
  `tests/battle3d_units.rs`, `tests/fixtures/battle3d/{units.json,README.md,MANIFEST.sha256}`, `tests/repin3d_fixtures/{gen_a4.ts,a4.json,a4_web_inputs.txt,mutate_a4.py,README.md,MANIFEST.sha256}`,
  `P4-REPIN-3D.md`, katalog runu. `git diff --stat 54c481e81 7c35d3aa4 -- gra engine src-tauri WERSJE.md gra-robocza Cargo.* src/{units,cities,overlays,models,raster}` = pusto.
  `git diff --check` czysty.

ORZECZENIA:
- **Z1 (dowód `grep -i milicj` w §12.3) — ODDAL (naprawione w obronie).** Sprawdzone samodzielnie:
  `git grep -n -i milicj 86d510c66 -- gra/src/battle gra/src/render` = 1 trafienie `gra/src/battle/mapFieldBattle.ts:294`;
  `render/units.ts:399` = `COLOR_INDIGO … generic militia tunic`. Diff `351f58851..7c35d3aa4` w `P4-REPIN-3D.md` = dokładnie ta 1 linia, treść zgodna z pomiarem.
- Uwaga (a) Evaluatora (`militiaArmy` w `gen_a4.ts` przybliża `runtimeToBattleUnit`) — ODDAL: pola pominięte (`__canonical*HP`, `*BonusFrac`) nie wchodzą do DTO sceny (model, kategoria, `hp`/`maxHp` paska); nie jest to zarzut i nie zmienia wektorów sceny. Precyzowanie komentarza nagłówka — kosmetyka, nie blokuje.
- Uwaga (b) (sprawdzenie `fortKind` w `compare_fort` prawie tautologiczne) — ODDAL: realną zgodność zapewniają rzędy, indeks w korzeniu, sygnatura i pozycje wieżyczek oraz asercja generatora `fortKind == cityFortificationKind`; mutant Evaluatora (`siege_towers.rs:314`) zabity wyłącznie przez nowy test.
- Brak zarzutów NAPRAW, brak decyzji produktowych.

TESTY (FC, samodzielnie, na PRÓBNYM merge `7c35d3aa4` → `origin/rust-port/parity-v2` @ `0035f7d40`, nie zacommitowanym):
- `cargo fmt --all -- --check`: EXIT=0
- `cargo clippy --locked --all-targets -- -D warnings`: EXIT=0
- `cargo test --locked --no-fail-fast`: passed=464 failed=0, 62 binarki, EXIT=0 (parity-v2 = 463 + 1 nowy `fort_militia_siege_tower_constructor_matches_web` ok)
- `cargo +1.87.0 test --locked --test battle3d_units --test battle3d_dynamics --test battle3d_picking`: 9 + 8 + 5, EXIT=0
- `sha256sum -c`: `fixtures/battle3d/MANIFEST.sha256` 24 OK (po przeliczeniu hasha scalonego README), `repin3d_fixtures/MANIFEST.sha256` 17 OK, `MANIFEST_B.sha256` 32 OK.
- `origin/main` (`ls-remote`) = `86d510c66` = pin pomiaru A4. Generatora nie odtwarzałem ponownie (Evaluator: bit w bit w osobnym `mktemp -d`; Operator: 3 katalogi).
- GPU: NIE_ZMIERZONO (brak `/dev/dri`). `rust-port/renderer/target` usunięty.

INTEGRACJA (kolejność względem `origin/rust-port/parity-v2`):
- `parity-v2` przesunął się z bazy `54c481e81` na `0035f7d40` (B4 `2962d0a7b`, A6 `df4e4ede8`…`0035f7d40`). A4 merge'ować JAKO NASTĘPNY na `0035f7d40`: `git merge --no-ff <SHA FC>` (zawiera `8db7a9d04`, `351f58851`, `7c35d3aa4`, commit FC).
- Konflikty mechaniczne (2 pliki), rozwiązanie:
  1. `rust-port/renderer/tests/fixtures/battle3d/MANIFEST.sha256` — linia `README.md`: przelicz `sha256sum README.md` po auto-scaleniu README (oba akapity B4/A6 i A4 zachowane).
  2. `dyspozycje/rust-port/p4/P4-REPIN-3D.md` — zachowaj obie strony: nagłówek z liniami B4 i A4; §12 (A4) PRZED §13 (B4) i §14 (A6) — numer §12 był zarezerwowany dla A4; bloki dowodów obu stron zachowane. Numeracji istniejących § nie zmieniać.
- Po merge: ponownie fmt/clippy/test (oczekiwane 464/0) i `sha256sum -c` trzech manifestów.

BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: integracja orkiestratora na `rust-port/parity-v2` @ `0035f7d40` → READY_FOR_DEPLOY (wystawia orkiestrator).
DEPLOY/PUSH: NIE WYKONANO
