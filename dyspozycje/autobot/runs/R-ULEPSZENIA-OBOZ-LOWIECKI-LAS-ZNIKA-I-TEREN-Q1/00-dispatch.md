TEMAT:  R-ULEPSZENIA-OBOZ-LOWIECKI-LAS-ZNIKA-I-TEREN-Q1
RUNDA:  1/5
DATA:   2026-09-02
DOMAIN: GAME
ŚCIEŻKA: A (Workflow), model sędziego (R-PROC-AUTOBOT.md §3c)
MODEL + EFFORT per rola: temat GRAFICZNY/WIZUALNY (R-PROC-AUTOBOT.md §5a) —
Operator Opus 5 effort=medium / Evaluator Opus 5 effort=high / Final Control
Sonnet 5 effort=high.

## WYZWALACZ
Właściciel, kilka zrzutów mapy 3D (rejon "DELFY", teren wzgórz/lasu i osobno
łąka): "AI gracza buduje masowo Obozy łowieckie [...] po wybudowaniu
czegokolwiek na wzgórzu, jeżeli jest tam las, to ten las jakby znika i ja
go przynajmniej nie widzę [...] widzę budowanie tych [...] obozów, także
na łąkach, na których nie ma lasu." Osobno, tym samym wątkiem: pytanie o
regułę "żywność tylko z obrobionego heksu" (patrz sekcja INFORMACYJNA
niżej — NIE część tego dispatchu, już odpowiedziana właścicielowi wprost
w czacie, bez zmiany kodu).

## RECON (wykonany, nie powtarzaj część A — część B WYMAGA żywej weryfikacji)

### Część A — POTWIERDZONA przyczyna: las znika wizualnie pod ulepszeniem na wzgórzu

`main.ts`, funkcja `syncImprovementDecorForHex` (~linia 11991-12014), wołana
po postawieniu ulepszenia na heksie:
```
function syncImprovementDecorForHex(hexKey: string, layers: readonly string[]): void {
  ...
  const elevated = teren === TerenBazowy.Wzgorza || teren === TerenBazowy.Gory;
  if (layers.includes('tarasy')) { hideDecorAtHex(hexKey); return; }
  const foodOnForest = hex.nakladka === Nakladka.Las
    && layers.some(k => k === 'farma' || k === 'bydlo');   // <- TYLKO te dwa klucze
  if (foodOnForest) { hideDecorAtHex(hexKey); return; }      // <- kępa lasu ukryta, ALE nakladka zostaje Las (celowe, komentarz: "Maciej 2026-07-21")
  if (elevated && keepsReliefUnderImprovement(hexKey, layers)) { return; }
  if (elevated) { hideDecorAtHex(hexKey); }                  // <- GAŁĄŹ BEZ WARUNKU LASU: każde ulepszenie na wzgórzu/górze, które NIE jest farma/bydlo i NIE zachowuje reliefu (`relief-preserving-improvements.ts`: tylko bydlo/owce/lama/kamieniolom/kopalnia*), trafia tutaj
}
```
`hideDecorAtHex` (`render/scene.ts:3170-3186`) trwale zeruje macierz instancji
modeli lasu (`forestMesh`/`forestTrunkMesh` itd.) na tym heksie — WIZUALNIE
znika kępa drzew. `hex.nakladka` W DANYCH NIE jest ruszany w tej ścieżce
(dane zostają `Las`) — to WYŁĄCZNIE efekt renderu, nie utrata lasu w
rozgrywce/ekonomii.

`obóz łowiecki` wymaga `nakladka===Las` (twardy gate,
`improvement-build.ts:586`, patrz też `FOOD_IMPROVEMENT_KEYS`/
`ULEPSZENIA_ZYWNOSCIOWE`), ale NIE jest wymieniony w `foodOnForest` (tylko
`'farma'`/`'bydlo'`) ani nie zachowuje reliefu
(`relief-preserving-improvements.ts:25`: tylko `bydlo`/`owce`/`lama`/
`kamieniolom`/`kopalnia*`). Skutek: obóz łowiecki postawiony na
`TerenBazowy.Wzgorza`/`Gory` Z lasem trafia w ostatnią gałąź (`elevated` bez
`keepsReliefUnderImprovement`) i dostaje `hideDecorAtHex` — kępa drzew
znika z widoku, mimo że w danych i w regule budowy las tam wciąż jest
(stąd obóz jest tam legalny). To DOKŁADNIE odtwarza zgłoszenie właściciela
("po wybudowaniu czegokolwiek na wzgórzu, jeżeli jest tam las, znika").

