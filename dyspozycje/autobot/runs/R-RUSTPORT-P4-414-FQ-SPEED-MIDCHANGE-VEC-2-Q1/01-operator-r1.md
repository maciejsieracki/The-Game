# R-RUSTPORT-P4-414-FQ-SPEED-MIDCHANGE-VEC-2-Q1 — Operator r1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-414-FQ-SPEED-MIDCHANGE-VEC-2-Q1
GOAL: wektory pinu (wykonanie tekstu `07d2fbd72`) dla zmiany prędkości trafiającej w odcinek `_raf` w toku — wypad wręcz z przesunięciem ciosu o klatkę, krok falangi, krok `_advanceToward` — i zgodność sesji Rust (`SiegeLoop::respeed`) bajt w bajt; mutanty E3/E7/E8 (#413) i plan kroku falangi / `_advanceToward` zabite OD WEKTORÓW.
ZMIANY/COMMIT: gałąź `rust-port-wip/414-speed-midchange-vec-2` na bazie `bb92c80fa` (= `origin/rust-port/parity-v2`); commity `ab440c207` (WIP), `5cf31fa24` (wektory + test), `853ccfe47` (sonda falangi, fmt), raport — SHA w ostatnim commicie gałęzi (`git log -1`). Pliki: `rust-port/engine/tests/p6_k5loop_wiring_a_gen.mjs` (dopiski), `rust-port/engine/tests/p6_k5loop_wiring_a_pin.rs` (dopiski), NOWY `rust-port/engine/tests/p6_k5loop_wiring_a_pin_vectors/speed_change_vectors_2.json` (MD5 `e86ae5c8bf2394d00ffeb29dd195efff`). Kod produkcyjny: BEZ ZMIAN (D-414-3: brak rozbieżności).
TESTY: engine fmt EXIT 0, clippy `--all-targets -D warnings` EXIT 0, pełny `cargo test --all-targets --no-fail-fast` EXIT 0 (4380 passed / 0 failed / 1 ignored); nowe wektory 12/12 bajt w bajt; mutanty E3, E8, M-Z1b zabite od wektorów, E7 i M-Z1a przeżywają (§4).
BLOKADY: brak infrastrukturalnych. Merytoryczne: klasa „krok falangi” nieosiągnięta w pinie w AUTO oblężenia (§2.1); mutant E7 nie ginie od wektorów (§4).
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (`02-evaluator.md`).
DEPLOY/PUSH: NIE WYKONANO

## 1. Web najpierw (pin `07d2fbd72`, `gra/src/battle/battleScene.ts`)

- `_doMeleeAttack` `:9096-9174`: `t0 = _now()` (`:9115`), cios w pierwszej klatce z `localT >= BLOW_HIT_T` (150, `:9122`), koniec wypadu w pierwszej klatce z `localT >= BLOW_LUNGE_MS` (260, `:9149`), potem `_schedule(BLOW_SETTLE_MS)` (220, `:9154`).
- `_doMove` `:8746-8775`: `p = (_now() - t0) / MOVE_STEP_MS` (240) w każdej klatce, `done` przy `p >= 1`.
- `_advanceToward` `:7892-7916` → `_doMove(ru, nc, nr, done)` `:7915`; wołany z `:6215` (katapulta poza zasięgiem muru), `:8035` (taran bez drogi BFS), `:8049` (wieża bez drogi BFS).
- `_phalanxAction` `:6546-6578` → `_phalanxStep` `:6588-6636` → `_doMove` `:6635`; wymaga ≥ 2 falang (`_phalanxLineFront` `:6519-6528`).
- `_setSpeedIdx` `:9518-9527`, `_advanceVClock`/`_scaledWallDelta` `:9500-9515`: zmiana działa od następnej klatki; w pinie nic nie jest przeliczane w chwili zmiany — odcinek kończy się w pierwszej klatce NOWEJ siatki `>= t0 + ms`.

## 2. Sonda (D-414-2) i dobór przypadków

Generator: nowe obserwatory `probe2` (opakowania `_phalanxStep` / `_advanceToward` / `_doMove` / `_doMeleeAttack`, tekst pinu bez zmian, strażnik SHA-256 `3eeeb760…` bez zmian, sprawdzany w każdej części). Licznik klasy = odcinki w toku, dla których koniec przy starej siatce `16·speedMul_old` ≠ koniec przy nowej (`ceil((t0+ms-vNow)/F)·F`):
`movingPh` (krok falangi), `movingAdv` (krok `_advanceToward`), `lungeShift` (wypad przed ciosem, cios przesunięty o klatkę), `lungeTail` (wypad po ciosie przed końcem, przesunięty koniec + settle).
Nowe `at.when` (tylko z `probe2`): `movingPh`, `movingAdv`, `lungeShift`, `lungeTail`. Tryby: `WIRING_A_SPEED_CHANGE2_SONDA=1` (bez zmian prędkości, raport klas), `WIRING_A_SPEED_CHANGE2_VECTORS=1` (+ `_SHARD=k/n`, `_MERGE=…`, `_ONLY=…`).

Sonda x1 (realtime), 21 z 40 scenariuszy bazowych (reszta przerwana limitem czasu tła; dobór wystarczył):
- `_advanceToward`: kroki w turach 1–25 w `rt_mur_machiny_wylom`, `mur_machiny_wylom`, `mur_jazda_rzeka`, `p3_las_jazda_d6l_mury_111`, `b07_las_katapulta_zejscie_z_korony`, `b03_wzgorza_palisada_katapulta` (tarany/katapulty).
- wypady wręcz: 1–34 na bitwę w większości scenariuszy (pierwsze po ~turze 30–45).
- `_phalanxStep`: **0** w 21 scenariuszach.

### 2.1 Krok falangi — nieosiągalny w AUTO oblężenia (dowód z sondy i tekstu pinu)

- Obrońcy oblężenia kończą `_activateUnit` w `:6225-6236` (gałąź `ru.side === 'def' && siegeWallCol >= 0`), przed `:6290` (`if (ru.phalanx) this._phalanxAction`).
- Atakujący w AUTO (`unitDoctrine = null`, `autoPlay` grupy domyślnie `true` → `_isUnitDoctrineAuto` `:17621-17628` = true) idą przez `_executeGroupDoctrineStep` (`:6092-6098`) przed gałęzią taktyczną.
- Pomiar: dwa dodatkowe scenariusze z 3 i 2 falangami atakującego (palisada `seed 414`; mury z taranem `seed 415`), x1 do końca bitwy — `_phalanxStep` 0 wywołań (`_phalanxAction` także 0; pierwszy skończył się remisem tury 150 bez wypadów). Oba przypadki `movingPh` zostały pominięte (`POMINIETY …: zastosowano 0/n zmian`) i usunięte z listy; `EXTRA2_SCENARIOS = []` z komentarzem.
- Zastrzeżenie (uczciwie): to dowód z pomiaru + odczytu kodu dla AUTO bez doktryny; nie badałem, czy `_executeGroupDoctrineStep` może zwrócić `false` dla falangi atakującego przy innym układzie, ani ścieżki z doktryną `manual` (`sc.doctrine`, #404), która ominęłaby gałąź doktryny. Pokrycie wektorowe `phalanx_action` → `put_step_done_plan` = **NIE_ZMIERZONO** (zostaje test jednostkowy `p413_krok_falangi_ma_plan_raf`).

## 3. Wektory `speed_change_vectors_2.json` (D-414-1)

12 bitew (≤ 16), każda zmiana zastosowana w pinie (`changes.length == wanted.length`), format jak `speed_change_vectors.json` + liczniki klas w `changes[*]` oraz `input/seed/battleIndex` (test sprawdza równość z `vectors.json`). Istniejące pliki wektorów: bez zmian (MD5 `speed_change_vectors.json` = `a374deae…`, `vectors.json` = `9ceefda1…`).

| klasa | bitwy | pary (start→zmiana) |
|---|---|---|
| `movingAdv` (`_advanceToward`) | 4: `mur_machiny_wylom`, `b07_las_katapulta…`, `b03_wzgorza_palisada_katapulta`, `p3_las_jazda_d6l_mury_111` (+ druga zmiana w turze 30) | 1→4, 2→16, 1→8, 4→1 (→16) |
| `lungeShift` (cios o klatkę) | 4: `fq_las_mix_d8l_palisada_122`, `p3_wzg_mix_d5_palisada_156`, `b03_gory_lucznicy_mury_baszta`, `rt_mur_machiny_wylom` | 4→1, 2→8, 1→4, 8→2 |
| `lungeTail` (po ciosie, przed końcem) | 4: `p3_las_mix_d5_mury_123`, `fq_wzg_lucz2_d8l_palisada_162`, `p3_rown_mix_d8l_palisada_218`, `mi_las_mix_d3l_palisada_118` | 1→4, 2→16, 4→1, 1→64 |
| `movingPh` (falanga) | 0 — §2.1 | — |

Razem 1235 zdarzeń pinu (`C`/`R`/`K`/`D` z czasem). Czas generacji: 4 procesy, ok. 6 min ściany (najdłuższa część 345 s).

## 4. Rust: zgodność i mutanty

Test `zmiana_predkosci_w_trakcie_klasy_raf_wektory_pinu_bajt_w_bajt` (chwila każdej zmiany, strumień zdarzeń z czasem, liczba klatek, wynik): **12/12 bajt w bajt, 0 rozbieżności** → D-414-3: zero zmian kodu produkcyjnego. Pokrycie wymagane: ≥ 8 bitew, `movingAdv`/`lungeShift`/`lungeTail` po ≥ 2 bitwy (zmierzone 4/4/4).

Test `zmiana_predkosci_w_trakcie_klasy_raf_mutanty_sterownika_daja_fail` (8 mutantów sterownika z #412, rozbieżne przypadki z 12): Early 12, Grid16 8, Late 12, NewGridOldClock 12, OldGrid 11, Skip 12, SkipLater 1, WrongSpeed 12 — wszystkie zabite.

Mutanty kodu (`siege_tactics_loop.rs`, zastosowane na pliku i przywrócone skryptem; worktree czysty po serii; `cargo test --release --test p6_k5loop_wiring_a_pin -- klasy_raf_wektory_pinu w_trakcie_bitwy_wektory_pinu`):

| ID | mutacja | stare wektory (40) | nowe wektory (12) | wynik |
|---|---|---|---|---|
| E3 | `respeed` bez `+ p.then` (`:843`) | przechodzą | **FAIL** | zabity od wektorów |
| E7 | strażnik planu bez porównania bitowego `due` (`:810` → `due.is_some() && planned.is_finite()`) | przechodzą | przechodzą | **przeżywa** (zabity tylko lib, jak w #413) |
| E8 | brak planu ciosu w `attack_tail` (`if false && attack_pre == 0.0 …`, `:3469`) | przechodzą | **FAIL** | zabity od wektorów |
| M-Z1a | brak `put_step_done_plan` w `phalanx_action` (`:5537`) | przechodzą | przechodzą | przeżywa — klasa nieosiągnięta (§2.1) |
| M-Z1b | brak `put_step_done_plan` w `siege_atk_advance_toward` (`:7788`) | przechodzą | **FAIL** | zabity od wektorów |

E7: strażnik odrzuca plan tylko, gdy `due` klocka ≠ `t + frame_raf(frame, ms) + then`; w żadnym z 52 wektorów taki plan nie trafia na zmianę prędkości w toku — wektorowo nierozróżnialny. Nie szukałem dalej (budżet D-414-2); kandydat: plan przy `attack_pre > 0` / planowaniu AUTO-batch. NIE_ZMIERZONO.

## 5. Bramki engine

- `cargo fmt --check`: EXIT 0.
- `cargo clippy --all-targets -- -D warnings`: EXIT 0.
- pełny `cargo test --all-targets --no-fail-fast` (debug, `CARGO_TARGET_DIR` w scratchpadzie, usunięty po bramce): EXIT 0, 559 binarek, 4380 passed / 0 failed / 1 ignored (bazowo 4370 + 2 nowe testy + pozostałe z #404); w tym stare wektory zmiany prędkości 40/40, `speed_vectors`, `tower_due_order`, `move_order`, `vectors.json` — zielone.

## 6. NIE_ZMIERZONO

1. Pokrycie wektorowe kroku falangi (`phalanx_action` → plan `_raf`) — klasa nieosiągnięta w AUTO oblężenia (§2.1); ścieżka z doktryną `manual` niebadana.
2. Mutant E7 od wektorów (§4).
3. Sonda dla 19 z 40 scenariuszy bazowych (przerwana limitem tła); nie wpływa na wynik (klasy `movingAdv`/`lunge*` znalezione wcześniej).
4. Regeneracja istniejących plików wektorów nowym generatorem nie była uruchamiana (koszt czasu); dopiski są bramkowane polami `sc.probe2` / nowymi zmiennymi `WIRING_A_SPEED_CHANGE2_*`, a jedyna zmiana wspólnej ścieżki to zapis/odtworzenie zmiennej klasy w opakowaniu `_doMove` (bez wpływu na wywołanie pinu) — zgodność z istniejącymi plikami potwierdza tylko Rust (stare testy zielone), nie bajtowe porównanie wyjścia generatora.
5. Budżet: temat przekroczył ~3 h po stronie Operatora (sonda x1 w czasie rzeczywistym przy 4 rdzeniach i równoległym obciążeniu maszyny); zakres nie był rozszerzany.

## 7. Pliki

- `/home/user/The-Game/.claude/worktrees/wf_1fe543e2-661-1/rust-port/engine/tests/p6_k5loop_wiring_a_gen.mjs`
- `/home/user/The-Game/.claude/worktrees/wf_1fe543e2-661-1/rust-port/engine/tests/p6_k5loop_wiring_a_pin.rs`
- `/home/user/The-Game/.claude/worktrees/wf_1fe543e2-661-1/rust-port/engine/tests/p6_k5loop_wiring_a_pin_vectors/speed_change_vectors_2.json`
