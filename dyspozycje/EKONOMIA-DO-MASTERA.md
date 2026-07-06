# EKONOMIA → MASTER : pytania i raporty

---

### [2026-07-05 ~23:05] **→ MASTER: GOTOWE-ROBOCZA · batch UPGRADE (ABC-20…24)**

**Handoff:** `_handoff/EKONOMIA-do-MASTER_upgrade-2026-07-05.md`  
**Decyzje:** UPG-LOC / UPG-PROD / UPG-BONUS · łańcuchy w `buildings.json`

| Plik | Zmiana |
|------|--------|
| `building-upgrades.ts` | **nowy** — łańcuch, `Rozbuduj X→Y`, tooltip |
| `production.ts` | kolejka upgrade, merge bonusów |
| `buildings.json` | `upgradeFrom`, suppressed (Teatr→Akademia ABC-21B) |
| `upgrade-budynki-test.cjs` | **28/28** |

**Robocza:** md5 **`eac24a666f3854290ba4ba241e979d46`** · marker „Rozbuduj" w bundlu ✅  
**GitHub:** logika upgrade **nie wypchnięta** — commit po playtest Macieja  
**→ MASTER:** playtest miasto/produkcja · potem commit batch

---

### [2026-07-04] **→ MASTER: GOTOWE · EKO-TECH Paczka 1 (wdrożenie lane)**

**Decyzje:** `docs/decyzje/D-EKO-TECH-PACZKA1-2026-07-04.md` · Maciej `działaj`

| Obszar | Pliki | Status |
|--------|-------|--------|
| JSON | `tech.json`, `buildings.json`, `terrain-improvements.json` | ✅ |
| Logika | `research.ts`, `playerState.ts`, `production.ts`, `converters.ts`, `loader.ts` | ✅ |
| Testy | `eko-tech-paczka1-test.cjs` **9/9**, `converters-test.cjs` **31/31** | ✅ |
| Integracja runtime | `main.ts` — bramka + `applyCompletedBuildingIds` | ✅ SILNIK 2026-07-04 |

**Handoff integracji:** `dyspozycje/_handoff/EKONOMIA-do-SILNIK_eko-tech-p1-integracja-2026-07-04.md`  
**MAPA:** `droga_brukowana` w JSON — lane MAPA czeka ruch +2  
**UI:** T-TECH-8-UI (lista wybudowanych) — czeka decyzja Macieja

---

### [2026-07-04] **→ MASTER: WPIĘTE · CELT-Q3 filtr Nacja**

**Handoff:** `EKONOMIA-do-MASTER_nacja-filter-wiring.md` — **DONE** · kanon opublikowany.

**Lane B:** IDLE. **Grupa C:** czeka `działaj` (jednostki).

---

### [2026-07-02] **→ MASTER: GOTOWE · batch D18-BALANS-TRUDNOSC**

**Trigger:** Maciej `Master` · ABC formularz + START=Tak · lane B wdrożył.

| ID decyzji | Wybór |
|------------|-------|
| D18-0…6 | A · A · A · **B** · **A+C** · A · A |

| Deliverable | |
|-------------|---|
| Handoff | `dyspozycje/_handoff/EKONOMIA-do-MASTER_D18-BALANS-GOTOWE.md` |
| Integrator | `dyspozycje/_handoff/EKONOMIA-do-INTEGRATOR_d18-main-wiring.md` |
| Testy | society-breakdown **26/26** · wealth **28/28** · culture-religion **51/51** |
| JSON | wagi 55/45·50/50·45/55 · bunt 5/8/10% · grace 3/2/2 · osada 4/3/2 · immunitet W 10/5/3 |

**Master:** playtest PT-Z05 (3 trudności) → `playtest OK` / `BUG:`  
**Lane B:** **IDLE** — czeka ACK

---

### [2026-07-01] **→ MASTER: GOTOWE · paczka lane B (zbiorczy)**

**Trigger:** Maciej `start` → `master` · lane B bez nowej dyspozycji · self-check OK.

| Batch | Testy |
|-------|-------|
| D16-D17-START | 21 + 34 + 28 |
| B5-SP-LIMIT | 16 + 9 |
| B5-Spichlerz + FOOD-HODOWLA | 9 + 26 |
| P-C2-DEF (moduł) | 12 |

