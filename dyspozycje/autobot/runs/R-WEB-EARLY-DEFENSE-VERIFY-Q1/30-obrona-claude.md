STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-EARLY-DEFENSE-VERIFY-Q1 (tag REALDEF4), obrona po raporcie Evaluatora (20ad521f2), runda 1/5
GOAL: odpowiedzieć na 8 zarzutów Evaluatora: przyjąć z poprawką albo odrzucić z dowodem; poprawić dokument i runner; zero zmian gra/src, gra/data, WERSJE.md.
ZMIANY/COMMIT: allowlista. Zmienione: `dyspozycje/analizy/OBRONA-STARTU-WERYFIKACJA-2026-11-27.md` (wycofanie wniosku o obronie, sekcja „Korekty po przeglądzie Evaluatora”, nazwy i poprawki), `gra/tools/realdef-econ-live.cjs` (pole `barb` = `ADV.barbariansLevel`; komentarz przy `firstDefenderTurn`), ten raport. Dane `dane/*.jsonl` NIE przepisane. Commit: SHA w polu sha odpowiedzi (czubek pracy).
TESTY:
- `git diff --stat da531871..HEAD -- gra/src gra/data WERSJE.md`: pusty (zero zmian kodu gry).
- `node --check gra/tools/realdef-econ-live.cjs`: OK.
- `git diff --check`: OK.
- tsc / logic / ai-test: NIE URUCHAMIANO (kod gry bez zmian; dispatch to dopuszcza).
- Liczby w tabeli NIE przeliczane ponownie; potwierdzone wcześniej przez Evaluatora z surowych jsonl (30 wierszy `kind=result`) i sprawdzone tu dodatkowo: `turns[0].playerOnHex` (dowód zarzutu 7), `grep '"barb"'` (dowód zarzutu 2: 30/30 wierszy = "trudny").
- Pomiar live NIE powtórzony (klik w UI i konfiguracja „wyłączeni barbarzyńcy” wymagają nowego biegu, poza zakresem tej rundy).
BLOKADY:
- Zarzut 3 (haki zamiast UI) — NIE ROZWIĄZANE w tej rundzie: wymaga osobnego biegu z kliknięciem w panel. Dokument jednoznacznie oznacza liczby suwaka jako hakowe.
- Zarzut 4 — liczba lasu w promieniu 778899 i Drewno w t1–10 NIE ZMIERZONO (brak hooka kafelków).
- Zarzut 5 — battleAlwaysManual=false, villageRewardsEnabled=true w „domyślnej” NIE zmienione w runnerze (zmiana wymagałaby reruna); wpływ NIE ZMIERZONO.
- Nowe, nie wyjaśnione: konfiguracja domyślna startuje z Wojownikiem na mieście (max nie) — przyczyna NIE ZBADANA; rozbieżność prognozy tury 1 względem NNS-T1 (−5/−6 vs −2/−3) NIE ZBADANA.
RUNDY: 1/5 obrony (runda Operatora w fazie obrony)
ODPOWIEDZI NA ZARZUTY:
1. PRZYJĘTY. Wniosek „obrońca przy 100% domyślnie przeżywa 3/5” wycofany. Dowód: econ-REALDEF4-domyslna.jsonl, p2, `purchaseTurn`=null na 4242, 11, 2024. Przeżycie bez zakupu.
2. PRZYJĘTY. Pole `barb` = stała BARB_LEVEL (30/30 wierszy "trudny"). Runner poprawiony (`barb: ADV.barbariansLevel`). Dane nie przepisane; poziom barbarzyńców dla domyślnej i wysoki-latwi nieweryfikowany odczytem (settingsReadback bez barbariansLevel).
3. PRZYJĘTY. Naruszenie zakazu hakowego: `__nnsMeasureDebug.setTaxSplit(100,0,0)` (realdef-econ-live.cjs:232) i `__civTest.endTurn()` (:300). Pkt 4 dispatchu NIE WYKONANY. Dokument poprawiony (nie „funkcja UI”).
4. PRZYJĘTY. „Cecha mapy” nieudowodniona; wariant „barbarzyńcy wyłączeni” NIE zmierzony (zmierzono Łatwych); liczebność fal t15–20 NIE zmierzona.
5. PRZYJĘTY. Odchylenia „domyślnej” od kreatora (battleAlwaysManual: runner false vs kreator true w newGameFlow.ts:304) opisane; villageRewardsEnabled i parametry świata NIE zweryfikowane jako domyślne.
6. PRZYJĘTY. Etykieta BŁĄD-GRY usunięta; odnośnik do NNS-T1 (decyzja 2026-11-14, pytanie 12 czeka na właściciela). Pomiar potwierdza zjawisko, nie ocenia zamierzenia.
7. PRZYJĘTY z dowodem. `firstDefenderTurn` liczy startowego Wojownika: `turns[0].playerOnHex` = ["Zwiadowca","Wojownik"] we wszystkich 10 wierszach domyślnej (P0 i P2), w max i wysoki-latwi ["Zwiadowca"]. Brak zakupu potwierdzony. Komentarz w runnerze.
8. PRZYJĘTY. Literówka „Politykі” poprawiona; wiersz „zero strat” doprecyzowany (bez zakupu obrońcy).
NASTĘPNY KROK: Final Control ocenia, czy niewykonany pkt 4 (klik w UI) i wariant „wyłączeni” blokują READY. Osobny temat (poza tą rundą): pomiar z kliknięciem w panel miasta i wariant „barbarzyńcy wyłączeni”, plus wyjaśnienie startowego Wojownika w konfiguracji domyślnej (różnica start units między konfiguracjami).
DEPLOY/PUSH: NIE WYKONANO
UWAGI-DLA-ORKIESTRATORA:
- Nowy znaleziony fakt (nie zarzut): konfiguracja „domyślna” i „max” różnią się składem startowym miasta (Wojownik tylko w domyślnej). To może być główna przyczyna różnicy wyników max/domyślna, a nie poziom barbarzyńców. Warto ująć w kolejnym temacie.
- Runner nadal zapisuje `settingsReadback` bez barbariansLevel; dodanie odczytu tego pola wymaga zmiany w grze lub w hakach odczytu — poza zakresem.
- Dane z pól `barb` w istniejących jsonl są błędne; czytać poziom z nazwy konfiguracji.
