# GRUPA B → MASTER: B5-Spichlerz — lane GOTOWE

| Pole | Wartość |
|------|---------|
| **Status** | ✅ **GOTOWE** (lane B) · **ACK Master 2026-07-01** · dyspozycja F P3 |
| **Data** | 2026-06-30 |
| **Warstwa** | 🟡 cross (`turn-economy.ts`, `cityPanel.ts`, `empire-food.ts` — bez `main.ts` w tym meldunku) |
| **Kanon decyzji** | `docs/decyzje/B5-spichlerz-wzrost-ludnosci.md` |

---

## TL;DR

B5-SPICH wdrożony w lane B: bufor wzrostu, gałęzie ze/bez Spichlerza, zapasy państwa, UI panelu. **Integrator F** — wpięcie jeśli jeszcze nie w kanonie (batchy wcześniejsze).

---

## AC (checklist)

| AC | Stan |
|----|------|
| AC-1 Bufor wzrostu + próg | ✅ `populationGrowth` · `turn-economy.ts` |
| AC-2 Bez Spichlerza (bufor=0, zapasy bez kumulacji) | ✅ `economy.ts` · `empire-food.ts` |
| AC-3 Ze Spichlerzem (50% bufor, kumulacja zapasów imperium) | ✅ `ownerHasSpichlerz` / `maSpichlerz` w ticku |
| AC-4 UI Spichlerz (nie „magazyn”) | ✅ `cityPanel.ts` |
| AC-5 Testy | ✅ patrz poniżej |

---

## Testy (zielone)

```
node tools/spichlerz-wzrost-test.cjs     → 9/9
node tools/empire-food-b5-test.cjs       → 10/10
node tools/food-hodowla-test.cjs         → 26/26
```

---

## Pliki lane B

| Plik | Zmiana |
|------|--------|
| `gra/src/game/economy.ts` | `populationGrowth` B5-SPICH |
| `gra/src/game/empire-food.ts` | kumulacja zapasów tylko ze Spichlerzem w imperium |
| `gra/src/game/turn-economy.ts` | `maSpichlerz`, split `getEmpireFoodSplit`, WIRE 5 |
| `gra/src/ui/cityPanel.ts` | sekcja Spichlerz, suwak, zapasy państwa |
| `gra/tools/empire-food-b5-test.cjs` | regresja (fix 2026-06-30: bez Spichlerza = 0 kumulacji) |

**NIE ruszano:** `main.ts`, `Gra-podglad.html`

---

## Co sprawdzić po wpięciu (Integrator / playtest Maciej)

1. Miasto bez Spichlerza: wzrost 1→2, bufor **0**, zapasy armii **nie rosną** między turami.
2. Imperium ze Spichlerzem: bufor po wzroście **50%**, zapasy armii **kumulują**.
3. Panel miasta → kolumna **Spichlerz**: pasek bufora + suwak Rozwój miast / armia.
4. HUD: zapasy państwa 🍞 (w `main.ts` — już wpięte jeśli kanon świeży).

---

## → MASTER

Kolejka Integratora: scal batch B5 jeśli brak w kanonie · bramka testów · ACK.
