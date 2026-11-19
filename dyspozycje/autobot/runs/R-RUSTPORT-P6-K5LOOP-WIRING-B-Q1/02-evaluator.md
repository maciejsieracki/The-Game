# R-RUSTPORT-P6-K5LOOP-WIRING-B-Q1 — Evaluator r1 (adwersarialny)

```text
STATUS: FAIL
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5LOOP-WIRING-B-Q1 (#369 część B)
GOAL: sesja bitwy oblężniczej (start/step/skip/finish) z mostu, wynik zastosowany do PlayableState jak
      finishSiegeStormBattle bez gałęzi zdobycia (hak T8), długi D-ADP-11 i D-ADP-L-BARB
ZMIANY/COMMIT: ocena kodu Operatora 4fb0fe07c (gałąź lokalna rust-port-wip/k5loop-wiring-b-q1; zdalna
               origin/rust-port-wip/k5loop-wiring-b-q1 = c6026c3e3, bez commita raportu) nad bazą 2e5bf370a;
               Evaluator dodaje wyłącznie ten raport
TESTY: bramki odtworzone, wszystkie EXIT 0 (§2); 4 testy adwersarialne Evaluatora padają (§3); 12/18 dodatkowych
       mutantów przeżywa (§4)
BLOKADY: Z1–Z3 (wady funkcjonalne potwierdzone testem), Z4–Z6 (pokrycie / brak wyjścia) — §5
RUNDY: 1/5
NASTĘPNY KROK: Obrona Operatora (02a), potem Operator r2 z tym samym ID
DEPLOY/PUSH: NIE WYKONANO
```

## 1. Baza, zakres, allowlista

* BAZA dispatchu: `origin/rust-port/parity-v2` = `2e5bf370a434eb81eeaf0e82d104faaf5f40b57d` (sprawdzone `git rev-parse`);
  `git merge-base 4fb0fe07c origin/rust-port/parity-v2` = `2e5bf370a`. Ocena na checkout `4fb0fe07c` (worktree Evaluatora,
  gałąź `eval/k5loop-wiring-b-q1`).
* `git diff --stat 2e5bf370a 4fb0fe07c`: 12 plików, wszystkie w allowliście (`bridge.rs`, `domain/{mod,playable,
  siege_battle_apply,siege_battle_session}.rs`, `tests/bridge_contract.rs`, `tests/p6_k5loop_wiring_b{,_pin}.rs`,
  `tests/p6_k5loop_wiring_b_gen.mjs`, `tests/p6_k5loop_wiring_b_vectors/vectors.json`, dwa pliki runu). Plików spoza
  allowlisty: brak. `view-model/`, `renderer/`, `client/`, `src-tauri/`, `gra/` nietknięte.
* `siege_battle_session.rs`: jedna zmiana (producent rosterów → `siege_inputs_with_deals`) — mieści się w „minimalnym
  API wymaganym mostem”.
* `PlayableState` bez nowych pól (bitwa w `PlayableGame`) — zgodnie z dispatchem.
* `#[ignore]`: brak w diffie (jedyne trafienie to zdanie w raporcie). `Co-Authored-By`: brak w commitach.
  `git diff --check 2e5bf370a 4fb0fe07c`: czysto.
* Commit raportu Operatora `4fb0fe07c` NIE jest wypchnięty (zdalna gałąź = `c6026c3e3`) — do wiadomości orkiestratora.

## 2. Bramki odtworzone (CARGO_INCREMENTAL=0, DEBUG=0, własny CARGO_TARGET_DIR w scratchpadzie, usunięty)

| Bramka | Wynik |
|---|---|
| `cargo fmt --all -- --check` | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 (0 ostrzeżeń) |
| `p6_k5loop_wiring_b` / `p6_k5loop_wiring_b_pin` / `bridge_contract` | 10 / 2 / 10 passed, EXIT 0 |
| generator `p6_k5loop_wiring_b_gen.mjs` (kopia z wyjściem do scratchpadu) | `pinSha256 cf81ec14…73505`, MD5 `4a73ff61ca55674fb53149175ad0517a`, plik bajt w bajt = zatwierdzony `vectors.json` |
| pełny `cargo test --all-targets --no-fail-fast` (w tle, partiami po 50 plików z kasowaniem binarek — dysk 5–9 GB) | `--lib --bins --examples --benches` EXIT 0 + 11 partii `--test` EXIT 0 = 547 plików; **FULL_EXIT=0**; 549 × `test result: ok`, 0 FAILED, 4166 passed / 0 failed / 1 ignored (= raport Operatora); w tym `p6_k5loop_wiring_a`, `_a_pin`, `tags_rest`, `adapter`, `siege_atk_a/b`, `siege_def`, `battle_setup`, `battle_setup_units` |

