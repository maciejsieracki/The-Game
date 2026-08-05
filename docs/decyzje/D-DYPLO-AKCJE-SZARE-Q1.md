# D-DYPLO-AKCJE-SZARE-Q1 — niedostępne akcje wyszarzone + tooltip

**Status:** 🟢 Evaluator **PASS** (re-eval po STRICT) · gotowe do deploy · 2026-08-05

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

## Evaluator

**Werdykt:** **PASS** (re-eval 2026-08-05 po uzupełnieniu STRICT)  
**Tip kodu:** `3517031` · test STRICT patch na branchu

| Oś | Werdykt | Uwaga |
|----|---------|-------|
| SCOPE | **PASS** | Tylko helper + wiring `main.ts` + UI `diplomacyAudience.ts` + test; zero PW/silnika akceptacji/absorb/ai-params |
| AC SZARE B+C | **PASS** | `.da-note` pełny tekst; `.da-abtn-note` na pasku; `audienceActionStatusNote` / `audienceActionBarLockNote` |
| AC KATALOG A | **PASS** | Pełny katalog; MP → `locked`, sojusz `3` widoczny |
| STRICT | **PASS** | on-table + enabled→pusty wiersz (20/20) |
| STRICT-EDGE | **PASS** | MP lock · active · on-table · enabled |
| STRICT-PARITY | **PASS** | Brak nowej asymetrii gracz-only |
| STRICT-SAVE | **PASS** | Brak nowych pól stanu |
| Bramki | **PASS** | `tsc --noEmit` 0 · `diplomacy-audience-actions-test.cjs` 20/20 |
