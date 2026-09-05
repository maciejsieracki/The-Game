# P-AUTO-BATTLE-SYMULATOR-PY-ROZJAZD-Q1 — Evaluator, runda 1/5

STATUS: LISTA ZARZUTÓW NIEPUSTA (1) — bez werdyktu PASS/FAIL (§3c)
DOMAIN: INFRA
TEMAT: P-AUTO-BATTLE-SYMULATOR-PY-ROZJAZD-Q1
MODEL+EFFORT: Sonnet 5, effort high
GOAL: zgodny z `00-dispatch.md` co do słowa (§16a pkt 9); kryteria 1–6 z raportu
odpowiadają kryteriom dispatchu.

## ZMIANY/COMMIT (sprawdzone, nie przepisane)

`c309fe88` na `5d03bf2a`. `git diff --name-status`: dokładnie 3 pliki, wszystkie
w allowliście. **(i) `gra/src/game/auto-battle-power.ts` i `gra/data/auto-battle-params.json`
mają ZERO zmian** — pusty diff i identyczne md5 z bazą (`29848f09…`, `d37d3113…`).
Żaden inny plik `gra/data/*` nie ruszony → brak śladu `npm run build` (C-001).
Sekretów w diffie brak. Usunięć poza GOAL brak. Nakładki z innym aktywnym tematem brak
(W1 zintegrowany `487b0cfc`).

## TESTY (uruchomione przeze mnie)

parytet 126/0 · tsc --noEmit exit 0 · auto-battle-power 14/0 · monotoniczność 43/0 ·
logic 213/213 · tech-tree 19/19 · research 33/33 · unit-replace 13/13 · combat 6/6.
Kryterium 1 z `.py`: `0.3873 / 0.3656 / 0.3372 / 0.3045 / 0.2650 / 0.2300`.

(ii) Bramka woła realne źródła: `esbuild` bunduje `../src/game/auto-battle-power`,
`.py` przez `execFileSync`. Dowód, że to nie kopia: po podmianie `L_MAX` w JSON strona TS
sama zmieniła liczby; w mutacji A TS zwrócił `1.1955716027832907e-6` = `L_MIN/41821` co do bitu.
(iii) Mutacje: podłoga na jednostce → **100/26** (czerwienieją też same asercje TS↔py);
podłoga przed zaokrągleniem → **118/8**. Po przywróceniu 126/0.
(iv) `r = 41821` i `50000` są faktycznie w `RATIOS:74` i liczone.
(v) Parametry nie są zaszyte — po podmianie `L_MAX` na 0,30 parytet zostaje zielony (120/0),
czerwienieje wyłącznie kotwica; JSON przywrócony (md5 zgodne).
Sonda własna: 631 punktów (remis, zera, `r` 1,001→1e6, podstawy inne niż 1) —
**max |Δ| = 0**, zero rozjazdów werdyktu.

## ZARZUTY

**1. `gra/tools/auto-battle-py-vs-ts-parytet-test.cjs:110-117` (TOL `:96`)** — asercje
parytetu TS↔py są **bezwarunkowo prawdziwe w całym zakresie, w którym działa naprawiana
podłoga `L_MIN`**. Podłoga wygrywa dopiero od `r ≳ 1866`, a tam obie strony dają wartości
na jednostkę rzędu `10⁻⁵`–`10⁻⁶`, więc `|TS − py| ≤ 0,0005` spełnia się dla dowolnej
liczby z `[0; 0,0005]`. Punkty skrajne, które dispatch nazywa obowiązkowymi („to tam
siedział defekt"), nie mierzą więc parytetu — chroni je wyłącznie jednostronna własność
`suma ≥ L_MIN` (`:123`), liczona tylko z `.py`. Dowód: mutacja `floor_pct = (L_MIN*1.2)/ratio`
(podłoga o 20% za wysoka, `r > 1866`) → bramka **126 pass, 0 fail**. Ma znaczenie, bo to
dokładnie klasa defektu, przed którą bramka ma bronić. Poprawka jednolinijkowa:
porównać z TS **sumę** `lossPct × r` (`:121-123` liczy już sumę `.py`), gdzie ±0,0005
przy wartościach ~0,05 znów rozróżnia.

BLOKADY: brak.
RUNDY: 1/5
NASTĘPNY KROK: Obrona Operatora (lista niepusta, §3c pkt 2), potem Final Control.
DEPLOY/PUSH: NIE WYKONANO
