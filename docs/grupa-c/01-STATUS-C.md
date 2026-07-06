# Status Grupy C — Walka (2026-06-27)

**Zakres czatu:** **C2 + C4** — od momentu wyboru **Auto** lub **Bitwa ręczna** na preBattle.  
**C1, C3, A2, A3** → **Grupa A** · `GRANICA-C-vs-MAPA.md`

---

## Decyzje Macieja (ten czat)

| ID | Status |
|----|--------|
| C2-Q2,Q3,Q4,Q6,Q7 | **ZAMKNIĘTE** |
| D5, D8, D10 | **ZAMKNIĘTE** |
| C4 balans (macierz w bitwie) | **OTWARTE** — C4-Q1 ABC |
| C1 / C2 / C3 | **W kanonie** — nie implementować ponownie |

**Nie pytaj tutaj:** C1-Q* (Grupa A) · C3-Q* (Grupa A)

---

## Kod (lane Walki)

| Element | Stan |
|---------|------|
| `battleScene.ts`, `battleMinimap.ts` | **GOTOWE** |
| F-C2 promocja do kanonu | **TODO** (Grupa F) |
| `preBattle.ts` | kod lane UI — **decyzje/wpięcie w Grupa A** |

---

## Otwarte u Grupy C

1. **Czekaj** bramka F + playtest ROBOCZA → **C2** (UX walki, bez deploy)
2. **C4-Q1** balans walki (ABC — pełny format) — **jedyna** aktywna paczka pytań
3. **NIE:** deployment w `battleScene`, C1 preBattle, C3, ruch mapy → Grupa A
4. Po playteście C2: raport `DO-MASTERA` § C (PASS/FAIL UX bitwy)
