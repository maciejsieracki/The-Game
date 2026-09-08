STATUS: DISPATCH
DOMAIN: INFORMATIONAL
TEMAT: R-HOTSEAT-ETAP7-RECON-SAVELOAD-Q1
GOAL: Recon-only (ZERO zmian kodu) dla Etapu 7 planu hot-seat
(`docs/decyzje/PLAN-HOT-SEAT-2-GRACZY.md` §C, wiersz "7": "Save/load v3 (`gracze[]`,
`exploredByHuman`, `humanOwnerIds`, `activeHumanOwnerId`) + naprawa istniejącej luki
`aiSkarbiecByOwner` poza sejwem + `humanCivIds` w kreatorze + dwa heksy startowe",
ryzyko: średnie). **UWAGA — sprzeczność między §C i ABC-4, rozstrzygnij na korzyść
ABC-4 (nowsza, jawna decyzja właściciela)**: wiersz §C w tabeli mówi kryterium gotowe
"roundtrip hot-seat; stary sejw v2 wczytuje się bez zmian" — ale `## ABC-4 — format
zapisu: ODPOWIEDŹ = BEZ MIGRACJI (2026-09-05)` na początku tego samego pliku planu
rozstrzyga WPROST PRZECIWNIE: **zapis dostaje wersję v3 i STARE ZAPISY PRZESTAJĄ
DZIAŁAĆ** — właściciel świadomie zaakceptował że każdy istniejący zapis z playtestów
(w tym te służące do odtwarzania zgłoszeń) staje się bezużyteczny; Etap 7 ma NIE pisać
funkcji migrującej v2→v3, tylko jasno komunikować użytkownikowi że zapis jest w starym
formacie, zamiast cicho się wywalać albo wczytywać śmieci. Twój recon musi projektować
DOKŁADNIE to (bez migracji, z czytelnym komunikatem o niekompatybilności), NIE
"roundtrip ze starym sejwem" — to ostatnie jest przestarzałym zapisem w tabeli, ABC-4
go unieważnia. Kategoria z §A7 ("Zapis/wczytanie — format NIE zniesie dwóch ludzi"). To OSTATNI
etap całego planu hot-seat po Etapie 6 — dispatchowany RÓWNOLEGLE z Etapami 6, bo dotyka
INNYCH plików (`game/save.ts`, `buildSaveGameSnapshot`/restore w `main.ts`) niż bieżące
podetapy migracji Etapu 6 (input/UI/ekonomia/dyplomacja/render/start) — recon-only, więc
zero ryzyka konfliktu z równoległymi implementacjami.

KONTEKST — PRZECZYTAJ W CAŁOŚCI PRZED DISPATCHEM RUND KOLEJNYCH:
- `docs/decyzje/PLAN-HOT-SEAT-2-GRACZY.md` §A7 (format zapisu dziś: jeden `explored` Set,
  jeden obiekt `gracz{...}`, `game/save.ts:286-346` `explored: string[]`/`gracz?: any`,
  restore `main.ts` ok. `34131`, `34249-34251`, `34687` — WSZYSTKIE numery do świeżej
  weryfikacji) i §C wiersz "7" (docelowy kształt: `gracze[]` zamiast `gracz`,
  `exploredByHuman` zamiast `explored`, `humanOwnerIds`/`activeHumanOwnerId` w sejwie,
  `humanCivIds` w kreatorze, dwa heksy startowe).
- **WYKRYTA W PLANIE LUKA ISTNIEJĄCA, NIEZALEŻNA OD HOT-SEATU (bug do naprawienia w tym
  etapie niezależnie od reszty)**: `aiSkarbiecByOwner`/`aiNaukaPoolByOwner` NIE SĄ
  serializowane (komentarz "Audyt #44" @ `main.ts:26846` wg planu — zweryfikuj świeżo).
  Konsekwencja opisana w planie: "Człowiek #2 na dodatnim ownerze straciłby skarbiec po
  wczytaniu" — ale to dotyczy TAKŻE dzisiejszej gry AI-only (AI na dodatnim ownerze traci
  skarbiec po wczytaniu?) — **rozstrzygnij i zweryfikuj czy ten bug jest już aktywny w
  SINGLE-PLAYER dziś** (AI ownerId>0 wczytująca stan) czy ujawnia się WYŁĄCZNIE gdy drugi
  CZŁOWIEK zajmie dodatni owner (Etap 6). To rozstrzyga czy to jest pilny, niezależny
  temat do zgłoszenia OSOBNO (ABC), czy tylko dokumentacja przy okazji tego recon.
