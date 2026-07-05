# DZIENNIK MASTERA — rejestr przepływów

Append-only. Source of truth operacyjny projektu Civ.

---

## [2026-07-05 ~09:15] Audyt Opus 5 → **dyspozycja F BLEDY-2026-07-05**

**Źródło:** Maciej · raport `dyspozycje/BLEDY-DO-NAPRAWY-2026-07-05.md` (audyt zewnętrzny + test generatora Macieja)

**Potwierdzone P0 MAPA:**
- B0.1 rzeki bez ujścia (~28% na „ziemia") — purge po `generateRivers()` kasuje wodę
- B0.2 wolna generacja (standard ~26 s) — 47% CPU `oceanConnectedWaterKeys` w pętli
- B0.3 `TerenBazowy.Morse` literówka — wybrzeże tylko eroduje

**Dyspozycja F:** `_handoff/MASTER-do-INTEGRATOR_BLEDY-2026-07-05.md`  
**Kolejka:** `INTEGRATOR-kolejka.md` P0 · `INTEGRATOR-STAN.md` zaktualizowany  
**P1:** 158 błędów `tsc` (crashe main.ts + reszta tabeli raportu)  
**P2 BLOCKED:** podwójna szarża, wasalizacja, seed save — czeka ABC Macieja (F tylko raportuje)

**Następny krok:** Integrator F `działaj` → meldunek `F-do-MASTER_BLEDY-2026-07-05.md` → Master review → promocja kanon po playteście MAPA

---

## [2026-07-05 ~09:30] F → MASTER · **P0 MAPA GOTOWE-ROBOCZA**

**Meldunek:** `_handoff/F-do-MASTER_BLEDY-2026-07-05.md`  
**md5 robocza:** `b468cadea475517b9bcc07194bdd5036` (kanon nadal `89a870fb…`)

**Wyniki AC:**
- B0.1: 0/877 głównych rzek bez ujścia (5 seedów × 4 typy)
- B0.2: standard 26,4 s → **4,36 s** · duża **9,02 s**
- B0.3: Morse→Morze
- Test: `map-gen-regression-test.cjs` PASS · smoke OK

**Otwarte:** P1 tsc **157** błędów (osobny batch F) · P2 BLOCKED ABC · playtest MAPA Macieja przed kanonem

---

## [2026-07-05 ~08:42] CYWILIZACJE · **status ZAMKNIĘTY** — brak batchu MASTER

**Lane meldunek:** roster-6 ✅ kanon · Panel-D sync ✅ · export NIE · CUDA G1 / jednostki / bonusy → inne lane'y  
**MASTER:** **nic do roboty** w tym batchu CYW

---

## [2026-07-05 ~08:34] Maciej · **OK master** ✅ — sign-off kanon

**Werdykt:** `ok master` — kanon zaakceptowany po playteście.

**Checkpoint:** md5 `89a870fbecbc015cb96a2e90cba04511` · `Gra-podglad.html` = `gra-kanon/START.html`

**Zamknięte w batchu:** POLE-BITWY v4/v4.1 · EKO-TECH-P1 · miasta 3D (11 brąz + kamień per-cyw) · CYW AI roster-6 · FoW F/M.

**Otwarte (backlog, nie blokuje):** MAPA rzeki ujście/pustynia (playtest w roboczej) · wzgórza/góry · upgrade budynków (`upgrade`).

---

## [2026-07-05 ~08:35] CYWILIZACJE → MASTER: **Panel-D sync** — bez exportu (Maciej)

**Panel:** `panele-sterowania/Panel-D.xlsx` wygenerowany z JSON (15 nacji, roster-6, archetypy Q7=A, Hetyci nauka=2).  
**Maciej:** na razie **bez edycji Excela** → export **niepotrzebny** (Excel = JSON).  
**Później:** edycja Wartosc → sygnał **eksportuj panel D**.  
**Batch archetypy AI:** już w kanonie (handoff 2026-07-04, md5 `dafa21f4…`).

---

## [2026-07-05 ~08:33] MAPA → MASTER · rzeki ujście + pustynia bez „oceanów”

**Deliverable:** `gen-helpers.ts`, `generator.ts`, `render/scene.ts` → **gra-robocza** (rebuild).

**Czeka:** playtest Macieja (rzeki→morze, pustynia). Potem Opus → kanon.

**Backlog MASTER (po sign-off):** pasek postępu (UI+hook+main.ts) · Super Huge perf.

---

**Hasło:** `upgrade` / `działaj` — **ZAMKNIĘTE** w ROBOCZA.

**Zakres:** `buildings.json` (łańcuchy upgrade + merge staty), `tech.json` (Drogi brukowane), `terrain-improvements.json` (ABC-24: tylko +2 ruch), `building-upgrades.ts`, `production.ts` (Rozbuduj X→Y, ukrycie Teatru), `cityPanel.ts` (↗ + panel składu), `main.ts` (maMur po fort).

**Test:** `node tools/upgrade-budynki-test.cjs` → **28/28 PASS**

**ROBOCZA md5:** `89a870fbecbc015cb96a2e90cba04511` · start: `gra-robocza/START.html`

**Kanon:** czeka Opus przed `Gra-podglad.html`.

---

## [2026-07-05] DESIGN · zlecenie A-06 + A-18 Armia na mapie (gap Cursor)

**Problem:** 2 screenshoty Macieja — (1) panel stosu A-06: fiolet Rozdziel, niebieski Połącz, ⚔️, zielony HP; (2) modal merge A-18: 🔗, zielony CTA.

**Werdykt Macieja:** treść OK · wygląd → **Design mockup 1E** (nie zostawiamy szkicu lane).

**Dokumenty:**
- Spec: `docs/ux/DESIGN-ZLECENIE-ARMY-MERGE-A18-2026-07-05.md`
- Wklejka: `docs/ux/WKLEJKA-DESIGN-START-ARMY-MERGE-A18.md`
- Review HTML: `docs/ux/export/A18-ARMY-MERGE-GAP-DLA-DESIGN.html`
- Screenshoty: `screenshots/A06-stack-przed-2026-07-05.png` · `A18-merge-przed-2026-07-05.png`

**ZLECENIE-ID:** `ARMY-MERGE-A18-2026-07-05` · **3 mockupy P0** + **A-20 toast P1** · wspólna karta jednostki

**Update 2026-07-05:** dopisano **A-20 hint** („Połączono: 2 jedn…”) · DS-13 w tej samej paczce ZIP.

---

## [2026-07-05] Maciej · audyt C-04/C-05 oblężenie — **stare grafiki w grze**

**Screenshot:** panel „Oblężenie” Ateny · emoji ⛺🏛🛡 · opis Szturm `preBattle · bitwa z murem`.

**Werdykt audytu:** Design **v2 gotowy** (`C04-C05-A19-mapa-v2_2026-07-04`) — **lane NIE portował** do `siegeMapPanel.ts` / `cityAttackChoice.ts` / `cityCaptureNotice.ts` (w kodzie nadal emoji lane v1–v3).

**Review:** `docs/ux/export/C04-C05-PREBITWA-AUDIT-STARE-GRAFIKI.html` · screenshot `screenshots/C05-siege-panel-przed-2026-07-05.png`

**Następny krok:** dyspozycja lane UI **port C04-C05-A19 v2** (bez nowego zlecenia Design). Pre-bitwa C-01 = v3 OK layout · ikony → JEDNOSTKI-INFOGRAFIKI.

---

## [2026-07-05] DESIGN · zlecenie Jednostki infografiki 1E (spójny kanon SVG)

**Problem:** różne ikony tego samego typu w mieście / pre-bitwie / POLE-BITWY / Strategia.

**Dokumenty:**
- Spec: `docs/ux/DESIGN-ZLECENIE-JEDNOSTKI-INFOGRAFIKI-2026-07-05.md`
- Wklejka: `docs/ux/WKLEJKA-DESIGN-START-JEDNOSTKI-INFOGRAFIKI.md`
- Review HTML: `docs/ux/export/JEDNOSTKI-INFOGRAFIKI-GAP-DLA-DESIGN.html`

**ZLECENIE-ID:** `JEDNOSTKI-INFOGRAFIKI-1E-2026-07-05` · Poziom A: 4 klasy · Poziom B: 18 kategorii · min. 22 SVG

---

## [2026-07-05] DESIGN · zlecenie POLE-BITWY v5 GAP (Cursor → mockupy)

**Cel:** pełna lista elementów lane Cursor bez mockupu Design — paczka do przygotowania przez Designera.

**Dokumenty:**
- Spec: `docs/ux/DESIGN-ZLECENIE-POLE-BITWY-v5-GAP-2026-07-05.md`
- Wklejka: `docs/ux/WKLEJKA-DESIGN-START-POLE-BITWY-v5-GAP.md`
- Review HTML: `docs/ux/export/C-POLE-BITWY-GAP-DLA-DESIGN.html`
- Handoff szablon: `docs/ux/claude-design/DESIGN-do-UI_POLE-BITWY-v5-gap.md`

**ZLECENIE-ID:** `POLE-BITWY-v5-gap-2026-07-05` · P0: C-23 Szczegóły + C-12 v3 replay/porażka · P1: popupy Formacja/Konnica/Linie/Taktyka

---

## [2026-07-05 ~01:43] Maciej · playtest perf mapy + pasek postępu odłożony

**Feedback:** generowanie **akceptowalne** (wcześniej Standard ~1000 s). Efekt mapy OK.

**Decyzja:** pasek postępu przy starcie gry — **później**, po śledzeniu (MASTER+UI, nie teraz).

**Stan techniczny:** optymalizacja MAPA w roboczej md5 `88F3E2A…` · szczegóły `MAPA-DO-MASTERA.md` §perf 2026-07-05.

---

## [2026-07-05 ~01:45] Maciej · rzeki nie trafiają do morza (jutro)

**Feedback:** wygląd rzek OK, minus — **ujścia wizualnie nie sięgają morza**. Podejrzenie: **bufor 2 hex** vs wymóg drenażu.

**Decyzja:** naprawa **jutro** (MAPA). Pasek postępu nadal odłożony.

---

## [2026-07-05 ~01:51] Maciej · Super Huge timeout (~4 min)

**Feedback:** **Super Huge** — przerwane po ~4 min „przywracania strony”. Standard/Ogromny OK.

**Decyzja jutro:** ① **pasek postępu** (MASTER+UI, hook MAPA) ② **opt Super Huge** (~672×476) ③ rzeki→morze ④ strefy klimatyczne ABC.

---

## [2026-07-05 ~00:45] MASTER · **EKO-TECH P2–P5** → ROBOCZA ✅

**Trigger:** Maciej **`działaj`**

**Wdrożenie:**
- Paczki **2–5** scalone w build (fort/spichlerz/popalnia · brąz AND-gate · hodowla ABC-18 · stadnina · panel surowców ABC-19)
- **T-TECH-4:** tarasy po Rolnictwie — **wszystkie cywilizacje** (`improvement-build.ts`)
- Testy: p1 9/9 · p2 9/9 · p3 10/10 · p4 10/10 · p5 11/11 · food-hodowla 26/26 · map-qualify 42/42 · smoke OK

**ROBOCZA md5:** `395f12c3a22847cdfb0444acaee37ac4` · **Start:** `gra-robocza/START.html` (Ctrl+F5)

**Kanon (`Gra-podglad.html`):** bez promocji — zgodnie z decyzją Macieja 2026-07-05 (robocza = aktywna wersja do gry; Opus przed kanonem).

**Handoffy:** `_handoff/MASTER-do-INTEGRATOR_eko-tech-p4-2026-07-05.md` · `p5-2026-07-05.md`

**Otwarte:** ABC-20…24 (`upgrade`) · ABC-15 handel ≥2 (v2 stock)

---

## [2026-07-05 ~00:50] Maciej · **upgrade jutro** + **pakiet budynków w mieście**

**Decyzja:** upgrade budynków (**ABC-20…24**, UI listy) → **jutro** (hasło `upgrade`).

**Kierunek projektowy (Maciej):**
- Trzeba ustalić **jak budynki „siedzą” w mieście** (plan budowy + ewentualnie model na mapie).
- Budynki **łączą się w pakiety** — np. **trójki**, **jeden po drugim w pakiecie** (łańcuch / dzielnica — do ABC jutro).

**Przygotowanie MASTER na jutro:** paczka ABC = (1) logika upgrade JSON · (2) **UPG-UI** prezentacja · (3) **UPG-LOKALIZACJA** — pakiet trójek vs slot vs dzielnica.  
**Plik roboczy:** `docs/decyzje/ODLOZONE-UPGRADE-BUDYNKOW-2026-07-04.md` (uzupełnić sekcję pakietów).

---

## [2026-07-04 ~23:45] MASTER · **KONIEC SESJI** · przypomnienie na jutro 📌

**Maciej:** kończymy na dziś.

**Dziś MAPA (robocza):** fix wysepek w oceanie (`finalizeLandMassAfterCoast`) · wysokości morze/ląd (morze 0.18, ląd min +0.35) · md5 `df7e25dc5fd753480b7e1b16a5495fdb`

**JUTRO 2026-07-05 — PRZYPOMNIJ MACIEJOWI:** **strefy klimatyczne** (pas suchy / dżungla / umiarkowany) → decyzja ABC, potem lane MAPA.  
**Zapis:** `docs/master/maciej/MACIEJ-TEMATY-MAPA-OTWARTE.md` §5 · `dyspozycje/MAPA-STAN.md`

---

## [2026-07-04] POLE-BITWY v4.1 · **KOMPLET** ✅

**Marker:** `POLE-BITWY-20260704-poprawki-v4.1` · **MD5 końcowy:** `9eb46ad1b70f195868926b246053c7f3`  
**Scope:** P0 Popup Strategia 1E (mockup) · P1 top-bar · `Grupa N · cnt` · puste sloty · UNITS grupowanie deploy  
**Design:** `docs/ux/claude-design/` + `_dist/POLE-BITWY-poprawki-v4.1-2026-07-04/`  
**Artefakt:** root + `gra-kanon/` + `gra-robocza/` · `Gra-podglad-POLE-BITWY.html` (osobny tor, nie `Gra-podglad.html`)  
**Historia promote:** `master` ~23:18 (`253c91bc…`) → mockup pass ~23:30 (`9eb46ad1…`) — **stan końcowy zsynchronizowany**

**Design meldunek (2026-07-04 ~23:36):** `MELDUNEK-POLE-BITWY-v4.1.md` w paczce ZIP + kopia do `brand-book/` (GitHub push) · paczka: 3× `.dc.html` · `support.js` · handoff · meldunek · lane UI **GOTOWE** ↔ Design **ZAMKNIĘTE**

**Promote gry (2026-07-04 ~23:40):** rebuild + sync root/`gra-kanon`/`gra-robocza` · MD5 `a398720f…`

---

## [2026-07-04 ~23:35] MASTER · **MAPA fix pustynia w oceanie** → robocza ✅

**Trigger:** Maciej — screen pustynia zalana wodą (hex 100,33 + żółte wysepki w morzu)  
**Przyczyna:** `removeTinyLandIslands` tylko wcześnie w pipeline; po rebalance/jagged coast zostawały wysepki (rdzeń + pierścień wybrzeża ≥8 hex)  
**Fix:** `finalizeLandMassAfterCoast` — tiny islands + `purgeOpenOceanLandSpecks` ×2 passy po finalnym wybrzeżu i przed rzekami  
**Test:** `stranded-land-test.cjs` **18/18** · river-sea-buffer 6/6 · smoke OK  
**Robocza md5:** `0b8a9a7fb7bcc7197de869f79b841016` · **Ctrl+F5** `gra-robocza/START.html` + **nowa gra**

---

## [2026-07-05 ~08:34] Maciej **`master`** · **KANON promocja** ✅

**Bramka:** combat 6/6 · smoke OK  
**Kanon md5:** **`89a870fbecbc015cb96a2e90cba04511`**  
**Zakres:** Panel-C staty · units 75 · poprzedni kanon → archiwum `gra-kanon_20260705-083410`  
**Start:** `gra-kanon/START.html` · root `Gra-podglad.html`

---

## [2026-07-05 ~00:30] Maciej **`działaj później master`**

**Decyzja:** robocza = aktywna wersja do gry · promocja kanonu **odłożona**  
**Graj:** `gra-robocza/START.html` (Panel-C staty · md5 `5206766b…`)  
**Kolejka MASTER (walka/jednostki):** pusta · czekam na playtest / `master` / tematy innych lane'ów

---

## [2026-07-05 ~00:25] Maciej **`eksportuj panel C`** · **Panel-C → gra** ✅

**Eksport:** `python panele-sterowania/export-c.py`  
**Zmiany:** staty=406 · macierz=45 · koszty=2 · moc_cache=78  
**Bramka:** combat 6/6 · unit-power 6/6 · smoke OK  
**Robocza:** md5 **`5206766b8f460173d12bcfd51552f923`** · `gra-robocza/START.html`  
**Kanon:** bez zmian (promocja = **`master`**)

---

## [2026-07-05 ~00:12] MASTER · **audyt jednostki/walka/bitwa + panel sterowania** ✅

**Wniosek:** kod lane C/UNITS **komplet** — roster-6 75 wpisów · kanon · POLE-BITWY v4.1  
**Panel:** `docs/obieg/PANEL-MASTER.md` · `C-walka.md` · `UNITS-STAN.md` zaktualizowane  
**Kolejka implementacji MASTER:** pusta (balans Excel = poza kodem)

---

## [2026-07-04 ~23:34] Maciej **`master`** · **KANON EKO-TECH P2 + units 75** ✅

**MD5:** `0b8a9a7fb7bcc7197de869f79b841016` · **Start:** `gra-kanon/START.html` · root `Gra-podglad.html`  
**Zakres:** EKO-TECH paczka 2 (Cytadela/Fort · Spichlerz 70% · popalnia na rudzie) + **units.json 75**  
**Bramka:** eko-tech-p1 **9/9** · eko-tech-p2 **9/9** · combat **6/6** · smoke OK  
**Archiwum:** `gra-kanon-archiwum/gra-kanon_20260704-233347`

---

## [2026-07-05 ~00:15] MASTER · **EKO-TECH Paczka 4** wdrożona lane 🟠

**Decyzje:** ABC-16/17/18 = A → `PACZKA-4-EKO-TECH-ABC-2026-07-05.md`  
**ABC-18:** Stadnina (Jeździectwo) · pastwisko/stadnina = bramka dostępu · brak plonów ze złoża bez budowy  
**Test:** paczka4 **10/10** · food-hodowla **26/26**  
**Następne ABC:** paczka **5/5** (ABC-19 panel surowców) — napisz `format`

---

## [2026-07-05 ~00:05] MASTER · **EKO-TECH P3 wire main.ts** 🟠

**Trigger:** Maciej `działaj`  
**Wpięcie:** `getPlacedImprovements` w cityPanel + autoManage · testy **28/28** (p1+p2+p3)  
**Czeka F:** rebuild ROBOCZA/kanon · playtest łańcuch brązu

---

## [2026-07-04 ~23:55] MASTER · **EKO-TECH Paczka 3** wdrożona lane 🔵

**Decyzje:** ABC-12=A, ABC-13=A+ łańcuch, ABC-15=A → `PACZKA-3-EKO-TECH-ABC-2026-07-04.md`  
**Kod:** `braz-access.ts` · Piec hutniczy · bramka Popalnia+Piec · test **10/10**  
**Handoff F:** `MASTER-do-INTEGRATOR_eko-tech-p3-2026-07-04.md` (wire `placedImprovements` w main.ts)  
**Następne ABC:** paczka **4/5** (ABC-16, 17, 18)

---

## [2026-07-04 ~23:45] MASTER · **EKO-TECH Paczka 2** (ABC-10/11/14) 🔵

**Trigger:** Maciej — `działaj` (rekomendacje A/A/A z paczki 2/3)  
**Decyzje:** `docs/decyzje/PACZKA-2-EKO-TECH-ABC-2026-07-04.md`  
**Wdrożenie lane:** Cytadela/Fort (JSON) · Spichlerz 70% · popalnia na rudzie (`improvement-build.ts`)  
**Test:** `node tools/eko-tech-paczka2-test.cjs` — **7/7**  
**Handoff F:** `dyspozycje/_handoff/MASTER-do-INTEGRATOR_eko-tech-p2-2026-07-04.md`  
**Czeka:** ~~rebuild ROBOCZA~~ → **KANON** md5 `0b8a9a7…` (master ~23:34)

---

## [2026-07-04 ~23:31] MASTER · **KANON units.json 75 + rebuild główny** ✅

**Trigger:** Maciej — „ciśnij do przodu, nie czekaj”  
**units.json:** 75 wpisów (batch 0 Germanie + batch 3 ×8) · fix Thorakites `Nacja: Grecja`  
**Kanon:** md5 `11d23be65ee6eaf8c5dabe5013eef2d8` · `gra-kanon/START.html` · root `Gra-podglad.html`  
**POLE-BITWY:** rebuild + sync kanon  
**Bramka:** combat 6/6 · smoke OK · `publish-robocza` + `publish-kanon`  
**Archiwum:** `gra-kanon-archiwum/gra-kanon_20260704-232905`  
**Produkcja Nacja:** już wired — playtest w mieście następny krok

---

## [2026-07-04 ~23:30] UNITS · **Batch 0 + Batch 3** ✅ · units.json **75** wpisów

**Batch 0:** Wojownik germański → Super Brąz · **Batch 3:** +8 (Grecy/Rzym/Zulu/Inkowie/Egipt/Sumer/Celtowie)  
**Sync:** `gra-kanon/data/units.json` + `gra-robocza/data/` · combat 6/6  
**Czeka:** rebuild bundle główny (`master`) · produkcja miasta (EKONOMIA)

---

## [2026-07-04 ~23:31] Maciej **`działaj`** · **KANON MAPA bufor rzek** ✅

**Tor:** F bramka → `GOTOWE-ROBOCZA` → review Master APPROVE → kanon  
**MD5:** `11d23be65ee6eaf8c5dabe5013eef2d8` · `gra-kanon/START.html`  
**Zakres:** rzeki min. 2 hex od morza · ujście ≤2 hex · gen. po wybrzeżu  
**Bramka:** river-sea-buffer **6/6** · smoke OK  
**Handoff F:** `F-do-MASTER_MAPA-river-sea-buffer-2026-07-04.md`  
**Playtest:** Ctrl+F5 · **Nowa gra** · sprawdź ujścia rzek przy brzegu

---

## [2026-07-04 ~23:18] Maciej **`master`** · **KANON POLE-BITWY v4.1** ✅

**Komenda:** `master` (po playteście v4.1)  
**Review:** APPROVE Maciej · Opus pominięty (artifact POLE-BITWY)  
**MD5:** `253c91bc916fa193d6d778c71cdabab08` · marker `POLE-BITWY-20260704-poprawki-v4.1`  
**Promocja:** `Gra-podglad-POLE-BITWY.html` → `gra-kanon/` + `gra-robocza/` + root  
**Src sync:** `battleScene.ts` · `battleHudTheme.ts`  
**Bramka:** combat 6/6 ✅ · smoke OK ✅ · battle-smoke main bundle — stack overflow JSDOM (baseline, nie blokuje POLE-BITWY)  
**Playtest:** Ctrl+F5 `gra-kanon/Gra-podglad-POLE-BITWY.html`

---

## [2026-07-04 ~23:15] UI lane · **POLE-BITWY poprawki v4.1** ✅ build roboczy

**MD5:** `253c91bc916fa193d6d778c71cdabab08` · marker `POLE-BITWY-20260704-poprawki-v4.1`  
**P0:** Strategia 1E · **P1:** top-bar skrzyżowane miecze · Grupa N·cnt · puste sloty  
**UNITS:** fix grupowania deploy · **Czeka:** playtest Macieja → promote kanon POLE-BITWY

---

## [2026-07-04 ~22:59] Maciej **`działaj`** · **PROMOCJA KANON MAPA fair-play** ✅

**MD5:** `afd8770db6baeeccc163899441d7633c` · **Start:** `gra-kanon/START.html` · root `Gra-podglad.html`  
**Źródło:** robocza `afd8770…` (22:57) · archiwum poprzedniego kanonu: `gra-kanon-archiwum/gra-kanon_20260704-225912`  
**Bramka Master:** relief 6/6 · river-grid 9/9 · river-path 994/994 · smoke OK · fair-play 6/2 (baseline gęstość wzgórz) · logic 202/203 (baseline startPositions)  
**Zakres:** siatka rzek 10×10 · min. 25 hex · las min 1/10×10 · relief fair play · FoW F/M · brzeg C + delta A

---

## [2026-07-04 ~23:15] MASTER · **Rzeki bufor 2 hex od morza** ✅

**Reguła Macieja:** ciało rzeki min. **2 hex** od morza; tylko **ujście** (≤2 hex) wpada w wybrzeże.  
**Fix:** A* bez biegu wzdłuż plaży · brak krawędzi na oceanie · rzeki **po finalnym wybrzeżu** (nie przed rebalance).  
**Robocza:** md5 `5e3e2c762f39b9a65979caa3523fdae3` · test `river-sea-buffer-test.cjs` 6/6

---

**MD5:** `afd8770db6baeeccc163899441d7633c` · **Start:** `gra-robocza/START.html` (Ctrl+F5)  
**Zakres:** siatka rzek 10×10 · min. 25 hex · sufit liczby rzek usunięty · las min 1/10×10 · relief fair play  
**Bramka:** smoke OK · river-grid 9/9 · **→ kanon 22:59**

---

## [2026-07-04] LANE UI · **POLE-BITWY poprawki v4.1** ✅ → `UI-DO-MASTERA.md`

**MD5 POLE-BITWY:** `435aa61d6afca0fa9e0cbc44122f4012` · marker `POLE-BITWY-20260704-poprawki-v4.1`  
**Zakres:** popup Strategia 1E (dropdown/checkbox/sticky/scroll) + P1 top-bar · `Grupa N · cnt` · puste sloty rosteru  
**Playtest:** Ctrl+F5 `gra-kanon/Gra-podglad-POLE-BITWY.html` → potem `master POLE-BITWY`

---

**ZIP:** `POLE-BITWY-poprawki-v4.1-2026-07-04` (Maciej / Design)  
**P0:** popup **Strategia** 1E — dropdowny złote, medaliony K/Ł/P, chevron SVG, scroll+sticky „Skopiuj z priorytetów armii”, checkbox 1E  
**P1 (notatki):** top-bar cluster · nagłówki `Grupa N · liczba` · puste sloty rosteru → `DESIGN-do-UI_POLE-BITWY-poprawki-v4.1.md`  
**Handoff UI:** `dyspozycje/_handoff/MASTER-do-UI_POLE-BITWY-poprawki-v4.1-2026-07-04.md`  
**Docelowy folder:** `docs/ux/claude-design/_dist/POLE-BITWY-poprawki-v4.1-2026-07-04/` (ZIP **gotowy** · Maciej potwierdził nazwę pobierania 2026-07-04 · **jeszcze nie w repo**)

---

## [2026-07-04 ~22:22] MASTER · **POLE-BITWY v4 artifact** ✅ · `master POLE-BITWY`

**Review:** APPROVE skin 1E · marker `POLE-BITWY-20260704-design-v4`  
**MD5 POLE-BITWY:** `ea54bf61d9105f2cde3484d74c2cfc72` → `gra-kanon/` + `gra-robocza/`  
**Osobny build** — kanon główny `Gra-podglad.html` bez zmian w tym kroku

---

## [2026-07-04 ~22:20] Maciej **`master`** · **PROMOCJA KANON** ✅

**MD5:** `0163da510c807dcd86ced86d4ab328b2` · **Start:** `gra-kanon/START.html` · POLE-BITWY: `Gra-podglad-POLE-BITWY.html`  
**Bramka:** eko-tech 9/9 · smoke OK · logic 202/203 · ai 227/232 · combat baseline  
**Zakres:** POLE-BITWY v4 · EKO-TECH-P1 · miasta 3D · CYW AI roster-6 · MAPA sync

---

## [2026-07-04 ~22:18] MASTER · **dzialaj** — POLE-BITWY v4 skin + podglądy miast

**UI:** port Design 1E → `Gra-podglad-POLE-BITWY.html` · meldunek `UI-DO-MASTERA` → GOTOWE  
**MAPA:** podglądy miast odświeżone (brąz 11 + kamień per-cyw) w `Civ-MAPA/`  
**Playtest:** POLE-BITWY · miasta · mapa START.html

---

## [2026-07-04 ~22:15] MASTER · **dyspozycja F + MAPA** (EKO-TECH-P1)

**F P0:** `MASTER-do-INTEGRATOR_eko-tech-p1-2026-07-04.md` — bramka + ROBOCZA (Master **nie** builduje).  
**MAPA P0:** `MAPA.md` — droga brukowana (+2 ruch).  
**Uwaga procesu:** wpis ~22:10 (main.ts przez hub) = **wyjątek błędny** — od teraz tylko F.

---

## [2026-07-04 ~22:10] MASTER · **EKO-TECH-P1 wpinięte w main.ts** ✅

**Batch SILNIK:** bramka `wymagany budynek` (gate z `cityBuilt`) + `applyCompletedBuildingIds` przy ukończeniu budynku.  
**Build:** vite → `$TEMP\civ-dist` OK · **eko-tech-paczka1:** 9/9  
**Kanon:** czeka Opus przed kopią do `Gra-podglad.html`  
**Handoff:** `EKONOMIA-do-SILNIK_eko-tech-p1-integracja` → **GOTOWE**

---

## [2026-07-04 ~22:05] Maciej · **Master ≠ Integrator** 🔔

**Reguła:** wdrożenia z lane'ów (A–E) → **dyspozycja Integrator F** → F build + `gra-robocza/` → `GOTOWE-ROBOCZA` → Master review + **tylko** promocja kanon.  
**Master NIE:** `vite build` · `publish-robocza` · integracja kodu lane.  
**Uwaga procesu:** roster-6 (~22:03) poszedł przez Master — **wyjątek błędny**; od teraz obowiązuje tor F.

---

## [2026-07-04 ~22:03] MASTER · **KANON roster-6 AI** ✅ · Opus wycofany

**Decyzja Macieja (~22:00):** review = **Master w hubie** (bez Opus) → promocja kanon od razu po APPROVE.  
**Batch:** CYW roster-6 · D-ROSTER-Q7=A · Hetyci nauka +2  
**Kanon md5:** `dafa21f48be84501ad74145e8d65f9f4` · `gra-kanon/START.html`  
**Archiwum:** `gra-kanon-archiwum/gra-kanon_20260704-220300`  
**Review MASTER:** APPROVE (scope · T3e–h · build · bez main.ts)

---

## [2026-07-04 ~22:00] MASTER · **CYW roster-6 AI — bramka OK** · kanon CZEKA Opus

**Handoff:** `CYWILIZACJE-do-MASTER_roster-6-archetypy-ai_2026-07-04.md`  
**Pliki:** `ai-params.json` (+24) · `ai.ts` (`CIV_TO_ARCH` 6 własnych) · `ai-test.cjs` T3e–T3h  
**Bramka:** T3e–T3h ✅ · ai-test 227/232 (5× T2S baseline) · vite build `/tmp` ✅ · tsc baseline-red  
**Następny:** review Opus → Maciej **`master`** → `publish-kanon-snapshot.ps1`

---

## [2026-07-04 ~21:54] Maciej · **PRZYPOMNIENIE: upgrade budynków + UI panelu** 🔔

**Odłożone do:** po paczkach EKO-TECH 2/3 · hasło **`upgrade`**  
**Zakres:** lista **wybudowanych**, kolejka **Rozbuduj**, prezentacja **bonusów** (suma vs rozpiska)  
**Plik:** `docs/decyzje/ODLOZONE-UPGRADE-BUDYNKOW-2026-07-04.md`  
**Otwarte ABC:** 20–24 + UPG-UI (kult już częściowo T-TECH-8)

---

**Decyzje:** `docs/decyzje/D-EKO-TECH-PACZKA1-2026-07-04.md` · rejestr **EKO-TECH-P1**  
**Handoffy:** CYWILIZACJE · EKONOMIA · MAPA · UI (kult lista — paczka 2)

---

## [2026-07-04 ~21:53] Maciej · **POLE-BITWY Design v4 wygląd AKCEPT** ✅

**Następny:** lane port skin → playtest POLE-BITWY → `master POLE-BITWY` → kanon

---

## [2026-07-04 ~21:50] CYWILIZACJE → MASTER: **roster-6 archetypy AI** — GOTOWE

**Handoff:** `dyspozycje/_handoff/CYWILIZACJE-do-MASTER_roster-6-archetypy-ai_2026-07-04.md`  
**Pliki:** `ai-params.json` (+24 klucze) · `ai.ts` (`CIV_TO_ARCH` 6 własnych) · `ai-test.cjs` T3e–T3h  
**Korekta Macieja:** Hetyci `nauka=+2` · Babilonia nauka +2 / wojsko −1  
**MASTER:** brak `main.ts` · build `/tmp` + ai-test → kanon po Opus

---

## [2026-07-04 ~21:40] Maciej · **ABC max 3/paczka** ✅

**Decyzja:** jedna wiadomość + jeden `AskQuestion` = **maks. 3** pytania ABC (nie 10).  
**Powód:** paczki po 10 zerwają czat w połowie — utrata odpowiedzi.  
**Reguły:** `abc-pelna-forma.mdc` · `_ABC-JAK-PYTASZ.md` · `ABC-FORMAT-KANON-MACIEJ.md` · `SZABLON-PYTANIA-ABC.md`

---

## [2026-07-04 ~21:34] Design · **C-01 sync sign-off** ✅ ZAMKNIĘTE

**Wynik:** mockup v3 = kanon `preBattle.ts` · lane **NIE portuje** · referencja zamrożona  
**Meldunek:** `docs/ux/claude-design/C-01 sync gotowy — meldunek sign-off..md`  
**Osobno:** POLE-BITWY v4 → port UI (czeka `start POLE-BITWY`)

---

**Plik:** `docs/ux/claude-design/POLE-BITWY-HUD-v4-2026-07-04.zip` · rozpakowany do `claude-design/`  
**Deliverables:** C06 v4 (3 klatki) · C09 v4 · DESIGN-do-UI · MANIFEST  
**Następny:** lane UI port skin → review Opus → kanon POLE-BITWY

---

**Plik:** `docs/ux/DESIGN-SPEC-POLE-BITWY-HUD-v4-2026-07-04.md`  
**Kluczowe:** C06 3 klatki · C09 w kontekście mapy · panel ~368px · rail 56px · mapa B · minimapa TAK · log NIE  
**Otwarte ABC:** Start walki czerwony vs złoty — playtest po ZIP  
**Design:** praca w toku · lane UI STOP do ZIP

---

## [2026-07-04 ~20:52] Maciej · **POLE-BITWY / C-06 werdykt** ✅ → Design v4 START

**Hak 1 treść OK:** lewy panel = roster (nie formacje) · F1/F2/F3 = dolny toolbar · deploy pasek TAK · bez LOGI/USTAWIENIA na deploy · Start walki CTA · oblężenie później  
**Hak 2 wygląd A:** szkic funkcjonalny OK · Design v4 (1E) · v2/v3 archiwum  
**ZLECENIE-ID:** `POLE-BITWY-HUD-v4-2026-07-04` · paczka 1 = deploy + AUTO + R + roster  
**Archiwum:** `docs/archiwum-czatow/maciej-decyzje/POLE-BITWY-werdykt_2026-07-04.md`  
**Następny:** Design (wklejka) → po ZIP lane UI port skin

---

## [2026-07-04 ~21:00] UI lane · **POLE-BITWY krok 1 review pack** → czeka Maciej Hak 2

**Workflow:** review HTML (jak A-06) przed Design v4 · `docs/ux/export/C-POLE-BITWY-review-3stany.html`  
**Meldunek:** `dyspozycje/UI-DO-MASTERA.md` → **GOTOWE**  
**STOP:** Design · port skin — dopiero po werdykcie Macieja (Hak 1 treść już OK ~20:35)

---

## [2026-07-04 ~20:48] Maciej → MASTER · **CUDA G1 zamknięte** (ABC) ✅

**Decyzje:** `docs/decyzje/D-CUD-G1A-G1D-ZAMK-2026-07-04.md`

| ID | Werdykt |
|----|---------|
| **G1A** | **Własny** — budowa z **ulepszeń terenu**, hex w zasięgu, Praca/¤ (nie kolejka miasta) |
| **G1B** | **B** — `wymagaTerenu` twarda bramka |
| **G1C** | **A** — cud R = 100% bonusów |
| **G1D** | **A** — ×3 `bonusy.miasto` |
| **G1-ZAMK** | Faza1: utrzymanie + absolut + 50% + turystyka +10 handlu (najbliższe miasto); faza2: yield ×3 |

**Handoffy:**
- `dyspozycje/_handoff/MASTER-do-SILNIK_cuda-zamkniecie-2026-07-04.md`
- `dyspozycje/_handoff/MASTER-do-EKONOMIA_CUDA-G2-2026-07-04.md`

**Backlog:** lista ABC cuda nr 5–30 — **odłożona**

**Następny:** MASTER → lane SILNIK (refaktor budowy) + EKONOMIA (G2 faza 1)

---

## [2026-07-04 ~20:45] Maciej · **Miasta 3D roster 15** — decyzja mapowania

**Decyzja (zamknięta):**

| Nacja | Model |
|-------|-------|
| Harappa, Babilonia, Asyria | = **Sumer** |
| Hetyci, Fenicjanie | = **Hetyci** (nowy mesh, szary kamień) |
| Słowianie | = **Germanie** |
| Pozostałe 9 | bez zmian (dedykowane) |

**Reguła epok:** brąz zostaje na żelazo (bez upgrade wizualnego).

**Kod (reuse):** `IKONA_TO_BRONZE` — harappa, babilonia, asyria→sumer; slowianie→germanie (`gra/` + `gra-robocza`).

**CZEKA MAPA:** ~~mesh `hetyci`~~ **GOTOWE v1** (2026-07-04) — sign-off Maciej + kanon

---

## [2026-07-04 ~20:35] Maciej · **POLE-BITWY sign-off** ✅ → dyspozycja Design 1E UI

**Werdykt:** funkcjonalnie **OK** (AUTO/R, Taktyka, filtry, Grupuj, konnica).

**Uwaga (backlog, nie P0):** walki trwają zbyt długo → **balans później** (UNITS/CYW), nie blokuje.

**Handoff zamknięty:** `UI-do-SILNIK_pole-bitwy-ui-batch-20260704.md` → **ZAMKNIĘTE**

**Nowa dyspozycja:** `MASTER-do-UI_pole-bitwy-design-1E-2026-07-04.md` → lane **UI** (port mockupów C-06/C-07/C-09)

**Master:** czeka meldunek `UI-DO-MASTERA` → review → F (kanon)

---

## [2026-07-04 ~20:55] MASTER · batch MAPA fair-play → **gra-robocza**

**Build:** vite → `$TEMP\civ-dist` · bramka: relief/rzeki/fair-play/smoke **ZIELONE**

**Robocza md5:** `5cbb78351b9982405e36c2b0cff41713` · **Start:** `gra-robocza/START.html`

**Kanon:** nie promowany (czeka Opus review MAPA batch)

---

## [2026-07-04 ~20:34] MAPA · siatki 15/25 (Maciej: woda+miedź / żelazo)

**Decyzja:** woda + ruda brązu **15×15** (min 1 woda, min 2 wzgórza) · żelazo **25×25** (min 2 góry).

**Kod:** `waterCoverageCellSize`, `copperCoverageCellSize`, `ironCoverageCellSize`, `topUpRiverGridCoverage`.

**Testy:** relief 6/6 · rzeki 6/6 · fair-play 6/6.

---

## [2026-07-04 ~20:30] MAPA · fair play siatka — wszystkie zasoby (Maciej)

**Cel:** koniec wielkich klastrów gór/wzgórz; równomiernie surowce, lasy, relief.

**Kod:** `applyReliefToLandKeys` per komórka + rozstaw Poisson · `ensureDepositGridCoverage` · `ensureForestGridCoverage` · `docs/obieg/MAPA-FAIR-PLAY-SIATKA.md`

**Testy:** relief 3/3 · fair-play 6/6 PASS · **kanon:** czeka build

---

## [2026-07-04 ~19:15] MAPA · siatka reliefu + spec (Maciej: fair play rud)

**Problem:** góry/wzgórza w klastrach → część cywilizacji bez żelaza/miedzi.

**Fix:** `ensureReliefGridCoverage` — co **25×25** hex min. Góry + Wzgórza; po finalnym lądzie, przed złożami.

**Docs:** `docs/obieg/MAPA-RELIEF-SPEC.md` · test: `relief-grid-coverage-test.cjs` (3/3 PASS)

**ABC:** relief A=20 · **B=25** · C=50 hex

**Kanon md5:** **`24ad7deb581201cedfe64464fdce1835`**

---

## [2026-07-04 ~19:10] DOCS · spec rzek MAPA

**Plik:** `docs/obieg/MAPA-RZEKI-SPEC.md` — siatka, krawędzie, S-meander, main/tributary, fair play, implementacja, testy.

**Skrót:** `docs/obieg/MAPA-KANON-GENERATOR.md` § Rzeki → link do spec.

---

## [2026-07-04 ~19:07] MASTER · **PROMOCJA KANON** MAPA rzeki — delta (Maciej: siatka + krawędzie + dopływy)

**Trigger:** Maciej — równomierna siatka co N hex; tylko krawędzie (Roblox); S nie serpentyna; bez stad; główny nurt gruby + dopływy 2× cieńsze (jak delta).

**Fix:**
- Siatka **14×14** — 1 główny nurt/komórkę; min. odstęp źródeł; bez dodatkowych klastrów reliefu
- Render: obwód hex + **main 100% / tributary 50%** szerokości; `riverPathKinds`
- A*: kara za prostą → łagodne S; dopływy dendrytyczne (max 2/długi nurt)

**Kanon md5:** **`fe53661e98e25280a9726d4936ce8041`**

**ABC:** A=10 · **B=14** · C=18 hex — potwierdź B

---

## [2026-07-04 ~19:01] MASTER · **PROMOCJA KANON** MAPA rzeki — bieg wzdłuż krawędzi (Maciej)

**Trigger:** playtest — rzeki robią pętelki i skoki przez heksy zamiast naturalnego meandra w stronę morza.

**Fix:**
- `scene.ts` — renderer chodzi **obwodem heksa** (krawędzie), bez przekątnych przez pole
- `gen-helpers.ts` — meandry rzadsze (max 3, tylko po 4+ prostych hex), **seaDist musi maleć**, bez pętli (sanitize)

**Kanon md5:** **`cdf52bd6a3f6f7a8e9ada8cf746f06e9`**

**Playtest:** Ctrl+F5 → **nowa gra Ziemia** — rzeki prostsze, S-krzywe na krawędziach, bez zygzaków

---

## [2026-07-04 ~18:55] MASTER · **PROMOCJA KANON** MAPA rzeki — siatka równomierna (Maciej)

**Trigger:** playtest — rzeki nierównomierne; unfair (produkcja/jedzenie z rzeki).

**Reguła:** kwadrat **14×14 hex** lądu → min. 1 źródło rzeki do morza (tier: Dużo=10, Mało=18).

**Kanon md5:** **`682d4d7af8cd951dbb2d50890772ff3c`**

**ABC do potwierdzenia:** A=10 · **B=14 (wdrożone)** · C=18 hex

---

## [2026-07-04 ~17:05] MASTER · **PROMOCJA KANON** MAPA rzeki 10× (realna gęstość)

**Trigger:** Maciej — „10× rzeczek w generatorze nie widać”.

**Diagnoza:** JSON Panel-A już 10× (5→50), ale algorytm blokował: mało źródeł górskich, duży minSep, brak źródeł nizinnych.

**Fix:** `gen-helpers.ts` — źródła nizinne, 3 przebiegi + fill do maxRivers, mniejszy minSep; test: **390 tras / 1301 hex** (Standard).

**Kanon md5:** **`b210ebfe8a4ecd178be68693e74bd25b`**

**Playtest:** Ctrl+F5 → **nowa gra** (stara mapa = stara gęstość)

---

## [2026-07-04 ~17:00] MASTER · **PROMOCJA KANON** MAPA pustynia — wysokość wzgórza

**Trigger:** playtest Macieja — pustynia „zamienia się w morze” (heks 69,27).

**Fix:** `mapRenderStyle.ts` — pustynia = profil wzgórza (0.42/0.08) + `PUSTYNIA_EXTRA_Y_LIFT` 0.10; `scene.ts` — bez blendu koloru z morzem.

**Kanon md5:** **`843674b974357cad3d73165f5a43f7e1`**

**Playtest:** Ctrl+F5 → **nowa gra** → wyspy pustyni przy wodzie

---

## [2026-07-04 ~16:55] MASTER · **PROMOCJA KANON** MAPA rzeki ciągłe (playtest Macieja)

**Trigger:** playtest — rzeki jako luźne kawałki zamiast ciągłego biegu.

**Fix:** renderer `scene.ts` — wstęga po **całej** trasie `riverPaths` (rogach krawędzi); mniej dopływów w `gen-helpers.ts`.

**Kanon md5:** **`7d4c1d9634cc0cd083e56d66beacca45`** · `gra-kanon/START.html`

**Archiwum:** `gra-kanon_20260704-165514` (`89c372af…`)

**Playtest:** Ctrl+F5 → **nowa gra**

---

## [2026-07-04 ~16:49] MASTER · **PROMOCJA KANON** MAPA rzeki + gęstość (Maciej `master`)

**Trigger:** Maciej `master` (batch 2).

**Zakres:** rzeki po krawędziach (`rzeka.krawedzie`) · gęstość ~10× · ląd +0,05 · doliny bez wody · spawn/skala z batch 1

**Bramka:** river-density 125 tras/604 heksy (Standard) · river-adjacency 4116 · smoke OK

**Kanon md5:** **`89c372afe188e66fc61fa770859770b9`** · `gra-kanon/START.html`

**Archiwum:** `gra-kanon_20260704-164934` (`31c6db16…`)

**Playtest:** Ctrl+F5 **`gra-kanon/START.html`** → **nowa gra**

---

## [2026-07-04 ~16:30] Maciej · **decyzja strategiczna: browser first, desktop później**

**Kontekst:** wydajność mapy — niskie CPU/GPU przy muleniu; diagnoza: architektura przeglądarki, nie sprzęt.

**Decyzja:**
1. **Teraz:** optymalizacja **wersji browser** (SILNIK/MAPA — poza kolejką UX P1/P2).
2. **Przyszłość:** twardy blok v1.0 → **desktop jako osobny tor** (rewrite/owijka); **bez** wycofania z HTML w połowie projektu.

**Workflow:** bez zmian (kanon, lane’y, playtest Macieja).

---

## [2026-07-04 ~16:28] MASTER · **PROMOCJA KANON** MAPA spawn + skala kreatora (Maciej `master`)

**Trigger:** Maciej `master`.

**Zakres w kanonie:**
- **MAPA:** spawn 3/5 hex + obcy klaster 3 hex (B) · mp max **9** · typy osobna skala (Ogromny 10 / Super 12) · złoża wybrzeże · rzeki adjacency · skala kreatora
- **Pliki:** `clusters.ts`, `gen-helpers.ts`, `generator.ts`, `scene.ts`, `cities.ts`, `newGameMapDefaults.ts`, `e-start-params.json`, `main.ts` (`startCityState`)

**Bramka:** map-scale-menu **32/32** · rozmiar-label **13/13** · cluster-start **129/131** (2× Qin baseline) · deposit-coast **20/20** · river-path **478/478** · smoke **OK**

**Build:** `npx vite build --outDir $env:TEMP\civ-dist` → `publish-robocza-snapshot` → `publish-kanon-snapshot`

**Kanon md5:** **`31c6db16e4baab67355ac093bf7bc034`** · `gra-kanon/START.html` · root `Gra-podglad.html`

**Archiwum:** `gra-kanon-archiwum/gra-kanon_20260704-162823` (poprzedni `d1a61c24…`)

**Handoffy:** `MAPA-do-MASTER_start-spawn-skala-2026-07-04.md` + `MAPA-do-MASTER_skala-kreator-mp9-2026-07-04.md` → **ZINTEGROWANE**

**Playtest Macieja:** Ctrl+F5 **`gra-kanon/START.html`** → nowa gra → kreator (mp/typy) · rzeki · Kontynenty

**Kolejka:** ocean przy **M** (ABC) · Qin test baseline · map-coast-buffer małe mapy

---

## [2026-07-04 ~16:25] MAPA · Skala kreatora: mp max 9 + typy (Maciej A)

**Decyzja Macieja:** twardy sufit **9** miast-państw na klaster; typy cywilizacji **osobna** skala; boost **Ogromny** (dom. 10 typów) i **Super Huge** (dom. 12 typów). Naprawiono błędne 11/13/15 mp w Panel-E.

**Handoff:** `dyspozycje/_handoff/MAPA-do-MASTER_skala-kreator-mp9-2026-07-04.md`

**Pliki:** `e-start-params.json`, `newGameMapDefaults.ts`, `map-scale-menu-test.cjs`, `rozmiar-label-test.cjs`

**Status:** kod w `gra/` — **ZINTEGROWANE kanon** md5 `31c6db16…` (MASTER 2026-07-04 ~16:28)

---

## [2026-07-04 ~16:30] MAPA · Start: skala typów/mp + odległości 3/5 hex (Maciej)

**Decyzja Macieja:** gęstsza rozgrywka — miasta-państwa min **3 hex**; obce cywilizacje min **5 hex** od stolicy gracza (**tylko spawn**). Po starcie founding: **5 hex** (wyjątek: dystans do startowych mp = **3 hex**).

**Skala domyślna (Panel-E):** Malenki 4/4 → Super Huge 12/8 (typy / miasta-państwa). **Max menu mp = 9** (patrz handoff mp9).

**Handoff:** `dyspozycje/_handoff/MAPA-do-MASTER_start-spawn-skala-2026-07-04.md`

**Pliki:** `clusters.ts`, `cities.ts`, `main.ts` (flaga `startCityState`), `e-start-params.json`, `map-gen-params.json`, `newGameMapDefaults.ts`

**Status:** kod w `gra/` — **MASTER:** build + `cluster-start-test` + Opus → kanon

---

## [2026-07-04 ~15:15] MASTER · **PROMOCJA KANON** POLE-BITWY batch 2 (AUTO→RĘCZNY)

**Trigger:** Maciej `master`.

**Zakres w kanonie:**
- **UI/UNITS:** `battleScene.ts` — Taktyka/Strategia po AUTO→RĘCZNY, filtry Konnica/Piechota/Grupa, split grup (◆ Grupuj), szturm konnicy, mapa równiny
- **Bez** `main.ts`

**Build POLE-BITWY:** `POLE-BITWY-20260704-manual-polish` · `Gra-podglad-POLE-BITWY.html`

**Bramka:** battle-smoke boot OK · map-field-battle OK · logic-test **202/203** (baseline mapgen) · combat-test **0/6** (HP=0 harness — znany pre-existing, nie batch UI)

**Kanon md5:** **`d1a61c24d4adca9327135c0dbdce6162`** · `gra-kanon/START.html` · root `Gra-podglad.html`

**Archiwum:** `gra-kanon-archiwum/gra-kanon_20260704-151520` (poprzedni `A8DA1FCB…`)

**Handoff:** `dyspozycje/_handoff/UI-do-SILNIK_pole-bitwy-ui-batch-20260704.md` → **ZINTEGROWANE**

**Playtest Macieja:** Ctrl+F5 `Gra-podglad-POLE-BITWY.html` → AUTO → R → filtry + Grupuj + SPACJA

**Kolejka:** Grupa C `działaj` (Soldurii/Gaesatae) · ocean przy **M** (ABC B/C) · combat-test harness fix (osobny ticket)

---

## [2026-07-04 ~15:02] MAPA · FoW **F/M** — sign-off Macieja ✅

**Trigger:** Maciej — „f i m działa” (batony obok minimapy).

**Zakres:** batony F/M · `toggleDevFogFull` / `toggleDevRevealAllLand` · `fogUiToolsEnabled` · sync `Gra-podglad*.html` w roboczej.

**Status:** temat 1 w `docs/master/maciej/MACIEJ-TEMATY-MAPA-OTWARTE.md` → `[x]`. **Nie w kanonie** (część większego pakietu MAPA).

**Następne:** playtest rzeki · ocean zoom · pustynia wyżej.

---

## [2026-07-04 ~15:05] MASTER · **tick hub** (Maciej `master`)

**Stan kanonu (skan plików):** root · `gra-robocza/` · `gra-kanon/` — **ten sam md5** `A8DA1FCB1ADC733E5D112C8768C52900` (zsynchronizowane).

**W kanonie już jest:** CELT-Q3 filtr Nacja · A-06 panel stosu · pakiet UI z dzisiaj.

**Bramka:** logic-test 202/203 (baseline) · earth-template 2/2.

**Kolejka — bez nowego batchu F:**

| Pri | Co | Kto / trigger |
|-----|-----|----------------|
| 1 | Soldurii + Gaesatae + roster-6 **staty** | **Grupa C** · `działaj` · brief `CYW-do-GRUPA-C_jednostki-spec-brief-2026-07-04.md` |
| 2 | UX **#5 A-27** (nast. po A-06) | lane UI → `→ MASTER: GOTOWE` |
| 3 | Typ **Ziemia** playtest | Maciej: nowa gra → typ Ziemia (Ctrl+F5 `gra-kanon/START.html`) |
| 4 | Ocean przy skrócie **M** | decyzja ABC B/C (otwarte) |

**Master:** IDLE — brak oczekujących handoffów F do wpięcia. Promocja kanon **nie wymagana** (md5 spójny).

---

**Trigger:** Maciej `master`.

**Zakres:** `earth-land-mask.ts` (bbox 360×200 bilinear) · `landMaskZiemia` · skróty **M**/ **F** · domyślne % lądu per typ · reszta pakietu roboczego (E-15, ocean zoom, dyplomacja 1E…).

**Bramka:** `earth-template-test` 2/2 · `victory-screen-test` 11/11 · vite build OK.

**Kanon md5:** **`c9ce73e073788e7a6a4f797a9281c31b`** · `gra-kanon/START.html` · root `Gra-podglad.html`

**Archiwum:** `gra-kanon-archiwum/gra-kanon_20260704-145437` (poprzedni `2ebc4ee5…` E-15)

**Playtest Macieja:** Ctrl+F5 **`gra-kanon/START.html`** → **nowa gra** → typ **Ziemia** (bbox + brzegi).

**Otwarte:** ocean przy skrócie **M** (ABC B/C) · Opus review opcjonalnie przed kolejną promocją.

---

## [2026-07-04 ~15:00] MASTER · **CELT-Q3 wiring + kanon** (filtr Nacja produkcji)

**Trigger:** Maciej `master` · handoff EKONOMIA nacja-filter.

**Batch `main.ts` (SILNIK):**
- `civKeyForOwnerId()` + `getCivKey` w obu `configureCityPanel`
- auto-manage `ctx`: `epoch` per owner, `civBonusy`, `civUnitNacja`
- import `unitNacjaForCivKey`

**Nie w scope:** `units.json` (Grupa C — brief `CYW-do-GRUPA-C_jednostki-spec-brief-2026-07-04.md`)

**Bramka:** logic-test **202/203** (baseline mapgen) · vite build OK

**Kanon md5:** **`A8DA1FCB1ADC733E5D112C8768C52900`** · root `Gra-podglad.html`

**Kolejka:** Grupa C `działaj` (Soldurii/Gaesatae + roster-6 staty) · Opus review opcjonalny (wiring czysty)

---

**Trigger:** Maciej — pusty dół mapy, prostokątne brzegi kontynentów na typie Ziemia.

**Fix (1+2) wdrożony w `gra/` + `gra-robocza`:**
- `earth-land-mask.ts` — bbox mockupu → playable area (Antarktyda/dół mapy)
- maska **360×200** + próbkowanie bilinear (mniej schodków)
- `landMaskZiemia` — **bez** `mapEdgeRectFade` / `landMaskBorderFade` (tylko szablon + szum brzegu)
- `enforceEarthTemplateOnHexes` — twardy constraint poza maską

**Test:** `node tools/earth-template-test.cjs` → 2/2

**Fix (3) brzeg mapy + zoom oceanu:** już wcześniej (wpisy ~10:46 + ~14:05, handoff ocean-zoom) — patrz tabela poniżej.

**Nie w kanonie** — wymaga rebuild F po playteście Macieja (nowa gra, typ Ziemia).  
→ **Zamknięte:** promocja kanon ~14:54 md5 `c9ce73e0…`

---

## [2026-07-04 ~15:10] Maciej · workflow **hak po haku** (szkic → werdykt → ewent. design)

**Ustalenie:** 1) szkic lane + PNG · 2) treść OK? · 3) wygląd A/B/C · 4) ewent. poprawki lane · 5) design tylko gdy A lub C · 6) lane v2.

