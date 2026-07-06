# MACIEJ — Grupa B — pytania 1–11 (forma rozwinięta)

> **PACZKA 1–11: ZAMKNIĘTA 2026-06-27**  
> **Odpowiedź Macieja:** `1C 2A 3Spec 4C 5A 6A 7A 8A 9A 10A 11A`  
> **Agent: nie pytaj ponownie** — zapis w `B2-spoleczenstwo.md`, `B-OTWARTE-PYTANIA.md`.

> **To jest wzorzec jakości pytań do Ciebie.** Archiwum treści ABC.  
> Skrót numerów: `docs/grupa-b/MACIEJ-PYTANIA-ABC.md` · reguła agentów: `docs/grupa-b/REGULA-ABC.md`

**Zamknięte — nie pytaj:** B2-Q1…Q12, B3, Wealth D3=A, model żywności Q1, ulepszenia z mapy (A4=A), **paczka 1–11**, **B1-tech-Q3 posterunek (odłożone)**.

---

## 1 — Jak liczyć Szczęście w silniku? (P0)

**[EKRAN: Panel miasta]**

### O co chodzi (bez żargonu)

Gdy otwierasz **panel miasta**, w lewej kolumnie widzisz sekcję **Mieszkańcy** z emotikonami 😊 / 😐 / 😠 i liczbami w trzech koszykach. To ma pokazywać, jak zadowoleni są ludzie. Obok masz **Porządek** (spokój / niepokój / bunt) i **Zdrowie** z rozpiską „+2 studnia, −1 zagęszczenie” itd.

Problem: **Zdrowie** już tłumaczy skąd wzięła się liczba. **Szczęście** — nie. Silnik liczy jedną liczbę „netto” z kilku składników (dziś głównie 4), a w Excelu i Spec masz **dużo więcej** czynników (wojna, podatki, zagęszczenie, budynki, Wealth…). Od tej decyzji zależy, czy gracz **rozumie** nastrój miasta, czy tylko widzi wynik, i jak dokładnie działa bunt oraz kary produkcyjne, które już zamknąłeś (B2-Q6).

### Dlaczego pytam teraz

Bez tego nie wiemy, czy w v1.0 robimy **prostą liczbę**, **model ludzi jak w Civ**, czy **pełną rozpiskę** jak przy Zdrowiu. To blokuje kolejny krok: wpięcie pełnej listy czynników z Excela (pytanie **2**) i sensowny panel, który nie myli gracza.

### Opcja A — Punkt netto (jak dziś, bez rozpiski)

- **Co zrobimy:** Zostawiamy jedną liczbę netto w silniku. Koszyki 😊/😐/😠 to tylko **obrazek** wyliczony z tej liczby — bez listy „+2 świątynia, −3 wojna” w panelu.
- **Co zobaczysz jako gracz:** Mieszkańcy z emotikonami i trzema liczbami, Porządek zależny od netto. **Nie** zobaczysz, skąd wzięło się szczęście — musisz zgadywać albo czytać Excel poza grą.
- **Plusy:** Najszybsze v1.0. Najmniej nowego UI. Zgodne z tym, co już jest w kodzie — małe ryzyko regresji.
- **Minusy / koszt:** Słaba czytelność — gracz nie wie, co poprawić (podatki? wojna? budynek?). Rozjazd z Excel/Spec, gdzie masz pełną listę. Trudniej balansować w playteście.
- **Kiedy gotowe (szacunek):** Już w dużej mierze jest — ewentualnie kosmetyka koszyków (~ułamek sprintu).

### Opcja B — Model ludzi (Spec z 21.06)

- **Co zrobimy:** Silnik liczy **konkretnych** zadowolonych, kontentnych i niezadowolonych z czynników (wojna, budynki, podatki…). Gdy w mieście jest **≥3 niezadowolonych**, część ludzi **nie pracuje** (strajk — brak punktów Pracy z tych „głów”).
- **Co zobaczysz jako gracz:** Liczby w koszykach to **prawdziwe dane** z silnika, nie szacunek. Bunt ma bezpośredni sens: źle traktowani ludzie przestają produkować. Panel może pokazać „3 niezadowolonych → −3 Pracy”.
- **Plusy:** Najbliżej klasycznego Civ. Konsekwencje buntu są **oczywiste** dla gracza. Silnik i UI mówią tym samym językiem.
- **Minusy / koszt:** Dużo nowego kodu i testów. Inna logika niż dziś (netto → tiery). Balans trudniejszy — łatwo o miasto, które „staje” przez strajk. Dłuższa implementacja niż A lub C.
- **Kiedy gotowe (szacunek):** ~1–1,5 sprintu (EKONOMIA + UI + wpięcie silnika).

### Opcja C — Netto + rozpiska +/- w panelu (jak Zdrowie), opcjonalnie procent

