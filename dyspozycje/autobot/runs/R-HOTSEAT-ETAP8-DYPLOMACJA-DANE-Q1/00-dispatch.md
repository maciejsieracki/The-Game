# Dispatch — R-HOTSEAT-ETAP8-DYPLOMACJA-DANE-Q1

## Kontekst

Etap 8 planu hot-seat (`docs/decyzje/PLAN-HOT-SEAT-2-GRACZY.md` §G, ABC-1=C z 2026-09-04):
pełna dyplomacja gracz↔gracz. Recon (`R-HOTSEAT-ETAP8-DYPLOMACJA-RECON-Q1`) i warunek
wstępny (`R-HOTSEAT-DYPLO-KONTAKT-PER-FOTEL-Q1`, zintegrowany) są zamknięte. Właściciel
rozstrzygnął 6 pytań ABC 2026-09-10 (AskUserQuestion):

- **ABC-Q1/Q5 (model negocjacji) = WYŁĄCZNIE TUROWY.** Propozycja/kontrpropozycja
  przechodzi między graczami tura po turze — każda strona działa WYŁĄCZNIE w swojej
  turze, BEZ wspólnego ekranu naraz, BEZ modalu przekazania w stylu Etapu 5 (ukrywanie
  jest zbędne, bo tura już naturalnie separuje dostęp). ODRZUCONE: Wariant 2 (wspólny
  ekran), Wariant 3 (hybryda) i „natychmiastowa odpowiedź w tej samej turze" z recon —
  właściciel wybrał NAJPROSTSZY, czysto turowy model.
- **ABC-Q2 (rola AI) = czysto dwustronna wymiana.** AI nie uczestniczy w żaden sposób.
- **ABC-Q3 (zakres traktatów) = istniejące 1:1.** Żadnych nowych/wyłączonych wariantów
  `RodzajTraktatu` dla pary człowiek↔człowiek.
- **ABC-Q4 (punkt wejścia UI) = nowy, dedykowany.** Osobny przycisk/ekran, NIE zakładka
  w dzisiejszym panelu dyplomacji z AI. (Realizacja UI to OSOBNY, kolejny temat —
  `R-HOTSEAT-ETAP8-DYPLOMACJA-UI-Q1`, poza zakresem tego dispatchu.)

## Zakres TEGO tematu (część i — dane/model, ZERO nowego UI)

Wzorem `R-HOTSEAT-ETAP6F-PART2-DATA-Q1` (split dane→UI, który się sprawdził): ten temat
buduje WYŁĄCZNIE warstwę danych + logikę tury, testowalną przez hak debugowy
(`__hotSeatTestDebug`-podobny wzorzec), BEZ żadnego nowego ekranu/przycisku dla gracza.
UI (drugi, następny temat) dopnie się do gotowej warstwy danych, tak jak
`R-HOTSEAT-ETAP6F-PART2-UI-Q1` dopiął się do `R-HOTSEAT-ETAP6F-PART2-DATA-Q1`.

## Punkt zaczepienia w istniejącym kodzie (przeczytaj PRZED implementacją)

`main.ts` ma już DOKŁADNIE analogiczny mechanizm dla AI→gracz:
`pendingDiplomacyInbox: Array<{id, ownerId, civName, cmdType, reason, goldOnce, ...}>`
(kolejka propozycji AI oczekujących na decyzję gracza) + `resolvePendingDiplomacy(id,
accept)` (akceptacja/odrzucenie, woła `finalizePeaceTreatyBetween(ME(), p.ownerId)` dla
pokoju — funkcja JUŻ generyczna na dowolną parę — albo buduje `cmd` obiekt i przekazuje
do wspólnego pipeline'u wykonania komend dyplomatycznych, który też przyjmuje dowolny
`targetId`). ZNAJDŹ tę funkcję (`grep -n "pendingDiplomacyInbox\|resolvePendingDiplomacy"
gra/src/main.ts`, świeży wynik — linie się przesuwają z każdym integrowanym tematem, NIE
ufaj numerom z tego dokumentu) i przeczytaj CAŁY pipeline wykonania `cmd`, żeby ustalić
ile z niego jest już generyczne (przyjmuje dowolny `targetId`/parę ownerId), a co zakłada
"drugą stroną jest zawsze AI" i wymaga dostosowania.

