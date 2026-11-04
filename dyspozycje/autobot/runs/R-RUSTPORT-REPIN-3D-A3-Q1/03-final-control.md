STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-3D-A3-Q1 (Final Control, runda 1, Opus 5.5)
GOAL: Partia A3 z `P4-REPIN-3D.md` (symbole #10, #11 oraz dryf reguł oblężenia z A2 §8.4): `_destroyTowerAtRow`, `_fireSiegeTowers`/`_fireOneTower` (pocisk wieżyczki) oraz wyłom muru, palisady i bramy palisady w `rust-port/renderer/src/battle/`, bit w bit z uruchomionym webem `origin/main`.

ZMIANY/COMMIT:
- Oceniane: `585ee848d` (kod, testy, wektory, dokument) + `e160a0ee4` (raport Operatora). Baza (merge-base) `65e81ae4d`. Web `origin/main` = `86d510c66` (bez zmian od dispatchu).
- `git diff --name-only 65e81ae4d e160a0ee4`: 20 plików, wszystkie z allowlisty (`siege_towers.rs`, `dynamics.rs` — tylko nowe `breach_wall_tile_fort`, `mod.rs`, `tests/repin3d_a3.rs`, `tests/repin3d_fixtures/{gen_a3.ts,a3.json,a3_web_inputs.txt,mutate_a3.py,README.md,MANIFEST.sha256}`, `P4-REPIN-3D.md`, `runs/R-RUSTPORT-REPIN-3D-A3-Q1/**`). Brak zmian w `units.rs`, `Cargo.*`, `gra/**`, `engine/**`, `src-tauri/**`, `WERSJE.md`, `gra-robocza/**`, `src/{units,cities,overlays,models}/**`.
- `git diff --check 65e81ae4d e160a0ee4`: czysto.
- Ten raport: commit na gałęzi lokalnej `fc/R-RUSTPORT-REPIN-3D-A3-Q1` (rodzic `e160a0ee4`).

WERYFIKACJA KODU (samodzielna, `git show 86d510c66:gra/src/battle/battleScene.ts`):
- `_destroyTowerAtRow` (:4089-4095) ↔ `destroy_tower_at_row`: `find` pierwszej żywej w rzędzie, `destroyed = true`, `mesh.visible = false`, tekst logu identyczny.
- `_fireSiegeTowers` (:4103-4116) ↔ `fire_siege_towers`: strażniki `finished` / pusta lista / brak `towerShooterRow`, pominięcie zburzonych, burzenie przy braku HP kafla bez zwiększania staggera, stagger 0, 180, 360…
- `_fireOneTower` (:4118-4161) ↔ `fire_one_tower` + `tower_shot_endpoints` + `tower_projectile_kind`: `from = (x − TILE_S·0,5, 4,2, z)`, `to.y = tileTopY + 0,5`, `projectileKind` z `kategoria = Typ ?? 'Distance'` i nazwą `s['Jednostka'] ?? 'Wieza (' + nazwa + ')'` (`projectileKind` :1616-1626), kwaternion przez istniejące `launch_projectile`, `blow_delay = RANGED_FLY_MS`. Wybór celu i obrażenia jako DTO (P6.13) — zgodnie z dispatchem.
- `_breachWallTile` (:7553-7563): web burzy wieżyczkę przed etykietą i ukryciem segmentu; Rust `breach_wall_tile_fort` burzy przed `breach_wall_tile` — kolejność efektów sceny równoważna.

BRAMKI (odtworzone przeze mnie, CARGO_INCREMENTAL=0, debug=0):
1. Drzewo `e160a0ee4` (sama A3):
   - `cargo fmt --all -- --check`: EXIT=0
   - `cargo clippy --locked --all-targets -- -D warnings`: EXIT=0
   - `cargo test --locked --no-fail-fast`: passed=448 failed=0 binaries=59, EXIT=0 (baza 444 + 4)
2. Próbny merge na AKTUALNYM `origin/rust-port/parity-v2` = `0eefb3a00` (po B1 i B2+B3), konflikt w dokumencie rozwiązany tymczasowo stroną `ours` (dokument nie wpływa na build), merge porzucony (`git merge --abort`), nic nie zacommitowano:
   - fmt EXIT=0, clippy EXIT=0
   - `cargo test --locked --no-fail-fast`: passed=460 failed=0 binaries=61, EXIT=0 (parity-v2 456 + A3 4)
   - MSRV `cargo +1.87.0 test --locked --test repin3d_a3 --test repin3d_a2 --test repin3d_a1`: 3 + 4 + 6 ok, EXIT=0
   - `sha256sum -c MANIFEST.sha256`: 13 OK; `sha256sum -c MANIFEST_B.sha256`: 29 OK (fixtury A i B współistnieją).
- Mutacje (30/30) i niezależny generator (`a3.json` 452f127e… w 2 katalogach) — przyjmuję na podstawie logów Operatora (`dowody/`) i niezależnego powtórzenia przez Evaluatora; nie powtarzałem (zasoby dyskowe ~4 GB).
- Ocena wizualna GPU: NIE_ZMIERZONO (brak `/dev/dri`; dispatch: nie blokuje).

ORZECZENIA (Evaluator: `zarzuty: []`, 3 notatki; Obrona: brak):
- N1 — konflikt `## 9.` w `P4-REPIN-3D.md` z partią B: ODDAL jako wadę pracy (równoległe partie, przewidziane w dispatchu). Instrukcja integracji niżej. Stan na `0eefb3a00`: §9 = B1, §10 = B2+B3, więc A3 musi stać się **§11** (a nie §10, jak sugerował Evaluator przy starszej bazie `8d74519c2`).
- N2 — brak odpowiednika `if (!tiles) return;` przed burzeniem wieżyczki: ODDAL. `TerrainGrid` w Rust zawsze ma kafle, gałąź jest nieosiągalna; zachowanie dla wszystkich osiągalnych stanów identyczne.
- N3 — zbyt mocne sformułowanie o równoważności mutanta „Wieza (J)” w §9.3: ODDAL. To tylko opis mutanta w dokumencie; kod przekazuje `J` dokładnie jak web, a wektory to potwierdzają. Orkiestrator może przy integracji złagodzić zdanie („równoważny dla wektorów”), ale nie jest to warunek.
Brak NAPRAW, brak DO DECYZJI CZŁOWIEKA → PASS.

INTEGRACJA (dla orkiestratora):
- SHA końcowy do integracji: commit tego raportu na `fc/R-RUSTPORT-REPIN-3D-A3-Q1` (rodzic `e160a0ee4`; kod `585ee848d`).
- Kolejność: `origin/rust-port/parity-v2` @ `0eefb3a00` (B1 + B2/B3 już zintegrowane) → merge A3 (`--no-ff`) na wierzch. A3 nie ma zależności od B; pliki kodu rozłączne.
- Jedyny konflikt: `dyspozycje/rust-port/p4/P4-REPIN-3D.md`. Rozwiązanie: zachować §9 (B1) i §10 (B2+B3) z parity-v2, dopisać sekcję A3 jako **§11** (podsekcje 11.1–11.6, odwołania „§9.x” w tekście A3 przenumerować na „§11.x”), scalić statusy #10/#11 i kolejkę w §3 z obu stron (A3: #10, #11 = DONE; statusy B z parity-v2 bez zmian). Po rozwiązaniu: `grep -n '^<<<<<<<\|^>>>>>>>' P4-REPIN-3D.md` pusty, `git diff --check` czysty, bramki jak w pkt 2 (oczekiwane 460/0/61).

TESTY: jak w BRAMKACH wyżej.
BLOKADY: brak.
RUNDY: 1/5
NASTĘPNY KROK: integracja orkiestratora do `rust-port/parity-v2` (merge na `0eefb3a00` z ręcznym rozwiązaniem §11), potem `READY_FOR_DEPLOY` wyłącznie przez orkiestratora.
DEPLOY/PUSH: NIE WYKONANO

Sprzątanie: `rust-port/renderer/target` w worktree FC usunięty jawną ścieżką; próbny merge porzucony; logi bramek w scratchpadzie sesji (poza repo).
