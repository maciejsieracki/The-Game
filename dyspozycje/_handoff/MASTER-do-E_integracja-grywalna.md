# DYSPOZYCJA P0 — Grupa E: mapa połączeń → handoff do Silnika (grywalny flow)

**Data:** 2026-06-27  
**Od:** Master Silnik (na polecenie Macieja)  
**Do:** Grupa E (lane UI / meta / start)  
**Priorytet:** **P0** — blokuje spójność gry; bez tego mockupy i silnik żyją osobno.

---

## Cel (jedno zdanie)

**Jeden grywalny łańcuch:** `Gra-podglad.html` → menu → Nowa gra → kreator (5 kroków) → generacja świata → mapa z HUD D1B — **bez** lądowania w mockupie `UI/Makieta-HUD-D1B-preview.html`.

Maciej testuje **tylko ten plik** (kanon). Mockupy HTML służą jako **referencja wyglądu**, nie jako gra.

---

## Problem

| Objaw | Przyczyna |
|-------|-----------|
| Po „Nowa gra” w `UI/Gra-podglad-MENU.html` ląduje się w mockupie D1B | Makieta ma własny routing (`Makieta-flow-nowa-gra.html` → `Makieta-HUD-D1B-preview.html`) — **to nie jest silnik** |
| Kod startu jest w `main.ts`, UI w `gra/src/ui/*`, a `Gra-podglad.html` bywa starszy od źródła | Brak **jednego dokumentu E → SILNIK**: co z czym połączyć i jak |
| Stary HUD (legenda „B = załóż miasto”, „Wiara”) obok modułu `hud.ts` | Częściowe wpięcie D1B w F; E musi dać F **kompletną mapę callbacków** |

**Twoja rola:** nie wpinasz `main.ts` — dostarczasz **mapę integracji + gotowy handoff**, żeby Grupa F mogła to spiąć jednym batchiem i zbudować kanon.

---

## Zadania E (kolejność)

### E-P0-01 — UX kreatora (E1-UX-01)

**Plik:** `gra/src/ui/newGameFlow.ts` (+ CSS w tym samym pliku)

- Kroki **2–4**: dolna nawigacja (`← Wstecz` · `Krok X z 5` · `Dalej →` / `ROZPOCZNIJ GRĘ`) **tuż pod** treścią kroku — bez dużej pustej przestrzeni (playtest Macieja).
- Krok **5** w stepperze: etykieta **`Generowanie`** (nie `Start`) — zgodnie z komentarzem modułu i mockupem E.
- Krok 5: `onStart(params)` wywoływany **raz**; UI kreatora znika po stronie silnika (`hideNewGameFlow` w F — **udokumentuj** w handoffu).

### E-P0-02 — Mapa połączeń (DELIVERABLE główny)

Uzupełnij tabelę w **`dyspozycje/_handoff/E-do-SILNIK_wpiecie-grywalne.md`** (szablon poniżej — **Ty wypełniasz i podpisujesz**).

Minimum **15 wierszy** obejmujących cały flow od bootu do pierwszej tury na mapie.

### E-P0-03 — Oznaczenie ścieżek dla Macieja

**Plik:** `UI/Makieta-START.html` (tylko banner + linki — bez zmiany mockupów)

- Wyraźny baner: **„MOCKUP UI — nie pełna gra”**.
- Przycisk **„Gra (kanon)”** → `../Gra-podglad.html` (względna ścieżka z `UI/`).
- Nie usuwaj mockupów — tylko **nie myl** z grą.

### E-P0-04 — Raport

W `docs/czaty/DO-MASTERA.md` § **Grupa E** wpis:

```
→ SILNIK: GOTOWE (E-P0 integracja grywalna)
Handoff: dyspozycje/_handoff/E-do-SILNIK_wpiecie-grywalne.md
```

W `dyspozycje/UI-DO-MASTERA.md` — skrót tego samego.

---

## Mapa połączeń (stan wyjściowy — E uzupełnia i koryguje)

E: zweryfikuj każdy wiersz w kodzie; popraw Status; dodaj brakujące.

### A. Wejście → menu → kreator

| # | Ekran / akcja | Moduł UI (`gra/src/ui/`) | Kontrakt (callback / dane) | Kto wpina (`main.ts`) | Status |
|---|---------------|--------------------------|----------------------------|------------------------|--------|
| A1 | Boot gry | — | `boot()` → `showMainMenu` | F | wpięte |
| A2 | Menu → Nowa gra | `mainMenu.ts` | `onNewGame()` → `hideMainMenu` + `showNewGameFlow` | F | wpięte |
| A3 | Menu → Kontynuuj / Wczytaj | `mainMenu.ts` | `onContinue` / `onLoad` → `doLoadGame` | F | wpięte |
| A4 | Menu → Ustawienia | `mainMenu.ts` | `onSettingsChange` (opcjonalnie) | F | sprawdź |
| A5 | Kreator krok 1–4 | `newGameFlow.ts` | nawigacja wewnętrzna | E (layout) | E1-UX-01 |
| A6 | Kreator krok 5 | `newGameFlow.ts` | `onStart(NewGameParams)` | F → `doStartGame` | wpięte |
| A7 | Powrót z kreatora | `newGameFlow.ts` | `onCancel()` → menu | F | wpięte |

