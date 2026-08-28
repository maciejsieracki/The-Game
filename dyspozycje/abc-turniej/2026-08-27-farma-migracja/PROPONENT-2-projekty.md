# PROPONENT 2 — projekt ABC — P-ULEPSZENIA-FARMY-JUZ-STOJACE-W-LESIE-Q1

**Data:** 2026-08-27
**Autor:** Proponent 2 (turniej C-018, izolowany od projektu Proponenta 1 — brak wglądu w jego treść)
**UWAGA:** ten plik ZASTĘPUJE wcześniejszą wersję zapisaną na tej samej gałęzi o 19:54 tego samego
dnia (SHA `7c13c155`, rekomendacja B z pewnością ŚREDNIĄ). Powód nadpisania — patrz sekcja 0 niżej.
To nie jest kosmetyczna korekta: między tamtym zapisem a tą turą pojawił się fakt źródłowy, który
zmienia ocenę pewności typowania z gruntu, więc został zapisany jawnie, a nie po cichu.

---

## 0. KRYTYCZNE ZNALEZISKO — PRZECZYTAJ PRZED RESZTĄ (dla orkiestratora/Sędziego, nie dla właściciela)

**Ten temat ma już faktyczną odpowiedź i jest wdrożony na `main`.** Tego samego dnia, równolegle
do tego turnieju, właściciel odrzucił dokładnie to pytanie jako bezzasadne, cytat pełny zapisany w
`dyspozycje/REJESTR-PROSB-I-ZADAN.md` (sekcja „ECHO 2026-08-27 — Pytanie 1"):

> „Już odpowiadałem na to pytanie. Pytanie jest niezasadne. W ogóle nie powinno być farm w lesie;
> farm nie wolno stawiać w lesie. Mówiłem, że zmieniam tę regułę, zakaz stawiania farm w lasach.
> Dlatego pytanie, co się stanie z lasem, jeśli go wykarczujemy, i co się stanie z farmą, jest
> bezzasadne, bo w lesie nie powinno być farm."

Orkiestrator zinterpretował to (jawnie jako interpretację, nie jako dosłowny wybór litery) jako
wariant „farma znika, las zostaje", bez wyjątku terenowego — czyli dokładnie wariant **B** poniżej.
Temat wykonawczy `R-ULEPSZENIA-FARMA-LESIE-USUN-ISTNIEJACE-Q1` zrealizował to dla wszystkich trzech
stanów gry (nowa partia / trwająca partia / wczytany zapis), przeszedł Operatora, Evaluatora
(`PASS-WITH-NOTES`) i Final Control, i **jest już zintegrowany do `main`** (commit `cc98a78b`,
zamknięty w rejestrze jako „ZINTEGROWANE do main"). Weryfikacja na żywym Chromium: 5301 zasianych
heksów z lasem, 1372 usunięte farmy przy granicy tury, zero błędów konsoli.

**Konsekwencja dla tego turnieju:** poniższy projekt ABC jest napisany w pełni zgodnie z kanonem
(niezależnie, bez znajomości wdrożenia — fakty źródłowe podane w zleceniu tego zadania nie
wspominały o wdrożeniu, znalazłem je sam przy weryfikacji w kodzie), ale jego praktyczna funkcja
się zmienia: to nie jest pytanie o przyszłą decyzję, tylko **prośba o formalne, literowe
potwierdzenie decyzji, która już działa w grze**. Powód, dla którego mimo to warto go zadać: reguła
turnieju (`R-PROC-AUTOBOT-ABC-TURNIEJ.md`, „Zakres wyjątku") zwalnia z turnieju wyłącznie pytania,
na które właściciel odpowiedział **wprost literą** — odrzucenie pytania jako „bezzasadne" nią nie
jest, i orkiestrator sam to zapisał jako interpretację, którą właściciel „poprawi przy następnej
turze ECHO", jeśli jest błędna. Innymi słowy: koszt zadania pytania jest niski (potwierdzenie w
jednym zdaniu), a koszt NIE zadania go, jeśli interpretacja była zła, to żywy kod na `main` oparty
o czyjeś zgadywanie. Rekomendacja niżej to uwzględnia wprost.

---

## Sytuacja

Do niedawna dało się stawiać farmy na polach porośniętych lasem — i w wielu toczących się partiach
oraz zapisanych grach takie farmy nadal stoją i pracują. Właśnie weszła nowa zasada: las i farma
się wykluczają, więc nowej farmy na polu z lasem już nie da się postawić — na lesie wolno wznieść
tylko tartak i ewentualnie obozowisko myśliwskie. Pytanie dotyczy wyłącznie tego, co dzieje się z
farmami, które w tej chwili **już tam stoją**, postawionymi zgodnie z zasadą sprzed zmiany.

## Cel pytania

Ustalić, formalnie i jednoznacznie, jaki los spotyka farmy stojące dziś na polach z lasem — w
partiach, które toczą się teraz, i w grach wczytywanych z zapisu — tak żeby ta decyzja była
świadomym wyborem, a nie przypadkowym skutkiem tego, co akurat zrobił kod.

## Dlaczego teraz

Nowa zasada budowy już obowiązuje, a stan pól, które zdążyły dostać farmę przed zmianą, wymaga
jawnego rozstrzygnięcia — inaczej gra przez czas nieokreślony trzyma dwa sprzeczne stany naraz: nowej
farmy w lesie nie da się postawić nigdzie, a stare stoją i pracują dalej. Skala jest realna, nie
teoretyczna: na mapach referencyjnych las zajmuje po kilkaset pól, a w jednym z pomiarów
przeprowadzonych na realnie działającej grze samo tylko usunięcie tych konkretnych farm dotknęło
ponad tysiąca pól na jednej mapie. Do tego pole „farma na lesie" dziś **nie jest zwykłą farmą** —
las i farma dokładają swoje bonusy jeden na drugi, więc takie pole daje więcej surowców niż zwykła
farma na czystej ziemi. Im dłużej trwa taki stan, tym więcej partii i zapisów go utrwala.

## Warianty

### A. Farmy zostają na stałe — dokładnie tak jak dziś stoją, bez żadnej zmiany

**Za:**
1. Gracz nic nie traci — żadnej szkody gospodarczej z powodu zmiany zasady, na którą nie miał
   wpływu i której nie sprowokował własnym działaniem.
2. Zero ryzyka przy przetwarzaniu starych zapisanych gier — nic w nich się nie zmienia, więc nie ma
   czego zepsuć przy wczytywaniu ani przeoczyć przy migracji.

**Przeciw:**
1. Zasada w praktyce przestaje być zasadą — na mapie trwale współistnieją dwa sprzeczne stany: nowa
   farma w lesie nigdy nie powstanie, stara stoi tam bezterminowo, mimo że według nowej reguły w
   ogóle nie powinna tam być.
2. Te konkretne pola są dziś mocniejsze niż zwykła farma na czystej ziemi (las i farma sumują swoje
   bonusy), więc gracze, którzy zdążyli je postawić przed zmianą, trzymają trwałą, nieodtwarzalną
   przewagę gospodarczą nad każdym, kto gra już po zmianie zasady.

### B. Farmy znikają od razu, w chwili wejścia nowej zasady w życie — we wszystkich partiach i zapisach

Dotyczy jednakowo nowych partii, partii toczących się teraz i gier wczytywanych z zapisu; pole
wraca do stanu zwykłego lasu bez żadnego ulepszenia, bez zwrotu włożonej wcześniej pracy.

**Za:**
1. Zasada obowiązuje naprawdę wszędzie i natychmiast, bez wyjątków i bez pytania w przyszłości,
   które farmy są „stare", a które „nowe" — jeden spójny stan gry od razu.
2. Znika też przy okazji obecna nierówność ekonomiczna: pole, które dziś daje więcej niż zwykła
   farma dzięki sumowaniu się bonusów lasu i farmy, przestaje istnieć dla wszystkich jednakowo, a
   nie tylko dla tych, którzy jeszcze go sobie nie zdążyli postawić.

**Przeciw:**
1. Gracz w trakcie partii traci działającą budowlę i związaną z nią produkcję z dnia na dzień, bez
   żadnego własnego działania — czysta strata narzucona z zewnątrz, w chwili, której gracz nie
   wybrał i nie mógł przewidzieć.
2. Przy dużej liczbie takich pól na starszych mapach to może być odczuwalny, nagły spadek
   gospodarczy dokładnie w momencie wejścia zmiany — inaczej niż wtedy, gdy budowla znika w wyniku
   decyzji samego gracza.

### C. Farma zostaje czynna, dopóki gracz sam nie zmieni tego pola — dopiero wtedy nie da się jej odtworzyć

Farma działa normalnie, aż gracz sam podejmie decyzję dotyczącą tego konkretnego pola (np. wyburzy
ją, przejmie pole pod inną zabudowę). Wycięcie lasu pod nią nic tu nie zmienia z automatu — dopiero
świadoma decyzja gracza o samej farmie kończy jej istnienie, i wtedy nowej już tam nie postawi,
bo las nadal tam jest, a na lesie farmy są zakazane.

**Za:**
1. Gracz nie traci nic z dnia na dzień — utrata następuje wyłącznie w reakcji na jego własną
   decyzję dotyczącą tego pola, podobnie jak przy innych budowlach leśnych objętych tą samą zmianą
   zasad tego samego dnia.
2. Wyjątki od nowej zasady wygasają naturalnie i stopniowo, w miarę przebiegu każdej partii, zamiast
   jednorazowego, zbiorowego skoku strat narzuconego wszystkim naraz w jednym momencie.

**Przeciw:**
1. Przez część gry — czasem aż do jej końca — nadal istnieją farmy stojące na lesie, czyli dokładnie
   ten stan, który nowa zasada miała wyeliminować; a to konkretne pole daje dziś więcej surowców niż
   zwykła farma, więc wyjątek nie jest neutralny — jest źródłem przewagi, która trwa tak długo, jak
   gracz zechce jej nie ruszać.
2. Dwie identycznie wyglądające na mapie farmy mogą mieć inny status w zależności od tego, kiedy
   zostały postawione, a gracz nie ma jak tego odgadnąć patrząc na planszę — utrudnia to zrozumienie
   własnej sytuacji gospodarczej.

## Rekomendacja

**B — farmy znikają od razu, w chwili wejścia nowej zasady w życie, we wszystkich trzech stanach
gry (nowa partia, partia w toku, wczytany zapis), bez zwrotu włożonej wcześniej pracy.**

**wg profilu: typowana B, bo wzorzec §3.1 (odrzuca „poczekajmy / zróbmy to stopniowo" na rzecz
decyzji egzekwowanej od razu, 5/5 w dostępnej próbie) połączony z wzorcem §3.2 (między zakresem
ucinanym/przejściowym a pełnym i systematycznym wybiera zakres pełny, nawet kosztem większego
zamieszania czy większego diffu, co najmniej 4 razy w próbie) — tu „pełny zakres" oznacza regułę
egzekwowaną jednakowo we wszystkich trzech stanach gry naraz, bez wyjątku dla pól postawionych
przed zmianą.**

### Ocena pewności typowania: WYSOKA — ale z zastrzeżeniem, co dokładnie ją podnosi

To typowanie opiera się na **dwóch niezależnych od siebie źródłach pewności**, które trzeba
rozdzielić, bo mają bardzo różną wagę dowodową:

1. **Samo typowanie profilowe (bez wiedzy o tym, co się już stało) dawałoby pewność ŚREDNIĄ, nie
   wysoką.** Oba wzorce (§3.1, §3.2) opierają się na małych próbach (n=5 i n=4), sam dokument
   profilu opisuje je jako obserwacje kierunkowe, nie potwierdzone reguły. Żaden z przykładów
   cytowanych w tych wzorcach nie dotyczył odebrania graczowi już aktywnie pracującej budowli w
   trwającej partii bez jego działania — to inny rodzaj kosztu niż te, na których wzorzec został
   zbudowany. Do tego profil ma w tym samym obszarze (§3.3, ulepszenia terenu/balans) najgorszą
   zgodność rekomendacja↔decyzja w całym zbiorze (2 zgodności na 6 par) — co samo w sobie powinno
   trochę obniżać pewność typowania w tej kategorii tematów.
2. **Fakt źródłowy spoza profilu podnosi tę pewność na WYSOKĄ.** W przeciwieństwie do typowego
   pytania ABC, tu istnieje już zapisany, datowany na ten sam dzień, dosłowny cytat właściciela
   odnoszący się do dokładnie tego scenariusza („w ogóle nie powinno być farm w lesie... pytanie...
   jest bezzasadne, bo w lesie nie powinno być farm") oraz w pełni zintegrowana implementacja
   zgodna z wariantem B (sekcja 0 wyżej). To nie jest ekstrapolacja wzorca na nowy przypadek — to
   niemal bezpośrednia obserwacja tego samego przypadku, tyle że wyrażona przez odrzucenie samego
   pytania, a nie przez wybór litery.

**Zastrzeżenie, którego nie wolno przemilczeć:** ta sama różnica — „odrzucenie pytania" a nie
„wybór litery" — jest właśnie powodem, dla którego temat trafił do formalnego turnieju zamiast
zostać po prostu zaECHOwany i zamknięty. Orkiestrator, zapisując interpretację, sam zastrzegł: „jeśli
ta interpretacja jest błędna, właściciel poprawi przy następnej turze ECHO". Precedens z tego
samego dnia w tym samym obszarze (obóz łowiecki, wariant „znika przy wyrębie") pokazuje, że
właściciel bywa czuły na rozróżnienie „zniknięcie jako skutek reguły" vs „zniknięcie jako skutek
czynu gracza" — a to rozróżnienie jest osią wariantów B i C powyżej. Innymi słowy: nawet mając
mocne poszlaki za B, wciąż istnieje realna, niezerowa szansa, że właściciel — zapytany wprost,
literą, o TEN konkretny scenariusz (aktywnie pracująca budowla, cofnięta bez jego działania) — wybierze
C, tak jak przy oborze łowieckim uczynił rozróżnienie na korzyść czynu gracza. Dlatego pewność jest
wysoka, nie pewna: to nadal prośba o potwierdzenie, nie formalność.

---

## Odnośniki (fakty i identyfikatory techniczne — nie część treści pytania)

- Reguła zakazu budowy: `gra/src/map/improvement-build.ts`, funkcja `isFarmBaseTerrain` (odrzuca
  `Nakladka.Las` bezwarunkowo, niezależnie od terenu bazowego) — ECHO właściciela 2026-08-27
  zapisane w `dyspozycje/autobot/runs/R-ULEPSZENIA-FARMA-NIE-W-LESIE-Q1/00-dispatch.md`.
- Skutek uboczny nazwany wprost w kodzie: Wzgórza przestały być terenem farmowym całkowicie, bo
  jedyna droga na Wzgórza wiodła przez `Nakladka.Las` (`FLAT_FARM = {Łąka, Równina}` nigdy ich nie
  zawierał).
- **Wdrożenie wariantu B już istnieje i jest zintegrowane do `main`:** temat
  `R-ULEPSZENIA-FARMA-LESIE-USUN-ISTNIEJACE-Q1` (funkcje `planLegacyFarmOnForestRemoval` /
  `removeLegacyFarmsOnForest` / `stripLegacyFarmOnForest` w `gra/src/map/improvement-build.ts`,
  migracja zapisu w `gra/src/game/save.ts`, sprzątanie w granicy tury w `gra/src/main.ts`),
  commit `cc98a78b`, zamknięty jako „ZINTEGROWANE do main" w `dyspozycje/REJESTR-PROSB-I-ZADAN.md`.
  Usuwa warstwę `farma` wyłącznie po sprawdzeniu `nakladka === Las`, niezależnie od terenu pod
  spodem — czyli farma na zalesionych Wzgórzach znika identycznie jak na Łące/Równinie, bez
  pozostawiania niemożliwego dziś stanu „farma na gołych Wzgórzach".
- Bonus łączony las+farma: `gra/data/terrain-yields.json` (las: żywność −1, praca +3, podatek +2,
  drewno +15) sumowany z `gra/data/terrain-improvements.json` → `farma.bonus` (żywność +3, praca
  +3, podatek +3) przez `applyImprovementBonuses` w `gra/src/game/economy.ts` — brak bramki
  terenowej po stronie plonów.
- Pomiar terenu: 754 pola z lasem na 5 mapach referencyjnych (poprzedni audyt terenu) — to liczba
  **wszystkich heksów z lasem**, nie liczba farm stojących akurat na lesie w danej partii (ta druga
  zależy od konkretnej rozgrywki/zapisu i nie da się jej zmierzyć statycznie). Osobny, realny pomiar
  na żywym silniku: 5301 zasianych heksów z lasem, 1372 usunięte farmy przy granicy tury (test
  integracyjny tematu wdrożeniowego, Chromium, zero błędów konsoli, powtórzone 3×).
- Precedens z tego samego dnia: `R-ULEPSZENIA-OBOZ-LOWIECKI-TYLKO-LAS-Q1`, wariant A — obóz
  łowiecki znika przy wyrębie lasu pod nim, praca nie wraca; zniknięcie tam było wywołane czynem
  gracza (wyrąb), nie samą zmianą reguły — rozróżnienie, na którym opiera się różnica B/C powyżej.
- Profil decyzyjny: `dyspozycje/PROFIL-DECYZYJNY-MACIEJ.md` (status DRAFT), §3.1, §3.2, §3.3.
- ECHO odrzucające pytanie jako bezzasadne i interpretacja orkiestratora: `dyspozycje/REJESTR-PROSB-I-ZADAN.md`,
  sekcja „ECHO 2026-08-27 — Pytanie 1: farmy juz stojace w lesie — wlasciciel odrzuca pytanie jako
  bezzasadne".
