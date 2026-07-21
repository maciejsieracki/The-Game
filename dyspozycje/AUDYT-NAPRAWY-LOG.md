# AUDYT-NAPRAWY-LOG — plan 20 POTWIERDZONE

> **Akceptacja:** Maciej `OK plan audyt 20` (2026-07-21)  
> **Wykonawca:** Cursor (sesja integracyjna, sesja lokalna)  
> **Plan źródłowy:** `dyspozycje/PLAN-NAPRAWCZY-AUDYT-20-POTWIERDZONE.md`  
> **Audyt źródłowy:** `dyspozycje/AUDYT-KODU-2026-07-21.md` (tylko status POTWIERDZONE)

---

## Podsumowanie wykonania

| Etap | Status | Dowód |
|------|--------|-------|
| Implementacja E1–E8 (20 ID) | ✅ | pliki w `gra/src/` poniżej |
| Fix chatki WYDARZENIA (extra) | ✅ | `main.ts` — `villageEventLog`, `isActionableEvent` |
| Bramka `tsc --noEmit` | ✅ | 0 błędów |
| Bramka `tech-tree-test.cjs` | ✅ | 33/33 |
| Bramka `map-gen-regression-test.cjs` | ✅ | determinizm A=B, rzeki OK |
| Publish `gra-robocza/` | ✅ | `publish-robocza-snapshot.ps1` · 2026-07-21 22:29 |
| Rejestr wersji | ✅ | `dyspozycje/WERSJE.md` (wpis AKTUALNA) |
| Kanał pracy | ✅ | `dyspozycje/_handoff/KANAL-PRACA.md` §22:30 |
| Commit / push `main` | ⏸ | nie w tej sesji — kod na dysku lokalnym |

**Bundle roboczy:** `gra-robocza/Gra-ROBOCZA.html`  
**Pieczęć na pliku (źródło prawdy):** `aa380840` · 2026-07-21 22:29  
**Manifest:** `33e7c213` — rozjazd z pieczęcią po inject (do zsynchronizowania przy następnym publishu)  
**Wejście:** `gra-robocza/START.html` → Ctrl+F5

---

## Status paczek

| Paczka | ID | Status | Pliki główne |
|--------|-----|--------|--------------|
| E1 | #3 #4 #35 #36 #59 | ✅ | `manpower.ts`, `turn-economy.ts`, `economy.ts` |
| E2 | #34 | ✅ | `empire-food.ts` |
| E3 | #5 #37 | ✅ | `ai.ts`, `main.ts` (pętla AI badań) |
| E4 | #6 | ✅ | `victory.ts` |
| E5 | #7 #62 #63 #64 | ✅ | `gen-helpers.ts`, `generator.ts`, `startScoring.ts`, `deposits.json`, `map-gen-params.json` |
| E6 | #38 | ✅ | `wonder-placement.ts` |
| E7 | #8 #9 #39 #65 | ✅ | `filePlayer.ts`, `muzyka-antyczna.ts` |
| E8 | #60 #61 | ✅ | `main.ts`, `playerState.ts` |
| extra | chatka WYDARZENIA | ✅ | `main.ts` |

---

## ABC zastosowane

| ID | Decyzja | Efekt w grze |
|----|---------|--------------|
| **#6** | **A** | Zwycięstwo naukowe bez rakiety, gdy `NAUKA_WYMAGA_RAKIETY=false` |
| **#4** | **A** | Suwak rozwoju 0% dotyczy tylko nadwyżki żywności; deficyt nadal obciąża magazyn |
| **#62** | **B** | Pangea: `purgeInlandWaterForMultiLandTyp` pomijane — jeziora wewnętrzne mogą zostać |
| **#64** | **A** | Martwe wpisy `deposit_rules` usunięte z `deposits.json` |

---

## Szczegóły — co naprawiono / zmieniono / usprawniono

### E1 — Ekonomia ludność i żywność (#3, #4, #35, #36, #59)

| ID | Problem (audyt) | Naprawa | Plik |
|----|-----------------|---------|------|
| **#3** | Duplikacja ludności: rekrut przy pop=1 + disband oddawał ludność ponad cap | `tryDeductUnitSpawnCosts` blokuje rekrut przy `popCost >= population`; `refundUnitSpawnToCity` clampuje populację do `popCap` i manpower do max | `gra/src/game/manpower.ts` |
| **#4** | Suwak żywności 0% kasował deficyt z ksiąg | Rozdzielenie `surplus` (tylko dodatnia żywność × %) i `deficit` (ujemna w całości); wzrost liczy `surplus + deficit` | `gra/src/game/turn-economy.ts` |
| **#35** | Zdrowie mnożyło ujemną żywność → immunitet głodu przy zdrowiu ≤−20 | Modyfikator zdrowia stosowany tylko przy `zywnoscNetto >= 0`; deficyt bez mnożnika | `gra/src/game/economy.ts` (`populationGrowth`) |
| **#36** | Utrzymanie budynków zawsze 0 (pusta lista do `upkeepBalance`) | `builtByCity` mapowane na `BuildingInstanceLike[]` per owner przed `upkeepBalance` | `gra/src/game/turn-economy.ts` |
| **#59** | Praca→Pieniądz: floor vs round, rozjazd z karą Porządku | Ujednolicenie `doPuli` przez `Math.floor` na `splitPraca` (spójne z resztą ekonomii) | `gra/src/game/economy.ts` |

