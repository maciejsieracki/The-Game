# PYTANIA OTWARTE — czekają na decyzję Macieja
Aktualizacja: 2026-07-25. Numeracja ciągła z `REJESTR-PROSB-I-ZADAN.md` (1–17 odpowiedziane).
Zasada: każde pytanie w pełnej formie ABC (opis + min. 2 za + min. 2 przeciw + rekomendacja), zawsze z numerem.

---

## PYTANIE 18 — profil Pretorium po sprzątnięciu · STATUS: OTWARTE

**Sytuacja.** Po wdrożeniu decyzji 16A (`obrona` → 0) i decyzji 6 (`mnoznik` → 0, jak przy Pałacu) Pretorium zostaje
z bonusami **praca 2 / pieniądz 3 / zadowolenie 1** za cenę 75 pracy + 9 cegły + 3 utrzymania na turę.
Historyczne Pretorium to siedziba namiestnika prowincji — „pałac zamiejscowy", centrum administracji i poboru podatków
w mieście, które nie jest stolicą. Porównanie z Pałacem III (ta sama epoka Żelaza, 90 pracy): kultura 11, zadowolenie 5.

**Cel pytania.** Czy zostawiamy Pretorium takim, jakim będzie po sprzątnięciu, czy dajemy mu profil odpowiadający roli i cenie.

**Dlaczego teraz.** Subagent i tak edytuje ten wpis (obrona + mnożnik + opis) — lepiej jednym przejściem niż wracać po raz trzeci.

**A. Wzmocnić jako „pałac prowincjonalny"** — praca 2, pieniądz 3, **zadowolenie 3** (zamiast 1), bez kultury, bez obrony,
bez mnożnika; opis przepisany na „administracja prowincji: pobór podatków i utrzymanie porządku".
- Za: cena 75 + cegła 9 zaczyna się bronić.
- Za: zadowolenie to realny problem rozrastających się miast — budynek dostaje własną niszę.
- Przeciw: podbicie parametru „na oko", bez rozegranego balansu.
- Przeciw: zadowolenie 3 w każdym mieście może być mocniejsze niż Pałac III (5, tylko w stolicy).

