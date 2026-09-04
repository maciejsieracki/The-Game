# R-WALKA-PRZEWAGA-LICZEBNA-Q1-W1 — dispatch (auto-bitwa mapy: arytmetyka strat)

TEMAT: `R-WALKA-PRZEWAGA-LICZEBNA-Q1-W1`
RUNDA: 1/5
DATA: 2026-09-04
DOMAIN: GAME
ŚCIEŻKA: A (Workflow)
MODEL+EFFORT: Operator — Sonnet 5, effort medium; Evaluator — Sonnet 5, effort high;
Final Control — Sonnet 5, effort high.

## WYZWALACZ (dosłownie, właściciel)

> „W bitwach brakuje trochę elementu przewagi. Potrafię atakować jedną jednostkę
> dwudziestoma jednostkami i ta jedna jednostka zadaje większe straty, niż bym
> wystąpił czasem dwoma jednostkami na jedną."

Doprecyzowanie kierunku naprawy:
> „Być może należy odwrócić tę statystykę i, tak jak obecnie, armia z przewagą traci
> więcej; trzeba by było na tych samych liczbach obrócić w drugą stronę, aby armia
> z niedoborem, z mniejszą liczbą żołnierzy, traciła więcej."

Zielone światło:
> „Co do naprawy auto-bitwy masz zielone światło (…) możesz naprawić tak, jak
> napisałeś w trzech punktach."

## RECON (policzony przez orkiestratora; POTWIERDŹ własnym odczytem i własnym rachunkiem)

**A. Wzór i miejsce.** `gra/src/game/auto-battle-power.ts`:
- `coreLoss(r, p, L_MAX) = L_MAX / r^p` (`:82-85`)
- `winnerLossPct` (`:87-91`) = `coef_zwyciezca × coreLoss`, dolny clamp `L_MIN`, górny `cap`
- `loserLossPct` (`:93-96`) = `coef_przegrany × (1 − coreLoss)`
- przypisanie do stron: `:171-175` — `p_atk` rządzi stratą ATAKUJĄCEGO, `p_def` stratą
  BRONIĄCEGO, niezależnie od tego, kto wygrał. **To są parametry STRON, nie RÓL.**
- nałożenie na skład: `applyLossPctToRoster` (`:196-207`) nakłada `lossPct × lineWeight`
  na **KAŻDĄ jednostkę** składu.

Parametry `gra/data/auto-battle-params.json → straty`: `L_MAX 0.42`, `p_atk 0.58`,
`p_def 0.58`, `L_MIN 0.05`, `coef_zwyciezca 1.0`, `coef_przegrany 1.0`.

**B. Zmierzony absurd — to jest defekt do naprawy.** Suma strat zwycięzcy = `coreLoss × r`
(procent na jednostkę razy liczba jednostek). Przy `p = 0.58` suma **ROŚNIE** z przewagą:

| r | suma strat zwycięzcy | % strat przegranego |
|---|---|---|
| 2 | 0,562 | 71,9% |
| 5 | 0,826 | 83,5% |
| 10 | 1,105 | 89,0% |
| 20 | **1,478** | 92,6% |

Przy 20:1 zwycięzca traci 1,478 jednostki-HP, a **cała** armia przeciwnika 0,926 —
zwycięzca wykrwawia się bardziej niż wszystko, co pokonał. Suma rośnie jak `n^(1−p)`,
więc **próg opłacalności to dokładnie `p = 1,0`**.

**C. PUŁAPKA — sam wykładnik NIE wystarczy, `L_MIN` skasuje naprawę.** `L_MIN 0.05`
jest dolnym clampem NA JEDNOSTKĘ (`:90`). Przy `p = 1,20` i `L_MIN` zostawionej po
staremu suma strat zwycięzcy wynosi: 5:1 → 0,304, ale **10:1 → 0,500 i 20:1 → 1,000**,
czyli zawraca i przy 20:1 jest gorsza niż przy 5:1. Objaw wraca w niemal pełnej sile
mimo poprawnego wykładnika. **Przeniesienie `L_MIN` z jednostki na SUMĘ składu jest
warunkiem koniecznym, nie kosmetyką.**

