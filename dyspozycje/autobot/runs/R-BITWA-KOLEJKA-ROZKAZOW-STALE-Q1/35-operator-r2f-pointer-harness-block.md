# Operator R2-F — osiągnięto rundę 2; blokada projekcji punktu jednostki

**Wynik: WSTRZYMANY przez fixture projekcji; test rozkazu E2E nie został wykonany.**

Po poprzednim bloku harnessu zastosowano produkcyjne tempo poprawnie: 4 kliknięcia
`Zwolnij` ustawiły `speedMul` kolejno 8, 4, 2, 1. Pierwszy rzeczywisty cykl 28/28
ponownie przeszedł: runda 1, `turnIdx=28`, 28 żywych i wykonanych, 8 jednostek
zmieniło pozycję. Trace rundy potwierdza rzeczywisty przebieg produkcyjnych tur
przeciwnika przy `awaitingOrders=false`: `turnIdx` 47→56, następnie runda 2,
`turnIdx=1` o 00:48:51.834 UTC. Nowa, osiągalna bramka rundy 2 zadziałała.

Test zatrzymał się przed kliknięciami rozkazu. Fixture wybrał pierwszą nieaktywną
jednostkę (`atk1`), lecz nie mógł wyznaczyć ekranowego punktu, który trafiałby
jednoznacznie w jej model: `friendly:null`; kafel docelowy można było wskazać.
Prawdopodobna przyczyna to nakładanie się modeli bliskich jednostek w zwartej
formacji, ale nie potwierdzono jej. Brak błędów JS/konsoli. Dokładny stan, ślad i
zrzut są w `evidence/operator-r2f-execution-trace.json`,
`evidence/operator-r2f-pointer-geometry-failure.json` oraz `.png`.

Proces testowy/Chromium zamknął się poprawnie; brak aktywnego retry. Nie wykonano
drugiego rozkazu pointer ani deterministicznego `_activateNext` dead-ID probe.
**Nie zaliczono E2E, nie ma commitu produktu.** Harness powinien wybierać jednostkę
przez jej rzeczywistą kartę rosteru (produkcyjny handler wyboru), zamiast trafiać
kursorem w model 3D nakładający się na sąsiadów. Poprawiony bounded retry został
odrębnie autoryzowany.
