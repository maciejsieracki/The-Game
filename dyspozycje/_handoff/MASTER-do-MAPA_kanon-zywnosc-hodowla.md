# MASTER → MAPA: kanon kwalifikacja + render ulepszeń żywności

**Data:** 2026-06-29  
**Decyzja / kanon:** `docs/decyzje/KANON-ULEPSZENIA-ZYWNOSC-HODOWLA.md`  
**Status:** **CZEKA** (lane MAPA)  
**Flaga po DoD:** `→ SILNIK: GOTOWE` + `MAPA-do-SILNIK_kanon-zywnosc-hodowla.md`

---

## Co przesyłam

Kanon placement + grafiki + sync podglądów. Kluczowe reguły:

- Farma/irygacja **nie na złożu**.
- Farma tylko płaski; irygacja płaski+pustynia przy rzece; tarasy solo wzgórze (Chińczycy+Inkowie).
- Nakładanie: farma+irygacja **lub** farma+bydło (XOR irygacja vs bydło); owce solo wzgórze; lama solo; bydło+owce **nie** (różne tereny).
- Pustynia: tylko irygacja — **bez** hodowli.

---

## Co MAPA ma zrobić

| # | Zadanie | Pliki |
|---|---------|-------|
| M1 | `improvement-build.ts`: kwalifikacja wg kanonu; usunąć `pastwisko`; dodać `bydlo`/`owce`/`lama`; tarasy chińczycy+inkowie; blok złoża dla farmy/irygacji | `gra/src/map/improvement-build.ts` |
| M2 | **Warstwy na heksie** — kwalifikacja „czy można dodać warstwę” (nie nadpisać solo tarasy/owce/lama) | ten sam plik + kontrakt typów z EKONOMIA/SILNIK |
| M3 | Pierwsze pastwisko wymaga złoża; kolejne — tylko jeśli unlock z EKONOMIA (import helper, nie duplikować logiki) | handoff cross-lane |
| M4 | Render: farma / irygacja / farma+irygacja / farma+bydło; bydło/owce/lama/tarasy solo | `gra/src/render/improvements.ts`, `robloxImprovements.ts`, `scene.ts` (dekor) |
| M5 | Sync `placementpreview/main.ts`, `mainview/main.ts` (qualifier mirror) | te pliki |
| M6 | `buildModeHud.ts` — lista typów: bez `pastwisko`, z `bydlo`/`owce`/`lama` | `gra/src/ui/buildModeHud.ts` (UI lane plik — **MAPA koordynuje** handoff UI jeśli kolizja; alternatywnie wpis w MASTER-do-UI) |
| M7 | Testy | `gra/tools/map-improvement-qualify-test.cjs` — pełna regresja kanonu |

**NIE ruszać:** `main.ts`, `economy.ts`, `turn-economy.ts`.

---

## AC

| AC | Opis |
|----|------|
| AC-M1 | `qual('farma', zlozeHex)` = false; `qual('irygacja', zlozeHex)` = false |
| AC-M2 | `qual('tarasy', wzgorza, chinczycy)` = true; rzym = false |
| AC-M3 | Farma+irygacja dozwolone na tym samym kluczu heksa (model warstw) |
| AC-M4 | Farma+bydło OK; farma+bydło+irygacja = false |
| AC-M5 | Owce tylko wzgorza; bydlo tylko płaski; lama solo |
| AC-M6 | Pustynia: irygacja przy rzece OK; bydlo/owce/lama false |
| AC-M7 | `map-improvement-qualify-test.cjs` — 0 fail |

---

## DoD

- [ ] AC-M1–M7
- [ ] Handoff `MAPA-do-SILNIK_kanon-zywnosc-hodowla.md` (buildImprovementFactory, render API warstw)
- [ ] Wpis `MAPA-DO-MASTERA.md`
- [ ] Flaga **`→ SILNIK: GOTOWE`**

---

## Grafiki (obowiązkowe warianty)

1. Sama farma  
2. Sama irygacja  
3. Farma + irygacja  
4. Farma + bydło  
5. Bydło / owce / lama / tarasy / łodzie — solo  

Podgląd: rozszerzyć siatkę w `robloximprovepreview` jeśli istnieje.
