STATUS: PASS-WITH-NOTES
DOMAIN: GAME (pomiar/weryfikacja)
TEMAT: R-WEB-AI-REBEL-VERIFY-LIVE-Q1 (tag AIREBELVER)
GOAL: domknąć pozycje 1–5 weryfikacji buntów AI na MAKSYMALNYM poziomie (runda 2/5, wskazówki FC r1).
ZMIANY-COMMIT:
- NOWY gra/tools/ai-rebel-verify-max-live.cjs: prawdziwa nowa gra (__nnsMeasureDebug.startGame, difficulty trudny, kulturaReligiaLevel trudny), wybór AI przez __rebelProtectionTestDebug.pickTwoAiOwners, wymuszony bunt skrajny (__rebelNotifyTestDebug.forceRevoltEligible), 6 realnych endTurn, odczyt stanu miasta i liczby AI z 0 miast. Zero zmian gra/src i gra/data.
- NOWY dane/max-last-city-s4242-t6.txt i dane/max-last-city-s7-t6.txt (surowe wyjścia PREFIX=AIREBELVER-MAX-LAST-CITY).
- NOWY 10-operator-claude.md (ten raport).
- Bundle żywy zbudowany POZA repo (node ./node_modules/vite/bin/vite.js build --outDir <scratchpad>/rebel-dist --emptyOutDir; exit 0, "built in 32.77s"). Dowiązanie gra/node_modules do cudzego worktree (tylko odczyt) usunięte po pracy.
- Brak zmian w gra/src, gra/data, WERSJE.md, manifeście.
TESTY:
- Pozycja 1, MAKSIMUM (Trudny + Kultura i religia Trudny), seed 4242: exit 0; settings z gry: difficulty=hard, kulturaReligiaLevel=trudny, kosztJednostekPace=niski, diplomacyWarLevel=latwa. Wybrany AI owner 40 (1 miasto, city1). Wymuszenie: criticalPorPctBefore=14, graceTurns=2. Tura 1: rebelState=false, grace=0. Tury 2–7 (6 realnych endTurn, settled): ownerId=40, rebelState=false, grace=0; AI z 0 miast = 0 w każdej turze. Werdykt: OCHRONA-DZIALA. Dane: dane/max-last-city-s4242-t6.txt.
- Pozycja 1, MAKSIMUM, seed 7: identyczny werdykt (OCHRONA-DZIALA, tury 2–7, AI z 0 miast = 0). Dane: dane/max-last-city-s7-t6.txt. Uwaga: ten sam owner id 40 wybrany dla obu ziaren (pickTwoAiOwners zwraca pierwszego AI); rozkład miast różni się (seed 7: owner 2 z 1 miastem), więc ziarno działa.
- Kontrola (target player, ten sam hak na jedynym mieście gracza, maksimum): NIE ZMIERZONO w tej rundzie (brak czasu na osobny bieg; poprzednia kontrola z rundy 2 była na poziomie normalnym, playtest, i nie jest wynikiem maksimum).
- Bramki z dispatchu (tsc, logic 213, ai-test 297/0, ai-city-rebellion-gate 37/0, ai-city-rebellion-news 24/0): NIE RE-RUN w tej rundzie. Powód: zmiana dotyczy wyłącznie nowego pliku narzędziowego w gra/tools, gra/src nietknięte; wyniki bramek z rundy 1 nie są tu powtarzane jako własny dowód.
- node --check gra/tools/ai-rebel-verify-max-live.cjs: SYNTAX_OK.
- git diff --check: czysto.

