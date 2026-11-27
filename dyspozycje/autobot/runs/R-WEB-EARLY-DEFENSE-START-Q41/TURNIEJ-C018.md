# Turniej C-018 — R-WEB-EARLY-DEFENSE-START-Q41

Zwycięzca: SYNTEZA

## Naruszenia wykryte przez Sędziego

PROJEKT 1:
- Wariant C zawiera twierdzenie spoza faktów: „na Łatwych barbarzyńcach przeżywa większość sprawdzonych gier”. Takiego pomiaru nie ma w danych, więc wymyślono go. To naruszenie zgodności z faktami.
- Linia „Konsekwencja testowa” wariantu A używa nazwy własnej („testy bramki Skarbu”) poza linią „Szczegóły:”. Zasada mówi, że nazwy mogą być tylko w „Szczegóły:”.
- Wariant A łączy dwa mechanizmy w jednym wariancie: jednostkę startową i czasowe zwolnienie z utrzymania. Skutek dla gracza jest jednak jeden, więc nie jest to naruszenie, tylko ryzyko dla zasady „jedno pytanie = jedna decyzja”. Pakiet trzeba nazwać wprost i uzasadnić.
- Brak jawnego wyjaśnienia, dlaczego nie ma wariantu „sama jednostka startowa bez zwolnienia z utrzymania”. Z pomiarów wynika, że utrzymanie ok. 16 Pieniędzy i 16 Żywności na turę blokuje „Zakończ turę” już w turach 6–7.
- Liczba 15 tur zwolnienia jest podana bez uzasadnienia. Trzeba zaznaczyć, że to wartość wyjściowa.
- Poza tym projekt jest mocny: rekomendacja jest pierwsza z dopiskiem, każdy wariant ma ≥2 za i ≥2 przeciw, są konsekwencje implementacyjna i testowa, a język jest zrozumiały.

PROJEKT 2:
- Rekomendowany wariant (B) stoi na drugim miejscu, a zasada wymaga, żeby rekomendowana opcja była pierwsza z dopiskiem „(Rekomendowane)”. Wariant A to „Bez zmian”.
- Rekomendowany wariant to sam Wojownik na starcie, bez zwolnienia z utrzymania. Zmierzone fakty temu przeczą: utrzymanie jednostki przy kosztach ×4 blokuje „Zakończ turę” już w turach 6–7, a dochód wynosi tylko od +1 do +8. Projekt traktuje to jako „NIE_ZMIERZONO” i nie jako prawdopodobny, wcześniej zaobserwowany problem. Argument „poziom normalny tak startuje, więc to sprawdzony wzorzec” jest słaby, bo na normalnym ceny są niższe.
- Do pytania dla właściciela trafiła uwaga techniczna o dostępności plików analiz („pliki analiz nie były dostępne w tym środowisku…”). To meta-komentarz procesowy, który nie powinien być pokazany właścicielowi.
- Wariant A ma słabe „Za” („żadna praca, nic nie może się zepsuć”), które jest powtórzeniem pierwszego.
- Wariant C ma słaby argument „pasuje do opcji barbarzyńcy: brak”. To nie jest zaleta tego wariantu.
- Sprawdzian „usuń nazwy własne” jest w gruncie rzeczy spełniony. Jedynym wyjątkiem jest zdanie „Test porównujący liczbę jednostek startowych…” w konsekwencji testowej, które jest dopuszczalne, ale lepiej przenieść je do „Szczegóły:”.
- Rekomendacja warunkowo odsyła do kolejnego pytania o utrzymanie. To oznacza dwa pytania zamiast jednego rozstrzygnięcia.

Wniosek: złożono pytanie z wariantu A projektu 1 (pakiet: jednostka + zwolnienie z utrzymania) oraz czystej struktury i języka projektu 2. Usunięto wymyślone twierdzenie o poziomie Łatwym, meta-uwagę o plikach i nazwy własne spoza „Szczegóły:”. Dodano uzasadnienie, dlaczego nie wybrano samego Wojownika bez zwolnienia z utrzymania.

## Projekt 1

**R-WEB-EARLY-DEFENSE-START-Q41 — czy na maksymalnym poziomie gracz ma mieć realną szansę obronić pierwsze miasto przed barbarzyńcami w pierwszych ok. 15 turach, i jeśli tak, jak?**

