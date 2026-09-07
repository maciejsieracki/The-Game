# R-SZCZESCIE-AUDYT-D-PROGI-I-BUNT-Q1 — dispatch

TEMAT: `R-SZCZESCIE-AUDYT-D-PROGI-I-BUNT-Q1`
(węzeł **D** z pięciu, temat nadrzędny: `R-MIASTA-SZCZESCIE-PRAWO-BALANS-AUDYT-Q1`)
RUNDA: 1/5
DOMAIN: GAME
ŚCIEŻKA: A (Workflow)
MODEL+EFFORT: Operator — Sonnet 5, effort medium; Evaluator — Sonnet 5, effort high;
Final Control — Sonnet 5, effort high (`R-PROC-AUTOBOT.md` §5a, temat balansowy, nie
wizualny).

## GENEZA

Pierwotne zgłoszenie właściciela (cytat dosłowny, już zarejestrowany w
`R-SZCZESCIE-AUDYT-A-SKALA-NORMALIZACJA-Q1/00-dispatch.md`, weryfikowalny grepem):
> „Trzeba przeprowadzić dokładny audyt balansu zadowolenia w miastach pod kątem szczęścia,
> prawa i porządku…"

Ten sam dispatch, w sekcji GRANICE, jawnie wydzielił ten węzeł z zakresu węzła A:
> „Nie zmieniasz pasm porządku, progów buntu ani karencji (węzeł D)."

**Ten dispatch (D) jest autorstwa orkiestratora** — nie ma osobnego, wcześniej
zarejestrowanego cytatu właściciela opisującego węzeł D wprost poza powyższym zdaniem
wyłączającym go z węzła A. Reszta tej sekcji to recon orkiestratora nad rzeczywistym
kodem (`gra/src/game/society-breakdown.ts`), nie parafraza żadnego nieistniejącego
cytatu — każda liczba niżej jest do zweryfikowania samodzielnie w pliku i linii wskazanej.

**Mechanizm (stan PO integracji węzła C, commit `68e5d25f`/`cff34055`):**
- `porPctBand` (`society-breakdown.ts:911-920`): progi **stałe, zahardkodowane w TS**,
  NIE data-driven: `lad` ≥90, `spokoj` ≥70, `napiecie` ≥50, `niepokoj` ≥30, `bunt` ≥crit,
  `bunt_skrajny` <crit. `crit` = `porzadek_prog_bunt_skrajny_pct` z JSON (easy 6 / normal
  12 / hard 14, `society-params.json:681-687`) — WŁAŚNIE ten próg jest data-driven, granice
  pozostałych czterech pasm nie są.
- `tierFromPorPct` (`:931-936`): DRUGI, ODDZIELNY zestaw progów dla efektów mnożnikowych —
  `order` ≥90, `unrest` <30, `neutral` pomiędzy. Krytyczne: próg 90 pokrywa się z `porPctBand`,
  próg 30 pokrywa się z `porPctBand`, ale są to DWIE OSOBNE, ręcznie zsynchronizowane stałe
  (nie jedna funkcja wywołująca drugą) — ryzyko przyszłego rozjazdu przy edycji jednej bez
  drugiej, do sprawdzenia czy to już dziś problem.
- `orderEffectsFromPorPct` (`:938-980`): efekty (mnożniki produkcji/pieniądza/nauki/kultury/
  wzrostu/handlu, `revoltRisk`) zmieniają się SKOKOWO na granicy pasma `porPctBand` — np.
  `napiecie`→`niepokoj` (próg 50) to skok z `productionMult=0,95` na pełny zestaw kar
  `orderEffects('unrest', params)`; `niepokoj`→`bunt` (próg `crit`, np. 12 na normal) DODAJE
  `revoltRisk=params.ryzykoBuntuT1` (0→niezerowe, pierwsze wejście w realne ryzyko buntu na
  danej turze).
- `updateRevoltGrace` (`:1087-1129`) + `porzadek_grace_tur_bunt` (easy 4 / normal 3 / hard 2
  tur, `society-params.json:688-694`): gdy `porPct < crit`, licznik karencji startuje od
  pełnej wartości (nie ma efektu „wpadnięcia od razu" — potwierdzone czytaniem kodu, DO
  ZWERYFIKOWANIA testem, nie tylko czytaniem) i maleje o 1/turę; rebelia realnie startuje
  dopiero gdy `currentGrace===0` na KOLEJNEJ turze wciąż poniżej `crit`.

