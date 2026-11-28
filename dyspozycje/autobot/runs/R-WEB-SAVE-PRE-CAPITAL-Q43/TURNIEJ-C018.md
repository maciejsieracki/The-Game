# Turniej C-018 — R-WEB-SAVE-PRE-CAPITAL-Q43

## Naruszenia

**PROJEKT 1**
- Meta-uwaga o procesie na końcu ("Uwaga procesowa: ... spawn_task ...") oraz wzmianka w Szczegółach, że pliku analizy nie ma w katalogu. Zasada 3 zakazuje meta-uwag o procesie, plikach i środowisku.
- Wariant B, "Przeciw": ograniczenie "dotyczy także zapisów, które nie mają problemu". To fałsz wobec faktów. Według FAKTY.md każdy zapis zrobiony przed stolicą traci te kolejki, a zapisy po stolicy blokada nie dotyka. Zdanie jest też niezrozumiałe.
- Wariant C, "Za": "zero ryzyka regresji w zapisie". "Regresja" to żargon inżynierski, a zdanie nie przechodzi sprawdzianu czytania na głos.
- Wariant A, "Konsekwencja implementacyjna": "ten sam wzorzec, co w poprzednich poprawkach zapisu" to odnośnik do historii prac, a nie opis skutku. Odnośnik do poprawek powinien być tylko w linii Szczegóły.
- Wariant A obiecuje w zdaniu o skutku, że wczytanie daje "ten sam świat, co gra bez przerwy". Tego nie zmierzono na żywo, a w FAKTY.md jest tylko wniosek z kodu. Brak zastrzeżenia.
- "Dlaczego teraz" ("Zapis gry jest właśnie poprawiany") jest ogólnikowe i nie tłumaczy, czemu decyzja jest potrzebna teraz.
- Oba wnioski o zmierzeniu ("nie zmierzono") są poprawnie oznaczone, a kolejność i dopisek "(Rekomendowane)" są dobre. Brak nazw plików i testów poza linią Szczegóły, więc ten punkt nie jest naruszony.

**PROJEKT 2**
- Nagłówek zawiera meta-opis "(projektant 2)", a Szczegóły zawierają meta-uwagę, że dokument analizy nie był dostępny. To naruszenie zasady 3.
- "Dlaczego teraz" nie odpowiada na pytanie, czemu teraz. Mówi tylko, że stare zapisy nie są ważne. Zdanie "gracz z nich nie korzysta" jest też zbyt pewne, bo właściciel mówi tylko, że go nie interesują.
- Wariant A i B: "Praca mała" to wymyślona ocena nakładu. Fakty nie podają żadnego nakładu, a w A jest przy tym oznaczona jako "szacunek", co jest sprzeczne z zasadą "czego nie zmierzono, oznacz".
- Wariant A, "Przeciw": ryzyko dublowania elementów po wczytaniu jest hipotezą, której FAKTY.md nie podają, a jest zapisana jak ustalony punkt.
- Wariant C, "Przeciw": "wróci przy każdym zapisie z tego okresu" to przesada ponad fakty (wniosek z kodu, niezmierzony). "Ryzyko pozostaje jako znane ograniczenie do osobnej decyzji" to wątek procesowy.
- Rekomendacja nie powtarza, że fakty pochodzą wyłącznie z czytania kodu, choć Sytuacja to mówi. Mocna strona: Sytuacja jest czytelna i dobrze zastrzeżona.
- Reszta (struktura, minimum 2 za i 2 przeciw, język bez nazw własnych w opisach wariantów) jest zgodna z zasadami.

Zwycięzca: SYNTEZA (szkielet i język z Projektu 2, jaśniejsze opisy skutków z Projektu 1, bez wymyślonych ocen nakładu i bez meta-uwag).


## Projekt 1

# R-WEB-SAVE-PRE-CAPITAL-Q43: pytanie ABC do właściciela (projektant 2)

**Pytanie:** Co ma się stać, gdy gracz zapisze grę przed założeniem pierwszego miasta, a potem wczyta ten zapis?

**Sytuacja w grze:** Na początku nowej gry gracz wybiera miejsce i zakłada stolicę. Dopiero po jej założeniu w świecie mają się pojawić obce miasta-państwa, klastry cywilizacji AI i dodatkowi rywale tego samego typu co gracz. Do tego momentu te elementy czekają w grze. Z czytania kodu wynika, że zapis zrobiony przed stolicą ich nie zawiera, a gra nie blokuje takiego zapisu. Po wczytaniu świat może więc nie mieć obcych miast, klastrów AI ani rywali, a obszar odkrywany na starcie może być liczony od złego pola. Te fakty pochodzą wyłącznie z czytania kodu i nie są sprawdzone na żywo: nie wiadomo, jak często taki zapis powstaje ani co dokładnie gracz widzi po wczytaniu.

**Cel:** Wczytana gra zawsze ma mieć cały świat, który gra zaplanowała.

**Dlaczego teraz:** Stare zapisy nie są w tej decyzji ważne, bo gracz z nich nie korzysta. Decyzja określa więc od razu, co gracz zobaczy po wczytaniu każdego zapisu z początku gry.

