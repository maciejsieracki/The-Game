# Workflow grafiki UI v2 — nowe podejście

**Data:** 2026-07-01  
**Zakres:** tylko panele UX/UI (nie logika gry, nie silnik).  
**Maciej:** decyzje ABC + playtest po batchu. Resztę prowadzi lane UI / MASTER.

---

## Co się zmienia (stare → nowe)

| Było | Jest |
|------|------|
| Rozproszone `UI/Makieta-*.html` jako „prawda” | **Gra** (`Gra-podglad.html`) + **Figma** jako docelowy wygląd |
| Emoji w HUD | **Ikony SVG** z design systemu (decyzja A/B/C) |
| Każdy lane „po swojemu” | **Jeden** plik Figmy + wspólna biblioteka komponentów |
| Brak punktu odniesienia | **Baseline screenshoty** `docs/ux/baseline/` = stan PRZED |
| Katalog HTML wszystkich paneli | **Rejestr UX** (130 poz.) + baseline/after — bez duplikowania mockupów |

**Stare makiety HTML:** tylko archiwum / referencja — **nie** aktualizujemy ich jako kanonu.

---

## Faza 0 — DONE ✅

| Element | Status |
|---------|--------|
| Rejestr UX (A–E) | ✅ 130 pozycji — `docs/ux/REJEST-UX-MASTER.md` |
| Baseline screenshoty | ✅ **34 PNG** — wszystkie grupy |

### Baseline — potwierdzenie odbioru

| Grupa | Wymagane min. | Otrzymane | Folder |
|-------|---------------|-----------|--------|
| A | 8 | **8** ✅ | `baseline/A/` |
| B | 8 | **8** ✅ | `baseline/B/` |
| C | 7 | **7** ✅ | `baseline/C/` |
| D | 5 | **5** ✅ | `baseline/D/` |
| E | 6 | **6** ✅ | `baseline/E/` |

Checklist: `docs/ux/baseline/README.md`  
Skrypty regeneracji: `gra/tools/baseline-screenshots-*.cjs|mjs`

**Uwaga:** kilka zrzutów (A-16, C-21, D-05/06, E-15) powstało z mockupu lub wstrzykniętego UI — po redesignie warto powtórzyć z czystego playtestu do folderu `after/`.

---

## Nowy pipeline (5 kroków)

```
[0] Baseline PNG          ← DONE (baseline/)
        ↓
[1] Decyzja stylu (ABC)   ← Maciej: ikony A/B/C + tokeny
        ↓
[2] Figma Design System   ← jeden plik, biblioteka komponentów
        ↓
[3] Figma ekrany A–E      ← grupy: tylko swoja strona, tylko z biblioteki
        ↓
[4] Eksport → gra         ← tokeny JSON + SVG ikon (raz globalnie)
        ↓
[5] Wdrożenie paneli      ← lane UI, priorytet E→A→B→D→C
        ↓
[6] After PNG + porównanie ← te same nazwy w after/ vs baseline/
```

---

## Krok 1 — Decyzja Macieja ✅ DONE (2026-06-26)

**Odpowiedź Macieja:** `1B, 2C, 3C, 4C, 5C, 6C, 7A, 8A`

| Plik | Co |
|------|-----|
| [`DECYZJE-WARSTWA1-MACIEJ.md`](DECYZJE-WARSTWA1-MACIEJ.md) | Pełna tabela decyzji |
| [`FIGMA-SPEC-IKONY.md`](FIGMA-SPEC-IKONY.md) | **Lista ikon dla Figmy** (3C + semantyka — np. Praca = młotek) |
| [`WKLEJKA-MACIEJ-FIGMA.md`](WKLEJKA-MACIEJ-FIGMA.md) | Wiadomość do lane UI |

**Warunek 3C:** ikony minimal line **z obowiązkową listą** — Figma nie zgaduje przedmiotów.

---

## Krok 2 — Figma (lane UI) ⏳ TERAZ

**Dyspozycja:** [`DYSPOZYCJA-FIGMA-DESIGN-SYSTEM.md`](DYSPOZYCJA-FIGMA-DESIGN-SYSTEM.md)  
**Ikony:** [`FIGMA-SPEC-IKONY.md`](FIGMA-SPEC-IKONY.md) (obowiązkowa)  
**Pełna mapa możliwości:** [`FIGMA-CO-WYKORZYSTUJEMY.md`](FIGMA-CO-WYKORZYSTUJEMY.md)

**Jeden plik:** „The Game — Design System v1” (decyzja **7A** — pełny plik od razu)

| Strona | Zawartość |
|--------|-----------|
| 00 Tokens | kolory, fonty, odstępy (Variables) |
| 01 Components | przycisk, ramka panelu, chip, pasek |
| 02 Icons | zestaw wybrany przez Macieja (24px, 40px) |
| 03–07 Screens | A, B, C, D, E — layout ekranów |