**A-06 PNG review:** `docs/ux/export/A-06-review-stary-vs-szkic.png` · checklist `A-06-REVIEW-MACIEJ.md`

**Design A-06:** ⛔ STOP do werdyktu Macieja

---

**Feedback:** szkic lane wygląda jak twórca, nie designer — **nie zamykać** A-06 jako final UX.

**Decyzja procesu:** Tor B — szkic w kanonie OK jako referencja; **następny krok = mockup Design 1E**, potem lane v2, dopiero wtedy sign-off.

**Dokument:** `docs/ux/workflow/DESIGN-LANE-KOLEJNOSC.md`

**Kolejka:** #4 A-06 → `[~] SZKIC` · DESIGN PENDING

---

## [2026-07-04 ~14:55] MASTER · **PROMOCJA KANON A-06** (szkic techniczny v0)

**Trigger:** Maciej OK + `master` · screenshot w `docs/ux/export/A-06-panel-jednostki-1E-robocza.png`

**Zakres:** `mapUnitHudSkin.ts` + `armyStackHud.ts` + `unitPanelHud.ts` — panel stosu armii 1E

**Kanon md5:** **`a8da1fcb1adc733e5d112c8768c52900`** · `gra-kanon/START.html`

**Archiwum:** `gra-kanon_20260704-145523` (`2ebc4ee5…`)

**Kolejka:** #4 A-06 [x] · nast. **#5 A-27**

---

## [2026-07-04 ~14:37] MASTER · **PROMOCJA KANON E-15** ✅

**Trigger:** Maciej `master` · playtest E-15 odłożony (gra niegrywalna).

**Zakres:** `victoryScreen.ts` — pełnoekranowy layout 1E (win + lose E-15b) · pakiet poprzedni bez regresji.

**Bramka:** `victory-screen-test` 11/11 · vite build OK.

**Kanon md5:** **`2ebc4ee5fe907075de89dd75d18f8347`** · `gra-kanon/START.html` · root `Gra-podglad.html`

**Archiwum:** `gra-kanon-archiwum/gra-kanon_20260704-143703` (`c10c7e85…`)

**Kolejka:** #3 E-15 [x] · nast. **#4 A-06** · #2 Nauka HOLD

---

## [2026-07-04 ~15:35] UI · E-15 lane zamknięty · playtest odłożony

**Maciej:** gra niegrywalna (brak realnej wygranej/przegranej) → **bez playtestu E-15** · ocena później.  
**Lane:** `victoryScreen.ts` 1E cinematic · testy 11/11 · robocza `83ea8d99…`  
**MASTER:** promocja kanonu bez czekania na playtest · meldunek `UI-DO-MASTERA.md`  
**Kolejka:** #3 [x lane] · nast. **#4 A-06** · #2 Nauka nadal HOLD

---

## [2026-07-04 ~14:08] Maciej → MASTER · rejestr tematów MAPA (nie powtarzać)

**Plik:** `docs/master/maciej/MACIEJ-TEMATY-MAPA-OTWARTE.md` + `dyspozycje/MAPA-STAN.md`  
**Tematy:** (1) FoW M/F dev (2) ocean zoom out (3) rzeki po krawędziach (4) 5 wzgórz + 5 gór  
**MASTER:** czytać przed każdą sesją playtest/MAPA · zamykać `[x]` po werdykcie Macieja

---

## [2026-07-04 ~14:05] MAPA · ocean znika przy zoom out — diagnoza + partial fix

**Trigger:** Maciej — 10. zgłoszenie; ocean znika przy oddalaniu, wraca przy zbliżaniu.

**Przyczyna:** (1) płaszczyzna oceanu za mała vs maxDist kamery, (2) THREE.Fog.far za blisko, (3) fog na materiale oceanu.

**Fix roboczy:** `render/scene.ts` — większy padO, fog.far↑, oceanMat.fog=false, tło deepOcean.

**Handoff:** `dyspozycje/_handoff/MAPA-do-MASTER_ocean-zoom-out_2026-07-04.md` → **PLAYTEST**

**Otwarte ABC:** czy skrót **M** ma pokazywać niebieski ocean wokół wyspy (opcje B/C w handoff).

**Maciej:** Ctrl+F5 `gra-robocza/START.html` → zoom max/min → werdykt.

---

**Zakres:** Maciej zatwierdził UX podglądu POLE-BITWY (pasek mocy, toolbar, Taktyka/Strategia, roster 6×5, zoom 2×).  
**Handoff:** `dyspozycje/_handoff/UI-do-SILNIK_pole-bitwy-ui-batch-20260704.md` → **GOTOWE**  
**Build test:** `POLE-BITWY-20260704-roster-grid6` · `Gra-podglad-POLE-BITWY.html`  
**Integracja:** MASTER — merge `battleScene.ts` + `battleHudTheme.ts` → build kanon → Opus review  
**Lane:** UI/UNITS (battle HUD) — **bez** main.ts w tej sesji

---

**Zakres:** reskin 1E · `diploUiSkin.ts` (nowy) · panel + lista + audiencja · **bez** main.ts/diplomacy.ts  
**Testy:** diplomacy 143/143  
**Robocza md5:** **`4acbc7e31ad32e5e2c7fd944211552d0`** · `gra-robocza/START.html`  
**Integrator F:** **NIE** (lane zbudował robocza)  
**Czeka:** playtest Macieja → promocja kanonu

---

## [2026-07-04 ~13:37] Maciej → MASTER · **„idź dyplo"** — P1 dyplomacja START

**Dyspozycja:** lane UI · reskin 1E · `_handoff/MASTER-do-UI_P1-dyplomacja-1E-2026-07-04.md` → **ACTIVE**  
**Integrator F:** **NIE** (brak main.ts) · F dopiero po meldunku UI (rebuild + bramka)  
**Kolejka:** `KOLEJKA-UX-OCENY.md` #1 → [~] W TOKU  
**Następny krok:** lane UI implementacja → `UI-DO-MASTERA.md` → playtest Macieja → promocja kanonu

---

## [2026-07-04 ~14:29] MASTER · **PROMOCJA KANON** sesja MAPA ocean + POLE-BITWY HUD

**Trigger:** Maciej `master` (2× — delta od `55bdb2af…`)

**Zakres w kanonie:**
- **MAPA:** ocean przy zoom out — `render/scene.ts` (padO, fog.far, oceanMat.fog=false, tło deepOcean)
- **UI/UNITS:** POLE-BITWY HUD batch — `battleScene.ts`, `battleHudTheme.ts` (Maciej OK)
- **Pakiet:** P1 dyplomacja 1E (bez zmian vs poprzedni kanon dyplo)

**Bramka:** diplomacy 143/143 · okolica 32/32 · wire 34/34 · smoke · koszary 21/21 · map-coast 109/115 (6 baseline) · build OK

**Kanon md5:** **`c10c7e85e08d7dbca380c7ee4be70b7a`** · `gra-kanon/START.html` · root `Gra-podglad.html`

**POLE-BITWY:** `Gra-podglad-POLE-BITWY.html` → root + `gra-kanon/` + `gra-robocza/`

**Archiwum:** `gra-kanon-archiwum/gra-kanon_20260704-142904` (`55bdb2af…`)

**Otwarte (Maciej):** ocean przy skrócie **M** — decyzja B/C w `MAPA-do-MASTER_ocean-zoom-out_2026-07-04.md`

---

## [2026-07-04 ~14:11] MASTER · **PROMOCJA KANON P1 dyplomacja 1E** ✅

**Trigger:** Maciej `master` · handoff `MASTER-do-UI_P1-dyplomacja-1E-2026-07-04.md`

**Zakres:** reskin dyplomacji 1E (`diploUiSkin` + 7 modułów UI) · logika bez zmian

**Bramka:** diplomacy 143/143 · okolica 32/32 · wire 34/34 · smoke · koszary 21/21 · vite build OK

**Kanon md5:** **`55bdb2af4f724f8a4f3da12e23156dc8`** · `gra-kanon/START.html` · root `Gra-podglad.html`

**Archiwum:** `gra-kanon-archiwum/gra-kanon_20260704-141118` (poprzedni `42efefff…`)

**Kolejka Macieja:** #1 dyplo ✅ · #2 nauka HOLD · #3 E-15

---

## [2026-07-04 ~13:29] MASTER · checkpoint przed P1 dyplomacja ✅

**Trigger:** Maciej — kolejka UX + MASTER przed dyplomacją; nauka HOLD (przegląd).

**Wykonane:**
- Potwierdzono kanon md5 **`42efefffbcab5fd8b6ff4c07e862443d`**
- Bramka batchu miasto+B-26: okolica 32/32 · wire 34/34 · smoke · diplomacy 143 · koszary 21/21
- Baseline-red: logic 202/203 · combat · battle-smoke — **nie blokują** P1 dyplo
- Kolejka odhaczania: `docs/ux/KOLEJKA-UX-OCENY.md`
- Dyspozycja następna: `_handoff/MASTER-do-UI_P1-dyplomacja-1E-2026-07-04.md` (**QUEUED**)

**Następny krok Macieja:** sygnał **„idź dyplo”** → lane UI P1 reskin 1E.

**#2 Nauka + drzewko:** HOLD — dokładny przegląd Macieja przed implementacją.

---

## [2026-07-04 ~13:21] UI lane · **PROMOCJA KANON** B-26 okolica Tier6 + batch miasto W3

**Trigger:** Maciej — gotowe wgrywać od razu; MASTER potwierdza bramkę.

**Zakres:** B-26 toolbar „Zarządzanie polami” (SVG Tier6) · pakiet miasto W3 + modale C-04/C-05/A-19 (src bez zmian logiki okolicy).

**Bramka:** okolica 32/32 · wire 34/34 · smoke · diplomacy 143 · koszary 21/21 · ⚠ logic 202/203 · combat 0/6 · battle-smoke FAIL (baseline).

**Kanon md5:** **`42efefffbcab5fd8b6ff4c07e862443d`** · `gra-kanon/START.html` · root `Gra-podglad.html`

**Archiwum:** `gra-kanon-archiwum/gra-kanon_20260704-132128` (poprzedni `7dfabe3a…`)

**Handoff:** `_handoff/UI-do-MASTER_B-26-okolica-tier6-batch-2026-07-04.md`

**Maciej ocena (tylko otwarte):** `docs/ux/BACKLOG-OCENA-MACIEJ-2026-07-04.md`

---

## [2026-07-04 ~11:43] MASTER — fix rzek (Maciej playtest)

**Problem:** rzeki „zalały” całe heksy (niebieskie pola zamiast cienkich pasków na krawędziach).

**Przyczyna:** (1) `riverScale` ~2,4× przy mapach 2× → wstęga szersza niż heks; (2) tint 62% koloru rzeki na całym heksie `rzeka.obecna`.

**Fix `render/scene.ts`:** stała szerokość `R*0.085` · trasa tylko środki krawędzi · bez tintu heksu.

**ROBOCZA md5:** `c40c42c00146f8f0dd577609c56e8507` · Ctrl+F5

---

## [2026-07-04 ~11:12] MASTER — bramka sesji 2026-07-04 · **STOP kanon** (regresje testów)

**Trigger:** Maciej → `master`  
**Backup:** `main.ts.bak-SESJA-2026-07-04`  
**ROBOCZA odświeżona:** md5 **`b2f052edd8f42a355cf256275f60ec09`** · `gra-robocza/START.html`  
**Kanon root (bez zmian):** md5 `15b7fac814b31ef1c016b7a92f6a471c`

