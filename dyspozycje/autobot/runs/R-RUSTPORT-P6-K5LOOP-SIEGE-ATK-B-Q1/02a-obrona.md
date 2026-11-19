# R-RUSTPORT-P6-K5LOOP-SIEGE-ATK-B-Q1 — Obrona r1 (Operator)

```text
STATUS: PASS (obrona: 4 zarzuty PRZYJĘTE z poprawką, 1 zarzut ODRZUCONY z dowodem, decyzja Z5 zapisana)
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5LOOP-SIEGE-ATK-B-Q1 (T2b)
GOAL: odpowiedź na zarzuty Evaluatora r1 (02-evaluator.md, f24f1a418)
ZMIANY/COMMIT: gałąź rust-port-wip/siege-atk-b-q1-obr (od f24f1a418 = raport Evaluatora nad 8c86f90b3);
              testy 6d6352651; raport: osobny commit tego pliku. Kod produkcyjny BEZ ZMIAN (jedynie nowy moduł #[cfg(test)]).
TESTY: fmt EXIT 0; clippy --all-targets -D warnings EXIT 0; 10 celów bramki EXIT 0 (9/7/10/8/2/8/7/6/9/9);
       pełny cargo test --all-targets --no-fail-fast EXIT 0 (539 binarek, 4068 ok, 0 FAIL, 1 ignored istniejący); mutanty Evaluatora powtórzone: E06, E11, E14, E21, E22 ZABITE,
       E01, E02 przeżywają (uzasadnione niżej)
BLOKADY: brak
RUNDY: 1/5 (obrona)
NASTĘPNY KROK: Final Control (albo Operator r2, jeśli FC uzna Z4/Z5 za niewystarczające)
DEPLOY/PUSH: NIE WYKONANO
```

Baza oceny: `8c86f90b3` (kod `31e6bced5`), baza tematu `25ce36748` = `origin/rust-port/parity-v2`. Pin web `07d2fbd72`
(`git show`, `gra/` nietknięte). Allowlista: wyłącznie `src/domain/siege_tactics_loop.rs` (nowy moduł testowy na końcu
pliku), `tests/p6_k5loop_siege_atk_b.rs`, `tests/p6_k5loop_siege_atk_b_gen.mjs`, nowy
`tests/p6_k5loop_siege_atk_b_vectors/vectors_retreat.json`, ten raport. Bez `#[ignore]`, bez `Co-Authored-By`.

## Z1 (E06) — synchronizacja `body.wall_ever_breached()` → `env.wall_ever_breached` bez testu — PRZYJMUJĘ

Poprawka: nowy test `sterownik_przejmuje_wylom_bramy_z_ciala_bez_akcji_wallbreach` (`tests/p6_k5loop_siege_atk_b.rs`).
Ciało-atrapa `GateBreachBody` odwzorowuje `_attackGate` → `_breachGate` (`battleScene.ts:7757-7759`: `gateOpen = true;
wallEverBreached = true`): ustawia flagę ciała synchronicznie w aktywacji atakującego, BEZ akcji `WallBreach` (brama nie
jest kaflem `wallTileHp`). Jedyną drogą do sterownika jest więc `drain_body` (`siege_tactics_loop.rs:665-667`).

Asercje: `sl.env.wall_ever_breached == true`; `wall_tile_rows` bez zmian `[4,5,6]`; brak akcji `WallBreach`; skutek w
sterowniku (`_roundCapVerdict`, `battleScene.ts:9449-9464`, `siege_no_breach.rs:69-93`): bliźniak bez wyłomu z
`no_breach_cap = 2` kończy się `FfStop::Finished`, zwycięzca `remis`, `round_no == 2`; z wyłomem bramy bitwa trwa
(`FfStop::StepLimit` przy 4000 krokach, brak zwycięzcy, `round_no > 2 × 2`; zmierzone: 115).

Dowód: mutant E06 (usunięte `self.env.wall_ever_breached = true` w `drain_body`) — ZABITY
(`sterownik_przejmuje_wylom_bramy_z_ciala_bez_akcji_wallbreach ... FAILED`), log `scratchpad/siegeatkb-obr/mut.log`.

## Z2 (E21, E22) — `PlainsCell` sprawdzana tylko pod kątem przejezdności — PRZYJMUJĘ

