# R-WOJNA-WYMUSZONA-PROG-TURY-GRACZ-Q1 — runda 3, rozszerzenie allowlisty (piąty plik)

Evaluator rundy 2 znalazł PIĄTĄ zastałą bramkę pominiętą przez wszystkie poprzednie
sprawdzenia (Evaluator rundy 1, allowlista `00b`, Operator rundy 2):
`gra/tools/forced-war-trojstronna-domino-live-test.cjs`. Przyczyna identyczna do #3/#4
z rundy 2: test bootstrapuje na turze 1 i wykonuje jedną turę, oczekując że gracz
zostanie stroną domina wymuszonej wojny Brązu — po progu `turn>=25` z tego tematu,
scenariusz fizycznie nie zachodzi w tym oknie.

**Orkiestrator AUTORYZUJE rozszerzenie allowlisty o ten piąty plik**, z identycznym
zakresem jak dla #3/#4: fast-forward realnymi `endTurn()` do tury ≥25 przed wywołaniem
`forceBronzeForcedWarDominoOnPlayer()`, zero nowego haka produkcyjnego, zachowanie
SEDNA testu (dowód na żywym silniku, że mechanizm domina faktycznie wybiera gracza).

## Stan zastany (Obrona rundy 2 zaczęła naprawę, nie dokończyła raportu)

W worktree `/home/user/wt-wojna-prog-tury` istnieje już niescommitowana zmiana w tym
pliku (`git diff` pokazuje: nowa funkcja `advanceTurnBySettledEndTurn()`, fast-forward
23× w `playDominoScenario()`, identyczny wzorzec co `forced-war-player-target-live-test.cjs`
z tej samej rundy) — Obrona rundy 2 rozpoczęła tę naprawę, ale nie zdążyła dokończyć
raportu ani potwierdzić wyniku bramki. **Zadanie tej rundy: dokończyć weryfikację, NIE
zaczynać od zera** — sprawdź czy istniejąca zmiana faktycznie naprawia test (uruchom go),
i jeśli tak, potwierdź to formalnie; jeśli nie (np. timeout, asercja nadal czerwona),
zdiagnozuj i popraw w tej samej rundzie.

## Binarne kryterium sukcesu tej rundy

- `forced-war-trojstronna-domino-live-test.cjs` zielony (wszystkie asercje, w tym D/E/F).
- Cała reszta rodziny `forced-war-*-test.cjs` + `wojna-wymuszona-*-test.cjs` +
  `boot-error-catcher-console-error-test.cjs` nadal zielona (bez regresji od poprzednich
  rund).
- 5 bramek referencyjnych zielone, `tsc --noEmit` czysto.
- Policz DOKŁADNIE ile plików pasuje do wzorca `forced-war-*-test.cjs` na dysku (Evaluator
  rundy 2 zgłosił rozbieżność 14 vs cytowane „15"/„17") — podaj w raporcie realną liczbę i
  potwierdź że WSZYSTKIE są zielone, nie tylko wymienione z nazwy.

Dalej obowiązują REGUŁA PRZECIW SAMOOSZUKIWANIU i GRANICE z `00-dispatch.md`/`00b-dispatch-runda2-allowlist.md`.
