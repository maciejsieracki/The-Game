# R-RUSTPORT-P6-K5LOOP-FRAME-QUANT-Q1 — Final Control r1

```text
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5LOOP-FRAME-QUANT-Q1 (zgodność z pinem w produkcyjnej klatce 16 ms: 12 kandydatów c1 + mur_jazda_rzeka @16)
GOAL: przy kroku klatki 16 ms wynik Rust bajt w bajt zgodny z pinem dla 12 kandydatów FRAME-QUANT i mur_jazda_rzeka,
      bez psucia @1 ms (>= 125/128), dawnych wektorów i bliźniaków _klatka1; mutanty >= 20, zamiana _drainTimers/_raf = FAIL
OCENIANY STAN: rust-port-wip/frame-quant-q1-obrona = 9722385d2 (kod Rust tematu: Operator 3f4577d6f + obrona c6e25ee7b;
               dane 757ac004e), baza 0522ad6df (= linia BAZA dispatchu; merge-base 9722385d2 / origin/rust-port/parity-v2
               = 0522ad6df; parity-v2 przesunęła się od tego czasu do e1f61c503 — sprawa integracji, nie oceny)
ZMIANY/COMMIT: tylko ten raport (gałąź lokalna rust-port-wip/frame-quant-q1-fc nad 9722385d2)
TESTY: §2 — wszystkie bramki odtworzone samodzielnie, EXIT 0; generator bit w bit; kandydaci c1 @16 i @1: 125/128
BLOKADY: brak. Zarzuty: 0 × NAPRAW, 9 × ODDAL, 0 × DO DECYZJI CZŁOWIEKA (§4)
RUNDY: 1/5
NASTĘPNY KROK: integracja orkiestratora (merge-tree na bieżące origin/rust-port/parity-v2, pełny test po merge'u),
               wpisy D-FQ-1..3 w REJESTR-RUST.md, poprawka ścieżki wektorów w dispatchu
DEPLOY/PUSH: NIE WYKONANO
```

## 1. Web najpierw — weryfikacja tezy na pinie

Model D-FQ-1/2/3 sprawdzony z tekstem pinu przez Evaluatora (tabela `02-evaluator.md` §1: `_drainTimers` `:9616-9634` bez
przesuwania `vNow`, `_schedule` `:9595-9606`, `_runFastForward` `:9414-9437` — zegary przed kolejką `_ffQueue`, `_doMove`
`p >= 1`, `_doMeleeAttack` `localT`). FC nie znalazł w diffie stałej ani reguły, której nie ma w pinie: kwantyzacja
`ceil(ms/F)*F` (`frame_sched`/`frame_raf`) jest tożsamością przy F = 1 i przy `frame_ms = 0` (dawne testy pętli), a
generator wykonuje tekst pinu (strażnik SHA-256 `3eeeb760…` bez zmian). Nowa mechanika gameplay: brak.

## 2. Bramki odtworzone przez FC (worktree `wf_6a1aa039-fb6-4`, checkout `9722385d2`)

`CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie (`fqfc/tgt`,
**usunięty po bramkach**), długie przebiegi w tle (`setsid nohup`, EXIT w logu).

| Bramka | Wynik FC |
|---|---|
| `cargo fmt --all -- --check` (engine) | **FMT_EXIT=0** |
| `cargo clippy --all-targets -- -D warnings` (engine) | **CLIPPY_EXIT=0** |
| `cargo test --all-targets --no-fail-fast` (engine, pełny, checkout z `dyspozycje/`) | **FULL_EXIT=0**: 551 binarek, **4202 passed, 0 failed, 1 ignored** (sprzed tematu; diff `0522ad6df..9722385d2` dodaje 0 `#[ignore]`) — w tym `p6_k5loop_wiring_a*`, `p6_k5loop_wiring_b*`, `bridge_contract`, `p6_k5loop_*`, `p6_zdobycie_miasta_a*` |
| `p6_k5loop_wiring_a_pin` (w pełnym przebiegu) | **8/8 ok** (42 wektory, 67,8 s debug): `wektory_pinu_pelnej_bitwy_bajt_w_bajt`, `kwantyzacja_odcinkow_klatka_pinu`, `kwantyzacja_odcinkow_zlozonych_klatka_pinu`, `pokrycie_scenariuszy` |
| Generator — pełna regeneracja z tekstu pinu (`node rust-port/engine/tests/p6_k5loop_wiring_a_gen.mjs`, Node 22) | **GEN_EXIT=0**, `vectors.json` **`ec89d91d3e9fccee3461752969757f12`**, `pin_data.json` **`432eed76e34a0e8cc96ec548e88eae64`** = bit w bit z commitem; `git status` czysty po regeneracji |
| Kandydaci c1 — Rust (`kandydaci_z_pliku_na_zadanie`, binarka z kodu `9722385d2`, `WIRING_A_RUST_FF_STEP`) na wyjściach pinu `c128_16_pin.json` (MD5 `307d59423be5fd54379ec3bc06f87efe`) i `c128_1_pin.json` (`ed9a3c98f893643da23c694c3a282157`) — te same MD5, które Evaluator odtworzył niezależnie generatorem | **@16: 125/128**, **@1: 125/128**; rozbieżne wyłącznie `118`, `196`, `221` (klasa A MARCH-INCREMENTAL). Wszystkie 12 kandydatów FRAME-QUANT (120, 122, 154, 155, 157, 161, 162, 189, 190, 191, 204, 217) **ZGODNE @16** |
| `mur_jazda_rzeka` @16 i `mur_jazda_rzeka_klatka1` | zgodne jako zwykłe wektory; `ROZBIEZNE_B_WIRA_PIN_2 = []`, `ROZBIEZNE_B_WIRA_PIN_3` = tylko 118/196/221 `_klatka1` |
| `git diff --check 0522ad6df 9722385d2` | czysto |
| @4 ms | NIE_ZMIERZONO przez FC (diagnostyka; Operator i Evaluator: 125/128) |

### Mutant kontrolny FC (niezależny od list Q/E)

| Mutant | Zmiana | Wynik |
|---|---|---|
| FC1 | `timeline_ord`: krok wołany z zegara `_schedule(STEP_GAP_MS)` dostaje klucz `+inf` zamiast nominalnego `due` (D-FQ-2 wyłączone) | **ZABITY**: `wektory_pinu_pelnej_bitwy_bajt_w_bajt` FAILED (pin), lib: `krok_z_zegara_w_klatce_wg_nominalnego_due`, `marsz_oblezniczy_krok_po_przerwie_ma_klucz_due_przerwy`, `trafienie_wiezy_czyta_os_celu_wg_due` FAILED. Źródło przywrócone, `git status` czysty |

Czułość zamiany faz `_drainTimers`/`_raf` (kryterium dispatchu): Q24 i E1 (przewijanie) zabite wektorami (Operator,
Evaluator), E2 (czas rzeczywisty) zabity testem jednostkowym obrony — FC nie powtarzał tych mutantów, przyjmuje na
podstawie skryptów `01-operator-r1-mutanty.py`, `02a-obrona-mutanty.py` i zgodnych raportów dwóch niezależnych ról.

## 3. Allowlista i zakazy (sprawdzone na `git diff --name-only 0522ad6df 9722385d2`)

| Plik | W allowliście |
|---|---|
| `rust-port/engine/src/domain/siege_tactics_loop.rs` | tak |
| `rust-port/engine/src/domain/siege_battle_session.rs` (+6 linii: `body.frame_ms`, przeliczenie w `diag_set_speed_mul`, uzasadnione pinem `:9419`) | tak |
| `rust-port/engine/tests/p6_k5loop_wiring_a_gen.mjs` (20 scenariuszy + ślad diagnostyczny pod zmiennymi; strażnik SHA i MD5 zachowane) | tak |
| `rust-port/engine/tests/p6_k5loop_wiring_a_pin.rs` | tak |
| `rust-port/engine/tests/p6_k5loop_wiring_a_pin_vectors/vectors.json` (22 → 42, same dopiski) | tak (dispatch pisze `p6_k5loop_wiring_a_vectors/*` — literówka dispatchu, Z1) |
| `dyspozycje/autobot/runs/R-RUSTPORT-P6-K5LOOP-FRAME-QUANT-Q1/*` (raporty, skrypty mutantów) | tak |

