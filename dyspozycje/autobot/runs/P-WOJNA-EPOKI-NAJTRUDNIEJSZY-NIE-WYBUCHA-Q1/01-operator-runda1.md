# P-WOJNA-EPOKI-NAJTRUDNIEJSZY-NIE-WYBUCHA-Q1 — Operator, runda 1/5

MODEL+EFFORT: Sonnet 5, effort medium · DATA: 2026-09-08 · worktree `/home/user/wt-wojna-epoki-hard`,
gałąź `autobot/P-WOJNA-EPOKI-NAJTRUDNIEJSZY-NIE-WYBUCHA-Q1`, baza `9acc5037` (dispatch, po
fast-forward z `f82aa354`), drzewo czyste przed zmianami.

STATUS: PASS
DOMAIN: GAME
TEMAT: P-WOJNA-EPOKI-NAJTRUDNIEJSZY-NIE-WYBUCHA-Q1
GOAL: wymuszona wojna epoki (Kamień/Brąz/Żelazo) wybucha niezależnie od tego, czy strony
formalnie "poznały" się dyplomatycznie.

## WERDYKT — hipoteza właściciela POTWIERDZONA źródłowo i żywym dowodem

Główny trop (blokada przez brak "poznania"/kontaktu) jest **trafny**, ale jest **pośrednim**
skutkiem ogólnej reguły D3-Q2 ("brak odkrycia w mgle → brak dyplomacji AI/UI"), nie efektem
warunku wprost w `forced-war-*.ts`/`assignForcedWarPairings` (te pliki — zgodnie z
powierzchowną weryfikacją orkiestratora w dispatchu — rzeczywiście nie zawierają
"poznan"/"kontakt"/"hasMet"). Dokładne miejsce blokady:

- `assignForcedWarPairings` (forced-war-common.ts) i `decideAIDiplomacy` (ai.ts) **poprawnie**
  wybierają gracza jako cel i generują komendę `wypowiedz_wojne` — potwierdzone jednostkowo
  (patrz TESTY, dowód 1).
