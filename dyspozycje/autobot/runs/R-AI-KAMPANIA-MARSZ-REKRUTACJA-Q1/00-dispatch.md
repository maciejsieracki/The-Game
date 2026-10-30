# Dispatch — R-AI-KAMPANIA-MARSZ-REKRUTACJA-Q1

## Cel
Niezależnie od wdrożonego cyklu pięciu tur zbiórki ustalić, czemu AI w zgłoszonej wojnie czasem po wymarszu stoi na własnym terytorium, nie wykorzystuje dostępnych ruchów lub nie dochodzi do ataku. Sprawdzić także nowe jednostki z rekrutacji i priorytet trasy morskiej po technologii Żeglugi. Nie zakładać, że wcześniejszy PASS testu syntetycznego dowodzi poprawnego zachowania na naturalnej mapie.

## Oczekiwany kontrakt
- Po pięciu pełnych turach zbiórki cała przypisana armia wyrusza w następnej turze i zużywa dostępny ruch na osiągalnej trasie.
- Cel to najbliższa osiągalna stolica; po odblokowaniu Żeglugi należy uwzględniać i preferować trasę morską zgodnie z dotychczasową decyzją właściciela.
- Jednostki rekrutowane w panelu armii mają zachować jawnie ustawione zachowanie „Idź do wodza”; nie zmieniać istniejącego przełącznika globalnego ani indywidualnego.

## Zakres operatora
1. Odtworzyć zgłoszony symptom na bieżącym main z produkcyjnym end-turn executor, naturalną mapą i realnym rosterem; co najmniej jeden lądowy oraz jeden morski/technologiczny wariant.
2. Sprawdzić rozkaz, wynik executora, zmianę pozycji, ruch pozostały, stan kampanii i cel na kolejnych turach. Rozdzielić „nie dostał rozkazu”, „noPath”, „ruch zablokowany” i „przeciwnik/tryb końca tury jeszcze przetwarzany”.
3. Naprawiać kod produktu tylko po reprodukcji; dodać regresję w produkcyjnym kontrakcie i testach. Zachować semantykę pięciu pełnych tur oraz priorytet morski.

## Poza zakresem
Nie zmieniać czasu zbiórki, reguł pokoju, balansu jednostek ani mechaniki ręcznej bitwy. Nie twierdzić, że naprawiono wydajność dużego imperium.

## 11 etapów AutoBot
1. Rejestracja i dispatch — DONE.
2. Rekonesans kodu i dowodów — DONE: istniejący run Q1 ma live fixture oraz osobne land/sea testy, ale wymaga weryfikacji na aktualnej bazie i naturalnym marszu.
3. Reprodukcja/przyczyna — DONE, NIE ODTWORZONO na kandydacie d6e8b53b. Nie stwierdzono błędnego wyboru celu ani niewykorzystanego ruchu w przebadanych ścieżkach; dokładny zapis użytkownika nie był dostępny.
4. Minimalna poprawka operatora i regresja — N/A: brak potwierdzonej usterki; nie zmieniono kodu produktu.
5. Testy operatora na aktualnym kandydacie — DONE: test logiki 49/49; Chromium produkcyjny 68/68; `npm run typecheck` i `git diff --check` PASS.
6. Niezależny Evaluator — DONE: PASS-WITH-NOTES w `01-evaluator.md`; rerun potwierdzony w `02-audit-rerun-20261030.md`.
7. Operator Defense — N/A: niezależny Evaluator nie wykazał niepopartego twierdzenia; nie ma fixu do obrony.
8. Final Control dla zmian — BLOCKED: brak kandydata produktowego, bo oryginalny objaw na mapie właściciela nie został odtworzony.
9. Integracja lokalnego main dla tego zgłoszenia — BLOCKED: brak potwierdzonej poprawki.
10. Deploy Roboczej dla tego zgłoszenia — BLOCKED: brak kandydata.
11. Git push/receipt produktu — BLOCKED: brak kandydata.

## Izolacja i stan
Worktree operatora: /workspace/ai-campaign-assault-operator; gałąź autobot/ai-campaign-target-follow-q1; baza d6e8b53b1413025e3e0b4d752ae45534bb3d1943. Nie modyfikować starego brudnego worktree /tmp/the-game-ai-five-turn-20261028. Brak Kanbanu w tym projekcie nie blokuje pracy; ślad jest w plikach AutoBot.

## Wyniki operatora — 2026-10-29
- Zmieniono wyłącznie ścieżkę wyjściową live-harnessu: `CIV_GENERAL_WAR_LIVE_DIST` może wskazywać katalog w `TMPDIR`, bez zapisu w pełnym `/tmp`.
- Deterministyczny kontrakt: 49/49 PASS, w tym pięć pełnych tur zbiórki, atak w szóstej turze, wszystkie 4/4 jednostki dostają i wykonują rozkaz ruchu; priorytet celu morskiego po Żegludze i brak fałszywej trasy morskiej bez technologii.
- Chromium z produkcyjnym buildem: 68/68 PASS, 108 sekund. Potwierdzono zbiórkę przez pięć EOT, ruch w szóstym EOT, fizycznego wodza w stosie, marsz po wylądowaniu oraz cykl śmierci/wymiany wodza.
- W fixture morskim wszystkie jednostki lądują przed atakiem; brak bezpośredniego ataku z jednostki zaokrętowanej.
- Scenariusz organiczny korzysta z wygenerowanej mapy i nie przestawia wojsk, ale ustawia stolicę celu na osiągalnym heksie, więc nie jest reprodukcją dokładnego save'a użytkownika. Bez save'a/logu stanu tury nie da się rozstrzygnąć, czy opisany bezruch wynikał z `noPath`, blokady heksu, niewysłanego rozkazu czy opóźnienia zakończenia tury.
- Nie wykonano zmiany produktu i nie twierdzimy, że zgłoszony objaw naprawiono. Do pełnego zamknięcia reprodukcji potrzebny jest save albo pozycje/mapa w turze przed zatrzymaniem. Etapy 6–11 wstrzymane: brak potwierdzonego kandydata do niezależnej oceny/integracji; bez merge/deploy/push.
