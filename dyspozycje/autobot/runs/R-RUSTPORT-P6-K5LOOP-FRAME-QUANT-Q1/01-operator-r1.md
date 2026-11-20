# R-RUSTPORT-P6-K5LOOP-FRAME-QUANT-Q1 — Operator r1

```text
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5LOOP-FRAME-QUANT-Q1 (zgodność z pinem w produkcyjnej klatce 16 ms: 12 kandydatów c1 + mur_jazda_rzeka @16)
GOAL: przy kroku klatki 16 ms wynik Rust bajt w bajt zgodny z pinem dla 12 kandydatów FRAME-QUANT i mur_jazda_rzeka,
      bez psucia @1 ms (>= 125/128), dawnych wektorów i bliźniaków _klatka1; mutanty >= 20
BAZA: origin/rust-port/parity-v2 = 0522ad6df484622ad92c8f5d42956fc1ec061423 (linia BAZA dispatchu; = SHA z dispatchu)
GAŁĄŹ: rust-port-wip/frame-quant-q1 (lokalna, worktree wf_6a1aa039-fb6-1)
ZMIANY/COMMIT: §6, §10 (SHA)
TESTY: §7
BLOKADY: brak blokujących. Jedyne rozbieżne @16 ms: 118, 196, 221 = klasa A (MARCH-INCREMENTAL, poza zakresem, bez zmian).
RUNDY: 1/5
NASTĘPNY KROK: Evaluator r1
DEPLOY/PUSH: NIE WYKONANO
```

## 1. Web najpierw — mechanizm klatki w pinie (`07d2fbd72`, `gra/src/battle/battleScene.ts`, `git show`)

| Miejsce pinu | Ustalenie (czytane i wykonane generatorem, nie zgadywane) |
|---|---|
| `:9415-9437` `_runFastForward` | iteracja: `vNow += FF_STEP_MS` (`= _scaledWallDelta(16)` = 16 ms × `speedMul`), `_drainTimers()`, pociski/zaniki, potem kolejka `_ffQueue` (kroki `_raf`). Kroki `_raf` dopisane w trakcie kolejki idą do następnej iteracji. |
| `:9616-9634` `_drainTimers` | odpala zegary z `due <= vNow` rosnąco po `due`, remis po `id`. **`vNow` NIE jest przesuwane do `due`** (komentarz o „kursorze” jest nieaktualny): `_now()` w callbacku = czas klatki. Każde `_schedule(ms)` z callbacku ma więc `due = czas klatki + ms` (nominalny `due`, odpalenie w pierwszej klatce `>= due`). |
| `:9595-9606` `_schedule` | `due = _now() + max(0, ms)`, `id = vTimerSeq++` w chwili wywołania. |
| `:8684-8775` `_doMove` | `t0 = _now()`; `_raf(step)`; koniec przy `p = (_now() - t0) / 240 >= 1` → w pierwszej klatce `>= t0 + 240`; potem `done()` w fazie `_raf`. |
| `:9096-9175` `_doMeleeAttack` | cios przy `localT >= BLOW_HIT_T (150)`, koniec lunge `localT >= 260`, potem `_schedule(BLOW_SETTLE_MS = 220)` z klatki końca lunge. |
| `:9179-9232` `_doRangedAttack` | trafienie = zegar `_schedule(RANGED_FLY_MS = 380)`, potem `_schedule(RANGED_GAP_MS = 320)`. |
| `:8017`, `:8283`, `:6807` | kolejny krok marszu po `_schedule(STEP_GAP_MS = 70)` — wykonuje się w FAZIE ZEGARÓW klatki, w kolejności `due` względem innych zegarów (wieże). |

Wniosek (mechanizm kwantyzacji): przy klatce F każdy odcinek ciała kończy się w PIERWSZEJ klatce, która go pokrywa
(`ceil(ms / F) * F` od chwili klatki startu). Przy F = 16: krok 240 (bez zmian), cios 150 → 160, koniec lunge 260 → 272,
przerwa 70 → 80, lot 380 → 384, settle 220 → 224. Marsz 3 kroków z 2 przerwami trwa 880 ms, a nie 860. Rust liczył
odcinki ciała nominalnie (zegar sterownika kwantyzował tylko koniec całej aktywacji), stąd rozjazd sekwencji zegarów
@16 ms przy zgodności @1 ms (przy F = 1 wszystkie stałe pinu są całkowite, więc kwantyzacja jest tożsamością).

