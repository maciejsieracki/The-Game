# Obrona Operatora — R-WEB-DETERMINISM-DIGEST-NORMALIZE-STACKGROUP-Q1 (runda 2)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DETERMINISM-DIGEST-NORMALIZE-STACKGROUP-Q1
GOAL: digest testowy (`__detHarness.digest`) normalizowany względem stackGroupId (z Date.now); bez zmian logiki gry.
ZMIANY/COMMIT: kod gry z kandydata f5f7778fd bez zmian (src/ nietknięte w tej rundzie). Poprawka obrony: gra/tools/determinism-digest-stackgroup-test.cjs (test (e)). Raport: ten plik. SHA commita tej rundy: patrz pole sha w odpowiedzi.
TESTY (surowe wyniki z tej rundy):
- node tools/determinism-digest-stackgroup-test.cjs (NODE_PATH = esbuild z cache npx): PASS (a), PASS (b), PASS (c), PASS (d), PASS (e); "ZIELONY (5/5)", exit 0.
- Mutant A (numeracja w kolejności tablicy zamiast po id; sed na sortUnitsStable): FAIL (e) "u10 (leksykalnie pierwsze) powinno dostac g0", "CZERWONY (1 FAIL)", exit 1. Przed poprawką mutant przechodził 4/4.
- Mutant B (normalizacja cofnięta do tożsamości): FAIL (a), (c), (e), exit 1 (wynik z rundy 1, potwierdzony przy wznowieniu).
- git diff --check: czysty (exit 0).
- tsc --noEmit, 5 bramek referencyjnych, live Chromium: NIE_ZMIERZONO w tej rundzie. Zmiana dotyczy wyłącznie pliku testowego tools/*.cjs, nie kodu src/. Wyniki z f5f7778fd (tsc 0, logic 213/213, tech-tree 20/0, research 33/0, unit-replace 21/21, combat 6/6, live 2x22 tury 22/22) pochodzą z raportu Operatora i potwierdzenia Evaluatora, nie z tej rundy.
BLOKADY: brak. gra/node_modules nie istnieje w worktree (esbuild dostarczony przez NODE_PATH z cache npx); bez instalacji zależności.
RUNDY: 2/5. Poprzednia runda: Evaluator 20-evaluator-claude.md (PASS-WITH-NOTES, 2 zarzuty).

## Odpowiedź na zarzuty Evaluatora

### Zarzut 1 (drobny): test nie pokrywa stabilnego sortowania — PRZYJMUJĘ
- Dowód problemu: mutant numerujący w kolejności tablicy przechodził 4/4.
- Poprawka: dodano test (e) w determinism-digest-stackgroup-test.cjs. Dwa przypadki: id tekstowe (porównanie leksykalne, jak w module: 'u10' < 'u2') oraz id liczbowe (porównanie numeryczne, 2 < 10). W obu tablica ma kolejność inną niż kolejność sortowania.
- Dowód: prawdziwy moduł 5/5 zielony; mutant A czerwony (FAIL (e), exit 1).
- Uwaga: pierwsza wersja testu (e) miała błędne oczekiwanie (zakładała numeryczne sortowanie id tekstowych). Moduł sortuje id tekstowe leksykalnie, co jest poprawne i deterministyczne; poprawiono oczekiwanie w teście, nie moduł.

### Zarzut 2 (rozszerzenie zakresu: city.siegeArmyGroupId) — PRZYJMUJĘ jako uzasadnione (bez zmiany kodu)
- Pochodzenie pola (grep w gra/src):
  - src/main.ts:18635: `city.siegeArmyGroupId = isHuman(...) ? stackGroupIdOfAnchor(ctx.atakujacy) : undefined;`
  - src/main.ts:15461: `besiegedCity.siegeArmyGroupId = stackGroupIdOfAnchor(rep);`
  - stackGroupIdOfAnchor zwraca stackGroupId jednostki; stackGroupId powstaje w armyMerge.ts:75 z Date.now (freshStackGroupId).
- Wniosek: bez normalizacji siegeArmyGroupId identyfikator z Date.now trafiałby do digestu przez pole miasta, więc normalizacja tego pola jest wymagana dla celu tematu. Mieści się w bloku haka digestu (main.ts __detHarness.digest); nie zmienia logiki gry, armyMerge ani formatu zapisu.
- Pokrycie testem: test (c) sprawdza, że miasto dzieli indeks z armią.
- Akceptacja zakresu należy do orkiestratora.

## UWAGI-DLA-ORKIESTRATORA
- Dispatch wskazuje 00-dispatch.md w origin/main, a plik pod tą ścieżką nie istnieje (w origin/main ani w gałęzi orkiestratora). Treść zadania przyjęto z 00-dispatch-DODATEK-claude.md i z tekstu zlecenia.
- Kandydat f5f7778fd znajduje się też w worktree wf_1faf3f15-92c-1 (git branch --contains). Ten worktree został przepięty na f5f7778fd (detached) i zmieniony o poprawkę testu (e).
- Wzorzec live (Chromium) nie był uruchamiany w tej rundzie (brak zmiany src).

NASTĘPNY KROK: Evaluator weryfikuje w commicie tej rundy: mutant A czerwony, test (e) zielony; następnie Final Control.
DEPLOY/PUSH: NIE WYKONANO
