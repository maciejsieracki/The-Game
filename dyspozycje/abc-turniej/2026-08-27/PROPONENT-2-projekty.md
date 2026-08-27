# PROPONENT 2 — projekty ABC (turniej C-018)

**Data:** 2026-08-27 · **Autor:** Proponent 2 (Sonnet 5) · **Tryb:** niezależny, bez
podglądu projektu Proponenta 1, na podstawie surowych faktów źródłowych z zamkniętych
audytów. Fakty zweryfikowane bezpośrednio w kodzie repo przed napisaniem pytań (patrz
adnotacja weryfikacyjna na końcu każdego tematu).

Każdy projekt przeszedł test zrozumiałości §10a: da się przeczytać na głos komuś spoza
projektu, treść pytania nie zawiera ścieżek plików/nazw funkcji/narzędzi/numerów
paragrafów (te są w odnośniku pod pytaniem), a warianty różnią się skutkiem dla gry i
gracza, nie sposobem wykonania.

---

## TEMAT 1 — R-DYPLO-FLAGA-MIASTO-PANSTWO-NIE-GASNIE-Q1

### Sytuacja

Audyt wypowiedzeń wojny w epoce Kamienia zmierzył coś zaskakującego: w tej epoce **nigdy**
żadna cywilizacja nie wypowiada wojny żadnej innej — zero przypadków na ponad 500
przegranych turach, wielu mapach i wszystkich sześciu cywilizacjach, sprawdzone trzema
niezależnymi sposobami pomiaru. To nie jest rzadkość — to całkowita cisza.

Mechanizm, który miał to zmieniać — wojna wymuszona epoki Kamienia, uruchamiana po
pewnym czasie od startu gry — istnieje w kodzie i jego własne testy przechodzą. Problem
jest o piętro wyżej: gdy AI innej cywilizacji (nie gracz, nie automat wspierający gracza)
zdobędzie siłą swoje pierwsze miasto należące wcześniej do małego, neutralnego
miasta-państwa — co w każdej sprawdzonej grze zdarza się bardzo wcześnie, tura 6–8 — gra
zaczyna traktować **tę zdobywającą cywilizację samą** tak, jakby ona sama była takim
małym miastem-państwem. Na stałe, do końca gry. A małe miasta-państwa są z mechanizmu
wojny świadomie wyłączone. Ten status znika tylko wtedy, gdy cywilizacja przejmuje
miasto-państwo pokojowo — nigdy, gdy robi to siłą, czyli w praktyce prawie nigdy nie
znika, bo pierwsze podboje miast-państw prawie zawsze są zbrojne.

Skutek: do czasu, gdy wojna wymuszona miałaby się w ogóle uruchomić, wszystkie
cywilizacje w grze są już trwale wykluczone z bycia jej celem. Mechanizm, który
właściciel już zaprojektował i zatwierdził (moment startu, sposób wyboru celu, warunki
zakończenia), nigdy nie dostaje szansy zadziałać.

### Cel pytania

Zdecydować, jak szeroko i dla jakich gier naprawić ten stan, żeby już zatwierdzony
mechanizm wojny wymuszonej mógł faktycznie zacząć działać.

### Dlaczego teraz

Problem jest w pełni zdiagnozowany (nie potrzeba dalszych pomiarów) i konkretny: znana
jest dokładna przyczyna, dokładny moment jej powstania w każdej grze i dokładny warunek,
który ją usuwa (a którego prawie nigdy nie da się spełnić w praktyce). Każda kolejna
rozgrywka i każdy kolejny test zawartości związanej z wojną w epoce Kamienia dalej
milcząco zakłada świat, który nigdy się nie kłóci — to koszt, który rośnie z każdym dniem
zwłoki.

### Warianty

**A — Pełna korekta, natychmiast, dla wszystkich gier (także już rozpoczętych)**

