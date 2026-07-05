# Baseline screenshotów UX — „przed poprawkami Figmy”

**Cel:** każda grupa robi zrzuty **swoich** paneli w grze **teraz** → porównanie z wersją **po** redesignie (Figma + wdrożenie).

**Maciej:** nie robi screenshotów — tylko ewentualnie akceptuje, że folder jest kompletny.  
**Grupy A–E:** jednorazowo, ~20–40 min, wg rejestru UX.

---

## Gdzie zapisywać

```
docs/ux/baseline/
  A/   ← Grupa A (mapa, HUD)
  B/   ← Grupa B (miasto, nauka)
  C/   ← Grupa C (walka)
  D/   ← Grupa D (dyplomacja)
  E/   ← Grupa E (menu, kreator)
  README.md   ← checklista plików (uzupełnia grupa po zrobieniu)
```

**Format:** PNG, pełny panel widoczny (nie cały pulpit Windows — tylko okno gry / panel).

**Nazwa pliku:** `{ID}_{krótki-slug}.png`  
Przykłady:
- `A-06_panel-jednostki.png`
- `B-01_panel-miasta-pelny.png`
- `B-04_dock-budynek-hover.png`
- `C-01_pre-bitwa.png`
- `D-03_audiencja.png`
- `E-01_menu-glowne.png`

ID = z [`REJEST-UX-MASTER.md`](REJEST-UX-MASTER.md) — żeby 1:1 wiązać z rejestrem.

---

## Jak robić zrzut (grupy)

1. Otwórz **`Gra-podglad.html`** (lub build testowy z rejestru, np. `Gra-podglad-OKOLICA-UX.html`, `…-BITWA.html`).
2. Wejdź w ekran wg kolumny **„Jak zobaczyć”** w rejestrze (sekcja swojej grupy).
3. **Win + Shift + S** (Windows) → zaznacz panel / całe okno gry.
4. Zapisz PNG do `docs/ux/baseline/{A|B|C|D|E}/` z nazwą jak wyżej.

**Hover / dock (B-29, B-30):** dwa pliki — bez hovera i z dockiem widocznym.  
**Modale:** osobny plik (np. `D-05_modal-wojna.png`).

**Nie trzeba** screenshotować pozycji oznaczonych `PLAN` / `ARCHIWUM` / `MOCKUP` (osobny HTML bez gry) — opcjonalnie osobny plik z mockupu.

---

## Minimum per grupa (must-have)

| Grupa | Min. zrzuty (priorytet) |
|-------|-------------------------|
| **A** | HUD góra, toolbar, dolny pasek, panel jednostki, pre-bitwa, lista dyplomacji |
| **B** | Panel miasta pełny, pasek zasobów, zakładka budowa, dock hover, hub nauki + drzewko |
| **C** | Pre-bitwa, deployment, pole bitwy, koniec bitwy, oblężenie z murem |
| **D** | Lista dyplomacji, audiencja, modal wojny, modal propozycji AI |
| **E** | Menu, kreator (krok 2–4), game over |

Reszta wpisów z rejestru — **mile widziana**, ale minimum powyżej wystarczy na porównanie „przed/po”.

---

## Po redesignie (Faza 6 planu Figmy)

Ten sam plik, ta sama nazwa → folder **`docs/ux/after/`** (struktura identyczna A–E).

Porównanie: obok siebie `baseline/B/B-01_…` vs `after/B/B-01_…`.

---

## Flaga gotowości

Na końcu dopisać w `docs/ux/baseline/README.md`:

`Baseline GOTOWE · data · Grupa X · N plików`

I krótka wiadomość do Macieja / MASTER: „Grupa X baseline screenshoty gotowe”.

---

*2026-07-01 · lane UI · uzupełnienie planu FIGMA-UI-PLAN-KROK-PO-KROKU.md*
