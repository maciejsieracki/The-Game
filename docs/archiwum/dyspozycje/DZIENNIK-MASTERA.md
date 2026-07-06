# REJESTR PRZEPLYWOW — tablica kontrolna mastera
JEDNO miejsce ze stanem WSZYSTKICH otwartych watkow cross-lane. Master trzyma na biezaco.
Zasada przeplywu: dzialy NIE gadaja wprost (brak pelnego obrazu) -> zapytanie do mastera (lub Maciej) -> master routuje do wlasciwych dzialow, zbiera odpowiedzi, oddaje dalej. Kazdy watek = 1 wiersz tu.
Status: ROBIA / GOTOWE-do-wpiecia / BLOK(czeka na X) / WPIETE. **Aktualizacja:** 2026-06-28.

**Aktualizacja:** 2026-06-29.

## [2026-06-29] C4-Q1=A — WPIĘTE (build + ROBOCZA)

**ROBOCZA:** `Gra-podglad-ROBOCZA.html` md5 `0adf96de1a7b38d2021d0bf472e3565d`  
**Bramka:** combat 6/6 · battle-smoke OK · smoke OK · logic 203/203  
**Następny:** Opus Ask → kanon (po sign-off)

## [2026-06-29] C4-Q1=A — balans macierzy → SILNIK

**Decyzja Macieja:** C4-Q1=A · źródło: `Civ-UNITS/Macierz-walki-analiza.md` v2.0  
**UNITS:** `units.json` (9 jedn.) + `combat.ts` macierz v2 + testy 6/6 · handoff `UNITS-do-SILNIK_C4-balans-macierz.md`  
**→ SILNIK: GOTOWE** — wpięcie `Obrażenia` w `main.ts` + ROBOCZA

## [2026-06-29] MASTER → SILNIK: pełne rozdzielenie lane (Maciej)

**Manifest:** `dyspozycje/SILNIK-ROZDYSponowANIE-LANE-2026-06-29.md` · `MACIEJ-DELEGACJA-LANE-2026-06-29.md`  
**Werdykt:** MASTER **zero kolejki** · SILNIK = jedyny router · wpięcie P0 (victory/barbarians/D) + eskalacja MAPA/UI/EKO  
**→ SILNIK: ROZDYSponuj TERAZ**

## [2026-06-28] ROADMAP: nowy „spis treści" gry → `docs/ROADMAP-SPIS-TRESCI.md`

**Od:** Master (Opus) · **Trigger:** Maciej — przegląd całości, przepływy, spis rozdziałów per grupa.
**Zweryfikowano:** kanon = ROBOCZA (md5 `0a049ccc`) · bramka **ZIELONA** (logic 203, grupa-b 27, oblezenie 27, map-siege 6, siege-ai 17, cluster 35, diplomacy 135, civ-bonusy 30, ai 198, combat OK, society 18, wire 29, wealth 25, smoke OK; battle-smoke WARN znany).
**Blokady przepływów (6):** Opus review 28.06 niezarejestrowany przy kanon=ROBOCZA · playtest Macieja zaległy · B1-tech ABC · C3 atak miasta (spec A→F) · tracking rozproszony · GRUPA-E/MASTER-Work wspólny chat-id.

## [2026-06-28] CYW lane: E-P0-06 victory + E2-11 barbarians — GOTOWE → SILNIK

**Od:** lane CYWILIZACJE (Grupa D czat)  
**Moduły:** `victory.ts` (10=A*) · `barbarians.ts` + `map-rebels.ts` (11=C*)  
**Testy:** victory 12/12 · barbarians 55/55 · diplomacy 135/135 · civ-bonusy 30/30  
**Handoff:** `CYWILIZACJE-do-SILNIK_victory-10A.md` · `CYWILIZACJE-do-SILNIK_barbarians-11C.md`  
**SILNIK OPEN:** wpina 3 batche (5A aggression · victory input · barbarians era) — patrz audit 2026-06-28.

## [2026-06-29] AUDYT MASTER — kolejki wypchnięte → SILNIK

**Maciej:** weryfikacja ABC + zleceń · zero wiszenia u MASTER.  
**Handoff:** `_handoff/MASTER-do-SILNIK_audyt-kolejka-2026-06-29.md` · `MASTER-KOLEJKA-STAN-2026-06-29.md` · `MASTER-STAN.md`  
**Werdykt:** MASTER kod **PUSTY** · SILNIK: Opus/playtest · lane ROBIA (MAPA/UI/CYW/EKO).

---

## [2026-06-28] AUDIT START sesji — MASTER Work → SILNIK (Maciej)

**Handoff:** `dyspozycje/_handoff/MASTER-do-SILNIK_AUDIT-START-2026-06-28.md`  
**MASTER Work:** kolejka implementacji **PUSTA** — wszystkie ABC/zlecenia oddane (kod lub lane).  
**SILNIK:** playtest Maciej + Opus CZEKA · diplomacy 3 FAIL → CYW · lane UI/MAPA/CYW **ROBIA** (czekają `start` w czatach).  
**Blokada Macieja (nie MASTER):** B1-tech ABC Q1–Q5 OTWARTE.

---

## [2026-06-28] ARCHIWUM: Grupa A — pilna sesja HUD/SILNIK, karta D1–D15 → `docs/archiwum-czatow/master/MASTER-Grupa-A-pilna-HUD-SILNIK_2026-06-26_2026-06-28.md` · SYNC-EKSPORT: GRUPA-A → `eksport-pelny/GRUPA-A_KORESPONDENCJA.md` (1477 linii, chat `5cad5a18…`)

---

## [2026-06-28] SYNC-EKSPORT: MASTER-Silnik → eksport-pelny

**Trigger:** Maciej — „archiwizuj cały dzisiejszy czat"  
**Skrypt:** `sync-chat-export.py --slot MASTER-Silnik --chat-id 58b15435-b915-4a50-87ce-375f0e9ef1fe --mode full`  
**Plik:** `docs/archiwum-czatow/eksport-pelny/MASTER-Silnik_KORESPONDENCJA.md` (1153 linii transkryptu)  
**Handoff:** `docs/archiwum-czatow/eksport-pelny/MASTER-Silnik_HANDOFF-KONTEKST.md` (jeśli istnieje)

## [2026-06-28] ARCHIWUM: Grupa F — delegacja lane, test sesji, audyt wpięć → `docs/archiwum-czatow/lane/LANE-SILNIK-delegacja-test-sesja_2026-06-28.md` · SYNC-EKSPORT: GRUPA-F → `eksport-pelny/GRUPA-F_KORESPONDENCJA.md` (~1138 linii)

## [2026-06-28] ARCHIWUM: Grupa B B1 wyrąb/tartak + pilne → `docs/archiwum-czatow/lane/LANE-GRUPA-B-B1-wyrab-tartak-pilne_2026-06-27_2026-06-28.md` · SYNC-EKSPORT: GRUPA-B → `eksport-pelny/GRUPA-B_KORESPONDENCJA.md`

---

**Manifest:** `dyspozycje/MACIEJ-DELEGACJA-LANE-2026-06-28.md`  
**Czaty:** Civ-UI · Civ-MAPA · Civ-CYWILIZACJE · Civ-EKONOMIA · Opus Ask · HUD (osobny)

---

## [2026-06-28] Grupa F → lane: delegacja wysłana (SILNIK przekazuje)

**Manifest:** `dyspozycje/SILNIK-PRZEKAZANIE-LANE-2026-06-28.md`  
**SILNIK:** kod sesji WPIĘTY · bramka sesji **8/9** (diplomacy 3 FAIL → CYW) · meldunek `GOTOWE-ROBOCZA sesja-2026-28`

---

## [2026-06-28] ARCHIWUM: Master Work sesja pilna (26–28.06) → docs/archiwum-czatow/master/MASTER-Work-sesja-pilna_2026-06-26_2026-06-28.md

**SYNC-EKSPORT:** MASTER-Work → `eksport-pelny/MASTER-Work_KORESPONDENCJA.md` (full, chat `46bd9fdf…`)

---

## [2026-06-28] MASTER Work — weryfikacja routing (Maciej, ponowna)

**Handoff:** `dyspozycje/_handoff/MASTER-do-SILNIK_ROUTING-MASTER-WORK-2026-06-28.md`  
**Werdykt:** po stronie MASTER Work **wszystko z sesji zrobione i przekazane** · SILNIK = test/meldunek · reszta → lane (tabela w handoff).

---

## [2026-06-28] ARCHIWUM: sesja pilna kolejka SILNIK audyt MASTER → docs/archiwum-czatow/master/MASTER-pilna-kolejka-audit-SILNIK_2026-06-27_2026-06-28.md

**SYNC-EKSPORT:** GRUPA-C → eksport-pelny/GRUPA-C_KORESPONDENCJA.md (chat-id 5043a37d, delta 2026-06-28)

---

**Maciej:** weryfikacja tylko zakresu MASTER (nie SILNIK/Opus).  
**Domknięto:** handoff B5 · routing UI-P1-02/MAP-P1-04/EKO-P2-01 · `SILNIK.md` § NIE TWOJE.

---

**Plik:** `dyspozycje/MASTER-DELEGACJA-LANE-2026-06-28.md`  
**SILNIK:** TYLKO test · reszta → MAPA / UI / CYW / Opus  
**Status lane:** MAPA-STAN · UI-STAN · CYWILIZACJE-STAN zaktualizowane

---

## [2026-06-28] MASTER → SILNIK: handoff testowy (sesja pilna)

**Handoff:** `dyspozycje/_handoff/MASTER-do-SILNIK_handoff-test-sesja-2026-06-28.md`  
**Status:** GOTOWE-do-wpiecia → **SILNIK TESTUJ** (bramka MASTER już ZIELONA)  
**Publish:** `Gra-podglad.html` = `Gra-podglad-ROBOCZA.html`

---

## [2026-06-28] Grupa B → SILNIK: F-B-TARTAK-DREWNO (micro)

**Handoff:** `dyspozycje/_handoff/EKONOMIA-do-SILNIK_tartak-drewno-access.md` · **→ SILNIK: GOTOWE**  
**Lane B1:** domknięte · **Blok:** `docs/decyzje/B1-tech-ABC-OTWARTE.md` (Q1–Q5 czeka Maciej).

---

## [2026-06-28] SILNIK: HUD B5+F2 pilne — kanon=ROBOCZA

**Batch:** żywność państwa na pasku · warstwy kultura/religia przy minimapie · scalenie HTML  
**Status:** WPIETE · testy 203+27+6+17 ZIELONE · **CZEKA:** Opus → kanon oficjalny  
**Archiwum:** kontynuacja sesji MASTER pilnej 2026-06-28

---

## [2026-06-27] BATCH potwierdzone → SILNIK (Maciej PILNE)

**Handoff:** `dyspozycje/_handoff/MASTER-do-SILNIK_batch-potwierdzone-2026-06-27.md`  
**Wdrożone przez MASTER:** P0 D-START · SIL-UX-1 podział pracy · E1-UX-02 kreator (ABC B) · fog debug.  
**SILNIK TERAZ:** playtest Maciej (checklista AC) + meldunek `SILNIK-DO-MASTERA.md` → Opus → kanon.  
**ROBOCZA (MASTER build 2026-06-27):** md5 `428E4FD4BD76C46EBC1935AF4B343181` · testy: cluster 35/35 · diplomacy 135/135 · smoke OK

---

## [2026-06-27] Grupa B → SILNIK: F-B-WYRAB-TARTAK (tartak na lesie)

**Handoff:** `dyspozycje/_handoff/MAPA+EKONOMIA-do-SILNIK_wyrab-tartak-tech.md` · **→ SILNIK: GOTOWE — wykonaj TERAZ**  
**Decyzja:** tartak na lądzie i lesie; wyrąb usuwa las. Kolejka F: `F-KOLEJKA-P0.md` (po F-B-PILNE ✅).

---

**Kolejka:** `dyspozycje/P0-KOLEJKA-LUKI.md`  
**Batch SILNIK-2026-06-27-P0:** P0-01…P0-05 w kodzie + testy; P0-06 ROBOCZA zbudowana.  
**ROBOCZA md5:** `2EB0503483263B342D3CAB6A578B4BB5` (`Gra-podglad-ROBOCZA.html`)  
**Testy:** cluster-start 35/35 · diplomacy 135/135 · smoke OK  
**Wpięte:** foreignTypeOwners + typCityCopyOwners, kontakt D-START-3A, panel pre_contact, AI defensiveCopy, pełny spawn obcych typów.  
**CZEKA lane:** D-P0-01…03 (Excel AI), E-P0-01…06 (menu/złoża/victory) — patrz P0-KOLEJKA § Grupa D/E.

---

## [2026-06-27] Backlog pilny — częściowe → zadania (Maciej PILNE)

**Batch SILNIK DONE:** OBL-S3 + OBL-S4 + HUD-S1  
**Backlog:** `dyspozycje/_handoff/MASTER-do-SILNIK_backlog-pilne-2026-06-27.md`  
**Delegacja lane (2026-06-28):** patrz `MASTER-DELEGACJA-LANE-2026-06-28.md`

| ID | Lane | Status |
|----|------|--------|
| OBL-S6 | MAPA | **ROBIA** |
| D-P0-01…03 | CYW | **ROBIA** |
| E-P0-01…06 | UI/MAPA/CYW | **ROBIA** |
| HUD-S7 | Opus | **CZEKA review** |
| SILNIK test | SILNIK | **GOTOWE-do-wpiecia** (kod done) |

~~Delegacja lane (DO ZROBIENIA TERAZ w plikach lane):~~

| ID | Lane | Status |
|----|------|--------|
| OBL-S5 | SILNIK (+UNITS kontrakt) | **TERAZ** |
| OBL-S6 | MAPA | CZEKA (po S5) |
| OBL-S7 | CYW + SILNIK | CZEKA |
| HUD-S2…S6 | UI → SILNIK wpiecie | CZEKA |
| DST-S2 | MAPA → SILNIK | CZEKA |
| DST-S3/S4 | CYW | CZEKA |
| MAP-S1 | MAPA | P2 |

---

## [2026-06-27] F → MASTER: GOTOWE-ROBOCZA OBL-MAP-01 (Maciej: test Mastera)

