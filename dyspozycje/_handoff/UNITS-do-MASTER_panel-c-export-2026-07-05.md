# UNITS + Grupa C → MASTER · Panel-C export 2026-07-05

| Pole | Wartość |
|------|---------|
| **Status** | **→ MASTER: GOTOWE-ROBOCZA** (eksport + bramka) |
| **Trigger Macieja** | `eksportuj panel C` · 2026-07-05 ~00:25 |
| **DZIENNIK** | `DZIENNIK-MASTERA.md` § [2026-07-05 ~00:25] |
| **Robocza po eksporcie** | md5 **`5206766b8f460173d12bcfd51552f923`** |
| **Kanon tego dnia** | **`89a870fb…`** (~08:34 promocja Panel-C staty · units 75) — **starszy niż późniejsze publishy roboczej** |

---

## Eksport

```bash
python panele-sterowania/export-c.py
```

| Arkusz / obszar | Zmiany (raport exportu) |
|-----------------|---------------------------|
| Staty jednostek | **406** wierszy |
| Macierz | **45** |
| Koszty | **2** |
| Moc cache | **78** |

**Pliki docelowe (typowo):** `gra/data/units.json` · `gra/data/combat-params.json` · `gra/data/auto-battle-params.json` (+ powiązane z export-c.py)

---

## Bramka (PASS)

| Test | Wynik |
|------|-------|
| `combat-test.cjs` | **6/6** |
| `unit-power` (jeśli uruchomiony) | **6/6** |
| `smoke.cjs` | OK |

---

## Kontekst rozjazdu kanon vs robocza

1. **00:25** — export Panel-C → robocza `5206766b` · kanon bez zmian  
2. **08:34** — promocja kanon `89a870fb` (Panel-C + units 75)  
3. **Później tego dnia** — kolejne publishy roboczej (UI, UPGRADE `eac24a66`, W4 `703e6212`…) **bez** ponownej promocji kanonu (Maciej: pracujemy w roboczej)

**Wniosek:** Panel-C **jest w bundlu roboczej** (przez łańcuch publishów od `5206766b` w górę), ale **kanon nie odzwierciedla** najnowszej roboczej.

---

## DoD Master

- [x] Ten handoff (uzupełnia lukę vs sam wpis DZIENNIK)
- [x] Wpis `UNITS-DO-MASTERA.md`
- [ ] Playtest walki po świeżym publishu (Maciej)
- [ ] Promocja kanon — **HOLD** do decyzji Macieja

**Flaga:** `→ MASTER: GOTOWE-ROBOCZA` (dane) · publish mapy UI = osobny tor `UI-do-MASTER_publish-robocza-2026-07-05.md`
