STATUS: PASS-WITH-NOTES
DOMAIN: GAME (UI/tekst, prezentacja utrzymania)
TEMAT: R-WEB-UI-GARRISON-UPKEEP-TOOLTIP-EXPLAIN-Q1 (GARNTIP), obrona Operatora, runda 1 (odpowiedz na zarzuty Evaluatora 55edbe7e0)
GOAL: podpowiedz „baza X × mnożnik silnika Y = Z” na każdym miejscu, gdzie gracz widzi utrzymanie złotem budynku i baza ≠ wynik; dane bez zmian.
BAZA: 0f15c6fc716cc7619a54585282e5b881f666e0ea (kandydat Operatora), poprawki w tym raporcie.

ZMIANY/COMMIT:
- Commit kodu obrony: 1d6a4406a8cb75db74eb4f4a35ed906d60c4726a (3 pliki, 25 dodań / 18 usunięć względem 0f15c6fc7).
- gra/src/ui/cityPanel.ts: stopka karty budynku (.bld-infocard-upkeep) dostaje title z buildingUpkeepExplanation(buildingUpkeepBreakdown(def, 1)) (fallback: dotychczasowy „Utrzymanie co turę”); wiersz „Utrzymanie (co turę)” karty szczegółowej dostaje hint przez nowy opcjonalny parametr gridDetailRow(..., hint?).
- gra/src/game/economy-upkeep.ts: JSDoc oryginalnego buildingUpkeep wrócił nad funkcję buildingUpkeep (wcześniej wisiał nad interfejsem BuildingUpkeepBreakdown). Logika bez zmian.
- gra/tools/garrison-upkeep-tooltip-explain-test.cjs: w części F dopisane 3 asercje na nowe ścieżki (stopka, gridDetailRow, wiersz szczegółowy).
- Raport: dyspozycje/autobot/runs/R-WEB-UI-GARRISON-UPKEEP-TOOLTIP-EXPLAIN-Q1/30-obrona-claude.md (ten plik).

ODPOWIEDZI NA ZARZUTY:
- Zarzut 1 (zakres niepełny, cityPanel:7376-7381 i :7938-7942): PRZYJMUJĘ. Dowód: obie ścieżki pokazują buildingUpkeepDisplay(def,1) bez hintu; po poprawce wyjaśnienie jest w obu (commit 1d6a4406a). Dowód testowy: asercje F w teście (patrz TESTY).
- Zarzut 2 (część F to regexy po źródle, bez DOM): ODRZUCAM w części dotyczącej wykonania. Dowód: test nie ma wymogu wykonania DOM w dispatchu (wymagana jest weryfikacja wizualna, której nie wykonano — patrz zarzut 5); regexy są celowo nazwane i mutacje je wykrywają: po usunięciu `if (hint) vEl.title = hint;` test daje 27 OK / 1 FAIL („gridDetailRow przyjmuje hint -> title wartosci”); wcześniej M2–M4 dawały 24 OK / 1 FAIL. Ograniczenie zostaje udokumentowane jako NIE ZMIERZONO (DOM).
- Zarzut 3 (zmiana w silniku przy „Tylko prezentacja”): ODRZUCAM z dowodem. Zmiana w economy-upkeep.ts nie zmienia wyniku: buildingUpkeep zwraca breakdown.total, a ten sam wzór (floor(floor(raw×FALA2)×era)) jest zachowany. Dowody: test E (buildingUpkeep === breakdown.total dla wszystkich budynków): 0 rozjazdów; upkeep-test 91 passed, 0 failed; building-upkeep-ceramics-test 645 passed, 0 failed; budynek-garnizon-test 83 pass, 0 fail. Alternatywa (duplikacja wzoru w UI) złamałaby wymóg „X, Y, Z z tych samych stałych/funkcji co silnik”. Uwaga: treści dispatchu nie udało się odczytać z gałęzi (patrz UWAGI); decyzję zostawiam orkiestratorowi/Final Control.
- Zarzut 4 (zahardkodowane „Pieniądza/turę”): ODRZUCAM. Dowód: atrybut title przyjmuje wyłącznie zwykły tekst, bez ikon, więc ikony surowców nie mają tu zastosowania; to samo słowo występuje w istniejącym tekście gry: cityPanel.ts (wiersz „Przyrost utrzymania”) — `pkt Pieniądza ${cityPanelChipIconWrap('res-treasury', 14)}`. Podpowiedź ma tę samą formę co pozostałe teksty gry.
- Zarzut 5 (brak weryfikacji w Chromium): PRZYJMUJĘ jako ograniczenie, NIE naprawiam w tej rundzie. Stan: NIE ZMIERZONO. Chromium jest w systemie (/usr/bin/chromium), ale uruchomienie gry w gra/ wymaga npm run dev/build, co jest zakazane w tym temacie; zrzut tooltipu wymaga osobnej decyzji orkiestratora.