**Sytuacja (co się dzieje w grze).** Na maksymalnych ustawieniach (poziom Trudny, koszty jednostek Wysoki ×4, kultura trudna, barbarzyńcy Trudni) gracz zaczyna z jednym Zwiadowcą i bez żadnej jednostki bojowej. Pasywny gracz traci jedyne miasto na rzecz barbarzyńców przed turą 20 w 4 z 5 sprawdzonych gier (w turach 10, 13, 16 i 10; w piątej przeżywa do tury 21). Kupić obrońcę się nie da: najtańszy kosztuje 12 Pieniędzy i 13 Drewna, a w 3 z 5 gier przez pierwsze 12 tur gracz nie ma w ogóle Drewna. Tam, gdzie Drewno jest, obrońca kupiony w 5. turze (przy całym podatku na Pieniądze) tak drogo kosztuje w utrzymaniu (około 16 Pieniędzy i 16 Żywności na turę przy dochodzie od +1 do +8), że gra w 6.–7. turze blokuje „Zakończ turę”. Komputer w turach 1–40 nie płaci za utrzymanie swoich jednostek wojskowych. Gdy barbarzyńców wyłączymy, gracz bez trudu przeżywa 20 tur.

**Cel.** Na maksimum gracz przegrywa z powodu własnych decyzji (zły wybór lokalizacji, spóźniona obrona, brak planu), a nie dlatego, że gra nie dała mu żadnej możliwości zareagowania. Jednocześnie maksimum ma pozostać wyraźnie najtrudniejsze, z kosztami ×4 jako prawdziwą trudnością.

**Dlaczego teraz.** Każdy test i każda ocena balansu na maksimum zaczyna się od tej samej sytuacji: w większości gier pierwsze miasto ginie, zanim gracz zdąży cokolwiek zrobić. Dopóki tego nie rozstrzygniemy, nie da się uczciwie ocenić reszty trudności maksimum.

**Pytanie jest tylko o to jedno:** czy i w jaki sposób przywrócić graczowi realną szansę obrony pierwszego miasta w pierwszych kilkunastu turach.

---

**A. Start z jedną jednostką bojową, a jej utrzymanie przez pierwsze 15 tur gracz ma za darmo, jak komputer (Rekomendowane)**

Co zobaczy gracz: od pierwszej tury w mieście stoi jeden Wojownik, a przez pierwsze 15 tur nie płaci za jego utrzymanie. Po 15. turze utrzymanie normalnie obciąża dochód (przy kosztach ×4), więc musi zdecydować, czy ją zatrzymać, czy rozbudować gospodarkę i wojsko.
Za:
- Obrona nie zależy od tego, czy na mapie akurat jest Drewno. Rozwiązuje to wszystkie 3 przypadki z 5, w których dziś kupić nie można niczego.
- Zwolnienie z utrzymania usuwa dokładnie tę przeszkodę, która dziś zatrzymuje kupionego obrońcę już w 6.–7. turze. Sama jednostka na starcie bez tego zwolnienia mogłaby grę zablokować.
- Gracz wciąż ma o co grać: jedna jednostka nie gwarantuje obrony, więc musi ją dobrze ustawić i szybko dozbroić.
- Zasada „pierwsze jednostki są za darmo” już działa u komputera, więc gracz przestaje być traktowany gorzej niż rywal.
Przeciw:
- Maksimum robi się łagodniejsze na samym początku (jak poziom Normalny), a nie wiemy, czy jeden Wojownik realnie wytrzyma pierwszy atak barbarzyńców. Tego nie zmierzono.
- Po 15. turze utrzymanie znów uderza w dochód, więc „ściana” blokady „Zakończ turę” może się tylko przesunąć w czasie, jeśli gracz nic nie zrobi.
- Dochodzi nowy wyjątek od zasady „koszty ×4 to trudność” dla pierwszych tur, o którym trzeba poinformować gracza.
Konsekwencja implementacyjna: zmiana liczby jednostek startowych dla poziomu Trudnego z zera na jedną oraz nowe, ograniczone w czasie zwolnienie z utrzymania dla jednostek gracza (analogiczne do tego, które ma komputer). Praca niewielka do średniej, dotyka tylko startu nowej gry i rozliczania utrzymania. Nie dotyka mapy ani barbarzyńców.
Konsekwencja testowa: zmienią się testy startowego składu jednostek i testy bramki Skarbu na maksimum. Trzeba będzie na nowo zmierzyć przeżywalność na tych samych 5 światach (próg przeżycia do tury 15).

**B. Gracz nadal startuje bez jednostki bojowej, ale barbarzyńcy w pierwszych ok. 15 turach nie atakują albo atakują znacznie słabiej**

