# R-EKONOMIA-ZYWNOSC-NADWYZKA-PO-LIMICIE-Q1 — raport Operatora

STATUS: PASS
DOMAIN: GAME
TEMAT: R-EKONOMIA-ZYWNOSC-NADWYZKA-PO-LIMICIE-Q1
GOAL: naprawić zgłoszenie właściciela — miasto na limicie populacji (`resolvedCap`/`cityPopulationCap`)
nadal dostaje wysoki wzrost (+12%) przez autoWyzywienie, mimo że pop nie może rosnąć dalej.

## 1. Diagnoza (z dowodem)

Zbudowano żywą symulację jednej tury dokładnie w kolejności main.ts::triggerPlayerEndTurn
(SPICH-AUTO-Q1 blok, `autoBalanceRationsToSolvency` → `autoRaiseRationsForGrowth` → clamp
`maxSafePoziomRacjiForCity` → `advanceEmpireFood` → `applyPostCentralPopulationGrowth`), z dwoma
miastami: A na limicie populacji (cap=5, population=5) i B rosnącym (population=3).

Ustalono root cause przez grep: `popCapByCityId` — 109 wystąpień w `gra/src` ogółem, **0 w
main.ts**. Mechanizm własności (B) z R-AUTOWYZYWIENIE-ROWNY-WZROST-Q1-A (`resolveEqualGrowthRationPlan`,
parametr `popCapByCityId`, uwzględniający miasta "na limicie" jako `atPopCap` z zerowym wzrostem)
jest w pełni zaimplementowany i przetestowany w `empire-food.ts`/`autowyzywienie-rowny-wzrost-test.cjs`
— ale main.ts NIGDY nie budował tej mapy ani nie przekazywał jej do żadnego z 5 wywołań silnika
(`autoBalanceRationsToSolvency` ×1, `autoRaiseRationsForGrowth` ×1, `maxSafePoziomRacjiForCity` ×3).
Skutek: miasto na limicie było traktowane identycznie jak miasto rosnące — dostawało Wyżywienie
podniesione do wspólnego maksimum razem z resztą imperium.

Dowód liczbowy z żywej symulacji (`gra/diag-live-SCRATCH.cjs`, usunięty po diagnozie):

```
=== DZIŚ w main.ts (BEZ popCapByCityId) ===
Spichlerz PRZED: 200, PO: 204 (Δ=4)
A (na limicie): poziomRacji=6 pop 5→5 cap=5 bilansLokalny=0  WZROST%=8
B (rosnące):    poziomRacji=6 pop 3→3 cap=5 bilansLokalny=4  WZROST%=10

=== Z popCapByCityId podłączonym ===
Spichlerz PRZED: 200, PO: 249 (Δ=49)
A (na limicie): poziomRacji=1.5 pop 5→5 cap=5 bilansLokalny=45 WZROST%=1
B (rosnące):    poziomRacji=6   pop 3→3 cap=5 bilansLokalny=4  WZROST%=10

Różnica: 45 żywności NIE trafiało do spichlerza w dotychczasowym main.ts (na turę, ten scenariusz).
```

Odpowiedź na p.2 dyspozycji: **(a) nadwyżka jest tracona bezpowrotnie** — miasto A konsumowało
pełną rację (poziomRacji=6) mimo braku miejsca na wzrost, zamiast oddać nadwyżkę do wspólnej puli
(spichlerza/innych miast). To błąd do naprawienia, nie false-alarm UI.

## 2. Naprawa — wybrany wariant

**Wariant 2** (z dyspozycji): przy `resolvedCap` osiągniętym, autoWyzywienie przestaje generować
wzrost (klamruje do zera) — NIE wariant 1 (osobny bufor spichlerza na przyszły wzrost).

Uzasadnienie: mechanizm realizujący dokładnie Wariant 2 (`resolveEqualGrowthRationPlan` z
`atPopCap`/`popCapByCityId`, opcja B z R-AUTOWYZYWIENIE-ROWNY-WZROST-Q1-A) już istniał, był
w pełni zaimplementowany i przetestowany w `empire-food.ts` — brakowało wyłącznie wpięcia w
main.ts. Wariant 1 wymagałby nowego mechanizmu bufora nigdzie dziś nieistniejącego. Zero zmian
w formule `cityPopulationCap`/`resolvedCap` (zgodnie z zakazem w dyspozycji) — użyto jej TAKIEJ,
JAKA JEST, tylko podłączonej do wywołań auto-racji.

## 3. Implementacja

`gra/src/main.ts`:
- Import `resolvePopulationCapMatrixDelta` (z `./game/economy`) i `cityHasSpichlerzBuilding`
  (z `./game/building-resource-gate`, dotąd nieużywany w main.ts).
