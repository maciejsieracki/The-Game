# C-ARMY-HUNGER-Q1 — parytet głodu armii (ZNALEZISKO-88)

**Status:** 🟢 **WDROŻONA** — FALA 36 `a74c3797` (commit `2632156`)  
> **ID audytu:** ZNALEZISKO-88  
> **Grupa:** C (walka/ekonomia) + Integrator F (main.ts)

## Status wdrożenia (dla innych agentów)

| Etap | Stan |
|------|------|
| **Sesja** | 🔧 **Czat ABC** — temat obsługujemy tutaj; **nie** publishuj `gra-robocza/` |
| **Kod `gra/src`** | ✅ **GOTOWY** — `army-starvation.ts` · `decideAIEconomySliders` |
| **Deploy `gra-robocza`** | ✅ **FALA 36** `a74c3797` (paczka R-AI-SUWAKI) |
| **Indeks** | `STATUS-WDROZEN-AGENT-2026-07-27.md` |

---

## Pytanie

Czy AI ma ten sam mechanizm głodu armii co gracz — suwak żywności (heurystyka, nie UI) **oraz** utrata HP przy ujemnych zapasach państwa?

---

## Odpowiedź Macieja

> **A** — Pełny parytet (suwak + głód) (2026-07-27).

- AI **automatycznie** zarządza suwakiem świeżej żywności (`procentRozwoj`) przez heurystykę `decideAIEconomySliders` (game/ai.ts) — **bez** panelu UI.
- Utrata HP przy głodzie armii (`applyArmyStarvationHpLoss`, −8% maxHP/turę na normal) dotyczy **wszystkich** `ownerId`, nie tylko gracza (0).

**Cytat w czacie:** „A — Pełny parytet (suwak + głód)".

---

## Wdrożenie (dowód)

| Element | Plik | Stan |
|---------|------|------|
| Atrycja HP per owner | `gra/src/main.ts` (~16473–16486) | Pętla `efTickResult.perOwner` + `tick.ownerId` |
| Logika strat HP | `gra/src/game/army-starvation.ts` | `applyArmyStarvationHpLoss(units, ownerId, …)` |
| Suwaki AI co turę | `gra/src/main.ts` (~17338–17389) | `decideAIEconomySliders` na starcie tury ownera |
| Heurystyka suwaków | `gra/src/game/ai.ts` | `decideAIEconomySliders` (C-AI-SUWAKI=A) |
| UI suwaka tylko gracz | `gra/src/main.ts` (~4181) | `onCityFoodSplitChange` → `ownerId !== 0` return |

**Testy:** `glod-wojska-karencja-test.cjs` 39/39 (sekcja parytet), `ai-slider-test.cjs` 37/37, `tsc --noEmit` 0.

---

## Uwagi

- Komunikaty HUD głodu (`showHintMessage`) pozostają **tylko dla gracza** — AI głoduje po cichu (zamierzone).
- Korekta suwaka AI może być opóźniona o 1 turę względem ticku żywności (kolejność: ekonomia → faza AI); `minOdstepTur` ogranicza oscylację.
