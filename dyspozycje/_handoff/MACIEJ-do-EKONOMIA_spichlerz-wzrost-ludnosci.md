# MACIEJ → Grupa B (EKONOMIA): Spichlerz + wzrost + wojsko

**Flaga:** **GOTOWE-do-wpiecia (Grupa B 2026-06-29)** — kod w repo; Integrator po playteście Macieja.  
**Kanon:** `docs/decyzje/B5-spichlerz-wzrost-ludnosci.md`

---

## Co wdrożyć (AC)

### AC-1 — Bufor wzrostu (zawsze)

- [ ] Część żywności miasta (split imperium „Rozwój miast”) kumuluje się w buforze per miasto.
- [ ] Próg: `10 + pop × prog_wzrostu_wspolczynnik`.
- [ ] Przy `bufor ≥ próg` → +1 pop (z istniejącymi blokadami: Akwedukt, obleżenie).

### AC-2 — Bez Spichlerza

- [ ] Po wzroście: **bufor = 0**.
- [ ] Zapasy państwa: `+doPanstwa − kosztArmii` **bez kumulacji** — nadwyżka niezużyta przez wojsko **= 0** na koniec tury (nie przenosi się).
- [ ] **Brak** blokady rekrutacji wojska.

### AC-3 — Ze Spichlerzem

- [ ] Po wzroście: **bufor = floor(bufor × spichlerz_zachowanie_po_wzroscie)** (domyślnie 50%).
- [ ] Zapasy państwa: kumulacja między turami (obecny model `empire-food.ts`, gałąź aktywna tylko gdy miasto ma Spichlerz **lub** imperium ma ≥1 Spichlerz — do ustalenia w implementacji: proponuj **≥1 Spichlerz w imperium gracza** włącza kumulację zapasów).

### AC-4 — UI (Grupa B, `cityPanel.ts`)

- [ ] Etykieta **Spichlerz**, nie „magazyn”.
- [ ] Usunąć tekst „Bez Spichlerza nadwyżka nie jest magazynowana”.
- [ ] Pasek bufora / próg / ETA zgodnie z kanonem.

### AC-5 — Testy

- [ ] `tools/logic-test.cjs` lub dedykowany: wzrost 1→2 bez Spichlerza (zerowanie); ze Spichlerzem (50%); zapasy państwa kumulacja ON/OFF.

---

## Pliki (Grupa B)

| Plik | Zmiana |
|------|--------|
| `gra/src/game/economy.ts` | `populationGrowth` — gałąź bez Spichlerza z wzrostem + zerowaniem |
| `gra/src/game/empire-food.ts` | Kumulacja zapasów tylko ze Spichlerzem w imperium |
| `gra/src/game/turn-economy.ts` | `maSpichlerz` z budynków, nie `false` |
| `gra/src/ui/cityPanel.ts` | Teksty, sekcja Spichlerz |

**Integrator:** wpina po `→ SILNIK: GOTOWE` + bramka testów.

---

## Nie zmieniać w tym batchu

- Wealth, podział pracy, podział handlu (osobne handoffy).
