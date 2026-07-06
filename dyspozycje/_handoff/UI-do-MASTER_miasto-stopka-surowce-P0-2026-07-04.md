# UI → MASTER: miasto · stopka surowców P0 (kod, nie Design)

**Data:** 2026-07-04  
**Decyzja Macieja:** poprawki na **wersji Mastera** (`gra/` → kanon), **NIE** mockup Design.

---

## Co zrobiono (lane UI · `gra/src/ui/cityPanel.ts`)

**Plik:** `cityPanel.ts` · CSS `civ-v-right-foot` + `civ-w4-surowce-foot`

| Było | Jest |
|------|------|
| Stopka zlewa się z panelem Spichlerz (przezroczyste tło, cienka linia) | Osobny pas na dole kolumny: `margin-top`, `border-top`, gradient tła, cień od góry |
| Surowce wyglądały jak część tej samej karty | Stopka wizualnie **oddzielona** od scrolla zakładki |

**Semantyka bez zmian:** `renderSurowce` w `#cs-surowce-foot` · nie 8. zakładka · treść = ikona + nazwa.

---

## Co MASTER robi

1. **Backup:** `cityPanel.ts.bak-UI-2026-07-04-stopka`
2. **Sync:** `gra/` → `gra-kanon/` + `gra-robocza/` (identyczne src)
3. **Build:** `npx vite build --outDir $env:TEMP\civ-dist` → `Gra-podglad.html`
4. **Bramka:** smoke OK
5. **Maciej playtest:** `gra-kanon/START.html` Ctrl+F5 → miasto → Spichlerz + Handel → stopka na dole, wyraźnie oddzielona

**NIE:** kolejne dyspozycje do Design na layout stopki — Design **po** OK kodu.

---

## Playtest Maciej 2026-07-04 (kanon `5b9abefc`) — **NIE OK**

| Punkt | Werdykt |
|-------|---------|
| Semantyka stopki (`civ-v-right-foot`, nie 8. zakładka) | OK |
| Separacja wizualna od Spichlerza | **FAIL** — nadal wygląda jak ta sama karta |
| Chrome B-27/B-28 | OK |

**Przyczyna (MASTER):** w batchu TW/CSS lane fix **skasował `margin-top:auto`** z `.civ-v-right-foot` (było w baseline `153fcda2`) — stopka nie jest przypięta na dół kolumny flex.

---

## P0-1 — zakres hotfixu (tylko to, po **„rób P0-1”**)

1. **Przywrócić** `margin-top:auto` na `.civ-v-right-foot` (jak baseline Design).
2. **Dodać** wyraźniejszą separację: grubszy `border-top`, `margin-top` gap, cień od góry — **bez** zmiany treści stopki.
3. **Zostawić** sekcję Walka/TW w kartach jednostek (batch TW).
4. **NIE ruszać** `renderSurowce` markup (W4 ikony) poza CSS stopki.
5. Build → sync kanon/robocza → **Maciej playtest** przed kolejną promocją.

**Design:** STOP mockupów „7. klatka Surowce” — tylko klatki złożone (panel + stopka).

---

## Status

**→ MASTER: GOTOWE do playtestu P0-1** (2026-07-04 · lane UI)

### P0-1 wykonane

| AC | Stan |
|----|------|
| `margin-top:auto` na `.civ-v-right-foot` | ✅ przywrócone |
| Separacja: border + gap + cień | ✅ `padding-top:0.42em`, `border-top 0.38`, `box-shadow -8px` |
| Sekcja Walka/TW bez zmian | ✅ |
| `renderSurowce` markup bez zmian | ✅ tylko CSS stopki |

**Pliki:** `gra/src/ui/cityPanel.ts` (+ sync `gra-kanon/`, `gra-robocza/`) · backup `.bak-UI-2026-07-04-P0-1`

**Build:** vite → `$env:TEMP\civ-dist/index.html` → `gra-kanon/Gra-podglad.html` + `gra-robocza/Gra-podglad.html` · smoke OK

**Playtest Maciej:** Ctrl+F5 → `gra-kanon/START.html` → RZYM → Spichlerz + Handel → stopka na dole kolumny, oddzielona od scrolla.

**STOP:** `publish-kanon-snapshot` do Twojego OK na miasto · Design layout stopki.
