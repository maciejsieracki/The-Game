# Design — poprawka W1b (Sumer) + ikony epok (W1e)

> **Od:** Maciej (playtest kanon `6fdcd1f4…`) · **Lane:** tylko konsumuje zip (Wariant A)  
> **NIE prosić Macieja o playtest** do czasu `master` po zipie.

---

## 1. START — W1b-rev (PRIORYTET · 1 plik)

**Problem:** `civ-sumer.svg` w zipie W1b **nie odpowiada mockupowi** — na ekranie wygląda jak piramida (myli się z Egiptem).

**Kanon mockupu** (`Ekran Kreator (1E).dc.html` linia ~46) — **ziggurat** (tarasy + oś + poziome belki):

```svg
<path d="M6 19V7l6-3 6 3v12Z"/>
<path d="M6 11h12M6 15h12M12 4v15"/>
```

**Obecny plik w zipie (ŹLE — za płaski / jak piramida):**

```svg
<path d="M4 20h16"/>
<path d="M6 20v-3h12v3M8 17v-3h8v3M10 14v-3h4v3"/>
<path d="M12 11V8"/>
```

**Deliverable:**

- [ ] Nadpisać `eksport/icons/civilizations/civ-sumer.svg` — **skopiować path z mockupu** (3C line, @24, `currentColor`)
- [ ] Opcjonalnie: doprecyzować schody / kapliczkę na szczycie (referencja wizualna Macieja — ziggurat ilustracja), **bez** zmiany stylu line-icon
- [ ] Zip → Maciej · **nie** zmieniać `civ-icon-map.json`

**Design wpisz:** `START — W1b-rev`

---

## 2. START — W1e (ikony epok kreatora · krok 2)

**Problem:** krok **Epoka Startowa** ma monogramy **K / B / Z** — brak infografik jak w mockupie Design.

**Deliverable:**

| Plik | Opis |
|------|------|
| `eksport/icons/epochs/epoch-kamien.svg` | Kamień — np. kamień / krzem / osada (Design decyduje, 3C line @24) |
| `eksport/icons/epochs/epoch-braz.svg` | Brąz — np. ingot / miecz brązowy |
| `eksport/icons/epochs/epoch-zelazo.svg` | Żelazo — np. miecz / kowadło |
| `eksport/epoch-icon-map.json` | `{ "map": { "kamien": "epoch-kamien", "braz": "epoch-braz", "zelazo": "epoch-zelazo", "_default": "epoch-kamien" } }` |
| `HANDOFF.md` | sekcja Epoki · mapa → `newGameFlow.ts` krok 2 |

**NIE** wpisywać epok w `icons-manifest.json` (osobny rejestr jak cywilizacje).

**Design wpisz:** `START — W1e`

---

## 3. Lane (po zipie)

| Batch | Pliki |
|-------|--------|
| W1b-rev | sync `civ-sumer.svg` → `gra/.../brand/civilizations/` |
| W1e | `epochIconSvg()` + medaliony w kroku Epoka (`newGameFlow.ts`) |
| MASTER | `master` → dopiero wtedy playtest Macieja |

**Flaga:** CZEKA Design