Cywilizacja przestaje być trwale traktowana jak miasto-państwo od razu po zdobyciu
pierwszego miasta siłą — dotyczy to tak samo gier zaczętych od dziś, jak i partii, które
gracze mają już w toku.

Za:
1. Naprawia problem u źródła dla każdego gracza od razu — także tych, którzy dziś grają
   w partii utkniętej w bezruchu, bez potrzeby zaczynania nowej gry.
2. W pełni realizuje intencję decyzji już podjętej o wojnie wymuszonej — ten mechanizm
   zaczyna wreszcie robić dokładnie to, co miał robić, wszędzie i od razu.

Przeciw:
1. Gracz w trakcie rozgrywki może zobaczyć nagłą zmianę zachowania cywilizacji, które do
   tej pory się nie odzywały — jeśli ten sam status wpływa też na coś innego niż tylko
   wojnę (czego dziś nie zmierzono), zmiana może się ujawnić w nieoczekiwanym miejscu.
2. To najszerszy z trzech zakresów zmiany, więc niesie też największe ryzyko, że korekta
   naruszy coś, co dziś działa poprawnie właśnie dzięki temu samemu statusowi.

**B — Korekta tylko dla nowych gier; gry już w toku zostają bez zmian**

Zasada się zmienia, ale tylko dla partii zaczętych po wprowadzeniu poprawki. Rozgrywki
już trwające dalej działają dokładnie tak jak dziś.

Za:
1. Zero ryzyka dla graczy będących już w trakcie partii — nikt nie doświadczy nagle innego
   zachowania cywilizacji w połowie swojej gry.
2. Bezpieczniejsze wdrożenie — nie trzeba się martwić o niespodzianki w zapisanych stanach
   gry, które nikt nie przewidział w chwili ich tworzenia.

Przeciw:
1. Każda gra rozpoczęta przed poprawką zostaje z tym problemem do samego końca — dokładnie
   ten sam milczący świat, który audyt właśnie opisał jako niezamierzony, zostaje utrzymany
   dla wszystkich obecnie grających.
2. Nie realizuje w pełni już podjętej decyzji o wojnie wymuszonej dla nikogo, kto gra
   dzisiaj — korzyść dostają wyłącznie przyszli gracze nowych partii.

**C — Wąska korekta: sam mechanizm wojny wymuszonej przestaje liczyć się z tym statusem, reszta zachowania cywilizacji zostaje bez zmian**

Cywilizacja formalnie nadal jest gdzieś w grze traktowana jak miasto-państwo, ale
wyłącznie ten jeden mechanizm — wojna wymuszona — przestaje na to patrzeć i może
wybrać ją jako cel.

Za:
1. Naprawia dokładnie to, co audyt zgłosił jako problem — wojny zaczynają się zdarzać —
   bez dotykania niczego poza tym jednym mechanizmem.
2. Najmniejsze ryzyko efektów ubocznych spośród trzech wariantów, bo zmiana dotyka jednego,
   wskazanego miejsca, a nie ogólnego statusu cywilizacji używanego gdzie indziej.

Przeciw:
1. Zostawia stan wewnętrznie niespójny: cywilizacja nadal jest „miastem-państwem” dla
   wszystkiego poza wojną wymuszoną — jeśli ten status ma dziś jeszcze jakiś inny,
   nieujawniony w tym audycie skutek, ten skutek zostaje nietknięty, dobry czy zły.
2. Nie usuwa przyczyny, tylko jeden jej widoczny objaw — jeśli kolejny mechanizm w grze
   kiedyś też zacznie sprawdzać ten sam status, ten sam błąd może się ujawnić ponownie gdzie
   indziej.

**Sprawdzian wariantu pozornego:** wszystkie trzy mają realnego adresata — A dla kogoś, kto
chce naprawić problem w całości i teraz; B dla kogoś, kto priorytetyzuje zero-ryzyko dla
zapisanych gier; C dla kogoś, kto chce najmniejszą możliwą, punktową interwencję. Żaden nie
jest wariantem, którego nikt by nie wybrał.

