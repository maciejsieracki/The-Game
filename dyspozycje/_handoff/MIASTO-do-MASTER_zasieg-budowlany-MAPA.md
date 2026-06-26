# PACZKA: MIASTO -> MASTER (rozdziel do MAPA) : ZASIEG BUDOWLANY per struktura
Data: 2026-06-24. MAPA "nie ogarnia tematu" -> MIASTO (wlasciciel liczb zasiegu/granic) rozpisuje model.
MIASTO trzyma LICZBY; MAPA EGZEKWUJE na mapie (podswietlanie pol + blokada poza zasiegiem).

## MODEL ZASIEGU BUDOWLANEGO (gdzie w ogole wolno budowac)
- Zasieg budowy = SUMA terytoriow WSZYSTKICH Twoich miast + posterunkow.
- Budowac mozna WYLACZNIE w zasiegu. Poza zasiegiem: brak zielonego podswietlenia, klik nie dziala.
  Dotyczy: MIAST, POSTERUNKOW, FORTOW, ULEPSZEN i DROG.
- Ekspansja LANCUCHOWA: posterunek lub miasto stawiasz na KRAWEDZI obecnego zasiegu -> zasieg rosnie o jego
  promien, granica "pelznie" dalej. Pierwsze miasto = ziarno startowego terytorium.

## TABELA: co rozszerza zasieg budowy i o ile
| Struktura | Rozszerza zasieg budowy? | Promien | Epoka | Uwagi |
|---|---|---|---|---|
| **Miasto** | TAK (ziarno) | **r = 10** (okolica robocza ~331 heksow; bylo 10x10/r5 + 5 z kazdej strony) | start | kazde miasto startuje na L1; dodatkowo dystans **>=5** od innych miast |
| **Posterunek (Straznica)** | TAK | **+5** | Braz | glowne narzedzie ekspansji poza miasto; wezel sieci drog + wizja; BEZ plonow; koszt 30 Pracy |
| **Fort** | **TAK** | **+10** | Zelazo | rozszerza terytorium o r=10; stawiany w istniejacym terytorium; +100% obrony jednostek OBOZUJACYCH (= lane UNITS) |

## LICZBY (zrodlo = MIASTO; MAPA czyta/egzekwuje)
- Miasto: promien terytorium budowy = **10** = `miasto-params.zasieg_okolicy_miasta` (bylo 5; rozszerzone o +5 z kazdej strony).
- Posterunek: rozszerza o **5** = `terrain-improvements.posterunek.zasieg_posterunku` (zaktualizowane z 3 na 5; epoka Braz).
- Dystans miast: **>=5** = `miasto-params.min_dystans_miast`.
- Fort: rozszerza zasieg budowy/terytorium o **10** = `terrain-improvements.fort.zasieg_pol` (=zasieg_kontroli=10).

## PODSWIETLANIE (logika dla MAPA)
Pole ZIELONE (wolno) = (a) jest w ZASIEGU (suma terytoriow miast r5 + posterunkow +5) ORAZ (b) spelnia warunek struktury:
- Miasto: lad (nie morze/gory) + dystans >=5 od innych miast.
- Ulepszenie: wlasciwy teren/surowiec (patrz terrain-improvements.json: teren + warunek; irygacja TYLKO przy rzece).
- Droga: tylko miedzy miastami i posterunkami.
- Fort: tylko w istniejacym terytorium.
Inaczej: pole nie-zielone, klik nie dziala.

## ROZSTRZYGNIETE (decyzja Naster 2026-06-25): WSZYSTKIE 3 struktury ROZSZERZAJA terytorium (zasieg budowy):
- Miasto **r=10**, Posterunek **+5** (Braz), Fort **+10** (Zelazo). ZASIEG CYWILIZACJI = suma tych terytoriow.
- Tylko w tym zasiegu mozna budowac ULEPSZENIA/DROGI/MIASTA -- to teren tej cywilizacji. MAPA egzekwuje calosc.
- DOSTEP do surowca = (a) zloze + kopalnia/ulepszenie NA NIM w zasiegu cywilizacji, + (b) budynek przetworczy w miescie.

BONUSY OBRONY (mur +200%, fort +100%, posterunek +50% dla jednostek obozujacych) = NIE MAPA -> lane UNITS/walka.
