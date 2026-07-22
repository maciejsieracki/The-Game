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

---

# NAPRAWY audyt-53 — 51 bledow przez subagentow Sonnet (2026-07-22)

> Orkiestracja: Fable; 1 bug = 1 subagent Sonnet; rownolegle miedzy plikami, sekwencyjnie w main.ts.
> INCYDENT: rownolegle commity integratora (14:07-14:39) nadpisaly czesc napraw w working tree — uratowane ze stashy i commitow (A/B/C/D: 6f11b3f, 55d7597, bb9d264, d6837e1); inwentaryzacja subagentem potwierdzila 50/51 obecnych, #71 odtworzone. LEKCJA: blokada w kanale + commit per grupa NATYCHMIAST.
> BRAMKI (stan scalony): tsc=0 · combat 6/6 · tech-tree 19/0 · research GREEN · unit-replace 10/10 · logic-test: 6 faili player-research — DLUG INTEGRATORA po balansie badania x2 (94b7f6d), fixture oczekuje starych kosztow; na jego stanie bez napraw bylo 14 faili → naprawy POPRAWILY bramke. TODO integrator: zaktualizowac oczekiwania testu x2.
> Poza zakresem: #22 (juz naprawione b1a7a61), #41 Wielka Kuznia (decyzja Macieja), #26 = JUZ-NAPRAWIONE.

