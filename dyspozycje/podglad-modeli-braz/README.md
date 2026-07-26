# Podgląd modeli 3D — materiał do decyzji Macieja (2026-07-25, noc)

Zrzuty przeniesione z katalogu roboczego sesji do repo, **bo katalog roboczy znika razem z kontenerem**,
a to jest materiał do oceny wzrokowej.

## 1. Pięć modeli jednostek Brązu — NIEWPIĘTE, czekają na decyzję

`00-ogolny-7-modeli.png` — wszystkie obok siebie, kamera 52°, heksy stykające się bokami.
Zbliżenia: `01-…-wlocznik` · `02-…-miecznik` · `03-…-procarz` · `04-…-rydwan` · `05-…-hastati`
Odniesienie (modele JUŻ wpięte i zaakceptowane): `06-…-lucznik-nubijski` · `07-…-taran`

**Dlaczego to leży od rana:** modele istnieją w repo, ale żywy kod ich nie importuje, bo właściciel
ich nigdy nie widział — a wcześniejszą serię ocenił słowami „te grafiki wyglądają fatalnie, to jest
uwstecznienie". Bez oględzin nie wpinamy.

| Model | wysokość z bronią (× HEX_R) | maks. promień poziomy (× HEX_R) | stopy na y=0 | mesh | trójkąty |
|---|---|---|---|---|---|
| Włócznik (NOWY) | 0,999 | 0,321 | tak | 77 | 1228 |
| Miecznik (NOWY) | 0,759 | 0,329 | tak | 81 | 1204 |
| Procarz (NOWY) | 0,834 | 0,228 | tak | 100 | 1120 |
| Rydwan na wołach (NOWY) | 0,782 | 0,482 | tak | 108 | 1496 |
| Hastati (NOWY, epoka Żelaza) | 0,787 | 0,411 | tak | 92 | 1378 |
| Łucznik nubijski (ODNIESIENIE, wpięty) | 0,871 | 0,309 | tak | 84 | 1052 |
| Taran okuty (ODNIESIENIE, wpięty) | 0,641 | 0,331 | tak | 102 | 1600 |

Granica bezpieczna heksu to **0,866 × HEX_R** — żaden z siedmiu modeli nie wychodzi poza obrys
i żaden nie nachodzi na sąsiedni heks.

**Rekomendacja per model (ocena subagenta + weryfikacja integratora na zrzutach):**

| Model | Werdykt | Uzasadnienie |
|---|---|---|
| **Włócznik** | **wymaga poprawki** | włócznia trzymana pionowo sięga **0,999 × HEX_R** — najwyższy z całej siódemki, strzela ponad sąsiednie żetony. Integrator dodatkowo: **tarcza siedzi za nisko**, na wysokości bioder zamiast na ramieniu — czyta się jak zawieszona przy pasie, nie trzymana |
| **Miecznik** | nadaje się, drobny retusz | najmocniejszy z piątki: duża czytelna tarcza z niebieskim polem, złotym umbem i ćwiekami, hełm z ciemną kopułą. Pochwa miecza wizualnie „zwisa" przy nodze — pomiar potwierdza y=0, ale wygląda na odklejoną |
| **Procarz** | nadaje się | brak tarczy i hełmu jest historycznie uzasadniony (lekki procarz), ale sylwetka najmniej wyrazista z piątki — dominują beże, mało kontrastu. Proca w locie czytelna |
| **Rydwan na wołach** | nadaje się | dwa woły z jarzmem, wysoka plecionkowa skrzynia, kołczan oszczepów, woźnica widoczny. Najszerszy (0,482) i najcięższy (108 mesh), ale wpięty Taran ma podobnie (102/1600) — to cecha pojazdów, nie wada |
| **Hastati** | nadaje się, **ale inna epoka** | najlepszy model zestawu: potrójny pióropusz, czerwona tunika, duże scutum z bossem, pilum, gladius. To jednostka **epoki Żelaza**, świadomie zaparkowana poza bieżącym zakresem — osobna decyzja |

## 2. Kopalnia złota — WDROŻONA (commit `91f1f30`)
`kz-podglad.png` — cztery panele: para złoto/miedź, zbliżenie, sektor mapy, zbliżenie na szyb.
`kz-skala-mapy.png` — **render 200×200 px, czyli tyle pikseli, ile pole naprawdę dostaje w grze**.
To był twardy warunek akceptacji: model ma czytać się jako ZŁOTO w skali mapy, nie na zbliżeniu.
Pierwsza wersja go nie spełniała (dominowały biały kwarc i cyjan wody) — poprawiona w rundzie KOR-1.

## 3. Odznaki ulepszeń na żetonach — WDROŻONE (commit `f573fc1`)
`odznaki-v2.png` — trzy panele: przegląd poziomów, zbliżenie „maksymalne ulepszenie vs weteran"
(dowód rozróżnialności), zbliżenie na poziomy I/II/III.
Kropki przy podstawie żetonu, gwiazdki weterana nad głową — dwa niezależne systemy, zero pomyłki.
