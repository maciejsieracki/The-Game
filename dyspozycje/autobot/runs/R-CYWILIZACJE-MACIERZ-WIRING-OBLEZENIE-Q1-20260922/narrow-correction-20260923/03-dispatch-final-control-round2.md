# 03-dispatch-final-control-round2 — Oblezenie wiring Final Control (po korekcie)

STATUS: DISPATCH READY
ROLE: Final Control (independent — third reviewer, round 2 po korekcie)
TOPIC: R-CYWILIZACJE-MACIERZ-WIRING-OBLEZENIE-Q1-20260922
WORKTREE: /home/ubuntu/projects/The-Game-civ-matrix-wiring-oblezenie-20260922
BRANCH: hermes/R-CYWILIZACJE-MACIERZ-WIRING-OBLEZENIE-Q1-20260922
MODEL: claude-sonnet-5
PROVIDER: anthropic

## CONTEXT

Pełna historia tego tematu: Operator round1 PASS → Evaluator round1 PASS
→ Final Control round1 (recovery po rate limicie Anthropic) **FAIL**
(jeden zarzut: AI siege stance ignorował obl_mur_proc/obl_obrona_miasta_proc)
→ wąska korekta: Operator PASS → Evaluator PASS (zero zarzutów, w tym
potwierdzenie braku podwójnego zastosowania bonusu między ścieżką AI a
realną bitwą).

Przeczytaj W CAŁOŚCI: `03-final-control-recovery-20260923.md` (oryginalny
zarzut), `narrow-correction-20260923/operator-report.md`,
`narrow-correction-20260923/evaluator-report.md`,
`narrow-correction-20260923/evaluator-evidence.json`. Nie ufaj żadnemu z
nich — zadaj własne pytania.

## PYTANIA WYŻSZEGO POZIOMU (round 2)

1. **Czy oryginalny zarzut blokujący jest rzeczywiście naprawiony** — nie
   tylko czy testy przechodzą, ale czy AI faktycznie inaczej ocenia i
   podejmuje decyzję (assault/siege_build/siege_starve/retreat) dla tej
   samej armii i miasta w zależności od civ-matrix obrońcy. Skonstruuj
   samodzielnie scenariusz na granicy progu tier (np. blisko t1AssaultRatio)
   i sprawdź czy ±0.20 na murze może realnie ZMIENIĆ klasyfikację tier
   (assault→siege_build albo odwrotnie), nie tylko liczbę defenderStrength.
2. **Podwójne liczenie — zweryfikuj SAM, nie ufaj Evaluatorowi.** Przeczytaj
   sygnaturę `applyCityBonus` i wszystkie jej wywołania w całym `gra/src`
   (`grep -rn "applyCityBonus("`). Potwierdź że jest dokładnie jedno
   wywołanie z `includeStructure=true` (w siegeAi.ts) i że
   `resolveSiegeAttack`/domyślna ścieżka bitwy NIE jest wywoływana z tym
   flagiem. Sprawdź też czy `resolveSiegeAttack` (siege.ts) jest w ogóle
   używana w produkcyjnym kodzie (main.ts/battleScene.ts) — jeśli nie
   (potwierdzone przez poprzedni Final Control recovery), to podwójne
   liczenie między AI-oceną a rzeczywistą bitwą jest strukturalnie
   niemożliwe (różne moduły, różna arytmetyka) — potwierdź to explicite.
3. Czy poprawka wprowadziła jakiekolwiek NOWE ryzyko, którego nie było w
   round 1 (np. koszt wydajnościowy liczenia civ-matrix przy każdej ocenie
   AI co turę, przy dużej liczbie miast/oblężeń)? Oceń czy to realne
   ryzyko dla tej gry (skala mapy/liczba miast), czy teoretyczne.
4. Sprawdź czy diff pozostał ograniczony do zadeklarowanego zakresu —
   `main.ts`, `siege.ts`, `siegeAi.ts`, test — bez dotknięcia plików round1
   (`city-defense.ts`, `battleScene.ts`, `siegeMachines.ts`,
   `civ-matrix.json` powinny mieć DOKŁADNIE ten sam diff co po round1
   Evaluator PASS).
5. Decyzja: PASS | PASS-WITH-NOTES | FAIL. Jeśli FAIL — numerowane zarzuty
   z plikiem/linią/konsekwencją (round limit: to jest recovery 2 z max 5,
   sprawdź licznik w operator-report.md).

## WERDYKT

Zapisz `narrow-correction-20260923/final-control-report.md` +
`final-control-evidence.json`.

## NEXT PHASE

PASS/PASS-WITH-NOTES → workerless integration gate (żaden merge bez
jawnej zgody właściciela). FAIL → kolejna wąska korekta.