Co zobaczy gracz: pierwsze ok. 15 tur jest spokojnych, mimo że barbarzyńcy są ustawieni na Trudnych. Gracz ma czas znaleźć Drewno, zebrać Pieniądze i kupić pierwszego obrońcę własnym tempem. Później barbarzyńcy wracają w pełnej sile.
Za:
- Koszty jednostek ×4 pozostają nietknięte: obrońcę nadal trzeba mądrze kupić, co zachowuje wybór gracza i charakter maksimum.
- Nie trzeba dotykać zasad utrzymania ani składu startowego, a samo opóźnienie jest proste do wytłumaczenia graczowi.
Przeciw:
- Nie rozwiązuje problemu braku Drewna: w 3 z 5 gier przez 12 tur nie ma go wcale, więc po wygaśnięciu spokoju gracz może nadal nie mieć czym się bronić, a bariera po prostu się przesunie. Nie zmierzono, jak długo Drewna może nie być.
- „Trudni barbarzyńcy” przez pierwszą część gry przestają coś znaczyć, a gracz uczy się, że pierwsze tury są bezpieczne, po czym ginie zaskoczony później.
- Nadal nie rozwiązuje blokady „Zakończ turę” po kupieniu obrońcy w 5. turze.
Konsekwencja implementacyjna: zmiana harmonogramu pierwszych najazdów barbarzyńców (siła i moment pojawienia się) tylko na poziomie maksymalnym. Praca średnia, dotyka zachowania barbarzyńców, które wpływa też na ocenę balansu w innych miejscach.
Konsekwencja testowa: zmienią się testy i pomiary czasu pierwszego ataku barbarzyńców oraz testy przeżycia na maksimum. Trzeba zmierzyć na tych samych 5 światach, czy po wygaśnięciu spokoju gracz w ogóle ma środki na obronę.

**C. Bez zmian: maksimum zostaje takie, jakie jest**

Co zobaczy gracz: na maksimum w większości gier pierwsze miasto ginie przed 20. turą, jeśli gracz nie ma szczęścia do Drewna. Aby grać dłużej, musi sam obniżyć siłę barbarzyńców w ustawieniach nowej gry (na „Łatwych” przeżywa większość sprawdzonych gier) albo ich wyłączyć.
Za:
- Zero pracy i zero ryzyka regresji. Maksimum pozostaje jawnie bezlitosne, zgodnie z wcześniejszą decyzją, że koszty ×4 mają być faktyczną trudnością.
- Gracz, który wybiera „wszystko na maksimum”, dostaje dokładnie to, o co prosił.
Przeciw:
- W 4 z 5 gier gracz przegrywa nie przez własną decyzję, lecz dlatego, że nie ma jak się bronić (nie ma Drewna albo nie stać go na utrzymanie). To nie jest trudność, tylko brak wyboru.
- Wszystkie testy na maksimum nadal startują ze skrajnej sytuacji, więc pomiary balansu pozostają zniekształcone tą jedną przyczyną.
- Zwolnienie z utrzymania, którym cieszy się komputer, dalej jest przywilejem rywala, którego gracz nie dostaje.
Konsekwencja implementacyjna: brak zmian w grze; ewentualnie tylko krótka informacja przy wyborze poziomu maksymalnego.
Konsekwencja testowa: brak zmian w testach; pomiary na maksimum dalej wymagają ręcznego obchodzenia tej sytuacji.

---

**Rekomendacja: A.** Jest to jedyny wariant, który jednocześnie usuwa obie przyczyny braku wyboru: brak Drewna (daje obrońcę od razu) i brak możliwości zapłacenia za jego utrzymanie (zwolnienie przez 15 tur). Zachowuje przy tym koszty ×4 jako prawdziwą trudność od 16. tury. B przesuwa problem w czasie, bo nadal nie wiemy, czy Drewno się pojawi, a C zostawia graczowi przegraną, której nie mógł uniknąć. Przed wdrożeniem A trzeba zmierzyć, czy jeden Wojownik na każdym z pięciu światów faktycznie pozwala przetrwać pierwszy atak. Jeśli nie, wrócimy do Ciebie z kolejnym pytaniem.

