# R-RUSTPORT-P6-K5DOC-T8-Q1 — Final Control r1

```text
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5DOC-T8-Q1
GOAL: port _executeGroupDoctrineStep (+ skirmish, defensive, aggressive, bramki siegeDefender/siegeMachineNeverDoctrine,
      wejście _activateUnit :6091) z tekstu pinu 07d2fbd72 do ProdBody; ProdOps::doctrine_step != stałe false;
      tag `doktryna` znika z `unported`.
ZMIANY/COMMIT: oceniany SHA 5de70e4f1 (gałąź obrona/k5doc-t8-q1-r1; kod b0231c89e, c6ac55c5d, bced08837, 3998fe708);
      baza z dispatchu 47af8dac30e5997eed70d6ba4a58f4ce6d8d4f79 (merge-base --is-ancestor: TAK).
      FC nie zmienia kodu; jedyny zapis = ten raport.
TESTY: fmt EXIT 0; clippy --all-targets -D warnings EXIT 0; generator odtworzony bajt w bajt (3 pliki, MD5 bez zmian);
      pełny cargo test --all-targets --no-fail-fast (setsid nohup, EXIT w logu) EXIT=0, 534 × "test result: ok", 0 FAILED;
      mutanty FC 2/2 zabite.
BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: integracja orkiestratora (uwaga: parity-v2 przesunęło się na 51f36370d — merge-tree bez konfliktów);
      wpis D-T8-N1 do REJESTR-RUST.md (orkiestrator)
DEPLOY/PUSH: NIE WYKONANO
```

## 1. Baza, allowlista, zakazy (zweryfikowane samodzielnie)

- `git merge-base --is-ancestor 47af8dac3 5de70e4f1` = TAK. 7 commitów tematu nad bazą.
- `git diff --stat 47af8dac3 5de70e4f1`: raporty runu (01/02/02a), `domain/mod.rs` (+1 `pub mod`), nowy
  `siege_tactics_doctrine_step.rs`, `siege_tactics_loop.rs`, nowe `tests/p6_k5doc_t8.rs`, `p6_k5doc_t8_gen.mjs`,
  `p6_k5doc_t8_vectors/{vectors,vectors_gate,vectors_nan}.json`, `tests/p6_siege_tactics_loop_body.rs`.
  Wszystko w allowliście + DODATEK r1 (D-T8-4).
- `p6_siege_tactics_loop_body.rs`: diff = dokładnie 1 asercja zmieniona (`unported == []`) + 1 dodana
  (`doctrine_steps == [(atk0, DoctrineAction::AdvanceStep)]`); reszta pliku bez zmian. Zgodne z D-T8-4.
- Bez zmian: `siege_tactics_actions.rs`, `p4_1i3_actions.rs`, wektory/testy r1–r4 (`p6_k5loop_close*`), `Cargo.toml`,
  `Cargo.lock`, `renderer/`, `gra/**`.
- `git diff --check` czysty; brak `#[ignore]` w diffie; brak trailerów `Co-Authored-By` w commitach tematu.
- `grep '"doktryna"'` w `src/`: tag usunięty (ramię `prod_tag` i strażnik `doctrine_auto` w `start`);
  `ProdOps::doctrine_step` zwraca `doctrine_returns` (z `DoctrineStep::returns`), nie stałe `false`.

## 2. Bramki odtworzone przez FC

