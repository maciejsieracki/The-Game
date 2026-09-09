STATUS: DISPATCH
DOMAIN: GAME
TEMAT: R-HOTSEAT-ETAP6F-PART2-DATA-Q1
GOAL: Warstwa DANYCH + GENERATORA (bez UI kreatora) dla drugiego heksu startowego i drugiej
cywilizacji człowieka — pierwszy z dwóch pod-tematów części (ii) Etapu 6f planu hot-seat,
zgodnie z decyzją właściciela o podziale na pod-tematy (ABC-Q6).

KONTEKST — PRZECZYTAJ W CAŁOŚCI PRZED PIERWSZĄ ZMIANĄ:
1. README.md, docs/decyzje/R-PROC-AUTOBOT.md, docs/decyzje/PLAN-HOT-SEAT-2-GRACZY.md
2. `dyspozycje/autobot/runs/R-HOTSEAT-ETAP6F-PART2-RECON-Q1/01-operator-runda1.md` — ŹRÓDŁO
   PRAWDY dla dzisiejszego stanu (cytaty main.ts/newGameFlow.ts/cluster-start.ts/cluster-spawn.ts),
   §2 (lista brakujących elementów danych), §3 (warianty UI — informacyjnie, TEN temat NIE
   dotyka UI), §4 (pytania ABC — WSZYSTKIE rozstrzygnięte niżej).
3. `dyspozycje/autobot/runs/R-HOTSEAT-ETAP6F-START-MIGRACJA-Q1/01-operator-runda1.md` — wzorzec
   część (i) już zamkniętej (analogiczne podejście "wyklucz WSZYSTKICH ludzi z puli AI").
4. main.ts przesuwa się codziennie — zweryfikuj świeżym `grep -n`/`Read` wszystkie numery linii
   z recon PRZED edycją, nie ufaj im ślepo.

DECYZJE WŁAŚCICIELA (ABC, rozstrzygnięte 2026-09-09 — WIĄŻĄCE dla tego i następnego pod-tematu):
- **ABC-Q1 (heks: klikany czy algorytmiczny?) → ALGORYTMICZNY.** Drugi heks startowy NIE jest
  klikany przez gracza — generator klastra rezerwuje drugie miejsce automatycznie, spójnie z
  dzisiejszym zachowaniem gracza 1. Zero nowego typu UI "wybór heksu na mapie".
