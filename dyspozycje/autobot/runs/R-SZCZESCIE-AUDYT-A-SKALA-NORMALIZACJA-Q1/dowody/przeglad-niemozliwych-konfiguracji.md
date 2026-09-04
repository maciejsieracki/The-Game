# Przegląd wszystkich konfiguracji budynków w bramce — runda 2

Kryterium przeglądu: kombinacje budynków niemożliwe do osiągnięcia w grze.
Znalezione trzy niezależne klasy niemożliwości (nie jedna).

## Klasy niemożliwości i ich źródło w danych/kodzie

| # | Klasa | Dowód |
|---|---|---|
| 1 | **Ten sam łańcuch zastępowania** — Dom Starszyzny → Dwór Zarządcy → Pretorium | `buildings.json`: `pretorium.upgradeFrom = "dwor_zarzadcy"`, `dwor_zarzadcy.upgradeFrom = "dom_starszyzny"` |
| 2 | **Stolica vs region** — Pałac I/II/III wyklucza się z całym łańcuchem administracji lokalnej | `buildings.json`: `palac*.lokalizacja = "stolica"`, `dom_starszyzny`/`dwor_zarzadcy`/`pretorium` `.lokalizacja = "region"`; `production.ts:489-490` `buildingLocationAllowed` → `isCapital === true` / `isCapital === false` |
| 3 | **Budynek przed swoją epoką** | `buildings.json`: `epokaWejscia` — Trybunał 2; Pałac III, Pretorium, Sąd 3 |

Poza tym `main.ts:28911` nakłada `brakGarnizonuKara` wyłącznie przy `population >= 6`.

## Wynik przeglądu, sekcja po sekcji

| Sekcja bramki | Konfiguracja | Werdykt |
|---|---|---|
| 1 (GOAL 1, równoważność) | brak budynków Prawa; Sz tylko `buildingZadowolenie` | czysto |
| 2 (fallback) | brak budynków | czysto |
| 3 (monotoniczność) | sam próg, bez budynków | czysto |
| 4 (ciągłość, siatka 7680 profili) | `palacTier ∈ {null,1,2,3}` × `hasSad: b>=14` × `hasPretorium: b>=20`, ery 1,2,3,4,9 | **NARUSZA klasy 1(nie), 2 i 3** — patrz niżej |
| 5 / 5b (neutralność, cap) | brak budynków | czysto |
| 6 (zrzut właściciela) | pop 2, brak budynków Prawa | czysto |
| 7 (objaw capu 120%) | `palacTier: 3` + garnizon, epoka 3; Świątynia + Amfiteatr | czysto (sama stolica, epoka zgodna) |
| 8 (tabela progu) | sam próg | czysto |
| 9 (osiągalność) | **`palacTier: 3` + `hasPretorium` + `hasDworZarzadcy` + Sąd + Trybunał, epoki 1-3** | **NARUSZA klasy 1, 2 i 3 naraz — NAPRAWIONE w tej rundzie** |

## Sekcja 9 — naprawa

Stara asercja twierdziła: „duże miasto z pełną administracją domyka Prawo do 100%
we wszystkich epokach, na każdej trudności". Trzymała się wyłącznie dlatego, że
sumowała punkty Prawa z trzech wykluczających się źródeł naraz (Dwór 33 + Pretorium 38
+ Pałac III 55 na normal).

Zastąpiona dwoma **rozłącznymi** wariantami miasta, w każdym administracja faktycznie
dostępna w danej epoce, z wartościami przeliczonymi, nie przepisanymi:

- stolica: e1 Pałac I; e2 Pałac II + Trybunał; e3 Pałac III + Trybunał + Sąd
- region: e1 Dom Starszyzny; e2 Dwór Zarządcy + Trybunał; e3 Pretorium + Trybunał + Sąd

Pop 12, garnizon 5 (cap: easy/normal 5, hard 4). `netto / prawMax = PrawPct`:

| wariant | trudność | epoka 1 | epoka 2 | epoka 3 |
|---|---|---|---|---|
| stolica | easy | 170/69 = **100%** | 205/103,5 = **100%** | 243/138 = **100%** |
| stolica | normal | 135/74,5 = **100%** | 162/111,75 = **100%** | 191/149 = **100%** |
| stolica | hard | 88/80,5 = **100%** | 109/120,75 = **90,3%** | 133/161 = **82,6%** |
| region | easy | 161/69 = **100%** | 190/103,5 = **100%** | 222/138 = **100%** |
| region | normal | 128/74,5 = **100%** | 150/111,75 = **100%** | 174/149 = **100%** |
| region | hard | 82/80,5 = **100%** | 99/120,75 = **82%** | 120/161 = **74,5%** |

Wniosek, który te liczby faktycznie niosą: próg **wymaga** administracji, ale jej nie
odcina — easy i normal nadal domykają Prawo do 100% w obu wariantach i we wszystkich
epokach; hard już nie (min 74,5%), i to jest zamierzona różnica trudności, a nie regres.

### Uwaga do liczby 91,9% z Final Control

Nie odtwarza się z konfiguracji opisanej w werdykcie („Pretorium + Sąd + Trybunał +
garnizon + Pałac III"), która daje 100% (netto 164 / prawMax 161). 91,9% wychodzi
dokładnie dla tego samego zestawu **bez Sądu** (60+31+13+44 = 148 / 161 = 91,9%).
Tak czy inaczej ta konfiguracja sama łamie klasę 2 (Pałac III + Pretorium), więc nie
została użyta jako wartość oczekiwana.

## Sekcja 4 — znaleziona, ŚWIADOMIE NIE ruszona

Siatka 7680 profili łączy `palacTier` z `hasPretorium` (klasa 2) i stawia Sąd/Pretorium/
Pałac II-III w epokach wcześniejszych niż ich `epokaWejscia` (klasa 3). Oba najgorsze
profile, które bramka drukuje, są niemożliwe:
`hard/e1/14 bud./palac 2` (Pałac II i Sąd w epoce 1) oraz `hard/e2/26 bud./palac 1`
(Pałac + Pretorium + Sąd w epoce 2).

**Nie zmieniono jej w tej rundzie z konkretnego powodu:** to jest siatka, z której
pochodzi liczba 12,0 p.p. będąca treścią zarzutu 1 — `DECISION_REQUIRED` u właściciela.
Zawężenie siatki zmieniłoby liczbę, o której właściciel właśnie decyduje. Zmierzono ją
więc tylko na boku, bez dotykania bramki:

| siatka | profili | DODATKOWY spadek max | WŁASNY WKŁAD max (limit 8 p.p.) |
|---|---|---|---|
| superset (obecna bramka) | 7680 | 12,0 p.p. — `hard/e1/14 bud./palac 2/pop 4→5` | 5,4 p.p. |
| tylko możliwe | 4176 | **10,0 p.p.** — `easy/e1/5 bud./palac 1/pop 4→5` | **5,0 p.p.** |

**Urwisko pop 4→5 NIE jest artefaktem niemożliwych profili** — przeżywa zawężenie
(12,0 → 10,0 p.p.), a samo urwisko sprzed tematu jest tam nawet większe (16,8 p.p.).
Zarzut 1 jest realny; ta tabela jest wkładem do decyzji właściciela, nie jej wyprzedzeniem.

Siatka-superset jest przy tym bezpieczna kierunkowo: asercje sekcji 4 są górnymi
ograniczeniami (`max < limit`), więc nadzbiór profili czyni je surowszymi, nie luźniejszymi.
Zawężenie siatki proponuję jako osobną pozycję po rozstrzygnięciu zarzutu 1.
