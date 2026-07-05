# Design — hasła GitHub (szukaj w repo)

**Repo:** https://github.com/maciejsieracki/The-Game  
**Jak szukać:** w repozytorium wpisz w pole „Search this repository” hasło z kolumny poniżej (np. `TOR-A-ONLY`).

**START Design (aktualny, rev.4 · GitHub):** [WKLEJKA-DESIGN-START-TOR-A-ONLY.md](https://github.com/maciejsieracki/The-Game/blob/main/docs/ux/WKLEJKA-DESIGN-START-TOR-A-ONLY.md) · hasło: **`TOR-A-ONLY`**  
**Skład wklejki:** [NAGLOWEK](https://github.com/maciejsieracki/The-Game/blob/main/docs/ux/WKLEJKA-DESIGN-NAGLOWEK-ZLECENIA.md) + TOR A  
Master lista luk: [WKLEJKA-DESIGN-MASTER-LUKI-2026-07-05.md](https://github.com/maciejsieracki/The-Game/blob/main/docs/ux/WKLEJKA-DESIGN-MASTER-LUKI-2026-07-05.md)

---

## P0 — TOR A (6 paczek ZIP · rev.4)

| Hasło | Spec (GitHub) | Review PRZED |
|-------|---------------|--------------|
| **`TOR-A-ONLY`** | [wklejka master](https://github.com/maciejsieracki/The-Game/blob/main/docs/ux/WKLEJKA-DESIGN-START-TOR-A-ONLY.md) | — |
| **`JEDNOSTKI-INFOGRAFIKI-1E-2026-07-05`** | [spec](https://github.com/maciejsieracki/The-Game/blob/main/docs/ux/DESIGN-ZLECENIE-JEDNOSTKI-INFOGRAFIKI-2026-07-05.md) · [katalog v1](https://github.com/maciejsieracki/The-Game/blob/main/docs/ux/claude-design/jednostki-infografiki-1E.html) | [GAP HTML](https://github.com/maciejsieracki/The-Game/blob/main/docs/ux/export/JEDNOSTKI-INFOGRAFIKI-GAP-DLA-DESIGN.html) |
| **`BUDYNKI-INFOGRAFIKI-1E-2026-07-05`** | [spec](https://github.com/maciejsieracki/The-Game/blob/main/docs/ux/DESIGN-ZLECENIE-BUDYNKI-INFOGRAFIKI-2026-07-05.md) · [START wklejka](https://github.com/maciejsieracki/The-Game/blob/main/docs/ux/WKLEJKA-DESIGN-START-BUDYNKI-INFOGRAFIKI.md) | [GAP HTML](https://github.com/maciejsieracki/The-Game/blob/main/docs/ux/export/BUDYNKI-INFOGRAFIKI-GAP-DLA-DESIGN.html) |
| **`POLE-BITWY-v5-gap-2026-07-05`** | [spec](https://github.com/maciejsieracki/The-Game/blob/main/docs/ux/DESIGN-ZLECENIE-POLE-BITWY-v5-GAP-2026-07-05.md) · [playtest](https://github.com/maciejsieracki/The-Game/blob/main/gra-kanon/Gra-podglad-POLE-BITWY.html) | [GAP HTML](https://github.com/maciejsieracki/The-Game/blob/main/docs/ux/export/C-POLE-BITWY-GAP-DLA-DESIGN.html) |
| **`ARMY-MERGE-A18-2026-07-05`** | [spec](https://github.com/maciejsieracki/The-Game/blob/main/docs/ux/DESIGN-ZLECENIE-ARMY-MERGE-A18-2026-07-05.md) | [GAP HTML](https://github.com/maciejsieracki/The-Game/blob/main/docs/ux/export/A18-ARMY-MERGE-GAP-DLA-DESIGN.html) |
| **`A21-CITY-UNIT-PICK-2026-07-05`** | [spec](https://github.com/maciejsieracki/The-Game/blob/main/docs/ux/DESIGN-ZLECENIE-A21-CITY-UNIT-PICK-2026-07-05.md) | [GAP](https://github.com/maciejsieracki/The-Game/blob/main/docs/ux/export/A21-CITY-UNIT-PICK-GAP-DLA-DESIGN.html) · [PNG](https://github.com/maciejsieracki/The-Game/blob/main/docs/ux/export/screenshots/A21-city-unit-pick-przed-2026-07-05.png) |
| **`HEX-CONTEXT-PANEL-2026-07-05`** | [spec](https://github.com/maciejsieracki/The-Game/blob/main/docs/ux/DESIGN-ZLECENIE-HEX-CONTEXT-PANEL-2026-07-05.md) | [GAP](https://github.com/maciejsieracki/The-Game/blob/main/docs/ux/export/HEX-CONTEXT-PANEL-GAP-DLA-DESIGN.html) · [PNG](https://github.com/maciejsieracki/The-Game/blob/main/docs/ux/export/screenshots/HEX-context-panel-przed-2026-07-05.png) |
| **`A08-ulepszenia-ikony`** | [brief](https://github.com/maciejsieracki/The-Game/blob/main/docs/ux/DESIGN-BRIEF-A08-ulepszenia-ikony-i-panel.md) | [handoff](https://github.com/maciejsieracki/The-Game/blob/main/dyspozycje/_handoff/UI-do-DESIGN_A08-START-2026-07-03.md) |

**Oddawanie pracy:** [WORKFLOW-GITHUB-SYNC.md](https://github.com/maciejsieracki/The-Game/blob/main/docs/ux/claude-design/WORKFLOW-GITHUB-SYNC.md) · log: [WYMIANA-UI-DESIGN.md](https://github.com/maciejsieracki/The-Game/blob/main/docs/ux/claude-design/WYMIANA-UI-DESIGN.md)

---

## Reguła nazewnictwa (każde START u Designera — obowiązkowe)

**Problem:** Design zapisuje pliki generycznie · Maciej dokłada tylko cyfrę (12, 13…) → Cursor nie znajduje deliverables.

**Każde zlecenie — Design MUSI:**

| Element | Wzór | Przykład |
|---------|------|----------|
| **ZLECENIE-ID** | z briefu / hasła | `C04-C05-A19-mapa-v2` |
| **DATA** | `YYYY-MM-DD` w nazwie pliku i zip | `2026-07-04` |
| **Plik .dc.html** | `The Game - {ID} {Opis} v{N} {DATA} (1E).dc.html` | `The Game - C04 Atak miasto wybor v2 2026-07-04 (1E).dc.html` |
| **ZIP (jeden)** | `{ZLECENIE-ID}_{DATA}.zip` | `C04-C05-A19-mapa-v2_2026-07-04.zip` |
| **W zip** | pliki + `MANIFEST.txt` + handoff `.md` | — |

**Szablon nagłówka do wklejki:** `docs/ux/WKLEJKA-DESIGN-NAGLOWEK-ZLECENIA.md`  
**Cursor szuka po:** ZLECENIE-ID + data w nazwie · **nie** po samych cyfrach 12/13/14.

**Pobieranie zip (Maciej):** przeglądarka sugeruje tytuł projektu Design (np. `Ulepszenie infografik.zip`) — **w oknie zapisu wklej nazwę podaną przez Design** (np. `C04-C05-A19-mapa-v2_2026-07-04.zip`). Design podaje ją **pogrubioną na końcu** każdej odpowiedzi z paczką.

---

## P0 — HUD miasta W3 v3

| Hasło | Pierwszy plik |
|-------|----------------|
| **`W3-miasto-v3-delta`** | `docs/ux/WKLEJKA-DESIGN-START-W3-miasto-v3.md` |

| Plik | Rola |
|------|------|
| `docs/ux/DESIGN-BRIEF-W3-miasto-v3-HUD.md` | Brief (czytaj w całości) |
| `dyspozycje/_handoff/UI-do-DESIGN_W3-miasto-v3-delta-2026-07-03.md` | Handoff + DoD |
| `dyspozycje/_handoff/MASTER-do-UI-DESIGN_miasto-baseline-2026-07-03.md` | Delta UX (co jest w grze, czego brak w starych mockupach) |
| `dyspozycje/_handoff/AUDYT-SYNC-MIASTO-BITWA-2026-07-03.md` | Audyt sync miasto / bitwa |

**Playtest (obowiązkowy przed rysowaniem):**

1. Sklonuj repo · otwórz lokalnie `gra-kanon/START.html` (Ctrl+F5) → nowa gra → klik miasto.
2. Przejdź: Budowa · Spichlerz · Mapa (stopka) · Wróć na mapę · toolbar okolica · Esc.
3. Jeśli nie możesz odpalić HTML: poproś Macieja o 4 screenshoty w `docs/ux/referencje-miasto-kanon-2026-07-03/`.

**Deliverable:** `docs/ux/claude-design/The Game - Ekran Miasto W3 v3 (1E).dc.html`  
**Handoff zwrotny:** `docs/ux/claude-design/DESIGN-do-UI_miasto-w3-v3.md` · Designer **APPROVE** · MASTER **PARTIAL** (v3.1: 6 prawych **z playtestu kanonu**, nie W4 v2 · Esc/Menu)

---

## P1 — Oblężenie na mapie świata (modal — **NIE pole bitwy**)

| Hasło | Plik start | Status |
|-------|------------|--------|
| **`C04-C05-oblęzenie-mapa-v2`** | `docs/ux/WKLEJKA-DESIGN-START-C04-C05-oblęzenie.md` | ✅ **Design GOTOWE** 2026-07-04 · lane port UI |

Brief: `docs/ux/DESIGN-BRIEF-C04-C05-oblęzenie-v2.md`  
Handoff Design: `docs/ux/claude-design/DESIGN-do-UI_C04-C05-A19-v2.md`  
Lane: `dyspozycje/_handoff/DESIGN-do-UI_oblezenie-map-modals-v2-2026-07-04.md`  
**To NIE jest** C-04/C-05 pole bitwy (patrz sekcja poniżej).

---

## P1 — Oblężenie / szturm **na polu 3D** (lane C-19/C-20)

| Hasło / temat | Deliverable | Status |
|---------------|-------------|--------|
| **C04-C05 pole map-v2** (droga 3 · baza v2) | `C04 Oblezenie v2` · `C05 Szturm muru v2` — warstwa **HUD-only** + placeholder 3D | ✅ **Design OK** Maciej 2026-07-04 |

**Zawartość potwierdzona:**
- **C-04:** VS góra · mur (lewo) · siły oblężnicze (prawo) · Ostrzał / Czekaj / Szturm
- **C-05:** punkty szturmu + wyłom (lewo) · obrona muru (prawo) · Drabiny / Wieża / Szturm przez wyłom

Mapowanie lane: `docs/ux/DESIGN-MAPOWANIE-C04-C05-vs-lane.md`  
**Lane port:** po wpięciu paczki Design do `claude-design/`.

---

## P1 — Pre-bitwa TW (sign-off, po Szturm)

| Hasło | Plik start |
|-------|------------|
| **`C01-v3-sync-kanon`** | `docs/ux/WKLEJKA-DESIGN-START-C01-v3-sync.md` |

Brief: `docs/ux/DESIGN-BRIEF-C01-v3-sync-kanon.md`

---

## Stan lane

`dyspozycje/UI-STAN.md`
