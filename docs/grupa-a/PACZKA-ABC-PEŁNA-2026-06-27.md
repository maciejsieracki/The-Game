# Grupa A — Paczka ABC pełna (2026-06-27)

> **Wyjątek od limitu 5 pytań** — na prośbę Macieja: wszystkie 8 pytań w jednej paczce, wyczerpująco.  
> **Format:** `docs/decyzje/DYSPOZYCJA-STALA.md` §2 · wzór jakości: `docs/MACIEJ-DECYZJE-ROZWINIETE.md`  
> **Odpowiedź:** jedna linia na końcu dokumentu.

**Kontekst:** Większość HUD (pasek, minimapa, chipy, dyplomacja, budowa z mapy, panel jednostki) masz już **zatwierdzoną**. Poniższe pytania domykają **rozbieżności** między starymi decyzjami a mockupem D1B, **priorytet v1.0** oraz **sign-off wizualny**. Bez odpowiedzi zespół nie wie, co wdrażać w pierwszej grywalnej wersji.

**Jak czytać:** przy każdym pytaniu najpierw „O co chodzi" — wyobraź sobie, że grasz na **mapie świata** (widok strategiczny, nie bitwa).

---

### A1-Q13 — Koniec tury: jeden przycisk czy dwa?

**[EKRAN: Mapa świata]**

**O co chodzi i dlaczego decydujemy**

Na **dolnej krawędzi ekranu** (dolny pasek interfejsu) masz przyciski **WYKONAJ** i **Zakończ turę** — to już zatwierdziłeś (A1-Q9, mockup D1B). W **wcześniejszej** decyzji (A1-Q10) było też: **drugi** sposób kończenia tury — **okrągły przycisk** w **prawym dolnym rogu mapy** (nad minimapą). Mockup D1B, który zaakceptowałeś (ABC1=A), pokazuje **tylko prostokątny** „Zakończ turę" na dolnym pasku — **bez** okręgu w rogu. Oba przyciski robią to samo i podlegają tej samej **bramie** (nie skończysz tury, dopóki nie rozstrzygniesz ważnych chipów po prawej). Musisz wybrać, czy **zmieniamy** starą decyzję na rzecz mockupu, czy trzymamy oba wejścia.

**A — Tylko prostokątny „Zakończ turę" na dolnym pasku (jak mockup D1B)**

- **Co zobaczysz:** jeden wyraźny, szeroki przycisk obok WYKONAJ u dołu ekranu. W rogu mapy **nie ma** drugiego przycisku końca tury.
- **Za:** spójność z mockupem, który już zaakceptowałeś; mniej elementów na ekranie; nowy gracz od razu widzi, gdzie kończy turę; szybsza implementacja.
- **Przeciw:** gracze lubiący skróty w rogu mapy stracą „okrąg"; decyzja A1-Q10 (A+B) wymaga **korekty** w dokumentacji.

**B — Oba: prostokąt na pasku + okrąg w prawym dolnym rogu mapy (jak A1-Q10 pierwotnie)**

