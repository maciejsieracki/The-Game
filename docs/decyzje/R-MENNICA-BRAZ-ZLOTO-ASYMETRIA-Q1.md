# R-MENNICA-BRAZ-ZLOTO-ASYMETRIA-Q1 — asymetria brąz-vs-złoto w `placedImprovementsWithTradeGrants`

**Status:** 🟢 ZAMKNIĘTE (RUNDA 3, migracja testu wykonana, 2026-08-07):
- Pytanie główne ("czy 10 realnych wołań w main.ts polega na syntetycznym kluczu złota") — 🟢 **FAŁSZYWY ALARM,
  POTWIERDZONE** (Evaluator zaakceptował RUNDĘ 1 w tej części, patrz sekcje niżej).
- Decyzja (b) ("czy zostawić martwy kod `placedImprovementsWithZlotoTradeGrant` bez zmian") — 🟢 **ZAMKNIĘTE,
  Maciej wybrał Opcję (i)=A 2026-08-07** (zmigrować `zloto-szlak-test.cjs` do modelu opartego na stanie,
  zamiast usuwać martwy kod — patrz sekcja „RUNDA 3" niżej). `placedImprovementsWithZlotoTradeGrant` /
  `TRADE_GRANT_ZLOTO_SYNTHETIC_KEY` ZOSTAJĄ jako deprecated no-op (nietknięte, poza zakresem tej rundy).

**Źródło zgłoszenia:** Evaluator, sesja MENNICA-GRACE-VERIFY-Q1, nota N3 (`dyspozycje/PYTANIA-OTWARTE.md`).
**Zakres audytu:** WYŁĄCZNIE `placedImprovementsWithTradeGrants` (main.ts) i `placedImprovementsWithZlotoTradeGrant`
(zloto-access.ts) + wszyscy wołający. Zero zmian zachowania kodu w obu rundach.

**RUNDA 2 (ta rewizja) — co się zmieniło względem RUNDY 1:** (1) worktree zrebase'owany na aktualny `main`
(główne drzewo było `a0cef4b`, worktree bazował na przestarzałym `f3437e3` — 30 commitów różnicy, stąd
wszystkie numery linii `main.ts` w tabelach niżej zostały przeliczone na nowo i zweryfikowane); (2)
`tools/zloto-szlak-test.cjs` uruchomiony REALNIE — wynik **26 passed, 19 failed** (RUNDA 1 błędnie napisała,
że test "potwierdza no-op jest zamierzony" — nieprawda, patrz sekcja „Wynik realny `zloto-szlak-test.cjs`");
(3) decyzja (b) przepisana z "zostaw jak jest" na "wymaga ABC" — poprzednie uzasadnienie (kontrakt
zablokowany testami) jest nieważne, bo testy same są zepsute/przedmigracyjne, więc nic nie blokują; (4) wpis
`P-TEST-MENNICA-USPIENIE-STALE` w `dyspozycje/PYTANIA-OTWARTE.md` **usunięty** — zweryfikowano, że problem
już nie istnieje na aktualnym `main` (`mennica-uspienie-test.cjs` 49/49 passed po rebase, naprawione
commitem `72672f9`); RUNDA 1 patrzyła na przestarzały worktree.

## Zarzut (jak sformułowany)

`placedImprovementsWithTradeGrants` skleja dwa syntetyczne granty "z trasy" do mapy `placedImprovements`:
brązowy (`placedImprovementsWithBrazTradeGrant`, main.ts:3356) realnie dokleja klucz syntetyczny gdy trasa
daje dostęp do brązu, złotowy (`placedImprovementsWithZlotoTradeGrant`, zloto-access.ts:140) jest CAŁKOWITYM
no-opem — przyjmuje `_hasTradeGrant` jako nieużywany parametr i zawsze zwraca wejście bez zmian. Funkcja ma
10 wołających w main.ts (nie 11 — patrz „Korekta liczby" niżej), z których żaden nie dostaje żadnego śladu
grantu złota z trasy w zwróconej mapie.

## Werdykt: FAŁSZYWY ALARM

`placedImprovementsWithZlotoTradeGrant` jest **świadomym, udokumentowanym no-opem po migracji architektury**
(PYTANIE-84-U3, Maciej 2026-07-27, wdrożone FALA 41 commit `297c60c`), nie zapomnianym bugiem. Złoto
przeszło z modelu „syntetyczny klucz dostępu w placedImprovements" (jak brąz/żelazo) na model **magazynowy**
(`City.surowce.zloto`, civ-wide suma) — szlaki handlowe dostarczają dziś FIZYCZNE sztuki złota do skarbca
państwa (trade-routes.ts), nie syntetyczny wpis "dostępu". Dowód w nagłówku zloto-access.ts (linie 1–14):

> „Szlaki handlowe (U-3): dostarczają sztuki do magazynu państwa (trade-routes.ts), NIE syntetyczny wpis
> „dostępu" w placedImprovements."

Realny, AKTUALNY mechanizm dostępu do złota to `ownerHasZlotoAccessNow` (main.ts:3396-3400) — czyste OR,
**BEZ jakiejkolwiek zależności od `placedImprovements`**:

```
ownerHasZlotoStock(stock)               // zapas w skarbcu państwa
  || ownerHasNativeResourceAccess(id,'zloto')   // własna Kopalnia złota (RAW mapa, nie augmentowana)
  || hasTradeRouteResourceAccess(grants, id,'zloto')  // aktywny grant z trasy (przeliczany osobno)
```

## Korekta liczby wołających: 10, nie 11

`grep -n "placedImprovementsWithTradeGrants(" src/main.ts` zwraca 11 trafień, ale jedno to sama **definicja**
funkcji (main.ts:3376) — realnych wywołań jest **10** (7 wołań budujących `AvailabilityContext.placedImprovements`
+ 2 wołania `getPlacedImprovements` cityPanel API + 1 wołanie wewnątrz `extraCityPanelConfig` = 7+2+1 = 10).

## Audyt 10 wołających — dowód, że żaden nie polega na `placedImprovements` dla złota

**Numery linii poniżej przeliczone po rebase RUNDY 2 na aktualny `main` (`a0cef4b`)** — worktree RUNDY 1
bazował na przestarzałym `f3437e3`, więc wszystkie linie main.ts przesunęły się o ok. +90 do +270 w zależności
od pozycji w pliku. Każda linia zweryfikowana bezpośrednim odczytem pliku w tej rundzie.

| # | main.ts | Kontekst | Do czego trafia `placedImprovements` | Gold-safe? |
|---|---------|----------|----------------------------------------|------------|
| 1 | 4491 | `replaceAvailabilityCtxForCity` | `AvailabilityContext.placedImprovements` (pole zadeklarowane w production.ts — **nigdzie nieodczytywane** w production.ts/ai.ts) | ✅ |
| 2 | 4521 | `replaceAvailabilityCtxEmpireWide` | jw. | ✅ |
| 3 | 5088 | `extraCityPanelConfig` → `getCityResourceAccessForCity` (panel miasta „Surowce w zasięgu") | `collectActiveAccess` (resource-access.ts:280-323) skanuje WYŁĄCZNIE przez `map.hexes[hexKey]` — syntetyczny klucz (bez realnego heksa) jest pomijany (`if (!hex) continue`, ~linia 292); etykieta „Złoto" dochodzi tam osobno przez `ownerHasZlotoStock(options.empireStock)` (linia 318), niezależnie od `placedImprovements` | ✅ |
| 4 | 5845 | `tryAutoEnqueueBuild` (auto-enqueue budowy dla miasta w trybie `budowaTryb='auto'`) | jw. #1 | ✅ |
| 5 | 10410 | `productionAvailabilityCtxForCity` (kolejka budowy) | jw. #1; bramka budynków ze złotem (Mennica) idzie przez `buildingResourceGateMet`/`mennicaRuntimeGateMet` (building-resource-gate.ts) na `empireStock`, NIE na `placedImprovements` | ✅ |
| 6 | 15772 | `configureCityPanel` (wywołanie inicjalizujące) → `getPlacedImprovements` (cityPanel API, owner 0) | lista ulepszeń do wyświetlenia na mapie/panelu; dostęp do złota w panelu idzie osobną, dedykowaną ścieżką `getOwnerHasZlotoAccess: (ownerId) => ownerZlotoAccessForMennicaEffective(ownerId)` (main.ts:15769) | ✅ |
| 7 | 21061 | `autoManageCity` ctx wewnątrz `triggerPlayerEndTurn` (auto-zarządca: major AI zawsze + gracz z `autoManageCities` włączonym) | jw. #1 | ✅ |
| 8 | 21664 | `isProductionAllowed` — bramka AI decyzyjna (`chooseCityProduction`, gate tech/epoka/prereq) wewnątrz `triggerPlayerEndTurn` | jw. #1 (`availableProduction`) | ✅ |
| 9 | 22425 | egzekucja komendy AI `cmd.type === 'build'` — `availableProduction` przy faktycznym enqueue do kolejki, wewnątrz `triggerPlayerEndTurn` | jw. #1 | ✅ |
| 10 | 23471 | `configureCityPanel` (rebuild po zmianie trudności z menu) → `getPlacedImprovements` (drugi eksport API, analogiczny do #6) | jw. #6 | ✅ |

**Korekta błędu opisu z RUNDY 1:** RUNDA 1 błędnie przypisała etykietę "(tryAutoEnqueueBuild)" do wołania
#7 (wtedy main.ts:20794, dziś 21061) — to wołanie jest w rzeczywistości wewnątrz `autoManageCity` (osobna
funkcja auto-zarządcy, NIE `tryAutoEnqueueBuild`). Prawdziwe wołanie wewnątrz `tryAutoEnqueueBuild` to #4
(wtedy main.ts:5752, dziś 5845) — RUNDA 1 opisała je ogólnikowo jako "AvailabilityContext (queue /
cityPanel)", pomijając że to dokładnie `tryAutoEnqueueBuild`. Zweryfikowane w tej rundzie bezpośrednim
odczytem obu fragmentów main.ts (patrz linie 4491-23471 wyżej) — poprawiona tabela powyżej ma to już
naniesione poprawnie.

**Wspólny mianownik:** jedyna funkcja, która skanuje `placedImprovements.values()` w poszukiwaniu klucza
złota bez odwołania do realnego heksa (`empireHasKopalniaZlota`, zloto-access.ts:65-69 — analogiczna do
`empireHasKopalniaMiedzi` dla brązu, która TAK korzysta z syntetycznego klucza) — ma **jedno** miejsce
wywołania w main.ts (linia 3332, wewnątrz `ownerHasNativeResourceAccess`), i to wywołanie **celowo** dostaje
mapę SUROWĄ (`placedImprovementsForOwner`, NIE augmentowaną), żeby uniknąć cyklu: natywny dostęp nie może
zależeć od grantu z trasy, bo grant z trasy jest POCHODNĄ natywnego dostępu drugiej strony (patrz komentarz
main.ts:3298-3302).

## Deklaracja @deprecated w źródle (zloto-access.ts) — prawdziwa, ale NIE potwierdzona testem

`gra/src/game/zloto-access.ts:130-140` faktycznie oznacza `placedImprovementsWithZlotoTradeGrant` i
`TRADE_GRANT_ZLOTO_SYNTHETIC_KEY` tagiem `@deprecated` z komentarzem „PYTANIE-84-U3: szlaki dostarczają
stock, nie syntetyczny dostęp […] no-op do czasu migracji main.ts" — to jest realny, sprawdzony w źródle
fakt, niezależny od jakiegokolwiek testu. `tools/zloto-szlak-test.cjs` w swoim nagłówku (linie 19-24, 27-33)
OPISUJE ten sam fakt prozą.

**RUNDA 1 pomyliła „test dokumentuje ten fakt w komentarzu" z „test POTWIERDZA ten fakt przechodząc" — to
NIEPRAWDA.** Sekcja niżej pokazuje realny wynik uruchomienia: 26/45 passed. `@deprecated` w źródle jest więc
potwierdzone wyłącznie: (a) treścią komentarza w kodzie, (b) audytem 10 wołających wyżej (main.ts nigdzie nie
czyta wyniku augmentacji złota) — **NIE** przez ten plik testowy, który w dużej części wciąż asercjonuje
STARE (przedmigracyjne) zachowanie i dlatego jest czerwony.

## Wynik realny `tools/zloto-szlak-test.cjs` (RUNDA 2, uruchomiony faktycznie, nie zgadywany)

```
node tools/zloto-szlak-test.cjs   (z gra/, po rebase na main a0cef4b)
zloto-szlak-test: 26 passed, 19 failed
```

**Wszystkie 7 sekcji testu (1, 2, 3, 4, 5, F, G) mają co najmniej jedną porażkę.** Rozbicie po sekcjach —
co dokładnie failuje i dlaczego (asercje kontrolne bez odniesienia do syntetycznego klucza w tych samych
sekcjach PRZECHODZĄ — porażki są punktowe, nie całych sekcji):

| Sekcja | Fail | O co chodzi w asercji | Dlaczego pada dziś |
|---|---|---|---|
| **1** (własna kopalnia, bez szlaku) | 2/3 | `labels.includes('Złoto')` i `mennicaBuildable(...)===true` po samej `activeLabelsFor` (etykieta „Złoto" z `getResourceAccessForCity`, model oparty na etykietach z mapy) | Etykieta „Złoto" w `getResourceAccessForCity`/`collectActiveAccess` (resource-access.ts) dla WŁASNEJ kopalni bez `empireStock`/kontekstu Podatku w tym wąskim fixture nie zapala się tak, jak zakładał stary model etykiet — złoto jest dziś liczone przez `ownerHasZlotoStock(empireStock)` w innej ścieżce (production.ts/building-resource-gate.ts), nie przez `activeResourceLabels` z tego helpera w tym fixture |
| **2** (brak złoża, brak szlaku) | 1/3 | `mennicaBuildable(0, labels)===true` mimo braku Targowiska-z-dostępem — asercja zakłada „kanon magazyn": budowa Mennicy nie wymaga dostępu do złota wcale | Fixture nie ustawia żadnego `empireStock` na CITY (obiekt testowy nie ma pola `surowce`/stock) — jeśli bramka budowy `mennica` w `CITY_BUILDING_PREREQ`/`buildingResourceGateMet` w praktyce dziś odpytuje magazyn (a nie samą obecność Targowiska), pusty magazyn w tym fixture daje `false` zamiast oczekiwanego przez test `true` |
| **3** (szlak → dostęp) | 4/11 | `empireHasKopalniaZlota` po augmentacji, etykieta „Złoto" po augmentacji, `mennicaBuildable` po augmentacji, i (kontrola) `mennicaBuildable` BEZ augmentacji | To jest SERCE zarzutu: `placedImprovementsWithZlotoTradeGrant` jest no-opem, więc `augmented3` = `playerPlacedNoGold` bez zmian → `empireHasKopalniaZlota` zwraca `false` zamiast oczekiwanego przez test (przedmigracyjnie) `true`. Te 3 asercje wprost testują STARY wzorzec „augmentacja przez syntetyczny klucz" opisany w zarzucie jako martwy. Czwarta (kontrola „bez grantu") pada z tego samego powodu co sekcja 2 (magazyn pusty w fixture) |
| **4** (brak przepływu ilościowego) | 1/8 | `TRADE_ROUTE_STOCK_FLOW_KEYS` NIE zawiera `'zloto'` | Jedyna porażka w tej sekcji NIE dotyczy syntetycznego klucza augmentacji w ogóle — to osobna asercja o innej stałej eksportowanej z `trade-routes.ts`; wymaga odrębnego sprawdzenia niepowiązanego z tematem tego audytu (poza zakresem RUNDY 2 — zanotowane, nie badane głębiej) |
| **5** (parytet AI) | 4/8 | Te same 4 wzorce co sekcja 3, przesunięte na `ownerId=5/6` | Identyczna przyczyna co sekcja 3 — parytet AI dziedziczy te same złe założenia o augmentacji |
| **F** (zerwanie szlaku) | 1/5 | `mennicaBuildable(...)===true` po zerwaniu szlaku, „bramka budowy = magazyn, nie dostęp Złota" | Ta sama przyczyna co sekcja 2 (magazyn pusty w fixture) |
| **G** (kompozycja main.ts) | 6/7 | `empireHasKopalniaZlota` po kompozycji, rozmiar mapy `===2`, obecność obu kluczy syntetycznych, etykieta „Złoto", `mennicaBuildable` po kompozycji, przemienność kompozycji | Wszystkie 6 wprost testują, że po doklejeniu grantu złota mapa `placedImprovements` FAKTYCZNIE ma nowy wpis pod `TRADE_GRANT_ZLOTO_SYNTHETIC_KEY` — no-op sprawia, że mapa ma tylko 1 wpis (brązu), nie 2, więc każda z tych asercji pada z tego samego, jednego źródła (no-op) |

**Wniosek:** większość porażek (sekcje 1, 3, 5, G — 16 z 19) wynika z JEDNEJ przyczyny: test wciąż zakłada,
że `placedImprovementsWithZlotoTradeGrant` realnie dokleja syntetyczny klucz (dokładnie tak jak brąz), czyli
testuje przedmigracyjną (sprzed FALA 41 / commit `297c60c`) architekturę. Reszta (sekcje 2, F — 2 porażki)
dotyczy fixture bez skonfigurowanego magazynu państwa, niezależnie od tematu tego audytu. Jedna porażka
(sekcja 4) jest zupełnie osobnym wątkiem (stała `TRADE_ROUTE_STOCK_FLOW_KEYS`), nie zbadanym w tej rundzie.

## Decyzja co do (b): co zrobić z martwym kodem `placedImprovementsWithZlotoTradeGrant` — WYMAGA ABC MACIEJA

**RUNDA 1 napisała: „NIE usunięte — zostawione bez zmian, kontrakt zablokowany istniejącymi testami".**
**Ta decyzja jest UNIEWAŻNIONA (Evaluator RUNDY 1).** Powód: testy, które rzekomo „blokują" kontrakt
(`zloto-szlak-test.cjs` sekcje 1/3/5/G, `mennica-uspienie-test.cjs`) są już dziś w dużej części czerwone
(26/45 w `zloto-szlak-test.cjs` — patrz wyżej) i testują przedmigracyjną semantykę — nie blokują niczego
realnie, bo już nie reprezentują zamierzonego zachowania. „Zostawienie bez zmian, bo testy blokują" nie ma
oparcia w faktach.

**Prawdziwe pytanie otwarte — dwie opcje, obie wymagają decyzji Macieja (zmieniają zachowanie testów i/lub
kod, więc podlegają CLAUDE.md pkt 0 / R-PROC-ABC-BALANS, nie do rozstrzygnięcia jednostronnie przez
Operatora):**

**Opcja (i) — zmigrować `zloto-szlak-test.cjs` do modelu opartego na stanie (magazyn), analogicznie do
`mennica-uspienie-test.cjs` (naprawiony commitem `72672f9`, dziś 49/49).**
- Za: (1) usuwa martwy/mylący sygnał w bramkach — dziś "26 passed, 19 failed" wygląda jak realna czerwień
  przy każdym uruchomieniu, myli każdego kto sprawdza stan testów bez znajomości tej historii; (2) test
  faktycznie zaczyna sprawdzać PRAWDZIWY dzisiejszy mechanizm (`ownerHasZlotoAccessNow`/`empireStock`), więc
  odzyskuje wartość jako regresja dla przyszłych zmian złota, zamiast testować martwy kod.
- Przeciw: (1) wymaga przepisania min. sekcji 1/2/3/5/F/G (6 z 7 sekcji) — spory nakład, nie „drobna
  poprawka"; (2) zmienia fixture (trzeba dodać `empireStock`/magazyn do CITY, przeprojektować co sekcja 3/5/G
  w ogóle sprawdza, bo dzisiejszy model nie ma już koncepcji "syntetyczny wpis w placedImprovements" dla
  złota) — ryzyko wprowadzenia NOWYCH błędów w teście bez nadzoru Macieja nad tym, co dokładnie ma być
  sprawdzane.

**Opcja (ii) — usunąć martwy kod `placedImprovementsWithZlotoTradeGrant`/`TRADE_GRANT_ZLOTO_SYNTHETIC_KEY`
razem z jego osieroconymi testami (całe pliki lub tylko dotknięte sekcje `zloto-szlak-test.cjs`).**
- Za: (1) usuwa martwy kod I martwy test jednym ruchem — zero utrzymania kodu, który nic nie robi; (2)
  upraszcza `placedImprovementsWithTradeGrants` do jednej gałęzi (tylko brąz) — czytelniejszy kod, mniej do
  zrozumienia dla kolejnej sesji.
- Przeciw: (1) usuwa dokumentację historyczną „jak to działało przed migracją" — jeśli ktoś kiedyś zapyta
  "dlaczego złoto i brąz są niesymetryczne", ślad znika z testów (zostaje tylko w tym dokumencie decyzyjnym);
  (2) `placedImprovementsWithTradeGrants` (kompozytor) też traci sens nazwy — trzeba by zdecydować, czy
  zlikwidować cały wrapper i wrócić do bezpośredniego wołania `placedImprovementsWithBrazTradeGrant` w 10
  miejscach main.ts, co jest większą zmianą niż sama usunięta funkcja złota.

**Rekomendacja Operatora (nie decyzja — do potwierdzenia/odrzucenia przez Macieja):** Opcja (ii) wydaje się
tańsza i mniej ryzykowna (usuń martwy kod + martwe testy zamiast reanimować testy dla funkcji, która i tak
nic nie robi), ale to jest osąd produktowy/architektoniczny, nie techniczny — zgodnie z CLAUDE.md pkt 0
wymaga ID w rejestrze + pełnej formy ABC, zanim ktokolwiek to skoduje. **Operator RUNDY 2 NIE wybiera ani nie
koduje żadnej z opcji** — to jest zakres tego zlecenia (dokument decyzyjny, zero zmian w `gra/src/**`).

## Efekt dla gracza

**Żaden.** Mennica (jedyny budynek zależny od złota) i panel „Podatek"/dostęp do złota liczą się dziś
wyłącznie przez `ownerHasZlotoAccessNow` / `ownerZlotoAccessForMennicaEffective` / `empireResourceLabelSatisfied`
na `empireStock` — ścieżki, które nie dotykają `placedImprovements` w żadnym punkcie. Kod w
`placedImprovementsWithZlotoTradeGrant` jest martwy, ale nieszkodliwy interfejs po migracji U-3.

## Skutek uboczny audytu — ZAMKNIĘTE W RUNDZIE 2 (RUNDA 1 patrzyła na przestarzały worktree)

**RUNDA 1 zgłosiła tu, że `tools/mennica-uspienie-test.cjs` jest 39/49 passed, 10 fail, przez nieaktualną
etykietę „Danina"** i dopisała wpis `P-TEST-MENNICA-USPIENIE-STALE` do `dyspozycje/PYTANIA-OTWARTE.md`.
**To był duplikat martwego wpisu — problem już nie istnieje.** RUNDA 1 pracowała na worktree bazującym na
przestarzałym commicie `f3437e3` (30 commitów za `main`); etykieta „Danina" → „Podatek" (FALA 41,
`danina-nazwa.ts`) została naprawiona w międzyczasie na `main` commitem `72672f9`. Po rebase RUNDY 2 na
aktualny `main` (`a0cef4b`):

```
node tools/mennica-uspienie-test.cjs
mennica-uspienie-test: 49 passed, 0 failed
```

**Wpis `P-TEST-MENNICA-USPIENIE-STALE` usunięty z `dyspozycje/PYTANIA-OTWARTE.md` w tej rundzie** — zweryfikowano
przed usunięciem przez realne uruchomienie testu na zrebase'owanym drzewie (nie przez samo zaufanie do
`WERSJE.md`/commitów).

## Pliki-dowody

| Plik | Rola |
|------|------|
| `gra/src/main.ts:3356-3383` | `placedImprovementsWithBrazTradeGrant` + `placedImprovementsWithTradeGrants` (kompozycja) |
| `gra/src/main.ts:3396-3400` | `ownerHasZlotoAccessNow` — realna bramka OR, niezależna od `placedImprovements` |
| `gra/src/game/zloto-access.ts:1-14, 130-145` | Nagłówek migracji U-3 + `@deprecated` no-op (linie niezmienione — plik nie dotknięty commitami między RUNDĄ 1 a 2) |
| `gra/src/game/resource-access.ts:280-323` | `collectActiveAccess` — hex-scan pomija syntetyczne klucze; Złoto liczone osobno z `empireStock` |
| `gra/src/game/building-resource-gate.ts:59-71, 254-` | Bramka budowy/runtime Mennicy — `empireStock`, nie `placedImprovements` |
| `gra/tools/zloto-szlak-test.cjs` | Realnie uruchomiony w RUNDZIE 2: **26 passed, 19 failed** — patrz sekcja „Wynik realny" wyżej; nagłówek pliku (linie 19-24) opisuje prozą @deprecated, ale sam test NIE potwierdza tego przechodząc |

## Bramki (stan po audycie RUNDY 2 — zero zmian kodu w `gra/src/**`/`gra/data/**`)

| Bramka | Wynik |
|--------|-------|
| `npx tsc --noEmit` (z `gra/`) | ✅ 0 błędów |
| `node tools/zloto-szlak-test.cjs` | **26 passed, 19 failed** — dowód, NIE cel (patrz sekcja „Wynik realny" wyżej); NIE jest to regresja tej sesji, zero zmian w `gra/src/**` w obu rundach |
| `node tools/mennica-uspienie-test.cjs` | ✅ 49/49 — naprawiony na `main` commitem `72672f9`, PRZED tym audytem; RUNDA 1 widziała 39/49 na przestarzałym worktree (patrz sekcja wyżej) |
| `node tools/mennica-magazyn-test.cjs` | ✅ 41/41 |
| `node tools/waluta-mennica-test.cjs` | ✅ 57/57 |
| `vite build` | nie dotyczy — main.ts NIEDOTKNIĘTY (zero zmian kodu w obu rundach) |

## RUNDA 3 (2026-08-07) — migracja `zloto-szlak-test.cjs`, decyzja (b)=Opcja (i)=A wykonana

**Zlecenie:** Maciej wybrał **Opcję (i)=A** z RUNDY 2 ("zmigrować `zloto-szlak-test.cjs` do modelu opartego na
stanie, analogicznie do `mennica-uspienie-test.cjs`", zamigrowanego wcześniej commitem `72672f9`). Operator
przeczytał `mennica-uspienie-test.cjs` jako wzorzec stylu/podejścia PRZED napisaniem czegokolwiek (zgodnie
z instrukcją zlecenia).

**Zakres:** WYŁĄCZNIE `gra/tools/zloto-szlak-test.cjs` (przepisany w całości — nagłówek, helpery, 7 sekcji).
Zero zmian w `gra/src/**`/`gra/data/**` — `placedImprovementsWithZlotoTradeGrant` i
`TRADE_GRANT_ZLOTO_SYNTHETIC_KEY` (zloto-access.ts) ZOSTAJĄ jako deprecated no-op, nietknięte, poza zakresem
tej rundy (zgodnie z instrukcją zlecenia).

### Co dokładnie się zmieniło w teście, sekcja po sekcji

| Sekcja | Przed (26p/19f) | Po migracji | Co się zmieniło |
|---|---|---|---|
| **1** (własna kopalnia, bez szlaku) | 2/3 fail | ✅ wszystkie PASS (+1 nowa kontrola) | Fixture buduje `activeLabelsFor`/`mennicaBuildable` z realnym `empireStock={zloto:1}` (symuluje zapas już wyprodukowany przez kopalnię) zamiast pustych opcji. Dodano kontrolę: sama Kopalnia na mapie BEZ zapasu w magazynie → Mennica NIEBUDOWALNA (dowód, że bramka budowy patrzy wyłącznie na magazyn, nigdy na mapę, dla złota — w przeciwieństwie do Brązu/Żelaza). |
| **2** (brak złoża, brak szlaku) | 1/3 fail | ✅ wszystkie PASS | Fixture teraz ustawia `ctx.empireResourceStock` jawnie (przedtem w ogóle nie istniało w ctx — helper `ctxFor` używał nieistniejącego pola `activeResourceLabels` zamiast realnego `empireResourceStock`/`empireActiveResourceLabels`). Oczekiwanie ODWRÓCONE: zweryfikowano w `building-resource-gate.ts` (`DEPOSIT_LINKED_BUILDING_LABELS.mennica = ['Złoto']` + `CITY_BUILDING_PREREQ.mennica = 'targowisko'`, komentarz linia 111 „obok bramki surowcowej Złota powyżej"), że Mennica wymaga OBU warunków (Targowisko W MIEŚCIE **ORAZ** zapas Złota w magazynie) — Targowisko samo NIGDY nie wystarczał(a) budowie Mennicy, stara asercja „kanon magazyn: dostęp nie jest wymagany wcale" była błędnym założeniem, nie faktem z kodu. |
| **3** (szlak → dostęp, SERCE tematu) | 4/11 fail | ✅ wszystkie PASS (+4 nowe asercje) | Usunięto test „augmentacji przez syntetyczny klucz" (`empireHasKopalniaZlota`/etykieta/`mennicaBuildable` PO `placedImprovementsWithZlotoTradeGrant`). W jego miejsce: (a) realny przepływ ilościowy przez trasę (`computeTradeRouteResourceFlow`, TRADE_ROUTE_STOCK_FLOW_KEYS zawiera 'zloto' — patrz sekcja 4) zasila `empireStock`, który następnie otwiera `ownerHasZlotoStock`/etykietę/`mennicaBuildable`/`buildingRuntimeGateMet` (fallback); (b) `buildingRuntimeGateMet` z parametrem `resolveOwnerZlotoAccess` — bezpośredni odpowiednik main.ts `ownerHasZlotoAccessNow` — testuje RUNTIME gate reagujący na sam boolean-grant (bez stocku); (c) kontrola: BUILD gate (w przeciwieństwie do RUNTIME) NIE reaguje na sam boolean-grant bez realnego zapasu — dokumentuje realną asymetrię build-vs-runtime; (d) zachowany dowód no-op (`placedImprovementsWithZlotoTradeGrant` zwraca ten sam obiekt niezależnie od `hasTradeGrant`). |
| **4** (przepływ ilościowy) | 1/8 fail | ✅ wszystkie PASS | **ZBADANE, NIE bug — świadoma, udokumentowana decyzja Maciej.** `TRADE_ROUTE_STOCK_FLOW_KEYS` (`trade-routes.ts:1057`) **ZAWIERA** `'zloto'` — potwierdzone wprost w `docs/decyzje/PYTANIE-84.md` wiersz **PYTANIE-84-U3=A**: „szlaki dostarczają sztuki do magazynu państwa co turę, nie tylko flagę dostępu" oraz w komentarzu źródłowym `trade-routes.ts:928-931`. Stara asercja (`!TRADE_ROUTE_STOCK_FLOW_KEYS.includes('zloto')`) testowała PIERWOTNY, PRZEDMIGRACYJNY model (PYTANIE-77=A, 2026-07-25 — złoto jak Koń, dostęp bez przepływu), świadomie zastąpiony PYTANIE-84-U3=A (2026-07-27). Oczekiwanie test ODWRÓCONE (teraz asercjonuje, że zloto JEST w liście) + dopisany dowód poprawności mechanizmu (kierunek transferu partner→gracz, wysokość = nadwyżka ponad `minStockReserve`). Zero zmian w `gra/src/**` — poprawiony wyłącznie test, którego stare oczekiwanie było przestarzałe. |
| **5** (parytet AI) | 4/8 fail | ✅ wszystkie PASS (+4 nowe asercje) | Te same 4 wzorce co sekcja 3, przesunięte na ownerId=5/6 (kopalnia partnera 6→gracz AI 5), plus ten sam `buildingRuntimeGateMet`+resolver i kontrola „bez zapasu → niebudowalna" dla obu stron. |
| **F** (zerwanie szlaku) | 1/5 fail | ✅ wszystkie PASS (+1 nowa asercja) | Ta sama przyczyna co sekcja 2 (magazyn pusty w starym fixture) — ALE odkryto dodatkową, realną nuansę: magazyn zgromadzony PRZED zerwaniem szlaku (z sekcji 3) **PRZETRWAŁ** zerwanie (bramka budowy nie sprawdza, czy trasa wciąż istnieje, tylko bieżący stan magazynu), podczas gdy boolean-grant (RUNTIME) jest cofnięty natychmiast — oryginalny komentarz „bramka budowy = magazyn, nie dostęp Złota" okazał się TRAFNY w duchu, tylko fixture nie miał żadnego magazynu do przetestowania tej tezy. |
| **G** (kompozycja main.ts) | 6/7 fail | ✅ wszystkie PASS (+1 nowa asercja) | Wszystkie 6 starych asercji testowało, że kompozycja DOKLEJA syntetyczny wpis złota do `placedImprovements` (2 wpisy w mapie) — to jest DOKŁADNIE zachowanie, które już nie istnieje (no-op = zamierzony, PYTANIE-84-U3). Przepisano: kompozycja ma **dokładnie 1 wpis** (tylko brązu), `empireHasKopalniaZlota` po kompozycji = **false** (no-op), ALE dostęp do złota mimo to działa przez zupełnie inną, niezależną ścieżkę (`empireStock` → `ownerHasZlotoStock`/etykieta/`mennicaBuildable`) — dokładnie zgodnie ze zleceniem: „mapa nie dodaje nic dla złota, ale dostęp przez magazyn działa". |

### Wynik testu docelowego (cel zlecenia: WSZYSTKIE asercje PASS)

```
node tools/zloto-szlak-test.cjs   (z gra/)
zloto-szlak-test: 54 passed, 0 failed
```

**54/54 — cel osiągnięty.** (Liczba asercji wzrosła z 45 do 54 — kilka sekcji dostały dodatkowe „kontrola"
asercje dokumentujące realne asymetrie build-vs-runtime i mapa-vs-magazyn odkryte podczas migracji, patrz
tabela wyżej.)

### Bramki (RUNDA 3, z `gra/`)

| Bramka | Wynik |
|--------|-------|
| `npx tsc --noEmit` | ✅ 0 błędów (test jest `.cjs`, zero zmian `.ts`) |
| `node tools/zloto-szlak-test.cjs` | ✅ **54 passed, 0 failed** (cel osiągnięty, było 26p/19f) |
| `node tools/mennica-uspienie-test.cjs` | ✅ 49/49 — plik NIETKNIĘTY tą rundą, zielony jak przed migracją |
| `node tools/mennica-magazyn-test.cjs` | ✅ 41/41 |
| `node tools/waluta-mennica-test.cjs` | ✅ 57/57 |
| `vite build` | nie dotyczy — zero zmian w `gra/src/**`/`gra/data/**` |

### Pliki zmienione w RUNDZIE 3

| Plik | Zmiana |
|------|--------|
| `gra/tools/zloto-szlak-test.cjs` | Przepisany w całości (helpery + 7 sekcji) — model empireStock zamiast syntetycznego klucza augmentacji |
| `docs/decyzje/R-MENNICA-BRAZ-ZLOTO-ASYMETRIA-Q1.md` | Ta sekcja (RUNDA 3) + status na górze pliku |

**Kod produkcyjny (`gra/src/**`/`gra/data/**`) NIETKNIĘTY** — zero zmian, zgodnie z zakresem zlecenia.
`placedImprovementsWithZlotoTradeGrant`/`TRADE_GRANT_ZLOTO_SYNTHETIC_KEY` zostają jako deprecated no-op.
