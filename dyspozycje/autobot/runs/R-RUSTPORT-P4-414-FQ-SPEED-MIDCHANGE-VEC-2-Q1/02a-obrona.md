# R-RUSTPORT-P4-414-FQ-SPEED-MIDCHANGE-VEC-2-Q1 — Obrona Operatora r1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-414-FQ-SPEED-MIDCHANGE-VEC-2-Q1
GOAL: wektory pinu `07d2fbd72` dla zmiany prędkości w trakcie odcinka `_raf` (cios wypadu o klatkę, koniec wypadu, krok falangi, krok `_advanceToward`) i zgodność `SiegeLoop::respeed` bajt w bajt; mutanty E3/E7/E8 i plan kroku falangi / `_advanceToward` zabite OD WEKTORÓW (albo równoważność udowodniona).
ZMIANY/COMMIT: gałąź `obrona-414-r1` od `174d9dac4` (Evaluator r1, nad kodem Operatora `5315b646c`, baza `bb92c80fa`); commity `4bccf5293` (2 wektory kroku falangi, doktryna w `run_midchange`, `movingPh` wymagany), `91f196af4` (fmt), raport = ostatni commit gałęzi. Pliki: `rust-port/engine/tests/p6_k5loop_wiring_a_gen.mjs` (dopiski), `rust-port/engine/tests/p6_k5loop_wiring_a_pin.rs` (dopiski), `rust-port/engine/tests/p6_k5loop_wiring_a_pin_vectors/speed_change_vectors_2.json` (14 bitew, MD5 `7cb931b2cfcda6df86fbe6f85d5c7745`). Kod produkcyjny: BEZ ZMIAN (D-414-3: brak rozbieżności).
TESTY: fmt EXIT 0; clippy `--all-targets -D warnings` EXIT 0; pełny `cargo test --all-targets --no-fail-fast` EXIT 0 (559 binarek, 4380/0/1 ignored); 14/14 wektorów bajt w bajt; M-Z1a zabity od wektorów; E7 równoważny w produkcji (0 odrzuceń strażnika na 347 417 planach).
BLOKADY: brak.
RUNDY: 1/5 (obrona)
NASTĘPNY KROK: Final Control (`03-final-control.md`).
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na zarzuty

| Zarzut | Odpowiedź | Dowód |
|---|---|---|
| Z1 (krok falangi osiągalny, dowód nieosiągalności fałszywy) | **PRZYJMUJĘ** | §1: 2 nowe wektory `movingPh` z doktryną `'manual'`, bajt w bajt z pinem i z sondą Evaluatora |
| Z2 (M-Z1a i E7 przeżywają) | **PRZYJMUJĘ** M-Z1a (zabity od wektorów); E7 — **ODRZUCAM jako zabijalny w produkcji**, równoważność udowodniona | §2 |
| Z3 (komentarze, `RAF_KLASY_WYMAGANE`, doktryna w teście, gałąź `None` w `base2`) | **PRZYJMUJĘ** | §3 |
| Potwierdzenia (bramki, allowlista, regeneracja 12/12) | przyjęte; powtórzone po zmianach | §4, §5 |

## 1. Z1 — krok falangi (PRZYJMUJĘ)

Tekst pinu (`git show 07d2fbd72:gra/src/battle/battleScene.ts`) potwierdza zarzut: `_isUnitDoctrineAuto` (`:17621-17623`) zwraca `false` dla `unitDoctrine === 'manual'`, więc `_activateUnit` omija gałąź doktryny (`:6092-6098`) i dochodzi do `:6290` `_phalanxAction` → `_phalanxStep` `:6588` → `_doMove` `:6635`. Mój §2.1 w `01-operator-r1.md` był błędny: badałem wyłącznie doktrynę AUTO (`unitDoctrine = null`).

