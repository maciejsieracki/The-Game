# Kolejka review Opus 4.8 — przed kanonem

> Master Silnik dopisuje **automatycznie** po `→ MASTER: GOTOWE-ROBOCZA` z Grupy F.  
> Opus (Ask, ręcznie w UI) — APPROVE / BLOCK. Master promuje do `Gra-podglad.html` **tylko po APPROVE**.

**Append-only.**

---

### [2026-06-26] BATCH F-TW-v3-F3-walka-rome2 — KANON opublikowany

**Status:** **OPUBLIKOWANY**

**md5:** `B62150A905CEE4A4BFF5F7A807E73582` · `Gra-podglad.html`

**Zintegrowano:** Faza 3 TW Rome 2 — `combatUnitFromDef` · wpięcie EN (`main.ts`, `manualBattle`, `battleScene`) · pre-bitwa hit% TW

**Bramka:** combat 6/6 · logic 203 · smoke · battle-smoke OK

**→ Opus (ex-post):** APPROVE / BLOCK — walka mapy Rome 2

---

### [2026-06-26] BATCH F-C2-ECON-HUD-v1 — KANON opublikowany *(superseded by `B62150A9…`)*

**Status:** **OPUBLIKOWANY** — Integrator nie czekał na gate (dyspozycja Macieja 2026-06-26)

**md5:** `7B98660443294C801EDA67869BD61BDE` · `Gra-podglad.html`

**Zintegrowano:** Wealth off HUD mapy (skarbiec) · Zapasy wojska + alert głodu · plaster D2=A (pula Pracy + gate terytorium) · bonusy dyplo (`getCivBonusy` ×3)

**Bramka:** logic 203 · diplomacy 135 · civ-bonusy 30 · civ-roster 11 · victory 12 · ai 198 · wire-ekonomia 29 · smoke · battle-smoke OK

**→ Opus (opcjonalny, ex-post):** APPROVE / BLOCK — nie blokuje kolejnych batchy

---

### [2026-06-29] BATCH E1 + F-CITY-HEX + okolica — ROBOCZA *(stary — superseded by `7B986604…`)*

**Status:** **SUPERSEDED** — kanon na dysku = `4602e752d7e4b21f3c2460e494e82a8f`

**Wersja:** `Gra-podglad-ROBOCZA.html` = `Gra-podglad.html` (build wspólny)  
**md5:** `611613f49b8fdb92a550cae887606db3` *(stary — patrz AKTUALNY KANON)*

**Zintegrowano:**
- E1 bundled jakość mapy (kreator + save + query)
- F-CITY-HEX (czysty hex miasta, snapshot plonów centrum)
- Okolica 👤: auto profile + ręczny toggle + dynamiczny podgląd siatki
- Wcześniejsze batche w bundlu: OBL-S6, złoża epok, preBattle bonusy, B5 empire food, B1-tech sync, UNITS C4/P1, menu S0, drawer miasta 45%

**Bramka:** pełna ZIELONA · forest-parity 98/98 · okolica 32/32 · smoke · battle-smoke

**Playtest Macieja (✅):** okolica PLAYTEST-MIASTO · E1/F-CITY-HEX sign-off  
**Playtest Macieja (⬜):** ISO-4 pełna ścieżka (kreator ×3 jakości, founding na lesie, save/load)

**Handoff:** `MASTER-do-INTEGRATOR_E1-F-CITY-HEX-batch.md`

**→ Opus:** APPROVE / BLOCK → Master formalny sign-off kanonu

---

### [2026-06-28] BATCH sesja pilna — ROBOCZA (CZEKA Opus)

**Status:** **GOTOWE do review**

**Wersja:** `Gra-podglad.html` = `Gra-podglad-ROBOCZA.html` (Ctrl+F5)

**Nowe w batchu 2026-06-28:**
- B5 żywność państwa na HUD
- F2 przełączniki 🎭/⛪ przy minimapie
- F-B-TARTAK-DREWNO (Drewno po tartaku)
- Save/load ulepszeń mapy

**Bramka MASTER:** smoke · logic 203 · grupa-b 27 · oblezenie 27 · map-siege 6 · siege-ai 17 · cluster 35 · diplomacy 135 · civ-bonusy 30 — ZIELONE

