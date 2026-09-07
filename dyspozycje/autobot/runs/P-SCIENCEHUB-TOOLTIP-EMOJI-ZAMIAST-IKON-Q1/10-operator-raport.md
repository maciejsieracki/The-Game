# P-SCIENCEHUB-TOOLTIP-EMOJI-ZAMIAST-IKON-Q1 — raport Operatora (runda 1/5)

STATUS: PASS
DOMAIN: GAME
TEMAT: P-SCIENCEHUB-TOOLTIP-EMOJI-ZAMIAST-IKON-Q1
RUNDY: 1/5
DEPLOY/PUSH: NIE WYKONANO

## GOAL

Tooltip hover węzła drzewka technologii (`sciencePicker.ts`) emitował surowe, generyczne
emoji (🏛/🌾) zamiast ikon marki per encja — druga, niezależna instancja klasy błędu
naprawionej dla listy huba badań tematem `P-SCIENCEHUB-EMOJI-ZAMIAST-IKON-ODBLOKOWAN-Q1`
(commit `a2c887e8`). Powtórzyć tam wzorzec naprawy, z żywym dowodem z Chromium.

## PRODUCENT I KONSUMENT (recon)

Wbrew punktowi startowemu z GENEZY (linie 905-925) miejsce buga leży w
`buildTooltipHTML()` — przed zmianą linie **1044-1047**, sekcja „Warunek badania:":

```ts
if (node.wymaganyBudynek) reqs.push('🏛 budynek: ' + esc(node.wymaganyBudynek));
if (node.wymaganeUlepszenie) reqs.push('🌾 ulepszenie: ' + esc(node.wymaganeUlepszenie));
```

- **Jedyny producent stringu:** `buildTooltipHTML()` (lokalna tablica `reqs: string[]`).
- **Jedyny konsument:** handler `mouseover` na `panelEl` (l. 1431 przed zmianą) —
  `tooltipEl.innerHTML = buildTooltipHTML(...)`. Poza tym jednym miejscem funkcja nie ma
  wywołań.
