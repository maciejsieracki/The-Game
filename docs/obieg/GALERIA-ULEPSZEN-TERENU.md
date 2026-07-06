# Galeria ulepszeń terenu — wizual + warianty

**Data aktualizacji:** 2026-06-29  
**Lane:** MAPA (render) · kanon FOOD: `docs/decyzje/KANON-ULEPSZENIA-ZYWNOSC-HODOWLA.md`

---

## START TU (Maciej)

**Dwuklik w Explorerze — bez serwera, bez terminala:**

### `Civ-MAPA/Gra-podglad-ULEPSZENIA.html`

(to samo co `Gra-podglad-ULEPSZENIA-ROBLOX.html`)

Po otwarciu:
1. Domyślnie widać **macierz 18 ulepszeń × 7 terenów** (obracaj myszką).
2. **Prawy panel** — legenda „co jest czym”: układ siatki, opisy terenów (kolumny), ulepszeń (wiersze), sterowanie.
3. U góry zakładki: **Wszystkie** · **Warianty żywności** · **Wzgórze vs tarasy**.
4. Kliknij nazwę ulepszenia (Farma, Bydło…) — zbliżenie na jeden typ.

Sterowanie: przeciągnij = obrót · kółko = zoom · WASD = przesuń mapę.

---

### Zakładki w galerii (`?view=`)

| URL | Co widać |
|-----|----------|
| `?view=all` | **18 typów** × 7 terenów (macierz) |
| `?view=all&imp=tarasy` | Jedno ulepszenie na wszystkich terenach |
| `?view=variants` | **Warianty warstw** — farma+irygacja, farma+bydło, solo hodowla… |
| `?view=combo-farma-bydlo` | **Farma+Bydło × 7 terenów** (ten sam combo w każdej kolumnie) |
| `?view=combo-farma-irygacja` | **Farma+Irygacja × 7 terenów** |
| `?view=combo-farma-bydlo-owce` | **Farma+Bydło+Owce × 7** (podgląd wizualny; w grze niedozwolone) |
| `?view=wzgorze` | **Wzgórze dzikie** vs **tarasy / owce** (z kopcem terenu) |

### Inne podglądy powiązane

| Plik / URL | Temat |
|------------|--------|
| `gra/src/hillcompare/index.html` | Tylko wzgórze vs tarasy (zbliżenie) |
| `docs/obieg/screenshots/wzgórze-vs-tarasy/*.png` | Zrzuty PNG (2026-06-29) |
| `docs/decyzje/A4-D4-przeglad-ulepszen-terenu.md` | Warunki placementu (tekst) |

---

## Regeneracja HTML (agent)

```powershell
cd gra
npx vite build --config src/improvepreview/vite.improvepreview.config.ts
Copy-Item dist-improvepreview\src\improvepreview\index.html ..\Civ-MAPA\Gra-podglad-ULEPSZENIA-ROBLOX.html
```

Kod źródłowy galerii: `gra/src/improvepreview/main.ts`

---

## Pełna lista modeli (18 kluczy)

| Klucz | Etykieta | Epoka | Uwagi wizualne |
|-------|----------|-------|----------------|
| `farma` | Farma | 1 | Grządki + zboże |
| `bydlo` | Bydło | 1 | Pastwisko + krowy |
| `owce` | Owce | 1 | Stado na wzgórzu |
| `lama` | Lama | 1 | Lama (Inkowie) |
| `kopalnia` | Kopalnia | 1 | Szyb / ruda |
| `kamieniolom` | Kamieniołom | 1 | Kamień |
| `oboz_lowiecki` | Obóz łowiecki | 1 | Ogień + skóry |
| `wyrab` | Wyrąb | 1 | Ścięte pnie |
| `tartak` | Tartak | 1 | Piła + drewno |
| `lodzie_rybackie` | Łodzie rybackie | 1 | Łódka + ryby |
| `droga` | Droga | 1 | Utwardzony pas |
| `posterunek` | Posterunek | 2 | Strażnica + palisada |
| `irygacja` | Irygacja | 2 | Kanały (+ rzeka w galerii) |
| `pole_irygowane` | Pole irygowane | 2 | **Stack** farma+irygacja (auto) |
| `glinianka` | Glinianka | 2 | Doły gliny |
| `plantacja` | Plantacja | 2 | Winorośl |
| `warzelnia_soli` | Warzelnia soli | 2 | Nie + sól |
| `tarasy` | Tarasy | 2 | **Schodki** z brązowymi murami |
| `fort` | Fort | 3 | Umocnienia |

**Usunięte:** `pastwisko` (legacy) → zastąpione bydło / owce / lama.

---

## Warianty warstw (kanon §3 — widok `?view=variants`)

| Wariant | Klucze na heksie | Teren w galerii | Render |
|---------|------------------|-----------------|--------|
| Pole irygowane | `farma` + `irygacja` | Łąka | `buildImprovementStack` → `pole_irygowane` |
| Farma + bydło | `farma` + `bydlo` | Łąka | dwa modele obok siebie |
| Farma solo | `farma` | Równina | — |
| Irygacja solo | `irygacja` | Pustynia | + pas rzeki |
| Bydło solo | `bydlo` | Łąka | — |
| Owce solo | `owce` | Wzgórza | kopiec + owce |
| Lama solo | `lama` | Wzgórza | kopiec + lama |
| Tarasy solo | `tarasy` | Wzgórza | kopiec + schodki tarasów |
| Łodzie | `lodzie_rybackie` | Wybrzeże | — |

**Niedozwolone combo** (brak w galerii — nie występują w grze): farma+irygacja+bydło, owce+farma, tarasy+owce, lama+ cokolwiek.

---

## Wzgórze — teren vs ulepszenie (`?view=wzgorze`)

| Wariant | Co widać |
|---------|----------|
| **Sam teren** | Ten sam kształt schodków co tarasy, **w pełni zielony** |
| **+ Tarasy** | Brązowe mury + zielone tarasy (bez zielonego stosu pod spodem) |
| **+ Owce** | Kopiec + model owiec |

Decyzja Macieja 2026-06-29: schodki z brązowymi murami = **ulepszenie Tarasy**, nie bazowy teren Wzgorza.

---

## Styl renderu

- Domyślny: **Roblox** (`GAME_MAP_RENDER_STYLE`)
- Wzgórza w galerii: ten sam kopiec co na mapie (`scene.ts` → `buildStyleHillBump`)
- Minecraft: osobny mesh w kodzie — galeria pokazuje Roblox; porównanie stylów = backlog

---

## Powiązane

- Dane/bonusy: `gra/data/terrain-improvements.json` + Panel-A
- Kwalifikacja: `gra/src/map/improvement-build.ts`
- Modele: `gra/src/render/improvements.ts`, `robloxImprovements.ts`, `mapRenderStyle.ts`
