STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5LOOP-AUTO-WEKTORY-V1V5V6-Q1 (K5-LOOP-AUTO-WEKTORY, część bez blokady: V1, V5, V6)
GOAL: Wektory pinu 07d2fbd72 dla faz AUTO bez oblężenia i trybu ręcznego: V1 (kolejność faz wsadowych), V5 (_finishAutoBatchPhase, koniec bitwy w fazie atakującego), V6 (_haltAutoBattleTurn i spóźniony callback fali). Mutacje (a)(b)(c) muszą dać FAIL.
BAZA: origin/rust-port/parity-v2 = 75de326bc (worktree detached). Pin 07d2fbd72 (tylko odczyt). Dispatch odczytany z commitu 157d49f5b (gałąź claude/rust-sivvrn), bo nie był w bazie parity.

ZMIANY/COMMIT: 8bd36fbee (gałąź detached, NIE wypchnięta; push do parity nie wykonywany)
- NOWE rust-port/engine/tests/p6_k5loop_auto_gen.mjs (generator: wyciąga ciała metod z pinu przez git show, zdejmuje typy TS przez node:module stripTypeScriptTypes, WYKONUJE je; stuby tylko: _snapshotAutoBatchIntents, resolveAutoBatchPhase (K5G0), animacje ruchu/ciosu/ucieczki, _schedule (zapis), _checkEnd (skrypt z wektora))
- NOWE rust-port/engine/tests/p6_k5loop_auto_v1v5v6.rs (16 testów: 15 wektorów + stałe ACT_GAP_MS=160/TURN_GAP_MS=240)
- NOWE rust-port/engine/tests/p6_k5loop_auto_vectors/vectors.json (15 wektorów, sha256 9ace7e8e3e325a842a62afe2d7054d55424834cfa38b7626462ad564238af8fc)
- NOWE rust-port/engine/tests/p6_k5loop_auto_vectors/SHA256SUMS
- Brak zmian w src portu (git diff src po mutacjach: pusty). Cargo.lock wygenerowany przez cargo, NIE dodany do commitu (untracked).
- Commit raportu: osobny commit (ten plik).

WEKTORY (pin file:line):
- V1 (battleScene.ts:5696-5704, 5707-5745): v1a atak pierwszy (2 atakujących + 2 obrońców) -> faza atk [a0,a1], banner a0, zaplanowany finishPhase 160; v1b atakujący martwi/usunięci -> faza def [d0,d1]; v1c zadziałany atakujący pominięty -> faza atk [a1]; v1d siegeWallCol=0 -> brak fazy; v1e tryb ręczny -> brak; v1f finished -> brak; v1g zawieszona fala -> brak fazy w _beginAutoBatchPhase.
- V5 (battleScene.ts:5961-5973): v5a koniec atk -> faza def tylko z filtrem pinu (d0), v5b koniec def -> beginTurn po 240; v5c _checkEnd=true w fazie atk -> brak obrony i brak timera; v5d token nieaktualny -> nic (bez _checkEnd); v5e tryb ręczny -> nic.
- V6 (battleScene.ts:17333-17344, callback 5865-5905): v6a przerwanie w połowie fali + spóźniony callback -> stan wyzerowany, token 7->8, brak finishPhase; v6b suspendInFlight=false -> flaga zawieszenia false, spóźniony callback ignorowany; v6c kontrola: callback przy zgodnym tokenie zmniejsza pending 2->1.

TESTY:
- cargo test --test p6_k5loop_auto_v1v5v6: 16/16 PASS (przed i po rustfmt).
- Mutacje (wykonane na src/domain/siege_tactics_autobatch.rs, po każdej przywrócone z kopii; git diff src pusty po przywróceniu):
  (a) V1 def-first (`if !atk.is_empty()` -> `if false && !atk.is_empty()`): cargo rc=101, FAIL v1a_attackers_first_when_attackers_live, v1c_acted_attacker_is_skipped (14 PASS / 2 FAIL).
  (b) V5 bez _checkEnd (`let ended = env.check_end(st);` -> `let ended = {let _ = env.check_end(st); false};`): rc=101, FAIL v5c_attacker_wins_in_attack_phase_no_defense (15 PASS / 1 FAIL).
  (c) V6 bez guardu tokenu (`if ctx.token != st.token` -> `if false && ...` w complete_resolution): rc=101, FAIL v6a_halt_mid_wave_late_callback_dropped, v6b_halt_without_suspend_keeps_flag_clear (14 PASS / 2 FAIL).
- Generator --check: OK, 15 wektorów, sha256 zgodny z SHA256SUMS (sha256sum porównane ręcznie: identyczny skrót).
- Bramka cargo fmt --check (rust-port/engine): EXIT 0 (po rustfmt nowego pliku testowego).
- Bramka cargo clippy --all-targets -- -D warnings: EXIT 0.
- Bramka cargo test --all-targets --no-fail-fast (w tle, setsid, CARGO_INCREMENTAL=0, CARGO_TARGET_DIR w scratchpadzie): NIE ZAKOŃCZONA Z EXIT 0 — patrz BLOKADY. Stan w chwili zapisu raportu: 254 suites, 2006 passed, 0 failed (bramka dalej trwała w tle, bez końcowego GATES_DONE); jedyny nieudany plik: p6_8i_pick ("process didn't exit successfully") — przerwany ręcznie sygnałem po zawieszeniu testu pick_auto_improvements_matches_pinned_web_vectors (>60 s, 100% CPU).
- df / przed bramką: 22 GB wolne (>= 8 GB).

BLOKADY:
- p6_8i_pick / test pick_auto_improvements_matches_pinned_web_vectors: zawisał (100% CPU, nie zakończył się w czasie bramki), przerwany ręcznie. Plik testowy i kod, którego dotyczy, NIE są zmieniane w tym temacie (dotyczy bazy parity 75de326bc; znane w rejestrze jako #291/#295). Gate EXIT 0 dla całości NIE_ZMIERZONO — wymaga osobnego rozpoznania p6_8i_pick przez orkiestratora.
- Brak innych blokad.

RUNDY: 1/5
NASTĘPNY KROK: (1) rozpoznać p6_8i_pick (pick_auto_improvements_matches_pinned_web_vectors) — czy to regresja bazy, czy pre-existing; (2) Evaluator + Final Control dla V1/V5/V6 (wektory i mutacje gotowe); (3) integracja gałęzi 8bd36fbee (+ raport) na parity po FC i decyzji o p6_8i_pick.
DEPLOY/PUSH: NIE WYKONANO (commit lokalny detached, bez push do parity; zgodnie z dispatchem).