- Linie 905-925 to `// NODES` (render węzłów SVG) — tam glifów kategorii nie ma; jest tylko
  `🔒` statusu blokady, poza zakresem tematu (patrz „Świadomie poza zakresem").

## ZMIANY / COMMIT

Gałąź `autobot/P-SCIENCEHUB-TOOLTIP-EMOJI-ZAMIAST-IKON-Q1`, baza `origin/main`
(`git log -1` przed pracą: `868ee23b` — dispatch na 42b62bd6). Wyłącznie pliki z allowlisty:

1. **`gra/src/ui/sciencePicker.ts`**
   - nowy producent DANYCH `techRequirementItems(slug): TechRequirementItem[]`
     (`prefix` + `TechUnlockItem`) — dokładny analog `techUnlockItems()`;
   - konsument w `buildTooltipHTML()` renderuje ikonę przez `unlockIconSvg(rq.item)`;
     etykiety nadal przez `esc()` (z danych nie da się wstrzyknąć HTML), `innerHTML`
     dostaje wyłącznie SVG z `brandAssets`;
   - CSS `.tt-req-ic` / `.tt-req-ic svg` (rozmiar w `em`, skaluje się z tekstem pozycji);
   - import `unlockIconSvg` dopisany do ISTNIEJĄCEGO importu z `./scienceHubHud` — zero
     nowych krawędzi w grafie modułów.
2. **`gra/src/ui/scienceHubHud.ts`** — `unlockIconSvg` dostaje `export`. **Sam modyfikator
   widoczności**, zero zmian w logice i w renderze listy huba (ten sam wzorzec, co `export`
   na `IMPROVEMENT_NAME_TO_KEY` w temacie poprzednim). Dzięki temu obie powierzchnie idą
   JEDNYM resolverem — rozjazd między nimi jest strukturalnie niemożliwy, a nie „sprawdzony
   raz".
3. **`gra/tools/science-picker-tooltip-icons-real-render-test.cjs`** (nowy) — bramka
   real-render, żywy Chromium, 111 asercji.
4. **`gra/tools/science-hub-unlock-icons-real-render-test.cjs`** — poprawka *tylko* sposobu
   wycinania fragmentu w kotwicy (0): komentarze odsiewane, okno do końca funkcji zamiast
   sztywnych 1400 znaków. Powód i uczciwe postawienie sprawy niżej, w „Uwaga".

Dwa błędy z rundy Obrony poprzedniego tematu adresowane wprost:
- **(a) pełny `def`, nie samo ID** — `iconCategory: ref.kategoria` z `buildings.json` idzie
  do resolvera przez `buildingIconRefForName()`; test (B) porównuje każdą pozycję z ikoną
  tego samego budynku w `cityPanel`.
- **(b) placeholdery** — reużyta (nie przepisana) `isPlaceholderLabel()`, wołana w OBU
  gałęziach; pusta lista kasuje całą sekcję, nie zostawia nagłówka nad niczym.

## TESTY

| bramka | wynik |
|---|---|
| `tsc --noEmit` | 0 błędów |
| `logic-test` | 213/213 |
| `tech-tree-test` | 19 pass / 0 fail |
| `research-test` | 33/33 ALL GREEN |
| `unit-replace-test` | 13/13 |
| `combat-test` | 6/6 |
| `science-hub-test` | 7 pass / 0 fail |
| `science-hub-unlock-icons-real-render-test` (poprzedni temat) | **53 PASS / 0 FAIL** |
| `science-picker-tooltip-icons-real-render-test` (nowa) | **111 PASS / 0 FAIL** |

Zakres nowej bramki: (0) kotwice w kodzie (liczone po odsianiu komentarzy), (A) prawdziwy
`mouseover` na każdym z 9 węzłów z warunkiem badania — jedna ikona SVG na pozycję, niezerowy
`getBoundingClientRect()`, zero emoji w tekście gracza, etykiety 1:1 z `tech.json`,
(B) tożsamość z `cityPanel`/`buildModeHud`, (B2) tożsamość z wierszem „Odblok." huba badań,
(C) przelot po CAŁEJ `tech.json` (37 węzłów, zero wyjątków JS), (G) placeholdery i pusty
nagłówek, (E) kontrola negatywna mutacyjna.

## DOWÓD WIZUALNY (żywy Chromium)

`dyspozycje/autobot/runs/P-SCIENCEHUB-TOOLTIP-EMOJI-ZAMIAST-IKON-Q1/dowody-wizualne/`

- **`PRZED/`** — 9 zrzutów wygenerowanych po FAKTYCZNYM cofnięciu poprawki
  (`git checkout -- gra/src/ui/sciencePicker.ts gra/src/ui/scienceHubHud.ts`), nie
  z symulacji w DOM. Pomiar z tego samego przebiegu: każda sekcja „Warunek badania:" ma
  `svgInSec: 0` i tekst `"🏛 budynek: Cegielnia"` / `"🌾 ulepszenie: Tartak"`.
- **`PO/`** — te same 9 tooltipów po poprawce (np. „Filozofia" → ikona marki Biblioteki
  zamiast 🏛; „Żegluga" → ikona Tartaku zamiast 🌾).
- **`PO/02-porownanie-tooltip-vs-gra-vs-hub.png`** — trzy kolumny obok siebie dla każdej
  pozycji: ŻYWY SVG wyjęty z tooltipa | `cityPanel`/`buildModeHud` | wiersz „Odblok." huba
  badań. Wszystkie trzy identyczne w każdym wierszu.
- **`PO/03-tooltip-MUTACJA-stan-przed-poprawka.png`** — mutacja w DOM wewnątrz bramki.

**Dowód mutacyjny (bramka realnie czerwienieje):**
- poziom źródła — po cofnięciu poprawki bramka kończy się `EXIT=1`, wszystkie 8 asercji (0)
  na czerwono, bundle nie zbudował się bez `techRequirementItems`;
- poziom DOM — sekcja (E) odtwarza stary render przez `textContent` z glifem kategorii;
  wszystkie 9 asercji „emoji wraca, ikony znikają" zapala się i przechodzi.

## ŚWIADOMIE POZA ZAKRESEM (do decyzji Evaluatora / właściciela)

W tooltipie zostają glify **statusowe**, nie-encyjne: `✓`, `◉`, `▶`, `🔒` (status węzła),
`⚗` (koszt nauki), `★` (uwagi). Nie są ikonami konkretnych encji gry, nie mają odpowiednika
w `brandAssets.ts` i te same znaki występują na węzłach drzewka poza tooltipem — objęcie ich
byłoby innym tematem (spójność glifów statusowych), nie tą klasą buga. Asercja „zero emoji"
jest z tego powodu zawężona do sekcji „Warunek badania:", a nie do całego tooltipa; zapisuję
to jawnie, żeby nie wyglądało na przeoczenie.

## UWAGA — dotknięcie bramki poprzedniego tematu

Po naprawie `science-hub-unlock-icons-real-render-test.cjs` zeszła na 52/1. Przyczyną NIE
była regresja listy huba (`techUnlockItems()` nie jest tknięta — widać w diffie), tylko
heurystyka tej bramki: brała okno **stałych 1400 znaków** od nagłówka funkcji i skanowała je
regexem na emoji. Mój nowy blok dokumentacyjny CYTUJE stan sprzed poprawki (razem z 🏛/🌾),
wpadł w to okno i zapalił fałszywy alarm. Do wyboru było ukrycie komentarza albo naprawa
heurystyki; wybrałem naprawę — okno liczy się teraz do końca funkcji i po odsianiu
komentarzy. Żadna asercja merytoryczna ani logika listy się nie zmienia; bramka wraca na
53/53. Plik mieści się w allowliscie (`gra/tools/*-test.cjs`), ale zgłaszam wprost, bo to
jedyny plik poza „moim" tooltipem.

## BLOKADY

Brak.

## NASTĘPNY KROK

Evaluator (Opus 5, effort high) — ponumerowane zarzuty. Bez integracji, deployu i pusha.
