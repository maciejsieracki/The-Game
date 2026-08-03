# R-AUTO-BUDOWA-LISTA — trzy tryby Budowy

**Status:** Q1–Q3 ZAPISANE · v1 **WDROŻONE (kod)** — Priorytet typów  
**Data:** 2026-08-03

## Decyzje Macieja

| ID | Odpowiedź | Treść |
|----|-----------|-------|
| **R-AUTO-BUDOWA-LISTA-Q1** | **A (doprec.)** | Tryby: Ręczny · Priorytet typów · Lista nazwana (epoka A/B/C). |
| **R-AUTO-BUDOWA-LISTA-Q2** | **A** | Na Liście: pozycja zablokowana → **pomiń i wróć później**. (Lista = fala v2) |
| **R-AUTO-BUDOWA-LISTA-Q3** | **A** | **v1 = tylko Priorytet typów**; Lista nazwana w następnej fali. |

## v1 (wdrożone)
- `budowaTryb: 'reczny' | 'priorytet'`
- `budowaPriorytetTypow: BudowaFocus[]` — wyczerp typ #1 zanim #2
- Migracja: stare `auto` + `budowaFocus` → `priorytet` + `[focus]`
- UI: chipy z numerami priorytetu 1..N; klik = dodaj/usuń typ; 👤 = ręczny

## v2 (plan)
- Tryb Lista nazwana (konkretne budynki epoki A/B/C)
- Q2: skip zablokowanych pozycji na liście
