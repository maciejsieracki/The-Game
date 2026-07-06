# UI → MASTER (meldunki lane)

Zasada: append-only · **Master czyta od sekcji ▶ START poniżej.**

## ⚠ Brama Macieja (playtest / gameplay)

**Maciej ogląda grę TYLKO po publikacji kanonu przez Master w hubie** — nie w `gra/src/`.

| Lane melduje | Agent lane **NIE robi** |
|--------------|-------------------------|
| Kod + testy lane OK | build kanon · `publish-kanon-snapshot.ps1` · „przyjmuję rolę MASTER" |
| Handoff + flaga meldunku | playtest · prośba „sprawdź w grze" |

**Flaga `→ MASTER: master` / `→ MASTER: GOTOWE`** = **adresat: hub Master** — lane tylko dopisuje plik. Szczegóły: [`docs/obieg/LANE-NIE-MASTER.md`](../docs/obieg/LANE-NIE-MASTER.md).

**Master w hubie** (po Twoim `master` **tam**): F → robocza → review → kanon → dopiero Ty: Ctrl+F5.

Wpis lane kończy się: **`→ MASTER: GOTOWE`** (preferowane) lub legacy **`→ MASTER: master`** · **bez** prośby do Macieja o oglądanie.

---

## [2026-07-06] UI → Design · **ODPOWIEDŹ IMP-01 Moc** (mockup v1 korekta)

Design pytał o panel Moc — mockup v1 z **6 filarami** ≠ silnik.

**Odpowiedź kanon:** `docs/ux/ODPOWIEDZ-DESIGN-IMP-01-MOC-2026-07-06.md`  
**Wklejka Maciej → Design:** `docs/ux/WKLEJKA-DESIGN-ODPOWIEDZ-MOC-MACIEJ-2026-07-06.md`

Skrót: slide-in **420px** · **9 składników tabeli** (nie 6 filarów) · ranking TAK · trend ▲/▼ **NIE** · reszta B-P0 portować niezależnie.

---

**Trigger:** `UI-RAPORT-DO-PRZODU-2026-07-05.md` punkt **A2/7**  
**Mockup:** `The Game - C09 Karty jednostek v2 (1E).dc.html`

**Wpięte:**
- **`gra/src/ui/unitRecruitCard.ts`** — karty 1E (HP bar, staty, koszt, tematy cav/rng/inf/civ, scroll)
- **`gra/src/ui/cityPanel.ts`** — `renderPurchasableUnits` W4: chipy Skarb/Dostępne/Kolejka · siatka kart · kolejka rekrutacji

**tsc:** PASS (`gra/`)

**→ MASTER: GOTOWE** (Integrator F → robocza mapa)

---

## [2026-07-05 ~23:52] UI · **A1 W4 rekrutacja + zakładki wnętrza** ✅

**Trigger:** `UI-RAPORT-DO-PRZODU-2026-07-05.md` punkt **A1/7**  
**Mockup:** `Miasto Zakładki W4 v2 (1E).dc.html`

**Wpięte (`cityPanel.ts`):**
- **Rekrutacja W4** — tytuł + szczegóły · wskaźniki · karty C09 (patrz A2)
- **Zdrowie** — chipy = Razem/Plusy/Minusy · rozpiska SVG · szczegóły dc-card
- **Kultura** — pasek postępu W4 · chipy tier · rozpiska składników
- **Religia / Porządek** — layout W4 v2 (`appendW4PctMetricBlock`, `appendTabIndicators`, breakdown sekcje)

**Pozostaje poza scope:** emoji w niektórych dc-note (osobny batch emoji→SVG miasto)

**→ MASTER: GOTOWE** (Integrator F → robocza)

---

## [2026-07-05 ~23:55] UI · **A1 W4 rekrutacja + zakładki** ✅

**Trigger:** batch 7× · `UI-RAPORT-DO-PRZODU-2026-07-05.md` punkt **A1** · mockup `Miasto Zakładki W4 v2 (1E).dc.html`

**Domknięcie polish W4 w `cityPanel.ts`:**
- Rekrutacja: `withW4TabCard` · chipy Skarb/Dostępne/Kolejka · katalog C09 · kolejka `unit-w4-card` + medalion infografiki
- Porządek: `appendW4PctMetricBlock` (Sz/Prawo/Porządek łącznie + banner stanu)
- Zdrowie / Kultura / Religia: `appendW4SignedBreakdownSections` (nagłówki `civ-w4-subhd`, Na plus/minus jak mockup)
- `appendW4PctMetricBlock` — opcjonalny `afterBar` (banner Porządku bez pustej rozpiski)

**Pliki:** `gra/src/ui/cityPanel.ts` · **NIE** `main.ts`  
**Warstwa:** 🟢 izolowana · **tsc:** OK

**→ MASTER: GOTOWE**

---

## [2026-07-05 ~23:55] UI · **A2 Karty C09 rekrutacja** ✅

**Trigger:** batch 7× punkt **A2** · mockup `C09 Karty jednostek v2 (1E).dc.html`

**Stan:**
- `gra/src/ui/unitRecruitCard.ts` — karty C09 (nagłówek · HP · staty · Rekrutuj) · infografika w medalionie
- `cityPanel.ts` → `buildUnitRecruitCard` + hover `buildUnitDetailCard`
- **tsc:** `el<K>()` zamiast `as HTMLDivElement` — typy wyrównane

**Warstwa:** 🟢 izolowana · **NIE** `main.ts`

**→ MASTER: GOTOWE**

---

## [2026-07-05 ~23:55] UI · **A7 Infografiki 1E — rekrutacja** ✅

**Trigger:** batch 7× punkt **A7** · `jednostki-infografiki-1E.html`

**Wpięcie (domknięcie):**
- `unitIconHtml` → `unitInfographicSvg` (fallback brand-book)
- `unitMedallionHtml` — kolejka rekrutacji W4 + tooltip szczegółów
- Katalog C09: `unitInfographicSvg` w `unitRecruitCard` (już było)
- Hover rekrutacji: medalion w `buildUnitDetailCard`

**Pliki:** `gra/src/ui/unitInfographic.ts` · `cityPanel.ts` · `unitRecruitCard.ts`  
**Warstwa:** 🟢 izolowana

**→ MASTER: GOTOWE**

---

## [2026-07-05 ~23:50] UI · **A7 Jednostki infografiki 1E** ✅

**Trigger:** `UI-RAPORT-DO-PRZODU-2026-07-05.md` punkt **A7/7** · `jednostki-infografiki-1E.html`

**Wpięte:**
- **`gra/src/ui/unitInfographic.ts`** — 18 sylwetek SVG (Poziom B) + klasy bojowe · `unitInfographicSvg` · medalion · CSS
- **`gra/src/ui/icons/brandAssets.ts`** — `unitIconSvg` → infografiki 1E (fallback plik brand-book)
- **`gra/src/ui/unitRecruitCard.ts`** — karty C09: ikona infografiki · podtytuł klasa + sylwetka
- **`gra/src/ui/cityPanel.ts`** — hover szczegółów (medalion) · rekrutacja bez podglądu 3D
- **`gra/src/ui/unitPanelHud.ts`** · **`armyStackHud.ts`** — medalion z nazwy jednostki

**Źródło:** `docs/ux/claude-design/jednostki-infografiki-1E.html`  
**Warstwa:** 🟢 izolowana · bez `main.ts`

**→ MASTER: GOTOWE** (Integrator F → robocza)

---

## [2026-07-05 ~23:55] UI · **A1 W4 rekrutacja + zakładki** ✅

**Trigger:** `UI-RAPORT-DO-PRZODU-2026-07-05.md` punkt **A1** · mockup `Miasto Zakładki W4 v2 (1E).dc.html`

**Zrobione:**
- **Rekrutacja** — `withW4TabCard` + nagłówek „i szczegóły" + chipy (Skarb / Dostępne / Kolejka) + katalog `unitRecruitCard` (C09) + kolejka w karcie W4; duplikat kolejki ukryty w `renderProd` gdy aktywna zakładka Rekrut.
- **Porządek** — metryki W4 v2: `appendW4PctMetricBlock` (Szczęście / Prawo / Porządek łącznie) — pasek 8px gradient + składniki inline · banner stanu bez zmian.
- **Zdrowie** — chipy mockup (= Razem / Plusy / Minusy) · sekcja składników w stylu W4.
- **Kultura** — chipy Przyrost / Zasięg · pasek granic bez zmian logicznych.
- **Religia** — podsumowanie wierszem mockup (dominująca · % · Sz).

**Pliki:** `gra/src/ui/cityPanel.ts` (używa istniejącego `gra/src/ui/unitRecruitCard.ts`)  
**Warstwa:** 🟢 izolowana · **NIE** `main.ts` · **NIE** `gra-robocza/`  
**Test lane:** `npx tsc --noEmit` w `gra/` → **EXIT:0**

**Pozostaje (poza A1):** pełny port C09 infografik per jednostka (A2) · produkcja budowy nad rekrutacją (stary pasek `cs-prod`) — osobny temat.

**→ MASTER: GOTOWE** (batch A1/7 · czeka build F)

---

## [2026-07-05 ~23:45] UI · **A4 POLE-BITWY v4.1** (Strategia + Roster + Deployment) ✅

**Trigger:** `UI-RAPORT-DO-PRZODU-2026-07-05.md` punkt **A4** · handoff `DESIGN-do-UI_POLE-BITWY-poprawki-v4.1.md`

**Zakres (mockupy v4.1):**
- **Strategia v4** — popup 1E: dropdowny `.sel1e`, mini-medaliony K/Ł/P, scroll + sticky „Skopiuj z priorytetów armii", checkbox złoty, nagłówek Georgia
- **Roster lewy v4 (C09)** — panel 368px, siatka 6 kol, filtry/chipy, nagłówki **`Grupa N · liczba`** (podpis), placeholdery pustych slotów w ostatnim rzędzie
- **Deployment v4 (C06)** — top-bar cluster scalony (Ty · K/P/Ł · suma | miecze VS | suma · K/P/Ł · Wróg), miecz/tarcza ról, toolbar `.tbtn`, popupy Formacja/Konnica/Linie **34px**

**Pliki:** `gra/src/battle/battleHudTheme.ts` · `gra/src/battle/battleScene.ts`  
**Marker:** `POLE-BITWY-20260705-v4.1-A4` (title rosteru — weryfikacja po build F)  
**Warstwa:** 🟢 izolowana · **NIE** `main.ts` · **NIE** rebuild roboczej u lane

**Test lane:** `npx tsc --noEmit` w `gra/` · build POLE-BITWY = Integrator F

**→ MASTER: GOTOWE** (batch A4/7 · czeka build F → `Gra-podglad-POLE-BITWY.html`)

---

## [2026-07-05 ~23:45] UI · **A3 Popupy deploy v5** ✅

**Trigger:** `UI-RAPORT-DO-PRZODU-2026-07-05.md` punkt **A3** · handoff `docs/ux/claude-design/HANDOFF-Cursor-Popupy-Deploy-v5.md`

**Zrobione (domknięcie ~70% → v5 1E):**
- **Shell popupów** — karta 1E: gradient, obwódka 2px, cień, nagłówek Georgia (Formacja / Konnica+hełm / Linie / Taktyka)
- **Formacja** — 3 wiersze SVG+podpis · F3 „Machiny na skrzydłach" · `paintDeployPopupOption` + hover
- **Konnica** — toolbar hełm GAP-04 · popup: oskrzydlenie + okrążenie · podpisy Z boku / Z tyłu
- **Linie** — layout mockup: Piechota | 1·2·3 + separator + **Dystansowe** | 1·2·3 (domyślnie 3) · chipy 34×34
- **Taktyka** — siatka 2×2 Obrona/Atak/Szturm/Ostrzał · ten sam popup w deploy i po SPACJA→RĘCZNY
- **Theme:** `applyDeployPopupShell1E` · `DEPLOY_LINES_MELEE_SVG` · `paintDeployLineNumber` · hover CSS

**Pliki:** `gra/src/battle/battleHudTheme.ts` · `gra/src/battle/battleScene.ts`  
**NIE ruszano:** `main.ts` · logika formacji/konnicy/doktryn/strategii  
**Marker:** `DEPLOY-POPUP-v5-20260705-A3`  
**tsc (`gra/`):** battle OK · pre-existing poza scope: `cityPanel.ts` · `unitRecruitCard.ts`

**→ MASTER: GOTOWE** (handoff Integrator F — batch POLE-BITWY UI · warstwa 🟢)

---

## [2026-07-05 ~23:40] UI · **A5 imp-* SVG w panelu budowy** ✅

**Zadanie:** A5 (5/7) z `UI-RAPORT-DO-PRZODU-2026-07-05.md` — emoji → SVG `imp-*` w `buildModeHud.ts` (bez mockupu A-08 layout).

**Pliki:**
- `gra/src/ui/buildModeHud.ts` — lista ulepszeń: `improvementIconSvg()` @18px zamiast emoji
- `gra/src/ui/icons/brand/improvement-icon-map.json` — **NOWY** mapowanie klucz → `imp-*.svg`
- `gra/src/ui/icons/brandAssets.ts` — `improvementIconSvg()`
- SVG: `gra/src/ui/icons/brand/improvements/` (10×, już w src)

**Podmienione (17 typów w panelu → 10 unikalnych SVG):**

| Klucz gry | SVG | Uwaga |
|-----------|-----|-------|
| farma | imp-farm | |
| irygacja | imp-irrigation | |
| bydlo, owce, lama | imp-pasture | reuse do Design (imp-sheep/llama) |
| kopalnia | imp-mine | |
| kamieniolom | imp-quarry | |
| glinianka | imp-quarry | reuse do imp-clay |
| oboz_lowiecki | imp-outpost | reuse do imp-hunting-camp |
| wyrab, tartak | imp-lumber | tartak reuse do imp-sawmill |
| tarasy | imp-farm | reuse do imp-terrace |
| lodzie_rybackie | imp-fishing | |
| warzelnia_soli | imp-quarry | reuse do imp-salt |
| droga | imp-road | |
| posterunek | imp-outpost | |
| fort | imp-fort | |

**Bez zmian (poza scope A5):** banner 🔨 · Załóż miasto 🏛️ · cuda 🏛 · layout 240px.

**Warstwa:** 🟢 izolowana (UI lane) · `main.ts` bez zmian · typecheck lane OK.

**→ INTEGRATOR: GOTOWE** (batch A5 UI — wpięcie w następnym build ROBOCZA).

---


**B — Design (Maciej wysyła):** **NOWA wklejka pełna** → [`docs/ux/WKLEJKA-DESIGN-B-P0-PELNE-MACIEJ-2026-07-06.md`](../docs/ux/WKLEJKA-DESIGN-B-P0-PELNE-MACIEJ-2026-07-06.md) · spec [`DESIGN-ZLECENIE-B-P0-PELNE-2026-07-06.md`](../docs/ux/DESIGN-ZLECENIE-B-P0-PELNE-2026-07-06.md) · GAP HTML: A08, HEX, IMP-01, POLE-BITWY

**A — lane batch 7×:** ✅ **`→ MASTER: GOTOWE-ROBOCZA-A-BATCH`** · publish Master ~23:55  
**Handoff:** [`UI-do-MASTER_batch-A1-A7-2026-07-05.md`](_handoff/UI-do-MASTER_batch-A1-A7-2026-07-05.md)  
**Robocza stempel:** `ROBOCZA · 2d9fc522 · 23:52` · plik md5 `8dd89c81…`  
**POLE-BITWY:** md5 `057b028c…` · marker `POLE-BITWY-20260705-v4.1-A4`  
**Hub:** `gra-robocza/START.html` · Ctrl+F5 · playtest §3 (`UI-do-MASTER_publish-robocza-2026-07-05.md`)

**UPGRADE (wcześniejszy publish):** w bundlu A1–A7 · test 28/28 · GitHub niecommitowany

---

## [2026-07-05 ~23:45] UI · **A6 — C12 Koniec bitwy v2 (dopolerowanie 1E)** ✅

**Trigger:** batch lane UI 7× · punkt A6 z [`UI-RAPORT-DO-PRZODU-2026-07-05.md`](UI-RAPORT-DO-PRZODU-2026-07-05.md)  
**Mockup:** `docs/ux/claude-design/The Game - C12 Koniec bitwy v2 (1E).dc.html` *(v3 czeka u Design)*

**Zrobione (`endScreen1E.ts`):**
- Tło C12: radial-gradient 1E + inset vignette (`#080a12`)
- Nagłówek: tytuł **82px** Georgia + glow · ornament ◆ (zamiast gołej linii podtytułu)
- Karty statystyk **230px**, wyśrodkowane · kolory `#8fb6e0` / `#e08a8a` / złoto
- Bohater bitwy: ikona SVG z mockupu (nie duplikat wieńca)
- Przyciski jak C12 v2: **Szczegóły** (outline transparent) · **Powrót do mapy →** (primary złoty 17px)
- Replay: link tekstowy nad przyciskami (gameplay — brak w mockupie v2)
- Stopka brand: `The Game · C-12 Koniec bitwy · 1E`
- Porażka: tytuł czerwony + glow (mockup tylko zwycięstwo)

