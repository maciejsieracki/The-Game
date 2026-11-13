# R-WEB-BORDER-RELATIONS-ERA-PENALTY-Q1 — niezależny evaluator bramki testowej

STATUS: PASS — zarzut ekspozycji hooka z `40-evaluator-followup.md` zamknięty; przekazać do Final Control.
KANDYDAT: `6fe91297886903d1f2f30e701a0b704288f386b4` (`codex/border-era-penalty`)
PORÓWNANIE: `315672e5bb2b0c97a71a595bab01eef4313586eb`
RUNDY: 3/5

## Weryfikacja poprawki

Jedyny zmianowy fragment logiki źródłowej umieszcza przypisanie `window.__borderEraPenaltyRuntimeTestDebug` pod warunkiem `new URLSearchParams(location.search).get('civTest') === '1'`. To odpowiada dokładnie semantyce wspólnego `isCivTestEnabled` w `gra/src/game/civ-test-hooks.ts`. Hook pozostaje dostępny do runtime gate'a, a domyślnie nie jest przypisywany. Nie zmieniono resolvera stawki, obliczeń produkcyjnych, restore ani warunku wspólnej granicy.

Live-test gate buduje dodatni URL z `civTest=1`, a drugi URL usuwa wyłącznie tę flagę. Po boot prawdziwej strony bez flagi asercja wymaga `typeof window.__borderEraPenaltyRuntimeTestDebug === 'undefined'`; po boot z flagą gate sprawdza metody hooka i kontynuuje pełny runtime/save-load test. To jest właściwy test dwóch stanów. W raporcie `41-gating-defense.md` zapisano PASS dla obu ekspozycji oraz pełnego runtime gate'a po oznaczonej fladze; `40-evaluator-followup.md` dokumentuje niezależne wcześniejsze odtworzenie zachowania produkcyjnego. Nie powtarzałem ciężkiego przebiegu Chromium, bo aktualny raport zawiera przebieg po zmianie, a diff zmienia wyłącznie opt-in hooka i URL testu.

## Zakres i kontrole

Diff `315672e5..6fe9129` obejmuje wyłącznie `gra/src/main.ts`, `gra/tools/diplomacy-border-era-penalty-live-test.cjs` i raport `41-gating-defense.md`. Zmiana `main.ts` to sam warunek ekspozycji; zmiany skryptu dodają asercje flag-off/flag-on i ustawiają flagę dla dodatniego przebiegu. Nie ma dodatkowych zmian balansu ani feature behavior.

- `node tools/diplomacy-border-era-penalty-test.cjs`: PASS, 39/39 (uruchomione niezależnie).
- `npm run typecheck`: PASS (`tsc --noEmit`, uruchomione niezależnie).
- `git diff --check 315672e5..HEAD`: PASS.
- Przegląd 41: pełna bramka Chromium po zmianie zakończyła się PASS; brak page errors, opisane ostrzeżenia renderera i 404 pozostają bez zmian.

Wcześniejsze `20-evaluator.md` i `40-evaluator-followup.md` pozostają niezmienionymi raportami BLOCK. Ich historyczne werdykty nie są tu nadpisywane: runtime luka z 20 została zamknięta dowodem opisanym w 31/40, a ostatnia blokada z 40 — opt-in ekspozycja — jest zamknięta kandydatem 6fe9129 i tym follow-upem. Ograniczenia fixture oraz brak testu pełnej organicznej kampanii pozostają takie, jak opisano w 40. PASS dotyczy przekazania kompletnego kandydata do niezależnego Final Control, nie statusu `READY_FOR_DEPLOY`.

DEPLOY/PUSH/MERGE: NIE WYKONANO
