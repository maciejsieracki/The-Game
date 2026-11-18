# R-RUSTPORT-P6-K5LOOP-SIEGE-ATK-B-Q1 — Final Control r1

```text
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5LOOP-SIEGE-ATK-B-Q1 (T2b)
GOAL: atakujący przy murze w ProdBody (katapulta, taran, wyłom muru/bramy, odwrót z muru, bramka _siegeMoveRefused),
      akcje BattleAction bez DTO, zamknięcie długu T2a (synchronizacja wyłomu ProdBody <-> SiegeLoop)
ZMIANY/COMMIT: oceniany stan b09f83d4b (gałąź rust-port-wip/siege-atk-b-q1-obr; kod 31e6bced5 + testy obrony 6d6352651),
              baza 25ce36748 (merge-base z origin/rust-port/parity-v2; parity-v2 dziś 5f46a7e18 — merge-tree czysty,
              drzewo 48275f3db); FC: wyłącznie ten raport (gałąź fc/siege-atk-b-q1)
TESTY: fmt EXIT 0; clippy --all-targets -D warnings EXIT 0; 10 celów bramki EXIT 0 (9/9/6/7/8/7/9/10/8/2);
       cargo test --lib plains_cell 2/2; pełny cargo test --all-targets --no-fail-fast EXIT 0 (539 binarek, 4068 passed,
       0 failed, 1 ignored istniejący); generator odtworzony (Node 22.23.4): strażnik SHA zgodny, 4 pliki wektorów
       identyczne (git status czysty); 17 mutantów FC: 14 zabitych, 2 równoważne, 1 przeżył (dług #369, niżej)
BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: integracja orkiestratora na origin/rust-port/parity-v2 (merge, pełny cargo test po merge'u), refs/keep
DEPLOY/PUSH: NIE WYKONANO
```

## 1. Baza, allowlista, zakazy (sprawdzone samodzielnie)

- `git merge-base origin/rust-port/parity-v2 b09f83d4b` = `25ce36748` = BAZA z dispatchu. Od tego czasu parity-v2
  przesunęło się o BATTLE-SETUP-UNITS (`5f46a7e18`); jedyny wspólny plik to `domain/mod.rs`; `git merge-tree
  --write-tree origin/rust-port/parity-v2 b09f83d4b` bez konfliktów.
- `git diff --stat 25ce36748..b09f83d4b`: 18 plików, wszystkie w allowliście: `siege_tactics_loop.rs`,
  `siege_tactics_actions.rs` (tylko 8 nowych wariantów `BattleAction`, 8 `ActionError::*WithoutDto` i ich ramiona
  w `actions_to_dto`, które są konieczną częścią mapowania na `*WithoutDto`), nowy `siege_tactics_atk_b.rs` + `pub mod`
  w `mod.rs`, nowy test/gen/4 pliki wektorów, wskazane pliki testowe D-INT-2 (`p4_1i3_actions`, `p6_k5doc_t8`,
  `p6_k5loop_siege_atk_a`, `p6_k5loop_siege_def`, `p6_siege_tactics_loop_body`), raporty runu. Brak zmian w
  `renderer/`, `view-model/`, `bridge.rs`, `battle_setup*`, `Cargo.*`, `gra/`, `REJESTR-RUST.md`.
- `git diff --check` czysty; brak `#[ignore]` w diffie; trailery `Co-Authored-By` nieobecne w 7 commitach tematu.
- Kryterium zamknięcia tagów: test `brak_tagow_oblezniczych_dla_atakujacego` przechodzi przez 4 pliki wektorów
  (z terenem i bez), wymaga braku tagów oblężniczych i dopuszcza wyłącznie `*-brak-terenu`, `*-bez-szablonu` oraz
  istniejący przed T2b `doktryna-rozkaz-ruchu` (N4, dopisane jawnie w 02a). Tagi `atak-muru-poza-oblezeniem` /
  `marsz-poza-oblezeniem` dotyczą wyłącznie zdarzeń poza atakującym przy murze (jak przyjęty w T2a FC
  `marsz-poza-oblezeniem`). Przyjmuję.

## 2. Bramki (FC, `CARGO_TARGET_DIR=scratchpad/siegeatkb-fc/target`, `CARGO_INCREMENTAL=0`, debug=0)

| Bramka | Wynik |
|---|---|
| `cargo fmt --check` | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| `cargo test --test p6_k5loop_siege_atk_b … --test bridge_contract` (10 celów) | EXIT 0: bridge_contract 9, p4_1i3_actions 9, p6_k5doc_t8 6, p6_k5loop_close_r4 7, p6_k5loop_outcome_pin 8, p6_k5loop_siege_atk_a 7, p6_k5loop_siege_atk_b 9, p6_k5loop_siege_def 10, p6_siege_tactics_loop_body 8, p6_siege_tactics_loop_body_pin 2 |
| `cargo test --lib plains_cell` | 2 passed |
| pełny `cargo test --all-targets --no-fail-fast` (tło, `setsid nohup`, `FULL_EXIT` w logu) | EXIT 0; 539 binarek, 4068 passed, 0 failed, 1 ignored (istniejący) |
| `node tests/p6_k5loop_siege_atk_b_gen.mjs` | SHA wycinków pinu `489ddf8e…1699`; `vectors{,_nan,_edge,_retreat}.json` bez różnic (`git status` czysty); liczniki `retreatDc3 = 60`, `retreatSkipFading = 30` |