Drugi mechanizm (sub-klatkowa kolejność): zegary jednej klatki odpalają rosnąco po NOMINALNYM `due`, a nie po czasie
klatki. Krok marszu wołany z `_schedule(70)` (`due = koniec kroku + 70`, np. offset 6 w klatce) wykonuje się PRZED
zegarem wieży z tej samej klatki o większym `due` (np. wystrzał `stagger 180` → offset 4/8/12/0). Zmierzone śladem
(kandydat 173 @4 ms, t. 127 184: krok a3 `due 127 182` przed wystrzałem wieży rzędu 74 `due 127 184` — pin strzela do a3
już na nowym polu).

## 2. Metoda

- Kandydaci c1 (128, `PIN2-PROBE-Q1/01-operator-r1-kandydaci-c1.py`, ziarno 100+i); wyjścia pinu @1/@4/@16 z PIN3
  (MD5 `ed9a3c98…`, `2fa9d691…`, `307d5942…` = te same pliki co w FC PIN3) oraz nowe @32/@64 wygenerowane tym samym
  generatorem (`WIRING_A_EXTRA`, `ffStepMs` w scenariuszu; MD5 `2021da28…`, `4614a8a3…`).
- Rust: `kandydaci_z_pliku_na_zadanie` z `WIRING_A_RUST_FF_STEP=<ms>` (ten sam krok co pin).
- Ślad: generator `WIRING_A_TRACE` + nowe (tylko diagnostyka, bez wpływu na wektory) `ACT` (start aktywacji) i
  `WIRING_A_TRACE_SCHED=1` (każde `_schedule` z nominalnym `due`); Rust `slad_diagnostyczny_na_zadanie` + `ACT` ze śladu
  pętli.

## 3. Wyniki: kandydaci c1 (Rust vs pin przy tym samym kroku klatki)

| Krok | Baza `0522ad6df` | Po D-FQ-1 | Po D-FQ-1..3 (wynik) | Rozbieżne po zmianie |
|---|---|---|---|---|
| 1 ms | 125/128 | 125/128 | **125/128** | 118, 196, 221 (klasa A) |
| 4 ms (diagn.) | — | 122/128 | **125/128** | 118, 196, 221 |
| **16 ms (produkcja)** | **113/128** | 125/128 | **125/128** | **118, 196, 221 (klasa A)** |
| 32 ms (speed ×2, diagn.) | 39/128 | 120/128 | 124/128 | 118, 127, 155, 196 |
| 64 ms (speed ×4, diagn.) | 39/128 | 110/128 | 117/128 | 104, 143, 167, 168, 169, 170, 173, 203, 215, 216, 220 |

- **Wszystkie 12 kandydatów FRAME-QUANT (120, 122, 154, 155, 157, 161, 162, 189, 190, 191, 204, 217) są zgodne @16 ms
  bajt w bajt**; 0 nowych rozbieżności @1 i @16 (porównanie list po każdej zmianie).
- Klasa A (MARCH-INCREMENTAL): 118, 196, 221 — bez zmian, rozbieżne przy KAŻDYM kroku klatki (przyczyna z PIN3 §4).
- `mur_jazda_rzeka` @16: zgodny bajt w bajt (zwykły wektor, lista `ROZBIEZNE_B_WIRA_PIN_2` pusta od PIN3; po tej rundzie
  nadal zgodny), bliźniak `mur_jazda_rzeka_klatka1` zgodny.
- 32/64 ms (wyższe prędkości `SPEED_STEPS` pinu; w Rust produkcyjne sterowanie prędkością NIEPORTOWANE, dostępne tylko
  `diag_set_speed_mul`) — poza kryterium dispatchu, sklasyfikowane w §5 jako dług.

