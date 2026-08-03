# R-AUTO-BUDOWA-LISTA — trzy tryby Budowy

**Status:** WDROŻONE (kod) · Q2=A · Q3=B  
**Data:** 2026-08-03

## Decyzje Macieja

| ID | Odpowiedź | Treść |
|----|-----------|-------|
| **R-AUTO-BUDOWA-LISTA-Q1** | **A (doprec.)** | Tryby: Ręczny · Priorytet typów · Lista nazwana (epoka A/B/C). |
| **R-AUTO-BUDOWA-LISTA-Q2** | **A** | Na Liście: pozycja zablokowana → **pomiń i wróć później**. |
| **R-AUTO-BUDOWA-LISTA-Q3** | **B** | **v1 = Priorytet + Lista nazwaną razem** (nie odkładaj Listy). |

**Cytat paczki 2 pytań:** *„R-AUTO-BUDOWA-LISTA a / q3b”* → Q2=A · Q3=B.

> Korekta: wcześniejsze założenie Q3=A (tylko Priorytet) **nadpisane** odpowiedzią Macieja Q3=B.

## Zakres wdrożenia (Q3=B)

### Już w kodzie (Priorytet)
- `budowaTryb: 'reczny' | 'priorytet'`
- `budowaPriorytetTypow: BudowaFocus[]` — wyczerp typ #1 zanim #2
- UI chipy z numerami 1..N

### Do dopięcia (Lista)
- `budowaTryb: 'lista'`
- `budowaLista: string[]` — ID budynków w kolejności
- Picker Q2=A: skan od początku listy; pierwszy **legalny+affordable** → enqueue; zablokowane pomijane (wracają gdy odblokowane)
- Szablony nazwane **Lista A / B / C** (zapis w save) + **Wgraj** / **Zapisz jako** w panelu miasta
- UI: przełącznik trybu Lista + edycja kolejności (dodaj / ↑↓ / usuń)

## Poza zakresem tej fali
- Jednostki na liście
- „Wgraj do wszystkich miast”
- Gotowe szablony JSON w `gra/data/`

*Koniec · 2026-08-03.*
