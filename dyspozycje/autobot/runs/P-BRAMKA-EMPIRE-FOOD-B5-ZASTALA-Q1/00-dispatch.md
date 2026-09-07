# P-BRAMKA-EMPIRE-FOOD-B5-ZASTALA-Q1 — dispatch

TEMAT: `P-BRAMKA-EMPIRE-FOOD-B5-ZASTALA-Q1`
RUNDA: 1/5
DOMAIN: PROCESS (podejrzenie: literał kosztu żywności wojska nieaktualny wobec dzisiejszej
formuły/mnożnika — POTWIERDŹ, nie zakładaj)
ŚCIEŻKA: A (Workflow)
MODEL+EFFORT: Operator — Sonnet 5, effort medium; Evaluator — Sonnet 5, effort high;
Final Control — Sonnet 5, effort high (`R-PROC-AUTOBOT.md` §5a; nie wizualny).

## GENEZA

Jedna z pięciu bramek zarejestrowanych jako pre-istniejąco czerwone przy okazji tematu
`P-DESIGN-11-ZAKLADEK-DROBIAZGI-Q1` (`dowody/rodzina-panelu.md`), rozdzielona na osobny
temat: `P-BRAMKI-EMPIRE-PANEL-PIEC-CZERWONYCH-ZASTALE-Q1`.

`gra/tools/empire-food-b5-test.cjs`: 25 pass / 3 fail. Failing asercje:
```
FAIL: koszt wojska = 2 (×2 R-STAWKI)
FAIL: po wojsku zostaje 14
FAIL: wojsko zjada po miastach — 6-2=4
```

**Recon orkiestratora (POTWIERDŹ własnym odczytem, nie zakładaj):** scenariusz testowy
(`tools/empire-food-b5-test.cjs`, sekcja „Q2: miasta przed wojskiem") buduje jedną jednostkę
`{ ownerId: 0, typeId: 'woj', camping: false }`, licząc jej koszt żywności przez
`militaryFoodConsumptionWithSpichlerz` (`gra/src/game/turn-economy.ts:1345`), która woła
`unitFoodPerTurn(u, upkeep, foodTable)` × mnożnik ze `spichlerzArmyFoodCostMultiplier`.
Test zakłada wynik `2` (komentarz w teście: „×2 R-STAWKI" — sugeruje, że gdzieś istnieje
mnożnik ×2 analogiczny do `R_STAWKI_FALA2_MULT` widzianego w innych tematach tej sesji,
np. `gra/src/game/r-stawki-strojenie.ts:9`, `R_STAWKI_FALA2_MULT = 2`). **Ustal, czy
`unitFoodPerTurn` faktycznie stosuje dziś ten sam mnożnik, inny, czy żaden** — i czy bazowa
wartość `zywnoscJednostkaRuch` (w teście = `1`) jest wciąż tą samą stałą, jaką silnik
faktycznie czyta z `upkeep`. Trzy failujące asercje są ze sobą powiązane łańcuchowo (ta sama
jednostka, kolejne kroki tej samej symulacji) — jedna przyczyna źródłowa prawdopodobna.

## GOAL

1. Ustal DOKŁADNĄ przyczynę rozjazdu: czytaj `unitFoodPerTurn`
   (`gra/src/game/turn-economy.ts` lub `economy-upkeep.ts` — zlokalizuj definicję),
   `spichlerzArmyFoodCostMultiplier`, oraz historię zmian (jeśli grep/git blame ujawni
   niedawną zmianę mnożnika lub bazowej stawki). Zmierz REALNY wynik funkcji dla dokładnie
   tego samego wejścia co scenariusz testu (jednostka `woj`, nie w obozie, nie w garnizonie,
   `upkeep.zywnoscJednostkaRuch=1`).
2. Jeśli literał testu (`2`, `14`, `4`) jest po prostu nieaktualny wobec prawidłowej,
   niezmienionej formuły silnika (kategoria „test podążający za już wdrożoną zmianą",
   `PROCEDURA-NUMER-ABC-COMMIT-DEPLOY.md` §3b, bez ABC-first) — zaktualizuj WSZYSTKIE
   powiązane literały w tym scenariuszu (i w scenariuszach zależnych dalej w pliku, jeśli
   dziedziczą tę samą wartość) do wartości faktycznie zwracanej przez realną funkcję (wywołaj
   ją naprawdę w bramce, nie przepisuj wzoru).
3. Jeśli okaże się, że sama formuła/mnożnik ma błąd (np. licząc niezgodnie z własną
   dokumentacją/komentarzami w kodzie) — to NIE jest już naprawa testu, tylko możliwa
   regresja balansu ekonomii wojska. **STOP, DECISION_REQUIRED** z dokładnym opisem
   rozbieżności, nie zmieniaj kodu produkcyjnego samodzielnie.

## BINARNE KRYTERIUM SUKCESU

- `node tools/empire-food-b5-test.cjs` → 28/28 (dziś 25/3), zero osłabienia liczby asercji,
  LUB jawny `DECISION_REQUIRED` jeśli przyczyna okaże się realną regresją formuły.
- Nowe/poprawione literały muszą być wyprowadzone z REALNEGO wywołania funkcji silnika w
  samej bramce (przez bundlowany import), nie z ręcznie przeliczonego wzoru w komentarzu.
- Zero zmian w `gra/src/**`.
- `tsc --noEmit`, 5 bramek referencyjnych (logic-test, tech-tree-test, research-test,
  unit-replace-test, combat-test) zielone.

## ALLOWLISTA

- `gra/tools/empire-food-b5-test.cjs`
- `dyspozycje/autobot/runs/P-BRAMKA-EMPIRE-FOOD-B5-ZASTALA-Q1/**`

Zakazane bezwzględnie: `gra/src/**`, `gra/data/**`, pliki z sekretami, `docs/decyzje/**`,
`.git/**`, `dyspozycje/WERSJE.md`, `gra-robocza/**`, `ROBOCZA-MANIFEST.json`,
`playbook.json`. Zakaz `git add -A` i `git add .`.

## IZOLACJA

Worktree `/home/user/wt-empire-food-b5-zastala`, gałąź
`autobot/P-BRAMKA-EMPIRE-FOOD-B5-ZASTALA-Q1`, baza jawnie `origin/main` (commit `8429ad3e`)
— potwierdź `git log -1` PRZED pracą (SS2b).

C-001: zakaz `npm run build`/`dev` w `gra/`; jedyna dozwolona kompilacja `tsc --noEmit`;
bramki `node tools/*-test.cjs` nie są objęte zakazem.

## PROCEDURA NAPRAWCZA PRZY FAIL

Evaluator wskazuje konkretny defekt i poprawkę; runda N+1 na TYM SAMYM ID i TEJ SAMEJ gałęzi.
Po 5 rundach: `LIMIT-5-EXCEEDED`.

## GRANICE

- Zero zmian mechaniki/ekonomii — WYŁĄCZNIE naprawa testu.
- Nie integrujesz, nie deployujesz, nie pushujesz.
- Jeśli formuła silnika ma realny błąd — zawsze DECISION_REQUIRED, nie samodzielna naprawa.

## OBIEG

Operator → Evaluator (ponumerowane zarzuty) → Obrona (gdy lista niepusta) → koniec skryptu.
Final Control osobno (Workflow, Sonnet 5 effort high), integracja allowlist-only ręką
orkiestratora.
