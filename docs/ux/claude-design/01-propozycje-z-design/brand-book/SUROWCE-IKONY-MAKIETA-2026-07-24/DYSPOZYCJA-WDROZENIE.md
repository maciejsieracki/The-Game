# DYSPOZYCJA — PACZKA „SUROWCE-IKONY-MAKIETA" (2026-07-24)
Odpowiedź na zgłoszenie z mockupów gry: „Ikony miejskich surowców (cegła/brąz/żelazo/stal) interimowe — do dorobienia przez Design" + brakująca makieta zakładki surowców.

## KROK 1 — Ikony (v2 — kształty + wyjątek kolorystyczny Macieja) → `.../brand-book/KANON/eksport/`
| Plik | Surowiec | Rysunek · kolor kreski (obwódka medalionu zostaje złota) |
|---|---|---|
| icons/resources-map/res-wood.svg | Drewno | pieniek podłużny (słoje) · złoto #e8d88a |
| icons/resources-map/res-stone.svg | Kamień | 2 kostki jedna na drugiej · BIAŁY #e8e4d8 |
| icons/resources-map/res-brick.svg | Cegła | kostka 3D · CZERWONY #d47a55 |
| icons/resources-map/res-copper-ore.svg | Ruda miedzi | 2 grudki · POMARAŃCZOWY #e8a050 |
| icons/resources-map/res-iron-ore.svg | Ruda żelaza | 3 grudki · SREBRNY #c8ccd4 |
| icons/resources-map/res-bronze.svg | Brąz | sztabka-ingot · ZIELONY (patyna) #7ad0a0 |
| icons/resources-map/res-iron.svg | Żelazo | TA SAMA sztabka co brąz · SREBRNO-SZARY #b8bec8 |
| icons/resources-map/res-steel.svg | Stal | podłużna płaska sztabka · SZARY #9aa2ae |
| icons/resources-map/res-ceramics.svg | Ceramika | amfora z uchami · złoto (bez zmian) |
+ `resource-icon-map.json` — id surowca gry → ikona + nota wyjątku kolorystycznego
+ `resources-preview.html` — podgląd kompletu
UWAGA: to świadomy WYJĄTEK od zasady „ikony tylko złote" — dotyczy WYŁĄCZNIE surowców fizycznych (rozróżnialność metali/materiałów); glina/sól/koń/bydlo/złoto/ceramika zostają złote.

## KROK 2 — Makieta → `.../brand-book/KANON/mockupy/`
`The Game - Surowce magazyn i formy v1 (1E).dc.html` (+ support.js jeśli brak) — 2 klatki:
1. **Pełna zakładka „Magazyn Państwa / Surowce imperium"** (parytet z wdrożonym panelem + kanon 1E):
   nagłówek z limitem (200/typ · wzór 100+100×Magazyn · nadmiar przepada), 9 wierszy MAGAZYNOWANE
   (medalion z ikoną · nazwa · badge PEŁNY · pasek zielony/złoty/czerwony · n/200 · ±/turę),
   DOSTĘP jako chipy z kropką JEST/BRAK (Ceramika · Sól · Koń) **z ikonami**, nota Żywność (osobny model),
   legenda. **Tooltip wiersza** (przypięty przy Brązie): Typ · Źródło (budynek+przelicznik) · Konsument · reguła magazynu.
2. **Formy uproszczone** — 3 konteksty: HUD mapy świata (medalion+ilość+przyrost) · miasto-budowa
   (symbol+ilość, bez przyrostu) · rekrutacja (tylko surowiec militarny epoki: BRĄZ / ŻELAZO).
+ `standalone/` — wariant 1-plikowy (za proxy).

## KROK 3 — CANON/hub/WYMIANA
CANON.md (wiersz Surowce), START hub (karta ★), WYMIANA-UI-DESIGN.md (log 2026-07-24) — NADPISZ.

Commit: `SUROWCE v2: ikony kształt+kolor (pieniek/kostki/grudki/sztabki) + resource-icon-map + makieta Magazyn Państwa v1`

## Integracja
1. Podmień interimowe kolorowane medaliony na ikony wg `resource-icon-map.json` (fallback: brak id w mapie → res-gold? NIE — zgłoś, dodam ikonę).
2. Tooltip wiersza wg klatki A (typ/źródło/konsument są w danych gry; przelicznik źródła pokazywać jeśli dostępny).
3. Przeliczniki w tooltipie przykładowe (2 rudy → 1 brąz) — podmień na realne z silnika.

## Status
Otwarte: Zlecenie 6 cz.2 (portrety ANTYK — czeka na arkusz) · zapowiedź budynków ep.4–5 (czeka na listę).
