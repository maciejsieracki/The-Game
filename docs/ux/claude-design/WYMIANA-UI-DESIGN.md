---
# WYMIANA UI (Cursor) ↔ Claude Design — jeden plik, obie strony
# Maciej: aktualizuj ręcznie LUB każda strona dopisuje swoją sekcję
# Lane UI: czyta + aktualizuje blok `lane_ui` po działaniu
# Claude Design: czytaj na upload + dopisuj do `design` po deliverable

version: 4
updated: "2026-07-05"
phase: "brand_book_d1"
kanon_sciezek: "docs/ux/claude-design/KANON-SCIEZEK.md"
schemat_az: "docs/ux/SCHEMAT-AZ-UX-PIPELINE.md"
design_start: true
design_start_date: "2026-06-26"
design_start_trigger: "Lane UI → START w brand-book/DYSPOZYCJA.md"
w3_miasto_freeze: true
w3_miasto_baseline_md5: "153fcda2f71e1e9ab3a538d8b9c10f9e"
w3_miasto_delta: "dyspozycje/_handoff/MASTER-do-UI-DESIGN_miasto-baseline-2026-07-03.md"

paths:
  # === JEDYNE MIEJSCE ZAPISU — Design SKOPIUJ do OneDrive (Maciej nie pobiera ręcznie) ===
  design_root: "docs/ux/claude-design/01-propozycje-z-design/brand-book/"
  design_root_windows: "C:\\Users\\macie\\OneDrive - NASTER S.A\\_NOWA_STRUKTURA\\06_Prywatne\\Gry\\Civ\\docs\\ux\\claude-design\\01-propozycje-z-design\\brand-book"
  dyspozycja: "docs/ux/claude-design/01-propozycje-z-design/brand-book/DYSPOZYCJA.md"
  hub: "docs/ux/claude-design/01-propozycje-z-design/brand-book/The Game — Przegląd (1E).dc.html"
  eksport: "docs/ux/claude-design/01-propozycje-z-design/brand-book/eksport/"
  tokens_css: "docs/ux/claude-design/01-propozycje-z-design/brand-book/eksport/tokens.css"
  tokens_json: "docs/ux/claude-design/01-propozycje-z-design/brand-book/eksport/tokens.json"
  handoff: "docs/ux/claude-design/01-propozycje-z-design/brand-book/eksport/HANDOFF.md"
  icons: "docs/ux/claude-design/01-propozycje-z-design/brand-book/eksport/icons/"
  # === WEJŚCIE (upload do Design, nie zapis) ===
  upload_do_design: "docs/ux/claude-design/00-brand-book-pakiet/"
  wymiana_ten_plik: "docs/ux/claude-design/WYMIANA-UI-DESIGN.md"
  wymiana_windows: "C:\\Users\\macie\\OneDrive - NASTER S.A\\_NOWA_STRUKTURA\\06_Prywatne\\Gry\\Civ\\docs\\ux\\claude-design\\WYMIANA-UI-DESIGN.md"
  sync_komenda: "SKOPIUJ … DO … (pełna ścieżka OneDrive — wprost w każdym START)"
  # === PIPELINE (osobny tor) ===
  pipeline_wejscie: "docs/ux/pipeline/01-wejscie/"
  pipeline_po: "docs/ux/pipeline/02-po-design/"
  tokeny_css_repo: "UI/design-tokens-brand-v1.css"
  spec_ikony: "docs/ux/claude-design/00-brand-book-pakiet/01-dokumenty/02-SPEC-IKONY.md"
  decyzje: "docs/ux/claude-design/00-brand-book-pakiet/01-dokumenty/01-DECYZJE-WARSTWA1.md"
  # === DEPRECATED — nie używać ===
  deprecated_brand_book_1E: "docs/ux/claude-design/01-propozycje-z-design/brand-book-1E/"

status:
  ustalenie: "2026-06-26 — Maciej: sync **Wariant A** (Design = źródło, zip jednokierunkowy)"
  sync_model: "design_cloud_zip_only"
  sync_model_decyzja: "Design edytuje brand-book/ w swoim projekcie · Cursor NIE edytuje brand-book/ · po turze Design → zip → nadpisanie kanonu w repo · WYMIANA = tylko log Cursor (Design nie czyta repo)"
  sync_model_deprecated: "github_wymiana_plus_zip — NIEaktualne (Design nie pushuje do GitHub)"
  workflow_doc: "docs/ux/claude-design/KANON-SCIEZEK.md § Sync Wariant A"
  pull_script: "tools/sync-design-github.ps1"
  zip_script: "tools/pull-brand-book.ps1"
  github_remote: "https://github.com/maciejsieracki/The-Game.git"
  handoff_cursor: "brand-book/HANDOFF-CLAUDE-CODE.md"
  dogadane: true
  dogadane_data: "2026-07-01"
  maciej_review: "mega — profesjonalnie (czat)"
  design_zapisuje: "paths.design_root"
  lane_ui_czyta: "paths.design_root"
  maciej_robi: "START (Cursor) → START (Design) — tylko te dwa; resztę Lane UI + dyspozycje"
  design_trigger: "START — tura N (tekst z ▶ START w DYSPOZYCJA.md)"

decisions_locked:
  warstwa1: "1B, 2C, 3C, 4C, 5C, 6C, 7A, 8A"
  wdrozenie_kolejnosc: "E → A → B → D → C"
  ux_zapisane_design:
    dyplomacja: "uścisk dłoni (tb-diplomacy) — nie pergamin+pióro"
    e15b: "E-15b porażka akcent #c84040"
    emoji: "zero emoji w finalnych ekranach"

design:
  last_report: "2026-06-26 tura 1 (Design → Maciej)"
  tura_1_done:
    - "REQ-005 hub — kafelki Kreator Kroki, Walka Warianty, Motion, Koniec Porażka"
    - "REQ-003 częściowo — tb-diplomacy uścisk dłoni: biblioteka + Brand Book + eksport/icons/tb-diplomacy.svg"
  tura_1_defer:
    - "HUD toolbar A-02 — inny wariant ikony dyplomacji → tura 2 krok A"
    - "REQ-002 E-15b porażka → tura 2 krok B"
    - "Tier 1+2 komplet, E final, HANDOFF freeze tokens w eksport/"
  workflow: "Jedna tura na START Macieja — bez pętli 2h autonomicznej"
  sync: "GitHub — Design push · Lane UI pull · dual-START"
  reported_done:
    - "Brand Book v1 (1E)"
    - "Biblioteka ~50 ikon (core Tier 1-2 + waga + kaduceusz SVG)"
    - "Komponenty + tokeny + HANDOFF"
    - "Ekrany: menu, kreator, HUD, miasto, dyplomacja, walka, koniec gry"
    - "Hub Przegląd (1E) + prototyp klikalny"
  reported_deferred:
    - "Brand Book PDF druk"
    - "SVG Tier 3-5"
    - "Pełne 34 ekrany / zapis-wczytaj / pauza / responsywność / daltonizm"
  files_in_repo: "2026-07-01 poll: 4 pliki (tylko lane docs) · brak eksport/HTML — czeka SKOPIUJ od Design"
  maciej_drop: "brand-book/ — jeden folder kanoniczny"
  maciej_start: "2026-06-26 — START w czacie Lane UI · Design może realizować D1"

