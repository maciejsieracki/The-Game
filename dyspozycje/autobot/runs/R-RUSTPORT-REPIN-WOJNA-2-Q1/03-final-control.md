STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-WOJNA-2-Q1
GOAL: Final Control rundy 1 (U1 formationRules, U2 battle-mode) na c5cbde7e wobec weba dc8a3adc.
ZMIANY/COMMIT: FC zapisuje tylko ten plik. Kod Rust bez zmian od 6a71fcb6 (kod Operatora 3d744de8 U1, 2117c4bf U2; dokumenty 9a16b238, 6a71fcb6, c5cbde7e). Allowlista: git diff --name-only a8083660..c5cbde7e tylko dozwolone sciezki (brak gra/**, renderer, src-tauri, Cargo.toml, WERSJE.md).
TESTY (wlasne, FC): wektory regenerowane z weba dc8a3adc (git archive gra/src gra/data poza repo): cmp battle-mode.json SAME, formation-rules.json SAME (2257971 B < 10 MB). cargo fmt --check EXIT=0; clippy -D warnings EXIT=0; cargo test --no-fail-fast EXIT=0, 1446 passed / 0 failed. git diff --check czysty.
ROZSTRZYGNIECIE ZARZUTOW:
1. Zakres U3/U4 + integracja zapisu = NASTEPNA-PARTIA: ODDAL (zgodne z dispatchem; runda 2+ pod tym samym ID).
2. Cytowanie battle-mode.ts :9-14: ODDAL (funkcja 9-14, klamra w wierszu 14; ujednolicone w c5cbde7e).
3. Mutant .max(0.0) top_available: ODDAL (rownowazny: formation_rules.rs:393-395 vs formationRules.ts:107-109; wing_count = max(1, min(3,top,bottom)) daje 1 dla top<0; dowod w dossier).
4. NaN/inf rankWidth: ODDAL (zmierzone na webie, poza domena wejsc produkcyjnych - stale battleScene.ts; ZALOZENIE Z-4 w dossier).
Brak NAPRAW, brak DO DECYZJI CZLOWIEKA.
BLOKADY: brak
RUNDY: 1/5 (temat otwarty: U3 generals.rs, U4 general_quick_follow.rs, integracja zapisu)
NASTEPNY KROK: integracja c5cbde7e (+ ten commit) do rust-port/parity-v2 (baza a8083660, jest przodkiem; fast-forward/merge bez konfliktow w allowliscie), potem runda 2 U3.
DEPLOY/PUSH: NIE WYKONANO

---
## RUNDA 2 (Final Control)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-WOJNA-2-Q1
GOAL: Final Control rundy 2 (U3 generals, U4 general_quick_follow) na e3ddd301 (kod 882a8020), pin weba dc8a3adc.
ZARZUTY:
1. P6 linia 52 sprzeczna: ODDAL (naprawione w e3ddd301; linia oznaczona historyczna, odsylacz do Runda 2).
2. Zakres r2 czesciowy (generalTargetId/save, battle-mode z zapisem): ODDAL (NASTEPNA-PARTIA, status tematu OTWARTY, P6 l.80-85; runda 3 wymaga allowlisty +pathfinding.rs, save_load.rs).
3. locale_compare poza ASCII: ODDAL (ZALOZENIE (e) w generals.rs i P6; zmierzone; id produkcyjne ASCII).
4. Pelny cargo test: ODDAL (odtworzone przez FC).
Zadnego NAPRAW.
TESTY (FC, samodzielnie, worktree na e3ddd301):
- git diff --name-only cb57e479 e3ddd301: tylko allowlista; zero gra/**, renderer, src-tauri, Cargo.toml, WERSJE.md. git diff --check czysty.
- cargo fmt --all -- --check EXIT=0
- cargo clippy --all-targets -- -D warnings EXIT=0
- cargo test --no-fail-fast EXIT=0, 1459 passed / 0 failed, 198 wierszy test result, 0 FAILED.
BLOKADY: brak.
RUNDY: 2/5
NASTEPNY KROK: integracja e3ddd301 (+ ten commit) na rust-port/parity-v2; runda 3 pod tym samym ID z rozszerzona allowlista.
KOLEJNOSC: baza cb57e479; origin/rust-port/parity-v2 (1aba22f7) ma 9 nowszych commitow M06B1 (mapgen/landsea.rs, data/derived.rs, mapgen-coast.json, p6_m06b1_*), rozlacznych z plikami r2 (mod.rs nietkniety po stronie parity-v2). Integrowac PO obecnym HEAD parity-v2; po integracji powtorzyc bramki.
DEPLOY/PUSH: NIE WYKONANO

---

## Runda 3 — Final Control (Sonnet 5.5)

STATUS: PASS-WITH-NOTES (temat OTWARTY; runda 4/5 wymagana: wpięcie logiki R3 + decyzja Z-R3-4)
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-WOJNA-2-Q1
Weryfikowany HEAD: 47b1cd109 (detached). Baza: 9e56f6e3c (przodek origin/rust-port/parity-v2).

Bramki odtworzone samodzielnie (rust-port/engine, CARGO_INCREMENTAL=0, DEBUG=0):
- cargo fmt --all -- --check: EXIT=0
- cargo clippy --all-targets -- -D warnings: EXIT=0
- cargo test --no-fail-fast: EXIT=0, 220 wierszy "test result", 1591 passed / 0 failed
- git diff --check 9e56f6e3c..47b1cd109: czysty
- Allowlista: tylko generals.rs, battle_mode.rs, pathfinding.rs, tests/p6_4_march.rs (addytywnie), tests/p6_repin_wojna_2_r3_* + wektory, P6-REPIN-WOJNA-2.md, run. Zero gra/, renderer/, src-tauri/, Cargo.toml, WERSJE.md.
- Obrona 4e6c899c1: tylko debug_assert!(n < 64) + komentarz; brak zmiany zachowania.

Rozstrzygnięcie zarzutów:
1. Brak meta.battleModeSettingVersion w save_load.rs: ODDAL (Obrona rozstrzygnęła ZAŁOŻENIEM Z-R3-4, dossier l.138/204; wpięcie to zmiana formatu SnapshotV2, runda 4).
2. Status PORTOWANE bez wpięcia: ODDAL (naprawione w obronie: "PORTOWANE (logika, bez wpięcia)" w wierszach 14-16, 114-121).
3. Sortowanie V8 n>=64 / nie-ASCII: ODDAL (Z-R3-1 rozstrzygnięte kodem weba: <=3 generałów; debug_assert dodany; nie-ASCII NIE_ZMIERZONO, jawnie).
4. Z-P-1 kolejność kluczy: ODDAL (zmierzone, NIE-DOTYCZY dla id produkcyjnych z prefiksem).
Zero NAPRAW. Brak DO DECYZJI CZŁOWIEKA.

Integracja: merge-tree 47b1cd109 z aktualnym origin/rust-port/parity-v2 (e03a10fdb) bez konfliktów; parity-v2 nie dotknął plików kodu R3 od 9e56f6e3c. Kolejność: integrować na parity-v2 e03a10fdb. SHA końcowy do integracji: commit tego dokumentu na bazie 47b1cd109.
DEPLOY/PUSH: NIE WYKONANO
