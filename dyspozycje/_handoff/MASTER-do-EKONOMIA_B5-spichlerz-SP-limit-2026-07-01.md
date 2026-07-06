# MASTER → EKONOMIA (Grupa B): B5-SP limit zapasów armii

| Pole | Wartość |
|------|---------|
| **Status** | 🟢 **GOTOWE** |
| **Batch** | `B5-SP-LIMIT` |
| **Decyzja Macieja** | `MACIEJ-do-MASTER_B5-spichlerz-SP-2026-07-01.md` · SP6=C · SP6-overflow=A · SP3=A |
| **Warstwa** | 🟡 cross (`empire-food.ts`, ewent. `econ-params.json`) — **bez `main.ts`** |

---

## AC lane B

1. **Cap zapasów państwa:** `maxZapasy = 100 × countSpichlerz(ownerId)` (liczba miast z budynkiem `spichlerz` w imperium).
2. **Ze Spichlerzem:** `zapasyPo = clamp(zapasyPrzed + doPanstwa - kosztArmii, -∞, maxZapasy)` — wartość może być ujemna (głód).
3. **Overflow (SP6-overflow=A):** jeśli `zapasyPrzed + doPanstwa - kosztArmii > maxZapasy` → nadwyżka **przepada** (cap na końcu tury).
4. **Bez Spichlerza w imperium:** bez zmian — brak kumulacji, cap=0 efektywnie (jak dziś).
5. **Parametr:** `spichlerz_pojemnosc_zapasow_panstwa: 100` w `econ-params.json` (normal; easy/hard opcjonalnie).
6. **Eksport stanu dla UI/HUD:** max cap per owner (kontrakt w handoff do UI lub `_handoff/EKONOMIA-do-UI_*`).

---

## Testy (DoD)

```
node gra/tools/empire-food-b5-test.cjs   — rozszerzyć / nowy plik spichlerz-cap-test.cjs
node gra/tools/spichlerz-wzrost-test.cjs — regresja 9/9
```

Scenariusze min.:
- 0 Spichlerzy → zapasy nie kumulują (jak dziś)
- 1 Spichlerz, max 100, +50/t → po 2 turach cap 100, reszta przepada
- 2 Spichlerze → max 200

---

## Meldunek

Append `EKONOMIA-DO-MASTERA.md`:

```
→ MASTER: GOTOWE · batch B5-SP-LIMIT · testy X/X
Handoff UI: EKONOMIA-do-UI_spichlerz-cap-kontrakt.md (jeśli nowe pola)
```

**NIE** edytuj `main.ts` · **NIE** publikuj ROBOCZA.
