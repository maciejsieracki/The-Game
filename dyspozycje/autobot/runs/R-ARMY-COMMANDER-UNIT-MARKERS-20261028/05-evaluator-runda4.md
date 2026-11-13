# AutoBot Evaluator — runda 4

TEMAT: `R-ARMY-COMMANDER-UNIT-MARKERS-20261028`  
DATA: 2026-10-28  
KANDYDAT: `/tmp/the-game-commander-markers-20261028`  
BRANCH: `codex/R-ARMY-COMMANDER-UNIT-MARKERS-20261028-integration`  
HEAD/BAZA: `85f8c5f0e0aa6ff46aa8b85a03d0bc0c71d86268`

## Werdykt

**PASS-WITH-NOTES.** Diff produktu pozostaje w allowliście i jest identyczny z rundą 3, test celowany oraz typecheck przechodzą, a raport rundy 4 podaje identyczne wyniki sześciu sąsiednich testów na czystej bazie i kandydacie. Zrzut `08` jest uczciwie oznaczonym renderowym harness’em, nie pełnym stanem gameplay; `09` pokazuje rzeczywistą wygenerowaną mapę bez jednostki wojskowej. Połączenie obu zrzutów dostarcza dowodu wymaganego zachowania w mapowej skali i potwierdza start pełnej gry. Pozostaje ograniczenie kontekstu: znacznik nie został pokazany na tej samej wygenerowanej mapie w pełnym kliencie gry.

## Pięć pytań Evaluatora

1. **SCOPE — PASS.** Względem bazy produktowy diff nadal dotyczy dokładnie czterech plików z allowlisty: `gra/src/game/armyMerge.ts`, `gra/src/render/unitStatPlate.ts`, `gra/src/render/unitVeteranBadges.ts`, `gra/src/render/units.ts`. Nowy test `gra/tools/commander-star-emblem-test.cjs` i artefakty rundy są dozwolone. `main.ts` i `generals.ts` nie mają zmian. R4 nie dodaje kodu produktu.
2. **NO-SIDE-EFFECT — PASS.** Stan plików to cztery zmienione pliki produktu, celowany test i katalog bieżącego runu z raportami, dwoma obrazami oraz plikami harnessu mapy. Nie ma diffu poza dozwolonym zakresem; nie wykryłem zmian rekrutacji, walki ani AI. `git diff --check` dla czterech plików produktu przechodzi.
3. **NO-REGRESSION — PASS.** Zgodnie z raportem Operatora, ten sam zestaw sześciu testów dał na bazie i kandydacie **11,226 pass / 0 fail**, delta **0 pass / 0 fail**. Porównanie obejmuje testy merge bounce, colocated, stackGroupId, roster generałów, render odznak karty jednostki oraz synchronizację overlayów. Zweryfikowałem obecność snapshotu bazy `/tmp/commander-markers-baseline-85f8c5f`; szczegółowe liczniki pochodzą z raportu Operatora, nie z niezależnego ponownego uruchomienia wszystkich sześciu testów. SHA-256 pięciu plików produktu/testu zgadzają się z raportem r3, więc dowód odnosi się do niezmienionego diffu.
4. **METRYKI KOMPLETNE — PASS.** Niezależnie ponowiony `node gra/tools/commander-star-emblem-test.cjs`: **11 passed, 0 failed**. `cd gra && node ./node_modules/typescript/bin/tsc --noEmit`: **exit 0**, bez diagnostyk. Zakresowy `git diff --check`: **exit 0**. Wyniki sześciu testów sąsiednich są podane liczbowo dla obu stanów w raporcie Operatora. Rzeczywisty Chromium run zakończył się na mapie startowej; raport podaje `21:46:55.311` start, `21:47:30.253` wejście w turę 1, 35,945 ms łącznie i wyłącznie HTTP 404 `/favicon.ico`.
5. **JAKOŚĆ TESTÓW I DOWÓD WIZUALNY — PASS-WITH-NOTES.** Celowany test sprawdza produkcyjne `stackVitals()` oraz `applyUnitCommanderStar()` dla braku dowódcy, dowódcy jako innego członka stosu, odłączenia/usunięcia dowódcy, idempotencji, trzech gwiazdek XP i proporcji emblematu 4×. R4 nie zmienia zachowania testowanego; pozostają edge i negacja z r3. Obraz `08` jest 1440×1000, ma podpis „Scena mapy · jednostka testowa przez UnitRenderer.sync()”, używa produkcyjnego `UnitRenderer.sync()`, modelu `Wojownik`, agregowanego stanu stosu i kąta kamery 52,4°. Obraz `09` jest rzeczywistą mapą wygenerowaną przez klienta, ale przedstawia pierwszy wybór miejsca na miasto i nie zawiera wojska. W `08` niezależny pomiar pikseli przy progu `R>190, G>165, B<150` daje emblematowy pierścień **71×71 px**, gwiazdę wodza **18×17 px** i trzy osobne gwiazdki XP po **11×10 px** każda; różnice jednego–dwóch pikseli wobec raportu Operatora wynikają z przyjętego progu/antyaliasingu. Obraz potwierdza gwiazdę nad XP i większy emblemat w mapowej skali. Sam obraz nie dowodzi ilorazu 4×; ten wynika z `0.80 / 0.20` i asercji testu.

## Ograniczenia

`09-game-full-map.png` potwierdza poprawne wygenerowanie mapy i działanie pełnego UI, lecz bez Wodza/jednostki. `08-unitrenderer-map-scene.png` jest oznaczonym harness’em z produkcyjnym rendererem jednostki, nie pełnym stanem gameplay ani pełnym `buildScene` terenu. Wspólnie dają dowód kompozycji w realistycznej skali mapy, ale nie pokazują odznaki w tej samej sesji klienta na wygenerowanym świecie. `/favicon.ico` zwraca 404; raport nie wskazuje innych błędów `pageerror` ani konsoli. Brak tej ikony jest nieblokujący.

Nie wykonano operacji zmieniających stan Gita, integracji, commita, pushu ani deployu.
