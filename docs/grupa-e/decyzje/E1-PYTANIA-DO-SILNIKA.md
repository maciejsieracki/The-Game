# E1 — pytania ABC do Macieja (gameplay)

> **Katalog roboczy:** `docs/grupa-e/decyzje/` · Indeks: [`E1-pytania-abc.md`](E1-pytania-abc.md)  
> **Status:** CZĘŚCIOWO — **Q9–Q12 = A / B* / A / A** ✅ · batch SILNIK **GOTOWE-do-wpiecia**  
> **Reguła:** decyzje gameplay **tylko ABC** (Maciej)

Decyzje zatwierdzone: [`E1-nowa-gra.md`](E1-nowa-gra.md)

---

## E1-Q9 — Reset stanu gracza przy „Nowa gra"

**[EKRAN: Menu]**

Po kliknięciu startu nowej gry — co robimy ze skarbcem, nauką i zbadanymi tech?

| | Opcja |
|---|--------|
| **A** | **Pełny reset** — skarbiec 0, nauka 0, pusta lista tech (jak dziś w kodzie `main.ts`) |
| **B** | **Bez resetu** — zostaje stan z poprzedniej sesji w tej samej przeglądarce |
| **C** | **Częściowy** — zeruj skarbiec i naukę, **zostaw** zbadane tech |

**Decyzja Macieja (2026-06-27): A** — pełny reset. Kontynuacja wyłącznie **Kontynuuj** / **Wczytaj**.

**Kod:** zgodny — bez zmiany w `doStartGame`.

---

## E1-Q10 — Start w epoce Brąz

**[EKRAN: Menu]**

Gracz wybiera **Epoka Brąz** — co dostaje na starcie?

| | Opcja |
|---|--------|
| **A** | Tylko **Epoka 2** na HUD — bez tech i budynków |
| **B** | Epoka 2 + **wszystkie tech epoki Kamień** zbadane |
| **C** | Epoka 2 + **krótki preset** tech (lista po wyborze C) |

**Decyzja Macieja (2026-06-27): B*** (reguła kaskadowa)**

| Start | Auto-zbadane tech |
|-------|-------------------|
| Kamień | — (pusta lista) |
| Brąz | wszystkie tech epoki **Kamień** (`tech.json` pole `Epoka`) |
| Żelazo | wszystkie tech **Kamień + Brąz** |

W wybranej epoce gracz **nadal bada od zera**. Jednostki/budynki — **tylko przez tech**, bez starter-packa. v1.0: tylko epoki z kreatora.

**Kod:** **TODO** — po ABC 3–4 batch SILNIK: funkcja `grantTechEpokWczesniejszych(epochId)` w `doStartGame`.

---

## E1-Q11 — Kształt mapy „Ziemia"

**[EKRAN: Menu]**

| | Opcja |
|---|--------|
| **A** | **Stały preset** — `ZIEMIA_LAND_CENTERS` (jak dziś) |
| **B** | **Miękki preset** — ten układ + więcej szumu brzegów |
| **C** | **Jak Kontynenty** — proceduralnie, etykieta „Ziemia" |

**Decyzja Macieja (2026-06-27): A** — stały preset, bez zmiany MAPA.

---

## E1-Q12 — Zakres wyboru liczby rywali

**[EKRAN: Menu]**

| | Opcja |
|---|--------|
| **A** | **Zalecana ±1** (`newGameMapDefaults.ts`) |
| **B** | **Szeroki** — 1 … (typy−1) |
| **C** | **Bez wyboru** — tylko zalecana liczba |

**Decyzja Macieja (2026-06-27): A** — wąski wybór ±1. Skala rosteru 9 typów → audyt **Grupa D** (`handoff/E1-do-GRUPA-D_cywilizacje-startowe.md`).

---

## → Master Silnik

1. **ABC 1–4 zamknięte** → batch F (SILNIK): tech epok wcześniejszych + weryfikacja 3/4  
2. **Grupa D** równolegle: cywilizacje startowe (roster 9, skala mapy)  
3. Bramka TEST równolegle OK
