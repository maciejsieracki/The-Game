---
# WYMIANA UI (Cursor) ↔ Claude Design — jeden plik, obie strony
# Maciej: aktualizuj ręcznie LUB każda strona dopisuje swoją sekcję
# Lane UI: czyta + aktualizuje blok `lane_ui` po działaniu
# Claude Design: czytaj na upload + dopisuj do `design` po deliverable

version: 3
updated: "2026-06-26"
phase: "brand_book_d1"
kanon_sciezek: "docs/ux/claude-design/KANON-SCIEZEK.md"
schemat_az: "docs/ux/SCHEMAT-AZ-UX-PIPELINE.md"
design_start: true
design_start_date: "2026-06-26"
design_start_trigger: "Lane UI → START w brand-book/DYSPOZYCJA.md"

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
  ustalenie: "2026-07-01 — Maciej: GitHub sync · dual-START"
  sync_model: "github_wymiana_plus_zip"
  sync_model_decyzja: "Git = WYMIANA + DYSPOZYCJA · pliki = brand-book.zip · Design read-only repo · Lane UI commit/push"
  workflow_doc: "docs/ux/claude-design/WORKFLOW-GITHUB-SYNC.md"
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
  last_action: "2026-07-01 Maciej wybral GitHub — WORKFLOW-GITHUB-SYNC · czeka remote origin"
  review: "W1 prep w kodzie · sync przez git pull po push Design"
  next: "Po setup GitHub + tura 2 push: W1b iconRegistry"

maciej:
  next_step: "1) GitHub remote 2) START Cursor 3) START Design"
  po_tura: "Design: git push · Lane UI: git pull przy nastepnym START Cursor"

queue_design:
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

*(D1-1 partial + D1-2 wchodzą w turę 2 — nie osobny START.)*

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

*Lane UI · protokół wymiany v3 · DOGADANE 2026-07-01*