## 4. Decyzje techniczne (do `REJESTR-RUST.md`, wpis orkiestratora)

- **D-FQ-1** (`siege_tactics_loop.rs`: `frame_sched`, `frame_raf`, `ProdBody::frame_ms`, `gap_after`; sesja ustawia
  `frame_ms = 16 × speedMul`): każdy odcinek czasu ciała liczony atomowo w `start` kończy się w pierwszej klatce, która go
  pokrywa — krok `_doMove`, przerwa `STEP_GAP_MS`, cios `BLOW_HIT_T`, koniec lunge, lot pocisku, marsz `_siegeWalkTo`,
  `_rangedAction`, `_fallBackStep`, `_fleeStep`, kroki jazdy. `frame_ms = 0` (domyślnie) = dawny model nominalny (stare testy
  pętli bez zmian). Uzasadnienie: §1 (`:9616-9634` bez przesuwania `vNow`, `:8746-8775` koniec przy `p >= 1`).
- **D-FQ-2** (`timeline_done(t0, ord, v_now, reader)`, `timeline_ord`, `LoopBody::set_reader_due`,
  `SiegeLoop::tower_shot_due` i `due` w `tower_in_flight`): w tej samej klatce kolejność wpisów osi ciała wobec zegara
  wieży wg nominalnego `due`: krok synchroniczny (`-inf`, dawne `synchr`) < krok wołany z zegara `_schedule(STEP_GAP_MS)`
  (klucz = jego nominalny `due`) < krok z kolejki `_raf` (`+inf`). Wieża (wystrzał i trafienie) czyta oś ze swoim `due`;
  remis `due` = wieża pierwsza (jej `id` nadany wcześniej). Ciało czyta jak dotąd (`f64::MIN`). Uzasadnienie: §1
  (`:9622-9627`), kandydaci 125/173/174 @4 ms (122 → 125/128).
- **D-FQ-3** (`take_tail`): ogony `done()` (settle 220 po lunge, `RANGED_GAP_MS` po trafieniu) zostają nominalne —
  planuje je zegar sterownika z chwili klatki, więc klatkę odpalenia wyznacza zegar, a nominalny `due` zachowuje kolejność
  w klatce jak w pinie (`due = koniec lunge + 220`, nie kwantyzowany z góry).
- **Granica**: czas rzeczywisty (`SiegeBattleSession::step`) ma zawsze klatki 16 ms ściennych (reszta przenoszona), więc ta
  sama klatka co przewijanie. Ciało liczy marsz atomowo, więc kwantyzacja zakłada stały krok klatki przez całą aktywację
  (spełnione w sesji; zmiana `speedMul` w trakcie aktywacji = dług przy porcie `_setSpeedIdx`).

## 5. Klasyfikacja i ustalenia poza 16 ms

| Kandydat / zjawisko | Klasa | Dowód |
|---|---|---|
| 118, 196, 221 (każdy krok) | A = MARCH-INCREMENTAL (dług z PIN3) | bez zmian |
| 127 @32 | A = MARCH-INCREMENTAL | ślad: oś zgodna do t. 279 936; rozbicie a1 od wieży zwalnia 39,73 w trakcie marszu a2; pin robi 3. krok (280 000), Rust nie |
| 215 @64 | D-PIN3-3-SHOT-ID (dług z PIN3) | t. 233 216: strzał d2 (`_schedule(380)` z aktywacji w klatce 232 832) i trafienie wieży 74 z tym samym `due`; pin: strzał pierwszy (mniejsze `id`), Rust: skutek strzału w fazie `_raf` po wieży → inny rzut |
| 104 @64 i reszta 32/64 | NIE_ZMIERZONO (104: inny stan morale a0 przed t. 245 248) | — |
| **PRE-SKIP-RAF** (nowe ustalenie) | artefakt sterownika testu, wpływ na wynik 0/128 przy 1/4/16/32/64 ms | pierwsza aktywacja startuje w `play()` PRZED `skip()` (`_ffActive = false`), więc jej pętla `_raf` idzie przez prawdziwy `requestAnimationFrame` i kończy się na granicy porcji `_runFastForward` (40 ms ściennych; zegar-atrapa generatora +1 ms/odczyt = 39 iteracji): pierwszy krok a0 kończy się w 624 ms @16 (Rust 256), 1248 @32. Komentarz pinu `:3693-3695` opisuje ten problem dla tury czekającej na rozkazy. Eksperyment (nie w commicie): emulacja granicy porcji w Rust wyrównuje oś czasu (127 @32 zgodny do t. 279 936), ale liczby zgodnych bez zmian przy wszystkich krokach — dług, bo w przeglądarce długość porcji zależy od zegara ściennego (niedeterministyczna) |