**Pliki:** `gra/src/battle/endScreen1E.ts` · **NIE** `main.ts`  
**Warstwa:** 🟢 izolowana (tylko overlay końca bitwy)  
**Integrator:** wpięcie w `battleScene.ts` już jest — batch F po domknięciu A1–A7

**→ MASTER: GOTOWE** (A6/7 · czeka batch F)

---

## [2026-07-05 ~23:45] UI · **A2 — C09 Karty jednostek v2 w rekrutacji** ✅

**Zadanie:** UI-RAPORT-DO-PRZODU §A punkt 2 · mockup `The Game - C09 Karty jednostek v2 (1E).dc.html`

**Zrobione:**
- Nowy helper `gra/src/ui/unitRecruitCard.ts` — karta C09 (infografika 1E, klasa bojowa, pasek HP, staty, koszt, Rekrutuj, motywy kawaleria/łucznicy/piechota/cywil)
- `cityPanel.ts` — zakładka Rekrutacja (`renderPurchasableUnits`) używa siatki kart z hover → `buildUnitDetailCard` zamiast `item-row` tekstowego
- CSS wstrzyknięty przez `UNIT_RECRUIT_CARD_CSS` w `ensureStyles()`

**Pliki:** `gra/src/ui/unitRecruitCard.ts` (nowy) · `gra/src/ui/cityPanel.ts` (rekrutacja + CSS)

**Warstwa:** 🟢 izolowana (tylko UI lane, zero `main.ts`)

**Test lane:** `npx tsc --noEmit` PASS

**→ INTEGRATOR: GOTOWE** — wpięcie wizualne; brak zmian silnika · integracja z infografikami A7 (`unitInfographicSvg`)

---

## [2026-07-05 ~23:05] UI + EKO · **UPGRADE + ikony Design w ROBOCZA** ✅

**Handoff:** `_handoff/EKONOMIA-do-MASTER_upgrade-2026-07-05.md`  
**UI:** `cityPanel.ts` — ↗ upgrade · ikony `gra/src/ui/icons/brand/buildings/` (35×, commit GitHub `a8bd515`)  
**Bundel:** md5 **`eac24a66`** · grep „Rozbuduj" + `bld-port_wielki` OK  
**→ MASTER: GOTOWE-ROBOCZA** · playtest miasto/produkcja · kanon HOLD

---

## [2026-07-05 22:49] UI · W4 Porządek + Praca + publish `05b74463` ✅

**Trigger:** Maciej — domknięcie brakujących elementów W4 (nie raporty, kod w grze).

**Zrobione:**
- Porządek: banner W4 (`civ-w4-order-banner`) z ikonami SVG zamiast emoji (Spokój/Napięcie/bunt/rebelia)
- Praca: pasek 70/30 W4 (gradient złoto/niebieski), suwak w `.praca-w4-sliders`
- Pasek porządku `.or-bar` — wysokość 8px jak mockup
- Handoff: `dyspozycje/_handoff/UI-do-MASTER_stan-design-vs-robocza_2026-07-05.md`
- Publish ROBOCZA: pieczętka **`05b74463`** · smoke OK · START.html zsynchronizowany

**Playtest (Maciej):** Ctrl+F5 → `gra-robocza/START.html` → zakładki **Porządek** i **Praca** w panelu miasta.

**→ MASTER: GOTOWE** (robocza opublikowana; kanon po Opus — Integrator)

**Trigger:** Maciej — nowa paczka `POLE-BITWY-poprawki-v4.1.zip` + `Strategia.zip`  
**Design:** `MELDUNEK-POLE-BITWY-v4.1.md` · `POPRAWKI-TODO.md`

**Zrobione:**
- Ikony typów 1:1 mockup: podkowa (gwoździe) · skrzyż. miecze · łuk — Strategia + roster + top-bar
- Top-bar cluster scalony: `Ty 20·60·30·110` | miecze VS | `20·60·30·110 Wróg` · oś `50%+34px`
- Miecz/tarcza ról + VS — SVG outline z mockupu Deployment v4.1
- Popup Formacja/Konnica/Linie/Taktyka — minHeight 34px (wyrównanie ze Strategią)

**Pliki:** `battleHudTheme.ts` · `battleScene.ts`  
**Marker:** `POLE-BITWY-20260705-v4.1-komplet`  
**MD5:** `e3ac91ae5ed39e5d3cee8cbf590bf564` · root + `gra-kanon/` + `gra-robocza/`

**→ MASTER: GOTOWE** (playtest Ctrl+F5 POLE-BITWY · top-bar · Strategia · popupy toolbaru)

---

**MD5:** `253c91bc916fa193d6d778c71cdabab08` · `gra-kanon/Gra-podglad-POLE-BITWY.html`  
**Marker:** `POLE-BITWY-20260704-poprawki-v4.1` · Maciej playtest OK

---

## [2026-07-04 ~23:15] UI · **POLE-BITWY poprawki v4.1** ✅

**Scope:** P0 Strategia 1E + P1 skin + fix grupowania deploy + top-bar oś VS  
**Pliki:** `battleScene.ts` · `battleHudTheme.ts`  
**Marker:** `POLE-BITWY-20260704-poprawki-v4.1`  
**MD5:** `253c91bc916fa193d6d778c71cdabab08` · `Gra-podglad-POLE-BITWY.html` (root, build roboczy)

### P0 — Popup Strategia (1E)
- Custom dropdowny złote (`createBattlePriorityDropdown1E`) — medaliony K/Ł/P, chevron SVG
- Stała wysokość + scroll w popupie; sticky „Skopiuj z priorytetów armii”
- Checkbox 1E (`applyBattleCheckbox1E`)

### P1 — skin
- Nagłówki grup: `Grupa N · liczba` (jedna linia)
- Puste sloty w siatce rosteru (`createRosterEmptySlotElement`)
- Top-bar cluster: Ty ← oś skrzyżowanych mieczy → Wróg; miecz=atakujący, tarcza=obrońca

### UNITS (deploy UX — ten sam batch)
- Klik żeton/karta = jednostka (nie cała grupa); nagłówek grupy = cała grupa
- Ctrl+LPM multi-select · Grupuj tworzy podgrupę
- Rozgrupuj = wycofuje tylko zaznaczone (nie całą grupę); zachowuje zaznaczenie

**→ MASTER: GOTOWE** (playtest Macieja: Ctrl+F5 POLE-BITWY · Strategia deploy+R · split konnicy)

---

## [2026-07-04 ~22:20] MASTER · **APPROVE + KANON** · POLE-BITWY Design v4 ✅

**Komenda Macieja:** `master POLE-BITWY`  
**Review:** APPROVE (skin 1E · scope lane OK · bez regresji logiki)  
**Opus:** pominięty (review w hubie, jak roster-6)  
**Promocja:** `Gra-podglad-POLE-BITWY.html` → `gra-kanon/` + `gra-robocza/`  
**MD5:** `ea54bf61d9105f2cde3484d74c2cfc72` · marker `POLE-BITWY-20260704-design-v4`  
**NIE zmieniono:** `Gra-podglad.html` (kanon główny)

**Playtest:** Ctrl+F5 `gra-kanon/Gra-podglad-POLE-BITWY.html`

---

## [2026-07-04 ~22:15] **→ MASTER: GOTOWE** · POLE-BITWY port Design v4 (skin 1E)

**Trigger:** Maciej `start POLE-BITWY` · handoff `MASTER-do-UI_pole-bitwy-design-1E-2026-07-04.md`

**Zrobione (skin only, bez logiki walki):**
- `battleHudTheme.ts` — tokeny v4: `.tbtn`, `.rail-b`, karty C09, panel roster, minimapa, pasek mocy
- `battleScene.ts` — top bar pill · pasek mocy 12px + „Ostatnie starcia" · rail 56px · toolbar deploy · roster lewy · karty HP+morale · minimapa złota obwódka
- **Marker buildu:** `POLE-BITWY-20260704-design-v4` (title rosteru — weryfikacja Ctrl+F5)
- **Build:** `npx vite build --config vite.oblezenie-bitwa.config.ts` → `Gra-podglad-POLE-BITWY.html` ✅

**Testy:** build POLE-BITWY OK · `battle-smoke` = dist/index.html (main kanon, nie pole) — bez regresji lane

**Playtest Macieja:** Ctrl+F5 `Gra-podglad-POLE-BITWY.html` · porównaj z C06/C09 v4 · marker w title rosteru

**NIE publikuj kanonu głównego** — po OK Macieja: **`master POLE-BITWY`** → Opus → Master

---

## [2026-07-04 ~21:34] **→ MASTER: GOTOWE** · C-01 pre-bitwa sync sign-off ✅

**ZLECENIE:** `C01-v3-sync-kanon` · Design meldunek sign-off  
**Wynik:** **SYNC OK** — mockup v3 = kanon `preBattle.ts` (31868e6c…) · **lane NIE portuje**  
**Plik:** `docs/ux/claude-design/C-01 sync gotowy — meldunek sign-off..md`  
**Referencja zamrożona:** `The Game - C01 Pre-bitwa v3 (1E).dc.html`  
**Uwaga:** C-06/pole = osobno (`POLE-BITWY-HUD-v4` — czeka port UI)

---

**Spec:** `docs/ux/DESIGN-SPEC-POLE-BITWY-HUD-v4-2026-07-04.md` · wklejka zaktualizowana  
**Design:** praca w toku · **lane UI STOP** do ZIP

---

**Maciej:** Hak 1 OK · Hak 2 **A** · paczka 1 pole+roster · oblężenie później  
**Design:** START · wklejka `WKLEJKA-DESIGN-START-POLE-BITWY-HUD-v4.md` (uzupełniona o doprecyzowania)  
**UI lane:** STOP port do ZIP `POLE-BITWY-HUD-v4-2026-07-04`

---

## [2026-07-04 ~21:00] **→ MASTER: GOTOWE** · POLE-BITWY krok 1 — review pack (przed Design v4)

**Trigger:** MASTER werdykt workflow — najpierw review PNG/HTML jak A-06, dopiero potem Design.

**Deliverables:**
- `docs/ux/export/C-POLE-BITWY-review-3stany.html` — deploy / AUTO / R+roster (wireframe z kodu)
- `docs/ux/export/C-POLE-BITWY-review-stary-vs-kod.html` — C06 v3 + C09 v2 **przestarzałe** vs kod
- `docs/ux/export/C-POLE-BITWY-REVIEW-MACIEJ.md` — checklist Hak 1+2 (linki uzupełnione)

**NIE robione (celowo):** Design v4 · port skin · zmiany `battleScene.ts` · kanon design

**Maciej:** otwórz HTML + opcjonalnie Ctrl+F5 `Gra-podglad-POLE-BITWY.html` → werdykt jedną linią (Hak 2).

**Po werdykcie:** MASTER puszcza Design wg `WKLEJKA-DESIGN-START-POLE-BITWY-HUD-v4.md`

---

## [2026-07-04 ~14:55] **ZAMKNIĘTE** · A-06 — promocja kanon ✅

**Maciej:** OK · screenshot `docs/ux/export/A-06-panel-jednostki-1E-robocza.png`  
**MASTER:** md5 **`a8da1fcb1adc733e5d112c8768c52900`**

---

## [2026-07-04 ~14:40] **→ MASTER: GOTOWE** · A-06 panel jednostki / stos armii (1E)

**Trigger:** Maciej `start` — kolejka UX #4.

**Pliki:**
- `gra/src/ui/mapUnitHudSkin.ts` (nowy — wspólny skin 1E)
- `gra/src/ui/armyStackHud.ts` (live `.civ-army-stack`)
- `gra/src/ui/unitPanelHud.ts` (spójność typów + fallback panel [H])

**Zmiany 1E:**
- Tokeny brand (`--civ-*`), gradient panelu, Georgia nagłówki, stat-chipy złote
- SVG zamiast emoji w chrome: `tb-army`, `ui-menu`, `ui-close`
- Przyciski: `mu-gold-btn` / `mu-muted-btn` / outline Rozdziel·Połącz
- Zero emoji w UI lane (ikony jednostek z silnika bez zmian)

**Nie ruszane:** `main.ts` · logika stosu / akcji.

**Build:** OK · robocza md5 `5cb7ab486df657a460934d8e5c80b5ed`

**Playtest:** klik własnej jednostki na mapie → dolny panel stosu. Po OK Macieja: **`master`**.

**→ MASTER: GOTOWE**

---

## [2026-07-04 ~14:37] **ZAMKNIĘTE** · E-15 — promocja kanon ✅

**MASTER:** `publish-kanon-snapshot.ps1` · md5 **`2ebc4ee5fe907075de89dd75d18f8347`**

**Archiwum:** `gra-kanon_20260704-143703` (`c10c7e85…`)

---

## [2026-07-04 ~15:35] **→ MASTER: GOTOWE** · E-15 — lane zamknięty · playtest **ODŁOŻONY** (Maciej)

**Decyzja Macieja:** gra jeszcze niegrywalna (brak realnej wygranej/przegranej) → **bez playtestu E-15 teraz**. Ocena wizualna **później**, gdy warunki końca gry będą osiągalne.

**Lane UI:** implementacja **wykonana** — traktuj jako **GOTOWE do kanonu** (bramka techniczna OK).

**Plik:** `gra/src/ui/victoryScreen.ts` · mockup 1E win + E-15b lose.

**Testy:** `victory-screen-test.cjs` **11/11** · robocza md5 `83ea8d99ffe1952f33c8d25d5ce146e8`.

**MASTER:** promocja kanonu gdy hub gotowy (`master`) — **bez** czekania na playtest Macieja.

**→ MASTER: GOTOWE**

---

## [2026-07-04 ~15:00] **→ MASTER: GOTOWE** · E-15 ekran końca gry (1E cinematic)

**Trigger:** Maciej „3 E-15" — kolejka UX #3.

**Plik:** `gra/src/ui/victoryScreen.ts` — pełnoekranowy layout 1E (win + lose E-15b).

**Zgodność mockupów:**
- Wygrana: radial gold, laurel SVG, `ZWYCIĘSTWO` / `ZWYCIĘSTWO NAUKOWE`, karty stat (tura, epoka, power/tech, cywilizacja), CTA gold „Nowa gra".
- Porażka: radial red `#c84040`, tarcza+X, `KLĘSKA`, karty (tura, epoka, cywilizacja), CTA „Spróbuj ponownie".

**Nie ruszane:** `main.ts` · `game/victory.ts` · funkcje testowe (`formatVictoryTitle` itd.).

**Testy:** `node tools/victory-screen-test.cjs` → **11/11 PASS** · build OK.

**Robocza:** md5 `83ea8d99ffe1952f33c8d25d5ce146e8` · `gra-robocza/START.html`

**→ MASTER: GOTOWE**

---

## [2026-07-04 ~13:45] **→ MASTER: GOTOWE** · POLE-BITWY UI batch (Maciej OK)

**Trigger:** Maciej zatwierdził podgląd POLE-BITWY — prośba o wgranie do gry + handoff MASTER.

**Pliki:** `gra/src/battle/battleScene.ts` · `gra/src/battle/battleHudTheme.ts`  
**Handoff:** `_handoff/UI-do-SILNIK_pole-bitwy-ui-batch-20260704.md`  
**Build test:** `POLE-BITWY-20260704-roster-grid6` · `Gra-podglad-POLE-BITWY.html`

**Zakres:** pasek mocy (miecz/tarcza), toolbar deploy (kliknięcia), Taktyka/Strategia, roster 6×5 fill, zoom 2×, auto-grupy K/P/Ł na deploy.

**Lane NIE robi:** main.ts · kanon · Opus — czeka MASTER.

**→ MASTER: GOTOWE**

---

## [2026-07-04 ~13:40] **→ MASTER: GOTOWE-ROBOCZA** · P1 dyplomacja reskin 1E (final delta)

**Trigger:** Maciej „idź dyplo" · dyspozycja `MASTER-do-UI_P1-dyplomacja-1E-2026-07-04.md`

**Delta vs poprzedni meldunek (7e6566eb…):**
- `diploUiSkin.ts` — tokeny `--tg-*`, `civLeaderMedallionHtml` (hero audiencji)
- `diplomacyPanel.ts` — wiersze z pennantami + styl wojny (mockup lewa kolumna)
- `diploListHud.ts` — `.dl-war`, `dipCloseBtnHtml`
- `diplomacyAudience.ts` — layout hero 1E (medalion lidera, nastawienie, relacja)

**Pliki (backup `.bak-UI-2026-07-04-P1-dyplo`):** `diploUiSkin.ts`, `diplomacyPanel.ts`, `diploListHud.ts`, `diplomacyAudience.ts` · powiązane: `diplomacyNegotiationModal.ts`, `diplomacyTradeBasket.ts`, `diplomacyProposalBanner.ts`, `diplomacyPendingHud.ts`

**Reguły:** zero emoji · `tb-diplomacy` / `dip-*` / `civIconSvg` · bez `main.ts` / `diplomacy.ts`

