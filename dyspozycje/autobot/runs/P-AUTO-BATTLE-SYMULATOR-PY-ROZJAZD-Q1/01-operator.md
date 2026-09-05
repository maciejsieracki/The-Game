# P-AUTO-BATTLE-SYMULATOR-PY-ROZJAZD-Q1 — Operator, runda 1/5

STATUS: PASS
DOMAIN: INFRA
TEMAT: P-AUTO-BATTLE-SYMULATOR-PY-ROZJAZD-Q1
MODEL+EFFORT: Sonnet 5, effort medium (C-052)
GOAL: `gra/tools/auto-battle-power.py` liczy to samo, co runtime TS
`gra/src/game/auto-battle-power.ts` na tym samym zestawie parametrów, a rozjazd
nie może się powtórzyć po cichu.

## ZMIANY/COMMIT

Allowlista — bez wyjścia poza nią, `gra/src/game/auto-battle-power.ts`
i `gra/data/auto-battle-params.json` NIETKNIĘTE (`git status`: 2 pozycje).

- `gra/tools/auto-battle-power.py` — `winner_loss_pct`: podłoga `L_MIN / max(1, ratio)`
  (na SUMIE składu, nie na jednostce) oraz kolejność jak w TS: zaokrąglenie
  NAJPIERW, podłoga POTEM. Nowy `_round4` = `Math.round(x*10000)/10000` przez
  `floor(x*10000+0.5)` — wbudowane `round()` Pythona jest bankierskie i rozjeżdżało
  się z JS na granicy 0,00005; `loser_loss_pct` też przez `_round4`. Nowy tryb
  maszynowy `--resolve-json` (stdin JSON par M → stdout JSON wyników + użyte parametry).
- `gra/tools/auto-battle-py-vs-ts-parytet-test.cjs` (NOWY) — bramka parytetu.

## TESTY

| Bramka | Wynik |
|---|---|
| `auto-battle-py-vs-ts-parytet-test` (NOWA) | 126 pass, 0 fail |
| `node ./node_modules/typescript/bin/tsc --noEmit` | 0 błędów |
| `auto-battle-power-test` | 14/14 |
| `auto-battle-przewaga-monotonicznosc-test` | 43/43 |
| logic / tech-tree / research / unit-replace / combat | 213/213 · 19/19 · 33/33 · 13/13 · 6/6 |

Kryterium 1 — wyjście `.py` (suma strat zwycięzcy dla r = 1,5/2/3/5/10/20):
`0.3873 / 0.3656 / 0.3372 / 0.3045 / 0.2650 / 0.2300` — zgodne z runtime TS.

Dowód nietautologiczności (mutacja `.py`, potem przywrócenie — bramka znów 126/0):
- podłoga na jednostce (stan sprzed naprawy) → **100 pass, 26 fail**, m.in.
  „kotwica r=20: py=1, oczekiwane 0.23", „r=41821 → 2091.05";
- podłoga PRZED zaokrągleniem → **118 pass, 8 fail**, m.in.
  „suma strat zwycięzcy >= L_MIN r=50000: 0".

Bramka woła rzeczywiste źródła: TS przez esbuild-bundle (wzorem
`auto-battle-power-test.cjs`), `.py` przez `child_process` — żadnej reimplementacji
wzoru. Punkty: r = 1,5/2/3/5/10/20/100/1000/2000/5000/41821/50000, każdy w dwóch
wariantach (wygrywa ATK i wygrywa DEF), więc pokryty też `loserLossPct`; tolerancja
±0,0005. Parametry czytane z `auto-battle-params.json` po obu stronach i porównane
z plikiem — nic nie jest zaszyte; kotwica tabeli GOAL jest warunkowana polem
`kalibracja`, żeby rekalibracja nie dawała fałszywego czerwonego.

## BLOKADY

Brak.

RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Sonnet 5, effort high)
DEPLOY/PUSH: NIE WYKONANO
