STATUS: PASS
TEMAT: R-SCIENCEHUB-KLIK-WIERSZA-ENQUEUE-Q1
GOAL: kliknięcie wiersza technologii w panelu „Badania" (scienceHubHud.ts, sekcje
„MOŻESZ WYBRAĆ"/„WKRÓTCE") ma DODAWAĆ technologię do planu badań (onSelectTech)
BEZPOŚREDNIO zamiast otwierać kartę podglądu; podgląd karty ma być dostępny przez
osobny, wyraźnie oznaczony element (baner/przycisk „Karta"), niezależny od kliknięcia
wiersza.

## Weryfikacja zakresu (Final Control)

Uwaga metodologiczna: `git diff main..HEAD -- gra/` (double-dot, jak w kroku
zleconym) pokazuje 7 plików / -550/+65 linii, BO `main` odjechał do przodu o commity
innych, równoległych tematów (m.in. usunięcie `techUnlockParse.ts` i dwóch testów
`.cjs`, zmiany w `bottomBarHud.ts`/`sciencePicker.ts`/`techTreeView.ts`) od czasu, gdy
ten branch został z niego wydzielony (`186bb6da`) — to NIE są zmiany tego tematu.
Właściwe porównanie do wspólnego przodka:

```
git merge-base main HEAD  → 186bb6da
git diff main...HEAD --stat -- gra/
 gra/src/ui/scienceHubHud.ts | 63 ++++++++++++++++++++++++++++-----------------
 1 file changed, 40 insertions(+), 23 deletions(-)
```

Jeden plik, dokładnie ten wskazany w dispatchu. Zakres 1:1 z dyspozycją właściciela:
brak dotknięcia `techTreeView.ts` (zgodnie z jawną decyzją Operatora — inny model
interakcji, uzasadnione w 01-operator.md), brak zmian w `showTechDiscoveryNotice`/
`technologyAdapter.ts`, brak zmian w `main.ts`.

Przeczytany pełny diff `gra/src/ui/scienceHubHud.ts` (main...HEAD) — potwierdza opis
Operatora punkt po punkcie:
- `rowActivate()`: `!lockedRow && canEnqueue` → `config.onSelectTech(e.id)` bezpośrednio;
  w przeciwnym razie (zablokowany lub nie do zakolejkowania) → `act()` (podgląd karty).
  Zgodne z dispatchem („wiersz zablokowany → klik OTWIERA kartę").
- Ikonka `sh-info-ic` usunięta, zastąpiona `<button class="sh-card-btn">Karta</button>`
  w nowym kontenerze `sh-item-side`; `stopPropagation()` zachowany, klawiatura
  (Enter/Spacja) obsłużona identycznie jak dawna ikonka.
- `sh-num-badge` i dekoracyjny `+ PLAN` przeniesione do `sh-item-side` — czysto
  układowe, bez zmiany logiki.
- Hint pod listą zaktualizowany do nowego zachowania.
- CSS: `.sh-info-ic` usunięty, `.sh-item-side`/`.sh-card-btn` dodane; brak martwych
  odwołań do `sh-info-ic` gdziekolwiek w repo (sprawdzone `grep -rn "sh-info-ic" src/
  tools/` — zero trafień).

## Sprostowanie do 01-operator.md (zgłoszone przez Evaluatora)

Sekcja ZMIANY/COMMIT raportu Operatora twierdzi „Brak commitu wykonanego przez
Operatora ... zmiany zostawione w working tree" — to nieaktualne względem repo:
istnieje commit `fd20fd2a` (na tym branchu, NIE merge do main) z identyczną treścią
zmian i tym samym opisem. `git status` w worktree jest czyste. To rozbieżność
tekstu raportu (napisanego przed krokiem commit) względem faktycznego stanu, nie
naruszenie bariery „Operator nie integruje/nie pushuje" — commit na branchu tematu
to nie integracja ani push do main. Nie edytuję archiwalnego 01-operator.md (ślad
historyczny), sprostowanie jest tutaj.

Evaluator zgłosił też, że log testów Operatora („jedyny błąd to preistniejący
TS5101") jest niedokładny — w niezależnym uruchomieniu Evaluatora TS5101 w ogóle się
nie pojawił. Final Control potwierdza niezależnie (patrz TESTY niżej): `npx tsc
--noEmit` → 0 błędów, bez śladu TS5101. Wniosek merytoryczny (kompilacja czysta) się
nie zmienia, ale log Operatora w tym punkcie należy traktować jako nieścisły.

## TESTY (uruchomione niezależnie w tym worktree)

- `cd gra && npx tsc --noEmit` → **0 błędów** (exit 0). Brak TS5101 w tym
  uruchomieniu (node_modules 5.9.3, tymczasowy symlink `gra/node_modules ->
  ../../../../gra/node_modules`, usunięty po testach — worktree nie ma własnych
  node_modules, świeży `git worktree`).
- `node gra/tools/science-hub-test.cjs` → 5 pass, 2 fail (`engine available=4
  (>=5)`, `hub unlocked=4 (>=5)`). Sprawdzono kod testu: buduje bundle esbuild
  wyłącznie z `playerState.ts` + `scienceHubSnapshotLogic.ts` — NIE dotyka
  `scienceHubHud.ts` w ogóle, więc te 2 fail są strukturalnie niezależne od zmiany
  tego tematu (dane startowe/silnik, nie logika kliknięcia UI). Potwierdza wniosek
  Operatora bez potrzeby `git stash` (test i tak nie importuje zmienionego pliku).
- `node gra/tools/tech-tree-test.cjs` → 19 pass, 0 fail (brak regresu w
  `techTreeView.ts`, nietkniętym w tym temacie).
- `node ./node_modules/vite/bin/vite.js build --outDir <scratch> --emptyOutDir`
  (z `gra/`) → SUKCES, `✓ 844 modules transformed`, `✓ built in 21.31s`. Tymczasowy
  symlink i katalog wyjściowy usunięte po teście, `git status` czyste.
- `grep -rn "sh-info-ic" gra/src gra/tools` → 0 trafień (brak martwych odwołań po
  usunięciu klasy).

## BLOKADY

Brak. Jedyna uwaga proceduralna (nie blokująca): worktree nie ma własnego
`node_modules` — każdy kolejny etap potrzebuje tymczasowego symlinku/`npm ci`, tak
jak zanotował Operator.

## DECYZJA

PASS, readyForDeploy = true. Zakres zmian to dokładnie i wyłącznie
`gra/src/ui/scienceHubHud.ts` (potwierdzone przez `git diff main...HEAD`, wspólny
przodek `186bb6da`), zgodny 1:1 z dyspozycją właściciela z `00-dispatch.md`. Zero
błędów kompilacji, zero nowych regresów testowych (oba fail w `science-hub-test.cjs`
są strukturalnie niezwiązane ze zmienionym plikiem), build produkcyjny przechodzi.
Jedyne zastrzeżenia to nieścisłości TEKSTU raportu Operatora (status commitu, log
TS5101) — nie wpływają na jakość ani zakres samej zmiany kodu, sprostowane wyżej.

## NASTĘPNY KROK

Integracja przez orkiestratora (merge brancha `autobot/R-SCIENCEHUB-KLIK-WIERSZA-ENQUEUE-Q1`
do `main`) i wystawienie `READY_FOR_DEPLOY` — poza zakresem uprawnień Final Control
(nie integruje, nie deployuje, nie pushuje).

## DEPLOY/PUSH: NIE WYKONANO
