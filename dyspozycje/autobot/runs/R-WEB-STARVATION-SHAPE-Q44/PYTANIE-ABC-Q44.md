**R-WEB-STARVATION-SHAPE-Q44: co ma tracić gracz, gdy w państwie zabraknie żywności?**

**Sytuacja:** Zdecydowałeś, że przycisk „Zakończ turę" nie będzie blokowany z powodu żywności. Gdy zapas żywności spadnie poniżej zera, tura przejdzie normalnie, a państwo będzie głodne. Gra ma już dziś jeden rodzaj głodu, dotyczący wojska. Przy najwyższym poziomie trudności, gdy żywności brakuje, jednostki walczą o jedną czwartą słabiej. Po trzech kolejnych turach bez żywności każda jednostka traci co turę około jednej dziesiątej zdrowia (co najmniej jeden punkt). Według kodu sam brak żywności wojska nie zabiera mieszkańców miastom. Obliczenia modelu dotyczą gracza z dwiema jednostkami bojowymi i niedoborem ok. 16–18 żywności na turę, od 16. tury (wtedy kończy się początkowy okres bez kosztów utrzymania wojska). W tym modelu pierwsza jednostka ginie w 27. turze, a do 30. tury ginie jedna albo dwie. Nie sprawdzono tego w prawdziwej grze.

**Cel:** wybrać, co dokładnie gracz traci, gdy brakuje żywności, i w jakim tempie.

**Dlaczego teraz:** po zdjęciu blokady ten moment stanie się osiągalny w każdej grze. Dziś nikt świadomie nie wybrał, jak ma wyglądać kara.

**Wariant A: zostawić głód, który już jest (Rekomendowane)**
- Co zobaczy gracz: bez żywności wojsko słabnie w walce od pierwszej tury. Od trzeciej tury jednostki tracą zdrowie. Pierwsza ginie około 27. tury (w obliczeniach). Miasta niczego nie tracą.
- Za: nie powstają nowe zasady, więc ryzyko błędu jest najmniejsze.
- Za: nie zabiera mieszkańców, więc nie rozkręca spirali (mniej mieszkańców, mniej produkcji, jeszcze większy brak).
- Za: nie usuwa od razu obrońcy miasta, a gracz może sam rozwiązać jednostki lub zwiększyć żywność.
- Przeciw: kara jest powolna i późna. Gracz może jej długo nie zauważyć, a jednostka znika bez jego wyboru.
- Przeciw: w danych z pierwszych 30 tur nie zaobserwowano ataku na gracza, więc osłabienie w walce może w ogóle nie zostać odczute.
- Konsekwencja implementacyjna: zdjąć blokadę końca tury i dopisać czytelny komunikat o głodzie wojska. Najmniejsza praca z trzech wariantów (dokładnie nie oszacowano).
- Konsekwencja testowa: testy pilnujące blokady trzeba przepisać na przejście tury z ujemnym zapasem. Testy głodu wojska zostają bez zmian.

**Wariant B: miasta bez żywności tracą mieszkańców (dodatkowo do głodu wojska)**
- Co zobaczy gracz: w podsumowaniu tury pojawi się informacja, że miasto traci mieszkańca. Każde miasto bez żywności traci jednego mieszkańca na turę, a jego wzrost się zatrzymuje. Wojsko dalej głoduje jak w A. Według obliczeń miasto traci od dwóch do siedmiu mieszkańców do 30. tury, zależnie od wielkości w 16. turze (nie zmierzono).
- Za: kara jest od razu widoczna w liczbach miasta i uderza w to, co gracz rozwija.
- Za: daje wyraźny powód, by dokarmiać miasta, a wojsko przestaje być jedynym miejscem, gdzie głód boli.
- Przeciw: spirala (mniej mieszkańców, mniej produkcji, większy brak). Małe miasto może stracić prawie całą ludność. Skali spirali nie zmierzono.
- Przeciw: kara uderza w rozwój miast, a nie w wojsko, które powoduje brak, i dochodzi do osłabienia wojska zamiast je zastępować.
- Konsekwencja implementacyjna: zmienić kolejność rozliczania żywności, tak by koszt wojska liczył się przed karmieniem miast. Mała lub średnia praca, ok. 1–2 dni.
- Konsekwencja testowa: testy ubytku ludności i karmienia miast trzeba poprawić. Testy blokady zmieniają się jak w A.

**Wariant C: najsłabsza jednostka znika automatycznie**
- Co zobaczy gracz: w pierwszej turze, w której brakuje żywności (w obliczeniach 16.), jedna albo dwie najsłabsze jednostki (o najmniejszym zdrowiu) znikają same, bez ochrony obrońcy miasta. Potem głodu już nie ma (według obliczeń). Gracz może wcześniej sam rozwiązać wybraną jednostkę.
- Za: kara jest szybka i jasna, bez długiego osłabienia.
- Za: po jednorazowej stracie zapas wraca do dodatniego, więc spirala się nie zaczyna.
- Za: gracz może temu zapobiec, wybierając jednostkę sam.
- Przeciw: automat może usunąć jedynego obrońcę miasta. Komputerowi przeciwnicy takiej straty nie ponoszą, bo ich obrońcy są chronieni.
- Przeciw: od 17. tury pojawiają się obozy barbarzyńców. W danych nie zaobserwowano ataku na gracza do 30. tury, ale to nie jest gwarancja.
- Przeciw: gracz, który nie zdąży zareagować, traci jednostki bez wyboru. Przy małej armii może to być cała armia.
- Konsekwencja implementacyjna: nowa reguła przed rozliczeniem żywności, wzorowana na regule komputerowych przeciwników, ale bez ich ochrony obrońców. Średnia praca, ok. 2–3 dni. Ewentualna ochrona obrońcy byłaby osobną decyzją i dodatkową pracą.
- Konsekwencja testowa: testy blokady znikają lub zmieniają się na nowe oczekiwania. Trzeba dopisać testy wyboru jednostki i porównanie z zachowaniem komputerowych przeciwników.

**Rekomendacja: wariant A.** Działa na zasadach, które już są. Nie wymaga liczb, których nie zmierzono (wielkość miast, spirala), i nie ryzykuje spirali w miastach ani utraty obrońcy bez ochrony. Ryzyko jest jawne: kara może być zbyt powolna i niewidoczna. Wtedy można ją później zaostrzyć wariantem B lub C na podstawie pomiaru w prawdziwej grze.

**Nie zmierzono:** żadnego wariantu w prawdziwej grze; wielkości miast w 16. turze; zachowania komputerowych przeciwników bez blokady; ataków barbarzyńców w czasie głodu; niższych poziomów trudności; wielkości spirali w B; rozbieżności między niedoborem na ekranie (30) a w komunikacie (18).

Szczegóły: decyzja Q42 = C; blokada w gra/src/main.ts l. 43739–43742; głód wojska i żywność w gra/src/game/empire-food.ts l. 290–316 i gra/src/main.ts l. 44340–44375; automat komputera gra/src/main.ts l. 7945–7992; ubytek ludności gra/src/game/population-growth-v85.ts l. 385–410, 572–580; model gra/tools/starvation-model.cjs (wynik: dyspozycje/autobot/runs/R-WEB-STARVATION-DESIGN-Q42C/model-output.txt); testy do zmiany: endgate-lever-baseline-test.cjs, no-negative-stocks-end-turn-gate-levers-test.cjs, end-turn-gate-projection-only-test.cjs; źródło: dyspozycje/autobot/runs/R-WEB-STARVATION-SHAPE-Q44/FAKTY.md.
