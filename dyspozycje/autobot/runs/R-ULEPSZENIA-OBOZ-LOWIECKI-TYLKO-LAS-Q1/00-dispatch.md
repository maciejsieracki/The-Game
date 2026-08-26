# 00 — DISPATCH

STATUS: DISPATCHOWANE
DOMAIN: GAME
TEMAT: `R-ULEPSZENIA-OBOZ-LOWIECKI-TYLKO-LAS-Q1`
GOAL: Obóz łowiecki da się zbudować **wyłącznie na lesie** — na dowolnym terenie pod lasem
(równina, wzgórze, cokolwiek), ale **nigdy poza lasem**. Dotyczy gracza, AI i automatu
ulepszeń jednakowo.

## Wyzwalacz — ECHO właściciela

> „Kolejna kwestia na wzgórzach. Cywilizacja, zamiast na przykład budować owcę, często buduje
> obóz łowiecki. Obozy łowieckie raczej powinny być budowane w lasach. I tylko w lasach.
> Nie powinno być możliwości budowania w innych miejscach poza lasem. Oczywiście niezależnie,
> czy to jest las na wzgórzu, czy na innym terenie, ale tylko w lesie."

## USTALENIA RECONU — zweryfikuj, ale nie odkrywaj od nowa

**Dzisiejsza reguła to OR, właściciel chce AND-owego zawężenia do lasu.**

`gra/src/ui/hexContextTooltip.ts:476`:
```ts
if (key === 'oboz_lowiecki' && nakladka !== Nakladka.Las && !hasAnimalDeposit(nakladka)) continue;
```
Czyta się: dozwolone gdy **Las LUB złoże zwierzęce**. Stąd obozy na wzgórzach bez lasu.

`hasAnimalDeposit` → `gra/src/map/improvement-build.ts:605` (`NAKLADKI_ZWIERZECZE`).

Dane: `gra/data/terrain-improvements.json`, wpis `oboz_lowiecki`:
`"teren": "Las / dzika zwierzyna"`, `"warunek": "dzika zwierzyna"`, `koszt_praca: 18`, `tech: Łowiectwo`.

**To jest tylko JEDEN punkt egzekwowania — i to w tooltipie.** Operator MA odnaleźć
**WSZYSTKIE** miejsca decydujące o dopuszczalności: ścieżka budowy gracza
(`gra/src/map/improvement-build.ts`), automat (`gra/src/game/auto-improvements.ts:42`, `:49`),
AI (`gra/src/game/ai.ts`), lista w trybie budowy, walidacja przy zapisie.
**Poprawienie samego tooltipa przy pozostawieniu innej ścieżki dopuszczającej = FAIL.**

## PUŁAPKA — przeczytaj zanim napiszesz warunek