**Nie jest to zjawisko unikalne dla obozu** — każde inne ulepszenie na
lesie-na-wzgórzu poza `farma`/`bydlo` (np. `owce`/`lama`, jeśli w ogóle
budowalne na lesie) miałoby ten sam objaw — Operator ma to sprawdzić i
albo naprawić generycznie (rozszerzyć `foodOnForest` o pełną listę
ulepszeń kompatybilnych z lasem zamiast dwóch zahardkodowanych kluczy —
patrz GOAL), albo, jeśli tylko obóz łowiecki jest realnie osiągalny w tej
kombinacji terenu, ograniczyć poprawkę do niego z jawnym uzasadnieniem.

### Część B — NIEPOTWIERDZONA, wymaga żywej reprodukcji: obóz na łące bez lasu

Właściciel twierdzi (zrzut łąki z namiotami/obozowiskami), że widzi obozy
łowieckie budowane na terenie BEZ lasu. To WPROST przeczy twardemu gate'owi
w `improvement-build.ts:586` (`if (key === 'oboz_lowiecki' && hex.nakladka
!== Nakladka.Las) return null;`), którego komentarz mówi wprost, że istnieje
właśnie po to, żeby żadna ścieżka commitu (w tym auto-ulepszenia AI) nie
mogła tego obejść. Operator MUSI to zweryfikować żywo, nie zakładać z góry
ani że to prawdziwy bug, ani że to pomyłka we wskazaniu — możliwe wyjaśnienia
do sprawdzenia po kolei:
1. To NIE jest `oboz_lowiecki` tylko inny model (np. wioska/osada
   barbarzyńska, stos zasobów, namiot jednostki) mylnie zidentyfikowany na
   zrzucie — sprawdź faktyczny `ulepszenieKey`/`ulepszenia` heksu ze zrzutu
   (współrzędne/save, jeśli dostępne) albo odtwórz scenariusz i sprawdź co
   faktycznie stoi.
2. Heks WYGLĄDA jak łąka bez lasu, ale w danych ma `nakladka===Las` (rzadka
   kępa/niska gęstość modeli lasu myląca wizualnie z łąką) — sprawdź
   `hex.nakladka` bezpośrednio, nie tylko "na oko".
3. Realny bug: jakaś ścieżka commitu (np. auto-ulepszenia AI,
   `auto-improvements.ts`, albo inny caller) POMIJA
   `computeImprovementBuildImpact`/`qualifies()` i zapisuje obóz łowiecki
   bez sprawdzenia `nakladka`. Jeśli TO się potwierdzi — to jest najwyższy
   priorytet naprawy w tym temacie (twarda bramka przecieka).

## GOAL
Część A (POTWIERDZONA): rozszerz warunek w `syncImprovementDecorForHex`
tak, żeby kępa lasu NIE znikała wizualnie dla żadnego ulepszenia
kompatybilnego z lasem (w tym `oboz_lowiecki`), nie tylko dla `farma`/
`bydlo` — najwęższa poprawna zmiana to zastąpienie hardkodowanej listy
dwóch kluczy sprawdzeniem względem już istniejącego zbioru ulepszeń
żywnościowych/kompatybilnych z lasem (`ULEPSZENIA_ZYWNOSCIOWE` z
`auto-improvements.ts` albo równoważnik), PRZEFILTROWANEGO do tych, które
faktycznie mogą stać NA lesie (nie każde ulepszenie żywnościowe może —
sprawdź per klucz, nie zgaduj). Zero zmian w `hex.nakladka`/danych — to
naprawa WYŁĄCZNIE warstwy renderu.

Część B (WARUNKOWA): jeśli żywa reprodukcja POTWIERDZI, że obóz łowiecki
faktycznie ląduje na terenie bez lasu — znajdź dokładną ścieżkę commitu,
która omija gate, i napraw ją tak, żeby przechodziła przez ten sam,
istniejący hard gate co ścieżka manualna (nie duplikuj logiki, użyj
istniejącej funkcji). Jeśli reprodukcja tego NIE potwierdzi (błędna
identyfikacja modelu/inna przyczyna wizualna) — udokumentuj to jawnie w
raporcie z dowodem (np. odczyt `hex.nakladka` dla wskazanych heksów) i NIE
zmieniaj kodu commitu — kryterium 4 niżej wtedy spełnione automatycznie.

## KRYTERIA KOŃCA — binarne PRAWDA/FAŁSZ
1. Żywy zrzut PRZED (żywe Chromium, `page.screenshot()`): ulepszenie
   niebędące `farma`/`bydlo` (np. `oboz_lowiecki`) postawione na
   `Wzgorza`/`Gory` z `nakladka===Las` — kępa lasu znika z widoku mimo że
   `hex.nakladka` w danych zostaje `Las`.