- **Co zrobimy:** Silnik liczy netto z czynników (z Excel/Spec), ale w panelu dodajemy sekcję **Szczęście** z wierszami: „Świątynia +1”, „Wojna −3”, „Podatki −1”… Suma = netto. Opcjonalnie pokazujemy **procent**: np. „72%” = netto ÷ maksimum dla epoki miasta (Kamień 12, Brąz 18…), z limitem 120%. Szczegóły liczb: `docs/decyzje/B2-model-szczescie-procent.md`.
- **Co zobaczysz jako gracz:** Tak jak przy Zdrowiu — **widzisz dokładnie**, co podbija i obniża nastrój. Możesz świadomie budować świątynię albo obniżyć podatki. Koszyki 😊/😐/😠 nadal są, ale oparte na zrozumiałej rozpisce.
- **Plusy:** Najlepsza **czytelność** bez skoku na pełny model ludzi. Spójność z sekcją Zdrowie. Łatwy balans — widzisz w playteście, który czynnik przesadzony. Excel i gra się zgadzają.
- **Minusy / koszt:** Więcej UI niż A. Trzeba wpiąć czynniki z pytania **2** — im więcej czynników, tym dłużej. Procent to dodatkowa kolumna w Excel (SzMax per epoka).
- **Kiedy gotowe (szacunek):** ~1 sprint na rozpiskę + netto; + kilka dni jeśli procent i pełna lista czynników.

### Rekomendacja

**C.** Jako gracz chcesz wiedzieć **dlaczego** miasto jest niezadowolone — tak samo jak dziś wiesz, dlaczego jest chore. To nie wymaga od razu pełnego modelu ludzi (B), a daje znacznie więcej niż goła liczba (A).

### Po Twojej decyzji

Zapis do `B2-spoleczenstwo.md` → EKONOMIA implementuje `computeHappiness` → UI sekcja Szczęście → handoff do Silnika (haki w panelu) → testy regresji Porządku/buntu.

---

## 2 — Które czynniki Szczęścia wpiąć na v1.0? (P0)

**[EKRAN: Panel miasta]** · *Sensowne tylko jeśli w **1** wybrałeś A lub C.*

### O co chodzi (bez żargonu)

W **Excelu** (`Spoleczenstwo-parametry.xlsx`) i w Spec masz **już wpisane** bonusy i kary szczęścia: świątynia, amfiteatr, luksus/Wealth, wojna, wysokie podatki, tłok w mieście, obca kultura, obca religia itd. W **grze** dziś działają tylko **cztery** składniki (budynki, kultura, religia, Wealth). Pytanie: ile z pełnej listy ma **naprawdę wpływać** w pierwszej grywalnej wersji.

### Dlaczego pytam teraz

Jeśli w **1** wybierzesz rozpiskę (C), musimy wiedzieć **ile wierszy** pokazać. Jeśli pełna Spec (A) — to duży batch. Jeśli minimum (C) — szybciej, ale wojna i podatki nadal „nie bolą”.

### Opcja A — Pełna lista Spec

- **Co zrobimy:** Wszystkie czynniki z Excel/Spec wpływają na Szczęście: budynki, kultura %, religia, Wealth, zagęszczenie, wojna, podatki, małe miasto, dominacja kultury/religii, świątynia, amfiteatr itd.
- **Co zobaczysz jako gracz:** Długa, ale kompletna rozpiska w panelu (przy opcji 1C) albo pełne konsekwencje w modelu ludzi (przy 1B). Gra zachowuje się jak w dokumentacji projektowej.
- **Plusy:** Zgodność 1:1 z Excelem. Najgłębsza rozgrywka ekonomiczno-społeczna. Jedna decyzja — mniej „dodamy później”.
- **Minusy / koszt:** Najdłuższa implementacja. Więcej zależności od silnika (wojna, kultura obca, podatki z suwaków). Więcej testów balansu.
- **Kiedy gotowe (szacunek):** ~1,5–2 sprinty (zależnie od **1**).

### Opcja B — Minimum rozszerzone

- **Co zrobimy:** Zostawiamy dzisiejsze 4 składniki **plus** trzy najważniejsze braki: **wojna**, **podatki**, **zagęszczenie** (tłok w mieście).
- **Co zobaczysz jako gracz:** Rozpiska ~7 pozycji. Wojna i wysokie podatki **realnie** psują nastrój. Reszta Spec (obca kultura, amfiteatr osobno…) czeka na później.
- **Plusy:** Sensowny kompromis — gracz czuje wojenę i podatki bez pełnego scope. Umiarkowany czas pracy.
- **Minusy / koszt:** Połowa Spec nadal nieaktywna — trzeba pamiętać, co „dokleić” po v1.0. Playtest może pokazać brakujące czynniki (np. obca religia po podboju).
- **Kiedy gotowe (szacunek):** ~1 sprint.

### Opcja C — Minimum (4 składniki jak dziś)

