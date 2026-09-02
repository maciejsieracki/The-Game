# 01-operator — R-KARTA-JEDNOSTKI-3D-EKSPOZYCJA-UX-Q1

STATUS: PASS
DOMAIN: GAME
TEMAT: R-KARTA-JEDNOSTKI-3D-EKSPOZYCJA-UX-Q1
GOAL: Zastąpić 34×34 medalion w headerze karty encji pełnoszerokościową dioramą
(~190px, Wariant A) — ciemna scena, powiększony wyśrodkowany podgląd (3D/SVG),
elipsa gruntu, tytuł+podtytuł jako overlay; tryb compact bez zmian.

ZMIANY/COMMIT: worktree `/home/user/The-Game/.claude/worktrees/wf_kartadio-1`,
gałąź `autobot/R-KARTA-JEDNOSTKI-3D-EKSPOZYCJA-UX-Q1`, baza `3d9dd86c`.
- Runda 1: SHA `2ce99aae` — markup diaromy w `renderEntityCard` + blok CSS w
  `ENTITY_CARD_CSS` (`gra/src/ui/entityCards/renderer.ts`), nowa bramka
  `gra/tools/entity-card-diorama-real-render-test.cjs`, 8 × PNG dowodowy.
- Runda 1 (obrona, po 5 zarzutach Evaluatora): commit obrony (HEAD gałęzi, bezpośrednio po `2ce99aae`) — 4 poprawki w
  `renderer.ts`, 3 nowe sekcje bramki (D2/H/I), 4 nowe/odświeżone PNG, ten plik.
Zero zmian w adapterach, `wikiHubHud.ts`, `unitMiniPreview.ts`, `gra/data/**`,
`entity-card-historia-section-test.cjs`, `unit-card-3d-preview-coverage-test.cjs`,
`unit-info-card-entitycard-migration-test.cjs`.

## Kluczowa decyzja konstrukcyjna (bez zmian od rundy 1)

Element nagłówka **zachowuje klasę `entity-card-header`** (dostaje dodatkową
`entity-card-diorama`), bo poza allowlistą dwa pliki dopinają do niej przycisk ✕
(`unitInfoCard.ts:98`, `techDiscoveryNotice.ts:610`). Przełączanie diorama/compact
jest czysto CSS-owe — `.entity-card--compact` dochodzi dopiero po kliknięciu
„Pokaż pozostałe N", nie w chwili renderu — więc DOM jest jeden dla obu trybów,
a bazowe reguły `.entity-card-header`/`.entity-card-medallion` zostają nietknięte
jako baza trybu compact.

## OBRONA — odpowiedź na 5 zarzutów Evaluatora

### Zarzut 1 (regres ✕ w compact na ścieżce `showTechDiscoveryNotice`) → PRZYJMUJĘ

Zarzut trafny co do joty. Reguła
`.entity-card--compact .entity-card-header > :not(.entity-card-diorama-stage):not(.entity-card-title-wrap){position:static}`
(specyficzność 0,4,0) wygrywała z `.tdn-entity-close{position:absolute;…}`
(`techDiscoveryNotice.ts:746`, 0,1,0).

Poprawka: reguła **USUNIĘTA** (`renderer.ts`, w jej miejscu komentarz z pełnym
uzasadnieniem). Bez niej w compact obowiązuje pozycjonowanie z bloku diaromy
(`absolute; top:10px; right:10px`) — dokładnie te same wartości, które przycisk
miał na bazie z własnego arkusza.

Dowód: nowa sekcja **(D2)** bramki — żywe `showTechDiscoveryNotice({techName:
'Łucznictwo', eraIndex:0, kind:'preview'})` + `more.click()`, pomiar PRZED i PO:
```
[tdn] before {"compact":false,"btnPosition":"absolute","btnFromRight":10,"btnFromTop":10,"hitClass":"tdn-entity-close"}
      after  {"compact":true, "btnPosition":"absolute","btnFromRight":10,"btnFromTop":10,"hitClass":"tdn-entity-close"}
```
Zrzut: `dowody/1c-tdn-compact-przycisk-zamkniecia.png` (✕ w prawym górnym rogu).

