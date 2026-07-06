# Panel E1 — spec dla Excel i trackerów

> Gdy odtwarzasz **`UI/UI-parametry.xlsx`** lub aktualizujesz **`Status-projektu-The-Game.xlsx`**.

Kanon dziś (bez Excela): `gra/data/ui-params.json`  
Eksport docelowy: **`gra/tools/export-ui-params.py`** (do utworzenia — NIGDY pełny `export-data.py`)

---

## Arkusz `Nowa-gra` (UI-parametry.xlsx)

| key | label | opts (kolejność) | domyslny idx | descs |
|-----|-------|------------------|--------------|-------|
| difficulty | Poziom trudności | Łatwy, Normalny, Trudny | **1** | Łagodne AI / Klasyczna / Agresywne |
| map_size | Rozmiar mapy | Malenki, Mały, Standardowy, Duży, Ogromny | **2** | ~hex jak w JSON |
| **world_type** | Typ świata | Kontynenty, Pangea, Wyspy, **Ziemia** | **0** | opisy jak JSON |
| rival_count | Liczba rywali | *(dynamiczne)* | 0 | „Skalowane do mapy" |
| game_speed | Prędkość gry | Standardowa, Szybka, Długa | **0** | |

**Uwaga:** `rival_count` w Excelu = dokumentacja; w grze wartości ustawia `newGameMapDefaults.rywaleMenuForMapLabel()`.

---

## Status-projektu-The-Game.xlsx

Skrypt: `gra/tools/append-e1-status-xlsx.py`  
Arkusz sugerowany: **`Civ-UI`** lub nowy **`Grupa-E`**

Kolumny (jak HUD-mapa-kliki): ID, Temat, Status, Data, Decyzja, Uwagi

---

## MACIEJ-KARTA-DECYZJI.md

Pod **D13** dopisać szczegóły E1 (link do `docs/grupa-e/decyzje/E1-nowa-gra.md`):

- Standardowy 84×60 (nie Mała)
- 6 rywali przy Standard
- 4 typy świata + Ziemia

---

## Mockupy do sync

| Plik | Brakuje vs E1 |
|------|----------------|
| `UI/Makieta-flow-nowa-gra.html` | world_type, 5 rozmiarów, Rzym preselect, 9 cyw |
| `UI/Gra-podglad-MENU.html` | Q6–Q8 wizja (po ABC) |
