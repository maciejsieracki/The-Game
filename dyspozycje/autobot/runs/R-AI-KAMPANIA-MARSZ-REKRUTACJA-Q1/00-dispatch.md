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
3. Reprodukcja/przyczyna — R3: potwierdzono kontrolowany przypadek 981044, gdzie po 5 EOT follower rendezvous wstrzymywał czterojednostkową główną grupę (`held`), mimo `campaign=attacking`; brak `noPath`.
4. Minimalna poprawka operatora i regresja — DONE R3: kampania wodza opt-in `marchMainGroupWhileRendezvous`; zwykłe all-in czeka jak wcześniej. Czerwona/zielona regresja kampanii 50/1 → 51/0.
5. Testy operatora — DONE R3: kampania 51/51; post-fix Chromium 28/28, pięć tur zbiórki, EOT6 ruch 4/4 głównej grupy oraz oddzielnego followera rendezvous; `pageErrors=0`.
6. Niezależny Evaluator — DONE R3: PASS-WITH-NOTES; 94/4 szerokiego planera, 4 znane błędy bazowe przed/po.
7. Operator Defense — N/A: Evaluator nie zgłosił zarzutu wymagającego obrony.
8. Final Control — DONE R3: PASS-WITH-NOTES; raport `50-final-control-r3-20261030.md`.
9. Integracja lokalnego `main` — DONE lokalnie; raport `51-integration-r3.md`; testy na bieżącym `main` i typecheck PASS.
10. Deploy Roboczej — oczekuje na wspólny build/release po gotowych poprawkach.
11. Git push/receipt dla R3 — oczekuje na release. Wcześniejszy bazowy cykl kampanii już jest opublikowany; R3 jeszcze nie.

OGRANICZENIA R3: Chromium użył kontrolowanej mapy wyłącznie lądowej, więc nie dowodzi priorytetu ataku morskiego; brak zapisu mapy właściciela; gate potwierdza ruch, nie obrażenia ani zdobycie miasta. Nie przypisuj tych niezweryfikowanych zachowań do PASS.

## Izolacja i stan
Worktree operatora: /workspace/ai-campaign-assault-operator; gałąź autobot/ai-campaign-target-follow-q1; baza d6e8b53b1413025e3e0b4d752ae45534bb3d1943. Nie modyfikować starego brudnego worktree /tmp/the-game-ai-five-turn-20261028. Brak Kanbanu w tym projekcie nie blokuje pracy; ślad jest w plikach AutoBot.

## Wyniki operatora — 2026-10-29
- Zmieniono wyłącznie ścieżkę wyjściową live-harnessu: `CIV_GENERAL_WAR_LIVE_DIST` może wskazywać katalog w `TMPDIR`, bez zapisu w pełnym `/tmp`.
- Deterministyczny kontrakt: 49/49 PASS, w tym pięć pełnych tur zbiórki, atak w szóstej turze, wszystkie 4/4 jednostki dostają i wykonują rozkaz ruchu; priorytet celu morskiego po Żegludze i brak fałszywej trasy morskiej bez technologii.
- Chromium z produkcyjnym buildem: 68/68 PASS, 108 sekund. Potwierdzono zbiórkę przez pięć EOT, ruch w szóstym EOT, fizycznego wodza w stosie, marsz po wylądowaniu oraz cykl śmierci/wymiany wodza.
- W fixture morskim wszystkie jednostki lądują przed atakiem; brak bezpośredniego ataku z jednostki zaokrętowanej.
- Scenariusz organiczny korzysta z wygenerowanej mapy i nie przestawia wojsk, ale ustawia stolicę celu na osiągalnym heksie, więc nie jest reprodukcją dokładnego save'a użytkownika. Bez save'a/logu stanu tury nie da się rozstrzygnąć, czy opisany bezruch wynikał z `noPath`, blokady heksu, niewysłanego rozkazu czy opóźnienia zakończenia tury.
- Nie wykonano zmiany produktu i nie twierdzimy, że zgłoszony objaw naprawiono. Do pełnego zamknięcia reprodukcji potrzebny jest save albo pozycje/mapa w turze przed zatrzymaniem. Etapy 6–11 wstrzymane: brak potwierdzonego kandydata do niezależnej oceny/integracji; bez merge/deploy/push.