- **Co zrobimy:** Nic nie rozszerzamy — budynki, kultura, religia, Wealth. Ewentualna rozpiska w panelu ma tylko 4 linie.
- **Co zobaczysz jako gracz:** Krótki panel. Wojna i podatki **nie** zmieniają szczęścia — nawet jeśli w Excelu są zapisane.
- **Plusy:** Najszybciej. Zero ryzyka opóźnienia v1.0 przez społeczeństwo.
- **Minusy / koszt:** Excel i gra się rozjeżdżają. Słaba immersja — gracz prowadzi wojnę, a miasto „nie reaguje”. Późniejsze dokładanie czynników = drugi batch.
- **Kiedy gotowe (szacunek):** Już jest / kosmetyka rozpiski (~dni).

### Rekomendacja

**B.** Daje wojnie i podatkom realny sens bez 2 sprintów pełnej Spec. Przy **1C** rozpiska będzie czytelna, nie przytłaczająca.

### Po Twojej decyzji

Aktualizacja `society-params.json` + kod liczenia → UI (wiersze rozpiski) → testy → Excel zsynchronizowany z tym, co faktycznie działa.

---

## 3 — Składnik „Prawo” w Porządku (P0) — **ZAMKNIĘTE 2026-06-27**

**Decyzja Macieja:** **Wdrożyć ustalony Spec** — Porządek = **SzPct + PrawPct** (wagi 0,5/0,5), oba liczone procentowo (max / netto / rozpiska +/-). Efekty od **PorPct**. Spec: `docs/decyzje/B2-porzadek-model.md`, progi: `B2-porzadek-progi-efektow.md`.

---

### Archiwum pytania ABC (nieaktualne — nie wybieraj A/B/C)

### O co chodzi (bez żargonu)

W panelu masz **Porządek** — trzy stany: spokój, niepokój, bunt (z karami, które już zaakceptowałeś). W Spec **Porządek** to mix dwóch rzeczy: **Szczęście** ludzi **oraz Prawo** — czyli czy w mieście jest siła, która trzyma ład (garnizon wojska, Ratusz). Dziś w grze **Prawo** prawie zawsze = 0, więc Porządek = prawie samo Szczęście.

### Dlaczego pytam teraz

Jeśli zostawimy Prawo = 0, wojsko stojące w mieście **nie pomoże** na bunt. Jeśli dodamy garnizon + Ratusz, gracz dostaje **narzędzie** na niepokoje — ale to kolejna mechanika do pokazania w panelu i zbalansowania.

### Opcja A — Prawo = 0 na v1.0

- **Co zrobimy:** Porządek liczy się **wyłącznie** ze Szczęścia. Garnizon i Ratusz nie dają bonusu „Prawo”.
- **Co zobaczysz jako gracz:** Porządek = czysta konsekwencja nastrojów. Jednostki w mieście nie zmieniają linii Porządek (poza ewentualnym wpływem na Szczęście, jeśli kiedyś dodamy).
- **Plusy:** Prosto. Mniej rzeczy w panelu. Szybciej domknąć bunt i kary (już zrobione).
- **Minusy / koszt:** Wojsko w mieście nie „uspokaja tłumu” — odchylenie od Spec. Gracz może czuć, że garnizon jest tylko do obrony, nie do stabilności.
- **Kiedy gotowe (szacunek):** Już tak jest — zero dodatkowej pracy.

### Opcja B — Prawo z garnizonu + Ratusz

- **Co zrobimy:** Każda jednostka w mieście (lub w promieniu?) daje punkty Prawa; budynek **Ratusz** daje stały bonus. Porządek = funkcja Szczęścia **i** Prawa (np. połowa na pół, jak w Spec).
- **Co zobaczysz jako gracz:** W sekcji Porządek widać np. „Szczęście 4, Prawo 2 → Porządek: spokój”. Stacjonowanie wojska **ma sens** poza walką.
- **Plusy:** Zgodność ze Spec. Nowa decyzja taktyczna: zostawić oddział na spokój vs wysłać na front. Głębsza gra.
- **Minusy / koszt:** Trzeba ustalić ile daje jedna jednostka (balans). UI musi to pokazać. Więcej testów (czy mega-armia w mieście = nieskońony spokój?).
- **Kiedy gotowe (szacunek):** ~0,5–1 sprint (EKONOMIA + UI + balans w Excel).

### Opcja C — Prawo odłożone (formalnie tylko Szczęście)

- **Co zrobimy:** Jak A w kodzie, ale w dokumentacji i ekranie jasny komunikat: „Prawo (garnizon, Ratusz) — po v1.0”. Nie implementujemy połowicznego B.
- **Co zobaczysz jako gracz:** Jak dziś — Porządek ze Szczęścia. Może jedna linia informacyjna „Prawo: wkrótce”.
- **Plusy:** Brak połowicznej mechaniki. Gracz nie oczekuje bonusu od wojska. Szybko.
- **Minusy / koszt:** W praktyce to samo co A. Ryzyko, że ktoś myśli, że C = „będzie B w tym samym patchu”.
- **Kiedy gotowe (szacunek):** Tekst w UI (~godziny).

### Rekomendacja

**A** na v1.0 (prostota), **B** jeśli chcesz, żeby garnizon miał sens społeczny od razu — koszt ~1 sprint.

### Po Twojej decyzji