Środowisko: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`,
`CARGO_TARGET_DIR=<scratchpad>/k5t8-fc/target` (poza repo; usunięty po bramkach). Dysk przed pełną bramką 12 GB.

| Bramka | Wynik |
|---|---|
| `cargo fmt --check` | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| `node tests/p6_k5doc_t8_gen.mjs` | 1840 / 880 NaN / 240 bramek; strażnik SHA wycinków `c8e6b605…` przechodzi; MD5 przed = po: `e11468f6…`, `38b58b3b…`, `92426f6d…`; `git status` czysty |
| pełny `cargo test --all-targets --no-fail-fast` (jedno wywołanie, tło `setsid nohup`, `EXIT=` w logu) | **EXIT=0**, 534 × `test result: ok`, 0 × `FAILED` |
| w tym `p6_k5doc_t8` | 6/6 ok |
| w tym `p6_siege_tactics_loop_body` | 8/8 ok (z `doktryna_i_mur_sa_poza_zakresem_i_zapisane`) |
| w tym `p6_k5loop_close*` (4 cele), `p6_siege*` | ok |

Jedyny `ignored` w przebiegu pochodzi z celów istniejących na bazie (nie z tego tematu).

## 3. Zgodność z pinem (czytane `git show 07d2fbd72:gra/src/battle/battleScene.ts`)

- Bramki `:6087-6099` (`siegeDefenderNeverDoctrine`, `siegeMachineNeverDoctrine`, `_isUnitDoctrineAuto`,
  `meta.doctrine !== 'manual'`, `return` po kroku) — maszyna K5H bez zmian, `doctrine_manual` liczone ze stanu ciała.
- `_getEffectiveDoctrine` `:17612-17619`, `_isUnitDoctrineAuto` `:17621-17630`, `_effectiveMetaForUnit`/`_ensureGroupMeta`
  — port 1:1 (`effective_doctrine`, `is_unit_doctrine_auto`, `ensure_group_meta_of`).
- `_executeGroupDoctrineStep` `:17966-18050`: kolejność `defensive → skirmish → steady(jazda → strzał w zasięgu →
  _rangedAction → _advanceStep) → aggressive(jazda → strzał → sąsiad → moveLeft <= 0 → _advanceStep)` identyczna
  z `siege_tactics_doctrine_step.rs:247-286`.

## 4. Mutanty FC (każdy: build + `--test p6_k5doc_t8`, plik przywrócony, `git status` czysty)

| ID | Mutant | Wynik |
|---|---|---|
| FC1 | `aggressive`: `u.move_left <= 0.0` → `< 0.0` (granica 0) | zabity (`krok_doktryny_zgodny_z_pinem` FAIL) |
| FC2 | `defensive`: pominięty strzał (`if false && shoots`) | zabity (2 testy FAIL) |

Mutanty Evaluatora E01–E16 i Obrony E12/E12a/E13 — wyniki przyjęte (E12/E12a/E13 zabite w obronie); 5 równoważnych
(E03, E05, E06, E07, E11) — uzasadnienia sprawdzone na tekście pinu, przyjęte.

## 5. Orzeczenia zarzutów

| Zarzut | Orzeczenie | Uzasadnienie |
|---|---|---|
| Z1 (pełna bramka czerwona, B1) | **ODDAL** (usunięty) | zmiana wg D-T8-4 dokładnie 1+1 asercja; pełna bramka FC EXIT=0 |
| Z2 (jazda strzelająca, E12) | **ODDAL** (usunięty) | rodziny `steady-cav-shoot`/`aggressive-cav-shoot` (2×120), `at_least(.../cav,120)`; E12/E12a zabite; stare 1540 przypadków bez zmian |
| N1 (`doctrine_auto` jako wejście adaptera) | **DO DECYZJI ORKIESTRATORA (techniczna)** | nie blokuje T8 (wektory r1–r4 mają `false`, D-T8-2); wpis D-T8-N1 (tekst w `02a-obrona.md` §1) do `REJESTR-RUST.md` jako warunek #369 |
| N2 (E13, `_ensureGroupMeta` przy `done()`) | **ODDAL** (usunięty) | rodzina `ensure-done-*` 3×20, E13 zabity |
| N3 (pusty `groupId`) | **ODDAL** | pin nie przypisuje `''`; filtr wierny JS |
| N4 (nazwy liczników) | **ODDAL** (usunięty) | `def_przy_murze_auto_bez_kroku`/`machina_przy_murze_auto_bez_kroku` liczą zaobserwowaną blokadę |
| N5 (`oblezenie` dla nie-machiny przy murze) | **ODDAL** | poza zakresem dispatchu (T1/T2), jawny tag, nie cisza |

Brak zarzutu NAPRAW.

## 6. Uwagi dla integracji

- Dispatch wskazał bazę `47af8dac3`; `origin/rust-port/parity-v2` jest teraz `51f36370d`.
  `git merge-tree --write-tree origin/rust-port/parity-v2 5de70e4f1` = drzewo `06d989c6…` bez konfliktów. Po merge
  orkiestrator powinien powtórzyć pełną bramkę na wyniku (FC zmierzył ją wyłącznie na `5de70e4f1`).
- D-T8-3: czas rzeczywisty i kwantyzacja rAF — NIE_ZMIERZONO (poza zakresem).

## 7. Werdykt

**PASS-WITH-NOTES.** Notatki: N1 (wpis rejestru, orkiestrator) i ponowna pełna bramka po merge na nową głowę parity-v2.
