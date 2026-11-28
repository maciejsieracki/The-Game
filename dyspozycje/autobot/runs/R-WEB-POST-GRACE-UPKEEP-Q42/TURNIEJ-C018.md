# Turniej C-018 — R-WEB-POST-GRACE-UPKEEP-Q42

## Naruszenia

**PROJEKT 1**
- W opisie wariantu A użyto wewnętrznego żargonu: "okno łaski", "okno jedzenia", "okno złota". Takie określenie nie znaczy nic dla osoby spoza projektu (zasada 1).
- Wariant A twierdzi, że dziś jedno okno obejmuje "złoto, jedzenie i surowce". Nie ma tego w FAKTY.md. Surowce to twierdzenie z kodu, niezweryfikowane w faktach.
- Wariant B przywołuje "zasadę 'kto płaci, ten utrzymuje wojsko'". Ta zasada nie występuje w faktach, więc jest wymyślona.
- Wariant C wspomina o "starej, zaakceptowanej regule blokady". To twierdzenie nie ma oparcia w faktach.
- Wariant A podaje "3 tury" bez pomiaru i bez oznaczenia, że liczba jest tylko propozycją. Nie wiadomo, czy trzy tury wystarczą na zbudowanie czegokolwiek (brak oznaczenia "nie zmierzono" przy samej liczbie).
- Poza treścią pytania jest "Uwaga dla orkiestratora" z uwagami o plikach i procesie. To meta-uwaga zakazana przez zasadę 3.
- Poza tym projekt jest zgodny z faktami: liczby 16–18 żywności, 68–97 Pieniędzy, brak ataku w promieniu 3 pól do 30. tury i komunikat o racji przy suwaku na minimum są poprawne. Struktura jest kompletna, a warianty różnią się skutkiem.

**PROJEKT 2**
- Cel łączy dwie decyzje: czy gracz ma utrzymywać obrońcę oraz jaka ma być kara za brak żywności. Narusza to zasadę "jedno pytanie = jedna decyzja".
- Wariant B w "Przeciw" stwierdza jako fakt, że "barbarzyńcy przychodzą po 30. turze". FAKTY.md mówi, że ataku po 30. turze nie zmierzono. To wymyślone twierdzenie.
- Wariant B (prognoza od 13. tury) i wariant C ("pięć tur") zawierają niezmierzone liczby podane bez oznaczenia "nie zmierzono".
- Wariant C używa słowa "tygodniach" w opisie implementacji, choć gra liczy tury. Jest też wewnętrznie sprzeczny: "zmiana nie wpływa na dalszą grę", a zaraz potem "problem wraca w tej samej postaci".
- Wariant A zakłada karę "traci część produkcji" bez żadnego pomiaru. Skutki tej kary są mocno spekulatywne, więc rekomendowany wariant opiera się na najmniej pewnej mechanice.
- Szczegóły zawiera nazwę pomiaru "GRACE15FX r3". Mieści się to w linii Szczegóły, więc jest dopuszczalne.
- Jest dodatkowa "Uwagi dla orkiestratora" poza pytaniem. To meta-uwaga zakazana przez zasadę 3.

Zwycięzca: SYNTEZA (szkielet i warianty z Projektu 1, oczyszczone z naruszeń; z Projektu 2 wzięto wyraźne rozróżnienie, że blokada dotyczy żywności, nie złota)


## Projekt 1

## R-WEB-POST-GRACE-UPKEEP-Q42 — Co ma się dziać po 15. turze, gdy wraca utrzymanie wojska, a jedzenie się kończy?

**Sytuacja:** Przez pierwsze 15 tur nikt nie atakuje, a wojsko nic nie kosztuje. W 16. turze utrzymanie wraca i wojsko płaci się także jedzeniem: dwie jednostki zjadają około 32 jedzenia na turę. Zapas żywności w tym momencie wynosi zero, więc przycisk „Zakończ turę” zostaje zablokowany. Jedyne wyjście, jakie gra pokazuje, to rozwiązanie jednostek wojskowych, po którym miasto zostaje bez żadnego żołnierza. Obniżenie racji nie pomaga, bo suwak już stoi na minimum. Barbarzyńcy nie pojawiają się do 16. tury, od 17. są obecni, a w 30. turze jest ich 40–42. W obu zmierzonych grach nie zaobserwowano żadnego ataku na gracza do 30. tury.

