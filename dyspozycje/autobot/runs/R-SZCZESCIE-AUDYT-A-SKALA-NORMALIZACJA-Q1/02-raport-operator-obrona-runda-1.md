# R-SZCZESCIE-AUDYT-A-SKALA-NORMALIZACJA-Q1 — Obrona Operatora, runda 1 (drugie wywołanie)

STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: R-SZCZESCIE-AUDYT-A-SKALA-NORMALIZACJA-Q1 (węzeł A z pięciu)
GOAL: bez zmian wobec `00-dispatch.md` §GOAL.
MODEL+EFFORT: Opus 5, effort high (Operator — Obrona, §3c pkt 2; NIE nowa runda)
RUNDY: 1/5
DEPLOY/PUSH: NIE WYKONANO

## Werdykt własny per zarzut

| # | Odpowiedź | Skrót dowodu |
|---|---|---|
| 1 | PRZYJMUJĘ | Siatka 7680 profili: własny wkład skalowania 9,6 → **5,4 p.p.**; „dodatkowy" 15,0 → **12,0 p.p.** Reszta (9,8 p.p.) to urwisko węzła C, odsłonięte przez cap. → `DO DECYZJI CZŁOWIEKA` |
| 2 | PRZYJMUJĘ | Dodane asercje na `prawMaxPopWsp` i na sam próg; mutacja easy=normal=hard dla Prawa → 2 FAIL (było: 0) |
| 3 | PRZYJMUJĘ | Ten plik + `01-raport-operator-runda-1.md` |
| 4 | PRZYJMUJĘ, naprawione W allowliście | Cap PorPct przeniesiony do `OrderParams`; `post-capture-law.ts` niezmieniony, a mimo to czyta JSON |
| 5 | PRZYJMUJĘ | Raport skrócony do destylatu |

## Zmiany tej rundy (ponad `ba97eded` / `c6e77ed5`)

- `gra/src/game/society-breakdown.ts` — próg rośnie **składanie** (`(1+wsp)^excess`), nie
  liniowo; `computePorPct` bierze cap z `OrderParams`; usunięty zbędny parametr `scale`
  w `computeOrderPctBreakdown`.
- `gra/src/game/order.ts` — `OrderParams.porPctCap` (opcjonalne), `loadOrderParams` czyta
  `szczescie.szczescie_pct_cap` z JSON, fallback = stała `SZ_PCT_CAP`.
- `gra/data/society-params.json` — współczynniki: Sz 0,038 / 0,048 / 0,058, Prawo
  0,033 / 0,041 / 0,049 (mnożniki końcowe na pop 12: Sz 1,45× / 1,60× / 1,76×,
  Prawo 1,38× / 1,49× / 1,61×).
- `gra/tools/szczescie-skala-normalizacja-test.cjs` — 95 → **110 asercji**.

## Testy

- `tsc --noEmit` (TS 5.9.3, symlink `node_modules`, C-029) — exit 0.
- `szczescie-skala-normalizacja-test.cjs` — **110 OK / 0 FAIL**.
- Nietautologiczność, 4 mutacje: próg tylko od epoki → 13 FAIL; wzrost liniowy → 6 FAIL;
  cap znów ze stałej TS → 2 FAIL; Prawo bez różnicowania per trudność → 2 FAIL.
  Po przywróceniu 110 OK / 0 FAIL.
- 16 bramek społeczeństwa/porządku: 15/22+4/8/9/43/38/81/30/55/52/43/110/60/15/9/18.
- Referencyjne: logic 213/213, tech-tree 19/19, research 33/33, unit-replace 13/13, combat 6/6.
- `border-march-wygasanie` 22/4 — identycznie na czystej bazie `2bb422aa`, nie regres.

## Pozycja do decyzji właściciela

Patrz `dowody/ciaglosc-spadek-porpct.md`. Skrót: żeby GOAL 2 w ogóle zadziałał, rozwinięte
miasto musi zejść z capu 120% — a to **odsłania** urwisko pop 4→5 sprzed tematu (zanik bonusu
Osiedla, węzeł C), warte do 9,8 p.p. PorPct. Suma widziana przez gracza sięga 12,0 p.p.
Zamknięcie tego wymaga węzła C, poza granicami tego tematu.
