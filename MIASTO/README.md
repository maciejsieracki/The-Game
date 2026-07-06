# MIASTO/ — pliki sesji Civ-MIASTO (miasto + produkcja + budynki + społeczeństwo)
Wszystkie NIE-grające pliki, za które odpowiada MIASTO/EKONOMIA (Grupa B), w jednym miejscu (panele sterowania, dokumentacja, makiety).
**Hub operacyjny Grupy B:** `docs/grupa-b/` (audyt, STAN, indeks handoffów).
Pliki GRY (kod + JSON) zostają w `gra/` — patrz niżej. Pliki kanału (raporty/handoff) zostają w `dyspozycje/`.

## Panel balansu (Grupa B)

**Hub:** `panele-sterowania/Panel-B.xlsx` (zastępuje rozproszone Excel-e poniżej).  
Instrukcja: `docs/grupa-b/PANEL-B-SPEC.md` · archiwum starych paneli: `docs/archiwum/panele-miasto-legacy/README.md`

## Zawartość katalogu (legacy / dokumentacja)
| Plik | Co to |
|---|---|
| `MIASTO-DOKUMENTACJA-DEWELOPERSKA.md` | Pełna dokumentacja deweloperska (architektura, moduły, reguły, parametry, zależności, interakcje z działami, komendy). |
| `Panel-przeglad-danych.xlsx` | **LEGACY** — zastąpione przez `panele-sterowania/Panel-B.xlsx` |
| `Panel-przeglad-danych.html` | Read-only dashboard (podgląd wszystkich JSON). Generuje: `python3 gra/tools/gen-dashboard.py` (zapis tutaj). |
| `Budynki.xlsx` | Panel źródłowy budynków (→ `gra/data/buildings.json`). |
| `Spoleczenstwo-parametry.xlsx` | Panel źródłowy społeczeństwa (zdrowie/szczęście/kultura/religia/porządek → `gra/data/society-params.json`). |
| `Schemat-dzialania-miasta.md` | Specyfikacja ekranu/mechaniki miasta (źródło projektowe). |
| `Spec-spoleczenstwo.md` | Specyfikacja społeczeństwa (szczęście/zadowolenie). |
| `Widok-miasta.html` | Makieta wizualna ekranu miasta (referencja projektowa). |
| `Ulepszenia-terenu.xlsx` | Panel 15 ulepszeń terenu (→ `gra/data/terrain-improvements.json`). **Decyzja A4-D4-Q1=A** (2026-06-27) — referencja, nie blokuje. Regeneracja: `python gra/tools/gen-ulepszenia-xlsx.py`. |
| `Ulepszenia-terenu-spec.md` | Spec bonusów/kosztów ulepszeń (podział MAPA/MIASTO/SILNIK). |

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