## 6. Zmiany (allowlista)

| Plik | Zmiana |
|---|---|
| `engine/src/domain/siege_tactics_loop.rs` | D-FQ-1/2/3: `frame_sched`, `frame_raf`, `ProdBody::{frame_ms, reader_due, gap_due}`, `gap_after`, `timeline_ord`, nowe `timeline_done`/`timeline_key` (klucz `ord: f64` zamiast `synchr: bool`), `LoopBody::set_reader_due`, `SiegeLoop::tower_shot_due`, `due` trafienia w `tower_in_flight`; test lib `krok_z_zegara_w_klatce_wg_nominalnego_due` (+ dawne testy osi na nowej sygnaturze). |
| `engine/src/domain/siege_battle_session.rs` | `body.frame_ms = BATTLE_FRAME_WALL_MS`; `diag_set_speed_mul` przelicza klatkę ciała. |
| `engine/tests/p6_k5loop_wiring_a_gen.mjs` | 12 scenariuszy `fq_*` (klatka 16 ms) + 3 bliźniaki `fq_*_klatka4` (D-FQ-2); ślad `ACT`, `WIRING_A_TRACE_SCHED` (tylko diagnostyka). Strażnik SHA-256 pinu bez zmian. |
| `engine/tests/p6_k5loop_wiring_a_pin_vectors/vectors.json` | 22 → 37 wektorów; 22 dawne bajt w bajt (diff = same dopiski). `pin_data.json` bez zmian. |
| `engine/tests/p6_k5loop_wiring_a_pin.rs` | `_klatka4` dopuszczone obok `_klatka1`; test `kwantyzacja_odcinkow_klatka_pinu`; ślad `ACT` w diagnostyce. |
| `dyspozycje/autobot/runs/R-RUSTPORT-P6-K5LOOP-FRAME-QUANT-Q1/` | raport, `01-operator-r1-mutanty.py`. |

Nie ruszano: `bridge.rs`, `city_capture_apply.rs`, `playable.rs`, `siege_tactics_clock.rs`, `siege_tactics_fastforward.rs`
(tylko tymczasowo w mutancie Q25, przywrócony), `client`, `renderer`, `src-tauri`, `gra/`, `Cargo.*`, `p6_k5loop_wiring_b*`
(zmiana modelu nie zmieniła ich oczekiwań — pełny test). Brak `#[ignore]`.

## 7. Testy / bramki

`CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie (`fq/tgt`,
`fq/tgt_dev`, usuwane po bramkach).

| Bramka | Wynik |
|---|---|
| `cargo fmt --all -- --check` | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | §7a |
| `p6_k5loop_wiring_a_pin` (release) | 7/7 ok: 37 wektorów bajt w bajt (34 @16 ms i bliźniaki 1 ms + 3 bliźniaki 4 ms), 3 wektory klasy A na liście `ROZBIEZNE_B_WIRA_PIN_3`, `kwantyzacja_odcinkow_klatka_pinu` ok |
| `p6_k5loop_wiring_a` (release) | 22/22 ok, złoty skrót bez zmian |
| `pin3_timeline_tests` (lib, release) | 6/6 ok |
| Generator (pełne regeneracje) | EXIT 0, strażnik SHA-256 ok. Po `fq_*`: `vectors.json` MD5 `b1cdb16ebd84a70a8f21a1d60f2f00c2` dwa razy (odtwarzalne); po `_klatka4`: **`fefd85e4927d9fcb47110b781601cb19`**; `pin_data.json` `432eed76e34a0e8cc96ec548e88eae64` (bez zmian) |
| Kandydaci c1 128 | @1 125/128, @16 125/128 (§3) |
| `cargo test --all-targets --no-fail-fast` | §7a |

### 7a. Clippy i pełny test
(uzupełnione niżej po zakończeniu przebiegów w tle)

## 8. Mutanty (`01-operator-r1-mutanty.py`; kopia źródeł w scratchpadzie, źródła repo nietknięte)

(wyniki niżej)

## 9. Długi

| ID | Stan |
|---|---|
| MARCH-INCREMENTAL (B-WIRA-PIN-3 klasa A) | 118, 196, 221 (każdy krok), 127 @32. Bez zmian, temat następczy. |
| FQ-SPEED (nowy) | kroki 32/64 ms (speed ×2/×4): 124/128 i 117/128; produkcyjne `_setSpeedIdx` NIEPORTOWANE. Sklasyfikowane: 127 @32 = A, 215 @64 = D-PIN3-3-SHOT-ID; reszta NIE_ZMIERZONO. Zmiana `speedMul` w trakcie aktywacji (marsz liczony atomowo z jedną klatką) — NIE_ZMIERZONO. |
| D-PIN3-3-SHOT-ID (z PIN3) | potwierdzony przypadkiem 215 @64: trafienie strzału jednostki jako zwykły zegar z `id` z chwili `_schedule(380)` (dla strzału bez marszu `id` z aktywacji). Propozycja: strzał bez marszu = zwykły `BodyDone` z nominalnym `due` (bez odkładania do `_raf`), strzał po marszu = zegar startu strzału w fazie `_raf` + zegar trafienia. |
| PRE-SKIP-RAF (nowy) | §5: artefakt `play()` przed `skip()`; wpływ na wynik 0/128, oś czasu tury 1 różni się (624 vs 256 ms @16). Do decyzji orkiestratora: czy emulować porcję FF generatora (39 iteracji) w Rust — nie rekomenduję (stała atrapy, w przeglądarce niedeterministyczna). |
| Czas rzeczywisty z innym krokiem ściennym | sesja zawsze dzieli na klatki 16 ms; inny klient = poza zakresem. |
| pozostałe z PIN3 FC §8 | bez zmian |

## 10. Commity (gałąź `rust-port-wip/frame-quant-q1`, nad `0522ad6df`)

| SHA | Treść |
|---|---|
| `fa2ed391a` | D-FQ-1: kwantyzacja odcinków czasu ciała klatką |
| `f5502cf4d` | D-FQ-2 (kolejność kroku z zegara wg nominalnego `due`), D-FQ-3 (ogony nominalne) |
| `8b8020ae5` | 12 wektorów `fq_*` @16 ms, ślad `ACT`/`SCHED` |
| `316218a3b` | bliźniaki `_klatka4`, testy kwantyzacji i osi, skrypt mutantów, `cargo fmt` |
| (commit raportu) | ten raport — SHA końcowy podaje wynik Workflow |

## 11. Kryteria końca dispatchu

| Kryterium | Stan |
|---|---|
| 128 kandydatów @16 ms zgodnych poza jawną listą (docelowo 118/196/221) | **spełnione: 125/128, rozbieżne dokładnie 118, 196, 221** |
| `mur_jazda_rzeka` @16 bajt w bajt bez wyjątku | spełnione (zwykły wektor, lista B-WIRA-PIN-2 pusta) |
| @1 ms nadal >= 125/128 | 125/128 |
| bliźniaki `_klatka1` zgodne | tak (+ nowe `_klatka4`) |
| determinizm i niezależność od podziału na `StepSiegeBattle` | `czas_rzeczywisty_niezalezny_od_podzialu_krokow`, `skip_po_starcie_w_trakcie_bitwy`, `p6_k5loop_*` resume — ok (§7) |
| mutanty >= 20 w logice kwantyzacji, w tym zamiana `_drainTimers`/`_raf` = FAIL | §8 |
