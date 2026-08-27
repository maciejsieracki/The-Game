# Sędzia — werdykt turnieju C-018 i wersja finalna (R-AI-WYRAB-PRZY-RZECE-FARMY, runda 4)

**Sędzia:** rola Evaluatora, Opus 5, effort high. **Proponent 1:** ta sama sesja (projekt zapisany
i wypchnięty commitem `57b975d1` **przed** oceną). **Proponent 2:** Sonnet 5, commit `976de748`.

**Zastrzeżenie proceduralne, jawne:** projekt Proponenta 2 był wklejony w zleceniu uruchamiającym
Sędziego, więc **projekt Proponenta 1 nie powstał w pełnej izolacji informacyjnej** — wymóg
„bez podglądu" turniej spełnia w jedną stronę (Proponent 2 pisał bez podglądu), nie w obie.
Konsekwencja, którą stosuję: **każdy punkt przewagi Proponenta 1 musi opierać się na sprawdzeniu
wykonanym własną ręką w kodzie/danych/raportach, nie na redakcji** — i każdy taki punkt jest niżej
podparty konkretną linią źródła. Trzy defekty Proponenta 1 wskazuję poniżej równie twardo, jeden
z nich zmienia wersję finalną.

---

## WERDYKT: SYNTEZA (żaden projekt nie wygrywa w całości)

- **Pytanie 1:** szkielet i „typ" z obu (zbieżne), ale **oś wariantów Proponenta 2 upada** po ujawnieniu,
  kto ustawił próg 50 % — jego wariant C jest zdefiniowany wyłącznie przez ten próg. Faktografia
  Proponenta 1, **ale z jego własnym błędem zakresu naprawionym** i z wariantem C przebudowanym.
- **Pytanie 2:** wersja Proponenta 1 (ten sam „typ", ale z policzonym kontrargumentem i z poprawioną
  ceną wariantu C), z lepszymi sformułowaniami Proponenta 2 w Za/Przeciw wariantu A.

---

## WARSTWA 1 (dominująca) — kategoria tematu i jakość uzasadnienia „typu"

### Pytanie 1

| | Proponent 1 | Proponent 2 |
|---|---|---|
| kategoria | balans/trudność AI | balans/trudność AI |
| „typ" | B, pewność najniższa | B, pewność niska |
| wzorzec dominujący | §3.3 (najmniejsza moc predykcyjna, 4/6 rozbieżności) | §3.3, ta sama liczba |
| wzorce wspierające | §3.1 przeciw A, §3.2 B nad C | §3.1 przeciw A, §3.2 B nad C |

**Remis co do kategorii i typu — obaj trafili.** Rozstrzygam niuansem, który wypada **na korzyść
Proponenta 2**: jego §3.2 („pełny zakres nad częściowym") pasuje do **jego** zestawu wariantów idealnie,
bo jego C to mniejsza wersja B. U Proponenta 1 wariant C był **warunkowy**, nie częściowy, więc
argument §3.2 „B nad C" był u niego naciągnięty — §3.1 (przykład D3-v1.1-T4) dotyczy fazowania
wdrożenia, nie warunkowej reguły w grze, i nie wolno go tu podstawiać. **To jest punkt dla Proponenta 2
i przyznaję go wprost.** W wersji finalnej naprawiam to po swojej stronie: przebudowuję C na wariant
naprawdę częściowy (patrz niżej), przez co argument §3.2 staje się uczciwy, a nie dopasowany po fakcie.

### Pytanie 2

| | Proponent 1 | Proponent 2 |
|---|---|---|
| kategoria | konsekwencja decyzji już podjętej, nie nowy balans | to samo |
| „typ" | A, pewność średnia | A, pewność średnia |
| wzorce | §3.1 przeciw C, §3.2 A nad B | §3.1 przeciw C, §3.2 A nad B |
| **kontrargument z profilu** | **policzony**: reguła stała właściciela (AI GRACZA ≠ AI CYWILIZACJI) jest realnym argumentem za B i to ona, a nie „to nie czysta naprawa", uzasadnia obniżenie pewności | **niepoliczony**: reguła użyta wyłącznie jako wymóg redakcyjny; pewność obniżona uzasadnieniem słabszym (§3.4, „nie czysta naprawa techniczna") |

