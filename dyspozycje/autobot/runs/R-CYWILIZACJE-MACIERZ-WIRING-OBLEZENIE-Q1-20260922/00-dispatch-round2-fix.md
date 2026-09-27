# 00-dispatch-round2-fix — Oblezenie wiring Operator (narrow correction)

STATUS: DISPATCH READY
ROLE: Operator (round 2 — narrow correction, not a redo)
TOPIC: R-CYWILIZACJE-MACIERZ-WIRING-OBLEZENIE-Q1-20260922
BOARD: the-game-real24
PROJECT: p_9ae9ac64
TENANT: the-game
WORKSPACE: /home/ubuntu/projects/The-Game-civ-matrix-wiring-oblezenie-20260922
BRANCH: hermes/R-CYWILIZACJE-MACIERZ-WIRING-OBLEZENIE-Q1-20260922
MODEL: claude-sonnet-5
PROVIDER: anthropic

## Kontekst — dlaczego ten dispatch istnieje

Round 1 (Operator PASS → Evaluator PASS → Final Control recovery FAIL) jest
w tym samym, niescommitowanym worktree. NIE cofaj żadnej z tych zmian —
`gra/data/civ-matrix.json` (45 komórek), `city-defense.ts`, `main.ts`,
`battleScene.ts`, `siegeMachines.ts`, nowy test — wszystko zostaje.

Final Control (`03-final-control-recovery-20260923.md`, przeczytaj w
całości) znalazł JEDEN konkretny, uzasadniony zarzut blokujący:

> Produkcyjna ścieżka decyzji AI o oblężeniu
> (`main.ts:14929-14962,14966-14987` → `siegeAi.ts:decideAISiegeStance` →
> `estimateDefenderStrength` → `siege.ts:cityDefenseBonus`) NIE konsumuje
> `obl_mur_proc`/`obl_obrona_miasta_proc`. AI klasyfikuje tę samą murowaną
> stolicę jako assault/siege_build/starve na podstawie siły obrońcy, która
> ignoruje nowo podłączone parametry civ-matrix, podczas gdy realna bitwa
> (main.ts/battleScene.ts) już je stosuje.

Reszta raportu Final Control jest PASS/potwierdzona (kalibracja materialnie
odczuwalna, poprawny wybór strony atakujący/obrońca, JSON mergowalny z
Manpower) — NIE trzeba tego powtarzać, tylko naprawić tę jedną lukę.

## Głębsza przyczyna (już zbadana, oszczędza Ci czas)

`siege.ts:cityDefenseBonus` liczy WYŁĄCZNIE stary, retired (2026-07-25)
płaski mechanizm `wallObrona = wallBaseObrona + ...` — który jest ZAWSZE 0,
bo `wallBaseObrona`/`wallPerLevelObrona` to dziś 0 z danych (patrz komentarz
w pliku, linie ~385-391). Prawdziwy bonus muru (+200%/+300% procentowy) jest
liczony GDZIE INDZIEJ — w `main.ts:structureDefenseBonusFor` i
`battleScene.ts` — przez `city-defense.ts:cityWallDefenseBonusPercent`,
funkcję którą już podłączyłeś w round 1.

Oznacza to, że AI (`estimateDefenderStrength`) dziś w ogóle NIE UWZGLĘDNIA
procentowego bonusu muru (ani starego, ani civ-matrix) — to szerszy,
przedistniejący brak, nie tylko luka civ-matrix. NAPRAW WYŁĄCZNIE zakres
civ-matrix (dodaj procentowy bonus muru + civ-matrix mnożnik do ścieżki AI);
nie próbuj naprawiać całej architektury oceny siły AI — to wykracza poza
ten temat.

## SCOPE (dokładny allowlist, round 2)

1. `gra/src/game/siege.ts`:
   - Dodaj do `SiegeParams` nowe opcjonalne pole (np. `wallDefensePercent?:
     number` — ułamek, np. 2.0 dla 200%) reprezentujące już policzony,
     scalony procentowy bonus muru (structural + civ-matrix mnożniki),
     analogicznie do tego co dziś liczy `cityWallDefenseBonusPercent` w
     `city-defense.ts`.
   - W `cityDefenseBonus`/`applyCityBonus`/`estimateDefenderStrength` (wybierz
     najmniejszą, najbardziej lokalną zmianę) zastosuj ten procentowy
     mnożnik do obrony garnizonu, analogicznie do tego jak
     `structureDefenseBonusFor`/`effectiveDefenderM` w main.ts miesza
     `attack + defense*(1+pct)`. Zachowaj wsteczną zgodność: brak tego pola
     (domyślnie undefined/0) = dokładnie stare zachowanie (0% bonusu, jak
     dziś) — WSZYSTKIE istniejące testy siege.ts/siegeAi.ts muszą przejść
     bez zmian.
