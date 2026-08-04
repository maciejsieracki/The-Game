# PYTANIA OTWARTE — czekają na decyzję Macieja
Aktualizacja: 2026-08-04. Numeracja ciągła z `REJESTR-PROSB-I-ZADAN.md`.
Zasada: każde pytanie w pełnej formie ABC (opis + min. 2 za + min. 2 przeciw + rekomendacja), zawsze z numerem.

## ⛔ Obieg (Maciej 2026-08-03)
Nowy case → **ID w REJESTR-PROSB** + wpis tu (jeśli ABC) → agent **proponuje, nie koduje** → Maciej: **`ID + A|B|C`** → commit → **`deploy`** osobno.
Kanon: [`PROCEDURA-NUMER-ABC-COMMIT-DEPLOY.md`](PROCEDURA-NUMER-ABC-COMMIT-DEPLOY.md).

---

## R-PILL-TARCZA-BEZ-MURU — szara tarcza bez muru na heksie · STATUS: **WDROŻONE (kod)** Q1=A (2026-08-04)

**ECHO:** `R-PILL-TARCZA-BEZ-MURU-Q1 A` — tier wyłącznie z `wallKind` (= model 3D).  
Szczegóły: [`docs/decyzje/R-PILL-TARCZA-BEZ-MURU.md`](../docs/decyzje/R-PILL-TARCZA-BEZ-MURU.md). Bramki: tsc 0 · city-map-badge 19/19. Czeka **`deploy`**.

---

## R-BUDOWA-ZROWNOWAZONE-TRYB — zrównoważony ≠ priorytet typów · STATUS: **WDROŻONE (kod)** Q1=A (2026-08-04)

**ECHO Maciej:** `R-BUDOWA-ZROWNOWAZONE-TRYB-Q1 A` — osobny tryb auto „Zrównoważony” (5 chipów typów z numerami + osobny przełącznik).

Szczegóły: [`docs/decyzje/R-BUDOWA-ZROWNOWAZONE-TRYB.md`](../docs/decyzje/R-BUDOWA-ZROWNOWAZONE-TRYB.md). Czeka **`deploy`**.

---

## R-NADMIAR-POOLS — FALA2 ×2 koszty · STATUS: **ZDEPLOYOWANE FALA 215** `2a5a66d1` (2026-08-04)

Decyzja Macieja: dodatkowe ×2 na wybrane koszty (stacking z FALA1). Szczegóły: [`docs/decyzje/R-NADMIAR-POOLS.md`](docs/decyzje/R-NADMIAR-POOLS.md). Wejście: `gra-robocza/START.html` — git pull + Ctrl+F5 + Nowa gra.

---

## P-AI-017 — pasek HP w bitwie pokazywał 100% mimo uszkodzonej jednostki z mapy · STATUS: **FIX gotowy** (`cursor/fix-battle-hp-display-63a1`)

**Temat:** Jednostka z minimalnym HP/energią na mapie wchodziła do bitwy z pełnym zielonym paskiem HP, ale szybko ginęła (logika walki miała poprawne `u.hp`, kłamała tylko wizualizacja).

**Przyczyna:** Brak `_updateHpBar(ru)` przy spawnie w `battleScene.ts` / `manualBattle.ts` (morale i ammo były syncowane). `preBattleUnitFromRuntime` w `main.ts` ignorował `u.hp` i zawsze ustawiał max.

**Fix:** `_updateHpBar` przy każdym spawnie + `preBattleUnitFromRuntime` jak `runtimeToBattleUnit` + test `battle-hp-display-test.cjs`.

---

## PYTANIE 18 — profil Pretorium po sprzątnięciu · STATUS: **WDROŻONE W DANYCH** (2026-07-25 decyzja · `buildings.json` pretorium)

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
`dyspozycje/DECYZJE-BUDYNKI-2026-07-25.md` §8. **Status wdrożenia:** ✅ w `gra/data/buildings.json` — Kultura 5, obrona/mnoznik 0, praca 2, pieniądz 3, zadowolenie 0 (łańcuch regionalny). **BRAK ABC** — nie pytać o Praca/Pieniądz/Zadowolenie.

---

## PYTANIE 19 — utrzymanie budynków: zróżnicowane czy płaskie? · STATUS: **WDROŻONE W KODZIE** (2026-07-25 decyzja A · `economy-upkeep.ts`)

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
`dyspozycje/DECYZJE-BUDYNKI-2026-07-25.md` §8. **Status wdrożenia:** ✅ `buildingUpkeep()` czyta `utrzymanie` z `buildings.json`; `utrzymanie_budynek` tylko fallback gdy brak wpisu. Test: `upkeep-test.cjs`. **BRAK ABC.**

---

## PYTANIE 20 — Targowisko: bonus, którego nigdy nie było · **STATUS: ✅ ZAMKNIĘTE (A, wdrożone 2026-07-26; potwierdzenie Maciej 2026-07-27)**

**Decyzja:** A — `baza.pieniadz` 5, `przyrost.pieniadz` 3, mnożnik=0. Osobno: premia Targowiska **+50% Handlu brutto** (`budynek_targowisko_bonus_handlu`). Mennica = osobny efekt **×1,5 Handlu netto** (nie mylić). `docs/decyzje/PYTANIE-20.md`.

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

## PYTANIE 21 — martwe pole `odblokowuje` · **STATUS: ✅ ZAMKNIĘTE (55B wdrożone)**

Decyzja **B** — pole `odblokowuje` steruje flagami miasta (`production.ts`). `docs/decyzje/PYTANIE-21.md`.

## PYTANIE 22 — Wielka Kuźnia · **STATUS: ✅ ZAMKNIĘTE (56 = B)**

**56 = B** — kategoria i parkowanie do epoki klasycznej. `docs/decyzje/PYTANIE-22.md`.

## PYTANIE 23 — odznaki ulepszeń · **STATUS: ✅ WDROŻONE (57 = A+B)**

**57 = A+B** — kropki na żetonie + kolorowa obwódka (mapa). `docs/decyzje/PYTANIE-23.md`. (Nie 11A tarcza+miecz.)

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

**Doprecyzowanie decyzji 59 (Maciej 2026-07-27, PYTANIE-59-DOP=B):** redukcja jest **addytywna**
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
**DO POTWIERDZENIA przez właściciela:** ~~przyjęto roboczo, że **zerwanie szlaku nie burzy już zbudowanej Mennicy**~~
**Doprecyzowanie PYTANIE-77-DOP=B (Maciej 2026-07-27):** Mennica **nie burzy się**; efekt śpi **1 turę** po utracie dostępu do złota, potem pełne uśpienie (nadpisuje robocze 83=B natychmiast). Zapis: `docs/decyzje/PYTANIE-77-DOP.md`.

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

## PYTANIE 84 — budynki zależne od złoża · **STATUS: 🟡 ZAPISANA (model hybrydowy Maciej 2026-07-27)**

**Decyzja (hybryda, nie czyste A/B/C):**
- **Dostęp** (Mennica/Złoto, Sól, Konie…): brak dostępu → **natychmiast zasypia** (jak Mennica dziś).
- **Magazyn państwa** (Drewno, Kamień, Glina, Ruda…): **reguła B** — produkcja z zapasu skarbca, zasypia po wyczerpaniu; może działać chwilę po utracie kopalni, jeśli zapas został.

**Kod dziś:** runtime tylko Mennica; reszta — bramka przy budowie. Wdrożenie czeka na `działaj`. `docs/decyzje/PYTANIE-84.md`.

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

---

## DYSPOZYCJA 85 (2026-07-26) — przebudowa paska zasobów i rozdzielenie Handlu od Podatku
**STATUS: ZDECYDOWANE przez właściciela, NIEWDROŻONE. Przekazane do innej sesji razem z paczką prac.**

Słowa Macieja, dosłownie:
> „Handel powinien być przeniesiony za surowcami, czyli skarbiec, praca, surowce i handel.
> W zakładce handlu powinny być te wszystkie informacje, które teraz lądują w mieście w handlu,
> który powinien zajmować się podatkiem. Nazywać się podatkiem. To tam przenieść wszystkie informacje
> o handlu międzynarodowym z innymi cywilizacjami. Nie powinno być żadnych dodatkowych informacji
> w miastach, bo to jest globalne ustawienie dla całej cywilizacji, a nie dla miasta."

### Co z tego wynika — cztery zmiany

**1. Nowa kolejność żetonów w pasku zasobów (górny HUD).**
Dziś: `Skarbiec · Handel · Praca · Surowce`. Ma być: **`Skarbiec · Praca · Surowce · Handel`**.
Handel wędruje na koniec, ZA Surowce.

**2. Zakładka Handel = handel międzynarodowy, i tylko on.**
Wszystkie informacje o wymianie z obcymi cywilizacjami (trasy handlowe, dochód ze szlaków, wymiana
surowców) mają być zebrane w JEDNYM miejscu — w zakładce Handel, a nie rozsiane po panelach miast.

**3. Sekcja w mieście przestaje nazywać się Handel i zajmuje się wyłącznie Podatkiem.**
To domyka decyzje 65B/66B na poziomie układu interfejsu, nie tylko nazewnictwa: miasto pokazuje
Daninę/Podatek (dochód oddawany władcy, dzielony suwakiem), a nie handel.

**4. Zasada rozdziału — najważniejsza z całej dyspozycji.**
> „Nie powinno być żadnych dodatkowych informacji w miastach, bo to jest **globalne ustawienie dla całej
> cywilizacji, a nie dla miasta**."

Handel międzynarodowy jest sprawą IMPERIUM. Powielanie go w każdym panelu miasta jest błędem
konstrukcyjnym, nie tylko nadmiarem. Przy wdrożeniu trzeba przejrzeć panel miasta i **usunąć** stamtąd
to, co dotyczy szlaków z obcymi, zamiast to przenosić i zostawiać kopię.

### Punkt do rozstrzygnięcia przy wdrożeniu
~~Suwak podziału (Nauka / Skarbiec / Zamożność) jest dziś **per miasto**~~ — **ROZSTRZYGNIĘTE 2026-07-27:**
**DYSPOZYCJA-85-SUWAK = C** — globalny domyślny podział Daniny + opcjonalny override per miasto.
Zapis: `docs/decyzje/DYSPOZYCJA-85-SUWAK.md`. Kod: ROZBIEŻNOŚĆ (brak globalnego suwaka gracza).

### Stan wyjściowy dla wdrażającego
- Żetony paska zasobów: `gra/src/ui/hud.ts` (żeton „Handel” z `value: s.handelIncome`, ok. linii 439-444)
- Dochód ze szlaków: `gra/src/game/trade-routes.ts` (`tradeRouteDistanceIncome`), sumowany
  w `gra/src/main.ts` (`handelIncome`, ok. linii 8046)
- Sekcja Daniny/Podatku w mieście: `gra/src/ui/cityPanel.ts`, etykiety przez `game/danina-nazwa.ts`
- Bonus cudów `handel_procent` (5 cudów) zasila Handel, nie Daninę — decyzja z 2026-07-26

---

## ZNALEZISKO 86 (2026-07-26) — „Szczegóły bitwy" nie pokazują poziomu zniszczeń
**STATUS: ✅ ZAMKNIĘTE — ZNALEZISKO-86 = A (Maciej 2026-07-27).** % HP + pasek jak `postBattleSummary`.

**Decyzja:** A — panel „Szczegóły bitwy" ma pokazywać procent HP i pasek (wzorzec `postBattleSummary`), nie tylko liczby bezwzględne.

**Stan kodu:** CZĘŚCIOWO — `maxHp` już dociera (`battleScene.ts`, `endDetails1E.ts`); brakuje % i paska. Pełny zapis: `docs/decyzje/ZNALEZISKO-86.md`.

~~Diagnoza historyczna (przed częściową naprawą maxHp):~~
- `gra/src/battle/endDetails1E.ts:85-88` renderuje `hpBefore → hpAfter` jako **liczby bezwzględne**,
  a kolumnę podpisuje „ludzi po bitwie".