**Cel:** Ustalić, czy po 15. turze gracz na najwyższym poziomie ma dalej utrzymywać obrońcę, który kosztuje jedzenie, czy ma być zmuszony do jego rozwiązania, i jak wtedy ma wyglądać kara za brak żywności.

**Dlaczego teraz:** Spokój na pierwsze 15 tur jest już wdrożony, a ten sam moment wypada każdemu graczowi na najwyższym poziomie. W obu zmierzonych grach gracz został zablokowany w 16. turze.

**Wariant A (Rekomendowane): obrońca zostaje, a niedobór żywności kosztuje wydajność miasta.**
- Co zobaczy gracz: „Zakończ turę” działa także przy zerowym zapasie. Gdy żywność spadnie poniżej zera, miasto przez kolejne tury traci część produkcji, aż zapas wróci do dodatniego. Obrońca zostaje w mieście.
- Za: gracz zachowuje obrońcę, którego sam wybrał w 5. turze. Kara jest widoczna, ale nie zmusza do rozwiązania wojska.
- Za: pierwszy atak barbarzyńców po 30. turze nie został zmierzony, więc zachowanie obrońcy jest bezpieczniejsze w razie zmiany tego obrazu.
- Przeciw: gracz może grać z minusem żywności przez wiele tur. Nie zmierzono, jak długo to może trwać ani jak mocno kara wpływa na grę.
- Przeciw: miasto bez budowy zwiększającej żywność nadal się dusi. Budowa zwiększająca żywność nie została zmierzona (przyciski są nieaktywne), więc nie wiadomo, czy gracz ma realne wyjście z minusu.
- Konsekwencja implementacyjna: zmienić blokadę końca tury, która dziś zatrzymuje grę przy ujemnej żywności, oraz dodać stan głodu miasta z konkretnym spadkiem produkcji i komunikatem. Trzeba zaprojektować siłę tej kary. Zakres średni.
- Konsekwencja testowa: zmienią się testy blokady końca tury i zasad zapasu żywności. Potrzebne będą nowe testy głodu oraz ponowny pomiar na dwóch grach po wdrożeniu.

**Wariant B: obecna zasada zostaje, gracz rozwiązuje jednostkę, ale dostaje wcześniejszą zapowiedź.**
- Co zobaczy gracz: od 13. tury gra pokazuje prognozę żywności i zapowiada, że w 16. turze trzeba będzie rozwiązać wojsko. Blokada zostaje. Komunikat przestaje podawać obniżenie racji jako wyjście, bo go nie ma.
- Za: mechanika nie zmienia się, więc nie ma nowego ryzyka dla balansu.
- Za: gracz wie z wyprzedzeniem, co traci, i może zaplanować inny sposób obrony.
- Przeciw: gracz, który zbudował obrońcę w 5. turze, traci go w 16. turze. Miasto zostaje bez żołnierza, a barbarzyńcy przychodzą po 30. turze.
- Przeciw: zapowiedź nie daje realnego wyjścia poza rozwiązaniem wojska. To ten sam problem z lepszym komunikatem.
- Konsekwencja implementacyjna: dodać prognozę i zapowiedź w turach 13–15 oraz poprawić tekst blokady. Zakres mały.
- Konsekwencja testowa: zmienią się testy komunikatu blokady i prognozy. Bramka końca tury zostaje bez zmian.

**Wariant C: ulga przejściowa, przez 5 tur po 15. turze utrzymanie wojska jest płacone tylko pieniędzmi.**
- Co zobaczy gracz: w turach 16–20 jedzenie za wojsko nie jest pobierane, więc gracz zachowuje obrońcę i ma czas na rozbudowę produkcji żywności. Od 21. tury jedzenie wraca w pełnej wysokości i gracz musi mieć nadwyżkę albo rozwiązać wojsko.
- Za: gracz zachowuje obrońcę przez pięć tur i zna termin, w którym problem wróci.
- Za: po 20. turze zasady są takie same jak dziś, więc zmiana nie wpływa na dalszą grę.
- Przeciw: budowa zwiększająca żywność nie została zmierzona, więc nie wiadomo, czy 5 tur wystarczy na odbudowę zapasu.
- Przeciw: po 21. turze problem wraca w tej samej postaci, tylko później. Liczba tur jest arbitralna i nie ma na nią pomiaru.
- Konsekwencja implementacyjna: licznik ulgi i wyjątek w naliczaniu żywności dla wojska w pierwszych tygodniach po 15. turze. Zakres średni.
- Konsekwencja testowa: nowe testy naliczania utrzymania w turach 16–20 i od 21. Przed wyborem liczby tur trzeba sprawdzić, czy budowa żywności jest w ogóle osiągalna.