- **ABC-Q2 (kolejność kroków w kreatorze) → WARIANT A, sekwencyjny.** Fotel 1 kompletny
  (cywilizacja + start, bez zmian widocznych), potem fotel 2 wybiera WYŁĄCZNIE cywilizację
  (dodatkowy krok/ekran po dotychczasowym). Dotyczy NASTĘPNEGO pod-tematu (UI) — w TYM
  pod-temacie (dane/generator) istotne wyłącznie jako kontekst dla kształtu danych (kolejność
  nie zmienia struktur, ale np. `civId2` konceptualnie "drugi w kolejności", nie "równorzędny
  wybór jednoczesny" jak odrzucony wariant C).
- **ABC-Q3 (duplikat cywilizacji) → NIE, WYKLUCZ.** Fotel 2 NIE może wybrać tej samej
  cywilizacji co fotel 1 — symetrycznie do istniejącego wykluczenia cywilizacji AI
  (`_menuSelectedAiCivIds`/część (i) już zamknięta dla puli AI, wzorzec do powielenia).
- **ABC-Q4 (dystans heksów gracz↔gracz) → OPCJA WYBORU: blisko / daleko / losowo.**
  WAŻNE — to NIE jest cicha reguła wewnętrzna, tylko WIDOCZNA OPCJA, którą osoba przy
  konfiguracji nowej gry ma móc wybrać (trzy tryby). Ten pod-temat (dane/generator) dostarcza
  MECHANIZM w generatorze przyjmujący tryb dystansu jako parametr (`'blisko' | 'daleko' |
  'losowo'`) i faktycznie różnicujący pozycjonowanie drugiego heksu-człowieka względem
  pierwszego wg wybranego trybu; SAM SELEKTOR UI (widoczny w kreatorze) jest poza zakresem —
  należy do następnego pod-tematu (UI). W tym pod-temacie tryb jest sterowany WYŁĄCZNIE
  parametrem funkcji/danych wejściowych (dev/test hook lub domyślna wartość), nie ma jeszcze
  żadnego widocznego przełącznika.
- **ABC-Q5 (dev/quick-start ścieżki z literalnym civId) → DECYZJA ORKIESTRATORA (niska
  stawka, jawnie odnotowana, nie blokuje):** ścieżki dev/quick-start pozostają
  single-seat-only (bez drugiej cywilizacji) do czasu ewentualnej osobnej decyzji — zero zmian
  w tych ścieżkach w tym pod-temacie. Jeśli Operator/Evaluator uzna to za błędne, zgłoś jako
  BLOKADĘ zamiast ryzykować milczące złe założenie.
- **ABC-Q6 (zakres) → PODZIAŁ NA POD-TEMATY.** Ten temat = WYŁĄCZNIE dane + generator, ZERO
  nowego ekranu/kroku w kreatorze (item 8 z recon §2 — UI — jest POZA zakresem, dispatch
  osobno jako `R-HOTSEAT-ETAP6F-PART2-UI-Q1` PO integracji tego tematu).

ZASADA NADRZĘDNA — ZERO ZMIANY ZACHOWANIA DLA DZISIEJSZEGO SINGLE-PLAYER: wszystkie nowe pola/
parametry muszą mieć domyślną wartość oznaczającą "brak drugiego człowieka" (analogicznie do
dzisiejszego `humanOwnerIds` domyślnie `[0]`, Etap 1) — gdy nikt nie poprosi o drugą
cywilizację/heks, generator i dane muszą zachowywać się DOKŁADNIE jak dziś, bit-w-bit. To jest
warunek konieczny dla dowodu no-op (patrz niżej) i dla bezpieczeństwa integracji (kreator wciąż
tworzy tylko jednego gracza, dopóki nie powstanie następny pod-temat UI).

ZADANIE (warstwa danych/generatora, wg listy recon §2, punkty 1-7 + 10-12):
1. `NewGameParams.civId`/`civName` (`ui/newGameFlow.ts:86-87`) — dodaj drugie pole (nazwa do
   ustalenia przez Operatora, np. `civId2?: string`/`civName2?: string`, opcjonalne,
   `undefined` = brak drugiego człowieka).
2. `selCiv` (`ui/newGameFlow.ts:729`) — dodaj analogiczny drugi slot stanu modułu (np.
   `selCiv2: string | null = null`), używany PROGRAMOWO (przez przyszły UI z następnego
   pod-tematu lub test), bez nowego ekranu w TYM temacie.
3. `_menuCivId` (`main.ts:1630`) — dodaj strukturę per-fotel. REKOMENDACJA (nie nakaz):
   `Map<number, string>` keyed by `ownerId`, wzorem istniejących `playerStateByHuman`/
   `exploredByHuman` (Etap 1) — kodowa konwencja już istnieje w repo, nie trzeba jej wymyślać.
   Operator może zaproponować inne rozwiązanie z uzasadnieniem, jeśli Mapa nie pasuje
   strukturalnie w tym miejscu.
4. `player.civType`/`player.civBonusy` (main.ts ~34172-34181) — rozszerz na per-owner
   (współistnienie z `playerStateByHuman`, które dziś NIE trzyma `civType`/`civBonusy` — do
   analizy, czy dodać tam pola, czy osobną strukturę równoległą).
5. `ClusterStartPlan.playerStartHex` (`cluster-start.ts:23-24`) — dodaj drugi heks (np.
   `playerStartHexes: Map<number, {q,r}>` lub druga nazwana para pól, spójnie z pkt 3).
6. `applyClusterStartPlan`/`buildClusterSpawnPlan`/`buildClusterStartPlan`
   (`main.ts:8435-8459`, `map/cluster-spawn.ts`) — rozszerz sygnaturę o listę cywilizacji-ludzi
   zamiast pojedynczego `playerCivId` (gdy tylko jeden fotel człowieka istnieje — dziś,
   zachowanie identyczne). Generator musi też przyjąć tryb dystansu (ABC-Q4:
   `'blisko'|'daleko'|'losowo'`) jako parametr wpływający na pozycjonowanie DRUGIEGO
   heksu-człowieka względem pierwszego, gdy drugi fotel istnieje.
7. `playerStartHex` (main.ts:2519 + min. 12 konsumentów z recon §1c: `isInStartReveal` 9685,
   mgła/widoczność 9786-9787/9824-9825, kamera 12548-12549, serializacja zapisu 22605,
   zakładanie pierwszego miasta 22635-22636) — przejście na wersję per-owner. UWAGA: strażnik
   `ME() === HUMAN_OWNER_PRIMARY && playerStartHex !== null` (main.ts:9786, z jawnym
   komentarzem o długu projektowym 9774-9779) jest DOKŁADNIE tym miejscem, które ten temat ma
   naprawić — usuń hardkod `HUMAN_OWNER_PRIMARY`, przejdź na per-owner lookup.
8. Walidacje (recon §2 pkt 10-12): (a) drugi heks respektuje te same reguły
   odległości/terenu co pierwszy (rozszerz istniejące reguły klastra, nie twórz równoległego,
   niezależnego systemu); (b) wykluczenie duplikatu cywilizacji fotela 2 (ABC-Q3, wzorem
   `_menuSelectedAiCivIds`); (c) tryb dystansu gracz↔gracz (ABC-Q4) faktycznie różnicuje
   pozycjonowanie w trzech trybach — nie tylko przyjmuje parametr, ale go REALNIE konsumuje.

REGUŁA PRZECIW SAMOOSZUKIWANIU: (1) bramka no-op — kilka pełnych tur single-player, PRZED/PO
identyczne (żaden nowy parametr wpływa na zachowanie gdy drugi człowiek nieustawiony) — mutacja
"wymuś tryb blisko/daleko/losowo z drugą cywilizacją" MUSI zaczerwienić dowód no-op (dowód że
kod faktycznie coś robi, nie że po prostu nic nie zmienia w żadnym trybie); (2) bramka
jednostkowa/headless z REALNYM wykonaniem (nie regex-na-tekście — błąd Podetapu E runda 1) —
wstrzyknij drugą cywilizację przez hak testowy (wzorem `seedSecondSeat`, main.ts:22640-22677,
ale na etapie GENERACJI klastra, nie tylko przejęcia istniejącego miasta) i potwierdź: drugi
heks powstaje, różni się terenem/dystansem wg trybu, cywilizacje różne, `playerStartHex`
per-owner konsumenci (pkt 7) czytają WŁAŚCIWY heks dla aktywnego fotela (nie zawsze
`HUMAN_OWNER_PRIMARY`); (3) trzy tryby dystansu muszą dawać MIERZALNIE różne rozkłady
odległości w teście (nie tylko różne wewnętrzne flagi bez efektu na wynik).

BINARNE KRYTERIUM SUKCESU: (1) wszystkie 7 struktur danych + 3 walidacje z listy wyżej
zaimplementowane; (2) zero zmiany zachowania dla dzisiejszego single-player (dowód no-op
Chromium, kilka tur, identyczne PRZED/PO); (3) test headless z wstrzykniętą drugą cywilizacją
potwierdza realną generację drugiego heksu + wykluczenie duplikatu + trzy różne tryby dystansu;
(4) zero nowego ekranu/kroku UI kreatora (poza zakresem — potwierdź `git diff --stat` NIE
dotyka renderowanych elementów UI, tylko dane/logikę); (5) `tsc --noEmit` czysty, 5 bramek
referencyjnych zielone, zero regresji na `hotseat-etap6f-start-migracja-test.cjs` i pokrewnych
bramkach Etapu 1/5/6f część (i).

ALLOWLISTA:
- `gra/src/ui/newGameFlow.ts` — WYŁĄCZNIE pola danych (`NewGameParams` interfejs, `selCiv2`
  zmienna modułu, `buildParams()` emisja nowego pola) — ZAKAZ dodawania nowych elementów DOM/
  ekranów/kroków (to następny pod-temat UI)
- `gra/src/main.ts` — WYŁĄCZNIE miejsca wskazane w ZADANIU (pkt 3, 4, 6, 7) + wywołania
  `applyClusterStartPlan`
- `gra/src/game/cluster-start.ts` — `ClusterStartPlan` interfejs + budowanie planu
- `gra/src/map/cluster-spawn.ts` — `buildClusterSpawnPlan`/`buildClusterStartPlan` + reguły
  dystansu/wykluczenia
- `gra/tools/*-test.cjs` — nowe bramki (headless + żywy Chromium no-op)
- `dyspozycje/autobot/runs/R-HOTSEAT-ETAP6F-PART2-DATA-Q1/*`
Zakaz `git add -A`. Zakaz jakiegokolwiek nowego elementu UI/DOM widocznego w kreatorze (krok 8
z recon — osobny, następny pod-temat). Zakaz dotykania `map/cluster-spawn.ts` reguł AI-vs-AI/
AI-vs-gracz niezwiązanych z parą ludzi.

IZOLACJA: worktree `/home/user/wt-6f-part2-data`, gałąź `autobot/R-HOTSEAT-ETAP6F-PART2-DATA-Q1`,
baza `origin/main` (świeża, HEAD `f61d2089` w chwili dispatchu — zawiera pełne zamknięcie Etapu
6d). C-001: zakaz `npm run build`/`dev`; `tsc --noEmit` jedyna dozwolona kompilacja; `node
./node_modules/vite/bin/vite.js build --outDir <poza repo> --emptyOutDir` jedyny dozwolony
build do bramki Chromium.

PROCEDURA NAPRAWCZA PRZY FAIL: Evaluator wskazuje jeden konkretny defekt; runda N+1 na TYM
SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

NASTĘPNY KROK: Operator (Sonnet 5, effort medium) → Evaluator (Sonnet 5, effort high) →
(Obrona jeśli zarzuty) → Final Control → integracja orkiestratora. Po integracji: dispatch
`R-HOTSEAT-ETAP6F-PART2-UI-Q1` (krok kreatora dla fotela 2 — wariant sekwencyjny ABC-Q2 +
selektor trybu dystansu ABC-Q4), ostatni pod-temat całego planu hot-seat 0-7.
DEPLOY/PUSH: NIE WYKONANO