- **ABC-4 w tym samym pliku planu (linia ~12, `## ABC-4 — format zapisu: ODPOWIEDŹ = BEZ
  MIGRACJI (2026-09-05)`)** — PRZECZYTAJ CAŁĄ tę sekcję, to jest już podjęta decyzja
  właściciela dotycząca formatu zapisu, prawdopodobnie bezpośrednio wiążąca dla tego
  recon (np. czy stare sejwy v2 dostają migrację czy nie). Nie projektuj rozwiązania
  sprzecznego z tą już podjętą decyzją bez jawnego jej zacytowania i wyjaśnienia
  rozbieżności.
- **Ta sama uwaga co przy KAŻDYM poprzednim etapie: main.ts/game/save.ts zmieniają się
  codziennie, numery linii z planu z dużym prawdopodobieństwem martwe.** Sprawdź
  `git log`/rejestr na start — wszystkie 6 podetapów Etapu 6 (a-f) mają dziś zamknięty
  recon, Etap 6a implementacja może być zintegrowana LUB w Final Control w chwili Twojej
  pracy — sprawdź stan roboczy `/home/user/wt-hotseat-etap6a-input` jeśli wciąż istnieje.
- Etapy 0-5 są zintegrowane: `human-owners.ts`, `isHuman`/`isAiOwner`/`ME()`,
  `exploredByHuman`, `playerStateByHuman`, `switchActiveHuman()`/`ui/hotSeatHandoff.ts` —
  te struktury per-human JUŻ ISTNIEJĄ w kodzie runtime, ale (potwierdź świeżo) prawdopodobnie
  NIE są jeszcze uwzględnione w `buildSaveGameSnapshot()`/restore — to jest dokładnie luka
  którą ten etap ma zamknąć.
- `dyspozycje/autobot/runs/R-HOTSEAT-ETAP6F-RECON-START-Q1/01-operator-runda1.md` —
  najświeższy wzorzec formatu i jakości (2 rundy Evaluatora, arytmetyka narzędziem).

ZADANIE TEJ RUNDY (WYŁĄCZNIE recon, zero kodu produkcyjnego):
1. **Zainwentaryzuj świeżym `Read`/grep CAŁĄ funkcję `buildSaveGameSnapshot()`** (main.ts)
   i odpowiadającą jej funkcję restore — dla KAŻDEGO pola ustal: czy dziś serializuje
   TYLKO gracza 0 (wymaga rozszerzenia na `gracze[]`/`exploredByHuman` itd.), czy już
   serializuje WSZYSTKICH ownerów (AI-generic, bez zmian), czy jest tym znanym bugiem
   (`aiSkarbiecByOwner` i podobne pominięte pola).
2. **Zweryfikuj świeżo bug `aiSkarbiecByOwner`/`aiNaukaPoolByOwner`** — potwierdź czy
   dotyczy dziś (single-player, AI ownerId>0) czy tylko przyszłego hot-seatu, z dowodem
   kodowym (Read struktury zapisu i restore).
3. **Przeczytaj i zacytuj ABC-4** (decyzja właściciela o formacie zapisu, 2026-09-05) —
   upewnij się że projekt tego recon jest z nią zgodny; jeśli coś jest niejasne lub
   sprzeczne, zaflaguj jako pytanie do ABC, nie zgaduj.
4. **Zaprojektuj DOKŁADNY kształt v3** (pola, typy, przykładowy JSON) zgodny z §A7/§C i
   ABC-4 — `gracze[]` (lista per-human), `exploredByHuman`, `humanOwnerIds`,
   `activeHumanOwnerId`, plus naprawiony `aiSkarbiecByOwner`/`aiNaukaPoolByOwner`. Bez
   pisania kodu implementacji — to jest kontrakt/projekt, analogicznie do jak recon
   Etapu 5 zaprojektował kontrakt `ui/hotSeatHandoff.ts` bez implementacji.
