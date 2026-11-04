STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-3D-A5-Q1
GOAL: REPIN-3D A5 (ostatnia partia planu A): wektory cz. 4–5 na `origin/main`, port różnic bit w bit, martwy `Fade`, picking vs palisada / wieżyczki / `fortKind`, §15 + podsumowanie REPIN-3D.

ZMIANY/COMMIT: `13fa7f5f3` na gałęzi `rustport-repin3d-a5-q1` (baza `origin/rust-port/parity-v2` @ `6c21effd6`; web `origin/main` @ `86d510c66`, zmierzone na starcie i końcu, dryf 0). Raport: commit następny.
- `src/battle/dynamics.rs` (tylko adnotacje), `src/battle/mod.rs` (wiersz A5) — 0 zmian zachowania.
- `tests/battle3d_dynamics.rs`: `fade` i katapulty obrońcy w `breachWall` odtwarzane przez `units::kill_unit` (web `:9440-9451`, `:7614-7619`); wymuszone nowymi wektorami.
- NOWE `tests/repin3d_a5.rs` + `repin3d_fixtures/{a5.json,gen_a5.ts,mutate_a5.py}`; README/MANIFEST obu katalogów fixtur przeliczone.
- `fixtures/battle3d/{dynamics.json 6bdaca3e…, picking.json 2daec761…}` zregenerowane; `dynamics_a5_gen.patch`.
- `P4-REPIN-3D.md`: §15 (+ nagłówek, §2.1 #2, §3).

TESTY: fmt EXIT=0; clippy `-D warnings` EXIT=0; `cargo test --locked --no-fail-fast` 465/0, 63 binaria (baza 464); MSRV 1.87.0 `battle3d_dynamics`/`battle3d_picking`/`repin3d_a5`/`repin3d_a1` 5+8+1+6 EXIT=0; mutacje `mutate_a5.py` 13/13 (pierwszy przebieg 12/13 → dodane promienie `relief.near`); `sha256sum -c` 25 OK + 20 OK; weryfikator 2 katalogi: 3 JSON + 3 bundle A = B = repo; `git diff --cached --check` czysty. GPU: NIE_ZMIERZONO. Logi: `dowody/`.

Wyniki:
1. Różnice cz. 4: rozstawienie (szyk A4, DTO) + `_startFade`→`_removeUnitFromScene` (fade, 2 katapulty r. 73). Cz. 5: tylko klucze zależne od rozstawienia; `battle3d_picking.rs` bez zmian 8/8.
2. `Fade`/`tick_fades` ZOSTAJĄ z adnotacją: konsument `tests/repin3d_a1.rs:17,698-710` poza allowlistą (§15.3).
3. Pickery weba celują tylko w `_battleGroundPickMeshes` + grupy jednostek; palisada/wieżyczki nie zasłaniają i nie są wybieralne — Rust zgodny bit w bit (1 191 promieni, 97 przez wieżyczkę, 21 NaN/±Inf).

BLOKADY: brak. UWAGI:
- N1 (baza): merge `6c21effd6` zostawił `P4-REPIN-3D.md` pusty (blob `e69de29b`); odtworzony `diff3 -m` rodziców `0035f7d40`/`d8d20a1dd` (§15.0), numeracja bez zmian.
- N2 Z-RP-A5-1: generator pinu pada na nowym szyku (`TypeError`, `gen_dynamics.ts:521`); jedna zmiana `q >= 14`→`12` jako patch, commitowany `gen_dynamics.ts` = pin.
- N3 Z-RP-A5-2: fixtury pinu cz. 4–5 zastąpione (jak Z-RP-B-1/A4-2).
- N4: mutanty 11–12 przejściowo edytują `src/pick/hex.rs` (dowodowe, przywrócone; `git status` czysty).

RUNDY: 1/5
NASTĘPNY KROK: Evaluator (ten sam ID), potem Final Control; integracja orkiestratora na `parity-v2`.
DEPLOY/PUSH: NIE WYKONANO
