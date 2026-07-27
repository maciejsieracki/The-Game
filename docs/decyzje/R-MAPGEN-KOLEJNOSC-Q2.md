# R-MAPGEN-KOLEJNOSC-Q2 — Docelowa górzystość lądu (tier Średni relief)

**Status:** 🔵 **KOD GOTOWY** — ⏸ deploy czeka **FALA 37** (w roboczej `a74c3797` jeszcze stara wersja)  
**Grupa:** A (mapa świata / generator)  
**Ekran:** [TEMAT: Generator mapy — procent Gór i Wzgórz na lądzie]

## Status wdrożenia (dla innych agentów)

| Etap | Stan |
|------|------|
| **Sesja** | 🔧 **Czat ABC** — kod gotowy w `gra/src`; **nie** publishuj `gra-robocza/` |
| **Kod `gra/src`** | ✅ **GOTOWY** — `map-gen-params.json` · fair-play 8/8 |
| **Deploy `gra-robocza`** | ⏸ **czeka FALA 37** — poza FALA 36 |
| **Indeks** | `STATUS-WDROZEN-AGENT-2026-07-27.md` |

## Sytuacja

Rejestr decyzji podawał górzystość **19–20%** lądu (decyzja historyczna 80A). Kod po C-MAPA-Q2=B generował ok. **10%** lądu jako Góry/Wzgórza przy tierze Średni relief. Testy fair-play były zielone przy ~10%. Wyższa górzystość (19%) kolidowała z limitem Gór/Wzgórz w komórce siatki 25×25 hex (fair-play padał — zbyt gęste skupiska).

## Cel pytania

Ustalić jedną docelową górzystość lądu (udział heksów Góry + Wzgórza) na tier Średni relief i zsynchronizować rejestr z kodem.

## Dlaczego teraz

19% w REJESTRZE koliduje z limitem komórki 25×25 i z aktualnym kodem — kolejne sesje mogą „naprawiać" coś, co jest już zamierzone. Bez decyzji Q2 nie domykamy paczki R-MAPGEN.

## Opcja A — ~10% (C-MAPA-Q2=B); REJESTR aktualizowany

Opis: Przyjąć ~10% górzystości lądu jako kanon; zaktualizować REJESTR i dokumentację mapy; kod bez zmian.

**Za:** Testy fair-play zielone przy tej wartości · spójne z aktualnym kodem i C-MAPA-Q2=B · respektuje limit Gór/Wzgórz per komórka 25×25 · zero ryzyka regresji generatora.

**Przeciw:** Mniej gór niż wizja z 80A (~19%) — mapa płatsza wizualnie · gracze oczekujący „górzystego świata" mogą odczuć różnicę · wymaga korekty dokumentacji historycznej.

## Opcja B — ~19% (80A); łagodzenie fair-play

Opis: Wrócić do ~19% górzystości; poluzować progi testów fair-play (więcej Gór/Wzgórz dozwolone w komórce).

**Za:** Bardziej górzysty, dramatyczny świat zgodny z wcześniejszą wizją 80A · więcej heksów obronnych i złoży w górach · bliżej „średniego reliefu" w nazwie tieru.

**Przeciw:** Historia failów fair-play przy wysokiej górzystości · ryzyko nieczytelnych skupisk Gór w jednej komórce · wymaga ponownej kalibracji generatora i testów regresji.

## Opcja C — Kompromis ~15%

Opis: Ustawić docelowo ~15% górzystości; dostroić generator i progi fair-play między 10% a 19%.

**Za:** Pośrednia wizualna górzystość — kompromis między płaskością a dramatem · może przejść fair-play przy łagodniejszych progach niż przy 19%.

**Przeciw:** Trzecia kalibracja — kolejna runda strojenia generatora · brak jednoznacznego uzasadnienia (ani testy, ani 80A) · ryzyko „nigdzie" — za dużo gór na fair-play, za mało na wizję.

## Rekomendacja

**Litera:** A — kod i testy już wspierają ~10%; to najbezpieczniejszy kanon bez ponownego otwierania generatora.

## Odpowiedź Macieja

> **C** — kompromis ~15% górzystości lądu (tier Średni relief)

## Wdrożenie (2026-07-27)

**Parametry medium (Panel-A `map-gen-params.json`):**
- `relief_land_fraction`: Góry **7,5%** + Wzgórza **12,5%** lądu (budżet zasiewu)
- `relief_overflow_cap_frac`: Góry **5%** + Wzgórza **8,5%** per komórka fair-play (sufit ≈15%)

**Kod:**
- `gra/src/map/gen-helpers.ts` — `FALLBACK_RELIEF_FRAC`, `REAPPLY_RELIEF_BUDGET_FRAC` (0,15), bonus capy
- `gra/src/data/map-gen-params-loader.ts` — fallback overflow cap
- `gra/tools/fair-play-grid-test.cjs` — progi z `mapGenReliefOverflowCapFrac` (sync z JSON)

**Zmierzona górzystość (5 seedów, Standard kontynenty, relief medium):** średnia **15,65%** (zakres 14,72–16,23%).

**Testy:** fair-play **8/8** · relief-grid **6/6** · map-gen-regression **PASS** · tsc **0**

**Warstwa:** 🟡 (generator + JSON Panel-A)