**Usprawnienie:** ekonomia miasta i imperium liczą utrzymanie budynków i głód zgodnie z kanonem panelu — mniej exploitów i „darmowego” utrzymania.

---

### E2 — Parametry imperium z JSON (#34)

| ID | Problem | Naprawa | Plik |
|----|---------|---------|------|
| **#34** | Parametry głodu/suwaka czytane ze złego poziomu JSON | Odczyt z sekcji `ekonomia_miasta` z fallbackiem na root (`suwak_zywnosc_*`, `glod_*`, `spichlerz_*`) | `gra/src/game/empire-food.ts` |

**Usprawnienie:** trudność i suwaki imperium zgadzają się z `econ-params.json` — atrykcja wojska i domyślny podział żywności działają jak w panelu.

---

### E3 — AI badania (#5, #37)

| ID | Problem | Naprawa | Plik |
|----|---------|---------|------|
| **#5** | AI przestawało badać po techu awansu epoki | Pętla tury AI: po każdym `chooseAIResearch` dodaje tech do `aiResearchDone`, `syncOwnerEraFromResearch` + log awansu — kolejny tech wybierany w następnej iteracji | `gra/src/main.ts` (~11723–11751) |
| **#37** | AI omijało bramki epoki/tier i budynków | `scoreTech` odrzuca tech z `-Infinity` gdy `!epochGateMet`, `!epochTierGateMet` lub `!researchGatesMet`; przekazywane `techData` + `researchGate` | `gra/src/game/ai.ts` |

**Usprawnienie:** przeciwnik nie „stoi w kamieniu” po pierwszym awansie; wybiera techy z tymi samymi bramkami co gracz.

---

### E4 — Zwycięstwo nauka (#6, ABC A)

| ID | Problem | Naprawa | Plik |
|----|---------|---------|------|
| **#6** | Zwycięstwo naukowe nieosiągalne (`rakietaWystrzelona` nigdy true) | `NAUKA_WYMAGA_RAKIETY` z `e-start-params.json`; `isNaukaVictory` zwraca true przy pełnym drzewku, gdy flaga false | `gra/src/game/victory.ts` |

**Usprawnienie:** w v0.1 można wygrać nauką bez mechaniki rakiety.

---

### E5 — Mapa generator (#7, #62, #63, #64)

| ID | Problem | Naprawa | Plik |
|----|---------|---------|------|
| **#7** | Relief fair-play stawiał Góry na Wybrzeżu | Skip `Morze` i `Wybrzeze` w `applyReliefByNoiseRank` i powiązanych siatkach reliefu | `gra/src/map/gen-helpers.ts` |
| **#62** | Martwa gałąź pangei — jeziora zawsze kasowane | `purgeInlandWaterForMultiLandTyp` wywoływane tylko gdy `typ !== 'pangea'` (2 miejsca) | `gra/src/map/generator.ts` |
| **#63** | Góry w dist=4 nigdy nie punktowane przy starcie | Pętla scoringu: `dist >= 2 && dist <= 4` dla Gór/Wzgórz sąsiadów | `gra/src/map/startScoring.ts` |
| **#64** | Martwe reguły złóż w JSON | Usunięte nieużywane wpisy (owce/bydło itd.) | `gra/data/deposits.json` |

**Usprawnienie:** mapa bez gór na wodzie; pangea może mieć jeziora; lepszy wybór hexu startu; czystszy JSON złóż.

---

### E6 — Cudy (#38)

| ID | Problem | Naprawa | Plik |
|----|---------|---------|------|
| **#38** | Cud mógł stanąć na Wybrzeżu | `isLandBuildable` odrzuca `TerenBazowy.Wybrzeze` | `gra/src/map/wonder-placement.ts` |

---

### E7 — Audio (#8, #9, #39, #65)

| ID | Problem | Naprawa | Plik |
|----|---------|---------|------|
| **#8** | Odrzucone `play()` → `playing=true` → martwy fallback intro | Po `.catch()` na `el.play()` ustawiane `playing = false` | `gra/src/audio/filePlayer.ts` |
| **#9** | Awans kamień→brąz: cisza (ctx null przy torze plikowym) | Lazy `AudioContext` / synchronizacja epoki przy awansie z toru plikowego | `gra/src/audio/muzyka-antyczna.ts` |
| **#39** | Toggle natury OFF→ON podwajał soundscape | `stopAmbience` zatrzymuje zaplanowane źródła przed ponownym startem | `gra/src/audio/muzyka-antyczna.ts` |
| **#65** | `onError` przy crossfade mógł uciszyć playlistę | Recovery: reset stanu `playing`, bezpieczny fallback przy błędzie odtwarzania | `gra/src/audio/filePlayer.ts` |