### Rekomendacja i typ Proponenta 2

**Typ: A.** Uzasadnienie wprost z profilu: przy wyborze między zakresem ciętym a pełnym
właściciel wybiera pełny nawet kosztem większego diffu (wzorzec §3.2, potwierdzony
co najmniej 4-krotnie) — a B (cięcie czasowe: tylko nowe gry) i C (cięcie funkcjonalne:
tylko jeden mechanizm) to dokładnie dwie odmiany takiego cięcia wobec A. Dodatkowo pasuje
wzorzec §3.1 (odrzucanie „poczekajmy” na rzecz działania teraz, 5/5) — problem jest już w
pełni zdiagnozowany, więc B jako formę odłożenia korzyści na później historycznie
właściciel raczej by odrzucił.

### Adnotacja weryfikacyjna

Zweryfikowano w kodzie: filtr wykluczający miasta-państwa z wojny wymuszonej (funkcja
`isOwnerClusterCityState`, użyta m.in. w bloku wojny wymuszonej Kamienia w `main.ts`
w okolicach linii 28020–28154) rzeczywiście obejmuje **tylko** aktualny status
miasta-państwa, bez rozróżnienia „czy ta cywilizacja przejęła je siłą” — dokładnie zgodnie
z opisem faktu źródłowego. Mechanizm `forced-war-stone.ts` i jego bramki potwierdzone jako
istniejące. Fakt zgodny z kodem, bez rozbieżności.

---

## TEMAT 2 — P-DYPLO-RELACJA-I-SILA-TA-SAMA-LICZBA-Q1

### Sytuacja

Zwykła droga, którą jakakolwiek inna cywilizacja (nie automat wspierający gracza — inna,
rywalizująca cywilizacja) mogłaby wypowiedzieć wojnę **graczowi**, jest dziś przy
domyślnych ustawieniach praktycznie niemożliwa do przejścia. Powód: jedna i ta sama liczba
opisuje jednocześnie dwie różne rzeczy — jak silna militarnie jest dana cywilizacja wobec
gracza, i jak dobre (albo złe) są między nimi stosunki. Im silniejsza wobec gracza staje
się cywilizacja, tym z definicji tej samej liczby stosunki wypadają lepiej, a więc tym
dalej jej do uznania gracza za wroga.

Żeby faktycznie doszło do wypowiedzenia wojny, stosunki muszą spaść bardzo nisko —
znacznie niżej, niż cokolwiek zaobserwowano w 585 pomiarach z realnych rozgrywek
(najgorszy zanotowany wynik to wciąż stosunkowo znośne stosunki, wojna wymaga poziomu
kilkukrotnie gorszego). W praktyce jedyny poziom trudności, na którym komukolwiek udaje
się to osiągnąć, to najtrudniejszy dostępny poziom; na domyślnym, „normalnym” poziomie
trudności nie zdarza się to nikomu.

### Cel pytania

Zdecydować, czy i jak inna cywilizacja powinna móc realnie wypowiedzieć wojnę graczowi na
domyślnym poziomie trudności — nie tylko na najtrudniejszym.

### Dlaczego teraz

Pomiar jest już gotowy i jednoznaczny (585 próbek, nie pojedynczy przypadek) — to nie jest
kwestia „może coś przeoczyliśmy”, tylko potwierdzona arytmetyczna niemożliwość na
domyślnych ustawieniach. Dalsze granie i dalsze audyty dyplomacji będą dalej milcząco
zakładać, że gracz na normalnym poziomie trudności jest z definicji bezpieczny od ataku —
warto to rozstrzygnąć świadomie, zanim narośnie na tym więcej zależnej zawartości.

### Warianty

**A — Rozdzielić siłę i relacje na dwie niezależne miary**

