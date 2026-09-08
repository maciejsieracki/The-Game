STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-HOTSEAT-ETAP7-SAVELOAD-Q1
GOAL: Format zapisu v3 (gracze[]/exploredByHuman/humanOwnerIds/activeHumanOwnerId), BEZ
migracji v2→v3, czytelny IncompatibleSaveFormatError dla starego formatu (ABC-4).

TESTY (wszystko uruchomione OSOBIŚCIE, świeżo, w tym worktree, na commicie `96578e96`):
- `tsc --noEmit`: czysty (0 błędów), niezależnie potwierdzone.
- 5 bramek referencyjnych: logic 213/213, tech-tree 19/19, research 33/33,
  unit-replace 13/13, combat 6/6 — wszystkie zielone.
- Nowa bramka `hotseat-etap7-saveload-test.cjs`: 59/59 zielone.
- Osobiście przeczytałem ABC-4 (`docs/decyzje/PLAN-HOT-SEAT-2-GRACZY.md`) i cały diff
  `save.ts`/`main.ts` (git diff eadb3d44..96578e96). Próg `ver < 3` (nie
  `< SAVE_VERSION`) poprzedza destrukturyzację, `IncompatibleSaveFormatError` jest
  odróżnialny, zero funkcji migrującej (potwierdzone też negatywnymi asercjami bramki).
  Kolejność `openStartupMainMenu()` PRZED `showHintMessage()` w gałęzi
  `IncompatibleSaveFormatError` potwierdzona w kodzie i w bramce
  `load-fail-toast-zindex-test.cjs` (wzorzec).
- Otworzyłem osobiście oba dowody PNG: `zrzut-runda1-komunikat-stary-format.png` pokazuje
  RZECZYWISTY, czytelny toast "Ten zapis pochodzi ze starszej wersji gry (v2)..." nad
  menu głównym (nie zasłonięty); `zrzut-runda1-roundtrip-po-wczytaniu.png` pokazuje
  realny, niepusty stan po wczytaniu (2 miasta, Nauka 725, tura 1).
- Potwierdziłem świeżym grepem, że `aiSkarbiecByOwner`/`aiNaukaPoolByOwner`
  (Audyt #44) są nietknięte tym tematem i nadal poprawnie serializowane/odtwarzane
  (main.ts:28427/28430 zapis, 36025/36414 odczyt) — zero nakładania z 6c/6e.
- Dodatkowo (własna inicjatywa, POZA bramką) napisałem i uruchomiłem ad-hoc, żywy
  scenariusz Chromium/Playwright: nowa gra, 2 fotele ludzkie (seedSecondSeat), 9 miast,
  jednostka gracza, 11 zbadanych technologii, Ctrl+S, MUTACJA na żywo PO zapisie
  (dodatkowa jednostka), próba Ctrl+L + kliknięcie slotu. Zapis (Ctrl+S) potwierdzony
  ("[Save] autosave tura=1"), stan przed zapisem poprawny i niepusty. Sama faza
  ładowania w moim skrypcie kończyła się niedeterministycznie (strona przeglądarki
  zamykała się w trakcie drugiej pełnej generacji świata 3D pod headless
  swiftshader) — to ograniczenie mojego doraźnego narzędzia/środowiska (ciężki
  podwójny render 3D w tej samej sesji), NIE zaobserwowałem żadnego konkretnego
  dowodu defektu w kodzie pod tym — dlatego NIE zgłaszam tego jako zarzut, tylko
  odnotowuję jako niekompletną, dodatkową próbę.
- Potwierdziłem świeżo oba zgłoszone kolaterale: `barb-camp-blacklist-test.cjs`
  faktycznie rzuca `IncompatibleSaveFormatError` na fixturze `wersja:1`;
  `fsa-autosave-test.cjs` faktycznie 2/55 FAIL na fixturze `wersja:2`; przedegzystujący
  `load-fail-toast-zindex-test.cjs` faktycznie 14/15 (1 FAIL niezwiązany, formuła
  z-index z innego tematu) — zgłoszenia operatora dokładne, nie na wyrost.

BLOKADY: Brak nowych. Potwierdzone pre-istniejące (poza allowlistą, do osobnej rundy):
barb-camp-blacklist-test.cjs i fsa-autosave-test.cjs (fixtury wersja:1/2), oraz
1 pre-istniejący FAIL w load-fail-toast-zindex-test.cjs.

RUNDY: 1/5

ZARZUTY: brak.

NASTĘPNY KROK: Final Control (Ścieżka A, Workflow) — lista zarzutów pusta, więc runda
Obrony nie jest wymagana (R-PROC-AUTOBOT.md §3c pkt 1).
DEPLOY/PUSH: NIE WYKONANO
