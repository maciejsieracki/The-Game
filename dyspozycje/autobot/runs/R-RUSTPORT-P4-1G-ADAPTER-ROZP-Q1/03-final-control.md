# R-RUSTPORT-P4-1G-ADAPTER-ROZP-Q1 — Final Control r1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (renderer, adapter DTO; rozpoznanie tylko do odczytu)
TEMAT: R-RUSTPORT-P4-1G-ADAPTER-ROZP-Q1
GOAL: rozpoznanie adaptera `renderer/src/view.rs` (#216): DTO → wejścia renderera → pin, blokady, podział na wdrożenia z allowlistą, NIE_ZMIERZONO.
ZMIANY/COMMIT: oceniany SHA obrony `513d473531daa786143baffce5725bce0b8e57fd`; commit FC na nim (ten plik). Diff względem bazy: 4 pliki .md (+ ten raport) z allowlisty dispatchu, zero `.rs`, zero `Cargo.*`, zero `gra/`.
TESTY: `git diff --check 2f9a12786 513d47353` czysty. Cargo nie uruchamiane — diff nie zawiera kodu (zmiany wyłącznie .md). Fakty kodowe zweryfikowane samodzielnie (niżej).
BLOKADY: brak dla rozpoznania. Blokady wdrożenia opisane w §6 dokumentu (B-DEP, B-DOC, producenci P4-1B/C/D/F, D-DTO-7, R1–R6, L1–L7).
RUNDY: 1/5 (FC po r1 Operatora + Evaluator FAIL + Obrona)
NASTĘPNY KROK: integracja orkiestratora (dokument na gałęzi dyspozycji), potem dispatch P4-1G-Q1-ADAPTER-CORE z allowlistą z §7 (w tym `renderer/Cargo.toml` — B-DEP).
DEPLOY/PUSH: NIE WYKONANO

## Baza i ancestry

- Baza: `origin/rust-port/parity-v2` = `2f9a12786d4056dc499037667edbcf8cb5041fb8` (zgodne z dispatchem i stanem zdalnym w chwili FC).
- Łańcuch: `2f9a12786` → `9d4f351c9` (Operator r1) → `ded3d0da0` (Evaluator) → `513d47353` (Obrona) → commit FC. Liniowy, baza jest przodkiem.

## Orzeczenia zarzutów

| # | Zarzut | Weryfikacja FC | Orzeczenie |
|---|---|---|---|
| 1 | `to_int32` istnieje (earcut.rs) | `grep -rn to_int32 rust-port/renderer/src` → 3 trafienia (`:793`, `:804`, `:805`); dokument §2 (l. 45), §7 Q1 (wyniesienie do `geom/js_num.rs`, allowlista z `earcut.rs`, `js_num.rs`, `geom/mod.rs`), §9 (korekta) poprawione | ODDAL (naprawione przez Obronę) |
| 2 | `top_y_at` istnieje | `pick/terrain.rs:303-308` `top_y_at`, `:410` `top_y.insert(… height + y_offset)`; pin `units.ts:222-225` + `:6515-6518` = `spec.height + spec.yOffset`. Dokument §3.6 (ZGODNE), §4 R1 (bez `topYAt`), §7 (Q5 niezależne od R1), §8 pkt 5 poprawione | ODDAL (naprawione) |
| 3 | `ray_to_unit` = port `pickUnitIdAt` | `pick/mod.rs:190-193` potwierdzone; dokument §3.5 (l. 117) i §4 R1 (tylko `UnitPickModel.meshes`) poprawione | ODDAL (naprawione) |
| 4 | `sync_worker_field_overlay(Option<f64>)` | `worker_field.rs:198-202` `Option<f64>`, `:169` `build_…(f64)`; pin `main.ts:15441` `syncWorkerFieldOverlay(scene, null, map, workedByOwner, ME())`. Dokument §2 (l. 40), §3 (l. 83, 143) ujednolicony | ODDAL (naprawione) |
| 5 | Komentarz `view.rs` vs D-DTO-1 | `view.rs:1-3` potwierdzone („computed from the engine GameState… PositionDto”); dokument §1 (l. 22) i §7 Q1 (przepisanie, `view.rs`/`lib.rs` w allowliście) | ODDAL (naprawione) |

Brak zarzutu NAPRAW, brak DO DECYZJI CZŁOWIEKA.

## Uwagi (nieblokujące)

- N1: tabela §3.1, wiersz `seed` (l. 58) nadal mówi „brak `ToInt32` w rendererze (§2)”. Precyzyjnie: brak **publicznego/wspólnego** `ToInt32` — prywatna funkcja jest w `earcut.rs`, co §2 i §7 już mówią. Rozwiązuje się samo w Q1 (wyniesienie do `js_num.rs`); poprawka słowna nie zmienia żadnej decyzji.
- N2: komentarz `pick/terrain.rs:304` cytuje nieaktualne `units.ts:6409-6412` (pin: `:6515-6518`) — odnotowane przez Obronę w §3.6, do poprawy przy Q2.

## Kryteria końca dispatchu

1. Tabela DTO → wejście → pin | BRAK | ROZBIEŻNE — §3 obecna.
2. Lista blokad — §6 obecna.
3. Podział na wdrożenia z allowlistą, bez wdrażania — §7 obecny, zero kodu.
4. NIE_ZMIERZONO — §8 i oznaczenia w tabeli obecne.

## Komendy FC

- `git fetch origin rust-port/parity-v2 && git rev-parse origin/rust-port/parity-v2`
- `git log --oneline 2f9a12786..513d47353`; `git diff --stat|--name-only|--check 2f9a12786 513d47353`
- `grep -rn to_int32 rust-port/renderer/src`; `sed -n 789,802p rust-port/renderer/src/geom/earcut.rs`
- `sed -n 300,310p rust-port/renderer/src/pick/terrain.rs`; `grep -n y_offset …/pick/terrain.rs`; `sed -n 188,194p rust-port/renderer/src/pick/mod.rs`
- `grep -rn "fn sync_worker_field_overlay\|fn build_worker_field_overlay" -A5 rust-port/renderer/src`; `sed -n 1,4p rust-port/renderer/src/view.rs`
- `git show 07d2fbd72:gra/src/main.ts | sed -n 15441p`; `git show 07d2fbd72:gra/src/render/units.ts | sed -n '222,225p;6515,6518p'`
- `grep -n` w dokumencie dla każdego z 5 zarzutów.