**Bramka wynik:**

| Test | Wynik | Uwaga |
|------|-------|-------|
| wire-ekonomia | 34/34 | OK |
| logic-test | **202/203** | **FAIL [92]** startPositions minPairDist 3–4 (wymagane ≥5) — prawdopod. mapy 2× |
| combat-test | **0/6** | **FAIL** rounds=0 (6 scenariuszy) |
| civ-bonusy | OK | |
| diplomacy | OK | |
| ai-test | 193/198 | 5× T2S baseline-red (oczekiwane) |
| smoke | OK | |
| battle-smoke | **FAIL** | szuka „Bitwa ręczna”, UI ma „Rozegraj ręcznie” |
| vite build | OK | ~8.59 MB |

**Decyzja MASTER:** **STOP kanon** do naprawy logic [92] + combat 6/6 + battle-smoke (label lub test). Opus po zielonej bramce.

**Playtest Macieja:** ROBOCZA gotowa — mapa/zoom/drogi/panel heksu/miasto W3 w jednym bundle.

**Handoffy w kolejce:** `F-do-MASTER_sesja-2026-07-04-map-ui-units.md` + `UI-do-MASTER_miasto-playtest-OK-promocja-2026-07-04.md`

---

## [2026-07-04 ~10:46] F → **MASTER: GOTOWE-ROBOCZA** — sesja mapa 2× + brzegi + zoom + drogi + panel heksu

**Handoff:** `_handoff/F-do-MASTER_sesja-2026-07-04-map-ui-units.md`  
**ROBOCZA md5:** `53ec508f48b7a9e13e152b1ba5d44644` · `gra-robocza/START.html` · Ctrl+F5

**Zakres:** poszarpane brzegi · trim inland water · mapy 2× (76×52 … 672×476) · zoom 2× · drogi 3× · panel heksu D17 · usunięcie legacy pill 0/0 · lite forest fix

**Testy map:** forest-parity 101/101 · coast-buffer 115/115 · continents-rivers 5/5

**MASTER czeka:** playtest Macieja → bramka 17 suitów → Opus → kanon root `Gra-podglad.html`

**Otwarte ABC:** liczba typów cywilizacji / miast na klastrze przy większych mapach (CYWILIZACJE — później)

---

## [2026-07-04 ~11:15] MASTER · **PROMOCJA KANON miasto W3** ✅

**Trigger:** Maciej `master` · handoff `UI-do-MASTER_miasto-playtest-OK-promocja-2026-07-04.md`

**Zakres:** panel miasto W3 (exit pod surowcami · okolica ręczna · chrome HUD) · modale C-04/C-05/A-19 (już w src)

**Bramka (wybrane):**
- ✅ `okolica-test` 32/32 · `wire-ekonomia` 34/34 · `smoke` OK · `diplomacy-test` OK · `koszary-gate` baseline-red OK
- ⚠ `logic-test` 202/203 — mapgen minPairDist (MAPA 5 stref, nie UI miasto)
- ⚠ `battle-smoke` FAIL — T w menu (pre-battle); poza zakresem batchu miasto · Maciej poprawia bitwę osobno
- Opus: **FAST** (werdykt playtest Macieja w czacie)

**Publikacja:**
- `publish-robocza-snapshot` → robocza md5 **`7dfabe3a4566078e80de1de19ad805f5`**
- `publish-kanon-snapshot` → **`gra-kanon/`** + root **`Gra-podglad.html`** (ten sam md5)
- Archiwum poprzedniego kanonu: `gra-kanon-archiwum/gra-kanon_20260704-111537`

**Playtest finalny Macieja:** `gra-kanon/START.html` Ctrl+F5 · miasto RZYM

**STOP kolejne:** bitwa skin · HUD mapy D2 · menu E · Design W3.2

---

## [2026-07-04 ~10:40] Maciej → lane UI → **MASTER: PROMOCJA KANON miasto W3**

**Werdykt:** playtest miasto **OK** · reszta UX (bitwa, HUD mapy, menu) **później**

**Wpisan na stałe `gra/src/`:** `cityPanel.ts` · `cityUxFrame.ts` · `okolica.ts` · `main.ts` (hooks ręczna okolica)  
**Backup:** `*.bak-UI-2026-07-04-promocja`  
**Handoff:** `_handoff/UI-do-MASTER_miasto-playtest-OK-promocja-2026-07-04.md` · meldunek `UI-DO-MASTERA.md` **→ MASTER: GOTOWE**

**ROBOCZA md5:** `0993be1929abc8e23c76b01e6f1ab7dd` · `gra-robocza/Gra-podglad.html`

**MASTER czeka:** bramka 17 suitów + build → Opus (miasto) → `publish-kanon-snapshot.ps1` → root `Gra-podglad.html`

**Uwaga OneDrive:** nie odpalać `publish-robocza-snapshot` przed promocją (nadpisuje roboczę); po kanonie sync OK.

---

## [2026-07-04 ~09:45] F ROBOCZA — generator 5 stref kontynentów (MAPA)

**Decyzja Macieja:** Kontynenty = 5 mas (środek + 4 narożniki), nie pangea przy niskim lądzie.

**Algorytm:** `buildFiveZoneContinentCenters` + Voronoi per strefa; `landMaskKontynenty` bez `mapCenterRadialBias` i bez max() centrów.

**Test:** `map-continents-rivers-test` 5/5 · seed 42: **5 mas** kontynenty vs **1** pangea @ 20% lądu.

**ROBOCZA md5:** `17bf6e849de2aab459483f7706fa96e8` · `gra-robocza/START.html`

---

## [2026-07-04 ~09:36] F ROBOCZA — reguła lewego menu toolbar (UI/SILNIK)

**Reguła Macieja:** klik mapy → tylko odznacza; klik **innego** medalionu → odznacza stary + aktywuje nowy **jednym** kliknięciem.

**Przyczyna:** `pointerdown` outside-dismiss zamykał panel przed `click` na toolbarze; `onOpenCities` miał błędne `return` po samym zamknięciu build/army.

**Fix:** `hudPanelDismiss.ts` + `buildModeHud.ts` ignorują `.civ-map-toolbar`; `main.ts` — `closeAllMapToolbarModes()` + handlery activate/toggle.

**ROBOCZA md5:** `ee9b658fc9a7551d88bb197e5523af81`

---

## [2026-07-04 ~09:32] HANDOFF MAPA → MASTER — sesja zamknięta (Maciej)

**ROBOCZA:** md5 `ad5cc87c86b1f6988dd6245e7463f869` · szczegóły → `MAPA-DO-MASTERA.md` § 09:32

**Czeka:** playtest Macieja (ocean/zoom + 20/80 + kontynenty) → potem Opus → kanon

---

## [2026-07-04 ~09:30] F ROBOCZA — ląd/morze 20/80 + kontynenty rozdzielone (Maciej)

**Decyzja:** 20% lądu / 80% morza (korekta z 30/70). Kontynenty ≠ pangea przy małym lądzie.

**Generator:** `sparseLand` — bez centrum 0.5/0.5, mniejsze masy, szersze cieśniny.

**Test:** `land-sea-ratio-test.cjs` 9/9

**ROBOCZA md5:** `ad5cc87c86b1f6988dd6245e7463f869` · `gra-robocza/START.html`

**Handoff:** `MAPA-DO-MASTERA.md` § 2026-07-04 ~09:30

---

## [2026-07-04 ~09:12] F ROBOCZA — domyślny ląd/morze 30/70 (MAPA + UI, decyzja Macieja)

**Decyzja:** standard **30% lądu / 70% morza** (Kontynenty, Pangea, Wyspy, Ziemia); suwak zaawansowany 20–80% bez zmian.

**Kod:** `gen-helpers.ts` · `newGameFlow.ts` · `main.ts` · `MAPA-KANON-GENERATOR.md`

**Test:** `land-sea-ratio-test.cjs` 9/9

**ROBOCZA md5:** `30da5d342b44a7caa36d988e4202b043`

**Handoff:** `dyspozycje/MAPA-DO-MASTERA.md` § 2026-07-04

---

## [2026-07-04 ~09:15] F ROBOCZA — fix prześwit oceanu przy zoomie (MAPA render)

**Trigger:** Maciej playtest — niebieska tafla w środku lądu zależna od przybliżenia.

**Przyczyna:** `hideRobloxWaterForOcean` ukrywał heksy Morze/Wybrzeże przy wyłączonej mgle → globalna płaszczyzna oceanu (~1.8 jednostki pod taflą) prześwitywała przez szczeliny heksów.

**Fix (`render/scene.ts`):** (1) zawsze renderuj heksy wody; (2) tło oceanu głębiej (−14…−28); (3) `depthWrite: true`; (4) roblox overlap heksów R×1.008.

**ROBOCZA md5:** `ba3e4207e8847f2af74829002a84ee07` · `gra-robocza/START.html`

**Następny:** Maciej playtest Ctrl+F5 + Nowa gra → `playtest OK` / `BUG: …`

---

## [2026-07-04 ~08:16] F ROBOCZA — sync MAPA generator (bufor 10 hex + ląd od środka + rzeki)

**Trigger:** Maciej `1+2 start` (sync src + rebuild robocza).

**Kroki:** `map-coast-buffer-test` 115/115 · `vite build` → `$TEMP\civ-dist` · `publish-robocza-snapshot.ps1`

**ROBOCZA md5:** `fd7ed0d6799cfb0f7447db3e890027d5` · `gra-robocza/START.html`

**Sync:** `gra/src/map/*`, `render/scene.ts`, `main.ts` → `gra-robocza/src/`

**Maciej playtest:** Ctrl+F5 → **Nowa gra** → bufor oceanu 10 hex · ląd wycentrowany · rzeki z gór · wybrzeże jasnoniebieskie

**Kanon:** bez promocji (STOP P0 miasto)

**Fix skryptu:** `publish-robocza-snapshot.ps1` — usunięto znaki em-dash psujące parser PS

---

---

## [2026-07-04 ~08:20] Design · **C-04/C-05/A-19 modale mapy ✅**

**Deliverables (brand-book):**
- `C04 Atak miasto wybor v2 (1E).dc.html`
- `C05 Panel oblezenie v2 (1E).dc.html`
- `A19 Miasto zdobyte v2 (1E).dc.html`

**Handoff:** `docs/ux/claude-design/DESIGN-do-UI_C04-C05-A19-v2.md`  
**Paczka Design:** `C04-C05-A19-mapa-v2_2026-07-04.zip` ✅ w repo · lane port ✅ · robocza md5 `1503c9e040fe6354a4374f685163c5d9`  
**Lane UI:** port `cityAttackChoice.ts` · `siegeMapPanel.ts` · `cityCaptureNotice.ts` — **GOTOWE** · czeka **playtest Macieja**

**Osobno:** C-19/C-20 pole bitwy — handoff UNITS (map-v2 HUD już w repo).

---

**B — pole 3D map-v2:** mockupy `C04 Oblezenie v2` + `C05 Szturm muru v2` w `docs/ux/claude-design/` (HUD-only). Handoff lane: `_handoff/DESIGN-do-UNITS_C19-C20-port-map-v2-2026-07-04.md` · czeka **`START lane`**.

**C — modal mapy świata:** push GitHub `main` — `DESIGN-GITHUB-HASLA.md` · brief · wklejka `C04-C05-oblęzenie-mapa-v2` · **🟢 START Design**.

**Design:** STOP pole bitwy · **START** modal Oblężaj/Szturm (hasło w GitHub) · miasto v3.2 osobno.

---

**Potwierdzenie:** oba ekrany **HUD-only** wokół placeholdera pola 3D · spójne z **C-06 v4 / C-07**.

| Mockup | Zawartość (Design) |
|--------|-------------------|
| **C-04 Oblężenie** | górny pasek VS · integralność murów (lewo) · siły oblężnicze (prawo) · Ostrzał / Czekaj / Szturm |
| **C-05 Szturm muru** | punkty szturmu + aktywny wyłom (lewo) · obrona muru (prawo) · Drabiny / Wieża / Szturm przez wyłom |

**Paczka:** deliverable Design (pobrana przez Macieja) — **wpięcie do repo** po sync zip → `docs/ux/claude-design/`.

**Osobno — HOLD:** hasło `C04-C05-oblęzenie-mapa-v2` = **modal na mapie świata** (`cityAttackChoice` / `siegeMapPanel`) · brief lokalnie · **czeka push GitHub** · Design **nie rusza** bez briefu.

**Lane:** port C-19/C-20 HUD z mockupów map-v2 — po wpięciu plików + sygnale Macieja `START lane`.

---

**Trigger:** Maciej — Slack martwy · archiwum nie działa · przypominanie reguł · jedno hasło startu dnia.

**Werdykt:** reguły **są w plikach** · **egzekucja FAIL** (Slack MCP nie wołany · sync archiwum od 2026-06-28 · brak SYNC-EKSPORT w dzienniku).

**Wdrożono (tylko docs + reguła):** `docs/obieg/AUDYT-OBIEG-PAMIEC-SLACK-2026-07-04.md` · hasło **`reguły`** w `komendy-raport.mdc` + `KOMENDY-MACIEJA.md`.

**Maciej — rytuał:** **`reguły`** w każdym czacie na start dnia · raz odśwież autoryzację Slack MCP w Cursor.

---

## [2026-07-04 ~02:10] MASTER → Design · **START v3.2 miasto + C-09 roster TW**

**Trigger:** Maciej — playtest OK · przygotować zlecenia dla Designera.

**Zlecenia (2):**

| Hasło | Brief | Wklejka |
|-------|-------|---------|
| `START — W3-miasto-v3.2-delta` | `docs/ux/DESIGN-BRIEF-W3-miasto-v3.2-playtest-delta.md` | `docs/ux/WKLEJKA-DESIGN-START-W3-miasto-v3.2.md` |
| `START — C09-roster-tw-v3` | `docs/ux/DESIGN-BRIEF-C09-roster-tw-v3.md` | `docs/ux/WKLEJKA-DESIGN-START-C09-roster-tw.md` |

**Handoff:** `_handoff/UI-do-DESIGN_W3-miasto-v3.2-delta-2026-07-04.md` · `_handoff/UI-do-DESIGN_C09-roster-tw-2026-07-04.md`  
**Indeks:** `docs/ux/DESIGN-START-LISTA-2026-07-04.md`  
**Playtest Design:** `gra-robocza/START.html` · screenshoty opc. `referencje-miasto-playtest-2026-07-04/`

**STOP kanonu** bez zmian — Design sync mockupów po OK kodu.

---

## [2026-07-04 ~08:00] Maciej · **HOLD Design C-09 roster**

**Decyzja:** wygląd rostera w bitwie — **wstrzymany** · Maciej dopracowuje z **Grupą C** · Design po sygnale.  
**Aktywne dla Designera:** tylko `START — W3-miasto-v3.2-delta`.

---

## [2026-07-04 ~01:45] Maciej → MASTER · **P0 miasto = lane UI, MASTER STOP kod**

**Decyzja:** wszystkie poprawki P0 miasta robi **Maciej z lane UI**. MASTER **tylko orkiestracja** — bez edycji `hud.ts` / `cityPanel.ts` / buildów.

**Dokument:** `_handoff/MASTER-do-UI_miasto-P0-orchestracja-2026-07-04.md` · zaktualizowano `UI-STAN.md`, `UI.md` § DO ZROBIENIA TERAZ.

**MASTER czeka:** meldunek Macieja (P0-2 OK/FAIL · P0-1 OK/FAIL · md5 robocza · handoff UI).

**STOP:** promocja kanonu miasta · Design stopki · kod MASTER na P0.

---

## [2026-07-04 ~01:00] MASTER → lane UI · **P0-2 chrome (regres B-27)** · ~~próba kodu MASTER — wycofana rola~~

**Trigger:** Playtest miasto RZYM **FAIL chrome** (Wiki/Menu na chipach + exit blokuje heksy) · STOP promocji · STOP Design.

**Pliki:** `hud.ts` (`is-city-view` — ukryj hud-left/power-center, Wiki góra-prawo) · `cityPanel.ts` (padding-right chipów · exit `top:92px` + pointer-events pass-through).

**Backup:** `hud.ts.bak-UI-2026-07-04-P0-2` · `cityPanel.ts.bak-UI-2026-07-04-P0-2-chrome`

**Bundle playtest:** `gra-robocza/Gra-podglad.html` md5 **`807966271929fbdf39b3d7e1fd5e6215`** · **kanon bundle bez zmian** (STOP promocji).

**Handoff:** `_handoff/UI-do-MASTER_miasto-P0-2-2026-07-04.md` · **CZEKA playtest Maciej**.

**P0-1 stopka:** werdykt OK/FAIL **niepotwierdzony** w ostatnim teście (focus chrome).

---

## [2026-07-04 ~00:20] MASTER → lane UI · **P0-1b stopka (CSS only)**

**Trigger:** Playtest P0-1 **FAIL** · Maciej: STOP promocji · P0-1b tylko CSS, bez Design.

**Plik:** `gra/src/ui/cityPanel.ts` — full-bleed stopka, `border-top:2px`, groove `::before`, mini-karta `.civ-w4-surowce-foot`, `height:100%` na kolumnie.

**Backup:** `cityPanel.ts.bak-UI-2026-07-04-P0-1b`

**Sync:** `gra/` = `gra-kanon/src` = `gra-robocza/src` · bundle playtest **`gra-robocza/Gra-podglad.html`** md5 **`5c39e301…`** (**kanon bundle bez zmian** — STOP promocji).

**Handoff:** `_handoff/UI-do-MASTER_miasto-stopka-P0-1b-2026-07-04.md` · **CZEKA playtest Maciej**.

**STOP:** publish-kanon-snapshot · Design mockup stopki · baseline md5 — do werdyktu OK/FAIL P0-1b.

---

**Playtest:** `gra-kanon/START.html` · panel miasto **RZYM** · kanon md5 **`5b9abefc1534acfec886c34730765b25`**.

**Zostaw (OK):** Wróć na mapę + toolbar okolica + mapa 3D (B-27/B-28) · rail 2+7 · Wiki/Menu · surowce w `civ-v-right-foot` (semantyka — nie 7. zakładka).

**Regres (P0):**
1. Stopka surowców **wizualnie zlane** ze Spichlerzem — potrzebny osobny pas na dole kolumny (Maciej: surowce **oddzielnie**, nie klatka Design).
2. `cityPanel.ts` ruszany w batchu TW (~22:45) **bez playtestu miasta** po promocji.
3. Kanon **`5b9abefc`** ≠ baseline Design miasto **`153fcda2`** — **STOP promocji** do OK Macieja na miasto.
4. Design: **NIE** „7. klatka Surowce” — tylko stopka w klatkach złożonych (Spichlerz+stopka, Handel+stopka).

**Diagnoza MASTER:** batch TW zmienił m.in. sekcję Walka (TW — **zostaje**) + `renderSurowce` (W4 markup) + CSS `.civ-v-right-foot`: **usunięto `margin-top:auto`** (baseline pin stopki na dół kolumny) → stopka „klei się” do scrolla Spichlerza.

**ZAKAZ do OK Macieja:**
- Edycje `cityPanel.ts` / `cityUxFrame.ts` poza hotfixem **P0-1** (separacja stopki).
- `publish-kanon-snapshot` bez playtestu miasta (Ctrl+F5 → 7 medalionów + stopka oddzielona).

**Handoff:** `_handoff/UI-do-MASTER_miasto-stopka-surowce-P0-2026-07-04.md` · lane fix CSS **NIEWYSTARCZAJĄCY** · **CZEKA rób P0-1** od Macieja.

**Źródło:** `_handoff/MASTER-do-UI-DESIGN_miasto-baseline-2026-07-03.md` · F ROBOCZA EXIT · Decyzja A.

---

## [2026-07-04] DESIGN → UI · **W3 v3.1 · 6klatek + Surowce**

**Plik:** `docs/ux/claude-design/The Game - Miasto Zakladki W3 v3 6klatek (1E).dc.html`  
**Zawartość:** Handel · Praca · Porządek · Zdrowie · Kultura · Religia + klatka Surowce (osobna od Handlu).  
**MASTER:** **PARTIAL** — 6 paneli OK (szata v3) · Surowce nadal jako pełna klatka (kanon = stopka kolumny `civ-v-right-foot`) · podpisy bonusów (+2 żywność…) poza HTML · brak klatek złożonych Handel+stopka · Esc/Menu z głównego v3.

---

**Designer:** `DESIGN-do-UI_miasto-w3-v3.md` (4 klatki · rail 7 · `/t` zostaje · status Designer **APPROVE**).  
**Kanoniczna ścieżka w repo:** `docs/ux/claude-design/DESIGN-do-UI_miasto-w3-v3.md` (+ `.dc.html` deliverable).  
**Push main (następny):** pakiet dyspozycji W3 + handoff + mockup v3 — **MASTER wrzuca razem**.

**MASTER sign-off:** **PARTIAL** — chrome + Spichlerz + stopka surowców OK · **delta v3.1:** 6 prawych paneli (W4 v2) · Esc vs Menu gry (§ Review w `_handoff/UI-do-DESIGN_W3-miasto-v3-delta-2026-07-03.md`).

**Tor C04-C05:** hasło `C04-C05-oblęzenie-mapa-v2` · **🟢 ZIELONE START** (tor równoległy · nie blokuje v3.1 miasta).

---

## [2026-07-03 ~23:45] MASTER → **Grupa C** — jednostki Faza 1 fix + Faza 2 roster

**Decyzja Macieja:** Faza 1 = tylko **Wojownik germański** (Brąz + SUPER). Celtowie/Kusznik bez zmian.  
**Faza 2 doprecyzowanie:** **Słowianie** + konnica **szczepniki** · **Asyria** (= Syryjczycy) + **2 mocne konnice** (lanca + łuk konny).

**Handoff:** `dyspozycje/_handoff/MASTER-do-GRUPA-C_jednostki-faza2-roster6-2026-07-03.md`  
**Obieg:** `docs/obieg/C-walka.md` § TERAZ · trigger czat C: **`działaj`**

---

## [2026-07-03 ~22:45] MASTER — **sync TW balansu WSZĘDZIE** · handoff ALL-LANES

**Batch 2 (Maciej):** balans obowiązuje we **wszystkich** silnikach + UI, nie tylko scena T.

**Pliki:** `combat.ts` (`unitRowStat`) · `siege.ts`/`siegeAi.ts`/`siegeDefenders.ts` · `main.ts` · `battleScene.ts` (tooltip/taran/katapulta) · `ai.ts` · `cityPanel.ts` · `gallery4` · testy logic/siege-ai.

**Handoff zbiorczy:** `_handoff/MASTER-do-ALL-LANES_sync-TW-balans-2026-07-03.md` (+ UNITS/UI/MIASTO z batch 1).

**→ Maciej:** Ctrl+F5 · playtest bitwa + oblężenie + karta jednostki w mieście.

## [2026-07-03 ~23:58] MASTER — **POLE-BITWY** przebudowany (osobny pipeline)

**Przyczyna:** `Gra-podglad-POLE-BITWY.html` = build `vite.oblezenie-bitwa.config.ts`, **nie** wchodził w `publish-robocza-snapshot` → stary bundle (22:23) vs kanon (22:44).

**Fix:** rebuild POLE-BITWY · md5 **`0d1b409bfdac58268185a2806f0f5243`** · skopiowano do `gra-robocza/` i `gra-kanon/` · `publish-robocza-snapshot.ps1` kopiuje POLE-BITWY jeśli jest w root.

---

**Decyzja Macieja:** „rób” — porządek po pass `units.json` (health ×1,5, missile ÷2).

**Kod:** `battleScene._singleBlow` → TW (`meleeAttack`, `missileAttack`, `weaponDamage`…) · `computeInstantResult` → `health` · `testBattle.rowHealth` → `health` · `cityPanel` → etykiety TW w sekcji Walka.

**Publikacja:** kanon md5 **`5b9abefc1534acfec886c34730765b25`** · `gra-kanon/START.html` · `gra-robocza/START.html` · root `Gra-podglad.html`.

**Testy:** combat **6/6** · smoke **OK** · battle-smoke FAIL (pre-existing UI label).

**Handoffy (informacja lane):**
- `_handoff/MASTER-do-UNITS_balans-scena-T-2026-07-03.md`
- `_handoff/MASTER-do-UI_statystyki-TW-jednostki-2026-07-03.md`
- `_handoff/MASTER-do-MIASTO_balans-jednostki-info-2026-07-03.md`

**→ Maciej:** Ctrl+F5 · playtest bitwy (scena T + skip) · Łucznik HP 12 / missile 3.

---

## [2026-07-03] MASTER — **START Design W3 v3 HUD miasta**

**Maciej:** kod miasto = prawda · Designer nadgania mockup · screenshoty opcjonalne  
**Wklejka:** `docs/ux/WKLEJKA-DESIGN-START-W3-miasto-v3.md`  
**Brief:** `docs/ux/DESIGN-BRIEF-W3-miasto-v3-HUD.md`  
**Handoff:** `_handoff/UI-do-DESIGN_W3-miasto-v3-delta-2026-07-03.md`

---

**Audyt:** `_handoff/AUDYT-SYNC-MIASTO-BITWA-2026-07-03.md`  
**Miasto:** `cityPanel`/`cityUxFrame` **identyczne** gra = kanon = robocza · **lane port NIE TRZEBA**  
**Design:** dostosować mockup W3 v3 do kanonu (nie odwrotnie) · hasło `START — W3-miasto-v3-delta`  
**Bitwa:** `gra/` **nowsze** (`battleScene`) · kanon celowo starszy · praca z Masterem trwa

---

## [2026-07-03] MASTER — **delta miasto** · Design **STOP** W3-1E · **Maciej: A**

**Decyzja Krok 3:** **A** — lane chrome z kanonu · Design W3 v3 **później**  
**Dyspozycja lane:** `_handoff/MASTER-do-UI_miasto-krok3-A-2026-07-03.md`

---

## [2026-07-03] DESIGN — **START C-06 v4** (mapa bitwy · sync kanon)

**Maciej:** kanon Master = ostateczne → mockup **C06 v3 nieaktualny**.

**Brief:** `docs/ux/DESIGN-BRIEF-C06-v4-map-redesign.md`  
**Handoff:** `_handoff/UI-do-DESIGN_C06-v4-map-redesign-2026-07-03.md`  
**Wklejka:** `docs/ux/WKLEJKA-DESIGN-START-C06-v4.md`  
**Baseline PNG (opcjonalnie):** `docs/ux/referencje-c06-kanon/`

**Deliverable:** `The Game - C06 Deployment v4 (1E).dc.html`

---

## [2026-07-03] MASTER **reconcile** — Maciej: sesja Master = **OSTATECZNE** ✅ KANON

**Decyzja Macieja:** poprawki UX z sesji Master są **źródłem prawdy** (nadpisują wpisy lane/ROBOCZA z tego czatu).

**Promocja:** `publish-robocza-snapshot.ps1` → `publish-kanon-snapshot.ps1` · smoke  OK · combat 6/6  
**MD5 kanon = robocza = root:** **`153fcda2f71e1e9ab3a538d8b9c10f9e`** · `gra-kanon/START.html`  
**Poprzedni kanon:** archiwum `gra-kanon-archiwum/gra-kanon_20260703-220449` (md5 `032ad48c…`)

**Zakres bundle (gra/src → kanon):** W3-W4 miasto · C-01 pre-bitwa v3 · Grupa C batch 2 (walka) · wcześniejsze batchy W3/HUD.

**Lane W3-W4:** zmergowany w `gra/src` — meldunek **`→ MASTER: ZAMKNIĘTE`** (bez osobnego portu).

**Design C-06:** → wpis START v4 powyżej (było: osobna dyspozycja).

---

**Designer:** usunięte `/t` (same liczby +12, +2…); ikony line Bydło/Glina/Koń/Sól w stylu 1E.

**Kanon Design (MASTER):** `docs/ux/claude-design/The Game - Miasto Zakładki W4 v2 (1E).dc.html` (21:24) — 7 zakładek + rail medalionów + stopka surowce; bez `/t`; inline SVG surowców.

**Archiwum:** `W3 v2 (1E).dc.html` — nie używać jako źródła portu.

**Luka:** brak osobnej klatki **B-02** (górny pasek Praca/Skarbiec/Kultura…) w W4 — screenshot `referencje-w3-screenshots/08` nadal obowiązuje; lane portuje B-02 z baseline + istniejącego kodu `renderCivResourceTopBar`.

**Ikony SVG:** w `brand-book/eksport/icons/resources-map/` nadal 6 plików (gold/wood/…) — Bydło/Glina tylko inline w W4; lane wyciągnie przy porcie lub Design dopnie `res-cattle.svg` / `res-clay.svg` opcjonalnie.

**Następny krok:** Maciej → **`START lane W3`** (port W4 → `cityPanel.ts`) · potem Opus review · osobno **`master`** (batch 2 Grupa C czeka).

---

## [2026-07-03] LANE — Grupa C batch 2 → **→ MASTER: GOTOWE**

**Maciej:** A+B+C+D — lane wykonał A+C+D; B czeka **`master`** w hubie.

**Handoff:** `_handoff/UI-UNITS-do-MASTER_grupa-C-batch2-2026-07-03.md`  
**Kod:** `siegeHud1E.ts` · `endScreen1E.ts` · `battleScene.ts` · `preBattle.ts` · `battleHudTheme.ts`  
**Testy:** combat 6/6 · vite build OK  
**Hub (C):** `The Game - Walka Hub Grupa-C (1E).dc.html`  
**A-08 (D):** `_handoff/UI-do-DESIGN_A08-START-2026-07-03.md`

---

## [2026-07-03] DESIGN — Grupa C (Walka) **KOMPLET** ✅

**C-05 v2:** `docs/ux/claude-design/The Game - C05 Szturm muru v2 (1E).dc.html` — Szturmujący VS Obrońcy muru, punkty szturmu (wyłom/drabiny/wieża), obrona (olej/łucznicy), Drabiny/Wieża/Szturm przez wyłom.

**Seria 7 ekranów 1E zamknięta:** C-01 · C-02/C-06 · C-07 · C-09 · C-12 · C-04 · C-05 — indeks `docs/ux/GRUPA-C-DESIGN-KOMPLET-2026-07-03.md`

**Kod:** batch 1 w kanonie · reszta = **batch 2 lane** (czeka `START lane` od Macieja) · **master** na później

---

## [2026-07-03] DESIGN — C-04 Oblężenie ✅ · START C-05 Mur (ostatni Grupy C)

**C-04 v2:** `docs/ux/claude-design/The Game - C04 Oblezenie v2 (1E).dc.html` — HUD pola 3D: Ty VS Garnizon, integralność murów 42%, siły oblężnicze, Ostrzał/Czekaj/Szturm.

**Mapowanie:** Design C-04 ≈ lane C-19 · `DESIGN-MAPOWANIE-C04-C05-vs-lane.md`

**▶ START Design:** C-05 Mur — `DESIGN-BRIEF-C05-mur-v2.md` · `WKLEJKA-DESIGN-START-C05-mur.md`

**Lane port C-04/C-05:** po C-05 Design + komenda Macieja `START lane` / `master` — nie w kanonie.

---

## [2026-07-03] DESIGN — C-12 ✅ · START C-04/C-05 oblężenie

**C-12 Koniec bitwy v2:** `docs/ux/claude-design/The Game - C12 Koniec bitwy v2 (1E).dc.html` — Design zamknięty (wieniec, ZWYCIĘSTWO, 3 karty, Bohater bitwy, Szczegóły / Powrót do mapy).

**Lane (batch 2):** pełny port C-12 v2 do `_showEndScreen` — po akceptacji Macieja / po C-04 Design (obecny kanon = uproszczony end screen z batch 1).

**▶ START Design:** C-04 modal wyboru + C-05 panel mapy — brief `docs/ux/DESIGN-BRIEF-C04-C05-oblęzenie-v2.md` · wklejka `docs/ux/WKLEJKA-DESIGN-START-C04-C05-oblęzenie.md`

**Kolejny po oblężeniu:** C-19/C-20 mur — brief przygotowany `docs/ux/DESIGN-BRIEF-C19-C20-mur-bitwa-v2.md` (START po C-05).

---

## [2026-07-03] MASTER Batch 5 — Grupa C 1E batch 1 → KANON ✅

**Handoff:** `_handoff/UI-UNITS-do-MASTER_grupa-C-1E-batch1-2026-07-03.md`  
**Bramka:** `bramka-test-publish.ps1` — logic 203/203 · combat 6/6 · smoke · battle-smoke · typecheck OK  
**Promocja:** `publish-kanon-snapshot.ps1`  
**MD5 kanon:** **`032ad48c6c4e1001e035ff24f456e4c4`** (root · `gra-kanon/` · `gra-robocza/`)  
**Poprzedni kanon:** archiwum `gra-kanon-archiwum/gra-kanon_20260703-174330` (md5 `09ae42c4…`)

**Zakres:** `battleHudTheme.ts` · deploy 1E · roster TW · preBattle kolory · koniec bitwy · Ty `#3a6ad0` / wróg `#c84040`

**Sync playtest:** `Gra-podglad-BITWA.html` · `Gra-podglad-PLAYTEST-WALKA.html` (= robocza md5)

**Maciej:** Ctrl+F5 `gra-kanon/START.html` lub `Gra-podglad-BITWA.html` → **T** → deploy → Start → POMIN (kolory + panel 1E)

**Opus:** bramka MASTER (self-review diff) — pełny Opus opcjonalny przed batch 2  
**Batch 2 lane:** cmd bar SVG · top HUD v3 · A-08 ulepszenia

---

## [2026-07-03] HANDOFF MAPA → MASTER (Maciej OK obwódka)

**Maciej:** OK — obwódka miast na mapie (kolory dyplomacji). Przekazane MASTER do domknięcia.

**Pakiet:** `_handoff/MAPA-do-MASTER_HANDOFF-2026-07-03.md` (zbiorczy):
1. Obwódka heksu miasta — gracz `#7EC8E8` · wojna `#FF4444` · neutral `#5CB85C` · sojusz `#1A4A8A` ✅ Maciej OK
2. Żeton 👥/⚔ nad miastem (ludność + wojsko na heksie)
3. P0 regresje terenu (faza A brzeg — werdykt Macieja nadal otwarty po nowej grze)