**Handoff:** `dyspozycje/_handoff/EKONOMIA-do-MASTER_paczka-lane-B-2026-07-01.md`  
**Integrator:** `MASTER-do-INTEGRATOR_D16-D17-wiring-2026-07-01.md` · P-C2-DEF  
**Lane B:** **IDLE** — czeka ACK Mastera

---

### [2026-07-01] **D16-D17-START** — łagodny start + woda/rzeka

**Maciej:** **D16-A + D17-A** (playtest: bunt T1 + „Brak wody” nad rzeką).

| Deliverable | Plik |
|-------------|------|
| D16-A kod | `society-breakdown.ts`, `wealth.ts`, `culture-religion.ts`, `cities.ts`, `turn-economy.ts` |
| D17-A kod | `turn-economy.ts` (`cityHasWaterAccess`), `cityPanel.ts` |
| JSON | `society-params.json` (`prawo_bonus_osada*`), `econ-params.json` (`wealth_kara_zero`, `wealth_immunitet_tur`) |
| Testy | society-breakdown **21/21** · wire-ekonomia **34/34** · wealth **28/28** |
| Handoff Master | `dyspozycje/_handoff/EKONOMIA-do-MASTER_D16-D17-START-GOTOWE.md` |
| Handoff Integrator | `dyspozycje/_handoff/EKONOMIA-do-INTEGRATOR_d16-main-wiring.md` (3 linie main.ts) |

→ MASTER: **GOTOWE** · batch D16-D17-START · **bez main.ts**

---

### [2026-07-01] **P-C2-DEF=A** — pkt bitew z M wroga

**Maciej:** **A** — suma M_pole pokonanego składu **przed walką**; bez bonusu underdog.

| Deliverable | Plik |
|-------------|------|
| Decyzja | `docs/decyzje/P-C2-DEF-wygrana-bitwa-2026-07-01.md` |
| Kod lane B | `power-objective.ts` · `power-params.json` |
| Test | `power-objective-test.cjs` **12/12** |
| Integrator | `dyspozycje/_handoff/EKONOMIA-do-INTEGRATOR_p-c2-def-a.md` |

---

**Handoff:** `dyspozycje/_handoff/EKONOMIA-do-MASTER_B5-spichlerz-GOTOWE.md`  
**Obieg:** `docs/obieg/B-ekonomia.md` § 🟠 U MASTERA  
**Slack outbox:** `docs/obieg/SLACK-OUTBOX-GRUPA-B-2026-07-01.md`  
**Testy:** spichlerz-wzrost 9/9 · empire-food-b5 16/16 · food-hodowla 26/26  
**Maciej:** nie wkleja do hubu — pliki = prawda

---

### [2026-06-26] **P-C1 WYCOFANE** — osadnik nie w grze

**Maciej:** brak osadnika → P-C1 nie dotyczy. Opcja Panel-B zostaje jako legacy (no-op).

**Backlog P-FUTURE:** siła armii wg statów bojowych — **scalone z P-ARMIA** (Maciej zaproponuje).

### [2026-06-26] **P-ARMIA + P-C2 OTWARTE** — nowe modele od Macieja

**Maciej:** zarówno składnik **Armia**, jak i **Bitwy** dostaną inne rozwiązania niż flat (v1 tymczasowo: jednostki×25, bitwy×25 w kodzie). Czekam na propozycję + powiązanie z mechaniką walki.

---

**Maciej:** Moc gotowa · Panel-B wiążący · wpinamy w kanon.

| Deliverable | |
|-------------|---|
| Handoff | `dyspozycje/_handoff/EKONOMIA-do-INTEGRATOR_moc-v1-GOTOWE.md` |
| Panel-B | Potega-P-A, Potega-opcje, Manpower-epoki → `export-b.py` |
| Kod | `power-objective.ts`, `power-options.ts`, `main.ts` (dominacja + armia P-C1) |
| Testy | power-objective 9/9 · power-options 5/5 · manpower 22/22 |

**Integrator:** build + Opus + `Gra-podglad.html` (checklist w handoff).

---

### [2026-06-26] **P-C3 ZAMKNIĘTE** — nazwa **Moc** (PL) / **Power** (EN)

**Maciej:** stary Wpływ → nowa metryka P-A; w UI **Moc**, w kodzie Power.

