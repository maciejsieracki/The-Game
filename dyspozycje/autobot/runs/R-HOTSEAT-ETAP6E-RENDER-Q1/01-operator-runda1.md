# R-HOTSEAT-ETAP6E-RENDER-Q1 — Operator, runda 1

## 1. Weryfikacja overlap z R-HOTSEAT-ETAP6B-UI-Q1 (świeża, przed pierwszą zmianą kodu)

`git diff $(git merge-base HEAD origin/main) HEAD -- gra/src/main.ts` w
`/home/user/wt-hotseat-etap6b-ui` (baza 6b: `e76adba2`) pokazuje 70 hunków, żaden
nie dotyka nazw funkcji z mojej listy 27 (`civTypeForOwner`, `relationColorFn`,
`unitRingStanceForPlayer`, `cityMapOutlineKindForOwner`, `civDisplayNameForOwner`,
`portraitForceCultureIcon`, `_cityRenderOpts`, `syncWorkerFieldOverlay`,
`refreshTerritoryBorderOverlay`, `syncOkolicaOverlay`, `cityRenderer.sync`,
`playerOwnerId`) — potwierdzone `grep` zero trafień. Baza 6e (`0272c3d2`) i baza
6b (`e76adba2`) mają identyczny `gra/src/main.ts`, więc numery linii obu diffów
są bezpośrednio porównywalne. **Brak nakładania — kontynuowałem migrację.**

## 2. Świeży stan vs recon (trzy korekty, przed edycją)

1. `ME()`/`isMe()` SĄ już zintegrowane w bazie (`main.ts:10376`/`10390`, Etap 6a
   scalony po recon) — reużyte, bez duplikatu.
2. 2 z 27 pozycji (recon: `cityRenderer.sync` literały na liniach 24543/24599)
   już zmigrowane przed tą rundą (dziś 24551/24607, `playerOwnerId: ME()`) —
   efekt uboczny wcześniej zintegrowanej pracy nad `resolveEnemyCityClick`.
3. Pozostałe "6 wywołań `cityRenderer.sync` z literałem" z recon (15883, 16025,
   19369, 19416 + dwie wyżej) nie istnieją dziś w tej formie — świeży
   `grep -n "cityRenderer.sync("` pokazuje wszystkie 18 wywołań w pliku
   przechodzące przez jeden, wspólny `_cityRenderOpts()` (main.ts:2447+). Kod
   się skonsolidował od czasu recon.

## 3. KRYTYCZNE ZNALEZISKO — migracja tej rundy ŁAMIE BOOT GRY (TDZ crash)

Zmigrowałem 12 lokalizacji main.ts (`civTypeForOwner`, `relationColorFn`,
`unitRingStanceForPlayer`, `cityMapOutlineKindForOwner`, `civDisplayNameForOwner`,
`portraitForceCultureIcon`, `_cityRenderOpts().getCiv/getCivIconId/playerOwnerId`,
`syncOkolicaOverlay`, `refreshTerritoryBorderOverlay`, `syncWorkerFieldOverlay`)
wg wzorca `ownerId===0`→`isMe(ownerId)`/literał `0`→`ME()`, zbudowałem bramkę
no-op (`gra/tools/hotseat-etap6e-render-noop-test.cjs`, PRZED/PO/ZEPSUTY, wzorzec
1:1 z Etapu 6a) i uruchomiłem ją realnie w Chromium (C-001, `vite build` +
zwykłe demo).

**Wynik: bundle "PO" (z moimi 12 edycjami) nigdy nie dochodzi do menu głównego.**
Konsola przeglądarki:
```
[TheGame] FATAL: ReferenceError: Cannot access 'lw' before initialization
    at Kg (.../index.html:31110:27237)
    at JE (.../index.html:31110:235090)
    at k4A (.../index.html:31110:235208)
```
(`lw` to zminifikowana nazwa jednej ze zmiennych `humanSeats`/`ME`/`isMe`.)

