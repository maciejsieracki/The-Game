# 00-dispatch — R-STARTOWE-JEDNOSTKI-WSZYSTKIE-OSIE-Q1

STATUS: READY
ROLE: Operator
TEMAT: R-STARTOWE-JEDNOSTKI-WSZYSTKIE-OSIE-Q1
TRIGGER: korekta właściciela z 2026-09-13 po wykryciu użycia niewłaściwego, wygenerowanego przeze mnie Excela; obowiązuje wyłącznie drugi arkusz przesłany przez właściciela
PROFILE: the-game-bugs
BOARD: the-game-bugs
TENANT: the-game-bugs
PROJECT: the-game
PROCESS_PHASE: operator
ROUND: 1
ATTEMPT: 1
IDEMPOTENCY_KEY: R-STARTOWE-JEDNOSTKI-WSZYSTKIE-OSIE-Q1:operator:20260913
BASE_HEAD: ff9ce26a663c53c9f711e50536eb10f59dc4b70b
BRANCH: hermes/R-STARTOWE-JEDNOSTKI-WSZYSTKIE-OSIE-Q1
WORKTREE_KIND: worktree
WORKTREE: /home/ubuntu/projects/The-Game-worktrees/R-GRACZ-STARTOWE-JEDNOSTKI-TRUDNOSC-Q1
MODEL: gpt-5.6-luna
PROVIDER: openai-codex
EFFORT: high
AUTHORITATIVE_INPUT: /home/ubuntu/.hermes/attachments/The-Game-startowe-jednostki-do-korekty.xlsx
AUTHORITATIVE_INPUT_SHA256: e04a427c5f761b19471b11855a236f280949b9b3be04682c09fcec2f03739cce

## GOAL
Doprowadzić kod startowych jednostek do zgodności z właściwym arkuszem właściciela dla wszystkich czterech osi, zachowując rozdzielenie gracza, głównego AI, obcych państw-miast i państw-miast typu gracza.

## KONTRAKT Z WŁAŚCIWEGO EXCELA
- Gracz, zależnie od głównej trudności gry: `easy=2`, `normal=1`, `hard=0`.
- Główna cywilizacja AI, zależnie od głównej trudności gry: dodatkowe jednostki `easy=0`, `normal=1`, `hard=2`; na hard pozostaje także `+1` dodatkowe miasto, a przy braku legalnego miejsca obowiązuje istniejący zamiennik jednostkowy.
- Obce państwo-miasto, zależnie od głównej trudności gry: `easy=2`, `normal=1`, `hard=0`.
- Państwo-miasto typu gracza, zależnie wyłącznie od ustawienia trudności państw-miast: `easy=0`, `normal=1`, `hard=2`; główna trudność gry nie może tego zmieniać.

## BINARNE KRYTERIA
- [ ] W kodzie i testach znaleziono wszystkie cztery ścieżki oraz ich rzeczywiste miejsca wywołania.
- [ ] Wartości gracza są dokładnie `2/1/0` dla easy/normal/hard i dotyczą tylko pierwszego miasta każdego ownera/fotela.
- [ ] Wartości głównego AI są dokładnie `0/1/2` dodatkowych jednostek, a hard zachowuje `+1` dodatkowe miasto i istniejący fallback jednostkowy przy braku legalnego heksu.
- [ ] Wartości obcych państw-miast są `2/1/0` i nie zostały pomieszane z osią państw-miast typu gracza.
- [ ] Wartości państw-miast typu gracza są `0/1/2` z osobnego suwaka i pozostają niezależne od głównej trudności.
- [ ] Testy sprawdzają wszystkie cztery osie oraz brak cross-talku między nimi; test gracza nie utrwala starego `1/2/3`.
- [ ] Rzeczywisty scenariusz pierwszego miasta gracza/fotela potwierdza liczbę spawnowanych jednostek, nie tylko wynik funkcji pomocniczej.
- [ ] Typecheck i dostępne testy obszaru przechodzą; wynik środowiskowy jest oddzielony od produktu.
- [ ] Zmiany pozostają w allowliście, bez pushu, PR, merge i deployu.

## ALLOWLISTA ZMIAN
- `gra/src/game/ai-difficulty-bonus.ts`
- `gra/src/game/ai.ts`
- `gra/data/ai-params.json`
- `gra/src/main.ts` — tylko jeśli audyt wykaże konieczną poprawkę wiring/guardu; w przeciwnym razie bez zmian
- `gra/tools/ai-difficulty-bonus-test.cjs`
- `gra/tools/starting-army-first-city-live-test.cjs`
- `gra/tools/city-state-start-units-test.cjs` — tylko jeśli test nie odzwierciedla właściwego kontraktu
- `gra/tools/city-state-start-units-live-test.cjs` — tylko jeśli test nie odzwierciedla właściwego kontraktu
- `dyspozycje/autobot/runs/R-STARTOWE-JEDNOSTKI-WSZYSTKIE-OSIE-Q1/**`

## ZAKAZY
Nie używać mojego wcześniejszego pliku `/home/ubuntu/The-Game-startowe-jednostki-do-korekty.xlsx` jako źródła. Nie zmieniać innych bonusów trudności, balansu walki, produkcji, mapy ani nazw; nie zmieniać ustawienia trudności państw-miast tak, aby zależało od głównej trudności; nie nadpisywać cudzych worktree; nie używać reset/clean/stash/rebase/force-push; nie wykonywać push/PR/merge/deploy; nie edytować `WERSJE.md`, `KANAL-PRACA.md`, `HANDOFF-AKTUALNY.md` ani `gra-robocza/**`.

## ANTY-SAMOOSZUKIWANIE
Przed zmianą zapisać odczyt właściwego Excela i aktualnych wartości kodu. Po zmianie uruchomić test mutacyjny, który czerwienieje po przywróceniu `1/2/3` dla gracza, oraz testy rozdzielające ownera gracza, główne AI, obce państwo-miasto i państwo-miasto typu gracza. Nie uznawać komentarza ani raportu za dowód bez odczytu kodu i wyniku testu.

## PROCEDURA NAPRAWCZA
Najpierw reprodukcja rozbieżności na świeżym HEAD, potem minimalna zmiana źródła konfiguracji/helpera i testów. Jeżeli Excel nie rozstrzyga szczegółu implementacji, zachować istniejące zachowanie poza tabelą i zapisać `DECISION_REQUIRED`; nie dopowiadać wartości.

## ARTEFAKTY
Wymagane: `01-operator.md`, `01-operator-evidence.md`, `progress.json`, journal i transition receipt w tym katalogu. Raport ma podać pełny HEAD, branch, worktree, hash właściwego Excela, wszystkie cztery tabele wynikowe, komendy/testy, realny diff i następny etap Evaluator.

PUSH/MERGE/DEPLOY: NIE WYKONANO
