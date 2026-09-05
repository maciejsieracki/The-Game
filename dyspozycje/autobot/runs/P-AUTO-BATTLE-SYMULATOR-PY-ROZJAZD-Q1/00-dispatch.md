# P-AUTO-BATTLE-SYMULATOR-PY-ROZJAZD-Q1 — dispatch

TEMAT: `P-AUTO-BATTLE-SYMULATOR-PY-ROZJAZD-Q1`
RUNDA: 1/5
DATA: 2026-09-05
DOMAIN: INFRA
ŚCIEŻKA: A (Workflow)
MODEL+EFFORT: Operator — Sonnet 5, effort medium; Evaluator — Sonnet 5, effort high;
Final Control — Sonnet 5, effort high.

## WYZWALACZ

Znalezisko Evaluatora węzła `R-WALKA-PRZEWAGA-LICZEBNA-Q1-W1`, potwierdzone niezależnie
przez Obronę i przez Final Control. Nie zgłoszenie właściciela — defekt narzędziowy
wykryty przy okazji.

## RECON (potwierdzony trzema niezależnymi odczytami; POTWIERDŹ własnym)

`gra/tools/auto-battle-power.py:133` liczy `max(L_MIN, min(cap, raw))` — **starą podłogę
NA JEDNOSTKĘ** — ale wykładnik `p` czyta z `gra/data/auto-battle-params.json` (`:35`, `:43`),
czyli już poprawiony **1,2**.

Skutek: symulator odtwarza dziś **krzywą-pułapkę** — suma strat zwycięzcy r=5 → 0,3045,
**r=10 → 0,500, r=20 → 1,000** — czyli rośnie, sprzecznie z runtime TS po integracji W1
(`487b0cfc`), gdzie ciąg jest ściśle malejący: 0,3873 / 0,3656 / 0,3372 / 0,3045 / 0,2650 / 0,2300.

**Dlaczego to ma znaczenie, a nie jest kosmetyką.** Nagłówek `auto-battle-params.json` mówi
wprost: „Panel-C → Auto-walka → eksportuj panel C" — **to jest narzędzie, którym właściciel
stroi balans walki**. Rozjechany symulator doradzałby wartości wyliczone z nieaktualnego
wzoru, więc następna kalibracja startowałaby z fałszywych liczb.

**Kontekst historyczny — dokładnie ta pułapka zepsuła W1 w trakcie pracy.** Sama zmiana
wykładnika bez przeniesienia `L_MIN` z jednostki na sumę składu **nie naprawia tematu**:
suma zawraca i przy 20:1 wraca do 1,000. Symulator jest dziś w tym właśnie stanie pośrednim.

## GOAL

`gra/tools/auto-battle-power.py` liczy **to samo, co runtime TS** (`gra/src/game/auto-battle-power.ts`)
na tym samym zestawie parametrów, a rozjazd nie może się powtórzyć po cichu.

Dwie rzeczy, obie wymagane:

1. **Zrównanie wzoru.** Podłoga `L_MIN` przeniesiona z jednostki na SUMĘ składu, oraz
   kolejność zaokrąglenia taka jak w TS: **zaokrąglenie NAJPIERW, podłoga POTEM**
   (`Math.max(floor, Math.round(Math.min(cap, raw) * 10000) / 10000)`). Ta druga część
   nie jest kosmetyką — w TS jej odwrócenie zerowało straty od r≈1866.
2. **Bramka porównawcza** `gra/tools/auto-battle-py-vs-ts-parytet-test.cjs`: dla wspólnego
   zestawu stosunków sił oba wzory dają **te same** liczby, w tolerancji ±0,0005.

## KRYTERIA KOŃCA (binarne)

1. Symulator odtwarza ciąg **0,3873 / 0,3656 / 0,3372 / 0,3045 / 0,2650 / 0,2300**
   dla r = 1,5 / 2 / 3 / 5 / 10 / 20 — czyli identyczny jak runtime TS.
2. Nowa bramka porównuje **oba** źródła na co najmniej 12 punktach, w tym skrajnych
   (r = 1,5 / 2 / 3 / 5 / 10 / 20 / 100 / 1000 / 2000 / 5000 / 41821 / 50000) i **czerwienieje
   po cofnięciu zmiany w `.py`** — pokaż wynik po mutacji.
