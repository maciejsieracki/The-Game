# 03 — Obrona Operatora (R-WALKA-PRZEWAGA-LICZEBNA-Q1-W1)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WALKA-PRZEWAGA-LICZEBNA-Q1-W1
MODEL+EFFORT: Sonnet 5, effort medium
RUNDY: 1/5 (obrona nie zwiększa licznika)

## OBRONA

### Zarzut 1 — tautologiczna sonda „podłoga na SUMIE" → PRZYJMUJĘ

Dowód potwierdzający zarzut: przy r=1000 samo `raw` = `0,42/1000^1,2` = 1,055e-4,
po zaokrągleniu 0,0001, suma 0,0001 × 1000 = 0,100 ≥ L_MIN 0,05 — sonda przechodziła
bez udziału podłogi. Mutacja C potwierdzona samodzielnie.

Poprawka: `gra/tools/auto-battle-przewaga-monotonicznosc-test.cjs:155-179` — sonda
przeniesiona na r = 2000 / 5000 / 50 000 (tam, gdzie podłoga jest jedynym, co trzyma
sumę) plus asercja „suma ≠ 0" i kontrola, że w zakresie grywalnym (r=20) rządzi `raw`,
nie podłoga. Powtórzona mutacja C (`winnerLossFloorPct` → `return 0;`): **37 pass /
6 fail, exit 1** (przed poprawką 43/0 exit 0). Po przywróceniu kodu **43/0 exit 0**.

### Zarzut 2 — podłoga skasowana przez zaokrąglenie, zwycięzca traci 0 → PRZYJMUJĘ

Dowód potwierdzający: `Math.round(max(floor, min(cap, raw)) * 10000) / 10000` — przy
r ≥ 1866 zarówno `raw` (4,99e-5), jak i `floor = L_MIN/r` (2,68e-5) są poniżej 0,00005,
więc oba zaokrąglały się do 0. Zmierzone: r = 1866 / 2000 / 5000 / 50 000 → suma
0,00000. To sprzeczne z kryterium końca nr 2 i z komentarzem samego kodu.

Poprawka: `gra/src/game/auto-battle-power.ts:102-113` — zaokrąglenie NAJPIERW,
podłoga POTEM: `Math.max(floor, Math.round(Math.min(cap, raw) * 10000) / 10000)`.
Zmierzone po poprawce: r = 2000 / 5000 / 41 821 / 50 000 → suma 0,05000 (dokładnie
L_MIN). Zakres grywalny nietknięty — ciąg z tabeli GOAL odtworzony bit w bit:
0,3873 / 0,3656 / 0,3372 / 0,3045 / 0,2650 / 0,2300; przegrany 74,2 / 81,7 / 88,8 /
93,9 / 97,4 / 98,9 %.

### Zarzut 3 — `gra/tools/auto-battle-power.py:133` niezgłoszony → PRZYJMUJĘ

Dowód potwierdzający: plik czyta `p_atk` z `auto-battle-params.json` (`:35`, `:43`),
ale zachowuje `max(L_MIN, min(cap, raw))` — starą podłogę na jednostce. Odtworzone
własnym rachunkiem na dzisiejszym JSON: r=5 → 0,3045, **r=10 → 0,500, r=20 → 1,000** —
dokładnie krzywa-pułapka z reconu (C), sprzeczna z runtime TS.

Plik jest poza allowlistą dispatchu, więc go NIE dotykam. Zarzut dotyczył pominięcia
w `01-operator.md` — zgłaszam wprost: **symulator balansu `gra/tools/auto-battle-power.py`
rozjechał się z runtime i wymaga osobnego tematu.**

## ZMIANY/COMMIT

Pliki wyłącznie z allowlisty:
- `gra/src/game/auto-battle-power.ts` — kolejność zaokrąglenie/podłoga (zarzut 2).
- `gra/tools/auto-battle-przewaga-monotonicznosc-test.cjs` — rozstrzygające sondy
  podłogi, 37 → 43 asercje (zarzut 1).
- `dyspozycje/autobot/runs/R-WALKA-PRZEWAGA-LICZEBNA-Q1-W1/03-obrona.md` — ten raport.

`auto-battle-params.json` i `auto-battle-power-test.cjs` niezmienione względem `f72744d3`.

## TESTY

`tsc --noEmit` zielone; nowa bramka 43/0; `auto-battle-power-test` 14/0;
`logic-test` 213/213; `tech-tree-test` 19/19; `research-test` ALL GREEN;
`unit-replace-test` 13/13; `combat-test` OK; `battle-summary-test` OK.
Mutacja C powtórzona i cofnięta (37/6 exit 1 → 43/0 exit 0).

## BLOKADY

`gra/tools/map-field-battle-test.cjs` — exit 1, `import_meta.glob is not a function`;
czerwona identycznie na bazie 287718c2, INFRA sprzed tematu. Kryterium końca nr 7
spełnione tylko w części `battle-summary-test`.

DO DECYZJI CZŁOWIEKA (nie blokuje tej rundy): osobny temat na
`gra/tools/auto-battle-power.py` (zarzut 3) oraz na `map-field-battle-test`.

NASTĘPNY KROK: Final Control (Sonnet 5, effort high)
DEPLOY/PUSH: NIE WYKONANO
