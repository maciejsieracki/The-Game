# CYWILIZACJE → MASTER: epoka wejścia państw + cuda (tech / epoka cudu)

> **Status handoff:** ✅ **KANON opublikowany** 2026-07-03 · md5 `DB1F508BEE3080F199617B8E0420C0E9` · Opus **CZEKA** · gameplay cudów **CZEKA**  
> **Data:** 2026-07-03 · **Decydent:** Maciej (sesja MASTER czat)

---

## Podsumowanie decyzji Macieja

### 1. D-CYW-EPOKA-WEJSCIA (kaskada)

- `epokaWejscia` = pierwsza epoka debiutu państwa w kreatorze / na mapie.
- Wchodzi w X → dostępne w X i każdej **późniejszej** (bez wyjątków).
- Dokument: `docs/decyzje/D-CYW-EPOKA-WEJSCIA-KASKADA.md`

### 2. D-CUD-TECH-WEJSCIA

- Cud **E**: każdy `techUnlock` ≥ epoka wejścia państwa; późniejsze epoki OK.
- Dokument: `docs/decyzje/D-CUD-TECH-WEJSCIA.md`

### 3. Korekty Macieja (2026-07-03)

| Temat | Było (błąd) | Jest (kanon) |
|-------|-------------|--------------|
| Fenicjanie | epokaWejscia **Żelazo** | **Brąz** |
| Babilonia / cud | Wiszące ogrody ep. 1 | ep. **2** (Brąz) |
| Fenicjanie / cud | Petra ep. 1 | ep. **2** (Brąz) |
| Słowianie / cud | Posąg Peruna ep. 1 | ep. **3** (Żelazo) |
| Grecy / Kolos | Żegluga (Brąz), ep. 2 | **Inżynieria**, ep. **3** |
| Rzym / Koloseum | już Inżynieria ep. 3 | bez zmiany tech |

---

## Mapa 15 państw (`gra/data/civs.json`)

| epokaWejscia | Państwa |
|--------------|---------|
| **kamien** | grecy, rzymianie, chinczycy, inkowie, zulusi, egipt, sumer, harappa |
| **braz** | celtowie, germanie, hetyci, babilonia, asyria, **fenicjanie** |
| **zelazo** | **slowianie** |

---

## Katalog cudów Antyku (19 aktywnych) — stan `wonders.json`

| Ep. cudu | Cud | Typ | Państwo | Badania |
|:--------:|-----|:---:|---------|---------|
| 1 | Piramidy | E | egipt | Murarstwo |
| 1 | Wyrocznia | R | wszyscy 15 | Mistycyzm |
| 2 | Wiszące ogrody | E | babilonia | Pismo |
| 2 | Wielka stela | E | zulusi | Pismo |
| 2 | Stupa w Sanchi | E | harappa | Religia |
| 2 | Ziggurat | E | sumer | Matematyka |
| 2 | Mundo Perdido | E | inkowie | Matematyka + Murarstwo |
| 2 | Dur-Sharrukin | E | asyria | Budownictwo + Wojskowosc |
| 2 | Yerkapı | E | hetyci | Wojskowosc |
| 2 | Petra | E | fenicjanie | Inżynieria |
| 2 | Ha'amonga | R | wszyscy 15 | Żegluga |
| 3 | Kolos Rodyjski | E | grecy | Inżynieria |
| 3 | Koloseum | E | rzymianie | Inżynieria |
| 3 | Roquepertuse | E | celtowie | Inżynieria |
| 3 | Aschaffenburg | E | germanie | Inżynieria |
| 3 | Terakotowa armia | E | chinczycy | Wojskowosc |
| 3 | Pałac Weiyang | E | chinczycy | Wymiana + Murarstwo |
| 3 | Posąg Peruna | E | slowianie | Obróbka żelaza |
| 3 | Brama narodów | R | wszyscy 15 | Inżynieria + Wojskowosc |

---

## Co ZAIMPLEMENTOWANO (w `gra/`)

