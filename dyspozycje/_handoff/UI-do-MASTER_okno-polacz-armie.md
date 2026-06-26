# HANDOFF: UI → MASTER — moduł armyStackPrompt.ts (okno „połącz armie", #167)

**Data:** 2026-06-25 · Gotowe do wpięcia. Walidacja składni: PASS (transpile, klamry 32/32). Bez kanonu.

## Plik
`gra/src/ui/armyStackPrompt.ts` (nowy, addytywny, scoped CSS `.civ-stack`).

## API
- `showArmyStackPrompt({ onMerge, onKeep, atakujacy?, cel? })` — pokazuje modal wyboru.
- `hideArmyStackPrompt()` / `isArmyStackPromptOpen()`.

## Zachowanie (wg decyzji Macieja #167)
Gdy jednostka/armia wchodzi na ZAJĘTY heks: modal `[Połącz armie]` / `[Nie łącz]`.
- `[Połącz armie]` -> `onMerge()` (UNITS scala) + zamknięcie.
- `[Nie łącz]` / Esc / klik w tło -> `onKeep()` (jednostki stoją osobno na tym samym heksie) + zamknięcie.
UI tylko pyta i zwraca wybór — model stackowania/merge trzyma UNITS.

## Wpięcie (master + UNITS)
Gdy logika ruchu (UNITS) wykryje wejście na zajęty heks -> wywołaj `showArmyStackPrompt({ onMerge: () => unitsMerge(...), onKeep: () => unitsKeepSeparate(...) })`.

## DoD
Wejście na zajęty heks pokazuje modal; przyciski wołają właściwe callbacki; brak innego UX (pełny panel transferu = osobny task #170/#178, makieta do akceptacji).

## Zależności
UNITS: model merge/stacking (kontrakt merge/keep). To okno rozszerza się później w pełny panel transferu (#170/#178) — patrz makieta `UI/Makieta-panel-armii.html`.
