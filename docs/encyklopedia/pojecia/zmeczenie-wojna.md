# Zmęczenie wojną

## Metadane

| Pole | Wartość |
|------|---------|
| id | `zmeczenie-wojna` |
| tytuł | Zmęczenie wojną |
| kategoria | Dyplomacja |
| poradnik_ref | Część XII §79.3 |
| json_ref | `war-weariness-params.json`, `war-weariness.ts` |
| stan | Stan na 2026-11-13 (weryfikacja w kodzie) |

---

## Wiki‑S

**Zmęczenie wojną** rośnie z każdą turą wojny, z każdym utraconym miastem i gdy front stoi w miejscu. Gdy jest wysokie, obie strony chętniej zawierają pokój, a przegrywający zaczyna oferować miasta, żeby go kupić.

---

## Wiki‑M

### Poziom zmęczenia

Poziom wynosi od 0 do 1 i sumuje dwa składniki (jeden licznik, bez zastoju):

- **czas wojny**: 1 punkt na 40 tur wojny (2,5% na turę od startu wojny; DIPLO-WAR-WEARINESS-40-TURNS-FORCED-PEACE-AT-100-Q1);
- **utracone miasta**: 0,10 na każde miasto, które zmieniło właściciela (obie strony).

Najwyższy osiągnięty poziom nie maleje (zapamiętany szczyt).

### Progi

| Próg | Wartość | Znaczenie |
|------|--------:|-----------|
| Chęć pokoju | 0,5 | od tego poziomu strony są skłonne do pokoju |
| Wyjście awaryjne (wzajemny pokój) | 0,8 | gdy przegrywający odrzucił co najmniej 3 oferty (`przegrywajacy.odrzuceniaDoKapitulacji`), zwycięzca przyjmuje to, co przegrywający realnie może zapłacić (`war-weariness.ts`, warunek `exhausted`) |
| Oferta z miastami (80%) | 0,8 | od tego poziomu AI proponuje pokój z miastami przegrywającego. Pokój bezwarunkowy przy 80% NIE istnieje (usunięty). Skala krzywej PW: `zmeczenie.progKoncaZmeczenia` |
| Pokój wymuszony (100%) | 1,0 | wojna kończy się pokojem WYMUSZONYM (`zmeczenie.progWymuszonyPokoj`, `wearinessForcedPeaceDue`): wyraźnie przegrywający oddaje tyle miast, ile trzeba do zrównoważenia ceny pokoju; min. 3 miasta zostają, stolica nigdy nie jest oddawana |

Przy 100% bez wyraźnie przegrywającego (remis sił) albo przy cenie pokoju 0 pokój zostaje zawarty bez oddania miast. Gdy trwa bitwa (`battlePending`), pokój wymuszony zostaje odroczony na następną turę. Pokój wymuszony dotyczy AI↔AI oraz gracza (para gracz↔AI w wojnie). Gracz dostaje natywne okno „Pokój wymuszony” oraz wpis w „Ważne”.

Bramki czasu ofert przegrywającego: tura 3 wojny po utracie miasta i tura 6 bez strat (`ofertaOdTurWojny`, `ofertaBezStratOdTur`).

Bramki czasu ofert przegrywającego to tura 3 wojny po utracie miasta i tura 6 bez strat (`ofertaOdTurWojny`, `ofertaBezStratOdTur`). W obecnym kodzie nie są pierwszym terminem: globalna blokada pokoju i rozejmu trwa pierwsze 10 pełnych tur wojny (`PEACE_PROPOSAL_MIN_WAR_TURNS`, `diplomacy-peace-proposal-timing.ts`). Tick AI↔AI (`war-weariness.ts`) wraca przed bramkami ofert, a propozycje AI do gracza przechodzą przez tę samą bramkę (`main.ts`, `peaceProposalIsTooEarly`). Pierwsza oferta przegrywającego może więc pojawić się najwcześniej w turze 10.

### Przegrywający

Przegrywający (udział siły 45% lub mniej) zaczyna oferować pokój, gdy jego **desperacja** rośnie. Desperacja łączy zmęczenie, przewagę przeciwnika i straty miast. Ma trzy stopnie:

| Stopień | Co oferuje |
|--------:|-----------|
| 1 | jedno miasto (pierwsze z puli) |
| 2 | jedno miasto |
| 3 | do dwóch miast |

Od decyzji właściciela 2026-11-13 (wariant CITY-ONLY) złoto i surowce nie są walutą pokoju zmęczenia: oferta składa się wyłącznie z miast. Stopień 1 i 2 oddają najwyżej jedno miasto, stopień 3 do dwóch (`war-weariness.ts`, `stageCityLimit`).

Po odrzuceniu oferty przegrywający czeka 3 tury, zanim złoży kolejną, a jego cena rośnie o 20%.

### Ochrona przegrywającego

Przegrywający z małą liczbą miast (do 3) albo po wielu stratach (co najmniej 3 utraty w tej wojnie) jest **chroniony**: zwycięzca musi przyjąć jego ofertę pokoju, bez dalszych żądań miast (co najmniej 3 miasta muszą zostać po oddaniu). Chroniony dostaje dłuższą karencję.

### Plusy i minusy

**Dla gracza**
- Plus: zmęczenie pozwala zakończyć długą wojnę bez całkowitego zniszczenia przeciwnika.
- Plus: przegrywający oferuje pokój i miasta, więc można zdobyć cenne miasta bez dalszych walk.
- Minus: długie stagnowanie frontu podnosi zmęczenie również u ciebie; przeciwnik może oferować pokój, którego nie chcesz.
- Minus: po pokoju obowiązuje karencja 40 tur (100 dla chronionego).

