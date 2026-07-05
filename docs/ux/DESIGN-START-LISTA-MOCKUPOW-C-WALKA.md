# START Design — mockupy Grupy C (Walka / Bitwa)

**Od:** Maciej (decydent) · koordynacja Lane UI  
**Do:** Design (brand-book 1E)  
**Data startu:** 2026-07-03  
**Priorytet:** P0 redesign UX walki — spójność z HUD mapy 1E (złoto, pergamin, outline 4C, ramka 5C)

---

## 1. Co budujesz (kolejność obowiązkowa)

| Kolejność | ID | Nowy plik mockupu (docelowy) | Opis | Pri |
|-----------|-----|------------------------------|------|-----|
| **1** | **C-01** | `docs/ux/claude-design/The Game - C01 Pre-bitwa v2 (1E).dc.html` | Pre-bitwa | **✅ GOTOWE Design 2026-07-03** |
| **2** | **C-06** | `The Game - C06 Deployment v3 (1E).dc.html` | Deployment + **HUD pola** (v3) | **✅ v3 + kolory 2026-07-03** |
| **3** | **C-07…C-12** | *(w v3 lub osobny plik)* | Uzupełnienia / rozbicie — log, tooltip | **🟡 część w v3** |
| **4** | **C-15…C-16** / Design **„C-09 Karty”** | `The Game - C09 Karty jednostek v2 (1E).dc.html` | Roster TW 3 rzędy + karta szczegółów L-dół | **✅ 2026-07-03** |
| **5** | **C-17** | *(w C-06 v3)* | Minimapa lewy dół | 🟡 w v3 |
| **6** | **C-18** | *(osobny lub później)* | Tooltip hover jednostki | P2 |
| **7** | **C-12** / C-21…C-23 | `The Game - C12 Koniec bitwy v2 (1E).dc.html` | Wieniec, ZWYCIĘSTWO, karty, Bohater, Szczegóły / Powrót | **✅ 2026-07-03** |
| **8** | **C-04** | `The Game - C04 Oblezenie v2 (1E).dc.html` | HUD oblężenia wokół pola 3D (integralność, siły, Ostrzał/Czekaj/Szturm) | **✅ 2026-07-03** |
| **9** | **C-05** | `The Game - C05 Szturm muru v2 (1E).dc.html` | Szturm muru: punkty szturmu, obrona, Drabiny/Wieża/Szturm przez wyłom | **✅ 2026-07-03** |

**Status serii:** **Grupa C (walka) Design — KOMPLET** (7 ekranów 1E, zero emoji) · 2026-07-03

| Ekran Design | Plik |
|--------------|------|
| C-01 Pre-bitwa | `The Game - C01 Pre-bitwa v2 (1E).dc.html` |
| C-02/C-06 Deployment | `C02 Rozstawienie v2` · `C06 Deployment v3` |
| C-07 Pole HUD | *(w C06 v3)* |
| C-09 Karty | `C09 Karty jednostek v2` |
| C-12 Koniec bitwy | `C12 Koniec bitwy v2` |
| C-04 Oblężenie | `C04 Oblezenie v2` |
| C-05 Szturm muru | `C05 Szturm muru v2` |

**Hub Design (opcjonalnie):** kafelki **Walka — warianty** w `The Game — Przegląd (1E).dc.html` (REQ-005 HUB-04).

**Mapowanie ID:**
- Design **C09 Karty** = lane **C-15 + C-16** (nie dolny pasek komend C-09).
- Design **C-04/C-05** (pole oblężenia) = lane **C-19/C-20** · szczegóły: `DESIGN-MAPOWANIE-C04-C05-vs-lane.md`
- Lane **C-04/C-05 mapa** (`cityAttackChoice`, `siegeMapPanel`) = osobny flow mapy — bez mockupu v2 w tej serii.

---

## 1b. Równoległa paczka — A-08 Ulepszenia (P1, nie zapomnieć)

| ID | Plik docelowy | Opis | Status |
|----|---------------|------|--------|
| **A-08** | `The Game - A08 Tryb budowy ulepszen (1E).dc.html` | Panel 🔨 + banner 1E | ⬜ START |
| **A-08-icons** | `eksport/icons/improvements/` + `improvement-icon-map.json` | 10 SVG jest · **~6–8 brakuje** · brak 40px | 🟡 uzupełnić |

Brief: `docs/ux/DESIGN-BRIEF-A08-ulepszenia-ikony-i-panel.md` · wklejka: `WKLEJKA-DESIGN-START-A08-ulepszenia.md`

**W grze dziś:** `buildModeHud.ts` = emoji — lane UI czeka na Design.

---

## 2. Referencje — co już jest (NIE kasuj, czytaj)

### Mockupy HTML (design / dev)

