# PYTANIA OTWARTE — czekają na decyzję Macieja
Aktualizacja: 2026-07-25. Numeracja ciągła z `REJESTR-PROSB-I-ZADAN.md` (1–17 odpowiedziane).
Zasada: każde pytanie w pełnej formie ABC (opis + min. 2 za + min. 2 przeciw + rekomendacja), zawsze z numerem.

---

## PYTANIE 18 — profil Pretorium po sprzątnięciu · STATUS: **ODPOWIEDZIANE 2026-07-25**

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

**ODPOWIEDŹ MACIEJA (2026-07-25):** Pretorium dostaje **Kultura: 5 pkt/turę** (nowy bonus — budynek to „pałac
zamiejscowy", ma dawać Kulturę jak Pałac); pola `obrona` i `mnoznik` wyzerowane (spójnie z decyzją 16A i decyzją
6 o Pretorium-jak-Pałac). To inne rozwiązanie niż warianty A/B/C wyżej (żaden nie proponował Kultury) —
pełny zapis i uwaga o niedoprecyzowanych `Praca`/`Pieniądz`/`Zadowolenie` w
`dyspozycje/DECYZJE-BUDYNKI-2026-07-25.md` §8. **Status wdrożenia:** decyzja zapisana, NIE wdrożona w kodzie.

---

## PYTANIE 19 — utrzymanie budynków: zróżnicowane czy płaskie? · STATUS: **ODPOWIEDZIANE 2026-07-25 = A**

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

**ODPOWIEDŹ MACIEJA (2026-07-25):** **A** — utrzymanie budynków ma być zróżnicowane per budynek (z danych),
nie płaska stawka. Zapisane jako osobne zadanie ekonomiczne (z testem) w
`dyspozycje/DECYZJE-BUDYNKI-2026-07-25.md` §8. **Status wdrożenia:** decyzja zapisana, NIE wdrożona w kodzie —
silnik dziś nadal czyta wyłącznie płaską stawkę `utrzymanie_budynek` (`economy-upkeep.ts:511`).

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

## PYTANIE 25 — awans budynku: zastąpienie czy rozbudowa · STATUS: **ODPOWIEDZIANE 2026-07-25 = B, per łańcuch**

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

**ODPOWIEDŹ MACIEJA (2026-07-25):** **wariant B, ale rozstrzygnięty per łańcuch, nie jedną regułą dla
wszystkich budynków.** Łańcuchy „w górę" (następca kasuje poprzednika, wariant B — UI rozwija po kliknięciu):
Pałac I→II→III · Dom Starszyzny→Dwór Zarządcy→Pretorium · Kuźnia brązu→Kuźnia żelaza→Wielka Kuźnia ·
Spichlerz→Spichlerz II · Port handlowy→Port wielki · Piec hutniczy→Odlewnia żelaza. Łańcuchy „w bok" (oba
budynki stoją obok siebie naprawdę — to bliżej wariantu A, ale bez ryzyka podwójnego liczenia, bo to inne
budynki z innymi rolami, nie ten sam bonus liczony dwa razy): Mury+Cytadela+Baszta · Biblioteka+Akademia ·
Koszary+Akademia wojskowa · Kamienne kręgi+Świątynia. Pełny zapis:
`dyspozycje/DECYZJE-BUDYNKI-2026-07-25.md` §1. **Status wdrożenia:** decyzja zapisana, NIE wdrożona w kodzie.

---

## PYTANIE 26 — Pałac III jest SŁABSZY od Pałacu II · STATUS: **ODPOWIEDZIANE = B** (podnieść bazy wyższych tierów)

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