Stosunki cywilizacji do gracza przestają być matematycznym lustrzanym odbiciem jej siły
wobec niego. Nawet bardzo silna cywilizacja może realnie znienawidzić gracza (za złamane
obietnice, agresję, zdradę) i to znienawidzenie — niezależnie od przewagi militarnej —
może realnie doprowadzić do wojny, na każdym poziomie trudności.

Za:
1. Naprawia problem u samego źródła, nie tylko jego objaw — usuwa strukturalną przyczynę,
   dla której silna cywilizacja jest dziś z definicji prawie zawsze „przyjazna”.
2. Cywilizacje zaczynają reagować na to, jak gracz faktycznie się wobec nich zachowuje, a
   nie niemal wyłącznie na to, kto jest silniejszy — bogatsze, bardziej reaktywne
   doświadczenie dyplomatyczne dla gracza.

Przeciw:
1. Najbardziej inwazyjna zmiana z trzech — dotyka rdzenia sposobu, w jaki gra liczy relacje
   ze wszystkimi cywilizacjami, z ryzykiem nowych, nieprzewidzianych nierównowag (np. wojny
   stają się nagle zbyt częste, albo dotąd bezpieczny sojusznik nagle staje się wrogi bez
   wyraźnego powodu dla gracza).
2. Wymaga najwięcej pracy i najstaranniejszego przetestowania na nowo dla wszystkich
   cywilizacji i wszystkich poziomów trudności, zanim będzie można zaufać wynikowi.

**B — Zostawić jedną wspólną liczbę, ale obniżyć próg potrzebny do wojny tak, by był
osiągalny też na normalnym poziomie trudności**

Ta sama logika co dziś (siła kupuje bezpieczeństwo) zostaje, ale próg, po którego
przekroczeniu inna cywilizacja decyduje się na wojnę, przesuwa się bliżej tego, co
faktycznie zdarza się w rozgrywkach — nie tylko na najtrudniejszym poziomie.

Za:
1. Mniejsza, bardziej przewidywalna zmiana niż A — korzysta z istniejącej logiki, tylko
   przesuwa granicę, więc mniejsze ryzyko nowych, nieoczekiwanych skutków ubocznych.
2. Bezpośrednio zamyka lukę, którą pomiar wykazał (bardzo zły, ale wciąż nieosiągalny wynik
   potrzebny do wojny), bez przebudowywania niczego od podstaw.

Przeciw:
1. Nie usuwa źródłowej przyczyny — bardzo silna cywilizacja nadal będzie z definicji prawie
   nietykalna dla wojny z graczem, niezależnie od tego, jak źle się on wobec niej zachowa.
2. Ta sama liczba, którą się tu przesuwa, opisuje też inne rzeczy poza samą wojną (np. jak
   twarde żądania stawia inna cywilizacja) — zmiana progu może mieć skutki uboczne gdzie
   indziej, których to pytanie wprost nie rozstrzyga.

**C — Zostawić dokładnie tak, jak jest dziś**

Inna cywilizacja może realnie wypowiedzieć wojnę graczowi tylko na najtrudniejszym
poziomie trudności; na domyślnym — nigdy.

Za:
1. Zero ryzyka wdrożenia — nic się nie zmienia, więc nie ma szansy na nową, nieprzewidzianą
   nierównowagę gdziekolwiek indziej w dyplomacji.
2. Można to odczytać jako już istniejący, spójny podział: domyślny poziom trudności ma być
   łagodny i przewidywalny, a realne ryzyko dyplomatycznego ataku ze strony innej
   cywilizacji rezerwuje się dla najtrudniejszego poziomu jako jego wyróżnik.

Przeciw:
1. Zostawia dokładnie to, co pomiar nazwał „arytmetycznie niemożliwe” — a większość graczy
   gra na domyślnym poziomie trudności, więc dla zdecydowanej większości ryzyko bycia
   zaatakowanym przez inną cywilizację jest nie tyle rzadkie, co całkowicie nieobecne, bez
   żadnej ogłoszonej decyzji, że tak ma być.
