### R-WEB-POST-GRACE-UPKEEP-Q42 — Co ma się stać w 16. turze, gdy wojsko znowu kosztuje jedzenie?

**Sytuacja.** Przez pierwsze 15 tur barbarzyńcy nikogo nie atakują, a utrzymanie wojska gracza nic nie kosztuje. W 16. turze koszt wraca. Na najwyższym poziomie trudności gracz nie ma wtedy żadnego zapasu jedzenia. Dwie jednostki wojskowe kosztują około 32 Pieniędzy i 32 Żywności na turę, a skarbiec ma wtedy około 68–97 Pieniędzy. Przycisk „Zakończ turę” zostaje zablokowany z powodu żywności, a nie pieniędzy: po turze zabrakłoby około 16–18 Żywności. Jedyne wyjście, jakie znaleziono, to rozwiązanie jednostek wojskowych. Po rozwiązaniu miasto zostaje bez wojska (został tylko Zwiadowca). Obniżenie racji nie pomaga, bo suwak stoi już na minimum, a podatek nie daje jedzenia, choć komunikat o blokadzie wymienia obniżenie racji jako wyjście. Barbarzyńcy pojawiają się od 17. tury, w 30. turze jest ich 40–42. W obu zmierzonych grach nie zaobserwowano jednak żadnej obcej jednostki w promieniu 3 pól od miasta gracza do 30. tury, a miasto bez wojska żyło w 31. turze.

**Cel.** Ustalić, czy w 16. turze gracz ma być zmuszony do rozwiązania wojska, żeby grać dalej, czy gra ma dać mu łagodniejsze wyjście, i jakie.

**Dlaczego teraz.** Pierwsze 15 tur spokoju jest już w grze, a ten sam moment 16. tury czeka każdego gracza na najwyższym poziomie. W obu zmierzonych grach gracz został w nim zablokowany.

**Wariant A (Rekomendowane) — Pieniądze za wojsko wracają od 16. tury, jedzenie za wojsko jest darmowe jeszcze przez kilka tur.**
- Co zobaczy gracz: od 16. tury płaci normalny koszt w Pieniądzach, ale jedzenie za wojsko jest jeszcze przez kilka tur darmowe (propozycja: pięć tur; czy to wystarczy na cokolwiek, nie zmierzono). „Zakończ turę” się nie blokuje, a obrońca zostaje w mieście.
- Za: gracz nie traci obrońcy kupionego w 5. turze i nie musi nic rozwiązywać w 16. turze.
- Za: przejście do normalnych kosztów jest stopniowe, więc zgadza się z duchem pierwszych 15 spokojnych tur.
- Przeciw: problem tylko się odsuwa. Po tych turach jedzenie wraca w pełnej wysokości i gracz dalej musi mieć nadwyżkę żywności albo rozwiązać wojsko. Czy w tym czasie da się zbudować coś zwiększającego żywność, nie zmierzono (przyciski były nieaktywne).
- Przeciw: gracz dostaje dodatkową regułę do zapamiętania: Pieniądze i jedzenie za wojsko wracają w różnym tempie. Długość „kilku tur” jest wybrana bez pomiaru.
- Konsekwencja implementacyjna: osobny, krótszy okres darmowego utrzymania tylko dla części jedzeniowej kosztów wojska, nowy parametr długości tego okresu oraz zmiana komunikatu blokady. Zakres mały do średniego, jedno miejsce liczenia kosztów plus parametr i tekst.
- Konsekwencja testowa: testy darmowego utrzymania trzeba rozdzielić na część pieniężną i jedzeniową. Zmienią się oczekiwania testów blokady końca tury w 16. turze, dojdą testy długości okresu. Po wdrożeniu potrzebny jest ponowny pomiar na dwóch grach.

**Wariant B — Jak dziś: koniec tury zablokowany, gracz rozwiązuje wojsko (z poprawionym komunikatem).**
- Co zobaczy gracz: w 16. turze „Zakończ turę” czeka, aż gracz rozwiąże jedną lub dwie jednostki wojskowe. Komunikat przestaje podawać obniżenie racji jako wyjście, bo suwak jest już na minimum, i wprost mówi, że jedynym wyjściem jest rozwiązanie jednostki.
- Za: zero nowych reguł i zero ryzyka dla balansu.
- Za: w obu zmierzonych grach miasto bez wojska przeżyło do 31. tury i nie było obcych jednostek w promieniu 3 pól do 30. tury.
- Przeciw: gracz traci obrońcę kupionego za pieniądze w 5. turze. Jednostki są teraz cztery razy droższe, więc odbudowa kosztuje dużo.
- Przeciw: miasto zostaje bez wojska w chwili, gdy zaczynają się obozy barbarzyńców. Czy atak przyjdzie po 30. turze, nie zmierzono.
- Konsekwencja implementacyjna: tylko zmiana tekstu komunikatu blokady. Zakres bardzo mały.
- Konsekwencja testowa: testy samej blokady i kosztów utrzymania bez zmian, zmienią się tylko testy tekstu komunikatu.

**Wariant C — Bez blokady: brak jedzenia powoduje głód, a nie zatrzymanie tury.**
- Co zobaczy gracz: „Zakończ turę” działa zawsze. Gdy żywności brakuje, miasto głoduje i automatycznie traci coś (ludność albo jednostki; co dokładnie i ile na turę, trzeba dopiero ustalić). Gracz nie musi nic rozwiązywać, ale nie wybiera, co zginie.
- Za: tura nigdy się nie zatrzymuje i gracz nie jest zmuszony do natychmiastowej decyzji.
- Za: ta sama reguła obowiązuje wszystkich graczy w całej grze, a nie tylko po okresie spokoju.
- Przeciw: zamiast własnego wyboru gracz dostaje automatyczną stratę, która może dotknąć to, co chciał chronić.
- Przeciw: zmienia się reguła końca tury dla całej gry, a nie tylko dla 16. tury, i trzeba zaprojektować siłę głodu bez żadnego pomiaru. Co gra robi dziś poza blokadą, nie zmierzono.
- Konsekwencja implementacyjna: duża. Zmiana warunku końca tury, nowa reguła głodu (ile i kogo), nowe komunikaty.
- Konsekwencja testowa: zmiana wielu testów blokady końca tury i zapasu żywności, nowe testy głodu, ponowny pomiar na grach.

**Rekomendacja: wariant A.** Gracz nie traci obrońcy w 16. turze, zmiana jest mała i dotyczy tylko jedzenia, a pierwsze tury po okresie spokoju zgadzają się z wcześniejszą decyzją. Kosztem jest kolejna reguła i odroczony problem. Wariant B jest najtańszy, ale zostawia miasto bez wojska tuż przed pojawieniem się obozów barbarzyńców, a wariant C jest duży i niezmierzony. Ostateczne rozwiązanie po okresie łaski zależy od budowy zwiększającej żywność, której nie zmierzono.

Szczegóły: fakty pomiarowe w dyspozycje/autobot/runs/R-WEB-POST-GRACE-UPKEEP-Q42/FAKTY.md; koszty utrzymania jednostek w gra/src/game/ai-free-unit-upkeep.ts i gra/src/main.ts.