**ROBOCZA + PLAYTEST-WALKA:** md5 `bf99e18b9f164dd1a734bbb5114755f1`  
**Testy:** map-siege 6/6 · oblezenie 27/27 · bramka ZIELONA  
**Checklist:** `GRUPA-C-do-SILNIK_oblezenie-mapy-kanon.md` §5

---

## [2026-06-27] SILNIK OBL-S1+S2 — logika oblężenia w main.ts

**Batch:** OBL-S1 (Q1, jeden zegar głodu, Q3=B pending) + OBL-S2 częściowo (validate odjazd, save sync)  
**Pliki:** `gra/src/main.ts`, `gra/src/ui/siegeMapPanel.ts`, `gra/src/game/cities.ts`  
**Testy:** map-siege 6/6, oblezenie 27/27, smoke OK  
**Status:** GOTOWE-do-wpiecia / czeka Opus review przed kanon oficjalny  
**Następny:** S3 panel → S4 milicja → S5 machiny → S6 obóz 3D (MAPA)

---

## [2026-06-27] Maciej — oblężenie mapy → główna gra (→ SILNIK OBL-MAP-01)

**Decyzja:** PLAYTEST-WALKA OK → wgrać oblężenie do `Gra-podglad.html`  
**Handoff:** `dyspozycje/_handoff/GRUPA-C-do-SILNIK_oblezenie-mapy-kanon.md`  
**Dyspozycja:** `dyspozycje/SILNIK.md` (DO ZROBIENIA TERAZ)  
**Status:** ROBIA / SILNIK · moduły C3 gotowe · czeka integracja + Opus + kanon  
**Playtest ref:** md5 `cd4677e6b32d08ebdbbc6218db369618`

---

**Kreator startu:** ✅ `E1-START-KREATOR-KLASTR.md` · `start-preview.ts` · `newGameFlow`  
**Handoff Grupa D:** `docs/grupa-d/OD-MASTERA-D-START-HANDOFF.md` (runtime AI + spawn obcych — **nie** kreator)  
**Status:** Kreator **WPIĘTE** · Grupa D **ROBIĄ** runtime

---

**Bramka:** PASS · md5 `fab437b0a1d61bc98072e5b00e878cde`  
**Katalog:** `gra-kanon/` — `src/` + `data/` (JSON) + `Gra-podglad.html` + PLAYTEST-WALKA  
**Bez:** Exceli, docs, mockupow, preview dev, starych HTML  
**Skrypt:** `gra/tools/publish-kanon-snapshot.ps1` · manifest `KANON-MANIFEST.json`  
**Robocza:** `gra/` (lane edytuja) — nie dotykac przy grze bezpiecznej

---

## [2026-06-27] Maciej — PLAYTEST OK bitwa → ROBOCZA `cd4677e6…`

**Maciej:** wszystko działa jeżeli chodzi o bitwę (PLAYTEST-WALKA)  
**md5:** `cd4677e6b32d08ebdbbc6218db369618`  
**→ MASTER:** Opus → kanon · F czeka

---

## [2026-06-27] Grupa F — PT-C3-01 WPIĘTE (Lucznik przy Atenach)

**Fix:** `playtestWalkaMapy.ts` — Lucznik na heksie sąsiadującym z Atenami  
**Publish:** ROBOCZA + PLAYTEST-WALKA · md5 `117688301ae3079c5ed08b4b72e58c24`  
**→ MASTER:** Maciej retest scenariusz B (oblężenie)

---

## [2026-06-27] DECYZJA Maciej: miasta AI = kopie typu → Grupa D

**Plik:** `docs/decyzje/D-START-miasta-kopie-typu.md` · charter: `docs/grupa-d/MODELE-MIAST-TYPU.md`  
**Handoff CYW:** `dyspozycje/_handoff/CYWILIZACJE-do-MASTER_miasta-kopie-typu.md`  
**Luka:** spawn obcy typ = 1 miasto (powinno: pełny klaster); AI nadal ekspansyjne

---

## [2026-06-27] IMPLEMENTACJA: D-START klaster + nazwy (4 lane → SILNIK wpięte)

**Handoff:** `dyspozycje/_handoff/SILNIK-do-MASTER_D-START-klaster.md`  
**Moduły:** `civ-names.ts` · `cluster-spawn.ts` · `cluster-start.ts` · `diplomacy-layers.ts` · `diplomacyPanel.ts` · `main.ts`  
**Testy:** `civ-names-test.cjs` · `cluster-start-test.cjs` (ZIELONE)  
**Następny krok:** Opus review → playtest Maciej (start klastra, dyplomacja warstwowa, kolonia N-4C)

---

## [2026-06-27] DECYZJE: D-START + nazewnictwo klastra (Maciej ABC)

**Plik:** `docs/decyzje/D-START-klaster-nazwy.md`  
**Paczka:** D-START-1B · 2B · 3A · N-1A · N-2A · N-3A · N-4C · N-5B  
**Następny krok:** dyspozycje CYWILIZACJE (utrwalić `nazwyKlastra`) → MAPA (`computeClusters` + API) → SILNIK (start + dyplomacja warstwowa) → UI (panel prosty/pełny)

---

## [2026-06-27] Maciej — playtest: walka OK · PT-C3-01 **WPIĘTE**

**Plik:** `Gra-podglad-PLAYTEST-WALKA.html` · md5 `117688301ae3079c5ed08b4b72e58c24`  
**OK:** preBattle → bitwa 3D (flow C1/C2)  
**Fix F:** Lucznik gracza obok Aten (scenariusz B oblężenia)  
**→ MASTER:** Maciej retest PLAYTEST-WALKA

---

## [2026-06-27] Maciej — PLAYTEST OK → ROBOCZA `6aedd5ce…` (Grupa F → Master)

**Maciej:** playtest OK — z jego strony wszystko działa.  
**Plik:** `Gra-podglad-ROBOCZA.html` · md5 `6aedd5ce5bd4f5fc1cb0f5577d2385bc`  
**Pakiet:** A-FOG-Q1B + E1-roster + Grupa B batch 2–7  
**→ MASTER:** Opus review → publish `Gra-podglad.html` · F czeka na dyspozycję

---

## [2026-06-27] Maciej — FoW: charakterystyka per jednostka + per miasto (cross-lane)

**Reguła:** Osobna cecha w danych — jak daleko jednostka / miasto **odsłania** mgłę (≠ Ruch w bitwie). **F/SILNIK nie ustala** — czeka na spec lane’ów.

| Owner | Pytanie |
|-------|---------|
| **Grupa B (Miasto)** | Zasięg odkrywania **miasta** na mapie strategicznej |
| **Grupa C (Walka / jednostki)** | Charakterystyka **jednostek** na mapie (FoW); spójność z `units.json` |

**Powiązane:** A-FOG-Q1=B (Grupa A, tymcz. Widok=Ruch) — do uzgodnienia z B/C przed finalnym wpięciem SILNIK.  
**Status:** **B: GOTOWE** (`citySightRadius`, `B-zasieg-miasta-fog.md`) · **C:** jednostki per typ · **F:** wpięcie batch 7

---

## [2026-06-27 ~21:40] Grupa F — Grupa B batch 2–7 WPIĘTE

**Wpięte:** empire-food · power/dyplomacja · kultura/religia panel · okolica UI · citySight mgła miasta · C1 flaga  
**ROBOCZA md5:** `6aedd5ce5bd4f5fc1cb0f5577d2385bc` · backup `main.ts.bak-SILNIK-20260627-GRUPA-B-batch2-7`  
**→ MASTER:** playtest Maciej · Opus → kanon

---

## [2026-06-27 ~21:10] Grupa F — A-FOG-Q1B + E1-roster WPIĘTE

**Wpięte:** mgła per typ jednostki (`buildUnitSightResolver`) · roster AI (`assignAiCivTypes`)  
**ROBOCZA md5:** `eada39d752b561d7779ae8813b03e85d` · backup `main.ts.bak-SILNIK-20260627-A-FOG-roster`  
**Testy:** civ-roster 11/11 · logic 195/195 · smoke · battle-smoke  
**→ MASTER:** playtest Maciej · Opus → kanon · **Następne F:** Grupa B batch 2–5

---

## [2026-06-27] Grupa A → SILNIK: mgła per jednostka (A-FOG-Q1=B) — **WPIĘTE**

**Decyzja Macieja:** Widok pola = Ruch; Zwiadowca min. 5 heksów. **Miasto → Grupa B** (poza scope).  
**Lane GOTOWE:** `units.json`, `visibility.ts`, CSV Excel  
**Handoff:** `dyspozycje/_handoff/MAPA-do-SILNIK_fog-widok-pola-A-FOG-Q1B.md` — **WPIĘTE**  
**Dok:** `docs/grupa-a/A-FOG-Q1-widok-jednostki.md`  
**→ MASTER:** playtest zasięgu mgły · Opus → kanon

---

## [2026-06-27] F → SILNIK: korekta widoczności (Maciej — 3 stany)

**Decyzja:** unknown=czarny · FoW=odkryte poza zasięgiem · visible=per jednostka/miasto · start=cała mapa czarna · **miasto: max(5,pop)+kultura**  
**ROBOCZA md5:** `3939067DF4F6592391DA05F6842A4442`  
**Handoff:** `_handoff/F-do-SILNIK_mgla-ghost-start-batch.md` (zaktualizowany)

---

**Dokument:** `docs/czaty/REGULA-PRZEPLYWU-2026-06-27.md`  
**Wdrożono w:** `.cursor/rules/civ-workflow.mdc`, `SCHEMAT-DWIE-WERSJE.md`, `OD-MASTERA.md`, `DYSPOZYCJA-GRUPA-{A,B,C,D,E,F,MASTER}.md`

Lane → `→ SILNIK: GOTOWE` → F wpina+testuje → Master weryfikuje → Maciej (`Gra-podglad.html`). BUG → grupa źródłowa. Master: **zero kodu**.

## [2026-06-27] Grupa F — P1 batch (society-pct + E1 tech + prod-spawn)

**Wpięte:** F-B2-society-pct · F-E1 grantTechEpokWczesniejszych · F-PROD-SPAWN  
**ROBOCZA md5:** `365ba2835e1dc6391124458763dfc9c7` · backup `main.ts.bak-SILNIK-20260627-P1-batch`  
**→ MASTER:** Opus + playtest Maciej · raport `SILNIK-DO-MASTERA.md` § START

---

| # | Watek | Wlasciciel(e) | Status | Czeka na | Nastepny krok |
|---|---|---|---|---|---|
| 1 | NAUKA = pula STEROWANA PRZEZ GRACZA (1a): gracz wybiera CEL + kieruje pula; BRAK auto-zakupu. AI przeciwnicy wybieraja wlasne tech (bez zmian) | EKONOMIA (wybor celu+akumulacja+UI) + master(research.ts) | WPIETE | — | (TOP-7 P1a sciencePicker end-to-end) |
| 2 | Dostep surowcow = boolean (zloze+ulepszenie w zasiegu + przetworczy budynek) | MAPA+EKONOMIA+DANE | ROBIA | — | pole dostepu + zasiegi |
| 3 | Zasiegi terytorium (radius=populacja cap15; fort +10, posterunek +5) | EKONOMIA(formula)+MAPA(territory.ts) | WPIETE | — | wartosci fort/posterunek do terrain-improvements.json |
| 4 | Bonusy obrony struktur (mur+200/fort+100/posterunek+50, obozowanie) | UNITS(walka)+EKONOMIA(maMur+budynek Mury)+silnik | ROBIA | budynek 'Mury' (EKONOMIA) | pelne wpiecie mur w combat/siege |
| 5 | Mnoznik Handel->Pieniadz (baza 2, per-cyw) + Mennica + waluta x2 cala pula | EKONOMIA(mechanika+buildings)+CYWILIZACJE(per-cyw) | ROBIA | — | TOP-7 P1b flagi; decyzja 26.06 x2 cala pula -> EKONOMIA |
| 6 | Widok glowny / HUD w grze | MAPA+UI+silnik | **GOTOWE-do-wpiecia** | Opus review mockupów | Maciej **ABC1=A** (2026-06-27); handoff `UI-do-MASTER_hud-D1B-mockupy.md` |
| 7 | Plaster EKONOMIA(miasto)+UI (splitPraca/kup-za-Pieniadz/gate terytorialny) | silnik | GOTOWE-do-wpiecia | Maciej D2 ("idz") | wpiac + sedzia + kanon |
| 8 | Wealth | EKONOMIA(szkielet)+silnik | BLOK | Maciej D3 (W1-W6) | po decyzji -> modul + wpiecie |
| 9 | Ulepszenia terenu + posterunki (render gotowy) | MAPA(gotowe)+EKONOMIA(bonusy)+silnik | **GOTOWE-do-wpiecia** | MASTER batch BLK-04 | Maciej **A4-D4-Q1=A, A4-Q1=A** (2026-06-27); handoff `MAPA-do-MASTER_ulepszenia-D4A.md` |
| 10| AI: archetypy 7->9 + harness testowy + heurystyka nauki + bonusy[] mechanizacja | CYWILIZACJE+UNITS+EKONOMIA+UI+SILNIK | ROBIA | Master delegacja | handoff `CYWILIZACJE-do-MASTER_bonusy-RDY01-delegacja.md`; EKONOMIA RDY-01 done; UNITS bitwa3D+spec TODO |
| 11| Bitwa->kanon (10A) + UX bitwy | UNITS+silnik | BLOK | Maciej D5 (UX Q2-Q7) | TOP-7 P4 PARTIAL: preBattle wpiety; pelna BattleScene -> UNITS |
| 12| Oblezenie wg epok: Taran=Kamien(in-siege), Wieza=Braz(in-siege), Katapulta=KONFLIKT D10 (§155 Sredniowiecze vs units.json Zelazo) | UNITS | BLOK | Maciej D10 (Katapulta) | czeka D10 Macieja; modele+epoki (bez zmiany units.json do D10) |

## KANON: Gra-podglad.html (ostatni: md5 2276ec0f, v0.1 sandbox grywalny: mapa+ruch+zakladanie-z-mapy+ekonomia+AI rywale+bitwa+picker badan+HUD czesciowy+dyplomacja UI)

