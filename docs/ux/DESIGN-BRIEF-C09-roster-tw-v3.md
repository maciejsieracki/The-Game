# Design Brief — C-09 Karty jednostek v3 · Total War (2 rzędy, wyśrodkowane)

**Od:** Maciej / MASTER  
**Do:** Design (Claude Design · styl 1E)  
**Data:** 2026-07-04  
**Hasło:** `START — C09-roster-tw-v3`  
**Priorytet:** P0 — **roster deploy + walka ręczna** (nie C-07 pasek komend)

---

## Cel

W grze wdrożono **układ kart jednostek inspirowany Total War**: wyśrodkowany na osi X, rośnie symetrycznie na boki, **max 2 rzędy** na osi Y gdy się nie mieszczą.

Stary mockup **`C09 Karty jednostek v2 (1E).dc.html`** = jeden poziomy scroll — **NIEAKTUALNY**.

**Deliverable:**  
`docs/ux/claude-design/The Game - C09 Karty jednostek v3 TW (1E).dc.html`

**Handoff zwrotny:** `docs/ux/claude-design/DESIGN-do-UI_c09-roster-tw-v3.md`

---

## Playtest OBOWIĄZKOWY

| Faza | Jak wejść |
|------|-----------|
| **Deploy (rozstawianie)** | `gra-robocza/START.html` → bitwa ręczna / test battle → faza przed **Start walki** |
| **Walka ręczna** | Po Start walki · tryb manual · dolny roster kart |

**Weryfikacja buildu w grze:** pasek grup pokazuje tag `POLE-BITWY-20260704-roster-tw2` (lub nowszy).

**Referencje wizualne (Maciej):** Total War — pre-battle deployment bar + in-battle unit card tray (wyśrodkowany, ornamental frame).

---

## Zachowanie układu (logika — Design odwzorowuje wizualnie)

### Oś X — wyśrodkowanie

- Kontener kart: **`justify-content: center`**
- Nowe karty / grupy **rozszerzają pasek symetrycznie** w lewo i prawo od środka ekranu
- **Bez** poziomego scrolla na całej szerokości ekranu (overflow ukryty)

### Oś Y — max 2 rzędy

- **`flex-wrap: wrap`** · **`max-height`** = 2 rzędy kart
- Gdy jednostek / grup jest dużo → **drugi rząd** nad pierwszym (wyrównanie do dołu docku — jak TW)
- Dotyczy:
  - **zewnętrznego** paska (ramki ARMIA 1 / ARMIA 2 / ARMIA 3 + karty solo)
  - **wewnętrznego** rzędu w ramce grupy (wiele kart w jednej armii)

### Ramki grup (ARMIA n)

- Etykieta grupy u góry ramki · karty poniżej · cała ramka traktowana jak **jeden blok** w wyśrodkowanym flow
- Kolory typów (z kodu C-09 v2): Konnica (błękit) · Piechota (złoto) · Łucznicy (piaskowy)

---

## Co musi być na mockupie (1920×1080)

### Klatka D1 — Deploy · armia duża (≥30 kart / 3 grupy)

**Tło:** pole bitwy 3D (jak C-06 v3) · strefa ATK po lewej.

**Dolny dock (główny focus):**

```
                    ┌─ ARMIA 1 ─┐  ┌─ ARMIA 2 ─┐  ┌─ ARMIA 3 ─┐
                    │ ▢ ▢ ▢ ▢ ▢  │  │ ▢ ▢ …     │  │ ▢ ▢ …     │
                    │ ▢ ▢ ▢      │  │           │  │           │
                    └────────────┘  └───────────┘  └───────────┘
                              ↑ wyśrodkowane · 2 rzędy jeśli trzeba
```

**Nad dockiem (skrót — już w C-06):** pasek GRUPY · filtry typu · Start walki — **nie redesignuj**, tylko spójność kolorów.

### Klatka D2 — Deploy · armia mała (≤8 kart)

- Jeden rząd · nadal **wyśrodkowany** · dużo pustego tła po bokach (TW feel)

### Klatka B1 — Walka ręczna · roster aktywny

- Ten sam układ kart co deploy · stan **zaznaczenia** (obwódka niebieska / checkmark)
- Pasek komend C-07 **osobno** — poniżej lub nad rosterem jak w kanonie (nie mylić z tym briefem)

### Klatka B2 — Walka · 2 rzędy pełne

- Pokazuje wrap przy pełnej armii · czytelność 62×58px (deploy) / 58×74px (walka) — dopuszczalna tolerancja ±4px w mockupie

---

## Elementy karty (bez zmian semantyki vs v2)

| Element | Deploy | Walka |
|---------|--------|-------|
| Ikona typu | SVG / glyph | j.w. |
| Nazwa skrócona | 1 linia ellipsis | j.w. |
| Pasek HP | zielony / czerwony | j.w. |
| Badge grupy | złoty numer | j.w. |
| Zaznaczenie | niebieska obwódka + glow | cyan check (walka) |

**Polish TW (Design dodaje):**
- Subtelna **rama tray** wokół całego bloku kart (metal / skóra 1E — nie kopiuj 1:1 assetów SEGA)
- Opcjonalnie: lekki **gradient tła docku** ciemniejszy u dołu ekranu
- **NIE** emoji · **NIE** poziomy scrollbar

---

## Styl 1E

- Spójność z **C-06 Deployment v3** i **C09 v2** (tokeny złota, panel gradient)
- Kolory stron: Ty `#3a6ad0` · wróg `#c84040` — `docs/ux/DECYZJA-C-kolory-stron-bitwa.md`
- Typografia: Segoe UI + Georgia (tytuły grup ARMIA n)

---

## Co NIE ruszać

| Plik | Powód |
|------|-------|
| `C09 Karty jednostek v2 (1E).dc.html` | archiwum — jeden rząd scroll |
| `DESIGN-BRIEF-C07-pole-HUD-v2.md` | dolny **pasek komend** (Pause, Hold…) — osobny ekran |

**Uwaga nazewnictwa:** w lane rejestrze C-09 = pasek komend; plik Design „C09 Karty” = roster jednostek (C-15/C-16) — zachowaj konwencję nazwy pliku.

---

## DoD Design

- [ ] Playtest deploy + walka w `gra-robocza/`
- [ ] Min. **3 klatki** (D1 duża armia · D2 mała · B1 walka)
- [ ] Wyśrodkowanie X + wrap max 2 rzędy Y — widoczne na D1
- [ ] Ramki grup ARMIA n spójne z kodem
- [ ] `DESIGN-do-UI_c09-roster-tw-v3.md`
- [ ] Propozycje polish (rama tray, cienie) — Lane portuje później jako CSS

**Po OK Macieja:** Lane UNITS ewentualny CSS z mockupu · **bez** zmiany logiki wrap.

---

## Lane — nie Design

Implementacja: `gra/src/battle/battleScene.ts` · `battleHudTheme.ts` (`applyTwRosterTrayStyle`)  
Handoff: `dyspozycje/_handoff/UI-do-DESIGN_C09-roster-tw-2026-07-04.md`
