# R-RUSTPORT-P4-1I6-SIEGE-BATTLE-CLIENT-Q1: obrona Operatora r1 (odpowiedź na 02-evaluator.md)

```text
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1I6-SIEGE-BATTLE-CLIENT-Q1 (#371, klient: wołający komend bitwy oblężniczej)
GOAL: klient (rust-port/client) jest produkcyjnym wołającym StartSiegeStorm / StepSiegeBattle / SkipSiegeBattle /
      FinishSiegeBattle i karmi nimi odtwarzanie bitwy w rendererze (headless, gpu OFF); E2E przez most
ZMIANY/COMMIT: gałąź lokalna rust-port-wip/p4-1i6-siege-battle-client-obrona-r1 nad 12b7b7c35 (raport Evaluatora)
               nad 83ef14fba (kod Operatora r1) nad bazą a5fdb91b8. Pliki: rust-port/client/src/lib.rs,
               rust-port/client/tests/siege_battle_client.rs, ten katalog (02a-obrona.md, 02a-obrona-mutanty.py).
               SHA: patrz §6.
TESTY: client fmt/clippy -D warnings/test EXIT 0 (lib 0, engine_bridge_renderer 18, siege_battle_client 18);
       mutanty 29/29 zabite (E01–E23 Evaluatora + O24–O28 nowe), §3
BLOKADY: bramka renderera NIE WYKONANA (wolne 5.6–6.3 GB < 12 GB z dispatchu; renderer bez zmian w diffie)
RUNDY: 1/5 (obrona po Evaluatorze r1)
NASTĘPNY KROK: Final Control (z odtworzeniem bramki renderera przy >= 12 GB wolnego)
DEPLOY/PUSH: NIE WYKONANO
```

## 1. Odpowiedzi na zarzuty

