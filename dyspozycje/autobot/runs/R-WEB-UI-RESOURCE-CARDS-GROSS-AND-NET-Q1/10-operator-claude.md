# R-WEB-UI-RESOURCE-CARDS-GROSS-AND-NET-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-UI-RESOURCE-CARDS-GROSS-AND-NET-Q1
GOAL: w panelu surowców każda karta surowca pokazuje BRUTTO (cała produkcja) i NETTO (po zużyciu obywateli, budynków, wojska), suma kart = wartości nagłówka „Brutto … → netto …”.
ZMIANY-COMMIT: `b16a2c63d` (kod + test + poradnik + wikiBundle). Ten raport: osobny commit po nim (SHA w polu sha wyniku Operatora).
DEPLOY/PUSH: NIE WYKONANO (push na main i deploy ROBOCZA po FC PASS, zgodnie z dispatchem).

## Co zmieniono

| Plik | Zmiana |
|---|---|
| `gra/src/game/resource-gross-net.ts` (nowy) | Jedno źródło liczb: `resourceGrossPerTurn` (max(0, produkcja + przychód umów)), `resourceUsageSum` (obywatele+budynki+wojsko), `resourceGrossNetPerTurn` (brutto, zużycie, netto = ratePerTurn − zużycie; zaokrąglone). Moduł czysty, bez DOM. |
| `gra/src/main.ts` | Nagłówek `surowceBilans` liczy przez `resourceGrossNetPerTurn` zamiast inline (ta sama formuła, ta sama lista wierszy `shortageRows`). Dodany import. 3 linie netto. |
| `gra/src/ui/empireDetailPanel.ts` | `resGrossNetLineHtml(r)` — wiersz „Brutto +X · netto +Y / turę” pod paskiem karty (klasa `civ-emp-res-gn` good/warn/bad; ukryty gdy brak produkcji i zużycia; placeholder bez wiersza). Wstawiony w `resCardHtml`. Tooltip karty dostał: brutto, zużycie, netto po zużyciu. CSS `.civ-emp-res-gn*` dopisany. `resCardHtml` i `resGrossNetLineHtml` wyeksportowane (test). |
| `gra/tools/resource-cards-gross-net-test.cjs` (nowy) | 22 asercje: A moduł, B karta (prawdziwy `resCardHtml`), C test sumowania, D statyczne (main.ts używa modułu, brak drugiej kalkulacji), M mutanty (karta bez wiersza; netto bez zużycia — oba wykryte). |
| `docs/PORADNIK-GRACZA/08-ekonomia-imperium.md` | Nowy §53.1a: opis brutto/netto na karcie. |
| `gra/src/data/wikiBundle.json` | Regenerowany `node tools/bundle-wiki-for-game.cjs` (22 rozdz. + 181 haseł). |

Zmiana produkcji, zużycia, balansu ani danych `gra/data` — brak.

## Decyzje w lukach (ZAŁOŻENIE)

1. **Plakietka „+X” vs netto na karcie.** Dispatch pisze, że netto ma być „ta sama wartość co dotychczasowa plakietka”. Kod pokazuje, że plakietka to `ratePerTurn` = produkcja ± dyplomacja, PRZED zużyciem; nagłówek liczy netto PO zużyciu. Warunek „suma kart = nagłówek” wymusza formułę nagłówka. Zostawiłem plakietkę bez zmian (dispatch: „najpierw netto jak dziś jako plakietka”), a nowy wiersz pokazuje netto po zużyciu. Efekt: Drewno ma plakietkę +457 i „netto +422”. **To wymaga decyzji właściciela (ABC):** czy przemianować plakietkę na „produkcja” albo ukryć, żeby nie było dwóch „netto”.
2. **Wzór z testu dispatchu „netto = brutto − zużycia”** nie jest prawdziwy, gdy są wypływy dyplomacji (netto liczy się z `ratePerTurn`, który już odjął `rateDiploOutPerTurn`). Użyta formuła jest identyczna jak w nagłówku; fixture testu C i A5 to pokrywają.
3. **main.ts dotknięty** (3 linie + import), mimo że dispatch preferował jego nietykanie. Bez tego brutto liczyłoby się w dwóch miejscach, czego dispatch zakazuje.
4. Karty liczone dla owner 0 (ta sama lista co `shortageRows` dla gracza); placeholdery pominięte w obu.

## Testy i bramki (liczby z surowego wyjścia)

Środowisko: `npm ci` w `gra/` (worktree, 71 pakietów, node_modules nie jest śledzone). Dysk przed startem: 6,2 GB wolne.

