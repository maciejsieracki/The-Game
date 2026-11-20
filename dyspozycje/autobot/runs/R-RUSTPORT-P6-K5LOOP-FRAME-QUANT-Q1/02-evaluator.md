# R-RUSTPORT-P6-K5LOOP-FRAME-QUANT-Q1 — Evaluator r1 (adwersarialny)

```text
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5LOOP-FRAME-QUANT-Q1 (zgodność z pinem w klatce 16 ms: 12 kandydatów c1 + mur_jazda_rzeka @16)
GOAL: przy kroku klatki 16 ms wynik Rust bajt w bajt zgodny z pinem dla 12 kandydatów i mur_jazda_rzeka, bez psucia @1 ms
      (>= 125/128), dawnych wektorów i bliźniaków _klatka1; mutanty >= 20, zamiana _drainTimers/_raf = FAIL
OCENIANY KOD: rust-port-wip/frame-quant-q1 = f81611212 (kod Rust 3f4577d6f, dane 757ac004e), baza 0522ad6df
              (= origin/rust-port/parity-v2 w chwili oceny, merge-base zgodny)
ZMIANY/COMMIT: tylko ten raport (commit na gałęzi lokalnej rust-port-wip/frame-quant-q1-eval nad f81611212)
TESTY: §2 — wszystkie bramki odtworzone, EXIT 0; generator bit w bit; kandydaci @1/@4/@16 po 125/128 (118/196/221)
BLOKADY: brak blokujących. Uwagi U1–U6 (§5): nowe gałęzie D-FQ-2 bez testu zabijającego (E5, E8), klasa odczytu
         zegara wieży (Q20/Q22 + E6/E7), czułość kolejności faz w czasie rzeczywistym (E2), błędny opis Q25
RUNDY: 1/5
NASTĘPNY KROK: Obrona Operatora (U1–U6), potem Final Control
DEPLOY/PUSH: NIE WYKONANO
```

## 1. Web najpierw — weryfikacja mechanizmu na tekście pinu (`git show 07d2fbd72:gra/src/battle/battleScene.ts`)

| Teza Operatora | Sprawdzenie w pinie | Wynik |
|---|---|---|
| `_drainTimers` nie przesuwa `vNow` do `due` | `:9616-9634`: `target = this._now()`, pętla wybiera najmniejszy `due <= target` (remis `id`), `timer.cb()` bez zmiany `vNow`; komentarz o „kursorze” nieaktualny | potwierdzone |
| `_schedule(ms)` z callbacku: `due = czas klatki + ms` | `:9595-9606`: `due: this._now() + Math.max(0, ms)`, `id: this.vTimerSeq++` | potwierdzone |
| FF: zegary, potem kolejka `_raf` tej samej iteracji | `:9414-9437`: `vNow += FF_STEP_MS; _drainTimers(); … q = _ffQueue; _ffQueue = []; for (cb of q) cb();` (`_raf` = `_ffQueue.push` przy `_ffActive`, `:9406-9409`) | potwierdzone |
| cios przy `localT >= 150`, koniec lunge `>= 260`, potem `_schedule(220)` z klatki końca lunge | `:9114-9172` (`t0 = this._now()`, `this._raf(stepAnim)` także dla pierwszego kroku) | potwierdzone; kwantyzacja `ceil(ms/F)*F` poprawna niezależnie od tego, czy pierwszy krok `_raf` idzie w tej samej klatce (wywołanie z fazy zegarów, `localT = 0`) czy w następnej (`localT = F`) |
| `FF_STEP_MS = _scaledWallDelta(16)` | `:9419`, `:9512-9515` (`clamp * speedMul`); Rust `VirtualClock::scaled_wall_delta` identyczny, `diag_set_speed_mul` przelicza `frame_ms` | potwierdzone |
| remis `due` krok-z-zegara vs zegar wieży = wieża pierwsza | wystrzał planowany w `_beginTurn` (mniejsze `id`), trafienie planowane `380` ms przed `due`, a przerwa `70` ms przed — `id` trafienia zawsze mniejsze | potwierdzone rachunkiem |

Wniosek: model D-FQ-1/2/3 wynika z tekstu pinu, nie z dopasowania do wyników.

## 2. Bramki odtworzone (worktree `wf_6a1aa039-fb6-2`, checkout `f81611212`, `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie, usunięty po ocenie)

