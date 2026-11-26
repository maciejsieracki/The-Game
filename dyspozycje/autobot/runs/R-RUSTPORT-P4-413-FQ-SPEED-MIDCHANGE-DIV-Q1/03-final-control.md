# R-RUSTPORT-P4-413-FQ-SPEED-MIDCHANGE-DIV-Q1: Final Control

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-413-FQ-SPEED-MIDCHANGE-DIV-Q1
GOAL: koniec każdego odcinka `_raf` w toku przy zmianie prędkości ma wypadać w siatce klatek obowiązującej w klatkach tego odcinka, jak w pinie `07d2fbd72`. Przy stałej prędkości nic się nie zmienia. Wszystkie 40 wektorów zgodne, lista `ROZBIEZNE_FQ_SPEED_MIDCHANGE` pusta.
ZMIANY/COMMIT: oceniany kod: `obrona-413` = `4e1db5589` (kod `2e9588c16` na Operatorze `d70c4cf7c`). Baza `31b47d9d954b2638dcb049c990a0373ed848de54` = `origin/rust-port/parity-v2` w chwili oceny (`merge-base --is-ancestor` OK, parity-v2 się nie przesunęło). Diff względem bazy: `siege_tactics_loop.rs` (+910/−7), `siege_battle_session.rs` (+5/−1), `p6_k5loop_wiring_a_pin.rs` (+9/−13) i raporty runu. Final Control nie zmienia kodu. Jedyny plik tej rundy to ten raport.
TESTY: odtworzone samodzielnie przez FC (§2). Engine: fmt 0, clippy 0, pełny test EXIT 0 (558 binarek, 4370 passed, 0 failed, 1 ignored). Client: fmt 0, clippy 0, test 0 (66 passed). Renderer (gpu OFF): fmt 0, clippy 0, test 0 (758 passed; przepisany `Cargo.lock` cofnięty). Mutanty FC: E4 zabity, M-Z1 zabity (§3).
BLOKADY: brak.
RUNDY: 1/5 (Operator r1 → Evaluator FAIL → Obrona z poprawką → FC)
NASTĘPNY KROK: integracja przez orkiestratora (FF/merge `4e1db5589` na `rust-port/parity-v2`, pełna bramka po integracji) i wpis do `REJESTR-RUST.md`. Notatki N1–N3 (§5) trafiają do rejestru jako dług.
DEPLOY/PUSH: NIE WYKONANO.

## 1. Zgodność z dispatchem

- **Baza:** zgodna z linią „BAZA:” (`31b47d9d9`), gałąź Obrony zawiera ją jako przodka.
- **Allowlista:**
  - `siege_tactics_loop.rs`: na liście.
  - `p6_k5loop_wiring_a_pin.rs`: lista skrócona z `[&str; 9]` do `[&str; 0]`. Warunek kontroli czułości strażnika rozszerzono o `|| ROZBIEZNE_FQ_SPEED_MIDCHANGE.is_empty()`, żeby kontrola dalej się wykonywała (asercja `straz_sprawdzona` została). Żadna asercja ani mutant nie zostały usunięte ani osłabione. Sprawdzone w diffie: to nie osłabienie, a utrzymanie strażnika przy pustej liście.
  - `siege_battle_session.rs`: poza listą. Dodano 4 linie: wywołanie `self.lp.respeed(..)` w `set_speed_idx`. To jedyny punkt zmiany prędkości, a uzasadnienie jest w `01-operator-r1.md` §3.4. Zgodnie z D-413-2 trzeba było przejść bramki `client` i `renderer`; FC je przeszedł (§2).
- **Pliki bez zmian:** wektory, generator i `gra/`. MD5 `speed_change_vectors.json` = `a374deaea878eca21ff4166817fb03a9` (bez zmian). `git diff --check` czysty.
- **Zakazy:** brak `#[ignore]` i `git add -A`. Commity nie zawierają linii z nazwą modelu, jest tylko `Claude-Session:`. Brak pusha i integracji.
- **Pin:** `grep "this._raf("` w `battleScene.ts@07d2fbd72` daje wyłącznie dwie pętle `_raf`: `_doMove` (`:8767/8775`) i lunge `_doMeleeAttack` (`:9172/9174`). Wszystkich wołających `_doMove` (`:5955 … :18419`) Obrona rozpisała w `02a-obrona.md` §1.1. Każdy wołający działający w sesji ma teraz plan, w tym `:6635` `_phalanxStep` i `:7915` `_advanceToward`. `:7892-7916` i `:8746-8775` sprawdzone w tekście pinu.

