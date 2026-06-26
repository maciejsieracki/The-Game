# HANDOFF: UI → MASTER (przepnij do MAPA) — Render terytorium/okolicy na mapie świata

**Data:** 2026-06-25 · Routing: przez mastera (UI nie pisze wprost do MAPA).
**Decyzja Macieja:** WARIANT B — panel miasta pokazuje okolicę KOMPAKTOWO; pełne terytorium renderuje MAPA na mapie świata.

## Co UI już zrobiło (lane UI, gotowe)
W `gra/src/ui/cityPanel.ts` sekcja „Okolica" jest kompaktowa: zasięg roboczy (r5/10/15), liczba pól w zasięgu, pól obrabianych (N=populacja), granica kultury (+0..3) i mały podgląd pól obrabianych. Dane bierze z addytywnych haków (patrz niżej). Bez nowego renderera świata po stronie UI.

## Prośba do MAPA: overlay terytorium na mapie świata
Dla każdego miasta (na żądanie / dla zaznaczonego / dla miast gracza) narysować na mapie świata:
1. **Obwódka zasięgu roboczego** — promień = `getCityWorkedRange(cityId)` (r5 / r10 / r15 wg populacji).
2. **Podświetlenie pól obrabianych** — zbiór `getWorkedTiles(cityId) => {q,r}[]` (N = populacja; podzbiór zasięgu).
3. **Granica kulturowa** — dodatkowe pierścienie = `getCultureState(cityId).borderRadius` (+0..3), ADDYTYWNIE nad zasięgiem roboczym (osobny styl linii niż obwódka robocza).

## Kontrakt danych (wspólny — to samo czyta panel UI i mapa)
Haki dostarcza EKONOMIA (po scaleniu `okolica.ts` / `culture-religion.ts` w jej lane), patrz `EKONOMIA-do-UI_okolica-nastroje.md`:
- `getCityWorkedRange(cityId) => number`  (= cityRangeForPopulation(pop): pop<5→5, ≥5→10, ≥10→15)
- `getWorkedTiles(cityId) => {q,r}[]`      (= assignWorkedTiles: N najlepszych, N=pop)
- `getCultureState(cityId).borderRadius => 0..3`  (cityBorderRadius(kultura))

Spójność panel↔mapa zapewniona, bo oba źródła czytają TE SAME haki.

## Zakres v0.1 (propozycja)
Statyczny overlay wystarczy: obwódka (range) + wypełnienie/obrys pól obrabianych + linia granicy kultury. Interaktywne klikanie pól (zamiana worked tile) — później, nie v0.1.

## Pytanie do MAPA (format ABC)
1) Jak MAPA woli czytać te dane? — A) przez własny config-hook (jak UI: `getCityWorkedRange/getWorkedTiles/getCultureState`)  B) przez wspólny selektor stanu z EKONOMIA/SILNIK (jedno źródło)  [rekomendacja: B, jedno źródło prawdy — mniej rozjazdów].
2) Czy overlay rysować dla wszystkich miast naraz czy tylko dla zaznaczonego/aktywnego? — A) tylko zaznaczone (lekko)  B) wszystkie miasta gracza  C) wszystkie + AI (ciężko)  [rekomendacja: A na v0.1].