**Test:** diplomacy-test **143/143** · vite build OK

**ROBOCZA md5:** **`4acbc7e31ad32e5e2c7fd944211552d0`**

**→ MASTER: GOTOWE-ROBOCZA**

---

## [2026-07-04 ~14:11] **→ MASTER: GOTOWE** · P1 dyplomacja 1E · **KANON opublikowany**

**Trigger:** Maciej `master`

**Kanon md5:** **`55bdb2af4f724f8a4f3da12e23156dc8`**

**→ MASTER: GOTOWE**

---

## [2026-07-04] **→ MASTER: GOTOWE-ROBOCZA** · P1 dyplomacja reskin 1E

**Trigger:** Maciej „idź dyplo" / P1 Dyplomacja

**Zakres wizualny (logika bez zmian):**
- `diploUiSkin.ts` — wspólny skin 1E (pennanty, tier badge, przyciski)
- `diploListHud.ts` — lista cywilizacji (mockup lewa kolumna)
- `diplomacyPanel.ts`, `diplomacyAudience.ts` — panel + audiencja
- `diplomacyNegotiationModal.ts`, `diplomacyTradeBasket.ts`, `diplomacyProposalBanner.ts`, `diplomacyPendingHud.ts`

**Reguły:** zero emoji · `tb-diplomacy` / `dip-*` / `civIconSvg` · Segoe UI + Georgia · bez `main.ts`

**Test:** diplomacy-test **143/143** · vite build OK

**ROBOCZA md5:** **`7e6566eb1257d2eb0306d918123af759`**

**Playtest Macieja:** mapa → toolbar uścisk dłoni → lista → klik cyw → audiencja → negocjacje

**MASTER:** po OK Macieja → `publish-kanon-snapshot.ps1`

**→ MASTER: GOTOWE-ROBOCZA**

---

## [2026-07-04 ~13:21] **→ MASTER: GOTOWE** · B-26 okolica Tier6 · **KANON opublikowany**

**Trigger Maciej:** gotowe elementy wgrywać od razu; MASTER — bramka + potwierdzenie kanonu.

**Delta vs kanon `7dfabe3a…`:**
- `ui/cityPanel.ts` — B-26: profile okolicy SVG (`field-*` + `chip-manpower`) zamiast emoji
- Pakiet miasto W3 + modale C-04/C-05/A-19 bez zmian logiki (już w src)

**Bramka lane:** okolica 32/32 · wire 34/34 · smoke · diplomacy 143 · koszary 21/21 · ⚠ logic 202/203 · combat 0/6 · battle-smoke FAIL (baseline)

**Kanon md5:** **`42efefffbcab5fd8b6ff4c07e862443d`** · archiwum `gra-kanon-archiwum/gra-kanon_20260704-132128`

**Handoff:** `_handoff/UI-do-MASTER_B-26-okolica-tier6-batch-2026-07-04.md`

**Maciej:** lista oceny tylko otwarte → `docs/ux/BACKLOG-OCENA-MACIEJ-2026-07-04.md` — **nie** prosić o B-26 / miasto W3.

**→ MASTER: GOTOWE** (kanon już wypchnięty — hub: potwierdź + wpis dziennika)

---

## [2026-07-04] **→ MASTER: GOTOWE** · miasto W3 playtest OK · **PROMOCJA KANON**

**Maciej:** panel miasto OK · reszta UX (bitwa, HUD mapy, menu) **później**

**Źródło kanonu (`gra/src/`):**
- `ui/cityPanel.ts` — exit pod surowcami miasta · okolica Ręczny · top-stack W3
- `ui/cityUxFrame.ts` — TOP_H 132 · hit-test góry
- `game/okolica.ts` — ręczny bez auto-fallbacku
- `main.ts` — `onOkolicaEnterManual` · focus bez resetu auto w reczny

**W pakiecie (bez diff tego dnia):** `hud.ts` is-city-view · modale `cityAttackChoice` / `siegeMapPanel` / `cityCaptureNotice`

**Backup:** `*.bak-UI-2026-07-04-promocja`  
**Handoff:** `_handoff/UI-do-MASTER_miasto-playtest-OK-promocja-2026-07-04.md`  
**Robocza md5:** **`0993be1929abc8e23c76b01e6f1ab7dd`**

**MASTER:** bramka testów → build → Opus (miasto) → `publish-kanon-snapshot.ps1` → root `Gra-podglad.html`

**→ MASTER: GOTOWE**

---

## [2026-07-04 ~10:46] **→ MASTER: GOTOWE-ROBOCZA** · panel heksu D17 + usunięcie legacy pill

**Handoff:** `_handoff/F-do-MASTER_sesja-2026-07-04-map-ui-units.md` (wspólny pakiet sesji)

**Pliki:**
- `ui/hexContextTooltip.ts` — plony rozbite, ulepszenia, hodowla/złoże
- `ui/sidePanelHud.ts` — style `.cp-yield-*`
- `main.ts` — usunięcie `#hud` 0/0, toast `#civ-hint-toast` (batch SILNIK)

**ROBOCZA md5:** `53ec508f48b7a9e13e152b1ba5d44644` · klik heks na mapie → panel boczny

**→ MASTER: GOTOWE-ROBOCZA**

---

## [2026-07-04] **→ MASTER: GOTOWE** · port UI modale mapy v2 (C-04/C-05/A-19)

**Design:** ✅ zip `C04-C05-A19-mapa-v2_2026-07-04.zip` · mockupy w `docs/ux/claude-design/`

**Lane UI (wykonane):** port wizualny · logika bez zmian
- `gra-robocza/src/ui/cityAttackChoice.ts` — C-04 · SVG · `#c87840` / `#3a6ad0`
- `gra-robocza/src/ui/siegeMapPanel.ts` — C-05 · panel prawy · Kontynuuj/Szturm/Odwrót
- `gra-robocza/src/ui/cityCaptureNotice.ts` — A-19 · modal centrum

**Build robocza:** md5 **`1503c9e040fe6354a4374f685163c5d9`** · `gra-robocza/START.html`

**Playtest Macieja:** wojsko przy mieście z murem → C-04 → Oblężaj → C-05 → Szturm / pusty garnizon → A-19

**→ MASTER: GOTOWE** · kanon STOP do OK playtestu

---

## [2026-07-04] **→ MASTER: GOTOWE** · Design modale oblężenia mapy v2 (C-04/C-05/A-19)

**Design:** ✅ 3× `.dc.html` (brand-book) · `DESIGN-do-UI_C04-C05-A19-v2.md`  
**Paczka:** u Macieja — sync do `docs/ux/claude-design/` (3 pliki modal + handoff już w repo docs)

**Lane UI (czeka `START lane`):** port wizualny · **bez logiki**
- `gra/src/ui/cityAttackChoice.ts`
- `gra/src/ui/siegeMapPanel.ts`
- `gra/src/ui/cityCaptureNotice.ts`

**Handoff:** `_handoff/DESIGN-do-UI_oblezenie-map-modals-v2-2026-07-04.md`  
**Kolory:** Oblężaj `#c87840` · Szturm `#3a6ad0` · zero emoji

**NIE ten tor:** C-19/C-20 pole bitwy → UNITS handoff osobno

**→ MASTER: GOTOWE** · kanon STOP do playtest Macieja

---

**Handoff:** `_handoff/MASTER-do-UI_statystyki-TW-jednostki-2026-07-03.md`

**Zmiana:** `cityPanel.ts` sekcja **Walka** — `meleeAttack`, `health`, `missileAttack`… zamiast legacy `Atak`/`Health`. Kanon md5 **`04d21f3087be8f4e85470ddad2335e70`**.

**Lane UI:** grep `u.Atak` w `ui/` · wiki/encyklopedia — te same nazwy co panel · **bez** zmian preBattle/HUD w tym batchu.

## [2026-07-03 ~22:45] **→ UI: INFO batch 2** — tooltip bitwy T + mapa plików

**Handoff:** `_handoff/MASTER-do-ALL-LANES_sync-TW-balans-2026-07-03.md` · tooltip/panel sceny T = `meleeAttack`/`meleeDefence`.

---

**Przyczyna:** playtest F ROBOCZA (Mapa/Wróć/Esc · okolica 3D · auto pól) nie trafił do Design — stary brief W3-miasto-1E.

**Handoff:** `_handoff/MASTER-do-UI-DESIGN_miasto-baseline-2026-07-03.md`  
**STOP:** `WYMIANA-UI-DESIGN.md` § STOP W3 · baseline **`153fcda2…`**  
**Lane:** **HOLD** portu miasta do ABC Macieja (A/B/C w handoff §7)  
**W4 v2 lane:** zmergowany w kanonie — **chrome mapy** czeka Design v3 lub lane A

**Decyzja Macieja Krok 3:** **A** — lane od kanonu/screenshotów (chrome Mapa/Wróć/Esc + okolica 3D) · Design **później**

**Tor A:** `_handoff/MASTER-do-UI_miasto-krok3-A-2026-07-03.md`  
**→ MASTER: CZEKA ABC Macieja** → **A przyjęte** · czeka `START lane A` lub lane meldunek

**Lane:** port Design kanoniczny `C01 Pre-bitwa v3 (1E).dc.html` → `gra/src/ui/preBattle.ts`

**Zmiany:**
- Pełnoekranowy overlay TW (vignette, VS, medaliony dowódców 84px — gotowe pod generałów)
- Roster: skalowalne kolumny `clamp(160px,14vw,220px)` · wiersze SVG (bez emoji)
- Panel centralny: „Bitwa o …", duży %, pasek niebieski/czerwony, chipy modyfikatorów
- Przyciski: Wycofaj · Rozegraj ręcznie · Atakuj — auto (copy v3)
- `battleHudTheme.ts`: PB_SVG commander + unit mini SVG

**Backup:** `preBattle.ts.bak-UI-C01v3-2026-07-03`

**Testy lane:** tsc OK · build — Master przed kanonem

**Playtest:** `Gra-podglad.html` → T lub atak wroga → pre-bitwa v3

---

## [2026-07-03] **→ MASTER: GOTOWE** — Grupa C batch 2 (A)

**Lane:** port Design KOMPLET — C-12 end · C-04/C-05 siege HUD · top 1E · cmd SVG · preBattle SVG

**Handoff:** `_handoff/UI-UNITS-do-MASTER_grupa-C-batch2-2026-07-03.md` · dyspozycja `MASTER-do-UI-UNITS_grupa-C-batch2-2026-07-03.md`

**Nowe pliki:** `siegeHud1E.ts` · `endScreen1E.ts`

**Testy lane:** combat **6/6** · vite build **OK**

**Tor C (hub):** `docs/ux/claude-design/The Game - Walka Hub Grupa-C (1E).dc.html` · `_handoff/UI-do-DESIGN_hub-walka-kafelki-2026-07-03.md`

**Tor D (A-08):** `_handoff/UI-do-DESIGN_A08-START-2026-07-03.md` — przekazane Design

**→ MASTER: GOTOWE** — tor B: bramka + kanon po komendzie **`master`** w hubie

---

## [2026-07-03] **DESIGN — GRUPA C KOMPLET** ✅

**Maciej:** C-05 v2 + domknięcie serii walki 1E (7 ekranów, zero emoji).

**Pliki Design (folder `docs/ux/claude-design/`):**
- C01 Pre-bitwa v2 · C02 Rozstawienie v2 · C06 Deployment v3
- C09 Karty jednostek v2 · C12 Koniec bitwy v2
- **C04 Oblezenie v2** · **C05 Szturm muru v2**

**Indeks + luka kod:** `docs/ux/GRUPA-C-DESIGN-KOMPLET-2026-07-03.md`

**Czeka decyzja Macieja (kolejna dyspozycja):**
- **A)** `START lane` — batch 2 port (C-04, C-05, C-12 full, C-06 v3 top, cmd SVG, C-01 SVG)
- **B)** `master` — dopiero po meldunku lane + bramka
- **C)** Design hub — kafelki Walka w Przeglądzie 1E
- **D)** A-08 ulepszenia (osobny tor P1)

**Lane nie rusza kodu bez START.**

---

## [2026-07-03] **DESIGN-C04** ✅ · **START C-05 Mur** (ostatni Grupy C)

**Maciej:** C-04 v2 zamknięty — `The Game - C04 Oblezenie v2 (1E).dc.html` (HUD oblężenia pola 3D: górny Ty VS Garnizon, lewy integralność murów 42%/wyłom, prawy katapulty/tarany/piechota, dół Ostrzał/Czekaj/Szturm).

**Uwaga mapowania:** Design C-04 = lane **C-19** (nie modal mapy lane C-04). Tabela: `docs/ux/DESIGN-MAPOWANIE-C04-C05-vs-lane.md`

**▶ Design — TERAZ (ostatni mockup Grupy C):**
- C-05 `The Game - C05 Mur v2 (1E).dc.html`
- Brief: `docs/ux/DESIGN-BRIEF-C05-mur-v2.md`
- Wklejka: `docs/ux/WKLEJKA-DESIGN-START-C05-mur.md`

**Lane port:** C-04 + C-05 Design → `battleScene.ts` + `siegeWall.ts` — czeka `START lane` / `master`.

---

## [2026-07-03] **DESIGN-C12** ✅ · **START C-04/C-05** oblężenie

**Maciej:** C-12 v2 zamknięty — `The Game - C12 Koniec bitwy v2 (1E).dc.html` (wieniec, ZWYCIĘSTWO Georgia, 3 karty strat/łupy, Bohater bitwy, Szczegóły / Powrót do mapy).

**Lane UI (batch 2, nie blokuje Design):** port pełnego C-12 do `battleScene.ts` — czeka na `START lane` od Macieja (kanon batch 1 = uproszczony end screen).

**▶ Design — TERAZ:**
- C-04 `The Game - C04 Atak miasto wybor v2 (1E).dc.html`
- C-05 `The Game - C05 Panel oblezenie v2 (1E).dc.html`
- Brief: `docs/ux/DESIGN-BRIEF-C04-C05-oblęzenie-v2.md`
- Wklejka: `docs/ux/WKLEJKA-DESIGN-START-C04-C05-oblęzenie.md`

**Potem:** C-19/C-20 mur — brief gotowy `DESIGN-BRIEF-C19-C20-mur-bitwa-v2.md` (START po C-05).

Lista: `DESIGN-START-LISTA-MOCKUPOW-C-WALKA.md` zaktualizowana (poz. 7 ✅ · 8–9 ▶).

---

## [2026-07-03] **→ MASTER: ACK** — pakiet W3 Batch 4 (Master hub `start`)

**Master:** md5 root = kanon = robocza = **`ce71d449e004d8068acfa8b7a5d3c9b1`** · bramka F powtórzona ✅ · manifest ROBOCZA zsynchronizowany  
**Kanon:** już opublikowany (Batch 4) — bez ponownej promocji · CUDA-G1 w bundle (grep `civ-wonders-picker`)  
**Maciej:** Ctrl+F5 `gra-kanon/START.html` — miasto W3 · sowa badań · Wiki dismiss

---

## [2026-07-03] **DESIGN-A08** — ikony ulepszeń + panel budowy (uzupełnienie listy) 📋

**Trigger Macieja:** „zapomnieliśmy o ikonach ulepszeń” — emoji w `buildModeHud.ts` vs 10 SVG w brand (niepodpięte).

| Brief | `docs/ux/DESIGN-BRIEF-A08-ulepszenia-ikony-i-panel.md` |
| Wklejka | `docs/ux/WKLEJKA-DESIGN-START-A08-ulepszenia.md` |
| W grze | A-08 · `buildModeHud.ts` · 16 typów · emoji |
| W brand | `gra/src/ui/icons/brand/improvements/` — 10× @24 · brak map JSON · brak 40px |

**Design:** ~6–8 nowych `imp-*` + `improvement-icon-map.json` + mockup panelu 1E (równolegle z C-06).

→ **DESIGN:** CZEKA (A-08) · lane UI port po deliverable

---

## [2026-07-03] **DECYZJA-C-kolory** — Ty niebieski / wróg czerwony ✅

**Mockup:** `The Game - C06 Deployment v3 (1E).dc.html` (poprawka Design)  
**Kanon:** `#3a6ad0` = Ty · `#c84040` = wróg · etykiety `ATK · Ty` / `OBR · wróg` · bez zielonego HP gracza  
**Doc:** `docs/ux/DECYZJA-C-kolory-stron-bitwa.md` · handoff `dyspozycje/_handoff/DESIGN-do-UNITS_kolory-stron-bitwa.md`  
**Kod dziś:** batch 1 lane **wdrożył** swap kolorów w `battleScene.ts` + `battleHudTheme.ts` → handoff `UI-UNITS-do-MASTER_grupa-C-1E-batch1-2026-07-03.md`

---

## [2026-07-03] **DESIGN-C06-v3** — Deployment + HUD pola (kolory poprawione) ✅

**Plik:** `docs/ux/claude-design/The Game - C06 Deployment v3 (1E).dc.html`  
**Zawartość:** pełny HUD fazy walki (góra, boki, dół, minimapa, panel zaznaczenia) + kolory Ty/wróg  
**v2:** zostaje archiwum deployment-only  
**Lane:** port + swap kolorów — **CZEKA** akceptacji Macieja