`gra/src/game/combat.ts:638-646` dokumentuje udowodniony błąd:
**`normTerrain('Plaskie (rownina/laka)')` DOSŁOWNIE ZAWIERA podciąg `las`** („p-LAS-kie").
Sprawdzenie lasu przez `.includes('las')` da fałszywe trafienie na równinie —
w tym repo to już raz wystąpiło i zostało naprawione testem.

**Używaj dokładnego dopasowania enumu `Nakladka.Las`, nigdy dopasowania po podciągu nazwy.**
Jeśli mimo wszystko sięgniesz po nazwę tekstową — musisz jawnie udowodnić, że równina
NIE przechodzi. To jest asercja obowiązkowa.

## PYTANIE DO ROZSTRZYGNIĘCIA — nie zgaduj po cichu

Dziś warunek to `Las LUB złoże`. Właściciel powiedział: „tylko w lesie". To jednoznacznie
czyni **las warunkiem koniecznym**. Otwarte pozostaje, czy **złoże dzikiej zwierzyny nadal
jest wymagane** (czyli `Las I złoże`), czy wystarczy sam las (`tylko Las`).

Operator MA to **zmierzyć, nie zgadnąć**: policzyć na kilku wygenerowanych mapach, ile pól
kwalifikuje się przy każdym z trzech wariantów (dziś `Las LUB złoże` · `tylko Las` ·
`Las I złoże`). Jeśli `Las I złoże` daje liczbę bliską zeru — ulepszenie stałoby się martwe
i **to jest `DECISION_REQUIRED` dla właściciela**, nie decyzja Operatora. Jeśli obie opcje
są grywalne, zaimplementuj `Las I złoże` (zachowuje istniejący `warunek: "dzika zwierzyna"`
z danych) i **jawnie odnotuj tę interpretację w raporcie**, żeby właściciel mógł ją obalić
jednym zdaniem.

## DRUGA CZĘŚĆ ZGŁOSZENIA — preferencja AI

> „Cywilizacja, zamiast na przykład budować owcę, często buduje obóz łowiecki."

Zmierz to PRZED i PO zawężeniu: ile obozów łowieckich i ile pastwisk (owce/bydło/lama)
stawia AI na przestrzeni ~40 tur, na tej samej mapie i ziarnie. Możliwe, że samo zawężenie
terenu rozwiązuje problem — wtedy powiedz to wprost z liczbami. Jeśli NIE rozwiązuje
(AI dalej preferuje obóz tam, gdzie jest las, kosztem lepszego pastwiska obok), **zgłoś to
jako osobne znalezisko do rejestru** — strojenie wag AI jest poza allowlistą tego tematu.

## REGUŁA PRZECIW SAMOOSZUKIWANIU

- **ZAKAZ** uznania tematu za zrobiony po poprawieniu jednej ścieżki. Wypisz WSZYSTKIE
  znalezione punkty egzekwowania i pokaż stan każdego z nich po zmianie.
- **ZAKAZ** warunku po podciągu nazwy terenu bez dowodu, że równina go nie spełnia (patrz PUŁAPKA).
- **ZAKAZ** dowodu regexem po własnym źródle. Dowodem jest **pomiar zachowania**: wygeneruj
  mapę, weź pole „wzgórze bez lasu ze złożem zwierzęcym" i pokaż, że obóz jest tam
  niedostępny — dla gracza, dla automatu i dla AI osobno.
- Każda nowa asercja MUSI czerwienieć po jednej celowanej mutacji źródła — pokaż mutację i wynik.
- **Sprawdź las na wzgórzu.** To dokładnie przypadek, który właściciel wymienił: ma DZIAŁAĆ.
  Łatwo go zgubić, jeśli warunek zostanie napisany jako „teren == równina && las".

## Kryteria sukcesu

1. Wzgórze **bez lasu**, ze złożem zwierzęcym → obóz **niedostępny**. Gracz, automat, AI.
2. Las **na wzgórzu** → obóz **dostępny**. (Przypadek wymieniony wprost przez właściciela.)
3. Las na równinie → obóz dostępny.
4. Równina bez lasu → obóz niedostępny, **i to nie z powodu przypadkowego dopasowania
   podciągu** — osobna asercja na pułapkę „p-LAS-kie".
5. Liczby PRZED/PO dla AI: obozy łowieckie vs pastwiska, ~40 tur, ta sama mapa i ziarno.
6. Istniejące obozy w starych zapisach: powiedz jawnie, co się z nimi dzieje (zostają czy
   znikają) — **nie zmieniaj tego po cichu**. Migracja kasująca cudze ulepszenia wymagałaby
   osobnej decyzji właściciela.
7. `tsc --noEmit` 0 błędów; 5 bramek referencyjnych zielonych (logic 213/213, tech-tree 19/0,
   research 33/33, unit-replace 13/13, combat 6/6); `auto-improvements-test.cjs` bez pogorszenia.
8. Nowa bramka tematu z dowodem nietautologiczności.

## Izolacja

Gałąź `autobot/R-ULEPSZENIA-OBOZ-LOWIECKI-TYLKO-LAS-Q1` od `origin/main`, worktree per rola.

## Allowlista

`gra/src/map/improvement-build.ts` · `gra/src/ui/hexContextTooltip.ts` ·
`gra/src/game/auto-improvements.ts` · `gra/src/game/terrain-improvements.ts` ·
`gra/data/terrain-improvements.json` (wyłącznie pola `teren`/`warunek` wpisu `oboz_lowiecki`,
z dopiskiem uzasadnienia w tym samym stylu co istniejące adnotacje w tym pliku) ·
`gra/tools/*` · raporty runu.

**TRZY RÓWNOLEGŁE TEMATY (§2b) — trzymaj się z dala od ich plików:**
- `R-PRACA-PANEL-BUDOWY-WLASCIWA-WARSTWA-Q1` → `buildModeHud.ts`, `main.ts` ~`:19352`
- `R-REKRUTACJA-SUROWIEC-BEZ-UPKEEP-Q1` → `economy-upkeep.ts`, `cityPanel.ts`, `main.ts` ~`:913`
- `P-WYDARZENIA-ZBADANO-KLIK-KARTA-TECH-Q1` → `techDiscoveryNotice.ts`, `entityCards/*`,
  `sidePanelHud.ts`, `main.ts` ~`:26185`

**NIE ruszać `gra/src/main.ts` w ogóle** — trzy inne tematy już go dotykają. Jeśli okaże się
niezbędny, zgłoś jako `BLOCK` z numerem linii zamiast edytować.
**NIE ruszać** `gra/src/game/ai.ts` (strojenie wag AI = osobny temat), `dyspozycje/WERSJE.md`,
`gra-robocza/**`, pozostałych wpisów w `terrain-improvements.json`.

## HIGIENA URUCHOMIEŃ

Każde wywołanie w `timeout`. NIE uruchamiać `map-gen-regression-test` (mimo że temat dotyka
mapy — ta bramka jest zakazana, użyj własnego, wąskiego harnessu generującego mapę).
C-001: zakaz `npm run build`/`dev`; dozwolone
`node ./node_modules/vite/bin/vite.js build --outDir /tmp/... --emptyOutDir`.
Zakaz `npx`, zakaz `git add -A`. **Commituj cząstkowe postępy W TRAKCIE** — w tym repo
dwa tematy zginęły przez brak commita.

## Pętla

Operator → Evaluator → Final Control → integracja orkiestratora. Limit 5 rund.
Model/effort: **Opus 5 High dla wszystkich trzech ról**. `opts.model` jawnie (C-062).

## Raport terminalny dispatchu

ZMIANY/COMMIT: jeszcze brak — dispatch.
TESTY: kryteria sukcesu 1–8 wyżej.
BLOKADY: brak.
RUNDY: 0/5 (dispatch).
NASTĘPNY KROK: Operator, runda 1.
DEPLOY/PUSH: NIE WYKONANO.
