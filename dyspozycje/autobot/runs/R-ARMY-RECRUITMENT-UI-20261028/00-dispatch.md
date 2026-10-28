# AutoBot dispatch — UI rekrutacji wodza/generała

TEMAT: R-ARMY-RECRUITMENT-UI-20261028
RUNDA: 3/5
DATA: 2026-10-28
DOMAIN: GAME
ŚCIEŻKA: B (prompt)
MODEL + EFFORT per rola: Operator GPT-6 Luna Medium / Evaluator GPT-6 Luna Medium / Final Control GPT-6 Luna Medium

## WYZWALACZ
Właściciel zażądał przygotowania gotowych zmian do Roboczej. Final Control poprzedniego runu `R-ARMY-RECRUITMENT-UI-EVALUATION-Q1` zablokował integrację: nie miał odpowiadającego mu raportu Operatora dla aktualnej karty wodza, a test UI używał zastępczej karty zamiast produkcyjnej ścieżki zakupu.

## GOAL
Wódz/Generał jest widoczny na górze rekrutacji stolicy i nad listą miast w panelu Armii, a rekrutacja przez produkcyjną kartę skutkuje dokładnie jedną poprawną transakcją gry.

## KRYTERIA KOŃCA — binarne
- Test renderuje produkcyjną kartę dowódcy w rekrutacji stolicy i w panelu Armii, przed zwykłymi jednostkami/miastami; test sprawdza też produkcyjne spięcie w `main.ts` (owner capital → dedykowana karta Army).
- Test wywołuje prawdziwy handler karty, przechodzi produkcyjne preflight i potwierdza wynik transakcji (kolejka/utworzona jednostka, koszty, zasoby) bez podwójnego zakupu.
- Ograniczenia rekrutacji wodza do stolicy, epoki i dostępności koszar zostają zachowane.
- Testy `general-capital-recruitment-order-test.cjs` i `empire-mass-recruitment-test.cjs`, TypeScript i scoped diff-check przechodzą.
- Operator raportuje każdy stub; zastępcza karta nie może być jedynym dowodem produkcyjnego zakupu.

## ALLOWLISTA
- `gra/src/ui/cityPanel.ts`
- `gra/src/main.ts` — wyłącznie import i konfiguracja callbacku Army-level rekrutacji wodza w stolicy
- `gra/src/ui/empireDetailPanel.ts`
- `gra/tools/general-capital-recruitment-order-test.cjs`
- `gra/tools/empire-mass-recruitment-test.cjs`
- raporty w tym katalogu

Zakaz: zmiany AI, BattleScene/formacji, renderu emblematu, innych tematów, commit, integracja, push, deploy.

## IZOLACJA
`/workspace/all-topics-candidate`, branch `integration/robocza-all-topics-20261027`, HEAD przed runem `f5a32c4e` z lokalnymi zmianami kandydata. Zachować wszystkie cudze zmiany i edytować wyłącznie allowlistę.

## REGUŁA PRZECIW SAMOOSZUKIWANIU
Sprawdź hash i rzeczywiste wywołanie produkcyjnego komponentu/handlera oraz źródłową konfigurację `main.ts`; fixture zastępujący kartę lub nieweryfikowany callback produktu nie dowodzi konfiguracji całego Army panelu.

## PROCEDURA NAPRAWCZA
Evaluator ma zwrócić konkretne zarzuty do GOAL i kryteriów. Operator naprawia je w następnej rundzie na tym samym ID; po 5 rundach stop `LIMIT-5-EXCEEDED`.

## GRANICE
Nie rozszerzać dostępności ani kosztu rekrutacji, nie zmieniać mechaniki dowódcy. Bez pushu/deployu.

## OBIEG
Operator → Evaluator → Final Control → integracja orkiestratora → READY_FOR_DEPLOY → osobna bramka deploy/push.
