# Rejestr UX — hub (Maciej / lane UI / Integrator)

**Problem:** UX w Civ jest **rozproszony** — część w `gra/src/ui/`, część w `main.ts`, część tylko po kliknięciu w `Gra-podglad.html`, mockupy w `UI/`, `Civ-MAPA/`, `Civ-UNITS/`, `MIASTO/`.  
Jeden plik HTML (`UI/Katalog-UX-wszystkie-panele.html`) **nie wystarczy** — nie pokaże panelu miasta, docków hover, huba nauki itd. bez uruchomienia gry.

**Aktualny workflow grafiki:** [`WORKFLOW-GRAFIKA-UI-v2.md`](WORKFLOW-GRAFIKA-UI-v2.md) · baseline screenshoty ✅ (34 PNG, wszystkie grupy A–E)

---

## Pliki

| Plik | Kto | Co |
|------|-----|-----|
| [`WORKFLOW-GRAFIKA-UI-v2.md`](WORKFLOW-GRAFIKA-UI-v2.md) | Wspólny | **Nowe podejście:** baseline → Figma → kod → after |
| [`baseline/README.md`](baseline/README.md) | Grupy A–E | Checklist zrzutów PRZED redesignem ✅ |
| [`REJEST-UX-MASTER.md`](REJEST-UX-MASTER.md) | Wspólny | Rejestr 130 ekranów UX |
| [`DECYZJE-WARSTWA1-MACIEJ.md`](DECYZJE-WARSTWA1-MACIEJ.md) | Maciej | Decyzje 1B–8A ✅ |
| [`FIGMA-SPEC-IKONY.md`](FIGMA-SPEC-IKONY.md) | Figma / lane UI | **Lista ikon — co narysować** |
| [`DYSPOZYCJA-FIGMA-DESIGN-SYSTEM.md`](DYSPOZYCJA-FIGMA-DESIGN-SYSTEM.md) | Lane UI | Dyspozycja Figmy ⏳ |
| [`WKLEJKA-MACIEJ-FIGMA.md`](WKLEJKA-MACIEJ-FIGMA.md) | Maciej | Jedna wiadomość start Figmy (lane UI) |
| [`KOMUNIKATY-FIGMA-GRUPY-A-E.md`](KOMUNIKATY-FIGMA-GRUPY-A-E.md) | Maciej | **5 komunikatów** do grup A–E |
| [`figma/README.md`](figma/README.md) | Wspólny | **Hub grafiki** — gdzie co składować |
| [`figma/STATUS-FIGMA.md`](figma/STATUS-FIGMA.md) | Lane UI | Status pliku Figmy + link + blocker |
| [`FIGMA-KONTO-DOSTEP-MACIEJ.md`](FIGMA-KONTO-DOSTEP-MACIEJ.md) | Maciej | **Konto, token MCP, Share, upgrade** |
| [`FIGMA-LIMIT-3-STRONY.md`](FIGMA-LIMIT-3-STRONY.md) | Wspólny | Starter max 3 strony — mapowanie A–E |
| [`figma/grupa-E/WORKFLOW-GRUPA-E.md`](figma/grupa-E/WORKFLOW-GRUPA-E.md) | Grupa E / Maciej | Menu/kreator — workflow + blokery |
| [`figma/grupa-E/CHECKLIST-REVIEW-MACIEJ.md`](figma/grupa-E/CHECKLIST-REVIEW-MACIEJ.md) | Maciej | **5 punktów review** Figmy E |
| [`FIGMA-UI-PLAN-KROK-PO-KROKU.md`](FIGMA-UI-PLAN-KROK-PO-KROKU.md) | Lane UI | Skrót faz |
| [`DYSPOZYCJA-BASELINE-SCREENSHOTY-A-E.md`](DYSPOZYCJA-BASELINE-SCREENSHOTY-A-E.md) | Grupy | Dyspozycja baseline (zamknięta) |

---

## Gdzie grupy **już** coś składają (niepełne)

| Grupa | Folder roboczy | Indeks mockupów |
|-------|----------------|-----------------|
| **A** | `docs/grupa-a/` | `README-INDEX.md` § Mockupy |
| **B** | `docs/grupa-b/` | `README.md`, `OKOLICA-UX-MACIEJ.md` — **brak pełnej listy UI** |
| **C** | `docs/grupa-c/` | `04-mockupy-INDEX.md` ✅ |
| **D** | `docs/grupa-d/` | **brak indeksu UX** |
| **E** | `docs/grupa-e/` | `PANEL-E-SPEC.md` (menu/start, nie pełny UX) |

**Kod UI (wspólny):** `gra/src/ui/*.ts` — właściciel tematu wg [`docs/czaty/MAPOWANIE-LANE-GRUPY.md`](../czaty/MAPOWANIE-LANE-GRUPY.md).

---

## Deadline / flaga

Po uzupełnieniu sekcji grupa dopisuje w `docs/obieg/<grupa>.md` (lub `DO-MASTERA`):

`UX-INWENTARZ: GOTOWE → docs/ux/REJEST-UX-MASTER.md § Grupa X`

Integrator / UI aktualizuje katalog HTML.

---

*Utworzono: 2026-06-26 · w odpowiedzi na brak widoczności UX kontekstowego (panel miasta po kliku).*
