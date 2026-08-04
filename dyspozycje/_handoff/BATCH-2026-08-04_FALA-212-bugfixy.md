# BATCH 2026-08-04 — FALA 212 bugfixy (handoff dla agentów)

**Data:** 2026-08-04 · **ROBOCZA md5:** `e38ad116993cf1b8c18d1fce4a5e10d6` · **FALA:** 212  
**Wejście:** `gra-robocza/START.html` — git pull, Ctrl+F5, **Nowa gra**  
**Źródła:** niezacommitowane zmiany w `gra/src/**` + `gra/data/diplomacy.json` (wdrożone w bundlu, brak commita)

---

## Status deployu

| Pole | Wartość |
|------|---------|
| Nowy deploy w tej sesji? | **NIE** — FALA 212 już na `gra-robocza` (11:24) |
| `verify-robocza-bundle.cjs` | **VERIFY OK** |
| `tsc --noEmit` | 0 błędów |
| Kod vs bundle | Źródła z 11:21 → deploy 11:24; brak nowszych edycji po deployu |

---

## Błędy / tematy napotkane

### 1. Spichlerz / racje żywnościowe
**Objawy:** deficyt imperium niewidoczny w UI; przy Spichlerzu=0 suwak racji sugerował pełny wzrost; brak auto-obniżenia racji EOT.  
**Root cause:** brak `autoBalanceRationsToSolvency` na EOT + panel miasta nie brał pod uwagę pokrycia z magazynu centralnego przy prognozie wzrostu.  
**Decyzja:** **SPICH-AUTO-Q1** (B)  
**Pliki:** `gra/src/game/empire-food.ts` (`autoBalanceRationsToSolvency`), `gra/src/game/spich-auto-ration-notify.ts`, `gra/src/main.ts` (hook EOT + event następnej tury), `gra/src/ui/cityPanel.ts` (wzrost tylko gdy `fed`), `gra/src/ui/sidePanelHud.ts` (`negative` → czerwony styl)

### 2. MP sameCiv start −20 zamiast +20
**Objawy:** miasta-państwa własnego typu gracza startowały ze Zaufaniem ~0 (20−20), nie +20.  
**Root cause:** `spawnPendingSameTypeRivals` używał `startRelationForPair(true)` z globalnym `rywalizacjaTenSamTyp_zaufanie: -20`.  
**Decyzja:** **REL-MP-SAME-Q1**  
**Pliki:** `gra/data/diplomacy.json` (`miastoPanstwoSameCiv_zaufanie: 20`), `gra/src/game/diplomacy.ts`, `gra/src/game/diplomacy-layers.ts` (`startRelationForPlayerSameCivCityState`), `gra/src/game/diplomacy-factors.ts` (wiersz breakdown), `gra/src/main.ts` (spawn MP)

### 3. Obce MP wypowiadają wojnę / klaster
**Objawy:** Ostia/Nekhen (obcy typ) wypowiadały wojnę graczowi; konsolidacja klastra dotyczyła obcych MP.  
**Root cause:** brak filtra `typCityCopyOwners` + `isOwnerPlayerSameCivType` przy AI `wypowiedz_wojne` i logice klastra.  
**Pliki:** `gra/src/main.ts` (~21051–21056, ~5773), `gra/src/game/diplomacy-layers.ts`

### 4. HEX surowce — UI „Do magazynu państwa"
**Objawy:** tooltip heksa pokazywał plony magazynowe (drewno/kamień/glina) także bez 👤; tick EOT OK, projekcja UI myląca.  
**Root cause:** `formatTerrainMagazynWorkedNotes` bez bramki `hexWorkedForMagazyn`.  
**Pliki:** `gra/src/ui/hexContextTooltip.ts`, `gra/src/main.ts` (przekazanie `hexWorkedForMagazyn`)

### 5. Chatka → tip „Doświadczeni wojownicy"
**Objawy:** toast nagrody chatki zastępowany edukacją weteranów po `refreshFog`.  
**Root cause:** `checkVeteranEnemyFirstEncounter` w `refreshFog` nadpisywał toast.  
**Pliki:** `gra/src/main.ts` (`checkVillageRewardAt` → `refreshFog({ skipVeteranEducation: true })`, jeden toast + wpis Wydarzenia)

### 6. Scout ignoruje odkryte chatki
**Objawy:** auto-explore szedł w mgłę zamiast do znanej, niezłupionej chatki.  
**Root cause:** brak priorytetu `pickKnownVillageTarget` przed mgłą.  
**Pliki:** `gra/src/game/scout-auto-explore.ts` (`pickKnownVillageTarget`, `pickScoutExploreTarget`)

### 7. Odgarnizonowanie nie działa w panelu miasta
**Objawy:** przycisk „Opuść garnizon" / odfortyfikowanie w panelu miasta bez efektu.  
**Root cause:** brak podpięcia `onLeaveGarrison` → `exitGarnizon` + sync licznika.  
**Pliki:** `gra/src/game/armyMerge.ts` (`exitGarnizon`), `gra/src/ui/cityPanel.ts`, `gra/src/main.ts` (`onLeaveGarrison`, `onLeaveAllGarrison`)

