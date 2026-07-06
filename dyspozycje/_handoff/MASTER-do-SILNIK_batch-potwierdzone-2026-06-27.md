# MASTER → SILNIK: Batch potwierdzone decyzje Macieja (2026-06-27)

**Flaga:** GOTOWE-do-wpiecia · **Priorytet:** P0  
**Decyzje:** P0 D-START · SIL-UX-1 · E1-UX-02 (kreator) ABC **B**

---

## Co MASTER wdrożył (kod gotowy — SILNIK: build + playtest + meldunek)

### 1. P0 D-START (P0-01…P0-05)

| ID | Pliki |
|----|--------|
| Crash `traktaty` | `diplomacy.ts` |
| Klaster obcych typów | `cluster-spawn.ts`, `cluster-start.ts`, `main.ts` |
| Kontakt 3A | `diplomacy-layers.ts`, `main.ts`, `diplomacyPanel.ts` |
| Panel wojna/handel 2B | `main.ts` `buildDiplomacyPanelConfig` |
| AI defensywne | `ai.ts`, `main.ts` `defensiveCopy` |

**Testy:** `cluster-start-test.cjs` · `diplomacy-test.cjs` · `smoke.cjs`

### 2. SIL-UX-1 — Podział pracy miasta

| Plik | Zmiana |
|------|--------|
| `gra/src/ui/cityPanel.ts` | Suwak balance Budynki ↔ Ulepszenia (100%) |
| `gra/src/main.ts` | `onPodzialPracyChange` (było — weryfikacja) |

Handoff szczegółowy: `MASTER-do-SILNIK_podzial-pracy-balance.md`

### 3. E1-UX-02 — Kreator krok 4 (ABC B zaawansowane)

| Plik | Zmiana |
|------|--------|
| `gra/data/ui-params.json` | `map_quality` w siatce głównej |
| `gra/src/ui/newGameFlow.ts` | Karta Jakość mapy · modal zaawansowanych (6 pól B) · `NewGameAdvancedOptions` |
| `gra/src/main.ts` | `mapQualityLabel` → render · `_menuAdvanced` · fog debug start |

**Modal B (zapisane w `params.advanced`):**
- Seed losowy / ręczny
- Jakość renderu GPU (osobno)
- Warunki zwycięstwa Power+dominacja
- Barbarzyńcy on/off
- Bitwy auto / zawsze ręczna *(stub — czeka UNITS)*
- Mgła / cała mapa debug *(działa: odkrywa wszystkie heksy)*

**CZEKA MAPA:** 3 presety terenu — dziś `mapQuality` → `mapDetailQuality` 1:1.

Makieta HTML: `UI/Makieta-flow-nowa-gra.html` (zsynchronizowana).

---

## Co SILNIK robi TERAZ

```powershell
cd gra
node tools/cluster-start-test.cjs
node tools/diplomacy-test.cjs
node tools/smoke.cjs
npx vite build --outDir $env:TEMP\civ-dist
Copy-Item $env:TEMP\civ-dist\index.html ..\Gra-podglad-ROBOCZA.html -Force
```

**Wynik MASTER (2026-06-27):** cluster 35/35 · diplomacy 135/135 · smoke OK · md5 **`428E4FD4BD76C46EBC1935AF4B343181`**

| AC | Kryterium |
|----|-----------|
| AC-1 | Kreator krok 4: 6 kart (w tym Jakość mapy) + modal zaawansowanych |
| AC-2 | Panel miasta: oba % przy suwaku pracy |
| AC-3 | Nowa gra → N bez crash (P0) |
| AC-4 | `Gra-podglad-ROBOCZA.html` zaktualizowany (md5 w meldunku) |
| AC-5 | Wpis `SILNIK-DO-MASTERA.md` |

**Po PASS:** Opus review → kanon `Gra-podglad.html`.

---

## NIE w tym batchu (lane)

| Temat | Lane |
|-------|------|
| Excel `kopia_typu_obronna` | CYWILIZACJE |
| 3 presety MAPA terenu | MAPA |
| Barbarzyńcy / victory / battle manual runtime | CYW + UNITS |
| Menu E1 S0 | UI |
