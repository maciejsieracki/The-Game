# WKLEJKA MASTER — podział pracy Design vs lane (2026-07-05 · rev.3)

**Od:** Maciej  
**Do:** Design (brand-book 1E)

**Strategia rev.3:**
- **TOR A → Design** — wszystko, czego **Design jeszcze nie dostarczył** (mockup / SVG / ZIP). Potem lane **podmienia** w grze.
- **TOR B → lane (bez Design)** — mockupy **już są** w repo od Designera · tylko port CSS/SVG · **nie zlecaj ponownie**.

**Po każdej paczce TOR A:** `Paczka <ZLECENIE-ID>.zip gotowa` + lista plików.

**Reguły 1E:** zero emoji · złoto `#e8d88a` · Georgia · SVG `currentColor` · nazwy plików z datą `(1E)`.

---

## 🅱️ TOR B — NIE ZLECAJ DESIGN (mockup już jest → my podmieniamy)

| Temat | Pliki Design w repo | Co robimy my (lane UI) |
|-------|---------------------|------------------------|
| POLE-BITWY **v4.1** | `C06 Deployment v4`, `C09 Roster v4`, `C06 Popup Strategia v4`, `C12 Koniec bitwy v2` | Port skin · **nie psuć** v4 |
| **C-04 / C-05 / A-19** mapa | `C04 Atak miasto wybor v2`, `C05 Panel oblezenie v2`, `A19 Miasto zdobyte v2` | Port do `cityAttackChoice.ts`, `siegeMapPanel.ts`, `cityCaptureNotice.ts` — **dziś emoji lane** |
| **C-01 Pre-bitwa** layout | `C01 Pre-bitwa v3` — sync zamrożony | **Nie** ruszać layoutu · tylko ikony → TOR A JEDNOSTKI |
| **Panel miasta W4** | `Miasto Zakładki W4 v2 (1E).dc.html` | Kanon Design — ewent. delta tylko na komendę Macieja |

Design **nie musi** robić v3 C-04/C-05/A-19, dopóki Maciej nie powie inaczej po playteście portu v2.

---

## 🅰️ TOR A — ZLECENIE DESIGN (cała paczka poniżej)

*W grze te ekrany wyglądają źle (często szkic lane Cursor), ale **Design nigdy nie dostarczył mockupu** — Ty rysujesz od zera; my potem podmieniamy.*

### Reguła dla TOR A

| ✅ Bierz z spec / kodu | ❌ Nie kopiuj z gry |
|------------------------|-------------------|
| Lista pól, stany, copy PL | CSS lane, emoji, kolory prowizorki |
| Screenshot PRZED = co jest źle | Wygląd obecnej gry jako wzór |

**Wzór stylu:** POLE-BITWY v4.1 · HUD mapy 1E · miasto W4.

---

### A1 · `JEDNOSTKI-INFOGRAFIKI-1E-2026-07-05` — **P0**

**Problem:** ten sam typ jednostki = inna ikona w mieście / pre-bitwie / polu bitwie / mapie.

| Masz | Dostarcz w ZIP |
|------|----------------|
| Katalog `jednostki-infografiki-1E.html` v1 ✅ | **22+ SVG** osobno · `unit-icon-map.json` · `battle-class-map.json` · handoff |

**Spec:** `DESIGN-ZLECENIE-JEDNOSTKI-INFOGRAFIKI-2026-07-05.md`

---

### A2 · `POLE-BITWY-v5-gap-2026-07-05` — **P0 → P2**

**v4.1 = baza — nie edytuj v4.** Nowe pliki v5/v3.

| Pri | Deliverable | Uwaga |
|-----|-------------|-------|
| **P0** | `C23 Szczegoly bitwy v1` | Pełny overlay 1E · 2 kolumny ATK/OBR |
| **P0** | `C12 Koniec bitwy v3` | ZWYCIĘSTWO + **PORAŻKA** + Rozegraj · Szczegóły · Powrót |
| P1 | Popup **Formacja · Konnica · Linie · Taktyka v2** | Copy Taktyka: Obrona · Atak · Szturm · Ostrzał |
| P2 | `C09 Roster v5` · C06 top bar v5 · Tooltip karty v1 | Zamiast legacy panelu Q3 |
| P3 | C22 Baner wyniku | opcjonalnie |

