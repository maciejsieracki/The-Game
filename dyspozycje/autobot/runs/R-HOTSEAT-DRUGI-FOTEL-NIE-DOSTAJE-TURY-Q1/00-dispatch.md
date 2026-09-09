# Dispatch — R-HOTSEAT-DRUGI-FOTEL-NIE-DOSTAJE-TURY-Q1 (KRYTYCZNY, priorytet nad wszystkim)

## Kontekst i zgłoszenie właściciela (2026-09-09, na żywo po FALA 367)

Właściciel włączył hot-seat (dwa fotele ludzkie) i zgłosił: „po zakończeniu tury tura
wraca znowu do pierwszego gracza. Drugi gracz się nie pojawia." Dodatkowo: fotel 2
powinien mieć taką samą możliwość ręcznego wskazania dokładnego miejsca pierwszego
miasta jak fotel 1 (dziś system wyznacza tylko OKOLICĘ startową — dokładny heks miasta
gracz 1 wybiera sam, klawiszem `B`/`tryFoundPlayerCityAt`).

**To jest bug w istniejącym, wcześniej niedostępnym do przetestowania obszarze** — dopiero
`R-HOTSEAT-ETAP6F-PART2-UI-Q1` (właśnie zintegrowany) dało PIERWSZĄ realną możliwość
stworzenia fotela 2 z menu, więc ten obszar nigdy wcześniej nie był ćwiczony end-to-end.
Znaleziono orkiestratorsko DWIE potwierdzone, konkretne przyczyny (cytaty niżej) — GOAL
tego tematu to je naprawić, PLUS audyt sąsiednich miejsc o tej samej naturze.

## Przyczyna 1 — `advanceSeat()` nigdy nie przełącza fotela

