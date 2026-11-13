# Tabela zamienników epoka E -> E+1 (jednostka × nacja)

Wygenerowano z `availableReplacementsFor` (production.ts) na żywych danych `gra/data/units.json`, bez zmian reguł. Założenia: Koszary w państwie, wszystkie technologie odblokowane, zapas surowców nieograniczony (widok "Zastąp" pokazuje pozycje wyszarzone), woda dostępna, epoka imperium = E+1. Pokazane są tylko zamienniki o epoce dokładnie E+1; reguła = ten sam `Typ` albo pole `Zastąp specjalnie` (jedyna ścieżka między typami).

Wierszy (jednostka epoki Kamień/Brąz × nacja, która może ją mieć): 260; bez żadnego zamiennika w E+1: 142.

## A. Jednostki BEZ zamiennika w następnej epoce (luki)

| Jednostka | Epoka | Typ | Nacje bez zamiennika |
|---|---|---|---|
| Łucznik | Kamień | Distance | 13/16: Babilonia, Celtowie, Chiny, Fenicjanie, Germanie, Grecja, Harappa, Hetyci, Inkowie, Ludy Morza, Rzym, Słowianie, Zulu |
| Oszczepnik | Kamień | Distance | 13/16: Babilonia, Celtowie, Chiny, Fenicjanie, Germanie, Grecja, Harappa, Hetyci, Inkowie, Ludy Morza, Rzym, Słowianie, Zulu |
| Oszczepnik (Estólica) | Kamień | Distance | wszystkie (1) |
| Oszczepnik Zulu (Izijula) | Kamień | Distance | wszystkie (1) |
| Zwiadowca | Kamień | Civilian | wszystkie (16) |
| Galera | Brąz | Naval | wszystkie (16) |
| Gwardia Królewska Sumeru | Brąz | Swordsman | wszystkie (1) |
| Gwardzista z champi | Brąz | Offensive | wszystkie (1) |
| Halabardnik Shang | Brąz | Swordsman | wszystkie (1) |
| Hu Ben Wei (Gwardia Tygrysa) | Brąz | Swordsman | wszystkie (1) |
| Jeździec chiński | Brąz | Mount | wszystkie (1) |
| Konnica | Brąz | Mount | 13/16: Babilonia, Chiny, Egipt, Fenicjanie, Germanie, Grecja, Harappa, Hetyci, Inkowie, Ludy Morza, Rzym, Sumer, Zulu |
| Królewska Gwardia | Brąz | Swordsman | wszystkie (1) |
| Łucznik akadyjski | Brąz | Distance | wszystkie (1) |
| Łucznik asyryjski | Brąz | Distance | wszystkie (1) |
| Łucznik nubijski | Brąz | Distance | wszystkie (1) |
| Piechota hetycka | Brąz | Spearman | wszystkie (1) |
| Piechota induska | Brąz | Spearman | wszystkie (1) |
| Procarz | Brąz | Slinger | wszystkie (16) |
| Procarz (Huaracoc) | Brąz | Slinger | wszystkie (1) |
| Rydwan egipski | Brąz | Mount | wszystkie (1) |
| Rydwan Kapadokijski | Brąz | Mount | wszystkie (1) |
| Rydwan konny | Brąz | Mount | 13/16: Babilonia, Chiny, Egipt, Fenicjanie, Germanie, Grecja, Harappa, Hetyci, Inkowie, Ludy Morza, Rzym, Sumer, Zulu |
| Rydwan mykeński | Brąz | Mount | wszystkie (1) |
| Rydwan Shang | Brąz | Mount | wszystkie (1) |
| Rydwan sumeryjski | Brąz | Mount | wszystkie (1) |
| Strażnik bram Harappy | Brąz | Spearman | wszystkie (1) |
| uThulwana (Białe Tarcze) | Brąz | Swordsman | wszystkie (1) |
| Włócznik | Brąz | Spearman | 12/16: Asyria, Babilonia, Celtowie, Chiny, Egipt, Fenicjanie, Germanie, Harappa, Hetyci, Inkowie, Ludy Morza, Słowianie |
| Wojownik Sherden | Brąz | Swordsman | wszystkie (1) |
| Wojownik szekelesz | Brąz | Spearman | wszystkie (1) |
| Wojownik z mieczem i tarczą | Brąz | Swordsman | 6/16: Asyria, Chiny, Inkowie, Ludy Morza, Sumer, Zulu |
| Wojownik z toporem | Brąz | Offensive | wszystkie (1) |

## B. Pełna tabela jednostka × nacja -> zamienniki w E+1

