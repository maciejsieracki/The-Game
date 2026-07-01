# DYSPOZYCJA — Claude Design ↔ The Game (Civ)

> **Folder zapisu (JEDYNY):** `brand-book/`  
> **Eksport:** `brand-book/eksport/`  
> **Status/kolejka:** [`../WYMIANA-UI-DESIGN.md`](../WYMIANA-UI-DESIGN.md)  
> **Checklist A→Z:** [`../../SCHEMAT-AZ-UX-PIPELINE.md`](../../SCHEMAT-AZ-UX-PIPELINE.md)  
> **Decyzje (ZAMKNIĘTE):** 1B, 2C, 3C, 4C, 5C, 6C, 7A, 8A  
> **Spec ikon:** `00-brand-book-pakiet/01-dokumenty/02-SPEC-IKONY.md`  
> **Pełna lista deliverables (archiwum referencyjne):** `../brand-book-1E/DYSPOZYCJA.md` sekcje A1–A10  

**Ostatnia aktualizacja:** 2026-07-01 · Lane UI · protokół **dual-START** (model B)

**Protokół sync:** [`../WORKFLOW-GITHUB-SYNC.md`](../WORKFLOW-GITHUB-SYNC.md) · dual-START  
**Archiwum zip:** [`../WORKFLOW-DUAL-START.md`](../WORKFLOW-DUAL-START.md)

---

# Maciej — tylko dwa START na turę

| Kolejność | Gdzie | Wpisz |
|-----------|-------|-------|
| **1** | **Cursor** (Lane UI) | `START` |
| **2** | **Claude Design** (chmura) | `START` (jak w sekcji ▶ START poniżej) |

Lane UI przygotowuje paczkę w tym pliku. Design czyta ją (Link local code → odczyt OneDrive).

---

# ▶ START — tura 2 (AKTYWNA — od Lane UI)

**Pełna spec:** [`../WYMIANA-UI-DESIGN.md`](../WYMIANA-UI-DESIGN.md) — sekcja **NASTĘPNY START tura 2**

```
START — tura 2
```

| Krok | Zadanie |
|------|---------|
| A | A-02 toolbar HUD = **identyczny** `eksport/icons/tb-diplomacy.svg` |
| B | E-15b porażka `#c84040` + link hub |
| C | Linki `← Powrót do Przeglądu` na ekranach z kafelków tury 1 |

**NIE w tej turze:** Tier 3–5 · PDF · D1-3…D1-7 · PACZKA 2.

### Koniec tury — Design (zip + log)

1. **CZĘŚĆ E** — raport (append w WYMIANA lub pliku do wklejenia).
2. **WYMIANA** — sekcja `[Design]`: `tura 2 done · zip ready`.
3. **`brand-book.zip`** — pełna paczka (HTML + `eksport/` + ikony).
4. Maciej: zip → `_staging/inbox/` **lub** link w czacie → **START (Cursor)**.
5. Lane UI: rozpakowuje · commit/push · poll.

Design **nie pushuje** git (read-only u Ciebie).

---

# ▶ START — ETAP D1 pełny (archiwum)

**Trigger od Macieja / Lane UI:** **`START`**

## Co robisz teraz (ETAP D1 — P0)

Realizuj **w tej kolejności**. Po każdym punkcie dopisz wiersz w **CZĘŚĆ E — Dyspozycje wychodzące** + zaktualizuj status w [`WYMIANA-UI-DESIGN.md`](../WYMIANA-UI-DESIGN.md) (`queue_design` → `done_design`).

| Krok | ID | Zadanie | DoD (gotowe gdy…) |
|------|-----|---------|-------------------|
| **1** | D1-1 / REQ-003 | **`tb-diplomacy` = uścisk dłoni** wszędzie | Ten sam SVG w bibliotece, HUD, toolbarze; **usuń** pergamin+pióro |
| **2** | D1-2 / REQ-002 | **E-15b — ekran porażki** | Layout = wygrana E-15; akcent **`#c84040`**; CTA outline 4C |
| **3** | D1-3 | **Tier 1 komplet** — 9 ikon × 2 rozmiary (24+40 px) | Pliki w `eksport/icons/` wg SPEC (`res-food`…`res-settlements`) |
| **4** | D1-4 | **Tier 2 komplet** — 5 ikon × 2 rozmiary | W tym poprawiony dyplomacja; `tb-build` = instancja `res-work` |
| **5** | D1-5 | **Ekrany E final PO** | E-01, E-08…E-13, E-15 (win) — zgodne 1B–6C, **zero emoji** |
| **6** | D1-6 | **`eksport/HANDOFF.md` v2** | Mapowanie ekran → plik TS · changelog · breaking changes |
| **7** | D1-7 | **Freeze tokenów v1** | `eksport/tokens.css` + `tokens.json` — lane UI sync bez zgadywania |

**NIE rób teraz (defer):** REQ-004 Tier 3–5 · REQ-005 hub kafelki · PDF · responsywność.

