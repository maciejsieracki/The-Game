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
| Wzajemny pokój | 0,8 | przy takim zmęczeniu pokój może być zawarty bez dodatkowych warunków |
| Koniec wojny | 1,0 | po 20 turach wojny bez zmian miast poziom dochodzi do 100% i wojna wygasa (`zmeczenie.pelneTur = 20`) |

Pierwsze oferty przegrywającego mogą pojawić się od tury 3 wojny po utracie miasta, a bez utraty miast od tury 6 (`ofertaOdTurWojny`, `ofertaBezStratOdTur`).

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
