# R-PROC-POTROJNA-WARSTWA — potrójna weryfikacja kodu

**Status:** 🟢 OBOWIĄZUJE (Maciej 2026-08-05)  
**Reguła Cursor (alwaysApply):** `.cursor/rules/potrojna-warstwa-weryfikacji.mdc`  
**Opis operacyjny:** `dyspozycje/POTROJNA-WARSTWA-WERYFIKACJI.md`

---

## Decyzja Macieja (słowa kluczowe)

Jeden agent przygotowuje kod. Drugi agent **zawsze** sprawdza jako adwokat diabła (regresje, usunięte usprawnienia, uboczne zepsucia). Główny agent (Grok) na koniec **zawsze** robi finalną kontrolę. Od tej pory tak działamy — drożej w tokenach, taniej w czasie poprawiania regresji.

---

## Trzy warstwy

| # | Rola | Kto |
|---|------|-----|
| 1 | Implementer | `composer-2.5` |
| 2 | Adwokat diabła (osobny przebieg) — **OBOWIĄZKOWO SCOPE + regresja** (`R-PROC-AUTOBOT-EVAL-SCOPE`) + **STRICT** (`R-PROC-AUTOBOT-EVAL-STRICT`) + **STRICT-EDGE** (`R-PROC-AUTOBOT-EVAL-STRICT-EDGE`) + **STRICT-PARITY** (`R-PROC-AUTOBOT-EVAL-STRICT-PARITY`) + **STRICT-SAVE** (`R-PROC-AUTOBOT-EVAL-STRICT-SAVE`) | `composer-2.5` |
| 3 | Final | Grok 4.5 |

**ZAKAZ:** „gotowe w kodzie” / `deploy` po samym #1.

---

## Gdzie wpisane (kanon procesu)

- `.cursor/rules/potrojna-warstwa-weryfikacji.mdc`
- `.cursor/rules/model-routing.mdc` (odnośnik)
- `dyspozycje/POTROJNA-WARSTWA-WERYFIKACJI.md`
- `dyspozycje/START-TU.md`
- `dyspozycje/PROCEDURA-NUMER-ABC-COMMIT-DEPLOY.md`
- `dyspozycje/PAMIEC-ROBOCZA-CIV.md` §1a00
- `STAN-PRACY-HANDOFF.md`
- `CLAUDE.md` § zasady krytyczne
- `dyspozycje/REJESTR-PROSB-I-ZADAN.md` — wiersz `R-PROC-POTROJNA-WARSTWA`