Bramki są zielone. FAIL wynika z wad niewykrytych przez testy Operatora (§3–§5).

## 3. Testy adwersarialne Evaluatora (plik scratch, nie w drzewie)

Plik: `zz_eval_wiring_b.rs` (nagłówek i pomocnicze z `p6_k5loop_wiring_b.rs` + 6 testów), uruchomiony w `engine/tests`,
po uruchomieniu usunięty z worktree; kopia: `02-evaluator-testy.rs.txt` (skrypt mutantów: `02-evaluator-mutanty.py`).
Wynik: **2 passed, 4 failed**.

| Test | Wynik | Co pokazuje |
|---|---|---|
| `eval_playback_kontrakt_16ms` | **FAIL**: 4421 naruszeń, pierwsze `resp 0: frame vNow 0 < 930`, `resp 2: frame vNow 16 < 930` | strumień odpowiedzi mostu nie da się podać konsumentowi `renderer/src/battle/playback.rs` (Z1) |
| `eval_playback_kontrakt_skip` | **FAIL**: `start frame 0 < 930` | już odpowiedź `StartSiegeStorm` ma akcję `t0 = 930` i ramkę `vNow = 0` (Z1) |
| `eval_szturm_z_daleka` | **FAIL**: `prepare_storm` → `Ok(900)` dla kotwicy w odległości 3 od miasta | brak bramki sąsiedztwa pinu (Z2) |
| `eval_szturm_bez_wojny` | pass (Err), ale błąd = `NoDefendersCaptureRequested { city_id: 900 }` | miasto w POKOJU dostaje hak „zdobycie bez bitwy” dla T8 (Z2) |
| `eval_klony_pamiec_podreczna` | **FAIL**: klon A po kroku dostał ramkę `vNow 2992` zamiast `496` | pamięć podręczna `LIVE_SESSION` oddaje klonowi sesję innego klonu (Z3) |
| `bridge::add_player_atomicity_tests` | pass | (z modułu `bridge`) |

## 4. Mutanty dodatkowe Evaluatora (18; werdykt jak skrypt Operatora: `p6_k5loop_wiring_b_pin`, `p6_k5loop_wiring_b`, `bridge_contract`)

Skrypt: wzorzec `01-operator-mutanty.py` (jedna podmiana tekstu, źródło przywracane; po przebiegu `git status` czysty).
Mutanty Operatora M01–M24 przyjmuję jako opisane (nie powtarzałem). **Wynik: 6/18 zabitych, 12 przeżyło.**

| ID | Mutacja | Wynik | Ocena |
|---|---|---|---|
| E01 | weteran także dla rezerwy zwycięzcy (bez filtra logu) | ZABITY (wektory) | — |
| E02 | wygrana obrońcy nie czyści `selected_unit_id` (`main.ts:34713`) | **PRZEŻYŁ** | luka testu |
| E03 | numer bitwy stały 1 (D-WIR-5) | **PRZEŻYŁ** | luka testu: brak drugiej bitwy w grze |
| E04 | remis: atakujący odchodzą od siebie | ZABITY | — |
| E05 | oblegane miasto przejezdne przy odwrocie (`besiegedCityAtHex`, `:33765-33775`) | **PRZEŻYŁ** | luka wektorów |
| E06 | cywilna kotwica nie traci ruchu (`spendAttackMpOnLive`, `:392-402`) | **PRZEŻYŁ** | luka (kotwica-cywil możliwa w ścieżce `siege_panel`, `map-attack-city.ts:128-138`, bez filtra cywila) |
| E07 | trudność AI ignorowana (`difficultyCombatMultForOwner`) | **PRZEŻYŁ** | producent D-WIRB-4 bez testu |
| E08 | las nie jest nakładką (`worldTerrainFromHex`, `:1934-1943`) | **PRZEŻYŁ** | producent bez testu |
| E09 | remis: lider obrońców nie z heksu bitwy (`pickLiveDefLead`) | **PRZEŻYŁ** | luka wektorów |
| E10 | `MoveUnit` w trakcie bitwy dozwolony | ZABITY | — |
| E11 | flaga `selected` jednostek zostaje po wygranej obrońcy | **PRZEŻYŁ** | luka testu |
| E12 | HP ocalałych nie zapisane | ZABITY (E2E) | — |
| E13 | bitwa nie zamknięta po wyniku | ZABITY | — |
| E14 | pamięć podręczna bez klucza bitwy | **PRZEŻYŁ** | luka testu (por. Z3) |
| E15 | epoka milicji = epoka atakującego zamiast właściciela miasta | **PRZEŻYŁ** | producent bez testu |
| E16 | brak `validateActiveSieges` | ZABITY (wektory) | — |
| E17 | `defenderEra` = epoka miasta zamiast `empireEpochForOwner(defRosterRef[0].ownerId)` | **PRZEŻYŁ** | producent bez testu |
| E18 | `defCiv` stałe | **PRZEŻYŁ** | producent bez testu |

