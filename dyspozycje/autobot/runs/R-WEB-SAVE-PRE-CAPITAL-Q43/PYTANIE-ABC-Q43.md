**R-WEB-SAVE-PRE-CAPITAL-Q43: co ma się stać, gdy gracz zapisze grę przed założeniem pierwszego miasta, a potem ją wczyta?**

**Sytuacja w grze:** Na początku nowej gry gracz wybiera miejsce i zakłada pierwsze miasto, czyli stolicę. Dopiero po jej założeniu mają pojawić się w świecie obce miasta-państwa, grupy cywilizacji sterowanych przez komputer (AI) i dodatkowi rywale tego samego typu co gracz. Do tego momentu te elementy czekają w pamięci gry. Z czytania kodu wynika, że zapis zrobiony przed stolicą ich nie zawiera, a gra takiego zapisu nie blokuje (zapis jest blokowany tylko w trakcie bitwy). Po wczytaniu świat może więc w ogóle nie dostać obcych miast, grup AI ani rywali, a obszar odkrywany na starcie może być liczony od złego, starego pola. Te ustalenia pochodzą wyłącznie z czytania kodu i nie są sprawdzone na żywo. Nie zmierzono, ile takich zapisów powstaje ani co dokładnie widzi gracz po wczytaniu. Zapisy zrobione po założeniu stolicy tego problemu nie mają.

**Cel:** Wczytana gra ma zawsze mieć cały świat, który gra zaplanowała.

**Dlaczego teraz:** Zapis gry jest właśnie poprawiany. Ta decyzja określa, co od tej poprawki ma się dziać z zapisami z początku gry. Stare zapisy nie są tu ważne, bo właściciela nie interesują. Ich wczytywanie ma tylko nadal działać, jak dotąd.

### Wariant A: Zapisywać zaplanowane elementy razem z grą (Rekomendowane)
- **Co zobaczy gracz:** Po wczytaniu zapisu z początku gry obce miasta-państwa, grupy AI i rywale pojawiają się tam, gdzie gra je zaplanowała, a obszar startu jest liczony od właściwego pola. Gracz może zapisać grę od pierwszej chwili i nie dostaje żadnej nowej zasady.
- **Za:** Wczytana gra ma być taka sama jak gra, którą gracz zapisał. Nic nie jest mu odbierane.
- **Za:** Problem znika u źródła, także dla przyszłych zapisów z tego okna. Rozgrywka i walka się nie zmieniają.
- **Przeciw:** Zapis z początku gry staje się większy (o ile, nie zmierzono).
- **Przeciw:** Trzeba dopilnować, żeby po wczytaniu elementy, które gra już wprowadziła, nie pojawiły się drugi raz. To dodatkowy punkt ryzyka (nie zmierzono). Zapisy z tego okna zrobione przed poprawką nie zostaną naprawione.
- **Konsekwencja implementacyjna:** Do zapisu dochodzą nowe, opcjonalne dane o zaplanowanych miastach, rywalach i miejscu startu, oraz ich odczyt przy wczytaniu. Stare zapisy ładują się jak dotąd. Ruszana jest tylko część gry odpowiedzialna za zapis i wczytanie. Nakład pracy: nie zmierzono.
- **Konsekwencja testowa:** Nowy przypadek: zapis przed stolicą, po wczytaniu i założeniu stolicy elementy są na miejscu i nie powtarzają się. Test starego zapisu bez nowych danych musi nadal przechodzić. Pozostałe testy zapisu bez zmian.

### Wariant B: Zablokować zapis do czasu założenia pierwszego miasta
- **Co zobaczy gracz:** Przed założeniem stolicy opcja zapisu jest niedostępna, z komunikatem „Zapis niedostępny przed założeniem pierwszego miasta". Po założeniu stolicy zapis działa jak dotąd.
- **Za:** Żaden zapis nie może zgubić części świata, bo zapis przed stolicą w ogóle nie powstaje.
- **Za:** Zasada jest prosta do zrozumienia i nie wymaga zmiany formatu zapisu.
- **Przeciw:** Gracz nie może zapisać gry na samym początku. Jeśli wyjdzie z gry przed założeniem stolicy, traci ten postęp (jak długo trwa to okno, nie zmierzono).
- **Przeciw:** To nowa zasada dla gracza, którą odczuje jako utrudnienie.
- **Konsekwencja implementacyjna:** W menu zapisu dochodzi sprawdzenie, czy stolica już stoi, oraz komunikat. Format zapisu bez zmian. Nakład pracy: nie zmierzono.
- **Konsekwencja testowa:** Nowy przypadek: próba zapisu przed stolicą jest odrzucona z komunikatem. Testy zapisu po stolicy i zgodności starych zapisów bez zmian.

### Wariant C: Nic nie zmieniać
- **Co zobaczy gracz:** Bez zmian. Zapis przed stolicą nadal się wykona, ale po wczytaniu świat może nie mieć obcych miast, grup AI i rywali, a start może być liczony od złego pola. Gra nie ostrzeże o niczym.
- **Za:** Zero pracy i zero zmian w grze.
- **Za:** Gracz nie dostaje żadnych nowych zasad, a zapis nadal działa w każdej chwili.
- **Przeciw:** Gracz może dostać grę z niepełnym światem i uznać ją za zepsutą. Nie zmierzono, jak często to się zdarza.
- **Przeciw:** Problem zostaje w grze i dotyczy każdego zapisu zrobionego przed stolicą (wniosek z kodu, nie zmierzono na żywo).
- **Konsekwencja implementacyjna:** Brak.
- **Konsekwencja testowa:** Brak nowych testów. Znane ryzyko pozostaje.

**Rekomendacja: wariant A.** Cel to kompletny świat po wczytaniu. Wariant A go zapewnia, nie odbiera graczowi możliwości zapisu i nie dodaje żadnej reguły. Wariant B też rozwiązuje problem, ale kosztem możliwości zapisu w pierwszych ruchach gry. Wariant C zostawia niepełny świat bez ostrzeżenia. Koszt A to większy zapis i dopilnowanie, by elementy nie pojawiły się dwa razy. Ponieważ właściciel nie zależy od starych zapisów, to, że zapisy sprzed poprawki nie zostaną naprawione, nie jest tu problemem. Nie zmierzono, jak często powstają zapisy z tego okna, więc skala korzyści jest nieznana.

Szczegóły: zaplanowane obce miasta i grupy AI, kolejki rywali tego samego typu i zapamiętany punkt startu nie są zapisywane w pliku zapisu. Blokada zapisu istnieje tylko w trakcie bitwy. Wariant A to ta sama metoda opcjonalnych pól co w FALACH 937 i 938. Wariant B to zmiana zasad gry z komunikatem „Zapis niedostępny przed założeniem pierwszego miasta". Źródło: dyspozycje/autobot/runs/R-WEB-SAVE-PRE-CAPITAL-Q43/FAKTY.md. Wszystko pochodzi z czytania kodu i nie jest zmierzone na żywo.
