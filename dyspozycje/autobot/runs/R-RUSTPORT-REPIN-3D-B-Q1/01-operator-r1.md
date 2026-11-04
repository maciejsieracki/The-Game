STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-3D-B-Q1
GOAL: REPIN-3D partia B — modele i nakładki mapy z `origin/main` (`gra/src/render/*`) do modułów Rust renderera; w r1 partia B1, reszta jako kolejka B2…B4 (`dyspozycje/rust-port/p4/P4-REPIN-3D.md` §9).

ZMIANY/COMMIT:
- Baza: `rust-port/parity-v2` @ `65e81ae4d` (renderer 444/0). Web: `origin/main` @ `86d510c66`. Gałąź robocza `rp-repin3d-b-q1`.
- `cb00afecd` (kod, partia B1): nowy `src/models/misc/build_highlight.rs` (stałe `buildHighlight.ts:2-10`, `filter_build_highlight_hexes`, `js_num`); `models/misc/range.rs` `MINE_ELIGIBLE_TINT_OPACITY` 0,30 → `MINE_BUILD_HIGHLIGHT_OPACITY` (0,3×1,2); `models/improvements/registry.rs` `FORT_OUTPOST_MODEL_SCALE`=2 (sektor ×0,5×2); `models/improvements/zasoby.rs` `RESOURCE_MODEL_SCALE`=2 → `userData.depositDisplayScale` (koń 4, reszta 2); `tests/repin3d_b1.rs`, `tests/repin3d_fixtures/{gen_b1.ts,b1.json,mutate_b1.py,README_B.md,MANIFEST_B.sha256}`; zregenerowane fixtury pinu `tests/fixtures/improvements/{models,sigs}.json`, `tests/fixtures/misc/overlays.json`.
- Commit dokumentacji (P4-REPIN-3D.md §2.3/§3/§9 + ten raport + `dowody/`): SHA w odpowiedzi Operatora (commit zawiera ten plik, więc nie może podać własnego SHA).
- Ścieżki wg pomiaru: wszystkie symbole B1 leżą w `src/models/**` (nie w `overlays.rs`/`decor`). `units/**`, `cities/**`, `battle/**`, `Cargo.*`, `gra/**` bez zmian.
- **Z-RP-B-1 (poza allowlistą, uzasadnione):** fixtury JSON pinu w `tests/fixtures/{improvements,misc}` zregenerowane ich WŁASNYMI niezmienionymi generatorami na `origin/main` — bez tego `cargo test` czerwony (zmiana obrazu). Pliki `.rs` testów nietknięte. Diff = wyłącznie oczekiwane przypadki (§9.2). README tych fixtur nieedytowane (SHA `overlays.json` w README misc nieaktualne — odnotowane).

TESTY (surowe logi `dowody/`):
- `cargo fmt --all -- --check` EXIT=0; `cargo clippy --locked --all-targets -- -D warnings` EXIT=0.
- `cargo test --locked --no-fail-fast`: passed=448 failed=0 binaries=59 EXIT=0 (baza 444 + 4 z `repin3d_b1`).
- MSRV `cargo +1.87.0 test --locked --test repin3d_b1 --test improvements_web_parity --test misc_web_parity`: 4+3+11 EXIT=0.
- Wektory z URUCHOMIONEGO weba (`b1.json`, wejścia 2,9 MB): 0 różnic; brzegi NaN/±∞/−0/1e-7/1e+21/N−1/N/N+1.
- Mutacje `mutate_b1.py`: 20/20 zabite; 1 przeżywca r1 („fort factor y only”) = równoważny (f = 1,0 dokładnie), usunięty z dowodem; strażnik `|| 1` równoważny (dowód §9.3).
- Niezależny weryfikator: 2 katalogi, osobne `npm install`/`git archive` → `b1.json` `fa57d2dd…`, improvements/misc identyczne SHA = repo.
- `sha256sum -c` MANIFEST_B (4 OK) + MANIFEST A (9 OK). `git diff --check` czysty.
- Ocena wizualna GPU: NIE_ZMIERZONO (brak `/dev/dri`; nie blokuje).

BLOKADY: brak. Uwagi: (1) Z-RP-B-1 — decyzja integratora, czy akceptuje regenerację fixtur pinu; (2) `PLATE_OWNER_ICON_SIZE` 0,80 zmierzony i cofnięty → B2 (łamie `overlay_web_parity`, regeneracja wymaga headless Chromium, razem z `unitOwnerEmblem.ts`); (3) `P4-REPIN-3D.md` edytowany też przez A3 — możliwy konflikt tekstowy przy integracji (B dopisuje §9 i zmienia wiersze §2.3/§3).

RUNDY: 1/5
NASTĘPNY KROK: Evaluator R-RUSTPORT-REPIN-3D-B-Q1 r1; potem partie B2 (stat plate + emblemat), B3 (gwiazda dowódcy, cache odznak), B4 (`cities.ts`).
DEPLOY/PUSH: NIE WYKONANO
