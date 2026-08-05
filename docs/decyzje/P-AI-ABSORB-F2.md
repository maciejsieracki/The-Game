# P-AI-ABSORB-F2 — Faza 2 absorpcji major→major (any-civ)

**Status:** 🟢 WDROŻONE (batch AutoBot 2026-08-05)  
**Baza:** Faza 1 FALA 240 (Hard + same-civ + Moc≥1.25 + tura≥10)

## ECHO

> P-AI-ABSORB-F2-Q1 b ale tylko dla trudnego poziomu gry

| ID | Odpowiedź | Skutek |
|----|-----------|--------|
| **P-AI-ABSORB-F2-Q1** | **B** (+ dopisek) | Wdrażaj Fazę 2 **od razu**, **tylko Trudny** — any-civ (nie tylko same-civ) |

## AC Faza 2 — dowód

1. ✅ Nadal **tylko** `difficulty === 'hard'` (Ł/N bez zmian).
2. ✅ `requireSameCiv` domyślnie **false** — major AI może wchłonąć **dowolnego** innego majora przy ratio/tura jak Faza 1.
3. ✅ Progi: Moc ≥ **1,25** · tura ≥ **10** (`AI_MAJOR_ABSORB_*`).
4. ✅ Nadal: nie gracz · nie MP · nie barb · max 1 absorb / turę / agresor (`break` w pętli).
5. ✅ Log: `(any-civ hard)`.
6. ✅ Testy: `gra/tools/ai-major-absorb-test.cjs` — different civ → annex; easy → null; player → null; F1 gate `requireSameCiv`.
7. ZAKAZ easy/normal · ZAKAZ absorb gracza — bez zmian.

## Pliki

| Plik | Rola |
|------|------|
| `gra/src/game/ai-major-absorb.ts` | `decideAiMajorAbsorb` F2 + opcjonalny gate F1 |
| `gra/src/main.ts` (~21743) | filtr `majorTargets` all major AI, log any-civ |
| `gra/tools/ai-major-absorb-test.cjs` | harness T1–T10 + F1 gate |