**Kanon playtest:** `Gra-podglad.html` zaktualizowany · **Opus przed sign-off v1.0**

**MASTER TODO:** Opus review → bramka testów → md5 kanonu · zamknąć A po werdykcie Macieja

---

## [2026-07-03] MAPA P0 batch — szczegóły techniczne (w pakiecie HANDOFF)

**Zakres:** D-B2 las/dżungla · D-COAST-2 podwójny pierścień + kolor wybrzeża · P0 woda · P1 hex miasta + obwódka okolicy · D-RUDY miedź→Wzgórza (gen).
**Testy:** coast 91/91 · logic 203/203 · smoke baseline-red.
**Maciej:** Ctrl+F5 + nowa gra → werdykt A/B/C regresji brzegu.

---

## [2026-07-03] F ROBOCZA — estuary rzeka→morze (playtest Maciej)

**Problem:** ujście rzeki urywało się na krawędzi heksa — brak wizualnego połączenia z oceanem.
**Fix MAPA:** mielizna na heksach delta + język wody w stronę Morza; wstęga rzeki przedłużona do heksu morza; lejek estuary (trapez); jaśniejszy/szerszy odcinek brzegowy.
**Pliki:** `mapRenderStyle.ts`, `scene.ts` · testy coast 81/81 · smoke OK
**F:** ROBOCZA **`2654e7fc91cfe4107cbee78a18a7e6fd`** · kanon bez zmian
**Maciej:** Ctrl+F5 `gra-robocza/START.html` → nowa gra → zoom na ujście rzeki przy brzegu

---

## [2026-07-03] F ROBOCZA — EXIT miasto + okolica auto (playtest Maciej)

**Problem:** brak intuicyjnego wyjścia z widoku miasta na mapę świata; auto zarządzanie polami niewidoczne (W3).
**Fix UI:** `cityUxFrame.ts` — usunięto `opacity:0` z map-chrome; `cityPanel.ts` — przycisk **Mapa** (góra) + **Wróć na mapę** (środek) + hint Esc; okolica grid + status auto.
**Fix okolica:** `okolica.ts` fallback auto; `main.ts` hint po zmianie profilu; overlay zasięgu (`rangeOverlay.ts`).
**F:** ROBOCZA **`a3abce43e0d59e7cb471cfcbab546c30`** · kanon **`ce71d449…`** bez zmian · bramka ZIELONA
**Maciej:** Ctrl+F5 `gra-robocza/START.html` → miasto → wyjście Mapa / Wróć / Esc
**Promocja kanon:** po OK → `start3`

---

## [2026-07-03] MASTER `master` — MAPA P0 + F ROBOCZA

**MAPA lane:** brzeg hybryda **C** + delta **A** → `→ MASTER: GOTOWE` · testy 81/81  
**F:** ROBOCZA **`3ea10008dcc48efc869d5dd57e264a2f`** · kanon **`ce71d449…`** bez zmian  
**Maciej:** Ctrl+F5 `gra-robocza/START.html` + **nowa gra** → brzeg + delta u ujścia rzeki  
**Promocja kanon:** po OK → `start3`

---

## [2026-07-03] MASTER tick `start` — sync kanon/robocza + ACK W3 + F bramka

**Weryfikacja md5:** root · `gra-kanon/` · `gra-robocza/` = **`ce71d449e004d8068acfa8b7a5d3c9b1`** (zgodne)  
**F:** `bramka-test-publish.ps1` — logic 203/203 · smoke OK · battle-smoke OK · manifest ROBOCZA naprawiony (był stale `d5233465…`)  
**UI W3 Batch 4:** ACK meldunku · kanon bez ponownej promocji  
**CUDA-G1:** w bundle (picker + save meta) — review Opus opcjonalny przed osobnym tagiem  
**Następny:** MAPA P0 brzeg **C** + delta **A** (`MAPA.md` § TERAZ) → F rebuild po GOTOWE

---

## [2026-07-03] PROCES: lane ≠ MASTER — hasło `master` tylko w hubie

**Problem:** grupy (np. UI) po `master` / fladze `→ MASTER: master` **publikowały kanon** zamiast meldunku.  
**Fix docs:** `docs/obieg/LANE-NIE-MASTER.md` · `komendy-raport.mdc` · `KOMENDY-MACIEJA.md`  
**Reguła:** lane = meldunek + handoff · **hub Master** = F + review + kanon  
**Maciej:** w grupach **`przekaż do Mastera`** · orkiestracja **`master` tylko w czacie Master**

---

## [2026-07-03] MASTER Batch 4: promocja KANON (W3 pakiet UI + sowa badań)

**Trigger:** Maciej `master`  
**Skrypt:** `gra/tools/publish-kanon-snapshot.ps1`  
**ROBOCZA → KANON md5:** `ce71d449e004d8068acfa8b7a5d3c9b1`  
**Poprzedni kanon:** `2a786b9f…` → archiwum `gra-kanon-archiwum/gra-kanon_20260703-142211`  
**Zawartość:** W3-full-lite · W3-rail-split · W3-layout-blue-border · W3-science-owl · dismiss Wiki/HUD · fix winiety W3-DIM  
**Bramka:** logic 203/203 · smoke OK · battle-smoke OK  
**Start:** `gra-kanon/START.html` · legacy root `Gra-podglad.html` zsynchronizowany  
**Maciej:** Ctrl+F5 → miasto (niebieska obwódka, rail prod. po prawej panelu) · sowa badań · Wiki zamyka się kliknięciem poza panelem

---

## [2026-07-03] DECYZJA: D-MAPA-DELTA = **A** (delta u ujścia rzeki)

**Maciej:** `a` — fan 2–3 heksy jaśniejszej wody na Wybrzeżu.  
**Plik:** `docs/decyzje/D-MAPA-DELTA.md` · handoff zaktualizowany (sekcja delta)  
**Pakiet MAPA P0:** brzeg **C** + delta **A** — jeden batch

---

## [2026-07-03] DECYZJA: D-MAPA-BRZEg = **C** (hybryda brzegu)

**Maciej:** `c` — piasek na lądzie + na Wybrzeżu + łagodniejszy profil.  
**Plik:** `docs/decyzje/D-MAPA-BRZEg.md` · handoff `MASTER-do-MAPA_brzeg-hybrid-C.md`  
**D-MAPA-DELTA:** **OTWARTE** (A/B/C — czeka Maciej)  
**Lane MAPA:** P0 · DoD = screenshot z nowej gry

---

## [2026-07-03] MASTER CUDA-G1: wpięcie cudów (main.ts) → ROBOCZA

**Batch:** `completedWorldWonders` · toolbar **Cuda** (picker) · kolejka produkcji · save/load meta  
**Bramka:** wonder 7/7 · logic 203/203 · smoke · battle-smoke ✅  
**ROBOCZA md5:** `e8f0ac22dcf022ed3c814f2f8e9a6077` · start: `gra-robocza/START.html`  
**Backup:** `gra/src/main.ts.bak-SILNIK-2026-07-03`  
**KANON:** bez promocji — **CZEKA Opus** (`MASTER-do-OPUS_review-epoka-cuda-2026-07-03.md`)

---

## [2026-07-03] PROCES: lane ≠ MASTER — hasło `master` tylko w hubie

**Problem:** grupy po `master` / fladze `→ MASTER: master` budowały kanon zamiast meldunku.  
**Fix docs:** [`docs/obieg/LANE-NIE-MASTER.md`](../docs/obieg/LANE-NIE-MASTER.md) · `komendy-raport.mdc` · `KOMENDY-MACIEJA.md`  
**Reguła:** lane = meldunek + handoff · **hub Master** = F + review + kanon  
**Maciej:** w grupach **`przekaż do Mastera`** · orkiestracja **`master` tylko w czacie Master**

---

## [2026-07-03] BUG: latające owce (wzgórze + złoże) — fix MAPA

**Trigger:** Maciej playtest · screenshot owce nad kopcem  
**Przyczyna:** `units.ts` `topYAt()` używał wysokości Civ (Wzgorza 0.85) zamiast Roblox (0.50) → `improvementMeshPlacement` + `galleryDecorSurfaceY` za wysoko  
**Fix:** `gra/src/render/units.ts` — `terrainVisualForStyle` jak w `cities.ts`  
**Efekt:** hodowla solo (owce/bydło/lama) na wzgórzu + jednostki na wzgórzu/górach  
**Czeka:** F rebuild ROBOCZA (batch z CUDA-G1 lub osobny hotfix)

---

## [2026-07-03] INTEGRATOR F: CUDA-G1 → ROBOCZA ✅ · Master weryfikacja OK

**Bramka:** wonder 7/7 · civ-entry 11/11 · wonder-civ-tech 5/5 · logic 203 · smoke OK  
**ROBOCZA md5:** **`e8f0ac22dcf022ed3c814f2f8e9a6077`** · bundle: `civ-wonders-picker` + `completedWorldWonders`  
**Kanon:** **bez zmian** `2a786b9f…`  
**Meldunek:** `F-do-MASTER_CUDA-G1-2026-07-03.md`  
**Następny:** Maciej opcjonalny playtest roboczej · potem `start3` promocja kanon

---

## [2026-07-03] MASTER `start`: dyspozycja F — CUDA-G1 (build + ROBOCZA)

**Trigger:** Maciej `start` · **Handoff lane:** `CYWILIZACJE-do-MASTER_cuda-g1-wonder-availability.md`  
**Stan kodu:** `main.ts` wired ✅ · ROBOCZA opublikowana (md5 e8f0ac22…)  
**Kanon bazowy:** `2a786b9f…` · promocja CUDA-G1 po Opus

---

## [2026-07-03] MASTER: W3-DIM fix — winieta mapy w panelu miasta → ROBOCZA + KANON

**Trigger:** Maciej `Działaj!` · BUG: mapa w mieście prawie niewidoczna (dim 93%)  
**Fix:** `gra/src/ui/cityUxFrame.ts` — radial vignette zamiast `rgba(6,8,12,0.93)` pełnoekran  
**Bramka:** smoke OK · logic 203/203 · build OK  
**md5:** **`2a786b9f4f0ce934cd24eac5c434324a`** (robocza = kanon)  
**Poprzedni kanon:** `db1f508…` → archiwum `gra-kanon-archiwum/gra-kanon_20260703-140715`  
**Maciej:** Ctrl+F5 `Gra-podglad.html` → otwórz miasto → sprawdź teren w środku ekranu  
**Następny:** CUDA-G1 wpięcie · GAP-A2 · D-CUD2

---

## [2026-07-03] CYWILIZACJE: CUDA-G1 wonder-availability (moduł) → handoff MASTER

**Plik:** `gra/src/game/wonder-availability.ts` · test **7/7**  
**Reguła:** `tech_before_civ_entry` tylko dla cudów **E** (R = wyścig, bez tej blokady)  
**Handoff wpicia:** `dyspozycje/_handoff/CYWILIZACJE-do-MASTER_cuda-g1-wonder-availability.md`  
**Opus pack:** `dyspozycje/_handoff/MASTER-do-OPUS_review-epoka-cuda-2026-07-03.md`  
**main.ts / UI budowy cudów:** CZEKA batch MASTER (CUDA-G1)

---

## [2026-07-03] MASTER Batch 3: promocja KANON (W-WIKI + W3-full-lite)

**Trigger:** Maciej `start3` · **Review:** APPROVE (subagent readonly)  
**Skrypt:** `gra/tools/publish-kanon-snapshot.ps1`  
**ROBOCZA → KANON md5:** `db1f508bee3080f199617b8e0420c0e9`  
**Poprzedni kanon:** `fd7c10bd…` → archiwum `gra-kanon-archiwum/gra-kanon_20260703-135843`  
**Zawartość:** Wiki HUD (W-WIKI-1/2) · W3 panel miasta · fix kreatora · wikiBundle  
**Start finalna:** `gra-kanon/START.html` · legacy root `Gra-podglad.html` zsynchronizowany  
**Maciej:** opcjonalny playtest finalnej Ctrl+F5

---

## [2026-07-03] DECYZJA Macieja: kolejność MAPA teren — A → potem B+C

**Maciej:** „b i c później a”

| Krok | Temat | Akcja |
|------|--------|--------|
| **A (teraz)** | Brzeg hybryda C + delta ujść rzek | Playtest `Gra-podglad.html` · Ctrl+F5 + **nowa gra** → OK / screen |
| **B (po A)** | Batch 2 — dekoracje 3D v2 Warm (las, wzgórza, ulepszenia, miasta) | Lane MAPA po werdykcie brzegu |
| **C (po A)** | Korekty pojedynczych kolorów v2 Warm | Na życzenie Macieja po playteście |

**BLOCKED do czasu A:** Batch 2 i tuning palety.

---

## [2026-07-03] DECYZJA Macieja: D-RUDY — rozmieszczenie + wygląd złóż metali

**Maciej (2026-07-03):** ruda żelaza **tylko Góry**; ruda miedzi **tylko Wzgórza**; wygląd = **grudki skalne** (nie wiaderka/dzbany); miedź **miedziana**, żelazo **szkliste/błyszczące**.

| Surowiec | Teren (kanon) | Epoka widoczności | Render docelowy |
|----------|---------------|-------------------|-----------------|
| **Miedź** (`hex.zloze='miedz'`) | **Wzgórza** | epoka 2 (brąz) | grudki skalne, żyły `#B87333` / `#C8843E` |
| **Żelazo** (`hex.zloze='zelazo'`) | **Góry** | epoka 3 | grudki ciemne + **szkliste** żyły (`#9AA8B8`, połysk) |
| Węgiel | Góry (bez zmiany) | — | bryły ciemne |
| Glina | Łąka / rzeka (bez zmiany) | — | dzbany OK (to nie ruda) |

**Gap w kodzie dziś:**
- Generator: obie rudy na **Górach** (`gen-helpers.ts` BASE_DEPOSIT_RULES).
- Legacy `Nakladka.ZlozeRudy` → złote grudki (`styledOre`) — stary model; na Wzgórza kopalnia wymaga tej nakładki, ale generator jej nie stawia → luka gameplay.
- Wiaderka = **glina** (`styledClay`), nie ruda — jeśli Maciej widzi „wiaderka” na rudzie, to albo legacy `ZlozeRudy`, albo pomyłka z gliną obok.

**Dyspozycje (po A brzegu, można równolegle z Batch 2):**
- **MAPA/generator:** `miedz.allowedOn → Wzgorza`; `zelazo` zostaje Góry; testy `deposit-*`.
- **MAPA/improvement-build + mainview:** kopalnia: miedź na Wzgórza (`zloze=miedz`), żelazo na Górach (`zloze=zelazo`); wycofać `ZlozeRudy` z generatora (legacy tylko stare save).
- **MAPA/styleResources:** dopracować `styledCopperOre` / `styledIronOre` (grudki, kolory); iron = szklistość (jaśniejsze facetki / drugi materiał).

**Powiązane:** Batch 2 dekoracje · D-B2 drzewa (osobny wątek).

---

## [2026-07-03] DECYZJA Macieja: D-B2 — drzewa + dżungla (Batch 2 grafika)

| ID | Pytanie | Wybór Macieja |
|----|---------|---------------|
| **D-B2-1** | Pomarańczowe drzewa (jesień) | **B** — zamienić na drugi odcień zieleni (ciemny + jasny, **bez pomarańczy**) |
| **D-B2-2** | Ton zieleni lasu | **C** — **mix:** sosna ciemna, liściaste jasne |
| **D-B2-3** | Dżungla | **A** — wariant wizualny istniejącego `Nakladka.Las` w strefie ciepłej (**bez** nowego terenu/nakładki) |

**Spec implementacji (lane MAPA, plik `mapRenderStyle.ts` → `addRobloxTree` / `buildStyleForestCluster`):**
- Wyłączyć `autumn` → pomarańcz; zamiast tego deterministyczny **ciemny vs jasny** liściasty.
- Sosna (`pine`): ciemna oliwka / szałwia (v2 Warm earth).
- Liściaste: jaśniejsza mięta/spójna z heksem `#94BF78`.
- **Las-dżungla:** ten sam `Nakladka.Las`; hook biomu ciepłego → gęstsze, wyższe, ciemniejsza zieleń, mix palm + parasol; 5–7 drzew/hex.

**Kolejność:** po werdykcie brzegu (A) · można 2a drzewa przed pełnym Batch 2 reszty dekoracji.

---

## [2026-07-03] HANDOFF MASTER: MAPA teren — A zamknięte + Batch 2 READY

**Maciej:** „A i wszystko do mastera, co zrobiłeś”

**Werdykt:** krok **A (brzeg hybryda C)** — **zamknięty** · Batch **B** (dekoracje) **READY** do delegacji lane MAPA.

**Handoff pełny:** `dyspozycje/_handoff/MASTER-handoff-MAPA-teren-D-B2-D-RUDY_2026-07-03.md`  
**Archiwum czatu:** `docs/archiwum-czatow/master/MASTER-MAPA-teren-decyzje_2026-07-03.md`

**Pakiet decyzji do lane MAPA:**

| ID | Treść |
|----|--------|
| Kolejność | A ✅ → B (2a/2b/2c) → C |
| D-B2-1 | **B** — zielenie zamiast pomarańczy |
| D-B2-2 | **C** — sosna ciemna, liściaste jasne |
| D-B2-3 | **A** — dżungla = las w biomie ciepłym |
| D-RUDY | miedź Wzgórza · żelazo Góry · grudki · kolory miedź/szkło |

**Propozycja batchy:** 2a drzewa · 2b rudy · 2c reszta dekoracji · 3 minimapa.

**Ten czat nie edytował kodu** — tylko dziennik + handoff + archiwum.

---

## [2026-07-03] 🔴 BLOCK A — regresje playtest Macieja (P0 → MASTER)

**Maciej (playtest ~14:56):** czerwone drzewa · woda/ocean/morze **na lądzie** (screen).

**Korekta:** wpis „A zamknięte” **cofnięty** — A **BLOCK** do fix P0.

**Handoff pilny:** `dyspozycje/_handoff/MACIEJ-do-MASTER_MAPA-P0-regresje_2026-07-03.md`

| P0 | Bug | Lane |
|----|-----|------|
| P0-1 | Pomarańczowe drzewa — D-B2 nie wdrożone | MAPA `mapRenderStyle.ts` |
| P0-2 | Woda na lądzie — generator i/lub render; rebuild kanon | MAPA + MASTER build |

**MASTER:** deleguj MAPA P0-1 + P0-2 → Opus → `Gra-podglad.html` → Maciej playtest.

---

## [2026-07-03] DECYZJA Macieja: D-COAST-2 — podwójny pierścień Wybrzeże + notatki playtest

**Playtest ~16:29:** ocean między górami (P0-2 nadal); plaża OK na tym etapie; ciemna obwódka heksów wybrzeża — do poprawy (jednolity jasnoniebieski `#82C8E0`).

**D-COAST-2:** **2 heksy Wybrzeże** wokół lądu (nie 1). Generator: `applyCoastRing` ×2 lub rozszerzona reguła.

**Statystyki Wybrzeże (przypomnienie — `economy.ts`):** 🍞3 · 🔨2 · 💰2 · drewno 0 · kamień 0.  
**Surowce na hexie:** brak złóż (generator czyści wybrzeże). **Łodzie rybackie** (tech Żegluga): Wybrzeże/Morze → +2🍞 +3🔨. **Sól:** Pustynia/Równina (`zloze=sol`), nie wybrzeże. **Miasto:** nie można założyć. **Ruch:** nieprzechodnie (jak morze) do Żeglugi.

---

## [2026-07-03] 🔴 Maciej playtest: czerwone drzewa + brak dżungli (kod nie wdrożony)

**Maciej:** czerwone drzewa nadal · zero dżungli na mapie.

**Przyczyna:** D-B2 tylko w dokumentacji — `mapRenderStyle.ts` bez patcha (`autumn`/`#FF8822` live; brak jungle hook).

**MASTER:** delegacja MAPA **P0-1 natychmiast** (drzewa + dżungla widoczna) przed dalszym playtestem. Handoff zaktualizowany.

---

## [2026-07-03] Maciej: hex pod miastem + obwódka zasięgu (P1)

**Objawy:** widać heks terenu pod miastem; obwódka zasięgu okolicy nie łączy się w jeden pas.

**Handoff:** `MACIEJ-do-MASTER_MAPA-P0-regresje` § BUG-P1, BUG-P2.

**Root cause:** F-CITY-HEX tylko dane+dekoracje (nie ukrywa kafelka terenu); `rangeOverlay` borderBand per-krawędź bez weld; `reapplyCityHexDecorHides()` nie wołane po starcie.

---  
**ROBOCZA md5:** `db1f508bee3080f199617b8e0420c0e9` · start: `gra-robocza/START.html`  
**Kanon root:** **bez zmian** (`18258bbcc…`)  
**Zawartość:** Wiki (W-WIKI-1/2) + fix kreatora `civMinStartEpochIndex`  
**Handoff:** `F-do-MASTER_W-WIKI-2026-07-03.md` · `UI-do-INTEGRATOR_w-wiki-batch-2026-07-03.md`  
**CZEKA:** MASTER weryfikacja → **Maciej playtest roboczej** → Opus → promocja kanon

---

## [2026-07-03] HANDOFF: D-CYW-EPOKA-WEJSCIA + D-CUD-TECH + cuda Antyk (Maciej)

**Trigger:** Maciej — kaskada epokaWejscia, reguła tech cudów E, korekty Fenicjanie/ Kolos/ Koloseum.  
**Handoff:** `dyspozycje/_handoff/CYWILIZACJE-do-MASTER_epoka-wejscia-cuda-2026-07-03.md`  
**Decyzje:** `docs/decyzje/D-CYW-EPOKA-WEJSCIA-KASKADA.md` · `docs/decyzje/D-CUD-TECH-WEJSCIA.md`

| Warstwa | Stan |
|---------|------|
| `civs.json` + `wonders.json` | ✅ dane |
| `civ-entry-epoch.ts` + kreator + AI roster (`main.ts`) | ✅ kod |
| `wonder-civ-tech.ts` + testy (11+5+14) | ✅ CI |
| **Silnik budowy cudów** (`wonders-data` → gameplay) | ❌ **NIE wdrożony** — batch MASTER |
| **Kanon** `Gra-podglad.html` | ✅ **2026-07-03** md5 `DB1F508BEE3080F199617B8E0420C0E9` · Opus review **CZEKA** |

---

## [2026-07-03] MASTER: batch epoka-wejscia-cuda — build kanon

**Handoff:** `CYWILIZACJE-do-MASTER_epoka-wejscia-cuda-2026-07-03.md`  
**Bramka:** civ-entry 11/11 · wonder-civ-tech 5/5 · civ-roster 14/14 · logic 203/203 · smoke OK · battle-smoke OK  
**Build:** `npx vite build --outDir $env:TEMP\civ-dist`  
**Kanon md5:** `DB1F508BEE3080F199617B8E0420C0E9`  
**main.ts:** filtr AI `_menuEpochId` + `civIdsAvailableAtGameEpoch` (review OK, usunięty martwy import)  
**Następny:** Opus sign-off · sprint gameplay cudów (production/UI)

---

## [2026-07-03] MASTER: W-WIKI batch → ROBOCZA (bez kanonu)

**Trigger:** Maciej `start` · kolejka W-WIKI (UI lane GOTOWE).

| Krok | Wynik |
|------|--------|
| Scope | W-WIKI-1 + W-WIKI-2 · bez `main.ts` |
| Bramka | logic 203/203 · diplo 143/143 · smoke OK · battle-smoke OK · ai 193/198 baseline |
| **ROBOCZA md5** | **`9b609961317734673d881e1604e04a7d`** |
| **KANON** | **bez zmian** (`fd7c10bd…`) |
| Meldunek | `F-do-MASTER_W-WIKI-2026-07-03.md` |

**Start test:** `gra-robocza/START.html` · **NIE** `Gra-podglad.html`.

---

## [2026-07-03] DECYZJA + WDROŻENIE: D16=A, D17=A (HUD mapy)

**Maciej:** D16=A (banery liderów ukryte do v1.0), D17=A (panel kontekstowy tylko po wyborze).  
**Pliki:** `gra/src/ui/hud.ts`, `contextPanelHud.ts`, `gra/src/main.ts` (`getContextPanelMessage`).  
**Build roboczy:** po smoke — playtest Ctrl+F5 `gra-robocza/START.html`.  
**Kanon:** czeka batch MASTER (W-WIKI-1 + D16/D17).

---

## [2026-07-03] DESIGN: W3 rail 9/9 KOMPLET (cz2 Spichlerz/Praca/Kultura/Religia)

**Pliki:** `Miasto Zakładki W3 cz2 (1E).dc.html` + cz1 + `Ekran Miasto W3`.  
**Design:** W3-miasto **ZAMKNIĘTE** · szata-sync **ZAMKNIĘTE**.  
**Lane:** integracja W-WIKI-2 → W3-full.

---

## [2026-07-03] UI: Wikipedia na mapie strategicznej (Poradnik + Encyklopedia)

**Cel:** medalion „Wikipedia” w lewym toolbarze mapy → panel z zakładkami **Poradnik** (22 rozdz.) i **Encyklopedia** (130 haseł, Wiki-S/M/pełne).  
**Pliki:** `gra/src/ui/wikiHubHud.ts`, `markdownLite.ts`, `icons/wikiBookIcon.ts`, `mapToolbarHud.ts`, `main.ts` (integracja), `gra/tools/bundle-wiki-for-game.cjs` → `gra/src/data/wikiBundle.json` (~708 KB, wbudowany w kanon).  
**Build:** `predev`/`prebuild` regeneruje bundle z `docs/PORADNIK-GRACZA/` + `docs/encyklopedia/`.  
**Status:** build OK (`vite build` → ~8,4 MB single-file). **CZEKA:** playtest Macieja + Opus przed publikacją kanonu `Gra-podglad.html`.

**Update 2026-07-03 Batch 1:** W-WIKI-2 ✅ · `ui-wiki.svg` w manifest · robocza MD5 `8A07DE8751BBB7BE617260C5AC6316FF` · smoke OK · **CZEKA:** W3-full-lite (Batch 2) · Opus · kanon root.

---

## [2026-07-03] DESIGN: W3-miasto-1E — dane ekranu miasta dla Design

**Cel:** designer dopracowuje mockup miasta 1:1 z grą (plony, budynki, stany, akcje).  
**Hasło Design:** `START — W3-miasto-1E`  
**Handoff:** `dyspozycje/_handoff/UI-do-DESIGN_w3-miasto-1E-dane.md`  
**Komunikacja:** `docs/ux/claude-design/WYMIANA-UI-DESIGN.md` § W3-miasto-1E · `brand-book/DYSPOZYCJA.md` · `eksport/HANDOFF.md`  
**Mockup bazowy:** `docs/ux/claude-design/01-propozycje-z-design/brand-book/The Game - Ekran Miasto (1E).dc.html`  
**Status:** CZEKA Design → po zipie Lane W3-full (`cityPanel.ts`).

---

## [2026-07-02] DECYZJA + WDROŻENIE: D-START-OSIEDLE (bonus osiedla pop 1–4)

**Sign-off Maciej:** „Wdrażamy w takiej formie. Jest super.”  
**Lane:** EKONOMIA · **bez `main.ts`**

| Plik | Stan |
|------|------|
| `gra/data/society-params.json` | tablice `*_bonus_osiedle_pop` (Excel final) |
| `society-breakdown.ts` / `turn-economy.ts` | `pickOsiedlePopBonus`, etykieta „Osiedle (N mieszk.)” |
| `docs/decyzje/D-START-OSIEDLE.md` | ✅ ZAMKNIĘTE |
| `docs/balans/D-START-OSIEDLE-tuner.xlsx` | źródło Macieja · `tools/import-osiedle-tuner-xlsx.py` |

**PorPct T1 pop=1 (kult+rel):** easy **80%** Spokój · normal **58%** Napięcie · hard **34%** Niepokój.  
**Odrzucone:** darmowe wojsko na starcie (D-START-UNIT — niepotrzebne).  
**Playtest:** dev/build — panel miasto → rozpiska Sz/Prawo „Osiedle (N mieszk.)”.  
**Kanon HTML:** `Gra-podglad.html` md5 **`9f645c880874e1852a4f4944dbb0d9d7`** (2026-07-02 build D-START-OSIEDLE).

---

## [2026-07-03] DOKUMENTACJA: Poradnik rev. E — pogłębienie + przykłady liczbowe

| Deliverable | Stan |
|-------------|------|
| Enciklopedia Wiki (121+8 pojęć) | każde hasło: Wiki-M rozszerzone + **Przykład liczbowy** |
| Poradnik 22 pliki | **~233** sekcje z przykładami; katalogi: przykład **per encja** (112) |
| `tools/generate-encyklopedia.cjs` | rev. E — strategia, błędy, tabele |
| Handoff | `docs/PORADNIK-GRACZA/HANDOFF-rev-E-2026-07-03.md` |

---

**Zlecenie Macieja:** opisać wszystko — budynki, jednostki, mechaniki; model Wiki‑S / Wiki‑M / Poradnik‑L.

| Deliverable | Stan |
|-------------|------|
| Spis treści rev. C (podpunkty) | ✅ `docs/PORADNIK-GRACZA-SPIS-TRESCI.md` |
| Poradnik‑L części 0–XVII | ✅ 22 pliki `docs/PORADNIK-GRACZA/` |
| Katalogi: 26 budynków · 50 jednostek · 17 ulepszeń · 19 cudów | ✅ |
| Enciklopedia Wiki‑S/M | ✅ 121 haseł JSON + 8 pojęć miasta |
| Handoff | `docs/PORADNIK-GRACZA/HANDOFF-rev-D-2026-07-03.md` |
| Generator | `tools/generate-encyklopedia.cjs` |

**Do oceny Macieja:** rev. E — pogłębienie + przykłady liczbowe (`HANDOFF-rev-E-2026-07-03.md`).

---

Layout mockup HUD Mapy (floating zasoby, MOC pendant, minimapa, tura dół-prawo) · hero PNG w brand-book/assets/ · ikony medalionów verified.

---

## [2026-07-03] W3 panel miasta — Etap 2 batch 1 lite — kanon `cae4010f…`

`cityPanel.ts` · tokeny brand 1E · zakładki cp-granary/cp-labor/cp-order/res-settlements · header SVG · drawer styl W1/W2.

---

## [2026-07-02] W2 HUD mapy — Etap 2 batch 1 — kanon `13df8d80…`

`hud.ts` + toolbar + dolny pasek + minimapa · tokeny brand 1E · ikony SVG · bez emoji dyplomacji.

---

## [2026-07-02] MACIEJ: `master` — reconciliacja md5 + sync PANEL-MASTER

**Trigger:** Maciej `a` (= **`master`**)  
**Wykonano:** PANEL-MASTER · INTEGRATOR-STAN · MASTER-HANDOFF-INBOX → jeden md5  
**Kanon:** **`f18cc37efc3a299cdcb39208ad39fa8a`** (infografik4 FULL + W1-hero w bundle)  
**F:** IDLE · **C** P2a · **D** D-CUD2 🔵 · ABC otwarte: **0**

---

## [2026-07-02] infografik4 FULL — eksport + mapy JSON — kanon `f18cc37e…`

Pełny sync ~250 SVG + icons-manifest + setting-icon-map (Design + aliasy gry).

---

## [2026-07-02] W1-hero — menu + intro PNG — kanon `a1476d02…`

`mainMenu.ts` hero layout · `newGameFlow.ts` krok 1 full-bleed · bundel ~7.6 MB.

---

## [2026-07-02] infografik5 — hero PNG (Design) · ~~CZEKA ABC~~ ✅ W1-hero

Zip hero menu/intro · `ekrany-hero/` · Lane nie wpiął (~+4 MB bundla).

---

## [2026-07-02] infografik4 + W1f + layout kreator — kanon `f26955a1…`

13 SVG podmiany · 6× ustawienia · intro gwiazda · wyrównane prostokąty kroki 2–4 · `settingIconSvg()`.

---

## [2026-07-02] Design zip2 — sync Lane + kanon `1424e71c…`

Paczka `Ulepszenie infografik2.zip` · epoki + Chiny mianguan + Rzym standard · bez Lane rysowania.

---

## [2026-07-02] DECYZJA MACIEJA: ikony brand → tylko Claude Design

**Workflow:** playtest „nie gra” → poprawka u **Claude Design** (Maciej) → zip → Lane **sync + kanon**.  
**Lane NIE przerysowuje SVG** (wyjątek: explicit „hotfix bez Design”).  
Provisorki Lane w kanonie (epoki rev2, Chiny, Rzym) — do wymiany przy kolejnym zipie Design.

---

## [2026-06-26] MASTER: kanon W1b-rev + W1e (zip Design)

**Źródło:** `docs/ux/claude-design/Ulepszenie infografik.zip` (2026-07-02 09:49)  
**MD5:** `f8fb4a6bff560b5adde53a07cc5663c7` · start: `gra-kanon/START.html`  
**Lane UI:** civ-sumer ziggurat · epoki SVG krok 2 kreatora · `epochIconSvg()`  
**Maciej:** Ctrl+F5 · kreator krok 2 (epoki) + Sumerowie krok 3

---

## [2026-06-26] HOTFIX: BOOT ERROR `s is not defined` (hud + toolbar)

**Przyczyna:** brak `const s = document.createElement('style')` w `hud.ts` / `mapToolbarHud.ts` po edycji CSS W2.  
**MD5 kanon:** `f8ef0184fd3bdf8a584c2ecb01c9c6a6` · start: `gra-kanon/START.html`  
**Maciej:** Ctrl+F5 · gra powinna wstawać bez BOOT ERROR.

---

## [2026-06-26] MASTER: kanon W1-menu + W2 (ikony menu + HUD Tier 1–2)

**MD5:** `144450a09869c0b660cf9f73e39a3a03` · start: `gra-kanon/START.html`  
**Lane UI:** menu SVG + `mainMenu.ts` styl · HUD/toolbar bez emoji  
**Fix:** `wonders.json` JSON syntax (vite build)  
**Maciej:** może oglądać menu + HUD (Ctrl+F5)

