# R-RELIGIA-KONWERSJA-PO-PODBOJU-Q1 — Obrona, runda 1/5

**Uwaga proceduralna:** agent Operator (obrona) zwrócił kompletną treść tego raportu przez
StructuredOutput, ale proces zakończył się przed zapisaniem/zacommitowaniem pliku raportu na
dysku (kod i bramka zostały zacommitowane jako `7848814d`). Orkiestrator odtwarza ten raport
z zarejestrowanej treści zwrotnej agenta, bez zmiany choćby jednego znaku, i commituje w
jego imieniu.

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RELIGIA-KONWERSJA-PO-PODBOJU-Q1
GOAL: `onCityCapturedReligion` jako wierny odpowiednik `onCityCapturedCulture` (inwersja `1-prevShare` przełożona na `counts`), wywołanie bezwarunkowe z `main.ts`, dowód że `convertViaTemple` rusza po naprawie.
ZMIANY-COMMIT: `7848814d` (worktree `/home/user/wt-religia`, gałąź `autobot/R-RELIGIA-KONWERSJA-PO-PODBOJU-Q1`, baza `1217bf16`) — 2 pliki w allowlistcie: `gra/src/game/culture-religion.ts` (redystrybucja `remaining` w `onCityCapturedReligion`, linie ~789–830), `gra/tools/religia-konwersja-po-podboju-test.cjs` (3 nowe scenariusze regresyjne). `main.ts`/wywołanie bezwarunkowe nietknięte w tej rundzie (nie było przedmiotem zarzutów).
TESTY: `tsc --noEmit` czysto. `religia-konwersja-po-podboju-test.cjs` 9→12/12 (dodane: 5-religii-w-counts, 5-kluczy-nierówne-wagi, previousOwnerReligion=null+counts-pusty). Niezależna reprodukcja obu scenariuszy z zarzutów Evaluatora (esbuild-bundle, poza bramką) potwierdza naprawę: scenariusz zarzutu 1 (`before={counts:{keltyzm:2,a:1,b:1,c:1,d:1}}`, population=6) → `after={a:1,b:1,rzym_bogowie:4}`, suma=6=populacja (przed naprawą: suma=7). Scenariusz zarzutu 2 (`before={counts:{}}`, population=100, previousOwnerReligion=null) → `after={rzym_bogowie:100}`, suma=100=populacja (przed naprawą: suma=50, fałszywa 100% dominacja zamiast 50%). Dodatkowy stres-test (5 kluczy, nierówne wagi 10/37/41/53/29) — suma zachowana, brak ujemnych. Cała rodzina bramek Evaluatora ponownie zielona bez zmian: `culture-religion-test` 65/0, `logic-test` 213/213, `tech-tree-test` 19/19, `research-test` 33/33, `unit-replace-test` 13/13, `combat-test` 6/6, `ai-city-capture-integration-test` 14, `empire-religia-panel-coverage-test` 15/15, `post-capture-law-test` 25/0, `capital-capture-test` 86/86.
BLOKADY: brak.
RUNDY: 1/5 (runda 2 tej odpowiedzi zamyka rundę 1 Evaluatora)
NASTĘPNY KROK: Evaluator, weryfikacja naprawy formuły redystrybucji (Hamilton) i jawnej gałęzi fallback.
DEPLOY-PUSH: NIE WYKONANO

OBRONA:
1. → PRZYJMUJE. Zastąpiłem schemat "ostatni klucz dostaje resztę" metodą największej reszty (Hamilton): `floor` udziału proporcjonalnego dla każdego klucza, potem dosypanie brakujących jednostek do `remaining` kluczom z największą częścią ułamkową (remisy rozstrzygane alfabetycznie dla determinizmu). Gwarantuje sumę dokładnie `remaining`, zero ujemnych, niezależnie od liczby "trzecich" religii. Reprodukcja zarzutu (5 religii, population=6) po naprawie daje sumę=6 (było 7). Dodano 2 nowe testy regresyjne w bramce (4 "trzecie" religie oraz 5 kluczy o nierównych wagach jako stres na remisy ułamkowe).

2. → PRZYJMUJE. Dodałem jawną gałąź `!previousOwnerReligion && othersTotal<=0 && remaining>0`, która przypisuje `remaining` nowemu właścicielowi (konserwatywnie, analogicznie do zachowania SAME-okręgu) zamiast ciche porzucenie. Reprodukcja zarzutu (`counts={}`, population=100, `previousOwnerReligion=null`) po naprawie daje sumę=100=populacja, a udział zdobywcy poprawnie wychodzi 100% wobec faktycznie obecnych w `counts` danych (brak fałszywej dominacji 50/50 zamiast 50/100 — bo teraz `counts` faktycznie sumuje się do pełnej populacji, nie do połowy). Dodano test regresyjny w bramce.

Pliki zmienione (ścieżki absolutne):
- `/home/user/wt-religia/gra/src/game/culture-religion.ts`
- `/home/user/wt-religia/gra/tools/religia-konwersja-po-podboju-test.cjs`
