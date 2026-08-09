# R-PROPOZYCJA-KASACJA-UI-Q1 — Kasacja pustej/mirror karty propozycji

**Data:** 2026-08-08 · **Decyzja:** Maciej, `A`

## Sytuacja
`BUG-PROPOZYCJA-KASACJA-PUSTEJ-STRONY-KASUJE-CALOSC` — jedna pozycja `negotiationTable` jest
renderowana jako dwie wizualne karty (realna treść + „mirror" pokazujący drugą stronę). Pusta/
mirror karta miała przycisk „Usuń" podpięty do tego samego wpisu — kliknięcie kasowało całą
wymianę, mimo że karta wyglądała na osobną, pustą propozycję. To rzeczywiście jedna transakcja
w silniku (kasacja całości jest poprawna), problem jest czysto w UI: user nie wiedział, że
klika „usuń całość" zamiast „usuń tę pustą kartę". Pełna diagnoza w
`dyspozycje/PYTANIA-OTWARTE.md`, sekcja `BUG-PROPOZYCJA-KASACJA-PUSTEJ-STRONY-KASUJE-CALOSC`.

## Decyzja
**A — ukryj przycisk „Usuń" na pustej/mirror karcie**, zostaw jeden aktywny przycisk na karcie
z realną treścią (kasuje cały wpis, poprawnie — to jedna transakcja).

## Uzasadnienie
Najmniejsza zmiana wizualna — użytkownik nadal widzi dwie karty jak dotąd, tylko jedna ma
przycisk. Znikający przycisk „gdy nie ma czego usunąć" to standardowy wzorzec UX, nie wymaga
dodatkowego wyjaśnienia w większości interfejsów. Rozwiązanie B (explicit „Usuń całą wymianę"
na obu kartach) i C (scalenie w jeden widok) zostają w tyle jako opcje na przyszłość, gdyby A
po zobaczeniu w grze okazało się mylące.

## Wdrożenie
`gra/src/ui/diplomacyAudience.ts` (`negotiationCardActionsHtml`), nowa
`negotiationTableDealSideHasContent()` w `gra/src/ui/diplomacyDealDisplay.ts`. Implementacja już
istniała w worktree Operatora (wybrana bez pytania — stąd ABC post-factum); worktree wymaga
rebase na aktualny HEAD przed scaleniem (konflikt w `diplomacyTradeBasket.ts` z równolegle
scalonym `66ae74c8`/`82bdbd92`, usuniętym pojęciem „pakiet").

## Status
ECHO — kod do redispatchu (rebase + brakujące pokrycie testami edycji), zanim trafi do scalenia.
