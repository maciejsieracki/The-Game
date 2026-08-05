# C-MPDIFF-Q1 — widoczność suwaka „Trudność miast-państw"

**Status:** 🟢 **ZAMKNIĘTE** (2026-08-05) — decyzja **A**, bez zmian w kodzie  
**Źródło:** `R-MPDIFF-WIDOK` · powiązane: `R-TRUDNOSC-1` (`ea75f5ba`)

## ECHO

| ID | Odpowiedź | Skutek |
|----|-----------|--------|
| **C-MPDIFF-Q1** | **A** | Suwak zostaje w **zaawansowanych opcjach** kreatora — bez przenoszenia / podnoszenia na górę listy |

## Cytat

Maciej: `C-MPDIFF-Q1=A` — suwak zostaje w zaawansowanych (ZAMKNIĘTE, bez zmian kodu).

## Kontekst

- Suwak „Trudność miast-państw" wdrożony w `R-TRUDNOSC-1` — zaawansowane opcje, domyślnie = główna trudność.
- Zgłoszenie `R-MPDIFF-WIDOK`: trudno znaleźć (właściciel go nie widział).
- Rekomendacja agenta była **C** (podnieść na górę listy zaawansowanych) — **odrzucona** decyzją A.

## Kanon (A)

1. **Bez zmiany UI** — pozycja w zaawansowanych zostaje.
2. **Bez deploy** — stan kodu już spełnia decyzję.
3. Reopen tylko przy nowym ABC (np. osobna sekcja / tooltip / inna nawigacja).

## Dowód

| Element | Plik | Rola |
|---------|------|------|
| Suwak setupu | `gra/src/ui/newGameFlow.ts` (zaawansowane) | `cityStatesDifficulty` / trudność MP |
| Mechanizm MP | `gra/src/game/ai.ts`, `diplomacy.ts` | trust / sojusze / RESUP od suwaka MP |
| Civpedia | poradnik §76.5a | opis zaawansowanych opcji |

**ZAKAZ w tej fali:** przenoszenie suwaka, reorder listy zaawansowanych, nowe etykiety — decyzja A = status quo.
