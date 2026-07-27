## [17:50] ✅ Gotowe — deploy ROBOCZA FALA 39 (`a616a6dd`)

| Co | Status |
|----|--------|
| **Karta jednostki** | medalion · koszary · kuźnia · weteran · statusy |
| **Staty efektywne** | Q1=C Q2=A Q3=A — atak/obrona/pancerz/HP |
| **md5** | `a616a6dd` · `gra-robocza/START.html` |

## [17:45] ✅ Gotowe — efektywne staty na karcie jednostki (C-UNIT-CARD-Q1–Q3)

| Decyzja | Wybór | Efekt w grze |
|---------|-------|--------------|
| **Q1** | **C** | Atak/obrona: **efektywna liczba duża** + `baza X` małym |
| **Q2** | **A** | Max HP efektywne + pasek (np. 28/36, baza 30) |
| **Q3** | **A** | Osobny wiersz **Pancerz** (efektywny + baza) |

Kod: `unit-card-stats.ts` · podpięte do tooltipu i paska armii. **Bez deployu** — czeka `push`.

## [17:40] ✅ Gotowe — karta jednostki C-OBCE-JEDN-KARTA (kod, bez deploy)

| Co | Status |
|----|--------|
| **Karta jednostki** | medalion właściciela · koszary · kuźnia · weteran · XP · garnizon/czuwaj/fortyfikacja/oblężenie |
| **Panele** | tooltip kontekstowy · dolny pasek armii (`armyStackHud`) · `unitPanelHud` |
| **Źródło bonusów** | `parametryBonusProc` / `pancerzBonusProc` z budynków — gracz + AI, ten sam mechanizm co walka |
| **typecheck** | `npx tsc --noEmit` — 0 błędów |
| **Poza zakresem** | render 3D na żetonie mapy (Q2) — osobno, gdy będzie Opus |

Pliki: `gra/src/ui/unitCardStatus.ts` · `hexContextTooltip.ts` · `armyStackHud.ts` · `unitPanelHud.ts` · `main.ts`.  
**Deploy do `gra-robocza/`** — na sygnał (`push` / `deploy`).

## [17:32] ✅ Gotowe — deploy ROBOCZA FALA 38 (`08c676a5`)

| Co | Status |
|----|--------|
| **DYSPOZYCJA-85-SUWAK** | globalny suwak imperium + override miasta |
| **md5** | `08c676a5` · `gra-robocza/START.html` |

**Poza bundlem:** C-OBCE-JEDN-Q2 render (portret/sygnet lewo) · R-MUZYKA · R-FULLSCREEN.

## [17:25] ✅ Gotowe — deploy ROBOCZA FALA 37 (`6691eb3e`)

| Co | Status |
|----|--------|
| **ZNALEZISKO-86** | % HP + pasek Szczegóły bitwy |
| **PYTANIE-77/84** | Mennica łaska + runtime gate budynków |
| **R-DYP-STOL-A** | sekcje traktatu w koszyku |
| **ECHO ABC** | 20+ plików `docs/decyzje/` |
| **md5** | `6691eb3e` · `gra-robocza/START.html` |

**Nie w bundlu (czeka kod):** C-OBCE-JEDN Q1–Q2 pełny · R-PIERWSZE-MIASTO · DYSPOZYCJA-85 wire · R-MUZYKA · R-FULLSCREEN.

## [17:10] ✅ Gotowe — ECHO C-OBCE-JEDN Q1–Q3 + karta jednostki

| ID | Odpowiedź |
|----|-----------|
| **C-OBCE-JEDN-Q1** | **A** — pełny panel obcej jednostki + karta statusów |
| **C-OBCE-JEDN-Q2** | **TW** — portret władcy / sygnet MP po lewej; generał u góry → przyszłość |
| **C-OBCE-JEDN-Q3** | **A+B+C** — dziennik + karta + tooltip na ★ |
| **C-OBCE-JEDN-KARTA** | ikony koszar (parametry) i kuźni (pancerz) brąz/srebro/złoto; na mapie po bokach gwiazdek |

Pliki: `docs/decyzje/C-OBCE-JEDN-Q*.md` · `C-OBCE-JEDN-KARTA.md`. Wdrożenie czeka **`działaj`**.

## [16:55] ✅ Gotowe — ECHO 6 decyzji (bez deploy)

| ID | Odpowiedź | Kod |
|----|-----------|-----|
| **R-PIERWSZE-MIASTO** | B | CZĘŚCIOWO — brak blokady marszu i panelu 🔨 |
| **R-DYP-STOL-A** | B+C | CZĘŚCIOWO — koszyk tylko handel/dar |
| **ZNALEZISKO-86** | A | CZĘŚCIOWO — maxHp tak, brak % i paska |
| **DYSPOZYCJA-85-SUWAK** | C | ROZBIEŻNOŚĆ — brak globalnego suwaka gracza |
| **PYTANIE-59-DOP** | B | ZGODNY |
| **PYTANIE-77-DOP** | B | ROZBIEŻNOŚĆ — kod ma 83=B natychmiast |

Pliki: `docs/decyzje/R-PIERWSZE-MIASTO.md` … `PYTANIE-77-DOP.md` · audyt `AUDYT-PYTAJ-TYLKO-O-2026-07-27.md`.

## [15:40] ✅ Gotowe — ABC zamknięte (bez nowego deploy)

| ID | Odpowiedź | Stan |
|----|-----------|------|
| **C-ARMY-HUNGER-Q1** | **A** — pełny parytet (suwak AI + głód HP wszyscy) | kod już w `main.ts` (`5ef4c45`); testy 39/39 + 37/37; **czeka na deploy** |
| **C-STRATY-HP-Q1** | zamknięte — nadreprezentacja siły obrońcy AI, nie bug strat | bez zmian kodu |

## [15:12] ✅ Gotowe — deploy ROBOCZA FALA 36 (`a74c3797`)

| Co | Gdzie |
|---|---|
| **Bundle** | `gra-robocza/START.html` → md5 **`a74c3797`** |
| **Commit** | `2632156` — batch bez nowego ABC (Dyspozycja 85, kultura/presja, F34–35, Wiar D4/N1, teren bitwy, AI suwaki, dyplomacja część, mapgen, P-AI) |
| **Nie w tej fali** | R-MUZYKA-OPOZNIENIE, R-FULLSCREEN-PASEK, R-PIERWSZE-MIASTO (kod niekompletny) |

## [15:27] ✅ Gotowe — deploy ROBOCZA FALA 36

| Pole | Wartość |
|------|---------|
| **md5** | `a74c3797` |
| **commit** | `2632156` |
| **Wejście** | `gra-robocza/START.html` |
| **Paczka** | Dyspozycja 85 · kultura/religia · B-SPIC/B-SUROW-BUD · FALA 9+34–35 · C-WIAR-D4/N1/N4-AI · P-AI-006–008 · mapgen Q1–Q2 · teren bitwy+tooltip · R-AI-SUWAKI · dyplomacja (część) · replay snapshot |

**Kolejna fala (czeka w `gra/src/`, nie w F36):** R-BITWA-POWTORKA-I=**B** (auto-grupa zamiast snapshot) · R-MAPGEN-Q3=A · ewent. doprecyzowania po playteście.

## [15:35] ✅ Gotowe — R-BITWA-POWTORKA-I=B (powtórka = auto-grupa)

| Co | Gdzie |
|---|---|
| **Decyzja** | B — „Rozegraj ponownie" → świeża auto-grupa Konnica/Piechota/Łucznicy |
| **Kod** | `battleScene.ts` — usunięty snapshot grup, `_initDeployUI` zawsze auto-grupuje |
| **Deploy** | batch bitwy na polecenie **deploy** |

## [15:30] ✅ Gotowe — C-TEREN-IMPL-3=B (tooltip TEREN pełny)

| Co | Gdzie |
|---|---|
| **Decyzja** | B — jeden wiersz TEREN z obroną %, Δ zasięg, koszt ruchu, blokada konnicy |
| **Kod** | `battleTerrainTooltip.ts` + `_unitTooltipHtml` w `battleScene.ts` |
| **Test** | `teren-walki-etapy-test.cjs` ETAP 4 (33/33) |
| **Deploy** | razem z paczką terenu (IMPL-1+2+3) na polecenie **deploy** |

## [15:25] ⏸️ Czeka — C-TEREN-IMPL-2=C (obrona Gór z JSON)

| | |
|---|---|
| **Co** | `terrain-combat.json`: Góry **+75%** obrony, koszt piechoty **2** · `combat.ts` czyta % z JSON (bez hardcoded ×1,75) |
| **Testy** | `teren-walki-etapy-test.cjs` **26/26** · `city-defense-terrain-gate-test.cjs` **31/31** · tsc 0 |
| **Deploy** | razem z paczką terenu (C-TEREN-IMPL-1=A) na polecenie **deploy** |

## [15:20] ⏸️ Czeka — C-TEREN-IMPL-1=A (teren bitwy — jeden deploy)

| | |
|---|---|
| **Co** | Strategia publikacji: **jeden batch** (etapy 1–3 naraz) do `gra-robocza/` — bez rozbijania na 3 deploye |
| **Kod** | ETAP 1 Góry ×1,75 obrony · ETAP 2 Δ Zasięg · ETAP 3 konnica Las ×2 / Góry blokada |
| **Testy** | `teren-walki-etapy-test.cjs` **26/26** |
| **Deploy** | na Twoje polecenie (**deploy**) — Integrator, jeden wpis `WERSJE.md` |

## [15:15] ⏸️ Czeka — R-MAPGEN-KOLEJNOSC-Q3=A (floor reliefu — bez skracania pipeline)

| | |
|---|---|
| **Co** | **2×** `ensureReliefGridCoverage` (mapa) / **3×** (Ziemia) — bez zmian; priorytet: poprawny efekt wg wytycznych, nie czas |
| **Test wydajności** | próg standardowej mapy **5 s → 7 s** (czas ~6 s akceptowalny) |
| **Testy** | relief-grid **6/6** · fair-play **8/8** · map-gen-regression **PASS** |
| **Deploy** | na Twoje polecenie |

**Paczka R-MAPGEN-KOLEJNOSC zamknięta** (Q1+B, Q2+C, Q3+A).

## [15:10] ⏸️ Czeka — R-MAPGEN-KOLEJNOSC-Q2=C (górzystość ~15% — kod, bez deploy)

| | |
|---|---|
| **Co** | Tier Średni relief: docelowa górzystość lądu **~15%** (Góry 5% + Wzgórza 8,5% sufit/komórka) · fair-play czyta progi z JSON |
| **Zmierzone** | 5 seedów Standard: średnia **15,65%** (14,72–16,23%) |
| **Testy** | fair-play **8/8** · relief-grid **6/6** · map-gen-regression **PASS** · tsc 0 |
| **Deploy** | na Twoje polecenie |

## [15:05] ⏸️ Czeka — R-MAPGEN-KOLEJNOSC-Q1=B (las — jeden etap w pipeline)

| | |
|---|---|
| **Co** | Usunięty pośredni las z `classifyTerrain`/`classifyTerrainFlat` · kanoniczny las = `reapplyForestOverlay` po reliefie+rzekach |
| **Testy** | fair-play **8/8** · relief-grid **6/6** · map-gen-regression **PASS** · tsc 0 |
| **Deploy** | na Twoje polecenie |

## [15:00] ⏸️ Czeka — P-AI-008=C (zagrożenie AI — kod, bez deploy)

| | |
|---|---|
| **Co** | Zasięg zagrożenia **7 hex** · Mury w trybie zagrożenia tylko gdy AI **#1 Mocy** |
| **Testy** | `ai-threat-mode-test.cjs` · tsc 0 |
| **Deploy** | na Twoje polecenie |

## [14:55] ⏸️ Czeka — P-AI-007=A (priorytety produkcji AI — kod, bez deploy)

| | |
|---|---|
| **Co** | Panel D: `(priorytet−5)×15` pkt na wojsko/ekonomię/naukę **na** archetyp · Biblioteka + Akademia w puli produkcji |
| **Testy** | `ai-production-priority-test.cjs` **5/5** · tsc 0 |
| **Deploy** | na Twoje polecenie |

## [14:50] ⏸️ Czeka — P-AI-006=C (tabela ekspansywności — potwierdź przed deployem)

