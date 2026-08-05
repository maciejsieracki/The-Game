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

## Evaluator (AutoBot warstwa 2 — 2026-08-05)

**Werdykt:** **PASS**  
**Tip:** `68e2b04` · branch `cursor/feat-absorb-f2-celownik-63a1`

| # | Oś | Wynik |
|---|-----|-------|
| 1 | SCOPE — Faza 2: hard only + any-civ; ratio/tura jak F1 (1,25 / 10); brak easy/normal/gracz | ✅ |
| 2 | NO-SIDE-EFFECT — Ł/N bez zmian (`not_hard`); gracz wykluczony (T7/T8); MP wykluczony (T9) | ✅ |
| 3 | REGRESSION — F1 gate `requireSameCiv: true` zachowany (T2b); progi stałe | ✅ |
| 4 | COUPLING — `majorTargets` bez filtra same-civ; log `(any-civ hard)`; `break` max 1/turę | ✅ |
| 5 | STRICT — celowany test `ai-major-absorb-test.cjs` 20/20 | ✅ |
| 6 | STRICT-EDGE — easy, weak ratio, early turn, different civ annex, próg 1,25 | ✅ |
| 7 | STRICT-PARITY — `ownerId===0` null; major↔major only | ✅ |
| 8 | STRICT-SAVE — zero nowych pól / snapshot | ✅ |
| 9 | Bramki — `tsc --noEmit` 0 · test tematu 20/20 | ✅ |
