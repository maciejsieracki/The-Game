TEMAT:  P-CITYPANEL-KORUPCJA-TEKST-DEWELOPERSKI-Q1
RUNDA:  1/5
DATA:   2026-09-02
DOMAIN: GAME
ŚCIEŻKA: A (Workflow), model sędziego (R-PROC-AUTOBOT.md §3c)
MODEL + EFFORT per rola: Operator Sonnet 5 effort=medium / Evaluator Sonnet 5 effort=high

## WYZWALACZ
Faza 3 zlecenia właściciela (po zamknięciu Fazy 1-2 projektu kart historycznych):
"przegląd wszystkich tooltipów/opisów w grze". Recon (Explore, szeroki skan
`gra/src/ui/**/*.ts`) znalazł JEDEN konkretny, potwierdzony przypadek tej samej
klasy błędu co pierwotne zgłoszenie o karcie "Tarasy uprawne" (tekst
deweloperski wyciekający wprost do gracza) — w karcie szczegółów podziału
daniny/handlu w panelu miasta. Reszta gry po tym skanie wygląda czysto (zero
kolejnych wycieków dev-textu w `civs.json`, `ui-params.json` ani pozostałych
~49 plikach UI z tooltipami — sprawdzone, nie zgadywane).

## RECON (wykonany, nie powtarzać)
`gra/src/ui/cityPanel.ts`, funkcja budująca kartę "Podział <daniny> —
szczegóły" (otwierana z panelu miasta, sekcja Handel), linie ~10428-10519.
Cała karta to ŚWIADOMY, zaakceptowany wzorzec transparency-panelu — pokazuje
graczowi realne wzory/algorytmy silnika (`handelBrutto = Σ...`, `nauka =
floor(...)` itd., przez `appendDetailFormula`/`appendDetailAlgo`) i TO ZOSTAJE
BEZ ZMIAN, to nie jest błąd. Błędem jest WYŁĄCZNIE styl/adresat 4 konkretnych
fragmentów, pisanych jak notatka do zespołu deweloperskiego, nie do gracza:
1. Linie 10434-10439 (`todo` element, class `dc-note`, złota ramka): zaczyna
   się dosłownie `<b class="gold">Do rozkminienia (v2):</b> skąd bierze się
   korupcja (dystans od stolicy, liczba miast, epoka, porządek, tech?), czy
   gracz może ją obniżać, czy pokazujemy ją per miasto czy imperium.` — to
   jest surowa notatka projektowa/pytanie do siebie, adresowana do
   dewelopera, nie do gracza. Dalej: `Na razie w UI: stałe X% ... —
   placeholder, nie wpływa jeszcze na silnik w prototypie.` — słowa
   "placeholder"/"prototyp"/"silnik" to żargon deweloperski.
2. Linia 10453: `appendDetailSection(card, 'Korupcja (placeholder)')` — nagłówek
   sekcji zawiera słowo "placeholder" wprost.
3. Linia 10459: wiersz siatki szczegółów zatytułowany `'Silnik (docelowo)'`
   ("silnik" = engine, żargon deweloperski adresowany do gracza).
4. Linia 4445: natywny tooltip (`title="Placeholder — docelowo pełny model
   korupcji"`) na żetonie "Korupcja" w skróconym widoku karty handlu.

Ustalony w tym repo, już zaakceptowany wzorzec na treść "jeszcze nie
wdrożone do gry" to `resPlaceholderCardHtml` w `empireDetailPanel.ts` (~linia
2984-2990): `title="${label} — surowiec jeszcze nie wdrożony do gry"` — krótkie,
uczciwe, bez żargonu deweloperskiego, bez słowa "placeholder"/"prototyp"/"silnik"/
"v2". Wzoruj się na TYM tonie.

## GOAL
Przepisz WYŁĄCZNIE te 4 fragmenty na ton adresowany do gracza, zachowując
uczciwą, uproszczoną informację merytoryczną (korupcja jest DZIŚ stałym
procentem, nie zależy jeszcze od dystansu/liczby miast — to ma się zmienić w
przyszłości), ale BEZ: słowa "placeholder", słowa "prototyp"/"prototypie",
słowa "silnik" w znaczeniu kodu/engine, sformułowania "Do rozkminienia (v2)",
pytań retorycznych adresowanych do zespołu ("czy gracz może ją obniżać, czy
pokazujemy ją per miasto czy imperium" — to są pytania projektowe, nie treść
dla gracza, usuń je całkowicie, nie próbuj na nie "odpowiadać" graczowi).
Przykładowy, akceptowalny ton (nie kopiuj dosłownie, dopasuj do kontekstu):
"Korupcja to dziś stały procent daniny brutto — w przyszłej aktualizacji ma
zależeć też od odległości od stolicy i liczby miast." Nagłówek sekcji: usuń
"(placeholder)", np. po prostu `'Korupcja'`. Wiersz siatki "Silnik
(docelowo)": zmień etykietę na coś neutralnego dla gracza, np. "Planowane
zmiany" lub połącz treściowo z notatką powyżej zamiast osobnego wiersza —
Operator ma swobodę wyboru najlepszej formy, byle usunąć słowo "Silnik" jako
etykietę i zachować informację co się zmieni (dystans, liczba miast, cap).
Tooltip linii 4445: krótki, w stylu `resPlaceholderCardHtml`, np. "Korupcja —
uproszczony model, pełniejszy planowany w przyszłej aktualizacji" (dopasuj
długość do konwencji pozostałych tooltipów na tym samym rzędzie żetonów).