## 3. Zarzuty Evaluatora i odpowiedzi Obrony — orzeczenie

| Zarzut | Obrona | Dowód FC | Orzeczenie |
|---|---|---|---|
| Z1 / E06 (sync `body.wall_ever_breached()` → `env`) | test `sterownik_przejmuje_wylom_bramy_z_ciala_bez_akcji_wallbreach` | test przechodzi w bramce; ciało-atrapa ustawia flagę bez `WallBreach`, skutek w `_roundCapVerdict` (bliźniak remis po 2 rundach) — usunięcie linii `drain_body:665-667` zabija test (log obrony; konstrukcja testu sprawdzona) | ODDAL (zamknięte) |
| Z2 / E21, E22 (`PlainsCell` koszt/bród) | moduł `plains_cell_tests` (2 testy) | `cargo test --lib plains_cell` 2/2; nakładka nad „najgorszym” terenem rozróżnia oba mutanty; pin `:7644`, `:7770`, `battle-terrain.ts` `MOVE_COST[Plains]` | ODDAL (zamknięte) |
| Z3 / E14, E11 (`dc = 3`, `fadingOut`) | `vectors_retreat.json` (90), test `zgodnosc_z_pinem_odwrot_z_muru` | wektory odtworzone bajt w bajt; liczniki w Rust = generator; stare pliki bez zmian | ODDAL (zamknięte) |
| Z4 / E02 (`d.rangeBase <= 0`) | nieosiągalne w pinie | sprawdzone w pinie: `canShoot = rangedBase && ammoLeft > 0` (`:1457-1459`); jedyne przypisania `rangeBase`/`rangedBase` to `:4549/4551`, `:4707/4709`, `:5460/5462`, `:17237/17239`, wszędzie `rangedBase ⇒ attackRange(bu) >= 2` (`isRanged = attackRange >= 2`, `:1420`) albo katapulta `>= 6`; dodatkowo zmierzone: `p6_siege_tactics_approach_vectors/vectors.json` ma 76 żywych obrońców `canShoot` z `rangeBase <= 0`, 41 z `terrainAfter >= 1` (filtr funkcji K1 pokryty) | ODDAL (równoważny) |
| Z5 / E01 (dwa źródła `shootingEnabled`) | decyzja D-B11 (kanoniczne `ActivateUnit::shooting_disabled`, niezmiennik dla T6/K5DOC) | pin ma jedno pole `ru.shootingEnabled`; przy niezmienniku dysjunkcja = każdy człon | ODDAL; wpis D-B11 do `REJESTR-RUST.md` robi orkiestrator |
| N1–N4 | przyjęte do długów (02a §6) | — | ODDAL (długi niżej) |

## 4. Mutanty FC (skrypt `scratchpad/siegeatkb-fc/mut.py`, każdy: `cargo test --test p6_k5loop_siege_atk_b`, przy przeżyciu `cargo test --lib siege_tactics`; źródła przywrócone, `git status` czysty)

| ID | Mutacja | Wynik |
|---|---|---|
| F01 | `MORALE_GATE_BREACH` 5 → 4 | zabity |
| F02 | `siege_structure_damage`: próg `max(12, …)` → `max(1, …)` | zabity |
| F03 | `wall_tile_damage`: `rng * 2` → `rng * 1` | zabity |
| F04 | `WALL_HIT_FLY_MS` 700 → 600 | zabity |
| F05 | `RAM_ANIM_MS` 320 → 300 | zabity |
| F06 | `retreat_col = wall_col + 2` | zabity |
| F07 | odwrót `dr 0..=1` | zabity |
| F08 | `siege_atk_gate` bez strażnika `gate_open` | PRZEŻYŁ — równoważny (niżej) |
| F09 | wyłom bramy przy `gate_hp < 0` | zabity |
| F10 | `boulder_hit`: `wallTileHp.get(row) ?? 0` → `?? 640` | PRZEŻYŁ — kod zgodny z pinem, pokrycie → dług #369 (niżej) |
| F11 | `breach_wall_tile` bez `wall_tile_hp.retain` | zabity |
| F12 | katapulta obrońcy na wyburzonym kaflu bez `start_fade` | zabity |
| F13 | `on_wall_walkway` zostaje, gdy brak pola odwrotu | zabity |
| F14 | morale wyłomu bez pominięcia `fading_out` | PRZEŻYŁ — równoważny (niżej) |
| F15 | kafle bramy tylko `gr` | zabity |
| F16 | `drain_body` bez `breach_wall_row` | zabity |
| F17 | `tile_index_in_bounds` zawsze `true` | zabity (lib) |

