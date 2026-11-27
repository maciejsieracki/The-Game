STATUS: BLOCK
DOMAIN: GAME
TEMAT: R-WEB-SAVE-LOAD-MATRIX-Q1
GOAL: Dopełnić macierz zapis/wczytanie na MAKSIMUM (B==A ≥6 tur), ścieżka UI z menu pauzy, A==A' (≥10 tur ×2 ziarna), spójność renderu po wczytaniu.
ZMIANY/COMMIT: baza kodu gry bez zmian (gra/src nietknięte). Zmieniono gra/tools/save-load-continuity-live.cjs: barbarzyńcy w cfg max z 'normalny' na 'trudny' (maksimum suwaka „Barbarzyńcy”: opts Łatwy/Normalny/Trudny/Brak, gdzie Brak = wyłączone), pole cfgUsed w wyniku JSON. Nowe dane: dane/B-max-4242-t3-trudny.json, dane/STATE-A-max-4242-t3-trudny.json. SHA: czubek tej gałęzi (patrz commit).
BAZA: 7788ba013 (kandydat) na origin/main ebaa23b03.

ODPOWIEDZI NA ZARZUTY:
1. PRZYJMUJĘ. Wiersze „max” z poprzedniej rundy liczone były przy barbarzyńcach „normalny”, czyli NIE na maksimum (patrz 6). Na właściwym maksimum zmierzona jest 1 z 12 komórek: max/4242/t3 = B==A 6/6 (tury 4–9, pageErrors 0, mapDiffers true). Pozostałe 11 komórek: NIE ZMIERZONO.
2. PRZYJMUJĘ. Harnessu klikającego menu pauzy nie napisano. NIE ZMIERZONO (zostaje hak loadJsonAsPauseLoad → loadGameFromSlot).
3. PRZYJMUJĘ. A==A' nie uruchomiono. NIE ZMIERZONO.
4. PRZYJMUJĘ. Render po wczytaniu i zrzut PNG w dane/ nie wykonano. NIE ZMIERZONO.
5. PRZYJMUJĘ. Pliki wynikowe dla max/4242/t10 i aionly/7/t3 nie są w tym commicie (dane/ zawiera tylko pliki z tej rundy i nie ma ich w historii tej gałęzi). Te dwie komórki nie są liczone jako zmierzone w tej rundzie.
6. PRZYJMUJĘ. Zmierzone: cfg max miał barbariansLevel 'normalny' (poziom Trudny wg suwaka to 'trudny'; dispatch wymaga Trudny). Poprawka: MAX_ADV.barbariansLevel = 'trudny' w harnessie. Maksimum poziomów rozstrzygnięte tak: difficulty 'Trudny', barbariansLevel 'trudny' (najwyższa gęstość na suwaku; 'brak' to wyłączenie), kulturaReligiaLevel/AI 'trudny', diplomacyWarLevel 'trudna', cityLimitBase 10, civTypesCount 15 (cfgUsed w JSON). Liczba rywali rivals '2' i pozostałe parametry NIE ZWERYFIKOWANE jako maksymalne (nie sprawdzono zakresu suwaków) — do potwierdzenia w następnej rundzie.
7. PRZYJMUJĘ. Wywołanie Bash z A (5 min) przekroczyło domyślny limit 120 s, bo nie podano parametru timeout, i narzędzie przeniosło je w tło bez mojej decyzji. Nie uruchomiono drugiej kopii. Od tej chwili każde wywołanie z timeout ≤ 590000 w pierwszym planie. Wynik A został zebrany z pliku wyjściowego (exit 0).

TESTY:
- A (max, ziarno 4242, zapis po t3, K=6, nowy cfg trudny): exit 0, zrzuty t4–t9, czas 21:43:06–21:48:29 UTC.
- B (max, ziarno 4242, zapis t3, wczytanie hakiem loadJsonAsPauseLoad): VERDICT PASS (expect=equal, anyDiff=false, pageErrors=0), tury 4–9 OK ×6, rebuild=false, mapDiffers=true, czas 21:48:40–21:53:47 UTC.
- Bramki kodu: nie uruchamiane w tej rundzie (brak zmian w gra/src). W poprzedniej rundzie: npx tsc --noEmit exit 0.
- Build: vite build do katalogu w scratchpadzie (npm run build nie uruchamiano).

BLOKADY:
- Pozostałe 11 komórek macierzy na maksimum (~5–6 min na bieg A i ~5 min na bieg B; czas wystarcza, ale wymaga wielu wywołań).
- Klik UI, A==A', render: nie zrobione w tej rundzie (zakres większy niż pozostały czas tej rundy).
- Chromium: w tej rundzie bez SIGSEGV.
- Procesowa: patrz 7.

RUNDY: 2/5 (runda 1 = poprzednia; runda 2 = ta obrona). Decyzja wymagana: nie.
NASTĘPNY KROK: Runda 3 (ten sam ID): (a) 11 pozostałych komórek macierzy na barbarzyńcach trudny (aionly 4242/7, bunt 4242/7, max 7, t3/t10) — każdy zapis jako osobny A z --saves; (b) klik UI w menu pauzy (2 komórki); (c) A==A' 10 tur na max/4242 i max/7; (d) render po wczytaniu na max/4242/t10 z zrzutem do dane/. Zanim wpisać „maksimum”, potwierdzić zakresy rivals i civTypesCount.
DEPLOY/PUSH: NIE WYKONANO
