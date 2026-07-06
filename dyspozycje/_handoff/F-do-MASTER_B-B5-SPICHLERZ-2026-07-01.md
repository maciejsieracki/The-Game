# GRUPA F → MASTER: B-B5-SPICHLERZ (P3)

| Pole | Wartość |
|------|---------|
| **Status** | 🟠 **→ MASTER: GOTOWE-ROBOCZA** |
| **Data** | 2026-07-01 |
| **Batch** | `B-B5-SPICHLERZ` |
| **Poprzedni ROBOCZA** | `4B360364201828D2F0D5B6C3C40EE556` (A-P4-UI) |

---

## Scope

Lane B wdrożył B5 w modułach (bez `main.ts`). Integrator F: weryfikacja diff + bramka + rebuild ROBOCZA.

| Plik | B5 (weryfikacja) |
|------|------------------|
| `gra/src/game/economy.ts` | `populationGrowth` B5-SPICH — bufor 0 / 50% |
| `gra/src/game/empire-food.ts` | kumulacja zapasów tylko ze Spichlerzem |
| `gra/src/game/turn-economy.ts` | `maSpichlerz`, WIRE 5, `getEmpireFoodSplit` |
| `gra/src/ui/cityPanel.ts` | kolumna Spichlerz, suwak rozwój/armia, szczegóły |
| `gra/src/main.ts` | **bez zmian** — `advanceEmpireFood` / `getEmpireFoodState` już wpięte |

**Handoff Master:** `MASTER-do-INTEGRATOR_B-B5-spichlerz-2026-07-01.md`  
**Lane B:** `EKONOMIA-do-MASTER_B5-spichlerz-GOTOWE.md`  
**Kanon decyzji:** `docs/decyzje/B5-spichlerz-wzrost-ludnosci.md`

---

## Bramka

| Test | Wynik |
|------|-------|
| **spichlerz-wzrost** | **9/9** |
| **empire-food-b5** | **10/10** |
| **food-hodowla** | **26/26** |
| wire-ekonomia | 29/29 |
| logic | 203/203 |
| combat | 6/6 |
| post-battle-map | 10/10 |
| army-merge-bounce | 2/2 |
| civ-bonusy | 33/33 |
| diplomacy | 143/143 |
| ai-test | 193/198 (5× T2S — pre-existing) |
| smoke | OK |
| battle-smoke | OK |
| vite build | OK |

**Backup:** `main.ts.bak-INTEGRATOR-B-B5-2026-07-01` (precaution — main.ts nie edytowany)

**Warstwa:** 🟡 cross (`turn-economy`, `cityPanel`, `empire-food`)

---

## ROBOCZA (F)

| Plik | md5 |
|------|-----|
| **`Gra-podglad-ROBOCZA.html`** | **`4B360364201828D2F0D5B6C3C40EE556`** |
| **PLAYTEST-*** | ten sam bundle |

**Uwaga:** md5 identyczny jak A-P4-UI — B5 był już w źródle lane B; brak diff w `main.ts`, rebuild potwierdza spójność bundle.

**Kanon finalna** (`Gra-podglad.html`) — **bez zmian przez F** · promocja Master po review

---

## DoD

- [x] AC-1 Bufor wzrostu + próg (`populationGrowth`)
- [x] AC-2 Bez Spichlerza: bufor=0, zapasy bez kumulacji
- [x] AC-3 Ze Spichlerzem: 50% bufor, kumulacja zapasów imperium
- [x] AC-4 UI Spichlerz (nie „magazyn")
- [x] AC-5 Testy B5 9/9 + 10/10 + 26/26
- [x] Bramka pełna ZIELONA · ROBOCZA opublikowana

---

## Co sprawdzić po wpięciu (playtest Maciej)

1. Miasto bez Spichlerza: bufor **0** po wzroście, zapasy armii **nie rosną** między turami
2. Imperium ze Spichlerzem: bufor **50%** po wzroście, zapasy **kumulują**
3. Panel miasta → kolumna **Spichlerz**: pasek bufora + suwak Rozwój miast / armia
4. HUD: zapasy państwa 🍞
