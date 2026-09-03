TEMAT: R-WOJNA-WYMUSZONA-ZELAZO-PROG-TURY-Q1
RUNDA: 1/5
DATA: 2026-09-03
DOMAIN: GAME
ŚCIEŻKA: gra/src/game/forced-war-iron.ts, gra/src/main.ts (plumbing eraEnterTurn,
analogicznie do bronzeEraEnterTurnByOwner)
MODEL+EFFORT: claude-sonnet-5, effort high

WYZWALACZ (ECHO właściciela, 2026-09-03, po doprecyzowaniu ABC)
Pierwotne pytanie: "Wydaje mi się, że wojna epoki nie rozpoczyna się, dopóki państwa-miasta
nie zostaną pokonane." Po pokazaniu właścicielowi mechanizmu (wojna z miastem-państwem
blokuje `alreadyAtWarAnyRole`, próba jest ponawiana co turę, nie jest to trwała blokada),
właściciel poprawił swoją pierwszą odpowiedź: "Ale lepiej byłoby zrobić tak, że trzeba dać
cywilizacjom czas na zajęcie wszystkich miast państw, i w takim razie wojny danej epoki
wybuchałyby najwcześniej w 25. turze, ale nie wcześniej niż [...], żeby to cywilizacja nie
musiała jeszcze walczyć z innymi państwami-miastami i z inną cywilizacją. Więc chyba dałem
złą odpowiedź." Doprecyzowane przez ABC: (1) wojna z miastem-państwem MA NADAL blokować
wymuszoną wojnę epoki (zero zmian w tej części — kod `alreadyAtWarAnyRole` zostaje jak jest,
BEZ wykluczenia miast-państw z liczenia) + (2) DODATKOWO: "Tak, dodaj 25 tur od wejścia w
Żelazo" — analogicznie do już istniejącego mechanizmu Brązu.

RECON (wykonane przez orkiestratora — nie powtarzaj, zweryfikuj i buduj na tym)
- Kamień: `WOJNA_KAMIEN_WYMUSZONA_START_TURY = 25` (`forced-war-stone.ts:19`), sprawdzane jako
  `inp.currentTurn >= WOJNA_KAMIEN_WYMUSZONA_START_TURY` w `isEligibleForStoneForcedWar`
  (`forced-war-stone.ts:42-49`) — próg liczony od tury 0 gry (Kamień jest epoką startową).
- Brąz: `WOJNA_WYMUSZONA_START_TURY_OD_EPOKI = 25` (`forced-war-bronze.ts:86`), sprawdzane jako
  `inp.currentTurn - inp.eraEnterTurn >= WOJNA_WYMUSZONA_START_TURY_OD_EPOKI` w
  `isEligibleForBronzeForcedWar` (`forced-war-bronze.ts:110-128`; gdy `currentTurn`/`eraEnterTurn`
  są `undefined`, próg jest POMIJANY — zachowanie kompatybilności wsteczne dla wołających bez
  tych pól, patrz komentarz linia 111). `eraEnterTurn` pochodzi z mapy
  `bronzeEraEnterTurnByOwner: Map<number, number>` w `main.ts` — utworzonej (`main.ts:1688`),
  ustawianej na turę wejścia w Brąz (`main.ts:1786`), kasowanej gdy owner traci wszystkie miasta
  (`main.ts:25061`) lub przy resecie gry (`main.ts:32510`), zapisywanej/wczytywanej w save game
  (`main.ts:26359`, `33813-33818`), i przekazywanej jako `eraEnterTurn: bronzeEraEnterTurnByOwner
  .get(ownerId)` do `isEligibleForBronzeForcedWar` (`main.ts:29644`).
