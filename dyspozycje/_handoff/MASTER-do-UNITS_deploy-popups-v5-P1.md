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

### 1 · Ikona hełmu na przycisku toolbara „Konnica" ✅ READY (Design 2026-07-05)
Handoff **GAP-04 · „Ikona HEŁMU"** — gotowe SVG w `HANDOFF-Cursor-Popupy-Deploy-v5.md` (linie 55–64).  
**Nie melduj BLOCKED.** Wstaw na przycisk `_makeDeployToolbarDropdown('Konnica', …)` obok labela (jak Reset ma SVG).  
Stała w `battleHudTheme.ts` (np. `DEPLOY_CAV_TOOLBAR_SVG`) — jeden string HTML z handoff.

### 2 · Podmiana SVG po dostarczeniu przez Design ⏳
Design zapowiada sekcję **„SVG KANON — KOD"** (Formacja ×3, Taktyka ×4, Piechota w Linie) + mockup HTML v5.  
**Watch:** `git pull` → ten sam plik handoff + `The Game - Popupy deploy v5 2026-07-05 (1E).dc.html`.  
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

- [ ] Przycisk „Konnica” ma ikonę hełmu z handoff (GAP-04 · linie 55–64)
- [ ] Po podmianie SVG Design — diff tylko w `battleHudTheme.ts` constants
- [ ] Deploy + walka R: 4 popupy spójne wizualnie (złota ramka `.08`, wiersze z ikoną)
- [ ] `npx tsc --noEmit` w `gra/` — OK
- [ ] Playtest POLE-BITWY: Formacja / Konnica / Linie / Taktyka — bez regresji logiki

---

*MASTER · 2026-07-05 · batch P1 po P0 handoff*