### B. `NewGameParams` → silnik

| Pole | Źródło UI | Użycie w silniku (F) | Status |
|------|-----------|----------------------|--------|
| `civId` | krok 2 | `applyMenuParams`, bonusy | wpięte |
| `epochId` | krok 3 | epoka startowa, tech | wpięte |
| `typSwiata`, `seed` | krok 4 | `generujSwiat` | wpięte |
| `mapSize`, `rivals` | krok 4 | rozmiar, `placeStartingUnits` | wpięte |
| `difficulty`, `speed` | krok 4 | ekonomia / AI | sprawdź F |

Handoff E1: `dyspozycje/_handoff/UI-MAPA-do-MASTER_E1-defaulty-startu.md`

### C. Po starcie gry (mapa) — HUD D1B

Referencja layoutu: `UI/Makieta-HUD-D1B-preview.html` + `dyspozycje/_handoff/UI-do-MASTER_hud-D1B-mockupy.md`

| # | Klik / strefa | Moduł UI | Callback w `HudConfig` / toolbar | Implementacja F (`mountD1bHud`) | Status |
|---|---------------|----------|----------------------------------|--------------------------------|--------|
| C1 | Górny pasek zasobów | `hud.ts` | `getState()` | `buildHudState` | wpięte |
| C2 | Minimapa | `minimapHud.ts` | `getMinimapData()` | MAPA lane | sprawdź fog |
| C3 | Koniec tury / G1 | `hud.ts` | `onEndTurn`, `onExecutePending`, `canEndTurn` | F | wpięte |
| C4 | Nauka | `sciencePicker.ts` | `mapToolbar.onOpenScience` | F | wpięte |
| C5 | Dyplomacja | `diplomacyPanel.ts` | `onOpenDiplomacy` | F | wpięte |
| C6 | Miasto / lista miast | `cityPanel.ts` | `onOpenCities` | F | wpięte |
| C7 | Menu w grze | `mainMenu.ts` | `onOpenMenu` | F — sprawdź | ? |
| C8 | Budowa / 🔨 | `buildModeHud.ts` | `buildMode` w `HudConfig` | F + A-START | częściowe |
| C9 | Panel jednostki | `unitPanelHud.ts` | `unitPanel` | F | wpięte |
| C10 | Pre-bitwa | `preBattle.ts` | blocking events | F / C1 | częściowe |
| C11 | Kultura / Religia | overlay TBD | `onOpenCulture` / `onOpenReligion` | stub toast | otwarte A1-Q12 |
| C12 | Wojsko | panel armii TBD | `onOpenArmy` | brak modułu | UNITS |

**E:** dla każdego wiersza ze statusem `?` / `stub` / `brak` — wpisz w handoffu **co F ma zrobić** (konkretna funkcja w `main.ts`, argumenty).

### D. Czego NIE łączyć

| Ścieżka | Dlaczego |
|---------|----------|
| `UI/Makieta-flow-nowa-gra.html` → `Makieta-HUD-D1B-preview.html` | Mockup — **nie** callback silnika |
| `UI/Gra-podglad-MENU.html` jako gra | Tylko podgląd menu; gra = `Gra-podglad.html` |
| iframe z mockup-embed.js w kanonie | Decyzja techniczna: jeden DOM Vite (patrz handoff D1B) |

---

## Definition of Done (grywalne)

Maciej po buildzie F (`Gra-podglad.html` zaktualizowany) może:

1. Dwuklik `Gra-podglad.html` → **menu** (nie mapa od razu, chyba że playtest URL).
2. **Nowa gra** → kreator **5 kroków** → krok 5 **„Generowanie świata…”** → **mapa 3D**.
3. Na mapie: **HUD D1B** (nie stara legenda dolna z samym tekstem sterowania).
4. Start A-START (0 jednostki, Załóż miasto) — **wpięcie F** wg Twojego handoffu sekcji B + `DO-MASTERA` § A; E tylko **opisuje** wymagane hooki UI (`buildModeHud.canFoundCity` itd.).
5. **Nauka** i **Dyplomacja** otwierają prawdziwe panele (nie toast „w rozwoju”), o ile F podłączył według handoffu.

---

## Granice lane

| Plik | E | F (Silnik) |
|------|---|------------|
| `gra/src/ui/*` | **TAK** | tylko import/wire |
| `gra/src/main.ts` | **NIE** | **TAK** |
| `Gra-podglad.html` | **NIE** | build po bramce |
| `UI/Makieta-*` | banner/linki P0-03 | NIE |

---

## Po zakończeniu

1. Wypełniony: `dyspozycje/_handoff/E-do-SILNIK_wpiecie-grywalne.md`
2. Flaga: `→ SILNIK: GOTOWE` w `DO-MASTERA.md` § E
3. Grupa F bierze **wyłącznie** Twój handoff + `F-KOLEJKA-P0.md` — **bez** dopytywania Macieja o technikę

**Master nie zamyka P0 F** dopóki F nie potwierdzi wdrożenia punktów z Twojego handoffu w buildzie kanonu.
