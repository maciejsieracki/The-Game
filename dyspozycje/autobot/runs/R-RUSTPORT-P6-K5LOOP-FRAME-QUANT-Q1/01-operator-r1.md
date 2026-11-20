# R-RUSTPORT-P6-K5LOOP-FRAME-QUANT-Q1 — Operator r1

```text
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5LOOP-FRAME-QUANT-Q1 (zgodność z pinem w produkcyjnej klatce 16 ms: 12 kandydatów c1 + mur_jazda_rzeka @16)
GOAL: przy kroku klatki 16 ms wynik Rust bajt w bajt zgodny z pinem dla 12 kandydatów FRAME-QUANT i mur_jazda_rzeka,
      bez psucia @1 ms (>= 125/128), dawnych wektorów i bliźniaków _klatka1; mutanty >= 20
BAZA: origin/rust-port/parity-v2 = 0522ad6df484622ad92c8f5d42956fc1ec061423 (linia BAZA dispatchu; = SHA z dispatchu)
GAŁĄŹ: rust-port-wip/frame-quant-q1 (lokalna, worktree wf_6a1aa039-fb6-1)
ZMIANY/COMMIT: §6, §10 (SHA); kod i dane końcowe 757ac004e (+ commit raportu)
TESTY: §7 — fmt/clippy EXIT 0; pełny cargo test --all-targets --no-fail-fast EXIT 0 (4197 ok, 0 fail, 1 ignored
       sprzed tematu); p6_k5loop_wiring_a_pin 8/8 (42 wektory); kandydaci c1 @1 125/128, @4 125/128, @16 125/128
BLOKADY: brak blokujących. Jedyne rozbieżne @16 ms: 118, 196, 221 = klasa A (MARCH-INCREMENTAL, poza zakresem, bez zmian).
         Mutanty: 26 = 19 zabitych + 5 jawnie równoważnych + 2 nieobserwowalne (Q20/Q22, dług FQ-TOWER-HIT-DUE, §8).
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
| `engine/src/domain/siege_tactics_loop.rs` | D-FQ-1/2/3: `frame_sched`, `frame_raf`, `ProdBody::{frame_ms, reader_due, gap_due}`, `gap_after`, `timeline_ord`, nowe `timeline_done`/`timeline_key` (klucz `ord: f64` zamiast `synchr: bool`), `LoopBody::set_reader_due`, `SiegeLoop::tower_shot_due`, `due` trafienia w `tower_in_flight`; funkcje odcinków złożonych `melee_tail_ms`, `siege_walk_step_t0`, `siege_walk_dur` (publiczne, testowane wprost); testy lib `krok_z_zegara_w_klatce_wg_nominalnego_due`, `czas_kroku_kwantyzowany_klatka` (+ dawne testy osi na nowej sygnaturze). |
| `engine/src/domain/siege_battle_session.rs` | `body.frame_ms = BATTLE_FRAME_WALL_MS`; `diag_set_speed_mul` przelicza klatkę ciała. |
| `engine/tests/p6_k5loop_wiring_a_gen.mjs` | 12 scenariuszy `fq_*` (klatka 16 ms) + bliźniaki: 3 × `_klatka4` (D-FQ-2: 125/173/174), 2 × `_klatka1` (213/214: `due` wystrzału wieży, mutant Q21), 2 × `_klatka1` + 1 × `_klatka4` (217/218 @1, 132 @4: czułość kolejności `_drainTimers`/`_raf`, mutant Q24); ślad `ACT`, `WIRING_A_TRACE_SCHED` (tylko diagnostyka). Strażnik SHA-256 pinu bez zmian. |
| `engine/tests/p6_k5loop_wiring_a_pin_vectors/vectors.json` | 22 → 42 wektory; wszystkie dawne bajt w bajt (każdy diff = same dopiski, 0 linii usuniętych). `pin_data.json` bez zmian. |
| `engine/tests/p6_k5loop_wiring_a_pin.rs` | `_klatka4` dopuszczone obok `_klatka1`; testy `kwantyzacja_odcinkow_klatka_pinu`, `kwantyzacja_odcinkow_zlozonych_klatka_pinu`; ślad `ACT` w diagnostyce. |
| `dyspozycje/autobot/runs/R-RUSTPORT-P6-K5LOOP-FRAME-QUANT-Q1/` | raport, `01-operator-r1-mutanty.py`. |

Nie ruszano: `bridge.rs`, `city_capture_apply.rs`, `playable.rs`, `siege_tactics_clock.rs`, `siege_tactics_fastforward.rs`
(tylko w kopii mutanta Q25 w scratchpadzie), `client`, `renderer`, `src-tauri`, `gra/`, `Cargo.*`, `p6_k5loop_wiring_b*`
(zmiana modelu nie zmieniła ich oczekiwań — pełny test zielony). Brak `#[ignore]` (diff 0522ad6df..HEAD: 0 dodanych).