**Dla AI**
- Plus: AI przy wysokim zmęczeniu łatwiej kończy wojnę, która się przeciąga.
- Minus: przegrywający AI, po stratach, może zostać chroniony i nie da się go łatwo zniszczyć.

### Cena pokoju od gracza

Zmęczenie wojną nie obniża ceny pokoju. Od poziomu 0,5 pojawia się w tabeli punktów wymiany (PW) jako pozycja „Zmęczenie wojną +N PW”: N = cena pokoju × x², gdzie x rośnie liniowo od 0 (przy 50%) do 1 (przy 80%). Cena pokoju wynosi stałe 615 PW (nie zależy od cywilizacji ani od tury wojny). Czyli wolny start i przyspieszenie (krzywa kwadratowa). Reszta ceny do pokrycia to miasto. Przy 80% zmęczenia pozycja równa się całej cenie, pokój jest bezwarunkowy, a bilans wynosi 0.

### Panel dyplomacji

Panel dyplomacji pokazuje zmęczenie wojną strony wygrywającej (lub remisu) i desperację strony przegrywającej, zarówno w wojnie gracz↔AI, jak i AI↔AI (`src/ui/diplomacyAudience.ts`, `AudienceWarWearinessView`).

---

## Przykład liczbowy

Wojna trwa 20 tur (20/40 = 0,5), utracono 2 miasta (2 × 0,10 = 0,2). Poziom = 0,7, czyli powyżej progu chęci pokoju 0,5 i poniżej 80%. Po 40 turach bez zmian miast (40/40 = 1,0) następuje pokój wymuszony.

---

## Poradnik‑L

→ `docs/PORADNIK-GRACZA/12-dyplomacja.md` §79.3

---

## Parametry

| Wartość | Skąd (plik:klucz) |
|--------:|-------------------|
| 40 | `war-weariness-params.json:zmeczenie.pelneTur` |
| 1 | `war-weariness-params.json:zmeczenie.progWymuszonyPokoj` |
| 0.1 | `war-weariness-params.json:zmeczenie.wagaStratMiasta` |
| 0.5 | `war-weariness-params.json:zmeczenie.progChetnosci` |
| 0.8 | `war-weariness-params.json:zmeczenie.progWzajemnyPokoj` |
| 0.8 | `war-weariness-params.json:zmeczenie.progKoncaZmeczenia` |
| 3 | `war-weariness-params.json:przegrywajacy.odrzuceniaDoKapitulacji` |
| 3 | `war-weariness-params.json:przegrywajacy.ofertaOdTurWojny` |
| 6 | `war-weariness-params.json:przegrywajacy.ofertaBezStratOdTur` |
| 0.45 | `war-weariness-params.json:przegrywajacy.udzialWyraznie` |
| 0.5 | `war-weariness-params.json:przegrywajacy.wagaZmeczenia` |
| 0.5 | `war-weariness-params.json:przegrywajacy.wagaSily` |
| 0.3 | `war-weariness-params.json:przegrywajacy.wagaStrat` |
| 3 | `war-weariness-params.json:przegrywajacy.stratyNasycenie` |
| 0.25 | `war-weariness-params.json:przegrywajacy.progiStopni.0` |
| 0.45 | `war-weariness-params.json:przegrywajacy.progiStopni.1` |
| 0.65 | `war-weariness-params.json:przegrywajacy.progiStopni.2` |
| 2 | `war-weariness-params.json:przegrywajacy.maxMiastNaPokoj` |
| 3 | `war-weariness-params.json:przegrywajacy.minMiastPoOddaniu` |
| 0.2 | `war-weariness-params.json:przegrywajacy.mnoznikNaOdrzucenie` |
| 3 | `war-weariness-params.json:przegrywajacy.cooldownOfertTur` |
| 3 | `war-weariness-params.json:przegrywajacy.ochronaMaxMiast` |
| 3 | `war-weariness-params.json:przegrywajacy.ochronaUtratyWojny` |
| 40 | `war-weariness-params.json:przegrywajacy.karencjaPoPokojuTur` |
| 100 | `war-weariness-params.json:przegrywajacy.karencjaChronionegoTur` |

---

## Historia / decyzje

Hasło zweryfikowane w kodzie 2026-11-13 (R-WEB-DIPLO-CIVPEDIA-Q1). Od 2026-11-14 (R-WEB-DIPLO-WEARINESS-AS-PW-PEACE-ITEM-Q1, decyzja właściciela) stary rabat ceny 60% został usunięty; zmęczenie działa jako pozycja PW (funkcja `wearinessPeaceItemPw` w `war-weariness.ts`). Krzywa kwadratowa wybrana przez właściciela; próg końca zmęczenia 0,8 potwierdzony 2026-11-14.

R-WEB-DOCS-CIVPEDIA-DIPLO-REDESIGN-Q1 (obrona, runda 2): próg końca zmęczenia 0,8 zamiast „100% wygasa”; bramki ofert 3/6 opisane jako nieosiągalne przed turą 10; panel dyplomacji opisany wg `diplomacyAudience.ts`. Akcja `mutual_peace` nie jest akcją gracza ani AI: to wynik ticku AI↔AI (`war-weariness.ts`, `runWarWearinessTick`) przy progu końca zmęczenia. Rozbieżności JSON wobec kodu (`_wzor` „100% wojna wygasa”, stopień 1 „złoto i surowce”) zgłoszone do orkiestratora.
