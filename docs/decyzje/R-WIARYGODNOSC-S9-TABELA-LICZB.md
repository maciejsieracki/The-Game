# R-WIARYGODNOSC-S9-LICZBY-Q1 — pełna tabela liczb Wiarygodności (PROPOZYCJA, czeka na OK)

**Data:** 2026-08-06
**Status:** 🟡 **PROPOZYCJA — CZEKA NA DECYZJĘ MACIEJA.** Zero kodu wdrożone. Zero zmian w
`gra/data/diplomacy.json` ani w `gra/src/game/diplomacy.ts` / `diplomacy-credibility.ts`.
**Wariant:** `R-WIARYGODNOSC-S9-LICZBY-Q1 = B` — najpierw ta tabela w czacie, dopiero po `OK`
(lub literach per-parametr) wchodzi kod.
**Źródła:** `dyspozycje/WIARYGODNOSC-SPECYFIKACJA.md` (kanon wzorów, §1–§10) ·
`docs/decyzje/R-WIARYGODNOSC-AUDIT-OPEN-VS-DEPLOYED-2026-08-05.md` (co wdrożone) ·
`docs/decyzje/R-WIARYGODNOSC-S9-Q1.md` (zapisana zgoda A na tę paczkę) ·
`gra/src/game/diplomacy.ts:284–384` (`DIPLOMACY_PARAMS`, blok Wiarygodność) ·
`gra/src/game/diplomacy-credibility.ts` (funkcje liczące).

---

## 0. Zakres i stan dzisiejszy — ważne zanim ktokolwiek odpowie literami

1. **Rdzeń mechanizmu (kary, strumień, finisz, czyny, zapominanie, dźwignie 1/3/4) jest już
   wdrożony i grany** (FALA 19–247, testy `wiarygodnosc-test.cjs` 152/152 PASS). Ta tabela
   **nie zmienia mechanizmu** — wyłącznie WARTOŚCI liczbowe strojenia.
2. **Wszystkie 41 parametrów Wiarygodności dziś żyją WYŁĄCZNIE jako stałe TypeScript**
   w `DIPLOMACY_PARAMS` (`gra/src/game/diplomacy.ts:284–384`) — **żaden nie ma jeszcze
   odpowiednika w `gra/data/diplomacy.json`** (sprawdzone: `params` w JSON nie zawiera ani
   jednego klucza zaczynającego się na `wiarygodnosc`). Komentarz w kodzie to potwierdza:
   *„wartości tymczasowo hardkodowane tutaj; docelowo mają trafić do gra/data/diplomacy.json
   przez Panel-D Excela"*. Kolumna „dziś" w tabelach niżej to więc wartość ze źródła TS, nie z
   JSON — JSON dogoni dopiero po akceptacji tej tabeli (`loadDiplomacyParams` już dziś czyta
   klucze po nazwie 1:1, więc migracja jest czystym dopisaniem do JSON, bez zmiany kodu).
3. **Uczciwe zastrzeżenie wobec ramy zadania:** duża część tych 41 wartości **nie jest
   przypadkowym placeholderem** — to dosłowne przeniesienie liczb, które Maciej już zatwierdził
   w toku pisania specyfikacji (`WIARYGODNOSC-SPECYFIKACJA.md` §10, decyzje z ID `C-WIAR-*`:
   `C-WIAR-N4=B`, `C-WIAR-KRZYWA=A`, `C-WIAR-TEMPO`, `C-WIAR-SKALA`, `C-WIAR-SLAD=A` itd.) oraz
   kolejnych domknięć (`R-WIARYGODNOSC-TEMPO-PRZYWROCENIE`, `REL-WIARYG-DRIFT-Q1`). Nie
   zmyślam więc nowych liczb tam, gdzie decyzja już zapadła — rekomendacja w takich wierszach to
   **POTWIERDZENIE**, z odniesieniem do istniejącego uzasadnienia w specyfikacji. Prawdziwych
   „nigdy niezatwierdzonych" liczb, które warto przejrzeć krytycznie, jest w tym zbiorze
   niewiele — oznaczone niżej wprost.
4. **Poza zakresem tej tabeli** (świadomie pominięte, bo to NIE są parametry Wiarygodności,
   mimo podobnych nazw/prefiksów): `nap_zaufanie_perTura`, `karaPrzemarszNieautoryzowany_zaufanie_perTura`,
   `progSojuszKaraSilniejszyMax`, `progSojuszKaraMilSkok`, `progSojuszKaraAllySkok` i pokrewne
   `progSojusz*` — to **starsze, już wcześniej stosowane** parametry systemu **Zaufania/Sojuszu**
   (per para), nietknięte przez ten projekt. `R-WIARYGODNOSC-S9-Q1=A` ogranicza zakres wprost do
   „wag N1–N7, strumienia S1–S4, czasów zapominania, progów UI" Wiarygodności — nie do całej
   dyplomacji. Pełny grep po prefiksach `wiarygodnosc*` (TS) i `kara*`/`strumien*` (JSON) wykonany;
   jedyne trafienia `kara*`/`strumien*` w samym `diplomacy.json` to `karaPrzemarszNieautoryzowany_zaufanie_perTura`
   (Zaufanie, nie Wiarygodność) — brak innych.

