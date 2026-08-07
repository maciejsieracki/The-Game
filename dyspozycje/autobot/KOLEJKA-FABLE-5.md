# KOLEJKA FABLE 5 — tematy dla najmocniejszego modelu

**ID:** `R-FABLE-KOLEJKA-TYGODNIOWA` · **Założona:** 2026-08-07
**Rytm:** przegląd raz w tygodniu. Maciej puszcza z listy tyle pozycji, ile pozwoli dostępny limit.

## Jak to działa

1. **Evaluator AutoBot** po każdym werdykcie przegląda własne noty N1..Nx i dopisuje tu kwalifikujące
   się tematy. Gdy nie ma żadnego — pisze wprost **„brak kandydatów do kolejki"**, żeby dało się
   odróżnić „nie było" od „zapomniał".
2. **Plik jest dopisywany, nigdy nadpisywany.** Pozycja wykonana wędruje do sekcji
   [Wykonane](#wykonane) z datą i wynikiem — nie znika.
3. **Wybór:** Maciej podaje ID pozycji (np. `F-02`, `F-05`) albo „lecimy od góry do wyczerpania limitu".

## Co się kwalifikuje — trzy kategorie

| Kat. | Nazwa | Definicja |
|---|---|---|
| **A** | **Dziury i nieścisłości** | Exploity reguł gry, ścieżki bez testu, sprzeczności między dwoma miejscami w kodzie/danych, martwy kod maskujący realne zachowanie |
| **B** | **Balans i audyt rozgrywki** | Czy system domyka się przez pełną partię, czy liczby są spójne, czy któraś strategia jest trywialnie dominująca, czy hierarchie parametrów się nie rozjeżdżają |
| **C** | **Refaktory architektoniczne** | Duże, ryzykowne zmiany strukturalne o wysokiej cenie błędu |

**NIE kwalifikują się:** zwykłe bugi z jasną naprawą · poprawki testów · zadania dokumentacyjne · drobne UI.

**Kryterium rozstrzygające (K3** z `docs/decyzje/R-AUTOBOT-EVALUATOR-WARSTWY-MODELI.md`**):**
czynność wymaga **wymyślenia czegoś, czego nikt nie zapisał** — nie istnieje lista poprawnych
odpowiedzi do porównania. Jeśli gdzieś w repo leży punkt odniesienia (AC, kanon, zamknięta lista
w decyzji), to jest **K2** i robi to Opus 5 w normalnej pętli, nie Fable.

---

## Kolejka — stan 2026-08-07

Kolejność odzwierciedla iloczyn dwóch czynników: **(1)** jak bardzo temat dotyka fundamentu, który
psuje się cicho w KAŻDEJ przyszłej partii/mapie, oraz **(2)** ile jest do wymyślenia od zera
(nowa mechanika / nowy algorytm / nowa symulacja) zanim da się w ogóle zacząć wdrażać.

| ID | Kat. | Temat | Dlaczego najmocniejszy model | Źródło |
|---|:---:|---|---|---|
| ~~**F-01**~~ | ~~A~~ | ~~**Pangea `coastRatio`**~~ — **ZDJĘTE Z KOLEJKI 2026-08-07.** Diagnostyka AutoBot rozstrzygnęła temat: metryka mierzy zły obrys (`Wybrzeze` liczone jako ląd), po naprawie wszystkie 5 seedów przechodzi. To zwykły bug z jasną naprawą, nie zadanie K3. Przeniesione do `docs/decyzje/P-MAPGEN-PANGEA-OBRYS.md` jako otwarte ABC. | — | `docs/decyzje/P-MAPGEN-PANGEA-OBRYS.md` |
| **F-02** | **B** | **Re-audyt bilansu surowców na 100 tur.** Audyt z 2026-07-25 (10 miast / 100 tur) wykazał **rosnący z liczbą miast nadmiar** surowców — cap civ-wide jest płaski, imperium 4-miejskie marnuje „setki–tysiące sztuk"/100 tur, kamień „bez odbiorcy", magazyn „traci sens po turze ~15". Od tego czasu weszło kilkanaście zmian ekonomii (`R-STAWKI` ×2, `R-NADMIAR-POOLS` dodatkowe ×2, magazyn 100→500+100/budynek, redesign Daniny/Podatku, weterani, korupcja ×0,5, zróżnicowane utrzymanie budynków) i **nikt nie przepuścił pełnej symulacji ponownie**. | Wymaga zbudowania nowej symulacji wieloturowej i wielomiastowej — nie ma gotowego narzędzia dla stanu po tych zmianach — oraz osądu, które z kilkunastu nałożonych decyzji się znoszą, a które kumulują. | `dyspozycje/BILANS-SUROWCE-100T-2026-07-25.md:1,40` · `REJESTR:187,209` |
| **F-03** | **B** | **Przepaść Mocy gracz vs AI.** AI mają wciąż **12–15× mniej Mocy** niż gracz (playtest: gracz **6725**, Zulusi **536**, Chińczycy **436**) mimo FALI 220. Root cause #2 — `canAfford` → pusta kolejka produkcji, surowce tylko rosną („myszkowanie") — pozostaje **otwarty, bez zaprojektowanej naprawy**. | Nikt nie zapisał, JAK naprawić projektowo pustą kolejkę AI przy `canAfford`. Wymaga wymyślenia nowej heurystyki decyzyjnej AI (brak wzorca w kodzie) i sprawdzenia jej na pełnych partiach wielu cywilizacji, żeby nie zepsuć parytetu. | `dyspozycje/PYTANIA-OTWARTE.md:1673-1690` |
| **F-04** | **C** | **Rzeki bez limitera vs czas generacji.** Maciej żąda usunięcia **wszystkich** twardych limitów liczby rzek („powinny siewić tak długo, jak są w stanie"), ale generator na Super Huge Pangea (320 tys. heksów) zajmuje już **14,6 min**, z czego same rzeki główne **523 s (~70 %)**. Zdjęcie capów bez nowego algorytmu grozi generacją o wiele minut dłuższą. | Wymaga zaprojektowania nowej struktury/algorytmu (przebudowa `RiverHexSpatialIndex`, inny sposób siewu niż `pangeaBootstrapRiverTarget`/`gridStride`) godzącego dwa sprzeczne wymagania właściciela. Dotyka rdzenia generatora używanego w każdej nowej grze. | `dyspozycje/PYTANIA-OTWARTE.md:1561-1580,1611-1614` |
| **F-05** | **B** | **Skumulowany mnożnik utrzymania ×4.** `upkeep-test.cjs` daje **49/73** (24 porażki). Przyczyna: dwie osobno zatwierdzone decyzje mnożnikowe (`R-STAWKI-STROJENIE` ×2 i `R-NADMIAR-POOLS` FALA 2 dodatkowe ×2) **nałożyły się na te same koszty** utrzymania budynków/jednostek/wojska, dając efektywnie **×4**. Nikt nie zweryfikował, czy to wciąż grywalne. | Testu nie należy „naprawiać", tylko rozstrzygnąć merytorycznie: czy ×4 to zamierzony poziom trudności ekonomicznej, czy nieprzewidziany efekt uboczny dwóch niezależnych decyzji. Wymaga przeliczenia progów na pełnej skali imperium. | `PYTANIA-OTWARTE.md:1711-1713` · `HANDOFF-SESJA-2026-08-06_FALA-254:75` |
| **F-06** | **B** | **Mennica + Waluta — szczyt ×5,79 do Skarbca.** Potwierdzony mnożnik Skarbca z handlu **×5,79** (poziom normalny). Otwarta ocena: czy ścieżka Targowisko→Waluta→Mennica nie jest **trywialnie dominująca** wobec innych źródeł dochodu. | Wymaga policzenia, w jakim tempie ×5,79 przebija Pracę, handel międzynarodowy i Podatek w perspektywie wielu cywilizacji i epok. Ocena dominacji strategii, nie punktowa poprawka liczby. | `STAN-PRACY-HANDOFF.md:616` |
| **F-07** | **C** | **PYTANIE 84 wariant B — budynki zużywające surowiec z magazynu.** Decyzja hybrydowa Macieja (dostęp = natychmiastowe uśpienie jak Mennica; surowiec-z-magazynu = zużycie co turę aż do wyczerpania) czeka na `działaj`, ale silnik **nie ma dziś żadnego mechanizmu** zużycia surowca na turę przez budynek, a stawki dla 6 budynków (Stolarnia, Warsztat kamieniarski, Kuźnia, Garncarnia, Cegielnia, Spichlerz) **nie są nigdzie zapisane**. | Dosłownie „wymyślenie czegoś, czego nikt nie zapisał": nowa mechanika (stawki zużycia per budynek, w sztukach/turę) plus wpięcie jej w istniejący system bramek surowcowych bez zepsucia trzech innych, już działających rodzajów bramek. | `dyspozycje/PYTANIA-OTWARTE.md:714-757` |
| **F-08** | **C** | **Glina/ruda → brąz: model civ-wide czy ilościowy.** Nierozstrzygnięte pytanie z playtestu: czy przebudować dostęp do Brązu (dziś **binarny, civ-wide**) na model ilościowy (przepływ sztuk), analogicznie do wykonanych już migracji Złota (`PYTANIE-84-U3`) i cegły (szlaki handlowe). | Wymaga zaprojektowania migracji całego łańcucha produkcji Brązu (jednostki, budynki, dostęp) na przepływ ilościowy. Strukturalna zmiana silnika ekonomii dotykająca rekrutacji jednostek Brązu i Żelaza w całej grze; brak gotowego wzorca poza analogią do Złota. | `STAN-PRACY-HANDOFF.md:617` |
| **F-09** | **C** | **DYSPOZYCJA 85 — rozdzielenie Handlu od Podatku.** Decyzja właściciela, jego słowa dosłownie: *„Nie powinno być żadnych dodatkowych informacji w miastach, bo to jest globalne ustawienie dla całej cywilizacji, a nie dla miasta."* Wniosek redakcyjny dokumentu (nie cytat): handel międzynarodowy jest sprawą imperium, więc przy wdrożeniu trzeba go z panelu miasta **usunąć, a nie skopiować**. Decyzja **ZDECYDOWANA, ale NIEWDROŻONA**: przełożenie żetonów HUD, przeniesienie handlu międzynarodowego do jednej zakładki, zamiana sekcji „Handel" w mieście na „Podatek". | Wymaga przejrzenia całego panelu miasta i **usunięcia**, nie skopiowania, wszystkiego o szlakach z obcymi. Zmiana rozgraniczenia „co globalne, co per-miasto" dotyka `hud.ts`, `cityPanel.ts`, `trade-routes.ts` i suwaka Danina/Podatek jednocześnie — łatwo zostawić duplikat danych, którego nikt nie przewidział. | `dyspozycje/PYTANIA-OTWARTE.md:761-804` |
| **F-10** | **A** | **`categoryOf()` klasyfikuje jednostki Żelaza jako `'domyslny'`.** Nowe jednostki epoki Żelaza dostają kategorię `'domyslny'` zamiast realnej klasy broni (`gra/src/units/setup.ts`). Potwierdzone, że nie wpływa na render — **nieprzejrzane**, czy wpływa na inną logikę zależną od kategorii (filtrowanie, kontry, poradnik). | Wymaga przeszukania całego kodu pod kątem **wszystkich** miejsc czytających `category`/`kategoria` jednostki, nie tylko renderu, i osądzenia, czy błędna etykieta gdzieś cicho psuje mechanikę. Klasyczna „martwa etykieta maskująca realne zachowanie" — pełnego audytu wpływu nikt nie zrobił. | `STAN-PRACY-HANDOFF.md:623` |

### Rozkład kolejki

| Kategoria | Pozycje | Liczba |
|---|---|---:|
| **A** — dziury i nieścisłości | F-10 (F-01 zdjęte) | 1 |
| **B** — balans i audyt rozgrywki | F-02, F-03, F-05, F-06 | 4 |
| **C** — refaktory architektoniczne | F-04, F-07, F-08, F-09 | 4 |
| **RAZEM** | | **9** |

### Uwagi do konkretnych pozycji

- **F-01 — ZDJĘTE 2026-08-07.** Diagnostyka AutoBot rozstrzygnęła temat w jednej rundzie:
  to **nie** regresja (pomiar przed/po `C-MAPA-Q1=B` identyczny co do bitu) i **nie** kwestia
  progu, tylko **wadliwa metryka** — `Wybrzeze` jest wodą, a `groupLandMassKeys` liczy je jako ląd.
  Po naprawie metryki wszystkie 5 seedów przechodzi. Zwykły bug z jasną naprawą → nie kwalifikuje
  się do kolejki. **Kolejka ma dziś 9 pozycji, nie 10.**
- **F-02** i **F-05** dotykają tej samej warstwy (skumulowane mnożniki ekonomiczne) — puszczone razem
  dadzą spójniejszy obraz niż osobno. **F-06** jest ich naturalnym trzecim elementem.
- **F-07** i **F-08** to ta sama rodzina (model dostępu do surowca: binarny vs ilościowy) —
  rozstrzygnięcie jednego przesądza kierunek drugiego.

---

## Wykonane

_(pusto — pierwszy przegląd zaplanowany na wtorek 2026-08-11)_

| Data | ID | Wynik | Commit |
|---|---|---|---|
