# E2 — Gęstość świata w kreatorze (decyzja operacyjna MASTER)

| Pole | Wartość |
|------|---------|
| **ID** | E2-WORLD-DENSITY |
| **Ekran** | Kreator → krok 4 + zaawansowane |
| **Decydent** | Maciej (intencja 2026-06-29) — **wykonanie bez kolejnego ABC** (delegacja: „nie będę się tym zajmować”) |
| **Data** | 2026-06-29 |
| **Status** | **DECYZJE MACIEJA 2026-06-28** — paczka E2-Q2…Q5 (formularz + dopiski) → MAPA + UI + SILNIK |

---

## Decyzje Macieja — paczka E2-Q2…Q5 (2026-06-28)

| ID | Werdykt | Treść decyzji (operacyjnie) |
|----|---------|-----------------------------|
| **E2-Q2** | **A** | Suwak surowców **TAK** — Mało/Normalnie/Dużo, mnożniki MAPA **0,6× / 1,0× / 1,4×** (`resourceRarityMult`) **bez zmiany zakresu suwaka**. **Korekta Maciej 2026-06-28:** nie 0,5/1/2 — **zostaw suwak jak MAPA**; na mapie ma być **po prostu więcej złóż** niż dziś → MAPA **podnosi bazę** `rarity` w `placeDeposits` (Normalnie bogatsze od obecnego domyślnego generatora). Reguły `DEPOSIT_RULES.allowedOn` bez zmian. |
| **E2-Q3** | **A\*** | Suwak rzek **TAK**. Baza **2 / 5 / 8** (Mało/Normalnie/Dużo) dotyczy **najmniejszej mapy**; na większych mapach liczba rzek **skaluje się proporcjonalnie** (2 rzeki na małej ≠ 2 na ogromnej). Rzeki = priorytet balansu. |
| **E2-Q4** | **A\*** | **Oba** suwaki (las logiczny + pustynia), **osobno**. Efekt **bardziej drastyczny** niż progi szumu MAPA → mnożniki **0,5 / 1,0 / 2,0** dla lasu **i** pustyni (MAPA: przeliczyć progi lub mult na te wartości). |
| **E2-Q5** | **A\*** | Układ: główna siatka jak dziś (typy cywilizacji + podstawowe); zaawansowane: **4 suwaki gęstości**. **Zmiana:** zamiast suwaka **Jakość mapy** w zaawansowanych → **ilość miast-państw** (historyczna nazwa: Sparta, poleis — to **miasta**, nie osobne państwa). Reguły przydziału **już ustalone** → UI + MAPA/cluster-start. Jakość mapy (E1 bundle): przenieść poza ten wiersz (ustawienia globalne / domyślna Średnia) — doprecyzuje UI przy implementacji. |

**E2-Q1 (wcześniej):** **B** — suwak **Typy cywilizacji** na głównej siatce ±1 od rozmiaru mapy.

---

## Intencja Macieja (skrót)

1. **Główna siatka krok 4:** zamiast „Jakość mapy” → **ile typów cywilizacji / miast-kopii** na mapie (skala z rozmiarem, ±1).
2. **Zaawansowane:** **Jakość mapy** (E1 bundle) + **gęstość:** surowce, rzeki, pustynie, las — każdy **Mało / Normalnie / Dużo**.
3. **Nazewnictwo:** **miasta / typy cywilizacji** — **nie** „państwa” (kanon D-START: kopie typu, nie 50 nacji).
4. **Reguły placement:** krowy nie na górach itd. — **bez zmian** (`DEPOSIT_RULES.allowedOn`).

---

## Kanon produktowy (MASTER provisional)

| UI (PL) | Klucz | Wartości | Domyślne |
|---------|-------|----------|----------|
| Typy cywilizacji | `civ_types_count` | liczba (dynamiczna ±1 od mapy) | `aktywneTypyFromMapLabel` |
| Jakość mapy | `map_quality` | Niska/Średnia/Wysoka | Średnia (zaawansowane) |
| Surowce | `resources_density` | Mało/Normalnie/Dużo | Normalnie |
| Rzeki | `rivers_density` | Mało/Normalnie/Dużo | Normalnie |
| Pustynie | `desert_density` | Mało/Normalnie/Dużo | Normalnie |
| Las (logiczny) | `forest_density` | Mało/Normalnie/Dużo | Normalnie |

**Mnożniki (Maciej 2026-06-28):**
- **Surowce:** suwak **0,6× / 1,0× / 1,4×** + **wyższa baza rarity** (więcej złóż przy Normalnie niż dziś w generatorze).
- **Las + pustynia:** **0,5× / 1,0× / 2,0×** (drastyczniejsze niż propozycja progów MAPA).
- **Rzeki:** baza **2/5/8** na **Małej** mapie, potem skala proporcjonalna z rozmiarem mapy.

---

## Podział lane

| Lane | Deliverable |
|------|-------------|
| **UI (E)** | Kreator: layout, `NewGameParams`, `ui-params.json`, self-test Grupa E |
| **MAPA** | `generujSwiat(..., opts)`, `placeDeposits` mnożniki, rzeki/las/pustynia, testy |
| **SILNIK** | Wpięcie `params` → generator + `cluster-spawn` (`civTypesCount`) |
| **CYW** | Weryfikacja spawn klastrów po zmianie `aktywneTypy` (tylko jeśli regresja) |

Handoff hub: `dyspozycje/_handoff/MASTER-PLAN-E2-gestosc-swiat.md`  
MAPA ABC: `docs/decyzje/E2-gestosc-swiata-MAPA-ODPOWIEDZ-ABC.md` (**Q1=B** Typy cywilizacji ±1)

---

*MASTER 2026-06-29*
