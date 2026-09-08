STATUS: DISPATCH
DOMAIN: INFORMATIONAL
TEMAT: R-HOTSEAT-ETAP6F-RECON-START-Q1
GOAL: Recon-only (ZERO zmian kodu) dla SZÓSTEGO i OSTATNIEGO pod-etapu Etapu 6 planu
hot-seat (`docs/decyzje/PLAN-HOT-SEAT-2-GRACZY.md` §C, wiersz "6": "(f) start ~15").
Kategoria z §A10 ("Start gry / wybór cywilizacji — ~15 miejsc"). Po zamknięciu tego
recon WSZYSTKIE 6 pod-kategorii Etapu 6 (a-f) będą miały zamknięty recon — to ostatni
brakujący dokument przed przejściem w pełni w fazę implementacji Etapu 6. Kryterium
gotowości §C: "po każdym podetapie: typecheck + bramki + 20 tur" (behawioralny no-op
przy `humanOwnerIds=[0]`).

KONTEKST — PRZECZYTAJ W CAŁOŚCI PRZED DISPATCHEM RUND KOLEJNYCH:
- `docs/decyzje/PLAN-HOT-SEAT-2-GRACZY.md` §A10: `ui/newGameFlow.ts:84-142
  NewGameParams` (`civId`, `civName` — pojedyncze; `selectedAiCivIds?: string[]` to
  "GOTOWY WZORZEC" dla przyszłego `humanCivIds` — NOWA funkcjonalność, nie migracja
  istniejącego literału), `main.ts:32418 applyMenuParams` → `_menuCivId` (32470,
  deklaracja 1415), `9922`/`32528 fillAiOwnerCivMap` (def. 7267 — wyklucza cywilizację
  gracza z puli AI, "musi wykluczać obie" w hot-seat), `8050 applyClusterStartPlan` →
  `game/cluster-start.ts:24 playerStartHex` (JEDEN heks startowy — hot-seat potrzebuje
  DWÓCH), `:53 playerCivId`, `main.ts:2297, 2305, 7251, 32914, 3218, 14098, 26220`.
  **UWAGA**: ta kategoria, w odróżnieniu od (a)-(e), zawiera realną NOWĄ funkcjonalność
  (drugi heks startowy, druga cywilizacja wybierana w menu), nie tylko mechaniczną
  podmianę literału `0`→alias — rozstrzygnij i jawnie oddziel "migracja istniejącego
  kodu" od "nowa funkcjonalność do zaprojektowania" w swoim dokumencie.