| Deliverable | Plik |
|-------------|------|
| Decyzja | `docs/decyzje/P-C3-moc-power-nazwa.md` |
| Kontrakt lane | `dyspozycje/_handoff/P-C3-moc-nazwa-KONTRAKT.md` |
| UI | `power-labels.ts`, `hud.ts`, `powerOverlayHud.ts`, `newGameFlow.ts` |
| JSON | `power-params.json` → `_nazewnictwo`, `hud_etykieta` |

**Integrator:** przy następnym kanonie — brak „Wpływ”/„Power” w stringach PL.

---

### [2026-06-26] **Korekta P-A** — ludki **5 pkt**, wagi per-cyw **WYŁĄCZONE**

**Maciej:** przy 10 miastach ~100 ludków → 15 pkt/ludek za dużo. **5 pkt/ludek.** Cyw-12-POTEGA usunięte z macierzy.

| Zmiana | Wartość |
|--------|---------|
| `ludek` | **5** pkt (było 15) |
| Kalibracja | 100 ludków, **Power = 3020** |
| Cyw-macierz | bez wag Power (113 params) |

**Test:** `power-objective-test.cjs` **9/9 OK** · Panel-B + kalkulator Excel zregenerowane.

---

**Maciej:** parametry Power + Manpower + per-cyw w panelu sterowania.

| Panel | Arkusze | JSON |
|-------|---------|------|
| Panel-B | Potega-P-A, Potega-opcje, Manpower-epoki | power-params.json, epoka-ludnosc-manpower.json |
| Panel-D / Cyw-12-POTEGA | 9 mnoznikow + bias + flagi | civ-matrix.json |

**Test:** `test-panel-b-roundtrip.py` OK (miasto + Potega-P-A) · regen Panel-B + Cyw-macierz OK.

---

**Decyzja:** Punktacja wyjściowa P-A (9 składników, bez × epoka). Szczegóły: `docs/decyzje/P-A-power-kanon.md`

**Deliverable:**

| Plik | Zmiana |
|------|--------|
| `gra/data/power-params.json` | Współczynniki 25/25/15/5/50/0.5/5/20/5 |
| `gra/src/game/power-objective.ts` | ludki, rekrut ekw., tech, ulepszenia; mnoznik=1 |
| `gra/src/game/manpower.ts` | `rekrutUnitEquivalents`, `sumaLudkow` w `empirePoborTotals` |
| `gra/src/main.ts` | `buildObjectivePowerForOwner` — tech + ulepszenia + nowe miary |
| `gra/tools/power-objective-test.cjs` | Kalibracja 2670 — **9/9 OK** |
| `dyspozycje/_scalone/EKONOMIA/EKONOMIA-POWER-RESPEKT-SPEC.md` | Sync kanon P-A |
| `tools/build-power-kalkulator-xlsx.py` | Współczynniki + scenariusz kalibracyjny |

**Prośba do MASTER:** build kanon + Opus review (HUD overlay breakdown 9 składników). Otwarte ABC: P-C1–C3.

**Nie zrobiono:** migracja `computePotegaNacji` (stary model dominacji) — osobny batch SILNIK.

---

### [2026-06-30] v1.1 dyplomacja tick (T1A) — **→ SILNIK: GOTOWE**

**Moduł:** `gra/src/game/diplomacy-economy.ts`  
**Test:** `diplomacy-economy-test.cjs` **5/5**  
**Handoff F:** `EKONOMIA-do-SILNIK_v1.1-diplomacy-tick.md` · batch `EKONOMIA+UI+CYW-do-SILNIK_v1.1-diplomacy-batch.md`  
**Nie dotykano:** `main.ts`

---

### [2026-06-26] **→ MASTER: GOTOWE Panel-B** (PANEL-EXEC Grupa B)

**Od:** Maciej (czat lane B) · **Decyzja AB-KOLEJNOSC:** Panel-B przed FOOD-HODOWLA — **panel zamknięty**, FOOD = następny (kod, osobna dyspozycja).

**Deliverable (🟢 izolowane — tylko JSON + skrypty, bez `main.ts`):**

| Plik | Rola |
|------|------|
| `panele-sterowania/Panel-B.xlsx` | Hub balansu B (~186 param.) |
| `gen-panel-b.py` / `export-b.py` / `test-panel-b-roundtrip.py` | gen · eksport · round-trip **OK** |
| `docs/grupa-b/PANEL-B-SPEC.md` | instrukcja Macieja |
| `docs/grupa-b/B-PANEL-INWENTARYZACJA.md` | inwentaryzacja + status 5 kroków ✅ |
| `docs/archiwum/panele-miasto-legacy/README.md` | migracja ze starych Exceli MIASTO/ |