Szczegóły: dane pomiarowe w dyspozycje/analizy/OBRONA-STARTU-WERYFIKACJA-2026-11-27.md, OBRONA-STARTU-MAKSIMUM-LUKI-2026-11-27.md i OBRONA-STARTU-GRACZ-ROZSADNY-2026-11-27.md (tabela jednostek startowych: łatwy 2 Wojowników, normalny 1, trudny 0). Zwolnienie z utrzymania jednostek AI w turach 1–40: decyzja FALA 890. Warianty A/B wymagają ponownego uruchomienia pomiarów realdef-econ-live / verify na 5 ziarnach (4242, 7, 778899, 11, 2024) w konfiguracji max; testy bramki Skarbu i testy startowego składu jednostek do aktualizacji w A; testy harmonogramu najazdów barbarzyńców w B. W żadnym wariancie nie dotykać zasady „domyślna gra: pasywny gracz nie przechodzi tury 1” (zamierzone wg analizy bramki żywności).

## Projekt 2

## R-WEB-EARLY-DEFENSE-START-Q41 — Czy na najwyższym poziomie trudności gracz ma mieć realną szansę obronić pierwsze miasto przed barbarzyńcami?

**Sytuacja (co się dzieje w grze).** Na maksymalnych ustawieniach (poziom trudności Trudny, koszty jednostek x4, kultura trudna, barbarzyńcy Trudni) gracz zaczyna z jednym Zwiadowcą i bez żadnej jednostki bojowej. Barbarzyńcy zdobywają jego jedyne miasto przed 20. turą w 4 z 5 sprawdzonych gier. Padało ono w turach 10, 13, 16 i 10. W piątej grze miasto przetrwało do tury 21. Gdy gracz tylko rozbudowuje się i nie robi nic innego, nie ma czym się bronić:
- Najtańszy obrońca kosztuje 12 Pieniędzy i 13 Drewna.
- W 3 z 5 gier przez pierwsze 12 tur w okolicy nie ma w ogóle Drewna, więc obrońcy nie da się kupić.
- Tam, gdzie Drewno jest, obrońca kupiony w 5. turze (podatek 100% na Pieniądze, Nauka 0%) potrafi zablokować przycisk „Zakończ turę" w turach 6–7. Utrzymanie to około 16 Pieniędzy i 16 Żywności na turę, a dochód wynosi tylko od +1 do +8. Gra pokazuje wtedy komunikat „Nawet maksymalny podatek nie wystarczy".
- Przy wyłączonych barbarzyńcach gracz przeżywa 20 tur bez problemu.

Komputer ma natomiast darmowe utrzymanie wojska w turach 1–40 (Twoja wcześniejsza decyzja). Poziom normalny startuje z 1 Wojownikiem, a łatwy z 2.

**Cel.** Ustalić, czy na maksymalnym poziomie pierwsze miasto gracza ma mieć realną szansę przetrwać pierwsze ok. 15 tur, a jeśli tak, w jaki sposób. Nie zmieniamy przy tym Twoich wcześniejszych decyzji: koszty x4 mają być prawdziwą trudnością, a komputer zachowuje darmowe utrzymanie.

**Dlaczego teraz.** Poziom maksymalny jest tym, na którym testujemy grę zawsze. Dziś w 4 z 5 gier kończy się ona w 10–16 turze, zanim gracz zdąży cokolwiek zbudować. Wszystkie dalsze pomiary balansu na tym poziomie są przez to mało wiarygodne.

---

### A. Bez zmian
**Co zobaczy gracz:** na maksymalnym poziomie nadal zaczyna bez wojska. Zwykle traci miasto między 10. a 16. turą. Jedynym ratunkiem jest szczęśliwy układ terenu z Drewnem w pobliżu i bardzo precyzyjna gospodarka.
- Za: zero ryzyka dla balansu i dla zapisanych wyników testów. Trudny pozostaje „naprawdę trudny", zgodnie z Twoją decyzją o kosztach x4.
- Za: żadna praca, nic nie może się zepsuć.
- Przeciw: w 4 z 5 gier gracz przegrywa, zanim cokolwiek zrobi. Poziom wygląda jak błąd, a nie jak wyzwanie.
- Przeciw: nie da się rzetelnie testować reszty gry na poziomie, na którym testujemy zawsze.

**Konsekwencja implementacyjna:** brak pracy.
**Konsekwencja testowa:** bez zmian. Wynik „przegrana przed 20. turą" zostaje udokumentowany jako znane zachowanie.