**Punkt dla Proponenta 1.** Uzasadnienie „typu" jest tyle warte, ile warta jest najmocniejsza rzecz,
którą się przeciw niemu wytacza. Proponent 2 typuje A z §3.1/§3.2 i **nie zderza tego** z jedyną
regułą właściciela, która w tym repo obowiązuje **stale i bezwarunkowo** — że automat gracza to nie to
samo co przeciwnik. Ta reguła nie jest formalnością redakcyjną; jest merytorycznym argumentem za B
i musi stać w Rekomendacji, inaczej „średnia pewność" jest podparta byle czym.

**Bilans Warstwy 1: 1 : 1.** Rozstrzyga Warstwa 2.

---

## WARSTWA 2 — zgodność z danymi, kompletność, trafność Za/Przeciw, czy domyka problem

### Defekty Proponenta 2 (każdy sprawdzony u źródła)

1. **BŁĄD ROZSTRZYGAJĄCY — „nie da się przyciąć wyłącznie przeciwnikom".** Proponent 2 pisze
   w Sytuacji pytania 1: *„mechanizm (…) jest wspólny (…) każda zmiana obejmie obie strony naraz,
   nie da się przyciąć wyłącznie przeciwnikom"*. **To jest nieprawda.** `gra/src/game/ai.ts:2002-2005`
   podaje pickerowi `priorityOverride: improvementPriorityForDeficits(AI_IMPROVEMENT_PRIORITY, …)` —
   AI CYWILIZACJI **już dziś** dostaje własną, budowaną na miejscu listę, a `basePriority` z profilu
   (`auto-improvements.ts:358`) jest wtedy **pomijany**. Przycięcie wyłącznie przeciwnikom jest w pełni
   wykonalne. Ciężar gatunkowy: to nie jest pomyłka w liczbie, tylko **fałszywe ograniczenie postawione
   właścicielowi przed wyborem** — odbiera mu opcję, którą realnie ma. Najcięższy defekt w całym turnieju.
2. **Mis-atrybucja odzysku — systemowa, nie wpadka.** *„jedzenie odzyskane dzięki wycince"*, *„odzysk
   jedzenia z decyzji o wycince"* (Sytuacja, Cel pytania, Za/Przeciw wariantów A i B, Rekomendacja).
   `op3-warianty.txt` cyt. w `01-operator-runda3.md`: **samo W-B daje +154 (26,0 %), wyrąb dokłada +96** —
   większość odzysku pochodzi z domykania heksów, nie z wycinki. Zdanie w tej postaci przypisuje
   decyzji Q1 właściciela dwa razy więcej skutku, niż miała.
3. **Faktografia listy kandydatów.** *„ulepszenia, które nie dają jedzenia (m.in. jeden gospodarczy,
   drogi, jeden surowcowy)"*. `gra/data/terrain-improvements.json`: `warzelnia_soli` =
   `{pieniadz 1, zywnosc 1, praca 1, handel 3}` — **daje +1 żywności**, a to najliczniejszy kandydat
   (69–81 szt.). Dodatkowo Proponent 2 zanonimizował nazwy **rzeczy widocznych w grze** („jeden
   gospodarczy", „jeden surowcowy") — §10a zakazuje nazw plików, funkcji, narzędzi i paragrafów,
   **nie** nazw budowli, które gracz widzi na mapie. Skutek: właściciel nie wie, co dokładnie znika.
4. **Naruszenie §10a we własnej treści.** W Rekomendacjach obu pytań stoją `§3.3`, `§3.1`, `§3.2`,
   a w samokontroli `§10a`. Rekomendacja jest częścią pytania; numer paragrafu w treści łamie warunek 2
   testu. Proponent 2 sam deklaruje w samokontroli, że *„żaden numer paragrafu nie występuje
   w Sytuacji/Celu/Wariantach"* — deklaracja jest prawdziwa co do litery i myląca co do rzeczy,
   bo Rekomendacji nie objęła.
