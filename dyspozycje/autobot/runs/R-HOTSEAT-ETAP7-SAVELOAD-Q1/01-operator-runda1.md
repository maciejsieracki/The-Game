# R-HOTSEAT-ETAP7-SAVELOAD-Q1 — Operator, runda 1

## 0. Weryfikacja świeżości (dispatch pkt 1)

Świeży `Read`/grep `main.ts`: `buildSaveGameSnapshot()` def. linia 28278 (recon: 28256),
`restoreGameFromSave()` def. linia 35682+38 (recon: 35646), `loadGameFromSlot` 35513+
(recon: 35509). Projekt recon §4/§5 nadal pasuje 1:1 do kodu — jedyna różnica to
przesunięcie numerów linii (main.ts urósł od integracji 6b/6f, jak przewidziano).
Potwierdzone: `aiSkarbiecByOwner`/`aiNaukaPoolByOwner` nadal poprawnie serializowane/
odtwarzane (main.ts 28389/28392 zapis, restore analogicznie) — nic do naprawy, zgodnie
z recon §3.

**Nakładanie z równoległymi lanami**: `wt-hotseat-etap6c-economy` ma niescommitowane zmiany
main.ts w zakresie linii 1989-30857 (`git diff -U0`), ale WSZYSTKIE hunki leżą POZA
`buildSaveGameSnapshot` (28278-28504, kończy się przed 6c's najbliższym hunkiem 29091).
`wt-hotseat-etap6e-prereq` ma 1 commit (`meForRender`/`_cityRenderOpts`, ok. 2400-2520)
— poza zakresem tego tematu. Zero nakładania linii potwierdzone przed edycją.

## 1. Implementacja (allowlist: `main.ts`, `game/save.ts`, nowy test)

**`game/save.ts`**: `SAVE_VERSION` 2→3; nowa `IncompatibleSaveFormatError extends Error`
(komunikat: "Ten zapis pochodzi ze starszej wersji gry (v{N}) sprzed trybu gorącego
krzesła i nie może być wczytany. Rozpocznij nową grę."); `SaveGame.gracze`/
`exploredByHuman`/`humanOwnerIds`/`activeHumanOwnerId` (typy 1:1 z recon §4, `GraczSaveV3`
z `*Pace` jako string-union importowane z `building-cost-tempo.ts`/`unit-cost-tempo.ts`/
`population-growth-tempo.ts`/`ruch-swiata-tempo.ts`); `gracz`/`explored` zostają jako
`@deprecated` opcjonalne WYŁĄCZNIE dla typów. `deserializeGame`: nowa gałąź **`if (ver < 3)
throw new IncompatibleSaveFormatError(ver)`** — próg TWARDY, oddzielny od istniejącego
`ver > SAVE_VERSION` (dowód w bramce, sekcja B niżej).

**BLOKER znaleziony i naprawiony w tej rundzie (spoza literalnego opisu dispatchu)**:
`loadFromLocal()` jest wołane z DWóch miejsc — `main.ts::loadGameFromSlot` (chce
`IncompatibleSaveFormatError` przebitą) ORAZ `saveLoadDialog.ts::summarizeSaveSlots()`
(buduje listę "Wczytaj grę" ze WSZYSTKICH slotów, fallback na pełny parse gdy brak
nagłówka meta — poza allowlistą tego tematu). Bezwarunkowy rethrow zepsułby CAŁĄ listę
"Wczytaj grę" (nie tylko jeden nieczytelny slot), jeśli w storage leży choć jeden
przedwersyjny zapis bez osobnego nagłówka meta. Naprawa: `loadFromLocal(slot, opts?: {
rethrowIncompatible?: boolean })` — domyślnie `false` (zachowanie identyczne z PRZED tą
zmianą dla wszystkich innych wołających), `main.ts::loadGameFromSlot` jedyny, kto ustawia
`true`. Zero zmian w `saveLoadDialog.ts` (poza allowlistą).

**`main.ts`**: `buildSaveGameSnapshot()` — `wersja: SAVE_VERSION`; `graczeSave =
Array.from(playerStateByHuman.entries(), ...)`, `exploredByHumanSave =
Array.from(exploredByHuman.entries(), ...)` (PER-HUMAN, nie hardkodowane na gracza 0);
`humanOwnerIds`/`activeHumanOwnerId` z `humanSeats`. `restoreGameFromSave()` — pętle `for
(oid, ...) of saved.gracze` / `saved.exploredByHuman`, odtwarzają `humanSeats`,
`playerStateByHuman`, `exploredByHuman` dla WSZYSTKICH foteli z zapisu. **Alias krytyczny
zachowany** (recon §2): `exploredByHuman.get(HUMAN_OWNER_PRIMARY)`/
`playerStateByHuman.get(0)` MUSZĄ zostać TYM SAMYM obiektem co `explored`/`player` (33+
miejsc w pliku czyta je wprost) — gracz 0 odtwarzany przez `explored.clear()`+`add()` (nie
przez podstawienie nowego `Set`), `player` mutowany in-place. `loadGameFromSlot` — nowa
gałąź `if (e instanceof IncompatibleSaveFormatError)` w `catch`, KOLEJNOŚĆ
`openStartupMainMenu()` PRZED `showHintMessage(e.message, 6000)` (wzorzec N-ZINDEX-TOAST,
identyczny z istniejącą gałęzią `fatal.length > 0`). Drobna korekta poza literalnym
zakresem: `newGameParamsForLoad()` czytało `saved.gracz?.era` (pole usunięte w v3) —
przepisane na `saved.gracze?.find(oid===0)?.era`.

**ZERO funkcji migrującej v2→v3** (ABC-4) — potwierdzone bramką (grep negatywny na 5
wzorców nazw, sekcja C niżej).

## 2. Dowód na żywo (Chromium, dwa niezależne przebiegi — pełne artefakty w `dowody/`)

**(a) Roundtrip niepusty, 2 fotele ludzkie** — `vite build --outDir <poza repo>`, realny
`doStartGame` (`__cityStateStartUnitsTestDebug.startNewGame`+`foundPlayerStartCity`),
`__eraTestDebug.prepareOneTechFromBronze()` (11 zbadanych technologii, era 1, nauka 725),
`__hotSeatTestDebug.spawnTestUnitForPlayer` (jednostka gracza), `__hotSeatTestDebug.
seedSecondSeat(3, {skarbiec:80, exploredKeys, reassignCityId: miasto-państwo})`. **REALNY**
cykl Ctrl+S (`doQuickSave`→`buildSaveGameSnapshot`→`serializeGame`→IndexedDB) → Ctrl+L
(dialog→`loadGameFromSlot`→`loadFromLocal`→`deserializeGame`→`restoreGameFromSave`).
Zapis odczytany WPROST z IndexedDB potwierdza kształt v3: `wersja:3`, `gracze[]` 2 wpisy
(fotel 3: skarbiec=80 dokładnie jak seedowano), `exploredByHuman[]` 2 wpisy,
`humanOwnerIds:[0,3]`, `activeHumanOwnerId:0`, BRAK `gracz`/`explored`. Stan PO
roundtripie === stan PRZED: `turn`, liczba miast/jednostek, `ownerId` przejętego miasta,
`PlayerState` gracza 0 (`era/zbadaneSize=11/nauka=725/badana`), `exploredByHuman` OBU
foteli (przez `switchActiveHuman(3)` + odczyt) — wszystkie identyczne. Zero błędów JS.
Zrzut: `dowody/zrzut-runda1-roundtrip-po-wczytaniu.png` (mapa, HUD z Nauka=725 po
wczytaniu, miasto Ardea=stolica gracza, Lanuvium=przejęte przez fotel B).

**(b) Komunikat "stary format"** — zapis `wersja:2` wstrzyknięty BEZPOŚREDNIO do
IndexedDB (z nagłówkiem meta, żeby dialog go wylistował), klik "Więcej"→"Wczytaj grę"→
wybór slotu→"Wczytaj" w REALNYM dialogu. Toast widoczny z DOKŁADNYM tekstem: *"Ten zapis
pochodzi ze starszej wersji gry (v2) sprzed trybu gorącego krzesła i nie może być
wczytany. Rozpocznij nową grę."* Menu startowe otwarte (poprawna kolejność
N-ZINDEX-TOAST), canvas gry NIE pokazuje wczytanego/śmieciowego stanu, zero błędów JS.
Zrzut: `dowody/zrzut-runda1-komunikat-stary-format.png`.

## 3. Bramka pisemna (`gra/tools/hotseat-etap7-saveload-test.cjs`, nowy plik)

**59/59 PASS** (esbuild bundle realnego `save.ts` + regex strukturalny na `main.ts`,
wzorem `load-fail-toast-zindex-test.cjs`): roundtrip v3 niepusty (2 właścicieli, miasta,
jednostki, `zbadane` niepuste), próg `<3` NIEZALEŻNY od `>SAVE_VERSION` (v1/v2→
`IncompatibleSaveFormatError`, v4→zwykły `Error` "nowsza"), v3 malformed→normalizacja do
`[]` (nie throw), kształt `buildSaveGameSnapshot`/`restoreGameFromSave` (w tym alias
`explored`), kolejność `openStartupMainMenu`/`showHintMessage`, brak identyfikatorów
migracyjnych w `main.ts`/`save.ts`.

## 4. Bramki referencyjne i regresje

`tsc --noEmit`: **0 błędów**. 5 bramek: logic **213/213**, tech-tree **19/19**, research
**33/33**, unit-replace **13/13**, combat **6/6**. Dodatkowo (nie w 5 referencyjnych, ale
dotknięte przez zmianę save.ts): `map-snapshot-load-test` **58/0** (+1 known-fail
pre-istniejący, niezwiązany), `idb-storage-migration-test` **25/0**,
`idb-menu-continue-boot-refresh-test` **32/0**, `planned-march-test` **18/0**,
`barb-city-behavior-test` **177/0**, `barb-city-capture-cluster-test` **96/0**.

**REGRESJE ZNALEZIONE, ZGŁOSZONE JAWNIE (poza allowlistą tego tematu, wymagają osobnej
rundy)**: bump `SAVE_VERSION` 2→3 (ABC-4) poprawnie odrzuca fixture'y `wersja:1/2` w
narzędziach NIEZWIĄZANYCH z hot-seatem, które konstruują takie payloady wprost:
- `tools/barb-camp-blacklist-test.cjs` (linie ~134-144) — **CRASHUJE** (uncaught
  `IncompatibleSaveFormatError`) na sekcji "3. Save/load roundtrip and old-save migration
  contract" — testuje DOKŁADNIE kontrakt, który ABC-4 świadomie znosi (`wersja:1` miało się
  "migrować"). Wymaga bumpu fixture'a do `wersja:3` + zmiany asercji na `wersja:1`→oczekiwany
  throw.