Aktualizacja `order.ts` / panel Porządek → Excel (zakładka Porządek) → testy progów T1/T2.

---

## 4 — Kto wybiera pola pracy w okolicy miasta? (P0) — **ZAMKNIĘTE 2026-06-27**

**Decyzja Macieja: 4C** — auto domyślnie + **profile skupienia** (Żywność / Produkcja / Podatki / Zrównoważone) + **ręczna korekta** 👤 na heksach + **Przywróć auto**. **Pełna implementacja v1.0.** Spec: `docs/decyzje/B1-okolica-pola.md`.

---

### Archiwum pytania ABC

### O co chodzi (bez żargonu)

Każde miasto „pracuje” na **heksach wokół** — stąd bierze jedzenie, pracę, pieniądze. Dziś gra **sama** wybiera najlepsze pola (tyle pól, ile masz ludzi). W panelu jest **podgląd** okolicy (małe heksy), ale **nie klikasz** pól ani nie stawiasz ikonek 👤 „kto tu pracuje”. Ty opisywałeś wizję: **ręcznie** dodawać/odejmować obywateli na polu i **widzieć plony** z każdego heksa. Od tego zależy wygląd mockupu `Gra-podglad-MIASTO.html` i spójność z Civ.

### Dlaczego pytam teraz

To **blokuje** odświeżenie mockupu okolicy i decyzję, ile kodu UI/silnika robimy. Przy auto bilans w panelu **czasem kłamie** — pokazuje inne pola niż te, z których miasto naprawdę zbiera w turze.

### Opcja A — Tylko auto (gracz nie klika pól)

- **Co zrobimy:** Silnik co turę przypisuje N najlepszych pól (N = populacja). Panel = **podgląd** + podświetlenie obrabianych heksów. Bez 👤, bez klikania.
- **Co zobaczysz jako gracz:** Otwierasz miasto, widzisz mapkę okolicy z kolorami „te pola pracują”. Nie zmieniasz tego — jak w Civ VI w uproszczeniu.
- **Plusy:** Najszybciej. Zero nauki UI. Mniej bugów (gracz nie zostawi miasta bez żywności przez pomyłkę).
- **Minusy / koszt:** Brak kontroli — frustrujące dla fanów Civ V. Twoja wizja z 👤 **nie powstanie** w v1.0. Mockup będzie prostszy.
- **Kiedy gotowe (szacunek):** ~kilka dni (haki silnika + sync podglądu z auto-assign).

### Opcja B — Ręczny wybór pól w sekcji Okolica

- **Co zrobimy:** Gracz klika heks w podglądzie lub używa +/- 👤. Limit: suma 👤 = populacja (plus centrum miasta zawsze aktywne). Wybór **zapisujemy** i silnik go respektuje co turę.
- **Co zobaczysz jako gracz:** Na każdym polu widać 👤 i np. „+2 🌾, +1 🔨”. Pełna kontrola jak w klasycznym Civ.
- **Plusy:** Zgodne z Twoją wizją. Maksymalna głębia. Playtesty ekonomiczne sensowne (specjalizacja miasta).
- **Minusy / koszt:** Dużo UI (klik, drag, limity, komunikaty błędów). Save/load musi pamiętać przypisania. Ryzyko „złego” miasta u początkujących.
- **Kiedy gotowe (szacunek):** ~1–1,5 sprintu (UI + silnik + mockup).

### Opcja C — Auto domyślnie + opcjonalna korekta

- **Co zrobimy:** Start: silnik przypisuje optymalnie. Przycisk **„Dostosuj pola”** włącza tryb ręczny (jak B). **„Przywróć auto”** cofa do A.
- **Co zobaczysz jako gracz:** Większość graczy zostaje na auto. Zaawansowani wchodzą w 👤. Panel nie przytłacza od pierwszej minuty.
- **Plusy:** Łagodny onboarding + pełna moc dla chętnych. Dobry kompromis Civ V/VI.
- **Minusy / koszt:** **Oba** systemy do zbudowania i przetestowania — więcej pracy niż samo A **lub** samo B. Dwa tryby = więcej tekstów pomocy.
- **Kiedy gotowe (szacunek):** ~1,5–2 sprinty.

### Rekomendacja

**C**, jeśli chcesz Civ z kontrolą bez zmuszania każdego do mikromanagementu. **B**, jeśli v1.0 ma być „dla wtajemniczonych” i pełna kontrola od razu.

### Po Twojej decyzji

Odświeżenie mockupu MIASTO → handoff UI + EKONOMIA + Silnik (zapis pól, haki `getWorkedTiles`) → testy plonów per heks.

---

## 5 — Przycisk „Wykup” (rush produkcji) (P1)

**[EKRAN: Panel miasta]**

### O co chodzi (bez żargonu)

W **kolejce produkcji** miasta (budynki, jednostki) jest przycisk **„Wykup”**: płacisz z puli **Pracy** (surowiec budowlany) i **kończysz** budowę w tej turze, zamiast czekać kilka tur. To już **jest w grze** — pytanie, czy zostawiamy to na v1.0, i dla czego.