**DOPRECYZOWANIE (2026-07-25, po decyzji Pytania 25):** odpowiedź B („podnieść bazy wyższych tierów") łączy się
z regułą z Pytania 25 — budynek, który MA następcę w łańcuchu (np. Pałac I, mając Pałac II), ma **stałą wartość
per tier** i nie rośnie sam z epoką; rośnie WYŁĄCZNIE budynek na końcu łańcucha (dziś: Pałac III, bo epoki 4+
jeszcze nie ma). To jest mechanizm, który sprawia, że „podniesienie bazy wyższych tierów" faktycznie rozwiązuje
problem nachodzenia — nie ma już efektu „Pałac I dogania Pałac III samym upływem epok". Pełny zapis:
`dyspozycje/DECYZJE-BUDYNKI-2026-07-25.md` §1.

---

## PYTANIE 27 — czy Prawo z Pałacu ma rosnąć z tierem · STATUS: **ODPOWIEDZIANE = A** (35 / 45 / 55)

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

## PYTANIE 28 — Prawo z Pretorium · STATUS: **ODPOWIEDZIANE = 70% Pałacu III** (50 / 38 / 31)

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


---

# ODPOWIEDZI MACIEJA 2026-07-25 (pytania 38-41)

## PYTANIE 38 = **A** — Kamienne kręgi i Stela zostają na kamieniu
Wyjątek od zasady „epoka Kamienia = wyłącznie drewno". Kamienne kręgi 8 szt. kamienia, Stela/Pomnik 6 szt. kamienia.
Powód: nazwa i sens obu budowli to dosłownie kamień — warunek zgodności historycznej.
**Stan: już tak zapisane w `SPEC-KOSZTY-SUROWCOWE-BUDYNKOW.md`, nic nie trzeba zmieniać.**

## PYTANIE 39 = **A** — parametry Domu Starszyzny i Dworu Zarządcy zatwierdzone
| Parametr | Dom Starszyzny | Dwór Zarządcy |
|---|---|---|
| Kultura | 2 pkt/turę | 3 pkt/turę |
| Praca | 1 pkt/turę | 1 pkt/turę |
| Pieniądz | 1 pkt/turę | 2 pkt/turę |
| Koszt budowy | 25 pkt Pracy | 45 pkt Pracy |
| Utrzymanie | 1 pieniądz/turę | 2 pieniądze/turę |
| Prawo (łatwy/normalny/trudny) | 36 / 28 / 22 | 43 / 33 / 26 |
**Stan: już wdrożone, nic nie trzeba zmieniać.**

## PYTANIE 40 = **B** — cegła wchodzi do wymiany na szlakach handlowych
Maciej: „warto już glinę wcześniej produkować przed wejściem do żelaza i być gotowym".
Cegła dołącza do `TRADE_ROUTE_RESOURCE_KEYS` obok brązu, żelaza i koni (`gra/src/game/trade-routes.ts:836`).
Miasto bez złoża gliny przestaje być odcięte od budynków epoki Żelaza — brak gliny staje się problemem
do rozwiązania dyplomacją i handlem, a nie wyrokiem przy losowaniu mapy.
Cegielnia jest budynkiem epoki Brązu, więc gracz może produkować cegłę z wyprzedzeniem, zanim wejdzie w Żelazo.
**DO WDROŻENIA.**

## PYTANIE 41 = **B, bonus +100% Obrony** — trzeci budynek obronny w epoce Żelaza
Trzeci budynek obronny miasta, **dokładany** obok Murów i Cytadeli (nie zastępuje ich).
Obrona miasta narasta: Mury +200% → Cytadela +100% → nowy budynek +100% = **łącznie +400%**.
Nazwa **ZATWIERDZONA przez Macieja**: **Baszta** („mury, cytadela i baszta może być") — w epoce Żelaza mury najeżone wieżami to standard
hellenistyczny i rzymski (`turres`), więc nazwa jest historycznie trafna i nie myli się z Fortem terenowym.
Uwaga: identyfikator Cytadeli w danych to `fort`, a osobny **Fort terenowy** to ulepszenie mapy stawiane
robotnikiem — te trzy rzeczy trzeba trzymać rozdzielnie.
**DO WDROŻENIA.**


## NAZWA ZATWIERDZONA (Maciej 2026-07-25)
Łańcuch obronny miasta: **Mury → Cytadela → Baszta**, wszystkie trzy stoją obok siebie (dokładane, nie zastępowane).
Obrona miasta: Mury +200% → Cytadela +100% → Baszta +100% = **łącznie +400%**.

---

# ODPOWIEDZI MACIEJA 2026-07-25 (pytania 42-49)

**42 = A** — Odlewnia żelaza: Praca 8 → **12 pkt/turę**. Awans ma się opłacać sam z siebie, nie tylko przez dostęp do żelaza.

**43 = bez zmian w plonach.** Maciej: „najważniejszym parametrem Spichlerza II jest obniżenie progu awansu na kolejny
poziom z 50% na 30%, czyli 70% żywności nadal zostaje — więc te parametry mogą zostać tak jak są".
→ Żywność 4 i Zadowolenie 2 zostają. **DO SPRAWDZENIA:** czy bufor 70% po wzroście populacji faktycznie działa
(`uwagi` Spichlerza II mówią „bufor 70% po wzroście" — trzeba potwierdzić w kodzie, że nie jest to kolejna martwa obietnica).

**44 = usunąć Ratusz całkowicie.** Maciej: „Ratusz będzie kolejnym etapem rozwoju budynków po Pretorium, ale dopiero
w średniowieczu, także możemy stąd usunąć całkowicie o nim wzmianki".
→ Usunąć `prawo_ratusz` z `society-params.json`, flagę `hasRatusz` z `society-breakdown.ts`, wzmianki w `cityPanel.ts`
(podpowiedzi „Ratusz, Pretorium, Sąd → trwały plus do Prawa") i w dokumentacji. Zapisać na przyszłość: Ratusz = szczebel
po Pretorium w epoce średniowiecza.

**45 = B** — Stela / Pomnik zostaje z utrzymaniem **0**. Pomnik nie wymaga obsługi.

**46 = A** — statystyki Łucznika nubijskiego zatwierdzone (koszt 20 pieniądza, utrzymanie 2, atak 4, uderzenie 2,
obrona 6, pancerz 2, przebicie 2, morale 85, plus podane przez właściciela: zasięg 5, atak dystansowy 7, 16 pocisków,
50 zdrowia, ruch 3).

**47 = B** — pre-istniejące porażki testów sprzątamy jednym przejściem PO domknięciu budynków.

**48 = A** — deploy do wersji roboczej dopiero po naprawie plonów budynków i po grupowaniu, w komplecie.

**49 = A** — dedykowany model 3D Łucznika nubijskiego **do zrobienia teraz**.

---

# KOREKTA 2026-07-25 — bramki surowcowe budynków ZOSTAJĄ

**Błąd Claude, skorygowany przez Macieja.** Z wypowiedzi „większość budynków nie potrzebuje dostępu do surowca,
tylko musi mieć surowce w magazynie" wyciągnąłem wniosek, że należy zdjąć bramkę dostępu z pięciu budynków
przetwórczych. **To było błędne.** Maciej: „Stolarnia, warsztat kamieniarski, kuźnia brązu, garncarnia i cegielnia
potrzebują surowców w terenie, mieć do nich dostęp — czyli najpierw muszą się pojawić ulepszenia, a dopiero można
budować ten budynek. To było jak najbardziej prawidłowe."

**Obowiązująca zasada — trzy różne rzeczy, których nie wolno mylić:**
1. **Koszt budowy** (`koszt_surowce`) — materiał pobierany z magazynu cywilizacji. Dotyczy każdego budynku
   i to właśnie o nim mówił Maciej („musi mieć surowce w magazynie").
2. **Bramka dostępu do surowca w terenie** (`DEPOSIT_LINKED_BUILDING_LABELS`) — dotyczy **zakładów przetwórczych**,
   które bez źródła nie mają czego przerabiać. **ZOSTAJE BEZ ZMIAN:** Stolarnia → Drewno · Warsztat kamieniarski →
   Kamień · Kuźnia brązu → Ruda · Garncarnia → Glina · Cegielnia → Glina · Spichlerz → Ceramika · Spichlerz II → Sól.
3. **Bramka `wymaganySurowiec`** w danych — Kuźnia żelaza → żelazo, Wielka Kuźnia → stal. **ZOSTAJE** (odpowiedź A).

**PYTANIE 50 = A** (Maciej 2026-07-25): bramki dostępu przy obu kuźniach i obu spichlerzach zostają nietknięte.
Uzasadnienie: budynki epoki Żelaza płacą drewnem i cegłą, więc bez tej bramki kuźnię żelaza dałoby się postawić
w cywilizacji, która żelaza nigdy nie widziała.

**Konie** — bramka dotyczy wyłącznie jednostek, żadnego budynku; bez zmian.

## REGRESJA Z DZIŚ — przywracany wymóg kolejności budowania
Usunięcie `upgradeFrom` z czterech par („likwidacja awansu bocznego") skasowało przy okazji wymóg,
że poprzednik musi stać w mieście. Maciej: „musi być budowana najpierw biblioteka, a potem Akademia,
i to trzeba stosować dla wszystkich budynków, które miały awans boczny."
→ Do `CITY_BUILDING_PREREQ` dopisywane: `akademia`←`biblioteka` · `fort`←`mury` ·
`akademia_wojskowa`←`koszary` · `swiatynia`←`kamienne_kregi`.

---

# ODPOWIEDZI MACIEJA 2026-07-25 (pytania 51-62)

**51 = A** — Targowisko: Pieniądz 3 → **5 pkt/turę**, przyrost 2 → 3.
**52 = A** — Targowisko zachowuje **+50% do Handlu brutto** bez zmian.
**53 = B** — szlaki handlowe mają przesyłać **ilość** surowca, nie sam dostęp. WDRAŻANE.
**54a = A** — Baszta wymaga Murów w tym samym mieście.
**54b = A** — Akwedukt wymaga Studni w tym samym mieście.
**54c = A** — Mennica wymaga Targowiska w tym samym mieście.
**55 = B** — pole `odblokowuje` **ożywić**: kod ma czytać flagi z danych zamiast z hardkodu `id === 'mury'`.
**56 = B** — Wielka Kuźnia: kategoria i adnotacja o parkowaniu zostają do czasu budowy epoki klasycznej.
**57 = A + B** — odznaki ulepszeń jednostek: **kropki przy żetonie ORAZ kolorowa obwódka**.
**58 = A** — Biblioteka (i Akademia) mnożą własny plon Nauki; zostaje bez zmian.
**59 = B + Pałac** — Sąd, Pretorium **i Pałac** redukują korupcję, **każdy o 30%**.
  DO POTWIERDZENIA: kumulacja mnożna (3 budynki → ok. 34% korupcji zostaje) czy odejmowanie (30+30+30 = 90%).
**60 = A** — bufor 70% żywności Spichlerza II: sprawdzić i naprawić, jeśli nie działa.
**61 = A** — cały martwy kod usunięty jednym przejściem.
**62 = C, potem A** — najpierw audyt klasyfikujący porażki testów, potem naprawa wszystkich.

## PYTANIE 63 = **modyfikacja generatora, nie testu** (Maciej 2026-07-25)
> „Musimy zmodyfikować to podejście i nie generować wielkich pasm górskich, ewentualnie mniejsze. Przyjmijmy,
> że w jednym skupisku nie może być więcej niż **10 gór oraz 10 wzgórz** przylegających do siebie. Tak, żeby
> komputer miał możliwość bardziej równomiernie rozłożyć pasma górskie, żeby **wszystkie cywilizacje miały
> dostęp do gór**. Bo potem wiemy, że to może tworzyć problemy z dostępem do rud: miedzi, żelaza i złota."

**To odwraca kierunek naprawy.** Audyt zaklasyfikował 4 porażki `fair-play-grid-test` jako „nieaktualny test"
(limit sprzed decyzji HILLS-Q1 o pasmach górskich, 2026-07-20). Właściciel rozstrzygnął odwrotnie: **test miał rację
co do zasady, to generator ma się dostosować.** Powód jest gameplayowy, nie estetyczny — wielkie pasma zabierają
całym cywilizacjom dostęp do rudy, miedzi, żelaza i (od dziś) złota.

**Do wdrożenia:** twardy limit **10 heksów gór** i **10 heksów wzgórz** w jednym **spójnym skupisku**
(przylegające do siebie), w `growMountainRanges` / `ensureReliefGridCoverage` w `gra/src/map/gen-helpers.ts`.
Determinizm generatora (`map-gen-regression-test`: hash A=B, 0 rzek bez ujścia) jest bramką.
**Uwaga metodologiczna:** `fair-play-grid-test` mierzy maksimum **w komórce siatki**, a limit właściciela dotyczy
**spójnego skupiska** — to dwie różne metryki. Limit 10 na skupisko nie gwarantuje automatycznie przejścia testu,
jeśli kilka skupisk wpadnie do jednej komórki. Trzeba zmierzyć obie liczby i zameldować.

**STATUS: zlecenie wstrzymane** — `gen-helpers.ts` trzyma subagent wprowadzający złoto. Start natychmiast po nim.

---

# ODPOWIEDZI MACIEJA 2026-07-25 (pytania 73-77) — runda „domknięcie ekonomii"

## PYTANIE 73 — korupcja · ODPOWIEDŹ: **A + dwa doprecyzowania**
Właściciel zwrócił uwagę, że **pytanie było zbędne — korupcję rozstrzygnął już decyzją 59**
(„Sąd, Pretorium i Pałac redukują korupcję, każdy o 30%"). Jego słowa: *„nie pytaj mnie drugi raz o rzeczy,
gdzie już decydowałem… A to, co już decydowałem, odpalaj subagenta i nad tym pracuj."*
**Zasada na przyszłość: przed zadaniem pytania ABC przeszukaj `PYTANIA-OTWARTE.md`, `REJESTR-PROSB-I-ZADAN.md`
i `DECYZJE-*.md` pod kątem istniejącej decyzji. Pytanie zadane drugi raz to błąd, nie ostrożność.**

Dwa nowe rozstrzygnięcia właściciela z tej rundy:
1. **Korupcja obciąża WYŁĄCZNIE Daninę (po Walucie i Mennicy: Podatek), NIE Pracę.**
   Cytat: *„Korupcja ma dotykać tylko i wyłącznie daniny, a potem podatku, nie pracy."*
2. **Oba współczynniki korupcji obniżone o 50%** — *„zbyt rygorystyczne… mają mieć wpływ, ale nie być druzgocące"*:

| Parametr | jednostka | było (easy/normal/hard) | jest (easy/normal/hard) |
|---|---|---|---|
| Korupcja — współczynnik dystansu | punkty procentowe straty Daniny na każde pole odległości od stolicy | 1 / 2 / 3 | **0,5 / 1 / 1,5** |
| Korupcja — współczynnik liczby miast | punkty procentowe straty Daniny na każde miasto właściciela | 1 / 1 / 2 | **0,5 / 0,5 / 1** |
| Korupcja — sufit straty | % maksymalnej straty Daniny w jednym mieście | 38 / 50 / 62 | **bez zmian** (właściciel obniżył „współczynniki", sufitu nie wymieniał) |

**Sufit stał się praktycznie nieosiągalny** — na normalnym wymaga `Dystans + 0,5 × Liczba_Miast ≥ 50`.

**Doprecyzowanie decyzji 59 (bez pytania właściciela — wynika z danych):** redukcja jest **addytywna**
(`strata × (1 − suma_redukcji)`), a naturalny sufit to **0,60, nie 0,90** — bo `palac` ma `lokalizacja: "stolica"`,
a `pretorium` ma `lokalizacja: "region"`, więc **żadne miasto nie może mieć obu naraz**. Maksimum w jednym
mieście to Sąd + Pałac (stolica) albo Sąd + Pretorium (region).

## PYTANIE 74 = **A** — domyślny podział Daniny w nowym mieście: **20% Nauka / 60% Skarbiec / 20% Zamożność**
Było 20 / 70 / 10. Powód: 20% Zamożności to dokładnie **próg utrzymania poziomu Zamożności** (20% pieniądza
miasta przy poziomie 0), więc poziom rusza z miejsca bez ręcznej interwencji; w nowej siatce Szczęścia przedział
20–29% daje **+1 pkt Szczęścia na normalnym i 0 na trudnym** zamiast 0 / −1 przy dawnych 10%.
**WDROŻONE w `gra/data/econ-params.json`.**

## PYTANIE 75 = **C** — premia do Nauki: **Biblioteka +30%, Akademia +20%**, obie skalowane trudnością
Powód: dane przeczyły decyzji 4. Dotąd **tańsza i wcześniejsza Biblioteka dawała pięciokrotnie więcej niż
droższa Akademia** (+50% vs +10%) — logika była odwrócona. Akademia dodatkowo jako jedyna nie skalowała się
trudnością.

| Parametr | jednostka | było (easy/normal/hard) | jest (easy/normal/hard) |
|---|---|---|---|
| Premia Biblioteki do Nauki miasta | ułamek (0,30 = +30% Nauki miasta na turę) | 0,62 / 0,50 / 0,38 | **0,37 / 0,30 / 0,23** |
| Premia Akademii do Nauki miasta | ułamek (0,20 = +20% Nauki miasta na turę) | 0,10 / 0,10 / 0,10 | **0,25 / 0,20 / 0,15** |

Stackują **addytywnie** (para „w bok" — stoją obok siebie): łącznie **×1,62 easy / ×1,50 normal / ×1,38 hard**
(było ×1,72 / ×1,60 / ×1,48). **WDROŻONE w `gra/data/econ-params.json`.**

## PYTANIE 76 = **B** — Pieniądz z zamiany Pracy wchodzi **w całości do puli Daniny/Podatku**
Targowisko po odkryciu Waluty zamienia pulę Pracy na Pieniądz (**mnożnik konwersji Pracy na Pieniądz** = ×2,0,
jednakowy na wszystkich poziomach trudności). Dotąd trafiał **wprost do skarbca, z pominięciem suwaka** — ten sam
błąd, który właściciel wytknął przy budynkach (67B). Teraz wchodzi do puli i dzieli się suwakiem na
Naukę / Skarbiec / Zamożność.
**KOREKTA WŁAŚCICIELA (Maciej, 2026-07-25, ta sama sesja).** Moje pierwsze doprecyzowanie było BŁĘDNE — napisałem,
że strumień nie podlega mnożnikowi Waluty i Mennicy. Właściciel poprawił:
> „Pieniądz z konwersji pracy wchodzi do daniny, później do podatku i **jest potem mnożony przez walutę i mennicę
> i wszystkie inne wskaźniki handlu**. Dlatego, że po prostu wystawiamy tę pracę na handel. Zamieniamy na twardą
> walutę, więc to jest po prostu, zwyczajnie zamiast pracy zmieniamy to na równowartość podatku."

**Obowiązująca zasada:** to NIE jest osobny strumień doklejony do puli — to Praca **wystawiona na handel**
i zamieniona na równowartość Daniny. Wchodzi do `handelBrutto` **u źródła**, zanim zadziała którykolwiek mnożnik,
więc obejmuje go **wszystko**, co mnoży Daninę: premia Targowiska do Handlu brutto, mnożnik cywilizacji
`civHandelMult`, premia +5% za każdą aktywną trasę handlową, **korupcja**, **mnożnik Waluty i Mennicy**
(×2,0 easy / ×1,5 normal / ×1,0 hard), a dopiero na końcu podział suwakiem.

**Lekcja proceduralna:** przy niejednoznaczności dotyczącej ekonomii nie przyjmuj założenia „to by dublowało premię"
— to była moja nadinterpretacja. Konwersja Pracy na Pieniądz jest sprzedażą pracy, nie premią budynku.

## PYTANIE 77 = **A** — złoto wchodzi na szlaki handlowe jako surowiec typu **„dostęp"**
Jak koń: szlak z posiadaczem złota **odblokowuje budowę Mennicy, bez przepływu sztuk do magazynu**
(złoto NIE wchodzi do `TRADE_ROUTE_STOCK_FLOW_KEYS`).
Powód: bez tego cywilizacja bez złoża złota w zasięgu **nigdy nie zbuduje Mennicy, nigdy nie dostanie mnożnika
Daniny i nigdy nie wejdzie w etap Podatku** — do końca partii, tak samo gracz jak AI. Złoże złota ma rzadkość
3% pól kwalifikujących się (tylko Góry i Wzgórza) i celowo **nie jest** na liście `FAIR_PLAY_DEPOSIT_IDS`.
To ta sama pułapka, którą właściciel rozstrzygnął dla cegły decyzją 53B.
**DO POTWIERDZENIA przez właściciela:** przyjęto roboczo, że **zerwanie szlaku nie burzy już zbudowanej Mennicy**
— blokuje tylko budowę nowej.

## DECYZJA 78 — system weteranów (Maciej 2026-07-25), wdrażana
> „Jednostka, która wchodzi do walki ma statystyki tak jak w JSON-ach. Po pierwszej bitwie ma drugi poziom
> doświadczenia, po drugiej bitwie ma status weterana. Druga gwiazdka daje 10% do wszystkich statystyk oprócz
> armor. Trzecia gwiazdka weterana daje 20% do wszystkich statystyk poza armor. **To będzie trzeci system**
> do tych, które już daliśmy."

| Poziom | Kiedy | Premia |
|---|---|---|
| 1 — rekrut | jednostka nowo wyprodukowana | statystyki dokładnie jak w `gra/data/units.json`, zero modyfikacji |
| 2 — druga gwiazdka | po przeżyciu **1. bitwy** | **+10%** do statystyk bojowych, **oprócz pancerza** |
| 3 — weteran (trzecia gwiazdka) | po przeżyciu **2. bitwy** | **+20%** do statystyk bojowych, **oprócz pancerza** |

**Premie NIE kumulują się** — poziom 3 to +20% względem bazy z JSON-a, nie +30% i nie ×1,1×1,2. Poziom 3 jest
maksymalny; dalsze bitwy nie dają nic (zasada „nie projektujemy na zapas").

**DOPRECYZOWANIE WŁAŚCICIELA — statystyki odwrócone (najważniejsza część efektu).** Zaproponowałem, żeby pominąć
`Morale ucieczki` i `Próg dezercji (% health)`, bo są odwrócone (wyższa wartość = gorzej). Maciej odrzucił:
> „Akurat właśnie poziom weterana powinien wpływać na **morale ucieczki, próg dezercji**, bo to jest najważniejsze."

Więc premia je **obniża**: poziom 2 = baza × 0,90, poziom 3 = baza × 0,80. `Morale bazowe` (wyższe = lepiej) idzie
w drugą stronę: × 1,10 i × 1,20. Sens: doświadczony żołnierz się nie łamie i nie ucieka z pola bitwy.

**Wyłączony wprost przez właściciela:** `armor` / `Pancerz` — bez premii na żadnym poziomie.

**„Bitwa" = jedno rozstrzygnięte starcie, w którym jednostka brała udział i które przeżyła**, liczone raz na bitwę
(nie raz na turę walki, nie raz na cios). Obejmuje starcie na mapie, bitwę na polu bitwy i szturm oblężniczy.

**PARYTET AI** — identycznie dla gracza i AI, bez warunków na `ownerId`. Poziom musi przetrwać zapis i wczytanie
partii; stary zapis bez tego pola daje poziom 1, bez błędu.

**Niezależność:** to TRZECI system, obok dwóch ścieżek ulepszeń z budynków (pancerz + parametry miękkie). Premia
weterana liczona zawsze od bazy z JSON-a, żeby systemy się nie mieszały. Gwiazdki weterana muszą być wizualnie
odróżnialne od odznak ulepszeń budynkowych (decyzja 57: kropki przy żetonie + kolorowa obwódka).

## PYTANIE 79 = **A** — sufit korupcji BEZ ZMIAN (Maciej 2026-07-25)
Sufit zostaje **38% easy / 50% normal / 62% hard** maksymalnej straty Daniny w jednym mieście, mimo że oba
współczynniki korupcji zostały obniżone o 50%.

**Uzasadnienie:** sufit to **bezpiecznik**, a nie pokrętło siły korupcji — regulatorem są współczynniki.
Obniżenie sufitu spłaszczyłoby karę za odległość (miasto 25 pól i miasto 45 pól od stolicy traciłyby tyle samo),
czyli osłabiłoby dokładnie to, po co korupcja istnieje.

**Skutek praktyczny:** po obniżce współczynników sufit jest w normalnej rozgrywce nieosiągalny — na normalnym
wymaga `Dystans [pola] + 0,5 × Liczba_miast ≥ 50`. Realistyczne duże imperium (12 miast, miasto 25 pól od stolicy)
daje `25 + 6 = 31%` straty Daniny. **To świadomy wybór właściciela, NIE martwy parametr do sprzątnięcia.**

---

# LEKCJA PROCEDURALNA (Maciej 2026-07-25, upomnienie powtórzone)
> „Znowu zadajesz mi pytania, nie numerujesz ich i nie robisz w sposób ABC. Muszę wiecznie Cię upominać."

**KAŻDE pytanie do właściciela — także jednozdaniowe, także „przy okazji", także rzucone na końcu raportu —
musi mieć NUMER i PEŁNĄ FORMĘ ABC** (nagłówek `[TEMAT: …]` + ID + Sytuacja + Cel pytania + Dlaczego teraz +
A/B/C z co najmniej dwoma „za" i dwoma „przeciw" + Rekomendacja + formularz Ask na końcu).
**Nie istnieje kategoria „drobne pytanie poza formą".** Zdanie w rodzaju „powiedz, jeśli ma być inaczej"
jest pytaniem i łamie zasadę.

---

## PYTANIE 84 (szkic, zapisane 2026-07-26) — czy inne budynki też mają zasypiać bez surowca?
**STATUS: OTWARTE — czeka na decyzję ABC. Uwaga Macieja, zapisana zanim zdążyliśmy ją rozwinąć.**

> „Mamy chyba więcej budynków takich, które wymagają surowca do działania. Na przykład gliny i innych.
> Teoretycznie też nie powinny działać w sytuacji, gdy nie mają dostępu. Chyba że działają na tym,
> co mają skumulowane w magazynie."

**Kontekst.** Decyzją 83B **Mennica zasypia** po utracie dostępu do złota — mnożnik znika, budynek zostaje
i budzi się sam. Maciej zauważa, że to nie jest wyjątek: podobnych budynków jest więcej.

**Stan dzisiejszy — w grze istnieją TRZY różne rodzaje bramek surowcowych i tylko jedna z nich działa
po zbudowaniu:**

| Rodzaj bramki | Gdzie w kodzie | Kiedy sprawdzana |
|---|---|---|
| **Dostęp do złoża w terenie** (Stolarnia→Drewno, Warsztat kamieniarski→Kamień, Kuźnia→Ruda, Garncarnia i Cegielnia→Glina, Spichlerz→Ceramika, Spichlerz II→Sól, Mennica→Złoto) | `DEPOSIT_LINKED_BUILDING_LABELS` w `building-resource-gate.ts` | **tylko przy budowie** — poza Mennicą |
| **Wymagany wcześniejszy budynek** | `CITY_BUILDING_PREREQ` | tylko przy budowie |
| **Surowce w magazynie** (`koszt_surowce`) | dane budynku | jednorazowo, przy budowie |
| **Dostęp do złota — DZIAŁANIE** | `zloto-access.ts` + `turn-economy.ts` | **co turę** (decyzja 83B) |

Czyli dziś **tylko Mennica** ma bramkę działania. Pozostałe sześć budynków po zbudowaniu pracuje
w nieskończoność, nawet jeśli cywilizacja straci dostęp do złoża, na którym powstały.

**Do rozstrzygnięcia — trzy warianty, do rozpisania w pełnej formie ABC:**
- **A — jak Mennica:** utrata dostępu usypia budynek (plon 0 albo zmniejszony), odzyskanie budzi.
- **B — praca z magazynu:** budynek działa dopóki ma surowiec w magazynie miasta, zużywając go co turę;
  po wyczerpaniu zasypia. To wariant, który Maciej wprost dopuścił („chyba że działają na tym, co mają
  skumulowane"). **Wymaga rozstrzygnięcia, ile sztuk na turę zużywa każdy budynek** — dziś taki parametr
  nie istnieje.
- **C — zostaje jak jest:** dostęp to warunek budowy, nie działania; Mennica pozostaje świadomym wyjątkiem
  ze względu na siłę mnożnika.

**Uwaga projektowa:** wariant B jest najciekawszy gospodarczo, ale to **nowy mechanizm zużycia surowców
na turę**, którego silnik dziś nie ma — nie mylić z jednorazowym `koszt_surowce` przy budowie.
Wariant A jest najtańszy we wdrożeniu, bo powiela gotowy wzorzec z 83B (`OwnerZlotoAccessResolver`).

**Kto to prowadzi:** temat przekazany przez Macieja do innej sesji/agenta razem z paczką prac
(karta Mennicy v2, mockupy badań i miast, dyplomacja, lokalizacja, muzyka, wiarygodność cywilizacji).
Ten wpis istnieje po to, żeby uwaga nie zginęła w czacie.