- `tools/fsa-autosave-test.cjs` — **53 pass, 2 fail** (linie ~320/323, `wersja:2` fixture w
  pliku FSA na dysku) — `loadFsaAutosaveFile` łapie throw wewnętrznie i zwraca `null`
  (zgodnie z jego własnym kontraktem "nigdy nie rzuca"), więc 2 asercje oczekujące
  udanej deserializacji dostają `null`.
`load-fail-toast-zindex-test.cjs` ma 1 FAIL **pre-istniejący, NIEZWIĄZANY** (formuła
z-index `showHintMessage` zyskała `|| isEmpireDetailPanelOpen()` w innym, już
zintegrowanym temacie — zweryfikowane grepem, zero powiązania z tą rundą).
`hotseat-etap4-noop-test.cjs` (Chromium, ~kilkanaście minut) przerwany czasowo w tej
rundzie bez ukończenia — input no-op, nie dotyka `save.ts`, brak sygnału regresji w
zaobserwowanych 6 turach.

Żadna z tych dwóch regresji nie wymaga zmiany dzisiejszej implementacji (zachowanie jest
POPRAWNE wg ABC-4) — wymagają WYŁĄCZNIE bumpu literalnych fixture'ów w plikach spoza
allowlisty tego tematu.

## 5. Wynik

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-HOTSEAT-ETAP7-SAVELOAD-Q1
GOAL: Format zapisu v3 (`gracze[]`/`exploredByHuman`/`humanOwnerIds`/`activeHumanOwnerId`),
BEZ migracji v2→v3, czytelny `IncompatibleSaveFormatError` dla starego formatu (ABC-4).
ZMIANY/COMMIT: `gra/src/game/save.ts`, `gra/src/main.ts`, nowy `gra/tools/
hotseat-etap7-saveload-test.cjs`; commit w tej rundzie (SHA w historii gałęzi).
TESTY: tsc czysty; 5/5 bramek referencyjnych zielone; nowa bramka 59/59; dwa żywe
przebiegi Chromium (roundtrip niepusty 2-fotelowy + komunikat starego formatu), zrzuty w
`dowody/`.
BLOKADY: Brak blokad dla TEGO tematu. Dwie regresje fixture'ów w narzędziach spoza
allowlisty (sekcja 4) zgłoszone jawnie — wymagają osobnej, krótkiej rundy z rozszerzoną
allowlistą (`tools/barb-camp-blacklist-test.cjs`, `tools/fsa-autosave-test.cjs`).
RUNDY: 1/5
NASTĘPNY KROK: Evaluator.
DEPLOY/PUSH: NIE WYKONANO
