# Design Brief — C-06 v4 · mapa bitwy + HUD deployment (sync z kanonem)

**Od:** Maciej / MASTER  
**Do:** Design (Claude Design · styl 1E)  
**Data:** 2026-07-03  
**Hasło:** `START — C06-v4-map-redesign`  
**Priorytet:** P0 — **po reconcile kanonu** (`153fcda2…`)

---

## Cel

**C-06 Deployment v3** jest **nieaktualny** względem gry w kanonie. Potrzebny **v4** — jeden ekran 1920×1080: **pole bitwy 3D (placeholder) + pełny HUD deploymentu** zgodny z tym, co gracz widzi dziś po **C-01 → Pole bitwy**.

**Deliverable:** `docs/ux/claude-design/The Game - C06 Deployment v4 (1E).dc.html`  
**v3:** zostaje archiwum (nie edytuj).

---

## Jak zobaczyć stan gry (PRZED)

| Sposób | Ścieżka |
|--------|---------|
| **Kanon** | `gra-kanon/START.html` → nowa gra → **T** (test bitwy) → C-01 → **Rozegraj ręcznie** |
| **Pole bitwy only** | `Gra-podglad-POLE-BITWY.html` (Ctrl+F5) |
| **Mockup v3 (stary)** | `docs/ux/claude-design/The Game - C06 Deployment v3 (1E).dc.html` |

**Screenshoty baseline (Maciej opcjonalnie):** `docs/ux/referencje-c06-kanon/` — PNG z kanonu do porównania.

---

## Co MUSI się zmienić w v4 (sync z kodem / Master)

Te elementy **są już w kanonie** — mockup v4 ma je **pokazać wizualnie** (nie tylko placeholder tekst):

### Mapa / pole 3D (ramka mockupu)

| Element | v3 | v4 (kanon) |
|---------|-----|------------|
| Rozmiar strefy gry | ~pełne pole | **~50% środka mapy** · margines nieprzejezdny · **złota obwódka** granicy walki |
| Podział ATK/OBR | pionowe pasy boczne | **niebieska kreska lewa** · **czerwona prawa** przy linii podziału (nie tylko mgła) |
| Pan kamery | brak hintu | opcjonalny hint: **WASD / strzałki** (przesuwanie widoku) |
| Jednostki na mapie | sylwetki | **złote ramki grup** + **numer grupy** (1, 2, 3…) na członkach |
| Drag ghost | — | **płaski dysk** (nie cylinder 3D) — styl 1E |

### Belki morale (NOWE w v4)

| v3 | v4 |
|----|-----|
| Krótki pasek przy lewym panelu | **Pełna wysokość ekranu:** lewa krawędź **niebieska (TY)** · prawa **czerwona (WRÓG)** |

### Dolny roster / zaznaczanie (C-09 + deploy)

- **Dock kart jednostek** na dole (3 rzędy TW) — spójny z `C09 Karty jednostek v2 (1E).dc.html`
- **Pasek szybkiego zaznaczania** nad rosterem: **`1` `2` `3`** (grupy) · **Konnica / Piechota / Łucznicy** · **Wszystkie**
- Klik w członka grupy = cała grupa (Ctrl = pojedyncza) — **hint w panelu**, nie nowa mechanika

### Panel centralny „Faza rozstawiania”

Zachować z v3 (F1–F3 SVG, Reset, Grupuj, Start walki) — **polish 1E** bez emoji.

**Po Start:** gra idzie w tryb **ręczny** (nie auto-ruch) — opcjonalny mały hint: **Spacja = tura** · **R = AUTO** (C2-FLOW).

### Górny HUD (C-07)

Zachować v3 (Przygotowanie, VS, Ty/wróg, Pomiń, Wyjście) — kolory: **Ty `#3a6ad0`** · **wróg `#c84040`** · złoto 1E.

### Dolny pasek komend (SVG)

Jak v3 + batch 2: **P · R · Stop · H · M · Pomiń · ESC** — ikony line SVG (bez emoji).

---

## Co NIE zmieniać (logika gry)

- Kolejność flow: **C-01 pre-bitwa v3** → deployment → Start → walka (C-07+)
- F1/F2/F3 etykiety PL (Dystans-przód, Melee-przód, Oblężenie)
- Strefa ATK tylko lewa połowa · mgła wojny prawa

---

## Styl 1E (zamknięte)

Tokeny: `docs/ux/pakiet-design-W3-v2/styl-1E/tokens.css` · HUD Kit 1E  
Kolory stron: `dyspozycje/_handoff/DESIGN-do-UNITS_kolory-stron-bitwa.md`  
Pre-bitwa referencja: `C01 Pre-bitwa v3 (1E).dc.html`

---

## DoD Design

- [ ] Nowy plik **C06 Deployment v4 (1E).dc.html** (1920×1080)
- [ ] Wszystkie punkty sekcji „MUSI się zmienić” widoczne na mockupie
- [ ] Zero emoji · SVG line icons · typografia jak C-01 v3
- [ ] Stopka: `The Game · C-06 Deployment v4 · 1E`
- [ ] Handoff zwrotny: krótki `DESIGN-do-UI_C06-v4.md` + ścieżka pliku

**Po v4:** lane UNITS/UI porównuje z `Gra-podglad-POLE-BITWY.html` — **bez zmiany logiki**, tylko polish HUD jeśli trzeba.
