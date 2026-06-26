# HANDOFF: UI → MASTER — moduł sciencePicker.ts (picker celu badań, #182)

**Data:** 2026-06-25 · Gotowe do wpięcia. Walidacja składni: PASS (transpile, klamry 56/56). Bez kanonu.

## Plik
`gra/src/ui/sciencePicker.ts` (nowy, addytywny — wzorzec jak diplomacyPanel/orderPanel).
Podgląd do akceptacji Macieja: `UI/Gra-podglad-NAUKA.html`.

## API
- `configureSciencePicker(cfg)` — wstrzyknięcie haków (raz na starcie).
- `showSciencePicker(ownerId?=0)` / `hideSciencePicker()` / `isSciencePickerOpen()`.

## Haki configa (wszystkie opcjonalne, graceful degradation)
- `getAvailableTechs(ownerId) => {id, nazwa, koszt, opis?, prereqi?}[]` — techy z prereqami spełnionymi, nie-ukończone.
- `getCurrentTarget(ownerId) => string | null` — bieżący cel badań.
- `getSciencePool(ownerId) => number` — pula nauki.
- `onSelectTarget(techId) => void` — UI woła to po kliknięciu; SILNIK realizuje `setPlayerResearchTarget(techId)`.

## Wpięcie (master)
1. `import { configureSciencePicker, showSciencePicker } from './ui/sciencePicker'` w main.ts.
2. `configureSciencePicker({ getAvailableTechs, getCurrentTarget, getSciencePool, onSelectTarget })` — podłącz do silnika nauki.
3. Podłącz przycisk „Nauka" (HUD/stopka cityPanel) -> `showSciencePicker(0)`.
4. Silnik wystawia: `setPlayerResearchTarget(techId)`, listę dostępnych techów, pulę.

## DoD
Klik „Nauka" otwiera listę dostępnych technologii; wybór woła `setPlayerResearchTarget`; pasek pokazuje pula vs koszt celu; bieżący cel oznaczony.

## Zależności
SILNIK/CYWILIZACJE (tech.json/AI): lista dostępnych + pula + setter celu. UI = tylko prezentacja + zwrot wyboru.
