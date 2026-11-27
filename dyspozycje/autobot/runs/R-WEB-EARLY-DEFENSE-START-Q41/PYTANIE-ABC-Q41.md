**R-WEB-EARLY-DEFENSE-START-Q41 — Czy na najwyższym poziomie trudności gracz ma mieć realną szansę obronić pierwsze miasto przed barbarzyńcami w pierwszych około 15 turach, a jeśli tak, to jak?**

**Sytuacja (co się dzieje w grze).** Na maksymalnych ustawieniach (poziom Trudny, koszty jednostek Wysokie ×4, kultura trudna, barbarzyńcy Trudni) gracz zaczyna z jednym Zwiadowcą i bez żadnej jednostki bojowej. Gracz, który nie podejmie szybko żadnych działań obronnych, traci jedyne miasto na rzecz barbarzyńców przed 20. turą w 4 z 5 sprawdzonych gier. Miasto pada w turach 10, 13, 16 i 10, a w piątej grze przetrwa do tury 21. Kupić obrońcę często się nie da:
- Najtańszy obrońca kosztuje 12 Pieniędzy i 13 Drewna.
- W 3 z 5 gier przez pierwsze 12 tur gracz nie ma w ogóle Drewna.
- Tam, gdzie Drewno jest, obrońca kupiony w 5. turze (cały podatek na Pieniądze, Nauka na zero) kosztuje w utrzymaniu około 16 Pieniędzy i 16 Żywności na turę, przy dochodzie od +1 do +8. Gra w 6.–7. turze blokuje wtedy przycisk „Zakończ turę” komunikatem „Nawet maksymalny podatek nie wystarczy”.
- Poziom Łatwy zaczyna z 2 Wojownikami, Normalny z 1, a Trudny z żadnym.
- Komputer w turach 1–40 w ogóle nie płaci za utrzymanie swoich jednostek wojskowych (Twoja wcześniejsza decyzja).
- Gdy barbarzyńców wyłączymy, gracz bez trudu przeżywa 20 tur.

**Cel.** Na maksimum gracz ma przegrywać z powodu własnych decyzji (zły wybór miejsca, spóźniona obrona, brak planu), a nie dlatego, że gra nie dała mu żadnej możliwości reakcji. Maksimum ma przy tym zostać wyraźnie najtrudniejsze, a koszty ×4 mają być prawdziwą trudnością, tak jak zdecydowałeś.

**Dlaczego teraz.** Poziom maksymalny jest tym, na którym zawsze testujemy grę. Dziś w większości gier pierwsze miasto ginie, zanim gracz cokolwiek zdąży zrobić. Dopóki tego nie rozstrzygniemy, nie da się uczciwie ocenić reszty trudności maksimum.

**Pytanie dotyczy tylko tego jednego:** czy i w jaki sposób przywrócić graczowi realną szansę obrony pierwszego miasta w pierwszych kilkunastu turach.

---

**A. Gracz startuje z jednym Wojownikiem w mieście, a jego utrzymanie przez pierwsze 15 tur jest darmowe, tak jak u komputera (Rekomendowane)**

Co zobaczy gracz: od pierwszej tury w mieście stoi Wojownik i przez 15 tur nie płaci za jego utrzymanie. Od 16. tury utrzymanie normalnie obciąża dochód (przy kosztach ×4), więc musi zdecydować, czy wojsko zatrzymać i rozbudować, czy postawić na gospodarkę.
Za:
- Obrona przestaje zależeć od tego, czy na mapie akurat jest Drewno. Rozwiązuje to 3 z 5 gier, w których dziś nie da się kupić niczego.
- Zwolnienie z utrzymania usuwa dokładnie tę przeszkodę, która dziś zatrzymuje kupionego obrońcę już w 6.–7. turze. Sam Wojownik na starcie, bez zwolnienia, najpewniej wpadłby w tę samą blokadę (nie zmierzono tego).
- Jedna jednostka nie gwarantuje obrony. Gracz musi ją dobrze ustawić i szybko dozbroić, więc wciąż ma o co grać.
- Zasada „pierwsze jednostki są za darmo” już działa u komputera, więc gracz przestaje być traktowany gorzej niż rywal.
Przeciw:
- Maksimum jest na samym początku łagodniejsze (start jak na poziomie Normalnym). Nie zmierzono, czy jeden Wojownik wytrzyma pierwszy najazd.
- Po 15. turze utrzymanie znów uderza w dochód. Jeśli gracz nic nie zmieni, blokada „Zakończ turę” może się tylko przesunąć w czasie.
- Powstaje nowy wyjątek od zasady „koszty ×4 to trudność” dla pierwszych tur, o którym trzeba będzie poinformować gracza. Liczba 15 tur jest wartością wyjściową i można ją zmienić.
Konsekwencja implementacyjna: jedna zmiana w składzie startowym (Trudny: z zera na jednego Wojownika) oraz nowe, ograniczone w czasie zwolnienie z utrzymania dla jednostek gracza, wzorowane na tym, które ma komputer. Praca mała do średniej, dotyka tylko startu nowej gry i naliczania utrzymania. Nie dotyka mapy ani barbarzyńców.
Konsekwencja testowa: zmienią się testy składu startowego i testy blokady „Zakończ turę” na maksimum. Trzeba będzie od nowa zmierzyć przeżywalność w tych samych 5 grach (sprawdzenie, czy miasto dociąga do 15. tury i czy tura da się zakończyć).

