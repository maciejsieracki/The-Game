STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: R-WEB-AI-CITY-GARRISON-MIN-ONE-LIVE-AUDIT-Q1
GOAL: Ustalić, czy miasta AI trzymają garnizon 1 jednostki; obrona zarzutów Evaluatora bez zmiany balansu.
ZMIANY-COMMIT: bez zmian w grze (src). Dodane narzędzia offline i dowody: gra/tools/ai-city-garrison-measure-offline-split.cjs, gra/tools/ai-city-garrison-measure-offline-leave.cjs, dowody/offline-split.json, dowody/offline-leave.json. SHA: patrz commit obrony (sha w StructuredOutput).
TESTY: brak nowych bramek (brak zmian w src). Analiza z istniejącego seed4242.jsonl.gz (59 rekordów, tury 2-60), bez nowego biegu gry (maszyna obciążona, zgodnie z dispatchem).

ODPOWIEDZI NA ZARZUTY:
1. PRZYJMUJĘ, wyjaśnione danymi. Tury 10/20 (11/41, 13/41) to 42 właścicieli z 1 miastem. 26 z nich znika do t30, a ich miasta przechodzą do wieloma miastami właścicieli (np. owner 2 city4 -> owner 1). Podział proxy po liczbie miast (offline-split.json): t30 multi 77/89 pustych, t60 multi 167/193 pustych. Typ właściciela (państwo-miasto vs cywilizacja) NIE_ZMIERZONO: JSONL nie ma flagi.
2. ODRZUCAM z dowodem. Wykluczenie garnizonu z armii to opcja C w pytaniu ABC (10-operator-claude.md). Zmienia skład armii AI także w pokoju, a dispatch zakazuje zmian balansu bez decyzji właściciela. Ścieżki w kodzie (czytanie, nie pomiar): army-concentration.ts:180 i :285 (filtr excludedUnitIds); ai.ts:4123 i :5307 (homeDefenderPool); ai.ts:4169 (planArmyConcentration w decideAITurn); ai.ts:5676 (csConcentration w decideDefensiveCopyTurn).
3. PRZYJMUJĘ, z uzupełnieniem. Zdarzenia "garnizon 1->0 u tego samego właściciela": 66 (wojna 36, pokój 30; 61 u właścicieli z >=2 miastami). Z nich 64 to jednostka żyjąca poza miastem (offline-leave.json: wojna 34, pokój 30), 2 zginęły lub zniknęły. To jest właściwa miara łamania reguły, nie 73 zdarzenia z poprzedniego raportu. Pustki: z 167 pustych miast w t60 tylko 47 miało garnizon kiedykolwiek, 120 nigdy (offline-split.json), więc większość pustek to brak rekrutacji. Właściciel 1 w t60: 47 z 49 jednostek w city3, 8 miast pustych, wojskoPozaMiastem=0. Wojsko stoi skupione w jednym mieście (zbiórka), nie garnizonach. Przyczyna zbiórki NIE_ZMIERZONO (prawdopodobnie consolidation w stolicy, ai.ts consolidationPeace).
4. PRZYJMUJĘ. Jeden seed, bez reprezentatywności statystycznej. Drugi bieg nie był wykonany (dispatch: 1 ziarno, maszyna obciążona). Założenie owner 0 = gracz: pośrednio (pole bypass gold 200 w t2 dotyczy owner 0), NIE_ZMIERZONO bezpośrednio.

WERDYKT (surowe liczby): B. Reguła jest obchodzona. W pokoju i w wojnie ostatnia jednostka opuszcza miasto i żyje poza nim (64 przypadki). W pokoju nie ma rekrutacji garnizonu (kod: ai.ts ~1945-1960 tylko przy wojnie lub zagrożeniu; czytanie kodu). C dotyczy rekrutacji w pokoju, nie samego wyjścia.

BLOKADY: Pełne wdrożenie wymaga decyzji właściciela (pytanie ABC w 10-operator-claude.md: A rekomendowane / B / C). Zarzut 2 odrzucony z tego powodu. Nie zmieniano balansu.
NASTĘPNY KROK: decyzja A/B/C, potem temat R-WEB-AI-CITY-GARRISON-MIN-ONE-IMPL-Q1. Dodatkowo: sprawdzić przyczynę zbiórki w stolicy (NIE_ZMIERZONO) i drugie ziarno przed werdyktem o reprezentatywności.
RUNDY: 2/5 (runda 1 Operatora, runda 2 obrona)
DEPLOY/PUSH: NIE WYKONANO
UWAGI-DLA-ORKIESTRATORA: brak. Nie uruchamiano sesji ani zadań.
