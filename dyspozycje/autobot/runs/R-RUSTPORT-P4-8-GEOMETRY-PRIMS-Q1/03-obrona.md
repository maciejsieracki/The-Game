STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-8-GEOMETRY-PRIMS-Q1
GOAL: RR-T4 — biblioteka prymitywów geometrii w `rust-port/renderer/src/geom/**` zgodna numerycznie z Three.js r169 (wierzchołki, normalne, UV, indeksy, grupy) + TRS, merge, normalne. Czysty CPU.
ROLA: Operator (obrona), Opus 5.5 medium. Baza: commit Operatora `8b907906` (rodzic `0a496f67`, ANC_OK).

ZMIANY/COMMIT (allowlista):
- `rust-port/renderer/tests/fixtures/geom/gen_fixtures.mjs` — rodzina `curve` (`dumpCurve`: `getPoint(t)`/`getTangent(t)` bez tuby).
- `rust-port/renderer/tests/fixtures/geom/curve.json` (NOWY, 4 przypadki, Three 0.169.0), `PROVENANCE.md` (format `curve.json`).
- `rust-port/renderer/tests/geom_three_parity.rs` — test `parity_curve`, helper `curve_of` (współdzielony z `tube`).
- `dyspozycje/rust-port/p4/P4-8-GEOMETRY-PRIMS.md` — §1.1 w. 14 i 23, skrót wyniku, §4.3 skrypt odświeżony, §6, nowy §7 (obrona + pełne surowe logi).
- Bez zmian: `src/geom/**`, `Cargo.toml`, `Cargo.lock`, `lib.rs`, `.github/**`, `gra/**`.

ZARZUTY:
1. §1.1 w. 23 `scale` „—”: PRZYJMUJĘ. `git grep -cE '\.scale\(' edb8fb56 -- gra/src` → brak trafień, EXIT=1 → wpisano 0 z komendą.
2. `scene.ts:441` (`CatmullRomCurve3(points,false,'catmullrom',0.5)`, `getPoint`/`getTangent` bez tuby) nieopisany i bez fixture: PRZYJMUJĘ. Opis w §1.1 w. 14; fixture `curve.json` (`estuary_catmullrom_05` = parametry webu, 80 podziałów = 5·16; `two_points_catmullrom_05`; `estuary_centripetal`; `closed_catmullrom_05`). Wynik: catmullrom 0.5 bit w bit (max |Δ| = 0), centripetal punkt 2.2e-16 / styczna 6.3e-13.

TESTY (pełne surowe logi: dokument §7.3):
- `cargo fmt --all -- --check` EXIT=0; `cargo clippy --locked --all-targets -- -D warnings` EXIT=0; `cargo test --locked --all-targets` EXIT=0 (geom_three_parity 17/17, cpu_sanity 1/1).
- Powtórna generacja ze świeżo rozpakowanego tarballa (sha256 `c86d0937…3ec71`): 94 przypadki, 14/14 plików JSON bajtowo identycznych z repo.
- Mutacja `curve.json` (+1e-5 w stycznej): `parity_curve` FAILED (EXIT=101), plik przywrócony (`cmp` OK).

BLOKADY: brak. NIE_ZMIERZONO: wydajność, Windows/macOS (bez zmian względem Operatora).
RUNDY: 1/5
NASTĘPNY KROK: Final Control (Opus 5.5 medium).
DEPLOY/PUSH: NIE WYKONANO