- **`maxHp` NIGDY nie dociera do tego panelu** — grep po `maxHp` w `endDetails1E.ts` i `endScreen1E.ts`
  daje **zero trafień**. Typ `EndDetailsUnitRow` (linie 26-32) ma tylko `hpBefore`/`hpAfter`.
- Tymczasem **drugi ekran po bitwie już to robi dobrze**: `gra/src/ui/postBattleSummary.ts:239-240`
  pokazuje `HP 62% → 41%` i rysuje pasek o szerokości `hpBeforePct`, bo `gra/src/game/battle-summary.ts:78`
  liczy `pct(snap.hp, snap.maxHp)`.

**Czyli gra UMIE pokazać poziom zniszczeń — tylko na innym ekranie.** To nie brak mechaniki, to brak
przekazania jednej liczby (`maxHp`) do drugiego panelu.

**Powiązanie:** prawdopodobnie ta sama rodzina co stare zgłoszenie **R-BITWA-STRATY**
(`REJESTR-PROSB-I-ZADAN.md`) — „pasek siły/HP w panelu armii świata pokazuje pełny, nie odzwierciedla
strat". Wtedy subagent nie odtworzył objawu i temat utknął na braku repro. Teraz jest konkretny zrzut.

---

## ZNALEZISKO 87 (2026-07-26) — przestarzałe ekrany do przerobienia przez designera
**STATUS: DO PRZEKAZANIA DESIGNEROWI.** Maciej zgłasza kolejno, w trakcie playtestu.