**Playtest checklist:** `_handoff/MASTER-do-SILNIK_handoff-test-sesja-2026-06-28.md`

**Przekazanie lane (SILNIK 2026-06-28):** UI · MAPA · CYW · EKO · Opus — manifest `dyspozycje/MACIEJ-DELEGACJA-LANE-2026-06-28.md`. Review **nie blokuje** lane'ów równolegle.

**Maciej:** otwórz **Opus 4.8 Ask** → ten plik → review batch 28.06 → APPROVE/BLOCK.

**Decyzja Opus:** APPROVE / BLOCK → Master promuje kanon

---

### [2026-06-27 14:30] BATCH F — ROBOCZA (aktywny — CZEKA Opus)

**Status:** **GOTOWE do review**

**Źródło:** Grupa F + weryfikacja Master (`docs/master/WERYFIKACJA-SILNIK-2026-06-27.md`)

**Wersja robocza:** `Gra-podglad-ROBOCZA.html` (md5: `d813159b0726b94f8e360c53dadf72a8`) *(stary — patrz AKTUALNY KANON)*

**Zintegrowano w main.ts:**
- F1/F2 save-load, wealth, AI trudność, mury
- F-A2 `generujSwiat` (nowa gra z kreatora)
- F-B2 + F-B2-porzadek (społeczeństwo, kary, migracja buntu)
- F-C1 preBattle TW (multi-unit, deploy, survivors sync)
- F-HUD + F-HUD-2 (D1B: toolbar, WYKONAJ, panel [H], tryb budowy A4)
- B2-Q5 `getRevolt` + overlay 🔥

**Backup:** `main.ts.bak-SILNIK-20260627-F-HUD-2`

**Testy Master (PASS):**
- wire 29/29 · logic 195/195 · combat 6/6 · diplomacy 133/133 · ai 188/188
- smoke OK · battle-smoke OK (WARN: auto button przy re-open)
- vite build OK

**Znane wyjątki (nie blokują review gameplay P0):**
- `tsc --noEmit` FAIL — pliki preview/legacy (nie ścieżka gry)
- `civ-bonusy-test` 4 FAIL (Grecy handel yield, Celtowie szarza) — lane D P2

**Do sprawdzenia Opus (playtest ROBOCZA w przeglądarce):**
1. Nowa gra → mapa z generatorem (nie pusta)
2. HUD D1B: pasek, minimapa, toolbar, Zakończ turę
3. Panel miasta B2: suwaki, Porządek, bunt (chip)
4. Zaznacz jednostkę → panel [H]
5. Tryb 🔨 budowy → placement ulepszenia
6. Atak → preBattle → bitwa ręczna (T) → powrót na mapę
7. Save / Wczytaj

**→ Opus: CZEKA**

#### Opus [2026-06-27] — **APPROVE** (warunkowy — gameplay P0)

**Wykonane w tej sesji (Master = Opus):** ponowna bramka `bramka-test-publish.ps1` · md5 bez zmian `d813159b0726b94f8e360c53dadf72a8` *(stary — patrz AKTUALNY KANON)*.

| Test | Wynik |
|------|-------|
| wire · logic · combat · diplomacy · ai | **PASS** |
| smoke · battle-smoke · vite build | **PASS** |
| civ-bonusy | 26 PASS, **4 FAIL** (lane D P2 — nie blokuje) |
| tsc | FAIL legacy/preview — nie blokuje vite |

**Uwagi (nie blokują APPROVE P0):**
- battle-smoke WARN: przycisk auto przy re-open preBattle
- `deploy: true` w kodzie — korekta Macieja (pozycje na mapie) = batch **po** playteście A
- civ-bonusy Grecy/Celtowie → Grupa D

**Werdykt:** **APPROVE** na publikację kanonu **po playteście Macieja** na `Gra-podglad-ROBOCZA.html` (checklista poniżej). Brak BLOCKERów P0 w automatycznych testach.

**Checklista Macieja (5–15 min, ten sam plik ROBOCZA):**
1. Nowa gra → mapa **nie pusta** (generator)
2. Start mapy: kamera, fog, panel budowy (znane A-START — zgłoś tu)
3. Kreator krok 2–4: nawigacja (E1-UX — znane)
4. HUD: toolbar, WYKONAJ, Zakończ turę
5. Klik jednostkę → panel [H]
6. Atak wroga → preBattle → Bitwa ręczna → powrót na mapę
7. Ctrl+S / Ctrl+L save