**Arkusze:** Miasto, Ekonomia, Wealth, Globalne, Budynki-eco, Teren-bonus, Zdrowie, Szczescie, Kultura, Religia, Porzadek, **Zywnosc-kanon** → `terrain-improvements.json`

**JSON zasilane:** `miasto-params.json`, `econ-params.json`, `society-params.json`, `terrain-improvements.json` (gra już czyta — **Integrator nie potrzebny** przy samym eksporcie panelu).

**Uwaga techniczna:** przy pierwszym eksporcie Zywnosc-kanon dopisano `lodzie_rybackie.bonus.praca: 3` (kanon). Wiersze bydło/owce/lama w Excelu — eksport czeka na klucze JSON (FOOD-HODOWLA).

**Obieg zaktualizowany:** `docs/obieg/B-ekonomia.md` § PANEL WYKONANE · `docs/ROADMAP.md` § Panele · `REJESTR-DECYZJI.md` PANEL-EXEC

**Prośba do MASTER:**

1. **Przyjąć zamknięcie Panel-B** (PANEL-EXEC / Grupa B) — bez kanonu, bez Opus (same JSON/skrypty).
2. **Kolejka lane B:** FOOD-HODOWLA P2 — dyspozycja do subagenta Composer gdy Maciej powie „start FOOD-HODOWLA” (handoff już w `_handoff/MASTER-do-EKONOMIA_kanon-zywnosc-hodowla.md`).
3. **Maciej kręci balans:** `Panel-B.xlsx` → w czacie **`eksportuj panel`** (agent odpala `export-b.py`).

**Nie dotykano:** `main.ts`, `Gra-podglad.html`, kanon.

---

### [2026-06-29] Bugfix panel miasta — ręczne pola + bilans plonów

**Maciej:** klik nie odznaczał 👤 · bilans plonów nie zgadzał się z przypisanymi polami  
**Przyczyna:** panel używał przestarzałego `workedTilesForCity` (6 sąsiadów) zamiast `cityWorkedTilesForEconomy`  
**Fix:** `cityPanel.ts` toggle klik + plon na heksie · `okolica.ts` toggle w API · test okolica 21/21  
**→ INTEGRATOR:** wymaga rebuild ROBOCZA (lane UI+EKONOMIA, bez `main.ts`)

---

### [2026-06-29] EKO-P2-01 DONE → **→ INTEGRATOR: F-B5-EMPIRE-FOOD**

**Lane:** WIRE 5 `turn-economy.ts` · `empire-food.ts` (tick pełny) · **NIE** `main.ts`  
**Test:** `empire-food-b5-test.cjs` **9/9** · `grupa-b-lane-test.cjs` **38/38**  
**Handoff:** `_handoff/EKONOMIA-do-SILNIK_B5-empire-food.md`  
**Obieg:** `docs/obieg/B-ekonomia.md` § INTEGRATOR

**Silnik:** weryfikacja istniejącego wywołania w `main.ts` + build ROBOCZA (bez patcha jeśli playtest OK)

---

### [2026-06-29] Lane DONE → **→ SILNIK: F-B-TECH-SYNC-29 TERAZ**

**Test:** `grupa-b-lane-test.cjs` **37 pass, 0 fail**  
**Kolejka F:** `dyspozycje/F-KOLEJKA-P0.md` § NASTĘPNY  
**Silnik:** koszt miasta + HUD + fix `canFoundCity` (handoff § B)

---

### [2026-06-29] ABC domknięte — Q1B · FOUND A+B · FOUND-Q2A

**Maciej:** `B1-Q1=B, B1-FOUND-Q1=A+B, B1-FOUND-Q2=A`  
**Zapis:** `docs/decyzje/B1-tech-MACIEJ-2026-06-29.md`  
**Lane:** `evaluateFoundCityAffordance` · `pickSourceCityForFounding`  
**→ SILNIK: GOTOWE** — handoff `EKONOMIA+MAPA-do-SILNIK_B1-tech-sync-2026-06-29.md` (§ B zaktualizowany)

---

### [2026-06-29] B1 tech Maciej ABC → lane GOTOWE → SILNIK

**→ SILNIK: GOTOWE** batch **F-B-TECH-SYNC-29**

