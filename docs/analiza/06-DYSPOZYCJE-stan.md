# Analiza: dyspozycje/ — stan prac (2026-06-26)

Zródła przeanalizowane: `DZIENNIK-MASTERA.md`, `UI/MAPA/CYWILIZACJE/EKONOMIA-DO-MASTERA.md`, `EKONOMIA.md`/`UNITS.md`/`MAPA.md` (lane), 8 kontraktów `_handoff/`.

---

## 1. Per-lane — status

### MASTER (= silnik, wchłonął SILNIK)
- Właściciel: main.ts, kanon `Gra-podglad.html`, integracja, sędzia.
- Kanon: `8e180b7a` → `2276ec0f` (BATCH TOP-7, 2026-06-26). Bramka: 180/180 logic + smoke zielone, **poza** pre-existing `koszary-gate-test` (= znany oczekiwany czerwony, lazaret=Średniowiecze, przyszłość — NIE regresja).
- Ostatnie wpiecia (2026-06-26): sciencePicker nowe API, `walutaOdkryta` + flagi budynków z `builtIds` + `playerZbadane`, rozmiar mapy+rywale z menu, HUD +Praca/Kultura, overlay końca gry, diplomacyPanel+notyfikacje, save/load pełniejszy. P4 (atak z mapy) PARTIAL → przez preBattle (Pole bitwy=fallback auto; pełna BattleScene DEFERRED → UNITS kontrakt multi-unit).
- Otwarte u mastera: wpiecie multi-unit/posiłki/start oblężenia (po kontraktach UNITS), typ mapy+pełny generator (po MAPA `generujSwiat`), pełny `hud.ts` (po minimapie), mechanizacja bonusów cyw (rozdział per `realizuje`).

### UI (Civ-UI)
- Status: **v0.1 KOMPLET**. Moduły: `cityPanel` (pełnoekranowy), `empireBalance`, `hud`, `mainMenu`+ustawienia, `newGameFlow`, `orderPanel`, `diplomacyPanel` (stub, podgląd v0.1). Parametry: `ui-params.json` + `uiParams.ts` + `UI-parametry.xlsx`. Dokumentacja: `UI/Spec-UI.md`.
- Ostatnio: drzewko technologii (układ strefowy, N=0 przecięć, preview `Makieta-drzewko-uklad-bez-przeciec.html` — czeka na akceptację układu przez Macieja, sciencePicker.ts NIE dotknięty do akceptacji); minimapa HUD gotowa (haki `onMountMinimap`/`getMinimapData`); okno połącz-armie (`armyStackPrompt.ts`); makieta panelu armii (do akceptacji).
- Zasada (Maciej): **zero nowych UX bez potwierdzenia działu**. Standby.
- Wiszące decyzje: zasieg okolicy (potwierdzony `min(pop,15)`+kultura +0..3 → render B zaimpl.), 3-koszykowy "Mieszkańcy" (→ MIASTO helper `happinessBreakdown`), dług doc Spec-UI.