## GOAL

Auto-bitwa mapy ma nagradzać przewagę liczebną/siłową zamiast ją karać: **łączne straty
zwycięzcy mają MALEĆ monotonicznie wraz ze wzrostem stosunku sił**, a nie rosnąć.

Dwa ruchy, oba wymagane:

1. **`p_atk` i `p_def` z `0.58` na `1.20`** w `gra/data/auto-battle-params.json`.
2. **`L_MIN` przeniesiona z jednostki na SUMĘ składu** — podłoga ma ograniczać łączne
   straty składu, a nie każdą jednostkę z osobna.

Oczekiwany przebieg po naprawie (policzony, ma się odtworzyć co do trzeciego miejsca):

| r | suma strat zwycięzcy | % strat przegranego |
|---|---|---|
| 1,5 | 0,387 | 74,2% |
| 2 | 0,366 | 81,7% |
| 3 | 0,337 | 88,8% |
| 5 | 0,304 | 93,9% |
| 10 | 0,265 | 97,3% |
| 20 | 0,231 | 98,8% |

## ROZSTRZYGNIĘCIA WŁAŚCICIELA — WIĄŻĄCE, NIE PODLEGAJĄ PONOWNEJ OCENIE

- **`p = 1,20`, nie 1,0 i nie 1,4.** Właściciel odrzucił 1,4 („miażdżąca przewaga prawie
  bezkosztowa, premiuje jeden wielki stos zamiast manewru") i 1,0 („neutralne, cofa
  wcześniejsze ECHO «większy skład traci mniej»"). Nie proponuj innej wartości.
- **BEZ dokładania pary `p_zwyciezca`/`p_przegrany`.** Właściciel jawnie wybrał wariant
  „nie rozdzielać — zaakceptować ostrzejsze starcia". Zaostrzenie kary dla słabszego przy
  małej przewadze (przy 1,5:1 przegrany traci 74,2% zamiast 66,8%) jest **świadomie
  przyjętym skutkiem**. **Zgłoszenie tego jako defektu będzie błędem Evaluatora.**
- **Nie ruszaj `L_MAX`, `coef_zwyciezca`, `coef_przegrany`, `remis_pct`.** Poza zakresem.
- **Nie dotykaj bitwy taktycznej 3D** (`combat.ts`, `battleScene.ts`) — to węzeł W2,
  osobny temat, dispatchowany równolegle. Wejście w te pliki = naruszenie allowlisty.

## KRYTERIA KOŃCA (binarne)

1. `gra/data/auto-battle-params.json` ma `p_atk: 1.2` i `p_def: 1.2`.
2. `L_MIN` działa jako podłoga na SUMIE strat składu — udowodnione testem, który
   **czerwienieje po cofnięciu tej zmiany** (pokaż wynik przed i po mutacji).
3. Nowa bramka `gra/tools/auto-battle-przewaga-monotonicznosc-test.cjs`:
   dla ciągu stosunków sił 1,5 / 2 / 3 / 5 / 10 / 20 łączne straty zwycięzcy tworzą ciąg
   **ściśle malejący**, a wartości zgadzają się z tabelą z GOAL z tolerancją ±0,005.
   Bramka ma **osobną asercję na pułapkę z (C)**: przy `L_MIN` liczonej po staremu ciąg
   NIE jest malejący — czyli test wykrywa regres polegający na cofnięciu samej podłogi,
   nawet gdy wykładnik zostaje poprawny.
4. `node ./node_modules/typescript/bin/tsc --noEmit` — zielone.
5. `node gra/tools/auto-battle-power-test.cjs` — zielone. Jeśli ten test miał zaszyte
   wartości liczbowe sprzed zmiany, **zaktualizuj je i wypisz w raporcie dokładnie które
   i dlaczego** — cicha zmiana oczekiwań istniejącej bramki jest niedopuszczalna.
6. Pięć bramek referencyjnych zielonych: `logic-test.cjs` 213/213, `tech-tree-test.cjs`
   19/19, `research-test.cjs` 33/33, `unit-replace-test.cjs` 13/13, `combat-test.cjs` 6/6.
7. `node gra/tools/map-field-battle-test.cjs` i `node gra/tools/battle-summary-test.cjs`
   — zielone (najbliższe sąsiedztwo zmiany).

## REGUŁA PRZECIW SAMOOSZUKIWANIU

**Zakaz uznania tematu za zamknięty na podstawie samej zmiany liczby w pliku danych.**
Obowiązkowo pokaż: (a) wynik nowej bramki PRZED zmianą kodu (ma być CZERWONY) i PO
(ZIELONY); (b) osobno wynik po cofnięciu SAMEJ zmiany `L_MIN` przy zostawionym `p = 1,2`
— bramka ma wtedy nadal czerwienieć, bo to jest dokładnie pułapka z (C). Bez tych trzech
przebiegów raport jest niekompletny i Final Control potraktuje go jak brak dowodu.

**Drugi tryb do pilnowania: rachunek „na oko".** Wszystkie liczby w tym dispatchu są
policzone. Nie przepisuj ich z zaufania — przelicz samodzielnie i **zgłoś rozbieżność,
jeśli ją znajdziesz**, zamiast dopasowywać test do tabeli.

## ALLOWLISTA

- `gra/data/auto-battle-params.json`
- `gra/src/game/auto-battle-power.ts`
- `gra/tools/auto-battle-przewaga-monotonicznosc-test.cjs` (NOWY)
- `gra/tools/auto-battle-power-test.cjs` (wyłącznie aktualizacja zaszytych wartości, jawnie uzasadniona)
- `dyspozycje/autobot/runs/R-WALKA-PRZEWAGA-LICZEBNA-Q1-W1/` (raporty etapów)

Zakazane bezwzględnie: `gra/src/game/combat.ts`, `gra/src/battle/battleScene.ts`,
`gra/src/main.ts`, pliki z sekretami, `docs/decyzje/**`, `.git/**`,
`dyspozycje/WERSJE.md`, `gra-robocza/**`, `ROBOCZA-MANIFEST.json`, `playbook.json`.

## IZOLACJA

Worktree `/home/user/wt-walka-w1`, gałąź `autobot/R-WALKA-PRZEWAGA-LICZEBNA-Q1-W1`,
baza jawnie: **`origin/main`** na SHA podanym przy zakładaniu worktree.

C-001 (bariera CHRONIONA), brzmienie dosłowne z `playbook.md`: „Zakaz `npm run build`/`dev`
w `gra/` (export-data nadpisuje JSON) — dozwolona komenda: `node ./node_modules/vite/bin/vite.js
build --outDir dist --emptyOutDir`". Zakaz dotyczy rodziny komend build/compile, nie wszystkich
komend w `gra/`: jedyna dozwolona kompilacja to `node ./node_modules/typescript/bin/tsc --noEmit`;
bramki `node gra/tools/*-test.cjs` nie są nim objęte. `--outDir` musi wskazywać katalog POZA
drzewem repo (np. `/tmp/…`).

## PROCEDURA NAPRAWCZA PRZY FAIL

Evaluator wskazuje JEDEN konkretny defekt i konkretną poprawkę. Runda N+1 idzie na TYM SAMYM
ID i TEJ SAMEJ gałęzi, nie na nowej od zera. Po 5 rundach: `LIMIT-5-EXCEEDED`.

## GRANICE

Nie integrujesz, nie deployujesz, nie pushujesz. Zakaz `git add -A` i `git add .`.
Przy decyzji produktowej zatrzymujesz się ze statusem `DECISION_REQUIRED`.
Raport maksymalnie ok. 400 słów, destylat: ścieżki + SHA zamiast diffu, wynik bramki
zamiast logu.

## OBIEG

Operator → Evaluator → (Obrona, jeśli lista zarzutów niepusta) → koniec skryptu.
Final Control osobnym wywołaniem Workflow, poza tym skryptem. Integracja, `READY_FOR_DEPLOY`
i deploy/push — wyłącznie ręką orkiestratora.
