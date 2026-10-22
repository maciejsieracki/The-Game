STATUS: PASS

DOMAIN: GAME

TEMAT: R-RUSTPORT-P4-21-MOD09-CITIES-Q1

GOAL: MOD-09 (`P4-4-MODEL-CATALOG.md`): modele miast i osad w Rust, bitowo zgodne z uruchomionym kodem weba (`edb8fb56`), `jsmath`, reużycie `core` bez kopii, drzewo modelu `unit_core::model`.

ZMIANY-COMMIT: Final Control nie zmienia kodu. Łańcuch (worktree `wf_33be5035-445-4`, bez push), na `origin/rust-port/parity-v2` @ `2a45e340`:
`e1d6b809` (kod r1) -> `577bee7b` (dok r1) -> `786cacdd` (poprawki r2) -> `842ad04e` (dok r2) -> `18bca6c3` (cherry-pick `4eed1349`, raport Evaluatora r1, który był tylko na starej gałęzi) -> commit tego raportu.
Allowlista: 20 plików względem `2a45e340`, wszystkie w allowliście; `git diff --check` czysty.

ORZECZENIA (na podstawie kodu i przebiegów FC, nie deklaracji Obrony):
1. Kopie `core::hex_shape` — ODDAL (usunięte). `model.rs` importuje `append_pointy_top_hex` i `hex_ring_points_xz`; grep w `src/models/cities` nie znajduje żadnej kopii. `core/hex_shape.rs` liczy przez `js_cos`/`js_sin`, kolejność narożników i `moveTo/lineTo/closePath` są identyczne z `hexShape.ts:17-32` oraz z dawnym `tracePointyTopHex`. Mutacja FC1 (promień otworu × 1.0000001) wykryta: 380 rozbieżności.
2. Liczba binarek — ODDAL (poprawione). P4-21 §8.1 mówi teraz 18 dla r1. Przebieg FC na `842ad04e` daje 21 binarek i 129 testów, zgodnie z Obroną.
3. Powtórzona wysokość terenu — ODDAL (usunięte). `terrain_top_y` deleguje do `core::map_style::terrain_surface_top_y(.., 0.0)`. `cities.ts:71-79 CIV_TERRAIN_HEIGHT` i `mapRenderStyle.ts:324-333 CIV_TERRAIN_VIS` są identyczne, a `+ 0` nie zmienia bitów (wynik nigdy nie jest `-0`). Test jednostkowy porównuje wszystkie 8 terenów. Mutacja FC2 (`extra = 1e-12`) wykryta: 500 rozbieżności w rendererze i 34 w legacy.

Uwaga (nie zarzut): P4-21 §5, l.116 opisuje M22 historycznie w kontekście r1. Jest to aktualne w §10 i nie blokuje.

TESTY (FC, czysty `CARGO_TARGET_DIR`, `842ad04e`):
- `cargo fmt --all -- --check`: EXIT=0
- `cargo clippy --locked --all-targets -- -D warnings`: EXIT=0; z `--features gpu`: EXIT=0
- `cargo test --locked --all-targets`: EXIT=0, 21 binarek, 129 testów, 0 nieudanych
- `cities_web_parity --nocapture`: 5/5, 0 rozbieżności (192 347 / 616 / 27 035 / 992 / 57)
- Fixtury `models.json`/`renderer.json`: SHA-256 = P4-21 §6 (`023c3540…`, `7d292864…`), bez zmian od r1 (Evaluator r1 odtworzył je bajtowo z weba).
- Próbka względem funkcji weba: niezależny skrypt node v22.22.0 z formułą `hexRingPointsXZ` (`hexShape.ts:7-14`, `HEX_R = 1.0` z `hexutil.ts:24`, `Math.fround`, lift 0.5+0.085) daje bbox obwódki `[-0.9179869294166565, 0.585, -1.059999942779541, 0.9179869294166565, 0.5890000001899898, 1.059999942779541]`. Jest identyczny z `outlines[0].model.bbox` w fixturze, którą Rust spełnia bitowo.
- Sonda scalenia z aktualnym `origin/rust-port/parity-v2` @ `f1a1740c` (P4-22): automatyczne scalenie `models.rs` (cities/improvements/misc), bez konfliktów. fmt, clippy (z gpu i bez) i test mają EXIT=0: 22 binarki, 140 testów, 0 nieudanych. Scalenie było lokalne i zostało wycofane.

BLOKADY: brak. NIE_ZMIERZONO: ocena wzrokowa i GPU (P4-21 §7), dla właściciela po RR-T5.

KOLEJNOŚĆ INTEGRACJI: na `origin/rust-port/parity-v2` (`f1a1740c` lub nowszy) wziąć łańcuch `e1d6b809`, `577bee7b`, `786cacdd`, `842ad04e`, `18bca6c3` i commit FC, przez merge albo cherry-pick w tej kolejności. W `src/models.rs` mają zostać wszystkie linie `pub mod`. Commit `4eed1349` (stara gałąź) pominąć, bo jego treść jest w `18bca6c3`.

RUNDY: 2/5

NASTĘPNY KROK: integracja orkiestratora na `rust-port/parity-v2` i bramki po scaleniu, potem READY_FOR_DEPLOY.

DEPLOY/PUSH: NIE WYKONANO
