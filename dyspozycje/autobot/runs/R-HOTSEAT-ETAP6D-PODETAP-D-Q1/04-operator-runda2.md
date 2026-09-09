STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-HOTSEAT-ETAP6D-PODETAP-D-Q1
GOAL: Migracja duplikatu tick dyplomacji wewnątrz `runWorldEndTurn` (Blok A + Blok B) na
isMe()/ME(), ostatni podetap Etapu 6d (dyplomacja, hot-seat). RUNDA 2: naprawa ZARZUTU 1
Evaluatora rundy 1 (żywa bramka Chromium jednoosobowa nie może odróżnić ME() od literału 0).

ZMIANY/COMMIT: WYŁĄCZNIE nowy plik `gra/tools/hotseat-etap6d-podetap-d-exec-test.cjs`
(wzorem `hotseat-etap6d-podetap-b-exec-test.cjs` i `hotseat-etap6d-podetap-e-exec-test.cjs`).
`gra/src/main.ts` NIEZMIENIONY w tej rundzie (allowlista tej rundy: `NIE zmieniaj main.ts`).
Commit `4ccd73c5` na gałęzi `autobot/R-HOTSEAT-ETAP6D-PODETAP-D-Q1` (worktree
`/home/user/wt-6d-PODETAP-D`), rodzic `70db5adf`.

METODA: Blok A/B to inline'owane `if(...){...}` wewnątrz `runWorldEndTurn`, BEZ własnej
sygnatury `function NAME(` — ekstraktor funkcyjny z podetapów B/E nie pasuje. Nowy ekstraktor:
unikalna kotwica tekstowa (potwierdzona `grep -n` jako występująca DOKŁADNIE raz w main.ts) +
brace-matching od pierwszego `{` po kotwicy — ten sam mechanizm brace-matchingu, inny punkt
startu. Niezależna kontrola granic: substring po znanych liniach 31238-31293 / 31850-31948
(świeży `grep -n` tej rundy, granice NIEPRZESUNIĘTE względem rundy 1) porównany bajt-w-bajt z
wycięciem kotwica+brace-matching — zero rozjazdu. `esbuild.transformSync` (loader 'ts', tylko
zdjęcie typów) → `new Function(...)` zamykająca realne ciało nad mockami-spy (dane, ŻADNEJ
reimplementacji logiki dowodzonej).

DOWÓD NIETAUTOLOGICZNOŚCI (żądanie dispatchu): `ME()` mock = **7** (nie 0) w każdym
uruchomieniu. Zweryfikowano REALNYM wykonaniem: Blok A — 13/13 miejsc ME() faktycznie
przekazuje 7 do getDiploRelation/dealInvolvesOwners/hasActiveResourceTradeDealForPair/
isPeaceLockedBetween/hasTreaty/chargeWarDeclarationCredibility/breakTreatiesOnWar/
applyAllianceObligationsOnWar/applyDiploEventTracked/setDiploRelation/
pruneTributeNegotiationsBetween/recordWarDeclarationEvent (12 spy + 1 filtr
diplomaticallyDiscoveredOwners potwierdzony osobno: klaster ograniczony do odkrytego
csA=101, nieodkryty csB=102 pominięty). Blok B — 21/21 miejsc ME() faktycznie przekazuje 7
(getDiploRelation, sumArmyMForOwner, humanStub.ownerId, dealInvolvesOwners,
resolvePokojTrustTier, civKeyForOwner→sameCultureCircle, ownerReligionForOwnerId,
ownersShareLandBorderLive, getWiarygodnosc, hasActiveResourceTradeDealForPair×2, hasTreaty,
isPeaceLockedBetween, relacjeDip.partnerId=String(ME()), setDiploRelation×2, cities.filter×2 —
pokryte pośrednio przez wynik relacjeDip). Mutacja ME()->0 NA WYCIĘTYM TEKŚCIE czerwieni OBA
bloki niezależnie (osobne bloki testowe, osobne asercje).

