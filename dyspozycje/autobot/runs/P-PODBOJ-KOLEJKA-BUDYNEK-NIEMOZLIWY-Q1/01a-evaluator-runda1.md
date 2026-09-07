# P-PODBOJ-KOLEJKA-BUDYNEK-NIEMOZLIWY-Q1 — Evaluator, runda 1/5

**Uwaga proceduralna:** agent Evaluator zwrócił kompletną treść tego raportu przez
StructuredOutput, ale proces zakończył się przed zapisaniem/zacommitowaniem pliku na dysku.
Orkiestrator odtwarza ten raport z zarejestrowanej treści zwrotnej agenta, bez zmiany
choćby jednego znaku, i commituje w jego imieniu.

STATUS: FAIL
DOMAIN: GAME
TEMAT: P-PODBOJ-KOLEJKA-BUDYNEK-NIEMOZLIWY-Q1
GOAL: W obu miejscach przejęcia miasta (`gra/src/main.ts`) usunąć z kolejki budynki `lokalizacja:'stolica'` niemożliwe do dokończenia przez zdobywcę, zwracając zebraną Pracę do puli zdobywcy (nie starego właściciela), zero regresji na legacy-jednostkach.

ZMIANY-COMMIT: Zweryfikowane niezależnie — `git diff origin/main --stat` na `747a69b2` pokazuje wyłącznie 4 pliki: `gra/src/main.ts` (+47/-2, oba bloki: kapitulacja ~13385-13412, podbój ~26953-26981), nowa bramka `gra/tools/podboj-kolejka-budynek-niemozliwy-test.cjs` (+291), `00-dispatch.md`/`01-operator.md` w katalogu runu. `gra/src/game/production.ts` bez zmian — zgadza się z raportem. Zero zmian poza allowlistą. Linie `setOwnerPracaPool(oldOwner, ...)` (13386, 26933-okolica) potwierdzone nietknięte (dokładnie 2 wystąpienia, grep).

TESTY (własne uruchomienia, worktree `/home/user/wt-kolejka-podboj`):
- Nowa bramka `podboj-kolejka-budynek-niemozliwy-test.cjs`: **69 passed, 0 failed** — potwierdzone.
- `npx tsc --noEmit`: **czysto** — potwierdzone.
- 5 bramek referencyjnych: `logic-test` 213/213, `tech-tree-test` 19/19, `research-test` 33/33, `unit-replace-test` 13/13, `combat-test` 6/6 — wszystkie zielone, potwierdzone.
- Cała rodzina (grep z GOAL): `ai-city-capture-integration-test` 14 OK, `ai-production-priority-test` 9/9, `capital-capture-test` 86/86, `capital-sep-pangea-test` 3/3, `capital-sep-unit-test` 36/36, `march-attack-queue-persist-test` 57/57, `panel-kolejka-pasek-postepu-test` 82/82, `post-capture-law-test` 25/25, `production-overflow-test` 201/201, `religia-konwersja-po-podboju-test` 12/12 — wszystkie zgodne z raportem.
- Dwa zgłoszone przedistniejące FAIL potwierdzone NIEZALEŻNIE (własny tymczasowy `git worktree add --detach` na commicie bazowym `9f90cea7`, nie `git stash` operatora): `barb-city-capture-cluster-test` 92/1 identycznie na bazie, `building-queue-refund-test` 2/3 identycznie na bazie — **potwierdzam: nieregresyjne, poza zakresem tego tematu**.
- Brzegowy przypadek "zdobyte miasto = nowa stolica zdobywcy": zbudowałem WŁASNY scenariusz end-to-end (nie kopię operatora), używając PRAWDZIWEGO `applyCityCaptureAfterBattle` (post-battle-map.ts) + PRAWDZIWEGO `capitalCityIdForOwner`+`oldestCityOfOwner` (main.ts/capital-capture.ts, nie mock jak w bramce operatora) — **5/5 zielone**, potwierdza brzegowy przypadek działa poprawnie na realnym kodzie, nie tylko na uproszczonym mocku operatora.
- Reguła przeciw samooszukiwaniu (kolejka z ≥2 budynków-stolica naraz): zbudowałem WŁASNY test — patrz ZARZUT 1 niżej. **Wykryto realny defekt.**

