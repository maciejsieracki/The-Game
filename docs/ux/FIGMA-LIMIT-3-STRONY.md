# Figma Starter — limit 3 stron (dostosowanie workflow)

**Data:** 2026-06-26  
**Problem:** plan **Figma Starter** = **maks. 3 strony** w jednym pliku.  
**Było w dyspozycji:** 8 stron (00 Tokens … 07 Screens E).

**Plik:** [The Game — Design System v1](https://www.figma.com/design/COVbTJUV5dx8MzMxfWlYeu) · fileKey `COVbTJUV5dx8MzMxfWlYeu`

---

## Decyzja operacyjna (bez ABC Macieja — inżynierska)

Łączymy 8 stron w **3 strony** + **sekcje** (frame’y z prefiksem grupy). Logika grup A–E **bez zmian** — zmienia się tylko **numer strony** w pliku.

| Strona Figma (max 3) | Byłe strony | Kto | Zawartość |
|----------------------|-------------|-----|-----------|
| **1 · Design System** | 00 + 01 + 02 | **lane UI** | Variables 1B/2C · Btn 4C · Panel 5C · Chip 6C · ikony FIGMA-SPEC-IKONY |
| **2 · Mapa i miasto** | 03 + 04 | **Grupa A + B** | Sekcja `A-*` (HUD) · sekcja `B-*` (panel miasta) |
| **3 · Walka, dyplo, meta** | 05 + 06 + 07 | **Grupa C + D + E** | Sekcja `C-*` · `D-*` · `E-*` |

**Reguła nazewnictwa frame’ów:** `{grupa}-{ID} {nazwa}` — np. `A-01 HUD`, `E-01 Menu`.

---

## Co to zmienia dla grup

| Grupa | Stara instrukcja | Nowa instrukcja |
|-------|------------------|-----------------|
| A | strona „03 Screens A” | **strona 2** · sekcja A |
| B | strona „04 Screens B” | **strona 2** · sekcja B |
| C | strona „05 Screens C” | **strona 3** · sekcja C |
| D | strona „06 Screens D” | **strona 3** · sekcja D |
| E | strona „07 Screens E” | **strona 3** · sekcja E |

**Nadal obowiązuje:** czekajcie na **GOTOWE 00–02** (= gotowa **strona 1 · Design System**).

---

## Alternatywa (decyzja Macieja — opcjonalna)

| Opcja | Opis |
|-------|------|
| **A (domyślna)** | Zostajemy na Starter — 3 strony jak wyżej |
| **B** | Upgrade Figma Professional — wtedy można wrócić do 8 stron 00–07 |

Maciej **nie musi** decydować, jeśli akceptuje układ 3 stron.

---

## Lane UI — kolejność pracy (MCP)

1. **Strona 1** — DS komplet (Tokens, Components, Icons) → meldunek **GOTOWE 00–02**
2. **Strona 3 · sekcja E** — **pierwsza po sygnale** (Maciej 2026-07-01 · 8A) — frame’y E-01…E-15 · MCP oszczędnie · PNG baseline ręcznie
3. **Strona 2** — sekcje A, B — po E (lub po wzorcu E-01)
4. **Strona 3** — sekcje C, D — po E

---

*Sync: STATUS-FIGMA.md · DYSPOZYCJA-FIGMA-DESIGN-SYSTEM.md*
