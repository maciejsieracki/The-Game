# MASTER → INTEGRATOR F: batch D4-WYMIANA-PN (P4)

| Pole | Wartość |
|------|---------|
| **Status** | 🟢 **START** — dyspozycja Master 2026-06-30 |
| **Od** | Master Orkiestrator (hub) |
| **Do** | czat Grupa F |
| **Batch** | `D4-WYMIANA-PN` |
| **Poprzedni kanon** | md5 `4B360364201828D2F0D5B6C3C40EE556` |

---

## Źródło (lane D — kod już w repo)

| Handoff | Rola |
|---------|------|
| `CYWILIZACJE-do-INTEGRATOR_wymiana-pn-zaufanie.md` | **kontrakt główny** |
| `CYWILIZACJE-do-UI_handel-koszyk-pn.md` | UI równolegle (bez main.ts) |

**Kod lane D (bez regresji):**
- `gra/src/game/diplomacy-value-catalog.ts` · test **41/41**
- `gra/data/diplomacy.json` — `wartosc_katalog`, `pn_relacja`, `pn_zywnosc`

**Decyzje:** `docs/decyzje/D3-wymiana-OTWARTE-ABC.md`

---

## AC Integratora F

1. **Stan per para:** `trustPnGainedThisTurn`, `dobraWolaRemainingTur` (+ save/load)
2. **Eksport w `openDiplomacyAudience` → `getState()`:** `trustPnGainedThisTurn`, `relacjaTotal`, `progDarRelacja` (30)
3. **Zastąpić flat `dar_zaufanie +6`** — `diplomacyGiftTrustFromPn` / `diplomacyTradeTrustFromDeal` (W1-A, PN-ZAUF)
4. **AI akceptacja:** ścisłe PN via `diplomacyFairGivePn` (W4-A)
5. **Transfer v1:** zloto, praca, żywność (spichlerz), złoże boolean; tech/jednostka/surowiec — stub OK jeśli brak ścieżki (batch 2)
6. **W10-A+:** zawieszenie grantów złoża przy wojnie; po pokoju renegocjacja
7. **Dobra wola:** tick +1 Zauf./turę × 3 gdy flaga aktywna
8. **Backup:** `main.ts.bak-INTEGRATOR-D4-WYMIANA-PN-2026-06-30`
9. **Bramka:**
   - `node gra/tools/diplomacy-value-catalog-test.cjs` — **41/41**
   - `node gra/tools/diplomacy-test.cjs` · `diplomacy-proposal-test.cjs` — zielone (popraw test dar jeśli oczekiwał +6)
   - `node gra/tools/smoke.cjs`
   - `.\gra\tools\bramka-test-publish.ps1`
10. **Build** → publish **`Gra-podglad-ROBOCZA.html`** — **nie** finalna
11. **Meldunek:** `F-do-MASTER_D4-WYMIANA-PN-2026-06-30.md` · **`→ MASTER: GOTOWE-ROBOCZA`**

---

## DoD

- [ ] Katalog PN wpięty w silnik (nie tylko plik orphan)
- [ ] Limit +5 Zauf./turę z PN działa
- [ ] UI może czytać stan z `getState()` (kontrakt dla Grupy E)
- [ ] Master: review subagent → promocja kanon

**Równolegle:** Grupa E — koszyk UI (`UI.md` DO ZROBIENIA TERAZ).
