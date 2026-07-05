# Design Brief — C-05 Mur / szturm muru v2 (1E)

**Od:** Maciej / Lane UI  
**Do:** Design (brand-book 1E)  
**Data:** 2026-07-03  
**Priorytet:** P1 — **ostatni mockup Grupy C (Walka)**  
**Poprzedni:** `docs/ux/claude-design/The Game - C04 Oblezenie v2 (1E).dc.html` ✅

---

## Cel

Mockup **widoku muru na polu bitwy** — moment szturmu / wyłomu — uzupełnia C-04 (HUD oblężenia).  
Design domyka **Grupę C**; po C-05 lane portuje mur 3D + HUD do silnika.

**Deliverable:** `docs/ux/claude-design/The Game - C05 Mur v2 (1E).dc.html`  
**Folder:** `docs/ux/claude-design/` (jak C-04, C-06, C-12)

---

## Mapowanie ID (Design ↔ kod lane)

| Design (Grupa C mockup) | Rejestr lane (kod) | Pliki |
|-------------------------|-------------------|--------|
| **C-04 Oblężenie** ✅ | **C-19** HUD oblężenia + akcje tury | `battleScene.ts` · overlay oblężenia |
| **C-05 Mur** ▶ | **C-20** mur 3D + brama + szturm | `siegeWall.ts` · `battleScene.ts` |

**Uwaga:** lane **C-04/C-05 mapa** (`cityAttackChoice.ts`, `siegeMapPanel.ts`) = flow na mapie świata — **osobny temat**, już funkcjonalny; ten brief dotyczy **pola 3D**.

---

## Kontekst w grze

- Bitwa z opcją `siege` — mur obrońcy u **górnej** krawędzi pola
- Brama centralna · segmenty muru niszczone przez katapultę/taran
- Obrońcy na chodniku muru · po wyłomie — przejście piechoty
- **Playtest baseline:** `Gra-podglad-OBLEZENIE-BITWA.html` · `Gra-podglad-MUR-BITWA.html`

**Kod dziś:** `gra/src/battle/siegeWall.ts` (9 stylów cywilizacji) · mały monospace HUD (`siegeHudDiv`) — **do wymiany** stylem 1E.

---

## Spójność 1E (must)

- Tokeny jak **C-04 Oblężenie** i **C-06 v3** — panel 5C, złoto `#e8d88a`
- **Ty** `#3a6ad0` · **wróg / garnizon** `#c84040` (`DECYZJA-C-kolory-stron-bitwa.md`)
- **Zero emoji** — SVG line-art z brand-book
- Górny pasek może być **identyczny lub skrócony** względem C-04 (spójność serii)

---

## C-05 — co pokazuje mockup (1920×1080)

### Warstwa 1 — Pole 3D (centrum, placeholder)

- **Mur miejski** w poprzek górnej krawędzi pola (perspektywa jak w grze)
- **Brama główna** — centralna · możliwy **wyłom** (luka w murze) lub brama otwarta
- Sylwetki: 1–2 obrońców **na chodniku muru** · 1–2 atakujących u podstawy / w wyłomie
- Podpis placeholder: *„Render silnika · mur cywilizacji · wyłom”*
- Tło heksów jak C-06 v3 (ciemne, złote obwódki)

### Warstwa 2 — HUD (spójny z C-04, opcjonalnie uproszczony)

Jeśli zostawiasz panele — **skup wizualny na murze**, nie duplikuj całego C-04:

| Strefa | Treść (przykład) |
|--------|------------------|
| **Lewy** | **Segment muru** / **Brama** — HP pasek · „Wyłom gotowy” · % integralności (jak C-04: 42%) |
| **Prawy** | Skrót sił: katapulty / tarany / piechota (jak C-04) lub tylko **cel szturmu: Brama** |
| **Góra** | „Szturm muru · Kapua” · Tura N · Ty VS Garnizon |
| **Dół** | Akcje: **Ostrzał** (outline) · **Czekaj** · **Szturm przez wyłom** (primary czerwony jak C-04) |

Copy dolne (PL): *„Piechota może wejść przez wyłom gdy integralność muru spadnie poniżej progu.”*

### Warstwa 3 — stan „moment szturmu” (zalecany)

Druga warstwa / adnotacja w pliku:

- Highlight **wyłomu** — glow czerwony/złoty
- Strzałka / ścieżka szturmu od dołu pola ku bramie
- Etykieta: **„Szturm w toku”** lub **„Przygotowanie szturmu”**

---

## Layout — szkic

```
┌─────────────────────────────────────────────────────────────┐
│ Szturm muru · Kapua          Ty VS Garnizon    Pomiń · Wyjście │
├──────────┬──────────────────────────────────────┬───────────┤
│ Segment  │     [ MUR 3D + brama + wyłom ]         │ Siły      │
│ / Brama  │     obrońcy na murze · atak u dołu     │ szturmu   │
│ HP 42%   │                                        │           │
├──────────┴──────────────────────────────────────┴───────────┤
│  hint szturmu    [ Ostrzał ]  [ Czekaj ]  [ SZTURM ]         │
└─────────────────────────────────────────────────────────────┘
```

---

## Różnica vs C-04 (obowiązkowa)

| C-04 Oblężenie | C-05 Mur |
|----------------|----------|
| Ogólny HUD tury oblężenia | **Fokus na murze 3D** i wyłomie/bramie |
| Pole = generic placeholder | Pole = **widoczny mur** + chodnik + brama |
| Akcje: ostrzał / czekaj / szturm | Ten sam zestaw, ale **copy i highlight = szturm muru** |

---

## Definition of Done (Design)

- [ ] Jeden plik `The Game - C05 Mur v2 (1E).dc.html`
- [ ] 1920×1080 · tokeny 1E · zero emoji
- [ ] Mur 3D (placeholder) + brama + wyłom lub stan szturmu
- [ ] Spójność kolorów z C-04 / C-06 / C-12
- [ ] Meldunek: „C-05 v2 gotowy" + ścieżka

**Po Design:** lane UI/UNITS port — `siegeWall.ts` wizual + `_buildSiegeHud` / overlay (batch po `master`).

---

## Referencje

- `The Game - C04 Oblezenie v2 (1E).dc.html` — panele i dolny pasek akcji
- `The Game - C06 Deployment v3 (1E).dc.html` — pole 3D, top HUD
- `docs/ux/DECYZJA-C-kolory-stron-bitwa.md`
- `gra/src/battle/siegeWall.ts` — architektura muru (chodnik, brama, segmenty)