DODATKOWO (żądanie dispatchu §c, analogicznie do Final Control w innych podetapach): jedno
ręczne cofnięcie `ME()`→`0` NA DYSKU main.ts (osobno dla Bloku A: `getDiploRelation(csOwnerId,
ME())`→`(csOwnerId, 0)`; osobno dla Bloku B: `getDiploRelation(ME(), ownerId)`→`(0, ownerId)`,
needle z 16-spacjowym wcięciem — odróżnia od strukturalnie identycznej linii main.ts:20391 w
innej funkcji), świeże wczytanie pliku, świeże wycięcie TYM SAMYM ekstraktorem, potwierdzone
INNE wykonanie (0 zamiast 7 w getDiploRelation) niż na oryginale — dowód, że migracja 0→ME()
ma faktyczny, wykrywalny efekt, nie tylko grep. main.ts przywrócony bajt w bajt po każdej
mutacji (md5sum identyczny przed/po, `git diff` wobec `70db5adf` pusty po zakończeniu skryptu).

INCYDENT PODCZAS BUDOWY BRAMKI (uczciwie odnotowany): dwie wcześniejsze iteracje skryptu (przed
domknięciem brakujących wolnych zmiennych `potAI`/`setDiploRelation` dla Bloku B) rzuciły
wyjątek i zakończyły proces PRZED sekcją przywracającą main.ts — jedna z nich (używająca
niedopracowanego, nie-zakotwiczonego needle'a) zostawiła main.ts z jednym przypadkowym,
niezamierzonym literałem w NIEZWIĄZANEJ funkcji (main.ts:20232, poza Blokiem A/B, poza
zakresem tego podetapu). Wykryte przez `git diff 70db5adf -- gra/src/main.ts` PRZED commitem,
naprawione `git checkout 70db5adf -- gra/src/main.ts` (przywrócenie do znanego dobrego stanu),
potwierdzone md5sum identyczny z `70db5adf`. Finalny, czysty przebieg bramki (needle
jednoznaczny, zero wyjątków) potwierdza restore bajt-w-bajt automatycznie. main.ts w commicie
`4ccd73c5` jest bajt-w-bajt identyczny z `70db5adf` (`git diff --stat` puste).

TESTY:
- Nowa bramka `hotseat-etap6d-podetap-d-exec-test.cjs`: **41 PASS, 0 FAIL** (uruchomiona z
  `gra/`, świeży proces, bez leftoverów).
- `npx tsc --noEmit`: 0 błędów.
- 5 bramek referencyjnych: logic-test 213/213, tech-tree-test 19/19, research-test 33/33,
  unit-replace-test 13/13, combat-test 6/6.
- `git diff --stat 70db5adf` (po commicie): wyłącznie nowy plik
  `gra/tools/hotseat-etap6d-podetap-d-exec-test.cjs`, `main.ts` puste (0 zmian).
- Żywa bramka Chromium `forced-war-player-no-contact-live-test.cjs` NIE uruchomiona ponownie w
  tej rundzie (build+Chromium >120s, main.ts nietknięty od rundy 1, gdzie ta bramka dała 14/14
  — patrz Obrona rundy 1 / Evaluator rundy 1) — brak potrzeby ponownej weryfikacji, bo zerowa
  zmiana w main.ts od tamtego pomiaru.

BLOKADY: brak nowych. Docstring bramki Chromium
`hotseat-etap6d-podetap-d-worldendturn-live-test.cjs` (rundy 1, sprostowany w commicie
`70db5adf`) pozostaje uczciwie opisany jako niezdolny odróżnić ME() od 0 w scenariuszu
jednoosobowym — ten stan NIE jest już problemem tego tematu: nowy `exec-test.cjs` dostarcza
brakujący dowód mutacyjny (realne wykonanie, ME()=7≠0) tam, gdzie żywa bramka Chromium z
definicji nie może.

RUNDY: 2/5
NASTĘPNY KROK: Evaluator ocenia nowy dowód (`hotseat-etap6d-podetap-d-exec-test.cjs`, 41/41,
metoda kotwica+brace-matching, mutacja na wyciętym tekście I na main.ts na dysku) jako naprawę
ZARZUTU 1; przy PASS → Final Control → integracja orkiestratora (ostatni podetap Etapu 6d).
DEPLOY/PUSH: NIE WYKONANO
