# Final Control — R-BITWA-KOLEJKA-ROZKAZOW-STALE-Q1

**Werdykt: PASS-WITH-NOTES. Etap 8/11 ukończony dla poprawki cyklu życia kolejki.**
Nie wykonano integracji, deployu ani pushu.

## Potwierdzony zakres

Niezależny, świeży rerun produkcyjnej `BattleScene` w Chromium/WebGL przeszedł
**15/15 asercji**, bez błędów strony i konsoli. Mieszany roster miał 28 jednostek na
stronę; po stronie gracza było 20 jednostek dystansowych i 8 konnych/rydwanów.

- Pierwsza kolejka: 28/28 rozkazów przeszło przez produkcyjną aktywację, 8 jednostek
  zmieniło pozycję, a `_queuedOrderUnitIds` wyzerowało się.
- Drugi rozkaz: pointer w rundzie 2 wydał podgrupie bezpośredni rozkaz `move`. Dla
  `atk27` ślad wykazuje immediate dispatch i `_performPlayerOrder` bez kontekstu
  `_activateUnit`, zanim jej zwykła aktywacja wystąpiła. Pozycja zmieniła się z
  `(30,72)` na `(31,71)`.
- Kliknięty heks `(31,72)` został przekształcony na cel `(31,68)` przez produkcyjne
  `formationOffset={dc:0,dr:-4}`; zapisany cel jest zgodny z tym wyliczeniem.
- Deterministyczny probe produkcyjnych `_activateNext`/`_activateUnit` potwierdził
  pominięcie martwego kandydata, usunięcie jego ID z kolejki i aktywację następnej
  żywej jednostki. Pole `deadActivated` w JSON ma mylącą nazwę; jego wartość oznacza
  `dead && !acted`. Raport i inne asercje opisują rzeczywisty warunek.
- `npm run typecheck`, `node --check` i `git diff --check` — PASS.

Świeże artefakty z niezależnego rerunu znajdują się w
`evidence/evaluator-rerun-20261030/`. SHA-256: wynik
`fb1a37bde87dffddcbca927fbf8c20ed1ee6d857d0687e04c3105652c9147722`, trace
`62ef93be145d0a732306309b1cebce9e66e02d9c9f0feabf1ec756459d035e26`, screenshot
`8363af880ce1dea58495e85de9b2511cd7ddf733b4cbbbbc0eeb9da27b3cd418`.

## Weryfikacja integracji

Sama poprawka produktu jest ograniczona do dwóch zmian w `_activateNext`: wyczyszczenia
ID pomijanej, martwej/niedostępnej jednostki i wyczyszczenia ID po zakończeniu zwykłej
aktywacji jednostki; podgląd kolejki jest odświeżany tylko przy zmianie zbioru. Te
konkretne hunki są uzasadnione testem i nie zmieniają rozkazów ani AI.

**Nie wolno integrować całego worktree jako merge/cherry-pick.** Branch ma wspólnego
przodka `9f6f7771`, nie aktualny `main`. Porównanie z `862568e`/`94286b0c` pokazuje
258 linii różnic w `battleScene.ts`, w tym wycofanie już wdrożonych zachowań
`attackMove`, planowania linii dystansowych, ręcznego ataku i znikania zabitych
jednostek. To są różnice starej bazy gałęzi, nie część poprawki kolejki. Następny
integrator ma przenieść wyłącznie dwa hunki z commitów `6069f2e2` i `2340e5dd` na
aktualny `main` `94286b0c`, zachowując pozostały kod. Potem trzeba ponowić test na tym
zintegrowanym źródle.

## Ograniczenia

Rerun pokrywa kolejkę 28v28 i jeden bezpośredni ruch podgrupy w drugiej rundzie; nie
wyczerpuje wszystkich typów rozkazów ani maksymalnej pojemności 120 jednostek na stronę.
Powiązany rejestr `R-BITWA-MANUAL-CONTROL-LARGE-ARMY-Q1` pozostaje otwarty do czasu
surgical integracji na aktualnym `main` i weryfikacji testów na zintegrowanym kodzie.

Pierwsza próba ewaluatora nie zbudowała Vite z powodu brakującej, zagnieżdżonej zależności
Vite w symlinkowanym `node_modules`. Zależności odtworzono przez `npm ci` wyłącznie w
drzewie generowanych pakietów; świeży produkcyjny rerun przeszedł. Nie zmieniono źródeł.

## Etap

8/11 — Final Control zaliczone z notami. Następny krok: przenieść wyłącznie dwa hunki
poprawki do bieżącego `main`, uruchomić testy integracyjne, następnie deploy Roboczej,
push i zdalny odczyt potwierdzający.
