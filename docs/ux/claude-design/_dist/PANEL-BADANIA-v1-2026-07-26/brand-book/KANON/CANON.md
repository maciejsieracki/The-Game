# THE GAME · 1E — BAZA WIEDZY / KANON (stan aktualny)

Data: 2026-07-23
Cel: jedno źródło prawdy dla integratora. **Tylko najświeższe wersje** każdego ekranu.
Iteracje, które coś zastąpiło, NIE są tu dołączone (lista na dole).

Styl 1E: złoto `#e8d88a` · pergamin · outline SVG · Georgia (nagłówki) + Segoe UI (treść) · zero emoji.

Decyzje 2026-07-23 (POLE BITWY TW v5): panele HUD ~70% + blur (teren widoczny pod spodem) · toolbary ikonowe z podpisem na hover · tempo/pauza/AUTO przy minimapie · muzyka/dźwięk/pomoc pod ikoną ustawień obok „Wycofaj się" · strzałka „↓" przy „Ty" USUNIĘTA (etykieta „atakujący/obrońca") · cluster liczb top-baru NIE lustrzany.

---

## STRUKTURA PACZKI
```
KANON/
  START - KANON aktualny (1E).dc.html   ← indeks-hub, otwórz to
  CANON.md                              ← ten plik
  support.js                            ← runtime dla .dc.html
  mockupy/                              ← wszystkie ekrany (najnowsze wersje)
  eksport/                              ← tokeny + mapy + SVG do wpięcia w kod
    tokens.css / tokens.json            ← zmienne stylu
    motion.css / menu-*.css             ← animacje, tło menu
    icons/                              ← wszystkie SVG (res-*, ui-*, tb-*, chip-*, cp-*, dip-*)
    icons/units|buildings|civilizations|epochs|improvements|settings|tier1..7
    *-icon-map.json                     ← mapowanie id → plik SVG
    HANDOFF.md                          ← nota dla programisty
```

---

## MAPA: EKRAN → PLIK (KANON)

### Fundament
| Ekran | Plik |
|---|---|
| Design System | mockupy/The Game - Design System v1 (1E).dc.html |
| Komponenty | mockupy/The Game - Komponenty (1E).dc.html |
| Ikony (biblioteka) | mockupy/The Game - Ikony (biblioteka 1E).dc.html |
| HUD Kit | mockupy/The Game - HUD Kit (1E).dc.html |
| Motion | mockupy/The Game - Motion (1E).dc.html |

### Menu / meta
| Ekran | Plik |
|---|---|
| Menu główne | mockupy/The Game - Ekran Menu Hero (1E).dc.html |
| Intro | mockupy/The Game - Ekran Intro Hero (1E).dc.html |
| Kreator nowej gry | mockupy/The Game - Ekran Kreator (1E).dc.html |
| Kreator — kroki | mockupy/The Game - Kreator Kroki (1E).dc.html |
| Koniec — zwycięstwo | mockupy/The Game - Ekran Koniec Gry (1E).dc.html |
| Koniec — porażka | mockupy/The Game - Koniec Porazka (1E).dc.html |

### Ekrany pełne
| Ekran | Plik |
|---|---|
| Badania — panel wyboru (STARE, 2026-07-01) | mockupy/The Game - Ekran Badania (1E).dc.html |
| Dyplomacja — lista frakcji | mockupy/The Game - Ekran Dyplomacja (1E).dc.html |
| **Dyplomacja — panel negocjacji (TW v1.1)** | mockupy/The Game - Dyplomacja panel negocjacji v1.1 -1E-.dc.html |
| **Pre-battle — nakładka na mapie (TW v1.1)** | mockupy/The Game - PreBattle nakladka v1.1 (1E).dc.html |
| **Badania — drzewko technologii SIATKA (v1.1)** | mockupy/The Game - Drzewko technologii siatka v1.1 (1E).dc.html |
| **Cuda świata — galeria Antyku (v1)** | mockupy/The Game - Cuda swiata v1 (1E).dc.html |
| **Surowce — Magazyn Państwa + formy (v1)** | mockupy/The Game - Surowce magazyn i formy v1 (1E).dc.html |
| **Badania — panel boczny (v1, KANON)** | mockupy/The Game - Panel boczny Badania v1 (1E).dc.html |
| **Karta budynku — Mennica (v2, wzorzec stanów)** | mockupy/The Game - Karta budynku Mennica v2 (1E).dc.html |
| Wojsko | mockupy/The Game - Ekran Wojsko (1E).dc.html |

