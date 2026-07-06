# MASTER → Grupy A–E: PANEL-MERGE (scalenie starych Exceli)

> **Flaga:** GOTOWE (dyspozycja) · **Data:** 2026-06-30  
> **Decyzja Macieja:** jeden panel na grupę; stare pliki zlikwidować **po** weryfikacji 100%.  
> **Tracker:** `docs/obieg/PANEL-MERGE-TRACKER.md` — **aktualizujesz po zakończeniu**  
> **Orchestracja:** `docs/obieg/PANEL-MERGE-ORCHESTRACJA.md`

**Bez udziału Macieja.** Po Twoim meldunku `GOTOWE-DO-ARCHIWUM` Master zarchiwizuje pliki.

---

## Wspólne AC (wszystkie grupy)

- [ ] Przeczytaj swoją sekcję w `PANEL-MERGE-ORCHESTRACJA.md` (tabela starych plików).
- [ ] Dla **każdego** przypisanego starego pliku: policz parametry/wiersze → porównaj z `Panel-X.xlsx`.
- [ ] Brakujące wiersze **dopisz** do Panel-X (kolumny wg `PANEL-STEROWANIA-SPEC.md` §2).
- [ ] Rozszerz `export-x.py` tak, aby **nie** wymagał starych skryptów ani `--full`.
- [ ] Zaktualizuj `gen-panel-x.py` + `_INFO` (zero odwołań do starych Exceli).
- [ ] Round-trip: `test-panel-x-roundtrip.py` lub równoważny diff JSON.
- [ ] Wpis w `PANEL-MERGE-TRACKER.md`: status ✅ + data + liczby wierszy.
- [ ] Krótki meldunek (szablon w orchestracji) w odpowiedzi czatu grupy / pliku stanu.

---

## Grupa A — Mapa

**Panel:** `panele-sterowania/Panel-A.xlsx` · **Inwentaryzacja:** `docs/obieg/A-PANEL-INWENTARYZACJA.md`

### Twoje pliki do wchłonięcia

| Stary plik | Cel w Panel-A |
|------------|---------------|
| `MIASTO/Ulepszenia-terenu.xlsx` | `Ulepszenia-FOOD`, `Ulepszenia-inne` |
| `Plony-terenow.xlsx` | `Plony-terenow` |
| Koordynacja | upewnij się, że **B usuwa** `Zywnosc-kanon` — A jest jedynym masterem FOOD |

### AC szczegółowe

- [ ] A-M1: diff `export-ulepszenia.py` vs `export-a.py` → identyczny `terrain-improvements.json` (kluczowe pola).
- [ ] A-M2: wszystkie wiersze `Plony-terenow.xlsx` w arkuszu `Plony-terenow`.
- [ ] A-M3: potwierdzenie pisemne, że B-M7 może iść (FOOD tylko w A).
- [ ] `_INFO` Panel-A: brak ścieżek do `MIASTO/Ulepszenia-terenu.xlsx`.

**Priorytet:** po B-M7 (P0 FOOD).

---

## Grupa B — Ekonomia / Miasto

**Panel:** `panele-sterowania/Panel-B.xlsx` · **Inwentaryzacja:** `docs/grupa-b/B-PANEL-INWENTARYZACJA.md`

### Twoje pliki do wchłonięcia

| Stary plik | Cel w Panel-B |
|------------|---------------|
| `Ekonomia-parametry.xlsx` | istniejące arkusze — **pełny diff** |
| `Spoleczenstwo-parametry.xlsx` | Zdrowie…Porzadek — **pełny diff** |
| `MIASTO/Budynki.xlsx` | **NOWY arkusz `Budynki`** |
| `MIASTO/Panel-przeglad-danych.xlsx` | sekcje Budynki + Społeczeństwo |
| `Surowce.xlsx` | **NOWY arkusz `Surowce`** → `resources.json` |
| `Technologie-drzewko.xlsx` | **NOWY arkusz `Technologie`** → `tech.json` |
| `Zywnosc-kanon` (w Panel-B) | **USUŃ arkusz** + gałąź w `export-b.py` |

### AC szczegółowe (P0 najpierw)

- [ ] **B-M7 P0:** `export-b.py` **NIE** zapisuje do `terrain-improvements.json`; usuń arkusz `Zywnosc-kanon`.
- [ ] B-M3: arkusz `Budynki` — pełna lista z `buildings.json` / `Budynki.xlsx`; eksport w `export-b.py` (bez `export-budynki.py`).
- [ ] B-M6: arkusz `Technologie` + eksport do `tech.json` (przenieś logikę z `export-tech.py`).
- [ ] B-M5: arkusz `Surowce` + eksport do `resources.json`.
- [ ] B-M1, B-M2, B-M4: meldunek z liczbami wierszy stary vs nowy, diff=0.
- [ ] `_INFO` Panel-B: usuń linie o `export-budynki.py`, `Plony-terenow.xlsx`, `Panel-D` dla tech.

