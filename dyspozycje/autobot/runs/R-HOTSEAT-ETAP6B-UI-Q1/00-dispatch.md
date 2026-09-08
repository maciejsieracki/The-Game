STATUS: DISPATCH
DOMAIN: GAME
TEMAT: R-HOTSEAT-ETAP6B-UI-Q1
GOAL: Implementacja pod-etapu 6b planu hot-seat ("UI/HUD/panele" z tabeli B2) na
podstawie zamkniętego recon
`dyspozycje/autobot/runs/R-HOTSEAT-ETAP6B-RECON-UI-Q1/01-operator-runda1-analiza.md`
(zintegrowany, commit `192b9170`). Behawioralny no-op przy `humanOwnerIds=[0]`
(kryterium gotowości §C planu: "po każdym podetapie: typecheck + bramki + 20 tur").

KONTEKST — PRZECZYTAJ W CAŁOŚCI PRZED PIERWSZĄ ZMIANĄ KODU:
- `dyspozycje/autobot/runs/R-HOTSEAT-ETAP6B-RECON-UI-Q1/01-operator-runda1-analiza.md`
  (dokument źródłowy — 78 miejsc rdzeniowych, klastry U1-U14 main.ts + V1-V11 ui/*.ts,
  z cytatem linii przed/po) — PRZECZYTAJ TAKŻE poprawki naniesione przez Obronę rundy 1
  (§4/§5 w tym samym pliku) — dokument był poprawiany po zarzutach Evaluatora.
- **KRYTYCZNE ZNALEZISKO z tego recon, MUSI być częścią tej implementacji**: cache HUD
  `_last*` (20 zmiennych, zerowane przy handoff przez Etap 5 KROK 5) ma TRZECI,
  niezależny write-site w `runWorldEndTurn()` z własnymi literałami `ownerId===0`/
  `.get(0)` — migracja SAMYCH funkcji zasilających (`updateHud()`/
  `refreshLiveEmpireRatesUnsafe()`) NIE WYSTARCZY. `runWorldEndTurn()` MUSI zostać
  przełączony na hak `humanOwnerId` RÓWNOLEGLE z U1/U2 — dokładnie ten sam wzorzec haka
  co klaster D+F Etapu 6a (już zintegrowany, main.ts, `endActiveHumanTurn(humanOwnerId)`
  — zobacz jak Etap 6a to zrobiło dla D1-D3/F1-F5, analogicznie zrób dla ekonomii/HUD
  wewnątrz `runWorldEndTurn()`).
- **DODATKOWE ZNALEZISKO z recon Etapu 6c (ekonomia, dispatchowany równolegle,
  `dyspozycje/autobot/runs/R-HOTSEAT-ETAP6C-RECON-ECONOMY-Q1/01-operator-runda1-analiza.md`
  §4)**: recon 6c znalazł CZWARTY, nieznaleziony przez recon 6b write-site cache —
  `refreshPlayerCityEcon()` (main.ts, zasila `_lastPlayerCityEcon`) — zweryfikuj świeżo
  numer linii i dołącz do migracji tej rundy, jeśli nadal aktualny.
- **main.ts zmienia się codziennie — WSZYSTKIE numery linii z recon MUSZĄ zostać
  zweryfikowane świeżym grepem przed każdą podmianą.** Recon 6b był pisany PRZED
  integracją Etapu 6a (input) — main.ts dziś ma już zintegrowany alias `isMe(id)`
  (main.ts, zdefiniowany przez Etap 6a) — REUŻYJ GO, nie twórz duplikatu.
- 2 pozycje graniczne (`canMerge`/`canSplit`, main.ts) świadomie wykluczone z tego
  recon — należą do klastra H Etapu 6a (input), już zintegrowanego — NIE migruj ich tu.
- 20 pozycji granicznych (11 akcesorów nazw/kolorów cywilizacji + 6
  `extraCityPanelConfig` + 3 klastry `showHintMessage` w tickach) świadomie wyłączone z
  sumy 78 — NIE migruj ich w tej rundzie (część należy do (c)/(d)/(e), nie dubluj pracy
  równoległych podetapów).

ZADANIE TEJ RUNDY:
1. Zweryfikuj świeżym grepem, że wszystkie 78 miejsc rdzeniowych z recon (klastry
   U1-U14 + V1-V11) nadal istnieją pod wskazanymi numerami — jeśli main.ts się
   przesunął, zaktualizuj numery w swoim raporcie.
2. Zmigruj WSZYSTKIE 78 miejsc rdzeniowych zgodnie z podaną podmianą (`ownerId === 0` →
   `isMe(ownerId)`, `ownerId !== 0` → `!isMe(ownerId)`, literał `0` jako argument
   funkcji generycznej → `ME()`) — reużywając istniejący alias `isMe`/`ME()` z Etapu 6a.
3. Podłącz PRAWDZIWY parametr `humanOwnerId` (funkcja `endActiveHumanTurn(humanOwnerId)`)
   dla write-site'u cache `_last*` wewnątrz `runWorldEndTurn()` (11 z 20 zmiennych wg
   recon §4) zamiast literału `0`/`ME()` globalnego — to jest krytyczne dla no-opa przy
   przyszłym `humanOwnerIds` różnym od `[0]`, patrz KONTEKST wyżej.
4. Zweryfikuj i ewentualnie zmigruj `refreshPlayerCityEcon()` (znalezisko Etapu 6c,
   patrz KONTEKST).
5. `ui/*.ts` moduły (V1-V11) są czyste (nie importują `human-owners.ts`) — dodaj
   wstrzykiwany parametr `isMe`/`ME` wzorcem identycznym do `game/army-cycle.ts`
   (Etap 6a, `cyclablePlayerArmyLeadsBase`).
6. NIE dotykaj: klaster H (`canMerge`/`canSplit`, już Etap 6a), 20 pozycji granicznych
   z recon §2 (akcesory nazw/kolorów, `extraCityPanelConfig`, `showHintMessage` w
   tickach) — poza zakresem tego tematu.
7. Napisz bramkę dowodu no-op zgodnie z planem recon §6: Chromium (wszystkie klastry
   DOM-bound, zero wyjątku headless w tej kategorii, w odróżnieniu od Etapu 6a) —
   otwórz każdy dotknięty panel (miasto, imperium, cuda, wydarzenia, oblężenie,
   przed-bitwą, moc) przy `humanOwnerIds=[0]`, porównaj wyrenderowany HTML/wartości
   liczbowe PRZED/PO podmianie, bit-w-bit identyczne, 20 tur z otwarciem każdego z ~8
   paneli co najmniej raz. Wzorzec: `gra/tools/hotseat-etap6a-input-noop-test.cjs`
   (retry+fallback Chromium już istniejące w projekcie).

BINARNE KRYTERIUM SUKCESU: wszystkie 78 miejsc zmigrowane (grep po
`ownerId\s*(===|!==)\s*0` w zakresach klastrów U1-U14/V1-V11 daje ZERO trafień),
`runWorldEndTurn()` faktycznie używa parametru `humanOwnerId` dla write-site'u cache
(nie globalnego `ME()`) — sprawdzalne przez to że wywołanie z `humanOwnerId !== ME()`
dałoby inne zachowanie dla tych 11 miejsc. Nowa bramka PASS przy `humanOwnerIds=[0]`
(no-op, dowiedziona jako nietautologiczna — pokazać że czerwienieje na kodzie sprzed tej
rundy). `tsc --noEmit` czysty. 5 bramek referencyjnych zielone.

ALLOWLISTA:
- `gra/src/main.ts` (wyłącznie klastry U1-U14 z recon + write-site `runWorldEndTurn()`
  + ewentualnie `refreshPlayerCityEcon()`)
- `gra/src/ui/cityPanel.ts`, `gra/src/ui/siegeMapPanel.ts`, `gra/src/ui/preBattle.ts`,
  `gra/src/ui/powerOverlayHud.ts` (klastry V1-V11, parametr `isMe`/`ME` wstrzykiwany)
- `gra/tools/hotseat-etap6b-ui-noop-test.cjs` (NOWY plik, bramka dowodu no-op)
- `dyspozycje/autobot/runs/R-HOTSEAT-ETAP6B-UI-Q1/*`
Zakaz `git add -A`. Zakaz dotykania plików spoza tej listy.

REGUŁA PRZECIW SAMOOSZUKIWANIU: zakaz uznania migracji za kompletną na podstawie samej
liczby 78 zmienionych linii bez świeżego grepa potwierdzającego brak przeoczonych miejsc
w zakresie klastrów. Zakaz pominięcia write-site'u `runWorldEndTurn()` (krytyczne
znalezisko recon, patrz KONTEKST) — to jest najczęstszy błąd tej serii tematów (Etap 6c
znalazł analogiczny czwarty write-site, Etap 6e znalazł 5 pominiętych hardkodów formami
`= 0`/`?? 0` które prosty grep pomija — sprawdź TAKŻE te formy, nie tylko `===`/`!==`).
Zakaz deklaracji bramki no-op jako PASS bez pokazania że czerwienieje na kodzie sprzed
tej rundy.

IZOLACJA: worktree `/home/user/wt-hotseat-etap6b-ui`, gałąź
`autobot/R-HOTSEAT-ETAP6B-UI-Q1`, baza `origin/main` @ `550014be` (Etap 6a input już
zintegrowany w tej bazie — `isMe`/`ME()` istnieją w main.ts, reużyj je).
C-001: zakaz `npm run build`/`dev` w `gra/`; jedyna dozwolona kompilacja to
`node ./node_modules/typescript/bin/tsc --noEmit`; jedyna dozwolona komenda buildu do
bramki Chromium: `node ./node_modules/vite/bin/vite.js build --outDir <poza repo,
np. /tmp/...> --emptyOutDir`.

PROCEDURA NAPRAWCZA PRZY FAIL: Evaluator wskazuje jeden konkretny defekt; runda N+1 na
TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED. Jeśli Evaluator zwraca
NIEPUSTĄ listę zarzutów (niezależnie od etykiety STATUS w nagłówku) — zawsze wymagana
runda Obrony przed kolejnym Evaluatorem (R-PROC-AUTOBOT.md §3c).

NASTĘPNY KROK: Operator → Evaluator → (Obrona jeśli zarzuty) → Final Control (Ścieżka A,
Workflow). Po PASS: integracja allowlist-only przez orkiestratora, potem Etap 6c
(ekonomia) sekwencyjnie — dotyka tego samego main.ts i tej samej `runWorldEndTurn()`.
DEPLOY/PUSH: NIE WYKONANO
