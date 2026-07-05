# ZLECENIE Design — Panel heksu mapy (kontekst D17 · klatka C1)

**Od:** Maciej / Lane UI (MASTER)  
**Do:** Design (brand-book 1E)  
**Data:** 2026-07-05  
**ZLECENIE-ID:** `HEX-CONTEXT-PANEL-2026-07-05`  
**Priorytet:** **P1** — gameplay OK (D17=A) · wygląd lane Cursor · brak klatki C1 w mockupie HUD

---

## 0. Problem (dla Designera)

Maciej przesłał **screenshot** (2026-07-05) — karta **„Pole mapy — kliknięty heks”** w prawym panelu (nad „Wydarzenia”).

**Gameplay OK** — decyzja **D17=A**: panel pojawia się **dopiero po kliku** heksu / jednostki. Treść (plony, rozbicie, ulepszenia) działa.

**Wygląd lane Cursor** — bez mockupu Design klatki **C1 heks** (planowany w `START-szata-sync-2026-07-03`, niewdrożony w `HUD Mapy layout`).

**Screenshot PRZED (Maciej):**

- Nagłówek „POLE MAPY — KLIKNIĘTY HEKS” · **Równina** · heks (479, 30)
- Surowce: Bydło · Rzeka
- Ulepszenie: brak — goły teren
- **Plony — rozbicie:** emoji 🍞 🔨 💰 🪵 🪨 + ściana tekstu w nawiasach
- **Możliwe ulepszenia (teren):** długa lista (Farma, Irygacja, Bydło…) — plain text
- Razem: emoji suma

**Review HTML:** `docs/ux/export/HEX-CONTEXT-PANEL-GAP-DLA-DESIGN.html`

**Werdykt Macieja:** dane OK · wygląd → **Design mockup 1E** (SVG zasobów, czytelny układ plonów i ulepszeń).

---

## 1. Jak zobaczyć „PRZED” w grze

| Ekran | Jak wejść | Plik playtest |
|--------|-----------|---------------|
| **Karta heksu** | Nowa gra → klik **pusty heks** (nie miasto, nie jednostka) | `gra-kanon/Gra-podglad.html` |

**Kod lane (referencja treści — nie zmieniaj pól):**

| Plik | Rola |
|------|------|
| `gra/src/ui/hexContextTooltip.ts` | HTML treści (plony, ulepszenia, zasoby) |
| `gra/src/ui/sidePanelHud.ts` | Ramka `.sp-hex-card` + nagłówek |
| `gra/src/main.ts` | `getHexContext()` → wpięcie w side panel |

**Decyzja gameplay:** D17=A — panel tylko po wyborze · **nie** pokazuj pustego panelu domyślnie.

**Powiązany mockup (pusty stan tylko):** `docs/ux/claude-design/The Game - HUD Mapy layout (1E).dc.html` — sekcja C = placeholder, **brak C1 wypełnionego**.

---

## 2. Reguły 1E (obowiązkowe)

| Reguła | Wartość |
|--------|---------|
| Styl | **1E** · **zero emoji** |
| Złoto UI | `#e8d88a` · dim `#c9a84c` |
| Tytuły sekcji | Georgia / uppercase · letter-spacing |
| Body | Segoe UI 11–13px |
| Karta | 300px · gradient panelu jak HUD · ramka złota · radius 10–12px |
| Pozycja | Prawy panel · **nad** „Wydarzenia” (jak dziś w lane) |
| Ikony zasobów | SVG brand-book tier1 — patrz §3 |
| Ikony ulepszeń | Paczka **A-08** `imp-*.svg` (sync z `DESIGN-BRIEF-A08`) |
| Format pliku | `The Game - A04 Panel heks kontekst v1 2026-07-05 (1E).dc.html` |
| ZIP | `HEX-CONTEXT-PANEL-2026-07-05.zip` |

**Wzorzec:** karta złota z HUD Kit · chipy wydarzeń pod spodem (nie w mockupie C1 — tylko kontekst heksu).

---

## 3. Ikony zasobów (MUST — zamiast emoji)

Lane dziś używa emoji w `YIELD_ROWS`. Design mapuje na SVG:

| Zasób | Emoji dziś | SVG docelowo | Uwaga |
|-------|------------|--------------|-------|
| Żywność | 🍞 | `res-food` | jest w brand-book |
| Praca | 🔨 | `res-work` | jest |
| Handel | 💰 | `res-treasury` lub `bld-trade` | doprecyzuj w mockupie |
| Drewno | 🪵 | **NOWY** `res-wood` lub reuse | brak w tier1 dziś |
| Kamień | 🪨 | **NOWY** `res-stone` lub reuse | brak w tier1 dziś |