**B. Przypiąć Pretorium do miast niestołecznych** — bonusy jak w A, ale budynek niedostępny w stolicy.
- Za: najbliżej historii — namiestnik nie rezyduje w stolicy.
- Za: eliminuje stackowanie Pałac + Pretorium w jednym mieście.
- Przeciw: nowa mechanika (warunek „nie stolica") — kod, UI, komunikat, parytet AI.
- Przeciw: gracz może odebrać to jako arbitralne, bo w grze nie ma jeszcze widocznego pojęcia „prowincji".

**C. Nie ruszać wartości** — tylko usunąć martwe pola i poprawić opis (praca 2 / pieniądz 3 / zadowolenie 1).
- Za: najmniejsza zmiana, zero ryzyka dla balansu.
- Za: zgodne z zasadą „nie tworzymy problemów, których nie ma".
- Przeciw: budynek zostaje słaby — 75 pracy za +2/+3/+1 to marna oferta w epoce Żelaza.
- Przeciw: różnica wobec Pałacu III jest rażąca.

**REKOMENDACJA: A** — jedno przejście, bez nowej mechaniki, budynek przestaje być atrapą.

---

## PYTANIE 19 — utrzymanie budynków: zróżnicowane czy płaskie? · STATUS: OTWARTE

**Sytuacja.** Każdy budynek ma w danych własne `utrzymanie` (0–5 na turę). **Silnik tego nie czyta** — `econ-params.json`
ustawia płaską stawkę `utrzymanie_budynek` (łatwy 1 / normalny 1 / trudny 2), która **zawsze** wygrywa z wartością z danych
(`economy-upkeep.ts:511`, `flatOverride` nigdy nie jest czyszczone). Pałac III i najtańszy budynek kosztują dziś tyle samo.
UI pokazuje graczowi zróżnicowane liczby, których silnik nie stosuje. W kodzie opisane jako świadomy placeholder v0.1.

**Cel pytania.** Czy odblokowujemy zróżnicowane utrzymanie, czy przyznajemy wprost, że jest płaskie.

**Dlaczego teraz.** To ostatnie duże pole z rodziny „UI obiecuje, silnik ignoruje" — zostawione, będzie nas mylić przy każdym
kolejnym przeglądzie, dokładnie tak jak mnożnik i `przyrost`.

**A. Włączyć zróżnicowane utrzymanie z danych** (płaska stawka zostaje tylko jako domyślna dla budynków bez wpisu).
- Za: znika kolejny martwy parametr, dane zaczynają znaczyć to, co pokazują.
- Za: realny koszt drogich budynków — decyzja „czy stać mnie na Pałac III" wreszcie coś znaczy.
- Przeciw: zmienia ekonomię wszystkich istniejących zapisów — trzeba przetestować, czy miasta nie wpadną na minus.
- Przeciw: 37 wartości `utrzymanie` nigdy nie było balansowanych (były martwe).

**B. Zostawić płaskie utrzymanie i wyczyścić dane** — usunąć zróżnicowane wartości z JSON i z UI.
- Za: zero ryzyka dla ekonomii, natychmiast usuwa mylące liczby.
- Za: spójne z deklaracją v0.1.
- Przeciw: tracimy przygotowaną (choć niebalansowaną) siatkę wartości.
- Przeciw: utrzymanie przestaje być jakąkolwiek decyzją gracza.

**C. Zostawić jak jest**, dopisać notatkę w dokumentacji.
- Za: zero pracy.
- Za: nic się nie psuje.
- Przeciw: to dokładnie wzorzec, przez który straciliśmy czas na mnożniku i `przyrost`.
- Przeciw: gracz podejmuje decyzje budowlane na podstawie fałszywych liczb.

**REKOMENDACJA: A** — ale jako osobne zadanie z testem ekonomii, nie doklejone do bieżącej paczki.

---

## PYTANIE 20 — Targowisko: bonus, którego nigdy nie było · STATUS: OTWARTE

**Sytuacja.** Targowisko (Rynek) ma `baza.mnoznik: 0`, a cały zamierzony efekt handlowy siedzi w `przyrost.mnoznik: 3` —
czyli w polu, którego silnik nie czytał. Efekt wynosił **zero na każdym poziomie, od zawsze**. Gracz widział chip
„+3/poz. mnożnik" i nie dostawał nic. Realnie budynek daje tylko **pieniądz 3 (+2/poziom)** za 25 pracy + 6 drewna.
Mnożniki z budynków gospodarczych i tak usuwamy decyzją właściciela.

**Cel pytania.** Czy zamierzony efekt handlowy przenosimy do działającego parametru, czy Targowisko zostaje przy bazowym pieniądzu.

**Dlaczego teraz.** Przy usuwaniu mnożnika subagent i tak dotknie tego wpisu — bez decyzji cicho skasujemy funkcję, która miała istnieć.

**A. Przenieść zamierzony efekt do bazowego pieniądza** — `baza.pieniadz` 3 → 5, `przyrost.pieniadz` 2 → 3, mnożnik skasować.
- Za: gracz dostaje realnie to, co budynek obiecywał, w strumieniu, który działa.
- Za: zero nowej mechaniki, tylko liczby.
- Przeciw: to nie to samo co procent od handlu — nie skaluje się z wielkością miasta.
- Przeciw: wartości dobrane „na oko".

**B. Zostawić Targowisko z samym bazowym pieniądzem 3 (+2)** — mnożnik znika bez rekompensaty.
- Za: najczystsze — usuwamy martwy parametr i nic nie zmyślamy.
- Za: budynek jest tani (25 pracy, epoka Kamienia), więc nie jest przepłacony.
- Przeciw: budynek handlowy bez bonusu handlowego to słaba tożsamość.
- Przeciw: ma 10 nazw poziomów („Giełda", „Bank centralny") — sugeruje ambitniejszą rolę.

**C. Dać Targowisku realny procent do pieniądza** — nowy, działający strumień: +10% do dochodu miasta.
- Za: realizuje pierwotny zamysł dosłownie.
- Za: procent skaluje się z rozwojem miasta — budynek zachowuje sens w późnych epokach.
- Przeciw: odtwarzamy mechanikę mnożnika, którą właśnie kasujemy jako źródło zamieszania.
- Przeciw: procenty od dochodu łatwo się kumulują i wymykają spod kontroli.

**REKOMENDACJA: A** — efekt zostaje, mechaniki nie przybywa.

---

## PYTANIE 24 — ulepszenia jednostek: co się dzieje przy awansie budynku · STATUS: **ODPOWIEDZIANE — bonusy się sumują**

**Sytuacja.** Dwie ścieżki ulepszeń są wdrożone i działają. Ale awans budynku w tej grze to **podmiana `id`**, nie dodanie
drugiego budynku: Wielka Kuźnia **zastępuje** Kuźnię żelaza, Akademia wojskowa **zastępuje** Koszary. Silnik liczy bonus
tylko z budynków realnie obecnych na liście miasta. Skutek liczbowy:

| Ścieżka | Zakładałeś | Realnie osiągalne |
|---|---|---|
| A — Pancerz (Kuźnia 15 + Kuźnia żelaza 15 + Wielka Kuźnia 15) | +45% | **+30%** (Kuźnia + Wielka Kuźnia; Kuźnia żelaza już nie istnieje) |
| B — Parametry (Koszary 20 + Akademia wojskowa 20 + Warsztat oblężniczy 10) | +50% | **+30%** (Akademia + Warsztat; Koszary już nie istnieją) |

Wdrożyłem wariant zachowawczy (liczy się tylko to, co miasto ma), bo zgadywanie w drugą stronę byłoby zmianą Twojej decyzji.

**Cel pytania.** Ustalić, czy budynek-następca ma przejmować bonus poprzednika, czy sumy mają zostać niższe niż zakładałeś.

**Dlaczego teraz.** Mechanika jest w kodzie i działa; to jedna liczba do zmiany, ale zmienia siłę każdej jednostki w grze.

**A. Następca kumuluje bonus poprzednika** — Wielka Kuźnia daje 30% (15 własne + 15 za zastąpioną Kuźnię żelaza),
Akademia wojskowa daje 40% (20 + 20 za Koszary). Sumy wracają do Twoich +45% i +50%.
- Za: wychodzi dokładnie ta liczba, którą podałeś — +45% pancerza i +50% parametrów.
- Za: spójne z tym, jak awanse działają po stronie ekonomii (budynek wyższego tieru ma wyższe wartości bazowe, nie traci dorobku poprzednika).
- Przeciw: gracz płaci za Akademię wojskową raz, a dostaje bonus za dwa budynki — trudniej to wytłumaczyć w interfejsie.
- Przeciw: zachęca do jak najszybszego awansu, bo poprzednik nigdy nie jest „stracony".

**B. Zostawić wariant zachowawczy** — maksimum +30% na każdej ścieżce.
- Za: prosta, uczciwa zasada: bonus daje budynek, który stoi w mieście.
- Za: awans jest realną decyzją, a nie automatycznym zyskiem.
- Przeciw: sumy są niższe niż zakładałeś — jednostki będą wyraźnie słabsze niż planowałeś.
- Przeciw: awans Koszar na Akademię wojskową daje netto tylko +0% (20 → 20), więc gracz nie widzi zysku z ulepszenia.

**C. Podnieść wartości budynków-następców** — Wielka Kuźnia 30% zamiast 15%, Akademia wojskowa 40% zamiast 20%,
wpisane wprost do danych.
- Za: efekt jak w A, ale widoczny wprost w danych i w interfejsie — bez ukrytej logiki „za zastąpiony budynek".
- Za: łatwiej balansować, bo wartość budynku to jedna liczba w pliku.
- Przeciw: rozjeżdża się z zasadą „każdy budynek kuźniczy daje +15%", którą podałeś.
- Przeciw: przy kolejnych awansach w przyszłych epokach trzeba będzie pamiętać o ręcznym sumowaniu.

**REKOMENDACJA: C** — daje Twoje docelowe sumy, a jednocześnie wartość jest widoczna wprost w danych, bez ukrytej reguły.

**ODPOWIEDŹ MACIEJA (2026-07-25):** „Bonusy muszą się zsumować. Jeżeli jest Upgrade, w jednym wypadku pierwszego poziomu
było 20% a w wypadku drugiego poziomu 20% to dla drugiego poziomu łącznie 40 musi być wykazywane 40 i tak we wszystkim."
→ **Wdrażane jako wariant A uogólniony:** silnik sumuje procenty po całym łańcuchu `upgradeFrom` (rekurencyjnie),
a interfejs pokazuje **sumę skumulowaną**, nie surowy procent budynku. Zasada ogólna — zadziała automatycznie dla
przyszłych łańcuchów w kolejnych epokach, bez ręcznego przeliczania w danych.
Wynikowe sumy: **Ścieżka A (Pancerz) 45%** (Kuźnia 15 + Kuźnia żelaza 15 + Wielka Kuźnia 15) ·
**Ścieżka B (parametry) 50%** (Akademia wojskowa 20+20 za Koszary + Warsztat oblężniczy 10).
Interfejs: Akademia wojskowa pokazuje „+40% Parametry", Wielka Kuźnia „+30% Pancerz".

**Uwaga dodatkowa.** Ścieżka B nie skaluje `Obrażeń broni` ani `Przebicia` — bo istniejące bonusy cywilizacji też ich nie
skalują. Nie wprowadzałem tu nowej asymetrii. Jeśli chcesz, żeby skalowała, to osobna decyzja.

---

# PACZKA 2 — pytania przygotowane, jeszcze nie zadane

## PYTANIE 21 (szkic) — martwe pole `odblokowuje`
Mury / Cytadela / Warsztat oblężniczy mają w danych `"odblokowuje": "maMur"/"maFort"/"maWarsztatOblezniczy"`, ale flagi
ustawia hardkodowane porównanie `id === 'mury'` w `main.ts:2016`. Pole nie istnieje nawet w typie `BuildingDef`.
Warianty: A — usunąć pole z danych; B — ożywić je (silnik czyta pole zamiast hardkodu); C — zostawić z komentarzem.
Wstępna rekomendacja: **B** (dane sterują logiką, a nie hardkod po `id`), ale to nie pilne.

## PYTANIE 22 (szkic) — Wielka Kuźnia: niespójna kategoria przy awansie
Jedyny budynek, u którego mnożnik **działał**, bo jako jedyna kuźnia nie ma „+Wojsko" w polu `kategoria`. Skutek:
Kuźnia żelaza 0% efektu → po awansie Wielka Kuźnia +23% do Pracy. Wygląda na literówkę. Budynek jest epoki 4
(nieosiągalny w grze o 3 epokach) i nie ma `koszt_surowce` ani adnotacji „PARKOWANIE" (Lazaret ją miał).
Warianty: A — poprawić kategorię i dopisać adnotację parkowania; B — zostawić do czasu epoki klasycznej; C — usunąć.
Wstępna rekomendacja: **A**.

## PYTANIE 23 (szkic) — odznaki ulepszeń na żetonach jednostek
Decyzja 11A: jednostki mają nosić odznakę pokazującą poziom ulepszenia. Do rozstrzygnięcia szczegóły prezentacji:
ile poziomów widocznych, czy dwie ścieżki (pancerz 1–3 i parametry 1–3) mają osobne oznaczenia, czy odznaka ma być
na żetonie na mapie świata, na modelu w bitwie, czy w obu miejscach.

---

## PYTANIE 25 — awans budynku: zastąpienie czy rozbudowa · STATUS: OTWARTE

**Sytuacja.** Maciej (2026-07-25): „chciałbym widzieć w grze wybudowanych zarówno nowy upgrade jak i stary budynek…
Przecież nie usuwamy murów, zastępując je basztą, tylko po prostu mamy zarówno mur, jak i basztę."
Dziś awans **podmienia `id`** (`applyCompletedBuildingIds`, `production.ts:575`): miasto z Cytadelą ma wpis `fort`,
a wpisu `mury` już nie ma. Sześć łańcuchów: Mury→Cytadela, Pałac I→II→III, Biblioteka→Akademia,
Koszary→Akademia wojskowa, Kuźnia żelaza→Wielka Kuźnia, Spichlerz→kolejny tier.
**Pułapka:** samo zostawienie obu wpisów spowoduje podwójne liczenie wszędzie — mur 200% + Cytadela 300% = 500% obrony.

**A. Poprzednik zostaje w mieście naprawdę** — lista zawiera i `mury`, i `fort`; silnik wszędzie liczy tylko najwyższy szczebel.
- Za: model szczery — to, co widać na liście, miasto faktycznie ma.
- Za: otwiera osobne burzenie/uszkodzenie muru przy zachowaniu baszty.
- Przeciw: KAŻDE miejsce czytające listę budynków musi znać łańcuchy; przeoczenie = ciche podwójne liczenie.
- Przeciw: istniejące zapisy mają tylko następcę — trzeba migracji.

**B. Poprzednik pokazywany jako zawartość następcy** — silnik trzyma sam `fort`, UI po kliknięciu rozwija listę z łańcucha `upgradeFrom`.
- Za: ten sam efekt wizualny przy zerowym ryzyku podwójnego liczenia.
- Za: działa od razu dla wszystkich zapisów, bez migracji.
- Przeciw: to prezentacja, nie model — muru nie da się osobno zburzyć.
- Przeciw: lista pokaże budynki, których miasto formalnie nie ma.

**C. Budynek jako struktura złożona z części** — mur, baszta, brama jako osobne elementy jednego obiektu obronnego.
- Za: najbogatsze gameplayowo, otwiera wyłom w konkretnym elemencie.
- Za: najbliższe realiom fortyfikacji.
- Przeciw: przebudowa całego systemu budynków, produkcji, obrony i UI.
- Przeciw: mnoży decyzje gracza, zanim ogramy obecne oblężenia.

**REKOMENDACJA: B** — daje żądany efekt natychmiast i bez ryzyka; przejście B→A później jest łatwe, odwrotne już nie.

---

## PYTANIE 26 — Pałac III jest SŁABSZY od Pałacu II (realny błąd) · STATUS: OTWARTE

**Sytuacja.** Po przejściu na model liniowy (`baza + przyrost × (poziom−1)`) kultura Pałacu wychodzi tak:

| Tier | baza | przyrost | maks. poziom | Kultura wg epoki miasta |
|---|---|---|---|---|
| Pałac I | 5 | 3 | 3 | Kamień **5** · Brąz **8** · Żelazo **11** |
| Pałac II | 8 | 5 | 2 | Brąz **8** · Żelazo **13** |
| Pałac III | 11 | 7 | 1 | Żelazo **11** |

W epoce Żelaza: Pałac II daje **13**, a Pałac III — na który trzeba wydać 90 pracy, drewno, kamień i cegłę — daje **11**.
**Awans na najwyższy tier obniża kulturę.** To jest właśnie źródło niejasności „+3, +5, +7" — te liczby to przyrost
NA POZIOM wewnątrz tieru, a poziom rośnie sam z epoką miasta, więc tiery nachodzą na siebie.

**A. Wyzerować `przyrost` we wszystkich tierach Pałacu** — każdy tier ma jedną wartość: I=5, II=8, III=11.
- Za: „1 poziom = 1 epoka" staje się prawdą dosłowną — jeden tier, jedna liczba, zero nakładania.
- Za: awans zawsze opłacalny i czytelny: 5 → 8 → 11.
- Przeciw: Pałac I w epoce Żelaza (gdyby gracz nie awansował) daje tylko 5 zamiast 11 — kara za brak awansu.
- Przeciw: trzeba to zrobić dla wszystkich łańcuchów, nie tylko Pałacu.

**B. Podnieść bazę wyższych tierów tak, by zawsze wygrywały** — np. Pałac III baza 16 zamiast 11.
- Za: zachowuje wzrost wewnątrz tieru (budynek rośnie z epoką nawet bez awansu).
- Za: minimalna zmiana — trzy liczby.
- Przeciw: nakładanie tierów zostaje, tylko przesunięte — przy dokładaniu epok wróci ten sam problem.
- Przeciw: wartości trzeba przeliczać ręcznie przy każdej nowej epoce.

**C. Ograniczyć `maksPoziom` każdego tieru do 1** — tier nie rośnie sam, rośnie wyłącznie przez awans.
- Za: całkowicie usuwa nakładanie; jedna epoka = jeden tier = jedna wartość.
- Za: spójne z decyzją „nie projektujemy poziomów na zapas".
- Przeciw: budynek nie zyskuje nic z rozwoju miasta, dopóki gracz nie zapłaci za awans.
- Przeciw: pole `przyrost` staje się martwe dla całych łańcuchów — znów parametr bez efektu.

**REKOMENDACJA: C** — najczystsze i zgodne z zasadą „1 poziom = 1 epoka", którą sam ustaliłeś.

---

## PYTANIE 27 — czy Prawo z Pałacu ma rosnąć z tierem · STATUS: OTWARTE

**Sytuacja.** Prawo **już istnieje** jako pełny system (`society-breakdown.ts`: Szczęście + Prawo → Porządek; przy zbyt
niskim Porządku wybucha bunt). Pałac już jest jego głównym źródłem: **35 pkt** (łatwy 45 / trudny 28) — dla porównania
jedna jednostka garnizonu daje 20, a pięć jednostek to pełne 100%. Ale wartość jest **płaska**: Pałac I, II i III dają
identyczne 35. Skoro zadowolenie (2/3/5) znika z Pałacu, jego progresja przestaje być czymkolwiek odzwierciedlona.

**A. Prawo rośnie z tierem** — Pałac I 35, Pałac II 45, Pałac III 55 (proporcjonalnie do dawnej progresji 2/3/5).
- Za: awans Pałacu wreszcie coś daje poza kulturą.
- Za: odzwierciedla to, co robi prawdziwy pałac — rozbudowana administracja lepiej trzyma porządek.
- Przeciw: Pałac już dziś daje 1,75× garnizonu; 55 pkt to prawie trzy jednostki wojska za darmo.
- Przeciw: może wyłączyć potrzebę trzymania garnizonu w stolicy.

**B. Zostawić płaskie 35** — Pałac daje Prawo niezależnie od tieru, progresja idzie tylko przez kulturę.
- Za: zero ryzyka rozregulowania Porządku, który jest już zbalansowany.
- Za: prostsze — jedna liczba, jedna reguła.
- Przeciw: awans Pałacu daje wtedy tylko kulturę; przy 90 pracy to chuda oferta.
- Przeciw: Twoja intencja („Pałac ma zwiększać Prawo") realizuje się tylko połowicznie.

**C. Prawo rośnie z tierem, ale łagodnie** — 35 / 40 / 45.
- Za: awans widocznie się opłaca, a garnizon dalej ma sens.
- Za: mieści się w istniejącej skali (100% = 5 jednostek).
- Przeciw: różnica 5 pkt może być dla gracza niezauważalna.
- Przeciw: dalej trzeba przetestować wpływ na bunty w stolicy.

**REKOMENDACJA: C** — awans coś daje, a zbalansowany system Porządku nie wywraca się.

---

## PYTANIE 28 — Prawo z Pretorium na poziomie trudnym · STATUS: OTWARTE

**Sytuacja.** Prosiłeś, żeby bonus Prawa z Pretorium był „co najmniej pięć". W danych już jest:
**łatwy 6 · normalny 5 · trudny 3**. Czyli na normalnym poziomie warunek jest spełniony, ale na trudnym wynosi 3.

**A. Podnieść trudny do 5** — wartości 6 / 5 / 5.
- Za: warunek „co najmniej pięć" spełniony na każdym poziomie trudności.
- Za: Pretorium staje się realną alternatywą dla garnizonu tam, gdzie jest najtrudniej.
- Przeciw: łamie konwencję całego pliku — na trudnym wszystkie bonusy są niższe.
- Przeciw: osłabia poziom trudny w miejscu, które ma być trudne.

**B. Zostawić 6 / 5 / 3** — „co najmniej pięć" rozumiane jako wartość na poziomie normalnym.
- Za: spójne z całym `society-params.json`, gdzie trudny zawsze daje mniej.
- Za: zero ryzyka dla balansu poziomu trudnego.
- Przeciw: na trudnym Pretorium daje mniej, niż prosiłeś.
- Przeciw: różnica 5 → 3 to spadek o 40%, więc na trudnym budynek robi się mało atrakcyjny.

**C. Podnieść całą skalę** — 8 / 6 / 5.
- Za: warunek spełniony wszędzie, konwencja „trudny daje mniej" zachowana.
- Za: Pretorium zyskuje wyraźną tożsamość jako budynek porządku.
- Przeciw: na łatwym 8 pkt to już blisko połowy jednostki garnizonu za darmo.
- Przeciw: trzeba przetestować, czy nie znika presja na trzymanie wojska w mieście.

**REKOMENDACJA: C** — spełnia Twój warunek na każdym poziomie i nie łamie konwencji pliku.
