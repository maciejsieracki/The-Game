# EKONOMIA → MASTER: Budynki Epoki Żelaza — buildings.json zaktualizowany

**Data:** 2026-06-25
**Lane:** EKONOMIA
**Plik:** `gra/data/buildings.json`
**Backup:** `gra/data/buildings.json.bak-EKONOMIA`
**Excel:** `Civ/MIASTO/Budynki.xlsx` (odświeżony: Kamień + Brąz + Żelazo)

---

## Co zrobiono

- Zachowano bez zmian wszystkie 15 budynków Kamień/Brąz.
- Dodano **11 budynków Epoki Żelaza** (`epokaWejscia=3`).
- Walidacja JSON: OK (`python3 -c "import json; json.load(open(...))"`) — 26 wpisów łącznie.
- Wszystkie `techUnlock` = dokładne nazwy z `tech.json` (cross-check: 11/11 match).
- Backup `buildings.json.bak-EKONOMIA` wykonany przed zmianami.
- Excel `Budynki.xlsx` przebudowany: 3 epoki, kolory wierszy, niebieskie kolumny edytowalne.

---

## Lista 11 budynków Żelaza

| ID | Nazwa | Tech unlock | Kategoria | Kluczowy bonus | WymaganySurowiec |
|---|---|---|---|---|---|
| kuznia_zelaza | Kuźnia żelaza | Obróbka żelaza | Produkcja+Wojsko | +praca 8/+mnożnik 8% jedn. żelaznych | **zelazo** |
| wielka_kuznia | Wielka Kuźnia | Hutnictwo żelaza | Produkcja | +praca 12/+mnożnik 15% wszystkich jedn. | **stal** |
| fort | Fort | Inżynieria | Obrona | +obrona 10 bazowa; +100% przy obozowaniu (zasięg 10) | — |
| warsztat_oblezniczy | Warsztat oblężniczy | Oblężnictwo | Wojsko | **odblokowuje machiny** (Katapulta/Taran/Wieża); +mnożnik 10% | — |
| akademia | Akademia | Filozofia | Nauka | +nauka 6/+mnożnik nauki 10% | — |
| teatr | Teatr | Filozofia | Kultura | +kultura 4/+zadowolenie 3 | — |
| sad | Sąd | Kodeks prawa | Administracja | +zadowolenie 2/+kultura 1/anty-korupcja | — |
| pretorium | Pretorium | Kodeks prawa | Administracja | +pieniądz 3/+obrona 2/+mnożnik 5% podatkowy | — |
| laznia_publiczna | Łaźnia publiczna | Medycyna | Zdrowie | +zadowolenie 3/+żywność 1 (proxy zdrowie) | — |
| lazaret | Lazaret | Medycyna | Zdrowie+Wojsko | **regeneracja HP jedn.** (mnożnik 5%) — styk UNITS | — |
| akademia_wojskowa | Akademia wojskowa | Sztuka wojenna | Wojsko | **mnożnik 15% siły i exp** wszystkich jedn.; prereq top-tier — styk UNITS | — |

---

## Budynki wymagające nowych surowców od DANE

Dwa budynki wymagają nowych surowców zdefiniowanych w `resources.json`/DANE:

| Budynek | wymaganySurowiec | Status surowca | Uwagi |
|---|---|---|---|
| Kuźnia żelaza | **zelazo** | Zadeklarowany w tech.json (Obróbka żelaza odblokowuje) | DANE/MAPA musi mieć złoże żelaza na mapie |
| Wielka Kuźnia | **stal** | Prereq — Hutnictwo żelaza odblokowuje stal | DANE musi dodać stal do resources.json |

---

## Budynki odblokowujące machiny/jednostki (styk UNITS)

| Budynek | Pole odblokowuje | Co odblokowuje | Akcja UNITS |
|---|---|---|---|
| warsztat_oblezniczy | `maWarsztatOblezniczy` | Katapulta, Taran, Wieża oblężnicza | UNITS: sprawdzić prereq budynek w units.json dla tych machin |
| akademia_wojskowa | (mnożnik top-tier) | Prereq elitarnych jednostek żelaznych | UNITS: dodać warunek `budynek: akademia_wojskowa` do top-tier |
| lazaret | (regeneracja HP) | Regeneracja w mieście | UNITS: podpiąć `cityHasLazaret` do regeneracji co turę |
| fort | `maFort` | Bonus +100% obrony przy obozowaniu | MAPA/UNITS: `hasFort` w polu heksowym → `oblezenie.ts` |

---

## Styk MAPA (fort)

Fort (`id=fort`) ma `odblokowuje: "maFort"` i bonus `+obrona 10` bazowa.
Zgodnie z `civ-bonusy-obronne-mapa.md`: Fort = +100% obrona przy obozowaniu, zasięg 10 (Epoka Żelazo).
MAPA/UNITS powinny sprawdzać flagę `maFort` na polu heksowym (analogicznie do posterunków).

---

## Excel panel

**Ścieżka:** `Civ/MIASTO/Budynki.xlsx`
**Arkusze:** `Budynki` (dane, 31 wierszy), `Jak-uzywac` (instrukcja)
**Kolorystyka:** zielony=Kamień, amber=Brąz, niebieski=Żelazo
**Kolumny edytowalne (ciemnoniebieski nagłówek):** kosztBudowy, maksPoziom, utrzymanie, baza_*, przyrost_*, wymaganySurowiec, wymagania
**Kolumny tylko-odczyt:** ID, Nazwa, Kategoria, Epoka, Tech unlock, Uwagi

---

## Status

- [x] buildings.json: 11 budynków Żelaza dodanych, JSON waliduje (26 wpisów)
- [x] Backup: buildings.json.bak-EKONOMIA
- [x] Excel Budynki.xlsx: odświeżony (Kamień+Brąz+Żelazo, kolorystyka, arkusz Jak-uzywac)
- [ ] DANE: dodać surowiec `stal` do resources.json; weryfikacja `zelazo` na mapie
- [ ] MAPA: obsłużyć flagę `maFort` (bonus +100% obozowania, zasięg 10)
- [ ] UNITS: podpiąć `maWarsztatOblezniczy` jako prereq machin; `lazaret` → regeneracja HP; `akademia_wojskowa` → top-tier prereq