2. Stoi w sprzeczności z ogólną skłonnością właściciela do rozstrzygania zdiagnozowanych
   problemów, a nie zostawiania ich takimi, jakimi się je znalazło.

**Sprawdzian wariantu pozornego:** wszystkie trzy mają realnego adresata. C nie jest
pozorny — jest to spójne z hipotezą, że domyślny poziom trudności ma być z założenia
łagodny; nie da się tego wykluczyć bez decyzji właściciela.

### Rekomendacja i typ Proponenta 2 (niska pewność — patrz uzasadnienie)

**Typ: B, ale z wyraźnie zaznaczoną niską pewnością.** To jedyny z trzech tematów, dla
którego wskazanie litery wprost z profilu jest ryzykowne: kategoria „balans/trudność AI”
to miejsce **największej rozbieżności** między rekomendacją a decyzją właściciela w całym
dostępnym materiale (wzorzec §3.3) — a w połowie takich przypadków właściciel wybierał
interwencję **bardziej zdecydowaną**, niż rekomendowano, co w tym pytaniu wskazywałoby
raczej na A, nie na B. Formalnie rekomenduję B jako najbezpieczniejszy krok, który
bezpośrednio zamyka zmierzoną lukę bez przebudowy rdzenia systemu — ale traktuję to jako
najsłabiej podpartą z trzech rekomendacji w tym zestawie, a nie jako pewny typ w stylu
tematu 1 i 3.

### Adnotacja weryfikacyjna

Zweryfikowano w kodzie (`gra/src/game/ai.ts`): `PROG_WOJNA_SILA = 0.6`,
`PROG_WOJNA_AGRESJA = 0.5` potwierdzone jako stałe warunkujące wypowiedzenie wojny razem z
progiem minimalnej relacji; komentarz w kodzie wprost opisuje `respektWzgledny` jako
jedną liczbę reprezentującą stosunek siły (`mojaSila/(mojaSila+partnerSila)`), używaną
też jako wejście do oceny relacji — zgodnie z opisem faktu źródłowego. Nie zweryfikowano
tu niezależnie samych 585 pomiarów ani poziomu trudności „Trudny” jako jedynej otwartej
drogi (to dane z zamkniętego audytu, nie odtwarzane tu od zera) — ale mechanizm liczbowy
opisany w audycie zgadza się z tym, co widać w kodzie.

---

## TEMAT 3 — P-ULEPSZENIA-FARMA-NA-WZGORZU-PO-WYREBIE-Q1

### Sytuacja

Na Wzgórzach farma może dziś powstać tylko tam, gdzie rośnie las — bez lasu warunek do jej
założenia nie jest spełniony (na Łące i Równinie farma nie potrzebuje lasu wcale — to
inaczej działa tylko na Wzgórzach). Jeśli gracz wytnie las spod **już stojącej** farmy na
Wzgórzu, warunek, który tę farmę tam kiedyś dopuścił, przestaje być spełniony — ale sama
farma na heksie zostaje i dalej działa, jakby nic się nie zmieniło.

To ta sama sytuacja strukturalnie, co obóz łowiecki w tym samym audycie — inne ulepszenie,
które też traci swój warunek terenowy po wyrębie. Dla obozu łowieckiego właściciel już
podjął decyzję w tym samym temacie: obóz w takiej sytuacji **znika**, włożona w niego praca
nie wraca, a tartak (trzecie ulepszenie zależne od lasu) zostaje bez zmian. Farma jest
jedynym z trzech ulepszeń zależnych od lasu na Wzgórzu, dla którego nie ma jeszcze decyzji.

