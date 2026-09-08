STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-HOTSEAT-ETAP6D-DIPLOMACY-ENGINE-Q1
GOAL: Migracja 20 funkcji dyplomacji z tabeli §4 recon na isHuman/isMe/ME(), z pełną
weryfikacją wzorca "literał 0 jako argument" dla WSZYSTKICH 20 (recon sam sprawdził 2/19).

ZMIANY/COMMIT: `gra/src/main.ts` — 95 podmian (`git diff --stat`: 95+/95-) wewnątrz ciał
dokładnie 20 funkcji z tabeli dispatchu. Świeży grep/Read PRZED edycją potwierdził: numery
linii przesunięte względem recon (integracja 6b/6c/6f/6e-prereq od tego czasu), ale
wszystkie 20 nazw funkcji i ich hardkody `0` nadal obecne. `buildDiploTreasury` okazał się
JUŻ zmigrowany (commit `e9e6a325`, R-HOTSEAT-ETAP6B-UI-Q1, kategoria "UI/HUD" objęła go
przed integracją tego tematu) — zero zmian potrzebnych, potwierdzone zerem hardkodów.

ALIAS PER FUNKCJA (uzasadnienie z cytatem ciała dla WSZYSTKICH 9 nienazwanych wprost
w recon — reguła anty-halucynacyjna):
- isMe/ME(): `isActiveDiploOwner` (używana WYŁĄCZNIE z `buildPlayerDiploRelations`/
  `buildDiploPairSummaryData` — obie liczą "innych" względem aktywnego fotela, `id===0`
  zawsze widoczny jako wyjątek — perspektywa jednego ekranu), `buildPlayerDiploSummary`,
  `recordWarDeclarationEvent`, `setDiploRelation` (komentarz w ciele: "pary bez GRACZA
  (AI↔AI) nie zmieniają koloru ŻADNEJ obwódki" — pojedyncza tożsamość, nie zbiór),
  `playerIsAtWarWith`, `ownerDeclareWarOn`, `collectWarsWithPlayer`,
  `collectKnownWarsBetweenOthers`, `establishDiplomaticContact`/`checkNewDiplomaticContacts`
  (zasilane WYŁĄCZNIE z `getDiplomaticContacts()`=`diplomaticallyDiscoveredOwners`, struktura
  jednoosobowa dla aktywnego fotela, nie per-para), `buildDiploTreasury` (już `isMe`),
  `joinAllyToWar`, `applyAllianceObligationsOnWar` (nazwy `pendingPlayer`/
  `processPlayerQueue` w ciele — manualne potwierdzenie WYŁĄCZNIE dla aktywnego fotela),
  `runDiplomacyTurnTick` (hint-gałęzie trybutu + pętla `getDiplomaticContacts()`),
  `buildDiplomacyLockContextBase` (komentarz w ciele: "MY zawsze gracz (0) w tym
  kontekście, ONI to `ownerId`"), `openDiplomacyAudience` (deleguje render DOM do
  `ui/diplomacyAudience.ts:showDiplomacyAudience` — POZA allowlistą; samo ciało buduje
  tylko config z perspektywy gracza, zero własnego DOM).
- isHuman(): `applyDiploEventTracked`, `buildDiplomacyTickCtxForPair`,
  `getRelationBreakdown`, `resolveForcedWarDurationLimits` — wszystkie 4 nazwane wprost
  w recon, potwierdzone: liczą stan DOWOLNEJ pary (a,b), w tym AI-AI, w pętli po wszystkich
  parach/wszystkich AI.

WZORZEC "LITERAŁ 0 JAKO ARGUMENT" — sprawdzony dla WSZYSTKICH 20 (nie tylko 2 jak recon):
metoda: brace-matched ekstrakcja ciała + dwa regexy (porównania `var===0`/`!==0` na
zmiennych-ownerId; wywołania z literałem `0` jako argumentem), z ręcznym odsianiem
false-positives (`?? 0`, `Math.max(0,`, `.reduce(...,0)`, indeksy pętli). Znaleziono i
zmigrowano DODATKOWO (poza pierwotnymi liniami z tabeli recon) m.in.: 8 wywołań
literałowych w `buildPlayerDiploSummary`, cały blok `getDiploPairMeta(0,oid)`/
`getDiploRelation(0,oid)`/`setDiploRelation(0,oid,...)`/`syncRelationFromDeals(0,oid)` w
pętli `runDiplomacyTurnTick`, ~13 wywołań literałowych w `buildDiplomacyLockContextBase`,
~30 wywołań literałowych w `openDiplomacyAudience` (w tym `joinAllyToWar(0,...)` i
`.push(0)` wewnątrz `applyAllianceObligationsOnWar`). Po migracji: grep obu wzorców nad
ciałami wszystkich 20 funkcji → ZERO trafień (tylko potwierdzone false-positives
udokumentowane w historii poleceń, np. `Math.max(0, turn - ...)`).

TESTY:
- `tsc --noEmit`: 0 błędów (po dodaniu `a!`/`b!` non-null assertion w 3 miejscach, gdzie
  `isMe(a)`/`isMe(b)` zastąpiło porównanie tolerujące `number|undefined` z destrukturyzacji
  `key.split('_').map(Number)`).
- 5 bramek referencyjnych: logic-test 213/213, tech-tree-test 19/19, research-test 33/33,
  unit-replace-test 13/13, combat-test 6/6 — wszystkie zielone, zgodne z wynikiem
  referencyjnym z `R-PROC-AUTOBOT.md`.
- Nowa bramka `gra/tools/hotseat-etap6d-diplomacy-engine-test.cjs`: PRE/POST na
  odtworzonych 1:1 fragmentach 8 reprezentatywnych funkcji (obie kategorie aliasu),
  wzorem `hotseat-etap6f-start-migracja-test.cjs`. Scenariusz A (`humanOwnerIds=[0]`):
  PRE≡POST na wszystkich (no-op behawioralny, 26/26 OK). Scenariusz B
  (`humanOwnerIds=[0,1]`, NIETAUTOLOGICZNY): dowód REGRESJI wersji SPRZED (aktywny fotel=1,
  `playerIsAtWarWith(0)` fałszywie zwraca `false` przez zaszyty "0=to JA"; `playerInPair(1,5)`
  fałszywie pomija drugiego humana; `label(1)` błędnie pokazuje "AI1") i dowód FIX wersji PO
  (te same wywołania z `isMe`/`isHuman` dają poprawny wynik, `PO !== SPRZED` jawnie
  zweryfikowane) — 12/12 OK. Wynik: WSZYSTKIE TESTY PASS, `node
  tools/hotseat-etap6d-diplomacy-engine-test.cjs` z katalogu `gra/`.
- Chromium NIE użyty: jedyna funkcja z tabeli dotykająca UI (`openDiplomacyAudience`)
  deleguje faktyczny render DOM do `showDiplomacyAudience` (`ui/diplomacyAudience.ts`,
  POZA allowlistą tego tematu) — potwierdzone `grep -n "function showDiplomacyAudience"`.
  Własne ciało `openDiplomacyAudience` jest czystą logiką budowania configu, headless
  wystarcza zgodnie z warunkiem dispatchu ("Chromium tylko jeśli funkcja FAKTYCZNIE
  renderuje UI").

WERYFIKACJA RÓWNOLEGŁYCH LANÓW (świeża, przed edycją main.ts):
- `/home/user/wt-hotseat-etap6e-render`: `git status`/`git diff -- gra/src/main.ts` —
  zmiany robocze w liniach 2442-2499, 3434-3470, 5376, 7983-8103, 11749-11884,
  17784-17799 (async boot, render/kamera). ŻADNA z tych linii nie pokrywa się z ciałami
  20 migrowanych funkcji (najbliższa: 17784-17799 kończy się PRZED `buildDiploTreasury`
  17766 i PRZED `buildDiplomacyTickCtxForPair` 17953) — brak nakładania fizycznego.
- `/home/user/wt-hotseat-etap7-saveload`: `git status` czyste (brak zmian roboczych w
  `gra/`), `git log` pokazuje commit "format zapisu v3" — osobny plik/zakres, nie main.ts
  dyplomacji.

POZA ZAKRESEM (jawna notatka, jak w dispatchu): `game/forced-war-bronze.ts`,
`game/forced-war-stone.ts`, `game/diplomacy-border-march.ts`, dev/playtest harness
(`forceBronzeForcedWarDominoOnPlayer`, `playtestWalkaMapy`) — NIE dotknięte, czekają na
osobną decyzję właściciela co do dalszego zakresu pod-etapu 6d (floor ≥136 miejsc wg
recon, ta runda migruje 20/89 nazwanych funkcji rdzenia silnika).

BLOKADY: brak blokad technicznych. `gra/node_modules` brakował w tym worktree (sparse
checkout) — utworzony symlink do `/home/user/The-Game/gra/node_modules` (ten sam wzorzec
co pozostałe worktree'y, `git check-ignore` potwierdza że jest ignorowany, nie trafia do
commitu).

RUNDY: 1/5
NASTĘPNY KROK: Evaluator ocenia migrację 20 funkcji, kategoryzację aliasu (9 uzasadnień
z cytatem ciała), kompletność wzorca "literał jako argument", nową bramkę dowodu i
weryfikację równoległych lanów.
DEPLOY/PUSH: NIE WYKONANO