### MAPA (Civ-MAPA)
- Status: **render świata F1 zaakceptowany** (teren/rzeki-wierzcholkowe/delta/ocean/ramka); miasta kamień 10 poz. + **brąz 9 nacji** per-cyw (Grecja/Rzym/Sumer/Egipt/Inka/Aztek[zapas]/Chiny/Zulu/Celt/Niemiec); surowce-nakładki; **15 ulepszeń + `pole_irygowane`**; placement UX (klik+ghost-preview+kursor); WIDOK GŁÓWNY/HUD 13 el. + tryb Budowa; zasięg cywilizacji (linia C zaakceptowana 7A, render docelowy).
- Generator świata: **gotowy** — `generujSwiat(seed, rozmiar, typ)` + 3 typy (kontynenty/pangea/wyspy) + 5 rozmiarów (malenki~1000 … ogromny~20000) + losowy seed; InstancedMesh terenu (las/góry już instancjonowane, oazy doinstancjonowane); zsync do `gra/src`.
- Ruch jednostek: prototyp `Gra-podglad-RUCH.html` (klik-by-iść, ścieżka Dijkstra z numerami tur, pkt ruchu, min.1 pole, brak ZoC+hook reakcji, stacking, mgła) — gotowy, SILNIK wpina pathfinding w turze.
- Zakładanie miast z mapy: GOTOWE (tryb Budowa) + `isInTerritory(q,r)` wyeksportowane (`gra/src/map/territory.ts`, `cityRangeForPopulation=min(pop,15)`).
- Klaster: `clusters.ts` (`computeClusters`, format `ClusterPlacement`, min_dist adaptacyjny 4/6/8/9) — dla AI (pkt3).
- Wioska: kontrakt encji `WioskaEntity {q,r,typ,owner,populacja,przypisanaDoMiasta}` (stan heksu = MAPA).
- Wiszące: typ mapy z menu jeszcze niewpięty (tymczasowa tabela `mapSizeToDims` w main.ts ≠ kanon MAPA — reconcile 4 menu vs 5 generator); render nazw miast (po decyzji — 8B=TAK); podmiana stubów realnymi danymi MIASTO.

### CYWILIZACJE (Civ-CYWILIZACJE, przejęło DANE)
- Status: **Wszystko niezablokowane = domknięte**. Roster 9 typów w `civs.json` (+`typCywilizacji`+`archetyp`+`bonusy[]`+`religia`+`nazwyKlastra`+`mnoznikHandelPieniadz`+`ikonaId`). Dyplomacja: model 5 tierów (Wojna=STAN/Wrogi<30/Neutralny<60 start 50/Przyjazny<120/Sojusz≥120) + `relationTier()`+`TIER_NAMES` + `computeRespekt` (ratio-share, wagi 28/20/18/14/12/8 — zatwierdzone) + `tickDiplomacy` + `zerwanie_handlu`. AI: `ai.ts` (archetypy 7→9, `decideAIReaction` fight/flee, `decideAIReinforcements` 1-heks, `decideAIDiplomacy` T2=A pełna, `chooseAIResearch`, `loadDifficultyParams`, ekspansja klastrowa pkt3 GOTOWA ai-test 188/0). `victory.ts`, `barbarians.ts`. Targeted eksporty `export-civs.py`/`export-tech.py`/`export-diplomacy.py` (chronią pola).
- Decyzje T1-T4 ZAMKNIĘTE: T1=A Respekt, T2=A pełna dyplomacja AI, T3=A bonusy strukturalne (schemat `bonusy[]` gotowy, mechanizacja → rozdział per `realizuje`), T4=B spryt od trudności.
- Tech koszty: n monotononicznie n w epokach, bramki Bronzownictwo 45/Waluta 100/Sztuka wojenna 200; `tempo_gry` (×0.2/×1/×5) — `tech-tempo.ts`.
- Hamulce: wpiecie modułów AI do tury (master), enum `TypCywilizacji` wyrownany do 9 (ripple UI `newGameFlow` czyta `typGlowny` → master sprzątnie), fix Sumer→babilon w main.ts (3 miejsca: `c.typCywilizacji ?? c.ikonaId`).

