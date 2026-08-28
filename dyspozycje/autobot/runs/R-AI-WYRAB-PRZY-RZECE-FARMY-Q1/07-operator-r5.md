# 07 — OPERATOR, runda 5 (OSTATNIA): R-AI-WYRAB-PRZY-RZECE-FARMY-Q1

MODEL+EFFORT: Opus 5, effort high
WORKTREE: `/home/user/wt-op-ai-r5`, gałąź `autobot/R-AI-WYRAB-PRZY-RZECE-FARMY-Q1-R5`
BAZA: `origin/autobot/R-AI-WYRAB-PRZY-RZECE-FARMY-Q1-R4` @ `fd24330b`
WORKTREE PORÓWNAWCZY: `/tmp/op5-main` (detached na `origin/main` `755e5141`)

Zakres tej rundy = DOKŁADNIE dwie naprawy z dispatchu r5: **Z-3** (persist znacznika
Zasady 3) i **FC-2** (wykluczenie miast-państw z Zasady 3). **Z-1 i FC-1 nietknięte** —
to pytania ABC do właściciela, nie rozstrzygam ich sam (potwierdzenie w §5 niżej).

---

## 1. NAPRAWA Z-3 — `aiSurplusRedirectedOwners` jest teraz trwały

### Co było zepsute (łańcuch, potwierdzony własną ręką)

`aiSurplusRedirectedOwners` (`main.ts:7495`) sterował **powrotem** podziału Pracy po
ustaniu nadwyżki, ale nie był zapisywany. Stan, który blok Zasady 3 **zapisuje**, trwały
był: `ownerDefaultPodzialPracy` → `meta` (`main.ts:24920` przed zmianą) i `city.podzialPracy`
→ razem z miastami. Po `save` w turze z nadwyżką i `load` zbiór był pusty, więc gałąź
`else if (redirected)` **nie wykonywała się już nigdy**, a AI CYWILIZACJI zostawało na
`procentBudynki = MAX_PODZIAL_PRACY_BUDYNKI_PERCENT = 100` →
`procentPuliImperiumZBudynkow(100) = 0` → zero Pracy do puli imperium → **zero ulepszeń
terenu, trwale**.

### Co zmieniłem (3 miejsca w `main.ts`, format wzorem sąsiadów)

| miejsce | zmiana |
|---|---|
| `buildSaveGameSnapshot` (obok `aiBadanaByOwner`) | `aiSurplusRedirectedOwners: Array.from(aiSurplusRedirectedOwners),` — płaska tablica `ownerId`, dokładnie ten sam kształt co `eliminatedOwners` / `typCityCopyOwners` / `simplifiedDiplomacyOwners` / `clusterCapitalOwnerIds` w tym samym obiekcie `meta` |
| `restoreGameFromSave` (obok `aiPracaPoolByOwner`) | `clear()` bezwarunkowy + `if (savedSurplusRedirected?.length) { … add(oid) }` — ten sam wzorzec „clear, potem odtwórz, stary zapis bez pola = pusty zbiór" |
| `applyClusterStartPlan` (obok `eliminatedOwners.clear()`) | `aiSurplusRedirectedOwners.clear()` na starcie nowej gry |

**§14 — jawnie zgłaszam trzecią zmianę jako dopisek poza literą dispatchu.** Dispatch
wymagał punktów 1 (zapis) i 2 (odczyt). Trzecia linia (`clear()` w `applyClusterStartPlan`)
jest tego bezpośrednią konsekwencją: od momentu, w którym znacznik jest TRWAŁY, gra
rozpoczęta po wczytaniu sejwu w tej samej sesji przeglądarki dziedziczyłaby
„przekierowanych" ownerów z poprzedniej partii. Jedna linia + komentarz, przy siostrzanych
`clear()`-ach tej samej funkcji. Jeśli Evaluator uzna to za poszerzenie zakresu — do
usunięcia bez wpływu na resztę naprawy.

### DOWÓD PRZED/PO — na PRAWDZIWYM kodzie z `main.ts`, nie na reimplementacji

