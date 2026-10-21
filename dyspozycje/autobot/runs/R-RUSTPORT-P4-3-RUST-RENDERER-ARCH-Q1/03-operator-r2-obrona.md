STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-3-RUST-RENDERER-ARCH-Q1
GOAL: Dokument architektury renderera mapy i modeli 3D w Rust (wgpu): silnik, osadzenie w Tauri, matematyka pickingu z kodu weba, potok modeli, testy 1:1, statyczny audyt pamięci, D-RR-n, tematy-kandydaci.
ROLA: Operator (obrona po FAIL Evaluatora r1), Opus 5.5 medium.

ZMIANY-COMMIT: baza = commit Operatora r1 `bc17ea76` (detached). Zmienione tylko:
- `dyspozycje/rust-port/p4/P4-3-RUST-RENDERER-ARCH.md` (poprawki + nowa §3.9 + §10 rejestr zmian),
- `dyspozycje/autobot/runs/R-RUSTPORT-P4-3-RUST-RENDERER-ARCH-Q1/03-operator-r2-obrona.md` (ten plik).
Zero zmian w `gra/**`, `rust-port/**`, `src-tauri/**`. `git add` jawny, bez push.

ODPOWIEDZI NA ZARZUTY (wszystkie PRZYJĘTE):
1. MSRV Bevy — PRZYJMUJĘ. `~/.cargo/registry/src/*/bevy-0.20.0/Cargo.toml:14` → `rust-version = "1.97.1"`; 1.96.0 pochodziło z `bevy-0.20.0-rc.2/Cargo.toml:14`. `rustc --version` → `1.97.0 (2d8144b78 2026-07-07)` < 1.97.1 → Bevy 0.20.0 wymaga nowszego toolchainu; dopisane w §1.2 i D-RR-1.
2. Cache — PRZYJMUJĘ. `ls -la --time-style=full-iso ~/.cargo/registry/cache/*/` → `wgpu-30.0.1.crate` 19:01:11, `bevy-0.20.0-rc.2.crate` 19:01:11, `three-d-0.19.0.crate` 19:01:12, `bevy-0.20.0.crate` 19:06:31; brak `naga`/`winit`/`wgpu-core`. Ujawnione w §1.1/§1.2.
3. PlytkieMorze — PRZYJMUJĘ. `scene.ts:578-580` (`isDryLandTeren` = false dla Morze i PlytkieMorze) + `:2257-2261` + `:2088-2089` → wierzch 0,18; `units.ts:214-217` → `topYAt` 0,22. Poprawione §3.5 pkt 3, §3.6 (nowy wiersz 0,04), §3.7 pkt 7, D-RR-3.
4. Math.round — PRZYJMUJĘ. Nowa recepta `f=x.floor(); if x-f>=0.5 {f+1} else {f}`. `node -e`: `0.49999999999999994` → Math.round 0, `floor(x+.5)` 1, recepta 0; 2 mln losowych + połówki k/2±1e-16 → 0 rozbieżności. Zakres zawężony do dokładnych połówek ujemnych (§3.4).
5. Gałąź `picker.ts:221-223` — PRZYJMUJĘ, dopisana w §3.5 pkt 4.
6. ACES — PRZYJMUJĘ. `scene.ts:1638-1641` `if (renderStyle === 'civ')`; roblox bez tone mappingu. Poprawione §1.2, §4.1, §4.2, RR-T5.
7. raw-window-handle — PRZYJMUJĘ. `wgpu-30.0.1/Cargo.toml:186-189` `version = "0.6.2"` (^0.6.2) vs lockfile `src-tauri/Cargo.lock` 0.6.2 → zgodne; usunięte z NIE_ZMIERZONO.
8. Pętla/animacje/wejście — PRZYJMUJĘ. Nowa §3.9 (dowody `main.ts:36248-36249`, `:25485-25499`, `:36267-36270`, `:36472`, `camera.ts:225-234`, `:275-289`, `main.ts:26230-26253`), D-RR-10, RR-T12 (pętla+kamera+wejście+pomiar IPC), RR-T13 (DTO widoku + hover-picking).
9. LOC — PRZYJMUJĘ. ~83 tys. oznaczone jako dolna granica (bez części 3D `main.ts`, 39 350 LOC) w §0 i §8.
10. BattleScene — PRZYJMUJĘ. `grep -n "new BattleScene(" main.ts` → 27514, 28160, 29884, 30250, 30384 (5). Poprawione M3.
11. „Dowiedzione wycieki” — PRZYJMUJĘ. Przeformułowane na dowód ścieżki kodu; retencja GPU = wnętrze Three r169 `[zewn., niezweryfikowane]`; M2 i M3 dowiedzione na poziomie JS (§0 pkt 5, §7).

TESTY: bez buildu i uruchomień. `git diff --check` czysty; `git diff --stat bc17ea76` tylko 2 pliki z allowlisty.
BLOKADY: brak blokad tematu (NIE_ZMIERZONO jak w §9 + nowy pkt 16: opóźnienie IPC).
RUNDY: 2/5
NASTĘPNY KROK: Evaluator (Opus 5.5 medium) — ponowna ocena r2, potem Final Control.
DEPLOY/PUSH: NIE WYKONANO