lane_ui:
  last_action: "2026-07-06 — IMP-01 odpowiedź P1–P6 na GitHub (GITHUB-ISSUE-IMP-01-ODPOWIEDZ + hasło IMP-01-MOC-ODPOWIEDZ-2026-07-06)"
  review: "Design mockup v1 Moc = 6 filarów BŁĄD · kanon = 9 składników · v2 wymagane"
  next: "Design: git pull → szukaj IMP-01-MOC-ODPOWIEDZ-2026-07-06 → mockup v2 · równolegle B-P0 B1/B2/B4/B5"
  github_odpowiedz_moc: "docs/ux/GITHUB-ISSUE-IMP-01-ODPOWIEDZ-DESIGN-2026-07-06.md"
  blocked_on_design:
    - "B1 A-08 Tryb budowy ulepszeń — emoji, brak imp-*, tekst nakłada się (Posterunek)"
    - "B2 HEX-CONTEXT-PANEL — karta C1 heksu — plony/ulepszenia bez mockupu 1E"
    - "B3 IMP-01 Panel Moc imperium (MASTER-do-UI_panel-moc-i-imperium.md)"
    - "B4 PB-v5-01 C23 Szczegóły bitwy"
    - "B5 PB-v5-02 C12 Koniec v3"
    - "B6 Hub nauki — HOLD Macieja D11"
    - "B7 A-06/A-10/A-27/Wiki — brak mockupów final"
    - "B8 menu-button-map.json — backlog"
  wklejka_pelna_lista_B: "docs/ux/WKLEJKA-DESIGN-B-P0-PELNE-MACIEJ-2026-07-06.md"
  spec_B_P0: "docs/ux/DESIGN-ZLECENIE-B-P0-PELNE-2026-07-06.md"
  ready_to_port_no_design:
    - "BUDYNKI Poziom B karty (mockup 2026-07-05 już w repo)"
    - "W4 v2 reszta zakładek (mockup już w repo)"
    - "Popupy deploy v5 SVG (HANDOFF już w repo)"

maciej:
  next_step: "1) GitHub remote 2) START Cursor 3) START Design"
  po_tura: "Design: git push · Lane UI: git pull przy nastepnym START Cursor"

queue_design:
  - id: A-08-ULEPSZENIA
    priority: P0
    status: next_start
    from: lane_ui
    date: "2026-07-03"
    registered_wymiana: "2026-07-05"
    text: "Panel budowy ulepszeń (prawy) — emoji→imp-* SVG · layout 1E · scroll · Posterunek tekst się nakłada"
    wklejka: "docs/ux/WKLEJKA-DESIGN-START-A08-ulepszenia.md"
    brief: "docs/ux/DESIGN-BRIEF-A08-ulepszenia-ikony-i-panel.md"
    handoff: "dyspozycje/_handoff/UI-do-DESIGN_A08-START-2026-07-03.md"
    screenshot_maciej: "2026-07-05 playtest — prawy panel: Miasto + Ulepszenia terenu + Cuda, Posterunek overlap"
  - id: HEX-CONTEXT-PANEL
    priority: P0
    status: next_start
    from: lane_ui
    date: "2026-07-05"
    registered_wymiana: "2026-07-05"
    text: "Karta heksu (lewy/prawy panel D17=A) — plony SVG zamiast emoji/letter · lista ulepszeń z ikonami · mockup C1"
    wklejka: "docs/ux/WKLEJKA-DESIGN-START-HEX-CONTEXT-PANEL.md"
    brief: "docs/ux/DESIGN-ZLECENIE-HEX-CONTEXT-PANEL-2026-07-05.md"
    review_html: "docs/ux/export/HEX-CONTEXT-PANEL-GAP-DLA-DESIGN.html"
    screenshot_maciej: "2026-07-05 — Równina heks (79,68) · PLONY Ż/P/H · MOŻLIWE plain text"
  - id: REQ-001
    priority: P0
    status: done_design
    from: lane_ui
    text: "Paczka brand-book v1 (hub + szkielet) — Maciej review OK"
  - id: D1-START
    priority: P0
    status: partial
    from: lane_ui
    text: "Tura 1 done (hub + dyplomacja częściowo) · tura 2 = START poniżej"
  - id: REQ-005
    priority: P2
    status: done_design
    from: design
    text: "Hub kafelki Kreator/Walka/Motion/Koniec Porażka — tura 1"
  - id: REQ-003
    priority: P0
    status: partial
    from: design
    text: "tb-diplomacy SVG eksport OK · HUD toolbar A-02 jeszcze inny wariant → tura 2"
  - id: REQ-002
    priority: P0
    status: next_start
    from: lane_ui
    text: "TURA 2 krok B — E-15b porażka #c84040 + link hub"
  - id: TURA-2-A
    priority: P0
    status: next_start
    from: lane_ui
    text: "TURA 2 krok A — A-02 HUD toolbar: ta sama geometria co eksport/icons/tb-diplomacy.svg"
  - id: TURA-2-C
    priority: P0
    status: next_start
    from: lane_ui
    text: "TURA 2 krok C — linki ← Powrót do huba na nowych kafelkach + prototyp"
  - id: REQ-D1-3
    priority: P0
    status: open
    from: lane_ui
    text: "D1-3+D1-4 — Tier 1+2 SVG komplet → eksport/icons/"
  - id: REQ-D1-5
    priority: P0
    status: open
    from: lane_ui
    text: "D1-5 — Ekrany E final PO (E-01, E-08…E-13, E-15 win)"
  - id: REQ-D1-6
    priority: P0
    status: open
    from: lane_ui
    text: "D1-6+D1-7 — HANDOFF v2 + freeze tokens.css/json w brand-book/eksport/"
  - id: REQ-004
    priority: P2
    status: defer
    from: lane_ui
    text: "SVG Tier 3-5 wg 02-SPEC-IKONY.md — po D1"
    priority: P1
    status: defer
    from: lane_ui
    text: "PACZKA 2 sesja 2h — PO domknięciu D1 · treść w WYMIANA §5"
  - id: PACZKA-2-full
    priority: P1
    status: defer
    from: lane_ui
    text: "PACZKA 2 pełna (3–5h) po 2h — PACZKA-2-D2-D3-HUD-MIASTO.md"

queue_ui:
  - id: UI-001
    priority: P0
    status: blocked
    depends: REQ-001
    text: "Review brand book + handoff vs decyzje 1B-8A"
  - id: UI-002
    priority: P1
    status: blocked
    depends: REQ-001
    text: "Skopiować zatwierdzone PO do pipeline/02-po-design/"
  - id: UI-003
    priority: P2
    status: blocked
    depends: UI-001
    text: "Dyspozycja wdrożenia menu E-01 (gra/src/ui/*) → Master po przekaż do Mastera"
---

# Wymiana danych — Lane UI ↔ Claude Design

**Checklist A→Z (odhaczanie krok po kroku):** [`docs/ux/SCHEMAT-AZ-UX-PIPELINE.md`](../SCHEMAT-AZ-UX-PIPELINE.md)

**Jeden plik dla obu stron.** Ścieżka:

`docs/ux/claude-design/WYMIANA-UI-DESIGN.md`

Pełna Windows:

`C:\Users\macie\OneDrive - NASTER S.A\_NOWA_STRUKTURA\06_Prywatne\Gry\Civ\docs\ux\claude-design\WYMIANA-UI-DESIGN.md`

---

## ▶ P0 Maciej — wklej do Design TERAZ (2026-07-05)

**Problem:** Briefy A-08 (07-03) i HEX (07-05) były w repo, ale **nie trafiły do `queue_design`** — Design ich nie widział w WYMIANA.

**Playtest Macieja ~23:05:** lewy panel heksu (plony, lista MOŻLIWE) + prawy panel budowy (emoji, przepełniony tekst, Posterunek overlap) — **nadal bez mockupu Design**.

| START | Wklejka (cały blok) |
|-------|---------------------|
| **`START — A-08`** | `docs/ux/WKLEJKA-DESIGN-START-A08-ulepszenia.md` |
| **`START — HEX-CONTEXT-PANEL`** | `docs/ux/WKLEJKA-DESIGN-START-HEX-CONTEXT-PANEL.md` |
| **Oba naraz** | `docs/ux/WKLEJKA-DESIGN-P0-HEX-A08-MACIEJ-2026-07-05.md` |

Po deliverable Design → Lane UI portuje `buildModeHud.ts` + `hexContextTooltip.ts` / `sidePanelHud.ts`.

---

## ⛔ STOP — W3 miasto (2026-07-03) → **UNFREEZE v3**

**Maciej (2026-07-03):** kod miasta w kanonie = prawda · Designer robi **W3 v3 HUD** do gry.