2. Żywy zrzut PO: ta sama sytuacja — kępa lasu WIDOCZNA, `hex.nakladka`
   nadal `Las` (bez zmiany danych, tylko renderu).
3. Żywy dowód braku regresu: `farma`/`bydlo` na lesie na wzgórzu nadal
   poprawnie chowają kępę (zachowanie sprzed poprawki, bez zmiany);
   ulepszenia zachowujące relief (`bydlo`/`owce`/`lama`/`kamieniolom`/
   `kopalnia*`) na wzgórzu bez lasu nadal poprawnie NIE chowają dekoracji
   nie-leśnych (góra/wzgórze); `tarasy` nadal chowa dekor jak dotychczas.
4. Część B: albo (a) żywy dowód POTWIERDZAJĄCY realny bug + żywy dowód PO
   poprawce że `oboz_lowiecki` już nie da się postawić/nie pojawia się na
   terenie bez lasu — dokładnie ta sama bramka co manualna ścieżka budowy;
   albo (b) jawna nota w raporcie z dowodem (odczyt danych heksu), że
   zgłoszenie nie potwierdza się na aktualnym kodzie, z wyjaśnieniem co
   naprawdę widział właściciel.
5. Diff ograniczony do plików wskazanych w ALLOWLIŚCIE, zakres zmiany
   dokładnie tak szeroki jak wymaga potwierdzona przyczyna.
6. `tsc --noEmit` 0 błędów + wszystkie 5 bramek referencyjnych bez regresu
   + istniejące testy renderu ulepszeń/reliefu w `gra/tools/` (znajdź po
   nazwie, np. `*relief*`, `*improvement*render*`, `*forest*`) bez regresu
   + nowy/rozszerzony test dowodzący kryteriów 1-4.

## ALLOWLISTA — nic poza tym
`gra/src/main.ts` (WYŁĄCZNIE `syncImprovementDecorForHex` i, jeśli Część B
się potwierdzi, dokładnie wskazana ścieżka commitu ulepszenia — nie
dotykaj innych funkcji), `gra/src/game/auto-improvements.ts` (WYŁĄCZNIE
jeśli Część B wymaga poprawki w ścieżce auto-ulepszeń), `gra/src/game/
relief-preserving-improvements.ts` (WYŁĄCZNIE jeśli okaże się potrzebny
nowy, jawnie uzasadniony klucz), nowy/rozszerzony plik testowy w
`gra/tools/`. Zakazane bezwzględnie: `gra/data/**` (poza odczytem),
`docs/decyzje/<ID>.md`, `.git/**`, `dyspozycje/WERSJE.md`,
`gra-robocza/ROBOCZA-MANIFEST.json`, `playbook.json`.

## IZOLACJA
worktree własny, gałąź
`autobot/R-ULEPSZENIA-OBOZ-LOWIECKI-LAS-ZNIKA-I-TEREN-Q1`, baza JAWNIE
`origin/main`. Sparse-checkout bez `gra-robocza/`, `gra-kanon/`, `dist/`.

## REGUŁA PRZECIW SAMOOSZUKIWANIU
Temat wizualny/UX — zakaz uznania KTÓREGOKOLWIEK kryterium wizualnego za
spełnione bez realnego zrzutu `page.screenshot()` z żywego Chromium. Zakaz
zakładania z góry werdyktu dla Części B (ani "to na pewno bug" ani "to na
pewno pomyłka") — ustal dowodem z żywego stanu heksu (odczyt
`hex.nakladka`/`ulepszenia`), nie z samego wyglądu zrzutu. Zakaz
rozszerzania `foodOnForest` "na wszelki wypadek" o klucze, które faktycznie
nie mogą stać na lesie — sprawdź per klucz względem realnych reguł budowy
(`improvement-build.ts`), nie zgaduj z nazwy.

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

## INFORMACYJNE (poza zakresem tego dispatchu, już odpowiedziane właścicielowi)
Pytanie właściciela czy żywność z obozu łowieckiego liczy się tylko z
obrobionego heksu — potwierdzone WPROST w kodzie, BEZ zmiany: `cityYieldPerTurn`
(`economy.ts:853+`) sumuje `zywnosc` WYŁĄCZNIE z `workedTiles` (tile.tileYield
per obrobiony heks); `oboz_lowiecki` NIE jest w `TERRITORY_YIELD_IMPROVEMENTS`
(`terrain-improvements.ts:169-172`, zbiór ulepszeń dający surowiec do
magazynu NIEZALEŻNIE od workerów — komentarz linia 378: "Zwolnione:
żywnościowe + infrastruktura"). Żywność z obozu = zero, jeśli żaden obywatel
go nie obrabia — dokładnie zasada, o którą pytał właściciel. Brak akcji.
