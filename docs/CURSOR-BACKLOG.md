# CURSOR — BACKLOG (Civ / "The Game")

> Actionable backlog dla projektu gry 4X "The Game" (Civ) w środowisku Cursor.
> Zbudowany na podstawie `dyspozycje/DZIENNIK-MASTERA.md` (REJESTR PRZEPŁYWÓW + decyzje), `Status-projektu-The-Game.xlsx` (zakładka "Status wg grup"), kontraktów `dyspozycje/_handoff/`, oraz `BACKLOG-PELNY.md`.
>
> Każde zadanie ma: **ID, lane, priorytet (P0-P3), status, przypisaną rolę (GLM/Composer/Opus/Maciej), zależności, kryteria akceptacji (AC)**.
> Grupowanie: **BLOCKED (Maciej)**, **READY (można zacząć teraz)**, **IN PROGRESS**, **DONE**.
>
> **Data:** 2026-06-26 (treść backlogu) · **Kanon zaktualizowany:** 2026-07-01. **AKTUALNY KANON:** `4602e752d7e4b21f3c2460e494e82a8f` (`2276ec0f` *(stary — patrz AKTUALNY KANON)*). **Autor:** GLM 5.2 (Agent).

---

## Legenda

- **Priorytet:** P0 (krytyczne, blokuje grywalność/inne) · P1 (wysoki) · P2 (średni) · P3 (niski/polish)
- **Status:** BLOCKED · READY · IN PROGRESS · DONE · DEFERRED
- **Rola:** GLM (plan/ADR/kontrakt) · Composer (kod/integracja) · Opus (review) · Maciej (decyzja/playtest)
- **Lane:** SILNIK · EKONOMIA · MIASTO · UNITS · UI · DANE · AI · DYPLOMACJA · MAPA · CYWILIZACJE
- **AC:** kryteria akceptacji (definicja "done")

---

## 🔴 BLOCKED (czeka na Macieja)

### BLK-01 — Widok główny / HUD w grze (wątek #6)
- **Lane:** MAPA + SILNIK
- **Priorytet:** P0
- **Status:** BLOCKED
- **Czeka na:** Maciej — akceptacja układu HUD (6B)
- **Rola:** Maciej (decyzja D1) → Composer (wpiecie)
- **Zależności:** `isInTerritory` (już wyeksportowane przez MAPA)
- **AC:**
  - [ ] Maciej akceptuje układ HUD (A/B/C — rekomendacja A)
  - [ ] SILNIK wpięcie widoku głównego do `main.ts`
  - [ ] Granica C renderowana przez MAPA
  - [ ] Bramka testów zielona (poza koszary-gate baseline-red)
  - [ ] Kanon zbudowany do `/tmp/civ-dist` + skopiowany jako `Gra-podglad.html`

### BLK-02 — Plaster EKONOMIA+UI "idz" (wątek #7)
- **Lane:** SILNIK (+ EKONOMIA + UI dostarczyli)
- **Priorytet:** P0
- **Status:** BLOCKED (GOTOWE-do-wpiecia, czeka na "idz")
- **Czeka na:** Maciej — sygnał "idz" (D2)
- **Rola:** Maciej (decyzja) → Composer (wpiecie)
- **Zależności:** plaster EKONOMIA+UI gotowy (splitPraca/kup-za-Pieniadz); gate terytorialny DEFERRED
- **AC:**
  - [ ] Maciej mówi "idz"
  - [ ] SILNIK wpięcie plastr do pętli tury
  - [ ] Sędzia (test) + kanon
  - [ ] Bramka zielona

### BLK-03 — Wealth W1-W6 (wątek #8)
- **Lane:** EKONOMIA (+ SILNIK)
- **Priorytet:** P0
- **Status:** BLOCKED
- **Czeka na:** Maciej — 6 decyzji W1-W6 (D3, rekomendacja C = minimalny Wealth)
- **Rola:** Maciej (decyzje ABC) → GLM (model) → Composer (kod) → Opus (review)
- **Zależności:** szkielet Wealth w EKONOMIA (25 testów zielone)
- **AC (minimalny Wealth, D3=C):**
  - [ ] Maciej decyduje W1-W6 (lub akceptuje minimalny: pula + 1 zarabianie + 1 wydawanie)
  - [ ] EKONOMIA: moduł Wealth (kod) + testy
  - [ ] SILNIK: wpięcie Wealth do pętli tury
  - [ ] UI: panel Wealth (jeśli v0.1)
  - [ ] Bramka zielona

