STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-VERIFY-LIVE-MAX-Q2
GOAL: obrona po zarzutach Evaluatora (r3, raport 20-evaluator 78d467c67) dla kandydata 11f5cae38. Zakres obrony: dokumentacja i dane, bez pomiarów nowych i bez zmian gra/src.
BAZA: kandydat 11f5cae386cecb647e74ab9c4fc5c2ffc0ebd3dd (checkout --detach). Zmiany tylko w allowliście: dyspozycje/analizy/VERIFY-LIVE-MAX-Q2-2026-11-27.md, dyspozycje/autobot/runs/R-WEB-VERIFY-LIVE-MAX-Q2/dane/analiza-limitow-q2.py, dane/analiza-limitow-q2.{seed7-r3,seed4242-latwa-r3,seed4242-normalna-r3,seed4242-r3}.wynik.txt, 30-obrona-claude.md. Zero zmian gra/src, gra/tools, gra-robocza, gra-kanon, WERSJE.md, manifest, rust-port.
ZMIANY-COMMIT: commit obrony r3 (czubek = pole sha w StructuredOutput). Commit dodaje tylko wyżej wymienione ścieżki (git add <ścieżki>, bez -A).

ODPOWIEDZI NA ZARZUTY (każdy z dowodem):

1. sha256 tylko dla 2 jsonl (Trudna); brak dla seed4242-latwa-r3 i seed4242-normalna-r3 oraz plików wynikowych. PRZYJMUJĘ, NAPRAWIONE. Sekcja RUNDA 3 ma teraz wiążącą tabelę sha256 (16 pozycji: jsonl, summary.json, state.json dla trzech biegów r3 oraz skrypt i cztery pliki .wynik.txt). Sumy policzone `sha256sum` w tej rundzie; zgodne z zarzutem: latwa jsonl 7840bd88373bb7c5a5724dff2e0c12e7e6285c7c54b72eaa4158d578dc66f0a9, normalna jsonl 8886d82e32536a905fb2fbd2c16fd0cae7621e70962609641dbff03a02592781.

2. Stare sekcje (stara baza 01795c329, NIE ZMIERZONO, kultura Łatwy) zostają w pliku i mogą być błędnie odczytane. PRZYJMUJĘ, NAPRAWIONE. (a) Na górze pliku dodano blok „STAN WIĄŻĄCY (runda 3, baza 116a8e5fa)” wskazujący sekcję RUNDA 3 jako jedyny obowiązujący wynik dla pozycji 1–2. (b) Wszystkie nagłówki starszych sekcji (ustawienia rundy 1, tabela wyników, czas, dowody, wniosek, runda obrony 2, KOREKTA e6f3fd4b6) poprzedzono etykietą „HISTORIA — NIEAKTUALNE”. Treść liczbowa starych sekcji nie została usunięta (jest dowodem historycznym), ale nie jest już stanem bieżącym.

3. Seed 7: max wojen naturalnych gracza = 0, więc limit naturalnej wojny gracza nie został przetestowany dla wartości 1; brak komentarza. PRZYJMUJĘ, NAPRAWIONE komentarzem. Dodano w sekcji RUNDA 3: seed 7 nie wystawił limitu „max 1 naturalna” na próbę; 0 naruszeń na seedzie 7 dotyczy wojen epoki i jest słabszym dowodem dla wojny naturalnej. Jedyny pomiar wojny naturalnej gracza przy limicie 1 to seed 4242 (66 tur w wojnie). Dowód: `analiza-limitow-q2.seed7-r3.wynik.txt`: `max wojen gracza wg typu {'naturalna': 0, 'epoki': 1}`.

4. Gracz = autopilot, jedno ziarno na porównanie; „zamierzone” to kierunek, nie dowód ilościowy. PRZYJMUJĘ, NAPRAWIONE. Wniosek w sekcji porównania poziomów Dyplomacji oznaczono jako „wniosek kierunkowy, NIE ilościowy”: jedno ziarno (seed 4242) na poziom, gracz na autopilocie; liczby 64/42/7 nie są przenoszone na inne ziarna. Zachowano ustalenie kierunku (zgodne z opisem Trudnej w grze), bez twierdzenia o wielkości.

5. Etykieta „tury z >2 sojuszami” w analiza-limitow-q2.py liczy pary globalnie (seed 7: 29) i myli; kryterium to linia na cywilizację (0). Zarzut: „poprawka poza zakresem”. PRZYJMUJĘ, NAPRAWIONE w zakresie (plik jest w allowliście, bo leży w katalogu dane/ tego tematu). Zmieniono wyłącznie napis w linii 48 skryptu na: „tury z >2 parami sojuszy w calym swiecie (NIE kryterium limitu; kryterium = linia "tury z >2 na cywilizacje")”. Logika bez zmian. Dowód: `git diff` pokazuje zmianę jednej linii; ponowne uruchomienie `python3 -I analiza-limitow-q2.py seed7-r3/seed7-all1-lvl-trudna.jsonl` przed zmianą dawało wynik identyczny z zapisanym plikiem (poza tą linią); po zmianie przeliczono cztery wyniki r3, każdy różni się wyłącznie tą linią (`git diff --stat`: 2 linie w każdym z 5 plików). Stare wyniki z bazy 01795c329 nie były przeliczane i nadal mają starą etykietę (oznaczone jako historia).

WERYFIKACJA ZMIANY:
- `git diff --check` → bez błędów (CHECK_OK).
- `python3 -I` przeliczenie czterech wyników r3 (surowe wyjście zapisane do plików; diff pokazuje tylko etykietę).
- Gra nie była zmieniana; bramek gry nie uruchamiano ponownie, bo nie dotyczą zmienionych ścieżek (wynik bramek z 11f5cae38 i e6f3fd4b6 jest w dokumencie, sekcja KOREKTA/RUNDA 3).

TESTY: `git diff --check` OK; przeliczenie analizy r3 (4 pliki) OK; pomiarów live NIE WYKONANO w tej rundzie (zakres: poprawki dokumentacji i etykiety). Liczby w dokumencie nie zostały zmienione poza komentarzami i tabelą sha256.

BLOKADY: brak dla zakresu obrony. Pozycje 1–2 wg pierwotnego kryterium dispatchu pozostają NIE DOMKNIĘTE (seed 7 nie wykonał pełnego limitu wojen naturalnych; porównanie jednoziarnowe; pole deklarującego wojnę odroczone, wymaga zmiany gra/src — decyzja orkiestratora). Te luki są teraz jawnie opisane w dokumencie.

RUNDY: 3/5 (runda obrony po FC r2 FAIL; ta runda zamyka zarzuty Evaluatora r3, nie zamyka pozycji 1–2).
NASTĘPNY KROK: Evaluator (ponowna ocena dokumentu i etykiety) → Final Control. Ewentualne pomiary dopełniające (seed 7 z wojną naturalną gracza, drugie ziarno porównania) jako osobny temat, nie w tej rundzie.
DEPLOY/PUSH: NIE WYKONANO
UWAGI-DLA-ORKIESTRATORA: (a) stare wyniki `.wynik.txt` z bazy 01795c329 (analiza-limitow-q2.wynik.txt, analiza-limitow-q2.seed4242-max-trudny.wynik.txt) nie zostały przeliczone po zmianie etykiety; są oznaczone jako historia. (b) Wcześniej utworzony plik tymczasowy w katalogu roboczym został usunięty przed commitem; `git status` czysty poza allowlistą.
