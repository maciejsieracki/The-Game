# R-RUSTPORT-P6-K5LOOP-MARCH-INCREMENTAL-Q1 — Final Control r1

```text
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5LOOP-MARCH-INCREMENTAL-Q1 (klasa A z PIN3: marsz krok po kroku; c1 118/196/221)
GOAL: c1 118/196/221 bajt w bajt z pinem 07d2fbd72 @1 i @16 ms; decyzja kroku marszu w chwili kroku;
      ROZBIEZNE_B_WIRA_PIN_3 pusta; dawne wektory bez zmian; mutanty >= 20 (marsz atomowy = FAIL)
ZMIANY/COMMIT: oceniany stan feaf4bb40 (kod Operatora 13a0d2f95 + testy Obrony 2e2b8c5a6), baza 3e5db0673;
               FC dodaje tylko ten raport (commit nad feaf4bb40, gałąź lokalna march-inc-fc)
TESTY: §2 (wszystkie bramki odtworzone samodzielnie, EXIT 0), §3 (128/128 @1 i @16), §4 (mutant A1)
BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: integracja orkiestratora (merge na parity-v2 + pełny cargo test na wyniku merge'a)
DEPLOY/PUSH: NIE WYKONANO
```

## 1. Baza, zakres, allowlista (sprawdzone samodzielnie)

- `merge-base(feaf4bb40, origin/rust-port/parity-v2) = 3e5db0673` = linia BAZA dispatchu; `git merge-base --is-ancestor 3e5db0673 feaf4bb40` OK.
- `git diff --stat 3e5db0673 feaf4bb40`: 9 plików, wszystkie na allowliście: `siege_tactics_loop.rs` (+1458/−98),
  `siege_battle_session.rs` (+3: `body.march_incremental = true` + komentarz), `p6_k5loop_wiring_a_gen.mjs` (+17, same dopiski),
  `p6_k5loop_wiring_a_pin.rs` (+15/−9), `p6_k5loop_wiring_a_pin_vectors/vectors.json` (+3608/−0), raporty i skrypt mutantów w `runs/`.
  Nie ruszono: `bridge.rs`, `siege_battle_apply.rs`, `city_capture_apply.rs`, `playable.rs`, `siege_surrender.rs`,
  `siege_transfer*.rs`, `client`, `renderer`, `src-tauri`, `gra/`, `Cargo.*`.
- Generator: diff = 3 scenariusze `mi_*` + diagnostyka `WALK` aktywna tylko w trybie śladu; strażnik SHA pinu nietknięty.
- Wektory: porównanie JSON baza ↔ head (skrypt FC): 42 → 45, **0 zmienionych**, nowe tylko `mi_las_mix_d3l_palisada_118`,
  `mi_gory_lucz2_d5_palisada_196`, `mi_rown_lucz2_d3l_mury_221`; metadane (`pin`, `pinSha256`, `frameMs`) bez zmian.
  MD5 `vectors.json` `dae3e46efdffe94061347f93e7fc1038`, `pin_data.json` `432eed76e34a0e8cc96ec548e88eae64` — zgodne z raportami.
- Test: `ROZBIEZNE_B_WIRA_PIN_3: [&str; 0] = []`; asercje nieosłabione (dodana asercja obecności `DAWNA_KLASA_A`).
- `#[ignore]`: brak nowych. `git diff --check 3e5db0673 HEAD`: czysto. Trailery wszystkich 9 commitów: wyłącznie `Claude-Session:`.

## 2. Bramki (worktree FC, checkout feaf4bb40, `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`,
target `scratchpad/march-inc-fc-target`, usunięty po bramkach; logi `scratchpad/march-inc-fc-*.log`)

| Bramka | Wynik |
|---|---|
| `cargo fmt --all -- --check` | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| `cargo test --all-targets --no-fail-fast` (engine, profil dev, w tle `setsid nohup`) | **EXIT 0**: 553 × `test result: ok`, **4240 passed / 0 failed / 1 ignored** (ignorowany spoza diffu). W tym `p6_k5loop_wiring_a_pin` (`wektory_pinu_pelnej_bitwy_bajt_w_bajt` ok), `p6_k5loop_wiring_a` (`zlote_wyniki_sesji`, `czas_rzeczywisty_niezalezny_od_podzialu_krokow` ok), `p6_k5loop_wiring_b*`, `bridge_contract`, `p6_zdobycie_miasta_a*`/`_b*`, `march_incremental_tests` 16/16 |