**Lane:** Rolnictwo/Łowiectwo · fort Wojskowosc · hover 🔒 · city-founding

---

### [2026-06-29] OKOLICA toggle — rebuild obu podglądów (lane)

**Problem:** fix był tylko w źródle + ROBOCZA częściowo; `Gra-podglad.html` (kanon) **nie miał** stringa „odznacz” w bundlu.

**Błąd lane (2026-06-29):** błędnie przywrócono **stary** `Gra-podglad.html` z git — bez ikon i bez ostatnich zmian. **Cofnięte:** oba pliki = **ten sam build co ROBOCZA** (md5 identyczne).

**UX (Maciej 2026-06-29):** jeden plik **`Gra-podglad.html`**. Stary mock MENU/kreator → archiwum + redirect. ROBOCZA = redirect. Bramka publikuje kanon.

---

### [2026-06-29] → SILNIK: raport spieprzenia publikacji/UX (lane STOP)

**Plik:** `dyspozycje/_handoff/EKONOMIA+UI-do-SILNIK_raport-spieprzenia-2026-06-29.md`

Lane narobił bałaganu w HTML/UX (stary kanon z git, ROBOCZA=redirect, mock flow). **Okolica — fix Silnika zachować.** P0: `diplomaticContactEstablished` undeclared → BOOT ERROR. **Dalszą pracę robi tylko Silnik.**

---

### [2026-06-26] **→ SILNIK: GOTOWE** FOOD-HODOWLA P2 (EKONOMIA lane)

**Od:** MASTER czat (Maciej: „p2 możesz robić”)  
**Kanon:** `docs/decyzje/KANON-ULEPSZENIA-ZYWNOSC-HODOWLA.md`

**Zrobione (lane EKONOMIA only — bez `main.ts`):**

| AC | Wynik |
|----|-------|
| E1 | `terrain-improvements.json`: bydlo/owce/lama, usunięto pastwisko; tarasy Chińczycy+Inkowie |
| E2 | `tileYield` suma warstw (`ulepszeniaKeys`, `improvementKeysForHex`) |
| E3 | `livestock-unlock.ts` + `getResourceAccessForCity` z unlock imperium |
| E4 | `isLivestockAllowed(civ, key, era)` — Inkowie ep&lt;3 |
| E5 | `resources.json` — bez ×200%, opisy kanonu |
| E6 | `node tools/food-hodowla-test.cjs` — **zielony** |

**Handoff:** `dyspozycje/_handoff/EKONOMIA-do-SILNIK_kanon-zywnosc-hodowla.md`

**Pliki:** `economy.ts`, `terrain-improvements.ts`, `turn-economy.ts`, `livestock-unlock.ts`, `resource-access.ts`, `terrain-improvements.json`, `resources.json`, `tools/food-hodowla-test.cjs`

**Czeka:** MAPA lane (M1–M7 + Panel-A) + batch SILNIK F-FOOD-HODOWLA-01 (`main.ts`, model warstw Hex).

**Handoffy cross-lane:**
- → MAPA: `EKONOMIA-do-MAPA_kanon-zywnosc-hodowla.md`
- → INTEGRATOR: `EKONOMIA-do-INTEGRATOR_kanon-zywnosc-hodowla.md` (blokada do MAPA GOTOWE)

---

### [2026-06-26] **→ MASTER: GOTOWE Manpower + Pobór we Wpływie + HUD rekruci**

**Od:** EKONOMIA (Maciej kanon) · **Decyzja:** regen 10% globalnie; różnicowanie nacji przez `bonus_pobor_regen`; nazwa UI **rekruci**; składnik Wpływu **Pobór** = ludność abs. + rekruci.

**Deliverable:**
- `manpower.ts` — `civManpowerRegenMult`, `empirePoborTotals`, regen × cyw
- `power.ts` — Pobór w slocie `ludnosc` (18% wagi)
- `civs.json` — Grecy −15%, Rzymianie +35% regen
- `hud.ts` — pod ⚜ Wpływ: `X rekruci`
- `main.ts` — snapshoty + HUD (wpięte)
- `EKONOMIA-manpower-pobor.md` + handoff `EKONOMIA-do-MASTER_manpower-pobor-wplyw.md`
- `manpower-test.cjs` — **22/22 OK**

**Czeka:** panel miasta (snapshot MP) — UI lane · kanon HTML po Opus.

---