**Rozmiar w wierszu plonu:** 14–16px inline · ten sam styl co chipy HUD (medalion lub inline SVG).

---

## 4. Deliverables — co narysować

### P1 — Klatka C1 · Heks (wypełniony panel)

**Plik:** `The Game - A04 Panel heks kontekst v1 2026-07-05 (1E).dc.html`

**Układ MUST (sekcje z kodu — kolejność):**

```
┌──────────────────────────────────────┐
│ POLE MAPY — KLIKNIĘTY HEKS           │
├──────────────────────────────────────┤
│ Równina                              │
│ heks (479, 30)                       │
│                                      │
│ Surowce / zasoby: Bydło · Rzeka      │
│ Ulepszenie: brak — goły teren        │
│                                      │
│ PLONY — ROZBICIE                     │
│ [icon] Żywność  5  (2 +3 rzeka)      │
│ [icon] Praca    3  (1 +2 rzeka)      │
│ [icon] Handel   3  …                 │
│ [icon] Drewno   2                    │
│ [icon] Kamień   1                    │
│ Razem: [icons] 5 · 3 · 3 · 2 · 1     │
│                                      │
│ MOŻLIWE ULEPSZENIA (TEREN)           │
│ [imp] Farma → +3 żywność             │
│ [imp] Irygacja → +5 żywność          │
│ … (scroll lub max 5 + „więcej”)      │
└──────────────────────────────────────┘
     ↑ nad sekcją „Wydarzenia”
```

**Stany do mockupu (min. 4):**

1. **Goły teren + rzeka + bydło** — jak screenshot Macieja (Równina)
2. **Ulepszenie postawione** — sekcja „Ulepszenia postawione” z `imp-*` ikoną
3. **Hodowla / złoże aktywne** — naturalne ulepszenie bez budowy
4. **Heks z miastem** — dodatkowa linia „Miasto: {nazwa}”

**Design decyduje (zaproponuj w mockupie):**

- Czy rozbicie plonów = **tabela / wiersze / chipy** (nie ściana nawiasów)
- Lista możliwych ulepszeń: **scroll** vs **collapse „+6 więcej”** vs **2 kolumny**
- C2 jednostka — **osobny plik** lub druga klatka w tym samym `.dc.html` (typ, ruch, ATK/OBR)

**Powiązanie A-08:** ikony w liście ulepszeń = te same `imp-farm.svg` itd. co w trybie budowy.

---

## 5. Po stronie lane UI (po ZIP)

Lane **UI** portuje mockup:

- `hexContextTooltip.ts` — SVG zamiast emoji · struktura HTML z mockupu
- `sidePanelHud.ts` — CSS `.sp-hex-card` z mockupu
- **Bez zmiany** logiki `tileYield`, `yieldParts`, `listTerrainPossibleImprovements`

**Handoff:** `docs/ux/claude-design/DESIGN-do-UI_HEX-CONTEXT-PANEL.md`

---

## 6. Powiązania

| ID | Relacja |
|----|---------|
| D17 | Decyzja A — panel tylko po kliku |
| A-04 | Panel wydarzeń — host karty heksu |
| A-08 | Ikony ulepszeń terenu |
| HUD Mapy layout | C0 pusty jest · **C1 brakuje** |
| B-26 Okolica | Te same zasoby — spójność ikon |

**REJEST:** wpis pod A-04 (karta heksu) — do dopisania po mockupie.

---

## 7. Checklist Design (DoD)

- [ ] 1 mockup `.dc.html` · min. 4 stany heksu
- [ ] Zero emoji · SVG zasobów + ulepszeń
- [ ] Propozycja układu plonów (czytelniejszy niż nawiasy)
- [ ] Propozycja listy ulepszeń (scroll/collapse)
- [ ] Opcjonalnie klatka C2 jednostka (ten sam panel)
- [ ] `DESIGN-do-UI_HEX-CONTEXT-PANEL.md` + `MANIFEST.txt`
- [ ] ZIP `HEX-CONTEXT-PANEL-2026-07-05.zip`

Po gotowości: **„Paczka HEX-CONTEXT-PANEL-2026-07-05.zip gotowa”** + lista plików.
