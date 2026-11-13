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

- **czas wojny**: 1 punkt na 20 tur wojny (5% na turę od startu wojny);
- **utracone miasta**: 0,10 na każde miasto, które zmieniło właściciela (obie strony).

Najwyższy osiągnięty poziom nie maleje (zapamiętany szczyt).

### Progi

| Próg | Wartość | Znaczenie |
|------|--------:|-----------|
| Chęć pokoju | 0,5 | od tego poziomu strony są skłonne do pokoju |
| Wyjście awaryjne (wzajemny pokój) | 0,8 | gdy przegrywający odrzucił co najmniej 3 oferty (`przegrywajacy.odrzuceniaDoKapitulacji`), zwycięzca przyjmuje to, co przegrywający realnie może zapłacić (`war-weariness.ts`, warunek `exhausted`) |
| Koniec zmęczenia (pokój bezwarunkowy) | 0,8 | od tego poziomu wojna kończy się pokojem bez miasta i bez zapłaty: AI↔AI natychmiast (tick), a AI proponuje taki pokój graczowi, gracz decyduje sam (`zmeczenie.progKoncaZmeczenia`, `wearinessUnconditionalEndDue`) |

Poziom 1,0 (100%) nie ma osobnego skutku: kod nie ma mechanizmu, który przy 100% wygasza wojnę. Próg końca zmęczenia to 0,8 (przy 16 turach bez zmian miast). Zapis „100% wojna wygasa” w `war-weariness-params.json` (`_wzor`) jest nieaktualny i zgłoszony osobno.

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

Gdy zmęczenie przekroczy 0,5, cena pokoju żądana przez AI od gracza spada: rabat może sięgnąć do 60% wartości (cena spada do 40%).

### Panel dyplomacji

Panel dyplomacji pokazuje zmęczenie wojną strony wygrywającej (lub remisu) i desperację strony przegrywającej, zarówno w wojnie gracz↔AI, jak i AI↔AI (`src/ui/diplomacyAudience.ts`, `AudienceWarWearinessView`).

---

## Przykład liczbowy

Wojna trwa 10 tur (10/20 = 0,5), utracono 2 miasta (2 × 0,10 = 0,2). Poziom = 0,7, czyli powyżej progu chęci pokoju 0,5. Po 16 turze bez zmian (16/20 = 0,8) silniejsza strona sama proponuje pokój bezwarunkowy.

---

## Poradnik‑L

→ `docs/PORADNIK-GRACZA/12-dyplomacja.md` §79.3

---

## Parametry

| Wartość | Skąd (plik:klucz) |
|--------:|-------------------|
| 20 | `war-weariness-params.json:zmeczenie.pelneTur` |
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
| 0.6 | `war-weariness-params.json:czlowiek.rabatCenyPokojuMax` |

---

## Historia / decyzje

Hasło zweryfikowane w kodzie 2026-11-13 (R-WEB-DIPLO-CIVPEDIA-Q1). Rozbieżność z dodatkiem: dodatek podawał, że cena pokoju spada „do 60%”; plik `war-weariness-params.json` (`rabatCenyPokojuMax` 0,6) daje spadek o do 60%, czyli do 40% ceny. Hasło podaje wartość z pliku.

R-WEB-DOCS-CIVPEDIA-DIPLO-REDESIGN-Q1 (obrona, runda 2): próg końca zmęczenia 0,8 zamiast „100% wygasa”; bramki ofert 3/6 opisane jako nieosiągalne przed turą 10; panel dyplomacji opisany wg `diplomacyAudience.ts`. Akcja `mutual_peace` nie jest akcją gracza ani AI: to wynik ticku AI↔AI (`war-weariness.ts`, `runWarWearinessTick`) przy progu końca zmęczenia. Rozbieżności JSON wobec kodu (`_wzor` „100% wojna wygasa”, stopień 1 „złoto i surowce”) zgłoszone do orkiestratora.