### [2026-06-26] **→ MASTER: SPEC POWER obiektywny vs RESPEKT %**

**Od:** Maciej — Power ≠ normalizacja vs inni; Respekt = stosunek Power w dyplomacji.

**Deliverable:**
- `EKONOMIA-POWER-RESPEKT-SPEC.md` — pełny algorytm + przykład 956 pkt
- `power-params.json` + `power-objective.ts` + test 6/6
- Handoff: `EKONOMIA-do-MASTER_power-objective-v2.md`

**Czeka ABC:** współczynniki pkt, osadnik w armii, nazwa HUD; potem HUD Power (faza 3).

---

### [2026-06-26] **→ MASTER: WPIĘTE SILNIK Power v2 + panel rekruci**

**Temat 2:** `battleWinsByOwner`, snapshot budynków/heksów/jednostek, epoka AI z tech, `refreshObjectivePowerCache`, Respekt z objective Power.  
**Temat 5:** panel miasta — ⚔ rekruci na pasku + karta (pula, max, regen/t, koszt werb).  
**Handoff:** `EKONOMIA-do-MASTER_power-objective-v2.md` (faza 3 = HUD Power).

---

### [2026-06-26] **→ INTEGRATOR: GOTOWE F-POWER-MANPOWER-01**

**Paczka:** `dyspozycje/_handoff/EKONOMIA-do-INTEGRATOR_power-manpower-v2.md`

**Co przekazane:** Manpower/rekruci (kanon + testy 22/22), POWER obiektywny v2 (spec + test 6/6), wpięcia silnika (battleWins, cache Power, Respekt AI), panel miasta rekruci.

**Integrator domyka:** HUD Power zamiast Wpływ 0–100, overlay pkt obiektywnych, Respekt % w UI dyplomacji, kanon HTML po Opus.

---

(Historia: `docs/archiwum/dyspozycje/EKONOMIA-DO-MASTERA.md`)

---

### [2026-07-01] **→ MASTER: GOTOWE · batch B5-SP-LIMIT**

**Decyzja:** SP6=C (cap 100×Spichlerze) · SP6-overflow=A (nadwyżka przepada) · SP3=A  
**Warstwa:** 🟡 cross — `empire-food.ts`, `econ-params.json` · **bez `main.ts`**

**Pliki:**
| Plik | Zmiana |
|------|--------|
| `gra/src/game/empire-food.ts` | `maxZapasy = spichlerzCount × pojemność`; clamp overflow; `getEmpireFoodMaxCap()` |
| `gra/data/econ-params.json` | `spichlerz_pojemnosc_zapasow_panstwa` (normal=100) |
| `gra/tools/empire-food-b5-test.cjs` | +scenariusze cap (0/1/2 Spichlerze, 2-tury overflow) |

**Testy:** `node gra/tools/empire-food-b5-test.cjs` — **16/16** · `spichlerz-wzrost-test.cjs` — **9/9** regresja  
**Handoff UI:** `dyspozycje/_handoff/EKONOMIA-do-UI_spichlerz-cap-kontrakt.md`

**Co sprawdzić po wpięciu F:** HUD mapy `142 / 200` gdy 2 Spichlerze; bez Spichlerza brak kumulacji.

---

### [2026-07-01] **PANEL-P0 sprint · Grupa B — B-M7 weryfikacja**

**Temat:** PANEL-P0-FIX · duplikat FOOD / `terrain-improvements.json`  
**Warstwa:** 🟢 izolowana (tylko skrypty panelu + JSON B) · **bez `main.ts`**

**Weryfikacja `export-b.py`:**
- ✅ **NIE** zapisuje do `terrain-improvements.json` (brak gałęzi w skrypcie)
- ✅ **NIE** eksportuje arkusza `Zywnosc-kanon` (usunięty z `gen-panel-b.py`; arkusze: _INFO, Miasto, Ekonomia, … Technologie, _Eksporty — **bez FOOD**)
- Źródło prawdy FOOD = **Panel-A** (`export-a.py`)

**Panel-B.xlsx:** brakowało w repo → wygenerowano `gen-panel-b.py` (19 arkuszy, bez Zywnosc-kanon)

**Eksport:** `export-b.py` → **0 zmian** (Wartość = JSON kanon)

**Test:** `test-panel-b-roundtrip.py` — **PASS** (miasto + budynki + Potega-P-A)

