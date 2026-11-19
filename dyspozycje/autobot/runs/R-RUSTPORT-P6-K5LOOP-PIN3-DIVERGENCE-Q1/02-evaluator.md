# R-RUSTPORT-P6-K5LOOP-PIN3-DIVERGENCE-Q1: Evaluator r1 (adwersarialny)

```text
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5LOOP-PIN3-DIVERGENCE-Q1 (B-WIRA-PIN-3: rozbieżności logiki Rust vs pin @1 ms)
GOAL: zmierzyć i usunąć przyczyny rozbieżności Rust vs pin przy kroku klatki 1 ms; ≥ 3 rozróżniające wektory;
      dawne wektory bajt w bajt; mutanty ≥ 8
OCENIANY KOD: rust-port-wip/pin3-divergence-q1 = 975f1f835 (7 commitów kodu + raport nad bazą)
BAZA: 540be622e608ee4261ddf4513ea4adb83ef8c666 (merge-base = SHA z linii BAZA dispatchu, zgodne)
ZMIANY/COMMIT: tylko ten raport (bez zmian kodu)
TESTY: §2 (wszystkie bramki odtworzone, EXIT 0)
BLOKADY: brak blokujących; uwagi N1–N5 (§5) dla Obrony i Final Control
RUNDY: 1/5
NASTĘPNY KROK: Obrona r1 (N1, N2), potem Final Control
DEPLOY/PUSH: NIE WYKONANO
```

## 1. Zakres i allowlista

`git diff --stat 540be622e 975f1f835` daje 7 plików, wszystkie z allowlisty: `siege_tactics_loop.rs` (+299/−18),
`siege_battle_session.rs` (+20/−1), `p6_k5loop_wiring_a_gen.mjs` (+31), `p6_k5loop_wiring_a_pin.rs` (+69/−8),
`p6_k5loop_wiring_a_pin_vectors/vectors.json` (+10693/−0), dwa pliki w katalogu runu. Nie ruszono `bridge.rs`,
`siege_battle_apply.rs` ani `p6_k5loop_wiring_a.rs`, więc złoty skrót się nie zmienił. Plików spoza allowlisty brak.
Nowych `#[ignore]` brak. Usunięta asercja `assert_eq!(zgodne, list.len() - ROZBIEZNE_B_WIRA_PIN_2.len())` ma
mocniejszego następcę (odejmuje obie listy). W commitach nie ma `Co-Authored-By`, a `git diff --check` jest czysty.

## 2. Bramki odtworzone niezależnie

Środowisko: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, własny `CARGO_TARGET_DIR`
w scratchpadzie (`pin3ev/tgt-pin3-ev*`). Po bramkach targety usunięte, wolne miejsce na dysku: 12 GB.

| Bramka | Wynik |
|---|---|
| `cargo fmt --all -- --check` | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| `cargo test --all-targets --no-fail-fast` (dev, tło `setsid nohup`) | **FULL_EXIT=0**: 547 × `test result: ok`, 0 FAILED, 0 panicked; liczby zgodne z raportem Operatora (4159/0/1) |
| `p6_k5loop_wiring_a_pin` (release) | 6/6 ok |
| `p6_k5loop_wiring_a`, `_tags_rest`, `_adapter`, `_siege_*`, `p6_battle_setup*`, `bridge_contract` | ok w pełnym przebiegu |
| `pin3_timeline_tests` (lib) | 3/3 ok |
| Generator `p6_k5loop_wiring_a_gen.mjs` (pełna regeneracja, wykonuje TEKST pinu `07d2fbd72` przez `git show`) | EXIT 0, strażnik SHA-256 `3eeeb760…da34d` ok; `vectors.json` MD5 **`1fcd154c8ec119e4cdf1d1bc4c454853`**, `pin_data.json` `432eed76e34a0e8cc96ec548e88eae64`, takie same jak w raporcie; `git status` czysty po regeneracji |
| Dawne wektory bajt w bajt | diff `vectors.json` ma 0 linii usuniętych (same dopiski) |

## 3. Kandydaci c1: niezależna replikacja