3. Bramka pokrywa również **stronę przegranego** (`loserLossPct`), nie tylko zwycięzcę.
4. Bramka czyta parametry z `auto-battle-params.json`, a **nie ma ich zaszytych** — inaczej
   następna zmiana kalibracji znów rozjedzie oba źródła bez sygnału.
5. `tsc --noEmit` zielone; `auto-battle-power-test` i `auto-battle-przewaga-monotonicznosc-test`
   zielone (bez zmian — to jest strona TS, której NIE ruszasz).
6. Pięć bramek referencyjnych zielonych: logic 213/213, tech-tree 19/19, research 33/33,
   unit-replace 13/13, combat 6/6.

## REGUŁA PRZECIW SAMOOSZUKIWANIU

**Zakaz „naprawy" przez zmianę strony TS.** Runtime TS jest ŹRÓDŁEM PRAWDY — został
zintegrowany po pełnym cyklu AutoBot z Final Control PASS. Symulator ma się do niego
dostosować, nie odwrotnie. Jakakolwiek zmiana w `gra/src/game/auto-battle-power.ts`
albo w `gra/data/auto-battle-params.json` = naruszenie allowlisty.

**Drugi tryb: bramka porównująca dwie kopie tego samego wzoru.** Jeśli napiszesz w bramce
własną implementację i porównasz ją z `.py`, nie zmierzysz niczego. Bramka ma wołać
**rzeczywisty kod TS** (przez esbuild, wzorem pozostałych bramek w tym repo) i **rzeczywisty
skrypt `.py`** (przez `child_process`), a nie ich reimplementacje.

**Trzeci tryb: sprawdzenie tylko zakresu grywalnego.** Rozjazd, o którym mowa, ujawnia się
przy r ≥ 10, a zerowanie strat w TS ujawniało się dopiero przy r ≈ 1866. Punkty skrajne
z kryterium 2 są obowiązkowe.

## ALLOWLISTA

- `gra/tools/auto-battle-power.py`
- `gra/tools/auto-battle-py-vs-ts-parytet-test.cjs` (NOWY)
- `dyspozycje/autobot/runs/P-AUTO-BATTLE-SYMULATOR-PY-ROZJAZD-Q1/`

Zakazane bezwzględnie: **`gra/src/game/auto-battle-power.ts`**, **`gra/data/auto-battle-params.json`**
(źródło prawdy — patrz reguła wyżej), `gra/src/main.ts`, pliki z sekretami, `docs/decyzje/**`,
`.git/**`, `dyspozycje/WERSJE.md`, `gra-robocza/**`, `ROBOCZA-MANIFEST.json`, `playbook.json`.

## IZOLACJA

Worktree `/home/user/wt-symulator-py`, gałąź `autobot/P-AUTO-BATTLE-SYMULATOR-PY-ROZJAZD-Q1`,
baza jawnie: `origin/main` na SHA podanym przy zakładaniu worktree.

C-001 (bariera CHRONIONA): „Zakaz `npm run build`/`dev` w `gra/` (export-data nadpisuje JSON)
— dozwolona komenda: `node ./node_modules/vite/bin/vite.js build --outDir dist --emptyOutDir".
Jedyna dozwolona kompilacja: `node ./node_modules/typescript/bin/tsc --noEmit`.
`--outDir` POZA drzewem repo.

## PROCEDURA NAPRAWCZA PRZY FAIL

Evaluator wskazuje JEDEN konkretny defekt. Runda N+1 na TYM SAMYM ID i TEJ SAMEJ gałęzi.
Po 5 rundach: `LIMIT-5-EXCEEDED`.

## GRANICE

Nie integrujesz, nie deployujesz, nie pushujesz. Zakaz `git add -A` i `git add .`.
Raport maksymalnie ok. 400 słów. **Raport commituj OD RAZU po zapisaniu.**

## OBIEG

Operator → Evaluator → (Obrona, jeśli lista zarzutów niepusta). Final Control osobnym
wywołaniem Workflow. Integracja i deploy — ręką orkiestratora.