---

## [2026-07-03] **MASTER Batch 5** — KANON ✅ Grupa C 1E batch 1

**MD5:** `032ad48c6c4e1001e035ff24f456e4c4` · start: `gra-kanon/START.html` · bitwa: `Gra-podglad-BITWA.html`  
**Handoff:** `_handoff/UI-UNITS-do-MASTER_grupa-C-1E-batch1-2026-07-03.md`  
**Maciej:** Ctrl+F5 → **T** → deploy → koniec (Ty niebieski / wróg czerwony)

---

## [2026-07-03] **→ MASTER: GOTOWE** — Grupa C 1E batch 1 (zamknięte → Batch 5 kanon)

**Handoff zbiorczy:** `_handoff/UI-UNITS-do-MASTER_grupa-C-1E-batch1-2026-07-03.md`

| Obszar | Pliki |
|--------|-------|
| Theme 1E | `gra/src/battle/battleHudTheme.ts` **NOWY** |
| Bitwa | `battleScene.ts` — kolory Ty/wróg, deploy 1E, roster TW, koniec bitwy |
| Pre-bitwa | `preBattle.ts` — kolory ATK/OBR |
| Decyzja | `docs/ux/DECYZJA-C-kolory-stron-bitwa.md` |

**Testy lane:** combat **6/6** · vite build `/tmp/civ-dist` OK · **`main.ts` bez zmian**

**MASTER TODO:** Opus review → bramka pełna → promocja kanon → Maciej playtest **T** (BITWA)

**Batch 2 (po kanonie):** pasek komend SVG · top HUD v3 · preBattle SVG · A-08 ulepszenia

→ **MASTER: GOTOWE** — nie publikować kanonu z lane

---

## [2026-07-03] **IMPLEMENT-C-1E** — szczegóły techniczne (patrz handoff)

Pełna spec + lista mockupów + batch 2: `_handoff/UI-UNITS-do-MASTER_grupa-C-1E-batch1-2026-07-03.md`

---

## [2026-07-03] **DESIGN-C21** — Koniec bitwy **START** ▶

**Brief:** `docs/ux/DESIGN-BRIEF-C21-koniec-bitwy-v2.md`  
**Wklejka:** `docs/ux/WKLEJKA-DESIGN-START-C21-koniec-bitwy.md`  
**Deliverable:** `The Game - C21 Koniec bitwy v2 (1E).dc.html` (+ stany C-22 flash, C-23 szczegóły)

→ **Maciej:** wyślij wklejkę C-21 · kolory Ty/wróg wg `DECYZJA-C-kolory-stron-bitwa.md`

---

## [2026-07-03] **DESIGN-C09-units** — Karty jednostek (roster TW) ✅

**Plik:** `docs/ux/claude-design/The Game - C09 Karty jednostek v2 (1E).dc.html`  
**Rejestr lane:** **C-15 + C-16** (Design nazwa „C-09” ≠ pasek komend)  
**Zawartość:** roster 3 rzędy (konnica niebieska → piechota złota → łucznicy bursztyn) · separator · mini-karty HP · karta TW lewy dół · zaznaczenie niebieskie glow  
**Lane:** port `_buildRosterBar` + panel statystyk — **batch 1 ✅** → MASTER handoff

---

**Brief:** `docs/ux/DESIGN-BRIEF-C07-pole-HUD-v2.md`  
**Wklejka:** `docs/ux/WKLEJKA-DESIGN-START-C07-pole-HUD.md`  
**Deliverable:** `docs/ux/claude-design/The Game - C07 Pole HUD bitwy v2 (1E).dc.html`  
**Zakres:** C-07…C-12 (+ opcj. C-17 minimapa, C-18 tooltip)

→ **Maciej:** wyślij wklejkę C-07 · po mockupie akceptacja → lane port HUD w `battleScene.ts`

---

## [2026-07-03] **DESIGN-C06** — Deployment v2 ✅

**Design dostarczył:** `docs/ux/claude-design/The Game - C06 Deployment v2 (1E).dc.html`  
**Zawartość:** pole ATK/mgła · etykiety stref · panel F1–F3 SVG · Reset/Grupuj/Start walki 1E  
**Po Design → lane port `_buildDeployOverlay` (batch 1 ✅) · batch 2: top HUD v3**

---

## [2026-07-03] **DESIGN-C01-v2** — Pre-bitwa ✅

**Design dostarczył:** `docs/ux/claude-design/The Game - C01 Pre-bitwa v2 (1E).dc.html`  
**Zawartość:** Rzym vs Kapua · prognoza 68% · modyfikatory · Wycofaj / Rozegraj ręcznie / Atakuj-auto · SVG 1E  
**Lane UI:** port do `preBattle.ts` — **CZEKA** akceptacji Macieja (można po C-06 lub równolegle)

→ **Maciej:** po akceptacji C-01 → lane port preBattle

---

## [2026-07-03] **DESIGN-C-PAKIET** — master lista mockupów walki 📋

**Trigger Macieja:** zbierz mockupy → wyślij Design start.

| Dokument | Rola |
|----------|------|
| **`docs/ux/DESIGN-START-LISTA-MOCKUPOW-C-WALKA.md`** | **10 mockupów v2** + referencje + ikony + kolejność |
| **`docs/ux/WKLEJKA-DESIGN-START-C-WALKA.md`** | Tekst do skopiowania dla designera |
| `docs/ux/DESIGN-BRIEF-C-preBattle-faza1.md` | Brief szczegółowy C-01 |
| `dyspozycje/_handoff/UI-do-DESIGN_preBattle-faza1.md` | Handoff lane → Design |

**START Design:** `UI/Makieta-preBattle-v2.html` → potem deployment → HUD pole → ręczny → koniec → oblężenie → mur.

→ **DESIGN:** CZEKA · **MASTER:** po akceptacji mockupów per ekran

---

## [2026-07-03] **DESIGN-C01** — brief pre-bitwa Faza 1 (eksport do Design) 📋

**Trigger Macieja:** redesign UI bitwy — **najpierw pre-battle**, potem pole 3D.  
**Uwaga:** screenshot „FAZA ROZSTAWIANIA” = **C-06 deployment** (Faza 2), nie overlay C-01.

| Artefakt | Ścieżka |
|----------|---------|
| Brief Design | `docs/ux/DESIGN-BRIEF-C-preBattle-faza1.md` |
| Handoff Design | `dyspozycje/_handoff/UI-do-DESIGN_preBattle-faza1.md` |
| Mockup v1 (referencja) | `UI/Makieta-preBattle.html` |
| Kod (audyt, bez zmian) | `gra/src/ui/preBattle.ts` |

**Audyt lane:** kod ≈ mockup TW, ale **bez** tokenów 1E, **bez** pionowego paska mocy TW, emoji zamiast SVG, overlay = karta nie pełny TW.

**Następny krok:** Design → `Makieta-preBattle-v2.html` → Maciej ABC (Q-PB-1…3 w brief) → lane UI port → **MASTER** kanon.

→ **DESIGN:** CZEKA · **MASTER:** nie dotyczy (jeszcze)

---

## [2026-07-03] **→ MASTER: CZEKA** — pakiet W3 Batch 4 (eksport lane)

**Maciej:** `master` = dyspozycja do MASTER · lane **nie** publikuje kanonu.

**Handoff:** `dyspozycje/_handoff/UI-do-MASTER_w3-pakiet-2026-07-03.md`

### Skrót dla MASTER

| | |
|---|---|
| **ROBOCZA md5** | `ce71d449e004d8068acfa8b7a5d3c9b1` |
| **Pliki lane** | `cityPanel.ts`, `cityUxFrame.ts`, `cityOkolicaOverlay.ts`, `scienceOwlIcon.ts`, `scienceHubHud.ts`, `hudPanelDismiss.ts`, `wikiHubHud.ts`, `diploListHud.ts` |
| **main.ts** | toggle Wiki/Nauka (dismiss) — batch SILNIK/MASTER |
| **Bramka lane** | logic 203/203 · smoke · battle-smoke ✅ |
| **Akcja MASTER** | build → testy → `publish-kanon-snapshot.ps1` → DZIENNIK → dopiero potem Maciej Ctrl+F5 |

**Batche w pakiecie:** W3-full-lite · W3-rail-split · W3-layout-blue-border · W3-science-owl · HUD dismiss · (W3-DIM już w kanonie `2a786b9f…`)

⚠ Poprzedni agent lane **pomyłkowo** opublikował kanon — MASTER weryfikuje stan `Gra-podglad.html` vs robocza (patrz handoff §6).

→ **MASTER: CZEKA**

---

## [2026-07-03] **W3-science-owl** — ikona badań = sowa Design ✅

**Feedback Macieja:** widok badań powinien mieć sowę z materiałów Design; zamiast tego „biała plama” (stary inline SVG z fill + słowo „Nauka” w slocie ikony).

| Zmiana | Plik |
|--------|------|
| Sowa z brand-book `res-science-24.svg` | `icons/scienceOwlIcon.ts` |
| Chip Nauka w panelu miasta (W3 + legacy bar) | `cityPanel.ts` |
| Nagłówek hubu badań | `scienceHubHud.ts` |

Toolbar / HUD / drzewko tech dziedziczą tę samą sowę (już podpięte przez `scienceOwlIcon*`).

**Testy:** build robocza ✅ · smoke ✅ · `gra-robocza/START.html`

→ **MASTER:** master

---

## [2026-07-03] **W3-layout-blue-border** — rail produkcji + niebieska obwódka miasta ✅

**Feedback Macieja:** (1) miasto trudno znaleźć na mapie — niebieska obwódka jak zielona dla pól; (2) rail budowa/rekrutacja ma być **po prawej** panelu danych, nie przy lewej krawędzi ekranu.

| Zmiana | Plik | Efekt |
|--------|------|-------|
| Rail produkcji (2 ikony) | `cityUxFrame.ts` | `left: calc(32px + panel + detail-dock + 16px)` — obok prawej krawędzi lewego panelu |
| Hit-test UI | `cityUxFrame.ts` | `isPointOverCityPanelUi` + `getCityUxLayoutMetrics` — rail za panelem |
| Obwódka terytorium miasta | `cityOkolicaOverlay.ts` | `CITY_RANGE_OVERLAY_STYLE` — border niebieski `#66aaff` |
| Centrum miasta 3D | `cityOkolicaOverlay.ts` | `CITY_CENTER_OVERLAY_STYLE` — mocniejsza niebieska obwódka na heksie 🏛 |
| Mini-mapa okolicy SVG | `cityPanel.ts` | centrum: stroke `#66aaff`; legenda „Centrum miasta” |

**NIE ruszano:** `main.ts` · logika gameplay · prawy rail parametrów (7 ikon) bez zmian.

**Testy:** build robocza ✅ · `node tools/smoke.cjs` ✅ SMOKE OK · robocza `gra-robocza/Gra-podglad.html`

→ **MASTER:** master (Batch 3 kanon: W3-full-lite + rail-split + layout-blue-border + dismiss)

---

## [2026-07-03] **W3-DIM** — fix winiety mapy w panelu miasta ✅ → KANON

**Trigger:** Maciej BUG playtest · `Działaj!`  
**Fix:** `cityUxFrame.ts` — `#civ-ux-dim-full`: winieta radialna (środek jaśniejszy) zamiast 93% pełnoekran  
**md5 kanon:** `2a786b9f4f0ce934cd24eac5c434324a`  
**→ MASTER:** opublikowane · Maciej Ctrl+F5 + otwórz miasto

---

## [2026-07-03] **W3-full-lite** — chrome panelu miasta (CSS/layout) ✅

**Dyspozycja:** `UI.md` START W3-full-lite · mockup `brand-book/The Game - Ekran Miasto W3 (1E).dc.html`

### Co zrobiono

| Element | Plik | Efekt |
|---------|------|-------|
| Dim opaque pełnoekranowy | `cityUxFrame.ts` | `#civ-ux-dim-full` rgba(6,8,12,.93) + inset vignette |
| Dolny chrome mapy ukryty | `hud.ts` (już) + dim | minimapa/toolbar/sidePanel suppress przy mieście |
| Górny pasek W3 | `cityPanel.ts` | badge miasta + **4 chipy** (Żywność/Produkcja/Złoto/Nauka) + ✕ |
| Wiki | `hud.ts` (globalny) | bez duplikatu w panelu — z-index 404 nad dim |
| Rail **9/9** medalionów | `cityPanel.ts` | jeden lewy słupek 56px @ left 32 (budowa→religia) |
| Prawy rail | `cityUxFrame.ts` | `display:none` — zakładki scalone w lewy |
| Layout kolumn | `cityUxFrame.ts` | content od 118px · prawy panel zaokrąglony W3 |

**NIE ruszano:** `main.ts` · logika gameplay · treść zakładek (tylko chrome).

### AC

| Test | Wynik |
|------|-------|
| `npx vite build --outDir $TEMP\civ-dist` | ✅ |
| `node gra/tools/smoke.cjs` | ✅ SMOKE OK |
| Playtest robocza | `gra-robocza/START.html` · MD5 `9B609961317734673D881E1604E04A7D` |

**Pliki:** `gra/src/ui/cityPanel.ts`, `gra/src/ui/cityUxFrame.ts`

→ MASTER: master (Batch 3 kanon root po Opus: W-WIKI-1 + D16/D17 + W-WIKI-2 + W3-full-lite)

---

## [2026-07-03] **W3-rail-split** — przywrócenie 2 raili (produkcja | parametry) ✅

**Kontekst Macieja:** zasada sprzed merge mockupu — **lewo** budowa+rekrutacja, **prawo** spichlerz…religia (7). W3-full-lite błędnie scalił 9 ikon w jeden lewy rail.

| Rail | Zakładki | Kolumna treści |
|------|----------|----------------|
| Lewy (2) | budowa, rekrutacja | lewa — produkcja + katalog |
| Prawy (7) | spichlerz…religia | prawa — okolica + parametry |

Styl W3 medalionów 56px zachowany po obu stronach. **Pliki:** `cityPanel.ts`, `cityUxFrame.ts` · smoke OK · robocza zaktualizowana.

→ MASTER: master

---

## [2026-07-03] **W-WIKI-1** — Wikipedia HUD polish ✅

**Handoff:** `_handoff/MASTER-do-UI_wikipedia-polish.md` · **Maciej sign-off funkcji:** OK

### Checklist W-WIKI-1

| # | Zadanie | Status |
|---|---------|--------|
| 1 | `.b-wiki` — ten sam gradient/co Menu, akcent zielony, letter-spacing `.16em`, `.on` delikatny glow | ✅ |
| 2 | Panel — wzorzec science/diplo: `TOP_H=56`, `PANEL_W=340`, złota ramka, wiki tylko nagłówek/zakładki | ✅ |
| 3 | Tytuł panelu: ikona SVG + **Wikipedia** (bez emoji) | ✅ |
| 4 | Meta: **Skrót / Hasło / Pełny artykuł** (bez Wiki-S/M) | ✅ |
| 5 | `.wh-dtitle` ellipsis + mniejsze przyciski głębokości, flex-wrap | ✅ |
| 6 | Tabele MD w `.md-table-wrap` (scroll poziomy przy wąskim panelu) | ✅ |
| 7 | `--civ-wiki-accent` w `brandTokenVars.ts` | ✅ |
| 8 | Górny pasek widoczny w panelu miasta (z-index 404, Wiki klikalne) | ✅ |
| 9 | Bundle regen | ✅ 22 rozdz. + 130 haseł · ~708 KB |
| 10 | `node tools/smoke.cjs` | ✅ SMOKE OK |

**Pliki:** `hud.ts`, `wikiHubHud.ts`, `markdownLite.ts`, `brandTokenVars.ts`, `wikiBundle.json`  
**NIE ruszano:** `main.ts`, `mapToolbarHud.ts`, `minimapHud.ts`

**Screenshot opisowy (kanon po MASTER):** góra-prawo — chipy Epoka/Osiedla, przycisk **Wiki** (zielony akcent, ten sam korpus co Menu), **Menu**; po kliknięciu Wiki — lewy panel ~340px, złota ramka, nagłówek z ikoną książki + „Wikipedia”, zakładki Poradnik/Encyklopedia; w haśle encyklopedii pasek ← Lista + ellipsis tytułu + Skrót/Hasło/Pełny.

**Szerokość 340px** (nie 420): spójność z `scienceHubHud` / `diploListHud` — treść długa scrolluje w `.wh-content`.

→ **MASTER: master** (build kanon + MD5)

---

## [2026-07-03] **W-WIKI-2** — ikona Design `ui-wiki.svg` ✅

**Batch 1 (MASTER/Lane):** integracja ikony Wiki z Design szata-sync.

**Źródło SVG:** `brand-book/eksport/icons/ui-wiki.svg` (kanon Design) — w repo **z mockupu** `Ekran Miasto W3 (1E).dc.html` (pełny plik Design czeka na sync OneDrive zip).