| | |
|---|---|
| **Co** | 15 wartości `ekspansywnosc` w `civ-ai.json` + sync macierz · silnik: rezerwa Pracy, bypass klastra (≥4), częstotliwość celu Mocy, kara poza klastrem |
| **Testy** | `ai-war-gate-test.cjs` **23/23** · tsc 0 |
| **Deploy** | dopiero po Twoim **OK tabeli** (litera C + „deploy" lub poprawki liczb w odpowiedzi) |

## [13:55] ⏸️ Czeka — C-WIAR-N4-AI=B (kod w `gra/src`, bez deploy)

| | |
|---|---|
| **Co** | AI **może odmówić** wojny sojuszniczej gdy: już w innej wojnie · za słaba moc (<55% celu, pokojowy <75%) → N4 −15 W, zerwanie sojuszu, komunikat HUD |
| **Testy** | `alliance-war-obligation-test.cjs` **12/12** · tsc 0 |
| **Uwaga** | Pełna heurystyka B: wojna · słaba moc · niskie Zaufanie (<20) do proszącego sojusznika |
| **Deploy** | napisz **deploy** |

## [13:50] ⏸️ Czeka — C-WIAR-N4-AI = B (kod po zwolnieniu `gra/`) — **ZASTĄPIONE** wpisem wyżej

---

## [12:15] ✅ Gotowe — deploy ROBOCZA FALA 35 (`2e606ae6`)

| | |
|---|---|
| **Gdzie** | `gra-robocza/START.html` → `Gra-ROBOCZA.html` · md5 `2e606ae6f49e0f549cc337638939266e` |
| **Co** | FALA 34 (chatka, tartak, wycofanie, odfortyfikowanie) + **baner po turze** · **tooltipsy HUD** · **Spacja/◀▶ cykl armii** |
| **Testy** | tsc 0 · VERIFY OK |

---

## [12:00] ✅ Gotowe — deploy ROBOCZA FALA 34 (`1e7f4cad`)

| | |
|---|---|
| **Gdzie** | `gra-robocza/START.html` → `Gra-ROBOCZA.html` · md5 `1e7f4cad0435fe00d8464d41a7faf8ff` |
| **Co** | Scout fix chatki wioski · tartak tylko las + auto-usuwanie · wycofanie obrońcy · odfortyfikowanie garnizonu |
| **Testy** | tsc 0 · scout-auto-explore 10/10 · map-improvement-qualify 58/58 · VERIFY OK |

---
# Maciej — co jest gotowe (log agentów)

> **Jedna strona do przejrzenia.** Agenci dopisują **append-only** (najnowsze **na górze**).  
> **Czat:** krótko **`✅ Gotowe:`** / **`⏸️ Czeka:`** · **Ten plik:** pełniejszy zapis tego samego.  
> Szczegóły techniczne → handoff w `dyspozycje/_handoff/` · operacja → `dyspozycje/DZIENNIK-MASTERA.md`

## [10:20] ✅ Gotowe — deploy ROBOCZA FALA 33 (`2c3804da`)

| | |
|---|---|
| **Gdzie** | `gra-robocza/START.html` → `Gra-ROBOCZA.html` · md5 `2c3804da371c027043b2669b535268c7` |
| **Co** | Garnizon pod badge miasta · fix kultury 100% (założone/państwa-miasta) · **B-LAW-Q1** Prawo 100% (5/10 tur po podboju) · **C-MAP-Q3** strefy klimatyczne + `polarny` + Ziemia bez Antarktydy |
| **Testy** | tsc 0 · post-capture-law 11/11 · climate-band OK · conquest 29/29 · society 40/40 · manpower 62/62 · picker 140/140 · VERIFY OK |
| **Uwaga** | **Nowa gra** (Ctrl+F5) dla mapy klimatycznej |

---

## [10:30] ⏸️ Czeka — deploy ROBOCZA FALA 33 (kod gotowy, bez publishu)

| | |
|---|---|
| **Gdzie** | `gra/src/` — jeszcze **nie** w `gra-robocza/` (ostatnia ROBOCZA: FALA 32 `e7c0655d`) |
| **Co** | **Garnizon** wyśrodkowany pod badge miasta · **fix kultury** (`ownCultureShare`) · **B-LAW-Q1** (Prawo 100%: 5/10 tur) · **C-MAP-Q3** strefy klimatyczne (polarny/pustynia/równiny/umiarkowany), bez Antarktydy na Ziemi, bufor oceanu N/S |
| **Testy** | post-capture-law 11/11 · conquest-stability 29/29 · culture-religion 65/65 · society-breakdown 40/40 · climate-band OK · map-gen rivers 717/717 · tsc 0 |
| **Uwaga** | generator standard ~5.08 s (próg AC 5 s — marginalnie) · **Nowa gra** po deploy (Ctrl+F5) |

---

## [10:15] ⏸️ Czeka — deploy ROBOCZA FALA 33 (kod gotowy, bez publishu)

| | |
|---|---|
| **Gdzie** | `gra/src/` — jeszcze **nie** w `gra-robocza/` (ostatnia ROBOCZA: FALA 32 `e7c0655d`) |
| **Co** | **Garnizon** wyśrodkowany pod badge miasta (`cityPanel.ts`) · **fix kultury** — założone/państwa-miasta trzymają Grecka 100% od tury 2 (`main.ts` ownCultureShare) · **B-LAW-Q1** — Prawo 100% przez 5 tur (podbój) / 10 tur (odbicie po buncie) (`post-capture-law.ts`) |
| **Testy** | post-capture-law 11/11 · conquest-stability 29/29 · culture-religion 65/65 · society-breakdown 40/40 · tsc 0 |

---

## [01:45] ✅ Gotowe — deploy ROBOCZA FALA 31 (`f694dcba`)

| | |
|---|---|
| **Gdzie** | `gra-robocza/START.html` → `Gra-ROBOCZA.html` · md5 `f694dcba20acc6ed63866da4e3cd4672` |
| **Co** | Wojna bez stałego paska (tylko Wydarzenia) · klik mapy `pickMapTarget`+raycast · dyplomacja „Twoje państwo" (moc/skarbiec/stawki/nauka/ludność/armia) · **B-MP-Q1** HP heal z Manpower (25/20/15% maxHP, częściowe MP, brak w oblężeniu) |
| **Testy** | tsc 0 · manpower 62/62 · picker 140/140 · diplomacy-display 17/17 · logic 207/208 (pre garnizon) · VERIFY OK |

---

## [01:18] ✅ Gotowe — deploy ROBOCZA FALA 30 (`d9f2c1fa`)

| | |
|---|---|
| **Gdzie** | `gra-robocza/START.html` → `Gra-ROBOCZA.html` · md5 `d9f2c1fa32cd9b8165c00de127339ab3` |
| **Co** | Modal handlu dyplomacji (koszyk + wybór tur + podsumowania + Esc) · sentry odznacza jednostkę gracza · cache AI w pętli handlu (fix wolnych tur) |
| **Testy** | tsc 0 · diplomacy-display 17/17 · diplomacy-negotiation-table 39/39 · manpower 44/44 · logic 207/208 (pre garnizon) · VERIFY OK |

---

## [01:01] ✅ Gotowe — deploy ROBOCZA FALA 29 (`e0238cc8`)

| | |
|---|---|
| **Gdzie** | `gra-robocza/START.html` → `Gra-ROBOCZA.html` · md5 `e0238cc8114bfe065a55573a590c714e` |
| **Co** | Nagłówek miasta flank layout · fix „i szczegóły" (z-index 410, pointer-events) · rekrutacja bez HP w podtytule · kolory wymagań budynków · sekcja budynków 2× · hex detail panel double-click · pieczęć build ukryta + ℹ toggle |
| **Testy** | tsc 0 · manpower 44/44 · deposit-building-gate 41/41 · logic 207/208 (pre garnizon) · VERIFY OK |

---

## [23:38] ✅ Gotowe — deploy ROBOCZA FALA 25 (`1636f388`)

| | |
|---|---|
| **Gdzie** | `gra-robocza/START.html` → `Gra-ROBOCZA.html` · md5 `1636f388b512b008a2b95a6a46d8bdb9` |
| **Co** | Kultura/religia: bez podwójnej kary „Obca kultura"; miasta założone 100% kultury; podbój tej samej kultury (Grecka→Grecka) = pełna zgodność + religia państwa; panel Kultura/Religia ze składem % |
| **Testy** | tsc 0 · manpower 44/44 · ai-test 246/246 · map-attack-city 8/8 · society-breakdown 40/40 · VERIFY OK |

---

## [23:28] ✅ Gotowe — deploy ROBOCZA FALA 24 (`4a8745eb`)

| | |
|---|---|
| **Gdzie** | `gra-robocza/START.html` → `Gra-ROBOCZA.html` · md5 `4a8745eb332dbc9c3bd280e530ce60c7` |
| **Co** | Wszystko z F23 + **Manpower imperium** (rekrutacja tylko z puli cywilizacji, bez spadku obywateli; zwrot MP do imperium) |
| **Testy** | tsc 0 · manpower 44/44 · ai-test 246/246 · map-attack-city 8/8 |

---

## [23:21] ✅ Gotowe — deploy ROBOCZA FALA 23 (`e5972875`)

| | |
|---|---|
| **Gdzie** | `gra-robocza/START.html` → `Gra-ROBOCZA.html` · md5 `e5972875918e6e57c67657e2041674d2` |
| **Co** | Alert produkcji (tylko gdy jest co wybrać; ✕ + fingerprint; bez auto-budowy) · lista miast „Kolejka pusta" warunkowo · baner zasobów miasta 2×3 · klik w miasto przy jednostce → marsz (0 ruchu = podgląd trasy) · P-AI-011 + C-AI w bundlu |
| **Testy** | tsc 0 · ai-test 246/246 · map-attack-city 8/8 |

---

## [23:15] ✅ Gotowe — AI proaktywny handel (P-AI-011, kod w `gra/src`, bez deploy)

| | |
|---|---|
| **Co** | Deficyt surowców (magazyn + kolejka budowy + niski spichlerz) → AI kupuje u partnera · `zaproponuj_audiencje` (HUD + auto-kontakt + propozycja na stole) · handel przed sojuszem/paktem · cena z marginesem archetypu (`handlowosc`) · hint „X handluje z Y" · miasta-państwa: krótszy cooldown przy deficycie |
| **Pliki** | `ai-resource-needs.ts`, `ai.ts`, `main.ts`, `diplomacy-layers.ts`, `diplomacy-resource-trade-pick.ts`, `diplomacy-economy.ts` |
| **Testy** | tsc 0 · ai-test 246/246 · diplomacy-proposal 66/66 · resource-trade-pick 9/9 · ai-resource-needs 4/4 · diplomacy-layers 17/17 |
| **Deploy** | ⏸️ czeka na **deploy** do `gra-robocza/` |

---

## [22:40] ✅ Gotowe — pakiet C-AI: rozwój + wojna + ekspansja (kod w `gra/src`, bez deploy)

| | |
|---|---|
| **Decyzje** | C-AI-WOJNA-Q1/ EKSP-Q1/Q2 / PAKIET-Q1–Q3 / MOC-Q1–Q3 (wszystkie A lub B/C wg formularza) |
| **Naprawione błędy** | Usunięty osadnik z AI · founding przez `foundCityAt` (panel budowy) · wojna wymagana przed atakiem AI↔AI · dyplomacja przed ruchem |
| **Rozwój** | Cel #1 Mocy co 3 tury · `ekspansywnosc`/`sklonnoscDoPodboju` z civ-ai.json · sąsiad ≤8 hex · agresywne cyw. eksplorują |
| **Pliki** | `ai.ts`, `main.ts`, `civ-ai-data.ts`, `ai-war-gate-test.cjs` |
| **Spec** | `docs/decyzje/C-AI-ROZWOJ-PAKIET-2026-07-26.md` |
| **Deploy** | ⏸️ czeka na build do `gra-robocza/` (powiedz **deploy** gdy chcesz w grze) |

---


| | |
|---|---|
| **Prośba** | Maciej: „czemu te nowe rzeczy nie są w main?" + „zrób deploy do roboczej" |
| **Ze stash** | B-PALAC-TIER (palac/palac_ii/palac_iii + koszty surowców + bonus ×1,5) · B-RESEARCH-COST (GLOBAL=1, tech.json ×2) · B-TECH-EARLY (Obróbka/Murarstwo=5) · building-upgrades/conquest-stability/cityPanel |
| **Konflikt** | `buildings.json`: tiery pałacu ze stash wygrały nad FALA-8 „Pałac bez surowców" |
| **FALA 8 zachowana** | blokada 1. miasta · UI surowców · kamień współistnieje · Civpedia · mapa Ziemia |
| **Deploy** | ROBOCZA **`0de2599c`** · md5 `0de2599cba16087cbb47cb202fdb616c` · `gra-robocza/START.html` |
| **Bramki** | tsc 0 · research 33/33 · tech-tempo 15/15 · difficulty-cost 22/22 · conquest-stability 27/27 · VERIFY OK |
| **Git** | commit + push origin main |

---

## [23:52] ✅ Gotowe — stash→pull→pop + deploy ROBOCZA `c7e16e51`

| | |
|---|---|
| **Sync** | pull FF: already up to date @ `90263d3` (FALA 8) · stash drop (zmiany już w WT) |
| **Deploy** | ROBOCZA **`c7e16e51`** · md5 `c7e16e5172316f181892a5512518f0a4` · `gra-robocza/START.html` |
| **FALA 8** | Pałac bez surowców · blokada 1. miasta · UI surowców · kamień współistnieje · Civpedia |
| **Bramki** | tsc 0 · research 33/33 · tech-tempo 12/12 · difficulty-cost 22/22 · conquest-stability 27/27 |
| **Uwaga** | B-PALAC-TIER = tylko doc (nie wdrożony) · bez git push |

---

## [23:50] ✅ Gotowe — pull FALA 8 + deploy ROBOCZA `e65036fd`

| | |
|---|---|
| **Sync** | behind 4 → pull FF do `90263d3` (FALA 8 chmury) |
| **Deploy** | ROBOCZA **`e65036fd`** · md5 `e65036fde18cb7eb738d8c78797b2ca8` · `gra-robocza/START.html` |
| **FALA 8** | Pałac bez surowców · blokada 1. miasta · UI surowców (widoczność+panel) · kamień współistnieje · Civpedia |
| **Bramki** | tsc 0 · research 33/33 · tech-tempo 12/12 · difficulty-cost 22/22 |
| **Uwaga** | Lokalne zmiany pre-pull w stash (`git stash list`) — nie push |

---

## [01:15] ✅ Gotowe — audyt 9a0ca985 luki: ruda stock + KULT-04 Power + deploy ROBOCZA `98c4ede1`

| | |
|---|---|
| **Deploy** | ROBOCZA **`98c4ede1`** · md5 `98c4ede16e506df393369a49dabe25bb` · `gra-robocza/Gra-ROBOCZA.html` |
| **Ruda** | Kopalnia miedzi → stock `ruda` · kopalnia (żelazo) → `ruda_zelaza` · 2/t → Odlewnia brązu/żelaza |
| **Power KULT-04** | Kultura imperium ×0,5 + miasta z jedną wiarą ×25 w formule Mocy |
| **Dane** | warzelnia_soli wybrzeże w JSON · palac tech `-` · kuznia bez „cyna" |
| **Odłożone** | Faza 3 koszty materiałowe (tylko access gates w B-SUROW-BUD) |

---

## [01:10] ✅ Gotowe — faza 2 surowce + audyt budynków + deploy ROBOCZA `9a0ca985`

| | |
|---|---|
| **Deploy** | ROBOCZA **`9a0ca985`** · `gra-robocza/Gra-ROBOCZA.html` |
| **Surowce** | Deski wycofane · 7 konwerterów · bramki epok imperium · Spichlerz II · Sól w kanonie danych |
| **Kultura** | Presja co turę · capture zachowuje mix · dyplomacja bonus AND (wiara+okręg) |
| **Luki otwarte** | Stock rudy do magazynu · KULT-04 Power · warzelnia teren w JSON |

---


Decyzja zapisana: **deski wylatują**, Stolarnia = bonus Pracy, bramki Brąz (drewno+kamień) · Żelazo (+cegła). Handoff + checklist Integratora. Kod czeka **`działaj`**.

---

## [12:34] ✅ Gotowe — kultura/religia: Power + dyplomacja (KULT-04, KULT-DYP-01, zapis bez kodu)

| | |
|---|---|
| **Decyzje** | **KULT-04=A** kultura+religia → składniki **Power** (nie victory kultura) · **KULT-DYP-01=A mod.** bonus +0,5/t **tylko** wspólna wiara **+** okręg kulturowy · **bez kar** obca wiara/kultura |
| **Pliki** | `B-KULT-REL-2026-07-22.md` §KULT-04/§KULT-DYP-01 · rejestr 🟡 ×2 · handoff `B-KULT-DYP-do-INTEGRATOR.md` · audyt §15 PACZKA ZAMKNIĘTA |
| **Kod** | **Brak** — czeka **`działaj`** |
| **Paczka** | Wszystkie ID kultura/religia **zamknięte** (checklist w audycie §15) |

---

## [12:31] ✅ Gotowe — presja kultury+religii paczka 2/2 (KULT-PRESJA-04…06, zapis bez kodu)

| | |
|---|---|
| **Decyzje** | **04=A** religia mirror 7/5/3% · **05=A** zachować % po podboju · **06=A** symetria obniżania u granicy |
| **Pliki** | `B-KULT-PRESJA-2026-07-23.md` §04–06 · rejestr 🟡 ×3 · JSON `religia_presja_proc_tura` · handoff zaktualizowany |
| **Kod** | **Brak** — czeka `działaj` |

---

## [01:30] ✅ Gotowe — presja kultury paczka 1/2 (KULT-PRESJA, zapis bez kodu)

| | |
|---|---|
| **Decyzje** | **01=A** siła imperium (HUD) · **02=A** zasięg okolicy · **03** easy 7% / normal 5% / hard 3% /t |
| **Pliki** | `docs/decyzje/B-KULT-PRESJA-2026-07-23.md` · rejestr 🟡 · JSON `kultura_presja_proc_tura` · handoff Integrator |
| **Kod** | **Brak** — czeka `działaj` · KULT-01 hex-claim superseded |
| **Następny krok** | **Paczka 2/2** — mirror **religii** (REL-PRESJA-01…03) |

---

## [01:00] ⏸️ Czeka deploy — balans budynków kultura/religia (KULT-BUD-01 + 02)

| | |
|---|---|
| **KULT-BUD-01** | Pałac +2% konw. · Bib +2/+1/lvl +2% · Stela +0,5% · Garncarnia 0 · Sąd +5/+2% · Łaźnia +3/+1% |
| **KULT-BUD-02** | Kręgi +2%/t religii · Świątynia +4%/t religii · baza 2%/t bez zmian |
| **Testy** | conquest-stability 27/27 · culture-religion 65/65 · tsc OK |
| **Deploy** | Jeszcze nie |

---

## [00:45] ✅ Gotowe — revert błędnego kodu kultury (Q1C/Q4A)

| | |
|---|---|
| **Wycofano** | `culture-hex-claim.ts` (Shift+klik claim hex), zwycięstwo kulturowe w `victory.ts`, opcja „Tylko kultura" w kreatorze, `kultura_koszt_claim_hex` z society-params |
| **Zostaje** | conquest-stability, podział budynków kultura/religia, handel religijny Q3A, podwójne szczęście Q5A, post-battle-map |
| **Testy** | tsc + conquest-stability + culture-religion + victory — uruchomić przed deploy |
| **Następny krok** | **B-SPIC** (Spichlerz) — decyzje w `docs/decyzje/B-SPIC-2026-07-23.md`, czeka `działaj` |

---

## [00:25] ⏸️ Czeka deploy — podział budynków kultura / religia

| | |
|---|---|
| **Zasada** | Kulturalne → tylko konwersja kultury · Religijne → tylko konwersja religii (szczęście mogą dawać oba) |
| **Zmiana** | Świątynia nie przyspiesza już kultury po podboju; Kręgi +1%/t religii |
| **Testy** | conquest-stability 20/20 · culture-religion 57/57 · tsc OK |
| **Deploy** | Jeszcze nie — razem z paczką kultura/religia |

---

## [00:30] ✅ Gotowe — korekta routingu ABC (Spichlerz ≠ kultura)

| | |
|---|---|
| **Błąd** | Odpowiedzi **Q1C · Q2A · Q3A · Q4A · Q5A** z 2026-07-23 zapisano jako B-KULT-REL — to były pytania **Spichlerz / sól / bonusy** |
| **Spichlerz** | **B-SPIC-Q1=C · Q2=A · Q3=A · Q4=A · Q5=B** → `docs/decyzje/B-SPIC-2026-07-23.md` · 🟡 czeka `działaj` |
| **Kultura** | Przywrócono decyzje **2026-07-22:** Q1**A** · Q2**A** · Q3**A** · Q4**C** · Q5**A** → `docs/decyzje/B-KULT-REL-2026-07-22.md` |
| **Kod błędny** | `culture-hex-claim.ts` i zwycięstwo kulturowe — **niezgodne** z Twoją decyzją kultury; do revertu w batchu B/F |
| **Deploy** | Bez zmian — nadal czeka na „deploy" |

---

## [00:15] ⚠️ UNIEWAŻNIONE — błędnie przypisane B-KULT-REL (2026-07-23)

| | |
|---|---|
| **Status** | Wpis **unieważniony** — patrz korekta [00:30] powyżej |
| **Było** | Q1C hex-claim · Q4A victory kultura — **to nie były Twoje odpowiedzi o kulturze** |
| **Faktycznie** | Te same literki = paczka **Spichlerz** (B-SPIC-Q1…Q5) |

---

## [23:55] ⏸️ Czeka deploy — kultura i religia po podboju (Paczka A, część 1)

| | |
|---|---|
| **Co** | Podbite miasto startuje z 0% naszej kultury; co turę konwersja kultury (1–5%/t) i religii (2–4%/t ze Świątynią) |
| **Utrzymanie** | Obca kultura + obca religia → −2 Sz, bez garnizonu −3 Prawo i ×1,5 ryzyko buntu |
| **Budynki** | Świątynia/Teatr/Akademia/Biblioteka przyspieszają konwersję kultury; Świątynia — religię |
| **Q5A** | Podwojone bonusy/kary szczęścia z kultury/religii w `society-params.json` |
| **Testy** | `conquest-stability-test.cjs` 13/13 · `tsc` zielony |
| **Deploy** | **Jeszcze nie** — kod w repo; po deploy dam stamp md5 |
| **Od Ciebie** | Po deploy: podbij obce miasto → panel Sz/Prawo bez garnizonu vs ze Świątynią |

**Jeszcze nie wdrożone:** dyplomacja wspólna/obca wiara (A5 z audytu).

---

## [22:50] ✅ Gotowe — faza 1: realistyczny dostęp surowców (złoże + ulepszenie)

| | |
|---|---|
| **Co** | Panel miasta rozróżnia potencjał (złoże) vs dostęp aktywny (po ulepszeniu terenu) |
| **Reguła** | Glina, miedź, ruda/żelazo/węgiel, sól, koń = złoże + ulepszenie na tym heksie |
| **Wyjątki** | Tartak, kamieniołom (bez złoża); warzelnia na wybrzeżu; hodowla bez złoża (Model B) |
| **Pilot budynku** | Garncarnia/Cegielnia wymagają aktywnej Gliny — reszta budynków w fazie 2 |
| **md5** | `5000ee9fce6fa0c332303784ff045eb8` · stamp `5000ee9f` |
| **Od Ciebie** | Ctrl+F5 · stamp `5000ee9f` · panel miasta → Surowce: szare = złoże, kolor = aktywne |

---

**Ostatnia aktualizacja:** 2026-07-22 (FAZA 1 surowce @ 5000ee9f)

---

## [22:45] ✅ Gotowe — suwak żywność→armia osobno w każdym mieście

| | |
|---|---|
| **Co** | Suwak „Wzrost / Armia" w panelu miasta działa per miasto, nie globalnie |
| **Bug** | Zmiana w mieście A zmieniała też ustawienie w mieście B |
| **Fix** | `City.procentRozwoj` — zapis per miasto; stary save migrowany z empireFoodStates |
| **md5** | `7e038328910eb09f9ca90beaf06a5e59` · stamp `7e038328` |
| **Od Ciebie** | Ctrl+F5 · stamp `7e038328` · 2+ miasta → różne suwaki → każde trzyma własne % |

---

## [14:35] ✅ Gotowe — dialog POŁĄCZENIE ARMII dopiero na starcie Twojej tury

| | |
|---|---|
| **Co** | Dialog łączenia armii nie wyskakuje w trakcie tury przeciwnika |
| **Bug** | Nowa jednostka z produkcji end-turn na heks z inną jednostką → dialog „POŁĄCZENIE ARMII" w trakcie ruchów AI |
| **Fix** | Kolejka `deferredMergePrompts` — prompt po overlay „Tura N — twoja kolej" (spójnie z odłożonym revealem jednostek) |
| **Rush / ruch w turze** | Bez zmian — dialog natychmiast |
| **md5** | `7238588c73778b8761ec5bf999268b09` · stamp `7238588c` |
| **Od Ciebie** | Ctrl+F5 · stamp `7238588c` · rekrutuj na heks z jednostką → Zakończ turę → dialog dopiero po AI |

---

## [14:30] ✅ Gotowe — opisowe nazwy zapisów

| | |
|---|---|
| **Co** | Dialog „Zapisz grę" proponuje nazwę z kontekstu rozgrywki zamiast „Zapis · tura N" |
| **Format** | `{stolica} · rok {YYYY} p.n.e. · tura {N} · {mapa} · {trudność}` — np. „Ateny · rok 3500 p.n.e. · tura 10 · Standardowy · Normalny" |
| **Szybki zapis / autozapis** | Ten sam kontekst z prefiksem „Szybki zapis ·" / „Autozapis ·" |
| **md5** | `d7ad2f76e755e42352bb421a1a19c2fa` · stamp `d7ad2f76` |
| **Od Ciebie** | Ctrl+F5 · stamp `d7ad2f76` · menu pauzy → Zapisz grę → sprawdź proponowaną nazwę |

---

## [14:15] ✅ Gotowe — jednostki widoczne dopiero po ruchu AI

| | |
|---|---|
| **Co** | Nowe jednostki z produkcji/rekrutacji nie pojawiają się na mapie w trakcie „Zakończ turę" |
| **Bug** | Token jednostki był widoczny od razu po kliknięciu end-turn, zanim przeciwnicy ruszyli |
| **Fix** | Odłożony reveal (`deferredPlayerUnitRevealIds`) — widoczne dopiero gdy overlay pokazuje „Tura N — twoja kolej" |
| **Wykup (rush)** | Bez zmian — jednostka od razu w trakcie Twojej tury |
| **md5** | `c72ab1b8c45c61364f754daf085ae41f` · stamp `c72ab1b8` |
| **Od Ciebie** | Ctrl+F5 · stamp `c72ab1b8` · zrekrutuj jednostkę → Zakończ turę → sprawdź że pojawia się dopiero po AI |

---

## [13:30] ✅ Gotowe — Ranking Moc ↔ mgła wojny (FoW)

| | |
|---|---|
| **Co** | Widoczność rankingu Moc zależy od mgły wojny — bez osobnego przełącznika testowego |
| **FoW włączony** | Ranking: tylko odkryte pełne cywilizacje + Ty (bez miast-państw) |
| **FoW wyłączony (F)** | Ranking: wszystkie pełne cywilizacje (dev/test) |
| **Usunięto** | Checkbox [TEST], `?debugPowerRankingAll=1`, `localStorage civ.debugPowerRankingAll` |
| **md5** | `2f32fbea89183d908099e984414db2cb` · stamp `2f32fbea` |
| **Od Ciebie** | Ctrl+F5 · stamp `2f32fbea` · panel Moc → FoW ON = tylko odkryte · naciśnij **F** (FoW OFF) = pełna lista |

---

## [13:00] ✅ Gotowe — Ranking Moc: bez miast-państw + mgła wojny

| | |
|---|---|
| **Co** | Ranking Moc pokazuje tylko **pełne cywilizacje** (nie miasta-państwa) i tylko **odkryte** nacje; gracz zawsze na liście |
| **Bug** | W rankingu były wpisy typu „Ur · miasto-państwo" oraz nieodkryte AI |
| **Fix** | `gra/src/game/power-ranking.ts` + filtr w `buildPowerRankingByOwner` |
| **TEMP test** | Checkbox **[TEST] Pokaż moc wszystkich cywilizacji** w panelu Moc (ROBOCZA) · lub konsola: `localStorage.setItem('civ.debugPowerRankingAll','true')` + F5 · lub URL `?debugPowerRankingAll=1` · wyłącz: `'false'` lub checkbox odznacz |
| **md5** | `6a9b8e729d52f1adb2ea556a265b12e0` · stamp `6a9b8e72` |
| **Od Ciebie** | Ctrl+F5 · stamp `6a9b8e72` · Nowa gra → panel Moc → Ranking: brak „· miasto-państwo" · tylko Ty dopóki nie odkryjesz innych |

---

## [12:15] ✅ Gotowe — MAPA: FIX spawn cywilizacji (continent-aware)

| | |
|---|---|
| **Co** | Suwak „Liczba cywilizacji" (np. 15) → faktycznie tyle klastrów na mapie; kontynenty nie zostają puste |
| **Bug** | 15 żądanych → ~10 na mapie; cywilizacje skupione na jednym kontynencie, inne puste |
| **Fix** | Środki klastrów rozłożone po masach lądu (kontynenty/wyspy); fallback gdy layout nie mieści się w regionie |
| **Pliki** | `clusters.ts`, `main.ts`, `cluster-start-test.cjs` |
| **md5** | `cd615c1e5a332919b72a183a7f980c60` · stamp `cd615c1e` |
| **Od Ciebie** | Ctrl+F5 · stamp `cd615c1e` · Super Huge + 15 cywilizacji → wszystkie frakcje na mapie, rozłożone |

---

## [11:30] ✅ Gotowe — MAPA: FIX odstęp 3 hex między miastami-państwami

| | |
|---|---|
| **Co** | Miasta-państwa min **3 hex od siebie nawzajem** (nie tylko od stolicy) |
| **Bug** | Kandydaci runtime łączeni z wielu seedów bez filtra — mogły być 1 hex od siebie |
| **Fix** | `tryAdd()` w `cluster-spawn.ts` — para-po-parze min 3 hex |
| **Pliki** | `cluster-spawn.ts`, `cluster-start-test.cjs` |
| **md5** | `e5cb5ab6a5dbe77b618e34ebd767951d` · stamp `e5cb5ab6` |
| **Od Ciebie** | `git pull` → Ctrl+F5 · stamp `e5cb5ab6` · Nowa gra → stolica → państwa min 3 hex od siebie |

---

## [10:45] ✅ Gotowe — MAPA: twardy klaster miast-państw 3 hex

| | |
|---|---|
| **Co** | Miasta-państwa spawnują w pierścieniu **min 3 / max 3 hex** od Twojej stolicy — ciasne skupisko |
| **Stałe** | `CLUSTER_CITY_STATE_MIN_HEX=3`, `CLUSTER_CITY_STATE_MAX_HEX=3` w `clusters.ts` |
| **Pliki** | `clusters.ts`, `main.ts`, `cluster-start-test.cjs` |
| **md5** | `05d689e333d9d29543f1da9e1bebaa9b` · stamp `05d689e3` |
| **Od Ciebie** | `git pull` → Ctrl+F5 · stamp `05d689e3` · Nowa gra → załóż stolicę → państwa w pierścieniu 3 hex |

---

## [10:20] ✅ Gotowe — BALANS: Super Huge miasta-państwa 7·8·9

| | |
|---|---|
| **Co** | Super Huge: menu miast-państw min **7** · domyślnie **8** · max **9** (było 6·9·9) |
| **Decyzja** | Maciej 2026-07-22 — mniej domyślnej gęstości na największej mapie |
| **Pliki** | `newGameMapDefaults.ts`, `e-start-params.json`, `map-scale-menu-test.cjs` |
| **md5** | `4760325c0191876a107104b75622297b` · stamp `4760325c` |
| **Od Ciebie** | `git pull` → Ctrl+F5 · stamp `4760325c` · Nowa gra Super Huge → suwak MP 7·8·9 · domyślnie 8 |

---

## [10:30] ✅ Gotowe — BALANS: cap miast-państw max 9 (skala z mapą)

| | |
|---|---|
| **Co** | W klastrze gracza max **9** miast-państw (+ Twoja stolica = 10); mniejsze mapy mają mniej (np. Standard domyślnie 6) |
| **Przyczyna** | ×2 balans 2026-07-20 podniósł sufit do 18 — za gęsto wokół gracza |
| **Fix** | `MAX_MIAST_PANSTWA=9`, drabinka per tier, clamp przy spawnie i w kreatorze; chatki ze skarbami liczone od nowej liczby miast |
| **Pliki** | `newGameMapDefaults.ts`, `e-start-params.json`, `main.ts`, `generator.ts`, `newGameFlow.ts` |
| **md5** | `6865baf802e6ced6a0721e2a1f4d9c0b` · stamp `6865baf8` |
| **Od Ciebie** | `git pull` → Ctrl+F5 · stamp `6865baf8` · Nowa gra Standardowy → suwak MP max 7 · w klastrze ~6 satelitów + stolica |

---

## [10:15] ✅ Gotowe — FIX: chatki ze skarbem (spawn wg trudności)

| | |
|---|---|
| **Co** | Chatki spawnują pełną liczbę wg trudności: HART=1 · NORMAL=2 · EZ=3 na każde miasto startowe |
| **Przyczyna** | Formuła miast×trudność była OK, ale zbyt duży spacing (5 hex) — na mapie mieściło się tylko ~30% celu |
| **Fix** | Spacing 3 hex, min od miasta 3 hex (`villages.ts`) |
| **Pliki** | `gra/src/map/villages.ts`, `gra/tools/map-gen-regression-test.cjs` |
| **md5** | `6865baf802e6ced6a0721e2a1f4d9c0b` · stamp `6865baf8` |
| **Od Ciebie** | `git pull` → Ctrl+F5 · stamp `6865baf8` · Nowa gra Normal → dużo więcej chat na mapie |

---

## [10:05] ✅ Gotowe — FIX: AI/miasta-państwa — farmy dopiero po Rolnictwie

| | |
|---|---|
| **Co** | AI i miasta-państwa budują farmy dopiero po ukończeniu tech Rolnictwo (z kosztem nauki), tak jak gracz |
| **Przyczyna** | AI kończyło każdą tech natychmiast co turę (`aiDone.add`), bez puli Nauki i `researchStep` |
| **Fix** | `aiNaukaPoolByOwner` + `runAiResearchForOwner` (bank nauki → chooseAIResearch → researchStep) |
| **Pliki** | `gra/src/main.ts` |
| **md5** | `ae64786b05cd77d6dbb8d807ac209b4e` · stamp `ae64786b` |
| **Od Ciebie** | `git pull` → Ctrl+F5 · stamp `ae64786b` · Nowa gra Kamień → sąsiednie miasto-państwo bez farm w turach 1–3 |

---

## [08:30] ✅ Gotowe — FIX: dyplomacja pierwszy kontakt (Syrakuzy / dary)

| | |
|---|---|
| **Co** | Lista dyplomacji tylko po formalnym kontakcie; auto-audiencja przy pierwszym spotkaniu; brak darów AI przed kontaktem |
| **Przyczyna** | Kontakt z `explored` (hex widziany kiedyś) — miasto znika z mapy, wpis zostaje; AI darowało po samym hexie |
| **Fix** | `diplomaticallyDiscoveredOwners` · lista = `diplomaticContactEstablished` · filter AI darów/handlu |
| **Pliki** | `diplomacy-layers.ts` · `main.ts` · `diplomacy-layers-test.cjs` |
| **md5** | `59d90c13cf1056f05f669465a760f758` · stamp `59d90c13` |
| **Od Ciebie** | `git pull` → Ctrl+F5 · stamp `59d90c13` · spotkaj miasto-państwo → auto-audiencja → „Nawiąż kontakt" → wpis w dyplomacji |

---

## [08:15] ✅ Gotowe — FIX: pierścień Nauki wyśrodkowany (toolbar + chip)

| | |
|---|---|
| **Co** | Pierścień postępu Nauki **koncentryczny** z medalionem — jak złote bordery innych ikon toolbaru (52px) i chipu górnego (30px) |
| **Przyczyna** | CSS `.tb svg` / `.civ-hud-chip-med svg` zmniejszał ring do 26×26 / 17×17 px → offset w lewy górny róg |
| **Fix** | `:not(.civ-science-prog-ring)` + `width/height:100%` na ring; SVG tylko viewBox; chip stroke 1px |
| **Pliki** | `scienceProgressRing.ts` · `mapToolbarHud.ts` · `hudChip6c.ts` · `hud.ts` |
| **md5** | `59d90c13cf1056f05f669465a760f758` · stamp `59d90c13` |
| **Od Ciebie** | `git pull` → Ctrl+F5 · `gra-robocza/START.html` → stamp `59d90c13` → pierścień wyśrodkowany; 0%/50%/100% |

---

## [08:00] ✅ Gotowe — FIX: miasta-państwa AI w Kamieniu (nie Brąz)

| | |
|---|---|
| **Co** | Obce AI / miasta-państwa na starcie gry w epoce Kamienia renderują **tipi/ognisko** (P1), nie megaron Brązu |
| **Przyczyna** | Niespójny `aiResearchDone` / brak reconcile przed pierwszym sync renderu klastra — `ownerEraByOwner` mogło iść na 2 przez Brązownictwo |
| **Fix** | `setupAiOwnerEpoch` tylko przy spawnie klastra; `aiResearchDone.clear()` + `reconcileAllOwnerErasFromResearch` przed sync; test 13/13 |
| **Pliki** | `gra/src/main.ts` · `gra/tools/owner-epoch-test.cjs` |
| **md5** | `35fd54491f7fda7921bf60e218bac727` · stamp `35fd5449` |
| **Od Ciebie** | `git pull` → Ctrl+F5 · `gra-robocza/START.html` → stamp `35fd5449` · Nowa gra Kamień → załóż miasto → sprawdź miasta-państwa |

---

## [07:45] ✅ Gotowe — FIX: pierścień Nauki bez ring-in-ring

| | |
|---|---|
| **Co** | Ikona Nauki (toolbar lewy + chip górny): **jeden** pierścień postępu — złoty = pozostało, niebieski rośnie zgodnie z ruchem wskazówek |
| **Przed** | CSS border złoty + nakładka SVG = podwójny pierścień (ring-in-ring) |
| **Po** | CSS border usunięty; SVG **zastępuje** rant medalionu (`#a08030` = `--tg-gold-dim`) |
| **Pliki** | `scienceProgressRing.ts` · `mapToolbarHud.ts` · `hudChip6c.ts` · `hud.ts` |
| **md5** | `435103481edfde9081d2207425ac18a3` · stamp `43510348` |
| **Bramki** | tsc=0 · publish robocza OK |
| **Od Ciebie** | `git pull` → Ctrl+F5 · `gra-robocza/START.html` → stamp `43510348` → wybierz tech → jeden pierścień; 0%/50%/100% czysto |

---

## [07:30] ✅ Gotowe — FIX: Praca → pula imperium bez utraty 1 jednostki

| | |
|---|---|
| **Co** | Pusta kolejka budynków: **cała** Praca miasta (np. Ateny 3+7=**10**) trafia na pulę imperium; z budynkiem w kolejce — tylko część DO PULI (+3) |
| **Przyczyna** | `Math.floor` na Pracy + ułamkowy mnożnik Porządku → silnik 9 vs podział HUD 7+3=10 |
| **Pliki** | `production.ts` (`cityPracaInteger`, `pracaImperialPoolGain`) · `economy.ts` · `turn-economy.ts` · `main.ts` |
| **md5** | `30e510b1885bf1da7362f1b45b62b392` · stamp `30e510b1` |
| **Bramki** | tsc=0 · production-overflow 20/20 · wire-ekonomia 37/37 |
| **Od Ciebie** | `git pull` → Ctrl+F5 · `gra-robocza/START.html` → stamp `30e510b1` → Ateny bez budynku: pula +10/turę (nie +9) |

---

## [08:25] ✅ Gotowe — pierścień postępu badań (HUD Nauki)

| | |
|---|---|
| **Co** | Pierścień wokół ikony Nauki (toolbar lewy + chip górny): **złoty** = pozostało, **niebieski** rośnie zgodnie z ruchem wskazówek od góry |
| **Pliki** | `scienceProgressRing.ts` · `mapToolbarHud.ts` · `hudChip6c.ts` · `hud.ts` · `main.ts` (`researchProgress`) |
| **Dane** | `researchProgress` = skumulowana nauka / koszt aktywnej tech (`player.badana`); odświeża się co turę i po zmianie celu |
| **md5** | `c254006dccb94e25a4121b3f377c157a` · stamp `c254006d` |
| **Bramki** | tsc=0 · verify OK |
| **Od Ciebie** | `git pull` → Ctrl+F5 · `gra-robocza/START.html` → stamp `c254006d` → wybierz tech → patrz pierścień na medalionie Nauki |

---

## [08:00] ✅ Gotowe — pierścień postępu badań (HUD Nauki, wstępny deploy)

| | |
|---|---|
| **Co** | Pierścień wokół ikony Nauki (toolbar lewy + chip górny): **złoty** = pozostało, **niebieski** rośnie zgodnie z ruchem wskazówek od góry |
| **Pliki** | `scienceProgressRing.ts` · `mapToolbarHud.ts` · `hudChip6c.ts` · `hud.ts` · `main.ts` (`researchProgress`) |
| **Dane** | `researchProgress` = skumulowana nauka / koszt aktywnej tech (`player.badana`); odświeża się co turę i po zmianie celu |
| **md5** | `9b539cb74bfc487a8c1fd7ef5d4af27b` · stamp `9b539cb7` |
| **Bramki** | tsc=0 · verify OK |
| **Od Ciebie** | `git pull` → Ctrl+F5 · `gra-robocza/START.html` → stamp `9b539cb7` → wybierz tech → patrz pierścień na medalionie Nauki (lewy toolbar) |

---

## [07:45] ✅ Gotowe — Zwiadowca 0 Manpower

| | |
|---|---|
| **Co** | Zwiadowca (`typeId=Zwiadowca`) **nie zużywa** puli Manpower przy rekrutacji (zakup złotem + ukończenie kolejki) |
| **Pliki** | `manpower.ts` · `production.ts` · `main.ts` · `cityPanel.ts` · `unitRecruitCard.ts` · `manpower-test.cjs` |
| **Przykład** | Pula MP = 0 → rekrutacja Zwiadowcy OK; Wojownik nadal wymaga pełnego kosztu epoki |
| **md5** | `c54dae3be8b3ab1cc0e5eebf7d04f9f0` · stamp `c54dae3b` |
| **Bramki** | tsc=0 · manpower-test 36/36 |
| **Od Ciebie** | `git pull` → Ctrl+F5 · `gra-robocza/START.html` → stamp `c54dae3b` → panel miasta → Zwiadowca pokazuje `0 👤` |

---

## [07:30] ✅ Gotowe — regen Manpower 2% (Rzym 4%)

| | |
|---|---|
| **Co** | Bazowy regen **5% → 2%** max/turę; bonusy Rzymianie **bez zmian** (2× pula + 2× regen) |
| **Pliki** | `miasto-params.json` · `manpower.ts` · `civs.json` (opis) · `manpower-test.cjs` |
| **Przykład ep1, 10 ludków** | Standard: max **10k**, regen **+200/t** · Rzym: max **20k**, regen **+800/t** |
| **md5** | `98889578644a90da33d1dc45d1a67994` · stamp `98889578` |
| **Bramki** | tsc=0 · manpower-test 30/30 |
| **Od Ciebie** | `git pull` → Ctrl+F5 · `gra-robocza/START.html` → stamp `98889578` → porównaj regen standard vs Rzym |

---

| | |
|---|---|
| **Co** | Rzymianie: **2× pula Manpower max** per ludek + **2× tempo odnowy** puli |
| **Pliki** | `gra/data/civs.json` · `gra/src/game/manpower.ts` · `turn-economy.ts` · `main.ts` |
| **Przykład** | Ep1, 10 ludków: max **20k** MP (inne cyw. 10k); regen **+1000/t** (inne +500) |
| **md5** | `a28c034e03223ec6fb4cd52401b0d86c` · stamp `a28c034e` |
| **Bramki** | tsc=0 · manpower-test 30/30 |
| **Od Ciebie** | `git pull` → Ctrl+F5 · `gra-robocza/START.html` → stamp `a28c034e` → Nowa gra Rzymianie → sprawdź max i regen vs np. Grecy |

---

## [07:00] CHMURA → LOKALNA — BATCH: Manpower + deploy sesji 2026-07-22

ROBOCZA stamp **`3613d5d4`** · md5 `3613d5d4ca248a3fa3f6879061aad3dc`.
Bramki: tsc=0 · manpower-test 24/24.
CZEKAM-NA: sesja lokalna — `git pull` → Ctrl+F5 START.html → stamp `3613d5d4`.

---

## [2026-07-22] ✅ Gotowe — balans Manpower (rekrutacja ×10, regen 5%)

| | |
|---|---|
| **Co** | Koszt rekrutacji ×10: **1 ludek = 1 jednostka** przy pełnej puli Manpower; odnowa puli **10% → 5%** max/turę |
| **Pliki** | `gra/data/epoka-ludnosc-manpower.json` · `gra/data/miasto-params.json` · `gra/src/game/manpower.ts` |
| **Przykład** | Ep1, 10 ludków, max 10k MP → rekrutacja 1 włócznika = 1000 MP (1 slot); regen +500/turę (~20 tur do pełna) |
| **md5** | `3613d5d4ca248a3fa3f6879061aad3dc` · stamp `3613d5d4` |
| **Bramki** | tsc=0 · manpower-test 24/24 |
| **Od Ciebie** | `git pull` → Ctrl+F5 · `gra-robocza/START.html` → stamp `3613d5d4` → rekrutuj jednostkę → sprawdź pulę i regen co turę |

**W tym samym bundlu (sesja 2026-07-22):** dyplomacja (komunikaty AI, kultura, status vs postawa, ikona wojny) · badania koszt ×2 · budynki koszt ÷2 · granice państwa (ciągłe, grubsze, 30% alpha) · nazwy miast-państw 10–18 · overflow Pracy → pula cywilizacji · epoka startowa CS = Kamień · fix zwiadowca/wsparcie ATK post-battle · cooldown darów ¤ AI · panel badań lista techów · +1 szczęścia/budynek · cap ofert AI do skarbca.

---

## [06:45] INTEGRATOR → MASTER — EKONOMIA: +1 szczęścia per budynek

Decyzja Macieja: każdy budynek +1 szczęścia; istniejący `baza.zadowolenie` dokładany.
Hook: `buildingHappinessAtLevel` / `sumBuildingHappinessFromBuiltIds` (`economy.ts`).
ROBOCZA stamp **`81e95aaa`** · md5 `81e95aaae7cbea9034c0df360ce34845`.
Bramki: tsc=0 · building-happiness-test 8/8 · society-breakdown 40/40 · VERIFY OK.
CZEKAM-NA: playtest miasta (panel Sz / tooltip „Budynki (+1/budynek)")

---

## [2026-07-22] ✅ Gotowe — +1 szczęścia za każdy budynek

| | |
|---|---|
| **Co** | Każdy zbudowany budynek daje **+1 szczęścia**; bonus z JSON (`baza.zadowolenie`) **dokładany** |
| **Hook** | `gra/src/game/economy.ts` — `buildingHappinessAtLevel`, `sumBuildingHappinessFromBuiltIds` |
| **Przykład** | Świątynia zadowolenie 3 → **4**; budynek z 2 w JSON → **3**; Mury (0) → **1** |
| **Test** | 3 budynki (mury+świątynia+studnia) → **7** (= 3×+1 + bonusy JSON) |
| **md5** | `81e95aaae7cbea9034c0df360ce34845` · stamp `81e95aaa` |
| **Bramki** | tsc=0 · building-happiness-test 8/8 · society-breakdown 40/40 |
| **Od Ciebie** | `git pull` → Ctrl+F5 · `gra-robocza/START.html` → stamp `81e95aaa` → miasto → panel Sz |

---

## [2026-07-22] ✅ Gotowe — granice państwa szersze i bardziej przezroczyste

| | |
|---|---|
| **Co** | Obrys terytorium na mapie: pas **2,5× szerszy**, alpha **30%** (było 50%) |
| **Plik** | `gra/src/render/rangeOverlay.ts` — `TERRITORY_BORDER_BAND_WIDTH` / `TERRITORY_BORDER_OPACITY` |
| **Było → jest** | width **0.15 → 0.375** · opacity **0.5 → 0.3** |
| **md5** | `4332ae45d7d58b706e5a68a9882f8503` · stamp `4332ae45` |
| **Bramki** | tsc=0 · territory-border-test 9/9 |
| **Od Ciebie** | `git pull` → Ctrl+F5 · `gra-robocza/START.html` → stamp `4332ae45` → mapa → sprawdź widoczność granic |

---

## [2026-07-22] ✅ Gotowe — zwiadowca sąsiad nie wchodzi / nie merge po zdobyciu miasta

| | |
|---|---|
| **Co** | Domknięcie regresji Teby x3: zwiadowca/osadnik/robotnik sąsiad **nie** trafia do rosteru (nawet przy złej `category`), **nie** wchodzi na hex miasta, **nie** scala się z armią |
| **Przykład** | Armia 2 na hex A, zwiadowca na hex B, atak miasta C → wygrana → kotwica+armia na C, zwiadowca zostaje na B |
| **md5** | `04f98d66da71c76b3880dce7121dc916` · stamp `04f98d66` |
| **Bramki** | tsc=0 · battle-roster-test 7/7 · post-battle-map-test 21/21 |
| **Od Ciebie** | `git pull` → Ctrl+F5 · `gra-robocza/START.html` → stamp `04f98d66` → scenariusz armia+zwiadowca vs miasto |

---

## [2026-07-22] ✅ Gotowe — wsparcie ATK zostaje na swoim hexie po zdobyciu miasta

| | |
|---|---|
| **Co** | Po wygranej ataku na miasto: kotwica wchodzi na hex miasta; wspierający z sąsiedniego heksa **nie** merge'ują się na stos (osobno od fixu zwiadu 5ce0dfb7) |
| **Przykład** | A atakuje Teby, B (Lucznik) wspiera z sąsiedniego heksa → wygrana → A na mieście, B zostaje tam gdzie stał |
| **md5** | `caa23af35f45ae9b7b0dbe4d6b2ab561` · stamp `caa23af3` |
| **Bramki** | tsc=0 · post-battle-map-test 17/17 · battle-roster-test 5/5 |
| **Od Ciebie** | `git pull` → Ctrl+F5 · `gra-robocza/START.html` → stamp `caa23af3` → scenariusz A+B vs miasto |

---

## [2026-07-22] ✅ Gotowe — panel badań: lista „Możesz wybrać" znowu pełna

| | |
|---|---|
| **Co** | Hub badań (sidebar) pokazuje wszystkie techy do wyboru w bieżącej epoce — nie tylko aktywne badanie |
| **Przykład** | Badania → MOŻESZ WYBRAĆ: Garncarstwo, Obróbka drewna, Łowiectwo… (zgodnie z drzewkiem), nie „Brak dostępnych technologii" |
| **md5** | `24cdcfe843e8c0b28db7cb3f17ecf7d9` · stamp `24cdcfe8` |
| **Bramki** | tsc=0 · science-hub-test 7/7 · research-test 33/33 · tech-tree-test 19/19 |
| **Od Ciebie** | `git pull` → Ctrl+F5 · `gra-robocza/START.html` → stamp `24cdcfe8` → ikona Badania → sprawdź listę MOŻESZ WYBRAĆ |

---

## [2026-07-22] ✅ Gotowe — miasta-państwa nie spamują złotem co turę

| | |
|---|---|
| **Co** | Jednorazowy dar ¤ (propozycja handlu) od tego samego miasta-państwa max raz na cooldown — nie comiesięczny spam bez umowy |
| **Przykład** | Po poznaniu Myken → propozycja np. 15 ¤ → akcept/odrzut → **cisza ~25 tur** (normal) → dopiero potem kolejna oferta |
| **Trudność** | Łatwy: cooldown 15 tur, kwota ×1.25 · Normalny: 25 tur · Trudny: 35 tur, kwota ×0.75 |
| **md5** | `2c72af6335dfc5c456f62b7d23649af1` · stamp `2c72af63` |
| **Bramki** | tsc=0 · diplomacy-economy-test 16/16 · diplomacy-proposal-test 64/64 · ai-test T2S-b2 PASS |
| **Od Ciebie** | `git pull` → Ctrl+F5 · `gra-robocza/START.html` → stamp `2c72af63` → graj kilka tur po pierwszym darze — brak kolejnych popupów złota z tego samego państwa |

---

## [2026-07-22] ✅ Gotowe — zwiadowca nie wchodzi w bitwę obok armii (Teby x3)

| | |
|---|---|
| **Co** | Sąsiedni zwiadowca nie trafia do preBattle ani nie dołącza do armii po ataku miasta |
| **Przykład** | Armia 2 jednostek + zwiadowca obok → atak miasta → preBattle tylko 2 bojowników; po wygranej zwiadowca zostaje na swoim hexie |
| **md5** | `5ce0dfb7a110e60576de86a4acf4a48b` · stamp `5ce0dfb7` |
| **Bramki** | tsc=0 · battle-roster-test 5/5 · post-battle-map-test 15/15 · combat-test 6/6 |
| **Od Ciebie** | `git pull` → Ctrl+F5 · `gra-robocza/START.html` → stamp `5ce0dfb7` → powtórz scenariusz Teby x3 |

---

## [2026-07-22] ✅ Gotowe — miasta-państwa startują w epoce Kamienia (nie Brązu)

| | |
|---|---|
| **Co** | Państwa-miasta na mapie mają wizual Kamienia (tipi/ognisko) gdy startujesz w epoce Kamienia — nie kamienne chatki Brązu |
| **Przykład** | Nowa gra · Epoka Kamienia → załóż miasto → obce miasta-państwa w klastrze = model Kamienia |
| **md5** | `f8a680cb8139078332c92fac65b4cb89` · stamp `f8a680cb` |
| **Bramki** | tsc=0 · owner-epoch-test 11/11 |
| **Od Ciebie** | `git pull` → Ctrl+F5 · `gra-robocza/START.html` → stamp `f8a680cb` → Nowa gra Kamień → sprawdź domki miast-państw (nie mylić z neutralnymi chatami ze skarbami — te zawsze wyglądają jak chatki) |

---

## [2026-07-22] ✅ Gotowe — nadmiar Pracy trafia na ulepszenia cywilizacji

| | |
|---|---|
| **Co** | Gdy miasto nie buduje budynku, cała niewykorzystana Praca (nie tylko % z suwaka) idzie do puli ulepszeń mapy |
| **Przykład** | 13 Pracy, brak budynku, suwak 70/30 → **+13/t** do puli (wcześniej tylko +4) |
| **md5** | `4bd22b7b03a0a85de8e5b8e0ba90f629` · stamp `4bd22b7b` |
| **Bramki** | tsc=0 · production-overflow-test 12/12 · wire-ekonomia-test 37/37 |
| **Od Ciebie** | `git pull` → Ctrl+F5 · `gra-robocza/START.html` → stamp `4bd22b7b` → miasto bez kolejki budowy, obserwuj pulę Pracy w HUD |

---

## [2026-07-22] ✅ Gotowe — miasta-państwa 10–18: prawdziwe nazwy (nie „Rywal 10")

| | |
|---|---|
| **Co** | Przy ≥10 miastach-państwach w klastrze (do 18) każde dostaje unikalną nazwę z puli greckiej (Olimpia, Efez…) — kreator, mapa i dyplomacja spójne |
| **Przykład** | Grecy · 16 państw: rywal 10 = **Olimpia · miasto-państwo** (nie „Rywal 10") |
| **md5** | `27108476a220e9029beaf7a02512b0e7` · stamp `27108476` |
| **Bramki** | tsc=0 · city-names-pool-test 13/13 · civ-names-test 6/6 · display-names-test 11/11 |
| **Od Ciebie** | `git pull` → Ctrl+F5 · `gra-robocza/START.html` → stamp `27108476` → nowa gra Grecy · suwak miast-państw 16 |

---

## [2026-07-22] ✅ Gotowe — dyplomacja: prawdziwe nazwy w audiencji

| | |
|---|---|
| **Co** | Audiencja dyplomatyczna pokazuje nazwę miasta (Mykeny, Argos…) zamiast „Rywal 10 · miasto-państwo" |
| **Przykład** | Mykeny · miasto-państwo · stolica obcego typu → Hetyci |
| **md5** | `d5a4543e21e40869cd6fbbd6a7f27671` · stamp `d5a4543e` |
| **Bramki** | tsc=0 · display-names-test 11/11 · diplomacy-display-test 14/14 |
| **Od Ciebie** | `git pull` → Ctrl+F5 · `gra-robocza/START.html` → stamp `d5a4543e` → dyplomacja → audiencja miasta-państwa |

---

## [2026-07-22] ✅ Gotowe — mapa: jednostka widoczna na lesie

| | |
|---|---|
| **Co** | Token jednostki nie jest już zasłaniany przez kępę drzew na heksie z lasem |
| **Jak** | Las chowa się tymczasowo pod widocznym tokenem (jak farma na lesie); wraca po ruchu |
| **md5** | `248b262222701bc1bf5149094e1d277b` · stamp `248b2622` |
| **Bramki** | tsc=0 · smoke OK · picker-test 136/136 |
| **Od Ciebie** | `git pull` → Ctrl+F5 · `gra-robocza/START.html` → stamp `248b2622` → postaw jednostkę na lesie → token + pierścień w pełni widoczne |

---

## [2026-07-22] ✅ Gotowe — mapa: więcej chat ze skarbami (miasta × trudność)

| | |
|---|---|
| **Co** | Liczba chat ze skarbami skaluje się z liczbą miast startowych × trudność (HART=1 · NORMAL=2 · EZ=3) |
| **Przykład** | 8 miast na Normal → **16 chat** (2× więcej niż na Hard) |
| **Było** | ~10–65 chat zależnie od rozmiaru mapy (`ląd ÷ 140`) |
| **md5** | `70aea720f1c8697bb77fb97bfadc466f` · stamp `70aea720` |
| **Bramki** | tsc=0 · villages-test 39/39 · map-gen-regression determinizm PASS |
| **Od Ciebie** | `git pull` → Ctrl+F5 · `gra-robocza/START.html` → stamp `70aea720` → nowa gra → więcej chat wokół klastrów miast |

---

## [2026-07-22] ✅ Gotowe — dyplomacja: oferta AI = faktyczny skarbiec

| | |
|---|---|
| **Co** | AI proponuje tylko tyle **¤**, ile realnie ma w skarbcu — tekst UI i transfer zgodne z kwotą |
| **Przykład** | AI ma 5 ¤ → „Proponujemy jednorazową wymianę: **5** ¤…"; AI ma 0 ¤ → **brak** propozycji handlu złotem |
| **Strict transfer** | Cofnięty grant bez skarbca — akceptacja transferuje dokładnie kwotę z payload (pełne saldo wymagane) |
| **md5** | `7d03bb35daf68ef86d540b35cf87361b` · stamp `7d03bb35` |
| **Bramki** | tsc=0 · diplomacy-proposal 64/64 · diplomacy-economy 11/11 |
| **Od Ciebie** | `git pull` → Ctrl+F5 · `gra-robocza/START.html` → stamp `7d03bb35` → poczekaj na propozycję handlu AI → sprawdź kwotę w tekście i skarbcu po AKCEPTUJ |

---

## [2026-07-22] ✅ Gotowe — granice państwa: ciągły obwód per państwo

| | |
|---|---|
| **Co** | Każde państwo ma **ciągły kolorowy obwód** wokół **całego** terytorium — nie rozłączone paski per heks |
| **Jak włączyć** | Minimapa → ikona **granice państwa** (toggle) |
| **Co naprawiono** | Algorytm konturów (pętle polyline) zamiast segmentów per heks; poprawne mapowanie krawędzi hex; alpha **50%**, szerokość **0.15** world units (+50% od poprzedniego) |
| **md5** | `826cc00bda20eccc5392ae3924a7aae0` · stamp `826cc00b` |
| **Bramki** | tsc=0 · territory-border-test 9/9 · picker-test 136/136 · map-gen-regression PASS |
| **Od Ciebie** | `git pull` → Ctrl+F5 · `gra-robocza/START.html` → stamp `826cc00b` → mapa → granice państwa ON → Ateny, Mykeny i każde AI z własnym obwodem |

---

## [01:00] INTEGRATOR → Maciej — DYPL: akceptacja AI handel → +20 ¤ graczowi

| | |
|---|---|
| **Co** | Po AKCEPTUJ propozycji AI „20 ¤ na rzecz twojego państwa" gracz dostaje pełne 20 ¤ do skarbca |
| **Bug** | `applyOneShotGoldTransfer` wymagał pełnego salda AI (często 0) — transfer cicho failował; brak `updateHud()` |
| **Fix** | `resolvePlayerAcceptsAiPending` + `applyDiplomaticGoldGrant` w `diplomacy-economy.ts`; `executePnDealTransfer` w `main.ts` |
| **md5** | `f9bd9a7522500410d4340d5deb9acb9d` · stamp `f9bd9a75` |
| **Bramki** | tsc=0 · diplomacy-proposal-test 57/57 · diplomacy-economy-test 8/8 |
| **Od Ciebie** | `git pull` → Ctrl+F5 · `gra-robocza/START.html` → stamp `f9bd9a75` → poczekaj na propozycję handlu AI → AKCEPTUJ → skarbiec +20 ¤ |

---

## [2026-07-22] ✅ Gotowe — granice państwa: widoczny spójny obwód

| | |
|---|---|
| **Co** | Granice państwa na mapie świata — wyraźny kolorowy obwód wokół całego terytorium (nie cienkie kreski per heks) |
| **Jak włączyć** | Minimapa → ikona/przycisk **granice państwa** (toggle jak wcześniej) |
| **Co naprawiono** | Cienka linia WebGL 1px @ 30% alpha → szeroki pas 0.10 world units @ 48% alpha; flat Y + trójkąty w narożnikach = ciągły obwód |
| **md5** | `07beb443d7efc6dd1bd35efa29bfebae` · stamp `07beb443` |
| **Bramki** | tsc=0 · map-gen-regression determinizm PASS · picker-test 136/136 |
| **Od Ciebie** | `git pull` → Ctrl+F5 · `gra-robocza/START.html` → stamp `07beb443` → mapa → włącz granice przy minimapie → obwód wokół terytorium gracza i AI |

---

## [2026-07-22] ✅ Gotowe — taktyka/strategia per jednostka (bitwa)

| | |
|---|---|
| **Co** | Taktyka (Obrona/Atak/Szturm/Ostrzał) i Strategia (priorytety celów) działają na **pojedynczej jednostce**, nie tylko na grupie |
| **Jak zaznaczyć** | **Ctrl+LPM** na jednostkę w rosterze lub na polu bitwy = tylko ta jednostka · zwykły LPM na grupę = cała grupa |
| **Wielokrotne** | Zaznacz kilka → Taktyka ustawia wszystkim; gdy różne postawy → nagłówek „mieszane" |
| **md5** | `2e46903ef4065678fb24fbfe0475dd0f` · stamp `2e46903e` |
| **Bramki** | tsc=0 · auto-battle-power-test 14/14 |
| **Od Ciebie** | `git pull` → Ctrl+F5 · `gra-robocza/START.html` → stamp `2e46903e` · PLAYTEST-WALKA → bitwa ręczna → Ctrl+LPM wybierz 1 wojownika → Taktyka → Szturm; drugi w tej samej grupie → Obrona |

---

## [2026-07-22] ✅ Gotowe — etykieta kultury w audiencji dyplomatycznej

| | |
|---|---|
| **Co** | Panel audiencji pokazuje okręg kulturowy rozmówcy + czy to ta sama kultura co gracz |
| **Przykłady** | Argos (Grecy): „Kultura: **Grecka** · Ten sam okręg kulturowy" · Hattusa: „Kultura: **Chetycka** · Obca kultura" |
| **Gdzie** | Dyplomacja → audiencja → pod linią PRZEDSTAWICIEL · epoka, przed stanem dyplomatycznym |
| **md5** | `77c603d77fe1346c18d8b5cb52535d3c` · stamp `77c603d7` |
| **Bramki** | tsc=0 · VERIFY OK |
| **Od Ciebie** | `git pull` → Ctrl+F5 · `gra-robocza/START.html` → stamp `77c603d7` · otwórz audiencję z Argos i z obcym typem |

---

## [2026-07-22] ✅ Gotowe — stan dyplomatyczny vs nastawienie (audiencja)

| | |
|---|---|
| **Co** | Rozdzielono formalny **stan dyplomatyczny** (wojna/pokój/sojusz/pakt/handel/brak kontaktu) od **nastawienia** (ocena relacji ze score) |
| **Gdzie** | Dyplomacja → audiencja — box „Stan dyplomatyczny" pod nazwą nacji; przy wojnie ikona ⚔ |
| **Przykłady** | Pokój + Nastawienie: Neutralny · Wojna: ⚔ Wojna · Sojusz wojskowy · Pakt o nieagresji |
| **md5** | `3d2e4f329dc66bc40aadf23c7c4d9623` · stamp `3d2e4f32` |
| **Bramki** | tsc=0 · diplomacy-display-test 14/14 |
| **Od Ciebie** | `git pull` → Ctrl+F5 · `gra-robocza/START.html` → stamp `3d2e4f32` · dyplomacja → audiencja |

---

## [2026-07-22] ✅ Gotowe — BALANS: badania ×2, budynki −50% produkcji

| | |
|---|---|
| **Co** | Globalne mnożniki: koszty badań ×2, koszt Pracy budynków ×0.5 (flat, niezależnie od trudności) |
| **Hooki** | `GLOBAL_RESEARCH_COST_MULT` → `scaledResearchCost()` · `GLOBAL_BUILDING_PROD_MULT` → `buildingWorkCost()` |
| **Przykład** | Obróbka drewna: 12→24 PN (tempo szybka) · Świątynia: 25→13 Pracy (tempo niski) |
| **md5** | `40a77974b45d7aedb7bd17bc7abf2dfa` · stamp `40a77974` |
| **Bramki** | tsc=0 · research-test 33/33 · tech-tree-test 19/19 · difficulty-cost-test 22/22 |
| **Od Ciebie** | `git pull` → Ctrl+F5 · `gra-robocza/START.html` → stamp `40a77974` · drzewko nauki + panel produkcji miasta |

---

## [2026-07-22] ✅ Gotowe — etykieta kultury w audiencji dyplomatycznej

| | |
|---|---|
| **Co** | Panel audiencji pokazuje okręg kulturowy rozmówcy + czy to ta sama kultura co gracz |
| **Przykłady** | Argos (Grecy): „Kultura: **Grecka** · Ten sam okręg kulturowy" · Hattusa: „Kultura: **Chetycka** · Obca kultura" |
| **Gdzie** | Dyplomacja → audiencja → pod linią PRZEDSTAWICIEL · epoka |
| **md5** | `345cf8e2c9a72fcc45fdb63fc9e62a62` · stamp `345cf8e2` |
| **Bramki** | tsc=0 · VERIFY OK |
| **Od Ciebie** | `git pull` → Ctrl+F5 · `gra-robocza/START.html` → stamp `345cf8e2` · otwórz audiencję z Argos i z obcym typem |

---

## [2026-07-22] ✅ Gotowe — FIX propozycje dyplomacji AI (czytelny tekst)

| | |
|---|---|
| **Co** | Popup/inbox propozycji od państw-miast pokazuje opis oferty po polsku zamiast debugu silnika (`willingnessTrade`, progi) |
| **Przykład** | „Proponujemy jednorazową wymianę: 20 ¤ na rzecz twojego państwa.” |
| **md5** | `e90f27d4a8e40d79d19c410d21641ed4` · stamp `e90f27d4` |
| **Bramki** | tsc=0 · VERIFY OK |
| **Od Ciebie** | `git pull` → Ctrl+F5 · `gra-robocza/START.html` → stamp `e90f27d4` · poczekaj na propozycję handlu (np. Argos) — bez współczynników w tekście |

---

## [2026-07-21] ✅ Gotowe — FIX picking heksów (raycast 3D terenu)

| | |
|---|---|
| **Co** | Klik w krawędź heksa wybiera właściwy hex (panel kontekstowy, ruch jednostek, tryb budowy) |
| **Przyczyna** | Picking na płaszczyźnie y=0 przy kamerze 3D ~52° i podniesionym terenie przesuwał trafienie w stronę kamery |
| **md5** | `95be60fc79400576b0e82bb15f518174` · stamp `95be60fc` |
| **Bramki** | tsc=0 · logic 207/207 · VERIFY OK |
| **Od Ciebie** | Ctrl+F5 · `gra-robocza/START.html` · Nowa gra · klikaj **krawędzie** heksów (nie tylko środek) → panel pokazuje ten sam hex co wizualnie pod kursorem; sprawdź też ruch zwiadowcy na krawędzi docelowego heksa |

---

## [2026-07-21] ✅ Gotowe — FIX FoW: jednostki wroga w mgle

| | |
|---|---|
| **Co** | Wrogie jednostki (czerwone pierścienie) nie widać w czarnej mgle ani w ciemnym shroud poza bieżącym zasięgiem |
| **Przyczyna** | `syncUnitsRender()` bez filtrowania mgły synchronizowało wszystkie tokeny jako widoczne |
| **md5** | `83eadf9a14a80a6e08db6a2eb8da88ca` · stamp `83eadf9a` |
| **Bramki** | tsc=0 · logic 207/207 · VERIFY OK |
| **Od Ciebie** | Ctrl+F5 · `gra-robocza/START.html` · Nowa gra · oddal mapę do nieodkrytego obszaru / shroud — brak wrogich tokenów; w zasięgu wzroku jednostki wracają |

---

## [2026-07-21] ✅ Gotowe — BUGFIX: miasta-państwa nie atakują bez wojny

| | |
|---|---|
| **Co** | Państwa-miasta (Gamla Uppsala itd.) nie uruchamiają preBattle na zwiadowcy gracza, dopóki nie ma wojny — spójne z PRZYJAZNY/neutralni w dyplomacji |
| **Przyczyna** | AI atakowało każdego sąsiada + riposta przy jednostce obok miasta bez `isAtWar` |
| **md5** | `eeace0a7477674272f86583795d60826` · stamp `eeace0a7` |
| **Bramki** | tsc=0 · diplomacy-test 143/143 · ai-test T7D-g OK |
| **Od Ciebie** | Ctrl+F5 · `gra-robocza/START.html` · Nowa gra · prowadź zwiadowcę obok państwa-miasta (PRZYJAZNY) → **brak ataku**. Opcjonalnie: wypowiedz wojnę → wtedy atak możliwy |

---

## [2026-07-21] ✅ Gotowe — E-START-CS-Q1=C: państwa wokół faktycznej stolicy

| | |
|---|---|
| **Co** | Państwa-miasta spawnują się wokół hexu, gdzie gracz postawi stolicę (nie pre-plan mapgen); backfill gdy hex odrzucony |
| **Decyzja** | E-START-CS-Q1 **C** (fallback → A jeśli nie zadziała) |
| **md5** | `35a07a49cd8d393f82b45819ccc1a19c` · stamp `35a07a49` |
| **Bramki** | tsc=0 · cluster-start-test 92/95 (3 pre-existing) |
| **Od Ciebie** | Ctrl+F5 · `gra-robocza/START.html` · Nowa gra · 10–14 państw · postaw stolicę (możesz w innym miejscu niż podgląd) · sprawdź gęsty klaster ~3 hex wokół Twojej stolicy |

---

## [2026-07-21] ✅ Gotowe — Audyt 20 POTWIERDZONE + fix chatki WYDARZENIA

| | |
|---|---|
| **Co** | 20 napraw z audytu Fable (ekonomia, AI, audio, mapa, zwycięstwo nauka…) + chatka znika po turze, WYKONAJ nie blokuje |
| **Decyzja** | OK plan audyt 20 (ABC: #6A #4A #62B #64A) |
| **md5** | `33e7c2138ee878307b4f0e294b5413e1` · stamp `33e7c213` |
| **Bramki** | tsc=0 · tech-tree 33/33 · map-gen-regression OK |
| **Od Ciebie** | Ctrl+F5 · `gra-robocza/START.html` · chatka → zakończ turę (komunikat znika) · AI bada po awansie epoki |

---

## [2026-07-21] ✅ Gotowe — Fala 4: trasa przez mgłę (C-RUCH-Q1=B)

| | |
|---|---|
| **Co** | Marsz można prowadzić optymalną trasą przez mgłę/nieodkryty teren — bez ucinania na granicy widoczności |
| **Decyzja** | C-RUCH-Q1=B (wariant Macieja) |
| **md5** | `14b3a1b05833ba24add367ec93b9beb3` · stamp `14b3a1b0` |
| **Bramki** | tsc=0 · planned-march 18/18 · logic 203/203 · VERIFY OK |
| **Od Ciebie** | Ctrl+F5 · `gra-robocza/START.html` · zaznacz armię → klik cel za mgłą → trasa idzie do celu (nie staje na brzegu mgły) |

**Paczka 14 tematów audytu — komplet wdrożony w ROBOCZA.**

---

## [2026-07-08] ✅ Gotowe — Metadata drift gra-robocza (START + stamp)

| | |
|---|---|
| **Kto** | Integrator (weryfikacja 46928d20) |
| **Co** | `START.html` pokazywał stary md5 `749819eb` · pieczętka w bundlu nieaktualna · bez zmian w kodzie gry |
| **Weryfikacja** | Fresh vite build = ten sam core co `Gra-ROBOCZA.html` (52bb99e3) · tylko metadane |
| **Naprawa** | Odświeżono pieczętkę + manifest + playtesty + `generate-start-hub.cjs` |
| **md5** | `14f97262aeef2c3e97ab49e4562ee71f` |
| **Od Ciebie** | Ctrl+F5 · `gra-robocza/START.html` · sprawdź `14f97262` w nagłówku |

---

## [2026-07-08] ✅ Gotowe — Marsz: auto-commit, fog pause, atak widocznego wroga

| | |
|---|---|
| **Kto** | Integrator |
| **Co** | Klik terenu/wroga = natychmiastowy marsz (bez Kontynuuj) · multi-turn po Zakończ turę · mgła = wstrzymanie na granicy · klik widocznego wroga = dojście + preBattle |
| **Przyczyna buga** | Brak auto-ruchu po kliku; przycisk Kontynuuj wymagany; atak tylko na sąsiednim heksie; marsz w mgłę bez reguły wstrzymania; wróg na celu jak przeszkoda na trasie |
| **Pliki** | `gra/src/game/planned-march.ts` · `gra/src/main.ts` · `gra/src/ui/mapUnitCursor.ts` · `gra/src/game/save.ts` |
| **Testy** | tsc OK · planned-march 18/18 · city-hex-movement 7/7 · map-road-movement 16/16 · map-field-battle 15/15 |
| **Build** | ROBOCZA md5 `d3dc5dc617c8304dd273e36cea8122d3` · stamp `d3dc5dc6` · `gra-robocza/START.html` |
| **Od Ciebie** | Ctrl+F5 · zaznacz armię · klik odległy heks → rusza od razu · klik widocznego wroga → dojście + bitwa · klik w mgłę → staje na granicy · Zakończ turę → kontynuuje |

---

## [2026-07-08] ✅ Gotowe — ZAPISZ na ekranie pre-bitwy

| | |
|---|---|
| **Kto** | Integrator |
| **Co** | Przycisk ZAPISZ na ekranie przed bitwą zapisuje grę (autosave) i pokazuje widoczny komunikat na overlay |
| **Przyczyna buga** | `doQuickSave` działał, ale toast `showHintMessage` miał z-index 320 — ukryty pod overlayem pre-bitwy (9900). Wyglądało jak brak reakcji. |
| **Pliki** | `gra/src/ui/preBattle.ts` (toast na overlay + `onSave → boolean`), `gra/src/main.ts` (handlery zwracają `doQuickSave`), `gra/src/battle/mapFieldBattle.ts`, `gra/tools/pre-battle-save-test.cjs` |
| **Testy** | tsc OK · pre-battle-save OK · map-field-battle 15/15 · smoke OK |
| **Build** | ROBOCZA md5 `a62a66c5ca6a75015017c1f14cdd3146` · stamp `a62a66c5` · `gra-robocza/START.html` |
| **Od Ciebie** | Ctrl+F5 · doprowadź do pre-bitwy (atak / obrona) · klik **Zapisz** → zielony toast „Zapisano · tura N" na środku ekranu · Wczytaj grę / Kontynuuj → stan sprzed bitwy |

---

## [2026-07-08] ✅ Gotowe — Stos armii po wygranej bitwie ręcznej

| | |
|---|---|
| **Kto** | Integrator |
| **Co** | Po wygranej połączoną armią (np. Oszczepnik + Wojownik) cały skład zostaje na jednym heksie zwycięstwa; badge ×N = liczba jednostek; obwódka gracza nie „brązowa" |
| **Przyczyna buga** | `applyPostBattleMap` przenosił tylko dowódcę (`moveAtkLeadOntoBattleHex`) — reszta wracała na `atkStart`; render nie odświeżał się po bitwie (`forceVisibleUnitId` + brak `syncUnitsRender`) |
| **Pliki** | `gra/src/game/post-battle-map.ts` (`moveAtkRosterOntoBattleHex`, kolejność: ucieczka DEF → stos ATK), `gra/src/main.ts` (`syncUnitsRender` po `applyMapBattleOutcome`), `gra/tools/post-battle-map-test.cjs` |
| **Testy** | tsc OK · post-battle-map 14/14 · army-merge-bounce 4/4 · army-stack-ruch 5/5 |
| **Build** | ROBOCZA md5 `a62a66c5ca6a75015017c1f14cdd3146` · stamp `a62a66c5` · `gra-robocza/START.html` |
| **Od Ciebie** | Ctrl+F5 · Nowa gra · połącz Oszczepnik + Wojownik · atak wroga → bitwa ręczna → wygrana → obie jednostki na jednym heksie, badge ×2, niebieska obwódka, brak POŁĄCZ |

---

## [2026-07-08] ✅ Gotowe — Marsz ataku: cel wroga nie blokuje trasy

| | |
|---|---|
| **Kto** | Integrator |
| **Co** | Klik w widocznego wroga zapisuje marsz-atak, trasa dochodzi do heksu wroga, po dotarciu otwiera pre-bitwę |
| **Przyczyna buga** | `shouldStopAtObstacle` traktował zajęty heks celu (wróg) jak przeszkodę na trasie; klik w nie-sąsiada wroga nie wywoływał `planMarchTo`, tylko komunikat „za daleko" |
| **Pliki** | `gra/src/game/planned-march.ts` (wyjątek celu ataku w occupied), `gra/src/main.ts` (klik wroga → marsz, auto pre-bitwa po dotarciu, `openPlayerMapUnitAttack`) |
| **Testy** | tsc OK · planned-march 14/14 · army-stack-ruch 5/5 |
| **Build** | ROBOCZA md5 `8131cec60ba2c318b08b24c34a767e6e` · stamp `8131cec6` · `gra-robocza/START.html` |
| **Od Ciebie** | Ctrl+F5 · Nowa gra · zaznacz jednostkę · klik wroga poza zasięgiem 1 hex → żółta trasa + ruch · po dotarciu pre-bitwa · mgła = brak marszu-ataku |

---

## [2026-07-08] ✅ Gotowe — Crash przy starcie bitwy ręcznej (roster deploy)

| | |
|---|---|
| **Kto** | Integrator |
| **Co** | Gra nie wywala się przy wejściu w bitwę ręczną (atak wroga → deploy / roster) |
| **Przyczyna buga** | Pętla rekurencji: `_ensureDeployRowRefs` → `_ensureBattleRosterChrome` → brak `#battle-roster-scroll` / `#battle-roster-cards` → `_rebuildDeployRosterGrid` → `_updateRosterBar` → z powrotem. `_buildRosterBar` przy istniejącym panelu kończył wcześniej bez tworzenia scroll/cards. |
| **Pliki** | `gra/src/battle/battleScene.ts` (`_ensureBattleRosterChrome` tworzy scroll+cards; guard `_rebuildDeployRosterGridBusy`; usunięty redundantny `_ensureDeployRowRefs` w `_updateRosterBar`) |
| **Testy** | tsc OK |
| **Build** | ROBOCZA md5 `1d56ef7e7eeb7b2853614fea780a5507` · stamp `1d56ef7e` · `gra-robocza/START.html` |
| **Od Ciebie** | Ctrl+F5 · Nowa gra · doprowadź do walki (wróg atakuje) · wybierz **bitwę ręczną** → ekran deploy z lewym rosterem, bez „BOOT ERROR” / stack overflow |

---

## [2026-07-08] ✅ Gotowe — Marsz: klik terenu zapisuje i rusza

| | |
|---|---|
| **Kto** | Integrator |
| **Co** | Klik w heks docelowy **zapisuje** marsz i **od razu wykonuje** pierwszy segment (gdy są punkty ruchu). Ścieżka wieloturowa zostaje do końca trasy — bez ręcznego „Kontynuuj". |
| **Przyczyna buga** | `planMarchTo` tylko zapisywała plan w `plannedMarches`, nie wywoływała `executeMarchSegmentForUnit`. Klik wymagał `stackCanMove` — przy 0 ruchu plan w ogóle się nie zapisywał (tylko podgląd hover). |
| **Pliki** | `gra/src/main.ts` (`planMarchTo`, handlery kliku mapy) |
| **Testy** | tsc OK · planned-march 11/11 · city-hex-movement 7/7 · map-road-movement 16/16 |
| **Build** | ROBOCZA md5 `1d56ef7e7eeb7b2853614fea780a5507` · stamp `1d56ef7e` · `gra-robocza/START.html` |
| **Od Ciebie** | Ctrl+F5 · zaznacz armię (2 jednostki) · klik odległy heks → jednostka rusza + żółta ścieżka zostaje · kolejne tury: auto-marsz po „Zakończ turę" |

---

## [2026-07-08] ✅ Gotowe — Wycinka lasu tylko w terytorium gracza

| | |
|---|---|
| **Kto** | Integrator |
| **Co** | Wyrąb / budowa ulepszeń terenu działa **tylko** na heksach, gdzie właścicielem jest gracz (owner 0) — nie obok Sparty / AI |
| **Przyczyna buga** | `isInTerritory(playerNodes)` zwracało true także w strefie overlapu dwóch miast — bez `territoryOwnerAt` (wygrywa bliższe miasto) |
| **Pliki** | `gra/src/map/territory.ts` (`isPlayerTerritoryHex`) · `gra/src/map/improvement-build.ts` · `gra/src/main.ts` (bramka + hint UI) |
| **Testy** | tsc OK · map-improvement-qualify 44/44 (+ overlap Sparta) |
| **Build** | ROBOCZA md5 `8a9d5b3f76f966eb4d98acb47e8e650a` · stamp `8a9d5b3f` · `gra-robocza/START.html` |
| **Od Ciebie** | Ctrl+F5 · Nowa gra · 🔨 Wyrąb przy Sparcie → brak podświetlenia / komunikat · las w niebieskiej obwódce gracza → OK |

---

## [2026-07-08] ✅ Gotowe — Przełączanie miast ‹ › (mapa okolicy)

| | |
|---|---|
| **Kto** | Integrator |
| **Co** | Strzałki ‹ › w widoku miasta przełączają **cały** widok: baner + panel + mapa 3D okolicy (kamera, heks centrum, etykieta miasta) |
| **Przyczyna buga** | `switchCity` odświeżał tylko UI panelu (`paintCityPanelSections`); silnik trzymał `cityPanelViewCityId` na pierwszym mieście — kamera i etykieta zostawały na ATENACH |
| **Pliki** | `gra/src/ui/cityPanel.ts` (`onSwitchCity` hook + wywołanie w `switchCity`) · `gra/src/main.ts` (`applyCityPanelWorldView` + `syncOkolicaOverlay`) |
| **Testy** | tsc OK |
| **Build** | ROBOCZA md5 `c74a39ac36522875340329ca915c81b4` · stamp `c74a39ac` · `gra-robocza/START.html` |
| **Od Ciebie** | Ctrl+F5 · 2+ miasta gracza · otwórz miasto · ‹ › → baner, panel i mapa okolicy = to samo miasto (etykieta + centrum heks) |

---

## [2026-07-08] ✅ Gotowe — Moc HUD = ranking · miasta epoki kamienia na starcie

| | |
|---|---|
| **Kto** | Integrator |
| **Co** | **Moc:** panel środkowy HUD i ranking w panelu imperium pokazują tę samą wartość per państwo (obiektywny POWER z `power-objective.ts`). **Epoka:** start Kamień → modele kamienne na mapie (nie brąz/ziggurat z instant-AI tech). |
| **Przyczyna Moc** | Ranking sumował POWER po **typie cywilizacji** (`grecy` × N państw) — HUD pokazywał tylko imperium gracza (owner 0). |
| **Przyczyna epoka** | AI dostawało od razu tech kończące epokę → `ownerEraByOwner` = 2 → `buildBronzeCityRoblox` (ziggurat). Kamień ignorował cywilizację w `settlementModel`. |
| **Pliki** | `gra/src/main.ts` (`buildPowerRankingByOwner`, `updateHud` cache, AI research filter, load `ownerEraByOwner`) · `gra/src/render/settlementModel.ts` |
| **Testy** | tsc OK |
| **Build** | ROBOCZA md5 `d8fc99075ded76beef771636228d2d24` · stamp `d8fc9907` · `gra-robocza/START.html` |
| **Od Ciebie** | Ctrl+F5 · Nowa gra Kamień · Grecy: liczba Moc w HUD = Twoja pozycja w rankingu · miasta = lepianki/kamień, nie świątynie brązu |

---

## [2026-07-08] ✅ Gotowe — Banery HUD: chipy w ramce (Nauka + Religia)

| | |
|---|---|
| **Kto** | Integrator |
| **Co** | Lewy i prawy baner HUD mapy — wszystkie chipy mieszczą się w ramce; Religia i Nauka z pełną etykietą, wartością i deltą |
| **Przyczyna buga** | Za niski `max-width` (420/520px) + prawy baner kurczył się w `hud-right-cluster` obok Wiki/Menu |
| **Pliki** | `gra/src/ui/hud.ts` — `.civ-hud-banner-shell`, `.civ-hud-banner-left`, `.civ-hud-banner-right`, `.hud-right-cluster`, `.hud-chip-row`, `.civ-hud-chip`, `.civ-hud-chip-sep`, `.hud-right` |
| **Testy** | tsc OK |
| **Build** | ROBOCZA md5 `d8fc99075ded76beef771636228d2d24` · stamp `d8fc9907` · `gra-robocza/START.html` |
| **Od Ciebie** | Ctrl+F5 · mapa: lewy baner (Skarbiec/Praca/Nauka) + prawy (Zaopatrzenie/Ludność/Kultura/Religia) — wszystko czytelne w ramce |

---

## [2026-07-08] ✅ Gotowe — Wybór miasto vs jednostka (ten sam heks)

| | |
|---|---|
| **Kto** | Integrator |
| **Co** | Klik na heks z **własnym miastem + własną jednostką** → popup „Co wybierasz?” (Miasto / Jednostka) zamiast auto-zaznaczenia wojska |
| **Przyczyna regresji** | W `main.ts` handler kliku miasta: gałąź `ownerId === 0` od razu wołała `selectPlayerUnit()`; `showCityUnitPick()` było tylko dla obcych miast (martwy kod) |
| **Pliki** | `gra/src/main.ts` (~L7482) — przywrócona logika z kanonu: `stackOnCity.length > 0` → `showCityUnitPick` |
| **Testy** | tsc OK |
| **Build** | ROBOCZA md5 `2122e63d70e1776776641fe88779d651` · stamp `2122e63d` · `gra-robocza/START.html` |
| **Od Ciebie** | Ctrl+F5 · Nowa gra · postaw jednostkę na własnym mieście · klik heks → wybór Miasto / Jednostka |

---

## [2026-07-08] ✅ Gotowe — Suwak żywności Wzrost / Armia (płynny drag)

| | |
|---|---|
| **Kto** | Integrator |
| **Co** | Panel miasta → Spichlerz / Wzrost: suwak podziału żywności **Wzrost ↔ Armia** — płynne przeciąganie i klik na track (jak Skarb/Nauka/Zamożność), bez native `<input type="range">` |
| **Przyczyna buga** | Nałożony native range (`food-split-range`) — krok co 10% + brzydki thumb / kursor ↔ na Windows |
| **Pliki** | `gra/src/ui/cityPanel.ts` — `attachFoodSplitBar` · `snapFoodSplitPct` · CSS `.food-split-handle` |
| **Testy** | tsc OK |
| **Build** | ROBOCZA md5 `7670977e4f47e9ad5ea325cd629bde83` · stamp `7670977e` · `gra-robocza/START.html` |
| **Od Ciebie** | Ctrl+F5 · Miasto → prawa kolumna Spichlerz: przeciągnij pasek żółty/czerwony — płynnie, klik w dowolnym miejscu tracka |

---

## [2026-07-08] ✅ Gotowe — Kolejka rekrutacji pod budową (layout Produkcja)

| | |
|---|---|
| **Kto** | Integrator |
| **Co** | Zakładka Rekrutacja w panelu miasta: **kolejka rekrutacji** z powrotem **nad** kartami jednostek (Taran, Wojownik…), zaraz pod sekcją Produkcja (kolejka budowy + auto budowa) |
| **Przyczyna regresji** | `renderPurchasableUnits` dopinała `appendRecruitmentQueue` **po** `unit-recruit-scroll` (appendChild na końcu mounta) |
| **Pliki** | `gra/src/ui/cityPanel.ts` — `renderPurchasableUnits` · `appendRecruitmentQueue` (CSS w4: border-bottom zamiast border-top) |
| **Testy** | tsc OK |
| **Build** | ROBOCZA md5 `30c7e76fdb36892e3f66a03e416ce17d` · stamp `30c7e76f` · `gra-robocza/START.html` |
| **Od Ciebie** | Ctrl+F5 · Miasto → Produkcja → Rekrutacja: kolejka (Wojownik…) **nad** listą kart, **pod** kolejką budowy |

---

## [2026-07-07] ✅ Gotowe — Cofanie ulepszeń terenu w tej samej turze

| | |
|---|---|
| **Kto** | Integrator |
| **Co** | Panel budowy ulepszeń: ponowny klik tego samego typu na tym samym heksie **w turze** cofa akcję — ulepszenie znika, **Praca wraca**; po **N** (koniec tury) brak cofania |
| **Model** | **Pending** (`PendingImprovementsTurn`) — wpisy `{hexKey, key, kosztPraca, action}` do `commitTurn()`; **Committed** — po endTurn (ulepszenie zostaje, koszt finalny) |
| **Wycinka lasu** | Wyrąb start (5 Pracy) → ikona 🪓 → klik ponownie w turze → las zostaje, Praca +5; po turze wycinka trwa normalnie (+20/turę) |
| **Pliki** | `gra/src/game/pending-improvements.ts` (nowy) · `gra/src/map/improvement-build.ts` · `gra/src/main.ts` |
| **Save** | `meta.pendingImprovementsTurn` — cofanie po wczytaniu zapisu w tej samej turze |
| **Testy** | tsc OK · `node tools/pending-improvements-test.cjs` 8/8 |
| **Build** | ROBOCZA md5 `5dc9e8b5e1d4ddaa1f7ff814c117cce9` · stamp `5dc9e8b5` · `gra-robocza/START.html` |
| **Od Ciebie** | Ctrl+F5 · Nowa gra → 🔨 Wyrąb na lesie → sprawdź −5 Pracy → klik ponownie → las + refund · N → brak cofania |

---

## [2026-07-07] ✅ Gotowe — HUD: epoka w panelu Moc (bez duplikatu)

| | |
|---|---|
| **Kto** | Integrator |
| **Co** | Nazwa epoki (np. „Epoka kamienia") nad sygnetem cywilizacji w centralnym panelu Moc; usunięte „Epoka 1" z prawego klastra (Wiki/Menu zostają) |
| **Źródło nazwy** | `gameEpochHudLabel(player.era)` w `gra/src/game/civ-entry-epoch.ts` — mapa `1→kamien, 2→braz, 3→zelazo` → etykiety PL |
| **Pliki** | `gra/src/game/civ-entry-epoch.ts` · `gra/src/main.ts` (`buildHudState`) · `gra/src/ui/hud.ts` |
| **CSS** | `.power-center .p-epoch` (nad sygnetem) · `.power-center` powiększony w górę · brak `.hm-ep` w `.hud-right-cluster` |
| **Build** | ROBOCZA md5 `0fd9292da03ce8b7befb0e1fcda498ce` · stamp `0fd9292d` · `gra-robocza/START.html` |
| **Testy** | tsc OK |
| **Od Ciebie** | Ctrl+F5 · Nowa gra (Kamień) → nad sygnetem „Epoka kamienia"; prawy róg bez epoki, tylko Wiki + Menu |

---

## [2026-07-07] ✅ Gotowe — Minimapa: mgła wojny (brak AI poza odkryciem)

| | |
|---|---|
| **Kto** | Integrator |
| **Co** | Minimapa nie pokazuje kolorowych kropek/clusterów obcych cywilizacji poza zasięgiem wiedzy gracza |
| **Przyczyna** | Markery miast/jednostek i kolory terytorium były rysowane dla **całej mapy** — heksy miały `fog: hidden`, ale markery nie |
| **Fix** | `isMinimapMarkerVisible()` — ten sam kontrakt co `refreshFog`: gracz zawsze; obce miasta gdy `visible ∪ explored`; obce jednostki gdy `visible`; terytorium bez koloru na `hidden` |
| **Pliki** | `gra/src/map/minimap.ts` · `gra/src/ui/minimapHud.ts` · `gra/src/main.ts` |
| **Build** | ROBOCZA md5 `bf1015202ed24561304cb968ec690748` · stamp `bf101520` · `gra-robocza/START.html` |
| **Testy** | tsc OK |
| **Od Ciebie** | Ctrl+F5 · Nowa gra → minimapa ciemna poza startem, bez kolorowych AI na drugim końcu mapy; zwiadowca odkrywa → pojawia się |

---

## [2026-07-07] ✅ Gotowe — Dyplomacja: THE GAME wyśrodkowane, bez 1E

| | |
|---|---|
| **Kto** | Integrator |
| **Co** | Nagłówek panelu Dyplomacja: podpis **THE GAME** wyśrodkowany pod słowem Dyplomacja; usunięte **· 1E** |
| **Plik** | `gra/src/ui/diploListHud.ts` |
| **Selektor** | `.civ-diplo-list-hud .dl-head-sub` (+ `.dl-head-text` flex column center) |
| **Build** | ROBOCZA md5 `bf1015202ed24561304cb968ec690748` · stamp `bf101520` · `gra-robocza/START.html` |
| **Testy** | tsc OK |
| **Od Ciebie** | Ctrl+F5 · mapa → toolbar uścisk dłoni (Dyplomacja) → sprawdź nagłówek |

---

## [2026-07-07] ✅ Gotowe — HUD mapy: dwa banery (lewy + prawy)

| | |
|---|---|
| **Kto** | Integrator |
| **Co** | Górny pasek państwa podzielony na **dwa banery** w jednym rzędzie: lewy (Skarbiec · Praca · Nauka) · prawy (Zaopatrzenie · Ludność · Kultura · **Religia**) |
| **Przyczyna** | Chip Ludność wylądował samotnie po prawej stronie ekranu; brak chipu Religia |
| **Pliki** | `gra/src/ui/hud.ts` · `gra/src/main.ts` (`buildHudState` → `religionStock` / `religionRate`) |
| **CSS** | `.civ-hud-banner-shell` · `.civ-hud-banner-left` (fixed lewo) · `.civ-hud-banner-right` · `.hud-right-cluster` (prawy banner + epoka/Wiki/Menu) |
| **Religia** | `aggregateReligionEmpire()` → `stateAdherents` (wartość) · `spreadRateTotal` (+X/turę) · ikona `res-religion` |
| **Build** | ROBOCZA md5 `8916b7264a4eceaa6036ae0251a196a3` · stamp `8916b726` · `gra-robocza/START.html` |
| **Testy** | tsc OK |
| **Od Ciebie** | Ctrl+F5 · mapa → lewy banner 3 chipy · prawy banner 4 chipy · Ludność obok Kultury (nie na skraju) |

---

## [2026-07-07] ✅ Gotowe — HUD państwa od razu (tur 0 / zmiana w mieście)

| | |
|---|---|
| **Kto** | Integrator |
| **Co** | Górny pasek imperium (Skarbiec, Praca, Zaopatrzenie, Nauka, Kultura) pokazuje **sumy na żywo** — nie czeka na koniec tury |
| **Przyczyna** | HUD czytał `_last*Rate` ustawiane **tylko w endTurn**; panel miasta liczył lokalnie przez `cityYieldPerTurn` |
| **Fix** | `previewCityEconomy()` (read-only) + `refreshLiveEmpireRates()` wołane przy każdym `updateHud()` |
| **Pliki** | `gra/src/game/turn-economy.ts` · `gra/src/main.ts` |
| **Build** | ROBOCZA md5 `4f80e9d261b63fd3b1ac72d832c229fe` · stamp `4f80e9d2` · `gra-robocza/START.html` |
| **Testy** | tsc OK |
| **Od Ciebie** | Ctrl+F5 · Nowa gra → załóż miasto → pasek ≠ same zera; zmień 👤/suwak → pasek od razu |

---

## [2026-07-07] ✅ Gotowe — Kreator: etykieta „Liczba cywilizacji"

| | |
|---|---|
| **Kto** | Integrator |
| **Co** | Krok 4 kreatora: mylące **„Typy cywilizacji"** → **„Liczba cywilizacji"** (nagłówek suwaka); podpisy pod wartością: „Mniej/Więcej frakcji na mapie" |
| **Gdzie było „typy"** | `ui-params.json` label · `newGameFlow.ts` (notatka kroku 4 + podsumowanie generacji) · `newGameMapDefaults.ts` (descs suwaka ±1) |
| **Pliki** | `gra/data/ui-params.json` · `gra/src/ui/newGameFlow.ts` · `gra/src/map/newGameMapDefaults.ts` |
| **Build** | ROBOCZA md5 `2e83ae94dabbaa36de85f169a5b69de4` · stamp `2e83ae94` · `gra-robocza/START.html` |
| **Testy** | tsc OK |
| **Od Ciebie** | Ctrl+F5 · Nowa gra → krok Ustawienia → sprawdź nagłówek suwaka |

---

## [2026-07-07] ✅ Gotowe — Kreator: switchery zamiast strzałek

| | |
|---|---|
| **Kto** | Integrator |
| **Co** | Krok 4 kreatora (Ustawienia): wiersze trudność, mapa, świat, tempo, miasta-państwa, liczba cywilizacji — **przełączniki segmentowe** zamiast ‹ › |
| **Plik** | `gra/src/ui/newGameFlow.ts` |
| **Build** | ROBOCZA md5 `dadfc0604fefacc2d8cfcb0f16b10cb2` · stamp `dadfc060` · `gra-robocza/START.html` |
| **Testy** | tsc OK |
| **Od Ciebie** | Ctrl+F5 · Nowa gra → krok Ustawienia → klik segmentów |

---

## [2026-07-07] ✅ Gotowe — ROBOCZA zbiorcza przed archiwizacją GitHub

| | |
|---|---|
| **Kto** | Integrator F |
| **Co** | Jeden build łączący całą sesję: plony terenu · panel miasta B14 + Auto budowa · klik w drzewku technologii · zapis ustawień kreatora Nowa gra |
| **Pliki źródłowe** | `terrain-yields.json` · `economy.ts` · `cityPanel.ts` · `cityUxFrame.ts` · `sciencePicker.ts` · `scienceHubHud.ts` · `newGameFlow.ts` |
| **Build** | ROBOCZA md5 `dadfc0604fefacc2d8cfcb0f16b10cb2` · stamp `dadfc060` · `gra-robocza/START.html` |
| **Testy** | tsc OK |
| **Od Ciebie** | Ctrl+F5 · `gra-robocza/START.html` · potem archiwizacja GitHub (commit sam) |

**W bundle:** (1) plony Łąka/Równina/Wzgórza/Góry z Panel-A · (2) panel miasta — Auto budowa 3×2, pasek B14 · (3) Badania — klik zielonego węzła w drzewku · (4) kreator — `civ-new-game-prefs-v1` między sesjami · (5) kopie PLAYTEST zsynchronizowane.

---

## [2026-07-07] ✅ Gotowe — Kreator: zapamiętywanie ustawień generatora

| | |
|---|---|
| **Kto** | Integrator |
| **Co** | Przywrócony persist ustawień kreatora „Nowa gra" (trudność, mapa, tempo, koszty, wzrost ludności, zaawansowane) w `localStorage` |
| **Przyczyna regresji** | Każde otwarcie kreatora zapisywało domyślne wartości przy `render()` — nadpisywało zapisane prefs; wczytywanie miast-państw przed skalowaniem opcji mapy też gubiło indeksy |
| **Plik** | `gra/src/ui/newGameFlow.ts` |
| **Klucz localStorage** | `civ-new-game-prefs-v1` (odczyt migracyjny z legacy `civ-newgame-prefs-v2`) |
| **Build** | ROBOCZA md5 `69ee33777a5e219bdebd559145d1770b` · stamp `69ee3377` · `gra-robocza/START.html` |
| **Od Ciebie** | Ctrl+F5 · Nowa gra → ustaw opcje → menu / odśwież → Nowa gra → te same wartości |

---

## [2026-07-07] ✅ Gotowe — Eksport plonów terenu (Panel-A → gra)

| | |
|---|---|
| **Kto** | Integrator / panel |
| **Co** | `Panel-A-Plony-Terenu.xlsx` → `terrain-yields.json` · gra czyta JSON w `economy.ts` (okolica, tooltip, tura) |
| **Zmiany Ż/P/H** | Łąka 4→3 Ż · Równina 1→2 P · Wzgórza 2→3 P · Góry 0→4 P · Rzeka/Las bez zmian |
| **Plik** | `gra/data/terrain-yields.json` · `gra/src/game/economy.ts` (podpięcie JSON zamiast stałych) |
| **Build** | ROBOCZA md5 `8f6eb435e89e1f8174dc71e5653f4546` · stamp `8f6eb435` · `gra-robocza/START.html` |
| **Od Ciebie** | Ctrl+F5 · Nowa gra · sprawdź plony na mapie / okolicy miasta (Łąka, Równina, Wzgórza, Góry) |

---

## [2026-07-07] ✅ Gotowe — Badania: klik w drzewku technologii

| | |
|---|---|
| **Kto** | Integrator / UI |
| **Co** | Wybór celu badań **kliknięciem zielonego węzła** w drzewku (nie tylko lista po lewej) · zablokowane = tooltip bez akcji |
| **Plik** | `gra/src/ui/sciencePicker.ts`, `gra/src/ui/scienceHubHud.ts` |
| **Build** | ROBOCZA md5 `d52424e508cfb66d50bce0700e2e6b28` · stamp `d52424e5` · `gra-robocza/START.html` |
| **Od Ciebie** | Ctrl+F5 · miasto → Badania → **Pełne drzewko** → klik np. Obróbka drewna → „Aktualnie" u góry się zmienia |

---

## [2026-07-07] ✅ Gotowe — Excel plonów terenu (Żywność / Praca / Handel)

| | |
|---|---|
| **Kto** | Integrator / panel |
| **Co** | `Panel-A-Plony-Terenu.xlsx` — arkusze **Teren-bazowy** (7 typów) + **Bonusy-nakladki** (Rzeka, Las) · tylko 3 surowce do edycji |
| **Plik** | `panele-sterowania/Panel-A-Plony-Terenu.xlsx` · README: `panele-sterowania/README-Panel-A-Plony.md` |
| **Build** | — (dane JSON; build gry po eksporcie) |
| **Od Ciebie** | Edytuj xlsx → w czacie: **eksportuj plony terenu** → potem Ctrl+F5 na roboczej |

---

## [2026-07-07] ✅ Gotowe — Panel miasta: Auto budowa + pasek statystyk (B14)

| | |
|---|---|
| **Kto** | Integrator F |
| **Co** | Panel miasta: sekcja **Auto budowa** — grid 3×2 zamiast poziomego scrolla · górny pasek chipów surowców — `flex-wrap`, bez `overflow-x` · **B14** wyśrodkowanie paska (`fit-content`, bez pustej belki po prawej) |
| **Plik** | `gra/src/ui/cityPanel.ts`, `gra/src/ui/cityUxFrame.ts` |
| **Build** | ROBOCZA md5 `751632d266a607442ad6929a07d35067` · stamp `751632d2` · `gra-robocza/START.html` |
| **Od Ciebie** | Ctrl+F5 · miasto ATENY: pasek wyśrodkowany, kończy się przy „Nauce" · Produkcja → Auto budowa w 2 rzędach |

---

## [2026-07-07] ✅ Gotowe — Handoff plot-code (sesja 06–07.07)

| | |
|---|---|
| **Kto** | Sesja 06–07.07 (zapis dla plot code) |
| **Co** | Pełny handoff: build, wdrożenia, decyzje ZAMKNIĘTE, status bugów B1–B12, priorytety następnego kroku |
| **Plik** | `dyspozycje/HANDOFF-PLOT-CODE-2026-07-06-07.md` |
| **Build** | ROBOCZA md5 `e2c5c711d69065323c2ea3b2be280782` · `gra-robocza/START.html` |
| **Od Ciebie** | **`plot code`** — kontynuacja z repo bez historii czatu |

---

**Ostatnia aktualizacja:** 2026-07-07 (Maciej: gra bootuje, md5 `70b28d10…`)

---

## [2026-07-07] ✅ Potwierdzone — boot naprawiony (Maciej: „działa”)

| | |
|---|---|
| **Build** | md5 `70b28d10abfe641ce08b68e7a3efa430` · stamp `70b28d10` |
| **Fix** | TDZ `anim` w `main.ts` + wcześniejsze cykle nazw miast |
| **Od Ciebie** | Kontynuuj testy z checklisty · `BUG:` gdy coś nie tak |

---

## [2026-07-07] ✅ Gotowe — obwódki w kolorach frakcji (civ-visual)

| | |
|---|---|
| **Kto** | Integrator F (sesja 2026-07-07) |
| **Co** | Obwódka heksu miasta = `kolorHex` właściciela · jednostki AI/gracza = ring w kolorze cywilizacji · w wojnie cienki czerwony akcent (miasto zewnętrzny, jednostka skalowany ring) · dyplomacja już miała `kolorHex` (panel, audiencja, nowa gra) |
| **Build** | ROBOCZA md5 `e2c5c711d69065323c2ea3b2be280782` · `gra-robocza/START.html` |
| **Testy** | tsc OK |
| **Od Ciebie** | Ctrl+F5 · Nowa gra · porównaj obwódki miast AI (różne kolory frakcji) · jednostki przeciwników — ring w ich kolorze · wojna — civ color + czerwony akcent · gracz — złoty/civ ring |

---

## [2026-07-07] ✅ Gotowe — overlay robotników na mapie świata (E-WORKER-1=A)

| | |
|---|---|
| **Kto** | Integrator F (sesja 2026-07-07) |
| **Co** | Przycisk 👤 obok minimapy · przeźroczyste ikonki na hexach z pracownikami · wszystkie miasta gracza · auto ON przy trybie budowy ulepszeń |
| **Build** | ROBOCZA md5 `eead06d7c5ea6c974b07eb02da706bf1` · `gra-robocza/START.html` |
| **Testy** | tsc OK |
| **Od Ciebie** | Ctrl+F5 · klik 👤 przy minimapie · wejdź w 🔨 budowę — overlay włącza się sam · wyjdź z trybu — stan zostaje · 2+ miasta — 👤 ze wszystkich |

---

## [2026-07-07] ✅ Gotowe — A3 marsz redesign (planned march)

| | |
|---|---|
| **Kto** | Integrator F (sesja 2026-07-07 wieczór) |
| **Co** | Klik bez Shift → plan celu + trasa z markerami tur · segment po **Zakończ turę** lub **Kontynuuj** · **Zatrzymaj** / nowy cel / Pomiń czyści · save/load `autoMarch` + `plannedMarches` (SAVE v2) |
| **Build** | ROBOCZA md5 `8fd0dbfc9a5f91a40229d1dcae7800bd` · `gra-robocza/START.html` |
| **Testy** | tsc OK · planned-march-test 11/11 |
| **Od Ciebie** | Ctrl+F5 · zaznacz jednostkę → klik cel (stoi) → Kontynuuj lub end-turn → STOP przy przeszce · zapis w marszu → load → cel zostaje |

---

## [2026-07-07] ✅ Gotowe (kod) — dopisek „miasto-państwo” + ⏸️ A3 marsz w toku

| | |
|---|---|
| **Kto** | Sesja 2026-07-07 |
| **Co** | `Sparta · miasto-państwo` — dyplomacja, mapa, tooltip, panel miasta (`display-names.ts`) |
| **Testy** | `display-names-test.cjs` 6/6 |
| **Build** | ⏸️ po domknięciu A3 marsz (merge `main.ts`) — jeden build Integratora |
| **Od Ciebie** | Po buildzie: dyplomacja vs stolica imperium vs miasto-państwo klastra |

---

## [2026-07-07] ✅ Gotowe — kolory cywilizacji (B) + build robocza

| | |
|---|---|
| **Kto** | Sesja 2026-07-07 (civ-visual B + publish) |
| **Co** | `kolorHex` ×15 cywilizacji · resolver · mapa/jednostki/miasta/minimapa/dyplomacja/HUD |
| **Build** | ROBOCZA md5 `ee4355aff6356667a0318763ec6f9d6d` · `gra-robocza/START.html` |
| **Testy** | tsc OK · civ-visual 54/54 · city-names 10/10 · smoke OK |
| **Od Ciebie** | Ctrl+F5 · kolory na mapie i w dyplomacji · odpowiedź **A3-P0-1** (Shift+marsz) |

---

## [2026-07-07] ✅ Gotowe — import Excel nazw miast + B2-Q1 panel handlu

| | |
|---|---|
| **Kto** | Grupa B (sesja follow-up) |
| **Co** | Pipeline `import-city-names-from-xlsx.py` (Excel → JSON + sync civs.json); B2-Q1=B (panel handlu via fix B1) |
| **Excel** | Edytuj `panele-sterowania/Nazwy-miast-cywilizacji.xlsx` → w czacie napisz **„eksportuj nazwy miast"** |
| **Testy** | `city-names-pool-test.cjs` 10/10 |
| **Od Ciebie** | Przejrzyj nazwy w Excelu; w grze sprawdź suwaki Skarb/Nauka/Zamożność w panelu miasta |

---


| | |
|---|---|
| **Kto** | Follow-up sesji 2026-07-07 (domknięcie 3615b014, 3c1794f3, 5d176733, raport 8e4044ed) |
| **Co** | Kreator: koszty budynków/jednostek (×1/×2/×4), tempo badań, **Wzrost ludności** (×1/×2/×4), asymetria trudności kosztów + progu wzrostu; save/load `wzrostLudnosciPace`; raport dnia zapisany |
| **Build** | ROBOCZA md5 `ae03f50d923a698f644302fdf07e1150` · `gra-robocza/START.html` |
| **Testy** | tsc OK · difficulty-cost 22/22 · population-growth-tempo 14/14 |
| **Od Ciebie** | Ctrl+F5 `gra-robocza/START.html` · Nowa gra · checklist §4 w raporcie dnia |
| **Raport** | `dyspozycje/RAPORT-DZIEN-2026-07-07.md` (sekcja 5 zaktualizowana po domknięciu) |

---

## [2026-07-04 ~23:31] ✅ Gotowe — KANON MAPA bufor rzek 2 hex

| | |
|---|---|
| **Kto** | MAPA lane · Integrator F · Master review + kanon |
| **Co** | Rzeki min. 2 hex ciała od morza · ujście ≤2 hex na wybrzeżu |
| **Kanon md5** | `11d23be65ee6eaf8c5dabe5013eef2d8` · `gra-kanon/START.html` |
| **Od Ciebie** | Ctrl+F5 · nowa gra · brzeg + ujścia rzek |
| **Handoff** | `F-do-MASTER_MAPA-river-sea-buffer-2026-07-04.md` |

---

## [2026-07-04 ~22:03] ✅ Gotowe — KANON roster-6 AI (CYW)

| | |
|---|---|
| **Kto** | CYWILIZACJE lane · MASTER review + promocja |
| **Co** | 6 własnych archetypów AI (Harappa, Hetyci, Słowianie, Babilonia, Asyria, Fenicjanie) · Hetyci nauka +2 |
| **Kanon md5** | `dafa21f48be84501ad74145e8d65f9f4` · start: `gra-kanon/START.html` |
| **Od Ciebie** | nic — playtest opcjonalny |
| **Handoff** | `CYWILIZACJE-do-MASTER_roster-6-archetypy-ai_2026-07-04.md` |

---

## [2026-06-26] ✅ Gotowe — E2 kreator (UI + MAPA + SILNIK)

| | |
|---|---|
| **Kto** | Grupa E (UI) · Grupa A (generator) · Integrator F (`main.ts`) |
| **Co** | Krok 4: **Miasta-państwa** + **Typy cywilizacji** · zaawansowane: 4 suwaki gęstości · `buildParams()` → generator |
| **Pliki** | `gra/src/ui/newGameFlow.ts` · `gra/data/ui-params.json` · `gra/src/map/generator.ts` · `gra/src/main.ts` |
| **Testy** | `world-density-test.cjs` (E2-PARAMS) |
| **Od Ciebie** | nic — efekt w **ROBOCZA** `351d8ad6…`; kanon po review Master |
| **Handoff** | `dyspozycje/_handoff/UI-do-INTEGRATOR_E2-kreator-gestosc.md` |

---

## [2026-06-26] ✅ Gotowe — protokół logu `MACIEJ-GOTOWE.md` (Master)

| | |
|---|---|
| **Kto** | Master |
| **Co** | Agenci **muszą** dopisywać tu co przygotowali (obok czatu **`✅ Gotowe:`**) |
| **Pliki** | `docs/MACIEJ-GOTOWE.md` · reguły w `OBOWIAZ-POWIADOM-MACIEJA.md` · `PLOT-CODE-WORKFLOW.md` |
| **Od Ciebie** | **`plot code`** gdy chcesz kolejną paczkę kodu |

---

## [2026-06-26] ✅ Gotowe — W1-PREP tokeny menu i kreator (UI)

| | |
|---|---|
| **Kto** | Lane UI (sesja autonomiczna) |
| **Co** | Tokeny brand Warstwa 1 (1B/2C/4C) w menu i kreatorze; rejestr ikon Tier 1–2 (placeholder) |
| **Pliki** | `gra/src/ui/brandTokenVars.ts` · `gra/src/ui/icons/iconRegistry.ts` · `gra/src/ui/mainMenu.ts` · `gra/src/ui/newGameFlow.ts` |
| **Testy** | smoke OK |
| **Od Ciebie** | nic (kolejny krok: folder Design `brand-book-1E/eksport/` albo **`plot code`**) |
| **Handoff** | `dyspozycje/_handoff/UI-do-MASTER_warstwa1-w1-prep-2026-06-26.md` |

---

## [2026-07-02] ✅ Gotowe — paczka PILNE A–E + F (ROBOCZA, bez kanonu)

| | |
|---|---|
| **Kto** | Grupy A–E + Integrator F |
| **Co** | VICTORY + F-P1-01 (atak miasta z mapy) + B1-Q3 Panel-B + mapFieldBattle + victoryScreen |
| **Build** | ROBOCZA md5 `351d8ad65ab9c0e560961438cdd56d39` — **promocja kanon pending** |
| **Testy** | map-attack 8/8 · field-battle 15/15 · victory 12+11 · tech-tree 19/19 · smoke OK |
| **Od Ciebie** | nic — Master: review + ewent. playtest po kanonie |
| **Handoffy** | `F-do-MASTER_F-P1-01-2026-07-02.md` · `F-do-MASTER_VICTORY-E-P0-06-2026-07-02.md` · `EKONOMIA-do-MASTER_B1-Q3-panel-B-2026-07-02.md` |

---

## Szablon wpisu (dla agentów)

**Sukces** — wklej **pod** linię `---` na górze listy:

```markdown
## [RRRR-MM-DD] ✅ Gotowe — [krótki tytuł] ([lane / grupa])

| | |
|---|---|
| **Kto** | Master / Grupa X / UI / F |
| **Co** | [1–2 zdania] |
| **Pliki** | [ścieżki] |
| **Testy** | [opcjonalnie] |
| **Od Ciebie** | [nic / akcja] |
| **Handoff** | [opcjonalnie] |
```

**Bloker:**

```markdown
## [RRRR-MM-DD] ⏸️ Czeka — [krótki tytuł]

| | |
|---|---|
| **Kto** | … |
| **Co brakuje** | … |
| **Co już jest** | … |
| **Od Ciebie** | [jedna akcja] |
```

Reguła: [`docs/obieg/OBOWIAZ-POWIADOM-MACIEJA.md`](obieg/OBOWIAZ-POWIADOM-MACIEJA.md)
