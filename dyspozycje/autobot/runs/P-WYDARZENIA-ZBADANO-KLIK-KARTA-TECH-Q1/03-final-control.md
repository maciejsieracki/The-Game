# 03 — FINAL CONTROL (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: `P-WYDARZENIA-ZBADANO-KLIK-KARTA-TECH-Q1`
MODEL+EFFORT: **Opus 5, effort high**
RUNDY: 1/5

GOAL (1:1 z `00-dispatch.md` + rozszerzenie (B)): klik „Zbadano: <tech>" otwiera kartę TEJ
technologii (A); karta ulepszenia z „Szczegóły →" pojawia się OBOK karty technologii, obie
widoczne (B). GOAL Operatora i Evaluatora = GOAL dispatchu — bez rozjazdu (§16a p.9).

## 1. Praca JEST w commitach, nie w worktree

`git fetch` → `origin/autobot/P-WYDARZENIA-ZBADANO-KLIK-KARTA-TECH-Q1`:
`eb56296f` → `57006261` → `cc7100fc` → `00be09d8` → `2cc7b8b9` → `19d2b001`.
Własny worktree `/home/user/wt-fc-wydarzenia` założony **z `origin`** (detached `19d2b001`),
nie z cudzego katalogu. `merge-base` z `main` = `0ad2c20a`; diff od tego punktu:
`gra/src/main.ts` (+121/−8), `gra/src/ui/techDiscoveryNotice.ts` (+148/−29),
`gra/tools/wydarzenia-zbadano-karta-tech-real-render-test.cjs` (nowy),
`…/runs/<ID>/01-operator.md`, `02-evaluator.md`, `ev-harness/ev-weryfikacja.cjs`.
**6 plików, wszystkie w allowliście.** `renderer.ts`, `buildingAdapter.ts`, `sidePanelHud.ts`
— NIETKNIĘTE (potwierdzone `git diff`, nie deklaracją). Drzewo czyste po całej mojej pracy.

**Próbny merge:** `git merge-tree --write-tree origin/main HEAD` przy `origin/main=28cba33f`
(i wcześniej `b9334fac`) — **exit 0, zero konfliktów**, jedyne auto-merge: `gra/src/main.ts`.
Ryzyko do integracji, nie konflikt dziś: moje wstawki `~:19029` i `~:19090` przesuwają numerację
o ~70 linii, więc `R-PRACA-PANEL-BUDOWY-WLASCIWA-WARSTWA-Q1` (`~:19352`) trafi po scaleniu
w `~:19422`. Odległość > 70 linii, kontekst 3 linii się nie styka — merge treściowy, nie liniowy.

## 2. (A) — klik „Zbadano" → karta TEJ technologii: **POTWIERDZONE**

Trzecia, niezależna reprodukcja w żywym Chromium (własny skrypt, własny build
`/tmp/civ-dist-fc-wydarzenia`, `?playtest=mapa`, realny `page.mouse.click`):

- karta `tech-done-12-rolnictwo` w panelu: pigułka **„Karta technologii →"** (117.6 px),
  `cursor:pointer`, `role=button`, `tabindex=0`; klik → host karty encji, H2 = **„Rolnictwo"**;
