# R-RUSTPORT-P4-1I6-DLUGI-Q1: Final Control r1

```text
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1I6-DLUGI-Q1 (#396, długi klienta bitwy oblężniczej I6)
GOAL: odpowiedź StartSiegeStorm niesie BattleSetupDto z silnika, błąd bitwy jako typ, porzucenie bitwy w silniku
      po błędzie sceny klienta (Aborted osiągalne przez most), reguła porzucenia zgodna z pinem
ZMIANY/COMMIT: oceniany kod = 0245b62c7 (gałąź rust-port-wip/p4-1i6-dlugi-q1-obrona; kod obrony 47b3416a5 + 6502b7410
               + 0245b62c7 nad kodem Operatora 95be7d54d / 2acec6e16), baza 0522ad6df; ten raport: commit na lokalnej
               gałęzi fc/p4-1i6-dlugi-q1 (bez push)
TESTY: wszystkie bramki odtworzone przez FC, EXIT 0 (§2); mutanty FC 4/4 zabite (§4)
BLOKADY: brak
RUNDY: 1/5 (Operator r1 → Evaluator r1 FAIL → Obrona r1 → FC r1)
NASTĘPNY KROK: integracja orkiestratora na origin/rust-port/parity-v2 (merge-tree czysty, §1)
DEPLOY/PUSH: NIE WYKONANO
```

## 1. Baza, zakres, allowlista (sprawdzone samodzielnie)

* Dispatch: `origin/claude/rust-sivvrn:dyspozycje/autobot/runs/R-RUSTPORT-P4-1I6-DLUGI-Q1/00-dispatch.md`.
* `merge-base(0245b62c7, origin/rust-port/parity-v2) = 0522ad6df` (= baza z dispatchu).
* `parity-v2` jest teraz `e1f61c503`; `git merge-tree --write-tree origin/rust-port/parity-v2 0245b62c7` = drzewo
  `4e2dc3232`, bez konfliktów. Bramki FC uruchomione na samym kodzie tematu (nie na wyniku scalenia) — integracja
  powinna powtórzyć bramkę na drzewie scalonym (ZDOBYCIE-MIASTA-B jest już w parity-v2).
* `git diff --stat 0522ad6df 0245b62c7`: 10 plików — `client/src/lib.rs`, `client/tests/siege_battle_client.rs`,
  `engine/src/bridge.rs`, `engine/src/domain/siege_battle_apply.rs`, `engine/tests/bridge_contract.rs`,
  `engine/tests/p4_1i6_dlugi.rs` (nowy), `dyspozycje/autobot/runs/R-RUSTPORT-P4-1I6-DLUGI-Q1/{01-operator-r1.md,
  01-operator-mutanty.py, 02-evaluator.md, 02a-obrona.md}`. Wszystko w allowliście. `renderer/`, `view-model/`,
  `src-tauri`, `gra/`, `playable.rs`, `siege_battle_session.rs`, `siege_tactics_loop.rs`, `city_capture_apply.rs`: 0 zmian.
* `git diff --check`: czysto. Nowe `#[ignore]`: 0. Trailery: 9× `Claude-Session:`, 0× `Co-Authored-By`.
* Kontrakt: `CONTRACT_VERSION` bez zmian; zmiany addytywne (`EngineCommand::AbortSiegeBattle`, `phase = aborted`,
  `setup`/`towerShooter` tylko w odpowiedzi startu, `BridgeError.siegeBattle` pomijane przy `None` — test
  `bridge_contract` potwierdza, że JSON błędu nie-bitwy ma nadal wyłącznie `code`, `message`).

## 2. Bramki odtworzone przez FC

`CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, własne `CARGO_TARGET_DIR` w scratchpadzie
(`fc-1i6d-target`, `fc-1i6d-ctarget`, `fc-1i6d-mtarget` — wszystkie usunięte), checkout `0245b62c7` z `dyspozycje/`,
uruchomienie w tle (`setsid nohup`), bez przerywania limitem czasu.

| Bramka | Wynik |
|---|---|
| engine `cargo fmt --all -- --check` | EXIT 0 |
| engine `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| engine `cargo test --all-targets --no-fail-fast` (pełny) | EXIT 0: 552 sekcje, **4211 passed, 0 failed, 1 ignored** (ignored spoza tematu) — zgodne z deklaracją Obrony |
| w tym `bridge_contract` / `p4_1i6_dlugi` / `p6_k5loop_wiring_b` / `p6_k5loop_wiring_b_pin` / `p6_zdobycie_miasta_a` / `p6_zdobycie_miasta_a_bridge` | 10 / 18 / 15 / 2 / 6 / 7 passed |
| client `cargo fmt --all -- --check` | EXIT 0 |
| client `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| client `cargo test --all-targets` | EXIT 0: lib 0, `engine_bridge_renderer` 18, `siege_battle_client` 22 |
| renderer (gpu OFF) | kompiluje się jako zależność klienta (clippy + test klienta EXIT 0). Własne fmt/clippy/test renderera: **NIE ODTWORZONO** — wolne 2.9–3.5 GB (< 12 GB z dispatchu); renderer ma 0 zmian w temacie. |

## 3. Web najpierw (pin `07d2fbd72`, sprawdzone samodzielnie)

* `battleScene.ts:3359`: `btnTopExit = mkTopBtn('Wycofaj się', 'Wycofaj się z bitwy', () => { this.dispose(); if
  (this.onCancelCb) this.onCancelCb(); })` w górnym pasku — porzucenie w trakcie bitwy istnieje w webie.
* `main.ts:37018-37026`: `onCancel: () => setMood('mapa')`; `consumeReadyMachines` + `finishSiegeStormBattle` wyłącznie
  w callbacku `bs.play` (komentarz pinu #50: anulowanie nie traci machin).
* `battleScene.ts:10718-10733`: wyjście z ekranu końca woła najpierw `onFinishCb` z wynikiem.

Reguła po obronie (porzucenie dozwolone do fazy `Finished`, potem `AbortNotAllowed`, stan i machiny bez zmian, brak
`StateChanged`) jest zgodna z pinem; fałszywe twierdzenie r1 usunięte z doc-komentarzy (`bridge.rs`,
`siege_battle_apply.rs`, nagłówek klienta). Odmowa po `Finished` to decyzja techniczna (pin nie daje wtedy ścieżki
bez wyniku) — nie odstępstwo gameplay, bez pytania ABC.

## 4. Mutanty FC (inne niż Operatora M01–M25, Evaluatora E01–E22 i Obrony O1–O9)

Testy: `p4_1i6_dlugi` + `bridge_contract`; plik przywracany z Gita po każdym (`git status` czysty na końcu).

| ID | Mutacja (`siege_battle_apply.rs`) | Wynik |
|---|---|---|
| F1 | `finish` ignoruje flagę porzucenia | ZABITY (5 testów: `abort_po_starcie…`, `abort_w_trakcie…`, `abort_nie_jest_zdarzeniem_stanu`, `request_abort_wg_fazy…`, `zadanie_porzucenia_w_grze`) |
| F2 | kolor atakującego w setupie = kolor obrońcy | ZABITY (`start_niesie_setup_sceny_wg_pinu`) |
| F3 | `tower_shooter` zawsze `None` w odpowiedzi startu | ZABITY (`strzelec_wiezy_i_mur_kamienny`, `setup_tylko_w_odpowiedzi_startu…`) |
| F4 | odwrócony warunek fazy w `request_abort` | ZABITY (5 testów) |

Łącznie w temacie: Operator 25 zabitych; Evaluator 22 (po obronie: wszystkie przeżywające zabite albo jawnie
równoważne/nieosiągalne); Obrona 9; FC 4 — kryterium ≥ 15 spełnione.

## 5. Orzeczenia zarzutów

| Zarzut | Źródło | Orzeczenie | Uzasadnienie |
|---|---|---|---|
| Z1 reguła porzucenia sprzeczna z pinem | Evaluator | **ODDAL** (naprawione w obronie) | Pin potwierdzony (§3); kod, doc-komentarze i testy przepisane; F1/F4/O4/O5 zabite. |
| Z2 pola setupu bez niezależnej kontroli (E01, E02, E04, E07, E13) | Evaluator | **ODDAL** (naprawione) | `setup_hp_maxhp_kategoria_niezaleznie` liczy `maxHp` z surowego `units.json` i ranną jednostkę; `model_name_jednostka_przed_nazwa`; E07 udokumentowana nieosiągalność przez most z testem `def_civ_none_nieosiagalne_przez_most`; E13 test klienta. Testy zielone w pełnej bramce FC. Uwaga: kategoria oczekiwana jest liczona funkcją silnika `category_of`, ale na surowym wierszu `units.json`, nie przez producenta — wystarczająco niezależne. |
| Z3 bramki nieodtworzone | Evaluator | **ODDAL** | Pełny test silnika i bramka klienta odtworzone przez Obronę i przez FC (§2). Bramka własna renderera NIE ODTWORZONO (dysk < 12 GB), renderer bez zmian — nota, nie blokada. |
| Z4a `abort_started_battle` przyjmuje dowolne `Ok` | Evaluator | **ODDAL** | Most zwraca `Ok` dla `AbortSiegeBattle` wyłącznie jako `SiegeBattlePayload::aborted`; `phase == aborted` sprawdzane w testach E2E. |
| Z4b martwe `let _ = BridgeErrorCode::EngineRejected` | Evaluator | **ODDAL** (usunięte w obronie) | — |
| Z4c `deploy = Some(Atk)` nieosiągalne | Evaluator | **ODDAL** | Zgodne z pinem; wódz odrzucany wcześniej (`ManualModeNotPorted`); równoważność E06 jawna. |
| Z4d rostery liczone 2× na starcie (koszt) | Evaluator | **ODDAL** | NIE_ZMIERZONO; deterministyczne, poza wymaganiem dispatchu; ewentualnie dług wydajności. |
| Incydent wspólnego scratchpadu (log kapitulacji obcięty) | Evaluator | **ODDAL** dla tego tematu | Nie dotyczy kodu tematu; orkiestrator: powtórzyć listę mutantów tematu kapitulacji z unikalną ścieżką. |

Brak zarzutów NAPRAW. Brak spraw DO DECYZJI CZŁOWIEKA.

## 6. Długi D-1I6-*

| Dług | Stan |
|---|---|
| D-1I6-SETUP | ZAMKNIĘTY (producent `battle_setup` w silniku, klient bez `compose_siege_battle_setup`) |
| D-1I6-ERR | ZAMKNIĘTY (`SiegeBattleErrorDto` kod + dane w `BridgeError.siegeBattle`; klient `Engine(SiegeBattleErrorDto)`) |
| D-1I6-ORPHAN | ZAMKNIĘTY (błąd sceny klienta → `AbortSiegeBattle`, test E2E przez prawdziwy most) |
| D-1I6-ABORT-E2E | ZAMKNIĘTY (`phase = aborted` przez most; reguła wg pinu do końca bitwy) |
| D-1I6-DOC | ZAMKNIĘTY |
| D-1I6-FIXTURE | ZAMKNIĘTY |
| D-1I6-SPAWN-FACING | ZAMKNIĘTY |
| D-1I6D-5 (nowy) | ZOSTAJE: przycisk „Wycofaj się” gracza w UI bitwy klienta (komenda silnika gotowa) |
| D-1I6-RENDERER-GATE | ZOSTAJE (własna bramka renderera przy ≥ 12 GB) |
| D-1I6D-NOWALL | ZOSTAJE (informacyjny) |

## 7. Noty dla integracji

1. Powtórzyć bramki na drzewie scalonym z `e1f61c503` (merge-tree czysty, ale bramki FC liczone na kodzie tematu).
2. Bramka własna renderera przy ≥ 12 GB (D-1I6-RENDERER-GATE).
3. Wpis do `REJESTR-RUST.md`: decyzja techniczna D-1I6D-4 (odmowa porzucenia po `Finished`) w poprawionym brzmieniu.

## 8. Sprzątanie

`fc-1i6d-target`, `fc-1i6d-ctarget`, `fc-1i6d-mtarget` usunięte; dysk po bramkach ok. 6.3 GB wolnego. Brak push,
integracji i deployu.