### Dlaczego pytam teraz

Rush zmienia tempo gry i balans (szybkie miasto/armia za koszt Pracy). Wyłączenie upraszcza grę, ale usuwa gotową funkcję.

### Opcja A — Zostaje (budynki i jednostki)

- **Co zrobimy:** Bez zmian — Wykup działa dla wszystkiego w kolejce.
- **Co zobaczysz jako gracz:** Możesz „przycisnąć” produkcję, gdy bardzo potrzebujesz murów albo wojownika **teraz**, kosztem zapasów Pracy.
- **Plusy:** Elastyczność. Przyjemne w kryzysie. Już działa.
- **Minusy / koszt:** Można „spryskiwać” ekonomię — szybkie armie bez czekania. Trudniejszy balans dla AI.
- **Kiedy gotowe (szacunek):** Już jest.

### Opcja B — Wyłączyć na v1.0

- **Co zrobimy:** Ukrywamy lub blokujemy Wykup. Tylko kolejka tur po turze.
- **Co zobaczysz jako gracz:** Musisz **planować** kilka tur do przodu. Brak skrótu „zapłać i miej”.
- **Plusy:** Prostszy balans. Spokojniejsze tempo. Mniej przycisków w UI.
- **Minusy / koszt:** Wolniejsza rozgrywka. Usunięcie gotowej funkcji — praca „w szufladzie”.
- **Kiedy gotowe (szacunek):** ~1 dzień (ukrycie UI + blokada akcji).

### Opcja C — Tylko budynki (nie jednostek w kolejce)

- **Co zrobimy:** Wykup działa dla **budynków**. Jednostki — tylko normalna kolejka.
- **Co zobaczysz jako gracz:** Możesz przyspieszyć mury, targ, świątynię — **nie** możesz „wyciągnąć” armii za Pracę w tej turze.
- **Plusy:** Miasto rośnie szybciej niż armia — sensowny kompromis historyczny. Mniej rush armii.
- **Minusy / koszt:** Niespójność w UI (przy jednostce brak Wykupu). Gracz może nie zrozumieć „czemu tu nie ma”.
- **Kiedy gotowe (szacunek):** ~1–2 dni (warunek typu produkcji).

### Rekomendacja

**A** — funkcja już jest, gracze lubią skróty; balans można tuningować w Excel (koszt Wykupu).

### Po Twojej decyzji

Ewentualna zmiana w `production.ts` / UI kolejki → testy → wpis w `B1-panel-budowa.md`.

---

## 6 — Przycisk auto-zarządca ⚙ w nagłówku panelu (P1)

**[EKRAN: Panel miasta]**

### O co chodzi (bez żargonu)

W **nagłówku panelu miasta** jest mały przycisk **⚙ (auto-zarządca)**. Gdy jest włączony, gra **sama** ustawia kolejkę produkcji (co budować dalej) wg prostych reguł. Dziś **nie widać**, czy ⚙ jest ON czy OFF — wygląda tak samo.

### Dlaczego pytam teraz

To drobna decyzja UX, ale wpływa na to, czy gracz wie, kto steruje miastem — on czy komputer.

### Opcja A — Zostaje + widać ON/OFF

- **Co zrobimy:** ⚙ zostaje. Gdy włączony — **podświetlony** (np. zielona obwódka, ikona „AKTYWNY”). Gdy wyłączony — szary.
- **Co zobaczysz jako gracz:** Od razu wiesz: „to miasto prowadzi auto” vs „sam decyduję”.
- **Plusy:** Zero zgadywania. Profesjonalny UX. Mały koszt kodu.
- **Minusy / koszt:** Drobna praca UI. Trzeba dopasować wygląd do reszty panelu.
- **Kiedy gotowe (szacunek):** ~1–2 dni.

### Opcja B — Bez wizualnego stanu (jak dziś)

- **Co zrobimy:** Nic nie zmieniamy w wyglądzie ⚙.
- **Co zobaczysz jako gracz:** Przycisk jest, ale nie mówi, czy działa — musisz pamiętać lub testować.
- **Plusy:** Zero pracy. Brak ryzyka psucia layoutu.
- **Minusy / koszt:** Myjący UX. Playtest: „czemu miasto samo coś buduje?” bez odpowiedzi na ekranie.
- **Kiedy gotowe (szacunek):** Już jest.

### Opcja C — Ukryć ⚙ na v1.0

- **Co zrobimy:** Usuwamy przycisk z nagłówka. Auto-zarządca wyłączony albo zawsze w tle (do ustalenia technicznie — domyślnie OFF).
- **Co zobaczysz jako gracz:** Czystszy nagłówek. **Tylko Ty** ustawiasz kolejkę — bez opcji auto.
- **Plusy:** Prostszy panel dla v1.0. Mniej mechaniki do tłumaczenia.
- **Minusy / koszt:** Feature auto-zarządcy niewidoczny / martwy. Więcej klikania ręcznie w wielu miastach.
- **Kiedy gotowe (szacunek):** ~1 dzień (ukrycie) lub więcej jeśli auto ma zostać w tle bez UI.

