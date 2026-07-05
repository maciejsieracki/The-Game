# Design Brief — A-08 Ulepszenia terenu (ikony + panel budowy 1E)

**Od:** Maciej / Lane UI  
**Do:** Design (brand-book 1E)  
**Data:** 2026-07-03  
**Priorytet:** P1 — **równolegle z C-06** (walka) · blokada emoji w trybie 🔨  
**Ekran UX:** A-08 · `gra/src/ui/buildModeHud.ts`

---

## Problem

W grze tryb **Budowa ulepszeń** (toolbar 🏗) nadal używa **emoji** (🌾🐄⛏️…) — sprzeczne z decyzją **3C** i resztą HUD 1E.

Design dostarczył **10 SVG** w `eksport/icons/improvements/` (skopiowane do `gra/src/ui/icons/brand/improvements/`), ale:

- brak **`improvement-icon-map.json`** (mapowanie klucz gry → `imp-*`)
- brak wariantów **40px**
- brak ikon dla **6 typów** z `terrain-improvements.json`
- brak mockupu **panelu A-08** w stylu 1E (obecnie brązowy panel programistyczny)
- lane UI **nie podpiął** SVG do `buildModeHud.ts`

---

## Deliverables Design

| # | Artefakt | Opis |
|---|----------|------|
| 1 | **Uzupełnienie SVG** | Brakujące ikony + warianty 40px dla wszystkich typów poniżej |
| 2 | **`improvement-icon-map.json`** | Klucz JSON gry → plik `imp-*.svg` |
| 3 | **`The Game - A08 Tryb budowy ulepszen (1E).dc.html`** | Mockup panelu + banner (1920×1080 lub panel osobno) |
| 4 | Eksport | `brand-book-1E/eksport/icons/improvements/` + wpis w HANDOFF.md |

---

## Mapowanie: klucz gry → ikona Design

| Klucz (`terrain-improvements.json`) | Nazwa PL | Ikona | Status |
|-------------------------------------|----------|-------|--------|
| `farma` | Farma | `imp-farm` | ✅ jest |
| `irygacja` | Irygacja | `imp-irrigation` | ✅ jest |
| `bydlo` | Bydło | `imp-pasture` *lub* **`imp-cattle`** (nowa) | 🟡 doprecyzować |
| `owce` | Owce | **`imp-sheep`** (nowa) | ❌ brak |
| `lama` | Lama | **`imp-llama`** (nowa) | ❌ brak |
| `kopalnia` | Kopalnia | `imp-mine` | ✅ jest |
| `kamieniolom` | Kamieniołom | `imp-quarry` | ✅ jest |
| `glinianka` | Glinianka | **`imp-clay`** (nowa) | ❌ brak |
| `oboz_lowiecki` | Obóz łowiecki | **`imp-hunting-camp`** (nowa) | ❌ brak |
| `wyrab` | Wyrąb lasu | `imp-lumber` | ✅ jest |
| `tartak` | Tartak | **`imp-sawmill`** (nowa) *lub* reuse lumber | 🟡 |
| `tarasy` | Tarasy | **`imp-terrace`** (nowa) | ❌ brak |
| `lodzie_rybackie` | Łodzie rybackie | `imp-fishing` | ✅ jest |
| `warzelnia_soli` | Warzelnia soli | **`imp-salt`** (nowa) | ❌ brak |
| `droga` | Droga | `imp-road` | ✅ jest |
| `posterunek` | Posterunek | `imp-outpost` | ✅ jest |
| `fort` | Fort | `imp-fort` | ✅ jest |
| `wycinka` | Wycinka lasu | reuse `imp-lumber` *lub* **`imp-clearing`** | 🟡 (typ MAPA) |

**Minimum nowych ikon:** 6–8 (owce, lama, glinianka, obóz, tarasy, sól + opcjonalnie tartak, bydło osobno).

**Format:** SVG line-art, `viewBox 0 0 24 24`, stroke `currentColor` / gold `#e8d88a`, **24 + 40 px** — jak `02-SPEC-IKONY.md`.

---

## Mockup A-08 — co narysować

**Trigger w grze:** toolbar mapy → medalion **Budowa** (młotek = `tb-build` / `res-work`).

### Elementy UI

1. **Banner górny** (jak dziś, ale 1E):
   - „TRYB BUDOWY — wybierz ulepszenie, kliknij pole (ESC = wyjście)”
   - przycisk ✕ Wyjdź
2. **Panel prawy** (~240px):
   - Sekcja **Miasto** (opcjonalnie): „Załóż miasto” + koszt
   - Sekcja **Ulepszenia terenu**: lista ~15 pozycji — **ikona SVG + nazwa + E1 · koszt P**
   - Stan: selected · locked (🔒 tech) · disabled
   - Sekcja **Cuda świata** (dół) — osobny styl złoty
3. **Styl:** tokeny 1E, ramka 5C, **zero emoji**, spójne z `Makieta-HUD-mapa-swiata.html`

### Referencje

| Plik | Rola |
|------|------|
| `gra/src/ui/buildModeHud.ts` | Logika listy (nie zmieniać) |
| `Gra-podglad-ULEPSZENIA.html` | Playtest obecnego UI |
| `gra/src/ui/icons/brand/improvements/*.svg` | 10 ikon @24 (baza) |
| `UI/Makieta-HUD-mapa-swiata.html` | Styl paneli/map HUD |

---

## Po Design

1. Lane UI: `improvementIconSvg()` + map JSON + podmiana emoji w `buildModeHud.ts`
2. **MASTER:** sync eksport → kanon (batch osobny, nie walka)

---

## Szablon `improvement-icon-map.json`

```json
{
  "map": {
    "farma": "imp-farm",
    "irygacja": "imp-irrigation",
    "bydlo": "imp-pasture",
    "owce": "imp-sheep",
    "_default": "imp-farm"
  }
}
```

Design uzupełnia pełną mapę + `_default`.