| Reguła | Treść |
|--------|--------|
| **Baseline** | **`gra-kanon/START.html`** md5 **`153fcda2…`** |
| **START Design** | **`START — W3-miasto-v3-delta`** · wklejka `WKLEJKA-DESIGN-START-W3-miasto-v3.md` |
| **Brief** | `docs/ux/DESIGN-BRIEF-W3-miasto-v3-HUD.md` |
| **Handoff** | `dyspozycje/_handoff/UI-do-DESIGN_W3-miasto-v3-delta-2026-07-03.md` |
| **Deliverable** | `The Game - Ekran Miasto W3 v3 (1E).dc.html` |
| **NIE edytuj** | W3 (1E) 9-rail · START-W3-miasto-1E.md |
| **Referencja polish** | W4 v2 zakładki (tylko czytaj) |
| **Screenshoty** | `referencje-miasto-kanon-2026-07-03/` — opcjonalnie Macieja |

**Lane miasto:** IDLE do deliverable Design · potem tylko CSS polish.

**C-01 Pre-bitwa:** sync/sign-off · `WKLEJKA-DESIGN-START-C01-v3-sync.md` · **inny ekran niż screenshot „Atak na miasto”**  
**C-04 Atak na miasto:** **START P0** · `WKLEJKA-DESIGN-START-C04-C05-oblęzenie.md` · to właśnie stary modal Macieja (emoji)  
**C-06 v4 deployment:** **HOLD** · Maciej — bitwa później

---

## ✅ DOGADANE (2026-07-01)

| Strona | Zobowiązanie |
|--------|----------------|
| **Claude Design** | Zapis **tylko** w `brand-book/` · czyta `WYMIANA` + `DYSPOZYCJA` · realizuje `queue_design` |
| **Lane UI** | Czyta **ten sam** `brand-book/` · review vs 1B–8A · wdrożenie w `gra/src/ui/*` po OK Macieja |
| **Maciej** | **START Cursor** + **START Design** — reszta Lane UI + dyspozycje |

Kanon: [`KANON-SCIEZEK.md`](KANON-SCIEZEK.md) · Maciej: *„mega, profesjonalnie"* (review wizualny ✅)

---

## Obieg pracy — dual-START + **GitHub** (2026-07-01)

**Pełny protokół:** [`WORKFLOW-GITHUB-SYNC.md`](WORKFLOW-GITHUB-SYNC.md)  
*(Archiwum zip inbox: [`WORKFLOW-DUAL-START.md`](WORKFLOW-DUAL-START.md))*

| Krok | Kto | Co |
|------|-----|-----|
| 1 | Maciej | **`START`** w Cursor |
| 2 | Lane UI | **`git pull`** · poll · paczka w `DYSPOZYCJA.md` · **push dyspozycji** |
| 3 | Maciej | **`START`** w Claude Design |
| 4 | Design | turę ▶ START · **`git commit + push`** `brand-book/` + WYMIANA |

Maciej **nie** kopiuje plików ręcznie · **nie** zip inbox.

---

## Tura 1 — wykonane (Design → 2026-06-26)

| ID | Status | Co |
|----|--------|-----|
| REQ-005 | ✅ | Hub: kafelki Kreator Kroki, Walka Warianty, Motion, Koniec Porażka |
| REQ-003 | 🟡 | `tb-diplomacy` uścisk dłoni w bibliotece + Brand Book + `eksport/icons/tb-diplomacy.svg` |
| — | ⏳ | **HUD toolbar A-02** — inny wariant ikony → **tura 2 krok A** |

**Decyzje UX zapisane:** dyplomacja = uścisk dłoni · E-15b = `#c84040` · zero emoji.

---

## ▶ NASTĘPNY START — tura 2 (jedna tura)

**W Design wpisz:**

```
START — tura 2

Czytam WYMIANA-UI-DESIGN.md (tura 2 + §5).
Realizuję TYLKO kroki A→C. Koniec: CZĘŚĆ E + log WYMIANA.

Zapis BEZPOŚREDNIO w folderze projektu OneDrive (nie chmura + kopiowanie):
C:\Users\macie\OneDrive - NASTER S.A\_NOWA_STRUKTURA\06_Prywatne\Gry\Civ\docs\ux\claude-design\01-propozycje-z-design\brand-book\

Potwierdź listę zapisanych plików. Maciej nie kopiuje ręcznie.
```

| Krok | Zadanie | DoD |
|------|---------|-----|
| **A** | **HUD toolbar** — ikona dyplomacji | W `A-02` (toolbar HTML) **ta sama geometria** co `eksport/icons/tb-diplomacy.svg` · usuń stary wariant |
| **B** | **E-15b porażka** | HTML ekran · layout = E-15 wygrana · akcent `#c84040` · link z huba „Koniec Porażka" |
| **C** | **Linki prototypu** | Na **wszystkich** ekranach z tury 1 kafelków: `← Powrót do Przeglądu (1E)` · zero martwych linków |

**NIE w tej turze:** Tier 3–5 SVG · PDF · pełne D1-3…D1-7 · PACZKA 2.

**Po turze:** pliki już w OneDrive (zapis bezpośredni) → Maciej: „Design tura N w repo" → Lane UI poll.

---

## §5 — Treść bloków (zamiast plików SESJA/PACZKA w chmurze Design)

Design **nie widzi** plików `SESJA-*.md` / `PACZKA-*.md` w swojej chmurze — **czytaj tylko ten plik**.

---

### ▶ DYSPOZYCJA AKTYWNA (2026-06-26) — **TYLKO TO WYKONUJ**

**KANON / PACZKA FINAL = DONE.** Nie powtarzaj Tier 1–7, budynków, jednostek, tokenów.

**Decyzja Macieja 2026-06-26:** **B** — pełny pakiet W1b od Design (15 SVG). Lane **nie** robi interim z mockupu.

| Priorytet | Design wpisz | Co zrobić | DoD |
|-----------|--------------|-----------|-----|
| **1** | **`START — W1b`** | **15 ikon cywilizacji** + `civ-icon-map.json` | folder `eksport/icons/civilizations/` (16 plików z default) |
| **2** | **`START — W1-menu-map`** | Mapa przycisk→ikona (SVG menu **już jest**) | `eksport/menu-button-map.json` + HANDOFF |

Pełna checklist: [`brand-book/DYSPOZYCJA.md`](01-propozycje-z-design/brand-book/DYSPOZYCJA.md) sekcje **▶ START W1b** i **▶ START W1-menu-map**.

---

#### START — W1b (skrót w §5)

**Deliverable:**

1. `eksport/icons/civilizations/civ-{ikonaId}.svg` × 15 + `civ-default.svg` @24, 3C line
2. `eksport/civ-icon-map.json`:

```json
{
  "map": {
    "grecy": "civ-grecy", "rzymianie": "civ-rzymianie", "chinczycy": "civ-chinczycy",
    "inkowie": "civ-inkowie", "zulusi": "civ-zulusi", "egipt": "civ-egipt", "sumer": "civ-sumer",
    "celtowie": "civ-celtowie", "germanie": "civ-germanie", "harappa": "civ-harappa",
    "hetyci": "civ-hetyci", "slowianie": "civ-slowianie", "babilonia": "civ-babilonia",
    "asyria": "civ-asyria", "fenicjanie": "civ-fenicjanie", "_default": "civ-default"
  }
}
```

3. `HANDOFF.md` — mapa plików repo (tabela w DYSPOZYCJA.md)

**7 pierwszych** — skopiuj SVG z `Ekran Kreator (1E).dc.html` linie 40–46. **8 kolejnych** — nowe (opisy w DYSPOZYCJA.md).

**NIE:** wpisy cyw. w `icons-manifest.json`.

---

#### START — W1-menu-map (skrót w §5)

Paczka `icons/menu/` (**30 SVG**) **już scalona** — nie rób SVG od nowa.

**Deliverable:** `eksport/menu-button-map.json` — mapowanie 1:1:

| `icons-manifest` id | Slot w `mainMenu.ts` | Etykieta PL w grze |
|--------------------|----------------------|-------------------|
| `menu-play` | `btn_new_game_primary` | Rozpocznij grę |
| `menu-campaign` | `btn_campaign_soon` | Kampania (wkrótce) |
| `menu-multiplayer` | `btn_multiplayer_soon` | Multiplayer (wkrótce) |
| `menu-settings` | `btn_settings` | Ustawienia |
| `menu-more` | `btn_more_toggle` | Więcej |
| `menu-load` | `btn_continue_or_load` | Kontynuuj / Wczytaj |
| `menu-exit` | `btn_quit` | Wyjdź |
| `menu-info` | `btn_about` | O grze |
| `menu-emblem-mini` | opcjonalnie obok tytułu | — |

