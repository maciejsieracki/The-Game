# AI-MOC-NEXT-Q1 — metryki diagnostyczne Mocy AI

**Status:** 🔵 W TRAKCIE (Maciej `2` = **B**, 2026-08-05)  
**Blokada balansu:** `AI-PLAYTEST=B+A` — **tylko** metryki/logi; zero dostrajania P-AI-MOC/008.

## ECHO

| ID | Odpowiedź | Skutek |
|----|-----------|--------|
| **AI-MOC-NEXT-Q1** | **B** | Metryki diagnostyczne (Moc / miasta / Praca / kolejka per major AI) |

## AC (Operator)

1. Pure helper buduje wiersze diag dla **każdego major owner** (gracz + major AI; **bez** miast-państw / defensiveCopy) — parytet danych.
2. Pola min.: `ownerId`, etykieta, `moc`, `miasta`, `praca` (pula/temp), `kolejka` (front produkcji per miasto lub skrót „N miast z kolejką / puste”).
3. UI: widoczne w overlay **Moc** (sekcja diagnostyczna) **albo** równoważny panel — bez zmiany formuły Mocy.
4. **ZAKAZ:** zmiany scoringu AI, `ai-params.json` trudności, combat bonusów, spawn bonusów.
5. **ZAKAZ:** nowe pola sejwu (diag ephemeral / wyliczane runtime) — STRICT-SAVE.
6. Testy: happy + edge (0 majorów, tylko gracz, MP wykluczone) + asercja „bez MP w wierszach”.
7. `tsc --noEmit` 0 · test tematu zielony.

## Evaluator (AutoBot warstwa 2 — 2026-08-05)

**Werdykt:** **PASS**  
**Tip:** `1f988f6` · branch `cursor/feat-ai-moc-metrics-63a1`

| # | Oś | Wynik |
|---|-----|-------|
| 1 | SCOPE — diff tylko diag Mocy (helper + overlay + wiring + test) | ✅ |
| 2 | NO-SIDE-EFFECT — brak ai-params / combat / spawn / AI scoring | ✅ |
| 3 | REGRESSION — zero cofnięć; formuła Mocy nietknięta | ✅ |
| 4 | COUPLING — runtime-only diag; brak nowych pól sejwu | ✅ |
| 5 | STRICT — celowany test + asercje AC | ✅ |
| 6 | STRICT-EDGE — edge (puste cities) + negacja (brak MP) | ✅ |
| 7 | STRICT-PARITY — ten sam zestaw pól gracz/AI; `ownerId!==0` tylko filtr major AI (AC #1); label/CSS wyjątek UI | ✅ |
| 8 | STRICT-SAVE — efemeryczny cache overlay; zero snapshot | ✅ |
| 9 | Bramki — `tsc --noEmit` 0 · `ai-moc-diag-test.cjs` 22/22 | ✅ |

**Pliki:** `gra/src/game/ai-moc-diag.ts` (nowy), `gra/src/ui/powerOverlayHud.ts`, `gra/src/main.ts` (wiring `diagMajorAi`), `gra/tools/ai-moc-diag-test.cjs`.

## Po PASS

Grok: merge + deploy FALA 239 (SOLO-Q1=A).
