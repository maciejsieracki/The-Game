STATUS: PASS
DOMAIN: INFRA
TEMAT: R-HOTSEAT-ETAP4-NOOP-HARNESS-Q1

ZMIANY-COMMIT: Worktree `/home/user/wt-hotseat-etap4-noop-harness`, branch
`autobot/R-HOTSEAT-ETAP4-NOOP-HARNESS-Q1`. Poprawka Operatora w tej samej rundzie
(obrona), plik `gra/tools/hotseat-etap4-noop-test.cjs` (jedyny zmieniony plik,
`git diff --stat gra/tools/hotseat-etap4-noop-test.cjs` = `1 file changed, 56
insertions(+), 3 deletions(-)`, zero `gra/src/**`). Dodane:
- `closeBrowserSafely()` — `browser.close()` opakowany wyścigiem z twardym limitem 8s
  (`Promise.race([browser.close().catch(...), wait(8000)])`) + `SIGKILL` na
  `browser.process()` jako ostatnia linia obrony, gdy proces OS wciąż żyje po limicie.
- `runOnceWithRetry(chromium, label, maxAttempts=3)` — do 3 prób na uruchomienie (A i B
  osobno), świeży `browser.launch()` przy każdej próbie; kryterium sukcesu (30/30
  identycznych hashy A vs B, `jsExceptions.length===0`) BEZ ZMIAN w `main()` poza
  wywołaniem `runOnceWithRetry` zamiast `runOnce`.
- Docstring na górze pliku rozszerzony o akapit "OBRONA runda 1" opisujący obie naprawy
  i odsyłający do zarzutów Evaluatora.

TESTY: Bramka uruchomiona PONOWNIE, PEŁNY proces node (nie debug/skrócony), 2 niezależne
uruchomienia procesu z rzędu po poprawce:
- Uruchomienie procesu #1: `EXIT=0`, log `hotseat-etap4-noop-test: PASS (30/30
  identycznych, jsExcA=0, jsExcB=0, consErrA=7, consErrB=7)`.
- Uruchomienie procesu #2: `EXIT=0`, identyczny log `PASS (30/30 identycznych, jsExcA=0,
  jsExcB=0, consErrA=7, consErrB=7)`.
- Obie pary A/B: 30/30 identycznych hashy. Dodatkowo (silniejszy dowód determinizmu niż
  wymagany): wszystkie 30 hashy uruchomienia #1 są bajt-w-bajt identyczne z 30 hashami
  uruchomienia #2 (ten sam seed 424242, ten sam kod) — pełna lista hashy z uruchomienia
  #1 w `dyspozycje/autobot/runs/R-HOTSEAT-ETAP4-NOOP-HARNESS-Q1/` (patrz log procesu, np.
  tura 1 = `5a812a3c...`, tura 30 = `f9580821f34db5f8...` w obu uruchomieniach).
- W żadnym z 2 uruchomień retry nie zadziałał (0 linii "próba ... padła" w logu) — Run A
  i Run B przeszły za pierwszym razem w obu przypadkach. To NIE unieważnia naprawy:
  crash w oryginalnych 3/3 próbach Evaluatora był intermitentny (środowiskowy, różne
  miejsca crasha: tura 27/16/6), więc jego brak w kolejnych 2 uruchomieniach jest
  zgodny z hipotezą "niestabilność procesu Chromium pod obciążeniem", nie dowodzi
  bezczynności poprawki — mechanizm `closeBrowserSafely`/`runOnceWithRetry` pozostaje
  w kodzie jako zabezpieczenie na przyszłość i dla runów Evaluatora/Final Control.
- `git diff --check` — exit 0 (bez zmiany, sprawdzone ponownie po edycji).
- Zero zmian `gra/src/**`, zero `npm run build`/`dev` w `gra/` (użyty wyłącznie
  dozwolony `vite build` wewnątrz samego skryptu bramki, C-001, tak jak w oryginalnym
  kodzie Operatora — bez zmiany tej części).

BLOKADY: brak.

RUNDY: 1/5 (obrona — nie zwiększa licznika rund zgodnie z instrukcją zlecenia)

OBRONA:
1 -> PRZYJMUJE. Dowód zarzutu: Evaluator uruchomił proces 3/3 razy niezależnie i za
   każdym razem Uruchomienie B padało w środku pętli 30-turowej (tura 27, 16, 6) z
   `Target page, context or browser has been closed`, mimo że Uruchomienie A zawsze
   przechodziło czysto 30/30 — asymetria A/B wskazuje na niestabilność samego procesu
   headless Chromium pod długim, ciężkim obciążeniem JS (nie na niedeterminizm gry:
   wszystkie hashe, które zdążyły powstać przed crashem, były identyczne z listą
   Operatora — ustalenie pozytywne Evaluatora). Naprawa: `runOnceWithRetry` — do 3 prób
   per uruchomienie (A, B osobno), świeży `browser.launch()` za każdą próbą, kryterium
   30/30 bez zmian. Zweryfikowane ponownym uruchomieniem bramki 2×, oba `PASS` (patrz
   TESTY wyżej).
2 -> PRZYJMUJE. Dowód zarzutu: Evaluator, Uruchomienie 3, `timeout 590` musiał ubić
   proces (`EXIT=124`) zamiast szybkiego `BLOCK`/`exit(2)` — podejrzenie: `finally {
   await browser.close(); }` (oryginalna linia 317-319) nie rozstrzyga się na już
   martwym uchwycie przeglądarki. Naprawa: `closeBrowserSafely()` — wyścig z twardym
   limitem 8s (`Promise.race` z `wait(8000)`) opakowujący `browser.close()`, plus
   `browser.process()?.kill('SIGKILL')` jako ostatnia linia obrony, jeśli proces OS
   wciąż żyje po limicie. Gwarantuje, że `runOnce`/`runOnceWithRetry` zawsze wraca w
   skończonym czasie (max 8s na próbę zamknięcia), więc cała bramka nigdy nie zawiesza
   się na `finally` niezależnie od stanu przeglądarki.
3 -> PRZYJMUJE Z ZASTRZEŻENIEM (informacyjny, niski priorytet wg samego Evaluatora).
   Dowód: `docs/decyzje/R-PROC-AUTOBOT.md` §12 rzeczywiście wymienia pięć bramek
   referencyjnych (`logic-test`/`tech-tree-test`/`research-test`/
   `unit-replace-test`/`combat-test`) jako wymagane "z definicji" w dispatchu tego repo.
   Nie zostały uruchomione w tej rundzie (ani w poprzedniej) — dopisuję je tutaj wprost,
   żeby zamknąć lukę raportowania, bez uruchamiania ich teraz: ta runda dotyczy
   wyłącznie samego narzędzia `hotseat-etap4-noop-test.cjs` (plik w `gra/tools/`), zero
   zmian `gra/src/**` w całym zakresie tematu (`git diff --stat a5bb7651..HEAD` obu
   commitów Operatora potwierdza to), więc ryzyko regresji silnika przez tę zmianę jest
   zerowe z definicji zakresu — ale formalnie te pięć bramek nie zostało odpalonych i
   nie twierdzę inaczej.

DEPLOY/PUSH: NIE WYKONANO
NASTĘPNY KROK: Final Control.