**Pliki:**
- `gra/src/ui/icons/brand/tier5/ui-wiki-24.svg` · `ui-wiki-40.svg`
- `gra/src/ui/icons/brand/icons-manifest.json` — wpis `ui-wiki`
- `gra/src/ui/icons/wikiBookIcon.ts` — `brandIconSvg('ui-wiki')` + fallback
- `hud.ts` · `wikiHubHud.ts` — `wikiBookIcon(16)`, akcent `#a8c878` / `--civ-wiki-accent`

**Weryfikacja:** smoke OK · build roboczy → `gra-robocza/Gra-podglad.html` · MD5 `8A07DE8751BBB7BE617260C5AC6316FF`

**NIE:** `main.ts` · kanon root `Gra-podglad.html`

→ **Maciej:** Ctrl+F5 `gra-robocza/START.html` — Wiki obok Menu, ikona otwarta książka (2 strony)

→ **MASTER:** Batch 2 opcjonalnie (W3-full-lite) · potem Opus · Batch 3 kanon

---

## [2026-07-03] **W-WIKI** — dyspozycja Lane Wikipedia polish

**Maciej:** playtest OK · Wiki na górze obok Menu · treść Poradnik+Encyklopedia działa.

**Lane — batch W-WIKI-1 (READY):**  
Handoff: `_handoff/MASTER-do-UI_wikipedia-polish.md` · STAN: `UI-STAN.md` · dyspozycja: `UI.md` § W-WIKI-1

**Skrót zadań Lane:**
1. Dopasować `.b-wiki` do stylu Menu (W2 HUD)
2. Panel `wikiHubHud.ts` — spójność z science/diplo hub, bez emoji, PL w meta (Skrót/Hasło/Pełny artykuł)
3. Nie ruszać `main.ts` · nie wracać Wiki na toolbar/minimapę
4. Regen bundle po zmianach docs · smoke → meldunek → MASTER kanon

**Design (równolegle):** `_handoff/UI-do-DESIGN_wikipedia-hud-mockup.md` · WYMIANA § Wikipedia

→ **Lane UI:** START W-WIKI-1 (Composer) · **Design:** mockup + `ui-wiki.svg` (W-WIKI-2 po zip)

---

## [2026-07-03] **W2 HUD batch 2** — layout mockup `HUD Mapy layout (1E)` ✅

**Pliki:** `hud.ts`, `bottomBarHud.ts`, `minimapHud.ts`, `sidePanelHud.ts`, `mapToolbarHud.ts`  
**Zmiany:** pasek zasobów — floating chip góra-lewo · MOC — wiszący pendant góra-środek · epoka/menu góra-prawo · minimapa dół-lewo (280px, złota obwódka) · Wykonaj/Zakończ turę dół-prawo (złoty CTA) · Wydarzenia prawo · fix CSS syntax bug W2  
**Kanon:** MD5 `fd7c10bd96b3a249422bc280441dbac8` · smoke OK  
**Backlog mockup:** banery liderów (D) · panel kontekstowy jednostki (F) · okrągłe przyciski toolbar (B)

→ **Maciej:** Ctrl+F5 · nowa gra → mapa · porównaj z mockupem

→ **MASTER:** master

---

## [2026-07-03] **START paczka UI** — odbiór dyspozycji Macieja

**Treść:** menu hero · intro · HUD layout · ikony medalionów (bez zmiany ramek/JSON map).

**Weryfikacja Lane:**

