TEMAT:  P-SCIENCEHUB-EMOJI-ZAMIAST-IKON-ODBLOKOWAN-Q1
RUNDA:  1/5
DATA:   2026-09-02
DOMAIN: GAME
ŚCIEŻKA: A (Workflow), model sędziego (R-PROC-AUTOBOT.md §3c)
MODEL + EFFORT per rola: temat GRAFICZNY/WIZUALNY (R-PROC-AUTOBOT.md §5a) —
Operator Opus 5 effort=medium / Evaluator Opus 5 effort=high / Final Control
Sonnet 5 effort=high.

## WYZWALACZ
Właściciel, zrzut ekranu panelu badań/rozwoju (hub technologii, karty
"Łowiectwo"/"Obróbka drewna"/"Oswojenie zwierząt"/"Rolnictwo"): "To, co już
wcześniej zgłosiłem w grafice niektórych surowców, takich jak obóz
łowiecki, drewno, tartak, trzoda, krowa, byk, nie jest zgodne z tym, co
jest ustalone w brandbooku. To jest kolejna regresja. Już raz na to
zwracałem uwagę. To występuje na razie głównie w panelu badań i rozwoju."

## RECON (wykonany, nie powtarzaj)
Źródło buga: `gra/src/ui/sciencePicker.ts:221-232`, funkcja
`techUnlockSummary(slug)`:
```
const bud = node.odblokujeBudynek.trim();
if (bud) parts.push('\u{1F3DB} ' + ...);   // 🏛 JEDEN generyczny emoji dla WSZYSTKICH budynków
const sur = node.odblokujeSurowiec.trim();
if (sur) parts.push('\u{1F48E} ' + ...);   // 💎 JEDEN generyczny emoji dla WSZYSTKICH surowców
const ter = node.odblokujeUlepszenie.trim();
if (ter) parts.push('\u{1F33E} ' + ...);   // 🌾 JEDEN generyczny emoji dla WSZYSTKICH ulepszeń terenu
```
Zwraca płaski string. JEDYNY producent: `sciencePicker.ts:278`
(`unlockLine: techUnlockSummary(d.id) || undefined`) → `ScienceHubEntry.
unlockLine` (typ, `scienceHubHud.ts:27-36`). JEDYNY konsument:
`scienceHubHud.ts:601-606` — `ul.textContent = 'Odblok.: ' + e.unlockLine`
(czysty tekst, zero ikon SVG możliwych bez przebudowy na węzły DOM).

Właściwe resolvery marki (`gra/src/ui/icons/brandAssets.ts`), już poprawnie
używane gdzie indziej w grze:
- **Surowce**: `mapResourceIconSvg(key: string, size)` (linia 113) —
  przyjmuje BEZPOŚREDNIO etykietę wyświetlaną (np. `'Bydło (krowa/wół)'`),
  dopasowanie case-insensitive dokładne-potem-podciąg wobec
  `resources-map-icon-map.json`. Zero potrzeby mapowania nazwa→id.
- **Budynki**: `buildingIconSvg(def, buildingId)` (linia 170), zawsze
  wołane z ID budynku (nie nazwą) — wzorzec: `cityPanel.ts:6125,6146`,
  `techDiscoveryNotice.ts:370` (`buildingIconSvg(undefined, b.id)`).
- **Ulepszenia terenu**: `improvementIconSvg(key: ImprovementKey, size)`
  (linia 102) — klucz to ID ulepszenia (np. `bydlo`, `oboz_lowiecki`), NIE
  nazwa wyświetlana. Wzorzec: `buildModeHud.ts:219`,
  `techDiscoveryNotice.ts:398`.

Pola `TechNode` (`sciencePicker.ts:116-128`) — `odblokujeBudynek`/
`odblokujeSurowiec`/`odblokujeUlepszenie` to NAZWY WYŚWIETLANE (sparsowane
z surowego pola CSV/JSON), NIE ID/slug.

