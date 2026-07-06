# F — Hex miasta: czysty teren po założeniu (decyzja Macieja)

| Pole | Wartość |
|------|---------|
| **ID** | F-CITY-HEX |
| **Decydent** | Maciej |
| **Data** | 2026-06-29 |
| **Status** | **ZAMKNIĘTE** |

---

## Problem

Po założeniu miasta na heksie z lasem, surowcem lub ulepszeniem — dekoracja 3D (drzewo, krowa, farma…) **nadal widać** pod/w środku miasta. Wygląda źle.

---

## Decyzja Macieja (2026-06-29)

**= Opcja A (prostsza):** po założeniu miasta hex centrum jest **wizualnie i logicznie „czysty”**.

| Warstwa | Po założeniu miasta na hexie |
|---------|------------------------------|
| **`terenBazowy`** | **Zostaje** (np. Równina, Łąka) |
| **`nakladka`** | → `Brak` (las, rzeka jako nakładka, surowce…) |
| **`ulepszenie` / mesh ulepszenia** | → `Brak` + usunięcie mesha |
| **`zloze`** | → usunięte z hexu |
| **Bonusy gameplay** | **Zostają w ekonomii miasta** — np. krowa nadal daje bonus jak pole centrum, ale **nie widać** krowy |

**Odrzucone (na v1):** render surowca/ulepszenia **pod** modelem miasta (opcja B).

---

## Implementacja (podział lane)

1. **EKONOMIA** — snapshot plonów centrum **przed** wyczyszczeniem hexu (`City.centerTile` lub równoważne); `cityWorkedTilesForEconomy` czyta snapshot dla centrum, nie surowy hex.
2. **MAPA** — przy rerenderze: **pomiń** dekoracje lasu/surowca/ulepszenia na hexach z miastem (belt-and-suspenders).
3. **SILNIK** — wywołanie przy: gracz `tryFoundPlayerCityAt`, AI `foundCity`, start cluster / `foundCityAt` przy starcie; `rebuildResourceOverlays` + refresh lasów jeśli potrzeba.

Handoffy: `dyspozycje/_handoff/MASTER-do-{EKONOMIA,SILNIK,MAPA}_F-city-hex-czysty.md`

---

*Maciej, 2026-06-29*
