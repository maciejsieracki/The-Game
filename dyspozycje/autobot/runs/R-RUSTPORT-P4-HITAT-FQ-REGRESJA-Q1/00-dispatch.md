# R-RUSTPORT-P4-HITAT-FQ-REGRESJA-Q1 — regresja po FRAME-QUANT: `PlaybackError::HitAt` w E2E klienta (hit_at akcji Melee ≠ t0 + BLOW_HIT_T)

STATUS: dispatch orkiestratora (PILNE — `origin/rust-port/parity-v2` ma czerwone testy klienta). Opus, wszystkie etapy Opus.
BAZA: `origin/rust-port/parity-v2` w chwili startu (`3e5db0673b26c0838d23f621e8727ffd051a9c88` w dniu dispatchu; zawiera FRAME-QUANT `3e5db0673`; wpisz faktyczny SHA). `git fetch origin && git checkout -B <gałąź> origin/rust-port/parity-v2`.

## OBJAW (dowód)
Po integracji FRAME-QUANT (bramki FRAME-QUANT obejmowały tylko `engine`) testy klienta `rust-port/client/tests/siege_battle_client.rs` (10 z 22: `stan_ui_po_bitwie`, `e2e_pomin_i_determinizm`, `e2e_kroki_nieregularne_rowne_16ms`, `e2e_16ms_do_konca_zdobycie_miasta_i_mapa_zgodna_z_mostem`, `e2e_bez_sceny_ten_sam_wynik`, `finish_bez_wyniku_to_aborted`, `finish_odtwarza_wstrzymane_akcje`, `ostatnia_bitwa_po_nowej_sesji_i_nowym_starcie`, `porzucony_start_czysci_ekran_poprzedniej_bitwy`, `blad_setupu_porzuca_bitwe_w_silniku_e2e`) padają z `Playback(HitAt { t0: 137600.0, hit_at: 137760.0 })`. Log: `/tmp/claude-0/-home-user-The-Game/b3259bfd-6985-5166-9861-4edd4aa89b33/scratchpad/hitat_evidence/test-c.log` (może zniknąć — odtwórz: `cd rust-port/client && cargo test --test siege_battle_client`, wymaga budowy renderera, gpu OFF). Silnik: `cargo test --all-targets` zielony (4242), więc rozbieżność dotyczy kontraktu silnik ↔ renderer.
Przyczyna wstępna: FRAME-QUANT (D-FQ-1, `siege_tactics_loop.rs` ok. `:4843-4880`, `let hit_at = saved + dur;`) kwantyzuje czas ciosu do klatki 16 ms (`ceil(150/16)*16 = 160`), a `rust-port/renderer/src/battle/playback.rs:746` wymaga `hit_at == a.t0 + BLOW_HIT_T` (150). Z tego wynika `HitAt`.

## GOAL
Przywrócić zgodność kontraktu silnik ↔ renderer przy zachowaniu zgodności z pinem (wektory FRAME-QUANT 42 bajt w bajt muszą zostać). NAJPIERW web (pin `07d2fbd72`, `battleScene.ts` `_doMeleeAttack` `:9096-9175`, `:9122`; `_raf`): kiedy w webie następuje wizualny/mechaniczny cios względem startu lunge przy kroku klatki 16 ms — dokładnie `t0+150` czy pierwsza klatka z `localT>=150`. Wybierz JEDNĄ ścieżkę (decyzja techniczna, uzasadnij pinem, zapisz w raporcie):
 A) renderer akceptuje czas ciosu na siatce klatek: `hit_at ∈ [t0+BLOW_HIT_T, t0+BLOW_HIT_T+F)` (F = klatka 16 ms; `MeleeLunge` łączy się w pierwszej klatce z `localT>=BLOW_HIT_T`), z testami czułości w `renderer`;
 B) silnik emituje w DTO nominalne `t0+BLOW_HIT_T`, a kwantyzację trzyma tylko w wewnętrznej osi czasu (bez zmiany wektorów pinu — sprawdź, czy wektory porównują `hit_at` akcji; jeśli tak, wariant B wymaga innego rozwiązania niż zmiana wartości).
Sprawdź też analogiczne ryzyko dla innych akcji z czasem (`Shot.land_at`, `MoveAnim`, ram/tower) — dług SHOT-LAND-AT-RENDER z FRAME-QUANT; napraw tylko to, co faktycznie łamie renderer/klienta.
Po naprawie: wszystkie testy `client` (`engine_bridge_renderer`, `siege_battle_client`) i `renderer` (gpu OFF) zielone. Dodaj do bramek integracji FRAME-QUANT-podobnych tematów stałą regułę: zmiana strumienia akcji silnika ⇒ testy `client` + `renderer`.

## ALLOWLISTA
`rust-port/engine/src/domain/siege_tactics_loop.rs`, `engine/src/domain/siege_tactics_actions.rs`, `engine/src/domain/siege_battle_session.rs` (tylko to, co konieczne), `rust-port/renderer/src/battle/playback.rs` (+ testy renderera w `renderer/tests`/modułowe), `rust-port/client/tests/siege_battle_client.rs` (tylko jeśli oczekiwania testów zależą od starego modelu — uzasadnić; NIE osłabiać asercji), `engine/tests/p6_k5loop_wiring_a*` (tylko dopiski; nie zmieniać 42 wektorów), `dyspozycje/autobot/runs/R-RUSTPORT-P4-HITAT-FQ-REGRESJA-Q1/*`. Nie ruszać: `bridge.rs`, `siege_battle_apply.rs`, `city_capture_apply.rs`, `playable.rs`, `src-tauri`, `gra/` (I6-DLUGI i KAPITULACJA w toku; MARCH-INCREMENTAL zmienia `siege_tactics_loop.rs` równolegle — minimalny diff).

## KRYTERIA KOŃCA
`cargo test` w `client` (wszystkie testy) i w `renderer` (gpu OFF) zielone; `cargo test --all-targets` silnika zielone, w tym `p6_k5loop_wiring_a_pin` (42 wektory bajt w bajt, lista wyjątków bez zmian); test, który padłby na starym kodzie (regresja `HitAt` odtworzona na bazie). Mutanty ≥ 10 w logice walidacji/emisji czasu ciosu. Bez pytania ABC (technicznie rozstrzyga pin).

## BRAMKI (EXIT 0)
engine: fmt, clippy `--all-targets -D warnings`, pełny `cargo test --all-targets --no-fail-fast`; client: fmt, clippy, `cargo test`; renderer (gpu OFF): fmt, clippy `-D warnings`, `cargo test` (wymaga ≥ 12 GB wolnego — jeśli brak, napisz NIE ODTWORZONO i zgłoś blokadę INFRA do orkiestratora zamiast pomijać). `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, własny `CARGO_TARGET_DIR`; wszystkie pliki tymczasowe/logi/skrypty mutantów w scratchpadzie z ID tematu w nazwie (`hitat-*`); w tle `setsid nohup`; po bramce usuń własny target.

## ZAKAZY
Brak push na `parity-v2`/deploy/integracji, brak `git add -A`, brak `#[ignore]`, brak osłabiania asercji, brak linii Co-Authored-By z nazwą modelu (dozwolona `Claude-Session:`). Commituj WIP wcześnie. Raporty: `01-operator-r1.md`, `02-evaluator.md`, `02a-obrona.md`, `03-final-control.md`.
