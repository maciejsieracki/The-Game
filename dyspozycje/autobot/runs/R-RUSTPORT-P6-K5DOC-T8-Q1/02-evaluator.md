# R-RUSTPORT-P6-K5DOC-T8-Q1 — Evaluator r1 (adwersarialny)

```text
STATUS: FAIL
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5DOC-T8-Q1
GOAL: port _executeGroupDoctrineStep (+ skirmish, defensive, aggressive, bramki siegeDefender/siegeMachineNeverDoctrine,
      wejście _activateUnit :6091) z tekstu pinu 07d2fbd72 do ProdBody; ProdOps::doctrine_step != stałe false;
      tag `doktryna` znika z `unported`.
ZMIANY/COMMIT: oceniany kod: gałąź rust-port-wip/k5doc-t8-q1-r1 @ 03c9824d3 (kod b0231c89e, c6ac55c5d, bced08837),
      baza 47af8dac30e5997eed70d6ba4a58f4ce6d8d4f79 (przodek: potwierdzone merge-base --is-ancestor).
      Evaluator nie zmienia kodu; jedyny zapis = ten raport.
TESTY: fmt EXIT 0; clippy -D warnings EXIT 0; generator odtworzony bajt w bajt; pełny engine EXIT 101
      (533 cele ok, 1 FAILED = B1); mutanty Evaluatora 16: 10 zabitych, 6 przeżyło (1 realna luka, 5 równoważnych/opis)
BLOKADY: Z1 (bramka pełna czerwona — B1 poza allowlistą), Z2 (luka pokrycia: jazda strzelająca)
RUNDY: 1/5
NASTĘPNY KROK: orkiestrator — rozszerzyć allowlistę o 1 asercję (B1), runda r2 Operatora (Z1 + Z2), potem Evaluator r2
DEPLOY/PUSH: NIE WYKONANO
```

## 1. Bramki odtworzone przez Evaluatora

Środowisko: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie
(`k5t8-eval/target`, poza repo; usunięty po bramkach). Kod = HEAD `03c9824d3`.

| Bramka | Wynik |
|---|---|
| `cargo fmt --check` (engine) | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| `node tests/p6_k5doc_t8_gen.mjs` (regeneracja) | MD5 przed = po: `7a782207…` vectors, `38b58b3b…` gate, `92426f6d…` nan; strażnik SHA wycinków przechodzi |
| `--test p6_k5doc_t8` | 6/6 ok (w przebiegu pełnym) |
| pełny `cargo test --all-targets --no-fail-fast` (tło, `setsid nohup`, EXIT w logu) | **EXIT=101**: 533 × `test result: ok`, 1 × `FAILED`: `p6_siege_tactics_loop_body::doktryna_i_mur_sa_poza_zakresem_i_zapisane` (`:311`, `left: []`, `right: [(Attacker 0, "doktryna")]`) |

Wynik pełnej bramki zgadza się co do joty z raportem Operatora (B1). Jedyny `ignored` w całym przebiegu
(`e2e::dump_tick1_econ_for_web_generator`) istnieje na bazie, nie pochodzi z tego tematu. Dysk przed bramką 8,1 GB
(w trakcie spadał do 4,3 GB przez inne workery; bramka doszła do końca).

## 2. Allowlista, zakazy

- `git diff --name-only 47af8dac3..03c9824d3`: `domain/mod.rs` (1 linia `pub mod`), nowy `siege_tactics_doctrine_step.rs`,
  `siege_tactics_loop.rs`, nowe `tests/p6_k5doc_t8.rs`, `p6_k5doc_t8_gen.mjs`, `p6_k5doc_t8_vectors/*`, raport.
  Wszystko w allowliście. `siege_tactics_actions.rs` i `p4_1i3_actions.rs` bez zmian. Wektory/testy r1–r4 bez zmian.
- Brak `#[ignore]` w diffie; brak osłabionych asercji; `git diff --check` czysty; brak trailerów z nazwą modelu.
- „Pliki spoza allowlisty”: Operator NIE ruszył `tests/p6_siege_tactics_loop_body.rs` i zgłosił to jako B1 — zgodnie z D-T8-2.

## 3. Zgodność z tekstem pinu (czytany `git show 07d2fbd72:gra/src/battle/battleScene.ts`)