**Przyczyna (potwierdzona minimalną reprodukcją, izolowaną od reszty edycji):**
`humanSeats` (`let`, main.ts:10370) i funkcje `ME()`/`isMe()` (main.ts:10376/
10390, Etap 6a) są zadeklarowane wewnątrz `boot()` DALEKO PO pierwszym,
bezwarunkowym wywołaniu `cityRenderer.sync(cities, _cityRenderOpts())` na
main.ts:2506 — które wykonuje się SYNCHRONICZNIE podczas wstępnego budowania
sceny (world gen → `buildScene`), zanim wykonanie `boot()` w ogóle dotrze do
linii 10370. `cities` jest już wtedy niepuste (miasta-państwa/AI postawione na
starcie), więc `cityRenderer.sync` realnie odpytuje przekazane resolvery per
miasto. Odczyt `ME()`/`isMe()` (a przez nie `humanSeats`) w tym oknie trafia w
Temporal Dead Zone `let humanSeats` → `ReferenceError`, zanim gra pokaże
cokolwiek.

**Zredukowałem to do reprodukcji jednoliniowej**, wyizolowanej od pozostałych 11
edycji: cofnąłem WSZYSTKO poza jedną zmianą (`main.ts:2487`,
`playerOwnerId: 0` → `playerOwnerId: ME()`, dosłownie literał w object-literalu
`_cityRenderOpts()`, ewaluowany EAGERLY przy każdym wywołaniu tej funkcji, nie
leniwie jak sąsiednie strzałki `getCiv`/`getCivIconId`) — sam ten jeden token
wystarcza, by `page.waitForFunction` na hak testowy (`__cityStateStartUnitsTestDebug`)
nigdy się nie spełnił (20s timeout, strona martwa). To wyklucza, że przyczyną
jest któraś z pozostałych 11 edycji albo interakcja między nimi — winowajcą jest
sama KOLEJNOŚĆ deklaracji w `boot()`, nie treść żadnej z 27 podmian z recon.

**Wniosek:** wzorzec podmiany z dispatchu/recon (`ownerId===0`→`isMe(ownerId)`,
literał `0`→`ME()`) jest poprawny SEMANTYCZNIE, ale NIE JEST bezpieczny do
zastosowania w main.ts bez uprzedniego przeniesienia `humanSeats`/`ME`/`isMe`
(albo równoważnego wczesnego aliasu) PRZED pierwsze wywołanie
`_cityRenderOpts()`/`cityRenderer.sync()` (main.ts:2506) — a to jest zmiana
poza allowlistą tej rundy ("main.ts wyłącznie 27 miejsc z recon"; przeniesienie
deklaracji Etapu 6a to 28. punkt, i to strukturalny, nie punktowy). Recon
(napisany metodą statycznego czytania kodu, bez realnego uruchomienia gry) nie
mógł tego wykryć — to defekt WIDOCZNY WYŁĄCZNIE w realnym boot gry, dokładnie
dlatego dispatch wymagał bramki Chromium zamiast poprzestać na `tsc --noEmit`
(który jest czysty, TDZ nie jest błędem typów).

## 4. Cofnięcie zmian tej rundy

Wobec potwierdzonego, reprodukowalnego crasha bootu **cofnąłem WSZYSTKIE zmiany
w `gra/src/main.ts`** (`git checkout -- gra/src/main.ts`) — plik jest
bajt-identyczny z bazą `0272c3d2`. Nie commituję żadnej migracji main.ts w tej
rundzie: 22 świeżo zweryfikowane (z uwzględnieniem korekt §2) hardkody
pozostają nietknięte, bo nie istnieje bezpieczny sposób ich zmigrowania w
obrębie samej allowlisty main.ts "27 miejsc" — wymagana jest osobna,
poprzedzająca zmiana kolejności deklaracji.

**Zachowuję** nowy plik `gra/tools/hotseat-etap6e-render-noop-test.cjs`
(allowlista pozwala) — bramka jest gotowa i poprawnie wykryła regresję
(to ona posłużyła do diagnozy); po naprawie prerekwizytu (§5) uruchomienie jej
na realnej migracji da wiążący dowód no-op. Dziś, na niezmienionym main.ts,
PRZED/PO byłyby trywialnie identyczne (ten sam kod) — nie uruchamiam więc pełnej
bramki do końca w tej rundzie (brak sensu dowodowego bez realnej migracji);
diagnostyczne minimalne reprodukcje (opisane w §3) są przechowane WYŁĄCZNIE w
logu tej rundy, nie jako pliki w repo (usunięte po użyciu, nie były na
allowliście).