| # | Zarzut | Odpowiedź | Dowód |
|---|---|---|---|
| Z1 | flaga muru spawnu z ramki, gdy pierwszą akcją zmieniającą komórkę jest `Move` (Move→ClimbWall, Move→LeaveField) | **PRZYJMUJĘ** | `compose_siege_battle_setup`: komórka i flaga cofane OSOBNO. Komórka = `from` pierwszej akcji zmieniającej komórkę (`Move`/`ClimbWall`/`LeaveField`); flaga = flaga sprzed PIERWSZEJ akcji zmieniającej flagę (`ClimbWall` → false, `LeaveField` → true); `Move` flagi nie zmienia, więc bez takiej akcji zostaje flaga ramki. Test `setup_spawn_komorka_i_mur_przed_akcjami_startu`: Move→ClimbWall (ramka true → spawn false), Move→LeaveField (ramka false → spawn true), sam Move (flaga ramki), sam LeaveField, ClimbWall→LeaveField (pierwsza zmiana wygrywa), dwa Move (pierwsza komórka). Mutant O24 = dokładnie logika r1 → ZABITY |
| Z2 | `on_session_created` nie zeruje `battle_closed`; brak testu zerowania przy starcie (E08) | **PRZYJMUJĘ** | `on_session_created` zeruje `battle`, `battle_end` i `battle_closed`. Test `ostatnia_bitwa_po_nowej_sesji_i_nowym_starcie`: po zamkniętej bitwie nowy start → `last_siege_battle_view()` i `last_siege_battle_end()` = None; po nowej sesji oba None. `nowa_sesja_porzuca_bitwe` sprawdza też `last_siege_battle_view()`. E08 i O25 → ZABITE |
| M | 11 przeżytych mutantów Evaluatora (E01, E02, E03, E04, E08, E09, E12, E13, E14, E15, E22) | **PRZYJMUJĘ** | wszystkie zabite, a także E18 (Evaluator uznał go za praktycznie równoważny; dodałem asercję). Szczegóły §2–§3 |
| R | bramka renderera nie odtworzona | **PRZYJMUJĘ jako blokadę, nie do zamknięcia w tej rundzie** | wolne 5.6–6.3 GB (`df -h /`), dispatch wymaga >= 12 GB i braku równoległych buildów renderera. Renderer bez zmian w całym diffie tematu (`git diff --name-only a5fdb91b8 HEAD -- rust-port/renderer` = pusto); renderer kompiluje się jako zależność klienta i `cargo clippy --all-targets -D warnings` klienta sprawdza go jako zależność (bez lintów crate'u renderera). Do odtworzenia przez FC |
| Z3 | D-1I6-ORPHAN: błąd `Setup`/`Adapter` w `start_siege_storm` zostawia bitwę otwartą w silniku | **PRZYJMUJĘ jako dług** (bez zmiany kodu) | zamknięcie bitwy silnika po błędzie setupu wymaga nowej ścieżki API (Skip/Finish bez sceny) albo komendy porzucenia w moście (`engine/*` poza allowlistą). Web nie ma tej gałęzi (scena powstaje zawsze przed `bs.play`), więc to decyzja techniczna orkiestratora; dokumentacja metody to opisuje. Dług D-1I6-ORPHAN zapisany w §5 |
| Z4 | E2E przez `CivEngineAdapter::from_game`, nie przez `CreateSession` | **PODTRZYMUJĘ uzasadnienie** (bez zmiany) | scenariusz `CreateSession` nie ma miasta wroga, a mostu nie da się załadować stanem bez `Load` (#375); `CreateSession` sprawdzony osobno w `create_session_i_bledy_startu`. Do potwierdzenia przez orkiestratora |

## 2. Nowe / zmienione testy (`rust-port/client/tests/siege_battle_client.rs`)

| Test | Zabija |
|---|---|
| `storm()` (wszystkie E2E): `wall_clock()` = suma kroków; `skipped()` = ścieżka Pomiń; `last_frame()` = ostatnia ramka źródła; każda etykieta (`DamageLabel.label.start`) startuje w zegarze ściennym jednej z odpowiedzi, a przy krokach rzeczywistych co najmniej jedna > 0 | E01, E02, E03 |
| `stan_ui_po_bitwie`: przed bitwą `unit_selected_after_build_open = true` | E04 |
| `ostatnia_bitwa_po_nowej_sesji_i_nowym_starcie` (nowy), `nowa_sesja_porzuca_bitwe` (+ asercja) | E07, E08, O25 (Z2) |
| `finish_bez_wyniku_to_aborted` (nowy): `Finish` bez `result` → `Aborted { reason: "finish answer without a result" }`, ekran zostaje, jedno odświeżenie | E09 |
| `setup_spawn_komorka_i_mur_przed_akcjami_startu` (nowy) | E12, E13, E14, E15 (Damage/Kill/Leave/Rout/Shaken), O24, O26, O27, O28 (Z1) |
| `naruszenie_kolejnosci_odrzucone_przed_scena`: odrzucona odpowiedź ma `phase = Finished`; po `Order` faza = Running, Pomiń dostępny | E22 |
| `aborted_sprzata_bitwe`: drugie `Aborted` bez zmiany UI → zero żądań ramki | E18 |

## 3. Mutanty (skrypt `02a-obrona-mutanty.py` = skrypt Evaluatora + wzorzec E12 dopasowany do kodu r2 + O24–O28)

Uruchomienie z `rust-port/client`, `cargo test --test siege_battle_client`, plik przywrócony po każdym, `git status` czysty.

| ID | Mutacja | Werdykt (testy) |
|---|---|---|
| E01 | zegar `wall_clock` nie akumulowany | ZABITY (5 testów E2E) |
| E02 | `skipped` nie ustawiane | ZABITY (`e2e_pomin_i_determinizm`, `after_siege_ui_galezie`) |
| E03 | `last_frame` nie zapisywany | ZABITY (5) |
| E04 | `unit_selected_after_build_open` zostaje | ZABITY `stan_ui_po_bitwie` |
| E05 | `force_visible_unit_id` zostaje | ZABITY `stan_ui_po_bitwie` |
| E06 | `Aborted` bez wyjścia UI | ZABITY `aborted_sprzata_bitwe` |
| E07 | start nie zeruje `battle_end` | ZABITY (2) |
| E08 | start nie zeruje `battle_closed` | ZABITY `ostatnia_bitwa_po_nowej_sesji_i_nowym_starcie` |
| E09 | `Finish` bez wyniku → błąd | ZABITY `finish_bez_wyniku_to_aborted` |
| E10 | remis → odparty | ZABITY `after_siege_ui_galezie` |
| E11 | zdobycie bez `captured` | ZABITY `after_siege_ui_galezie` |
| E12 | spawn z ostatniej akcji zmieniającej komórkę | ZABITY `setup_spawn_…` |
| E13 | `Move`: flaga muru zawsze false | ZABITY `setup_spawn_…` |
| E14 | `LeaveField`: flaga z ramki | ZABITY `setup_spawn_…` |
| E15 | `Rout`/`Shaken` na starcie dopuszczone | ZABITY `setup_spawn_…` |
| E16 | `player_side` = Def | ZABITY `setup_sceny_z_odpowiedzi_startu` |
| E17 | `siege` = false | ZABITY (9) |
| E18 | wyjście UI po `Aborted` zawsze `on_state_changed` | ZABITY `aborted_sprzata_bitwe` (osobne uruchomienie po dopisaniu asercji) |
| E19 | licznik odpowiedzi nie liczony | ZABITY (2) |
| E20 | nieznana strona → Atk | ZABITY `setup_sceny_z_odpowiedzi_startu` |
| E21 | `fed?` w `Finish` zignorowany | błąd kompilacji (nie liczę jako zabity testem; jak u Evaluatora) |
| E22 | faza ustawiana przed strażnikiem | ZABITY `naruszenie_kolejnosci_odrzucone_przed_scena` |
| E23 | `tower_projectile` zignorowany | ZABITY (8) |
| O24 | Z1 cofnięte (logika r1: flaga z pierwszej akcji zmieniającej komórkę albo z ramki) | ZABITY `setup_spawn_…` |
| O25 | Z2 cofnięte (nowa sesja nie zeruje `battle_closed`) | ZABITY `ostatnia_bitwa_…` |
| O26 | flaga z OSTATNIEJ akcji zmieniającej flagę | ZABITY `setup_spawn_…` |
| O27 | flaga spawnu zawsze z ramki | ZABITY (2) |
| O28 | `Damage` na starcie dopuszczony | ZABITY `setup_spawn_…` |

Wynik: 27 zabitych testem + E21 (kompilacja) + 0 przeżytych. Log: przebieg E01–O28 w jednym uruchomieniu (EXIT=0), E18
osobno po dopisaniu asercji.

## 4. Bramki (CARGO_INCREMENTAL=0, DEBUG=0, `CARGO_TARGET_DIR` w scratchpadzie, usunięty po bramkach)

| Bramka | Wynik |
|---|---|
| `client`: `cargo fmt --all -- --check` | EXIT 0 |
| `client`: `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| `client`: `cargo test --all-targets --no-fail-fast` | EXIT 0 — lib 0, `engine_bridge_renderer` 18, `siege_battle_client` 18 |
| `renderer`: fmt / clippy / `battle_playback_*` | NIE WYKONANO — dysk 5.6 GB < 12 GB; renderer bez zmian w diffie tematu |
| `engine`: `bridge_contract`, `p6_k5loop_wiring_b*` | NIE WYKONANO w tej rundzie — `engine/*` bez zmian względem oceny Evaluatora (10/15/2 passed, EXIT 0 na tym samym kodzie silnika); dysk |
| `git diff --check` | czysto |
| `#[ignore]` | 0 |

## 5. Długi

* Bez zmian: D-1I6-SETUP, D-1I6-ERR, D-1I6-ABORT-E2E, D-1I6-FIXTURE, D-1I6-SPAWN-FACING.
* D-1I6-ORPHAN (Z3): bitwa silnika osierocona po błędzie `Setup`/`Adapter` startu; zamknięcie wymaga ścieżki porzucenia
  (API klienta bez sceny albo komenda mostu, `engine/*` poza allowlistą). Decyzja techniczna orkiestratora.
* D-1I6-RENDERER-GATE: bramka renderera do odtworzenia przez FC przy >= 12 GB wolnego.

## 6. Commity

* WIP: `546e81c01` (Z1, Z2, testy E01–E22).
* Końcowy: commit z tym raportem, skryptem mutantów i asercjami E15-Damage/E18 (SHA w odpowiedzi Operatora dla
  orkiestratora; gałąź lokalna `rust-port-wip/p4-1i6-siege-battle-client-obrona-r1`, bez push).
