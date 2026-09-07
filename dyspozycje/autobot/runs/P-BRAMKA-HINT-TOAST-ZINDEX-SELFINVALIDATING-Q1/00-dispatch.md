# P-BRAMKA-HINT-TOAST-ZINDEX-SELFINVALIDATING-Q1 — dispatch

TEMAT: `P-BRAMKA-HINT-TOAST-ZINDEX-SELFINVALIDATING-Q1`
RUNDA: 1/5
DOMAIN: INFRA (harness bramki wymaga przepisania po integracji naprawy, którą pilnował —
zero zmiany balansu/mechaniki)
ŚCIEŻKA: A (Workflow)
MODEL+EFFORT: Operator — Sonnet 5, effort medium; Evaluator — Sonnet 5, effort high;
Final Control — Sonnet 5, effort high (`R-PROC-AUTOBOT.md` §5a; nie wizualny).

## GENEZA

Jedna z pięciu bramek zarejestrowanych jako pre-istniejąco czerwone przy okazji tematu
`P-DESIGN-11-ZAKLADEK-DROBIAZGI-Q1` (`dowody/rodzina-panelu.md`), rozdzielona na osobny
temat: `P-BRAMKI-EMPIRE-PANEL-PIEC-CZERWONYCH-ZASTALE-Q1`.

`gra/tools/hint-toast-zindex-empire-panel-test.cjs` przerywa się własnym wyjątkiem
(nie FAIL asercji, tylko `Error` rzucony w trakcie budowania):
```
[hint-toast-zindex-empire-panel-test] budowanie bundla AFTER (bieżący main.ts z naprawą)...
[hint-toast-zindex-empire-panel-test] budowanie bundla BEFORE (main.ts z origin/main, bez naprawy)...
[hint-toast-zindex-empire-panel-test] błąd: Error: origin/main:gra/src/main.ts już zawiera
naprawę -- BEFORE bundle nie byłby "przed"
```