### Zarzut 2 (martwa/szkodliwa reguła fallbacku 44px + mylący komentarz) → PRZYJMUJĘ

Oba człony trafne. `font-size:44px` (0,3,0) przegrywało z
`unitInfoCard.ts:396` (0,3,0, arkusz wstrzykiwany później), a tam gdzie działało —
przycinało tekst, bo 44px pasuje do glifu „⚔" (domyślka `unitMiniPreview.ts:131`),
którego **żaden** call-site kart encji nie przekazuje (`renderer.ts:55`,
`unitInfoCard.ts:83`, `unitInfoCard.ts:283` podają pełne zdanie). Komentarz o
„tej samej wartości, wyższej specyficzności" był prawdziwy dla `.unit-mini-canvas`
i fałszywy dla `.unit-mini-fallback`.

Poprawka: fallback formatowany jako TEKST —
`font-size:11px;line-height:1.3;padding:8px;text-align:center;overflow-wrap:anywhere`,
z podwojoną klasą (`.unit-mini-fallback.unit-mini-fallback`, 0,4,0), żeby wynik nie
zależał od kolejności wstrzykiwania arkuszy. Komentarz przepisany zgodnie ze stanem
faktycznym (osobno canvas, osobno fallback). Dodana też reguła przywracająca w
compact bazowe formatowanie fallbacku.

Dowód: nowa sekcja **(H)** — fallback odtworzony 1:1 jak `unitMiniPreview.ts:130-132`,
mierzony PO wstrzyknięciu arkusza `unitInfoCard` (ścieżka sporna):
```
[fallback] {"hasUnitInfoCardSheet":true,"cardIsUnit":true,"fontSize":"11px",
            "scrollW":118,"clientW":118,"scrollH":118,"clientH":118,
            "text":"Render 3D niedostępny w tym środowisku"}
```
`scrollH === clientH` → zero przycięcia. Zrzut: `dowody/H-fallback-bez-webgl-w-diaromie.png`
(pełne zdanie, czytelne, wyśrodkowane w medalionie).

### Zarzut 3 (elipsa gruntu niewidoczna, asercja tautologiczna) → PRZYJMUJĘ

Oba człony trafne. Czarny radial-gradient na tle, które przy dole sceny jest i tak
prawie czarne, dawał różnicę maks. 8/255; asercja `groundVisible === 'yes'`
sprawdzała istnienie i szerokość WĘZŁA, nie jego widoczność.

Poprawka: elipsa to teraz **jasny kontakt światła** (rozświetlenie podłoża),
`rgba(176,201,240,.50)` → przezroczystość, szersza od medalionu (186 > 120) i
przesunięta niżej (`bottom:22px`, wysokość 36px), z `border-radius:50%`.

Poprawka asercji: nowa sekcja **(I)** porównuje DWA ŻYWE ZRZUTY nagłówka
(z elipsą i z `display:none`) piksel po pikselu, dekodując je w Chromium przez
`<img>` + `canvas.getImageData`:
```
[ground-diff] {"w":432,"h":190,"total":82080,"maxDelta":38,"changed":3473}
```
38/255 maks. różnicy i 3473 piksele zmienione o ≥8/255 (wobec 8/255 i braku
pomiaru w rundzie 1). Zrzuty: `dowody/I-elipsa-gruntu-widoczna.png` vs
`dowody/I-kontrola-elipsa-gruntu-ukryta.png`.

Uwaga do protokołu: przy pierwszym uruchomieniu (I) mierzyła `maxDelta:1`, bo
zostawiony po sekcji (G) pełnoekranowy `.unit-info-card-backdrop` przykrywał
mierzoną kartę — zrzut elementu kapturuje też to, co leży NA WIERZCHU. Bramka
usuwa teraz backdrop przed (H)/(I). To był błąd pomiaru w bramce, nie w CSS, ale
pokazuje, że asercja realnie mierzy obraz, a nie deklarację.

