# SPEC: Danina, Podatek i Handel — przebudowa ekonomii
Zatwierdzone przez Macieja 2026-07-25. **Do wdrożenia jednym spójnym przejściem.**

## MYŚL PRZEWODNIA (słowa właściciela)
> „My tak naprawdę pobieramy podatek z pracy od ludzi. Część idzie w postaci pracy wykonywanej na rzecz
> cywilizacji — i to jest Praca. A część w postaci dóbr materialnych. Tego nie powinniśmy nazywać handlem,
> tylko **daniną**. Tę daninę dopiero przeznaczamy na badania, skarbiec, a część możemy oddać społeczeństwu,
> zwiększając jego zamożność. **Handel odbywa się pomiędzy cywilizacjami**, a w terenie pobieramy daninę.
> Po wprowadzeniu pieniądza, czyli kiedy budujemy Mennicę, **danina zmienia się w podatek**, bo mamy pieniądz,
> który można opodatkować."

Uzasadnienie historyczne: gospodarki przedmonetarne nie handlowały z własnymi poddanymi — ściągały daninę
w naturze i w robociźnie. Dopiero bita moneta pozwala opodatkować obieg pieniądza.

## PYTANIE 65 = B — pełna zmiana nazwy
`Handel` → `Danina` **wszędzie**: interfejs, Civpedia, poradnik, **nazwy pól w kodzie, klucze w danych**.
Uwaga na klucze zapisu gry — zmiana nazw pól wymaga migracji albo obsługi obu wariantów przy wczytywaniu.

## PYTANIE 66 = B — Danina staje się Podatkiem na poziomie CYWILIZACJI
Warunek: technologia **Waluta** odkryta **oraz** **Mennica zbudowana w stolicy**.
Wtedy nazwa zmienia się **we wszystkich miastach naraz**, nie per miasto.

**Doprecyzowanie po decyzjach 70 i 71 (Maciej 2026-07-25):** Mennica jest budowalna **wyłącznie w stolicy**
i jest jedna na cywilizację, więc warunek „pierwsza Mennica gdziekolwiek" sprowadza się do „Mennica w stolicy".
Mnożnik działa **w całym imperium** (71 = A), więc przełączenie nazwy w całej cywilizacji jest z tym spójne:
tam, gdzie działa mnożnik monetarny, strumień nazywa się **Podatkiem**; zanim powstanie Mennica — **Daniną**.

**Podsumowanie cyklu życia strumienia:**
| Etap | Nazwa | Warunek |
|---|---|---|
| Przed Walutą albo przed Mennicą | **Danina** | domyślnie |
| Waluta odkryta **i** Mennica w stolicy | **Podatek** | w całej cywilizacji, we wszystkich miastach |
| Dochód ze szlaków handlowych | **Handel** | zawsze osobno, poza pulą (68 = A) |

## PYTANIE 67 = B — plony pieniężne budynków wpadają do puli Daniny
**Właściciel nazwał dotychczasowy stan „bardzo dużym błędem".** Dziś 16 budynków daje pieniądz **prosto
do skarbca**, z pominięciem suwaka — razem **44 pkt/turę** w wartościach bazowych. Największe: Port wielki 10,
Port handlowy 5, Wielka Kuźnia 5, Targowisko 3, Mennica 3, Pretorium 3.
Po zmianie cały ten strumień wchodzi **do puli Daniny przed podziałem suwakiem**.

Skutki (zamierzone): suwak zyskuje realną wagę · znika niespójność progu utrzymania Zamożności (liczył się
od całego pieniądza miasta, a suwak dzielił tylko część) · mnożnik Waluty i Mennicy obejmie też budynki ·
skarbiec chwilowo spadnie (przy domyślnym 70% z 44 pkt do kasy trafi ok. 31).

## PYTANIE 68 = A — szlaki handlowe to „Handel", pokazywany OSOBNO
Dochód z tras handlowych zachowuje nazwę **Handel** i jest prezentowany oddzielnie od Daniny.
Gracz ma widzieć, ile bierze od swoich, a ile zarabia na obcych. Dochód ze szlaków **nie wchodzi** do puli Daniny
i **nie podlega** mnożnikowi Waluty i Mennicy (dziś też jest doliczany po mnożniku Zamożności — to zostaje).

## PYTANIE 72 = A — sufit suwaka Zamożności podniesiony z 70% na 100%
Cała nowa siatka Szczęścia ma być osiągalna. Gracz może oddać społeczeństwu wszystko: +8 Szczęścia
na normalnym, zero nauki i zero pieniędzy. To uczciwy skrajny wybór, symetryczny do kary za skrajną chciwość.

## NOWA SIATKA SZCZĘŚCIA od udziału Zamożności (Maciej 2026-07-25)
Co 10 punktów procentowych — jeden punkt Szczęścia. Normalny startuje o 2 niżej niż łatwy, trudny o 3.

| Udział Zamożności | Łatwy | Normalny | Trudny |
|---|---|---|---|
| 0–9% | +1 | **−1** | −2 |
| 10–19% | +2 | **0** | −1 |
| 20–29% | +3 | **+1** | 0 |
| 30–39% | +4 | **+2** | +1 |
| 40–49% | +5 | **+3** | +2 |
| 50–59% | +6 | **+4** | +3 |
| 60–69% | +7 | **+5** | +4 |
| 70–79% | +8 | **+6** | +5 |
| 80–89% | +9 | **+7** | +6 |
| 90–100% | **+10** | **+8** | +7 |

**Nowość: kara.** Dziś minimum to zero — nie da się stracić Szczęścia przez zbyt wysokie podatki.
Teraz poniżej 10% na normalnym kosztuje punkt, na trudnym dwa.

**Domyślne ustawienie gry (20% Nauka / 70% Skarbiec / 10% Zamożność) wypada na zero na normalnym
i −1 na trudnym.** Do rozważenia zmiana domyślnego podziału — osobna decyzja, nie wdrażać bez pytania.

## ZWIĄZEK Z PROGIEM UTRZYMANIA ZAMOŻNOŚCI
Próg utrzymania poziomu Zamożności zaczyna się od **20% pieniądza miasta** (poziom 0) i rośnie do **40%**
przy maksimum. To wypada dokładnie tam, gdzie w nowej siatce zaczyna się dodatnie Szczęście — poniżej 20%
gracz traci na obu frontach naraz, powyżej zyskuje na obu. Granica jest dobra, nie ruszać.

## POZOSTAJE DO ROZSTRZYGNIĘCIA (pytania 69–71)
- **69** — mnożniki cywilizacyjne `mnoznikHandelPieniadz` (1,7–2,6, każda z 15 cywilizacji ma własny)
  **nadpisują** regułę trudności 2 / 1,5 / 1, czyniąc ją martwą.
- **70** — czy Mennica tylko w stolicy i jedna na cywilizację.
- **71** — czy mnożnik działa w całej cywilizacji, czy tylko w mieście z Mennicą.
