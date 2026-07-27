# MAPA — kanon generatora i brzegu (gameplay)

**Hasło Macieja:** `reguły mapa` (≠ `reguły` = obieg operacyjny)

**Fair play (nadrzędnie):** [`docs/obieg/MAPA-FAIR-PLAY-SIATKA.md`](MAPA-FAIR-PLAY-SIATKA.md) — równomierność rzek, reliefu, złóż, lasu.

**Status wdrożenia:** 2026-07-04 · kod: `gra/src/map/gen-helpers.ts`, `generator.ts`, `gra/src/render/scene.ts`

---

## Brzeg mapy

- Minimum **10 heksów oceanu** od każdej krawędzi siatki
- Twardy pass: `enforceMapBorderOcean`
- Fade maski: +4 heksy za buforem

## Rozmieszczenie lądu

- **Domyślnie 20% lądu / 80% morza** (wszystkie typy: Kontynenty, Pangea, Wyspy, Ziemia)
- Gracz nadpisuje w **ustawieniach zaawansowanych** (suwak 20–80% lądu)
- **Kontynenty:** dokładnie **5 stref** — środek mapy + 4 narożniki (Voronoi, cieśniny między strefami); bufor oceanu od krawędzi bez zmian
- Od geometrycznego **środka** (tylko strefa 0), narożniki — własne ćwiartki
- Balans % lądu: preferuj środek; nadwyżka z brzegów i peryferii

## Rzeki

**Pełna spec (źródło prawdy):** [`docs/obieg/MAPA-RZEKI-SPEC.md`](MAPA-RZEKI-SPEC.md)

Skrót:

- **Siatka:** co **N×N** hex lądu min. 1 **główny nurt** → morze (Normalnie **N=14**; ABC: A=10, B=14, C=18)
- **Geometria:** tylko **krawędzie** hex (`krawedzie[]`), styl Roblox — bez rzeki przez środek pola
- **Meander:** łagodne **S** w stronę morza — bez serpentyn i pętli
- **Struktura:** `main` (gruby) + `tributary` (2× cieńszy dopływ do nurtu)
- **Fair play:** bez stad rzek przy górach; dopływy nie liczą się do siatki

| Tier „Rzeki” | N siatki | Uwagi |
|--------------|----------|--------|
| Mało | 18 | rzadziej |
| Normalnie | **14** | wdrożone |
| Dużo | 10 | gęściej |

*Poprzedni opis (źródło tylko góry, quota per kontynent) — **nieaktualny** od 2026-07-04.*

## Relief (góry / wzgórza — fair play rud)

**Pełna spec:** [`docs/obieg/MAPA-RELIEF-SPEC.md`](MAPA-RELIEF-SPEC.md)

Skrót:

- **Siatka:** co **N×N** hex lądu min. **1× Góry** (żelazo) + **1× Wzgórza** (miedź) w komórce
- **Normalnie N=25** (ABC: A=20, B=25, C=50) — **osobna** od siatki rzek (14)
- **`ensureReliefGridCoverage`** po finalnym lądzie (`enforceEarthTemplate`), przed `placeDeposits`
- Złoża losowe na gotowym terenie — nie 100% rudy, ale **teren** w zasięgu każdej strefy

| Tier „Relief” | N siatki |
|---------------|----------|
| Mało | 50 |
| Normalnie | **25** |
| Dużo | 20 |

## Render brzegu

- Wybrzeże: `#82C8E0` (bez żółtego piasku na heksie Wybrzeże)
- Piasek: wąski pas na **lądzie** przy wybrzeżu
- Morze: płaska tafla, tło tuż pod wodą

## Playtest

Ctrl+F5 → Nowa gra

## Pasy klimatyczne (C-MAP-Q3, 2026-07-27)

Od północy (r=0) do południa — **% wysokości mapy**:

| Pas | Udział | Teren bazowy (bez gór/wzgórz) |
|-----|--------|-------------------------------|
| Polarny N | 5% | `polarny` (śnieg, niezamieszkany) |
| Umiarkowany N | ~22.5% | głównie łąka |
| Równiny N | 15% | 70% równina / 30% łąka |
| Pustynia | 15% (środek) | 50% pustynia / 50% równina |
| Równiny S | 15% | 70% równina / 30% łąka |
| Umiarkowany S | ~22.5% | głównie łąka |
| Polarny S | 5% | `polarny` |

- Bufor oceanu N/S: **5% wysokości** (mapy proceduralne) · **~30 hex** (Ziemia)
- Ziemia: **Antarktyda usunięta** z maski, ląd redystrybuowany (`build-earth-mask.cjs`)
- Implementacja: `climateBandAt`, `applyClimateBandsToHexes` w `gen-helpers.ts`
