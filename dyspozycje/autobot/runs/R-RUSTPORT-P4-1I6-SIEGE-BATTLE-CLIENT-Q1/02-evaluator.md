# R-RUSTPORT-P4-1I6-SIEGE-BATTLE-CLIENT-Q1: Evaluator r1 (adwersarialny)

```text
STATUS: FAIL
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1I6-SIEGE-BATTLE-CLIENT-Q1 (#371, klient: wołający komend bitwy oblężniczej)
GOAL: klient (rust-port/client) jest produkcyjnym wołającym StartSiegeStorm / StepSiegeBattle / SkipSiegeBattle /
      FinishSiegeBattle i karmi nimi odtwarzanie bitwy w rendererze (headless, gpu OFF); E2E przez most
ZMIANY/COMMIT: oceniany kod = 83ef14fba (gałąź rust-port-wip/p4-1i6-siege-battle-client, baza a5fdb91b8);
               Evaluator dodaje tylko ten raport
TESTY: §2 (bramki klienta i silnika EXIT 0; bramka renderera nie odtworzona: dysk); mutanty Evaluatora §4
BLOKADY: 9 nierównoważnych mutantów przeżyło na nowych gałęziach (§4); 1 defekt logiki (§3 Z1), 1 niespójność
         stanu (§3 Z2)
RUNDY: 1/5
NASTĘPNY KROK: Operator r2 (ta sama baza a5fdb91b8 / gałąź operatora 83ef14fba), lista poprawek §5
DEPLOY/PUSH: NIE WYKONANO
```

## 1. Zakres i pochodzenie

* Dispatch: `origin/claude/rust-sivvrn:dyspozycje/autobot/runs/R-RUSTPORT-P4-1I6-SIEGE-BATTLE-CLIENT-Q1/00-dispatch.md`.
* BAZA: `origin/rust-port/parity-v2` = `a5fdb91b8712074bf790b423888d46d39114eb23` (zgodna z dispatchem i raportem
  Operatora); `git merge-base --is-ancestor a5fdb91b8 83ef14fba` = prawda.
* Commity nad bazą: `ace976672`, `2855fc698`, `da87d95e1`, `83ef14fba`.
* Pliki (`git diff --name-only a5fdb91b8 83ef14fba`): `rust-port/client/src/lib.rs`,
  `rust-port/client/tests/siege_battle_client.rs`, `dyspozycje/.../01-operator-r1.md`, `01-operator-mutanty.py`.
  Wszystko w allowliście. „Pliki spoza allowlisty”: brak. `engine/*`, `renderer/*`, `view-model/*`, `src-tauri`,
  `gra/`, `Cargo.*` bez zmian.
* `#[ignore]` w nowych testach: 0. `git diff --check a5fdb91b8 83ef14fba`: czysto. Trailery: brak `Co-Authored-By`.

## 2. Bramki odtworzone (CARGO_INCREMENTAL=0, DEBUG=0, własny `CARGO_TARGET_DIR` w scratchpadzie, usunięty)

