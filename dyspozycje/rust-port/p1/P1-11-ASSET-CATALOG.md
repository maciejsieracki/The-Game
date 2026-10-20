# P1.11 — Katalog assetów gry webowej (pin `main` = `edb8fb56`)

**Temat:** R-RUSTPORT-P1-11-ASSET-CATALOG-Q1 · **Runda:** 1/5 (obrona Operatora po zarzutach Evaluatora) · **Rola:** Operator (Haiku 5.5 medium)
**Źródło:** `git archive edb8fb56 gra` (rozpakowane poza repo, w scratchpadzie; zero zapisu w `gra/**`).
**Metoda:** `find -type f -printf '%s'`, `awk` sumy per katalog/rozszerzenie, `grep` referencji w kodzie. Liczby z realnie uruchomionych komend (runda 1 i obrona).
**Weryfikacja krzyżowa:** `dyspozycje/rust-port/manifest-gra-edb8fb56.sha256.tsv` — liczby plików per rozszerzenie zgodne: svg 307, jpg 45, png 3, mp3 62.

> Uwaga o HEAD: liczby w tym katalogu pochodzą wyłącznie z `git archive edb8fb56` i nie zależą od HEAD working tree.
> HEAD working tree w chwili obrony = `51e5ff50` (`git rev-parse --short HEAD`). Wartość `e5c959c2` z rundy 1 nie została w obronie potwierdzona.
> Pomiar `gra/tools/` w working tree (1126 plików) różni się od pinu (1174) — dlatego wiążące są liczby z pinu.

## 1. Lokalizacje katalogów assetów (faktyczne, nie zakładane)

- `gra/src/ui/icons/brand/` — ikony SVG + mapy ikon (JSON) + style (CSS).
- `gra/src/ui/icons/*.ts` — rejestr/mapowanie ikon (kod, nie asset).
- `gra/src/ui/assets/hero/` — ilustracje hero (PNG).
- `gra/src/assets/portrety/` — portrety liderów (JPG). `gra/src/assets/` zawiera wyłącznie ten podkatalog (45 JPG, brak innych rozszerzeń).
- `gra/src/audio/utwory/` — muzyka (MP3); `gra/src/audio/*.ts` — preferencje i odtwarzacz (kod).
- `gra/data/earth-mask-source.png` — maska lądów (źródło do `src/map/earth-land-mask.generated.ts`), poza sumą 441 (patrz §2).
- **Brak** katalogu `gra/public/` (potwierdzone: `ls -d public` → brak).

## 2. Kategorie — pliki, liczba, rozmiar

| Kategoria | Format | Liczba plików | Łączny rozmiar | Lokalizacja |
|---|---|---:|---:|---|
| Ikony / sprite'y (UI, budynki, jednostki, zasoby, epoki, tiery, menu, cywilizacje, ustawienia) | SVG | 307 | 108 231 B | `src/ui/icons/brand/**` |
| Mapy ikon / manifest / style ikon | JSON (8), CSS (4) | 12 | 27 945 B | `src/ui/icons/brand/*` (top-level) |
| Portrety liderów (15 cywilizacji × 3 epoki: kamien, braz, zelazo) | JPG | 45 | 445 951 B | `src/assets/portrety/` |
| Ilustracje hero | PNG | 2 | 4 214 674 B | `src/ui/assets/hero/` |
| Maska lądów (źródło, poza sumą 441) | PNG | 1 | 77 618 B | `data/` |
| Muzyka aktywna (kamien 25, braz 23, intro 4, dyplomacja 3 [1 + rzymianie 2], bitwa 1, porazka 1, prebattle 1, zwyciestwo 1) | MP3 | 59 | 42 350 853 B | `src/audio/utwory/**` (bez `_wykluczone/`) |
| Muzyka wykluczona z gry (`_wykluczone/`) | MP3 | 3 | 2 233 830 B | `src/audio/utwory/_wykluczone/` |
| Fonty (woff/woff2/ttf/otf/eot) | — | **BRAK** (0 plików w pinie; 0 `@font-face` w `src/`) | — | — |
| Modele 3D (glb/gltf/fbx/obj) | — | **BRAK** (0 plików) | — | patrz §5: zależność `three` i geometria proceduralna |
| Dźwięki SFX jako pliki (wav/ogg/m4a) | — | **BRAK** (0 plików) | — | patrz §5: dźwięki **syntetyzowane w kodzie** |
| Katalog `utwory/natura/` | MP3 | **BRAK** (0 plików, pusty celowo; tylko `README.md`) | — | `ambiencePrefs.ts` |

**Suma 441 plików, 49 545 994 B** (wszystkie pliki z kategorii powyżej poza maską `data/`, wliczając moduły kodu audio/ikon i pliki README):
307 SVG + 12 JSON/CSS (8 JSON + 4 CSS) + 45 JPG + 2 PNG (hero) + 62 MP3 (59 aktywnych + 3 wykluczone) + 10 `.ts` (5 w `src/ui/icons/`, 5 w `src/audio/`) + 3 `README.md` (`src/audio/utwory/README.md`, `_wykluczone/README.md`, `natura/README.md`) = **441**.
Bajty: 108 231 + 27 945 + 445 951 + 4 214 674 + 44 584 683 + 162 482 (`.ts`) + 2 028 (`.md`) = **49 545 994 B**.
Maska `data/earth-mask-source.png` (1 plik, 77 618 B) jest liczona osobno i nie wchodzi do tej sumy.

