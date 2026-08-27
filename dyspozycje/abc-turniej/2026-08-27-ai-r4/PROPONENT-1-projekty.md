# Proponent 1 — projekty ABC, runda 4 tematu R-AI-WYRAB-PRZY-RZECE-FARMY-Q1

**Autor:** Proponent 1 (turniej C-018), model Opus 5, effort high — ta sama sesja pełni dalej rolę
Sędziego, dlatego ten plik powstaje i jest commitowany **przed** oceną projektu Proponenta 2.

**Zastrzeżenie jawne (uczciwość turnieju):** projekt Proponenta 2 był wklejony w treści zlecenia,
którym mnie uruchomiono, więc **nie mogę twierdzić, że pisałem w pełnej izolacji informacyjnej**.
Mówię to wprost zamiast udawać, że warunek §Proponent 2 był tu spełniony w obie strony. Konsekwencja
proceduralna: w werdykcie stosuję wobec tego projektu **ostrzejszą** miarę niż wobec cudzego, a każdy
punkt przewagi tego projektu jest oparty na **sprawdzeniu, które wykonałem własną ręką w kodzie,
danych i raportach**, nie na redakcji.

**Podstawa faktograficzna — moja ręka, nie przepisane z dispatchu:**

- `gra/src/main.ts:27192` → `skipWyrab: true` (AI GRACZA), `gra/src/game/ai.ts:1999` → `skipWyrab: false`
  (AI CYWILIZACJI) — przeczytane w drzewie głównym.
- `gra/src/game/auto-improvements.ts:61` → `ULEPSZENIA_FOCUS_ZROWNOWAZONE = AI_IMPROVEMENT_PRIORITY`
  (ta sama stała), ale `prioritiesForUlepszeniaFocus` (`:68-95`) używa jej **wyłącznie dla profilu
  `zrownowazone`**; profile `zywnosc`/`surowce`/`infrastruktura` mają własne, rozłączne listy.
  **Wniosek: przycięcie tej listy dotyka AI CYWILIZACJI zawsze, a AI GRACZA tylko na profilu
  „Zrównoważona" (domyślnym) — nie na trzech pozostałych.** Tego rozróżnienia nie ma w surowych faktach.
- `gra/data/terrain-improvements.json`: `warzelnia_soli` = `{pieniadz 1, zywnosc 1, praca 1, handel 3}` —
  **ma +1 żywności, nie zero**; `glinianka` = `{praca 1, glina 10, handel 2}` (zero żywności);
  `droga` = `{handel 2}`, `droga_brukowana` = `{handel 3}` (zero); `farma` = `{zywnosc 3, praca 3, handel 3}`;
  `lodzie_rybackie` = `{zywnosc 2, praca 3, handel 3}` — **+2 żywności**, więc mimo że Final Control
  wymienia je w blokadzie 1 jako kandydata do przycięcia (79 sztuk), **przycięcie ich obniżyłoby
  żywność, nie podniosło**; wykluczam je z listy kandydatów i mówię dlaczego.
- Odzysk: 42,2 % (Operator, `01-operator-runda3.md`), 42,8 % / 32,1 % (Evaluator, `02-evaluator-runda3.md`),
  46,0 % (Final Control, `03-final-control-runda3.md`, worktree `wt-fc-ai3`) — trzy role, trzy zestawy ziaren.
- **Próg „ma odbić większość z −16,8 %" pochodzi z `00-dispatch.md` § „RUNDA 3 — ECHO właściciela",
  sekcja ZADANIE RUNDY 3 / A — czyli od orkiestratora, NIE z ECHO właściciela.** ECHO właściciela
  rundy 2 brzmi dosłownie tylko: „W-B: domykaj tylko to, co daje plon". Sprawdzone w commicie
  `a2a7851d` (całe 117 linii dopisku). To jest fakt zmieniający sposób postawienia pytania 1.
- **Rozkład odzysku:** samo W-B daje +154 (26,0 %), wyrąb dokłada +96 (`op3-warianty.txt`, cyt.
  w raporcie Operatora). Czyli **większość odzysku pochodzi z W-B, nie z wyrębu** — zdanie
  „odzysk z decyzji o wycince" byłoby błędne.
- Baza 3522 (Operator) / 3429 (FC) / 3391 (Evaluator) pochodzi z rozkładu kategorii **600/0/0**,
  który właściciel odrzucił w rundzie 2. Mierzymy więc odzysk **względem stanu, który sam odrzucił**.
