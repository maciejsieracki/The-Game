TEMAT:  P-UI-ZOOM-PRZEGLADARKI-PANELE-UCIETE-Q1
RUNDA:  1/5
DATA:   2026-09-02
DOMAIN: GAME
ŚCIEŻKA: A (Workflow), model sędziego (R-PROC-AUTOBOT.md §3c)
MODEL + EFFORT per rola: Operator Sonnet 5 effort=medium / Evaluator Sonnet 5 effort=high

## WYZWALACZ
Właściciel, zrzut ekranu panelu audiencji dyplomatycznej (Grecy): "Kiedy
gracz zaznaczy, że jego monitor ma być powiększony, na przykład ze 100% do
125%, to niestety górna i dolna część nie jest widoczna i strona sama się
nie skaluje."

## RECON (wykonany przez Explore, nie powtarzać — ale NIE traktuj jako
## potwierdzonego mechanizmu, tylko jako hipotezę do zweryfikowania żywo)
1. `gra/index.html:35` — viewport meta poprawny (`width=device-width,
   initial-scale=1.0`), brak viewportu odrzucony jako przyczyna.
2. `gra/src/main.ts:1490-1493` — przy starcie gra ŚWIADOMIE ustawia
   `document.body.style.overflow='hidden'` (komentarz: canvas 3D na cały
   ekran, rozmiar sterowany JS, nie CSS vw/vh). To ŚWIADOMA decyzja
   architektoniczna (pełnoekranowa gra 3D, nie skrolowalna strona) — ALE
   jej efektem ubocznym jest ZERO fallbacku scrolla strony, gdy jakikolwiek
   panel/modal okaże się wyższy niż widoczny viewport.
3. `gra/src/ui/diplomacyAudience.ts:551` — `.civ-diplo-aud-box{width:
   min(1720px,98vw);max-height:94vh;overflow:auto;...}` — panel MA już
   własny wewnętrzny scroll oparty o `vh`, plus kolumny `.da-col` (linia
   833-834) też mają `max-height:400px;overflow-y:auto`.
4. Osobny, NIEPOTWIERDZONY jeszcze wektor: `gra/src/ui/hud.ts:478-505` —
   WŁASNY mechanizm "zoom UI" gry (komentarz: "jak Ctrl +/- w przeglądarce"),
   ustawia `body.style.transform=scale(z)` + `overflow:hidden`, trzymany w
   `localStorage['civ-ui-zoom-v1']`. `transform` na `body` zmienia containing
   block dla potomków `position:fixed` (audiencja, empire panel itd.), a
   zagnieżdżone reguły `vh` nadal liczą się względem PRAWDZIWEGO viewportu
   — potencjalne źródło rozjazdu, jeśli ten WEWNĘTRZNY zoom gry jest != 1
   RÓWNOCZEŚNIE z zoomem przeglądarki.
5. Brak jednego wspólnego mechanizmu layoutu — każdy duży panel/overlay ma
   WŁASNĄ regułę `vh`/scroll: `diplomacyPanel.ts:164,409`,
   `empireDetailPanel.ts:254,287`, `cityPanel.ts:1931-1937`,
   `entityCards/renderer.ts:516,519`. Fix jednego panelu NIE naprawia
   automatycznie pozostałych.
