---
name: autobot-aneks
description: >-
  Kontekst i uzasadnienie reguł C-054–C-060 (playbook.md): dlaczego rozdzielono
  DECISION_REQUIRED od BLOCK, po co domena GAME/PROCESS/INFRA/INFORMATIONAL w
  raporcie, integracja allowlist-only per hunk, weryfikacja przez git merge-base
  --is-ancestor, rejestr duplikatów tematów, watchdog liczący własny slot.
  Użyj gdy chcesz zrozumieć PO CO dana reguła istnieje, nie tylko CO nakazuje —
  civ-autobot/autobots dają mechanikę, ten skill daje incydent źródłowy każdej z nich.
---

# Aneks AutoBot 2026-08-21 — kontekst reguł C-054–C-060

Status: **SCALONE DO KANONU** (2026-08-21) — `playbook.md` C-054–C-060,
`R-PROC-AUTOBOT.md` §3a/§5, `INDEX-PROCESU.md` §6, `civ-autobot/SKILL.md`,
`autobots/SKILL.md` §7. Ten plik NIE jest źródłem prawdy — to jest
`civ-autobot`/`autobots`/`playbook.md`. Ten skill jest wyłącznie kontekstem:
dla każdej reguły podaje incydent, który ją wymusił, żeby przyszły agent
rozumiał granice zastosowania, nie tylko literę zasady.

## Po co ten aneks powstał

Retrospektywa 2026-08-20/21 wykazała, że większość zmarnowanego czasu tej
sesji nie brała się z błędów w kodzie gry, tylko z tego, że proces nie
rozróżniał: problemu procesowego (worktree/ledger/provenance) od błędu
funkcjonalnego gry; konfliktu kontraktów (wymaga decyzji właściciela) od
zwykłego FAIL (wymaga kolejnej rundy Operatora); tematu gotowego do
integracji per-hunk od tematu faktycznie zablokowanego.

## Reguły i ich incydent źródłowy

- **C-054 (`DECISION_REQUIRED` ≠ `BLOCK`, nie zastępuje turnieju C-018).**
  Incydent: `R-PRACA-PULA-NIEAKUMULUJE-Q1` (2026-08-20) — konflikt kontraktu
  globalne 0/100 vs hard floor 50% budynków. Operator próbował to rozwiązać
  kolejnymi rundami kodu zamiast eskalować. Pierwsza wersja tej reguły w
  drafcie miała lukę wykrytą przez niezależną ewaluację: uproszczony szablon
  A/B/C jednego agenta mógłby stać się cichym obejściem turnieju C-018 dla
  dokładnie tych decyzji, które on ma chronić — poprawione przed scaleniem.
- **C-055 (pole `DOMAIN` w raporcie).** Incydent: `R-REKRUTACJA-SUROWIEC-BEZ-UPKEEP-Q1`
  i `R-PRACA-MIASTO-SPLIT-BUDZET-AUTOMAT-Q1` — funkcjonalnie gotowe (testy PASS),
  ale integracja z brudnego worktree ryzykowała, że błąd provenance/worktree
  zostanie zapisany jako błąd gry.
- **C-056 (`git merge-base --is-ancestor`, nie pamięć).** Incydent:
  `R-TRZY-KARTY-WDROZENIE-Q1` — fałszywy alarm „temat zniknął w kolejnej Fali",
  bo porównanie zrobiono z pamięci zamiast komendą.
- **C-057 (rejestr duplikatów).** Incydent: `R-PRACA-MIASTO-LIMIT-50-Q1` vs
  `R-PRACA-MIASTO-SPLIT-BUDZET-AUTOMAT-Q1` — ta sama funkcja, dwa ID,
  prowadzone jako niezależne retry.
- **C-059 (integracja allowlist-only, `INTEGRATION_PENDING`).** Ten sam
  incydent co C-055 — `git add -A` na brudnym worktree zamiast wyboru
  hunków z allowlisty zablokował dwa funkcjonalnie gotowe tematy.
- **C-060 (watchdog liczy się jako slot).** Incydent:
  `R-AUTOBOT-CAPACITY-LEDGER-VS-THREAD-LIMIT-Q1` — ledger wskazywał wolny
  slot, silnik zwracał limit wątków osiągnięty.

## Znane otwarte kwestie redakcyjne (nie blokują, do pilnowania)

Pełna lista uwag z niezależnej weryfikacji (druga sesja Evaluatora) i ich
naprawa: [`dyspozycje/AUTOBOT-INSTRUKCJE-ANEKS-DRAFT-2026-08-21.md`](../../../dyspozycje/AUTOBOT-INSTRUKCJE-ANEKS-DRAFT-2026-08-21.md)
— zachowany jako pełny zapis procesu decyzyjnego, nie duplikat kanonu.
