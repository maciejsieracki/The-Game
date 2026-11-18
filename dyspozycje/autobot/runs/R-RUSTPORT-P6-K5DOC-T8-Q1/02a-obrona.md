# R-RUSTPORT-P6-K5DOC-T8-Q1 — Obrona Operatora po Evaluatorze r1

```text
STATUS: PASS-WITH-NOTES (obrona: wszystkie zarzuty PRZYJĘTE; N1 = wpis rejestru do wykonania przez orkiestratora)
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5DOC-T8-Q1
GOAL: port _executeGroupDoctrineStep (+ skirmish, defensive, aggressive, bramki siegeDefender/siegeMachineNeverDoctrine,
      wejście _activateUnit :6091) z tekstu pinu 07d2fbd72 do ProdBody; ProdOps::doctrine_step != stałe false;
      tag `doktryna` znika z `unported`.
ZMIANY/COMMIT: gałąź obrona/k5doc-t8-q1-r1 (lokalna, bez push), baza 47af8dac30e5997eed70d6ba4a58f4ce6d8d4f79,
      na raporcie Evaluatora 112bbe0b6 (kod Operatora b0231c89e, c6ac55c5d, bced08837).
      Commit kodu obrony: 3998fe708; raport obrony: SHA w commicie raportu (podany w odpowiedzi Workflow).
      Pliki: tests/p6_siege_tactics_loop_body.rs (D-T8-4: 1 asercja zmieniona + 1 dodana),
      tests/p6_k5doc_t8.rs, tests/p6_k5doc_t8_gen.mjs, tests/p6_k5doc_t8_vectors/vectors.json. Kod src/ bez zmian.
TESTY: fmt --check EXIT 0; clippy --all-targets -D warnings EXIT 0; p6_k5doc_t8 + p6_siege_tactics_loop_body ok;
      p6_k5loop_close* + p6_siege* + p6_k5doc_t8 (45 celów) EXIT 0; pełna bramka EXIT=0 (534 ok, 0 FAILED, sekcja 2);
      mutanty E12 (steady), E12a (aggressive), E13 — zabite.
BLOKADY: brak (N1 wymaga wpisu w dyspozycje/rust-port/REJESTR-RUST.md — plik poza allowlistą, tekst w §1 N1)
RUNDY: 1/5 (obrona po Evaluatorze r1)
NASTĘPNY KROK: Final Control
DEPLOY/PUSH: NIE WYKONANO
```

## 1. Odpowiedzi na zarzuty

### Z1 (blokujący) — PRZYJMUJĘ

Wykonane dokładnie wg DODATKU r1 dispatchu (D-T8-4). `git diff 112bbe0b6 3998fe708 -- rust-port/engine/tests/p6_siege_tactics_loop_body.rs`:

```diff
-    assert_eq!(body.unported, vec![(atk0(), "doktryna")]);
+    assert_eq!(body.unported, vec![]);
+    assert_eq!(
+        body.doctrine_steps,
+        vec![(
+            atk0(),
+            civ_engine::domain::siege_tactics_doctrine_step::DoctrineAction::AdvanceStep
+        )]
+    );
```

1 asercja zmieniona, 1 dodana; ścieżka typu pełna, żeby nie dotykać importów pliku. Pozostałe asercje pliku (w tym
`hp == 50.0` i część z murem `oblezenie`) bez zmian. Asercja jest silniejsza od starej: sprawdza wykonaną gałąź pinu
(`steady` → `_advanceStep` → `moveLeft <= 0` → `done()`, `battleScene.ts:8202`). Dowód: `p6_siege_tactics_loop_body`
8/8 ok (w tym `doktryna_i_mur_sa_poza_zakresem_i_zapisane`).

### Z2 (pokrycie, mutant E12) — PRZYJMUJĘ

Generator (`p6_k5doc_t8_gen.mjs`) dostał dwie rodziny dopisane PO wszystkich istniejących (wcześniejsze rzuty `rnd`
nie zmieniają się):
- `steady-cav-shoot` (120) i `aggressive-cav-shoot` (120): jednostka `mounted = true`, `rangedBase = true`,
  `ammoLeft ∈ {Infinity, 1, 2, 5}`, zasięg 2–3, `shootingEnabled` domyślne (≠ false) — profil Rydwanu egipskiego (3),
  Konnicy łuczniczej asyryjskiej (2), Jeźdźca z oszczepami (2). Pin (wykonany TEKST, ten sam strażnik SHA wycinków
  `c8e6b605…`) daje we wszystkich 240 wektorach gałąź `cav` (`:17992-17995`, `:18028-18031`; generator rzuca błąd przy
  innej gałęzi). Pole `rangedAtStart` = `_pickRangedTargetByPriority(ru)` (`:17571`, osobna uprząż, bez `rnd`) przed
  aktywacją: cel strzału w zasięgu w 75 (steady) i 77 (aggressive) wektorach.
- Test `krok_doktryny_zgodny_z_pinem`: liczba wektorów 1540 → 1840; `at_least("{rodzina}/cav", 120)` dla obu rodzin
  oraz licznik `shooters_in_range >= 60` (jazda + `rangedBase` + amunicja > 0 + brak `shootingEnabled=false` +
  `rangedAtStart`), liczony w Rust z wektora.

