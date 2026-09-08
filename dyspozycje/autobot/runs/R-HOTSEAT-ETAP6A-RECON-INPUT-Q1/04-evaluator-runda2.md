# R-HOTSEAT-ETAP6A-RECON-INPUT-Q1 — Evaluator runda 2 (weryfikacja Obrony)

**Metoda:** świeży `grep -n`/`sed -n`/`awk` (licznik nawiasów klamrowych dla granic funkcji)
niezależnie od `03-obrona-runda1.md`, w tym samym worktree
(`/home/user/wt-hotseat-etap6a-recon`, HEAD `e7206ef7`). Zweryfikowano osobno każdą z 3
poprawek Obrony wobec dokumentu `01-operator-runda1-analiza.md` (stan po poprawce).

## Weryfikacja 1 — `main.ts:33273` (klawisz B) + `main.ts:33215` (Spacja) → A4

- `grep -n "addEventListener('keydown'"` → potwierdza dokładnie 3 handlery: `10494`
  (`onGesture`, nieistotny), `23787` (pierwszy `keydown`), `33185` (drugi `keydown`).
- Granica drugiego handlera ustalona niezależnie (licznik nawiasów `{`/`}` linia po linii
  od `33185`): zamyka się na **`33312`** (`});`), NIE na `36213`, jak błędnie podał
  Evaluator w rundzie 1 (`02-evaluator-runda1.md` §Zarzut 1) — ale to pomyłka WYŁĄCZNIE w
  raporcie rundy 1, nieobecna w poprawionym `01-operator-runda1-analiza.md` (który cytuje
  tylko `main.ts:33185` jako punkt startu handlera, bez podawania złej górnej granicy) —
  nie wpływa na ocenę tej rundy.
- `sed -n '33271,33276p'` → `sel.ownerId === 0` faktycznie na **linii 33273**, wewnątrz
  `else if (selectedId !== null)`, dokładnie jak opisano (fallback klawisza B na zaznaczoną
  jednostkę, gdy brak `lastBHex`/`hoverKey`). Zgadza się z A4 w dokumencie.
- `sed -n '33209,33217p'` → `cycleToAdjacentPlayerUnit(selectedId, 1)` faktycznie na
  **linii 33215**, w bloku `if (e.code === 'Space' || e.key === ' ')`. Zgadza się.
- `sed -n '5992,6007p'` (`Read` na `cycleToAdjacentPlayerUnit`) → funkcja NIE zawiera
  żadnego literału `ownerId`; woła `cyclablePlayerArmyLeads()`/`cyclablePlayerArmyLeadsAll()`
  (deleguje do A3) i `selectPlayerUnit()` (A2) — potwierdzone, opis „bez osobnego numeru"
  jest poprawny (uniknięcie podwójnego liczenia).
- Kompletność: przeszukałem CAŁE ciało drugiego handlera (`33185-33312`, prawdziwa
  granica, nie `33330` użyte przez Obronę ani `36213` z raportu rundy 1) pod kątem
  `ownerId` — dokładnie jedno trafienie (`33273`). Obrona użyła szerszego zakresu
  (`33185-33330`) niż faktyczna granica funkcji, ale ponieważ między `33313-33330` nie ma
  żadnego `ownerId`, wniosek „dokładnie jedno trafienie" pozostaje prawdziwy niezależnie od
  tej nieścisłości zakresu — nie zmienia wyniku.

**Werdykt: poprawka 1 poprawna i kompletna.**

## Weryfikacja 2 — §4 arytmetyka (F1-F5 fizycznie / D1-D3 wołane)

- Granica `endActiveHumanTurn` ustalona niezależnie (licznik nawiasów od `32999`): zamyka
  się na **`33166`** (`}` po `})();`); `advanceSeat()` zaczyna się `33174` — zgodne z
  dokumentem.
- `sed -n '33055p;33068p'` → F1 (`if (u.ownerId === 0 && anim.pathHexes.length > 0)`) i F2
  (`u.ownerId === 0,` w wywołaniu `applyCityVisitBonusesAlongPath`) potwierdzone dokładnie
  na `33055`/`33068`, oba wewnątrz `32999-33166` → **fizycznie wewnątrz ciała**
  `endActiveHumanTurn`, zgodnie z twierdzeniem. (F3-F5 nie re-cytowane osobno tej rundy —
  już zweryfikowane bez zarzutu w rundzie 1, nie były przedmiotem poprawki.)
- `sed -n '33120,33132p'` → `runPlannedMarchesAtPlayerEndTurn();` faktycznie na **`33127`**,
  wewnątrz ciała `endActiveHumanTurn` (przed `clearPlayerUnitSelectionStateOnly()` i
  `await runWorldEndTurn()`) — potwierdzone.
