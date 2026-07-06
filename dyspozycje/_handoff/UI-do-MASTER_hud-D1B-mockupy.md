# HANDOFF: UI mockupy → MASTER — HUD D1=B (hub kliknięć)

**Data:** 2026-06-27 (Maciej → MASTER)  
**Od:** Grupa A / mockupy HTML + Maciej  
**Do:** MASTER (plan integracji; wpiecie `hud.ts` po Opus)  
**Status:** **GOTOWE** — mockupy HTML kompletne P0+P1  
**Handoff:** ten plik · **Flaga: GOTOWE**

---

## Decyzja Macieja (gameplay ABC only)

| ID | Decyzja | Maciej | Data |
|----|---------|--------|------|
| **ABC1** | Akceptuję mockupy HUD P0+P1 (układ + flow kliknięć) | **A** | 2026-06-27 |

**Reguła od Macieja (2026-06-27):** Maciej podejmuje **wyłącznie decyzje gameplay w formacie ABC** (D1–D15, karta decyzji).  
**NIE** decyduje o: iframe vs inline DOM, embed.js, auto-redirect flow, toast vs alert — to **decyzje techniczne MASTER** przy wpiciu.

Otwarte ABC gameplay (jeśli dotyczy HUD): patrz `docs/MACIEJ-KARTA-DECYZJI.md` — **nie** lista D-M* z archiwum agenta.

---

## Co przesyłam

| Artefakt | Rola |
|----------|------|
| `UI/Makieta-HUD-D1B-preview.html` | **Hub** — układ stref A–I2 + routing klików |
| `UI/Makieta-START.html` | Launcher playtestu dla Macieja |
| `UI/mockup-embed.js` | Wspólny pasek ← Mapa w iframe |
| `docs/A1-HUD-KLIKI-MOCKUP-PRZEWODNIK.md` | Mapa klik → ekran |
| `docs/decyzje/A1-revB-uklad-mockup.md` | Układ stref (kanon layoutu) |
| `docs/A1-HUD-MAP-KLIKNIEC.md` | Logika klików (bez zmian) |

---

## Mapowanie mockup → moduł gry (docelowe)

| Klik w hubie | Typ | Moduł `gra/src/ui/` |
|--------------|-----|---------------------|
| Power | MD | overlay w `hud.ts` lub `diplomacyPanel` składnik |
| Menu | FS | `mainMenu.ts` |
| Nauka | FS | `sciencePicker.ts` |
| Miasta / hex miasta | FS | `cityPanel.ts` |
| Kultura / Religia | MD | nowe overlaye lub rozszerzenie `hud.ts` (A1-Q12) |
| Cuda | FS/MD | TBD — brak modułu v0.1 |
| Dyplomacja + chipy | FS | `diplomacyPanel.ts` (+ fokus nacja) |
| Wojsko | DK | panel armii (UNITS kontrakt) |
| Budowa | MP | tryb MAPA + banner G2 |
| Blocking / wróg | FS | `preBattle.ts` |
| Jednostka [H] | DK | **A2-Q4=A** · `unitPanelHud.ts` (2026-06-27) |
| WYKONAJ / G1 | AX | `onExecutePending` + gate `onEndTurn` |
| F2 toggles | W3 | MAPA warstwy + `hud.ts` hooki |

---

## Różnice mockup vs docelowy build

1. **iframe** w mockupie → w grze **jeden DOM** (Vite), bez iframe.
2. **Canvas mapy** w mockupie = placeholder — prawdziwa mapa z `render/*`.
3. **Blocking G1** — mockup symuluje `resolveBlocking()` po zamknięciu pre-bitwy.
4. **Etykieta „Power"** — jeśli otwarte: ABC gameplay Macieja (karta D*), nie mockup agenta.

---

## Wybory techniczne mockupu (MASTER — bez ABC Macieja)

Agent mockupu przyjął (MASTER może zmienić przy wpiciu):

| Temat | Mockup | Docelowo w grze |
|-------|--------|-----------------|
| Panele | iframe + `mockup-embed.js` | jeden DOM Vite |
| Flow krok 5 | auto-redirect 0,9 s | `newGameFlow.ts` callback |
| Miasta [C] | lista MD → FS | `onOpenCities` routing |
| G1 blocking | resolve po zamknięciu preBattle | `onExecutePending` |

Archiwum szczegółów: `docs/archiwum-czatow/master/MASTER-mockupy-HUD-*.md`

---

## DoD wpiecia (MASTER)

- [ ] Layout D1B zgodny z `A1-revB-uklad-mockup.md`
- [ ] Każdy wiersz `A1-HUD-MAP-KLIKNIEC.md` ma implementację lub ADR defer
- [ ] G1: blocking blokuje `onEndTurn` + WYKONAJ routing
- [ ] Minimapa F2 — kontrakt `MAPA-do-UI_minimap-data.md`
- [ ] Build `/tmp/civ-dist` + 17 suite ZIELONE
- [ ] Opus APPROVE przed kanonem

---

## Pliki mockupów (nowe w tej fazie)

- `UI/Makieta-dyplomacja.html`
- `UI/Makieta-preBattle.html`
- `UI/Makieta-cuda.html`
- `UI/Makieta-panel-jednostki.html`

**NIE edytowano:** `gra/src/main.ts`, `Gra-podglad.html`

---

## Powiązane handoffy (wcześniejsze)

- `UI-do-MASTER_hud-D1C.md` — minimapa + side panel (inny batch)
- `UI-do-MASTER_wykonaj-endTurn-gate-A1Q9.md` — G1
- `UI-do-MASTER_hud-wojna-A1Q5.md` — chipy wojny
- `C1-do-UI_preBattle-TW-layout.md` — layout pre-bitwy

**Flaga:** **GOTOWE** · Maciej ABC1=A · Czeka: Opus review → batch MASTER `hud.ts`