| Bramka | Wynik |
|---|---|
| `npx tsc --noEmit` (gra/) | exit 0, brak błędów (po ostatniej zmianie eksportu — ponownie) |
| `node tools/logic-test.cjs` | LOGIC OK (213/213) |
| `node tools/tech-tree-test.cjs` | 20 pass, 0 fail |
| `node tools/research-test.cjs` | PASSED 33 / FAILED 0 |
| `node tools/unit-replace-test.cjs` | WSZYSTKIE TESTY ZIELONE (21/21) |
| `node tools/combat-test.cjs` | 6/6 pass |
| `node tools/unit-power-test.cjs` | 6 pass, 0 fail (exit 0) |
| **nowy** `node tools/resource-cards-gross-net-test.cjs` | **22 pass, 0 fail** (exit 0) |
| `git diff --check` | czysty (exit 0) |

Testy regresji dotykające panelu i nagłówka surowców — wszystkie zielone:
hud-gross-net-rest 820 ok / 0 fail; hud-topbar-grid-gross-net 1150 ok / 0 fail; resource-icons-everywhere 10 PASS; resource-icons-everywhere-render 13 PASS; kolor-surowce-spojnosc 34/34; surowce-katalog-kolejnosc 62/0; resource-building-utilization 52/0; spichlerz-deficyt-scalenie 58/0; empire-panel-split 25/0; ui-resource-chip-no-raw-html 9/0.

Cztery testy są czerwone także na bazie `15d0a81a5` (sprawdzone na wyeksportowanym drzewie `git archive`, poza tym worktree):
- `resource-usage-breakdown-test` — exit 1 (błąd bundlowania esbuild: loader SVG),
- `ui-language-count-renderer-test` — exit 1 (błędy stubów esbuild),
- `citizen-resource-upkeep-test` — exit 1 (107 pass, 2 fail: asercje tekstowe main.ts),
- `empire-armia-produkcja-test` — exit 1 (B10).
Nie są skutkiem tego tematu.

Test „czerwony na bazie”: na `15d0a81a5` moduł `resource-gross-net.ts` nie istnieje, więc test nie da się zbudować — czerwony z konstrukcji. **Nie zmierzone osobno** (usunąłem wyeksportowany bazowy katalog po sprawdzeniu regresji).

Chromium (karty renderowane prawdziwym `resCardHtml` + CSS wyciągniętym z `ensureStyles`, statyczny kontener):
- szerokość panelu 404 px (desktop, viewport 1280): 6 kart, 0 kart przepełnionych, brak przewijania poziomego (`docOverflowX` 0), wiersze „Brutto +457 · netto +422 / turę”, „Brutto 0 · netto −24 / turę” czerwone + „SPADA”, Cegła (bez produkcji i zużycia) bez wiersza.
- szerokość 344 px (wąskie): te same wyniki, 0 przepełnień, `docOverflowX` 0.
- zrzut: `/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/gn-visual/cards-desktop.png` (oraz `cards-narrow.png` w tym samym katalogu).

## NIE_ZMIERZONO

- **Żywa gra**: nie zbudowałem gry (vite do /tmp, endTurn, zrzut panelu surowców z nagłówkiem). Nagłówek i sumy są równe z konstrukcji (ten sam moduł, te same wiersze), ale **nie zmierzono w przeglądarce** że suma kart = nagłówek w realnym stanie gry. Opcja `--dist` z testu hud nie była uruchamiana.
- Pełny panel surowców (z nagłówkiem i wszystkimi kartami) nie był renderowany w Chromium; zmierzone są karty w kontenerze o szerokości panelu.
- Ikony emoji nie renderują się w headless (nie wpływa na wynik, to kwestia fontów w środowisku).

## Uwagi dla orkiestratora

- Potrzebna decyzja ABC: plakietka „+X” na karcie vs „netto” po zużyciu (pkt 1 w sekcji Decyzje). Do tego czasu jest to uczciwe, ale dwie różne liczby „netto”-podobne na jednej karcie.
- Dług testowy (nie z tego tematu): `citizen-resource-upkeep-test` 2 fail, `resource-usage-breakdown-test` i `ui-language-count-renderer-test` nie budują się na bazie — do osobnego tematu, jeśli orkiestrator uzna za potrzebne.
- W worktree pozostało `gra/node_modules` (nieśledzone, ignorowane) — do sprzątania po FC.

NASTĘPNY KROK: Evaluator (kod + test + zrzut) → Obrona → Final Control; decyzja ABC o plakietce przed integracją.
RUNDY: 1/5
DEPLOY/PUSH: NIE WYKONANO
