# R-HEX-PLONY-MAGAZYN — plony terenu → magazyn państwa

| Pole | Wartość |
|------|---------|
| **Decyzja Macieja** | **B** — podłączyć plony terenu do magazynu (2026-07-29) |
| **Status** | **WDROŻONE** |
| **Lane** | EKONOMIA (Grupa B) |

---

## Sytuacja (przed)

- UI i `terrain-yields.json` pokazywały Drewno/Kamień na heksach.
- Magazyn państwa dostawał głównie `surowiec_ilosc_tura` z ulepszeń (Tartak, Kamieniołom…).
- Drewno z obrabianych pól było częściowo podłączone (tylko drewno); kamień i glina z terenu **nie** trafiały do magazynu.
- Cywilizacja bez lasu/gór w zasięgu i bez ulepszeń nie zbierała minimalnych surowców z pól z 👤.

---

## Decyzja B (Maciej)

1. **Pełne** `tileYield().drewno` / `.kamien` / `.glina` z **każdego** heksa w `cityWorkedTilesForEconomy` (centrum miasta + pola z 👤) → magazyn państwa.
2. Ulepszenia (`surowiec_ilosc_tura`: Tartak, Kamieniołom, Glinianka…) **dodatkowo** (addytywnie), bez podwójnego liczenia `surowiec_ilosc_tura` (nie ma go w `tileYield`).
3. Cel produktowy: nawet Równina (np. 2 Drewna + 1 Kamień) przy 👤 daje surowce — cywilizacja nie utyka na starcie bez lasu/Tartaku.

**Przykład:** Tartak (10 Drewna/t z ulepszenia) + las na obrabianym heksie (+4 Drewna z terenu) → magazyn **14**/turę (nie 10).

**Rzeka:** modyfikator „Rzeka" w `terrain-yields.json` daje **+2 glina (szt./turę)** na heksie z rzeką (`tileYield.maRzeke`); przy 👤/centrum trafia do magazynu jak inne plony terenu. Osobno: spawn złoża gliny przy rzece (generator) — to dostępność złoża, nie ten sam mechanizm.

---

## Wdrożenie

| Plik | Zmiana |
|------|--------|
| `gra/src/game/turn-economy.ts` | `computeWorkedMagazynYieldsByCity` (drewno+kamień+glina); `tickEmpireResourcePipeline` kredytuje worked + terrYield |
| `gra/src/game/economy.ts` | Komentarz `drewnoTerenu`/`kamienTerenu`/`glinaTerenu` — informacyjnie = ta sama suma co worked |
| `gra/src/ui/hexContextTooltip.ts` | Tooltip: plony terenu trafiają do magazynu przy 👤 |
| `gra/tools/hex-plony-magazyn-test.cjs` | Test: Równina bez ulepszeń; Tartak+las > sam Tartak |

---

## Ścieżka kodu

```
cityWorkedTilesForEconomy → tileYield (terrain-yields + nakładki + bonusy pól)
         ↓
computeWorkedMagazynYieldsByCity
         ↓
tickEmpireResourcePipeline (+ computeTerritoryResourceYieldByCity addytywnie)
         ↓
creditOwnerResourceStock (magazyn państwa)
```

---

## Cytat Macieja (doprecyzowanie 2026-07-29)

> Nawet bez lasu/gór w zasięgu i bez Tartaku/Kamieniołomu — ustawienie obywatela na heksie daje minimalną produkcję drewna i kamienia z plonów terenu.