### Rekomendacja

**A** — mały koszt, duży zysk czytelności.

### Po Twojej decyzji

Zmiana w `cityPanel.ts` (nagłówek) → test wizualny → `B1-panel-budowa.md`.

---

## 7 — Kultura w panelu miasta (P2)

**[EKRAN: Panel miasta]**

### O co chodzi (bez żargonu)

**Kultura** miasta to osobny tor rozwoju — wpływa na granice terytorium, idee, czasem na szczęście. W panelu jest **placeholder** (hak w kodzie istnieje, ale Silnik **nie podpiął** danych). Gracz dziś nie widzi w mieście, skąd bierze się kultura i jak szybko rośnie.

### Dlaczego pytam teraz

Decyzja **7+8** mówi, ile panel miasta ma mówić o „miękkiej” sile miasta przed v1.0.

### Opcja A — Pełna sekcja v1.0

- **Co zrobimy:** Sekcja **Kultura**: suma, +/turę, progi rozszerzenia granic, lista źródeł (budynki, cuda, ulepszenia…).
- **Co zobaczysz jako gracz:** W mieście wiesz **dokładnie**, kiedy zyskasz kolejny pierścień terytorium i co dokłada punkty.
- **Plusy:** Pełna informacja bez wychodzenia na mapę. Zgodność z Spec miasta.
- **Minusy / koszt:** Duży panel. Wymaga wpięcia haków w Silniku. Więcej testów z MAPA (granice).
- **Kiedy gotowe (szacunek):** ~0,5–1 sprint (UI + Silnik).

### Opcja B — Skrót v1.0

- **Co zrobimy:** 1–2 linie: „Kultura: 24 (+3/turę)” ewentualnie pasek do następnego progu.
- **Co zobaczysz jako gracz:** Widzisz trend, **nie** pełną rozpiskę źródeł.
- **Plusy:** Szybko. Panel nie puchnie. Wystarczy do większości decyzji gracza.
- **Minusy / koszt:** Bez szczegółów — „skąd +3?” zostaje w Excelu, nie w grze.
- **Kiedy gotowe (szacunek):** ~kilka dni.

### Opcja C — Placeholder „wkrótce” do po v1.0

- **Co zrobimy:** Zostaje tekst informacyjny. Kultura tylko na HUD mapy / overlay (jeśli w ogóle).
- **Co zobaczysz jako gracz:** W panelu miasta **brak** ekonomii kultury — jak dziś.
- **Plusy:** Zero pracy teraz.
- **Minusy / koszt:** Luka w panelu — miasto to „czarna skrzynka” kulturowo.
- **Kiedy gotowe (szacunek):** 0.

### Rekomendacja

**B** na v1.0 — widać tempo, bez encyclopedii w panelu.

### Po Twojej decyzji

Handoff UI ↔ Silnik (`getCultureState`) → sekcja w mockupie MIASTO → `B4-wealth.md` / kultura.

---

## 8 — Religia w panelu miasta (P2)

**[EKRAN: Panel miasta]**

### O co chodzi (bez żargonu)

Podobnie jak kultura — **religia** w mieście (wyznawcy, dominacja wiary) wpływa na szczęście i stabilność. Dziś w panelu: **„Religia: wkrótce”**.

### Dlaczego pytam teraz

Razem z **7** decyduje, czy panel miasta v1.0 to „ekonomia twarda” czy też pełne społeczeństwo + kultura + wiara.

### Opcja A — W tej samej sekcji co kultura (v1.0)

- **Co zrobimy:** Blok **Kultura i religia**: punkty kultury + dominująca religia, % wyznawców, wpływ na szczęście.
- **Co zobaczysz jako gracz:** Jedno miejsce na „miękką” siłę miasta — nie musisz skakać po overlayach.
- **Plusy:** Spójny blok. Po podboju widać obcą wiarę od razu w mieście.
- **Minusy / koszt:** Dużo danych na ekranie. Silnik musi dostarczać religię per miasto (CYWILIZACJE/EKONOMIA).
- **Kiedy gotowe (szacunek):** ~0,5–1 sprint (zależnie od **7**).

### Opcja B — Jedna linia „Religia: wkrótce” (jak dziś)

- **Co zrobimy:** Bez rozbudowy — informacja, że mechanika przyjdzie później.
- **Co zobaczysz jako gracz:** Wiesz, że religia w panelu **nie gra jeszcze roli**.
- **Plusy:** Minimum pracy. Nie rozprasza przy zamykaniu v1.0.
- **Minusy / koszt:** Brak informacji gameplayowej. Niespójność ze Spec, gdzie religia już jest opisana.
- **Kiedy gotowe (szacunek):** 0.

### Opcja C — Ukryć do po v1.0