### BLK-04 — Ulepszenia terenu + posterunki (wątek #9)
- **Lane:** MAPA (render) + EKONOMIA (bonusy) + SILNIK (wpiecie)
- **Priorytet:** P0
- **Status:** BLOCKED
- **Czeka na:** Maciej — akceptacja listy/wartości (D4, rekomendacja A)
- **Rola:** Maciej (decyzja) → Composer (wpiecie)
- **Zależności:** render MAPA gotowy; bonusy EKONOMIA określone
- **AC:**
  - [ ] Maciej akceptuje listę (posterunek/fort/droga/irygacja/...) + wartości
  - [ ] SILNIK wpięcie do `main.ts` (akcja "buduj ulepszenie z mapy" — zamiast usuniętego Robotnika, 2A)
  - [ ] MAPA: front "Buduj ulepszenie"
  - [ ] EKONOMIA: bonusy w economy
  - [ ] Bramka zielona

### BLK-05 — UX bitwy Q2-Q7 (wątek #11)
- **Lane:** UI (projekt) + UNITS (impl) + SILNIK (scalenie)
- **Priorytet:** P0
- **Status:** BLOCKED
- **Czeka na:** Maciej — odpowiedzi Q2-Q7 (D5, rekomendacja B = UI proponuje domyślne)
- **Rola:** Maciej (decyzja) → GLM (plan UX) → Composer (UI+UNITS+SILNIK) → Opus (review)
- **Zależności:** Q1=B+AUTO już zdecydowane (gracz steruje + przełącznik AUTO); NOWE: faza rozstawiania (deployment); referencja Total War: Pharaoh
- **AC:**
  - [ ] Maciej zatwierdza odpowiedzi Q2-Q7 (minimapa/tooltip+panel/górny pasek/ekran przed-bitwą/styl/sterowanie)
  - [ ] UI: projekt HUD bitwy (kursor kontekstowy, rozkazy, roster 3-grupy z generalem, styl)
  - [ ] UNITS: impl `manualBattle.ts` (1398 l., gotowe) + deployment + roster
  - [ ] SILNIK: scalenie bitwy do kanonu (10A)
  - [ ] `Gra-podglad-BITWA.html` zintegrowane z kanonem
  - [ ] Bramka zielona + battle-smoke

### BLK-06 — Panel transferu armii (mockup #170/#178)
- **Lane:** UI (mockup) + UNITS (model)
- **Priorytet:** P2
- **Status:** BLOCKED (czeka na akceptację mockupu — D7, rekomendacja B = odłóż po v0.1)
- **Czeka na:** Maciej — akceptacja mockupu (D7)
- **Rola:** GLM (mockup) → Maciej (akceptacja) → Composer (impl po v0.1)
- **Zależności:** kontrakt merge/stacking od UNITS (patrz RDY-04); okno połącz-armie (UI gotowe) wystarcza na v0.1
- **AC:**
  - [ ] UI: mockup panelu (L-klik A → P-klik B → drag&drop; M/Ctrl+M scalanie rannych; podział; karta jednostki)
  - [ ] Maciej akceptuje mockup
  - [ ] (po v0.1) UNITS: model transfer/split/mergeWounded/remove + co z pustym generalem
  - [ ] (po v0.1) UI: impl panelu
  - [ ] Bramka zielona

---

## 🟢 READY (można zacząć teraz — nie blokowane)