Żaden z ocalałych nie jest równoważny ogólnie (różnią się w stanach osiągalnych w pinie); przeżywają, bo scenariusze
testów mają jedną epokę, trudność bez bonusu, równinę, jedną bitwę i brak zaznaczenia.

## 5. Zarzuty

### Z1 (blokujący) — odpowiedzi mostu nie są konsumowalne przez `renderer/src/battle/playback.rs`
Dispatch: „odpowiedzi niosą `Vec<BattleActionDto>`/`BattleFrameDto` (konsument: `renderer/src/battle/playback.rs`)”.
`BattlePlayback::push_actions` / `push_frame` (`playback.rs:584-625`) trzymają `last_queued` przez całą bitwę i
odrzucają `OutOfOrder`, gdy `t0`/`vNow` spada. Pomiar (§3): odpowiedź `StartSiegeStorm` ma akcję `t0 = 930` i ramkę
`vNow = 0`; przy krokach 16 ms jest 4421 naruszeń. Raport Operatora (D-WIRB-6, D-WIRB-6-CHUNK) twierdzi, że akcje są
„posortowane w obrębie jednej odpowiedzi” i że konsument „ma odtwarzać po `t0`”. Pierwsze nie obejmuje ramki (ramka
w tej samej odpowiedzi ma czas wcześniejszy niż akcje), drugie jest sprzeczne z istniejącym konsumentem i nie zostało
zmierzone. Wymagane: emisja zgodna z kontraktem konsumenta (np. akcje z przyszłym `t0` wstrzymywane do kroku, w którym
`vNow >= t0`; ramka nie wcześniejsza niż wydane akcje). Konsument musi przyjąć cały strumień, a test w silniku musi
odwzorować `check_order` konsumenta (test Evaluatora jest gotowym wzorcem). Inna droga to jawna decyzja techniczna, że
zmianę robi I5, z podaniem dokładnej zmiany konsumenta. Sam dług bez pomiaru nie wystarcza.

### Z2 (blokujący, parytet) — brak bramek wejścia szturmu z pinu
Każda ścieżka szturmu w pinie wymaga kotwicy sąsiedniej (dystans 1) i wrogiej frakcji:
* `canInitiateSiege` (`mapSiegeDetect.ts:74-81`: inny właściciel, `maMur`, `isAdjacentToHex`) oraz `siegeAllowedBetween`
  (`main.ts:18157-18158`, `offerCityAttackChoice`);
* `resolveEnemyCityClick` (`map-attack-city.ts:119-170`): `not_enemy` dla miasta gracza, `siege_panel` tylko z oblegającym w
  odległości 1, `attack_choice` tylko z `adjacentPlayerAttackers` + `canInitiateSiege`.

`prepare_storm` sprawdza tylko istnienie miasta i jednostki oraz fotel gracza. Pomiar: kotwica w odległości 3 →
bitwa startuje. Miasto w pokoju → `NoDefendersCaptureRequested`, czyli most zgłasza T8 „zdobycie bez bitwy” miasta, z
którym gracz ma pokój. Miasto własne gracza przechodzi tę samą ścieżkę (brak `not_enemy`). Ponieważ most omija UI,
silnik musi sam odrzucić komendę, której web nie da się wydać (kryterium końca: „komendy poza fazą → jawne błędy”).

### Z3 (blokujący) — pamięć podręczna `LIVE_SESSION` łamie D-WIRB-1 przy klonie gry
Dokumentacja (`siege_battle_apply.rs:17-19`, `:272-274`) twierdzi: „chybienie (…, klon gry, …) = odtworzenie”. To jest
nieprawda: klucz trafienia to `(live_key, ops.len())`, a klon ma ten sam `live_key`. Scenariusz: start → klon A, klon B;
A `step(500)`, B `step(3000)` (B odtwarza i nadpisuje wpis wątku jako `(key, 1)`), A `step(16)` trafia w sesję B.
Pomiar: ramka A `vNow 2992` zamiast `496`. Mutant E14 (usunięcie klucza) też przeżywa, więc test ścieżki odtworzenia nie
pilnuje tożsamości sesji. Wymagane: klucz rozróżniający historię (np. nowy `live_key` przy klonie albo porównanie
całego `ops`) i test z dwoma klonami.

