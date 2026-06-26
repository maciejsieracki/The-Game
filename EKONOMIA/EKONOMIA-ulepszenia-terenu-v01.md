# EKONOMIA — Ulepszenia terenu v0.1
Data: 2026-06-25 | Lane: EKONOMIA | Plik docelowy: `gra/data/terrain-improvements.json`

## Co zrobiono
Wypełniono `terrain-improvements.json` o:
1. Pole `surowiecOdblokowany` (klucz ASCII lub null/tablica) — dla każdego ulepszenia, wg modelu dostępu boolean v0.1.
2. Pole `zasieg_terytorium` — dla posterunek (=5) i fort (=10), obok istniejącego `zasieg_pol`.
3. Zaktualizowano `_meta` — dodano sekcje `decyzje_EKONOMIA` i `klucze_surowcow_ASCII`.
4. Backup: `terrain-improvements.json.bak-EKONOMIA` (przed zmianami).
5. Nota `_miasto_zasieg_ref` — informacja że miasto = zasieg_terytorium=10 (stałe), dynamika pop w helper `okolica.cityRangeForPopulation`.

## Lista ulepszeń (15 wpisów)

| id | Nazwa | Epoka | bonus{} | surowiecOdblokowany | koszt_praca |
|---|---|---|---|---|---|
| farma | Farma | 1 | zywnosc+1 | null | 20 |
| irygacja | Irygacja | 2 | zywnosc+2 | null | 30 |
| pastwisko | Pastwisko/zagroda | 1 | zywnosc+1, praca+1 | [bydlo, owce, lama, kon] | 20 |
| kopalnia | Kopalnia | 1 | praca+2 | ruda | 25 |
| glinianka | Glinianka | 2 | praca+1 | glina | 20 |
| kamieniolom | Kamieniołom | 1 | praca+1, kamien+1 | kamien | 22 |
| oboz_lowiecki | Obóz łowiecki | 1 | zywnosc+1, pieniadz+1 | null | 18 |
| wyrab | Wyrąb (obóz leśny) | 1 | praca+1, drewno+1 | drewno | 20 |
| tarasy | Tarasy uprawne | 2 | zywnosc+2 | null | 25 |
| lodzie_rybackie | Łodzie rybackie | 1 | zywnosc+2 | null | 20 |
| plantacja | Plantacja | 2 | handel+2 | luksus | 22 |
| warzelnia_soli | Warzelnia soli | 2 | pieniadz+1, zywnosc+1 | sol | 20 |
| fort | Fort / umocnienia | 3 | {} (+100% obrona) | null | 25 |
| droga | Droga | 1 | handel+1 | null | 15 |
| posterunek | Posterunek (Strażnica) | 2 | {} (+50% obrona) | null | 30 |

## Zasięgi terytorium (dyspozycja EKONOMIA 2026-06-25)

| Struktura | zasieg_terytorium | Epoka |
|---|---|---|
| posterunek | 5 | 2 (Brąz) |
| fort | 10 | 3 (Żelazo) |
| miasto | 10 (stałe) | — |

Miasto dynamiczne: helper `okolica.cityRangeForPopulation` → r5 (pop<5), r10 (pop≥5), r15 (pop≥10).
Zasieg_terytorium=10 to wartość bazowa/startowa dla zasiedlania kolejnych miast (wymagane: Strażnica LUB zasięg obecnego miasta).

## Uzasadnienie wartości bonusów

- **farma** (+1 zywnosc): bazowy, tani (epoka 1), bez wymagań poza Rolnictwem.
- **irygacja** (+2 zywnosc): silniejsza, ale tylko przy rzece i epoka 2 — logiczne że droższa i mocniejsza.
- **pastwisko** (+1 zywnosc +1 praca): hodowla = podwójny efekt (jedzenie + praca), odblokowuje surowce zwierzęce.
- **kopalnia** (+2 praca): wydobycie = główne źródło Pracy w górach; +2 bo teren trudny.
- **glinianka** (+1 praca): mniejsza niż kopalnia bo glina = wejście do produkcji przetworzonej, nie bezpośrednia.
- **kamieniolom** (+1 praca +1 kamien): bonus w naturze (kamien jako zasób Boolean) + mała praca; 2 efekty = koszt 22.
- **oboz_lowiecki** (+1 zywnosc +1 pieniadz): łowiectwo = jedzenie + handel (futra, skóry); bez odblokowywania surowca.
- **wyrab** (+1 praca +1 drewno): wycinka = drewno Boolean + praca fizyczna; usuwa las (zmiana terenu = MAPA).
- **tarasy** (+2 zywnosc): unikalny Inkowie na wzgórzach; +2 jak irygacja ale na trudnym terenie.
- **lodzie_rybackie** (+2 zywnosc): ryby = bogaty zasób morski, epoka 1 (Żegluga przybrzeżna).
- **plantacja** (+2 handel): luksus = dochód handlowy, nie plon; epoka 2.
- **warzelnia_soli** (+1 pieniadz +1 zywnosc): sól = konserwacja (zywnosc) + handel (pieniadz).
- **droga** (+1 handel): każda droga = +handel tranzytowy; ruch = SILNIK/MAPA.
- **posterunek** (zasieg_terytorium=5, +50% obrona): rozszerzenie terytorium + punkt obrony.
- **fort** (zasieg_terytorium=10, +100% obrona): silna baza wojskowa, epoka Żelaza.

## ROZBIEZNOSCI KLUCZY z resources.json — do uzgodnienia z DANE

resources.json jest tablicą obiektów BEZ pola `id`. Klucze ASCII użyte w `surowiecOdblokowany` to propozycja EKONOMIA.

| Klucz EKONOMIA | Odpowiednik w resources.json | Status |
|---|---|---|
| `ruda` | Surowiec: "Ruda" | OK semantycznie; wymaga pola id w resources.json |
| `glina` | Surowiec: "Glina" | OK semantycznie |
| `kamien` | Surowiec: "Kamień" | OK semantycznie; UWAGA: `kamien` też w bonus{} jako efekt plonu — semantyczna dwuznaczność |
| `drewno` | Surowiec: "Drewno" | OK semantycznie; UWAGA: `drewno` też w bonus{} jako efekt plonu — semantyczna dwuznaczność |
| `bydlo` | Surowiec: "Bydło (krowa/wół)" | Klucz skrócony; wymaga uzgodnienia |
| `owce` | Surowiec: "Owce" | OK |
| `lama` | Surowiec: "Lama" | OK |
| `kon` | Surowiec: "Koń" | Klucz bez ogonka — wymaga uzgodnienia |
| `sol` | BRAK w resources.json | Sol nie jest wpisana — DANE powinno dodać |
| `luksus` | BRAK w resources.json | Luksus jako typ zbiorczy — DANE decyduje: 1 klucz czy osobne (winogrona/oliwki/przyprawy) |

### Decyzje potrzebne od DANE
1. Dodać pole `id` (ASCII) do każdego wpisu w `resources.json` — inaczej silnik nie może łączyć kluczy.
2. Zdecydować: `bonus.kamien` i `bonus.drewno` = liczba (efekt plonu) czy boolean (dostęp)? Aktualnie są liczbą — sprzeczność z modelem dostępu.
3. Dodać `sol` do resources.json (typ: surowy, źródło: złoże Soli).
4. Zdecydować o kluczach luksusów: 1 klucz `luksus` zbiorczy (prostsze) vs osobne wpisy.