5. **Zawyżona cena wariantu C w pytaniu 2:** *„dodatkowa rzecz do zbudowania i wytłumaczenia graczowi"*.
   Panel ustawień automatu **już istnieje** — `gra/src/ui/buildModeHud.ts:103-618`: profil budowy per
   państwo i per miasto oraz przełącznik „Tylko pola z obywatelami"
   (`onUlepszeniaEmpireOnlyWorkedChange`, `onUlepszeniaCityOnlyWorkedChange`). To jedna pozycja więcej
   w istniejącym panelu. Zawyżona cena wariantu przesuwa wybór właściciela — liczy się jak defekt, nie
   jak niuans.
6. **Wariant C pytania 1 jest pozorny po ujawnieniu progu.** Zdefiniowany jako „przytnij tyle, żeby
   odzysk **ledwie przekroczył połowę**". Próg „większość z −16,8 %" pochodzi z `00-dispatch.md`
   §RUNDA 3 / ZADANIE A (commit `a2a7851d`) — **postawił go orkiestrator, nie właściciel**; ECHO
   właściciela rundy 2 brzmi wyłącznie „W-B: domykaj tylko to, co daje plon". Wariant, którego cała
   definicja opiera się na progu wymyślonym przez nas, po ujawnieniu autorstwa progu przestaje być
   samodzielnym wyborem. §10a nakazuje takie warianty wyrzucić.

### Co Proponent 2 zrobił dobrze (nie do pominięcia)

- **Zweryfikował i poprawił orkiestratora:** surowe fakty podawały `main.ts ~:27086`; Proponent 2 podał
  `27192` — i to jest wartość prawdziwa (sprawdziłem w drzewie głównym). Dowód realnej weryfikacji,
  nie przepisania dispatchu.
- Trafnie i uczciwie ustawił **najniższą pewność w kategorii balansu AI** i nazwał ją „najsłabszym
  typowaniem z całego turnieju" — to jest dokładnie to, czego Warstwa 1 wymaga.
- Pytanie 2 ma dobrze rozdzielone A/B/C po **skutku dla gracza**, nie po sposobie wykonania.
- Prozą czyta się je lżej niż Proponenta 1 — mniej liczb na zdanie. Część tej lekkości przenoszę.

### Defekty Proponenta 1 (własne, wskazane z tą samą surowością)

1. **Ten sam błąd zakresu, w wersji łagodniejszej.** Napisał *„Zmiana obejmie więc też gracza, ale tylko
   na tym jednym ustawieniu"* — poprawnie zawęził zasięg po stronie gracza (trzy pozostałe profile mają
   własne listy, `auto-improvements.ts:68-95`), ale **też nie zauważył**, że przycięcie można zrobić
   wyłącznie przeciwnikom przez `priorityOverride`. Defekt wspólny obu projektom; **naprawiony dopiero
   w wersji finalnej**, na etapie sędziowania, nie w żadnym z dwóch projektów.
2. **Naciągnięty argument §3.2 przy wariancie warunkowym** — opisany w Warstwie 1. Punkt dla Proponenta 2.
3. **Gęstość.** Sytuacja pytania 1 ma więcej liczb na akapit, niż warunek 1 testu §10a znosi przy
   czytaniu na głos. W wersji finalnej przycięte.

### Co Proponent 1 wniósł, a czego w projekcie Proponenta 2 nie ma (wszystko sprawdzone u źródła)

- **Autorstwo progu 50 %** (`a2a7851d`) — zmienia to, o co właściciel jest w ogóle pytany.
- **Rozkład odzysku W-B / wyrąb** (+154 / +96) — poprawna atrybucja.
- **`warzelnia_soli` ma +1 żywności**, `lodzie_rybackie` **+2**, więc wymienione przez Final Control
  w blokadzie 1 `lodzie_rybackie` (79 szt.) **wypadają z listy kandydatów** — ich przycięcie obniżyłoby
  żywność. Po ich wykluczeniu udział rozkazów „bez jedzenia" to **145 z 600 (co czwarty)**,
  nie 200 z 600 (co trzeci).
- **Dzisiejszy dystans do bazy: około −10 %**, nie −16,8 % (3179 vs 3522 Operator; 3139 vs 3429 FC;
  3066 vs 3391 Evaluator). Żaden z projektów tej liczby nie podał, a to ona mówi właścicielowi,
  jak daleko naprawdę jest do stanu wyjściowego.
