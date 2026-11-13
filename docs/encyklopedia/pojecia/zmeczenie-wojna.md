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

Poziom wynosi od 0 do 1 i sumuje trzy składniki:

- **czas wojny**: 1 punkt na 200 tur wojny;
- **utracone miasta**: 0,03 na każde miasto utracone przez obie strony;
- **stagnacja**: od 30 tur bez zmian miast rośnie do 0,3 (przy 100 turach stagnacji).

Najwyższy osiągnięty poziom nie maleje (zapamiętany szczyt).

### Progi

| Próg | Wartość | Znaczenie |
|------|--------:|-----------|
| Chęć pokoju | 0,5 | od tego poziomu strony są skłonne do pokoju |
| Wzajemny pokój | 0,8 | przy takim zmęczeniu pokój może być zawarty bez dodatkowych warunków |

### Przegrywający

Przegrywający (udział siły 45% lub mniej) zaczyna oferować pokój, gdy jego **desperacja** rośnie. Desperacja łączy zmęczenie, przewagę przeciwnika i straty miast. Ma trzy stopnie:

| Stopień | Co oferuje |
|--------:|-----------|
| 1 | złoto i surowce |
| 2 | złoto, surowce i jedno miasto |
| 3 | złoto, surowce i do dwóch miast |

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

Wojna trwa 100 tur (100/200 = 0,5), utracono 2 miasta (0,06) i nie zmienia się nic przez 40 tur (stagnacja 0,3 × 10/100 = 0,03). Poziom = 0,59, czyli powyżej progu chęci pokoju 0,5.

---

## Poradnik‑L

→ `docs/PORADNIK-GRACZA/12-dyplomacja.md` §79.3

---

## Parametry

| Wartość | Skąd (plik:klucz) |
|--------:|-------------------|
| 200 | `war-weariness-params.json:zmeczenie.pelneTur` |
| 0.03 | `war-weariness-params.json:zmeczenie.wagaStratMiasta` |
| 30 | `war-weariness-params.json:zmeczenie.stagnacjaOdTur` |
| 0.3 | `war-weariness-params.json:zmeczenie.stagnacjaWaga` |
| 100 | `war-weariness-params.json:zmeczenie.stagnacjaSkalaTur` |
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