### EKONOMIA (wchłonęło MIASTO — 2026-06-25)
- Status: **rdzeń tury WPIĘTY/testy zielone** (zdrowie WIRE, `splitPraca`, Luksus→Wealth, `growthMult`, compound +10% `buildingValue`/`buildingUpkeep`); `logic-test 191/191`; `wealth 25/25`; `upkeep 53/53`; `culture-religion 43/43`; `wire-ekonomia 23/23`; `okolica 16/16`.
- Model scalony (`EKONOMIA/EKONOMIA-model-scalony.md`): 2 suwaki / 4 kubełki (Skarbiec + Wealth + Badania + Praca osobno); pula nauki = EKONOMIA (`researchStep`); zdrowie WIRE (pełny model bonusy+minusy); nastroje = netto+tier (`getOrderState`, bez rozkładu).
- Okolica/terytorium: `cityRangeForPopulation = min(pop,15)` + kultura `cityBorderRadius` +0..3 (addytywnie, max 18) — decyzja 1B; plony TYLKO z pól z przypisanym obywatelem (`assignWorkedTiles`, N=pop). Kontrakt UI: `getCityWorkedRange`/`getWorkedTiles`.
- Oblężenie: flaga `city.oblegane` (dochód pól=0, `magazyn -= pop+garnizon`, atrycja 8%, kapitulacja przy magazyn≤0) — kontrakt do UNITS (`getCityFood`).
- Żelazo GO (1A): tech.json +9 techów, **9 budynków Żelaza** (Warsztat oblężniczy=Żelazo epoka 3, po korekcie Macieja 2026-06-26); surowce żelazo/stal → DANE/MAPA (OTWARTE). Waluta ×2 = **cała pula Handlu** (potwierdzone 2026-06-26; `economy.ts` mnoży `handelNetto` PRZED podziałem). Praca→Pieniądz z `doPuli` (nadwyżka) potwierdzone.
- Hamulce: surowce żelazo/stal (DANE/MAPA), `mnoznikHandelPieniadz` per-cyw (niski priorytet — Waluta×2 główny), `splitOutput` (MIASTO, niewpięty) vs kanon 2-suwakowy, dehydratacja OneDrive (lek: folder Civ → "Always keep on this device").

