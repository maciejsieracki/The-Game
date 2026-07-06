# EKONOMIA → Grupa E (start meta) — zasięg + mgła przy starcie gry

| Pole | Wartość |
|------|---------|
| **Status** | **→ Grupa E: CZEKA** |
| **Decyzja Macieja** | Spec 2026-06-27 — `docs/decyzje/B-zasieg-miasta-fog.md` |
| **Powiązane** | A-START-01…05 (implementacja mapy = Grupa A); E = kontrakt meta + handoff F |

---

## Kontekst dla kreatora / `doStartGame`

1. **Start bez jednostek** — model zamknięty (E1, A-START).
2. **Cała mapa czarna** dopóki gracz nie ma miasta / jednostki (`seedStartingFog` — explored puste).
3. **Przed założeniem miasta:** tymczasowy widok **5 heksów** wokół **preferowanego hexu startu** (`START_REVEAL_RADIUS = 5` w `startScoring.ts`) — żeby gracz wybrał miejsce pod 🔨 „Załóż miasto”.
4. **Po założeniu pierwszego miasta (pop = 1):** widok = **5 heksów** od centrum miasta (minimum zasięgu okolicy) — **ten sam promień** co pre-city, płynne przejście.
5. **Wzrost miasta:** widok rośnie **1:1 z pop** (pop 9 → radius 9, cap 15) + kultura +0…+3.

Maciej: *„miasto startuje od pięciu zasięgów i rośnie o jeden co każdy kolejny krok”*.

---

## Co ma zrobić Grupa E

| # | Zadanie | Plik / output |
|---|---------|----------------|
| 1 | Uzupełnić **kontrakt startu** w `docs/grupa-e/implementacja/kontrakt-kreator.md` (sekcja fog + zasięg) | docs |
| 2 | W handoff F (`E-do-SILNIK_wpiecie-grywalne.md` §3): dopisać sekwencję `seedStartingFog` → `playerStartHex` → `beginOnboardingFoundCity` → po `foundCityAt` → `refreshFog` | handoff |
| 3 | **Nie** zmieniać `START_REVEAL_RADIUS` (już **5** — zgodne z min zasięgiem miasta) | — |
| 4 | W `E1-nowa-gra.md` / FAQ playtestu: jedna linia dla Macieja — „pierwsze miasto widzi 5 pól, rośnie z ludnością” | docs |
| 5 | Po A-START fix: playtest ścieżki Menu → krok 5 → mapa → ghost miasto → załóż → sprawdź krąg 5 | checklist |

---

## Sekwencja (dla F — E uzupełnia w handoff)

```
doStartGame(params)
  → generujSwiat / generateMap
  → pickPlayerStartHex()          // startScoring.ts
  → seedStartingFog()             // explored = ∅
  → stripPlayerUnits…             // 0 jednostek
  → beginOnboardingFoundCity()    // build mode + ghost
  → refreshFog()
       // visible = computeVisibleAt(startHex, START_REVEAL_RADIUS=5)

foundCityAt(q,r,…)
  → refreshFog()
       // visible = computeVisibleAt(city, max(5, pop)) + kultura (0 na start)
```

---

## Nie w scope E

- Implementacja `currentVisible()` — **Grupa F** (`main.ts`)
- Render minimapy / rzeki w fog — **Grupa A**
- Fix `cityRangeForPopulation` — **EKONOMIA** (micro-batch)

---

## DoD Grupa E

- [ ] Kontrakt kreatora zaktualizowany (fog + r=5)
- [ ] Handoff F §3 uzupełniony
- [ ] Wpis w `DO-MASTERA.md` § E
- [ ] **→ SILNIK: GOTOWE** dopiero razem z A (F wpina oba)

**Flaga:** **→ Grupa E: CZEKA** (dokumentacja + kontrakt; kod F/A)
