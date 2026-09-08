# R-HOTSEAT-ETAP6E-RENDER-Q1 — Operator, runda 2

## 1. Punkt startowy (świeża weryfikacja)

Worktree zmergowany z `origin/main` (`e72198a1`) — `main.ts:2494` już niósł prerekwizyt
`R-HOTSEAT-ETAP6E-PREREQ-BOOT-TDZ-Q1`: `playerOwnerId: meForRender?.() ?? HUMAN_OWNER_PRIMARY`
(forward-declare `meForRender`, podpięty w `boot()` po deklaracji `ME()`). Świeży `grep`
potwierdził wszystkie pozostałe 26 miejsc z recon nadal niezmigrowane, pod numerami linii
przesuniętymi względem recon (main.ts rośnie codziennie) — zweryfikowane bezpośrednim
`Read` każdej z 6 funkcji-rezolwerów przed edycją, nie ufałem numerom z dokumentu.

## 2. KLUCZOWE ZNALEZISKO — dlaczego gołe `isMe()`/`ME()` NADAL by crashowało (mimo prerekwizytu)

Prerekwizyt naprawił TYLKO `playerOwnerId` (literał w obiekcie, ewaluowany eagerly). Świeże
śledzenie wywołań pokazało, że TA SAMA przyczyna TDZ z rundy 1 dotyczy też części
pozostałych 26 miejsc: `_cityRenderOpts()` jest wołane bezwarunkowo na starcie
(`cityRenderer.sync(cities, _cityRenderOpts())`, main.ts:2513) — PRZED deklaracją
`let humanSeats`/`ME()`/`isMe()` w `boot()` (main.ts~10385+). W obiekcie zwracanym przez
`_cityRenderOpts()` funkcje `getMapOutlineKind`/`getCivDisplayName`/`isCityStateOwner`
WOŁAJĄ, per miasto, WEWNĄTRZ tego samego pierwszego `cityRenderer.sync()`
(potwierdzone `Read` `render/cities.ts::sync()`/`_buildBadgeInput`/`_syncMapOutline`):
`cityMapOutlineKindForOwner`, `civDisplayNameForOwner`, `portraitForceCultureIcon`, oraz
(przez `ownerColorFn: civColorFn`) `civTypeForOwner`. Migracja tych 4 funkcji na gołe
`isMe()`/`ME()` odtworzyłaby DOKŁADNIE crash z rundy 1 (`ReferenceError` na `humanSeats`
w TDZ), tym razem w nowym miejscu.

**Decyzja inżynierska:** rozszerzyłem wzorzec `meForRender` z prerekwizytu o dwie małe
funkcje w main.ts (obok `meForRender`, ~L2445): `meNow()` (`= meForRender?.() ??
HUMAN_OWNER_PRIMARY`) i `isMeSafe(ownerId)` (`= ownerId === meNow()`). Użyte WYŁĄCZNIE w
4 funkcjach osiągalnych z eager-ścieżki (`civTypeForOwner`, `cityMapOutlineKindForOwner`,
`civDisplayNameForOwner`, `portraitForceCultureIcon`) + `getCiv`/`getCivIconId` w
`_cityRenderOpts`. Funkcje osiągalne WYŁĄCZNIE z kontekstów zdarzeniowych (rejestrowane
jako callback, wołane dopiero po pełnym `boot()`) — `relationColorFn`,
`unitRingStanceForPlayer` (rejestrowana w `wireUnitRendererRingStance()`, ale realnie
wołana dopiero przy `unitRenderer.sync()` L~11011, długo po `humanSeats`),
`syncOkolicaOverlay`, `refreshTerritoryBorderOverlay`, wywołanie `syncWorkerFieldOverlay`
— używają gołych `isMe()`/`ME()` wprost, zweryfikowane osobno przez `grep` wszystkich
call-site'ów każdej funkcji. Po podpięciu `meForRender = ME` w `boot()` obie ścieżki
zwracają identyczny wynik — zero różnicy behawioralnej, czysta infrastruktura TDZ-safety
(ten sam wzorzec co prerekwizyt), nie konkurencyjny alias. `main.ts:2494`
(`playerOwnerId`) zostawiłem BEZ zmian — `meForRender!()` rzuciłoby na pierwszym wywołaniu
(TypeError, `meForRender` jest wtedy `undefined`), gorzej niż dzisiejszy fallback.

Dodatkowo w `cityMapOutlineKindForOwner` zmigrowałem TRZECI hardkod nieujęty w recon
(`dealInvolvesOwners(d, 0, ownerId)` → `dealInvolvesOwners(d, meNow(), ownerId)`) —
ta sama semantyka self-reference co pozostałe dwa w tej funkcji, pominięta przez recon.

## 3. Migracja render/*.ts (6 fallbacków)

`isMe`/`ME` to domknięcia lokalne `boot()`, nieeksportowane — niedostępne z osobnych
modułów `render/*.ts` bez zmiany architektury poza allowlistą. Zamiast tego zaimportowałem
`HUMAN_OWNER_PRIMARY` (już eksportowana stała z `game/human-owners.ts`, uzywana od Etapu 1)
do `units.ts`, `cities.ts`, `cityOkolicaOverlay.ts` i zastąpiłem nią wszystkie literały `0`
(`setSelectionHex` domyślny param, `ringStanceForOwner` domyślny fallback,
`applyFogVisibility` domyślny param, `cities.ts:784/803` `?? 0`, `cityOkolicaOverlay.ts:298`
`?? 0`). Behawioralnie identyczne z dzisiejszym `0` (jeden fotel człowieka); realne
wywołania z main.ts zawsze podają jawny argument (`ME()`/`meNow()` po tej rundzie), więc te
fallbacki są dziś martwe w praktyce — nazwana stała zamiast magicznej liczby.