- **Zasięg po stronie gracza ograniczony do profilu „Zrównoważona"**.
- **Istniejący panel ustawień automatu** — realna, niska cena wariantu C w pytaniu 2.
- **Trzecia decyzja właściciela, zgłoszona przez Final Control i pominięta przez oba projekty** — niżej.

---

## ZGŁOSZENIE POZA TURNIEJEM (do orkiestratora, nie do właściciela w tej paczce)

Final Control rundy 3 w sekcji „CZEGO BRAKUJE" wskazał **trzy** rzeczy do decyzji właściciela.
Trzeciej nie objął ani turniej, ani żaden z dwóch projektów: `JEDEN_NA_ILU_OBYWATELI = 10` została
przez Operatora **rozciągnięta z ECHO o tartaku i obozie na `posterunek`/`fort`**, czego właściciel
nie powiedział. Skutek jest gameplayowy i zmierzony: **2 posterunki + 2 forty na ziarno przy 3 miastach,
czyli jedno miasto na ziarno nie dostaje w 40 turach żadnej obrony.** To materiał na osobne pytanie ABC.
Nie doklejam go do tej paczki, żeby nie mieszać dwóch pytań w trzy — ale **zgubienie tego byłoby
naruszeniem C-031**.

---

## ZMIANY WPROWADZONE W WERSJI FINALNEJ (względem obu projektów)

1. Ujawniony autor progu 50 % — właściciel nie decyduje pod presją liczby, której nie ustalał.
2. Poprawiona atrybucja odzysku (domykanie heksów +154, wycinka +96).
3. Poprawione dane o żywności: `warzelnia_soli` +1, `lodzie_rybackie` wykluczone, „co czwarty rozkaz",
   dystans do bazy ≈ −10 %.
4. **Zasięg zmiany podany jako wybór, nie jako ograniczenie** — naprawa błędu wspólnego obu projektom.
5. Wariant C pytania 1 przebudowany: z „przytnij jedną rzecz, żeby ledwie przekroczyć nasz próg"
   (pozorny) na **„przytnij to, co daje wyłącznie dochód, a drogi zostaw"** — drogi mają w grze inną
   rolę niż warzelnia soli (ruch wojsk, sieć handlowa), więc to jest różnica skutku, nie stopnia.
   Argument §3.2 („pełny nad częściowym") staje się przez to uczciwy.
6. Wariant warunkowy (jedzenie tylko dopóki miasto rośnie) **nie jest czwartą literą**, ale jest
   wymieniony jednym zdaniem z ceną — właściciel ma wiedzieć, że istnieje.
7. Wszystkie numery paragrafów i nazwy plików usunięte z treści pytań, **łącznie z Rekomendacjami**.
8. Pytanie 2: policzony kontrargument z reguły stałej właściciela; skorygowana cena wariantu C.

---

# WERSJA FINALNA — do przekazania właścicielowi

## PYTANIE 1 — `R-AI-WYRAB-PRZY-RZECE-FARMY-R4-Q1`

### Sytuacja

Dwie rundy temu powiedziałeś, że komputerowe cywilizacje mają brać teren **heks po heksie** i domykać
każdy z nich tym, co daje plon — zamiast rozgrzebywać kilkanaście naraz. Powiedziałeś też, że mają
budować **równomiernie**, a nie wyłącznie pod jedzenie. Obie rzeczy działają i są zmierzone: przeciwnik
trzyma dziś w robocie najwyżej pięć heksów zamiast trzydziestu jeden i wraca do zaczętego heksa
w niecałe trzy tury zamiast po dwudziestu trzech.

Ma to cenę. Przedtem komputerowe cywilizacje stawiały **wyłącznie** ulepszenia żywnościowe — sześćset
rozkazów na sześćset — i miały przez to najwyższą możliwą produkcję jedzenia. Ten stan sam odrzuciłeś
jako zwyrodniały. Dziś jedzenie u przeciwnika jest o mniej więcej **dziesięć procent** niższe niż wtedy.

**Dwie rzeczy mówię wprost, żebyś nie wybierał pod presją cudzej liczby.**

Po pierwsze: w trakcie prac przyjęliśmy sobie próg „jedzenie ma odbić więcej niż połowę tego, co
spadło", i on nie został osiągnięty (trzy niezależne pomiary: 42, 43 i 46 procent, a najostrożniejszy
model terenu 32). **Ten próg ustawiliśmy sami, na własne potrzeby — Ty go nigdy nie ustalałeś**, więc
nie jest żadnym zobowiązaniem. To liczba, którą możesz przyjąć albo zdjąć.

