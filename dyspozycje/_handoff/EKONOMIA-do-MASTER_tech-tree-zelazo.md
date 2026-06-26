# EKONOMIA → MASTER: Aktualizacja tech.json — Epoka Żelaza

**Data:** 2026-06-25  
**Lane:** EKONOMIA  
**Plik:** `gra/data/tech.json`  
**Backup:** `gra/data/tech.json.bak-EKONOMIA`

---

## Co zrobiono

- Zachowano bez zmian wszystkie 10 technologii Kamień i 10 technologii Brąz.
- Dodano **9 technologii Epoki Żelaza** (Epoka="Żelazo", Poziomy 6–8).
- Walidacja JSON: OK (python3 json.load) — 29 wpisów łącznie.
- Wszystkie prereq wskazują na istniejące technologie — weryfikacja automatyczna: brak błędów.
- Skalowanie kosztów: Żelazo 120–190 (vs Brąz 40–100) — sensowne.

---

## Lista technologii Żelaza (9 sztuk)

| Technologia | Lvl | Koszt | Prereq | Odblokowuje budynek | Odblokowuje surowiec |
|---|---|---|---|---|---|
| Obróbka żelaza | 6 | 120 | Brązownictwo | Kuźnia żelaza | żelazo |
| Inżynieria | 6 | 130 | Budownictwo | Akwedukt (ulepszony), Fort | — |
| Oblężnictwo | 6 | 140 | Matematyka + Wojskowosc | Warsztat oblężniczy | — |
| Filozofia | 7 | 150 | Pismo + Religia | Akademia, Teatr | — |
| Kodeks prawa | 7 | 140 | Prawo (Kodeks) + Pismo | Sąd, Pretorium | — |
| Drogi żelazne | 7 | 160 | Inżynieria + Obróbka żelaza | Drogi brukowane (ulepszenie terenu) | — |
| Medycyna | 7 | 150 | Filozofia + Gospodarka wodna | Łaźnia publiczna, Lazaret | — |
| Hutnictwo żelaza | 8 | 180 | Obróbka żelaza + Inżynieria | Wielka Kuźnia | stal (prereq) |
| Sztuka wojenna | 8 | 190 | Oblężnictwo + Obróbka żelaza | Akademia wojskowa | — |

---

## Wymagane działania per lane

### EKONOMIA (budynki do dodania w buildings.json)

Nowe budynki wymagające definicji w `buildings.json`:

| Budynek | Tech unlock | Kategoria | Uwagi |
|---|---|---|---|
| Kuźnia żelaza | Obróbka żelaza | Produkcja+Wojsko | jak Kuznia, ale na żelazo; mnożnik jednostek żelaznych |
| Fort | Inżynieria | Obrona | ulepszenie terenu/budowla; +100% obrona przy obozowaniu, zasięg 10 — zob. civ-bonusy-obronne-mapa.md |
| Warsztat oblężniczy | Oblężnictwo | Wojsko | prereq machiny oblężnicze; unlocks Katapulta/Taran/Wieża |
| Akademia | Filozofia | Nauka | nauka++, kultura+ |
| Teatr | Filozofia | Kultura | kultura++, zadowolenie++ |
| Sąd | Kodeks prawa | Administracja | zadowolenie+, korupcja- |
| Pretorium | Kodeks prawa | Administracja | bonus administracyjny, utrzymanie porządku |
| Łaźnia publiczna | Medycyna | Zdrowie | zadowolenie++, zdrowie++ (rozszerzenie Studni) |
| Lazaret | Medycyna | Wojsko+Zdrowie | regeneracja HP jednostek w mieście |
| Wielka Kuźnia | Hutnictwo żelaza | Produkcja | produkcja++, mnożnik jednostek++ |
| Akademia wojskowa | Sztuka wojenna | Wojsko | mnożnik siły i exp jednostek; prereq jednostek top-tier Żelaza |

**Razem: 11 nowych budynków** do dodania w buildings.json przez EKONOMIA.

### DANE / MAPA (surowce i ulepszenia terenu)

| Element | Tech unlock | Uwagi |
|---|---|---|
| Surowiec: żelazo | Obróbka żelaza | Dostęp boolean; złoże żelaza musi istnieć na mapie |
| Surowiec: stal (prereq) | Hutnictwo żelaza | Nowy surowiec do resources.json; wejście dalszych epok |
| Ulepszenie terenu: Drogi brukowane | Drogi żelazne | +ruch, +handel; do terrain-improvements.json |

### UNITS (jednostki do weryfikacji i aktualizacji)

W units.json kilka jednostek ma Epoka=Żelazo ale Tech=Brązownictwo lub Tech=— (do aktualizacji):

| Jednostka | Obecny Tech | Sugerowany nowy Tech |
|---|---|---|
| Kusznik | Brązownictwo | Obróbka żelaza |
| Wojownik celtycki | Brązownictwo | Obróbka żelaza |
| Gaesatae | Brązownictwo | Obróbka żelaza |
| Rydwan celtycki | Jeździectwo | Obróbka żelaza |
| Wojownik germański | Brązownictwo | Obróbka żelaza |
| Berserker germański | Brązownictwo | Obróbka żelaza |
| Katapulta | — | Oblężnictwo |

UNITS powinna sprawdzić i zaktualizować pole "Tech" dla jednostek Epoki Żelaza w units.json.

---

## Powiadomienie CYWILIZACJE (AI read-only)

CYWILIZACJE czyta tech.json do heurystyki AI badań. Zmiany:
- Dodana Epoka="Żelazo" (wartość wcześniej nieobecna).
- 9 nowych węzłów drzewka; AI powinno rozpoznawać Żelazo jako epoch=3.
- Prereq tree dla Żelaza kotwiczony w Brązu (Brązownictwo, Budownictwo, Matematyka, Pismo, Religia, Prawo, Wojskowosc, Gospodarka wodna).
- Brak zmian w strukturze wpisów Kamień/Brąz — AI nie wymaga przeładowania poprzednich węzłów.

---

## Status

- [x] tech.json zaktualizowany i zwalidowany
- [x] Backup: tech.json.bak-EKONOMIA
- [ ] EKONOMIA: dodać 11 budynków w buildings.json
- [ ] DANE/MAPA: dodać surowce żelazo/stal, ulepszenie Drogi brukowane
- [ ] UNITS: zaktualizować Tech dla 7 jednostek Epoki Żelaza
- [ ] CYWILIZACJE: świadome zmiany (notyfikacja powyżej)