- `Enter` z klawiatury na tej samej karcie → też otwiera „Rolnictwo" (afordancja klawiaturowa);
- **kontrola oczami gracza:** obok postawiłem kartę audytu `war-*` („Dyplomacja →") i dawną,
  martwą `eot-hint-*`. Trzy karty na jednym zrzucie: pigułka „Zbadano" jest **tego samego
  kroju i tej samej klasy `.sp-goto-cta`** co „Dyplomacja →", a martwy `eot-hint` ma
  `sp-no-link` + `cursor:default` i **żadnej pigułki**. Konwencja audytu przekierowań
  zachowana, nic nowego nie wymyślono. Gracz odróżnia klikalne od martwego na pierwszy rzut oka.
- ✕ trwale kasuje wpis z `warEventLog` i **nie** otwiera karty (bramka, (A3)).

## 3. (B) — obie karty naraz: **POTWIERDZONE**, także wzrokowo

Pomiar `getBoundingClientRect()` + `elementFromPoint()` w środku **każdej** karty,
7 szerokości okna, za każdym razem po realnym kliku w „Szczegóły →":

| viewport | układ | karta tech | karta ulepszenia | obie w viewporcie / hit-test siebie | obce `.entity-card-backdrop` |
|---|---|---|---|---|---|
| 1600×1000 | row | 246,323 660×353 | 920,347 434×307 | TAK / TAK | 0 |
| 1280×900 | row | 86,273 | 760,297 | TAK / TAK | 0 |
| 1160×900 | column | 250,115 | 363,486 | TAK / TAK | 0 |
| 1100×800 | column | 220,65 | 333,428 | TAK / TAK | 0 |
| 1000×560 | column | 170,23 | 283,285 | TAK / TAK | 0 |
| 820×620 | column | 80,23 | 193,323 | TAK / TAK | 0 |
| 420×800 | column | 8,56 403×372 | 8,438 403×307 | TAK / TAK | 0 |

Próg 1160 px zadziałał dokładnie tam, gdzie go nazwano; **poniżej progu układ jest pionowy,
nie podmiana** — i obie karty nadal mieszczą się w oknie aż do 420×800.

**Ocena czytelności (na to skarżył się właściciel, nie na brak funkcji):**
1. **Związek jest widoczny i obustronny.** Po lewej wiersz „Ulepszenia terenu → Obóz łowiecki ·
   Szczegóły →", tuż obok niego karta „Obóz łowiecki", a w niej wiersz „Wymagania · Technologia:
   **Łowiectwo**" jako link zwrotny. Karta tech zachowuje złocony rant i poświatę, satelita ma
   lżejszy — hierarchia „źródło / szczegół" czyta się bez tłumaczenia.
2. **Powrót działa i jest oczywisty.** Satelita ma własne ✕ → zostaje sama karta technologii
   (zmierzone: `side:false`, `tech:"Łowiectwo"`). `Esc` zamyka najpierw satelitę, potem całość
   (2 × Esc → host znika). Klik w tło zamyka obie — zgodnie z wymogiem 7.
3. **Układ wygląda na zamierzony, nie na przypadek:** wspólna scena `.tdn-stage`, `gap` 14 px
   (10 px w pionie), satelita wyśrodkowany względem karty źródłowej, `animation` wejścia.
4. Link „Łucznictwo" (kind `technology`) zachowuje się tak samo — satelita podmienia satelitę,
   dalej DWIE karty. Zero błędów konsoli w całym przebiegu.

## 4. Bramki — moją ręką, w moim worktree

`tsc --noEmit` **0 błędów** · logic **213/213** · tech-tree **19/0** · research **33/33** ·
unit-replace **13/13** · combat **6/6** · bramka tematu **77/0** · harness Evaluatora **46/0**
(uruchomiony przeze mnie na moim buildzie — werdykt Evaluatora stoi na artefakcie, nie na słowie).

**21 bramek obszaru kart/wydarzeń/CivPedii, PRZED (`0ad2c20a`, osobny worktree) i PO — identyczne:**
entity-card-contract 75/0 · entity-card-cross-links-nested-overlay 24/0 ·
entity-card-action-buttons-real-render 31/0 · building-detail-card-migration 52/0 ·
unit-detail-card-migration 39/0 · unit-info-card-migration 26/0 ·
civpedia-cross-link-style-real-render 19/0 · civpedia-gra-id-mostek OK ·
escape-overlay-stack 84/0 · escape-overlay-real-panels 49/0 · tech-discovery-card-click 13/0 ·
tech-discovery-card-real-click 12/0 · technology-discovery-card-visual 48/0 ·
side-panel-event-link 34/0 · sidepanel-event-przekierowania-real-render 51/0 ·
sidepanel-event-header-wydarzenie-real-render 23/0 · sidepanel-events-toolbar 19/0 ·
sidepanel-hud-deadzone 43/0 · important-event-cards 10/0 ·
important-event-cards-regression OK · eot-event-defer 33/33.
To jest dowód, że wspólny renderer kart encji nie ucierpiał — mimo że go nie tknięto.

**Własne mutacje (nietautologiczność, niezależne od M1–M5 Operatora), źródła przywrócone:**
- **M-FC1** `wireSideCardLinks`: faza `capture` → `bubble` → bramka tematu **przerywa** na
  braku ✕ satelity. (B) faktycznie stoi na przechwytywaniu, nie na zbiegu okoliczności.
- **M-FC3** etykieta afordancji „Karta technologii" → „Szczegóły" → **75/2**. (A) faktycznie
  asertuje konwencję audytu, nie samą obecność pigułki.
- **M-FC2** `indexOf` → `lastIndexOf` w parserze sluga → **77/0, NIE czerwieni.** Zapisuję
  jawnie: to mutant równoważny — bramka osobno dowodzi, że żaden z 32 slugów nie zawiera `-`,
  więc obie funkcje dają ten sam wynik na całej realnej dziedzinie. Nie jest to luka pokrycia.

## 5. Uwagi Evaluatora wobec §3b — ocena

| # | Uwaga | Klasyfikacja | Skutek |
|---|---|---|---|
| 1 | BRAK DOWODU na emiter w żywej rozgrywce | **BRAK DOWODU (§13a), nie ukryta wada** | nie odsyła — patrz §6 |
| 2 | resolver `tech-done-*` w `main.ts`, nie w `side-panel-event-link.ts` | dług kosmetyczny, w allowliście plikowej | **wymaga rejestracji jako osobny temat** |
| 3 | limit 8 wpisów `warEventLog` | zachowanie zastane, wspólne dla wszystkich rodzin | **wymaga rejestracji jako osobny temat** |
| 4 | unikalny `--outDir` per TEMAT (higiena) | kosmetyczna, procesowa | **wymaga rejestracji jako osobny temat** |

Żadna z uwag nie dotyka kryterium GOAL, zakresu ani granicy §9 → **nie odsyłam do Operatora.**
Ad 3, zweryfikowane przeze mnie w kodzie: `main.ts:26302` robi `unshift` + `length = 8`, a
`main.ts:29531-29535` dokłada hinty EOT **później w tej samej turze** — przy ≥8 hintach karta
„Zbadano" wypada z listy. To dotyczy tak samo `era-*` (`:12172`) i wszystkich pozostałych rodzin,
więc **nie jest regresją tego tematu**; wymóg 4 dyspozycji mówi „dopóki widnieje na liście".

## 6. BLOKADY / BRAK DOWODU

**BRAK DOWODU — emiter `tech-done-*` w żywej rozgrywce.** Reprodukuję blokadę **trzeci raz,
niezależnie**: w `?playtest=mapa` przycisk „Zakończ turę" znika po turze 0 (zwycięstwo /
`canPlayerInitiateEndTurn()===false`), a w `?playtest=miasto` nie ma go wcale — 40 prób kliku,
zero kart `tech-done-*`. Karty w bramce są inscenizowane hakiem `seedEvents`, tym samym, który
`main` przyjął przy audycie przekierowań.
Co jednak **jest** udowodnione i zawęża lukę do jednego kroku: nowy blok siedzi w tym samym
`if (!eraAdvanced)`, co linia, która wyprodukowała komunikat **ze zrzutu właściciela** — czyli
osiągalność tej gałęzi potwierdza sam wyzwalacz tematu; a bramka dowodzi, że wszystkie 32 slugi
rozwijają się z powrotem w istniejącą technologię. Niezweryfikowane pozostaje jedno: czy
`techToSlug(done.id)` w faktycznym przebiegu tury dostaje kanoniczną nazwę. **Zgłaszam to jako
warunek, nie jako zieloną bramkę** — właściciel ma to zobaczyć w pierwszej realnej rozgrywce po
deployu, a rozszerzenie haka o „ukończ technologię bez awansu epoki" należy założyć jako temat
infrastrukturalny.

