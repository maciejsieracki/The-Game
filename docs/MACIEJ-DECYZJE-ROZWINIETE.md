# MACIEJ — DECYZJE ROZWINIĘTE (główna lektura)

> **To jest Twoja główna lektura przed decyzjami.** Każde pytanie D1–D15 tłumaczone prostym językiem:
> co się dzieje w grze, co zobaczysz na ekranie, czym różnią się opcje, ile czasu kosztują.
> Skrócona tabela (do wpisania liter): `docs/MACIEJ-KARTA-DECYZJI.md`.
> Pełny kontekst techniczny: `docs/CURSOR-MASTER-PLAN-DOKONCZENIA.md` §8.
>
> **Autor:** MASTER (GLM 5.2, rola Architekt). **Data:** 2026-06-26. **Język:** polski.

---

## Instrukcja dla Macieja — jak odpowiadać

1. **Czytaj to powoli.** Przy każdej decyzji najpierw przeczytaj „O co chodzi" — to opisuje sytuację w grze tak, jakbyś grał. Potem przeczytaj trzy opcje i wyobraź sobie, co zobaczysz na ekranie.
2. **Wybierz jedną literę: A, B lub C.** Jeśli żadna nie pasuje, napisz własny wariant — MASTER przetłumaczy go na zadania dla działów.
3. **Zaufaj rekomendacji MASTERa, ale decydujesz Ty.** Rekomendacja jest napisana z perspektywy gracza (czy gra będzie fajna i czy szybko powstanie), nie z perspektywy technicznej.
4. **Najpierw D1–D5 (P0).** To one odblokowują Sprint 1 — resztę możesz rozstrzygać w miarę potrzeby.
5. **Gdy skończysz D1–D5**, napisz w czacie np.: `D1=C, D2=A, D3=C, D4=A, D5=B` → MASTER rusza Sprint 1.
6. **Nie musisz rozumieć kodu ani terminów.** Jeśli coś jest niejasne — napisz „nie rozumiem D3 opcji B", MASTER doprecyzuje.

### Legenda priorytetów

- **P0** = blokuje grywalność. Bez tej decyzji gra nie ruszy do przodu. Rozstrzygnij **najpierw** (D1–D5).
- **P1** = wysoki priorytet. Potrzebne przed konkretną fazą (bitwa, ekonomia, polish). Rozstrzygnij, gdy dojdziesz, ale nie odkładaj długo.
- **P2** = średni priorytet. Można odłożyć po v1.0 bez psucia gry.

### Jak czytać „Kiedy gotowe (szacunek)"

Czas podajemy w **sprintach** (~1 tydzień każdy). „Szybko" = ułamka sprintu. „Po v1.0" = praca pojawi się dopiero w grze po wydaniu wersji 1.0 (czyli nie w tej odsłonie). To szacunki, nie obietnice — ale pokazują, która opcja jest droższa.

### Gdzie wpisać odpowiedzi