### 8. Split scout wyrzuca z miasta
**Objawy:** rozdzielenie stosu w mieście wypychało jednostkę na sąsiedni heks zamiast zostawić w mieście.  
**Root cause:** split zawsze szukał sąsiedniego pustego heksu, ignorując tryb „w mieście".  
**Pliki:** `gra/src/ui/armySplitPanel.ts`, `gra/src/game/armyMerge.ts`, `gra/src/main.ts`

### 9. Fortyfikacja w mieście przy MP=0 — NIE bug
**Ustalenie:** garnizon ukryty (Ufort.) przy Manpower=0 to **kanon** — jednostka nie zużywa MP w garnizonie, ale jest w obronie miasta. Nie naprawiać bez decyzji Macieja.

### 10. Relacja +1/turę bez umowy przy kontakcie — FAKT (nie bug)
**Ustalenie:** tier **pokojowy kontakt** (`pokoj_zaufanie_perTura` w `diplomacy.json`) — relacja rośnie bez traktatu po ustaleniu kontaktu. Wiarygodność (D4) to **mnożnik** przy pierwszym kontakcie, nie blokuje driftu tieru. **Maciej jeszcze nie kazał zmieniać** — czeka ewentualna decyzja strojenia.

---

## Co WDROŻONE (FALA 212)

- SPICH-AUTO-Q1: auto-racje EOT + czerwone wydarzenie następnej tury
- REL-MP-SAME-Q1: MP gracza +20 Zaufanie (baza 40 przed D4/trudnością)
- Obce MP: wojna AI + klaster tylko dla typu gracza
- HEX→magazyn: poprawna projekcja UI (tylko przy 👤)
- Scout: priorytet odkrytej chatki
- Chatka: toast nie nadpisywany tipem weteranów
- Garnizon: odgarnizonowanie z panelu + split zostaje w mieście

---

## Co OTWARTE

| Temat | Status |
|-------|--------|
| Drift Relacji +1/tura bez umowy (tier pokoj) | **WDROŻONE** — **REL-WIARYG-DRIFT-Q1**: dryf Zaufania z W (±3 przy ±100), bez flat +1; UI Δ/turę w audiencji; **nie na ROBOCZA** (czeka `deploy`) |
| Fortyfikacja przy MP=0 | **KANON** — nie bug |
| Commit `gra/src` FALA 212 | **Brak** — kod tylko w working tree + bundlu ROBOCZA |
| Testy lane | `empire-food-b5-test`, `scout-auto-explore-test`, `city-state-alliance-test` — uruchomić przy commit |

---

## Dla następnej sesji

1. Przed kodem: `git status gra/src/` — jeśli dirty, to prawdopodobnie FALA 212 (nie nadpisywać).
2. Commit po zgodzie Macieja (`REL-MP-SAME-Q1` + `SPICH-AUTO-Q1` już zamknięte w docs).
3. Deploy tylko na hasło **`deploy`** — nowa FALA gdy kod się zmieni po `e38ad116`.
4. Pełny runbook: `STAN-PRACY-HANDOFF.md` §6.

---

## Dopisek 2026-08-04 — REL-WIARYG-DRIFT-Q1 (źródła, bez deploy)

**Decyzja:** `docs/decyzje/REL-WIARYG-DRIFT-Q1.md`  
**Reguła:** `deltaZ = clamp(W,±100)×0,03` · umowy dokładają bonusy bez mnożnika W · tier „pokoj" bez +1.  
**Pliki:** `diplomacy-credibility.ts`, `diplomacy.ts`, `diplomacy-factors.ts`, `diplomacyAudience.ts`, `main.ts` (TickCtx + audience Δ/turę)  
**Testy:** `wiarygodnosc-test.cjs` 103/103 · `diplomacy-test.cjs` 148/148 · `tsc` 0

---

*Handoff utworzony: 2026-08-04 (sesja weryfikacji ROBOCZA vs FALA 212).*

---

## Dopisek 2026-08-04 — DEPLOY FALA 213 1d3b8755 (bez commit)

- **md5:** 1d3b8755445058c10957c81438912d1c · stempel ROBOCZA 2026-08-04 12:13
- **REL-WIARYG-DRIFT-Q1:** na ROBOCZA (dryf W×0.03, umowy osobno, UI Δ/turę audiencja)
- **FORTIFY-MP0-Q1=C + ODFORT:** fortify bez wymogu MP, snapshot ruchLeft, odfort na heksie miasta (select + restore MP)
- **Bramka:** tsc 0 · vite · verify-robocza-bundle.cjs VERIFY OK
- **WERSJE:** FALA 213 AKTUALNA, FALA 212 ZASTAPIONA