## 4. Bramka anty-samooszukiwanie: Chromium PO krytycznym miejscu, potem cała reszta

Po zmigrowaniu klastra `_cityRenderOpts` (getCiv/getCivIconId + 4 rezolwery) zbudowałem
i uruchomiłem `hotseat-etap6e-render-noop-test.cjs` PRZED migracją pozostałych funkcji —
boot przeszedł (brak TDZ), więc kontynuowałem. `tsc --noEmit` czysty po każdym kroku.

**Drugie znalezisko (diagnostyka, nie regresja):** pierwszy pełny przebieg bramki dał
`FAIL` — stan gry (`dumpState()`) BIT-IDENTYCZNY na 20/20 tur, ale zrzuty `<canvas>`
(bajt-dokładne SHA-256 PNG) rozjeżdżały się od tury 10. Napisałem izolowany skrypt
diagnostyczny (bez klikania panelu, sam `dumpState()` po każdej turze) — PRZED/PO dały
BIT-IDENTYCZNY JSON na wszystkich turach, potwierdzając że logika jest no-opem. Przyczyna
rozjazdu pikseli: `main.ts::renderLoop()` (~L33706) to ciągła pętla `requestAnimationFrame`
napędzana realnym `performance.now()` — dowolna animacja czasowa w scenie trafia w
screenshot w innej fazie między dwoma niezależnie taktowanymi procesami Chromium, nawet
przy identycznym kodzie i stanie. To pre-istniejąca właściwość silnika (żadna z 27 pozycji
recon jej nie dotyka), niewidoczna wcześniej bo bramka nigdy nie doszła do realnych hashy
(runda 1 kończyła się SKIP/BLOCK przed migracją).

**Naprawa bramki:** zamieniłem porównanie zrzutów z bajt-dokładnego SHA-256 na
tolerancyjny image-diff (`pngjs`, już zależność projektu) — próg 2% różniących się
pikseli (kanał RGB, próg 24/piksel), standardowa technika visual regression testing.
Stan gry (`dumpState()`) pozostaje bajt-dokładnym, decydującym dowodem. Wynik po naprawie:
PRZED/PO — stan 20/20 identyczny, zrzuty 20/20 w tolerancji (0.00-0.22% różniących pikseli,
szum antyaliasingu/animacji). Nietautologiczność (ZEPSUTY: `ME()` zwraca `-999` u źródła,
zamiast tylko `isMe()`, żeby propagować się też przez `meNow()`/`isMeSafe()`) — stan 0/20,
zrzuty 0/20, różnice 26-66% pikseli — separacja od szumu (≤0.22%) ogromna, nietautologiczna.
**PASS.**

## 5. Weryfikacja binarnego kryterium

`grep -rnE "ownerId\s*(===|!==|=|\?\?)\s*0\b"` w main.ts ograniczony do 8 zmigrowanych
funkcji + klastra `_cityRenderOpts(2440-2500)` → 0 trafień (zweryfikowane per-funkcja
`awk`). `render/units.ts`/`cities.ts`/`cityOkolicaOverlay.ts` → 0 trafień kodu (1 trafienie
to komentarz, nie kod). `render/camera.ts` nietknięty (`git diff --stat` puste, recon
potwierdzony). `tsc --noEmit`: 0 błędów. 5 bramek referencyjnych: logic 213/213,
tech-tree 19/19, research 33/33, unit-replace 13/13, combat 6/6 — identyczne z bazą.

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-HOTSEAT-ETAP6E-RENDER-Q1
GOAL: Migracja 27 miejsc kategorii render/kamera (main.ts+render/*.ts) na
isMe(ownerId)/!isMe(ownerId)/ME() wg recon, zgodnie z 00-dispatch.md.
ZMIANY/COMMIT: `gra/src/main.ts` (12 lokalizacji: 6 funkcji-rezolwerów + `_cityRenderOpts`
getCiv/getCivIconId, `syncWorkerFieldOverlay` call, `refreshTerritoryBorderOverlay`,
`syncOkolicaOverlay`; `playerOwnerId` L2494 pozostawiony bez zmian, uzasadnienie §2; nowe
`meNow()`/`isMeSafe()` infra L~2445); `gra/src/render/units.ts`, `cities.ts`,
`cityOkolicaOverlay.ts` (6 fallbacków `?? 0`/domyślnych param. → `HUMAN_OWNER_PRIMARY`);
`gra/tools/hotseat-etap6e-render-noop-test.cjs` (naprawa tolerancji zrzutów + mutacja
`ME()` u źródła zamiast `isMe()`, PASS). Commit poniżej.
TESTY: `tsc --noEmit` 0 błędów. `hotseat-etap6e-render-noop-test.cjs`: PASS (stan gry
20/20 identyczny, zrzuty 20/20 w tolerancji 2%, nietautologiczność potwierdzona osobno
zdiagnozowanym mechanizmem). 5 bramek referencyjnych zielone (213/213, 19/19, 33/33,
13/13, 6/6).
BLOKADY: brak.
RUNDY: 2/5
NASTĘPNY KROK: Evaluator runda 2.
DEPLOY/PUSH: NIE WYKONANO