| Bramka | Wynik |
|---|---|
| `cargo fmt --all -- --check` (engine) | **FMT_EXIT=0** |
| `cargo clippy --all-targets -- -D warnings` (engine) | **CLIPPY_EXIT=0** |
| `cargo test --all-targets --no-fail-fast` (engine, pełny, w tle) | **FULL_EXIT=0**: 4197 passed, 0 failed, 1 ignored (sprzed tematu; diff `0522ad6df..f81611212` dodaje 0 `#[ignore]`); w tym `p6_k5loop_wiring_a_pin` 8/8 (42 wektory, 69,5 s debug), `p6_k5loop_wiring_b*`, `bridge_contract`, `p6_k5loop_*`, `p6_zdobycie_miasta_a*`, `pin3_timeline_tests` |
| Generator (pełna regeneracja z tekstu pinu, strażnik SHA-256 `3eeeb760…`) | **GEN_EXIT=0**, `vectors.json` **`ec89d91d3e9fccee3461752969757f12`**, `pin_data.json` **`432eed76e34a0e8cc96ec548e88eae64`** — bit w bit z commitem; `git status` czysty |
| Dawne wektory | 22/22 dawnych wpisów identycznych (porównanie obiektów JSON), `git diff` = 28 738 linii dodanych, 0 usuniętych; 20 nowych (`fq_*` × 12 @16, `_klatka4` × 4, `_klatka1` × 4) |
| Kandydaci c1 — pin (generator, `WIRING_A_EXTRA`) | @16 MD5 `307d59423be5fd54379ec3bc06f87efe`, @1 `ed9a3c98f893643da23c694c3a282157`, @4 `2fa9d691a1476d9d7a6391afb953d59c` = te same pliki co u Operatora/PIN3 |
| Kandydaci c1 — Rust (`kandydaci_z_pliku_na_zadanie`, binarka z kodu tematu) | **@16: 125/128**, **@1: 125/128**, **@4: 125/128**; rozbieżne zawsze i wyłącznie `118`, `196`, `221` (klasa A MARCH-INCREMENTAL, poza zakresem) |
| `mur_jazda_rzeka` @16 i `mur_jazda_rzeka_klatka1` | zgodne bajt w bajt jako zwykłe wektory (`ROZBIEZNE_B_WIRA_PIN_2` puste) |

Kryteria końca dispatchu (128 @16 poza 118/196/221, `mur_jazda_rzeka` @16 bez wyjątku, @1 >= 125, bliźniaki `_klatka1`,
determinizm/niezależność od podziału kroków — testy sesji w pełnym przebiegu) — **spełnione, odtworzone niezależnie**.

## 3. Allowlista i zakazy

| Punkt | Wynik |
|---|---|
| Pliki zmienione | `siege_tactics_loop.rs`, `siege_battle_session.rs` (2 linie: `frame_ms`), `p6_k5loop_wiring_a_gen.mjs`, `p6_k5loop_wiring_a_pin.rs`, `p6_k5loop_wiring_a_pin_vectors/vectors.json`, raport + skrypt mutantów w `runs/…FRAME-QUANT-Q1/` |
| `bridge.rs`, `city_capture_apply.rs`, `playable.rs`, `client`, `renderer`, `src-tauri`, `gra/`, `Cargo.*`, `wiring_b*` | nietknięte |
| Katalog wektorów | dispatch pisze `p6_k5loop_wiring_a_vectors/*`, generator od zawsze pisze do `p6_k5loop_wiring_a_pin_vectors/` — rozbieżność nazwy w dispatchu, nie w pracy (U6) |
| Strażnik SHA pinu i MD5 | zachowane; jedyna zmiana generatora poza scenariuszami to ślad diagnostyczny pod `WIRING_A_TRACE`/`WIRING_A_TRACE_SCHED` (bez wpływu: MD5 odtworzony) |
| `#[ignore]`, osłabione asercje | 0 nowych `#[ignore]`; jedyne poluzowanie: `frameMs` dozwolone także dla `_klatka4` (obok `_klatka1`) — uzasadnione D-FQ-2, wektory nadal porównywane bajt w bajt |
| Trailery | tylko `Claude-Session:`, brak `Co-Authored-By` z modelem |
| Sekcja „Pliki spoza allowlisty” w raporcie Operatora | brak jawnej sekcji pod tą nazwą (jest §6 „Nie ruszano”) — U6 |