Różnica 4240 (FC, dev) vs 4237 (Obrona, release) — inny profil (testy zależne od `debug_assertions`); 0 failed w obu.

## 3. Kandydaci c1 (128; pliki pinu `c128_1_pin.json` MD5 `ed9a3c98…`, `c128_16_pin.json` MD5 `307d5942…`, identyczne z kopiami PIN3; `pinSha256` sprawdzany przez test)

Binarka `p6_k5loop_wiring_a_pin` z bramek FC, test `kandydaci_z_pliku_na_zadanie`:

| Klatka | Zgodne | 118 / 196 / 221 |
|---|---|---|
| @1 ms | **128/128** | ZGODNY / ZGODNY / ZGODNY |
| @16 ms | **128/128** | ZGODNY / ZGODNY / ZGODNY |

@32 ms (FQ-SPEED, poza zakresem): nie mierzone przez FC (NIE_ZMIERZONO); Operator podaje 127/128 (155).

## 4. Mutant „marsz atomowy” (A1) — odtworzony przez FC

`siege_battle_session.rs`: `body.march_incremental = false` → `wektory_pinu_pelnej_bitwy_bajt_w_bajt` **FAIL** dokładnie na 6 wektorach
(`a3_*_klatka1` ×3 i `mi_*` ×3; np. 118: `tura 51 != 53; rzuty 79 != 93`). Źródło przywrócone (`git checkout`, drzewo czyste).
Pozostałe mutanty (24 Operatora + 10 Evaluatora) przyjmuję na podstawie logów raportów; po Obronie wszystkie zabite albo jawnie
równoważne (A9, A17, E1 — uzasadnienia z tekstu pinu sprawdzone w §5).

## 5. Zgodność z pinem (web najpierw, `git show 07d2fbd72:gra/src/battle/battleScene.ts`)

Przeczytane: `_advanceStep` `:8198-8285`, `_rangedForwardStep` `:6776-6809`, KITE `_rangedAction` `:6695-6741`. Kod
`advance_enter`/`advance_step_end`/`ranged_action_enter`/`ranged_forward_enter`/`ranged_step_end`/`march_fire` odpowiada pinowi:
preludia (`finished`, `dead||fadingOut`, `moveLeft<=0`; NaN przechodzi), callback C-FLANK bez `lastAutoMoveFrom`, callback czołowy
`lastAutoMoveFrom = previousPosition` przed `finished`, wejście z przerwy → `_rangedForwardStep` / `_advanceStep`, wejście w zasięg po
kroku → `_rangedAction` od nowa, KITE: `_rangedTargetInRange ?? meleeThreat` z bieżącymi flagami. Ustalenie Operatora, że klasa A
idzie przez `_advanceStep`/`_rangedForwardStep`, a nie `_siegeWalkTo` (wskazany w dispatchu), jest poprawne i jawne.

## 6. Sprawdzenie integracyjne (informacyjnie, dla orkiestratora)

`origin/rust-port/parity-v2` przesunęła się od bazy (`a6401da9f`; zmienia m.in. `p6_k5loop_wiring_a_pin.rs` +108 — HITAT, oraz
`siege_battle_apply.rs`, `bridge.rs`). `git merge-tree --write-tree origin/rust-port/parity-v2 feaf4bb40` = **bez konfliktów**
(drzewo `d8be7032d`). Na tymczasowym commicie merge'a (nieopublikowany, worktree wrócił na feaf4bb40) FC uruchomił:
`p6_k5loop_wiring_a_pin` 10/10 (w tym HITAT `kontrakt_czasu_ciosu_po_krokach_advance_step` i `wektory_pinu_pelnej_bitwy_bajt_w_bajt`),
`p6_k5loop_wiring_a` 22/22, `p6_k5loop_wiring_b` 15/15, `p6_k5loop_wiring_b_pin` 2/2, `bridge_contract` 10/10, `p4_1i6_dlugi` 18/18,
`p6_kapitulacja` 15/15. Pełny `cargo test` na wyniku merge'a = obowiązek integracji (NIE wykonany przez FC).

