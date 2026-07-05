# MASTER → UNITS · Popupy Deploy v5 — P1 (po batch P0)

**Handoff Design:** `docs/ux/claude-design/HANDOFF-Cursor-Popupy-Deploy-v5.md`  
**GitHub:** https://github.com/maciejsieracki/The-Game/blob/main/docs/ux/claude-design/HANDOFF-Cursor-Popupy-Deploy-v5.md  
**Test:** `gra-kanon/Gra-podglad-POLE-BITWY.html` → nowa gra → deploy → toolbar dolny

**Pliki lane (TYLKO te):**
- `gra/src/battle/battleScene.ts`
- `gra/src/battle/battleHudTheme.ts`

**NIE RUSZAĆ:** `main.ts` · logika F1–F3 / flanks|rear / doktryn / Strategia popup

---

## JUŻ ZROBIONE (nie duplikuj — rev. 2026-07-05)

- ✅ Konnica popup: SVG flanka + okrążenie (`FMT_SVG.cavFlanks/cavRear`) + wiersze z podpisem
- ✅ Linie: rename **Dystansowe** · domyślne archer lines **3** · ikona celownika w nagłówku
- ✅ Formacja: wiersze ikona + tytuł + podpis · F3 copy „Machiny na skrzydłach"
- ✅ Taktyka: siatka 2×2 + ikony (tymczasowe `DEPLOY_TACTIC_SVG`)
- ✅ Zaznaczenie popup: `paintDeployPopupOption` · tło `.08` · ramka 2px
- ✅ Szerokości popup: 220 / 220 / 240 / 300 px
- ✅ `DEPLOY_KIND_LABEL` · chip statusu `D:` zamiast `Ł:`

---

## DO ZROBIENIA (P1)

### 1 · Ikona hełmu na przycisku toolbara „Konnica"
Handoff GAP-04: hełm z `rotate(180 12 12)` — SVG od Design (czeka) LUB tymczasowo z brand-book.  
Przycisk: `_makeDeployToolbarDropdown('Konnica', …)` — dodać ikonę obok labela (jak Reset ma SVG).

### 2 · Podmiana SVG po dostarczeniu przez Design
Gdy pliki trafią na GitHub (`docs/ux/claude-design/`):
- `DEPLOY_TACTIC_SVG.*` → kanoniczne 4 ikony (Obrona/Atak/Szturm/Ostrzał)
- `FMT_SVG.f1/f2/f3` → jeśli Design poda wersje ≠ obecne
- ewent. dedykowany `DEPLOY_FORMATION_SVG` zamiast reuse FMT_SVG

### 3 · Pixel-perfect vs mockup HTML
Gdy pojawi się `The Game - Popupy deploy v5 2026-07-05 (1E).dc.html`:
- padding wierszy · gap · font-size · letter-spacing · hover (jeśli w mockupie)
- porównaj screenshot PRZED/PO z `docs/ux/export/` (dopisz PNG jeśli brak)

### 4 · Taktyka w fazie walki R (manual)
Ten sam popup Taktyka musi wyglądać identycznie w deploy **i** po SPACJA→RĘCZNY.  
Sprawdź `_toggleDeployDropdown('tactics')` gdy `!deployPhase && started`.

### 5 · Meldunek
Append `dyspozycje/UNITS-DO-MASTERA.md`:
- co podmieniono · screenshoty · czy czeka na Design (lista)

---

## DoD (AC)

- [ ] Przycisk „Konnica” ma ikonę hełmu (obróconą) lub wpis „BLOCKED: czekam SVG Design"
- [ ] Po podmianie SVG Design — diff tylko w `battleHudTheme.ts` constants
- [ ] Deploy + walka R: 4 popupy spójne wizualnie (złota ramka `.08`, wiersze z ikoną)
- [ ] `npx tsc --noEmit` w `gra/` — OK
- [ ] Playtest POLE-BITWY: Formacja / Konnica / Linie / Taktyka — bez regresji logiki

---

*MASTER · 2026-07-05 · batch P1 po P0 handoff*