**Reguła:** grupy **nie tworzą** własnych kolorów — tylko układają instancje z 00–02.

Link Figmy: _(uzupełni lane UI po utworzeniu pliku)_

---

## Krok 3 — Grupy w Figmie (dyspozycja)

**Jeden plik dyspozycji:** `docs/ux/DYSPOZYCJA-FIGMA-POPRAWKI-A-E.md` _(po Kroku 2)_

**Maciej:** jedna uniwersalna wiadomość (jak przy baseline):

```
Dyspozycja UI — redesign w Figmie.

Przeczytaj i wykonaj: docs/ux/DYSPOZYCJA-FIGMA-POPRAWKI-A-E.md
→ sekcja „§ Grupa [twoja grupa]” — tylko swoją.

Referencja PRZED: docs/ux/baseline/[A|B|C|D|E]/
```

Grupy **nie wdrażają kodu** — tylko Figma.

---

## Krok 4 — Eksport do gry (lane UI, raz)

| Co | Skąd | Dokąd |
|----|------|-------|
| Tokeny kolorów, fonty | Figma Variables | `gra/data/design-tokens.json` + CSS `:root` |
| Ikony | Figma SVG export | `gra/src/ui/icons/` |
| Parametry UI (już jest) | Excel / ui-params | `gra/data/ui-params.json` |

Po tym batchu **cała gra** ma wspólne kolory i ikony — bez ruszania logiki paneli.

---

## Krok 5 — Wdrożenie paneli (lane UI, kolejno)

| Kolejność | Dlaczego |
|-----------|----------|
| 1. **E** Menu + kreator | pierwsze wrażenie |
| 2. **A** HUD mapy | cały czas na ekranie |
| 3. **B** Panel miasta | największy UI |
| 4. **D** Dyplomacja | flow modali |
| 5. **C** Walka | pre-bitwa + HUD 3D |

**Po każdym batchu:** Maciej playtest → OK / poprawki.  
**Po batchu:** lane UI odpala skrypt baseline → zapis do `docs/ux/after/` (te same nazwy plików).

---

## Porównanie przed / po

| Folder | Znaczenie |
|--------|-----------|
| `docs/ux/baseline/{A…E}/` | jak było **przed** redesignem |
| `docs/ux/after/{A…E}/` | jak jest **po** wdrożeniu batcha |

Ta sama nazwa pliku (np. `B-01_panel-miasta-pelny.png`) = obok siebie widać różnicę.

---

## Role — kto co robi

| Kto | Robi | Nie robi |
|-----|------|----------|
| **Maciej** | ABC stylu; playtest po batchu | Figma, kod, dyspozycje techniczne |
| **Grupy A–E** | Figma swoje ekrany; baseline/after PNG | tokenów globalnych, main.ts |
| **Lane UI** | Figma DS, eksport, CSS, wdrożenie paneli | decyzji gameplay |
| **Opus (Ask)** | review wizualny przed kanonem | implementacja |

---

## Czego NIE robimy w v2

- Nie aktualizujemy `UI/Makieta-*.html` jako kanonu.
- Nie budujemy zbiorczego katalogu HTML wszystkich paneli.
- Nie każemy grup wdrażać CSS osobno (rozjedzie spójność).
- Nie zaczynamy Figma ekranów przed decyzją ikon (Krok 1).

---

## Pliki hub (UI)

| Plik | Rola |
|------|------|
| [`REJEST-UX-MASTER.md`](REJEST-UX-MASTER.md) | lista ekranów + playtest |
| [`baseline/README.md`](baseline/README.md) | checklist baseline ✅ |
| [`FIGMA-UI-PLAN-KROK-PO-KROKU.md`](FIGMA-UI-PLAN-KROK-PO-KROKU.md) | skrót faz (sync z tym doc) |
| [`WORKFLOW-GRAFIKA-UI-v2.md`](WORKFLOW-GRAFIKA-UI-v2.md) | **ten dokument — źródło prawdy v2** |
| `UI/Warstwa1-Design-System-podglad.html` | decyzja ABC ikon |

---

## Status faz v2

| Faza | Status |
|------|--------|
| 0 Rejestr UX | ✅ |
| 0b Baseline PNG | ✅ 34/34 |
| 1 Decyzja ikon ABC | ⏳ **Maciej** |
| 2 Figma Design System | 🔒 po 1 |
| 3 Figma ekrany grup | 🔒 po 2 |
| 4 Eksport tokenów + ikon | 🔒 po 3 |
| 5 Wdrożenie paneli | 🔒 po 4 |
| 6 After PNG + review | 🔒 po każdym batchu 5 |

---

## Następny krok

**Maciej:** wybór ikon **A / B / C** (+ akceptacja tokenów z Warstwy 1).  
**Lane UI:** Krok 2 — plik Figmy + dyspozycja Figma dla grup.

---

*Workflow v2 · baseline komplet · 2026-07-01*