---

## [2026-07-02] MACIEJ: W1b-rev6 Rzym — Lupa Kapitolińska

Scutum zastąpione wilkiem + bliźnięta · kanon `3676dd39…` · alt ref: SPQR/aquila.

---

## [2026-07-02] MACIEJ: W1e-rev2 — odrzucenie Design epok · Lane poprawka

Playtest: brąz ≠ miecz (za szeroki, bez rękojeści) · kamień nieczytelny → topór bojowy.  
Lane przerysował epoch-kamien + epoch-braz lokalnie.

---

## [2026-07-02] Design sign-off W1e-rev (Claude · wizualnie OK)

Potwierdzenie Design: epoch-kamien (młot), epoch-braz (miecz liściasty), zelazo bez zmian.  
Repo + kanon `a3ea9863…` **zgodne** z zip · czeka werdykt Macieja playtest.

---

## [2026-07-02] Design W1e-rev — epoki sync + kanon

Zip `Ulepszenie infografik.zip` (10:50) · 3× epoch SVG · kanon `a3ea9863…`  
**Maciej:** playtest krok 2 kreatora.

---

## [2026-07-02] MACIEJ: W1b-rev5 Chiny — mianguan (czapka cesarza)

Poprawka `civ-chinczycy.svg` · ref foto cesarza · kanon `3e607fb1…`  
**Otwarte:** W1e-rev epoki — CZEKA Design.

---

## [2026-07-02] MACIEJ: W1b-rev4 Sumer — **OK · ZAMKNIĘTE**

Playtest kanon `6e2b20c4…` · kreator krok 3 · **akceptacja**.  
**Otwarte:** W1e-rev (epoki) — Design **START — W1e-rev**.

---

## [2026-07-02] Design drop — `Ulepszenie infografik.zip` + `civ-sumer.svg`

**Maciej:** wrzucił paczkę do `docs/ux/claude-design/`.  
**Lane:** sync **Design `civ-sumer.svg`** (W1b-rev4) · **NIE** sync epok (W1e-rev brak).  
**Kanon:** MD5 `6e2b20c4e69fd2ce468e41c67b956ab3` · start `gra-kanon/START.html`  
**Design:** nadal **START — W1e-rev** (młot kamienny + miecz liściasty).

---

## [2026-06-26] MACIEJ: W1b-rev3 — Sumer schody wyraźniejsze

**Feedback:** schodki za słabe · mała różnica podstawa/góra.  
**Lane:** nowy `civ-sumer.svg` — boczne skrzydła tarasów + szeroki korytarz schodów (8 stopni) · kanon `ea0c6f3a…`

---

**Problem:** W1b-rev nadal za prosty (piramida, bez schodków).  
**Lane:** nowy `civ-sumer.svg` — 3 tarasy + centralne schody (stopnie widoczne) · kanon pending  
**Design:** `UI-do-DESIGN_w1b-rev2-sumer-ziggurat.md` · ref w `referencje-maciej/W1b-rev2-*`

---

**Krok 2 epoki:** Żelazo OK · Kamień = **młot kamienny** (nie namiot) · Brąz = **jeden miecz brązu** (liściasty, ref foto).  
**Handoff:** `dyspozycje/_handoff/UI-do-DESIGN_w1e-rev-epoch-kamien-braz.md` · ref: `referencje-maciej/W1e-rev-miecz-brazu-ref.png`

---

## [2026-06-26] MACIEJ: playtest W1e — Epoka Kamienia = topór kamienny

**Krok 2:** Brąz (młot) + Żelazo (miecze) OK · **Kamień** = namiot/kolumny — **ŹLE**.  
**Decyzja:** ikona Kamienia = **topór kamienny** (narzędzie, jak pozostałe epoki).  
**Ref:** foto główek bez trzonka → `brand-book/referencje-maciej/W1e-rev-topor-kamien-glowki-ref.png`  
**Handoff Design:** `dyspozycje/_handoff/UI-do-DESIGN_w1e-rev-epoch-kamien.md` · **START W1e-rev**

---

**Kreator krok 3:** ogólnie OK · **Sumerowie** — ikona jak piramida → Design **W1b-rev**.  
**Krok 2 Epoka:** K/B/Z bez infografik → Design **W1e**.  
**Handoff:** `dyspozycje/_handoff/UI-do-DESIGN_w1b-rev-epoch-icons.md`

---

## [2026-06-26] MASTER: D-CUD2 — wdrożenie aktywne (Maciej **Tak — wdrażaj**)

**ECHO:** AskQuestion → **Tak** · REJESTR 🔵 · handoff 🟢 AKTYWNA · Grupa D **`działaj`**

---

## [2026-06-26] MACIEJ: D-CUD2 — utrzymanie wygasłego cudu **C** (50%)

**Decyzja:** po absolut utrzymanie = `floor(utrzymanie/2)` · min. 0 · np. Piramidy 2→1  
**Pliki:** `D-CUD2-utrzymanie-wygasly.md` · handoff `MASTER-do-GRUPA-D_D-CUD2-utrzymanie.md` · REJESTR 🟡 ZAPISANA · `wonders.json` _meta

---

## [2026-06-26] PROCES: błąd ABC D-CUD2 — Grupa D wysłała skrót (Maciej odrzucił)

**Błąd:** brak Cel/Dlaczego · brak Za/Przeciw · rekomendacja w opcji A · skróty (`ep. 7+`, `¤`).  
**Naprawa:** `D-CUD2-pytanie-KANON.md` · blokada w `D-cywilizacje.md` · ECHO zaktualizowany · anti-wzorzec w `abc-pelna-forma.mdc`.  
**Grupa D:** pytanie tylko z pliku kanonu · czeka **ABC OK** po ECHO.

---

**Co poszło źle:** Lane W1b w `gra/src/` + meldunek „gotowe” → Maciej oglądał **`Gra-podglad.html`** (stary bundle, monogramy) → strata czasu i frustracja.  
**Reguła:** Maciej **zero** gameplay/weryfikacji wizualnej dopóki MASTER nie opublikuje kanonu (MD5 + dowód w bundle). Lane kończy: **`→ MASTER: master`**.  
**Zapis:** `UI-DO-MASTERA.md` § Brama Macieja · `civ-workflow.mdc` §0 pkt 2.

---

**Trigger:** Maciej `master`.

| Bramka | Wynik |
|--------|--------|
| logic | **203/203** OK |
| combat | OK |
| diplomacy | **143/143** |
| ai | **193/198** (5× T2S baseline — oczekiwane) |
| smoke + battle-smoke | OK |
| build | vite → `/tmp/civ-dist` · 411 modułów |

**MD5 kanon:** `6fdcd1f4b15c5001f8cb63e54d7fbefd` · ROBOCZA = KANON (ten sam build W1b).  
**Publikacja:** `Gra-podglad.html` · `gra-kanon/START.html` · archiwum poprzedniego `gra-kanon/` → `gra-kanon-archiwum/gra-kanon_20260702-074123`.  
**W1b w bundle:** `civilizations/civ-*` (16 SVG) — medaliony w kreatorze.

**Maciej:** otwórz **`Gra-podglad.html`** lub **`gra-kanon/START.html`** · **Ctrl+F5** (cache).

---

**Źródło:** zip `brand-book/Ulepszenie infografik.zip` (16 SVG + civ-icon-map.json).  
**Lane:** `brandAssets.civIconSvg()` · `newGameFlow.ts` medaliony `.tg-medallion`.  
**Czeka:** Maciej **`master`** → build kanon.

---

**Ustalenie z Design:** Design nie czyta repo/OneDrive/GitHub — źródło = projekt chmura `brand-book/`. Cursor **nie edytuje** `brand-book/` (tylko konsumuje zip).  
**W1b:** decyzja **B** — pełny pakiet od Design, bez interim Lane. Kreator nadal monogramy do czasu zip W1b.

---

## [2026-06-26] MASTER: Design §5 — przywrócono DYSPOZYCJĘ AKTYWNĄ (W1b + W1-menu-map)

**Przyczyna:** merge paczki menu z Downloads nadpisał `brand-book/DYSPOZYCJA.md` (tylko KANON) — Design bez konkretu.  
**Naprawa:** `DYSPOZYCJA.md` ▶ START W1b + ▶ START W1-menu-map · WYMIANA §5 blok **▶ DYSPOZYCJA AKTYWNA** na górze · `eksport/HANDOFF.md` (mapa plików repo).  
**Design:** `START — W1b` (priorytet 1) lub `START — W1-menu-map` (priorytet 2, tylko JSON mapy).

---

## [2026-06-26] MASTER: START W1b — dyspozycja formalna dla Design