Nietknięte: `bridge.rs`, `city_capture_apply.rs`, `playable.rs`, `client`, `renderer`, `src-tauri`, `gra/`, `Cargo.*`,
`p6_k5loop_wiring_b*`. `#[ignore]` dodane: 0. Trailery 11 commitów: wyłącznie `Claude-Session:`, brak `Co-Authored-By`.
Brak push na `parity-v2`, brak integracji/deployu.

## 4. Zarzuty i orzeczenia

| # | Zarzut (źródło) | Orzeczenie | Uzasadnienie (dowód) |
|---|---|---|---|
| U1 | E5, E8: nowe gałęzie D-FQ-2 bez testu (Evaluator) | **ODDAL** (zamknięte w obronie) | testy `marsz_oblezniczy_krok_po_przerwie_ma_klucz_due_przerwy`, `wywolanie_ciala_zeruje_due_przerwy_poprzedniego_marszu` — w pełnym przebiegu FC zielone; mutant FC1 (ta sama gałąź) zabity także pierwszym z nich |
| U2 | Q20, Q22, E6, E7 nieobserwowalne — klasa FQ-TOWER-HIT-DUE (Evaluator, Operator) | **ODDAL** (zamknięte w obronie) | testy `wieza_czyta_os_celu_z_nominalnym_due_wystrzalu_i_trafienia` (atrapa `RecBody`), `trafienie_wiezy_czyta_os_celu_wg_due`; refaktor `tower_target_view` bez zmiany zachowania (te same dwa odczyty, ten sam fallback — przeczytane w diffie); wektory bit w bit |
| U3 | E2: kolejność faz w czasie rzeczywistym niepilnowana (Evaluator) | **ODDAL** (zamknięte w obronie) | `czas_rzeczywisty_faza_krokow_po_zegarach_tej_klatki` zielony; model czasu rzeczywistego bez zmian (D-PIN3-3) |
| U4 | błędny opis Q25 (Evaluator) | **ODDAL** (poprawione) | opis w `01-operator-r1.md` §8 i skrypcie: no-op, właściwy test zamiany faz = Q24/E1 |
| U5 | @32/@64 niezweryfikowane (Evaluator) | **ODDAL** | poza kryterium dispatchu (produkcja = 16 ms, `_setSpeedIdx` nieportowane); dług FQ-SPEED z adnotacją NIE_ZMIERZONO przez Evaluatora/obronę/FC |
| U6 / Z1 | brak sekcji „Pliki spoza allowlisty”; ścieżka wektorów w dispatchu ≠ faktyczna (Evaluator) | **ODDAL** | sekcja dodana w `02a-obrona.md` §3; katalog `p6_k5loop_wiring_a_pin_vectors/` istnieje w bazie `0522ad6df` od K5LOOP-WIRING-A, dispatch ma literówkę — do poprawy przez orkiestratora w `00-dispatch.md`/rejestrze, nie w kodzie |
| Z2 (FC) | kryterium 128 kandydatów sprawdzone na wyjściach pinu z PIN3, nie regenerowanych przez FC | **ODDAL** | MD5 plików pinu = MD5 odtworzone niezależnie generatorem przez Evaluatora (`02-evaluator.md` §2); kod Rust oceniany przez FC to binarka z `9722385d2` |
| Z3 (FC) | długi pozostawione: MARCH-INCREMENTAL (118/196/221, 127 @32), SHOT-LAND-AT-RENDER (Q12), D-PIN3-3-SHOT-ID (215 @64), PRE-SKIP-RAF | **ODDAL** | wszystkie poza zakresem dispatchu albo jawnie zapisane z numerem; 118/196/221 to dokładnie lista dopuszczona dispatchem; PRE-SKIP-RAF: wpływ 0/128 przy każdym kroku, decyzja techniczna orkiestratora (rekomendacja Operatora „nie emulować” — FC się zgadza: stała atrapy zegara generatora, w przeglądarce niedeterministyczna) |
| Z4 (FC) | baza dispatchu `0522ad6df`, a `origin/rust-port/parity-v2` = `e1f61c503` | **ODDAL** dla oceny | FC orzeka na bazie z linii BAZA dispatchu (absolutny priorytet). Integracja: orkiestrator robi merge-tree na bieżące parity-v2 i pełny test po merge'u (dotyka `siege_tactics_loop.rs`, `siege_battle_session.rs` — możliwe konflikty z równoległymi tematami K5/I6/kapitulacji) |

