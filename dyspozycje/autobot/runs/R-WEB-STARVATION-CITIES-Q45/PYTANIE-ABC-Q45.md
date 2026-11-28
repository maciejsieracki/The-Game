# R-WEB-STARVATION-CITIES-Q45: czy miasto ma tracić mieszkańców, gdy państwu zabrakło żywności

**Sytuacja:** Wspólny zapas żywności państwa bywa wykorzystany do końca. Jeśli wtedy miasto samo produkuje mniej żywności, niż zjadają jego mieszkańcy, nie zostaje nakarmione. Traci wtedy jednego mieszkańca w każdej turze i przestaje rosnąć. Wcześniej gra nie pozwalała zakończyć tury w takiej sytuacji, więc gracz tego nie widział. Teraz koniec tury nie jest już blokowany z powodu żywności, więc ten przypadek może się pojawić w zwykłej rozgrywce. Jak często to się zdarza w prawdziwej grze, nie zmierzono. Niedobór żywności samego wojska nie zabiera miastom mieszkańców. Zabiera ich tylko niedobór samego miasta.

**Cel:** Ustalić, co ma się dziać z ludnością miasta, które samo nie wyżywi mieszkańców, gdy państwo nie ma już zapasu.

**Dlaczego teraz:** Obecne zachowanie już działa. Gracz może trafić na ten przypadek, zanim zapadnie decyzja. Bez wyboru zostaje dzisiejsze zachowanie, czyli wariant B.

**A. Mieszkańcy chronieni (Rekomendowane).** Miasto z własnym niedoborem żywności, gdy państwo nie ma zapasu, nie traci mieszkańców. Przestaje tylko rosnąć, dopóki jego bilans żywności nie wróci na plus.
- Co zobaczy gracz: liczba mieszkańców się nie zmniejsza, ale miasto stoi w miejscu i nie rośnie.
- Za: gracz nie traci ludności w zdarzeniu, którego dotąd nie widział i którego częstość jest nieznana.
- Za: jest to spójne z wcześniejszą decyzją właściciela, że niedobór żywności wojska nie zabiera mieszkańców.
- Przeciw: na najwyższym poziomie trudności to najłagodniejsza z trzech opcji, bo pusty zapas państwa kosztuje tylko wstrzymany wzrost.
- Przeciw: gracz może nie zauważyć stojącego miasta i mniej przejmować się pustym zapasem.
- Konsekwencja implementacyjna: trzeba zmienić regułę kary dla nienakarmionych miast, tak aby blokowała wzrost, ale nie zabierała mieszkańca. Zmiana jest mała i dotyczy tylko mechaniki ludności miast. Nie dotyka zapasów państwa ani armii. Dokładnego nakładu pracy nie oszacowano.
- Konsekwencja testowa: sprawdzenia, które dziś oczekują utraty mieszkańca przy pustym zapasie, trzeba zmienić na brak utraty. Dochodzi sprawdzenie zatrzymanego wzrostu. Innych skutków nie zmierzono.

**B. Zostaje jak jest.** Miasto z własnym niedoborem żywności, gdy państwo nie ma zapasu, traci jednego mieszkańca w każdej turze i nie rośnie.
- Co zobaczy gracz: liczba mieszkańców spada o jednego na turę, aż miasto się wyżywi albo wyludni.
- Za: jest to wyraźna kara za miasto bez dość żywności. Wzmacnia to presję na rozbudowę produkcji na najwyższym poziomie trudności.
- Za: nie wymaga żadnej pracy ani zmian w grze, bo działa od zdjęcia blokady końca tury.
- Przeciw: dwa rodzaje niedoboru dają różne skutki. Niedobór wojska nie zabiera mieszkańców, a niedobór miasta zabiera.
- Przeciw: gracz może odebrać nieoczekiwaną utratę mieszkańców jak błąd gry. Przy kilku miastach w niedoborze gospodarka może szybko się kurczyć, ale częstość zjawiska nie została zmierzona.
- Konsekwencja implementacyjna: brak zmian w logice gry. Ewentualny komunikat dla gracza o głodującym mieście byłby osobną pracą.
- Konsekwencja testowa: obecne sprawdzenia zostają zgodne. Można dodać sprawdzenie utrwalające utratę mieszkańca.

**C. Utrata lżejsza i rzadsza.** Miasto z własnym niedoborem żywności, gdy państwo nie ma zapasu, traci mieszkańca rzadziej niż co turę, a jego wzrost stoi. Odstęp między stratami nie jest ustalony ani zmierzony. Zostałby zaproponowany osobnym pytaniem po pomiarze w żywej grze.
- Co zobaczy gracz: spadki liczby mieszkańców zdarzają się od czasu do czasu, a nie co turę.
- Za: kara nadal istnieje, ale nie zjada miasta w kilka tur.
- Za: jest to kompromis między ochroną ludności a utrzymaniem kary.
- Przeciw: gracz nie wie, czego się spodziewać, a sam odstęp wymaga najpierw pomiaru i nowej decyzji.
- Przeciw: trudniej to wyjaśnić graczowi niż A lub B, a niedobór miasta nadal zabiera mieszkańców, czego niedobór wojska nie robi.
- Konsekwencja implementacyjna: każde miasto musi liczyć tury od ostatniej straty. To większa zmiana niż w A i B. Nakładu pracy nie oszacowano.
- Konsekwencja testowa: potrzebne są nowe sprawdzenia licznika tur i pomiar w żywej grze przed zamknięciem tematu. Dochodzą zmiany oczekiwań dla pierwszych tur głodu.

**Rekomendacja: A.** Zjawisko nie zostało zmierzone w żywej grze i gracz dotąd go nie widział, więc nie da się wykluczyć, że uderzy zbyt często i zbyt mocno. Właściciel już zdecydował, że niedobór żywności wojska nie zabiera mieszkańców. Wariant A trzyma tę samą zasadę ochrony ludności i nie wymaga nowego parametru. Wzrost stojący w miejscu nadal jest widocznym sygnałem problemu. Cena: to najłagodniejszy z trzech wariantów, więc jeśli właściciel chce, by niedobór żywności w mieście był odczuwalnie karany, właściwym wyborem jest B (najmocniejsza kara) albo C (kara pośrednia, po pomiarze).

Szczegóły: temat R-WEB-STARVATION-CITIES-Q45. Źródło faktów: `dyspozycje/autobot/runs/R-WEB-STARVATION-CITIES-Q45/FAKTY.md`. Decyzje wiążące: Q42=C, Q44=A. Mechanika kary: `gra/src/game/population-growth-v85.ts` (`applyHungerPenaltyV85`, l. 385–410, wywołanie l. 572–580). Ustalenie "nienakarmione": `gra/src/game/empire-food.ts` l. 260–275, zapas przycinany do 0 w l. 294–297. Pomiar mechanizmu (zapas 0, miasto z bilansem -2 na turę): tury 1–3, kara dla ludności 5 daje 4. Nie zmierzono: częstość zjawiska w żywej grze oraz skutki dla gospodarki przy wielu głodujących miastach.