TESTY (surowe liczby z wyjścia):
- npm ci --ignore-scripts w gra/ (świeży worktree): 71 pakietów, bez błędów.
- npx tsc --noEmit -p tsconfig.json: TSC_EXIT=0 (po poprawce).
- node tools/garrison-upkeep-tooltip-explain-test.cjs: 28 OK, 0 FAIL (było 25 OK w kandydacie; +3 asercje F).
- Mutacja (usunięty `if (hint) vEl.title = hint;` w kopii cityPanel.ts, test uruchomiony na zmienionym pliku): 27 OK, 1 FAIL („cityPanel: gridDetailRow przyjmuje hint -> title wartosci”); plik przywrócony z kopii, grep potwierdza jedną linię `if (hint) vEl.title = hint;`.
- upkeep-test: 91 passed, 0 failed.
- budynek-garnizon-test: 83 pass, 0 fail.
- building-upkeep-ceramics-test: 645 passed, 0 failed.
- Dług bazowy (nie z tej zmiany, potwierdzony w kandydacie przez Operatora i Evaluatora): building-upkeep-resources-test D10 (1 FAIL), citizen-resource-upkeep-test (2 FAIL, kotwice w main.ts). Nie uruchamiałem ponownie w tej rundzie — stan jak w 10-operator-claude.md.
- Weryfikacja w przeglądarce (Chromium, zrzut tooltipu, stopka karty, wiersz szczegółowy): NIE ZMIERZONO.

BLOKADY: brak blokad kodowych. Brak weryfikacji wizualnej w przeglądarce (NIE ZMIERZONO).

RUNDY: 1/5 (obrona r1; Evaluator decyduje o kolejnej rundzie).

UWAGI-DLA-ORKIESTRATORA:
- origin/main nie zawiera pliku 00-dispatch.md ani 00-dispatch-DODATEK-claude.md dla tego tematu (git show zwraca fatal). Plik 00-dispatch.md jest tylko na origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0 (wg Evaluatora); plik DODATEK nie istnieje na żadnej z pobranych gałęzi. Zakres oparty na opisie z rozkazu Workflow i treści zarzutów.
- Nowe ścieżki (stopka i wiersz szczegółowy) są teraz objęte; reszta cityPanel (inne miejsca wyświetlające utrzymanie) nie była sprawdzana poza zarzutami.
- Decyzja do Final Control: czy zmiana economy-upkeep.ts (refaktor bez zmiany wyniku) jest dopuszczalna przy zakazie „tylko prezentacja”.
- Dług: wyjaśnienie wiąże się z mnożnikiem ery; dla epok > 1 mnożnik Y to iloczyn FALA2×era (test D).

NASTĘPNY KROK: Evaluator (SONNET): przegląd commitu 1d6a4406a; ewentualna weryfikacja w Chromium (stopka karty, wiersz „Utrzymanie (co turę)”, lista miasta).
DEPLOY/PUSH: NIE WYKONANO