## 5. DECISION_REQUIRED dla właściciela/Evaluatora

Migracja kategorii render/kamera main.ts wymaga PREREKWIZYTU poza zakresem tej
rundy: przenieść deklarację `humanSeats`/`ME()`/`isMe()` (dziś main.ts ok.
10370-10391, Etap 6a) na wcześniejszą pozycję w `boot()` — przed pierwsze
wywołanie `_cityRenderOpts()`/`cityRenderer.sync()` (main.ts ok. 2440-2506) —
albo wprowadzić tam osobny, wcześnie dostępny alias o identycznej semantyce
(`HUMAN_OWNER_PRIMARY` już istnieje jako stała, więc awaryjny wczesny
`ME()`/`isMe()` mógłby na starcie zwracać tę stałą zamiast czytać
`humanSeats.activeHumanOwnerId` — behawioralnie identyczne dziś, `ME()===0`
zawsze). To jest decyzja architektoniczna (kolejność inicjalizacji w `boot()`),
nie punktowa migracja — wykracza poza mój mandat "main.ts wyłącznie 27 miejsc
z recon" tej rundy. Proponuję osobny, mały podtemat naprawczy PRZED
wznowieniem R-HOTSEAT-ETAP6E-RENDER-Q1.

## 6. Weryfikacja anty-samooszukiwanie

`tsc --noEmit` na zmigrowanym main.ts (przed cofnięciem) był czysty — TDZ nie
jest błędem typów, więc to POTWIERDZA, że sama bramka `tsc` byłaby fałszywie
zielona na tym defekcie; dopiero realny boot w Chromium (dispatch pkt 4, C-001)
go ujawnił. Nietautologiczność bramki potwierdzona pośrednio: bramka wykryła
prawdziwą różnicę kodu (crash vs brak crasha) na pierwszej próbie użycia, a nie
przeszła bezmyślnie.

STATUS: BLOCK
DOMAIN: GAME
TEMAT: R-HOTSEAT-ETAP6E-RENDER-Q1
GOAL: patrz 00-dispatch.md
ZMIANY/COMMIT: gra/src/main.ts BEZ ZMIAN (cofnięte po wykryciu regresji);
nowy `gra/tools/hotseat-etap6e-render-noop-test.cjs` (bramka, gotowa do użycia
po naprawie prerekwizytu §5); ten raport.
TESTY: `tsc --noEmit` czysty (nieprzydatny na ten defekt, patrz §6). Bramka
Chromium PRZED (kod bazowy) = 20/20 tur bez błędów, deterministyczna. Bramka
Chromium na zmigrowanym main.ts (PO) = boot NIE ładuje się (TDZ
`ReferenceError`, potwierdzone jednoliniową minimalną reprodukcją, §3) —
migracja main.ts NIE ZOSTAŁA scommitowana z tego powodu.
BLOKADY: (1) migracja main.ts BLOKUJE boot gry przez TDZ na `humanSeats`/`ME`/
`isMe` — wymaga prerekwizytu poza allowlistą tej rundy (§5, DECISION_REQUIRED).
(2) niezależnie od (1), 6/27 pozycji recon w `render/units.ts`/`cities.ts`/
`cityOkolicaOverlay.ts` (fallbacki `?? 0`/domyślne parametry) nie są migrowalne
bez eksportu `ME`/`isMe` z main.ts (moduły oddzielne, brak importu) — patrz
uwaga w nagłówku pliku bramki no-op.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator / właściciel decyduje: (a) osobny mały podtemat
naprawczy (przeniesienie/wczesny alias `ME`/`isMe`) przed wznowieniem tego
tematu, czy (b) inny kierunek. Bez tego migracja main.ts nie może bezpiecznie
wejść do żadnej rundy tego tematu.
DEPLOY/PUSH: NIE WYKONANO