**Blokery:** brak — P0 B-M7 zamknięty w kodzie od 2026-06-30; xlsx nie było w workspace (OneDrive/gitignore?) — odświeżone generatorem.

**Co sprawdzić po wpięciu:** Maciej edytuje Panel-B → `eksportuj panel` nie dotyka `terrain-improvements.json`.

---

### [2026-07-02] **→ MASTER: ACK review · B1-Q3 APPROVE**

**Handoff:** `EKONOMIA-do-MASTER_B1-Q3-panel-B-2026-07-02.md`  
**Review Master:** **APPROVE** · REJESTR B1-Q3 → 🟢 WDROŻONA  
**F:** dyspozycja **`MASTER-do-INTEGRATOR_F-P1-01-map-attack-2026-07-02.md`** 🟢 START (map attack — osobny batch)  
**Lane B:** **IDLE**

---

### [2026-07-02] **→ MASTER: GOTOWE · PILNE B1-Q3 + Panel-B**

**Dyspozycja:** [`MASTER-PILNE-2026-07-02.md`](MASTER-PILNE-2026-07-02.md) · **warstwa 🟡** · **bez `main.ts`**

**B1-Q3 (drzewko liniowe, Maciej B):**
| Plik | Zmiana |
|------|--------|
| `gra/data/tech.json` | `drzewko_model: "liniowe"` |
| `gra/src/game/tech-tree.ts` | moduł: kolejność w epoce, depth, chain, walidacja grafu |
| `gra/src/game/economy.ts` | re-eksport API tech-tree |
| `gra/tools/tech-tree-test.cjs` | **19/19 PASS** |

**Panel-B:** arkusze Budynki/Surowce/Technologie OK w `export-b.py` · **dry-run 0 zmian** · **roundtrip PASS**

**Handoff:** [`_handoff/EKONOMIA-do-MASTER_B1-Q3-panel-B-2026-07-02.md`](_handoff/EKONOMIA-do-MASTER_B1-Q3-panel-B-2026-07-02.md)

**Regresja lane:** `grupa-b-lane-test.cjs` 41/42 (1 fail empire-food reserve — sprzed batcha)

**Co sprawdzić po wpięciu F:** opcjonalnie `sciencePicker` → `orderedTechsInEpoch`; export Panel-B nie kasuje `drzewko_model`.

---

### [2026-07-02] **→ MASTER: GOTOWE · D-START-OSIEDLE (bonus malejący pop 1–4)**

**Decyzja:** Maciej „ślij” · kanon `docs/decyzje/D-START-OSIEDLE.md`

| Plik | Zmiana |
|------|--------|
| `gra/data/society-params.json` | `*_bonus_osiedle_pop` — tablice [pop1…pop4] per easy/normal/hard |
| `gra/src/game/society-breakdown.ts` | `pickOsiedlePopBonus`, etykieta „Osiedle (N mieszk.)” w Sz/Prawo |
| `gra/src/game/turn-economy.ts` | Zdrowie — ten sam model osiedla |
| `gra/tools/society-breakdown-test.cjs` | regresja osiedle + PorPct ≥45% normal T1 |

**Bez `main.ts`.** Playtest: załóż miasto pop=1 → panel Porządek powinien pokazać **Napięcie** (normal), linia „Osiedle (1 mieszk.)” w Prawie (+6).

**Bramka:** `node tools/society-breakdown-test.cjs`

---

### [2026-07-02] **→ MASTER: ZAMKNIĘTE · D-START-OSIEDLE (Maciej final)**

**Sign-off:** „Wdrażamy w takiej formie. Jest super.”

**Kanon Excel → JSON** (`docs/balans/D-START-OSIEDLE-tuner.xlsx`):

| | Easy P/Sz | Normal P/Sz | Hard P/Sz |
|--|-----------|-------------|-----------|
| pop1 | 9/4 | 7/3 | 5/1 |
| pop2 | 7/3 | 5/2 | 3/1 |
| pop3 | 5/2 | 3/1 | 2/0 |
| pop4 | 3/1 | 1/0 | 1/0 |

PorPct T1 pop=1 (kult+rel): **80% / 58% / 34%** (Spokój / Napięcie / Niepokój).

**Import:** `python tools/import-osiedle-tuner-xlsx.py` · doc: `docs/decyzje/D-START-OSIEDLE.md`

**Lane EKONOMIA:** IDLE (wdrożone, bez main.ts).

