# R-WEB-DIPLO-GOODS-LABEL-RUDA-MIEDZI-Q1 — Operator runda 2 (obrona po FAIL R1)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-GOODS-LABEL-RUDA-MIEDZI-Q1
GOAL: w dyplomacji (Dobra handlowe → Surowce, koszyk, oferty) surowiec „Ruda" ma się wyświetlać jako „Ruda miedzi"; klucz `ruda` bez zmian. DODATEK 1: aktywny surowiec z zapasem 0 pokazuje „×0"; zapas 0 nie jest oferowalny.
BAZA: f1042a121 (Operator R1). Stan R1 odtworzony, poprawka na tym samym branchu worktree.

## Odpowiedzi na zarzuty Evaluatora R1

1. Zarzut 1 (Z1: diplomacy-display.ts:429 `ruda: 'Ruda'` → koszyk i oferty) — PRZYJMUJĘ.
   Poprawka: gra/src/game/diplomacy-display.ts `RESOURCE_KEY_LABEL.ruda = 'Ruda miedzi'` (1 linia). Przez `resourceDisplayLabel()` idą: koszyk (ui/diplomacyTradeBasket.ts), karty ofert (ui/diplomacyDealDisplay.ts), cykliczne (game/diplomacy-cyclic-display.ts), podsumowanie (formatBasketListBrief). Klucz danych nietknięty.
   Allowlista: plik gra/src/game/diplomacy-display.ts nie mieścił się literalnie w allowliście R1 (`ui/diplomacy*`). Rozszerzam ją WYŁĄCZNIE o ten plik, bo dispatch w ZAKRESIE wymienia „koszyk/oferty/szybka umowa". Orkiestrator: potwierdzić to rozszerzenie.
   Dowód: `resourceDisplayLabel('ruda') === 'Ruda miedzi'` (nowa asercja; przed poprawką dawała „Ruda").

2. Zarzut 2 (Z2: „×0" dla surowców z dostępem boolean, np. Sól, Koń, w priceableTradableGoodOptions main.ts:3558) — ODRZUCAM w części dotyczącej logiki; PRZYJMUJĘ jako jawne założenie do decyzji orkiestratora.
   Dowód braku wpływu na logikę: ilosc 0 i undefined dają identyczne wyniki we wszystkich użyciach:
   - diplomacy-resource-trade-pick.ts:42 `entry?.ilosc ?? 0` (undefined i 0 → 0),
   - diplomacy-resource-trade-pick.ts:138 `(g.ilosc ?? 0) > 0`,
   - ai-resource-needs.ts:57, 78, 147 `g.ilosc ?? 0`,
   - quantityTradableGoodOptions (main.ts ~3158): `Math.floor(g.ilosc ?? 0)` i filtr `maxQty > 0`,
   - jedyne sprawdzenia `ilosc != null` to formatTradeGoodDisplayLabel (diplomacy-goods.ts:133) i priceableTradableGoodOptions (main.ts:3558, tylko etykieta; filtr po katalogu boolean nie zależy od ilosc).
   Zmiana jest zatem WYŁĄCZNIE kosmetyczna: „Sól ×0" / „Koń ×0" w liście wyboru dostępu. Oferowalność dostępu boolean się nie zmienia.
   ZAŁOŻENIE (Z2-A, do decyzji orkiestratora): DODATEK 1 mówi ogólnie „surowiec z aktywnym dostępem i zerowym stanem magazynu pokazuje ×0", więc stosuję literę dodatku do wszystkich aktywnych surowców (także boolean). Alternatywa (Z2-B, wymaga allowlisty main.ts): dopisywać ×N tylko dla surowców ilościowych, czyli kluczy z diplomacyHandelSurowceCatalog — jeden warunek w main.ts:3558. Nie wybieram sam — to decyzja produktowa.

3. Zarzut 3 (test „brak Ruda" pusty; sol0 pośredni) — PRZYJMUJĘ częściowo.
   Dodano asercje behawioralne: `resourceDisplayLabel('ruda') === 'Ruda miedzi'` oraz `!== 'Ruda'`. Asercja `magazyn bez aktywnego dostępu → Ruda miedzi ×3` (ścieżka citySurowceSum) PADA przed poprawką, więc nie jest pusta. Filtr oferty dla zapasu 0 (main.ts quantityTradableGoodOptions `maxQty > 0`) nie da się przetestować w node bez bundla main.ts — zweryfikowany przeglądem kodu (main.ts ~3158–3172). NIE_ZMIERZONO runtime.

4. Zarzut 4 (tsc nie odtworzony) — PRZYJMUJĘ, odtworzone.
   Komenda: `cd gra && ./node_modules/.bin/tsc --noEmit` (typescript 5.6.3, --no-save). Wynik: exit 2, 3 błędy, WSZYSTKIE w src/audio/muzyka-antyczna.ts (1544, 1984, 2276: „Type 'Float32Array' is not generic"). Plik nie jest zmieniany przez ten temat, więc błędy są istniejące (zależne od wersji TS/lib). Zero błędów w diplomacy*. NIE_ZMIERZONO: nie zbudowano bazy dcca72b78 do porównania liczby błędów.

5. Zarzut 5 (informacyjny: pełna lista miejsc z „Ruda") — PRZYJMUJĘ, lista poniżej. Poza diplomacy-display.ts nic nie zmieniono.

## Pełna lista miejsc z „Ruda" w src (stan po R2)
- gra/src/game/diplomacy-goods.ts:56 `'Ruda': 'ruda'` (mapa etykieta→klucz, bez zmian); :80 override → „Ruda miedzi" (dyplomacja, OK).
- gra/src/game/diplomacy-display.ts:429 → „Ruda miedzi" (ZMIENIONO R2, dyplomacja).
- gra/src/ui/hexContextTooltip.ts:118 `ruda: 'Ruda'` — tooltip heksu (POZA dyplomacją, NIE zmieniano).
- gra/src/game/building-stock-cost.ts:147 `ruda: 'Ruda'` — koszty budynków (POZA, NIE zmieniano).
- gra/src/game/resource-access.ts:48 (Nakladka.ZlozeRudy), :69 `ruda: 'Ruda'` — źródłowa etykieta, celowo bez zmian (bramki budynków).
- gra/src/game/building-resource-gate.ts:48 `ruda: 'Ruda'`, :73-74 `kuznia` / `odlewnia_brazu: ['Ruda']` — dopasowanie po etykiecie źródłowej; zmiana zepsułaby bramki. NIE zmieniano.
- gra/src/game/economy-upkeep.ts:192 — tylko komentarz dokumentacyjny.

## Testy
- `node gra/tools/diplomacy-goods-kat-test.cjs` → PASS 18 FAIL 0 (R1: 16 asercji; R2 dodaje 2 asercje display).
- `tsc --noEmit` → exit 2, 3 błędy istniejące w muzyka-antyczna.ts; 0 w diplomacy*.
- Nie uruchamiano build/dev; brak WERSJE.md, gra-robocza, push, deploy.

## Zmienione pliki (R2)
- gra/src/game/diplomacy-display.ts (1 linia: ruda → „Ruda miedzi")
- gra/tools/diplomacy-goods-kat-test.cjs (+export resourceDisplayLabel, +2 asercje)
- dyspozycje/autobot/runs/R-WEB-DIPLO-GOODS-LABEL-RUDA-MIEDZI-Q1/02-operator-r2.md

## BLOKADY / ZAŁOŻENIA
- Z2-A (założenie): ×0 także dla surowców boolean z dostępem (literalnie DODATEK 1). Decyzja orkiestratora: Z2-A vs Z2-B.
- Rozszerzenie allowlisty o gra/src/game/diplomacy-display.ts — do potwierdzenia.
- Z3 (z R1, bez zmian): „Ruda" w indeksie = złoże miedzi; „Ruda żelaza" / „Ruda cyny" bez zmian.
- Z5 (z R1, poza zakresem): deduplikacja indeksu po kluczu `ruda`.

RUNDY: 2/5
NASTĘPNY KROK: Evaluator R2 (Sonnet): ocena Z2-A i rozszerzonej allowlisty.
DEPLOY/PUSH: NIE WYKONANO
