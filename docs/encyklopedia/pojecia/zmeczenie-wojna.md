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
| Pokój wymuszony (100%) | 1,0 | wojna kończy się pokojem WYMUSZONYM (`zmeczenie.progWymuszonyPokoj`, `wearinessForcedPeaceDue`): wyraźnie przegrywający oddaje tyle miast, ile trzeba do pokrycia ceny pokoju (cena przy 100% = 0, więc pokój zapada bez miast); stolica nigdy nie jest oddawana; brak progu min. 3 miast (R-WEB-DIPLO-PEACE-PRICE-DECAY-WITH-WEARINESS-Q1) |

Przy 100% bez wyraźnie przegrywającego (remis sił) albo przy cenie pokoju 0 pokój zostaje zawarty bez oddania miast. Gdy trwa bitwa (`battlePending`), pokój wymuszony zostaje odroczony na następną turę. Pokój wymuszony dotyczy AI↔AI oraz gracza (para gracz↔AI w wojnie). Gracz dostaje natywne okno „Pokój wymuszony” oraz wpis w „Ważne”.

Bramki czasu ofert przegrywającego: tura 3 wojny po utracie miasta i tura 6 bez strat (`ofertaOdTurWojny`, `ofertaBezStratOdTur`).

Bramki czasu ofert przegrywającego to tura 3 wojny po utracie miasta i tura 6 bez strat (`ofertaOdTurWojny`, `ofertaBezStratOdTur`). W obecnym kodzie nie są pierwszym terminem: globalna blokada pokoju i rozejmu trwa pierwsze 10 pełnych tur wojny (`PEACE_PROPOSAL_MIN_WAR_TURNS`, `diplomacy-peace-proposal-timing.ts`). Tick AI↔AI (`war-weariness.ts`) wraca przed bramkami ofert, a propozycje AI do gracza przechodzą przez tę samą bramkę (`main.ts`, `peaceProposalIsTooEarly`). Pierwsza oferta przegrywającego może więc pojawić się najwcześniej w turze 10.

### Przegrywający

Przegrywający (udział siły 45% lub mniej) zaczyna oferować pokój, gdy jego **desperacja** rośnie (jest > 0 przy stopniu ≥ 1; progi stopni 0,25 / 0,45 / 0,65). Desperacja łączy zmęczenie, przewagę przeciwnika i straty miast, ale **nie zmienia już ceny ani liczby oddawanych miast**: stopień decyduje wyłącznie o tym, czy oferta w ogóle się składa.

Oferta to wyłącznie miasta (decyzja właściciela 2026-11-13) za **jedną cenę** `wearinessPeaceCashPn` (6000 PN × (1 − zmęczenie), decyzja 2026-11-17). Liczba oddanych miast = **minimum równoważące cenę** („nie więcej, nie mniej”); stolica nigdy. Gdy cena > 0, a przegrywający nie ma miast pokrywających ją w całości (np. tylko stolica), pokój nie zapada i wojna trwa (`war-weariness.ts`, `planCityPeacePayment`).

Po odrzuceniu oferty przegrywający czeka 3 tury, zanim złoży kolejną (cena się nie zmienia — maleje wyłącznie ze zmęczeniem).

### Ochrona przegrywającego

Przegrywający z małą liczbą miast (do 3) albo po wielu stratach (co najmniej 3 utraty w tej wojnie) jest **chroniony**: zwycięzca musi przyjąć jego ofertę pokoju, bez dalszych żądań miast. Przy pokoju wymuszonym przegrywający oddaje tyle miast, ile równoważy cenę; **chroniona jest wyłącznie stolica** (nigdy nie oddawana). Próg „co najmniej 3 miasta po oddaniu" został usunięty (kod: `cityCap = ownCities`, decyzja 2026-11-17 — brak minimum 3 miast). Chroniony dostaje dłuższą karencję.

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