| # | Waga | Blad | Rozwiazanie | Status |
|---|---|---|---|---|
| #2 | krytyczna | Auto-szturm kasuje CAŁĄ armię obu stron (survivors: [] = zerowi ocalali) | Bug #2 [KRYTYCZNA]: auto-szturm kasował CAŁĄ armię obu stron… | ✅ |
| #1 | wysoka | Koszyk PN: oddanie 'jednostka' nic nie kosztuje dawcy — darmowy zakup zasobow AI | Naprawa #1 (audyt-53, etap 1 wg decyzji A1=A: "ukryć pozycję + defensywne odrzucenie w silniku, z TODO")… | ✅ |
| #10 | wysoka | 25 jednostek bez pol EN armor/piercing/chargeBonus — walcza z pancerzem 0 | Blad #10 potwierdzony w kodzie (25/73 jednostek w units.json bez pol EN armor/piercing/chargeBonus -> resolver walki uzywal ich z fallbackiem 0)… | ✅ |
| #11 | wysoka | Super-jednostki (koszt 0, 'max 1, bezplatna') masowo produkowalne za 10 Pracy | Blad #11: dane w gra/data/units.json byly juz poprawne z designu (np… | ✅ |
| #12 | wysoka | Klawisz N odblokowany podczas zawieszonej fazy AI (modalna bitwa) — podwojna tura | Naprawiono #12 [WYSOKA]: klawisz N (End turn) byl odblokowany podczas zawieszonej fazy AI (modalna bitwa AI-atakuje-gracza), co pozwalalo wystartowac druga ture przy wiszacym preBattle -> podwojna ekonomia/AI + konsumpcj… | ✅ |
| #13 | wysoka | Wioski (goodie-huts) nie sa zapisywane — save/load wskrzesza zlupione wioski (exploit) | Bug #13 — wioski (goodie huts) nie byly zapisywane w save/load, co pozwalalo wskrzeszac zlupione wioski (nieskonczone zloto/tech/jednostki) przez wyjscie do menu + load albo swiezy start + load (regenerateWorldForLoad od… | ✅ |
| #14 | wysoka | battlePowerPtsByOwner bez resetu przy nowej grze — zombie-potega z poprzedniej rozgrywki | Plik: gra/src/main.ts, funkcja doStartGame (blok resetu stanu nowej gry)… | ✅ |
| #15 | wysoka | Profile miast-panstw (typCityCopyOwners i pokrewne zbiory) nie sa zapisywane ani odtwarzane | Blad #15: profile miast-panstw/klastrow (simplifiedDiplomacyOwners, foreignTypeOwners, typCityCopyOwners, clusterCapitalOwnerIds, clusterPlacement) byly wypelniane WYLACZNIE w applyClusterStartPlan/spawnPendingSameTypeRi… | ✅ |
| #16 | wysoka | Dyplomacja: Zaufanie za dar/handel bez pokrycia w zasobach (darmowy trust co ture) | Blad #16 (Dyplomacja: Zaufanie za dar/handel bez pokrycia w zasobach) potwierdzony w kodzie sanity-checkiem (linie przesuniete wzgledem raportu ~6667 -> ~6989-7091, ale tresc/logika identyczna z werdyktem)… | ✅ |
| #17 | wysoka | Panel miasta: Bilans plonow liczony bez efektow budynkow, Waluty, bonusow cyw… | Bug #17 potwierdzony w kodzie (werdykt AUDYT-WERYFIKACJA-53-WERDYKTY.md, sekcja "#17")… | ✅ |
| #18 | wysoka | Pasek armii: pasek HP kart zawsze 100% — ranne jednostki wygladaja na zdrowe | Bug #18 (pasek HP kart armii zawsze 100%) — plik gra/src/main.ts, funkcja buildArmyStackHudState()… | ✅ |
| #19 | wysoka | Odwrocona bramka wasalizacji: sprawdza Respekt respondenta zamiast proponenta | Naprawiono odwróconą bramkę wasalizacji w gra/src/game/diplomacy-proposals.ts, case 'wasal' (linia 534)… | ✅ |
| #20 | wysoka | Kurs Rel/100 dziala w kazdym dealu na korzysc proponenta — pompa zlota przy Relacji > 100 | Naprawiono #20 [WYSOKA]: "Kurs Rel/100 dziala w kazdym dealu na korzysc proponenta — pompa zlota przy Relacji > 100"… | ✅ |
| #21 | wysoka | Zadanie trybutu: brak limitu kwoty i brak guardu duplikatu — trybuty stackuja sie co ture | Bug #21: case 'trybut_zadanie' w evaluateProposal (gra/src/game/diplomacy-proposals.ts) miał tylko dolny próg kwoty i próg Respektu — brak górnego limitu kwoty i brak guardu duplikatu, więc AI/gracz mogli żądać trybutu c… | ✅ |
| #24 | wysoka | Miasto-panstwo atakuje posilki sojuszniczej siostry (filtr sojuszu tylko w detekcji zagrozenia) | Bug #24: w funkcji decideDefensiveCopyTurn (gra/src/game/ai.ts, wewnatrz petli AI miasta-panstwa) filtr sojuszu siostrzanego (nonSisterEnemyUnits, zdefiniowany juz wczesniej w linii 1377) byl uzywany WYLACZNIE w wyborze… | ✅ |
| #26 | wysoka | Stan podsystemu miast-panstw/klastrow (typCityCopyOwners, clusterPlacement itd.) nie jest zapis… | Zero zmian w kodzie — defekt #26 był już naprawiony w drzewie roboczym (niescommitowane zmiany main.ts, oznaczone komentarzem "Audyt #15", bo #15 i #26 to ten sam defekt w planie naprawczym: "#15+#26 profile miast-panstw… | ℹ️ już był |
| #28 | wysoka | computePath bez limitu promienia: nieosiagalny cel = flood calego kontynentu, 2x per jednostka… | Naprawiono #28 w gra/src/units/setup.ts, funkcja computePath (Dijkstra, linie ~652-798)… | ✅ |
| #29 | wysoka | findSettlerTarget: pelny skan mapy x allCities.some(hexDistance) per osadnik per tura | Blad #29 (WYSOKA): findSettlerTarget: pelny skan mapy x allCities.some(hexDistance) per osadnik per ture… | ✅ |
| #31 | wysoka | AI nigdy nie buduje budynków — komendy 'build' używają nazw, lookup idzie po id | #31 [WYSOKA] AI nigdy nie buduje budynkow — POTWIERDZONE i NAPRAWIONE… | ✅ |
| #32 | wysoka | Upgrade Koszary→Akademia wojskowa odbiera miastu rekrutację jednostek Brązu | Plik: gra/src/game/production.ts (2 miejsca)… | ✅ |
| #33 | wysoka | Bramki brązu/żelaza bez właściciela — kopalnia AI odblokowuje surowce gracza | Bug #33: `placedImprovements` (main.ts) to JEDNA globalna Map<hexKey, string[]> bez ownera… | ✅ |
| #23 | srednia | Atrycja garnizonu przy oblężeniu zmienia licznik pochodny — bez realnego efektu | Naprawiono #23 (SREDNIA): atrycja garnizonu przy oblezeniu zmieniala wylacznie pochodny licznik `oblCity.garnizon`, bez zadnego realnego efektu (zadna jednostka nie traci HP/nie ginie), bo licznik byl i tak nadpisywany p… | ✅ |
| #25 | srednia | Odbicie miasta rebeliantow = falszywa ELIMINACJA frakcji -99 + powtarzalne Power-zdobycze (expl… | Plik: gra/src/main.ts, funkcja runCapitalCapturePlunder (obecnie linia ~10384, wołana z applyCityCaptureToMap po walce i z resolveSiegeSurrender po kapitulacji z głodu — jedyne dwa call site'y)… | ✅ |
| #27 | srednia | cityFogVisible: pelne currentVisible() liczone osobno dla kazdego obcego miasta przy kazdym syn… | Naprawa #27 (cityFogVisible — N-krotne przeliczanie currentVisible() per sync) w gra/src/main.ts… | ✅ |
| #30 | srednia | mousemove: pelne currentVisible() przy kazdym zdarzeniu ruchu myszy z zaznaczona jednostka | Blad #30: handler `canvas.addEventListener('mousemove', ...)` w gra/src/main.ts (obecnie ok… | ✅ |
| #42 | srednia | barbCamps nie jest ani zapisywane, ani resetowane przy wczytaniu zapisu | Naprawiono #42 [SREDNIA]: barbCamps nie bylo ani zapisywane w snapshot, ani resetowane/odtwarzane przy wczytaniu zapisu (main.ts)… | ✅ |
| #43 | srednia | cityRelig (religia miast) nigdy nie czyszczona i nie zapisywana — zombie przez kolizje id 'city… | Naprawiono #43: cityRelig (Map<string,ReligionState>, main.ts ~1347) i autoManageCities (Set<string>, main.ts ~3765) nigdy nie byly czyszczone przy nowej grze ani zapisywane/odtwarzane przy save/load — poniewaz id miast… | ✅ |
| #44 | srednia | aiSkarbiecByOwner czyszczone przy load bez odtworzenia — skarbce AI zeruja sie po wczytaniu | Naprawa #44 (SREDNIA): `aiSkarbiecByOwner` bylo czyszczone przy wczytaniu zapisu bez odtworzenia (asymetrycznie wzgledem juz istniejacego wzorca dla aiPracaPoolByOwner/aiNaukaPoolByOwner/aiBadanaByOwner) -> skarbiec zlot… | ✅ |
| #45 | srednia | Koszyk dyplomacji: pozycja 'Zywnosc (spichlerz)' martwa — silnik nigdy nie podaje cityOptions | Bug #45: pozycja koszyka PN "Zywnosc (spichlerz)" byla martwa, bo getNegotiationContext (gra/src/main.ts, wewnatrz funkcji budujacej config audiencji, ~linia 7336-7355) nigdy nie ustawial pola cityOptions z NegotiationMo… | ✅ |
| #46 | srednia | Prawo wojskowego przemarszu: odwrocona bramka Respektu (responder zamiast proponenta) | Blad #46: w case 'granice' (Prawo wojskowego przemarszu), funkcja evaluateProposal w diplomacy-proposals.ts, linia 515 (przed zmiana; kod otoczenia niezmieniony) — bramka Respektu sprawdzala ctx.responderRespekt zamiast… | ✅ |
| #47 | srednia | Koszyk 'praca': AI nigdy nie traci pracy, a praca gracza trafia do skarbca zlota AI | Naprawiono #47 (Koszyk 'praca': AI nigdy nie traciło Pracy, a Praca gracza trafiała do skarbca złota AI) w gra/src/main.ts… | ✅ |
| #48 | srednia | Moc wyeliminowanej cywilizacji liczona podwojnie w mianowniku dominacji (jednostki-sieroty) | Bug #48 [ŚREDNIA]: Moc wyeliminowanej cywilizacji liczona podwójnie w mianowniku dominacji (jednostki-sieroty)… | ✅ |
| #49 | srednia | Petla porzadku/szczescia liczy miasta AI epoka i technologiami GRACZA | Blad #49: petla porzadku/szczescia w main.ts (sekcja "MIASTO: produkcja / porzadek / kultura / religia", `for (const city of cities)`) liczyla epoke i technologie GRACZA (player.era, player.zbadane) dla WSZYSTKICH miast… | ✅ |
| #50 | srednia | Machiny konsumowane PRZED potwierdzeniem szturmu — anulowanie preBattle je traci | Bug #50 potwierdzony w kodzie (sanity-check zgodny z werdyktem) i naprawiony minimalnie, wg wariantu A z planu ("konsumować dopiero po potwierdzonym szturmie")… | ✅ |
| #51 | srednia | Machiny wnoszą ZERO do mocy auto-szturmu (rola Oblężnicza → M=0); siegePower() martwe | BLAD #51 potwierdzony w kodzie (zgodnie z werdyktem) i naprawiony… | ✅ |
| #52 | srednia | AI ocenia siłę oblężenia na PEŁNYM HP — runtimeUnitToSiegeUnit ignoruje u.hp | Bug #52: runtimeUnitToSiegeUnit (gra/src/main.ts, funkcja ok… | ✅ |
| #53 | srednia | Szanse preBattle z Milicją liczone na fallbacku 'wojownika', wynik na realnej Milicji | Naprawa #53 w gra/src/battle/mapFieldBattle.ts (funkcja planOpenCityFieldBattle, ok… | ✅ |
| #54 | srednia | Negacja szarży po substringu NAZWY zamiast pola Typ — elitarni włócznicy nie brakują | Plik: gra/src/game/combat.ts, funkcja negatesCharge (linie ~538-544 przed zmianą)… | ✅ |
| #55 | srednia | Odbite miasto rebeliantow na zawsze zachowuje rebelState=true (stan nigdy nie czyszczony) | Naprawiono #55 [SREDNIA]: pole City.rebelState nigdzie nie bylo czyszczone po odbiciu miasta rebeliantow, wiec zostawalo true na zawsze (wieczny immunitet na kolejna rebelie, blokada migracji buntowniczej main.ts:11858… | ✅ |
| #56 | srednia | findNearestVillage: alokacja Object.keys(320k) + pelny skan mapy per jednostka wojskowa AI | Plik: gra/src/game/ai.ts… | ✅ |
| #57 | srednia | syncVillageMeshes: skan WSZYSTKICH heksow mapy przy kazdym refreshFog | Bug #57 (main.ts): syncVillageMeshes skanowało WSZYSTKIE heksy mapy (`for (const hexKey in map.hexes)`) przy każdym refreshFog (34 miejsca wywołania w pliku), mimo że wioski neutralne są tworzone RAZ przy generacji mapy… | ✅ |
| #58 | srednia | Spawn z produkcji/rekrutacji czyta pole 'Super' zamiast 'Super-jednostka' | Naprawiono #58 [SREDNIA]: spawn jednostek z produkcji/rekrutacji/wioski czytal nieistniejace pole 'Super' (zawsze fallback 0 -> isSuper zawsze false), zamiast poprawnego pola danych 'Super-jednostka' (wartosc string 'TAK… | ✅ |
| #40 | niska | Wyjscie do menu w trakcie bitwy nie resetuje ambBattleMuted — nowa gra z niema natura | Naprawiono #40 (NISKA/przy okazji, wg ZLECENIA-AUDYT-53.md F2): brak resetu flagi ambBattleMuted przy wyjściu do menu głównego w trakcie bitwy, co mogło skutkować niemą naturą w kolejnej grze… | ✅ |
| #66 | niska | Tech-kamien milowy z handlu dyplomatycznego nie awansuje epoki gracza | Blad #66 (main.ts, transfer koszyka dyplomatycznego, case 'tech'): gdy toOwnerId === 0 (gracz) dostawal tech-kamien milowy, kod robil WYLACZNIE `player.zbadane.add(t)` w petli po zsynchronizowanym zbiorze badan — nigdy n… | ✅ |
| #67 | niska | Procarz (Huaracoc) ma Typ=Distance, choc zastepuje Procarza o Typ=Slinger | Bug #67 [NISKA]: rekord "Procarz (Huaracoc)" (gra/data/units.json, obiekt zaczynajacy sie linia 1179, "W zamian za": "Procarz") mial pole "Typ": "Distance" (linia 1211), podczas gdy zastepowany przez niego bazowy "Procar… | ✅ |
| #68 | niska | CameraController tworzony bez dispose() poprzedniego — akumulacja listenerow na canvas/window | Bug #68: CameraController tworzony bez dispose() poprzedniego — akumulacja listenerów mousedown/wheel na canvas oraz mousemove/mouseup/keydown/keyup na window przy każdym restarcie gry (nowa gra/load/playtesty)… | ✅ |
| #69 | niska | Menu pauzy: 'Wczytaj gre' pozostaje zablokowane po pierwszym zapisie w tej sesji menu | Naprawiono #69 (menu pauzy: „Wczytaj grę" pozostaje zablokowane po zapisie w tej sesji menu)… | ✅ |
| #70 | niska | Panel miasta pokazuje wplyw religii na szczescie bez bramki swiatyni — rozjazd z silnikiem | Naprawiono #70: gra/src/main.ts, funkcja getReligionState (linia ~2876-2892, wywolanie religionHappiness poprzednio linia 2886)… | ✅ |
| #71 | niska | assignAiCivTypes: nadmiarowi AI dostaja identyczny typ spoza wylosowanej puli aktywnych | Plik: gra/src/game/civ-roster.ts, funkcja assignAiCivTypes, linie ~101-107 (przed naprawą)… | ✅ |
| #72 | niska | Śmierć z głodu usuwa jednostki bez sprzątania oblężenia i sync garnizonu | Bug #72 (NISKA) w gra/src/main.ts — blok obsługi śmierci z głodu wojska gracza (wywołanie applyArmyStarvationHpLoss w sekcji EmpireFood, wewnątrz `if (starv.destroyedIds.length > 0) { ..… | ✅ |
| #73 | niska | _removeStatChip dispose'uje teksture wspoldzielona z statTexCache; cache serwuje martwe tekstur… | Plik: gra/src/render/cities.ts, metoda _removeStatChip (linie ~581-590)… | ✅ |
