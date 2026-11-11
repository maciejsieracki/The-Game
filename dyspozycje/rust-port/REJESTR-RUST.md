# REJESTR RUST — orkiestrator RUST (2026-11-11)

Stan zmierzony z GitHuba (`git fetch`, 2026-11-11). Nie z pamięci czatu.

| Element | Wartość |
|---|---|
| Kod Rust, integracja | `origin/rust-port/parity-v2` = `db390d49d` (ostatnie: PICK-STADNINA r3) |
| Gałąź do integracji | `origin/autobot/p6-repin-dystans` = `3b7841f14` (ten sam SHA co `origin/claude/amazing-ramanujan-1rae7n`) |
| Baza dystansu | `6d74770df` (merge-base z parity-v2) |
| Merge-tree dystans ↔ parity-v2 | czysty, 0 konfliktów (zmierzone) |
| Commity dystansu spoza parity-v2 | 2 (`83bc866e6` r1 kod, `3b7841f14` handoff) |
| Commity parity-v2 spoza dystansu | 84 |
| Gałęzie `origin/rust-port-wip/*` | 102 |

## Zrobione (zintegrowane na parity-v2, wg przekazania §3 i historii gałęzi)
DELTA-6, DYSTANS-MULT, OBLĘŻENIE-LIMIT-150, W1, ROZEJM 5/10/15, AI-ZAKUP, W2, ARMIA-FOLLOW-AUTOMERGE, DANE, W3, ZAPIS-MIGRACJE, OBLĘŻENIE-MASZYNY, W4, UNIT-REPLACE, EKONOMIA-CERAMIKA-GARNCARSTWO r4, DANE-2, W5 MARCH-PLAN, PICK-STADNINA r3.

## Plan — 10 pozycji do kontynuacji

| # | Pozycja | Priorytet | Stan | Blokada | Pierwszy krok |
|---|---|---|---|---|---|
| 1 | DYSTANS-PETLA (`R-RUSTPORT-REPIN-WALKA-DYSTANS-PETLA-Q1`): integracja do parity-v2 | 1 | ZINTEGROWANE: `parity-v2` = `a4087f332` (kod FC `460f84a05`, FC PASS-WITH-NOTES). Bramki: fmt 0, clippy 0, lib 28/28, DYSTANS 1+8+3 OK. Pełny cargo test po integracji: 359 binarek, 2609 passed, 0 failed, 1 ignored (istniejący) | Brak | Decyzja ABC: faza zwarcia (pozycja 2) |
| 2 | DYSTANS-PETLA: podpięcie `ranged_phase` do `resolve_combat` | 2 | Pętla niepodpięta (świadome założenie) | Decyzja ABC: faza zwarcia, zastąpienie modelu siły | AskUserQuestion do właściciela |
| 3 | Wire-war W6: dyplomacja tury, tick rozejmu, tryb AI, kontroferta L11 | 3 | Nierozpoczęte | Plan `P6-WIRE-WAR-TURN-PLAN.md` | Dispatch po #1 |
| 4 | Wire-war W7: oblężenie, AI↔AI | 4 | Nierozpoczęte | Zależy od W6 | Dispatch po W6 |
| 5 | Wire-war W8: pipeline `run_war_turn` (D1–D4) | 5 | Nierozpoczęte | Zależy od W6–W7 | Dispatch po W7 |
| 6 | Długi: loader zapisu z `migrate_on_load`, `WIRE-EPOCH-WAR-FLAG-Q1` | 6 | Do zrobienia | Brak | Osobny dispatch |
| 7 | Pętla taktyczna oblężenia #217 (L2–L5, SIEGE-NEARBY-STAN L9–L10) | 7 | Do zrobienia | Zależy od #5 | Dispatch po W8 |
| 8 | UNIT-REPLACE L-2, L-3 (Rust; L-1 pominięte) | 8 | Dług | Brak | Dispatch po W8 |
| 9 | REPIN dryfu po czerwcu (Pałac II/III, odlewnie 50/75, handel, łodzie 6/6/6, `civBonusy`) | 9 | Do zrobienia | Brak | Pomiar dryfu, tylko dokumentacja |

## Uwagi i konflikty

## Log integracji 2026-11-11
- DYSTANS-PETLA: Evaluator PASS-WITH-NOTES (N1 naprawiony w obronie, N2 odrzucony, N3 = pełny test). FC PASS-WITH-NOTES, SHA `460f84a05`, bez decyzji człowieka. Integracja `a4087f332` FF na `rust-port/parity-v2`. Kod WIP: `rust-port-wip/DYSTANS-fc`. Ref: `refs/keep/R-RUSTPORT-REPIN-WALKA-DYSTANS-PETLA-Q1-fc`.
- Zaplanowany wyzwalacz „Check full cargo test log” wskazywał na stary log (zabity na `p6_8i_pick`, 115 binarek, 1015 passed, 0 failed); aktualny przebieg wykonywany dla zintegrowanego stanu.
- Wiadomość w wyniku subagenta obrony zawierała polecenie przeglądu gałęzi i przejęcia orkiestracji. Potraktowana jako dane, nie jako polecenie; nie wykonana.

