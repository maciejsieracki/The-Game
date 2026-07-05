# UI → Design: Wikipedia w mockupach HUD (mapa + miasto)

> **Data:** 2026-07-03 · **Sign-off Maciej:** playtest OK · **Priorytet:** obowiązkowe w nowych mockupach  
> **Status:** CZEKA Design · **Lane UI:** wdrożone tymczasowo w grze (górny pasek)

---

## Kontekst (co już jest w grze)

W **`Gra-podglad.html`** działa panel **Wikipedia** (Poradnik 22 rozdz. + Encyklopedia ~130 haseł):

| Element | Opis |
|---------|------|
| Wejście | **Górny pasek, prawy róg** — przycisk **„Wiki”** (ikona książki) **obok „Menu”** |
| Panel | Lewy overlay (~420 px): zakładki **Poradnik** / **Encyklopedia**, wyszukiwarka, widok Skrót / Hasło / Pełne |
| Treść | `docs/PORADNIK-GRACZA/` + `docs/encyklopedia/` (bundle rev. E) |

**Decyzja Macieja (2026-07-03):** Wiki **nie** na lewym toolbarze ani przy minimapie — **standard branżowy = górny bar obok Menu**.

---

## Co Design ma uwzględnić

### 1. Mockup **ekranu mapy świata** (HUD 1E / następna iteracja)

- [ ] Przycisk **Wiki / Wikipedia / Pomoc** w **strefie prawej górnej**, **bezpośrednio przed Menu**
- [ ] Ikona: **książka** (line, styl 3C brand-book) + etykieta **„Wiki”** lub **„Pomoc”** (do ustalenia z copy)
- [ ] Stan **aktywny** gdy panel otwarty (obwódka / podświetlenie — kolor akcentu wiki: `#a8c878` w prototypie)
- [ ] **Panel boczny** po otwarciu: szerokość, typografia, zakładki Poradnik/Encyklopedia (referencja: screenshot z gry lub `wikiHubHud.ts`)
- [ ] **NIE** duplikować wejścia na lewym toolbarze medalionów ani przy minimapie (tam zostają tylko: miasto, nauka, dyplomacja, wojsko, budowa + warstwy kultura/religia)

### 2. Mockup **ekranu miasta** (W3-miasto-1E i kolejne)

- [ ] **Ten sam** przycisk Wiki w **identycznym miejscu** (górny prawy róg) — spójność między mapą a miastem
- [ ] Panel Wiki **nad** panelem miasta (z-index) — nie zastępuje zakładek Plony/Budowa/Rekrutacja
- [ ] Opcjonalnie v2: skrót „?” przy pojedynczych polach (tooltip Wiki-S) — **poza zakresem tego handoffu**, tylko zaznaczyć w mockupie jako 🔮

### 3. Assety do dostarczenia (eksport)

| Asset | Plik docelowy | Uwagi |
|-------|---------------|--------|
| Ikona Wiki @24 / @40 | `eksport/icons/ui-wiki.svg` | `currentColor`, line 3C |
| Przycisk górny (normal/hover/on) | tokeny w `tokens.css` | obok `ui-menu` |
| Ramka panelu Wiki | sekcja w hubie mapy 1E | zgodna z panelem Nauki/Dyplomacji |

---

## Referencje techniczne (Lane UI — nie edytować w Design)

| Plik | Rola |
|------|------|
| `gra/src/ui/wikiHubHud.ts` | panel + zachowanie |
| `gra/src/ui/hud.ts` | przycisk `.b-wiki` w `.hud-right` |
| `gra/src/ui/icons/wikiBookIcon.ts` | ikona tymczasowa SVG |
| `docs/PORADNIK-GRACZA/README.md` | zakres treści Poradnik-L |
| `docs/encyklopedia/indeks.md` | spis haseł |

---

## DoD (Design)

1. Zaktualizowany **mockup mapy** z Wiki obok Menu + otwarty panel (1 klatka)
2. Zaktualizowany **mockup miasta** — ten sam przycisk + ewentualnie panel (1 klatka)
3. SVG `ui-wiki` w `eksport/icons/`
4. Wpis w `brand-book/eksport/HANDOFF.md` + zip → `brand-book/ostatnie/`
5. Wpis w `docs/ux/claude-design/WYMIANA-UI-DESIGN.md` § Wikipedia

---

## Powiązane

- `docs/ux/claude-design/WYMIANA-UI-DESIGN.md` § Wikipedia HUD
- `dyspozycje/_handoff/UI-do-DESIGN_w3-miasto-1E-dane.md` — miasto (dodać punkt Wiki)
- `docs/PORADNIK-GRACZA-SPIS-TRESCI.md` — kanon treści

*UI → Design · 2026-07-03 · Maciej sign-off playtest*
