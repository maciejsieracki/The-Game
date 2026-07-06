# D-MAPA-DELTA — Ujście rzeki / delta przy wybrzeżu

> **Status:** 🟢 **ZAMKNIĘTE** · Maciej **2026-07-03**  
> **Kontekst:** rzeka urywa się przy brzegu; brak naturalnego wpływu w jasnoniebieskie Wybrzeże

---

## Pytanie

Jak rzeka ma **wpływać w morze** przy heksach Wybrzeże?

---

## Opcje

| ID | Opis |
|----|------|
| **A** | **Delta** — u ujścia rzeka **rozszerza się** (fan / 2–3 heksy jaśniejszej wody), wpływa w jasnoniebieskie Wybrzeże |
| **B** | **Kanał** — wąski ciągły strumień do morza, bez rozszerzenia |
| **C** | **Odłożone** — zostawiamy jak dziś, delta w v1.1 |

---

## Decyzja Macieja

**A — Delta**

---

## Implikacje dla lane MAPA

1. U ujścia: rozszerzenie wstęgi rzeki (fan) na heksach Wybrzeże sąsiadujących z `riverPaths` końcówką.
2. Kolor / poziom wody: spójny z jasnoniebieską tafą wybrzeża (`#82c8e0` / `TERRAIN_ROBLOX[Wybrzeże]`).
3. Piasek przy ujściu: zgodnie z **D-MAPA-BRZEg=C** — delta **zastępuje** wąski pas piasku u ujścia (nie blokuje wpływu).
4. **DoD:** screenshot z nowej gry — widać rozszerzenie rzeki w wybrzeże.

**Handoff:** `dyspozycje/_handoff/MASTER-do-MAPA_brzeg-hybrid-C.md` (sekcja delta)

**Powiązane:** `docs/decyzje/D-MAPA-BRZEg.md` (C)