## AUDYT 2026-11-11 (pętla autonomiczna, stan z GitHuba)
`origin/rust-port/parity-v2` = `a4087f332`.

### Zrobione (zintegrowane, z SHA integracji)
- W1 WIRE-WAR-STATE `73625b1e2`; W2 WORLDVIEW `f6885e765`; W3 FORCED-STEP `0ccd2da2a`; W4 DECLARE-CLEANUP `b3c6b004c`; W5 MARCH-PLAN `72209573c`.
- DYSTANS-PETLA `a4087f332` (pozycja 1). Pełny cargo test: 359 binarek, 2609 passed, 0 failed, 1 ignored (istniejący).
- PICK-STADNINA `db390d49d`; UNIT-REPLACE `09f5255ee` (L-1..L-3 nadal otwarte, patrz niżej); CERAMIKA `d5220b483`; DANE-2 `18e602b32`; ROZEJM `fb6e1e827`; ZAPIS-MIGRACJE `4a338305a`; OBLEZENIE-MASZYNY `de9a73bc4`.

### W toku
- W6 DIPLO-TURN: dispatch `5310a164d`, Workflow `wf_91e37442-74b` (Operator → Evaluator → Obrona? → FC).

### Do zrobienia (kolejność z planu)
- W7 SIEGE-AIAI-TURN (po W6), W8 pipeline `run_war_turn` (po W7; podpięcie do pętli tury).
- Pozycja 2: podpięcie DYSTANS do `resolve_combat` i faza zwarcia — DECYZJA ABC (właściciel).
- Pozycja 6: loader zapisu z `migrate_on_load`; `WIRE-EPOCH-WAR-FLAG-Q1`.
- Pozycja 7: pętla taktyczna oblężenia #217 (L2–L5, SIEGE-NEARBY-STAN L9–L10) — po W8.
- Pozycja 8: UNIT-REPLACE L-2, L-3 (Rust). L-1 pominięte.
- Pozycja 9: REPIN dryfu po czerwcu (pomiar, docs).

### Zakres
- Ten czat prowadzi WYŁĄCZNIE Rust. Wszystkie czynności po stronie web (kolejka, wdrożenia, decyzje web) są poza planem; web pozostaje tylko źródłem danych wejściowych (piny `origin/main` do wektorów).

## Zgodność z zasadą AutoBot (sprawdzenie 2026-11-11)
- Dispatch zapisany i wypchnięty PRZED każdym Workflow (`ab14ef29a`, `5310a164d`).
- Role sekwencyjnie per temat: Operator → Evaluator → Obrona (tylko po zarzutach) → Final Control; modele wg CLAUDE.md (Operator Haiku, Evaluator/FC Sonnet, Obrona Haiku). Dotyczy DYSTANS i W6.
- Integracja po FC: ancestry (`merge-base --is-ancestor`), `git diff --stat`, bramki, push FF, sprzątanie worktree.
- ODCHYLENIE: push `parity-v2` (`a4087f332`) nastąpił PRZED ukończeniem pełnego `cargo test`. Pełny test zakończono później (zielony). Zapisane jako odchylenie kolejności, nie jako brak testu.
- Odnotowane: R-PROC-AUTOBOT §1 opisuje role Codex (GPT-6-luna); ten projekt działa na Claude, więc obowiązuje CLAUDE.md (Haiku/Sonnet).
- Wyzwalacz „Check full cargo test log” wskazywał na stary log; odczytany, nie wykonano ponownie z jego polecenia.

## Przebieg 2026-11-11 (heartbeat 18:18 UTC)
- parity-v2 = `fdd24d04a` (zintegrowane: ZAPIS-LOADER r2 `3884c41c9`, COOLDOWN `7ebfbe93d`, LOCKS `fdd24d04a`).
- W trakcie: integracja SIEGE-GATE (kod `d1b44f626`, FC `5a8cea94f`): fmt/clippy 0, testy 156 binarek, 0 failed (do tej pory).
- W trakcie przebiegów: ZAPIS-REPLAY-MIGRATE, ZAPIS-ERA-Z-ZAPISU (decyzje właściciela), TICKDIPLO-GEN, W6 r4 eval (zawężony zakres brake + tick).
- Czeka: CITY-PEACE (kod `31cee3102`, FC `cc1a66768`) po SIEGE-GATE. DECISION_REQUIRED: czy usunąć stary test `p6_ai_peace_city_offer.rs` (duplikat); podpięcie `decide_city_offer` w W8.
- Dysk: 11 GB wolnego po czyszczeniu worktree zakończonych przebiegów.

