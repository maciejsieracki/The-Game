# Dispatch — H-KAMIENIOLOM-KAMIEN-PRODUKCJA-Q1

TEMAT: H-KAMIENIOLOM-KAMIEN-PRODUKCJA-Q1
RUNDA: 1/5
DATA: 2026-09-08
DOMAIN: GAME
ŚCIEŻKA: B (prompt)
MODEL + EFFORT per rola: Operator GPT-5.6 Luna High / Evaluator GPT-5.6 Luna High / Final Control GPT-5.6 Luna High

## WYZWALACZ

Bezpośrednia decyzja właściciela z 2026-09-08: produkcja Kamienia w Kamieniołomie ma zostać zwiększona dwukrotnie. Temat jest osobny od korekty produkcji Drewna w Tartaku, aby oba parametry i testy były rozdzielone.

## GOAL

Produkcja Kamienia z każdego zbudowanego Kamieniołomu wynosi 100 Kamienia/turę zamiast obecnych 50, bez zmiany produkcji innych ulepszeń, kosztów budowy ani kosztów surowców.

## KRYTERIA KOŃCA — binarne PRAWDA/FAŁSZ

1. PRAWDA: dane Kamieniołomu mają wartość `surowiec_ilosc_tura: 100`.
2. PRAWDA: rzeczywisty resolver i naliczanie terytorialne zwracają 100 za jeden Kamieniołom, 200 za dwa i 0 bez Kamieniołomu.
3. PRAWDA: produkcja Tartaku, Glinianki, kopalń i innych ulepszeń pozostaje bez zmian.
4. PRAWDA: test tematu obejmuje jeden/dwa/brak Kamieniołomów oraz mutację wartości, która powoduje czerwony test.
5. PRAWDA: typecheck i istniejące bramki ekonomii przechodzą bez nowych regresji.

## ALLOWLISTA — nic poza tym

- `gra/data/terrain-improvements.json` — wartość i opis produkcji Kamieniołomu.
- `gra/src/game/terrain-improvements.ts` — resolver produkcji, wyłącznie jeśli wymagane.
- `gra/src/game/turn-economy.ts` — naliczanie, wyłącznie jeśli wymagane.
- `gra/tools/kamieniolom-kamien-produkcja-test.cjs` — nowy test regresyjny tematu.
- `dyspozycje/autobot/runs/H-KAMIENIOLOM-KAMIEN-PRODUKCJA-Q1/00-dispatch.md`.
- `dyspozycje/autobot/runs/H-KAMIENIOLOM-KAMIEN-PRODUKCJA-Q1/01-operator.md`.

Zakazane: `WERSJE.md`, `REJESTR-PROSB-I-ZADAN.md`, `PYTANIA-OTWARTE.md`, handoffy, `gra-robocza/**`, sekrety, deploy, push i integracja do `main`. Nie zmieniaj Tartaku, innych surowców, kosztów budowy, logiki lasu ani UI.

## IZOLACJA

Worktree: `/root/projects/The-Game-worktrees/H-KAMIENIOLOM-KAMIEN-PRODUKCJA-Q1`
Gałąź: `hermes/H-KAMIENIOLOM-KAMIEN-PRODUKCJA-Q1`
Baza: `origin/main`

## REGUŁA PRZECIW SAMOOSZUKIWANIU

Nie wystarczy sprawdzenie JSON. Test musi importować rzeczywisty resolver/naliczanie produkcji, wykazać agregację wielu Kamieniołomów i wykryć mutację wartości lub formuły. Nie uznawaj pojedynczego odczytu `100` za dowód działania ścieżki ekonomii.

## PROCEDURA NAPRAWCZA PRZY FAIL

Evaluator numeruje zarzuty i nie poprawia kodu. Operator wraca na tym samym ID, tej samej gałęzi i worktree jako Obrona. Po 5 rundach temat zatrzymuje się jako `LIMIT-5-EXCEEDED` i wymaga decyzji właściciela.

## GRANICE I OBIEG

Obowiązuje `R-PROC-AUTOBOT.md` §9, zakaz `git add -A`/`git add .`, zakaz `npm run build`/`npm run dev` w `gra/`, zakaz integracji, pushu i deployu.

Operator → Evaluator → Obrona przy zarzutach → Final Control → integracja orkiestratora → READY_FOR_DEPLOY → osobna bramka deploy/push.