Sprawdzone linia po linii: `_executeGroupDoctrineStep` `:17966-18084`, `_executeSkirmishDoctrineStep` `:18087-18124`,
`_doctrineMoveDest` `:17931-17963`, `_getEffectiveDoctrine`/`_isUnitDoctrineAuto`/`_effectiveMetaForUnit`
`:17612-17656`, `_ensureGroupMeta` `:17586-17593`, bramki `:6087-6099`, `_advanceStep` `:8198-8285`.
- Kolejność gałęzi `defensive → skirmish → steady(mounted → strzał → _rangedAction → _advanceStep) → aggressive → ogon`
  identyczna; `return true` na każdej ścieżce (`DoctrineStep::returns`).
- `aggressive`: `ru.moveLeft <= 0` z NaN = fałsz (port `u.move_left <= 0.0`) — zgodne; pokryte `vectors_nan.json`.
- `skirmish`: `rangedKite = true` ustawiane przed sprawdzeniem amunicji (`:18091-18092`) — zgodne.
- Punkt zbiórki tylko bez grupy i tylko `steady`/`skirmish` (`:17643-17646`); z grupą meta z `_ensureGroupMeta` bez
  `rallyCol` — port poprawny (cel = `_pickTargetByPriority`).
- Generator wykonuje TEKST pinu (`new Function` na transpilacji wycinków, `expectLine` + `methodEnd` + SHA-256
  wycinków `c8e6b605…`). `_attackFormationRallyPoint`/`_chargeMoveDest` celowo nie wklejone (nieosiągalne, wywołanie = TypeError).
- D-T8-1 (miejsce i kolejność wywołania): maszyna K5H bez zmian, krok liczony z tego samego stanu, wykonywany tylko po
  `U7.0-doctrine`; po kroku brak okrążenia/`_updateFacing` — zgodne z `return` w `:6097`.
- D-T8-3: RNG wstrzyknięty (`CountRolls`), liczba rzutów = liczba `_singleBlow` pinu (sprawdzane w `check_case`).

## 4. Mutanty Evaluatora (własny skrypt, każdy = build + `--test p6_k5doc_t8`; pliki przywrócone, `git status` czysty)

| ID | Mutant | Wynik | Ocena |
|---|---|---|---|
| E01 | `skirmish`: `rangedKite` tylko gdy amunicja | zabity | — |
| E02 | `steady` strzał: cel `_pickAdjacent…` zamiast `_pickRanged…` | zabity | — |
| E03 | pusty `groupId` traktowany jak grupa (`effective_doctrine_of`) | przeżył | równoważny w praktyce: pin nigdy nie przypisuje `groupId = ''` (`:4574`, `:13877`, `:19808` — `null` albo `gid`); uwaga N3 |
| E04 | `_ensureGroupMeta` z `autoPlay = false` | zabity | — |
| E05 | cios z `_advanceStep` także po kroku ruchu | przeżył | równoważny: pin po ruchu sprawdza `_canAttackFrom` w callbacku `_doMove` (`:8223`, `:8277`) i kończy `done()`; gałąź nieosiągalna |
| E06 | `DoctrineStep` bez sprawdzenia `U7.0-doctrine` | przeżył | równoważny: `doctrine_step()` = `returns`, a pin zawsze `return true` |
| E07 | ogon `manual`: cel == pozycja nie odfiltrowany | przeżył | równoważny: ogon nieosiągalny z `_activateUnit` (`manual` odcina `:6096`) — zgodne z nagłówkiem modułu |
| E08 | `aggressive`: sąsiad przed strzałem | zabity | — |
| E09 | `defensive`: jazda → `_cavalryAction` | zabity | — |
| E10 | `skirmish`: punkt zbiórki 3 kolumny | zabity | — |
| E11 | `skirmish`: `isRanged` bez `(range > 1 && canShoot)` | przeżył | równoważny w pinie: `canShoot` ⇒ `rangedBase` (`:1457-1459`), składnik redundantny |
| **E12** | **`steady`: jazda ze strzałem (`canShoot && shootingEnabled`) strzela zamiast `_cavalryAction`** | **przeżył** | **REALNA LUKA (Z2)** |
| E13 | `_ensureGroupMeta` pominięte, gdy krok = `Done` | przeżył | luka pokrycia (N2): brak wektora `unitDoctrine ∈ {defensive, aggressive, skirmish}` + grupa bez wpisu `_groupMeta` + wynik `done()`; obserwowalne w `_groupMeta` po aktywacji (porównywane przez test) |
| E14 | `aggressive`: `moveLeft` stałe 1.0 zamiast stanu tury | zabity | — |
| E15 | `shoots` bez `shootingEnabled` | zabity | — |
| E16 | `skirmish`: `rangedKite` bez bramki `shootingEnabled` | zabity | — |