Po drugie: to, co odbiło, przyniosło w blisko dwóch trzecich samo domykanie heksów, a wycinka lasu
przy rzece w niewiele ponad jednej trzeciej. Wycinka nie jest głównym źródłem odzysku i nie należy
jej z niego rozliczać.

Reszty nie da się odzyskać bez ruszenia Twojego wymogu równomierności. Mniej więcej **co czwarty**
rozkaz budowy idzie u przeciwnika w rzeczy, które dają dochód, ale jedzenia nie dają wcale albo dają
śladowo: **warzelnie soli** (około siedemdziesięciu — jedna jednostka jedzenia przy trzech handlu),
**drogi zwykłe i brukowane** (około pięćdziesięciu — zero jedzenia) i **glinianki** (około trzydziestu —
zero jedzenia).

**Zasięg — to też jest częścią Twojego wyboru, nie ograniczeniem.** Pytam o komputerowych przeciwników,
bo wymóg równomiernej rozbudowy postawiłeś właśnie im, i zmianę da się zrobić **wyłącznie im**. Da się
też objąć nią automat budujący w miastach gracza, ale wtedy tylko na jego domyślnym ustawieniu
„zrównoważone"; trzy pozostałe ustawienia automatu mają własne kolejności i zostaną nietknięte tak czy
owak. Jeśli chcesz, żeby zmiana objęła również automat gracza, dopisz to przy literze.

### Cel pytania

Rozstrzygnąć, czy komputerowe cywilizacje mają dalej budować równomiernie kosztem niższej produkcji
jedzenia, czy przesunąć ich priorytety w stronę jedzenia — a jeśli tak, to czy kosztem wszystkiego,
co jedzenia nie daje, czy z zachowaniem dróg.

### Dlaczego teraz

Czwarta z pięciu dozwolonych rund tematu nie ruszy bez tej odpowiedzi. Strojenie liczb bez wiedzy,
czy w ogóle wolno ruszyć wymóg, który sam postawiłeś, byłoby zgadywaniem za Ciebie — a po tej rundzie
zostaje już tylko jedna.

### Warianty

**Wariant A — zostaje równomiernie; niższe jedzenie przyjmujemy jako cenę, a nasz własny próg zdejmujemy.**
Nic się nie zmienia w kolejności budowania przeciwnika. Uznajesz obecny stan za dobry i temat idzie
dalej bez tego kryterium.

- Za (1): Twój wymóg równomiernej rozbudowy zostaje nienaruszony — przeciwnik buduje drogi, warzelnie
  i kopalnie, a nie samą żywność, i jego gospodarka wygląda jak gospodarka, nie jak jedna kolumna.
- Za (2): „Strata" jedzenia liczy się względem stanu, który sam odrzuciłeś jako zwyrodniały — to nie
  jest cofnięcie się wobec czegoś dobrego, tylko cena wyjścia z czegoś złego, i ta cena jest już
  zapłacona.
- Przeciw (1): Komputerowe miasta rosną wolniej, niż mogłyby — w dłuższej rozgrywce przeciwnik będzie
  mniejszy i słabszy, czyli gra wyjdzie łatwiejsza, niż zakładasz.
- Przeciw (2): Zgodziłeś się płacić drewnem za wycinkę lasu przy rzece — drewna u przeciwnika ubyło
  o jedną czwartą, tartaków z siedemdziesięciu do dwudziestu, obozów łowieckich podobnie. Przy tym
  wariancie ta zapłata kupuje bardzo niewiele jedzenia netto.

**Wariant B — jedzenie ma trwałe pierwszeństwo: wszystko, co jedzenia nie daje, schodzi na koniec kolejki.**
Warzelnie soli, glinianki **i drogi** przeciwnik buduje dopiero wtedy, gdy nie ma już czego postawić
pod jedzenie. **To jest wprost cofnięcie części Twojego własnego wymogu równomierności z poprzedniej
rundy** — piszę to jawnie, żebyś widział to teraz, a nie odkrył za dwie rundy.

