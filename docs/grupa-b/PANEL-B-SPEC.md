# Panel B — spec (hub balansu Grupy B)

> **Hub:** `panele-sterowania/Panel-B.xlsx` · **Inwentaryzacja:** `docs/grupa-b/B-PANEL-INWENTARYZACJA.md`  
> **Spec wspólna:** `docs/obieg/PANEL-STEROWANIA-SPEC.md`

## Maciej — jak kręcić balans

1. Otwórz `panele-sterowania/Panel-B.xlsx`.
2. Zmień kolumnę **Wartość** w odpowiednim arkuszu.
3. Napisz w czacie: **`eksportuj panel`** — agent uruchomi eksport (Ty **nie** używasz terminala).
4. Playtest: `Gra-podglad-OKOLICA-UX.html` lub `Gra-podglad-PLAYTEST-MIASTO.html`.

## Skrypty (agent, nie Maciej)

| Akcja | Komenda |
|-------|---------|
| Regeneracja z JSON | `python3 panele-sterowania/gen-panel-b.py` |
| Eksport po edycji | `python3 panele-sterowania/export-b.py` |
| Test round-trip | `python3 panele-sterowania/test-panel-b-roundtrip.py` |
| Budynki (osobno) | `python3 gra/tools/export-budynki.py` |

## Arkusze → JSON

| Arkusz | JSON |
|--------|------|
| Miasto | `miasto-params.json` → pole `wartosc` |
| Ekonomia, Wealth, Globalne, Budynki-eco, Teren-bonus | `econ-params.json` → pole `normal` |
| Zdrowie … Porzadek | `society-params.json` → pole `normal` |
| **Potega-P-A** | `power-params.json` → `skladniki.*.pkt` (9 współczynników globalnych) |
| **Potega-opcje** | `power-params.json` → `opcje.*` (osadnik w armii, flat bitwa, etykieta Moc, × epoka OFF) |
| **Manpower-epoki** | `epoka-ludnosc-manpower.json` → tabela epok 1–10 (rekruci → składnik ekw. jednostek) |

**Symulator (bez eksportu):** `docs/decyzje/POWER-kalkulator-Maciej.xlsx`  
**Handoff integracji:** `dyspozycje/_handoff/EKONOMIA-do-INTEGRATOR_moc-v1-GOTOWE.md`
| **Zywnosc-kanon** | `terrain-improvements.json` → `bonus.*`, `koszt_praca` |

Parametr w **Zywnosc-kanon**: `farma.bonus.zywnosc`, `irygacja.koszt_praca` itd.  
Wiersze `bydlo`/`owce`/`lama` — wartości kanonu w Excelu; eksport działa dopiero po **FOOD-HODOWLA** (nowe klucze w JSON).

## Kroki 5 (spec §3) — status

| # | Krok | Status |
|---|------|--------|
| 1 | Inwentaryzacja | ✅ `B-PANEL-INWENTARYZACJA.md` |
| 2 | Budowa panelu | ✅ `Panel-B.xlsx` + `gen-panel-b.py` |
| 3 | Wpięcie export + round-trip | ✅ `export-b.py` + `test-panel-b-roundtrip.py` |
| 4 | Przeniesienie zadań | ✅ ROADMAP § Panele + ten plik |
| 5 | Archiwizacja starych | ✅ `docs/archiwum/panele-miasto-legacy/README.md` |

## Powiązane (poza Panel-B)

| Temat | Gdzie |
|-------|--------|
| Kanon plonów/hodowli | `docs/decyzje/KANON-ULEPSZENIA-ZYWNOSC-HODOWLA.md` |
| Wdrożenie kodu | **FOOD-HODOWLA** (po zamknięciu panelu) |
| Tech | `Panel-D.xlsx` |
| Status Excel projektu | `Status-projektu-The-Game.xlsx` → arkusz Grupa-B (ręcznie) |
