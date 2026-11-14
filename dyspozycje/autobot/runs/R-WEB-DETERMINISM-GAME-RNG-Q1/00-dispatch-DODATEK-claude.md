# R-WEB-DETERMINISM-GAME-RNG-Q1 — DODATEK orkiestratora (runda 1)

## Wejście: audyt R-WEB-DETERMINISM-SAME-SEED-AUDIT-Q1 (FC PASS)
Raporty w commicie 11af9998c (dostępny w repo: `git show 11af9998c:dyspozycje/autobot/runs/R-WEB-DETERMINISM-SAME-SEED-AUDIT-Q1/10-operator-claude.md`, 20-evaluator..., 30-obrona..., evidence/*.json, evidence/mutant-B-patch.diff). Kluczowe: ziarno 2222, rel 20, prepared, 30 tur, tryb przyspieszony: baseline 6 przebiegów rozjeżdża się od t25 (3× oferta sól→glina w t25, 3× drewno→glina w t26); mutacja G (globalny Math.random → PRNG z ziarnem przy ?civTest=1): 6/6 identycznych; mutacja B (tylko main.ts:41036, :44291, :32394): 8/8 identycznych. Kandydaci niezbadani pojedynczo: zegarowe gatowanie tury (main.ts ~38506, Date.now > 8 s), rAF/animacje (~44663), ID jednostek i sortowania po id (ai.ts ~5311, main.ts ~7904), źródło ziarna: main.ts:1992 SEED = Math.random, _gameSeed używany w 2146, 2629, 14164, 45100, 45559; hak civSeed seeduje dziś tylko mapę (civ-test-hooks.ts ~110, main.ts ~46381), nie grę.

## Wymagane
1. Rozdziel przyczyny: mutacje POJEDYNCZE (każde z trzech miejsc osobno i razem), licznik wywołań (które faktycznie się wykonują w 30 turach). Wskaż minimalny zbiór konieczny.
2. Naprawa: generator z ziarnem (strumienie pochodne od ziarna gry + tura + ownerId lub równoważnie) w miejscach z kroku 1 oraz w villageRewards.ts (domyślny rng). W grze zwykłej ziarno nowej gry pozostaje losowe (rozkład losowości dla gracza bez zmian), ale z jednego ziarna wynika jeden przebieg. Ziarno ma się zapisywać/wczytywać z zapisem gry, jeśli już dziś jest w zapisie (sprawdź; nie zmieniaj formatu zapisu bez migracji i testu starego zapisu).
3. Hak ?civTest=1: podawanie ziarna gry (nie tylko mapy) tak, by runner pomiarowy mógł powtarzać przebiegi.
4. Zakaz regresji: dodaj do testu regułę „brak Math.random w gra/src/game/** poza wyjątkami z uzasadnieniem” (lista wyjątków jawna w teście, wylistuj w raporcie każde znalezione użycie z plik:linia i czy wpływa na stan).
5. Powtórz pomiar z audytu (ziarno 2222, rel 20, 30 tur, fast): ≥ 6 przebiegów — oczekiwane identyczne; oraz tryb normalny ≥ 3 przebiegi; oraz drugie ziarno. Dowód liczbowy; jeśli rozbieżność zostanie, wskaż pierwszą turę i pole (dodaj skrót stanu: liczba jednostek, skarbiec, zasoby, relacje, tabela ofert) — Evaluator wytknął brak skrótu stanu w audycie.

## Kryteria końca (binarne)
- tsc --noEmit exit 0; pięć bramek: logic 213/213, tech-tree 20/0, research 33/0, unit-replace 21/21, combat 6/6; testy zależne od losowości nie osłabione (jeśli asercja zależała od konkretnej wartości losowej, przepisz na niezależną i opisz).
- Nowy test determinism-same-seed-test.cjs: generator z ziarnem powtarzalny; reguła braku Math.random w gra/src/game/**; mutacja (przywrócenie Math.random w jednym z trzech miejsc) czerwieni test na poziomie źródła ORAZ pomiar przebiegów (surowe wyniki w raporcie).
- Pomiar 6/6 (lub więcej) identycznych w trybie przyspieszonym i ≥ 3/3 w normalnym.
- git diff --name-only względem bazy tylko z allowlisty.

## Środowisko i zakazy
Worktree, w gra/ npm ci --ignore-scripts; ZAKAZ npm run build/dev; tsc --noEmit wolno; przeglądarka Chromium tylko jak istniejące narzędzia pomiarowe (zmierz czas, uruchamiaj w pierwszym planie ≤ 590 s). Dysk bywa < 8 GB: sprzątaj po sobie. Nie integrujesz, nie deployujesz, nie pushujesz na main. Bez git add -A. NIGDY nie wywołuj spawn_task ani innych narzędzi zakładających sesje.
