# Design — hasła GitHub (szukaj w repo)

**Repo:** https://github.com/maciejsieracki/The-Game  
**Jak szukać:** w repozytorium wpisz w pole „Search this repository” hasło z kolumny poniżej (np. `W3-miasto-v3-delta`).

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
| **`C04-C05-oblęzenie-mapa-v2`** | `docs/ux/WKLEJKA-DESIGN-START-C04-C05-oblęzenie.md` | 🟢 **START** · na GitHub `main` 2026-07-04 |

Brief: `docs/ux/DESIGN-BRIEF-C04-C05-oblęzenie-v2.md`  
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