### Zarzut 4 (SVG w compact kurczy się z 28 do 24 px) → PRZYJMUJĘ

Trafny. Reguła `.entity-card-diorama .entity-card-medallion > svg{width:100%}`
działała także w compact (nagłówek zachowuje klasę `entity-card-diorama`), a blok
kompaktowy nadpisywał tylko sam medalion, nie jego zawartość.

Poprawka: `.entity-card--compact .entity-card-medallion > svg{width:auto;height:auto;display:inline}`
— SVG wraca do rozmiaru własnego z atrybutów pliku.

Dowód: dwie nowe asercje mierzące 28px w compact na obu ścieżkach:
```
[tech-compact] {"medW":24,"medH":24,"svgW":28,"isCompact":true,…}
[tdn]  after   {"compact":true,"svgW":28,…}
```
(baza `3d9dd86c`: 28px; runda 1: 24px; teraz: 28px).

### Zarzut 5 (brak `01-operator.md` w runie) → PRZYJMUJĘ

Trafny bez zastrzeżeń. `INDEX-PROCESU.md` §3 i §6 oraz `R-PROC-AUTOBOT.md` §1
wymagają raportu w runie, a nie tylko w kanale Workflow. Poprawka: ten plik.

## TESTY (po poprawkach obrony)

- `node ./node_modules/typescript/bin/tsc --noEmit`: **0 błędów**.
- 5 bramek referencyjnych: logic **213/213**, tech-tree **19/19**,
  research **33/33**, unit-replace **13/13**, combat **6/6**.
- Nowa bramka `entity-card-diorama-real-render-test.cjs`: **46/46**
  (żywe Chromium, `page.screenshot()`) — w tym mutacja CSS (F), żywe ścieżki
  `showUnitInfoCardDialog` (G) i `showTechDiscoveryNotice` (D2), fallback (H),
  pikselowa różnica elipsy (I).
- Karty encji bez regresu: historia **31/31** (plik NIETKNIĘTY),
  action-buttons **31/31**, wonder **134/134**, 3d-preview-coverage **18/18**,
  entitycard-migration **26/26**, unit-info-card contract **23/23**,
  badges **19/19**, wiring **6/6**, army-interaction **7/7**.
- Dowody wizualne w `dowody/`: `1a-karta-jednostki-diorama.png`,
  `1a-zywa-sciezka-unitInfoCard-dialog.png`, `1b-karta-budynku/cudu-diorama.png`,
  `1c-karta-technologii-compact-bez-diaromy.png`,
  `1c-tdn-compact-przycisk-zamkniecia.png`, `1-przeglad-1280px.png`,
  `4-przeglad-380px.png`, `F-kontrola-negatywna-bez-css-diaromy.png`,
  `H-fallback-bez-webgl-w-diaromie.png`, `I-elipsa-gruntu-widoczna.png`,
  `I-kontrola-elipsa-gruntu-ukryta.png`.

## BLOKADY

Brak dla tego tematu. Dwie bramki oblewają **identycznie na bazie `3d9dd86c`**
(regres zastany, nie z tego tematu) — zweryfikowane ponownie w rundzie obrony w
osobnym worktree na `3d9dd86c`:
- `entity-card-contract-test.cjs` — crash `ReferenceError: requestAnimationFrame
  is not defined` w `mountUnitMiniPreview` pod jsdom (BAZA i HEAD: ten sam crash,
  ten sam stack `renderEntityCard`).
- `entity-card-cross-links-nested-overlay-test.cjs` — BAZA **16 pass / 8 fail**,
  HEAD **16 pass / 8 fail**.
Rekomendacja: osobne ID.

RUNDY: 1/5 (obrona tej samej rundy — licznika nie zwiększa)
NASTĘPNY KROK: Final Control (Sonnet 5, effort high)
DEPLOY/PUSH: NIE WYKONANO
