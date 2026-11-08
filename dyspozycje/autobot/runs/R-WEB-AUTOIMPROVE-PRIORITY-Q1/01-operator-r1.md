STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-AUTOIMPROVE-PRIORITY-Q1
GOAL: Ustalić, dlaczego automat nie czyści lasu przy rzekach (Objaw A) i nie stawia trzody po farmie (Objaw B); naprawić przyczynę błędu, a zasady wymagające decyzji właściciela zgłosić jako DECISION_REQUIRED.

ZMIANY/COMMIT: baza origin/main 914daa502. Zmieniono `gra/src/game/auto-improvements.ts` (FAZA 1, ~linia 1062: bramka tartak/oboz na heksie rzeka+las przed KROKIEM 0). Dodano `gra/tools/wyrab-rzeka-krok0-test.cjs` (regresja), `gra/tools/wyrab-rzeka-obywatel-measure.cjs` (macierz 2x2 x scenariusz), `gra/tools/wyrab-rzeka-obywatel-turns.cjs` (symulacja 12 tur). Logi w `dyspozycje/autobot/runs/R-WEB-AUTOIMPROVE-PRIORITY-Q1/gate-*.txt`. SHA: w komunikacie commita (patrz git log).

DIAGNOZA Objaw A (zmierzone, nie hipoteza):
- Przyczyna główna: `auto-improvements.ts` FAZA 1 (`hexPhasePriority`) stawia tartak, a potem oboz_lowiecki na heksie rzeka+las z obywatelem, bo `FOREST_COEXIST_IMPROVEMENT_KEYS` pozwala. KROK 0 wycinki (~linia 1017) ma straznik `!some(tartak|oboz)`, więc wycinka na tym heksie jest blokowana na zawsze. `rzekiDoZagospodarowania` (~linia 940) zostaje true, więc `wolnoKarczowacPozaRzeka` jest false i las poza rzeką też nie jest ruszany.
- Dowód: przed naprawą test `gate-krok0-test.txt` czerwony (0 wycinek, na 13,12 tartak+oboz w turze 1). Symulacja 12 tur przed naprawą: rzeka 13,12 nadal las, po t2 już tylko (brak).
- Tabela 2x2 (wolnoWycinacLas x onlyWorked) potwierdza: przy odblokowanych tylko Rolnictwo+Kamieniarstwo wycinka rzeka+las z obywatelem działa; po odblokowaniu Obróbki drewna i Łowiectwa blokuje ją tartak/obóz. Opcja `wolnoWycinacLas` nie jest przyczyną (F2 potwierdzone).

NAPRAWA (zielona): bramka tartak/oboz nie wchodzi na heks rzeka+las, gdy KROK 0 jest dopuszczony (wyrabWlaczony, nie zaplanowany, las w promieniu >= WYRAB_MIN_FOREST_IN_RADIUS lub riverForestClearingOnly, hexAllowsKey). Po naprawie scenariusz A: wycinka 13,12 w t2, farma+trzoda na 13,12 w t3. Testy istniejące bez zmian wyników: auto-improvements-test 45/0 (baza 45/0), ai-improvements-test 53/0 (baza 53/0), wyrab-wycinka-nazwa-live 49/0, tsc --noEmit EXIT=0.

OBJAW B: w pickerze nie odtworzony. Na mapie testowej bydlo stoi na tym samym heksie co farma i na sąsiednich heksach od razu po farmie, pod warunkiem odblokowania „Oswojenie zwierząt”. Bez tej technologii bydlo nie powstaje (tech z `data/terrain-improvements.json`). Realny stan gracza: NIE_ZMIERZONO (nie mam jego save; możliwe gałęzie: `livestock-unlock.ts:100` Nowy Świat era<3, brak technologii, budżet).

DECISION_REQUIRED (nie zmieniano):
1. Scenariusz B (rzeka+las, brak innego lasu w promieniu): tartak+oboz wchodzą na heks rzeki, a wycinka nigdy nie rusza, bo próg zachowania lasu (WYRAB_MIN_FOREST_IN_RADIUS=3) i tartak/guard blokują. Propozycja: wycinka na heksie rzeki jest KROKIEM 0 bez progu i bez bramki lesneMin, a tartak/oboz na tym heksie dopiero po wycince. Koszt: zmierzone w R-AI-WYRAB (mniej tartaków/obozów, −26 pkt żywności przy wariancie bez bramki).
2. E1 vs Zasada 2: przy onlyWorked=true pusty heks rzeki bez obywatela NIE dostaje farmy (matrix: rzeka 13,11 brak farmy), a przy onlyWorked=false dostaje pierwszy. Propozycja: E1 (farma na rzece bez lasu) bierze z puli kandydatów także heksy rzeki bez obywatela, lub zasada 2 tylko dla nie-rzecznych heksów.
3. Po E1–E2: czy dalej wycinać lasy poza rzeką (`wolnoKarczowacPozaRzeka`) i stawiać farmy poza rzeką? Obecnie: tak, ale tylko na heksach z obywatelem (Zasada 2). Zachowano bez zmian.
4. Kolejność „po typach” (E1→E4 globalnie) zamiast „heks po heksie”: w symulacji farmy na heksach miasta powstają przed wycinką na rzece. Zmiana wymaga przebudowy FAZY 1; nie wykonano. Zgłoszona jako decyzja właściciela.

BLOKADY: brak (Objaw B realnego stanu NIE_ZMIERZONO, patrz wyżej).
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Sonnet 5.5) weryfikuje mutację (cofnięcie poprawki => test czerwony) i punkty DECISION_REQUIRED 1–4; Final Control po Evaluatorze.
DEPLOY/PUSH: NIE WYKONANO
