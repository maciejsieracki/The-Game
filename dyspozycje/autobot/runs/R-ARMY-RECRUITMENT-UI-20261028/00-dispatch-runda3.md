# AutoBot dispatch — runda 3: weryfikacja produkcyjnego spięcia Army

TEMAT: R-ARMY-RECRUITMENT-UI-20261028
RUNDA: 3/5
MODEL + EFFORT: Operator GPT-6 Luna Medium / Evaluator GPT-6 Luna Medium

## WYZWALACZ
Evaluator rundy 2 potwierdził usunięcie duplikatu i testy, ale zgłosił zarzut zakresu: `main.ts` konfiguruje callback, który montuje oddzielną kartę wodza w panelu Armii, lecz plik nie należał do allowlisty, a test wstrzykiwał własny callback. Dodano `main.ts` do allowlisty tylko dla tego importu/callbacku i doprecyzowano kryterium testu.

## GOAL
Potwierdzić, że produkcyjny panel Armii pokazuje dokładnie jedną kartę wodza nad miastami, karta wskazuje stolicę aktywnego ownera, sekcje miast nie dublują dowódcy, a rzeczywisty handler zakupu nadal wykonuje jedną poprawną transakcję.

## KRYTERIA
- Chromium wykonuje prawdziwe produkcyjne renderery dla karty wodza i 24 sekcji miast; jedna karta wodza, nad listą miast, bez duplikatu w stolicy.
- Test sprawdza produkcyjne wiązanie callbacku w `main.ts`: kapitał aktywnego gracza → `mountGeneralRecruitmentCardForArmy(capitalId, host)`. Nie używa niezależnej, dowolnie podstawionej konfiguracji jako jedynego dowodu.
- Test zakupu klika kartę produkcyjną i sprawdza dokładnie jedną transakcję.
- Operator jawnie odróżnia browser behavior od źródłowej asercji boot-wiring, jeśli pełny boot `main.ts` nie jest testowalny w harnessie.
- Testy rekrutacji 19+ oraz test masowy, TypeScript, scoped diff-check przechodzą.

## ALLOWLISTA
- `gra/src/ui/cityPanel.ts`
- `gra/src/ui/empireDetailPanel.ts`
- `gra/src/main.ts` — wyłącznie callback i import dotyczące dedykowanej karty wodza w Army
- `gra/tools/general-capital-recruitment-order-test.cjs`
- `gra/tools/empire-mass-recruitment-test.cjs`
- raporty w tym katalogu

## GRANICE
Nie zmieniać zasad rekrutacji, kosztów, limitów ani AI. Zachować niepowiązane dirty hunks w `main.ts`; bez commit/push/deploy.
