# KANON ŚCIEŻEK — Lane UI ↔ Claude Design

**Ustalenie Macieja (2026-06-26):** sync **Wariant A** — źródło prawdy = projekt Design (chmura). Repo/OneDrive = kopia z ostatniego zipa.

---

## Sync — Wariant A (obowiązujący)

| Strona | Co robi | Czego NIE robi |
|--------|---------|----------------|
| **Design** | Edytuje `brand-book/` w swoim projekcie · oddaje zip | Nie czyta repo/OneDrive · nie pushuje GitHub |
| **Cursor / Lane UI** | Konsumuje zip → nadpisuje kanon · kopiuje `eksport/` → `gra/src/ui/icons/brand/` | **Nie edytuje** plików w `brand-book/` |
| **Maciej** | START Design (chat) · pobiera zip · START Cursor (integracja) | — |

**Po każdej turze Design:** świeży zip → `robocopy` / rozpakowanie do `docs/ux/.../brand-book/` → dopiero wtedy Lane integruje.

**Komunikacja dyspozycji:** tekst START wklejony do Design (chat) **lub** wpis w `DYSPOZYCJA.md` po stronie Design. Plik `WYMIANA-UI-DESIGN.md` jest **poza** `brand-book/` — Design go **nie widzi** (log Cursor only).

**Wariant B** (repo jako źródło + wklejanie treści plików): tylko na żądanie — wolniejszy, gdy Cursor musi dotykać `brand-book/`.

---

## Sync — GitHub (deprecated 2026-06-26)

Poprzedni model (Design push → git pull) **nie obowiązuje** — Design nie wypycha commitów. Stary opis: [`WORKFLOW-GITHUB-SYNC.md`](WORKFLOW-GITHUB-SYNC.md).

---

## Katalog kanon (wskazany przez Macieja)

**Relatywnie w projekcie Civ:**

```
docs/ux/claude-design/01-propozycje-z-design/brand-book/
```

**Pełna ścieżka (OneDrive — Maciej, Cursor, Lane UI):**

```
C:\Users\macie\OneDrive - NASTER S.A\_NOWA_STRUKTURA\06_Prywatne\Gry\Civ\docs\ux\claude-design\01-propozycje-z-design\brand-book
```

**W projekcie Claude Design — USTAW TAK (obowiązkowe):**

```
Folder projektu / workspace = BEZPOŚREDNIO ten katalog na dysku:

C:\Users\macie\OneDrive - NASTER S.A\_NOWA_STRUKTURA\06_Prywatne\Gry\Civ\docs\ux\claude-design\01-propozycje-z-design\brand-book
```

**NIE** osobna chmura „brand-book/" + późniejsze kopiowanie. **TEN SAM folder** co OneDrive + Cursor.

**Status/log** (jeden poziom wyżej):

```
C:\Users\macie\OneDrive - NASTER S.A\_NOWA_STRUKTURA\06_Prywatne\Gry\Civ\docs\ux\claude-design\WYMIANA-UI-DESIGN.md
```

**Checklist A→Z:** [`../SCHEMAT-AZ-UX-PIPELINE.md`](../SCHEMAT-AZ-UX-PIPELINE.md)

---

## Konfiguracja projektu Design (Maciej — jednorazowo)

1. W Claude Design: **otwórz / utwórz projekt** wskazując **lokalny folder** OneDrive (ścieżka powyżej) — nie „pusty projekt chmury".
2. OneDrive: **Zawsze na tym urządzeniu** na `brand-book/` i `docs/ux/claude-design/`.
3. **Test:** Design tworzy plik `brand-book/_sync-test.txt` → Maciej widzi go w Explorerze / Cursorze **bez kopiowania**.
4. Jeśli test OK → usuń `_sync-test.txt` → normalna praca (START tura 2…).

**Maciej nie robi exportu, nie kopiuje folderów, nie pobiera zip.**

---

## Jedno miejsce zapisu (po poprawnej konfiguracji)

---

## Struktura wewnątrz `brand-book/` (Design utrzymuje)

```
brand-book/
├── DYSPOZYCJA.md              ← dyspozycje Master/UI (append status)
├── WYMIANA → ../WYMIANA-UI-DESIGN.md   (jeden poziom wyżej — status/kolejka)
├── The Game — Przegląd (1E).dc.html   ← hub (linki względne)
├── support.js
├── eksport/
│   ├── tokens.css
│   ├── tokens.json
│   ├── HANDOFF.md
│   └── icons/*.svg
├── ekrany/                    ← HTML/PNG ekranów PO (opcjonalnie podfoldery)
└── *.html                     ← poszczególne ekrany (obok huba)
```

**Reguła:** nowa iteracja Design **nadpisuje** pliki w tym samym drzewie — nie tworzy `brand-book-2/`.

---

## Pozostałe ścieżki (nie mylić)

| Ścieżka | Kto | Po co |
|---------|-----|--------|
| `docs/ux/claude-design/00-brand-book-pakiet/` | Lane UI → **tylko upload do Design** | Wejście: decyzje, spec ikon, HTML referencje |
| `docs/ux/claude-design/WYMIANA-UI-DESIGN.md` | UI + Design + Maciej | Status YAML + kolejka REQ |
| `docs/ux/pipeline/01-wejscie/grupa-{A..E}/` | **Grupy A–E** | Mockupy PRZED (`*_przed.png`) |
| `docs/ux/pipeline/02-po-design/grupa-{A..E}/` | Lane UI | PO **zatwierdzone** do kodu (po review) |
| `UI/design-tokens-brand-v1.css` | Lane UI | Wpięcie w grę (po freeze tokenów z `eksport/`) |

**Design NIE zapisuje** do `pipeline/` ani `00-brand-book-pakiet/`.

---

## Maciej — zero ręcznego kopiowania

| Co | Kto |
|----|-----|
| Konfiguracja folderu projektu Design | Maciej **raz** (OneDrive path) |
| Zapis plików | Design **bezpośrednio** w folderze |
| Kopiowanie / export / pobieranie | **NIKT** — niepotrzebne |
| Po turze | Maciej: **„Design tura N w repo"** → Lane UI poll |

---

## Wklej do Claude Design (naprawa BLOCKER)

```
BLOCKER naprawiony — jeden folder, bez kopiowania:

Twój projekt MUSI wskazywać lokalny folder OneDrive (nie osobna chmura):

C:\Users\macie\OneDrive - NASTER S.A\_NOWA_STRUKTURA\06_Prywatne\Gry\Civ\docs\ux\claude-design\01-propozycje-z-design\brand-book

Zapisuj pliki BEZPOŚREDNIO tam. Maciej nie kopiuje ręcznie.
SKOPIUJ do C:\ nie działa z chmury — nie używaj tego modelu.

WYMIANA-UI-DESIGN.md — zapisuj w:
C:\Users\macie\OneDrive - NASTER S.A\_NOWA_STRUKTURA\06_Prywatne\Gry\Civ\docs\ux\claude-design\WYMIANA-UI-DESIGN.md

Test: utwórz brand-book/_sync-test.txt — Maciej musi to zobaczyć w Cursorze bez exportu.
Potem usuń test i START — tura 2.
Nie GitHub.
```

---

## Deprecated

| Stara ścieżka | Status |
|---------------|--------|
| `01-propozycje-z-design/brand-book-1E/` | **NIE UŻYWAĆ** — usuń po weryfikacji |
| Ręczny export do czatu | **NIE** — pliki w `brand-book/` |
| GitHub / git commit | **NIE** — sync wyłącznie OneDrive |
| Figma export | odstawione |

---

*Lane UI + Claude Design · kanon v1 · 2026-07-01*
