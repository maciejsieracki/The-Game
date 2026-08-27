
# 00 — DISPATCH

STATUS: DISPATCHOWANE
DOMAIN: GAME
TEMAT: `R-AI-WYRAB-PRZY-RZECE-FARMY-Q1`
GOAL: AI ma **samo wycinać lasy przy rzekach i stawiać tam farmy** — o ile pomiar wykaże,
że to faktycznie lepsze niż stan dzisiejszy. Plus zmierzenie i naprawa przeważania obozów
łowieckich nad pastwiskami.

## Wyzwalacz — ECHO właściciela

> „fajnie żeby AI wycinało samo lasy przy rzekach i stawiało tam farmy"

Poprzednio, w kontekście obozów łowieckich:

> „Cywilizacja, zamiast na przykład budować owcę, często buduje obóz łowiecki."

## ZASTRZEŻENIE DO PRZESŁANKI — Operator MA to rozstrzygnąć PRZED implementacją

Recon znalazł istniejącą decyzję właściciela, która może czynić to zlecenie bezcelowym
albo zmieniać jego kształt:

**`gra/data/terrain-improvements.json:22`** — farma: `„ziemia uprawna; DZIAŁA BEZ rzeki
(podstawowy); MOŻE na lesie (Las) — bez wyrębu (Maciej 2026-07-21)"`, potwierdzone w kodzie
`improvement-build.ts:174-178` (`isFarmBaseTerrain`): na Łące/Równinie farma działa ZAWSZE,
także pod lasem; na Wzgórzach farma WYMAGA nakładki Las.

**Czyli dziś farmę przy rzece można postawić bez wycinania lasu.** Wycinka byłaby wtedy
pracą wydaną na coś, co i tak jest dostępne — chyba że daje coś, czego pomiar nie widzi
z góry: `wyrab` daje Drewno, a las może wpływać na plon farmy albo na inne ulepszenia.

**KROK 1 Operatora jest więc pomiarowy, nie implementacyjny:** porównaj na tej samej mapie
i ziarnie plon oraz koszt trzech wariantów dla pola przy rzece z lasem:
(a) farma na lesie bez wyrębu — stan dzisiejszy;
(b) wyrąb → farma;
(c) wyrąb → farma, licząc Drewno z wyrębu jako zysk.
Podaj liczby (żywność/pieniądz/praca/handel per turę + koszt Pracy + jednorazowe Drewno).

**Jeśli (a) wychodzi nie gorzej niż (b) i (c)** — zlecenie właściciela opiera się na
nieaktualnej przesłance i temat kończy się statusem `DECISION_REQUIRED` z tymi liczbami,
BEZ zmiany kodu. Właściciel zdecyduje, czy mimo to chce wycinki (np. dla Drewna albo
dla wyglądu mapy). **Nie implementuj wycinki „bo tak kazano", jeśli liczby jej nie bronią.**

**Jeśli (b) albo (c) wygrywa** — implementuj preferencję AI zgodnie z KROKIEM 2.

## KROK 2 — implementacja (warunkowa)

