# SĘDZIA — werdykt turnieju C-018 i wersja finalna pytania ABC

**Temat:** `P-ULEPSZENIA-FARMY-JUZ-STOJACE-W-LESIE-Q1`
**Data:** 2026-08-27
**Rola:** Sędzia (rola Evaluatora w kontekście C-018)
**Kanon oceny:** `docs/decyzje/R-PROC-AUTOBOT-ABC-TURNIEJ.md`, `docs/decyzje/R-PROC-AUTOBOT.md` §5 i §10a,
`dyspozycje/PROFIL-DECYZYJNY-MACIEJ.md` §3
**Wejście:** projekt Proponenta 1 (orkiestrator, treść w dyspozycji sędziowskiej),
projekt Proponenta 2 (`dyspozycje/abc-turniej/2026-08-27-farma-migracja/PROPONENT-2-projekty.md`, SHA `7c13c155`)

---

## 1. Własna weryfikacja faktów źródłowych (przed oceną)

Nie przyjąłem streszczenia z dyspozycji na słowo. Każdy punkt sprawdzony w kodzie i danych na `main`
(`27be5705`).

| # | Fakt ze streszczenia | Werdykt | Dowód |
|---|---|---|---|
| F1 | Reguła „farma nie w lesie" jest zintegrowana do `main` | **POTWIERDZONY** | merge `1e34a667`, „Integracja R-ULEPSZENIA-FARMA-NIE-W-LESIE-Q1" |
| F2 | `isFarmBaseTerrain` odrzuca las | **POTWIERDZONY** | `gra/src/map/improvement-build.ts:220-223` — `if (nakladka === Nakladka.Las) return false; return FLAT_FARM.has(teren);` |
| F3 | Wzgórza przestały być terenem farmowym całkowicie | **POTWIERDZONY** | `FLAT_FARM = {Łąka, Równina}` (`:196`); poprzednia wersja (`2d30335e:...:198-202`) brzmiała: `if (FLAT_FARM.has(teren)) return true; return nakladka === Nakladka.Las && teren === TerenBazowy.Wzgorza;` — jedyna droga na Wzgórza wiodła przez las |
| F4 | Farma jest zablokowana także drugą, niezależną bramką | **POTWIERDZONY** | `FOREST_BLOCKED_IMPROVEMENT_KEYS` zawiera `'farma'` (`:247-256`); trzecia bramka w podpowiedzi UI (`gra/src/ui/hexContextTooltip.ts:451-461`) |
| F5 | Precedens obozu łowieckiego = wariant A, znika przy wyrębie, praca nie wraca | **POTWIERDZONY** | `FOREST_DEPENDENT_IMPROVEMENT_KEYS = {'oboz_lowiecki'}` (`:184-186`) + `stripImprovementsWhenForestRemoved` (`:192-194`) |
| F6 | Tartak zostaje w lesie świadomie (kanon) | **POTWIERDZONY** | komentarz `:176-177` + asercja kanonu „tartak stays when forest removed" w `gra/tools/map-improvement-qualify-test.cjs` |
| F7 | Pomiar 754 heksy z lasem na 5 mapach | **POTWIERDZONY CO DO LICZBY, BŁĘDNIE INTERPRETOWALNY** | `dyspozycje/autobot/runs/R-ULEPSZENIA-OBOZ-LOWIECKI-TYLKO-LAS-Q1/02-evaluator-runda2.md:65,83-84` — to liczba **heksów z lasem**, a nie liczba farm stojących na lesie. Ta druga nie została nigdy zmierzona i **statycznie zmierzyć się nie da** (zależy od konkretnej partii/zapisu) |
| F8 | Farmy stojące dziś na lesie są legalne wg reguły z 2026-07-21 | **POTWIERDZONY** | jw. F3, poprzednia treść funkcji + komentarz „Maciej 2026-07-21: farma bez wycinki lasu" |
| F9 | Profil §3.1 (5/5), §3.2 (co najmniej 4x), §3.3 (2/6 po korekcie), §3.4, §3.5 | **POTWIERDZONY** | `dyspozycje/PROFIL-DECYZYJNY-MACIEJ.md:396-460`; §3.3 po korekcie Evaluatora brzmi „4 z 6 to niezgodność" → zgodność 2/6 |

### 1a. Ustalenia własne, których NIE było w dyspozycji, a które ZMIENIAJĄ treść pytania

Wypisane osobno, zgodnie z poleceniem.