Po OK Macieja → Master promuje `Gra-podglad.html`.

---

### [2026-07-01] BATCH P0+P1 scalony — CZEKA Opus *(AKTUALNY KANON na dysku)*

**Status:** **GOTOWE do review**

**Wersja:** `Gra-podglad.html` = `Gra-podglad-ROBOCZA.html`  
**md5:** `4602e752d7e4b21f3c2460e494e82a8f`

**Zintegrowano:** BONUS-C · F-POWER-MANPOWER-01 · D-V11 dyplo v1.1 · P1-C MAPA · scalenie wcześniejszych (OBL-CAP, CYW 5A, Panel-C, A2-Q5, FOOD, C3)

**Bramka (meldunek Integratora):** map-improvement 34 · manpower 22 · power-objective 6 · diplo suite · logic 203 · combat 6 · smoke · battle-smoke  
**Bramka (subagent 2026-06-29):** logic 203/203 · combat 6/6 · smoke OK · battle-smoke OK · forest-parity 98/98

**Playtest Macieja:** Power HUD · dyplo v1.1 · OBL-CAP ST-2/3 · ulepszenia P1-C

**→ Opus:** APPROVE / BLOCK → Master formalny sign-off kanonu

**Uwaga:** OBL-CAP fix `6449407489B4CF684B8EDDB9D30CCA0F` — meldunek 2026-07-01, **brak na dysku** — Master/Integrator doprecyzować przed Opus.

---

### [2026-06-26] BATCH F-PANEL-ROSTER-v1 — CZEKA Opus *(AKTUALNY KANON na dysku)*

**Status:** **GOTOWE do review**

**Wersja:** `Gra-podglad.html`  
**md5:** `5949422D3C7A614E9F695B07663309D9`

**Batch:** Excel → silnik (Panel-A + Panel-E JSON) · roster 15 nacji

**Pliki kluczowe (diff logiczny):**
- `gra/src/data/map-gen-params-loader.ts` · `e-start-params-loader.ts`
- `gra/data/map-gen-params.json` · `e-start-params.json` (już na dysku, teraz czytane)
- `gra/data/civs.json` — 15 cywilizacji · Sumer → `typCywilizacji: sumer`
- `gra/src/types/player.ts` — enum +7
- `gra/src/game/diplomacy.ts` — ARCHETYPE_AGGRESSION/TRADE
- `gra/src/map/clusters.ts` — roster 15
- `gra/src/map/newGameMapDefaults.ts` · `visibility.ts` · `gen-helpers.ts` · `deposit-era.ts` · `generator.ts` · `victory.ts`

**Handoffy:** `MAPA-do-INTEGRATOR_map-gen-params.md` · `CYWILIZACJE-do-SILNIK_roster-15-enum.md`

**Bramka (Integrator):** logic 203/203 · diplomacy 135/135 · civ-bonusy 30/30 · civ-roster 11/11 · victory 12/12 · ai 198/198 · smoke OK

**Playtest Macieja:** ⏸ **NIE TERAZ** — Maciej robi playtest i balans Panel-A/E dopiero przy grywalności v1. Brak BLOCK od Macieja = nie eskalować.

**Do sprawdzenia Opus (read-only / adversarial):**
1. Loadery JSON: sensowne fallbacki gdy brak klucza w pliku
2. Brak regresji generatora / mgły / złoż (logic mapgen 85–94)
3. `TypCywilizacji` kompletny vs `civs.json` (15 typów, Sumer≠Babilonia)
4. `ARCHETYPE_*` dyplomacji — wszystkie enumy mają wpis
5. `civIdsFromRoster` / `assignAiCivTypes` — pula 15, cap mapy bez zmian
6. Brak martwego importu / circular deps w loaderach

**→ Opus:** APPROVE / BLOCK → wpis poniżej · Master aktualizuje kanon jeśli trzeba

**Decyzja Opus:** _(CZEKA — wklej APPROVE lub BLOCK + uzasadnienie)_

---
