# CURSOR — PLAN DZIAŁANIA (Civ / "The Game")

> Autorski plan działania dla projektu gry 4X "The Game" (Civ) w środowisku Cursor.
> Powstał na podstawie pełnego audytu: `PLAYBOOK-operacyjny-Civ.md`, `dyspozycje/DZIENNIK-MASTERA.md`, wszystkich `dyspozycje/*-DO-MASTERA.md`, kontraktów `dyspozycje/_handoff/`, `SILNIK/SILNIK-ARCHITEKTURA-DEWELOPER.md`, kodu `gra/src/main.ts` i modułów `game/* / render/* / battle/* / ui/* / map/* / units/*`, inwentarza `gra/data/*.json`, narzędzi `gra/tools/*` oraz `Status-projektu-The-Game.xlsx` (stan 2026-06-24, częściowo nieaktualny vs DZIENNIK z 2026-06-26).
>
> **Data audytu:** 2026-06-26. **Kanon grywalny:** `Gra-podglad.html` (md5 `2276ec0f`, ~1003 KB, BATCH TOP-7 z 2026-06-26).
> **Autor:** GLM 5.2 (Agent) — rola Architekt/Planista.

---

## 1. Executive summary

Projekt "The Game" (Civ) to przeglądarkowa gra 4X pisana w TypeScript + Vite + Three.js, budowana do jednego pliku `Gra-podglad.html` (otwieranego dwuklikiem z `file://`). Przez ~kilka tygodni był rozwijany w Claude Code w modelu "10 działów" (lane'ów): **SILNIK, EKONOMIA, MIASTO, UNITS, UI, DANE, AI, DYPLOMACJA, MAPA, CYWILIZACJE** — z Masterem jako integratorem i Maciejem jako decydentem produktowym.

**Stan na 2026-06-26 jest wyraźnie grywalny v0.1:**
- mapa + ruch + zakładanie miast z mapy (klawisz B, bramka terytorialna),
- ekonomia per-tura (plony/wzrost/żywność), produkcja, kultura/religia, porządek,
- AI rywale (ruch/zakładanie/atak/budowa) + barbarzyńcy + warunki zwycięstwa,
- nauka = wspólna pula sterowana przez gracza (picker badan + przycisk "Nauka"),
- atak z mapy (klik wroga w zasięgu hex=1) → `resolveCombat` → wynik na mapę,
- save/load (Ctrl+S autosave / Ctrl+L), ekran startu (menu nowej gry: 9 cywilizacji + epoka + trudność + rozmiar mapy/rywale/prędkość),
- wybór nacji wpływa na grę (civType + civBonusy + archetyp AI + aggression),
- 3 epoki (Kamień / Brąz / Żelazo — decyzja 1A Macieja z 2026-06-25),
- bonusy obrony struktur (mur/fort/posterunek) w walce,
- dyplomacja tyka co turę + panel dyplomacji + notyfikacje,
- HUD z pracą/kulturą + overlay końca gry (+ "Nowa gra").

**Wszystko zielone** (kanon `2276ec0f`, ~762+ testów jednostkowych w 17 suitach + smoke/battle-smoke), **z jednym znanym oczekiwanym czerwonym**: `koszary-gate-test` (lazaret = budynek Średniowiecza = przyszłość, baseline-red — nie regresja, decyzja Macieja 2026-06-26).

**Wąskie gardło = integracja** (SILNIK/master): moduły są w ~76% gotowe u działów, ale wpięcie w grę ~70%. Główne blokery to **decyzje Macieja** (UX bitwy Q2-Q7, Wealth W1-W6, lista ulepszeń terenu, widok główny/HUD 6B, plaster EKONOMIA+UI "idz") oraz **kontrakty cross-lane** oczekujące od działów (multi-unit/posiłki UNITS, reakcja fight/flee CYWILIZACJE, traversal ruchu MAPA, BattleScene z mapy UNITS, start oblężenia+HP garnizonu+machiny UNITS).

**Strategia Cursor:** przejść na trójfazowy workflow **GLM 5.2 (plan) → Composer 2.5 (kod) → Opus 4.8 (review)** z pojedynczym integratorem (SILNIK = Composer z gated batchami) i Maciejem jako gate'em decyzji produktowych. Priororytet: odblokować backlog czekający na decyzje, potem epik bitwy (UX + multi-unit + oblężenie + BattleScene z mapy), równolegle quick-wins (realizacja civBonusy w systemach, typ mapy z menu, pelny hud.ts, nazwy klastrów).

---

## 2. Stan każdego lane'a (10 działów)

Procenty z `Status-projektu-The-Game.xlsx` (zakładka `POSTEP-%`, stan 2026-06-24) skorygowane o nowsze wpisy z `DZIENNIK-MASTERA.md` (do 2026-06-26). Owner = domyślna rola w workflow Cursor.

| # | Lane | % | Co DONE | Co IN-PROGRESS | Co BLOCKED | Owner (Cursor) |
|---|------|---|---------|----------------|------------|----------------|
| 1 | **SILNIK** (master/integracja) | ~75% | Wpięte i zweryfikowane: ekonomia, AI rywale+barbarzyńcy+victory, render miast/surowców, zakładanie-z-mapy (Osadnik usunięty), nauka sterowana graczem (picker), atak z mapy (preBattle), save/load, ekran startu, wybór nacji w runtime, bonusy obrony, dyplomacja tick, HUD+Praca/Kultura, overlay końca gry, dyplomacjaPanel. Clean build OK. | Typ mapy z menu (DEFERRED→MAPA), BattleScene z mapy (UNITS kontrakt), pelny hud.ts, aplikacja civBonusy w systemach (lane'y) | Decyzje Macieja (UX bitwy, Wealth, ulepszenia, widok główny); kontrakty od UNITS/CYWILIZACJE/MAPA | **Composer 2.5** (integrator, gated batch) — review przez Opus |
| 2 | **EKONOMIA** | ~72% | economy/turn-economy (wpięte), upkeep 51/51, converters 30/30, budżet-AI (oddany CYWILIZACJE), kontrakt zapasów oblężenia, model nauki gracza, Waluta x2 na całą pulę Handlu (decyzja 2026-06-26), Zelazo (tech.json + 11 budynków) | WEALTH (kod), migracja compound (efekt ekonomiczny budynków), growthMult, mnoznikHandelPieniadz per-cyw, wpiecie | Decyzje Wealth **W1-W6** (Maciej) | **Composer 2.5** (kod) — plan GLM, review Opus |
| 3 | **MIASTO** | ~88% | produkcja (wpięta, compound koszt 1.10^(lvl-1)), porządek (T1/T2, wpięty), kultura/religia (wpięta 24.06, spread religii=etap2), dane+panele, model poziomów budynków (epokowy+compound) | etap2 (spread/growthMult/tradeMult), bonusy ulepszeń, pula Pracy | — | **Composer 2.5** (kod) — review Opus |
| 4 | **UNITS** (jednostki+bitwa) | ~85% | 36 typów + galeria 4-widoki, kolory per kultura, balans (macierz/countery/flanka), resolver combat.ts (wpięty), bitwa taktyczna 3D (1 akcja/jedn., cios-za-cios), facing front/flanka/tył, pole kwadratowe B7, amunicja (2 pila→miecz) + pilum B6, AI bitwy, morale, modele nowych jednostek (Hastati/Triari po rename), usunięty Robotnik (2A), Zwiadowca zostaje | Scalenie bitwy do kanonu (10A), modele nowych jednostek render, jednostki wg epok (Taran=Kamien/Wieza=Braz/Katapulta=Średniowiecze) | **UX bitwy Q2-Q7** (Maciej) — determinuje manualBattle + deployment + roster | **Composer 2.5** (kod) — UX plan przez GLM, review Opus |
| 5 | **UI** | ~78% | cityPanel, mainMenu, newGameFlow (wpięte), kreator nowej gry (9 cyw + epoka + trudność + rozmiar/rywale/prędkość), AI read-only cities, sciencePicker (wpięty), okno połącz-armie (czeka kontrakt merge), diplomacyPanel+notyfikacje, hooki okolicy | Paczka zwrotna do MIASTO, wpiecie paneli (panel transferu armii #170/#178), pelny hud.ts | Okno połącz-armie czeka na kontrakt merge/stacking od UNITS | **Composer 2.5** (kod) — mockupy plan przez GLM |
| 6 | **DANE** (→CYWILIZACJE) | scalone | civs.json roster 9 typów (incl. Celtowie+Germanie) + religie + bonusy[] (27 efektów, T3=A potwierdzone), units.json, buildings.json, tech.json | — | — | **GLM 5.2** (dane/parametry) — strojenie przez Composer |
| 7 | **AI** (→CYWILIZACJE) | ~70% | ai.ts (decideAITurn/decideAIReaction/decideAIReinforcements/decideAIDiplomacy — wpięte), archetypy 7→9 + ARCHETYPE_AGGRESSION (Zulusi 0.9..Chińczycy 0.2), budżet-AI, aiOwnerCivMap (różne nacje) | Harness testowy ai.ts, heurystyka nauki AI, strojenie wartości | Heurystyka fight/flee (reakcja na adjacency — MODEL RUCHU #2) | **Composer 2.5** (kod) — heurystyka plan przez GLM |
| 8 | **DYPLOMACJA** (→CYWILIZACJE) | ~68% | diplomacy.ts (computeRespekt/tickDiplomacy — wpięte), Zaufanie+Respekt, zdarzenia, aiDiplomacyStance + get/setDiploRelation, panel dyplomacji | Stosowanie efektów relacji na rozgrywkę (świadomie bezczynne w v0.1) | — | **Composer 2.5** (kod) |
| 9 | **MAPA** | ~72% | generator heks (kontynenty/pangea/wyspy — wszystkie), render 3D + kamera, ruch+BFS/Dijkstra+koszty terenu+rzeka, mgła wojny (F), miasta (kamień+brąz GR/RZ — 9 nacji), surowce, isInTerritory (wyeksportowane), clusters.ts (format rozmieszczenia), prototyp RUCH.html, ulepszenia terenu+posterunki (render gotowy) | Typ mapy z menu (DEFERRED→MAPA), reszta nacji brąz, traversal ruchu z prototypu, granica C (render), nazwy klastrów na mapie | Akceptacja ulepszeń/posterunków (Maciej — odblokowane decyzją 9, ale lista/wartości do potwierdzenia) | **Composer 2.5** (kod) — generator plan przez GLM |
| 10 | **CYWILIZACJE** | ~70% | roster 9 (Celtowie+Germanie), religie, bonusy[] (27 efektów — mechanizacja rozdana po działach wg `realizuje`), diplomacy 98, victory, barbarians 53, ai.ts test+strojenie, archetypy 7→9, T1-T4 ABC | Archetypy 7→9 (finalize), heurystyka nauki, wartości startowe, wpiecie civBonusy w systemach (lane'y), Sumerowie/Babilon fix | Niejasność własności (1-4) rozwiazana (START=MASTER), klaster MAPA (format oddany), budżet EKONOMIA (oddany) | **GLM 5.2** (archetypy/balans) + Composer (kod) |

**Średnia gotowość modułów (działy, bez integracji):** ~76%.
**Integracja w grę (wpięte w pętlę tury):** ~75% (po BATCH TOP-7 2026-06-26).
**Realna grywalność v0.1:** ~75% (kanon `2276ec0f` grywalny end-to-end z 1 znanym czerwonym baseline).

---

## 3. Otwarte wątki z DZIENNIKA (priorytety P0-P3)

Na podstawie tabeli "REJESTR PRZEPŁYWÓW" w `DZIENNIK-MASTERA.md` (stan 2026-06-25) + wpisów do 2026-06-26. Priorytet wg wpływu na grywalność i blokowania innych.

| Wątek # | Opis | Właściciel | Status | Priorytet | Czeka na |
|---------|------|-----------|-------|-----------|----------|
| 6 | **Widok główny / HUD w grze** | MAPA+silnik | BLOK | **P0** | Maciej: akceptacja układu (6B) + isInTerritory (już wyeksportowane → zostaje 6B) |
| 7 | **Plaster EKONOMIA+UI** (splitPraca/kup-za-Pieniadz/gate terytorialny) | silnik | GOTOWE-do-wpiecia | **P0** | Maciej: "idz" |
| 8 | **Wealth** | EKONOMIA+silnik | BLOK | **P0** | Maciej: W1-W6 |
| 9 | **Ulepszenia terenu + posterunki** (render gotowy) | MAPA+EKONOMIA+silnik | BLOK | **P0** | Maciej: akceptacja listy/wartości |
| 11 | **Bitwa→kanon (10A) + UX bitwy** | UNITS+silnik | BLOK | **P0** | Maciej: UX Q2-Q7 |
| 1 | **NAUKA = pula sterowana graczem** | EKONOMIA+master | ROBI | **P1** (silnik DONE, picker wpięty — zostaje ew. UX) | UI picker (DONE) — w zasadzie zamknięte |
| 2 | **Dostęp surowców = boolean** (złoże+ulepszenie w zasięgu+przetwórczy budynek) | MAPA+EKONOMIA+DANE | ROBI | **P1** | pole dostępu + zasięgi |
| 3 | **Zasięgi terytorium** (miasto r=populacja 1:1, posterunek +5, fort +10) | EKONOMIA+MAPA | ROBI | **P1** | wartości do terrain-improvements.json (częściowo DONE — r=pop) |
| 4 | **Bonusy obrony struktur** (mur+200/fort+100/posterunek+50, obozowanie) | UNITS+EKONOMIA+silnik | ROBI | **P1** (wpięte structureDefenseBonusFor) | budynek "Mury" (MIASTO) — DONE w części |
| 5 | **Mnożnik Handel→Pieniądz** (baza 2, per-cyw) + Mennica | EKONOMIA+CYWILIZACJE | ROBI | **P1** (Waluta x2 na całą pulę — decyzja 2026-06-26) | Mennica pole mnożnik; wartości per-cyw |
| 10 | **AI: archetypy 7→9 + harness testowy + heurystyka nauki** | CYWILIZACJE | ROBI | **P1** | harness + wartości startowe |
| 12 | **Nowe jednostki render + oblężenie wg epok** | UNITS | ROBI | **P1** | modele + epoki w units.json |
| — | **Multi-unit / posiłki 1-heks** (skład bitwy zbiorowej) | UNITS (kontrakt) → silnik | ROBI | **P1** | kontrakt UNITS → wpiecie silnik |
| — | **Reakcja fight/flee** (MODEL RUCHU #2, brak ZoC) | CYWILIZACJE (heurystyka) → silnik | ROBI | **P1** | heurystyka CYW → hook silnik |
| — | **Start oblężenia + HP garnizonu + kolejka machin** | UNITS (kontrakt) → silnik | ROBI | **P1** | kontrakt UNITS (już oddany 2026-06-26) → wpiecie silnik |
| — | **Traversal ruchu z prototypu** (RUCH.html) | MAPA → silnik | ROBI | **P2** | wpiecie silnik |
| — | **Typ mapy z menu** (DEFERRED→MAPA) | MAPA | ROBI | **P2** | generator MAPA + wpiecie silnik |
| — | **Pelny hud.ts** | UI | ROBI | **P2** | — |
| — | **Panel transferu armii** (#170/#178, Total War) | UI (mockup) + UNITS (model) | ROBI | **P2** | akceptacja mockupu Maciej → impl |
| — | **Realizacja civBonusy w systemach** (27 efektów wg `realizuje`) | UNITS(23)/MIASTO(1)/EKONOMIA(3) | ROBI | **P2** | implementacja w lane'ach |
| — | **Nazwy klastrów na mapie** | MAPA | ROBI | **P3** | — |
| — | **Sumerowie/Babilon fix** (roster) | CYWILIZACJE | ROBI | **P3** | — |
| — | **Etap2 MIASTO** (spread religii/growthMult/tradeMult) | MIASTO | ROBI | **P3** | — |
| — | **Efekty relacji dypl. na rozgrywkę** (świadomie bezczynne v0.1) | DYPLOMACJA | ROBI | **P3** | — |

**Zamknięte/zdecydowane (2026-06-25/26):** Zelazo 1A GO, Robotnik 2A usunięty, Waluta x2 cała pula, Lazaret=Średniowiecze (koszary-gate=baseline-red), zasięg miasta=populacja 1:1, Warsztat obleżniczy→Katapulta=Średniowiecze (Taran=Kamień/Wieża=Brąz in-siege), START GRY=MASTER, rozmiary mapy 1000-20000 + typ z menu, ekspansja terytorium NIE blokuje zakładania (≥5 pól).

---

## 4. Decyzje wymagane od Macieja (format ABC)

Zebrane w jednym miejscu wszystkie otwarte decyzje produktowe z DZIENNIKA i handoffów. Każda z opcjami A/B/C i rekomendacją.

### D1 — Widok główny / HUD w grze (wątek #6, P0)
**Kontekst:** MAPA ma gotowy widok główny + HUD; `isInTerritory` już wyeksportowane. Czeka na akceptację układu (6B).
- **A:** Zaakceptować obecny układ HUD (tura/jednostka/miasta + zasoby) → SILNIK wpije natychmiast.
- **B:** Zaakceptować z drobnymi poprawkami (lista od Macieja) → UI/MAPA dopracuje, potem wpiecie.
- **C:** Przeprojektować HUD (nowy mockup) → UI robi nowy mockup → akceptacja → impl → wpiecie.
- **Rekomendacja:** **A** (odblokowuje P0 natychmiast; poprawki w kolejnym спринcie).

### D2 — Plaster EKONOMIA+UI "idz" (wątek #7, P0)
**Kontekst:** Plaster (splitPraca/kup-za-Pieniadz/gate terytorialny) jest GOTOWY-do-wpiecia. Czeka tylko na "idz".
- **A:** "Idz" — SILNIK wpije + sędzia + kanon (natychmiast).
- **B:** Wpiąć po decyzji Wealth (spójność ekonomiczna).
- **C:** Wpiąć częściowo (splitPraca bez gate terytorialnego).
- **Rekomendacja:** **A** (plaster gotowy, niezależny od Wealth — gate terytorialny i tak DEFERRED).

### D3 — Wealth W1-W6 (wątek #8, P0)
**Kontekst:** EKONOMIA ma szkielet Wealth; czeka na 6 decyzji (W1-W6) dotyczących modelu Wealth (co to jest, jak zarabiać, jak wydawać, pula, konwersje, UI). Brak szczegółów w DZIENNIKU — trzeba zebrać od EKONOMIA.
- **A:** Maciej zbiera W1-W6 od EKONOMIA (handoff) i decyduje ABC każde → EKONOMIA koduje → SILNIK wpija.
- **B:** Wealth odkładamy po v0.1 (gra grywalna bez niego) → fokus na bitwie/UX.
- **C:** Minimalny Wealth (pula + 1 sposób zarabiania + 1 wydawania) na v0.1 → pełny później.
- **Rekomendacja:** **C** (minimalny Wealth odblokowuje ekonomię bez przeładowania scope'u; pełny po v0.1).

### D4 — Ulepszenia terenu + posterunki (wątek #9, P0)
**Kontekst:** MAPA ma render gotowy; EKONOMIA ma bonusy. Czeka na akceptację listy/wartości.
- **A:** Zaakceptować obecną listę i wartości → SILNIK wpije.
- **B:** Maciej eksportuje Excel z wartościami do akceptacji → potem wpiecie.
- **C:** Skrócona lista na v0.1 (posterunek + fort + droga + irygacja) → reszta później.
- **Rekomendacja:** **A** (render gotowy, bonusy określone; strojenie wartości w toku).

### D5 — UX bitwy Q2-Q7 (wątek #11, P0)
**Kontekst:** UNITS ma działającą bitwę (`Gra-podglad-BITWA.html`); Maciej już zdecydował Q1=B+AUTO (gracz steruje + przełącznik AUTO) + NOWE: faza rozstawiania (deployment). Zostały Q2-Q7 + rozbudowa (kursor kontekstowy, rozkazy, roster 3-grupy z generalem, styl Total War: Pharaoh).
- **A:** Maciej odpowiada Q2-Q7 (minimapa TAK/NIE, tooltip+panel TAK, górny pasek dane, ekran przed-bitwą TAK, styl antyczny vs ciemny, sterowanie mysz-first vs klawisze) → UI projektuje → UNITS impl → scal do kanonu.
- **B:** UI proponuje domyślne odpowiedzi Q2-Q7 → Maciej zatwierdza/odrzuca → impl.
- **C:** Tylko Q1 (już zdecydowane) + deployment na v0.1; reszta Q2-Q7 po v0.1.
- **Rekomendacja:** **B** (UI ma referencje Total War: Pharaoh; Maciej tylko zatwierdza — najszybsza ścieżka do grywalnej bitwy manualnej).

### D6 — Model ruchu #4 (zaokrętowanie)
**Kontekst:** Decyzje 1C (min.1 pole), 2 (brak ZoC + reakcja fight/flee), 3 (stacking bez limitu) już podjęte. #4 (zaokrętowanie) = robocze A (po Żeglarstwie).
- **A:** Zostaje robocze A (po Żeglarstwie) — defer do po v0.1.
- **B:** Zdecydować teraz (A/B/C) — wpiecie z traversal ruchu.
- **C:** Usunąć zaokrętowanie z v0.1 (jednostki wodne = tylko transport) — uprości.
- **Rekomendacja:** **A** (nie blokuje v0.1; traversal ruchu wepnie 1C/2/3).

### D7 — Panel transferu armii (mockup #170/#178)
**Kontekst:** UI robi mockup (Total War: L-klik A → P-klik B → drag&drop kart; M/Ctrl+M scalanie rannych). Czeka na akceptację mockupu.
- **A:** UI robi mockup → Maciej akceptuje → impl (po kontrakcie merge UNITS).
- **B:** Pominąć na v0.1 (okno "połącz/nie połącz" wystarczy) → pełny panel później.
- **C:** Tylko scalanie rannych (M) na v0.1 → reszta później.
- **Rekomendacja:** **B** (okno połącz-armie wystarcza na v0.1; pełny panel = epik po v0.1).

### D8 — Posiłki (już rozstrzygnięte B, potwierdzenie)
**Kontekst:** Posiłki = zasięg 1 heks (atakujący heks + sąsiednie własne ≤1; obrońca analogicznie). Już rozstrzygnięte 2026-06-25.
- **A:** Potwierdzić B (1 heks) → UNITS kontrakt + SILNIK wpina zbieranie składu.
- **B:** Zmienić na 0 heksów (tylko ten sam heks) — uproszczenie.
- **C:** 2 heksy — większe bitwy.
- **Rekomendacja:** **A** (już rozstrzygnięte; kontrakt UNITS gotowy 2026-06-26).

### D9 — Subagenci na Sonnet (koszty)
**Kontekst:** Master zapytał wszystkie działy czy używają subagentów na Sonnet (koszty). Brak odpowiedzi w DZIENNIKU.
- **A:** Zebrać odpowiedzi od działów → Maciej decyduje budżet.
- **B:** W Cursor nie ma Sonnet — decydujemy GLM/Composer/Opus (koszty wg playbooka).
- **C:** Odpuścić (decyzja budżetowa po v0.1).
- **Rekomendacja:** **B** (w środowisku Cursor mapujemy na GLM/Composer/Opus — pytanie straciło sens).

---

## 5. Kolejność prac na najbliższe 2-4 sprinty

Sprint = ~1 sesja integracji SILNIKA (gated batch + bramka testów). Każdy sprint zaczyna się od decyzji Macieja (jeśli BLOK) lub kontraktu od działu (jeśli ROBI).

### Sprint 1 — Odblokowanie P0 (decyzje Macieja + gotowe-do-wpiecia)
**Cel:** Wpiąć wszystko co czeka na "idz"/akceptację. Wynik = kanon z odblokowanym HUD/ekonomią/ulepszeniami.
1. **D1=A** (HUD akcept) → SILNIK wpięcie widoku głównego + granicy C (MAPA renderuje).
2. **D2=A** (plaster "idz") → SILNIK wpięcie splitPraca/kup-za-Pieniadz (gate terytorialny DEFERRED).
3. **D4=A** (ulepszenia akcept) → SILNIK wpięcie ulepszeń terenu + posterunków (MAPA render + EKONOMIA bonusy).
4. **Realizacja civBonusy w systemach** (UNITS 23 + MIASTO 1 + EKONOMIA 3) — równolegle w lane'ach.
5. Bramka: 17 suitów zielono (koszary-gate = baseline-red OK) + smoke + battle-smoke.
6. **Owner:** Composer 2.5 (SILNIK + lane'y) — review Opus 4.8.

### Sprint 2 — Bitwa epik (UX + multi-unit + oblężenie)
**Cel:** Grywalna bitwa manualna + oblężenie + BattleScene z mapy.
1. **D5=B** (UI proponuje Q2-Q7 → Maciej zatwierdza) → UI projekt HUD bitwy (Total War: Pharaoh).
2. UNITS dostarcza kontrakty: **multi-unit/posiłki** (już oddany 2026-06-26), **merge/stacking** (panel transferu D7=B odłożony → okno połącz), **start oblężenia + HP garnizonu + machiny** (już oddany 2026-06-26).
3. CYWILIZACJE: **heurystyka fight/flee** (reakcja na adjacency, MODEL RUCHU #2).
4. MAPA: **traversal ruchu** z prototypu RUCH.html + **typ mapy z menu** + **nazwy klastrów**.
5. SILNIK wpija: hook reakcji adjacency → fight/flee → bitwa/odwrót; skład bitwy zbiorowej (heks + ≤1); start oblężenia (flaga `oblegane` + tura oblężenia PARTIAL→FULL); BattleScene z mapy (Pole bitwy=fallback auto dziś → pełna scena po UNITS).
6. Bramka + review.
7. **Owner:** GLM (plan UX + heurystyki) → Composer (UNITS/CYW/SILNIK/MAPA) → Opus (review).

### Sprint 3 — Wealth minimalny + AI strojenie + ulepszenia UX
**Cel:** Ekonomia pełna (Wealth) + AI dobra + UX spójne.
1. **D3=C** (minimalny Wealth) → EKONOMIA koduje (pula + 1 zarabianie + 1 wydawanie) → SILNIK wpija.
2. CYWILIZACJE: **harness testowy ai.ts** + heurystyka nauki AI + strojenie archetypów 7→9.
3. UI: **pelny hud.ts** + panel transferu armii mockup (D7=A → impl po v0.1).
4. EKONOMIA: **mnoznikHandelPieniadz per-cyw** + Mennica + migracja compound (efekt ekonomiczny budynków).
5. MIASTO: **etap2** (spread religii/growthMult/tradeMult) + bonusy ulepszeń + pula Pracy.
6. **Owner:** GLM (strojenie plan) → Composer (kod) → Opus (review).

### Sprint 4 — v0.1 polish + release gate
**Cel:** v0.1 release-ready (Opus sign-off).
1. Bug triage (Opus Ask → Composer fix → Opus verify).
2. Balans playtest (CYWILIZACJE + Maciej).
3. Pelny panel transferu armii (D7=A) jeśli czas.
4. Zaokrętowanie (D6=A defer) + efekty relacji dypl. (P3) — po v0.1.
5. **Release gate:** Opus 4.8 Ask — APPROVE/BLOCK.
6. **Owner:** Opus 4.8 (gate) + Composer (fixy) + Maciej (playtest).

---

## 6. Podział ról (zadanie → model)

Zgodnie z `~/Projects/game-dev-playbook/AGENTS.md` (trójfazowy workflow) + mapping na 10 lane'ów.

| Rola | Model | Tryb | Subagent slug | Odpowiada za |
|------|-------|------|---------------|--------------|
| **Architekt/Planista** | GLM 5.2 | Agent | `glm-5.2-max` | Plan, GDD-lite, architektura, ADR, sprint planning, podział zadań, kontrakty, mockupy UX, archetypy AI, balans/parametry, decyzje ABC |
| **Implementer** | Composer 2.5 | Agent | `composer-2.5-fast` | Kod, refaktor, integracje (SILNIK), testy, poprawki po review, dane/eksport |
| **Reviewer** | Opus 4.8 | Ask (review) / Agent (fix po zgodzie) | *brak — wybór ręczny* | Code review, triage bugów, weryfikacja AC, release gate, pre-merge |
| **Decydent** | Maciej (człowiek) | — | — | Decyzje produktowe ABC, playtest, budżet, priorytety biznesowe |

### Mapping model → 10 lane'ów

| Lane | Plan (GLM) | Kod (Composer) | Review (Opus) |
|------|-----------|----------------|----------------|
| SILNIK (integracja) | ADR, kolejka batchy | **główny owner** (gated batch) | review każdego batcha |
| EKONOMIA | model Wealth, formuły compound | kod economy/upkeep/converters/wealth | review logiki ekonomicznej |
| MIASTO | model poziomów budynków, etap2 | kod production/order/culture-religion | review |
| UNITS | kontrakty walki, model armii | kod combat/battleScene/units render | review (bitwa = wysokie ryzyko) |
| UI | mockupy, design system | kod paneli/HUD/menu | review UX |
| DANE | schema JSON, strojenie | eksport Excel→JSON | review danych |
| AI | archetypy, heurystyki | kod ai.ts | review (heurystyki = trudne) |
| DYPLOMACJA | model relacji | kod diplomacy.ts | review |
| MAPA | generator, traversal | kod map/territory/render | review |
| CYWILIZACJE | roster, bonusy, balans | kod (często z AI/DANE) | review balansu |

### Zasady workflow
- **Nowy chat przy zmianie roli** (czysty kontekst).
- **Handoff:** design doc + AC → implementacja → review → merge.
- **Opus wybieraj ręcznie w UI** (brak subagenta).
- **Review = tryb Ask** (bez edycji); fix po review = Composer Agent.
- **SILNIK = jedyny editor `main.ts`** (patrz reguła w `civ-workflow.mdc`).

---

## 7. Ryzyka

| Ryzyko | Prawdop. | Wpływ | Mitygacja |
|--------|----------|-------|-----------|
| **OneDrive dehydration** — pliki appearing truncated w sandbox → build fail | Wysokie (rekurenty w SILNIK-DO-MASTERA) | Wysoki (blokuje build/kanon) | "Always keep on this device" dla `gra/`; manual `Ctrl+S` affected files; rebuild po touch; build do `/tmp/civ-dist` (nie `gra/dist/`) |
| **`main.ts` monolit** (~2827 l.) — integracja wszystko-w-jednym | Wysokie | Wysoki (konflikty, trudny review) | SILNIK = jedyny editor; gated batche (1 zmiana naraz); docelowy refaktor na moduły po v0.1 (epik) |
| **Brak git** — OneDrive jako VCS | Wysokie | Wysoki (brak historii/rollback) | Zainicjować git repo (opcjonalnie z `.gitignore` na OneDrive); backupy `main.ts.*` (już są); md5 kanonu jako checkpoint |
| **Kaskada dehydratacji** — fix jednego pliku ujawnia kolejny | Średnie | Średni | Batch fix + rebuild; audyt adversarialny (PASS = czysty build + wszystkie wpiecia ŻYWE) |
| **Scope creep bitwy** — UX bitwy (manual + deployment + roster + Total War) = duży epik | Średnie | Wysoki | D5=B (UI proponuje domyślne); v0.1 = tylko Q1+deployment+multi-unit; pełny panel transferu po v0.1 |
| **Wealth undefined** — brak decyzji W1-W6 blokuje ekonomię | Średnie | Średni | D3=C (minimalny Wealth na v0.1) |
| **Testy nieuruchamialne w Cursor** — `node` niedostępny w PowerShell sandbox | Wysokie (zaobserwowane) | Średni | Uruchamiać testy przez `npx` w `gra/` (Composer w worktree z node); lub przez Cursor terminal z node w PATH; bramka = `node gra/tools/*.cjs` |
| **Stale `Status-projektu-The-Game.xlsx`** — stan 2026-06-24, nieaktualny vs DZIENNIK | Wysokie | Niski (tylko raport) | Aktualizować xlsx po każdym sprińcie (MIASTO ma `gen-panel-xlsx.py`); DZIENNIK = źródło prawdy |
| **Konflikty cross-lane** — 10 działów edytuje współbieżnie | Średnie | Średni | File ownership per lane (patrz `ARCHITEKTURA-PLIKI.md`); handoffy w `_handoff/`; Master routuje; w Cursor = 1 implementer na sprińt |
| **Subagenci na kosztach** — pytanie Mastera bez odpowiedzi | Niskie | Niski | W Cursor: GLM/Composer/Opus wg playbooka (D9=B) |

---

## 8. Quick wins vs duże epiki

### Quick wins (1 sprińt, niskie ryzyko, wysoka wartość)
- **Wpięcie HUD + granicy C** (D1=A) — SILNIK, ~1h.
- **Wpięcie plastr EKONOMIA+UI** (D2=A) — SILNIK, ~2h.
- **Wpięcie ulepszeń terenu + posterunków** (D4=A) — SILNIK, ~2h.
- **Realizacja civBonusy w systemach** (23+1+3 efektów) — UNITS/MIASTO/EKONOMIA, ~4h.
- **Nazwy klastrów na mapie** — MAPA, ~1h.
- **Typ mapy z menu** (generator gotowy) — MAPA+SILNIK, ~2h.
- **Pelny hud.ts** (makieta gotowa) — UI, ~3h.
- **Sumerowie/Babilon fix** — CYWILIZACJE, ~1h.

### Średnie epiki (2-3 sprinty)
- **Bitwa manualna + deployment** (D5, Q1 już zdecydowane) — UI+UNITS+SILNIK.
- **Multi-unit + posiłki 1-heks** (kontrakty gotowe) — UNITS+SILNIK.
- **Oblężenie FULL** (start + HP garnizonu + machiny + przejęcie) — UNITS+SILNIK.
- **Reakcja fight/flee** (heurystyka CYW + hook SILNIK) — CYW+SILNIK.
- **Traversal ruchu z prototypu** — MAPA+SILNIK.
- **Minimalny Wealth** (D3=C) — EKONOMIA+SILNIK.
- **AI harness + strojenie archetypów 7→9** — CYWILIZACJE.

### Duże epiki (po v0.1)
- **Pelny panel transferu armii** (Total War, D7=A) — UI+UNITS.
- **Refaktor `main.ts` na moduły** — SILNIK (epik architektoniczny).
- **Migracja compound** (efekt ekonomiczny budynków) — EKONOMIA.
- **Etap2 MIASTO** (spread/growthMult/tradeMult).
- **Efekty relacji dypl. na rozgrywkę** — DYPLOMACJA.
- **Zaokrętowanie** (D6=A defer).
- **Średniowiecze** (Lazaret + Katapulta + Warsztat obleżniczy) — po v0.1.
- **Git repo** (mitigacja braku VCS).

---

## 9. Następne kroki (natychmiast po powrocie Macieja)

1. **Maciej:** decyzje **D1=A, D2=A, D4=A** (odblokowanie P0 — HUD/plaster/ulepszenia) + **D5=B** (UX bitwy — UI proponuje Q2-Q7) + **D3=C** (minimalny Wealth).
2. **GLM 5.2 (Agent):** sprint planning dla Sprint 1 (quick wins) — podział na zadania z AC (patrz `CURSOR-BACKLOG.md`).
3. **Composer 2.5 (Agent):** implementacja Sprint 1 (SILNIK wpięcia + realizacja civBonusy).
4. **Opus 4.8 (Ask):** review Sprint 1 przed merge do kanonu.
5. **Maciej:** playtest kanonu po Sprint 1 + decyzje do Sprint 2.

---

*Opracowano przez GLM 5.2 (Agent, rola Architekt/Planista) na podstawie pełnego audytu projektu Civ, 2026-06-26. Powiązane dokumenty: `docs/CURSOR-ARCHITEKTURA.md`, `docs/CURSOR-BACKLOG.md`, `.cursor/rules/civ-workflow.mdc`.*