**Recon orkiestratora (POTWIERDŹ własnym odczytem):** ten harness porównuje DWA bundle —
„PRZED" (kod z `origin/main` w chwili, gdy naprawa jeszcze nie istniała) i „PO" (bieżący
`main.ts`) — żeby udowodnić, że naprawa realnie coś zmienia (dowód przeciw tautologii).
Sam plik ma wbudowaną kontrolę bezpieczeństwa: jeśli wykryje, że `origin/main` JUŻ ZAWIERA
naprawę (bo została w międzyczasie zintegrowana do głównej gałęzi), przerywa się jawnym
błędem zamiast dawać fałszywy/bezsensowny wynik „PRZED" identyczny z „PO". Naprawa, którą
ta bramka pilnowała, została integrowana do `main` jakiś czas temu — bramka teraz zawsze
przerywa się tym błędem, bo `origin/main` (właściwy punkt odniesienia dla „PRZED") już nie
istnieje w stanie sprzed naprawy.

## GOAL

1. Znajdź w kodzie bramki (funkcja `buildBeforeBundle`, ok. linii 92) DOKŁADNY commit/SHA
   lub opis, którego bramka szuka jako „PRZED" (czytaj kod, nie zgaduj) — prawdopodobnie
   commit SPRZED integracji naprawy z-index tooltipa/toastu w panelu imperium.
2. **Ustal, czy dokładny commit „PRZED" (SHA sprzed integracji naprawy) jest osiągalny w
   historii repo** (`git log --all`, nie tylko `origin/main` — commit mógł zostać
   zachowany na starej gałęzi albo jako rodzic commita integrującego naprawę na `main`).
   Jeśli TAK — zaktualizuj harness, żeby budował bundle „PRZED" z TEGO KONKRETNEGO,
   zamrożonego SHA (stała w kodzie bramki, nie `origin/main` ruchome), zamiast zakładać, że
   `origin/main` zawsze jest „sprzed naprawy". To przywraca bramkę do stałego, powtarzalnego
   dowodu nietautologiczności niezależnie od dalszego rozwoju `main`.
3. Jeśli commit „PRZED" NIE jest już osiągalny (historia przepisana/wyczyszczona) — dowód
   „PRZED vs PO" z żywego kodu nie jest już możliwy do odtworzenia. W tym wypadku:
   przepisz harness tak, żeby dowodził nietautologiczności przez MUTACJĘ bieżącego kodu
   (cofnij naprawę tymczasowo w pamięci roboczej — kopią pliku, nie `git checkout` — i
   pokaż, że test wtedy czerwienieje), zamiast przez budowanie dwóch bundli z dwóch
   punktów historii. To jest ten sam wzorzec dowodu mutacyjnego używany przez wszystkie
   inne bramki tej sesji.
4. W obu przypadkach: zachowaj WSZYSTKIE realne asercje sprawdzające z-index/kolejność
   nakładania się elementów — cel to naprawić MECHANIZM DOWODU, nie osłabić go.

## BINARNE KRYTERIUM SUKCESU

- `node tools/hint-toast-zindex-empire-panel-test.cjs` kończy się PEŁNYM wynikiem
  (PASS/FAIL na asercjach), nie przerywa się wyjątkiem `Error` w trakcie budowania.
- Bramka nadal dowodzi nietautologiczności naprawy z-index (metoda 2 lub 3 z GOAL,
  wybrana i uzasadniona w raporcie) — pokaż to explicite: sztuczne cofnięcie naprawy
  (dowolną z dwóch metod) musi realnie zaczerwienić bramkę.
- Zero zmian w `gra/src/**`.
- `tsc --noEmit`, 5 bramek referencyjnych (logic-test, tech-tree-test, research-test,
  unit-replace-test, combat-test) zielone.

## ALLOWLISTA

- `gra/tools/hint-toast-zindex-empire-panel-test.cjs`
- `dyspozycje/autobot/runs/P-BRAMKA-HINT-TOAST-ZINDEX-SELFINVALIDATING-Q1/**`

Zakazane bezwzględnie: `gra/src/**`, `gra/data/**`, pliki z sekretami, `docs/decyzje/**`,
`.git/**` (poza odczytem historii — `git log`/`git show`, zero zapisu), `dyspozycje/WERSJE.md`,
`gra-robocza/**`, `ROBOCZA-MANIFEST.json`, `playbook.json`. Zakaz `git add -A` i `git add .`.

## IZOLACJA

Worktree `/home/user/wt-hint-toast-zindex-selfinvalidating`, gałąź
`autobot/P-BRAMKA-HINT-TOAST-ZINDEX-SELFINVALIDATING-Q1`, baza jawnie `origin/main`
(commit `8429ad3e`) — potwierdź `git log -1` PRZED pracą (SS2b). Ta bramka może potrzebować
`git log --all`/`git show` na PEŁNEJ historii repo (nie tylko sparse-checkout worktree) —
jeśli sparse-checkout ogranicza widoczność historii commitów, zgłoś to w raporcie zamiast
zgadywać.

C-001: zakaz `npm run build`/`dev` w `gra/`; jedyna dozwolona kompilacja `tsc --noEmit`;
bramki `node tools/*-test.cjs` nie są objęte zakazem.

## PROCEDURA NAPRAWCZA PRZY FAIL

Evaluator wskazuje konkretny defekt i poprawkę; runda N+1 na TYM SAMYM ID i TEJ SAMEJ gałęzi.
Po 5 rundach: `LIMIT-5-EXCEEDED`.

## GRANICE

- Zero zmian mechaniki/UI — WYŁĄCZNIE naprawa harnessu bramki.
- Nie integrujesz, nie deployujesz, nie pushujesz.

## OBIEG

Operator → Evaluator (ponumerowane zarzuty) → Obrona (gdy lista niepusta) → koniec skryptu.
Final Control osobno (Workflow, Sonnet 5 effort high), integracja allowlist-only ręką
orkiestratora.