- **F08 — ODDAL (równoważny).** Pin `_attackGate` (`:7311`) ma strażnik `gateOpen`, ale jedyny wołający
  `_siegeRamTowerStep` (`:8024-8028`) wchodzi do niego tylko przy `_isRam && !this.gateOpen`, synchronicznie; w Rust
  zdarzenie `AttackGate` klasyfikuje się z `gate_open: self.scene.gate_open` (`siege_tactics_loop.rs:4971`). Strażnik
  jest nieosiągalny w obu (zachowany 1:1 z pinem). Gałąź `siegeGateCol < 0` tego samego warunku zabita przez E09.
- **F14 — ODDAL (równoważny).** W pinie `fadingOut` nigdy nie przyjmuje `true` (jedyne przypisanie: `ru.fadingOut =
  false` w `_removeUnitFromScene`, `:9914`; `_startFade` → `_removeUnitFromScene` ustawia `dead = true`). W Rust
  `grep 'fading_out = true'` w `src/domain` — brak; `start_fade` ustawia `dead = true`. Pominięcie `fading_out` w pętli
  morale jest więc pokryte przez `dead`. (Wektory `retreat-fading` obrony używają `fadingOut = true` jako wejścia —
  stan nieosiągalny w pinie, ale wykonywany tekstem pinu; nie szkodzi.)
- **F10 — ODDAL jako zarzut blokujący; DŁUG #369.** `?? 0` (`:7556`) decyduje tylko, gdy kafel został wyburzony między
  strzałem a trafieniem: druga katapulta aktywuje się po `ACT_GAP_MS = 160` (`:1014`), a kamień leci 700 ms, wybór
  wiersza (`:6201-6205`) bierze najbliższy żywy kafel — w pinie osiągalne przy ≥2 katapultach na tym samym wierszu
  (drugie trafienie: `newHp = 0`, `wallTileHp.set(row, 0)` ponownie dodaje klucz, `_breachWallTile` drugi raz). Kod Rust
  (`map_or(0.0, …)` + `push` na końcu) odwzorowuje to 1:1, ale wektory T2b to pojedyncza aktywacja, więc gałąź nie
  jest obserwowana. To scenariusz wieloaktywacyjny (sterownik + `ProdBody`), należący do zakresu #369 (K5LOOP-WIRING,
  wektory pętli). Nie zmienia zachowania tego tematu → nie NAPRAW.

## 5. Uwagi FC (nie blokują)

- U1 `breach_gate_scene` nadpisuje kafle bramy `Plains` bezwarunkowo; pin wymaga `tiles[idx] === BTerrain.Gate`
  (`:7770`). Komentarz Operatora uzasadnia: `_carveWallTiles` stawia tam zawsze `Gate` (`:4061-4063`), a wyłom bramy
  zdarza się raz (`gateOpen`). Osiągalnie równoważne; T6 (adapter terenu) musi utrzymać ten niezmiennik — dopisać do
  długu T6.
- U2 `siege_atk_wall_tile` nie ma strażnika `siegeWallCol < 0` z `_attackWallTile` (`:7541`); wołający działa tylko przy
  `siege_wall_col >= 0` (gałąź `:6187`). Równoważne na stanach osiągalnych.

## 6. Długi (zbiorczo, dla orkiestratora)

- #369 (WIRING): F10 — wektor pętli z ≥2 katapultami na tym samym wierszu (trafienie w kafel wyburzony w locie,
  ponowne `wallTileHp.set(row, 0)` i drugi `_breachWallTile`); N2 (kolejność morale `_breachGate` względem timerów o
  tym samym `vNow`, D-B2).
- T6 (ADAPTER): `can_shoot ⇒ range_base >= 2` (Z4); `doctrine.shooting_enabled == !activate.shooting_disabled` (Z5);
  `gate_hp = 400` przy `siege_gate_col >= 0` albo `Option`/tag (N1); kafle bramy = `Gate` przed wyłomem (U1); zasięg
  po zejściu z korony (N3, D-B7).
- K5DOC-T1 / #369: `_setUnitsDoctrine`/`_setGroupDoctrine` (`skirmish`) ustawia oba pola strzelania (Z5).
- REJESTR-RUST (orkiestrator): wpis D-B11 (kanoniczne pole `shootingEnabled`) i decyzje D-B* z 01 §4.

## 7. Werdykt

Zarzuty: 0 × NAPRAW, wszystkie ODDAL (Z1–Z3 zamknięte testami obrony, Z4/Z5/F08/F14 równoważne z dowodem z pinu,
F10 i uwagi jako długi), 0 × DO DECYZJI CZŁOWIEKA (brak gameplay poza webem). Bramki zielone, allowlista czysta,
generator deterministyczny. **PASS-WITH-NOTES** — gotowe do integracji orkiestratora (`b09f83d4b` na
`origin/rust-port/parity-v2`, merge bez konfliktów; po merge'u pełny `cargo test`).

Sprzątanie: `scratchpad/siegeatkb-fc/target` usunięty po bramkach i mutantach.
