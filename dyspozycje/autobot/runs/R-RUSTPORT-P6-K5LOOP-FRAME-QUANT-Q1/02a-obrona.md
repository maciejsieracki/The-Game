# R-RUSTPORT-P6-K5LOOP-FRAME-QUANT-Q1 — Obrona Operatora r1

```text
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5LOOP-FRAME-QUANT-Q1 (zgodność z pinem w klatce 16 ms: 12 kandydatów c1 + mur_jazda_rzeka @16)
GOAL: przy kroku klatki 16 ms wynik Rust bajt w bajt zgodny z pinem dla 12 kandydatów i mur_jazda_rzeka, bez psucia @1 ms
      (>= 125/128), dawnych wektorów i bliźniaków _klatka1; mutanty >= 20, zamiana _drainTimers/_raf = FAIL
BAZA OBRONY: 51f12ae90 (raport Evaluatora r1 nad kodem Operatora f81611212; kod Rust 3f4577d6f)
GAŁĄŹ: rust-port-wip/frame-quant-q1-obrona (lokalna, worktree wf_6a1aa039-fb6-3)
ZMIANY/COMMIT: siege_tactics_loop.rs (1 refaktor bez zmiany zachowania + 5 testów jednostkowych), raporty w runs/ (§3);
               commity c6e25ee7b (kod + testy) i commit tego raportu (SHA w wyniku Workflow)
TESTY: §2 — fmt EXIT 0, clippy -D warnings EXIT 0, pełny cargo test --all-targets --no-fail-fast EXIT 0 (4202 ok, 0 fail, 1 ignored sprzed tematu), mutanty obrony 8/8 ZABITE
BLOKADY: brak. Zarzuty U1–U4 przyjęte i zamknięte kodem/testem/opisem; U5 przyjęty bez zmiany (poza kryterium); U6 przyjęty
         (sekcja niżej; ścieżkę w dispatchu poprawia orkiestrator — dispatch nie jest w allowliście Operatora)
RUNDY: 1/5 (obrona po Evaluatorze r1)
NASTĘPNY KROK: Final Control
DEPLOY/PUSH: NIE WYKONANO
```

## 1. Odpowiedzi na zarzuty

