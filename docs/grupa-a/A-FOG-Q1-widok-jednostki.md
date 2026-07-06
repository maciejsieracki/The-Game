# A-FOG-Q1 — Zasięg mgły wojny (jednostki na mapie)

> **Status:** **ZAMKNIĘTE → B** (Maciej, 2026-06-27)  
> **Ekran:** `[EKRAN: Mapa świata]`  
> **Owner danych + API:** Grupa A (MAPA) · **Wpięcie `main.ts`:** SILNIK / MASTER

---

## Decyzja

**A-FOG-Q1=B**

| Element | Reguła |
|---------|--------|
| **Jednostka** | **Widok pola = Ruch** (mapa strategiczna, kolumna „Ruch" w `units.json`) |
| **Promień** | Wszystkie hexy w odległości heksagonalnej **≤ Widok pola** od pozycji jednostki |
| **Wyjątek** | **Zwiadowca:** `Widok = max(Ruch, 5)` → **5 heksów** |
| **Bitwa** | Kolumna „Ruch w bitwie" **nie dotyczy** mgły |
| **Miasto** | **Grupa B (Miasta)** — poza zakresem A-FOG-Q1 |

---

## Skrót po Ruchu (50 typów)

| Ruch | Jednostek | Widok mgły (B) |
|------|-----------|----------------|
| 1 | 4 | 1 hex (Falanga, Katapulta, Taran, Wieża) |
| 2 | 26 | 2 hexy (Wojownik, Hastati, Łucznik, …) |
| 3 | 8 | 3 hexy (+ Zwiadowca **5**) |
| 4 | 10 | 4 hexy (Konnica, Impi, rydwany, …) |
| 5 | 1 | 5 heksów (Rydwan egipski) |

Pełna tabela: [`Civ-UNITS/widok-pola-A-FOG-Q1B.csv`](../../Civ-UNITS/widok-pola-A-FOG-Q1B.csv)

---

## Stan implementacji

| Warstwa | Plik | Status |
|---------|------|--------|
| Dane | `gra/data/units.json` — kolumna „Widok pola" | **ZROBIONE** (39 wierszy zaktualiz.) |
| Excel | `Jednostki.xlsx` (OneDrive) | **CZEKA Maciej** — skopiuj z CSV |
| API mgły | `gra/src/game/visibility.ts` | **ZROBIONE** (`buildUnitSightResolver`, overload `computeVisible`) |
| Silnik | `gra/src/main.ts` → `currentVisible()` | **CZEKA SILNIK** |
| Miasta | — | **CZEKA Grupa B** (tymczasowo `DEFAULT_SIGHT=3` w resolverze) |

**Handoff:** [`dyspozycje/_handoff/MAPA-do-SILNIK_fog-widok-pola-A-FOG-Q1B.md`](../../dyspozycje/_handoff/MAPA-do-SILNIK_fog-widok-pola-A-FOG-Q1B.md)

---

## Relacja do batchu F (mgła start)

Batch F (`F-do-SILNIK_mgla-ghost-start-batch.md`) ustawił **stałe** `DEFAULT_SIGHT=3` dla wszystkich jednostek.  
Po wpięciu A-FOG-Q1=B jednostki używają **per-typ** z `units.json`; miasta nadal przez `citySight` (domyślnie 3) do decyzji Grupy B.

**Start gry:** bez zmian — `START_REVEAL_RADIUS=5` wokół preferowanego hexu (`startScoring.ts`).

---

## Odpowiedź Macieja (zapis)

→ **A-FOG-Q1=B**