**Usprawnienie:** intro menu, awans epoki i ambience natury nie „zawieszają” muzyki.

---

### E8 — Research / wioski (#60, #61)

| ID | Problem | Naprawa | Plik |
|----|---------|---------|------|
| **#60** | Nagroda tech z wioski bez `setEra` / overlay | Po `researchStep` z `awansEpoki`: `rebuildResourceOverlays()` + `setEra(player.era)` | `gra/src/main.ts` (~8226–8230) |
| **#61** | Parser prereków ≠ `research.ts` | `BRAK_PREREQ` rozszerzone o `'-'`, `'brak'`, `'none'`, en-dash | `gra/src/game/playerState.ts` |

---

### EXTRA — Chatka WYDARZENIA (poza audytem 20, ten sam deploy)

| Objaw | Przyczyna | Naprawa | Plik |
|-------|----------|---------|------|
| „Odkryto chatkę” nie znika; WYKONAJ zablokowane | `villageEventLog` trwały + liczony jako blocking event | `isActionableEvent`: wpisy `village-*` nie blokują; `villageEventLog.length = 0` na końcu tury gracza; dismiss usuwa wpis z logu | `gra/src/main.ts` |

**Usprawnienie:** nagroda z chatki widoczna w WYDARZENIACH do końca tury, potem znika; przycisk WYKONAJ nie blokuje na nagrodzie informacyjnej.

---

## Lista plików zmienionych (`gra/`)

```
gra/src/game/manpower.ts
gra/src/game/turn-economy.ts
gra/src/game/economy.ts
gra/src/game/empire-food.ts
gra/src/game/ai.ts
gra/src/game/victory.ts
gra/src/game/playerState.ts
gra/src/map/gen-helpers.ts
gra/src/map/generator.ts
gra/src/map/startScoring.ts
gra/src/map/wonder-placement.ts
gra/src/audio/filePlayer.ts
gra/src/audio/muzyka-antyczna.ts
gra/src/main.ts
gra/data/deposits.json
gra/data/map-gen-params.json   (jeśli dotknięte przy #62/#63 — weryfikacja w diff)
```

**Publish (artefakty, nie kod TS):**

```
gra-robocza/Gra-ROBOCZA.html
gra-robocza/Gra-ROBOCZA-PLAYTEST-{MAPA,MIASTO,WALKA,ODSKOK,ODSKOK-OBLEZENIE,OBLEZENIE-3v3}.html
gra-robocza/ROBOCZA-MANIFEST.json
```

---

## Co jest w roboczej — a czego nie

| Element | W roboczej? | Uwaga |
|---------|-------------|-------|
| Pełna gra + 6 playtestów z huba | ✅ | stamp `aa380840`, ten sam bundel |
| `Gra-ROBOCZA-PLAYTEST-BITWA-DUZA.html` | ❌ stary | osobny bundel pola bitwy (`ec3750ac`, 9 lip) — poza skryptem publish |
| `Gra-ROBOCZA-PLAYTEST-OBLEZENIE-DUZE.html` | ❌ stary | j.w. |
| `gra-kanon/` | ❌ | promocja osobno, nie robiona |
| `START.html` metadane md5 | ⚠️ | podtytuł nadal `14b3a1b0` — kosmetyka, linki poprawne |

---

## Poza zakresem (bez zmian — Fable / runda 2)

Nie wdrażano: **#1, #2**, **#10–#33**, **#40–#58**, **#66–#73** oraz 6 obszarów niezbadanych z audytu rundy 1.  
Pełna lista: `PLAN-NAPRAWCZY-AUDYT-20-POTWIERDZONE.md` § „Zakres — NIE”.

**Dla Fable (nie duplikować):**  
`#3 #4 #5 #6 #7 #8 #9 #34 #35 #36 #37 #38 #39 #59 #60 #61 #62 #63 #64 #65` + fix chatki.

---

## Jak sprawdzić po Ctrl+F5

1. **Stamp:** lewy dół → `ROBOCZA · aa380840`
2. **Chatka:** wejdź na chatkę → nagroda w WYDARZENIACH → zakończ turę → wpis znika, WYKONAJ działa
3. **AI:** obserwuj badania AI po awansie epoki — powinno wybierać kolejne techy
4. **Ekonomia:** suwak rozwoju 0% przy deficycie żywności — magazyn nadal maleje
5. **Mapa:** Nowa gra pangea — możliwe jeziora wewnętrzne; brak gór na wybrzeżu

---

*Ostatnia aktualizacja logu: 2026-07-21 (sesja lokalna — dokumentacja po pytaniu Macieja „czy wszystko w roboczej”)*