Cała reszta karty (wzory algorytmu, `appendDetailFormula`, `appendDetailAlgo`,
etykiety `HANDEL_KORUPCJA_PCT_PLACEHOLDER` jako NAZWA STAŁEJ w kodzie — nie
tekst dla gracza, zostaje bez zmian) — NIE dotykaj, to jest świadomy,
zaakceptowany wzorzec transparency-panelu i nie jest w zakresie tego tematu.

## KRYTERIA KOŃCA — binarne PRAWDA/FAŁSZ
1. Żywy dowód w headless Chromium: otwarcie karty "Podział <daniny> —
   szczegóły" w panelu miasta (sekcja Handel, dowolne miasto z niezerową
   daniną) — wyrenderowany DOM NIE zawiera żadnego z ciągów: "Do
   rozkminienia", "(v2)", "placeholder"/"Placeholder", "prototypie"/"prototyp",
   "Silnik" jako widoczny tekst/etykieta (dozwolone: nazwa stałej
   `HANDEL_KORUPCJA_PCT_PLACEHOLDER` w kodzie źródłowym, NIE w renderowanym
   tekście UI).
2. Ten sam żywy dowód: skrócony widok karty handlu (żeton "Korupcja") — atrybut
   `title` żetonu NIE zawiera "Placeholder"/"placeholder".
3. Merytoryczna treść zachowana: DOM nadal informuje gracza że korupcja jest
   dziś stałym procentem i że w przyszłości ma zależeć od dystansu/liczby
   miast — nie usunięto informacji, tylko przeredagowano ton.
4. Reszta karty (wszystkie linie `appendDetailFormula`/`appendDetailAlgo` z
   wzorami silnika, np. `handelBrutto = Σ...`) — bajt w bajt nietknięta,
   dowód: diff ograniczony wyłącznie do 4 fragmentów z RECON.
5. `tsc --noEmit` 0 błędów + wszystkie 5 bramek referencyjnych bez regresu +
   nowy/rozszerzony trwały test w `gra/tools/` pokrywający kryteria 1-4.

## ALLOWLISTA — nic poza tym
`gra/src/ui/cityPanel.ts` (WYŁĄCZNIE te 4 fragmenty tekstu wymienione w RECON —
linie 10434-10439, 10453, 10459, 4445 — treść stringów, nie logika/struktura
wokół nich), nowy/rozszerzony plik testowy w `gra/tools/`. Zakazane
bezwzględnie: jakiekolwiek zmiany w `appendDetailFormula`/`appendDetailAlgo`
i ich zawartości, w nazwie stałej `HANDEL_KORUPCJA_PCT_PLACEHOLDER` (to jest
identyfikator kodu, nie tekst UI — zmiana nazwy stałej to osobna sprawa poza
zakresem), w logice obliczeń korupcji, `gra/data/**`, `docs/decyzje/<ID>.md`,
`.git/**`, `dyspozycje/WERSJE.md`, `gra-robocza/ROBOCZA-MANIFEST.json`,
`playbook.json`.

## IZOLACJA
worktree własny, gałąź `autobot/P-CITYPANEL-KORUPCJA-TEKST-DEWELOPERSKI-Q1`,
baza JAWNIE `origin/main`. Sparse-checkout bez `gra-robocza/`, `gra-kanon/`,
`dist/`.

## REGUŁA PRZECIW SAMOOSZUKIWANIU
Zakaz uznania kryteriów za spełnione bez realnego zrzutu z żywej przeglądarki
(otwarcie karty w rzeczywistym HUD-zie panelu miasta, nie fixture/mock treści).
Zakaz "naprawienia" przez proste usunięcie fragmentu bez zastąpienia go
sensowną, uczciwą treścią dla gracza — kryterium 3 wymaga wprost dowodu że
informacja merytoryczna przetrwała.

## PROCEDURA NAPRAWCZA PRZY FAIL
Runda N+1 na TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

## GRANICE (naruszenie = FAIL)
`R-PROC-AUTOBOT.md` §9. Zakaz `npm run build`/`dev` w `gra/` (typecheck
wyłącznie `tsc --noEmit`; build produkcyjny wyłącznie
`node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-dist --emptyOutDir`
dla żywego testu w przeglądarce). Zakaz `git add -A`.

## OBIEG
Operator → Evaluator (zarzuty, lista może być pusta) → Operator (Obrona,
tylko gdy zarzuty niepuste) → Final Control (osobne wywołanie Workflow) →
orkiestrator integruje allowlist-only i cutuje kolejną FALĘ ROBOCZA.
