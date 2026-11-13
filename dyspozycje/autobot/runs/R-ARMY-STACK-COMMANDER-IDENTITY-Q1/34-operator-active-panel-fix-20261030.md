# Operator — dowódca w aktywnych kartach stosu

**Etap: 4/11 — poprawka aktywnego renderera przygotowana; testy operatora zaliczone.**

## Zmiana

Aktywny panel jednostki używa kart z `hexContextTooltip.ts`, nie legacy `armyStackHud`.
Model `stackCards` ma teraz opcjonalne `commanderTitle`. Gdy karta reprezentuje wodza/generała,
renderer pokazuje złote `★ Wódz` lub `★ Generał`, poniżej zachowuje typ bojowy (np. `Wojownik`),
wyróżnia kartę obramowaniem i udostępnia pełną nazwę przez `aria-label` i `title`. Rozszerzona
linia wybranej jednostki również zawiera rolę i typ. Karty zwykłych jednostek tego samego typu
pozostają bez oznaczenia.

## Weryfikacja

- `node tools/army-stack-commander-identity-test.cjs` — **8/8 scenariuszy PASS**. Test zachowuje
  asercje dla RuntimeUnit/save i legacy HUD oraz renderuje 89 kart przez rzeczywisty renderer
  `buildUnitContextTooltipHtml`: po jednej karcie dla Wodza i Generała, dokładnie 88 zwykłych,
  właściwe ID, czytelna rola+typ, dostępna nazwa oraz rozszerzony label zaznaczonej jednostki.
- `npm run typecheck` — **PASS**.
- `git diff --check` — **PASS**.

Zmiana nie została scalona, poddana niezależnej ewaluacji ani wdrożona. Następny krok: Evaluator
sprawdza aktywną ścieżkę i czytelność kart, po czym Obrona/Final Control i zwykły release workflow.
