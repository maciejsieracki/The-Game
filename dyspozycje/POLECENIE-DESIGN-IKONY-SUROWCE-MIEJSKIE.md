# POLECENIE DLA DESIGNERA — ikony surowców produkowanych w mieście

**Kontekst (Maciej 2026-07-24):** Design zrobił dedykowane ikony tylko dla surowców
**terenowych** (drewno, kamień, glina, ruda, sól, koń). Surowce **produkowane w mieście**
(przez konwertery) nie mają własnych ikon — dziś dzielą cudze (metale → `res-iron`, cegła → `res-clay`),
przez co w pasku „ikona + liczba" są nierozróżnialne. Trzeba dorobić **4 ikony**.

## DO ZROBIENIA — 4 nowe ikony

| Surowiec | Nazwa pliku | Koncept wizualny (propozycja) |
|---|---|---|
| **Cegła** | `res-cegla.svg` | Cegła / dwie ułożone cegły z linią spoiny. Wyraźnie inna niż Glina (dziś dzielą `res-clay` — glina to dzban). |
| **Brąz** | `res-braz.svg` | Sztabka/wlewek brązu (trapez „ingot"), ewentualnie z subtelnym połyskiem. Ciepły odcień. |
| **Żelazo** | `res-zelazo.svg` | Sztabka/wlewek żelaza (prosty prostopadłościan-ingot) lub kowadło. Wyraźnie inne niż Ruda żelaza (bryła rudy). |
| **Stal** | `res-stal.svg` | Sztabka stali z iskrą/refleksem, albo skrzyżowane pręty stalowe. Chłodny, „stalowy" charakter. |

## SPECYFIKACJA TECHNICZNA (dopasować 1:1 do istniejących `res-*`)

Wzorzec: `gra/src/ui/icons/brand/resources-map/res-wood.svg`, `res-stone.svg`, `res-clay.svg`, `res-iron.svg`.

- **Format:** SVG, `viewBox="0 0 24 24"`, `width="24" height="24"`.
- **Styl:** `fill="none"`, `stroke="#e8d88a"` (złoto), `stroke-width="1.5"` (dopuszczalne 1.4), `stroke-linecap="round"`, `stroke-linejoin="round"`.
- **Charakter:** minimalistyczna linia, jednolita grubość, bez wypełnień/gradientów — czytelna przy **22–30 px** (pasek HUD/miasto) i w medalionie.
- **Ważne:** każda z 4 musi być **jednoznacznie rozróżnialna** od pozostałych i od terenowych (zwłaszcza Cegła≠Glina, Żelazo≠Ruda żelaza, Brąz≠Ruda miedzi, Stal≠Żelazo). To jest cel tego zadania.
- Lokalizacja plików: `gra/src/ui/icons/brand/resources-map/`.

## PO DOSTARCZENIU (robi integrator, nie Design)
Dopisać mapowanie w `gra/src/ui/icons/brand/resources-map-icon-map.json`:
`"cegła"/"cegla" → res-cegla`, `"brąz"/"braz" → res-braz`, `"żelazo"/"zelazo" → res-zelazo`, `"stal" → res-stal`
(dziś wskazują na `res-clay`/`res-iron`). Wtedy interimowe odróżnianie kolorem w mockupie znika — będą prawdziwe symbole.

## Referencja stylu (istniejące, do naśladowania)
`res-wood` = pień z gałązkami · `res-stone` = bryła kamienia · `res-clay` = dzban · `res-iron` = sześciokątna bryła rudy z „×".