## 7. Zarzuty i orzeczenia

| # | Zarzut (źródło) | Orzeczenie | Uzasadnienie |
|---|---|---|---|
| 1 | Z1–Z5 luki testów (Evaluator E3/E5/E7/E8/E10) | **ODDAL** (zamknięte) | Obrona dodała 5 testów lib (`2e2b8c5a6`, tylko `#[cfg(test)]`); `march_incremental_tests` 16/16 w bramce FC |
| 2 | E1 `raf_pending` LIFO przeżywa | **ODDAL** (równoważny) | Argument z kodu (najwyżej jeden klocek klasy raf przy sekwencyjnych aktywacjach) + sonda 0/≈374 tys. wstawień do niepustej kolejki |
| 3 | A9, A17 równoważne (Operator) | **ODDAL** | Uzasadnienia z tekstu pinu sprawdzone (Evaluator i FC, `:6709-6713`, `_rangedTargetInRange`) |
| 4 | Dispatch wskazywał `_siegeWalkTo`, temat zamknął `_advanceStep`/`_rangedForwardStep` | **ODDAL** | Ślad pinu `WALK` pokazuje właściwe metody; GOAL (bajt w bajt 118/196/221) spełniony; reszta marszy jawnie jako dług |
| 5 | Strzał z pierwszego wejścia `_rangedAction` w marszu — brak wektora pinu (Z3) | **ODDAL** (dług) | Pokryte testem lib; brak ścieżki w 45 wektorach i 256 kandydatach = NIE_ZMIERZONO na pinie, zapisane jako dług |
| 6 | N1 jeden slot `ProdBody::march` | **ODDAL** (dług) | Aktywacje sekwencyjne w obecnym zakresie; `debug_assert!` przy przyszłym AUTO-batch w ciele |
| 7 | Duplikacja marszu atomowego (`march_incremental = false`) i krokowego | **ODDAL** (dług) | Ścieżka atomowa zostaje tylko dla wektorów pętli bez sesji; sesja (produkcja) ustawia `true` |
| 8 | parity-v2 przesunięta od bazy | **ODDAL** (integracja) | Merge bez konfliktów, testy dotknięte zielone na merge'u (§6); pełny test przy integracji |

NAPRAW: brak. DO DECYZJI CZŁOWIEKA: brak.

## 8. Zamknięte / zostaje długiem

| Pozycja | Stan |
|---|---|
| Klasa A (B-WIRA-PIN-3): 118, 196, 221 @1 i @16 | **ZAMKNIĘTE** (128/128 @1 i @16, lista pusta, odtworzone przez FC) |
| MARCH-INCREMENTAL-RESZTA (`_siegeWalkTo`, `_fallBackStep`, `_fleeStep`, `_rangedBackStep`, `_kiteStep`, `_rangedApproachStep`, jazda) | dług, NIE_ZMIERZONO (w 128 c1 brak rozbieżności z nich) |
| Strzał z 1. wejścia `_rangedAction` w marszu na wektorach pinu | dług (wektor generatora), pokryte testem lib |
| N1 `debug_assert!` slotu marszu | dług do tematu AUTO-batch w ciele |
| Duplikacja marszu atomowego | dług (usunąć po przejściu testów pętli na model pinu) |
| FQ-SPEED (155 @32), D-PIN3-3-SHOT-ID | poza zakresem, bez zmian |

## 9. Werdykt

**PASS-WITH-NOTES** — wszystkie kryteria końca dispatchu spełnione i odtworzone samodzielnie; uwagi = długi z §8.
SHA do integracji: commit tego raportu nad `feaf4bb40` (kod: `13a0d2f95` + testy `2e2b8c5a6`).
Sprzątanie: target FC usunięty; tymczasowy commit merge'a `ad8d32977` nieprzypięty do żadnej gałęzi.
