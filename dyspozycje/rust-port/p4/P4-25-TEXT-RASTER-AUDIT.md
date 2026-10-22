# P4-25 — Audyt i specyfikacja tekstu / rasteryzacji w rendererze Rust

TEMAT: `R-RUSTPORT-P4-25-TEXT-RASTER-AUDIT-Q1` · DOMAIN: GAME · runda 1/5 · Operator
Baza dokumentów: `origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0` (`a576c63d`). Web: pin `edb8fb56` (tylko `git show` / `git grep` / `git archive` do scratchpadu; zero buildu i uruchomienia weba). Crate renderera: `origin/rust-port/parity-v2` (`e810d0d3`), tylko odczyt.
Decyzje wejściowe: **D-RR-4 = A** (tekst na mapie rysuje Rust, font dołączony do gry, `LEDGER.md:123`), **UI-Q2 = A** (etykiety zakotwiczone rysuje Rust, `LEDGER.md:134`). Temat projektowo-odczytowy: zero kodu w `rust-port/**`, `gra/**`, `src-tauri/**`.

Dowody surowe: `dyspozycje/autobot/runs/R-RUSTPORT-P4-25-TEXT-RASTER-AUDIT-Q1/dowody/` (pliki `01`–`07`, dwa jednorazowe spike'i w scratchpadzie, skopiowane jako `spike-text/`, `spike-svg/`).

Konwencja: `plik:linia` bez prefiksu = `gra/src/` w pinie `edb8fb56`. `NIE_ZMIERZONO` = nie sprawdzone w tym temacie. `[zewn., niezweryfikowane]` = wiedza spoza repo i spoza pomiaru.

---

## 0. Streszczenie

1. **Inwentarz:** 149 linii `git grep` (wzorzec w §1) w 10 plikach. Wynika z nich **15 producentów tekstur 2D** (14 w `render/**`, 1 w `battle/**`) oraz 1 kanwa HUD w DOM (minimapa bitwy, to nie tekstura). Plus 3 grupy etykiet DOM z `main.ts`/`battleScene.ts`, które według UI-Q2 = A przechodzą do Rust (§2.3).
2. **Web używa 34 członków API `CanvasRenderingContext2D` i `CanvasGradient.addColorStop`** (§4.1). Nie używa m.in. `globalAlpha`, `globalCompositeOperation`, `setLineDash`, `bezierCurveTo`, `ellipse`, `createRadialGradient`, `createPattern`, `filter`, `imageSmoothing*` (0 trafień w kanwach).
3. **Fonty:** w pinie nie ma ani jednego pliku fontu ani `@font-face`. Wszystkie fonty na mapie to stosy systemowe z Windows: `Segoe UI`, `Segoe UI Symbol`, `Segoe UI Emoji`, `Arial`, `Georgia`, plus generyczne `serif`/`sans-serif`. To fonty własnościowe, więc **nie wolno ich dołączyć do gry**. Wygląd 1:1 co do glifu jest niemożliwy. Osiągalna jest zgodność metryczna dla Arial (Liberation Sans, zmierzone) i Times New Roman (Liberation Serif). Dla Georgii i Segoe UI otwarty zamiennik metryczny jest tylko kandydatem `[zewn., niezweryfikowane]` (§3).
4. **8 glifów spoza łaciny** (⚔ ☠ ◆ 👤 🔥 🍞 🔨 💰) web rysuje dziś **z fallbacku systemowego**. Liberation Sans nie ma żadnego z nich (zmierzone). Wygląd ⚔/☠/👤/🔥 zależy więc od tego, czy przeglądarka wybierze glif monochromatyczny, czy kolorowe emoji. Na Windows to `NIE_ZMIERZONO`, rozstrzyga D-TXT-3.
5. **Spike CPU bez GPU (zmierzone):** `ab_glyph 0.2.32` + `tiny-skia 0.12.0` buduje się na **Rust 1.87.0** pod `#![forbid(unsafe_code)]` (23 pakiety w locku) i rasteryzuje do bufora RGBA. Narysował pigułkę z gradientem, obrysem, tekstem „ZAŻÓŁĆ GĘŚLĄ JAŹŃ”, cyfrą z `strokeText` i emoji CBDT. Wynik jest **bitowo identyczny** w 4 wariantach: rustc 1.87 i 1.97, debug i release. Szerokość `−99,9%` w Liberation Sans Bold 13 px = 44,453 → `ceil` = **45 px**, czyli ta sama liczba co pomiar w Chromium cytowany w kodzie weba (`cityMapStatChip.ts:113-114`). `resvg 0.48.1` (SVG → RGBA) też buduje się na 1.87.0.
6. **Rekomendacja techniczna (do decyzji D-TXT-6):** `tiny-skia` jako jedyny rasteryzator kształtów i konturów glifów, `ab_glyph` lub `ttf-parser` do konturów i metryk, `rustybuzz` lub `harfrust` do kerningu GPOS, `resvg`/`usvg` do SVG, osobny dekoder JPG. `cosmic-text`, `vello`, `vello_cpu` odpadają na MSRV (1.89 > 1.87).
7. **Plan paczek:** RR-T8a (rasteryzator 2D „mini-Canvas”) → RR-T8b (font + tekst) → RR-T8c (obrazy: SVG/JPG/emoji) → RR-T8d (atlas/cache/upload) → MOD-08 → MOD-10 → RR-T8e (kotwice DOM → Rust). Szczegóły w §6.
8. **Decyzje właściciela:** `D-TXT-1..8` (§7). Nic nie zostało rozstrzygnięte po cichu. Domyślne wartości robocze są oznaczone jako ZAŁOŻENIE.

---

## 1. Metoda (reprodukcja)

```bash
# (1) inwentarz — 149 linii (dowody/01-grep-canvas-render-battle.txt)
git grep -nE "getContext\(['\"]2d|fillText|measureText|\.font *=|CanvasTexture|SpriteMaterial|new (THREE\.)?Sprite\b|OffscreenCanvas|strokeText" \
  edb8fb56 -- 'gra/src/render/**' 'gra/src/battle/**'
# rozkład per plik: battleScene 8, cities 12, cityMapStatChip 35, cityOkolicaOverlay 16,
#   siegeMarker 9, unitOwnerEmblem 13, unitStatPlate 18, unitUpgradeBadges 3, units 25,
#   workerFieldOverlay 10  (suma 149)
# uzupełnienie: kanwy przekazywane jako parametr i drawImage
git grep -nE "createElement\(['\"]canvas|CanvasRenderingContext2D|drawImage" edb8fb56 -- 'gra/src/render/**' 'gra/src/battle/**'
# (2) wywołania ctx.* per plik — po `git archive edb8fb56 gra/src … | tar -x` do scratchpadu
#     (dowody/02-ctx-calls-per-file.txt, skrypt: grep -ohE "\b(ctx|measure)\.[a-zA-Z]+\b *[(=]?")
# (3) fonty
git ls-tree -r --name-only edb8fb56 | grep -iE "\.(woff2?|ttf|otf|eot)$"     # → 0 linii
git grep -nE "@font-face|fonts\.googleapis|fonts\.gstatic" edb8fb56 -- 'gra/**'  # → 0 linii
git grep -nE "document\.fonts|FontFace" edb8fb56 -- 'gra/src/**'               # → 0 linii
# (4) crate'y: `cargo info <crate>` (crates.io przez proxy) + rozpakowane .crate z ~/.cargo/registry/cache
#     (dowody/03-, 04-); pokrycie glifów fontami systemu kontenera: fc-list ":charset=<cp>" (dowody/05-)
# (5) spike: dowody/spike-text (ab_glyph+tiny-skia), dowody/spike-svg (resvg), log: dowody/06-spike-text-run.txt
```

Pin nie zawiera `node_modules`, więc źródeł Three r169 nie ma w repo. Wszystkie domyślne ustawienia `CanvasTexture` z Three (np. `minFilter`) są oznaczone jako `[zewn., niezweryfikowane]`.

---

## 2. Inwentarz użyć Canvas 2D / tekstu (zadanie 1)

### 2.1 Producenci tekstur 2D (pełna lista z 149 linii grep)

„Odświeżanie” mówi, kiedy kod tworzy kanwę na nowo. „Cache” mówi, czy wynik jest ponownie używany. Filtry podaję tylko wtedy, gdy kod ustawia je jawnie. Bez jawnego ustawienia obowiązują domyślne Three `[zewn., niezweryfikowane]`.

| # | Producent (plik:linia) | Co rysuje | Rozmiar kanwy (px) | Cache | Odświeżanie | Filtry / materiał |
|---|---|---|---|---|---|---|
| T1 | `render/cities.ts:708-721` `_revoltTexture` | glif **🔥** U+1F525, `48px serif`, center/middle w (32,36); `fillStyle` nieustawiony (domyślny czarny) | 64×64 | 1 na `CityRenderer` (`revoltTex`) | raz | domyślne; `SpriteMaterial` `:738-743`, skala 0,9 |
| T2 | `render/siegeMarker.ts:35-49` `siegeSpriteTexture` | glif **⚔** U+2694, `bold 96px Arial`, (64,70); `fillStyle` domyślny (czarny) | 128×128 | singleton modułu | raz | domyślne; sprite `:118-128`, skala 1,35. Rust: `SIEGE_GLYPH` jako dane (`renderer/src/models/misc/siege.rs:413-420`), rasteryzacja otwarta (P4-22) |
| T3 | `render/units.ts:6287-6311` `_makeStarvingChipSprite` | glif **☠** U+2620, `#e01e1e`, `bold 104px "Segoe UI Symbol","Segoe UI Emoji","Segoe UI",Arial,sans-serif` | 128×128 | **brak** | nowa kanwa przy każdym `_applyStackDisplay` (`:6184` → `:6262`), stara zwalniana `:6237-6245` | domyślne; opacity |
| T4 | `render/units.ts:6319-6367` `_makeGoldDeficitChipSprite` | sam kształt: 3× `arc`, `fill`/`stroke`, `save/translate/rotate/fillRect/restore` (przekreślenie) | 128×128 | **brak** | jak T3 (`:6272`) | domyślne |
| T5 | `render/units.ts:6369-6392` `_makeStackBadgeSprite` | koło + obrys, tekst **`×N`** (U+00D7 + cyfry), `bold 26px Segoe UI, Arial, sans-serif` | 64×64 | **brak** | przy każdym `_applyStackDisplay` (`:6202-6218`) | domyślne |
| T6 | `render/units.ts:6580-6603` `_makePathTurnLabelSprite` | `roundRect` r=6, fill+stroke, tekst = numer tury, `bold 20px Segoe UI, Arial, sans-serif` | 128×48 | **brak** | przy każdej trasie (`:6565`, `:6572`), zwalniane w `clearPathRoute` `:6620-6630` | domyślne. Wywołania w `main.ts:25274`, `:25303` podają tylko `turnStops` (liczby) |
| T7 | `render/unitStatPlate.ts:403-447` `getPlateBgAsset` | `roundedRectPath` (`arcTo`×4) fill+stroke 5 px, 2 koryta pasków | **512×168** (`BG_CANVAS_H = round(512·0,194/0,590)`, `:312`; komentarz „130” przy `:312` jest nieaktualny) | singleton | raz | **mipmapy**, `LinearMipmapLinear`, sRGB; `MeshStandardMaterial` (bryła, nie sprite) |
| T8 | `render/unitStatPlate.ts:556-578` `getPowerFrameTexture` | zaokrąglony prostokąt, wnętrze `rgba(6,9,14,.9)`, biały obrys 12 px (barwa przez `material.color`) | 256×213 | singleton | raz | `LinearFilter`, sRGB |
| T9 | `render/unitStatPlate.ts:602-625` `getPowerDigitMaterial` | cyfra 0–9: **`strokeText`** (28 px, `lineJoin=round`, `#05070b`) + `fillText` `#fdf6e3`, `900 118px "Segoe UI", Arial, sans-serif` | 72×126 | 10 sztuk na grę | raz na cyfrę | **mipmapy**, sRGB |
| T10 | `render/unitOwnerEmblem.ts:327-412` `getEmblemAsset` | tarcza (`arc` fill+stroke), glif zastępczy **☠/◆** `bold 58px "Segoe UI Symbol","Segoe UI",Arial`. Asynchronicznie `drawImage`: portret JPG (`clip` do koła, cover-fit) albo sygnet SVG 76 px | 128×128 | per wariant (`civ:<id>:<era>`, `cs:<id>`, `barb`) | raz, potem **przemalowanie** po wczytaniu obrazka (`needsUpdate`) | `LinearFilter`, sRGB |
| T11 | `render/unitUpgradeBadges.ts:312-342` `getBadgeAsset` | `roundedRectPath` (`arcTo`) r=24, fill + obrys 9 px, `drawImage` ikony SVG 92 px | 128×128 | per (ścieżka, poziom), maks. 6 | raz + przemalowanie | **mipmapy**, sRGB |
| T12 | `render/workerFieldOverlay.ts:63-109` `getWorkerIconTexture` | 2 obręcze + krążek (`arc`), glif **👤** U+1F464 `bold 16px Segoe UI, Arial`, `fillStyle rgba(255,255,255,.92)` | 64×64 | `Map` per (właściciel, gracz?) | raz; czyszczenie tylko w `disposeWorkerFieldSpriteCache` `:208-211` | `LinearFilter`, sRGB |
| T13 | `render/cityOkolicaOverlay.ts:181-228` `makeLabelSprite` (+ `drawWorkerBadge` `:119-143`, `drawYieldLine` `:145-179`) | emoji **🍞 🔨 💰** (`"Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif`, 16/18 px) + liczby `bold 16/20px Arial` z **cieniem** (`shadowBlur` 2–3, `shadowOffsetY` 1); opcjonalnie odznaka 👤 `bold 13px Segoe UI, Arial` | 128 × h, h ∈ [46, 72] bez robotnika, [68, 98] z robotnikiem (1–3 wiersze) | **brak** | cała grupa przebudowywana przy każdym `syncCityOkolicaOverlay` (`:310-323`, `main.ts:5755`) | `LinearFilter`, sRGB |
| T14 | `render/cityMapStatChip.ts:782-935` `paintCityMapBadgeOntoCanvas` + `:1052-1124` | pigułka miasta: zaokrąglony prostokąt (`quadraticCurveTo`), **gradient liniowy**, obrys, pierścień stolicy, tarcza obrony (ścieżka), korona (gradient, 3 kropki), medalion (`arc`, `clip`, `drawImage` portret/sygnet, fallback **◆** `bold 20px "Segoe UI Symbol"…`), **NAZWA** `700 22px Georgia,"Times New Roman",serif` (`toUpperCase()`, przycinanie z **„…”** przez `measureText`), WZROST% `700 13px Arial` (znaki **−** U+2212, **—** U+2014, `,`, `%`), ikona produkcji SVG 16 px, kółko populacji + `700 16px Arial`, wiersz hover `600 11px Arial` (znak **·** U+00B7, „…”), ikona **!** `bold 11px Arial` | **W×H px CSS × skala**, H = 48 (+22 hover), W maks. 463 px CSS. Skala = `min(dpr≤3 × LOD{1,2,3}, 4)` przez `setTransform` (`:846-851`), więc maks. **1852 px** (komentarze `:107-134`, `:153-171`, pomiar weba) | `statTexCache` po kluczu tekstu, LOD, … (`:960-1001`) | nowa tekstura przy każdej zmianie klucza (wzrost/produkcja zmieniają się co turę, M2 w P4-3 §7.1), przemalowanie po obrazkach | `LinearFilter`, sRGB |
| T15 | `battle/battleScene.ts:18646-18665` `_makeGroupNumberTexture` | `fillRect`/`strokeRect` + cyfra `bold 16px sans-serif` | 28×28 | **brak** | przy każdym `_updateGroupFrameMarker` | domyślne |
| H1 | `battle/battleMinimap.ts:39-94` (`battleScene.ts:10933-10941`, `:11067-11072`) | minimapa: `fillRect` siatki, `arc` jednostek, `strokeRect` | 180×120 (`battleMinimap.ts:30-31`) | — | co odświeżenie HUD | **kanwa DOM w HUD, nie tekstura**. ZAŁOŻENIE Z-1: zostaje w webview (UI-Q1 = A), poza rasteryzatorem mapy |

Pozostałe trafienia grepa to obsługa materiałów i sprite'ów bez rysowania 2D (`dispose`, typy, komentarze). Przykłady: `units.ts:6206/6242/6626`, `cityOkolicaOverlay.ts:330`, `siegeMarker.ts:236`, `workerFieldOverlay.ts:188/201`, `unitOwnerEmblem.ts:43-45/436-496`, `unitStatPlate.ts:47/472/518/549`. Dalsze kanwy z `battleScene.ts:2751` i `manualBattle.ts:551` to płótna `WebGLRenderer`, nie 2D.

**`unitVeteranBadges.ts` (MOD-08) nie używa Canvas.** Gwiazdki to `ExtrudeGeometry` + `MeshStandardMaterial` (`unitVeteranBadges.ts:147-247`). Paczka MOD-08 zależy od rasteryzatora tylko przez T7–T11.

### 2.2 Kto czego potrzebuje

| Paczka | Producenci | Tekst? | Obrazy? |
|---|---|---|---|
| MOD-08 (`R-RUSTPORT-P4-MOD-08-UNIT-OVERLAY`) | T7, T8, T9, T10, T11 | T9 (cyfry, obrys), T10 (☠/◆ zastępczo) | T10 (JPG + SVG), T11 (SVG) |
| MOD-10 (`R-RUSTPORT-P4-MOD-10-CITY-CHIP`) | T12, T13, T14 | T12–T14 (PL wielkie litery, liczby, emoji) | T14 (JPG + SVG) |
| już przeniesione modele, tekstura otwarta | T1 (cities, P4-21), T2 (siege, P4-22) | glify 🔥, ⚔ | — |
| `units.ts` (MOD-04/MOD-05, nakładki statusu) | T3, T4, T5, T6 | ☠, `×N`, numery tur | — |
| bitwa (RR-T10, D-RR-9) | T15 (+ H1 w DOM) | cyfra grupy | — |

### 2.3 Etykiety zakotwiczone w DOM, które przechodzą do Rust (UI-Q2 = A)

Źródło: P4-5B §7 (`P4-5B-MAP-UI-SEAM.md:288-298`). Fonty zmierzone w pinie:

| Grupa | Web | Tekst | Font |
|---|---|---|---|
| R4 chip budowy | `main.ts:12851-12859`, `:12939-12968` | etykieta + „Kliknij hex”/„Niedozwolone”, powód (≤ 220 px) | `12px/1.2 Arial,sans-serif` (`:12856`); spany 16 px i 11 px (`:12960`, `:12963`); `box-shadow` |
| R5 etykiety oblężenia | `main.ts:14560-14603` | „⚔ OBLĘŻENIE” + `<small>` nazwa miasta | `bold 11px/1.3 Arial,sans-serif`, ⚔ w spanie 18 px (`:14569`, `:14573`) |
| R6 galeria (dev) | `main.ts:36417-36455` | nazwa typu jednostki | zależne od D-UI-7 |
| R15a liczby obrażeń (bitwa) | `battle/battleScene.ts:9091-9115` | `-<dmg>` | `bold 15px sans-serif`, `textShadow: 0 0 6px #000, 1px 1px 2px #000` |

To jest **layout HTML**: łamanie `<br>`, padding, `border-radius`, `box-shadow`. Rust musi to odwzorować ręcznie, prostym układem bloków na tym samym rasteryzatorze (RR-T8e).

### 2.4 Obserwacje dla architektury Rust

- **Trzy wzorce cyklu życia:** (a) singleton lub mały stały zbiór (T1, T2, T7–T9, T11, T12), (b) cache po kluczu treści z przemalowaniem asynchronicznym (T10, T14), (c) jednorazowe tworzenie bez cache przy każdej synchronizacji (T3–T6, T13, T15). Wzorzec (c) to w Rust naturalny kandydat na atlas + LRU (P4-3 §7.3 pkt 4). Liczba wywołań na turę: `NIE_ZMIERZONO`.
- **Asynchroniczność obrazków** (T10, T11, T14): web rysuje najpierw sam kształt, a po wczytaniu `<img>` maluje kanwę od nowa. W Rust obrazy są dostępne synchronicznie, bo zasoby są w binarce lub na dysku. ZAŁOŻENIE Z-2: Rust rysuje od razu stan końcowy, a stan pośredni („tarcza bez portretu”) nie jest odtwarzany. Odstępstwo dotyczy wyłącznie pierwszych klatek.
- **Rozmiar tekstury zależy od DPI i LOD** (T14). W Rust `dpr` daje okno natywne (`scale_factor`). Jak go uzyskać w Tauri: `NIE_ZMIERZONO`, to spike RR-T1.

---

## 3. Fonty (zadanie 2)

### 3.1 Co jest w pinie

- Pliki fontów: **0** (`git ls-tree … | grep -iE "\.(woff2?|ttf|otf|eot)$"` → pusto). Zgodne z P1-11 §2 (`p1/P1-11-ASSET-CATALOG.md:33`) i P3-13 §3.3 (`p3/P3-13-GATE-FINAL-CONTROL.md:115-117`).
- `@font-face`, Google Fonts, `document.fonts`, `FontFace`: **0 trafień**.
- Tokeny UI: `--tg-font-title: Georgia, 'Times New Roman', serif` i `--tg-font-ui: 'Segoe UI', Tahoma, sans-serif` (`ui/icons/brand/tokens.css:25-26`), `BATTLE_FONT = "'Segoe UI', Tahoma, sans-serif"` (`battle/battleHudTheme.ts:13`). Najczęstsze deklaracje w `gra/src`: `font-family:Arial,sans-serif` ×42, `var(--civ-font-ui)` ×20, `Georgia,serif` ×18 (`git grep -hoE "font-family:[^;\"]*…"`, §1).

### 3.2 Fonty na mapie (kanwy T1–T15 + kotwice R4/R5/R15a)

| Stos (tak jak w kodzie) | Grubość / rozmiar | Gdzie | Treść |
|---|---|---|---|
| `Georgia, "Times New Roman", serif` | 700 / 22 px | T14 nazwa | WIELKIE litery łac. + PL + diakrytyki obce (§3.3), „…” |
| `Arial, Helvetica, sans-serif` | 700 / 16, 13; 600 / 11; bold / 11, 16, 20 | T14, T13 | cyfry, `−`, `—`, `,`, `%`, `·`, `…`, `!`, tekst PL mieszany |
| `Arial` | bold / 96 | T2 | ⚔ (Arial go nie ma, więc fallback) |
| `"Segoe UI", Arial, sans-serif` | **900** / 118 | T9 | cyfry 0–9 |
| `Segoe UI, Arial, sans-serif` | bold / 26, 20 | T5, T6 | `×`, cyfry |
| `Segoe UI, Arial` | bold / 16, 13 | T12, T13 | 👤 (fallback emoji) |
| `"Segoe UI Symbol", "Segoe UI", Arial, sans-serif` | bold / 58, 20 | T10, T14 | ☠, ◆ |
| `"Segoe UI Symbol", "Segoe UI Emoji", "Segoe UI", Arial, sans-serif` | bold / 104 | T3 | ☠ |
| `"Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif` | 400 / 16, 18 | T13 | 🍞 🔨 💰 |
| `serif` | 400 / 48 | T1 | 🔥 |
| `sans-serif` | bold / 16; bold / 15 | T15; R15a | cyfry, `-` |
| `Arial,sans-serif` (DOM) | 400 / 12, 16, 11; bold / 11 | R4, R5 | tekst PL, ⚔ |

Wszystkie konkretne rodziny (Segoe UI, Segoe UI Symbol, Segoe UI Emoji, Arial, Georgia, Times New Roman, Tahoma) to fonty dostarczane z systemem, głównie z Windows. Ich licencja nie pozwala na redystrybucję z grą `[zewn., niezweryfikowane]`, dlatego **nie są kandydatami do dołączenia**.

### 3.3 Repertuar znaków

- Nazwy miast: `data/city-names-pools.json`, 1 665 wartości tekstowych. Po `toUpperCase()` występują **22 znaki spoza ASCII**: Ö Ł Ü Ń Ó Ø Ş Ğ Ç Ą Ż Á Ñ É Ś Ę Ú Ř Í Å Ä Ź (`dowody/07-city-names-nonascii.txt`). Wszystkie są prekomponowane (Latin-1 + Latin Extended-A), bez znaków łączących. Liberation Sans/Serif mają wszystkie (`fc-list ':charset=15e 11e 158 d8 c5'`). **Wymóg orkiestratora (pełne PL) jest spełnialny bez kształtowania złożonego** (bez łączenia diakrytyków, bez skryptów RTL).
- Interpunkcja i symbole: `× … − — · % , !` są w Liberation Sans i Serif (`dowody/05-fc-list-glyph-coverage.txt`).
- Symbole i emoji: **⚔ ☠ ◆ 👤 🔥 🍞 🔨 💰**. Liberation Sans Bold nie ma żadnego z 8, DejaVu Sans Bold nie ma 5 emoji, a Noto Color Emoji ma 7 z 8 (bez ◆). Zmierzone w spike'u: `dowody/06-spike-text-run.txt`, linie `missing`.
- `toUpperCase()` (JS) a `str::to_uppercase()` (Rust): oba są niezależne od locale. Dla 22 zmierzonych znaków wynik jest taki sam `[zewn., niezweryfikowane — nie testowano automatem]`, do testu w RR-T8b.

### 3.4 Zależność od fallbacku systemowego (D-MOD-6, sprite ⚔)

- T2 (⚔ `bold 96px Arial`), T1 (🔥 `48px serif`), T12/T13 (👤 `Segoe UI, Arial`): żaden font ze stosu nie ma glifu, więc przeglądarka wybiera font zastępczy. Który i czy kolorowy, zależy od systemu. Na Windows prawdopodobnie Segoe UI Emoji albo Segoe UI Symbol `[zewn., niezweryfikowane]`. Jaki obraz widzi dziś właściciel: **NIE_ZMIERZONO**, potrzebny zrzut, D-TXT-3.
- **Konsekwencja `fillStyle`:** T2 i T1 nie ustawiają koloru (domyślnie czarny). Glif monochromatyczny będzie więc czarny, a kolorowe emoji ma własne kolory, bo bitmapa ignoruje `fillStyle`. T3 (☠) ustawia `#e01e1e`, co działa tylko dla glifu monochromatycznego. Rust musi to jawnie odtworzyć według decyzji D-TXT-3.

### 3.5 Kandydaci open-source do dołączenia

Pomiar dotyczy fontów obecnych w kontenerze: wersje z pakietów Debian, licencje z `/usr/share/doc/<pakiet>/copyright`, rozmiary z `ls -la`. Metryczną zgodność „X ≈ Y” oznaczam jako zmierzoną tylko tam, gdzie zmierzyłem szerokość.

| Rola w webie | Kandydat | Licencja | Rozmiar pliku (Bold) | Zgodność metryczna |
|---|---|---|---|---|
| Arial (T13, T14, R4, R5) | **Liberation Sans** (Regular/Bold) | SIL OFL 1.1 (`fonts-liberation2/copyright`) | 414 568 B | **zmierzona na 1 próbce:** `−99,9%` 700 13 px = 44,453 → `ceil` 45, tak samo jak pomiar Chromium cytowany w `cityMapStatChip.ts:113-114`. Szersza próba: RR-T8b |
| Georgia (T14 nazwa) | Gelasio `[zewn., niezweryfikowane: deklarowany zamiennik metryczny Georgii; w kontenerze brak]`; awaryjnie Liberation Serif (= metryka Times New Roman, drugi element stosu) | OFL `[zewn.]` / SIL OFL 1.1 | — / 370 196 B | Liberation Serif Bold 22 px `UMGUNGUNDLOVU` = **213,877 px**. Kod weba podaje 213,9 px „w żywym Chromium fontem `700 22px Georgia`” (`cityMapStatChip.ts:103-104`). Zgodność do 0,03 px **sugeruje**, że pomiar weba wykonano bez Georgii, na fallbacku Times New Roman → Liberation Serif (Linux). To wniosek, nie pomiar: **NIE_ZMIERZONO**, D-TXT-1 |
| Segoe UI (T5, T6, T9, T12) | brak zamiennika metrycznego w kontenerze. Kandydaci: Selawik `[zewn., niezweryfikowane: OFL, deklarowany fallback Segoe UI]`, Noto Sans / Open Sans `[zewn.]`; w kontenerze są Inter i DejaVu Sans | — | — | NIE_ZMIERZONO. Grubość **900** (T9) wymaga fontu z odmianą Black/Heavy albo osi `wght` |
| Segoe UI Symbol (◆ ☠ ⚔) | DejaVu Sans (ma ⚔ ☠ ◆) | Bitstream Vera + modyfikacje (`fonts-dejavu-core/copyright`) | 708 920 B | glify inne niż Segoe; tylko pokrycie |
| emoji (🔥 👤 🍞 🔨 💰, opcjonalnie ⚔ ☠) | **Noto Color Emoji** | SIL OFL 1.1 + Apache-2.0 (`fonts-noto-color-emoji/copyright`) | **10 788 068 B** (CBDT, bitmapy PNG 136×128 przy 109 ppem, zmierzone) | wygląd inny niż Segoe UI Emoji (D-TXT-3). Rozmiar: podzbiór do 8 glifów to KB, nie MB, ale wymaga narzędzia (`NIE_ZMIERZONO`) |

**Co trzeba dołączyć dla „1:1 w granicach możliwego” (ZAŁOŻENIE Z-3, do decyzji D-TXT-1):** Liberation Sans Regular+Bold (Arial), font serif do nazwy miasta (Gelasio albo Liberation Serif Bold), font sans dla „Segoe UI” z odmianą 900, źródło symboli ⚔ ☠ ◆ oraz źródło 5 emoji. Minimum 4–6 plików TTF.

---

## 4. Wymagania rasteryzatora (zadanie 3)

### 4.1 Wywołania `ctx.*` używane przez web (zmierzone, `dowody/02-ctx-calls-per-file.txt`)

Suma po 11 plikach z kanwami 2D (10 z grepa + `battleMinimap.ts`). Wpisy `ctx.isCityState`, `ctx.isBarbarian`, `ctx.era`, `ctx.civId` w `unitOwnerEmblem.ts` to pola innego obiektu i są wykluczone.

| Kategoria | Wywołanie (liczba wystąpień) | Wymóg dla Rust |
|---|---|---|
| Ścieżki | `beginPath` 28, `moveTo` 7, `lineTo` 15, `arc` 20 (wyłącznie pełne koła 0..2π), `arcTo` 8, `quadraticCurveTo` 5, `closePath` 5, `roundRect` 1 | budowa ścieżki z łukami. `arcTo` i `roundRect` mają semantykę z HTML Canvas, a `arc` trzeba zamienić na krzywe Béziera. tiny-skia ma `PathBuilder::{move_to,line_to,quad_to,cubic_to,push_circle,close}` (użyte w spike'u) |
| Wypełnienie / obrys | `fill` 20, `stroke` 20, `fillRect` 4, `strokeRect` 3, `clearRect` 12, `lineWidth=` 24, `lineJoin=` 1 (`round`, przy `strokeText`) | AA fill (non-zero), stroke z join/cap. Domyślne `miter` (limit 10) i `butt` z Canvas trzeba ustawić jawnie |
| Kolor | `fillStyle=` 40, `strokeStyle=` 24 (CSS: `#rgb`, `#rrggbb`, `rgba()`, `rgb()`), `createLinearGradient` 2 + `addColorStop` 5 | parser kolorów CSS (wąski podzbiór) + gradient liniowy pionowy |
| Stan / transformacje | `save` 3, `restore` 3, `translate` 1, `rotate` 1, `setTransform` 1 (skala DPI), `clip` 2 (koło) | stos stanu, macierz afiniczna, maska przycięcia (tiny-skia `Mask`) |
| Cień | `shadowColor=` 3, `shadowBlur=` 3, `shadowOffsetY=` 1 (tylko T13, pod liczbami) | rozmycie gaussowskie alfa glifów. Według specyfikacji Canvas σ = blur/2 `[zewn., niezweryfikowane]`. W tiny-skia nie ma gotowego blur (`NIE_ZMIERZONO` w API, trzeba go napisać) |
| Tekst | `font=` 22 (+ `measure.font=` 2), `textAlign=` 17 (`center`, `left`), `textBaseline=` 17 (`middle`, `top`), `fillText` 18, `strokeText` 1, `measureText` 6 (+3) — wyłącznie `.width` | parser skrótu `font` (styl/grubość/rozmiar/rodziny), wybór fontu ze stosu z fallbackiem per glif, advance + kerning, baseline `middle`/`top` według metryk Canvas (em-box), tekst jako kontur (fill i stroke) |
| Obrazy | `drawImage` 6 (JPG data-URI 256×256, SVG data-URI z podmienionym `currentColor` i `stroke-width`×1,2–1,6, `unitOwnerEmblem.ts:224-233`) | dekoder JPG, rasteryzator SVG, skalowanie z filtrowaniem |
| **Nieużywane** (0 trafień w kanwach) | `globalAlpha`, `globalCompositeOperation`, `setLineDash`, `bezierCurveTo`, `ellipse`, `createRadialGradient`, `createPattern`, `filter`, `imageSmoothingEnabled/Quality`, `letterSpacing`, `fontKerning`, `getImageData`/`putImageData` | nie implementować (zakres zamknięty, chroniony testem listy w RR-T8a) |

### 4.2 Kształtowanie tekstu

- **Kerning:** Chromium domyślnie stosuje kerning (`fontKerning = "auto"`) przez HarfBuzz, czyli tabelę GPOS `[zewn., niezweryfikowane]`. `ab_glyph::Font::kern_unscaled` czyta wyłącznie starą tabelę `kern` (`owned_ttf_parser-0.25.1/src/preparse.rs:109-114`, `glyphs_hor_kerning` z „pre-parsed kern subtables”). Dla 1:1 kerningu par trzeba shapera GPOS: `rustybuzz` lub `harfrust` (§5). W spike'u kerning `kern` nie zmienił żadnej z 3 próbek.
- **Ligatury:** łacińskie ligatury standardowe (`fi`, `fl`) w fontach weba Chromium włącza domyślnie `[zewn.]`. Na mapie występują w tekście mieszanym T14-hover i R4 („Brak surowców…”, nazwy produkcji). Wpływ: `NIE_ZMIERZONO`. Shaper załatwia to razem z kerningiem.
- **Diakrytyki PL i obce:** wyłącznie prekomponowane (§3.3), więc wystarczy mapowanie cmap znak → glif. Spike wyrenderował „ZAŻÓŁĆ GĘŚLĄ JAŹŃ” bez brakujących glifów (`missing glyphs in PL sample: 0`).
- **Przycinanie z „…”** (T14 `truncateName` `:766-779`, hover `:709-715`): pętla `measureText(s + '…')` po **jednostkach UTF-16** (`slice(0,-1)`). Dla znaków BMP to to samo co `char` w Rust, a nazwy nie zawierają znaków spoza BMP (§3.3). Wymóg: `measure()` w Rust zwraca te same liczby co dla wybranego fontu, a pętla działa identycznie.
- **Skala fontu:** `PxScale` w `ab_glyph` to wysokość ascent−descent, **nie** em CSS. Spike: `css_scale(LiberationSans, 13) = 14,5234`. Trzeba przeliczać `px · height_unscaled / units_per_em` albo liczyć ręcznie `advance · px / upem` (tak w spike'u). Pułapka do testu w RR-T8b.

### 4.3 Antyaliasing, emoji, tekstury

- **AA:** Canvas 2D w Chromium rysuje tekst do kanwy offscreen **w skali szarości** (bez subpikseli LCD, bo kanwa jest przezroczysta) `[zewn., niezweryfikowane]`. Wymóg dla Rust: AA w skali szarości przez pokrycie (tiny-skia `anti_alias = true`), **bez subpikseli i bez hintingu** (ZAŁOŻENIE Z-4). Hinting w Chromium na Windows (DirectWrite): `NIE_ZMIERZONO`. Wpływa na tolerancję D-TXT-4.
- **Kolorowe emoji:** Noto Color Emoji to **CBDT**: `outline = None`, `glyph_raster_image2 → Png 136×128 @ 109 ppem` (zmierzone dla 🔥 👤 ⚔). Rasteryzator musi umieć wkleić bitmapę RGBA skalowaną z ppem do px CSS (spike: dekodowanie PNG przez `tiny-skia` + `draw_pixmap` ze skalą). Fonty COLR/SVG-in-OT: `NIE_ZMIERZONO` (nieużywane, jeśli wybierzemy CBDT albo monochrom).
- **Alfa i kolor:** kanwa Chromium trzyma kolory w sRGB, a Three dostaje teksturę z `colorSpace = SRGBColorSpace` (T7–T14). tiny-skia pracuje na **premultiplied RGBA8** w sRGB (`Pixmap`). Upload do wgpu: `Rgba8UnormSrgb` + konwersja na alfa niepremultiplikowaną albo blending premultiplikowany. Do ustalenia w RR-T8d. Jak Three ustawia `premultiplyAlpha` dla `CanvasTexture`: `[zewn., niezweryfikowane]`.
- **Mipmapy / filtry:** jawnie `LinearMipmapLinear` + mipmapy (T7, T9, T11), `LinearFilter` bez mipmap (T8, T10, T12–T14). Domyślne Three dla T1–T6, T15 `[zewn., niezweryfikowane]`. W Rust mipmapy trzeba generować samemu (CPU box-filter albo pass GPU), bo wgpu nie ma `generateMipmaps` `[zewn.]`.
- **DPI:** T14 skaluje kanwę przez `dpr` (≤ 3) × LOD (1–3), maks. ×4, a layout zostaje w px CSS. Pozostałe kanwy mają stały rozmiar niezależny od DPI. W Rust: ten sam kontrakt (rozmiar logiczny × skala, transform), test na 4 skalach.

### 4.4 Testowalność bez GPU

Rasteryzacja na CPU do bufora RGBA jest w pełni testowalna w CI bez adaptera GPU. Zmierzone: ten sam bufor (`rgba_fnv64=95001f28a03f7ebc`, PNG sha256 `b8fa5178…68a51`) na rustc 1.87.0 release, 1.87.0 debug i 1.97.0 release, x86_64. Inne architektury (aarch64, ścieżki SIMD tiny-skia): **NIE_ZMIERZONO**. Testy bitowe Rust↔Rust (złote hashe) są więc wykonalne na jednej platformie CI. Porównanie z webem nie może być bitowe (§5.3).

---

## 5. Opcje implementacji w Rust (zadanie 4)

### 5.1 Crate'y (crates.io przez `cargo info`, 2026-10-22; źródła z rozpakowanych `.crate`)

`unsafe w src` = liczba linii z `\bunsafe\b` w `src/` paczki (wskaźnik, nie audyt). `forbid` = obecność `forbid(unsafe_code)` w `src/lib.rs`. **`#![forbid(unsafe_code)]` w `civ-renderer` (`P4-6-RENDERER-CRATE-SCAFFOLD.md:61`) obowiązuje tylko kod tego crate'a, zależności go nie dziedziczą.** Polityka wobec `unsafe` w zależnościach to D-TXT-7.

| Crate | Wersja | Licencja | MSRV (`rust-version`) | `.crate` B | LOC `src` | unsafe w src / forbid | Rola | Uwagi |
|---|---|---|---|---|---|---|---|---|
| `tiny-skia` | 0.12.0 | BSD-3-Clause | brak w Cargo.toml; **zbudowane na 1.87.0** | 268 071 | 15 466 | 152 / nie | rasteryzator 2D (ścieżki, AA, gradienty, stroke, clip, pixmap, PNG) | pokrywa §4.1 poza tekstem i blur; zależności: `arrayref arrayvec bytemuck cfg-if log png tiny-skia-path` |
| `ab_glyph` | 0.2.32 | Apache-2.0 | brak; **zbudowane na 1.87.0** | 20 967 | 1 931 | 0 / nie | parser fontu, kontury, metryki, bitmapy CBDT | kerning tylko `kern` (§4.2) |
| `ttf-parser` | 0.25.1 | MIT OR Apache-2.0 | 1.63.0 | 201 121 | 23 196 | 3 / tak | niskopoziomowy parser (pod ab_glyph, rustybuzz) | — |
| `fontdue` | 0.9.5 | MIT OR Apache-2.0 OR Zlib | brak | 142 035 | 5 060 | 30 / nie | własny rasteryzator glifów + layout | rasteryzuje glify sam, więc dwa rasteryzatory (glif ≠ kształt); zależy od `rayon` |
| `rustybuzz` | 0.20.1 | MIT | brak | 272 721 | 29 264 | 25 / nie | shaper (port HarfBuzz), GPOS kerning, ligatury | zależy od `ttf-parser`; ma też `wasmi` w zależnościach (opcjonalne? `NIE_ZMIERZONO`) |
| `harfrust` | 0.15.0 | MIT | 1.85 | 356 317 | 42 204 | 27 / tak | shaper (następca rustybuzz na `read-fonts`) | zgodny z MSRV 1.87 deklaratywnie, build NIE_ZMIERZONO |
| `skrifa` | 0.49.0 | MIT OR Apache-2.0 | 1.85 | 349 449 | 41 381 | 0 / tak | parser + kontury + metryki (fontations) | alternatywa dla ab_glyph |
| `swash` | 0.2.10 | Apache-2.0 OR MIT | brak | 238 263 | 26 528 | 54 / nie | shaper + scaler + rasteryzator glifów | jak fontdue: drugi rasteryzator |
| `cosmic-text` | 0.19.0 | MIT OR Apache-2.0 | **1.89** | 2 962 391 | 11 805 | 1 / nie | pełny layout + shaping + fallback fontów | **MSRV > 1.87, odpada** (chyba że D-TXT-8). Ciężkie zależności (`syntect`, `sys-locale`, `fontdb`) |
| `vello` | 0.11.0 | Apache-2.0 OR MIT | **1.89** | 67 259 | 5 482 | 1 / nie | rasteryzator 2D na GPU (wgpu 30.0.0) | MSRV > 1.87, wymaga GPU, więc testy CPU niemożliwe; **odpada** |
| `vello_cpu` | 0.3.0 | Apache-2.0 OR MIT | **1.89** | 129 991 | 13 954 | 0 / tak | rasteryzator 2D CPU | MSRV > 1.87, **odpada** (chyba że D-TXT-8) |
| `resvg` | 0.48.1 | Apache-2.0 OR MIT | 1.85.0; **zbudowane na 1.87.0** (`default-features=false`, 37 pakietów w locku) | 78 696 | 4 614 | 0 / tak | SVG → pixmap tiny-skia | wymaga `tiny-skia 0.12.0`, czyli tej samej wersji co rasteryzator |
| `usvg` | 0.48.1 | Apache-2.0 OR MIT | 1.85.0 | 146 652 | 19 373 | 0 / tak | parser SVG (pod resvg) | tekst w SVG przez `fontdb`+`harfrust` (cecha opcjonalna; ikony weba tekstu nie mają, `NIE_ZMIERZONO`) |
| `zune-jpeg` | 0.5.16-rc3 (najnowsza w indeksie) | MIT OR Apache-2.0 OR Zlib | 1.77.1 | 144 678 | 15 999 | 89 / tak (cfg) | dekoder JPG portretów | wersja RC jako „latest”; stabilną wybrać w RR-T8c |
| `jpeg-decoder` | 0.3.2 | MIT OR Apache-2.0 | 1.61.0 | 745 371 | 5 400 | 16 / tak | dekoder JPG (alternatywa) | zależy od `rayon` |
| `fontdb` | 0.24.0 | MIT | 1.71 | 119 122 | 2 857 | 6 / nie | baza fontów systemowych | **niepotrzebny**, bo fonty są dołączane (D-RR-4 = A) |
| `image-compare` | 0.5.0 | MIT | brak | — | — | — | SSIM/RMS do testów | kandydat do metryki §5.3 (dev-dep) |
| `dssim-core` | 3.5.1 | **AGPL-3.0** | brak | — | — | — | SSIM | **licencja AGPL, odradzam** |

Surowe dane: `dowody/03-crates-io-cargo-info.txt`, `dowody/04-crates-src-inspect.txt`.

### 5.2 Spike (zmierzone, kod jednorazowy poza repo, kopia w `dowody/spike-*`)

- `spike-text`: `ab_glyph =0.2.32` + `tiny-skia =0.12.0`, `rust-version = "1.87"`, `incompatible-rust-versions = "fallback"` (jak `civ-renderer`), `#![forbid(unsafe_code)]`. `cargo +1.87.0 build --release`: OK, 21,07 s, **23 pakiety w locku**. Rysuje pigułkę 360×48: gradient liniowy, zaokrąglony prostokąt z `quad_to`, obrys 2 px, tekst PL jako kontury glifów wypełnione AA, cyfra z obrysem `LineJoin::Round` + wypełnieniem (wzór T9), emoji 🔥 z CBDT/PNG. Wynik `dowody/spike-text/out.png`.
- `spike-svg`: `resvg =0.48.1` (`default-features = false`) na 1.87.0: OK. SVG 24×24 → 92×92 (wzór T11) daje 1 056 nieprzezroczystych pikseli.
- Determinizm: 4 przebiegi (1.87 release ×2, 1.87 debug, 1.97 release) dają ten sam hash RGBA i PNG.

### 5.3 Metryka zgodności wizualnej z webem (propozycja do D-TXT-4 / D-RR-6)

Bitowa zgodność z Chromium **nie jest możliwa**: inny font (§3), inny rasteryzator AA, możliwy hinting. Proponuję trzy warstwy:

1. **Layout (twarde, bez GPU, bez przeglądarki w CI):** szerokości `measureText` i wymiary kanw (W×H) dla zbioru tekstów referencyjnych (nazwy z puli, etykiety WZROST%, liczby). Tolerancja np. ±0,5 px na tekst i **identyczne decyzje przycięcia „…”**. Referencję z Chromium nagrywa się raz, dla wybranych fontów dołączonych przez `@font-face` do strony testowej. Narzędzie: istniejące pomiary weba (`dowody/pomiar-plakietki-runda-4.cjs`, cytowane w `cityMapStatChip.ts:133-134`). Uruchomienie w tym środowisku: **NIE_ZMIERZONO**.
2. **Regresja Rust↔Rust (twarde, bitowe):** złote hashe RGBA każdej tekstury T1–T15 (§4.4). Działa w CI bez GPU.
3. **Wizualnie vs zrzut z przeglądarki (miękkie, ręczne):** SSIM lub udział pikseli z ΔE > próg per tekstura, z maską tekstu (P4-3 §8 pkt 3). Zrzuty: kanwy 2D z Chromium przez `canvas.toDataURL()` w dev-buildzie weba albo zrzuty ekranu właściciela. Narzędzie: `image-compare 0.5.0` (MIT) jako kandydat. **Progi i narzędzie: NIE_ZMIERZONO**, decyzja D-TXT-4. Bez GPU porównujemy **tekstury** (wyjście rasteryzatora CPU), nie klatki sceny. Porównanie klatek wymaga GPU i maszyny właściciela (D-RR-2, RR-T1).

---

## 6. Plan paczek (zadanie 5)

Numeracja rozwija RR-T8 z P4-3 §9 (`P4-3-RUST-RENDERER-ARCH.md:404`). Allowlisty są proponowane: `rust-port/renderer/src/raster/**`, `…/text/**`. Zmiany `Cargo.toml`/`Cargo.lock` są jawnie przydzielane jednej paczce naraz (`P4-6-RENDERER-CRATE-SCAFFOLD.md:36`).

| Paczka | Zakres | Zależności | Kryterium końca (binarne) | GPU? |
|---|---|---|---|---|
| **RR-T8a** rasteryzator kształtów „mini-Canvas” | API wzorowane na §4.1 (bez tekstu i obrazów): ścieżki (`arc`, `arcTo`, `roundRect`, `quad`), fill/stroke/join, kolory CSS, gradient liniowy, `save/restore/translate/rotate/setTransform`, `clip`, `fillRect/strokeRect/clearRect`, **cień (blur)**. Nowa zależność `tiny-skia` | D-TXT-6 | T4, T7, T8 (bez tekstu) i kształty T14 wyrenderowane do RGBA; złote hashe; test „lista wywołań §4.1 zamknięta” | nie |
| **RR-T8b** font + tekst | dołączone pliki fontów (D-TXT-1), parser skrótu `font`, stos rodzin → font dołączony z fallbackiem per glif (D-TXT-2), metryki/advance/kerning (shaper wg D-TXT-6), `textAlign/textBaseline`, `fillText/strokeText` jako kontury przez RR-T8a, `measureText().width`, przycinanie „…” | RR-T8a, D-TXT-1/2/6 | szerokości z tabeli referencyjnej (§5.3 pkt 1) w tolerancji; 22 znaki §3.3 + interpunkcja bez `.notdef`; T5, T6, T9, T15 wyrenderowane | nie |
| **RR-T8c** obrazy | JPG (portrety 256×256), SVG z podmianą `currentColor` i `stroke-width` (port `prepareSvgForCanvas`), emoji/symbole wg D-TXT-3 (bitmapa CBDT albo glif mono z kolorem), `drawImage` ze skalą i `clip` | RR-T8a, D-TXT-3 | T10, T11 i medalion T14 wyrenderowane; T1, T2, T3, T12, T13 z glifami wg D-TXT-3 | nie |
| **RR-T8d** atlas / cache / upload | klucze treści (port `cityMapBadgeKey`), polityka LRU/refcount (P4-3 §7.3 pkt 4, klasa M2), upload do wgpu (sRGB, premultiplied), mipmapy CPU dla T7/T9/T11, skala DPI×LOD z limitem 2048 | RR-T8a–c, RR-T5 (rejestr zasobów), RR-T1 (DPI) | test „N tur” bez wzrostu liczby tekstur; część GPU w `--features gpu` | częściowo |
| **MOD-08** | nakładki jednostek T7–T11 (+ gwiazdki weterana: geometria, bez rasteryzatora) | RR-T8a–d, paczka 2 (P4-4) | wg dispatchu MOD-08 | wg MOD |
| **MOD-10** | T12, T13, T14 | RR-T8a–d, 8, 9, 13 (P4-4 `:559`) | wg dispatchu MOD-10 | wg MOD |
| **RR-T8e** kotwice DOM → Rust | R4, R5, R15a (§2.3): prosty layout bloków (padding, `border-radius`, łamanie `<br>`, `box-shadow` jako blur) na RR-T8a/b | RR-T8b, P4-5B §7 | 3 grupy wyrenderowane; pozycjonowanie wg P4-5B | nie (tekstura), tak (scena) |
| tekstury „luźne” | T1 (`cities`), T2 (`siege`), T3–T6 (`units`), T15 (bitwa) | RR-T8a–c | dopięcie do istniejących modułów (P4-21, P4-22, MOD-04/05, RR-T10) | — |

**Kolejność:** RR-T8a → RR-T8b ∥ RR-T8c (rozłączne allowlisty: `text/**` oraz `raster/image/**`) → RR-T8d → MOD-08 → MOD-10 → RR-T8e. Odpowiada to P4-4 `:574` (paczka 8 przed 10). Ścieżka krytyczna MOD-08 nie wymaga emoji (T7–T11 mają tylko cyfry i ☠/◆ zastępczo), więc MOD-08 może ruszyć po RR-T8a + RR-T8b + części SVG/JPG z RR-T8c.

---

## 7. Decyzje właściciela `D-TXT-n` (NIE rozstrzygnięte)

| ID | Pytanie | Opcje | Domyślne robocze (ZAŁOŻENIE, do rewizji) |
|---|---|---|---|
| **D-TXT-1** | Które fonty dołączamy (licencja, wygląd)? | A: Liberation Sans (Arial) + Liberation Serif (nazwa miasta) + sans dla „Segoe UI” (np. Selawik/Noto Sans) + DejaVu Sans (symbole). B: jak A, ale Gelasio zamiast Liberation Serif (bliżej Georgii, `[zewn.]`). C: jeden font sans na wszystko (prostsze, większe odstępstwo) | A (licencje OFL/Bitstream Vera, metryka Arial zmierzona) |
| **D-TXT-2** | Fallback per glif czy jeden font na element? | A: łańcuch fallbacku per glif jak w przeglądarce. B: każdy element ma jeden font, a brak glifu jest błędem testu | A |
| **D-TXT-3** | ⚔ ☠ 👤 🔥 🍞 🔨 💰: kolorowe emoji czy monochrom? | A: kolorowe (Noto Color Emoji, podzbiór 8 glifów). B: monochrom (DejaVu dla ⚔ ☠ ◆; 👤 🔥 🍞 🔨 💰 trzeba zastąpić ikonami SVG). C: najpierw zrzut z gry właściciela (Windows), potem wybór | C (wygląd dzisiejszy jest NIE_ZMIERZONO, §3.4) |
| **D-TXT-4** | Akceptowalna różnica wizualna tekstu | A: tylko warstwy 1+2 z §5.3 (layout twardo, wygląd ocenia właściciel). B: dodatkowo SSIM ≥ próg na teksturach. C: ΔE + maska tekstu wg D-RR-6 | A + ocena wzrokowa; próg SSIM po pierwszych zrzutach |
| **D-TXT-5** | Referencja metryk: Chromium z fontami dołączonymi do strony testowej czy obecny web (fonty Windows)? | A: Chromium + te same pliki fontów (porównanie uczciwe). B: obecny web na Windows (porównanie z wyglądem gracza, ale fonty inne z definicji) | A dla testów automatycznych, B dla oceny wzrokowej |
| **D-TXT-6** | Stos bibliotek | A: `tiny-skia` + `ab_glyph` (kontury, metryki) + `rustybuzz`/`harfrust` (GPOS) + `resvg` + dekoder JPG. B: A bez shapera (kerning tylko z `kern`, ryzyko szerokości). C: `fontdue`/`swash` (osobny rasteryzator glifów) | A |
| **D-TXT-7** | Polityka `unsafe` w zależnościach | A: dopuszczalne w zależnościach (`forbid` tylko we własnym crate). B: tylko zależności z `forbid(unsafe_code)` (wyklucza `tiny-skia` → brak rasteryzatora CPU zgodnego z MSRV) | A |
| **D-TXT-8** | MSRV | A: zostaje 1.87 (wyklucza `cosmic-text`, `vello`, `vello_cpu`). B: podnieść do ≥ 1.89 dla tych bibliotek | A |

Związek z istniejącymi decyzjami: D-TXT-4/5 zawężają **D-RR-6**. D-TXT-6/7/8 zawężają **D-MOD-6** w części „rasteryzacja Canvas/SVG i tekstu” (`P4-4-MODEL-CATALOG.md:599`).

---

## 8. Założenia (przyjęte bez pytania, do rewizji)

- **Z-1:** minimapa bitwy (H1) zostaje kanwą DOM w webview (UI-Q1 = A), poza rasteryzatorem mapy.
- **Z-2:** Rust rysuje od razu stan końcowy tekstur zależnych od obrazków, bez fazy „tarcza bez portretu”.
- **Z-3:** „1:1” dla tekstu znaczy: te same treści, rozmiary w px CSS, kolory, układ i decyzje przycięcia. Kształt glifów różni się z konieczności (fonty Windows są nie do dołączenia).
- **Z-4:** AA w skali szarości, bez subpikseli i bez hintingu.
- **Z-5:** `turnLabel` w T6 jest w pinie nieużywany przez wywołujących (`main.ts:25274`, `:25303` podają `turnStops`). Treść T6 to więc tylko cyfry.

## 9. NIE_ZMIERZONO (zbiorczo)

Wygląd glifów ⚔ ☠ 👤 🔥 na Windows u właściciela. Domyślne ustawienia Three r169 dla `CanvasTexture` (filtry, `premultiplyAlpha`). Hinting i AA tekstu Chromium/DirectWrite. Liczba tekstur T3–T6/T13 tworzonych na turę. Determinizm tiny-skia poza x86_64. Build `harfrust`/`rustybuzz`/dekoderów JPG na 1.87 (zbudowano tylko tiny-skia, ab_glyph, resvg). Metryczna zgodność Gelasio/Selawik. Narzędzie do subsetowania emoji. Rzeczywista szerokość nazw w fontach Georgia/Segoe UI (pomiar weba może pochodzić z Linuksa, §3.5). Skala DPI okna Tauri.
