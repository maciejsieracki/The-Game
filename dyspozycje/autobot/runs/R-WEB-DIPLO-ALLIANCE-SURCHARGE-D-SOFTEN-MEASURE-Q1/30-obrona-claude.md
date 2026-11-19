# R-WEB-DIPLO-ALLIANCE-SURCHARGE-D-SOFTEN-MEASURE-Q1 — raport obrony (runda 2, Operator HAIKU 5.5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (parametr za flagą torSojuszyAktywny=OFF + pomiar)
TEMAT: R-WEB-DIPLO-ALLIANCE-SURCHARGE-D-SOFTEN-MEASURE-Q1
GOAL: parametr `dopłataDMnoznikAiAi` skalujący WYŁĄCZNIE dopłatę D w sojuszach AI↔AI (domyślnie 1,0 = bez zmiany) + pomiar wariantów; wartość wybiera właściciel.
BAZA: d425dd0a3 (origin/main). Kandydat (czubek pracy): patrz pole sha w StructuredOutput (commit „R-WEB-DIPLO-ALLIANCE-SURCHARGE-D-SOFTEN-MEASURE-Q1: ...").

## Odpowiedzi na zarzuty Evaluatora

1. PRZYJMUJĘ. Kandydat był równy bazie; teraz istnieją zmiany (patrz ZMIANY-COMMIT).
2. PRZYJMUJĘ. Dodano testy D1–D8 i mutacje M1–M3 (tools/ai-ai-alliance-surcharge-test.cjs).
3. PRZYJMUJĘ CZĘŚCIOWO. Pomiar seed 4242 wykonany dla 1,0 / 0,5 / 0,25; seed 7 i pełne 60 tur NIE ZMIERZONO (patrz TESTY).
4. PRZYJMUJĘ. Lokalizacja D i histogram odmów są niżej; raport ABC w sekcji PYTANIE.
5. PRZYJMUJĘ. Commit z kodem jest na czubku tej gałęzi; SHA w StructuredOutput.

## Lokalizacja D (plik:linia, stan po zmianie)

- Obliczenie parytetu: `gra/src/game/ai-ai-treaty-evaluate.ts` `parityOf` l.161 → `peacePwPointsByPowerRatio` (`war-weariness.ts` l.137): S = round(X·r), W = round(X/r), D = S − W.
- Płatnik D i bramka skarbca: `ai-ai-treaty-evaluate.ts` l.244–258 (krok 8). Odmowa „brakuje N PN w skarbcu płatnika (dopłata D = N)” l.253.
- Mnożnik: l.247 `const D = mnoznik === 1 ? split.D : Math.round(split.D * mnoznik);`. `parity.D` pozostaje nieskalowane.
- Wywołania `evaluateTreatyOffer` wyłącznie z modułów `ai-ai-*` (test D8). `ai.ts` NIE zmieniono: brak potrzeby, ścieżka AI↔AI nie woła D poza E1.
- Dopłata przelewana w `ai-ai-alliance-tick.ts` l.254 (bez zmian).

## Zmiany (allowlista)

- `gra/data/ai-ai-treaty-params.json`: `dopłataDMnoznikAiAi: 1.0` + `_uwaga_dopłata_d`.
- `gra/src/game/ai-ai-treaty-evaluate.ts`: `aiAiDopłataMnoznik()`, `setAiAiDopłataMnoznikForTest()`, skalowanie D (l.247).
- `gra/src/main.ts`: 1 import + blok haku civTest (odczyt `window.__civAiDopłataMnoznikMeasure`, tylko przy `?civTest=1`). Poza blokiem haku żadnych zmian.
- `gra/tools/ai-ai-alliance-measure-run.cjs`: opcja `--mnoznik <liczba>` (przekazana do init-script).
- `gra/tools/ai-ai-alliance-surcharge-test.cjs`: NOWY test.
- NIE ZROBIONO: opcjonalny wariant `dopłataDWykladnikR` (α) — pominięty (dispatch: „jeśli prosty”; wariant wymaga osobnej definicji i testów).

## TESTY

- `tsc --noEmit`: exit 0.
- `logic-test`: LOGIC OK 213/213. `tech-tree-test`: 20 pass/0. `research-test`: 33/33. `unit-replace-test`: 21/21. `combat-test`: 6/6.
- `ai-ai-alliance-tick-test`: suite 19/19, mutanty 8/8. `ai-ai-treaty-evaluate-test`: 21 pass/0, mutanty 0 niewykryte. `diplo-treaty-payment-carrier-test`: 11/0. `ai-ai-treaty-nap-wiring-test`: ZIELONE. `diplo-treaty-payment-wiring-test`: 468/0. `ai-ai-coalition-test`: ZIELONE.
- `ai-ai-alliance-surcharge-test` (nowy): D1–D8 OK; M1 (skalowanie usunięte), M2 (mnożnik zafiksowany), M3 (setter bez efektu) wykryte.
- Bundle (vite, poza repo): zbudowany, 1m05s.

## POMIAR (runner alliances, seed 4242, jeden Chromium naraz)

Porównanie w TUREJ 47 (wspólna tura wszystkich trzech biegów; biegi zatrzymały się na 51/53/47 z limitu czasu wywołania):

| mnożnik D | pierwszy sojusz AI↔AI | sojusze w t47 | maks. na cywilizację | limit 2 zachowany | odmowy „dopłata D” | odmowy „gotowość” | wojny AI↔AI |
|---|---|---|---|---|---|---|---|
| 1,0 | t42 | 1 | 1 | tak | 102 | 421 | 6 |
| 0,5 | t41 | 2 | 2 | tak | 82 | 429 | 6 |
| 0,25 | t34 | 2 | 2 | tak | 16 | 482 | 6 |

Liczby z surowego jsonl (`diag.sojusze`, kumulatywne), skrypt odczytu poza repo.

- Tura 60: NIE ZMIERZONO (biegi nie doszły do t60 w jednym wywołaniu; wznowienie z slotu przy 1,0 zakończyło się awarią przeglądarki — nie diagnozowano).
- Seed 7: NIE ZMIERZONO.
- Histogram odmów D: w t47 spada wyraźnie wraz z mnożnikiem (102 → 82 → 16), ale odmowy „gotowość” nadal dominują (421–482). Złagodzenie D samo nie wystarcza do gotowości w tej próbce.
- Wniosek ostrożny: na seedzie 4242 mnożnik 0,25 daje najwcześniejszy sojusz (t34) i najmniej odmów D, bez naruszenia limitu 2. Brak pomiaru seed 7 i t60 — wniosek niepewny.

## PYTANIE ABC (do właściciela, po polsku)

Wartość mnożnika dopłaty D dla sojuszy AI↔AI:
- A (rekomendacja): 0,5 — połowa dopłaty; w t47 sojusz jest o 7 tur wcześniej niż przy 1,0 i odmowy D spadają z 102 do 82; dopłata nadal istnieje.
- B: 0,25 — najwcześniejsze sojusze (t34) i najmniej odmów D (16), ale pomiar tylko na jednym seedzie.
- C: 1,0 — zostaje bez zmiany (status quo).

Rekomendacja A, do potwierdzenia pomiarem seed 7 i tury 60 przed wyborem B.

## NASTĘPNY KROK

Orkiestrator decyduje o pomiarze seed 7 i t60 (z `--mnoznik`, z wznowieniem, którego awaria wymaga osobnej diagnozy) oraz o pytaniu ABC.

## UWAGI-DLA-ORKIESTRATORA

- Wznowienie runnera z slotu (tura 50) przy 1,0 zakończyło się awarią Chromium na otwarciu strony. Nie zdiagnozowano; może być to problem z profilem po przerwaniu.
- Wszystkie biegi zakończyły się przez limit 580 s wywołania, nie przez runner.
- Na maszynie działają inne biegi (`/tmp/allflags-*`); ich procesów nie ruszano.

DEPLOY/PUSH: NIE WYKONANO