Poprawka: moduł `plains_cell_tests` (`#[cfg(test)]`, koniec `siege_tactics_loop.rs`), 2 testy:
- `wyburzony_kafel_jest_rownina_jak_pin`: nakładka nad terenem „najgorszym” (nieprzejezdny, koszt 3, bród, mnożnik jazdy 2):
  na wyburzonym polu `passable`, `move_cost == 1` (`MOVE_COST[Plains] = 1`, `battle-terrain.ts:139`, `:795`
  `moveCost: (c, r) => MOVE_COST[at(c, r)] ?? 1`), `is_ford == false` (`isFordTile` `battleScene.ts:1897`
  = `tm.at(c, r) === BTerrain.Ford`, a po `tiles[idx] = BTerrain.Plains` (`:7644`, `:7770`) `at` zwraca `Plains`);
  mnożnik jazdy z warstwy niżej; pola sąsiednie bez zmian; podwójna nakładka (kafle bramy `gr-1`, `gr`, `:7768-7772`).
- `krok_przez_wyburzony_kafel_placi_koszt_rowniny`: koszt kroku `_doMove` przez `unit_move_cost` (= `_moveCostForUnit`
  `:7436-7444`): piechota 1, jazda `1 × mnożnik`, pole obok `Infinity`.

Uzasadnienie formy (test jednostkowy zamiast wektora z ruchem): wektor pinu to jedna aktywacja; aktywacja, która wyburza
kafel, kończy się w pinie na `_attackWallTile`/`_attackGate` (`done()`), więc nikt w niej nie wchodzi na wyburzone pole.
Ruch przez wyburzony kafel w tej samej bitwie wymaga drugiej aktywacji (sterownik, #369). Test sprawdza tę samą semantykę
pinu wprost: `tiles[idx] = Plains` NADPISUJE typ kafla, więc koszt i bród na tym polu są kosztem i brodem równiny
niezależnie od warstwy niżej. Stub generatora (`terrainMapOf`) tego nie rozróżnia (kolumna muru nigdy nie jest brodem),
dlatego teren „najgorszy” jest konieczny, żeby E22 był obserwowalny.

Dowód: E21 (`1.0 → 2.0`) — ZABITY (oba testy); E22 (bez `!self.hit(...)` w `is_ford`) — ZABITY
(`wyburzony_kafel_jest_rownina_jak_pin`).

## Z3 (E14, E11) — `_breachWallTile`: pętla `dc = 3` i obrońca `fadingOut` niepokryte — PRZYJMUJĘ

Poprawka: generator dopisuje rodzinę `retreat` (ziarno `SEED + 3`, osobny plik `vectors_retreat.json`, 90 przypadków).
Pliki `vectors.json`, `vectors_nan.json`, `vectors_edge.json` po regeneracji IDENTYCZNE bajt w bajt (SHA-256 przed i po:
`dbbd1b35…cadbd`, `06aed7af…47285`, `c47c5c5b…e773b`); strażnik SHA wycinków pinu `489ddf8e…1699` bez zmian.
- (a) `retreat-dc3` (60): scenariusz `makeCase('cata')`, kafle HP 1; wiersz wyłomu `wr` z pierwszego wykonania pinu; na
  `(W, wr)` obrońca piechoty na koronie; pola `dc = 1, 2` × `dr = 0..2` (oba kierunki, `clamp`) zajęte albo
  nieprzejezdne; pin wykonany ponownie — to jego wynik jest wektorem (o polu decyduje `dc = 3`, `:7719`).
- (b) `retreat-fading` (30): obrońca `fadingOut` na wyburzonym kaflu (`:7698` `continue`): zostaje na polu i na koronie.
- Liczniki (`stats` pliku): `retreatDc3 = 60`, `retreatSkipFading = 30`.

Test `zgodnosc_z_pinem_odwrot_z_muru`: pełne porównanie każdego przypadku z pinem (`check_case`, strażnik 90 s),
`wall-breach >= 90`, liczniki przeliczone w Rust z wektora i równe licznikom generatora, `retreatDc3 >= 30`,
`retreatSkipFading >= 15`. Plik dołączony też do `brak_tagow_oblezniczych_dla_atakujacego`.

Dowód: E14 (`dc` `1..=2`) — ZABITY; E11 (odwrót bez pominięcia `fading_out`) — ZABITY (oba w
`zgodnosc_z_pinem_odwrot_z_muru`).

## Z4 (E02) — filtr `d.rangeBase <= 0` w `_siegeShooterThreats` — ODRZUCAM (nieosiągalne w pinie; dowód)

Wymagane „albo jawne uzasadnienie nieosiągalności z dowodem z pinu” — dowód:
1. `canShoot(ru) = ru.rangedBase && ru.ammoLeft > 0` (`battleScene.ts:1457-1459`), więc obrońca z `canShoot` ma
   `rangedBase === true`.
2. `rangeBase` i `rangedBase` są ustawiane razem przy tworzeniu jednostki i NIGDY potem przypisywane (`grep` pinu: brak
   przypisań `rangeBase =`/`rangedBase =` poza literałami obiektów):
   - `:4549-4551` (`_placeUnits`): `rangeBase: this._attackRangeFor(bu)`, `rangedBase: this._attackRangeFor(bu) >= 2`;
   - `:4707-4709` (`_placeSiegeDefenders`, korona): katapulta `rangeBase = max(_attackRangeFor, 6) >= 6`,
     `rangedBase = true`; inni `rangedBase = _attackRangeFor(bu) >= 2`, `rangeBase = _attackRangeFor(bu)`;
   - `:5460-5462` (`attackRange(bu)`, `rangedBase = isRanged(bu) = attackRange(bu) >= 2`);
   - `:17237-17239` (jak `:4549`).
   We wszystkich miejscach `rangedBase === true ⇒ rangeBase >= 2` (katapulta `>= 6`). `NaN` nie daje wyjątku:
   `_attackRangeFor` (`:7522-7527`) zwraca `0` albo `Math.max(1, …)`, a `rangedBase = NaN >= 2 = false`.
3. Zatem `canShoot(d) && d.rangeBase <= 0` jest w pinie stanem nieosiągalnym; mutant E02 (`range_base := 1.0` w
   `siege_move_refused_now`) jest równoważny na stanach osiągalnych (`rangeBase >= 2 > 0` → filtr i tak przepuszcza;
   zasięg zagrożenia liczy domknięcie `_applyTerrainRange` z `activate.range`, nie z `range_base`).
4. Sama gałąź filtra (funkcja `siege_shooter_threats`, `siege_tactics_approach.rs:122`, temat K1) JEST pokryta
   wektorami pinu K1: `p6_siege_tactics_approach_vectors/vectors.json` ma 76 obrońców `canShoot` z `rangeBase <= 0`
   (żywych), z czego 41 z `terrainAfter >= 1` — przy usuniętym filtrze trafiliby do zagrożeń (zmierzone skryptem).
Dług T6 (adapter): niezmiennik wejścia `can_shoot ⇒ range_base >= 2` (`>= 6` dla katapulty na koronie) — zapisany w §6.

Powtórka mutanta: E02 PRZEŻYWA (oczekiwane; równoważny).

## Z5 (E01, uwaga) — dwa źródła `shootingEnabled` — PRZYJMUJĘ (decyzja w raporcie; kod bez zmian)

Pin ma JEDNO pole `ru.shootingEnabled` (`:2032`), czytane przez `_activateUnit` (`:6241`), `_siegeApproachRestricted`
(`:7954`), `_trySiegeTowerClimb` (`:8090`) i krok doktryny (`:17971-18091`). Zmieniają je wyłącznie komendy UI poza
aktywacją: `_applySkirmishFlagsForUnit` (`:17658-17662`, z `_setUnitsDoctrine` `:17671`) i `_applySkirmishFlags`
(`:17817-17825`, z `_setGroupDoctrine` `:17880`) — ustawiają `true`. Inicjalizacja `true` (`:4573`, `:4719`, `:5488`,
`:17261`).

DECYZJA (techniczna, do `REJESTR-RUST.md` przez orkiestratora, D-B11): kanonicznym polem `ru.shootingEnabled` jest
`ActivateUnit::shooting_disabled` (negacja), bo czyta je `_activateUnit` ciała (`siege_tactics_loop.rs:4987`) dokładnie tak
jak pin `:6241`; `ProdBody::doctrine[..].shooting_enabled` jest projekcją tego samego pola dla kroku doktryny. Niezmiennik
`doctrine.shooting_enabled == !activate.shooting_disabled` musi utrzymywać adapter T6 (wejście z jednego `ru.shootingEnabled`)
i port komend UI `_setUnitsDoctrine`/`_setGroupDoctrine` (K5DOC-T1/#369: przy `skirmish` ustawić OBA). Przy zachowanym
niezmienniku `!doctrine.shooting_enabled || activate.shooting_disabled` jest równe każdemu z członów, więc E01 jest
równoważny na stanach osiągalnych; alternatywa w `siege_move_refused_now` zostaje jako zachowawcze złączenie (nie zmienia
wyniku przy niezmienniku). Powtórka: E01 PRZEŻYWA (oczekiwane). Dług zapisany w §6.

## Uwagi N1–N4 (nie blokujące) — PRZYJMUJĘ do długów

- N1 (`gate_hp` domyślnie `0.0`): PRZYJMUJĘ jako dług T6 — adapter MUSI podać `gate_hp = 400` z `_carveWallTiles`
  (`:4061-4063`) przy `siege_gate_col >= 0`; zalecenie Evaluatora (`Option`/jawny tag braku jak `siege_stats`) przekazuję
  do T6 (zmiana typu poza zakresem obrony: kod bez zmian).
- N2 (D-B2, kolejność morale `_breachGate` vs timer o tym samym `vNow`): PRZYJMUJĘ. Korekta zdania z 01 §4 D-B2: „między
  wyłomem a pętlą morale w pinie nie ma innego kodu” jest prawdą w pinie, ale w sterowniku Rust timer zegara o tym samym
  `vNow` (np. trafienie wieży `_schedule(180)`) może się wykonać PRZED `complete` (morale), a w pinie PO pętli morale.
  Dopisane do długu #369 (§6).
- N3 (D-B7, zasięg po zejściu z korony): przyjęte przez Evaluatora; dług T6 bez zmian.
- N4 (tag `doktryna-rozkaz-ruchu`): dopisuję jawnie do kryterium zamknięcia: dla strony `atk` przy `siege_wall_col >= 0`
  `prod_tag`/`unported` nie zawiera żadnego tagu oblężniczego; dopuszczalne są wyłącznie tagi wejścia adaptera
  (`*-brak-terenu`, `*-bez-szablonu`) ORAZ istniejący przed T2b tag `doktryna-rozkaz-ruchu` (K5EXEC-T3, rozkaz ruchu z
  kroku doktryny; nie jest tagiem oblężniczym). Test `brak_tagow_oblezniczych_dla_atakujacego` sprawdza dokładnie tę listę.

## 6. Długi (uzupełnienie 01 §8)

- T6 (ADAPTER): niezmienniki wejścia `can_shoot ⇒ range_base >= 2` (katapulta korony `>= 6`) [Z4];
  `doctrine.shooting_enabled == !activate.shooting_disabled` z jednego `ru.shootingEnabled` [Z5]; `gate_hp = 400`
  przy `siege_gate_col >= 0` albo `Option`/jawny tag [N1].
- K5DOC-T1 / #369: port `_setUnitsDoctrine`/`_setGroupDoctrine` (`skirmish`) ustawia oba pola strzelania [Z5].
- #369 (WIRING): kolejność morale `_breachGate` względem timerów zegara o tym samym `vNow` (D-B2) [N2].

## 7. Bramki (`rust-port/engine`, `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, target `scratchpad/siegeatkb-obr/target`)

| Bramka | Wynik |
|---|---|
| `node tests/p6_k5loop_siege_atk_b_gen.mjs` (Node 22.23) | strażnik SHA zgodny; 3 stare pliki identyczne bajt w bajt; nowy `vectors_retreat.json` (90) |
| `cargo fmt --check` | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| 10 celów z dispatchu (`p6_k5loop_siege_atk_b` … `bridge_contract`) | EXIT 0: 9/7/10/8/2/8/7/6/9/9 |
| `cargo test --lib plains_cell` | 2/2 |
| mutanty (`scratchpad/siegeatkb-obr/mut.py`, `mut.log`) | E06, E11, E14, E21, E22 ZABITE; E01, E02 przeżywają (równoważne, Z4/Z5) |
| pełny `cargo test --all-targets --no-fail-fast` (tło, `setsid nohup`) | EXIT 0: 539 binarek, 4068 passed (= 4064 z r1 + 4 nowe), 0 failed, 1 ignored (istniejący) |