**Playtest PRZED:** `gra-kanon/Gra-podglad-POLE-BITWY.html`  
**Spec:** `DESIGN-ZLECENIE-POLE-BITWY-v5-GAP-2026-07-05.md`

---

### A3 · `ARMY-MERGE-A18-2026-07-05` — **P1**

4 mockupy: **A06** stos · **A18** merge · **A18** split · **A20** toast  
+ SVG: `icon-merge-armies`, `icon-split-army`, `icon-arrow-join`  
Karta jednostki **identyczna** w A-06 i A-18 · ikony z A1 JEDNOSTKI.

**Spec:** `DESIGN-ZLECENIE-ARMY-MERGE-A18-2026-07-05.md`

---

### A4 · `A21-CITY-UNIT-PICK-2026-07-05` — **P1**

1 mockup picker „Co wybierasz?” · 3 stany · symetryczne kafelki złote.

**Spec:** `DESIGN-ZLECENIE-A21-CITY-UNIT-PICK-2026-07-05.md`

---

### A5 · `HEX-CONTEXT-PANEL-2026-07-05` — **P1**

1 mockup karta heksu (klatka C1 HUD) · plony SVG · ulepszenia `imp-*`  
Opcjonalnie klatka C2 jednostka · propozycja `res-wood` / `res-stone`.

**Spec:** `DESIGN-ZLECENIE-HEX-CONTEXT-PANEL-2026-07-05.md`

---

### A6 · `A-08` ulepszenia terenu — **P1**

Panel trybu budowy 1E · uzupełnienie `imp-*` SVG · `improvement-icon-map.json` · 40px.

**Brief:** `DESIGN-BRIEF-A08-ulepszenia-ikony-i-panel.md`

---

## 📦 TOR A — podsumowanie ZIP-ów dla Designera

| ZIP | Zawartość min. | Pri |
|-----|----------------|-----|
| `JEDNOSTKI-INFOGRAFIKI-1E-2026-07-05` | SVG + JSON + handoff | **P0** |
| `POLE-BITWY-v5-gap-2026-07-05` | 2 P0 + 4 P1 + 3 P2 mockupy | **P0** |
| `ARMY-MERGE-A18-2026-07-05` | 4 mockupy + SVG | P1 |
| `A21-CITY-UNIT-PICK-2026-07-05` | 1 mockup | P1 |
| `HEX-CONTEXT-PANEL-2026-07-05` | 1 mockup | P1 |
| A-08 *(ID opcjonalnie `A08-ULEPSZENIA-2026-07-05`)* | panel + imp SVG | P1 |

**Kolejność u Designera:** A1 → A2 P0 → A3–A6 (równolegle OK) → A2 P1–P2.

---

## 🔧 TOR B — co robimy MY po Twoich mockupach v2/v4.1 (bez Ciebie)

| Kolejność | Zadanie lane | Pliki |
|-----------|--------------|-------|
| 1 | Port **C-04 / C-05 / A-19** v2 | `cityAttackChoice.ts`, `siegeMapPanel.ts`, `cityCaptureNotice.ts` |
| 2 | Port **POLE-BITWY v4.1** (jeśli jeszcze luki) | `battleScene.ts`, `battleHudTheme.ts`, `endScreen1E.ts` |
| 3 | Po ZIP **TOR A** | podmiana po kolejności A1→A2→… |

Handoff v2 mapa: `docs/ux/claude-design/DESIGN-do-UI_C04-C05-A19-v2.md`

---

## 📁 Review HTML (TOR A)

| ZIP | Review |
|-----|--------|
| JEDNOSTKI | `export/JEDNOSTKI-INFOGRAFIKI-GAP-DLA-DESIGN.html` |
| POLE-BITWY v5 | `export/C-POLE-BITWY-GAP-DLA-DESIGN.html` |
| ARMY-MERGE | `export/A18-ARMY-MERGE-GAP-DLA-DESIGN.html` |
| A-21 | `export/A21-CITY-UNIT-PICK-GAP-DLA-DESIGN.html` |
| HEX | `export/HEX-CONTEXT-PANEL-GAP-DLA-DESIGN.html` |

---

*Maciej · rev.3 · Design = tylko TOR A · reszta = podmiana lane*
