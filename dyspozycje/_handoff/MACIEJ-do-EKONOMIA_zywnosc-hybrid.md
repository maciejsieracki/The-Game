# HANDOFF: Maciej → EKONOMIA — model hybrydowy żywności (miasto + zapasy państwa + wojsko)

**Data:** 2026-06-26 · **Decyzja:** HUD mapa pytanie 1 (custom) · **Status:** SPEC GOTOWY (2026-06-26) · tick lane w kolejce · **MASTER nie wpina main.ts**

---

## Co ustalił Maciej

1. **Miasto** — dotychczasowy model: magazyn żywności miasta, wzrost populacji, pola (bez zmiany intencji).
2. **Imperium** — nowa warstwa: **zapasy państwa na wojsko** (`zapasyPanstwa` lub nazwa kanoniczna w kodzie).
3. **Suwak podziału żywności** (nowy, obok istniejących suwaków miasta/imperium):
   - część strumienia żywności → **rozwój miasta** (wzrost / magazyn lokalny),
   - część → **zapasy państwa** (utrzymanie armii).
4. **Konsumpcja wojska:** więcej jednostek = większe zużycie zapasów państwa co turę.
5. **Cap zapasów państwa:** **brak limitu góry na v1.0** (akumulacja w nieskończoność).
6. **Głód:** gdy zapasy państwa **< 0** → każda jednostka gracza (owner) traci **8% max HP** co turę, aż do zniszczenia.
7. **UI:** żywność w **panelu miasta** (suwak + magazyn) **oraz** na **HUD mapy** — minimum: stan zapasów państwa + alert głodu.

---

## Propozycja przepływu (EKONOMIA — do doprecyzowania w spec)

```
Co turę per owner:
  1. Zbierz yield żywności ze wszystkich miast (istniejąca logika pól/miast).
  2. Zastosuj suwak podziału: %Rozwój / %ZapasyPaństwa (suma = 100%).
  3. Część „Rozwój” → istniejący magazyn/wzrost per miasto (proporcjonalnie lub per miasto — EKONOMIA decyduje technicznie).
  4. Część „ZapasyPaństwa” → dodaj do zapasyPanstwa[ownerId].
  5. Odejmij koszt żywności armii: count(jednostki) × kosztPerJednostka (parametr econ-params).
  6. Jeśli zapasyPanstwa < 0 → flaga glodWojska=true dla UNITS (atrition 8%/turę).
```

---

## Kontrakty cross-lane

### → UNITS
- `isArmyStarving(ownerId): boolean` lub odczyt flagi z turn tick.
- Atrycja: **−8% maxHP** na jednostkę co turę gdy głód (identyczna stawka jak oblężenie garnizonu — reuse pattern jeśli możliwe).

### → UI
- HUD mapy: `getEmpireFoodReserve(): number`, `isArmyStarving(): boolean`.
- Panel miasta: suwak `% żywność → rozwój vs zapasy państwa` (global per gracz vs per miasto — **domyślnie global per owner**, chyba że Maciej powie inaczej).

### → MASTER (wpięcie)
- Stan `zapasyPanstwa` w save/load.
- Wywołanie tick głodu po `advanceCityEconomy` / w turn loop.

---

## DoD (lane EKONOMIA)

- [ ] Spec 1 strona w `EKONOMIA-DO-MASTERA.md` + parametry w `econ-params.json` (koszt/jednostka, domyślny suwak).
- [ ] Kod: `turn-economy.ts` + ewent. `upkeep.ts` — bez main.ts.
- [ ] Test: `tools/` — scenariusz 3 jednostki, ujemne zapasy, spadek HP.
- [ ] Handoff UI: `_handoff/EKONOMIA-do-UI_zywnosc-hud.md`.

---

## Otwarte (nie blokuje startu spec)

- Czy suwak **globalny** (całe imperium) czy **per miasto** — Maciej mówił o suwaku podziału; rekomendacja: **global per gracz** (jak % nauka/skarbiec), doprecyzować w spec.
- Cap magazynu państwa w przyszłości (silosy?) — **nie na v1.0**.
