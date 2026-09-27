# 02-dispatch-evaluator-narrow-correction — Oblezenie AI siege consumer Evaluator

STATUS: DISPATCH READY
ROLE: Evaluator (independent — no access to Operator's reasoning/chat, only artifacts)
TOPIC: R-CYWILIZACJE-MACIERZ-WIRING-OBLEZENIE-Q1-20260922
SCOPE: Narrow correction only (AI siege defender-strength consumer)
WORKTREE: /home/ubuntu/projects/The-Game-civ-matrix-wiring-oblezenie-20260922
BRANCH: hermes/R-CYWILIZACJE-MACIERZ-WIRING-OBLEZENIE-Q1-20260922
MODEL: claude-sonnet-5
PROVIDER: anthropic

## CONTEXT

Historia tego tematu: Operator round1 PASS → Evaluator round1 PASS →
Final Control (recovery po rate limicie Anthropic) **FAIL** z jednym
zarzutem blokującym: produkcyjna ścieżka decyzji AI o oblężeniu
(`siegeAi.ts`) ignorowała `obl_mur_proc`/`obl_obrona_miasta_proc`. System
automatycznie utworzył wąski dispatch korekty
(`narrow-correction-20260923/`) — Operator zgłosił PASS.

Przeczytaj W CAŁOŚCI: poprzedni `03-final-control-recovery-20260923.md`
(dokładny opis luki), `narrow-correction-20260923/operator-report.md` i
`operator-evidence.json`. NIE ufaj żadnej z tych deklaracji — zweryfikuj od
zera. NIE commituj nic.

## ZADANIE — 8 punktów

1. **Trace niezależnie**: przeczytaj `main.ts` diff w całości — potwierdź
   że OBA miejsca wywołania `decideAISiegeStance`
   (`scanAutoSiegesAfterAiTurn` i `maybeAiAssaultAfterMachines`)
   rzeczywiście przekazują civKey broniącego się miasta. Sprawdź źródło
   civKey (`_menuCivIdByOwner`/`player.civType`/`aiOwnerCivMap` —
   zweryfikuj że to sensowne, istniejące mechanizmy, nie wymyślone przez
   Operatora na poczekaniu) i potwierdź że BRAK danych daje `null`/neutral,
   NIE cichy fallback na Grecję czy inną konkretną cywilizację.
2. **Najważniejsze — brak podwójnego zastosowania.** Operator twierdzi:
   "Only siegeAi passes applyCityBonus(..., true). resolveSiegeAttack
   keeps the default false, so the later real battle path does not
   receive a second structure application." Zweryfikuj to SAMODZIELNIE —
   przeczytaj sygnaturę `applyCityBonus` i wszystkie jej call site'y
   (`grep -rn "applyCityBonus("`). Potwierdź że gdy AI oceni miasto, a
   POTEM faktycznie dojdzie do bitwy (main.ts/battleScene.ts, już wired w
   round 1), bonus civ-matrix nie zostanie policzony DWA razy (raz przez
   AI-ocenę, raz przez realną bitwę) na tym samym starciu. Jeśli
   `resolveSiegeAttack` (siege.ts) nie jest w ogóle wywoływana w
   produkcyjnej bitwie (main.ts/battleScene.ts mają WŁASNĄ arytmetykę,
   ustalone w round 1 recovery Final Control) — to naturalnie nie ma
   ryzyka podwójnego liczenia MIĘDZY modułami, ale potwierdź to explicite,
   nie zakładaj.
3. Sprawdź `siege.ts` diff — nowy parametr (prawdopodobnie
   `wallDefensePercent`/podobny) w `SiegeParams`, jego domyślna wartość i
   wpływ na `cityDefenseBonus`/`estimateDefenderStrength`. Potwierdź
   wsteczną zgodność: brak przekazanego parametru = identyczne stare
   zachowanie (0% bonusu, jak przed całym tematem Oblężenia).
4. Uruchom SAM wszystkie zadeklarowane testy: `tsc --noEmit`,
   `civ-matrix-oblezenie-wiring-test.cjs` (83 pass?),
   `siege-ai-test.cjs` (17 pass?), `logic-test.cjs` (213 pass?),
   `city-defense-terrain-gate-test.cjs` (34 pass?),
   `mur-paradoks-test.cjs` (29 pass?). Potwierdź dokładne liczby.
5. Ręcznie przelicz przynajmniej 2 nowe asercje behawioralne (np. Grecy
   200%→288%, Zulusi 200%→160% w kontekście `estimateDefenderStrength`,
   nie tylko `cityWallDefenseBonusPercent` z round 1) — niezależnie od
   kodu testu, żeby potwierdzić że liczby mają sens.
6. `git status --short`/`git diff --check` sam — diff ograniczony do
   allowlisty korekty (`main.ts`, `siege.ts`, `siegeAi.ts`,
   `civ-matrix-oblezenie-wiring-test.cjs`) PLUS niezmieniony round1 diff
   (`civ-matrix.json`, `city-defense.ts`, `battleScene.ts`,
   `siegeMachines.ts`)? Zero commitów.
7. Sprawdź czy Operator NIE dotknął żadnego z plików round1 poza
   dozwolonym zakresem (np. czy `battleScene.ts`/`city-defense.ts` mają
   dokładnie ten sam diff co po round1 Evaluator PASS — porównaj z
   `02-evidence.json` z round1 jeśli zawiera hash/rozmiar, albo po prostu
   potwierdź że te pliki nie są w `git diff` tej korekty).
8. Sprawdź czy civKey resolution (`_menuCivIdByOwner` itp.) nie duplikuje
   istniejącego mechanizmu `civKeyForOwnerId` z round 1 inną, potencjalnie
   rozjeżdżającą się logiką — czy jest to spójne z tym co main.ts już robi
   gdzie indziej.

## WERDYKT

STATUS: PASS | PASS-WITH-NOTES | FAIL. Zapisz w
`narrow-correction-20260923/evaluator-report.md` +
`evaluator-evidence.json`. Punkt 2 (brak podwójnego liczenia) to
najwyższe ryzyko tej korekty — poświęć mu najwięcej uwagi, bo błąd tutaj
oznaczałby że gra realnie liczy bonus dwukrotnie silniejszy niż zamierzono.

## NEXT PHASE

PASS/PASS-WITH-NOTES bez zarzutu blokującego → nowy Final Control (legalny
po tym jak ta korekta ma niezależny terminal wynik Evaluatora, zgodnie z
kontraktem poprzedniego dispatchu). FAIL → kolejna wąska korekta (round 2,
licznik rund w operator-report.md pokazuje "narrow correction 1/5" — jest
limit 5 prób).
