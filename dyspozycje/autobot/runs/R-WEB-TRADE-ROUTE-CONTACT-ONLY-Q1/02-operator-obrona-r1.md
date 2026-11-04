# Operator (obrona) R1 — R-WEB-TRADE-ROUTE-CONTACT-ONLY-Q1
1. Bonus morski bez Portu: ODRZUCAM jako poprawke w tej paczce. Dispatch: dochod bez zmian, zero nowych zaleznosci; trasa morska bez Portu jest zamierzona (skala handlu). Bramkowanie bonusu Portem -> decyzja orkiestratora/wlasciciela.
2. BFS/zrzut: PRZYJMUJE (BFS) — liczba wywolan findCityConnection 12222 -> 1658 (gate-bfs-count.txt). Zrzut Chromium ODRZUCAM: render panelu bez zmian (tylko tekst blockReason i lista partnerow).
3. Szum czasu: PRZYJMUJE — wniosek wydajnosci opiera sie na liczbie wywolan (deterministycznej), nie na ms.
4. Stare zapisy bez kontaktu: ODRZUCAM — zalozenie udokumentowane; kontakt zapisywany/wczytywany z meta.
5. Mocki w czerwonych testach: ODRZUCAM — czerwone przed i po z przyczyn niezaleznych (ReferenceError isDiploSensibleDealsEnabled, numery linii); pokrycie mockow daje nowy test 36/36.
Kod bez zmian wzgledem b1639645b.