- Wyjścia pinu dla 128 kandydatów c1 wygenerowałem od nowa, kopią generatora z sondą (bez zmian tekstu pinu, ten sam
  strażnik SHA). Krok 16 ms: MD5 `307d5942…` jest identyczne z `c128_16_pin.json` Operatora. Krok 1 ms: MD5
  `ed9a3c98…` jest identyczne z `c128_1_pin.json`.
- Rust w release przez `kandydaci_z_pliku_na_zadanie`:
  - **@16 ms: 113/128 zgodnych.** Rozbieżne są 118, 120, 122, 154, 155, 157, 161, 162, 189, 190, 191, 196, 204, 217
    i 221, czyli dokładnie 3 przypadki klasy A i 12 FRAME-QUANT z §4 raportu.
  - **@1 ms (`WIRING_A_RUST_FF_STEP=1`): 125/128 zgodnych.** Rozbieżne są tylko 118, 196 i 221 (klasa A).
  - Liczby z raportu Operatora potwierdzone co do kandydata.
- **Klasa A, kontrola przyczyny dla 196.** Porównałem ślad pinu z śladem Rust przy kroku 1 ms (MOVE/ROUT/KILL/DMG).
  Do zdarzenia 141 oba ślady są identyczne. Rozbicie a5 następuje w 150 740 w obu. Pierwszy rozjazd jest w 150 900:
  w pinie `a4 24,79->24,78`, w Rust `a4 24,79->25,79`. Pin decyduje o kroku w chwili kroku (`_doMove` → `done()` z
  ostatniego kroku `_raf`, `:8760-8775`), a Rust liczy marsz atomowo. Klasyfikacja jako wyjątek i temat następczy
  MARCH-INCREMENTAL jest uzasadniona. Gameplay nie jest niejednoznaczny, więc pytanie ABC nie jest potrzebne.

## 4. Mutanty: 8 Operatora odtworzone, 8 własnych

Skrypt: `scratchpad/pin3ev/mutanty_ev.py`. Każdy mutant uruchamia `cargo test --release --test
p6_k5loop_wiring_a_pin` oraz `--lib pin3_timeline_tests`. Mutant, który się nie kompiluje, nie jest liczony jako
zabity (żaden się nie zdarzył). Źródła są przywracane, `git status` jest czysty.

| Mutant | Wektory | Testy osi | Wynik |
|---|---|---|---|
| M1 wieża: pole celu po marszu | ZABITY | — | zabity |
| M2 wieża: zwrot celu po marszu | ZABITY | — | zabity |
| M3 krok `t0==vNow` zawsze wykonany | ZABITY | ZABITY | zabity |
| M4 krok `t0==vNow` nigdy wykonany | przeżył | ZABITY | zabity (tylko testem osi) |
| M5 `body_done_raf = false` | ZABITY | — | zabity |
| M6 rozbicie w marszu zwalnia pole końcowe | ZABITY | — | zabity |
| M7 zwrot z wcześniejszej chwili nadpisuje | przeżył | ZABITY | zabity (tylko testem osi) |
| M8 remis fazy zegar/`_raf` | przeżył | ZABITY | zabity (tylko testem osi) |
| **E1** `set_now` nie aktualizuje `call_now` | przeżył | ZABITY | zabity (tylko testem osi) |
| **E2** faza `_raf` pominięta w `step_realtime` | ZABITY (`zejscie_z_korony…`, wektory realtime) | — | zabity |
| **E3** kolejka `raf_pending` LIFO zamiast FIFO | przeżył | przeżył | prawdopodobnie równoważny (aktywacje w oblężeniu są sekwencyjne, więc w kolejce jest najwyżej 1 `BodyDone`); NIE_UDOWODNIONO |
| **E4** `has_future_steps` ignoruje `synchr` (`t0 > now`) | przeżył | przeżył | **PRZEŻYŁ: gałąź D-PIN3-5 × D-PIN3-2 bez testu** |
| **E5** bliźniak `_klatka1` liczony przy 16 ms | ZABITY (`mur_jazda_rzeka_klatka1`) | — | zabity |
| **E6** `facing_at`: przyszły wpis zwraca `dir` zamiast `prev` | przeżył | ZABITY | zabity (tylko testem osi) |
| **E7** `unit_cell_at` ignoruje `synchr` (`t0 >= v_now`) | przeżył | przeżył | **PRZEŻYŁ: gałąź D-PIN3-2 w pozycji celu bez testu** |
| **E8** brak `retain` osi zwrotów | przeżył | przeżył | prawdopodobnie równoważny (przeszłe wpisy mają klucz mniejszy niż wszystkie nowe, a `facing_at` zwraca najnowszy przeszły, czyli bieżące `facing`); NIE_UDOWODNIONO |