## 4. Mutanty Evaluatora (adwersarialne, poza listą Operatora; `mut_eval.py` w scratchpadzie, źródła przywrócone, `git status` czysty)

Test: `p6_k5loop_wiring_a_pin` (`wektory_pinu_pelnej_bitwy_bajt_w_bajt`, `kwantyzacja_odcinkow*`) + lib (`pin3_timeline_tests`,
`siege_tactics_fastforward`, `siege_tactics_loop::`). Dla przeżywających dodatkowo binarki mutantów na 128 kandydatach c1 @16 i @4
(pin z generatora, MD5 jak wyżej) i porównanie linia w linię z bazą.

| Mutant | Zmiana | Wynik |
|---|---|---|
| **E1** | **PRAWDZIWA zamiana faz FF** (`run_fast_forward`: kolejka `_ffQueue` PRZED `drain_timers`, bez kolejki po) | **ZABITY** (wektory, m.in. bliźniaki `_klatka1`) — kryterium czułości dispatchu spełnione dla przewijania |
| E2 | prawdziwa zamiana faz w czasie rzeczywistym (`step_realtime`: faza `_raf` przed `drain_timers`) | **PRZEŻYŁ** (tylko 2 wektory `realtime`); kod sprzed tematu (D-PIN3-3), ale kolejność faz jest kryterium tematu — U3 |
| E3 | `timeline_ord`: `now - d < F` → `<=` | PRZEŻYŁ — **równoważny**: krok z zegara przerwy wykonuje się w klatce `[d, d+F)`; następny wpis tej jednostki najwcześniej po `MOVE_STEP_MS = 240 > F` |
| E4 | `timeline_ord`: `d <= now` → `d < now` | PRZEŻYŁ — **równoważny**: `d == now` tylko gdy `70 mod F == 0` (F = 1, 2); wtedy czytający zegar ma `due <= now = ord`, więc `ord < reader` jest fałszywe dla obu wariantów |
| **E5** | marsz oblężniczy `_siegeWalkTo` (`ProdSiegeWalk::do_move`): bez `gap_after` dla kroku po przerwie (D-FQ-2 nieaktywne) | **PRZEŻYŁ**: wektory + lib + 2×128 kandydatów (@16, @4) identyczne z bazą. Nowa gałąź tematu (`if self.moves > 0 { gap_after(…) }`) bez żadnego testu — U1 |
| E6 | `has_future_steps`: czytający zawsze `f64::MIN` (bez `due` wieży) | PRZEŻYŁ — ta sama klasa co Q20/Q22 (odczyt osi przy trafieniu wieży), dług FQ-TOWER-HIT-DUE — U2 |
| E7 | trafienie wieży: `facing_at(tref, now, f64::MIN)` zamiast `reader_due` | PRZEŻYŁ — klasa Q20/Q22 — U2 |
| **E8** | `set_now` nie zeruje `gap_due` | **PRZEŻYŁ** (wektory + lib + 2×128 kandydatów). NIE jest równoważny: `gap_due` jest jedno na całe ciało, a wywołanie ciała innej jednostki Y w oknie atomowo policzonego marszu X może mieć krok w klatce `[d_X, d_X+F)` → fałszywy klucz `ord = d_X`. Nowa gałąź tematu bez testu — U1 |

Ocena listy Operatora: 26 mutantów sprawdzonych w skrypcie i raporcie; zabicia Q1–Q3, Q5–Q7, Q9, Q10, Q13–Q19, Q21, Q23,
Q24, Q26 wiarygodne (E1 potwierdza czułość kolejności faz FF niezależnie od Q24). Równoważności Q4, Q8, Q11, Q12 —
uzasadnienia poprawne (Q12 zmienia tylko `land_at` dla renderera, dług SHOT-LAND-AT-RENDER). **Q25 jest opisany błędnie**:
mutant DOKŁADA przetwarzanie kolejki przed `drain_timers`, nie usuwając tego po — to no-op, a nie „zamiana faz” (U4).
Q20/Q22 — nieobserwowalne, jawny dług; odstępstwo od „każdy zabity lub równoważny” zgłoszone przez Operatora uczciwie.

## 5. Uwagi (do Obrony / FC)