**U1 — farma stojąca w lesie działa dziś w pełni i daje plony ZSUMOWANE z plonami lasu.**
`tileYield()` (`gra/src/game/economy.ts:411-465`) dolicza modyfikator lasu, a potem bezwarunkowo
`applyImprovementBonuses(out, impKeys)` — **nie ma żadnej bramki terenowej po stronie plonów**.
Liczby: las = **−1 żywność, +3 praca, +2 podatek, +15 drewno** (`gra/data/terrain-yields.json:105-113`);
farma = **+3 żywność, +3 praca, +3 podatek** (`gra/data/terrain-improvements.json` → `farma.bonus`).
Skutek: pole „farma na lesie" jest **mocniejsze niż zwykła farma na czystej ziemi** (traci 1 żywność,
zyskuje 3 pracy, 2 podatku i 15 drewna na turę) i **nikt nie może go już odtworzyć**. To przenosi temat
z kategorii „porządek na mapie" do kategorii **gospodarka/balans** — czego nie zauważył żaden Proponent.

**U2 — każda stojąca farma na Wzgórzach jest z definicji farmą leśną, więc „automatyczny wyrąb"
tworzy dla niej stan, który nowa reguła właśnie zniosła.**
Z F3: przed zmianą Wzgórza kwalifikowały się **wyłącznie** z nakładką Las. Zatem po usunięciu lasu spod
takiej farmy zostaje **farma na gołych Wzgórzach** — konfiguracja dziś niemożliwa do zbudowania na
żadnej ścieżce. Wariant „las znika spod farm" **nie jest jednorodny**: na Łące/Równinie ratuje farmę,
na Wzgórzach musi ją i tak skasować. **Ani Proponent 1 (którego wariant C to dokładnie ten mechanizm),
ani Proponent 2 (który tego wariantu w ogóle nie ma) tego nie zauważyli.** To najpoważniejsza luka
merytoryczna turnieju.

**U3 — farma PRZEŻYWA wyrąb wykonany przez gracza (inaczej niż obóz łowiecki).**
`farma` świadomie NIE należy do `FOREST_DEPENDENT_IMPROVEMENT_KEYS` (`:178-180` w wersji sprzed zmiany,
`:180-186` po zmianie). Skutek: **na Łące/Równinie gracz ma już dziś własną, dobrowolną ścieżkę
uzdrowienia pola** — wycina las i zostaje mu normalna, w pełni legalna farma. Na Wzgórzach ta sama
ścieżka produkuje stan z U2, czyli **istniejący przeciek**. To realne „Za" dla wariantu „zostawić" i
realne „Przeciw" dla wariantu „zostawić" jednocześnie — i nie ma tego w żadnym z projektów.

**U4 — stan zastany = wariant „zostają". Nie ma dziś żadnej migracji.**
Nic w kodzie nie rusza stojących farm; zapisy są wersjonowane (`SAVE_VERSION = 2`,
`gra/src/game/save.ts:104`), starsze wersje **są wczytywane** (`:461`), a żadna ścieżka migracji farm nie
istnieje. Czyli odpowiedź „zostają bezterminowo" **obowiązuje dziś faktycznie, tylko nikt jej nie wybrał**.
To ma bezpośrednie znaczenie dla typowania wg profilu §3.1 (odrzucanie stanu zastanego) i **nie zostało
nazwane przez żadnego Proponenta**.

**U5 — zbiór dotkniętych farm jest ZAMKNIĘTY i może się już tylko kurczyć.**
Automat ulepszeń (`gra/src/game/auto-improvements.ts:13,348,433`) i AI (`gra/src/game/ai.ts:1929`,
`:342`) używają **tej samej** funkcji `buildImprovementQualifier`, co panel gracza — nowa farma w lesie nie
powstanie żadną ścieżką. Generator map farm nie stawia. To osłabia argument „problem sam się rozleje" i
wzmacnia „to jest domykanie skończonego zbioru", czyli zmienia wagę „Dlaczego teraz".

**U6 — „automatyczny wyrąb" nie jest neutralny gospodarczo i nie jest darmowy.**
Wyrąb kosztuje normalnie 2,5 Pracy i daje jednorazowo +25 Drewna (`gra/data/terrain-improvements.json`
→ `wyrab.warunek`). Migracja wykonana za gracza albo daje mu ten zysk za darmo, albo mu go odbiera —
i w każdym przypadku **kasuje stały strumień +15 Drewna/turę** z pola. Wariant „las znika" jest więc
odczuwalnym ubytkiem gospodarczym, a nie „ratunkiem bez kosztu", jak sugeruje redakcja Proponenta 1.

---

## 2. WARSTWA 1 (dominująca) — rozpoznanie kategorii tematu i jakość uzasadnienia „typu"

Warstwa 1 nie ocenia, czy Proponent zgadł literę właściciela — ocenia, **czy poprawnie rozpoznał
kategorię tematu i czy sięgnął po wzorzec profilu, który do tej kategorii naprawdę pasuje**.