Wniosek z mutantów: gałąź `synchr` (D-PIN3-2: krok wykonany synchronicznie w chwili wywołania ciała) **nie występuje w
żadnym z 22 wektorów pełnej bitwy**. Każdy mutant tej gałęzi (M4, E1, E4, E7) przeżywa wektory. E4 i E7 przeżywają
także testy osi. Dispatch wymaga ≥ 8 mutantów, każdy zabity albo jawnie równoważny. Kryterium jest formalnie
spełnione dla M1–M8 Operatora, ale nowe gałęzie `has_future_steps` i `unit_cell_at` (porównanie `synchr`) nie mają
żadnego testu, który je pilnuje (N1).

## 5. Uwagi (do Obrony i FC)

**N1 (WYMAGANE przed FC, tani test).** Mutanty E4 i E7 przeżywają wszystkie testy, więc porównanie `synchr` w
`has_future_steps` (D-PIN3-5) i w `LoopBody::unit_cell_at` (D-PIN3-2) nie jest pilnowane. Do zrobienia: dopisać do
`pin3_timeline_tests` dwa testy jednostkowe. (a) Krok synchroniczny z `t0 == now` jest już wykonany dla
`unit_cell_at`, czyli zwraca `to`, nie `from`. (b) Rozbicie w chwili `now` równej synchronicznemu ostatniemu
krokowi nie liczy go jako przyszłego, więc pole zostaje zwolnione. Alternatywa: jawne uzasadnienie równoważności.
Oba warianty powinny przy okazji zabić E1.

**N2 (dokumentacja decyzji D-PIN3-3, ryzyko NIE_ZMIERZONO).** Komentarz przy `body_done_raf` mówi, że trafienie
strzału jednostki jest planowane z kroku `_raf`. W pinie `_doRangedAttack` (`:9179-9227`) planuje trafienie przez
`_schedule(RANGED_FLY_MS)`. To trafienie odpala się więc w fazie **zegarów** (`_drainTimers`), a remis z innym
zegarem rozstrzyga kolejność `id`, nie faza `_raf`. Sonda w pinie (wywołania `_schedule` i `_singleBlow` z fazą i
numerem, 128 c1 przy 16 ms, 13 111 ciosów) pokazała:

- 4 333 strzały jednostek zaplanowano w fazie zegara, 242 w fazie `_raf`;
- 5 remisów `due` między trafieniem wieży a trafieniem strzału jednostki, we wszystkich **wieża jest pierwsza**,
  zgodnie z modelem Rust z odłożeniem;
- 0 przypadków „strzał jednostki przed wieżą”.

Na kandydatach model działa. Teoretyczny kontrprzykład z tekstu pinu: `_beginTurn` woła `_fireSiegeTowers()`
(`:5643`), który planuje `_fireOneTower` z `delay 0`, a potem synchronicznie `_activateNext()` (`:5688`). Jeśli
pierwszy aktywowany atakujący strzela synchronicznie, jego `_schedule(380)` dostaje mniejsze `id` niż trafienie wieży
0, zaplanowane dopiero w `_fireOneTower`. W pinie wygrywa wtedy strzał, a w Rust (odłożenie do `_raf`) wieża.
NIE_ZMIERZONO, bo żaden z 256 kandydatów nie trafił na ten przypadek. Do zrobienia: poprawić komentarz D-PIN3-3 (dla
strzału to przybliżenie „id zegara po wszystkich zegarach klatki”, nie faza `_raf` pinu) i dopisać dług
`D-PIN3-3-SHOT-ID` z tym scenariuszem. Docelowo `BodyDone` strzału powinien mieć numer z chwili `_schedule` (wystrzał),
a nie fazę `_raf`. Podobnie `dur == 0` (synchroniczne `done()`) jest teraz odkładane do `_raf`. Ten przypadek też
NIE_ZMIERZONO.