- **Co zrobimy:** Usuwamy linię o religii z panelu — zero wzmianki.
- **Co zobaczysz jako gracz:** Panel krótszy; religia tylko poza miastem (mapa/HUD), jeśli w ogóle.
- **Plusy:** Najczystszy UI.
- **Minusy / koszt:** Gracz może nie wiedzieć, że religia w ogóle istnieje w projekcie.
- **Kiedy gotowe (szacunek):** ~godziny.

### Rekomendacja

**B**, jeśli **7=B** (skrót). **A**, jeśli chcesz pełne miasto od razu — koszt wyższy.

### Po Twojej decyzji

UI sekcja → haki Silnika → `B4-wealth.md` / religia UI.

---

## 9 — Gdzie suwak split żywności? (P2)

**[EKRAN: Panel miasta]** · *Opcja C dotyczy też **HUD mapy** (Grupa A)*

### O co chodzi (bez żargonu)

Zamknąłeś już **model żywności hybrydowej**: miasto ma magazyn, a **państwo/wojsko** ma wspólne zapasy. Nadwyżka żywności z miast można **dzielić**: część zostaje na rozwój miasta (ludność), część idzie do **skarbca państwa** na utrzymanie armii. Brakuje **suwaka**, którym gracz ustawia ten podział — i decyzji, **gdzie** go pokazać.

### Dlaczego pytam teraz

Bez **9+10** nie implementujemy ticku `advanceEmpireFood` (B5) — wojsko nie głoduje, zapasy państwa nie rosną.

### Opcja A — W panelu miasta, sekcja „Imperium / wojsko”

- **Co zrobimy:** Suwak w panelu miasta (globalny dla całego imperium): np. „70% do miast / 30% do zapasów państwa”. Widoczny przy każdym mieście ten sam.
- **Co zobaczysz jako gracz:** Zarządzasz miastem i **od razu** widzisz, ile żywności imperium zostawiasz na armię.
- **Plusy:** Jedno miejsce przy ekonomii miasta. Logiczne po otwarciu Warszawy/Rzymu.
- **Minusy / koszt:** Mieszanie „tego miasta” z „całego państwa” na jednym ekranie — może mylić.
- **Kiedy gotowe (szacunek):** ~0,5 sprintu (UI + Silnik + tick B5).

### Opcja B — Osobny panel obok suwaków Handel/Praca

- **Co zrobimy:** W prawej kolumnie panelu, obok suwaków **Handel/Praca**, mały blok **„Zapasy państwa”** z suwakiem split.
- **Co zobaczysz jako gracz:** Wszystkie **suwaki ekonomii** razem — handel, praca, żywność imperium.
- **Plusy:** Spójny układ „suwak = decyzja ekonomiczna”. Nie udaje sekcji lokalnej.
- **Minusy / koszt:** Prawa kolumna gęstsza. Trzeba zmieścić bez clutteru.
- **Kiedy gotowe (szacunek):** ~0,5 sprintu.

### Opcja C — Tylko na HUD mapy (nie w panelu miasta)

- **Co zrobimy:** Suwak na **górnym/dolnym pasku mapy** świata, obok ikony żywności państwa.
- **Co zobaczysz jako gracz:** W panelu miasta **nie ma** splitu — ustawiasz go na mapie, „strategicznie”.
- **Plusy:** Panel miasta = tylko to miasto. Split = decyzja globalna na mapie (jak w wielu grach 4X).
- **Minusy / koszt:** Wchodzi **Grupa A** (HUD). Mniej wygodne, gdy długo siedzisz w panelu jednego miasta.
- **Kiedy gotowe (szacunek):** ~0,5–1 sprint (koordynacja B + A + Silnik).

### Rekomendacja

**A** lub **B** — obie trzymają split blisko ekonomii miasta; **B** jeśli chcesz wizualnie oddzielić suwaki.

### Po Twojej decyzji

Implementacja `empire-food.ts` + UI + HUD (jeśli C) → test głodu wojska −8% HP → `B5-zywnosc.md`.

---

## 10 — Domyślny split żywności (P2)

**[EKRAN: Panel miasta]**

### O co chodzi (bez żargonu)

Gdy gracz **nie rusza** suwaka z pytania **9**, gra musi mieć **startowy** podział: ile % nadwyżki żywności z miast idzie na **rozwój miast** (ludność, magazyny), a ile na **zapasy państwa** (armia, kryzys).

### Dlaczego pytam teraz

To wpływa na tempo wzrostu miast vs bezpieczeństwo wojska na starcie — ważne w balansie i w tutorialu.

### Opcja A — 70% miasta / 30% państwo

- **Co zrobimy:** Domyślnie suwak stoi na **70/30** (zgodnie ze spec EKONOMIA).
- **Co zobaczysz jako gracz:** Miasta rosną **szybciej** niż rosną zapasy wojska — musisz świadomie podnieść udział państwa przed wielką wojna.
- **Plusy:** Zachęta do rozbudowy miast na początku. Zgodne z dokumentacją lane.
- **Minusy / koszt:** Agresywna gra od razu — wojsko może głodować, jeśli gracz nie dotknie suwaka.
- **Kiedy gotowe (szacunek):** Parametr w JSON (~minuty) + testy.