| Zarzut | Odpowiedź | Dowód |
|---|---|---|
| **U1** (E5, E8 przeżywają; nowe gałęzie D-FQ-2 bez testu) | **PRZYJMUJĘ** — dwa testy jednostkowe w `pin3_timeline_tests` | `marsz_oblezniczy_krok_po_przerwie_ma_klucz_due_przerwy`: prawdziwy `ProdSiegeWalk::do_move` (2 kroki, klatka 16, start 992) — oś ciała `[(992, -inf), (1312, 1302)]`; zegar wieży z `due` 1310 widzi pole `(2,0)`, remis `due` 1302 — `(1,0)`. **E5 ZABITY**. `wywolanie_ciala_zeruje_due_przerwy_poprzedniego_marszu`: marsz X w wywołaniu 992 (`due` przerwy 1302), wywołanie ciała Y w 1296, krok `_raf` Y w klatce 1312 — klucz `+inf`, wieża z `due` 1310 widzi Y na starym polu. **E8 ZABITY** (dokładnie scenariusz Evaluatora: fałszywy `ord = d_X` dla innej jednostki). E8 nie jest równoważny — zgadzam się z Evaluatorem, stąd test, a nie argument. |
| **U2** (klasa FQ-TOWER-HIT-DUE: Q20, Q22, E6, E7) | **PRZYJMUJĘ** — wariant „test z atrapą ciała” zamiast długu | (a) `tower_target_tests::wieza_czyta_os_celu_z_nominalnym_due_wystrzalu_i_trafienia`: `SiegeLoop` z atrapą `RecBody` zapisującą `due` czytającego przy `unit_cell_at` (wystrzał) i `tower_blow` (trafienie); wystrzał w klatce 1008 z `due` 1004 czyta z 1004, trafienie ma `due` 1388 (= 1008 + 380) i z nim woła `_singleBlow`, po obu odczytach czytający wraca do `f64::MIN`. **Q19, Q20, Q22 ZABITE**. (b) `pin3_timeline_tests::trafienie_wiezy_czyta_os_celu_wg_due`: `has_future_steps` i pole/zwrot celu trafienia przy `reader_due` 1310 vs 1302 (krok z zegara przerwy `due` 1302 w klatce 1312). **E6, E7 ZABITE**. Dla E7 wydzieliłem odczyt pola i zwrotu celu z `tower_blow_full` do `ProdBody::tower_target_view` (refaktor bez zmiany zachowania: te same dwa wywołania `unit_cell_at(tref, now)` i `facing_at(tref, now, reader_due)` z tym samym fallbackiem `activate.q/r`), żeby odczyt był testowalny bez składania pełnego `FullBlowInput`. Dług FQ-TOWER-HIT-DUE **zamknięty** (kod zgodny z `_drainTimers` `:9616-9634`, teraz pilnowany). |
| **U3** (E2: zamiana faz w czasie rzeczywistym przeżywa) | **PRZYJMUJĘ** — test jednostkowy zamiast bliźniaka wektora | `tower_target_tests::czas_rzeczywisty_faza_krokow_po_zegarach_tej_klatki`: `step_realtime` z `body_done_raf = true`, `BodyDone` z `due` 16; pierwsza klatka tylko `vLastWall` (`:9500-9511`), druga (`vNow` 16) odpala 1 zegar i skutek ciała wykonuje się w TEJ klatce po `drain_timers` (`completed = [A0]`, `raf_pending` pusty). Prawdziwa zamiana faz (kolejka kroków przed `drain_timers`, bez kolejki po) zostawia skutek do następnej klatki. **E2 ZABITY**. Bliźniak `realtime` wektora pinu odrzuciłem jako środek (nie jako zarzut): generator w trybie `realtime` to 300–700 s na bitwę i zmiana `vectors.json` (MD5) bez potrzeby — test jednostkowy zabija ten sam mutant bez ruszania wektorów. Model czasu rzeczywistego bez zmian (D-PIN3-3; uwaga Evaluatora: w pinie AUTO kroki `_raf` klatki k idą w k+1 po jej `_drainTimers`, skutek w tej samej chwili — test pilnuje kolejności faz Rust, nie zmienia jej). Dług FQ-REALTIME-ORDER **nie powstaje**. |
| **U4** (Q25 opisany jako zamiana faz, a jest no-op) | **PRZYJMUJĘ** — opis poprawiony | `01-operator-r1-mutanty.py` (opis Q25: „NO-OP … to NIE jest zamiana faz — prawdziwą zamianę sprawdzają Q24 i E1”) i `01-operator-r1.md` §8 wiersz Q25 („RÓWNOWAŻNY (no-op)”, opis z adnotacją obrony). Werdykt Q25 bez zmian (równoważny, uzasadnienie `mem::take` było już poprawne). |
| **U5** (@32/@64 diagnostyczne, niezweryfikowane przez Evaluatora) | **PRZYJMUJĘ bez zmiany kodu** | Wyniki @32 124/128 i @64 117/128 są poza kryterium dispatchu (produkcja = 16 ms, `_setSpeedIdx` nieportowane) i zostają jako dług FQ-SPEED z adnotacją: zmierzone wyłącznie przez Operatora r1, **Evaluator: NIE_ZMIERZONO**, obrona: nie powtarzano. Żadna decyzja tematu na nich nie opiera się. |
| **U6** (formalne) | **PRZYJMUJĘ** | (a) Sekcja „Pliki spoza allowlisty” — §3 niżej (brak takich plików, w r1 i w obronie). (b) Faktyczna ścieżka wektorów to `rust-port/engine/tests/p6_k5loop_wiring_a_pin_vectors/` (generator `p6_k5loop_wiring_a_gen.mjs` pisze tam od K5LOOP-WIRING-A); dispatch pisze `p6_k5loop_wiring_a_vectors/*`. Do poprawy przez orkiestratora w `00-dispatch.md` / `REJESTR-RUST.md` (oba poza allowlistą Operatora) — zgłoszone tutaj. |
| Potwierdzenia Evaluatora (bramki, MD5 `ec89d91d…`, 125/128 @1/@4/@16) | bez sporu | Obrona nie zmienia generatora ani wektorów — MD5 `vectors.json` `ec89d91d3e9fccee3461752969757f12` i `pin_data.json` `432eed76…` bez zmian (`git diff 51f12ae90 --stat` = tylko `siege_tactics_loop.rs` i `runs/`). Kod produkcyjny zmieniony wyłącznie refaktorem `tower_target_view` (ta sama semantyka), więc wyniki kandydatów c1 z r1 obowiązują; pełny test (§2) potwierdza wektory. |

## 2. Bramki (worktree `wf_6a1aa039-fb6-3`, `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie `fqob/tgt`, usunięty po bramkach)

| Bramka | Wynik |
|---|---|
| `cargo fmt --all -- --check` (engine) | **FMT_EXIT=0** |
| `cargo clippy --all-targets -- -D warnings` (engine) | **CLIPPY_EXIT=0** |
| `cargo test --lib -- siege_tactics_loop::` | 19 passed, 0 failed (w tym 5 nowych testów obrony) |
| Mutanty obrony (`02a-obrona-mutanty.py`, źródło przywracane, `git status` czysty) | **8/8 ZABITE**: E2, E5, E6, E7, E8 (Evaluator), Q19, Q20, Q22 (Operator) — tabela §4 |
| `cargo test --all-targets --no-fail-fast` (engine, pełny, w tle) | **FULL_EXIT=0**: 4202 passed (4197 z r1 + 5 nowych), 0 failed, 1 ignored (sprzed tematu); w tym `p6_k5loop_wiring_a_pin` 8/8 (42 wektory, 82 s debug), `p6_k5loop_wiring_b*`, `bridge_contract`, `p6_k5loop_*`, `p6_zdobycie_miasta_a*` |

