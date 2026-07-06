# MASTER → MAPA — miasta 3D roster 15 (mapowanie + Hetyci)

**Data:** 2026-07-04  
**Decyzja:** Maciej (czat MASTER)  
**Status handoff:** CZEKA (mesh Hetyci) / mapowanie reuse **GOTOWE w kodzie**

---

## Co przesyłam

Decyzje produktowe — przypisanie modeli 3D miast (epoka brązu+, styl Roblox na mapie) dla pełnego rosteru 15 typów z `civs.json`.

**Reguła epok (Maciej):** cywilizacje z gotowym wyglądem brązu **nie zmieniają** meshu po wejściu w żelazo — ten sam model przy `era >= 2`. Brak osobnego modelu „żelaza” (Słowianie = Germanie, nie upgrade).

---

## Mapowanie zatwierdzone (ikonaId → BronzeCiv)

| Nacja | ikonaId | Model 3D | Uwagi |
|-------|---------|----------|-------|
| Grecy | grecy | **grecja** | dedykowany |
| Rzymianie | rzymianie | **rzym** | dedykowany |
| Chińczycy | chinczycy | **chiny** | dedykowany |
| Inkowie | inkowie | **inka** | dedykowany |
| Zulusi | zulusi | **zulu** | dedykowany |
| Egipt | egipt | **egipt** | dedykowany |
| Sumerowie | sumer | **sumer** | dedykowany |
| Celtowie | celtowie | **celtowie** | dedykowany |
| Germanie | germanie | **germanie** | dedykowany |
| **Harappa** | harappa | **sumer** | ten sam mesh (budownictwo bliskie) |
| **Babilonia** | babilonia | **sumer** | ten sam mesh |
| **Asyria** | asyria | **sumer** | ten sam mesh |
| **Słowianie** | slowianie | **germanie** | ten sam mesh (osada leśna / longhouse) |
| **Hetyci** | hetyci | **hetyci** *(nowy)* | **DO ZROBIENIA** |
| **Fenicjanie** | fenicjanie | **hetyci** | ten sam mesh co Hetyci |

Alias reuse wdrożony w `gra/src/render/bronzeCity.ts` → `IKONA_TO_BRONZE` (harappa, babilonia, asyria, slowianie). Sync: `gra-robocza`.

---

## Co Odbiorca ma z tym zrobić

### 1. Nowy typ `hetyci` (obowiązkowe)

- Rozszerzyć `BronzeCiv` + `BRONZE_CIVS` o `'hetyci'`.
- `bronzeCityRoblox.ts` (priorytet — kanon mapy): paleta **szary kamień** (np. `#9e9e9e`, `#757575`, `#616161`), mury **stone**.
- Świątynia / centrum: styl **kamienny anatolijski** — masywne bloczne mury, brama łukowa (inspiracja: Hattusa / brama lwi), bez cegły Sumeru.
- Domy: proste kamienne bloczki (nie drewno, nie cegła).
- Poziomy 1–10 + `withWalls` — jak pozostałe cyw.
- `bronzeCity.ts` (classic): ten sam koncept (min. parity świątyni).
- `stoneCity.ts` / `stoneCityRoblox.ts`: wariant kamienny dla epoki kamienia (Harappa start kamień — opcjonalnie ten sam archetyp co hetyci w kamieniu, albo sumer w kamieniu do czasu — **domyślnie: sumer w kamieniu, hetyci od brązu**).

### 2. Mapowanie

```ts
hetyci: 'hetyci',
fenicjanie: 'hetyci',
```

### 3. Podgląd

- `bronzepreview/main.ts` — dodać Hetyci do LABEL + nawigacji (`?civ=hetyci`, `?pack=full`).
- Meldunek: screenshot rzędu L1–10 z/bez murów.

---

## DoD

- [ ] `buildBronzeCityRoblox('hetyci', L, …)` działa L=1..10, withWalls true/false
- [ ] Hetyci i Fenicjanie na mapie ≠ fallback Grecja
- [ ] `npx tsc --noEmit` OK
- [ ] Wpis w `MAPA-DO-MASTERA.md` + screenshot do sign-off Macieja

---

## Kiedy handoff gotowy

**GOTOWE** po merge meshu + aliasów hetyci/fenicjanie → MASTER wpina do kanonu (build + testy).

**Flaga:** GOTOWE (mesh v1) — czeka sign-off Maciej + kanon MASTER
