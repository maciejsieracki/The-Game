# DYSPOZYCJA — brand-book/

Log: `docs/ux/claude-design/WYMIANA-UI-DESIGN.md` · sekcje **§ szata-sync-2026-07-03**, **§ W3-miasto-1E**, **§ Wikipedia**.

---

## ▶ START — szata-sync-2026-07-03 ✅ DONE (Design 2026-07-03)

**Status:** **ZAMKNIĘTE w całości** (komplet 2026-07-03) · Lane UI: integracja `ui-wiki.svg` po sync OneDrive.

**Deliverables Design (paczka `HUD-map-sync-2026-07-03 komplet`):**
| # | Plik |
|---|------|
| — | `The Game - HUD Mapy layout (1E).dc.html` — tura 1 |
| 8 | `The Game — HUD Panele stany (1E).dc.html` — C0/C1/C2 + Wiki 340px |
| 9 | `The Game - Ekran Miasto (1E).dc.html` — dim opaque, chrome mapy ukryty, górny pasek + Wiki |
| — | `eksport/icons/ui-wiki.svg` · `HANDOFF.md` § Szata sync |

**Następny Design:** `START — W3-miasto-1E` — **reszta** ekranu miasta (9 rail, 6 chipów, okolica, porządek…) — **poza** szatą sync mapy.

---

## ▶ START — W3-miasto-1E ✅ DONE (Design 2026-07-03)

**Deliverable W3 — KOMPLET 9/9 (Design DONE):**

| Plik | Zakładki rail |
|------|----------------|
| `The Game - Ekran Miasto W3 (1E).dc.html` | chrome + dim + **Budowa** |
| `The Game - Miasto Zakładki W3 (1E).dc.html` | Rekrutacja · Handel · Porządek · Zdrowie |
| `The Game - Miasto Zakładki W3 cz2 (1E).dc.html` | Spichlerz · Praca · Kultura · Religia |

**Lane UI:** W-WIKI-2 → W3-full (`cityPanel.ts`) · mockupy = referencja wizualna

**Design BACKLOG:** W1b (ikony cyw.) · opcjonalnie Okolica/heksy (osobny START)

---

## ▶ START — W3-miasto-1E (ARCHIWUM procedury)
2. **`referencje-w3/BUDYNKI-tabela.md`** — 26 budynków, koszty, stany kart
3. **`referencje-w3/DANE-MIASTO-skrot.md`** — plony, wzrost, porządek, akcje
4. **`referencje-w3/JEDNOSTKI-skrot.md`** — rekrutacja, Koszary gate
5. **`The Game - Ekran Miasto (1E).dc.html`** — **EDYTUJ**

**Repo (opcjonalnie):** `dyspozycje/_handoff/UI-do-DESIGN_w3-miasto-1E-dane.md`

### Co sprawdzić w mockupie (KROK 2 w START)

Obecny `.dc.html` ma tylko **szkielet Budowy** — brakuje m.in.:
- 6 chipów górnych (jest 3)
- 9 ikon rail (jest 6)
- zakładek: handel, porządek, okolica, zdrowie, kultura, religia
- realnych kosztów (Spichlerz=**20**, Koszary=**25**, nie 60/80)
- błędnego „Akwedukt" (nie ma w grze — użyj Studnia)
- 4 stanów porządku (Spokój→Bunt skrajny)
- siatki okolicy heksów
- **przycisk Wiki** górny prawy róg (obok Menu) — patrz **`../WYMIANA-UI-DESIGN.md` § Wikipedia** + handoff repo `UI-do-DESIGN_wikipedia-hud-mockup.md`

### Deliverable

- [ ] `The Game - Ekran Miasto (1E).dc.html` — pełny ekran + 9 widoków rail + 4 demo porządku
- [ ] `eksport/HANDOFF.md` — sekcja W3-miasto-1E
- [ ] **`ostatnie/W3-miasto-1E.zip`** → Maciej

**Lane po zipie:** `cityPanel.ts` — **nie Design**.

---

## ▶ START — W1b (BACKLOG)

**Design wpisz:** `START — W1b`

### Zadanie

Dostarcz **15 ikon cywilizacji** (medalion kreatora) + manifest. **NIE** dodawaj do `icons-manifest.json`.

### Deliverable (checklist)