| Plik | Rola | Uwaga |
|------|------|-------|
| `UI/Makieta-preBattle.html` | **C-01 v1** — kanon TW 2026-06 | Baza do **v2** — ujednolicić z 1E |
| `Civ-UNITS/Makieta-przed-bitwa.html` | Redirect → powyżej | — |
| `archiwum/Makieta-ekran-bitwy.html` | Stary prototyp HUD bitwy | Inspiracja layoutu, **nie** kolorystyka finalna |
| `UI/Makieta-panel-armii.html` | Lista armii (D7) | P2 — osobny temat, nie blokuje C |
| `Civ-UNITS/Makieta-pasek-armii.html` | Pasek składu | Reference tylko |

### Playtesty dev (screenshot baseline, nie mockup Design)

| Plik | Co pokazuje |
|------|-------------|
| `Gra-podglad-BITWA.html` | Pole 3D + obecny HUD (programistyczny) |
| `Gra-podglad-OBLEZENIE-BITWA.html` | Bitwa z oblężeniem |
| `Gra-podglad-MUR-BITWA.html` | Mur na polu |
| `Gra-podglad.html` + atak / klawisz **T** | Flow mapa → pre-bitwa → bitwa |

### Dokumentacja

| Plik | Cel |
|------|-----|
| `docs/ux/DESIGN-BRIEF-C-preBattle-faza1.md` | Brief szczegółowy **C-01** |
| `docs/ux/REJEST-UX-MASTER.md` | § Grupa C — pełna lista C-01…C-28 |
| `docs/grupa-c/04-mockupy-INDEX.md` | Indeks mockupów C |
| `docs/ux/claude-design/…/brand-book-1E/DYSPOZYCJA.md` | § A7 Grupa C + tokeny DS-01…DS-08 |
| `docs/ux/claude-design/00-brand-book-pakiet/01-dokumenty/02-SPEC-IKONY.md` | Reguły SVG (line-art, currentColor) |
| `docs/ux/baseline/C/` | Screenshoty **PRZED** (Maciej uzupełni) |

### Spójność wizualna (must)

- Tokeny: `brand-book-1E/eksport/tokens.css` · `--civ-gold-primary`, `--civ-panel-bg`, nauka `#5a9bd4`
- HUD mapy: `UI/Makieta-HUD-mapa-swiata.html`, `UI/Makieta-HUD-D1B-preview.html`
- Panel miasta W3: mockup Design „Ekran Miasto W3 (1E)”
- **Zakaz emoji** w finalnych mockupach — SVG z brand-book

---

## 3. Ikony SVG do dostarczenia (walka)

Folder: `brand-book-1E/eksport/icons/` (24 + 40 px)

| ID | Opis | Użycie |
|----|------|--------|
| `act-battle-auto` | Błyskawica / szybki wynik | C-01 Auto |
| `act-battle-manual` | Skrzyżowane miecze | C-01 Bitwa ręczna |
| `act-battle-retreat` | Strzałka wstecz | C-01 Wycofaj |
| `act-battle-save` | Zapis / scroll | C-01 Zapisz |
| `fmt-deploy-f1` | Formacja 1 (dystans przód) | C-06 |
| `fmt-deploy-f2` | Formacja 2 (wąski front) | C-06 |
| `fmt-deploy-f3` | Formacja 3 (rozproszona) | C-06 |
| `cmd-pause` / `cmd-speed` / … | Komendy dolnego paska | C-09 |

*(Unit miniatury — opcjonalnie w C-01 kartach: reuse tier units z brand-book)*

---

## 4. Deliverables per mockup (checklist Design)

Każdy plik `Makieta-*-v2.html`:

- [ ] Design System 1E (tokeny, fonty 2C, przyciski 4C, panele 5C)
- [ ] Interaktywny (klik → toast / highlight stanu)
- [ ] `mockup-embed.js` jeśli ma iść do huba preview
- [ ] Screenshot → `docs/ux/after/C/{ID}_….png`
- [ ] Krótki wpis w `brand-book-1E/DYSPOZYCJA.md` (status done)

---

## 5. Czego NIE projektujesz w tej paczce

- Logika walki, balans, AI — lane UNITS/SILNIK
- `gra/src/*` — lane UI portuje **po** akceptacji mockupu
- Panel armii D7 (`Makieta-panel-armii`) — osobny sprint
- ManualBattle C-28 — nieużywany w silniku

---

## 6. Po każdym mockupie

1. Design melduje: **`C-XX mockup v2 gotowy`** + ścieżka pliku  
2. Maciej: playtest HTML + ewentualne ABC (pytania w brief C-01)  
3. Lane UI: port do TS  
4. **MASTER:** build kanon (nie Design, nie lane)

---

## 7. Kontakt / pliki startowe (3 linki dla Design)

1. **Ten dokument** — pełna lista  
2. **`docs/ux/DESIGN-BRIEF-C-preBattle-faza1.md`** — szczegóły pierwszego ekranu  
3. **`UI/Makieta-preBattle.html`** — otwórz w przeglądarce jako punkt wyjścia v2