- **U1 (test, nowe gałęzie)**: E5 i E8 przeżywają cały korpus (42 wektory, lib, 384 przebiegi kandydatów) — gałęzie
  D-FQ-2 dodane w temacie (`ProdSiegeWalk::do_move` → `gap_after`, reset `gap_due` w `set_now`) nie mają testu. Oba da się
  zabić tanio testem jednostkowym w `pin3_timeline_tests`: (a) marsz `_siegeWalkTo` z klatką 16 — wpis osi kroku po przerwie
  ma `ord = due przerwy` (zegar wieży z `due` większym w tej klatce widzi krok wykonany); (b) dwa wywołania ciała
  (`set_now`) — drugie nie dziedziczy `gap_due` pierwszego. Wymagane: test albo jawna równoważność z dowodem.
- **U2 (klasa FQ-TOWER-HIT-DUE)**: Q20, Q22, E6, E7 — cztery mutanty odczytu osi czasu ciała przy TRAFIENIU wieży
  nieobserwowalne. Kod zgodny z pinem (`_drainTimers` w kolejności `due`). Rekomendacja Operatora (test `SiegeLoop::tower_hit`
  z atrapą ciała) jest właściwa; jeśli nie w tej rundzie — dług z numerem, jak zapisano w §9 raportu Operatora (dopisać E6/E7).
- **U3 (czułość kolejności faz w czasie rzeczywistym)**: E2 przeżywa — 2 wektory `realtime` nie rozróżniają kolejności
  `_drainTimers`/`_raf` w `step_realtime`. Pin w AUTO (`_startLoop` `:9245-9291`): pętla `loop` rejestruje następną klatkę
  przed `_drainTimers`, więc kroki `_raf` z klatki k idą w klatce k+1 PO jej `_drainTimers` — model Rust (faza `_raf` po
  `drain_timers`) jest zgodny co do chwili skutku, ale nic tego nie pilnuje. Kod sprzed tematu; propozycja: bliźniak
  `realtime` scenariusza, który zabija Q24/E1 (np. `fq_rown_mix_d8l_mury_217` w trybie `realtime`) albo jawny dług.
  Uwaga praktyczna: generator w trybie `realtime` jest bardzo wolny (300–700 s na bitwę 400 tur), więc wybrać krótką bitwę.
- **U4 (raport)**: opis Q25 jako „kolejka `_ffQueue` PRZED `_drainTimers` (test czułości kolejności)” jest mylący — to
  mutant no-op. Właściwy test zamiany faz FF to E1 (ZABITY) i Q24 (ZABITY). Poprawić opis w raporcie/skrypcie.
- **U5 (zakres poza 16 ms)**: @32 124/128, @64 117/128 (diagnostyczne, prędkości `SPEED_STEPS` nieportowane) —
  poza kryterium dispatchu, sklasyfikowane w długach FQ-SPEED; nie weryfikowałem @32/@64 (NIE_ZMIERZONO przez Evaluatora).
- **U6 (formalne)**: brak jawnej sekcji „Pliki spoza allowlisty” w `01-operator-r1.md` (stan: brak takich plików);
  ścieżka wektorów w dispatchu (`p6_k5loop_wiring_a_vectors`) ≠ faktyczna (`p6_k5loop_wiring_a_pin_vectors`) — do
  poprawy w dispatchu/rejestrze, nie w kodzie.

## 6. Długi (stan po ocenie)

| ID | Stan |
|---|---|
| MARCH-INCREMENTAL (118, 196, 221) | potwierdzone @1/@4/@16 — bez zmian, temat następczy |
| FQ-TOWER-HIT-DUE | Q20, Q22 + **E6, E7** (dopisać) |
| FQ-D2-SIEGEWALK / FQ-GAPDUE-RESET (nowe, z E5/E8) | do zamknięcia testem jednostkowym (U1) albo jako dług z numerem |
| FQ-REALTIME-ORDER (nowy, z E2) | czułość kolejności faz w `step_realtime` niepilnowana wektorem (U3) |
| SHOT-LAND-AT-RENDER, FQ-SPEED, D-PIN3-3-SHOT-ID, PRE-SKIP-RAF | jak w raporcie Operatora §9 — bez uwag |

## 7. Sprzątanie

Target `fqev/tgt_fqev`, binarki mutantów `bin_*` i pliki kandydatów w scratchpadzie usunięte po ocenie; `git status`
worktree czysty poza tym raportem.
