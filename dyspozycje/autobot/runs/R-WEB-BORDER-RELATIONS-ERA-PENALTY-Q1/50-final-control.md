# Final Control — R-WEB-BORDER-RELATIONS-ERA-PENALTY-Q1

**Werdykt: PASS-WITH-NOTES. Etap: 8 — Final Control. Readiness: 8/10.** Kandydat: `6fe91297886903d1f2f30e701a0b704288f386b4` (`codex/border-era-penalty`).

## Kontrola zakresu i ustaleń

- Decyzja właściciela ustala stawkę według wyższej epoki pary: Kamień −2/turę, Brąz −3/turę, Żelazo −4/turę. Parametry pozostają w `gra/data/diplomacy.json`; produkcyjny resolver wybiera stawkę z epok obu właścicieli. Tick i rozbicie czynników używają tej samej wartości, a podgląd korzysta ze wspólnego kontekstu pary.
- Zachowano istniejący warunek aktywacji: obie strony mają ponad dwa miasta i współdzielą granicę lądową. Zmiana nie dodaje czynnika dyplomatycznego ani schematu save. Przegląd allowlisty oraz diffu potwierdza, że zmiany źródłowe pozostają w `diplomacy.json`, `diplomacy.ts`, `diplomacy-factors.ts` i `main.ts`, z testami oraz artefaktami tego runu.
- Obiekcja `20-evaluator.md` dotycząca braku runtime dowodu została zamknięta dowodami w `31-operator-runtime.md` i niezależnym `40-evaluator-followup.md`: prawdziwy moduł gry wywołał kontekst pary, preview, breakdown, tick i IndexedDB save/load. Test wykazał stawki −4 dla Bronze/Iron przed i po odtworzeniu slotu, −3 dla pary Bronze/Bronze w obu kolejnościach oraz brak wiersza kary po usunięciu granicy.
- Obiekcja `40-evaluator-followup.md` dotycząca ekspozycji mutującego hooka została zamknięta przez commit `6fe9129` i niezależny raport `42-evaluator-gating.md`. Hook jest przypisywany tylko przy `civTest=1`; raport `41-gating-defense.md` dokumentuje brak hooka po zwykłym boot oraz jego dostępność i pełny gate po boot z flagą. Diff tego commita ogranicza się do warunku ekspozycji, testu gate'a i raportu dowodowego.
- Raporty `20` i `40` zachowują historyczny status BLOCK; kolejne raporty wykazują zamknięcie ich konkretnych obiekcji. Nie znalazłem otwartej blokady w zarejestrowanym zakresie.

## Dowody i ograniczenia

- Raporty operatora i niezależnego evaluatora podają: test logiki PASS, 39/39; `npm run typecheck` PASS; `git diff --check` PASS. Raport `42` potwierdza niezależne powtórzenie testu 39/39 i typechecku. Final Control nie powtarzał ciężkiego testu Chromium: gate po poprawce jest udokumentowany w `41`, a `42` świadomie nie uruchamiał go ponownie, ponieważ ostatni diff dotyczył wyłącznie flagi testowej.
- Runtime używa kontrolowanego fixture z istniejącymi ownerami AI i miastami; sprawdza rzeczywistą logikę i zapis/odczyt, ale nie mierzy organicznego przebiegu wieloturowej kampanii. Gate weryfikuje wartość preview oraz breakdown, nie tekst renderowany w panelu przez screenshot lub DOM. To ogranicza zakres dowodu, lecz nie pozostawia zgłoszonej blokady implementacyjnej.
- OSTRZEŻENIA WebGL i pojedynczy 404 zasobu są odnotowane w raportach runtime; błędów strony nie zgłoszono.

## Decyzja

Kandydat jest gotowy do przekazania do integracji, z udokumentowanym wynikiem Final Control. Ocena 8/10 odzwierciedla zamknięcie obu niezależnych obiekcji i ograniczenia kontrolowanego fixture oraz brak ponownego Chromium po zmianie samej bramki. Ten raport nie zatwierdza wdrożenia ani publikacji.

Nie zmieniano źródeł, testów, stage ani commita; utworzono wyłącznie ten Final Control. Bez push, merge i deploy.
