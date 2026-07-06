# Mapowanie: lane techniczny → czat Cursor (Grupa A–F)

> **Pełny słownik:** `docs/obieg/NAZEWNICTWO-GRUP.md`  
> **Od 2026-06-29:** w komunikacji używamy **wyłącznie Grupa A–F** (zakładki w Cursor), nie starych nazw lane (`MAPA`, `EKONOMIA`, `UNITS`, `CYWILIZACJE`, `UI`, `SILNIK`).  
> **Foldery** `Civ-MAPA/`, `Civ-UNITS/`, `Civ-CYWILIZACJE/` — nazwy katalogów na dysku; **nie zmieniamy**.

| Stara nazwa czatu / lane | Twój czat Cursor | Tematy (domena) |
|--------------------------|------------------|-----------------|
| lane `MAPA`, „Grupa MAPA" | **Grupa A** | mapa 3D, render, ruch, ulepszenia terenu, mgła, minimapa, **HUD mapy** (paski, toolbar, koniec tury, panel jednostki), preBattle C1, oblężenie C3 (wejście z mapy) |
| `MIASTO`, `EKONOMIA` | **Grupa B** | panel miasta (`cityPanel`), produkcja, surowce, Wealth, żywność, Power, **drzewko technologii + nauka** |
| `UNITS` | **Grupa C** | bitwa 3D C2, macierz C4, combat — od wyboru Auto/Ręczna, oblężenie na polu bitwy |
| `CYW`, `CYWILIZACJE`, `DANE`, `DYPLOMACJA`, `AI` | **Grupa D** | `civs.json`, bonusy nacji, dyplomacja (audiencja), **AI rywali + archetypy + barbarzyńcy** |
| `Meta`, menu/start, `UX`/`UI` (jako grupa) | **Grupa E** | menu główne, kreator nowej gry, defaulty startu, warunki zwycięstwa (meta), globalny shell UI/menu |
| `Silnik`, `SILNIK` (jako rola) | **Grupa F (Integrator)** | `main.ts`, wpięcia, bramka testów, `Gra-podglad-ROBOCZA.html` |

## Pliki UI — podział na grupy

Pliki `gra/src/ui/*` nadal = lane **UI** w dyspozycjach (`UI.md`, `UI-DO-MASTERA.md`), ale **czat** zależy od tematu:

| Temat UI | Czat |
|----------|------|
| Menu, newGameFlow, start gry, globalny shell | **Grupa E** |
| Panel miasta (`cityPanel.ts`) | **Grupa B** |
| HUD mapy, preBattle, minimapa, pickery mapy | **Grupa A** |
| UX bitwy 3D | **Grupa C** |
| Panel dyplomacji | **Grupa D** |

## Pliki dyspozycji (lane) — bez zmiany nazwy

| Plik lane | Grupa domyślna |
|-----------|----------------|
| `dyspozycje/MAPA.md` | A |
| `dyspozycje/EKONOMIA.md` | B |
| `dyspozycje/UNITS.md` | C |
| `dyspozycje/CYWILIZACJE.md` | D |
| `dyspozycje/UI.md` | A / B / C / D / E (patrz tabela wyżej) |
| `dyspozycje/SILNIK.md` | F |

## Flagi przepływu

| Stara flaga | Kanon |
|-------------|-------|
| `→ SILNIK: GOTOWE` | `→ INTEGRATOR: GOTOWE` |
| Raport do Master Silnika | Raport do **Master** |
| Kanał operacyjny DO/OD-MASTERA | `docs/obieg/<grupa>.md` + `docs/obieg/INTEGRATOR-kolejka.md` |