## 7. Testy / bramki

`CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie (`fq/tgt`,
`fq/tgt_dev`, usuwane po bramkach).

| Bramka | Wynik |
|---|---|
| `cargo fmt --all -- --check` | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` (engine, na `3f4577d6f` = cały kod Rust tematu) | **CLIPPY_EXIT=0** |
| `cargo test --all-targets --no-fail-fast` (engine, na `3f4577d6f`, w tle) | **FULL_EXIT=0**: 4197 passed, 0 failed, 1 ignored (sprzed tematu); w tym `p6_k5loop_wiring_a*`, `p6_k5loop_wiring_b*`, `bridge_contract`, `p6_k5loop_*`, `p6_zdobycie_miasta_a*`, `pin3_timeline_tests` |
| `p6_k5loop_wiring_a_pin` (release, na `757ac004e`, 42 wektory) | **8/8 ok**: wszystkie wektory bajt w bajt poza jawną listą klasy A (`ROZBIEZNE_B_WIRA_PIN_3`: 118/196/221 `_klatka1`); testy kwantyzacji ok |
| Generator (pełne regeneracje) | EXIT 0, strażnik SHA-256 ok. Kolejno `vectors.json` MD5: `b1cdb16e…` (fq, 2× odtwarzalne) → `fefd85e4…` (_klatka4) → `4ad3d9bd…` (213/214) → **`ec89d91d3e9fccee3461752969757f12`** (217/218/132, końcowy); `pin_data.json` `432eed76e34a0e8cc96ec548e88eae64` (bez zmian) |
| Kandydaci c1 128 (binarka z kodu końcowego) | **@1 125/128, @4 125/128, @16 125/128**, rozbieżne zawsze dokładnie 118, 196, 221; @32 124/128, @64 117/128 (diagn., §5) |

Po `3f4577d6f` zmieniono wyłącznie dane testowe (generator + `vectors.json`) i skrypt mutantów — kod Rust bez zmian, więc
clippy i pełny test z `3f4577d6f` obowiązują; dotknięty test `p6_k5loop_wiring_a_pin` powtórzony na `757ac004e` (wyżej).
Targety `fq/tgt*` i kopie `fq/mut`, `fq/tw` usunięte po bramkach.

## 8. Mutanty (`01-operator-r1-mutanty.py`; kopia źródeł w scratchpadzie, źródła repo nietknięte)

Pełny przebieg (26 mutantów) na kopii z 37 wektorami; Q21 i Q24 dodatkowo na kopii z wektorami końcowymi. Dopisanie
wektorów tylko zaostrza test, więc zabicia z pełnego przebiegu pozostają ważne.

