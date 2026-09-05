# P-AI-NIE-STAWIA-BUDYNKOW-Q1 — Operator, RUNDA 1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: `P-AI-NIE-STAWIA-BUDYNKOW-Q1`
GOAL: miasta AI (duże cywilizacje i państwa-miasta) faktycznie stawiają budynki,
gwarancja barbarzyńska nietknięta, bramka-weryfikator wzrostu `cityBuilt`
ZMIANY/COMMIT: `42411540` — `gra/src/main.ts`, `gra/src/game/empire-city-defaults.ts`,
`gra/tools/ai-buduje-budynki-test.cjs` (nowy); raport `596de17a` —
`dyspozycje/autobot/runs/P-AI-NIE-STAWIA-BUDYNKOW-Q1/**`. Wszystko w allowliście dispatchu.
MODEL+EFFORT: Opus 5, effort high
RUNDA: 1/5
BAZA: `05df297a` (= `origin/main`), worktree `/home/user/wt-ai-buduje-budynki`,
gałąź `autobot/P-AI-NIE-STAWIA-BUDYNKOW-Q1`
BLOKADY: brak
NASTĘPNY KROK: Evaluator (Opus 5, effort high)
DEPLOY/PUSH: NIE WYKONANO

> UZUPEŁNIENIE (OBRONA R1, zarzut 7 — PRZYJĘTY): pola `GOAL:` i `ZMIANY/COMMIT:`
> dopisane, surowe rozliczenie 117 bramek przeniesione do załącznika (§11 — destylat
> w raporcie, surowe dane w katalogu runu). Treść merytoryczna niezmieniona.

## GOAL 1 — rozróżnienie barbarzyńców od pozostałych AI

> ZASTĄPIONE w OBRONIE R1 (zarzut 1, ECHO właściciela): gracz również dostaje tryb
> automatyczny; `'reczny'` zostaje wyłącznie ownerom ujemnym. Zapis niżej opisuje
> stan commita `42411540`.

Nowa `freshOwnerDefaultBudowaProfilForOwner(ownerId, isBarbarianOwner)`
(`empire-city-defaults.ts`) + dwa wywołania w `main.ts` (`initOwnerDefaultCityFields`,
`seedCityOwnerDefaults`): `ownerId > 0` i nie barbarzyńca (duże AI **i** miasta-państwa)
→ `'zrownowazone'`; gracz, barbarzyńcy (`-1`) i rebelianci (`-99`) → `'reczny'`.
Gwarancja „miasto barbarzyńskie produkuje WYŁĄCZNIE jednostki" nietknięta. Predykat
`isBarbarian` wstrzykiwany, nie importowany.

## GOAL 2 — państwa-miasta: `isMajorAiOwner` NIETKNIĘTY, `owner-utils.ts` NIE ruszony

Gałąź `else if (isAutoBudowaTryb(city.budowaTryb)) tryAutoEnqueueBuild(cid)` w pętli
ekonomii jest owner-agnostyczna — jedyną bramką był `budowaTryb`, więc po naprawie
miasta-państwa dostają tryb auto i ta gałąź odpala. Poszerzanie `isMajorAiOwner`
zmieniłoby zachowanie PM poza budowaniem (Zarządca przydziela też pola i podział Pracy)
i kosztowałoby wydajność — świadomie odrzucone. Dowód: A2/A2b (PM 8 budynków po 45
turach, 0 przed naprawą).

## GOAL 3 — nowa bramka `gra/tools/ai-buduje-budynki-test.cjs`

Prawdziwa pętla ekonomii: `vite build` (C-001) + headless Chromium, realny `doStartGame`,
realne `endTurn()`, realne przejęcia. **22 asercje, 22 PASS.** Trzy buildy różniące się
WYŁĄCZNIE ciałem jednej funkcji: FIX / MUT-A (stan sprzed naprawy) / MUT-B (bez gałęzi
barbarzyńskiej).

## TABELA BUDYNKÓW PO 45 REALNYCH TURACH (suma `cityBuilt`, seed 778899)

| wariant | duże AI | państwa-miasta | barbarzyńcy | gracz |
|---|---|---|---|---|
| FIX (naprawa) | **11** | **8** | **0** | 0 |
| MUT-A (stan sprzed naprawy) | 4 | 0 | 0 | 0 |
| MUT-B (bez gałęzi barbarzyńskiej) | 13 | 5 | **1** | 0 |

Drugi przebieg FIX/MUT-A na tym samym seedzie: 13/5 vs 3/1 — kierunek stabilny
(gra ma resztkowy `Math.random` poza seedem mapy).

## NOTY (pełne brzmienie w załączniku)

1. **Korekta reconu B:** stan sprzed naprawy nie daje ZERA u dużych AI (4 budynki) —
   miasto AI ma drugą, niezależną drogę do kolejki (komenda `build`
   z `chooseCityProduction`, `ai.ts`, egzekwowana bez patrzenia na `budowaTryb`).
   Reset `'reczny'` zabijał obie ścieżki AUTO-kolejki, nie całe budowanie. Objaw
   właściciela pomiar odtwarza dokładnie: **państwa-miasta przed naprawą 0**.
2. **Recon G:** `R-NOWE-MIASTO-AUTOBUDOWA-ZROWNOWAZONA-DOMYSLNIE` (`eb03cb94`) było
   cicho cofnięte od pierwszego dnia — ten temat je przywraca.
   `R-AI-ULEPSZENIA-MALO-BUDOWANE-Q1` **nie** ma tego samego korzenia, ale ta naprawa
   zmniejsza budżet ulepszeń AI (niepuste kolejki → `doBudynkow` nie wraca do puli);
   do świadomego przyjęcia przez właściciela.

## TESTY

- `node ./node_modules/typescript/bin/tsc --noEmit` — **0 błędów**.
- `node tools/ai-buduje-budynki-test.cjs` — **PASS=22 FAIL=0** (min. 6 wymagane).
  > ZASTĄPIONE w OBRONIE R1 (zarzuty 2-6): bramka rozbudowana o ścieżkę wczytania
  > zapisu, pokrycie per miasto i determinizm — dziś **PASS=35 FAIL=0**, patrz
  > `03-obrona-runda1.md`.
- Referencyjne: logic **213/213**, tech-tree **19/19**, research **33/33**,
  unit-replace **13/13**, combat **6/6**.
- Bramki AI/miast: **wszystkie 117** — 100 zielonych, 17 czerwonych, 1 TIMEOUT (INFRA).
  **Każda czerwień rozstrzygnięta, zero regresji tego tematu** (14 dług przed-istniejący
  z parytetem na `05df297a`, 2 czerwone z konstrukcji, 1 obciążenie maszyny).
  Pełna lista: [`01-operator-runda1-ZALACZNIK-bramki.md`](01-operator-runda1-ZALACZNIK-bramki.md).

## BLOKADY

Brak — `ai.ts` i `owner-utils.ts` nietknięte, bez `DECISION_REQUIRED`.

## NASTĘPNY KROK

Evaluator (Opus 5, effort high) — z naciskiem na NOTY 1-2.