Sprawdzono też, że nie da się tego rozwiązać jednym uniwersalnym przełącznikiem: próba
objęcia farmy (i tartaku) tą samą, szerszą regułą co obóz złamała ustalony kanon gry
(prawie wszystkie kontrolne testy przestały się zgadzać) — farma i tartak muszą być
rozstrzygnięte świadomie, każde osobno, nie przy okazji.

### Cel pytania

Zdecydować, co ma się stać z farmą na Wzgórzu, która straciła swój warunek terenowy przez
wyrąb lasu pod nią: zniknąć jak obóz łowiecki, zostać bez zmian, czy zostać z ograniczoną
wartością.

### Dlaczego teraz

Analogiczna decyzja dla obozu łowieckiego już zapadła w tym samym audycie — farma jest
jedynym pozostawionym otwartym elementem z tej samej, w pełni zmierzonej sytuacji (754
heksy leśne sprawdzone na 5 mapach). Zostawienie tego bez decyzji oznacza, że dwa niemal
identyczne ulepszenia na tym samym typie terenu będą się różnie zachowywać bez żadnego
ogłoszonego powodu.

### Warianty

**A — Farma znika, tak jak obóz łowiecki**

Farma na Wzgórzu, która straciła swój warunek terenowy przez wyrąb lasu pod nią, przestaje
istnieć; włożona w nią wcześniej praca gracza nie wraca — dokładnie ta sama zasada, którą
właściciel już przyjął dla obozu łowieckiego w tej samej sytuacji.

Za:
1. Spójność z decyzją już podjętą dla niemal identycznej sytuacji w tym samym temacie —
   gracz doświadcza jednej, zrozumiałej zasady „stracisz ulepszenie, którego warunek
   zniknął”, zamiast dwóch różnych reguł dla dwóch bardzo podobnych ulepszeń.
2. Usuwa stan, w którym na mapie stoi ulepszenie, którego nie dałoby się dziś założyć od
   zera w tym samym miejscu — nowa farma na tym heksie bez lasu w ogóle by nie powstała.

Przeciw:
1. Farma to zwykle inwestycja, w którą gracz włożył więcej czasu i zasobów niż w obóz
   łowiecki — utrata całego, działającego ulepszenia za decyzję o wyrębie (podjętą być
   może z zupełnie innego powodu, np. dla samego drewna) może być odebrana jako kara
   nieproporcjonalna do przyczyny, zwłaszcza że skutek ujawnia się z opóźnieniem.
2. W przeciwieństwie do obozu łowieckiego, dokładnie ta sama farma na płaskim terenie
   (Łąka, Równina) nigdy nie wymagała lasu — usuwanie jej tylko na Wzgórzach po wyrębie
   sprawia, że ten sam typ ulepszenia raz znika, raz nie, w zależności od terenu, na
   którym stoi, co gracz może odczytać jako niekonsekwencję.

**B — Farma zostaje bez zmian, tak jak dziś**

Farma na Wzgórzu, której warunek terenowy zniknął, dalej stoi i dalej działa dokładnie tak
samo jak wcześniej, na stałe.

Za:
1. Najbezpieczniejsze dla gracza — inwestycja we własne ulepszenie nigdy nie znika mu
   spod nóg z powodu późniejszej, osobnej decyzji o wyrębie lasu gdzie indziej na mapie;
   zachowanie w pełni przewidywalne.
2. To już dzisiejszy, sprawdzony testami stan — zero ryzyka wdrożenia, zero szansy na
   zepsucie czegoś, co dziś działa poprawnie.

Przeciw:
1. Zostawia formalną niespójność: farma na Wzgórzu bez lasu istnieje i działa, mimo że
   według własnych zasad gry nie dałoby się jej tam dziś założyć od zera — stary wyjątek
   trwa bez końca.
2. Niespójne z decyzją już podjętą dla obozu łowieckiego w tym samym audycie — dwie prawie
   identyczne sytuacje kończą się dwoma różnymi skutkami dla gracza, bez wyraźnie
   ogłoszonego powodu, dlaczego akurat farma zasługuje na inne traktowanie niż obóz.

