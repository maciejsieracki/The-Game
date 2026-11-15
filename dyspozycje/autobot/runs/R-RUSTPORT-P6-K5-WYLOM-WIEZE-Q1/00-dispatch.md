# DISPATCH R-RUSTPORT-P6-K5-WYLOM-WIEZE-Q1 (runda 1)

STATUS: DISPATCHED
DOMAIN: GAME
TEMAT: #98 K5-LOOP-WYLOM — stan zniszczenia wieży przy wyłomie: wieża bez kafla muru przestaje strzelać natychmiast (pin), a wyłom usuwa kafel i wywołuje zniszczenie wieży w tej samej chwili. Wiring produkcyjny (#113) i efekty trafienia (#109/#147) są POZA tym tematem.
MODEL: Operator HAIKU 5.5; Obrona HAIKU 5.5; Evaluator SONNET 5.5; Final Control SONNET 5.5.

ZASADA: NAJPIERW WEB. Pin `07d2fbd72`, `gra/src/battle/battleScene.ts`: `_breachWallTile` (:7646-7648), `_destroyTowerAtRow` (:4194-4199), pętla wież (:4214-4216), `_fireOneTower` guard (:4226), log wyłomu (:4198, tekst NIE jest częścią silnika). Numery linii sprawdź sam. Brak rozstrzygnięcia w webie = NIE_ZMIERZONO, nie pytaj właściciela.

ŹRÓDŁO LUK: `dyspozycje/autobot/runs/R-RUSTPORT-P6-K5-WIEZE-ROZPOZNANIE-Q1/01-rozpoznanie.md` (pkt 4, 7, 21, 24; sekcja ROZBIEŻNE, linia ~73). Te punkty są zweryfikowane przez Evaluatora.

BAZA: `origin/rust-port/parity-v2` = `d5a52a980`. Worktree z tej bazy. Przed pracą: `git merge-base --is-ancestor d5a52a980 HEAD`.

ZAKRES (tylko to):
1. Stan `destroyed` dla wieży w `SiegeEnv`/`ProdBody` (dziś brak: `wall_tile_rows` w `siege_tactics_loop.rs` ~:313 to migawka). Wieża bez kafla przestaje być planowana i nie strzela (pin :4214-4216, :4226).
2. `breach_wall_tile` (`siege_tactics_breach.rs` ~:81) usuwa kafel i ustawia `destroyed` na wieży w tym samym wywołaniu (pin :7646-7648).
3. Wektory pinu dla: wyłom wieży przed salwą, wieża bez kafla przy planowaniu, brak strzału zniszczonej wieży. Test mutacji: usunięcie ustawiania `destroyed` przy wyłomie musi dać FAIL.

NIE W TYM TEMACIE: wiring produkcyjny pętli (#113), efekty trafienia wieży na `_resolveBlowOutcome` (#109/#147), ruch jednostek i zapis pozycji (#123), szablon strzału wieży (zarzut 1 z rozpoznania — #109/#147/#113), log tekstowy (renderer).

ALLOWLISTA (wszystko poza tym = FAIL):
- `rust-port/engine/src/domain/siege_tactics_loop.rs` — zmiany tylko w strukturze stanu wież i planowaniu (`plan_tower_shots`, `tower_shoot`)
- `rust-port/engine/src/domain/siege_tactics_breach.rs` — zmiany tylko w `breach_wall_tile`
- `rust-port/engine/tests/p6_siege_wylom_*.rs` — NOWE pliki testów
- `dyspozycje/autobot/runs/R-RUSTPORT-P6-K5-WYLOM-WIEZE-Q1/**`

ZERO ZMIAN W: `gra/**`, `rust-port/renderer/**`, `rust-port/view-model/**`, `rust-port/engine/src/bridge.rs`, `rust-port/engine/src/domain/mod.rs` (chyba że konieczny jeden wpis — wtedy zapisz w raporcie), `Cargo.lock` (nie commitować).

BRAMKI (EXIT 0; `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`; CARGO_TARGET_DIR poza repo, usuń po bramkach):
- `cargo fmt --check` w `rust-port/engine`
- `cargo clippy --all-targets -- -D warnings` w `rust-port/engine`
- `cargo test --all-targets` w `rust-port/engine` (pełny)
- `git diff --check`

KRYTERIA KOŃCA: 1) luki 4, 7, 21 z rozpoznania zamknięte z dowodem plik:linia; 2) wektory pinu, nie ręczne liczby; 3) mutacja dająca FAIL; 4) brak `#[ignore]`, brak osłabionych asercji; 5) wszystkie NIE_ZMIERZONO jawnie w raporcie.

PROCES: Operator → Evaluator → (Obrona jeśli zarzuty) → Final Control. Commit z jawnym `git add`. Bez push na parity, bez integracji. Commit z `Co-Authored-By: Claude Haiku 5.5 <noreply@anthropic.com>` i `Claude-Session: https://claude.ai/code/session_01Eq7NKGj1PasjUCd7VCtYbZ`.