**N3 (słaby strażnik klasy A, drobne).** `ROZBIEZNE_B_WIRA_PIN_3` przyjmuje dowolną rozbieżność. Zmiana Rust, która
zmieni wynik tych trzech bitew na inny, nadal błędny, przejdzie niezauważona. Wzorzec jest odziedziczony z PIN2, więc
uwaga tylko do długu MARCH-INCREMENTAL.

**N4 (drobne).** `step_realtime` zwraca liczbę odpaleń bez `BodyDone` wykonanych w fazie `_raf`. Licznik jest tylko
informacyjny, wpływu na stan nie ma.

**N5 (zgodne z raportem).** Zmieniła się semantyka bliźniaka `mur_jazda_rzeka_klatka1`. Wcześniej Rust liczył go przy
16 ms, a pin przy 1 ms. Teraz Rust liczy go przy 1 ms (D-PIN3-4), a `mur_jazda_rzeka` jest zgodny przy 16 ms. To
porównanie jest mocniejsze: model produkcyjny jest zgodny bajt w bajt. Zmiana jest uzasadniona w kodzie i w raporcie.
Mutant E5 potwierdza, że bliźniak wykrywa pominięcie kroku.

## 6. Zgodność z decyzjami i kryteriami dispatchu

| Kryterium | Ocena |
|---|---|
| Najpierw web/pin (`git show 07d2fbd72`) | tak: odwołania do `:4208-4270`, `:8685-8775`, `:9415-9437`, `:9616-9634` zgadzają się z tekstem pinu (sprawdzone) |
| Tabela 11 kandydatów | jest; przyczyny 196 i 217/218 sprawdzone śladem i sondą |
| 128 c1 @1 ms: 0 albo każdy sklasyfikowany | 125 zgodnych, 3 klasy A z wektorem pilnującym (odtworzone) |
| Dawne wektory bajt w bajt | tak (0 linii usuniętych, MD5 odtworzone) |
| ≥ 3 wektory rozróżniające, strażnik SHA, MD5 | 5 (`p3_*`), strażnik ok, MD5 odtworzone |
| Mutanty ≥ 8 | 8/8 Operatora zabitych (odtworzone); z moich 8 dodatkowych 2 przeżyły bez testu (N1), 2 prawdopodobnie równoważne |
| Złoty skrót `p6_k5loop_wiring_a` | bez zmian |
| FRAME-QUANT poza zakresem | przestrzegane (12 kandydatów zgodnych @1) |

## 7. Werdykt

**PASS-WITH-NOTES.** Wszystkie bramki odtworzyłem z EXIT 0. Liczby kandydatów (113/128 @16 ms, 125/128 @1 ms) i MD5
wektorów są odtwarzalne bit w bit. Poprawki D-PIN3-1, -2 i -5 wynikają z tekstu pinu, a wyjątek klasy A jest
uczciwie zmierzony. Przed FC należy zamknąć N1 (dwa testy osi zabijające E4 i E7) oraz N2 (korekta opisu D-PIN3-3
dla strzału i wpis długu). Żadna z uwag nie pokazała rozbieżności z pinem na mierzonych danych.

Artefakty Evaluatora (scratchpad, poza repo): `pin3ev/mutanty_ev.py`, `pin3ev/mut.log`, `pin3ev/probe/gen_probe.mjs`
(sonda faz `_schedule`), `pin3ev/probe/ties.py`, `pin3ev/cand16.out`, `pin3ev/cand1.out`,
`pin3ev/pin196.trace` i `pin3ev/rust196.trace`.
