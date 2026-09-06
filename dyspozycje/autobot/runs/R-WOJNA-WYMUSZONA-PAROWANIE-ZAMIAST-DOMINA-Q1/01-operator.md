# 01-operator.md — R-WOJNA-WYMUSZONA-PAROWANIE-ZAMIAST-DOMINA-Q1, runda 1

STATUS: FAIL
DOMAIN: GAME
TEMAT: R-WOJNA-WYMUSZONA-PAROWANIE-ZAMIAST-DOMINA-Q1
GOAL: Zastąpić coordinated-pick + domino trójstronne jedną funkcją `assignForcedWarPairings`
(krok 1 ECHO: warless parowani 1v1 pierwsi; krok 2: nieparzysta reszta dołącza jako trzeci do
istniejącej pary), wołaną raz na turę przed `ownerLoop`.

## ZMIANY / COMMIT
Brak commita (worktree, brak `git add -A`/`.`). Zmienione pliki (`git status`):
`gra/src/game/forced-war-common.ts` (nowa `assignForcedWarPairings` + `countActiveForcedWarsForOwner`),
`forced-war-bronze.ts`/`forced-war-stone.ts`/`forced-war-iron.ts` (usunięte `pickX...Coordinated`
i `pickX...DominoOwnerIds`), `gra/src/main.ts` (pre-pass `triggeredSubjects`/`existingActivePairsForJoin`
przed `ownerLoop` + odczyt `forcedWarAssignmentByOwner` w pętli, zastępując usunięte bloki;
debug-hook `forceBronzeForcedWarDominoOnPlayer` sprawdzony — nie wymaga zmian, nie odwołuje się
do usuniętych funkcji), 8 istniejących bramek zaktualizowanych, nowa bramka
`gra/tools/wojna-wymuszona-parowanie-test.cjs`.

**Interpretacja allowlisty (do ratyfikacji):** GOAL wprost mówi, że nowa funkcja "zastępuje
dzisiejsze wywołania coordinated-pick (per owner, w pętli) i domino (blok przed ownerLoop)" —
to wymagało edycji main.ts wewnątrz `ownerLoop` (nie tylko "punktu wywołania przed" nim), bo tam
żyły per-owner bloki wyboru celu. Trzymałem się ściśle obszaru mechanizmu wojny wymuszonej —
zero zmian poza nim.

**Poprawka projektowa w trakcie (błąd własny, naprawiony w tej samej rundzie):** ECHO "wybierz
parę, gdzie ŻADNA strona nie ma sojuszu z leftover" pierwotnie zaimplementowałem jako "co
najmniej jedna strona wolna" — naprawione na "OBIE strony muszą być wolne", zgodnie z
dosłownym brzmieniem i analogią do domina ("sojusz KTÓREJKOLWIEK strony blokuje CAŁĄ parę").

## TESTY (`node tools/<plik>.cjs` z `gra/`)
- `npx tsc --noEmit` → 0 błędów.
- 5 referencyjnych: logic-test 213/213, tech-tree-test 19/19, research-test 33/33,
  unit-replace-test 13/13, combat-test 6/6.
- **Nowa bramka `wojna-wymuszona-parowanie-test.cjs`: 40/40 ALL GREEN** — 9 scenariuszy:
  parzysta/nieparzysta liczba podmiotów, sojusz blokujący jedną parę, gracz w puli i jako
  leftover, brzegowy przypadek "wszystkie pary zablokowane" (`unresolvedOwnerIds`, nie
  zgadywanie), odtworzenie incydentu Rzymu, 7 podmiotów mieszanych, licznik pomocniczy.
- `grep -rn "unresolvedOwnerIds\|assignForcedWarPairings" gra/tools/wojna-wymuszona-parowanie-test.cjs`
  → reprodukowalny dowód inwariantu binarnego w kodzie testu.
- Rodzina `forced-war-*` (`find gra/tools -iname "*forced-war*"`, 14 plików) + nowa bramka:
  **12/14 ZIELONE**: bronze-test 56/56, bronze-main-guard 28/28, bronze-new-game-reset 34/34,
  stone-test 38/38, stone-main-guard 19/19, iron-test 55/55, iron-main-guard 37/37,
  iron-era-enter-turn-save-load 20/20, iron-player-target-live 11/11, player-target-live 11/11,
  trojstronna-test 23/23 (przepisany — testuje `assignForcedWarPairings` zamiast usuniętych
  funkcji domina), trojstronna-main-guard 14/14 (przepisany), reguly-multi-turn-simulation
  39/39 (harness przepisany na `assignForcedWarPairings`, K1-K9 zaadaptowane do nowej puli
  "wyłącznie wzajemnie triggered", K3 zaadaptowane do ECHO "bez twardego limitu wojen gracza").

## BLOKADY (2 pliki NIE zielone — stąd STATUS: FAIL)
1. **`forced-war-iron-mutant-probe.cjs`** — 20/37 asercji bramki + 43/55 czystych pokrytych
   mutacyjnie. Częściowo PRE-ISTNIEJĄCE (mutacje M09/M10 i brak pokrycia progu 25 tur Żelaza —
   z wcześniejszego dispatchu, nie tego tematu), częściowo NOWE (M38-M44/M56 celują w usunięty
   kod per-owner — potrzebują nowych mutacji na pre-pass/`assignForcedWarPairings`). Wymaga
   osobnej rundy dopisania ~15-20 mutacji.
2. **`forced-war-trojstronna-domino-live-test.cjs`** — Playwright, oczekuje STAREGO kształtu
   ("OBIE strony domina wypowiadają wojnę"); nowy algorytm (krok 4 ECHO) daje cel graczowi
   TYLKO jednej, wybranej stronie. Asercje D/E/F wymagają przepisania pod nowy kształt
   (3 FAIL oczekiwane, nie zbadane w tej rundzie — build+Chromium kosztowny czasowo).

## RUNDY: 1/5
## NASTĘPNY KROK: Evaluator ocenia; jeśli FAIL utrzymany — runda 2 dopisuje mutacje probe'a
i przepisuje live-test pod nowy kształt domina.
## DEPLOY/PUSH: NIE WYKONANO