Mutanty (skrypt `k5t8-obr/mut.py`, plik przywracany po każdym, `git status` czysty po serii):

| ID | Mutant | Wynik |
|---|---|---|
| E12 | `steady`: `if u.mounted && !shoots` (jazda strzelająca strzela przed `_cavalryAction`) | zabity: 564 rozbieżności |
| E12a | `aggressive`: strzał przed `if u.mounted` | zabity: 366 rozbieżności |

Stare wektory bez zmian: pierwsze 1540 przypadków nowego `vectors.json` identyczne (porównanie JSON przypadek po
przypadku: 1540/1540) z poprzednią wersją, `cavMult` identyczne; `vectors_nan.json` (`92426f6d…`) i `vectors_gate.json`
(`38b58b3b…`) bajt w bajt (te same MD5). Nowy `vectors.json` MD5 `e11468f624bd47a41e0071df2a064c36`; regeneracja
deterministyczna (`node rust-port/engine/tests/p6_k5doc_t8_gen.mjs`, ~2 s).

### N1 (dla #369) — PRZYJMUJĘ (wpis w rejestrze należy do orkiestratora)

Zgadzam się z ustaleniem. `dyspozycje/rust-port/REJESTR-RUST.md` jest poza allowlistą tego tematu, a decyzje techniczne
wpisuje orkiestrator — proponowany tekst wpisu:

> **D-T8-N1 (K5DOC-T8 → #369 K5LOOP-WIRING):** w ProdBody `_isUnitDoctrineAuto` (`battleScene.ts:17621-17630`) jest
> wejściem adaptera `activate.doctrine_auto` (D-T8-r1-2; wektory r1–r4 mają `false`). Przy `doctrine_auto = false` i
> domyślnym stanie (`steady`, bez grupy) pin wykonałby krok doktryny (D-WIR-9), a ciało idzie gałęziami U7.x bez tagu.
> #369 MUSI liczyć `doctrine_auto` portem `is_unit_doctrine_auto` ze stanu ciała (`unit_doctrine`, `group_id`,
> `_groupMeta`) albo asertować zgodność flagi adaptera z tym portem.

### N2 (mutant E13) — PRZYJMUJĘ

Dopisana rodzina `ensure-done-{defensive,aggressive,skirmish}` (po 20): `unitDoctrine` = doktryna, `groupId = 'gE'`
bez wpisu w `_groupMeta`, krok kończy `done()` (gałąź `none`); generator sprawdza, że pin po aktywacji ma wpis `gE`
(`_effectiveMetaForUnit` `:17636` → `_ensureGroupMeta` `:17586`). Test: `at_least("ensure-done-{d}/none", 20)`.
Mutant E13 (`ensure_group_meta_of` pominięte przy `DoctrineAction::Done`): zabity, 60 rozbieżności `_groupMeta`.

### N4 — PRZYJMUJĘ

`bramki_doktryny_przy_murze_zgodne_z_pinem`: `def_blocked` → `def_przy_murze_auto_bez_kroku`, `machine_blocked` →
`machina_przy_murze_auto_bez_kroku`; oba liczniki liczą teraz ZAOBSERWOWANĄ blokadę (warunek kandydujący `&& !called`,
gdzie `called` = `doctrine_step` wołany i zdarzenie `DoctrineStep`). Progi bez zmian (30, 15); komunikaty asercji
mówią, co jest liczone. Test ok.

### Mutanty równoważne E03, E05, E06, E07, E11 — bez zarzutu, uzasadnienia Evaluatora przyjmuję bez uwag.

## 2. Bramki obrony

Środowisko: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`,
`CARGO_TARGET_DIR=<scratchpad>/k5t8-obr/target` (poza repo, usunięty po bramkach).

| Bramka | Wynik |
|---|---|
| `cargo fmt --check` | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| `--test p6_k5doc_t8 --test p6_siege_tactics_loop_body` | 6/6 + 8/8 ok |
| `p6_k5loop_close*` + `p6_siege*` + `p6_k5doc_t8` (45 celów, `--no-fail-fast`) | EXIT 0, 45 × `test result: ok` |
| pełny `cargo test` (tło, `setsid nohup`, EXIT w logu; partie) | **EXIT=0**: 534 × `test result: ok`, 0 × `FAILED` (lib/bins/benches + 532 cele `tests/*.rs`, 9 partii po 60, każda EXIT 0); jedyny `ignored` = `e2e::dump_tick1_econ_for_web_generator` (istnieje na bazie) |

Uwaga dysk: przed pełną bramką wolne 6,4 GB (< 8 GB z dispatchu; zajęte przez inne workery, nic z tego tematu do
usunięcia). Żeby nie przepełnić dysku, pełna bramka szła partiami w jednym skrypcie w tle: `--lib --bins --benches`,
potem wszystkie 532 pliki `tests/*.rs` w partiach po 60 (`--test …`), z usunięciem binarek testów partii po jej
przebiegu. Zakres = `--all-targets` (lib, bins, benches, tests; crate nie ma examples).

Target `k5t8-obr/target` usunięty po bramkach (dysk po: 7,7 GB wolne).
