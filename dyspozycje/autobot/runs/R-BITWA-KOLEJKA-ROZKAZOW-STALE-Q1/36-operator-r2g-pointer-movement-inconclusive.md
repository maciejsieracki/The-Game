# Operator R2-G — rozkaz rundy 2 wydany, ruch niepotwierdzony

**Wynik: FAIL testu asercji ruchu, lecz przyczyna nierozstrzygnięta; brak PASS.**

Run `392532-p32tid` przeszedł build, mapę, gate wodza, tempo 2/4/8/16, pierwszą
aktywację armii 28/28 i slowdown 8/4/2/1. Żywy trace osiągnął rundę 2, `turnIdx=1`
przy `_battleAwaitingOrders=false`. Rzeczywista karta rostera zaznaczyła `atk1`, a
zwykły klik mapy wydał rozkaz ruchu. Oczekiwana asercja `acted && order=move && q/r
changed` nie przeszła w ciągu 30 s.

Ostatni stan: `round=2`, `turnIdx=25`, kolejka pusta; `atk1` ma `acted=true`,
`playerOrder={type:"move", col:31, row:71}`, lecz pozycja pozostaje `q=30,r=74`.
Fixture przed kliknięciem odczytał pusty sąsiedni kafel `(31,74)`. Nie wiadomo, czy
jednostka zdążyła wykonać własną aktywację podczas 22-sekundowego wyboru karty, czy
przewinięcie rostera zmieniło ekranowe położenie mapy i klik trafił gdzie indziej.
Obie możliwości pozostają hipotezami. Brak błędów JS/konsoli.

Dowody: `evidence/operator-r2g-execution-trace.json`,
`evidence/operator-r2g-pointer-movement-failure.json` i `.png`. Proces zakończony;
brak aktywnego Chromium.

**Nie wykonano dead-ID probe, nie zaliczono E2E, nie commitowano produktu.** Przed
kolejnym testem należy wybierać gracza później w `turnOrder`, by pozostawić czas na
wybór karty, oraz po `scrollIntoViewIfNeeded()` ponownie wyznaczyć klik ekranowy kafla
na podstawie aktualnych granic canvas i zweryfikować `_pickGroundTile` tuż przed
kliknięciem. Kolejny test wymaga osobnej zgody orkiestratora.