**Rekomendacja: wariant A.** Najlepiej działa na poziomie maksymalnym: gracz nie traci obrońcy, którego wybrał sam, ale brak jedzenia ma widoczny koszt, więc zapas żywności nadal decyduje o grze. Wariant B oddaje gracza na łaskę zapowiedzi i zmusza do rozwiązania wojska, a wariant C tylko odsuwa problem o pięć tur, na podstawie budowy, której nie zmierzono.

Szczegóły: źródło faktów to pomiar GRACE15FX r3 w dyspozycje/autobot/runs/R-WEB-POST-GRACE-UPKEEP-Q42/FAKTY.md. Blokada końca tury i zapas żywności są w gra/src/main.ts (nie sprawdzano dokładnej linii).

---
Uwagi dla orkiestratora (nie część pytania):
- Wskazany dokument dyspozycje/analizy/OKNO-LASKI-15-TUR-SKUTKI-2026-11-27.md nie istnieje w repo. Istnieje tylko dyspozycje/analizy/OKNO-LASKI-15-TUR-2026-11-27.md w katalogach roboczych .claude/worktrees/wf_67de034c-67a-1, -2 i -3. Żaden z plików nie zawiera sekcji „STAN WIĄŻĄCY” (grep po całym repo tej sekcji nie znalazł). Pytanie zbudowano wyłącznie na FAKTY.md, który podaje się jako źródło. Sekcji wiążącej nie sprawdzono.
- Nie zmieniano żadnych plików, nie uruchamiano zadań.

## Projekt 2

# R-WEB-POST-GRACE-UPKEEP-Q42 — Co dzieje się w 16. turze, gdy wraca koszt wojska

**Sytuacja.** Przez pierwsze 15 tur barbarzyńcy nie atakują, a utrzymanie wojska nic nie kosztuje. W 16. turze koszty wracają. Na poziomie Trudnym zapas jedzenia wtedy wynosi zero. Przy jednej lub dwóch jednostkach wojskowych przycisk „Zakończ turę” się blokuje, bo po turze zabrakłoby około 16–18 jedzenia. Gra pokazuje tylko jedno wyjście: rozwiązać jednostki wojskowe. Suwak racji jest już na minimum, a podatki nie dają jedzenia. Po rozwiązaniu miasto zostaje bez wojska. Barbarzyńcy pojawiają się od 17. tury; w 30. turze jest ich około 40–42.

**Cel.** Ustalić, czy w 16. turze gracz ma być zmuszony do rozwiązania wojska, czy gra ma dać łagodniejsze wyjście, i jakie.

**Dlaczego teraz.** Pierwsze 15 tur jest już w grze. Bez decyzji nie wiadomo, jak ma wyglądać przejście w 16. turze.

**Warianty**

**A (Rekomendowane) — Łagodne wejście w jedzenie.** Przez kilka tur po 15. turze złoto za wojsko wraca od razu, ale jedzenie za wojsko pozostaje darmowe (proponowane: 3 tury). Przycisk „Zakończ turę” się nie blokuje. Gracz widzi normalny koszt w złocie i ma czas, by zbudować coś na żywność albo zdecydować, co zrobić z wojskiem.
- Za: wojsko zostaje w mieście, nic nie znika bez wyboru gracza.
- Za: w 16. turze nie ma kary, więc zgadza się to z duchem pierwszych 15 tur.
- Przeciw: problem wraca po tych kilku turach. Jeśli gracz nie zbuduje produkcji żywności, wybór przyjdzie później (budowa zwiększająca żywność nie została zmierzona).
- Przeciw: gracz dostaje dodatkową regułę do zapamiętania: złoto i jedzenie wracają w różnym tempie.
- Konsekwencja implementacyjna: osobne okno łaski tylko dla części jedzeniowej kosztów wojska (dziś jedno okno obejmuje złoto, jedzenie i surowce), nowy parametr długości okna i zmiana komunikatu blokady. Zakres: jedno miejsce liczenia kosztów plus parametr i tekst.
- Konsekwencja testowa: testy darmowego utrzymania trzeba rozdzielić na okno złota i okno jedzenia; testy blokady końca tury w 16. turze zmienią oczekiwania; dochodzą testy długości okna.

