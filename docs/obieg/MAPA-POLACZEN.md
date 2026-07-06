# Mapa połączeń (coupling) — co się z czym łączy

**Właściciel:** Integrator (Grupa F). **Po co:** zanim wpniesz zmianę, sprawdź, czy nie dotyka wspólnego stanu / renderu / `main.ts`. To dokument żywy — Integrator dopisuje nowy coupling po każdym wpięciu.

Reguła: `.cursor/rules/zmiany-izolacja.mdc` · Decyzja: ISO-3 (`REJESTR-DECYZJI.md`).

## Jak czytać
- **🔴 wspólne (high)** — zmiana tu dotyka wielu grup → zawsze warstwa 🟡/🔴, kontrola Integratora.
- **🟠 współdzielone (med)** — kilka modułów czyta/pisze → uważaj.
- **🟢 lokalne** — w jednej grupie → warstwa 🟢, batch.

## Wspólne punkty (high) — TU najczęściej się psuje

| Punkt | Pliki | Dzieli z | Ryzyko | Pilnuje |
|---|---|---|---|---|
| Wiring całości | `gra/src/main.ts` | wszystkie moduły | 🔴 | Integrator (jedyny editor) |
| Wspólny stan gry | `game/playerState.ts`, `types/player.ts` | economy, cities, render, ui, combat, save, ai | 🔴 | Integrator + Master (kontrakt na zmianę struktury) |
| Save/Load | `game/save.ts` | każda zmiana struktury stanu | 🔴 | Integrator (migracja!) |
| Wspólna scena 3D | `render/scene.ts`, `render/camera.ts` | mapa, miasta, jednostki, zasoby, zasięg | 🔴 | Integrator |
| Ładowanie danych | `data/loader.ts` | wszystkie JSON (każdy panel sterowania) | 🟠 | Integrator |
| HUD shell | `ui/hud.ts` | wszystkie panele HUD (A/B/C/D/E podpinają się) | 🟠 | Grupa E + Integrator |

## Znany przypadek: „miasto zepsuło mapę"
Miasto i mapa **dzielą wspólną scenę 3D** (`render/scene.ts`) i ten sam stan (`playerState`). Zmiana renderu/stanu miasta (`render/cities.ts`, `render/stoneCity.ts`, `game/cities.ts`) może rozjechać kamerę/scenę mapy.
→ Każda zmiana dotykająca `render/*` lub `playerState` = **warstwa 🟡** (przez Integratora + bramka wizualna), nigdy 🟢 solo.

## Powiązania per grupa (zalążek — Integrator uzupełnia)

| Grupa | Jej moduły | Współdzieli z |
|---|---|---|
| A (mapa/HUD mapy) | `map/*`, `render/scene,camera,cities,units,resources`, `ui/minimapHud,mapToolbarHud` | scena 3D (🔴) + playerState (🔴) |
| B (ekonomia/miasto/nauka) | `game/economy*,cities,production,wealth,research,*`, `ui/cityPanel,orderPanel,sciencePicker` | playerState (🔴), scena przez render/cities (🔴), save (🔴) |
| C (walka) | `game/combat,siege*`, `battle/*`, `render/units,siege*`, `ui/preBattle` | playerState (🔴), scena 3D (🔴) |
| D (cywilizacje/dyplo/AI) | `game/ai,barbarians,diplomacy*,civ-*,victory`, `data/*`, `ui/diplomacy*` | loader/JSON (🟠), playerState (🔴) |
| E (start/meta/UI) | `ui/mainMenu,newGameFlow,hud`, meta | hud shell (🟠), newGame→cały stan (🔴) |
| F (Integrator) | `main.ts`, build, `Gra-podglad-ROBOCZA.html` | **wszystko** |