**C — Farma zostaje, ale traci część swojej wartości**

Farma fizycznie nie znika z mapy, ale przestaje działać w pełni — jej efekt jest trwale
ograniczony w stosunku do farmy, która nadal stoi na spełnionym warunku terenowym.

Za:
1. Sygnalizuje graczowi, że warunek przestał być spełniony, bez odbierania całej
   dotychczasowej inwestycji naraz — kara jest widoczna, ale nie tak dotkliwa jak pełna
   utrata ulepszenia.
2. Pozwala potraktować farmę inaczej niż obóz łowiecki w sposób uzasadniony różnicą między
   nimi, zamiast mechanicznie kopiować tamtą decyzję na inne ulepszenie.

Przeciw:
1. Wprowadza trzeci, zupełnie nowy rodzaj skutku (osłabienie zamiast zniknięcia albo pracy
   bez zmian), którego dla tej klasy sytuacji w grze dziś nigdzie indziej nie ma — kolejna
   osobna zasada do zapamiętania przez gracza obok „znika” i „zostaje bez zmian”.
2. Najbardziej kosztowne i najtrudniejsze do skalibrowania ze wszystkich trzech wariantów
   (o ile dokładnie ma być słabsza farma), a mimo to nie usuwa w pełni niespójności wobec
   już podjętej decyzji o obozie łowieckim.

**Sprawdzian wariantu pozornego:** wszystkie trzy mają realnego adresata — A dla spójności
z już podjętą decyzją, B dla maksymalnego bezpieczeństwa inwestycji gracza, C dla
kompromisu proporcjonalnego do przyczyny. Żaden nie jest wariantem, którego nikt by nie
wybrał.

### Rekomendacja i typ Proponenta 2

**Typ: A.** Uzasadnienie wprost z profilu: przy wyborze między zakresem ciętym/wyjątkowym
a pełnym, spójnym zakresem właściciel wybiera pełny, nawet kosztem większego diffu
(wzorzec §3.2) — a tu „pełny i spójny” oznacza dokładnie zastosowanie już podjętej decyzji
(obóz łowiecki znika) konsekwentnie do analogicznego przypadku (farma), zamiast
utrzymywania wyjątku (B) albo tworzenia trzeciego, osobnego rodzaju skutku tylko dla
farmy (C).

### Adnotacja weryfikacyjna

Zweryfikowano w kodzie (`gra/src/map/improvement-build.ts`): `isFarmBaseTerrain` zwraca
`true` dla (Wzgórza, Las) i `false` dla (Wzgórza, brak nakładki) — zgodnie z faktem
źródłowym. Zbiór `FOREST_DEPENDENT_IMPROVEMENT_KEYS` zawiera dziś **wyłącznie**
`oboz_lowiecki` — komentarz w kodzie wprost i świadomie wyklucza z niego `farma` i
`tartak`, z dopiskiem, że skasowanie cudzej farmy to osobna decyzja właściciela, nie ten
temat. Rejestr `dyspozycje/REJESTR-PROSB-I-ZADAN.md` potwierdza status „OTWARTE” tego
tematu z tym samym uzasadnieniem. Fakt zgodny z kodem, bez rozbieżności.

---

## Podsumowanie zgodności faktów źródłowych

Wszystkie trzy grupy faktów źródłowych zostały zweryfikowane bezpośrednio w kodzie i w
rejestrze — żaden nie okazał się nieścisły. Jedyne, co warto dodać jako niuans (nie
sprzeczność): rejestr dla tematu 1 wprost kwalifikuje znalezisko jako **błąd**, nie
zaprojektowane zachowanie („Nie jest to zaprojektowane zachowanie — jest to błąd”) — co
wzmacnia, a nie podważa, przesłankę za naprawą, i zostało uwzględnione w uzasadnieniu
tematu 1 powyżej.