**Dlaczego ten węzeł ma sens TERAZ, nie wcześniej:** węzeł C zredukował, ale nie wyzerował,
najgorszy jednorazowy spadek `PorPct` przy +1 mieszkańcu (28,0pp→20,0pp, podłoga 16,5pp przy
całkowitym wyzerowaniu klucza Prawa — zarejestrowane jako znane ograniczenie architektoniczne,
`REJESTR-PROSB-I-ZADAN.md`). Pasma węzła D mają szerokość 20pp (90/70/50/30) — DOKŁADNIE
rzędu wielkości zmierzonego skoku. **Pytanie audytu, nie założenie:** czy istnieje
realistyczna kombinacja parametrów, w której jeden przyrost populacji o 1 przenosi miasto
przez WIĘCEJ NIŻ JEDNO pasmo naraz (np. z `spokoj` prosto do `niepokoj`, pomijając
`napiecie`) — a jeśli tak, czy to jest realny problem grywalności, czy tylko etykieta bez
konsekwencji (bo same mnożniki degradują się i tak monotonicznie).

## GOAL

**To jest zadanie AUDYTOWE z warunkowym fixem, nie z góry ustalona naprawa.** Operator MA
zmierzyć, zanim zaproponuje zmianę.

1. Zbuduj (rozszerz istniejący harness z `szczescie-audyt-c-prawo-osiedla-test.cjs` albo
   napisz nowy w tym samym stylu — esbuild + realne `computeOrderPctBreakdown`/`porPctBand`/
   `tierFromPorPct`/`updateRevoltGrace`) siatkę: 3 trudności × 3 epoki × pop 1-14 ×
   reprezentatywne warianty administracji/garnizonu/wojny/kultury/religii/luksusu (ten sam
   zakres co węzeł C, żeby liczby były porównywalne) i zmierz na całej siatce:
   a. Czy istnieje przejście pop→pop+1, które przekracza WIĘCEJ NIŻ JEDNĄ granicę
      `porPctBand` naraz (pomija całe pasmo).
   b. Czy istnieje przejście, które przekracza granicę `tierFromPorPct` (90 lub 30) w
      SPRZECZNYM kierunku względem `porPctBand` tej samej zmiany (rozjazd dwóch niezależnych
      progów — możliwy tylko jeśli ktoś kiedyś zmieni jeden bez drugiego, ale zweryfikuj
      dzisiejszy stan).
   c. Symulacją tur (nie tylko jednorazowy skok) potwierdź: czy `updateRevoltGrace` NIGDY
      nie pozwala rebelii wystartować bez pełnych `graceTurns` ostrzeżenia, również w
      przypadku, gdy miasto wchodzi w `porPct < crit` od razu ostrym skokiem (nie stopniowo).
2. **Jeśli (a) lub (b) potwierdzone jako realny, zmierzony problem:** zaproponuj najmniejszą
   poprawkę danych (np. dodatkowe pasmo pośrednie, korekta progu) analogiczną w duchu do
   węzłów A/C — zero zmiany architektury (`porPctBand`/`tierFromPorPct` zostają funkcjami
   czystymi o tym samym kształcie sygnatury), zmiana WYŁĄCZNIE progów/etykiet jeśli to
   wystarcza. Jeśli naprawa wymagałaby zmiany architektury (np. dodania nowego pola do
   `RevoltParams` czy zmiany sygnatury funkcji używanej w wielu miejscach) — **STOP,
   DECISION_REQUIRED**, nie rozszerzaj zakresu samodzielnie.
3. **Jeśli (a)/(b)/(c) NIE potwierdzone jako problem** (progi już dziś odporne na skok
   zmierzony w węźle C) — to jest ważny, poprawny wynik audytu. Raportuj **PASS bez zmiany
   kodu/danych**, z dowodem (liczby ze zmierzonej siatki), nie szukaj na siłę problemu do
   naprawienia.