| Mutant | Zmiana | Wynik |
|---|---|---|
| Q1–Q3 | `frame_sched`: floor / round / bez kwantyzacji | ZABITE (wektory + testy kwantyzacji) |
| Q4 | `frame_sched`: `ms > 0` → `ms >= 0` | **RÓWNOWAŻNY**: dla `ms = ±0` `ceil(0/f)·f = ±0 = ms`; NaN nie spełnia żadnego warunku |
| Q5 | `frame_raf` nominalny | ZABITY |
| Q6 | `step_ms` nominalny | ZABITY (`czas_kroku_kwantyzowany_klatka`) |
| Q7 | przerwa STEP_GAP nominalna | ZABITY |
| Q8 | cios wręcz: zmienna `hit` nominalna | **RÓWNOWAŻNY**: po wydzieleniu `melee_tail_ms` `hit` wpływa tylko na koniec aktywacji `attack_pre + hit`; `attack_pre` jest wielokrotnością klatki, a zegar sterownika odpala koniec w pierwszej klatce `>= due` (150 i 160 → klatka 160) |
| Q9, Q10 | ogon ciosu: lunge nominalny / settle kwantyzowany | ZABITE (`kwantyzacja_odcinkow_zlozonych_klatka_pinu`) |
| Q11 | strzał: koniec ciała `at + 380` | **RÓWNOWAŻNY**: `at` jest wielokrotnością klatki, zegar sterownika odpala `at+380` i `at+384` w tej samej klatce @16; @4/@1 380 jest już wielokrotnością klatki |
| Q12 | strzał: `hit_at` na osi ciała nominalny | **RÓWNOWAŻNY dla wyniku bitwy**: wpisy osi mają `t0` w wielokrotnościach klatki, więc żaden nie leży w `(at+380, at+384)`; wpis `t0 = at+384` jest „niewykonany” w obu wariantach (czytelnik ciała ma `reader = f64::MIN`). Różni się tylko `land_at` akcji `Shot` dla renderera (380 vs 384) — nieporównywane z pinem (dług SHOT-LAND-AT-RENDER) |
| Q13, Q14 | marsz oblężniczy nominalny | ZABITE |
| Q15, Q16 | sesja bez klatki ciała / `diag_set_speed_mul` | ZABITE |
| Q17, Q18 | `timeline_done` remis / `timeline_ord` bez D-FQ-2 | ZABITE |
| Q19 | wystrzał wieży czyta oś jak ciało | ZABITY |
| Q20 | trafienie wieży czyta oś jak ciało | **NIEOBSERWOWALNY** (dług FQ-TOWER-HIT-DUE) |
| Q21 | `due` wystrzału wieży +16 | ZABITY na wektorach końcowych: `fq_rown_mix_d3l_mury_213_klatka1` (tura 59≠60, rzuty 91≠98), `…_palisada_214_klatka1` (zwycięzca atakujący≠obrońca) |
| Q22 | `due` trafienia wieży = chwila wystrzału | **NIEOBSERWOWALNY** (dług FQ-TOWER-HIT-DUE) |
| Q23 | `timeline_key` odwrócony | ZABITY (lib) |
| **Q24** | **zamiana kolejności `_drainTimers`/`_raf`**: skutek ciała w `_drainTimers` (`body_done_raf = false`) | **ZABITY na wektorach końcowych (test czułości dispatchu = FAIL)**: `fq_rown_mix_d8l_mury_217_klatka1` tura 65≠56, rzuty 188≠123; `…_palisada_218_klatka1` tura 74≠60; `fq_las_lucz2_d5_palisada_132_klatka4` tura 54≠55. Przed dopisaniem tych bliźniaków PRZEŻYWAŁ — luka pokrycia wykryta tym przebiegiem i zamknięta |
| Q25 | (opis poprawiony w obronie r1, U4) mutant DOKŁADA opróżnianie kolejki `_ffQueue` przed `_drainTimers` w `run_fast_forward`, NIE usuwając tego po — to NIE jest zamiana faz | **RÓWNOWAŻNY (no-op)**: `st.queue` jest opróżniana (`mem::take`) na końcu każdej iteracji i napełniana tylko w `_drainTimers` tej samej iteracji, więc na początku iteracji jest zawsze pusta — mutant to no-op. Właściwy test zamiany faz to Q24 |
| Q26 | `gap_after`: `due` = chwila klatki | ZABITY |