5. **Zaprojektuj obsługę niekompatybilności wstecznej ZGODNIE Z ABC-4 (bez migracji)** —
   jak dokładnie restore rozpoznaje że sejw jest w starej wersji (v2 lub wcześniejszej,
   brak pola wersji/pole `gracze` nieobecne) i wyświetla CZYTELNY komunikat użytkownikowi
   zamiast próby wczytania/cichej awarii/wczytania śmieci — konkretny mechanizm
   detekcji wersji + miejsce/sposób komunikatu (np. wzorem istniejących komunikatów
   błędu wczytywania w UI, jeśli takie już są — sprawdź).
6. **Sprawdź nakładanie z `humanCivIds`/dwoma heksami startowymi** — czy to ten sam zakres
   co Etap 6f (start gry, `NewGameParams`/`cluster-start.ts`, część "(ii) nowa
   funkcjonalność" z tamtego recon) — jeśli tak, jawnie odnotuj podział odpowiedzialności
   (kto projektuje co) zamiast dublować pracę.
7. **Zaproponuj plan dowodu no-op** — behawioralny no-op przy `humanOwnerIds=[0]`
   (zapis-wczytanie daje identyczny stan gry co dziś, mimo nowego formatu v3) ORAZ test
   potwierdzający że sejw w STARYM formacie (v2 lub wcześniejszy) daje CZYTELNY komunikat
   błędu zamiast crasha/cichego uszkodzenia stanu (zgodnie z ABC-4 — to jest test
   "niekompatybilności z komunikatem", NIE test roundtrip/migracji) — konkretna,
   wykonywalna metoda dla obu.

BINARNE KRYTERIUM SUKCESU TEJ RUNDY: świeżo zweryfikowana pełna mapa
`buildSaveGameSnapshot()`/restore z jawnym rozróżnieniem pól gotowych/wymagających
rozszerzenia, potwierdzenie/obalenie zasięgu bugu `aiSkarbiecByOwner`, jawne
uwzględnienie ABC-4 (bez migracji, czytelny komunikat), konkretny projekt kształtu v3
(bez kodu), konkretny mechanizm detekcji starego formatu + komunikatu, jawne rozliczenie
nakładania z Etapem 6f, konkretny plan dowodu no-op (zapis-wczytanie v3) i dowodu
komunikatu przy starym formacie.

ALLOWLISTA:
- `dyspozycje/autobot/runs/R-HOTSEAT-ETAP7-RECON-SAVELOAD-Q1/*` (WYŁĄCZNIE dokument
  recon — zero zmian w `gra/`)
Zakaz `git add -A`. Zakaz jakiegokolwiek kodu w `gra/src/**`/`gra/tools/**` w tej rundzie.

REGUŁA PRZECIW SAMOOSZUKIWANIU: zakaz projektowania formatu v3 SPRZECZNEGO z ABC-4 bez
jawnego zacytowania i wyjaśnienia różnicy. Zakaz przepisywania starych numerów linii bez
weryfikacji. Zakaz twierdzenia o zasięgu bugu `aiSkarbiecByOwner` bez dowodu kodowego
(Read struktury zapisu/restore, nie domysł z komentarza w planie).

IZOLACJA: worktree `/home/user/wt-hotseat-etap7-recon`, gałąź
`autobot/R-HOTSEAT-ETAP7-RECON-SAVELOAD-Q1`, baza `origin/main` @ `ef3888bc`.
C-001: zakaz `npm run build`/`dev` w `gra/`; jedyna dozwolona kompilacja to
`node ./node_modules/typescript/bin/tsc --noEmit` (nie powinno być nawet potrzebne — zero
zmian kodu).

PROCEDURA NAPRAWCZA PRZY FAIL: Evaluator wskazuje jeden konkretny defekt; runda N+1 na
TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED. Jeśli Evaluator zwraca
NIEPUSTĄ listę zarzutów (niezależnie od etykiety STATUS w nagłówku) — zawsze wymagana
runda Obrony przed kolejnym Evaluatorem (R-PROC-AUTOBOT.md §3c) — nie pomijaj tego kroku.

NASTĘPNY KROK: Operator → Evaluator → (Obrona jeśli zarzuty, ta sama runda) → kolejny
Evaluator jeśli była Obrona (Ścieżka A, Workflow). Final Control NIE dispatchowany
(dokument, nie kod). Po zamknięciu: dispatch implementacji Etapu 7 jako osobny temat,
gdy zwolni się lania — prawdopodobnie POD KONIEC, po zamknięciu wszystkich podetapów
Etapu 6, bo format zapisu potrzebuje docelowych struktur z 6b-6f.
DEPLOY/PUSH: NIE WYKONANO
