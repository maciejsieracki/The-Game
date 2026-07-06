# Handoff C1 → SILNIK / Grupa F — test + wpięcie

**Data:** 2026-06-26  
**Od:** Grupa C (UI + decyzje zamknięte)  
**Do:** SILNIK / Grupa F (`main.ts`, bramka, wersja robocza)  
**Status:** **GOTOWE** — wykonaj bez ponownego ABC Macieja

---

## Decyzje Macieja (zamknięte — mapowanie)

| ID | ABC | Skrót |
|----|-----|-------|
| C1-Q1 | A | preBattle przy faktycznej bitwie; oblężenie bez szturmu → C3 |
| C1-Q2 | TW | layout mockup OK |
| C1-Q2b | **B** | Enter = Bitwa ręczna |
| C1-Q3 | **A** | zawsze deployment (`deploy: true`) |
| C1-Q4 | **A** | pełny skład D8=A na preBattle + do bitwy |
| C1-Q5 | **A** | Wycofaj zawsze, bez strat |

Pełna spec: `docs/decyzje/C1-wejscie-walke.md`

---

## Co już jest w `main.ts` (F-C1 batch 2026-06-27)

Sprawdzone — **częściowo wdrożone:**
- `onSave` + `doQuickSave` w obu `showPreBattle`
- `deploy: true` w `BattleScene` (mapa + klawisz T)
- `PreBattleInfo`: `miejsce`, `lokacja`, `tura`, `canRetreat`

Backup: `main.ts.bak-SILNIK-20260627-F-B2-C1`

---

## Co SILNIK ma dokończyć

### 1. C1-Q2b — domyślny Enter
```ts
showPreBattle(pbInfo, callbacks, { defaultAction: 'manual' });
```
Oba wywołania (atak z mapy + test T).

### 2. C1-Q4 — skład multi-unit (D8=A)
Atak z mapy: obecnie **1v1** w `pbInfo4`.  
Zbierz:
- atakujący: heks atakującego + **własne** jednostki w promieniu **1 heks**
- obrońca: heks obrońcy + własne w promieniu 1 heks  

Kontrakt: `dyspozycje/_handoff/UNITS-do-MASTER_kontrakt-walka-multi.md`  
Referencja logiki: `gra/src/movepreview/main.ts` (posiłki 1-heks)

Przekaż pełną listę do `PreBattleInfo.units` **i** do `BattleScene` attacker/defender arrays.

### 3. C1-Q5 — Wycofaj bez strat
`onCancel`: nie ustawiaj `ruchLeft = 0`; przywróć zaznaczenie / reachable jak przed atakiem (jeśli atak jeszcze nie „zatwierdzony”).

### 4. C1-Q2 — Zapisz grę
Overlay **nie** zamyka się po `onSave` (już OK jeśli tylko `doQuickSave` bez `hidePreBattle`).

### 5. Opcjonalnie (nice)
- `wodz` / `portretEmoji` w `PreBattleSide` z danych cywilizacji
- `modyfikatory` terenu w `PreBattleInfo` (bonus struktury już liczony)

---

## Bramka (obowiązkowa przed Master)

```powershell
cd gra
npx tsc --noEmit
node tools/smoke.cjs
node tools/battle-smoke.cjs
node tools/combat-test.cjs
npx vite build --outDir $env:TEMP\civ-dist
Copy-Item $env:TEMP\civ-dist\index.html ..\Gra-podglad-ROBOCZA.html
```

**Playtest Macieja:** atak na mapie → nowy overlay TW → Auto / Bitwa ręczna (deploy) / Wycofaj / Zapisz.

---

## Raportowanie

1. `dyspozycje/SILNIK-DO-MASTERA.md` — wynik bramki + md5 roboczej
2. `docs/czaty/DO-MASTERA.md` § **Grupa F** → `→ MASTER: GOTOWE-ROBOCZA`
3. **Master** → Opus review → `Gra-podglad.html` (finalna)

**Flaga:** **WPIĘTE** (2026-06-27 ~21:40)