`main.ts` żyje jako jedno ogromne domknięcie i nie da się go zbundlować w izolacji
(`import.meta.glob`, brak loaderów `.svg` — to zastana bramka-przeszkoda, patrz §4).
Użyłem metody, która jest już w tym repo precedensem dla dokładnie tego problemu —
`tools/fort-nodes-save-load-test.cjs`: **wytnij prawdziwy tekst z `main.ts` i WYKONAJ go**
przez `new Function` (składnia TS-only przez esbuild, jak w buildzie produkcyjnym).
Lokalizacja przez sąsiedztwo tekstu, nigdy przez numer linii.

Scenariusz sondy `tools/ai5-z3-fc2-probe.cjs`: owner AI CYWILIZACJI, 2 miasta, suwak AI
ustawiony na 85 % budynków → **tura z NADWYŻKĄ** (wykonany prawdziwy blok Zasady 3) →
**save** (prawdziwe RHS z `buildSaveGameSnapshot` + JSON round-trip, tak jak realna
persystencja) → **load w świeżej sesji** (prawdziwy blok z `restoreGameFromSave`) →
**tura BEZ nadwyżki** (znowu prawdziwy blok Zasady 3).

```
PRZED | zapis w meta: BRAK                                  | odczyt: BRAK | znacznik po load: false | procentBudynki 100 -> 100 | pula imperium  0% | miasta [100,100]
PO    | zapis w meta: Array.from(aiSurplusRedirectedOwners) | odczyt: JEST | znacznik po load: true  | procentBudynki 100 ->  70 | pula imperium 30% | miasta [ 70, 70]
```

PRZED: `procentBudynki` zostaje na 100, **pula imperium 0 %** — zero Pracy na ulepszenia
terenu, trwale. PO: podział wraca, pula imperium 30 %, oba miasta wracają na 70.

Kolumna „PRZED" nie jest wspomnieniem starego kodu — to **ta sama sonda uruchomiona na
kopii bieżącego `main.ts` zmutowanej w pamięci z powrotem do stanu sprzed naprawy**
(zapis i odczyt wycięte). Pełny zrzut: `op5-przed-po.txt`.

### NOTA §13a — czego ta naprawa NIE naprawia (zgłaszam, nie naprawiam)

Po wczytaniu podział wraca do `DEFAULT_PODZIAL_PRACY.procentBudynki` (70), **nie do
wartości, którą AI wybrało samo** (w sondzie: 85) — bo `aiSliderStateByOwner` też nie
jest persistowany, a ścieżka powrotu ma na niego `?? DEFAULT_PODZIAL_PRACY.procentBudynki`.
To **osobna sprawa, poza zakresem dispatchu r5** i nie jest trwałym zablokowaniem:
`decideAIEconomySliders` przelicza suwaki w kolejnych turach. Celowo ustawiłem w sondzie
85 zamiast 70, żeby ta różnica była widoczna w liczbach, a nie ukryta pod przypadkową
zgodnością wartości. Do rejestru — nie ruszałem.

---

## 2. NAPRAWA FC-2 — Zasada 3 nie dotyka już miast-państw

Blok Zasady 3 (`main.ts`, kotwica `const surplusRep = aiSurplusReportByOwner.get(ownerId);`)
jest teraz opakowany w `if (!opts.defensiveCopy) { … }` — **dokładnie ten sam warunek, co
sąsiedni blok CUDA-AI kilkanaście linii niżej**, który wyklucza kopie obronne jawnie
(przeczytałem go najpierw i skopiowałem wzorzec, jak wymagał dispatch). Zero zmian
w środku bloku poza wcięciem.

### DOWÓD PRZED/PO — 3 ziarna rosteru z aktywnymi miastami-państwami

Roster generowany deterministycznie z ziarna (8 ownerów, każde ziarno ma i miasta-państwa,
i AI CYWILIZACJI), **wszyscy w stanie nadwyżki**. Wykonanie prawdziwego bloku Zasady 3
przez ten sam harness co wyżej. PRZED = bieżący `main.ts` ze strażnikiem zmutowanym
w pamięci na `if (true) {`.

