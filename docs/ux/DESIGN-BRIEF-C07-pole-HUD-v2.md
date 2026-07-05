# Design Brief — C-07…C-12 Pole bitwy + HUD (jeden mockup 1E)

**Od:** Maciej / Lane UI  
**Do:** Design (brand-book 1E)  
**Data:** 2026-07-03  
**Priorytet:** P0 — **następny po C-06 v2** ✅  
**Poprzedni deliverable:** `docs/ux/claude-design/The Game - C06 Deployment v2 (1E).dc.html` ✅

---

## Cel

**Jeden ekran 1920×1080** pokrywający **cały HUD fazy walki** (po „Start walki” z C-06): pole 3D jako tło statyczne + wszystkie nakładki UI w stylu **1E** (spójne z C-01 i C-06).

**Deliverable:** `docs/ux/claude-design/The Game - C07 Pole HUD bitwy v2 (1E).dc.html`

**Zakres ID w tym pliku:** C-07 (pole) · C-08 (górny pasek) · C-09 (dolny pasek komend) · C-10 (prędkość) · C-11 (log) · C-12 (pionowe morale boki) · **P1 opcjonalnie:** C-17 minimapa lewy dół · C-18 tooltip hover

**Nie w tym mockupie:** C-15 panel ręczny, C-16 roster, C-21 koniec — osobne pliki później.

---

## Kontekst w grze

1. Gracz przeszedł C-06 → klik **Start walki**  
2. Pole 3D wypełnia ekran (heksy, jednostki po obu stronach)  
3. HUD nakładany przez `gra/src/battle/battleScene.ts` — dziś **programistyczny** (emoji, brąz, sans-serif)

**Playtest baseline:** `Gra-podglad-BITWA.html` → **T** → **Start walki** (lub pomiń deployment jeśli preset pozwala)  
**Screenshot PRZED:** `docs/ux/baseline/C/C-07_pole-bitwy.png` (Maciej może uzupełnić)

---

## Layout ekranu (1920×1080)

```
┌─────────────────────────────────────────────────────────────┐
│ GÓRNY PASEK (C-08) — pełna szerokość, ~56–72px              │
│ Tura 12 · ×8 · [PAUZA]  │  ATK morale VS OBR  │  Pomiń Wyjście│
├─┬─────────────────────────────────────────────────────────┬─┤
│A│ Prędkość ×4 (C-10)          LOG starć (C-11)            │O│
│T│ lewy górny pod paskiem      prawy górny panel           │B│
│K│                                                         │R│
│ │              POLE BITWY 3D (C-07)                        │ │
│ │         heksy · jednostki · rzeka opcjonalnie           │ │
│ │                                                         │ │
│ │  [minimapa C-17 opcjonalnie lewy dół]                   │ │
│ └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ DOLNY PASEK KOMEND (C-09) — wycentrowany, zaokrąglony górą  │
│ Pauza·Prędkość | Auto/R·Stop·Wycofaj | Paski·Dźwięk | Pomiń·ESC │
└─────────────────────────────────────────────────────────────┘
```

**Tło pola:** jak C-06 ale **cała mapa widoczna** (bez podziału deployment / mgła tylko na niewidocznych heksach opcjonalnie). Kilka figur po obu stronach, heksy, lekka rzeka — statyczny placeholder 3D.

---

## C-08 Górny pasek (szczegóły)

| Strefa | Zawartość | Przykład |
|--------|-----------|----------|
| **Lewo** | Faza/tura + badge prędkości + opcjonalnie „‖ PAUZA” | `TURA 12` · `×8` |
| **Środek** | Morale obu armii + VS + liczniki strat | `ATK: 4/33` · pasek morale ATK · **VS** · pasek OBR · `OBR: 7/50` |
| **Prawo** | Przyciski outline 4C | **Pomiń** · **Wyjście** |

Kolory stron (**decyzja 2026-07-03**, patrz `DECYZJA-C-kolory-stron-bitwa.md`):

| Strona | Hex | Etykieta |
|--------|-----|----------|
| **Ty (gracz / ATK w typowym flow)** | `#3a6ad0` | `ATK · Ty` |
| **Wróg (OBR)** | `#c84040` | `OBR · wróg` |

Akcent złoto `#e8d88a`. **Bez zieleni** na paskach HP strony gracza.

Pasek morale w środku: poziome tracki 64×8px, fill zielony→czerwony (jak dziś, ale w ramce 1E).