- `grep -n "function executePlannedMarchesEndTurn\|function applyMarchSegmentInstant\|function runPlannedMarchesAtPlayerEndTurn"`
  → `23275`/`23285`/`23367` — funkcje D1-D3 zdefiniowane setki linii PRZED
  `endActiveHumanTurn` (`32999`), WOŁANE z jej wnętrza dopiero na `33127` — potwierdzone,
  nie leżą tam leksykalnie.
- `sed -n '23270,23335p'` → D1 (`u.ownerId === 0 && plannedMarches.has(...)`) faktycznie na
  **`23277`**, D2 (`!u || !dest || u.ownerId !== 0`) na **`23289`**, D3
  (`if (u.ownerId === 0) hutCollected = ...`) na **`23332`** — wszystkie trzy potwierdzone
  dokładnie.
- Arytmetyka nowego zdania: **5 (F1-F5) + 3 (D1-D3) + 5 (F6-F10) = 13** — poprawna,
  usuwa błąd "10 z 13" z rundy 1. Rozróżnienie „fizycznie wewnątrz" (F1-F5, F6-F10 w
  `renderLoop`) vs „wołane z wnętrza, zdefiniowane osobno" (D1-D3) jest teraz poprawnie
  zastosowane zarówno w §4, jak i w powtórzonym zdaniu w §2 pkt 3 (Obrona poprawiła oba
  miejsca, zgodnie z zapowiedzią).

**Werdykt: poprawka 2 poprawna i kompletna — arytmetyka i rozróżnienie fizyczne/wołane
zgodne z kodem.**

## Weryfikacja 3 — `disbandPlayerUnit` w tabeli wykluczeń §2

- `grep -n "function disbandPlayerUnit\|refundManpowerToEmpire"` → definicja na **`6010`**
  (zgodne), guard `if (u.ownerId !== 0) return false;` na **`6014`** (zgodne, potwierdzone
  `sed -n '6005,6020p'`), wywołanie z HUD na **`20464`** wewnątrz
  `else if (actionId === 'disband') { disbandPlayerUnit(u.id); }` (zgodne, potwierdzone
  `sed -n '20455,20468p'`).