Opcjonalnie w `settings_rows_optional`: `menu-audio`, `menu-controls`, `menu-language`.

+ update `HANDOFF.md` sekcja Menu.

---

#### Placeholdery — kto domyka (W1b)

| Brak | Kto |
|------|-----|
| 15 SVG cyw. + `civ-icon-map.json` | **Design START W1b** |
| `menu-button-map.json` | **Design START W1-menu-map** |
| Wpięcie w grę (`newGameFlow`, `mainMenu`) | **Lane UI** (po zip) |
| HUD Tier 1–2 | **Lane W2** (manifest jest) |
| PDF · PACZKA 2 | **Backlog** — bez START |

---

#### Mapa ekran → plik repo (HANDOFF · Cursor 2026-06-26)

| Makieta | `gra/src/ui/` |
|---------|---------------|
| Menu | `mainMenu.ts` |
| Kreator | `newGameFlow.ts` |
| HUD | `hud.ts`, `mapToolbarHud.ts`, `bottomBarHud.ts`, `minimapHud.ts` |
| Miasto | `cityPanel.ts`, `cityUxFrame.ts` |
| Dyplomacja | `diplomacyPanel.ts`, `diploListHud.ts` |
| Walka | `preBattle.ts` |
| Badania | `sciencePicker.ts`, `scienceHubHud.ts` |
| Wojsko | `armyListHud.ts` |
| Koniec gry | `victoryScreen.ts` |
| Brand assets | `icons/brandAssets.ts` |
| Icon registry HUD | `icons/iconRegistry.ts` |
| Tokeny | `brandTokenVars.ts` |

---

### DECYZJA Macieja 2026-06-26 — workflow

| Reguła | Treść |
|--------|--------|
| **Model pracy** | **Jedna tura = jeden START** — NIE sesja 2h w pętli |
| **Sync** | **OneDrive** — zapis w `brand-book/` (jak tura 1) |
| **Kolejność** | **Najpierw tura 2 (A→C)** → potem **backlog D1** po jednym kroku na START |
| **PACZKA 2** | **Defer** do momentu gdy D1-7 = done · wtedy START = jeden blok z tabeli poniżej |

**Odpowiedź na pytanie Design:** wybór **B — rób backlog** (po turze 2). Treść PACZKA-2 jest też tutaj (§5) na później — **nie wykonuj jej teraz na ślepo**.

---

### BACKLOG — jeden START = jeden krok (kolejność)

| # | START wpisz | Zadanie | DoD |
|---|-------------|---------|-----|
| **0** | `START — tura 2` | A HUD dyplomacja · B E-15b · C linki hub | 3 kroki tury 2 |
| **1** | `START — D1-3` | Tier 1 SVG 9×2 | `eksport/icons/res-*.svg` komplet |
| **2** | `START — D1-4` | Tier 2 SVG 5×2 | `tb-*.svg` komplet |
| **3** | `START — D1-5` | Ekrany E final | E-01, E-08…E-13, E-15 win |
| **4** | `START — D1-6` | HANDOFF v2 | `eksport/HANDOFF.md` |
| **5** | `START — D1-7` | Freeze tokenów | `eksport/tokens.css` + `tokens.json` |
| **6+** | `START — PACZKA 2 blok N` | Patrz §5 PACZKA 2 | jeden blok na START |
| **7** | **`START — W1b`** | **Ikony 15 cywilizacji** · patrz §5 **START W1b** poniżej | `civilizations/` + `civ-icon-map.json` |

*(D1-1 partial + D1-2 wchodzą w turę 2 — nie osobny START.)*

---

### ▶ START W1b — ikony cywilizacji (AKTYWNE · dyspozycja dla Design)

**Design wpisz:** `START — W1b`  
**Pełna checklist:** [`brand-book/DYSPOZYCJA.md`](01-propozycje-z-design/brand-book/DYSPOZYCJA.md) — sekcja **▶ START W1b**

#### Co dostarczyć (jedna tura = zip lub zapis OneDrive)

| # | Deliverable | Ścieżka |
|---|-------------|---------|
| 1 | **7 SVG z mockupu** (partenon, gladius, pagoda, słońce, tarcza, piramida, ziggurat) | `eksport/icons/civilizations/civ-{ikonaId}.svg` |
| 2 | **8 SVG nowych** (celtowie…fenicjanie — opisy w DYSPOZYCJA) | j.w. |
| 3 | **Fallback** | `civ-default.svg` |
| 4 | **Manifest** | `eksport/civ-icon-map.json` (**NIE** `icons-manifest.json`) |
| 5 | **HANDOFF** | zaktualizuj mapę plików repo (poniżej) |

#### Mapa `ikonaId` → plik (`civ-icon-map.json`)

```json
{
  "note": "ikonaId z gra/data/civs.json → plik w icons/civilizations/",
  "map": {
    "grecy": "civ-grecy",
    "rzymianie": "civ-rzymianie",
    "chinczycy": "civ-chinczycy",
    "inkowie": "civ-inkowie",
    "zulusi": "civ-zulusi",
    "egipt": "civ-egipt",
    "sumer": "civ-sumer",
    "celtowie": "civ-celtowie",
    "germanie": "civ-germanie",
    "harappa": "civ-harappa",
    "hetyci": "civ-hetyci",
    "slowianie": "civ-slowianie",
    "babilonia": "civ-babilonia",
    "asyria": "civ-asyria",
    "fenicjanie": "civ-fenicjanie",
    "_default": "civ-default"
  }
}
```

#### 7 ikon — źródło w mockupie (kopiuj path 1:1)

Plik: `The Game - Ekran Kreator (1E).dc.html` · siatka kart krok „Cywilizacja":

| ikonaId | Linia ~ | Uwaga |
|---------|---------|-------|
| grecy | 40 | SVG partenon (kolumny + dach) |
| rzymianie | 41 | SVG skrzyżowane miecze |
| chinczycy | 42 | SVG pagoda |
| inkowie | 43 | SVG koło + promienie |
| zulusi | 44 | SVG tarcza |
| egipt | 45 | SVG piramida |
| sumer | 46 | SVG ziggurat |

#### Placeholdery W1b — **kto domyka**

| Element | Brak dziś | Kto |
|---------|-----------|-----|
| Ikony 15 cyw. w grze | monogramy liter | **Design W1b** → Lane integracja |
| `menu-components.css` w menu | stare `.mbtn` | **Lane** (plik jest w eksport/) |
| HUD Tier 1–2 SVG | emoji/stare placeholdery | **Lane W2** (manifest już jest) |
| Baner cyw. dyplomacja | emoji / brak medalionu | **Lane W1c** po W1b (reuse `civIconSvg`) |

#### Mapa ekran → plik repo (HANDOFF 1:1 · stan Cursor 2026-06-26)

| Makieta | Plik `gra/src/ui/` | Uwagi integracji |
|---------|-------------------|------------------|
| Ekran Menu | `mainMenu.ts` | emblem OK · **brak** `menu-components.css` |
| Kreator | `newGameFlow.ts` | **W1b:** `civIconSvg` + medalion |
| HUD Kit | `hud.ts` + `mapToolbarHud.ts` + `bottomBarHud.ts` | W2 |
| Miasto | `cityPanel.ts` | budynki/jednostki SVG ✅ |
| Dyplomacja | `diplomacyPanel.ts` + `diploListHud.ts` | W1c banery cyw. |
| Walka | `preBattle.ts` | — |
| Badania | `sciencePicker.ts` + `scienceHubHud.ts` | — |
| Wojsko | `armyListHud.ts` | — |
| Koniec gry | `victoryScreen.ts` | tokeny ✅ |
| Assety brand | **`icons/brandAssets.ts`** | czyta manifesty + glob SVG |
| Rejestr HUD | `icons/iconRegistry.ts` | Tier 1–2 · **nie** cywilizacje |
| Tokeny | `brandTokenVars.ts` | z `tokens.css` |

