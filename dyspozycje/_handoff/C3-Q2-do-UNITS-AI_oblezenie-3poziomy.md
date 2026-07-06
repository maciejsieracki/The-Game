# Handoff: C3-Q2 → UNITS / AI — oblężenie AI (3 poziomy)

**Status:** **GOTOWE** (decyzja Macieja) · **CZEKA** implementacja po domknięciu C3-Q3…Q10  
**Nadawca:** Grupa A (Maciej) · **Odbiorca:** UNITS + AI (CYWILIZACJE)

---

## Co przesyłam

Decyzja **C3-Q2=custom** — AI przy wrogim mieście z murem **nie** ma jednego trybu; wybór zależy od **siły armii oblężającej**:

| Tier | Warunek (propozycja implementacji) | Akcja AI |
|------|-----------------------------------|----------|
| **T1 — bardzo silna** | Siła armii ≥ **~180%** garnizonu + milicja (do strojenia) | **Szturm natychmiast** → preBattle |
| **T2 — średnia** | Między T1 a T3 | **Oblężaj** → buduj machiny (Taran/Wieża) → **szturm gdy ≥1 machina** lub po N turach |
| **T3 — słaba, ale bezpieczna** | Siła wystarczająca, by **nie** paść od kontrataku (np. ≥110% obrońcy), ale < T2 | **Tylko głodzenie** — bez szturmu, dopóki zapasy/atrition nie kończą oblężenia |

Maciej (dosłownie): bardzo mocna → szturm od razu; średnia → blokada + maszyny + atak następnej tury; słaba ale na kontratak → głodzi jak najdłużej.

**Spójność:** C3-Q1=A (gracz wybiera Oblężaj); AI T2/T3 używa gałęzi oblężenia bez preBattle.

---

## Co Odbiorca ma z tym zrobić

1. Funkcja `evaluateSiegeAiAction(army, city, siegeState): 'assault' | 'siege_build' | 'siege_starve'`
2. Progi T1/T2/T3 — **parametry w JSON** (`ai-params.json` lub `siege.ts` constants) do balansu bez zmiany `main.ts` logiki UI
3. T2: machiny zgodnie z **C3-Q8=C** (tempo ∝ wielkość armii)
4. Testy: 3 scenariusze w `tools/siege-test.cjs` lub rozszerzenie combat-test

---

## DoD

- [ ] AI T1 szturmuje przy silnej przewadze (test deterministyczny)
- [ ] AI T2 oblega + buduje ≥1 machinę przed szturmem
- [ ] AI T3 nie woła preBattle dopóki kapitulacja z głodu/attrition możliwa
- [ ] Brak regresji C3-Q1=A (gracz nadal wybiera ręcznie)

---

**Flaga:** GOTOWE (spec) · implementacja po C3-Q3…Q10
