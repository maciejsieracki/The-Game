# R-HOTSEAT-ETAP6A-RECON-INPUT-Q1 — Operator (Obrona), runda 1 — odpowiedź na zarzuty Evaluatora

**Rola:** Operator, drugie wywołanie tej samej rundy (Obrona) — nie nowa kalibracja.
**Worktree:** `/home/user/wt-hotseat-etap6a-recon`, gałąź
`autobot/R-HOTSEAT-ETAP6A-RECON-INPUT-Q1`, baza `911b5fcc`.
**Wejście:** raport Evaluatora `02-evaluator-runda1.md` (`f72fccd7`), STATUS: FAIL, 3 zarzuty
(2 materialne, 1 kosmetyczny).
**Wyjście:** wszystkie 3 zarzuty **PRZYJĘTE**, dokument
`01-operator-runda1-analiza.md` poprawiony bezpośrednio (liczba rdzeniowa 41 → **42**),
poniżej dowód dla każdego zarzutu z osobna.

---

## OBRONA: 1 -> PRZYJMUJE

**Zarzut:** Dokument nie znajduje `main.ts:33273` (`sel.ownerId === 0` w drugim handlerze
`window.addEventListener('keydown', …)`, `main.ts:33185`, w ogóle nieanalizowanym w rundzie
1) — klawisz **B** („Found a city"), kategoria „zaznaczenie". Ten sam handler wiąże Spację
→ `cycleToAdjacentPlayerUnit(selectedId, 1)` (`main.ts:33215`) jako faktyczny klawiszowy
punkt wejścia cyklu, nieopisany. Liczba „41" zaniżona o co najmniej 1.

**Dowód (świeży, ta runda):**

```
$ grep -n "addEventListener('keydown'" gra/src/main.ts
10494:      document.addEventListener('keydown', onGesture, true);
23787:    window.addEventListener('keydown', (e: KeyboardEvent) => {
33185:    window.addEventListener('keydown', (e: KeyboardEvent) => {
```

Drugi handler (`33185`) faktycznie istnieje i faktycznie nie był w dokumencie rundy 1
analizowany osobno (dokument w ogóle go nie cytuje). Pełne ciało tego handlera (`sed -n
'33185,33310p'`) zawiera:

```
33271:        } else if (selectedId !== null) {
33272:          const sel = units.find(x => x.id === selectedId);
33273:          if (sel && sel.ownerId === 0) {
```

— dokładnie klawisz **B**, dokładnie zarzucona treść. Systematyczne sprawdzenie CAŁEGO ciała
tego handlera (`awk 'NR==33185,NR==33330' main.ts | grep ownerId`) daje dokładnie **jedno**
trafienie (linia 33273) — potwierdza, że nic więcej w tym handlerze nie zostało pominięte.

Spacja: `sed -n '33209,33217p'` potwierdza wiązanie `cycleToAdjacentPlayerUnit(selectedId,
1)` na `main.ts:33215`. Sama funkcja (`sed -n '5992,6007p'`):

```
5992:    function cycleToAdjacentPlayerUnit(
...
5998:      const list = opts?.all === true ? cyclablePlayerArmyLeadsAll() : cyclablePlayerArmyLeads();
5999:      const nextId = resolveAdjacentPlayerUnitCycle(units, list, afterId, delta);
...
6005:      selectPlayerUnit(next.id);
```

— nie zawiera własnego literału `ownerId`; deleguje do `cyclablePlayerArmyLeads()` (już
policzone jako A3) i `selectPlayerUnit()` (już policzone jako A2). Wniosek: main.ts:33273
to **nowa, brakująca pozycja** (dodana jako **A4**), a Spacja/`cycleToAdjacentPlayerUnit`
to **brakujący opis** istniejącego wejścia do A2/A3 — bez własnego numeru (uniknięcie
podwójnego liczenia tych samych call site'ów).

**Poprawka w dokumencie:** `01-operator-runda1-analiza.md` — nowa sekcja `## 0b` (mapa
zmian), nowy wiersz **A4** w tabeli Klastra A (`main.ts:33273`, podmiana
`isMe(sel.ownerId)`), nowy akapit pod tabelą A o wiązaniu Spacji. Suma rdzeniowa
zaktualizowana wszędzie: **41 → 42** (4+16+2+3+1+10+1+5).

---

## OBRONA: 2 -> PRZYJMUJE

**Zarzut:** Zdanie w §4 — „10 z 13 pozycji tego klastra fizycznie leży wewnątrz ciała
`endActiveHumanTurn`, patrz F1-F5 + D1-D3" — arytmetycznie to 5+3=**8**, nie 10.
Dodatkowo D1-D3 (`main.ts:23275-23332`) to oddzielne funkcje wołane z wnętrza
`endActiveHumanTurn` (przez `runPlannedMarchesAtPlayerEndTurn()`, `33127`), nie leżą tam
leksykalnie — tylko F1-F5 (`33055-33111`) leżą tam faktycznie.

**Dowód (świeży, ta runda):**

Arytmetyka: F1-F5 = 5 pozycji, D1-D3 = 3 pozycje. 5+3=**8**, nie 10 — zarzut potwierdzony
czystą arytmetyką bez potrzeby dodatkowego dowodu kodowego.

Rozróżnienie fizyczne — `sed -n '32990,33005p' main.ts`:

```
32998:    function endActiveHumanTurn(humanOwnerId: number): void {
32999:      void humanOwnerId; ...
```

`sed -n '33040,33130p' main.ts` potwierdza F1 (`33055`, `if (u.ownerId === 0 && anim...`)
oraz cały blok F1-F5 (do `33111`) leży fizycznie WEWNĄTRZ tego ciała funkcji (przed
zamknięciem na `runPlannedMarchesAtPlayerEndTurn(); … }` w okolicy `33127-33174`).

`sed -n '23270,23335p' main.ts` oraz `grep -n
"executePlannedMarchesEndTurn\|applyMarchSegmentInstant\|runPlannedMarchesAtPlayerEndTurn"
main.ts`:

```
23275:    function executePlannedMarchesEndTurn(): void {
23285:    function applyMarchSegmentInstant(unitId: string): boolean {
23367:    function runPlannedMarchesAtPlayerEndTurn(): void {
23368:      executePlannedMarchesEndTurn();
23372:        if (!applyMarchSegmentInstant(id)) continue;
33127:        runPlannedMarchesAtPlayerEndTurn();
```

— potwierdza dokładnie zarzut: D1 (`23277`), D2 (`23289`), D3 (`23332`) leżą w funkcjach
zdefiniowanych na `23275`/`23285`, setki linii PRZED `endActiveHumanTurn` (`32998`), i są
WOŁANE z jej wnętrza dopiero na `33127` przez `runPlannedMarchesAtPlayerEndTurn()` — nie
leżą tam leksykalnie. Tylko F1-F5 leżą tam fizycznie.

**Poprawka w dokumencie:** §4 przepisane — jawny podział „5 z 13 (F1-F5) fizycznie wewnątrz
/ 3 z 13 (D1-D3) wołane z wnętrza, zdefiniowane osobno / 5 z 13 (F6-F10) w `renderLoop`",
z jawną adnotacją o poprzednim błędzie arytmetycznym (5+3=8≠10). Zdanie końcowe poprawione:
runda implementacji musi podłączyć `humanOwnerId` we WSZYSTKICH 13 pozycjach klastra D+F,
nie tylko w F1-F5. Analogiczna nieprecyzyjność w §2 pkt 3 (to samo sformułowanie „fizycznie
wewnątrz" dla całego klastra D+F) poprawiona przy okazji dla spójności całego dokumentu.
Podsumowanie dla Evaluatora na końcu dokumentu również zaktualizowane.

---

## OBRONA: 3 -> PRZYJMUJE

**Zarzut:** `disbandPlayerUnit` (`main.ts:6010`, guard `ownerId!==0` na `6014`, wołane z HUD
`main.ts:20464` — wzorzec identyczny do klastra H) nie jest ani policzone, ani jawnie
wykluczone z uzasadnieniem w tabeli wykluczeń §2.

**Dowód (świeży, ta runda):**

```
$ grep -n "function disbandPlayerUnit\|disbandPlayerUnit(" gra/src/main.ts
6010:    function disbandPlayerUnit(unitId: string): boolean {
20464:        disbandPlayerUnit(u.id);
```

`sed -n '6009,6020p'`:

```
6010:    function disbandPlayerUnit(unitId: string): boolean {
...
6014:      if (u.ownerId !== 0) return false;
6019:      refundManpowerToEmpire(cities, 0, ep, mpRefund, mpMults.maxMult);
```

`sed -n '20458,20468p'` potwierdza wywołanie z callbacku akcji HUD `'disband'`
(`main.ts:20464`, ten sam blok co `'split'`/`'merge'` klastra H).

Zarzut potwierdzony w pełni: to miejsce nie było ani policzone w klastrze H, ani wymienione
w tabeli wykluczeń §2 — czysta luka w dokumencie rundy 1.

**Decyzja obrony (uzasadniona, nie tylko mechaniczne dopisanie):** dodane do tabeli
wykluczeń §2 (nie do klastra H), z jawnym rozróżnieniem od H4/H5: guard jest strukturalnie
identyczny, ale efekt `disbandPlayerUnit` jest TERMINALNY (usuwa jednostkę z gry na stałe,
zwraca Manpower do puli imperium — `refundManpowerToEmpire`, `6019`) i nie wpływa na dalszy
klik/zaznaczenie/ruch/atak/marsz/cykl nad pozostałymi jednostkami tej klatki — w
odróżnieniu od scal/rozdziel (klaster H), które fizycznie zmieniają skład jednostek
biorących udział w DALSZYM cyklu/ruchu tej samej tury (stąd H jest policzone jako input, a
disband bliżej ekonomii/produkcji, podetap (c)). To jest ta sama granica kategorii, którą
dokument już stosuje dla `afterPlayerUnitSpawned` (ekonomia/produkcja, mimo wołania
`selectPlayerUnit` w środku). Liczba rdzeniowa **nie rośnie** z tego zarzutu (zostaje 42,
zmienione tylko przez zarzut 1) — wykluczenia rosną z 11 do 12 pozycji.

**Poprawka w dokumencie:** nowy wiersz w tabeli wykluczeń §2 dla `disbandPlayerUnit`, z
pełnym uzasadnieniem rozróżnienia od klastra H. Suma „wykluczenia + rdzeń" zaktualizowana:
42 + 12 = 54.

---

## Podsumowanie zmian w `01-operator-runda1-analiza.md`

- Nowa sekcja `## 0b` — mapa korekt rundy 2 z odniesieniem do tego dokumentu.
- Klaster A: nowy wiersz **A4** (`main.ts:33273`) + akapit o wiązaniu Spacji
  (`cycleToAdjacentPlayerUnit`, `main.ts:33215`) bez osobnego numeru.
- Suma kategorii (a): **41 → 42** we wszystkich miejscach dokumentu (§1 suma, §2
  rozliczenie z „~25", §3 warunek wstępny aliasu, §4 wnioski, §5 plan dowodu, Podsumowanie).
- §2: tabela wykluczeń +1 wiersz (`disbandPlayerUnit`, z uzasadnieniem odróżnienia od
  klastra H); suma wykluczenia+rdzeń: 52 → 54.
- §4: przepisany akapit o nakładaniu z Etapem 4 — jawny podział F1-F5 (fizycznie wewnątrz)
  vs D1-D3 (wołane z wnętrza, zdefiniowane osobno) vs F6-F10 (`renderLoop`), z jawną
  adnotacją o poprzednim błędzie arytmetycznym (5+3=8, nie 10). Ta sama nieprecyzyjność
  poprawiona też w §2 pkt 3 dla spójności.
- Podsumowanie dla Evaluatora na końcu dokumentu zaktualizowane zgodnie z powyższym.

Zero zmian w `gra/src`/`gra/tools` — dokument pozostaje czysto analityczny (recon-only),
zgodnie z GOAL tego tematu.

---

STATUS: PASS-WITH-NOTES
DOMAIN: INFORMATIONAL
TEMAT: R-HOTSEAT-ETAP6A-RECON-INPUT-Q1
GOAL: Recon-only (zero zmian kodu) dla podetapu 6a ("input", §C planu hot-seat) — inwentaryzacja świeżym grepem, rozliczenie liczby ~25, propozycje podmian, sprawdzenie nakładania z Etapem 4/5, plan dowodu no-op.
ZMIANY/COMMIT: Poprawki w `dyspozycje/autobot/runs/R-HOTSEAT-ETAP6A-RECON-INPUT-Q1/01-operator-runda1-analiza.md` (liczba rdzeniowa 41→42: nowa pozycja A4 `main.ts:33273`, korekta arytmetyki/opisu §4 dla klastra D+F, nowy wiersz wykluczenia `disbandPlayerUnit` w §2) + nowy plik `03-obrona-runda1.md` (ten dokument). Zero zmian w `gra/`.
TESTY: Wszystkie 3 zarzuty zweryfikowane świeżym `grep -n`/`sed -n`/`awk` niezależnie w tej rundzie (main.ts:33185-33330 pełne ciało drugiego handlera keydown sprawdzone linia po linii; main.ts:32990-33005/33040-33130/23270-23335 dla rozróżnienia fizyczne-wewnątrz vs wołane-z; main.ts:6009-6020/20458-20468 dla disbandPlayerUnit). Dowody wklejone w OBRONA 1-3 wyżej.
BLOKADY: Brak nowych. Wszystkie 3 zarzuty PRZYJĘTE i poprawione w tej rundzie.
RUNDY: 1/5 (Operator, drugie wywołanie tej rundy — Obrona)
NASTĘPNY KROK: Evaluator, runda 2 tego samego tematu/gałęzi — zweryfikować poprawki (A4, §4, tabela wykluczeń §2) świeżym grepem/sed niezależnie od tego dokumentu.
DEPLOY/PUSH: NIE WYKONANO
