# AUDYT: parametry budynków deklarowane w JSON, ale nieużywane przez silnik
Data: 2026-07-25 · Zakres: `gra/data/buildings.json` (37 budynków) vs `gra/src` · Tryb: read-only
Zlecony przez Macieja: „sprawdź potem czy przy innych budynkach nie ma podobnego story, że są jakieś parametry przy upgrade'zie, ale nie są stosowane."

## WNIOSEK GŁÓWNY
`mnoznik` i `obrona` to był czubek góry lodowej. **Cała rodzina pól `przyrost*` jest systemowo martwa**
(silnik liczył `baza × 1,10^(poziom−1)` i ignorował `przyrost`), a UI pokazywał te martwe liczby graczowi
jako „+X/poziom" — w tym w panelu z nagłówkiem **„Statystyki (silnik)"**, co jest najgorszą etykietą w kodzie.
→ Naprawiane właśnie przez subagenta likwidującego ×1,10 (przejście na model liniowy = `przyrost` staje się ŻYWY).

## TABELA STATUSÓW
| Pole | Status | Konsument |
|---|---|---|
| `baza.{praca,pieniadz,zywnosc,nauka,kultura}` | ŻYWE | `economy.ts:436` `buildingValue()` |
| `baza.zadowolenie` | ŻYWE | `economy.ts:454` |
| `przyrost.*` | MARTWE (legacy) → **ożywiane** przez refaktor liniowy | brak / `production.ts:208` |
| `baza.mnoznik` | ŻYWE ale BŁĘDNIE (idzie na Pracę) | `economy.ts:738` Step 5 |
| `przyrost.mnoznik` | MARTWE | — |
| `baza.obrona`/`przyrost.obrona` | MARTWE (obrona wyłącznie % z `miasto-params.json`) | `main.ts:11271` |
| `kosztBudowy` | ŻYWE | `production.ts:282` |
| `przyrostKosztu` | MARTWE (legacy) → ożywiane refaktorem | `production.ts:170` |
| `utrzymanie` | **NADPISYWANE** flat 1/1/2 z `econ-params.json` | `economy-upkeep.ts:511` |
| `przyrostUtrzymania` | MARTWE (legacy) | `economy-upkeep.ts:503` |
| `wymagania` (tekst) | TYLKO UI (nigdy nie parsowane jako logika) | `cityPanel.ts:4692` |
| `techUnlock` | ŻYWE | `production.ts:705` |
| `upgradeFrom` | ŻYWE | `production.ts:556` |
| `poziomTechGate` | ŻYWE (tylko biblioteka) | `production.ts:186` |
| `wymaganySurowiec` | ŻYWE (kuznia_zelaza, wielka_kuznia) | `building-resource-gate.ts:111` |
| `odblokowuje` | **MARTWE CAŁKOWICIE** — nie ma go nawet w typie `BuildingDef`; flagi ustawia hardkod `id==='mury'` | `main.ts:2016` |
| `suppressed` | ŻYWE (teatr; redundantnie zdublowane hardkodem) | `building-upgrades.ts:17` |
| `maksPoziom`, `epokaWejscia`, `nazwyPoziomow`, `koszt_surowce` | ŻYWE | różne |
| `wielokrotny` | ŻYWE w kodzie, ale żaden budynek go nie używa | `data/loader.ts` |

## WPADKI PER BUDYNEK (rodzina `mnoznik`)
Silnik włącza mnożnik do bonusu Pracy **tylko** gdy `kategoria` NIE zawiera „Wojsko"/„Obrona":
| Budynek | Kategoria | Deklaruje | Realnie |
|---|---|---|---|
| Kuźnia (5), Kuźnia żelaza (8) | Produkcja+Wojsko | „siła jednostek" | wykluczone → **zero efektu** |
| Koszary (5), Warsztat oblężniczy (10), Akademia wojskowa (20) | Wojsko | siła/exp jednostek | wykluczone → **zero efektu** |
| **Targowisko** | Pieniadz | „+3/poz. do handlu" | `baza.mnoznik = 0`, cały wzrost w martwym `przyrost` → **zero efektu ZAWSZE**, na każdym poziomie |
| Karawanseraj (8) | Pieniadz | „handel lądowy" | działa, ale dolicza do **Pracy**, nie do handlu |
| **Wielka Kuźnia** (23) | „Produkcja" — **brak „+Wojsko"!** | „siła jednostek" | **działa** → +23% do Pracy. Efekt ZMIENIA SIĘ przy upgrade: Kuźnia żelaza 0% → Wielka Kuźnia +23%. Literówka w kategorii. |
| Akademia (10) | Nauka | brak opisu | działa → dolicza do Pracy (nie do nauki) |
| Pretorium (5) | Administracja | „% do przychodu podatkowego" | działa → dolicza do **Pracy**, nie do podatków |

## NOWE ZNALEZISKA (poza mnożnikiem)
1. **`utrzymanie` per budynek jest w praktyce nieaktywne.** `econ-params.json` (`utrzymanie_budynek`: easy 1 / normal 1 / hard 2)
   ustawia `budynekUtrzymanieFlat`, które ZAWSZE wygrywa z polem `utrzymanie` z JSON (nigdy nie jest czyszczone).
   → Każdy budynek kosztuje płasko 1 (lub 2 na hard), mimo że UI pokazuje wartości 0–5. Udokumentowane jako placeholder v0.1.
2. **`odblokowuje`** (mury/fort/warsztat_oblezniczy) — martwe pole, nawet nie w typie; zmiana wartości nic nie robi.
3. **Wielka Kuźnia** — `epokaWejscia: 4`, a gra ma 3 epoki → **nieosiągalna**, ale bez adnotacji „PARKOWANIE" (Lazaret ją miał).
   Jako jedyna nie ma `koszt_surowce`. Jej konwerter stali (`converters.ts:62`) to w efekcie martwy kod.
4. **`wikiBundle.json` (Civpedia) niesprawdzony** — może niezależnie powielać te same martwe obietnice.

## RANKING PILNOŚCI (od najbardziej mylącego dla gracza)
1. Panel „Statystyki (silnik)" pokazujący martwy `przyrost` — naprawia refaktor liniowy
2. Mnożniki wojskowe (5 budynków) — chip w UI, zero efektu → zastępowane dwiema ścieżkami ulepszeń jednostek
3. Wielka Kuźnia vs Kuźnia żelaza — niespójna kategoria przy upgrade
4. Targowisko — zero efektu na zawsze
5. Akademia / Pretorium — efekt trafia w inny strumień niż obiecany
6. Pretorium `obrona` — chip w UI, zero konsumpcji (decyzja 16A: usunąć)
7. `odblokowuje` — ryzyko dla przyszłych edycji danych
8. `przyrostKosztu`/`przyrostUtrzymania` w UI kosztów
9. `utrzymanie` zróżnicowane pod flat-override
10. Wielka Kuźnia zaparkowana bez adnotacji