AI **już zna** `wyrab`: `auto-improvements.ts:411`, `:432`, `:447`, kolejkowany na samym
końcu (`ai.ts:1808`: „`wyrab` na SAMYM końcu"), `ai.ts:1823` mapuje `drewno: ['tartak','wyrab']`.
Sąsiedztwo rzeki jest już policzalne: `improvement-build.ts:656` `isRiverAdjacent`,
`:583` `buildRiverHexSet`.

Zadanie: AI ma rozpoznać wzorzec „pole przy rzece + las + farma opłacalna po wyrębie"
i zaplanować **dwa kroki** (wyrąb, potem farma) zamiast traktować wyrąb jako zawsze-ostatni.
Zachowaj istniejący kontrakt: `ai.ts:118` mówi wprost, że AI NIE ma per-owner wieloturowego
stanu dla `wyrab` — jeśli Twoja zmiana tego wymaga, **zgłoś to jako BLOCK**, nie obchodź.

## KROK 3 — druga skarga: obozy vs pastwiska

Zmierzone w `R-ULEPSZENIA-OBOZ-LOWIECKI-TYLKO-LAS-Q1`: AI stawia **99 obozów / 56 pastwisk**
(3 ziarna × 40 tur, Operator) i **83/62** (inne ziarna, Evaluator) — **identycznie przed
i po zawężeniu obozów do lasu**. Zawężenie terenu nie zmieniło zachowania AI o jedno pole,
więc przyczyną są **wagi wyboru ulepszeń**, nie dostępność terenu.

Zmierz, dlaczego obóz wygrywa z pastwiskiem, i zaproponuj korektę wag. **Nie zmieniaj wag
„na oko"** — pokaż funkcję oceny, wartości dla obu ulepszeń na tym samym polu i dopiero
wtedy zmianę. Po zmianie podaj nowe liczby na tych samych ziarnach.

## REGUŁA PRZECIW SAMOOSZUKIWANIU

- **ZAKAZ implementacji przed KROKIEM 1.** Ten temat ma udokumentowaną, sprzeczną decyzję
  właściciela z 2026-07-21. Zmiana wbrew niej bez liczb i bez ECHO = FAIL.
- **ZAKAZ strojenia wag bez pomiaru PRZED/PO** na tych samych ziarnach. Jedno ziarno to anegdota.
- **ZAKAZ dowodu regexem po własnym źródle.** Dowodem jest przebieg 40 tur i liczby.
- Każda nowa asercja MUSI czerwienieć po jednej celowanej mutacji — pokaż mutację i wynik.
- Sprawdź, czy zmiana nie psuje `ai-praca-split-parity-test` (parytet gracz/AI) ani
  `auto-improvements-test`.

## Kryteria sukcesu

1. Tabela liczbowa z KROKU 1 (trzy warianty, plon + koszt + Drewno).
2. Jeśli implementacja: AI stawia farmy przy rzece po wyrębie — pomiar PRZED/PO,
   min. 3 ziarna × 40 tur, liczba farm przy rzece.
3. Obozy vs pastwiska: liczby PRZED/PO na tych samych ziarnach co poprzedni temat
   (42, 1337, 2026 oraz 5150, 31337).
4. `tsc --noEmit` 0; 5 bramek referencyjnych zielonych; `auto-improvements-test` 45/0
   bez pogorszenia; `ai-praca-split-parity-test` bez pogorszenia.
5. Nowa bramka tematu z dowodem nietautologiczności.

## Izolacja

Gałąź `autobot/R-AI-WYRAB-PRZY-RZECE-FARMY-Q1` od `origin/main`, worktree per rola.

## Allowlista

`gra/src/game/ai.ts` · `gra/src/game/auto-improvements.ts` · `gra/tools/*` · raporty runu.
Ewentualnie `gra/data/ai-params.json` (wagi) — jeśli tak, **wyłącznie wartości dotyczące
wyboru ulepszeń**, z uzasadnieniem per liczba.

**NIE ruszać:** `gra/src/map/improvement-build.ts` i `gra/data/terrain-improvements.json`
(równoległy temat `R-ULEPSZENIA-OBOZ-LOWIECKI-TYLKO-LAS-Q1` runda 2 pracuje na
`improvement-build.ts` — kolizja = FAIL), `gra/src/main.ts`, `gra/src/ui/**`,
`dyspozycje/WERSJE.md`, `gra-robocza/**`.

**RÓWNOLEGŁE TEMATY (§2b):** `R-ULEPSZENIA-OBOZ-LOWIECKI-TYLKO-LAS-Q1` runda 2
(`improvement-build.ts`) · `P-DYPLO-WOJNY-KAMIEN-NIE-WIDAC-Q1` (tylko `gra/tools`) ·
`P-WYDARZENIA-ZBADANO-KLIK-KARTA-TECH-Q1` (`techDiscoveryNotice.ts`, `entityCards/*`,
`sidePanelHud.ts`, `main.ts` ~`:26185`).

## HIGIENA URUCHOMIEŃ

Każde wywołanie w `timeout`. NIE uruchamiać `map-gen-regression-test` — użyj wzorca
z `gra/tools/oboz-lowiecki-ai-40tur-measure.cjs`, który już mierzy AI przez 40 tur.
C-001: zakaz `npm run build`/`dev`. Zakaz `npx`, zakaz `git add -A`.
**Commituj cząstkowe postępy W TRAKCIE** — w tym repo trzy tematy zginęły przez brak commita.

## Pętla

Operator → Evaluator → Final Control → integracja orkiestratora. Limit 5 rund.
Model/effort: **Opus 5 High dla wszystkich trzech ról**. `opts.model` jawnie (C-062).

## Raport terminalny dispatchu

ZMIANY/COMMIT: jeszcze brak — dispatch.
TESTY: kryteria sukcesu 1–5 wyżej.
BLOKADY: brak.
RUNDY: 0/5 (dispatch).
NASTĘPNY KROK: Operator, runda 1 — KROK 1 pomiarowy PRZED implementacją.
DEPLOY/PUSH: NIE WYKONANO.