---

## C-09 Dolny pasek komend

**9 przycisków** — ikona **SVG 24px** + skrót klawisza (nie emoji):

| # | Skrót | Etykieta PL | Tooltip (hint) |
|---|-------|-------------|----------------|
| 1 | **P** | Pauza | Pauza / Wznów |
| 2 | **S** | Prędkość | Cykl 1→2→4→…→512 |
| 3 | **R** | Auto/Ręczne | Przełącz tryb sterowania |
| 4 | **STOP** | Stop | Stój / broń pozycji (zaznaczeni) |
| 5 | **W** | Wycofaj | Wycofaj zaznaczonych |
| 6 | **H** | Paski | Paski HP/Morale nad figurkami |
| 7 | **M** | Dźwięk | Dźwięk on/off |
| 8 | **POMIN** | Pomiń | Pomiń do wyniku |
| 9 | **ESC** | Wyjście | Wyjdź z bitwy |

Separatory pionowe między grupami (jak C-06). Panel: `linear-gradient(180deg,#161c28,#0a0d14)`, obrys złoty góra, `border-radius` góra 10px.

**Ikony do eksportu** (folder `eksport/icons/`): `cmd-pause`, `cmd-speed`, `cmd-auto-manual`, `cmd-hold`, `cmd-retreat`, `cmd-bars`, `cmd-sound`, `cmd-skip`, `cmd-exit` — 24 + 40 px.

---

## C-10 Prędkość (lewy górny, na polu)

Pod górnym paskiem, lewy róg mapy:

- Etykieta: **Prędkość: ×4** (lub `Predkosc: 4x` — ujednolić z PL w grze)
- Mały panel ciemny, obrys zielony subtelny, **nie** emoji

---

## C-11 Log starć (prawy górny)

Panel ~180px szerokości, max ~46% wysokości:

- Nagłówek: **Ostatnie starcia**
- 2–3 przykładowe linie monospace:
  - `Legionariusz → Tarczownik: −12 HP`
  - `Łucznik → Kawaleria: −8 HP (rout)`
- Tło półprzezroczyste, ramka 1E

---

## C-12 Pionowe paski morale armii

- **Lewa krawędź:** 24px szerokości, czerwona ramka, etykieta **ATK**, fill od dołu (np. 78%)
- **Prawa krawędź:** niebieska ramka, **OBR**, fill np. 62%
- Fill zielony→czerwony jak w kodzie

---

## Opcjonalnie P1 (jeśli czytelnie)

| ID | Element |
|----|---------|
| **C-17** | Minimapa lewy dół (~120×80), siatka heksów, prostokąt viewport |
| **C-18** | Dymek tooltip nad jednostką: nazwa · HP · typ |

---

## Styl (must)

- **Spójność z C-01 v2 + C-06 v2** — te same tokeny, Georgia tytuły, panel 5C, przyciski 4C  
- **Zero emoji** w finalnym mockupie  
- Tytuł bitwy u góry środka opcjonalnie: „Bitwa o Kapuę” (jak C-06)  
- Stopka: `The Game · C-07 Pole HUD · 1E`

---

## Referencje

| Plik | Rola |
|------|------|
| `The Game - C06 Deployment v2 (1E).dc.html` | Styl paneli dolnych |
| `The Game - C01 Pre-bitwa v2 (1E).dc.html` | Primary / secondary buttons |
| `docs/ux/figma/grupa-C/FIGMA-FRAMES-C.html` | Wireframe C-07…C-09 (layout) |
| `archiwum/Makieta-ekran-bitwy.html` | Stary layout — nie kolory |
| `gra/src/battle/battleScene.ts` | Źródło prawdy elementów HUD |

---

## DoD Design

- [ ] Plik `.dc.html` 1920×1080 z polem + pełnym HUD C-07…C-12  
- [ ] Dolny pasek: SVG zamiast emoji (⏸⏩🎮…)  
- [ ] Spójność obok C-06 (Maciej side-by-side)  
- [ ] Opcjonalnie: minimapa + tooltip  
- [ ] Meldunek: **„C-07 v2 gotowy”** + ścieżka

---

## Po Design

1. Maciej akceptacja  
2. Lane UNITS/UI: port stylu w `battleScene.ts` (batch — nie w tym dokumencie)  
3. Następny mockup: **C-15…C-16 tryb ręczny** lub **C-21 koniec bitwy** (wg listy)
