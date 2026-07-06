# 🎛️ Panele sterowania — balans gry (dla Macieja)

> **Tu kręcisz parametrami gry.** Jeden plik Excel na grupę. Zmieniasz wartość → uruchamiasz eksport → zmiana trafia do gry.

| Plik | Grupa | Czym kręcisz |
|---|---|---|
| `Panel-A.xlsx` | A — Mapa | generator mapy, mgła, ulepszenia terenu, zasięgi |
| `Panel-B.xlsx` | B — Miasto/Ekonomia/Społeczeństwo | miasto, okolica, Wealth, szczęście, zdrowie, kultura, religia, porządek, **Power P-A**, **Manpower/epoki** |
| `Panel-C.xlsx` | C — Walka | macierz jednostek, stałe walki, oblężenie, **auto-walka (2 mnożniki strat)** |
| `Panel-D.xlsx` | D — Cywilizacje/Dyplomacja/AI | dyplomacja, AI, barbarzyńcy, macierz Cyw-01…11 |
| `Panel-E.xlsx` | E — Start/Meta/UI | defaulty kreatora, zwycięstwo, trudność/skala AI (**nie koliduje z FOOD-HODOWLA**) |

**Grupa A:** `gen-panel-a.py` → `export-a.py` · test: `test-panel-a-roundtrip.py` · inwentaryzacja: `docs/obieg/A-PANEL-INWENTARYZACJA.md`

**Grupa B:** `python panele-sterowania/gen-panel-b.py` → `export-b.py` · test: `test-panel-b-roundtrip.py` · inwentaryzacja: `docs/grupa-b/B-PANEL-INWENTARYZACJA.md` · **Power:** arkusze `Potega-P-A`, `Potega-opcje`, `Manpower-epoki`

**Grupa D:** `python panele-sterowania/gen-panel-d.py` → `export-d.py` · **Cyw-macierz:** `gen-cyw-macierz.py` → `export-cyw-macierz.py` (11 domen, bez wag Power)

**Grupa C:** `python panele-sterowania/gen-panel-c.py` → `export-c.py` · **Auto-walka:** arkusz **Auto-walka** → `auto-battle-params.json` (coef_zwyciezca, coef_przegrany) · **Moc:** arkusze **Stale-moc** + **Moc-jednostek** (read-only) · test: `node gra/tools/unit-power-test.cjs`


**Jak używać (Maciej):** otwórz plik → zmień kolumnę „Wartość" → napisz w czacie grupy **eksportuj panel** (agent odpala export). B/C/D/E: ten sam model.

Specyfikacja: `docs/obieg/PANEL-STEROWANIA-SPEC.md`.