**Priorytet:** B-M7 → B-M3 → B-M6 → reszta.

---

## Grupa C — Walka

**Panel:** `panele-sterowania/Panel-C.xlsx` · **Inwentaryzacja:** `docs/grupa-c/PANEL-C-INWENTARYZACJA.md`

### Twoje pliki do wchłonięcia

| Stary plik | Cel w Panel-C |
|------------|---------------|
| `Jednostki.xlsx` (OneDrive) | `Macierz-jednostek` + brakujące kolumny (np. Widok pola) |
| `Macierz-walki.xlsx` | ✅ już zastąpione — oznacz C-M2 w trackerze jeśli jeszcze nie |

### AC szczegółowe

- [ ] C-M1: lista wszystkich jednostek w `Jednostki.xlsx` vs wiersze Panel-C; dopisz brakujące.
- [ ] Kolumny spoza macierzy (Widok pola, koszty jeśli w Excelu) → osobny arkusz lub rozszerzenie `Macierz-jednostek`.
- [ ] `export-c.py` pokrywa wszystko — bez `export-data.py` / starego pipeline.
- [ ] Meldunek: C-M2 = ✅ (pre-merge), C-M1 = status po audycie.

**Priorytet:** po D (jeśli Jednostki.xlsx współdzielone z export-data) — można równolegle.

---

## Grupa D — Cywilizacje / Dyplomacja / AI

**Panel:** `panele-sterowania/Panel-D.xlsx` · **Inwentaryzacja:** `docs/obieg/D-PANEL-INWENTARYZACJA.md`

### Twoje pliki do wchłonięcia

| Stary plik | Cel w Panel-D |
|------------|---------------|
| `Civ-CYWILIZACJE/Panel-efekty-cyw-dyplomacja.xlsx` | **NOWY** `Bonusy-cywilizacji` |
| `Cywilizacje.xlsx` | **NOWE** arkusze roster / parametry / AI per nacja |
| `Cywilizacje.xlsx` [Dyplomacja] | **NOWY** `Dyplomacja-per-nacja` |
| `Dyplomacja/Dyplomacja.xlsx` | akcje dyplomatyczne (poza `params`) |
| `Civ-AI/AI-parametry.xlsx` | scal z arkuszami AI-* |
| `export-d.py --full` | **USUŃ** po merge — jeden eksport |

### AC szczegółowe

- [ ] D-M1…D-M5: każdy stary Excel → dedykowany arkusz; diff JSON vs stary skrypt = 0.
- [ ] D-M6: `export-d.py` bez flagi `--full` produkuje: `civs.json`, `civ-ai.json`, `civ-params.json`, `diplomacy.json`, `ai-params.json`.
- [ ] `_INFO`: **koniec** komendy „eksportuj panel pełny" — tylko „eksportuj panel".
- [ ] Religie 9 nacji: arkusz `Religie-cywilizacji` (jeśli brakuje w `society-params.json`).

**Priorytet:** **P1 całego projektu merge** — największy dług.

---

## Grupa E — Start / Meta

**Panel:** `panele-sterowania/Panel-E.xlsx` · **Spec:** `docs/grupa-e/PANEL-E-SPEC.md`

### Twoje pliki do wchłonięcia

| Stary plik | Cel w Panel-E |
|------------|---------------|
| `UI/UI-parametry.xlsx` | `Nowa-gra`, `Menu` |

### AC szczegółowe

- [ ] E-M1: checklist parametrów z `PANEL-E1-SPEC.md` vs arkusze Panel-E (seed z `ui-params.json` jeśli brak lokalnego xlsx).
- [ ] Potwierdzenie: Generator-E2 w E ≠ Generator-E2 w A (różne opisy w `_INFO`).
- [ ] Round-trip `test-panel-e-roundtrip.py` ✅.

**Priorytet:** po A (Generator-E2 opisy) — można równolegle z C.

---

## Po meldunku wszystkich grup

Master (Integrator):

1. Próbka weryfikacji JSON diff per grupa.
2. Przeniesienie plików → `docs/archiwum/panele-legacy/`.
3. Deprecacja starych skryptów w `gra/tools/`.
4. Wpis w `dyspozycje/DZIENNIK-MASTERA.md` + zamknięcie PANEL-MERGE w `REJESTR-DECYZJI.md`.

**Maciej wtedy:** tylko `Panel-A…E.xlsx` + **eksportuj panel** w czacie grupy.