Bilans: **0 × NAPRAW, 9 × ODDAL, 0 × DO DECYZJI CZŁOWIEKA** → PASS. Notatki (długi, integracja na nowszą bazę,
poprawka dispatchu, wpisy rejestru) → PASS-WITH-NOTES.

## 5. Kryteria końca dispatchu

| Kryterium | Stan (dowód FC) |
|---|---|
| 128 kandydatów @16 zgodnych poza jawną listą (docelowo 118/196/221) | **spełnione**: 125/128, rozbieżne 118, 196, 221 (§2) |
| `mur_jazda_rzeka` @16 bajt w bajt bez wyjątku | **spełnione** (zwykły wektor, lista PIN_2 pusta) |
| @1 ms ≥ 125/128 | **spełnione**: 125/128 |
| bliźniaki `_klatka1` zgodne | **spełnione** (wektory w pełnym teście; + nowe `_klatka1` 213/214/217/218 i `_klatka4` 125/173/174/132) |
| determinizm i niezależność od podziału na `StepSiegeBattle` | **spełnione** (testy sesji i resume w pełnym przebiegu zielone) |
| mutanty ≥ 20, każdy zabity lub jawnie równoważny; zamiana `_drainTimers`/`_raf` = FAIL | **spełnione**: 34 (Q1–Q26, E1–E8): 27 zabitych, 7 równoważnych z uzasadnieniem, 0 nieobserwowalnych; zamiana faz: Q24, E1 (FF), E2 (czas rzeczywisty) zabite; + FC1 zabity |
| bramki EXIT 0 | **spełnione** (fmt, clippy, pełny test, generator) |

## 6. Długi (stan po FC, do rejestru)

| ID | Stan |
|---|---|
| MARCH-INCREMENTAL | 118, 196, 221 (każdy krok), 127 @32 — temat następczy [3D-D] |
| FQ-SPEED | @32 124/128, @64 117/128 — tylko pomiar Operatora r1; zmiana `speedMul` w trakcie aktywacji NIE_ZMIERZONO; do tematu `_setSpeedIdx` |
| SHOT-LAND-AT-RENDER | `land_at` strzału 384 @16 (zgodne z klatką animacji pinu), niepokryte wektorem — temat I5 |
| D-PIN3-3-SHOT-ID | potwierdzony przypadkiem 215 @64 |
| PRE-SKIP-RAF | decyzja techniczna orkiestratora (rekomendacja: nie emulować) |
| FQ-TOWER-HIT-DUE, FQ-D2-SIEGEWALK, FQ-GAPDUE-RESET, FQ-REALTIME-ORDER | **zamknięte** (obrona r1, potwierdzone pełnym testem FC) |

Do wpisania przez orkiestratora w `REJESTR-RUST.md`: D-FQ-1 (kwantyzacja odcinków ciała klatką `ceil(ms/F)*F`,
`frame_ms = 16 × speedMul` w sesji), D-FQ-2 (kolejność w klatce wg nominalnego `due`: synchroniczny < krok z zegara
przerwy < krok `_raf`; wieża czyta oś ze swoim `due`, remis = wieża pierwsza), D-FQ-3 (ogony `done()` nominalne).

## 7. Sprzątanie

Target `fqfc/tgt` usunięty po bramkach i mutancie; logi bramek w scratchpadzie `fqfc/*.log` (kilka MB). Źródło po
mutancie FC1 przywrócone (`git status` czysty przed commitem raportu). `df -h /` po sprzątaniu: 11 GB wolnego.
