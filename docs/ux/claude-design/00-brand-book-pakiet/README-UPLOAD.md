# Pakiet Brand Book — upload do Claude Design

**Jeden folder do wrzucenia w Claude Design (Max).**  
**Cel:** wygenerować **Brand Book v1** gry „The Game” — potem dopiero poprawiamy poszczególne ekrany.

---

## Ścieżka (otwórz w Eksploratorze)

**Względna (w projekcie Civ):**

```
docs/ux/claude-design/00-brand-book-pakiet/
```

**Pełna Windows:**

```
C:\Users\macie\OneDrive - NASTER S.A\_NOWA_STRUKTURA\06_Prywatne\Gry\Civ\docs\ux\claude-design\00-brand-book-pakiet
```

W Claude Design: **Upload folder** lub zaznacz całą zawartość tego katalogu.

---

## Co jest w pakiecie

| Folder / plik | Po co |
|---------------|--------|
| **`PROMPT-CLAUDE-DESIGN.md`** | **Wklej jako prompt** (obowiązkowo) |
| `01-dokumenty/01-DECYZJE-WARSTWA1.md` | Zamknięte decyzje stylu 1B–8A |
| `01-dokumenty/02-SPEC-IKONY.md` | Semantyka ikon line (3C) — co narysować |
| `01-dokumenty/03-O-GRE.md` | Kontekst gry — epoka, klimat, UI |
| `01-dokumenty/04-TOKENY-KOLORY.md` | Paleta hex + fonty (skrót) |
| `02-html-podglad/` | HTML z decyzjami ABC i przykładami wizualnymi |
| `03-referencje-screenshoty/` | Zrzuty z gry (baseline) — jeśli skopiowane |

**Dodatkowo w repo (opcjonalnie do uploadu):**

- `UI/Warstwa1-Design-System-podglad.html` — kanon wizualny (duplikat w `02-html-podglad/`)
- `docs/ux/baseline/{A..E}/` — wszystkie 34 PNG PRZED redesignem

---

## Kolejność w Claude Design

1. Upload **cały folder** `00-brand-book-pakiet/`
2. Wklej treść **`PROMPT-CLAUDE-DESIGN.md`**
3. Poproś o **Brand Book v1** (tokens, typography, buttons, panels, chips, ikony Tier 1–2)
4. **Nie** poprawiaj jeszcze wszystkich ekranów — tylko system
5. Export → zapisz w repo: **`docs/ux/claude-design/01-propozycje-z-design/brand-book/`**

---

*Lane UI · 2026-07-01*