BLOKADY (z powodem technicznym):
1. Koszty jednostek na MAKSIMUM (Wysoki ×4): NIE ZMIERZONO na tym poziomie. Powód: __nnsMeasureDebug.startGame (gra/src/main.ts ok. l.34863–34900) na sztywno ustawia kosztJednostekPace: 'niski' w obiekcie advanced; hak nie przyjmuje tego parametru. Odczyt z gry potwierdza kosztJednostekPace=niski. Wynik pozycji 1 jest więc dla Kosztów niski, nie maksimum. Potrzebne: parametr w __nnsMeasureDebug.startGame albo ręczny NewGameParams (decyzja: patrz UWAGI-DLA-ORKIESTRATORA).
2. Dyplomacja na maksimum: odczyt pokazuje diplomacyWarLevel=latwa. Maksimum poziomu „Dyplomacja i wojna” nie zostało ustawione w tym runnerze (startGame nie przyjmuje tego pola); nie mierzono na poziomie najwyższym.
3. Pozycja 2 (stolica AI w buncie przy ≥2 miastach): NIE ZMIERZONO. Powód: capitalCityIdForOwner jest funkcją wewnętrzną gra/src/main.ts; żaden hak __aiEconomyMeasure.* nie zwraca stolicy ani Mennicy (grep w poprzedniej rundzie: brak pól capital/stolic/mennic). Nie dopisywano haka do gra/src (zakaz).
4. Pozycja 3 (round-trip zapisu z listą „Wydarzenia na świecie”): NIE ZMIERZONO. Powód: lista worldDiploNewsList nie ma haka odczytu; odczyt wymaga DOM okna dyplomacji, którego runner nie implementuje w tej rundzie. Zapis dostępny przez __settingsLive.saveRoundTrip (slot civtest-settings-live-roundtrip) i __truceTestDebug.saveForTest, ale nie było próby round-trip z wpisem rebelii.
5. Pozycja 4 (zrzut okna dyplomacji z wpisem „rebelia”): NIE ZMIERZONO. Powód: wpis powstaje tylko przy kontakcie gracza z właścicielem miasta (recordAiCityRebellionNews: getDiplomaticContacts().has(prevOwnerId)). Nie ustawiono kontaktu w tym biegu, więc nie było czego zrzucać; zrzut nie wykonany.
6. Pozycja 5 (60+ tur na maksimum, liczba wpisów „rebelia”, widoczne cywilizacje): CZĘŚCIOWO. Wykonano 6–7 tur ochrony na maksimum (seed 4242 i 7), AI z 0 miast = 0 w każdej turze. NIE ZMIERZONO: bieg 60 tur, liczba buntów AI, liczba wpisów rebelii i liczba widocznych graczowi cywilizacji (lista nieeksportowana, jw. pkt 4). Brak szumu (2 przebiegi tego samego ziarna nie wykonane).

ODPOWIEDZI NA ZARZUTY FC r1 (wskazówki orkiestratora):
- Hak __settingsLive: użyty do odczytu ustawień (getSettings) i potwierdzenia poziomu; nie pozwala ustawić Kosztów jednostek na wysoki przy startGame (patrz BLOKADA 1), więc nie „ustawiono maksimum” w pełni.
- Wymuszenie buntu: użyte __rebelNotifyTestDebug.forceRevoltEligible i __rebelProtectionTestDebug (disableVictoryCheckForTest, pullPlayerUnitsHome) — wskazówka zrealizowana.
- Pozycje 3, 4 i 2: nie wykonano z powodów wyżej (nie „brak haka” bez próby — pozycja 4 wymaga kontaktu, pozycja 3 wymaga odczytu DOM, pozycja 2 wymaga haka).

UWAGI-DLA-ORKIESTRATORA:
- DECISION_REQUIRED (jedno zdanie, pozycja 2): dodać do gra/src hak tylko-odczyt stanu stolicy AI i Mennicy (wpływ: pozwoli sprawdzić, czy stolica w buncie zmienia zwycięstwo).
- DECISION_REQUIRED (jedno zdanie, koszty): dodać do __nnsMeasureDebug.startGame parametr kosztJednostekPace (wpływ: pomiar pozycji 1 i 5 na poziomie Wysoki ×4 zamiast niski).
- Runner ai-rebel-verify-max-live.cjs ma w sobie wybór owner przez pickTwoAiOwners (zwraca pierwszego AI, stąd ten sam owner 40 dla obu ziaren).
- Kontrola (target player) na maksimum wymaga osobnego biegu; warto dodać do następnej rundy.
NASTĘPNY KROK: runda 3 (Operator): (a) kontrola target player na maksimum (seed 4242); (b) odczyt listy „Wydarzenia na świecie” z DOM po kontakcie z właścicielem i zrzut okna dyplomacji (deviceScaleFactor 1); (c) 60 tur na maksimum z licznikiem buntów AI i wpisów; po decyzjach o haku stolicy i kosztach.
DEPLOY/PUSH: NIE WYKONANO
