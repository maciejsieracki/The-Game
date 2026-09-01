TEMAT:  R-AMBIENT-NATURA-TYLKO-ZWIERZETA-Q1
RUNDA:  1/5
DATA:   2026-09-01
DOMAIN: GAME
ŚCIEŻKA: A (Workflow), model sędziego (R-PROC-AUTOBOT.md §3c)
MODEL + EFFORT per rola: Operator Sonnet 5 effort=medium / Evaluator Sonnet 5 effort=high

## WYZWALACZ
Właściciel: „Kiedy stworzyłeś taki dźwięk natury, który leci w tle, niemniej
jednak szum powietrza, lasu czy wody bardzo przeszkadza. Niestety, on się za
bardzo nie udał. Proponuję, żebyś zrobił tylko same odgłosy natury, czyli
zwierzęta, głównie, i nic więcej."

## RECON (wykonany, nie powtarzać)
Kanał „odgłosy natury" (ambience) to WYŁĄCZNIE synteza Web Audio, ZERO plików
audio (`gra/src/audio/utwory/natura/` zawiera tylko `README.md`, katalog
świadomie pusty od TEMAT-u z 2026-07-20, patrz komentarz
`gra/src/audio/filePlayer.ts:18-24` — to nie jest problem z assetami, tylko z
kodem generującym dźwięk).

Logika: `gra/src/audio/muzyka-antyczna.ts`. `composeKamien(s, toT, out,
onlyNature=true)` (linie 452-615) generuje zdarzenia `NoteEvent` z polem
`typ`. Przy `onlyNature=true` (czyli TYLKO w kanale ambience, wołane z
`ambTick()` linia 1986-1994 → `startAmbience()` linia 1999) generowane są:
- `'wiatr'` (linie 456-460) — ciągły szum wiatru, gra ZAWSZE
- `'liscie'` (linie 477-482) — szum liści/lasu
- `'woda'` (linie 483-489) — szum wody (rzeka/morze), pozycyjny
- `'ptak'`, `'swierszcz'`, `'wycie'` (linie 594-609) — odgłosy zwierząt
  (ptaki, świerszcze, wycie wilka), wyciszane tylko w bitwie (`!bitwa`)

To dokładnie odpowiada zgłoszeniu: wiatr/liście/woda to „szum", ptak/
świerszcz/wycie to „zwierzęta". Faktyczne planowanie odtwarzania (tworzenie
`AudioBufferSourceNode` i podłączenie do grafu) dzieje się w `ambSchedule(e:
NoteEvent)` (linie 1960-1984) — wołanej WYŁĄCZNIE z `ambTick()`, która z kolei
jest używana WYŁĄCZNIE przez `startAmbience()`/`stopAmbience()`. Ten sam
`composeKamien` jest też wołany gdzie indziej z `onlyNature=false` dla
prawdziwej muzyki mapy/bitwy epoki Kamień (inna ścieżka, `composeUntil` czy
podobna) — TA ścieżka nie woła `ambSchedule` i ma zostać CAŁKOWICIE nietknięta
(wiatr ma tam zostać, to jest muzyka gry, nie ambience).

## GOAL
W `ambSchedule()` (`gra/src/audio/muzyka-antyczna.ts` ~linia 1960) dodaj
wczesny `return` (przed jakąkolwiek alokacją `AudioBufferSourceNode`/`GainNode`
itd.) dla zdarzeń z `e.typ === 'wiatr' || e.typ === 'liscie' || e.typ ===
'woda'`. Zdarzenia `'ptak'`, `'swierszcz'`, `'wycie'` (i wszelkie inne typy
niewymienione powyżej) mają być planowane DOKŁADNIE jak dotychczas — zero
zmian w ich głośności, panoramowaniu, częstotliwości występowania.

## KRYTERIA KOŃCA — binarne PRAWDA/FAŁSZ
1. Po zmianie, żywy test w headless Chromium (nowy hak testowy analogiczny do
   `window.__musicEraTestDebug`, np. `window.__ambienceTestDebug` z listą
   ostatnio zaplanowanych `e.typ` z `ambSchedule`) pokazuje: po
   `startAmbience()` i odczekaniu >=2 cykli `ambTick` (>=700ms), ZERO zdarzeń
   typu `'wiatr'`/`'liscie'`/`'woda'` zostało zaplanowanych.
2. Ten sam test pokazuje, że `'ptak'`, `'swierszcz'` i/lub `'wycie'` NADAL są
   planowane w rozsądnym oknie czasowym (mogą wymagać dłuższego okna/wielu
   ticków ze względu na rzadką częstotliwość — patrz `rr(r, 4, 15)` dla ptaka,
   dłuższe interwały dla świerszcza/wycia; dopuszczalne przyspieszenie testu
   przez wielokrotne wywołanie `ambTick`/przesunięcie `ambT0`, NIE przez
   zmianę realnych stałych czasowych w produkcyjnym kodzie).
3. Ścieżka prawdziwej muzyki mapy/bitwy epoki Kamień (`onlyNature=false`,
   NIE wołająca `ambSchedule`) pozostaje dowodnie nietknięta — zero zmian w
   `composeKamien`, `LEVELS`, ani w jej własnej ścieżce planowania dźwięku;
   dowód: diff ograniczony wyłącznie do `ambSchedule` (i testu).
4. `tsc --noEmit` 0 błędów + wszystkie 5 bramek referencyjnych bez regresu.

## ALLOWLISTA — nic poza tym
`gra/src/audio/muzyka-antyczna.ts` (WYŁĄCZNIE funkcja `ambSchedule`), nowy
plik testowy w `gra/tools/` (np. `ambience-natura-tylko-zwierzeta-test.cjs`),
`gra/src/main.ts` WYŁĄCZNIE jeśli potrzebny nowy hak testowy analogiczny do
istniejących (`window.__ambienceTestDebug`), wzorowany dosłownie na
`__musicEraTestDebug` (linia ~20311) — read-only/fixture-only, zero
player-reachable mutation. Zakazane bezwzględnie: `composeKamien`, `LEVELS`,
`ambTick`, `startAmbience`/`stopAmbience`/`setAmbienceVolume`, jakakolwiek
ścieżka `onlyNature=false`, `gra/data/**`, `docs/decyzje/<ID>.md`, `.git/**`,
`dyspozycje/WERSJE.md`, `gra-robocza/ROBOCZA-MANIFEST.json`, `playbook.json`.

## IZOLACJA
worktree własny, gałąź `autobot/R-AMBIENT-NATURA-TYLKO-ZWIERZETA-Q1`, baza
JAWNIE `origin/main`. Sparse-checkout bez `gra-robocza/`, `gra-kanon/`,
`dist/`.

## REGUŁA PRZECIW SAMOOSZUKIWANIU
Zakaz uznania kryterium 1-2 za spełnione na podstawie samego odczytu kodu —
wymagany realny dowód z żywego `AudioContext` w headless Chromium (lista
faktycznie zaplanowanych `e.typ`), bo to jest silnik audio z losowością
(`rr(r, ...)`) i asynchronicznym harmonogramem — literówka w warunku (np.
odwrócona negacja, literał `'wода'` z inną literą, porównanie do złej
właściwości) dawałaby fałszywe poczucie sukcesu bez testu. Zakaz uznania
kryterium 3 za spełnione bez pokazania dokładnego diffu ograniczonego do
`ambSchedule`+test — nie wolno „przy okazji" uprościć/scalić kodu wiatru w
`composeKamien` pod pretekstem porządkowania.

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
