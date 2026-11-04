STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-3D-A5-Q1
GOAL: REPIN-3D A5 — wektory cz. 4–5 (`dynamics.json`, `picking.json`) zregenerowane na `origin/main` 86d510c66, port bit w bit, martwy `Fade` rozstrzygnięty, picking vs palisada/wieżyczki/`fortKind`, §15 + podsumowanie REPIN-3D.

ZMIANY/COMMIT:
- Oceniane: `13fa7f5f3` (kod), `ffc08a1a7` (raport Operatora); FC: ten plik (commit na `rustport-repin3d-a5-q1-fc`, rodzic `ffc08a1a7`).
- Zmierzone: `origin/rust-port/parity-v2` = `6c21effd6` = merge-base; `origin/main` = `86d510c66`; parity-v2..ffc08a1a7 = 2 commity, fast-forward.
- Diff 24 pliki; `git diff --check` czysty. Poza literą allowlisty tylko `tests/repin3d_fixtures/{README,MANIFEST,a5.json,gen_a5.ts,mutate_a5.py}` — precedens A1–A4 (a1…a4, gen_a*, mutate_a* w tym katalogu). Zero zmian `gra/**`, `engine/**`, `src-tauri/**`, `Cargo.*`, `WERSJE.md`, `gra-robocza/**`. `src/` = tylko komentarze.

TESTY (FC samodzielnie, worktree wf_f4a33a99-aff-3, HEAD ffc08a1a7):
- `cargo fmt --all -- --check` EXIT=0; `cargo clippy --locked --all-targets -- -D warnings` EXIT=0.
- `cargo test --locked --no-fail-fast` EXIT=0: 63 binaria, 465 passed / 0 failed (baza 464).
- `cargo +1.87.0 test --locked --test battle3d_dynamics --test battle3d_picking --test repin3d_a1 --test repin3d_a5`: 5 + 8 + 6 + 1, EXIT=0.
- `mutate_a5.py` RANGE 0:7 + 7:13: KILLED 7/7 + 6/6 = 13/13; `git status` czysty po przebiegu.
- `sha256sum -c`: battle3d 25 OK, repin3d_fixtures 20 OK.
- Web @86d510c66: `_startFade` `:9440-9451` → `_removeUnitFromScene`; `fadingUnits` tylko `:2601` (init) i `:8958` (`filter` — nie dopisuje).
- `P4-REPIN-3D.md`: na `6c21effd6` 0 B (potwierdzone). Mój `diff3 -m` (0035f7d40 / 54c481e81 / d8d20a1dd) → jeden konflikt dopisków na końcu (§14 A6 vs §12 A4); po zachowaniu obu stron różnica do pliku A5 = nagłówek, §2.1 #2, 2 wiersze §3 i +§15. Numeracja §0–§14 nietknięta.
- Regeneracja wektorów nie powtórzona przez FC (wykonana 2× przez Operatora i 1× przez Evaluatora w osobnych mktemp, hashe = repo; hashe zgodne z MANIFEST potwierdzone).
- GPU: NIE_ZMIERZONO (brak `/dev/dri`). `target/` usunięty.

ORZECZENIA (Evaluator: 0 zarzutów, 5 uwag):
- U1 (rubble tail 3/7 w rzędzie 73): ODDAL — wierne `slice(kids0)` generatora po usunięciu katapult; ID 7 węzłów sprawdzane, geometrię gruzu pokrywają inne wyłomy.
- U2 (komentarz `dynamics.rs:520` pomija `:8958`): ODDAL — teza „nic nie zapisuje” prawdziwa (`filter` tylko zawęża); uściślić przy partii usuwającej `Fade` (z `repin3d_a1.rs`).
- U3 (łatka generatora `q>=14`→`q>=12`): ODDAL — jawna, minimalna, zapisana jako `dynamics_a5_gen.patch` (Z-RP-A5-1), plik pinu niezmieniony.
- U4 (pliki `repin3d_fixtures/*` poza literą allowlisty): ODDAL — przyjęte wprost wg precedensu A1–A4.
- U5 (nagłówek wskazuje §9 dla A3): ODDAL — wada sprzed A5; do porządków dokumentu.
- Dodatkowo (FC): kolejność §14 przed §12 w pliku wynika z odtworzenia scalenia — kosmetyka, ODDAL.

BLOKADY: brak.
RUNDY: 1/5
NASTĘPNY KROK: integracja orkiestratora: `rust-port/parity-v2` (6c21effd6) ← fast-forward/merge `rustport-repin3d-a5-q1-fc` (13fa7f5f3 → ffc08a1a7 → FC); po integracji bramki na wyniku.
DEPLOY/PUSH: NIE WYKONANO