**Legenda kolumny „Status":** **POTWIERDZENIE** = obecna wartość już przemyślana (ma
uzasadnienie w spec/decyzji), rekomenduję zostawić bez zmian. **KOREKTA** = rekomenduję inną
wartość LUB inną formę parametru (np. wystawienie ukrytej stałej jako nazwany parametr) —
uzasadnienie w kolumnie obok.

---

## 1. Skala i wartości startowe (§1 specyfikacji)

| Parametr (nazwa TS/JSON) | Dziś | Jednostka i kontekst | Rekomendacja | Uzasadnienie | Status |
|---|---|---|---|---|---|
| `wiarygodnoscSkalaMin` | −100 | pkt Wiarygodności — dolna granica skali globalnej reputacji cywilizacji | −100 (bez zmian) | Symetryczna skala −100…+100 to jawna decyzja z §10 spec („Skala: −100…+100, nie 0–100"); zmiana wymagałaby przeliczenia wszystkich pozostałych 40 parametrów. | POTWIERDZENIE |
| `wiarygodnoscSkalaMax` | 100 | pkt Wiarygodności — górna granica skali | 100 (bez zmian) | Jak wyżej, symetria z minimum. | POTWIERDZENIE |
| `wiarygodnoscProgWzorCnoty` | 40 | pkt Wiarygodności — próg pasma „Wzór cnoty" (W ≥ próg) | 40 (bez zmian) | Wprost z tabeli pasm §1 (+40…+100 Wzór cnoty). Przy starcie „Łatwy" (+40) gracz zaczyna DOKŁADNIE na progu najwyższego pasma — czytelne dla UI, celowe. | POTWIERDZENIE |
| `wiarygodnoscProgWiarolomny` | −40 | pkt Wiarygodności — próg pasma „Wiarołomny" (W ≤ próg) | −40 (bez zmian) | Symetryczne z progiem cnoty; wymaga 2 pełnych zdrad sojusznika (2×−25 świeże) lub kilku mniejszych kar, żeby spaść do najgorszego pasma — sensowna bariera wejścia. | POTWIERDZENIE |
| `wiarygodnoscStartLatwy` | +40 | pkt Wiarygodności — wartość startowa partii, poziom Łatwy | 40 (bez zmian) | Decyzja WIAR-Q6 (§10): świat zakłada dobre intencje, sojusze dostępne od razu (próg sojuszu W≥0 spełniony z dużym zapasem). | POTWIERDZENIE |
| `wiarygodnoscStartNormalny` | +20 | pkt Wiarygodności — wartość startowa, poziom Normalny | 20 (bez zmian) | WIAR-Q6: lekki kredyt zaufania, spójny z istniejącym `startZaufanie=20` dla Zaufania per-parowego (ten sam rząd wielkości „punktu zerowego" w obu systemach). | POTWIERDZENIE |
| `wiarygodnoscStartTrudny` | 0 | pkt Wiarygodności — wartość startowa, poziom Trudny | 0 (bez zmian) | WIAR-Q6: zero kredytu — próg sojuszu (W≥0) stoi dokładnie na starcie, więc na Trudnym trzeba go **utrzymać** (jedna kara N-cokolwiek zamyka drogę do sojuszu), zgodne z duchem „trudny = surowy świat". | POTWIERDZENIE |

---

## 2. Kary N1–N7 (§2 specyfikacji)

| Parametr | Dziś | Jednostka i kontekst | Rekomendacja | Uzasadnienie | Status |
|---|---|---|---|---|---|
| `wiarygodnoscN1BezOstrzezenia` | −10 | pkt Wiarygodności, jednorazowo — atak bez wypowiedzenia wojny LUB atak w tej samej turze co wypowiedzenie (N1) | −10 (bez zmian) | Najmniejsza z kar „wojennych" — karze SPOSÓB, nie CEL ataku. Razem z N2 daje spójną tabelę kombinacji z §2 (neutralny+zaskoczenie=−10, sojusznik+zaskoczenie=−35 maksimum) — zmiana tej liczby psułaby już zweryfikowaną arytmetykę tabeli kombinacji. | POTWIERDZENIE |
| `wiarygodnoscN1KarencjaTur` | 1 | tury — ile tur po wypowiedzeniu wojny trzeba odczekać, żeby atak nie liczył się jako „bez ostrzeżenia" | 1 (bez zmian) | Dosłowny cytat specyfikacji: „po wypowiedzeniu wojny trzeba odczekać JEDNĄ turę". Krótsze niż N3/odwet (10 tur) celowo — to inny mechanizm (UX ostrzeżenia, nie kara za zerwanie relacji). | POTWIERDZENIE |
| `wiarygodnoscN2ZlamaniePaktuNap` | −18 | pkt Wiarygodności, jednorazowo — wypowiedzenie wojny mimo aktywnego Paktu o Nieagresji (N2, wariant NAP) | −18 (bez zmian) | Środek między N1 (−10, sposób) i N2-sojusz (−25, zdrada sojuszu) — proporcjonalnie do wagi zobowiązania (NAP < Sojusz). Wartość wprost z zatwierdzonej tabeli §2. | POTWIERDZENIE |
| `wiarygodnoscN2ZlamaniePaktuSojusz` | −25 | pkt Wiarygodności, jednorazowo — wypowiedzenie wojny mimo aktywnego Sojuszu / atak na sojusznika (N2, wariant Sojusz) | −25 (bez zmian) | Największa pojedyncza kara N-cokolwiek — zdrada sojusznika to najcięższe świadome przewinienie w systemie. Spec wprost liczy z tej wartości czas odbudowy: „Sojusz +1/turę → po 25 turach odrabia jedną zdradę" — S1=1.0 i N2-sojusz=−25 są ZAPROJEKTOWANE razem, nie osobno; zmiana jednej bez drugiej psuje tę symetrię. | POTWIERDZENIE |
| `wiarygodnoscN3AtakWOknieKarencji` | −12 | pkt Wiarygodności, jednorazowo, DODATKOWO na wierzchu N1/N2 — atak w oknie karencji po zakończeniu porozumienia | −12 (bez zmian) | Wartość pośrednia między N1 (−10, drobne uchybienie proceduralne) i N4 (−15, złamanie zobowiązania) — sensowne miejsce w hierarchii kar, bo N3 to „obejście" ducha zobowiązania przez formalne jego zakończenie tuż przed atakiem. | POTWIERDZENIE |
| `wiarygodnoscN3KarencjaBezterminoweTur` | 10 | tury — ile tur po jednostronnym zakończeniu porozumienia BEZTERMINOWEGO (lub po pokoju) trzeba odczekać przed atakiem bez kary N3 | 10 (bez zmian) | Środek skali czasowej systemu (krócej niż P4=30 „długi pokój", tyle samo co okno odwetu). Wystarczające, by nie dało się „wypowiedzieć i uderzyć w tej samej turze" (co i tak łapie N1), a jednocześnie nie blokuje gracza na całą epokę. | POTWIERDZENIE |
| `wiarygodnoscN4OdmowaObowiazkuSojuszu` | −15 | pkt Wiarygodności, jednorazowo — odmowa pomocy sojusznikowi na wezwanie obowiązku sojuszniczego (kara WYŁĄCZNIE dla odmawiającego) | −15 (bez zmian) | Jawna decyzja `C-WIAR-N4=B` (podniesiona z pierwotnej propozycji −10) — Maciej już to zatwierdził z uzasadnieniem „odmowa unieważnia cały sens sojuszu", hierarchia N2-sojusz(−25) > N4(−15) > N5-traktat(−6) zachowana. | POTWIERDZENIE |
| `wiarygodnoscN5ZerwanieTraktatCzasowy` | −6 | pkt Wiarygodności, jednorazowo — dobrowolne zerwanie traktatu CZASOWEGO (nie handlowego) | −6 (bez zmian) | Najmniejsza kara „świadomej decyzji" (nie zaskoczenia) — traktat czasowy i tak miał się skończyć, karzemy tylko przedwczesność. Spójne z N5-handel (−4, jeszcze mniej, bo umowa handlowa to słabsze zobowiązanie niż traktat polityczny). | POTWIERDZENIE |
| `wiarygodnoscN5ZerwanieHandelCzasowy` | −4 | pkt Wiarygodności, jednorazowo — dobrowolne zerwanie umowy handlowej CZASOWEJ | −4 (bez zmian) | Najmniejsza kara w całej tabeli N — handel to najsłabsze zobowiązanie (S3=0,3/turę też najniższe w strumieniu obok S4). Konsekwentna hierarchia: Sojusz > NAP > Handel > Przemarsz, ta sama kolejność w karach i w nagrodach strumienia. | POTWIERDZENIE |
| `wiarygodnoscN6NiedotrzymanieHandluCyklicznego` | −2 | pkt Wiarygodności, jednorazowo — niedotrzymanie handlu cyklicznego (próg: `wiarygodnoscN6ProgTurZRzedu` tur z rzędu z winy strony) | −2 (bez zmian) | Symetryczne z N7 (−2) — obie to kary „drobnych, powtarzalnych" uchybień, nie jednorazowych decyzji politycznych. Niska waga celowa: to zdarzenie może się powtarzać wielokrotnie w długiej umowie cyklicznej, więc pojedyncza kara musi być mała, żeby nie zdominować rejestru. | POTWIERDZENIE |
| `wiarygodnoscN6ProgTurZRzedu` | 3 | tury z rzędu (z winy tej samej strony) — próg, po którym nalicza się kara N6 | 3 (bez zmian) | Dosłowny cytat specyfikacji („3 tury z rzędu z winy strony"). Wystarczająco krótkie, by kara nie czekała w nieskończoność, wystarczająco długie, by nie karać jednorazowego, przejściowego niedoboru zasobu. | POTWIERDZENIE |
| `wiarygodnoscN7NieautoryzowanyPrzemarsz` | −2 | pkt Wiarygodności, JEDNORAZOWO przy pierwszym wykryciu w danej „wizycie" (nie co turę) — nieautoryzowany przemarsz przez cudze terytorium | −2 (bez zmian) | Wprost z §2: najmniejsza kara w tabeli razem z N6, świadomie jednorazowa (nie co turę, żeby nie zdominować rejestru — osobna, wyższa kara co-turę już istnieje w systemie Zaufania, `karaPrzemarszNieautoryzowany_zaufanie_perTura=5`, poza zakresem tej tabeli). Zwiadowcy wykluczeni z tej kary (`C-WIAR-SKAUT=A`) — bez zmian tu, to osobna reguła kwalifikacji jednostki, nie liczba. | POTWIERDZENIE |
| `wiarygodnoscOdwetOknoTur` | 10 | tury — okno od cudzego N1/N2/N4 wobec nas, w którym nasza odwetowa wojna NIE nalicza N1/N2 | 10 (bez zmian) | **Jedyny parametr, który sama specyfikacja oznacza wprost jako `[ZAŁOŻENIE — do strojenia]`** (§2, „Odwet"), nie jako zamkniętą decyzję z ID. Rekomenduję mimo to POTWIERDZENIE: 10 tur pokrywa się z oknem N3 (`wiarygodnoscN3KarencjaBezterminoweTur=10`) — ta sama „jednostka czasu polityczna" w dwóch miejscach systemu, spójne i łatwe do wytłumaczenia w UI („10 tur to standardowe okno karencji w Wiarygodności"). Gdyby Maciej wolał inną wartość, warto rozważyć zrównanie jej też z N3 (żeby nie rozjeżdżać dwóch okien czasowych bez wyraźnego powodu). | POTWIERDZENIE (z zastrzeżeniem — patrz uzasadnienie) |

---

## 3. Strumień S1–S4 — nagrody NA TURĘ za trwające zobowiązania (§3 tabela A)

| Parametr | Dziś | Jednostka i kontekst | Rekomendacja | Uzasadnienie | Status |
|---|---|---|---|---|---|
| `wiarygodnoscS1SojuszPerTure` | +1,0 | pkt Wiarygodności / turę — Sojusz (pełny lub defensywny) aktywny, za każdy trwający sojusz | 1,0 (bez zmian) | Najwyższa w tabeli strumienia — najsilniejsze zobowiązanie. Zaprojektowana WPROST razem z N2-sojusz(−25): 25 tur strumienia odrabia jedną zdradę — to jest podstawa czytelności całego systemu kar/nagród, nie zmieniać w oderwaniu od N2. | POTWIERDZENIE |
| `wiarygodnoscS2NapPerTure` | +0,5 | pkt Wiarygodności / turę — Pakt o Nieagresji aktywny | 0,5 (bez zmian) | Połowa S1 — proporcjonalnie do wagi NAP względem Sojuszu, ta sama proporcja co N2-NAP(−18)/N2-sojusz(−25) ≈ 0,72, blisko S2/S1=0,5 (nie identyczna, ale ten sam kierunek hierarchii — kary i nagrody NIE muszą być idealnie proporcjonalne 1:1, tylko zachowywać tę samą kolejność, co robią). | POTWIERDZENIE |
| `wiarygodnoscS3HandelPerTure` | +0,3 | pkt Wiarygodności / turę — umowa handlowa / handel cykliczny ZE 100% zrealizowanych dostaw tej tury | 0,3 (bez zmian) | Trzecia w hierarchii wagi zobowiązań (Sojusz > NAP > Handel > Przemarsz), zgodna z kolejnością kar N5 (traktat −6 > handel −4). Warunek „100% dostaw" (bez zmian numerycznych, to reguła atomowości C-HANDEL-3) chroni przed farmieniem tej nagrody bez realnego ryzyka. | POTWIERDZENIE |
| `wiarygodnoscS4PrzemarszPerTure` | +0,2 | pkt Wiarygodności / turę — prawo przemarszu / otwarte granice aktywne | 0,2 (bez zmian) | Najsłabsze zobowiązanie w tabeli — otwarcie granic nie wymaga wzajemnego zaufania w takim stopniu jak handel czy sojusz. Domyka spójną drabinę 1,0 / 0,5 / 0,3 / 0,2. | POTWIERDZENIE |

**Uwaga do §9.2 (już rozstrzygnięte, nie do ponownego głosowania):** kumulacja strumienia z wielu
jednoczesnych zobowiązań/partnerów jest BEZ LIMITU (decyzja C, spec §9.2). Przy wartościach
powyższych gracz z 5 aktywnymi sojuszami zyskuje +5,0 pkt Wiarygodności/turę — świadomie
zaakceptowane przez Maciej, nie traktować jako sygnału do obniżenia S1–S4.

---

## 4. Finisz P1–P3 — nagroda jednorazowa za dotrwanie do końca zobowiązania (§3 tabela B)

| Parametr | Dziś | Jednostka i kontekst | Rekomendacja | Uzasadnienie | Status |
|---|---|---|---|---|---|
| `wiarygodnoscP1FiniszSojusz` | +10 | pkt Wiarygodności, jednorazowo — Sojusz dotrwany do naturalnego końca | 10 (bez zmian) | Razem ze strumieniem S1 (30-turowy sojusz = +30 strumienia + 10 finiszu = +40 łącznie) daje przewagę „wytrwałości widocznej cały czas, finisz to tylko domknięcie" — dokładnie taki efekt, jaki opisuje uzasadnienie w spec §3. | POTWIERDZENIE |
| `wiarygodnoscP2FiniszNap` | +5 | pkt Wiarygodności, jednorazowo — Pakt o Nieagresji dotrwany do końca | 5 (bez zmian) | Połowa P1, zgodnie z proporcją Sojusz/NAP z reszty tabeli. | POTWIERDZENIE |
| `wiarygodnoscP2FiniszHandel` | +5 | pkt Wiarygodności, jednorazowo — umowa handlowa dotrwana do końca | 5 (bez zmian) | Ta sama wartość co P2-NAP — świadomie wg spec (jedna pozycja tabeli „P2" obejmuje oba przypadki). Nie jest to literówka. | POTWIERDZENIE |
| `wiarygodnoscP3FiniszHandelCykliczny` | +1 | pkt Wiarygodności, jednorazowo — handel cykliczny ze 100% dostaw AŻ do końca całej umowy | 1 (bez zmian) | Najniższa nagroda finiszu — handel cykliczny już nagradza co turę przez S3 (0,3/turę), więc finisz to tylko mały bonus domykający, nie główny motywator. | POTWIERDZENIE |

---

## 5. Czyny P4–P5 — nagroda jednorazowa, niepowiązana z konkretnym trwającym zobowiązaniem (§3 tabela C)

| Parametr | Dziś | Jednostka i kontekst | Rekomendacja | Uzasadnienie | Status |
|---|---|---|---|---|---|
| `wiarygodnoscP4BezWojny30Tur` | +3 | pkt Wiarygodności, jednorazowo, powtarzalny co `wiarygodnoscP4OknoBezWojnyTur` tur — kamień milowy „30 tur bez wojny z kimkolwiek" | 3 (bez zmian) | Mała, powtarzalna nagroda za pokojową grę w długim okresie — celowo niewielka, żeby nie konkurować z S1–S4 (aktywne zobowiązania), tylko dopełniać je dla graczy bez traktatów. | POTWIERDZENIE |
| `wiarygodnoscP4OknoBezWojnyTur` | 30 | tury — długość okna „bez wojny" wymaganego do naliczenia P4, licznik globalny (nie per para, decyzja §9.3=A) | 30 (bez zmian) | Największe okno czasowe w całym systemie Wiarygodności — spójne z tym, że to najbardziej „strategiczny", długoterminowy kamień milowy. | POTWIERDZENIE |
| `wiarygodnoscP5PomocSojusznikowi` | +20 | pkt Wiarygodności, jednorazowo — realna pomoc sojusznikowi w wojnie (dołączenie z własnej woli LUB na wezwanie) | 20 (bez zmian) | Spec wprost uzasadnia tę wartość przez porównanie z N2-sojusz (−25): „niemal symetria — stanięcie przy sojuszniku to najmocniejszy dowód wiarygodności, tak jak zdrada jest najmocniejszym dowodem przeciwnym". Druga najwyższa liczba w całym zbiorze (po N2-sojusz), celowo. | POTWIERDZENIE |

---

## 6. Zapominanie — krzywa z trwałą podłogą (§4 specyfikacji)

| Parametr | Dziś | Jednostka i kontekst | Rekomendacja | Uzasadnienie | Status |
|---|---|---|---|---|---|
| `wiarygodnoscCzasZapomnieniaKaraLatwy` | 40 | tury do osiągnięcia trwałej podłogi 10% — kary (N1–N7), poziom Łatwy | 40 (bez zmian) | Tabela §4: Łatwy = „świat wybaczający", kary gasną szybko (2,5%/turę). Odwrotność czasu nagród na tym poziomie (120) — celowa asymetria charakteru trudności. | POTWIERDZENIE |
| `wiarygodnoscCzasZapomnieniaKaraNormalny` | 80 | tury — kary, poziom Normalny | 80 (bez zmian) | Symetryczny środek (80/80 kara/nagroda) — „normalny" świat nie faworyzuje żadnego kierunku pamięci. | POTWIERDZENIE |
| `wiarygodnoscCzasZapomnieniaKaraTrudny` | 120 | tury — kary, poziom Trudny | 120 (bez zmian) | Trudny = „świat surowy", zdradę pamięta najdłużej (0,833%/turę) — spójne z `wiarygodnoscStartTrudny=0` (brak kredytu zaufania na starcie I długa pamięć na błędy = spójny „surowy" profil trudności). | POTWIERDZENIE |
| `wiarygodnoscCzasZapomnieniaNagrodaLatwy` | 120 | tury — nagrody (FINISZ+CZYNY), poziom Łatwy | 120 (bez zmian) | Odwrócone względem kar na tym poziomie — Łatwy pamięta DOBRO długo (120), zapomina ZŁO szybko (40). Dokładnie ten kontrast opisuje uzasadnienie w spec §4. | POTWIERDZENIE |
| `wiarygodnoscCzasZapomnieniaNagrodaNormalny` | 80 | tury — nagrody, poziom Normalny | 80 (bez zmian) | Jak kara-Normalny, symetria 80/80. | POTWIERDZENIE |
| `wiarygodnoscCzasZapomnieniaNagrodaTrudny` | 40 | tury — nagrody, poziom Trudny | 40 (bez zmian) | Trudny zapomina dobre uczynki szybko (2,5%/turę) — spójne z „surowym światem", w którym reputację trudno budować i łatwo stracić. | POTWIERDZENIE |
| `wiarygodnoscTrwalaPodlogaProcent` | 0,10 (10%) | ułamek [0,1] wartości pierwotnej — poziom, na którym krzywa zapominania zatrzymuje się NA ZAWSZE (dotyczy WYŁĄCZNIE zdarzeń jednorazowych, nie strumienia) | 0,10 (bez zmian) | Jawna decyzja `C-WIAR-KRZYWA=A` — „krzywa liniowa z trwałą podłogą 10%, NIE do zera". Przykład z samej specyfikacji: zdrada sojusznika (−25) zostawia −2,5 na zawsze — czytelny, niewielki, ale trwały ślad życiorysu. Kumulacja bez limitu (§9.6=A) to osobna, już rozstrzygnięta decyzja, nie ta liczba. | POTWIERDZENIE |

---

## 7. Progi twarde i wpływ na Zaufanie (§5 — Dźwignie 1/3/4)

| Parametr | Dziś | Jednostka i kontekst | Rekomendacja | Uzasadnienie | Status |
|---|---|---|---|---|---|
| `wiarygodnoscProgSojuszMin` | 0 | pkt Wiarygodności — twardy próg Dźwigni 3: propozycja Sojuszu wymaga W ≥ próg, niezależnie od Zaufania/Respektu | 0 (bez zmian) | Wprost z §5. Na Trudnym (start=0) sojusz jest osiągalny od razu, ale każda kara zamyka drogę do niego, dopóki W nie wróci ≥0 — spójne z resztą profilu trudności. | POTWIERDZENIE |
| `wiarygodnoscProgNapMin` | −40 | pkt Wiarygodności — twardy próg Dźwigni 3: propozycja Paktu o Nieagresji wymaga W ≥ próg | **0** — decyzja Maciej 2026-08-07: „tutaj też powinna być wiarygodność zero tak samo jak przy sojuszu" | Wyrównanie z `wiarygodnoscProgSojuszMin=0` — NAP i Sojusz mają teraz identyczny twardy próg Wiarygodności. Konsekwencja do odnotowania: poprzednie uzasadnienie („NAP niedostępny wyłącznie dla pasma Wiarołomny, próg=−40 pokrywał się z `wiarygodnoscProgWiarolomny`") przestaje obowiązywać — po zmianie NAP jest niedostępny już dla całego ujemnego zakresu W (tak jak Sojusz), nie tylko dla Wiarołomnych. | **KOREKTA (zatwierdzona)** |
| `wiarygodnoscZaufanieDzielnikPerTura` | 20 | dzielnik (bezjednostkowy) — dziś używany WYŁĄCZNIE przez Dźwignię 4 (pierwszy kontakt): `modyfikatorZaufaniaD4OdWiarygodnosci(W) = round(W / 20)`, czyli przy pierwszym kontakcie modyfikator startowego Zaufania wynosi maks. ±5 pkt Zaufania na stronę (±10 łącznie dla pary) | 20 (bez zmian wartości) — **ale rekomenduję KOREKTĘ nazwy/komentarza w kodzie (bez zmiany liczby)** | Historycznie to był dzielnik oryginalnej Dźwigni 1 (bezpośredni strumień ΔZ=W/20 do Zaufania per turę, §5 kanon specyfikacji) — ta ścieżka została ANULOWANA i zastąpiona mnożnikiem tempa (`R-WIARYGODNOSC-TEMPO-PRZYWROCENIE-2026-08-03`, WIAR-Q3=C). Dziś parametr żyje dalej, ale WYŁĄCZNIE jako dzielnik Dźwigni 4 — komentarz w kodzie („Dzielnik strumienia Wiarygodność→Zaufanie") jest nieaktualny względem faktycznego użycia. To nie jest błąd liczby (±5 pkt startowego Zaufania to rozsądny, umiarkowany zakres), tylko dług dokumentacyjny — sygnalizuję, nie proszę o decyzję liczbową. | POTWIERDZENIE wartości / KOREKTA opisu (poza zakresem zmian liczbowych) |

---

## 8. Dodatek — dwie stałe POZA `DIPLOMACY_PARAMS` (nie w JSON, nie nazwane jako parametr)

Znalezione grepem po całym module `diplomacy-credibility.ts`, aktywnie używane w silniku, ale
**nie żyją jako `DIPLOMACY_PARAMS`** (więc nie trafią do `diplomacy.json` przez dzisiejszy
`loadDiplomacyParams`, i nie są dostępne do strojenia z Panelu-D Excela). Zgłaszam je, bo zasada
CLAUDE.md „każda liczba MUSI mieć nazwany parametr i jednostkę" dziś nie jest w pełni spełniona
dla tych dwóch — ale to KOREKTA **opakowania** (ekspozycji jako osobny, nazwany parametr), nie
propozycja innej wartości.

| Stała | Dziś | Jednostka i kontekst | Rekomendacja | Uzasadnienie | Status |
|---|---|---|---|---|---|
| `WIARYGODNOSC_ZAUFANIE_DRYF_NA_100` (`diplomacy-credibility.ts:582`) | 0,03 | współczynnik: pkt Zaufania/turę PER pkt Wiarygodności — pasywny dryf Zaufania z globalnej Wiarygodności, niezależny od traktatów (`REL-WIARYG-DRIFT-Q1`, wdrożone 2026-08-04). Przy W=+100 → +3,0 pkt Zaufania/turę; W=−100 → −3,0/turę. | wartość 0,03 bez zmian; **rekomendacja: przenieść do `DIPLOMACY_PARAMS` jako `wiarygodnoscZaufanieDryfNa100`** | Wartość jest już zatwierdzoną decyzją (`REL-WIARYG-DRIFT-Q1`, „liniowo ±3 przy ±100") — nie proponuję jej zmiany. Ale dziś to jedyny hardkodowany moduł-const w całym zestawie Wiarygodności, poza systemem JSON/Panel-D — czysto techniczna nierówność traktowania, wymagająca osobnego, DROBNEGO zlecenia kodowego (przeniesienie stałej), nie tego dokumentu. | POTWIERDZENIE wartości / KOREKTA opakowania |
| Amplituda mnożnika tempa „0,5" (`diplomacy-credibility.ts`, wewnątrz `wiarygodnoscWzrostMult`/`wiarygodnoscSpadekMult`, wzór `1 ± (W/100)×0,5`) | 0,5 | współczynnik bezjednostkowy — jak mocno reputacja przyspiesza/spowalnia WSZYSTKIE per-turowe i jednorazowe zmiany Zaufania (dotrzymywanie umów, dary, zdarzenia). Przy W=+100: zyski ×1,5, straty ×0,5. Przy W=−100: odwrotnie. | wartość 0,5 bez zmian; **rekomendacja: nazwać jako `DIPLOMACY_PARAMS.wiarygodnoscTempoAmplituda`** | Wartość pochodzi wprost z zatwierdzonego wzoru `R-WIARYGODNOSC-TEMPO-PRZYWROCENIE-2026-08-03` (WIAR-Q3=C) — nie proponuję innej liczby. Dziś jest to dosłowny literał w treści wzoru (nawet bez nazwy stałej modułowej, w przeciwieństwie do dryfu powyżej) — najbardziej „ukryta" liczba w całym zestawie względem zasady CLAUDE.md o nazwanych parametrach. | POTWIERDZENIE wartości / KOREKTA opakowania |

**Uwaga techniczna do obu powyższych (informacyjnie, nie pytanie ABC):** w dzisiejszym kodzie
(`computeTickZaufanieDelta`, `diplomacy.ts:1592–1618`) dryf (0,03×W) jest NAJPIERW dodawany do
sumy `dZ`, a DOPIERO POTEM cała suma `dZ` (już zawierająca dryf) przechodzi przez mnożnik tempa
(×1±0,5·W/100) — czyli przy skrajnym W dryf sam w sobie też jest skalowany tempem (np. W=+100:
dryf +3,0 → po mnożniku ×1,5 → efektywnie +4,5/turę z samego dryfu, jeszcze przed jakimkolwiek
traktatem). To zaobserwowany fakt z czytania kodu, nie błąd — ale skoro oba mechanizmy czerpią
z tej samej liczby W i działają w tym samym kierunku, warto mieć to na uwadze przy playteście
skrajnych wartości Wiarygodności. Odnotowuję to tu do wiadomości, nie otwieram nowego wątku ABC.

---

## 9. Podsumowanie

| Miernik | Wartość |
|---|---|
| **Parametrów w `DIPLOMACY_PARAMS` (TS, docelowo JSON)** | **41** |
| **Dodatkowych stałych poza `DIPLOMACY_PARAMS`** | **2** (dryf 0,03; amplituda tempa 0,5) |
| **RAZEM zinwentaryzowanych liczb** | **43** |
| **POTWIERDZENIE (wartość bez zmian)** | **43 / 43** — żadna rekomendowana wartość liczbowa nie różni się od dzisiejszej |
| **KOREKTA wartości liczbowej** | **0** |
| **KOREKTA opakowania (ta sama wartość, inna forma w kodzie — nie wymaga litery per-parametr, tylko zgody „tak, zrób" przy najbliższej okazji kodowej)** | **3** (`wiarygodnoscZaufanieDzielnikPerTura` — komentarz; `WIARYGODNOSC_ZAUFANIE_DRYF_NA_100` — przenieść do `DIPLOMACY_PARAMS`; amplituda tempa 0,5 — nazwać) |
| **Parametr z zastrzeżeniem źródłowym** (spec sama go oznaczyła jako założenie) | **1** (`wiarygodnoscOdwetOknoTur`) — rekomendacja mimo to: zostawić |

**Moja pewność co do rekomendacji: wysoka dla wszystkich 41 parametrów w `DIPLOMACY_PARAMS`** —
niemal każdy ma już jawne uzasadnienie zapisane w `WIARYGODNOSC-SPECYFIKACJA.md` (część nawet
z formalnym ID decyzji `C-WIAR-*`), a te bez ID mają spójną, wewnętrzną logikę proporcji
(hierarchia Sojusz > NAP > Handel > Przemarsz powtórzona identycznie w karach, strumieniu
i finiszu). **Nie znalazłem parametru, który wyglądałby na przypadkową, niedopasowaną liczbę** —
w przeciwieństwie do założenia w zleceniu („dziś placeholdery… nigdy nie przetestowane
playtestem"), analiza tekstu specyfikacji pokazuje, że większość z nich to JUŻ podjęte decyzje
Macieja, tylko jeszcze niewyeksportowane do JSON. Jedyne realne otwarte punkty to (a) jeden
parametr sama specyfikacja oznaczyła jako niepewny (`wiarygodnoscOdwetOknoTur`), i (b) dwie
stałe żyjące poza systemem danych, które warto — przy okazji, nie pilnie — przenieść do
`DIPLOMACY_PARAMS` dla spójności z resztą projektu.

**To jest PROPOZYCJA.** Nic z powyższego nie zostało wdrożone — `gra/data/diplomacy.json` i
`gra/src/game/**` są dziś dokładnie takie, jak przed tym zleceniem. Czekam na:
- **„OK"** — zatwierdzenie całości (wszystkie 41 wartości bez zmian + zgoda na 3 korekty
  opakowania przy najbliższej okazji kodowej), **albo**
- **litery/komentarze per parametr** tam, gdzie Maciej chce inaczej.

Dopiero po odpowiedzi: eksport tych 41 wartości do `gra/data/diplomacy.json` (`params` — dopisanie
kluczy `wiarygodnosc*`, zero zmian wartości domyślnych w TS, bo są identyczne) + ewentualne
korekty opakowania + rozszerzenie `wiarygodnosc-test.cjs` o asercję „JSON ma te same wartości co
TS default" — osobne zlecenie kodowe, po `numer+ABC+commit`.