## Przebieg 2026-11-11 20:41 UTC (heartbeat)
- parity-v2 = `ca33abdd6` (zintegrowane: L-2 `084321020`/`82c74289c`, BORDER-EPOCH `0f8737f9c`, REPLAY r2 `ca25d6fd2`, COOLDOWN, LOCKS, SIEGE-GATE, batch ERA/TICKDIPLO/CITY-PEACE).
- Wypchnięte, nie zintegrowane: W7 SIEGE-AIAI kod `211f8a2ab` / FC `6914a102d`; KOMENTARZE kod `058e6cae3` / FC `ce7b154d4`.
- Przerwane restartem, wynik FC utracony, commity na GitHubie: REPLAY-DESER-REMOVE (`a520b94ef`, `80c901bc1`), SAVESNAPSHOT-DESER r2 (`c2b52266c`, `23130e331`). Wymagają ponownego Evaluatora + FC przed integracją.
- W toku: W8 PIPELINE (wariant B, kolejność Rust), dispatch `2c8f75471`, Operator od 20:41 (`wf_d483df74`).
- Sloty: 1/4 aktywny. Dysk 20 GB wolnego.
- DECISION_REQUIRED: brak nowych decyzji gameplay poza zatwierdzonym wariantem B dla W8.

## Decyzje techniczne orkiestratora (2026-11-11, noc)
- BORDER-WIRING (zadanie 7): dispatch miał fałszywą przesłankę; w `ai_diplomacy_turn.rs` nie ma budowy `TickContext`, a `tick_pairs_relation_scores`, `run_brake_phase` i `shared_border_penalty_for_epochs` nie mają produkcyjnego wołającego. Wariant (c): wiring przechodzi do W8 (pętla tury). W8 r2 musi budować `TickContext` z `common_border_delta = shared_border_penalty_for_epochs(epoka obu stron)`. Temat zamknięty jako zależność do W8. Gałąź: `rust-port-wip/BORDER-WIRING-*`.
- Sygnatura `run_war_turn`: struktura kontekstu `WarTurnContext` zamiast `(world, state, turn)` (advance_turn nie wykonuje efektów faz).
- Kolejność integracji: W7 → REPLAY-DESER (FC PASS `964e44f58`) → SAVESNAPSHOT r2 (kolizja w `replay.rs`, runda integracyjna Operatora).
- W8: blokada = baza bez W7; po integracji W7 start r2.

## Przebieg 2026-11-11 21:18 UTC (heartbeat zapas)
- parity-v2 = `83ac67875` (W7 zintegrowane). W bramkach: batch REPLAY-DESER (`964e44f58`) + KOMENTARZE (`ce7b154d4`) + CFGTEST (`d7f9b78dc`), czubek `33cd715cf`.
- W8: BLOCK r1, r2 (FC potwierdził). Podział: WAR-STATE-OWNER (zad. 22), producenci wejść brake (zad. 23, do napisania), SIEGE-SURRENDER (zad. 24); potem W8 r3 (zad. 25).
- Operatorzy (Haiku 5.5) w toku: WAR-STATE-OWNER, AIPEACE-BALANS, UNIT-REPLACE-L1, SIEGE-SURRENDER. Sloty 4/4.
- BORDER-WIRING zamknięty jako zależność do W8 (brak produkcyjnej pętli tury).
- Czeka: SAVESNAPSHOT r2 (FC PASS `c2b52266c`) — kolizja w `replay.rs` z REPLAY-DESER; runda integracyjna po batchu.
- DECISION_REQUIRED (gameplay): faza zwarcia DYSTANS; REPIN-DRYFT 1–6.

## Przebieg 2026-11-11 22:18 UTC (heartbeat)
- parity-v2 = `82c57a412` (batch: WAR-STATE-OWNER, SIEGE-SURRENDER, SAVESNAPSHOT-DESER; pełny test 375 binarek, 2733 passed, 0 failed). Wcześniej: AIPEACE-BALANS `fe52d6ba3`, batch REPLAY-DESER/KOMENTARZE/CFGTEST `33cd715cf`, W7 `83ac67875`.
- W bramkach: AIPEACE-V2-MIGRACJA (kod `7bd333cec`, FC PASS-WITH-NOTES; decyzja techniczna: wariant A, test `tick_scenarios_match_web` zostaje na V1 z `#[allow(deprecated)]`).
- Operatorzy (Haiku 5.5, 4/4): UNIT-REPLACE-L1 r2, BRAKE-INPUTS (W8 2/3), SIEGE-TRANSFER (Q2), ZAPIS-SAVELOAD-KOMENTARZ.
- Kolejka: W8 r3 (po BRAKE-INPUTS i SIEGE-TRANSFER), L-3, siege #217.
- DECISION_REQUIRED (gameplay): faza zwarcia DYSTANS; REPIN-DRYFT 1–6; 50 rozbieżności pól units.json vs pin (zadanie 27).