- Panel ustawień automatu gracza **już istnieje**: `gra/src/ui/buildModeHud.ts:103-618` — profil
  budowy per państwo i per miasto oraz przełącznik „Tylko pola z obywatelami". Kolejny przełącznik
  jest pozycją w istniejącym panelu, nie nowym ekranem.

Decyzje właściciela z rund 1 i 2 („wycinać mimo to", W-B) traktuję jako wiążące i nie podważam ich
w treści pytań.

---

## PYTANIE 1 — `R-AI-WYRAB-PRZY-RZECE-FARMY-R4-Q1`

### Sytuacja

Dwie rundy temu powiedziałeś, że komputerowe cywilizacje mają brać teren **heks po heksie** i domykać
każdy z nich tym, co daje plon — zamiast rozgrzebywać kilkanaście naraz. Powiedziałeś też, że mają
budować **równomiernie**, a nie wyłącznie pod jedzenie. Obie rzeczy działają i są zmierzone: przeciwnik
trzyma dziś w robocie trzy heksy zamiast trzydziestu jeden i wraca do zaczętego heksa w niecałą turę
zamiast po dwudziestu trzech.

Ma to cenę, którą też zmierzono. Przedtem komputerowe cywilizacje stawiały **wyłącznie** ulepszenia
żywnościowe — sześćset rozkazów na sześćset — i miały przez to najwyższą możliwą produkcję jedzenia.
Ten stan sam odrzuciłeś jako zwyrodniały. Dziś jedzenie u przeciwnika jest o kilkanaście procent niższe
niż w tamtym zwyrodniałym stanie i odbiło mniej więcej **czterdzieści procent** tego spadku: trzy
niezależne pomiary dają 42, 43 i 46 procent, a najostrożniejszy model terenu 32 procent.

**Dwie rzeczy mówię wprost, żebyś nie decydował pod presją cudzej liczby.** Po pierwsze: próg „ma odbić
więcej niż połowę" ustawiliśmy **sami**, na wewnętrzne potrzeby rundy — Ty go nigdy nie ustalałeś.
Po drugie: większość tego, co odbiło, przyniosło samo domykanie heksów, a nie zgoda na wycinkę lasu —
wycinka dołożyła mniej więcej jedną trzecią odzysku.

Reszty nie da się odzyskać bez ruszenia Twojego wymogu równomierności. Co trzeci rozkaz budowy idzie
dziś u przeciwnika w rzeczy, które dają dochód, ale jedzenia nie dają wcale albo dają śladowo:
**warzelnie soli** (około siedemdziesięciu, +1 jedzenia przy +3 handlu), **drogi zwykłe i brukowane**
(około pięćdziesięciu, zero jedzenia), **glinianki** (około trzydziestu, zero jedzenia).

**Zasięg tej decyzji — ważne.** Kolejność, według której komputerowe cywilizacje wybierają, co
zbudować, jest **tą samą kolejnością**, z której korzysta automat budujący w miastach gracza, gdy
gracz zostawi mu domyślne ustawienie „zrównoważone". Zmiana obejmie więc też gracza, ale **tylko na
tym jednym ustawieniu** — trzy pozostałe (jedzenie, surowce, infrastruktura) mają własne kolejności
i zostaną nietknięte.

### Cel pytania

Rozstrzygnąć, czy komputerowe cywilizacje mają dalej budować równomiernie kosztem niższej produkcji
jedzenia, czy przesunąć ich priorytety w stronę jedzenia — a jeśli tak, to na stałe czy tylko wtedy,
gdy miasto jeszcze rośnie.

### Dlaczego teraz

Czwarta z pięciu dozwolonych rund tematu nie ruszy bez tej odpowiedzi. Strojenie liczb bez wiedzy,
czy w ogóle wolno ruszyć wymóg, który sam postawiłeś, byłoby zgadywaniem za Ciebie — a temat ma po tej
rundzie już tylko jedną w zapasie.

### Warianty

**Wariant A — zostaje równomiernie; niższe jedzenie przyjmujemy jako cenę i zdejmujemy nasz własny próg.**
Nic się nie zmienia w kolejności budowania. Uznajesz obecny odzysk za wystarczający i temat idzie dalej
bez tego kryterium.

- Za (1): Twój wymóg równomiernej rozbudowy zostaje nienaruszony — komputerowa gospodarka jest
  zróżnicowana, a przeciwnik buduje drogi, warzelnie i kopalnie, nie samą żywność.
- Za (2): „Strata" jedzenia liczy się względem stanu, który sam odrzuciłeś jako zwyrodniały — to nie
  jest cofnięcie się wobec czegoś dobrego, tylko cena wyjścia z czegoś złego, i ta cena jest już
  zapłacona.
- Przeciw (1): Komputerowe miasta rosną wolniej, niż mogłyby — w dłuższej rozgrywce przeciwnik będzie
  mniejszy i słabszy, czyli gra będzie łatwiejsza, niż zakładasz.
- Przeciw (2): Zgodziłeś się płacić drewnem za wycinkę lasu przy rzece (drewno u przeciwnika spadło
  o jedną czwartą, tartaki z około siedemdziesięciu do dwudziestu). Przy wariancie A ta zapłata kupuje
  bardzo niewiele jedzenia netto.

**Wariant B — jedzenie ma trwałe pierwszeństwo: rzeczy bez jedzenia schodzą na koniec kolejki.**
Warzelnie soli, drogi i glinianki komputerowe cywilizacje budują dopiero wtedy, gdy nie mają już czego
postawić pod jedzenie. **To jest wprost cofnięcie części Twojego własnego wymogu równomierności z
poprzedniej rundy** — piszę to jawnie, żebyś to widział teraz, a nie odkrył za dwie rundy.

- Za (1): Produkcja jedzenia przeciwnika wyraźnie rośnie, wycinka lasu zaczyna się realnie zwracać,
  a przeciwnik staje się poważniejszym rywalem w rozgrywce.
- Za (2): Kolejność budowania wraca do tego, co uzasadniało samą zgodę na wycinkę — więcej jedzenia —
  zamiast rozjeżdżać się na cele, których wtedy nie kupowałeś.
- Przeciw (1): Gospodarka przeciwnika znowu robi się jednostronna — nie tak skrajnie jak przed
  poprzednią rundą, ale w tę samą stronę, którą wtedy odrzuciłeś.
- Przeciw (2): Drogi to nie tylko dochód. Mniej dróg u przeciwnika oznacza wolniejsze przerzucanie jego
  wojsk i słabszą sieć handlową — zmiana dotknie też tego, jak przeciwnik prowadzi wojnę, nie tylko
  jak się bogaci.
- Przeciw (3): Obejmie też automat gracza na domyślnym ustawieniu — gracz, który mu ufa, dostanie mniej
  dróg i warzelni w swoich miastach, choć o to nie prosił.

**Wariant C — jedzenie ma pierwszeństwo tylko dopóki miasto rośnie, potem wraca równomierność.**
Młode, rosnące miasto przeciwnika buduje najpierw pod jedzenie; kiedy ma już z czego rosnąć, wraca do
budowania szerokiego. Skutek dla gracza: przeciwnik rozpędza się szybciej na starcie, ale w środku gry
ma normalną, zróżnicowaną gospodarkę.

- Za (1): Nie cofa Twojego wymogu na stałe — równomierność zostaje regułą, a odstępstwo dotyczy tylko
  fazy, w której jedzenie faktycznie decyduje o wzroście.
- Za (2): Uderza dokładnie tam, gdzie jedzenie jest najwięcej warte, więc kupuje najwięcej wzrostu za
  najmniejsze naruszenie różnorodności gospodarki.
- Przeciw (1): Zachowanie przeciwnika przestaje być jednolite — gracz trudniej przewidzi, co
  komputerowy sąsiad zrobi, bo zależy to od tego, czy jego miasto akurat rośnie.
- Przeciw (2): To najbardziej ruchoma z trzech odpowiedzi — najwięcej do zmierzenia i dostrojenia,
  a temat ma po tej rundzie już tylko jedną w zapasie; ryzyko, że skończy się bez dostrojenia.
- Przeciw (3): To nadal jest odstępstwo od równomierności, tylko warunkowe — jeśli uważasz sam wymóg
  za nienaruszalny, ten wariant też go narusza.

### Rekomendacja

**Wg profilu: typowana B — z NAJNIŻSZĄ pewnością z obu pytań.**

Dlaczego B: w Twoim profilu decyzyjnym widać dwa kierunki, które tu pasują. Po pierwsze, gdy problem
jest już zdiagnozowany liczbami, nie przyjmowałeś dotąd „zostawmy jak jest" za samodzielną odpowiedź —
to działa przeciwko wariantowi A. Po drugie, gdy wybór szedł między zakresem uciętym a pełnym,
wybierałeś pełny, nawet kosztem większej zmiany — to stawia B przed C.

Dlaczego mimo to pewność jest najniższa: to pytanie należy dokładnie do kategorii „balans i trudność
komputerowego przeciwnika", a to jest **jedyny obszar Twojego profilu, w którym typowanie regularnie
się nie sprawdza** — z sześciu takich pytań cztery rozstrzygnąłeś inaczej, niż rekomendowano, i po
zagraniu zwykle wracasz tu do własnej oceny, nie do cudzej litery. Traktuj to typowanie jako najsłabsze
z całego turnieju: informację, nie sugestię.

<details>
<summary>Odnośnik techniczny (poza treścią pytania)</summary>

Odzysk: 42,2 % (Operator, `op3-pomiar-po.txt`), 42,8 % harness / **32,1 % model wierny terytorium**
(Evaluator, `ev3-pomiar-wierny.txt`), 46,0 % (Final Control, `fc3-kronika-trzy-stany.cjs`).
Rozkład odzysku (`op3-warianty.txt`): samo W-B +154 (26,0 %), wyrąb +96. Kandydaci do przycięcia:
`warzelnia_soli` 69–81 szt. (`{pieniadz 1, zywnosc 1, praca 1, handel 3}` — **+1 żywności, nie zero**),
`droga` + `droga_brukowana` 48–49 szt. (0 żywności), `glinianka` 27–29 szt. (0 żywności).
**`lodzie_rybackie` (65–79 szt.) wykluczone z listy kandydatów mimo wzmianki w blokadzie 1 Final
Control — mają `zywnosc: 2`, więc ich przycięcie obniża żywność.** Mechanizm wspólny:
`auto-improvements.ts:61` `ULEPSZENIA_FOCUS_ZROWNOWAZONE = AI_IMPROVEMENT_PRIORITY`, użyte w
`prioritiesForUlepszeniaFocus` **wyłącznie dla `focus === 'zrownowazone'`** — pozostałe trzy profile
AI GRACZA mają własne listy i są poza zasięgiem tej decyzji. Próg „większość z −16,8 %" pochodzi
z `00-dispatch.md` §RUNDA 3/ZADANIE A (commit `a2a7851d`), nie z ECHO właściciela. Wariant C wymaga
nowego warunku w `pickAutoImprovements` i uwagi na `E1 max = 5 przy limicie 5` (zero zapasu).
Wzorce profilu: §3.1 (odrzuca status quo przy zdiagnozowanym problemie), §3.2 (pełny zakres nad
częściowym), §3.3 (balans AI — najniższa moc predykcyjna, 4/6 rozbieżności).

</details>

---

## PYTANIE 2 — `R-AI-WYRAB-PRZY-RZECE-FARMY-R4-Q2`

### Sytuacja

Zgodziłeś się, żeby przy rzece wycinać las pod farmę, mimo że bilans jest ujemny: jedzenia przybywa
niewiele, a ubywa pracy, handlu i — najwyraźniej — drewna. Zmierzyliśmy to u komputerowych przeciwników
po wdrożeniu: drewna mają o jedną czwartą mniej, tartaków spadło z około siedemdziesięciu do dwudziestu,
obozów łowieckich podobnie.

Ta zgoda została wdrożona **wyłącznie przeciwnikom**. Automat, który buduje ulepszenia w miastach
gracza, **nigdy nie wycina lasu** — na żadnym ze swoich czterech ustawień. To nie jest usterka:
blokada została kiedyś postawiona celowo, żeby automat nie ruszał lasu gracza. Nigdy natomiast nie
padło, czy Twoje „wycinać mimo to" miało objąć również ten automat, czy tylko przeciwników.

### Cel pytania

Rozstrzygnąć, czy automat budujący w miastach gracza ma wycinać las pod farmę przy rzece — tak jak
robią to dziś komputerowi przeciwnicy — czy ma zostać przy dzisiejszej ostrożności, czy ma to być
przełącznik po stronie gracza.

### Dlaczego teraz

Temat zamyka się najpóźniej w piątej rundzie. Jeśli automat gracza ma wycinać, trzeba na to zrobić
miejsce w zakresie prac **przed** startem następnej rundy, a nie w jej trakcie — obszar gry, którego
to dotyczy, był dotąd z tego tematu wyłączony. Bez odpowiedzi zostaje trwała różnica między tym, co
robi przeciwnik, a tym, co robi automat gracza, nigdzie nie zapisana jako czyjaś decyzja.

### Warianty

**Wariant A — automat gracza wycina tak samo jak przeciwnicy.**
Gracz, który zostawi budowanie ulepszeń automatowi, zobaczy, że automat zaczyna wycinać jego lasy przy
rzece i stawiać tam farmy — z tymi samymi skutkami, które zmierzono u przeciwników.

- Za (1): Gracz korzystający z automatu nie jest w gorszej pozycji niż komputerowi rywale, którzy tę
  taktykę już stosują — jedne zasady dla obu stron.
- Za (2): Decyzja „wycinać mimo to" obowiązuje wszędzie, gdzie ma zastosowanie, zamiast po cichu
  omijać jedną stronę rozgrywki.
- Przeciw (1): Automat zacznie ścinać lasy gracza bez pytania — także te, które gracz świadomie trzymał
  pod tartaki i obozy łowieckie; dla części graczy to utrata kontroli nad własnym terenem.
- Przeciw (2): Drewno gracza spadnie mniej więcej o jedną czwartą, tak jak u przeciwników — a gracz
  poczuje to mocniej, bo to jego własne budowle leśne przestaną mieć czym pracować.

**Wariant B — zostaje jak jest: automat gracza nie wycina, wycinka pozostaje ruchem ręcznym.**
Gracz może wyciąć las sam, kiedy chce; automat nigdy tego za niego nie zrobi.

- Za (1): Las gracza nie znika bez jego ręki — nic w toczących się rozgrywkach nie zmienia się
  z zaskoczenia.
- Za (2): Zgodne z Twoją stałą regułą, że automat wspierający gracza i komputerowy przeciwnik to dwie
  różne rzeczy i nie muszą zachowywać się tak samo — automat ma być ostrożny, przeciwnik ma grać.
- Przeciw (1): Automat gracza gra słabiej niż przeciwnicy — nie sięga po taktykę, którą sam im dałeś,
  więc gracz, który mu ufa, jest z definicji z tyłu.
- Przeciw (2): Ta różnica nie jest nigdzie widoczna dla gracza — nie dowie się, że jego automat celowo
  odpuszcza coś, co robi komputerowy sąsiad.

**Wariant C — przełącznik przy ustawieniach automatu: „wolno wycinać las".**
Gracz sam włącza albo wyłącza wycinkę w automacie, dla całego państwa albo dla wybranego miasta.

- Za (1): Gracz sam ocenia, czy ten kompromis — więcej jedzenia za wyraźnie mniej drewna — mu się
  opłaca, zamiast dostawać odpowiedź narzuconą.
- Za (2): Automat ma już własny panel ustawień, w którym gracz wybiera profil budowania dla państwa
  i dla pojedynczego miasta oraz przełącza „tylko pola z obywatelami" — to jedna pozycja więcej
  w miejscu, do którego gracz i tak zagląda, a nie nowy ekran do wymyślenia.
- Przeciw (1): Wartość domyślna tego przełącznika **i tak jest decyzją** — pytanie wraca w mniejszej
  skali, tylko przesunięte o krok.
- Przeciw (2): Część graczy nigdy tego panelu nie otworzy i dostanie zachowanie, którego świadomie nie
  wybrała — z ich punktu widzenia to ten sam problem co w wariantach A albo B.

### Rekomendacja

**Wg profilu: typowana A — pewność średnia, wyraźnie wyższa niż w pytaniu 1.**

Dlaczego A: to nie jest nowe pytanie o balans przeciwnika (czyli najsłabszy obszar typowania), tylko
pytanie, czy decyzja, którą już podjąłeś, obowiązuje wszędzie, gdzie ma zastosowanie. Pasują tu dwa
mocniejsze kierunki z Twojego profilu: odrzucałeś odkładanie rozstrzygnięcia i przerzucanie go dalej,
gdy problem był już zdiagnozowany — to stawia wariant C nisko; a między zakresem częściowym a pełnym
wybierałeś pełny — to stawia A przed B.

Przeciwko temu typowaniu stoi jednak jedna Twoja **własna, stała reguła**: automat wspierający gracza
to nie to samo co komputerowy przeciwnik i nie musi robić tego samego. Ta reguła jest realnym
argumentem za B i dlatego nie stawiam tu pewności wysokiej. Dodatkowo skutek dotyka bezpośrednio tego,
co gracz zobaczy we własnych miastach — a nie tylko tego, jak gra komputer.

<details>
<summary>Odnośnik techniczny (poza treścią pytania)</summary>

`gra/src/main.ts:27192` → `skipWyrab: true` dla wspólnego pickera używanego przez automat gracza;
`gra/src/game/ai.ts:1999` → `skipWyrab: false` dla AI CYWILIZACJI (obie linie przeczytane w drzewie
głównym; Final Control potwierdził je też na drzewie próbnego merge'a). Filtr działa w
`prioritiesForUlepszeniaFocus` (`auto-improvements.ts:90-93`) i w `:411`, więc dotyczy **wszystkich
czterech profili** automatu gracza. Wariant A = rozszerzenie allowlisty rundy 4 o jedną linię
`main.ts` (plik dotąd poza zakresem tematu). Wariant C = ta sama linia plus jedno pole stanu
i jeden przełącznik w istniejącym panelu `gra/src/ui/buildModeHud.ts:103-618` (obok
`onUlepszeniaEmpireOnlyWorkedChange` / `onUlepszeniaCityOnlyWorkedChange`). Zmierzone skutki u AI
CYWILIZACJI (runda 3): `tartak` 69→22, `oboz_lowiecki` 71→23, drewno terytorium 2785→2065 (FC: 2570→1925,
−25,1 %). Dług dowodowy: ścieżka AI GRACZA nadal mierzona odtworzoną konfiguracją (closure `boot()`),
nie prawdziwym wejściem — dotyczy wiarygodności pomiaru, nie treści decyzji.
Wzorce profilu: §3.1, §3.2; kontrargument = reguła stała właściciela o rozróżnieniu AI GRACZA / AI CYWILIZACJI.

</details>

---

## Samokontrola §10a

1. **Na głos, bez kontekstu.** Pytanie 1 czyta się jako „czy komputerowy przeciwnik ma budować
   wszystkiego po trochu, czy głównie pod jedzenie". Pytanie 2 — „czy automat, który buduje za gracza,
   ma wycinać jego las pod farmę". Obie odpowiedzi da człowiek spoza projektu.
2. **Brak nazw własnych w treści.** W Sytuacji / Celu / Dlaczego teraz / Wariantach nie ma żadnej
   nazwy pliku, funkcji, flagi, narzędzia ani numeru paragrafu — **także w Rekomendacji**: wzorce
   z profilu opisane są słowami („gdy problem był zdiagnozowany…", „między zakresem uciętym a pełnym…"),
   a numery paragrafów siedzą w odnośniku. Nazwy własne, które **zostają**, to nazwy rzeczy widocznych
   dla gracza w grze (warzelnia soli, glinianka, droga, tartak, obóz łowiecki) — to nie są
   identyfikatory wewnętrzne i ich usunięcie odebrałoby właścicielowi możliwość oceny wariantu.
3. **Warianty różnią się skutkiem.** Pytanie 1: ile różnorodności gospodarki przeciwnika zostaje i jak
   szybko rośnie (nigdy / na stałe / tylko gdy miasto rośnie). Pytanie 2: kto decyduje o losie lasu
   w miastach gracza (automat / gracz ręcznie / gracz przełącznikiem).
4. **Sprawdzian usunięcia nazw własnych — wykonany, nie zadeklarowany.** Po zamianie „warzelnia soli /
   glinianka / droga" na „budowla, która daje dochód, ale nie daje jedzenia" oba pytania nadal znaczą
   to samo. Żadne zdanie nie rozpada się bez nazwy — bo żadne nie jest zdaniem o mechanizmie.
5. **Żaden wariant nie jest pozorny.** W pytaniu 1 każdy z trzech ma innego racjonalnego adresata:
   A — „równomierność była moim celem, nie środkiem"; B — „chcę mocniejszego przeciwnika i zwrotu
   z wycinki"; C — „chcę obu rzeczy, kosztem złożoności". W pytaniu 2: A — „równe zasady", B —
   „automat gracza ma być ostrożny", C — „niech gracz wybierze".

## Poza tymi dwoma pytaniami — zgłoszenie do orkiestratora, nie do właściciela

Final Control rundy 3 wskazał w „CZEGO BRAKUJE" **trzy** rzeczy do decyzji właściciela, nie dwie.
Trzecia (blokada 4) nie jest objęta tym turniejem i **nie wolno jej zgubić**: liczba
`JEDEN_NA_ILU_OBYWATELI = 10` została przez Operatora rozciągnięta z ECHO o tartaku i obozie na
`posterunek`/`fort`, czego właściciel nie mówił, a skutek jest gameplayowy i zmierzony — **jedno
miasto na ziarno nie dostaje w czterdziestu turach żadnej obrony**. To jest materiał na osobne
pytanie ABC (albo na jawne dopisanie do jednego z powyższych), nie na cichą decyzję Operatora.
