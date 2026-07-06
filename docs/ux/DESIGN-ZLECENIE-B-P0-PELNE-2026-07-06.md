# ZLECENIE Design — PACZKA B P0 (pełne specyfikacje)

**Od:** Lane UI / Maciej  
**Do:** Design (Claude Design · brand-book 1E)  
**Data:** 2026-07-06  
**Priorytet:** P0 — blokery playtestu mapy + końca bitwy  

**Wklejka dla Macieja:** `docs/ux/WKLEJKA-DESIGN-B-P0-PELNE-MACIEJ-2026-07-06.md`

---

## Jak czytać ten dokument

Każde zlecenie ma **8 bloków** (standard lane → Design):

1. **Cel** (1 zdanie)  
2. **PRZED** (screenshot / playtest)  
3. **PROBLEM** (lista)  
4. **PO** (referencja stylu)  
5. **Inwentarz elementów** (fundament/dach/okna)  
6. **Stany mockupu**  
7. **Deliverables**  
8. **Playtest PO**

**Review HTML (otwórz w przeglądarce):** każdy punkt ma plik GAP w `docs/ux/export/`.

---

## B1 · A-08 Tryb budowy ulepszeń

| Pole | Wartość |
|------|---------|
| **Cel** | Panel prawy trybu 🏗 wygląda jak HUD 1E — SVG, scroll, czytelny tech-lock. |
| **GAP** | `docs/ux/export/A08-BUILD-PANEL-GAP-DLA-DESIGN.html` |
| **Spec** | `docs/ux/DESIGN-BRIEF-A08-ulepszenia-ikony-i-panel.md` |
| **PRZED** | `gra-robocza/START.html` → Budowa → screenshot banner + panel · **Posterunek overlap** |
| **PO referencja** | `HUD Mapy layout (1E).dc.html` · `Miasto W4 v2` |
| **Deliverable** | `A08 Tryb budowy ulepszen (1E).dc.html` + 6–8 SVG + `improvement-icon-map.json` |
| **ZIP** | `A08-ulepszenia-2026-07-06.zip` |

**Uwaga lane:** ikony SVG już częściowo w kodzie — Design dostarcza **brakujące + layout mockup**.

---

## B2 · HEX-C1 Panel kontekstu heksu

| Pole | Wartość |
|------|---------|
| **Cel** | Karta heksu po kliku (D17=A) — plony SVG, lista ulepszeń z ikonami, bez emoji. |
| **GAP** | `docs/ux/export/HEX-CONTEXT-PANEL-GAP-DLA-DESIGN.html` |
| **Spec** | `docs/ux/DESIGN-ZLECENIE-HEX-CONTEXT-PANEL-2026-07-05.md` |
| **PRZED** | Screenshot Macieja 2026-07-05 · Równina · PLONY Ż/P/H · MOŻLIWE plain text |
| **PO referencja** | Ten sam HUD · ikony `imp-*` = paczka B1 |
| **Deliverable** | `A04 Panel heks kontekst v1 (1E).dc.html` · 4 stany heksu |
| **ZIP** | `HEX-CONTEXT-PANEL-2026-07-06.zip` |

**Kod (tylko treść pól):** `hexContextTooltip.ts`, `sidePanelHud.ts`

---

## B3 · IMP-01 Panel Moc + raporty 6C

| Pole | Wartość |
|------|---------|
| **Cel** | Jeden slide-in 1E z Mocą (9 składników) i raportami per miasto. |
| **GAP** | `docs/ux/export/IMP-01-MOC-PANEL-GAP-DLA-DESIGN.html` |
| **Spec** | `docs/ux/DESIGN-ZLECENIE-IMP-01-MOC-2026-07-06.md` |
| **PRZED** | Klik Moc → stary modal · klik Skarbiec → brzydki slide-in |
| **D16** | **Opcja A** — slide-in z prawej |
| **Deliverable** | `Panel Moc imperium v1 (1E).dc.html` · min. 4 sekcje |
| **ZIP** | `IMP-01-MOC-2026-07-06.zip` |

---

## B4 · C23 Szczegóły bitwy

| Pole | Wartość |
|------|---------|
| **Cel** | Overlay pełnoekranowy 1E po „Szczegóły bitwy" — 2 kolumny ATK/OBR, 3 sekcje strat. |
| **GAP** | `docs/ux/export/C-POLE-BITWY-GAP-DLA-DESIGN.html` → **GAP-01** |
| **Spec** | `docs/ux/DESIGN-ZLECENIE-POLE-BITWY-v5-GAP-2026-07-05.md` § GAP-01 |
| **PRZED** | `Gra-ROBOCZA-POLE-BITWY.html` → koniec bitwy → Szczegóły → screenshot |
| **PO referencja** | **C12 v2** — winieta, ◆, kolory sekcji (#ff7b7b / #ffd54a / #7ad0a0) |
| **Deliverable** | `C23 Szczegoly bitwy v1 (1E).dc.html` |
| **NIE wymyślaj pól** | Zniszczone · Zrootowane · Ocalałe × 2 strony |

**Kod:** `gra/src/battle/endDetails1E.ts`

---

## B5 · C12 Koniec bitwy v3

| Pole | Wartość |
|------|---------|
| **Cel** | Ekran końca z 3 przyciskami + stan PORAŻKA + hint replay. |
| **GAP** | `C-POLE-BITWY-GAP-DLA-DESIGN.html` → **GAP-02** |
| **Spec** | `DESIGN-ZLECENIE-POLE-BITWY-v5-GAP` § GAP-02 |
| **PRZED** | C12 v2 w repo · lane dodał provizorkę v2 + link replay |
| **PO referencja** | `C12 Koniec bitwy v2 (1E).dc.html` · `Popupy deploy v5` |
| **Deliverable** | `C12 Koniec bitwy v3 (1E).dc.html` — **3 stany w 1 pliku:** Zwycięstwo · Porażka · Hint |
| **Przyciski** | Rozegraj ponownie (primary) · Szczegóły (outline) · Powrót do mapy (outline) |

**Kod:** `gra/src/battle/endScreen1E.ts`

---

## Oddanie paczki P0 (Design)

```
ZIP: DESIGN-B-P0-2026-07-06.zip  (lub 5 osobnych ZIP tematycznych)

W środku:
  · 5× .dc.html (B1–B5)
  · SVG/JSON (B1)
  · DESIGN-do-UI_B-P0-2026-07-06.md (mapowanie plik → kod lane)
  · MANIFEST.txt
  · git push → docs/ux/claude-design/ + brand-book/

Po gotowości napisz Maciejowi:
  „Paczka B-P0 (A-08 + HEX + Moc + C23 + C12v3) gotowa — lane portuje w 24h"
```

---

## Kolejność pracy (rekomendacja Design)

1. **B1 A-08** (ikony → używa B2 HEX)  
2. **B2 HEX**  
3. **B3 Moc**  
4. **B4 C23 + B5 C12** (bitwa — jedna sesja)

---

*Lane UI · The Game · 2026-07-06*
