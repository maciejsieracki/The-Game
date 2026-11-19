# R-RUSTPORT-P6-K5LOOP-PIN3-DIVERGENCE-Q1: Obrona Operatora r1

```text
STATUS: PASS-WITH-NOTES (odpowiedź na wszystkie zarzuty Evaluatora r1)
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5LOOP-PIN3-DIVERGENCE-Q1 (B-WIRA-PIN-3)
GOAL: zamknąć N1 (testy gałęzi synchr) i N2 (opis D-PIN3-3 dla strzału + dług), odpowiedzieć na N3–N5
BAZA: 540be622e (dispatch); kod Operatora 975f1f835; raport Evaluatora a3393d350
ZMIANY/COMMIT: a6805cbe9 (kod: tylko siege_tactics_loop.rs — komentarze + 2 testy w pin3_timeline_tests),
               SHA tego raportu w commicie nad a6805cbe9; gałąź lokalna rust-port-wip/pin3-divergence-q1-obrona (bez push)
TESTY: §3
BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: Final Control
DEPLOY/PUSH: NIE WYKONANO
```

## 1. Odpowiedzi na zarzuty

| Zarzut | Odpowiedź | Dowód / commit |
|---|---|---|
| Ocena ogólna (bramki, MD5, baza) | PRZYJMUJĘ (bez działań) | — |
| Replikacja kandydatów c1, klasa A na 196 | PRZYJMUJĘ (bez działań) | — |
| **N1** E4, E7 przeżywają wszystkie testy; M4/E1/E6 tylko testy osi | **PRZYJMUJĘ** — dwa testy jednostkowe | a6805cbe9, §2 |
| **N2** D-PIN3-3 dla strzału = przybliżenie; komentarz nieścisły; dług | **PRZYJMUJĘ** — komentarz poprawiony, dług D-PIN3-3-SHOT-ID (§4) | a6805cbe9 |
| **N3** `ROZBIEZNE_B_WIRA_PIN_3` akceptuje dowolną rozbieżność | **ODRZUCAM jako poprawkę w tym temacie**, przyjmuję jako dług (§4) | uzasadnienie niżej |
| **N4** `step_realtime` nie liczy `BodyDone` z fazy `_raf` | **ODRZUCAM** (licznik jest poprawny) — doprecyzowany tylko komentarz | dowód niżej, a6805cbe9 |
| **N5** semantyka bliźniaka `_klatka1` | PRZYJMUJĘ (zgodne, bez działań) | — |
| E3, E8 „prawdopodobnie równoważne” | bez zmian — nie są mutantami wymaganymi dispatchem (8/8 Operatora zabite); wpis w długach | §4 |

### N1 — testy gałęzi `synchr`

Dopisane w `pin3_timeline_tests` (`rust-port/engine/src/domain/siege_tactics_loop.rs`):

- `pozycja_po_kroku_synchronicznym_i_przed_krokiem_raf` — krok (-1,0)->(0,0) emitowany w chwili wywołania ciała
  (1000, `synchr`), krok (0,0)->(1,0) z kolejki `_raf` w 1310. `unit_cell_at`: 999 → (-1,0); **1000 → (0,0)**
  (krok synchroniczny już wykonany); **1310 → (0,0)** (krok `_raf` w chwili zegara jeszcze się nie zaczął); 1311 → (1,0).
- `przyszle_kroki_przy_rozbiciu_w_chwili_kroku` — `has_future_steps` przy rozbiciu w chwili kroku: krok synchroniczny w
  1000 i w 1310 → **nie** przyszły (pole zostaje zwolnione, `:9812`); krok `_raf` zapisany z wywołania 1000 z chwilą 1310
  → w zegarze 1310 **przyszły**, w 1311 już nie.

Mutanty Evaluatora na nowych testach (`--lib pin3_timeline_tests`, skrypt
`/tmp/claude-0/-home-user-The-Game/b3259bfd-6985-5166-9861-4edd4aa89b33/scratchpad/pin3ob/mut_ob.py`, źródła przywrócone,
`git status` czysty):

| Mutant | Wynik | Test, który zabija |
|---|---|---|
| E1 `set_now` nie aktualizuje `call_now` | ZABITY (EXIT 101) | oba nowe testy + `zegar_i_krok_w_tej_samej_chwili_krok_wygrywa` |
| E4 `has_future_steps`: `t0 > now` bez `synchr` | ZABITY (EXIT 101) | `przyszle_kroki_przy_rozbiciu_w_chwili_kroku` |
| E7 `unit_cell_at`: `t0 >= v_now` bez `synchr` | ZABITY (EXIT 101) | `pozycja_po_kroku_synchronicznym_i_przed_krokiem_raf` |

Testy pokrywają obie strony porównania (`t0 == v_now` z `synchr` i bez), więc odwrotne mutanty (`>=` zamiast `>`) też
padają na tych samych asercjach.

### N2 — D-PIN3-3 dla strzału

