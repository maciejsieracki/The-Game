# MASTER → UI: port Design 1E — pole bitwy (C-06 / C-07 / C-09)

**Status:** **ACTIVE — faza 2: Design v4** (port UI **CZEKA** ZIP)  
**Data:** 2026-07-04  
**Trigger:** ✅ Maciej werdykt 2026-07-04 ~20:52 · Hak 1 OK · Hak 2 **A**

---

## Workflow (jak A-06)

| Krok | Kto | Co | Stan |
|------|-----|-----|------|
| **1** | **UI lane** | review pack 3 stany | ✅ **ZAMKNIĘTE** |
| **2** | **Maciej** | Werdykt Hak 1 + Hak 2 | ✅ **2026-07-04** |
| **3** | **Design** | ZIP `POLE-BITWY-HUD-v4-2026-07-04` | **→ TERAZ** |
| **4** | **UI lane** | Port skin (ten handoff) | **CZEKA ZIP** |
| **5** | **Master → F** | review · kanon | po krok 4 |

**DELTA:** `docs/ux/MASTER-DELTA-POLE-BITWY-vs-mockupy.md`  
**Design spec (port po ZIP):** `docs/ux/DESIGN-SPEC-POLE-BITWY-HUD-v4-2026-07-04.md`  
**NIE** wysyłać Design ze starymi v2/v3 bez DELTA.

---

## Kontekst

Batch funkcjonalny POLE-BITWY (**ZAMKNIĘTY** — handoff `UI-do-SILNIK_pole-bitwy-ui-batch-20260704.md`).

**Poza scope tego zadania:** tempo walki / długość bitew → backlog **balans** (Maciej: na spokojnie, nie P0).

---

## Co UI ma zrobić

**Port wizualny 1E** mockupów Design → kod lane UI/battle (bez zmian logiki walki).

### Pliki lane

| Plik | Zakres |
|------|--------|
| `gra/src/battle/battleScene.ts` | HUD górny/dolny, roster, toolbar, kolory stron |
| `gra/src/battle/battleHudTheme.ts` | tokeny, siatka rosteru, stałe 1E |
| `gra/src/battle/battleHudTheme.ts` + assety `gra/src/ui/assets/brand/` | ikony SVG z brand-book |

**NIE** `main.ts` · **NIE** `combat.ts` / balans · **NIE** zmiana czasu trwania walki.

### Mockupy źródłowe (po Design v4)

| ID | Plik | Co portować |
|----|------|-------------|
| **C-06 v4** | `The Game - C06 Deployment v4 2026-07-04 (1E).dc.html` | 3 klatki Deploy/AUTO/R · mapa B · minimapa · rail 56px |
| **C-09 v4** | `The Game - C09 Roster lewy panel v4 2026-07-04 (1E).dc.html` | panel ~368px · karta MUST · scroll |

**Spec portu:** `DESIGN-SPEC-POLE-BITWY-HUD-v4-2026-07-04.md` · handoff Design: `DESIGN-do-UI_POLE-BITWY-HUD-v4.md` (w ZIP)

**v2/v3 = archiwum** — nie portować.

### Baseline funkcjonalny (nie psuć)

Playtest Macieja OK na buildzie `POLE-BITWY-20260704-manual-polish`:
- AUTO ↔ RĘCZNY · Taktyka/Strategia · filtry Konnica/Piechota/Grupa · ◆ Grupuj · SPACJA

Build testowy: `npx vite build --config vite.oblezenie-bitwa.config.ts` → `Gra-podglad-POLE-BITWY.html`

---

## DoD

- [ ] Wygląd zgodny z mockupami 1E (złoto `#e8d88a`, outline 4C, bez emoji, kolory Ty `#3a6ad0` / wróg `#c84040`)
- [ ] Deploy + walka ręczna — ten sam skin
- [ ] Funkcje z batchu funkcjonalnego nadal działają (checklist powyżej)
- [ ] `battle-smoke` OK · build POLE-BITWY OK
- [ ] Meldunek `UI-DO-MASTERA.md` → **`→ MASTER: GOTOWE`**
- [ ] **NIE** publikuj kanonu — Master → F po review

---

## Test Macieja (po lane)

Ctrl+F5 `Gra-podglad-POLE-BITWY.html` · porównaj z mockupem C-06/C-09 obok siebie.

**Flaga lane:** `→ MASTER: GOTOWE`
