TEMAT: H-BUDYNKI-KOSZT-PRACY-50-Q1
RUNDA: 1/5
DATA: 2026-09-08
DOMAIN: GAME
ŚCIEŻKA: B (prompt)
MODEL + EFFORT per rola: Operator gpt-5.6-luna / high; Evaluator gpt-5.6-luna / high; Final Control gpt-5.6-luna / high

## WYZWALACZ
Jednoznaczna decyzja właściciela przekazana w głównym czacie: obniżyć koszt Pracy budowy wszystkich budynków o 50%, co ma podwoić tempo produkcji, bez zmiany kosztów surowców. Przed dispatch sprawdzono `origin/main`, rejestr po ID/funkcjach oraz otwarte PR-y; nie znaleziono duplikatu tego pełnego ID ani otwartego PR o tym celu. Istniejące tematy o podziale Pracy i AI budynkach są odrębne i nie zmieniają tego zakresu.

## GOAL
Obniżyć efektywny koszt Pracy budowy każdego budynku o 50% względem aktualnego `origin/main` (podwoić tempo produkcji), zachowując identyczne wartości `koszt_surowce` dla wszystkich budynków.

## DIAGNOZA PRZED ZMIANĄ
Źródłem prawdy rekordów budynków jest `gra/data/buildings.json`: pola `kosztBudowy` (poziom 1), `przyrostKosztu` (liniowy przyrost per poziom) oraz `koszt_surowce` (niezależny koszt magazynowy). `gra/src/game/production.ts::itemCost()` wylicza bazowy koszt Pracy z dwóch pierwszych pól, a `buildingWorkCost()` nakłada modyfikatory. Na świeżym `origin/main` `buildingWorkCost()` ma `GLOBAL_BUILDING_PROD_MULT=0.5` oraz jednocześnie mnożniki `R_STAWKI_KOSZT_MULT=2` i `R_STAWKI_FALA2_MULT=2`, czyli efektywnie 2.0× rekord JSON przed pozostałymi, niezależnymi modyfikatorami. Aby spełnić cel względem aktualnego stanu bez dotykania globalnych mnożników jednostek/badań/racji ani danych surowcowych, zmiana ma dotyczyć wyłącznie globalnego mnożnika kosztu budynków w `buildingWorkCost` (0.5 → 0.25), dając 1.0× rekord JSON i dokładnie połowę obecnego kosztu w neutralnych warunkach. Koszty surowców pozostają w `gra/data/buildings.json` bitowo niezmienione.

## KRYTERIA KOŃCA — binarne PRAWDA/FAŁSZ
1. PRAWDA: wszystkie 42 rekordy z `buildings.json`, na każdym zdefiniowanym poziomie, mają koszt Pracy równy dokładnie 50% wartości z bazowego `origin/main` w neutralnym trybie; gate: nowy `gra/tools/budynki-koszt-pracy-50-test.cjs`, asercja pełnego pokrycia ID/poziomów i oczekiwanych kosztów.
2. PRAWDA: `koszt_surowce` wszystkich 42 budynków jest identyczny względem bazy `origin/main`; ta sama bramka wykonuje porównanie snapshotu surowców.
3. PRAWDA: test nie jest tautologiczny — kontrolna mutacja źródła (zmiana mnożnika budynków w kopii źródła) musi zakończyć gate kodem niezerowym; wynik zostanie zapisany w raporcie.
4. PRAWDA: dokładny typecheck `npx tsc --noEmit` przechodzi na projektowym TypeScript 5.9.3.
5. PRAWDA: temat nie powoduje regresji w 5 bramkach referencyjnych: `logic-test.cjs` 213/213, `tech-tree-test.cjs` 19/19, `research-test.cjs` 33/33, `unit-replace-test.cjs` 13/13, `combat-test.cjs` 6/6.
6. PRAWDA: diff zawiera wyłącznie allowlistę poniżej; brak zmian w kosztach surowców, `WERSJE.md`, rejestrach, pytaniach otwartych, handoffach i `gra-robocza/**`.

