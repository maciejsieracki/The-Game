STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-BATTLE-DEPLOY-CAVALRY-FLANKS-AT-START-Q1
GOAL: Konnica/rydwany przy domyślnym starcie bitwy stoją na skrzydłach, blisko własnych jednostek, nie wysunięte przed nie.
ZMIANY/COMMIT: gra/src/battle/formationRules.ts (initialBattleSlots), nowy test gra/tools/battle-deploy-cavalry-flanks-test.cjs. SHA: patrz commit gałęzi worktree (wpis uzupełniony w odpowiedzi końcowej).
TESTY: patrz niżej.
BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: Evaluator
DEPLOY/PUSH: NIE WYKONANO

## Diagnoza (z dowodem)

Domyślne ustawienie ('flanks') FAKTYCZNIE działa wierszowo: `_placeUnits` -> `initialBattleSlots` daje konnicy wiersze poza zakresem wierszy wszystkich pasów nie-konnych. Błąd jest w GŁĘBOKOŚCI (kolumnie): slot konnicy miał zawsze `rank = 0`, czyli kolumnę FRONTU, niezależnie od tego, w którym szeregu stoi najszerszy pas. Gdy pas czołowy (piechota) jest wąski, a szerszy pas stoi głębiej (np. łucznicy), konnica ląduje przed łucznikami, poza ich zakresem wierszy, daleko od reszty: "na samym froncie, oderwana".

Pomiar (probe na produkcyjnym `BattleScene.prototype._placeUnits`, atk, kol. 31 = front):
- 4 piechoty + 20 łuczników + 4 konnych + wódz, PRZED: konnica w kol. 31 (front) w wierszach 65,66,87,88, łucznicy w kol. 30 (rząd 67..86) -> konnica o 1 kolumnę PRZED łucznikami.
- PO: konnica w kol. 30, w tym samym szeregu co łucznicy, tuż nad/pod ich końcami.
- Gdy piechota jest najszerszym pasem (np. 40 piechoty), konnica nadal stoi na końcach linii czołowej (rank 0) — to klasyczne skrzydło; bez zmian.
- Ścieżka reset deploy używa tego samego `initialBattleSlots` (test statyczny potwierdza 2 wywołania), więc poprawka obejmuje start i reset.
- (c) Typy konne: kategoria konnica/rydwan oraz nazwy konnic/jazd/jezdz/kawaler/rydwan/chariot/cavalry/horse (`classifyInitialBattleRole`); wódz (commander) ma pierwszeństwo i NIE jest konny; oblężnicze nie są konne.

## Naprawa (minimalna, u źródła)

W `initialBattleSlots` zapamiętywany jest numer szeregu najszerszego pasu nie-konnego (`wingRank`, przy remisie pierwszy od frontu); konnica dostaje `rank = wingRank + floor(wingIndex / rows.length)`. Wiersze skrzydeł bez zmian. Tryb 'rear' i ręczne rozstawienie gracza (`_formationSlotsForUnits`) NIE ruszane.

## ZAŁOŻENIA (luki dispatchu)

1. "Skrajna kolumna flanki, nie w rzędzie czołowym": zinterpretowano jako: wiersz poza zakresem wierszy całego korpusu nie-konnego i kolumna nie przed najszerszym szeregiem. Gdy najszerszy pas jest czołowy, skrzydło jest na końcach linii czołowej (nie cofałem go — cofnięcie za front oderwałoby konnicę od ostatnich jednostek linii). Jeśli właściciel chce konnicę ZAWSZE o szereg za frontem — decyzja produktowa (DECISION_REQUIRED dla orkiestratora/ABC).
2. Próg odległości do najbliższej własnej jednostki: zmierzony max = 3 pola (Chebyshev), asercja w teście <= 4 (zapas 1). Nie wybierałem progu z kodu produkcyjnego.
3. "Różne kierunki natarcia" (C-FLANK attackDirection) wpływa dopiero na ruch w walce, nie na rozmieszczenie startowe; test pokrywa obie strony (atk/def) i oba tryby _deployMode.

## Testy

- Nowy battle-deploy-cavalry-flanks-test.cjs: PASS 536 asercji (6 składów x 2 strony x 2 tryby deploy). Mutacja (cofnięcie poprawki) -> FAIL "m0 not ahead of the widest rank (col 31 vs 30)" (test faktycznie łapie błąd).
- battle-flank-close-formation-test 994 checks PASS; battle-initial-placement-runtime-test PASS (mutacja 4/4); battle-formation-rules-test PASS; battle-cap-500 PASS 59; battle-undeployed-units PASS 35/0; battle-roster 7/0; battle-ranged-mounted-doctrine 10/10.
- logic-test 213/213; ai-test 289/0; tsc --noEmit (TS 5.9.3 z lock) 0 błędów.
- NIE URUCHOMIONO: battle-natural-chariot-r5-test (odpala vite build w gra/ = zakaz dispatchu), testy *-live/browser. battle-large-mixed-doctrine-matrix-test nadpisał tracked 01-matrix.json (efekt uboczny) — plik przywrócony przez git checkout; wynik matrycy NIE_ZMIERZONO jako PASS/FAIL (test nie wypisał werdyktu w ostatniej linii), do sprawdzenia przez Evaluatora w osobnym worktree.
- Weryfikacja wizualna w przeglądarce: NIE_ZMIERZONO (brak przeglądarki/zakaz buildu); dowód wektorowy z siatki pozycji.

## Uwagi

node_modules zainstalowane lokalnie w worktree (--no-save, bez zmian w package*.json); do usunięcia po zakończeniu tematu.