Tekst pinu sprawdzony (`git show 07d2fbd72:gra/src/battle/battleScene.ts`): `_schedule(RANGED_FLY_MS, …)` w `:9227`,
`_fireSiegeTowers()` w `_beginTurn` `:5643`, `_activateNext()` `:5688`, `_fireOneTower` planowane przez `_schedule(delay, …)`
`:4219`. Komentarz pola `body_done_raf` mówi teraz wprost: dla ciosu wręcz i ostatniego kroku `_doMove` odłożenie = faza
`_raf` pinu; dla trafienia strzału to **przybliżenie** (w pinie zwykły zegar porządkowany `due`, potem `id`), poprawne
gdy wieża ma mniejszy `id` (5/5 remisów w sondzie Evaluatora), z kontrprzykładem teoretycznym i `dur == 0` oznaczonymi
NIE_ZMIERZONO i odsyłaczem do długu D-PIN3-3-SHOT-ID. Kod logiki bez zmian (wektory bajt w bajt).

### N3 — słaby strażnik klasy A (ODRZUCAM jako poprawkę tu)

Zamrożenie dzisiejszego (błędnego względem pinu) wyniku Rust dla 118/196/221 jako złotego wzorca utrwaliłoby
niezgodność i wymusiło przepisywanie go przy każdej zmianie, w tym przy naprawie MARCH-INCREMENTAL. Ochrona przed
regresją pozostałych 125/128 kandydatów i wszystkich wektorów jest bajtowa; dla trzech wyjątków test wymaga `Ok(..)`
sesji (błąd sesji nigdy nie jest „oczekiwaną rozbieżnością”, `p6_k5loop_wiring_a_pin.rs:364-369`). Evaluator sam
kwalifikuje uwagę jako „tylko do długu MARCH-INCREMENTAL” — wpisane w §4.

### N4 — licznik `step_realtime` (ODRZUCAM)

`VirtualClock::drain_timers` (`siege_tactics_clock.rs:155-157`) robi `on_fire(self, timer.payload); fired += 1;` dla
KAŻDEGO zdjętego klocka, także `BodyDone`, którego `defer_to_raf` tylko odkłada skutek. Faza `_raf` w `step_realtime`
nie zdejmuje nowych klocków z zegara — wykonuje skutki klocków już policzonych. Doliczenie ich dałoby podwójne liczenie.
Doprecyzowałem tylko komentarz funkcji (a6805cbe9).

## 2. Zmiany (a6805cbe9)

`git diff --stat 975f1f835 a6805cbe9`: 1 plik, `rust-port/engine/src/domain/siege_tactics_loop.rs` (allowlista):
komentarz `body_done_raf` (N2), komentarz `step_realtime` (N4), 2 testy w `#[cfg(test)] mod pin3_timeline_tests` (N1).
Brak zmian logiki produkcyjnej, wektorów, generatora i złotego skrótu. Brak `#[ignore]`, brak `Co-Authored-By`,
`git diff --check` czysty.

## 3. Testy

Środowisko: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie
(`pin3ob/tgt-pin3-obrona`, usunięty po bramkach).

| Bramka | Wynik |
|---|---|
| `cargo fmt --all -- --check` | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| `cargo test --lib pin3_timeline_tests` | 5/5 ok |
| Mutanty E1, E4, E7 | 3/3 ZABITE |
| Pełny `cargo test --all-targets --no-fail-fast` (dev, tło `setsid nohup`) | **FULL_EXIT=0**: 547 × `test result: ok`, 0 FAILED, 0 panicked; 4161/0/1 (= 4159 Operatora + 2 nowe testy); w tym `p6_k5loop_wiring_a_pin`, `p6_k5loop_wiring_a`, `_tags_rest`, `_adapter`, `_siege_*`, `p6_battle_setup*`, `bridge_contract` |

Target usunięty po bramkach; wolne miejsce na dysku: 12 GB.

## 4. Długi

- **D-PIN3-3-SHOT-ID** (z N2): trafienie strzału jednostki powinno dostać numer zegara z chwili `_schedule(RANGED_FLY_MS)`
  (`:9227`), a nie fazę `_raf`. Kontrprzykład: synchroniczny strzał pierwszego atakującego w `_beginTurn` przy wieży z
  `delay 0` (`:5643`, `:5688`, `:4219`); także `dur == 0`. NIE_ZMIERZONO (0 trafień na 256 kandydatach c1).
- **MARCH-INCREMENTAL** (z N3): krok-po-kroku decyzja marszu jak `_doMove` → `done()` (`:8757-8775`); po naprawie
  zamienić `ROZBIEZNE_B_WIRA_PIN_3` na zwykłe wektory zgodne bajt w bajt (wtedy strażnik przestaje być „dowolna rozbieżność”).
- **E3/E8** (mutanty Evaluatora prawdopodobnie równoważne, NIE_UDOWODNIONO): FIFO→LIFO `raf_pending` (w oblężeniu
  najwyżej 1 `BodyDone` w kolejce przy sekwencyjnych aktywacjach) i brak `retain` osi zwrotów.
