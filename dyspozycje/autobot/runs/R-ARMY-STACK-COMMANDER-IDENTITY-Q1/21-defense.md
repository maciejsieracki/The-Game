# Operator Defense — R-ARMY-STACK-COMMANDER-IDENTITY-Q1

Wynik: **PASS — uwagi ewaluatora obsłużone**, etap 7/11.

## Zmiana testowalności

- Wprowadzono czysty helper `armyStackCardIdentity()` w `armyStackHud.ts`.
- Produkcyjny builder `buildArmyStackStateInner()` wywołuje ten helper dla każdej jednostki, przekazując tytuł Wódz/Generał tylko wtedy, gdy runtime `isGeneral === true`.
- Test Chromium buduje 89-kartowy roster z rzeczywistego helpera; odróżnia wodza od 88 zwykłych Wojowników, sprawdza zachowanie typu `Wojownik` oraz kliknięcie dokładnego `commander-unique-id`.
- Test wykonuje również produkcyjne `serializeGame()` → `deserializeGame()` dla dwóch jednostek o tym samym `typeId`: `isGeneral: true` pozostaje zachowane, a zwykła jednostka zachowuje `false`. Test źródłowy potwierdza, że `buildSaveGameSnapshot()` zapisuje `units.slice()` i loader odtwarza `obj.units`.

## Weryfikacja

- `TMPDIR=/workspace/tmp-army-stack-defense node gra/tools/army-stack-commander-identity-test.cjs` — **5/5 PASS**.
- `npm --prefix gra run typecheck` — PASS.
- `git diff --check -- gra/src/ui/armyStackHud.ts gra/src/main.ts gra/tools/army-stack-commander-identity-test.cjs` — PASS.

Nie dodano pola zapisu: istniejące `RuntimeUnit.isGeneral` przechodzi przez istniejący zapis tablicy jednostek. Zachowano odrębną nazwę typu i identyfikator runtime. Merge, deploy i push nie wykonano.