Istniejący, DZIAŁAJĄCY precedens konwersji nazwa→id W TEJ SAMEJ domenie:
`techDiscoveryNotice.ts:122-130` buduje `IMPROVEMENT_NAME_TO_KEY`
(odwrotna mapa nazwa→`ImprovementKey`, źródło: `terrain-improvements.json`),
użyta w linii 398: `improvementIconSvg(IMPROVEMENT_NAME_TO_KEY[name] ??
name)`. To jest właściwy wzorzec do powtórzenia dla ulepszeń terenu w
`sciencePicker.ts` — NIE wymyślaj nowego mechanizmu. Dla budynków
ANALOGICZNA mapa nazwa→id NIE istnieje jeszcze w tym pliku i wymaga
zbudowania (ze źródła danych budynków, tego samego którego używa
`buildingIconSvg`/`cityPanel.ts` — NIE zgaduj ID, buduj z realnych danych).

POZA ZAKRESEM tej rundy (zarejestrowane osobno, NIE naprawiaj tutaj):
`sciencePicker.ts:~905-925` (osobna funkcja tooltipa) NIEZALEŻNIE emituje
te same surowe emoji 🏛/🌾 dla innej powierzchni UI (hover tooltip, nie
lista huba badań) — to inny call site, inny fragment kodu, świadomie poza
zakresem tego dispatchu (właściciel zgłosił konkretnie "panel badań i
rozwoju", czyli listę huba, nie tooltip).

## GOAL
Zastąp płaski string z generycznymi emoji w `techUnlockSummary` strukturą
danych (np. `TechUnlockItem[]` z polami `kind`/`label`/id-do-rozwiązania),
i zaktualizuj render w `scienceHubHud.ts` (wiersz "Odblok.:" karty
technologii w hubie badań) tak, aby KAŻDA pozycja (budynek/surowiec/
ulepszenie) dostawała WŁASNĄ, poprawną ikonę marki (SVG) rozwiązaną przez
właściwy resolver z `brandAssets.ts` (jak opisano w RECON), zamiast
jednego, generycznego emoji na całą kategorię. Ikony muszą być
NIEODRÓŻNIALNE od tych używanych gdzie indziej w grze dla tej samej
encji (np. ikona "Tartak" w hubie badań = ta sama ikona co "Tartak" w
panelu budowy miasta).

Dla budynków: zbuduj mapę nazwa→id analogiczną do
`IMPROVEMENT_NAME_TO_KEY`, ze źródła realnych danych budynków (nie
zgaduj). Dla ulepszeń terenu: powtórz DOKŁADNIE wzorzec
`IMPROVEMENT_NAME_TO_KEY` z `techDiscoveryNotice.ts` — jeśli sensowne,
wyeksportuj i zaimportuj istniejącą mapę zamiast duplikować (Twoja
decyzja techniczna, uzasadnij w raporcie). Dla surowców: użyj
`mapResourceIconSvg` bezpośrednio na etykiecie, bez pośredniego mapowania.

## KRYTERIA KOŃCA — binarne PRAWDA/FAŁSZ
1. Żywy zrzut z prawdziwego Chromium (`page.screenshot()`, Playwright —
   R-PROC-AUTOBOT.md §9 pkt 6a): karta technologii "Oswojenie zwierząt" w
   hubie badań — wiersz "Odblok.:" pokazuje OSOBNE, poprawne ikony SVG dla
   surowca (bydło/krowa-byk) i ulepszenia (Trzoda), wizualnie zgodne z
   ikonami tych samych encji użytymi gdzie indziej w grze (np. panel
   budowy terenu dla "Trzoda").
2. Analogiczny żywy zrzut dla "Obróbka drewna" (ikona surowca "drewno")
   oraz budynku "Tartak" — ikona budynku identyczna z ikoną "Tartak" w
   `cityPanel.ts`/panelu budowy miasta.
3. Analogiczny żywy zrzut dla "Łowiectwo" — ikona ulepszenia "Obóz
   łowiecki" identyczna z ikoną tego ulepszenia w panelu budowy terenu
   (`buildModeHud.ts`).
4. Zero surowych emoji (🏛/💎/🌾 lub jakikolwiek inny pojedynczy generyczny
   glif) w wyrenderowanym wierszu "Odblok.:" — potwierdzone programowo
   (DOM: każdy slot ikony to element `<svg>`, nie tekstowy emoji-glif).
5. Zero regresji na technologiach BEZ jednej z trzech kategorii (np. tech
   bez odblokowania budynku) — sprawdzone na rozrzucie kilku różnych
   technologii, nie tylko trzech nazwanych wyżej — brak złamanej ikony,
   braku crasha, pustego miejsca zamiast pominięcia.
6. Diff ograniczony do `sciencePicker.ts` + `scienceHubHud.ts` (+
   WYŁĄCZNIE eksport istniejącej mapy z `techDiscoveryNotice.ts`, jeśli
   Operator wybierze reużycie zamiast duplikacji — zero zmian w LOGICE
   tego pliku) + nowy/rozszerzony test w `gra/tools/`.
7. `tsc --noEmit` 0 błędów + wszystkie 5 bramek referencyjnych bez regresu
   + `science-hub-test.cjs` i `tech-tree-test.cjs` bez regresu (dostosuj
   jeśli asertują stary format `unlockLine` jako string — zaktualizuj do
   nowego kontraktu, udokumentuj w raporcie).

## ALLOWLISTA — nic poza tym
`gra/src/ui/sciencePicker.ts`, `gra/src/ui/scienceHubHud.ts`,
`gra/src/ui/techDiscoveryNotice.ts` (WYŁĄCZNIE dodanie `export` do
istniejącej `IMPROVEMENT_NAME_TO_KEY`, jeśli reużywana — zero zmian w
logice/zachowaniu tego pliku), `gra/tools/science-hub-test.cjs` (lub nowy
plik testowy). Zakazane bezwzględnie: `sciencePicker.ts:~905-925` (funkcja
tooltipa — osobny, zarejestrowany OSOBNO temat, poza zakresem),
`brandAssets.ts`, `resources-map-icon-map.json`, `improvement-icon-map.json`,
`gra/data/**`, `cityPanel.ts`, `buildModeHud.ts`, `docs/decyzje/<ID>.md`,
`.git/**`, `dyspozycje/WERSJE.md`, `gra-robocza/ROBOCZA-MANIFEST.json`,
`playbook.json`.

## IZOLACJA
worktree własny, gałąź
`autobot/P-SCIENCEHUB-EMOJI-ZAMIAST-IKON-ODBLOKOWAN-Q1`, baza JAWNIE
`origin/main`. Sparse-checkout bez `gra-robocza/`, `gra-kanon/`, `dist/`.

## REGUŁA PRZECIW SAMOOSZUKIWANIU
Temat wizualny/UX — zakaz uznania KTÓREGOKOLWIEK z kryteriów wizualnych za
spełnione bez realnego zrzutu `page.screenshot()` z żywego Chromium. Zakaz
uznania "ikona jest poprawna" bez porównania z ikoną TEJ SAMEJ encji
renderowaną gdzie indziej w grze (nie wystarczy że jakiś SVG się pojawił —
musi to być WŁAŚCIWY SVG dla danej konkretnej encji). Zakaz zgadywania ID
budynków przy budowie mapy nazwa→id — buduj z realnego źródła danych.

## PROCEDURA NAPRAWCZA PRZY FAIL
Runda N+1 na TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

## GRANICE (naruszenie = FAIL)
`R-PROC-AUTOBOT.md` §9. Zakaz `npm run build`/`dev` w `gra/` (typecheck
wyłącznie `tsc --noEmit`; build produkcyjny wyłącznie
`node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-dist --emptyOutDir`).
Zakaz `git add -A`.

## OBIEG
Operator (Opus 5) → Evaluator (Opus 5, zarzuty, lista może być pusta) →
Operator (Obrona, Opus 5, tylko gdy zarzuty niepuste) → Final Control
(Sonnet 5, osobne wywołanie Workflow) → orkiestrator integruje
allowlist-only i cutuje kolejną FALĘ ROBOCZA.
