# AutoBot dispatch — Atak/Obrona/Szturm: marsz i cele wielojednostkowe

TEMAT: R-BITWA-DOKTRYNY-ATAK-20261028
RUNDA: 1/5
DATA: 2026-10-28
DOMAIN: GAME
ŚCIEŻKA: B (prompt)
MODEL + EFFORT per rola: Operator GPT-6 Luna Medium / Evaluator GPT-6 Luna Medium / Final Control GPT-6 Luna Medium

## WYZWALACZ
Właściciel doprecyzował różnicę doktryn: Atak ma iść uporządkowanie do przodu, Obrona ma czekać, Szturm ma wysyłać jednostki indywidualnie na najbliższe cele. Wcześniejszy test jednostkowy nie weryfikował składu wielojednostkowego na bieżącym kandydacie. Teraz Operator niezależnie powtarza fixture na właściwym checkoutcie.

## GOAL
W bitwie Atak prowadzi zwartą piechotę do przodu, dystansowi idą za nią bez bocznych obejść i wyprzedzania; Obrona utrzymuje pozycję; Szturm kieruje każdą jednostkę do jej najbliższego przeciwnika.

## KRYTERIA KOŃCA — binarne
- Test używa produkcyjnych metod aktywacji/planowania/kolizji i sprawdza co najmniej piechotę + łucznika w Ataku, pozycję w Obronie oraz dwie jednostki Szturmu z różnymi najbliższymi celami.
- Test potwierdza: piechota idzie naprzód; dystansowy nie wyprzedza i nie robi sidestepu, a rusza po zwolnieniu pola; Obrona stoi; Szturm ma osobne najbliższe cele.
- Test opisuje jawnie stuby animacji, terenu, ścieżki i rozstawienia; nie przedstawia ich jako dowodu runtime.
- Test doktryn, test formacji, TypeScript i scoped diff-check przechodzą.
- Jeśli zgłoszony brak ruchu nie jest odtwarzany, Operator nie zmienia produkcyjnego kodu bez znalezionej przyczyny.

## ALLOWLISTA
- `gra/src/battle/battleScene.ts` — tylko jeśli test wykaże konkretny defekt doktryny
- `gra/tools/bitwa-auto-atak-wielojednostkowy-evaluation-test.cjs`
- raporty w tym katalogu

Zakaz: `formationRules.ts` i rozstawienie, AI, render terenu, zmiany spoza GOAL, commit, integracja, push, deploy.

## IZOLACJA
`/workspace/all-topics-candidate`, branch `integration/robocza-all-topics-20261027`, bieżący HEAD `f5a32c4e` plus niezatwierdzone zmiany. Zachować cudze zmiany; Operator uruchamia/aktualizuje wyłącznie allowlistę.

## REGUŁA PRZECIW SAMOOSZUKIWANIU
Nie uznawać ruchu jednej jednostki za dowód ataku całej formacji; rozróżnić oczekiwane czekanie za zablokowaną piechotą od całkowitego braku ruchu.

## PROCEDURA NAPRAWCZA
Evaluator wskazuje konkretny defekt; Operator poprawia go w kolejnej rundzie tego samego ID. Po 5 rundach stop `LIMIT-5-EXCEEDED`.

## GRANICE
Bez zmian domyślnego rozmieszczenia, flankowania BFS, reguł walki ani morale. Bez pushu/deployu.

## OBIEG
Operator → Evaluator → Final Control → integracja orkiestratora → READY_FOR_DEPLOY → osobna bramka deploy/push.