**Po zip W1b:** Maciej → Cursor **START** → Lane W1b → MASTER kanon.

#### Backlog na później (NIE w START W1b)

- PACZKA 2 (DS-07, Tier 3 rail HTML, ekrany A…) — §5 poniżej
- PDF Brand Book · WebM menu hero · Tier 3–5 warianty dodatkowe @40px
- Osobne ikony **jednostek nazwanych** (Hastati itd.) — poza v1.0

---

### ETAP D1 — reszta (skrót)

1. Tier 1 SVG komplet 9×2 (`res-food`…`res-settlements`)
2. Tier 2 SVG komplet 5×2 (`tb-cities`…`tb-build`)
3. Ekrany E final: E-01, E-08…E-13, E-15 win
4. `eksport/HANDOFF.md` v2 + freeze `tokens.css/json` w **`brand-book/eksport/`**
5. Log WYMIANA „D1 GOTOWE" (pliki w folderze OneDrive)

### PACZKA 2 — bloki (po D1-7 · jeden blok = jeden START)

> Pełna wersja 3–5h defer. Tu wersja ~2h rozbita na bloki.

| Blok | START | Czas | Zadanie |
|------|-------|------|---------|
| **1** | `START — PACZKA 2 blok 1` | ~25 min | DS-07 dolny pasek + DS-08 modal |
| **2** | `START — PACZKA 2 blok 2` | ~30 min | Tier 3 rail 9× `@24px` + `ikon-rail-miasta.html` |
| **3** | `START — PACZKA 2 blok 3` | ~40 min | A-01, A-02, A-03, A-11 HTML HUD |
| **4** | `START — PACZKA 2 blok 4` | ~15 min | B-01 szkielet panelu miasta |
| **5** | `START — PACZKA 2 blok 5` | ~10 min | HANDOFF + log WYMIANA |

#### BLOK 1 — DS-07 + DS-08

- [ ] `komponent-dolny-pasek.html` (DS-07): WYKONAJ (primary outline) · Koniec tury · disabled · blocking
- [ ] `komponent-modal.html` (DS-08): tło `rgba(8,10,18,0.88)` · panel 5C · Georgia · 2× przycisk 4C · X
- [ ] Link z huba „Komponenty" + powrót · tokeny z `eksport/tokens.css`

#### BLOK 2 — Tier 3 @24px (9 plików)

| Plik | Skąd |
|------|------|
| `cp-buildings.svg` | `tb-cities.svg` |
| `cp-recruit.svg` | `tb-army.svg` |
| `cp-granary.svg` | `res-food.svg` |
| `cp-trade.svg` | `res-treasury.svg` |
| `cp-labor.svg` | `res-work.svg` |
| `cp-culture.svg` | `res-culture.svg` |
| `cp-religion.svg` | `res-religion.svg` |
| `cp-order.svg` | NOWY — waga |
| `cp-health.svg` | NOWY — kaduceusz |

- [ ] 9 plików w `eksport/icons/` · strona `ikon-rail-miasta.html` (9 przycisków, active = złoty obrys)
- **Defer:** wszystkie `-40.svg` Tier 3

#### BLOK 3 — 4 ekrany HUD (Grupa A)

Tło `#080a12` · 1920×1080 · chipy 6C.

| Plik | Must-have |
|------|-----------|
| `A-01-hud-mapa.html` | Górny pasek: Tier 1 + liczby + etykiety PL |
| `A-02-toolbar-lewy.html` | 5 ikon Tier 2 @40px · jedna active (złoto) |
| `A-03-dolny-pasek.html` | Osadź DS-07 |
| `A-11-lista-dyplomacji-hud.html` | 3–4 cyw · uścisk dłoni · panel 5C |

- [ ] Każdy: `← Przegląd (1E)` · hub: sekcja „HUD mapa (4)"

#### BLOK 4 — B-01 szkielet

- [ ] `B-01-ramka-panelu-miasta.html`: chipy 6C · rail Tier 3 · placeholder „Budowa" · ramka 5C

#### BLOK 5 — zamknięcie

- [ ] `eksport/HANDOFF.md` — sekcja „PACZKA 2 blok N"
- [ ] `DYSPOZYCJA.md` CZĘŚĆ E + log WYMIANA
- [ ] **Zapis w `brand-book/`** — OneDrive sync u Macieja

**NIE w PACZKA 2:** Tier 3 @40px · Tier 4/5/6 · pełne 8 ekranów A · pełne B-15…B-34 · PDF · nowe ABC

---

## ▶ START — archiwum ETAP D1 (pełna lista)

**Dyspozycja pełna:** [`brand-book/DYSPOZYCJA.md`](01-propozycje-z-design/brand-book/DYSPOZYCJA.md) — sekcja **▶ START**

**W Design wpisz:**

```
START
```

**ETAP D1 — kolejność:**

1. D1-1 / REQ-003 — dyplomacja = **uścisk dłoni**
2. D1-2 / REQ-002 — **E-15b porażka** `#c84040`
3. D1-3 — Tier 1 SVG komplet (9×2)
4. D1-4 — Tier 2 SVG komplet (5×2)
5. D1-5 — Ekrany E final PO
6. D1-6 — HANDOFF.md v2
7. D1-7 — freeze `tokens.css` + `tokens.json` w **`brand-book/eksport/`**

**Po D1-7:** log `D1 GOTOWE` · OneDrive sync u Macieja.

---

## Jak używać

| Kto | Co robi |
|-----|---------|
| **Maciej** | W START: blok **SKOPIUJ … DO …** · po potwierdzeniu Design: „Design tura N w repo" |
| **Claude Design** | Zapis w **`brand-book/`** · status w YAML `design` · REQ z `queue_design` |
| **Lane UI** | Czyta **`brand-book/`** + ten plik · review · handoff do Mastera po **`przekaż do Mastera`** |

---

## Status (skrót)

| Pole | Teraz |
|------|--------|
| Dogadane UI ↔ Design | **✅** |
| Folder kanon | `01-propozycje-z-design/brand-book/` |
| Maciej review wizualny | **✅ pozytywny** |
| Faza | **Tura 1 done · START tura 2** (A HUD dyplomacja · B E-15b · C linki) |

---

## Kolejka do Claude Design (aktywna)

1. **REQ-001** — ZIP/export do `01-propozycje-z-design/`
2. **REQ-002** — Game over **porażka**
3. **REQ-003** — Dyplomacja = **uścisk dłoni** (nie pergamin+pióro)
4. **REQ-004** — SVG Tier 3–5
5. **REQ-005** — Hub + linki prototypu

---

## Log wymiany (append-only)

| Data | Kto | Co |
|------|-----|-----|
| 2026-06-26 | Maciej | **SKOPIUJ wprost** w każdym START — pełne ścieżki OneDrive · Design kopiuje |
| 2026-06-26 | Claude Design | **Tura 1:** hub kafelki ✅ · dyplomacja SVG ✅ · HUD toolbar defer |
| 2026-06-26 | Lane UI | Sync WYMIANA §5 · START tura 2 (A/B/C) |
| 2026-06-26 | Maciej | **Backlog** — jeden START = jeden krok · PACZKA 2 defer do D1-7 · §5 rozbudowane |
| 2026-06-26 | Maciej | **`START`** — autoryzacja ETAP D1 dla Claude Design |
| 2026-06-26 | Lane UI | **START** dla Design · `brand-book/DYSPOZYCJA.md` ETAP D1 (kroki 1–7) |
| 2026-07-01 | Maciej | **DOGADAJCIE SIĘ** → protokol DOGADANE · review wizualny pozytywny |
| 2026-07-01 | Maciej | **GitHub** — sync Design push / Lane UI pull · dual-START |
| 2026-07-01 18:30 | Lane UI | **START #1** — paczka tura 2 wydana → START u Design |
| 2026-07-01 | Maciej | **HANDOFF-CLAUDE-CODE.md** zapisany w `brand-book/` |
| 2026-07-01 | Lane UI | **START** — poll **5 plików** · brak `eksport/` · brak zip inbox · push WYMIANA |
| 2026-07-01 | Lane UI | **BRAK paczki Brand Book** — prośba do Design: sprawdź export (patrz sekcja [Cursor] poniżej) |
| 2026-07-01 | Maciej | Rozpakowano **Ulepszenie infografik2.zip** (nowa paczka) |
| 2026-07-01 | Lane UI | **START** — hoist do kanonu · **18 dc.html · 34 SVG · tb-diplomacy ✅** |
| 2026-07-05 ~23:10 | Lane UI | **P0 rejestracja:** A-08 + HEX-CONTEXT w `queue_design` — wcześniej tylko pliki repo, Maciej pytał ≥2× · wklejka `WKLEJKA-DESIGN-P0-HEX-A08-MACIEJ-2026-07-05.md` |
| | | |