- **Co zobaczysz:** ten sam dolny pasek co w mockupie **oraz** dodatkowy okrągły przycisk w rogu — oba kończą turę (z tą samą bramą chipów).
- **Za:** dwa wygodne wejścia — pasek dla początkujących, okrąg dla szybkiej gry; zgodność ze starą decyzją A1-Q10 bez jej zmiany.
- **Przeciw:** dwa elementy robią to samo — może mylić („który kliknąć?"); mockup D1B tego **nie pokazuje** — rozjazd wizualny z zaakceptowanym układem; więcej pracy przy wdrożeniu.

**C — Tylko okrąg w rogu mapy (bez prostokąta „Zakończ turę" na pasku)**

- **Co zobaczysz:** na dolnym pasku zostaje WYKONAJ, ale **nie ma** szerokiego „Zakończ turę"; kończysz turę wyłącznie okręgiem w rogu.
- **Za:** więcej miejsca na pasku dolnym; mniej „przycisków obok siebie".
- **Przeciw:** **odchodzi od mockupu D1B**; koniec tury mniej widoczny dla nowych graczy; sprzeczne z A1-Q9 (WYKONAJ + Koniec tury obok siebie).

**Rekomendacja:** **A** — mockup D1B (ABC1=A) jest Twoim kanonem; jeden prostokątny przycisk wystarczy i jest czytelniejszy.

---

### A1-Q14 — Kiedy uznajemy interfejs mapy za gotowy do wpisania w grę?

**[EKRAN: Mapa świata]**

**O co chodzi i dlaczego decydujemy**

Masz **gotowe mockupy HTML** (plik `UI/Makieta-HUD-D1B-preview.html`) — klikalny podgląd paska, minimapy, chipów, panelu jednostki, trybu budowy. W **prawdziwej grze** (plik podglądowy w wersji roboczej) działa dziś tylko **część** tego interfejsu: pasek zasobów, minimapa, chipy, dyplomacja. **Brakuje** m.in.: lewego paska narzędzi (Cuda, Budowa), przycisku WYKONAJ, panelu jednostki na dole, trybu 🔨 budowy ulepszeń. Zespół musi wiedzieć, **czy może wpinać** resztę na podstawie mockupu, czy **czeka** aż zobaczysz to w grze.

**A — Mockup wystarczy: wpinaj w grę bez czekania na mój playtest w wersji roboczej**

- **Co zobaczysz:** najszybciej pełniejszy interfejs w grze; pierwszy raz ocenisz go dopiero w wersji roboczej lub finalnej.
- **Za:** najkrótsza droga do grywalnej wersji; ABC1=A to już Twoja akceptacja układu; nie blokujesz pracy tygodniami.
- **Przeciw:** jeśli coś w mockupie „na papierze" okazało się niewygodne, zobaczysz to późno; możliwe poprawki po wdrożeniu.

**B — Czekaj: nic więcej nie wpinać, dopóki nie przetestuję w wersji roboczej gry**

- **Co zobaczysz:** gra długo zostaje z niepełnym interfejsem; dopiero po zbudowaniu wersji roboczej oceniasz i dopiero wtedy reszta idzie do gry.
- **Za:** oceniasz **prawdziwe** zachowanie (kliknięcia, skala, wydajność), nie tylko HTML; mniej „obietnic na mockupie".
- **Przeciw:** tygodnie bez pełnego HUD w grze; mockup leży gotowy, a gra stoi; opóźnia budowę, tryb budowy, panel jednostki.

**C — Dwa kroki: teraz krótki checklist mockupu + potem twarda bramka na wersji roboczej przed wersją finalną**

- **Co zobaczysz:** najpierw przechodzisz checklist w mockupie (15–20 min, plik START); zespół **równolegle** wpina moduły; przed wersją finalną **musisz** zatwierdzić wersję roboczą w grze.
- **Za:** szybki feedback od Ciebie teraz **i** bezpiecznik przed publikacją; mockup + gra — dwa etapy kontroli; standard projektu (dwie wersje: robocza → finalna).
- **Przeciw:** wymaga **dwóch** rund Twojego czasu (mockup + gra); trochę więcej organizacji.

**Rekomendacja:** **C** — nie blokujesz zespołu, ale masz pewność przed finalną wersją gry.

---

### A1-Q15 — Potęga (Power) na środku górnego paska: ile na pierwszą wersję gry?

**[EKRAN: Mapa świata]**

**O co chodzi i dlaczego decydujemy**

Na **środku górnego paska** mockup D1B pokazuje **Potęgę** — liczbę 0–100 opisującą siłę Twojego imperium (armia, miasta, ekonomia, epoka itd.). **Klik** w Potęgę otwiera **panel w środku ekranu** ze **składnikami** (np. „Armia 28%", „Bitwy 20%") i przykładowym **Respektem** wobec sąsiadów. To **osobny** element od zasobów (Jedzenie, Praca, Pieniądz…) — nie duplikujemy Potęgi na liście zasobów. Decyzja o **miejscu** Potęgi jest zamknięta; pytamy **zakres na v1.0**: czy gracz dostaje pełny panel po kliku, czy tylko liczbę, czy na razie nic.

**A — v1.0: pełna Potęga jak w mockupie (liczba + klik → panel składników)**

- **Co zobaczysz:** na środku paska „⚜ 62" (przykład); klik → overlay z 6 składnikami, wagami i Respektem wobec wybranej nacji.
- **Za:** spójność z mockupem; gracz rozumie, **skąd** bierze się siła imperium; dyplomacja ma sens (Respekt obok Potęgi).
- **Przeciw:** więcej ekranów do dopracowania; składniki muszą być **poprawnie liczone** w grze — ryzyko błędnych liczb na start.

**B — v1.0: tylko liczba Potęgi na pasku (bez panelu po kliku)**

- **Co zobaczysz:** środek paska pokazuje Potęgę; **klik nic nie otwiera** (albo krótki tooltip „wkrótce").
- **Za:** szybciej do gry; widać najważniejszą liczbę bez rozbudowanego panelu; panel można dodać po v1.0.
- **Przeciw:** kliknięcie bez efektu może irytować; mniej edukacji gracza, skąd bierze się Potęga.

**C — v1.0: bez Potęgi na pasku (dopiero po v1.0)**

- **Co zobaczysz:** górny pasek bez centralnej Potęgi — tylko zasoby po bokach, epoka, dyplomacja, menu.
- **Za:** minimum pracy; Respekt zostaje w panelu dyplomacji.
- **Przeciw:** mockup D1B traci **centralny** element; mniej „Civ-feel"; decyzja o miejscu Potęgi stoi w dokumentacji, ale gracz jej nie widzi.

**Rekomendacja:** **B** na v1.0 (liczba widoczna, panel później), **A** jeśli chcesz od razu pełny mockup w grze.

---

### A1-Q16 — Kultura i religia: panel po kliku vs kolor na mapie — co w pierwszej wersji?

**[EKRAN: Mapa świata]**

**O co chodzi i dlaczego decydujemy**

Obok **minimapy** (prawy dolny róg) masz ikony **Kultury** 🎭 i **Religii** ⛪. To **dwa różne** działania:

1. **Klik ikony** → panel / overlay **w środku ekranu** z parametrami (presja, zasięg w heksach, miasta w zasięgu, bonusy) — **już zatwierdziłeś** (A1-Q12a/b = A).
2. **Przełącznik zasięgu** → po włączeniu **heksy na mapie 3D** pokolorowane obrysem (gdzie sięga kultura / nasza religia) — routing „kto to robi" jest zamknięty; pytamy **czy to musi być w v1.0**.

Bez decyzji zespół może zrobić tylko panel (1), a mapa bez kolorów (2) — albo odwrotnie.

**A — v1.0: panel po kliku TAK; kolor zasięgu na mapie 3D NIE (dopiero po v1.0)**

- **Co zobaczysz:** klik 🎭/⛪ → pełny overlay z liczbami i listami; mapa **bez** kolorowych obrysów zasięgu (dane o zasięgu tylko w panelu).
- **Za:** spełnia A1-Q12; mniej obciąża mapę 3D; szybsza pierwsza wersja; gracz i tak widzi parametry w panelu.
- **Przeciw:** nie widać „geografii" kultury/religii na heksach; mniej efektowne planowanie ekspansji kulturowej.

**B — v1.0: oba — panel po kliku **oraz** przełącznik koloru zasięgu na mapie**

- **Co zobaczysz:** jak w mockupie D1B w pełni: panel + możliwość włączenia podświetlenia heksów obok minimapy.
- **Za:** najpełniejsza wizja; łatwiej planować, gdzie „dociera" kultura; spójność mockup = gra.
- **Przeciw:** więcej pracy nad mapą; ryzyko spowolnienia na słabszych komputerach; dwa systemy naraz do debugowania.

**C — v1.0: tylko kolor na mapie (bez pełnych panelów — same liczby w dymku)**

- **Co zobaczysz:** przełącznik zasięgu działa na mapie; klik ikony daje tylko krótki tooltip, nie pełny overlay.
- **Za:** mapa jako główne narzędzie strategiczne.
- **Przeciw:** **sprzeczne** z Twoją decyzją A1-Q12 (pełne parametry w panelu); gorsze dla gracza szukającego szczegółów.

**Rekomendacja:** **A** — panel najważniejszy; kolor na mapie może dojść w kolejnej wersji.

---

### A5-Q1 — Miasta epoki brązu: akceptujesz wygląd na mapie?

**[EKRAN: Mapa świata]**

**O co chodzi i dlaczego decydujemy**

Zatwierdziłeś (**D12 = A**), że miasta w **epoce brązu** mają **inne modele 3D** niż wcześniejsze (kamień) — po **4 wariantach** wizualnych (różne cywilizacje / style). Zespół mapy przygotował modele i **osobny podgląd** (otwórz plik podglądu miast brązu w folderze MAPA, jeśli jeszcze nie widziałeś). Pytamy nie o zasadę („czy brąz"), lecz o **sign-off wizualny**: czy te modele wchodzą do pierwszej wersji gry bez poprawek.

**A — Tak, 4 modele brązu wchodzą do v1.0 bez poprawek**

- **Co zobaczysz:** na mapie świata miasta w brązie wyglądają jak w podglądzie — od razu odróżniasz epokę od kamienia.
- **Za:** domyka D12; odblokowuje render w grze; spójność progresji epok wizualnie.
- **Przeciw:** jeśli coś Ci nie pasuje (rozmiar, kolor, czytelność), zostaje do późniejszej łatki.

**B — Poprawki przed v1.0 (opisz w czacie: co zmienić — kolor, wysokość, która nacja)**

- **Co zobaczysz:** kolejna iteracja modeli; gra z brązem wchodzi później.
- **Za:** doprecyzowujesz wizualnie dokładnie to, co Ci przeszkadza.
- **Przeciw:** opóźnia wpięcie; wymaga Twojego opisu („za ciemne", „za małe" itd.).

**C — v1.0: zostaw wszędzie modele kamienia; brąz dopiero po v1.0**

- **Co zobaczysz:** na mapie wszystkie miasta jak dziś (kamień), nawet w epoce brązu.
- **Za:** zero ryzyka wizualnego teraz; najprostsza implementacja.
- **Przeciw:** **sprzeczne z D12=A**; mniej satysfakcji z awansu epoki; gracz nie widzi postępu miasta.

**Rekomendacja:** **A** — o ile podgląd Ci odpowiada; jeśli nie oglądałeś, otwórz podgląd **przed** odpowiedzią albo wybierz **B** z opisem poprawek.

---

### A-OPS-Q1 — Stare mockupy HUD: archiwum czy kasować?

**[EKRAN: Mapa świata]** *(organizacja plików — nie wpływa bezpośrednio na rozgrywkę, ale myli przy playteście)*

**O co chodzi i dlaczego decydujemy**

W folderze `UI/` leżą **starsze** pliki podglądu HUD (`Makieta-HUD-mapa-swiata.html`, `Gra-podglad-HUD.html`). Zastąpił je **nowy hub** `Makieta-HUD-D1B-preview.html` (ten od ABC1=A). Przy otwieraniu plików łatwo kliknąć **zły** mockup i ocenić **przestarzały** układ. Pytamy, co zrobić ze starymi plikami.

**A — Przenieś do folderu archiwum (`UI/_archiwum/`), nie kasuj**

- **Co zobaczysz:** w głównym folderze UI zostaje tylko D1B + satelity; stare pliki w archiwum „na wszelki wypadek".
- **Za:** historia zachowana; zero ryzyka utraty; jasne „otwieraj D1B".
- **Przeciw:** pliki nadal w projekcie (tylko w podfolderze).

**B — Usuń te dwa stare pliki HUD**

- **Co zobaczysz:** tylko aktualne mockupy; brak starych wersji w explorerze.
- **Za:** najmniej bałaganu; niemożliwe otwarcie złego pliku przypadkiem.
- **Przeciw:** bez kopii zapasowej poza historią gita (jeśli w ogóle commitowane).

**C — Zostaw wszystko jak jest**

- **Co zobaczysz:** bez zmian — kilka podobnych plików HUD obok siebie.
- **Za:** zero operacji teraz.
- **Przeciw:** mylenie wersji przy playteście i checklistach; audyt nadal „wisi".

**Rekomendacja:** **A**

---

### A3-Q1 — Łączenie armii na mapie: proste okno czy bogaty panel?

**[EKRAN: Mapa świata]**

**O co chodzi i dlaczego decydujemy**

Gdy na **sąsiednich heksach** masz **dwie armie**, gra może zaproponować **połączenie** w jedną większą. Dziś jest **proste okno**: „Połączyć armie? Tak / Nie" (plus podstawowa logika stosu). W **decyzji D7=B** uzgodniliście, że **rozbudowany panel** jak w grach typu Total War (szczegóły składu, kolejność, podgląd) — **po v1.0**. Mockup `Makieta-panel-armii.html` pokazuje bogatszą wersję. Pytamy: czy na **pierwszą wersję gry** wystarczy proste okno.

**A — v1.0: proste okno „Połącz / Nie" wystarczy (zgodnie z D7=B)**

- **Co zobaczysz:** szybki dialog przy łączeniu; bez rozbudowanego panelu armii na mapie.
- **Za:** już przygotowane; nie opóźnia HUD, budowy, panelu jednostki; zgodne z D7.
- **Przeciw:** mniej wygodne zarządzanie wieloma jednostkami; power-userzy mogą chcieć więcej.

**B — v1.0: bogaty panel łączenia (jak mockup panelu armii) przed premierą**

- **Co zobaczysz:** większe okno ze składem armii, podglądem jednostek, wygodniejszym łączeniem.
- **Za:** lepsze UX wojska; bliżej docelowej wizji D7 (ale wcześniej niż planowano).
- **Przeciw:** duży dodatkowy zakres; **konkuuruje** z priorytetem pełnego HUD i budowy ulepszeń; tygodnie opóźnienia.

**C — v1.0: bez ręcznego łączenia (tylko automatyczne lub wcale)**

- **Co zobaczysz:** armie na sąsiednich polach **nie** proponują połączenia; gracz zarządza każdą osobno.
- **Za:** najmniejszy zakres; zero okien łączenia.
- **Przeciw:** gorsze zarządzanie wojskiem; sprzeczne z obecną logiką gry; frustrujące przy wielu jednostkach.

**Rekomendacja:** **A**

---

### A1-Q17 — Żywność na górnym pasku zasobów: pokazać w v1.0?

**[EKRAN: Mapa świata]**

**O co chodzi i dlaczego decydujemy**

Mockup **revA** pokazuje na **górnym pasku** siedem pozycji, pierwsza to **Żywność** (ikona + liczba + czasem +X/t). W grze model **żywności imperium** (jak sumować zapasy państwa vs miasta) **nie jest jeszcze domknięty** — to temat **Grupy B** (decyzja B5). Zespół interfejsu nie wie: czy **pokazać** Żywność na HUD już w v1.0 (nawet z przybliżonymi liczbami), **ukryć** do B5, czy pokazać **symbol** bez liczby.

**A — v1.0: pokaż Żywność na pasku (liczba — nawet jeśli na start uproszczona)**

- **Co zobaczysz:** pełny pasek jak mockup revA — Żywność jako pierwsza pozycja z liczbą i ewentualnie +X/t.
- **Za:** spójność z mockupem; gracz widzi kluczowy zasób od początku; można poprawić wzór liczenia po B5.
- **Przeciw:** liczby mogą być **chwilowo błędne** lub niespójne z ekonomią miasta — ryzyko wprowadzenia w błąd.

**B — v1.0: ukryj Żywność na pasku — dopnij po decyzji B5 (Grupa B)**

- **Co zobaczysz:** pasek z **sześcioma** zasobami (bez Żywności) do czasu domknięcia ekonomii.
- **Za:** nie pokazujesz fałszywych liczb; czysta synchronizacja z Grupą B.
- **Przeciw:** rozjazd z mockupem revA; gracz nie widzi żywności na mapie świata (tylko w mieście?).

**C — v1.0: ikona Żywności bez liczby (placeholder „—" lub „?" do B5)**

- **Co zobaczysz:** miejsce na pasku jest, ale zamiast liczby — kreska lub znak zapytania; sygnalizuje „mechanika w drodze".
- **Za:** układ paska jak mockup; **bez** fałszywych danych; gracz wie, że zasób istnieje.
- **Przeciw:** wygląda **niedokończone**; może irytować przy każdej turze.

**Rekomendacja:** **C** (kompromis) lub **B** jeśli wolisz zero placeholderów; **A** tylko jeśli akceptujesz ryzyko złych liczb na start.

---

## Podsumowanie numeracji

| ID | Temat |
|----|--------|
| A1-Q13 | Koniec tury: prostokąt vs okrąg |
| A1-Q14 | Bramka: mockup vs wersja robocza gry |
| A1-Q15 | Potęga na pasku — zakres v1.0 |
| A1-Q16 | Kultura/religia: panel vs kolor na mapie |
| A5-Q1 | Sign-off miast brązu |
| A-OPS-Q1 | Archiwum starych mockupów |
| A3-Q1 | Łączenie armii — proste vs bogate okno |
| A1-Q17 | Żywność na pasku HUD |

---

## Odpowiedź Macieja (jedna linia)

```
A1-Q13=A, A1-Q14=C, A1-Q15=B, A1-Q16=A, A5-Q1=A, A-OPS-Q1=A, A3-Q1=A, A1-Q17=C
```

Przy **A5-Q1=B** dopisz w czacie, co zmienić w miastach brązu.  
Przy **A1-Q17** możesz dodać własny wariant — przepiszemy na zadania.

---

*Po odpowiedzi: zapis do `docs/decyzje/` · aktualizacja `MAPA-PYTAN-OPEN.md` · dyspozycje dla zespołu.*