4. **Magnitude jakiejkolwiek zmiany progów/etykiet jest decyzją właściciela** — jeśli fix
   wymaga zmiany progów o więcej niż drobną korektę (analogicznie do precedensu z węzła C:
   „drobna" = rzędu pojedynczych punktów procentowych, nie przesunięcie całego pasma)
   zatrzymaj się z `DECISION_REQUIRED`, nie decyduj sam.

## BINARNE KRYTERIUM SUKCESU

- Bramka (nowa lub rozszerzenie `szczescie-audyt-c-prawo-osiedla-test.cjs` — uzasadnij
  wybór w raporcie) mierzy (a)/(b)/(c) z GOAL na reprezentatywnej siatce i raportuje
  dokładne, zmierzone liczby (nie „wygląda OK").
  - **UWAGA (incydent z węzła C, runda 2):** każde twierdzenie w raporcie o tym, co dispatch
    lub wcześniejsza ratyfikacja rzekomo pozwala/wymaga, MUSI być poparte prawdziwym,
    zweryfikowalnym cytatem (grep) z realnego pliku — nie z pamięci. Fabrykacja cytatu w tym
    projekcie została już raz wykryta i skorygowana (`R-SZCZESCIE-AUDYT-C-PRAWO-I-OSIEDLA-Q1`,
    runda 2) — potraktuj to jako precedens, nie powtarzaj go.
- Jeśli zmiana danych: zero regresji na wzorcu progu 90/30 dla scenariuszy neutralnych
  (miasto w spokojnym stanie nie zaczyna nagle dostawać kar/bonusów bez zmiany wejścia).
  Zero zmiany architektury (`porPctBand`/`tierFromPorPct`/`updateRevoltGrace` zostają
  funkcjami czystymi o tej samej sygnaturze, chyba że DECISION_REQUIRED zaakceptowany).
- Dodatkowo zielone: `tsc --noEmit`, 5 bramek referencyjnych (logic-test, tech-tree-test,
  research-test, unit-replace-test, combat-test), cała rodzina bramek Prawo/Porządek/
  Szczęście/Society (grep `tools/*prawo*`/`*szczescie*`/`*porzadek*`/`*order*`/`*society*`)
  — w tym `szczescie-audyt-c-prawo-osiedla-test.cjs` niemodyfikowany, jeśli węzeł D dodaje
  nową bramkę zamiast rozszerzać tę.

## ALLOWLISTA

- `gra/data/society-params.json` — WYŁĄCZNIE klucze `porzadek_prog_bunt_skrajny_pct`,
  `porzadek_grace_tur_bunt`, `porzadek_prog_t1`, `porzadek_prog_t2` (jeśli fix tego wymaga —
  uzasadnij który i dlaczego w raporcie).
- Bramka: nowa `gra/tools/szczescie-audyt-d-progi-bunt-test.cjs` LUB rozszerzenie
  `gra/tools/szczescie-audyt-c-prawo-osiedla-test.cjs` — uzasadnij wybór w raporcie.
- `dyspozycje/autobot/runs/R-SZCZESCIE-AUDYT-D-PROGI-I-BUNT-Q1/**`

Zakazane bezwzględnie: pliki z sekretami, `docs/decyzje/**`, `.git/**`, `dyspozycje/WERSJE.md`,
`gra-robocza/**`, `ROBOCZA-MANIFEST.json`, `playbook.json`, `gra/src/game/society-breakdown.ts`
(funkcje `porPctBand`/`tierFromPorPct`/`orderEffectsFromPorPct`/`updateRevoltGrace` NIETKNIĘTE
— to jest zmiana WYŁĄCZNIE danych/progów w JSON, nie kodu; jeśli okaże się że kod TEŻ wymaga
zmiany, zatrzymaj się i zgłoś DECISION_REQUIRED zamiast rozszerzać allowlistę samodzielnie),
`gra/src/main.ts`, `gra/src/game/order.ts`, wszystkie inne klucze `society-params.json` poza
wskazanymi.
Zakaz `git add -A` i `git add .`.

## IZOLACJA

Worktree `/home/user/wt-szczescie-d`, gałąź `autobot/R-SZCZESCIE-AUDYT-D-PROGI-I-BUNT-Q1`,
baza jawnie `origin/main` (commit `cff34055`, PO integracji węzła C) — potwierdź `git log -1`
PRZED pracą (SS2b: jeden pisarz na worktree).

C-001: zakaz `npm run build`/`dev` w `gra/`; jedyna dozwolona kompilacja `tsc --noEmit`;
bramki `node tools/*-test.cjs` nie są objęte zakazem.

Nie dotyka `main.ts` — może być dispatchowany niezależnie od innych aktywnych tematów (o ile
żaden inny nie dotyka `society-params.json` lub `society-breakdown.ts` jednocześnie —
sprawdź `git worktree list` przed startem).

**Ostatni węzeł kolejki audytu szczęścia/Prawa** (A i C zamknięte i zintegrowane; B było
już wcześniej pokryte przez `R-SZCZESCIE-PRZEBUDOWA-SKALI-Q1`; E dotyczy wyłącznie etykiet
panelu, poza zakresem tej sesji, patrz `R-SZCZESCIE-AUDYT-A-SKALA-NORMALIZACJA-Q1/00-dispatch.md`
GRANICE).

## PROCEDURA NAPRAWCZA PRZY FAIL

Evaluator wskazuje konkretny defekt i poprawkę; runda N+1 na TYM SAMYM ID i TEJ SAMEJ gałęzi.
Po 5 rundach: `LIMIT-5-EXCEEDED`.

## GRANICE

- Zero zmian architektury/mechaniki bez DECISION_REQUIRED — patrz GOAL punkt 2/4.
- Nie integrujesz, nie deployujesz, nie pushujesz.
- Magnitude jakiejkolwiek zmiany progów jest potencjalnym DECISION_REQUIRED — patrz GOAL.
- Wynik „PASS bez zmiany" jest akceptowalnym, poprawnym zamknięciem tematu — nie szukaj
  problemu na siłę tam, gdzie miary go nie potwierdzają.

## OBIEG

Operator → Evaluator (ponumerowane zarzuty) → Obrona (gdy lista niepusta) → koniec skryptu.
Final Control osobno (Workflow, Sonnet 5 effort high), integracja allowlist-only ręką
orkiestratora.