### HUD mapy świata
| Ekran | Plik |
|---|---|
| HUD layout | mockupy/The Game - HUD Mapy layout (1E).dc.html |
| HUD panele stany | mockupy/The Game - HUD Panele stany (1E).dc.html |
| HUD jednostka wybrana | mockupy/The Game - HUD Jednostka wybrana (1E).dc.html |
| HUD miasto wybrane | mockupy/The Game - HUD Miasto wybrane (1E).dc.html |
| A-08 Tryb budowy ulepszeń | mockupy/The Game - A08 Tryb budowy ulepszen (1E).dc.html |
| A-04 Panel kontekstu heksu | mockupy/The Game - A04 Panel heks kontekst (1E).dc.html |

### Miasto (W3)
| Ekran | Plik |
|---|---|
| Miasto W3 (chrome + 4 klatki) | mockupy/The Game - Ekran Miasto W3 v3 (1E).dc.html |
| Miasto — 6 klatek raila | mockupy/The Game - Miasto Zakladki W3 6klatek (1E).dc.html |

### Flow walki (grupa C)
| Ekran | Plik |
|---|---|
| C-01 Pre-bitwa | mockupy/The Game - C01 Pre-bitwa v3 (1E).dc.html |
| **POLE BITWY — TW v5** (ręczna · AUTO · deploy, 6 klatek) | mockupy/The Game - C06 Pole bitwy odswiezenie (1E).dc.html |
| C-06 Popup strategia | mockupy/The Game - C06 Popup Strategia v4 (1E).dc.html |
| C-09 Roster jednostek (interakcje grup) | mockupy/The Game - C09 Roster lewy panel v4 (1E).dc.html |
| C-04 Atak na miasto (modal) | mockupy/The Game - C04 Atak miasto wybor v2 (1E).dc.html |
| C-05 Panel oblężenia (modal) | mockupy/The Game - C05 Panel oblezenie v2 (1E).dc.html |
| A-19 Miasto zdobyte | mockupy/The Game - A19 Miasto zdobyte v2 (1E).dc.html |
| C-23 Szczegóły bitwy (TW v5) | mockupy/The Game - C06 Pole bitwy odswiezenie (1E).dc.html — klatka 4 |
| C-12 Koniec bitwy (TW v5) | mockupy/The Game - C06 Pole bitwy odswiezenie (1E).dc.html — klatka 5 |
| Popupy deploy (zbiorczy) | mockupy/The Game - Popupy deploy v5 (1E).dc.html |

### Infografiki / ikony
| Ekran | Plik |
|---|---|
| Jednostki — infografiki | mockupy/The Game - Jednostki infografiki kanon v1 (1E).dc.html |
| Budynki — infografiki | mockupy/The Game - Budynki infografiki kanon v1 (1E).dc.html |
| Atlas ikon bitwy + jednostek | mockupy/The Game - Atlas ikon bitwy i jednostek (1E).dc.html |

### Panele danych
| Ekran | Plik |
|---|---|
| Panel Moc imperium | mockupy/The Game - Panel Moc imperium v3 (1E).dc.html |

---

## ODRZUCONE ITERACJE (NIE używać — zastąpione)
- C06 Deployment v4 · C07 Pole HUD bitwy v2 · C23 Szczegóły v1 · C12 Koniec v3 (wizualnie)  → zastąpione **POLE BITWY TW v5** (2026-07-23)
- Design System — Warianty (eksploracja kierunków)
- Ekran Menu (bez hero), Ekran Miasto (1E), Ekran Miasto W3 (baza)
- Miasto Zakładki W3 v1 / v2 / cz2  → zastąpione „6 klatek"
- C01 Pre-bitwa v2, C02 Rozstawienie v2, C06 Deployment v2
- C09 Karty jednostek v2  → zastąpione Roster v4
- C12 Koniec bitwy v2  → v3
- C04 Oblezenie v2, C05 Szturm muru v2 (HUD-only)  → zastąpione modalami C04/C05 v2
- Moc imperium v1 / v2, Panel Moc klikalny (v2/v3 .html)  → v3 (.dc.html)
- Katalog ikon bitwy, Przeglad poprawek ikon bitwy  → zastąpione Atlasem
- Ekran Walka, Walka Warianty  → zastąpione flow C
- Wszystkie pliki „Przeglad …" (pomoce robocze, nie deliverable)

## DO WERYFIKACJI
- **Menu**: w kanonie „Menu Hero". Jeśli w grze jest wariant „menu lewo / grafika prawo" pod inną nazwą — potwierdź i podmienię.