**BLOKADA PROCESOWA (§16b p.4 i p.6) — do orkiestratora, nie do Operatora:**
`dyspozycje/REJESTR-PROSB-I-ZADAN.md` **nie zawiera tego ID** (0 trafień; tak samo
`P-WYDARZENIA-AUDYT-PRZEKIEROWANIA-Q1`, `R-PRACA-PANEL-BUDOWY-…`, `R-AI-WYRAB-…`).
`PYTANIA-OTWARTE.md` też nie. §3b domyka proces przy `PASS-WITH-NOTES` **wyłącznie**, gdy uwagi
kosmetyczne są zapisane jako osobny temat w rejestrze — dziś nie są. Rejestr jest poza allowlistą
tematu, więc to krok orkiestratora **przed** `READY_FOR_DEPLOY`, nie powód na rundę 2.

**Nota kosmetyczna (moja):** bramka tematu przy zerwanym (B) *przerywa* zamiast zliczyć `FAIL` —
czerwieni się, ale komunikat jest `TimeoutError`, nie nazwany asercją. Do rozważenia osobno.

## 7. Werdykt

Granice §9: żadna nie naruszona — zero `npm run build`/`dev` (build wyłącznie
`node ./node_modules/vite/bin/vite.js --outDir /tmp/civ-dist-fc-wydarzenia`), zero `npx`, zero
`git add -A`, `map-gen-regression-test` nieuruchamiany, `WERSJE.md`/`gra/data/**`/`gra-robocza/**`
nietknięte, każde wywołanie w `timeout`. `gra/src/data/wikiBundle.json` przestemplowany przez mój
build — **przywrócony `git checkout`, nie ma go w żadnym commicie.**

ZMIANY-COMMIT: bez zmian w kodzie gry; wyłącznie ten raport.
TESTY: §4 wyżej.
NASTĘPNY KROK: integracja orkiestratora (allowlist-only, per plik i per hunk) **po** zarejestrowaniu
tematu i trzech uwag kosmetycznych w `REJESTR-PROSB-I-ZADAN.md`; `READY_FOR_DEPLOY` wystawia
wyłącznie orkiestrator.
DEPLOY-PUSH: NIE WYKONANO.

GOTOWOŚĆ DO INTEGRACJI: TAK