NOWE sprawdzenie tematu: `gra/tools/budynki-koszt-pracy-50-test.cjs` — pełna macierz wszystkich budynków/poziomów, snapshot `koszt_surowce`, kontrola mutacyjna. Istniejące bramki referencyjne są uruchamiane wyłącznie defensywnie i nie liczą się do progu podziału.

## ALLOWLISTA — nic poza tym
- `gra/src/game/production.ts` — wyłącznie mnożnik/komentarz kosztu Pracy budynków.
- `gra/tools/budynki-koszt-pracy-50-test.cjs` — nowa bramka regresji tematu.
- `dyspozycje/autobot/runs/H-BUDYNKI-KOSZT-PRACY-50-Q1/00-dispatch.md` — ten dispatch.
- `dyspozycje/autobot/runs/H-BUDYNKI-KOSZT-PRACY-50-Q1/01-operator.md` — raport Operatora.
Zakazane: `gra/data/buildings.json` i wszystkie inne dane gry (w szczególności `koszt_surowce`), `WERSJE.md`, `REJESTR-PROSB-I-ZADAN.md`, `PYTANIA-OTWARTE.md`, handoffy, `gra-robocza/**`, `playbook.json`, build/dev przez npm, push, merge, deploy.

## IZOLACJA
Repozytorium `/root/projects/The-Game`, świeża gałąź `hermes/H-BUDYNKI-KOSZT-PRACY-50-Q1` utworzona bezpośrednio z pobranego `origin/main` (`git fetch origin`). Praca wyłącznie na tej gałęzi; baza: `origin/main`. `gra/node_modules` pozostaje lokalnym, gitignored prerequisite'em; nie jest commitowany.

## REGUŁA PRZECIW SAMOOSZUKIWANIU
Nie uznawać zmiany mnożnika za dowód kompletności. Bramka musi enumerować rekordy bez listy ręcznie wybranych budynków, sprawdzać wszystkie poziomy oraz porównać `koszt_surowce` do niemutowanej migawki bazy. Dodatkowo uruchomić gate z mutacją kopii źródła i wymagać czerwonego wyniku; test, który przechodzi po zmianie produkcyjnego mnożnika, jest nieważny.

## PROCEDURA NAPRAWCZA PRZY FAIL
Evaluator wskazuje ponumerowany zarzut z dokładnym plikiem/liną i jedną poprawką. Operator odpowiada dowodem z wytworu; poprawka pozostaje na tej samej gałęzi i ID. Po piątej negatywnej rundzie nie uruchamiać rundy 6 — `LIMIT-5-EXCEEDED` i decyzja orkiestratora/właściciela.

## GRANICE (naruszenie = FAIL)
Obowiązuje `R-PROC-AUTOBOT.md` §9: żadnego `npm run build` ani `npm run dev` w `gra/`, żadnego `git add -A`/`git add .`, żadnych sekretów, żadnych zmian poza allowlistą, żadnego merge/push/deploy. Koszty surowcowe są osobnym kontraktem i muszą pozostać identyczne. Operator nie wykonuje Evaluatora, Final Control, integracji ani publikacji.

## PLAN TESTÓW
1. Zabezpieczyć i zweryfikować bazę: `git log -1`, `git status --short`, wersja `npx tsc --version` = 5.9.3.
2. Najpierw napisać nową bramkę i uruchomić ją na stanie bazowym (oczekiwany RED względem celu), następnie zmienić wyłącznie mnożnik produkcyjny i uzyskać GREEN.
3. Uruchomić mutację kopii źródła; gate ma być RED, a kopię odtworzyć przez zapis kopii, nie `git checkout`, po czym sprawdzić `git diff --quiet` dla pliku.
4. Uruchomić `npx tsc --noEmit`, gate tematu oraz pięć bramek referencyjnych z katalogu `gra/`.
5. Przed raportem sprawdzić allowlistę, `git diff --check`, status, statystyki diffu i SHA commita. Nie używać `npm run build`/`npm run dev`.

## OBIEG
Operator → niezależny Evaluator → niezależny Final Control → integracja orkiestratora → READY_FOR_DEPLOY → osobna autoryzacja deploy/push. Operator kończy na przygotowanej gałęzi i raporcie; `DEPLOY/PUSH: NIE WYKONANO`.
