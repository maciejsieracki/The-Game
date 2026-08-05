# R-WIARYGODNOSC-D3-PROGI — Dźwignia 3 (twarde progi W)

**Data:** 2026-08-03  
**Źródło:** WIAR-Q3 · `dyspozycje/WIARYGODNOSC-SPECYFIKACJA.md` §5 Dźwignia 3  
**Branch:** `cursor/wiarygodnosc-d3-progi-63a1`

## Co

Twarde bramki Wiarygodności przy propozycjach traktatów — **niezależne** od Zaufania / Relacji / Respektu, sprawdzane **przed** istniejącymi progami relacyjnymi:

| Akcja | Warunek (W proponenta) | Parametr |
|---|---|---|
| Sojusz (`sojusz_defensywny`, `sojusz_pelny`) | W ≥ 0 | `DIPLOMACY_PARAMS.wiarygodnoscProgSojuszMin` |
| NAP (`nap`) | W ≥ −40 | `DIPLOMACY_PARAMS.wiarygodnoscProgNapMin` |

**Poza bramką W (§9.10=A, R3 ZAMKNIĘTE 2026-08-05):** `wasal`, `trybut_zadanie`, `trybut_oferta` — **bez** sprawdzania `proposerWiarygodnosc`; progi Respektu/Relacji/Zaufania bez zmian. **ZAKAZ** dodawać W-gate na wasal/trybut.

Wartości parametrów **bez zmian** (już w `gra/src/game/diplomacy.ts`).

## Dlaczego

Reputacja globalna ma blokować propozycje sojuszu/NAP zanim wejdą w grę progi relacji — gracz/AI z bardzo niską Wiarygodnością nie może „kupić" traktatu samą relacją.

## Pliki

- `gra/src/game/diplomacy-proposals.ts` — `ProposalEvalContext` + bramki w `evaluateProposal`
- `gra/src/main.ts` — `buildProposalEvalContext` → `getWiarygodnosc`
- `gra/tools/wiarygodnosc-test.cjs` — sekcja 8d (D3)
- `dyspozycje/WIARYGODNOSC-SPECYFIKACJA.md` — audyt Dźwignia 3 → WDROŻONE

## Testy

```bash
cd gra && node tools/wiarygodnosc-test.cjs
```

Sekcja 8d: odrzucenie NAP przy W=−50, akceptacja przy W=−40; odrzucenie sojuszu przy W=−1; W=0 nie pada na bramkę Wiarygodności.

## R3 — status (2026-08-05)

**ZAMKNIĘTE** — przegląd `R-WIARYGODNOSC-DZWIGNIE-2-4-PRZEGLAD.md` potwierdza zgodność z §9.10=A: jedyna „druga twarda bramka" w planie to NAP (gdy wdrożony wariant bezterminowy); Wasal/Trybut świadomie **bez** W-gate.

## Poza zakresem (nie w tej paczce)

NAP bezterminowy, badge UI, usunięcie Dźwigni 2, tempo, Dźwignia 4.
