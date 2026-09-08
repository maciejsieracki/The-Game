# Dispatch — H-TARTAK-DREWNO-PRODUKCJA-Q1

TEMAT: H-TARTAK-DREWNO-PRODUKCJA-Q1
RUNDA: 1/5
DATA: 2026-09-08
DOMAIN: GAME
ŚCIEŻKA: B (prompt)
MODEL + EFFORT per rola: Operator GPT-5.6 Luna High / Evaluator GPT-5.6 Luna High / Final Control GPT-5.6 Luna High

## WYZWALACZ

Bezpośrednia decyzja właściciela z 2026-09-08: produkcja Drewna przez Tartak ma wzrosnąć z 50 do 100, a następnie zwiększać się o 50% przy każdej kolejnej epoce. Temat jest nowy i niezależny od blokady trzody na lesie, kosztu budynków oraz karty kolejki.

Wcześniejsza reguła 50/turę i wcześniejsze decyzje dotyczące Tartaku nie są wystarczającym założeniem dla nowej wartości — aktualna decyzja właściciela z tego zgłoszenia jest nadrzędna dla tego tematu. Nie zmieniaj innych ulepszeń ani innych surowców.

## GOAL

Produkcja Drewna z każdego zbudowanego Tartaku wynosi 100/turę w epoce 1 i rośnie multiplikatywnie o 50% za każdą następną epokę właściciela: 150 w epoce 2 i 225 w epoce 3.

## KRYTERIA KOŃCA — binarne PRAWDA/FAŁSZ

1. PRAWDA: źródło danych Tartaku ma wartość bazową 100/turę; sprawdzenie obejmuje `terrain-improvements.json` i resolver produkcji.
2. PRAWDA: resolver zwraca dokładnie 100, 150 i 225 dla epok 1, 2 i 3.
3. PRAWDA: sumowanie produkcji terytorialnej stosuje epokę właściciela i pozostawia pozostałe ulepszenia oraz surowce bez zmian.
4. PRAWDA: test tematu obejmuje co najmniej: jedną epokę, wszystkie trzy epoki, dwa Tartaki, brak Tartaku, przypadek niepoprawnej epoki oraz mutację formuły, która powoduje czerwony test.
5. PRAWDA: istniejące bramki ekonomii, typecheck i testy regresyjne przechodzą bez nowych regresji.

## ALLOWLISTA — nic poza tym

- `gra/data/terrain-improvements.json` — wartość i opis produkcji Tartaku.
- `gra/src/game/terrain-improvements.ts` — czysty resolver produkcji Tartaku z parametrem epoki, jeśli jest konieczny.
- `gra/src/game/turn-economy.ts` — przekazanie epoki właściciela do naliczania produkcji, wyłącznie jeśli wymagane przez istniejącą architekturę.
- `gra/tools/tartak-drewno-epoka-test.cjs` — nowy test regresyjny tematu.
- `dyspozycje/autobot/runs/H-TARTAK-DREWNO-PRODUKCJA-Q1/00-dispatch.md`.
- `dyspozycje/autobot/runs/H-TARTAK-DREWNO-PRODUKCJA-Q1/01-operator.md`.

Zakazane: `WERSJE.md`, `REJESTR-PROSB-I-ZADAN.md`, `PYTANIA-OTWARTE.md`, handoffy, `gra-robocza/**`, sekrety, deploy, push i integracja do `main`. Nie zmieniaj produkcji innych surowców, kosztów budowy, logiki lasu, autobudowania ani UI poza koniecznym opisem danych Tartaku.

## IZOLACJA

Worktree: `/root/projects/The-Game-worktrees/H-TARTAK-DREWNO-PRODUKCJA-Q1`
Gałąź: `hermes/H-TARTAK-DREWNO-PRODUKCJA-Q1`
Baza: `origin/main`

## REGUŁA PRZECIW SAMOOSZUKIWANIU

Nie wystarczy sprawdzenie tekstu JSON ani pojedynczej wartości. Test musi importować rzeczywisty resolver/naliczanie produkcji i dowodzić epok 1–3, agregacji wielu Tartaków, braku produkcji bez Tartaku oraz czerwieni po mutacji formuły. Nie uznawaj wartości 100 w danych za dowód, że ścieżka ekonomii faktycznie jej używa.

## PROCEDURA NAPRAWCZA PRZY FAIL

Evaluator numeruje zarzuty i nie poprawia kodu. Operator wraca na tym samym ID, tej samej gałęzi i w tym samym worktree jako Obrona, odpowiada na każdy zarzut oraz uruchamia brakujące testy. Po 5 rundach zatrzymać temat jako `LIMIT-5-EXCEEDED` i przedstawić decyzję właściciela.

## GRANICE (naruszenie = FAIL)

Obowiązuje `R-PROC-AUTOBOT.md` §9 oraz projektowa reguła jednego pisarza na worktree. Nie używać `git add -A` ani `git add .`. Nie wykonywać `npm run build` ani `npm run dev` w `gra/`. Nie integrować, nie pushować i nie deployować. Nie zmieniać innych zasobów ani mechanizmów poza allowlistą.

## OBIEG

Operator → Evaluator → Obrona Operatora przy zarzutach → Final Control → integracja orkiestratora → READY_FOR_DEPLOY → osobna bramka deploy/push.