**Bilans: 26 mutantów = 19 zabitych + 5 jawnie równoważnych (Q4, Q8, Q11, Q12, Q25) + 2 nieobserwowalne (Q20, Q22).**

Szukanie scenariusza dla Q21/Q24/Q20/Q22: binarki mutantów (`bin_tw_*`) na 128 kandydatach @1/@4/@16 (+ Q20/Q22 także
@32/@64). Q21: rozbieżne 213/214 @1 → bliźniaki `_klatka1`. Q24: rozbieżne 217/218 @1 i 132 @4 → bliźniaki. Q19 (już
zabity): 125/173/174 @4. Q20/Q22: 640 przebiegów identycznych z bazą — mutanty zmieniają wynik tylko, gdy krok marszu
SAMEGO CELU wołany z `_schedule(STEP_GAP_MS)` wypada w klatce trafienia z `due` mniejszym od `due` trafienia i przesunięcie
zmienia łuk/rzut. Kod jest zgodny z pinem (`_drainTimers` `:9616-9634`: zegar trafienia czyta stan w kolejności `due`),
równoważności nie dowiedziono → dług z numerem, jawne odstępstwo od kryterium „każdy zabity lub równoważny”.

## 9. Długi

| ID | Stan |
|---|---|
| MARCH-INCREMENTAL (B-WIRA-PIN-3 klasa A) | 118, 196, 221 (każdy krok), 127 @32. Bez zmian, temat następczy. |
| **FQ-TOWER-HIT-DUE** (nowy) | mutanty Q20/Q22 nieobserwowalne w 640 przebiegach kandydatów; potrzebny scenariusz celowany (krok celu z zegara w klatce trafienia wieży, zmiana łuku) albo test jednostkowy `SiegeLoop::tower_hit` z atrapą ciała. |
| SHOT-LAND-AT-RENDER (nowy, z Q12) | `land_at` akcji `Shot` liczony z kwantyzacją (384 @16) — zgodny z klatką animacji pinu, ale nieporównywany wektorem; do pokrycia w temacie akcji bitwy (I5). |
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
| `3f4577d6f` | funkcje odcinków złożonych (`melee_tail_ms`, `siege_walk_*`) z testami, raport WIP — ostatni commit kodu Rust |
| `6ecacb737` | bliźniaki `fq_213/214_klatka1` (Q21) |
| `757ac004e` | bliźniaki `fq_217/218_klatka1`, `fq_132_klatka4` (Q24, czułość `_drainTimers`/`_raf`) |
| (commit raportu) | ten raport — SHA końcowy podaje wynik Workflow |

## 11. Kryteria końca dispatchu

| Kryterium | Stan |
|---|---|
| 128 kandydatów @16 ms zgodnych poza jawną listą (docelowo 118/196/221) | **spełnione: 125/128, rozbieżne dokładnie 118, 196, 221** |
| `mur_jazda_rzeka` @16 bajt w bajt bez wyjątku | spełnione (zwykły wektor, lista B-WIRA-PIN-2 pusta) |
| @1 ms nadal >= 125/128 | 125/128 |
| bliźniaki `_klatka1` zgodne | tak (+ `_klatka4` i nowe `_klatka1` 213/214/217/218) |
| determinizm i niezależność od podziału na `StepSiegeBattle` | `czas_rzeczywisty_niezalezny_od_podzialu_krokow`, `skip_po_starcie_w_trakcie_bitwy`, `p6_k5loop_*` resume — ok w pełnym teście (§7) |
| mutanty >= 20 w logice kwantyzacji, każdy zabity lub jawnie równoważny; zamiana `_drainTimers`/`_raf` = FAIL | 26 mutantów: 19 zabitych, 5 równoważnych z uzasadnieniem, **2 nieobserwowalne (Q20/Q22) — jawne odstępstwo, dług FQ-TOWER-HIT-DUE**; Q24 (zamiana faz) = FAIL ✔ |