Cena pokoju po wojnie maleje z poziomem zmęczenia pary: `cena = cenaStartPn × (1 − L)`, `cenaStartPn` = 6000 PN (`war-weariness-params.json:cenaPokoju`, funkcja `wearinessPeaceCashPn`). Na starcie wojny (L = 0) pokój kosztuje 6000 PN (ok. 3 miasta przegrywającego); przy L = 0,5 — 3000 PN; przy L = 1 (100%) — 0, czyli pokój zapada bez oddania miasta. Ta sama funkcja liczy cenę wszędzie: panel dyplomacji i audiencja, oferty AI dobrowolne (gracz↔AI), oferty AI↔AI oraz pokój wymuszony. Pozycja PW „Zmęczenie wojną” (krzywa kwadratowa) NIE jest już liczona w ofertach pokoju; zostaje tylko informacja o zmęczeniu. Reszta ceny do pokrycia to miasta przegrywającego (stolica nigdy; brak progu min. 3 miast). Bramka relacji ≤ 90 nadal daje cenę 0.

### Panel dyplomacji

Panel dyplomacji pokazuje zmęczenie wojną strony wygrywającej (lub remisu) i desperację strony przegrywającej, zarówno w wojnie gracz↔AI, jak i AI↔AI (`src/ui/diplomacyAudience.ts`, `AudienceWarWearinessView`).

**Jak czytać skalę:** zmęczenie wojną ma skalę 0–100%. 0% oznacza start wojny (brak zmęczenia), a 100% oznacza pokój wymuszony. Przy 50% strony chcą pokoju, przy 80% AI proponuje pokój z miastami, a przy 100% pokój zostaje wymuszony. Podpowiedź przy etykiecie podaje, za ile tur następny próg zostanie osiągnięty przy obecnym tempie (bez zmiany posiadania miast).

**Desperacja** (0–100%) dotyczy wyłącznie strony przegrywającej. Mówi, jak bardzo jest gotowa oddać miasta za pokój: decyduje tylko o tym, czy składa ofertę miast (nie wcześniej niż po 3 turach wojny; bez utraty miast dopiero po 6 turach). Nie wymusza pokoju; pokój wymuszony wynika wyłącznie z zmęczenia wojną na poziomie 100%.

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
| 3 | `war-weariness-params.json:przegrywajacy.cooldownOfertTur` |
| 3 | `war-weariness-params.json:przegrywajacy.ochronaMaxMiast` |
| 3 | `war-weariness-params.json:przegrywajacy.ochronaUtratyWojny` |
| 40 | `war-weariness-params.json:przegrywajacy.karencjaPoPokojuTur` |
| 100 | `war-weariness-params.json:przegrywajacy.karencjaChronionegoTur` |

---

## Historia / decyzje

Hasło zweryfikowane w kodzie 2026-11-13 (R-WEB-DIPLO-CIVPEDIA-Q1). Od 2026-11-14 (R-WEB-DIPLO-WEARINESS-AS-PW-PEACE-ITEM-Q1, decyzja właściciela) stary rabat ceny 60% został usunięty; zmęczenie działało jako pozycja PW (kwadratowa) — od 2026-11-17 (R-WEB-DIPLO-PEACE-PRICE-DECAY-WITH-WEARINESS-Q1) pozycja PW została usunięta, a zmęczenie obniża jedną cenę pokoju (`wearinessPeaceCashPn`). Krzywa kwadratowa wybrana przez właściciela; próg końca zmęczenia 0,8 potwierdzony 2026-11-14. Od 2026-11-17 (R-WEB-DIPLO-PEACE-PRICE-DECAY-WITH-WEARINESS-Q1) pozycja PW zmęczenia w ofertach pokoju zastąpiona jedną ceną malejącą z L (patrz „Cena pokoju od gracza”); wpisy o „615 PW” i „x²” powyżej są historyczne.

R-WEB-DOCS-CIVPEDIA-DIPLO-REDESIGN-Q1 (obrona, runda 2): próg końca zmęczenia 0,8 zamiast „100% wygasa”; bramki ofert 3/6 opisane jako nieosiągalne przed turą 10; panel dyplomacji opisany wg `diplomacyAudience.ts`. Akcja `mutual_peace` nie jest akcją gracza ani AI: to wynik ticku AI↔AI (`war-weariness.ts`, `runWarWearinessTick`) przy progu końca zmęczenia. Rozbieżności JSON wobec kodu (`_wzor` „100% wojna wygasa”, stopień 1 „złoto i surowce”) zgłoszone do orkiestratora.
