# Zasady współpracy — jak mam działać przy „The Game"

> Ustalenia użytkownika dotyczące mojego (Claude) sposobu pracy. Trzymam się ich i dopisuję nowe, gdy je ustalisz.
> **Po każdej zmianie zasad aktualizuję ten plik. Na początku każdej sesji/dnia odczytuję go, żeby przypomnieć sobie zasady.**
> Ostatnia zmiana: 2026-06-21.

1. **Rola — reżyser i twórca.** Podejmuję decyzje projektowe sam, gdy to rozsądne; nie blokuję się pytaniami, gdy mogę przyjąć sensowne założenie. Przy realnym rozwidleniu — proponuję i pytam krótko.
2. **Pętla pracy:** zadawaj sobie pytania → testuj → poprawiaj. **Testuję zanim oddam** (symulacja w Node, smoke-test) i nie zostawiam błędów.
3. **Responsywność przez subagentów (priorytet):**
   - **Do każdego zadania uruchamiam osobnego subagenta** (praca równoległa), żeby główny agent był wolny i gotowy na nową odpowiedź.
   - **Każde Twoje pytanie** obsługuję, odpalając **nowego subagenta**, by odpowiedź przyszła jak najszybciej i żebyś nie czekał, gdy jestem zajęty pracą.
   - Cel: nigdy nie blokować Twojej możliwości otrzymania szybkiej odpowiedzi.
   - **Dedykowany agent na każdy wątek/zadanie/pytanie:** każdy wątek tematyczny, każde zadanie i każde pytanie obsługuje OSOBNY subagent (np. ten plik zasad prowadzi inny agent niż budowa gry, a kolejny wątek — jeszcze inny). Agenty się nie współdzielą; główny agent jedynie koordynuje i relacjonuje wyniki, dzięki czemu pozostaje wolny i gotowy na szybką odpowiedź.
4. **Baza mechanik:** opieram się głównie na sprawdzonych rozwiązaniach Civ (OpenCiv3 / Freeciv / Unciv) — kopiuję „kierownicę", a nasze modyfikacje (zwłaszcza ekonomia) dokładam na wierzch.
5. **Technologia:** gra w HTML + JS (Canvas, mapa heksowa, prosta grafika), w przeglądarce. Bez Claude Code — pracujemy w Cowork.
6. **Język:** polski.
7. **Pliki:** zapisuję wszystko w folderze `…\_NOWA_STRUKTURA\06_Prywatne\Gry\Civ` (OneDrive — **nie** Google Drive). **Jeden plik na rzecz, bez duplikatów.** Excel = edytowalna powierzchnia danych (Ty zmieniasz liczby, ja wgrywam do gry).
8. **Dokument główny:** `PROJEKT-GRY-master.md` to żywe źródło prawdy — **aktualizuję je na bieżąco** przy każdej zmianie tego, co robimy i ustalamy.
9. **Iteracje:** małe, testowalne kroki (v0.1 = Kamień + Brąz), potem rozbudowa epoka po epoce.
10. **Format pytań:** gdy o coś pytam, podaję je **ponumerowane** (Pytanie 1, 2, 3…), każde z **min. 3 scenariuszami: A / B / C**. Ty odpowiadasz krótko, np. „1A, 2C, 3B" — to przyspiesza decyzje.
11. **Każde pytanie → osobny subagent do pracy:** gdy odpowiesz na pytanie, kieruję Twoją odpowiedź i wynikającą z niej pracę do KOLEJNEGO, osobnego subagenta — nie wykonuję jej w głównym agencie. Dzięki temu główny agent pozostaje wolny do rozmowy.
12. **Brak dostępu do pliku = plik otwarty u Ciebie:** jeśli nagle tracę dostęp do pliku (blokada / odmowa zapisu), **NIE tworzę kolejnej kopii**. Piszę Ci, że nie mam dostępu — plik jest prawdopodobnie **otwarty i przez Ciebie edytowany**. Proszę, żebyś go zamknął/udostępnił; gdy potwierdzisz, że OK, **zawsze najpierw sprawdzam, co w nim zmieniłeś**, i dopiero wtedy wprowadzam nowe zmiany.
13. **Orkiestracja — wszystko przez subagentów:** główny agent NIE wykonuje sam żadnych operacji (Read/Write/Edit/Bash/Excel/kod). **Każdą operację wykonuje osobny subagent.** Główny agent wyłącznie orkiestruje: zadaje pytania, rozdziela zadania, prezentuje wyniki — dzięki temu jest zawsze wolny i odpowiada szybko.
14. **Widoczność postępu:** przy każdej pracy pokazuję stan każdego subagenta na **liście zadań** (status: w toku / zrobione) — nad czym pracuję i co już gotowe. Aktualizuję na bieżąco.
15. **Hierarchia subagentów:** większe tematy prowadzi **subagent-lider** (np. „mapy", „jednostki", „ekonomia", „walka"), który MOŻE tworzyć własne **pod-subagenty** do mniejszych wycinków tematu (np. lider „mapy" → osobny pod-subagent na każdy typ mapy). Główny agent orkiestruje liderów; liderzy dzielą pracę niżej. Cel: praca równoległa, uporządkowana, bez gubienia wątków.
16. **Bez kafelków/podglądu plików (present_files):** mechanizm kafelków uruchamia łączenie z Google Drive — NIE używam go. Po każdej zmianie podaję wyłącznie **nazwę pliku** (w razie potrzeby pełną ścieżkę) do otwarcia wprost z lokalnego folderu projektu `…\Gry\Civ` (OneDrive na dysku użytkownika). Użytkownik edytuje pliki bezpośrednio z folderu.
17. **Pytania tylko w tekście (bez formularza):** nie używam formularza pytań (AskUserQuestion) — bywa, że się zawiesza. Wszystkie pytania zadaję w treści wiadomości.
18. **Numerowanie pytań:** pytania numeruję 1, 2, 3…, a opcje w każdym pytaniu oznaczam A/B/C (nie literuję samych pytań).
19. **Tryb pracy (responsywność):** na pytania i w rozmowie odpowiadam OD RAZU tekstem, bez odpalania subagentów. Subagentów uruchamiam dopiero na sygnał („wykonaj"/„dalej") albo przy domykaniu tematu. Gdy wykonuję — po jednym małym subagencie naraz; kilka równolegle tylko, gdy wyraźnie o to prosisz (praca w tle).
20. **Strojne parametry zawsze w Excelu:** wszelkie wartości do dostrajania (ekonomia, AI, balans) trzymam w plikach Excel — to Twoja baza do edycji; ja eksportuję je do JSON pod grę.
21. **Auto-eksport danych:** eksport Excel→JSON jest wpięty w build/uruchomienie gry (odpala się sam jako pierwszy krok). „Przelicz dane" = ręczny trigger eksportu na żądanie.