- W `triggerPlayerEndTurn` (blok SPICH-AUTO-Q1, ~linia 31221): zbudowano `popCapByCityId` —
  per-miasto `cityPopulationCap(maAkwedukt, maSpichlerzBuilding, econParams, matrixDelta)`,
  ten sam wzór co silnik wzrostu (population-growth-v85.ts), liczony RAZ przed pętlą auto-korekty
  (cap jest strukturalny, nie zależy od poziomu Racji).
- W `getMaxSafePoziomRacjiForPlayerCity` (HUD, ~linia 18085): analogiczna mapa
  `popCapByCityIdHud`, tylko dla `playerCities` (funkcja obsługuje wyłącznie ownerId=0).
- Podłączono `popCapByCityId` do WSZYSTKICH 5 wywołań: `autoBalanceRationsToSolvency` (×1),
  `autoRaiseRationsForGrowth` (×1), `maxSafePoziomRacjiForCity` (×3: HUD player-cities loop,
  HUD besieged-fallback, Q3=A end-of-turn clamp per human seat).

`gra/tools/auto-wyzywienie-live-recalc-test.cjs`: harness `new Function` dla
`getMaxSafePoziomRacjiForPlayerCity` musiał otrzymać nowe zależności (`buildEconParams`,
`cityPopulationCap`, `resolvePopulationCapMatrixDelta`, `cityHasSpichlerzBuilding`) — dodano
eksport z prawdziwych modułów (nie mocki) i przekazano jako argumenty `new Function`.

Scratch: `gra/diag-live-SCRATCH.cjs` (+ pomocnicze `.diag-live-entry.ts`/`.diag-live-bundle.cjs`)
usunięte po zakończeniu diagnozy, zgodnie z komentarzem w pliku.

## 4. Testy — 100% zgodność z baseline, zero nowej regresji

Uruchomiono cały pakiet z dyspozycji (13 testów) + 2 dodatkowe znalezione grepem po
`resolvedCap|buildingCap|popCapByCityId|cityPopulationCap` (`ai-granary-prog-populacji-spojnosc-test.cjs`,
`population-civ-matrix-wiring-test.cjs`) = 15 testów, PRZED (git stash) i PO zmianie:

| Test | Baseline | Po zmianie |
|---|---|---|
| akwedukt-popcap-test | 6 pass, 1 fail (PRE-ISTNIEJĄCY) | 6 pass, 1 fail — identyczne |
| auto-wyzywienie-bilans-clamp-test | — | 22 pass, 0 fail |
| auto-wyzywienie-flow-balance-test | — | 17 pass, 0 fail |
| auto-wyzywienie-kosztarmii-kryterium-test | — | 18 pass, 0 fail |
| auto-wyzywienie-live-recalc-test | — | 60 pass, 0 fail (harness naprawiony) |
| auto-wyzywienie-population-growth-live-recalc-test | — | 42 pass, 0 fail |
| autowyzywienie-rowny-wzrost-test | — | 60/60 |
| autowyzywienie-stan-przycisku-test | — | 90 pass, 0 fail |
| spichlerz-cap-citypanel-wiring-test | — | 12 pass, 0 fail |
| spichlerz-deficyt-scalenie-test | 54 pass, 4 fail (PRE-ISTNIEJĄCY) | 54 pass, 4 fail — identyczne |
| spichlerz-panel-food-parity-test | — | 11 pass, 0 fail |
| spichlerz-widocznosc-test | 37 pass, 8 fail (PRE-ISTNIEJĄCY) | 37 pass, 8 fail — identyczne |
| spichlerz-wzrost-test | 2 pass, 7 fail (PRE-ISTNIEJĄCY) | 2 pass, 7 fail — identyczne |
| ai-granary-prog-populacji-spojnosc-test | — | 12 pass, 0 fail |
| population-civ-matrix-wiring-test | — | 122 pass, 0 fail |

4 testy mają pre-istniejące (niezwiązane z tym tematem) FAIL potwierdzone identyczne przez
`git stash` przed zmianą — nie regresja tego tematu.

`npx tsc --noEmit` — czyste (exit 0, brak błędów).
`git diff --check` — czyste (exit 0, brak trailing whitespace / konfliktów).

## 5. Zmiany / commit

Pliki: `gra/src/main.ts` (+56/-1), `gra/tools/auto-wyzywienie-live-recalc-test.cjs` (+8).
Brak zmian w `civ-matrix.json`, brak zmian w formule `cityPopulationCap`/`resolvedCap` —
zgodnie z zakazem w dyspozycji.

DEPLOY/PUSH: NIE WYKONANO (zgodnie z kontraktem — żadnego merge/push/deploy, tylko lokalny
commit dozwolony po własnej weryfikacji).