| Warstwa | Plik | Stan |
|---------|------|------|
| **Dane** | `gra/data/civs.json` | ✅ `epokaWejscia` wszystkich 15 |
| **Dane** | `gra/data/wonders.json` | ✅ tech + epoka cudu |
| **Moduł** | `gra/src/game/civ-entry-epoch.ts` | ✅ kaskada dostępności |
| **Moduł** | `gra/src/game/wonder-civ-tech.ts` | ✅ walidacja tech ≥ wejście (test/CI) |
| **UI** | `gra/src/ui/newGameFlow.ts` | ✅ filtr cywilizacji w kreatorze |
| **SILNIK** | `gra/src/main.ts` | ✅ filtr puli AI (`civIdsAvailableAtGameEpoch`, `_menuEpochId`) |
| **Typy** | `gra/src/data/loader.ts` | ✅ `epokaWejscia` w `CivDef` |
| **Re-export** | `gra/src/game/civ-roster.ts` | ✅ |
| **Testy** | `tools/civ-entry-epoch-test.cjs` | ✅ 11/11 |
| **Testy** | `tools/wonder-civ-tech-test.cjs` | ✅ 5/5 |
| **Testy** | `tools/civ-roster-test.cjs` | ✅ 14/14 (+ filtr epoki) |
| **Docs** | `docs/decyzje/D-CYW-EPOKA-WEJSCIA-KASKADA.md` | ✅ |
| **Docs** | `docs/decyzje/D-CUD-TECH-WEJSCIA.md` | ✅ |

---

## Co MASTER musi jeszcze ZROBIĆ

### A. Build kanonu (obowiązkowy)

```powershell
cd gra
npx vite build --outDir $env:TEMP\civ-dist
# bramka: civ-entry-epoch-test + wonder-civ-tech-test + civ-roster-test + logic/smoke
# skopiować Gra-podglad.html → root
```

**Bez rebuildu** `Gra-podglad.html` w root **nie ma** nowych danych ani kodu kreatora/rosteru.

### B. Review wpiecia `main.ts` (już dotknięty w sesji)

- Import `civIdsAvailableAtGameEpoch` + `_menuEpochId` + filtr w `fillAiOwnerCivMap`.
- MASTER: potwierdzić diff, ewentualnie przenieść do osobnego modułu SILNIK.

### C. Silnik budowy cudów — **NIE ZAIMPLEMENTOWANY**

`wonders-data.ts` jest w loaderze, ale **nigdzie poza loaderem nie jest używany** w gameplay:

- Brak wpiecia w `production.ts` / panel budowy / `main.ts`.
- Brak runtime: `epokaWejscia` cudu vs `player.era`, `techUnlock` vs `player.zbadane`.
- `wonder-civ-tech.ts` — tylko test CI, nie runtime.

**Dyspozycja dla MASTER (lub osobny batch CUDA/SILNIK):**

1. Panel / kolejka produkcji: lista cudów E/R per państwo (`getWondersForCiv`).
2. Gate: `player.era >= wonder.epokaWejscia` AND all `techUnlock` in `zbadane`.
3. Gate E: `canCivBuildWonder(civType, id)`.
4. Gate R: wyścig globalny max 1 (`maxNaSwiecie`).
5. Opcjonalnie: import `wonderTechValidForCivEntry` przy starcie gry (assert dev).

### D. Poradnik / wiki (opcjonalnie, po kanonie)

- Zaktualizować `docs/PORADNIK-GRACZA/91-katalog-cudow-antyk.md` tabelą z handoffu.

---

## DoD dla MASTER (akceptacja batchu)

- [ ] `node tools/civ-entry-epoch-test.cjs` — ZIELONE
- [ ] `node tools/wonder-civ-tech-test.cjs` — ZIELONE
- [ ] `node tools/civ-roster-test.cjs` — ZIELONE
- [ ] Kreator: start Brąz → 14 typów; Żelazo → 15; Kamień → 8
- [ ] AI roster bez typów sprzed epoki startu
- [ ] `Gra-podglad.html` opublikowany (md5 checkpoint w DZIENNIK)
- [ ] (Osobny sprint) gameplay budowy cudów — patrz sekcja C

---

## Pliki zmienione (git diff scope)

```
gra/data/civs.json
gra/data/wonders.json
gra/src/game/civ-entry-epoch.ts          (NOWY)
gra/src/game/wonder-civ-tech.ts          (NOWY)
gra/src/game/civ-roster.ts
gra/src/ui/newGameFlow.ts
gra/src/main.ts
gra/src/data/loader.ts
gra/tools/civ-entry-epoch-test.cjs       (NOWY)
gra/tools/wonder-civ-tech-test.cjs       (NOWY)
gra/tools/civ-roster-test.cjs
docs/decyzje/D-CYW-EPOKA-WEJSCIA-KASKADA.md
docs/decyzje/D-CUD-TECH-WEJSCIA.md
```