| Ekran | Co jest nie tak |
|---|---|
| **Panel BADANIA** | przestarzały — drzewko technologii zostało dawno wymienione, panel go nie odzwierciedla |
| **Panel widoku miast na mapie głównej** | przestarzały (lista „MIASTA" z jednym wierszem i tekstem pomocy) |
| **Panel dyplomacji** | pod ikoną państwa jest niebieskie kwadratowe tło — **albo je usunąć, albo zamienić na obramówkę w tym kolorze** |
| **„MIASTO ZDOBYTE"** | przestarzałe okno po zdobyciu miasta |
| **Karta Mennicy** | mockup v1 wysłany; kierunek: oczyścić, mniej informacji, szczegóły na tooltipach, minimalizm |

**Rozstrzygnięcia właściciela do karty Mennicy v2** (2026-07-26) — wzorzec także dla pozostałych kart:
1. **„Śpi" sygnalizuje sam mnożnik** — przekreślone ×1,5 → żywe ×1,0. **Nie wygaszać całej karty**,
   bo plon i rozbudowa dalej działają. Wygaszenie zarezerwowane dla stanu „niezbudowana" + kłódka.
2. **Warunki asymetrycznie:** spełnione zwinięte w cichą linię „3 z 4", niespełnione **głośne,
   z podpowiedzią co zrobić**.
3. **Ikona jest już w kanonie:** `gra/src/ui/icons/brand/buildings/bld-mennica.svg` — emoji do wyrzucenia.
4. **Oczyścić kartę** — informacje dodatkowe na tooltipy, wygląd maksymalnie przejrzysty.

---

## ZNALEZISKO 88 (2026-07-26) — głód armii: podwójne złamanie parytetu AI
**STATUS: ✅ ZAMKNIĘTE — C-ARMY-HUNGER-Q1 = A (Maciej 2026-07-27).** Pełny parytet wdrożony.

**Decyzja:** A — Pełny parytet (suwak + głód). AI zarządza suwakiem żywności heurystyką
(`decideAIEconomySliders`, bez UI); utrata HP przy głodzie armii dla **wszystkich** ownerId.

**Dowód wdrożenia:** `docs/decyzje/C-ARMY-HUNGER-Q1.md` · kod `main.ts` (~16473, ~17338) · commit `5ef4c45`.

~~Diagnoza (historyczna, przed naprawą):~~ parytet był złamany w DWÓCH miejscach na korzyść AI
(suwak tylko gracz + atrycja HP tylko ownerId===0). Naprawione.

---

## [ZNALEZIONE PRZY OKAZJI] `ai-improvements-test.cjs` i `food-hodowla-test.cjs` — 2 porażki PRE-ISTNIEJĄCE, potwierdzone na czystym HEAD (sesja C-TARASY-Q1, 2026-07-26)

Przy pracy nad C-TARASY-Q1 (Tarasy uprawne tylko Chińczycy+Inkowie) uruchomiono pełny zestaw bramek
dotykających `game/ai.ts` i `game/terrain-improvements.ts`. Dwa testy SPOZA wymaganych bramek zlecenia
(`tsc`, `logic-test`, `ai-test`, `civ-visual-test` — wszystkie zielone) wykazały porażki:

- `tools/ai-improvements-test.cjs` test #7 „wyrab pominiety dla AI (mapa samego lasu)" — oczekiwano 0
  `buildImprovement`, silnik zwraca 1.
- `tools/food-hodowla-test.cjs` — 2 porażki: „AC-E3: Model B — bydlo w zasięgu → active Trzoda" i
  „AC-E5: bydlo w zasięgu → active Trzoda".

**Zweryfikowane jako NIEZALEŻNE od tej sesji:** odtworzone identycznie w izolowanym `git worktree` na
czystym `HEAD` (`0847205`, bez jakichkolwiek zmian roboczych — ani C-TARASY-Q1, ani równoległych sesji).
Nie są regresją tej pracy; nie były na liście znanych porażek w `CLAUDE.md`/handoffie w chwili startu
sesji — ktoś powinien je tam dopisać albo zbadać przy najbliższej okazji. Nie naprawiano (poza zakresem
zlecenia C-TARASY-Q1).

---

## [ZNALEZIONE PRZY OKAZJI] PYTANIE-84 U-10B × C-GARN-Q1 — podwójny rabat garnizonu w mieście z Solią (2026-07-27)

Po wpięciu follow-up Spichlerza (`militaryFoodConsumptionWithSpichlerz`): garnizon w mieście płacącym Sól
może dostać **dwa** mnożniki ×0,5 — `camping` w `unitFoodPerTurn` (C-GARN-Q1) **oraz**
`isGarrisonInSolCity` w `spichlerzArmyFoodCostMultiplier` (U-10B) → łącznie **0,25×** kosztu żywności
na własnym terytorium. Pytanie do Macieja: U-10B **zastępuje** ogólny rabat garnizonu, czy **stackuje**?
Plik: `turn-economy.ts` · `economy-upkeep.ts`.

---

## [ZNALEZIONE PRZY OKAZJI] Stopka „Surowce w zasięgu” — audyt UI · **STATUS: ✅ WDROŻONE (C, FALA 94 `d776c787`)**

Rekomendacja C: stopka `#cs-surowce-foot` usunięta; kompaktowy pasek Koń/Sól/Złoto w zakładce **Okolica** (`#cs-oksurowce` w `cityPanel.ts`).

---

## [ZNALEZIONE PRZY OKAZJI] Stolarnia bez Tartaku — łańcuch B1 · **STATUS: ↩️ COFNIĘTE (DOSTEP-SUROWCE-Q1, FALA 95)**

FALA 94 B1 (aktywne Drewno/Tartak) cofnięta — kanon: **tylko magazyn państwa** (`docs/decyzje/DOSTEP-SUROWCE-Q1.md`).

---

## HANDEL-SPLIT-Q1 — rozdzielenie handlu: szlaki vs wymiana · STATUS: **OTWARTE** (Maciej wskazał temat B, 2026-07-28)

Pełna forma ABC: [`docs/decyzje/HANDEL-SPLIT-Q1.md`](../docs/decyzje/HANDEL-SPLIT-Q1.md).

**Skrót:** A = tylko UI · **B** = dwa traktaty w silniku (TraktatSzlakow + UmowaWymianySurowcow) · C = jeden traktat, pole `handelTryb`.

Pakiet UX 28.07 (Aktywne umowy, etykiety, recompute tras) **nie zastępuje** tej decyzji — to warstwa prezentacji.

---

## [UI/RENDER] Drogi — wygląd/mesh do przebudowy · STATUS: **ODŁOŻONE** (rozmowa jutro, 2026-07-29)

**Screen (mapa):** płaskie jasne prostokąty / belki między Atenami a Argos — drogi wyglądają nieatrakcyjnie.

**Cytat Macieja (2026-07-29 ~02:13):** „Chyba będzie przebudować drogi, bo nie wyglądają zbyt atrakcyjnie. Ale o tym jutro pogadamy."

**Status:** odłożone na jutro — bez ABC, bez wdrożenia w tej sesji.

---

## KOLEJKA — audyt handlu / stołu negocjacji · STATUS: **PO PN ZŁOTO/WĘGIEL** (Maciej 2026-07-29)

**Cytat Macieja:** po PN złoto/węgiel — **później** dokładny audyt całego handlu: czy wszystko spina się z wytycznymi (stół negocjacji), czy nie ma dróg na skróty / sytuacji omijających stół (wszystko na stół → akceptuj/odrzuć).

**Warunek startu:** po zamknięciu PN dla złota i węgla. **Bez skrótów** — pełny przegląd ścieżek handlowych vs kanon stołu.

---

## D-WIAR-KASKADA-Q1 — kara W przy kaskadzie sojuszniczej · STATUS: **ZAMKNIĘTE · W ROBOCZEJ** (Maciej **B**, FALA 111 `e5c1bbed`)

**Sytuacja.** Gdy A atakuje B, sojusznik C ofiary może być zmuszony wypowiedzieć wojnę A — zerwa NAP/sojusz z agresorem.

**Odpowiedź Macieja:** **B** — odwet sojusznika w obronie ofiary: C **nie traci** Wiarygodności (N2) za wymuszone zerwanie NAP/sojuszu z A; traktaty nadal się zrywają; agresor nie dostaje kary W za pośrednie zerwanie z C.

**Wdrożenie:** `docs/decyzje/D-WIAR-KASKADA-Q1.md` · `isDefensiveAllianceWarObligation` · `chargeWarDeclarationCredibility` + `applyAllianceObligationsOnWar`.

**Deploy:** decyzja wieczorem 29.07 — **po** FALA 110 (`1d730ca2`). Kod w `gra/src`, **brak** w `gra-robocza/` do czasu kolejnego deployu.

---

## R-HEX-PLONY-MAGAZYN — plony HEX (`terrain-yields`) vs silnik magazynu · STATUS: **ZAMKNIĘTE** (Maciej 2026-07-29, decyzja **B**)

**Decyzja:** `docs/decyzje/R-HEX-PLONY-MAGAZYN.md` — tileYield z obrabianych heksów (centrum + 👤) → magazyn; ulepszenia `surowiec_ilosc_tura` addytywnie.

**Wdrożenie:** `turn-economy.ts` (`computeWorkedMagazynYieldsByCity`, `tickEmpireResourcePipeline`), `hexContextTooltip.ts`, test `hex-plony-magazyn-test.cjs`.

---

## D-DYPLO-KOSZYK-OD-RAZU — klik z „Możliwe umowy" od razu na stół · STATUS: **ZAMKNIĘTE · WDROŻANE** (Maciej 2026-07-29)

**Cytat Macieja:** „Po wyborze z możliwe umowy (np. Traktat handlowy) — od razu w «My oferujemy», bez modala «Wyślij propozycję». System od razu przelicza Punkty porozumienia."

**Wdrożenie:** `diplomacyAudience.ts` (aid `5` → `onAction` bez `showSzlakiTreatyProposalModal`), `diplomacyNegotiationModal.ts` (usunięty krok 2 „Wyślij propozycję"), usunięty modal `showSzlakiTreatyProposalModal` z `diplomacyTradeBasket.ts`. PN: `handleNegotiatedProposal` → `updateDiplomacyAudience` → `negotiationBalanceBarHtml` / `computePlayerAcceptanceSides`.

---

## R-HEX-PLONY-MAGAZYN (archiwum zgłoszenia) — plony HEX vs silnik magazynu

**Cytaty Macieja (2026-07-29):**
> „Trochę rozjeżdża się to co jest produkowane dzięki tartakowi i tym co jest na HEX-ie. Obawiam się że te informacje z HEX-a są martwe."
> „Z HEX-ów żadne surowce się nie odkładają."
> „Dane są w ustawieniach, ale chyba nie w silniku."

**Kontekst zgłoszenia.** Maciej widzi na HEX-ie plony (np. 5 Drewna + Kamień z `terrain-yields`), buduje Tartak i oczekuje sumy plonów terenu + bonusu budynku (+25 Drewna pkt/turę), a w magazynie widzi tylko +20 — bez śladu surowców z heksów. Wcześniejszy audyt agenta stwierdził „mylące ale działa"; Maciej się **nie zgodził**. Pytanie **nie było** trwale zapisane w pliku.

**Uwaga procesowa (Maciej 2026-07-29):** „każde moje pytanie, każdy błąd jest zapisywany w plikach" — ten wpis domyka lukę.

**Hipoteza robocza z audytu (do potwierdzenia, nie werdykt):**
- **Kamień z terenu** — prawdopodobnie **martwy** w silniku magazynu (dane w `terrain-yields`, brak wpływu na skarbiec).
- **Drewno z terenu** — może działać **tylko przez ulepszenie 👤** (np. Tartak na lesie), nie z gołego plonu HEX-a.
- **Tartak +20** zamiast oczekiwanego +25 — może wynikać z braku sumowania plonów HEX + budynku, albo z innego źródła liczby w UI.

**Czeka na:** twardy werdykt techniczny (ścieżka kodu: `terrain-yields` → `turn-economy` / magazyn państwa) + ewentualna paczka ABC/naprawa po potwierdzeniu.

**Uwaga:** w transkrypcie 29.07 ~18:12 Maciej pisał „w **silniku**" (STT czasem jako „średniku") — **ten sam wątek**, nie osobny temat.

---

## D-DYPLO-KATALOG-AKCJI — brak akcji (sojusz, wojna…) w menu propozycji · STATUS: **OTWARTE** (Maciej 2026-07-29 ~00:46)

**Cytat:** „Nie widzę tutaj np. sojuszu czy zaatakowania innego państwa. Większość akcji dyplomatycznych, które mieliśmy w kodzie i zaprojektowaliśmy, ich tu nie widzę."

**Czeka na:** audyt katalogu akcji vs UI propozycji/wydarzeń + wdrożenie brakujących lub ABC co pokazać.

---

## D-DYPLO-CELOWNIK-STOLICA — przeskok kamery do stolicy z karty państwa · STATUS: **OTWARTE** (Maciej 2026-07-29 ~00:47)

**Cytat:** Na karcie reprezentanta państwa w dyplomacji brakuje **celownika** — klik przenosi na mapę do stolicy tego państwa.

---

## D-DYPLO-AKCJE-SZARE — niedostępne akcje wyszarzone + tooltip · STATUS: **OTWARTE** (Maciej 2026-07-29 ~00:50–00:51)

**Cytat:** Gdy próg nie spełniony — akcja **wyszarzona z tooltipem** (nie znika). Osobno: akcje niemożliwe z **państwem-miastem** — wyszarzone z komunikatem.

---

## BUG-DYPLO-PANEL-OVERLAP — panel dyplomacji nachodzi na panel jednostki („Frank") · STATUS: **OTWARTE** (Maciej 2026-07-29 ~01:06)

**Cytat:** Po dyplomacji z zaznaczoną jednostką oba panele nachodzą; miało być naprawione.

---

## BUG-DYPLO-NAP-PW-ZERO — karty NAP na stole bez wartości PW · STATUS: **ZAMKNIĘTE** (fix 2026-07-29)

**Cytat:** Karty „Pakt o nieagresji" (My oferujemy / Oni oferują) nie pokazywały żadnej wartości PW — miały mieć swoją wartość z `diplomacy-acceptance-points.json` (baza 200 PW).

**Przyczyna:** `renderTreatyDealItemHtml` wyświetlał tylko etykietę traktatu; panel bilansu brał wyłącznie `offerPn` z koszyka (0 przy pustym payloadzie NAP).

**Fix:** `bilateralTreatyDisplayPw` + `sideDisplayOfferPw` w `diplomacy-acceptance-points.ts`; karty stołu i panel PW pokazują wartość traktatu na obu stronach (dwustronny).

---

## BUG-DYPLO-GIFT-WAR-FALSE — dar pieniędzy blokowany komunikatem o wojnie mimo pokoju · STATUS: **NAPRAWIONE w źródle** (2026-08-02)

**Cytat (screen Macieja):** Modal „Prezent / dar" przy audiencji z Rzymianami (stan POKÓJ, Życzliwy) pokazuje czerwony komunikat „W wojnie pieniądze tylko w ugodzie pokojowej" i wyłącza ZAPROPONUJ — mimo że „Wypowiedzenie wojny" jest dostępne (nie ma wojny).

**Przyczyna:** `validateBasketForm` w `diplomacyTradeBasket.ts` wołał `isCurrencyProposalForbiddenDuringWar(..., true)` z hardkodowanym `atWar: true`, ignorując `ctx.atWar` z audiencji.

**Fix:** trzeci argument = `ctx.atWar ?? false`. Silnik (`diplomacy-proposals.ts`) był poprawny — błąd tylko w walidacji UI koszyka. Testy: `diplomacy-war-gates-test.cjs`, `diplomacy-proposal-test.cjs` §17.

---

## BUG-DYPLO-NAP-FAIRMIN-FALSE — NAP pokazuje fałszywe „Brakuje PW" (fair min handlu) · STATUS: **NAPRAWIONE w źródle** (2026-08-02)

**Cytat (screen Macieja):** NAP @ Rel 52, symetryczne 296/296 PW — panel pokazywał „Brakuje 274 PW" / „Poniżej progu fair min (570 PW)", mimo że koszyk PW jest opcjonalny, a NAP akceptuje się progiem Relacji (≥50).

**Przyczyna:** `treatySummaryHtml` wołał `renderPnBalancePanelFromBasket` dla wszystkich traktatów z bazą PW (nie tylko pokoju) — `diplomacyFairGivePn(296, 52)` dawało fair min 570.

**Fix:** `renderPnBalancePanelForTreaty` (uogólnienie ścieżki pokoju) w `diplomacyAcceptanceBalance.ts`; `treatySummaryHtml` przy `bil > 0` używa panelu traktatowego (bilans = słodzik netto koszyka, meta „Traktat: X PW @ Rel Y"); przy niskiej Relacji komunikat o progu Relacji, nie fair-min handlu. Test: `diplomacy-acceptance-points-test.cjs` (NAP @52/@40 + regresja pokoju).

---

## BUG-DYPLO-TRADE-INCOMING-ACCEPT — Przyjmij zablokowany + fałszywe „Brakuje PW" na propozycji AI · STATUS: **NAPRAWIONE w źródle** (2026-08-02)

**Cytat (screen Macieja):** Traktat handlowy — My: 10 Glina/turę (200 PW), Oni: 8 ¤/turę (80 PW). Panel: Bilans (Oni) **−120**, „Brakuje 120 PW", „Oni nie spełniają progu". Przyjmij disabled (tooltip fair min @ Relacji). Karty statyczne — brak edycji obu stron koszyka.

**Przyczyna:** `canAccept` w `main.ts` wymagał `responderPreview.accepted` z `evaluateProposal` (fair-min proponenta AI); przy korzystnym dla AI dealu zwracało false. Panel PW używał `their.balancePn = offer − fairMin` zamiast netto wymiany. Edycja tylko przez przycisk Kontruj.

**Fix:** Incoming `canAccept = !legacyAccess` (gracz decyduje). `computePlayerAcceptanceSides` + `renderPnBalancePanelHtml`: bilans netto `my−their`, bez „Brakuje" gdy gracz oddaje więcej. Klik w kartę przychodzącej propozycji → koszyk edycji obu stron (jak Kontruj). Test: `diplomacy-acceptance-points-test.cjs` (incoming traktat +120).

---

## BUG-DYPLO-UMOWY-DUPLIKAT — wielokrotne klikanie tej samej umowy na stole · STATUS: **ZAMKNIĘTE** (fix 2026-07-29)

**Cytat:** Można wielokrotnie naciskać tę samą umowę (np. Traktat handlowy) — na stole pojawia się wiele kart i rzędów Przyjmij/Odrzuć.

**Fix:** `hasPendingNegotiationForPair` + `findOwnOutgoingNegotiation` (`diplomacy-proposals.ts`); guard w `handleNegotiatedProposal` (`main.ts`); `blockDuplicateNegotiationClick` + blokada kafelków `active` (`diplomacyAudience.ts`).

---

## R-AI-MIASTA-BUDOWY — państwa-miasta prawie nie budują mimo zasobów · STATUS: **OTWARTE** (Maciej 2026-07-29 ~02:04)

**Cytat:** „Państwa miasta nie budują praktycznie żadnych budynków, chociaż mają zasoby — trzeba sprawdzić."

---

## BUG-SUROWCE-WIDOCZNE — surowce na mapie widoczne po ulepszeniu (miały być przykryte) · STATUS: **ZAMKNIĘTE** (fix 2026-07-29)

**Cytat:** „Znowu po budowie widać surowce. Miały być przykryte." (Regresja względem wcześniejszej decyzji ukrywania złóż pod ulepszeniem.)

**Root cause:** Wejście w tryb budowy wywoływało `autoEnableWorkerOverlayForBuildMode()` (wymuszało 👤) oraz po postawieniu/cofnięciu ulepszenia pełny `rebuildResourceOverlays()` (skan całej mapy, odsłanianie wszystkich złóż z pominięciem per-hex suppress).

**Fix (`gra/src/main.ts`, `gra/src/ui/minimapHud.ts`, `gra/src/ui/hud.ts`):**
- Usunięto auto-włączanie overlay przy starcie build mode.
- Po budowie/czyszczeniu: `syncResourceOverlayAtHex(hexKey)` zamiast pełnego rebuild.
- Dodano toggle ⛏ `showResourceDepositOverlay` — build mode nie resetuje widoczności; `hexSuppressesResourceOverlay()` nadal ukrywa złoża pod ulepszeniem.
- Podświetlenie kandydatów: `unitRenderer.setHighlight()` (bez resource overlay ON).

---

## BUG-FARMA-GLINA-ZNIKA — ikona gliny znika po postawieniu Farmy · STATUS: **ZAMKNIĘTE** (fix 2026-07-29)

**Cytat:** Po zbudowaniu Farmy znika ikona gliny na heksie — mylące UI (gracz myśli że złoża nie ma). Technicznie Glinianka nadal się buduje (farma i glinianka = różne sektory).

**Przyczyna:** `hexSuppressesResourceOverlay()` ukrywał overlay przy **każdym** ulepszeniu terenu (farma, fort, tartak…), nie tylko przy eksploatacji danego złoża.

**Fix (`gra/src/game/terrain-improvements.ts`, `gra/src/main.ts`):**
- Nowa reguła: `hexSuppressesDepositOverlay()` / `improvementHidesDepositOnHex()` — chowaj ikonę złoża **tylko** gdy na heksie stoi ulepszenie **dedykowane** temu złożu (Glinianka→glina, Kopalnia miedzi→miedź, Owce→owce itd.).
- Farma / Irygacja / Droga / Fort / Tartak / Kamieniołom **nie** chowają ikon złóż.
- Złoże (`nakladka` / `hex.zloze`) **nie jest usuwane** z danych heksa — zmiana wyłącznie wizualna.

**Weryfikacja:** `map-improvement-qualify-test.cjs` (sekcja BUG-FARMA-GLINA).

---

## R-ZAMIEN-ULEPSZENIE-CONFIRM — potwierdzenie zamiany wykluczających ulepszeń · STATUS: **ZAMKNIĘTE (Q1=A)** (Maciej 2026-08-03)

**Cytat pierwotny:** Przy budowie ulepszenia wykluczającego istniejące — dialog „zastąpić?"

**Decyzja:** **A** — zawsze modal przy zastąpieniu. Kod już tak działa (`showImprovementBuildConfirmModal`). Szczegóły: `docs/decyzje/R-ZAMIEN-ULEPSZENIE-CONFIRM.md`.

---

## BUG-ARMIA-BRAK-POLACZ — brak akcji „Połącz" przy wielu jednostkach na heksie · STATUS: **OTWARTE** (Maciej 2026-07-29 ~01:36)

**Cytat:** Jest „Rozdziel", brakuje „Połącz" gdy kilka jednostek na polu.

---

## R-PUŁKA-PYTANIA-29-07 — paczka pytań bez odpowiedzi w czacie (29.07 noc) · STATUS: **OTWARTE / FORGOTTEN**

Maciej ~01:43: „Zadałem sporo pytań, czekam na odpowiedzi." Źródło pełne: `MASTER-Work_KORESPONDENCJA.md` linie 93062–93505 (transkrypt 29.07 01:24–01:59).

**Pełna lista numerowana (18 pytań + 2 uwagi balansu):**

| # | Temat (skrót) | Odpowiedź z kodu? |
|---|---|---|
| 1 | Farma bez 👤 — czy daje Ż/Pr/Pod? | TAK — tylko z obywatelem lub centrum |
| 2 | Palisada — tech i czy działa? | TAK — Obróbka drewna, **Kamień** (korekta 2026-07-29), +100% Obrony |
| 3 | Lista ulepszeń: surowce **bez** vs **z** 👤 | TAK — dwie listy (archiwum 01:32) |
| 4 | Irygacja vs Farma — nachodzą graficznie? | TAK — logicznie stack OK, jeden mesh `pole_irygowane` |
| 5 | Farma + Trzoda — czy można Irygację? | TAK — **nie** (farma+irygacja **albo** farma+trzoda) |
| 6 | ETA budynku (~N tur przy obecnej Pracy) | TAK — `cityPanel.ts` `etaTurns()` |
| 7 | Skondensować UI rekrutacji (jak budynki, max 5) | WDROŻENIE — decyzja UX Macieja, nie ABC |
| 8 | Ulepszenie kosztuje 1 Pracy? | TAK — **utrzymanie**/turę (tartak, kopalnie…); budowa 15–30 |
| 9 | AI oferuje drewno, którego nie ma | BUG — cap magazynu AI (fix wdrożony, weryfikacja) |
| 10 | Handel wychodzi poza ramkę panelu | BUG — fix layout (wdrożony) |
| 11 | „Handel jednorazowy" + „Runda 1 z 3 · 5 tur" | TAK — copy do uproszczenia (nie ABC gameplay) |
| 12 | Owce w lesie / zastąpienie Tartaku — dialog? | WDROŻENIE — `R-ZAMIEN-ULEPSZENIE-CONFIRM` |
| 13 | Brak „Połącz" przy wielu jednostkach | BUG — `BUG-ARMIA-BRAK-POLACZ` |
| 14 | Surowce znów widoczne po budowie | BUG — fix (ZAMKNIĘTE) |
| 15 | Farma chowa ikonę gliny — czy blokuje Gliniankę? | TAK — tylko UI, złoże zostaje (ZAMKNIĘTE) |
| 16 | Tartak → 10 Drewna/t, Glinianka → 15 Glina/t | DECYZJA Macieja 01:39 — wdrożone |
| 17 | Państwa-miasta nie budują mimo zasobów | OTWARTE — `R-AI-MIASTA-BUDOWY` |
| 18 | Sojusznik zerwie handel gdy broni sojusznika — kto karę? | TAK — wyjaśnione w czacie 01:02 (audyt do potwierdzenia) |

Powiązane osobno (ta sama noc, nie w skróconej tabeli): `D-DYPLO-KATALOG-AKCJI`, `D-DYPLO-CELOWNIK-STOLICA`, `D-DYPLO-AKCJE-SZARE`, `BUG-DYPLO-PANEL-OVERLAP`, `R-HEX-PLONY-MAGAZYN` (ZAMKNIĘTE B).

---

## E-TOOLTIP-ROZMIAR-2X — małe podpisy hover ×2 (nie karty wyjaśnień) · STATUS: **ZAMKNIĘTE** (Maciej 2026-07-28/29)

**Cytat:** „Zwiększyć ciąg tooltipów dwukrotnie" = **rozmiar czcionki/box ×2** przy małych podpisach przy najechaniu (ikony HUD, minimapa, toolbar), **nie** opóźnienie czasu i **nie** karty wyjaśnień (hover-detail dock).

**Wdrożenie:** `hudTitleTooltip.ts` (30px, padding 14×22, blokada natywnego `title=`) · `buildModeHud.ts` lock-tip · `sciencePicker.ts` `.civ-sci-tooltip`.

---

## E-MAP-TOGGLE-DEFAULT-ON — kłódki 👤 i granice domyślnie ON · STATUS: **WDROŻONE** (2026-07-29)

**Cytat:** Przełączniki robotników w terenie (👤) i granic państw na mapie świata — na starcie zawsze włączone; po ręcznym włączeniu nie mogą się same wyłączać (zoom, tura, panel, fog).

**Wdrożenie:** `main.ts` — `territoryBorderVisible` i `showWorkerOverlay` domyślnie `true`; `resetMapOverlayToggleDefaults()` przy nowej grze / load / playtestach; `refreshMapOverlayToggles()` po starcie sesji. Auto-wyłączanie 👤 tylko gdy overlay włączył tryb budowy (`workerOverlayAutoEnabled`) — przy domyślnym ON onboarding nie ustawia flagi auto.

---

## D-DYPLO-AI-OFERTA-ZERO — bilans PW ofert AI wg trudności · STATUS: **WDROŻONE** (Maciej 2026-07-29)

**Decyzja Macieja:** Łatwy = dotychczasowe zachowanie (gratisy / duże plusy OK). Normal (i Trudny) = AI celuje w bilans PW ≈ 0, bez dużych nadwyżek dla gracza.

**Parametr:** `AI_OFFER_PW_BALANCE_TOLERANCE_PN` — easy: ∞ · normal: **5 PW** · hard: **2 PW** (+ `AI_OFFER_PW_UNDERSHOOT_PN` hard: 3 PW na korzyść AI przy handlu surowcem).

**Wdrożenie:** `diplomacy-ai-offer-balance.ts` · `ai.ts` (brak daru ¤ i osłodzika umowy na Normal+) · `diplomacy-proposals.ts` (`generateCounterOffer` — minimalny słodzik) · `diplomacy-pn-engine.ts` (`computeQuickDealBasket` trim) · `main.ts` (korekta zapłaty surowcem). Test: `diplomacy-ai-offer-balance-test.cjs`.

---

## BUG-RZEKI-DOPLYWY — dopływy kończą się na lądzie · STATUS: **WDROŻONE** (2026-07-29)

**Cytat Macieja (2026-07-29 ~23:02):**
> „Jest jeszcze kwestia dopływów, które moim zdaniem nie łączą się z rzekami głównymi. Trzeba coś zrobić, żeby się łączyły — albo niech wpadają do morza. Generalnie rzeki nie powinny się zaczynać i kończyć na lądzie, jeżeli co najmniej nie wpadną do innej rzeki lub nie wpadną do morza."

**Przyczyna:** `pruneOrphanRiverPaths` wołane przed finalnym reliefem/złożami (szczególnie mapa Ziemia) — późniejsze kroki rozłączały sieć bez ponownego przycinania.

**Wdrożenie:** `ensureRiverOutlets()` na końcu `generator.ts` · `finalizeTributaryPath()` odrzuca dopływy bez junction/morza przy generacji · asercje w `map-gen-regression-test.cjs` (0 sierot + `checkTributaryJunctions`).

---

## D-DYPLO-AI-NO-NAG — AI nie powtarza odrzuconej oferty · STATUS: **WDROŻONE** (Maciej 2026-07-29)

**Cytat Macieja:** Po odrzuceniu propozycji AI — nie proponować tego samego w następnej turze (ani 2–3× pod rząd). Ten sam partner + ten sam typ umowy = cooldown.

**Decyzja:** Cooldown **3 pełne tury** (`AI_REJECTED_OFFER_COOLDOWN_TURNS`). Klucz: `partnerOwnerId` + `actionId`. Różne typy (NAP vs handel) — OK.

**Wdrożenie:** `diplomacy-rejection-cooldown.ts` · `main.ts` (Odrzuć → zapis, kolejka AI → filtr, save/load `meta.rejectedOfferCooldowns`) · `diplomacy-rejection-cooldown-test.cjs`. Decyzja: `docs/decyzje/D-DYPLO-AI-NO-NAG.md`.

---

## D-DYPLO-KOSZYK-UX — koszyk wymiany surowców (chipy, czas umowy) · STATUS: **WDROŻONE** (Maciej 2026-07-29)

**Cytat Macieja:** Dropdown „Typ pozycji" + ilość + „+ DODAJ" — nieczytelne. Chce chipy z ikonami gry (HUD/magazyn), wybór czasu umowy (Jednorazowo / Co turę × N tur), przyciski +1/+10/+100 przy ilości.

**Wdrożenie:** `gra/src/ui/diplomacyTradeBasket.ts` — chipy typów (ikony `brandAssets` / `mapResourceIconSvg`: Pieniądze, Praca, Żywność, Surowiec, Technologia), chipy surowców z ikonami mapy, stepper ilości (+1/+10/+100), blok „Czas umowy" (chipy Jednorazowo/Co turę + presety tur 5–20). Silnik PW bez zmian.

**Screenshot:** `docs/ux/preview-dyplomacja/D-DYPLO-KOSZYK-UX-trade-basket.png` (skrypt `gra/tools/capture-trade-basket-preview.cjs`).

---

## BUG-HUD-ZOOM-FULLSCREEN — klik +/− i pełny ekran nie reagują · STATUS: **NAPRAWIONE** (2026-07-29)

**Objaw:** Przyciski zoom UI (85%–150%) i ⛶ pełny ekran nad minimapą — widoczne, ale klik bez efektu.

**Przyczyna (warstwy UI):**
1. `.civ-side-ctx-dock.open` (karta jednostki, z-index 316) miał `pointer-events:auto` na pełnej wysokości kolumny — przykrywał dock zoomu (wewnątrz `.civ-hud` z-index 310).
2. `.civ-minimap-wrap` (z-index 310, montowany po HUD w DOM) przechwytywał kliknięcia w strefie nakładania z dockiem.
3. `.civ-sci-dim-backdrop` (hub badań, dock drzewka) — przezroczysty pełnoekranowy overlay `pointer-events:auto` bez `display:none` w CSS (ryzyko „leave-behind").

**Fix:** `sidePanelHud.ts` — pass-through `pointer-events` na docku karty (auto tylko na `.sp-ctx-card`); `minimapHud.ts` — `pointer-events:none` na wrapie; `hud.ts` — dock zoom/fs na `document.body` z z-index 318 + osobne style; `sciencePicker.ts` — domyślne `display:none` na dim-backdrop; `hudTitleTooltip.ts` — wykluczenie przycisków zoom/fs z przechwytywania title.

**Pliki:** `gra/src/ui/hud.ts`, `sidePanelHud.ts`, `minimapHud.ts`, `sciencePicker.ts`, `hudTitleTooltip.ts`.

---

## BUG-PALISADA-BRAK — Palisada drewniana „wdrożona", niewidoczna w grze · STATUS: **NAPRAWIONE w źródle** (2026-07-29) · **czeka deploy ROBOCZA**

**Korekta epoki (Maciej 2026-07-29):** *„Palisada miała być w epoce KAMIENIA. Korekta nieporozumienia: nie Brąz — epoka Kamienia."* → `epokaWejscia: 1`, tech **Obróbka drewna** (Kamień w `tech.json`). Szczegóły: `docs/decyzje/BUG-PALISADA-BRAK-korekta-epoka.md`.

**Pytanie Macieja (R-PUŁKA #2):** Czy Palisada jest w danych, panelu budowy i działa (+100% Obrony, Mury zastępują)?

**Audyt (źródło `gra/`):**
| Warstwa | Stan | Dowód |
|---|---|---|
| `buildings.json` | **JEST** | `id: palisada`, `techUnlock: Obróbka drewna`, `epokaWejscia: 1` (Kamień), koszt 22 Pracy + 12 drewna |
| `loader.ts` | **OK** | Import `buildings.json` — bez filtra |
| `production.ts` | **OK** | `availableProduction` — epoka Kamień + tech; ukryta gdy `mury`/`fort` |
| `city-defense.ts` | **OK** | +100% (`bonus_obrona_palisada_proc`); Mury +200% bez stacku |
| `production.ts` apply | **OK** | Po `mury` usuwa `palisada` z `cityBuilt` |
| Panel budowy UI | **było źle** | Brak chipa „+100% Obrona" (bonus tylko w silniku, nie w `baza.obrona`) |

**Dlaczego Maciej nie widzi w playteście:** `gra-robocza/Gra-ROBOCZA.html` (md5 `e5c1bbed`, publish 2026-07-29 18:31) **nie zawiera** stringa `Palisada drewniana` w bundlu — kod jest w `gra/src` + `gra/data`, ale **nie był w ostatnim deployu ROBOCZA**.

**Naprawa (bez deployu):** `building-upgrades.ts` + `cityPanel.ts` — chip/infokarta „+100% Obrona"; `eraBuildingCatalog` — ukrywa palisadę po Murach; test `koszty-surowcowe-test.cjs` §J (dostępność w Kamieniu). **Deploy ROBOCZA** — osobno (Grok).

---

## BUG-SKARBIEC-BILANS-DASH — panel ZASOBY IMPERIUM: bilans skarbca same „—" · STATUS: **NAPRAWIONE w źródle** (2026-07-29) · **czeka deploy ROBOCZA**

**Objaw (Maciej + zrzut):** Panel „Grecy · ZASOBY IMPERIUM" — Skarbiec **83** OK, ale Wpływy / Handel ze szlaków / Utrzymanie budynków / jednostek / Netto = **—**; tabela miasta (Ateny): Do skarbca / Utrzymanie = **—**. Wrażenie: „płacę za handel", ale kwota skarbca się nie zmniejsza.

**Root cause (wyświetlanie):**
1. `openEmpireDetailFromHud()` wołało `showEmpireDetailPanel()` **przed** `refreshLiveEmpireRates()` — pierwszy render czytał stale `_lastPieniadzRate` / `_lastPlayerCityEcon` (= 0 po starcie).
2. `signedTxt()` w `empireDetailPanel.ts` zamieniało **0 → „—"** (OK dla surowców, złe dla bilansu ¤).

**Czy ¤ faktycznie schodzi (silnik):**
| Mechanizm | Debit ze skarbca? | Gdzie |
|---|---|---|
| Utrzymanie budynków + jednostek | **TAK** | `main.ts` koniec tury: `player.skarbiec -= playerBalance.utrzymanieRazem` |
| Dochód ze szlaków handlowych | **TAK (kredyt)** | `turn-economy.ts` `pieniadzZTras` → skarbiec |
| Trybut / płatność ¤ z traktatu | **TAK** | `tickDiplomacyPayments()` → `treasury.add(payer, -amount)` |
| Handel surowcowy cykliczny (zaplataTyp=zloto) | **TAK** | `tickCyclicResourceTradeDeals()` → `applyOneShotGoldTransfer()` |
| Handel surowcowy (zaplataTyp=praca) | **NIE ¤** | Odejmuje z **puli Pracy**, nie skarbca |
| Koszt „utrzymania szlaku" jako osobna opłata ¤ | **NIE** | Szlaki dają dochód dystansowy; nie ma osobnego debitu ¤ za trasę |

**Fix:** `main.ts` — `refreshLiveEmpireRates()` przed `showEmpireDetailPanel()`; `empireDetailPanel.ts` — `treasuryBalanceSignedTxt()` / `treasuryDeltaHtml()` (jawne 0); test `gra/tools/empire-skarbiec-bilans-test.cjs`.

**Deploy ROBOCZA** — osobno (Grok).

---

## BUG-CUDY-MAPA-NIE-MIASTO — cuda z panelu ulepszeń trafiały do kolejki miasta zamiast na hex · STATUS: **NAPRAWIONE w źródle** (2026-07-29) · **czeka deploy ROBOCZA**

**Cytat Macieja:** „Budowa ulepszeń obejmuje też cuda, ale cud kładzie się **na mapie świata** (heks), jak ulepszenie terenu. Jak jest źle: klik cudu w panelu ulepszeń na mapie → **dokłada się do kolejki budowy w mieście**."

**Root cause:** `buildModeHud.ts` → `onSelectWonder` → `enqueueWonderForPlayer()` w `main.ts` — cud trafiał do `cityProd` jako `__wonder__:<id>` (kolejka produkcji miasta), a po ukończeniu `pickWonderHexForCity()` losował hex automatycznie.

**Dane:** Cuda **nie są** w `buildings.json` — osobny plik `gra/data/wonders.json` (`cuda[]`, pole `kosztBudowy` w Pracy, `_meta.budowa` = „hex w terytorium (nie slot miasta)").

**Fix (źródło):**
- `activeWonderId` + klik hex → `wonderBuildSites[]` (postęp na mapie, koszt z puli Pracy imperium)
- `wonder-map-build.ts`, rozszerzenie `wonder-placement.ts` (`listQualifyingWonderHexesForOwner`)
- `buildModeHud.ts` — UI: „Kliknij hex w terytorium", nie „Kolejka produkcji"
- AI nadal przez kolejkę miasta (`enqueueWonderForPlayer` zostaje dla AI)

**Test:** `node gra/tools/wonder-map-build-test.cjs`

**Deploy ROBOCZA** — osobno (Grok).

---

## NOTATKA-PALISADA-BISKUPIN — wdrożony wygląd palisady (bez pytania do Macieja) · STATUS: **WDROŻONE w źródle** (2026-07-30) · **czeka deploy ROBOCZA**

**Cytat Macieja (2026-07-29):** „Do palisady wygląda bardzo fajnie, możesz ją wdrażać do gry."

Wdrożone w `gra/src/render/miasto-kamien.ts` (funkcja `wal`) — palisada w stylu Biskupin: skarpa ziemna + żerdzie na skos + ściana z belkami poziomymi + nierówna korona + brama od +x. Podgląd po wdrożeniu: `docs/ux/preview-palisada/wdrozenie-biskupin-kamien.png`.

**Trzy rzeczy do ewentualnej decyzji później (NIE pytam teraz):**

1. **Paleta.** Wdrożony wariant **Kamień** (drewno szare-zwietrzałe, jak `ref-styl-biskupin-kamien.png`). Wariant brązowy (`ref-styl-biskupin-braz.png`) to osobna propozycja — miasto epoki Brązu ma własny mur (`miasto-braz.ts`: mur cyklopowy / wał agger), więc brązowej palisady nikt dziś nie renderuje.
2. **Korekty wobec pliku propozycji.** W `gra/tools/.palisada-biskupin-preview-entry.ts` obroty wokół osi Y były podane w **stopniach zamiast radianów** (płyty skarpy i żerdzie leciały pod losowymi kątami), a nadproże bramy było obrócone w poprzek cięciwy — stąd długa belka wystająca poza obrys heksa na zrzucie referencyjnym. W grze jedno i drugie poprawione: pierścień skarpy stycznie do obwodu, żerdzie pochylone **na zewnątrz**, nadproże wzdłuż cięciwy. Struktura, palety i wysokości bez zmian.
3. **Koszt renderu.** Palisada to teraz **1428–1644 tri (119–137 klocków)** zamiast 288–320 tri (32 klocki). Obrys w normie (0.42 / 0.47 / 0.49 przy rezerwie 0.50 — `gra/tools/.palisada-obrys-entry.ts`), ale miasto z murem to ~135–219 meshy. Jeśli przy wielu miastach na mapie pojawi się spadek FPS — pierwszy kandydat do scalenia geometrii.

**Ikona panelu budowy:** `palisada` miała ikonę `bld-mury` (tę samą co kamienne Mury). Wdrożona dedykowana `gra/src/ui/icons/brand/buildings/bld-palisada.svg` z propozycji UX (`docs/ux/preview-palisada/bld-palisada-proposal.svg`). Powrót do wspólnej ikony = jedna linia w `building-icon-map.json`.

**Deploy ROBOCZA** — osobno (Grok).

---

## NOTATKA TECH (R-KOPALNIA-UNIWERSALNA-Q1=B) — kopalnia na węglu · STATUS: **OTWARTE (cicho)**

Stare save z uniwersalną `kopalnia` na `zloze=wegiel` nie mają docelowego ulepszenia (brak `kopalnia_wegla`). Migracja przy load usuwa taką warstwę (`migrateLegacyKopalniaKey` → null). Do decyzji Macieja: osobne ulepszenie węgla vs inny fallback.

---

## PALISADA-BRAZ-Q1 — wygląd wału w Brązie przy samej palisadzie · STATUS: **ZAMKNIĘTE / WDROŻONE** (Maciej 2026-07-31)

**Decyzja: 7A** — cytat: „1a, 2a, 3a, 4b, 5a, 6a, 7a". Drewniany wał/palisada Biskupin też w epoce Brązu (bez kamiennego muru cyklopowego/agger przy samej palisadzie). **WDROŻONE:** `miasto-braz.ts` + `cities.ts` `getWallKind` + `buildPalisadaWal` z `miasto-kamien.ts`.

---

## RELIEF-SEKTOR-Q1 — hodowla na wzgórzu: podnóże czy szczyt kopca · STATUS: **ZAMKNIĘTE** (Maciej 2026-07-31)

**Decyzja: 5A** — cytat: „1a, 2a, 3a, 4b, 5a, 6a, 7a". Hodowla zostaje **u podnóża** kopca (obecne zachowanie). Bez zmian kodu.

---

## RELIEF-SEKTOR-Q2 — Kopalnia złota spłaszcza górę, miedzi/żelaza nie · STATUS: **ZAMKNIĘTE / WDROŻONE** (Maciej 2026-07-31)

**Decyzja: 6A** — cytat: „1a, 2a, 3a, 4b, 5a, 6a, 7a". `kopalnia_zlota` jak miedź/żelazo — **zostawia górę**. **WDROŻONE:** `PRESERVES_HILL_RELIEF_KEYS` w `main.ts`.

---

## ARMY-STACK-CAP-Q1 — limit jednostek na heksie vs pobór · STATUS: **ZAMKNIĘTE** (Maciej 2026-07-31)

**Decyzja: 1A** — cytat: „1a, 2a, 3a, 4b, 5a, 6a, 7a". Bez limitu stosu (jak dziś). Bez zmian kodu.

---

## FORTIFY-POLE-Q1 — fortyfikacja w polu: +50% vs +50 flat · STATUS: **ZAMKNIĘTE / WDROŻONE** (Maciej 2026-07-31)

**Decyzja: 2A** — cytat: „1a, 2a, 3a, 4b, 5a, 6a, 7a". Naprawić na prawdziwe **+50% Obrony** (mnożnik ×1.5, nie flat +50). **WDROŻONE:** `fieldFortifyDefenseBonus` w `city-defense.ts`.

**Dopisek 2026-07-31 (FORTIFY-GARNIZON):** garnizon „Ufortyfikuj" (`inGarnizon`) w mieście **bez** budynku obronnego (brak palisady/murów/fort/cytadeli/baszty → `cityWallDefenseBonusPercent === 0`) dostaje **+50% Obrony** (jak `ufortyfikowanyWPolu` / `fortify_obrona_proc`). Gdy miasto ma palisadę, mury lub basztę (bonus budynku > 0) — **0%** od ufortyfikuj, tylko bonus budynku. **WDROŻONE:** `shouldApplyGarrisonFortifyBonus` + `unitGetsFortifyDefenseBonus` w `city-defense.ts`; wpięte w `main.ts` (Auto/taktyczna) i `mapFieldBattle.ts`.

---

## CLIMATE-DESERT-WIDTH-Q1 — szerokość pasa pustyni środkowej · STATUS: **ZAMKNIĘTE / WDROŻONE** (Maciej 2026-07-31)

**Decyzja: 3A** — cytat: „1a, 2a, 3a, 4b, 5a, 6a, 7a". Zwęzić pas suchy do **~7 hexów** (było ~15% wysokości mapy). **WDROŻONE:** `CLIMATE_DESERT_HALF_ROWS = 3.5` w `gen-helpers.ts` (`climateBandAt` dynamicznie per wysokość mapy).

---

## WOJNA-PM-GRACZ-Q1 — tempo odbudowy PM po wojnie AI→gracz · STATUS: **ZAMKNIĘTE** (Maciej 2026-07-31)

**Decyzja: 4B** — cytat: „1a, 2a, 3a, 4b, 5a, 6a, 7a". Zostawić **60%/turę** odbudowy Manpower po wojnie wymuszonej przez AI na gracza. Bez zmian kodu.

---

## BUG-RZEKI-PERF-FALA138 — regresja czasu generowania głównych rzek · STATUS: **ZAMKNIĘTE** (2026-08-01 ~20:58)

**Cytat Macieja (~19:00):** generowanie głównych rzek **>2 min** vs wcześniej **~10 s**.

**Fix (kod):** `d2db99c` + `9c4320b` — Pangea bootstrap 22–32 ujść (było 40–60×3), cache mainKeys, stride 3, max 72 komórki grid, fastTrace 2 próby, consecutive-fail break.

**Wynik bench Duży seed 42:** etap 1 (główne) **~146 ms** (było **~295 s** Pangea); traceRiver ×1285 (było ×53246). Gęstość Pangea: **604 rzek** (111 main + 544 medium vs 637 wcześniej).

**Constraint gęstości:** zachowana (~95% liczby rzek Pangea); topUp hardStarts + etap 2 medium bez zmian logiki fill.

**Weryfikacja Macieja (~20:58, FALA 140 `935d1642`):** etap głównych rzek **~20 s OK** — temat zamknięty.

**Powiązane:** `R-RZEKI-PERF-FALA138` · sibling ujścia: `BUG-RZEKI-UJSCIE-FALA138`.

---

## BUG-RZEKI-UJSCIE-FALA138 — regres: rzeki kończą się w środku lądu · STATUS: **GOTOWE (kod)** (2026-08-01)

**Cytat Macieja (~19:18):** część rzek urywa bieg na lądzie zamiast ujściem w inną rzekę / ocean.

**Root cause:** `finalizeCoastAndInlandWater` **po** `ensureRiverOutlets` zmieniało wybrzeże → ujścia stawały się „w środku lądu"; brak bramki po topUp.

**Fix (kod):** `9c4320b` — `ensureRiverOutlets` po topUp + **ponownie po** `finalizeCoastAndInlandWater`; `scrubStrayRiverHexMarks`.

**Wynik smoke (12 map):** **0** tras bez ujścia, **0** sierot hex. tsc PASS.

**Powiązane:** `R-RZEKI-UJSCIE-FALA138` · sibling perf: `BUG-RZEKI-PERF-FALA138`.

---

## BUG-RZEKI-MEDIUM-JOIN-FALA180 — średnie / „samotne” nie wpadają do main · STATUS: **✅ NA ROBOCZA — czeka werdykt** (`ab9e6d3c`, 2026-08-02 18:17)

**Cytat / playtest (robocza `13beb5fb`, po FALA 173–180):** nadal samotne odcinki rzek; **większość średnich (drugi rzut) w ogóle nie wpada do głównej**. Screeny w czacie.

**Decyzja wdrożenia (2026-08-02 ~15:13):** Maciej — wstrzymanie zdjęte; **opcja 2** (dopływy od main co 4 boki hex, prostopadle, max dystans aż góry/inna rzeka / soft stop ~3). Tor A* „celuj w sieć” na razie nie.

**Krytyczne wymaganie (Maciej):** średnia musi być połączona z siecią (start z main).

**Wdrożenie:** FALA 181–187 · ROBOCZA `ab9e6d3c` (co 4 L/R, oxbow, centrum 5×5, no-wrap 120°, render bez wybrzeżników).

---

## MAP-PANGEA-SHAPE-FALA187 — Pangea za regularna / prostokąt · STATUS: **✅ NA ROBOCZA — czeka werdykt** (`ab9e6d3c`, 2026-08-02)

**Cytat Macieja:** Pangea wygląda jak regularny prostokąt; chce ~5 zbliżonych kontynentów zlewających się w jeden nieregularny ląd.

**Rozwiązanie:** `buildPangeaBlobCenters` + `landMaskPangea` (suma+max blobów, bez `edgeRect`/`centerBias`). Test `pangea-land-shape-test.cjs`.

---

## BUG-RZEKI-MEDIUM-WRAP-CENTER-FALA187 — dopływy: zawijanie na heksie + kierunek ku centrum · STATUS: **✅ NA ROBOCZA — czeka werdykt** (`ab9e6d3c`, 2026-08-02)

**Cytat Macieja:** dopływy mają wpadać najbliższym połączeniem, bez zawijania na heksie; mają też kierować się ku centrum kontynentu (5×5).

**Root cause zawijania:** detektor szukał skrętu 60°; owijanie heksu = **120°** (Δdir ±2) + chord 1.

**Rozwiązanie:** `isHexWrapTriplet` / `trimMediumBranchHexWrap` / `trimMediumJoinHexWrap`; `pickPerpDirTowardLandCenter` + silniejszy `scoreRiverStepTowardLandCenter` w grow medium; `mediumRiverRenderPath` (widoczność).

---

## SPAWN-CLUSTER-SOLID-FALA185 — równomierny rozkład civ (bryły) · STATUS: **✅ NA ROBOCZA — czeka werdykt** (`ab9e6d3c`, 2026-08-02)

**Problem:** kupki terytoriów + puste ćwiartki mimo sep stolic; MP kleją granice.

**Decyzja:** sep między dowolnymi miastami różnych civ; maximin + bias ćwiartek; bufor MP; 1–2 iteracje wyrównania. **Zakaz:** luzowanie sep stolic, szachownica, samo ↑N bez bufora.

**Wdrożenie:** FALA 185 + fix ćwiartek (`enforceQuarterSpreadOnCenters`, twardy filtr) · ROBOCZA `ab9e6d3c`.

---
## BUG-SCENA-PERF-FALA138 — Budowanie sceny: bardzo długo (~kilkanaście minut) · STATUS: **W TRAKCIE** (FALA 150 — instrumentacja + diagnoza)

**Cytat Macieja (~19:03):** „Rzeki Uzupełnienie to może jedna sekunda natomiast budowanie sceny nadal trwa bardzo długo. Coś jest nie tak. Do zapisania. Jak napiszę Działa i to wtedy zaczniesz to analizować."

**Eskalacja (~19:06):** „budowanie sceny całkowicie chyba zawiesza do weryfikacji i testu" — wstępnie podejrzenie hang/freeze.

**Korekta diagnozy (~19:15):** „OK, przynajmniej wiemy, że to nie jest zwieszanie się, tylko po prostu bardzo długi okres generowania. Na pewno to było teraz kilkanaście minut." — **NIE hang/freeze**, lecz **bardzo długie Budowanie sceny (~kilkanaście minut)**.

**Fix FALA 139 (niewystarczający):** `mergeDecor.ts` (merge bez pełnego updateMatrixWorld); `mapRenderStyle.ts` (`robloxLite` >8000 hex); `scene.ts` (batch medium rzek 32/trasa). Deploy `73c18fc2` — **nie rozwiązał** problemu w grze.

**Weryfikacja Macieja (~20:58, FALA 140 `935d1642`):** rzeki **~20 s OK**; **Budowanie sceny nadal za długo** — „tak nigdy nie było". **Hipoteza:** wąskie gardło to **inne elementy sceny** (nie samych rzek).

**Korekta diagnozy (~21:11):** *„ilość generowanych rzek jest zadowalająca. Problem leży w tym ostatnim etapie."* — **gęstość/mapgen rzek = OK**; problem = **ostatni etap UI = Budowanie sceny** (nie generowanie rzek). Plan eksperymentu kill-switch wyłączania rzek (stage 0–5) → **ODŁOŻONY / NIE POTRZEBNY** na razie.

**Fix FALA 141 (w toku):** coast InstancedMesh + shared geo (`6556fa7`). Deploy `0b70e93f` (21:06) — **W TRAKCIE** (deploy mógł wisieć).

**Fix Pangea-only (kod 2026-08-01 ~22:33):** `isDenseLandmassMap` + skip collapse lasów + batch rzek/yield. **Patch odłożony z deployu** (Maciej): `dyspozycje/_handoff/PATCH-SCENA-PANGEA-PERF-2026-08-01.patch`.

**Fix FALA 145 (kod 2026-08-01 ~22:58):** Maciej — **przyczyna = rzeki** (nie dekoracje). Cofnięto skróty FALA 144: piasek lądu przy brzegu, `blendedTerrainHex`, wydmy 3D, oazy 3D, pełny overlay collapse, pełny coast collect. Flaga `isRiverRenderFast` (ex-`sceneBuildAggressive`) steruje **wyłącznie** tor rzek: batch 96, ribbon 4/5, batch ujść, yield. **Bez deployu** — czeka na pomiar.

**Diagnoza FALA 149 (~23:37, Maciej):** `riverRenderStage=0` (zero meshów rzek w buildScene) — **Budowanie sceny nadal bardzo długo**. Etapy UI „Rzeki — główne" / „Rzeki — uzupełnianie" to **mapgen** (`generator.ts` → `MAP_GEN_PHASE_LABELS.riversMain` / `riversFill`), **nie** render sceny. Wąskie gardło **≠ mesh rzek** — podejrzenie: pętla heksów i/lub overlay collapse (`styledOverlays`).

**Fix FALA 150 (kod 2026-08-01 ~23:40):** instrumentacja `performance.now()` w `buildScene` → `console.info('[civ] buildScene ms', { hexes, coast, overlays, rivers, tail, total })`; overlay UI z fazami: heksy / brzeg / nakładki / rzeki (lub „pomiń rzeki") / finał. **Bez deployu** — czeka na pomiar Macieja (F12).

**Root cause (częściowy, FALA 138):** ~637 ścieżek rzek + ~40k hex; `mapDetail=high` nie włączał `robloxLite`; `collapseToMergedMesh` wołał `updateMatrixWorld(true)` per overlay wybrzeża.

**Objaw:** etap UI „Budowanie sceny" trwa **bardzo długo**; etap „Rzeki — Uzupełnienie" ~**1 s** (OK, **mapgen**); etap „Rzeki — główne" ~**20 s** (OK, **mapgen**).

**Osobny temat:** `BUG-RZEKI-PERF-FALA138` — **ZAMKNIĘTE** (~20 s OK).

**Powiązane:** `REJESTR-PROSB-I-ZADAN.md` → `R-SCENA-PERF-FALA138` · `R-RZEKI-KILLSWITCH-DIAG` (**ZAMKNIĘTE częściowo** — stage 0 nie pomógł; FALA 150 = nowa instrumentacja).

---

## BUG-RZEKI-SETTLE-VIS — rzeki niewidoczne przy zakładaniu pierwszego miasta · STATUS: **✅ ZAMKNIĘTE** (Maciej 2026-08-01 ~23:15: rzeki widać przy starcie / 1. mieście)

**Objaw:** w trybie wyboru miejsca na pierwsze miasto (onboarding settle) rzeki niewidoczne na mapie; po zbudowaniu miasta nagle się pojawiają. Gameplay/mapgen OK — problem renderu + mgły.

**Root cause:** (1) na mapach gęstych (Pangea) główne rzeki trafiały do batch merge bez `pointHex` → reguła „cała wstęga albo nic"; (2) brak wyjątku mgły dla oświetlonego kręgu startu przed pierwszym miastem.

**Fix:** `scene.ts` — główne rzeki zawsze osobny mesh + `pointHex`; `setFog` opcja `riverRevealKeys`; `main.ts` — `startRevealKeysForRiverFog()` w `refreshFog` gdy `isAwaitingFirstPlayerCity()`.

**Powiązane:** historyczny bug rzeka↔mgła (`STAN-PRACY-HANDOFF.md` §7).

---

## BUG-SPAWN-CLUSTER-KULTURA — cywilizacje tego samego typu rozjeżdżają się między kręgami · STATUS: **✅ ZAMKNIĘTE** (Maciej 2026-08-01 ~23:15: rozkład cywilizacji OK)

**Sytuacja.** Po MAP-SPAWN-Q2 (wyspy, quota kontynentów, FALA 138) spawn działa lepiej na poziomie mas lądu, ale Maciej widział regresję **jakości klastrów kulturowych**: cywilizacje jednego typu czasem „przerzucają się" do kręgu innego typu zamiast generować się **wszystkie razem wokół siebie** (stolica + miasta-państwa tego samego typu w jednym skupisku).

**Fix (2026-08-01):** `clusters.ts` → `assignTypesToClusterCenters()` — typy przypisywane do środków **po** finalnych pozycjach i masach lądu (quota `allocateTypyToMasses`), nie shuffle po indeksie. `clusterCohesionMaxHex()` + test spójności MP w `cluster-start-test.cjs`.

**Powiązane:** `REJESTR-PROSB-I-ZADAN.md` → `R-SPAWN-CLUSTER-KULTURA` · kontekst historyczny: MAP-SPAWN-Q2 (FALA 138).

---

## BUG-SPAWN-ODLEGLOSC-MORZE — start cywilizacji za blisko morza · STATUS: **WDROŻONE (kod)** (2026-08-01)

**Sytuacja.** Maciej oczekuje, że cywilizacje (zwłaszcza główna / stolice startowe) na mapie **standardowej** startują **co najmniej ~10 heksów od morza** — miejsce na miasta-państwa, unikanie wysp i dziwnych miejsc, preferencja większych lądów. Parametr ma się **skalować z wielkością mapy** (10 = baza dla Standard; Mała/Duża inne wartości).

**Fix (2026-08-01):** `clusters.ts` → `buildSeaDistanceField` + `capitalMinSeaDist()` (mala=4, srednia=7, **duza/Standard=10**, ogromna=12, super=14) + `capitalMinSeaDistForMap` (clamp do rozmiaru; mapy <80 hex boku → 0 dla harnessów) w pick stolic; końcowa bramka stolicy gracza.

**Powiązane:** `REJESTR-PROSB-I-ZADAN.md` → `R-SPAWN-ODLEGLOSC-MORZE` · sibling: `BUG-SPAWN-CLUSTER-KULTURA`.

---

## BUG-MP-TRYBUT-WOJNA — miasto-państwo: DOW + „Oferta trybutu przyjęta" w jednej turze (Tarent) · STATUS: **WDROŻONE (kod, 2026-08-02)**

**Sytuacja.** Audiencja z Tarent · Rzymianie · miasto-państwo: status WOJNA, czynnik „Wypowiedzenie wojny" oraz „Oferta trybutu przyjęta" (+5) — sprzeczność; akcja 8 w UI = „Niedostępne u miasta-państwa".

**Root cause.** Obcy typ MP (np. Tarent) jest w `typCityCopyOwners` / `isOwnerClusterCityState`, ale NIE w `simplifiedDiplomacyOwners` (tylko rywale tego samego typu). Silnik traktował go jako pełną dyplomację (`full` layer) → `decideAIDiplomacy` generował trybut, `evaluateProposal` akceptował, a w tej samej turze `shouldCityStateRollWarOnPlayer` (PM hard) wypowiadał wojnę.

**Fix (2026-08-02):** Blokada trybutu dla WSZYSTKICH miast-państw (AI + evaluateProposal + gaszenie pending przy DOW). Branch `cursor/fix-cs-war-tribute-contradiction-63a1`.

**Powiązane:** `REJESTR-PROSB-I-ZADAN.md` → `R-MP-TRYBUT-WOJNA`.

---

## BUG-MP-NAZWA-CIV-MISMATCH — miasto-państwo: nazwa miasta ≠ kultura/cyw (Jin vs Argos·Grecy) · STATUS: **✅ ZAMKNIĘTE** (Maciej 2026-08-01 ~23:15: rozkład/etykiety OK w playteście)

**Sytuacja.** Obce miasto-państwo na mapie: tytuł miasta **Jin** (brzmi chińsko), podpis **Argos · Grecy · miasto-państwo**, dyplomacja „Audiencja z Argos · Grecy · miasto-państwo". Drugi screen (~21:14): skupisko miast-państw w czerwonej granicy / przy rzekach — Maciej: *„chińskie państwa miasta system określa jako państwa miasta greckie, coś jest nie tak z Chińczykami"*.

**Fix (2026-08-01):** Rozdzielenie alokacji `ownerId` — obce typy dostają ID 1..N w `cluster-spawn.ts`; rywale tego samego typu **zarezerwowane** w `pendingSameTypeRivalOwnerIds` po obcych; `main.ts` `spawnPendingSameTypeRivals` używa zarezerwowanych ID + **nie nadpisuje** `aiOwnerCivMap` obcego typuna kolizji (fallback wolne ID). Kontrakt: `cluster-start.ts` + test kolizji w `cluster-start-test.cjs`.

**Powiązane:** `REJESTR-PROSB-I-ZADAN.md` → `R-MP-NAZWA-CIV-MISMATCH` · sibling (osobny): `BUG-SPAWN-CLUSTER-KULTURA` (rozmieszczenie typów na mapie).

---

## BUG-DYPLO-AI-LABEL — lista dyplomacji: „AI 32" zamiast nazwy miasta · STATUS: **✅ ZAMKNIĘTE (kod 2026-08-02)**

**Sytuacja.** Panel Dyplomacja / znane cywilizacje: wpisy **AI 32**, **AI 34** (Kamień, Ludność: 0, Neutral) zamiast Sparta/Mykeny/Tarent itd. Egipt i pełne nacje OK.

**Przyczyna.** `resolveOwnerBaseName` fallback `AI ${ownerId}` gdy brak `aiOwnerCivMap` / `ownerDisplayName` / miasta — typowo **duchy po eliminacji** (Q5=B kasuje roster, ale `diplomaticallyDiscoveredOwners` zostawał). Ludność: 0 = ten sam byt (brak miast, nie osobny bug nazewnictwa).

**Fix:** `sanitizeOwnerDisplayBase` + pula `clusterRivalCityName` w `ownerDiploLabel`; `eliminateOwner` czyści `diplomaticallyDiscoveredOwners`; lista filtruje `eliminatedOwners` / nieaktywnych; load sejwu pomija wyeliminowanych w discovered.

**Pliki:** `gra/src/game/display-names.ts`, `gra/src/main.ts`, `gra/tools/display-names-test.cjs`.

---

## BUG-LAND-FRACTION-SLIDER — suwak % lądu prawie nie działa · STATUS: **WDROŻONE FALA 191 (kod, 2026-08-02)** (Maciej 2026-08-01 ~22:25; regres playtest 2026-08-02)

**Sytuacja.** W opcjach nowej gry „Udział lądu na mapie” (20% / 40% / 80%) — mapa wygląda tak samo. Szczególnie Pangea.

**Root cause FALA 191:** UI % dochodzi OK; maska Pangea używała tylko boolean `sparseLand` (≤35%) → 50% i 80% = ten sam footprint. Fix: `pangeaLandLayoutParams(landFraction)` skaluje bloby/ring/clusterFade.

**Otwarte (cicho):** faktyczny % lądu nadal niższy od suwaka (np. 20%→~4%, 80%→~52%) przez ocean brzegowy + wybrzeża — osobny temat kalibracji, nie blokuje różnicy 20 vs 80.

**Cel.** Po generacji suchy ląd wyraźnie rośnie z suwakiem; idealnie ≈ wybrany % (±5 pkt) — kalibracja absolute %.

**Powiązane:** scena Pangea (osobny), spawn MP.

---

## SPAWN-EXPANSION-ARC-Q1 — państwa tylko z jednej strony stolicy · STATUS: **🟢 WDROŻONE (kod)** (Maciej 2026-08-01)

**Decyzja:** **A — półpłaszczyzna (180°)**. MP tego samego typu tylko po jednej stronie stolicy; druga połowa wolna pod własne miasta.

**Plik:** `docs/decyzje/SPAWN-EXPANSION-ARC-Q1.md` · kod: `clusters.ts` + `cluster-spawn.ts` · test `cluster-start-test.cjs`.

---

## UI-LABOR-SLIDER-FOOD-PARITY — podwójny pasek PODZIAŁ PRACY · STATUS: **WDROŻONE (kod)** (2026-08-01)

**Sytuacja.** Panel miasta → PODZIAŁ PRACY: gruby pasek % (złoty/niebieski) + osobny cienki track suwaka pod spodem. Maciej: identycznie jak suwak Wyżywienie (żywność) — jedna kontrolka.

**Fix (2026-08-01):** `cityPanel.ts` → `renderPodzialPracy`: usunięty `praca-split-bar`; jeden `slider-row` + `input[type=range]` jak `renderMagazyn` / Wyżywienie. Chipy + lista szczegółów bez zmian.

---

## SPAWN-SEP-STOLICE — odległość stolic różnych cywilizacji · STATUS: **✅ ZAMKNIĘTE** (Maciej 2026-08-02 ~15:22, korekta ~23:30)

**Decyzja:** Playtest rozkładu civ OK; FALA 182: **+2 hex sep stolic na każdym rozmiarze**. Korekta 2026-08-02 wieczór: **Standard (duza) +1 hex** (14→**15**); Mała/Średnia **12**, Duża **16**, Super **19** bez zmian. Nie rozsuwa MP w klastrze (pierścień 5 hex). `capitalMinSeaDist` bez zmian.

**Kod:** `clusters.ts` LUT + testy `capital-sep-unit-test.cjs`, `capital-sep-pangea-test.cjs`, `cluster-start-test.cjs`. Rejestr: `R-SPAWN-SEP-STOLICE-15`.

## BUG-PANGEA-RECT-FALA188 — Pangea nadal prostokąt po FALA 187 · STATUS: **W TRAKCIE** (playtest `ab9e6d3c`, 2026-08-02 ~18:27)
**Cytat / screen:** ląd jak wypełniony prostokąt + cienka ramka oceanu; 7 civ → widoczne **4**; dużo pustego miejsca.
**Akcja:** diagnoza rebalance/maska + dropy klastrów (bez luzowania sep).


## BUG-RZEKI-COAST-PARALLEL-FALA188 — rzeki wzdłuż boków Pangei, brak dopływów · STATUS: **W TRAKCIE** (playtest `ab9e6d3c`, 2026-08-02 ~18:29)
**Cytat:** miały iść ku centrum; „zabijają się wzdłuż boków prostokąta”; zero widocznych dopływów — regres.
**Hipoteza:** prostokątny ląd → coast-inland równolegle do boku; medium niewidoczne / nie spawn.

## PERF-SUPER-HUGE-PANGEA-80 — gen ~14,6 min wall-clock · STATUS: **W TRAKCIE** (Maciej 2026-08-02 ~20:23)

**Źródło:** `Downloads/civ-perf-super-huge-pangea-20260802-202347.txt` · bundel `ea234151` · Super Huge · Pangea · **319 872 heksów** · ~80% lądu.

| Etap | Czas |
|------|------|
| Ląd i ocean | 14,3 s |
| Relief | **77,0 s** |
| **Rzeki — główne** | **523,0 s (~8,7 min)** ← ~70% generatora |
| Rzeki — uzupełnianie | 113,2 s |
| RAZEM generator | **746 s (~12,4 min)** |
| Scena — heksy | **110,9 s** |
| RAZEM scena | **120,8 s** |
| **WALL-CLOCK** | **873,6 s (~14,6 min)** |

**Porównanie:** Duży Pangea ~40k hex → wall ~13,5 s, rzeki główne ~4,4 s (**~64× wolniej rzeki przy ~8× więcej hexów**).

**Root cause (quota):** `pangeaBootstrapRiverTarget` cap 32 + `maxCellsToProcess=72` + `gridStride=3` → ~32 główne na ~256k hex lądu (~8000 hex/rzekę). Fix w źródłach: skala z `landHexCount`, `pangeaMaxGridCellsToProcess`, obwarzanek radial fill.

**Akcja:** audyt+fix obwarzanek + quota rzek + perf `RiverHexSpatialIndex` (bez cięcia pokrycia). **NIE deploy** do potwierdzenia w źródłach.

## BUG-OBWARZANEK-20PCT — pierścień morza przy 20% lądu · STATUS: **W TRAKCIE** (FALA 195 w deploy)
**Cytat Maciej 2026-08-02 ~21:22:** przy 20% lądu nadal obwarzanek; „jest miejsce na ląd”.
**Root cause:** `valley` w `pangeaLandLayoutParams` było **najwyższe przy niskim %** → dolina między rdzeniem a pierścieniem blobów; `ringPull` tylko przy wysokim %; annular fill za wąski.
**Fix Grok:** valley spłaszczone; ciasne bloby; `ensurePangeaSingleContinent`; test 20% annular=0 / 1 masa.

**Cytat:** „Ustawiłem siedem, a pojawia się pięć” + słabe rozłożenie.
**Fix:** top-up klastrów po dominance/`continue`/HARD sep; dominance nie dropuje. Test: caps **7/7**; spread Q jeszcze słaby na części seedów Standard.

## BUG-ZIEMIA-SCALE — Duża/Huge/SH: ląd „ten sam”, rośnie woda · STATUS: **W TRAKCIE** (cap polar ocean)
**Przyczyna:** `earthPolarOceanRows` skalował liniowo (~52% wysokości = ocean). Cap max ~12% wysokości na biegun.

## BUG-RZEKI-MEDIUM-FOW — rzeki znikają przy wyłączeniu FoW (F) · STATUS: **REGRESJA / FIX v2** (2026-08-04)
**Objaw:** FoW ON — widać cienkie niebieskie rzeki (medium) w oświetlonym obszarze; FoW OFF (F) — brak rzek w okolicy miasta.
**Root cause:** `lastFogSig=0` przy FoW ON (wszystkie punkty odkryte) kolidowało z `fullSig=0` przy FoW OFF → pomijane `setIndex` pełnej wstęgi; dodatkowo `scene.fog` przy FoW OFF gasił ujścia na `coastDeltaMat` (brak `fog:false`).
**Fix v2:** sentinel `RIVER_FOG_SIG_OFF=-1` + helpery w `riverLod.ts` (`needsRiverRibbonIndexUpdate`, `buildRiverRibbonFullIndex`); `coastDeltaMat.fog=false`; test 12/12 `river-fog-visibility-test.cjs`.
**Poprzedni fix:** bed385c (FALA 202) — niewystarczający przy kolizji sig=0.
**Weryfikacja ręczna:** Ctrl+F5 + Nowa gra → okolice miasta → F ON (rzeki widoczne) → F OFF (rzeki nadal widoczne na całej mapie).

## BUG-RZEKI-LODOWCE — brak rzek w pasie lodowców / polarnym na brzegu kontynentu · STATUS: **GOTOWE (kod)** (2026-08-02)
**Objaw:** biały pas polarny przy brzegu — zero ujść/startów rzek; rzeki tylko w zielonym lądzie głębiej.
**Root cause:** `isRiverLandTerrain` (`gen-helpers.ts` ~6596) nie zawierało `TerenBazowy.Polarny` → wykluczenie z kandydatów ujść (`collectCoastMouthCandidates`), grow path, markRiverEdge, medium fill.
**Fix:** dodać `Polarny` do `isRiverLandTerrain` (lodowiec nie blokuje generacji — odpływ może zamarzać wizualnie później).
**Weryfikacja:** `tsc` + `medium-river-test.cjs` + `map-gen-regression-test.cjs` + `polar-river-mouth-diag.cjs`.

## AC-RZEKI-PER-MASA — każda wyspa/masa jak kontynent · STATUS: **ZEBRANE** (Maciej 2026-08-02 ~22:27)
**Cytat:** zasady obowiązujące dla kontynentu mają obowiązywać **dla każdej wyspy** — nie generować masy lądu bez rzek.
**Powiązanie z audytem obwarzanka:** przy 20–60% Pangea zostają **2 masy suchego lądu** rozdzielone korytarzem **Wybrzeża** (nie Morza); rzeki gęste przy brzegu (0–5), interior/„wyspa wewnętrzna” sucha. Kod ma `landMassHasMainRiver` / topUp per masa, ale filtr `m.length >= 8` + ścieżka Pangea coast-only + ensure ślepy na Wybrzeże → luki.
**Wdrożyć razem z fixem obwarzanka (po wyborze A/B/C mostu przez Wybrzeże).** Nie osobny wątek ABC.

## AC-RZEKI-BEZ-LIMITERA — brak cap liczby / czasu siewu · STATUS: **ZEBRANE** (Maciej 2026-08-02 ~22:28)
**Cytat:** „nie powinno być żadnego limitera ilości rzek. Po prostu powinny się generować zgodnie z zasadami bez limitu. Powinny tak długo siewić jak są w stanie siewić, a nie kończyć się np. po jakimś wyznaczonym czasie lub długości."
**Implikacja:** usunąć/wyłączyć twarde capy typu `pangeaBootstrapRiverTarget` (~32), `maxCellsToProcess`, quota `capRiverQuotas` / `mapGenMaxRivers*`, early-stop po budżecie czasu; siew aż reguły (źródło, sep, ujście, masa) nie dadzą kolejnej poprawnej rzeki. `maxLen` trasy = ograniczenie techniczne A* jednej ścieżki — rozróżnić od limitu **liczby** rzek (ten drugi = zakazany).
**Wdrożyć w paczce rzek z AC-RZEKI-PER-MASA + fix obwarzanka.** Uwaga: bez limitu na Super Huge wall-clock mocno urośnie — perf osobno, nie przez cięcie pokrycia.

## BUG-INKOWIE-MP-BRAK — Inkowie bez miast-państw · STATUS: **WDROŻONE ROBOCZA** (FALA 201 `48646cd6`, 2026-08-02)

**Źródło:** Maciej 2026-08-02 — Cusco jako „OBCE MIASTO / Inkowie" bez klastra MP wokół stolicy.

**Root cause (2 warstwy):**
1. **Placement:** po FALA 185 body-sep obce klastry często zostawały capital-only (ciasny Voronoi / pierścień 5 poza lądem / bufory).
2. **Spawn:** deferred `spawnPendingForeignClusters` odrzucał sloty przez `canFoundCity` (dystans do już założonych miast), mimo że plan klastra już je zweryfikował.

**Fix:**
- `repackAllSparseClusterStateCities` po body-sep — pack z pełnego lądu + last-resort (luźniejszy bufor, pierścienie 5→2, desperate bez buforów).
- `clusterStartSlot` w `canFoundCity` / `foundCityAt`; `main.ts` przekazuje `true` przy foreign spawn.
- Test: seeds 1–20 Inkowie 20/20 z MP; seed 25 Cusco+4 MP spawn OK. Diag 1–40: onlyCap=0.

**ID rejestru:** R-INKOWIE-MP-BRAK · branch `cursor/fix-inkowie-mp-missing-63a1`

## BUG-KOLEJKA-ZWROT-SUROWCA — anulowanie budynku nie zwraca koszt_surowce · STATUS: **WDROŻONE ROBOCZA** (FALA 201 `48646cd6`, 2026-08-02)

**Źródło:** Maciej 2026-08-02 — usunięcie budynku z kolejki Pracy nie zwracało surowca pobranego przy enqueue.

**Root cause:** `addItem()` w `cityPanel.ts` pobiera `koszt_surowce` raz przy dodaniu do kolejki (`deductBuildingStockCostAcrossCities`); przyciski ✕/`Usuń` wołały tylko `dequeue()` — bez zwrotu. Rekrutacja miała już `onCancelRecruitment`; kolejka budowy — nie.

**Fix:** `refundBuildingStockCostAcrossCities` + `cancelQueueItem()` (zwrot → dequeue). Praca nie jest pobierana z góry — postęp się gubi (OK).

**Test:** `node tools/building-queue-refund-test.cjs` — 5/5 PASS.
**ID:** R-KOLEJKA-ZWROT-SUROWCA · branch `cursor/fix-queue-cancel-refund-63a1`

## BUG-BARB-GLOD — barbarzyńcy bez głodu + rajd po 2 jednostkach · STATUS: **WDROŻONE (kod)** (2026-08-02)

**Źródło:** Maciej 2026-08-02 — barbarzyńcy nie powinni mieć głodu; gdy obóz ma 2 wojowników, od razu maszerują na najbliższą cywilizację.

**Root cause głodu:** `advanceEmpireFood` zbierał `ownerId` z jednostek na mapie — barbarzyńcy (`BARBARIAN_OWNER_ID=-1`) dostawali tick bez miast/produkcji, koszt armii schodził z pustych zapasów → `glodWojska` + atrycja HP.

**Fix głód:** `empire-food.ts` pomija `isBarbarian(ownerId)`; `isArmyHungry`/`isArmyStarving` zwracają false dla barbarzyńców.

**Fix rajd:** `isCampRaidReady` (>= `unitsPerCamp` wojowników lądowych w `campControlRadius`) → `decideBarbarianMoves` ignoruje `aggroRadius` i maszeruje ku najbliższemu miastu/jednostce cywilizacji; `main.ts` ustawia `campId` przy spawnie i daje `ruchLeft` gdy obóz osiągnie cap.

**Test:** `barbarians-test.cjs` 157/157 · `empire-food-b5-test.cjs` 19/19 PASS.
**ID:** R-BARB-GLOD-ATAK · branch `cursor/fix-barb-no-hunger-attack-63a1`

## BUG-PRACA-OVERFLOW-BUDOWA — pusta kolejka + suwak na budowę · STATUS: **NAPRAWIONE (kod)** (2026-08-02)
**Sytuacja.** Miasto bez budynku w kolejce, suwak PODZIAŁ PRACY 100% budowa / 0% pula → cała Praca miasta powinna trafiać do puli cywilizacji (HUD: Praca +N). HUD pokazywał +0.
**Przyczyna.** Regresja z commit `6e1e0e48` (NAPRAWA HUD-PRACA 2026-07-26): `refreshLiveEmpireRates()` liczył `_lastPracaRate` tylko z `playerEcon.doPuli`, pomijając `doBudynkow` przy pustej kolejce. Tick końca tury (`pracaImperialPoolGain` w main.ts ~19431) był poprawny — dotyczyło głównie podglądu HUD.
**Fix:** `previewPracaPoolBrutto()` w `production.ts` + pętla per-miasto w `refreshLiveEmpireRates()` (main.ts ~11367) z `cityProd` / `frontItem`. Test: `production-overflow-test.cjs` §7 (24/24 PASS).
**Czeka:** deploy FALA 205.

---

## MAP-UX-CLUSTER-LABEL — 4 bliskie etykiety miast (stolica vs MP) · STATUS: **OTWARTE** (audyt 2026-08-02, bez zmiany kodu)

**Źródło:** Maciej: 4 bliskie etykiety (np. krótkie nazwy ~2–4 hex); pamięta min. ~12 hex między stolicami.
**Audyt:** `dyspozycje/AUDYT-STOLICE-VS-MIASTA-PANSTWA-2026-08-02.md` · **VERDICT: DESIGN_KLASTRA** — sep stolic Standard=14 twarde; skupisko = 1 stolica + MP (pierścień 5 hex). Menu Standard min 4 MP → dokładnie 4 etykiety w klastrze.
**NIE bug bramki** — nie zmieniać sep/pack bez decyzji.

**ABC (tylko jeśli chce czytelniejszy UX mapy):**
- **A)** Zostawić (dopisek „· miasto-państwo” na chipie MP).
- **B)** Stolica obca = nazwa cywilizacji; MP = nazwa miasta + dopisek.
- **C)** Marker wizualny stolicy (korona/obwódka), nazwy bez zmian.
**Rekomendacja:** B (gdy w ogóle zmieniać).
