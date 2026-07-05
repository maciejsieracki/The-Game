# Budynki — tabela dla mockupu W3 (źródło: `gra/data/buildings.json`)

**Koszt w UI:** `kosztBudowy` = Praca (baza epoka wejścia). W grze rośnie ×1.10^(poziom−1).

| id | nazwa PL | kategoria | koszt Pracy | epoka | techUnlock (puste = od razu) |
|----|----------|-----------|-------------|-------|-------------------------------|
| stolarnia | Stolarnia | Produkcja | 20 | 1 | Obróbka drewna |
| kamieniarski | Warsztat kamieniarski | Produkcja | 20 | 1 | Murarstwo |
| kuznia | Kuźnia | Produkcja+Wojsko | 30 | 1 | Brązownictwo |
| targowisko | Targowisko (Rynek) | Pieniadz | 25 | 1 | Wymiana |
| port | Port handlowy | Pieniadz | 30 | 1 | Żegluga |
| karawanseraj | Karawanseraj | Pieniadz | 25 | 1 | Handel |
| spichlerz | Spichlerz | Zywnosc | 20 | 1 | Garncarstwo |
| swiatynia | Świątynia | Kultura | 25 | 1 | Mistycyzm |
| biblioteka | Biblioteka | Nauka | 25 | 1 | Pismo |
| studnia | Studnia | Zdrowie | 15 | 1 | Gospodarka wodna |
| mury | Mury | Obrona | 35 | 1 | Budownictwo |
| koszary | Koszary | Wojsko | 25 | 1 | Wojskowość |
| magazyn | Magazyn | Produkcja+Pieniadz | 20 | 1 | Handel |
| stela | Stela / Pomnik | Kultura | 15 | 1 | Murarstwo |
| palac | Pałac | Kultura/Administracja | 40 | 1 | — |
| kuznia_zelaza | Kuźnia żelaza | Produkcja+Wojsko | 60 | 2 | Obróbka żelaza |
| wielka_kuznia | Wielka Kuźnia | Produkcja | 90 | 3 | Hutnictwo żelaza |
| fort | Fort | Obrona | 70 | 3 | Inżynieria |
| warsztat_oblezniczy | Warsztat oblężniczy | Wojsko | 65 | 3 | Oblężnictwo |
| akademia | Akademia | Nauka | 70 | 4 | Filozofia |
| teatr | Teatr | Kultura | 55 | 4 | Filozofia |
| sad | Sąd | Administracja | 55 | 4 | Kodeks prawa |
| pretorium | Pretorium | Administracja | 75 | 5 | Kodeks prawa |
| laznia_publiczna | Łaźnia publiczna | Zdrowie | 50 | 5 | Medycyna |
| lazaret | Lazaret | Zdrowie+Wojsko | 55 | 5 | Medycyna |
| akademia_wojskowa | Akademia wojskowa | Wojsko | 80 | 6 | Sztuka wojenna |

## Stany karty w mockupie

| Stan | Wygląd | Przykład |
|------|--------|----------|
| dostępny | normalna ramka złota | Targowisko 25 |
| wybudowany | szary, opacity 0.5, etykieta „Wybudowany" | Spichlerz |
| w kolejce | pomarańczowa obwódka „W kolejce" | Biblioteka |
| zablokowany tech | kłódka + `wymaga: {tech}` | Akademia → Filozofia |
| zablokowany epoka | szary + „epoka {n}+" | Fort → epoka 3 |

## Ikony bld-* (eksport/building-icon-map.json)

spichlerz→bld-food · koszary→bld-military · targowisko→bld-trade · biblioteka→bld-science · swiatynia→bld-religion · mury→bld-defense · palac→bld-admin · stela→bld-monument · kuznia→bld-production · studnia/laznia→bld-health · teatr/amfiteatr→bld-culture · reszta→heurystyka kategorii lub bld-default