**B — Rozwiązanie wojska, jak dziś.** W 16. turze koniec tury jest zablokowany, dopóki gracz nie rozwiąże 1–2 jednostek wojskowych. Zostaje zwiadowca. Gra toczy się dalej.
- Za: prosta reguła, zgodna z zasadą „kto płaci, ten utrzymuje wojsko”.
- Za: nie trzeba nowych zasad. W pomiarze do 30. tury nie było ataku na gracza w promieniu 3 pól.
- Przeciw: obrońca kupiony za złoto znika w chwili, gdy gra wraca do normy. Odbudowa przy wysokich kosztach jednostek jest droga.
- Przeciw: miasto zostaje bez wojska, gdy zaczynają się obozy barbarzyńców. Czy atak przyjdzie po 30. turze, nie zmierzono.
- Przeciw: komunikat podaje obniżenie racji jako wyjście, choć suwak jest już na minimum. Gracz może nie wiedzieć, co zrobić.
- Konsekwencja implementacyjna: brak nowej reguły. Trzeba zmienić tekst komunikatu blokady i ewentualnie wyróżnić opcję rozwiązania wojska.
- Konsekwencja testowa: istniejące testy blokady i utrzymania bez zmian. Zmienią się tylko testy tekstu komunikatu.

**C — Bez przymusu: głód zamiast blokady.** Koniec tury nigdy nie blokuje się z powodu jedzenia. Gdy zapasu brakuje, miasto głoduje: traci część ludności albo jednostek. Gracz nie musi wybierać w tej chwili, ale nie kontroluje tego, co zginie.
- Za: gracz nie jest zmuszony do decyzji w danym momencie, a tura się zamyka.
- Za: reguła obowiązuje wszystkich, nie tylko w oknie łaski.
- Przeciw: zamiast wyboru gracz dostaje automatyczną stratę, która może dotknąć nie to, co chciał chronić.
- Przeciw: zmiana starej, zaakceptowanej reguły blokady dla całej gry. Trzeba też ustalić, ile ludności lub jednostek ginie na turę.
- Konsekwencja implementacyjna: duża. Zmiana warunku końca tury, nowa reguła głodu (ile i kogo), nowe komunikaty. Nie zmierzono, co gra robi dziś poza blokadą.
- Konsekwencja testowa: zmiana wielu testów blokady końca tury i zapasu żywności, nowe testy głodu.

**Rekomendacja.** Wariant A. Gracz nie traci wojska w 16. turze, zmiana jest mała (jedno okno dla jedzenia i komunikat), a pierwsze 15 tur pozostaje spokojnych zgodnie z decyzją. Kosztem jest kolejna reguła i odroczony problem, którego ostateczne rozwiązanie zależy od budowy zwiększającej żywność (nie zmierzono).

Szczegóły: fakty pomiarowe w dyspozycje/autobot/runs/R-WEB-POST-GRACE-UPKEEP-Q42/FAKTY.md; kod kosztów w gra/src/game/ai-free-unit-upkeep.ts i gra/src/main.ts.

---
Uwaga dla orkiestratora (poza treścią pytania): w podanym pliku analizy OKNO-LASKI-15-TUR-SKUTKI-2026-11-27.md sekcja „STAN WIAZACY” nie istnieje. Plik nie ma go w repo na ścieżce podanej w zleceniu; najbliższa kopia OKNO-LASKI-15-TUR-2026-11-27.md w worktree .claude/worktrees/wf_67de034c-67a-1/dyspozycje/analizy/ też jej nie ma. Pytanie oparłem na FAKTY.md i na treści tej kopii. Nic w repo nie zmieniałem.
