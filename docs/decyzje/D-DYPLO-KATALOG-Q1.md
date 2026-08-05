# D-DYPLO-KATALOG-Q1 — katalog akcji w menu propozycji / audiencji

**Status:** 🟡 ECHO **A** (2026-08-05) — W TRAKCIE AutoBot  
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
