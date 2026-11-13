# AutoBot dispatch — runda 2

TEMAT: R-BITWA-DEFAULT-ROZMIESZCZENIE-Q1
RUNDA: 2/5
DATA: 2026-10-28
DOMAIN: GAME
ŚCIEŻKA: B (prompt)
MODEL + EFFORT per rola: Operator GPT-6 Luna Medium / Evaluator GPT-6 Luna Medium / Final Control GPT-6 Luna Medium

## WYZWALACZ
Evaluator w rundzie 1 (raport `02-evaluator.md`) wykazał, że test podaje role ręcznie, a produkcyjny `initialBattleRoleOf()` nie jest w nim uruchamiany. Wracamy wyłącznie do tego zarzutu na tym samym ID i gałęzi.

## GOAL
Domyślne rozstawienie i reset bitwy wyznaczają wymagane pasy ról przez jeden produkcyjny klasyfikator, który jest bezpośrednio testowany na kategoriach/nazwach rzeczywistych jednostek.

## KRYTERIA KOŃCA — binarne
- `battleScene.ts` używa jednej eksportowanej funkcji klasyfikacji zamiast własnej równoległej logiki.
- `battle-formation-rules-test.cjs` podaje próbki kategorii/nazw dla piechoty, oszczepnika, łucznika, procarza, konnicy/rydwanów, machiny i dowódcy oraz sprawdza wynik produkcyjnego klasyfikatora i sloty.
- Operator odtwarza dokładny zarzut z rundy 1; żadnego ręcznego `unit => unit.role` jako jedynego dowodu.
- Test formacji, TypeScript, bezpośredni Vite build do `/tmp` oraz scoped diff-check przechodzą.
- Doktryny Atak/Obrona/Szturm pozostają nietknięte.

## ALLOWLISTA
- `gra/src/battle/formationRules.ts`
- `gra/src/battle/battleScene.ts`
- `gra/tools/battle-formation-rules-test.cjs`
- raporty tej rundy w tym katalogu

Zakaz: inne tematy, commit, integracja, push, deploy, pliki release, dokumenty decyzji, `.git/**`.

## IZOLACJA
`/workspace/all-topics-candidate`, branch `integration/robocza-all-topics-20261027`; punkt kontrolny przed rundą 2: `f5a32c4e` plus niezatwierdzone zmiany tematu. To współdzielony dirty worktree; zachować istniejące zmiany i pisać tylko allowlistę.

## REGUŁA PRZECIW SAMOOSZUKIWANIU
Test musi importować i wywołać dokładny produkcyjny klasyfikator. Nie wolno testować kopii logiki ani ręcznie tagować roli w próbkach produkcyjnych.

## PROCEDURA NAPRAWCZA
Evaluator sprawdza wyłącznie ten zarzut i zakres. Każdy nowy konkretny defekt wraca do Operatora na tej samej gałęzi z licznikiem rund; po 5 rundach stop `LIMIT-5-EXCEEDED`.

## GRANICE
Bez zmian w doktrynach, AI, renderze terenu, morale i innych tematach. Nie pushować ani nie deployować.

## OBIEG
Operator → Evaluator → Final Control → integracja orkiestratora → READY_FOR_DEPLOY → osobna bramka deploy/push.
