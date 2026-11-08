TEMAT: R-BITWA-DEFAULT-ROZMIESZCZENIE-Q1
RUNDA: 1/5
DATA: 2026-10-28
DOMAIN: GAME
ŚCIEŻKA: B (prompt)
MODEL + EFFORT per rola: Operator — model/effort nieudostępnione w metadanych delegacji; Evaluator i Final Control — do dispatchu orkiestratora

## WYZWALACZ
Właściciel zgłosił pogorszenie rozstawienia domyślnego w bitwie i podał role/układ. Orkiestrator zlecił Operatorowi wyłącznie układ domyślny; polecenie delegacji zawierało dokładne role, test i zakaz zmian doktryn.

## GOAL
Domyślna bitwa oraz reset rozstawienia lokują piechotę z przodu, oszczepników w następnym pasie, następnie łuczników i procarzy, kawalerię/rydwan na skrzydłach, machiny za liniami dystansowymi, a wodza/generała na końcu; wszystkie formacje mają przydzielone unikalne sloty przy testowanym dużym składzie.

## KRYTERIA KOŃCA — binarne
- `node gra/tools/battle-formation-rules-test.cjs` weryfikuje dokładne pasy ról, kolejność machiny/wodza, 45 piechurów z overflow, 500 jednostek konnych, brak kolizji planowanych slotów oraz integrację obu ścieżek Scene.
- `node ./node_modules/typescript/bin/tsc --noEmit` kończy się kodem 0.
- Bezpośredni Vite build do `/tmp` kończy się kodem 0.
- Diff-check allowlisty nie wykrywa błędów whitespace.
- Doktryny Atak/Obrona/Szturm pozostają nietknięte.

## ALLOWLISTA — nic poza tym
- `gra/src/battle/formationRules.ts`
- `gra/src/battle/battleScene.ts`
- `gra/tools/battle-formation-rules-test.cjs`
- artefakty Operatora w tym katalogu runu
Zakazane: modyfikacja doktryn/ruchu, inne tematy, commit, integracja, push, deploy, `gra-robocza/`, `docs/decyzje/**`, `.git/**`.

## IZOLACJA
Ścieżka `/workspace/all-topics-candidate`, branch `integration/robocza-all-topics-20261027`, początkowa baza przy delegacji `32d27454`; współdzielony dirty worktree orkiestratora, bez izolowanego worktree ze względu na jawne polecenie koordynacji. Zachować wszystkie cudze zmiany; edycja ograniczona do allowlisty.

## REGUŁA PRZECIW SAMOOSZUKIWANIU
Nie uznawać samego sortowania listy za prawdziwe rzędy. Testować współrzędne rank/row z produkcyjnego planera, w tym overflow dużej piechoty i dużą liczbę mounted; osobno opisać brak dowodu z realnego renderu.

## PROCEDURA NAPRAWCZA PRZY FAIL
Evaluator wskazuje jeden konkretny defekt w dozwolonym zakresie; Operator poprawia ten sam temat i allowlistę w następnej rundzie. Po 5 rundach zatrzymać się jako `LIMIT-5-EXCEEDED`.

## GRANICE
Nie zmieniać doktryn Atak/Obrona/Szturm, zachowania ruchu ani osobnych zadań walki; nie deployować i nie pushować. Pełny cykl Operator → Evaluator → Final Control → integracja prowadzi orkiestrator.
