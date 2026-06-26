# CYWILIZACJE → MASTER : odpowiedzi dla UI (Dyplomacja + civs.json)

Data: 2026-06-25 | Od: **CYWILIZACJE** | Dla: **UI** (przez mastera) | Status: **ODPOWIEDŹ**

## (1) Skala 5 tierów — OFICJALNA
Relacja 0..200; **stan (status) nadrzędny nad score**:
- **tier 0 Wojna** = `status==='wojna'` (wypowiedziana) — nadrzędne.
- **tier 4 Sojusz** = `status==='sojusz'` (traktat) — nadrzędne — LUB `Relacja ≥ 120`.
- inaczej wg score: **<30 → 1 Wrogi**; **30..<60 → 2 Neutralny** (start gry = 50); **60..<120 → 3 Przyjazny**; **≥120 → 4 Sojusz**.
- Progi z modelu: 30 = `progMinimalnyRelacja`, 120 = `progSojuszRelacja`; 60 = stały środek.
- Nazwy: `['Wojna','Wrogi','Neutralny','Przyjazny','Sojusz']` (indeks = tier).
- ⚠ UI dał „<15 Wojna" — **15 to próg WOJNY DROBNYCH (trigger AI), NIE tier display**. W UI **Wojna = STAN**, nie próg score.

## (2) Kto mapuje 0..200→tier
**SILNIK** (jedno źródło prawdy). Dodaję kanoniczny helper **`relationTier(rel) → 0..4`** + `TIER_NAMES` w `diplomacy.ts`. **UI NIE liczy progów u siebie** (zero duplikacji/driftu).

## (3) Skąd UI bierze tier
UI dostaje **GOTOWY tier** z `getRelations()` (silnik liczy moim `relationTier` na żywym `DiplomacyState`). **NIE czytać `diplomacy.json` dla tieru** — to params/config, nie żywy stan. `zaufanie`/`respekt` mogą iść w `getRelations()` (opcjonalnie, do tooltipa).
`getRelations()` = funkcja SILNIKA (czyta `DiplomacyState` + woła `relationTier`). Typy: `Relation`/`RelacjaDyplomatyczna` w `src/game/diplomacy.ts` + `src/types/diplomacy.ts`.

## (4) Panel v0.1 = podgląd czy akcje
**v0.1 = PODGLĄD** (tier + Zaufanie/Respekt/Relacja per cyw). Akcje (wojna/pakt) wymagają **WPIĘCIA** modelu dyplomacji do pętli tury — `applyDiplomaticEvent` jest gotowy, ale model jest **NIEwpięty**. Rekomendacja: akcje w iteracji **po wpięciu**. (Decyzja scope: master/Maciej.)

## (5) civs.json — kompletność + ikony
Pola dla UI (DOKŁADNE klucze): `"Cywilizacja"`, `"Styl / charakter"`, `"Jednostka specjalna"`, `"Bonus startowy"` (+ `"Bonusy/minusy (do dopracowania)"`, `"Religia"`, `"Typ główny"`, `"nazwyKlastra"` [10], `"mnoznikHandelPieniadz"`). **Kompletne** dla potrzeb UI.
**Emblematy/ikony: NIE ma ich w `civs.json`** (to dane, nie grafika). Mogę dodać pole‑referencję per cyw (np. `"ikonaId"`: string → mapowanie do assetu UI/RENDER), ale same grafiki/assety = **UI/RENDER**. Decyzja: dodać `ikonaId` czy UI mapuje po nazwie `Cywilizacja`?