## 3. Pliki zmienione w obronie i pliki spoza allowlisty

| Plik | Zmiana | Allowlista |
|---|---|---|
| `rust-port/engine/src/domain/siege_tactics_loop.rs` | `ProdBody::tower_target_view` (wydzielony odczyt pola i zwrotu celu trafienia wieży, bez zmiany zachowania); testy `marsz_oblezniczy_krok_po_przerwie_ma_klucz_due_przerwy`, `wywolanie_ciala_zeruje_due_przerwy_poprzedniego_marszu`, `trafienie_wiezy_czyta_os_celu_wg_due` (`pin3_timeline_tests`), `wieza_czyta_os_celu_z_nominalnym_due_wystrzalu_i_trafienia`, `czas_rzeczywisty_faza_krokow_po_zegarach_tej_klatki` (`tower_target_tests`, atrapa `RecBody`) | tak |
| `dyspozycje/autobot/runs/R-RUSTPORT-P6-K5LOOP-FRAME-QUANT-Q1/01-operator-r1.md`, `01-operator-r1-mutanty.py` | opis Q25 (U4) | tak |
| `dyspozycje/autobot/runs/R-RUSTPORT-P6-K5LOOP-FRAME-QUANT-Q1/02a-obrona.md`, `02a-obrona-mutanty.py` | ten raport, skrypt mutantów obrony | tak |

**Pliki spoza allowlisty: brak** (r1 i obrona). Nietknięte: `siege_battle_session.rs` (w obronie), generator, `vectors.json`,
`pin_data.json`, `p6_k5loop_wiring_a_pin.rs`, `p6_k5loop_wiring_b*`, `bridge.rs`, `city_capture_apply.rs`, `playable.rs`,
`client`, `renderer`, `src-tauri`, `gra/`, `Cargo.*`. Nowych `#[ignore]`: 0.

## 4. Mutanty obrony (`02a-obrona-mutanty.py`, test: `cargo test --lib -- siege_tactics_loop::`)

| Mutant | Zmiana | Wynik | Test zabijający |
|---|---|---|---|
| E2 | `step_realtime`: faza `_raf` przed `drain_timers` (prawdziwa zamiana) | ZABITY | `czas_rzeczywisty_faza_krokow_po_zegarach_tej_klatki` |
| E5 | `ProdSiegeWalk::do_move` bez `gap_after` | ZABITY | `marsz_oblezniczy_krok_po_przerwie_ma_klucz_due_przerwy` |
| E6 | `has_future_steps`: czytający `f64::MIN` | ZABITY | `trafienie_wiezy_czyta_os_celu_wg_due` |
| E7 | zwrot celu trafienia z `f64::MIN` | ZABITY | `trafienie_wiezy_czyta_os_celu_wg_due` |
| E8 | `set_now` nie zeruje `gap_due` | ZABITY | `wywolanie_ciala_zeruje_due_przerwy_poprzedniego_marszu` |
| Q19 | wystrzał wieży czyta oś jak ciało | ZABITY (dodatkowo, był już zabity wektorami) | `wieza_czyta_os_celu_z_nominalnym_due_wystrzalu_i_trafienia` |
| Q20 | trafienie wieży czyta oś jak ciało | **ZABITY** (w r1 nieobserwowalny) | jw. |
| Q22 | `due` trafienia = chwila wystrzału | **ZABITY** (w r1 nieobserwowalny) | jw. |

**Bilans mutantów tematu po obronie: 26 Operatora (Q1–Q26) + 8 Evaluatora (E1–E8) = 34; zabite 27 (Q1–Q3, Q5–Q7, Q9, Q10,
Q13–Q24, Q26, E1, E2, E5–E8), jawnie równoważne 7 (Q4, Q8, Q11, Q12, Q25, E3, E4), nieobserwowalne 0.** Kryterium dispatchu
„każdy zabity lub jawnie równoważny; zamiana `_drainTimers`/`_raf` = FAIL” spełnione bez odstępstwa (FF: Q24, E1; czas
rzeczywisty: E2).

## 5. Długi (stan po obronie)

| ID | Stan |
|---|---|
| MARCH-INCREMENTAL (118, 196, 221; 127 @32) | bez zmian — temat następczy |
| FQ-TOWER-HIT-DUE | **ZAMKNIĘTY** (Q20, Q22, E6, E7 zabite testami) |
| FQ-D2-SIEGEWALK / FQ-GAPDUE-RESET | **ZAMKNIĘTE** (E5, E8 zabite) |
| FQ-REALTIME-ORDER | **nie powstaje** (E2 zabity) |
| FQ-SPEED | bez zmian; @32/@64 zmierzone tylko przez Operatora r1, Evaluator i obrona: NIE_ZMIERZONO |
| SHOT-LAND-AT-RENDER, D-PIN3-3-SHOT-ID, PRE-SKIP-RAF | bez zmian (jak `01-operator-r1.md` §9) |
| Ścieżka wektorów w dispatchu (U6) | do poprawy przez orkiestratora: `p6_k5loop_wiring_a_pin_vectors/` |