### RDY-01 — Realizacja civBonusy w systemach (27 efektów)
- **Lane:** UNITS (23 walka) + MIASTO (1 miasto) + EKONOMIA (3 ekonomia)
- **Priorytet:** P2 (quick win, wysoka wartość grywalna)
- **Status:** READY
- **Rola:** Composer (kod w lane'ach) → Opus (review)
- **Zależności:** `civs.json` `bonusy[]` gotowe (T3=A potwierdzone); pole `realizuje` determinuje lane
- **AC:**
  - [ ] UNITS: 23 efekty walki (bonus_obrona/bonus_walka/jednostka_specjalna) w `combat.ts`/`battleScene.ts`
  - [ ] MIASTO: 1 efekt (koszt_redukcja budynki Rzymianie -20%) w `production.ts`
  - [ ] EKONOMIA: 3 efekty (bonus_zloto handel Grecy +15%, bonus_nauka Inkowie +15%, koszt rekrutacji Impi -10%) w `economy.ts`
  - [ ] Każdy bonus odczytywany z `civs.json` per cywilizacja gracza/AI
  - [ ] Testy: nowy suite `civ-bonusy-test.cjs` (27 efektów)
  - [ ] Bramka zielona

### RDY-02 — Multi-unit / posiłki 1-heks (skład bitwy zbiorowej)
- **Lane:** UNITS (kontrakt oddany 2026-06-26) + SILNIK (wpiecie)
- **Priorytet:** P1
- **Status:** READY (kontrakt gotowy)
- **Rola:** Composer (UNITS potwierdza kontrakt + SILNIK wpina)
- **Zależności:** kontrakt `_handoff/UNITS-do-MASTER_kontrakt-walka-multi.md` (atakujący heks + sąsiednie własne ≤1; obrońca analogicznie); decyzja 4=C/1-hex; decyzja 1=auto-rozstrzyganie
- **AC:**
  - [ ] SILNIK: zbieranie składu bitwy przy starcie (heks atakującego + ≤1 sąsiednich własnych; heks obrońcy + ≤1)
  - [ ] UNITS: `BattleScene` / `resolveCombat` obsługuje multi-unit
  - [ ] AUTO-rozstrzyganie: `f(jedn) = Atak_eff × HP × morale_factor` + countery typów + teren + struktury obronne
  - [ ] Wynik: zwycięzca + straty per jednostka (HP po, padł/rozbity, ocaleli)
  - [ ] SILNIK: aplikacja wyniku na mapę (usuń padłych, aktualizuj HP)
  - [ ] Testy: `multi-unit-test.cjs`
  - [ ] Bramka zielona

### RDY-03 — Start oblężenia + HP garnizonu + machiny
- **Lane:** UNITS (kontrakt oddany 2026-06-26) + SILNIK (wpiecie) + EKONOMIA (flaga/zapasy — DONE)
- **Priorytet:** P1
- **Status:** READY (tura oblężenia PARTIAL — głód+atrycja+kapitulacja DONE; brak startu+HP+machin)
- **Rola:** Composer (SILNIK wpina) → Opus (review)
- **Zależności:** kontrakt `_handoff/UNITS-do-MASTER_kontrakt-start-oblezenia.md`; `EKONOMIA-do-UNITS_zapasy-oblezenie-kontrakt.md` (`city.oblegane`, `getCityFood()`, `city.garnizon`, `tick.obleganyGlod`); decyzje 2 (start oblężenia) + 3A (garnizon)
- **AC:**
  - [ ] SILNIK: wejście w stan oblężenia (`city.oblegane=true`) — gracz: jawna akcja "Oblężaj"; AI: automat przy blokadzie, jawna przy szturmie
  - [ ] Garnizon = realne jednostki + milicja z populacji; HP per jednostka (atrycja 8%/turę, próg upadku 30-40%)
  - [ ] Kolejka machin 1/turę (Taran=Kamień/Wieża=Brąz in-siege; Katapulta=Średniowiecze po v0.1)
  - [ ] Szturm → taktyczna bitwa oblężnicza (mur/brama/machiny, +200% obrony)
  - [ ] Po zdobyciu/kapitulacji → `captureCity(atakujący)`
  - [ ] Głód = 0 → automatyczne przejęcie (bez bitwy)
  - [ ] Testy: `oblezanie-test.cjs` rozszerzone (start + HP + machiny)
  - [ ] Bramka zielona

### RDY-04 — Reakcja fight/flee (MODEL RUCHU #2, brak ZoC)
- **Lane:** CYWILIZACJE (heurystyka) + SILNIK (hook) + MAPA (odwrot) + UNITS (bitwa)
- **Priorytet:** P1
- **Status:** READY (decyzja 2 podjęta)
- **Rola:** GLM (heurystyka) → Composer (CYW+SILNIK+MAPA) → Opus (review)
- **Zależności:** decyzja Macieja #2 (brak ZoC + reakcja fight/flee na adjacency); MODEL RUCHU 1C (min.1 pole), 3 (stacking)
- **AC:**
  - [ ] MAPA/SILNIK: trigger adjacency (jednostka gracza wchodzi na pole sąsiadujące z wrogiem)
  - [ ] CYWILIZACJE: heurystyka fight/flee (AI wroga wybiera bitwę lub odwót)
  - [ ] UNITS: bitwa (jeśli fight)
  - [ ] MAPA: odwrot (jeśli flee)
  - [ ] SILNIK: hook w pętli ruchu
  - [ ] Testy: `reaction-test.cjs`
  - [ ] Bramka zielona

### RDY-05 — Traversal ruchu z prototypu (RUCH.html)
- **Lane:** MAPA (prototyp gotowy) + SILNIK (wpiecie)
- **Priorytet:** P2
- **Status:** READY
- **Rola:** Composer (MAPA dostarcza + SILNIK wpina)
- **Zależności:** prototyp `RUCH.html` (MAPA); MODEL RUCHU 1C/2/3 zdecydowane; #4 (zaokrętowanie) = D6=A defer
- **AC:**
  - [ ] MAPA: traversal (BFS/Dijkstra + koszty terenu + rzeka) z prototypu do `map/`
  - [ ] SILNIK: wpięcie do `main.ts` (zastępuje obecny `computeReachable`/`computePath` jeśli inny)
  - [ ] Stacking bez limitu (3) + okno "połącz/nie połącz" (UI gotowe)
  - [ ] Min.1 pole (1C) + brak ZoC + reakcja (RDY-04)
  - [ ] Testy: `movement-test.cjs`
  - [ ] Bramka zielona

### RDY-06 — Typ mapy z menu (generator)
- **Lane:** MAPA (generator) + SILNIK (wpiecie)
- **Priorytet:** P2
- **Status:** READY (DEFERRED w BATCH TOP-7 — czeka na MAPA)
- **Rola:** Composer (MAPA + SILNIK)
- **Zależności:** generator MAPA (kontynenty/pangea/wyspy — wszystkie zaimplementowane); menu zbiera typ (DEFERRED do MAPA)
- **AC:**
  - [ ] MAPA: generator obsługuje typ z menu (kontynenty/pangea/wyspy)
  - [ ] SILNIK: wpięcie menu→generator (typ mapy应用owany)
  - [ ] Rozmiary 1000-20000 (już wpięte) + losowy seed
  - [ ] Testy: `generator-test.cjs` (3 typy)
  - [ ] Bramka zielona

### RDY-07 — Nazwy klastrów na mapie
- **Lane:** MAPA
- **Priorytet:** P3 (quick win)
- **Status:** READY
- **Rola:** Composer (MAPA)
- **Zależności:** `clusters.ts` (format rozmieszczenia oddany CYWILIZACJE); nazwy z CYWILIZACJE
- **AC:**
  - [ ] MAPA: render nazw klastrów/miast na mapie
  - [ ] CYWILIZACJE: dostarcza nazwy per nacja
  - [ ] Bramka zielona

### RDY-08 — Pelny hud.ts
- **Lane:** UI
- **Priorytet:** P2
- **Status:** READY (makieta gotowa)
- **Rola:** Composer (UI)
- **Zależności:** makieta `hud.ts` gotowa; częściowo wpięte (tura/jednostka/miasta + Praca/Kultura)
- **AC:**
  - [ ] UI: pelny HUD (zasoby/minimapa/panele 1-12)
  - [ ] SILNIK: wpięcie (po akceptacji BLK-01)
  - [ ] Bramka zielona

### RDY-09 — Sumerowie/Babilon fix (roster)
- **Lane:** CYWILIZACJE
- **Priorytet:** P3 (quick win)
- **Status:** READY
- **Rola:** Composer (CYWILIZACJE)
- **Zależności:** roster 9 (Sumerowie/Babilon = dublet do fixu)
- **AC:**
  - [ ] CYWILIZACJE: fix rosteru (Sumerowie/Babilon — rozróżnienie lub konsolidacja)
  - [ ] `civs.json` spójny
  - [ ] Testy: `civs-test.cjs`
  - [ ] Bramka zielona

### RDY-10 — AI harness testowy + strojenie archetypów 7→9
- **Lane:** CYWILIZACJE (+ AI)
- **Priorytet:** P1
- **Status:** READY (wątek #10)
- **Rola:** GLM (heurystyki + wartości) → Composer (kod) → Opus (review)
- **Zależności:** archetypy 7→9 + ARCHETYPE_AGGRESSION (Zulusi 0.9..Chińczycy 0.2) wpięte; `aiOwnerCivMap` (różne nacje)
- **AC:**
  - [ ] CYWILIZACJE: harness testowy `ai.ts` (scenariusze decyzyjne)
  - [ ] Heurystyka nauki AI (wybór tech per archetyp)
  - [ ] Strojenie wartości startowych per archetyp
  - [ ] Testy: `ai-test.cjs` rozszerzone (113→pełny harness)
  - [ ] Bramka zielona

### RDY-11 — Mnożnik Handel→Pieniądz per-cyw + Mennica
- **Lane:** EKONOMIA (+ CYWILIZACJE per-cyw)
- **Priorytet:** P1
- **Status:** READY (Waluta x2 na całą pulę — decyzja 2026-06-26)
- **Rola:** Composer (EKONOMIA)
- **Zależności:** decyzja 5A (mnożnik 2, 1.7-2.4 per-cyw); Waluta x2 zastosowana na całą pulę Handlu (Skarbiec+Badania+Wealth)
- **AC:**
  - [ ] EKONOMIA: `mnoznikHandelPieniadz` per cywilizacja (1.7-2.4)
  - [ ] Mennica: pole mnożnik w `buildings.json` + aplikacja w `economy.ts`
  - [ ] Praca→Pieniądz z nadwyżki (wg rekomendacji EKONOMIA)
  - [ ] Testy: `currency-test.cjs` rozszerzone
  - [ ] Bramka zielona

### RDY-12 — Migracja compound (efekt ekonomiczny budynków)
- **Lane:** EKONOMIA
- **Priorytet:** P2
- **Status:** READY (MIASTO ustaliło compound koszt + efekt społeczny; EKONOMIA musi zmigrować efekt ekonomiczny)
- **Rola:** Composer (EKONOMIA)
- **Zależności:** MIASTO: compound koszt w `production.ts` (1.10^(lvl-1)) + efekt społeczny w `order.ts`/`culture-religion.ts`; `buildings.json` `przyrost` ZOSTAJE (czytane przez `economy.ts` + `siege.ts`)
- **AC:**
  - [ ] EKONOMIA: compound efekt ekonomiczny (plony praca/pieniądz z budynków) w `economy.ts` (baza × 1.10^(lvl-1))
  - [ ] Migracja `buildingValue` z liniowego `przyrost` na compound
  - [ ] Koordynacja z `siege.ts` (mury.przyrost.obrona)
  - [ ] Testy: `economy-test.cjs` + `wire-ekonomia-test.cjs`
  - [ ] Bramka zielona

### RDY-13 — Etap2 MIASTO (spread/growthMult/tradeMult)
- **Lane:** MIASTO
- **Priorytet:** P3
- **Status:** READY (etap1 DONE: produkcja/porządek/kultura/religia wpięte)
- **Rola:** Composer (MIASTO)
- **Zależności:** spreadReligion per-tura (wpięte); etap2 = growthMult + tradeMult + pełny spread
- **AC:**
  - [ ] MIASTO: `growthMult` (mnożnik wzrostu populacji) w `turn-economy.ts`
  - [ ] `tradeMult` (mnożnik handlu) w `economy.ts`
  - [ ] Pełny spread religii (etap2)
  - [ ] Bonusy ulepszeń + pula Pracy
  - [ ] Testy: `culture-religion-test.cjs` + `okolica-test.cjs` rozszerzone
  - [ ] Bramka zielona

### RDY-14 — Efekty relacji dypl. na rozgrywkę
- **Lane:** DYPLOMACJA (+ CYWILIZACJE)
- **Priorytet:** P3 (świadomie bezczynne w v0.1)
- **Status:** READY (po v0.1)
- **Rola:** Composer (DYPLOMACJA)
- **Zależności:** `diplomacy.ts` (tickDiplomacy + get/setDiploRelation) wpięte; efekt na relacje = bezczynny w v0.1
- **AC:**
  - [ ] DYPLOMACJA: efekty relacji (Zaufanie/Respekt) na rozgrywkę (handel/wojna/przyjazń)
  - [ ] Testy: `diplomacy-test.cjs` rozszerzone
  - [ ] Bramka zielona

---

## 🟡 IN PROGRESS (w toku u działów)

### INP-01 — Nowe jednostki render + oblężenie wg epok (wątek #12)
- **Lane:** UNITS
- **Priorytet:** P1
- **Status:** IN PROGRESS
- **Rola:** Composer (UNITS)
- **Zależności:** epoki machin (Taran=Kamień/Wieża=Brąz/Katapulta=Średniowiecze); 1A Zelazo GO (Hastati/Triari po rename DONE)
- **AC:**
  - [ ] Modele nowych jednostek (Zelazo: Hastati/Triari — rename DONE; nowe modele render)
  - [ ] Epoki w `units.json`
  - [ ] Machiny oblężnicze (Taran/Wieża in-siege, Katapulta=Średniowiecze po v0.1)
  - [ ] Bramka zielona

### INP-02 — Dostęp surowców = boolean (wątek #2)
- **Lane:** MAPA + EKONOMIA + DANE
- **Priorytet:** P1
- **Status:** IN PROGRESS (ROBI)
- **Rola:** Composer (MAPA+EKONOMIA)
- **Zależności:** złoże + ulepszenie w zasięgu + przetwórczy budynek
- **AC:**
  - [ ] Pole `dostep` (boolean) w `GameState` per surowiec
  - [ ] MAPA: zasięgi (złoże + ulepszenie w zasięgu miasta)
  - [ ] EKONOMIA: przetwórczy budynek wymóg
  - [ ] DANE: `terrain-improvements.json` wartości
  - [ ] Testy: `resources-test.cjs`
  - [ ] Bramka zielona

### INP-03 — Bonusy obrony struktur (wątek #4)
- **Lane:** UNITS + EKONOMIA + SILNIK
- **Priorytet:** P1
- **Status:** IN PROGRESS (wpięte `structureDefenseBonusFor` + `structMult` w combat dla AI i barbarzyńców)
- **Rola:** Composer (dokończenie)
- **Zależności:** budynek "Mury" (MIASTO — DONE w części); mur+200/fort+100/posterunek+50
- **AC:**
  - [ ] MIASTO: budynek "Mury" w `buildings.json` + `production.ts`
  - [ ] UNITS: `structureDefenseBonusFor` w `combat.ts` + `battleScene.ts` (pełne)
  - [ ] Obozowanie (bonus obrony)
  - [ ] Testy: `combat-test.cjs` rozszerzone
  - [ ] Bramka zielona

### INP-04 — Zasięgi terytorium (wątek #3)
- **Lane:** EKONOMIA (formuła) + MAPA (territory.ts)
- **Priorytet:** P1
- **Status:** IN PROGRESS (r=populacja 1:1 zdecydowane + wpięte; posterunek +5/fort +10)
- **Rola:** Composer (dokończenie)
- **Zależności:** decyzja 2026-06-25 (zasięg=populacja, cap 15); `cityRangeForPopulation` w `territory.ts`
- **AC:**
  - [ ] EKONOMIA: formula/cap w `terrain-improvements.json`
  - [ ] MAPA: `territory.ts` (cityTerritoryRadius → cityRangeForPopulation) + linia granicy
  - [ ] Posterunek +5, fort +10
  - [ ] Testy: `territory-test.cjs`
  - [ ] Bramka zielona

### INP-05 — NAUKA pula (wątek #1)
- **Lane:** EKONOMIA + master
- **Priorytet:** P1
- **Status:** IN PROGRESS → zasadniczo DONE (silnik DONE, picker wpięty)
- **Rola:** Composer (dokończenie UX jeśli potrzebne)
- **Zależności:** `research.ts` (pula sterowana graczem) wpięte; `sciencePicker.ts` wpięte; `chooseAIResearch` per AI
- **AC:**
  - [ ] (DONE) `playerResearchTargetId` + `setPlayerResearchTarget` + `getResearchState`
  - [ ] (DONE) window hooks `__civ_setResearchTarget`/`getResearchState`/`getAvailableTechs`
  - [ ] (DONE) picker badan wpięty + przycisk "Nauka"
  - [ ] AI wybiera tech (bez zmian)
  - [ ] Bramka zielona (research 33)

---

## ✅ DONE (zweryfikowane historycznie · starsze batche · aktualny kanon: `4602e752…`)

### DN-01 — Ekonomia per-tura (M2)
- **Lane:** EKONOMIA + SILNIK
- **Status:** DONE (wpięte `advanceCityEconomy`)
- **AC:** plony/wzrost/żywność per city per tura ✓

### DN-02 — Produkcja (M2)
- **Lane:** MIASTO + SILNIK
- **Status:** DONE (`advanceProduction` w pętli N; compound koszt 1.10^(lvl-1))
- **AC:** kolejka + ukończenie budynku ✓

### DN-03 — AI rywale (M4)
- **Lane:** AI + SILNIK
- **Status:** DONE (`decideAITurn` wpięte: ruch/zakładanie/atak/budowa)
- **AC:** AI gra per tura ✓

### DN-04 — Barbarzyńcy (M4)
- **Lane:** AI
- **Status:** DONE (`barbarians.ts` wpięte)
- **AC:** barbarzyńcy tick per tura ✓

### DN-05 — Warunki zwycięstwa (M4)
- **Lane:** AI + SILNIK
- **Status:** DONE (`checkVictory` wpięte + overlay końca gry)
- **AC:** dominacja + nauka; ekran końca ✓

### DN-06 — Nauka sterowana graczem (M2)
- **Lane:** EKONOMIA + SILNIK + UI
- **Status:** DONE (pula + picker + przycisk "Nauka")
- **AC:** gracz wybiera cel, pula akumuluje, kup tech gdy pula≥koszt ✓

### DN-07 — Atak z mapy (M3)
- **Lane:** SILNIK + UI + UNITS
- **Status:** DONE (klik wroga zasięg=1 → `showPreBattle` → `resolveCombat` → wynik na mapę; Pole bitwy=fallback auto dziś)
- **AC:** realny atak z mapy (nie tylko test T) ✓

### DN-08 — Save/Load (M6)
- **Lane:** SILNIK
- **Status:** DONE (Ctrl+S autosave / Ctrl+L; localStorage; cityProd/cityBuilt/aiResearchDone/diploRelations)
- **AC:** save/load pełniejszy ✓

### DN-09 — Ekran startu / Nowa gra (M4/M6)
- **Lane:** UI + SILNIK
- **Status:** DONE (mainMenu + newGameFlow wpięte; 9 cyw + epoka + trudność + rozmiar/rywale/prędkość; START `applyMenuParams`)
- **AC:** pełny flow nowej gry ✓

### DN-10 — Wybór nacji w runtime (M5)
- **Lane:** SILNIK + CYWILIZACJE
- **Status:** DONE (gracz: civType+civBonusy; AI: aiOwnerCivMap + archetyp + ARCHETYPE_AGGRESSION)
- **AC:** nacja wpływa na gre ✓

### DN-11 — Bonusy obrony struktur (M3, częściowo)
- **Lane:** SILNIK + UNITS
- **Status:** DONE (częściowo — `structureDefenseBonusFor` + `structMult` w combat dla AI i barbarzyńców)
- **AC:** mur/fort/posterunek w walce (pełne = INP-03) ✓ (częściowo)

### DN-12 — Dyplomacja tick + panel (M5)
- **Lane:** DYPLOMACJA + SILNIK + UI
- **Status:** DONE (`decideAIDiplomacy` + `tickDiplomacy` + `aiDiplomacyStance` + panel + notyfikacje)
- **AC:** dyplomacja tyka co turę + panel ✓

### DN-13 — HUD + Praca/Kultura (M6)
- **Lane:** UI + SILNIK
- **Status:** DONE (BATCH TOP-7; HUD z pracą/kulturą)
- **AC:** HUD podstawowy + zasoby ✓ (pelny = RDY-08)

### DN-14 — Overlay końca gry + Nowa gra (M4)
- **Lane:** UI + SILNIK
- **Status:** DONE (BATCH TOP-7)
- **AC:** overlay końca + przycisk "Nowa gra" ✓

### DN-15 — Waluta x2 na całą pulę Handlu
- **Lane:** EKONOMIA
- **Status:** DONE (decyzja 2026-06-26; `walutaOdkryta` + flagi budynków)
- **AC:** x2 po Walucie na całą pulę Handel→Pieniądz ✓

### DN-16 — Kultura/Religia/Porządek (M5)
- **Lane:** MIASTO + SILNIK
- **Status:** DONE (wpięte 24.06: spreadReligion + kultura + porządek productionMult/revolt)
- **AC:** kultura/religia/porządek w turze ✓ (etap2 = RDY-13)

### DN-17 — Auto-manage miasta
- **Lane:** MIASTO + SILNIK
- **Status:** DONE (`autoManageCity` toggle w cityPanel)
- **AC:** auto-zarządca miasta ✓

### DN-18 — Zakładanie miast z mapy (M1)
- **Lane:** MAPA + SILNIK
- **Status:** DONE (klawisz B + bramka terytorialna `isInTerritory`; Osadnik usunięty 2A)
- **AC:** zakładanie z mapy (tryb Budowa) ✓

### DN-19 — Zelazo 1A + Robotnik 2A usunięty
- **Lane:** EKONOMIA + UNITS + SILNIK
- **Status:** DONE (3 epoki; rename Legionista→Hastati; Robotnik usunięty; Zwiadowca zostaje)
- **AC:** Zelazo w grze; ulepszenia=akcja z mapy (front = BLK-04) ✓

### DN-20 — Mgła wojny (F)
- **Lane:** MAPA
- **Status:** DONE (`visibility.ts` + `setFog` + chowanie wrogów)
- **AC:** mgła wojny ✓

### DN-21 — Generator mapy (M1)
- **Lane:** MAPA
- **Status:** DONE (kontynenty/pangea/wyspy; rzeki/biomy/złoża/starty)
- **AC:** generator heks ✓ (typ z menu = RDY-06)

### DN-22 — Bitwa taktyczna 3D (M3)
- **Lane:** UNITS
- **Status:** DONE (`Gra-podglad-BITWA.html`; 1 akcja/jedn., cios-za-cios, facing, B7 kwadraty, amunicja B6)
- **AC:** bitwa taktyczna ✓ (scalenie do kanonu 10A = BLK-05; manual = BLK-05)

### DN-23 — Resolver combat.ts (M3)
- **Lane:** UNITS + SILNIK
- **Status:** DONE (`resolveCombat` wpięty)
- **AC:** resolver walki ✓ (multi-unit = RDY-02)

### DN-24 — Ruch + zasięg + trasa + koszty terenu (M1)
- **Lane:** MAPA + UNITS
- **Status:** DONE (BFS/Dijkstra, koszty per teren, rzeka)
- **AC:** ruch jednostek ✓ (traversal z prototypu = RDY-05)

---

## Podsumowanie liczbowe

| Grupa | Liczba zadań |
|-------|-------------|
| **BLOCKED (Maciej)** | 6 (BLK-01 do BLK-06) |
| **READY (można zacząć)** | 14 (RDY-01 do RDY-14) |
| **IN PROGRESS** | 5 (INP-01 do INP-05) |
| **DONE** | 24 (DN-01 do DN-24) |
| **RAZEM** | 49 |

### Top 5 priorytetów (po powrocie Macieja)
1. **BLK-01 + BLK-02 + BLK-04** — decyzje D1=A/D2=A/D4=A (odblokowanie P0: HUD/plaster/ulepszenia) → Sprint 1 quick wins
2. **BLK-05** — decyzja D5=B (UX bitwy Q2-Q7, UI proponuje domyślne) → epik bitwy Sprint 2
3. **BLK-03** — decyzja D3=C (minimalny Wealth) → Sprint 3
4. **RDY-01** — realizacja civBonusy w systemach (27 efektów) → równolegle z Sprint 1
5. **RDY-02 + RDY-03 + RDY-04** — multi-unit/oblężenie/fight-flee (kontrakty gotowe) → Sprint 2

---

*Opracowano przez GLM 5.2 (Agent, rola Architekt/Planista), 2026-06-26. Powiązane: `docs/CURSOR-PLAN-DZIALANIA.md`, `docs/CURSOR-ARCHITEKTURA.md`, `.cursor/rules/civ-workflow.mdc`.*
