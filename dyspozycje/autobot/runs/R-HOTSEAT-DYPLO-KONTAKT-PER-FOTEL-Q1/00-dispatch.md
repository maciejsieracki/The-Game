# Dispatch — R-HOTSEAT-DYPLO-KONTAKT-PER-FOTEL-Q1

## Kontekst

Zidentyfikowane w `R-HOTSEAT-ETAP8-DYPLOMACJA-RECON-Q1` §4 (ABC-Q6, właściciel wybrał
„osobny temat PRZED Etapem 8"): kontakt/odkrycie dyplomatyczne to WCIĄŻ globalny stan
(3 zmienne modułu `main.ts`: `diplomaticContactEstablished`, `diplomaticallyDiscoveredOwners`,
`diplomaticDiscoveryPopupShown` — wszystkie `Set<number>`, main.ts:7959-7963), NIE
per-fotel. Skutek: jeśli fotel A odkryje AI(X) (klik na obce miasto/jednostkę, kontakt
przez handel/wojnę), fotel B dostaje `layer !== 'pre_contact'` dla AI(X), mimo że sam
nigdy tam nie był — dokładnie ta sama klasa błędu co `playerEverOwnedCity` naprawiony
w `R-HOTSEAT-DRUGI-FOTEL-NIE-DOSTAJE-TURY-Q1` (właśnie zintegrowany, commit `21045e29`).
Wzorzec docelowy identyczny: `Map<humanOwnerId, Set<number>>`, wzorem `exploredByHuman`/
`playerStateByHuman` (Etap 1) i teraz `playerEverOwnedCityByOwner` (temat powyżej).

**To jest duża migracja** (porównywalna skalą do Etapu 6b/6d, ~90 wystąpień trzech nazw
w `main.ts` na dzień dispatchu — `grep -n "diplomaticallyDiscoveredOwners\|
diplomaticContactEstablished\|diplomaticDiscoveryPopupShown\|getDiplomaticContacts"
gra/src/main.ts` daje aktualną, wiążącą listę — NIE ufaj numerom linii poniżej, linie
przesuwają się z każdym commitem, traktuj je jako PRZYKŁADY kategorii, nie wyczerpującą
listę).

## GOAL

Kontakt/odkrycie dyplomatyczne jest per-fotel: jeśli fotel A odkrył AI(X), fotel B widzi
AI(X) jako nieodkryte, dopóki sam go nie odkryje. Zero regresji: gra jednoosobowa
zachowuje się DOKŁADNIE jak dziś (fotel 1 = jedyny obserwator, identyczne z dzisiejszym
zachowaniem globalnym).

## Wzorzec migracji

3 zmienne modułu → 3 `Map<number, Set<number>>` (klucz = `humanOwnerId` PATRZĄCEGO
fotela, wartość = zbiór `ownerId` odkrytych/skontaktowanych przez TEN fotel), wzorem
`exploredByHuman: Map<number, Set<string>>` (main.ts ok. 10574, już istniejący,
sprawdzony wzorzec w tym samym pliku). Konkretnie:

- `diplomaticContactEstablished` → `diplomaticContactEstablishedByHuman`
- `diplomaticallyDiscoveredOwners` → `diplomaticallyDiscoveredOwnersByHuman`
- `diplomaticDiscoveryPopupShown` → `diplomaticDiscoveryPopupShownByHuman`

**Reguła dla odczytów** (`.has(ownerId)`, `getDiplomaticContacts()`, itp.): domyślnie
per-AKTYWNY fotel — `xByHuman.get(ME())?.has(ownerId) ?? false` (albo helper
`xForOwner(humanOwnerId = ME())`, analogicznie do `isAwaitingFirstPlayerCity(ownerId =
ME())` z poprzedniego tematu). Wyjątek: miejsca gdzie funkcja JUŻ przyjmuje jawny
`humanOwnerId`/`viewerOwnerId` param (np. wewnątrz pętli po `humanSeats.humanOwnerIds`)
— użyj TEGO parametru, nie `ME()`.

**Reguła dla zapisów** (`.add(ownerId)`): domyślnie fotel PRZEPROWADZAJĄCY akcję
odkrywającą (najczęściej `ME()`, bo to gracz klika/wchodzi w kontakt) — ALE sprawdź
KAŻDY call site indywidualnie, niektóre miejsca (np. reakcja na wojnę/atak AI, main.ts
ok. 22180/22268/22396-22397 na dzień dispatchu, funkcje `attackerId`/`targetId`) mają
już w kontekście konkretny `ownerId` strony ludzkiej — użyj GO, nie zgaduj `ME()` tam
gdzie kontekst mówi inaczej. Przykład z audytu (main.ts ok. 10186,
`offerForeignCityInteraction`): `diplomaticallyDiscoveredOwners.add(ownerId)` gdzie
`ownerId = city.ownerId` to strona ODKRYWANA (AI) — brakujący klucz to strona
ODKRYWAJĄCA, którą trzeba dodać (`ME()`, bo to reakcja na klik gracza).

**Save/load** (main.ts ok. 28965-28967 serializacja, 37035-37058 odtwarzanie): dziś
zapisuje/odczytuje 3 płaskie tablice `number[]`. Zmień na strukturę per-owner (np.
`Record<string, number[]>` z kluczem `String(humanOwnerId)`, wzorem istniejącej
serializacji `humanSeats`/`playerStateByHuman` gdzieś w tym samym bloku save/load —
znajdź i naśladuj). Zachowaj wsteczną kompatybilność z zapisami sprzed tej zmiany:
stary format (płaska tablica) → przypisz WYŁĄCZNIE do `HUMAN_OWNER_PRIMARY` (fotel 1),
zgodnie z tym co i tak było jedynym zachowaniem przed tym tematem.

**Debug haki testowe** (`__hotSeatTestDebug`, `__sojuszWidocznoscTestDebug`,
`__dyploMapaOdkrycieTestDebug`, `isDiplomaticallyDiscovered` na obiekcie eksportowanym
main.ts ok. 22242) — zaktualizuj sygnatury o opcjonalny `humanOwnerId` (domyślnie `ME()`
lub `HUMAN_OWNER_PRIMARY`, zależnie od tego co bardziej pasuje do istniejących
wywołujących testów) tak, żeby istniejące testy Playwright korzystające z tych haków
NADAL działały bez zmian w treści testów (parametr opcjonalny, wartość domyślna = dawne
zachowanie jednoosobowe).

## Reguła przeciw samooszukiwaniu (ANTY-HALUCYNACYJNA)

Zakaz uznania tematu za zamknięty na podstawie samego czytania kodu. Wymagany dowód na
żywym Chromium: hot-seat z dwoma fotelami, fotel 1 realnie odkrywa AI(X) (klik na obce
miasto/jednostkę LUB kontakt przez wojnę/handel), kończy turę → fotel 2 aktywny → DOWÓD
że fotel 2 widzi AI(X) jako NIEODKRYTE (`layer === 'pre_contact'` albo analogiczny stan
z `diplomacyLayerForOwner`) — zrzut stanu, nie deklaracja. Następnie fotel 2 sam odkrywa
AI(X) → DOWÓD że TERAZ widzi je jako odkryte, BEZ wpływu na to co widzi fotel 1 dla
INNYCH, nieodkrytych przez nikogo AI. Regresja: gra jednoosobowa — identyczne zachowanie
jak przed tematem (jeden fotel = jedyny obserwator, jak dziś).

## Binarne kryterium sukcesu

Nowa bramka `gra/tools/hotseat-dyplo-kontakt-per-fotel-test.cjs` dowodząca scenariusza
wyżej PASS ORAZ `tsc --noEmit` czysty ORAZ 5 bramek referencyjnych (logic-test,
tech-tree-test, research-test, unit-replace-test, combat-test) zielone ORAZ zero
regresji: `hotseat-etap5-no-leak-test.cjs`, `hotseat-etap6f-part2-data-test.cjs`,
`hotseat-etap6f-part2-ui-test.cjs`, `hotseat-drugi-fotel-tura-test.cjs` nadal PASS ORAZ
istniejące testy dyplomacji zależne od `diplomaticallyDiscoveredOwners`/
`diplomaticContactEstablished` (przeszukaj `gra/tools/*.cjs` po tych nazwach —
prawdopodobnie kilka: audiencja, sojusz-widoczność, dyplo-mapa-odkrycie) nadal PASS.

## Allowlista

- `gra/src/main.ts` (cały plik dozwolony ze względu na naturę tematu — 90 wystąpień
  rozproszonych po całym pliku; każda zmiana musi być uzasadniona w raporcie)
- nowy plik `gra/tools/hotseat-dyplo-kontakt-per-fotel-test.cjs`
- ISTNIEJĄCE pliki testowe, których asercje zależą od starego globalnego zachowania i
  wymagają aktualizacji ZE WZGLĘDU na tę migrację (np. jeśli któryś test explicite
  zakłada `diplomaticallyDiscoveredOwners` jako płaski `Set` — zaktualizuj, udokumentuj
  w raporcie z cytatem)

Zakazane bezwzględnie: `gra/src/ui/newGameFlow.ts`, `gra/src/map/cluster-spawn.ts`,
`gra/src/game/cluster-start.ts`, pliki z sekretami,
`docs/decyzje/R-HOTSEAT-DYPLO-KONTAKT-PER-FOTEL-Q1.md`, `.git/**`,
`dyspozycje/WERSJE.md`, `gra-robocza/ROBOCZA-MANIFEST.json`, `playbook.json`.

## Izolacja

Worktree `/home/user/wt-hotseat-dyplo-kontakt`, gałąź
`autobot/R-HOTSEAT-DYPLO-KONTAKT-PER-FOTEL-Q1`, baza `origin/main` (jawnie, weryfikacja
`git merge-base` przed integracją). C-001: zakaz `npm run build`/`dev` w `gra/`;
dozwolona wyłącznie
`node ./node_modules/vite/bin/vite.js build --outDir <katalog spoza repo> --emptyOutDir`
oraz `node ./node_modules/typescript/bin/tsc --noEmit`.

## Procedura naprawcza przy FAIL

Evaluator wskazuje jeden konkretny defekt i poprawkę; runda N+1 na TYM SAMYM ID i TEJ
SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

## Ograniczenia wyjścia

Maks. ok. 500 słów w raporcie (podniesione ze względu na skalę migracji); ścieżki+SHA
zamiast diffu; zakaz `git add -A`; przy decyzji produktowej — STATUS: DECISION_REQUIRED.
Nie integrujesz, nie deployujesz, nie pushujesz.
