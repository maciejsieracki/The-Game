STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-36-MOD14-BATTLE-3D-Q5
GOAL: MOD-14 część 5 (picking i kamera) — port 1:1 do `rust-port/renderer/src/battle/` symboli sceny 3D części 5 z inwentarza, bit w bit z webem (pin `edb8fb56`, three@0.169.0); ostatnia część MOD-14.

ZMIANY/COMMIT: `7f68dd50` na bazie `5d900606` (= `origin/rust-port/parity-v2`), worktree, jawne `git add`.
- nowe: `src/battle/view.rs` (kamera: zoom, panorama, clamp, `_syncRendererSize`, rzuty, promień z kursora, minimapa, przeciąganie), `src/battle/picking.rs` (`intersectObjects` three r169: Mesh/grupy/side, InstancedMesh, Line, Sprite; picking terenu, jednostki, kliknięcia rozstawienia/bitwy, `_handleDeployUnitPick`, box-select, `H`); `battle/mod.rs` tylko 2× `pub mod`;
- `tests/battle3d_picking.rs`; fixtury `picking.json` (81 669 B), `gen_picking.ts`, `build_picking.mjs`, `mutate_picking.py`, README „Part 5”, MANIFEST (24);
- P4-36 §39–§48 (sam dopisek, 0 linii usuniętych); `runs/…-Q5/dowody/` (bramy, recon, dryf).
Poza allowlistą: 0 plików. `gra/**`, `Cargo.*`, inne moduły bez zmian.

TESTY (`dowody/tests-impl-r1.txt`):
- stable 1.97.0: fmt EXIT=0; clippy `--lib --test battle3d_picking -D warnings` EXIT=0; `--lib battle::` 20 passed; `battle3d_picking` 6 passed (1 441 promieni, 176 kroków kamery, 94 kliknięcia, 13 prostokątów, 6× `H` — 0 różnic); części 1–4: 3+5+8+5 passed;
- 1.87.0: `--lib battle::` 20 passed, `battle3d_picking` 6 passed;
- MANIFEST 24/24 OK; fixtury 11 971 697 B (≤ 12 MB), największy plik bez zmian;
- determinizm generatora: 2 katalogi → identyczne `picking.json` i bundel;
- recon: 34 wiersze, 0 bez statusu; dryf po pinie: 37/38 symboli bez zmian, `dispose` zmieniony (poza portem);
- mutacje: 62 przygotowane, próba 5/5 KILLED (luka `groups ignored` → nowy test jednostkowy). Pełny przebieg = „pomiary”.

BLOKADY: brak. NIE_ZMIERZONO: ocena wzrokowa (§46, GPU), pełne mutacje i `--all-targets [--features gpu]` (wywołanie „pomiary”). Uwaga procesowa: jedno polecenie próby mutacji przekroczyło domyślny limit 120 s narzędzia i zostało przeniesione w tło przez środowisko; odczekane w pierwszym planie (`tail --pid`), źródła zweryfikowane jako przywrócone. Obserwacje weba W-22…W-27 (m.in. brak orbity kamery, `_onBattleClick` nie filtruje `removed`).

RUNDY: 1/5
NASTĘPNY KROK: Operator „pomiary” (mutate_picking.py na 1.87.0, pełne bramy 1.87.0/stable), potem Evaluator → Obrona → Final Control.
DEPLOY/PUSH: NIE WYKONANO