- Za (1): Produkcja jedzenia przeciwnika rośnie najmocniej z trzech wariantów, jego miasta rosną
  szybciej i przeciwnik staje się poważniejszym rywalem.
- Za (2): Kolejność budowania wraca do tego, co uzasadniało samą zgodę na wycinkę lasu — więcej
  jedzenia — zamiast rozchodzić się na cele, których wtedy nie kupowałeś.
- Przeciw (1): Gospodarka przeciwnika znowu robi się jednostronna — nie tak skrajnie jak przed
  poprzednią rundą, ale w tę samą stronę, którą wtedy odrzuciłeś.
- Przeciw (2): Drogi to nie tylko dochód. Mniej dróg u przeciwnika to wolniejsze przerzucanie jego
  wojsk i słabsza sieć handlowa — zmiana dotknie także tego, jak przeciwnik prowadzi wojnę i jak
  z Tobą handluje, nie tylko jak się bogaci.

**Wariant C — pierwszeństwo dla jedzenia, ale drogi zostają.**
Na koniec kolejki schodzą tylko te budowle, które dają wyłącznie dochód — warzelnie soli i glinianki.
Drogi przeciwnik buduje dalej normalnie, bo w grze robią coś więcej niż pieniądze.

- Za (1): Jedzenie rośnie, a przeciwnik nie traci ruchliwości wojsk ani sieci handlowej — dostajesz
  większość zysku z wariantu B bez jego jedynego skutku wykraczającego poza gospodarkę.
- Za (2): Mniejsze cofnięcie Twojego wymogu równomierności niż w wariancie B i łatwiejsze do
  pogłębienia później, jeśli po zagraniu uznasz, że jedzenia wciąż mało.
- Przeciw (1): Jedzenia przybędzie mniej niż w wariancie B — drogi to około pięćdziesięciu z tych
  stu czterdziestu pięciu rozkazów, więc zostawiasz na stole sporą część możliwego zysku.
- Przeciw (2): To nadal jest cofnięcie tego samego wymogu, tylko mniejsze — jeśli uważasz sam wymóg
  równomierności za nienaruszalny, ten wariant też go narusza, a przy tym nie domyka sprawy tak jak B.

**Jeszcze jedna możliwość, gdyby żadna z trzech nie pasowała** (nie jest jedną z liter, wymieniam ją,
żebyś wiedział, że istnieje): jedzenie na pierwszym miejscu **tylko dopóki miasto rośnie**, potem powrót
do budowania szerokiego. Daje jedno i drugie, ale jest najbardziej ruchome ze wszystkiego, co tu jest,
i realnie zajęłoby całą ostatnią rundę tego tematu.

### Rekomendacja

**Wg profilu: typowana B — z najniższą pewnością z obu pytań.**

Dlaczego B: gdy problem był już zdiagnozowany liczbami, nie przyjmowałeś dotąd „zostawmy jak jest"
za samodzielną odpowiedź — to działa przeciwko wariantowi A. A gdy wybór szedł między zakresem uciętym
a pełnym, wybierałeś pełny, nawet kosztem większej zmiany — to stawia B przed C.

Dlaczego mimo to pewność jest najniższa: to pytanie należy dokładnie do kategorii „balans i trudność
komputerowego przeciwnika", a to jedyny obszar, w którym typowanie po Twoich wcześniejszych decyzjach
**regularnie się nie sprawdza** — z sześciu takich pytań cztery rozstrzygnąłeś inaczej, niż
rekomendowano, i po zagraniu wracasz tu zwykle do własnej oceny. Traktuj to typowanie jako najsłabsze
z całego turnieju: informacja, nie sugestia.

---

## PYTANIE 2 — `R-AI-WYRAB-PRZY-RZECE-FARMY-R4-Q2`

### Sytuacja

Zgodziłeś się, żeby przy rzece wycinać las pod farmę, mimo że bilans jest ujemny: jedzenia przybywa
niewiele, a ubywa pracy, handlu i — najwyraźniej — drewna. Po wdrożeniu zmierzyliśmy to u komputerowych
przeciwników: drewna mają o jedną czwartą mniej, tartaków spadło z siedemdziesięciu do dwudziestu,
obozów łowieckich z siedemdziesięciu do dwudziestu trzech.

