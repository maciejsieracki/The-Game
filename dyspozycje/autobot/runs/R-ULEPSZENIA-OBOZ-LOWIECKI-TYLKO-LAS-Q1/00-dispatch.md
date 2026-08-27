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

---

# RUNDA 2 — decyzje właściciela po FAIL Evaluatora i Final Control (2026-08-27)

Runda 1 zakończyła się **FAIL** u Evaluatora i Final Control. Powód nie był błędem
implementacji tego, co zrobiono — było nim **znalezienie dziury, której Operator nie objął**.

## Rozstrzygnięcie 1 — wariant reguły: **`tylko Las`** (nie „Las I złoże")

`DECISION_REQUIRED` Operatora **odpada bez pytania właściciela**, bo alternatywa jest
strukturalnie niemożliwa, nie tylko niekorzystna: `Nakladka` to JEDNO pole heksa,
a `Las` nie należy do `NAKLADKI_ZWIERZECZE`. Wariant „Las I złoże" daje **0 pól na 5 mapach**
— zmierzone dwoma niezależnymi odczytami (nakładka oraz `hex.zloze`) przez Operatora
i odtworzone przez Evaluatora. Ulepszenie byłoby martwe.

Obowiązuje więc **`tylko Las`**: nakładka `Las` jest warunkiem koniecznym i wystarczającym
co do terenu. Pole `warunek: "dzika zwierzyna"` w `terrain-improvements.json` przestaje być
bramką terenu — Operator ma je opisać zgodnie z tym, co robi, albo usunąć, z uzasadnieniem.

## Rozstrzygnięcie 2 — **ECHO właściciela: wariant A** dla dziury P7

Pytanie zadane właścicielowi: co ma się stać przy wycince lasu pod istniejącym obozem.

> **Odpowiedź: A — obóz znika przy wyrębie.**

Uzasadnienie właściciela zgodne z regułą tematu: skoro obóz może istnieć wyłącznie w lesie,
to zniknięcie lasu znosi warunek jego istnienia. Praca **nie jest zwracana**.

## ZADANIE RUNDY 2 — dokładnie jedna poprawka, nic więcej

**P7 — `stripImprovementsWhenForestRemoved` (`gra/src/map/improvement-build.ts:165`)
jest pustym przelotem** (`return [...layers]`), mimo że jej docstring obiecuje filtrowanie
ulepszeń zależnych od nakładki Las. Skutek zmierzony przez Evaluatora: po wyrębie warstwy
heksa to `["oboz_lowiecki"]` przy `nakladka='brak'` — **obóz poza lasem powstający w normalnej
rozgrywce**, u gracza (`main.ts:11908`→`:11912`) i u AI (`:28903`).

Zaimplementuj wariant A: funkcja ma usuwać `oboz_lowiecki` z warstw.
**Tartak NIE — kanon mówi wprost, że las zostaje przy tartaku** (patrz docstring).
Sprawdź, czy inne ulepszenia też zależą od nakładki Las i czy powinny zniknąć — jeśli tak,
wypisz je i uzasadnij; jeśli nie, powiedz to wprost.

Final Control policzył domknięcie: las znika w rozgrywce w **trzech** miejscach —
`main.ts:11753` (**ścieżka martwa**: `removesForest` na sztywno `false`, `improvement-build.ts:365`),
`:11910` wyrąb gracza, `:28905` wyrąb AI. Dwa ostatnie wołają pusty strip.
**Zbiór dziur jest domknięty i wynosi dokładnie P7** — nie szukaj dalej, napraw to jedno.

## Czego NIE ruszać w rundzie 2

P1–P6 zostały **zweryfikowane przez Evaluatora ścieżkami wykonania** (nie grepem) i są
zielone. Bramka tematu ma 71/71. **Nie przerabiaj ich.** Runda 2 to jedna poprawka
plus asercje na nią.

## Znane, świadomie NIEnaprawiane w tym temacie

- **Skarga „zamiast owcy buduje obóz łowiecki" NIE jest rozwiązana tym tematem.**
  Pomiar PRZED/PO, 3 ziarna × 40 tur, Operator: **99/56 przed i 99/56 po** — identycznie
  co do jednego pola. Evaluator na innych ziarnach: **83/62 przed i po**. Zawężenie terenu
  nie zmieniło zachowania AI, bo obozów poza lasem prawie nie było (791→790 pól na 5 mapach).
  To, co właściciel widział na wzgórzach, to **lasy na wzgórzach** — czyli przypadek, który
  ma działać i działa. Przyczyną skargi są **wagi AI**, poza allowlistą → osobny temat.
- **`createQualifier` w izolacji: BRAK DOWODU** (mutacja M-B / M1 = 0 FAIL). Gate commitu
  `computeImprovementBuildImpact` maskuje gate panelu — obrona w głąb, nie luka.
  Zgłoszone jawnie przez Operatora, potwierdzone przez Evaluatora i Final Control.

## Kryteria sukcesu rundy 2

1. Wyrąb lasu pod obozem → **obóz znika z warstw heksa**. Pomiar, nie odczyt kodu:
   postaw obóz na lesie, wytnij las, odczytaj warstwy.
2. To samo dla ścieżki AI (`main.ts:28903`) — osobna asercja.
3. **Tartak NIE znika** przy wyrębie — kanon. Osobna asercja.
4. Nowa asercja czerwienieje po cofnięciu poprawki (mutacja pokazana z wynikiem).
5. Bramka tematu ≥ 71 pass, 0 fail. Sonda Evaluatora 88/0 (dziś 87/1). Sonda FC 5/0 (dziś 4/1).
6. `tsc --noEmit` 0; 5 bramek referencyjnych zielonych; `auto-improvements-test` 45/0.

## Allowlista rundy 2

Bez zmian, plus jawnie: `gra/src/map/improvement-build.ts` (funkcja `stripImprovementsWhenForestRemoved`).
**NIE ruszać `gra/src/main.ts`** — hooki `:11912` i `:28903` już wołają tę funkcję, wystarczy
naprawić ją samą.
