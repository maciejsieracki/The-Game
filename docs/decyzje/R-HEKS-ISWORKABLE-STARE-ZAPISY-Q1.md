# R-HEKS-ISWORKABLE-STARE-ZAPISY-Q1 — stare zapisy z robotnikami na Górach/Morzu bez migracji

**Data:** 2026-08-09 · **Decyzja:** Maciej, ABC = **tylko stare zapisy, bez migracji**

## Sytuacja
Naprawa silnika ekonomii (`P-HEKS-ISWORKABLE-OVERLAY-VS-SILNIK-HIPOTEZA`) wyklucza Morze/Góry z
obsadzania robotnikami — dotyczy też trybu ręcznego (`okolicaReczne`). Pytanie: co ma się stać z
ISTNIEJĄCYMI zapisami gry, które mogą już mieć robotników ręcznie przypisanych do takich pól
(tryb ręczny nigdy wcześniej nie miał filtra terenu)?

## Decyzja
**Nie budować żadnej logiki migracji/naprawy starych zapisów.** Mechanizm ręcznego przydziału
pól (`okolicaReczne`, przełączanie auto/ręczny) zostaje w grze bez zmian funkcjonalnych — decyzja
dotyczy WYŁĄCZNIE danych w starych zapisach, nie samego mechanizmu. Stare zapisy są jednorazowe
na obecnym etapie testów i nie wymagają żadnej ścieżki kompatybilności wstecznej.

**Jego słowa (doprecyzowanie po pytaniu kontrolnym o zakres):** „Tylko stare zapisy — nie buduj
migracji."

## Wdrożenie
- NIE dodawać logiki reconcile/auto-napraw dla wczytanych zapisów z nielegalnymi przydziałami.
- Nowe przydziały (od momentu wdrożenia fixu) dostają pełny filtr terenu we wszystkich ścieżkach
  zapisu (`seedReczneFromAuto`, `rebalanceWorkersAfterPopulationChange`, `toggleTileWorker`/
  `adjustTileWorker`) — to wciąż obowiązkowa część naprawy (blokujący punkt Evaluatora, nie
  dotyczy tej decyzji).
- Zachowanie dla WCZYTANEGO starego zapisu z nielegalnym przydziałem: silnik po prostu nie liczy
  tej produkcji (już dziś tak działa dla dwóch naprawionych ścieżek) — bez dodatkowego
  komunikatu, bez auto-przestawienia. Akceptowalne zgodnie z decyzją właściciela.

## Status
WDROŻONE jako część kontynuacji `P-HEKS-ISWORKABLE-OVERLAY-VS-SILNIK-HIPOTEZA`.
