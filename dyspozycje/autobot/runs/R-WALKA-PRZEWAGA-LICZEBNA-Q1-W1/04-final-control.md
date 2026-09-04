# 04 — Final Control (R-WALKA-PRZEWAGA-LICZEBNA-Q1-W1)

STATUS: PASS
DOMAIN: GAME
TEMAT: R-WALKA-PRZEWAGA-LICZEBNA-Q1-W1
GOAL: auto-bitwa mapy nagradza przewagę — łączne straty zwycięzcy maleją monotonicznie
z rosnącym stosunkiem sił (p = 1,20 + `L_MIN` jako podłoga na SUMIE składu).
MODEL+EFFORT: Sonnet 5, effort high
RUNDY: 1/5

## ZMIANY/COMMIT

Weryfikacja na `288e420e` (worktree `/home/user/wt-walka-w1`, gałąź
`autobot/R-WALKA-PRZEWAGA-LICZEBNA-Q1-W1`). Final Control nie wprowadził zmian —
drzewo po mutacjach przywrócone, `git status` czysty (jedynie nieśledzony
`02-evaluator.md`, obecny przed startem). Diff `287718c2..288e420e` dotyka wyłącznie
allowlisty; `combat.ts` / `battleScene.ts` / `main.ts` nietknięte.

## TESTY (przebiegi własne)

Nowa bramka **43 pass / 0 fail, exit 0**. Tabela odtworzona: 0,3873 / 0,3656 / 0,3372 /
0,3045 / 0,2650 / 0,2300 — zgodna z GOAL w ±0,005 (maks. odchyłka 0,001 przy r=20).
`tsc --noEmit` zielone. `auto-battle-power-test` 14/0, `logic-test` 213/213,
`tech-tree-test` 19/19, `research-test` 33/33, `unit-replace-test` 13/13,
`combat-test` 6/6, `battle-summary-test` OK.

Trzy mutacje wykonane i cofnięte samodzielnie:
- `winnerLossFloorPct → return 0` → **37/6, exit 1** (sondy r=2000/5000/50000);
- kolejność zaokrąglenia cofnięta do `round(max(floor, min(cap, raw)))` → **37/6, exit 1**;
- podłoga wrócona na jednostkę (`return p.L_MIN`) → **37/6, exit 1** (pułapka C:
  r=10 → 0,500, r=20 → 1,000, monotoniczność złamana).
Po każdym cofnięciu ponownie 43/0. Kryterium końca nr 2 udowodnione.

## BLOKADY

`gra/tools/map-field-battle-test.cjs` — exit 1, `TypeError: import_meta.glob is not
a function` (bundler wciąga moduł audio z `import.meta.glob`). Potwierdzone własnym
przebiegiem w odrębnym worktree na czystej bazie `287718c2`: identyczny błąd sprzed
tematu. INFRA, **nie defekt tej pracy**; kryterium końca nr 7 spełnione w części
`battle-summary-test`.

Nota bez rangi defektu: gdy podłoga wygrywa (r > ~1863) `lossAtkPct` wraca
niezaokrąglony (np. 0,000025) — poza zakresem grywalnym, bez wpływu na konsumentów.

## WERDYKTY

**Para 1 → ODDAL.** Zarzut był trafny co do meritum, ale został naprawiony w ocenianym
wytworze i naprawę zweryfikowałem własną mutacją, nie deklaracją: `return 0`
czerwieni bramkę (37/6, exit 1) wyłącznie dzięki nowym sondom r = 2000/5000/50000.
Sonda r=1000 faktycznie przechodziła z `raw` (0,0001 × 1000 = 0,100 ≥ 0,05) — dziś
tej tautologii nie ma, plus asercja „suma ≠ 0" i kontrola, że przy r=20 rządzi `raw`
(0,0115 > 0,0025). Nic do poprawienia.

**Para 2 → ODDAL.** Defekt realny i realnie usunięty. Cofnięcie kolejności do
`round(max(floor, …))` odtwarza sumę 0,00000 przy r ≥ 1866 i czerwieni bramkę.
W obecnym kodzie (`auto-battle-power.ts:112-113`) zmierzyłem r = 1866 / 2000 / 5000 /
41821 / 50000 → suma **0,05000 = dokładnie L_MIN**. Zakres grywalny nietknięty —
pełna tabela GOAL w tolerancji. Kryterium nr 3 i nr 2 spełnione łącznie.

**Para 3 → ODDAL.** Rozbieżność potwierdzona własnym rachunkiem na dzisiejszym JSON:
`auto-battle-power.py:133` czyta `p_atk = 1,2` (`:35`, `:43`), ale trzyma
`max(L_MIN, min(cap, raw))` → r=5 → 0,3045, r=10 → 0,500, r=20 → 1,000, czyli
krzywa-pułapka (C) sprzeczna z runtime TS. Plik jest poza allowlistą — jego edycja
byłaby naruszeniem, a zarzutem był brak noty. Nota jest w `03-obrona.md` wprost, wraz
z routingiem na osobny temat. Zarzut wyczerpany.

Zaostrzenie kary przegranego przy 1,5:1 (74,2 %) i wartość p = 1,20 traktuję jako
wiążące rozstrzygnięcia właściciela i nie zgłaszam jako defektu.

## NASTĘPNY KROK

Integracja orkiestratora → `READY_FOR_DEPLOY`. Do osobnych tematów (nie blokują):
(a) `gra/tools/auto-battle-power.py` — synchronizacja symulatora balansu z runtime TS;
(b) `map-field-battle-test.cjs` — blokada INFRA `import.meta.glob` w bundlu bramki.

DEPLOY/PUSH: NIE WYKONANO