```
strażnik bloku — PO:    if (!opts.defensiveCopy) {
strażnik bloku — PRZED: if (true) {

ziarno 1337   PM=[3,4,5,6]   CIV=[1,2,7,8]
  PRZED: PM przekierowanych 4/4 | miast PM na 100% budynków 4 | CIV 4/4 | znaczniki PM w Set: 4
  PO:    PM przekierowanych 0/4 | miast PM na 100% budynków 0 | CIV 4/4 | znaczniki PM w Set: 0
ziarno 4242   PM=[2,3,6]     CIV=[1,4,5,7,8]
  PRZED: PM przekierowanych 3/3 | miast PM na 100% budynków 3 | CIV 5/5 | znaczniki PM w Set: 3
  PO:    PM przekierowanych 0/3 | miast PM na 100% budynków 0 | CIV 5/5 | znaczniki PM w Set: 0
ziarno 90210  PM=[1,3,5,7]   CIV=[2,4,6,8]
  PRZED: PM przekierowanych 4/4 | miast PM na 100% budynków 4 | CIV 4/4 | znaczniki PM w Set: 4
  PO:    PM przekierowanych 0/4 | miast PM na 100% budynków 0 | CIV 4/4 | znaczniki PM w Set: 0
```

Miasta-państwa: 11/11 przekierowanych PRZED → **0/11 PO**. AI CYWILIZACJI: 13/13 PRZED
i **13/13 PO** — naprawa wyłącza kopie obronne i **nie osłabia** działania Zasady 3 dla
głównych rywali, o których mówi GOAL.

---

## 3. BRAMKA I MUTACJE

### Dwie nowe asercje w `ai4-popyt-obywatele-test.cjs` (48 → **50/0**)

Obie **wykonują prawdziwy kod z `main.ts`** przez wspólny harness
`tools/ai5-zasada3-harness.cjs` (jedna implementacja, dwóch konsumentów: bramka i sonda) —
to **nie są strażniki tekstowe**:

- **Z3l** (naprawa Z-3): pełny round-trip save → load → tura bez nadwyżki; czerwona, jeśli
  `procentBudynki` zostaje na 100 albo pula imperium spada do 0.
- **Z3m** (naprawa FC-2): 3 ziarna, wszyscy w nadwyżce; czerwona, jeśli którekolwiek
  miasto-państwo dostanie przekierowanie **albo** jeśli AI CYWILIZACJI przestanie je dostawać
  (asercja pilnuje obu kierunków, nie tylko wyłączenia).

### Trzy nowe mutacje w `ai4-mutacje.cjs` (15 → **18 dowodów, 0 podejrzanych**)

| mutacja | co znosi | zaczerwieniona asercja |
|---|---|---|
| **M16** | usuwa ZAPIS znacznika w `buildSaveGameSnapshot` | Z3l |
| **M17** | usuwa ODCZYT znacznika w `restoreGameFromSave` | Z3l |
| **M18** | zdejmuje `if (!opts.defensiveCopy)` z bloku Zasady 3 | Z3m |

Dokładnie to, czego wymagał dispatch („usunięcie nowego zapisu/odczytu musi zaczerwienić
nową asercję", „usunięcie wykluczenia musi zaczerwienić nową asercję"). Każda z trzech
trafia w swoją i tylko swoją asercję. Ubocznie: mutacja M9 (rozbramkowanie przekierowania)
czerwieni teraz **Z3f i Z3l** — nowa asercja wzmacnia też pokrycie starego kodu.
Pełny zrzut: `op5-mutacje.txt`, `op5-bramka-ai4.txt`.

---

## 4. TESTY — wszystko własną ręką, z `gra/`, w `timeout`

**Pięć bramek referencyjnych:** logic **213/213** · tech-tree **19/0** · research **33/33** ·
unit-replace **13/13** · combat **6/6**.
`node ./node_modules/typescript/bin/tsc --noEmit` — **0 błędów**.
Build `node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-dist-ai-r5-op --emptyOutDir`
— **OK, 21,53 s**, 848 modułów.

**Bramki tematu:** `ai4-popyt-obywatele-test` **50/0** (było 48/0, +2 nowe asercje, zero
utraconych) · `ai2-heks-po-heksie-test` **35/0** (bez zmian).

**Bez pogorszenia:** auto-improvements **45/0** · ai-improvements **52/0** ·
map-improvement-qualify **117/0** · farma-nie-w-lesie **136/0** · oboz-lowiecki-las **91/0** ·
ulepszenia-praca-percent **28/0** · ai-slider **38/0**.

**Bramki save/load** (uruchomione dodatkowo, bo dotknąłem `buildSaveGameSnapshot`
i `restoreGameFromSave`): fort-nodes-save-load **18/0** · okolica-load-reconcile **23/23** ·
save-load-sort **4/4** · map-snapshot-load **58/0** (+1 known-fail, nie liczy się do exit
code) · autosave-quota-fail **20/0** · march-attack-queue-persist **57/0**.