## GOAL

Nowa struktura `interHumanDiplomacyInbox` (nazwa do potwierdzenia przez Operatora, jeśli
lepsza pasuje do konwencji pliku): kolejka propozycji MIĘDZY dwoma fotelami ludzkimi,
każda z jawnym `fromOwnerId` i `toOwnerId` (w przeciwieństwie do `pendingDiplomacyInbox`,
gdzie odbiorca jest zawsze niejawnie graczem/`ME()`). Fotel A (aktywny) może złożyć
propozycję do fotela B (nieaktywnego w tej turze) — trafia do kolejki. Gdy fotel B staje
się aktywny (po `switchActiveHuman`, wzorem `R-HOTSEAT-DRUGI-FOTEL-NIE-DOSTAJE-TURY-Q1`),
widzi propozycje ZAADRESOWANE DO NIEGO i może: **zaakceptować** (tworzy realny wpis w
`activeDeals`/`getDiploRelation`, reużywając — nie duplikując — istniejącą logikę
wykonania traktatu z `resolvePendingDiplomacy`/pipeline'u `cmd`), **odrzucić** (usuwa z
kolejki), albo **złożyć kontrpropozycję** (nowy wpis z odwróconym `fromOwnerId`/
`toOwnerId`, zmienionymi warunkami, zastępujący stary — trafia z powrotem do kolejki
fotela A, widoczny gdy on znów będzie aktywny). Cykl trwa dowolnie długo, tura po turze,
aż jedna ze stron zaakceptuje lub odrzuci.

## Wymagania

1. Struktura danych jak wyżej, per wzorzec `pendingDiplomacyInbox` (kształt pola można
   dostosować do specyfiki gracz↔gracz — jawne `fromOwnerId`/`toOwnerId` zamiast
   niejawnego `ME()`, `rodzaj: RodzajTraktatu` + minimalny zestaw warunków oferty
   potrzebny do najprostszego traktatu — ABC-Q3 mówi „istniejące 1:1", więc NIE twórz
   nowych typów ofert, reużyj to co dziś reprezentuje `ActiveDeal`/`cmd`).
2. Funkcje: `proposeToHuman(fromOwnerId, toOwnerId, ...)`, `respondToHumanProposal(id,
   action: 'accept'|'reject'|'counter', ...)` (nazwy do potwierdzenia przez Operatora
   zgodnie z konwencją main.ts).
3. Akceptacja reużywa ISTNIEJĄCĄ logikę tworzenia traktatu (ten sam kod co
   `resolvePendingDiplomacy` woła dla AI, NIE nowa, równoległa implementacja — ABC-Q3
   wymaga spójności z istniejącymi traktatami).
4. Save/load: nowa struktura musi przetrwać zapis/wczytanie (wzorem
   `pendingDiplomacyInbox` — sprawdź czy ono jest w ogóle zapisywane w save/load; jeśli
   NIE jest [bo dotąd AI-inbox był efemeryczny w ramach jednej sesji], zdecyduj i
   udokumentuj: czy propozycje międzyludzkie MUSZĄ przetrwać save/load, czy mogą być
   efemeryczne jak dzisiejszy `pendingDiplomacyInbox` — jeśli źródłowy kod NIE
   serializuje, przyjmij tę samą konwencję, chyba że widzisz konkretne ryzyko z tym
   związane, wtedy zgłoś DECISION_REQUIRED zamiast zgadywać).
5. ZERO nowego UI/DOM — cała funkcjonalność dostępna WYŁĄCZNIE przez nowy hak testowy w
   `__hotSeatTestDebug` (wzorem `snapshotHumanSeatsForTest`/`forceAiTurnAwaitingBattleForTest`
   z poprzednich tematów), czysto do celów tej bramki testowej.

