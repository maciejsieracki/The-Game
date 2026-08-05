# D-DYPLO-KATALOG-Q1 — katalog akcji w menu propozycji / audiencji

**Status:** 🟢 Evaluator **PASS** (re-eval po STRICT) · gotowe do deploy · 2026-08-05

## Dowód wdrożenia (AutoBot)

| AC | Dowód |
|----|-------|
| 1 | `buildAudienceActionsList` iteruje całe `akcje_dyplomatyczne` z JSON (skip tylko `id==='1'`) |
| 2 | `restrictToBasicActions` → `locked`+`lockNote`, nie `filter` — sojusz `3` widoczny szary wobec MP |
| 3 | Spójne z SZARE B+C — `audienceActionStatusNote` / `.da-abtn-note` |
| 4 | Brak usuwania akcji z JSON; efekty silnika nietknięte |

- `gra/src/game/diplomacy-audience-actions.ts` + test `diplomacy-audience-actions-test.cjs`
**Źródło:** Maciej 2026-07-29 ~00:46 · paczka 2/2

## ECHO

| ID | Odpowiedź | Skutek |
|----|-----------|--------|
| **D-DYPLO-KATALOG-Q1** | **A** | Pełny katalog z `diplomacy.json` `akcje_dyplomatyczne`; zablokowane = widoczne + szare + powód |

## AC

1. Lista audiencji pokazuje **wszystkie** zaprojektowane akcje z JSON (poza „1. Nawiązanie kontaktu” gdy kontakt już jest — jak dziś).
2. Ograniczenia wobec miasta-państwa / warstwy uproszczonej: akcja **zostaje na liście**, `locked` + `lockNote` (nie `filter` ukrywający).
3. Spójne z `D-DYPLO-AKCJE-SZARE-Q1=B+C` (szare + tooltip + wiersz powodu).
4. ZAKAZ usuwania akcji z JSON „bo v1”; ZAKAZ zmiany efektów silnika — tylko widoczność UI.

## Recon (punkt startu)

- `buildAudienceActions` w `main.ts` już ustawia `locked` dla spoza `AUDIENCE_BASIC_IDS` przy MP/simplified.
- Sojusz (id `3`) nie jest w basic → wobec MP powinien być **szary**, nie ukryty.

## Evaluator

**Werdykt:** **PASS** (re-eval 2026-08-05 po uzupełnieniu STRICT)  
**Tip kodu:** `3517031` · wspólny tor ze SZARE

| Oś | Werdykt | Uwaga |
|----|---------|-------|
| SCOPE | **PASS** | Zakres zgodny — tylko katalog/lista akcji audiencji |
| AC KATALOG A | **PASS** | Iteracja całego `akcje_dyplomatyczne` (skip `1`); MP → `locked` nie omit; sojusz `3` |
| AC SZARE B+C | **PASS** | Spójne `lockNote` + stały wiersz w UI |
| STRICT | **PASS** | on-table + enabled; katalog MP (20/20) |
| STRICT-EDGE | **PASS** | on-table w `audienceActionStatusNote` |
| STRICT-PARITY | **PASS** | Ten sam helper dla wszystkich ownerów |
| STRICT-SAVE | **PASS** | Brak nowych pól persist |
| Bramki | **PASS** | `tsc --noEmit` 0 · test 20/20 |