Poprawka (`4bccf5293`):
- Generator: `EXTRA2_SCENARIOS` = 2 scenariusze z doktryną `'manual'` falang atakującego (mechanizm `sc.doctrine` z #404, ustawiany przed `play()`), takie jak w sondzie Evaluatora:
  - `ev_falangi_manual_mur`: seed 409, mury, rzeka, atk F,F,W,W,L,L (`doctrine.atk = ['manual','manual']`), def W,F,L,L;
  - `ev_falangi_manual_pal`: seed 414, palisada, atk F,F,F,W,W,Taran (`['manual','manual','manual']`), def W,L,L.
- 2 nowe przypadki (zestaw 14 ≤ 16, D-414-2): `sc2_ev_falangi_manual_pal_x1_movingPh4` (klatka 237, x1→x4, tura 2, `movingPh = 1`, 77 zdarzeń, wynik: atakujący tura 60) i `sc2_ev_falangi_manual_mur_x2_movingPh1` (klatka 259, x2→x1, tura 3, `movingPh = 1`, 37 zdarzeń, remis tura 150).
- Wektor zapisuje `doctrine` (wejście sceny), obok `input/seed/battleIndex`.
- Zgodność z dowodem Evaluatora: oba wektory po usunięciu pola `doctrine` są **identyczne** z `ph_vec.json` Evaluatora (MD5 `f55c727e…`, porównanie obiektów JSON w Pythonie: `True`, `True`).

Rust: `run_midchange` ustawia doktrynę z wektora przed pierwszą klatką (nowa funkcja `apply_vector_doctrine`: `GroupDoctrine::parse` napisu pinu → `body.doctrine[side][idx].unit_doctrine`, ten sam mechanizm co `run_move_order_vector`). Wynik `zmiana_predkosci_w_trakcie_klasy_raf_wektory_pinu_bajt_w_bajt`: **14/14 bajt w bajt** (chwila zmiany, strumień C/R/K/D z czasem, klatki, wynik), w tym 2 bitwy kroku falangi → D-414-3: zero zmian kodu produkcyjnego.

Kryterium 1 po poprawce: 14 bitew (≥ 8), klasy z zastosowaną zmianą: `movingPh` 2, `movingAdv` 4, `lungeShift` 4, `lungeTail` 4 (wszystkie ≥ 2, wymagane asercją).

## 2. Z2 — mutanty

Skrypt mutacji na pliku z przywróceniem (`scratchpad/ob414/mut.py`, `cargo test --release --test p6_k5loop_wiring_a_pin`), worktree czysty po każdej serii (`git status` pusty).

| ID | mutacja | nowe wektory (14) | wynik |
|---|---|---|---|
| M-Z1a | brak `put_step_done_plan` w `phalanx_action` (`siege_tactics_loop.rs:5537`) | **FAILED** (`klasy_raf_wektory_pinu_bajt_w_bajt`, EXIT 101) | **zabity od wektorów** (wcześniej przeżywał) |
| E3, E8, M-Z1b, MT | jak u Evaluatora | zabite już na 12 wektorach; dopisanie 2 wektorów i doktryny (no-op dla wektorów bez `doctrine`) tego nie zmienia | zabite od wektorów (pomiar Evaluatora; nie powtarzałem) |
| E7 | strażnik planu `due.is_some() && planned.is_finite()` zamiast równości bitowej | — | **równoważny w produkcji** (niżej) |
| MB | `end_old <= now` → `<` | — | równoważny (uzasadnienie Evaluatora, przyjmuję) |

### E7 — dowód równoważności (ODRZUCAM jako mutant zabijalny wektorem)

Mutant różni się od oryginału tylko wtedy, gdy strażnik `schedule_body` (`siege_tactics_loop.rs:810`) ODRZUCA plan, czyli przy `p.frame > 0`, `due` istnieje i `due != planned` (bitowo), albo gdy `planned` nie jest skończone.

1. Argument z kodu (`ProdBody`): każdy plan ma `frame = self.frame_ms`, a klocek, do którego trafia, ma czas `frame_raf(frame_ms, plan.ms) + plan.then` (`put_raf_plan` `:3471` ciosu: `dur = 0 + frame_raf(F, body_ms)` przy `attack_pre == 0`; `:3939` koniec kroku marszu: `MOVE_STEP_MS`; `:6498` ogon: `lunge_end + BLOW_SETTLE_MS`, `lunge_end = frame_raf(F, rel)` albo 0 przy `rel <= 0`, wtedy `target <= now` i `planned = now + then`; `put_step_done_plan` `:5537`/`:7788`: `step_ms = frame_raf(F, MOVE_STEP_MS)`). Zatem `due = now + frame_raf(F, ms) + then`, a `planned = now + frame_raf(F, (now + ms) - now) + then`. Wszystkie wartości (`vNow` = suma kroków `16·speedMul`, `ms`, `then`) są całkowite i ≪ 2^53, więc `(now + ms) - now == ms` i oba wyrażenia są równe bitowo; `planned` jest skończone. Strażnik w `ProdBody` nigdy nie odrzuca planu — odrzuca go tylko atrapa `bad_plan` w teście jednostkowym (`respeed_tests`, klatka planu ≠ kwantyzacji `due`).
2. Pomiar (instrumentacja tymczasowa, cofnięta): licznik przyjętych/odrzuconych planów w strażniku na CAŁEJ binarce `p6_k5loop_wiring_a_pin` (19 testów: `vectors.json` 45, `speed_vectors` 288, `speed_change_vectors` 40, `speed_change_vectors_2` 14, `tower_due_order` 74, `move_order`, kwantyzacja, kontrakty, mutanty sterownika `MID_MUTANTS` z innymi siatkami): **przyjęte 347 417, odrzucone 0**, 19/19 ok.

Wniosek: w produkcji E7 jest mutantem równoważnym; wektorem pinu nie da się go zabić (każdy wektor przechodzi przez `ProdBody`). Strażnik zostaje jako obrona przed przyszłym ciałem z niespójnym planem i jest pokryty testem jednostkowym (`respeed_tests`, mutant E7 ginie tam, #413). Kryterium 3 dla E7: spełnione w wariancie „udokumentowana równoważność”, o który prosił Evaluator (§4 `02-evaluator.md`).

## 3. Z3 — porządek (PRZYJMUJĘ)

- Komentarz „krok falangi NIE jest osiągany w AUTO” nad `EXTRA2_SCENARIOS` (generator) zastąpiony opisem ścieżki pinu przez doktrynę `'manual'` (`:17621-17623`, `:6092-6098`, `:6290`, `:6588`, `:6635`). W diffie wobec bazy nie ma już tekstu o nieosiągalności (`git diff bb92c80fa | grep -i nieosi` = 0).
- `RAF_KLASY_WYMAGANE` = `["movingPh", "movingAdv", "lungeShift", "lungeTail"]` (4 klasy, każda ≥ 2 bitwy); komentarz poprawiony.
- Test Rust ustawia `unit_doctrine` przed `play()` (`apply_vector_doctrine` w `run_midchange`; brak pola `doctrine` = bez zmian, więc stare 40 wektorów i 12 dotychczasowych bez wpływu).
- Gałąź `None` w `base2` pokryta: 2 wektory spoza `vectors.json`; nowa asercja `n_extra >= 2` w teście bajt w bajt.

## 4. Wektory — wykonanie tekstu pinu

- Pełna regeneracja `speed_change_vectors_2.json` z tekstu pinu po zmianach: 4 procesy `WIRING_A_SPEED_CHANGE2_SHARD=k/4` (EXIT 0 każdy, strażnik SHA-256 `3eeeb760…` sprawdzony w każdej części) + `_MERGE`: `przypadkow 14/14`, MD5 `7cb931b2cfcda6df86fbe6f85d5c7745` = plik w commicie, `git status` czysty.
- 12 dotychczasowych wektorów: bez zmian treści — plik scalony ze starego pliku 12 bitew i 2 nowych wektorów ma ten sam MD5 `7cb931b2…` co plik z pełnej regeneracji.
- Istniejące pliki wektorów (D-414-1): nietknięte (`git diff --stat bb92c80fa`: tylko 3 pliki z allowlisty).

## 5. Bramki engine

- `cargo fmt --check`: EXIT 0 (po `cargo fmt`, commit `91f196af4`).
- `cargo clippy --all-targets -- -D warnings`: EXIT 0.
- pełny `cargo test --all-targets --no-fail-fast` (debug, `CARGO_TARGET_DIR` w scratchpadzie, usunięty po bramce): **EXIT 0**, 559 binarek, **4380 passed / 0 failed / 1 ignored** (liczba testów bez zmian wobec r1: dopisano asercje i wektory, nie nowe testy); w tym `zmiana_predkosci_w_trakcie_klasy_raf_*` (14 wektorów), stare 40 `speed_change`, `speed_vectors`, `tower_due_order`, `move_order`, `vectors.json` — zielone. Brak nowych `#[ignore]`, brak osłabionych asercji (doszły dwie: `movingPh` ≥ 2 bitwy, `n_extra` ≥ 2).

## 6. NIE_ZMIERZONO

1. E3, E8, M-Z1b, MT na zestawie 14 wektorów — nie powtarzałem (zabite przez Evaluatora na 12, które są podzbiorem 14; zmiana testu jest no-op dla wektorów bez `doctrine`).
2. Mutant E7 uruchomiony jako mutant na 14 wektorach — nie uruchamiałem; zamiast tego pomiar strażnika (0 odrzuceń), który jest warunkiem koniecznym rozróżnienia.
3. Pozostałe 19/40 scenariuszy sondy Operatora — bez wpływu na wynik (wszystkie 4 klasy pokryte).
4. Regeneracja starych plików wektorów nowym generatorem — nie uruchamiałem (dopiski bramkowane `sc.probe2`, `sc.doctrine` i zmiennymi `WIRING_A_SPEED_CHANGE2_*`; stare testy Rust zielone).

## 7. Pliki

- `/home/user/The-Game/.claude/worktrees/wf_1fe543e2-661-3/rust-port/engine/tests/p6_k5loop_wiring_a_gen.mjs`
- `/home/user/The-Game/.claude/worktrees/wf_1fe543e2-661-3/rust-port/engine/tests/p6_k5loop_wiring_a_pin.rs`
- `/home/user/The-Game/.claude/worktrees/wf_1fe543e2-661-3/rust-port/engine/tests/p6_k5loop_wiring_a_pin_vectors/speed_change_vectors_2.json`
- `/home/user/The-Game/.claude/worktrees/wf_1fe543e2-661-3/dyspozycje/autobot/runs/R-RUSTPORT-P4-414-FQ-SPEED-MIDCHANGE-VEC-2-Q1/02a-obrona.md`