### Opcja B — 50% / 50%

- **Co zrobimy:** Domyślny split równy.
- **Co zobaczysz jako gracz:** Bezpieczniejsze wojsko „out of the box”; wolniejszy boom miast.
- **Plusy:** Łagodniejszy start. Mniej niespodzianek z głodem.
- **Minusy / koszt:** Wolniejsza gra ekspansji miast. Odstępstwo od spec 70/30.
- **Kiedy gotowe (szacunek):** Parametr w JSON.

### Opcja C — Inny — podajesz procenty w odpowiedzi

- **Co zrobimy:** Wpisujesz np. `10C 60/40` — dokładnie tyle ustawiamy w danych startowych.
- **Co zobaczysz jako gracz:** Twój własny balans startowy.
- **Plusy:** Pełna kontrola designu.
- **Minusy / koszt:** Musisz podać liczby; agent nie zgaduje.
- **Kiedy gotowe (szacunek):** Parametr w JSON.

### Rekomendacja

**A (70/30)** — jeśli chcesz szybsze miasta i świadome zarządzanie wojskiem. **B**, jeśli playtesty pokazały zbyt częsty głód.

### Po Twojej decyzji

Klucz w `econ-params.json` → testy ticku B5 → Excel.

---

## 11 — Ulepszenia terenu a plony na v1.0? (P0)

**[EKRAN: Panel miasta]** · *Budowa ulepszeń = **mapa świata** (tryb Budowa); efekt widać w plonach miasta*

### O co chodzi (bez żargonu)

Na **mapie świata** możesz (docelowo) stawiać **ulepszenia**: farmę na polu, kopalnię na wzgórzu itd. — **15 typów** masz w Excelu. Decyzję „budujemy z mapy” masz **zamkniętą**. Problem: dziś **farma na polu nie daje więcej jedzenia** — silnik liczy plony **bez** ulepszeń. To jak Civ bez sensu stawiania farm.

### Dlaczego pytam teraz

To **blokuje** pełną okolicę miasta (pytanie **4**) i playtest ekonomii. Gracz stawia farmę i **nie widzi efektu** — wygląda na bug.

### Opcja A — Pełne v1.0 (wszystkie 15 typów wpływają na plony)

- **Co zrobimy:** Każde ulepszenie z JSON dodaje bonus do plonów heksa; auto-assign i ręczne pola (**4**) to respektują.
- **Co zobaczysz jako gracz:** Farma = więcej 🌾, kopalnia = więcej 🔨 / surowca. Okolica i mapa **mają sens**.
- **Plusy:** Pełna głębia Civ. Excel i gra zgodne. Uzasadniony tryb Budowa na mapie.
- **Minusy / koszt:** Największy batch: EKONOMIA (`tileYield`) + MAPA (wizualizacja) + Silnik + testy regresji.
- **Kiedy gotowe (szacunek):** ~1–1,5 sprintu.

### Opcja B — v1.0 minimum (~5 podstawowych: farma, kopalnia, pastwisko…)

- **Co zrobimy:** Tylko **kluczowe** ulepszenia wpływają na ekonomię; reszta działa wizualnie / później.
- **Co zobaczysz jako gracz:** Najczęstsze decyzje (jedzenie, praca, surowiec) **działają**; egzotyczne ulepszenia — dopiero później.
- **Plusy:** ~80% rozgrywki przy ~40% pracy. Szybsze domknięcie pętli „buduj → zyskaj”.
- **Minusy / koszt:** Reszta 15 w Excelu „na papierze”. Gracz może zbugować się na ulepszeniu bez efektu.
- **Kiedy gotowe (szacunek):** ~0,5–1 sprint.

### Opcja C — Po v1.0 (najpierw okolica / auto-assign z pyt. 4)

- **Co zrobimy:** Najpierw panel okolicy i przypisanie pól; **dopiero potem** bonusy z ulepszeń.
- **Co zobaczysz jako gracz:** W v1.0 ulepszenia na mapie **dekoracja** lub pod bitwę — **nie** ekonomia.
- **Plusy:** Kolejność prac: UX pól przed bonusami. Mniejszy rush przed deadline.
- **Minusy / koszt:** Długa luka — gracz stawia farmę i **nic**. Słaby playtest ekonomii. Ryzyko „v1.0 bez Civ-feel”.
- **Kiedy gotowe (szacunek):** Po v1.0 (kolejna faza).

### Rekomendacja

**B** — szybki sensowny efekt farm/kopalni; reszta typów w patchu. **A**, jeśli v1.0 ma być pełne Civ parity.

### Po Twojej decyzji

EKONOMIA rozszerza `WorkedTile` + `tileYield` → MAPA sync wizualny → testy plonów → Excel ulepszeń.

---

## Odpowiedź Macieja (wzór)

```
1C 2B 3A 4B 5A 6A 7B 8B 9A 10A 11B
```

Przy **10C** dopisz procenty, np. `10C 60/40`.

Po odpowiedzi agent zapisuje decyzje i **nie pyta ponownie** o zamknięte tematy.