## DECYZJE MACIEJA wymagane (odblokowuja): ~~D1–D5, D10~~ **ZAMKNIĘTE 2026-06-26/27**. Otwarte: **B2-Q7…Q9, B1.2–B1.4, E1-Q9…Q12, C3** — patrz `docs/decyzje/MAPA-PYTAN-OPEN.md`.

## ROZSTRZYGNIECIA 2026-06-25 (Maciej ABC)
- #1 ZDROWIE: pelny model (EKONOMIA) — ROBI. #2 PODZIAL: Praca osobno; Skarbiec+Wealth+Badania=1 kubelek %; Praca->Pieniadz po Walucie — ROBI EKONOMIA. #3 podatek baza 10%, default 70/20/10, warstwa rozwoju->CYWILIZACJE(notatka). #4B konwersja wioska->miasto NIE w v0.1. #5A mnoznik 2 (1.7-2.4 per-cyw). #6 ulepszenia -> EKONOMIA eksportuje Excel do decyzji Macieja. #7A HUD+granica C -> MASTER wepnie. #8B nazwy miast TAK + podglad miast Brazu (MAPA). #9A Wealth szkielet baza -> ROBI EKONOMIA. #10B bitwa po kolei -> master pyta Q po Q.
- KOLEJKA SILNIKA (technika, master, 1 batch gated): plaster EKONOMIA+UI, wpiecie AI (ai-wpiecie.md), research.ts (pula), auto-manage.ts, HUD+granica C, bonusy obrony (mur/fort/posterunek).
- PYTANIE do wszystkich: czy uzywaja subagentow na Sonecie (koszty) — czekam na 5 odpowiedzi.

## INTEGRACJA 2026-06-25 (batch silnika, Sonnet) — WYNIK
Kanon md5 de34582b -> 50b3114f (opublikowany). Bramka 19 testow ZIELONA (logic 163/163, combat 6/6, barbarians 53, diplomacy 98, ai 88, wealth 25, converters 30, auto-manage 26, found-from-village 24, happiness 38, okolica 16, split-output 46, wire-ekonomia 23, upkeep 51, culture-religion 43, research green, smoke/battle-smoke ok).
WPIETE: B nauka=wspolna pula (research.ts, chooseAIResearch per AI), D autoManageCity (toggle w cityPanel), E bonusy obrony (structureDefenseBonusFor + structMult w combat, dla atakow AI i barbarzyncow). A (AI+victory+barbarzyncy) juz byl wpiety. C splitPraca czesciowo (gate terytorialny odlozony). F granica C odlozona w batchu (ale Maciej JUZ zaakceptowal 7A -> do wpiecia w kolejnej rundzie).
NAPRAWIONE dehydratacje: diplomacy.ts (TIER_NAMES/relationTier), tools/diplomacy-test.cjs.

## INTEGRACJA 2026-06-25 (batch 2 + audyt) — WYNIK
Kanon md5 50b3114f -> 90695efc (995 KB, opublikowany, bit-identyczny z buildem). AUDYT ADVERSARIAL: PASS — czysty build, 762/762 testow jednostkowych (17 suite) + smoke/battle-smoke, wszystkie 4 nowe wpiecia ZYWE (nie martwy kod).
WPIETE batch2: spreadReligion per-tura (szerzenie wiary w zasiegu), dyplomacja per-tura (aiDiplomacyStance + get/setDiploRelation; efekt na relacje = bezczynny w v0.1, swiadomie), ATAK Z MAPY (klik wroga w zasiegu hex=1, ruchLeft>0 -> resolveCombat -> wynik na mape), SAVE/LOAD (Ctrl+S autosave / Ctrl+L wczytaj). Produkcja/kultura/porzadek juz byly wpiete (G/H SKIPPED).
DEFER (technika, dispatch do MAPA): L granica C + M bramka terytorialna — `isInTerritory` zyje w MAPA lane (mainview), nie eksportowana. Dispatch zlozony do MAPA (eksport callbacku); zasiegi 5/10/15 juz zdecydowane.
NOTA: AI civType = stub 'Grecy' dla wszystkich; realne typy po wpieciu rostera per-wlasciciel (czeka na format startowego rozmieszczenia: CYWILIZACJE pkt3 <- MAPA).

## RAPORT DLA MACIEJA — co zrobione gdy Cie nie bylo (2026-06-25)
GRA jest teraz wyraznie grywalniejsza w jednym kanonie (Gra-podglad.html, dwuklik):
- mapa + ruch + zakladanie miast + ekonomia per-tura + produkcja + kultura/religia + porzadek,
- AI rywale graja (ruch/zakladanie/atak/budowa) + barbarzyncy + warunki zwyciestwa,
- NAUKA = wspolna pula (kup tech gdy pula>=koszt), AI wybiera tech,
- NOWE: realny ATAK Z MAPY (nie tylko test pod T), SAVE/LOAD (Ctrl+S/Ctrl+L), szerzenie religii, dyplomacja tyka co ture, auto-zarzadca miasta (toggle), bonusy obrony (mur/fort/posterunek) w walce.
- Wszystko zielone (762/762), kanon zweryfikowany niezaleznie.
CZEKA NA CIEBIE: 10 ABC z gameplayu (zdrowie/podzial/podatek/ulepszenia-Excel/Wealth/bitwa-po-kolei/miasta Brazu) + odpowiedzi dzialow na pytanie o subagentow.

## [2026-06-25] GRANICA: oblezenie/walka MAPA<->UNITS
Punkt styku = PLANSZA WALKI. MAPA: jednostki+ruch+pozycjonowanie+oblezenie-na-mapie+tryb obozowania(stan) DO planszy walki. UNITS: od planszy walki (przed-bitwa + resolveCombat z bonusami obrony + taktyczna bitwa). Handoff: MAPA->UNITS kontekst walki; UNITS->MAPA wynik. Bonusy obrony: wartosci=EKONOMIA(dane), obecnosc/stan=MAPA, zastosowanie=UNITS. (Spojne z juz wpietym structureDefenseBonusFor: silnik karmi UNITS danymi struktur z MAPY.)

## [2026-06-25] KOREKTA GRANICY MAPA<->UNITS (ostateczna)
Ruch jednostki po mapie = MAPA. OBLEZENIE (od momentu rozpoczecia) + walka = UNITS. Handoff: start oblezenia/ataku -> MAPA przekazuje kontekst -> UNITS rozgrywa -> wynik na mape. (Superseduje wczesniejszy wpis dajacy MAPIE 'oblezenie jako zachowanie na mapie'.)

## [2026-06-25] ZACZYTANIE — nowe ze skrzynki
- MAPA: zakladanie miast z mapy (tryb Budowa) GOTOWE; kontrakt canFoundCity(withinTerritory=isInTerritory MAPA)+dystans>=5. SILNIK: wpiac akcje 'zaloz miasto' w petli (zamiast Osadnika) + isInTerritory -> nast. batch.
- RUCH: MAPA+UNITS dogadane (reguly=UNITS, wykonanie=MAPA+SILNIK, bazowy koszt terenu=MAPA). POTWIERDZONE. Spec UNITS _model-ruchu-mapa.md -> MAPA implementuje.
- UI->EKONOMIA: 2 handoffy o okolicy (zasieg/plony/hak/render/scope) -> EKONOMIA odpowiada.
- DO MACIEJA (ABC): 4 otwarte decyzje modelu ruchu (min.1 pole / ZoC / stack / zaokretowanie).
- SILNIK KOLEJKA (nast. batch): research player-directed, isInTerritory+bramka teryt., akcja zaloz-miasto, granica C.

## [2026-06-25] MODEL RUCHU — decyzje Macieja (1-2; czekam na 3-4 przed pelnym relay)
1C: min.1 pole — jednostka z resztka pkt ruchu zawsze wejdzie >=1 pole PRZEJEZDNE (nawet gdy koszt > reszty pkt); WYJATEK: pola nieprzejezdne (gory/morze, koszt 99) — tam nie.
2 (custom, nie ABC): BRAK ZoC (ruch nieblokowany adjacencja). Zamiast tego REAKCJA PRZECIWNIKA: gdy jednostka gracza wejdzie na pole sasiadujace z wrogiem, AI wroga wybiera (a) wywolac BITWE albo (b) WYCOFAC sie bez bitwy. Przejscie obok mozliwe; przeciwnik ma opcje walka/ucieczka.
  Rozbicie implementacji (technika, do rozdania po 1-4): trigger adjacency = MAPA/SILNIK; decyzja fight/flee = CYWILIZACJE (AI na mapie); bitwa = UNITS; odwrot = MAPA.

