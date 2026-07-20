# DYSPOZYCJA GRAFIKA-JEDNOSTKI — wpięcie nowych modeli jednostek (kamień + brąz)
(MASTER, 2026-07-09 · wykonawca: CODE-INTEGRATOR · na hasło Macieja „start GRAFIKA-JEDNOSTKI" · rendery zatwierdza Maciej)

## 0. KANON I PLIKI
**Kanon = `gra/src/render/units.ts`** (NIE srcKopiaMaster — zamrożony!). Pliki modeli (skopiować WSZYSTKIE do `gra/src/render/`; każdy ma w nagłówku instrukcję wpięcia i wzorce nazw):
`gra-robocza/_sandbox/MASTER/render-jednostki/`:
1. `hastati-falangita.ts` — wzorzec + Hastati (żelazo) i Falangita (brąz, Grecja)
2. `jednostki-p1-rdzen.ts` — 7 kategorii bazowych (wojownik/oszczepnik/łucznik/zwiadowca/procarz/włócznik/miecznik)
3. `jednostki-p2-inka.ts` — 5 (Chaska, Estólica, topornik, Huaracoc, SUPER Królewska Gwardia)
4. `jednostki-p3-dystans.ts` — 5 (Zulu oszczepnik, łucznicy: egipski/sumeryjski/akadyjski/ASYRYJSKI-nowy)
5. `jednostki-p4-melee.ts` — 6 (Sherden, tyrreński, szekelesz, mykeński, Shang, khopesh)
6. `jednostki-p57-wlocznie-machiny.ts` — 4 (Impi, włócznik sumeryjski, Taran, Wieża oblężnicza)
7. `jednostki-p6-super.ts` — 6 elit (Grecja/Chiny/Zulu/Egipt/Sumer/Rzym)
8. `jednostki-p8a-bliskiwschod.ts` — 4 NOWE bespoke (Hetyta, Gwardia Ishtar, Babilończyk, Fenicjanin)
9. `jednostki-p8b-rozni.ts` — 4 NOWE bespoke (Strażnik Harappy, Piechota induska, LEGION RZYMSKI, Gwardzista z champi)
Import w modułach: `three` + `HEX_R` z `./hexutil` — rozwiąże się po skopiowaniu.

## 1. ZASADY SERII (przy weryfikacji każdego modelu)
Tarcza ZAWSZE w LEWEJ (+X), broń w PRAWEJ (−X) · pozy ATAKU · nakrycie głowy KAŻDA jednostka · kolor gracza wg nagłówków (pole tarczy/szarfa/lotki/chorągiew) · stopy y=0, przód=+Z · geometrie-singletony, `userData.mats`/`perTokenGeos` — interfejs tokenów gry 1:1 · budżety ≤~460-490 tri (machiny ≤700).

## 2. WPIĘCIA (kolejność dowolna, commit per paczka)
1. **P1 (kategorie):** `buildCategoryModel` — podmiana ciał case'ów: miecznik :4307 · wlocznik :4405 · lucznik :4509 · procarz :4615 · oszczepnik :4684 · zwiadowca :5501 · domyslny/default :5730 → delegacja do builderów z p1. **UWAGA:** `applyCultureOverrides` liczy na geometrię STAREGO awatara — zrewiduj (prawdopodobnie wyłączyć dla nowych modeli; kultury per-civ mają teraz własne bespoke).
2. **P2/P3/P4/P57 (istniejące named):** podmiana ciał funkcji (dispatch bez zmian): buildMaceWarrior :1070 · buildInkaJavelineer :1048 · buildAxeWarriorInka :1071 · buildInkaSlinger :1050 · buildZuluJavelineer :1017 · buildEgyptianArcher :1038 · buildSumerianArcher :1041 · buildAkkadianArcher :1044 · buildSherden :1012 · buildTyrrhenian :1061 · buildShekelesh :1062 · buildMycenaeanWarrior :1008 · buildShangHalberdier :1013 · buildKhopeshWarrior :1045 · buildImpi :1148 · buildSumerianSpearman :1151 · buildBatteringRam :1168 (+fallback :5830) · buildSiegeTower :1170. Falanga: case 'falanga' :4006 → buildFalangita (z hastati-falangita.ts); Hastati :1064 → buildHastati.
3. **P6 (super):** `buildSuperUnit` case'y :5845–:5851 → nowe buildSuperRome/Greece/China/Zulu/Egypt/Sumer; case 'inka' :5849 → buildSuperInca z p2. (Martwe buildHuBenWei/buildUThulwana/buildSumerianRoyalGuard/buildInkaRoyalGuard — NIE ruszać, przyszłe sprzątanie.)
4. **NOWE case'y w `buildNamedUnit`** (przed fallbackami; wzorce nazw w nagłówkach TS): Łucznik asyryjski (p3) · 4× Bliski Wschód (p8a — snippet w raporcie/nagłówku) · 4× p8b, w tym **Legion Rzymski KONIECZNIE przed linią ~:1179**.
5. **BUG LEGIONU (naprawa obowiązkowa, 2 miejsca):** (a) units.ts:1179 `if (n.includes('legion') && !n.includes('hastati')) return null;` — zjada Legion (usunąć/obejść nowym case'em wyżej); (b) `units/setup.ts:116` — kategoria łapie 'legionist', a nazwa to „legion rzymski" → dopisać `|| n.includes('legion')`.
6. **Fixy z audytu [późn. 3] w tym samym deployu:** FORT — usunąć `m.scale.setScalar(1/3)` (robloxImprovements.ts:404, potrójne skalowanie); OWCE (ulepszenie) :390 → buildOwca/buildZlozeOwce z pastwisko-modele (spójność z trzodą); opcjonalnie ZlozeLamy → nowa lama.
7. **POZA ZAKRESEM:** konnica/rydwany/onager (koń wpięty wcześniej — nie dublować), Galera (naval, osobny temat), jednostki epok ≥3 (żelazo = następny program; Hastati/Triari żelazne bez zmian poza Hastatim).

## 2b. ROZSZERZENIE 2026-07-10: ŻELAZO + GALERA (zlecenie Macieja „wszystkie jednostki żelaza oraz galera")
Nowe pliki w `_sandbox/MASTER/render-jednostki/` (konwencje serii jak wyżej; żelazo = ciemniejszy, zimny metal 0x8f97a3):
- `jednostki-z1-mezopotamia.ts` — Gwardia hetycka, Piechota neobabilońska, Mur tarcz (Sargonid), Garnizon Harappy — 4 NOWE case'y w buildNamedUnit (snippet w raporcie/nagłówku; „gwardia hetycka" nie koliduje z „piechota hetycka").
- `jednostki-z2-srodziemne.ts` — Tyrski miecznik, Gwardia Tyreńska, Żelazny khopesh (UWAGA: „wojownik z ŻELAZNYM khopesh" nie łapie starego case'a — nowy wzorzec nazwy), Thorakites + **TRIARI** (klęcząca poza trzeciej linii). **FIX TRIARI:** `buildSuperUnit` ignoruje nazwę — `case 'rzym'` zawsze daje Evocati; poprawka: rozróżnić po nazwie (`includes('triari') → buildTriari`).
- `jednostki-z3-plemiona.ts` — Drużynnik (Słowianie), iButho z iklwa (Zulu), **Wojownik germański SUPER** + Miecznik galijski. **FIX ROUTINGU GERMANA (3 dopiski):** (a) Culture + `'germanie'`; (b) `cultureFromName`: wzorce germansk/germanic → 'germanie'; (c) `buildSuperUnit` case 'germanie' → buildGermanSuper. (buildGermanWarrior/berserker named — bez regresji.)
- `galera-model.ts` — nowa Galera (oko apotropaiczne, taran trójzębny, wybrzuszony żagiel z emblematem gracza, 8 wioseł/burta w zamachu, 2 marynarzy, aplustre): ciało `case 'galera'` w buildCategoryModel → `buildGalera(ownerColor_)`. Interfejs wody zachowany (HULL_Y 0.10, dziób −Z, mOwner). **740 tri — MASTER akceptuje** (+6% nad budżet; jedyny statek w grze).
POZA ZAKRESEM (backlog „platformy wozów"): Rydwan celtycki, konnice asyryjskie (lanca/łuk), jeździec słowiański — koń już nowy, platformy/dekory wozów starą partią do zrobienia później.
Test Macieja (dodatkowo): Triari klęczy z hastą (nie jest kopią Evocati), German super nie jest już generykiem, Galera na wodzie z okiem i wiosłami, 12 żelaznych generyków ma twarze kultur.

## 3. BRAMKI I TEST
tsc --noEmit=0 · vite build BEZ prebuildu · bramka „nic nie stracone" vs poprzedni bundle · hashe mapy nietknięte (to render-only) · stempel host-side + WERSJE + hub · commit per paczka, JEDEN deploy.
Test Macieja: (a) playtest BITWA-DUŻA — wszystkie sylwetki, tarcze w LEWEJ, pozy ataku, kolory graczy obu stron; (b) mapa — tokeny jednostek czytelne z zoomu; (c) Legion Rzymski wygląda jak legionista (bug); (d) Ludy Morza przy Rzymie w brązie; (e) super-jednostki z chorągwiami; (f) fort większy, owce nowe.
Meldunek w kanale ze stemplem + zdanie o panelach (§8 — dane balansu nietknięte).
