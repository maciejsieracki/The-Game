# R-RUSTPORT-P6-K5LOOP-SIEGE-ATK-B-Q1 — Evaluator r1 (adwersarialny)

```text
STATUS: FAIL
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5LOOP-SIEGE-ATK-B-Q1 (T2b)
GOAL: atakujący przy murze w ProdBody (katapulta, taran, wyłom muru/bramy, odwrót z muru, bramka _siegeMoveRefused),
      akcje bez DTO, zamknięcie długu T2a (synchronizacja wyłomu ProdBody <-> SiegeLoop)
ZMIANY/COMMIT: oceniany kod: rust-port-wip/siege-atk-b-q1-op 8c86f90b3 (kod 31e6bced5), baza 25ce36748 (= origin/rust-port/parity-v2);
              Evaluator: wyłącznie ten raport
TESTY: fmt EXIT 0; clippy -D warnings EXIT 0; 10 celów bramki EXIT 0; pełny cargo test --all-targets --no-fail-fast EXIT 0
       (539 binarek, 4064 ok, 0 FAIL, 1 ignored istniejący); generator odtworzony bajt w bajt; 26 własnych mutantów: 19 zabitych, 7 przeżyło
BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: Obrona r1, potem Operator r2 (tylko testy/wektory, kod prawdopodobnie bez zmian)
DEPLOY/PUSH: NIE WYKONANO
```

## 1. Baza, allowlista, zakazy

- Baza `25ce36748` = `origin/rust-port/parity-v2` (merge-base gałęzi Operatora = baza). 4 commity tematu.
- `git diff --stat 25ce36748..8c86f90b3`: 15 plików, wszystkie w allowliście (`siege_tactics_loop.rs`, `siege_tactics_actions.rs`
  — tylko nowe warianty + `*WithoutDto`, nowy `siege_tactics_atk_b.rs` + `pub mod` w `mod.rs`, nowe pliki testu/gen/wektorów,
  wskazane pliki testowe D-INT-2, raport). Brak zmian w `renderer/`, `view-model/`, `bridge.rs`, `battle_setup*`, `Cargo.*`, `gra/`,
  `REJESTR-RUST.md`. Sekcja „Pliki spoza allowlisty”: brak takich plików.
- Brak nowego `#[ignore]`; `git diff --check` czysty; brak linii `Co-Authored-By` w commitach.
- Zmiany istniejących asercji (D-INT-2) przejrzane: `p6_k5doc_t8`, `p6_k5loop_siege_def`, `p6_siege_tactics_loop_body`
  (porównanie z bliźniakiem bez muru — wzmocnienie), `p6_k5loop_siege_atk_a` (pominięcie porównania czasu dla znaczników
  wykonywanych od T2b — uzasadnione: generator T2a zatrzymuje pin na atrapie, skutki sprawdzają wektory T2b), `p4_1i3_actions`
  (tylko ramiona `match`). Każda opisana w 01 §3 ze starą/nową wartością. Akceptuję.

## 2. Bramki odtworzone (Evaluator, `CARGO_TARGET_DIR` w scratchpadzie `siegeatkb-ev/target`, usunięty po bramkach)

| Bramka | Wynik |
|---|---|
| `cargo fmt --check` | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| `cargo test --test p6_k5loop_siege_atk_b --test p6_k5loop_siege_atk_a --test p6_k5loop_siege_def --test p6_siege_tactics_loop_body --test p6_siege_tactics_loop_body_pin --test p6_k5loop_outcome_pin --test p6_k5loop_close_r4 --test p6_k5doc_t8 --test p4_1i3_actions --test bridge_contract` | EXIT 0 (7/7/10/8/2/8/7/6/9/9) |
| pełny `cargo test --all-targets --no-fail-fast` (tło, `setsid nohup`) | EXIT 0: 539 binarek, 4064 passed, 0 failed, 1 ignored |
| `node tests/p6_k5loop_siege_atk_b_gen.mjs` (Node 22.23) | strażnik SHA `489ddf8e…1699` zgodny; `vectors.json`, `vectors_nan.json`, `vectors_edge.json` identyczne bajt w bajt (`cmp`) |