- [ ] Folder `eksport/icons/civilizations/` — pliki `@24` only, styl 3C line, `currentColor`:
  - [ ] `civ-grecy.svg` — partenon (skopiuj path z `Ekran Kreator (1E).dc.html` linia ~40)
  - [ ] `civ-rzymianie.svg` — skrzyżowane gladiusy (~41)
  - [ ] `civ-chinczycy.svg` — pagoda (~42)
  - [ ] `civ-inkowie.svg` — słońce/koło (~43)
  - [ ] `civ-zulusi.svg` — tarcza (~44)
  - [ ] `civ-egipt.svg` — piramida (~45)
  - [ ] `civ-sumer.svg` — ziggurat (~46)
  - [ ] `civ-celtowie.svg` — torc / węzel celtycki
  - [ ] `civ-germanie.svg` — topór / rogaty hełm
  - [ ] `civ-harappa.svg` — byk (pieczęć Harappy)
  - [ ] `civ-hetyci.svg` — koło rydwanu
  - [ ] `civ-slowianie.svg` — gromnica / dąb
  - [ ] `civ-babilonia.svg` — brama / lew
  - [ ] `civ-asyria.svg` — lamassu (uproszczony)
  - [ ] `civ-fenicjanie.svg` — okręt
  - [ ] `civ-default.svg` — fallback (korona)
- [ ] **`eksport/civ-icon-map.json`** — mapa `ikonaId` → `civ-*` (szablon w WYMIANA §5)
- [ ] **`eksport/HANDOFF.md`** — sekcja „Cywilizacje" + mapa plików repo (poniżej)
- [ ] Zip → Maciej `brand-book/ostatnie/` · log 1 linia w WYMIANA

### Mapa ekran → plik repo (HANDOFF — wklej 1:1)

| Makieta | Plik `gra/src/ui/` |
|---------|-------------------|
| Ekran Menu | `mainMenu.ts` |
| Kreator | `newGameFlow.ts` |
| HUD | `hud.ts`, `mapToolbarHud.ts`, `bottomBarHud.ts` |
| Miasto | `cityPanel.ts` |
| Dyplomacja | `diplomacyPanel.ts`, `diploListHud.ts` |
| Walka | `preBattle.ts` |
| Badania | `sciencePicker.ts`, `scienceHubHud.ts` |
| Wojsko | `armyListHud.ts` |
| Koniec gry | `victoryScreen.ts` |
| Assety SVG | `icons/brandAssets.ts` |
| Rejestr HUD | `icons/iconRegistry.ts` |
| Tokeny | `brandTokenVars.ts` |

Integracja cyw.: `brandAssets.civIconSvg()` → **`newGameFlow.ts`** (medalion `.tg-medallion`).

### DoD

15 SVG + default + `civ-icon-map.json` + HANDOFF · **zero** wpisów cyw. w `icons-manifest.json`.

---

## ▶ START — W1-menu-map (AKTYWNE · PRIORYTET 2 · po W1b lub równolegle)

**Design wpisz:** `START — W1-menu-map`

**Kontekst:** paczka `icons/menu/` (30 SVG) **już w kanonie** — brakuje mapy przycisk → ikona.

### Zadanie

- [ ] Utwórz **`eksport/menu-button-map.json`** (nowy plik, **NIE** icons-manifest):

```json
{
  "note": "id ikony menu → slot w mainMenu.ts (gra/src/ui/mainMenu.ts)",
  "map": {
    "menu-play": "btn_new_game_primary",
    "menu-campaign": "btn_campaign_soon",
    "menu-multiplayer": "btn_multiplayer_soon",
    "menu-settings": "btn_settings",
    "menu-more": "btn_more_toggle",
    "menu-load": "btn_continue_or_load",
    "menu-save": "btn_save_future",
    "menu-exit": "btn_quit",
    "menu-info": "btn_about",
    "menu-emblem-mini": "header_emblem_optional"
  },
  "settings_rows_optional": {
    "menu-audio": "settings_audio",
    "menu-controls": "settings_controls",
    "menu-language": "settings_language"
  }
}
```

- [ ] **`eksport/HANDOFF.md`** — sekcja „Menu button icons" + powyższa mapa
- [ ] **NIE** twórz ponownie SVG menu (już są w `eksport/icons/menu/`)

### DoD

`menu-button-map.json` + HANDOFF · Lane podpinie w `mainMenu.ts`.

---

## ✅ PACZKA FINAL — DONE (nie powtarzaj)

Tokeny · Tier 1–7 · budynki · jednostki · menu CSS/emblem · **menu SVG 30 plików** (2026-06-26).

## ⏸ BACKLOG (bez START)

PDF Brand Book · PACZKA 2 · WebM hero · Tier 3–5 @40 dodatkowe.

*Aktywne START: **W3-miasto-1E** · BACKLOG: W1b · W1-menu-map · 2026-07-03*
