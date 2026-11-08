# Raport Operatora — domyślne rozstawienie bitwy

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: `R-BITWA-DEFAULT-ROZMIESZCZENIE-Q1`
GOAL: Domyślna bitwa i reset rozmieszczenia używają odrębnych slotów: piechota z przodu, oszczepnicy w drugim pasie, łucznicy w trzecim, procarze w czwartym, mounted na skrzydłach, machiny za liniami dystansowymi, a wódz/generał na końcu; duże składy nie tracą planowanych slotów.

## Zmiany i allowlista

- `gra/src/battle/formationRules.ts` SHA-256 `69686cf53e28e6afd2a43129dbe2f559938451bad590ea30de0ce9df210b8b33` — role split i czysta funkcja slotów. Każda rola dostaje własny przedni/do-tyłu pas; overflow zajmuje kolejne kolumny swojej roli. Mounted są rozdzielani między zewnętrzne górne/dolne pasma i rozszerzają się w głąb skrzydeł.
- `gra/src/battle/battleScene.ts` SHA-256 `62948aa71ebe0cb6da123f4f6e4cb11ef79f6af1a14d89566be274847fc6e511` — klasyfikacja jednostek po priorytecie commander/mounted/siege, następnie oszczepnik/łucznik/procarz i pozostałe ranged; oba wejścia (start i reset deployu) korzystają z tego samego planera. Fallback kolizji/terenu dla mounted zachowuje wiersze skrzydeł. Doktryny pozostawiono bez zmian.
- `gra/tools/battle-formation-rules-test.cjs` SHA-256 `3ef20e380c0e19017742b3377e1ceaa0169d194c34e0446f3c53967ea721d17d` — nowy kontrakt slotów, overflow piechoty, 500 mounted, brak duplikatów planowanych slotów, integracja obu ścieżek Scene; wcześniejsze asercje tempa Ataku, Charge i otwierającego ataku dystansowego zachowane.

Zmiany zostały naniesione w kandydacie `/workspace/all-topics-candidate`. Brak commita. Początkowa wersja testu w istniejącym, współdzielonym drzewie FAIL-owała na nieaktualnym oczekiwaniu starego porządku (`expected horse,general,archer,infantry,chariot,catapult`); asercję zastąpiono kontraktem nowych pozycji. To był stan testu przed aktualizacją, nie usterka obecnej implementacji.

## Testy

- `node gra/tools/battle-formation-rules-test.cjs` — PASS (role/rzędy, overflow, 500 mounted, slot uniqueness, start/reset scene hooks, istniejące doktryny i opening shot).
- `node ./node_modules/typescript/bin/tsc --noEmit` z `gra/` — exit 0.
- `node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-battle-deployment-audit-dist --emptyOutDir` z `gra/` — PASS, 916 modułów.
- `git diff --check -- gra/src/battle/formationRules.ts gra/src/battle/battleScene.ts gra/tools/battle-formation-rules-test.cjs` — PASS.

## Ograniczenia i blokady

Współdzielony branch był brudny przed pracą i otrzymał niezależne commity orkiestratora; zachowano je. Początkowy HEAD delegacji `32d27454`, HEAD odczytany po równoległym commicie orkiestratora `f5a32c4e`. Nie modyfikowano plików poza allowlistą poza tym raportem. Test waliduje planner i statyczne wpięcie obu ścieżek Scene, nie końcowy render w Chromium; nie ma zrzutu wizualnego ani niezależnej oceny. Kolizje z nieprzejezdnym terenem mogą przesunąć jednostkę w obrębie jej dopuszczonego pasma, ale fallback mounted nie przenosi jej do środka formacji.

RUNDY: 1/5
NASTĘPNY KROK: niezależny Evaluator sprawdza diff, rolę Oszczepnika, sloty obu ścieżek i brak zmian doktryn; potem Final Control.
DEPLOY/PUSH: NIE WYKONANO