### Jaka to jest kategoria — ustalenie Sędziego

To **nie** jest „czysta naprawa UI/UX z jednoznaczną diagnozą" (§3.4). Nie ma tu usterki interfejsu,
nie ma jednoznacznej diagnozy i nie ma jednego oczywistego naprawienia. Jest odwrotnie: reguła została
już naprawiona, a przedmiotem decyzji jest **kto ponosi koszt tej naprawy w gospodarce trwających partii**.
Po ustaleniu U1 (pole „farma na lesie" jest trwale mocniejsze od czegokolwiek, co dziś da się zbudować)
temat trafia wprost do kategorii **„zakres gry / balans / ekonomia"** — tej z tabeli §10 R-PROC-AUTOBOT
(„Właściciel — pełne pytanie ABC") i tej z §3.3 profilu, gdzie zgodność rekomendacji z wyborem jest
**najniższa w całym zbiorze (2 z 6)**. Konsekwencja jest jednoznaczna: **każde typowanie w tym temacie
musi mieć jawnie NISKĄ pewność**, niezależnie od tego, którą literę się typuje.

### Proponent 1 — ocena Warstwy 1: **SŁABA**

- **Błąd kategorii, i to błąd rdzeniowy.** P1 typuje B (farmy zostają) „uzasadnieniem §3.4". §3.4 to
  obserwacja **o zgodności formalnej przy wąskich bugfixach UI**, a nie zasada projektowa „naprawa nie
  powinna zabierać graczowi tego, co zbudował". P1 **wyprodukował z profilu normę, której w profilu nie ma**,
  i podpiął ją pod paragraf o zupełnie innej treści. To dokładnie to nadużycie, przed którym kanon
  turnieju ostrzega: profil może informować „typ", nigdy nie zastępuje rozumowania.
- **Nie rozpoznał, że B jest stanem zastanym** (U4). Gdyby to zauważył, musiałby zderzyć swoje typowanie
  z §3.1 (5/5 przeciw „zostawmy jak jest"), a §3.1 jest najmocniejszym udokumentowanym wzorcem w profilu.
  Zamiast tego P1 przywołał §3.2 tylko jako miękki kontrargument („typ ma niższą pewność").
- **Na plus:** P1 jako jedyny zauważył, że jego typ stoi w napięciu z §3.2, i powiedział to wprost.
  To uczciwe, ale nie ratuje błędnie wybranego paragrafu nośnego.

### Proponent 2 — ocena Warstwy 1: **DOSTATECZNA, z jedną poważną skazą**

- **Trafniejszy dobór wzorców niż u P1.** §3.1 + §3.2 to paragrafy o realnie pasującej treści:
  „decyzja teraz zamiast stanu przejściowego" i „pełny zakres zamiast ucinanego". §3.2 jest tu
  najmocniejszym dostępnym zaczepieniem — „reguła obowiązuje wszędzie" to zakres pełny, „reguła
  obowiązuje tylko dla nowych" to zakres ucinany.
- **Wzorowa sekcja pewności typowania.** P2 sam podaje wielkości prób (n=5, n=4), sam odróżnia
  ekstrapolację od powtórzenia analogicznej sytuacji, sam wskazuje, że precedens obozu ciągnie w inną
  stronę niż jego własny typ, i wprost obniża pewność. To najlepszy fragment całego turnieju i wzorzec
  do naśladowania.
- **Skaza:** P2 **nie rozpoznał kategorii §3.3**. Nazwał pewność „ŚREDNIA", opierając obniżkę wyłącznie
  na małych próbach §3.1/§3.2. Po U1 właściwa odpowiedź brzmi **NISKA, bo to kategoria balansowa** — i to
  jest argument mocniejszy oraz udokumentowany liczbowo (2/6), a nie tylko „mała próba".
- **Druga skaza:** §3.1 zastosowany do własnego zestawu wariantów działa tylko dlatego, że P2 wstawił do
  zestawu wariant „stopniowy" (jego C). Ten wariant jest pozorny (patrz §4) — po jego usunięciu podpora
  §3.1 u P2 traci połowę oparcia i zostaje przy §3.1 wyłącznie w wersji „A = stan zastany".

**Wynik Warstwy 1: przewaga Proponenta 2, wyraźna.** P1 popełnił błąd kategorii u samego korzenia
typowania; P2 wybrał paragrafy o pasującej treści i jako jedyny formalnie oszacował pewność.

---

## 3. WARSTWA 2 (rozstrzygająca przy remisie) — fakty, kompletność, realność wariantów, jakość Sytuacji

Warstwa 1 już rozstrzygnęła, ale ponieważ mam syntetyzować, oceniam warstwę 2 z tą samą surowością.

| Kryterium | Proponent 1 | Proponent 2 |
|---|---|---|
| **Oś wariantów** | **Prawidłowa i kompletna**: usuń farmę / usuń las / nie usuwaj nic. To trzy różne stany planszy. | **Niekompletna**: brak wariantu „usuń las spod farmy" — jedynego, który jednocześnie domyka regułę i nie zabiera graczowi pracy. Zamiast niego wariant pozorny (§4). |
| **Wierność faktom** | Dobra co do reguły; **pomija U1, U2, U3, U4, U6**. Wariant C opisany jako „farma zostaje i działa, teren uzgadnia się z regułą" — dla Wzgórz to **nieprawda** (U2). | Dobra; **jedyny, który uczciwie zastrzegł, że 754 to pola z lasem, a nie farmy** (F7). Pomija U1, U2, U3, U4, U6. Jedno „Za" wariantu C jest **fałszywe faktycznie** (§4). |
| **Kompletność Za/Przeciw** | 2+2 w każdym wariancie — spełnione. | 2+2 w każdym wariancie — spełnione. |
| **Jakość Sytuacji** | Zwięzła, ale **nie mówi, że te farmy dziś pracują i ile dają** — bez tego właściciel nie widzi stawki gospodarczej. | **Lepsza**: mówi wprost „już stoją i normalnie pracują", mówi o zapisach gry, mówi że reguła dotyczy budowania nowych. Nadal nie podaje stawki liczbowej (U1). |
| **Dlaczego teraz** | Nie sprawdzone niezależnie (dyspozycja podaje tylko rekomendację P1) — w części dostępnej brak nazwania stanu zastanego. | **Mocne**: utrwalanie stanu przez kolejne zapisy, konieczność ustalenia przed testowaniem reguły. Drobna nieścisłość: „kilkaset pól **na każdej** z map" — 754 na 5 map to ok. 150/mapa. |
| **Higiena §10a w treści** | Treść wariantów zawiera słowo „**migracja**" (wariant C: „automatyczny wyrąb przy migracji") — **to żargon wewnętrzny w treści pytania**, warunek 2 naruszony. | **Czysta** — żadnej ścieżki, funkcji, paragrafu ani identyfikatora w treści; wszystko w sekcji odnośników. Wzorowe. |

**Wynik Warstwy 2: podzielony.** P1 wygrywa **osią wariantów** (jedyny ma pełny, prawdziwy zestaw
skutków). P2 wygrywa **dyscypliną faktów, jakością Sytuacji i higieną §10a**.

---

## 4. Warianty pozorne i usterki formy — obaj, tą samą miarą

### Proponent 2 — wariant C jest POZORNY (złamanie warunku 3 §10a)

P2 opisuje C jako „farmy zostają czynne, dopóki gracz sam nie zmieni tego pola — dopiero wtedy nie da
się ich odtworzyć". Rozbiór:

- **Nic w tym wariancie farmy nie usuwa.** Farma stoi i pracuje tak samo jak w wariancie A.
- Klauzula „dopiero wtedy nie da się jej odtworzyć" **jest już prawdą w KAŻDYM wariancie** — nowej farmy
  w lesie nie da się postawić od 2026-08-27 niezależnie od tej decyzji (F2, F4, U5). Nie jest więc
  skutkiem tego wariantu, tylko skutkiem decyzji już podjętej.
- Skutek dla planszy i dla gracza w A i C jest **identyczny**. To ta sama decyzja projektowa opowiedziana
  dwa razy, różniąca się wyłącznie narracją o przyszłości — **podręcznikowy wariant pozorny**.
- Dodatkowo **„Za 1" wariantu C jest fałszywe**: powołuje się na „inne budowle leśne objęte tą samą zmianą
  zasad tego samego dnia", sugerując analogię z obozem łowieckim. Obóz to **osobny temat**
  (`R-ULEPSZENIA-OBOZ-LOWIECKI-TYLKO-LAS-Q1`), a farma — inaczej niż obóz — **przeżywa wyrąb** (U3).
  Analogia nie zachodzi ani formalnie, ani mechanicznie.

Skutek: realny zestaw P2 to **dwie** litery (zostaw / usuń), nie trzy.

### Proponent 1 — usterki

- **Wariant C opisany nieprawdziwie dla części mapy** (U2): „farma zostaje i działa, teren uzgadnia się
  z regułą" nie zachodzi na Wzgórzach, gdzie po zniknięciu lasu farma nie ma prawa istnieć. Wariant
  wymaga jawnego przypadku szczególnego albo jest wprowadzaniem właściciela w błąd.
- **Żargon w treści** („migracja") — naruszenie warunku 2 §10a.
- **Wariant B opisany jako trwały** („na stałe zostaje stan, którego nie da się odtworzyć od zera") —
  po U3 to **nieścisłe**: na Łące/Równinie gracz może to pole sam znormalizować, wycinając las; farma
  przeżyje. „Na stałe" zachodzi tylko na Wzgórzach.
- **Brak stawki gospodarczej** (U1) — bez niej „Przeciw" wariantu B („stan nie do odtworzenia") brzmi
  estetycznie, a nie ekonomicznie, i właściciel nie widzi, że chodzi o trwałą przewagę liczbową.
- **Uzasadnienie typu przez §3.4** — omówione w Warstwie 1, najcięższa usterka P1.

### Usterki wspólne obu projektom

- Żaden nie rozpoznał kategorii balansowej i §3.3 (U1) — a to jest **główny modyfikator pewności typu**.
- Żaden nie zauważył, że opcja „zostają" to **stan zastany, nie zmiana** (U4) — co jest kluczowe dla §3.1.
- Żaden nie zauważył przypadku Wzgórz (U2) — najostrzejszej pułapki merytorycznej w temacie.
- Żaden nie policzył kosztu wariantu „las znika" (U6).

---

## 5. Werdykt

**SYNTEZA — z jawną przewagą Proponenta 2 w Warstwie 1.**

Uzasadnienie wyboru trybu: żaden projekt nie nadaje się do wysłania w całości.
P1 ma **jedyną prawidłową oś wariantów**, ale opiera typ na źle dobranym paragrafie profilu i opisuje
jeden ze swoich wariantów niezgodnie z kodem. P2 ma **lepszą dyscyplinę faktów, lepszą Sytuację, czystą
formę i uczciwą ocenę pewności**, ale jego zestaw wariantów jest realnie dwuliterowy i zawiera jedno
fałszywe „Za". Kanon C-018 dopuszcza syntezę i nazywa ją „często najlepszym wyjściem" — to jest taki
przypadek.

**Wersja finalna bierze:**
- oś trzech realnie różnych skutków — **od P1**,
- jawną sekcję pewności typowania, uczciwe traktowanie liczby 754 i czystość językową — **od P2**,
- stawkę gospodarczą (U1), przypadek Wzgórz (U2), ścieżkę własną gracza (U3), rozpoznanie stanu
  zastanego (U4), zamkniętość zbioru (U5) i koszt wyrębu (U6) — **od Sędziego**,
- literę typowaną i jej uzasadnienie — **od Sędziego**, po korekcie kategorii na §3.3.

**Typ finalny: B** (las znika spod stojących farm, farma zostaje), **pewność NISKA**.
Nie jest to litera żadnego z Proponentów (P1 typował „zostawić", P2 „usunąć farmy"). Powód: po U1
i U4 opcja „zostawić" jest stanem zastanym z trwałą przewagą liczbową — najsłabiej broniąca się wobec
§3.1 i §3.2; a między dwiema pozostałymi §3.2 („pełny/systematyczny zakres, nawet kosztem większej
pracy") wskazuje tę, która domyka regułę **i** zachowuje pracę gracza, czyli droższą we wdrożeniu, nie
tańszą. Pewność NISKA, bo §3.3: to kategoria balansowa, w której zgodność rekomendacji z wyborem
właściciela wynosi 2/6 — najniżej w całym profilu.

---

## 6. Test §10a na wersji finalnej — przebieg

**Warunek 1 — czytelność dla kogoś spoza projektu.**
Przeczytałem treść zdanie po zdaniu, sprawdzając słownictwo. Występują wyłącznie pojęcia świata gry:
pole, las, farma, tartak, obozowisko myśliwskie, drewno, żywność, zapis gry, tura, pagórek. Żadne z nich
nie wymaga znajomości repozytorium. Pytanie kończy się prośbą o jedną literę, więc odpowiedź jest
możliwa bez dopytywania. **PRZECHODZI.**

**Warunek 2 — brak identyfikatorów wewnętrznych w treści.**
Sprawdzone jawnie: brak numerów paragrafów, brak ścieżek plików, brak nazw funkcji
(`isFarmBaseTerrain` itp.), brak nazw narzędzi, brak identyfikatorów tematów (`R-...`, `P-...`).
Pełne ID tematu stoi w **nagłówku metryki i w odnośniku**, nie w zdaniach pytania — właściciel go
potrzebuje, by odpowiedzieć „ID + litera" (§5), więc nie może zniknąć, ale nie należy do treści.
Usunięte świadomie względem projektów wejściowych: słowo „migracja" (P1). Liczba 754 została
w „Dlaczego teraz" jako **fakt o świecie gry** z jawnym zastrzeżeniem, co mierzy — to nie identyfikator.
**PRZECHODZI.**

**Sprawdzian kontrolny kanonu („usuń wszystkie nazwy własne plików, funkcji i narzędzi — czy zdanie
nadal coś znaczy?").** W treści nie ma czego usuwać; po usunięciu nagłówka metryki i sekcji odnośników
pytanie pozostaje w całości zrozumiałe i kompletne. **PRZECHODZI.**

**Warunek 3 — warianty różnią się skutkiem dla gry i dla gracza.**
Po decyzji plansza wygląda inaczej w każdym z trzech przypadków:
- A → pole ma **las i farmę** (stan dzisiejszy),
- B → pole ma **farmę bez lasu** (a na pagórkach: samo pole, bo tam farma nie może zostać),
- C → pole ma **sam las** (stan sprzed budowy farmy).
Trzy różne obrazy pola, trzy różne bilanse gracza (nic nie traci / traci drewno i pracę z lasu / traci
budowlę i żywność). Żadna para nie jest tą samą decyzją opowiedzianą dwa razy — usunięty został właśnie
wariant pozorny P2. **PRZECHODZI.**

**Wynik: 3/3 — pytanie gotowe do wysłania.**

---

## 7. WERSJA FINALNA PYTANIA (do pokazania właścicielowi dosłownie)

> **Pytanie ABC — `P-ULEPSZENIA-FARMY-JUZ-STOJACE-W-LESIE-Q1`** (odpowiedz: pełne ID + litera)

### Sytuacja

Do wczoraj wolno było postawić farmę na polu porośniętym lasem. Wczoraj to się zmieniło: las i uprawa
się wykluczają, więc nowej farmy w lesie nie postawi już ani gracz, ani przeciwnik komputerowy —
w lesie zostają tartak i obozowisko myśliwskie.

Ale farmy postawione **wcześniej** dalej stoją na polach z lasem — w partiach, które się teraz toczą,
i w zapisanych grach — i dalej normalnie pracują. Co więcej, takie pole daje **i plony farmy, i pełny
dochód z lasu naraz**: w sumie o jedną żywność mniej niż zwykła farma, ale za to trzy pracy, dwa podatku
i piętnaście drewna na turę więcej. Jest więc **mocniejsze niż cokolwiek, co da się dziś zbudować**, i nikt
nie może go już odtworzyć od zera.

Osobny przypadek to farmy na **pagórkach**. Wcześniej pagórek nadawał się pod uprawę wyłącznie wtedy, gdy
rósł na nim las — dziś nie nadaje się w ogóle. Każda stojąca farma na pagórku jest więc farmą leśną
i **nie ma pod sobą terenu, na którym mogłaby zostać po zniknięciu lasu**.

Nowa zasada mówi, czego nie wolno zbudować. Nie mówi nic o tym, co już stoi.

### Cel pytania

Rozstrzygnąć, co dzieje się z farmami, które **już stoją** w lesie — w partiach toczących się teraz
i przy wczytaniu wcześniejszego zapisu gry.

### Dlaczego teraz

Bo odpowiedź już obowiązuje, tylko nikt jej nie wybrał. Dziś nic tych farm nie rusza, czyli faktycznie
działa wariant „zostają na zawsze" — jako stan zastany, nie jako decyzja. Każdy kolejny zapis gry ten stan
utrwala, a każda tura trwającej partii przelicza z niego gospodarkę.

Zbiór takich farm jest już **zamknięty i może się tylko kurczyć** — nowej farmy w lesie nie postawi żadna
ścieżka. Im później decyzja, tym dłużej na mapach żyje pole silniejsze od wszystkiego, co da się zbudować,
i tym bardziej odczuwalne będzie każde jego ruszenie później.

Ile dokładnie takich farm stoi — nie wiadomo i nie da się tego policzyć z góry, bo to zależy od konkretnej
partii. Dla skali: na pięciu mapach odniesienia naliczono 754 pola z lasem; ile z nich niesie farmę,
nikt nie mierzył.

### A. Zostaje wszystko tak, jak jest — farma i las razem, bezterminowo

**Za:**
1. Gracz nie traci niczego, czego sam nie oddał. Zmiana zasady, o której nawet nie wie, nie zabiera mu ani
   budowli, ani pola, ani żywności w połowie partii.
2. Na łące i równinie gracz i tak ma własne wyjście: może sam wyciąć las pod farmą — farma to przeżywa
   i zostaje mu zwyczajna, w pełni legalna farma. Decyzję o uporządkowaniu pola podejmuje on, nie gra za niego.

**Przeciw:**
1. Na mapie na stałe zostaje pole, którego zasada zabrania, a które mimo to działa — i to działa **lepiej
   niż cokolwiek dziś budowalne**. Kto zdążył postawić farmy w lesie przed zmianą, ma trwałą przewagę
   gospodarczą nad każdym, kto zaczyna partię później. Nic w grze tej przewagi nie tłumaczy.
2. Na pagórkach wyjątek jest podwójny i nieusuwalny: stoi tam uprawa na terenie, który dziś w ogóle nie
   jest rolny, i zostanie tam do końca partii — bo gracz nie ma jak tego naprawić, nie tracąc farmy.

### B. Las znika spod stojących farm — farma zostaje i pracuje, pole przestaje być leśne

**Za:**
1. Gracz zachowuje to, co zbudował, i pole dalej karmi miasto. Sprzeczność znika bez odbierania graczowi
   pracy, której nie miał jak przewidzieć.
2. Mapa zgadza się z zasadą od razu i wszędzie, a to, co zostaje, gracz mógłby zbudować od nowa — koniec
   z polami nie do odtworzenia i koniec z przewagą „kto zdążył przed zmianą".

**Przeciw:**
1. Gracz traci las, o który nie był pytany — a las na tym polu daje więcej niż sama farma: piętnaście
   drewna, trzy pracy i dwa podatku na turę. To cichy ubytek, którego nie zauważy od razu, tylko po
   spadku drewna w państwie kilka tur później.
2. Na pagórkach ta odpowiedź **nie zadziała tak samo**: bez lasu pagórek nie jest terenem rolnym, więc
   tamtejsza farma i tak musi zniknąć. Dla części pól ta odpowiedź daje dokładnie ten sam skutek co
   odpowiedź C — jedna decyzja, dwa różne zachowania w zależności od terenu.

### C. Farmy znikają w chwili wejścia zasady — na polu zostaje sam las

**Za:**
1. Zasada obowiązuje naprawdę, bez wyjątków i bez pól nie do powtórzenia. Wszyscy — gracz, przeciwnicy,
   nowa partia i stary zapis — grają na tych samych warunkach.
2. To ten sam sposób rozstrzygania, który przyjęto dzień wcześniej dla obozowiska myśliwskiego: budowla,
   która straciła podstawę istnienia, znika, a włożona w nią praca nie wraca.

**Przeciw:**
1. Gracz traci działającą budowlę i jej żywność z tury na turę **bez żadnego własnego działania**.
   Obozowisko znikało dlatego, że gracz sam wyciął las pod nim — tu nie zrobił nic, a mimo to płaci.
2. W trwającej partii to nagły cios w wyżywienie miast, w momencie, którego gracz nie wybrał i nie mógł
   przewidzieć — miasto może przez to przestać rosnąć albo zacząć głodować, a gracz nie zobaczy przyczyny.

### Rekomendacja

**B** — las znika spod stojących farm; farma zostaje i pracuje, a tam, gdzie teren bez lasu nie jest rolny
(pagórki), farma znika.

**wg profilu: typowana B, bo wzorzec „między zakresem ucinanym a pełnym/systematycznym wybiera pełny,
nawet kosztem większej pracy" — B jako jedyna domyka zasadę wszędzie i jednocześnie nie zabiera graczowi
tego, co zbudował, kosztem większej roboty niż zwykłe skasowanie; dochodzi wzorzec „nie odkłada decyzji
i nie zostawia stanu zastanego", a odpowiedź A jest dokładnie stanem zastanym, obowiązującym dziś bez
niczyjego wyboru.**

**Pewność typowania: NISKA.** To decyzja gospodarczo-balansowa, a w tej właśnie kategorii profil notuje
najniższą w całym zbiorze zgodność między rekomendacją a wyborem właściciela — 2 trafienia na 6 par.
Osobno w stronę C ciągnie precedens obozowiska myśliwskiego z dnia poprzedniego (budowla bez podstawy
znika, praca nie wraca), a w stronę A — to, że tam zniknięcie było skutkiem czynu gracza, a tu byłoby
skutkiem zmiany reguły, o którą gracza nie pytano. Typ jest informacją, nie decyzją — wszystkie trzy
litery stoją otworem.

---

## 8. Odnośnik techniczny (pod pytaniem — NIE część treści)

- **Temat:** `P-ULEPSZENIA-FARMY-JUZ-STOJACE-W-LESIE-Q1`, zarejestrowany w
  `dyspozycje/REJESTR-PROSB-I-ZADAN.md:3218` jako OTWARTE.
- **Reguła źródłowa:** ECHO właściciela 2026-08-27 — „w lesie nie powinno być możliwości budowania farm
  zarówno na wzgórzach, jak i na innych terenach, bo to się wyklucza. W lesie można wybudować tylko tartak
  i ewentualnie obozowisko, i tego się trzymajmy". Temat `R-ULEPSZENIA-FARMA-NIE-W-LESIE-Q1`,
  zintegrowany do `main` merge'em `1e34a667`.
- **Stan w kodzie:** `gra/src/map/improvement-build.ts` — `isFarmBaseTerrain` (`:220-223`),
  `FLAT_FARM` (`:196`), `FOREST_BLOCKED_IMPROVEMENT_KEYS` (`:247-256`),
  `FOREST_DEPENDENT_IMPROVEMENT_KEYS` (`:184-186`), `stripImprovementsWhenForestRemoved` (`:192-194`);
  trzecia bramka w `gra/src/ui/hexContextTooltip.ts:451-461`.
- **Poprzednia reguła (uchylona):** `2d30335e:gra/src/map/improvement-build.ts:198-202` —
  „Łąka/Równina zawsze; Wzgórza gdy nakładka Las". Stąd U2: każda stojąca farma na Wzgórzach jest farmą leśną.
- **Plony (stawka gospodarcza z Sytuacji):** `gra/src/game/economy.ts:411-465` (`tileYield` —
  brak bramki terenowej po stronie plonów), `gra/data/terrain-yields.json:105-113` (Las: −1 żywność,
  +3 praca, +2 podatek, +15 drewno), `gra/data/terrain-improvements.json` → `farma.bonus`
  (+3/+3/+3), → `wyrab.warunek` (koszt 2,5 Pracy, jednorazowo +25 Drewna).
- **Zamkniętość zbioru:** `gra/src/game/auto-improvements.ts:13,348,433` i `gra/src/game/ai.ts:342,1929`
  używają tej samej `buildImprovementQualifier` co panel gracza.
- **Zapisy gry:** `gra/src/game/save.ts:104` (`SAVE_VERSION = 2`), `:461` (starsze wersje wczytywane,
  „callers may migrate") — dziś brak jakiejkolwiek migracji farm.
- **Precedens:** `R-ULEPSZENIA-OBOZ-LOWIECKI-TYLKO-LAS-Q1`, wariant A (2026-08-27) — obóz znika przy
  wyrębie, praca nie wraca. Farma, inaczej niż obóz, **przeżywa** wyrąb (nie należy do
  `FOREST_DEPENDENT_IMPROVEMENT_KEYS`).
- **Pomiar 754:** `dyspozycje/autobot/runs/R-ULEPSZENIA-OBOZ-LOWIECKI-TYLKO-LAS-Q1/02-evaluator-runda2.md:65,83-84`
  — 5 map, 754 heksy **z lasem**; liczba farm na lesie nie była mierzona.
- **Profil decyzyjny:** `dyspozycje/PROFIL-DECYZYJNY-MACIEJ.md` (STATUS: DRAFT) — §3.1 (n=5),
  §3.2 (co najmniej 4x), §3.3 (zgodność 2/6 po korekcie Evaluatora), §3.4, §3.5.
- **Projekty wejściowe turnieju:** Proponent 1 — treść w dyspozycji sędziowskiej; Proponent 2 —
  `dyspozycje/abc-turniej/2026-08-27-farma-migracja/PROPONENT-2-projekty.md` (SHA `7c13c155`).

---

## 9. Kontrakt raportu

```text
STATUS: PASS
DOMAIN: PROCESS
TEMAT: P-ULEPSZENIA-FARMY-JUZ-STOJACE-W-LESIE-Q1 (turniej ABC C-018, rola Sędziego)
GOAL: Ocenić dwa niezależne projekty ABC, wskazać zwycięzcę albo zsyntetyzować wersję finalną,
      przepuścić ją przez test §10a i wydać treść gotową do pokazania właścicielowi.
ZMIANY/COMMIT: dyspozycje/abc-turniej/2026-08-27-farma-migracja/SEDZIA-werdykt-i-wersja-finalna.md
      (jedyny plik; gra/ nietknięte)
TESTY: własna weryfikacja 9 faktów źródłowych w kodzie i danych na main 27be5705 (F1-F9);
      6 ustaleń własnych zmieniających treść pytania (U1-U6); test §10a 3/3 na wersji finalnej.
BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: orkiestrator pokazuje sekcję 7 właścicielowi w głównym czacie; po odpowiedzi
      „pełne ID + litera" — ECHO do REJESTR-PROSB-I-ZADAN.md i PYTANIA-OTWARTE.md.
DEPLOY/PUSH: PUSH gałęzi autobot/ABC-TURNIEJ-FARMA-MIGRACJA WYKONANO; do main NIE WYKONANO
```