*(Dopisuj nowe wiersze na dole — nie kasuj historii.)*

---

## Prompt skrót dla Claude Design (z tym plikiem)

```
START — tura 2

Czytam repo (read-only): WYMIANA + DYSPOZYCJA + HANDOFF-CLAUDE-CODE.md.
A) A-02 toolbar = eksport/icons/tb-diplomacy.svg
B) E-15b porażka #c84040
C) linki ← Powrót do huba

Koniec tury:
· CZĘŚĆ E + log [Design] w WYMIANA
· brand-book.zip (pełna paczka) — Maciej wrzuca do _staging/inbox/
· NIE git push (u Ciebie read-only)
```

---

## [Cursor] 2026-07-01 · START — tura 2 aktywna

- **Poll:** 5 plików w `brand-book/` (md + HANDOFF) · **brak** `eksport/` · **brak** `.dc.html`
- **Zip inbox:** BRAK — czekamy na `brand-book.zip` od Design
- **Git push:** WYMIANA + DYSPOZYCJA (+ HANDOFF) — Lane UI
- **Następny krok Macieja:** **START** u Claude Design

---

## [Cursor] → Claude Design · paczka Brand Book **NIE dotarła**

**Do:** Claude Design  
**Od:** Lane UI / Cursor (po START Macieja + poll lokalny)

Paczka **Brand Book** (HTML + `eksport/` + ikony), o której rozmawialiśmy — **u nas nie ma**.

### Co sprawdziliśmy (kanon lokalny + poll)

| Oczekiwane | Stan |
|------------|------|
| `brand-book.zip` w `_staging/inbox/` | **BRAK** |
| `eksport/tokens.css`, `tokens.json` | **BRAK** |
| `eksport/icons/*.svg` (min. `tb-diplomacy.svg`) | **BRAK** |
| Pliki `.dc.html` (hub, ekrany E, biblioteka ikon) | **BRAK** (0 plików) |
| `support.js` obok `.dc.html` | **BRAK** |

### Co **jest** (tylko dokumentacja)

- `HANDOFF-CLAUDE-CODE.md` — Maciej zapisał ręcznie ✅
- `DYSPOZYCJA.md`, README, paczki `.md` ✅
- W folderze leży **`Ulepszenie infografik.zip`** — **to nie** `brand-book.zip`; **nie rozpakowane**, nie wiemy czy to właściwa paczka

### Prośba — **sprawdź u siebie**

1. Czy **na pewno** wygenerowałeś i wysłałeś **`brand-book.zip`** (pełna struktura z HANDOFF §1)?
2. Czy zip trafił do Macieja (link / załącznik / instrukcja pobrania) — **nie tylko** opis w czacie?
3. Jeśli robiłeś **git push** — u Ciebie narzędzia GitHub są **read-only**; push **nie mógł** zapisać plików w repo.
4. **Wyślij ponownie:** `brand-book.zip` (1:1 wg HANDOFF) + potwierdź w sekcji **`[Design]`** poniżej, co dokładnie wysłałeś i gdzie.

### Docelowa dostawa (przypomnienie)

```
brand-book.zip → Maciej: docs/ux/claude-design/_staging/inbox/brand-book.zip
→ Maciej: START (Cursor) → Lane UI rozpakuje do brand-book/
```

**Bez tej paczki tura 2 (A/B/C) jest zablokowana** — brak `eksport/icons/tb-diplomacy.svg` i ekranów `.dc.html`.

*(Design: dopisz odpowiedź w sekcji `[Design]` — append-only.)*

---

## [Cursor] 2026-07-01 · START — Brand Book w kanonie ✅

**Po rozpakowaniu Macieja (`infografik2`):** pliki były w `Ulepszenie infografik2/brand-book/` — Lane UI **przeniósł do korzenia kanonu**.

| Element | Stan |
|---------|------|
| `.dc.html` | **18** (w tym Badania, Wojsko) |
| `support.js` | ✅ |
| `eksport/tokens.css` + `tokens.json` | ✅ |
| `eksport/icons/*.svg` | **34** |
| `tb-diplomacy.svg` | ✅ |

**Poll:** OK · **W1b odblokowane** (ikony w `eksport/icons/`).

**Uwaga:** stare zagnieżdżenia `Ulepszenie infografik/` i `Ulepszenie infografik2/` można usunąć (duplikat) — opcjonalnie.

**Następne:** wdrożenie tokenów/ikon do `gra/src/ui/` (W1) · review tury 2 vs pliki Design.

---

## [Cursor] 2026-07-01 · START — infografik8 (delta) · werdykt zamknięcia

**Wejście:** `Ulepszenie infografik8.zip` (Maciej → kanon) · `git pull` = up to date.

**Scalono:** 7 plików zmienionych (5× `.dc.html` flow, `eksport/HANDOFF.md`, `DYSPOZYCJA.md` — bez nowych plików).

| Element | Stan po infografik8 |
|---------|---------------------|
| `.dc.html` | **18** (bez zmiany liczby) |
| SVG `eksport/` | **62** (34 core + tier1/2) |
| `tokens.css` / `tokens.json` | ❄ FROZEN v1.0 ✅ |
| Poll | **210 OK** (`docs/obieg/_poll-claude-design-last.md`) |
| Nawigacja flow | ✅ Menu→Przegląd · panele HUD→← HUD · Kreator→← Wstecz→Menu · Kreator Kroki→← Przegląd |
| `HANDOFF.md` v2 changelog | pisze **„DESIGN ZAMKNIĘTY”** |

### Checklist MUST (przed integracją W1) — **nie spełnione w całości**

| # | Punkt | Werdykt |
|---|--------|---------|
| 1 | **HANDOFF** — mapa na prawdziwe pliki `.ts` w `gra/src/ui/` (nie `.tsx`) | ❌ nadal `MainMenu.tsx`, `CityPanel.tsx` itd. |
| 2 | **DYSPOZYCJA.md** — status all DONE + „Design zamknięty” | ❌ nadal stary plan D1 TODO |
| 3 | Nawigacja back-linki | ✅ (infografik8 domknął) |
| 4 | Finalny **`brand-book-closed.zip`** (korzeń = pełny `brand-book/`) | ❌ brak; infografik8 = delta 86 plików |
| 5 | D1-5 Badania/Wojsko vs repo | ⏸ makiety są; dopasowanie do `sciencePicker.ts` / `armyListHud.ts` = temat W1 |

### Werdykt Lane UI

**Design — prawie zamknięty, ale nie gotowy do sign-off integracji.**

Design oznaczył zamknięcie w `HANDOFF.md`, lecz **nie zaktualizował mapy TS ani `DYSPOZYCJA.md`**. Lane UI może w W1 użyć **własnej mapy** (handoff `dyspozycje/_handoff/UI-do-MASTER_brand-book-w1.md`) — ale formalne zamknięcie wymaga **jednej poprawki od Design** albo **decyzji Macieja: „idziemy mimo HANDOFF .tsx”**.

### Prośba do Design (ostatnia tura — 2 punkty)

1. **`eksport/HANDOFF.md`** — podmień kolumnę „Komponent TS” na pliki z repo: `mainMenu.ts`, `newGameFlow.ts`, `hud.ts`, `cityPanel.ts`, `diplomacyPanel.ts`, `preBattle.ts`, `sciencePicker.ts`, `armyListHud.ts`, `victoryScreen.ts`, `icons/iconRegistry.ts`.
2. **`DYSPOZYCJA.md`** — tabela D1: wszystkie kroki **DONE** (D1-4/D1-6 odłożone świadomie) + nagłówek **„DESIGN ZAMKNIĘTY · 2026-07-01”** + opcjonalnie pełny **`brand-book-closed.zip`**.