**Warianty:**

**A: Zapis zawiera zaplanowane elementy (Rekomendowane).**
- Co zobaczy gracz: po wczytaniu zapisu z początku gry obce miasta-państwa, klastry AI i rywale pojawiają się tam, gdzie gra je zaplanowała, a obszar startu jest liczony od właściwego pola.
- Za: wczytana gra jest taka sama, jak ta, którą gracz zapisał.
- Za: gracz nie musi pamiętać o żadnej zasadzie, a zapis jest możliwy od pierwszej chwili.
- Za: zachowanie samej rozgrywki się nie zmienia.
- Przeciw: zapis rośnie o kilka dodatkowych danych (nie zmierzono, o ile).
- Przeciw: trzeba sprawdzić, że wczytanie zapisu nie dubluje elementów, które już się pojawiły.
- Konsekwencja implementacyjna: do zapisu dochodzą nowe, opcjonalne dane o zaplanowanych miastach, rywalach i miejscu startu. Stare zapisy wczytują się jak dotąd. Praca mała, ograniczona do zapisu gry; rozgrywka i walka bez zmian (szacunek, nie zmierzono).
- Konsekwencja testowa: testy zapisu i wczytania dostają nowy przypadek: zapis przed stolicą, po wczytaniu elementy są na miejscu i się nie powtarzają. Testy starych zapisów pozostają bez zmian.

**B: Zapis zablokowany do czasu założenia pierwszego miasta.**
- Co zobaczy gracz: przed założeniem stolicy opcja zapisu jest niedostępna, z komunikatem „Zapis niedostępny przed założeniem pierwszego miasta”.
- Za: nie ma zapisu, który może zgubić część świata, więc każdy zapis jest pełny.
- Za: reguła jest prosta do zrozumienia i nie wymaga zmiany formatu zapisu.
- Przeciw: gracz nie może zapisać gry na samym początku, a to zwykle pierwsze minuty gry (czas nie zmierzono).
- Przeciw: gracz zauważy nową regułę i może ją odebrać jako utrudnienie.
- Konsekwencja implementacyjna: w menu zapisu dochodzi sprawdzenie stanu gry i nowy komunikat. Format zapisu bez zmian. Praca mała.
- Konsekwencja testowa: nowy przypadek: próba zapisu przed stolicą jest odrzucona z komunikatem. Testy zapisu po stolicy bez zmian.

**C: Nic nie zmieniać.**
- Co zobaczy gracz: zapis przed stolicą działa jak dotąd. Po wczytaniu świat może nie mieć obcych miast, klastrów AI i rywali, a start może być w złym miejscu, bez żadnego ostrzeżenia.
- Za: zero pracy i zero zmian w grze.
- Za: nie ma ryzyka nowych błędów w zapisie.
- Za: gracz, który zapisuje rzadko na początku, może w ogóle nie trafić na problem.
- Przeciw: gracz może dostać grę z niepełnym światem i uznać ją za zepsutą.
- Przeciw: problem zostaje w kodzie i wróci przy każdym zapisie z tego okresu.
- Konsekwencja implementacyjna: brak.
- Konsekwencja testowa: brak zmian w testach. Ryzyko pozostaje jako znane ograniczenie do osobnej decyzji.

**Rekomendacja: A.** Cel to kompletny świat po wczytaniu. Wariant A go zapewnia i nie dodaje gracza żadnej reguły. Wariant B wprowadza blokadę, którą gracz odczuje, a wariant C zostawia świat niepełny bez ostrzeżenia. Koszt A to dodatkowe dane w zapisie. Stare zapisy nadal działają, więc nie ma potrzeby ich przenosić. Nie zmierzono, jak często powstają zapisy z tego okresu, więc nie wiadomo, jak często A będzie w ogóle potrzebne.

**Szczegóły (dla wykonawcy, nie do czytania graczowi):** kolejki obcych miast-państw, klastrów AI i rywali oraz zapamiętany punkt startu nie są zapisywane w pliku zapisu. Blokada zapisu istnieje tylko w trakcie bitwy. Wariant A jak poprawka z FALA 937 i 938 (opcjonalne pola). Źródło: FAKTY.md w dyspozycje/autobot/runs/R-WEB-SAVE-PRE-CAPITAL-Q43/. Dokument ZAPIS-STAN-AUDYT-2026-11-28.md nie był dostępny w tym katalogu. Wszystkie liczby i czasy: nie zmierzono.

## Projekt 2

## Pytanie ABC: R-WEB-SAVE-PRE-CAPITAL-Q43 (zapis gry przed zalozeniem pierwszego miasta)

**Sytuacja w grze:** Na poczatku nowej gry gracz wybiera miejsce i zklada pierwsze miasto (stolice). Obce miasta-panstwa, klastry cywilizacji AI i dodatkowi rywale maja sie pojawic dopiero po zalozeniu stolicy. Jesli gracz zapisze gre przed zalozeniem stolicy i wczyta ja pozniej, te elementy moga w ogole sie nie pojawic w tej grze, a miejsce startu moze wskazywac zle pole na mapie. Gra nie blokuje obecnie zapisu w tym oknie. Fakty z czytania kodu, nie zmierzone na zywo: nie zmierzono, ile takich zapisow powstaje i co dokladnie widzi gracz po wczytaniu.

