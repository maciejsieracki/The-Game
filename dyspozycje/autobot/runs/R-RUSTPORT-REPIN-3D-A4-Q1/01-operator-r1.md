STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-3D-A4-Q1
ROLA: Operator (Opus 5.5) · worktree `wf_d74f9aed-5b2-1`, gałąź `rust-port/repin3d-a4-q1` od `parity-v2` @ `54c481e81`
GOAL: REPIN-3D A4 — (1) wektory cz. 3 (`units.json`) na nowym szyku `_placeUnits`; (2) konstruktor sceny z `fortKind`
(Z-RP-A2-2); (3) Milicja i wieża oblężnicza: pomiar i DTO sceny; (4) zgłoszenie właściciela (backlog pkt 3) odnotowane.
Web = `origin/main` `86d510c66` (zmierzony na starcie i na końcu).

ZMIANY/COMMIT: `8db7a9d04` (kod + fixtury + dowody), raport w commicie następnym (SHA w odpowiedzi Operatora).
- `src/battle/units.rs`: `build_battle_scene_with_units_fort(opts, &FortDto)` (`battleScene.ts:2678`, `:3410-3428`:
  `place_siege_wall_fort` = mur/palisada + `_placeSiegeTowers`); stara funkcja deleguje z `FortDto::none()` (Z-RP-A4-1:
  nowe pole w `BattleUnitsOpts` łamałoby `battle3d_dynamics`/`picking` spoza allowlisty). `mod.rs`: wiersz tabeli.
- `tests/fixtures/battle3d/units.json` zregenerowany NIEZMIENIONYM `gen_units.ts` (Z-RP-A4-2 jak Z-RP-B-1): diff tylko
  `ctor/*/{spawn,units,moves,posts,scene}` (10/11; `direct`, `consts`, `wall`, `tilesRle` identyczne); kod sceny bez
  zmian przechodzi — „scena bez zmian” potwierdzone. README/MANIFEST cz. 3.
- `tests/repin3d_fixtures/{gen_a4.ts,a4.json,a4_web_inputs.txt,mutate_a4.py}` + README/MANIFEST; test
  `battle3d_units::fort_militia_siege_tower_constructor_matches_web` (19 konstruktorów: fortKind none/palisada/mur/fort/
  oba/wielkość liter, 5 civ, deploy+reset, wspinaczka; Milicja epoki 1–3, 0/3/4/5/6/7; 6× wieża oblężnicza; brzeg: fort
  bez oblężenia = brak muru).
- Pomiar (3): Milicja w bitwie = zwykły wiersz `units.json`, `kategoria 'domyslny'` (`siegeDefenders.ts:261,:320`,
  `main.ts:30344`); brak modelu/ikony „Milicja” w `battle/**`/`render/**` (`'Milicja'` tylko `militiaDefRecord` `:135`,
  bez wywołań) → zero kodu sceny. Wieża oblężnicza: `render/units.ts:1661`→`buildSiegeTower`; `isSiegeTower` istniał w
  pinie (LB) — dryf modelu 0. Hunki reguł (P6.13) i ZGŁOSZENIE WŁAŚCICIELA (backlog pkt 3 → REPIN po naprawie weba;
  niezatwierdzonej logiki nie portowano): `P4-REPIN-3D.md` §12.5. Dokument: nowy §12 (+ statusy #12, A4, nagłówek).

TESTY (surowe logi `dowody/`):
- `cargo fmt --all -- --check` EXIT=0; `cargo clippy --locked --all-targets -- -D warnings` EXIT=0
- `cargo test --locked --no-fail-fast` passed=461 failed=0 binaries=61 EXIT=0 (baza 460)
- `cargo +1.87.0 test --locked --test battle3d_units --test battle3d_dynamics --test battle3d_picking` 9+8+5 EXIT=0
- `mutate_a4.py` KILLED 15/15 (10 gałęzi A4 + 5 dowodowych routingu modeli, przywrócone)
- weryfikator: 3 katalogi `mktemp -d` (2 pełne, 1 = 167 plików 6,3 MB): `units.json` 4242bc10…, `a4.json` 75c00498… ×3 = repo
- `sha256sum -c` 17 + 24 OK; `git diff --check` czysty. GPU: NIE_ZMIERZONO (brak `/dev/dri`).
- Kopie weba i `rust-port/renderer/target` usunięte jawnymi ścieżkami.

BLOKADY: brak.
RUNDY: 1/5.
NASTĘPNY KROK: Evaluator R-RUSTPORT-REPIN-3D-A4-Q1 (runda 1).
DEPLOY/PUSH: NIE WYKONANO
