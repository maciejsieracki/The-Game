## TWOJ PELNY KONTEKST (czytaj NAJPIERW)
Jestes taskiem **Civ-SILNIK**.
TRIGGER: gdy Maciej napisze "start" (albo "sprawdz dyspozycje") -> przeczytaj TEN plik od nowa, wykonaj NAJNOWSZA sekcje (START / DO ZROBIENIA TERAZ / ODPOWIEDZ MASTERA) i raportuj (plik + czat).
WDRAZANIE DYSPOZYCJI: to, co master wpisze Ci do tego pliku (ODPOWIEDZ MASTERA / START / DO ZROBIENIA), WDRAZAJ OD RAZU, BEZ PYTANIA. Pytaj tylko gdy: brak danych do decyzji, blokada, albo master wprost prosi o potwierdzenie.
JESLI MASZ PYTANIE/WATPLIWOSC: zadaj je Maciej W CZACIE (tresc) ORAZ dopisz do dyspozycje/SILNIK-DO-MASTERA.md na DOLE z godzina. NIE kasuj wczesniejszych wpisow -- to historia Q&A. NIE uzywaj narzedzia AskUserQuestion ani popupu wyboru -- pytania zadawaj WYLACZNIE zwyklym tekstem w czacie.
AUTONOMIA (lancuch): po KAZDYM ukonczonym kroku -> raport (plik + czat) -> przeczytaj swoj plik OD NOWA; jesli jest kolejny krok lub nowa dyspozycja od mastera, bierz JE OD RAZU (bez czekania na nowe "start"). Zatrzymaj sie TYLKO przy pytaniu/blokadzie albo gdy caly plan wyczerpany (wtedy czekaj na "start").
RAPORTOWANIE WATKU (transparentnosc): gdy zadasz pytanie i master odpowie, ZRAPORTUJ Maciej w CZACIE + dopisz do SILNIK-DO-MASTERA.md trzy rzeczy: (1) jakie pytanie zadales, (2) co master odpowiedzial, (3) jaka metode/decyzje przyjales. Maciej ma zawsze widziec caly watek Twojej rozmowy z masterem.
SZCZEGOLOWY ZAKRES TWOICH ZADAN JEST W EXCELU `Status-projektu-The-Game.xlsx` (folder Civ):
- zakladka **Civ-SILNIK** = Twoja lista krokow; po wykonaniu ustaw Status = "Zrobione" -> wiersz sie zazieleni.
- "Status wg grup" = pelny spis (filtruj kolumne Task = Civ-SILNIK).
- "Podsumowanie" = statystyka; "Taski" = kto za co + pliki + panel sterowania.
INSTRUKCJE OPERACYJNE + KANAL = TEN plik (dyspozycje/SILNIK.md): za co odpowiadasz, PLAN DZIALANIA, pliki kodu,
PANEL STEROWANIA (Excele-parametry). Pytania/raporty -> dyspozycje/SILNIK-DO-MASTERA.md ORAZ to samo w czacie.
ZASADY: dzialasz TYLKO na swoich plikach. Tylko Civ-SILNIK rusza main.ts i publikuje kanon Gra-podglad.html.
Build do testu: `npx vite build --outDir /tmp/civ-dist` (zwykly `npx vite build` pada na blokadzie OneDrive `dist/`),
potem `cp /tmp/civ-dist/index.html` do celu. NIGDY `npm run build` / `export-data.py`.
KOLEJNOSC: najpierw zakladka w Excelu (co i w jakiej kolejnosci), potem szczegoly w tym pliku.
Po kroku: odhacz w Excelu + raport do skrzynki i w czat.

---