### ZASTANE CZERWONE — potwierdzone na świeżym `origin/main`, nie moje

- `ai-praca-split-parity-test` **21/1** — identyczne 21/1 w `/tmp/op5-main` na
  `origin/main` `755e5141`, ten sam test 6 („Kontrakt 10 % ulepszeń → 90 % budynków",
  linia `FAIL: gracz i AI czytają udział ulepszeń jako dopełnienie jedynego podziału`).
  **Nie pogorszone. Nie naprawiam** — dispatch wprost tego zabrania.
- `pre-battle-save-test` — **nie startuje** (esbuild: `No loader is configured for ".svg"`).
  Sprawdziłem na `origin/main`: **ten sam błąd, ta sama liczba komunikatów**. Zastana
  bramka-przeszkoda, opisana już w nagłówku `fort-nodes-save-load-test.cjs`. Nie moja
  regresja i nie ruszam jej w ostatniej rundzie.

---

## 5. ZERO ZMIAN DOTYCZĄCYCH Z-1 I FC-1 — potwierdzenie

Dispatch: „Zero nowych zmian dotyczących Z-1 i FC-1". Potwierdzam mechanicznie na diffie
`fd24330b..HEAD`:

- **Z-1** (`DEFAULT_ULEPSZENIA_ONLY_WORKED`, `hexAllowsKey`, liczniki FAZY 0 na
  `radiusHexes`): `gra/src/game/cities.ts` i `gra/src/game/auto-improvements.ts` **nie są
  w diffie w ogóle** — zero zmian, także w bramce (asercje Z2e–Z2h nietknięte).
