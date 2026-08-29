# R-BARB-ZDOBYCIE-MIAST-Q1 — właściciel miasta po zdobyciu

**Status:** ZAMKNIĘTE — przyjęto A na podstawie upoważnienia właściciela
**Data:** 2026-08-19

## ABC

- **A — wspólna frakcja barbarzyńców (`ownerId = BARBARIAN_OWNER_ID = -1`)** — miasto przechodzi pod barbarzyńców, pozostaje odbijalne, a barbarzyńcy nie są traktowani jako pełnoprawna cywilizacja w ekonomii, kapitale ani dyplomacji.
- **B — osobny owner per obóz** — rozdzielałby miasta między obozy, ale wymagałby nowego systemu ownerów, migracji save/load i szerokich wyjątków w silniku.
- **C — czasowa okupacja bez zmiany ownera** — zachowywałaby poprzedniego ownera, ale wymagałaby nowej semantyki okupacji, zegara i odbicia.

## Rekomendacja i decyzja

**Rekomendacja: A.** Jest jednoznacznie zgodna z istniejącym kanonem:

1. `P-BARBARZYNCY-MIASTA-ZACHOWANIE-Q1=A` wymaga zmiany `ownerId` na barbarzyńców na najwyższej trudności i pozostawienia miasta odbijalnego.
2. `P-BARBARZYNCY-PUSTE-MIASTO-PRZEJECIE-Q1=B` dopuszcza przejęcie pustego miasta przez wejście na jego heks wyłącznie na `hard`.
3. `P-BARBARZYNCY-ELIMINACJA-CYWILIZACJI-Q1=A` potwierdza, że barbarzyńcy mogą przejąć ostatnie miasto; zdobyte miasto służy im wyłącznie do produkcji jednostek.

Na podstawie upoważnienia właściciela rekomendacja została przyjęta bez dodatkowego wyboru ABC.

## Implementacja i dowód

Aktualny kod realizuje kontrakt w obu drogach: `applyCityCaptureAfterBattle()` ustawia właściciela na `atkOwner`, a `captureCityWithoutBattle()` używa tego samego prymitywu dla pustego miasta. Późniejsze odbicie może ponownie zmienić ownera na gracza lub AI; istniejące guardy wyłączają barbarzyńców z cywilizacyjnego plądrowania, Prawa i eliminacji.

Dodano osobny test kontraktowy właściciela: `gra/tools/barb-city-owner-contract-test.cjs`.
