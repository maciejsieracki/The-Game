# R-RUSTPORT-P6-K5LOOP-PIN3-DIVERGENCE-Q1: Final Control r1

```text
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5LOOP-PIN3-DIVERGENCE-Q1 (B-WIRA-PIN-3: rozbieżności logiki Rust vs pin @1 ms)
GOAL: zmierzyć i usunąć przyczyny rozbieżności Rust vs pin przy kroku klatki 1 ms; >= 3 rozróżniające wektory;
      dawne wektory bajt w bajt; mutanty >= 8
OCENIANY KOD: bcebe4a4f (gałąź lokalna rust-port-wip/pin3-divergence-q1-obrona; kod = a6805cbe9 + raport Obrony)
BAZA: 540be622e608ee4261ddf4513ea4adb83ef8c666 (merge-base z origin/rust-port/parity-v2 = SHA z linii BAZA dispatchu)
ZMIANY/COMMIT: tylko ten raport (bez zmian kodu)
TESTY: §2 (wszystkie bramki odtworzone samodzielnie, EXIT 0)
BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: integracja orkiestratora (FF/merge na rust-port/parity-v2 po sprawdzeniu ancestry; parity-v2 poszedł
               naprzód od 540be622e: a5fdb91b8 ZDOBYCIE-MIASTA-A — wymagany merge-tree i pełny test po scaleniu)
DEPLOY/PUSH: NIE WYKONANO
```

## 1. Zakres i allowlista (sprawdzone samodzielnie)

