# Turniej ABC 2026-08-27 — SĘDZIA: werdykt i wersja finalna

**Rola:** Sędzia turnieju C-018 (rola Evaluatora) · **Model:** Opus 5, effort high · **Data:** 2026-08-27
**Wejście:** `PROPONENT-1-projekty.md` (orkiestrator) · `PROPONENT-2-projekty.md` (Sonnet 5, `1d81ae92`)
**Kanon oceny:** `docs/decyzje/R-PROC-AUTOBOT-ABC-TURNIEJ.md` · `R-PROC-AUTOBOT.md` §5, §10a ·
`dyspozycje/PROFIL-DECYZYJNY-MACIEJ.md` §3

**Wynik zbiorczy:** Proponent 1 wygrywa Warstwę 1 w tematach 1 i 2 (w temacie 2 wyraźnie),
Proponent 2 wnosi istotnie lepsze fakty i niuanse w temacie 3 i lepszą narrację Sytuacji w temacie 1.
Do właściciela idzie **wersja zsyntetyzowana we wszystkich trzech tematach** — z korektami
faktograficznymi Sędziego, które wnoszą do pytań rzeczy, których nie miał żaden Proponent.

---

## 0. Weryfikacja własna Sędziego (przed oceną)

Sędzia sprawdził fakty źródłowe bezpośrednio w kodzie. Trzy ustalenia zmieniły treść wersji finalnej:

1. **Temat 1 — znacznik miasta-państwa działa znacznie szerzej, niż napisał którykolwiek Proponent.**
   Ten sam znacznik (`isOwnerClusterCityState`, `gra/src/game/display-names.ts:50`) steruje **także**
   listą potęg widoczną dla gracza (`gra/src/game/power-ranking.ts:33` — właściciel oznaczony jako
   miasto-państwo jest z rankingu **wykluczany**), portretem władcy w dyplomacji i bitwie
   (`shouldForceCultureIconForOwner`, `diplomacyAudience.ts`, `preBattle.ts`, `battleScene.ts`),
   nazwami i emblematami. Proponent 1 pisał o tym warunkowo („ta niespójność wróci przy następnej
   funkcji"), Proponent 2 hipotetycznie („jeśli ten status ma jeszcze jakiś inny, nieujawniony
   skutek"). **Skutki nie są hipotetyczne — istnieją dzisiaj.** To zmienia bilans wariantu C
   z „leczy objaw" na „zostawia połowę usterki widoczną dla gracza".
2. **Temat 1 — blokada działa w obie strony.** Filtr `isOwnerClusterCityState` stoi w bloku wojny
   wymuszonej Kamienia (`gra/src/main.ts:28142`, `:28154`) zarówno przy kwalifikacji **napastnika**,
   jak i przy budowie listy **celów** (`:28186`). Obaj Proponenci opisali tylko wykluczenie z bycia
   celem. W wersji finalnej: „i jako napastnik, i jako cel".
3. **Temat 2 — niemożliwość da się pokazać rachunkiem zamkniętym, nie tylko pomiarem.**
   `relationScore = zaufanie + respekt` (`gra/src/game/diplomacy.ts:791`), a
   `respekt = 100·potegaSelf/(potegaSelf+potegaPartner)` (`:1587`) — czyli **dokładnie ta sama
   wielkość** co `respektWzgledny` ze ścieżki wojny. Warunek wojny (`gra/src/game/ai.ts:4377-4384`)
   żąda jednocześnie `rw ≥ 0.6` (czyli respekt ≥ 60) **i** `score < 30`. Skoro `score ≥ respekt ≥ 60`,
   warunek żąda, by liczba nie mniejsza niż 60 była mniejsza niż 30. Na najtrudniejszym poziomie
   `effProgWojnaSila` spada do podłogi 0.3 (`ai.ts:4219-4222`, `warSilaBonus = -(0.06+riskWar)`),
   a `progMinimalnyRelacja` rośnie o 10 — i dopiero tam otwiera się szczelina. **Rachunek potwierdza
   pomiar 585 obserwacji co do joty.** Żaden Proponent go nie podał; wersja finalna podaje.
4. **Temat 3 — tartak zostaje świadomie** (`gra/src/map/improvement-build.ts:176-183`, kanon
   `tools/map-improvement-qualify-test.cjs`), a farma na Łące/Równinie **nigdy** lasu nie wymagała
   (`isFarmBaseTerrain`, `:199`). Proponent 2 to złapał, Proponent 1 nie — i przez to Proponent 1
   napisał w „Za" wariantu A zdanie **nieprawdziwe**: „jedna reguła dla wszystkiego, co zależy od
   lasu". Reguła powszechna nie powstanie, bo tartak zostaje z decyzji właściciela.

Poza tym wszystkie fakty źródłowe zgadzają się z kodem i z `dyspozycje/REJESTR-PROSB-I-ZADAN.md`
(wiersze 3178, 3179, 3189). Adnotacje weryfikacyjne Proponenta 2 są rzetelne — sprawdzone punktowo,
bez rozbieżności.

---

## 1. Werdykt per temat

### Temat 1 — `R-DYPLO-FLAGA-MIASTO-PANSTWO-NIE-GASNIE-Q1` → **wygrywa Proponent 1; finał zsyntetyzowany**

**Warstwa 1 (dominująca).** Obaj typują A i obaj sięgają po wzorzec §3.2 (zakres ucinany vs pełny) —
kategoria rozpoznana poprawnie po obu stronach. Różnica jest w jakości zastosowania:

- **Proponent 1** stosuje §3.2 czysto: wskazuje C jako wariant ucinany i uzasadnia to jednym zdaniem
  odnoszącym się do skutku („leczy objaw, zostawia przyczynę"). Bez naciągania.
- **Proponent 2** dokłada §3.1 („odrzuca «poczekajmy» na rzecz decyzji teraz") i **naciąga go**:
  §3.1 dotyczy sytuacji, w której jedną z opcji jest *zebranie danych / playtest / faza*. W projekcie
  Proponenta 2 żadna opcja tym nie jest — jego B to „tylko nowe gry", czyli zakres wdrożenia, nie
  odłożenie decyzji. Nazwanie B „formą odłożenia korzyści na później" to przeniesienie wzorca poza
  jego zakres. Plus: Proponent 2 poprawnie cytuje skorygowaną liczność §3.2 („co najmniej 4-krotnie"),
  czego Proponent 1 nie robi — drobny punkt na jego korzyść.

**Warstwa 2 (niuanse).** Tu rozstrzyga oś wariantów i to jest różnica zasadnicza:

- **Proponent 1** buduje A/B/C na osi *skutku dla gry*: A = znacznik gaśnie przy zdobyciu siłą,
  B = gaśnie po przekroczeniu wielkości, C = zostaje, a wojna go nie sprawdza. Trzy różne światy.
- **Proponent 2** buduje A/B na osi *wdrożenia*: „naprawa dla wszystkich gier" vs „naprawa tylko dla
  nowych gier". **To jest ta sama decyzja projektowa dwa razy, różniąca się momentem wejścia w życie.**
  To ociera się o złamanie §10a warunek 3 („warianty różnią się skutkiem dla gry i dla gracza, nie
  sposobem wykonania") i realnie zostawia właścicielowi tylko dwa wybory projektowe zamiast trzech.
  Pytanie „kiedy cywilizacja przestaje być miastem-państwem" nie dostaje u Proponenta 2 żadnej
  odpowiedzi pośredniej.
- Proponent 2 wygrywa natomiast Sytuację: lepiej opowiedziana, i jako jedyny stosuje wprost regułę
  stałą właściciela z 2026-08-27 (AI innej cywilizacji ≠ automat wspierający gracza). Proponent 1
  używa słowa „przeciwnik", co regułę spełnia, ale mniej jednoznacznie.
- Obaj przegapili, że blokada działa też na napastnika, i obaj potraktowali skutki poza wojną jako
  hipotetyczne (patrz §0).

**Do finału bierzemy:** oś wariantów, „typ" i uzasadnienie profilowe od Proponenta 1; narrację
Sytuacji i jawne rozróżnienie AI od Proponenta 2; dwie korekty faktograficzne Sędziego.

### Temat 2 — `P-DYPLO-RELACJA-I-SILA-TA-SAMA-LICZBA-Q1` → **wygrywa Proponent 1, wyraźnie; finał zsyntetyzowany**

**Warstwa 1 (dominująca).** Obaj poprawnie rozpoznają kategorię jako „balans / trudność AI" i obaj
przywołują §3.3 (największa rozbieżność). Ale robią z tym rozpoznaniem coś przeciwnego:

- **Proponent 1** typuje **A** na podstawie §3.1 + §3.2, a §3.3 dokłada **osobno, jako zastrzeżenie do
  pewności typu** („traktuj ten typ z mniejszą pewnością"). To jest dokładnie właściwe użycie profilu:
  wzorzec informuje literę, kategoria ryzyka informuje wagę.
- **Proponent 2** typuje **B**, sam pisze, że materiał §3.3 wskazywałby raczej na A („w połowie takich
  przypadków właściciel wybierał interwencję bardziej zdecydowaną, niż rekomendowano"), po czym
  rekomenduje B jako „najbezpieczniejszy krok". **To jest błąd Warstwy 1, i to podwójny:** (a) typ
  stoi wbrew wzorcowi, który sam Proponent poprawnie odczytał; (b) jedyną podporą B jest
  „najbezpieczniejsza opcja" — czyli dokładnie ta hipoteza, którą profil w §3.5 sprawdza wprost
  i **odrzuca jako niepotwierdzoną**. Uczciwe zaznaczenie niskiej pewności jest zaletą i to doceniam,
  ale nie ratuje typu opartego na obalonej przesłance.

**Warstwa 2 (niuanse).**

- Wariant C u Proponenta 1 („wojnę z graczem otwierać zdarzeniami") jest realną, osobną propozycją
  projektową; C u Proponenta 2 („zostawić jak jest") jest samym status quo, ale z bardzo dobrym „Za":
  domyślny poziom **ma** być łagodny, a ryzyko najazdu jest wyróżnikiem najtrudniejszego. To zdanie
  jest najlepszym pojedynczym argumentem w całym temacie 2 po obu stronach i wchodzi do finału.
- Proponent 2 wyprał Sytuację z liczb („stosunkowo znośne stosunki", „poziom kilkukrotnie gorszy").
  Liczby nie są żargonem i §10a ich nie zakazuje — Proponent 1 podał 77 i 30 słownie i miał rację.
- Obaj oparli niemożliwość na pomiarze. Sędzia dokłada rachunek zamknięty (§0 pkt 3), który jest
  mocniejszy i **czytelniejszy na głos** niż zestawienie dwóch liczb z pomiaru.

**Do finału bierzemy:** typ A i konstrukcję „typ + zastrzeżenie o kategorii" od Proponenta 1;
argument o świadomym podziale poziomów trudności (jako „Za" wariantu C) od Proponenta 2;
rachunek niemożliwości od Sędziego. Wariant C finalny = status quo Proponenta 2 z uzasadnieniem
projektowym, a nie osobny mechanizm zdarzeń — zdarzenia to odrębny temat, nie odpowiedź na to pytanie.

### Temat 3 — `P-ULEPSZENIA-FARMA-NA-WZGORZU-PO-WYREBIE-Q1` → **remis w Warstwie 1, Proponent 2 wygrywa Warstwę 2; finał zsyntetyzowany**

**Warstwa 1 (dominująca).** Obaj typują A i obaj mają rację co do kategorii, każdy z innej strony:

- **Proponent 1** kwalifikuje temat jako czystą naprawę z jednoznaczną diagnozą (§3.4, bardzo wysoka
  zgodność) i dokłada świeży precedens: właściciel przed chwilą wybrał ten sam skutek dla obozu
  łowieckiego. Precedens jest najmocniejszym argumentem w tym temacie i Proponent 1 go ma.
- **Proponent 2** kwalifikuje jako wybór między wyjątkiem a spójnym zakresem (§3.2). Też trafnie —
  to nie jest naciąganie, bo B i C są tu realnie „utrzymaj wyjątek" i „stwórz trzeci rodzaj skutku".

Oba uzasadnienia są poprawne i niesprzeczne; obydwa wzorce zbiegają się na A. Remis.

**Warstwa 2 (niuanse).** Tu Proponent 2 wygrywa faktami:

- Proponent 2 jako jedyny podaje, że farma na Łące i Równinie **nigdy** lasu nie wymagała, i robi
  z tego mocny „Przeciw" dla A (to samo ulepszenie raz znika, raz nie — zależnie od terenu).
- Proponent 2 jako jedyny wymienia tartak i to, że **zostaje z decyzji właściciela**.
- Wskutek obu braków Proponent 1 wpisał w „Za" wariantu A zdanie nieprawdziwe: *„jedna reguła dla
  wszystkiego, co zależy od lasu — gracz uczy się jej raz"*. Nie będzie jednej reguły; tartak zostaje.
  To jedyny twardy błąd faktograficzny w całym turnieju i musi zniknąć z finału.
- Za to **zestaw wariantów lepszy ma Proponent 1**: jego B („wyrąb zablokowany, dopóki stoi farma")
  to trzeci, realnie inny skutek dla gracza. C Proponenta 2 („farma zostaje, ale trwale osłabiona")
  wprowadza czwarty rodzaj skutku, nieobecny nigdzie w grze, i sam Proponent 2 rozbraja go w „Przeciw"
  na tyle skutecznie, że po lekturze jego własnej analizy nikt tego nie wybierze — patrz §2.

**Do finału bierzemy:** zestaw wariantów Proponenta 1 (znika / wyrąb zablokowany / zostaje), fakty
i „Przeciw" Proponenta 2 (teren płaski, tartak), oba uzasadnienia profilowe złączone w jedno zdanie.

---

## 2. Warianty pozorne i inne usterki formy

| Gdzie | Co | Rozstrzygnięcie Sędziego |
|---|---|---|
| **P2, temat 1, wariant B** („tylko nowe gry") | Nie jest pozorny, jest **nie na tej osi**: to zakres wdrożenia, nie skutek dla gry. Dubluje decyzję projektową z A. Ociera się o §10a warunek 3. | **Usunięty.** Zastąpiony realnym wariantem projektowym P1 (znacznik gaśnie po przekroczeniu wielkości) — daje właścicielowi trzecią, faktycznie różną odpowiedź na postawione pytanie. |
| **P2, temat 3, wariant C** („farma zostaje, ale trwale osłabiona") | Na granicy pozorności: wprowadza rodzaj skutku, którego w grze nie ma, i sam projekt wymienia dla niego dwa ciężkie „Przeciw" (nowa zasada do zapamiętania + najtrudniejszy do skalibrowania) bez żadnej przeciwwagi tej wagi. | **Usunięty.** Zastąpiony wariantem P1 (wyrąb zablokowany pod farmą) — realnie inny skutek dla gracza, bez wprowadzania nowej klasy zachowania. |
| **P1, temat 2, wariant C** („wojna z graczem wyłącznie ze zdarzeń") | Nie pozorny, ale miesza dwie rzeczy: rezygnację z wyliczenia **i** budowę nowego systemu zdarzeń, którego dziś nie ma. | **Przeredagowany.** Finalne C to status quo (wersja P2) z uzasadnieniem projektowym P2; zdarzenia zostają wspomniane jako istniejące źródło zagrożenia, nie jako zamawiany mechanizm. |
| **P1, temat 3, „Za" wariantu A** | Zdanie „jedna reguła dla wszystkiego, co zależy od lasu" jest **nieprawdziwe** — tartak zostaje z decyzji właściciela. | **Usunięte i zastąpione** zdaniem o spójności z decyzją o obozie, nie o powszechności reguły. |
| **P2, temat 2, Sytuacja** | Wyprana z liczb („stosunkowo znośne", „kilkukrotnie gorszy") — właściciel dostaje mniej informacji bez żadnego zysku dla czytelności. | **Odrzucone.** Finał podaje liczby i rachunek. |
| Oba, temat 1, Sytuacja | Blokada opisana jednostronnie (tylko jako cel). | **Poprawione:** „i jako napastnik, i jako cel". |
| Oba, temat 1, wariant C | Skutki poza wojną potraktowane jako hipotetyczne. | **Poprawione:** są dzisiejsze i widoczne dla gracza (ranking potęg, portret władcy). |

**Test §10a wykonany przez Sędziego na wersji finalnej:** z każdego z trzech pytań usunięto w myśli
wszystkie nazwy plików, funkcji, narzędzi i numery paragrafów. **Żadne zdanie nie straciło znaczenia** —
bo żadne takiej nazwy nie zawiera; wszystkie identyfikatory zeszły do odnośnika pod pytaniem. Warianty
we wszystkich trzech tematach różnią się skutkiem dla gry i dla gracza. Reguła stała właściciela
(AI innej cywilizacji ≠ automat wspierający gracza) zastosowana jawnie w tematach 1 i 2.

---

# 3. WERSJA FINALNA — trzy pytania gotowe do pokazania właścicielowi

---

## PYTANIE 1 — kiedy cywilizacja przestaje być traktowana jak miasto-państwo

### Sytuacja

W epoce Kamienia nie wybucha ani jedna wojna. Nikt nikomu jej nie wypowiada — ani rywalizujące
cywilizacje sobie nawzajem, ani nikt graczowi. Zmierzone na pięciu mapach, przez ponad pięćset tur
rozgrywki, trzema niezależnymi sposobami liczenia: zero wypowiedzeń.

Przyczyna jest jedna i w pełni znana. Kiedy cywilizacja prowadzona przez komputer (rywal, nie automat,
który prowadzi sprawy za gracza) zdobywa **siłą** swoje pierwsze miasto należące wcześniej do małego
miasta-państwa, gra od tej chwili zaczyna traktować **tę zdobywającą cywilizację** tak, jakby ona sama
była miastem-państwem. Na stałe, do końca partii. Dzieje się to w turze szóstej, siódmej albo ósmej,
u wszystkich sześciu cywilizacji, w każdej sprawdzonej grze. A małe miasta-państwa są z wojen świadomie
wyłączone — i jako napastnik, i jako cel. Zanim wybije tura dwudziesta, w której wojna miała ruszać,
wszyscy jej możliwi uczestnicy są już trwale wykreśleni.

Oznaczenie znika tylko wtedy, gdy cywilizacja wchłonie miasto-państwo pokojowo. Po zdobyciu siłą —
nigdy. A pierwsze przejęcia miast-państw prawie zawsze są zbrojne.

To oznaczenie nie steruje wyłącznie wojną. Ta sama informacja decyduje o tym, czy cywilizacja w ogóle
pojawia się na liście potęg widocznej dla gracza i czy w rozmowie dyplomatycznej pokazuje portret
władcy, czy tylko symbol kultury. Cywilizacja z kilkoma miastami jest więc dziś nie tylko wyjęta
z wojen — bywa też niewidoczna w rankingu i przedstawiana graczowi jako małe państewko.

### Cel pytania

Ustalić, kiedy cywilizacja przestaje być traktowana jak miasto-państwo.

### Dlaczego teraz

Wojna wymuszona epoki Kamienia jest już zamówiona i zbudowana dokładnie tak, jak została opisana:
start po dwudziestu turach, cel wybierany wśród najbliższych terytorialnie sąsiadów, pokój po dwóch
miastach i odpoczynek. Nigdy się nie uruchomiła. Przyczyna jest rozpoznana do końca — nie ma czego
dodatkowo mierzyć. A każda kolejna praca nad zachowaniem rywali (co budują, jak się rozrastają, jak
bardzo są agresywni) toczy się tymczasem w świecie, w którym wojna jest niemożliwa, więc oceniamy ich
w warunkach, których w docelowej grze nie będzie.

### A — oznaczenie znika przy każdym przejęciu miasta-państwa, także zbrojnym

**Za:**
1. Wojna wymuszona zaczyna działać dokładnie tak, jak została zamówiona, bez zmieniania czegokolwiek
   w jej własnych zasadach.
2. Naprawia też skutki poza wojną: cywilizacja, która podbiła sąsiada, wraca na listę potęg i przestaje
   być pokazywana graczowi jako małe państewko.

**Przeciw:**
1. Od dwudziestej tury rywale zaczynają wojować między sobą — to zauważalna zmiana tempa wczesnej gry,
   która będzie wymagała ponownego przyjrzenia się balansowi.
2. Gracz może zostać wciągnięty w konflikty, których w tej epoce dotąd nie było — łącznie z sytuacją,
   w której zajęty wojną sąsiad przestaje z nim handlować.

### B — oznaczenie znika dopiero, gdy cywilizacja przekroczy pewną wielkość

**Za:**
1. Wojny zaczynają się później i tylko u tych rywali, którzy naprawdę urośli — łagodniejsze wejście
   w konflikt dla gracza.
2. Daje pokrętło do strojenia tempa: przesuwając próg wielkości, ustawia się, jak wcześnie epoka
   Kamienia robi się niebezpieczna.

**Przeciw:**
1. Trzeba wymyślić i dostroić nowy próg, który sam stanie się przedmiotem kolejnych poprawek —
   przybywa liczba do pilnowania.
2. Wojna wymuszona nadal nie ruszy w dwudziestej turze, tylko kiedyś później i u każdej cywilizacji
   w innym momencie — zamówiony rytm epoki się nie odtworzy.

### C — oznaczenie zostaje takie, jakie jest, a sama wojna przestaje je brać pod uwagę

**Za:**
1. Najmniejsza możliwa zmiana: wojny zaczynają się zdarzać, a wszystko inne zachowuje się dokładnie
   tak jak dziś.
2. Najmniejsze ryzyko, że przy okazji popsuje się coś, co dziś działa poprawnie właśnie dzięki temu
   oznaczeniu.

**Przeciw:**
1. Zostawia w grze cywilizację z kilkoma miastami, która formalnie wciąż jest miastem-państwem — więc
   nadal nie widać jej na liście potęg i nadal nie ma portretu władcy w dyplomacji. Wojny wracają,
   reszta usterki zostaje na oczach gracza.
2. Leczy jeden objaw: przy następnej rzeczy w grze, która sięgnie po to samo oznaczenie, ten sam błąd
   wyjdzie w nowym miejscu.

### Rekomendacja

**A.** *wg profilu: typowana A, bo wzorzec „między zakresem ucinanym a pełnym właściciel wybiera pełny,
nawet kosztem większego diffu" — B i C to dwie odmiany cięcia tego samego zakresu, a C zostawia
przyczynę nietkniętą i połowę skutków widoczną dla gracza.*

> **Odnośnik (nie część pytania):** `R-DYPLO-FLAGA-MIASTO-PANSTWO-NIE-GASNIE-Q1`.
> Źródło: audyt `P-DYPLO-WOJNY-KAMIEN-NIE-WIDAC-Q1` (zamknięty, w `main`);
> `dyspozycje/REJESTR-PROSB-I-ZADAN.md:3178`. Mechanizm: `isOwnerClusterCityState`
> (`gra/src/game/display-names.ts:50`) w filtrze wojny wymuszonej `gra/src/main.ts:28142/28154/28186`
> (napastnik i cel) oraz w `gra/src/game/power-ranking.ts:33` i `shouldForceCultureIconForOwner`.
> Zamówiony mechanizm: `gra/src/game/forced-war-stone.ts` (bramki 32/0 i 18/0).
> Decyzja źródłowa: `R-EPOKA-KAMIEN-WYMUSZONA-WOJNA-Q1` (2026-08-18, Q1=A, Q3=A).
> Wzorzec profilu: `dyspozycje/PROFIL-DECYZYJNY-MACIEJ.md` §3.2.

---

## PYTANIE 2 — czy siła rywala i jego nastawienie do gracza to dwie osobne rzeczy

### Sytuacja

Żadna rywalizująca cywilizacja nie może dziś wypowiedzieć wojny graczowi na domyślnym poziomie
trudności. Nie „rzadko" — nie może w ogóle, i da się to pokazać rachunkiem.

Gra opisuje układ z każdą cywilizacją dwiema wielkościami: zaufaniem i szacunkiem. Szacunek to nic
innego jak udział tej cywilizacji w sumie sił obu stron — jeśli ma dwa razy silniejszą armię niż gracz,
jej szacunek wynosi około sześćdziesięciu sześciu na sto. Jakość stosunków to zaufanie **plus** szacunek.
Żeby cywilizacja zdecydowała się na wojnę, musi być jednocześnie wyraźnie silniejsza od gracza — jej
udział w sile musi wynosić co najmniej sześćdziesiąt na sto — i musi mieć z graczem bardzo złe stosunki,
poniżej trzydziestu punktów. Ale skoro stosunki to zaufanie plus ten sam szacunek, warunek żąda, żeby
liczba nie mniejsza niż sześćdziesiąt była mniejsza niż trzydzieści. To nie jest rzadkie. To jest
arytmetycznie niemożliwe.

Rachunek zgadza się z pomiarem co do joty: w pięciuset osiemdziesięciu pięciu obserwacjach z prawdziwych
rozgrywek najgorsze zanotowane stosunki to siedemdziesiąt siedem punktów, a próg wojny to trzydzieści.
Jedyny poziom trudności, na którym ta droga w ogóle się otwiera, to najtrudniejszy — tam wymagana
przewaga jest niższa, a próg złych stosunków wyższy, i powstaje wąska szczelina. Na poziomie normalnym,
na którym gra większość, nie ma jej wcale.

W praktyce znaczy to jedno, dokładnie odwrotne do intuicji: im groźniejszy rywal, tym bezpieczniejszy
przy nim gracz. Siła kupuje przyjaźń.

### Cel pytania

Ustalić, czy siła rywala i jego nastawienie do gracza mają być dwiema osobnymi rzeczami — a przez to,
czy gracz na domyślnym poziomie trudności ma w ogóle móc zostać zaatakowany.

### Dlaczego teraz

To druga z dwóch przyczyn ciszy w epoce Kamienia. Nawet po naprawie pierwszej rywale zaczną wojować
wyłącznie między sobą, a gracz pozostanie nietykalny. Pomiar jest zamknięty i jednoznaczny, a rachunek
go potwierdza — nie ma czego dokładać ani na co czekać. Każda kolejna rzecz budowana na dyplomacji
(ostrzeżenia, żądania, sojusze, reakcje na zdradę) będzie tymczasem po cichu zakładała, że graczowi
i tak nic nie grozi.

### A — rozdzielić: osobno siła, osobno nastawienie

**Za:**
1. Rywal silny i wrogi atakuje, rywal silny i zaprzyjaźniony nie — czyli dokładnie tak, jak podpowiada
   zdrowy rozsądek i jak gracz się tego spodziewa.
2. To, jak gracz się zachowuje — łamane obietnice, ekspansja pod czyimś bokiem, zrywane układy —
   zaczyna mieć realne konsekwencje na każdym poziomie trudności, nie tylko na najtrudniejszym.

**Przeciw:**
1. To zmiana w sercu dyplomacji: ta sama liczba karmi dziś także propozycje pokoju, żądania trybutu
   i sojusze, więc wszystkie te ścieżki trzeba będzie dostroić od nowa.
2. Ryzyko przestrzelenia w drugą stronę — wojny mogą zrobić się za częste, albo dotychczasowy
   sojusznik zacznie się odwracać bez powodu czytelnego dla gracza.

### B — zostawić jedną liczbę, obniżyć próg wojny tak, by był osiągalny też na normalnym

**Za:**
1. Zmiana jednej wartości: efekt widać od razu, a jeśli wyjdzie źle, równie łatwo ją cofnąć.
2. Domyka dokładnie tę lukę, którą pokazał pomiar, bez przebudowywania czegokolwiek innego.

**Przeciw:**
1. Nie usuwa odwróconej logiki: najsilniejszy rywal nadal będzie najmniej skłonny do wojny z graczem,
   choćby gracz zachowywał się wobec niego jak najgorzej.
2. Ta sama liczba steruje też twardością żądań i skłonnością do zawarcia pokoju — przesunięcie progu
   odbije się w miejscach, których to pytanie wprost nie rozstrzyga.

### C — zostawić tak, jak jest: na normalnym poziomie gracz nie bywa atakowany

**Za:**
1. Zero ryzyka dla dziś działającego balansu dyplomacji — nic się nie psuje, bo nic się nie zmienia.
2. Można to uznać za świadomy podział poziomów: normalny ma być spokojny i przewidywalny, realne
   ryzyko najazdu jest wyróżnikiem najtrudniejszego, a zagrożenie na normalnym i tak przychodzi
   z innych źródeł (barbarzyńcy, wydarzenia).

**Przeciw:**
1. Gracz nigdy nie odczuje, że jego własne decyzje mogą sprowadzić na niego wojnę — dyplomacja
   przestaje być systemem, w który się gra, a staje się dekoracją.
2. Utrwala ten stan, nie ogłaszając go: dziś nikt graczowi nie mówi, że na normalnym poziomie jest
   nietykalny, więc jego ostrożność w dyplomacji nie ma żadnego pokrycia w grze.

### Rekomendacja

**A** — z niższą pewnością niż przy pozostałych dwóch pytaniach.

*wg profilu: typowana A, bo wzorzec „odrzuca «poczekajmy, zmierzmy najpierw» na rzecz decyzji teraz"
(pięć trafień na pięć) spotyka się z wzorcem wyboru pełnego zakresu zamiast ucinanego — B przesuwa
granicę zamiast rozstrzygnąć, a C zostawia zdiagnozowany problem tam, gdzie go znaleziono.*

**Zastrzeżenie do rekomendacji:** ten temat należy do kategorii „balans i trudność rywali" — jedynego
obszaru, w którym profil notuje **największą rozbieżność** między rekomendacją a wyborem właściciela
(tylko dwie zgodności na sześć par). Typ podajemy, ale z jawnie mniejszą wagą niż przy pytaniu
pierwszym i trzecim.

> **Odnośnik (nie część pytania):** `P-DYPLO-RELACJA-I-SILA-TA-SAMA-LICZBA-Q1`.
> Źródło: audyt `P-DYPLO-WOJNY-KAMIEN-NIE-WIDAC-Q1`; `dyspozycje/REJESTR-PROSB-I-ZADAN.md:3179`.
> Rachunek: `relationScore = zaufanie + respekt` (`gra/src/game/diplomacy.ts:791`),
> `respekt = 100·potegaSelf/(potegaSelf+potegaPartner)` (`:1587`) = ta sama wielkość co
> `respektWzgledny`; warunek wojny `gra/src/game/ai.ts:4377-4384` żąda `rw ≥ PROG_WOJNA_SILA (0.6)`
> **i** `score < progMinimalnyRelacja (30)`; `PROG_WOJNA_AGRESJA = 0.5`. Na „Trudnym"
> `effProgWojnaSila` schodzi do podłogi `0.3` (`ai.ts:4219-4222`), a `progMinimalnyRelacja` rośnie o 10.
> Wzorce profilu: `dyspozycje/PROFIL-DECYZYJNY-MACIEJ.md` §3.1, §3.2; zastrzeżenie z §3.3
> (i §3.5 — hipoteza „zawsze tańsza/bezpieczniejsza opcja" jest w profilu wprost odrzucona).

---

## PYTANIE 3 — co dzieje się z farmą na wzgórzu po wyrębie lasu

### Sytuacja

Na wzgórzu farmę można postawić tylko tam, gdzie rośnie las. Na łące i na równinie las nie jest do
niczego potrzebny — ten warunek dotyczy wyłącznie wzgórz. Ale kiedy gracz wytnie las spod farmy, która
na wzgórzu **już stoi**, farma zostaje i działa dalej, choć warunek, który ją tam w ogóle dopuścił,
przestał być spełniony. Na mapie utrzymuje się coś, czego dziś nie dałoby się w tym miejscu zbudować
od nowa.

To ta sama sytuacja co przy obozie łowieckim — i tam rozstrzygnięcie już zapadło: obóz po wyrębie
znika, a włożona w niego praca nie wraca. Trzecie ulepszenie związane z lasem, tartak, świadomie
zostaje. Farma jest jedynym, dla którego decyzji jeszcze nie ma.

Sprawdzono też, że nie da się tego załatwić jedną wspólną regułą dla wszystkich trzech: próba objęcia
farmy i tartaku tą samą zasadą co obóz złamała przyjęty kanon zachowania ulepszeń. Farma musi zostać
rozstrzygnięta osobno i świadomie.

### Cel pytania

Ustalić, co dzieje się z farmą na wzgórzu, gdy zniknie las, który był warunkiem jej postawienia.

### Dlaczego teraz

Reguła dla obozu łowieckiego została właśnie ustalona i wdrożona. Dopóki farma nie ma własnej, dwa
bardzo podobne ulepszenia na tym samym heksie zachowują się po wyrębie różnie, bez powodu, który gracz
mógłby odgadnąć — a takie rzeczy wracają jako zgłoszenie. Sytuacja jest zmierzona do końca: siedemset
pięćdziesiąt cztery heksy z lasem na pięciu mapach.

### A — farma znika, tak samo jak obóz łowiecki

**Za:**
1. Ta sama sytuacja kończy się tym samym skutkiem co przy obozie łowieckim — gracz uczy się jednej
   zasady, zamiast pamiętać, że akurat tu jest inaczej.
2. Znika stan, którego nie dałoby się osiągnąć, budując od zera: na wzgórzu bez lasu nowej farmy
   postawić nie można, więc nie ma powodu trzymać tam starej.

**Przeciw:**
1. Farma to zwykle większa inwestycja niż obóz, a jej utrata przychodzi z opóźnieniem i jako skutek
   uboczny decyzji podjętej w zupełnie innym celu (na przykład po drewno) — łatwo odebrać to jako
   karę nieproporcjonalną do przewinienia.
2. Ta sama farma na łące i na równinie nigdy lasu nie potrzebowała, więc po tej zmianie identyczne
   ulepszenie raz znika po wyrębie, a raz nie — zależnie od tego, na czym stoi. Jedna niespójność
   zostaje zastąpiona inną, mniej oczywistą dla gracza.
3. Powszechnej reguły „co zależało od lasu, to po wyrębie znika" i tak nie będzie, bo tartak zostaje
   z osobnej decyzji — więc gracz i tak zapamiętuje listę wyjątków, tylko krótszą.

### B — wyrąb jest zablokowany, dopóki stoi na tym heksie farma

**Za:**
1. Nic nie znika graczowi bez jego wiedzy — żeby stracić farmę, trzeba ją najpierw świadomie rozebrać.
2. Sprzeczny stan w ogóle nie powstaje, zamiast być sprzątany po fakcie.

**Przeciw:**
1. Ogranicza swobodę gospodarowania terenem i wprowadza wyjątek w wyrębie, który dziś zachowuje się
   wszędzie tak samo.
2. Gracz zobaczy tylko, że akurat tu nie wolno ciąć, i bez wyjaśnienia nie zgadnie dlaczego; przy
   większych porządkach na mapie to irytuje bardziej niż utrata jednego ulepszenia.
3. Rozjeżdża się z decyzją o obozie łowieckim w drugą stronę: tam wyrąb wolno wykonać i obóz przepada,
   tu wyrębu nie wolno wykonać wcale.

### C — farma zostaje, tak jak dziś

**Za:**
1. Gracz nigdy nie traci ulepszenia, w które włożył pracę — zachowanie w pełni przewidywalne
   i najbezpieczniejsze dla jego planów gospodarczych.
2. Nic się nie zmienia, więc nie ma czego zepsuć; stan zastany, nikt się dotąd na to nie skarżył.

**Przeciw:**
1. Dwa bardzo podobne ulepszenia w identycznym położeniu zachowują się różnie bez ogłoszonego powodu —
   to samo w sobie jest usterką, nie stanem docelowym.
2. Utrwala na mapie stan, którego nie da się zbudować od zera; przy każdej kolejnej pracy nad
   ulepszeniami trzeba będzie ten wyjątek pamiętać i omijać.

### Rekomendacja

**A.** *wg profilu: typowana A, bo dwa wzorce zbiegają się na tej samej literze — „czysta naprawa
z jednoznaczną diagnozą: bardzo wysoka zgodność" oraz „między utrzymaniem wyjątku a spójnym zakresem
właściciel wybiera spójny" — a dodatkowo w identycznej sytuacji, w tym samym właśnie zamkniętym temacie,
właściciel wybrał dokładnie ten skutek dla obozu łowieckiego.*

> **Odnośnik (nie część pytania):** `P-ULEPSZENIA-FARMA-NA-WZGORZU-PO-WYREBIE-Q1`.
> Źródło: `R-ULEPSZENIA-OBOZ-LOWIECKI-TYLKO-LAS-Q1` (zamknięty, w `main`, ECHO wariant A);
> `dyspozycje/REJESTR-PROSB-I-ZADAN.md:3189`. Mechanizm: `isFarmBaseTerrain`
> (`gra/src/map/improvement-build.ts:199`) — `(Wzgorza,Las)=true`, `(Wzgorza,Brak)=false`,
> Łąka/Równina zawsze `true`; `FOREST_DEPENDENT_IMPROVEMENT_KEYS` (`:184`) zawiera dziś wyłącznie
> `oboz_lowiecki`, z komentarzem wykluczającym `farma` i `tartak` do osobnej decyzji.
> Dowód, że szerszy filtr byłby błędem: mutacja zapaliła 5 asercji tematu i złamała kanon
> `tools/map-improvement-qualify-test.cjs` do 111/1. Pomiar: 754 heksy z lasem na 5 mapach,
> obóz poza lasem 0/200 po naprawie. Wzorce profilu: `dyspozycje/PROFIL-DECYZYJNY-MACIEJ.md`
> §3.4 i §3.2.

---

## 4. Kontrakt raportu

```text
STATUS: PASS
DOMAIN: PROCESS
TEMAT: ABC-TURNIEJ-2026-08-27 (Sędzia, C-018)
GOAL: Werdykt dwuwarstwowy dla trzech tematów + wersja finalna trzech pytań ABC gotowa dla właściciela
ZMIANY/COMMIT: dyspozycje/abc-turniej/2026-08-27/SEDZIA-werdykt-i-wersja-finalna.md (allowlista: dyspozycje/abc-turniej/**)
TESTY: brak bramek kodu — paczka dokumentacyjna, zero zmian w gra/**; wykonany test §10a na wersji finalnej (3/3 pytania przechodzą) oraz weryfikacja 4 faktów źródłowych bezpośrednio w kodzie (2 korekty merytoryczne wniesione do pytań, 1 błąd faktograficzny Proponenta 1 usunięty)
BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: orkiestrator podaje wersję finalną właścicielowi w głównym czacie; po odpowiedzi literą — ECHO i zapis do rejestru
DEPLOY/PUSH: WYKONANO (push gałęzi autobot/ABC-TURNIEJ-2026-08-27; brak deployu — paczka dokumentacyjna)
```