6. `hud.ts` komentarz przy commicie `dae8bb49` ("FALA 51: wydarzenia max
   50vh, stabilne komunikaty przy zoom UI") pokazuje że zespół już wcześniej
   łatał podobny problem dla JEDNEGO panelu (wydarzenia) pod kątem
   WEWNĘTRZNEGO zoomu gry — ale nie wiadomo czy pod kątem natywnego zoomu
   przeglądarki, i nie objęło to panelu dyplomacji.

NIEROZSTRZYGNIĘTE przez recon (do ustalenia PRZEZ CIEBIE, żywym dowodem,
zanim zdecydujesz o poprawce): czy właściciel mówi o (a) natywnym zoomie
przeglądarki (Ctrl+scroll/Ctrl+/-, ustawienie 100%→125% w Chrome), (b)
zoomie systemowym/DPI monitora (Windows/macOS "skalowanie ekranu" w
ustawieniach systemowych), czy (c) WŁASNYM mechanizmie zoomu UI gry
(hud.ts, opisany w punkcie 4). To SĄ różne mechanizmy technicznie i mogą
wymagać różnych fixów — NIE zgaduj, zweryfikuj wszystkie trzy żywo w
headless Chromium (Playwright: `page.evaluate(() =>
document.documentElement.style.zoom='1.25')` dla (a)/(c)-podobnego efektu,
CDP `Page.setDeviceMetricsOverride({deviceScaleFactor:1.25,...})` dla (b))
i zgłoś w raporcie który(-e) faktycznie reprodukują ucięcie panelu
audiencji dyplomatycznej.

## GOAL
Zakres OGRANICZONY do JEDNEGO panelu z zgłoszenia właściciela — panelu
audiencji dyplomatycznej (`diplomacyAudience.ts`, `.civ-diplo-aud-box` i
otoczenie). NIE naprawiaj innych paneli w tym temacie (empireDetailPanel,
cityPanel, entityCards) — to świadomie osobne, przyszłe tematy, ten sam
wzorzec fixu zostanie powtórzony po walidacji podejścia tutaj.

Krok 1 (obowiązkowy PRZED jakąkolwiek zmianą kodu): żywo zreprodukuj
ucięcie górnej/dolnej części panelu audiencji w headless Chromium, dla
przynajmniej jednego z trzech mechanizmów z RECON (zoom przeglądarki via
`documentElement.style.zoom` LUB CDP `setPageScaleFactor`, zoom
systemowy/DPI via CDP `setDeviceMetricsOverride`, wewnętrzny zoom UI gry
via `hud.ts` API). Zrzut ekranu/pomiar `getBoundingClientRect()` panelu vs
`window.innerHeight` jako dowód PRZED poprawką.

Krok 2: napraw tak, aby panel audiencji dyplomatycznej pozostawał W CAŁOŚCI
osiągalny (góra I dół) niezależnie od zmierzonego w Kroku 1 mechanizmu, bez
zmiany domyślnego (bez otwartego panelu) zachowania pełnoekranowego canvasu
3D. Preferuj NAJMNIEJ inwazyjny, ogólny mechanizm (np. fallback scrolla na
poziomie backdropu/body TYLKO gdy panel audiencji jest otwarty, albo
bezpieczniejsze przycięcie `max-height` z realnym marginesem) zamiast
przepisywania wszystkich reguł `vh` w pliku. Jeśli naprawa wymaga dotknięcia
globalnej reguły `body.style.overflow='hidden'` w `main.ts` — rób to
WYŁĄCZNIE przez warunkowy fallback (np. klasa/flaga aktywna tylko gdy
panel audiencji jest otwarty), NIGDY przez trwałe usunięcie blokady dla
domyślnego stanu gry (canvas 3D bez otwartego panelu).

## KRYTERIA KOŃCA — binarne PRAWDA/FAŁSZ
1. Żywy dowód w headless Chromium: PRZED poprawką (na kodzie z `origin/main`)
   pokazujesz, że przy zmierzonym w Kroku 1 mechanizmie zoomu górna LUB
   dolna krawędź panelu `.civ-diplo-aud-box` wykracza poza
   `window.innerHeight`/`0` (kontrola negatywna — dowód że problem realnie
   istnieje, nie jest tylko czytaniem kodu).
2. Żywy dowód PO poprawce: przy TYM SAMYM mechanizmie zoomu panel jest w
   całości osiągalny — albo cały mieści się w viewport, albo (jeśli
   przekracza wysokość) użytkownik ma faktyczną, działającą ścieżkę
   scrolla do góry I do dołu (nie tylko istniejącą regułę CSS, ale
   zweryfikowaną: scrollTo(0,0) i scrollTo(0,scrollHeight) realnie
   pokazują odpowiednio górę i dół treści).
3. Domyślny stan gry (canvas 3D, bez otwartego żadnego panelu) NIEZMIENIONY
   — `document.body.style.overflow` nadal `'hidden'` gdy panel audiencji
   jest zamknięty, brak nowego scrollbara na mapie/canvasie.
4. Diff ograniczony do plików z ALLOWLISTY. Zero zmian w innych panelach
   (empireDetailPanel.ts, cityPanel.ts, entityCards/renderer.ts,
   diplomacyPanel.ts) — to świadomie poza zakresem tej rundy.
5. `tsc --noEmit` 0 błędów + wszystkie 5 bramek referencyjnych bez regresu +
   nowy trwały test w `gra/tools/` pokrywający kryteria 1-3 (uruchamiany
   jako część normalnego zestawu testów, nie tylko ręczny dowód w raporcie).

## ALLOWLISTA — nic poza tym
`gra/src/ui/diplomacyAudience.ts` (CSS/reguły `.civ-diplo-aud-box` i
otoczenia), `gra/src/main.ts` (WYŁĄCZNIE jeśli krok 2 wymaga warunkowego
fallbacku scrolla powiązanego z otwarciem/zamknięciem panelu audiencji —
zero zmian domyślnego stanu overflow poza tym warunkiem), nowy plik testowy
w `gra/tools/`. Zakazane bezwzględnie: `empireDetailPanel.ts`,
`cityPanel.ts`, `entityCards/renderer.ts`, `diplomacyPanel.ts`, `hud.ts`
(mechanizm wewnętrznego zoomu UI — poza zakresem, chyba że Krok 1 wykaże że
TO jest jedyny reprodukowalny mechanizm — wtedy STOP i status
DECISION_REQUIRED zamiast zgadywania szerszego zakresu), `gra/data/**`,
`docs/decyzje/<ID>.md`, `.git/**`, `dyspozycje/WERSJE.md`,
`gra-robocza/ROBOCZA-MANIFEST.json`, `playbook.json`.

## IZOLACJA
worktree własny, gałąź `autobot/P-UI-ZOOM-PRZEGLADARKI-PANELE-UCIETE-Q1`,
baza JAWNIE `origin/main`. Sparse-checkout bez `gra-robocza/`, `gra-kanon/`,
`dist/`.

## REGUŁA PRZECIW SAMOOSZUKIWANIU
Zakaz zgadywania KTÓRY mechanizm zoomu (przeglądarka/system/UI gry)
powoduje problem bez żywej reprodukcji w Kroku 1 — jeśli żaden z trzech nie
reprodukuje realnego ucięcia w headless Chromium, STOP i status
DECISION_REQUIRED z pytaniem do właściciela o dokładniejszy opis (np. jaka
przeglądarka, czy to zoom Ctrl+scroll czy ustawienie skalowania Windows),
zamiast wdrażać fix "na wszelki wypadek" bez potwierdzonej przyczyny. Zakaz
uznania kryterium 2 za spełnione przez samo dodanie reguły CSS bez
faktycznego, zmierzonego dowodu że treść jest osiągalna.

## PROCEDURA NAPRAWCZA PRZY FAIL
Runda N+1 na TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

## GRANICE (naruszenie = FAIL)
`R-PROC-AUTOBOT.md` §9. Zakaz `npm run build`/`dev` w `gra/` (typecheck
wyłącznie `tsc --noEmit`; build produkcyjny wyłącznie
`node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-dist --emptyOutDir`).
Zakaz `git add -A`.

## OBIEG
Operator → Evaluator (zarzuty, lista może być pusta) → Operator (Obrona,
tylko gdy zarzuty niepuste) → Final Control (osobne wywołanie Workflow) →
orkiestrator integruje allowlist-only i cutuje kolejną FALĘ ROBOCZA.
