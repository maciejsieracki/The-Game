# P-BRAMKA-EMPIRE-OBYWATELE-TRADE-SNAP-Q1 — dispatch

TEMAT: `P-BRAMKA-EMPIRE-OBYWATELE-TRADE-SNAP-Q1`
RUNDA: 1/5
DOMAIN: GAME (podejrzenie: możliwy REALNY bug w `buildEmpireTradeSnap()`, nie tylko stary
literał — traktuj ostrożniej niż typową naprawę testu)
ŚCIEŻKA: A (Workflow)
MODEL+EFFORT: Operator — Sonnet 5, effort medium; Evaluator — Sonnet 5, effort high;
Final Control — Sonnet 5, effort high (`R-PROC-AUTOBOT.md` §5a; nie wizualny).

## GENEZA

Jedna z pięciu bramek zarejestrowanych jako pre-istniejąco czerwone przy okazji tematu
`P-DESIGN-11-ZAKLADEK-DROBIAZGI-Q1` (`dowody/rodzina-panelu.md`), rozdzielona na osobny
temat: `P-BRAMKI-EMPIRE-PANEL-PIEC-CZERWONYCH-ZASTALE-Q1`.

`gra/tools/empire-panel-miasto-obywatele-content-test.cjs`: 113 pass / 2 fail. Failing
asercje:
```
FAIL: buildEmpireTradeSnap(): EmpireTradeRouteRow.cityId = r.fromCityId (TradeRoute), obok cityName istniejącego
FAIL: T6: buildEmpireTradeSnap() liczy premię 5% przez tradeRouteBuildingBonusForRoute() (trade-routes.ts), nie własnym wzorem
```

**To NIE jest oczywisty przypadek starego literału** (w przeciwieństwie do innych bramek
tej rodziny) — obie asercje opisują STRUKTURALNE/ARCHITEKTONICZNE oczekiwanie wobec
funkcji `buildEmpireTradeSnap()`: (1) że zwracany wiersz `EmpireTradeRouteRow` ma pole
`cityId` ustawione na `r.fromCityId` z obiektu `TradeRoute`, obok już istniejącego
`cityName`; (2) że premia 5% jest liczona przez REALNE wywołanie
`tradeRouteBuildingBonusForRoute()` (z `gra/src/game/trade-routes.ts`), nie przez
duplikat wzoru napisany od nowa w `buildEmpireTradeSnap()` albo w samym teście.

## GOAL

1. **Ustal, czytając kod `buildEmpireTradeSnap()` (znajdź plik grepem —
   prawdopodobnie `gra/src/ui/empireDetailPanel.ts` albo pokrewny), czy pole `cityId` w
   zwracanym `EmpireTradeRouteRow` istnieje dziś i skąd pochodzi.** Trzy możliwe stany:
   (a) `cityId` już jest ustawiane z `r.fromCityId`, a test źle to sprawdza (kwestia
   kotwiczenia/nazwy pola w teście — zwykła naprawa testu);
   (b) `cityId` nie istnieje wcale w typie/obiekcie zwracanym — realny brak pola, którego
   dispatch/test oczekuje jako części kontraktu — **DECISION_REQUIRED**, bo dodanie pola
   do publicznego kształtu danych panelu to zmiana kontraktu, nie tylko testu;
   (c) coś pomiędzy (np. pole istnieje pod inną nazwą) — udokumentuj precyzyjnie.
2. **Ustal analogicznie dla premii 5%:** czy `buildEmpireTradeSnap()` (lub kod, który
   zasila dane do niego) faktycznie woła `tradeRouteBuildingBonusForRoute()` z
   `trade-routes.ts`, czy liczy premię własnym, zduplikowanym wzorem. Jeśli duplikat —
   to jest RYZYKO ucieczki mutacyjnej (doktryna projektu C-046: duplikat formuły to
   czynnik ryzyka, nie sposób na „unikanie tautologii" — nie odwracaj tej logiki w
   uzasadnieniu, to był już raz błąd w tej sesji). Sprawdź, czy dzisiejsza wartość liczbowa
   premii (5%) jest mimo duplikatu POPRAWNA (zgodna z realną funkcją), czy się rozjechała.
