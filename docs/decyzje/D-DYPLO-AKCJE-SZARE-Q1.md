# D-DYPLO-AKCJE-SZARE-Q1 — niedostępne akcje wyszarzone + tooltip

**Status:** 🟡 ECHO **B+C** (2026-08-05) — gotowe do Evaluator (AutoBot 2026-08-05)

## Dowód wdrożenia (AutoBot)

| AC | Dowód |
|----|-------|
| 1–3 | `gra/src/ui/diplomacyAudience.ts` — `dealsColumnHtml` + `actionBarHtml`: `.da-note` / `.da-abtn-note` stały powód; tooltip zachowany |
| 4 | Audyt: jedyna filtracja listy = `id !== '1'` (kontakt); MP → `locked` w `buildAudienceActionsList` |
| 5 | Silnik PW bez zmian — tylko UI + helper |

- Helper: `gra/src/game/diplomacy-audience-actions.ts` (`buildAudienceActionsList`, `audienceActionStatusNote`)
- Wiring: `gra/src/main.ts` → `buildAudienceActionsList` (minimalny)
- Test: `node tools/diplomacy-audience-actions-test.cjs` — PASS
**Źródło:** Maciej 2026-07-29 ~00:50–00:51 · paczka 2/2

## ECHO

| ID | Odpowiedź | Skutek |
|----|-----------|--------|
| **D-DYPLO-AKCJE-SZARE-Q1** | **B+C** | Audyt + popraw luki **oraz** mocniejszy UX (pełna siatka + stały wiersz powodu) |

## AC

1. Niedostępne akcje dyplomatyczne **nie znikają** — zostają na liście / pasku.
2. Stan zablokowany: wizualnie wyszarzone (`locked` / `disabled`).
3. **Tooltip (hover)** z powodem + **stały wiersz powodu** pod nazwą akcji (nie tylko hover) — oś C.
4. Audyt: lista „Możliwe umowy” **i** pasek szybkich akcji — te same reguły; fix luk (oś B).
5. ZAKAZ zmiany reguł silnika dyplomacji / PW / akceptacji — tylko UI widoczności i komunikatów.

## Powiązane

- `D-DYPLO-KATALOG-Q1=A` — pełny katalog z JSON (zablokowane = szare).
