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
| 1 | DYSTANS-PETLA (`R-RUSTPORT-REPIN-WALKA-DYSTANS-PETLA-Q1`): integracja do parity-v2 | 1 | ZINTEGROWANE: `parity-v2` = `a4087f332` (kod FC `460f84a05`, FC PASS-WITH-NOTES). Bramki: fmt 0, clippy 0, lib 28/28, DYSTANS 1+8+3 OK. Pełny cargo test: w toku (log: scratchpad/integ-full-test.log) | Pełny cargo test (NIE_ZMIERZONO do końca) | Odczyt logu pełnego testu |
| 2 | DYSTANS-PETLA: podpięcie `ranged_phase` do `resolve_combat` | 2 | Pętla niepodpięta (świadome założenie) | Decyzja ABC: faza zwarcia, zastąpienie modelu siły | AskUserQuestion do właściciela |
| 3 | Wire-war W6: dyplomacja tury, tick rozejmu, tryb AI, kontroferta L11 | 3 | Nierozpoczęte | Plan `P6-WIRE-WAR-TURN-PLAN.md` | Dispatch po #1 |
| 4 | Wire-war W7: oblężenie, AI↔AI | 4 | Nierozpoczęte | Zależy od W6 | Dispatch po W6 |
| 5 | Wire-war W8: pipeline `run_war_turn` (D1–D4) | 5 | Nierozpoczęte | Zależy od W6–W7 | Dispatch po W7 |
| 6 | Długi: loader zapisu z `migrate_on_load`, `WIRE-EPOCH-WAR-FLAG-Q1` | 6 | Do zrobienia | Brak | Osobny dispatch |
| 7 | Pętla taktyczna oblężenia #217 (L2–L5, SIEGE-NEARBY-STAN L9–L10) | 7 | Do zrobienia | Zależy od #5 | Dispatch po W8 |
| 8 | UNIT-REPLACE L-1 (awanse INFANTRY 21/23), L-2, L-3 | 8 | Dług | L-1 wymaga ustalenia z webem | Pytanie do właściciela |
| 9 | REPIN dryfu po czerwcu (Pałac II/III, odlewnie 50/75, handel, łodzie 6/6/6, `civBonusy`) | 9 | Do zrobienia | Brak | Pomiar dryfu, tylko dokumentacja |
| 10 | REPIN-DELTA-7 po zakończeniu FALI 620–626+ na web (jednostki Żelaza, administrator miasta, generał) | 10 | Czeka na web | Web nie skończony | Po sygnale z kolejki web |

## Uwagi i konflikty
- Kolejka web (`dyspozycje/KOLEJKA-WEB-PO-OBECNYCH-OPERATORACH-20261111.md`) mówi, że Rust nie startuje nowych tematów, dopóki web nie jest skończony. Przekazanie zakłada równoległe czaty. Właściciel wskazał integrację DYSTANS-PETLA jako pierwszą pozycję, więc start jest jego decyzją. Konflikt zapisany, nie rozstrzygnięty w dokumentach.
- Informacja w kolejce web, że `autobot/p6-repin-dystans` nie jest wypchnięta, jest nieaktualna (gałąź jest na GitHubie, `3b7841f14`).

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
- Pozycja 8: UNIT-REPLACE L-1 (awanse INFANTRY 21/23, zależy od decyzji webu), L-2, L-3.
- Pozycja 9: REPIN dryfu po czerwcu (pomiar, docs).
- Pozycja 10: REPIN-DELTA-7 po FALI 620–626+ na webie.

### Zakres
- Ten czat prowadzi WYŁĄCZNIE Rust. Kolejka i wersja web są poza zakresem; web jest tylko źródłem danych (piny `origin/main` do wektorów) i nie jest priorytetem tego planu.
- Pozycje 8 i 10 zależą od decyzji lub wdrożeń po stronie web: traktowane jako dane wejściowe, nie zadania tego czatu.
