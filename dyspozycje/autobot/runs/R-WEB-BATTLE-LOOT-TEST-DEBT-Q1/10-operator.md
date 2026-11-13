STATUS: PASS
DOMAIN: GAME
TEMAT: R-WEB-BATTLE-LOOT-TEST-DEBT-Q1
GOAL: Usunąć pre-existing red w teście łupu przez dopasowanie oczekiwań do aktualnego kosztu rekrutacji Włócznika, bez zmiany mechaniki.
MODEL / EFFORT: GPT-6 Luna / High
BAZA: `main`, `b477ecb70196f18d28857e112e25860e710600a6` (SHA przed zmianą); katalog roboczy `/workspace/main-integration-20261029`.

DIAGNOZA
Pierwsza komenda z repo-root, `node tools/battle-loot-test.cjs`, kończy się exit 1 przed startem testu: `MODULE_NOT_FOUND` dla `/workspace/main-integration-20261029/tools/battle-loot-test.cjs`. Plik rzeczywiście jest `gra/tools/battle-loot-test.cjs`, a jego nagłówek każe uruchamiać go z `gra/`.

Odtworzenie poprawną komendą `node tools/battle-loot-test.cjs` z `/workspace/main-integration-20261029/gra` dało przed zmianą dokładnie:

```text
FAIL: Włócznik braz — expected 2 got 50
FAIL: format Włócznik — expected +16 Pieniądz, +2 Brąz got +16 Pieniądz, +50 Brąz
FAIL: 2x Włócznik braz — expected 4 got 100
FAIL: 50% braz — expected 1 got 25
battle-loot-test: 8 pass, 4 fail
```

PRZYCZYNA I ZMIANA
`gra/data/units.json` Włócznik ma `Epoka: "Brąz"`, `Surowiec: "Brąz"`, `Surowiec (ilość): 25`. Zatwierdzona reguła `R-NADMIAR-POOLS` jest w rejestrze jako wdrożona FALA 215 (`R_STAWKI_FALA2_MULT=2`); `gra/src/game/building-stock-cost.ts` dokumentuje mnożnik jednostek Stone ×1, Bronze ×2, Iron+ ×4 i `unitStockCost()` skaluje ilość przez `scaleCostByEpoch()`. Battle loot wywołuje właśnie `unitStockCost()` w `gra/src/game/battle-loot.ts`. Wartość Brązu w łupie za Włócznika wynosi więc 25 × 2 = 50; dwie jednostki dają 100; 50% daje 25. Testowe `2/4/1` nie odzwierciedlały ani danych ani wdrożonego kosztu rekrutacji. To wyłącznie aktualizacja testu, bez decyzji o balansie i bez zmiany produkcyjnej.

Zmieniono cztery przestarzałe oczekiwania (`2 → 50`, format `+2 → +50`, `4 → 100`, `1 → 25`) i dodałem komentarz wyjaśniający dane 25 oraz mnożnik ×2. Pozostałe asercje bez zmian.

TESTY
Po zmianie, z `/workspace/main-integration-20261029/gra`:

```text
$ node tools/battle-loot-test.cjs
battle-loot-test: 12 pass, 0 fail
exit_code=0
```

ZMIANY/COMMIT: tylko `gra/tools/battle-loot-test.cjs` i ten artefakt operatora oraz `00-dispatch.md`; bez commita.
BLOKADY: brak.
RUNDY: 1/5.
NASTĘPNY KROK: niezależny Evaluator.
DEPLOY/PUSH: NIE WYKONANO.