### Łucznik (Kamień, Distance)
- Asyria -> Łucznik asyryjski
- Babilonia, Celtowie, Chiny, Fenicjanie, Germanie, Grecja, Harappa, Hetyci, Inkowie, Ludy Morza, Rzym, Słowianie, Zulu -> (brak)
- Egipt -> Łucznik nubijski
- Sumer -> Łucznik akadyjski

### Łucznik egipski (Kamień, Distance, Egipt)
- Egipt -> Łucznik nubijski

### Łucznik sumeryjski (Kamień, Distance, Sumer)
- Sumer -> Łucznik akadyjski

### Oszczepnik (Kamień, Distance)
- Asyria -> Łucznik asyryjski
- Babilonia, Celtowie, Chiny, Fenicjanie, Germanie, Grecja, Harappa, Hetyci, Inkowie, Ludy Morza, Rzym, Słowianie, Zulu -> (brak)
- Egipt -> Łucznik nubijski
- Sumer -> Łucznik akadyjski

### Oszczepnik (Estólica) (Kamień, Distance, Inkowie)
- Inkowie -> (brak)

### Oszczepnik Zulu (Izijula) (Kamień, Distance, Zulu)
- Zulu -> (brak)

### Rydwan (woły) (Kamień, Mount)
- Asyria, Babilonia, Celtowie, Fenicjanie, Germanie, Harappa, Inkowie, Ludy Morza, Rzym, Słowianie, Zulu -> Konnica | Rydwan konny
- Chiny -> Konnica | Jeździec chiński | Rydwan konny | Rydwan Shang
- Egipt -> Konnica | Rydwan konny | Rydwan egipski
- Grecja -> Konnica | Rydwan konny | Rydwan mykeński
- Hetyci -> Konnica | Rydwan konny | Rydwan Kapadokijski
- Sumer -> Konnica | Rydwan konny | Rydwan sumeryjski

### Taran (Kamień, Siege)
- wszystkie nacje -> Taran okuty | Wieża oblężnicza

### Wojownik (Kamień, Swordsman)
- Asyria, Celtowie, Germanie, Harappa, Hetyci, Rzym, Słowianie -> Wojownik z mieczem i tarczą
- Babilonia -> Wojownik z mieczem i tarczą | Gwardia Ishtar | Wojownik babiloński
- Chiny -> Hu Ben Wei (Gwardia Tygrysa) | Wojownik z mieczem i tarczą | Halabardnik Shang
- Egipt -> Medżaj (Gwardia Faraona) | Wojownik z mieczem i tarczą | Wojownik z khopesh
- Fenicjanie -> Wojownik z mieczem i tarczą | Wojownik fenicki
- Grecja -> Wojownik z mieczem i tarczą | Wojownik mykeński
- Inkowie -> Królewska Gwardia | Wojownik z mieczem i tarczą
- Ludy Morza -> Wojownik z mieczem i tarczą | Wojownik Sherden
- Sumer -> Gwardia Królewska Sumeru | Wojownik z mieczem i tarczą
- Zulu -> uThulwana (Białe Tarcze) | Wojownik z mieczem i tarczą

### Wojownik z maczugą (Chaska) (Kamień, Offensive, Inkowie)
- Inkowie -> Gwardzista z champi | Wojownik z toporem

### Zwiadowca (Kamień, Civilian)
- wszystkie nacje -> (brak)

### Galera (Brąz, Naval)
- wszystkie nacje -> (brak)

### Gwardia Ishtar (Brąz, Swordsman, Babilonia)
- Babilonia -> Piechota neobabilońska

### Gwardia Królewska Sumeru (Brąz, Swordsman, Sumer)
- Sumer -> (brak)

### Gwardzista z champi (Brąz, Offensive, Inkowie)
- Inkowie -> (brak)

### Halabardnik Shang (Brąz, Swordsman, Chiny)
- Chiny -> (brak)

### Hu Ben Wei (Gwardia Tygrysa) (Brąz, Swordsman, Chiny)
- Chiny -> (brak)

### Impi (Brąz, Spearman, Zulu)
- Zulu -> iButho z iklwa

### Jeździec chiński (Brąz, Mount, Chiny)
- Chiny -> (brak)

### Konnica (Brąz, Mount)
- Asyria -> Konnica łucznicza asyryjska | Konnica lancowa asyryjska
- Babilonia, Chiny, Egipt, Fenicjanie, Germanie, Grecja, Harappa, Hetyci, Inkowie, Ludy Morza, Rzym, Sumer, Zulu -> (brak)
- Celtowie -> Rydwan celtycki
- Słowianie -> Jeździec z oszczepami