| Bramka | Wynik |
|---|---|
| `client`: `cargo fmt --all -- --check` | EXIT 0 |
| `client`: `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| `client`: `cargo test --all-targets --no-fail-fast` | EXIT 0 — lib 0, `engine_bridge_renderer` 18 passed, `siege_battle_client` 15 passed |
| `renderer`: `cargo fmt --all -- --check` | EXIT 0 |
| `renderer`: clippy `-D warnings` + `battle_playback_*` | NIE WYKONANO — wolny dysk 6.8–7.6 GB < 12 GB (reguła dispatchu) i równoległy build innego workera (`pin3-obrona`). Renderer bez zmian w diffie (0 plików), kompiluje się jako zależność klienta; ryzyko niskie, ale bramka do odtworzenia przez FC |
| `engine`: `bridge_contract` / `p6_k5loop_wiring_b` / `p6_k5loop_wiring_b_pin` | 10 / 15 / 2 passed, ENG_EXIT=0 |
| Pełny `cargo test` engine | NIE WYKONANO — engine bez zmian w diffie; dispatch wymaga tylko testów dotkniętych |

## 3. Zarzuty merytoryczne (kod)

**Z1 (defekt logiki D-1I6-3b, `compose_siege_battle_setup`).** Flaga `on_wall_walkway` spawnu dla jednostki, której
PIERWSZĄ akcją startu zmieniającą komórkę jest `Move`, jest brana z ramki startu (`wall.unwrap_or(fu_wall)`), czyli ze
stanu PO wszystkich akcjach startu. Jeśli w tej samej odpowiedzi startu jednostka robi `Move`, a potem `ClimbWall`
(albo obrońca `Move` po murze, potem `LeaveField`), spawn dostaje flagę po wspinaczce/zejściu przy komórce sprzed
ruchu — dokładnie ten błąd, który D-1I6-3b miał wykluczyć dla komórki. Poprawnie: flaga sprzed PIERWSZEJ akcji
zmieniającej flagę (`ClimbWall` → false, `LeaveField` → true), inaczej ramka. Żaden test nie pokrywa `Move` + zmiany
muru na starcie (mutanty E13, E14 przeżyły).

**Z2 (niespójność stanu, `on_session_created`).** Zeruje `battle` i `battle_end`, ale NIE `battle_closed`:
po `CreateSession` (nowa gra) `last_siege_battle_view()` dalej zwraca scenę bitwy z poprzedniej sesji, a
`last_siege_battle_end()` = `None` — dwa akcesory „ostatniej bitwy” są ze sobą sprzeczne. Test
`nowa_sesja_porzuca_bitwe` sprawdza tylko `siege_battle()` i `last_siege_battle_end()`. Analogicznie `start` zeruje
`battle_closed`, ale nie ma na to testu (E08 przeżył).

**Z3 (odnotowane, nie blokuje samo).** Błąd `Setup`/`Adapter` w `start_siege_storm` zostawia bitwę otwartą w
silniku, a klient nie ma bitwy, więc `Skip`/`Finish` przez API klienta zwracają `NoBattle` — jedyną drogą zamknięcia
jest wołający poza klientem. Dokumentacja metody to mówi; FC/orkiestrator: zapisać jako dług albo dodać w r2 ścieżkę
porzucenia (np. `Finish`/`Skip` bez sceny).

**Z4 (odnotowane).** Wymaganie dispatchu „`CreateSession` → szturm przez klienta” zrealizowane przez
`CivEngineAdapter::from_game` (scenariusz startowy `CreateSession` nie ma miasta wroga; brak `Load`, #375); sam
`CreateSession` sprawdzony osobno (`create_session_i_bledy_startu`). Uzasadnienie przyjmuję; do potwierdzenia przez
orkiestratora jako odchylenie od literalnego GOAL 3.

Zgodność z webem (pin `07d2fbd72`, `git show`): `afterSiegeUi` (`main.ts:36628-36688`) — kolejność gałęzi
zdobycie → `stormCaptureBlocked` → `obronca` → `remis` → brak gałęzi zgodna z `SiegeAfterUi::of`; `clearBattleUiState`
(`:36904-36908`), `bs.play` → `finishSiegeStormBattle` → `afterSummary` (`:37019-37033`) zgodne z opisem D-1I6-5.
Kontrakt `check_order` (`renderer/src/battle/playback.rs:584-625`) odtworzony wiernie w `StreamOrder` (+ `NaN`).

## 4. Mutanty Evaluatora (23, `cargo test --test siege_battle_client`, plik przywrócony, `git status` czysty)

Mutanty Operatora (M01–M22) przyjmuję jako opisane; poniższe są nowe, celujące w gałęzie, których M01–M22 nie ruszały.

| ID | Mutacja | Werdykt |
|---|---|---|
| E01 | `wall_clock += wall_ms` usunięte (zegar etykiet `vLastWall` = 0) | **PRZEŻYŁ** |
| E02 | `skipped = true` usunięte | **PRZEŻYŁ** |
| E03 | `last_frame` nie zapisywane | **PRZEŻYŁ** |
| E04 | po bitwie `unit_selected_after_build_open` nie czyszczone | **PRZEŻYŁ** |
| E05 | po bitwie `force_visible_unit_id` zostaje | ZABITY `stan_ui_po_bitwie` |
| E06 | `Aborted` bez wyjścia UI | ZABITY `aborted_sprzata_bitwe` |
| E07 | start nie zeruje `battle_end` | ZABITY `aborted_sprzata_bitwe` |
| E08 | start nie zeruje `battle_closed` | **PRZEŻYŁ** |
| E09 | `Finish` bez `result` → błąd zamiast `Aborted` | **PRZEŻYŁ** |
| E10 | `afterSiegeUi`: remis → odparty | ZABITY `after_siege_ui_galezie` |
| E11 | `afterSiegeUi`: zdobycie bez `capture.captured` | ZABITY `after_siege_ui_galezie` |
| E12 | spawn z OSTATNIEJ akcji zmieniającej komórkę zamiast pierwszej | **PRZEŻYŁ** |
| E13 | `Move`: flaga muru spawnu zawsze false | **PRZEŻYŁ** (por. Z1) |
| E14 | `LeaveField`: flaga muru z ramki zamiast `true` | **PRZEŻYŁ** (por. Z1) |
| E15 | start z `Rout`/`Shaken` dopuszczony | **PRZEŻYŁ** |
| E16 | `player_side` = Def | ZABITY `setup_sceny_z_odpowiedzi_startu` |
| E17 | `siege` = false | ZABITY (7 testów) |
| E18 | wyjście UI zawsze `on_state_changed` (także `Aborted`) | przeżył — praktycznie równoważny w źródle skryptowym (liczba klatek ta sama); słabość testu, nie wymagam |
| E19 | licznik odpowiedzi nie liczony | ZABITY |
| E20 | nieznana strona → Atk | ZABITY `setup_sceny_z_odpowiedzi_startu` |
| E21 | `fed?` w `Finish` zignorowany | błąd kompilacji (nie liczę) |
| E22 | `feed`: faza ustawiana przed strażnikiem (odrzucona odpowiedź zmienia fazę) | **PRZEŻYŁ** |
| E23 | `tower_projectile` zignorowany | ZABITY (6 testów) |

Nierównoważne przeżyte: **E01, E02, E03, E04, E08, E09, E12, E13, E14, E15, E22** (11; E02/E03 to akcesory
publicznego API bez żadnej asercji). Najważniejsze: E12–E15 (decyzja D-1I6-3b ma tylko ścieżkę „pierwsza akcja =
`Move`/`ClimbWall`” i odrzucenie `Damage`/`Kill`; `LeaveField`, `Leave`, `Shaken`, `Rout` i reguła „pierwsza, nie
ostatnia” niepokryte), E01 (zegar ścienny przekazywany do `play_until` niepokryty — test porównuje tylko liczbę
etykiet), E09 (gałąź D-1I6-5 `Finish` bez wyniku niepokryta), E22 (kontrakt „naruszenie zgłaszane zanim zmieni się
stan” — faza widoku nie jest asertowana po `Order`).

## 5. Wymagane w r2 (Operator)

1. Z1: poprawić wybór flagi muru spawnu (flaga sprzed pierwszej akcji zmieniającej flagę) + test syntetyczny
   (`Move` → `ClimbWall` i `Move` → `LeaveField` w odpowiedzi startu).
2. Z2: `on_session_created` zeruje `battle_closed`; test sprawdza `last_siege_battle_view().is_none()` po nowej sesji
   i po nowym starcie.
3. Testy zabijające E01 (np. czasy startu etykiet `pb.labels()` vs. akumulowany zegar), E02/E03 (asercje akcesorów),
   E04 (ustawić `unit_selected_after_build_open = true` przed bitwą), E09 (`Finish` bez `result` w źródle skryptowym),
   E12 (dwie akcje zmieniające komórkę jednej jednostki), E14/E15 (`LeaveField`, `Leave`, `Shaken`, `Rout` na starcie),
   E22 (faza po `Order` bez zmian albo przenieść ustawienie fazy za strażnik — już jest; asercja).
4. Ponowić skrypt mutantów z E01–E23 dopisanymi; każdy zabity albo jawnie równoważny z uzasadnieniem.
5. Bramka renderera (fmt, clippy `-D warnings`, `battle_playback_*`) przy ≥ 12 GB wolnego.

## 6. Długi (bez zmian względem Operatora + nowe)

* D-1I6-SETUP, D-1I6-ERR, D-1I6-ABORT-E2E, D-1I6-FIXTURE, D-1I6-SPAWN-FACING — przyjęte jako długi.
* Nowy: D-1I6-ORPHAN (Z3) — bitwa silnika osierocona po błędzie `Setup`/`Adapter` startu.
* Skrypt mutantów Evaluatora: `02-evaluator-mutanty.py` (ten katalog; uruchamiać z `rust-port/client`).
