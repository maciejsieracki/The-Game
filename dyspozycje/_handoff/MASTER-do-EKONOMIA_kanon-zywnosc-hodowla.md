# MASTER → EKONOMIA: kanon żywność + hodowla + plony

**Data:** 2026-06-29  
**Decyzja / kanon:** `docs/decyzje/KANON-ULEPSZENIA-ZYWNOSC-HODOWLA.md` (Maciej — **ZAMKNIĘTE**)  
**Status:** **CZEKA** (lane EKONOMIA)  
**Flaga po DoD:** `→ SILNIK: GOTOWE` w `EKONOMIA-DO-MASTERA.md` + handoff `EKONOMIA-do-SILNIK_kanon-zywnosc-hodowla.md`

---

## Co przesyłam

- Pełny kanon bonusów, terenów, nakładania, Inkowie, pustynia, odblokowanie hodowli na złożu.
- Usunięcie `pastwisko` → klucze `bydlo`, `owce`, `lama`.
- Nowe liczby: farma **+3** żywności; irygacja **+5**; tarasy **+3**; łodzie **+3** produkcji; bydło **+2/+3**; owce **+1/+2**; lama **+1/+3**.

---

## Co EKONOMIA ma zrobić

| # | Zadanie | Pliki (wyłącznie lane) |
|---|---------|------------------------|
| E1 | Zaktualizować `terrain-improvements.json`: bonusy, tereny, usunąć `pastwisko`, dodać `bydlo`/`owce`/`lama`, tarasy cyw. Chińczycy+Inkowie w `warunek` | `gra/data/terrain-improvements.json` |
| E2 | `tileYield` / plony — **suma warstw** na heksie (farma+irygacja, farma+bydło) wg §3 kanonu | `gra/src/game/economy.ts`, `terrain-improvements.ts`, `turn-economy.ts` |
| E3 | Odblokowanie hodowli: stan imperium „ma dostęp do bydlo/owce/lama” po pierwszym pastwisku na złożu | `resource-access.ts` (+ nowy helper jeśli potrzeba, np. `livestock-unlock.ts`) |
| E4 | Bramka Inków: do epoki 3 tylko `lama`; od epoki 3 bydło/owce/kon jak reszta | czyta `player.civType` + era — **logika kwalifikacji delegowana do MAPA**, EKONOMIA dostarcza `isLivestockAllowed(civ, key, era)` |
| E5 | Sync `resources.json` uwagi: bydło bez „×200%”, owce/lama wg kanonu | `gra/data/resources.json` |
| E6 | Testy regresji plonów + unlock | `gra/tools/*-test.cjs` (nowy lub rozszerz `map-improvement-qualify-test` tylko jeśli EKONOMIA ma własny bundle) |

**NIE ruszać:** `main.ts`, `improvement-build.ts`, `render/*`, `buildModeHud.ts`.

---

## AC (kryteria akceptacji)

| AC | Opis |
|----|------|
| AC-E1 | JSON: farma +3 zywnosc; irygacja +5; tarasy +3; lodzie +3 praca; bydlo/owce/lama osobne wpisy |
| AC-E2 | `tileYield` dla heksa z warstwami `[farma, irygacja]` = +8 żywności (test jednostkowy) |
| AC-E3 | Po postawieniu `bydlo` na złożu — `getResourceAccess` / unlock pozwala kwalifikować bydło na polu bez złoża |
| AC-E4 | Inkowie era&lt;3: helper zwraca false dla bydlo/owce/kon |
| AC-E5 | `npx tsc --noEmit` + testy lane zielone |

---

## DoD

- [ ] AC-E1–E5
- [ ] Handoff `EKONOMIA-do-SILNIK_kanon-zywnosc-hodowla.md` (API: typ warstw, unlock, tileYield)
- [ ] Wpis append `EKONOMIA-DO-MASTERA.md`
- [ ] Flaga **`→ SILNIK: GOTOWE`**

---

## Zależności

- **Model warstw na heksie** (typ `Hex`) — projekt kontraktu w handoffu do SILNIK; EKONOMIA implementuje **czytanie** warstw, nie mutuje `types/hex.ts` bez uzgodnienia w handoffu cross-lane.
