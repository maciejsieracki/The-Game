# R-WEB-SAVE-PRE-CAPITAL-Q43 — fakty dla turnieju C-018 (źródło: audyt SAVEAUDIT i SAVESTATEFIX; dokumenty dyspozycje/analizy/ZAPIS-STAN-AUDYT-2026-11-28.md i ZAPIS-STAN-POPRAWKI-2026-11-28.md; wszystko z czytania kodu, NIE zmierzone na żywo)

Sytuacja w grze: na początku nowej gry gracz najpierw wybiera miejsce i zakłada pierwsze miasto (stolicę). Zaplanowane rzeczy, które mają się pojawić dopiero po założeniu stolicy gracza: obce miasta-państwa i klastry cywilizacji AI (kolejka „zaplanowanych obcych miast”), dodatkowi rywale tego samego typu co gracz (kolejki rywali tego samego typu: liczba, pola startowe, właściciele). Do czasu założenia stolicy te rzeczy czekają w pamięci gry.

Co ustalono z kodu:
1. Te kolejki oraz zapamiętany punkt startu gracza (pole startowe, od którego liczy się krąg odkrycia i reguła zakładania pierwszego miasta) NIE są zapisywane w pliku zapisu.
2. Gra NIE blokuje zapisu przed założeniem stolicy gracza (blokada zapisu istnieje tylko w trakcie bitwy).
3. Wniosek z kodu: jeśli gracz zapisze grę przed założeniem pierwszego miasta i potem ją wczyta, to po założeniu stolicy kolejki są puste — obce miasta-państwa/klastry AI i dodatkowi rywale tego samego typu mogą w ogóle nie pojawić się w tej grze; krąg startu może wskazywać stary hex.
4. NIE zmierzono na żywo: ile realnych zapisów powstaje w tym oknie (przed założeniem stolicy), co dokładnie widzi gracz po wczytaniu, czy pierwszy zapis „po założeniu stolicy” zawiera już te rzeczy. Zapis po założeniu stolicy i późniejsze zapisy nie są dotknięte (już po utworzeniu kolejki są opróżnione, a efekty są w stanie świata, który jest zapisywany).
5. Poprawka dodająca nowe opcjonalne pola do zapisu jest taka sama jak w FALACH 937 i 938 (stare zapisy ładują się jak dotąd). Zablokowanie zapisu przed założeniem stolicy to zmiana zasad dla gracza (komunikat „Zapis niedostępny przed założeniem pierwszego miasta”).

Pytanie (Q43): co zrobić z zapisem gry zrobionym PRZED założeniem pierwszego miasta: (A) zapisywać te zaplanowane elementy razem z grą, (B) blokować zapis do czasu założenia pierwszego miasta, (C) nic nie zmieniać (zostaje ryzyko, że wczytana gra nie będzie miała części świata).