| Punkt | Werdykt |
|-------|---------|
| 1–2 Menu/Intro | ✅ już w kanonie (W1-hero) |
| 3 HUD layout | 🟡 W2 batch 1 · **batch 2 = rozkład mockup** |
| 4 Ikony | ✅ brand-book = gra (MD5 match menu-emblem, epoch×3, civ×3, sett×6) |
| assets/*.png | ✅ w `gra/src/ui/assets/hero/` · brak w brand-book (inbox pusty) |

**Kanon:** `cae4010fedcbaaaf2d1cf6a33520a619` · smoke OK

→ **Maciej:** Ctrl+F5 · playtest całej paczki · jeśli HUD layout ≠ mockup → potwierdź W2 batch 2

→ **MASTER:** master (bez nowego buildu — brak diff kodu)

---

## [2026-07-03] **W3 panel miasta** — Etap 2 batch 2 ✅

**Plik:** `cityPanel.ts` (`STYLE_ID` → `civ-city-screen-css-w3`)  
**Zmiany:** tokeny brand 1E (`ensureBrandRootTokens`, `CIV_BRAND_SCOPE_VARS`) · zakładki drawer z ikonami cp-* / `res-settlements` (bez emoji) · nagłówek: `chip-star`, `res-population`, `menu-settings`, `cp-buildings`, `ui-close` · drawer/backdrop/header/btn-g — styl spójny z W1/W2  
**Zakres lite:** bez pełnego layoutu B-01 (vertical rail) — tylko tokeny + ikony + CSS refresh  
**Kanon:** MD5 `cae4010fedcbaaaf2d1cf6a33520a619` · smoke OK  
→ **Maciej:** Ctrl+F5 · nowa gra → klik miasto (drawer 45%) · zakładki Plony/Produkcja/Miasto/Okolica

→ **MASTER:** master

---

## [2026-07-02] **W2 HUD mapy** — Etap 2 batch 1 ✅

**Pliki:** `hud.ts`, `mapToolbarHud.ts`, `bottomBarHud.ts`, `minimapHud.ts`  
**Zmiany:** tokeny brand 1E (`#080a12`, złoto pergamin) · chipy z SVG Tier 1 · Moc = ikona `res-influence` · dyplomacja bez emoji (`tb-diplomacy`) · toolbar + dolny pasek + minimapa — styl brand  
**Kanon:** MD5 `13df8d80c17e9c491823790d6f53e19d` · smoke OK  
→ **Maciej:** Ctrl+F5 · nowa gra → mapa (górny pasek, lewy toolbar, WYKONAJ / Koniec tury, minimapa)

→ **MASTER:** master

---

## [2026-07-02] **infografik4 FULL SYNC** — cały eksport + mapy JSON ✅

**Problem Macieja:** nie podmienione najnowsze mapy (JSON + pełna biblioteka).  
**Przyczyna:** wcześniejszy sync tylko 13 SVG ręcznie · `setting-icon-map.json` Lane miał złe klucze (`map_size` vs Design `map-size`) · `icons-manifest.json` nieaktualny.  
**Fix:** pełny robocopy `infografik4` → `brand-book/eksport/` + `gra/src/ui/icons/brand/` (~250 SVG + 6 JSON + CSS).  
**setting-icon-map:** Design + aliasy kluczy gry (`map_size`, `city_states_count`…).  
**Kanon:** MD5 `f18cc37efc3a299cdcb39208ad39fa8a`  
→ **Maciej:** Ctrl+F5 · kreator krok 4 (wszystkie 6 ikon ustawień) · reszta brand bez zmian layoutu.

---

## [2026-07-02] **W1-hero** — tła PNG menu + intro kreatora ✅

**Assety:** `gra/src/ui/assets/hero/hero-menu.png`, `hero-intro.png` (~4 MB).  
**Kod:** `mainMenu.ts` — lewa kolumna menu + hero po prawej (gradienty 1E) · `newGameFlow.ts` krok 1 — full-bleed intro, emblemat gwiazda, CTA, **bez** akapitu opisu.  
**Kroki 2–5:** bez zmian.  
**Kanon:** MD5 `a1476d02afd8433866b257f025db6bcb` · start `gra-kanon/START.html`  
→ **Maciej:** Ctrl+F5 · menu główne · „Rozpocznij grę" → intro hero · kroki 2–4.

→ **MASTER:** master (kanon opublikowany).

---

## [2026-07-02] **infografik5** — hero PNG · ~~CZEKA ABC~~ ✅ W1-hero

**Zip:** `Ulepszenie infografik5.zip` · hero-intro + hero-menu (~4 MB PNG).  
**Archiwum:** `docs/ux/claude-design/01-propozycje-z-design/ekrany-hero/`  
**Lane:** nie wpięte — osobny batch (menu + intro tło).  
**Maciej:** A=wpiąć · B=mockupy `.dc.html` · C=pomiń.

→ **MASTER:** brak (czeka decyzja).

---

## [2026-07-02] **infografik4 + W1f + layout** — sync + kanon ✅

**Zip:** `Ulepszenie infografik4.zip` (+ ustawienia z infografik3).  
**Sync (tylko SVG w medalionach):** menu-emblem (intro gwiazda) · 3× epoch · Rzym scutum · Chiny mianguan · Sumer ziggurat · 6× `sett-*`.  
**Kod Lane:** `settingIconSvg()` · `newGameIntroEmblemSvg()` → menu-emblem · layout wyrównany kroki 2–4 (`newGameFlow.ts`).  
**Mapy JSON:** bez zmian (tylko pliki `.svg`).  
**Kanon:** MD5 `f26955a144d5b1058dc7da306ab9cf7e`  
→ **MASTER:** Maciej playtest Ctrl+F5 · kreator kroki 1–4.

---

## [2026-07-02] **W1b-rev6 Rzym** — Lupa Kapitolińska (Lane)

**Feedback Macieja:** ikona Rzymu zmieniona (scutum?) · ma być **symbol Rzymu** — wilk kapitoliński (+ ref SPQR/aquila).  
**Lane:** `civ-rzymianie.svg` → profil wilka + bliźnięta · ref w `referencje-maciej/W1b-rev5-rzym-*`.  
**Kanon:** MD5 `3676dd3925d82af911e130bf1b54fc73` · **Maciej:** Ctrl+F5 · krok 3 Rzymianie.

---

## [2026-07-02] **W1e-rev2** — playtest Macieja · Lane poprawka epok

**Feedback:** Brąz = nie wygląda jak miecz (za gruby, brak rękojeści) · Kamień = nieczytelny → **topór bojowy**.  
**Lane:** `epoch-kamien` = trzon + głowica toporu · `epoch-braz` = wąska liściasta głownia + jelec + rękojeść + jelec dolny.  
**Ref topór:** `referencje-maciej/W1e-rev2-topor-kamien-ref.png`  
**Kanon:** MD5 `6f9b034e5c3d8c03403e38d23b4eb591` · **Maciej:** Ctrl+F5 · krok 2.

---

## [2026-07-02] **Design zip2** sync — infografik2

**Zip:** `Ulepszenie infografik2.zip` (12:47) · 19 SVG (16 civ + 3 epoch).  
**Kanon:** MD5 `1424e71c91705cf3dd95305c3442c4b8`  
→ **Maciej:** Ctrl+F5 · kreator krok 2 (epoki) + krok 3 (Chiny, Rzym, Sumer).

---

## [2026-07-02] **Design sign-off W1e-rev** — epoki zweryfikowane wizualnie

**Design (Claude):** potwierdza dostarczenie · młot kamienny + miecz liściasty + żelazo bez zmian.  
**Lane:** już w kanonie (sync z zip 10:50) · MD5 `a3ea9863a5a0afb6e62357107979b787`.  
**Maciej:** jeśli playtest krok 2 OK → **ZAMKNIĘTE** (napisz „epoki ok”).

---

## [2026-07-02] **W1e-rev done** — epoki kreatora (Design zip 10:50)

**Trigger:** `Ulepszenie infografik.zip` (3 pliki · epoch-kamien + braz + zelazo).  
**Audyt:** ✅ Kamień = młot kamienny · ✅ Brąz = miecz liściasty · ✅ Żelazo bez zmian.  
**Kanon:** MD5 `a3ea9863a5a0afb6e62357107979b787`  
→ **Maciej:** Ctrl+F5 · kreator **krok 2** (3 karty epok).

---

## [2026-07-02] **W1b-rev5 Chiny** — mianguan cesarza (Lane)

**Feedback Macieja:** czapka cesarza Chin ≠ obecna ikona (stożek 3-stopniowy).  
**Ref:** `referencje-maciej/W1b-rev-chiny-mianguan-ref.png` (Qin Shi Huang · mianguan).  
**Lane:** `civ-chinczycy.svg` → płaska belka (mian) + frędle (liu) + czapka + pasek pod brodą.  
**Kanon:** MD5 `3e607fb109b1c5ad7bfbbc4ae3b546ea` · **Maciej:** Ctrl+F5 · kreator krok 3 Chiny.

---

## [2026-07-02] **Maciej OK** — W1b-rev4 Sumer **ZAMKNIĘTE**

**Playtest:** Sumerowie krok 3 — **akceptacja Macieja** („sumer ok”).  
**Kanon:** MD5 `6e2b20c4e69fd2ce468e41c67b956ab3` · ikona Design (tarasy + schody centralne).  
**Otwarte:** tylko **W1e-rev** (epoki krok 2) — **CZEKA Design**.

---

## [2026-07-02] **Design drop** — W1b-rev4 Sumer · W1e-rev **BLOK**

**Trigger Macieja:** `docs/ux/claude-design/Ulepszenie infografik.zip` + `civ-sumer.svg` (root)  
**Audyt zip (2026-07-02 09:49):**

| Plik | W zip | Werdykt |
|------|-------|---------|
| `civ-sumer.svg` (zip/eksport) | stary zarys 3-liniowy | ❌ zastąpiony plikiem z root |
| `civ-sumer.svg` (root, 10:35) | ziggurat tarasy + schody centralne | ✅ **sync → gra** |
| `epoch-kamien.svg` | namiot/kolumny | ❌ **W1e-rev NIE dostarczone** |
| `epoch-braz.svg` | ingot + trzon | ❌ **W1e-rev NIE dostarczone** |
| reszta zip | PACZKA FINAL (już w grze) | — bez zmian |

**Lane:** `gra/.../civilizations/civ-sumer.svg` ← Design root (W1b-rev4).  
**Kanon:** MD5 `6e2b20c4e69fd2ce468e41c67b956ab3` · `gra-kanon/START.html`  
→ **Maciej:** Ctrl+F5 · kreator krok 3 Sumerowie.

**Design CZEKA:** `START — W1e-rev` · handoff `UI-do-DESIGN_w1e-rev-epoch-kamien-braz.md`

---

## [2026-06-26] **W1b-rev + W1e done** — Sumer ziggurat + ikony epok kreatora

**Trigger Macieja:** paczka `docs/ux/claude-design/Ulepszenie infografik.zip`  
**Status:** **MASTER opublikował kanon** · MD5 `f8fb4a6bff560b5adde53a07cc5663c7`

| Plik | Zmiana |
|------|--------|
| `gra/.../brand/civilizations/civ-sumer.svg` | ziggurat (W1b-rev) |
| `gra/.../brand/epochs/` | epoch-kamien, braz, zelazo |
| `gra/.../brand/epoch-icon-map.json` | mapa kamien/braz/zelazo |
| `gra/src/ui/icons/brandAssets.ts` | `epochIconSvg()` |
| `gra/src/ui/newGameFlow.ts` | medaliony epok krok 2 (bez K/B/Z) |

→ **Maciej:** Ctrl+F5 · kreator: krok 2 epoki + krok 3 Sumerowie.

---

## [2026-06-26] **W1-menu + W2 done** — ikony menu + HUD Tier 1–2

**Trigger Macieja:** „nie czekaj — lecimy W1-menu + W2”.  
**Status:** **MASTER opublikował kanon** · MD5 `144450a09869c0b660cf9f73e39a3a03`

| Plik | Zmiana |
|------|--------|
| `gra/src/ui/icons/brand/menu/` | 30× SVG (menu-play, campaign, …) |
| `gra/src/ui/icons/brand/icons-manifest.json` | wpisy `menu-*` |
| `gra/src/ui/icons/brandAssets.ts` | `menuIconSvg()`, `brandMenuComponentsCss()` |
| `gra/src/ui/mainMenu.ts` | `menu-components.css` + ikony przycisków + `tg-btn-primary/outline` |
| `gra/src/ui/hud.ts` | emoji → `iconHtml` Tier 1 (res-food, work, treasury, …) + `ui-menu` |
| `gra/src/ui/mapToolbarHud.ts` | emoji → Tier 2 (tb-cities, diplo, army, build) |

**Fix build (MASTER):** trailing comma w `gra/data/wonders.json` (blokował vite).  
**NIE ruszano `main.ts`.**

→ **Maciej:** Ctrl+F5 · `gra-kanon/START.html` · menu główne + HUD/toolbar w grze.

**Osobno czeka Design:** W1b-rev (Sumer), W1e (epoki kreatora).

---

## [2026-06-26] **W1b done** — ikony cywilizacji (medaliony kreatora)

**Trigger Macieja:** zip W1b na dysku (`brand-book/Ulepszenie infografik.zip`).  
**Handoff:** `dyspozycje/_handoff/UI-do-MASTER_w1b-cyw-icons.md` · **GOTOWE**

| Plik | Zmiana |
|------|--------|
| `gra/src/ui/icons/brand/civilizations/` | 16× SVG (15 cyw. + default) |
| `gra/src/ui/icons/brand/civ-icon-map.json` | sync z Design |
| `gra/src/ui/icons/brandAssets.ts` | `civIconSvg()` |
| `gra/src/ui/newGameFlow.ts` | `.tg-medallion` + SVG zamiast monogramów liter |

**Kanon Design:** scalono `eksport/icons/civilizations/` + `civ-icon-map.json` z zipa (Wariant A).  
**Testy:** smoke + victory-screen — uruchomić przy `master`. **NIE ruszano `main.ts`.**

→ **MASTER:** build kanon · bramka · Opus.

---

## [2026-06-26] **W1 done** — PACZKA FINAL · brand-book w lane UI

**Trigger Macieja:** posprzątaj + W1.  
**Handoff:** `dyspozycje/_handoff/UI-do-MASTER_brand-book-w1.md` · **flaga GOTOWE**

| Plik | Zmiana |
|------|--------|
| `gra/src/ui/icons/brand/` + `brandAssets.ts` | Assety Design (~200 SVG/JSON/CSS) + API ikon |
| `gra/src/ui/icons/iconRegistry.ts` | Tier 1–2 z manifestu |
| `gra/src/ui/brandTokenVars.ts` | `tokens.css` FROZEN + aliasy civ |
| `gra/src/ui/mainMenu.ts` | Emblem, motion, tło menu |
| `gra/src/ui/cityPanel.ts` | Budynki/jednostki SVG zamiast emoji |

**Testy:** `victory-screen-test` 11/11 · `smoke` OK.  
**MASTER:** build → bramka 17 suitów → Opus → kanon. **NIE ruszano `main.ts`.**

---

## [2026-07-01] **START** — WYMIANA push GitHub · czeka START Design (tura 2)

**Poll:** 5 plików md + HANDOFF · brak eksport/ · brak zip inbox.  
**Git:** WYMIANA + DYSPOZYCJA + HANDOFF pushed → Design może czytać repo.  
**Maciej:** **START** u Claude Design.

---

**Trigger Macieja:** `START` (Cursor)  
**Protokół:** `docs/ux/claude-design/WORKFLOW-DUAL-START.md`

| Krok | Wynik |
|------|--------|
| pull-brand-book.ps1 | inbox pusty (brak zip — pierwszy export po turze 2) |
| poll | 4 pliki (tylko docs lane) · brak eksport/HTML |
| Paczka | `DYSPOZYCJA.md` ▶ START tura 2 (A/B/C) + export inbox |

**Maciej:** START u Claude Design (wklejka poniżej w WYMIANA).  
**Po turze Design:** ponowny START (Cursor) → pull zip → przygotuję tura 3 / W1b.

---

**Trigger Macieja:** `ok. Brand-book wdrażaj. potem przekaż do mastera.`  
**Handoff:** `dyspozycje/_handoff/UI-do-MASTER_brand-book-w1.md`  
**Slack outbox:** `docs/obieg/SLACK-OUTBOX-GRUPA-E-brand-book-w1-2026-06-26.md`

| Plik | Zmiana |
|------|--------|
| `gra/src/ui/brandTokenVars.ts` | Kanon ścieżka `brand-book/eksport/` |
| `gra/src/ui/mainMenu.ts` | *(prep)* tokeny 1B · outline 4C |
| `gra/src/ui/newGameFlow.ts` | Tokeny brand · zero emoji · monogramy |
| `gra/src/ui/victoryScreen.ts` | Panel 5C · przycisk outline · tokeny brand |
| `gra/src/ui/icons/iconRegistry.ts` | Tier 1–2 placeholder · ścieżka eksport Design |

**Testy lane:** `victory-screen-test` 11/11 · `smoke` OK · **NIE** `main.ts`  
**MASTER:** rebuild kanon (`showVictoryScreen` już wpięte w `main.ts`) · Opus przed publikacją  
**Defer W2:** SVG z `eksport/icons/` (sync OneDrive) · HUD chipy 6C · mockupy `01-wejscie/grupa-E/`

---

## [2026-06-26] **W1-PREP** Warstwa 1 — tokeny E · **→ MASTER: GOTOWE (prep)**

**Trigger:** Master sesja autonomiczna (Maciej offline ~2h)  
**Handoff:** `dyspozycje/_handoff/UI-do-MASTER_warstwa1-w1-prep-2026-06-26.md`

| Plik | Zmiana |
|------|--------|
| `gra/src/ui/brandTokenVars.ts` | **NOWY** — tokeny 1B/2C wspólne |
| `gra/src/ui/icons/iconRegistry.ts` | **NOWY** — Tier 1–2 placeholder SVG |
| `gra/src/ui/mainMenu.ts` | Złoto `#e8d88a`, Georgia, przyciski **4C outline** |
| `gra/src/ui/newGameFlow.ts` | j.w. + CTA start outline |

**Testy:** smoke OK · tsc UI pliki OK (repo ma pre-existing errors poza UI)  
**Bloker W1 pełny:** pliki Design w `brand-book-1E/eksport/` · game over → F  
**Lane UI:** czeka Design D1 → podmiana SVG · potem **`przekaż do Mastera`** W1

---

## [2026-06-30] **P4** — koszyk handlu/daru (PN) · **→ MASTER: GOTOWE**

**Handoff:** `dyspozycje/_handoff/CYWILIZACJE-do-UI_handel-koszyk-pn.md`  
**Warstwa:** 🟡 cross (audiencja + payload → Integrator F)  
**Decyzje:** D3-W1…W6b · żywność 1 PN = 1 · bez ulepszeń/budynków/hex land

### Zrobione
| Plik | Zmiana |
|------|--------|
| `gra/src/ui/diplomacyTradeBasket.ts` | **NOWY** — modal 2-kolumnowy handel + 1-kolumnowy dar; typy v1.0; podgląd PN/fair/nadmiar/+Zauf./dobra wola |
| `gra/src/ui/diplomacyNegotiationModal.ts` | Rozszerzony `NegotiationPayload` (`giveItems`, `receiveItems`, `isGift`, `givePn`, `receivePn`); kontekst koszyka |
| `gra/src/ui/diplomacyAudience.ts` | Wpięcie koszyka dla akcji `5` (handel) i `13` (dar); fallback `trustPnGainedThisTurn` = 0 |

### DoD checklist
- [x] Dwie kolumny handel (Rel ≥ 100) + sumy PN
- [x] Fair min + nadmiar + przewidywane +Zaufanie (limit/turę z katalogu)
- [x] Dobra wola preview (≥ 100 PN nadmiaru)
- [x] Osobny flow dar (akcja `13`, Rel ≥ 30, jedna kolumna)
- [x] Żywność: miasto + ilość, podpowiedź 1 PN = 1
- [x] Typy v1.0 zamknięte (bez ulepszeń/budynków/hex)
- [x] **NIE** `main.ts`
- [x] Typecheck — **0 błędów** w plikach P4 (repo ma pre-existing errors poza UI)

### Integrator F — wpięcie wymagane
1. `getState()` → `trustPnGainedThisTurn`, `progDarRelacja`, `relacjaTotal`
2. `getNegotiationContext(actionId)` → `cityOptions`, `zlozeOptions`, `unitOptions`, `tempoGry`
3. Akcja **13. Prezent/Dar** w `buildAudienceActions` (Rel ≥ 30) — UI gotowe, brak karty w JSON
4. Handler `handleNegotiatedProposal` — przekazać `giveItems`/`receiveItems`/`isGift` do `evaluateProposal`
5. Transfer zasobów po akceptacji (batch 2 dla tech/jednostka/surowiec jeśli brak)

**Testy lane:** manual per handoff § Testy UI (1–4) po wpięciu F.

---

## [2026-07-01] Lane UI — działaj (tokeny + poll Design)

**Zrobione:** `UI/design-tokens-brand-v1.css` · `gra/tools/poll-claude-design.mjs` · STATUS propozycji  
**Bloker:** brak plików w `01-propozycje-z-design/` i `01-wejscie/grupa-E/`  
**→ Maciej:** Brand Book → `docs/ux/claude-design/01-propozycje-z-design/brand-book/`

---

## [2026-07-01] Lane UI — pipeline UX START (działaj)

**Obieg:** 2026-06-30 · plik bieżący: `docs/obieg/UI-pipeline-ux.md`  
**Workflow:** mockupy clean-screen → Maciej Claude Design → `02-po-design/` → kod UI  
**Gotowe:** pipeline foldery · `00-kanon/BRAND-PROMPT.md` · STATUS-PIPELINE · RAPORT-WEJSCIE ×5 grup  
**Bloker:** **0/34** w `01-wejscie/` — czeka **Grupa E** (6 PNG → `01-wejscie/grupa-E/`)  
**Figma:** odstawiona · pierwsza grupa: **E** (8A)  
**→ Master:** informacyjnie · pełny handoff dopiero po pierwszym PO + gotowości wdrożenia

---

### [2026-06-26] **P-C3** — etykieta HUD **Moc** (broadcast)

**Decyzja Macieja:** PL **Moc**, EN **Power**; Wpływ wycofany.  
**Kod UI:** `gra/src/ui/power-labels.ts` · hud + overlay + kreator nowej gry.  
**Figma:** polskie mockupy — **Moc**, nie Power/Wpływ. Kontrakt: `_handoff/P-C3-moc-nazwa-KONTRAKT.md`

---

## Reguła meldunków — Figma redesign / Warstwa 1 (**OBOWIĄZKOWE**)

**Zakres:** wyłącznie makiet Figmy w pliku DS v1. **Nie** zastępuje `EKONOMIA-DO-MASTERA`, `SILNIK-DO-MASTERA`, playtestu ABC itd.

| Krok | Plik |
|------|------|
| Każdy POSTĘP / STOP / GOTOWE | `docs/ux/figma/grupa-{X}/RAPORT-FIGMA.md` § **Meldunki** — append `[YYYY-MM-DD]`, 5–15 linii: co · frame’y **N/M** · blokery |
| Skrót dla lane UI | Ten plik — wpis **OD GRUPY X** (gdy ważne dla Grupy 0 / priorytet) |
| Pełna reguła | [`docs/ux/figma/STATUS-FIGMA.md`](../docs/ux/figma/STATUS-FIGMA.md) § Reguła meldunków |

**Maciej czyta repo** — nie przekleja raportów z czatu. **W czacie:** *„Zapisane w RAPORT-FIGMA.md § [data]”*.

---

---

## [2026-07-01] MASTER prep — Maciej nieobecny ~1h · auto PNG w czacie

**Maciej:** wraca za ~1h · review PNG w czacie · auto podpinanie ✅  
**Zrobione (MASTER):**
- PRZED E: baseline skopiowany → `grupa-E/export/` (6 PNG)
- DoD lane UI: [`UI-FIGMA-LANE-0-DOD.md`](UI-FIGMA-LANE-0-DOD.md) · folder [`02-icons/`](../docs/ux/figma/02-icons/)
- Poll: `gra/tools/poll-figma-review.ps1` → `docs/obieg/_poll-figma-review-last.md`

**Czekamy:** `E-01_po.png` od Grupy E (Figma) · **referencja MASTER ✅** (`E-01_po_REFERENCJA-MASTER.png` · `02-icons/preview-tier1-5.png`)

---

*(Maciej: review **tylko MASTER** · PNG w czacie · DoD E-01: `export/E-01_po.png` + POSTĘP export PO ✅ · 1/6 · bez pliku = 0/6)*  
*(BLOCK 2026-07-01: PO musi mieć ikony **3C**, CTA **4C outline**, Georgia **2C** — nie samo grubsze złoto)*  
*(Lane UI: **02 Icons pełne (3C)** przed kolejnym layoutem ekranu)*  
*(Grupa E: nie meldować „gotowe do review” bez `E-01_po.png` w repo)*

---

### [2026-07-01] MACIEJ → Grupa E + MASTER — DoD E-01 · review tylko PNG w czacie

**Review Macieja:** **tylko czat MASTER** · PNG wklejone przez MASTER · **bez Figmy**.

**DoD E-01:** (1) `export/E-01_po.png` · (2) RAPORT: **export PO ✅** · **1/6** · bez pliku = **0/6** · **zakaz** meldunku „gotowe do review” bez repo.

**BLOCK PO musi pokazać gołym okiem:** ikony menu **3C** · CTA **4C outline** · **Georgia 2C** · baseline ledwo widoczny.

**Po pliku w repo:** MASTER → PNG w czacie + CHECKLIST § 1.

---

**Od Macieja:** mockupy/Figma praktycznie **bez zmiany** vs gra — tylko mocniejsze złote obramowania. **Niezgodne** z [`Warstwa1-Design-System-podglad.html`](../UI/Warstwa1-Design-System-podglad.html) i **3C/6C**.

**Dyspozycja lane UI (pilne):**
1. Domknąć **02 Icons** — pełny Tier 1–5 wg [`FIGMA-SPEC-IKONY.md`](../docs/ux/FIGMA-SPEC-IKONY.md) · eksport SVG do repo · PNG preview dla Macieja.
2. Poprawić **DoD ekranu**: baseline = układ; **wierzch** = nowe ikony + chipy 6C + uproszczone infografiki.
3. **Grupa E E-01** — pierwszy test akceptacji dopiero gdy menu ma **widocznie inne ikony** niż gra.
4. **Grupa C** — `FIGMA-FRAMES-C.html` wymaga podmiany emoji/placeholder na komponenty 3C.

**Nie wymaga nowego ABC** — wykonanie vs zamknięte **1B–8A**.

---

### [2026-07-01] OD GRUPY B — inbox potwierdzony · czeka za E

**Flaga:** **FIGMA-B: STOP layout · inbox ✅ · 0/8 cloud** [`grupa-B/RAPORT-FIGMA.md`](../docs/ux/figma/grupa-B/RAPORT-FIGMA.md) § [2026-06-26] + § [2026-07-01]  
**Teraz (bez Figmy cloud):** weryfikacja rail Tier 3 (młotek/kaduceusz) + chipy **6C** vs spec  
**Start layout:** po **E** (pilot E-01) · kolejność **8A:** E → A → **B** → D → C  
**DoD po starcie:** min. **B-03 Ludność + B-07 Praca** · export PNG → `figma/grupa-B/export/`

---

*(Grupa C Figma: **mockupy gotowe** — 7 PNG · 0/7 cloud · MCP ✅ limit 🔴)*  
*(Grupa D Figma: **CZĘŚCIOWE** — plik + dip-* ✅ · frame'y D-02…06 ⏳ MCP limit)*

---

---

---

---

### [2026-07-01] Maciej → Grupa E — review **tylko PNG** · DoD FAZY 1

**Typ:** bramka review · **FAZA 2 STOP** do `E-01_po.png`  
**Obowiązkowo:** (1) `docs/ux/figma/grupa-E/export/E-01_po.png` (@1x/2x) · (2) RAPORT: **export PO ✅** · frame’y **1/6**  
**Maciej:** **nie wchodzi do Figmy** — CHECKLIST § 1 tylko z PNG  
**Oficjalnie:** **0/6** bez pliku w repo  
**Raport:** `grupa-E/RAPORT-FIGMA.md` § Maciej tylko PNG

---

### [2026-07-01] Maciej → Grupa E — POSTĘP E-01 **niekompletny** *(superseded — patrz „tylko PNG”)*

---

### [2026-07-01] OD GRUPY E → review Macieja (POSTĘP E-01 · 1/6)

**Typ:** POSTĘP Figma · **FAZA 2**  
**Frame’y:** **1/6** · `E-01 · Menu główne` w cloud  
**Maciej:** [`CHECKLIST-REVIEW-MACIEJ.md`](../docs/ux/figma/grupa-E/CHECKLIST-REVIEW-MACIEJ.md) § **1. Menu główne**  
**Raport:** `docs/ux/figma/grupa-E/RAPORT-FIGMA.md` § POSTĘP E-01  
**Otwarte:** export `E-01_po.png` → `export/` ⏳

---

### [2026-07-01] MASTER → Grupa E — **FAZA 1 · pilot E-01** (aktywne zadanie)

**Cel:** frame **E-01 · Menu główne** w Figmie — pierwszy ekran pilota redesignu Warstwa 1.

| | |
|---|---|
| **Plik** | https://www.figma.com/design/COVbTJUV5dx8MzMxfWlYeu · str. **3 · sekcja E** |
| **Stan** | GOTOWE 00–02 ✅ · FAZA 0 ✅ · frame’y **0/6** → cel: **1/6** |
| **Plan** | [`PILOT-KROK-PO-KROKU.md`](../docs/ux/figma/grupa-E/PILOT-KROK-PO-KROKU.md) · [`SPEC-FRAMES.md`](../docs/ux/figma/grupa-E/SPEC-FRAMES.md) § E-01 |

**Kroki:**
1. Frame **1920×1080** · nazwa **`E-01 · Menu główne`**
2. Baseline `export/E-01_menu-glowne.png` · Place image · **35%** · **lock**
3. Tło `#080a12` + layout wg spec · **instancje Btn 4C** ze strony 1 DS (nie jednorazówki)
4. Export **`export/E-01_po.png`** (@1x lub 2x)
5. Meldunek **POSTĘP E-01** w `grupa-E/RAPORT-FIGMA.md` · **export PO ✅** · frame’y **1/6**

**Po frame’ie:** Maciej → CHECKLIST § 1 — **tylko PNG** (`export/E-01_po.png`), nie Figma

**Nie teraz:** E-03…E-15 · grupy A–D czekają za E

**Meldunek:** append RAPORT-FIGMA · w czacie: *„Zapisane w RAPORT-FIGMA.md § [data]”*

---

### [2026-07-01] LANE UI → Grupa E — **GOTOWE 00–02 (min. pod E)** · START FAZA 1

**Typ:** sygnał layoutu · styl zamknięty — bez ABC  
**DS strona 1:** ✅ Variables · Btn 4C · Panel 5C · Text Georgia/Segoe · ikony menu 3C  
**Start Grupy E:** **FAZA 1** · frame **E-01 Menu** · str. 3 · sekcja E  
**Procedura:** `docs/ux/figma/grupa-E/PILOT-KROK-PO-KROKU.md` · spec `SPEC-FRAMES.md` § E-01  
**Plik:** https://www.figma.com/design/COVbTJUV5dx8MzMxfWlYeu  
**Po frame’ie:** POSTĘP w `grupa-E/RAPORT-FIGMA.md` → Maciej review `CHECKLIST-REVIEW-MACIEJ.md` § E-01  
**Grupy A–D:** nadal **STOP layout** — czekają **za E**

---

### [2026-07-01] MASTER → Grupa E — start layoutu po GOTOWE 00–02

**Typ:** dyspozycja operacyjna · zgodna z **8A** · styl zamknięty — bez nowej ABC  
**Po sygnale GOTOWE 00–02:** startujecie **jako pierwsi** w layoutcie Figma · **reszta grup czeka za Wami**

| Krok | Frame | Uwaga |
|------|-------|--------|
| **1** | **E-01 Menu** | Priorytet wizualny — pierwsze wrażenie |
| 2 | E-03 | Ustawienia |
| 3 | E-09 | Kreator · epoka |
| 4 | E-10 | Kreator · cywilizacja |
| 5 | E-11 | Kreator · ustawienia gry |
| 6 | E-15 | Game over |

**Cel jakości:** baseline PNG **~35% lock** + instancje **Panel 5C / Btn 4C / Chip 6C** ze strony 1 DS.  
**Review Macieja:** `docs/ux/figma/grupa-E/CHECKLIST-REVIEW-MACIEJ.md` — gdy frame’y gotowe.  
**Teraz:** STOP layout · spec+baseline 6/6 — **bez** frame’ów w cloud.  
**Meldunki:** reguła → `STATUS-FIGMA.md` § Reguła meldunków · append w `RAPORT-FIGMA.md` · w czacie: *„Zapisane w RAPORT-FIGMA.md § [data]”*

---

### [2026-07-01] GRUPA E — pilot redesignu (krok po kroku · test toru Warstwa 1)

**Typ:** dyspozycja operacyjna · Maciej: test wyglądu gry na E  
**Plan:** [`figma/grupa-E/PILOT-KROK-PO-KROKU.md`](figma/grupa-E/PILOT-KROK-PO-KROKU.md)

**Skrót:**
- **Faza 0 (teraz):** prep E-01 · spec + baseline · **STOP layout** do GOTOWE 00–02
- **Faza 1:** E-01 w Figmie (pierwszy frame · najlepsza jakość)
- **Faza 2:** review Maciej · CHECKLIST § E-01
- **Faza 3–4:** lane UI eksport tokenów → kod `mainMenu.ts` → Integrator kanon
- **Faza 5:** after PNG vs baseline · potem E-03…E-15 ta sama procedura

**Lane UI:** domknąć **GOTOWE 00–02 (min. E)** — Variables + Btn 4C + Georgia + 3 ikony menu  
**Grupa E:** meldunki tylko w `RAPORT-FIGMA.md` (reguła Figma / Warstwa 1)

---

### [2026-07-01] MACIEJ → LANE UI (Grupa 0) — priorytet sekcji E po GOTOWE 00–02

**Typ:** dyspozycja operacyjna · zgodna z decyzją **8A** (E → A → B → D → C)  
**Treść (Maciej):**

> Priorytet po GOTOWE 00–02: najpierw sekcja E (meta/start) na stronie 3 — frame’y E-01…E-15.  
> Start gry ma wyglądać najlepiej — E przed A/B/C/D w Figmie.  
> Potem reszta grup. MCP oszczędnie; PNG baseline E ręcznie (MCP nie importuje obrazów).

**Lane UI wykonuje:**
1. Strona 1 · Design System → sygnał **GOTOWE 00–02**
2. **Natychmiast potem:** strona 3 · sekcja E — współpraca z Grupą E · start od **E-01 Menu**
3. Dopiero po sekcji E (lub równolegle po E-01 gotowym): sekcje A/B (str. 2), C/D (str. 3)

**Grupy A–D:** bez layoutu do sygnału GOTOWE 00–02; po E — kolejność wg 8A.

**Meldunki (obowiązkowe, tylko to zadanie Figma):** grupy zapisują odpowiedzi w `docs/ux/figma/grupa-*/RAPORT-FIGMA.md` — **nie dotyczy innych raportów projektu**; Maciej nie przekleja do Cursor w tym workflow. Reguła: `STATUS-FIGMA.md` § Reguła meldunków.

---

### [2026-07-01] OD GRUPY A → LANE UI (Grupa 0 / fundament DS)

**Typ:** meldunek Figma · **nie** wymaga decyzji Macieja (styl 1B–8A zamknięty)  
**Skrót:** MCP ✅ `plugin-figma-figma` · URL kanon ✅ · baseline **8/8** · rejestr 30 UX · **0/8** frame’ów · czeka **GOTOWE 00–02**  
**Lane UI czyta:** `docs/ux/figma/STATUS-FIGMA.md` § **Inbox — meldunki grup → lane UI** (wpis Grupa A)  
**Akcja lane UI:** domknąć stronę 1 DS → **GOTOWE 00–02** → Grupa A layout sekcja A (strona 3) · uwagi baseline A-06 / A-16 w inboxie

---

### [2026-07-01] Grupa E — status tu i teraz (STOP layout)

**Flaga:** **FIGMA-E: STOP layout · inbox lane UI przyjęty ✅ · 0/6 frame’ów**  
**Plik:** https://www.figma.com/design/COVbTJUV5dx8MzMxfWlYeu  
**Raport:** `docs/ux/figma/grupa-E/RAPORT-FIGMA.md`  
**Gotowe lokalnie:** spec + baseline **6/6** (E-01, E-03, E-09, E-10, E-11, E-15)  
**Teraz:** przygotowanie pod 6 frame’ów wg `SPEC-FRAMES.md` — **bez** layoutu w cloud  
**Po GOTOWE 00–02:** **pierwsi w layoutcie** · kolejność E-01★ → E-03 → E-09 → E-10 → E-11 → E-15 · baseline ~35% + DS 5C/4C/6C · ręcznie **lub** MCP (limit Starter)  
**Review Macieja:** `CHECKLIST-REVIEW-MACIEJ.md` — dopiero gdy frame’y gotowe  
**Decyzje stylu:** zamknięte

---

### [2026-07-01] OD GRUPY E → LANE UI (Grupa 0 / fundament DS)

**Typ:** meldunek Figma · **nie** wymaga decyzji Macieja (styl 1B–8A zamknięty)  
**Skrót:** MCP ✅ `plugin-figma-figma` · URL kanon ✅ · spec+baseline 6/6 · **0/6** frame’ów · MCP limit 🔴  
**Lane UI czyta:** `docs/ux/figma/STATUS-FIGMA.md` § **Inbox — meldunki grup → lane UI** (wpis Grupa E)  
**Akcja lane UI:** domknąć stronę 1 DS → **GOTOWE 00–02** → Grupa E layout sekcja E (strona 3) · usuń duplikat `wlHvQljFFcf2BH9LE7sdOI`

---

### [2026-06-26] OD GRUPY C → LANE UI (Grupa 0 / fundament DS)

**Typ:** meldunek Figma · **nie** wymaga decyzji Macieja  
**Skrót:** MCP ✅ (`plugin-figma-figma`) · 7/7 PNG lokalnie · 0/7 w pliku · limit Starter  
**Lane UI czyta:** `docs/ux/figma/STATUS-FIGMA.md` § **Inbox — meldunki grup → lane UI** (wpis Grupa C)  
**Akcja lane UI:** import ręczny 7 PNG → strona 3 · sekcja C · usuń duplikat Drafts `1AagleoxDbe0jWOMDsA0if`

---

### [2026-07-01] OD GRUPY D — reguła meldunków Figma (przyjęta)

**Typ:** protokół Warstwa 1 · append `RAPORT-FIGMA.md` · czat = 1 linia  
**Stan Figma:** 0/5 frame’ów · STOP (A) · nie GOTOWE

---

### [2026-07-01] OD GRUPY D → LANE UI — odpowiedź na inbox

**Typ:** odpowiedź Figma · wybór ścieżki A/B  
**Wybór:** **A** — czekamy **GOTOWE 00–02**, potem 5 frame’ów na instancjach DS (str. 3 · sekcja D)  
**B:** ⏸ na sygnał Macieja (Share Can edit + ręcznie w przeglądarce, Lora Bold)  
**Nie GOTOWE:** 0/5 frame’ów · export pusty  
**Raport:** `docs/ux/figma/grupa-D/RAPORT-FIGMA.md` § odpowiedź inbox

---

### [2026-07-01] OD GRUPY D → LANE UI (Grupa 0 / fundament DS)

**Typ:** meldunek Figma · **nie** wymaga decyzji Macieja  
**Skrót:** dip-* komponenty w pliku ✅ · 0/5 frame’ów · MCP limit · inline tokeny  
**Lane UI czyta:** `docs/ux/figma/STATUS-FIGMA.md` § **Inbox — meldunki grup → lane UI**  
**Akcja lane UI:** domknąć stronę 1 DS → sygnał GOTOWE 00–02 → Grupa D kończy D-02…06

---

### [2026-07-01] Grupa D — Figma redesign dyplomacji (CZĘŚCIOWE)

**Plik:** https://www.figma.com/design/COVbTJUV5dx8MzMxfWlYeu  
**Raport:** `docs/ux/figma/grupa-D/RAPORT-FIGMA.md`  
**Gotowe:** strona `06 Screens D` · komponenty `dip-alliance`, `dip-pact`, `dip-war`  
**Czeka:** 5 frame'ów + export PNG (limit Figma MCP Starter)  
**Font:** Lora zamiast Georgia (brak w Figma cloud)

---

### [2026-07-01] Grupa E — Figma redesign menu/kreator (STOP layout)

**Flaga:** **FIGMA-E: STOP layout · inbox ✅ · 0/6 frame’ów**  
**Raport:** `docs/ux/figma/grupa-E/RAPORT-FIGMA.md`  
**Spec:** `docs/ux/figma/grupa-E/SPEC-FRAMES.md`  
**Baseline w export/:** 6 PNG ✅ (E-01, E-03, E-09, E-10, E-11, E-15)  
**MCP:** ✅ `plugin-figma-figma` (konto Maciej) · **URL:** ✅ kanon `COVbTJUV5dx8MzMxfWlYeu`  
**Blokery:** 00–02 ⏳ · limit MCP Starter 🔴 · duplikat test `wlHvQljFFcf2BH9LE7sdOI` do usunięcia  
**Inbox lane UI:** `docs/ux/figma/STATUS-FIGMA.md` § Inbox Grupa E  
**Następny krok:** lane UI → GOTOWE 00–02 → **E pierwsi** (E-01★ → … → E-15) · A–D czekają

---

### [2026-07-01] Grupa A — Figma redesign HUD (START, zablokowane)

**Flaga:** **FIGMA-A: START · BLOCKED na 00–02**  
**Raport:** `docs/ux/figma/grupa-A/RAPORT-FIGMA.md`  
**Baseline:** 8 PNG ✅ · **Kod:** nie dotykamy  
**Następny krok:** lane UI melduje GOTOWE 00–02 + URL Figmy → Grupa A buduje 8 frame’ów na „03 Screens A”

---

### [2026-06-30] UI v1.1 dyplomacja — modale negocjacji — **→ SILNIK: GOTOWE**

**Moduły:**
| Plik | Rola |
|------|------|
| `gra/src/ui/diplomacyNegotiationModal.ts` | Formularze NAP/sojusz/handel/trybut/granice/tech/namów/ultimatum/wasal |
| `gra/src/ui/diplomacyProposalBanner.ts` | Banner ✅/❌ po evaluateProposal |
| `gra/src/ui/diplomacyAudience.ts` | Routing karta → modal → `onAction(id, payload?)` |

**Handoff F:** `UI-do-SILNIK_v1.1-diplomacy-negocjacje.md`  
**Nie dotykano:** `main.ts`

---

### [2026-07-01] Grupa A — baseline screenshoty UX

**Flaga:** **Baseline GOTOWE · 2026-07-01 · 8 plików**  
**Folder:** `docs/ux/baseline/A/`  
**Skrypt:** `gra/tools/baseline-screenshots-a.cjs`

---

### [2026-07-01] UI → INTEGRATOR: A2-Q5 picker Miasto vs Jednostka — **ZATWIERDZONE**

**Flaga:** **→ INTEGRATOR: ZATWIERDZONE · WDROŻONE**  
**Sign-off Maciej:** playtest OK  
**Handoff:** `dyspozycje/_handoff/MASTER-do-INTEGRATOR_A2-Q5-city-unit-pick.md`  
**Moduł:** `gra/src/ui/cityUnitPick.ts` · wpięcie w `main.ts` (batch 2026-07-01)  
**Integrator:** bramka + Opus w kolejce — **bez** nowego batcha main.ts

---

### [2026-06-29] UI → INTEGRATOR: E2 — gęstość świata w kreatorze — **GOTOWE (UI)**

**Flaga:** **→ INTEGRATOR: GOTOWE** · **Warstwa:** 🟡 cross

**Decyzja:** `docs/decyzje/E2-gestosc-swiat-kreator.md`  
**Handoff:** `dyspozycje/_handoff/UI-do-INTEGRATOR_E2-kreator-gestosc.md`  
**Plan:** `dyspozycje/_handoff/MASTER-PLAN-E2-gestosc-swiat.md`

**Pliki UI:**
| Plik | Zmiana |
|------|--------|
| `gra/src/ui/newGameFlow.ts` | `civ_types_count` na siatce; zaawansowane: jakość + surowce/rzeki/pustynia/las |
| `gra/data/ui-params.json` | nowe klucze |
| `gra/src/map/newGameMapDefaults.ts` | kontrakt menu + `WorldGenerationPreset` (MAPA: generator) |

**Efekt gameplay:** dopiero po **MAPA** + **SILNIK** (`MASTER-do-SILNIK_E2-gestosc-wpiecie.md`).

---

### [2026-06-29] UI → INTEGRATOR: E1 — jeden suwak „Jakość mapy” — **GOTOWE**

**Flaga:** **→ INTEGRATOR: GOTOWE**

**Decyzja:** `docs/decyzje/E1-jakosc-mapy-bundle.md`  
**Handoff:** `dyspozycje/_handoff/MASTER-do-UI_E1-jakosc-mapy-bundle.md`  
**Handoff SILNIK:** `dyspozycje/_handoff/UI-do-SILNIK_E1-jakosc-bundle-params.md`

**Pliki:**
| Plik | Zmiana |
|------|--------|
| `gra/src/ui/newGameFlow.ts` | `buildParams()` → `bundledMapQualityFromLabel()`; usunięto `render_quality` z modala; stopka kroku 4; podsumowanie krok 5 — jedna linia jakości |
| `gra/data/ui-params.json` | usunięto `render_quality` i `map_detail` z kreatora; opisy `map_quality` = pakiet GPU+dekoracje |
| `UI/Makieta-flow-nowa-gra.html` | sync stopki kroku 4 |

**AC-1–AC-7:** ✅ · **NIE** ruszano `main.ts`, `scene.ts`, `generator.ts`.

**INTEGRATOR:** czeka na MAPA (fix lasu ≠ gameplay) + SILNIK (`mapRenderOptionsFromParams` → bundle).

---

### [2026-06-29] UI → INTEGRATOR: P0-D4 preBattle bonusy — **GOTOWE**

**Flaga:** **→ INTEGRATOR: GOTOWE**

**Zadanie:** P0-D4 — sekcja „Bonusy nacji” w preBattle (D4-Q3=A)  
**Handoff:** `dyspozycje/_handoff/UI-do-INTEGRATOR_preBattle-bonusy-P0-D4.md`  
**Źródło CYW:** `CYWILIZACJE-do-UI_bonusy-wyswietlanie.md` (Batch B)

**Pliki:**
| Plik | Zmiana |
|------|--------|
| `gra/src/ui/preBattle.ts` | `configurePreBattle({ getCivBonusy })`; sekcja Bonusy nacji (atak/obrońca); `ownerId` na `PreBattleSide`; opcjonalnie `bonusyAtakujacy`/`bonusyObronca` na info |

**INTEGRATOR (main.ts):**
1. `configurePreBattle({ getCivBonusy: civBonusyForOwnerId })` przy starcie
2. `ownerId` w `preBattleSideFromRoster`

**NIE liczy mechaniki** — tylko `bonusy[].opis` + kolor kropki wg `realizuje`.

---

### [2026-06-29] UI → INTEGRATOR: E-P0-01…03 menu S0 — **GOTOWE**

**Flaga:** **→ INTEGRATOR: GOTOWE**

**Zadanie:** E-P0-01…03 (menu S0 hybryda 5=C · Kampania/Multi Wkrótce 6=A · tło wideo 7=A)  
**Handoff:** `dyspozycje/_handoff/GRUPA-E-do-UI_menu-S0-5C.md`  
**Manifest:** `dyspozycje/MACIEJ-DELEGACJA-LANE-2026-06-28.md`

**Pliki:**
| Plik | Zmiana |
|------|--------|
| `gra/src/ui/mainMenu.ts` | S0 layout: Rozpocznij grę · Kampania/Multi toast · Ustawienia · Więcej ▾; podmenu Kontynuuj/Wczytaj/O grze/Wyjdź; tło wideo + gradient fallback; playtesty w podmenu (dev) |
| `UI/Gra-podglad-MENU.html` | sync branding „Cywilizacja · The Game" |

**Kontrakt `MainMenuConfig`:** bez zmian (te same callbacki) — **NIE wymaga batcha main.ts**.

**Asset wideo:** opcjonalny `assets/menu-hero.webm` (domyślna ścieżka `DEFAULT_MENU_VIDEO_URL`); brak pliku → animowany gradient (zgodnie ze spec 7=A).

**DoD handoff:** wszystkie checkboxy ✅ w pliku handoff.

**INTEGRATOR:** build kanonu po merge — brak wpięcia w `main.ts` (moduł już importowany przez silnik).

---

### [2026-07-01] **→ MASTER: GOTOWE · batch B5-SP-HUD**

**Decyzja:** SP4=C (panel bez chipa zapasów) · SP4-szczegóły=A · SP6-HUD=B (`{zapasy} / {max}`)  
**Warstwa:** 🟡 cross — `hud.ts`, `cityPanel.ts` · **bez `main.ts`**

**Pliki:**
| Plik | Zmiana |
|------|--------|
| `gra/src/ui/hud.ts` | `formatFoodHudLabel`: `142 / 200`; max=0 → `—` + tooltip Spichlerz; `glod-wojska` bez regresji |
| `gra/src/ui/cityPanel.ts` | SP4: pasek miasta = netto lokalne (bez zapasów armii); zakładka Spichlerz bez chipa 📦 Zapasy |

**Handoff F:** `dyspozycje/_handoff/UI-do-INTEGRATOR_B5-spichlerz-SP-hud-wire.md` (wire `zywnoscMax` już w main.ts ~3573 — weryfikacja smoke)

**Testy lane:** brak dedykowanych UI testów · regresja logiczna przez B5-SP-LIMIT

**Co sprawdzić po wpięciu F:** HUD mapy format X/Y; panel miasta bez globalnych zapasów wojska.

---

## [2026-07-03] W3-W4 port → **→ MASTER: ZAMKNIĘTE** (reconcile)

**Maciej:** sesja Master = ostateczne · kanon **`153fcda2f71e1e9ab3a538d8b9c10f9e`** · 22:04  
Lane W3-W4 zmergowany w `gra/src` · promocja reconcile · bez osobnego batchu.

*(Poniżej: oryginalny meldunek lane)*

## [2026-07-03] W3-W4 port → MASTER: CZEKA

**Trigger:** `MASTER-do-UI_w3-w4-port-2026-07-03.md` · design kanon W4 v2 (1E)  
**Warstwa:** 🟢 izolowana — `cityPanel.ts` · `cityUxFrame.ts` · ikony brand · **bez `main.ts`**

**Zakres:**
- CSS/layout 1E: chipy netto/bufor, karty handlu, rail 7 medalionów (46px), stopka **Surowce w zasięgu** (grid 2×2 + SVG)
- SVG: `res-cattle.svg` · `res-clay.svg` · `res-horses.svg` · `res-salt.svg` w `gra/src/ui/icons/brand/`
- Usunięto `/t` i `/turę` z widocznych stringów panelu miasta (same liczby: `+12`, `+2`)
- Polish `renderCivResourceTopBar` (B-02) — tokens 1E, bez `/t`
- Nagłówki zakładek: **i szczegóły** (W4)

**Pliki:**
| Plik | Zmiana |
|------|--------|
| `gra/src/ui/cityPanel.ts` | W4 polish CSS, stopka surowce, `/t` out, top bar chips |
| `gra/src/ui/cityPanel.ts.bak-UI-W4v2-2026-07-03` | backup przed edycją |
| `gra/src/ui/cityUxFrame.ts` | panel prawy 14px radius, rail 46px |
| `gra/src/ui/icons/brand/res-cattle.svg` | nowy (W4) |
| `gra/src/ui/icons/brand/res-clay.svg` | nowy (W4) |
| `gra/src/ui/icons/brand/res-horses.svg` | nowy (W4, reuse w stopce) |
| `gra/src/ui/icons/brand/res-salt.svg` | nowy (W4, reuse w stopce) |

**Testy lane:**
- `npx tsc --noEmit` — baseline repo ma istniejące błędy spoza lane UI; brak nowych w `cityPanel.ts` / `cityUxFrame.ts` (lint OK)
- `node tools/smoke.cjs` — PASS

**Co sprawdzić po wpięciu (Integrator/Master):** 7 zakładek prawego raila vs W4 v2; stopka surowce z ikonami; brak `/t` w chipach; pasek górny miasta (B-02).

**→ MASTER: CZEKA** (bez kanonu — review Master po Opus)

---

## 2026-07-04 · P0-1 stopka surowców miasto (hotfix CSS)

**Trigger:** werdykt MASTER + „rób P0-1” · playtest FAIL (stopka zlane ze Spichlerzem)

**Zakres lane UI (`cityPanel.ts` tylko CSS):**
- `.civ-v-right-foot`: **`margin-top:auto`** (przywrócone z baseline 153fcda2)
- Separacja: `padding-top:0.42em`, `border-top rgba(232,216,138,0.38)`, gradient tła, `box-shadow` od góry
- `.civ-w4-surowce-foot`: przywrócony wewnętrzny border + tło (baseline)
- **Bez zmian:** sekcja Walka/TW · `renderSurowce` markup

**Pliki:** `gra/src/ui/cityPanel.ts` · sync `gra-kanon/` + `gra-robocza/` · backup `.bak-UI-2026-07-04-P0-1`

**Build:** vite → bundle w kanon/robocza · smoke OK

**→ MASTER/Maciej:** playtest Ctrl+F5 · `gra-kanon/START.html` · RZYM · Spichlerz + Handel · **STOP publish-kanon-snapshot** do OK stopki

---

## 2026-07-04 · POLE-BITWY HUD — port Design 1E v4 (lane UI)

**Trigger:** handoff `MASTER-do-UI_pole-bitwy-design-1E-2026-07-04.md` · Design ZIP v4 ✅

**Warstwa:** 🟡 cross (HUD battleScene — bez logiki walki / main.ts)

**Zakres (skin C06/C09 v4):**
- Tokeny 1E: filtry złote, chipy typów, diament SVG Grupuj, hint SPACJA/AUTO u dołu
- Panel rosteru: `applyRosterPanel1E`, nagłówek „Roster · N jednostek”, siatka 6 kol C09
- Karty: ikona SVG + HP zielony + morale złoty + badge grupy (bez emoji/◆)
- Top deploy: emblemat cywilizacji + „Faza rozstawiania”
- Rail R: podświetlenie 1E w trybie ręcznym (`applyRailBtn1E active`)
- Minimapa: `applyMinimap1E` (złota obwódka)
- Pasek mocy + „Ostatnie starcia” (już w baseline — bez zmian logiki)

**Pliki:**
| Plik | Zmiana |
|------|--------|
| `gra/src/battle/battleHudTheme.ts` | `DIAMOND_SVG`, `applyFilterChip1E`, `applyModeHint1E`, `applySelectionActionBtn1E`, badge/bar helpers |
| `gra/src/battle/battleScene.ts` | HUD deploy/AUTO/R: roster, filtry, toolbar, hint, rail, minimapa, karty v4; fix jsdom `HTMLDivElement` w `_layoutRosterCardGrid` |
| `gra/src/ui/icons/brandAssets.ts` | import `civIconSvg` (emblemat top deploy) |
| `gra/tools/battle-smoke.cjs` | fallback szukaj „Rozegraj ręcznie” (etykieta pre-battle) |

**Baseline funkcjonalny:** AUTO/R, Taktyka, Strategia, filtry, Grupuj, SPACJA — bez zmian logiki.

**Testy lane:**
- `npx vite build --config vite.oblezenie-bitwa.config.ts` → **`Gra-podglad-POLE-BITWY.html`** (root) — **PASS**
- `node tools/battle-smoke.cjs` — Phase A/B OK (BattleScene start); **FAIL** headless: jsdom `Maximum call stack size exceeded` (setTimeout) po kliknięciu „Rozegraj ręcznie” — poza skinem; poprawka `HTMLDivElement` wdrożona
- Lint `battleHudTheme.ts` / `battleScene.ts` — OK

**Build ID:** `BATTLE_UI_BUILD = POLE-BITWY-20260704-design-v4`

**Co sprawdzić po wpięciu:** Ctrl+F5 `Gra-podglad-POLE-BITWY.html` · porównaj C06/C09 v4 (deploy · AUTO · R+roster) · checklist funkcji batchu.

**→ MASTER: GOTOWE**

---

## 2026-07-04 · POLE-BITWY poprawki v4.1 (lane UI)

**Trigger:** handoff `MASTER-do-UI_POLE-BITWY-poprawki-v4.1-2026-07-04.md` · komenda Macieja `POLE-BITWY-poprawki-v4.1-2026-07-04`

**P0 — Popup Strategia 1E:**
- Custom dropdown złoty (`createBattlePriorityDropdown1E`) zamiast natywnego `<select>`
- Mini-medaliony typów (koń/tarcza/łuk) przy opcjach i w triggerze
- Złota strzałka SVG (chevron)
- Stała wysokość popupu + scroll (`max-height: min(420px, 55vh)`)
- Sticky footer: „Skopiuj z priorytetów armii” u dołu (gdy własne priorytety grupy)
- Checkbox 1E (`applyBattleCheckbox1E` — złota obwódka + ptaszek)

**P1 — skin drobny (ten sam batch):**
- Top-bar: większy gap chipów K/P/Ł (`rosterTypeCountsHtml` large + countsEl gap 6px)
- Nagłówki grup rosteru: **`Grupa N · liczba`** (jedna linia)
- Puste sloty siatki 6 kol: dashed placeholder w ostatnim rzędzie

**Pliki:**
| Plik | Zmiana |
|------|--------|
| `gra/src/battle/battleHudTheme.ts` | dropdown 1E, checkbox 1E, medaliony typów, empty slot helper |
| `gra/src/battle/battleScene.ts` | `_appendDeployPriorityBlock`, `_renderDeployStrategyPopup`, nagłówki grup, empty slots |

**Build:** `npx vite build --config vite.oblezenie-bitwa.config.ts` → **PASS**
**MD5:** `435aa61d6afca0fa9e0cbc44122f4012`
**Marker:** `POLE-BITWY-20260704-poprawki-v4.1`
**Skopiowano:** root + `gra-kanon/` + `gra-robocza/`

**Playtest Macieja:** Ctrl+F5 `gra-kanon/Gra-podglad-POLE-BITWY.html` · otwórz Strategia (deploy + faza R) · scroll + sticky „Skopiuj z priorytetów armii”

**→ MASTER: GOTOWE**

---

## 2026-07-04 ~23:30 · POLE-BITWY v4.1 — dopasowanie mockup Strategia 1:1

**Trigger:** Maciej `działaj` · ZIP z `docs/ux/claude-design/` · mockup `C06 Popup Strategia v4`

**Delta vs pierwszy port v4.1:**
- Nagłówek: ikona + **Strategia** (Georgia)
- Dropdowny `.sel1e` 34px + chevron SVG
- Typy: medalion 26px + uppercase
- Outline „Przywróć domyślne” · złoty CTA sticky „Skopiuj z priorytetów armii”
- Checkbox złoty gradient · panel 360px · scroll + sticky

**MD5:** `9eb46ad1b70f195868926b246053c7f3`

**→ MASTER: GOTOWE**

---

## 2026-07-04 ~23:36 · Design → meldunek paczki v4.1 (zamknięcie Design)

**Od Design:** `MELDUNEK-POLE-BITWY-v4.1.md` zapisany w paczce · skopiowany do `brand-book/` (push GitHub).

**Paczka:** 3× `.dc.html` · `support.js` · `DESIGN-do-UI_POLE-BITWY-poprawki-v4.1.md` · meldunek.

**Lane UI:** KOMPLET · MD5 `9eb46ad1…` · handoff `MASTER-do-UI_POLE-BITWY-poprawki-v4.1` **ZAMKNIĘTY**.

**Docelowa kopia OneDrive (po pull/sync):** `docs/ux/claude-design/01-propozycje-z-design/brand-book/`

**→ MASTER: Design side closed · brak otwartych tasków POLE-BITWY v4.1**

---

## 2026-07-04 ~23:40 · Maciej „wprowadź paczkę Design” — rebuild + promote

**Paczka:** `POLE-BITWY-poprawki-v4.1-2026-07-04` (mockupy C06 Strategia + Deployment + handoff)  
**Kod:** już w `battleScene.ts` + `battleHudTheme.ts` (marker `poprawki-v4.1`) — **bez nowych diffów**  
**Build:** `npx vite build --config vite.oblezenie-bitwa.config.ts` → **PASS**  
**MD5:** `a398720f4d0f6aafa3479a7750f6e82`  
**Promote:** root + `gra-kanon/` + `gra-robocza/` · `Gra-podglad-POLE-BITWY.html`

**Playtest:** Ctrl+F5 `gra-kanon/Gra-podglad-POLE-BITWY.html` · Strategia deploy+R

**→ MASTER: GOTOWE · bramka OK**

---

## 2026-07-05 ~00:25 · Popup Strategia — ikony typów (Design delta)

**Trigger:** Maciej — podkowa / skrzyż. miecze / łuk w nagłówkach sekcji (armia + grupa)

**Plik:** `gra/src/battle/battleHudTheme.ts` — `ROSTER_TYPE_SVG` (używane przez `createBattleClassTypeRow` + top-bar + roster)

| Typ | Było | Jest |
|-----|------|------|
| Konnica | koń | **podkowa** (U + gwoździe) |
| Piechota | tarcza / rect miecz | **skrzyż. miecze** (`unit-melee`) |
| Łucznicy | łuk | łuk + strzała (`unit-archer`, bez zmian semantyki) |

**Marker:** `POLE-BITWY-20260705-strategia-type-icons`  
**MD5:** `b7a5efe768e32f67aa6d23e5e9188d0f` · promote root + `gra-kanon/` + `gra-robocza/`

**→ MASTER: GOTOWE**

---

## 2026-07-05 ~23:20 · INWENTARZ Design vs gra (kanon lane — nie skanuj od zera)

**Plik:** `dyspozycje/UI-INVENTORY-DESIGN-vs-GRA.md`  
**Reguła agentów:** czytaj §A–C z tego pliku · **nie** powtarzaj grep po repo co sesję.

---

## 2026-07-05 ~23:10 · Maciej — „czy wysłałeś do Designera?” (HEX + A-08)

**Uczciwy werdykt:** Briefy **były** w repo od 2026-07-03 (A-08) i 2026-07-05 (HEX), ale **NIE** w `WYMIANA-UI-DESIGN.md` → `queue_design`. Design nie dostał formalnego START. Lane robił audyty/kod częściowy (litery Ż/P/H w hexContextTooltip), **bez** mockupu — `buildModeHud.ts` nadal emoji + 240px overlap (Posterunek).

**Screenshot Macieja ~23:05:** lewy panel heksu (PLONY, MOŻLIWE plain text) + prawy panel budowy (przepełniony, brak imp-*).

**Naprawa kanału (dziś):**
- `WYMIANA-UI-DESIGN.md` — P0 `A-08-ULEPSZENIA` + `HEX-CONTEXT-PANEL` w queue
- Wklejka gotowa: `docs/ux/WKLEJKA-DESIGN-P0-HEX-A08-MACIEJ-2026-07-05.md`

**→ MASTER: CZEKA Design deliverable · nie audyt** · wklejka Design: `docs/ux/WKLEJKA-DESIGN-P0-HEX-A08-MACIEJ-2026-07-05.md`

---

## 2026-07-05 ~23:25 · publish ROBOCZA — szczegóły w ▶ START u góry

*(Duplikat skrócony — pełna spec w `_handoff/UI-do-MASTER_publish-robocza-2026-07-05.md`)*

**→ MASTER: CZEKA publish ROBOCZA**