**B. Gracz nadal startuje bez wojska, ale barbarzyńcy w pierwszych około 15 turach nie atakują albo atakują wyraźnie słabiej**

Co zobaczy gracz: pierwsze kilkanaście tur jest spokojnych, mimo ustawionych Trudnych barbarzyńców. Gracz ma czas znaleźć Drewno, zebrać Pieniądze i kupić obrońcę we własnym tempie. Potem barbarzyńcy wracają w pełnej sile.
Za:
- Koszty ×4 i zasady utrzymania zostają nietknięte. Obronę nadal trzeba mądrze zaplanować i kupić, co zachowuje wybór gracza i charakter maksimum.
- Nie zmienia składu startowego ani rozliczeń. Skutek jest prosty do wytłumaczenia graczowi.
Przeciw:
- Nie rozwiązuje braku Drewna: w 3 z 5 gier przez 12 tur go nie ma. Po wygaśnięciu spokoju gracz może nadal nie mieć czym się bronić, więc problem się tylko przesuwa.
- Nie rozwiązuje blokady „Zakończ turę” po kupieniu obrońcy w 5. turze.
- „Trudni barbarzyńcy” przez początek gry nic nie znaczą. Gracz uczy się, że pierwsze tury są bezpieczne, i ginie zaskoczony później.
Konsekwencja implementacyjna: zmiana terminu i siły pierwszych najazdów barbarzyńców tylko na poziomie maksymalnym. Praca średnia, dotyka zachowania barbarzyńców, które wpływa też na ocenę balansu w innych miejscach.
Konsekwencja testowa: zmienią się pomiary czasu pierwszego najazdu i testy przeżywalności na maksimum. Trzeba zmierzyć na tych samych 5 grach, czy po końcu spokoju gracz w ogóle ma środki na obronę.

**C. Bez zmian: maksimum zostaje takie, jakie jest**

Co zobaczy gracz: na maksimum w większości gier pierwsze miasto ginie przed 20. turą, jeśli gracz nie ma szczęścia do Drewna. Żeby grać dłużej, musi sam osłabić albo wyłączyć barbarzyńców w ustawieniach nowej gry.
Za:
- Zero pracy i zero ryzyka regresji. Maksimum zostaje jawnie bezlitosne, zgodnie z Twoją decyzją, że koszty ×4 mają być faktyczną trudnością.
- Gracz, który wybiera „wszystko na maksimum”, dostaje dokładnie to, o co prosił.
Przeciw:
- W 4 z 5 gier gracz przegrywa nie przez własną decyzję, tylko dlatego, że nie ma jak się bronić (brak Drewna albo brak pieniędzy na utrzymanie). To nie jest trudność, tylko brak wyboru.
- Wszystkie testy i oceny balansu na maksimum dalej startują ze skrajnej sytuacji, więc pomiary pozostają zniekształcone tą jedną przyczyną.
- Zwolnienie z utrzymania, które ma komputer, nadal jest przywilejem rywala, którego gracz nie dostaje.
Konsekwencja implementacyjna: brak zmian w grze, ewentualnie krótka informacja przy wyborze poziomu maksymalnego.
Konsekwencja testowa: brak zmian w testach. Pomiary na maksimum nadal trzeba będzie ręcznie obchodzić.

---

**Rekomendacja: A.** Jako jedyny usuwa obie przyczyny braku wyboru naraz: brak Drewna (obrońca jest od pierwszej tury) i brak możliwości zapłacenia za jego utrzymanie (15 tur bez opłat). Samą jednostkę startową bez zwolnienia świadomie odrzucamy jako osobny wariant, bo z pomiarów wynika, że opłata za utrzymanie przy kosztach ×4 wystarcza, żeby zablokować „Zakończ turę” już w 6.–7. turze. Koszty ×4 zostają prawdziwą trudnością od 16. tury. B tylko przesuwa problem w czasie, bo nadal nie wiemy, czy Drewno się pojawi. C zostawia graczowi przegraną, której nie mógł uniknąć. Przed wdrożeniem A zmierzymy na tych samych 5 grach, czy jeden Wojownik faktycznie pozwala przetrwać pierwszy najazd. Jeśli nie, wrócimy do Ciebie z kolejnym pytaniem.

Szczegóły: dane pomiarowe w dyspozycje/analizy/OBRONA-STARTU-WERYFIKACJA-2026-11-27.md, OBRONA-STARTU-MAKSIMUM-LUKI-2026-11-27.md i OBRONA-STARTU-GRACZ-ROZSADNY-2026-11-27.md. Tabela jednostek startowych jest jawna w kodzie (łatwy 2 Wojowników, normalny 1, trudny 0). Zwolnienie z utrzymania jednostek komputera w turach 1–40: decyzja z FALA 890. Warianty A i B wymagają ponownego uruchomienia pomiarów realdef-econ-live / verify na 5 ziarnach (4242, 7, 778899, 11, 2024) w konfiguracji max. W A do aktualizacji są testy składu startowego i bramka Skarbu, a w B testy harmonogramu najazdów barbarzyńców. W żadnym wariancie nie ruszać zasady „w domyślnej grze pasywny gracz nie przechodzi tury 1” (zamierzone wg analizy bramki żywności).