**Kategorie „inne” (kod/dane/narzędzia, nie assety runtime) — pełne zestawienie w §7.**

## 3. Lista plików (skrót — pełna lista: `find` na `git archive edb8fb56 gra`)

- **Ikony SVG (307):** podkatalogi wg liczby plików: `brand/buildings` 50, `brand/` (root) 43, `brand/menu` 30, `brand/tier5` 30, `brand/tier4` 26, `brand/tier1` 18, `brand/tier3` 18, `brand/resources-map` 16, `brand/civilizations` 16, `brand/units` 12, `brand/tier7` 10, `brand/tier2` 10, `brand/improvements` 10, `brand/tier6` 8, `brand/settings` 6, `brand/epochs` 3, `brand/ui` 1.
- **Portrety (45):** `portrait-<civId>-<epoka>.jpg`, epoki `kamien`/`braz`/`zelazo` po 15 cywilizacji.
- **Muzyka (aktywna, 59):** `utwory/kamien` 25, `utwory/braz` 23, `utwory/intro` 4, `utwory/dyplomacja/rzymianie` 2, `utwory/dyplomacja` 1, po 1 w `bitwa`, `porazka`, `prebattle`, `zwyciestwo`.
- **Hero (2):** `hero-intro.png` (2 039 500 B), `hero-menu.png` (2 175 174 B).

## 4. Sposób referencji (path vs moduł)

- **Moduły Vite (`import.meta.glob`, `?url`, `?raw`):**
  - SVG ikon: `src/ui/icons/brandAssets.ts:23` — `import.meta.glob('./brand/**/*.svg')`.
  - Portrety: `src/ui/leaderPortraits.ts:172` — `import.meta.glob('../assets/portrety/*.jpg', { eager, import: 'default' })`.
  - Muzyka: `src/audio/filePlayer.ts:519–626` — globy per folder: `utwory/kamien`, `utwory/braz`, `utwory/intro`, `utwory/dyplomacja` (+ `*/*.mp3` dla cywilizacji), `utwory/prebattle`, `utwory/bitwa`, `utwory/zwyciestwo`, `utwory/porazka`.
  - Hero: `src/ui/newGameFlow.ts:61` (`./assets/hero/hero-intro.png?url`), `src/ui/mainMenu.ts:20` (`./assets/hero/hero-menu.png?url`).
  - `?raw`: 15 wystąpień `?raw` w `src/**/*.ts` (część dotyczy SVG ikon).
- **Ścieżki stringowe (korekta rundy 1):** pliki w `src/` i `data/` (ts/tsx/json/css/html) zawierające literalne `assets/`, `audio/utwory` lub `ui/icons` — wzorzec:
  `grep -rlE --include='*.ts' --include='*.tsx' --include='*.json' --include='*.css' --include='*.html' 'assets/|audio/utwory|ui/icons' src data` → **12 plików**:
  `src/audio/filePlayer.ts`, `src/battle/battleScene.ts`, `src/main.ts`, `src/render/cityMapStatChip.ts`, `src/render/unitOwnerEmblem.ts`, `src/render/unitUpgradeBadges.ts`, `src/ui/brandTokenVars.ts`, `src/ui/icons/brandAssets.ts`, `src/ui/icons/iconRegistry.ts`, `src/ui/leaderPortraits.ts`, `src/ui/mainMenu.ts`, `src/ui/newGameFlow.ts`.
  Liczba **54** z rundy 1 jest **wycofana** — nie dała się odtworzyć żadnym sensownym wzorcem. Dla kontekstu: ten sam wzorzec po całym `gra/` (te same rozszerzenia) = 22 pliki.
- **Ważne dla P3.8 / P2.9:** część referencji jest dynamiczna (glob + klucze z nazw plików), więc przeniesienie do Rust wymaga zachowania konwencji nazw (`portrait-<civId>-<epoka>.jpg`, `<id>-<size>.svg`, katalogi epok muzyki).

## 5. Kategorie nieobecne jako pliki — co jest w kodzie zamiast tego (jawnie)

- **Fonty — BRAK plików** (0 plików fontów, 0 `@font-face` w `src/`). Typografia: stos systemowy lub CSS w `brand/*.css` — do sprawdzenia w P1.15/P5.11.
- **Modele 3D — BRAK plików** (0 glb/gltf/fbx/obj). Ale w kodzie istnieje **zależność i geometria proceduralna**:
  - `gra/package.json:14` — `"dependencies": { "three": "^0.169.0" }`; `package.json:17` — `"@types/three": "^0.169.0"` w `devDependencies`.
  - 88 plików w `src/` importuje `three` (m.in. `src/render/units.ts`, `src/ui/unitMiniPreview.ts`, `src/ui/perfTestPanel.ts`, `src/wonderpreview/main.ts`, `src/render/jednostki-z2-srodziemne.ts`).
  - Jednostki 3D/podglądy są budowane z kodu, nie z plików modeli. To jest zakres P4/P5 do przeniesienia jako logika/renderer, nie jako asset.
