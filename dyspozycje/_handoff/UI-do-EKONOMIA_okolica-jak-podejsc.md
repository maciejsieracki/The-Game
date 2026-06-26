# [NIEAKTUALNE 2026-06-25 — EKONOMIA juz odpowiedziala: EKONOMIA-do-UI_okolica-nastroje.md. Kontrakt danych ustalony. Pozostaje TYLKO decyzja o RENDERZE (panel vs mapa) = Maciej/MAPA, nie EKONOMIA.]
# PRZEGADANIE UI <-> EKONOMIA (przez Maciej): jak podejsc do OKOLICY miasta (zasieg rosnie z rozwojem)  [2026-06-25]

Ustalenie Maciej: RENDER okolicy = robota UI (nie MIASTO). Model zasiegu (MIASTO, Zasieg-miasta-okolica.html):
- okolica robocza wg POPULACJI: pop<5 -> r5 (91 pol), pop>=5 -> r10 (331), pop>=10 -> r15 (721),
- granica kulturowa: +0..3 pierscienie (progi 100/250/500) -> do r18.
Czyli zasieg jest DUZY i rosnie z rozwojem. Zanim wpne render, ustalmy z Wami PODEJSCIE:

1. DANE per miasto — co EKONOMIA wystawia UI? (wybierzcie/zaproponujcie)
   (a) getCityRange(cityId) => { workedRadius: 5|10|15, cultureRings: 0..3 } — UI sam generuje pierscienie heksow.
   (b) getWorkedTiles(cityId) => { q, r, zywnosc?, praca?, handel?, obrabiane? }[] — silnik podaje DOKLADNE pola (z plonami),
       UI tylko rysuje. Wierniejsze (mockup pokazuje plony per heks), ale przy r15 to ~721 obiektow/miasto.
   Co preferujecie pod katem wydajnosci i zrodla prawdy?

2. PLONY per pole — czy EKONOMIA liczy plony z CALEJ okolicy roboczej (r5/10/15), czy dzis turn-economy.workedTilesForCity
   bierze tylko CENTRUM+6 sasiadow (r1)? Jesli docelowo cala okolica — to duza zmiana po Waszej stronie; jaki plan na v0.1?

3. GDZIE rysowac duza okolice (kluczowe "jak podejsc"):
   (a) pelny render siatki w PANELU miasta (zoom/scroll, bo r15+ jest duze), albo
   (b) okolica/terytorium na MAPIE SWIATA (dzial MAPA), a panel miasta = tylko KOMPAKTOWE podsumowanie
       (promien + liczba pol + zbiorczy bilans), bez pelnej siatki.
   REKOMENDACJA UI do przedyskutowania: panel = kompaktowo; pelna okolica/terytorium na mapie swiata (MAPA).

4. SCOPE v0.1 — renderujemy pelny zasieg od razu, czy zaczynamy od mniejszego i skalujemy, by nie przeciazyc UI/wydajnosci
   przy 721+ polach? (Dzis panel rysuje mala siatke r2 — placeholder.)

CEL: ustalic (1) kontrakt danych, (2) zrodlo plonow, (3) podzial renderu panel-vs-mapa. Po tym wpne render okolicy
po wlasciwej stronie (zgodnie z zasada: zero nowego UX bez potwierdzenia podejscia).