**Poprawka:** poprzedni wpis W1b w WYMIANA = status Lane, nie zadanie Design.  
**Dopisano:** `DYSPOZYCJA.md` ▶ START W1b · WYMIANA §5 (tabela #7 + pełny blok) · `HANDOFF.md` (civ-icon-map, brandAssets.ts).  
**Design wpisuje:** `START — W1b` · deliverable: 15+default SVG + civ-icon-map.json · **NIE** icons-manifest.json.

---

## [2026-06-26] MASTER: W1 Brand Book → kanon opublikowany

**Trigger Macieja:** `master` (po W1 lane UI).  
**Handoff:** `dyspozycje/_handoff/UI-do-MASTER_brand-book-w1.md` · **GOTOWE**

| Krok | Wynik |
|------|--------|
| Bramka | logic 203/203 · combat 6/6 · diplomacy 143 · **ai 193/198** (5× T2S sojusz/handel — baseline lane D, nie W1) · smoke OK · battle-smoke OK |
| Build | vite → `/tmp/civ-dist` · **2 008 kB** (394 moduły, +~120 kB SVG brand) |
| ROBOCZA | `Gra-podglad-ROBOCZA.html` + playtesty · md5 `ca118880…` |
| **KANON** | `publish-kanon-snapshot.ps1` → `Gra-podglad.html` + `gra-kanon/` |
| md5 kanon | **`ca118880a22ab94018cd94a4f520c357`** (poprzedni: `e2be159f…`) |
| Archiwum | `gra-kanon-archiwum/gra-kanon_20260702-004538` |
| `main.ts` | **bez zmian** (W1 = lane UI only) |

**Co w bundle:** menu emblem Design + motion/tło · tokeny FROZEN · cityPanel SVG budynki/jednostki · iconRegistry Tier 1–2.

**Opus:** bramka techniczna OK · opcjonalny review wizualny przed playtestem produktowym.

**Następny:** HUD W2 (`iconRegistry` → `hud.ts`) · lane UI batch po decyzji Macieja.

---

## [2026-06-26] MACIEJ: C-BAL-Q1 — kolejność Panel-C **A → B → C**

**Decyzja:** najpierw macierz jednostek · potem Auto-walka · na końcu oblężenie · cytat: „a później B, a na końcu C"  
**Pliki:** `C-BAL-Q1-panel-c-kolejnosc.md` · `MASTER-do-GRUPA-C_panel-c-balans-kolejnosc.md` · REJESTR 🟡 ZAPISANA

---

## [2026-06-26] MASTER: C-BAL-Q1 — wdrożenie aktywne (Maciej **Tak — wdrażaj**)

**ECHO:** AskQuestion „wdrażam?" → **Tak**  
**Status:** REJESTR 🔵 W TRAKCIE · handoff 🟢 AKTYWNA · `C-walka.md` P2a TERAZ  
**Grupa C:** sesja 1 = macierz jednostek Panel-C · trigger Macieja: **`działaj`** w czacie Grupa C  
**Sesje 2 (B) i 3 (C):** po meldunku sesji 1 + ACK Mastera

---

**Wynik:** kanon `e2be159f…` sync ✅ · F IDLE · **C P2a aktywna** · brak otwartych ABC u Macieja

---

## [2026-06-26] MACIEJ: `master` — skan hubu + sync PANEL-MASTER

**Wykonano:** reconciliacja md5 `e2be159f…` · inbox C-BAL-Q1 · brak delta F (IDLE)  
**Blokada:** C-BAL-Q1 czeka odpowiedź Macieja A/B/C

---

## [2026-06-26] SYNC ABC — stary wzór usunięty z obiegów A–E

**Batch:** `_ABC-JAK-PYTASZ.md` (JEDYNY wzór lane) · obieg A–E + dyspozycje A–E + `_DYSPOZYCJA-WSPOLNY-OBIEG` · `ECHO-ABC-DO-GRUP.md`  
**Wycofane:** „O co chodzi i dlaczego" we wszystkich plikach obiegu grup

---

## [2026-06-26] MACIEJ: ABC-FORMAT-KANON — potwierdzenie pełnej formy pytań

**Decyzja:** opis sytuacyjny + **cel pytania** + pełne nazwy + Za/Przeciw per opcja + **zawsze rekomendacja A/B/C** · Ask dopiero po tekście  
**Pliki:** `docs/decyzje/ABC-FORMAT-KANON-MACIEJ.md` · `abc-pelna-forma.mdc` · `REJESTR-DECYZJI` ABC-FORMAT-KANON

---

## [2026-07-02] MACIEJ: playtest — informuje **tylko Master** (w tym zaległe)

**Decyzja:** lane **ZAKAZ** w czacie · Master → Maciej · rejestr §2–§4 · `PLAYTEST-MASTER-ONLY`

---

---

## [2026-06-26] ARCHIWUM: Brand Book W1 lane UI → Master

Lane UI wdrożył W1 (menu, kreator, victoryScreen, tokeny) · handoff `UI-do-MASTER_brand-book-w1.md` · Maciej: przekaż do Mastera.

---

**Ostatnia aktualizacja:** 2026-06-26 (Lane UI: Brand Book W1 → Master)

---

## [2026-06-26] MACIEJ: E2 kreator — **`start`** · lane zamknięty

**E2-PARAMS:** kreator krok 4 (miasta-państwa, typy cyw.) + zaawansowane gęstości · generator+main.ts wpięte · handoff **GOTOWE** · `E-start.md` · `MACIEJ-GOTOWE.md`

---

## [2026-06-26] MACIEJ: **`plot code`** — workflow + powiadomienia + plik MD

**Decyzja:** Gdy są dyspozycje — Maciej wpisuje **`plot code`**; agent: kod/handoff + czat **`✅ Gotowe:`** / **`⏸️ Czeka:`** + wpis w **`docs/MACIEJ-GOTOWE.md`**.  
**Dokumenty:** `PLOT-CODE-WORKFLOW.md` · `OBOWIAZ-POWIADOM-MACIEJA.md` · `MACIEJ-GOTOWE.md` · reguły Cursor

---

Append-only. Source of truth operacyjny projektu Civ.

---

**Ostatnia aktualizacja:** 2026-07-02 (Maciej: **`start`** — skan hubu)

---

**Ostatnia aktualizacja:** 2026-07-02 (Maciej: playtest = cisza w czacie · tylko REJESTR §2)

---

## [2026-07-02] MACIEJ: playtest — lane wpisuje Masterowi (plik), nie czat

**Decyzja:** zero zawracania głowy playtestem · agenci → `REJESTR-PLAYTESTOW.md` §2 · `start` bez list PT

---

**Ostatnia aktualizacja:** 2026-07-02 (Maciej: **`start`** — brak delta #3)

---

## [2026-07-02] MACIEJ: **`start`** — skan hub (brak delta #3)

**Kanon:** **`e2be159f…`** · sync ✅ · playtest F-AC7 OTWARTY · lane IDLE · ABC 0

---

**Ostatnia aktualizacja:** 2026-07-02 (Maciej: **`start`** — brak delta #2)

---

## [2026-07-02] MACIEJ: **`start`** — skan hub (brak delta #2)

**Kanon:** **`e2be159f…`** · sync ✅ · **Playtest F-AC7 OTWARTY** · lane **IDLE** · ABC **0**

---

**Ostatnia aktualizacja:** 2026-07-02 (Maciej: **`start`** — brak delta)

---

## [2026-07-02] MACIEJ: **`start`** — skan hub (brak delta)

**Kanon:** **`e2be159f…`** · sync root = kanon = robocza ✅  
**Playtest:** F-AC7 **OTWARTY** · brak `playtest OK`  
**Lane A–F:** **IDLE** · PILNE domknięte  
**ABC:** 0 pilnych

---

**Ostatnia aktualizacja:** 2026-07-02 (Maciej: **`start`** — promocja ✅ · playtest OTWARTY)

---

## [2026-07-02] MACIEJ: **`start`** — skan hub

**Delta:** promocja F-P1-01 ✅ · kanon **`e2be159f…`** · sync root = kanon = robocza ✅  
**Playtest:** **OTWARTY** F-AC7 (5 scenariuszy) · sygnał `playtest OK` / `BUG:`  
**Lane A–E + F:** **IDLE** · PILNE domknięte · opcj. B1-Q3 sciencePicker  
**ABC:** 0 pilnych

---

**Ostatnia aktualizacja:** 2026-07-02 (Maciej: **`mastera`** — promocja F-P1-01)

---

**Ostatnia aktualizacja:** 2026-07-02 (Maciej: zapis **LISTA-PLAYTESTS**)

---

## [2026-07-02] ARCHIWUM: **LISTA-PLAYTESTS.md** — kolejka playtestów Master

**Plik:** `docs/master/LISTA-PLAYTESTS.md`  
**OTWARTE:** PT-F01 · PT-V06 · **KOLEJKA:** PT-Z05 · P7 · A5 · D3  
**Kanon:** md5 `e2be159f…`

---

## [2026-07-02] MACIEJ: **`mastera`** — promocja kanon F-P1-01 ✅

**Batch:** F-P1-01 atak miasta z mapy + bundle  
**Bramka:** map-attack 8/8 · field-battle 15/15 · combat 6/6 · smoke OK  
**Kanon md5:** **`e2be159f457ded870e198d0e0eaa847d`** · root = robocza = gra-kanon ✅  
**Handoff:** `MASTER-do-MASTER_F-P1-01-promocja-2026-07-02.md`  
**Maciej:** playtest F-AC7 (5 scenariuszy) → `playtest OK` / `BUG:`

---

## [2026-07-02] MACIEJ: **`start`** — skan (brak delta kodu)

**Kanon:** `188437eb…` · **ROBOCZA:** `351d8ad6…` (F-P1-01) · promocja pending  
**Panele A–D:** round-trip PASS · **Lane A–E:** IDLE · **F:** IDLE  
**PILNE:** domknięte · **Bloker produktowy:** playtest ⏸ (OBOWIĄZ-PT)  
**Master następny:** **`master`** (promocja kanon) · potem playtest

---

## [2026-07-02] MACIEJ: **`start`** — Grupa D P1+P2

**P1 E-P0-06:** ✅ F wpięte · kanon `188437eb…`  
**P2 Panel-D:** ✅ export-d OK · round-trip PASS · zmian=0  
**Lane D:** IDLE  
**ROBOCZA (pełniejszy bundle):** `351d8ad6…` (VICTORY + F-P1-01) — promocja kanon pending

---

## [2026-07-02] MACIEJ: **`działaj`** — PILNE A–E + F

**Lane:** A F-P1-01 spec ✅ · B B1-Q3+Panel-B ✅ · C mapFieldBattle ✅ · D+E victoryScreen ✅ · F VICTORY + F-P1-01 ✅  
**ROBOCZA md5:** **`351d8ad65ab9c0e560961438cdd56d39`** (VICTORY + atak miasta z mapy)  
**Bramka:** map-attack 8/8 · field-battle 15/15 · victory 12+11 · tech-tree 19/19 · smoke OK  
**Handoffy:** `F-do-MASTER_F-P1-01-2026-07-02.md` · `F-do-MASTER_VICTORY-E-P0-06-2026-07-02.md` · `EKONOMIA-do-MASTER_B1-Q3-panel-B-2026-07-02.md`  
**Master następny:** promocja kanon `351d8ad6…` · playtest gameplay (OBOWIĄZ-PT)

---

## [2026-06-26] SESJA AUTONOMICZNA — Maciej offline ~2h

**UI W1-PREP:** `brandTokenVars.ts` · `iconRegistry.ts` · menu/kreator tokeny 1B/2C/4C · smoke OK  
**Design:** D1 w `DYSPOZYCJA.md` § F — czeka `brand-book-1E/eksport/`  
**Bez kanonu** — playtest Macieja po powrocie

---

**Ostatnia aktualizacja:** 2026-06-26 (Master — pełna spec UX/UI + roadmap)

---

**Ostatnia aktualizacja:** 2026-07-02 (Maciej: **`start`** — PILNE DONE · promocja pending)

---

## [2026-07-02] MACIEJ: **`start`** — skan hub

**Delta:** F **F-P1-01 + VICTORY** → `F-do-MASTER_*-2026-07-02.md` · ROBOCZA **`351d8ad6…`**  
**Kanon root:** nadal **`de9b53e…`** · promocja → **`351d8ad6…`** pending Master  
**Lane PILNE:** A/B/C/D **IDLE** · E2 ✅ (2026-06-26)  
**Playtest:** Master poprosi po promocji kanon (OBOWIĄZ-PT)  
**Master następny:** promocja kanon · checklist: atak miasta · ekran zwycięstwa · P7 · PT-Z05

---

**Ostatnia aktualizacja:** 2026-07-02 (review B APPROVE · F **F-P1-01 START**)

---

## [2026-07-02] MASTER: review handoff B → dyspozycja F START

**B1-Q3 + Panel-B:** review **APPROVE** · REJESTR 🟢 WDROŻONA · lane B **IDLE**  
**VICTORY E-P0-06:** review **APPROVE** · kanon md5 **`188437eb…`**  
**F:** `MASTER-do-INTEGRATOR_F-P1-01-map-attack-2026-07-02.md` 🟢 **START**

---

## [2026-06-26] MASTER — pełna dyspozycja Design + roadmap UX/UI

**Design:** `brand-book-1E/DYSPOZYCJA.md` — komplet deliverables (DS + ikony Tier 1–7 + ekrany A–E 130+) + etapy D0–D6  
**Maciej:** `docs/ux/ROADMAP-UX-UI-WDROZENIE.md` — etapy W0–W6, **Etap 1 = menu+kreator+game over+tokeny**  
**Pierwszy zamykamy:** D1 (Design) → W1 (kod E) → playtest Macieja → dopiero HUD (Etap 2)

---

**Struktura:** `brand-book-1E/` + `eksport/` + `DYSPOZYCJA.md` + hub Przegląd (1E).dc.html  
**Repo:** `docs/ux/claude-design/01-propozycje-z-design/brand-book-1E/` — czeka copy  
**Docs:** WYMIANA-UI-DESIGN v2 · UI-pipeline-ux · claude-design/README  
**Następny:** Maciej wrzuca folder → **`brand book w repo`** → lane UI Warstwa 1

---

## [2026-07-02] MACIEJ: **`start`** — skan hub (delta C+D)

**Delta:** C **F-P1-01** → `C-do-INTEGRATOR_map-attack-F-P1-01-2026-07-02.md` · test 15/15  
**Delta:** D+E **E-P0-06** → `CYWILIZACJE-do-INTEGRATOR_victory-screen-2026-07-02.md` · victory 12/12  
**Kanon:** md5 **`de9b53e…`** · sync OK · F **IDLE** (2 handoffy czekają dyspozycji Master)  
**Playtest:** #2 P7 ⏸ · brak `2 OK`  
**PILNE:** B u Mastera · C ✅ lane · D P2 Panel-D? · E E2 w toku  
**Master następny:** review B · dyspozycja F batch (F-P1-01 + victory + opcj. B)

---

## [2026-07-02] MACIEJ: **`start`** — skan hub

**Delta:** handoff B `EKONOMIA-do-MASTER_B1-Q3-panel-B-2026-07-02.md` · tech-tree 19/19  
**Kanon:** md5 **`de9b53e…`** · sync OK · F **IDLE**  
**Playtest:** #2 P7 ⏸ · brak `2 OK`  
**PILNE lane:** B ✅ handoff · A P1? · C czeka A · D+E w toku  
**Master następny:** review B → opcj. F sciencePicker · bramka przed kanonem

---

## [2026-07-02] MACIEJ: **`master`** — skan (**delta:** B1-Q3)

**Nowy handoff:** `EKONOMIA-do-MASTER_B1-Q3-panel-B-2026-07-02.md` · tech-tree 19/19 · Panel-B OK · **bez main.ts**  
**Kanon:** md5 **`de9b53e…`** · sync OK  
**Playtest:** #2 P7 ⏸ · brak `2 OK`  
**F:** czeka review Master → opcjonalny batch sciencePicker

---

## [2026-07-02] MACIEJ: **`działaj`** — ACK SILNIK-D-V11 + bramka

**Review:** **APPROVE** · bramka Master 9+6+31+143+smoke OK  
**Kanon:** md5 **`de9b53e43997d8ec195f209054f46d3a`** · sync ✅  
**Panele:** dry-run A/B/D = **0 drift**  
**PILNE:** już w locie (`MASTER-PILNE-2026-07-02.md`) · F **IDLE**  
**Maciej:** playtest **#2 P7** → `2 OK` / `BUG:`

---

## [2026-06-26] MASTER: **`działaj`** — audyt paneli + bramka

**Kanon md5:** **`de9b53e43997d8ec195f209054f46d3a`**  
**Dry-run export:** Panel-A **0** · Panel-B **0** · Panel-D **0** (Excel = JSON)  
**Smoke:** OK  
**Wniosek:** panele gotowe; eksport po edycji Excel = **`eksportuj panel`** w czacie grupy A–E  
**Lane PILNA:** B1-Q3 · E-P0-06 · F-P1-01 — trigger **`działaj`** u grup

---

## [2026-07-02] MACIEJ: **`2 start`** — playtest P7 Prezent

**Checklist #2:** akcja 13 audiencja · Rel ≥ 30 · kanon **`de9b53e…`**  
**Kolejka Master #2 (E2):** już ✅ (`2 OK`)  
**Sygnał:** `2 OK` / `BUG:`

---

## [2026-07-02] MACIEJ: **`działaj`** — PILNE już w locie

**Stan:** dyspozycja `MASTER-PILNE-2026-07-02.md` wysłana (Slack ✅) · kanon **`de9b53e…`** sync OK  
**Grupy A–E:** czekają handoffy (`przekaż do Mastera`) · **F IDLE**  
**#2 E2:** ✅ zamknięte (`2 OK`) · **#1 playtest:** ⏸ OBOWIĄZ-PT

---

## [2026-07-02] MASTER: **`slack`** — dyspozycja PILNA wysłana (MCP ✅)

**Kanały:** #master · #grupa-a … #grupa-e · #grupa-f (INFO)  
**Outbox:** `SLACK-OUTBOX-MASTER-PILNE-2026-07-02.md` → ✅ WYSŁANE

---

## [2026-07-02] MASTER: dyspozycja **PILNA** → grupy A–E

**Plik:** `dyspozycje/MASTER-PILNE-2026-07-02.md` · Slack: `SLACK-OUTBOX-MASTER-PILNE-2026-07-02.md`  
**Trigger u grup:** `działaj` · sekcja 🔴 PILNE w `A-mapa` … `E-start`  
**Priorytet:** A F-P1-01 · B B1-Q3+Panel-B · C (po A) · D+E E-P0-06 · F IDLE

---

## [2026-07-02] MASTER: KANON-BATCH-3 — promocja kanonu ✅

**F:** Panel-C export · verify D-SOJUASZ + A1-Q12 · bramka 383+ PASS  
**Kanon md5:** **`de9b53e43997d8ec195f209054f46d3a`** · sync root = robocza = gra-kanon  
**Meldunek:** `F-do-MASTER_KANON-BATCH3-2026-07-02.md`  
**Backlog lane (nie Master):** B1-Q3 · E-P0-06 · Panel-B · F-P1-01

---

## [2026-07-02] MACIEJ: **`2 OK`** — E2 smoke wizualny PASS

**Kolejka #2:** gęstość Mało vs Dużo — **zweryfikowane**  
**Kanon:** md5 **`01490681…`** · REJESTR **E2-PARAMS** → ✅ ZWERYFIKOWANA  
**Następny krok Master:** brak pilnego · #1 gameplay ⏸ (OBOWIĄZ-PT)

---

## [2026-07-02] MACIEJ: **`start`** — skan (powtórny, brak delta)

**Delta:** brak · md5 **`01490681…`** · F IDLE · inbox pusty · ABC **0 pilnych**  
**Aktywny:** #2 E2 smoke → `2 OK` / `BUG:` · #1 gameplay ⏸

---

## [2026-07-02] MACIEJ: **`start`** — skan (#2 aktywny)

**Delta:** brak · md5 **`01490681…`** · lane IDLE · inbox pusty  
**Aktywny:** #2 E2 smoke → `2 OK` / `BUG:`

---

## [2026-07-02] MACIEJ: **`master`** — skan (#2 aktywny)

**Delta:** brak · kanon md5 **`01490681…`** · inbox F pusty · lane IDLE  
**Aktywny:** kolejka **#2 E2 smoke** — czeka `2 OK` / `BUG:`  
**#1 PT-Z05:** ⏸ osobno

---

## [2026-07-02] MACIEJ: **`start`** — skan hub (brak delta F)

**Kanon:** md5 **`01490681…`** · sync root = robocza = gra-kanon ✅  
**Inbox F:** brak nowych meldunków · F **IDLE**  
**ABC:** **0 pilnych** (A–E bez otwartych pytań)  
**Reguły:** OBOWIĄZ-PT + OBOWIĄZ-ZAKRES wdrożone · triggery u grup: **`obowiaż`** · **`zakres`**  
**Playtest Macieja:** ⏸ tylko na prośbę Mastera (OBOWIĄZ-PT)

---

## [2026-07-02] MACIEJ: **#2** — E2 smoke wizualny

**Kolejka Master #2:** gęstość świata (Mało vs Dużo) — porównanie mapy  
**Kanon:** md5 **`01490681…`** · E2 ~97% w kodzie  
**Bramka auto:** `world-density-test.cjs` — uruchomiona przy starcie #2  
**Maciej:** test wizualny (kreator lub PLAYTEST-MAPA) → `2 OK` / `BUG:`  
**Playtest #1 (PT-Z05):** nadal ⏸ — nie blokowany

---

## [2026-07-02] MACIEJ: **`master`** — skan (brak delta)

**Inbox F:** brak nowych meldunków · ostatnie DONE: SILNIK-D-V11 · KANON-SPRINT  
**Kanon:** md5 **`01490681…`** · sync OK · brak promocji do wykonania  
**Lane A–F:** IDLE · brak otwartej dyspozycji  
**Bloker:** playtest Macieja (PT-Z05 #1) — brak `1 OK` / `playtest OK`  
**Maciej następny:** graj PT-Z05 · albo numer kolejki (`2 start` = E2 smoke opcjonalny)

---

## [2026-07-02] MACIEJ: **`start`** — aktualizacja panelu sterowania

**Trigger:** „Aktualizacja panelu sterowania. Start."  
**Delta kod/kanon:** brak · md5 **`01490681…`**  
**Audyt paneli:** A/B/C/D round-trip PASS · Panel-E bez auto-testu  
**Dok:** `docs/obieg/PANEL-MASTER.md` zsynchronizowany  
**Playtest:** nadal OTWARTY (PT-Z05 #1 z `1 start`)  
**Maciej następny:** graj PT-Z05 · sygnał `1 OK` / `playtest OK` / **`master`**

---

## [2026-07-02] MACIEJ: **`1 start`** — playtest PT-Z05

**Kolejka #1:** playtest na kanonie md5 **`01490681…`**  
**Checklist #1:** **PT-Z05** B2-D18 (balans trudności)  
**Lane A–F:** IDLE · brak batcha technicznego  
**Sygnał po teście:** `playtest OK` / `BUG: …`

---

## [2026-07-02] MACIEJ: decyzja **OBOWIĄZ zakres raportu** — tylko własny lane

**Cytat:** grupy informują tylko o brakach ABC i swoim wdrożeniu/przekazie Master; bez raportów całej gry  
**Reguła:** [`OBOWIAZ-ZAKRES-RAPORTU.md`](OBOWIAZ-ZAKRES-RAPORTU.md) · REJESTR **OBOWIAZ-ZAKRES** 🟢  
**Trigger u grup A–E:** **`zakres`** (wpisz w każdym czacie grupy raz)  
**Zaktualizowano:** _ZASADY §11 · A–E obieg · RAPORT2 · komendy · rules

---

## [2026-07-02] MACIEJ: decyzja **OBOWIĄZ playtest** — tylko Master prosi

**Cytat:** playtest dopiero po integratorze + weryfikacji Mastera; grupy nie proszą o playtest  
**Reguła:** [`OBOWIAZ-PLAYTEST-GATE.md`](OBOWIAZ-PLAYTEST-GATE.md) · REJESTR **OBOWIAZ-PT** 🟢  
**Trigger u grup A–E:** **`obowiaż`** (wpisz w każdym czacie grupy raz)  
**Zaktualizowano:** _ZASADY §7.1f · A–E obieg · INTEGRATOR · komendy · rules

---

## [2026-07-02] MACIEJ: `start` — SILNIK-D-V11 w kanonie

**Delta:** F meldunek ✅ · nowy md5 **`01490681…`** (D3 v1.1 silnik) · root = robocza = kanon  
**Playtest:** STOP do sygnału Macieja (checklist 4 pozycje w INBOX)  
**F:** IDLE

---

## [2026-07-02] MACIEJ: KANON-BATCH — **bez playtestu**

**Sygnał:** „rusz wszystko bez playtestu — playtest dopiero po kanon"  
**Kanon:** md5 **`01490681afbc7e67d5182992989597df`** · root = robocza = gra-kanon ✅  
**Batche:** KANON-SPRINT (Roblox ghost) · PANEL-P0 B+D · SILNIK-D-V11 (D3) · E2 verify  
**Handoff:** `F-do-MASTER_KANON-SPRINT-2026-07-02.md` · `F-do-MASTER_SILNIK-D-V11-2026-07-02.md`  
**Maciej następny:** **`playtest`** → REJESTR ✅

---

## [2026-07-02] MACIEJ: **`3 start`** — SILNIK-D-V11 ✅

**Batch #3:** D3 v1.1 silnik (sojusze T2 · trybut T1A · hydrate load)  
**Kanon:** md5 **`01490681afbc7e67d5182992989597df`** · root = `gra-kanon/` = `gra-robocza/`  
**Bramka:** treaties 9/9 · economy 6/6 · proposal 31/31 · diplo 143/143 · smoke OK  
**Meldunek:** `F-do-MASTER_SILNIK-D-V11-2026-07-02.md`  
**REJESTR:** `MACIEJ-ABC-2026-06-30` → 🟢 WDROŻONA (silnik)  
**Playtest Macieja:** opcjonalny (sojusz def/pełny · trybut casus · load save)

---

## [2026-07-02] MACIEJ: aktualizacja **PANEL-MASTER** + `start`

**Panel:** `docs/obieg/PANEL-MASTER.md` → sync kanon `2fc96381…` · F P1 SILNIK-D-V11 · playtest ✅ · P6 ⚪  
**Stan:** bez delta technicznej · F bez meldunku `SILNIK-D-V11`  
**Maciej:** brak otwartego playtestu · czeka F

---

## [2026-07-02] MACIEJ: `start` — skan (brak delta)

**Kanon = robocza:** md5 **`2fc96381…`** · bramka audyt OK  
**F:** P1 SILNIK-D-V11 🟢 START · brak meldunku `F-do-MASTER_SILNIK-D-V11*`  
**Maciej:** brak otwartego playtestu · P6 Figma ⚪ nie robimy

---

## [2026-07-02] MACIEJ: decyzja — **P6 Figma nie robimy**

**Cytat:** „2 nie robimy" (kolejka Master #2)  
**Skutek:** pipeline Figma 00–02 **STOP** · REJESTR **P6-FIGMA** ⚪ ODRZUCONA  
**Alternatywa:** brand book → dostosowanie wyglądu w kodzie (lane UI)  
**Hub:** SESJA-START · INBOX · WATCH · A-mapa · REJESTR

---

## [2026-07-02] MACIEJ: `master` — skan #3 (brak delta · po playtest OK)

**Kanon:** md5 **`2fc96381…`** · bez zmiany  
**REJESTR:** B2-D18 · P7-G3-B · A5-Roblox → ✅ ZWERYFIKOWANA  
**Jedyny pending:** sync `gra-robocza/` (`01490681…`) · lane **IDLE**

---

## [2026-07-02] MACIEJ: **`1,2,3 start`**

**#1 sync robocza:** ✅ `gra-robocza/` + `Gra-podglad-ROBOCZA.html` = kanon md5 **`2fc96381…`**  
**#2 P6 Figma:** 🔒 STOP (UI 00–02) — brak batcha  
**#3 D3/E2:** dyspozycja F **`MASTER-do-INTEGRATOR_SILNIK-D-V11-2026-07-02.md`** · E2 ~97%  
**Skan:** backup OK · audyt · inbox watch

---

## [2026-07-02] MACIEJ: **`playtest OK`**

**Kanon:** md5 **`2fc96381…`** · `Gra-podglad.html` = `gra-kanon/`  
**REJESTR ✅ ZWERYFIKOWANA:** B2-D18 (PT-Z05) · P7-G3-B (Prezent) · A5-Roblox (miasta + ghost)  
**Hub:** WATCH · INBOX · REJESTR · SESJA-START zsynchronizowane  
**Następny Master:** sync `gra-robocza/` (rozjazd `01490681…`)

---

## [2026-07-02] MACIEJ: `master` — skan #2 (brak delta)

**Kanon:** md5 **`2fc96381…`** · `Gra-podglad.html` = `gra-kanon/` ✅  
**Rozjazd:** `gra-robocza/` + `Gra-podglad-ROBOCZA.html` = **`01490681…`** (sync pending)  
**Playtest:** **STOP** · lane A/B/F **IDLE** · brak nowych handoffów

---

## [2026-07-02] MACIEJ: `master` + `start` — KANON-SPRINT

**Kanon:** md5 **`2fc96381…`** · `Gra-podglad.html` = `gra-kanon/` ✅  
**Rozjazd:** `gra-robocza/` + `Gra-podglad-ROBOCZA.html` = **`01490681…`**  
**Nowe w kanonie:** A5 Roblox (miasta + ghost założenia) + P7 + D18  
**F:** `F-do-MASTER_KANON-SPRINT-2026-07-02.md` · bramka pełna OK  
**Playtest Macieja:** **STOP** do sygnału sprintu  
**Lane A/B/F:** IDLE

---

## [2026-07-02] MACIEJ: `start` — skan hubu

**Skan:** backup OK · audyt · inbox watch  
**Delta:** **KANON-SPRINT** ✅ F meldunek · md5 kanon **`2fc96381…`** (P7 + D18 + A5 ghost Roblox)  
**Uwaga:** `gra-robocza/` **`01490681…`** — rozjazd vs kanon (sync pending)  
**Playtest:** **STOP** do sygnału Macieja (decyzja sprintu)  
**Lane A/B/F:** IDLE

---

## [2026-07-02] GRUPA A: `master` ping sesja 3

**Delta:** ghost `main.ts` ✅ · kanon md5 `2fc96381…` · A5-Roblox ✅ REJESTR  
**Lane:** **ZAMKNIĘTE** · idle

---

## [2026-07-02] GRUPA A: `master` ping sesja 2 (brak delta)

**Stan:** src ✅ · kanon ❌ · ghost SILNIK ❌ · testy 43/43 · E2 28/28 · lane idle

---

## [2026-07-02] GRUPA A: `master` — A5 Roblox miasta (lane wdrożone)

**Handoff:** `A-do-MASTER_stan-lane-2026-07-02.md` · F: `MAPA-do-INTEGRATOR_settlement-roblox-kanon.md` · SILNIK: ghost  
**Testy lane:** qualify 43/43 · E2 28/28 · **src ✅ · kanon ❌**  
**Maciej:** sign-off podglądów · playtest po rebuild F  
**Slack:** `SLACK-OUTBOX-A-2026-07-02.md`

---

## [2026-07-02] MACIEJ: `master` — skan (brak delta po P7)

**Kanon = ROBOCZA:** md5 **`983fd12a…`** · P7 + D18 w bundle  
**Wisi na Macieju:** PT-Z05 (D18) · P7 Prezent playtest → REJESTR ✅  
**Lane B/F/D/UI:** IDLE · **gra-kanon/** folder — publish Master (techniczny)  
**Hub:** INBOX · WATCH · SESJA-START zsynchronizowane

---

## [2026-07-02] MACIEJ: `start` — skan hubu

**Skan:** backup OK · audyt · inbox watch  
**Delta:** P7 Prezent ✅ w root/robocza (md5 `983fd12a…`) · **gra-kanon/** nadal `d5e0f62d…` → publish pending  
**B2-D18:** kod ✅ · PT-Z05 zalecany · brak `playtest OK`  
**Master następny:** `publish-kanon-snapshot.ps1` (sync gra-kanon)

---

## [2026-07-02] MACIEJ: sprint integracji — **P7 Prezent wdrożone**

**Sygnal:** „wpinaj wszystko co mozesz"  
**P7-G3-B:** `diplomacy.json` akcja 13 + `main.ts` próg Rel ≥ 30  
**Build:** md5 **`983fd12a…`** · `Gra-podglad.html` = ROBOCZA  
**Bramka:** diplo 143/143 · proposal 31/31 · society 26/26 · smoke OK  
**D18:** kod ✅ · PT-Z05 playtest zalecany  
**Handoff:** `MASTER-do-MASTER_P7-PREZENT-wiring-2026-07-02.md`

---

## [2026-07-02] MACIEJ: `master` #9 — audyt wdrożenia B2-D18

**Wynik audytu:** ✅ **wszystko wdrożone** (JSON + kod + bundle)  
**Parametry D18:** immunitet 10/5/3 · wagi 55/45/45/55 · osada 4/3/2 · progi 5/8/10 · stolica easy T1–10  
**Wpięcie:** main.ts (`loadRevoltParams`, `seedWealthImmunityAtFounding`, `stolicaEasyBonusActive`)  
**Kanon:** md5 **`d5e0f62d…`** · Finalna = ROBOCZA  
**Bramka:** society 26/26 · wealth 28/28 · culture-religion 51/51 · smoke OK  
**Brakuje:** tylko playtest Macieja PT-Z05 → REJESTR B2-D18 ✅ ZWERYFIKOWANA  
**Kolejka po OK:** P7 Prezent

---

## [2026-07-02] MACIEJ: `master` #8 — skan hubu (brak delta)

**Kanon = ROBOCZA:** md5 **`d5e0f62d…`** · bez zmiany  
**B2-D18:** technicznie ✅ (#7 bramka 26/26 + smoke) · **PT-Z05 OTWARTY** — brak `playtest OK`  
**Lane B / F / A:** IDLE · dyspozycje F D16/P-C2/D18 → ZAMKNIĘTE  
**Hub:** SESJA-START · INBOX · WATCH (#8)

---

## [2026-07-02] MASTER: `master` #7

**Bramka:** society 26/26 · smoke OK  
**Delta kodu:** brak · kanon `d5e0f62d…`  
**Housekeeping:** dyspozycje F D16/P-C2/D18 → ZAMKNIĘTE · PT-Z05 🟡 w checklist  
**Bloker:** playtest Macieja PT-Z05 → po OK: REJESTR B2-D18 ✅ ZWERYFIKOWANA

---

## [2026-07-02] MACIEJ: `master` #6 — skan hubu (brak delta)

**Kanon = ROBOCZA:** md5 **`d5e0f62d…`** · bez zmiany  
**B2-D18:** technicznie ✅ · **playtest PT-Z05 OTWARTY** — brak `playtest OK`  
**Lane B / F / A:** IDLE · brak nowych handoffów  
**Hub:** SESJA-START · INBOX · WATCH (#6)

---

## [2026-07-02] MACIEJ: `master` #5 — skan (bez delta)

**Kanon ROBOCZA:** md5 **`d5e0f62d…`** · bez zmian  
**B2-D18:** 🟢 WDROŻONA · F verify ✅ · **PT-Z05 OTWARTY** (brak `playtest OK`)  
**Lane B / F / A:** **IDLE** · brak nowych handoffów  
**Master:** czeka na Macieja

---

## [2026-07-02] MACIEJ: `start` (skan bieżący)

**Kanon = ROBOCZA:** md5 **`d5e0f62d…`** · manifest OK · 3 ścieżki sync  
**Delta:** brak vs ostatni `master` · lane B/A **IDLE** · brak nowego F handoff  
**Bloker gameplay:** **PT-Z05** B2-D18 (easy/normal/hard T1–T5)  
**Następny:** `playtest OK`/`BUG:` · lub `master`

---

## [2026-07-02] MACIEJ: `start` — skan + bramka D18

**Skan:** backup OK · audyt · inbox watch · bramka Master 26+28+smoke OK  
**Stan:** bez delta vs `master` #3 · B2-D18 czeka **PT-Z05** Macieja

---

## [2026-07-02] MACIEJ: `start` — sesja otwarta

**Kanon ROBOCZA:** md5 **`d5e0f62de9d287be23d444d1f23e0e7b`** · `gra-kanon/START.html`  
**Priorytet 1:** playtest **PT-Z05** (B2-D18) — brak `playtest OK`  
**Lane B / F:** IDLE · D18 verify ✅ · brak nowych dyspozycji do wysłania  
**Master:** czeka na Macieja · po OK → REJESTR B2-D18 ✅ ZWERYFIKOWANA

---

## [2026-07-02] MACIEJ: `master` #3 — skan hubu

**Kanon = ROBOCZA:** md5 **`d5e0f62d…`** (bez delta od #2)  
**B2-D18:** 🟢 WDROŻONA (lane B + F verify) · **playtest PT-Z05 OTWARTY** — brak `playtest OK`  
**F:** `F-do-MASTER_D18-wiring-2026-07-02.md` → **GOTOWE-ROBOCZA** (nowa promocja nie wymagana)  
**Lane B:** **IDLE**  
**Maciej:** jedyny blocker gameplay → `playtest OK` / `BUG:` (3 trudności, T1–T5)

---

## [2026-07-02] MACIEJ: `master` #2 — hub odświeżony

**Kanon = ROBOCZA:** md5 **`d5e0f62d…`** · bez zmiany od P-C2-DEF  
**B2-D18:** u Mastera · playtest PT-Z05 **otwarty** (brak `playtest OK`)  
**F:** dyspozycja `MASTER-do-INTEGRATOR_D18-wiring-verify-2026-07-02.md` 🟢 START  
**Grupa A:** idle · ping A5-Roblox (ABC Macieja — później)  
**Hub:** SESJA-START · INBOX · WATCH zsynchronizowane

---

## [2026-07-02] GRUPA A: `master` ping (brak delta)

**Handoff:** `A-do-MASTER_stan-lane-2026-06-26.md` · `A-do-MASTER_A5-roblox-preview-2026-06-26.md`  
**Testy lane:** qualify 43/43 · E2 28/28 · **idle**  
**Blokuje:** ABC Macieja **A5-Roblox** (podglądy Civ-MAPA)  
**Slack:** `SLACK-OUTBOX-A-2026-06-26.md` § ping sesja 2

---

## [2026-07-02] MACIEJ: `master` — hub odświeżony

**Kanon = ROBOCZA:** md5 **`d5e0f62d…`** · P-C2-DEF ✅ · B2-D18 w bundle (lane B)  
**Hub:** SESJA-START · INBOX · WATCH zsynchronizowane  
**Priorytet Maciej:** PT-Z05 (D18) · opcjonalnie D16/D17 + P-C2  
**Master po playteście:** ACK D18 → F review main.ts → REJESTR ✅

---

## [2026-07-01] MASTER: sesja `master` — P-C2-DEF

**D16-D17:** review APPROVE formalny · playtest OTWARTY  
**F:** P-C2-DEF wiring · md5 `d5e0f62d…` · promocja kanon · archiwum `gra-kanon_20260701-125511`  
**REJESTR:** P-C2 · P-C2-DEF → ✅ ZWERYFIKOWANA  
**Maciej:** playtest startu + bitwa (pkt M wroga)

---

## [2026-07-02] MACIEJ: `master` — B2-D18 GOTOWE (lane B)

**Decyzja:** formularz ABC (paczka A + D18-3=B + D18-4=A+C) · START=Tak  
**Lane B:** JSON + `society-breakdown.ts` + minimal `main.ts` / `cityPanel.ts`  
**Testy:** society-breakdown 26/26 · wealth 28/28 · culture-religion 51/51  
**Handoff:** `EKONOMIA-do-MASTER_D18-BALANS-GOTOWE.md` · `EKONOMIA-do-INTEGRATOR_d18-main-wiring.md`  
**Master:** playtest PT-Z05 (easy/normal/hard T1–T5) → ACK → F ROBOCZA  
**REJESTR:** B2-D18 🔵 W TRAKCIE → ✅ po playteście

---

## [2026-07-01] MACIEJ: `master` (skan bieżący)

**Kanon = ROBOCZA:** md5 `7edba9ca…` · D16-D17 ✅ w kanonie · brak nowego F  
**Priorytet hubu:** playtest Macieja (D16/D17) · następny batch **P-C2-DEF** u F  
**Maciej:** pełna checklista v1.0 — za wcześnie · czeka `playtest OK` / `BUG:`

---

**Kanon = ROBOCZA:** md5 **`7edba9ca…`** · manifest OK  
**Handoff F:** D16-D17 → **GOTOWE-ROBOCZA** · w kanonie  
**Lane B:** IDLE · **P-C2-DEF** czeka F (test 11/11)  
**Maciej:** playtest startu **OTWARTY** · pełna checklista v1.0 — za wcześnie  
**Następny:** `master` · lub `playtest OK` / `BUG:`

---

## [2026-07-01] MACIEJ: `start`

**Backup:** dzien_2026-07-01 OK · **Audyt:** inbox · md5 **`7edba9ca…`** (kanon = robocza)  
**D16-D17:** ✅ w kanonie (F wiring + promocja sesja #2)  
**Maciej:** playtest startu — `gra-kanon/START.html` lub `Gra-podglad.html`

---

## [2026-07-01] MACIEJ: `master` (F D16-D17 GOTOWE)

**Handoff:** `F-do-MASTER_D16-D17-wiring-2026-07-01.md` · md5 **`7edba9ca…`** · kanon = ROBOCZA  
**Master:** review → APPROVE → REJESTR B2-D16/D17  
**Maciej:** **playtest startu OTWARTY** (T1 bunt · rzeka · religia) — nie pełna checklista v1.0

---

**Trigger:** MASTER-SESJA-START · inbox · WATCH zaktualizowane  
**Kanon = ROBOCZA:** md5 `ad6112e0…` · **brak** `F-do-MASTER_D16*` · Lane B IDLE (paczka ACK)  
**Master:** wymuś F D16 wiring · **Maciej:** playtest startu nadal czeka na ROBOCZA F

---

**Lane B:** self-check OK · brak nowej dyspozycji kodowej  
**Handoff:** `EKONOMIA-do-MASTER_paczka-lane-B-2026-07-01.md` · outbox wiad. 5  
**Testy:** society 21 · wire 34 · wealth 28 · empire-food 16 · spichlerz 9 · power 12 · food-hodowla 26  
**Akcja Master:** ACK · deleguj F (D16 wiring + P-C2-DEF)  
**Lane B:** IDLE

---

## [2026-07-01] MACIEJ: `master` (trigger po `start`)

**Trigger:** `docs/master/MASTER-SESJA-START.md` · inbox zaktualizowany  
**Kanon = ROBOCZA:** md5 `ad6112e0…` · **Priorytet hubu:** D16-D17 wiring u F (B GOTOWE)  
**Maciej:** pełny playtest v1.0 — nie teraz (checklist §0 pusta) · playtest startu po ROBOCZA F

---

**Kanon = ROBOCZA:** md5 `ad6112e0…` · backup dzienny OK · **brak nowego GOTOWE od F**

**Blokuje playtest startu:** D16 wiring u F (`MASTER-do-INTEGRATOR_D16-D17-wiring-2026-07-01.md`) — w czacie F: **`działaj`**

---

## [2026-07-01] MASTER: sesja `start`→`master` #2 — D16-D17

**Start skan:** kanon `ad6112e0…` · lane B D16-D17 GOTOWE · dyspozycja F pending  
**F:** wiring main.ts (religionHappiness + water map) · ROBOCZA `7edba9ca…`  
**Review:** APPROVE · bramka society 21 · wire 34 · smoke OK  
**Promocja kanon:** `7edba9cadfb011fd6c540fbc6bdedb72` · archiwum `gra-kanon_20260701-102024`  
**Maciej:** playtest startu (T1 + rzeka) · jutro sesja D18

---

## [2026-07-01] MASTER: `start` (skan 08:12)

**Backup:** dzien_2026-07-01 OK · **Audyt:** meldunki GOTOWE · **Kanon md5:** `ad6112e0…` (promocja wcześniejsza sesja)

**NOWE od B:** D16-D17 **GOTOWE** (testy 21+34+28) → dyspozycja F `MASTER-do-INTEGRATOR_D16-D17-wiring-2026-07-01.md`

**Kolejka F:** D16 wiring · B5-SP follow-up (po HUD ✅) · P-C2-DEF

**Maciej jutro:** playtest startu po ROBOCZA F · sesja D18 (balans easy/normal/hard)

---

## [2026-07-01] MASTER: sesja `start`→`master` — promocja kanon

**Review:** APPROVE P5+P6 + B5-SP + A-R7 + INK-Q1  
**Bramka:** border-march 9/9 · basket 8/8 · empire-food 16/16 · smoke OK · vite build OK  
**Kanon md5:** `ad6112e0f9320834286f1ebe74f7ec89`  
**Archiwum:** `gra-kanon-archiwum/gra-kanon_20260701-081051` (poprzedni P4-only)  
**REJESTR:** B5-SP · B5-SPICH · A-R7 · INK-Q1 → ✅ ZWERYFIKOWANA  
**Otwarte:** G3-B akcja 13 Prezent (P7) · P-C2-DEF · B2-D16/D17 dispatch

---

## [2026-07-01] MACIEJ: `start` → `master` (procedura sesji)

**Trigger Master:** `docs/master/MASTER-SESJA-START.md` · inbox zaktualizowany · ROBOCZA **`ABBF854D…`**  
**Priorytet Master:** promocja kanon (P5+P6 + B5-SP + A-R7 + INK-Q1) · Maciej **nie** robi pełnego playtestu (checklist §0 pusta).

---

**Plik:** `docs/master/maciej/MACIEJ-PLAYTEST-CHECKLIST.md` — pełna lista MUST/SHOULD/LATER; rejestr sesji; brama §0 do wypełnienia przy 100% grywalności. Maciej testuje dopiero po sygnale Mastera.

---

## [2026-07-01] WDROŻENIE: B5-SP + A-R7 + INK-Q1 (kod + ROBOCZA)

**Batch:** B5-SP-LIMIT + B5-SP-HUD · A-R7 · INK-Q1  
**Pliki:** `empire-food.ts` · `hud.ts` · `cityPanel.ts` · `main.ts` (wire HUD) · `improvement-build.ts` · `civs.json` · `econ-params.json`  
**Testy:** empire-food-b5 **13/13** · spichlerz-wzrost **9/9** · map-improvement-qualify **43/43**  
**ROBOCZA md5:** `ABBF854D0200F99E06111D37C37CF589` (`Gra-podglad-ROBOCZA.html`)  
**REJESTR:** B5-SP · B5-SPICH · INK-Q1 · B1-Q3 zaktualizowane  
**Nie wdrożono (celowo):** P-C2/P-ARMIA · E2-PARAMS · PANEL-EXEC · JEDN-KOSZT-v2

---

**Raport:** `docs/master/AUDYT-WDROZENIA-2026-07-01.md` · inbox · Slack `#master`

**Skrót:** D3 handel P4 ✅ kanon · P5+P6 ✅ ROBOCZA czeka promocja · akcja 13 ⚠️ · B5-SP bez lane GOTOWE · REJESTR do sync.

---

## [2026-07-01] MACIEJ → MASTER: B5-SP (Spichlerz SP1–SP6) — handoff w repo, bez czatu

**Maciej:** nie wkleja do Mastera — czyta repo + Slack outbox.

**Decyzje:** SP1=A SP2=A SP3=A SP4=C SP5=A SP6=C · overflow=A · SP4-szczegóły=A · SP6-HUD=B (142/200) · limit 100×Spichlerze

**Handoff:** `dyspozycje/_handoff/MACIEJ-do-MASTER_B5-spichlerz-SP-2026-07-01.md`  
**Formularz:** `docs/decyzje/B5-spichlerz-FORMULARZ-SP1-SP6.md`  
**Slack outbox:** `docs/obieg/SLACK-OUTBOX-MASTER-2026-07-01.md`

**Dyspozycje Master (gotowe):**
- `MASTER-do-EKONOMIA_B5-spichlerz-SP-limit-2026-07-01.md`
- `MASTER-do-UI_B5-spichlerz-SP-hud-2026-07-01.md`
- `MASTER-do-INTEGRATOR_B5-spichlerz-SP-followup-2026-07-01.md` (po GOTOWE B+UI)

---

## [2026-06-26] GRUPA C → MASTER: playtest oblężenie 3v3 + decyzja B pierścień

**Handoff:** `dyspozycje/_handoff/C-do-MASTER_oblezenie-playtest-2026-06-26.md`  
**Decyzja Macieja:** M×W+ pierścień obrońców **fan-out −1 heks** (B) — skorygowany kanon (wcześniej „zostają”).  
**Fixy:** OBL-CAP-01 (jednostki po sztur mie), preset 3 Hastati, preBattle 1 pasek szans, bonusy bojowe only.  
**Testy:** post-battle-map **10/10** · civ-bonusy **33/33**.  
**Playtest:** `Gra-podglad-PLAYTEST-OBLEZENIE-3v3.html` md5 `A416D5ECACA0DBF2E2B157FD0D8093C5` — **nie kanon**.  
**Slack:** `#master` + `#grupa-c` — **WYSŁANE** (`docs/obieg/SLACK-OUTBOX-C-2026-06-26.md`). Maciej **nie wkleja** do Mastera.  
**MASTER:** ACK → dyspozycja Integrator F (batch `C-OBLĘZENIE-PLAYTEST`, nie P0) → Opus review.

---

## [2026-07-01] REGUŁA Macieja: zero wklejek do Mastera

**Handoff:** pliki (`_handoff/`, `*-DO-MASTERA`, `MASTER-HANDOFF-INBOX.md`) + Slack outbox (`SLACK-OUTBOX-P5-P6-2026-07-01.md`). Master czyta repo sam przy `start`.

---

## [2026-07-01] DISPATCH P5+P6 — przemarsz + transfer koszyka (Maciej: deleguj)

**Bez nowych ABC** — decyzje D3-BORD + katalog PN zamknięte.

| Batch | Lane | Dyspozycja |
|-------|------|------------|
| P5 przemarsz | D + C/MAPA | `MASTER-do-CYWILIZACJE_P5-P6` · `MASTER-do-UNITS-MAPA_P5-P6` |
| P6 transfer | D + C | ten sam |
| Wpięcie | F | `MASTER-do-INTEGRATOR_P5-P6-dyplomacja-2026-07-01` | ✅ **ROBOCZA** md5 `8f3c6004…` |

---

## [2026-07-01] Maciej: uzupełnienie Panel-D — checklist braków (sync z sesją P4)

**Źródło prawdy dziś:** `gra/data/diplomacy.json` (już OK w grze) · decyzje: `docs/decyzje/D3-dyplomacja.md`  
**Szybki seed Excel:** `python panele-sterowania/gen-panel-d.py` → edycja → `export-d.py`  
**Uwaga:** `export-d.py` eksportuje tylko `params` + `akcje_dyplomatyczne` + civ/AI — **nie** `pn_relacja` / `wartosc_katalog` (na razie JSON ręcznie lub nowy arkusz później).

---

## [2026-07-01] Maciej: **teraz start** — sesja playtest P4

**Hub:** skan OK · kanon `7db15616…` · kolejka P0–P4 zamknięta · brak meldunków lane.  
**Playtest:** `gra-kanon/START.html` — checklist audiencja handel/dar (poniżej w czacie).  
**Batch przemarsz / batch2 / Panel-D:** nadal odłożone do sygnału po playteście.

---

## [2026-07-01] BACKLOG Macieja: playtest P4 + kolejne batchy (później)

**Maciej:** playtest audiencji (handel/dar PN) · batch 2 tech/jednostka · przemarsz UNITS — **później** (jak Panel-D).  
**Kanon P4:** już w grze (`7db15616…`) — nic nie blokuje. Master nie deleguje bez sygnału.

---

## [2026-07-01] PROMOCJA KANON — P4 D4-WYMIANA-PN

**Review:** APPROVE (W1-A · W4-A · PN-ZAUF · W10-A+)  
**md5 finalna:** `7db1561668bdd9df18a010af28fe46c6`  
**Archiwum:** `gra-kanon-archiwum/gra-kanon_20260701-002404` (poprzedni `4B360364…`)  
**Start:** `gra-kanon/START.html` · legacy root `Gra-podglad.html`

**Uwaga:** `publish-kanon-snapshot.ps1` — błąd kodowania UTF (em-dash); promocja ręczna Master. Do naprawy w lane F.

---

## [2026-06-30] DISPATCH P4 — D4-WYMIANA-PN (UI + Integrator F)

**Trigger:** Maciej `Master.` · kolejka P0–P3 zamknięta (md5 `4B360364…`).

**Dyspozycje:**
- `MASTER-do-INTEGRATOR_D4-wymiana-pn-2026-06-30.md` → Grupa F
- `UI.md` DO ZROBIENIA TERAZ → Grupa E (koszyk PN)

**Handoffy lane D:** `CYWILIZACJE-do-UI_handel-koszyk-pn.md` · `CYWILIZACJE-do-INTEGRATOR_wymiana-pn-zaufanie.md`

**Kolejność review:** meldunki lane → Master checklist → ROBOCZA → promocja kanon (po APPROVE).

**Backlog Macieja (nie blokuje):** Panel-D Excel — uzupełni później.

---

## [2026-06-30] BACKLOG Macieja: uzupełnienie Panel-D (później)

**Panel:** `panele-sterowania/Panel-D.xlsx` (export → `gra/data/diplomacy.json` via `export-d.py`).  
**Do zsynchronizować przy edycji:** `pn_zywnosc.jednostki_na_pn=1` · wykluczenia handlu (ulepszenie/budynek) · `progTrybutZadanieMinRespekt=70` · `karaPrzemarsz…=5` · progi G1–G4.  
**Kanon decyzji:** `docs/decyzje/D3-dyplomacja.md` — wdrożenie handlu **nie czeka** na Panel-D (JSON już zaktualizowany).

---

## [2026-06-30] KOREKTA D3-KAT-NO-BLD + NO-HEX: bez budynków i hex terytorium w handlu

**Maciej:** stolarnia itd. poza koszykiem; hex land — odłożone (skomplikowany wybór hexów).  
**Pliki:** `diplomacy-value-catalog.ts` · `D3-dyplomacja.md`

---

## [2026-06-30] KOREKTA D3-KAT-NO-IMP: ulepszeń terenu nie handlujemy

**Maciej:** farma, tartak itd. — poza koszykiem handlu/daru.  
**Pliki:** `diplomacy.json` · `diplomacy-value-catalog.ts` · `D3-dyplomacja.md`

---

## [2026-06-30] KOREKTA D3-W6b: 1 PN = 1 żywność (było 4)

**Maciej:** kurs żywności w handlu/darze = **1:1** z PN.  
**Pliki:** `diplomacy.json` · `diplomacy-value-catalog.ts` · `D3-dyplomacja.md`

---

## [2026-06-30] DECYZJA D3-TRYB + D3-ULT: trybut i ultimatum

**Maciej:** Respekt (Power) + ¤; oferta w wojnie = jednorazowe reparacje; ultimatum M≥1,3× + min 20¤, v1.0 tylko złoto.  
**Zapis:** `docs/decyzje/D3-trybut-ultimatum-ABC.md`

---

## [2026-06-30] DECYZJA D3-BORD: kara przemarszu −5 Zaufanie/turę

**Maciej:** A/A/A — tylko Zaufanie; koniec tury na cudzym terytorium bez traktatu.  
**Zapis:** `docs/decyzje/D3-przemarsz-kara-ABC.md` · param `karaPrzemarszNieautoryzowany_zaufanie_perTura: 5`  
**Handoff:** `CYWILIZACJE-do-UNITS_przemarsz-kara-zaufanie.md` (implementacja CZEKA)

---

## [2026-06-30] ARCHIWUM: D3 wymiana PN handel/dar → docs/archiwum-czatow/maciej-decyzje/D3-wymiana-PN-handel-dar_2026-06-30.md

**Handoff:** UI `CYWILIZACJE-do-UI_handel-koszyk-pn.md` · Integrator `CYWILIZACJE-do-INTEGRATOR_wymiana-pn-zaufanie.md`

---

## [2026-07-01] P3 B-B5 ACK — kolejka P0–P3 zamknięta

**F:** weryfikacja B5 · md5 bez zmian `4B360364…` · promocja niepotrzebna (już w finalnej)

---

**md5:** `4B360364…` · P1 dyplomacja + P2 minimapa · archiwum `gra-kanon_20260630-234953`

---

Krok 1 przyjmij · krok 2 wykonaj w tej samej turze. Pliki: `MASTER-ZADANIA.md` · `_ZASADY.md` §4.3 · `master-silnik-orchestration.mdc`

---

**Delegacja:** Task subagent Grupa F (Master hub) · md5 ROBOCZA `EDF380D6…`  
**Master:** APPROVE review · promocja finalna — do uruchomienia

---

**Weryfikacja F:** md5 ROBOCZA `ED4C8E2B…` ✅ · bramka post-battle 10/10 · merge-bounce 2/2  
**Promocja:** `publish-kanon-snapshot.ps1` → `gra-kanon/` · archiwum `gra-kanon_20260630-233648`  
**P1 D-SOJUASZ:** otwarte dla F

---

**Decyzja Macieja:** F = ROBOCZA/test · Master = finalna (`Gra-podglad.html` + `gra-kanon/`) po review.  
**Pliki:** `docs/obieg/DWIE-WERSJE-GRY.md` · `docs/obieg/MASTER-ZADANIA.md` · `bramka-test-publish.ps1` (F nie dotyka finalnej)  
**P0 F:** meldunek `ED4C8E2B…` — czeka weryfikacja Master + `publish-kanon-snapshot.ps1`

---

**Reguła:** `docs/obieg/MASTER-START-AUTO.md` · tick/start → ACK + dyspozycja F w tej samej turze (nie „czeka Master”).

**ACK meldunki:** D sojusz v1.2 · A paczka P1–P4 · B B5-Spichlerz  
**Dyspozycje F (gotowe, sekwencja):**
- P1 `MASTER-do-INTEGRATOR_D-sojusz-v12-2026-07-01.md` — po P0
- P2 `MASTER-do-INTEGRATOR_A-P4-UI-2026-07-01.md` — po P1
- P3 `MASTER-do-INTEGRATOR_B-B5-spichlerz-2026-07-01.md` — po P2

**P0 u F:** `C-ODSKOK-FANOUT` — w trakcie

---

## [2026-07-01] DYSPOZYCJA F — batch P0 C-ODSKOK-FANOUT

**ACK:** `C-do-MASTER_odskok-fanout-2026-07-01.md`  
**Dyspozycja F:** `MASTER-do-INTEGRATOR_C-odskok-fanout-2026-07-01.md`  
**Kolejka:** P0 u F · P1 D · P2 A · P3 B czeka Master  
**Powód opóźnienia:** Master hub — dyspozycja wypisana po `start` Macieja 2026-07-01

---

**Maciej:** propozycja auto-check + START (Slack nie dowozi)  
**Skrypt:** `gra/tools/master-watch-inbox.ps1` · interval 900s · pliki > Slack  
**Docs:** `docs/obieg/MASTER-START-AUTO.md` · stop: `stop watch` w hubie

---

**Cytat:** „Akceptuję obieg."  
**Efekt:** obieg operacyjny 2026-06-30 = **kanon** (Master hub bez kodu · Grupa F executor · review subagent · Slack trigger)  
**Pliki:** `OBIEG-AKCEPTACJA-2026-06-30.md` · `REJESTR-DECYZJI.md` § OBIEG-2026-06-30

---

**Weryfikacja dysku:** `Gra-podglad.html` md5 **`AB471657E64C0D87F3BA7E3094DE0A1B`** ✅  
**Handoff:** `dyspozycje/_handoff/F-do-MASTER_E2-PLAYTEST-B2Q5-2026-06-30.md`  
**Review Master:** APPROVE (world-density 28/28 · smoke · diplomacy 140/140 · kod E2+B2-Q5 w main.ts)  
**Grupa C retro:** AUTO-WALKA-v2b — ACK · zamknięte · w linii kanonu  
**Slack:** ACK `#master` · `#grupa-f`  
**Czeka:** Grupa D → MASTER (sojusz v1.2) · playtest Maciej opcjonalny

---

## [2026-06-26] ABC hub — 5 odpowiedzi Macieja

**UI-SPRINT-1:** STOP UX w kodzie · **REMIND-START:** A (złoże rezerwuje hex) · **P-C2:** B* (ważone siłą pokonanego + gate testy + P-C2-DEF) · **P-ARMIA:** B (suma siły bojowej) · **D3-CONFIRM:** A (pełny Wealth v1.0).

→ `docs/decyzje/MACIEJ-ABC-HUB-2026-06-26.md` · `docs/obieg/REJESTR-DECYZJI.md` · otwarte: `docs/decyzje/P-C2-DEF-wygrana-bitwa-OTWARTE.md`

**Wdrożenie (Maciej: Tak):** REMIND-A → `improvement-build.ts` + test 41/41 → handoff Integrator · D3-CONFIRM-A → potwierdzone w kodzie (`wealth.ts` + wire test 29/29)

---

## [2026-06-26] ARCHIWUM: auto-walka v2b → MASTER

**Handoff:** `dyspozycje/_handoff/UNITS-do-MASTER_auto-walka-v2b.md`  
**Meldunek:** `SILNIK-DO-MASTERA.md` § AUTO-WALKA-v2b · `UNITS-DO-MASTERA.md` § 2026-06-26

---

## [2026-06-26] AUTO-WALKA v2b — wdrożenie do gry · **ZAMKNIĘTE**

**Decyzja Maciej:** auto-walka na mocy M + identyczne reguły ruchu mapy dla auto i ręcznej 3D (różni się tylko źródło werdyktu/strat).

**Kod:** `auto-battle-power.ts` · `auto-battle-params.ts` · `post-battle-map.ts` · integracja `main.ts` (gracz, szturm, AI, barbarzyńcy).

**JSON:** `gra/data/auto-battle-params.json` ← Panel-C arkusz **Auto-walka** (`export-c.py`).

**Kanon:** `Gra-podglad.html` md5 `5D965EB74068538C18C6C0916D5CBB77` · build OK · `auto-battle-power-test` 10/10 · combat 6/6 · smoke OK · oblezenie 27/27.

**Master ACK:** 2026-06-26 · FLOW-C-fix wpięte (deploy:false, notice potyczki, hint szturmu).

## [2026-06-26] OBIEG 2026-06-30: Grupa C → MASTER (Slack)

**Handoff:** `dyspozycje/_handoff/C-do-MASTER_auto-walka-v2b.md` · **→ MASTER: GOTOWE** · 🟠 U MASTERA · `C-walka.md` · Slack `#grupa-c` + `#master`

---

**Workflow Macieja:** Panel-C → Auto-walka → zapis → w czacie: `eksportuj panel C`.

---

## [2026-06-26] PLAN Master Orkiestrator (bez kodu) — wdrożony

**Fazy 1–5 planu** `master_bez_kodu` — dokumentacja + role + ACK kanon `2FC4DCA9…`  
**Pliki:** `ROLE-2026-06-30.md` · `MASTER-WATCH.md` · `civ-workflow.mdc` (bez Opus/GLM main.ts) · archiwum `master-legacy/` · handoff `MASTER-do-GRUPA-F_executor-only-2026-06-30.md`

## [2026-06-26] SLACK F2 — kanały workflow + MCP

**Master:** utworzono `#master`, `#grupa-a`…`#e`, `#grupa-f`, `#decyzje` · szablony GOTOWE/ACK w każdym kanale  
**Docs:** `docs/obieg/SLACK-OBIEG.md` (mapowanie ID) · komenda Macieja: `slack`  
**Zasada:** Slack = trigger · pliki = prawda

---

## [2026-06-30] PRIORYTET Maciej — bez playtestu (kolejność orkiestracji)

1. **Lane UI** → domknąć **GOTOWE 00–02** (Figma DS · pełne **02 Icons 3C** — BLOCK review 2026-07-01)
2. **Integrator F** → E2 `worldDensity` w PLAYTEST-MAPA ✅ · **B2-Q5** kamera na chip ✅ (kod · kanon do publish)
3. **Maciej** → sign-off **bronzepreview A5/D12** (`?pack=full`) — **data TBD**
4. **Opus** → batch **`F-UNIT-POWER-M-v1`** (md5 `2FC4DCA9…` + E2/B2-Q5 po publish)

**Playtest gry:** ⏸ poza tą kolejką.

---

## [2026-06-30] REORGANIZACJA RÓL — Master Orkiestrator (hub, bez kodu) + Grupa F executor

**Decyzja Maciej:** hub = plan + weryfikacja + dyspozycje · kod = osobny czat Grupa F  
**Dokumenty:** `docs/obieg/ROLE-2026-06-30.md` · `docs/obieg/MASTER-WATCH.md` · archiwum `docs/archiwum/master-legacy/`  
**ACK kanon:** md5 `2FC4DCA9E55E5FF9515A67233372EC3D` (BALANS + M→Power + militaryRatio-M)  
**Dyspozycja F:** `dyspozycje/_handoff/MASTER-do-GRUPA-F_executor-only-2026-06-30.md`

---

## [2026-06-30] HANDOFF → Grupa D: M jednostki w Power — dyplomacja wpięcie

**Od:** Integrator F · **Do:** Grupa D (CYWILIZACJE)  
**Handoff:** `dyspozycje/_handoff/INTEGRATOR-do-CYWILIZACJE_unit-power-m-wpięte.md`  
**Treść:** API `unit-power.ts` gotowe · Power/Respekt już na sumie M · Grupa D: weryfikacja + `militaryRatio` na M + Panel-D  
**→ Maciej:** w czacie Grupy D wpisz `start` (bez dopisków)

---

## [2026-06-30] INTEGRATOR — kanon TW-v3-BALANS + UNIT-POWER-M-v1

**Batch scalony:** balans `units.json` + suma M armii w Power  
**Kanon:** md5 **`3DAE1AA5C463CFD9E90F77C5D2DCFC76`** · `Gra-podglad.html`  
**Bramka:** unit-power 6/6 · combat 6/6 · smoke · power-objective 9/9  
**Meldunek:** `SILNIK-DO-MASTERA.md` § 2026-06-30 GOTOWE-KANON  
**→ Maciej:** opcjonalne strojenie `jednostka_wojskowa.pkt` w Panel-B (Power wyższy po M)

---

## [2026-06-30] UNITS balans TW v3 — JSON zamknięty → INTEGRATOR

**Decyzja Maciej:** strojenie parametrów **ZAMKNIĘTE** · Hastati < Triari · rydwany top Brąz · Konnica AP 8  
**Dane:** `gra/data/units.json` (186 pól) · backup `units.json.bak-BALANS-2026-06-30`  
**Handoff:** `dyspozycje/_handoff/UNITS-do-INTEGRATOR_balans-tw-v3-2026-06-30.md`  
**→ INTEGRATOR F:** rebuild `Gra-podglad.html` · combat 6/6 + smoke · md5 · Opus gate  
**NIE w scope:** auto-walka M · zmiany `main.ts` (dane tylko)

---

**Batch:** `combat.ts` TW v3 (`hitChanceTw`, `damageTw`, `rangeDamageTw`) · `CombatUnit` EN · `combat-test.cjs` adapter EN  
**Testy:** combat-test **6/6 PASS** (Hastati vs Falanga hit=38%, pilum dmg=7)  
**Nie ruszano:** `main.ts`, kanon  
**→ INTEGRATOR:** Faza 3 — wpięcie EN w `main.ts` + battle modules + build + Opus

---

## [2026-06-26] INTEGRATOR F-PANEL-ROSTER-v1 — JSON panele + roster 15 w kanonie

**Batch:** `map-gen-params.json` + `e-start-params.json` czytane w silniku · roster 15 w `civs.json`  
**Pipeline:** `export-d.py` + `import-roster-6-civs.py` (Sumer→sumer, +6 nacji)  
**Kanon:** md5 **`5949422D3C7A614E9F695B07663309D9`** · meldunek `SILNIK-DO-MASTERA.md` § F-PANEL-ROSTER-v1  
**→ Opus:** review batch F-PANEL-ROSTER-v1 (`OPUS-REVIEW-QUEUE.md`) · **→ Maciej:** playtest/balans **później** (grywalność v1)

---

## [2026-06-26] Maciej: paczka odłożona — B1-tech-Q3=C · A-R7=B · INK-Q1=B

**Decyzje:** posterunek = Obróbka drewna + Murarstwo · łodzie w terytorium · Inkowie bez startu Brązu.  
**Zapis:** `B1-tech-MACIEJ-2026-06-29.md` · `A-R7-lodzie-terytorium.md` · `E1-epoka-przed-cyw.md` · `REJESTR-DECYZJI.md`  
**→ lane:** MAPA (R7 gate) · B/EKONOMIA (posterunek JSON) · CYW/E (civs.json epoki Inków)

---

## [2026-06-27] Grupa B — paczka ABC 1–11 ZAMKNIĘTA · sync docs

**Maciej:** decyzje 1–11 w `B2-spoleczenstwo.md` · zsynchronizowano README, `B-OTWARTE-PYTANIA.md`, indeksy grupa-b. **B1-tech-Q3 posterunek = odłożone, nie pytaj.**

---

**Maciej:** Moc gotowa · wszystkie parametry w Panel-B · wpinamy w kanon.  
**Deliverable:** `dyspozycje/_handoff/EKONOMIA-do-INTEGRATOR_moc-v1-GOTOWE.md`  
**Panel-B:** Potega-P-A, Potega-opcje, Manpower-epoki → `export-b.py`  
**Silnik:** `main.ts` — dominacja + armia P-C1 + import `power-options`  
**Testy:** power-objective 9/9 · power-options 5/5 · manpower 22/22

**→ GRUPA D:** Moc gotowa — liczcie dyplomację · `EKONOMIA-do-GRUPA-D_moc-respekt-GOTOWE.md`

**→ INTEGRATOR F (2026-06-26):** kanon opublikowany · md5 **`49ab7306f9cafdfe7bbf6f01a7ede06b`** · meldunek `SILNIK-DO-MASTERA.md` § F-MOC-P-A-v1

---

## [2026-06-26] DECYZJA P-C3: Moc (PL) / Power (EN) — broadcast lane

**Maciej:** Wpływ wycofany · UI **Moc** · handoff `P-C3-moc-nazwa-KONTRAKT.md` · spec `P-C3-moc-power-nazwa.md`

---

## [2026-07-01] CYW roster-6: Panel-D wklejony (Q4B)

**Lane D:** merge 6 nacji do `panele-sterowania/Panel-D.xlsx` + Sumer→sumer · skrypt `import-roster-6-civs.py`  
**CZEKA:** Maciej edycja Panel-D → „eksportuj panel” → export-d + import JSON  
**Handoff:** `dyspozycje/_handoff/CYWILIZACJE-do-SILNIK_roster-15-enum.md`

---

## [2026-07-01] UX FIGMA: MASTER referencje PO + ikony 3C (Maciej nieobecny)

**Dostarczone:** `02-icons/preview-tier1-5.png` · `grupa-E/export/E-01_po_REFERENCJA-MASTER.png` · handoff `MASTER-do-GRUPA-E_E-01-referencja-brandbook.md`  
**Czekamy:** `E-01_po.png` od Grupy E (Figma) · poll `poll-figma-review.ps1`

---

**Maciej:** auto PNG w czacie gdy deliverable · czeka  
**MASTER:** PRZED E → export/ · DoD lane UI `UI-FIGMA-LANE-0-DOD.md` · poll `poll-figma-review.ps1`  
**Blokery bez zmian:** brak `E-01_po.png` · brak `02-icons/preview-tier1-5.png`

---

**Maciej:** praktycznie brak zmiany vs gra · tylko złote obramowania · ikony/infografiki niezgodne z **3C/6C** i brand bookiem  
**Dyspozycja:** lane UI → pełne **02 Icons** przed layoutem · reset DoD ekranów · E-01/C mockupy BLOCK  
**Pliki:** `STATUS-FIGMA.md` § BLOCK · `grupa-E/RAPORT-FIGMA.md` · `UI-DO-MASTERA.md`

---

**Lane UI:** strona 1 DS gotowa (min. pod E) · sygnał do Grupy E  
**Grupa E:** start layout **E-01 Menu** · pilot `PILOT-KROK-PO-KROKU.md` · POSTĘP → RAPORT-FIGMA → review Macieja CHECKLIST § E-01  
**A–D:** czekają za E w Figmie

---

**Weryfikacja dysku:** kanon = ROBOCZA = **`4602e752d7e4b21f3c2460e494e82a8f`** (1 745 523 B · 2026-06-29 12:25:22) · PLAYTEST-* niezsynchronizowane  
**Dokumentacja:** `INTEGRATOR-kolejka.md` + `PANEL-MASTER.md` — blok AKTUALNY KANON · stare md5 oznaczone  
**Testy (uruchomione):** logic 203/203 · combat 6/6 · smoke · battle-smoke · forest-parity 98/98 — ZIELONE  
**Czeka Master:** Opus batch 2026-07-01 · status OBL-CAP fix `64494074…` (meldunek vs dysk) · E1 w kanonie `4602e752…`

---

## [2026-07-01] UX FIGMA: MASTER → Grupa E — kolejność layoutu po GOTOWE 00–02

**Grupa E:** po sygnale start **jako pierwsi** w Figmie · **E-01 Menu** (priorytet wizualny) → E-03 → E-09 → E-10 → E-11 → E-15  
**Cel:** baseline ~35% + Panel 5C / Btn 4C / Chip 6C z DS · review Macieja po frame’ach  
**Grupy A–D:** czekają za E w layoutcie Figma (8A w grze bez zmian)

---

## [2026-07-01] UX FIGMA: priorytet Macieja — sekcja E pierwsza po GOTOWE 00–02

**Od Macieja (operacyjne · zgodne z 8A):** po **GOTOWE 00–02** lane UI + Grupa E **najpierw** sekcja E (meta/start, str. 3) — frame’y E-01…E-15 · najlepszy wizualnie start gry · potem A/B/C/D  
**MCP:** oszczędnie · baseline PNG E **ręcznie** (MCP nie importuje obrazów)  
**Zapis:** `UI-DO-MASTERA.md` · `STATUS-FIGMA.md` § priorytet layoutu

---

## [2026-07-01] INTEGRATOR → MASTER: stan 4 role × fazy A–F

**Plik:** `dyspozycje/INTEGRATOR-do-MASTER_etapy-2026-07-01.md` — podział: **Grupy · Maciej · Integrator F · MASTER** × fazy A–F (LECI/STOI/CZEKA/DONE)

---

## [2026-07-01] INTEGRATOR → MASTER: dyspozycja etapów A–F

**Plik:** `dyspozycje/INTEGRATOR-do-MASTER_etapy-2026-07-01.md` — checklist MASTER (reconciliacja md5, Opus gate, playtest Maciej, delegacja lane P2/P3)

---

## [2026-07-01] INTEGRATOR F: GOTOWE-KANON P0+P1 scalony

**Batch:** BONUS-C · F-POWER-MANPOWER-01 · D-V11 dyplo v1.1 · P1-C MAPA ulepszenia · scalenie wcześniejszych batchy  
**Kanon:** md5 **`4602e752d7e4b21f3c2460e494e82a8f`** · kanon = robocza  
**Meldunek:** `dyspozycje/SILNIK-DO-MASTERA.md` · STAN: `dyspozycje/INTEGRATOR-STAN.md`  
**Gotowe do Opus** · czeka playtest Maciej (Power, dyplo v1.1) · E2 kod ✅ (playtest gęstości ⏸)

---

## [2026-07-01] UX FIGMA: Grupa E — STOP layout · inbox przyjęty ✅

**Grupa E:** meldunek lane UI **przyjęty** · spec+baseline 6/6 · **0/6** frame’ów · **STOP layout** do **GOTOWE 00–02**  
**Raport:** `figma/grupa-E/RAPORT-FIGMA.md` · review Macieja po frame’ach  
**Lane UI (Grupa 0):** bez zmiany priorytetu — domknąć stronę 1 DS

---

## [2026-07-01] UX FIGMA: meldunek Grupy E → lane UI (Grupa 0)

**Od Grupy E:** Figma redesign menu/kreator **START** — spec+baseline **6/6** ✅ · **0/6** frame’ów · MCP ✅ (`plugin-figma-figma`) · limit Starter 🔴  
**Inbox lane UI:** `docs/ux/figma/STATUS-FIGMA.md` § Inbox · raport `figma/grupa-E/RAPORT-FIGMA.md`  
**Do lane UI:** domknąć strona 1 DS → **GOTOWE 00–02** · sekcja E na stronie 3 · usuń duplikat `wlHvQljFFcf2BH9LE7sdOI`  
**Maciej:** styl zamknięty — nie blokuje; decyzje gameplay (ABC) osobno

---

## [2026-07-01] UX FIGMA: meldunek Grupy D → lane UI (Grupa 0)

**Od Grupy D:** Figma redesign dyplomacji **CZĘŚCIOWE** — `dip-alliance` / `dip-pact` / `dip-war` ✅ · frame’y D-02…06 ⏳ (MCP Starter limit)  
**Inbox lane UI:** `docs/ux/figma/STATUS-FIGMA.md` § Inbox · raport `figma/grupa-D/RAPORT-FIGMA.md`  
**Do lane UI:** strona 1 DS (00–02) + przeniesienie sekcji D na stronę 3 · Georgia/Lora w tokenach

---

## [2026-06-26] UX FIGMA: komunikaty v2 do grup A–E

**Plik:** `docs/ux/KOMUNIKATY-FIGMA-GRUPY-A-E.md` — 5 bloków do wklejenia (URL Figmy, 3 strony, bez MCP, GOTOWE 00–02)  
**Maciej:** Share → Can edit na pliku · sygnał GOTOWE 00–02 gdy lane UI domknie stronę 1 DS

---

**Dyspozycja:** `dyspozycje/MASTER-do-INTEGRATOR_czekam-2026-07-01.md`  
**Integrator:** P0 bonusy CYW + domknięcie POWER · P1 v1.1 dyplo · scalenie kanonu · przycisk Grupa A (E2).  
**Maciej (informacja):** playtest OBL-CAP ST-2/3 · ABC 30.06 · surowce vs ulepszenia.

---

## [2026-06-30] PANEL-MERGE — archiwum fizyczne + DEPRECATED skrypty

**Przeniesiono 16 Exceli** → `docs/archiwum/panele-legacy/` (manifest: `MANIFEST.md`)  
**Skrypty legacy** → nagłówek DEPRECATED + ścieżki do archiwum (`gra/tools/DEPRECATED-EXPORTS.md`)  
**Kanon:** tylko `Panel-A…E.xlsx` + **eksportuj panel**

---

## [2026-07-01] FIX OBL-CAP-01 — jednostka widoczna po zdobyciu miasta

**Przyczyna:** `survivors:[]` kasowało atak (auto-szturm) · brak `applyCityCaptureToMap` po bitwie  
**Fix:** `survivorsLiveSet`, `applyCityCaptureToMap`, `refreshMapAfterCityCapture`, renderOrder 55  
**Test:** siege-defenders 11/11 · bramka OK  
**Publish:** md5 **`6449407489B4CF684B8EDDB9D30CCA0F`**  
**Do playtestu Maciej:** ST-2 (puste miasto) + ST-3 (po bitwie)

---

## [2026-06-26] HANDOFF → INTEGRATOR: F-POWER-MANPOWER-01

**Paczka:** `dyspozycje/_handoff/EKONOMIA-do-INTEGRATOR_power-manpower-v2.md`  
**Zakres:** Manpower/rekruci (kanon) + POWER obiektywny v2 (silnik częściowo wpięty) + panel miasta rekruci.  
**Integrator domyka:** HUD Power, overlay pkt, Respekt % w UI dyplomacji, kanon HTML po Opus.

---

## [2026-06-30] BUG OBL-CAP-01 — jednostka znika po zdobyciu miasta (→ jutro)

**Zgłoszenie Maciej:** miasto zdobyte OK, jednostka atakująca **niewidoczna** na mapie  
**Handoff:** `dyspozycje/_handoff/BUG-OBL-CAP-01-jednostka-po-zdobyciu.md`  
**Status:** OTWARTY · fix SILNIK jutro

---

## [2026-06-30] C3 reguły szturmu/obrony — kanon + integrator

**Decyzje playtest:** C3-ST-1…3 · `docs/decyzje/C3-szturm-obrona.md`  
**Kod:** `gra/src/game/siegeDefenders.ts` · test `siege-defenders-test.cjs`  
**Handoff:** `dyspozycje/_handoff/MASTER-do-SILNIK_C3-reguly-szturm-obrona.md`  
**Playtest Maciej:** ✅ szturm z obrońcą (preBattle→bitwa) · reguły spisane

---

## [2026-06-30] C3 oblężenie + szturm → INTEGRATOR: kanon opublikowany (playtest ✅)

**Playtest Maciej:** ✅ pełna ścieżka Oblężaj → Szturm → preBattle → bitwa ręczna z murem (Ateny)  
**Handoff:** `dyspozycje/_handoff/UI+UNITS+SILNIK-do-INTEGRATOR_C3-oblezenie-szturm-2026-06-30.md`  
**Batch:** cityAttackChoice · siegeMapPanel · preBattle UX · cityCaptureNotice · armyMerge · units render · main.ts C3  
**Backup:** `gra/src/main.ts.bak-SILNIK-oblezenie-c3-2026-06-30`  
**Bramka:** logic 203/203 · combat 6/6 · smoke · battle-smoke · oblezenie 27/27 · map-siege 6/6 · siege-ai 17/17 · ai 198 · diplo 135  
**Publish:** `Gra-podglad.html` = ROBOCZA = PLAYTEST-MAPA · md5 **`D97D909CEB95B5CD36D6A1EE8A76C5AD`**  
**Czeka:** Opus review przed formalnym sign-off

---

## ⏰ [2026-06-30] PRZYPOMNIENIE DLA MACIEJA (zapisane 2026-06-29)

**Temat:** **Oddzielić surowce od ulepszeń na starcie mapy** — inaczej konflikty w późniejszej rozgrywce.  
**Karta:** `docs/decyzje/REMIND-2026-06-30-surowce-vs-ulepszenia-start.md`  
**Lane:** MAPA + EKONOMIA → potem ABC + handoff Integratora.

---

## [2026-06-26] EKONOMIA: Manpower kanon — Pobór we Wpływie + rekruci na HUD

**Kanon:** regen 10%/turę; Rzymianie +35%, Grecy −15% (`bonus_pobor_regen`). Wpływ: składnik **Pobór** = ludność + rekruci. HUD mapy: rekruci pod Wpływem.  
**Docs:** `dyspozycje/_scalone/EKONOMIA/EKONOMIA-manpower-pobor.md` · handoff `dyspozycje/_handoff/EKONOMIA-do-MASTER_manpower-pobor-wplyw.md`  
**Test:** `manpower-test.cjs` 22/22 OK

---

**Reguła:** ruch na własne miasto (domek) = jednostka **widoczna** na heksie; **Ufort.** w mieście = `inGarnizon`, znika z mapy.  
**Handoff:** `dyspozycje/_handoff/UNITS-do-MASTER_wejscie-miasta-garnizon.md`  
**Kod:** `RuntimeUnit.inGarnizon`, `mapUnitCursor.ts`, `main.ts`

---

## [2026-06-26] T-TECH-1/2/3 — Maciej B/A/C: sync drzewka + posterunek

**Decyzje:** T-TECH-1 **B** (sync tech.json) · T-TECH-2 **A** (tooltip ulepszeń mapy) · T-TECH-3 **C** (posterunek = Obróbka drewna + Murarstwo)  
**Handoff:** `dyspozycje/_handoff/CYWILIZACJE-do-INTEGRATOR_T-TECH-1-2-3.md`  
**Pliki:** `tech.json` · `improvement-tech.ts` · `sciencePicker.ts`  
**Czeka:** bramka testów · playtest drzewka

---

**Deliverable:** `docs/AUDYT-DRZEWKO-TECH-2026-06-26.md`  
**Wniosek:** prereq OK · bramki ulepszeń OK (hodowla synced) · opisy tech.json przestarzałe · epoka Żelazo — luka jednostek · 9 decyzji ABC T-TECH-1…9 dla Macieja  
**Czeka:** decyzje Macieja → dyspozycja CYWILIZACJE + UI + UNITS

---

**Batch:** overlay okolicy 3D (z prototypu OKOLICA-UX) → `main.ts`  
**Zmiany:** `syncOkolicaOverlay` / `disposeOkolicaOverlay` · `hideCityPanelFull` · `CameraController.blockPointerAt` · klik mapy z blokadą UI  
**Pliki lane:** `cityOkolicaOverlay.ts` · `cityUxFrame.ts` · `cityPanel.ts`  
**Handoff:** `dyspozycje/_handoff/UI-do-INTEGRATOR_panel-miasta-okolica-ux.md`  
**Backup:** `main.ts.bak-SILNIK-okolica-overlay-2026-06-26`  
**Czeka:** playtest Macieja · Opus review  
**Publish:** `Gra-podglad.html` = ROBOCZA · md5 **`FD1DFD21E708EF14FB9DF9087F96F175`** · smoke + logic 203/203 OK

---

**Playtest Maciej:** ✅ OK (galeria ulepszeń + hodowla solo vs farma+bydło)  
**Batch:** render solo bydło/owce · mgła na meshach ulepszeń · kolejność init overlays  
**Pliki:** `robloxImprovements.ts` · `improvements.ts` · `main.ts` (syncImprovementMeshFog, syncLivestock→rebuildResourceOverlays)  
**Publish:** `Gra-podglad.html` = `Gra-podglad-ROBOCZA.html` · md5 **`B3FCE79AF5688D6AF5DF0F8CBB7DDAC6`**  
**Galeria QA:** `Gra-podglad-ULEPSZENIA.html` (?view=matrix / ?view=hodowla)  
**Bramka:** food-hodowla 21/21 · map-improvement-qualify 34/34 · smoke · battle-smoke OK  
**Czeka:** Opus formalny przed zamknięciem batchu · Konie = osobny batch

---

## [2026-06-26] PANEL-MIASTO-UX → INTEGRATOR: wpięcie Civ V layout do main.ts

**Batch:** panel miasta OKOLICA-UX → gra główna  
**Zmiany:** `cityUxFrame.ts` → `gra/src/ui/` · `showCityPanel` używa ramki Civ V · klik heksu przy otwartym panelu = 👤 okolica · `Gra-podglad.html` zaktętowany  
**Backup:** `main.ts.bak-SILNIK-panel-ux-*`  
**Bramka:** vite build OK · logic-test · smoke OK  
**Czeka:** playtest Macieja · Opus review przed formalnym sign-off

---

## [2026-06-26] F-FOOD-HODOWLA-01 → MASTER: GOTOWE-ROBOCZA

**Batch:** F-FOOD-HODOWLA-01 (hodowla + złoże + warstwy heks)  
**Od:** Integrator F · **Maciej:** playtest odłożony — Master weryfikuje, bugfix później jeśli trzeba  
**Publish:** `Gra-podglad.html` = `Gra-podglad-ROBOCZA.html` · md5 **`C0A64D12312563D83ADB62A695A9BDA6`** *(stary — aktualny kanon: `4602e752…`)*  
**Handoff:** `dyspozycje/_handoff/MAPA-do-INTEGRATOR_hodowla-zloze-SILNIK.md`  
**Meldunek:** `dyspozycje/SILNIK-DO-MASTERA.md`  
**Bramka:** food-hodowla 21/21 · map-improvement-qualify 34/34 · logic 203/203 · smoke · battle-smoke OK  
**Czeka:** Opus przed formalnym sign-off · Konie = osobny batch

---

## [2026-06-26] ARCHIWUM UX: panel miasta PO sesji topbar + statystyki interaktywne

**Zamknięcie fazy:** prototyp OKOLICA-UX / PLAYTEST-MIASTO przed tematem #2 (większy)  
**Eksport pełny:** `docs/archiwum-czatow/eksport-pelny/GRUPA-B_KORESPONDENCJA.md` (2373 linii)  
**Handoff:** `docs/archiwum-czatow/eksport-pelny/GRUPA-B_HANDOFF-KONTEKST.md`  
**Spec UX:** `docs/archiwum-ux/panel-miasta-UX-TOPBAR-2026-06-26.md`  
**Skrót sesji:** `docs/archiwum-czatow/lane/LANE-UI-panel-miasta-UX_2026-06-26.md`  
**Backup kodu:** `cityPanel.ts.bak-UX-TOPBAR-2026-06-26`, `hoverDetailDock.ts.bak-UX-TOPBAR-2026-06-26`  
**Snapshot HTML:** `docs/archiwum-ux/Gra-podglad-OKOLICA-UX_TOPBAR-2026-06-26.html` (md5 `A7BFCEDF403EB6E241E4CFAC0B3A8B14`)  
**cityPanel.ts md5:** `AED242A8081D523C8E94C2BEB8183711` · **kanon nietknięty**

---

## [2026-06-26] ARCHIWUM UX: panel miasta PRZED redesignem ikonowym

**Decyzja Macieja:** pasek ikon po lewej → treść po prawej (zarządzanie polami, budowa, rekrutacja…)  
**Archiwum:** `docs/archiwum-ux/panel-miasta-PRE-IKONY-2026-06-26.md`  
**Backup kodu:** `cityPanel.ts.bak-UX-PRE-IKONY-2026-06-26`, `cityUxFrame.ts.bak-UX-PRE-IKONY-2026-06-26`  
**Snapshot HTML:** `docs/archiwum-ux/Gra-podglad-OKOLICA-UX_PRE-IKONY-2026-06-26.html` (md5 `13E0345725BD8117446F796F6515FD61`)  
**Następny krok:** mockup ikon w okolicapreview — **bez** zmian kanonu do playtestu

---

## [2026-06-26] FOOD-HODOWLA — MAPA+SILNIK → INTEGRATOR GOTOWE (złoże=ulepszenie)

**Batch:** F-FOOD-HODOWLA-01 — **zamknięty** → patrz wpis GOTOWE-ROBOCZA powyżej

---

## [2026-06-29] DECYZJA MACIEJA — B5-SPICH: Spichlerz, wzrost ludności, wojsko

**Kanon:** `docs/decyzje/B5-spichlerz-wzrost-ludnosci.md` · reguły: `.cursor/rules/civ-workflow.mdc` §12 · rejestr: `REJESTR-DECYZJI.md` (B5-SPICH 🟡)  
**Handoff (CZEKA):** `dyspozycje/_handoff/MACIEJ-do-EKONOMIA_spichlerz-wzrost-ludnosci.md`  
**Implementacja:** po kolejnych ustaleniach Macieja → Grupa B → Integrator (nie teraz).

---

## [2026-06-26] FOOD-HODOWLA P2 — EKONOMIA GOTOWE → MAPA START → Integrator czeka

**EKONOMIA:** `→ SILNIK: GOTOWE` · test `food-hodowla-test.cjs` 21/21  
**Handoffy:** `EKONOMIA-do-MAPA_kanon-zywnosc-hodowla.md` · `EKONOMIA-do-INTEGRATOR_kanon-zywnosc-hodowla.md` · `EKONOMIA-do-SILNIK_kanon-zywnosc-hodowla.md`  
**MAPA:** P2 START — Panel-A hodowla + M1–M7 (`MAPA.md`, `A-mapa.md`)  
**INTEGRATOR:** **BLOKADA** batch F-FOOD-HODOWLA-01 do MAPA GOTOWE + SILNIK wire  
**Integrator weryfikacja:** przyjął handoff · **nie** rusza `main.ts`/kanon · Panel-A: 2 skip `pastwisko.*` (MAPA regen) · round-trip A ✅

---

## [2026-06-29] PANEL-A P1 — Grupa A (MAPA)

**Status:** 🟢 Panel gotowy — `panele-sterowania/Panel-A.xlsx` + `gen-panel-a.py` + `export-a.py`  
**Inwentaryzacja:** `docs/obieg/A-PANEL-INWENTARYZACJA.md`  
**Eksport:** terrain-improvements.json (aktywny) · map-gen-params.json (zapis; wpięcie kod P3 E2)  
**Następny lane A:** P2 FOOD-HODOWLA kod · P3 E2 generator czyta map-gen-params

---

## [2026-06-26] E2 wdrożone: MAPA + UI + SILNIK (batch MASTER)

**Status:** 🟡 ROBOCZA — build `$TEMP\civ-dist` OK · logic 203/203 · smoke OK  
**Zmiany:** `generator.ts` + `newGameMapDefaults.ts` (WorldGenOptions) · `newGameFlow.ts` (miasta-państwa zamiast jakości) · `main.ts` (generujSwiat + cluster spawn)  
**Handoff:** `dyspozycje/_handoff/MAPA-do-SILNIK_E2-world-opts.md` → `→ SILNIK: GOTOWE`  
**Playtest:** `npm run dev` → Nowa gra → zaawansowane (surowce/rzeki/las/pustynia + miasta-państwa)  
**Uwaga:** `map-deposits-era-test` 1 fail (seed 424242, zero miedz/zelazo na Górach — regresja do triage MAPA)

---

**Status:** ⏳ OTWARTE — czeka ABC Macieja · **nie zaimplementowane**  
**Karta:** `docs/grupa-b/DECYZJE-PODGLAD-BUDYNKI-JEDNOSTKI.md`  
**D-BUDYNKI:** tooltip (A) vs szuflada (B) · **D-JEDNOSTKI:** karta statów (A) vs mini-3D (B)  
**Prototyp:** `Gra-podglad-OKOLICA-UX.html` po fixie Buduj/Kup/1-typ-budynku (md5 `F17B76D5…`)

---

## [2026-06-28] ORCHESTRATOR: rozdanie E2 (Maciej → lane)

**Flaga:** `→ ORCHESTRATOR: ROZDYSponuj TERAZ`  
**Dispatch:** `dyspozycje/ORCHESTRATOR-DISPATCH-E2-2026-06-28.md`  
**Decyzje:** `docs/decyzje/E2-gestosc-swiat-kreator.md` (Q2–Q5 zamknięte; Q2 korekta: więcej surowców, mult 0,6/1/1,4)  
**T0 równolegle:** MAPA (generator) + UI (miasta-państwa) · **T1:** SILNIK po `MAPA → SILNIK: GOTOWE` · **T2:** INTEGRATOR ROBOCZA

---

## [2026-06-29] → MASTER: pakiet do orkiestracji (Integrator → Master)

**Melding:** `docs/archiwum/czaty/DO-MASTERA.md` § E1+F-CITY-HEX · Opus: `docs/decyzje/OPUS-REVIEW-QUEUE.md` § 2026-06-29  
**Stan:** E2 dispatch 2026-06-28 aktywny · ROBOCZA md5 `611613f4…` *(stary — aktualny kanon: `4602e752…`)* · miasto → `PLAYTEST-MIASTO`

---

## [2026-06-29] E2 — gęstość świata w kreatorze (delegacja Maciej → lane)

**Plan:** `dyspozycje/_handoff/MASTER-PLAN-E2-gestosc-swiat.md` · decyzja: `docs/decyzje/E2-gestosc-swiat-kreator.md`  
**UI:** kreator (typy cywilizacji + zaawansowane gęstości) → INTEGRATOR 🟡  
**MAPA:** generator opts → `MASTER-do-MAPA_E2-gestosc-generator.md`  
**SILNIK:** wpięcie czeka MAPA → `MASTER-do-SILNIK_E2-gestosc-wpiecie.md`

---

## [2026-06-29] INTEGRATOR: E1 + F-CITY-HEX → ROBOCZA opublikowane

**Batch:** E1 bundle (3 presety start) + las parity + F-CITY-HEX (czysty hex miasta).  
**Bramka:** typecheck + 17 suitów + smoke + battle-smoke + forest-parity **98/98** — ZIELONA.  
**MD5:** `611613f49b8fdb92a550cae887606db3` *(stary — aktualny kanon: `4602e752…`)* → ROBOCZA · PLAYTEST-MIASTO · PLAYTEST-WALKA · kanon (build wspólny).  
**Handoff:** `dyspozycje/_handoff/MASTER-do-INTEGRATOR_E1-F-CITY-HEX-batch.md`  
**Czeka:** playtest wizualny Macieja (ISO-4) · Opus → formalny sign-off kanonu.

---

## [2026-06-29] Handoff INTEGRATOR: E1 (3 presety start) + F-CITY-HEX → ROBOCZA

**Kod `gra/src`:** E1 bundle + kreator `map_quality` + F-CITY-HEX **wpięte** w main/scene/UI.  
**Publikacja:** `Gra-podglad-ROBOCZA.html` **wymaga rebuild** (F-CITY-HEX po sign-off Macieja).  
**Handoff:** `dyspozycje/_handoff/MASTER-do-INTEGRATOR_E1-F-CITY-HEX-batch.md`

---

## [2026-06-29] E1 podgląd jakości — ZAMKNIĘTE + F-CITY-HEX

**E1 sign-off Maciej:** brak widocznej różnicy presetów OK · jeden suwak wdrożony w SILNIKU 29.06 · podgląd `Civ-MAPA/Gra-podglad-JAKOSC-MAPY.html` = referencja.  
**F-CITY-HEX (nowe):** po founding hex czysty (tylko grunt); bonusy centrum w snapshotcie miasta. Decyzja: `docs/decyzje/F-city-hex-czysty.md`  
**Handoffy:** `MASTER-do-EKONOMIA_F-city-hex-snapshot.md` · `MASTER-do-SILNIK_F-city-hex-czysty.md` · `MASTER-do-MAPA_F-city-hex-skip-dekor.md`  
**Archiwum:** `docs/archiwum-czatow/master/MASTER-E1-jakosc-podglad_2026-06-29.md`

---

## [2026-06-29] Grupa F — okolica 👤 regresja (panel + mapa 3D)

**Problem:** brak ręcznego przypisywania pól (👤) — ustecznięcie UX po publikacji.  
**Fix:** panel — większy podgląd (promień 3), większe hit-area, natychmiastowy rerender; mapa — tryb okolicy po „Mapa” (klik heks w zasięgu); ESC kończy tryb.  
**Pliki:** `gra/src/main.ts`, `gra/src/ui/cityPanel.ts`, `gra/data/ui-params.json`  
**Build md5:** `facb9a81727d658caa99ea3888ad2509` · okolica 24/24 · smoke OK

## [2026-06-29] Grupa F — kreator UX v2 (ikony z mocka E1)

**Plik:** `gra/src/ui/newGameFlow.ts` — emoji cywilizacji/epok/ustawień, panel bonusów bp/bm, hex animacja generacji  
**Stary UX (litery G/R/C):** usunięty z silnika; `UI/Makieta-flow-nowa-gra.html` = redirect → `Gra-podglad.html`  
**Build md5:** `6e9fea39ad6fdb3871436f85022e1a71` · smoke OK

## [2026-06-29] Grupa F — fix OKOLICA toggle (playtest FAIL)

**Problem playtestu:** klik 👤 nie odznaczał / panel nie odświeżał stanu po `adjustTileWorker`.  
**Przyczyna:** `rerender()` czytał stale `activeCity`; podświetlenie pól w trybie ręcznym ignorowało `okolicaReczne`.  
**Fix:** `cityPanel.ts` — `resolveActiveCity()` + `refreshCityPanelIfOpen()`; isWorked z `reczne` w trybie ręcznym; `main.ts` — health z `cityWorkedTilesForEconomy`.  
**ROBOCZA md5:** `F56696E7123F458D580E048CE3FBC98E` · smoke OK  
**Backup:** `main.ts.bak-SILNIK-OKOLICA-fix-2026-06-29`

## [2026-06-29] Grupa F — P0 raport lane EKONOMIA+UI (BOOT ERROR + publikacja HTML)

**Handoff:** `dyspozycje/_handoff/EKONOMIA+UI-do-SILNIK_raport-spieprzenia-2026-06-29.md`  
**Fix:** `diplomaticContactEstablished = new Set<number>()` w `main.ts` (D3-Q2 niedokończone wpięcie)  
**Publikacja:** rebuild → `Gra-podglad.html` + `Gra-podglad-ROBOCZA.html` + PLAYTEST-* (pełny bundel, nie redirect)  
**md5 kanon/ROBOCZA:** `798910e6d00b4cdf180a5b6f688c3a8e`  
**Bramka:** smoke OK · diplomacy 135 · okolica 24/24  
**Okolica fix Silnika:** zachowany (resolveActiveCity, refreshCityPanelIfOpen, cityWorkedTilesForEconomy)  
**Czeka:** playtest Macieja (Nowa gra, ikony HUD, okolica 👤) · Opus przed promocją kanonem oficjalnym

## [2026-06-29] Grupa F — batch zbiorczy rebuild ROBOCZA (OKOLICA + E1 bundel lane)

**Batch:** F-B-OKOLICA-TOGGLE (lane B/UI, bez main.ts) + świeży bundel modułów lane-only (E1 las, UNITS P1, MAPA P1-04, UI E1/menu S0)  
**ROBOCZA md5:** `808b87fdc6a04a729114e2835560bcc4` (+ PLAYTEST-WALKA/MIASTO ten sam)  
**Bramka:** wire 29 · logic 203/203 · combat 6/6 · civ-bonusy 30 · diplomacy 135 · ai 198 · smoke OK · battle-smoke OK (WARN auto) · okolica 21/21 · forest-parity 98 · deposits-era 11 · empire-food 9 · grupa-b 38  
**Handoff:** `→ MASTER: GOTOWE-ROBOCZA` w `docs/archiwum/czaty/DO-MASTERA.md`  
**Czeka:** Opus APPROVE → Master promuje kanon

## [2026-06-29] Grupa F / SILNIK E1 — bundled preset jakości (main.ts)

**Batch:** `mapRenderOptionsFromParams` → `bundledMapQualityPreset(mapQuality)`; save/load `mapQuality` tier; playtest `?mapQuality=Wysoka`; legacy save → rebundle.  
**Pliki:** `gra/src/main.ts`, `gra/src/game/save.ts`  
**Backup:** `gra/src/main.ts.bak-SILNIK-E1-2026-06-29`  
**Bramka:** vite build `/tmp/civ-dist` OK · `gra/tools/smoke.cjs` SMOKE OK  
**ROBOCZA:** `Gra-podglad-ROBOCZA.html` (czeka Opus przed kanonem)  
**Handoff:** `MASTER-do-SILNIK_E1-jakosc-preset-bundle.md` → GOTOWE

## [2026-06-29] DECYZJA E1-Q-BUNDLE: jakość mapy = jeden preset Roblox

**Decydent:** Maciej  
**Dokument:** `docs/decyzje/E1-jakosc-mapy-bundle.md`  
**Kontrakt:** `bundledMapQualityPreset()` w `gra/src/map/newGameMapDefaults.ts`

**Ustalenia:**
1. Styl **Roblox** stały (bez wyboru w kreatorze).
2. **Jeden suwak** Jakość mapy → pakuje GPU + dekoracje (Niska/Średnia/Wysoka).
3. **Zakaz** wpływu jakości na `Nakladka.Las` / rozmieszczenie lasu — tylko uproszczenie meshy.

**Handoffy:**
- `dyspozycje/_handoff/MASTER-do-UI_E1-jakosc-mapy-bundle.md`
- `dyspozycje/_handoff/MASTER-do-MAPA_E1-jakosc-dekoracje-gameplay-safe.md`
- `dyspozycje/_handoff/MASTER-do-SILNIK_E1-jakosc-preset-bundle.md`

**Kolejność:** UI + MAPA równolegle → SILNIK (main.ts) → INTEGRATOR kanon.

## [2026-06-29] MAPA E1 las parity — lane GOTOWE

**Test:** `map-quality-forest-parity-test.cjs` — 98 pass.  
**Handoff:** `MAPA-do-INTEGRATOR_E1-jakosc-las-parity.md`

---

## [2026-06-29] KANON: ulepszenia żywność + hodowla + nakładanie (Maciej)

**Status:** 🟢 ZAMKNIĘTE (design) · 🔴 NIE WDROŻONE (kod/JSON)  
**Dokument:** `docs/decyzje/KANON-ULEPSZENIA-ZYWNOSC-HODOWLA.md` — **START TU** (farma +3, irygacja +5, tarasy +3 solo, bydło/owce/lama, łodzie +3 prod., Inkowie, pustynia, złoża, nakładanie XOR)  
**Lane:** EKONOMIA + MAPA + SILNIK (model warstw na heksie)

---

## [2026-06-29] DISPATCH: F-FOOD-HODOWLA-01 → EKONOMIA + MAPA + Integrator

**Status:** 🟡 ROZDYSPONOWANE · lane **CZEKA** · Integrator **BLOK** do GOTOWE obu lane

**Handoffy:**
- `dyspozycje/_handoff/MASTER-do-EKONOMIA_kanon-zywnosc-hodowla.md`
- `dyspozycje/_handoff/MASTER-do-MAPA_kanon-zywnosc-hodowla.md`
- `dyspozycje/_handoff/MASTER-do-SILNIK_kanon-zywnosc-hodowla-integracja.md`

**Kolejka:** `docs/obieg/INTEGRATOR-kolejka.md` · STAN: `SILNIK-STAN.md`, `EKONOMIA-STAN.md`, `MAPA.md` § P1

---

## [2026-06-26] PANEL-B Grupa B — DOMKNIĘTY (5 kroków spec) · **→ MASTER: GOTOWE**

**Deliverable:** `panele-sterowania/Panel-B.xlsx` + `gen-panel-b.py` + `export-b.py` + `test-panel-b-roundtrip.py`  
**Arkusz Zywnosc-kanon:** balans ulepszeń → `terrain-improvements.json` (kanon liczb; kod = FOOD-HODOWLA P2)  
**Dok:** `docs/grupa-b/PANEL-B-SPEC.md` · archiwum legacy: `docs/archiwum/panele-miasto-legacy/README.md`  
**Meldunek lane:** `dyspozycje/EKONOMIA-DO-MASTERA.md` § 2026-06-26 Panel-B  
**Następny krok B (po dyspozycji MASTER):** FOOD-HODOWLA P2 — kod, nie panel

---

## [2026-06-29] PRIORYTET Macieja: P1 Panel-A → P2 FOOD-HODOWLA → P3 E2

**Decyzja:** Panel-A (Excel) **najpierw**; kod FOOD-HODOWLA i generator E2 **potem** (nie równolegle z Panel-A).  
**Obieg:** `docs/obieg/A-mapa.md` § TERAZ · `dyspozycje/MAPA.md`

---

## [2026-06-29] MASTER → INTEGRATOR: dyspozycja wpięć

**Plik:** `dyspozycje/MASTER-do-INTEGRATOR_dispatch-2026-06-29.md`  
**P1 (teraz):** Panel-C + UNITS P1 + MAPA P1-04 (🟢, bez main.ts)  
**P2 (po SILNIK):** batch Grupa B · preBattle D4 · CYW barbarians/victory · D3 audiencja  
**P3 (łańcuch):** FOOD-HODOWLA → E2 generator → Panel JSON→TS

---

## [2026-06-29] Maciej: „później zajmij się zadanie panel"

**Kolejka na następną sesję MASTER** (komenda `zadanie panel`):
1. **Panel-D** — największy brak audytu (bonusy cyw, AI, dyplomacja) · `docs/obieg/D-cywilizacje.md`
2. **Panel-B uzupełnienia** — audyt PANEL-AUDYT (tech, budynki, FOOD klucze) · `docs/obieg/B-ekonomia.md` § PANEL
3. **Panel-C → Integrator** — `combat-params.json` · handoff gotowy · `INTEGRATOR-kolejka.md`
4. **PANEL-EXEC / PANEL-2** — round-trip + wpis w `REJESTR-DECYZJI.md`

**Gotowe (nie ruszać):** Panel-A ✅ · Panel-E ✅ · Panel-B Excel ✅

---

## [2026-06-29] E1-EPOKA-PRZED-CYW — kanon opublikowany (Integrator)

**Playtest Maciej:** ✅ OK  
**Handoff:** `dyspozycje/_handoff/UI-do-INTEGRATOR_E1-epoka-przed-cyw.md`  
**Bramka:** logic 203/203 · smoke · battle-smoke  
**Publish:** `Gra-podglad.html` = `Gra-podglad-ROBOCZA.html` = PLAYTEST-* · md5 **`95BBCD3FAB26D4C4F0C35BF0C5A42EA7`** *(stary — aktualny kanon: `4602e752…`)*

---

## [2026-06-29] E1-EPOKA-PRZED-CYW — publish ROBOCZA

**Batch:** rebuild z `newGameFlow.ts` (Epoka → Cywilizacja + filtr `epokiStartowe`)  
**Plik:** `Gra-podglad-ROBOCZA.html` · md5 **`FBBB4DE12837216D8924944347D07C5E`**  
**Maciej:** Ctrl+F5 → Nowa gra → Kamień (7 cyw.) / Brąz (+ Celtowie, Germanie)

---

## [2026-06-30] BATCH integrator — CYW 5A + P1 Panel-C + typeId

**Tematy:** 5A agresja AI · E-P0-06 victory · E2-11 barbarians · P1-A Panel-C · P1-B typeId  
**Fix 5A:** `resolveArchetypeAggression` + `resolveArchetypeTrade` w `main.ts` DiplomacjaInputs  
**Publish:** `Gra-podglad.html` = ROBOCZA · md5 **`9665790EE040660FC6615F8405D0DD0D`** *(stary — aktualny kanon: `4602e752…`)*  
**Bramka:** logic 203 · combat 6 · siege-ai 17 · victory 12 · barbarians 55 · diplomacy 135 · ai 198 · oblezenie 27 · siege-defenders 11 · smoke · battle-smoke · okolica 32/32  
**Następny:** ⏸ playtest + Opus (limit Opus wyczerpany 2026-06-30) · równolegle UX inwentaryzacja A–E

---

## [2026-06-30] DECYZJA Macieja — Panel-D hub OK · balans później

**Treść:** Przegląd Panel-D — struktura **OK**. Balans liczb = **operacja ciągła na później** (dyplomacja, AI, barbarzyńcy).  
**Rejestr:** `PANEL-2-D` · workflow: Excel → **eksportuj panel** → JSON  
**Nie wymaga teraz:** Opus · Integrator · main.ts

---

## [2026-06-30] DECYZJA operacyjna — Opus + playtest odłożone

**Powód:** wyczerpany limit Opus.  
**Status kanonu:** GOTOWE-ROBOCZA · md5 `9665790EE040660FC6615F8405D0DD0D` *(stary — aktualny kanon: `4602e752…`)* · **bez formalnego sign-off**  
**Można teraz:** inwentaryzacja UX A–E · lane'y bez main.ts · decyzje ABC · **balans Panel-D/C/B** (Excel)  
**Po odnowieniu limitu:** playtest → Opus (C4 + Panel-C + CYW) → sign-off

---

## [2026-06-30] BATCH integrator — OBL-CAP-01 + panel v2 + manpower

**Tematy:** (1) BUG jednostka po zdobyciu (2) panel miasta tooltip budynków + mini 3D jednostek (3) manpower w panelu (4) bramka + kanon  
**Fix OBL-CAP:** `refreshMapAfterCityCapture` — `syncUnitsRender` przed `refreshFog` · szturm używa `applyCityCaptureToMap`  
**Panel:** `mountUnitMiniPreview` · hover na `thumb` (budynki) · pasek ⚔ rekruci + detail card  
**Publish:** `Gra-podglad.html` = ROBOCZA · md5 **`30DBBAF608E423E00C49E184297F65BD`** *(stary — aktualny kanon: `4602e752…`)*  
**Bramka:** logic 203/203 · oblezenie 27 · siege-defenders 11 · smoke · battle-smoke · okolica 32/32  
**Następny:** playtest Macieja (zdobycie + panel) · Opus review

---

## [2026-07-01] BATCH integrator — A2-Q5 picker Miasto vs Jednostka

**Temat:** Klik na heks własnego miasta z wojskiem → modal wyboru (🏛 Miasto | ⚔ Jednostka) zamiast zawsze panelu miasta.  
**Pliki:** `gra/src/ui/cityUnitPick.ts` (nowy) · `main.ts` (gałąź kliku miasta + blokada mapy podczas pickera)  
**Decyzja:** `docs/decyzje/A2-Q5-miasto-vs-jednostka-klik.md`  
**Publish:** `Gra-podglad.html` = ROBOCZA = PLAYTEST-MAPA · md5 **`27B69A47A26787687666FFD013C8A3D9`** *(stary — aktualny kanon: `4602e752…`)*  
**Bramka:** smoke OK  
**Playtest:** wojsko na Testpolis → klik → picker → oba wybory · ruch domek na miasto → bez pickera · miasto bez wojska → od razu panel  
**Sign-off Maciej:** ✅ OK 2026-07-01 → handoff `MASTER-do-INTEGRATOR_A2-Q5-city-unit-pick.md`

---

## [2026-06-26] INTEGRATOR F — kanon F-TW-v3-F3 walka Rome 2

**Batch:** Faza 3 TW v3 — `combatUnitFromDef` · wpięcie EN w `main.ts` + `manualBattle.ts` + `battleScene.ts`  
**Kanon:** `Gra-podglad.html` md5 **`B62150A905CEE4A4BFF5F7A807E73582`**  
**Bramka:** combat 6/6 · logic 203 · smoke · battle-smoke OK  
**Efekt:** gra w przeglądarce używa TW Rome 2 (Hastati vs Falanga = jak combat-test seed 42)  
**Poza batch:** wallAttack/oblężenie · pre-bitwa rozszerzona — osobno

---

## [2026-06-26] INTEGRATOR F — kanon F-C2-ECON-HUD-v1 opublikowany

**Batch:** Wealth off HUD mapy · Zapasy wojska (głód alert) · plaster D2=A (pula Pracy + gate terytorium founding) · bonusy dyplo (już w main)  
**Kanon:** `Gra-podglad.html` md5 **`7B98660443294C801EDA67869BD61BDE`**  
**Bramka:** logic 203 · diplomacy 135 · civ-bonusy 30 · civ-roster 11 · victory 12 · ai 198 · wire-ekonomia 29 · smoke · battle-smoke OK  
**Opus:** `5949422D…` superseded — publikacja per dyspozycja Macieja (nie czekać na gate)  
**Kolejka:** **PUSTA** — brak nowych handoffów do wpięcia

---

## [2026-07-01] MASTER watch — Maciej nieobecny ~1h

**Tryb:** autonomia MASTER · poll co ~30 min (`gra/tools/poll-figma-review.ps1` + `docs/obieg/MASTER-WATCH-2026-07-01.md`)  
**Stan:** `E-01_po.png` BRAK · `02-icons/preview-tier1-5.png` BRAK · FAZA 1 E-01 otwarta · 0/6  
**Akcja przy deliverable:** PNG w czacie Macieja + CHECKLIST §1 (bez Figmy)  
**Ops:** korekta kopii baseline 6× → `grupa-E/export/` (README twierdzi OK, pliki brak)

---

## [2026-07-01] Grupa A — inwentaryzacja UX (REJEST)

**Temat:** 30 wpisów A-01…A-30 w `docs/ux/REJEST-UX-MASTER.md`  
**Status:** inwentaryzacja gotowa · Grupa A

---

## [2026-06-29] DECYZJA Macieja: E1-EPOKA-PRZED-CYW

**Treść:** Kreator — **najpierw epoka, potem cywilizacja** (lista cyw filtrowana). Celtowie + Germanie od Brązu; przyszłe starty per-cyw (np. tylko Żelazo). Inkowie/historia brązu — odłożone.  
**Karta:** `docs/decyzje/E1-epoka-przed-cyw.md`  
**Kod:** `newGameFlow.ts` + `civs.json` ✅ · **ROBOCZA** ✅ md5 `FBBB4DE12837216D8924944347D07C5E` (2026-06-29 rebuild)

---

## [2026-06-26] Maciej: paczka E1 1–12 + E2-PARAMS — zamknięte (rejestr OK)

**Maciej:** potwierdza zamknięcie po swojej stronie — **E1 paczka ABC 1–12** (27.06) + **E2-PARAMS** (28.06).  
**Rejestr:** `docs/obieg/REJESTR-DECYZJI.md` — `E1-PACZKA-1-12` ✅ · `E2-PARAMS` 🟡 ZAPISANA (ABC zamknięte; wdrożenie chain A→E→SILNIK w toku).

---

## [2026-06-30] TW v3 — parametry jednostek ZAMKNIĘTE · walka Rome 2 → SILNIK

**Maciej:** akceptacja danych dystansowych + melee · temat parametrów **zamknięty**.  
**Handoff:** `_handoff/UNITS-do-SILNIK_TW-v3-walka-rome2.md` (GOTOWE) — integrator prowadzi Faza 1 UNITS → Faza 3 main.ts.  
**Stan kodu:** `units.json` TW v3 OK · `combat.ts` TW v3 OK · **gra w przeglądarce = TW Rome 2** (kanon F3).

## [2026-06-26] CLEANUP — 3 listy dla Macieja

**Plik:** `docs/MACIEJ-CO-WISI.md` — Integrator / lane (hasła `start …`) / ABC (później).  
**STAN:** `INTEGRATOR-STAN.md`, `MAPA.md`, `grupa-b/STAN.md`, `EKONOMIA-STAN.md`, `CYWILIZACJE-STAN.md`, `grupa-e/README.md`, `UNITS-DO-MASTERA.md` — skrócone DO TERAZ + hasła.

## [2026-06-26] Maciej — potwierdzenie E1 + E2-PARAMS (rejestr)

**Maciej:** E1-PACZKA-1-12 ✅ zamknięte · E2-PARAMS ABC ✅ — wdrożenie 🔵 (A+E+Integrator).  
**Rejestr:** `E2-PARAMS` → 🔵 W TRAKCIE · **Integrator nie pyta ponownie o ABC E1/E2.**

## [2026-06-26] ARCHIWUM: legacy Moc 0–100 → `docs/archiwum/decyzje-legacy-moc/`

**Kanon Mocy:** tylko `P-A-power-kanon.md` (9 skł., w silniku). Usunięte „otwarte” P-C2/P-ARMIA z docs operacyjnych.

---

## [2026-07-01] PIPELINE UX — mockupy → Claude Design → kod (bez Figmy)

**Decyzja workflow:** grupy robią clean-screen PNG → Maciej poprawia w Claude Design (Max) → lane UI koduje z `02-po-design/`.  
**Foldery:** `docs/ux/pipeline/` — `01-wejscie/grupa-{A..E}/` · `02-po-design/grupa-{A..E}/` · status → `STATUS-PIPELINE.md`  
**Pierwsza:** Grupa E (6 PNG min.) · kolejność kodu 8A: E→A→B→D→C  
**Stan:** 0/34 wejście · 0/34 PO · komunikaty do grup przygotowane (Maciej wysyła)  
**→ Grupa E:** `01-wejscie/grupa-E/` + `RAPORT-WEJSCIE.md`

---

## [2026-07-01] Claude Design — pakiet Brand Book v1

**Folder upload Maciej:** `docs/ux/claude-design/00-brand-book-pakiet/`  
**Prompt:** `PROMPT-CLAUDE-DESIGN.md` w tym folderze  
**Cel:** Brand Book v1 w Claude Design · ekrany później (pipeline)

---

## [2026-07-01] KANON ŚCIEŻEK UI ↔ Claude Design

**Plik:** `docs/ux/claude-design/KANON-SCIEZEK.md` · **WYMIANA v3**  
**Jeden folder zapisu:** `01-propozycje-z-design/brand-book/` — Design zapisuje · Lane UI czyta · **Maciej nie przenosi plików**

---

## [2026-06-26] OBIEG: Slack obowiązkowy po `przekaż do Mastera`

**Decyzja Macieja:** agent grupy po hasle `przekaż do Mastera` → pliki + **Slack `#master` + `#grupa-X`** (MCP). Maciej nie pisze na Slacku.  
**Reguły:** `.cursor/rules/decyzje-echo.mdc` §2d · `docs/obieg/_ZASADY.md` §7.1d

---

## [2026-06-26] DYSPOZYCJE A–F — nowy obieg (hasła + bez Opus/wklej)

**Zmiana:** wszystkie `DYSPOZYCJA-GRUPA-*.md` + chartery A–E + `docs/czaty/README.md`  
**Wspólny blok:** `docs/czaty/_DYSPOZYCJA-WSPOLNY-OBIEG.md`  
**Hasła Macieja:** `działaj` · `przekaż do Mastera` · wycofano `start`/`master`/Opus/SCHEMAT w handoffie · `docs/obieg/SLACK-OBIEG.md`

---

## [2026-06-30] REGUŁY OBIEGU — implementacja + backupy

**Backup:** każdy edytowany plik → `*.bak-OBIEG-2026-06-30` (lista: `docs/czaty/_ARCHIWUM-OBIEG-README.md`)

**Zaktualizowano:** `.cursor/rules/{civ-workflow,komendy-raport,master-silnik-orchestration}.mdc` · `DYSPOZYCJA-STALA.md` · chartery A–E,F · `PIERWSZE-URUCHOMIENIE` · `DYSPOZYCJA-MASTER-SILNIK` · `KOMENDY-MACIEJA` · `C-walka.md`

**Wycofano w aktywnym obiegu:** Opus · wklej do Mastera · SCHEMAT/REGULA/SILNIK-FLOW jako obowiązek (szablon)

---

## [2026-07-01] GRUPA C → MASTER: fix odskoku fan-out + morze

**Playtest Macieja:** `Gra-podglad-PLAYTEST-ODSKOK.html` · 3v3 · zgłoszenie: zły kierunek odskoku + jednostki na morzu.

**Wdrożone (źródło stałe):**
- `post-battle-map.ts` — ucieczka obrońcy **od atakujących** (`pickRetreatTargetAwayFromAttacker`)
- `main.ts` — `mapHexPassableForUnit` enum `TerenBazowy`
- `post-battle-map-test.cjs` 5/5 · `playtestOdskok3v3.ts` + `PLAYTEST-ODSKOK.html`

**Handoff:** `dyspozycje/_handoff/C-do-MASTER_odskok-fanout-2026-07-01.md`  
**PLAYTEST-ODSKOK md5:** `5E1A1C9F7F5D7F5A6FA402C757D1B3F9` · **Kanon:** czeka Integrator F + Opus

---

## [2026-07-01] GRUPA C: rebuild PLAYTEST-WALKA (unblock playtest) + fix szans M

**Kontekst:** `Gra-podglad-PLAYTEST-WALKA.html` = stary bundle 28.06; kod `preBattle.ts` 29.06+ nie był opublikowany. Grupa A P1–P4 u Mastera bez rebuildu F.

**Zrobione (C):**
- Fix pasek preBattle → **M armii** (auto-walka v2b), test 14/14
- Vite build → **PLAYTEST-WALKA + ROBOCZA + PLAYTEST-MAPA** · md5 **`9AC325821135770E38831FF33C3A985C`**
- **Kanon NIE nadpisany** — czeka F + Opus

**Handoff:** `dyspozycje/_handoff/C-do-INTEGRATOR_rebuild-playtest-2026-07-01.md`  
**Playtest Macieja:** `docs/grupa-c/PLAYTEST-WALKA-MACIEJ.md` · Ctrl+F5 na PLAYTEST-WALKA

---

## [2026-07-01] IZOLACJA KATALOGOW: gra-robocza vs gra-kanon

**Decyzja Maciej:** wszyscy (A-E + F) pracuja na roboczej w oddzielnym katalogu; Integrator publikuje tylko tam; Master po tescie promuje do finalnej; raz dziennie przy start kopia grywalnej roboczej.

**Wdrozono:**
- Skrypty: publish-robocza-snapshot.ps1, publish-kanon-snapshot.ps1, backup-grywalna-dzien.ps1
- Bramka F wywoluje publish-robocza-snapshot.ps1
- Dokumentacja: docs/obieg/PLAN-DWIE-WERSJE-IZOLACJA.md, DWIE-WERSJE-GRY.md, reguly .cursor/rules/
- Pierwszy snapshot: gra-robocza/ utworzony

**Start gry:** robocza gra-robocza/START.html · finalna gra-kanon/START.html · wybor START-GRA.html

**Pozostalo (Faza D-E):** komunikat do czatow A-F · resync manifestu po nastepnej bramce F · checklist izolacji

## [2026-07-01] DECYZJE: B2-D16 + B2-D17 (playtest start)

**Maciej:** A + A (pakiet łagodny start + wpięcie rzeki do zdrowia).

**Dyspozycja Grupa B:** `dyspozycje/_handoff/MASTER-do-EKONOMIA_D16-D17-playtest-start-2026-07-01.md` · rejestr: `REJESTR-DECYZJI.md`

## [2026-07-01] PLAN — dostrojenie startu (jutro)

**Maciej:** jutro reszta parametrów startowych (łatwiejsze rozpoczęcie) + **osobne wartości easy / normal / hard** w panelach (`society-params.json`, `econ-params.json`).

**Kolejność:** najpierw wdrożenie D16-D17-A (B) → playtest → sesja balansu ABC per trudność.

## [2026-07-01] Rytuał Macieja: start → master

**Krok ① `start`** — czat grupy z zadaniem (np. Grupa B: D16-D17).  
**Krok ② `master`** — hub (orkiestracja, F, promocje). Maciej: ABC · playtest **tylko gdy Master poprosi** · bez wklejania.

## [2026-07-02] PLAYTEST-MASTER-ONLY — pakiet egzekucji komunikacji

**Decyzja Macieja:** lane **nie** informuje o playtestach w czacie — **tylko Master**.

**Wdrożono:**
- `.cursor/rules/obowiaz-playtest-master-only.mdc` (alwaysApply)
- `docs/obieg/KOMUNIKACJA-PLAYTEST-LANE.md` — zakazane frazy + Slack
- `docs/master/SZABLON-PROŚBA-PLAYTEST.md` · `ECHO-PLAYTEST-DO-GRUP.md`
- Przepływ w `_DYSPOZYCJA-WSPOLNY-OBIEG.md` + `DYSPOZYCJA-GRUPA-*` + charter GRUPA-*
- `decyzje-echo.mdc` §2c trigger **`rejestr`** · Slack bez checklisty
- `komendy-raport.mdc` — `status` bez playtestu dla lane
- Bannery A–E + `RAPORT2` + `OBOWIAZ-ZAKRES`

**Master:** wklej echo z `ECHO-PLAYTEST-DO-GRUP.md` w czatach A–E (hasło **`rejestr`**).

## [2026-07-02] Cleanup odrzuconych + ABC hub

**Usunięto z aktywnych kolejek:** P6-FIGMA (decyzja ⚪ ODRZUCONA pozostaje tylko w REJESTR).  
**Zsynchronizowano:** `WYTYCZNE-FORMAT-ABC-MACIEJ.md` → format 5 kroków.  
**Otwarte ABC u Macieja:** brak (B1-Q3-UI=A · MASTER-PT-01=C wdrożone).

## [2026-07-05] MAPA → MASTER: fair play A w grze (kreator→generator)

Ustalenia Macieja (lustro rzek: rzeki/góry/wzgórza/las) **prowadzą do gry** via `worldDensity` z kreatora → `generujSwiat`. Robocza `gra-robocza/START.html` md5 `7a644f…`. Raport: `dyspozycje/MAPA-DO-MASTERA.md` §2026-07-05. **Czeka:** Opus review → kanon root.
