# D-DYPLO-KATALOG-Q1 — katalog akcji w menu propozycji / audiencji

**Status:** 🟡 ECHO **A** (2026-08-05) — gotowe do Evaluator (AutoBot 2026-08-05)

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

**Werdykt:** **FAIL** (commit `3517031` — wspólny tor ze SZARE)

| Oś | Werdykt | Uwaga |
|----|---------|-------|
| SCOPE | **PASS** | Zakres zgodny — tylko katalog/lista akcji audiencji |
| AC KATALOG A | **PASS** | Iteracja całego `akcje_dyplomatyczne` (skip `1`); `restrictToBasicActions` → `locked`+`lockNote`, nie `filter`; test: sojusz `3` obecny+locked wobec MP |
| AC SZARE B+C | **PASS** | (powiązane) Spójne `lockNote` + stały wiersz w UI |
| STRICT | **FAIL** | Test nie weryfikuje count vs JSON per-id poza sojuszem/6; brak on-table w helper-testach |
| STRICT-EDGE | **FAIL** | Brak testu negacji on-table w `audienceActionStatusNote` |
| STRICT-PARITY | **PASS** | Ten sam `buildAudienceActionsList` dla wszystkich ownerów |
| STRICT-SAVE | **PASS** | Brak nowych pól persist |
| Bramki | **PASS** | `tsc --noEmit` 0 · test 18/18 |

**Do poprawy (Operator):** uzupełnić testy STRICT-EDGE (on-table) — wspólny plik `diplomacy-audience-actions-test.cjs`.
