# UI → MASTER: miasto · stopka P0-1b (CSS only)

**Data:** 2026-07-04  
**Trigger:** Playtest P0-1 **FAIL** (stopka klei się do Spichlerza / za cienka linia)  
**Zakres:** **tylko CSS** w `cityPanel.ts` · **bez Design**

---

## Zmiany (`.civ-v-right-foot` + otoczenie)

| Element | P0-1b |
|---------|--------|
| `.civ-v-right-col` | `height:100%!important` — pin flex stopki |
| `.civ-v-right-main` | `padding-bottom:0.72em` — oddech nad stopką |
| `.civ-v-right-foot` | `margin-top:auto` · full-bleed (`margin-left/right/bottom` −padding rodzica) · **`border-top:2px`** · ciemniejszy gradient · cień `−14px` · `::before` groove |
| `.civ-w4-surowce-foot` | Osobna mini-karta: border-radius 10px · border gold · tło odróżnione od `.panel` Spichlerza |

**Bez zmian:** `renderSurowce` markup · sekcja Walka/TW · `cityUxFrame.ts`

**Backup:** `gra/src/ui/cityPanel.ts.bak-UI-2026-07-04-P0-1b`

---

## MASTER

1. Bundle playtest → **`gra-robocza/Gra-podglad.html`** md5 **`5c39e3013da230ea183d7311f1eb29a3`** (src zsynchronizowany też do `gra-kanon/src/` — **bez** podmiany kanon bundle = STOP promocji)
2. **Maciej:** Ctrl+F5 **`gra-robocza/START.html`** → miasto RZYM → Spichlerz + Handel → stopka **oddzielny pas** na dole
3. **STOP promocji** `gra-kanon/Gra-podglad.html` do werdyktu OK/FAIL

**Design:** STOP — nie ruszać mockupów stopki.

---

## Status

**→ CZEKA playtest Maciej P0-1b**