- **Ta sama uwaga co przy KAŻDYM poprzednim etapie: main.ts (i pliki game/*, ui/*)
  zmieniają się codziennie, numery linii z planu z dużym prawdopodobieństwem martwe.**
  Sprawdź `git log`/rejestr na start. Etap 6a (implementacja input) może być
  zintegrowana LUB wciąż w toku w chwili Twojej pracy — sprawdź TAKŻE stan roboczy
  równoległego worktree `/home/user/wt-hotseat-etap6a-input` jeśli wciąż istnieje
  (`git status`/`git diff`), NIE tylko zintegrowany `origin/main` — dokładnie ten błąd
  metody musiał poprawiać Evaluator Etapu 6d Operatorowi w rundzie 1 (patrz
  `dyspozycje/autobot/runs/R-HOTSEAT-ETAP6D-RECON-DIPLOMACY-Q1/03-obrona-runda1.md`).
- `dyspozycje/autobot/runs/R-HOTSEAT-ETAP6E-RECON-RENDER-Q1/01-operator-runda1.md` —
  najświeższy wzorzec formatu (3 rundy Evaluatora, w tym błąd sumowania arytmetycznego w
  rundzie 2 — licz sumy narzędziem, nie z pamięci, i sprawdź spójność liczby WSZĘDZIE w
  dokumencie, nie tylko w jednej sekcji).

ZADANIE TEJ RUNDY (WYŁĄCZNIE recon, zero kodu produkcyjnego):
1. **Zainwentaryzuj WSZYSTKIE miejsca w `main.ts`, `ui/newGameFlow.ts`,
   `game/cluster-start.ts`** dotyczące startu gry/wyboru cywilizacji zależnego od
   właściciela (wybór cywilizacji gracza w menu, przydział heksu startowego, wykluczenie
   cywilizacji gracza z puli AI) — świeżym grepem, z dzisiejszymi numerami linii.
2. **Rozstrzygnij i jawnie oddziel**: (i) miejsca będące PROSTĄ migracją istniejącego
   literału `0`/pojedynczej wartości na alias/strukturę wieloelementową (np.
   `fillAiOwnerCivMap` — "musi wykluczać obie" cywilizacje ludzi), od (ii) miejsc
   wymagających NOWEJ funkcjonalności (drugi heks startowy w `cluster-start.ts`, drugi
   wybór cywilizacji w `newGameFlow.ts` — dziś `civId`/`civName` to pojedyncze pola, nie
   listy) — dla (ii) NIE projektuj pełnej implementacji (poza zakresem recon), ale opisz
   dokładnie CO trzeba dodać i gdzie, analogicznie do tego jak wcześniejsze recon (np.
   Etap 5 dla `ui/hotSeatHandoff.ts`) opisywały nowy kontrakt bez pisania kodu.
3. **Potwierdź/skoryguj liczbę "~15"** z planu — policz realnie (wzorem 42/78/32/136/27 z
   Etapów 6a-6e) — jeśli liczba się różni, wyjaśnij dlaczego, ROZLICZ ARYTMETYKĘ
   NARZĘDZIEM (np. `python3 -c "print(...)"`), nie z pamięci — Etap 6e popełnił dokładnie
   ten błąd w swojej rundzie 2.
4. **Dla każdego znalezionego miejsca kategorii (i) zaproponuj konkretną podmianę**
   (alias `isHuman`/`isMe`/`ME()` — rozstrzygnij per miejsce z uzasadnieniem, ta
   kategoria może wymagać więcej niż jednego wzorca, jak Etap 6d).
5. **Sprawdź nakładanie z Etapami 1/6a** (Etap 1 już migrował `fillAiOwnerCivMap`-
   pokrewne miejsca AI-detekcji na `isAiOwner`?) — sprawdź jawnie, w tym stan roboczy
   równoległych worktree jeśli istnieją.
6. **Zaproponuj plan dowodu no-op** dla części (i) — behawioralny no-op przy
   `humanOwnerIds=[0]` (część (ii), nowa funkcjonalność, z natury nie ma dziś
   zachowania do porównania — jawnie odnotuj to rozróżnienie, nie próbuj sztucznie
   wymyślać testu no-op dla kodu który jeszcze nie istnieje).

BINARNE KRYTERIUM SUKCESU TEJ RUNDY: kompletna świeżo zweryfikowana lista miejsc
kategorii "start" z dzisiejszymi numerami linii, jawny podział migracja-vs-nowa-
funkcjonalność, konkretna podmiana per miejsce kategorii (i), jawne rozliczenie z liczbą
"~15" (arytmetyka narzędziem, spójna wszędzie w dokumencie), jawne sprawdzenie
nakładania z Etapami 1/6a, konkretny plan dowodu no-op dla części (i).

ALLOWLISTA:
- `dyspozycje/autobot/runs/R-HOTSEAT-ETAP6F-RECON-START-Q1/*` (WYŁĄCZNIE dokument recon —
  zero zmian w `gra/`)
Zakaz `git add -A`. Zakaz jakiegokolwiek kodu w `gra/src/**`/`gra/tools/**` w tej rundzie.

REGUŁA PRZECIW SAMOOSZUKIWANIU: zakaz przepisywania starych numerów linii bez
weryfikacji. Zakaz projektowania pełnej nowej funkcjonalności (część ii) jako gotowego
kodu — to recon, nie implementacja. Zakaz liczenia sum "z pamięci" — użyj narzędzia
(python3/node -e) i wklej wynik, dokładnie jak wymagała tego korekta Etapu 6e rundy 2-3.

IZOLACJA: worktree `/home/user/wt-hotseat-etap6f-recon`, gałąź
`autobot/R-HOTSEAT-ETAP6F-RECON-START-Q1`, baza `origin/main` @ `f6d767e1`.
C-001: zakaz `npm run build`/`dev` w `gra/`; jedyna dozwolona kompilacja to
`node ./node_modules/typescript/bin/tsc --noEmit` (nie powinno być nawet potrzebne — zero
zmian kodu).

PROCEDURA NAPRAWCZA PRZY FAIL: Evaluator wskazuje jeden konkretny defekt; runda N+1 na
TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED. Jeśli Evaluator zwraca
NIEPUSTĄ listę zarzutów (niezależnie od etykiety STATUS w nagłówku) — zawsze wymagana
runda Obrony przed kolejnym Evaluatorem (R-PROC-AUTOBOT.md §3c) — nie pomijaj tego kroku.

NASTĘPNY KROK: Operator → Evaluator → (Obrona jeśli zarzuty, ta sama runda) → kolejny
Evaluator jeśli była Obrona (Ścieżka A, Workflow). Final Control NIE dispatchowany
(dokument, nie kod). Po zamknięciu: WSZYSTKIE 6 recon Etapu 6 (a-f) zamknięte —
orkiestrator ocenia globalnie kolejność dispatchu implementacji pozostałych pod-etapów
(6b-6f, 6a już w toku/zintegrowana).
DEPLOY/PUSH: NIE WYKONANO