### Królewska Gwardia (Brąz, Swordsman, Inkowie)
- Inkowie -> (brak)

### Łucznik akadyjski (Brąz, Distance, Sumer)
- Sumer -> (brak)

### Łucznik asyryjski (Brąz, Distance, Asyria)
- Asyria -> (brak)

### Łucznik nubijski (Brąz, Distance, Egipt)
- Egipt -> (brak)

### Medżaj (Gwardia Faraona) (Brąz, Swordsman, Egipt)
- Egipt -> Wojownik z żelaznym khopesh

### Piechota hetycka (Brąz, Spearman, Hetyci)
- Hetyci -> (brak)

### Piechota induska (Brąz, Spearman, Harappa)
- Harappa -> (brak)

### Procarz (Brąz, Slinger)
- wszystkie nacje -> (brak)

### Procarz (Huaracoc) (Brąz, Slinger, Inkowie)
- Inkowie -> (brak)

### Rydwan egipski (Brąz, Mount, Egipt)
- Egipt -> (brak)

### Rydwan Kapadokijski (Brąz, Mount, Hetyci)
- Hetyci -> (brak)

### Rydwan konny (Brąz, Mount)
- Asyria -> Konnica łucznicza asyryjska | Konnica lancowa asyryjska
- Babilonia, Chiny, Egipt, Fenicjanie, Germanie, Grecja, Harappa, Hetyci, Inkowie, Ludy Morza, Rzym, Sumer, Zulu -> (brak)
- Celtowie -> Rydwan celtycki
- Słowianie -> Jeździec z oszczepami

### Rydwan mykeński (Brąz, Mount, Grecja)
- Grecja -> (brak)

### Rydwan Shang (Brąz, Mount, Chiny)
- Chiny -> (brak)

### Rydwan sumeryjski (Brąz, Mount, Sumer)
- Sumer -> (brak)

### Strażnik bram Harappy (Brąz, Spearman, Harappa)
- Harappa -> (brak)

### Taran okuty (Brąz, Siege)
- wszystkie nacje -> Katapulta

### uThulwana (Białe Tarcze) (Brąz, Swordsman, Zulu)
- Zulu -> (brak)

### Wieża oblężnicza (Brąz, Siege)
- wszystkie nacje -> Katapulta

### Włócznik (Brąz, Spearman)
- Asyria, Babilonia, Celtowie, Chiny, Egipt, Fenicjanie, Germanie, Harappa, Hetyci, Inkowie, Ludy Morza, Słowianie -> (brak)
- Grecja -> Thorakites
- Rzym -> Triari
- Sumer -> Mur tarcz (Sargonid)
- Zulu -> iButho z iklwa

### Włócznik sumeryjski (Brąz, Spearman, Sumer)
- Sumer -> Mur tarcz (Sargonid)

### Wojownik babiloński (Brąz, Swordsman, Babilonia)
- Babilonia -> Piechota neobabilońska

### Wojownik fenicki (Brąz, Swordsman, Fenicjanie)
- Fenicjanie -> Gwardia Tyreńska | Tyrski miecznik

### Wojownik mykeński (Brąz, Swordsman, Grecja)
- Grecja -> Hieros Lochos (Święty Zastęp)

### Wojownik Sherden (Brąz, Swordsman, Ludy Morza)
- Ludy Morza -> (brak)

### Wojownik szekelesz (Brąz, Spearman, Ludy Morza)
- Ludy Morza -> (brak)

### Wojownik tyrreński (Brąz, Offensive, Rzym)
- Rzym -> Evocati

### Wojownik z khopesh (Brąz, Swordsman, Egipt)
- Egipt -> Wojownik z żelaznym khopesh

### Wojownik z mieczem i tarczą (Brąz, Swordsman)
- Asyria, Chiny, Inkowie, Ludy Morza, Sumer, Zulu -> (brak)
- Babilonia -> Piechota neobabilońska
- Celtowie -> Gaesatae | Miecznik galijski | Soldurii
- Egipt -> Wojownik z żelaznym khopesh
- Fenicjanie -> Gwardia Tyreńska | Tyrski miecznik
- Germanie -> Wojownik germański | Berserker germański
- Grecja -> Hieros Lochos (Święty Zastęp)
- Harappa -> Garnizon Harappy
- Hetyci -> Gwardia hetycka
- Rzym -> Evocati | Hastati
- Słowianie -> Drużynnik

### Wojownik z toporem (Brąz, Offensive, Inkowie)
- Inkowie -> (brak)