**Maciej:** wrzuć kolejny zip gdy Design odpowie → **START** ponownie. Albo napisz **„W1 mimo HANDOFF”** — wtedy Lane UI startuje integrację bez czekania.

---

## [Cursor] 2026-07-01 · START — infografik11 · **Design zamknięty ✅ · W1 gotowe**

**Wejście:** `Ulepszenie infografik11.zip` · `git pull` = up to date · inbox pusty.

**Scalono:** 2 pliki — `eksport/HANDOFF.md`, `HANDOFF-CLAUDE-CODE.md` (infografik9 = duplikat kanonu, bez zmian).

| Element | Stan |
|---------|------|
| `DYSPOZYCJA.md` | ✅ **DESIGN ZAMKNIĘTY** (infografik8/9) |
| `eksport/HANDOFF.md` | ✅ `.tsx` usunięte · ścieżki `gra/src/ui/*.ts` |
| Poll | **212 OK** |
| Tokeny / SVG / 18× `.dc.html` | bez zmian · ❄ FROZEN v1.0 |

### Uwaga integracyjna (Lane UI, nie Design)

Mapa w `HANDOFF.md` używa **PascalCase** (`MainMenu.ts`, `TechTree.ts`…) — w repo są **camelCase** (`mainMenu.ts`, `sciencePicker.ts`, `newGameFlow.ts`…). To normalizuje **Lane UI w W1** wg `dyspozycje/_handoff/UI-do-MASTER_brand-book-w1.md` — **nie blokuje** integracji.

### Werdykt

**Design zamknięty.** Można ruszyć **W1** (tokeny + ikony SVG → `gra/src/ui/`). Kolejny krok: dyspozycja Lane UI / MASTER integracja po review.

---

## [Cursor] 2026-07-02 · START — `ostatnie/` · **PACZKA FINAL ✅ · W1 odblokowane**

**Wejście Macieja:** `brand-book/ostatnie/Ulepszenie infografik.zip` (07-02 00:08) · `infografik2.zip` = duplikat po scaleniu · `git pull` up to date.