Generator wykonuje tekst pinu `07d2fbd72` (`git show`, `expectLine`, wycinki metod `_attackGate`, `_attackWallTile`,
`_breachWallTile`, `_breachGate`, `_destroyTowerAtRow`, `_siegeShooterThreats`, `_siegeMoveRefused`, `_doMove`…), stuby
opisane jawnie (render, `_applyTerrainRange`, klasy). Porównanie z pinem (`battleScene.ts:7310-7335, 7505-7568, 7638-7811,
7924-7970, 8361-8371, 8684-8692, 4194-4200`) czytane ręcznie: formuły obrażeń, kolejność `_schedule(700)`/`done()`,
odwrót z ponownym przeniesieniem (pętla `rr` bez `placed`), morale `MORALE_*` + `_checkRout`, bramka `_doMove` — zgodne.

## 3. Mutanty Evaluatora (skrypt `scratchpad/siegeatkb-ev/mut.py`, każdy: `cargo test --test p6_k5loop_siege_atk_b`, przy przeżyciu
`cargo test --lib siege_tactics_atk_b`; źródła przywrócone, `git status` czysty)

| ID | Mutacja | Wynik |
|---|---|---|
| E01 | `siege_move_refused_now`: `shooting_disabled` bez `!doctrine.shooting_enabled` | PRZEŻYŁ |
| E02 | `ShooterDefender.range_base` = `1.0` (filtr `d.rangeBase <= 0`, `:7928`) | PRZEŻYŁ |
| E03 | `wall_tiles_alive` = `siege_wall_tiles_init` | zabity |
| E04 | kafle bramy `[gr-1, gr, gr+1]` | zabity |
| E05 | `attacker_is_melee` bez `!is_siege_unit` | zabity |
| E06 | `drain_body`: brak `env.wall_ever_breached = true` z `body.wall_ever_breached()` | **PRZEŻYŁ** |
| E07 | `ProdAdvanceWorld::can_attack_from` bez filtra `_meleeBlockedByWall` | zabity |
| E08 | brak `last_attacked_wall_row` | zabity |
| E09 | `_attackGate` bez strażnika `siegeGateCol < 0` | zabity |
| E10 | morale wyłomu bez pominięcia `routed` | zabity |
| E11 | odwrót z kafla bez pominięcia `fadingOut` (`:7697`) | PRZEŻYŁ |
| E12 | wieża w wyłomie bez `!destroyed` | zabity |
| E13 | `wall_retreat_cell` pierwsze pole bez `passable` | zabity (lib) |
| E14 | `wall_retreat_cell` `dc` 1..=2 zamiast 1..=3 (`:7719`) | PRZEŻYŁ |
| E15 | kolejność `rr` odwrócona | zabity |
| E16 | `clamp(1, …)` wiersza odwrotu | zabity (lib) |
| E17 | brama: `missile >= 0` | zabity |
| E18 | kafel: `wall >= 0` | zabity |
| E19 | `cav_move` czas odmowy = `MOVE_STEP_MS` | zabity |
| E20 | timer kamienia 0 ms | zabity |
| E21 | `PlainsCell::move_cost` 1 → 2 (`MOVE_COST[Plains]`) | PRZEŻYŁ |
| E22 | `PlainsCell::is_ford` bez wykluczenia kafla wyburzonego | PRZEŻYŁ |
| E23 | brak `on_wall_walkway = false` po odwrocie | zabity |
| E24 | zagrożenia: `routed` obrońcy ignorowany | zabity |
| E25 | `tower_at_wall_rows_count` = 0 | zabity |
| E26 | `body_step` czas odmowy = `MOVE_STEP_MS` | zabity |

Mutanty Operatora (24, 22 zabite + 2 uzasadnione) nie były powtarzane; uzasadnienia M19 i M24 przyjmuję.

## 4. Zarzuty (wymagane w r2)

1. **E06 — dług T2a zamknięty bez testu (GOAL).** Synchronizacja `LoopBody::wall_ever_breached()` → `SiegeEnv::wall_ever_breached`
   w `drain_body` (`siege_tactics_loop.rs:665-667`) jest jedyną drogą przeniesienia wyłomu BRAMY (`_breachGate` `:7759`) i wejścia
   z wieży (`:8072-8073`) do sterownika (sufit tur bez wyłomu, `_checkEnd`). Test `sterownik_synchronizuje_wylom_z_cialem` sprawdza
   tylko ścieżkę `WallBreach`, która ustawia flagę także przez `breach_wall_row`, więc usunięcie synchronizacji przechodzi
   wszystkie testy. Dispatch: „synchronizacja … albo jawny test”. Wymagane: test sterownika z ciałem, które ustawia flagę bez
   `WallBreach` (wyłom bramy: `ProdBody` z taranem przy bramie o `gate_hp <= dmg` w `SiegeLoop`, albo atrapa), z asercją
   `sl.env.wall_ever_breached` i skutkiem w sterowniku (np. brak sufitu tur bez wyłomu).
