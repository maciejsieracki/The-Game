STATUS: FAIL
DOMAIN: GAME
TEMAT: R-WEB-AI-PURCHASE-MAINTENANCE-RESERVE-Q1
GOAL: AI nie kupuje jednostek, gdy po zakupie dochod netto zlota/ture spadlby ponizej progu albo skarbiec nie pokrywalby ceny + N tur utrzymania; progi w gra/data/ai-params.json per poziom.

ZMIANY/COMMIT: Final Control bez zmian w kodzie. Oceniany commit Operatora d07389579 (baza fcaa10300). Diff fcaa10300..d07389579 = dokladnie allowlista (01-operator-r1.md, ai-params.json, ai.ts, nowy test); git diff --check czysty; brak main.ts / WERSJE.md / rust-port. Ten plik: 03-final-control.md.

TESTY (zweryfikowane samodzielnie): ai-purchase-maintenance-reserve-test.cjs 28/0 PASS. Call site gra/src/main.ts:40744 nadal podaje tylko treasury/goldCost/hasManpower (potwierdzone czytaniem pliku) -> regula nieaktywna w grze. Pozostale liczby (logic 213/213, ai-test 274/20, tsc, D11 43/1 identyczne na bazie) przyjete z Obrony; nie powtarzane. Pomiar Chromium T40/T100: NIE WYKONANO.

WERDYKTY ZARZUTOW:
1. Regula martwa w grze: NAPRAW (wpiecie w main.ts, tylko call site ~40744; dochod netto z istniejacej prognozy HUD ~13410/20915).
2. Brak pomiaru wplywu / progi-placeholdery: NAPRAW (pomiar przed/po T40, T100 jesli czas, brak degeneracji, tabela progow z wynikiem). Zatwierdzenie progow liczbowych: DO DECYZJI CZLOWIEKA (wlasciciel, po pomiarze).
3. Allowlista blokuje wpiecie: NAPRAW po stronie procesu - orkiestrator rozszerza allowliste o gra/src/main.ts (wylacznie call site zakupu AI + ewentualnie funkcja pomocnicza netto). To nie jest decyzja produktowa: GOAL dispatchu bez tego jest nieosiagalny.
4. ai_rush_jednostka_rezerwa_zlota: NAPRAW (dispatch wymagal "podlacz lub usun z uzasadnieniem"; Operator tylko opisal). Runda nastepna: usunac martwe klucze z econ-params.json (allowlista +econ-params.json) albo jawnie podlaczyc; uzasadnienie w raporcie.
5. Brak testu integracyjnego sciezki: NAPRAW (po wpieciu test sprawdzajacy, ze call site w main.ts przekazuje 4 pola; np. test statyczny/regex lub behawioralny).
6. D11 brak porownania z baza: ODDAL (D11 pada tak samo na fcaa10300: 43/1; brak regresji).
Logika ai.ts: poprawna, wstecznie zgodna, do zachowania.

BLOKADY: Techniczne - allowlista bez main.ts (pkt 3). Pytan ABC nie zadaje (rola orkiestratora).

RUNDY: 2/5 zuzyte (Operator r1 + obrona); nastepna: runda 3/5 Operatora, ten sam ID.

NASTEPNY KROK: Orkiestrator rozszerza allowliste (main.ts call site, econ-params.json). Operator r3 na bazie d07389579: wpiecie, test integracyjny, usuniecie/podlaczenie martwych kluczy, pomiar, tabela progow. Potem Evaluator i Final Control. Kolejnosc integracji: ten temat startuje PIERWSZY (przed ARMY-STACK-LIMIT, ktory dotyka ai*.ts); d07389579 NIE jest do integracji samodzielnie (martwy kod). Brak SHA do integracji; po PASS SHA do rebase/merge na origin/rust-port/parity-v2 (8bc2efcf8) ustali FC.

DEPLOY/PUSH: NIE WYKONANO