### B. Gracz na maksymalnym poziomie zaczyna z jednym Wojownikiem (Rekomendowane)
**Co zobaczy gracz:** na starcie ma Zwiadowcę i jednego Wojownika w mieście. Daje to realną szansę na przeżycie pierwszego najazdu, a nie pewność. Barbarzyńcy, ceny i utrzymanie pozostają bez zmian. Poziom normalny ma dokładnie taki sam start (1 Wojownik), więc różnica między normalnym a trudnym nadal wynika z kosztów x4, kultury i barbarzyńców.
- Za: najmniejsza możliwa zmiana, tylko jedna liczba na starcie. Nie dotyka ekonomii ani barbarzyńców.
- Za: rozwiązuje wprost problem „nie da się kupić obrońcy bez Drewna".
- Przeciw: nie jest zmierzone, czy jeden Wojownik wystarczy na wszystkie najazdy. Może się okazać, że miasto nadal pada, tylko trochę później.
- Przeciw: nie jest zmierzone, czy utrzymanie Wojownika przy kosztach x4 nie zablokuje „Zakończ turę" już na początku gry. Na poziomie normalnym tego nie widać, ale ceny tam są niższe. Jeśli się zablokuje, trzeba będzie dodatkowo zdecydować o utrzymaniu (osobne pytanie).

**Konsekwencja implementacyjna:** zmiana jednej wartości w jawnej tabeli startowej (trudny: 0 → 1). Około godziny pracy, jedna część gry (ustawienie początkowe), bez zmian w kodzie ekonomii.
**Konsekwencja testowa:** trzeba powtórzyć pomiar „pasywny gracz, maksimum" na tych samych 5 grach i sprawdzić 20 tur oraz „Zakończ turę". Test porównujący liczbę jednostek startowych na poziomach trudności zostanie zaktualizowany.

### C. Barbarzyńcy na Trudnym pojawiają się później (pierwszy najazd po ok. 15. turze)
**Co zobaczy gracz:** pierwsze 15 tur gracz buduje gospodarkę w spokoju, a potem barbarzyńcy atakują z pełną siłą. Gracz nadal startuje bez wojska, ale ma czas wyprodukować obrońcę.
- Za: nie ruszamy startu ani cen, więc koszty x4 pozostają dokładnie takie, jak chciałeś.
- Za: pasuje do opcji „barbarzyńcy: brak", przy której gracz dziś przeżywa 20 tur.
- Przeciw: barbarzyńcy to osobny, wcześniej strojony mechanizm. Opóźnienie ich wejścia zmienia także zachowanie na innych poziomach i w innych scenariuszach.
- Przeciw: nie rozwiązuje braku Drewna. Po 15. turze gracz bez Drewna nadal nie ma jak kupić obrońcy, więc miasto może paść w turach 16–20 zamiast 10–16.

**Konsekwencja implementacyjna:** zmiana harmonogramu pojawiania się barbarzyńców (kilka godzin pracy, część gry odpowiedzialna za barbarzyńców).
**Konsekwencja testowa:** wymaga ponownego pomiaru barbarzyńców na wszystkich poziomach i przeglądu testów balansu.

---

**Rekomendacja: B (Rekomendowane).** Jest najmniejszą zmianą i jest zgodna z Twoimi dotychczasowymi decyzjami (koszty x4 i darmowe utrzymanie komputera pozostają nietknięte). Nie zmienia ekonomii. Poziom normalny już dziś tak startuje, więc jest to przetestowany wzorzec. Wariant C jest bardziej ryzykowny, bo ingeruje w mechanizm barbarzyńców i nie usuwa braku Drewna. Wariant A zostawia poziom, na którym testujemy zawsze, w stanie, w którym 4 z 5 gier kończy się przed 20. turą. Jeśli po wdrożeniu B pomiar pokaże, że miasto nadal pada albo że „Zakończ turę" się blokuje, wrócimy do Ciebie z osobnym pytaniem o utrzymanie pierwszych jednostek gracza.

**Szczegóły:** analizy OBRONA-STARTU-WERYFIKACJA-2026-11-27, OBRONA-STARTU-MAKSIMUM-LUKI-2026-11-27 i OBRONA-STARTU-GRACZ-ROZSADNY-2026-11-27 (dyspozycje/analizy). Tabela startowa jest jawna w kodzie (łatwy 2 Wojowników, normalny 1, trudny 0), bez uzasadnienia w komentarzu. Decyzja o darmowym utrzymaniu AI w turach 1–40 pochodzi z FALA 890. W domyślnej grze pasywny gracz nie przechodzi tury 1 (zamierzone wg analizy bramki żywności), co jest poza zakresem tego pytania. Uwaga: pliki analiz nie były dostępne w tym środowisku, więc liczby pochodzą z opisu zadania i nie zostały ponownie zweryfikowane w repozytorium. Utrzymanie Wojownika na maksimum w B oznaczono jako NIE_ZMIERZONO.
