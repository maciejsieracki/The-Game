# Design — W1f · Ikony ustawień kreatora (krok 4)

> **Od:** Maciej · **Lane:** tylko sync zip (bez rysowania)  
> **Ekran:** `newGameFlow.ts` · krok **4 Ustawienia rozgrywki** · siatka 2×3

---

## START — W1f

**Problem:** w medalionach ustawień są **litery** (Tr, Mx, Sw, Tp, MP, Cy) — nieczytelne, niepremium.

**Cel:** **6 ikon line** — jedna semantyka na ustawienie, **bez skrótów literowych**.

---

## Styl (obowiązkowy)

- **3C minimal line** · `viewBox="0 0 24 24"` · `stroke="currentColor"` · ~1.3–1.4
- Czytelne w **kółku ~36–40 px** (obok etykiety PL)
- Spójne z brand book 1E (jak epoki / cyw.)
- **NIE:** litery, emoji, fill, gradient w SVG

---

## 6 plików → semantyka

| # | `key` w grze | Etykieta UI | Plik | Symbol (propozycja) | NIE |
|---|--------------|-------------|------|---------------------|-----|
| 1 | `difficulty` | Poziom trudności | `sett-difficulty.svg` | **Waga** (Libra) — dwa talerze + belka · trudność = balans AI | litery Tr, miecz |
| 2 | `map_size` | Rozmiar mapy | `sett-map-size.svg` | **Siatka heksów** (3×2 lub 4) + **ramka powiększenia** (narożniki) · skala mapy | litery Mx, globus bez heksów |
| 3 | `world_type` | Typ świata | `sett-world-type.svg` | **Glob + 2 masy lądowe** (kontynenty ogólnie) · jedna ikona na wszystkie opcje (Kontynenty/Pangea/Wyspy/Ziemia) | 4 osobne ikony, tylko wyspa |
| 4 | `game_speed` | Prędkość gry | `sett-game-speed.svg` | **Klepsydra** (lub zegar z jedną strzałką) · czas tury / tempo | litery Tp, >> |
| 5 | `city_states_count` | Miasta-państwa | `sett-city-states.svg` | **Jeden filar/kolumna + mała flaga/proporzec** · małe państwo-miasto (Sparta, Kapua) | pełne miasto, wieża wieżowca |
| 6 | `civ_types_count` | Typy cywilizacji | `sett-civ-types.svg` | **3 medaliony/kółka w rzędzie** (lub trójkąt) · wiele klastrów/typów na mapie | litery Cy, jedna tarcza |

---

## Szczegóły per ikona (dla Design)

### 1. Poziom trudności — waga
- Symetria · talerze na poziomie · centralna belka
- Odczyt: „balans / wyzwanie", nie „wojna"

### 2. Rozmiar mapy — heks + skala
- 4–6 heksów w siatce · opcjonalnie **4 narożniki** „zoom frame"
- Odczyt: „wielkość mapy", nie nawigacja (chip-map to co innego)

### 3. Typ świata — glob
- Okrąg (planeta) · równik · **2 zarysy lądów** (lewy większy, prawy mniejszy)
- Neutralne względem Kontynenty/Pangea/Wyspy/Ziemia

### 4. Prędkość gry — klepsydra
- Prosta klepsydra · opcjonalnie 1–2 krople piasku
- Odczyt: tempo / czas · nie „End Turn"

### 5. Miasta-państwa — kolumna + flaga
- Styl antyczny · **1 kolumna** + **proporzec** z boku
- Małe państwo-sojusznik · nie stolica gracza

### 6. Typy cywilizacji — 3 medaliony
- **3 puste kółka/medaliony** (line only) w jednej linii, lekko nachodzące OK
- Odczyt: „wiele narodów/typów na mapie"

---

## Deliverable

```
eksport/icons/settings/
  sett-difficulty.svg
  sett-map-size.svg
  sett-world-type.svg
  sett-game-speed.svg
  sett-city-states.svg
  sett-civ-types.svg
```

Opcjonalnie: `setting-icon-map.json` (map key → plik).

**NIE zmieniać:** epoki, cyw., `epoch-icon-map`, `civ-icon-map`.

Zip → `docs/ux/claude-design/` → Maciej → Lane sync.

**Design wpisz:** `START — W1f`

---

## Lane (po zipie)

- Podmiana `SETTING_GLYPHS` w `newGameFlow.ts` → `settingIconSvg(key)` z mapy
- Kanon po build

**Flaga:** ✅ GOTOWE (Design infografik3/4 · Lane sync · kanon `f26955a1…`)