2. `gra/src/game/siegeAi.ts`:
   - `SiegeAiParams`/`decideAISiegeStance` powinny umożliwić przekazanie
     tego procentowego bonusu (przez `siegeParams.wallDefensePercent` albo
     nowy, jawny parametr) do `estimateDefenderStrength`.
3. `gra/src/main.ts`:
   - W obu miejscach wywołania `decideAISiegeStance`
     (`scanAutoSiegesAfterAiTurn` i `maybeAiAssaultAfterMachines`), policz
     ten sam procentowy bonus muru dla broniącego się miasta co
     `structureDefenseBonusFor` już liczy (użyj DOKŁADNIE tej samej funkcji
     `cityWallDefenseBonusPercent` z `city-defense.ts`, z civ-matrix
     mnożnikami civKey właściciela miasta — nie duplikuj arytmetyki) i
     przekaż jako `siegeParams.wallDefensePercent` do `decideAISiegeStance`.
4. Nowy plik lub rozszerzenie `gra/tools/civ-matrix-oblezenie-wiring-test.cjs`:
   - Dowód że `decideAISiegeStance`/`estimateDefenderStrength` dają REALNIE
     różny wynik `defenderStrength`/`ratio`/`tier` dla tej samej armii i
     miasta między dwiema różnymi cywilizacjami broniącymi (np. Grecy
     obl_mur_proc=+0.2 vs Zulusi obl_mur_proc=-0.2) — analogicznie do testów
     round 1.
   - Kontrola wsteczna zgodność: wywołanie bez `wallDefensePercent`
     (undefined) daje identyczny wynik jak przed tą zmianą.

## POZA ZAKRESEM (nie ruszaj)

- Nie zmieniaj żadnej z 45 komórek civ-matrix.json (już poprawne).
- Nie zmieniaj `city-defense.ts`/`battleScene.ts` poza odczytem (wywołaniem)
  istniejącej `cityWallDefenseBonusPercent` z main.ts — sama funkcja już
  działa poprawnie z round 1.
- Nie próbuj włączać starego, martwego mechanizmu `wallBaseObrona` (zostaw
  0, to celowo retired).
- Nie zmieniaj `siegeMachines.ts` (obl_machines_proc już poprawnie
  podłączony, Final Control to potwierdził).

## ACCEPTANCE

1. AI (`decideAISiegeStance`) daje realnie różny `defenderStrength`/`tier`
   dla miast broniących się przez różne cywilizacje z niezerowym
   `obl_mur_proc`/`obl_obrona_miasta_proc` — dowiedzione nowym testem.
2. Wsteczna zgodność: brak przekazanego bonusu = stare zachowanie,
   wszystkie ISTNIEJĄCE testy siege.ts/siegeAi.ts (znajdź przez
   `grep -rl "siegeAi\|from './siege'" gra/tools`) PASS bez regresji.
3. Wszystkie testy z round 1 (`civ-matrix-oblezenie-wiring-test.cjs`,
   `city-defense-terrain-gate-test.cjs`, `defense-breakdown-test.cjs`,
   `fortify-pole-test.cjs`, `mur-paradoks-test.cjs`) nadal PASS.
4. `npx tsc --noEmit` (z `gra/`) PASS.
5. `git diff --check` czyste; diff = round 1 (niezmieniony) + nowe zmiany
   ściśle w allowlist round 2.
6. Brak commit/push/merge/deploy.

## REQUIRED ARTIFACTS

`04-operator-round2-fix.md`, `04-evidence-round2.json`,
`04-transition-receipt-round2.md` w tym samym katalogu run.

`PUSH/DEPLOY: NIE WYKONANO`.

## NEXT PHASE

Po PASS Operatora round 2 → nowy niezależny Evaluator (osoba trzecia, bez
kontekstu tej korekty) → jeśli PASS, nowy Final Control → workerless
integration gate.