`main.ts:34145`:
```
function advanceSeat(): void {
  endActiveHumanTurn(HUMAN_OWNER_PRIMARY);
}
```
Komentarz nad funkcją (main.ts:34139-34144) mówi wprost: to jest „orkiestrator foteli",
ale ciało jest ŚWIADOMYM placeholderem sprzed istnienia drugiego fotela („Dziś jeden
fotel człowieka... nic więcej nie trzeba robić tutaj"). `switchActiveHuman(newOwnerId)`
(main.ts:10620) — funkcja w PEŁNI zaimplementowana w Etapie 5 (zamyka wszystkie panele,
izoluje mgłę/ekonomię per fotel) — ma w komentarzu przy definicji (main.ts:9921/9930-ish,
„Przyszły `advanceSeat()`... będzie jedynym produkcyjnym wołającym") jawnie udokumentowaną
INTENCJĘ, że `advanceSeat()` miał ją wołać. **Nigdy tego nie zrobiono.** Potwierdzone
przez `grep -n "switchActiveHuman("` — jedyne wywołanie w całym `main.ts` to alias w
`__hotSeatTestDebug` (main.ts:23120, testowy hak), ZERO wywołań produkcyjnych. Skutek:
`humanSeats.activeHumanOwnerId` nigdy się nie zmienia w realnej rozgrywce (jedyne
przypisania: main.ts:10538 inicjalizacja na `HUMAN_OWNER_PRIMARY`, main.ts:10718 wewnątrz
`switchActiveHuman` — nigdy wołanej, main.ts:36482 save/load restore) — `ME()` jest
zawsze fotelem 1, niezależnie od kliknięć „Zakończ turę".

## Przyczyna 2 — `playerEverOwnedCity` to globalny singleton, nie per-fotel

`main.ts:2574`: `let playerEverOwnedCity = false;` — pojedyncza flaga, NIE
`Map<ownerId, boolean>` (kontrast ze wzorcem `playerStateByHuman`/`exploredByHuman`
Etapu 1, już użytym w tym samym pliku). Wszystkie miejsca zapisu (main.ts:12825 — po
założeniu miasta przez fotel 1 bez sprawdzenia `ownerId`; main.ts:14016
`if (newOwner === 0) playerEverOwnedCity = true;`; main.ts:28051
`if (atkOwner === 0) playerEverOwnedCity = true;`; main.ts:35807/36033 reset scenariuszy
dev; main.ts:36472 `playerEverOwnedCity = cities.some(c => c.ownerId === 0);`) sprawdzają
WYŁĄCZNIE `ownerId === 0` (fotel 1). `isAwaitingFirstPlayerCity()` (main.ts:9819-9821,
`computeAwaitingFirstPlayerCity(playerEverOwnedCity, cities)`) czyta TĘ SAMĄ globalną
flagę bez względu na to, które ME() jest aktywne. Skutek: w chwili gdy fotel 1 zakłada
swoje pierwsze miasto, flaga staje się `true` NA ZAWSZE — nawet PO naprawie Przyczyny 1
(fotel 2 realnie aktywny), fotel 2 NIGDY nie dostanie trybu „załóż pierwsze miasto"
(`isAwaitingFirstPlayerCity()` zwróci `false` od razu), bo silnik uzna że „gracz już
kiedyś miał miasto" — myląc dwa różne foteli za jedną tożsamość.

**To był ZNANY, udokumentowany, świadomie odłożony dług** — rejestr zamknięcia
`R-HOTSEAT-ETAP6F-PART2-DATA-Q1` (`dyspozycje/REJESTR-PROSB-I-ZADAN.md`) nazwał wprost:
„konsumenci `playerStartHex` poza jednym strażnikiem (kamera, save, założenie
pierwszego miasta) pozostają singularne — nieosiągalne bez UI drugiego fotela." UI
drugiego fotela WŁAŚNIE powstało (`R-HOTSEAT-ETAP6F-PART2-UI-Q1`) — dług jest teraz
aktywny i blokujący.

## Przyczyna 3 (pochodna 2) — literalny `ownerId === 0` w `foundingTerritoryOpts`

`main.ts:9843`: `if (ownerId === 0 && isAwaitingFirstPlayerCity()) return {};` — ten sam
wzorzec literalnego `0` co hardkodowany strażnik naprawiony w części (i) Etapu 6f
(`currentVisible()` → `playerStartHexFor(ME())`). Ta konkretna linia NIE była w
allowlistach żadnego z dotychczasowych pod-tematów Etapu 6f/6a-6f — pominięta.

## Przyczyna 4 (pochodna 2) — `playerStartHex` (singularny) w konsumentach reveal/kamera

`grep -n "\bplayerStartHex\b" main.ts | grep -v "ByOwner\|StartHexFor\|secondPlayerStartHex"`
daje m.in.: `main.ts:9828` (`isInStartReveal`, krąg widoczności przed założeniem miasta),
`main.ts:9977-9978` (`startRevealKeysForRiverFog`), `main.ts:12752-12753` (fokus kamery na
heksie startowym). Wszystkie czytają WYŁĄCZNIE `playerStartHex` (alias fotela 1,
main.ts:2550-2560, jawnie NIE per-owner z komentarza) zamiast `playerStartHexFor(ME())`
(już istniejąca funkcja z części DATA-Q1). Skutek: fotel 2 widziałby krąg odkrycia i
fokus kamery przy heksie fotela 1, nie swoim własnym.

## ZADANIE (GOAL)

Po naprawie: fotel 1 kończy turę → fotel 2 staje się aktywny (BEZ przechodzenia świata/AI),
dostaje WŁASNY tryb „załóż pierwsze miasto" przy WŁASNYM heksie startowym (krąg odkrycia,
fokus kamery, tryb budowy — wszystko przy heksie fotela 2), zakłada miasto, kończy turę →
DOPIERO TERAZ realnie przechodzi świat/AI (`runWorldEndTurn`), numer tury rośnie, aktywny
fotel wraca do fotela 1 na nową turę. Gra jednoosobowa (1 fotel człowieka) zachowuje się
DOKŁADNIE jak dziś — zero dodatkowych kliknięć, zero zmiany zachowania.

## Zakres implementacji

1. **`advanceSeat()`** (main.ts ~34145) — realna logika: ustal aktywnego człowieka
   (`ME()`/`humanSeats.activeHumanOwnerId`), znajdź KOLEJNY fotel w
   `humanSeats.humanOwnerIds`, który jeszcze nie kończył tury w tej rundzie. Jeśli
   istnieje → `switchActiveHuman(nextOwnerId)`, **NIE** wołaj `endActiveHumanTurn`
   (świat/AI NIE przechodzi, dopóki nie skończą wszyscy ludzie). Jeśli aktywny fotel
   jest OSTATNIM w rundzie → `endActiveHumanTurn(activeOwnerId)` (realne przejście
   świata — dziś już poprawnie bankuje WSZYSTKIE fotele przez pętle po
   `humanSeats.humanOwnerIds`, patrz Etap 6c), a PO jego zakończeniu (nowa tura)
   przełącz aktywnego człowieka z powrotem na PIERWSZY fotel (`humanSeats.humanOwnerIds[0]`)
   na start nowej rundy. Potrzebny nowy, jawny stan „które fotele już skończyły turę w
   tej rundzie" (np. `Set<number>` czyszczony przy starcie każdej nowej tury) — zaprojektuj
   najprościej możliwe rozwiązanie spójne z istniejącym stylem pliku.
2. **`playerEverOwnedCity`** (main.ts:2574) → per-owner (`Map<number, boolean>` lub
   `Set<number>`, wzorem `playerStateByHuman`). Zaktualizuj WSZYSTKIE 6 miejsc zapisu
   (12825, 14016, 28051, 35807, 36033, 36472) na wersję per-owner (właściwy `ownerId`
   z kontekstu każdego call site, NIE zawsze `ME()` — np. 14016/28051 mają już zmienną
   `newOwner`/`atkOwner`, użyj JEJ, nie `ME()`). `isAwaitingFirstPlayerCity()` przyjmuje
   opcjonalny `ownerId` param domyślnie `ME()` — WSZYSTKIE dzisiejsze wywołania
   bezparametrowe (main.ts:9827, 9864, 9977, 12849, 20637, 20787, 21535, 21556, 21558)
   NIE wymagają zmiany (domyślny `ME()` = „aktywny fotel", dokładnie to czego potrzebują).
3. **`foundingTerritoryOpts`** (main.ts:9843) — zamień literalny `ownerId === 0` na
   poprawne porównanie (prawdopodobnie `isMe(ownerId) && isAwaitingFirstPlayerCity(ownerId)`
   po zmianie z p.2 — dobierz dokładną formę zgodną z resztą funkcji, `ownerId` to
   parametr tej funkcji, nie zmienna globalna).
4. **`playerStartHex` w main.ts:9828, main.ts:9977-9978, main.ts:12752-12753** — zamień
   na `playerStartHexFor(ME())` (funkcja już istnieje z `R-HOTSEAT-ETAP6F-PART2-DATA-Q1`).
   NIE dotykaj debug-hooka `__hotSeatTestDebug` (main.ts:22949/22979-22980) bez wyraźnego
   uzasadnienia — to kod testowy, sprawdź czy wymaga zmiany czy jest celowo scoped do
   fotela testowanego jawnie przez wywołującego.
5. **Audyt (nie tylko naprawa wskazanych linii)**: przeszukaj `main.ts` pod kątem
   INNYCH miejsc tej samej natury w obszarze „pierwsze miasto"/„awaiting first city"
   (literalny `ownerId === 0`, `=== HUMAN_OWNER_PRIMARY`, lub globalny stan bez
   `ByOwner`/`ByHuman` w nazwie) powiązanych z zakładaniem pierwszego miasta, korzystając
   z tych samych wzorców wyszukiwania co wyżej. Jeśli znajdziesz dodatkowe — napraw w
   tej samej rundzie (allowlista pozwala na cały `main.ts`, patrz niżej), udokumentuj
   w raporcie z cytatem plik+linia.

## Reguła przeciw samooszukiwaniu (ANTY-HALUCYNACYJNA)

Zakaz uznania tego tematu za zamknięty na podstawie samego czytania kodu lub testu
sprawdzającego WYŁĄCZNIE `humanSeats.activeHumanOwnerId` bez przejścia PRAWDZIWEGO
scenariusza end-to-end na żywym Chromium: (a) start gry z hot-seat WŁĄCZONYM z menu
(realne kliknięcia przez `newGameFlow.ts`, nie hak testowy budujący stan ręcznie),
(b) fotel 1 zakłada pierwsze miasto realnym `B`/klikiem, (c) fotel 1 klika „Zakończ
turę", (d) DOWÓD że `ME()`/`humanSeats.activeHumanOwnerId` faktycznie zmienił się na
fotel 2 (zrzut stanu), (e) DOWÓD że fotel 2 jest w trybie `isAwaitingFirstPlayerCity()===true`
przy WŁASNYM heksie startowym (różnym od fotela 1), (f) fotel 2 zakłada miasto, kończy
turę, (g) DOWÓD że DOPIERO TERAZ numer tury wzrósł i aktywny fotel wrócił na fotel 1.
Sam fakt że `switchActiveHuman()` istnieje i przechodzi swój STARY test z Etapu 5 NIE
jest dowodem — ten test nigdy nie wołał jej z `advanceSeat()`.

## Binarne kryterium sukcesu

Nowa bramka `gra/tools/hotseat-drugi-fotel-tura-test.cjs` dowodząca scenariusza (a)-(g)
powyżej PASS, ORAZ scenariusz regresji: gra JEDNOOSOBOWA (bez włączania fotela 2) kończy
turę i przechodzi świat/AI PRZY PIERWSZYM kliknięciu „Zakończ turę" (zero dodatkowego
kroku) — PASS. ORAZ `tsc --noEmit` czysty. ORAZ 5 bramek referencyjnych (logic-test,
tech-tree-test, research-test, unit-replace-test, combat-test) zielone. ORAZ ZERO
regresji: `hotseat-etap5-no-leak-test.cjs`, `hotseat-etap6f-part2-data-test.cjs`,
`hotseat-etap6f-part2-ui-test.cjs` nadal PASS.

## Allowlista

- `gra/src/main.ts` (cały plik dozwolony ze względu na naturę tematu — orkiestracja
  tury + pierwsze miasto dotykają wielu miejsc; NIE zmieniaj niczego niezwiązanego z
  GOAL tego tematu — każda zmiana musi być uzasadniona w raporcie cytatem)
- nowy plik `gra/tools/hotseat-drugi-fotel-tura-test.cjs`

Zakazane bezwzględnie: `gra/src/map/cluster-spawn.ts`, `gra/src/game/cluster-start.ts`,
`gra/src/ui/newGameFlow.ts` (część UI kreatora jest już zamknięta i zweryfikowana —
ten temat NIE dotyczy kreatora, tylko rozgrywki PO starcie), pliki z sekretami,
`docs/decyzje/R-HOTSEAT-DRUGI-FOTEL-NIE-DOSTAJE-TURY-Q1.md`, `.git/**`,
`dyspozycje/WERSJE.md`, `gra-robocza/ROBOCZA-MANIFEST.json`, `playbook.json`.

## Izolacja

Worktree `/home/user/wt-hotseat-drugi-fotel-tura`, gałąź
`autobot/R-HOTSEAT-DRUGI-FOTEL-NIE-DOSTAJE-TURY-Q1`, baza `origin/main` (jawnie,
weryfikacja `git merge-base` przed integracją). C-001: zakaz `npm run build`/`dev` w
`gra/`; dozwolona wyłącznie
`node ./node_modules/vite/bin/vite.js build --outDir <katalog spoza repo> --emptyOutDir`
oraz `node ./node_modules/typescript/bin/tsc --noEmit`.

## Procedura naprawcza przy FAIL

Evaluator wskazuje jeden konkretny defekt i poprawkę; runda N+1 na TYM SAMYM ID i TEJ
SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED — eskalacja do właściciela, ten temat jest
zbyt krytyczny żeby zostawić w stanie FAIL bez jawnej decyzji.

## Ograniczenia wyjścia

Maks. ok. 500 słów w raporcie (podniesione z 400 ze względu na wagę i liczbę
przyczyn); ścieżki+SHA zamiast diffu; zakaz `git add -A`; przy decyzji produktowej —
STATUS: DECISION_REQUIRED. Nie integrujesz, nie deployujesz, nie pushujesz.
