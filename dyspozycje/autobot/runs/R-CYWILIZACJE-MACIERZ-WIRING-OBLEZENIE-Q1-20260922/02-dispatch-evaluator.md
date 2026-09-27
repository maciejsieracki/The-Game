# 02-dispatch-evaluator — Oblezenie wiring Evaluator

STATUS: DISPATCH READY
ROLE: Evaluator (independent — no access to Operator's reasoning/chat)
TOPIC: R-CYWILIZACJE-MACIERZ-WIRING-OBLEZENIE-Q1-20260922
WORKTREE: /home/ubuntu/projects/The-Game-civ-matrix-wiring-oblezenie-20260922
BRANCH: hermes/R-CYWILIZACJE-MACIERZ-WIRING-OBLEZENIE-Q1-20260922
MODEL: claude-sonnet-5
PROVIDER: anthropic

## CONTEXT

Operator zgłosił STATUS: PASS, WSZYSTKIE 3 parametry podłączone (bez
DECISION_REQUIRED), w tym trudny przypadek battleScene.ts z zachowanym
parytetem trybów. Przeczytaj `00-dispatch.md` (pełny zakres, ostrzeżenie
strukturalne o parytecie), `INPUT-converted-values.json`, `01-operator.md`,
`01-evidence.json`. NIE commituj nic.

## ZADANIE

Nie ufaj deklaracjom Operatora. Zweryfikuj od zera:

1. 45 komórek civ-matrix.json — programowy diff Python przeciwko
   INPUT-converted-values.json. Zero innych zmian w pliku?
2. **PARYTET (najważniejsze).** Przeczytaj CAŁY diff `city-defense.ts` i
   sprawdź, czy `cityWallDefenseBonusPercent` faktycznie przyjmuje nowe
   opcjonalne argumenty i mnoży istniejący wynik (nie zastępuje). Potem
   przeczytaj diff `main.ts` I `battleScene.ts` — potwierdź że OBA miejsca
   wywołania tej samej funkcji przekazują civ-matrix mnożniki dla tego
   samego civKey (właściciela/obrońcy miasta) i że wynik byłby IDENTYCZNY
   dla tej samej sytuacji rozegranej przez oba tryby. Jeśli znajdziesz
   rozjazd (np. main.ts przekazuje mnożnik, battleScene.ts nie, albo
   odwrotnie, albo różne wartości) — to zarzut BLOKUJĄCY, FAIL.
3. Sprawdź czy `_defenderCivIconId` w battleScene.ts jest faktycznie
   civKey OBROŃCY (właściciela miasta), nie atakującego — pomyłka strony
   byłaby poważnym błędem gameplayowym (przeciwnik dostawałby Twój bonus
   muru). Przeczytaj kontekst wokół `this._defenderCivIconId` w
   konstruktorze BattleScene.
4. Sprawdź `siegeMachines.ts` — `civSiegeMachinesMult` i jej użycie w
   `_siegeStructureDamage`/`_attackWallTile` w battleScene.ts. Potwierdź że
   `_attackerCivIconId` jest faktycznie civKey ATAKUJĄCEGO (właściciela
   machiny), nie obrońcy — i że machiny oblężnicze są rzeczywiście zawsze
   po stronie atakującej (sprawdź `isSiegeUnit`/`ru.side === 'atk'` logikę
   sam, nie ufaj twierdzeniu Operatora).
5. Uruchom sam nowy test (`node tools/civ-matrix-oblezenie-wiring-test.cjs`)
   — potwierdź dokładną liczbę i ręcznie przelicz 3 konkretne asercje
   (np. Grecy mur 200%→240%, Zulusi 200%→160%, Taran wallAttack 14→17/11).
6. Uruchom sam WSZYSTKIE 6 istniejących testów wymienionych przez
   Operatora. Dla 2 z deklarowanymi pre-istniejącymi failami
   (`empire-panel-miasto-obywatele-content-test.cjs` 1 fail,
   `koszty-surowcowe-test.cjs` 3 fail) — powtórz weryfikację Operatora:
   `git stash`, uruchom ponownie, potwierdź identyczne faile BEZ zmian tego
   tematu, `git stash pop`. Jeśli faile RÓŻNIĄ się (nowy fail wprowadzony
   przez ten diff) — zarzut blokujący.
7. `npx tsc --noEmit` sam.
8. `git diff --check` sam, `git status --short` sam — diff ograniczony do
   zgłoszonych plików + allowlisty?
9. Sprawdź czy `_attackWallTile`/`_siegeStructureDamage` w battleScene.ts
   rzeczywiście istniały PRZED tym diffem (nie zostały wymyślone) — sprawdź
   `git show origin/main:gra/src/battle/battleScene.ts | grep -n "_attackWallTile\|_siegeStructureDamage"`.

## WERDYKT

STATUS: PASS | PASS-WITH-NOTES | FAIL. Zapisz `02-evaluator.md` +
`02-evidence.json`. Punkt 2 i 3 (parytet, poprawna strona civKey) to
najwyższe ryzyko tego tematu — poświęć im najwięcej uwagi.

## NEXT PHASE

PASS/PASS-WITH-NOTES bez zarzutu blokującego → pomiń Obronę → Final Control.
FAIL lub zarzut blokujący → Obrona.