Mutanty Operatora M01–M25 (raport r1 §5) — nie powtarzane w całości; E02/E04/E08/E14–E16 częściowo je duplikują i
potwierdzają czułość testu.

## 5. Zarzuty

**Z1 (blokujący, bramka).** Pełny `cargo test` EXIT 101: `tests/p6_siege_tactics_loop_body.rs:311` asertuje stary stan
`unported == [(atk0, "doktryna")]`, sprzeczny z GOAL (tag ma zniknąć). Plik poza allowlistą — Operator słusznie go nie
ruszył. Zmiana NIE jest osłabieniem: proponowana przez Operatora podmiana na `unported == []` +
`doctrine_steps == [(atk0, DoctrineAction::AdvanceStep)]` jest silniejsza (sprawdza wykonaną gałąź pinu: `steady` →
`_advanceStep` → `moveLeft <= 0` → `done()`, `:8202`). Wymagane: orkiestrator rozszerza allowlistę o tę jedną asercję
(linie `:300-311`), Operator r2 ją podmienia, pełna bramka EXIT 0.

**Z2 (pokrycie, do naprawy w r2).** Mutant E12 przeżył: żaden wektor nie ma jednostki `mounted` z `canShoot &&
shootingEnabled` w `steady` ani w `aggressive`. Pin kieruje taką jednostkę do `_cavalryAction` PRZED strzałem
(`:17992-17995`, `:18028-18031`). To realne jednostki pinu (`units.json` @07d2fbd72, `Typ: Mount`, zasięg ≥ 2:
„Rydwan egipski” 3, „Konnica łucznicza asyryjska” 2, „Jeździec z oszczepami” 2; `rangedBase = _attackRangeFor(bu) >= 2`,
`:4551`). Wymagane: rodzina/kwota w generatorze (np. `steady-cav` i `aggressive/cav` z `rangedBase`, `ammoLeft > 0`)
i asercja pokrycia, która zabija E12.

## 6. Uwagi (nieblokujące)

- **N1 (dla #369).** `_isUnitDoctrineAuto` pozostaje wejściem adaptera (`activate.doctrine_auto`, D-T8-r1-2), choć ciało
  ma cały stan potrzebny do jego policzenia. Przy `doctrine_auto = false` i domyślnym stanie (`steady`, bez grupy) pin
  wykonałby krok doktryny (D-WIR-9), a ciało idzie gałęziami U7.x bez żadnego tagu — cicha rozbieżność możliwa przy
  niespójnym adapterze. Uzasadnienie (D-T8-2: wektory r1–r4 mają `doctrine_auto = false`) jest prawidłowe dla tego
  tematu, ale orkiestrator powinien wpisać do `REJESTR-RUST.md`, że #369 MUSI liczyć `doctrine_auto` portem
  `is_unit_doctrine_auto` ze stanu ciała (albo asertować zgodność flagi ze stanem).
- **N2.** E13 — dopisać wektor `done()` z grupą bez wpisu `_groupMeta` (niedrogi, zamyka lukę).
- **N3.** E03 — pusty `groupId` nie występuje w pinie; filtr `!g.is_empty()` jest wierny JS (falsy), wektor zbędny.
- **N4.** Liczniki `def_blocked`/`machine_blocked` w `bramki_doktryny_przy_murze_zgodne_z_pinem` liczą przypadki
  kandydujące (auto + mur + strona/machina), a nie zaobserwowaną blokadę; skuteczność sprawdza osobno lista `failures`.
  Nazwy lepiej zmienić np. na `def_przy_murze_auto`/`machina_przy_murze_auto` (wymóg dispatchu: nazwa mówi, co liczy).
- **N5.** Przy murze ciało nadal daje `oblezenie` także atakującemu nie-machinie, który w pinie przeszedłby krok
  doktryny — jawny tag (nie cisza), zakres T1/T2; bramki pokryte na maszynie K5H (`vectors_gate.json`).

## 7. Werdykt

**FAIL** (runda 1/5). Implementacja kroku doktryny jest wierna tekstowi pinu, generator wykonuje tekst pinu i jest
deterministyczny, 10/16 mutantów Evaluatora zabitych, 5 przeżyłych równoważnych (uzasadnione wyżej). Do PASS brakuje:
Z1 (pełna bramka EXIT 0 — wymaga decyzji orkiestratora o allowliście, zmiana nie jest osłabieniem) i Z2 (wektory jazdy
strzelającej, zabicie E12). N2 i N4 zalecane w tej samej rundzie.
