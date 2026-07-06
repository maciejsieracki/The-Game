# A5 — Wygląd miast na mapie świata

| Pole | Wartość |
|------|---------|
| **ID** | A5 |
| **Ekran** | Mapa świata |
| **Lane** | MAPA (render), CYWILIZACJE (roster typów) |
| **Status** | **ZAMKNIĘTE (Maciej)** — **A5-Q1=custom**, **A5-Q2=A** 2026-06-27 |
| **Powiązane** | D12=A (epoka brązu — pierwsza implementacja) |

---

## Decyzja Macieja (A5-Q1)

**Opcja B (poprawki / rozszerzenie przed v1.0)** — z pełną specyfikacją:

> Dla **każdej cywilizacji** w grze: **10 poziomów rozwoju** miasta na mapie.  
> Każdy poziom: wariant **z murem** i **bez muru** (`withWalls`).

**Nie wystarczy** obecny podgląd 4 modeli brązu — trzeba **dopracować wyglądy pozostałych cywilizacji** wg tego schematu.

---

## Model wizualny (kanon)

```
Miasto na mapie = f(cywilizacja, poziom 1..10, maMur: boolean)
```

| Wymiar | Zakres |
|--------|--------|
| **Cywilizacja** | Wszystkie typy z rosteru gry (obecnie 10 w `bronzeCity.ts`: grecja, rzym, sumer, egipt, inka, aztek, chiny, zulu, celtowie, germanie — **zsynchronizować z `civs.json`**) |
| **Poziom rozwoju** | **1–10** (wielkość / gęstość zabudowy, świątynia centrum) |
| **Mur** | **TAK/NIE** — niezależnie od poziomu; po budynku „Mury" (`city.maMur`) |

**Kod referencyjny:** `gra/src/render/bronzeCity.ts` — `buildBronzeCity(civ, level, ownerColor, withWalls)`.

---

## Decyzja Macieja (A5-Q2) — 2026-06-27

**A5-Q2=A:** poziom wizualny **1–10** zależy głównie od **populacji miasta** (progi do tabeli z Grupą B).

---

| Sygnał w grze | Wizual |
|---------------|--------|
| **Populacja miasta** (**A5-Q2=A**) | poziom 1..10 — progi od Grupy B / handoff MAPA↔EKONOMIA |
| `city.maMur === true` | wariant **z murem** |
| brak murów | wariant **bez muru** |
| Typ cywilizacji właściciela | styl architektury (per civ) |

Handoff MAPA → EKONOMIA: tabela progów populacji → poziom 1..10 (jeśli brak).

---

## Stan vs cel (2026-06-29 — audit MAP-S1)

| Element | Stan |
|---------|------|
| API `buildBronzeCity` level 1..10 + withWalls | ✅ parametryczne (hutCount[], tScale, mury per civ) |
| 10 typów architektury (BRONZE_CIVS) | ✅ odróżnialne świątynie + domy |
| `cities.ts` wpięcie level + maMur | ✅ |
| Podgląd HTML grid 10×10×2 | ✅ `bronzepreview/?pack=full` (MAP-S1) |
| Sign-off Macieja | ✅ **A5-S1=A** 2026-07-01 |
| Kamień (`stoneCity.ts`) per cyw | **A5-S2=A** — jeden wspólny styl v1.0 |

**Audit 2026-06-29:** Meshe nie są 200 osobnymi assetami — poziom L skaluje liczbę domów i świątynię; **spełnia A5-Q2=A** (populacja→poziom). DoD MAP-S1 = podgląd + sign-off, nie przeróbka API.

---

## DoD (lane MAPA)

- [ ] Wszystkie cywilizacje gry mają rozpoznawalny styl (min. epoka startowa / brąz)
- [ ] Poziomy 1–10 wizualnie czytelne (rośnie złożoność / liczba domów)
- [ ] Wariant z murem vs bez — wyraźna różnica (palisada/kamień wg civ)
- [ ] Podgląd: rozszerzyć `Gra-podglad-MIASTA-BRAZU.html` (lub bronzepreview) — grid civ × level × mur
- [ ] Handoff do SILNIK: wybór wariantu z `maMur` + poziom

**Handoff:** `dyspozycje/_handoff/A5-do-MAPA_miasta-10poziomow-mury.md`

---

*Decyzja: Maciej, Grupa A, 2026-06-27*