- **BŁĄD ZNALEZIONY:** cytat `refundManpowerToEmpire` jako `main.ts:6017` (w
  `01-operator-runda1-analiza.md` §2 tabela wykluczeń, wiersz `disbandPlayerUnit`, oraz
  identycznie w `03-obrona-runda1.md` linie 142 i 154) jest **niepoprawny — faktyczna
  linia to `main.ts:6019`**, potwierdzone `grep -n "refundManpowerToEmpire" main.ts` →
  `6019:      refundManpowerToEmpire(cities, 0, ep, mpRefund, mpMults.maxMult);`. Różnica
  o 2 linie — najprawdopodobniej pomyłka przy ręcznym numerowaniu wklejonego `sed`
  (Obrona wkleiła fragment z `...` pomijającym linie, numeracja odjechała o 2 przy ostatniej
  cytowanej linii). Nie wpływa na treść argumentu (funkcja faktycznie istnieje i faktycznie
  jest wołana z `disbandPlayerUnit`), ale narusza standard tego procesu („każdy numer linii
  świeżo zweryfikowany", C-031-owy duch całej nocy) — dokładnie ten sam rodzaj usterki, za
  który poprzednie rundy tego i innych etapów były już raz FAIL-owane (błędne liczby/zakresy
  bez świeżej weryfikacji).
- Ocena uzasadnienia wykluczenia („efekt terminalny, bliżej podetapu c niż a"): **sensowne,
  nie unik** — `disbandPlayerUnit` jest strukturalnie identyczna do H4/H5 (guard na
  zaznaczonej jednostce gracza, wołana z callbacku akcji HUD), więc Obrona miała rację
  odróżniając ją explicite, zamiast milczeć. Argument „nie wpływa na dalszy
  klik/zaznaczenie/ruch/atak/marsz/cykl nad POZOSTAŁYMI jednostkami" jest nieco dyskusyjny
  (rozwiązanie jednostki, tak jak scalenie, też usuwa byt z puli jednostek cyklowalnych na
  resztę tury — w tym sensie skutek dla A3/`cyclablePlayerArmyLeads` jest analogiczny do
  scalenia) — ale to jest argument O GRANICY KATEGORII, nie o fakcie, i dispatch definiuje
  kategorię (a) sześcioma czasownikami, z których żaden dosłownie nie obejmuje ani
  „scalanie/rozdzielanie" (Klaster H), ani „rozwiązanie" — więc oba są już interpretacją
  Operatora, nie cytatem z dispatchu. Rozróżnienie Obrony jest wewnętrznie spójne i
  jawnie uzasadnione (nie milczy o granicy) — spełnia bar postawiony przez zarzut 3 rundy 1
  („czytelnik nie może odróżnić »sprawdzone i wykluczone« od »przeoczone«" — teraz może).
  Nie podnoszę tego do zarzutu materialnego, to spór o klasyfikację brzegową udokumentowany
  transparentnie, zgodnie z regułą tego samego dokumentu dla `afterPlayerUnitSpawned`.

**Werdykt: reasoning OK (nie unik), ale nowy, drobny błąd faktyczny (numer linii) w
materiale dodanym tej rundy — wymaga korekty.**

---

## ZARZUT (nowy, runda 2)

1. **[Kosmetyczny — błędny numer linii w nowo dodanym materiale]** `main.ts:6017` podane
   jako lokalizacja wywołania `refundManpowerToEmpire` w tabeli wykluczeń §2
   (`01-operator-runda1-analiza.md`, wiersz `disbandPlayerUnit`) oraz w
   `03-obrona-runda1.md` (linie 142, 154) jest błędne — świeży `grep -n
   "refundManpowerToEmpire" gra/src/main.ts` potwierdza faktyczną linię **`6019`**. Nie
   podważa to treści argumentu (funkcja istnieje, jest wołana dokładnie tak jak opisano),
   ale jest to dokładnie ten rodzaj błędu (numer linii nie zweryfikowany świeżo/błędnie
   przepisany), który ten proces ma wychwytywać w każdej rundzie. Korekta: zamienić
   `main.ts:6017` → `main.ts:6019` w obu plikach. Nie wymaga ponownej weryfikacji reszty
   dokumentu — poprawki 1 i 2 (główny przedmiot tej rundy) są w pełni poprawne i kompletne,
   a reasoning wykluczenia `disbandPlayerUnit` jest sensowny.

---

STATUS: FAIL
DOMAIN: INFORMATIONAL
TEMAT: R-HOTSEAT-ETAP6A-RECON-INPUT-Q1
GOAL: Recon-only (zero zmian kodu) dla podetapu 6a ("input", §C planu hot-seat) — inwentaryzacja świeżym grepem, rozliczenie liczby ~25, propozycje podmian, sprawdzenie nakładania z Etapem 4/5, plan dowodu no-op.
ZMIANY/COMMIT: Brak zmian w `gra/`. Ten dokument (`04-evaluator-runda2.md`) zacommitowany do allowlisty runu.
TESTY: Świeży `grep -n`/`sed -n`/`awk` (licznik nawiasów dla granic funkcji `endActiveHumanTurn` i drugiego handlera `keydown`) niezależnie od `03-obrona-runda1.md` — wszystkie cytaty kodu poprawki 1 (A4/Spacja) i poprawki 2 (§4 arytmetyka F1-F5/D1-D3/F6-F10) potwierdzone dokładnie. Poprawka 3 (disbandPlayerUnit) potwierdzona co do 6010/6014/20464, ale cytat `refundManpowerToEmpire` na `6017` jest błędny (faktycznie `6019`).
BLOKADY: 1 nowy zarzut kosmetyczny — błędny numer linii `main.ts:6017` (powinno być `6019`) w `01-operator-runda1-analiza.md` §2 i w `03-obrona-runda1.md` (2 miejsca). Poprawki 1 i 2 z rundy 1 są w pełni poprawne i kompletne — nie wymagają dalszej weryfikacji.
RUNDY: 2/5 (Evaluator; Operator wraca na rundę 3 tego samego tematu/gałęzi — WYŁĄCZNIE poprawka jednego numeru linii, bez potrzeby ponownej weryfikacji reszty)
NASTĘPNY KROK: Operator, runda 3, TEN SAM temat/gałąź: zamienić `main.ts:6017` → `main.ts:6019` w `01-operator-runda1-analiza.md` (§2, wiersz `disbandPlayerUnit`) i w `03-obrona-runda1.md` (2 wystąpienia) — po tej jednej korekcie dokument jest gotowy do PASS bez dalszych rund.
ZARZUTY: 1) (kosmetyczny) `main.ts:6017` (cytat lokalizacji `refundManpowerToEmpire` w uzasadnieniu wykluczenia `disbandPlayerUnit`) jest błędny — świeży grep potwierdza faktyczną linię `main.ts:6019`. Do poprawienia w `01-operator-runda1-analiza.md` §2 i w `03-obrona-runda1.md` (2 miejsca).
DEPLOY/PUSH: NIE WYKONANO