### Z4 — producent wejścia sesji (D-WIRB-4) bez testu względem pinu
E07, E08, E15, E17, E18 przeżywają: trudność AI, las jako nakładka, epoka milicji (`cityDefenderOptions.ownerEra =
empireEpochForOwner(city.ownerId)`, `main.ts:34768-34771`), `defenderEra` (`empireEpochForOwner(defRosterRef[0].ownerId)`,
`:36999`), `defCiv` (`:36861-36863` + `ikonaIdToBronzeCiv`). Wymagane: test producenta (`prepare_storm().input()`), który
rozróżnia każde z tych pól. Wartości mają pochodzić z wykonania pinu albo z istniejących wektorów modułów; nie wpisywać ich
ręcznie.

### Z5 — luki wektorów i E2E w zastosowaniu wyniku
E02/E11 (`selectedId = null`, `main.ts:34713`), E05 (`besiegedCityAtHex` w `retreatHexPassable`), E09 (`pickLiveDefLead`),
E06 (cywilna kotwica) i E03 (licznik bitew > 1) przeżywają. Wymagane: rozszerzyć scenariusze generatora (drugie oblegane
miasto obok heksu bitwy, remis z obrońcą tylko poza heksem bitwy, kotwica-cywil) i E2E (zaznaczona jednostka przy wygranej
obrońcy, dwie bitwy w jednej grze → `battle_index` 1 i 2).

### Z6 — brak wyjścia z bitwy przy błędzie wyniku
`finish` zwraca `Producer("sciezki nieportowane …")`, gdy `outcome.unported` jest niepuste. Bitwa zostaje w `PlayableGame`,
a `AdvanceTurn`/`MoveUnit`/`CancelPlannedMarch`/`StartSiegeStorm` są zablokowane bez końca. Nie ma żadnej komendy
porzucenia (poza `CreateSession`, która kasuje grę). Wymagane: jawna decyzja techniczna, np. odrzucenie startu, gdy przebieg
dałby ścieżkę nieportowaną, albo udokumentowana droga wyjścia z testem.

### Uwagi (nie blokują)
* U1 — D-WIRB-2 bramkuje 3 komendy mapy; `AddPlayer` i `SelectUnit` przechodzą w trakcie bitwy (web: scena zasłania mapę).
  Wynik stosowany na stanie bieżącym, nie na migawce startu — spójne, ale do jawnego opisu.
* U2 — hak T8: w gałęzi `captureRequested` `validateActiveSieges` liczone jest przed wejściem na heks i przed zmianą
  właściciela (w pinie po `applyCityCaptureToMap`), a warunek `isCityCaptureBlockedByDefenders` (`main.ts:34650-34653`)
  nie jest częścią haka. T8 musi powtórzyć oba; wpisać do kontraktu `CityCaptureRequested`.
* U3 — `client/tests/engine_bridge_renderer.rs` dołącza `bridge.rs` przez `#[path]`; kompilacja klienta z nowym
  `bridge.rs`: NIE_ZMIERZONO (renderer poza bramkami tego tematu, dysk).
* U4 — rejestr „zastosowano / hak T8 / poza zakresem” jest w raporcie (§5 Operatora); wpis do `REJESTR-RUST.md` należy do
  orkiestratora (plik poza allowlistą) — poprawne.
* U5 — D-ADP-11 (sojusz = aktywna umowa, `hasAllianceDealBetween` `main.ts:22648-22656`) i D-ADP-L-BARB (barbarzyńców brak
  w stanie, reguła `areEnemyOwners` bez wejścia) są zgodne z tekstem pinu. Akceptuję je jako decyzje techniczne.
* U6 — zgodność wyniku z pinem (`applyPostBattleMap`, `post-battle-map.ts:168-467`; `finishSiegeStormBattle`
  `main.ts:36596-36720`) sprawdzona ręcznie dla ścieżek pokrytych wektorami. Generator wykonuje tekst pinu, a klej
  `retreatHexPassable`/`isOccupiedHex`/`areEnemies` jest przepisany 1:1, co jest jawnie zaznaczone.

## 6. Werdykt

**FAIL.** Bramki są zielone, a zastosowanie wyniku jest zgodne z pinem na pokrytych ścieżkach. Mimo to trzy wady są
potwierdzone testem:
* Z1: most produkuje strumień, którego wskazany w dispatchu konsument nie przyjmuje;
* Z2: silnik przyjmuje szturm, którego web nie pozwala wydać, w tym hak zdobycia miasta w pokoju;
* Z3: optymalizacja D-WIRB-1 daje błędną sesję wbrew własnej dokumentacji.

Do tego 12/18 dodatkowych mutantów przeżywa (Z4, Z5). Runda r2: Z1–Z6 z testami, które zabijają E02–E09, E11, E14,
E15, E17 i E18 (albo ich jawna równoważność z dowodem), plus testy Evaluatora z §3 włączone do zestawu.