- **Dźwięki SFX jako pliki — BRAK plików** (0 wav/ogg/m4a). Dźwięki są **syntetyzowane w kodzie Web Audio**:
  - `src/battle/battleScene.ts:7061–7081` — `createOscillator` (sine 60→28 Hz, sawtooth 820 Hz z filtrem lowpass) + `createBufferSource` z buforem szumu (trzask drewna); dalsze wystąpienia: `:7277`, `:7287`, `:10161`, `:10174`, `:10196`, `:10208`, `:10227`.
  - `src/audio/muzyka-antyczna.ts` (nagłówek: „zero plików audio, zero zależności") — pełna synteza muzyki BRĄZU i fallback KAMIENIA (`usesFilePlayer()`).
  - `src/audio/sfxPrefs.ts` — tylko ustawienia głośności/włączenia.
  - Wniosek dla portu: „BRAK” dotyczy wyłącznie plików; dźwięk istnieje i musi zostać odtworzony syntezą (P3.8/P5), nie zastąpiony ciszą.
- **Muzyka ambient `utwory/natura/` — BRAK plików** (katalog celowo pusty, tylko `README.md`).

## 6. Wnioski dla portu (bez klasyfikacji REUSE/ADAPT — to P1.17/P3.8)

- Zakres binarny assetów jest mały poza muzyką: ~0,6 MB ikon+portretów+CSS/JSON, ~4,3 MB PNG (hero + maska), ~42 MB MP3 aktywnej muzyki.
- Brak plików fontów i modeli 3D nie oznacza braku typografii ani 3D — patrz §5.
- Kontrola kompletności P3.8 wobec tego katalogu: 307 SVG + 45 JPG + 3 PNG + 59 aktywnych MP3 (+ 3 wykluczone, do decyzji właściciela, czy wchodzą do manifestu) + 12 JSON/CSS ikon + synteza dźwięku i muzyki z kodu.

## 7. Kategorie „inne” (kod, dane, narzędzia) — poza zakresem assetów runtime

| Pozycja | Rozmiar | Liczba | Status |
|---|---:|---:|---|
| `gra/src/data/wikiBundle.json` | 1 207 504 B | 1 | Dane (bundle wiki), generowany przez `tools/bundle-wiki-for-game.cjs` (`package.json:6–7`, skrypty `predev`/`prebuild`); czytany przez `src/ui/wikiHubHud.ts`. Nie asset — przypisany do **P1.12** (dane). |
| `gra/Gra-podglad-POLE-BITWY.html` (korzeń `gra/`) | 1 265 409 B | 1 | Podgląd jednoplikowy. **0 base64 `data:` URI**; zawiera 4 inline SVG data URI generowane w JS (`url("data:image/svg+xml,"+encodeURIComponent(...))` — kursory/ikony). Nie jest assetem runtime. |
| `gra/tools/` (wszystkie pliki) | 41 619 272 B | 1174 | Narzędzia/dane deweloperskie: 950 `.cjs`, 137 `.ts`, 41 `.py`, 15 `.ps1`, 11 `.html`, 5 `.mjs`, 5 `.md`, 3 `.xlsx`, 3 `.json`, 2 `.txt` (+ pozostałe). Nie assety runtime. |
| `gra/tools/*.xlsx` (3 pliki: `Jednostki-parametry-TW-v3-STAN.xlsx` 21 153 B, `Jednostki-parametry-TW-v3-PROPOZYCJA.xlsx` 24 324 B, `Jednostki-atak-TW-v3.xlsx` 9 456 B) | 54 933 B | 3 | Dane parametrów jednostek — przypisane do **P1.12** (dane), nie do P1.11. |

Korekta względem zarzutu Evaluatora: jego liczby dla `tools/` (1019 plików, 34 742 709 B) nie zgadzają się z pinem `edb8fb56` (1174 / 41 619 272 B) ani z working tree (1126 / 41 084 669 B). Wiążące są liczby z pinu.

## 8. Korekty względem rundy 1 (zapis z obrony)

1. Dodano dźwięki syntetyczne w kodzie (§5) przy kategorii SFX.
2. Dodano zależność `three` i geometrię proceduralną (§5) przy kategorii modeli 3D.
3. Dodano kategorie „inne” z liczbami (§7): `wikiBundle.json`, podgląd HTML, `tools/`, 3 xlsx.
4. Liczba „54” wycofana; podano wzorzec i wynik 12 (§4).
5. Skład sumy 441 / 49 545 994 B rozpisany co do pliku, z jawnym wykluczeniem maski `data/` (§2).
6. HEAD working tree oznaczony czasem pomiaru (`51e5ff50` w obronie); liczby z pinu `edb8fb56` (nagłówek).