- Żelazo: `isEligibleForIronForcedWar` (`forced-war-iron.ts:110-111`) sprawdza WYŁĄCZNIE
  `inp.isMainAiCiv && !inp.isAlreadyAtWarAnyRole` — zero warunku tury. Interfejs
  `IronForcedWarEligibilityInput` (linie 94-103) ma tylko te dwa pola. Komentarz w pliku
  (linie 12-26, w szczególności "WYZWALACZ = AWANS EPOKI, NIE PRÓG TURY [...] Sztywny próg tury
  byłby tu bez sensu — do Żelaza cywilizacje docierają w bardzo różnych turach") dokumentuje że
  brak progu był ŚWIADOMĄ decyzją poprzedniego tematu (`R-EPOKA-ZELAZO-WYMUSZONA-WOJNA-Q1`) —
  ten temat JAWNIE JĄ ODWRACA, na nową, potwierdzoną decyzję właściciela.

GOAL
Dodać do Żelaza próg tury analogiczny do Brązu (NIE do Kamienia — Żelazo jest epoką osiąganą
awansem w bardzo różnych turach, tak jak Brąz, nie epoką startową): wymuszona wojna Żelaza nie
może wystartować wcześniej niż `WOJNA_WYMUSZONA_START_TURY_OD_EPOKI` (25, już zdefiniowana stała
w `forced-war-bronze.ts` — zbadaj czy da się bezpiecznie reużyć, czy lepiej zdefiniować analogiczną
stałą lokalną w `forced-war-iron.ts` z tą samą wartością 25, żeby nie tworzyć zależności
Żelazo→Brąz; Operator decyduje, uzasadnia w raporcie) tur OD WEJŚCIA danej cywilizacji w epokę
Żelaza. Wzorem Brązu: dodać pole `currentTurn`/`eraEnterTurn` do
`IronForcedWarEligibilityInput`, próg pomijany gdy któreś z nich `undefined` (zachowanie
kompatybilności wsteczne dla istniejących wołających/testów bez tych pól — analogicznie do
Brązu). W `main.ts`: nowa mapa `ironEraEnterTurnByOwner: Map<number, number>`, ustawiana na turę
wejścia w Żelazo (analogicznie do `bronzeEraEnterTurnByOwner.set(ownerId, turn)`), kasowana przy
utracie wszystkich miast i przy resecie gry, zapisywana/wczytywana w save game (rozszerzenie
`meta` obiektu zapisu, analogicznie do `bronzeEraEnterTurnByOwner`), przekazywana do
`isEligibleForIronForcedWar`.

KRYTERIA KOŃCA (binarne)
1. `isEligibleForIronForcedWar` zwraca `false` dla cywilizacji która właśnie weszła w Żelazo
   (0 tur po wejściu) i nie jest w żadnej wojnie — dziś zwracałoby `true`, po naprawie `false`.
2. Ta sama cywilizacja, 25 tur po wejściu w Żelazo, nadal nie w żadnej wojnie → zwraca `true`
   (próg spełniony).
3. Wojna z miastem-państwem NADAL blokuje (zero regresji) — `isAlreadyAtWarAnyRole=true` daje
   `false` niezależnie od progu tury, tak jak dziś.
4. Wywołanie bez `currentTurn`/`eraEnterTurn` (stare testy, jeśli takie istnieją i nie są
   aktualizowane w tej rundzie) zachowuje się jak dziś — próg pomijany, bez regresji istniejących
   testów `forced-war-iron*-test.cjs`.
5. Save/load gry poprawnie zachowuje `ironEraEnterTurnByOwner` (żywy test: zapisz grę z
   cywilizacją w trakcie odliczania progu Żelaza, wczytaj, potwierdź że licznik od tury wejścia
   jest zachowany, nie zresetowany do bieżącej tury).
6. `tsc --noEmit` czysty, wszystkie istniejące testy `forced-war-iron*-test.cjs` nadal zielone
   (zaktualizowane jeśli trzeba, bez usuwania pokrycia), nowy/rozszerzony test pokrywający
   kryteria 1-5, 5 bramek referencyjnych zielone.

ALLOWLISTA (nic poza tym)
- gra/src/game/forced-war-iron.ts (interfejs, nowa stała progu, `isEligibleForIronForcedWar`).
- gra/src/main.ts (WYŁĄCZNIE: nowa mapa `ironEraEnterTurnByOwner` + jej set/delete/clear/save/
  load/przekazanie do `isEligibleForIronForcedWar`, ściśle analogicznie do istniejącego
  `bronzeEraEnterTurnByOwner` — żadnych innych zmian w main.ts).
- Istniejące/nowe testy w gra/tools/forced-war-iron*-test.cjs, gra/tools/*-save*-test.cjs jeśli
  potrzebny osobny test save/load.
Zakazane bezwzględnie: gra/src/game/forced-war-bronze.ts, gra/src/game/forced-war-stone.ts,
gra/src/game/forced-war-common.ts (współdzielone pliki poza tym tematem — jeśli Operator uzna
zmianę tam za konieczną, DECISION_REQUIRED zamiast modyfikacji), zmiana wartości progu Brązu/
Kamienia, zmiana logiki `alreadyAtWarAnyRole`/`countActiveWarsForOwnerExcludingBarbarians`
(wojna z miastem-państwem MA NADAL blokować, bez zmian), dyspozycje/WERSJE.md,
gra-robocza/ROBOCZA-MANIFEST.json, playbook.json.

IZOLACJA
worktree /home/user/wt-wojna-wymuszona-zelazo-prog-tury, gałąź
autobot/R-WOJNA-WYMUSZONA-ZELAZO-PROG-TURY-Q1, baza jawnie: origin/main (najnowszy commit na
moment dispatchu).
Zakaz npm run build/dev w gra/ (export-data nadpisuje JSON). Jedyna dozwolona kompilacja to
node ./node_modules/typescript/bin/tsc --noEmit.

REGUŁA PRZECIW SAMOOSZUKIWANIU (ANTY-HALUCYNACYJNA)
Zakaz uznania kryterium 5 (save/load) za spełnione bez faktycznego zapisu i odczytu stanu gry w
teście — sam odczyt kodu zapisu/wczytania NIE jest dowodem. Zakaz założenia że stała progu może
być bezpiecznie zaimportowana z `forced-war-bronze.ts` bez sprawdzenia czy to nie tworzy
niepożądanej zależności modułowej Żelazo→Brąz sprzecznej z GRANICAMI tego tematu (Brąz jest poza
allowlistą do EDYCJI, ale import stałej z niego to inna sprawa — jeśli Operator zdecyduje się na
import, musi to jawnie uzasadnić w raporcie, nie milczeć o wyborze).

PROCEDURA NAPRAWCZA PRZY FAIL
Evaluator wskazuje jeden konkretny defekt i poprawkę; runda N+1 idzie na TYM SAMYM ID i TEJ
SAMEJ gałęzi, nie na nowej od zera. Po 5 rundach: LIMIT-5-EXCEEDED.

GRANICE
Operator/Evaluator/Obrona nie integrują, nie deployują, nie pushują.

OBIEG
Operator (Sonnet 5, effort high) → Evaluator (Sonnet 5, effort high) → Operator (obrona, jeśli
zarzuty niepuste) → Final Control (Sonnet 5) → integracja orkiestratora.
