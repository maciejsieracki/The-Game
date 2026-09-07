# R-RELIGIA-KONWERSJA-PO-PODBOJU-Q1 — Operator, RUNDA 1

STATUS: PASS
DOMAIN: GAME
TEMAT: R-RELIGIA-KONWERSJA-PO-PODBOJU-Q1
GOAL: `onCityCapturedReligion` (odpowiednik `onCityCapturedCulture`) + wywołanie bezwarunkowe
w main.ts + dowód że `convertViaTemple` faktycznie rusza po naprawie.

## ZMIANY

- `gra/src/game/culture-religion.ts`: import `sameCultureCircle` (z `diplomacy-display.ts`,
  brak cyklu — ten plik nie importuje z powrotem culture-religion); nowa funkcja
  `onCityCapturedReligion(state, population, newOwnerReligion, previousOwnerReligion,
  newOwnerId?, previousOwnerId?, opts?)` + typ `CityCaptureReligionOpts`. SAME okrąg →
  `defaultCityReligionState` (100% nowego, bez zmian). RÓŻNY okrąg → `newShare = 1 -
  religionOwnShare(state, previousOwnerReligion)` (identyczna formuła co
  `onCityCapturedCulture`), `remaining` populacji: brak trzecich religii → w całości do
  STAREGO właściciela (czyste tłumaczenie 2-stronnego wzoru kultury); są trzecie religie
  (miasto miało >2 wyznania, np. po `spreadReligion`) → rozdzielone proporcjonalnie do ich
  wzajemnego udziału, przeskalowane do `remaining`. To rozstrzygnięcie (nie nowa liczba
  balansu) uzasadnione w komentarzu funkcji.
- `gra/src/main.ts`: import `onCityCapturedReligion`; blok linii 26938-26952 (potwierdzony
  grepem `P-BARB-CAPTURE-GUARD RUNDA 2` PRZED edycją, treść zgodna 1:1 z dyspozycją) zamieniony
  z warunkowego `if (!isBarbarian(atkOwner) && sameCultureCircle(...)) { cityRelig.set(...
  defaultCityReligionState...) }` na `if (!isBarbarian(atkOwner)) { cityRelig.set(city.id,
  onCityCapturedReligion(cityRelig.get(city.id) ?? {counts:{}}, city.population,
  ownerReligionForOwnerId(atkOwner), ownerReligionForOwnerId(oldOwner), atkOwner, oldOwner,
  {civKeyForOwner: civKeyForOwnerId})) }` — ten sam `civKeyForOwner`/`sameCultureCircle`
  guard co kultura przeniesiony DO nowej funkcji (opts), zero duplikacji drugiego
  zabezpieczenia P-BARB-CAPTURE-GUARD; `isBarbarian(atkOwner)` guard zachowany bez zmian.
- `gra/tools/religia-konwersja-po-podboju-test.cjs`: nowa bramka (bundluje
  `culture-religion.ts` przez esbuild API, wzorem `culture-religion-test.cjs`), 9 asercji.

## TESTY (reprodukowalne)

```
cd gra && npx tsc --noEmit                                    → czysto (0 błędów)
node tools/religia-konwersja-po-podboju-test.cjs               → 9 passed, 0 failed
node tools/culture-religion-test.cjs                           → 65 passed, 0 failed
node tools/conquest-stability-test.cjs                         → 28 passed, 1 failed (BASELINE — patrz niżej)
node tools/logic-test.cjs                                      → 213/213
node tools/tech-tree-test.cjs                                  → 19/19
node tools/research-test.cjs                                   → 33/33
node tools/unit-replace-test.cjs                                → 13/13
node tools/combat-test.cjs                                     → 6/6
find tools -iname "*relig*" -o -iname "*kultur*" -o -iname "*capture*" -o -iname "*podboj*" -o -iname "*conquest*"
  → culture-religion-test.cjs (65/0), conquest-stability-test.cjs (28/1 baseline),
    barb-city-capture-cluster-test.cjs (92/1 baseline), ai-city-capture-integration-test.cjs
    (14 OK), empire-religia-panel-coverage-test.cjs (15/15), post-capture-law-test.cjs (25/0),
    capital-capture-test.cjs (86/86), capture-trade-basket-preview.cjs / capture-palisada-*
    / capture-piatka-braz-opus5.cjs / capture-hill-compare.cjs / capture-style-compare.mjs =
    narzędzia preview/porównawcze, nie bramki asercyjne (nie uruchamiane jako testy PASS/FAIL).
```

**Dwie FAIL są PRZEDPODBOJOWE (baseline), zweryfikowane `git stash` przed edycją: identyczny
wynik na czystym `origin/main`/bab6f75, zero związku z tym tematem.**
- `conquest-stability-test.cjs`: "unstable happiness penalty (got 0, want -2)" —
  `society-breakdown.ts`/`conquest-stability.ts` zakazane allowlistą, nie dotknięte.
- `barb-city-capture-cluster-test.cjs`: snapshot-lock na literalny tekst wokół
  `cityProd.set` w innym bloku `applyCityCaptureToMap` — nie w allowlistowanym zakresie.

## DOWÓD BEHAWIORALNY (nie tylko lektura) — `religia-konwersja-po-podboju-test.cjs`

- RÓŻNY okrąg, miasto mieszane (70% ofiary/30% trzecia religia): po podboju zdobywca ma
  udział = `1 - prevShare` dokładnie (0.3), populacja zachowana, trzecia religia nadal obecna.
- Symulacja 5 tur `convertViaTemple` (Świątynia): udział zdobywcy **realnie rośnie**
  0.300 → 0.340 → 0.380 → 0.420 → 0.450 → 0.480 (monotonicznie nie maleje, strict wzrost —
  `convertViaTemple` NIE jest martwym kodem po naprawie).
- `foreignReligionDominant` (`udział_zdobywcy < 0.5`) wychodzi `true` bezpośrednio po podboju
  w tym scenariuszu (0.3 < 0.5) — punkt 3(a) GOAL spełniony.
- SAME okrąg: 100% nowego właściciela, zero zmiany zachowania (regresja NIE).
- Skrajny róg (ofiara miała 100% własnej religii, prevShare=1.0): `1-1=0`, zdobywca dostaje
  0% — identyczne z analogicznym rogiem kultury (`1-1=0`), nie bug, udokumentowane w teście.

## ECHO punkt 3 (binarność religii)

`grep -n "return 2 \* religionOwnShare" gra/src/game/culture-religion.ts` → linia 827,
`religionHappiness()`: `return 2 * religionOwnShare(state, ownReligion) - 1;` —
proporcjonalny wskaźnik [-1,+1], zero binarnego skoku. **Już spełnione (G4,
R-SZCZESCIE-PRZEBUDOWA-SKALI-Q1), zero zmian kodu w tym punkcie.**

## BLOKADY

Brak.

## RUNDY: 1/5

## NASTĘPNY KROK

Evaluator (Sonnet 5, effort high).

## DEPLOY/PUSH: NIE WYKONANO