**Folder drop Macieja (ustalone):**
`...\brand-book\ostatnie\`

**Scalono do kanonu** (`brand-book/` korzeń):
- **+138 nowych** · **2 zmienione** · 84 bez zmian (vs poprzedni kanon)

| Element | Stan |
|---------|------|
| `.dc.html` | **18** |
| SVG `eksport/icons/` | **194** |
| Tier 3–7 + manifest | ✅ `icons-manifest.json` |
| Menu CSS/SVG | ✅ `menu-emblem`, `menu-background.css`, `motion.css`, `menu-components.css` |
| Budynki | ✅ 13× `bld-*` + `building-icon-map.json` |
| Jednostki | ✅ 12× `unit-*` + `unit-icon-map.json` |
| Improvements + resources-map | ✅ 10 + 6 |
| `HANDOFF.md` | ✅ camelCase (`mainMenu.ts`, `cityPanel.ts`…) |
| `DYSPOZYCJA.md` | ✅ **PACZKA FINAL · DONE** |
| Poll | **359 OK** |

### Werdykt

**PACZKA FINAL kompletna.** Design domknięty w 100%. **Można W1** — integracja tokenów, menu, ikon (w tym budynki/jednostki zamiast emoji) w `gra/src/ui/`.

**Maciej:** kolejne zipy → `brand-book/ostatnie/` → **START**. Opcjonalnie posprzątać duplikaty `Ulepszenie infografik/` w korzeniu `brand-book/`.

---

## [Cursor] 2026-06-26 · W1 done — integracja PACZKA FINAL w lane UI

**Trigger Macieja:** posprzątaj + W1.

### Posprzątanie
- Usunięto z korzenia `brand-book/`: foldery `Ulepszenie infografik2/` oraz zipy infografik3–11.
- Zostawiono: kanon + archiwum `brand-book/ostatnie/`.

### W1 — wdrożone (lane UI, bez `main.ts`)

| Plik | Zmiana |
|------|--------|
| `gra/src/ui/icons/brand/` | ~200 assetów (SVG tier1–7, budynki, jednostki, manifesty, CSS) |
| `gra/src/ui/icons/brandAssets.ts` | API: `brandIconSvg`, `buildingIconSvg`, `unitIconSvg`, menu CSS/emblem |
| `gra/src/ui/icons/iconRegistry.ts` | Tier 1–2 z manifestu (zamiast placeholderów inline) |
| `gra/src/ui/brandTokenVars.ts` | Sync FROZEN `tokens.css` + aliasy `--civ-*` |
| `gra/src/ui/mainMenu.ts` | Emblem Design, `motion.css`, tło `menu-background.css` |
| `gra/src/ui/cityPanel.ts` | Miniaturki budynków/jednostek: emoji → SVG (stela/stolarnia = CSS legacy) |

### Testy lane
- `victory-screen-test`: **11/11**
- `smoke`: **OK**

### Następny krok
**MASTER:** build kanon → bramka testów → review Opus → `Gra-podglad.html`. Handoff: `dyspozycje/_handoff/UI-do-MASTER_brand-book-w1.md`.

---

## [Cursor] 2026-06-26 · **START W1b** — dyspozycja formalna (§5 + DYSPOZYCJA)

**Poprzedni wpis W1b** był statusem Lane — **nie dyspozycją Design**. Poprawione.

**Design:** wpisz `START — W1b` · czytaj **`brand-book/DYSPOZYCJA.md`** (sekcja ▶ START W1b) + **WYMIANA §5 START W1b**.

**Deliverable:** `eksport/icons/civilizations/` (15 + default) · `eksport/civ-icon-map.json` · HANDOFF update · zip → `ostatnie/`.

**NIE:** wpisy do `icons-manifest.json` (to HUD Tier 1–7).

**Maciej:** po zip od Design → **START** u Cursor (Lane W1b integracja).

---

## [Cursor] 2026-06-26 · W1b — dyspozycja Design: ikony 15 cywilizacji (archiwum — zastąpione sekcją powyżej)

**Trigger Macieja:** infografiki per cyw. w kreatorze (medalion + SVG, jak mockup).

**Stan:** PACZKA FINAL **nie zawiera** `eksport/icons/civilizations/`. Mockup `Ekran Kreator (1E).dc.html` ma **7** ikon inline; w grze są monogramy liter.

### Prośba do Design (tura W1b)

1. **`eksport/icons/civilizations/`** — 15 plików SVG @24, styl 3C line, `currentColor`:
   - `grecy`, `rzymianie`, `chinczycy`, `inkowie`, `zulusi`, `egipt`, `sumer` — **jak mockup kreatora**
   - `celtowie`, `germanie`, `harappa`, `hetyci`, `slowianie`, `babilonia`, `asyria`, `fenicjanie` — **nowe**, ten sam styl
   - opcjonalnie `civ-default.svg` fallback
2. **`eksport/civ-icon-map.json`** — mapa `ikonaId` z `gra/data/civs.json` → nazwa pliku
3. Zip → `brand-book/ostatnie/` · **START** (Cursor) → lane W1b integracja

**Lane po dostawie:** `dyspozycje/_handoff/UI-do-MASTER_w1b-cyw-icons.md`

**Maciej:** wrzuć zip gdy Design odpowie **albo** napisz **„W1b bez Design — 7 z mockupu + reszta placeholder”** — wtedy lane startuje od razu.

---

## [Cursor] 2026-06-26 · START — `Downloads/Ulepszenie infografik` · menu icons ✅ · W1b cyw. ❌

**Wejście:** `c:\Users\macie\Downloads\Ulepszenie infografik\` → scalono do kanonu · archiwum: `brand-book/ostatnie/Ulepszenie infografik-menu-icons/`.

| Element | Werdykt |
|---------|---------|
| `eksport/icons/menu/` | **+30 SVG** (15×24/40): play, campaign, multiplayer, settings, more, exit, load, save, credits, language, audio, controls, achievements, info, emblem-mini |
| `icons-manifest.json` | **+15** wpisów `menu-*` |
| `menu-icons-preview.html` | ✅ |
| `civilizations/` + `civ-icon-map.json` | ❌ **BRAK** — **nie** START W1b |

**Werdykt:** paczka = **ikony przycisków menu**, nie cywilizacje. W1b nadal czeka.

**Design:** nadal potrzebny `START — W1b` (15 cyw.). Ta paczka ≠ W1b.

**Opcje Macieja:** (1) Lane **W1-menu** — podpiąć ikony w `mainMenu.ts` · (2) czekać W1b cyw. · (3) oba.

---

---

## § W3-miasto-1E — pełny ekran miasta (2026-07-03)

> ⛔ **STOP 2026-07-03:** mockup **NIEAKTUALNY** względem kanonu (`153fcda2…`).  
> **Nie edytuj** dopóki Maciej nie da ABC + hasło `START — W3-miasto-v3-delta`.  
> **Delta:** `dyspozycje/_handoff/MASTER-do-UI-DESIGN_miasto-baseline-2026-07-03.md`

**Hasło Design (ZAMROŻONE):** `START — W3-miasto-1E` — **NIE STARTUJ** bez unfreeze.

**Design — pierwszy plik:**  
`brand-book/START-W3-miasto-1E.md` (kroki 0→6, nie tylko hasło)

**Dane w brand-book (bez repo):**  
`brand-book/referencje-w3/BUDYNKI-tabela.md` · `DANE-MIASTO-skrot.md` · `JEDNOSTKI-skrot.md`

**Edytuj:** `brand-book/The Game - Ekran Miasto (1E).dc.html`

**Handoff repo:** `dyspozycje/_handoff/UI-do-DESIGN_w3-miasto-1E-dane.md`

**Status:** **DONE Design — rail 9/9** (3 pliki mockup miasta + szata-sync komplet)

| Mockup miasto | Zakładki |
|---------------|----------|
| `Ekran Miasto W3 (1E)` | Budowa + chrome |
| `Miasto Zakładki W3 (1E)` | Rekrutacja · Handel · Porządek · Zdrowie |
| `Miasto Zakładki W3 cz2 (1E)` | Spichlerz · Praca · Kultura · Religia |

**Lane:** W-WIKI-2 + W3-full · **Design:** BACKLOG W1b

---

## § Wikipedia — HUD mapa + miasto (2026-07-03)

**Sign-off Maciej:** panel Wiki działa · wejście ma być **górny pasek obok Menu** (nie toolbar lewy / minimapa).

**Handoff repo:** `dyspozycje/_handoff/UI-do-DESIGN_wikipedia-hud-mockup.md`

**Design — obowiązkowo w mockupach:**

| Ekran | Wymaganie |
|-------|-----------|
| **Mapa świata** (1E / hub) | Przycisk **Wiki** prawy górny róg, przed **Menu** · panel boczny Poradnik/Encyklopedia |
| **Miasto** (W3-miasto-1E) | **Ten sam** przycisk w tym samym miejscu · panel nad UI miasta |

**Asset:** `eksport/icons/ui-wiki.svg` (@24/@40, 3C line)

**Referencja w grze:** `Gra-podglad.html` · kod `gra/src/ui/hud.ts` (`.b-wiki`) + `wikiHubHud.ts`

**Status:** CZEKA Design (mockup + ikona) · treść rev. E już w bundle

---

## § Szata sync HUD mapy (2026-07-03)

**Hasło Design:** `START — szata-sync-2026-07-03`

**Design — pierwszy plik:** `brand-book/START-szata-sync-2026-07-03.md`

**Edytuj:** `HUD Mapy layout (1E).dc.html` · `HUD Kit (1E).dc.html` · `Ekran Miasto (1E).dc.html` (Wiki + brak dolnego chrome)

**Handoff repo (Lane):** `dyspozycje/_handoff/UI-do-DESIGN_szata-sync-2026-07-03.md`

**Decyzje Macieja:** D16=A banery OUT · D17=A kontekst tylko po wyborze · wydarzenia nad turą · Wiki obok Menu

**Deliverable:** `ostatnie/HUD-map-sync-2026-07-03.zip` + **`The Game — HUD Panele stany (1E).dc.html`**

**Status:** **DONE Design — komplet** (pliki 8+9 + layout + ui-wiki.svg) · **CZEKA:** sync OneDrive → Lane UI

**Paczka:** `HUD-map-sync-2026-07-03 komplet` · plik **#9** = `Ekran Miasto (1E)` dim opaque + Wiki u góry

**Tura 2:** `HUD Panele stany (1E)` — C0 · C1 · C2 · Wiki 340px

**W3-miasto-1E:** nadal otwarte — pełna zawartość panelu (rail 9, budynki, okolica…) — **nie** mylić z plikiem #9 (tylko szata wejścia w miasto)

---

*Lane UI · protokół wymiany v3 · DOGADANE 2026-07-01*

---

## [2026-07-23] INTEGRATOR (sesja chmurowa) → DESIGN — paczka DO-DESIGN-2026-07-23 (PRE-BATTLE nakładka TW)

**Wklejka dla Design (Maciej):** cały folder `docs/ux/claude-design/DO-DESIGN-2026-07-23/` — START od `INSTRUKCJA-DLA-CLAUDE-DESIGN.md`.

**Zlecenie 1 (GŁÓWNE):** dopracować makietę PRE-BATTLE (nakładka na widocznej mapie, 3 klatki: atak w polu / atak na miasto Oblegaj-Szturm / obrona bez wycofania) → kanon `.dc.html`. Baza: `makiety/Makieta-PREBATTLE-v1-TW-nakladka.html` + zrzuty klatek w `zrzuty-makiet/`.

**Zlecenie 2 (zaległe):** dosłać `eksport/` (tokens.css/json, motion.css, icons/*.svg, *-icon-map.json) — nie dojechał w żadnej z 3 paczek.

**Statusy:** DYPLOMACJA FINAL — wdrożona w grze 1:1, ZAMKNIĘTA (zrzut w paczce) · plansze bitwy wg terenu + czyste pole na czarnym tle — WDROŻONE (8 zrzutów w paczce) · POLE-BITWY-TW-v5 (6 klatek) — przyjęte, wdrożenie po stronie integratora.

**Status:** CZEKA: Design — paczka PREBATTLE-TW + eksport/.

---

## [2026-07-23] INTEGRATOR (sesja chmurowa) — instalacja KANON do żywego brand-booka (KROK 1, paczka DYPLOMACJA FINAL)

**Co:** pliki KANON leżały tylko w snapshocie `_dist/DYPLOMACJA-FINAL-2026-07-23/brand-book/KANON/`. Zainstalowane do żywego `docs/ux/claude-design/01-propozycje-z-design/brand-book/KANON/`:
- `CANON.md`
- `START - KANON aktualny (1E).dc.html` (hub)
- `mockupy/The Game - Dyplomacja panel negocjacji v1.1 -1E-.dc.html`
- `mockupy/support.js`

**Źródło potwierdzone jako nowsze** względem `_dist/POLE-BITWY-TW-v5-2026-07-23/brand-book/KANON/` (jedyny inny snapshot z folderem KANON) — porównanie md5 + diff `CANON.md`/`START…html` pokazało, że wersja POLE-BITWY-TW-v5 NIE ma jeszcze wpisu „Dyplomacja — panel negocjacji v1.1", więc jest starsza.

**Backupy:** żaden — w żywym brand-booku folder `KANON/` wcześniej nie istniał, więc nie było czego nadpisywać.

**Weryfikacja linków hubu:** hub linkuje 39 unikalnych plików `mockupy/*.dc.html`. Po instalacji: **1 działający** (Dyplomacja panel negocjacji v1.1), **38 martwych** (plik nie istnieje w `KANON/mockupy/`). To jest lista brakujących dostaw Design — część z tych 38 nazw istnieje gdzieś indziej w repo pod innymi ścieżkami (starsze paczki/snapshoty), ale nie w kanonicznym `KANON/mockupy/`. Pełna lista martwych linków w raporcie sesji.

**Nie robione:** żadna zmiana kodu gry, brak commita (zgodnie ze zleceniem — commit robi Maciej).

