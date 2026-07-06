# B1 / #4 — Okolica miasta: pola pracy

| Pole | Wartość |
|------|---------|
| **ID** | B1.4 / Grupa B **#4** |
| **Decyzja Macieja** | **4C** + doprecyzowanie (2026-06-27) |
| **Status** | **ZAMKNIĘTE** — **pełna implementacja v1.0** |
| **Ekran** | Panel miasta → sekcja **Okolica** |

---

## Ustalenie Macieja

1. **Auto domyślnie** — silnik przypisuje pola co turę (jak dziś `assignWorkedTiles`).
2. Gracz wybiera **profil skupienia**; od tego zależy, co AI uważa za „najlepsze” pole:
   - **Żywność** — priorytet pól z 🌾
   - **Produkcja** — priorytet pól z 🔨 (Praca)
   - **Podatki** — priorytet pól z 💰 (Handel / dochód pieniężny)
   - **Zrównoważone** — równe wagi (domyślny start)
3. **Ręczna korekta** — gracz może **dodawać i odejmować** ludność (👤) na **poszczególnych heksach**; suma 👤 na polach = populacja (centrum miasta zawsze aktywne).
4. Przycisk **„Przywróć auto”** — wraca do przypisania wg aktualnego profilu.
5. **Wszystko w v1.0** — auto + profile + ręczna korekta + UI + save/load (nie odłożone).

Powiązanie z **auto-zarządcą ⚙** (B3): gdy ⚙ ON, co turę stosuje profil skupienia do pól (o ile miasto nie jest w trybie ręcznym z zapisanymi przypisaniami).

---

## Silnik — profile skupienia

Wagi do `tileScore()` w `okolica.ts` (`AssignOptions.wagi`):

| Profil | `zywnosc` | `praca` | `handel` | UI (PL) |
|--------|-----------|---------|----------|---------|
| **zrownowazone** | 1 | 1 | 1 | Zrównoważone |
| **zywnosc** | 3 | 0,5 | 0,5 | Żywność |
| **produkcja** | 0,5 | 3 | 0,5 | Produkcja |
| **podatki** | 0,5 | 0,5 | 3 | Podatki |

*Liczb startowych — tuning w Excel (`miasto-params.json` → `okolica_wagi_*`).*

```typescript
type OkolicaFocus = 'zrownowazone' | 'zywnosc' | 'produkcja' | 'podatki';
type OkolicaTryb = 'auto' | 'reczny';

// Per miasto (City):
okolicaFocus?: OkolicaFocus;      // default: zrownowazone
okolicaTryb?: OkolicaTryb;        // default: auto
okolicaReczne?: Record<string, number>; // "q,r" -> liczba 👤 (0..1 typowo; suma = pop)
```

**Auto:** `assignWorkedTiles(..., { wagi: wagiForFocus(focus) })`.

**Ręczny:** silnik bierze `okolicaReczne` zamiast auto-rankingu; walidacja: suma = `population`, heks w zasięgu `cityRangeForPopulation(pop)`.

---

## UI — sekcja Okolica

```
[ Żywność ] [ Produkcja ] [ Podatki ] [ Zrównoważone ]   ← profile (radio)

┌ mini-mapa heksów ─────────────────────────┐
│  heks: +2🌾 +1🔨   [−] 👤1 [+]            │
│  podświetlenie obrabianych pól             │
└────────────────────────────────────────────┘

[ Dostosuj pola ]  /  [ Przywróć auto ]

Pod każdym heksem: plony z tego pola × liczba 👤
```

- **Dostosuj pola** → `okolicaTryb = reczny`; klik +/- na heksie.
- **Przywróć auto** → `okolicaTryb = auto`; natychmiast przeliczenie z profilem.
- Podgląd **musi = ekonomia tury** (`cityWorkedTilesForEconomy` czyta ten sam stan).

Mockup: odświeżyć `UI/Gra-podglad-MIASTO.html`.

---

## Zasięg i reguły (bez zmian)

- Zasięg: `cityRangeForPopulation(pop) = min(pop, 15)`.
- Centrum miasta **zawsze** daje plony bazowe.
- N obywateli na N polach okolicy (1 👤 = 1 slot na heks, klasyczny Civ).
- Obleżenie: pola nie dają 🌾 (istniejąca reguła).

---

## Lane i pliki

| Lane | Zadanie |
|------|---------|
| EKONOMIA | pola na `City`, `wagiForFocus`, `resolveWorkedTiles(city, map)`, sync `cityWorkedTilesForEconomy` |
| EKONOMIA | `autoManageCity` — przekazać `focus` do `assignWorkedTiles` |
| UI | profile, +/- 👤, tryb auto/reczny, plony per heks |
| SILNIK | save/load, haki `getWorkedTiles`, `setOkolicaAssignment` |
| MAPA | opcjonalnie podświetlenie pól na mapie świata (P1) |

Handoff: `dyspozycje/_handoff/EKONOMIA-do-UI_okolica-pola-C.md`

---

## DoD v1.0

- [ ] 4 profile skupienia działają w auto
- [ ] Ręczne +/- 👤 z limitem populacji
- [ ] Przywróć auto
- [ ] Panel bilans = plony z tur (`cityWorkedTilesForEconomy`)
- [ ] Save/load przypisań
- [ ] Testy: `okolica-test.cjs` + scenariusze focus/reczny

---

## Historia

| Data | Zdarzenie |
|------|-----------|
| 2026-06-27 | Maciej **4C** + profile + ręczna korekta + pełne v1.0 |
