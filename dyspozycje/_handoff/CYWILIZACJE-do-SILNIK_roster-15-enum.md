# Handoff: CYWILIZACJE → SILNIK — roster 15 + enum + archetypy (Q7A)

**Status:** ✅ GOTOWE (Integrator 2026-06-26) · kanon `5949422D…`  
**Decyzje:** D-ROSTER 2026-07-01 (Q1A, Q3A, Q6A, Q7A)  
**Lane nadawca:** CYWILIZACJE (Grupa D)  
**Lane odbiorca:** SILNIK / Integrator (+ patch CYW w `player.ts`, `diplomacy.ts`)

---

## Co przesyłam

1. **`panele-sterowania/Panel-D.xlsx`** — 6 nowych nacji + migracja Sumer (`ikonaId`/`typCywilizacji` → `sumer`)
2. **Skrypty pipeline:**
   - `panele-sterowania/merge-roster-6-panel-d.py` — już uruchomiony 2026-07-01
   - `panele-sterowania/export-d.py` — aktualizuje bonusy/klastry/AI/dyplomacja **istniejących** wpisów
   - `gra/tools/import-roster-6-civs.py` — **append** 6 pełnych wpisów do `civs.json` + migracja Sumer
3. **Draft źródłowy:** `Civ-CYWILIZACJE/draft/roster-6-REZERWA.json`

---

## Co odbiorca ma zrobić

### Krok A — po komendzie Macieja „eksportuj panel”

```powershell
cd <root>
python panele-sterowania/export-d.py
python gra/tools/import-roster-6-civs.py
```

**DoD A:** `civs.json` ma **15** cywilizacji; Sumerowie: `typCywilizacji: "sumer"`, `ikonaId: "sumer"`.

### Krok B — enum + dyplomacja (CYW lane, nie main.ts)

**`gra/src/types/player.ts`** — dodać do `TypCywilizacji`:

| Enum key | wartość string |
|----------|----------------|
| Sumer | `sumer` |
| Harappa | `harappa` |
| Hetyci | `hetyci` |
| Slowianie | `slowianie` |
| Babilonia | `babilonia` |
| Asyria | `asyria` |
| Fenicjanie | `fenicjanie` |

**Migracja:** `Babilon` enum zostaje dla kompatybilności wstecznej lub alias — **decyzja integratora** po grep `TypCywilizacji.Babilon` / `"babilon"`.

**`gra/src/game/diplomacy.ts`** — Q7A: nowe wpisy w `ARCHETYPE_AGGRESSION`, `ARCHETYPE_TRADE`, `ARCHETYPE_ALLIANCE` (i powiązane mapy) wg draftu `civAi` + `perNacja`.

**`civ-roster.ts` / loader** — pula losowania = wszystkie 15 typów (cap na mapie bez zmian — E1).

### Krok C — SILNIK (main.ts)

- Wpięcie roster 15 w flow nowej gry (jeśli hardcoded lista 9)
- **Osobno:** SILNIK-D-V11 (dyplomacja v1.1)

---

## Kiedy handoff GOTOWE

- [ ] Maciej zatwierdził wartości w Panel-D
- [ ] export-d + import-roster-6 wykonane
- [ ] enum + archetypy w TS
- [ ] diplomacy-test + ai-test ZIELONE
- [ ] Integrator: smoke nowej gry z 15 typami w puli

**Flaga:** CZEKA (Panel-D u Macieja)