Ta zgoda została wdrożona **wyłącznie przeciwnikom**. Automat, który buduje ulepszenia w miastach
gracza, **nigdy nie wycina lasu** — na żadnym ze swoich czterech ustawień. To nie jest usterka: blokada
została kiedyś postawiona celowo, żeby automat nie ruszał lasu gracza. Nigdy natomiast nie padło,
czy Twoje „wycinać mimo to" miało objąć również ten automat, czy tylko przeciwników.

### Cel pytania

Rozstrzygnąć, czy automat budujący w miastach gracza ma wycinać las pod farmę przy rzece — tak jak
robią to dziś komputerowi przeciwnicy — czy ma zostać przy dzisiejszej ostrożności, czy ma to być
przełącznik po stronie gracza.

### Dlaczego teraz

Temat zamyka się najpóźniej w piątej rundzie. Jeśli automat gracza ma wycinać, trzeba zrobić na to
miejsce w zakresie prac **przed** startem następnej rundy, a nie w jej trakcie — obszar gry, którego
to dotyczy, był dotąd z tego tematu wyłączony. Bez odpowiedzi zostaje trwała różnica między tym, co
robi przeciwnik, a tym, co robi automat gracza — nigdzie nie zapisana jako czyjaś decyzja.

### Warianty

**Wariant A — automat gracza wycina tak samo jak przeciwnicy.**
Gracz, który zostawi budowanie ulepszeń automatowi, zobaczy, że automat zaczyna wycinać jego lasy przy
rzece i stawiać tam farmy — z tymi samymi skutkami, które zmierzono u przeciwników.

- Za (1): Gracz korzystający z automatu nie jest w gorszej pozycji niż komputerowi rywale, którzy tę
  taktykę już stosują — jedne zasady dla obu stron.
- Za (2): Decyzja „wycinać mimo to" obowiązuje wszędzie, gdzie ma zastosowanie, zamiast po cichu omijać
  jedną stronę rozgrywki bez wyjaśnienia.
- Przeciw (1): Automat zacznie ścinać lasy gracza bez pytania — także te, które gracz świadomie trzymał
  pod tartaki i obozy łowieckie; dla części graczy to utrata kontroli nad własnym terenem.
- Przeciw (2): Drewna graczowi ubędzie mniej więcej o jedną czwartą, tak jak przeciwnikom — a poczuje
  to mocniej, bo to jego własne budowle leśne stracą z czego pracować.

**Wariant B — zostaje jak jest: automat gracza nie wycina, wycinka pozostaje ruchem ręcznym.**
Gracz może wyciąć las sam, kiedy chce; automat nigdy nie zrobi tego za niego.

- Za (1): Las gracza nie znika bez jego ręki — w toczących się rozgrywkach nic się nie zmienia
  z zaskoczenia.
- Za (2): Zgodne z Twoją stałą zasadą, że automat wspierający gracza i komputerowy przeciwnik to dwie
  różne rzeczy i nie muszą zachowywać się tak samo — automat ma być ostrożny, przeciwnik ma grać.
- Przeciw (1): Automat gracza gra słabiej niż przeciwnicy — nie sięga po taktykę, którą sam im dałeś,
  więc gracz, który mu ufa, jest z definicji z tyłu.
- Przeciw (2): Ta różnica nie jest nigdzie widoczna dla gracza — nie dowie się, że jego automat celowo
  odpuszcza coś, co robi komputerowy sąsiad.

**Wariant C — przełącznik przy ustawieniach automatu: „wolno wycinać las".**
Gracz sam włącza albo wyłącza wycinkę w automacie — dla całego państwa albo dla wybranego miasta.

- Za (1): Gracz sam ocenia, czy ten kompromis — więcej jedzenia za wyraźnie mniej drewna — mu się
  opłaca, zamiast dostawać odpowiedź narzuconą.
- Za (2): Automat ma już własny panel ustawień, w którym gracz wybiera sposób budowania dla państwa
  i dla pojedynczego miasta oraz przełącza „tylko pola z obywatelami". To jedna pozycja więcej
  w miejscu, do którego gracz i tak zagląda — nie nowy ekran do wymyślania.
