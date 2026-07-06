# HANDOFF: Grupa E → Grupa F (Silnik) — wpięcie grywalnego flow

**Status:** **SZABLON — wypełnia Grupa E** po E-P0 (`MASTER-do-E_integracja-grywalna.md`)  
**Data:** ___________  
**Od:** Grupa E  
**Do:** Grupa F  
**Flaga po wypełnieniu:** `→ SILNIK: GOTOWE` w `DO-MASTERA.md` § E

---

## 1. Jedna ścieżka playtestu (dla Macieja i F)

| Krok | Plik / akcja | Oczekiwany wynik |
|------|--------------|------------------|
| 1 | Dwuklik `Gra-podglad.html` | Menu główne (`mainMenu.ts`) |
| 2 | **Nowa gra** | Kreator (`newGameFlow.ts`), krok 1 |
| 3 | Kroki 1→5 | Krok 5: animacja + `onStart(params)` |
| 4 | Po kroku 5 | Mapa 3D + HUD D1B, **bez** mockupu HTML |

**NIE używać do playtestu gameplayu:** `UI/Makieta-START.html`, `Makieta-flow-nowa-gra.html`, `Makieta-HUD-D1B-preview.html`.

---

## 2. Sekwencja boot (F — `main.ts`)

E: opisz dokładnie kolejność wywołań po `DOMContentLoaded`. Szablon:

```
boot()
  → init scene / canvas (...)
  → showMainMenu({
       onNewGame: () => { hideMainMenu(); showNewGameFlow({ ... }); },
       onStart: (params) => doStartGame(params),  // przez onStart w newGameFlow
     })
```

| Krok | Funkcja F | Moduł UI | Uwagi E |
|------|-----------|----------|---------|
| 1 | | | |
| 2 | | | |
| … | | | |

---

## 3. `doStartGame(params)` — mapowanie parametrów

| `NewGameParams` | Pole w `doStartGame` / silniku | Plik F | Uwagi |
|-----------------|--------------------------------|--------|-------|
| `civId` | | | |
| `epochId` | | | |
| `typSwiata` | | | |
| `seed` | | | |
| `mapSize` | | | |
| `rivals` | | | |
| `difficulty` | | | |

**Po `generujSwiat` F musi wywołać (A-START — potwierdź nazwy z kodu):**

| Akcja | Funkcja F | Hook UI wymagany od E |
|-------|-----------|------------------------|
| Usuń jednostki gracza na starcie | `stripPlayerUnitsKeepStartHex()` | — |
| Eksploracja startowa / mgła | `seedStartingExplored()` | minimapa: `getMinimapData` + fog |
| Onboarding miasta | `beginOnboardingFoundCity()` | `buildModeHud`: `canFoundCity`, `isFoundCityActive` |
| Ukryj kreator | `hideNewGameFlow()` | — |
| Pokaż HUD | `mountD1bHud()` / `showHud()` | pełny `HudConfig` poniżej |
| Start pętli render | `renderLoop()` | — |

---

## 4. `HudConfig` — pełna lista callbacków (F w `mountD1bHud`)

E: wypełnij **każdy** klucz z `gra/src/ui/hud.ts` → `HudConfig` i `MapToolbarHudConfig`.

| Klucz / akcja | Moduł docelowy | Funkcja F do wywołania | Gotowe? (TAK/NIE/CZĘŚCIOWO) |
|---------------|----------------|------------------------|----------------------------|
| `getState` | `hud.ts` | `buildHudState` | |
| `onEndTurn` | `hud.ts` | symulacja klawisza N / `endTurn` | |
| `onOpenMenu` | `mainMenu.ts` | `showMainMenu` + pause? | |
| `onOpenScience` | `sciencePicker.ts` | `showSciencePicker(0)` | |
| `onOpenDiplomacy` | `diplomacyPanel.ts` | `showDiplomacyPanel(...)` | |
| `onOpenCities` | `cityPanel.ts` | `showCityPanel(...)` | |
| `getMinimapData` | `minimapHud.ts` | MAPA export | |
| `buildMode.*` | `buildModeHud.ts` | tryb budowy + found city | |
| `unitPanel.*` | `unitPanelHud.ts` | `buildUnitPanelState` | |
| `onExecutePending` | blocking | `executeFirstBlockingEvent` | |
| `mapToolbar.onOpenCulture` | TBD | stub / panel | |
| `mapToolbar.onOpenReligion` | TBD | stub / panel | |
| `mapToolbar.onOpenWonders` | TBD | v1.0 defer | |
| `mapToolbar.onOpenArmy` | TBD | UNITS kontrakt | |

---

## 5. Rzeczy do usunięcia / wyłączenia w F (stary UI)

E: lista elementów, które **konfliktują** z D1B i psują wrażenie „grywalne”:

| Element | Gdzie dziś | Co F ma zrobić |
|---------|------------|----------------|
| Stara legenda dolna (Pan/zoom/B/T…) | `main.ts` `hud.innerHTML` | ukryć gdy `d1bHudActive` |
| Stare przyciski Nauka/Dyplomacja poza HUD | `sciBtn`, `diploBtn` | już `display:none` — potwierdź |
| Boot bez menu (sandbox) | ? | tylko `?playtest=` / dev |

---

## 6. Zależności od innych lane (nie UI)

| Temat | Lane | Plik handoff | Blokuje grywalność? |
|-------|------|--------------|---------------------|
| A-START na mapie | A / F | `DO-MASTERA` § A-START | TAK — bez miasta |
| Minimapa + mgła | MAPA / F | | TAK |
| Atak z mapy | A / C1 | | NIE na start |
| Bonusy cywilizacji FAIL | D | `SILNIK-DO-MASTERA` TESTY-GR-D | NIE na pierwszy start |

---

## 7. Checklist buildu F (E nie odpala — tylko definiuje)

Po `vite build` → `Gra-podglad.html` F sprawdza:

- [ ] Menu → Nowa gra → kreator → mapa (bez błędu konsoli)
- [ ] HUD D1B widoczny; stara legenda ukryta
- [ ] Krok 5 kreatora: etykieta „Generowanie”
- [ ] `md5` nowego `Gra-podglad.html` w raporcie F

---

## 8. Podpis Grupy E

| Pole | Wartość |
|------|---------|
| Wykonane zadania | E-P0-01 … E-P0-04 |
| Pliki zmienione | |
| Testy E (`tsc --noEmit`) | |
| **→ SILNIK: GOTOWE** | TAK / NIE |

**Uwagi dla F:**

_(wolne pole)_