## Reguła przeciw samooszukiwaniu (ANTY-HALUCYNACYJNA)

Zakaz uznania tematu za zamknięty na podstawie samego czytania kodu. Wymagany dowód na
żywym Chromium: hot-seat 2 fotele, fotel A (aktywny) przez hak testowy składa propozycję
traktatu do fotela B, kończy turę → fotel B aktywny → DOWÓD że fotel B widzi propozycję
ZAADRESOWANĄ DO NIEGO (nie do A) przez hak odczytu → fotel B akceptuje → DOWÓD realnego
wpisu w `activeDeals`/zmiany `getDiploRelation(A,B)` (TA SAMA funkcja/struktura co dla
istniejących traktatów, nie równoległy mechanizm) → osobny scenariusz: fotel B zamiast
akceptować składa KONTRPROPOZYCJĘ → kończy turę → fotel A aktywny → DOWÓD że widzi
kontrpropozycję (zmienione warunki, odwrócony kierunek). Regresja: gra jednoosobowa i
dyplomacja człowiek↔AI (istniejący `pendingDiplomacyInbox`) działają DOKŁADNIE jak dziś.

## Binarne kryterium sukcesu

Nowa bramka `gra/tools/hotseat-etap8-dyplomacja-dane-test.cjs` dowodząca scenariusza
wyżej (propozycja→akceptacja ORAZ propozycja→kontrpropozycja) PASS ORAZ `tsc --noEmit`
czysty ORAZ 5 bramek referencyjnych zielone ORAZ zero regresji: `hotseat-etap5-no-leak-test.cjs`,
`hotseat-etap6f-part2-data-test.cjs`, `hotseat-etap6f-part2-ui-test.cjs`,
`hotseat-drugi-fotel-tura-test.cjs`, `hotseat-dyplo-kontakt-per-fotel-test.cjs` ORAZ
istniejące testy `pendingDiplomacyInbox`/dyplomacji AI (przeszukaj `gra/tools/*.cjs`)
nadal PASS.

## Allowlista

- `gra/src/main.ts` (cały plik dozwolony ze względu na naturę tematu)
- nowy plik `gra/tools/hotseat-etap8-dyplomacja-dane-test.cjs`

Zakazane bezwzględnie: `gra/src/ui/*` (ZERO nowego UI w tym temacie — to zakres NASTĘPNEGO
tematu), `gra/src/map/cluster-spawn.ts`, `gra/src/game/cluster-start.ts`, pliki z
sekretami, `docs/decyzje/R-HOTSEAT-ETAP8-DYPLOMACJA-DANE-Q1.md`, `.git/**`,
`dyspozycje/WERSJE.md`, `gra-robocza/ROBOCZA-MANIFEST.json`, `playbook.json`.

## Izolacja

Worktree `/home/user/wt-hotseat-etap8-dane`, gałąź
`autobot/R-HOTSEAT-ETAP8-DYPLOMACJA-DANE-Q1`, baza `origin/main` (jawnie, weryfikacja
`git merge-base` przed integracją). C-001: zakaz `npm run build`/`dev` w `gra/`;
dozwolona wyłącznie
`node ./node_modules/vite/bin/vite.js build --outDir <katalog spoza repo> --emptyOutDir`
oraz `node ./node_modules/typescript/bin/tsc --noEmit`. Testy Chromium URUCHAMIAJ
SEKWENCYJNIE, NIGDY równolegle z innymi — sandbox jest realnie zasobowo ograniczony
(4 rdzenie), równoległe uruchomienia testów world-gen dają fałszywe BLOCK.

## Procedura naprawcza przy FAIL

Evaluator wskazuje jeden konkretny defekt i poprawkę; runda N+1 na TYM SAMYM ID i TEJ
SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

## Ograniczenia wyjścia

Maks. ok. 500 słów w raporcie; ścieżki+SHA zamiast diffu; zakaz `git add -A`; przy
decyzji produktowej — STATUS: DECISION_REQUIRED. Nie integrujesz, nie deployujesz, nie
pushujesz.