**Cel:** Zeby wczytana gra zawsze miala caly swiat, ktory byl zaplanowany, bez nakladania nowych ograniczen na gracza.

**Dlaczego teraz:** Zapis gry jest wlasnie poprawiany. Decyzja okresla, co ma byc zapisywane od tej poprawki.

**Wariant A: Zapisywac zaplanowane elementy razem z gra (Rekomendowane)**
- Co zobaczy gracz: zapis zawsze zawiera zaplanowane miasta-panstwa, klastry AI i rywali oraz miejsce startu. Wczytanie zapisu zrobionego po tej poprawce daje ten sam swiat, co gra bez przerwy. Zapisy zrobione przed poprawka zostaja bez zmian (tak jak dzis).
- Za: gracz nie traci zadnej mozliwosci i nie dostaje komunikatu blokujacego. Wczytana gra jest taka sama jak gra bez przerwy.
- Za: problem znika u zrodla, takze dla przyszlych zapisow w tym oknie.
- Przeciw: zapis rosnie o nowe pola, ktore trzeba obslugiwac przy wczytywaniu.
- Przeciw: zapisy z tego okna zrobione przed poprawka nie zostana naprawione.
- Konsekwencja implementacyjna: dodanie opcjonalnych pol do zapisu (ten sam wzorzec, co w poprzednich poprawkach zapisu; stare zapisy laduja sie jak dotad). Zapis i wczytanie kolejek oraz miejsca startu. Naklad pracy: nie zmierzono.
- Konsekwencja testowa: nowy test zapisu przed stolica i wczytania; testy zapisu po stolicy bez zmian; test starego zapisu bez nowych pol musi dalej przechodzic.

**Wariant B: Zablokowac zapis do zalozenia pierwszego miasta**
- Co zobaczy gracz: przed zalozeniem stolicy opcja zapisu jest niedostepna, z komunikatem „Zapis niedostepny przed zalozeniem pierwszego miasta”. Po zalozeniu stolicy zapis dziala normalnie.
- Za: nie da sie zapisac stanu, ktorego brakuje. Zasada jest prosta do zrozumienia.
- Za: nie trzeba zmieniac formatu zapisu.
- Przeciw: gracz nie moze zapisac gry w pierwszych ruchach. Jesli zamknie gre, straci postep z tego okna.
- Przeciw: to nowa zasada dla gracza, ktorego ograniczenie dotyczy takze zapisow, ktore nie maja problemu.
- Konsekwencja implementacyjna: warunek i komunikat w jednym miejscu, w menu zapisu. Maly zakres zmian, ale zmiana zasad gry.
- Konsekwencja testowa: nowy test blokady zapisu przed stolica i test zapisu po stolicy bez zmian. Testy zgodnosci zapisow bez zmian.

**Wariant C: Nic nie zmieniac**
- Co zobaczy gracz: bez zmian. Zapis zrobiony przed stolica moze po wczytaniu nie miec czesci swiata, a krag startu moze wskazywac stare pole.
- Za: zero pracy i zero ryzyka regresji w zapisie.
- Za: gracz nie dostaje nowych ograniczen.
- Przeciw: zostaje ryzyko utraty czesci swiata po wczytaniu. Nie zmierzono, jak czesto to sie zdarza.
- Przeciw: gracz, ktory wczyta taki zapis, moze nie wiedziec, ze czegos brakuje.
- Konsekwencja implementacyjna: brak.
- Konsekwencja testowa: brak nowych testow.

**Rekomendacja: wariant A.** Usuwa utrate swiata, nie odbiera graczowi zadnej opcji i nie zmienia zasad. Wlasciciel nie zalezy od starych zapisow, wiec to, ze zapisy sprzed poprawki zostaja bez zmian, nie jest tu problemem. Wariant B jest prostszy, ale kosztuje gracza mozliwosc zapisu w pierwszych ruchach. Wariant C zostawia znany problem.

Szczegoly (dla orkiestratora, nie do czytania przez wlasciciela): zrodlo faktow dyspozycje/autobot/runs/R-WEB-SAVE-PRE-CAPITAL-Q43/FAKTY.md (plik dokumentu analizy ZAPIS-STAN-AUDYT-2026-11-28.md w tym katalogu nie istnieje; oparto sie tylko na FAKTY.md). Odnosniki: poprawka pol zapisu jak w FALACH 937 i 938. Nie zmierzono na zywo: liczby zapisow w oknie, zawartosc zapisu po wczytaniu, naklad pracy.

Uwaga procesowa: w trakcie pracy omylkowo wywolalem narzedzie zakladania zadania (spawn_task) z bezuzytecznym placeholderem. Zostalo odrzucone przez klasyfikator uprawnien, nic nie utworzono. Nie ponawiam. Nie zmodyfikowano zadnych plikow repo, nie commitowano, nie uruchamiano zadan.