Skrócona tabela z miejscem na literę i datę: `docs/MACIEJ-KARTA-DECYZJI.md` (sekcja „Podsumowanie — tabela szybkiego rozstrzygania"). Skopiuj, wpisz, wklej w czacie.

---

## D1 — Widok główny, czyli pasek na ekranie gry (P0)

### O co chodzi (bez żargonu)

Kiedy grasz, na ekranie cały czas widzisz **pasek interfejsu** (HUD). To taki „pulpit sterowania": pokazuje ile masz jedzenia, pracy, pieniędzy, nauki i kultury (zasoby), którą jest teraz turę, które miasta masz, i opcjonalnie małą mapę poglądową (minimapę) w rogu. Dziś w grze jest już jakiś prosty pasek, ale nie jest jeszcze ładny ani pełny — brakuje mu np. minimapy i porządnego panelu bocznego z wydarzeniami. To, jak ten pasek wygląda, decyduje o tym, czy gra jest czytelna i przyjemna, czy musisz się domyślać, co się dzieje.

MAPA (dział, który rysuje mapę 3D) ma już przygotowany ładny widok główny i czeka tylko na Twoją decyzję, jaki układ paska zatwierdzamy. To pierwszy element, który gracz widzi po wejściu w grę.

### Dlaczego pytam teraz

Bez tej decyzji nie wpinamy czytelnego interfejsu do gry. To odblokowuje ok. 40% pracy w Sprincie 1 — gdy powiesz „C", MASTER od razu każe działom dokleić minimapę i panel boczny do obecnego paska.

### Opcja A — Zostaw obecny prosty pasek

- **Co zrobimy:** Nic nie zmieniamy w układzie. Zostaje dzisiejszy pasek: numer tury, zaznaczona jednostka, lista miast i surowe liczby zasobów. Nie doklejamy minimapy, nie robimy panelu bocznego.
- **Co zobaczysz jako gracz:** Gra działa, ale interfejs jest surowy — jak wersja robocza. Nie ma minimapy (musisz się poruszać po dużej mapie „na ślepo" albo przewijać), zasoby to suche cyfry bez ikon, nie ma panelu, który pokazuje co się wydarzyło tej tury.
- **Plusy:** Najszybsze — gra rusza do przodu natychmiast, bez czekania na projekt interfejsu. Zero ryzyka, że coś się popsuje.
- **Minusy / koszt:** Gra wygląda niegotowo. Granie na dużej mapie bez minimapy jest męczące. Do v1.0 i tak trzeba będzie to podnieść, czyli praca tylko się przesuwa.
- **Kiedy gotowe (szacunek):** Już jest (zero nowej pracy).

### Opcja B — Nowy pasek od zera (pełny projekt)

- **Co zrobimy:** Wyrzucamy obecny pasek i dział UI projektuje cały nowy interfejs od zera: nowy układ, nowe ikony, animacje, pełny panel boczny, minimapa, panele miast/events. MASTER robi makieta → Ty akceptujesz → dział UI koduje.
- **Co zobaczysz jako gracz:** Ładny, spójny, profesjonalny interfejs jak w gotowej grze komercyjnej. Wszystko czytelne, ładne ikony, panel boczny podpowiada co się dzieje, minimapa w rogu.
- **Plusy:** Najlepszy efekt wizualny i UX. Gra wygląda jak produkt, nie jak demo.
- **Minusy / koszt:** Najdroższa opcja. Pełny projekt interfejsu od zera to kilka sprintów pracy działu UI, zanim w ogóle ruszy implementacja. Opóźnia v1.0 o tygodnie. Ryzyko, że zmienisz zdanie w trakcie i praca idzie na śmietnik.
- **Kiedy gotowe (szacunek):** ~2–3 sprinty (~2–3 tygodnie) pracy UI, zanim zobaczysz efekt w grze.

### Opcja C — Obecny pasek + doklejona minimapa i panel boczny (kompromis)

- **Co zrobimy:** Zostawiamy obecny działający pasek (nie ruszamy go), ale **doklejamy** do niego dwa elementy krok po kroku: (1) minimapę w rogu ekranu (małą mapę poglądową), (2) panel boczny pokazujący wydarzenia z tury (co zbudowano, kto zaatakował, co się wydarzyło). Inkrementalnie, bez wielkiego projektu od zera.
- **Co zobaczysz jako gracz:** Już po pierwszym sprintcie masz minimapę (możesz szybko skakać po mapie) i panel boczny podpowiadający co się dzieje. Reszta paska zostaje znajoma. Gra staje się czytelna i grywalna bez czekania tygodniami na wielki redesign.
- **Plusy:** Szybko i pełno — dostajesz najważniejsze brakujące elementy (minimapa + panel) w Sprint 1, bez ryzyka i kosztu wielkiego projektu. Najlepszy stosunek efektu do czasu.
- **Minusy / koszt:** Pasek nie będzie tak „klimatyczny" i dopracowany wizualnie jak w opcji B. Pełen polish wizualny można dorobić później (po v1.0).
- **Kiedy gotowe (szacunek):** ~1 sprint (~1 tydzień) na minimapę + panel boczny.

### Rekomendacja MASTER

**C.** Jako gracz chcesz szybko widzieć mapę (minimapa) i wiedzieć co się dzieje (panel boczny), a nie czekać tygodniami na piękny pasek od zera. Opcja C daje Ci te dwie najważniejsze rzeczy już w Sprincie 1, zostawia działający interfejs w spokoju, a pełny wygląd może dojść później. To najszybsza droga do gry, w którą fajnie się gra.

### Po Twojej decyzji

MASTER zleci działowi MAPA przygotowanie minimapy, działowi UI panel boczny wydarzeń, i wepnie oba do obecnego HUD w Sprincie 1 (razem z granicą terytorium na mapie).

---

## D2 — Wpinamy gotową paczkę poprawek ekonomii miasta (P0)

### O co chodzi (bez żargonu)

Twoje miasta w grze mają **ekonomię co turę**: zbierają jedzenie (miasto rośnie), pracę (budujesz rzeczy), pieniądze, naukę i kulturę. Dział EKONOMIA razem z UI przygotował **gotową paczkę poprawek**, która udoskonala tę ekonomię — m.in. pozwala podzielić „Pracę" (surowiec budowlany) na sensowne kawałki i kupować rzeczy za Pieniądz zamiast czekać na produkcję. Ta paczka jest już napisana, przetestowana (23 testy zielone) i czeka w szufladzie — tylko czeka na Twoje „idz", żeby ją wpiąć do gry.

Wpinamy teraz, czy czekamy? To proste: paczka jest gotowa i niezależna od innych decyzji (nie koliduje z Wealth, patrz D3).

### Dlaczego pytam teraz

Paczka stoi gotowa od dni. MASTER nie wpije jej bez Twojego „idz" (zasada: nic do kodu bez Twojej akceptacji). Jedno słowo odblokowuje pełniejszą ekonomię miasta już w Sprincie 1.

### Opcja A — Wpinaj teraz

- **Co zrobimy:** MASTER wpija gotową paczkę do silnika gry w Sprincie 1. Ekonomia miasta zaczyna działać pełniej: podział Pracy i kupowanie za Pieniądz działają od razu.
- **Co zobaczysz jako gracz:** W mieście możesz podzielić pracę tak jak chcesz i kupić budynek/jednostkę za pieniądze zamiast czekać kilka tur na produkcję. Ekonomia staje się elastyczniejsza i przyjemniejsza.
- **Plusy:** Najszybciej — paczka gotowa, testy zielone, ryzyko minimalne. Odblokowuje pełniejszą ekonomię natychmiast. Niezależne od D3 (Wealth).
- **Minusy / koszt:** Brak istotnych minusów. Jeden bramkowany batch integracji (MASTER wpina, Opus robi review).
- **Kiedy gotowe (szacunek):** Ułamka sprintu (~1–2 dni) — paczka gotowa, tylko wpiecie + weryfikacja.

### Opcja B — Czekaj na decyzję Wealth

- **Co zrobimy:** Wstrzymujemy wpicie paczki, dopóki nie rozstrzygniesz D3 (Wealth). Argument: może spójność ekonomiczna będzie lepsza, jeśli zdecydujemy Wealth najpierw.
- **Co zobaczysz jako gracz:** Ekonomia miasta zostaje w dzisiejszym (mniej elastycznym) stanie przez kolejne tygodnie. Kupowanie za Pieniądz i podział Pracy niedostępne.
- **Plusy:** Teoretycznie jedna decyzja ekonomiczna naraz — mniej ryzyka niespójności.
- **Minusy / koszt:** Paczka czeka bez powodu (została zaprojektowana jako niezależna od Wealth). Gra stoi w miejscu na ekonomii, choć mogłaby ruszyć. Czas stracony.
- **Kiedy gotowe (szacunek):** Odłożone o co najmniej 1–2 sprinty (do rozstrzygnięcia D3 i implementacji Wealth).

### Opcja C — Wpiąć częściowo (bez bramki terytorialnej)

- **Co zrobimy:** Wpinamy tylko część paczki: podział Pracy i kupowanie za Pieniądz. Pomijamy bramkę terytorialną (czyli zasadę, że zakładasz miasta tylko na swoim terytorium). Bramkę wpijemy osobno później.
- **Co zobaczysz jako gracz:** Ekonomia elastyczniejsza (jak w A), ale miasta nadal można zakładać bez ograniczeń terytorialnych (jak dziś).
- **Plusy:** Mniejszy zakres wpiecia = mniejsze ryzyko. Część bramki i tak jest gotowa osobno (isInTerritory z MAPY).
- **Minusy / koszt:** Rozbijamy jedną paczkę na dwie tury wpiecia = dwa batche, dwa review. Więcej pracy organizacyjnej niż A.
- **Kiedy gotowe (szacunek):** ~1–2 dni na część + osobny batch na bramkę później.

### Rekomendacja MASTER

**A.** Paczka jest gotowa, przetestowana i celowo zaprojektowana jako niezależna od Wealth. Jako gracz od razu poczujesz, że ekonomia miasta jest elastyczniejsza (kupisz coś za pieniądze, podzielisz pracę). Czekanie (B) nic nie daje, a częściowe wpicie (C) rozbija jedną sprawę na dwie bez pożytku. Powiedz „idz" i gra rusza.

### Po Twojej decyzji

MASTER wpija paczkę EKONOMIA+UI do `main.ts` w Sprincie 1 (jeden bramkowany batch), Opus robi review, MASTER publikuje nowy kanon z pełniejszą ekonomią miasta.

---

## D3 — Ile „Wealth" (bogactwa) w grze na v1.0 (P0)

### O co chodzi (bez żargonu)

Wealth to **bogactwo** — zaplanowany dodatkowy zasób obok Pieniądza. Wyobraź sobie: Pieniądz to codzienna waluta (na utrzymanie, jednostki, podaż), a Wealth to „skarbiec"/kapitał na wielkie rzeczy (np. wonders, kupowanie jednostek premium, łapówki). Dział EKONOMIA ma już szkielet Wealth (25 testów zielone). Pytanie: **ile tego Wealth** chcemy w wersji 1.0? Czy pełny model (zarabianie na 6 sposobów, wydawanie na 6 sposobów, skomplikowane reguły), czy odłożenie po v1.0, czy **minimum** — jedna pula Wealth, jeden sposób zarabiania, jeden wydawania.

To decyzja o głębokości ekonomii vs czasie. Pełny Wealth to duży kawałek pracy (epik), który może opóźnić v1.0.

### Dlaczego pytam teraz

Bez tej decyzji nie wiadomo, ile ekonomii trzeba zbudować. Opcja C odblokowuje ekonomię bez przeładowania scope'u — daje graczowi bogactwo jako realny zasób, ale bez miesięcy pracy.

### Opcja A — Pełny model Wealth (duży epik)

- **Co zrobimy:** Budujemy pełny Wealth: 6 sposobów zarabiania (handel, podatki, surowce, budynki, civBonusy, łupy) i 6 sposobów wydawania (jednostki premium, cuda, łapówki, pogoń nauki, hurrapatriotyzm, etc.). Pełny model W1–W6.
- **Co zobaczysz jako gracz:** Bogaty system ekonomiczny — bogactwo napędza wiele ścieżek gry. Możesz grać „ekonomicznym" stylem i mieć dużo opcji.
- **Plusy:** Najgłębsza ekonomia, dużo ścieżek gry.
- **Minusy / koszt:** Duży epik — kilka sprintów pracy EKONOMIA + UI (panel Wealth). Mocno obciąża harmonogram v1.0, ryzyko przesunięcia wydania.
- **Kiedy gotowe (szacunek):** ~3–4 sprinty (~3–4 tygodnie) implementacji + strojenie.

### Opcja B — Odłóż Wealth po v1.0

- **Co zrobimy:** Nie ma Wealth w v1.0 w ogóle. Gra działa bez niego (Pieniądz wystarcza). Wealth pojawi się w grze dopiero po wydaniu v1.0.
- **Co zobaczysz jako gracz:** Ekonomia oparta tylko o Pieniądz. Skarbiec/bogactwo jako koncepcja nie istnieje. Gra grywalna, ale ekonomicznie płytsza.
- **Plusy:** Najszybciej do v1.0 — żadnej pracy nad Wealth teraz.
- **Minusy / koszt:** Tracimy różnicę między „gotówką" a „kapitałem" — ekonomia mniej ciekawa. Bogactwo, które już częściowo istnieje (szkielet 25 testów), stoi nieużywane.
- **Kiedy gotowe (szacunek):** Po v1.0 (kilka sprintów dodatkowo w przyszłości).

### Opcja C — Minimalny Wealth (pula + 1 zarabianie + 1 wydawanie)

- **Co zrobimy:** Budujemy **minimum**: jedną pulę Wealth, jeden sposób zarabiania (np. z handlu/między) i jeden sposób wydawania (np. kupowanie jednostek premium albo przyspieszenie produkcji). Pełny model zostawiamy na po v1.0.
- **Co zobaczysz jako gracz:** Masz dwa zasoby pieniężne: Pieniądz (codzienne) i Wealth (na specjalne rzeczy). Bogactwo ma sens i realny wpływ, ale nie przytłacza ekranu economy. Możesz użyć Wealth na jedną fajną rzecz.
- **Plusy:** Bogactwo żyje w grze (różnica gotówka vs kapitał), ale bez miesiąca pracy. Odblokowuje ekonomię bez przeładowania scope'u. Najlepszy balans głębi vs czasu.
- **Minusy / koszt:** Wealth płytki — tylko jedna ścieżka zarabiania/wydawania. Niektóre pomysły (cuda, łapówki za Wealth) czekają po v1.0.
- **Kiedy gotowe (szacunek):** ~1 sprint (~1 tydzień) implementacji + panel UI.

### Rekomendacja MASTER

**C.** Jako gracz chcesz czuć, że „bogactwo" to coś więcej niż gotówka — żeby ekonomia miała drugi wymiar. Ale pełny model (A) to miesiąc pracy, który opóźni v1.0, a odłożenie (B) zostawia ekonomię płaską. Minimum C daje Ci realne bogactwo w grze już teraz, zostawiając pole do pogłębienia po v1.0.

### Po Twojej decyzji

Jeśli C: MASTER pisze spec Wealth minimalny, dział EKONOMIA koduje (pula + 1 zarabianie + 1 wydawanie), MASTER wpija w Fazie D, dział UI robi panel Wealth.

---

## D4 — Budowanie na mapie: drogi, irygacja, posterunki, forty (P0)

### O co chodzi (bez żargonu)

Na mapie 3D możesz **budować ulepszenia terenu**: drogi (szybszy ruch), irygację (więcej jedzenia z pól), posterunki (powiększają Twoje terytorium i dają zasięg widzenia), forty (silnie powiększają terytorium i dają bonus obrony). To ważny element gry — rozwijasz teren wokół miast i bronisz granic. Dział MAPA ma już gotowy **render** (czyli te ulepszenia ładnie wyglądają na mapie), bonusy są określone, a mechanika „buduj ulepszenie z mapy" (bez specjalnego Robotnika — został usunięty decyzją 2A) czeka na wpięcie. Robotnika nie ma: budujesz klikając na polu na mapie.

Pytanie: czy akceptujesz **obecną listę** ulepszeń i ich wartości (bonusy), czy chcesz przejrzeć liczby w Excelu, czy wolisz skrócić listę do 4 najważniejszych na v1.0?

### Dlaczego pytam teraz

Render gotowy, bonusy określone, ale dział SILNIK nie wpije akcji „buduj ulepszenie z mapy" bez Twojej akceptacji listy. To odblokowuje budowanie na mapie w Sprincie 1.

### Opcja A — Akceptuję obecną listę i wartości

- **Co zrobimy:** MASTER wpija akcję „buduj ulepszenie z mapy" w Sprincie 1 z obecną listą ulepszeń i bonusami. Wartości (ile droga przyspiesza, ile posterunek powiększa terytorium) zostają jak ustalono. Strojenie liczb może iść równolegle (playtest).
- **Co zobaczysz jako gracz:** Klikasz na pole na mapie, wybierasz „buduj drogę/irygację/posterunek/fort", i po kilku turach ulepszenie stoi. Drogi przyspieszają marsz, posterunki rozszerzają terytorium, forty mocno bronią granic. Budowanie na mapie działa od razu.
- **Plusy:** Najszybciej — render i bonusy gotowe, tylko wpięcie. Gra dostaje kluczową mechanikę budowania terytorium w Sprincie 1.
- **Minusy / koszt:** Wartości liczb mogą wymagać strojenia w playteście (np. posterunek za mocno/słabo rozszerza terytorium). To normalne, dorabiane równolegle.
- **Kiedy gotowe (szacunek):** ~1 sprint (~1 tydzień) na wpięcie akcji z mapy.

### Opcja B — Pokaż mi Excel z wartościami do przeglądu

- **Co zrobimy:** Dział EKONOMIA/DANE eksportuje Excel z listą ulepszeń i wszystkimi wartościami (koszt, czas budowy, bonusy). Ty przeglądasz, poprawiasz liczby, akceptujesz, dopiero wtedy wpięcie.
- **Co zobaczysz jako gracz:** Najpierw nic się nie zmienia (czekasz na Excel), potem budowanie działa z Twoimi liczbami.
- **Plusy:** Pełna kontrola nad balansem — sam decydujesz ile droga kosztuje i daje.
- **Minusy / koszt:** Dodatkowy krok (eksport Excel → przegląd → poprawki → wpięcie). Opóźnia budowanie na mapie o sprint. Większość liczb i tak będzie się stroić w playteście.
- **Kiedy gotowe (szacunek):** +1 sprint opóźnienia (eksport + Twój przegląd + poprawki) zanim budowanie ruszy.

### Opcja C — Skrócona lista na v1.0 (4 najważniejsze)

- **Co zrobimy:** Tylko 4 ulepszenia w v1.0: posterunek, fort, droga, irygacja. Reszta (jeśli jakieś są) odłożona po v1.0.
- **Co zobaczysz jako gracz:** Budujesz tylko te 4 typy. Mniej opcji, ale najważniejsze działają.
- **Plusy:** Mniejszy scope = szybciej.
- **Minusy / koszt:** Jeśli obecna lista ma więcej niż 4, tracisz niektóre ulepszenia na v1.0. Tymczasem render wszystkich już gotowy — nie oszczędzamy na renderze.
- **Kiedy gotowe (szacunek):** ~1 sprint (podobnie jak A, bo render gotowy dla wszystkich).

### Rekomendacja MASTER

**A.** Render jest gotowy dla wszystkich ulepszeń, bonusy określone — wpięcie to szybka sprawa. Skrócenie (C) nic nie oszczędza, bo najdroższa część (render) już zrobiona. Przegląd Excela (B) dodaje krok, który i tak zrobimy w playteście. Powiedz „akceptuję" i budowanie na mapie rusza w Sprincie 1.

### Po Twojej decyzji

MASTER wpija akcję „buduj ulepszenie z mapy" (BLK-04) w Sprincie 1, dział DANE trzyma wartości w JSON, strojenie liczb idzie równolegle z playtestem.

---

## D5 — Detale interfejsu bitwy ręcznej (P0)

### O co chodzi (bez żargonu)

Już zdecydowałeś wcześniej, że bitwa ma być **ręczna** (gracz steruje jednostkami na polu bitwy, a nie tylko auto-rozstrzyganie) i ma mieć przełącznik AUTO (żeby można było pominąć i komputer policzył wynik) oraz fazę rozstawiania (deployment). To był „Q1". Zostało 6 mniejszych pytań o **wygląd i obsługę** bitwy: Q2 minimapa w bitwie, Q3 tooltipy (podpowiedzi nad jednostkami), Q4 górny pasek w bitwie, Q5 ekran przed-bitwą (podgląd sił), Q6 styl graficzny (antyczny/jasny vs ciemny), Q7 sterowanie (mysz vs klawisze). Pytanie D5: kto ma proponować odpowiedzi na te Q2–Q7 — Ty każde po kolei, czy dział UI proponuje domyślne (wzorując się na grze Total War: Pharaoh), czy tylko minimum na v1.0.

### Dlaczego pytam teraz

Bitwa ręczna to największy „epik" v1.0. Bez rozstrzygnięcia jak wyglądają detale UX, dział UNITS/UI nie może dokończyć bitwy grywalnej. Opcja B to najszybsza ścieżka — Ty tylko zatwierdzasz gotowe propozycje.

### Opcja A — Ja odpowiadam każde Q2–Q7 po kolei

- **Co zrobimy:** MASTER pyta Cię o każde Q osobno (Q2, Q3, ... Q7). Ty każde rozstrzygasz, dopiero potem dział UI projektuje bitwę wg Twoich odpowiedzi.
- **Co zobaczysz jako gracz:** Bitwa dokładnie taka jak opiszesz — pełna kontrola nad każdym detalem.
- **Plusy:** Maksymalna kontrola — bitwa dokładnie po Twojemu.
- **Minusy / koszt:** 6 pytań do rozstrzygnięcia = 6 tur decyzji, zanim bitwa ruszy. Dział UI czeka. Opóźnia największy epik v1.0. Ryzyko: nie mając referencji, łatwo o decyzje, które w grze nie działają ergonomicznie.
- **Kiedy gotowe (szacunek):** +1–2 sprinty opóźnienia (6 decyzji + projekt + implementacja).

### Opcja B — UI proponuje domyślne (wzór Total War: Pharaoh), ja zatwierdzam

- **Co zrobimy:** Dział UI przygotowuje propozycje odpowiedzi na Q2–Q7, wzorując się na sprawdzonej grze Total War: Pharaoh (czyli praktyki komercyjne, ergonomia przemyślana). MASTER pokazuje Ci propozycje w jednej turze → Ty zatwierdzasz lub odrzucasz pojedyncze → implementacja.
- **Co zobaczysz jako gracz:** Bitwa wygląda i obsługuje się znajomo (jak Total War: Pharaoh): minimapa w rogu, tooltipy nad jednostkami, górny pasek z siłami, ekran przed-bitwy, klimatyczny styl, sterowanie myszą. Sprawdzone rozwiązania = gra ergonomiczna od pierwszej gry.
- **Plusy:** Najszybsza ścieżka do grywalnej bitwy. Ty tylko zatwierdzasz (1 tura decyzji). Rozwiązania komercyjne, sprawdzone — mniejsze ryzyko, że bitwa będzie niewygodna.
- **Minusy / koszt:** Mniej Twojej autorskiej kontroli nad detalem (ale możesz odrzucić każde Q).
- **Kiedy gotowe (szacunek):** ~1 sprint na propozycje UI + Twoja akceptacja + implementacja (najszybciej z opcji).

### Opcja C — Tylko minimum na v1.0, reszta Q2–Q7 po v1.0

- **Co zrobimy:** W v1.0 bitwa ręczna ma tylko Q1 (sterowanie + przełącznik AUTO + deployment). Bez minimapy w bitwie, bez tooltipów, bez górnej belki, bez ekranu przed-bitwy, surowy styl, podstawowe sterowanie. Reszta detali po v1.0.
- **Co zobaczysz jako gracz:** Bitwa działa, ale jest surowa — brakuje podpowiedzi, minimapy w bitwie, podglądu sił przed starciem. Trudniej się orientować.
- **Plusy:** Najszybsza implementacja — minimum scope.
- **Minusy / koszt:** Bitwa mniej grywalna/ergonomiczna w v1.0. Duże ryzyko, że bitwa będzie „nieprzyjemna" w grze, bo brak podstawowych podpowiedzi.
- **Kiedy gotowe (szacunek):** ~0.5 sprintu (mniej pracy, ale słabszy efekt).

### Rekomendacja MASTER

**B.** Jako gracz chcesz bitwy, która obsługuje się naturalnie — a Total War: Pharaoh to sprawdzony wzorzec ergonomii. Dział UI ma referencje, więc Ty tylko zatwierdzasz (jedna tura decyzji zamiast sześciu). To najszybsza i najmniej ryzykowna droga do bitwy, w którą fajnie się gra. Opcja A Cię zamuli 6 pytaniami, opcja C wyda surową bitwę.

### Po Twojej decyzji

Jeśli B: dział UI przygotowuje propozycje Q2–Q7 (wzór Total War: Pharaoh), MASTER pokazuje Ci w jednej turze, po akceptacji dział UNITS/UI implementuje bitwę manualną (BLK-05), MASTER scala do kanonu w Fazie C.

---

## D6 — Wchodzenie jednostek na statki (zaokrętowanie) (P1)

### O co chodzi (bez żargonu)

Po wynalezieniu technologii Żeglarstwo Twoje jednostki lądowe mogą **wchodzić na statki**, żeby przepłynąć morze. Dziś w grze jest robocze rozwiązanie (działa, ale prosto). Pytanie: zostawić robocze i dopieć po v1.0, zdecydować teraz dokładnie jak ma działać, czy usunąć z v1.0 (statki tylko jako transport, bez wchodzenia jednostek)?

### Dlaczego pytam teraz

Nie blokuje v1.0 (ruch lądowy działa bez tego). Ale jeśli chcesz pełnego modelu morskiego, trzeba zdecydować, żeby nie odwlekać.

### Opcja A — Zostaw robocze rozwiązanie, dopieć po v1.0

- **Co zrobimy:** Dziś zaokrętowanie działa roboczo (po Żeglarstwie). Zostawiamy jak jest na v1.0. Pełny model (ładunek, wyładunek, walka morska) — po v1.0.
- **Co zobaczysz jako gracz:** Możesz przewieźć jednostki przez morze po Żeglarstwie — działa, choć prosto. Bez finezji.
- **Plusy:** Nie blokuje v1.0, zero dodatkowej pracy teraz.
- **Minusy / koszt:** Model morski płytki w v1.0.
- **Kiedy gotowe (szacunek):** Już działa (roboczo); pełny po v1.0.

### Opcja B — Zdecydować teraz i wpiąć z ruchem

- **Co zrobimy:** Rozstrzygasz pełny model zaokrętowania teraz i wpijamy razem z traversal ruchu w Sprincie 2.
- **Co zobaczysz jako gracz:** Pełny model morski w v1.0 (ładunek, wyładunek, zasady).
- **Plusy:** Spójny model morski od razu.
- **Minusy / koszt:** Dodatkowa decyzja + praca, opóźnia v1.0.
- **Kiedy gotowe (szacunek):** +1 sprint do Sprinta 2.

### Opcja C — Usuń z v1.0 (statki tylko transport)

- **Co zrobimy:** W v1.0 jednostki wodne to tylko transport — bez zaokrętowania jednostek lądowych.
- **Co zobaczysz jako gracz:** Nie możesz przeprawić armii przez morze (albo bardzo ograniczenie).
- **Plusy:** Najmniejszy scope.
- **Minusy / koszt:** Gra traci element morski.
- **Kiedy gotowe (szacunek):** Szybko (mniej pracy).

### Rekomendacja MASTER

**A.** Ruch lądowy działa bez tego, a robocze rozwiązanie wystarcza, żeby gra była grywalna morsko. Pełny model lepiej dorobić po v1.0, żeby nie obciążać harmonogramu.

### Po Twojej decyzji

Jeśli A: zaokrętowanie zostaje robocze, dział MAPA wpija traversal ruchu (decyzje 1C/2/3) w Sprincie 2 bez zaokrętowania; pełny model po v1.0.

---

## D7 — Zaawansowany panel armii w stylu Total War (P2)

### O co chodzi (bez żargonu)

Dziś w grze masz proste okienko „połącz armie / nie łącz", gdy wejdziesz jednostką na pole, gdzie już stoi inna Twoja jednostka. Pytanie: czy robimy **pełny panel armii** jak w Total War — gdzie przeciągasz karty jednostek między armiami, scalsz rannych, dzielisz armię — czy wystarczy proste okienko na v1.0, czy tylko scalsz rannych?

### Dlaczego pytam teraz

Pełny panel to epik (mockup + implementacja). Nie blokuje grywalności — proste okno wystarcza. Decyzja: inwestować teraz, czy odłożyć po v1.0.

### Opcja A — Mockup, akceptuję, implementuj

- **Co zrobimy:** Dział UI robi makieta panelu → Ty akceptujesz → implementacja po kontrakcie merge.
- **Co zobaczysz jako gracz:** Pełny panel armii — przeciągasz karty jednostek, scalsz rannych, dzielisz.
- **Plusy:** Bogate zarządzanie armią.
- **Minusy / koszt:** Epik — mockup + implementacja, obciąża harmonogram.
- **Kiedy gotowe (szacunek):** ~2 sprinty (mockup + impl).

### Opcja B — Pomiń na v1.0, pełny panel po v1.0

- **Co zrobimy:** Na v1.0 zostaje proste okno „połącz/nie połącz" (już działa). Pełny panel po v1.0.
- **Co zobaczysz jako gracz:** Proste łączenie armii — wystarcza do gry.
- **Plusy:** Szybciej do v1.0, panel = epik na później.
- **Minusy / koszt:** Mniej wygodne zarządzanie armią w v1.0.
- **Kiedy gotowe (szacunek):** Już działa; pełny po v1.0.

### Opcja C — Tylko scalsz rannych na v1.0

- **Co zrobimy:** W v1.0 dodajemy tylko scalsz rannych jednostek (jedna funkcja), reszta panelu po v1.0.
- **Co zobaczysz jako gracz:** Możesz scalić rannych w jedną pełniejszą jednostkę.
- **Plusy:** Przydatna funkcja, mały scope.
- **Minusy / koszt:** Wymaga kontraktu merge od UNITS.
- **Kiedy gotowe (szacunek):** ~0.5 sprintu.

### Rekomendacja MASTER

**B.** Proste okno połącz-armie wystarcza na v1.0 — gra grywalna bez pełnego panelu. Pełny panel to epik, lepiej dorobić po v1.0, żeby nie ciągnąć harmonogramu.

### Po Twojej decyzji

Jeśli B: panel armii odłożony po v1.0; w Fazie C ewentualnie scalsz rannych jeśli zechcesz (C).

---

## D8 — Czy sąsiednie armie dołączają do bitwy (P1)

### O co chodzi (bez żargonu)

Gdy dochodzi do bitwy, pytanie: czy **sąsiednie armie** (stojące do 1 heksa od miejsca starcia) dołączają do bitwy jako posiłki, czy tylko te jednostki, które stoją dokładnie na tym samym polu? Już wcześniej rozstrzygnąłeś (B) że posiłki = 1 heks sąsiedztwa. To jest potwierdzenie — kontrakt techniczny jest już gotowy na tę wersję.

### Dlaczego pytam teraz

Kontrakt UNITS dla posiłków 1-heks jest gotowy od 2026-06-26. Potwierdzenie A odblokowuje wpięcie multi-unit/posiłków w Sprincie 2 (bitwy zbiorowe).

### Opcja A — Potwierdzam B (1 heks sąsiedztwa)

- **Co zrobimy:** Bitwa: strona atakującego = pole atakującego + Twoje armie do 1 heksa obok; obrona analogicznie. Kontrakt UNITS gotowy, SILNIK wpija zbieranie składu.
- **Co zobaczysz jako gracz:** Bitwy zbiorowe — kilka armii z sąsiedztwa walczy razem. Większe, epickie starcia.
- **Plusy:** Już rozstrzygnięte, kontrakt gotowy — najszybsze.
- **Minusy / koszt:** Większe bitwy = więcej jednostek na polu (render, wydajność — ale UNITS ma mechanikę).
- **Kiedy gotowe (szacunek):** ~1 sprint (wpięcie w Sprincie 2).

### Opcja B — Tylko ten sam heks (0 sąsiedztwa)

- **Co zrobimy:** Bitwa = tylko jednostki z dokładnie tego samego pola. Brak posiłków sąsiednich.
- **Co zobaczysz jako gracz:** Mniejsze, 1v1 bitwy.
- **Plusy:** Prostsze.
- **Minusy / koszt:** Trzeba przepisać gotowy kontrakt; mniejsze bitwy = mniej epickie.
- **Kiedy gotowe (szacunek):** +0.5 sprintu na zmianę kontraktu.

### Opcja C — 2 heksy sąsiedztwa

- **Co zrobimy:** Posiłki z do 2 heksów — jeszcze większe bitwy.
- **Co zobaczysz jako gracz:** Bardzo duże bitwy zbiorowe.
- **Plusy:** Maksymalnie epickie.
- **Minusy / koszt:** Większy scope, ryzyko wydajnościowe, przepisanie kontraktu.
- **Kiedy gotowe (szacunek):** +1 sprint.

### Rekomendacja MASTER

**A.** Już rozstrzygnąłeś to wcześniej, kontrakt gotowy — potwierdź i bitwy zbiorowe ruszają w Sprincie 2 bez dodatkowej pracy. 1 heks to rozsądny balans: epickie bitwy bez przesady.

### Po Twojej decyzji

Jeśli A: MASTER wpija zbieranie składu bitwy zbiorowej (multi-unit, RDY-02) w Sprincie 2, kontrakt UNITS gotowy.

---

## D9 — Subagenci i koszty modeli (P2)

### O co chodzi (bez żargonu)

Stare pytanie (z czasów innego narzędzia) o to, czy używamy „subagentów na Sonnet" i jaki to ma koszt. W obecnym środowisku (Cursor) mapujemy to na modele: GLM 5.2 (MASTER), Composer 2.5 (lane), Opus 4.8 (review) — wg Twojego playbooka. Pytanie straciło sens, ale formalnie trzeba je zamknąć.

### Dlaczego pytam teraz

Żeby zamknąć stary wątek i potwierdzić model kosztowy.

### Opcja A — Zbierz odpowiedzi działów, decyduję budżet

- **Co zrobimy:** Pytamy działy o zużycie, Ty decydujesz budżet.
- **Plusy:** Pełna kontrola budżetu.
- **Minusy:** Pytanie bez przedmiotu w Cursor.
- **Kiedy gotowe:** n/a.

### Opcja B — W Cursor: GLM/Composer/Opus wg playbooka

- **Co zrobimy:** Trzymamy się playbooka: GLM/Composer/Opus. Pytanie bez przedmiotu — zamykamy.
- **Plusy:** Status quo, spójne z playbookiem.
- **Minusy:** Brak.
- **Kiedy gotowe:** Już.

### Opcja C — Odpuść po v1.0

- **Co zrobimy:** Decyzja budżetowa po v1.0.
- **Plusy:** Brak teraz.
- **Minusy:** Wątek otwarty.

### Rekomendacja MASTER

**B.** W Cursor mapujemy na GLM/Composer/Opus wg playbooka — pytanie straciło przedmiot. Zamykamy.

### Po Twojej decyzji

Status quo — brak zmian, wątek zamknięty.

---

## D10 — W której epoce jest Katapulta (P1) — KONFLIKT

### O co chodzi (bez żargonu)

Machiny oblężnicze: Taran (taran) = epoka Kamień, Wieża oblężnicza = epoka Brąz (ustalone). Ale **Katapulta** — dział UNITS i Ty mówicie „Żelazo", a dziennik MASTERa mówi „Średniowiecze". Konflikt do rozstrzygnięcia: w której epoce gracz dostaje Katapultę? To decyduje, czy Katapulta jest w v1.0 (Żelazo jest w grze), czy dopiero po v1.0 (Średniowiecze = po v1.0).

### Dlaczego pytam teraz

Konflikt w danych — `units.json` musi mieć jednoznaczną epokę. Rozstrzygnięcie decyduje, czy Katapulta wchodzi do v1.0.

### Opcja A — Katapulta = Żelazo

- **Co zrobimy:** Katapulta w epoce Żelazo (spójne: Taran=Kamień, Wieża=Brąz, Katapulta=Żelazo — epoki rosną). W v1.0.
- **Co zobaczysz jako gracz:** Po wynalezieniu Żelaza budujesz Katapulty do oblężenia. Pełny zestaw machin w v1.0.
- **Plusy:** Spójne z resztą machin; Katapulta w v1.0.
- **Minusy:** Nadpisuje wpis dziennika.
- **Kiedy gotowe:** Szybko (zmiana epoki w danych).

### Opcja B — Katapulta = Średniowiecze (po v1.0)

- **Co zrobimy:** Katapulta w Średniowieczu → po v1.0 (razem z Lazaretem).
- **Co zobaczysz jako gracz:** W v1.0 tylko Taran + Wieża; Katapulta dopiero po v1.0.
- **Plusy:** Mniej machin w v1.0 = mniejszy scope.
- **Minusy:** Nadpisuje Twoją i UNITS wersję; v1.0 bez Katapulty.
- **Kiedy gotowe:** Szybko, ale efekt po v1.0.

### Opcja C — Dwie katapulty: lekka=Żelazo, ciężka=Średniowiecze

- **Co zrobimy:** Dwa warianty: Katapulta lekka (Żelazo, v1.0) + Katapulta ciężka (Średniowiecze, po v1.0).
- **Co zobaczysz jako gracz:** Słabsza Katapulta w Żelazie, mocniejsza w Średniowieczu.
- **Plusy:** Kompromis.
- **Minusy:** Więcej pracy (dwa modele, dwa balanced).
- **Kiedy gotowe:** +0.5–1 sprintu.

### Rekomendacja MASTER

**A.** Trzymaj Żelazo — spójne z Taran=Kamień/Wieża=Brąz, epoki rosną logicznie, a Ty i dział UNITS już to trzymacie. Katapulta w v1.0 = pełny zestaw machin oblężniczych.

### Po Twojej decyzji

Jeśli A: dział DANE ustala `units.json` Katapulta epoka=Żelazo; dziennik korygowany; pełne machiny w Fazie C.

### NOTA (2026-06-27) — D10 zamknięte

Decyzja Macieja **D10=A** (Katapulta=Żelazo) obowiązuje od 2026-06-26 — wpis w `MACIEJ-KARTA-DECYZJI.md`. Konflikt z dziennikiem MASTER (Średniowiecze) **unieważniony**.

---

## D11 — Układ drzewka technologii (P1)

### O co chodzi (bez żargonu)

**Drzewko technologii** to ekran, gdzie wybierasz co badać (narzędzia, rolnictwo, pismo, etc.). Dział UI zrobił **makieta** z układem, w którym linie zależności nie przecinają się (czytelne). Pytanie: akceptujesz ten układ przed przeniesieniem do gry, czy chcesz poprawki, czy zostawiamy obecny (z przecięciami)?

### Dlaczego pytam teraz

Przed przeniesieniem makiety do gry (`sciencePicker.ts`) — Twoja akceptacja układu.

### Opcja A — Akceptuję układ, portuj do gry

- **Co zrobimy:** Dział UI przenosi czytelne drzewko (bez przecięć) do gry.
- **Co zobaczysz jako gracz:** Ładne, czytelne drzewko tech — widać co prowadzi do czego.
- **Plusy:** Makieta gotowa, układ strefowy (0 przecięć).
- **Minusy:** Brak.
- **Kiedy gotowe:** ~1 sprint (port).

### Opcja B — Chcę poprawki

- **Co zrobimy:** UI dopracowuje układ wg Twoich uwag, potem akceptacja.
- **Plusy:** Twoja kontrola.
- **Minusy:** +czas na poprawki.
- **Kiedy gotowe:** +0.5–1 sprint.

### Opcja C — Zostaw obecny picker na v1.0

- **Co zrobimy:** Obecny picker (z przecięciami) zostaje na v1.0.
- **Plusy:** Brak pracy teraz.
- **Minusy:** Mniej czytelne drzewko w v1.0.
- **Kiedy gotowe:** Już.

### Rekomendacja MASTER

**A.** Makieta gotowa, układ czytelny (0 przecięć) — akceptuj i gra dostaje ładne drzewko. Zobacz plik `Makieta-drzewko-uklad-bez-przeciec.html`.

### Po Twojej decyzji

Jeśli A: dział UI portuje drzewko do `sciencePicker.ts` (Faza E), MASTER wpija.

---

## D12 — Modele miast z Brązu dla 4 nacji — podgląd (P1)

### O co chodzi (bez żargonu)

Dział MAPA ma **modele miast z epoki Brązu** (trójwymiarowe wygląd miast) dla 4 nacji (Sumer/Egipt/Inkowie/Zulusi). Pytanie: chcesz zobaczyć podgląd przed wpięciem, czy tylko nazwy miast na mapie (bez modeli), czy modele dla wszystkich 9 nacji (większy epik)? Nazwy miast na mapie już zdecydowałeś (TAK).

### Dlaczego pytam teraz

Przed wpięciem modeli do gry — Twoja akceptacja wyglądu.

### Opcja A — Pokaż podgląd 4 nacji, akceptuję, wpinaj

- **Co zrobimy:** MAPA pokazuje Ci podgląd modeli 4 nacji → akceptujesz → wpięcie.
- **Co zobaczysz jako gracz:** Miasta 4 nacji wyglądają różnie (sątimeskie vs egipskie vs inkaskie vs zuluskie) — wizualna różnorodność.
- **Plusy:** MAPA ma gotowe; różnorodność wizualna.
- **Minusy:** Tylko 4 nacje (reszta ma modele kamienia).
- **Kiedy gotowe:** ~0.5 sprintu (podgląd + wpięcie).

### Opcja B — Tylko nazwy miast na mapie (bez modeli Brązu)

- **Co zrobimy:** Na v1.0 tylko nazwy miast (już zdecydowane), bez modeli Brązu.
- **Co zobaczysz jako gracz:** Miasta różnią się nazwą, ale wyglądają podobnie (modele kamienia).
- **Plusy:** Mniej pracy.
- **Minusy:** Mniejsza różnorodność wizualna.
- **Kiedy gotowe:** Już (nazwy).

### Opcja C — Wszystkie 9 nacji modele Brązu

- **Co zrobimy:** Modele Brązu dla wszystkich 9 nacji — większy epik.
- **Co zobaczysz jako gracz:** Każda nacja ma własny wygląd miast.
- **Plusy:** Maksymalna różnorodność.
- **Minusy:** Duży epik — MAPA musi zrobić 5 kolejnych modeli.
- **Kiedy gotowe:** +2–3 sprinty.

### Rekomendacja MASTER

**A.** MAPA ma gotowe modele dla 4 nacji — obejrzyj podgląd, akceptuj, i gra dostaje wizualną różnorodność bez dużego epiku. 9 nacji (C) to dużo pracy na później.

### Po Twojej decyzji

Jeśli A: MAPA pokazuje podgląd, po akceptacji MASTER wpija modele 4 nacji (Faza E), nazwy miast już działają.

---

## D13 — Domyślne ustawienia nowej gry (P1)

### O co chodzi (bez żargonu)

W menu „Nowa gra" wybierasz: cywilizację, trudność, tempo, epokę startu. Pytanie: **jeśli gracz nic nie wybierze** (klika START od razu) — jakie domyślne ustawienia ma gra? Np. cywilizacja=Rzym, trudność=Normal, tempo=Normal, epoka=Kamień. Czy MASTER proponuje rozsądne defaulty (Ty zatwierdzasz), czy brak defaultów (gracz musi wybrać wszystko), czy tylko epoka=Kamień z defaultem?

### Dlaczego pytam teraz

UX nowej gry — czy gracz może szybko kliknąć START, czy musi przejść przez wszystkie pola. Decyzja cross-lane (dotyka UI/CYWILIZACJE/EKONOMIA).

### Opcja A — MASTER proponuje defaulty, ja zatwierdzam

- **Co zrobimy:** MASTER ustala domyślne: cyw=Rzym, trudność=Normal, tempo=Normal, epoka=Kamień. Ty zatwierdzasz (możesz zmienić).
- **Co zobaczysz jako gracz:** Klikasz START → gra startuje z rozsądnymi ustawieniami. Możesz wszystko zmienić, ale nie musisz.
- **Plusy:** Szybki start, wygodne UX.
- **Minusy:** Gracz nieświadomy gra „domyślnym" Rzymem.
- **Kiedy gotowe:** Ułamka sprintu.

### Opcja B — Brak defaultów, gracz musi wybrać wszystko

- **Co zrobimy:** Każde pole musi być wybrane; START zablokowany do wyboru.
- **Co zobaczysz jako gracz:** Musisz przejść wszystkie pola przed START.
- **Plusy:** Świadomy wybór.
- **Minusy:** Mniej wygodne, szczególnie dla nowicjusza.
- **Kiedy gotowe:** +0.5 sprintu (walidacja).

### Opcja C — Tylko epoka=Kamień z defaultem

- **Co zrobimy:** Tylko epoka startu ma default (Kamień); reszta bez defaultu.
- **Plusy:** Kompromis.
- **Minusy:** Mniej wygodne niż A.
- **Kiedy gotowe:** Ułamka sprintu.

### Rekomendacja MASTER

**A.** MASTER proponuje rozsądne defaulty, Ty zatwierdzasz — gracz może szybko START (wygodne), a Ty masz kontrolę. Najlepszy UX nowej gry.

### Po Twojej decyzji

Jeśli A: MASTER ustala defaulty, dział UI wstawia je w menu, CYWILIZACJE/EKONOMIA dostarczają dane per ustawienie.

---

## D14 — Surowce żelazo i stal na mapie (P2)

### O co chodzi (bez żargonu)

Po decyzji Żelazo GO (1A) w grze wchodzi epoka Żelaza — więc potrzebne są **surowce żelazo/stal** na mapie (złoża rudy + łańcuch ruda→stal). Pytanie: kto definiuje surowce (DANE/MAPA), czy tylko żelazo bez stali na v1.0, czy odłożyć po v1.0?

### Dlaczego pytam teraz

Epoka Żelaza już weszła — ekonomia żelaza/stali potrzebuje surowców w danych. Nie blokuje grywalności, ale potrzebne do pełnej epoki Żelaza.

### Opcja A — DANE/MAPA definiują żelazo+stal, EKONOMIA flaguje dostęp

- **Co zrobimy:** DANE/MAPA dodają złoża rudy żelaza + łańcuch ruda→stal (budynki przetwórcze). EKONOMIA tylko flaguje, czy miasto ma dostęp.
- **Co zobaczysz jako gracz:** Widzisz złoża żelaza na mapie; miasta z dostępem mogą budować jednostki/budynki Żelaza.
- **Plusy:** Pełna epoka Żelaza z surowcami.
- **Minusy:** Praca DANE/MAPA.
- **Kiedy gotowe:** ~1 sprint (Faza D).

### Opcja B — Tylko żelazo (bez stali) na v1.0

- **Co zrobimy:** Tylko surowiec żelazo (bez łańcucha stal).
- **Co zobaczysz jako gracz:** Żelazo działa, stal dopiero po v1.0.
- **Plusy:** Mniejszy scope.
- **Minusy:** Płytszy łańcuch produkcji.
- **Kiedy gotowe:** ~0.5 sprintu.

### Opcja C — Odłóż po v1.0

- **Co zrobimy:** Surowce żelaza/stali po v1.0.
- **Co zobaczysz jako gracz:** Epoka Żelaza bez surowców (dostęp uproszczony).
- **Plusy:** Brak pracy teraz.
- **Minusy:** Mniej spójna epoka Żelaza.
- **Kiedy gotowe:** Po v1.0.

### Rekomendacja MASTER

**A.** Epoka Żelaza wymaga surowców, żeby miała sens — DANE/MAPA dostarczą złoża i łańcuch, EKONOMIA flaguje dostęp. Pełna spójność.

### Po Twojej decyzji

Jeśli A: DANE/MAPA definiują żelazo/stal w danych (Faza D), EKONOMIA flaguje dostęp, MASTER wpija.

---

## D15 — Jak działa minimapa w pasku (P1)

### O co chodzi (bez żargonu)

**Minimapa** to mała mapa w rogu ekranu (jak w D1). Są dwa techniczne warianty, jak ją narysować: (A) dział MAPA renderuje obrazek („zdjęcie" mapy) i UI go wyświetla, albo (B) dział UI rysuje siatkę heksów sam z danych od MAPY (lżejsze). Albo (C) bez minimapy na v1.0. To decyzja techniczna o wydajności, ale efekt dla gracza podobny.

### Dlaczego pytam teraz

Wariant wpływa na wydajność i prostotę. Opcja B lżejsza (UI zakładało, że rysuje sam).

### Opcja A — MAPA renderuje obrazek minimapy

- **Co zrobimy:** MAPA renderuje osobny obrazek mapy do slotu UI.
- **Co zobaczysz jako gracz:** Minimapa wygląda jak mała wersja mapy 3D.
- **Plusy:** Wizualnie spójna z mapą.
- **Minusy:** Cięższe — duplikacja sceny (zajmuje pamięć), ryzyko wydajności.
- **Kiedy gotowe:** +1 sprint.

### Opcja B — UI rysuje siatkę z danych MAPY

- **Co zrobimy:** MAPA daje dane (jakie pola, kolory terytoriów), UI rysuje siatkę heksów sam.
- **Co zobaczysz jako gracz:** Minimapa to czytelna siatka heksów z kolorami terytoriów — prosta, ale funkcjonalna.
- **Plusy:** Lżejsze, szybsze, mniej pamięci.
- **Minusy:** Mniej „klimatyczna" niż obrazek 3D.
- **Kiedy gotowe:** ~0.5 sprintu.

### Opcja C — Bez minimapy na v1.0

- **Co zrobimy:** Brak minimapy w v1.0 (tylko pełna mapa).
- **Plusy:** Brak pracy.
- **Minusy:** Gra bez minimapy = męczące na dużej mapie.
- **Kiedy gotowe:** Już (brak).

### Rekomendacja MASTER

**B.** Lżejsze i szybsze — UI rysuje siatkę z danych MAPY. Minimapa funkcjonalna bez obciążania wydajności. Wariant A duplikuje scenę (za ciężkie).

### Po Twojej decyzji

Jeśli B: dział MAPA dostarcza `getMinimapData`, dział UI rysuje siatkę heksów (razem z D1 w Fazie E).

---

## Podsumowanie — szybka tabela (skopiuj, wpisz, wklej w czacie)

Skrócona wersja (z miejscem na literę): `docs/MACIEJ-KARTA-DECYZJI.md` sekcja „Podsumowanie".

| ID | Pytanie (skrót) | Priorytet | Rekom. MASTER | Twoja |
|---|---|---|---|---|
| D1 | Pasek na ekranie (HUD) + minimapa | P0 | C | ___ |
| D2 | Wpinamy paczkę ekonomii miasta | P0 | A | ___ |
| D3 | Ile Wealth (bogactwa) w v1.0 | P0 | C | ___ |
| D4 | Budowanie na mapie (drogi/posterunki/forty) | P0 | A | ___ |
| D5 | Detale interfejsu bitwy | P0 | B | ___ |
| D6 | Wchodzenie jednostek na statki | P1 | A | ___ |
| D7 | Pełny panel armii (Total War) | P2 | B | ___ |
| D8 | Sąsiednie armie w bitwie | P1 | A | ___ |
| D9 | Subagenci/koszty modeli | P2 | B | ___ |
| D10 | Katapulta — która epoka | P1 | A | ___ |
| D11 | Układ drzewka technologii | P1 | A | ___ |
| D12 | Modele miast Brązu 4 nacji | P1 | A | ___ |
| D13 | Domyślne ustawienia nowej gry | P1 | A | ___ |
| D14 | Surowce żelazo/stal na mapie | P2 | A | ___ |
| D15 | Jak działa minimapa | P1 | B | ___ |

**Przykładowa wiadomość do czatu:**
```
Jestem Maciej. Rozstrzygam decyzje:
D1=C, D2=A, D3=C, D4=A, D5=B,
D6=A, D7=B, D8=A, D9=B, D10=A,
D11=A, D12=A, D13=A, D14=A, D15=B.
Zapisz w docs/MACIEJ-KARTA-DECYZJI.md z datą 2026-06-26
i otwórz nowy chat jako MASTER, zaplanuj Sprint 1.
```

---

*Powiązane: `docs/MACIEJ-KARTA-DECYZJI.md` (skrócona tabela), `docs/CURSOR-MASTER-PLAN-DOKONCZENIA.md` (główny plan, §8 pełny kontekst), `docs/CURSOR-BACKLOG.md` (ID zadań BLK-*/RDY-*), `docs/CURSOR-WORKFLOW-SCHEMAT.md` (jak MASTER realizuje po Twojej decyzji), `dyspozycje/DZIENNIK-MASTERA.md` (source of truth operacyjny).*