- W `main.ts` (`ownerLoop`) ta komenda, ponieważ target=gracz, trafia do grupy
  `dipCmdsPlayerFacing` (`partitionDiplomacyCommandsForPlayerFog`, diplomacy-layers.ts,
  wprowadzone wcześniej przez `P-WOJNA-WYMUSZONA-TRZY-NAPRAWY-Q1` dla AI↔AI, ale **świadomie
  nieobjęte** dla DOW-na-gracza — komentarz źródłowy tamtego tematu: "Komendy DOTYCZĄCE gracza
  (target===0) idą jak dotychczas przez `dipLayer` z pełną bramką D3-Q2 — bez zmian").
- `dipCmdsPlayerFacing` jest filtrowane `dipLayer` = `diplomacyLayerForOwner(ownerId,
  simplifiedOwners, foreignTypeOwners, contactedOwners)`. Gdy `contactedOwners`
  (`diplomaticallyDiscoveredOwners`) nie zawiera ownerId AI (gracz jej "nie poznał"),
  `dipLayer==='pre_contact'` i `filterDiplomacyCommandsForLayer` **kasuje komendę
  CAŁKOWICIE** — łącznie z wymuszoną wojną epoki.
- Istniejący hak testowy `forceBronzeForcedWarOnPlayer()`/`forceIronForcedWarOnPlayer()`
  (main.ts, z poprzednich tematów) **musiał** jawnie wołać
  `diplomaticallyDiscoveredOwners.add(attackerId)`, z komentarzem wprost: "bez tego...
  D3-Q2 słusznie zablokowałaby komendę DOW... **to jest ZAMIERZONE, nie obejście**" — czyli
  ten dokładny mechanizm był znany i uznany za intencjonalny, zanim właściciel zgłosił go
  teraz jako "wytrych"/exploit tego tematu.

To **nie jest** difficulty-gated wprost (żaden z powyższych warunków nie czyta poziomu
trudności) — ujawnia się częściej/silniej na hard prawdopodobnie pośrednio, bo silniejsza AI
ekspanduje dalej/szybciej wchodzi w epoki wymuszające wojnę, zanim gracz zdąży "odkryć"
sąsiadów przez zwykłą eksplorację — ale sam mechanizm blokady jest **uniwersalny**.

## NAPRAWA (podejście (b) z dispatchu — eligibility/gating nie powinien wymagać poznania)

Zakres **minimalny**, wyłącznie `gra/src/main.ts`, dokładnie w miejscu gatingu (`ownerLoop`,
tam gdzie budowane jest `dipCmdsLayered`):

- Nowa klasyfikacja `isForcedEpochWarDeclareCmd` (lokalna funkcja w main.ts) rozpoznaje komendę
  `wypowiedz_wojne` wymuszonej wojny epoki po `powod` — stałym, publicznym kontrakcie już
  ustawianym przez `decideAIDiplomacy` (ai.ts, **nietknięte**, poza allowlistą) wyłącznie w
  gałęziach Kamień/Brąz/Żelazo: `R-EPOKA-(BRAZU|KAMIEN|ZELAZO)-WYMUSZONA-WOJNA:`.
- `dipCmdsPlayerFacing` dzielone na `...Forced` i `...Normal`. `...Forced` filtrowane
  `dipLayerIgnoringPlayerFog` (już istniejący, nietknięty 2-arg. overload
  `diplomacyLayerForOwner`, dokładnie ten sam używany dla AI↔AI) zamiast `dipLayer` —
  omija `pre_contact`. `...Normal` (każde inne, w tym zwykłe niewymuszone DOW na gracza)
  zostaje przez `dipLayer` jak dotychczas — D3-Q2 dla nich **bez zmian**.
- `ai.ts`, `diplomacy-layers.ts`, `forced-war-*.ts`, `ai-difficulty-bonus.ts` — **nietknięte**
  (diagnoza wskazała main.ts jako jedyne właściwe miejsce; ai-difficulty-bonus.ts nie ma
  związku z tym defektem, więc allowlista warunkowa na ten plik nie została użyta).
- Dodatkowo (main.ts, `__eraTestDebug`, wyłącznie testowe): nowy hak
  `forceBronzeForcedWarOnPlayerNoContact()` + getter `isDiplomaticallyDiscovered()` —
  potrzebne, bo istniejący hak (`forceBronzeForcedWarOnPlayer`) celowo inscenizuje WYŁĄCZNIE
  scenariusz "gracz już poznał AI" (kolokacja miast); nowy hak inscenizuje dokładnie
  przeciwny, zgłoszony przez właściciela scenariusz, bez reimplementacji mechanizmu wyboru
  celu (wyklucza inne AI z puli zamiast zgadywać dystans).

## TESTY

- `npx tsc --noEmit` (node_modules 5.9.3): **0 błędów** — zarówno na finalnym stanie, jak i
  podczas kontrolowanego cofnięcia naprawy do testu PRZED (patrz niżej).
- 5 bramek referencyjnych (§6 R-PROC-AUTOBOT.md): `logic-test.cjs` 213/213,
  `tech-tree-test.cjs` 19/19, `research-test.cjs` 33/33, `unit-replace-test.cjs` 13/13,
  `combat-test.cjs` 6/6 — wszystkie zielone.
- Istniejące testy wymuszonej wojny — **wszystkie zielone, bez zmian**: `forced-war-bronze-test`
  56/56, `forced-war-stone-test` 38/38, `forced-war-iron-test` 55/55,
  `forced-war-trojstronna-test` 23/23, `*-main-guard-test` (bronze/stone/iron/trojstronna)
  wszystkie zielone, `forced-war-reguly-multi-turn-simulation-test` 39/39,
  `p-wojna-wymuszona-trzy-naprawy-test` 13/13 (D3-Q2 dla AI↔AI i normalnych DOW na gracza
  bez regresji), `diplomacy-layers-test` 22/22, `ai-war-gate-test` 24/24,
  `diplomacy-war-gates-test` 19/19.
- **Dowód 1 (jednostkowy, deterministyczny, REALNE funkcje silnika, ZERO reimplementacji)** —
  NOWA bramka `gra/tools/forced-war-player-pre-contact-gate-test.cjs` (45/45 pass), ten sam
  wzorzec co `p-wojna-wymuszona-trzy-naprawy-test.cjs`: dla każdej z trzech epok woła REALNE
  `decideAIDiplomacy`/`partitionDiplomacyCommandsForPlayerFog`/`filterDiplomacyCommandsForLayer`/
  `diplomacyLayerForOwner` i dowodzi **PRZED/PO na poziomie logiki**: PRZED (symulacja starego
  routingu: całe `playerFacing` przez `dipLayer`) komenda wymuszonej wojny na gracza jest
  kasowana CAŁKOWICIE pod `pre_contact`; PO (nowa klasyfikacja + `dipLayerIgnoringPlayerFog`)
  ta sama komenda przechodzi. Regresja: normalne (niewymuszone) DOW na gracza nadal kasowane
  pod `pre_contact` — bez zmian.
- **Dowód 2 (żywy, headless Chromium/Playwright, realny `vite build`, realny `endTurn()`)** —
  NOWA bramka `gra/tools/forced-war-player-no-contact-live-test.cjs` (13/13 pass): fast-forward
  do tury 24, nowy hak `forceBronzeForcedWarOnPlayerNoContact()` (gracz **nie** "poznał"
  attackera — zweryfikowane wprost `isDiplomaticallyDiscovered(attackerId)===false` PRZED
  turą), realny `endTurn()` → relacja attacker↔gracz faktycznie zmienia się na `'wojna'`,
  wpis w `warEventLog`, zero console error.
- **PRZED/PO na żywym silniku (kontrolowane, nie zostawione w kodzie):** main.ts tymczasowo
  cofnięty do stanu SPRZED tej naprawy (tylko blok gatingu, haki testowe zostawione), ten sam
  test `forced-war-player-no-contact-live-test.cjs` uruchomiony ponownie — **UWAGA**: w tym
  konkretnym sandboksie `?playtest=mapa` (mała mapa, jeden AI) `refreshFog`/
  `updateDiplomaticDiscovery` odświeża widoczność wielokrotnie w trakcie `endTurn()` z przyczyn
  niezwiązanych z tym tematem, więc gracz "odkrywa" attackera na nowo w trakcie tej samej tury
  niezależnie od stanu naprawy — żywy test PRZED/PO okazał się **niedeterministyczny** dla tego
  mechanizmu (obie wersje kodu dawały PASS). Dlatego wiążący, deterministyczny dowód PRZED/PO
  to Dowód 1 (jednostkowy) — udokumentowane wprost w nagłówku obu nowych plików testowych,
  zgodnie z C-058 (nie ukrywam luki, zapisuję ją z datą i przyczyną). Po weryfikacji main.ts
  przywrócony do stanu PO naprawie (identyczny z commitowanym), Dowód 2 uruchomiony ponownie
  na finalnym stanie: 13/13.
- `git diff --check`: czysty.

## BLOKADY

Brak. Drugorzędny, POZA zakresem allowlisty tego dispatchu: mechanizm `clusterForceWarTargetId`
(`AI-CS-CLUSTER-DIFF`, main.ts, wymuszona wojna z miastem-państwem klastra) ma **strukturalnie
ten sam** defekt (ta sama ścieżka `dipCmdsPlayerFacing`/`dipLayer`), ale nie jest objęty
dispatchem (poza listą plików Kamień/Brąz/Żelazo) i nie został naprawiony — do zgłoszenia jako
osobny temat, jeśli właściciel potwierdzi że dotyczy też jego rozgrywki.

## ZMIANY/COMMIT

Allowlista, wyłącznie:
- `gra/src/main.ts` — blok gatingu `ownerLoop` (nowa klasyfikacja `isForcedEpochWarDeclareCmd`
  + rozdział `dipCmdsPlayerFacingForcedWar`/`...Normal`, ok. main.ts:32175-32214 po zmianie);
  nowy testowy hak `forceBronzeForcedWarOnPlayerNoContact()` + `isDiplomaticallyDiscovered()`
  w `__eraTestDebug` (ok. main.ts:21980-22012). **Nie dotyka** `ai-difficulty-bonus.ts` (brak
  powiązania z tym defektem) — więc żadnej kolizji z równolegle prowadzonym
  `P-MIASTA-ZBYT-BLISKO-SIEBIE-Q1` (który MOŻE dotykać tego pliku) nie ma.
- `gra/tools/forced-war-player-pre-contact-gate-test.cjs` (nowa bramka, jednostkowa)
- `gra/tools/forced-war-player-no-contact-live-test.cjs` (nowa bramka, żywa E2E)
- Ten raport.

Commit (worktree, gałąź tematu, **NIE main**, **NIE push**): `dec075a9`

Zakaz `git add -A` przestrzegany — dodane jawnie trzy pliki + raport, po `git status --short`
przed commitem.

## ANEKS (po Zarzucie 1 Evaluatora, w tej samej rundzie) — domknięcie efektu ubocznego (b)

Evaluator (raport `02-evaluator-runda1.md`, Zarzut 1) trafnie wskazał, że pierwotna naprawa
(sama zmiana routingu komendy) nie ustanawiała kontaktu/odkrycia strony atakującej mimo
realnego wybuchu wojny — skutek: panel dyplomacji nadal liczył `pre_contact` dla ownera mimo
`relacja==='wojna'`. Zaakceptowane w całości (patrz `03-obrona-runda1.md`, Zarzut 1:
PRZYJMUJE) i naprawione w tej samej rundzie, w tym samym pliku z allowlisty:

- `gra/src/main.ts`, blok wykonania `wypowiedz_wojne` (~linia 32322, bezpośrednio przed
  `recordWarDeclarationEvent`): przy skutecznym wypowiedzeniu komendy sklasyfikowanej jako
  wymuszona wojna epoki (`isForcedEpochWarDeclareCmd(cmd)`, ta sama klasyfikacja co przy
  gatingu) na gracza (`targetId === 0`), dodano `diplomaticallyDiscoveredOwners.add(ownerId)`
  i `diplomaticContactEstablished.add(ownerId)` — realizuje dokładnie opcję (a) z dispatchu
  ("tak jak realnie wypowiedzenie wojny ujawnia przeciwnika"), ale WYŁĄCZNIE dla komend z tym
  markerem `powod` — zwykłe (niewymuszone) DOW AI na gracza nietknięte, nie ujawniają
  automatycznie napastnika (D3-Q2 bez zmian dla nich).
- Zakres pozostaje w allowlisty (`gra/src/main.ts`, WYŁĄCZNIE miejsce gatingu/egzekucji tych
  mechanizmów) — nie dotyka `ai.ts`, `diplomacy-layers.ts`, `forced-war-*.ts`.

TESTY po aneksie: `tsc --noEmit` 0 błędów (ponownie); wszystkie 5 bramek referencyjnych i
wszystkie 18 istniejących bramek forced-war/dyplomacji ponownie zielone, identyczne liczby
(213/19/33/13/6; bronze 56/56, stone 38/38, iron 55/55, trojstronna 23/23, main-guard ×4
28+19+37+14, reguly-multi-turn-simulation 39/39, p-wojna-wymuszona-trzy-naprawy 13/13,
diplomacy-layers 22/22, ai-war-gate 24/24, diplomacy-war-gates 19/19) — zero regresji od
aneksu. Nowa bramka jednostkowa `forced-war-player-pre-contact-gate-test.cjs` ponownie 45/45
(nie testuje wprost stanu `diplomaticallyDiscoveredOwners`, więc rozszerzona żywa bramka
niżej jest wiążącym dowodem). Żywe bramki uruchomione ponownie po aneksie:
`forced-war-player-no-contact-live-test.cjs` rozszerzona o nową asercję D2
(`isDiplomaticallyDiscovered(attackerId)===true` PO turze) — **14/14 pass**;
`forced-war-player-target-live-test.cjs` (nietknięty, regresja) — **12/12 pass**, bez zmian.
Pełny log w `03-obrona-runda1.md` (Zarzut 1).

Nienaprawione świadomie w tej rundzie (uznane za osobny, mniejszy problem, nie blokujący
GOAL): kształt karty w `warEventLog` (`kind:'info'` generyczna zamiast dedykowanej
`kind:'enemy'` w scenariuszu bez kolokacji) — przyczyna leży w kolejce
`deferredEotHints`/`deferredHintsToSidePanelEvents` (odrębny mechanizm od
`diplomaticallyDiscoveredOwners`, dotyczy WSZYSTKICH zdarzeń wywołanych w fazie AI, nie tylko
wymuszonej wojny epoki na gracza) — zmiana tam wykraczałaby poza zakres minimalny i mogłaby
dotknąć innych typów zdarzeń EOT poza allowlistą tego dispatchu. Odnotowane jako
BLOKADA/ryzyko poniżej, nie ukryte.

## BLOKADY (zaktualizowane po aneksie)

Brak blokad technicznych do naprawy Zarzutu 1 (dyskusja panelu/dyskoveries). Pozostają, bez
zmian: mechanizm `clusterForceWarTargetId` ma strukturalnie ten sam defekt braku odkrycia,
poza allowlistą tego dispatchu — do osobnego zgłoszenia. Dodatkowo, świadomie NIE naprawione
w tej rundzie: degradacja karty `warEventLog` (`kind:'info'` zamiast `kind:'enemy'`) w
scenariuszu bez kolokacji — patrz ANEKS wyżej; kosmetyczne, nie wpływa na GOAL (wojna faktycznie
wybucha i jest widoczna w dzienniku, tylko bez dedykowanego portretu/nazwy w tej konkretnej
karcie) — proponuję odłożyć jako ECHO/temat osobny, chyba że właściciel uzna to za blokujące.

## RUNDY: 1/5

## NASTĘPNY KROK: Evaluator (Sonnet 5 / Luna High per §5a) — niezależny diff, powtórzenie
testów, ocena czy podejście (b) + aneks discovery jest rzeczywiście "inżynieryjnie czystsze"
niż alternatywa (a) z dispatchu w kontekście istniejącego kodu i D3-Q2, oraz czy pozostawiona
świadomie degradacja karty `warEventLog` wymaga naprawy w tym samym temacie czy może być
odłożona.

## DEPLOY/PUSH: NIE WYKONANO