## Gdzie zapisywać

```
docs/ux/claude-design/01-propozycje-z-design/brand-book/
├── DYSPOZYCJA.md          ← ten plik
├── eksport/
│   ├── tokens.css
│   ├── tokens.json
│   ├── HANDOFF.md
│   └── icons/*.svg
├── The Game — Przegląd (1E).dc.html
├── support.js
└── *.html                 ← ekrany PO
```

**Nie twórz:** `brand-book-1E/`, `brand-book-2/`, inne foldery.

## Sync — GitHub (dual-START)

Design: **commit + push** tylko `docs/ux/claude-design/…`  
Lane UI przy START Cursor: **`git pull`** (`tools/sync-design-github.ps1`)

Szczegóły: [`../WORKFLOW-GITHUB-SYNC.md`](../WORKFLOW-GITHUB-SYNC.md)

## Reguły (nie negocjuj bez ABC Macieja)

- Ikony **3C:** konkretny przedmiot z SPEC (młotek, chleb, uścisk dłoni, sowa…).
- Przyciski **4C:** outline złoty 2px, tło przezroczyste.
- Panele **5C:** obwódka 2px + cień + nagłówek.
- Chipy **6C:** ikona + liczba + **etykieta PL** (np. „Skarbiec”).
- **Zakaz emoji** w finalnych ekranach gry.

## Po START — pierwsze 3 minuty

1. Otwórz [`WYMIANA-UI-DESIGN.md`](../WYMIANA-UI-DESIGN.md) — YAML `queue_design`.
2. Otwórz hub `The Game — Przegląd (1E).dc.html` — sprawdź linki.
3. Zacznij od **kroku 1** (dyplomacja = uścisk dłoni).

---

# CZĘŚĆ C — DYSPOZYCJE PRZYCHODZĄCE (aktywne)

| ID | Pri | Status | Tekst |
|----|-----|--------|-------|
| **D1-1** | P0 | **🟡 partial** | REQ-003 dyplomacja — SVG OK · HUD A-02 → tura 2 |
| **D1-2** | P0 | **next** | REQ-002 — E-15b porażka `#c84040` (tura 2B) |
| **D1-3** | P0 | open | Tier 1 SVG komplet → `eksport/icons/` |
| **D1-4** | P0 | open | Tier 2 SVG komplet |
| **D1-5** | P0 | open | Ekrany E final (menu + kreator + game over win) |
| **D1-6** | P0 | open | HANDOFF.md v2 |
| **D1-7** | P0 | open | Freeze tokens w `brand-book/eksport/` (zapis → OneDrive) |
| REQ-005 | P2 | **✅ done** | Hub kafelki (tura 1) |

---

# CZĘŚĆ D — STATUS ODPOWIEDZI (Design uzupełnia)

| Temat | Status | Uwagi |
|-------|--------|-------|
| ETAP D1 — tura 1 | 🟡 | hub ✅ · dyplomacja SVG ✅ · HUD defer |
| REQ-003 dyplomacja | 🟡 | eksport OK · A-02 tura 2 |
| REQ-002 E-15b porażka | ⬜ | tura 2B |
| REQ-005 hub kafelki | ✅ | tura 1 |
| Tier 1+2 SVG | ⬜ | D1-3, D1-4 |
| Sync plików | ⬜ | GitHub — czeka `remote origin` + autoryzacja Design |

---

# CZĘŚĆ E — DYSPOZYCJE WYCHODZĄCE (Design dopisuje)

| Data | Kto | Co |
|------|-----|-----|
| 2026-06-26 | Claude Design | **Tura 1:** hub kafelki · tb-diplomacy SVG · HUD toolbar defer |
| 2026-06-26 | Lane UI | Wydano **START** · ETAP D1 · kolejność kroków 1–7 |

*(Design: dopisuj każdy ukończony krok — append-only.)*

---

# CZĘŚĆ F — PACZKI Lane UI (Lane UI dopisuje przed START u Design)

| Data | Tura | Lane UI przygotował | Status Design |
|------|------|---------------------|---------------|
| 2026-07-01 18:30 | 2 | ▶ START tura 2 (A/B/C) + **git push** | ⬜ czeka GitHub setup |

*(Lane UI: po odczytaniu CZĘŚĆ E „tura N done" + pull zip — wpisz następną paczkę ▶ START — tura N+1.)*

---

# Prompt START (Design — wklej po Lane UI paczce)

```
START — tura 2

Czytam brand-book/DYSPOZYCJA.md (▶ START — tura 2) + WYMIANA-UI-DESIGN.md.
Realizuję kroki A→C. Decyzje: 1B 2C 3C 4C 5C 6C · zero emoji.

Koniec:
· CZĘŚĆ E + log WYMIANA „tura 2 done · pushed main"
· git add + commit + push (tylko docs/ux/claude-design/) — patrz DYSPOZYCJA § Koniec tury
```
