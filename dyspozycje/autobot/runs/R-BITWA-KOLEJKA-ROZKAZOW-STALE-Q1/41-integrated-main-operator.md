# Operator R2-I — integrated current-main harness

**Status: etap 6/11, operator R2-I zakończony; produkt bez zmian w tej iteracji.** Świeży test zintegrowanego `main` przeszedł 15/15. Nie wykonywałem commit, merge, deployu ani pushu.

## Wynik zintegrowanego testu

- Chromium uruchomił produkcyjny build z aktualnego `/workspace/main-integration-20261029`; 919 modułów, bundle 70,045,201 B, SHA-256 `89714f1a5fc354e17367fc03add6a7edbc50a1a0045abc1c6cc928b9de78a39b`.
- Scenariusz bitwy ręcznej miał mieszane składy 28v28, w tym dystansowe i konne/rydwanowe jednostki. Weryfikacja trybu bez dowódcy, pointer selection, rozkazy ataku/ruchu, pełna kolejka 28 jednostek i sterowanie tempem przeszły.
- Kliknięty ruch podzbioru został wysłany przez immediate dispatch, gdy kolejka była pusta. `atk27` został zakwalifikowany i otrzymał jeden immediate `_performPlayerOrder`: start `2026-10-30T02:08:40.249Z`, koniec `02:08:42.660Z`. Pozycja zmieniła się z `(30,72)` na `(31,71)`.
- Pusty heks `(31,72)` oraz offset formacji `dc=0, dr=-4` dały prawidłowy cel rozkazu `(31,68)`. Zachowano wcześniejsze asercje ruchu i offsetu.
- Po snapshotcie harness czekał 60 sekund na zwykłą aktywację `atk27`, a potem do 15 sekund na jej zakończony perform. W tym czasie bitwa doszła do `turnIdx=46`, ale ślad nie zawierał zwykłej aktywacji ani drugiego perform dla `atk27`; pozycja pozostawała `(31,71)`. W tym obserwowanym oknie nie potwierdzono drugiego ruchu ani overlapu. To nie dowodzi, że overlap jest niemożliwy w innych stanach, ale obecne dane nie uzasadniają nowego zgłoszenia o podwójnym ruchu.
- Końcowy wynik: **15/15 PASS**, bez błędów strony ani konsoli. Dodatkowa obserwacja zwykłej aktywacji jest zapisana niezależnie od asercji natychmiastowego dispatchu.

## Walidacja harnessu

- `node --check tools/battle-manual-queued-order-lifecycle-live-test.cjs` — PASS.
- `npx tsc --noEmit --pretty false` — PASS.
- `git diff --check` — PASS.

## Dowody

Pliki z runu znajdują się w `evidence/operator-r2i-integrated/`:

- `queued-order-lifecycle-two-cycles.json` — wynik asercji wraz z `ordinaryFollowup`.
- `execution-trace.json` — kolejność i czas dispatch/perform/activation.
- `queued-order-skipped-dead-production.json` — test pominięcia martwego ID w kolejce.
- `1793326203583-queued-order-lifecycle-two-cycles.png` — zrzut bitwy.

SHA-256 JSON wyniku: `f2523389f8b9eafd1d41ab91be699cb2d19a464fe47029eafada63aee3527250`.

## Granice pracy

Ta iteracja dotyczyła wyłącznie harnessu oraz walidacji już przygotowanej poprawki kolejki. Nie zmieniałem kodu produktu ani dwóch oczekujących hunks `battleScene.ts`. Wynik przekazuję do niezależnego ewaluatora; nie oznacza on jeszcze etapu 11 ani gotowości do deployu.