- Przeciw (1): Wartość domyślna tego przełącznika **i tak jest decyzją** — pytanie wraca w mniejszej
  skali, tylko przesunięte o krok.
- Przeciw (2): Część graczy nigdy tego panelu nie otworzy i dostanie zachowanie, którego świadomie nie
  wybrała — z ich punktu widzenia to ten sam problem co w wariancie A albo B.

### Rekomendacja

**Wg profilu: typowana A — pewność średnia, wyraźnie wyższa niż w pytaniu 1.**

Dlaczego A: to nie jest nowe pytanie o balans przeciwnika (czyli najsłabszy obszar typowania), tylko
pytanie, czy decyzja, którą już podjąłeś, obowiązuje wszędzie, gdzie ma zastosowanie. Pasują tu dwa
mocniejsze kierunki: odrzucałeś dotąd odkładanie rozstrzygnięcia i przerzucanie go dalej, gdy problem
był już zdiagnozowany — to stawia wariant C nisko; a między zakresem częściowym a pełnym wybierałeś
pełny — to stawia A przed B.

Przeciwko temu typowaniu stoi jednak Twoja **własna, stała zasada**: automat wspierający gracza to nie
to samo co komputerowy przeciwnik i nie musi robić tego samego. To jest realny argument za B i dlatego
nie stawiam tu pewności wysokiej — skutek dotyczy bezpośrednio tego, co gracz zobaczy we własnych
miastach, a nie tylko tego, jak gra komputer.

---

## Odnośnik techniczny do obu pytań (poza treścią, dla wykonawcy rundy 4)

- Odzysk: 42,2 % (Operator, `op3-pomiar-po.txt`), 42,8 % harness / 32,1 % model wierny terytorium
  (Evaluator, `ev3-pomiar-wierny.txt`), 46,0 % (Final Control, `fc3-kronika-trzy-stany.cjs`).
  Rozkład (`op3-warianty.txt`): samo W-B +154 (26,0 %), wyrąb +96. Dystans do bazy po W-B:
  3179/3522, 3139/3429, 3066/3391 ≈ −10 %.
- Kandydaci do przycięcia (`gra/data/terrain-improvements.json`): `warzelnia_soli` 69–81 szt.
  (`zywnosc 1`, `handel 3` — nie zero), `droga` + `droga_brukowana` 48–49 szt. (0), `glinianka`
  27–29 szt. (0). Razem 145/600. **`lodzie_rybackie` (65–79 szt.) NIE są kandydatem — mają
  `zywnosc: 2`**, mimo wzmianki w blokadzie 1 Final Control.
- Zasięg: `auto-improvements.ts:61` `ULEPSZENIA_FOCUS_ZROWNOWAZONE = AI_IMPROVEMENT_PRIORITY`, użyte
  w `prioritiesForUlepszeniaFocus` **wyłącznie dla `focus === 'zrownowazone'`**. AI CYWILIZACJI dostaje
  listę przez `priorityOverride` (`ai.ts:2002-2005`), który **wyprzedza** `basePriority`
  (`auto-improvements.ts:358`) — dlatego przycięcie wyłącznie przeciwnikom jest wykonalne
  (kosztem rozszerzenia allowlisty o `ai.ts`).
- Próg „większość z −16,8 %": `00-dispatch.md` §RUNDA 3 / ZADANIE A, commit `a2a7851d` — orkiestrator,
  nie właściciel.
- Pytanie 2: `main.ts:27192` `skipWyrab: true` (AI GRACZA, wszystkie 4 profile — filtr
  w `auto-improvements.ts:90-93` i `:411`), `ai.ts:1999` `skipWyrab: false` (AI CYWILIZACJI).
  Wariant A = allowlista rundy 4 + jedna linia `main.ts`. Wariant C = ta linia plus pole stanu
  i przełącznik w istniejącym panelu `gra/src/ui/buildModeHud.ts:103-618`.
- Uwaga wykonawcza niezależna od odpowiedzi: **`E1 max = 5 przy limicie 5` — zero zapasu**; każda
  zmiana zwiększająca liczbę heksów w toku przekroczy kryterium.
- Wzorce profilu użyte w typowaniu: §3.1, §3.2, §3.3 (`dyspozycje/PROFIL-DECYZYJNY-MACIEJ.md`).
