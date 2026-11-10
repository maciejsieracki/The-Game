# R-WEB-POLISH-LANGUAGE-AUDIT-Q1 — Operator LunaHigh, runda 3

STATUS: WYKONANO ograniczoną naprawę znanych problemów językowych kart jednostek; oczekuje na niezależną weryfikację. Audyt całego UI/CIVPEDII pozostaje CZĘŚCIOWY.
DATA: 2026-11-10
MODEL: LunaHigh (handover)
ZAKRES: wyłącznie zatwierdzona runda 3 z `00-dispatch.md`; bez zmian mechaniki, liczb, kluczy, innych kart/źródeł, builda, browsera ani commitów.

## Inwentarz i podstawa językowa

Przeskanowałem bieżące teksty wszystkich wypełnionych pól `Top3` w `gra/data/units.json` pod kątem nazw klas używanych jako etykiety lub w zdaniach. Surowe wystąpienia: `Spearman` — 21, `Mount` — 15, `Swordsman` — 4, `Distance` — 12, `Slinger` — 12, `Offensive` — 3; `Falangite` — 0. Liczby obejmują `tytul` i `tekst` i są stanem przed warstwową prezentacją. Nie dodano martwego mapowania Falangite.

Dobór słownictwa opiera się na użyciu w tych samych danych: `units.json:374` używa „włócznicy” i „włóczników”; `:448` opisuje „formacje mieczników”; `:78` określa użytkownika procy jako „procarza” i nazywa oddziały „procarzami”; `:134` ma termin „jednostka dystansowa”; `:1100` łączy lekkie jednostki dystansowe i procarzy; `:1466` używa opisu „piechota ofensywna”. Dla Mount dane mówią o „jednostkach konnych” i „kawalerii” (np. `units.json:430–434`, `:1244–1252`). To istniejące określenia klas/rodzajów jednostek, nie nowe nazwy własne ani interpretacje mechaniki.

## Wdrożone

- `gra/src/ui/entityCards/unitAdapter.ts:93` rozszerza lokalny formatter prezentacji Top3 o faktycznie występujące rodziny nazw: `Swordsman`, `Distance`, `Slinger`, `Offensive`, `Spearman` i `Mount`. Obsługuje również obecne zlepione warianty i zdania (`Podwójny bonus: Spearman… i Mount…`, `Offensive… Distance i Slinger…`, `Bonus vs Distance/Slinger`, „Awans na Spearman”, wzmianki o typie Spearman i „formacji spearmanów”). Etykiety i zdania dostają polskie odpowiedniki: miecznicy, jednostki dystansowe, procarze, jednostki ofensywne, włócznicy oraz jednostki konne/konni. Formatter działa wyłącznie na wierszach Top3 w widoku jednostki.
- Surowe tytuły, teksty, liczby, klucze i układ danych Top3 w `units.json` pozostają zachowane. Nieznane etykiety przechodzą bez zmian. Do wspólnego resolvera nazw nie dopisano danych, ponieważ jego istniejący zakres dotyczy identyfikatorów terenu/zasobów/ulepszeń, a nie wolnych zdań Top3.
- `gra/data/units.json:5184` poprawia w historii iButho „dzirot kolący” na „krótka, ciężka włócznia kłująca”. Dowód jest wewnątrz aktualnych materiałów gry: rekord iButho ma klasę `Spearman` oraz uwagę „iklwa + tarcza”; historia Impi w `units.json:1243` mówi o zastąpieniu długiego oszczepu „krótką, ciężką włócznią kłującą iklwa”; `docs/encyklopedia/jednostki/impi.md:69` powtarza tę nazwę, a `:34` identyfikuje uzbrojenie jako włócznię. Zmiana naprawia nieistniejące słowo i zgodę przymiotników, nie dodaje nowych twierdzeń o konstrukcji.
- `gra/tools/unit-top3-player-language-test.cjs:1` sprawdza rzeczywisty adapter i renderer w DOM. Kontrolowany wiersz obejmuje zatwierdzone mapowania, kombinacje, zachowanie `UnknownLabel` i brak mutacji Top3. Następnie test renderuje każdą z 75 niepustych sekcji Top3 z danych i wykrywa, czy pozostały surowe etykiety z mapowanych rodzin. Test sprawdza także widok historii iButho.

## Kontrole

- `node gra/tools/unit-top3-player-language-test.cjs` — PASS: wszystkie 75/75 sekcji Top3 wyrenderowano; nie wykryto nieprzetłumaczonych tokenów z zatwierdzonych rodzin; nieznana etykieta i dane źródłowe zachowane; historia iButho pokazuje wsparty termin.
- Inwentarz Top3 potwierdził zero wystąpień `Falangite`; brak mapowania.
- Wynik dotyczy wyłącznie obecnych tekstów kart jednostek Top3 i dwóch wcześniej potwierdzonych wpisów historii; nie jest twierdzeniem o wyczerpującym audycie pozostałych tras UI, CIVPEDII lub poradników.

## Granice

Nie zmieniałem innych polskich treści ani nieweryfikowanych terminów. PL-02 zostało naprawione w zakresie oczywistego błędu leksykalnego/zgody, na podstawie zgodnego źródła w samej grze; pozostałe partie broni nie były oceniane. Zewnętrzny audyt całego zakresu zgłoszenia nadal jest częściowy.
