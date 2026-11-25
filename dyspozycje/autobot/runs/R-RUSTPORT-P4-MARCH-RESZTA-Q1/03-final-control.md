# R-RUSTPORT-P4-MARCH-RESZTA-Q1 — Final Control r1

```text
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-MARCH-RESZTA-Q1 (pozostałe marsze bitwy oblężniczej krok po kroku, zadanie #402)
GOAL: _fallBackStep, _fleeStep, kawaleria, _siegeWalkTo krok po kroku wg pinu 07d2fbd72; _rangedBackStep/_kiteStep/
      _rangedApproachStep jawnie rozstrzygnięte; c1 128/128 @1/@16; 45 dawnych wektorów bajt w bajt; mutanty >= 15; N1;
      dług atomowego duplikatu rozstrzygnięty
OCENIANY KOD: abfa9f4cd (rust-port-wip/march-reszta-q1-obrona; kod produkcyjny = d0371f66d Operatora + testy Obrony c71da7571)
BAZA: origin/rust-port/parity-v2 = b41adf6a5660d8c1b767bdfaeedd237a728e3ce3 (DODATEK r2), przodek ocenianego kodu: TAK
ZMIANY/COMMIT: ten raport (gałąź lokalna rust-port-wip/march-reszta-q1-fc, bez push); kod gry bez zmian w FC
TESTY: §2 — fmt/clippy/pełny test engine EXIT 0 (4338/0/1); c1 128/128 @16 (świeże ziarno 2001..2128) i @1 (101..228)
BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: integracja orkiestratora (merge-tree na parity-v2) + bramki client i renderer (zmiana chwili skutków ucieczki)
DEPLOY/PUSH: NIE WYKONANO
```

## 1. Zakres i allowlista (sprawdzone samodzielnie)

- `git merge-base --is-ancestor origin/rust-port/parity-v2 abfa9f4cd`: tak. `git diff --stat b41adf6a5 abfa9f4cd`:
  `siege_tactics_loop.rs`, `p6_k5loop_wiring_a_pin.rs`, `p6_k5loop_wiring_a_gen.mjs`, `vectors.json` (tylko dopisane),
  `p6_k5loop_wiring_a.rs` (1 linia kodu + komentarz) i 3 pliki runu. Nie ruszono: `siege_battle_session.rs`,
  `siege_tactics_actions.rs`, `siege_tactics_atk*.rs`, `gra/`, `src-tauri`, `view-model`, `renderer`, `client`, `Cargo.lock`.
- `#[ignore]` w diffie: brak. Usunięte linie testów to wyłącznie zmiana sygnatury (`march_fire(&st)` → `&mut st`,
  `setup` → `setup_defs`); asercje nie są osłabione. `ROZBIEZNE_FQ_SPEED_402` 4 → 0 to zamknięcie długu (test nadal pada
  przy rozjeździe któregokolwiek z 351 wektorów prędkości).
- Commity `b41adf6a5..abfa9f4cd`: brak linii z nazwą modelu.
- Wektory: `vectors.json` MD5 `9ceefda18531b3325aed3a54c385391a`; porównanie JSON z `b41adf6a5`: `pin`, `pinSha256`,
  `frameMs` równe, **45/45 dawnych wektorów identycznych**, dopisane 5: `mr_wzg_jazda3_d3l_mury_333`,
  `mr_wzg_wieza_df_mury_347`, `mr_wzg_mixk_df_palisada_364`, `mr2_wzg_slabi_ds_palisada_534`, `mr2_rown_wiezak_ds_palisada_606`.

## 2. Bramki odtworzone przez FC

`CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie
(`tgt-march-reszta-fc`, usunięty po bramkach), jeden build naraz.

| Bramka | Wynik |
|---|---|
| engine `cargo fmt --check` | **EXIT 0** |
| engine `cargo clippy --all-targets -- -D warnings` | **EXIT 0** |
| engine `cargo test --all-targets --no-fail-fast` (w tle, `setsid nohup`) | **EXIT 0**, 557 × `test result: ok`, **4338 passed / 0 failed / 1 ignored** (zgodne z Obroną) |
| c1 @16, **świeże ziarno 2000** (2001..2128, kandydaci `01-operator-r1-kandydaci-c1.py`, pin wykonany generatorem `WIRING_A_EXTRA`) | **128/128 ZGODNY** |
| c1 @1, ziarno 100 (101..228; pin `WIRING_A_SWEEP_FRAME=1`, Rust `WIRING_A_RUST_FF_STEP=1`) | **128/128 ZGODNY** |
| client / renderer | NIE URUCHAMIANE — dispatch przypisuje je orkiestratorowi przy integracji |

## 3. Zgodność z pinem (odczyt `git show 07d2fbd72:gra/src/battle/battleScene.ts`)

- D-MR-3 potwierdzone: `git grep` w `gra/src` przy pinie — `_rangedBackStep` (`:7010`, `:7029`), `_kiteStep` (`:7065`,
  `:7091`), `_rangedApproachStep` (`:7257`, `:7283`) mają wyłącznie definicję i rekurencję własną; martwy kod pinu.
- `_cavDirectedManeuverStep` `:6426-6446`: callback `finished` → done, `_cavAdjacentNonSpear` → done, `moveLeft > 0` →
  `_cavalryTarget(ru) ?? tgt` i rekurencja, inaczej `done()` (bez `_cavManeuverStep`) — pilnowane testem Obrony
  `jazda_c_flank_brak_kroku_skierowanego_konczy_bez_manewru`. Szarża `:6403-6409` (`stepKey && moveLeft > 0`) —
  `jazda_szarza_bez_ruchu_konczy_bez_kroku`; `NaN` w callbacku — `jazda_callback_nan_konczy`.
- D-MR-2 (`LoopBody::after_start` wołane w `SiegeLoop` zaraz po `start`, `siege_tactics_loop.rs:1046-1047`;
  `ProdBody::after_start` `:5347`, `complete` dla `applied` `:6018`): chwila skutków ucieczki zgodna z synchronicznym
  `_activateUnit` pinu; gałąź atomowa i łączenie trójstronne zostają jako zabezpieczenie.
- N1: `debug_assert!(self.march.is_none())` w `march_advance` (`:3546`) + test `drugi_marsz_w_slocie_to_blad_kontraktu`.

## 4. Orzeczenia

| # | Zarzut / uwaga | Źródło | Orzeczenie | Uzasadnienie |
|---|---|---|---|---|
| Z1 | E1 (`dNow` z pierwszego, nie najbliższego wroga) przeżywał | Evaluator | **ODDAL** | zamknięte przez Obronę: `odwrot_dnow_z_najblizszego_wroga_nie_z_pierwszego` (asercja kolejności listy `[12, 7]`), test zielony w pełnym `cargo test` |
| Z2 | E8 (C-FLANK bez kroku → manewr) przeżywał | Evaluator | **ODDAL** | zamknięte testem Obrony zgodnym z pinem `:6438-6444` |
| Z3 | E6/E7 (szarża bez `moveLeft > 0`, `NaN` w callbacku) | Evaluator | **ODDAL** | zamknięte dwoma testami Obrony z kontrolą pozytywną w tej samej scenie |
| Z4 | dopisek długu o duplikacie krokowym | Evaluator | **ODDAL** | dopisany w „Długi” pkt 1 `01-operator-r1.md` |
| U1 | `engine/tests/p6_k5loop_wiring_a.rs` poza allowlistą | Operator/Evaluator | **ODDAL** (uwaga dla orkiestratora) | zmiana konieczna przez N1 wymagany dispatchem; `prepare` = `start` bez `play()` (`siege_battle_session.rs:725-733`), `march_incremental = true` ustawiane w budowie sceny (`:1055`, przed `play` `:1165`), asercje sondy bez zmian; orkiestrator wpisuje akceptację do `REJESTR-RUST.md` |
| U2 | martwy strażnik `same_seq_units` w `after_start` | Evaluator | **ODDAL** | strażnik kontraktu, bez wpływu na wynik |
| D1 | duplikat atomowy `march_incremental = false` nieusunięty | dispatch pkt 3 | **ODDAL** | dispatch dopuszcza pozostawienie z uzasadnieniem; używany przez 7 plików testów spoza allowlisty — dług MARCH-ATOMIC-TESTONLY |
| D2 | `morale-konflikt-zegara` (skutki morale aktywacji nie-ucieczkowej w `complete`) | Operator, Długi pkt 2 | **ODDAL** | poza ścieżkami marszu z dispatchu; jawny dług MORALE-START-IN-COMPLETE, w zmierzonych zbiorach tag nie wystąpił |
| U4 | `mr_rown_jazda3_dk_mury_401` @1 = `SKIP_STEP_BUDGET` | Operator/Evaluator | **ODDAL** | ograniczenie diagnostyki (pat do 400 tur przy kroku 1 ms), @16 zgodny; dług DIAG-BUDGET-1MS |
| U5 | client/renderer nie uruchomione | Evaluator | **ODDAL** | dispatch: wykonuje orkiestrator przy integracji (strumień akcji zmienia chwilę skutków ucieczki — bramki obowiązkowe) |

Brak orzeczeń NAPRAW. Brak spraw DO DECYZJI CZŁOWIEKA (wszystko rozstrzyga pin albo decyzja techniczna orkiestratora).

## 5. Kryteria końca

| Kryterium | Stan |
|---|---|
| Każda ścieżka marszu zgodna z pinem (krokowo albo jawnie) | spełnione (D-MR-1, D-MR-2, D-MR-3) |
| c1 128/128 @1 i @16 | spełnione (Operator, Evaluator, FC — FC na świeżym ziarnie @16) |
| 45/45 dawnych wektorów | spełnione (JSON identyczne) |
| przypadki z routem/śmiercią w oknie marszu zmierzone | spełnione (5 `mr_*` w `vectors.json`, `156`×32 i dawne pozycje FQ-SPEED w `speed_vectors.json`, 351/351) |
| mutanty >= 15 | spełnione: 23 Operatora (22 zabite, M18 równoważny) + 12 Evaluatora (10 zabitych po Obronie, E10/E12 równoważne) |
| tabela „zamknięte / zostaje długiem” | jest (§11 raportu Operatora) |

## Długi (do rejestru, wpis orkiestratora)

1. MARCH-ATOMIC-TESTONLY — usunąć gałęzie `!march_incremental` po przeniesieniu testów spoza sesji; do tego czasu każda
   zmiana reguły ruchu w obu kopiach + test lib kopii krokowej.
2. MORALE-START-IN-COMPLETE — rozszerzyć `after_start` na `pend.morale`/`start_rout` (NIE_ZMIERZONO osobnym generatorem).
3. DIAG-BUDGET-1MS — budżet kroków diagnostyki przy kroku 1 ms.
4. Akceptacja `p6_k5loop_wiring_a.rs` poza allowlistą (U1) — wpis w `REJESTR-RUST.md` przy integracji.