# MAILBOX: Civ-SILNIK (silnik / integracja / kanon)
Lane: src/main.ts + wpinanie game/* + JEDYNY publisher Gra-podglad.html. NIE ruszaj units.ts/render/battle-internal/Excel.
BUILD: ZAWSZE `npx vite build` (NIGDY npm run build). Kanal: raport do SILNIK-DO-MASTERA.md ORAZ w czat.

## PLAN DZIALANIA (po kolei; po KAZDYM: build + testy + nowy kanon; odhacz [x])
[ ] 1. KONSOLIDACJA: po hydracji `npx vite build` + smoke/battle-smoke/logic/combat + publikacja Gra-podglad.html
       (wciagnie wizualia Units: kolory/super/helmy). NIE czekaj na linie typeId.
[ ] 2. M2 produkcja: wepnij production.ts (kolejka, postep wg Pracy, ukonczenie) + budowa/ulepszanie budynkow.
[ ] 3. M4 AI: wepnij ai.ts (tura rywali) + victory.ts (zwyciestwo + ekran konca).
[ ] 4. M3 walka z mapy: atak->przedbitwa->wynik na mape; wepnij siege.ts + manualBattle.ts.
[ ] 5. M5 spoleczenstwo: wepnij diplomacy.ts + culture-religion.ts + order.ts (NAJPIERW napraw bug testu order).
[ ] 6. M6 save: wepnij save.ts (zebrac stan -> zapis/odczyt + sloty).
[ ] 7. Nowa gra: flow startu -> generacja -> gra (UI od Civ-UI).
[ ] 8. Higiena: fix export-data.py (zaszyta sciezka) + usun orphany research.ts/player-economy.ts.

## DO ZROBIENIA TERAZ

**[2026-06-29] C4-Q1=A — balans macierzy v2.0 → SILNIK (P0 batch)**

**Flaga:** **→ SILNIK: GOTOWE** · handoff: `_handoff/UNITS-do-SILNIK_C4-balans-macierz.md`

| Krok | Akcja |
|------|--------|
| **1** | `main.ts`: mapowanie `Obrażenia` → `CombatUnit.Obrazenia` (wzór: `battleScene.ts` `toCombatUnit`) |
| **2** | Build `$env:TEMP\civ-dist` + combat 6/6 + battle-smoke |
| **3** | `Gra-podglad-ROBOCZA.html` → Opus przed kanonem |

**UNITS dostarczyło:** `units.json` (9 jedn.) · `combat.ts` macierz v2 · `manualBattle`/`battleScene` adaptery.

**NIE:** C1/C2/C3 · lane tematy (OBL-S6, menu, B1-tech).

---

**[2026-06-29] MASTER → SILNIK: ROZDYSponuj WSZYSTKIE wiszące tematy lane**

**Flaga:** **→ SILNIK: ROZDYSponuj TERAZ** · MASTER **nie trzyma** kolejki.

**Manifest:** `SILNIK-ROZDYSponowANIE-LANE-2026-06-29.md` (czytaj **CAŁY**)

| Krok | Akcja |
|------|--------|
| **1** | **Wpięcie P0** — victory · barbarians · Grupa D integracja (handoffy § A) |
| **2** | **Przypomnij Maciejowi** — Opus Ask + playtest (§ C) |
| **3** | **Eskaluj lane** — dopisz dyspozycję + powiedz Maciejowi: otwórz czat MAPA/UI/EKO/UNITS → `start` (§ B) |
| **4** | **NIE koduj** OBL-S6 · menu · złoża · B1-tech — to lane |
| **5** | Meldunek `SILNIK-DO-MASTERA.md` (szablon § F) |

**Kod sesji 28.06 = WPIĘTY** (md5 `0a049ccc…`). Nowy kod tylko z § A lub po `→ SILNIK: GOTOWE` od lane.

---

**[2026-06-29] AUDYT KOLEJEK — MASTER → SILNIK (archiwum)**

Handoff: `_handoff/MASTER-do-SILNIK_audyt-kolejka-2026-06-29.md` · stan: `MASTER-KOLEJKA-STAN-2026-06-29.md`

| Priorytet | Akcja |
|-----------|--------|
| **P0** | Potwierdź audyt meldunkiem § START w `SILNIK-DO-MASTERA.md` |
| **P0** | Przypomnij Maciejowi: **Opus** + **playtest** (handoff 28.06) |
| **P1** | Po `→ SILNIK: GOTOWE` od lane — 1 batch main.ts + bramka |
| **NIE** | diplomacy 3 FAIL · OBL-S6 · menu · Excel AI — lane CYW/UI/MAPA |

**Kod sesji = WPIĘTY** (md5 `0a049ccc…`). **Nie koduj** bez regresji lub nowego handoffu.

---

**[2026-06-28] AUDIT START — MASTER Work → SILNIK (Maciej: nowa sesja)**

Handoff: `_handoff/MASTER-do-SILNIK_AUDIT-START-2026-06-28.md`  
**MASTER Work:** kolejka **PUSTA** — wszystko oddane.  
**SILNIK:** (1) czekaj playtest Maciej + Opus (2) eskaluj CYW **3 FAIL diplomacy** (3) **NIE koduj** bez regresji.

| Wisi u SILNIKA | Status |
|----------------|--------|
| Playtest checklist | **CZEKA Maciej** |
| Opus HUD-S7 | **CZEKA** |
| diplomacy 132/135 | **CZEKA CYW** → potem re-bramka |
| ROBOCZA | md5 `0a049ccc…` (= kanon) |

**Lane nie podjęte:** UI E-P0-01 · MAPA OBL-S6 · CYW D-P0-01 — patrz `SILNIK-PRZEKAZANIE-LANE-2026-06-28.md`

---

**[2026-06-28] Delegacja lane WYSŁANA** — manifest: `SILNIK-PRZEKAZANIE-LANE-2026-06-28.md`  
**[2026-06-28] Bramka sesji wykonana** — meldunek MASTER · playtest Maciej CZEKA · Opus CZEKA

---

**[2026-06-28] ROUTING MASTER Work — pełna mapa sesji**

Handoff: `_handoff/MASTER-do-SILNIK_ROUTING-MASTER-WORK-2026-06-28.md`  
**Czytaj najpierw** — co SILNIK testuje vs co **przekaż UI/MAPA/CYW/Opus** (NIE TWOJE).

---

**[2026-06-28] MASTER → SILNIK: TYLKO TEST (kod sesji WPIĘTY)**

Handoff: `_handoff/MASTER-do-SILNIK_handoff-test-sesja-2026-06-28.md`

| Krok | Akcja |
|------|--------|
| 1 | Bramka testów (komendy w handoff) |
| 2 | Playtest checklist Maciej |
| 3 | Meldunek `SILNIK-DO-MASTERA.md` |
| 4 | Przekaż Opus → kanon (HUD-S7) |

**NIE koduj** — chyba że FAIL bramki. Reszta pracy → lane (patrz `MASTER-DELEGACJA-LANE-2026-06-28.md`).

**NIE TWOJE (przekaż Maciejowi / lane):** OBL-S6→MAPA · UI-P1-02→UI · MAP-P1-04→MAPA · CYW D-P0/E-P0→CYW · EKO-P2-01→EKONOMIA · E-P0 menu→UI · Opus→HUD-S7.

---

**[2026-06-27] BATCH POTWIERDZONE — MASTER → SILNIK · PILNE**

Handoff: `dyspozycje/_handoff/MASTER-do-SILNIK_batch-potwierdzone-2026-06-27.md`

| Pakiet | Status MASTER | SILNIK robi |
|--------|---------------|-------------|
| **P0-01…05** D-START | ✅ kod | build + testy + ROBOCZA |
| **SIL-UX-1** podział pracy | ✅ `cityPanel.ts` | weryfikacja + ROBOCZA |
| **E1-UX-02** kreator + ABC B | ✅ `newGameFlow` + `main.ts` | playtest krok 4 + ROBOCZA |

**TERAZ:** bramka testów → `Gra-podglad-ROBOCZA.html` → meldunek `SILNIK-DO-MASTERA.md` → Opus → kanon.

Szczegóły podziału pracy: `MASTER-do-SILNIK_podzial-pracy-balance.md`

---

**[2026-06-27] P0 D-START luki — WPIETE w main.ts (batch 2026-06-27-P0)**

| ID | Status | Notatka |
|----|--------|---------|
| P0-01…P0-05 | **WPIETE** | backup `main.ts.bak-SILNIK-2026-06-27-P0` |
| P0-06 | **WPIETE** | `Gra-podglad-ROBOCZA.html` md5 `428E4FD4BD76C46EBC1935AF4B343181` |
| Playtest Macieja | **CZEKA** | kreator → N bez crash |

**Następny priorytet:** Opus review → kanon · MAP-P1-02 obóz 3D (lane MAPA)

**Kolejka pilna (Maciej):** `dyspozycje/PILNE-KOLEJKA-2026-06-27.md`

| Batch | Status |
|-------|--------|
| **SIL-INT-1..3** | **✅ WPIĘTE** 2026-06-27 — handoff `MASTER-do-SILNIK_SIL-INT-batch-2026-06-27.md` |
| **OBL-S5/S7** | **✅ WPIĘTE** (machiny + siegeAi) |
| **Opus → kanon** | **CZEKA** — ROBOCZA md5 `b1eb8091` |
| **OBL-S6 obóz 3D** | **CZEKA MAPA** |

---

**[2026-06-27] P0 — Grupa D: integracja UI dyplomacji + drzewko epoki (ZAMKNIĘTE w batch P0)**

Handoff: `dyspozycje/_handoff/CYWILIZACJE-do-SILNIK_F-GRUPA-D-P0-integracja.md`  
Moduły UI **GOTOWE** — tylko 2 batchy w `main.ts`:

| Batch | Co | Plik |
|-------|-----|------|
| **SILNIK-D-P0-1** | ~~Dyplomacja lista akcje~~ | **BLOK** — czeka D3-Q2 audiencja |
| **SILNIK-D-P0-2** | `configureSciencePicker`: `getPlayerEra: () => player.era` | main.ts |
| **SILNIK-D-P0-3** | Bramka: civ-bonusy 30/30 + diplomacy + smoke + build | testy |
| **SILNIK-D-P0-4** | Bitwa: `civBonusyForOwnerId` → BattleScene + ManualBattle | main.ts |

**Po PASS → Opus → kanon.** UNITS P0 **GOTOWE** (combat 6/6, battle-smoke OK).

---

**[2026-06-27] P0 — Oblężenie C3 logika w grze (Maciej: najszybciej do gry, obóz 3D później)**

Pełna spec batchy: `dyspozycje/_handoff/MASTER-do-SILNIK_oblezenie-C3-batchy.md`  
STAN: `dyspozycje/SILNIK-STAN.md`

| Batch | Status | Co |
|-------|--------|-----|
| **OBL-S1** | ✅ DONE | Q1 dialog, jeden zegar głodu, Q3=B kapitulacja, reset doStartGame |
| **OBL-S2** | ✅ DONE | save/load + validate odjazd + AI auto-blokada |
| **OBL-S3** | ✅ DONE | panel rozszerzony (atrycja, oblegający, machiny placeholder) |
| **OBL-S4** | ✅ DONE | milicja 20% w szturmie |
| **HUD-S1** | ✅ DONE | blocking pusta produkcja |
| **OBL-S5** | **TERAZ** | machiny Q8=C — kontrakt UNITS |
| **OBL-S6** | CZEKA MAPA | obóz 3D Q10 — po S5 |

**Wdróż S5 → deleguj S6/S7 → Opus → kanon.** Backlog: `_handoff/MASTER-do-SILNIK_backlog-pilne-2026-06-27.md`

---

**[2026-06-27] OBL-MAP-01 (playtest → gra)** — częściowo w main.ts; domknięcie w OBL-S1/S2 powyżej.  
Handoff: `dyspozycje/_handoff/GRUPA-C-do-SILNIK_oblezenie-mapy-kanon.md`

## HISTORIA
- rdzen wpiety: turn-economy, playerState, combat, battleScene, cityPanel, preBattle.


## PLIKI + PANEL STEROWANIA (parametry dla Maciej)
KOD: src/main.ts + wpinanie src/game/* (+ build/kanon).
PANEL STEROWANIA (Excele, ktore utrzymujesz dla Maciej -- on tam stroi wspolczynniki):
- Ekonomia-parametry.xlsx  -> econ-params.json   (Praca/Pieniadz/wzrost/zywnosc, easy/normal/hard)
- Budynki.xlsx             -> buildings.json      (baza+przyrost per param, koszty, epoki)
- Surowce.xlsx             -> resources.json
- Technologie-drzewko.xlsx -> tech.json           (koszty nauki, prereq, odblokowania)
- AI-parametry.xlsx        -> ai-params.json
- Dyplomacja.xlsx          -> diplomacy.json       (Zaufanie/Respekt, progi)
- Spoleczenstwo-parametry.xlsx -> society-params.json (Zadowolenie=Szczescie+Porzadek, progi T1/T2)
REGULA: zmiany wspolczynnikow wpisuj do tych Exceli (to panel Maciej), potem TARGETED export TYLKO danego JSON
(celowany skrypt na 1 arkusz). NIGDY export-data.py / npm run build (regeneruja wszystkie JSON -> kasuja cudza prace).

## START — ZIELONE (Maciej): rusz KROK 2 (produkcja).
Wepnij istniejacy production.ts + budowa/ulepszanie budynkow w petle tury (main.ts). Moduly juz sa na dysku. Po wpieciu: build (--outDir /tmp/civ-dist) + testy + publikacja kanonu. Styk: jak MUSISZ tknac production.ts/economy.ts (cudze lane) -> popros o wersje przez _handoff/, nie edytuj rownolegle.

[MASTER 2026-06-23T00:03Z] Self-check przestawiony z co 10 min na CO GODZINE (cron ustawil master, rozlozony w godzinie). Nic nie musisz robic — chodzi dalej, tylko rzadziej.

## WERDYKT MASTERA [2026-06-22 21:45] -- (a) REBUILD KANONU  (b) CivDef.Religia  (c) spawn-konsument
(a) UNITS zmienil units.ts (helmy/luki + typeId na mapie) i prosi o rebuild -> zrob krok 1 TERAZ: `npx vite build --outDir /tmp/civ-dist` -> cp do Civ/Gra-podglad.html; testy smoke/battle-smoke/logic/combat. POTEM krok 2 produkcja.
(b) CivDef w src/data/loader.ts NIE ma pola Religia (sprawdzone) -- dodaj 1 linie `Religia: string | null;` (civs.json juz je niesie). Drobne, przy okazji M2/M5.
(c) Spawn klastrow: spec = Spec-generator-mapy.md "0.1". MAPA rozmieszcza, Ty osadzasz w petli tury (M4/nowa gra), AI ekspanduje; konsumujesz paczke MAPA z _handoff/.
SNAPSHOT TESTOW (master 21:40): logic 162/163 (jedyny czerwony: "order: loadOrderParams scales by difficulty"), barbarians 53/0, diplomacy 78/0, upkeep 51/0; combat-test nieweryfikowalny w sandbox (esbuild /tmp). Bug order.ts naprawia MIASTO przed M5.


## [2026-06-24] DYSPOZYCJA MASTERA — model docelowy + decyzje
OBOWIAZUJE CIE PLAYBOOK: Civ/PLAYBOOK-operacyjny-Civ.md, sekcje 11-14 (limity iteracji, wspolpraca/handoffy, 6 technik, sedzia). Pelne zasady czytaj stamtad.
TWARDE LIMITY: loop max 3 przebiegi; verify max 2 cykle; fan-out pilot 2 -> max 10 (Haiku); max 12 subagentow/zadanie; tournament <=6 rund.
WSPOLPRACA: dzial<->dzial NIGDY wprost -> handoff dyspozycje/_handoff/ + meldunek masterowi. Edytujesz TYLKO swoje pliki. Integracja do silnika/kanonu = WYLACZNIE master. Dane wspoldzielone = raz w DANE/JSON, reszta czyta.
SEDZIA: tylko deliverable wysokiej stawki (do silnika/kanonu lub cross-lane) -> osobny swiezy agent wg DoD; rutyna = wlasne testy.
TRYB: event-driven — ruszasz gdy Maciej Cie wywola; bez auto-petli.
ZAKRES PRZEJAL MASTER: silnik + integracja prowadzi master. Dzial = standby; pod-zadania zleci master.


## [2026-06-24] OGLOSZENIE: SILNIK = MASTER
Dzial SILNIK zostal WCHLONIETY do mastera — to MASTER jest teraz silnikiem i integratorem. NIE ma osobnego okna Civ-SILNIK.
WSZYSTKO zwiazane ze spinaniem/wpinaniem do silnika lub kanonu (moduly, kontrakty, instrukcje wpiecia + DoD) zglaszaj MASTEROWI:
handoff w dyspozycje/_handoff/<TWOJ>-do-MASTER_<temat>.md + meldunek w <LANE>-DO-MASTERA.md. Master decyduje o wpieciu i publikuje kanon.
Pliki SILNIK (Civ/SILNIK/) zostaja jako referencja.


## [2026-06-24] REGULA: BACKUP PRZED ZMIANA (rolling)
Przed KAZDA zmiana pliku: `cp <plik> <plik>.bak-<TWOJ_DZIAL>` (1 rolling backup = ostatnia ZIELONA wersja). Edytuj plik roboczy, backup zostaje. Raportuj „zrobione" DOPIERO po: testy zielone (+ sedzia OK przy wysokiej stawce). Nastepny cykl: nadpisz backup swiezym z aktualnej dobrej wersji; nowe zmiany ZAWSZE do pliku roboczego, NIGDY do backupu. Padnie -> `cp .bak -> plik` (revert).

## [2026-06-24] (kanal standby — silnik prowadzi master)

---

## ODPOWIEDZ MASTERA (od MASTER Work)

### [2026-06-28] AUDIT START — Maciej nowa sesja

**Handoff:** `dyspozycje/_handoff/MASTER-do-SILNIK_AUDIT-START-2026-06-28.md`

**MASTER Work potwierdza:**
- Kolejka implementacji **PUSTA** — wszystkie batchy oddane (kod w repo lub delegacja lane).
- **Nie otwieraj ponownie** batchy P0 / SIL-UX-1 / kreator B / B5+F2 — są wpięte.

**SILNIK — Twoja kolejka dziś:**
1. **Playtest Maciej** — checklist `handoff-test-sesja-2026-06-28.md` § AC (CZEKA Maciej).
2. **Opus HUD-S7** — `OPUS-REVIEW-QUEUE.md` (CZEKA).
3. **diplomacy 3 FAIL** — eskaluj **CYW** (`CYWILIZACJE.md`); po ich fix → re-bramka u Ciebie.
4. **Lane** — przypomnij Maciejowi czaty: **Grupa E** (menu) · **Grupa A** (mapa) · **Grupa D** (`start`). Manifest: `SILNIK-PRZEKAZANIE-LANE-2026-06-28.md`.

**Melduj w `SILNIK-DO-MASTERA.md`:** status playtest / Opus / CYW diplomacy / czy lane odpowiedziały.