## [2026-06-25] MODEL RUCHU — decyzja #3 (stacking/armia, custom)
3 (custom, nie ABC): STACKING BEZ LIMITU — wiele jednostek/armii na 1 heksie (nawet 50).
- Wejscie na zajety heks -> OKNO WYBORU: "polacz armie" albo "nie lacz" (stoja osobno w tym samym miejscu). Gracz decyduje.
- WALKA ZBIOROWA: jesli ktos ZAATAKUJE ten heks -> WSZYSTKIE jednostki z heksa przystepuja do bitwy; jesli jedna jednostka z heksa ATAKUJE przeciwnika -> tez WSZYSTKIE jednostki z tego heksa ida do bitwy.
- Rozbicie (technika, relay po #4): stacking na mapie = MAPA; model armii + merge + sklad bitwy zbiorowej = UNITS (ma juz mechanike merge); okno "polacz/nie lacz" = UI.

## [2026-06-25] MODEL RUCHU/ARMII — ROZDANE w dol (1C,2,3,4)
UNITS: reguly ruchu(1C), bitwa przy 2, model armii+merge+sklad bitwy zbiorowej(3), zaokretowanie(4 robocze A). MAPA: wykonanie 1C, brak ZoC + hook reakcji + odwrot + stacking/render(3). CYWILIZACJE: heurystyka fight/flee(2). UI: okno 'polacz/nie lacz'(3).
SILNIK (master, nast. batch): wpiecie hooka reakcji (adjacency->fight/flee->bitwa/odwrot) + skladu bitwy zbiorowej z heksa + (juz w kolejce) research player-directed, isInTerritory+bramka, akcja zaloz-miasto, granica C.
#4 zaokretowanie = robocze A (po Zeglarstwie) — do potwierdzenia/zmiany Macieja.

## [2026-06-25] NOWY WATEK: ZARZADZANIE ARMIA (transfer/split/merge; wzorzec Total War)
Wlasciciele: UNITS (model: transfer/split/mergeWounded/remove + co z pustym generalem) + UI (panel transferu: L-klik A -> P-klik B -> drag&drop kart; M / Ctrl+M scalanie rannych; podzial; karta jednostki). UI: mockup -> akceptacja Macieja -> impl. Rozszerza okno #3.
OTWARTE (do Macieja, ABC): posilki — czy osobne SASIEDNIE armie wchodza do bitwy razem (skoro ZoC usuniety), czy wspolna walka tylko na TYM SAMYM heksie.

## [2026-06-25] POSILKI rozstrzygniete (B doprecyzowane): zasieg 1 heks
Bitwa: strona ATAK = heks atakujacego + armie sojusznicze <=1 heks od niego; strona OBRONA = heks broniacego + armie sojusznicze <=1 heks od niego. (Zastepuje wczesniejsze 'wspolna walka tylko ten sam heks' — teraz +sasiedztwo 1.) Wlasciciele: UNITS sklad bitwy, MAPA lista heksow<=1, CYWILIZACJE heurystyka dolaczania AI. SILNIK wpina zbieranie skladu przy starcie bitwy (kolejka batcha).

## [2026-06-25] NOWY WATEK: OBLEZENIE NA MAPIE (UNITS rozpisalo)
UNITS: model+panel+parametry (atrycja 8% maxHP/ture garnizonu, prog upadku 30-40% HP, kapitulacja 1 tura po wyzerowaniu zapasow, mur +200%). 
SILNIK(ja): TURA OBLEZENIA (magazyn -= pop+garnizon, -8% atrycja, warunek upadku, 1 machina/ture, przejscie do szturmu) -> kolejka batcha.
EKONOMIA: pole zapasow (City.magazynZywnosci) + flaga 'oblegane' (dochod pol=0). Routowane.
PARAMETRY do ew. strojenia Macieja (na razie domyslne UNITS): atrycja 8%/ture, prog upadku 30-40%, koszt/tempo machin.

## [2026-06-25] BATCH 3 (Sonnet) — WYNIK
Kanon 90695efc -> 7ac1345c (~1003KB). NAUKA STEROWANA GRACZEM wpieta: playerResearchTargetId + setPlayerResearchTarget + getResearchState + window haki (__civ_setResearchTarget/getResearchState/getAvailableTechs); domyslny cel=pierwsza dostepna; AI bez zmian. Bramka: logic 180/180 (+17 testow nauki, +naprawione 7 pre-existing kosztow tech), research 33, ai 113, combat 6, oblezenie 27 — ZIELONO.
#1 NAUKA: ENGINE DONE; zostaje UI picker (haki podane).
#3 walka zbiorowa DEFERRED -> poprosilem UNITS o kontrakt multi-unit (1v1 dzis).
CZEKA na kontrakty (zrobie pozniej): isInTerritory(MAPA)->bramka+zaloz-miasto+granica C; oblezenie tura(EKONOMIA flaga+zapasy); #2 reakcja(CYWILIZACJE heurystyka); posilki 1-heks(MAPA); #3 multi-unit(UNITS).

## [2026-06-25] ODSWIEZENIE — duze odblokowania
- MAPA: isInTerritory wyeksportowane (map/territory.ts) -> ODBLOKOWANE: bramka teryt.+akcja zaloz-miasto (SILNIK), granica C (MAPA renderuje). Prototyp RUCH.html gotowy (SILNIK wepnie traversal+pkt+mgle).
- EKONOMIA: kontrakt zapasow oblezenia oddany (wire-ekonomia 23/0) -> ODBLOKOWANE: tura oblezenia (SILNIK). + budzet-AI oddany do CYWILIZACJE (pkt5 zamkniety). + model-nauki-gracza potwierdzony (juz wpiety w batch3).
- UI: haki okolicy + scope v0.1 (statyczny overlay). Potwierdzilem B(jedno zrodlo)+A(tylko zaznaczone) do MAPA/UI.
- CYWILIZACJE: civs.json bonusy[]+mnoznik, tech.json koszty (PROPOZYCJA Macieja). **T1-T4 dyplomacja ROZSTRZYGNIETE** -> `CYWILIZACJE-DO-MASTERA.md` §2026-06-25 15:00 (T1=A, T2=A, T3=A, T4=B). Technicznie: enum->roster9, dead flag, self-check repoint. Otwarte: 4 pyt. balansu kosztow tech (do Macieja).
SILNIK BATCH 4 (odblokowane): bramka teryt.+zaloz-miasto, tura oblezenia; (potem) traversal ruchu, reakcja(stub->CYW heurystyka), posilki/#3(UNITS kontrakt).

## [2026-06-25] BATCH 4 (Sonnet) — WYNIK
Kanon 7ac1345c -> 9faa7ebf. N1 bramka terytorialna zakladania (isInTerritory, klawisz B; 1. miasto bez bramki) DONE. N2 akcja zaloz-miasto z mapy (klawisz B + bramka) DONE; pelny UX trybu Budowy = MAPA mainview (osobno). N3 tura oblezenia PARTIAL: glod+atrycja 8%+kapitulacja DONE; DEFERRED start(flaga oblegane), panel+machiny, przejecie po kapitulacji, HP-per-garnizon -> UNITS/UI. Bramka ZIELONA (logic 180, oblezenie 27, wire-ekonomia 23, combat 6, ai 132, research 33).
ZOSTAJE: UNITS dostarcz kontrakt STARTU oblezenia + HP garnizonu + kolejka machin -> silnik dopina.

## [2026-06-25] UI dostarczylo: picker badan + okno polacz-armie
- PICKER BADAN: configureSciencePicker({getAvailableTechs,getCurrentTarget,getSciencePool,onSelectTarget}) + showSciencePicker(0) + przycisk 'Nauka'. Do podlaczenia pod haki silnika (__civ_setResearchTarget/getResearchState/getAvailableTechs). TECHNICZNE, ODBLOKOWANE -> wpiecie przez SILNIK (audyt czy kod pickera w grafie kanonu czy preview).
- OKNO POLACZ-ARMIE: showArmyStackPrompt({onMerge,onKeep}). Czeka na kontrakt merge/stacking od UNITS (wtedy silnik wywola przy wejsciu na zajety heks). Pelny panel transferu = osobny task #170/#178 (makieta UI/Makieta-panel-armii.html).

## [2026-06-25] PICKER BADAN wpiety -> nauka grywalnka komplet
Kanon 9faa7ebf -> 1b5e704a. sciencePicker.ts (orphan UI) wpiety w main.ts + przycisk 'Nauka' HUD -> haki silnika. Nauka sterowana graczem = end-to-end (silnik+UI). Bramka 180/180 zielona.
ZOSTAJE (czeka na dzialy): okno polacz-armie (UNITS merge kontrakt), reakcja fight/flee (CYWILIZACJE heurystyka), multi-unit/posilki (UNITS kontrakt), start oblezenia+HP garnizonu+machiny (UNITS), traversal ruchu z prototypu (MAPA), granica C render (MAPA).

## [2026-06-25] EKRAN STARTU wpiety + kanon 100% zielony
Kanon 1b5e704a -> b7a574ad (start) -> 8e180b7a (fix testow). 
EKRAN STARTU: mainMenu.ts+newGameFlow.ts (orphany UI) wpiete -> MENU -> Nowa Gra: wybor CYW (9) + EPOKA (Kamien/Braz) + TRUDNOSC (Easy/Normal/Hard) + rozmiar mapy/rywale/predkosc -> START (aplikuje cyw+trudnosc; koniec zakutego 'normal'). Continue=loadFromLocal.
Bramka 18 suite 100% ZIELONO + smoke/battle-smoke.
2 'regresje' = zmiany ZRODEL dzialow: EKONOMIA suwak nauka 60->20 (decyzja 70/20/10); okolica zasieg STEPPED->LINIOWY (potwierdzone decyzja zasięg=populacja 2026-06-25). Testy zaktualizowane (intended).
DEFERRED startu: bonusy cyw (TypCywilizacji->walka/ekonomia) niewpiete; rozmiar mapy zbierany ale generator stale wymiary+seed; Wyjdz=no-op.
ROZSTRZYGNIETE: flaga 'Decyzja Naster' (okolica stepped->liniowy) — **potwierdzone** decyzja Macieja zasięg=populacja 2026-06-25 (§DECYZJA radius=pop); okolica+terytorium ujednolicone, linia wizualna osobno.

## [2026-06-25] ESKALACJA: kaskada ZELAZA po dzialach (czeka na decyzje #1 Macieja)
EKONOMIA: tech.json Zelazo + 11 budynkow (buildings.json 26 wpisow) + Budynki.xlsx. UNITS: rename Legionista->Hastati +Triari (Epoka=Zelazo), zlecony edit main.ts L1138/1165/1195 + rebuild. MAPA: kontekst oblezenia + posilki gotowe; rekomenduje SILNIK wepnij RUCH+zakladanie (territory.ts gotowe).
WSTRZYMANE do decyzji #1 (Zelazo w v0.1? A/B/C): rename Hastati/Triari + rebuild + dalsza kaskada. NIE przebudowuje kanonu z Zelazem do potwierdzenia. Kanon stoi na 8e180b7a (Kamien+Braz, zielony, grywalny).
GOTOWE-do-wpiecia gdy limit wroci: RUCH (prototyp MAPA) + pelne zakladanie miast (territory.ts), niezalezne od Zelaza.

## [2026-06-25] DECYZJA: zasieg miasta = POPULACJA (1:1), ujednolicony okolica+terytorium
radius=pop (pop2->r2, pop5->r5, pop8->r8...; cap 15). Okolica robocza (EKONOMIA okolica.ts, juz min(pop,cap)) = terytorium miasta na mapie (MAPA territory.ts cityTerritoryRadius galaz-miasto -> cityRangeForPopulation). Fort+10/posterunek+5 stale. Granica rysowana LINIA (wizual, osobne) zostaje. ZASTEPUJE schodkowy 5/10/15. Wlasc: EKONOMIA(formula/cap), MAPA(territory.ts+linia).

## [2026-06-25] WLASNOSC: START GRY = MASTER (Maciej: A)
Start/inicjalizacja gry = MASTER (applyMenuParams/doStartGame: nacja gracza, trudnosc->systemy, tempo->nauka, mapa->generator). Dostawcy: UI (ekrany), CYWILIZACJE (nacje/roster+archetypy+bonusy), EKONOMIA (param ekonomii per trudnosc). 
BATCH 07be82c8 wpial: tempo gry, AI dyplomacja (decideAIDiplomacy+respekt+tick), zasieg=populacja. 
DALEJ (master, teraz): aplikacja wybranej NACJI w runtime (player.civType+bonusy z civs.json; AI: civType+archetyp zamiast 'grecy'). Iron Age dalej WSTRZYMANY (czeka 1A/B/C).

## [2026-06-25] BATCH 5a0f886c (nacja wplywa) + nowe
WPIETE (kanon 07be82c8->5a0f886c): wybor nacji wplywa na gre — gracz: civType+civBonusy (attached, realizacja=lane'y); AI: aiOwnerCivMap (rozne nacje) + archetyp + ARCHETYPE_AGGRESSION (Zulusi0.9..Chinczycy0.2). Bramka 180/180+smoke zielono.
NOWE ze skrzynki: MAPA clusters.ts (format rozmieszczenia -> CYWILIZACJE routed). UNITS usunelo Robotnika (ulepszenia z mapy) -> prosi usun odwolania w main.ts/setup (GATED na decyzji Macieja).
DECYZJE MACIEJA KUMULUJA SIE: #1 Zelazo (1A/B/C), Robotnik usuniety? (+Zwiadowca zostaje?). Tuning: cluster min_dist 9 vs 5 (niepilne).
DEFERRED z batcha: realizacja civBonusy w systemach (lane'y), mnoznikHandelPieniadz (EKONOMIA), nazwyKlastra na mapie (MAPA), Sumerowie/Babilon (fix routed).

## [2026-06-25] ZAWIESZONE przez Macieja: Zelazo (1A/B/C) + Robotnik
Obie decyzje PARKED. Kaskada ZAMROZONA w obecnym stanie: EKONOMIA nie rozszerza Zelaza; UNITS nie dorabia jedn. Zelaza, NIE usuwa Robotnika (status quo), rename Hastati/Triari wstrzymany. Master NIE surfacuje tych decyzji do odwieszenia. Test gra na kanonie 5a0f886c (Kamien+Braz + Zelazo-tech juz w danych). Odblokuje gdy Maciej powie "odwies".

## [2026-06-25] ZAMROZENIE ODWOLANE (Maciej: nie zamrazamy) -> decyzje Zelazo+Robotnik wracaja jako 1ABC/2ABC do Macieja

## [2026-06-25] DECYZJA: Warsztat oblezniczy -> odblokowuje machiny (Taran/Katapulta/Wieza)
Budynek 'Warsztat oblezniczy' = prereq budowy machin. EKONOMIA: warsztat nadaje maWarsztatOblezniczy + dostepny od epoki najwczesniejszej machiny (Taran=Kamien). UNITS: machiny wymagaja maWarsztatOblezniczy. Uwaga: Katapulta + (jesli warsztat=budynek Zelaza) czesc tej reguly zalezy od decyzji #1 (Zelazo) — wciaz otwartej.

## [2026-06-25] KOREKTA machin oblez. (Maciej): Warsztat=tylko Katapulta; Taran+Wieza=in-siege
Warsztat oblezniczy (Zelazo) -> buduje TYLKO Katapulty (prereq maWarsztatOblezniczy). Taran + Wieza oblezicza -> budowane PRZY OBLEZENIU (in-siege, kolejka 1/ture w turze oblezenia), bez warsztatu, od swoich epok. DECOUPLING: Taran/Wieza NIEZALEZNE od decyzji #1 (Zelazo); tylko Katapulta+Warsztat gated na #1. Silnik: tura oblezenia juz ma '1 machina/ture' = tu buduje Taran/Wieza. Superseduje poprzednia regule warsztatu.

## [2026-06-25] KOREKTA epok machin (Maciej): Katapulta=Sredniowiecze (nie Zelazo)
Taran=Kamien(in-siege), Wieza=Braz(in-siege), Katapulta=SREDNIOWIECZE (w Warsztacie oblezniczym, dobudowywana do armii). Warsztat przeniesiony z Zelaza na Sredniowiecze (poza v0.1) -> EKONOMIA zmniejsza zestaw Zelaza. v0.1 OBLEZENIE KOMPLETNE: Taran+Wieza in-siege, bez warsztatu/Katapulty. Decyzja #1 (Zelazo) JUZ NIE dotyczy machin oblezniczych.
**KONFLIKT D10 (housekeeping 2026-06-26):** units.json nadal Epoka=Zelazo (UNITS trzymalo starsza dyspozycje). Rozstrzygniecie czeka D10 Macieja — bez zmiany units.json do decyzji. Wiersz #12 tabeli.

## [2026-06-25] DECYZJE MACIEJA: 1A ZELAZO GO + 2A ROBOTNIK USUNIETY
1A: Zelazo wchodzi (3 epoki). EKONOMIA(budynki~10+surowce zelazo/stal), UNITS(jedn. Zelaza Hastati/Triari), MAPA/DANE(surowce na mapie), MASTER(rename Hastati main.ts + rebuild), CYWILIZACJE(swiadome).
2A: Robotnik USUNIETY -> ulepszenia=akcja z mapy. UNITS(usun+spec akcji), MAPA(front 'Buduj ulepszenie'), MASTER(usun odwolania Robotnika main.ts/setup + wepnij akcje pozniej). Zwiadowca zostaje.
ENGINE BATCH teraz: rename Legionista->Hastati/Triari + usun odwolania Robotnika (anty-crash) + rebuild.

## [2026-06-25] ENGINE BATCH 1A/2A — WYNIK
Kanon 5a0f886c -> 0dbf75d8. Z1 rename Legionista->Hastati (lookup main.ts) DONE. Z2 Robotnik usuniety (anty-crash, brak aktywnych refs; martwy kod zostaje; gra startuje z miecznikiem, Zwiadowca zostaje) DONE. Naprawione dehydracje: buildings.json null-byte, testBattle.ts uciety.
Bramka zielona OPROCZ koszary-gate-test (lazaret.epokaWejscia=5 vs test 4) = dane EKONOMII (pre-existing) -> routed do EKONOMII (fix epoki + rebuild).
ZOSTAJE: akcja 'buduj ulepszenie z mapy' (MAPA front + master akcja) zamiast Robotnika; EKONOMIA dokancza Zelazo (surowce zelazo/stal, budynki); fix lazaret.

## [2026-06-25] DECYZJE ZAMKNIETE (koniec pytan): GENERATOR + EKSPANSJA + ZASADA
ZASADA: wszystkie wybory gracza z menu nowej gry stosowane w swiecie.
- Rozmiary: 1000/2000/5000/10000/20000 (Malenki..Ogromny). Typ: gracz wybiera (kontynenty/pangea/wyspy, wszystkie zaimplementowane). Losowy seed co gre. Wydajnosc: instanced dla duzych (MAPA).
- Ekspansja: terytorium NIE blokuje zakladania (≥5 pol od miast) — master luzuje bramke (1B).
Generator buduje MAPA; master wpina menu->generator + init + luzuje bramke + losowy seed (teraz).

## [2026-06-26] BATCH TOP-7 (Sonnet) — WYNIK
Kanon 342bef78 -> 2276ec0f. WPIETE: P1a sciencePicker nowe API (zbadane widoczne), P1b walutaOdkryta+flagi budynkow, P2 rozmiar mapy+rywale z menu (typ DEFERRED->MAPA), P3a HUD +Praca/Kultura, P3b overlay konca gry (+Nowa gra), P5 diplomacyPanel+notyfikacje, P6 save/load pelniejszy (cityProd/cityBuilt/aiResearchDone/diploRelations). P4 PARTIAL: atak z mapy -> preBattle (Pole bitwy=fallback auto; pelna scena DEFERRED->UNITS kontrakt). Bramka zielona poza pre-existing koszary-gate(lazaret).
Dzialy poinformowane: UI/EKONOMIA/MAPA/UNITS. DEFERRED: typ mapy+pelny generator(MAPA), BattleScene z mapy(UNITS kontrakt), pelny hud.ts.

## [2026-06-26] DECYZJA MACIEJA: Waluta x2 na CALA pule Handlu (nie tylko Skarbiec)
x2 po Walucie -> cala pula Handel->Pieniadz (Skarbiec+Badania+Wealth). Rozdane EKONOMII. Praca->Pieniadz z nadwyzki = wg rekomendacji EKONOMII.

## [2026-06-26] DECYZJA MACIEJA: Lazaret=Sredniowiecze (przyszlosc) -> #1 koszary-gate NIE wpinamy teraz
koszary-gate-test (asercja lazaret.epokaWejscia) = ZNANY OCZEKIWANY CZERWONY (przyszly budynek Sredniowiecza), NIE regresja. Subagenty: traktowac jako baseline-red, publikowac mimo niego. Lazaret zostaje na przyszlosc, nic nie ruszamy.

## [2026-06-26] ARCHIWUM CZATOW — wdrozenie workflow
ARCHIWUM: docs/archiwum-czatow/ops/OPS-kontekst-i-limity-czatu_2026-06-26.md — kontekst sesji vs budzet miesieczny, model 3+1 chatow, strategia pamieci plikowej, reguly archiwum dla agentow.

## REJESTR ARCHIWUM CZATOW (pointery — pelna historia w plikach)

Zasady: `docs/archiwum-czatow/README.md` | Eksport auto: `docs/archiwum-czatow/ARCHIWIZACJA-AUTO.md` | `eksport-pelny/REJESTR-CZATOW.md`

| Data | Opis | Plik |
|------|------|------|
| 2026-06-26 | Kontekst czatu vs limity Pro, model 3+1, summarization, workflow archiwum | `docs/archiwum-czatow/ops/OPS-kontekst-i-limity-czatu_2026-06-26.md` |
| 2026-06-26 | Jeden czat MASTER, audyt raw, hasło archiwizuj czat, przygotowanie D1–D15 | `docs/archiwum-czatow/master/MASTER-Civ-jeden-czat-decyzje_2026-06-26.md` |
| 2026-06-26_27 | Master Silnik: 6 grup A–F, SCHEMAT 2 wersje, ABC1=A HUD, audyt docs czatów | `docs/archiwum-czatow/master/MASTER-Silnik-orkiestracja-dwie-wersje_2026-06-26_2026-06-27.md` |
| 2026-06-27 | **SYNC-EKSPORT auto** — pełna korespondencja Master Silnik (579 linii) | `docs/archiwum-czatow/eksport-pelny/MASTER-Silnik_KORESPONDENCJA.md` |
| 2026-06-27 | **SYNC-EKSPORT auto** — Grupy A–F (pierwszy pełny eksport) | `docs/archiwum-czatow/eksport-pelny/GRUPA-{A..F}_KORESPONDENCJA.md` |

## [2026-06-26] AUDYT DYSPOZYCJI — struktura kanoniczna, gotowe do pracy
Maciej zatwierdzil uproszczony workflow: **JEDEN czat MASTER**, subagenci przez pliki (Task/Composer), bez osobnych czatow per lane.
Wykonano audyt calego drzewa Civ i uporzadkowano `dyspozycje/`:
- **Aktywne lane'y (6):** SILNIK, EKONOMIA, UNITS, UI, MAPA, CYWILIZACJE — kazdy: `<LANE>.md` + `<LANE>-DO-MASTERA.md`.
- **Scalone → `_scalone/`:** MIASTO→EKONOMIA; DANE+AI+DYPLOMACJA→CYWILIZACJE (MOVE, historia zachowana).
- **`_handoff/`** — 93 pliki `.md` kontraktow (+ README, shadow-state); przeniesiono `SILNIK/SILNIK-HANDOVER-DO-MASTERA.md` → `_handoff/SILNIK-handover-do-MASTER_2026-06-24.md`.
- **`_archiwum/`** — `_ANALIZA-MATERIALY.md` (notatnik roboczy, nie operacyjny).
- **Mapa:** `dyspozycje/README.md` | zaktualizowano `.cursor/rules/civ-workflow.mdc` + `docs/CURSOR-START-TUTAJ.md`.
**Status:** struktura gotowa. Nastepny krok MASTER: decyzje Macieja D1-D5 (Karta Decyzji) + weryfikacja backup/kanon lokalnie.

## [2026-06-26] AUDYT ARCHIWUM Claude Code (raw/) — WYNIK
Maciej wkleil historie czatow do `docs/archiwum-claude-code/raw/`. 4 subagenty (Composer) porownaly raw vs dyspozycje/KARTA.
**Werdykt:** ~85-90% pokrycia — dyspozycje+handoff+dziennik wystarczaja operacyjnie; raw = archiwum pelnych chatow.
**OK:** decyzje 25-26.06 w dzienniku, lane DO-MASTERA zsynchronizowane, UNITS w `raw/04-UNITS.md`, SILNIK pusty OK (MASTER).
**MUST-FIX MASTER (pozostale):** sync KARTA<-dziennik, UNITS-DO-MASTERA dopelnienie, raw housekeeping (04->03 UNITS). ~~T1-T4, wiersz #12, flaga Naster~~ -> domkniete w HOUSEKEEPING BATCH 2026-06-26.
**Czeka Maciej:** D1-D5 P0 (+ D10 Katapulta — konflikt Sredniowiecze vs Zelazo udokumentowany w #12). Skrot: `docs/archiwum-claude-code/ekstrakt/AUDYT-2026-06-26.md`.

## [2026-06-26] HOUSEKEEPING BATCH — sync dziennika (bez kodu, bez decyzji gameplay)
Wykonano audytowe domkniecia w `DZIENNIK-MASTERA.md`:
1. **Tabela wątków #1-#12** — data 2026-06-26, statusy zsynchronizowane z kanonem `2276ec0f` (batch TOP-7): #1 WPIETE (sciencePicker), #3 WPIETE (zasięg=pop), #5/#6/#11 częściowy postęp TOP-7, #12 BLOK D10.
2. **T1-T4 dyplomacja** — ROZSTRZYGNIETE; pointer `CYWILIZACJE-DO-MASTERA.md` §2026-06-25 15:00 (T1=A, T2=A, T3=A, T4=B); usunięto sugestię „czeka na Macieja".
3. **#12 Katapulta** — nota KONFLIKT D10: §KOREKTA epok (155)=Średniowiecze vs wiersz/units.json=Żelazo; units.json bez zmian; czeka D10 Macieja.
4. **Flaga „Decyzja Naster"** (okolica stepped→liniowy) — zamknięta; potwierdzenie decyzją zasięg=populacja 2026-06-25.
5. **KONFLIKT D10:** ROZSTRZYGNIĘTE → **A** Katapulta=Żelazo (2026-06-26).

## [2026-06-26] D5=B — Q2–Q7 DONE (UI + UNITS lane)

| Lane | Q | Pliki |
|------|---|-------|
| UI | Q5 preBattle 2-kolumny | `preBattle.ts` |
| UNITS | Q2–Q4,Q6,Q7 | `battleScene.ts`, `battleMinimap.ts` (NOWY) |

**Wniosek:** spec TW:Pharaoh w kodzie lane; **kanon czeka** MASTER (wpiecie preBattle/battleScene już częściowo w main — weryfikacja + testy node lokalnie). Odroczone: kursor łuk/miecz, linie rozkazów, Ctrl+M.

## [2026-06-26] GRUPA D — decyzje Macieja (Nauka, dyplomacja, cywilizacje)

**Gr-D:** 1B, 2A, 3A, 4B, 5A+B (2026-06-26).

| ID | Decyzja | Work |
|----|---------|------|
| Gr-D1 | **1B** pełne drzewko tech (port makiety) + **2A** koszty/tempo OK | UI sciencePicker; tempo w SILNIK |
| Gr-D2 | **3A** pasek Idee/kultura na HUD | UI + culture-religion HUD |
| Gr-D3 | **4B** panel dyplomacji z akcjami gracza | UI diplomacyPanel + SILNIK hooks |
| Gr-D4 | **5A+B** bonusy wdrażaj stopniowo + Excel do review | CYWILIZACJE export → lane’y |

Pliki: `docs/decyzje/D1-nauka.md` … `D4-bonusy-cyw.md`. T1–T4 dyplomacji bez zmian (2026-06-25).

## [2026-06-26] DECYZJA MACIEJA: D5=B — WORK START (Q2–Q7)
Maciej: ruszaj D5. Delegacja: UNITS (battleScene Q2–Q4,Q6–Q7) + UI (preBattle Q5). Spec: `UI-do-UNITS_ux-bitwy-q2-q7-totalwar.md`. Wątek #11: ROBIA.

## [2026-06-26] DECYZJA MACIEJA: D5=B (UX bitwy Q2–Q7 — UI proponuje, Maciej zatwierdza)
Potwierdzenie w czacie Decyzje. Propozycje domyślne (Total War: Pharaoh): `dyspozycje/_handoff/UI-do-UNITS_ux-bitwy-q2-q7-totalwar.md`. Wątek #11: UNITS implementuje po akceptacji propozycji (playtest/mockup).

## [2026-06-26] D4=B — Excel ulepszeń wygenerowany (Master Work)

Maciej D4=B → dostarczono `MIASTO/Ulepszenia-terenu.xlsx` (15 ulepszeń, kolumna **Komentarz Naster** do wpisów). Źródło: `gra/data/terrain-improvements.json`. Po akceptacji Macieja (D4=A lub poprawki) → batch SILNIK wpiecie (`MAPA-do-MASTER_ulepszenia-D4A.md`).




**Decyzje Macieja (wszystkie rekomendacje MASTER):**
D1=C, D2=A, D3=C, D4=A, D5=B, D6=A, D7=B, D8=A, D9=B, D10=A, D11=A, D12=A, D13=A, D14=A, D15=B.

**Zapis:** `docs/MACIEJ-KARTA-DECYZJI.md` (15/15, data 2026-06-26).
**Protokół Work:** `docs/MASTER-WORK-PROTOKOL.md`.

**Sprint 1 delegacja (Composer równolegle):**
| Lane | Zadanie | Decyzja |
|------|---------|---------|
| EKONOMIA | RDY-01 test suite civBonusy + Wealth minimal spec D3=C | D3 |
| UI | HUD D1=C minimapa + UX bitwy Q2–Q7 propozycje D5=B | D1,D5,D15 |
| MAPA | getMinimapData D15=B + ulepszenia front D4=A + BRAZU preview D12=A | D4,D12,D15 |
| CYWILIZACJE | RDY-09 Sumer/Babilon + D10=A Katapulta + D13 defaulty + D14 surowce | D10,D13,D14 |
| UNITS | Spec UX bitwy Q2–Q7 dla UI (D5=B) | D5 |

**SILNIK (Work, po lane):** BLK-02 plaster, BLK-01 HUD+granica C, BLK-04 ulepszenia, ownerCivMap, Sumer→Babilon — gated batchy.

## [2026-06-26] SPRINT 1 DELEGACJA — WYNIK (Composer ×5 równolegle)

| Lane | Status | Deliverables |
|------|--------|--------------|
| **EKONOMIA** | GOTOWE | `civ-bonusy-test.cjs`, handoffy wealth-minimal-D3C + plaster-D2A |
| **UI** | GOTOWE | `minimapHud.ts`, `sidePanelHud.ts`, hud.ts; handoffy UX Q2–Q7, hud-D1C, minimap-contract |
| **MAPA** | GOTOWE | `minimap.ts`, `improvement-build.ts`, bronzepreview D12; handoffy ulepszenia + miasta BRAZU |
| **CYWILIZACJE** | GOTOWE | Sumer→babilon, Katapulta D10=A, defaulty D13, zelazo/stal D14 (luka złoża → MAPA) |
| **UNITS** | GOTOWE | D10 verify, `UNITS-do-UI_battle-ux-constraints.md`; testy node — MASTER lokalnie |

**Następny krok Work (bez Decision):** gated batchy SILNIK — plaster → ownerCivMap → HUD → ulepszenia → Wealth typ.

## [2026-06-26] SPRINT 1 — WSZYSTKIE LANE ZAMKNIĘTE (×5 Composer)

**Wniosek cross-lane:** moduły lane gotowe; kontrakty minimapa (MAPA↔UI) i plaster/Wealth (EKONOMIA→MASTER) spójne. **SILNIK** = jedyna bramka do kanonu (kolejka gated batchy). Testy node — uruchomić lokalnie przed wpieciem.

**Follow-up Work:** poprawiono copy Katapulta/warsztat w `units.json` + `buildings.json` (D10=A, zgłoszenie UNITS). Ripple RDY-09: `clusters.ts` + `Makieta-flow-nowa-gra.html` `sumerowie`→`babilon`.

**Status wątków po decyzjach:**
- #6 HUD: **BLOK** mockup D1B (było D1=C → **D1=B** 2026-06-26, Maciej: preview przed wdrożeniem)
- #7 plaster: GOTOWE-do-wpiecia→ROBIA (D2=A)
- #8 Wealth: **WPIĘTE częściowo** (D3=A 2026-06-26: tick+mnożnik+szczęście+HUD; UI suwak w panelu — osobno)
- #9 ulepszenia: BLOK→ROBIA (D4=A)
- #11 bitwa UX: BLOK→ROBIA (D5=B)
- #12 Katapulta: BLOK→ROBIA (D10=A)

## DECYZJE MACIEJA wymagane (odblokowuja): ~~D1–D5, D10~~ → **ZAMKNIĘTE 2026-06-26**. Pozostałe D6–D9,D11–D15 też zapisane.

## [2026-06-26] KOREKTA D1=B — mockup przed wdrożeniem (Maciej)

D1 zmienione C→**B** (pełny HUD od zera). Warunek: podgląd HTML + checklist braków **przed** wpieciem w grę.

**Podgląd:** `UI/Gra-podglad-HUD.html` (teraz) · `UI/Makieta-HUD-D1B-preview.html` (UI lane) · `docs/MACIEJ-HUD-CHECKLIST-D1B.md`

**Zablokowane:** wpięcie hud.ts / BLK-01 do akceptacji. Hasło: `D1 mockup OK` w czacie Decision.

## [2026-06-26] DECYZJA MACIEJA: D3=A — Wealth pełny model (korekta)

**D3=A:** wpinamy pełny zatwierdzony Wealth (suwak Społeczeństwo, poziom W, mnożnik Skarbca, szczęście, decay) — `EKONOMIA-wealth-projekt.md`, handoff `_handoff/EKONOMIA-do-MASTER_wealth.md`. Unieważnia błędne D3=C (myliło Wealth z „drugą walutą”).

## [2026-06-26] SILNIK BATCH — Wealth D3=A WPIĘTE

**WPIĘTE:** `advanceCityEconomy` + ownerCivMap; wealthZadowolenie→szczęście/porządek; HUD Wealth W×mnożnik; `City.wealthState` typ + init. Save/load przez serializację miasta.

**Pliki:** `main.ts`, `cities.ts`, `turn-economy.ts`, `economy.ts` (komentarz).

**Pozostało:** suwak Społeczeństwo w panelu miasta (UI); build/test przed kanonem.

## [2026-06-26] DECYZJE MACIEJA: Wealth-UI pakiet (1A 2A 3A 4A, Q5 odłożone)

| # | Decyzja |
|---|---------|
| 1A | UI suwaki Handlu + EKONOMIA podział per miasto |
| 2A | Plaster D2 — MASTER batch (doBudynkow→produkcja) |
| 3A | Default 70/20/10 (już w econ-params.json) |
| 4A | Panel Wealth pełny w cityPanel |
| 5 | HUD/minimapa — **osobny czat MAPA**; tu bez wpiecia |

Delegacja: UI + EKONOMIA (Composer). MASTER: plaster main.ts (doBudynkow). Zapis: `docs/MACIEJ-DECYZJE-WEALTH-UI_2026-06-26.md`.

## [2026-06-26] SILNIK BATCH — plaster D2A + wpiecie UI suwaków

**WPIĘTE (MASTER):**
- Produkcja budynków: `advanceProduction(prod0, econTick.doBudynkow)` zamiast całej Pracy.
- `configureCityPanel`: `onPodzialHandluChange`, `onPodzialPracyChange`, `onPurchaseUnit`, `getPodzialHandlu/Pracy`.
- Kup jednostki za skarbiec + spawn na hexie miasta + koszt populacji.

**Lane dostarczone:** UI (`cityPanel` suwaki+Wealth+Kup), EKONOMIA (`podzialHandlu`/`podzialPracy` per City).

**NIE w tym batchu:** HUD/minimapa (Q5 → czat MAPA). Kanon — po build+test lokalnie + Opus.

**Status wątku Wealth-UI:** **ZAMKNIĘTY** (2026-06-26) — brak kodu do wykonania tutaj poza kanonem.

## [2026-06-26] INTEGRACJA Grupa F batch 1 — save/load migracja

**WPIĘTE:** `restoreGameFromSave()` + `ensureCityPodzialDefaults(c)` (Ctrl+L + doLoadGame); parity restore stanu; fix onPurchaseUnit po NewGame.

**Plik:** `gra/src/main.ts` · backup `main.ts.bak-SILNIK-2026-06-26-save-migrate`

**CZEKA:** bramka lokalna (typecheck, wire-ekonomia, build) → kanon po PASS.

**NIE:** hud.ts, advanceEmpireFood, C2 kanon.

## [2026-06-26] INTEGRACJA Grupa F batch 2 — wealth migrate + AI + mury

**WPIĘTE:** `ensureCitySaveDefaults`, `maMur` on build/load, `poziomTrudnosci` w AI opts, parity configureCityPanel (NewGame).

**Pliki:** `gra/src/main.ts`, `gra/src/game/cities.ts` · backup `main.ts.bak-SILNIK-2026-06-26-batch2`

**CZEKA:** bramka lokalna → `Gra-podglad-TEST.html` (Grupa F, nie kanon).

**ARCHIWUM sesji:** `docs/archiwum-czatow/lane/LANE-GRUPA-F-autonomia_2026-06-26.md`

## [2026-06-26] DECYZJA MACIEJA — HUD mapa Q1: żywność hybrydowa (miasto + zapasy państwa + wojsko)

**Nie A/B/C** — model custom:
- Miasto: magazyn/wzrost jak dotąd.
- **Suwak podziału żywności:** % rozwój miasta vs % **zapasy państwa** (wojsko).
- Więcej jednostek = większe zużycie zapasów państwa/turę.
- Zapasy państwa: **bez cap góry** na v1.0.
- **Głód** (zapasy < 0): jednostki **−8% max HP/turę** aż do zniszczenia.
- UI: miasto (suwak) + HUD mapy (zapasy państwa + alert).

**Zapis:** `docs/MACIEJ-DECYZJE-HUD-MAPA-Q1-Q10.md` · handoff `MACIEJ-do-EKONOMIA_zywnosc-hybrid.md`
**Lane:** EKONOMIA (model+test) → UNITS (atrycja) → UI (HUD) → MASTER wpiecie.

**Otwarte:** HUD Q3–Q10 (ABC).

## [2026-06-26] DECYZJA MACIEJA — HUD mapa Q2: bilans +X/turę → **B**

**B:** Przyrost co turę **w górnym pasku** przy zasobach — **bez** osobnego panelu bilansu po lewej na mapie.
**Zapis:** `docs/MACIEJ-DECYZJE-HUD-MAPA-Q1-Q10.md` · mockup D1B już zgodny (delty na pasku).
**Lane:** UI (`hud.ts` — delty z `empireBalance`, nie panel lewy).

## [2026-06-26] DECYZJA MACIEJA — HUD mapa Q3: zadowolenie/bunt → **C per miasto**

**C:** skrót + szczegóły po kliku — **tylko w panelu miasta**, nie globalnie na mapie.
**Zapis:** `docs/MACIEJ-DECYZJE-HUD-MAPA-Q1-Q10.md` · handoff `MACIEJ-do-UI_zadowolenie-per-miasto.md`
**UI:** usunąć Zadowolenie z paska D1B; `orderPanel` w cityPanel.

## [2026-06-26] USTALENIE — Q1–10 = tylko mapa świata (nie bitwa)

Maciej: doprecyzowanie scope. Pytania HUD Q1–10 = ekran strategiczny. Bitwa = D5 + UNITS. Q4 = jednostka na mapie świata.

## [2026-06-26] INDEKS — Grupa B (miasto i ekonomia) B1–B5

Maciej potwierdził podział tematów panelu miasta. Pliki: `docs/decyzje/B1-panel-budowa.md` … `B5-zywnosc.md`, indeks `docs/decyzje/README.md`.
**Zamknięte:** B3, B4, B5 (spec). **Otwarte:** B1 (ulepszenia D4), B2 (3-koszyk Mieszkańcy, zdrowie UI).

## [2026-06-26] WERYFIKACJA Master Silnik (pełny skan raportów)

Utworzono `docs/decyzje/A1-hud-mapy.md`, `A2-jednostka-mapa.md`; zaktualizowano `STATUS.md`. Bramka testów: **u Macieja lokalnie** (sandbox bez wyniku tsc). Wpięcie HUD: **NIE** (D1B). B3/B4 cityPanel: **WPIĘTE** w main. B5/UNITS handoffy: **GOTOWE**, bez main.

## [2026-06-26] LANE EKONOMIA — SPEC żywność hybrydowa (subagent, bez ticku)

**Deliverable:** spec w `EKONOMIA-DO-MASTERA.md` §2026-06-26; handoffy `EKONOMIA-do-UNITS_glod-8hp.md`, `EKONOMIA-do-UI_zywnosc-hud.md`; stub `gra/src/game/empire-food.ts`; klucze `suwak_zywnosc_rozwoj_domyslnie`, `glod_wojska_hp_frac`.
**Następny batch:** `advanceEmpireFood` + `food-army-test.cjs` → potem UNITS atrycja, UI suwak/HUD, MASTER save/load + pętla tury.

## [2026-06-27] Paczka ABC Grupa D — decyzje Macieja + dyspozycja testów Silnik

Maciej: `1A, 2A, 3A, 4C, 5A, 6A, 7B`. Zapis: `docs/decyzje/GRUPA-D-PACZKA-ABC-2026-06-27.md`. Handoff testów: `_handoff/CYWILIZACJE-do-MASTER_testy-grupa-d-bramka.md` → **Grupa F uruchamia bramkę** (civ-bonusy, diplomacy, ai). Religie 9/9 w society-params.json.

## [2026-06-26] AUDYT Grupa D — porządki plików roboczych

ARCHIWUM: `Civ-CYWILIZACJE/AUDYT-GRUPA-D-2026-06-26.md` + README hub + `export-bonusy-cyw.py` + `PLIKI-DO-USUNIECIA.md`. Excel Panel zablokowany u Macieja — sync odłożony.

## [2026-06-26] D4-RDY01 — delegacja bonusów cywilizacji (Grupa D → Master)

ARCHIWUM routing: `docs/czaty/DO-MASTERA.md` § D4-RDY01 · handoff hub `_handoff/CYWILIZACJE-do-MASTER_bonusy-RDY01-delegacja.md` · wiersz #10 DZIENNIK zaktualizowany.

## [2026-06-26] DYSPOZYCJA STAŁA — uniwersalny paste dla czatów tematycznych

Plik: `docs/decyzje/DYSPOZYCJA-STALA.md` — Maciej wkleja raz na start; po ABC agent: zapis → backup → kod → test → `*-DO-MASTERA.md` → `→ SILNIK:`. Procedura `weryfikuj` w `docs/MASTER-SILNIK.md` (Silnik czyta raporty, bramka, dopisuje do lane gdy FAIL).

## [2026-06-26] ROUTING pytań — mapa Grup A–E + dyspozycje per zakładka

**Problem:** agenci mieszali Q4 (mapa) z bitwą, Q5–Q10 przypisane błędnie do A2, pytania poza grupą.

**Ustalenia:**
- `docs/decyzje/MAPA-PYTAN-OPEN.md` — source of truth: kto pyta o co
- Legacy Q4 → **A2-Q4** (Grupa A); Q5–Q10 → **A1-Q5…Q10** (Grupa A, nie A2)
- Q1→B5, Q2→A1 zamknięte, Q3→B2 zamknięte
- C2-Q* ≠ A2-Q* ≠ HUD Q*

**Dyspozycje do wklejenia w czaty:** `docs/czaty/DYSPOZYCJA-GRUPA-A.md` … `E.md`, `DYSPOZYCJA-MASTER-SILNIK.md`

**Akcja Macieja:** wkleić dyspozycję do każdej zakładki z folderu Civ (6 czatów).

## [2026-06-26] ARCHIWUM: mockupy HUD P0+P1 → docs/archiwum-czatow/master/MASTER-mockupy-HUD-P0-P1_2026-06-26.md

## [2026-06-26] Komendy master / czaty

**Pliki:** `docs/czaty/OD-MASTERA.md` (Silnik → czaty) · `docs/czaty/DO-MASTERA.md` (czaty → Silnik)  
**Komendy:** Maciej pisze `master` w Grupie A–E · `czaty` w Master Silnik  
**Pierwsze uruchomienie:** `docs/czaty/PIERWSZE-URUCHOMIENIE-KOMENDY.md`

**Pliki:** `docs/czaty/OD-MASTERA.md` (Silnik → czaty) · `docs/czaty/DO-MASTERA.md` (czaty → Silnik)  
**Komendy:** Maciej pisze `master` w Grupie A–E · `czaty` w Master Silnik  
**Pierwsze uruchomienie:** `docs/czaty/PIERWSZE-URUCHOMIENIE-KOMENDY.md`

## [2026-06-27] HANDOFF MASTER — mockupy HUD D1B · Maciej ABC1=A

Maciej: mockupy OK (**ABC1=A**); decyduje **tylko gameplay ABC** (D1–D15), nie technikę mockupu.  
Handoff: `_handoff/UI-do-MASTER_hud-D1B-mockupy.md` · UI-DO-MASTERA · DO-MASTERA §Grupa A.  
Następny: Opus → MASTER batch hud.ts.

## [2026-06-26] A1-MOCKUPY-faza2 — embed + START + handoff MASTER

**Nowe:** `UI/mockup-embed.js`, `UI/Makieta-START.html`, `_handoff/UI-do-MASTER_hud-D1B-mockupy.md`  
**Polish:** powrót ← Mapa we wszystkich iframe; preBattle toast; D1B ESC/[H]  
**Archiwum:** `docs/archiwum-czatow/master/MASTER-mockupy-HUD-faza2_2026-06-26.md`

## [2026-06-26] A1-MOCKUPY-P0P1 — hub kliknięć ZAIMPLEMENTOWANY

**Hub:** `UI/Makieta-HUD-D1B-preview.html` — wszystkie kliki → mockupy (FS/MD/DK/MP).  
**Flow:** Menu → Nowa gra → HUD (auto).  
**Nowe pliki UI:** dyplomacja, preBattle, cuda, panel-jednostki.  
**Dok:** `docs/A1-HUD-KLIKI-MOCKUP-PRZEWODNIK.md`, `docs/MACIEJ-HUD-CHECKLIST-D1B.md`, archiwum `docs/archiwum-czatow/master/MASTER-mockupy-HUD-P0-P1_2026-06-26.md`.  
**Następny:** sign-off Macieja → Opus → MASTER hud.ts. **NIE ruszano kanonu.**

## [2026-06-26] A1-MOCKUPY-KLIK — plan mockupów po kliknięciu (faza po D1B)

**Hub:** `UI/Makieta-HUD-D1B-preview.html`  
**Plan:** `docs/A1-HUD-PLAN-MOCKUPY-KLIKNIECIA.md` — tabela klik → typ wyświetlania → plik mockupu → status → P0/P1/P2.

**Stan dziś w hubie:** P0+P1 wdrożone — każdy klik otwiera mockup.  
**P0:** ✅ Menu, Nauka, Miasto, Armia, Dyplomacja, Pre-bitwa.  
**P1:** ✅ Flow spięty, budowa MP, Persepolis→dyplomacja, tooltips zasobów.  
**Blokada kanonu:** sign-off Macieja (`MACIEJ-HUD-CHECKLIST-D1B.md`) → Opus → MASTER `hud.ts`.

## [2026-06-26] E1 — defaulty nowej gry (UI + MAPA + SILNIK)

**Decyzje:** `docs/decyzje/E1-nowa-gra.md` · **Handoff:** `dyspozycje/_handoff/UI-MAPA-do-MASTER_E1-defaulty-startu.md`  
**Lane UI+MAPA:** kreator (Rzym, typ świata, skala rywali, Ziemia preset)  
**SILNIK:** `main.ts` wpięty (seed, typSwiata, epoka, reset gracza) · backup `.bak-SILNIK-E1-20260626`  
**Kanon:** nie publikowany — Maciej: build + smoke lokalnie + Opus

## [2026-06-27] E1 — audyt Grupa E + katalog `docs/grupa-e/`

Audyt: `docs/grupa-e/AUDYT-2026-06-27.md` · Excel arkusz `Grupa-E` (10 wierszy) · czeka ABC Q9–Q12

## [2026-06-27] ARCHIWUM: Grupa B audyt + porządki → `docs/grupa-b/AUDYT-2026-06-27.md`

**Hub:** `docs/grupa-b/` (README, STAN, USUNAC-KANDYDACI, PANEL-B-SPEC)  
**Subagenci:** historia decyzji B + audyt okolica/ulepszenia  
**Aktualizacje:** B-OTWARTE, EKONOMIA-STAN, B2-model-szczescie-procent.md (propozycja Q7-D)  
**Czeka Macieja:** USUNAC-KANDYDACI + ABC B2-Q7/B1.4

## [2026-06-26] B2 — panel miasta społeczeństwo (Grupa B, sesja autonomiczna)

**UI lane:** lewa kolumna Mieszkańcy + Porządek + Zdrowie; usunięci Specjaliści  
**Decyzje Macieja:** B2-Q1=A, Q2=B, Q3=A · **prowizorycznie agent:** Q4=C, Q5=A  
**Handoff SILNIK:** `dyspozycje/_handoff/UI-do-MASTER_B2-spoleczenstwo.md`  
**Handoff Grupa A:** `dyspozycje/_handoff/UI-do-GRUPA-A_B2-Q5-bunt-chip.md`  
**NIE ruszano:** main.ts, Gra-podglad.html

## [2026-06-27] Master Silnik — sesja autonomiczna (orkiestracja + routing `czaty`)

**Kod (Grupa F subagent):**
- F-A2: `generujSwiat` w `doStartGame` — backup `main.ts.bak-SILNIK-20260627-generujSwiat`
- F-B2+C1: `cityOrderState`, `getOrderState`/`getCityHealth`, preBattle `onSave` + `deploy:true` + map BattleScene — backup `main.ts.bak-SILNIK-20260627-F-B2-C1`

**Bramka:** BLOK — brak Node w shellu agenta. Skrypt: `gra/tools/bramka-test-publish.ps1`

**Dokumentacja Master:**
- `docs/czaty/MASTER-ROUTING-2026-06-27.md` — triage A–F → F vs Master
- `OD-MASTERA` § F kolejka P0–P2; C2 odblokowane w backlogu
- `OPUS-REVIEW-QUEUE` PRE-QUEUE (F1+F-A2+B2+C1)
- `REFERENCJA-CIV5-ULEPSZENIA.md`, STATUS, GRUPA-F-BACKLOG

**Czeka Macieja:** bramka lokalna · sign-off D1B · B2-Q4/Q5 · **C1-Q1…Q5 ZAMKNIĘTE** (→ tylko Grupa F)

## [2026-06-26] Grupa C → Master: C1 preBattle handoff

**Maciej:** decyzje gameplay **tylko ABC** — **nie pytaj ponownie** C1-Q1…Q5 (zamknięte).  
**Zamknięte:** Q1=A, Q2=TW, Q2b=B, Q3=A, Q4=A, Q5=A — `C1-wejscie-walke.md`  
**UI gotowe:** `preBattle.ts`  
**→ Grupa F/SILNIK:** `C1-do-SILNIK_batch-test.md` → test → Master → kanon

## [2026-06-27] USTALENIE — Grupa F vs ABC Macieja

Maciej: w czacie **Silnik (F)** agent **nie pyta ponownie** o decyzje z czatów A–E. F: weryfikacja handoffu → wpięcie `main.ts` → bramka → ROBOCZA → raport Maciejowi + `GOTOWE-ROBOCZA` do Mastera (Opus → kanon). Zapis: `docs/czaty/GRUPA-F-SILNIK.md`, `.cursor/rules/civ-workflow.mdc` §10.1.

## [2026-06-27] Grupa B → SILNIK: B2-Q6 kary Porządku + migracja

**Decyzje Macieja (zamknięte, bez ponownych ABC):** B2-Q1…Q4, B2-Q6=C, HUD Q3 per miasto.

**Lane EKONOMIA+UI zrobione:** `order.ts`, `society-params.json`, `turn-economy` (`orderMultByCity`), testy logic-test.

**Handoff:** `dyspozycje/_handoff/EKONOMIA+UI-do-SILNIK_B2-porzadek-komplet.md` → **→ SILNIK: GOTOWE DO WPIĘCIA**

**Otwarte:** brak w paczce B2 (Q5=C zamknięte 2026-06-27).

## [2026-06-27] Grupa B — B2-Q5=C alert buntu

**Maciej:** B2-Q5=C — chip wydarzeń + ikona na heksie.  
**Handoff:** `UI-do-GRUPA-A_B2-Q5-bunt-chip.md`, `MAPA-do-SILNIK_B2-Q5-bunt-hex.md`  
**→ Grupa A + MAPA + SILNIK**

## [2026-06-27] Grupa B → SILNIK: paczka ABC 5–14 (lane GOTOWE)

**Decyzje Macieja (zamknięte):** B1-Q2/3/11, B4-Q1/Q2, B5-Q1/Q2, B-Power-Q1/Q2/Q3.

**Lane dostarczone:** `power.ts`, `terrain-improvements.ts`, `empire-food.ts` (tick), `tileYield×15`, `cityPanel` (okolica, auto-zarządca, kultura/religia, split imperium).

**Handoff zbiorczy:** `dyspozycje/_handoff/EKONOMIA+UI-do-SILNIK_GRUPA-B-batch-2026-06-27.md` → **→ SILNIK: GOTOWE**

**Kolejność F:** F-B2-society → F-B5-empire-food → F-B-power → F-B4-kultura → F-B1-okolica → F-B1-improvements

**Bramka:** `grupa-b-lane-test.cjs` + `society-breakdown-test.cjs` + `logic-test.cjs`

## [2026-06-27] HANDOFF zasięg miasta + mgła → Grupa A + Grupa E

**Maciej (Spec):** okolica start r=5, rośnie 1:1 z pop (pop 9 → r9); fog miasta = okolica + kultura.

**Handoff:** `EKONOMIA-do-GRUPA-A_zasieg-miasta-fog.md`, `EKONOMIA-do-GRUPA-E_start-zasieg-fog.md`  
**Decyzja:** `docs/decyzje/B-zasieg-miasta-fog.md`

## [2026-06-27] Grupa F — F-C1 dokończenie + F-HUD wpiecie (kod OK, bramka BLOK)

**Zrobione w `gra/src/main.ts`:** C1 multi-unit + defaultAction manual + Q5 onCancel; hud.ts D1B + minimapa B + wojny A1-Q5.  
**Backup:** `main.ts.bak-SILNIK-20260627-F-C1-HUD`  
**Raport:** `docs/czaty/DO-MASTERA.md` § F · `dyspozycje/SILNIK-DO-MASTERA.md`  
**→ MASTER:** bramka lokalna `gra/tools/bramka-test-publish.ps1` → ROBOCZA → Opus → kanon

## [2026-06-27] Grupa F — F-B2-porzadek (kod OK, bramka BLOK)

**→ MASTER:** handoff B2-porzadek wdrożony · backup `main.ts.bak-SILNIK-20260627-B2-porzadek`

## [2026-06-27] ARCHIWUM: Master Silnik orkiestracja + model 2 wersje → docs/archiwum-czatow/master/MASTER-Silnik-orkiestracja-dwie-wersje_2026-06-26_2026-06-27.md

Sesja czatu `58b15435` (Master Silnik): workflow 6 grup A–F, SCHEMAT-DWIE-WERSJE, ABC1=A HUD, audyt dokumentacji czatów. Kontynuacja w nowym czacie Master — czytaj OD-MASTERA § F + SCHEMAT.

## [2026-06-27] Maciej — interfejs tylko czat

Decyzja Macieja: **zero czytania plików** (decyzje, playtest, STATUS). Wszystko w treści czatu; agenci zapisują pliki między sobą po odpowiedzi ABC. Playtest finalnej = pełna checklista w czacie Master.

## [2026-06-27] ARCHIWUM: Audyt Grupa A (HUD + A4) → docs/grupa-a/AUDIT-2026-06-27.md

Hub plików roboczych: docs/grupa-a/README-INDEX.md · Sync charter/README/STATUS · moduły lane GOTOWE → SILNIK F-HUD.

## [2026-06-27] USTALENIE — granica A vs C (Maciej, diagram kanon)

**Grupa A:** ruch A2/A3 · **C3** Q1…Q10 · **C1** preBattle  
**Grupa C:** **C2** + **C4** od wyboru Auto/Ręczna  
`docs/grupa-c/GRANICA-C-vs-MAPA.md` · C3 paczki → `docs/grupa-a/`

## [2026-06-27] USTALENIE — całe C3 → MAPA (Maciej)

**C3-Q1…Q10** + oblężenie/strategia mapy → **MAPA**. **Grupa C** = **C1→C2→C4** od preBattle.  
Handoff: `C3-do-MAPA_paczka-ABC-Q1-Q10.md` · `GRANICA-C-vs-MAPA.md`

## [2026-06-27] USTALENIE — granica Grupa C vs MAPA (Maciej)

**C3-Q1** start oblężenia → **MAPA / Grupa A**. **Grupa C** start = **preBattle (C1)**.  
Dok: `docs/grupa-c/GRANICA-C-vs-MAPA.md` · handoff `C3-Q1-do-MAPA_start-oblezenia.md`

## [2026-06-27] AUDYT: Grupa C — Walka → docs/grupa-c/AUDYT-2026-06-27.md

Hub: docs/grupa-c/README.md · Sync MAPA-PYTAN-OPEN, README decyzji, STATUS, DYSPOZYCJA-GRUPA-C · C1/C2 ZAMKNIĘTE · C3 paczki ABC gotowe · lista plików do usunięcia: docs/grupa-c/07-PLIKI-DO-USUNIECIA.md

## [2026-06-27] ARCHIWUM: Audyt Grupa F (Silnik) + hub plików → docs/archiwum-czatow/lane/LANE-GRUPA-F-audyt-porzadek_2026-06-27.md

**Kandydaci usunięcia:** `docs/master/KANDYDACI-USUNIECIE.md` — czeka zgoda Macieja.

## [2026-06-27] ARCHIWUM: Master Silnik — audyt autonomiczny + granica F/Master + archiwizacja → docs/archiwum-czatow/master/MASTER-Silnik-orkiestracja-dwie-wersje_2026-06-26_2026-06-27.md (fazy 8–10)

## [2026-06-27] AUDYT Master Silnik — sesja autonomiczna (Maciej ~2h)

**Hub:** `docs/master/` (README, AUDYT-2026-06-27, INDEX-PLIKOW, KANDYDACI-USUNIECIE)  
**Zrobione:** 3 subagenty (decyzje + kod + pliki) · sync STATUS · DZIENNIK nagłówek · Excel `Status-projektu-The-Game.xlsx` (Dashboard, Grupa-A/B/F, Otwarte-ABC) · `docs/master/maciej/` — kopie paneli Macieja · OD-MASTERA P1 Grupa A  
**Bloker P0:** F-START-FIX (`newW` L3229) + bramka → ROBOCZA  
**Otwarte ABC Macieja:** ~17–20 (B2-Q7…Q9, B1.2–4, E1-Q9…Q12, C3)  
**Kandydaci usunięcia:** `docs/master/KANDYDACI-USUNIECIE.md` — **czeka decyzja Macieja**

## [2026-06-27] Grupa F → MASTER: GOTOWE-ROBOCZA

**Plik:** `Gra-podglad-ROBOCZA.html` · **md5:** `d11f2479ac20158d38d3ba6e2ac3f253`  
**Testy:** wire 29/29 · logic 195/195 · combat 6/6 · smoke OK · battle-smoke OK  
**Batchy:** F-HUD-2, B2-Q5 hex, A1-Q5 wywiad, F-C2 (kod), sync 🔥 po turze  
**Fixy cross-lane (build):** cityPanel dup import · hud typy · combat defAtak0  
**→ MASTER:** Opus review → promocja kanon · **F czeka dyspozycji**

## [2026-06-27] Grupa F — TESTY-GR-D (7B)

**Wykonano:** diplomacy 133/133 · ai 188/188 · research 33/33 · civ-bonusy **4 FAIL**  
**→ MASTER:** eskalacja CYWILIZACJE (bonusy) · brak nowego batcha main.ts

## [2026-06-27] Master Silnik — bramka pełna + weryfikacja

**Wykonano:** `gra/tools/bramka-test-publish.ps1` (Node zainstalowany) · ROBOCZA przebudowana  
**md5:** `d813159b0726b94f8e360c53dadf72a8`  
**Raport:** `docs/master/WERYFIKACJA-SILNIK-2026-06-27.md`  
**Opus:** `docs/decyzje/OPUS-REVIEW-QUEUE.md` — wpis aktywny CZEKA  
**STATUS:** zaktualizowany (P0 bramka ✅)  
**→ Opus 4.8 Ask** — review ROBOCZA · po APPROVE promocja `Gra-podglad.html`

## [2026-06-27] Excel tracker zadań

**Plik:** `Status-projektu-The-Game.xlsx` · arkusz **Dashboard** + **Master-Silnik**  
**Sync:** `python gra/tools/sync-status-tracker-xlsx.py` · instrukcja: `docs/master/STATUS-TRACKER-EXCEL.md`

## [2026-06-27] ABC pełna forma — reguła + szablon

**Problem Macieja:** grupy wysyłają skrócone pytania mimo DYSPOZYCJA-STALA.  
**Fix:** `.cursor/rules/abc-pelna-forma.mdc` (alwaysApply) + `docs/decyzje/SZABLON-PYTANIA-ABC.md` + blok w DYSPOZYCJA-GRUPA A–E + OD-MASTERA global.  
**Maciej:** odpowiedź `pełne` = agent przepisuje paczkę bez dyskusji.

## [2026-06-27] B2 society % — lane GOTOWE → SILNIK

**Decyzje:** 1C+2A+3+4C+B2-Q12=C (Sz/Prawo/Porządek %, okolica focus, rebelia+grace).  
**Moduły:** `gra/src/game/society-breakdown.ts`, `okolica.ts`, `cities.ts`, UI `orderPanel`/`cityPanel`, JSON `prawo`+`luksus_bonus`.  
**Handoff wpiecia:** `dyspozycje/_handoff/EKONOMIA+UI-do-SILNIK_B2-society-pct-batch.md` · test: `node tools/society-breakdown-test.cjs`  
**Status:** **GOTOWE-do-wpiecia** SILNIK batch **F-B2-society-pct** (main.ts — NIE ruszane przez lane).

## [2026-06-27] Grupa E — ABC **1=A** (reset Nowa gra)

**Maciej:** pyt. **1=A** — „Nowa gra" = pełny reset (skarbiec/nauka/tech). Kontynuacja tylko **Kontynuuj** / **Wczytaj**.  
**Kod:** zgodny (`doStartGame`) — batch SILNIK **bez zmiany** dla nr 1.  
**Otwarte:** ABC **2–12** → `docs/grupa-e/decyzje/PACZKA-ABC-BLOKERY.md`

## [2026-06-27] Grupa E — ABC **2=B*** (start epoki + tech wcześniejszych)

**Maciej:** pyt. **2** — reguła kaskadowa: Brąz = cały Kamień zbadany; Żelazo = Kamień+Brąz; w wybranej epoce badasz od zera; jednostki/budynki przez tech, bez starter-packa; v1.0 tylko epoki z kreatora.  
**Kod:** **TODO** SILNIK (`grantTechEpokWczesniejszych` w `doStartGame`).  
**Handoff:** `dyspozycje/_handoff/GRUPA-E-do-MASTER_start-epoka-tech-B-star.md` — batch razem z ABC 3–4.

## [2026-06-27] Grupa E — ABC **3=A**, **4=A**

**Maciej:** **3=A** Ziemia stały preset · **4=A** rywale ±1.  
**Uwaga:** roster **9 typów** — na małej mapie proporcjonalnie mniej (nie 9); **wrócić do Grupy D** — cywilizacje startowe.  
**Handoff D:** `docs/grupa-e/handoff/E1-do-GRUPA-D_cywilizacje-startowe.md`  
**Kod 3/4:** zgodny z A — bez zmiany MAPA/menu ±1; SILNIK batch 1–4 **GOTOWE-do-wpiecia**.

## [2026-06-27] Grupa E — ABC **5=C** (menu S0 hybryda)

**Maciej:** **5=C** — główny ekran: Rozpocznij grę · Kampania · Multiplayer · Ustawienia (+ hero); podmenu **Więcej**: Kontynuuj · Wczytaj · O grze · Wyjdź (pełne A+B).  
**Handoff UI:** `dyspozycje/_handoff/GRUPA-E-do-UI_menu-S0-5C.md` · **TODO** `mainMenu.ts` + `Gra-podglad-MENU.html`.

## [2026-06-27] Grupa E — ABC **6=A**, **7=A**, **8=B*** (menu + złoża)

**Maciej:** **6=A** Kampania+Multi widoczne, „Wkrótce" · **7=A** wideo tło menu · **8=B*** miedź przy Brązie (koniec Kamienia), żelazo przy Żelazie (koniec Brązu), **tylko Góry** (nie Wzgorza).  
**Handoff MAPA:** `dyspozycje/_handoff/GRUPA-E-do-MAPA_zloza-epoki-8B-star.md`  
**Otwarte:** ABC **11–12**.

## [2026-06-27] Grupa E — ABC **9=B**, **10=A***

**Maciej:** **9=B** złoża niewidoczne przed epoką · **10=A*** oba cele: dominacja = **Power > 50%** w **ostatniej epoce** (nie podbój wszystkich); nauka = **wszystkie tech + rakieta z robotami** na najbliższą planetę.  
**Backlog:** rankingi cyw. (Power, nauka…) — nieodkryte bez nazw → `docs/grupa-e/handoff/E2-rankingi-cywilizacji.md`  
**Handoff:** `GRUPA-E-do-CYWILIZACJE_victory-10A-star.md`

## [2026-06-27] Grupa E — ABC **11=C***, **12=A** — **PACZKA KOMPLET**

**Maciej:** **11=C*** barbarzyńcy do epoki przed Średniowieczem; od Średniowiecza **buntownicy** na mapie (nie checkbox menu). **12=A** sync mockupów `Makieta-flow-nowa-gra.html` + `Gra-podglad-MENU.html`.  
**Handoff:** `GRUPA-E-do-CYWILIZACJE_barbarzyncy-buntownicy-11C-star.md` · `GRUPA-E-do-UI_sync-mockupy-12A.md`  
**→ Master:** wszystkie ABC 1–12 zamknięte — kolejka implementacji + Excel `Grupa-E`.

## [2026-06-27] SPEC: jakość renderu + mapy w kreatorze (Maciej — jakość > FPS)

**Kontekst:** pełny styl Roblox zaakceptowany wizualnie; optymalizacja sprzętowa odrzucona na rzecz presetów jakości.  
**Spec:** `docs/grupa-e/SPEC-jakosc-render-i-mapa.md` — dwa suwaki (Niska/Średnia/Wysoka): render GPU vs szczegółowość dekoracji mapy; rozróżnienie od **Rozmiar mapy**.  
**Właściciel UX/kontraktu:** **Grupa E** (`newGameFlow`, krok 4). **MAPA** presety `scene.ts`. **SILNIK** wpiecie `main.ts`.  
**Czeka:** ABC Macieja Q1–Q4 w spec §10.

## [2026-06-27] WPIĘTE: presety jakości renderu + mapy (F1–F3 bez ABC)

**Zrobione:** `MapRenderOptions` + `resolveRenderPreset()` (`mapRenderStyle.ts`); `buildScene` GPU + robloxLite z 2 suwaków; kreator krok 4 (`render_quality`, `map_detail` w `ui-params.json` + sekcja „Wygląd świata”); menu „Jakość grafiki” = domyślny render w kreatorze (wariant C); `main.ts` przekazuje opcje do `buildScene` + zapis `renderQuality`/`mapDetailQuality` w save; kanon zbudowany.  
**Testy:** logic 203/203. **Czeka Opus:** review przed publikacją (workflow). **ABC §10:** nadal otwarte (domyślne provisional: render Średni, mapa Wysoka).

## [2026-06-27] SYNC-EKSPORT: MASTER-Silnik → eksport-pelny

**Trigger:** Maciej — „archiwizuj czat”.  
**Skrypt:** `sync-chat-export.py --slot MASTER-Silnik --chat-id 58b15435-b915-4a50-87ce-375f0e9ef1fe --mode full`  
**Plik:** `docs/archiwum-czatow/eksport-pelny/MASTER-Silnik_KORESPONDENCJA.md` (984 linie)  
**Handoff:** `MASTER-Silnik_HANDOFF-KONTEKST.md`

## [2026-06-27] Master: bramka OBL-MAP-01 + publish kanon `bf99e18b`

**Batch Silnika:** OBL-MAP-01 — oblężenie w głównej grze (C3-Q1=A, AI auto-oblężenie, save/load markerów, kapitulacja głodem, Lucznik przy Atenach PT-C3-01).

**Bramka F (Master):** typecheck OK · logic 203/203 · combat OK · map-siege 6/6 · oblezenie 27/27 · smoke OK · battle-smoke OK · grupa-b 12/12 · civ-bonusy 26/4 FAIL (lane D — Celtowie, znany).

**Publish kanon:** `gra-kanon/` + `Gra-podglad.html` root · md5 **`bf99e18b9f164dd1a734bbb5114755f1`** · archiwum poprzedniego kanonu → `gra-kanon-archiwum/gra-kanon_20260627-230900`.

**Start gry (bezpieczna):** `gra-kanon/START.html` lub root `START-GRA.html` → `Gra-podglad.html?skipMenuRedirect=1` (silnik + newGameFlow, nie mockup HTML).

**Maciej — playtest:** `Gra-podglad-PLAYTEST-WALKA.html` (oblężenie scenariusz B) · pełna gra przez START · checklist §5 w `GRUPA-C-do-SILNIK_oblezenie-mapy-kanon.md`.

**→ Opus:** review przed formalnym sign-off.

## [2026-06-27] Maciej PLAYTEST OK — KANON ZAMKNIĘTY `bf99e18b`

**Maciej:** wszystko działa · „możemy to implementować" (oblężenie OBL-MAP-01 + pełna gra).

**Kanon oficjalny:** `Gra-podglad.html` + `gra-kanon/` · md5 **`bf99e18b9f164dd1a734bbb5114755f1`**.

**Zamknięte:** OBL-MAP-01 · PT-C3-01 · bitwa · save/load oblężenia.

**Następne lane (dyspozycje w `OD-MASTERA.md`):** A-START · E menu 5=C · D Celtowie · E1-UX kreator.

## [2026-06-27] PILNE: audyt 🟡/🔵 → kolejka wykonania (Maciej: zero wiszenia)

**Trigger:** Maciej — wszystkie pozycje częściowe i docs/handoff → konkretne zadania.

**Utworzono:** `dyspozycje/PILNE-KOLEJKA-2026-06-27.md` (P0–P2 per lane).

**Wykonano dziś (MASTER + lane subagenci):**

| ID | Wynik |
|----|-------|
| SIL-P0-05 | D3-Q1 dyplomacja + `getPlayerEra` w main.ts |
| SIL-P0-02/04 | milicja szturm + besieger count panel |
| CYW-P1-02 | civ-bonusy **30/30** |
| UN-P1-01 | `siegeAi.ts` + test 17/17 |
| MAP-P1-01 | pełny klaster obcych + test 35/35 |
| CYW-P1-01 | AI defensywne kopie + ai-test 198/198 |
| UI-P1-01 | modal wojny — wpięty |

**Handoffy → SILNIK: GOTOWE:** `MAPA-do-SILNIK_spawn-obcy-klaster.md`, `UNITS-do-SILNIK_AI-siege-3poziomy.md`, `CYWILIZACJE-do-SILNIK_AI-defensywne-kopie.md`, `CYWILIZACJE-do-SILNIK_bonusy-D4-Q3.md`.

**Następny krok SILNIK:** SIL-INT-1..3 (integracja handoffów + OBL-S5 machiny) → Opus → kanon.

**Dyspozycje zaktualizowane:** `SILNIK.md`, `UI.md`, `UNITS.md`, `MAPA.md`, `CYWILIZACJE.md`, `EKONOMIA.md` § PILNE.

## [2026-06-27] SIL-INT batch — wpięcie pilnych luk w main.ts

**Wykonano (MASTER = SILNIK integracja):**

| Batch | Co |
|-------|-----|
| SIL-INT-1 | Pełny klaster obcych (spawnCities) — weryfikacja |
| SIL-INT-2 | `siegeAi.ts` → AI 3 poziomy oblężenia + auto szturm |
| SIL-INT-3 | OBL-S5 machiny: `siegeMachines.ts`, panel, save/load, szturm z gotowych |

**Testy:** map-siege 6/6 · oblezenie 27/27 · siege-ai 17/17 · cluster 35/35 · smoke OK · vite build OK

**ROBOCZA:** `Gra-podglad-ROBOCZA.html` — md5 **`b1eb8091fc43127833aeebdf0b7b0e5a`**

**Handoff:** `dyspozycje/_handoff/MASTER-do-SILNIK_SIL-INT-batch-2026-06-27.md`

**→ Opus review → kanon `Gra-podglad.html`**

**CZEKA lane (nie blokuje):** MAP-P1-02 obóz 3D · UI-P1-02 · CYW-P1-03/04 · EKO-P2-01

## [2026-06-27] ARCHIWUM: Grupa D — ABC + audiencja + domknięcie lane CYW

**Trigger:** Maciej — „Zarchiwizuj cały dzisiejszy czat".  
**SYNC-EKSPORT:** `sync-chat-export.py --slot GRUPA-D --chat-id dcf7700f-ba3e-4838-ab8c-6180f42c0a7d --mode full` → **530 linii**  
**Pełna korespondencja:** `docs/archiwum-czatow/eksport-pelny/GRUPA-D_KORESPONDENCJA.md`  
**Podsumowanie sesji:** `docs/archiwum-czatow/lane/LANE-GRUPA-D-abc-audiencja-domkniecie_2026-06-27.md`  
**Handoff:** `docs/archiwum-czatow/eksport-pelny/GRUPA-D_HANDOFF-KONTEKST.md`  
**Stan lane:** CYW Grupa D **ZAMKNIĘTY** · routing → `CYWILIZACJE-do-SILNIK_delegacje-poza-lane-D.md`

## [2026-06-28] CYW → SILNIK: audyt ABC Grupa D + status kolejki

**Trigger:** Maciej — ponowny audyt + wypchnięcie tematów z kolejki CYW.  
**Handoff:** `dyspozycje/_handoff/CYWILIZACJE-do-SILNIK_status-audit-2026-06-28.md`  
**Werdykt:** ABC 1A–7B **ZAMKNIĘTE u CYW** · Silnik wpiął D3/roster/bonusy 3D/defensiveCopy · **OPEN:** 1 linia `resolveArchetypeAggression` main.ts · diplomacy re-run 135/135 · preBattle→UI · **NEW:** victory 10=A* + barbarians 11=C* → handoffy 2026-06-28.