- **FC-1** (ręczny przycisk „buduj"): `applyBuildRequest` i `assertPlayerTerritoryForBuild`
  **nie są w diffie**; `gra/src/map/improvement-build.ts` nietknięty.

Obie sprawy czekają na decyzję właściciela. Nie rozstrzygałem ich i nie próbowałem
„przy okazji" domknąć.

---

## 6. GRANICE §9

Zero `npm run build`, zero `npm run dev`, zero `npx`, zero `git add -A` (commit po
konkretnych ścieżkach), zero pushu do `main`, zero zmian w `dyspozycje/WERSJE.md`,
zero zmian w `gra/data/**`. Build wyłącznie dozwoloną komendą z `--outDir /tmp/civ-dist-ai-r5-op`.
`git diff --check` — czysto. Filtr **odwrotny** allowlisty (wszystko, co NIE pasuje do
trzech wzorców dispatchu r5) — **pusty**.

`gra/node_modules` w worktree to **symlink** do `/home/user/The-Game/gra/node_modules`
(worktree nie dostaje zainstalowanych zależności); nie jest śledzony przez Git i nie
występuje w `git status`.

---

## 7. BRAK DOWODU (§13a) — jawnie

1. **Nie zmierzyłem zachowania Zasady 3 w prawdziwej rozgrywce w przeglądarce.** Dowody
   PRZED/PO wykonują prawdziwy kod `main.ts` wycięty z pliku, ale poza pętlą tury gry —
   nie są przebiegiem rozgrywki. Zielona bramka nie jest dowodem zachowania w grze.
2. **Nie zmierzyłem realnego save/load w przeglądarce** (localStorage/IndexedDB, pełny
   `SaveGame`). Round-trip jest wykonany na prawdziwych fragmentach zapisu i odczytu
   plus `JSON.parse(JSON.stringify(...))`, ale nie przez UI zapisu gry.
3. **Nie zmierzyłem, jak często AI CYWILIZACJI faktycznie wpada w stan nadwyżki**
   w normalnej partii — czyli jak często ta naprawa w ogóle się aktywuje.
4. **Przenoszę bez zmian braki dowodu z rundy 4**: skutek strategiczny Zasady 2 dla siły
   AI CYWILIZACJI w dłuższej grze; Z-6 (pusta kolejka produkcji → `pracaImperialPoolGain`
   oddaje całość do puli mimo `procentBudynki = 100`, więc Zasada 3 jest tam bezskuteczna)
   — potwierdzone w kodzie przez Final Control rundy 4, ale nie zmierzone w rozgrywce.
5. **Roster miast-państw w dowodzie FC-2 jest syntetyczny** (deterministyczny generator
   z ziarna), nie pochodzi z `applyClusterStartPlan` prawdziwej mapy. Testuje warunek
   `opts.defensiveCopy`, a nie to, którzy ownerzy dostają `defensiveCopy` w realnej grze —
   tę ścieżkę (`main.ts:27623`, `typCityCopyOwners.has(ownerId)`) prześledził Final Control
   rundy 4 i ja jej nie zmieniałem.

---

## 8. UWAGA DLA INTEGRATORA (przenoszę z rundy 4, nadal aktualna)

Merge tej gałęzi wnosi do `main` **całą, nigdy nie zintegrowaną rundę 3** (`83f3e766`)
oraz rundę 4. To musi być świadoma decyzja integratora, nie skutek uboczny.
Gałąź R5 jest zbudowana na `origin/…-R4` @ `fd24330b`; `origin/main` stoi na `755e5141`
(dispatch r5) i **nie był scalany do tej gałęzi** — scalenie zostawiam integratorowi.

---

```
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-AI-WYRAB-PRZY-RZECE-FARMY-Q1 (Operator, runda 5/5 — OSTATNIA)
GOAL: AI CYWILIZACJI i AI GRACZA (profil „zrównoważone") budują domyślnie samą żywność;
      niedobór surowca otwiera resztę listy na czas jego trwania; budowa poza złożami tylko
      na heksach obrabianych przez obywateli; nadwyżka → AI CYWILIZACJI przesuwa środki na
      budynki, AI GRACZA wyłącznie sygnalizuje; R4-Q2=C — przełącznik „wolno wycinać las"
      dla automatu GRACZA. W TEJ RUNDZIE: domknięcie dwóch blokad rundy 4 — Z-3 (persist
      znacznika Zasady 3) i FC-2 (wykluczenie miast-państw z Zasady 3).
ZMIANY/COMMIT: gałąź `autobot/R-AI-WYRAB-PRZY-RZECE-FARMY-Q1-R5`, baza `fd24330b`.
      Zmienione: `gra/src/main.ts` (3 miejsca: zapis w `buildSaveGameSnapshot`, odczyt
      w `restoreGameFromSave`, `clear()` w `applyClusterStartPlan` — naprawa Z-3;
      strażnik `if (!opts.defensiveCopy)` na bloku Zasady 3 — naprawa FC-2),
      `gra/tools/ai4-popyt-obywatele-test.cjs` (+2 asercje Z3l/Z3m),
      `gra/tools/ai4-mutacje.cjs` (+3 mutacje M16/M17/M18).
      Nowe: `gra/tools/ai5-zasada3-harness.cjs` (wspólny harness ekstrakcji+wykonania
      prawdziwego kodu main.ts), `gra/tools/ai5-z3-fc2-probe.cjs` (sonda PRZED/PO).
      Artefakty runu: `00-dispatch-r5.md` (kopia z `main`), `07-operator-r5.md`,
      `op5-przed-po.txt`, `op5-mutacje.txt`, `op5-bramka-ai4.txt`.
      Filtr ODWROTNY allowlisty: PUSTY. Zero zmian w `gra/data/**`,
      `gra/src/map/improvement-build.ts`, `gra/src/game/cities.ts`,
      `gra/src/game/auto-improvements.ts`, `dyspozycje/WERSJE.md`.
      `git diff --check`: czysto. Praca JEST w commitach, worktree czysty.
TESTY: pięć bramek referencyjnych własną ręką z `gra/`, w `timeout`: logic 213/213,
      tech-tree 19/0, research 33/33, unit-replace 13/13, combat 6/6. `tsc --noEmit`
      0 błędów. Build `--outDir /tmp/civ-dist-ai-r5-op --emptyOutDir` OK (21,53 s).
      Bramki tematu: `ai4-popyt-obywatele-test` 50/0 (48 → 50, +Z3l +Z3m, zero utraconych),
      `ai2-heks-po-heksie-test` 35/0. Mutacje `ai4-mutacje` 18 dowodów / 0 podejrzanych
      (15 → 18: M16 zapis, M17 odczyt, M18 wykluczenie PM — każda czerwieni swoją asercję).
      Bez pogorszenia: auto-improvements 45/0, ai-improvements 52/0, map-improvement-qualify
      117/0, farma-nie-w-lesie 136/0, oboz-lowiecki-las 91/0, ulepszenia-praca-percent 28/0,
      ai-slider 38/0. Save/load (bo dotknąłem snapshotu i restore): fort-nodes-save-load 18/0,
      okolica-load-reconcile 23/23, save-load-sort 4/4, map-snapshot-load 58/0, autosave-
      quota-fail 20/0, march-attack-queue-persist 57/0.
      DOWODY PRZED/PO na prawdziwym kodzie main.ts (metoda `fort-nodes-save-load-test.cjs`:
      wytnij tekst + wykonaj przez `new Function`): Z-3 — procentBudynki 100→100, pula
      imperium 0 % (PRZED) vs 100→70, pula imperium 30 % (PO); FC-2 — miasta-państwa
      przekierowane 11/11 (PRZED) vs 0/11 (PO) na 3 ziarnach, przy AI CYWILIZACJI 13/13
      w obu kolumnach.
      ZASTANE CZERWONE, potwierdzone na ŚWIEŻYM `origin/main` (`755e5141`) w osobnym
      worktree `/tmp/op5-main`: `ai-praca-split-parity-test` 21/1 — identyczne, ten sam
      test, NIE pogorszone, NIE naprawiane (zakaz z dispatchu); `pre-battle-save-test` —
      nie startuje (esbuild „No loader is configured for .svg"), identycznie na `origin/main`,
      zastana bramka-przeszkoda.
BLOKADY: brak blokad wykonawczych. Do rozstrzygnięcia przez właściciela, NIE przeze mnie
      (dispatch zabronił): Z-1 (`onlyWorked=true` dotyka wszystkich czterech profili automatu
      GRACZA) i FC-1 (ręczny przycisk „buduj" gracza poza Zasadą 2). Zero zmian w kodzie
      ich dotyczącym w tej rundzie — potwierdzone na diffie w §5.
      DO OCENY EVALUATORA (§14, zgłaszam sam): jedna linia poza literą dispatchu —
      `aiSurplusRedirectedOwners.clear()` w `applyClusterStartPlan` (nowa gra). Konsekwencja
      uczynienia znacznika trwałym; do usunięcia bez wpływu na resztę naprawy, jeśli
      Evaluator uzna to za poszerzenie zakresu.
      BRAK DOWODU (§13a), pięć pozycji — pełna lista w §7 raportu: (1) brak pomiaru Zasady 3
      w rozgrywce w przeglądarce; (2) brak realnego save/load przez UI; (3) nie wiadomo, jak
      często AI CYWILIZACJI wpada w nadwyżkę w normalnej partii; (4) przeniesione braki
      dowodu rundy 4 (skutek strategiczny Zasady 2, Z-6 pusta kolejka produkcji);
      (5) roster miast-państw w dowodzie FC-2 jest syntetyczny — testuje warunek
      `opts.defensiveCopy`, nie to, kto dostaje `defensiveCopy` na prawdziwej mapie.
      ZASTANE, przenoszę: merge tej gałęzi wnosi do `main` całą, nigdy nie zintegrowaną
      rundę 3 (`83f3e766`) oraz rundę 4 — świadoma decyzja integratora.
RUNDY: 5/5 — TO JEST OSTATNIA RUNDA. Kolejnej nie ma. Jeśli Evaluator lub Final Control
      znajdą blokadę, temat NIE zamyka się bez decyzji właściciela co do całości
      (LIMIT-5-EXCEEDED / DECISION_REQUIRED), a nie przez rundę 6.
NASTĘPNY KROK: Evaluator (Opus 5, effort high) — weryfikacja obu napraw, dwóch nowych
      asercji i trzech nowych mutacji własną ręką; następnie Final Control; następnie
      integracja orkiestratora. Niezależnie od tego: Z-1 i FC-1 czekają na odpowiedzi
      właściciela (ABC-A, ABC-B) i bez nich temat nie zamyka się w całości.
DEPLOY/PUSH: push WYŁĄCZNIE gałęzi tematu
      (`git push origin HEAD:autobot/R-AI-WYRAB-PRZY-RZECE-FARMY-Q1-R5`). Zero pushu do
      `main`, zero integracji, zero deployu.
```