2. **E21/E22 — nakładka terenu po wyłomie (`PlainsCell`, D-B3) nietestowana poza przejezdnością.** Koszt ruchu `1`
   (`MOVE_COST[Plains]`) i brak brodu na wyburzonym kaflu nie wpływają na żaden wektor (wektory to pojedyncza aktywacja; ruch
   po wyburzonym kaflu nie występuje). Wymagane: przypadek (wektor pinu albo test jednostkowy na `terrain_passable`/koszcie po
   wyłomie) z ruchem przez wyburzony kafel muru/bramy, w którym koszt i bród mają znaczenie (np. jednostka z `moveLeft`
   granicznym), porównany z pinem.
3. **E14, E11 — gałęzie pinu `_breachWallTile` niepokryte.** Pętla `dc = 3` (`:7719`) nigdy nie decyduje (wszystkie
   przypadki rozstrzygają się dla `dc <= 2`); obrońca `fadingOut` na wyburzonym kaflu (`:7697`) nie występuje w wektorach.
   Wymagane: przypadki generatora (krawędzie/odwrót) z zablokowanymi polami `dc = 1, 2` i z `fadingOut` obrońcy na kaflu;
   licznik pokrycia (np. `retreatDc3`, `retreatSkipFading`) z asercją `>= 1` w `pokrycie_skutkow_wylomu`.
4. **E02 — filtr `d.rangeBase <= 0` w `_siegeShooterThreats` (`:7928`) niepokryty.** Generator zawsze daje strzelcom
   `rangeBase = range >= 1`. Wymagane: obrońca `canShoot` z `rangeBase = 0` (albo jawne uzasadnienie, że jest nieosiągalny w
   pinie — z dowodem z `_attackRangeFor`/spawnu `:4549`, `:4707`).
5. **E01 — dwa źródła `shootingEnabled` (uwaga, nie blokuje sam).** `ApproachUnit.shooting_disabled` łączy
   `doctrine.shooting_enabled` i `activate.shooting_disabled`; harness ustawia oba z tego samego pola wektora, więc każdy z
   dysjunktów jest równoważny w testach. Wymagane: test rozprzęgający (jedno źródło `false`, drugie `true`) albo zapis w
   raporcie, które pole jest kanoniczne dla `ru.shootingEnabled` przy wpięciu (T6/#369).

## 5. Uwagi (nie blokują; do sekcji „Długi”)

- N1 `gate_hp` domyślnie `0.0` (wartość pola sceny, `:2454`): bez wejścia adaptera pierwszy cios taranu otwiera bramę bez
  tagu. W pinie stan `siegeGateCol >= 0 && gateHp == 0` przed wyłomem nie istnieje (`_carveWallTiles` ustawia oba). Zalecenie
  dla T6: `Option`/jawny tag braku `gate_hp`, analogicznie do `siege_stats`.
- N2 D-B2: pętla morale `_breachGate` przesunięta do `complete`; w pinie jest synchroniczna w `_attackGate`. Gdy w zegarze
  czeka timer o tym samym `vNow` (np. trafienie wieży), Rust wykona go PRZED morale, pin PO. Raport 01 twierdzi „między
  wyłomem a pętlą morale w pinie nie ma innego kodu” — prawda w pinie, ale nie w sterowniku Rust. Dopisać do długu #369.
- N3 D-B7: zasięg obrońcy po zejściu z korony muru pozostaje z wejścia adaptera (pin przelicza `_applyTerrainRange`, utrata
  x2). Wektory tego nie widzą (stub generatora). Dług T6 opisany — przyjmuję.
- N4 Tag `doktryna-rozkaz-ruchu` (K5EXEC-T3) dopuszczony w teście kryterium zamknięcia z terenem; nie jest tagiem oblężniczym
  ani tagiem wejścia adaptera w sensie dispatchu — dopisać jawnie do kryterium w raporcie r2 (istniał przed T2b).

## 6. Werdykt

FAIL (techniczny, tylko testy): kod zgodny z pinem we wszystkich sprawdzonych miejscach i wszystkie bramki zielone, ale
kryterium dispatchu „mutanty każdej nowej gałęzi zabite albo jawnie uzasadnione” nie jest spełnione dla 7 nowych gałęzi,
w tym dla synchronizacji wyłomu bramy wymaganej wprost w GOAL (zarzut 1). Runda 2 tego samego ID: testy/wektory dla
zarzutów 1–4 i decyzja dla 5; bez zmian kodu, chyba że test wykaże rozbieżność.
