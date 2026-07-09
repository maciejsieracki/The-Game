# Panel A — Plony terenu (Żywność / Praca / Handel)

> SYNC-PANELI [17:05, 2026-07-08]: plony terenu **scalone do `Panel-A.xlsx`** (arkusze Teren-bazowy + Bonusy-nakladki). Dawny `Panel-A-Plony-Terenu.xlsx` wycofany → `panele-sterowania/archiwum/`. Stary arkusz `Plony-terenow` w Panel-A usunięty (był rozbieżnym źródłem).

1. Otwórz `Panel-A.xlsx` — arkusze **Teren-bazowy** i **Bonusy-nakladki**.
2. Edytuj kolumny Żywność, Praca, Handel (oraz Uwagi); zapisz plik.
3. W czacie napisz: **eksportuj plony terenu** — agent zaktualizuje `gra/data/terrain-yields.json`.
4. Regeneracja z JSON: `python panele-sterowania/generate-terrain-yields-xlsx.py` (agent, nie Maciej).
