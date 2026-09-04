# R-WALKA-PRZEWAGA-LICZEBNA-Q1-W1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WALKA-PRZEWAGA-LICZEBNA-Q1-W1
MODEL+EFFORT: Sonnet 5, effort medium (C-052)
GOAL: łączne straty zwycięzcy auto-bitwy mapy mają MALEĆ monotonicznie z przewagą.

## ZMIANY/COMMIT

- `gra/data/auto-battle-params.json` — `p_atk`/`p_def`: `0.58` → `1.2`.
- `gra/src/game/auto-battle-power.ts` — nowy `winnerLossFloorPct(ratio, p)`;
  `winnerLossPct` clampuje do `L_MIN / max(1, ratio)` zamiast `L_MIN`. Podłoga
  ogranicza teraz `lossPct × ratio` (łączne straty składu) = `L_MIN`, nie procent
  na jednostkę. `loserLossPct`, `L_MAX`, `coef_*`, `remis_pct` — nietknięte.
- `gra/tools/auto-battle-przewaga-monotonicznosc-test.cjs` — NOWY, 37 asercji.
- `gra/tools/auto-battle-power-test.cjs` — aktualizacja zaszytych wartości:
  `p_atk === 0.58` → `1.2`; `lossAtkPct ~0.332` → `~0.258`; `lossDefPct ~0.668`
  → `~0.742` (R=1,5). Powód: to są wprost wartości starego wykładnika.
- Commit: patrz gałąź `autobot/R-WALKA-PRZEWAGA-LICZEBNA-Q1-W1`.

## TESTY — trzy wymagane przebiegi nowej bramki

(a) czysta baza, przed zmianą — **CZERWONA**: 16 pass / 21 fail. Odtworzony ciąg
sum strat zwycięzcy 0,498 / 0,562 / 0,666 / 0,826 / 1,105 / 1,478 — rosnący,
zgodny co do trzeciego miejsca z tabelą B dispatchu.

(b) po pełnej zmianie — **ZIELONA**: 37 pass / 0 fail. Sumy: 0,3873 / 0,3656 /
0,3372 / 0,3045 / 0,2650 / 0,2300; przegrany 74,2 / 81,7 / 88,8 / 93,9 / 97,4 /
98,9 %. Ciąg ściśle malejący.

(c) cofnięta SAMA zmiana `L_MIN`, `p = 1,2` zostawione — **ZNÓW CZERWONA**:
31 pass / 6 fail, `exit 1`. r=10 → 0,500, r=20 → 1,000, ciąg zawraca. Pułapka
z reconu C potwierdzona empirycznie; kod przywrócony, bramka znów 37/0.

Pozostałe bramki: `tsc --noEmit` zielone. `auto-battle-power-test` 14/0.
`logic-test` 213/213, `tech-tree-test` 19/19, `research-test` 33/33,
`unit-replace-test` 13/13 (OK), `combat-test` OK. `battle-summary-test` OK.

## ROZBIEŻNOŚCI WOBEC TABELI DISPATCHU (przeliczone samodzielnie)

Kod zaokrągla `lossPct` do 4 miejsc PRZED pomnożeniem przez liczebność. Stąd:
- r=20: suma **0,2300** wobec 0,231 w dispatchu (`0,0115349 → 0,0115`), Δ 0,001;
- r=10 / r=20 straty przegranego 97,35 % / 98,85 % wobec 97,3 % / 98,8 %, Δ 0,0005.

Wszystkie mieszczą się w tolerancji ±0,005 — bramka używa wartości z dispatchu,
nie dopasowanych. Rozbieżność zgłaszam, nie ukrywam.

## BLOKADY

`node gra/tools/map-field-battle-test.cjs` — `exit 1`,
`TypeError: import_meta.glob is not a function` (moduł audio, bundling esbuild).
Zweryfikowane `git stash`: **czerwona identycznie na czystej bazie 287718c2**.
Defekt INFRA, niezależny od tej zmiany. Kryterium 7 spełnione połowicznie — stąd
PASS-WITH-NOTES zamiast PASS. Decyzja o osobnym temacie: orkiestrator.

RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Sonnet 5, effort high)
DEPLOY/PUSH: NIE WYKONANO