`git diff --stat 540be622e bcebe4a4f`: 9 plików, wszystkie z allowlisty:
`engine/src/domain/siege_tactics_loop.rs` (+388/−19 łącznie z testami), `engine/src/domain/siege_battle_session.rs`
(+20/−1), `engine/tests/p6_k5loop_wiring_a_gen.mjs` (+31), `engine/tests/p6_k5loop_wiring_a_pin.rs` (+69/−8),
`engine/tests/p6_k5loop_wiring_a_pin_vectors/vectors.json` (+10693/**−0**), 4 pliki w katalogu runu.
Nie ruszono: `bridge.rs`, `siege_battle_apply.rs` (WIRING-B), `p6_k5loop_wiring_a.rs` (złoty skrót bez zmian),
`siege_tactics_clock.rs`, `siege_tactics_fastforward.rs`, `renderer/`, `gra/**`, `Cargo.*`.
`#[ignore]` w diffie: 0. `Co-Authored-By` w commitach 540be622e..bcebe4a4f: 0. `git diff --check`: czysty.

## 2. Bramki odtworzone niezależnie

`CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie
(`pin3fc/tgt-pin3-fc`, usunięty po bramkach; wolne po sprzątaniu: 11 GB). Crate `civ-engine` nie buduje renderera.

| Bramka | Wynik |
|---|---|
| `cargo fmt --all -- --check` | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | CLIPPY_EXIT=0 |
| `cargo test --all-targets --no-fail-fast` (dev, tło `setsid nohup`) | **FULL_EXIT=0**: 547 × `test result: ok`, **4161 passed / 0 failed / 1 ignored**, 0 `FAILED`/`panicked` (= liczby Obrony) |
| `p6_k5loop_wiring_a_pin` | 6/6 ok |
| `p6_k5loop_wiring_a` | 22/22 ok (złoty skrót bez zmian) |
| `p6_k5loop_tags_rest` / `p6_k5loop_adapter` | 5/5 / 27/27 ok |
| `p6_k5loop_siege_atk_a` / `_atk_b` / `_def` | 8/8 / 10/10 / 10/10 ok |
| `p6_battle_setup` / `p6_battle_setup_units` | 15/15 / 7/7 ok |
| `bridge_contract` | 9/9 ok |
| `pin3_timeline_tests` (lib) | 5/5 ok |
| Generator `p6_k5loop_wiring_a_gen.mjs` (pełna regeneracja z tekstu pinu `07d2fbd72`) | EXIT 0, strażnik SHA-256 ok; `vectors.json` MD5 **`1fcd154c8ec119e4cdf1d1bc4c454853`**, `pin_data.json` `432eed76e34a0e8cc96ec548e88eae64` (= raport Operatora i Evaluatora); `git status` czysty po regeneracji |
| Dawne wektory bajt w bajt | `git diff --numstat` `vectors.json`: 10693 dodanych, **0 usuniętych** |

## 3. Kandydaci c1 (Rust na bieżącym kodzie, wyjścia pinu Operatora)

Wyjścia pinu: `scratchpad/pin3/c128_1_pin.json` (MD5 `ed9a3c98…`) i `c128_16_pin.json` (MD5 `307d5942…`) — te same
MD5, które Evaluator uzyskał z niezależnej regeneracji pinu. Rust (`kandydaci_z_pliku_na_zadanie`, dev):

- **@1 ms (`WIRING_A_RUST_FF_STEP=1`): 125/128 ZGODNY**; rozbieżne wyłącznie 118, 196, 221 (klasa A, B-WIRA-PIN-3).
- **@16 ms: 113/128 ZGODNY**; rozbieżne 118, 120, 122, 154, 155, 157, 161, 162, 189, 190, 191, 196, 204, 217, 221
  = 3 klasy A + 12 FRAME-QUANT, co do kandydata zgodne z §4 raportu Operatora i §3 Evaluatora.

Kryterium „128 c1 @1 ms: 0 albo każdy jawnie sklasyfikowany” spełnione.

## 4. Pin (web najpierw) — weryfikacja odwołań

Tekst `git show 07d2fbd72:gra/src/battle/battleScene.ts` sprawdzony w miejscach, na których stoją poprawki:
`:9415-9437` (`_runFastForward`: `vNow += FF_STEP_MS` → `_drainTimers()` → pociski/zaniki → kolejka `_ffQueue`;
komentarz pinu wprost: „najpierw zegary … potem kroki animacji”), `:4261-4266` (trafienie wieży `_schedule(RANGED_FLY_MS)`
→ `_singleBlow` na stanie celu w chwili trafienia), `:8831-8833` (teren z `defender.q/r`), `:8880` (`relativeHit(defender.facing…)`),
`:8715-8718` (`occByKey.delete/set` w chwili startu kroku), `:8755-8775` (kolejny krok/`done()` z kroku `_raf`),
`:9812`, `:9818` (`_startRout`: zwolnienie pola z bieżącego `ru.q/r`, zwrot ku krawędzi), `:9227` (strzał jednostki =
`_schedule`). Kontynuacje marszu wołane z `done()` (np. `:6436-6444`) nie sprawdzają `ru.routed` — zgodne z D-PIN3-5.
D-PIN3-1/2/3/5 wynikają z tekstu pinu; D-PIN3-4 jest diagnostyką testową.

## 5. Mutanty

8/8 Operatora zabitych (odtworzone przez Evaluatora); E4, E7, E1 Evaluatora zabite nowymi testami Obrony (N1).
Własny mutant FC: **F1** `emit` (`siege_tactics_loop.rs:2260`) `self.now <= self.call_now` → `<` (pierwszy krok
synchroniczny traktowany jak krok `_raf`) — **ZABITY** (EXIT 101: `pozycja_po_kroku_synchronicznym_i_przed_krokiem_raf`,
`przyszle_kroki_przy_rozbiciu_w_chwili_kroku`). Źródło przywrócone, `git status` czysty.

## 6. Orzeczenia zarzutów

| Zarzut | Źródło | Orzeczenie | Uzasadnienie |
|---|---|---|---|
| N1: E4/E7 przeżywają wszystkie testy (gałąź `synchr`) | Evaluator | **ODDAL** (zamknięty) | Obrona dopisała 2 testy (`a6805cbe9`); 5/5 ok w pełnym przebiegu; E1/E4/E7 zabite; dodatkowo F1 FC zabity tymi testami |
| N2: D-PIN3-3 dla strzału = przybliżenie (pin: zegar `_schedule` z `id`, nie faza `_raf`) | Evaluator | **ODDAL** (dług) | Komentarz poprawiony zgodnie z pinem (`:9227`, `:5643`, `:5688`, `:4219`); kontrprzykład teoretyczny 0/256 kandydatów (sonda Evaluatora: 5/5 remisów wieża pierwsza); dług D-PIN3-3-SHOT-ID zapisany. Nie zmienia żadnego zmierzonego wyniku — nie jest „przyczyną niejednoznaczną”, tylko niezmierzonym przypadkiem brzegowym |
| N3: strażnik `ROZBIEZNE_B_WIRA_PIN_3` akceptuje dowolną rozbieżność | Evaluator | **ODDAL** (dług MARCH-INCREMENTAL) | Wymóg `Ok(..)` sesji zostaje; zamrożenie błędnego wyniku utrwaliłoby niezgodność. Dispatch dopuszcza „uzasadniony wyjątek z testem pilnującym” |
| N4: `step_realtime` nie liczy `BodyDone` z fazy `_raf` | Evaluator | **ODDAL** | Sprawdzone: `VirtualClock::drain_timers` (`siege_tactics_clock.rs:155-157`) liczy każdy zdjęty klocek, także odłożony `BodyDone`; faza `_raf` nie zdejmuje nowych klocków |
| N5: zmiana semantyki bliźniaka `mur_jazda_rzeka_klatka1` | Evaluator | **ODDAL** | Uzasadniona w kodzie i raporcie; `mur_jazda_rzeka` zgodny @16 bajt w bajt (mocniejsze porównanie), E5 zabity |
| E3, E8 „prawdopodobnie równoważne” | Evaluator | **ODDAL** (dług) | Poza wymaganymi ≥ 8 (8/8 Operatora + E1/E4/E7 zabite); zapisane jako NIE_UDOWODNIONO w długach Obrony |
| 3 kandydaci klasy A (118, 196, 221) nienaprawieni | FC (kryterium dispatchu) | **ODDAL** | Przyczyna zmierzona śladem (pierwszy rozjazd, zdarzenie, chwila; 196 potwierdzony niezależnie przez Evaluatora); pin rozstrzyga gameplay (brak ABC); poprawka = przebudowa ciała na marsz przyrostowy (temat MARCH-INCREMENTAL); wektory `a3_*_klatka1` pilnują |
| `diag_set_speed_mul` — publiczne API diagnostyczne w `siege_battle_session.rs` (allowlista: „tylko poprawki uzasadnione pinem”) | FC | **ODDAL** | `#[doc(hidden)]`, walidacja wejścia, używane wyłącznie w testach (D-PIN3-4); bez produkcyjnego wołającego i bez wpływu na model 16 ms (złoty skrót i wektory 16 ms bez zmian). Uwaga dla integracji: przy porcie `_setSpeedIdx` zastąpić je produkcyjnym sterowaniem prędkością |

NAPRAW: 0. DO DECYZJI CZŁOWIEKA: 0.

## 7. Kryteria końca dispatchu

| Kryterium | Stan |
|---|---|
| Tabela 11 kandydatów (pierwszy rozjazd, przyczyna, poprawka/wyjątek z testem) | spełnione (`01-operator-r1.md` §3) |
| 128 c1 @1 ms: 0 albo każdy sklasyfikowany | 125/128 zgodnych, 3 klasy A z wektorem pilnującym (odtworzone w §3) |
| Dawne wektory bajt w bajt | tak (0 linii usuniętych, MD5 odtworzone regeneracją) |
| ≥ 3 rozróżniające przypadki w wektorach, strażnik SHA, MD5 | 5 (`p3_*`), strażnik ok, MD5 odtworzone |
| Mutanty ≥ 8 (zabite lub jawnie równoważne) | 8/8 + E1/E4/E7 + F1 zabite |
| Złoty skrót `p6_k5loop_wiring_a` | bez zmian (22/22 ok, plik testu nietknięty) |
| Pełny `cargo test --all-targets --no-fail-fast` | FULL_EXIT=0 (4161/0/1) |

## 8. Długi (do rejestru, wpis orkiestratora)

- **MARCH-INCREMENTAL / B-WIRA-PIN-3 klasa A**: 118, 196, 221 c1 — marsz atomowy ciała nie widzi rozbicia innej jednostki
  w oknie marszu; po naprawie zamienić `ROZBIEZNE_B_WIRA_PIN_3` na zwykłe wektory zgodne (N3).
- **FRAME-QUANT (D-PIN2-2)**: 12 c1 rozbieżnych tylko @16 ms (lista §3); zaktualizować kryterium tematu.
- **D-PIN3-3-SHOT-ID**: numer zegara trafienia strzału z chwili `_schedule(RANGED_FLY_MS)`; `dur == 0` (NIE_ZMIERZONO).
- **E3/E8**: równoważność NIE_UDOWODNIONO.
- Zabicie (`_startFade`) w trakcie własnego marszu — NIE_ZMIERZONO; `facing_at` przy wpisach spoza kolejności — przybliżenie.
- `diag_set_speed_mul` → produkcyjne `_setSpeedIdx` (NIEPORTOWANE).
- Decyzje D-PIN3-1..5 do `REJESTR-RUST.md` (wpis orkiestratora).

## 9. Werdykt

**PASS-WITH-NOTES.** Wszystkie bramki odtworzone samodzielnie z EXIT 0 (fmt, clippy, pełny test 4161/0/1, bramki tematowe,
regeneracja generatora z MD5 bit w bit). Wyniki kandydatów 125/128 @1 ms i 113/128 @16 ms odtworzone co do nazwy.
Allowlista dotrzymana, brak `#[ignore]`, brak `Co-Authored-By`, dawne wektory bajt w bajt. Zero zarzutów NAPRAW, zero do
decyzji człowieka; uwagi wyłącznie jako długi (§8).
