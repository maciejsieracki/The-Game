# 05 — Analiza: Panele UI (`gra/src/ui/`)

**Data:** 2026-06-26
**Scope:** `C:\Users\macie\OneDrive - NASTER S.A\_NOWA_STRUKTURA\06_Prywatne\Gry\Civ\gra\src\ui\`
**Wątek nadrzędny:** `docs/CURSOR-PLAN-DZIALANIA.md` — UI lane ~74%, decyzja 6B (HUD) zablokowana na Macieju.

---

## 1. Status ogólny

Katalog zawiera **18 plików**:

- **11 aktywnych modułów `.ts`** (HUD, panele, pickery, overlaye, modal, dane UI),
- **7 plików `.bak-UI`** (kopie zapasowe iteracji UI) — `hud`, `sciencePicker`, `cityPanel` (×2: `.bak-UI` i `.bak-INTEGR-EKON`), `diplomacyPanel`, `newGameFlow`, `uiParams`.

Wszystkie moduły są **DOM-only / DECOUPLED**: zero importów z `game/*` do logiki mutującej, dane podawane przez haki w `*Config`, akcje przez callbacki. Stylowanie po namespacie CSS (`.civ-*`), wstrzykiwane raz (`ensureStyles()` z `STYLE_ID`). Source: UTF-8 z polskimi literami + encje HTML dla symboli.

| # | Plik | Linie | Rola | Status blokady |
|---|------|-------|------|----------------|
| 1 | `hud.ts` | 368 | HUD w grze (pasek zasobów + minimapa) | **BLOK 6B** (Maciej) |
| 2 | `cityPanel.ts` | 996 | Full-screen widok miasta | Działa (placeholderzy aktywni) |
| 3 | `diplomacyPanel.ts` | 261 | Panel dyplomacji (podgląd) | v0.1 = pasywny |
| 4 | `sciencePicker.ts` | 1020 | Drzewko technologii (picker) | Działa |
| 5 | `mainMenu.ts` | 238 | Menu główne + ustawienia | Działa |
| 6 | `newGameFlow.ts` | 428 | Kreator nowej gry (5 kroków) | Działa |
| 7 | `uiParams.ts` | 79 | Typowany dostęp do `ui-params.json` | Działa |
| 8 | `orderPanel.ts` | 127 | Panel Zadowolenia/Porządku | Działa (placeholder) |
| 9 | `empireBalance.ts` | 112 | Bilans imperium / turę | Działa |
| 10 | `armyStackPrompt.ts` | 216 | Modal „Zajęty heks" (merge armii) | Działa (#167) |
| 11 | `preBattle.ts` | 1046 | Overlay przed-bitwą (auto/taktyczna/wycofaj) | Działa |
| — | `victory overlay` | (w `main.ts` L519-560) | Overlay końca gry | Działa — NIE ma osobnego pliku w `ui/` |

---

## 2. HUD — `hud.ts` (368 linii)

**Cel:** górny pasek zasobów + przyciski + minimapa. Układ wg `Makieta-HUD-mapa-swiata.html`.

### Stan wejściowy (`HudState`)
```20:38:gra/src/ui/hud.ts
export interface HudState {
  zloto: number; zlotoRate: number;
  praca: number; pracaRate: number;
  wplyw: number; nauka: number; kultura: number; zadowolenie: number;
  osiedla: number; osiedlaMax: number;
  nacja: string; tura: number; epoka: string;
  epokaPostep?: number; badana?: string | null;
}
```

### Konfiguracja (`HudConfig`)
- `getState()` — silnik podaje stan,
- callbacki: `onEndTurn`, `onOpenCities`, `onOpenScience`, `onOpenDiplomacy`, `onOpenMenu`,
- **Minimapa — dwa warianty kontraktu (addytywne, opcjonalne):**
  - **Wariant A** `onMountMinimap(el, {width,height})` — MAPA renderuje swój 3D/2D do slotu (priorytet),
  - **Wariant B** `getMinimapData()` — UI rysuje przegląd 2D na `<canvas>` z `MinimapHexData` (teren + `ownerColor`),
  - brak obu → placeholder „Minimapa — render: dział MAPA".
- `onMinimapClick(q, r)` — klik przesuwa kamerę.

### Render paska (`renderBar`)
4 grupy zasobów + pasek epoki + sekcja prawa:
- Złoto 🪙/Praca 🔨 (z rate `/t`, praca w pomarańczowym gdy ujemna),
- Wpływ 🏛️ / Nauka ⚛️,
- Kultura 🎼 / Zadowolenie 😀,
- Osiedla 🏘️ / Nacja 👑,
- pasek Epoki z % + badana technologia,
- prawa: Tura + przyciski Miasta/Nauka/Dyplomacja/☰ + „Zakończ turę ▶".

### API publiczne
`showHud(config)`, `updateHud()`, `hideHud()`, `isHudOpen()`.

### ⚠️ BLOK 6B — decyzja Macieja (HUD)
Zgodnie z `CURSOR-PLAN-DZIALANIA.md` (Sprint 3, S3.1):
- **Wątek #6 / decyzja 6B:** „Układ widoku głównego / HUD" — opcje:
  - A) Obecny overlay,
  - B) Makieta HUD v2,
  - C) Hybryda (minimapa + panel boczny),
- **Rekomendacja Mastera: C** — minimapa od MAPA gotowa, reszta inkrementalnie,
- **Status:** **BLOK** — czeka na akceptację układu przez Macieja.
- HUD istnieje i jest w pełni funkcjonalny, ale **nie jest ostatecznie zaakceptowany** — mockupy bez akceptacji.

---

## 3. Panel Miasta — `cityPanel.ts` (996 linii)

**Cel:** pełnoekranowy widok miasta wg `Widok-miasta.html` (zaakceptowany przez Naster).

### Sekcje REAL (bez nowej pracy silnika)
- **Header:** nazwa / właściciel / epoka / populacja + nawigacja prev/next-city + skala czcionki,
- **Bilans plonów/turę** — Praca/Pieniądz/Nauka/Kultura/Żywność (liczone jak tick `turn-economy`),
- **Produkcja:** aktualna pozycja + postęp + ETA, Usuń, kolejka z reorder, Wstrzymaj/Wznów, **Wykup (rush-buy)**,
- **Kolejka budowy** z przestawianiem ↑↓,
- **Dostępne do budowy:** Budynki / Jednostki / Ulepsz (gating po epoce),
- **Magazyn Żywności:** net food + store + ETA wzrostu (gdy Spichlerz),
- **Garnizon:** realne jednostki na heksie miasta (`getUnitsAt`),
- **Okolica:** realna sąsiedztwo heksów z mapy (SVG), podgląd pól obrabianych.

### Sekcje PLACEHOLDER (badge „podgląd" do czasu haka silnika)
- Mieszkańcy (emotikony zadowoleni/kontent/niezadowoleni),
- Zdrowie miasta (poza v0.1),
- Specjaliści (poza v0.1),
- Podział Handlu (domyślny 60/30/10) — kontrakt: EKONOMIA,
- Magazyny Surowców (placeholder słupki, v0.1 = dostęp boolean przez `getResourceAccess`),
- Kultura i Religia ( Religia = etap 2) — `getCultureState` dynamiczny,
- Footer nav (Mapa/Miasta/Nauka/Dyplomacja/Skarb/Zakończ turę).

### Konfiguracja (`CityPanelConfig`) — bogate haki
`getCities`, `getEpoch`, `getUnlockedTechs`, `getBuiltBuildingIds`, `getProduction`/`setProduction`, `getCityBuildingFlags`, `getUnitsAt`, `getTreasury` + `onRushBuy`, `onChange`, `onRename`, `onAutoManage`, `onArtView`, `getCultureState`, `getResourceAccess`, `getCityWorkedRange`, `getWorkedTiles`.

### Kluczowe detale
- AI cities (`ownerId !== 0`) → **read-only** (budowa/kolejka niedostępna, podgląd).
- `rush_cost_mnoznik` z `UI_PARAMS.panel_miasta`.
- Zasięg roboczy: `cityRangeForPopulation` (pop<5→5, pop≥5→10, pop≥10→15).
- Skala czcionki z `UI_PARAMS.panel_miasta.font_scale` (persistuje między re-renderami).
- API: `showCityPanel(city, map, onClose)`, `hideCityPanel()`, `isCityPanelOpen()` (backward-compatible), `configureCityPanel(config)`.

---

## 4. Panel Dyplomacji — `diplomacyPanel.ts` (261 linii)

**Cel:** przegląd relacji gracza z cywilizacjami + etykiety statusu.

### Skala 5 tierów (oficjalna, potwierdzona przez CYWILIZACJE)
```60:66:gra/src/ui/diplomacyPanel.ts
const TIER_LABEL: readonly string[] = [
  'Wojna',      // 0 — STAN (status='wojna'), nie próg score
  'Wrogi',      // 1
  'Neutralny',  // 2 — start relacji = 50
  'Przyjazny',  // 3
  'Sojusz',     // 4 — STAN (status='sojusz') LUB score >= 120
] as const;
```
- **UI NIE oblicza progów** — bierze gotowy `tier` z `getRelations()` (liczy SILNIK `diplomacy.relationTier`). Tier 0/4 = STAN (status), nie score.
- Kolory badge per tier (czerwony/pomarańcz/szary/jasnozielony/zielony-złoty).

### Konfiguracja
`getRelations(): DiploRelation[]` (civ, tier, zaufanie?, respekt?). Brak haka → placeholder 5 przykładowych cywilizacji (po jednym per tier: Spartanie/Hunowie/Chińczycy/Grecy/Egipcjanie).

### ⚠️ Status: v0.1 = PODGLĄD (tier + Zaufanie/Respekt)
- **BEZ akcji** (wojna/pakt) — akcje dyplomatyczne w osobnej iteracji po wpięciu `applyDiplomaticEvent` do pętli tury.
- API: `showDiplomacyPanel(config)`, `updateDiplomacyPanel()`, `hideDiplomacyPanel()`, `isDiplomacyPanelOpen()`.
- Pozycja: `top:60px; right:250px` (z-index 320).

---

## 5. Drzewko Technologii — `sciencePicker.ts` (1020 linii)

**Cel:** drzewko strefowe wg `Makieta-drzewko-technologii.html`. Gracz wybiera CEL badań klikając węzeł na SVG.

### Dane
Import `data/tech.json` (pola: `Technologia`, `Epoka`, `Poziom`, `Wymaga (prereq)`, `Odblokowuje budynek/surowiec`, `Koszt nauki`, `Uwagi`). Slugify nazw + resolve prereq (z fuzzy fallback pierwsze 6 znaków).

### Layout (port logiki makiety)
- 3 epoki w kolejności: `['Kamień', 'Brąz', 'Żelazo']`,
- **zoneCol = depth** wewnątrz epoki (max prereq depth + 1),
- **Barycenter sort** (3 passy) — sortowanie wierszy wg średniej wierszy prereq,
- stałe: `NW=162`, `NH=72`, `COL_STEP=260`, `ROW_STEP=100`, `DIVIDER_GAP=52`, `CROSS_LANE_STEP=8`, `LANE_STEP=6`.

### Edge routing
- **Intra-zone:** gutter lanes między kolumnami (kolory: Kamień zielony `#4a9030`, Brąz `#b07028`, Żelazo `#4080c0`),
- **Cross-epoch:** bottom lane (przerywana `5,3`, kolor złoty `#c09838`).

### Statusy węzłów
```480:492:gra/src/ui/sciencePicker.ts
type NodeStatus = 'researched' | 'target' | 'available' | 'locked';
function computeStatus(nodeId, targetId, researchedIds, availableIds): NodeStatus {
  if (researchedIds.has(nodeId)) return 'researched';
  if (nodeId === targetId) return 'target';
  if (availableIds.has(nodeId)) return 'available';
  return 'locked';
}
```
- ✓ zbadana (opacity 0.55), 🔒 zablokowana (0.35), ▶ dostępna (cursor pointer), ◉ cel (złota poświata + `glow-target`),
- **Panel ZOSTAJE otwarty** po wyborze celu — gracz widzi nowy cel podświetlony.

### Konfiguracja
`getResearchState(ownerId)` (pula, targetId, kosztCelu, postepFraction, turnsLeft), `getResearchedTechs`, `getAvailableTechs`, `onSelectTarget(techId)`. Brak haków → tryb podglądu (wszystkie tech jako dostępne).

### Tooltip + API
- Tooltip HTML (pozycjonowany fixed) z: nazwa, epoka, kolumna, koszt PN, status, wymaga, odblokowuje, uwagi ★,
- Pasek postępu górny: cel + pula/koszt + ETA + hint,
- Legenda 3 epok + statusy,
- API: `configureSciencePicker(cfg)`, `showSciencePicker(ownerId=0)`, `hideSciencePicker()`, `isSciencePickerOpen()`, zamykanie Esc/klik tła/✕.

---

## 6. Menu Główne — `mainMenu.ts` (238 linii)

**Cel:** menu + ekran ustawień globalnych (UI task 4). Wizualnie: ciemne + złoto, Palatino serif, ornamenty (wg `Makieta-flow-nowa-gra.html`).

### Konfiguracja (`MainMenuConfig`)
`version` (domyślnie `UI_PARAMS.menu.wersja`), `hasSave()` (włącza Kontynuuj/Wczytaj), callbacki: `onNewGame`, `onContinue`, `onLoad`, `onAbout`, `onQuit`, `onSettingsChange(values)`.

### Przyciski menu
- ◆ **Nowa Gra** (primary),
- Kontynuuj (disabled gdy `!hasSave`, hint „brak zapisów"),
- Wczytaj Grę (j.w.),
- Ustawienia,
- O Grze,
- Wyjdź.

### Ustawienia (z `UI_PARAMS.menu.ustawienia`)
Każde `MenuSetting`: `key/label/opts/descs/idx`. Sterowanie: przyciski ‹ › zmieniają `idx` modulo, wywołuje `onSettingsChange(getMenuSettings())`. Ekran ustawień: grid 2 kolumny, przycisk „Wstecz do menu".

### Emblemat
SVG inline (gwiazda + okrąg + krzyż) w okrągłej ramce.

### API
`showMainMenu(config?)`, `hideMainMenu()`, `isMainMenuOpen()`, `getMenuSettings()`.

---

## 7. Kreator Nowej Gry — `newGameFlow.ts` (428 linii)

**Cel:** wizard 5 kroków wg `Makieta-flow-nowa-gra.html`.

### Kroki
1. **Intro** — „NOWA GRA", opis, CTA „Rozpocznij konfigurację →",
2. **Cywilizacja** — grid kart (z `data/civs` przez `civsFromData`) + panel detail (styl, bonusy, jednostka specjalna, religia, typ główny),
3. **Epoka Startowa** — 3 epoki: Kamień/Braz (dostępne), Żelazo („Wkrótce", locked),
4. **Ustawienia Rozgrywki** — z `UI_PARAMS.nowa_gra.ustawienia` (difficulty, map_size, rival_count, game_speed) + przycisk „ROZPOCZNIJ GRĘ",
5. **Generowanie** — spinner + podsumowanie parametrów → wywołuje `cfg.onStart(params)`.

### Parametry wyjściowe (`NewGameParams`)
`civId, civName, epoch, difficulty, mapSize, rivals, speed, seed` (seed = `Math.floor(Math.random()*1e6)`).

### Nawigacja
Stepbar z 5 krokami (aktywny/done), przyciski Wstecz/Dalej (Dalej disabled gdy krok 2 bez wybranej cyw). Wstecz z kroku 1 → `onCancel()` + `hideNewGameFlow()`.

### API
`showNewGameFlow(config)`, `hideNewGameFlow()`, `isNewGameFlowOpen()`.

---

## 8. `uiParams.ts` (79 linii)

**Łańcuch:** `UI-parametry.xlsx` → (eksport celowany) → `data/ui-params.json` → ten moduł → `cityPanel.ts`/`mainMenu.ts`/`newGameFlow.ts`.

**Kluczowa zasada:** Naster edytuje Excel; **targeted export** pisze JSON (NIGDY pełny `export-data.py` — nadpisałby inne sesje). Moduły UI importują `UI_PARAMS` stąd → zmiana liczby w Excelu (po re-eksporcie) zmienia działającą grę.

### Struktura (`UiParams`)
- `panel_miasta`: `rush_cost_mnoznik`, `okolica_promien`, `okolica_hex_px`, `font_scale[]`, `font_scale_domyslna_px`,
- `menu`: `wersja`, `ustawienia[]`,
- `nowa_gra`: `ustawienia[]`.

---

## 9. Panel Zadowolenia/Porządku — `orderPanel.ts` (127 linii)

**Cel:** prezentacja mechaniki z `game/order.ts` (dział MIASTO).

### Stan (`OrderState`)
`szczescie`, `porzadek`, `progT1`, `progT2`, `bunt?`. Zadowolenie = Szczęście + Porządek.

### Tiers
- **T0** (spokój): `z ≥ progT1` → „✓ Spokój — miasto pracuje normalnie",
- **T1** (kary pracy): `progT2 ≤ z < progT1` → „⚠ T1 — miasto pracuje gorzej",
- **T2** (bunt): `z < progT2` LUB `bunt=true` → „🔥 T2 — BUNT".

### API
`showOrderPanel(cityId, config)`, `updateOrderPanel(cityId?)`, `hideOrderPanel()`, `isOrderPanelOpen()`. Brak haka → placeholder (szczęście 7, porządek 5, T1=8, T2=4). Pozycja `top:60px; right:12px`.

---

## 10. Bilans Imperium — `empireBalance.ts` (112 linii)

**Cel:** zbiorczy bilans zasobów imperium na turę (UI plan pkt 2).

### Stan
`EmpireBalance`: praca/pieniadz/nauka/kultura/zywnosc. `PlayerSnapshot`: skarbiec/nauka/era/badana?. `getTurn()`.

### Render
Wiersze z ikonami + signed wartościami (kolor: żywność green/red/gold, praca/kultura gold, pieniądz/nauka blue). Sekcja „tot": Skarbiec / Nauka (zapas) / Epoka / Badana.

### API
`showBalancePanel(config)`, `updateBalancePanel()`, `hideBalancePanel()`, `isBalancePanelOpen()`. Pozycja `top:60px; left:12px`. **Zero importów z `game/*`** — dane z ticku tury przez `getBalance()`.

---

## 11. Modal „Zajęty heks" — `armyStackPrompt.ts` (216 linii)

**Cel:** decyzja Macieja **#167** — UI pyta [Połącz armie] / [Nie łącz]; merge wykonuje UNITS.

### Opcje (`ArmyStackPromptOpts`)
`onMerge`, `onKeep`, `atakujacy?`, `cel?`.

### Zachowanie
- Modal z overlay (`z-index 500`),
- **Esc / klik tła → `onKeep()`** (nie `onMerge`),
- `hideArmyStackPrompt()` zamyka **bez** wywołania callbacków,
- Po zamknięciu wywołuje dokładnie **jeden** callback (nigdy oba).

### API
`showArmyStackPrompt(opts)`, `hideArmyStackPrompt()`, `isArmyStackPromptOpen()`.

---

## 12. Overlay Przed-Bitwą — `preBattle.ts` (1046 linii)

**Cel:** overlay przed bitwą — wybór trybu walki (auto/taktyczna/wycofaj). Wizualnie: ciemne + złoto, Georgia/Trebuchet (wg `Makieta-przed-bitwa.html`). **ASCII-only source** (polskie stringi przez `\uXXXX`).

### Dane wejściowe
`PreBattleInfo`: `atakujacy`/`obronca` (`PreBattleSide`: nazwa, cywilizacja?, units[]), `teren`, `szanseAtkPct`. `PreBattleUnit`: nazwa, kategoria, hp, maxHp, atak, ilosc?.

### Layout (3 kolumny grid `1fr 260px 1fr`)
- **Lewa/prawa panel** (atakujący/obrońca): role label (⚔ Atakujący / 🛡 Obrońca), nazwa cyw + flaga-dot, lista unit-chipów (ikona po kategorii — koń/luk/słoń/rydwan/falang/sztylet, HP bar, siła, ×ilość), łączna siła,
- **Środkowy panel**: region/teren badge 🏔, szanse na zwycięstwo (split bar atk/def + verdict Wysokie/Wyrównane/Niskie + prediction tekst),
- **Topbar**: kicker „The Game · Starcie", tytuł „UWARUNKOWANIA BITWY", subtitle, lokalizacja terenu,
- **Bottom bar**: 3 przyciski akcji:
  - ⚡ **[ROZEGRAJ AUTOMATYCZNIE]** (zielony) → `onAuto`,
  - 🏟 **[NA POLE BITWY]** (złoty) → `onBattlefield`,
  - ↩ **[WYCOFAJ]** (czerwony) → `onCancel`.

### API
`showPreBattle(info, cb)`, `hidePreBattle()`, `isPreBattleOpen()`. Wpięcie w `main.ts` L1443.

---

## 13. Overlay Zwycięstwa — NIE osobny plik w `ui/`

**Ważne:** w `gra/src/ui/` **NIE MA** osobnego modułu victory overlay. Overlay końca gry jest **inlined w `main.ts`** jako `showGameOverOverlay(msg, isVictory)` (linie 519–560):

```519:560:gra/src/main.ts
function showGameOverOverlay(msg: string, isVictory: boolean): void {
  const old = document.getElementById('__gameover_overlay__');
  if (old) old.remove();
  const overlay = document.createElement('div');
  overlay.id = '__gameover_overlay__';
  overlay.style.cssText = [
    'position:fixed', 'top:0', 'left:0', 'width:100%', 'height:100%',
    'background:rgba(0,0,0,0.82)', 'display:flex', 'flex-direction:column',
    'align-items:center', 'justify-content:center', 'z-index:9000',
    'font:bold 20px/1.4 serif', 'color:' + (isVictory ? '#ffd700' : '#ff6666'),
    'text-align:center', 'padding:20px',
  ].join(';');
  const title = document.createElement('div');
  title.innerHTML = msg;
  title.style.cssText = 'font-size:2em;margin-bottom:24px;text-shadow:0 0 20px currentColor';
  overlay.appendChild(title);
  const sub = document.createElement('div');
  sub.style.cssText = 'font-size:0.8em;color:#aaa;margin-bottom:32px';
  sub.textContent = isVictory ? 'Gratulacje! Zbudowales potezne imperium.' : 'Twoje panowanie dobieglo konca.';
  overlay.appendChild(sub);
  const btn = document.createElement('button');
  btn.textContent = 'Nowa gra';
  btn.style.cssText = [
    'padding:12px 32px', 'font:bold 16px serif',
    'background:' + (isVictory ? '#ffd700' : '#aa2222'), 'color:#111',
    'border:none', 'border-radius:8px', 'cursor:pointer', 'letter-spacing:0.05em',
  ].join(';');
  btn.addEventListener('click', () => { overlay.remove(); location.reload(); });
  overlay.appendChild(btn);
  document.body.appendChild(overlay);
}
```

### Logika (w `main.ts` L2419–2430)
Wywoływane po `checkVictory()` z `game/victory.ts`:
- **dominacja** → „ZWYCIESTWO! Dominacja (tura N)" (gold),
- **nauka** → „ZWYCIESTWO NAUKOWE! (tura N)" (gold),
- **przegrana** → „PRZEGRANA! Wszystkie miasta utracone (tura N)" (red),
- przycisk „Nowa gra" → `location.reload()`.

### ⚠️ Uwaga refaktor
Overlay victory łamie konwencję **DECOUPLED** — jest inlined w monolicie `main.ts` (zamiast osobnego modułu w `src/ui/victoryOverlay.ts`). Kandydat do ekstrakcji w przyszłym sprincie UI (zachowując `checkVictory` jako pure logikę w `game/`).

---

## 14. Zablokowane elementy — decyzje Macieja (wg `CURSOR-PLAN-DZIALANIA.md`)

### P0 — Odblokowują największy postęp
| ID | Temat | Status UI | Wątek |
|----|-------|-----------|-------|
| **6B** | **Układ widoku głównego / HUD** | **BLOK** — `hud.ts` istnieje, mockupy bez akceptacji. Opcje: A) obecny overlay B) Makieta v2 C) Hybryda (minimapa+panel). **Rekomendacja: C** | #6 |
| **UX-Q2–Q7** | UX bitwy (fazy, kontrola, kamera, tempo) | `preBattle.ts` istnieje (auto/taktyczna/wycofaj), ale Q2 najpierw: auto vs ręczna vs hybryda | #11 |

### Pozostałe blokady (nie-czysto-UI, ale dotykają UI)
| ID | Temat | Wpływ na UI |
|----|-------|-------------|
| **W1–W6** | Model Wealth | W4 = UI Wealth (brak panelu w `ui/`) |
| **U1** | Lista ulepszeń terenu + wartości | Render ulepszeń w MAPA, brak panelu |
| **7-go** | Plaster EKONOMIA+UI gotowy do wpiecia | Maciej: „idź" — wpiecie w SILNIK |

### Sprint 3 (S3.1) — po decyzji 6B
„HUD wg decyzji 6B + minimapa" — Composer, lane UI+MAPA.

---

## 15. Wzorce wspólne (potwierdzone we wszystkich modułach)

1. **DECOUPLED** — dane przez haki `*Config`, akcje przez callbacki, brak importów mutujących z `game/*`,
2. **CSS scoped** — `.civ-*` namespace, `ensureStyles()` z `STYLE_ID` (idempotentne, wstrzykiwane raz),
3. **DOM-only** — brak THREE.js, brak frameworków (czysty `document.createElement`),
4. **Placeholder graceful** — brak haka → reprezentatywny placeholder z badge „podgląd" (zamiast crash),
5. **API symetryczne** — `showX(config)`, `hideX()`, `isXOpen()`, często `updateX()`,
6. **Source encoding** — UTF-8 z polskimi literami + `\uXXXX`/encje HTML dla symboli (z wyjątkiem `preBattle.ts` — ASCII-only),
7. **Idempotentne montowanie** — `if (rootEl === null) create; else reuse`.

---

## 16. Rekomendacje (dla Macieja)

1. **Odblokuj 6B** — HUD `hud.ts` jest gotowy z minimapą (oba warianty A/B); rekomendacja C (hybryda) minimalizuje pracę,
2. **Ekstrakcja victory overlay** — przenieś `showGameOverOverlay` z `main.ts` (L519-560) do `src/ui/victoryOverlay.ts` (zachować DECOUPLED konwencję),
3. **Panel Wealth (W4)** — brak w `ui/`; zależy od decyzji W6 (scope v0.1),
4. **Dyplomacja v0.2** — `diplomacyPanel.ts` pasywny; akcje (wojna/pakt) po wpięciu `applyDiplomaticEvent`,
5. **Backupy `.bak-UI`** — 7 plików; rozważyć konsolidację/usunięcie po akceptacji iteracji (OneSync-ryzyko).