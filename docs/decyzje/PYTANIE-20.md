# PYTANIE 20 — Targowisko (Rynek)

**Status:** 🟢 **WDROŻONA** (bez dalszego ABC)  
**Data zamknięcia:** 2026-07-27 (potwierdzenie Macieja)

## Status wdrożenia (dla innych agentów)

| Etap | Stan |
|------|------|
| **Sesja** | — zamknięte, bez nowej pracy |
| **Kod `gra/src`** | ✅ było wcześniej w `buildings.json` |
| **Deploy `gra-robocza`** | ✅ wcześniejsza fala |
| **Indeks** | `STATUS-WDROZEN-AGENT-2026-07-27.md` |

## Odpowiedź Macieja

> **A** (2026-07-27) — martwy `przyrost.mnoznik` usunięty; efekt przeniesiony do **Pieniądza** (`baza.pieniadz` 5, `przyrost.pieniadz` 3/poziom).  
> Cytat: „mnożnik targowiska chyba już załatwiony razem z tematem mennicy" — **potwierdza zamknięcie**, bez nowej pracy.

## Decyzja (skrót)

## Jak jest w kodzie (dwa osobne efekty — nie mylić z Mennicą)

| Efekt | Parametr | Normal | Warunek |
|-------|----------|--------|---------|
| **Targowisko** — premia do Handlu brutto miasta | `budynki.budynek_targowisko_bonus_handlu` | **+50%** (0,5) | `maTargowisko` w mieście |
| **Mennica** — mnożnik całego Handlu netto | `globalne.mennica_mnoznik_po_walucie` | **×1,5** (150%) | tech Waluta **i** Mennica w tym mieście |
| Targowisko — konwersja Pracy→Pieniądz (Efekt 2) | `budynki.targowisko_praca_na_pieniadz_mnoznik` | ×2 | Targowisko + Waluta |

Źródło: `gra/data/econ-params.json`, `gra/src/game/economy.ts` (Step 3: Targowisko bonus).

**50%** dotyczy **Targowiska** (premia addytywna do Handlu brutto). **×1,5** dotyczy **Mennicy** (osobny temat, scalenie mnożników 2026-07-25).