BLOKADY: Dwa przedistniejące FAIL potwierdzone jako niezależne od tej zmiany (jak wyżej) — nie blokują tego GOAL, zgodnie z raportem operatora.

RUNDY: 1/5

NASTĘPNY KROK: Obrona (Operator, ten sam worktree/gałąź) — odpowiedź na ZARZUT 1 z dowodem z wytworu.

DEPLOY-PUSH: NIE WYKONANO

ZARZUTY:

1. **Naruszenie GOAL/ECHO ("Cała nadwyżka powinna trafić do głównej puli") w scenariuszu z WIĘCEJ NIŻ JEDNYM budynkiem-stolica naraz w kolejce — dokładnie ten przypadek, który dyspozycja nakazywała sprawdzić ("Palac po Mennicy"), a którego bramka operatora w ogóle nie testuje (każdy z jej scenariuszy A/B/C/D używa kolejki jednoelementowej).**
   Miejsce: `gra/src/main.ts`, oba nowe bloki (kapitulacja ~linia 13401-13412, podbój ~linia 26963-26979), które opierają się na współdzielonej `filterQueue()` z `gra/src/game/production.ts:1479-1508`.
   Defekt: gdy w kolejce jest ≥2 budynków `lokalizacja:'stolica'`, a DRUGI (nie-frontowy) z nich niesie WŁASNY zbankowany `item.postep > 0` (stan realnie osiągalny w grze — bankowanie dzieje się w `promoteToFront()`, wołanym z UI reorderu kolejki w `cityPanel.ts`/`empireDetailPanel.ts`, gdy gracz cofnie budynek z frontu) — `filterQueue()` poprawnie USUWA oba budynki z kolejki, ale do puli zdobywcy trafia WYŁĄCZNIE `prod.postep` frontu (pierwszego budynku). Zbankowany `item.postep` drugiego budynku znika bezpowrotnie — nie trafia ani do zdobywcy, ani do starego właściciela.
   Dowód (własny, odtwarzalny test, nie hipoteza): kolejka `[mennica (front, prod.postep=37), palac (item.postep=20)]`, zdobywca ma już inną stolicę → oba budynki usunięte (kolejka.length=0, poprawnie), ale `ownerPracaPool(zdobywca)` = **37**, nie 57. Zweryfikowane identycznie dla obu bloków (kapitulacja i podbój bojowy).
   Dlaczego ma znaczenie: to dosłownie scenariusz z GENEZY dyspozycji ("Cała nadwyżka powinna trafić do głównej puli") i z jej własnej "REGUŁY PRZECIW SAMOOSZUKIWANIU" — punkt explicite nakazany do zweryfikowania, którego bramka operatora nie pokrywa w żadnym z 69 asercji.
   Zastrzeżenie na rzecz Obrony: sam mechanizm "tylko front ma `forfeitedPostep`" jest własnością WSPÓLNEJ, przedistniejącej funkcji `filterQueue()` (używanej też przez precedens-filtr cudów) — możliwe, że ten sam brak dotyczy też filtra cudów i jest poza `gra/`-allowlistą tego tematu do naprawienia w `production.ts`. Nie zwalnia to jednak z odpowiedzi: GOAL tego tematu explicite obiecuje "całą nadwyżkę", a dyspozycja explicite kazała przetestować wielo-budynkowy przypadek — obrona powinna albo naprawić (dopisać sumowanie zbankowanego `item.postep` usuwanych nie-frontowych pozycji budynków-stolica w nowym filtrze, w allowlistowym `production.ts` lub lokalnie w obu blokach `main.ts`), albo wskazać dowodem z wytworu, że to świadomie zaakceptowane ograniczenie dziedziczone z precedensu i skierować do `DO DECYZJI CZŁOWIEKA`.
