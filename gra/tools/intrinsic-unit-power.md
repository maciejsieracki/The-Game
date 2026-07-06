# Moc jednostki (intrinsic) — propozycja A

**Bez wroga** — tylko własne staty z `units.json`.

```
Atak (A)   = meleeAttack + weaponDamage + piercing + chargeBonus/2 + missileAttack/2
Obrona (O) = meleeDefence + armor + health/2
Moc (M)    = A + O
```

| # | Jednostka | Rola | A | O | **M** | AP | OBR | Obraż | Panc | Przeb | Szarża | HP | AD |
|--:|-----------|------|--:|--:|------:|---:|----:|------:|-----:|------:|-------:|---:|---:|
| 1 | Wieża oblężnicza | Oblężnicza | 0.0 | 226.0 | **226.0** | 0 | 0 | 0 | 1 | 0 | 0 | 450 | 0 |
| 2 | Taran | Oblężnicza | 1.5 | 176.0 | **177.5** | 0 | 0 | 0 | 1 | 1 | 1 | 350 | 0 |
| 3 | Katapulta | Oblężnicza | 5.0 | 62.5 | **67.5** | 0 | 0 | 0 | 0 | 1 | 0 | 125 | 8 |
| 4 | Konnica | Flanka | 49.0 | 18.0 | **67.0** | 30 | 6 | 8 | 4 | 6 | 10 | 16 | 0 |
| 5 | Hastati | Wręcz | 31.5 | 25.5 | **57.0** | 8 | 7 | 8 | 9 | 4 | 8 | 19 | 15 |
| 6 | Medżaj (Gwardia Faraona) | Wręcz | 31.0 | 24.5 | **55.5** | 10 | 8 | 10 | 6 | 4 | 8 | 21 | 6 |
| 7 | Gwardia Królewska Sumeru | Wręcz | 28.0 | 24.5 | **52.5** | 10 | 8 | 10 | 6 | 4 | 8 | 21 | 0 |
| 8 | Hieros Lochos (Święty Zastęp) | Wręcz | 26.0 | 26.5 | **52.5** | 8 | 10 | 10 | 6 | 4 | 8 | 21 | 0 |
| 9 | Królewska Gwardia | Wręcz | 28.0 | 24.0 | **52.0** | 10 | 8 | 10 | 6 | 4 | 8 | 20 | 0 |
| 10 | Triari | Wręcz | 27.0 | 24.5 | **51.5** | 8 | 8 | 10 | 6 | 4 | 10 | 21 | 0 |
| 11 | Hu Ben Wei (Gwardia Tygrysa) | Wręcz | 28.0 | 23.0 | **51.0** | 10 | 7 | 10 | 6 | 4 | 8 | 20 | 0 |
| 12 | uThulwana (Białe Tarcze) | Wręcz | 27.0 | 23.5 | **50.5** | 8 | 7 | 10 | 6 | 4 | 10 | 21 | 0 |
| 13 | Falanga | Wręcz | 14.5 | 30.5 | **45.0** | 5 | 10 | 4 | 8 | 2 | 7 | 25 | 0 |
| 14 | Rydwan (woły) | Flanka | 20.5 | 16.0 | **36.5** | 6 | 4 | 7 | 2 | 3 | 9 | 20 | 0 |
| 15 | Włócznik | Wręcz | 14.0 | 22.0 | **36.0** | 5 | 8 | 5 | 6 | 2 | 4 | 16 | 0 |
| 16 | Wojownik z mieczem i tarczą | Wręcz | 16.0 | 16.0 | **32.0** | 6 | 5 | 6 | 4 | 2 | 4 | 14 | 0 |
| 17 | Wojownik | Wręcz | 10.0 | 11.5 | **21.5** | 4 | 4 | 4 | 2 | 1 | 2 | 11 | 0 |
| 18 | Łucznik | Dystans | 12.5 | 7.0 | **19.5** | 3 | 2 | 4 | 1 | 2 | 1 | 8 | 6 |
| 19 | Rydwan egipski | Flanka | 4.5 | 11.0 | **15.5** | 0 | 0 | 0 | 0 | 0 | 1 | 22 | 8 |
| 20 | Wojownik germański | Wręcz | 6.0 | 8.5 | **14.5** | 1 | 1 | 0 | 0 | 0 | 1 | 15 | 9 |
| 21 | Rydwan Shang | Flanka | 1.5 | 12.0 | **13.5** | 1 | 0 | 0 | 0 | 0 | 1 | 24 | 0 |
| 22 | Rydwan sumeryjski | Flanka | 1.5 | 12.0 | **13.5** | 1 | 0 | 0 | 0 | 0 | 1 | 24 | 0 |
| 23 | Rydwan konny | Flanka | 1.5 | 11.0 | **12.5** | 1 | 0 | 0 | 0 | 0 | 1 | 22 | 0 |
| 24 | Rydwan mykeński | Flanka | 1.5 | 11.0 | **12.5** | 1 | 0 | 0 | 0 | 0 | 1 | 22 | 0 |
| 25 | Włócznik sumeryjski | Wręcz | 0.5 | 12.0 | **12.5** | 0 | 1 | 0 | 1 | 0 | 1 | 20 | 0 |
| 26 | Rydwan celtycki | Flanka | 1.5 | 10.5 | **12.0** | 1 | 0 | 0 | 0 | 0 | 1 | 21 | 0 |
| 27 | Jeździec chiński | Flanka | 1.5 | 9.5 | **11.0** | 1 | 0 | 0 | 0 | 0 | 1 | 19 | 0 |
| 28 | Kusznik | Dystans | 8.5 | 2.5 | **11.0** | 1 | 0 | 0 | 0 | 0 | 0 | 5 | 15 |
| 29 | Impi | Wręcz | 0.5 | 10.0 | **10.5** | 0 | 1 | 0 | 0 | 0 | 1 | 18 | 0 |
| 30 | Wojownik mykeński | Wręcz | 1.5 | 9.0 | **10.5** | 1 | 1 | 0 | 1 | 0 | 1 | 14 | 0 |
| 31 | Wojownik Sherden | Wręcz | 1.5 | 8.0 | **9.5** | 1 | 1 | 0 | 0 | 0 | 1 | 14 | 0 |
| 32 | Wojownik z khopesh | Wręcz | 1.5 | 8.0 | **9.5** | 1 | 1 | 0 | 1 | 0 | 1 | 12 | 0 |
| 33 | Łucznik akadyjski | Dystans | 5.0 | 4.0 | **9.0** | 0 | 1 | 0 | 0 | 0 | 0 | 6 | 10 |
| 34 | Łucznik egipski | Dystans | 5.5 | 3.5 | **9.0** | 0 | 1 | 0 | 0 | 0 | 0 | 5 | 11 |
| 35 | Halabardnik Shang | Wręcz | 2.5 | 6.0 | **8.5** | 1 | 0 | 0 | 0 | 1 | 1 | 12 | 0 |
| 36 | Wojownik celtycki | Wręcz | 1.5 | 7.0 | **8.5** | 1 | 0 | 0 | 0 | 0 | 1 | 14 | 0 |
| 37 | Wojownik z toporem | Wręcz | 2.5 | 6.0 | **8.5** | 1 | 0 | 0 | 0 | 1 | 1 | 12 | 0 |
| 38 | Wojownik szekelesz | Wręcz | 0.0 | 8.0 | **8.0** | 0 | 1 | 0 | 0 | 0 | 0 | 14 | 0 |
| 39 | Berserker germański | Wręcz | 1.5 | 6.0 | **7.5** | 1 | 0 | 0 | 0 | 0 | 1 | 12 | 0 |
| 40 | Wojownik tyrreński | Wręcz | 1.5 | 6.0 | **7.5** | 1 | 0 | 0 | 0 | 0 | 1 | 12 | 0 |
| 41 | Wojownik z maczugą (Chaska) | Wręcz | 2.5 | 5.0 | **7.5** | 1 | 0 | 0 | 0 | 1 | 1 | 10 | 0 |
| 42 | Łucznik sumeryjski | Dystans | 4.0 | 3.5 | **7.5** | 0 | 1 | 0 | 0 | 0 | 0 | 5 | 8 |
| 43 | Gaesatae | Wręcz | 1.5 | 5.5 | **7.0** | 1 | 0 | 0 | 0 | 0 | 1 | 11 | 0 |
| 44 | Oszczepnik Zulu (Izijula) | Dystans | 4.5 | 2.5 | **7.0** | 0 | 0 | 0 | 0 | 0 | 0 | 5 | 9 |
| 45 | Galera | Morska | 0.0 | 6.0 | **6.0** | 0 | 0 | 0 | 0 | 0 | 0 | 12 | 0 |
| 46 | Oszczepnik | Dystans | 4.0 | 1.0 | **5.0** | 0 | 0 | 0 | 0 | 0 | 0 | 2 | 8 |
| 47 | Oszczepnik (Estólica) | Dystans | 4.0 | 1.0 | **5.0** | 0 | 0 | 0 | 0 | 0 | 0 | 2 | 8 |
| 48 | Procarz | Dystans | 4.0 | 1.0 | **5.0** | 0 | 0 | 0 | 0 | 0 | 0 | 2 | 8 |
| 49 | Procarz (Huaracoc) | Dystans | 4.0 | 1.0 | **5.0** | 0 | 0 | 0 | 0 | 0 | 0 | 2 | 8 |
| 50 | Zwiadowca | Wsparcie | 0.0 | 3.5 | **3.5** | 0 | 1 | 0 | 0 | 0 | 0 | 5 | 0 |

## Wybrane jednostki

| Jednostka | A | O | M |
|-----------|--:|--:|--:|
| Hastati | 31.5 | 25.5 | **57.0** |
| Falanga | 14.5 | 30.5 | **45.0** |
| Konnica | 49.0 | 18.0 | **67.0** |
| Łucznik | 12.5 | 7.0 | **19.5** |
| Katapulta | 5.0 | 62.5 | **67.5** |
| Wojownik z mieczem i tarczą | 16.0 | 16.0 | **32.0** |