### UNITS (Civ-UNITS)
- Status: modele renderu jednostek (typeId w `UnitRenderer.sync`); machiny oblężnicze wg epok (Taran=Kamień in-siege, Wieża=Brąz in-siege, **Katapulta=Żelazo** wg Macieja — konflikt z dziennikiem mastera "Średniowiecze" → UNITS trzyma Żelazo, prośba do mastera o rozstrzygnięcie). Bitwa (`Gra-podglad-BITWA.html`) OSOBNO do v0.1; 10A scalenie do kanonu robi master.
- Robotnik USUNIĘTY (2A) → ulepszenia = akcja z mapy (UNITS spec; MAPA front; master akcja); Zwiadowca ZOSTAJE. Rename Legionista→Hastati/Triari (Żelazo) — zrobił master (batch 1A/2A).
- Granica (ostateczna): **Oblężenie = UNITS od startu** (nie dopiero plansza walki); MAPA = tylko ruch po mapie. UNITS: oblężenie (od startu) + plansza walki/przed-bitwa + `resolveCombat` (bonusy obrony: mur+200%/fort+100%/posterunek+50%, `structureDefenseBonusFor`) + taktyczna bitwa.
- DOSTARCZONE kontrakty (2026-06-26): **start oblężenia** (`_kontrakt-start-oblezenia.md`: akcja jawna "Oblężaj" gdy szturm / auto gdy blokada AI / auto-kapitulacja przy głodzie; garnizon = realne jedn.+milicja z populacji; kolejka machin 1/turę; szturm→bitwa; captureCity) + **walka multi-unit** (`_kontrakt-walka-multi.md`: skład = heks atak/obrona + posiłki ≤1 heks; 2 tory — AUTO dla AI vs AI i "Auto" gracza / TAKTYCZNA BattleScene; input `Unit[]`+struktury+`isSiege`, output winner+straty per jednostka).
- Hamulce: implementacja AUTO-rozstrzygania (algorytm siły efektywnej = propozycja, do zestrojenia z `Macierz-walki.xlsx`), model armii/merge/transfer/split (Total War, #170/#178 — UI makieta do akceptacji), UX bitwy Q2-Q7 (idziemy po kolei, 10B).

---

## 2. 12 otwartych wątków cross-lane (z DZIENNIK-MASTERA tablica kontrolna)

| # | Wątek | Właściciel(e) | Status | Czeka na | Następny krok |
|---|---|---|---|---|---|
| 1 | NAUKA = pula STEROWANA GRACZEM (1a) | EKONOMIA + master(research.ts) | **WPIĘTE** (batch 3, sciencePicker drzewko) | akceptacja układu drzewka (Maciej) | port algorytmu bez przecięć → sciencePicker.ts |
| 2 | Dostęp surowców = boolean (złoże+ulepsz.+przetwórczy) | MAPA+EKONOMIA+DANE | ROBIĄ | — | pole dostępu + zasięgi |
| 3 | Zasięgi terytorium (radius=pop, cap 15; fort +10/posterunek +5) | EKONOMIA(formuła)+MAPA(egzekwuje) | **WPIĘTE** (`cityRangeForPopulation`) | — | — |
| 4 | Bonusy obrony struktur (mur+200/fort+100/posterunek+50, obozowanie) | UNITS(walka)+EKONOMIA(maMur)+silnik | **WPIĘTE** (`structureDefenseBonusFor`) | — | scal do multi-unit (UNITS kontrakt dany) |
| 5 | Mnożnik Handel→Pieniądz (baza 2, Waluta ×2 cała pula) + Mennica | EKONOMIA+CYWILIZACJE(per-cyw) | **WPIĘTE** (×2 cała pula, 2026-06-26) | — | per-cyw 1.7-2.4 (niski priorytet) |
| 6 | Widok główny / HUD w grze | MAPA(gotowe)+silnik | BLOK | minimapa (UI↔MAPA wariant A/B) | wybór wariantu MAPA → wpiecie pełnego hud.ts |
| 7 | Plaster EKONOMIA(miasto)+UI | silnik | GOTOWE-do-wpiecia | (duzo wpięto) | resztka splitPraca/bramka teryt. |
| 8 | Wealth | EKONOMIA(szkielet)+silnik | **WPIĘTE** (szkielet+test 25/25, model scalony) | — | dostrojenie |
| 9 | Ulepszenia terenu + posterunki (render gotowy) | MAPA(gotowe)+EKONOMIA(bonusy)+silnik | BLOK | akcja "buduj ulepszenie z mapy" (master, po 2A Robotnik usunięty) | wpiecie akcji |
| 10 | AI: archetypy 7→9 + harness + heurystyka nauki | CYWILIZACJE | **GOTOWE** (ai-test 188/0) | decyzja o wpieciu do tury (master) | wpiecie (`ai-wpiecie.md`) |
| 11 | Bitwa→kanon (10A) + UX bitwy | UNITS+silnik | BLOK | kontrakt multi-unit **DANY** (2026-06-26) + UX Q2-Q7 po kolei | wpiecie AUTO-rozstrzygania + BattleScene |
| 12 | Nowe jednostki render + oblężenie wg epok | UNITS | ROBIĄ | rozstrzygnięcie Katapulta Żelazo vs Średniowiecze | modele + epoki w units.json |

---

## 3. Decyzje zablokowane (czekają na Macieja / mastera)

**OD MACIEJA (merytoryka — odblokowują):**
- **Katapulta: Żelazo (UNITS/Maciej wprost) vs Średniowiecze (dziennik mastera)** — konflikt; UNITS trzyma Żelazo, prośba do mastera o rozstrzygnięcie (2026-06-26).
- **Drzewko technologii — układ bez przecięć**: preview `Makieta-drzewko-uklad-bez-przeciec.html` → akceptacja układu przed portem do `sciencePicker.ts`.
- **Panel armii (Total War #170/#178)**: makieta `Makieta-panel-armii.html` → akceptacja PRZED implementacją.
- **Miasta BRAZU (Sumer/Egipt/Inkowie/Zulusi)**: Maciej chce ZOBACZYĆ podgląd 4 nacji przed wpieciem (8B); nazwy miast na mapie = TAK (8B).
- **UX bitwy Q2-Q7** (10B): po kolei, master pyta 1 ABC na raz.
- **Defaulty startu gry cross-lane**: cyw gracza (DANE), trudność (AI), tempo (EKONOMIA/CYW), epoka startu (Kamień?) — do potwierdzenia przez właścicieli.
- **Surowce żelazo/stal** → DANE/MAPA (EKONOMIA tylko flaguje).
- **Mieszkańcy 3-koszykowy** → helper `happinessBreakdown` od MIASTO/EKONOMIA (3A=netto+tier, bez rozkładu — więc prawdopodobnie NIE w v0.1).

**OD MASTERA (technika — wpiecia/kontrakty):**
- Wpiecie **multi-unit combat** + **start oblężenia** (kontrakty DANE, batch gotowy do dopięcia).
- Wpiecie **typu mapy + pełnego generatora** (`generujSwiat`) — podmiana tymczasowej `mapSizeToDims` (4 menu vs 5 generator — reconcile).
- Wpiecie **pełnego hud.ts** — po wyborze wariantu minimapy (UI↔MAPA).
- Wpiecie **modułów AI** do tury (`ai-wpiecie.md`: ai/victory/barbarians + chooseAIResearch + loadDifficultyParams + decideAIDiplomacy + decideAIReaction + decideAIReinforcements + tickDiplomacy + computeRespekt).
- Fix **Sumer→babilon** w main.ts (3 miejsca `c.typCywilizacji ?? c.ikonaId`).
- **Mechanizacja bonusów cyw** (T3=A) — rozdział 23/1/3 do UNITS/MIASTO(=EKONOMIA)/EKONOMIA.
- Akcja **"buduj ulepszenie z mapy"** (po 2A, Robotnik usunięty) — MAPA front + master akcja.
- `splitOutput` (MIASTO) vs kanon 2-suwakowy — do pogodzenia w `EKONOMIA-model-scalony.md` §9.

---

## 4. Podsumowanie kontraktów _handoff/ (8 plików)

| Plik | Od → Do | Treść | Status |
|---|---|---|---|
| `UNITS-do-MASTER_kontrakt-start-oblezenia.md` | UNITS→MASTER | Start oblężenia: akcja jawna "Oblężaj" przy szturmie / auto `oblegane=true` przy blokadzie AI / auto-kapitulacja przy głodzie; garnizon = realne jedn.+milicja z populacji; HP per jedn. (atrycja 8%, próg 30-40%); kolejka machin 1/turę; szturm→bitwa; captureCity. Konsumuje EKONOMIA `city.oblegane`/`getCityFood`. | DOSTARCZONY 2026-06-26, czeka na wpiecie |
| `UNITS-do-MASTER_kontrakt-walka-multi.md` | UNITS→MASTER | Walka grupowa: skład = heks atak + heks obrona + posiłki ≤1 heks per strona; 2 tory (AUTO dla AI vs AI + "Auto" gracza / TAKTYCZNA BattleScene); input `{attacker[],defender[],teren,struktury,isSiege}`, output `{winner, straty per jedn., ocaleli}`. AUTO = świadomie osobny model (algorytm siły efektywnej = propozycja, do zestrojenia z `Macierz-walki.xlsx`). | DOSTARCZONY 2026-06-26, czeka na wpiecie |
| `UNITS-do-MASTER_odp-subagenci-katapulta-kontrakty.md` | UNITS→MASTER | Odp.: TAK-subagenci-Sonnet. **Katapulta=Żelazo** (Maciej wprost) — konflikt z dziennikiem "Średniowiecze"; UNITS trzyma Żelazo, prośba o rozstrzygnięcie. Zapowiedź 2 kontraktów (start oblężenia + multi-unit). | DOSTARCZONY 2026-06-26 |
| `MAPA-do-MASTER_domyslne-decyzje-nowa-gra.md` | MAPA→MASTER→UI | Defaulty menu "Nowa gra": Typ=Kontynenty, Rozmiar=Średnia (84×60 kanon, 50×36 tymczasowe w main.ts), Seed=losowy, rywale auto (3/5/7/9), min_dist auto (4/6/8/9). Cross-lane defaulty (cyw/trudność/tempo) → do potwierdzenia przez właścicieli. | DOSTARCZONY 2026-06-26 |
| `MAPA-do-MASTER_generator-swiat.md` | MAPA→MASTER | API `generateMap(w,h,seed,typ?)` + `generujSwiat(seed,rozmiar,typ)`; `TypSwiata='kontynenty'|'pangea'|'wyspy'`; tabela rozmiar→heksy (malenki 38×26 ~988 … ogromny 168×119 ~19992); 3 typy lądu opisane; follow-up [WYSOKI]: dekoracje (improvements/resources) nie-instancjonowane → ryzyko FPS przy 20k; [NISKI] computeStartPositions O(n²). | DOSTARCZONY 2026-06-26 |
| `UI-do-MASTER_minimapa-wspolpraca-MAPA.md` | UI→MASTER→MAPA | Minimapa HUD: 2 warianty — A (`onMountMinimap`, MAPA renderuje WebGL do slotu) / B (`getMinimapData`, UI rysuje siatkę z danych). **Rekomendacja B** (MAPA zakładała UI rysuje; buildScene 516kB za ciężki do duplikacji). Pytanie ABC do MAPA. UI gotowe obie ścieżki; pełny hud.ts wpiecie master DOPIERO po decyzji. | DOSTARCZONY 2026-06-26, czeka na wybór MAPA |
| `CYWILIZACJE-do-MASTER_bonusy-mechanizacja.md` | CYWILIZACJE→MASTER→(UNITS/MIASTO/EKONOMIA) | T3=A potwierdzone. Schemat `bonusy[]` w civs.json GOTOWY (27 efektów: **23 walka→UNITS**, **1 miasto→MIASTO** (Rzym -20% koszt budowli), **3 ekonomia→EKONOMIA** (Grecy +15% złoto handel, Inkowie +15% nauka, Zulusi -10% koszt Impi)). Mechanizacja per `realizuje`. Wartości wstępne → korekta Maciej+działy. | DOSTARCZONY 2026-06-25, czeka na rozdział |
| `CYWILIZACJE-do-MASTER_start-pkt3.md` | CYWILIZACJE→MASTER | civs.json start-ready (`typCywilizacji`+`archetyp`+`bonusy[]`). Fix Sumer→babilon w main.ts (3 miejsca: `c.typCywilizacji ?? c.ikonaId`). pkt3 ekspansja klastrowa GOTOWA (ai-test 188/0): `findSettlerTarget` biasuje osadnika ku klastrowi (+50 w / −20 poza); wpiecie po `computeClusters()` z `{clusterCenter, clusterRadius}`. | DOSTARCZONY 2026-06-25, fix main.ts czeka na mastera |

---

## 5. Co każdy lane "dłużny" (do dostarczenia / domknięcia)

**UI dłużny:**
- Po akceptacji układu drzewka (Maciej): port algorytmu bez przecięć do `sciencePicker.ts`.
- Dostosowanie `cityPanel` po decyzjach: `getBuiltBuildingLevels` (gating "Ulepsz" po epoce), Dyplomacja realne tiery/dane.
- Po decyzji minimapy (MAPA wybiera A/B): pełny `hud.ts` gotowy do wpiecia.
- Po akceptacji makiety panelu armii (#170/#178): implementacja modułu (logikę da UNITS).
- Dług doc Spec-UI (diplomacyPanel + nowe haki) — na "tak" Macieja.

**MAPA dłużny:**
- Wybór wariantu minimapy (A/B) → odpowiedź `MAPA-do-MASTER_minimapa-wybor-wariantu.md`.
- Reconcile rozmiarów menu (4) vs generator (5) + podmiana `mapSizeToDims` → `generujSwiat` (po stronie mastera, ale MAPA dostarcza mapping nazw menu→rozmiar).
- Render nazw miast na mapie (8B=TAK) — podpiąć z `nazwyKlastra`.
- Podmiana stubów (`isInTerritory` już eksportowany; rozwój miast realnymi danymi MIASTO/EKONOMIA).
- Follow-up [WYSOKI]: instancjonowanie `improvements.ts`/`resources.ts` przy 20k heksów.
- (NISKI) `computeStartPositions` O(n²) → spatial grid.

**CYWILIZACJE dłużny:**
- (Wszystko niezablokowane = domknięte.) Czeka na: wpiecie modułów AI do tury (master), fix Sumer w main.ts (master), mechanizacja bonusów rozdzielona (UNITS/EKONOMIA implementują swoje `realizuje`).
- Opcjonalnie: korekta proponowanych liczb (mnozniki 1.7-2.4, bonusy trudności), globalny mnoznik tempa nauki dla trudności (opcja EKONOMIA).

**EKONOMIA dłużny:**
- Surowce żelazo/stal → koordynacja z DANE/MAPA (EKONOMIA tylko flaguje w tech-handoff).
- Pogodzenie `splitOutput` (MIASTO, niewpięty) vs kanon 2-suwakowy — `EKONOMIA-model-scalony.md` §9.
- Dostrojenie Wealth (szkielet wpięty, dane w `econ-params.json` grupa `wealth`).
- `mnoznikHandelPieniadz` per-cyw (niski priorytet — Waluta ×2 główny).
- Lek: folder Civ → "Always keep on this device" (odblokuje build/test, dehydratacja OneDrive).

**UNITS dłużny:**
- Implementacja **AUTO-rozstrzygania** (algorytm siły efektywnej = propozycja z kontraktu, do zestrojenia z `Macierz-walki.xlsx`).
- **Model armii + merge/transfer/split/remove** (Total War) + kontrakt operacji do UI (`transfer/split/mergeWounded/remove`).
- **UX bitwy Q2-Q7** — przygotować pytania 1 ABC każde (master pyta Macieja po kolei, 10B).
- Rozstrzygnięcie Katapulta (Żelazo vs Średniowiecze) — do mastera/Macieja.
- (Po 2A) spec akcji "buduj ulepszenie z mapy" (typy, koszt z puli Pracy, warunki) → MAPA front + master akcja.

**MASTER dłużny (technika — wpiecia):**
- Wpiecie multi-unit + start oblężenia (kontrakty dane).
- Wpiecie pełnego generatora (`generujSwiat`) + typ mapy z menu + reconcile rozmiarów.
- Wpiecie pełnego `hud.ts` (po minimapie).
- Wpiecie modułów AI do tury + fix Sumer→babilon w main.ts (3 miejsca).
- Rozdanie mechanizacji bonusów (23/1/3) do UNITS/EKONOMIA.
- Akcja "buduj ulepszenie z mapy" w turze.
- Pogodzenie `splitOutput` vs 2-suwakowy kanon.

---

## Krótkie podsumowanie

Projekt The Game (Civ) jest w fazie **v0.1 domknięcie** — kanon grywalny (`2276ec0f`, 180/180 zielono poza znanym czerwonym koszary-gate/lazaret=przyszłość). 4 główne lane (UI/MAPA/CYWILIZACJE/EKONOMIA) są w stanie **KOMPLET/domknięte** w swoich zakresach; EKONOMIA wchłonęła MIASTO. Główne hamulce to teraz **strona mastera** (wpiecia kontraktów już dostarczonych: multi-unit, start oblężenia, pełny generator, pełny HUD, moduły AI, mechanizacja bonusów) + kilka **decyzji Macieja** (Katapulta epoka, akceptacja drzewka/panelu armii/4 miast BRAZU, defaulty startu cross-lane, UX bitwy Q2-Q7 po kolei). 12 otwartych wątków cross-lane — 5 już WPIĘTYCH (#1,3,4,5,8), reszta BLOK na decyzjach/wpieciach. Najpilniejsze: rozstrzygnięcie konfliktu Katapulta (Żelazo vs Średniowiecze) + wpiecie kontraktów UNITS (multi-unit/oblężenie), bo odblokują grywalną pętlę bitewną.

---