3. **To jest zadanie DIAGNOSTYCZNE w pierwszej kolejności.** Napraw WYŁĄCZNIE jeśli obie
   rozbieżności okażą się być kwestią kotwiczenia/nazewnictwa w samym teście (stan (a)
   powyżej dla obu asercji) — wtedy przekotwicz test na realny kod, bez zmiany
   `gra/src/**`. W KAŻDYM INNYM przypadku (brakujące pole w kontrakcie, zduplikowana
   formuła z rozjazdem wartości, albo jakakolwiek niepewność) — **STOP, DECISION_REQUIRED**
   z pełnym opisem obu stanów faktycznych (test vs. kod), nie próbuj naprawiać kodu
   produkcyjnego ani testu na siłę.

## BINARNE KRYTERIUM SUKCESU

- `node tools/empire-panel-miasto-obywatele-content-test.cjs` → 115/115 (dziś 113/2), zero
  osłabienia liczby asercji, **WYŁĄCZNIE jeśli oba przypadki są kategorii (a)** — LUB jawny
  `DECISION_REQUIRED` z precyzyjnym opisem stanu faktycznego kodu, jeśli którykolwiek
  przypadek jest (b)/(c)/niepewny.
- Zero zmian w `gra/src/**` w KAŻDYM scenariuszu tej rundy (nawet przy naprawie testu —
  to jest z definicji zadanie test-only w tej rundzie; zmiana kodu wymaga osobnej decyzji).
- `tsc --noEmit`, 5 bramek referencyjnych (logic-test, tech-tree-test, research-test,
  unit-replace-test, combat-test) zielone.

## ALLOWLISTA

- `gra/tools/empire-panel-miasto-obywatele-content-test.cjs`
- `dyspozycje/autobot/runs/P-BRAMKA-EMPIRE-OBYWATELE-TRADE-SNAP-Q1/**`

Zakazane bezwzględnie: `gra/src/**` (w tym `trade-routes.ts`, `empireDetailPanel.ts` —
diagnoza TAK, zmiana kodu wymaga DECISION_REQUIRED), `gra/data/**`, pliki z sekretami,
`docs/decyzje/**`, `.git/**`, `dyspozycje/WERSJE.md`, `gra-robocza/**`,
`ROBOCZA-MANIFEST.json`, `playbook.json`. Zakaz `git add -A` i `git add .`.

## IZOLACJA

Worktree `/home/user/wt-empire-obywatele-trade-snap`, gałąź
`autobot/P-BRAMKA-EMPIRE-OBYWATELE-TRADE-SNAP-Q1`, baza jawnie `origin/main`
(commit `8429ad3e`) — potwierdź `git log -1` PRZED pracą (SS2b).

C-001: zakaz `npm run build`/`dev` w `gra/`; jedyna dozwolona kompilacja `tsc --noEmit`;
bramki `node tools/*-test.cjs` nie są objęte zakazem.

## PROCEDURA NAPRAWCZA PRZY FAIL

Evaluator wskazuje konkretny defekt i poprawkę; runda N+1 na TYM SAMYM ID i TEJ SAMEJ gałęzi.
Po 5 rundach: `LIMIT-5-EXCEEDED`.

## GRANICE

- Zero zmian mechaniki handlu — to jest zadanie diagnostyczne + ewentualna naprawa testu.
- Nie integrujesz, nie deployujesz, nie pushujesz.
- Każda niepewność co do stanu kodu produkcyjnego → DECISION_REQUIRED, nigdy zgadywanie.

## OBIEG

Operator → Evaluator (ponumerowane zarzuty) → Obrona (gdy lista niepusta) → koniec skryptu.
Final Control osobno (Workflow, Sonnet 5 effort high), integracja allowlist-only ręką
orkiestratora.
