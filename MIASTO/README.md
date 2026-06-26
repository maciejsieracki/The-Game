# MIASTO/ — pliki sesji Civ-MIASTO (miasto + produkcja + budynki + społeczeństwo)
Wszystkie NIE-grające pliki, za które odpowiada MIASTO, w jednym miejscu (panele sterowania, dokumentacja, makiety).
Pliki GRY (kod + JSON) zostają w `gra/` — patrz niżej. Pliki kanału (raporty/handoff) zostają w `dyspozycje/`.

## Zawartość katalogu
| Plik | Co to |
|---|---|
| `MIASTO-DOKUMENTACJA-DEWELOPERSKA.md` | Pełna dokumentacja deweloperska (architektura, moduły, reguły, parametry, zależności, interakcje z działami, komendy). |
| `Panel-przeglad-danych.xlsx` | **Jedno źródło strojenia** — edytowalny panel WSZYSTKICH danych gry (moje zakładki: Budynki, Spoleczenstwo, Miasto-parametry). Eksport → JSON: `python3 gra/tools/export-panel.py`. |
| `Panel-przeglad-danych.html` | Read-only dashboard (podgląd wszystkich JSON). Generuje: `python3 gra/tools/gen-dashboard.py` (zapis tutaj). |
| `Budynki.xlsx` | Panel źródłowy budynków (→ `gra/data/buildings.json`). |
| `Spoleczenstwo-parametry.xlsx` | Panel źródłowy społeczeństwa (zdrowie/szczęście/kultura/religia/porządek → `gra/data/society-params.json`). |
| `Schemat-dzialania-miasta.md` | Specyfikacja ekranu/mechaniki miasta (źródło projektowe). |
| `Spec-spoleczenstwo.md` | Specyfikacja społeczeństwa (szczęście/zadowolenie). |
| `Widok-miasta.html` | Makieta wizualna ekranu miasta (referencja projektowa). |

## Pliki GRY (NIE w tym katalogu — część buildu)
- Kod: `gra/src/game/cities.ts`, `production.ts`, `order.ts`, `culture-religion.ts`.
- Dane (import przez Vite): `gra/data/buildings.json`, `society-params.json`, `miasto-params.json`.
- Narzędzia: `gra/tools/gen-panel-xlsx.py`, `gen-dashboard.py`, `export-panel.py`, `logic-test.cjs`.

## Pliki KANAŁU (zostają w `dyspozycje/`)
- `dyspozycje/MIASTO.md` (dyspozycje od mastera — czyta też scheduled self-check), `dyspozycje/MIASTO-DO-MASTERA.md` (raporty), `dyspozycje/MIASTO-ZAKRES-I-PLAN.md`.
- Handoffy: `dyspozycje/_handoff/MIASTO-do-SILNIK_integracja.md`, `MIASTO-do-UI_kontrakt-produkcji.md`.

## Archiwum (historyczne, mojego tematu — nieużywane)
- `archiwum/Spoleczenstwo-parametry.xlsx.bak-d4` (stary backup panelu społeczeństwa).
- `archiwum/Szablon-miasta-i-mapy.md`, `archiwum/Makieta-widok-miasta.html` (wcześniej zarchiwizowane makiety miasta).
