# 00-dispatch — R-TECHTREE-SCIENCEPICKER-JEDNOSTKI-STALE-Q1

TEMAT: R-TECHTREE-SCIENCEPICKER-JEDNOSTKI-STALE-Q1
GOAL: `techTreeView.ts` (hover-karta węzła drzewka technologii) i `sciencePicker.ts`
(tooltip badań) mają pokazywać KOMPLETNĄ i POPRAWNIE OZNACZONĄ listę jednostek
odblokowywanych przez daną technologię — dziś czytają niekompletny, osadzony tekst z
`tech.json`, podczas gdy poprawne, kompletne źródło (`units.json`'s pole `Tech`) już
istnieje i jest używane gdzie indziej w tym samym repo.

## Znalezisko (Evaluator, recon `P-TECHNOLOGIA-POPUP-KARTA-ODKRYCIA-Q1` runda 2, 2026-08-21)

Dla Brązownictwa: `tech.json`'s pole „Odblokowuje budynek" zawiera osadzony tekst
„Odlewnia brązu; Kuźnia brązu; Jednostki: Włócznik, Wojownik z mieczem i tarczą, ..." —
**12 nazw jednostek**. Prawdziwe, kompletne źródło — `units.json`'s pole `Tech` — ma
**20 rekordów** z `Tech: "Brązownictwo"` (dodatkowo m.in. Taran okuty, Strażnik bram
Harappy, Piechota induska, Piechota hetycka, Gwardia Ishtar, Wojownik babiloński, Wojownik
fenicki, Gwardzista z champi). Zweryfikowane przez czytanie kodu: budowa jednostki w grze
(`research.ts::unlocksFor`, `production.ts::availableProduction`) bramkuje WYŁĄCZNIE przez
`units.json`'s pole `Tech` — `tech.json`'s 12-nazwowy tekst nie jest używany do bramkowania
budowy nigdzie. `gra/src/ui/entityCards/technologyAdapter.ts` (zmigrowana w tej samej sesji
karta odkrycia technologii, `R-FEATURE-KARTY-ENCYKLOPEDIA-CIVPEDIA-Q1` T3) już poprawnie
czyta z `units.json`'s `Tech` — pokazuje wszystkie 20.

**Dwa dziś żyjące, niepoprawne konsumenty tego samego, przestarzałego tekstu:**

1. **`gra/src/ui/techTreeView.ts`** — `parseUnlockBuildings()` (linia ~159-168) poprawnie
   rozdziela segment „Jednostki: ..." od budynków (parsowanie po `;`, potem po `,` — ta
   część działa dobrze), ALE lista jednostek pochodzi z osadzonego tekstu `tech.json`
   (12 zamiast 20 dla Brązownictwa) — `unlockChips()` (linia ~700-705) renderuje niekompletną
   listę w hover-karcie węzła drzewka.
2. **`gra/src/ui/sciencePicker.ts`** — linia ~903-905: `node.odblokujeBudynek` to SUROWY,
   nieprzetworzony string z `tech.json` (przypisany w linii ~152 wprost z `r['Odblokowuje
   budynek']`, bez rozdzielenia budynki/jednostki), renderowany przez
   `.split(',').map(...)` **wyłącznie po przecinku**, nie po średniku — dla Brązownictwa
   pierwszy element tej listy to CAŁY fragment „Odlewnia brązu; Kuźnia brązu; Jednostki:
   Włócznik" jako jedna pozycja, a kolejne nazwy jednostek (Wojownik z mieczem i tarczą,
   Impi, ...) trafiają jako OSOBNE pozycje pod nagłówkiem „Odblokowuje budynki:" — myląc
   jednostki z budynkami, nie tylko pokazując niekompletną listę.

## Zakres naprawy

1. **`gra/src/ui/techTreeView.ts`** — zmień źródło listy jednostek w `parseUnlockBuildings()`/
   `buildTreeNodes()` (linia ~178) tak, by `jednostki` pochodziło z `units.json`'s pola `Tech`
   (filtrowanie `u.Tech === r['Technologia']`, wzorem `technologyAdapter.ts:100` w
   `entityCards/`), NIE z osadzonego tekstu w `tech.json`. Segment budynków (`budynki`)
   może zostać jak jest (parsowany z `tech.json`, jeśli to pole poprawnie zawiera TYLKO
   nazwy budynków po odjęciu segmentu „Jednostki: ...") — zweryfikuj to osobno, nie zakładaj.
2. **`gra/src/ui/sciencePicker.ts`** — napraw renderowanie „Odblokowuje budynki:" (linia
   ~903-905): (a) najpierw rozdziel segment „Jednostki: ..." od budynków (wzorem
   `parseUnlockBuildings()` z `techTreeView.ts` — rozważ reużycie tej samej funkcji zamiast
   duplikować logikę, jeśli to możliwe bez cyklicznych importów), (b) listę jednostek
   zasil z `units.json`'s pola `Tech` (jak w punkcie 1), (c) rozważ czy tooltip powinien
   mieć osobną sekcję „Odblokowuje jednostki:" analogiczną do budynków, czy jednostki mają
   być pominięte w tym konkretnym tooltipie (sprawdź czy jest tam już miejsce/wzorzec na
   osobną sekcję jednostek, np. w POBLIŻU linii 903-914 — jeśli nie ma i to duży dodatek UI,
   zatrzymaj się i zgłoś BLOCK z pytaniem zamiast dopisywać nowy layout na własną rękę).

## Ograniczenia

- To dotyczy WSZYSTKICH technologii z osadzoną listą „Jednostki: ..." w polu „Odblokowuje
  budynek", nie tylko Brązownictwa — napisz test na kilku różnych technologiach (przynajmniej
  jedna z rozbieżnością analogiczną do Brązownictwa, jeśli istnieje; jeśli Brązownictwo jest
  jedynym takim przypadkiem w danych, powiedz to jawnie w raporcie).
- Nie zmieniaj `gra/data/tech.json` (dane) — to jest fix parsowania/źródła w kodzie UI, nie
  korekta danych.
- Nie zmieniaj `entityCards/technologyAdapter.ts` (już poprawny, wzorzec do naśladowania,
  nie do modyfikacji).
- Jeśli naprawa w `sciencePicker.ts` wymaga większego layoutu niż proste dodanie/poprawienie
  jednej sekcji (patrz punkt 2c wyżej) — STATUS: BLOCK z opisem, nie improwizuj UI.

## Branch

`autobot/R-TECHTREE-SCIENCEPICKER-JEDNOSTKI-STALE-Q1` (z `main`).