## 2. Bramki (FC, własny `CARGO_TARGET_DIR` w scratchpadzie, usunięty po bramkach, jeden build naraz)

Ustawienia: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`.

| Crate | fmt --check | clippy --all-targets -D warnings | test --all-targets --no-fail-fast |
|---|---|---|---|
| engine | 0 | 0 | 0: 558 binarek, 4370 passed / 0 failed / 1 ignored |
| client | 0 | 0 | 0: 66 passed |
| renderer (gpu OFF, `default = []`) | 0 | 0 | 0: 758 passed (`Cargo.lock` cofnięty `git checkout`) |

W logu engine:
- `zmiana_predkosci_w_trakcie_bitwy_wektory_pinu_bajt_w_bajt ... ok`: lista pusta, więc 40/40 zgodne.
- `zmiana_predkosci_w_trakcie_mutanty_sterownika_daja_fail ... ok`: 8 mutantów sterownika #412 zabitych.
- Wszystkie `respeed_tests::*` (10) i `march_incremental_tests::p413_*` (6) zielone.

Dysk przed bramką renderera: 14 GB wolnego. Po rundzie: brak procesów cargo, target usunięty, worktree czysty.

## 3. Mutanty FC (na kopii pliku, oryginał przywrócony, `cargo test --lib -- respeed_tests p413_`)

| ID | Mutacja | Wynik |
|---|---|---|
| E4 (Z2) | `respeed` bez `p.anchor = now; p.frame = frame;` | EXIT 101, FAIL `dwie_zmiany_druga_po_koncu_lunge_nie_rusza_settle`: zabity |
| M-Z1 (Z1) | `put_step_done_plan` nie wstawia planu | EXIT 101, FAIL `p413_krok_falangi_ma_plan_raf` i `p413_krok_advance_toward_ma_plan_raf`: zabity |

Liczby testu Z2 przeliczone ręcznie z pinu. Siatka 64 od 1000 daje cios w 1192 (pierwsza klatka ≥ 1160). Cel lunge to 1260. Po zmianie na x1 w 1192 koniec wypada w 1272 (1192 + 5·16), a `due` settle w 1492. Druga zmiana (x2) przychodzi w 1288, czyli po końcu lunge, więc `due` zostaje 1492. `done()` wypada w pierwszej klatce siatki 32 ≥ 1492, czyli w 1512 (1288 + 7·32). Wynik zgodny z testem.

## 4. Orzeczenie zarzutów

| Zarzut | Źródło | Orzeczenie | Uzasadnienie (dowód) |
|---|---|---|---|
| Z1: krok falangi i `_advanceToward` bez przeliczenia | Evaluator | ODDAL (naprawiony) | `put_step_done_plan` w `phalanx_action` (Move) i w `siege_atk_advance_toward`. Test `krok_konczacy_aktywacje_na_nowej_siatce` zielony, mutant M-Z1 zabity przez FC. Pin ma tylko dwie pętle `_raf` i wszyscy wołający w sesji mają plan. Korekta §3.5 raportu r1 zrobiona. |
| Z2: przeżywający mutant E4 | Evaluator | ODDAL (naprawiony) | Mutant zabity przez FC (§3). Argument Obrony §2 (inny rozjazd kotwicy jest niemożliwy) sprawdzony: po przeliczeniu klatki leżą na siatce od kotwicy, więc nowy koniec ≤ stary koniec. Przypadek „mutant w toku, poprawnie zakończony” występuje tylko przy `then > 0` i właśnie ten przypadek test pokrywa. |
| U1: gałęzie E3/E7/E8 oraz falanga i `_advanceToward` bez pokrycia wektorowego | Evaluator | ODDAL w tym temacie, notatka N1 | Nowy wektor wymaga zmiany `speed_change_vectors.json` albo scenariuszy generatora, a D-413-1 tego zabrania (generator nie ma błędu: 40/40 bajt w bajt). Gałęzie strzeżone są testami jednostkowymi wyprowadzonymi z pinu. Pokrycie wektorowe jest NIE_ZMIERZONO, propozycję tematu opisuje N1. |
| U2: przesunięty doc-komentarz `begin_shot` | Evaluator | ODDAL (naprawiony) | W diffie `put_raf_plan` stoi przed doc-komentarzem `K5LOOP-CLOSE r3/r4 …`, który znowu dokumentuje `fn begin_shot`. |
| U3: `raf_plans` rośnie bez ograniczeń | Evaluator | ODDAL (naprawiony) | `retain` po żywych `id` w `schedule_body`. Test `plany_odpalonych_klockow_nie_zalegaja` zielony, a pełny test potwierdza brak zmiany wyniku. |
| U4: `Melee.hit_at`, `Shot.land_at` i `TowerShot.land_at` liczone w chwili startu | Evaluator | ODDAL (poza zakresem D-413-2), notatka N2 | Kontrakt renderera nie jest zmieniany, sprawa idzie jako dług do #405. |
| `siege_battle_session.rs` poza allowlistą | FC | ODDAL | Zmiana minimalna i konieczna (bez niej `respeed` byłby martwy). Bramki client i renderer przeszły u FC. |
| FC-1: osierocony plan `Done(u)` przy `march_pending(u)` | FC | ODDAL (nit), notatka N3 | Plan wstawiony w `start`, gdy `march_pending(u)` pomija `schedule_body`, zostaje do następnej aktywacji tej jednostki. Zostaje przyjęty tylko wtedy, gdy nowy `due` jest bitowo równy `t + frame_raf(frame, ms) + then` (strażnik w `schedule_body`). W sesji krok falangi, `_advanceToward` ani cios z `attack_pre = 0` nie ustawiają `march_pending`, więc ścieżka jest nieosiągnięta. Bez wpływu na wektory. |

Żaden zarzut nie ma orzeczenia NAPRAW. Nic nie wymaga decyzji człowieka: są to decyzje techniczne orkiestratora (D-413-1 i rejestr).

## 5. Notatki do rejestru (dla orkiestratora)

- **N1 (pokrycie wektorowe):** chwila zmiany „w trakcie kroku falangi / `_advanceToward` po 1. turze” i para przesuwająca chwilę ciosu o klatkę (np. x4→x1 tuż po starcie wypadu) nie są w zestawie #412. Sonda Evaluatora: 0/74 zastosowanych. Proponowany osobny temat „FQ-SPEED-MIDCHANGE-VEC-2”: generator z rodzajami `movingPh`/`movingAdv`, scenariusze bazowe z falangą i `_advanceToward` oraz wektor `lunge` z przesunięciem ciosu. Do tego czasu: NIE_ZMIERZONO wektorowo, zgodność wynika z kodu i z testów jednostkowych.
- **N2:** akcje renderera `hit_at`/`land_at` przy zmianie prędkości w trakcie odcinka. Dopisać do #405 (SHOT-LAND-AT-RENDER).
- **N3:** opcjonalne porządki: `take_raf_plan(Done(u))` także w gałęzi `march_pending(u)` w `ActivateUnit`, żeby nie zostawiać osieroconego planu (FC-1).

## 6. Werdykt

**PASS-WITH-NOTES.** Rdzeń naprawy jest zgodny z pinem:
- przeliczenie odcinków `_raf` w toku przy `set_speed_idx`;
- ogon wypadu liczony od chwili ciosu;
- trafienie strzału w klatce odpalenia.

Lista 9 rozbieżności spadła do 0, wszystkie 40 wektorów zgadzają się bajt w bajt, a 8 mutantów sterownika nadal ginie. Bez regresji: engine 4370, client 66, renderer 758. Oba blokujące zarzuty Evaluatora (Z1, Z2) zostały naprawione w Obronie i FC sprawdził to niezależnie mutantami. Notatki N1–N3 nie blokują.
