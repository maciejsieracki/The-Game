## RAPORT EVALUATORA — R-HANDEL-SZLAKI-PRZEBUDOWA-Q1-T6

```
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-HANDEL-SZLAKI-PRZEBUDOWA-Q1-T6
GOAL: Rozkład dochodu per trasa (dystans osobno od 5%) + jawne wskazanie, gdy 5% czeka na budynek
ZMIANY/COMMIT: weryfikacja 8d72e54f (origin/autobot/HANDEL-T6-Q1), merge-base 601508dd = origin/main
TESTY: własny worktree /home/user/wt-eval-T6, własny render 32/32, wszystkie bramki zielone
BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: Final Control
DEPLOY/PUSH: NIE WYKONANO (przez Evaluatora ani Operatora — origin/main nadal 601508dd)
```

### 1. Zakres — POTWIERDZONY, z jednym świadomym odstępstwem

Własny `fetch` + `git worktree add /home/user/wt-eval-T6 origin/autobot/HANDEL-T6-Q1 --detach`. Merge-base = `601508dd` = dokładnie `origin/main`, jeden commit na gałęzi, 7 plików, +946/−21, `git diff --check` czysty, `git status` czysty, `gra/data/` i `WERSJE.md` nietknięte, `gra-robocza/` nietknięte, `origin/main` nadal `601508dd`.

- **`economy.ts` — ZERO zmian. `turn-economy.ts` — ZERO zmian.** T3/T4 faktycznie nietykalne.
- **`trade-routes.ts` — DOTKNIĘTY** (+41/−4). Dispatch ma w tej sprawie wewnętrzną sprzeczność: allowlista mówi „poza zakresem", a §Kontekst techniczny pkt 1 tego samego dispatchu jawnie przewiduje „czy trzeba dodać nowy, mały eksport" właśnie tam. Zmiana jest czysto ekstrakcyjna i zweryfikowałem jej neutralność linia po linii: stare ciało pętli `0.05 * tradeRouteTotalDistanceIncome(...)` → `TRADE_ROUTE_BUILDING_BONUS_RATE (=0.05) * tradeRouteTotalDistanceIncome(...)`, ten sam mnożnik, ten sam mnożnik-argument, te same dwa `continue` zostawione w agregacie (słusznie — inaczej `map.size`/`has()` zmieniłyby kontrakt T4). Bit-identyczność wynika z konstrukcji, nie z podobieństwa. **Akceptuję** — alternatywa („własny `0.05 *` w `main.ts`") tworzyłaby dokładnie czwartą kopię wzoru.

### 2. Własny render Playwright/Chromium — 32 pass / 0 fail

Skrypt: `/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/eval-t6-render.cjs` (fixture i asercje napisane od zera, nie kopiowane z testu Operatora). Zrzut: `…/scratchpad/eval-t6-render.png`. Bundel esbuild z żywych źródeł, panel na realnych 404px, `income`/`premiaBudynku` liczone **przez żywy silnik**, nie wpisane ręcznie.

- Trasa **Z budynkiem** (ląd 12): `+40` ORAZ `+2 · 5% budynek`, klasa `on`, `display:block`, wysokość 13–26px, kolor `rgb(120,201,90)` z kaskady.
- Trasa **BEZ budynku** (morze 20): `+80` ORAZ `5% — brak budynku` (słowo, nie gołe zero), klasa `off`, `rgb(217,164,65)`, tooltip wymienia Targowisko/Port.
- Premia **ułamkowa** 0,65 → wyświetlone `+0,7` (nie `0`, nie `+0,6`) — zabieg `Math.round(n*10)/10` przed `signedPl` faktycznie działa.
- SUMA: `+158` (40+80+13+25) ORAZ `+2,7 · 5% (2 bez budynku)`.
- Zakładka **Miasto** wyrenderowana osobno: Roma `+120` / `+2 · 5% (1 bez budynku)`, Ostia `+38` / `+0,7 · 5% (1 bez budynku)`, CAŁA CYWILIZACJA `+158` / `+2,7 · 5% (2 bez budynku)`.
- Zero błędów JS, panel bez przewijania poziomego, komórka DOCHÓD bez przepełnienia.

Uruchomiłem też test Operatora w swoim worktree — **58 pass / 0 fail**, w tym sekcja (F) mutacyjna (asercje faktycznie czerwienieją na kodzie sprzed T6 — test nie jest tautologiczny) i sekcja (E) przeciw **mojemu własnemu** artefaktowi `vite build`.

### 3. Spójność matematyczna — POTWIERDZONA ręcznie

Wartości oczekiwane policzyłem ze specyfikacji T1/T2, nie z funkcji repo: ląd d=12 → `floor(5+12·35/12)=40`; morze d=20 → `floor(5+20·1,75)=40` ×2 = `80`; ląd d=3 → `floor(5+3·2,91667)=13`; ląd d=7 → `25`. Premie: 2 / 0 / 0,65 / 0. Agregat T4 `computeTradeRouteBuildingBonusByCity` zwraca dla miasta A dokładnie 2, dla B dokładnie 0,65 — identycznie z sumą składników pokazywanych w panelu.

**Kluczowe rozstrzygnięcie Operatora („nie sumujemy dwóch składników") jest MERYTORYCZNIE POPRAWNE** i zweryfikowałem je w silniku:
- `pieniadzZTras` wchodzi do skarbca **wprost, po mnożniku Wealth i bez niego** (`turn-economy.ts:2072`, `:2100` → `pieniadz: pieniadzPoWealth + pieniadzZTras`);
- `premiaHandluTrasHandlowych` jest **addytywnym składnikiem `handelBrutto`** (`economy.ts:961`), po którym idzie jeszcze korupcja (`:967`), mnożnik Waluta+Mennica (`:975`) i podział suwakami Nauka/Skarb/Zamożność.

Zsumowanie tych dwóch liczb w jedno „do skarbca" dałoby liczbę, której gracz nigdy nie dostanie. Patrz N4 niżej co do litery kryterium 2 dispatchu.

### 4. Czwarte miejsce liczenia — NIE POWSTAŁO

`grep -rn "0\.05" src/ --include=*.ts` (po odsianiu CSS/AI/zdrowia): jedyne wystąpienie w mechanice handlu to `TRADE_ROUTE_BUILDING_BONUS_RATE = 0.05` (`trade-routes.ts:963`). Wszyscy konsumenci idą przez `tradeRouteBuildingBonusForRoute()` albo `computeTradeRouteBuildingBonusByCity()`: `main.ts:14068` (panel imperium), `main.ts:13054`/`:31517` (silnik), `cityPanel.ts:10368` (panel miasta). Wzór dystansowy tak samo — wszędzie `tradeRouteTotalDistanceIncome`. Precedens `P-HANDEL-SZLAKI-WZOR-DUPLIKAT-Q1` nie odtworzony. Dodatkowo test Operatora pilnuje tego strażnikiem `!/0\.05\s*\*/.test(snapBody)` w ciele `buildEmpireTradeSnap()` — dobra bariera na przyszłość.

### 5. Bramki — własnym poleceniem, w moim worktree

`tsc --noEmit`: **0 błędów**. `vite build` (binarka `node_modules/vite/bin/vite.js`, `--outDir` poza repo, C-001): **czysty, 846 modułów**.

`trade-routes-income-test` **107/0** · `empire-panel-miasto-obywatele-content-test` **115/0** · `empire-trade-route-split-real-render-test` **58/0** · `trade-routes-test` **65/0** · `trade-grant-test` **62/0** · `zloto-szlak-test` **54/0** · `cuda-handel-test` **25/0** · `empire-panel-drobiazgi-runda2-test` **33/0** · `mennica-uspienie-test` **49/0** · `owner-economy-test` **9/0** · `empire-miasta-table-test` **96/0** · `empire-skarbiec-bilans-test` **11/0** · `diplomacy-locks-test` **78/0**.

`trade-ilosc-test`: **35/5** — plik nietknięty w diffie; **uruchomiłem ten sam test na `main` (`/home/user/The-Game/gra`): również 35/5**. Pre-istniejące, niezwiązane, potwierdzone niezależnie.

**5 bramek referencyjnych:** `logic-test` 213/213 · `tech-tree-test` 19/19 · `research-test` 33/33 · `unit-replace-test` 13/13 · `combat-test` 6/6.

---

## UWAGI (nie blokują, wymagają decyzji orkiestratora przed integracją)

**N1 — NIEŚCISŁOŚĆ W NOWYM, WIDOCZNYM TEKŚCIE: „w Twoim mieście" jest za wąskie.**
`budynekOdblokowany` wymaga wolnego slotu po **OBU** stronach trasy — `grantBuilding(fromId, toId)` w `trade-routes.ts` zwraca `false` gdy `!hasRoom(fromId) || !hasRoom(toId)`, a `hasRoom(toId)` czyta `tradeRouteLimitForCity(toId, builtByCity)` dla miasta **OBCEGO** (`builtByCity` = globalna `cityBuilt`, obejmuje miasta AI). Istniejący, zielony test to potwierdza wprost — `tools/trade-routes-test.cjs:143-146`: `c1` (gracz) MA `targowisko`, `c2` (obcy) nie ma → `budynekOdblokowany === false`.

W tym scenariuszu T6 mówi graczowi:
- tooltip: „Premia 5% z tej trasy czeka na budynek handlowy (Targowisko / Port / Port wielki) **w Twoim mieście**"
- podpis zakładki Miasto (tekst jawny, nie tooltip): „naliczany tylko z tras, **których miasto ma Targowisko/Port**"

…czyli wysyła go budować coś, co premii **nie odblokuje**, bo brakuje budynku po stronie partnera. To dokładnie ten sam rodzaj błędu, który T6 słusznie naprawił w pustym stanie tabeli („Wymagany: budynek handlowy" po T3). Sama widoczna etykieta „5% — brak budynku" jest neutralna i poprawna — nieścisłość dotyczy wyłącznie doprecyzowania GDZIE. Sugerowana korekta brzmienia: „…budynek handlowy po obu stronach trasy (Twoje miasto i miasto partnera)". Nie stawiam za to `FAIL`, bo kryterium 1 dispatchu („jawne wskazanie że 5% czeka na budynek") jest spełnione, liczby są poprawne, a poprawka to zmiana dwóch stringów.

**N2 — PRZESADZONE ZDANIE W RAPORCIE OPERATORA (nie defekt kodu).**
Raport twierdzi: „(D) layout: **zero przepełnienia w poziomie w każdej komórce**". Test asercjonuje zero **tylko dla komórki DOCHÓD**; dla MIASTO/PARTNER/MEDIUM asercja jest **względna** („nie przepełniają się bardziej niż przed T6"). Mój niezależny pomiar A/B (ten sam fixture, siatka sprzed T6 `0.95/0.9/1.1/0.95` vs po T6 `0.8/0.9/0.9/1.25`, `/tmp/…/scratchpad/eval-t6-grid-ab.cjs`):

```
PRZED T6:  Kisz (Babilończycy) → PARTNER overflow 9px   Kartagina (Kartagińczycy) → 15px
PO T6:     Kisz (Babilończycy) → PARTNER overflow 8px   Kartagina (Kartagińczycy) → 14px
```

Przepełnienie kolumny PARTNER przy długich, niepodzielnych etykietach cywilizacji jest **pre-istniejące i przez T6 MARGINALNIE POPRAWIONE** (udział PARTNER rośnie z 0,9/3,90 = 23,08% na 0,9/3,85 = 23,38%). **To nie jest regresja T6** — ale zdanie w raporcie jest nieprawdziwe i nie powinno trafić do wpisu integracyjnego w `R-HANDEL-SZLAKI-PRZEBUDOWA-Q1.md` w tej formie.

**N3 — „5% budynek" nie jest literalnie 5% liczby obok, gdy gracz ma cud handlowy.**
`income` w snapie zawiera mnożnik cudów (`wonderTradeRouteBonusForOwner`, `main.ts:14055-14057`), a `premiaBudynku` celowo **nie** — bo silnik też liczy 5% od `base`. To jest **poprawne** (zgodność z `economy.ts` ma pierwszeństwo) i Operator uzasadnił to wprost w komentarzu. Skutek uboczny: przy Petrze (+25%) wiersz pokaże „+50" i „+2 · 5% budynek", a 5% z 50 to 2,5. Kosmetyczna dwuznaczność, nie rozjazd z silnikiem. Nie wymagam zmiany — do świadomości.

**N4 — litera kryterium 2 dispatchu odstąpiona świadomie i słusznie.**
Kryterium brzmi „Suma pokazanych składników per trasa = to, co faktycznie trafia do skarbca dla tej trasy". Operator **nie sumuje** — i ma rację (dowód w §3 wyżej: dwa różne strumienie, drugi przechodzi jeszcze przez korupcję, Walutę/Mennicę i suwaki). Intencja kryterium („zero rozjazdu wyświetlanej liczby od realnego wpływu") jest spełniona w pełni, litera nie. Odstępstwo jest udokumentowane w raporcie, w typach i w podpisie pod tabelą — zgłaszam do świadomej akceptacji Final Control, nie jako zarzut.

**N5 — jakość sekcji K (informacyjnie).** Asercja `K(c)` (agregat == suma per-trasowa) jest dziś bliska tautologii, bo agregat woła ekstrakcję. Nie jest bezwartościowa — stanie się realną barierą, gdy ktoś w przyszłości rozjedzie obie ścieżki. Realną kotwicą do silnika jest `K(c-bis)` (`cityYieldPerTurn` / `handelBrutto`) i ta jest solidna.

---

**Werdykt:** implementacja jest poprawna mechanicznie i matematycznie, zgodna z T1/T2/T3/T4, nie tworzy czwartego miejsca liczenia, nie dotyka zintegrowanej logiki ekonomii, a rozkład jest realnie widoczny w żywej przeglądarce w obu wariantach i w obu tabelach — potwierdzone moim własnym, niezależnym renderem. **PASS-WITH-NOTES**; N1 to jedyna uwaga, którą rekomenduję naprawić (dwa stringi) przed integracją, N2 to korekta treści raportu, N3–N5 są informacyjne.

**Ścieżki:** worktree Evaluatora `/home/user/wt-eval-T6` · skrypty i dowody `/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/{eval-t6-render.cjs, eval-t6-render.png, eval-t6-grid-ab.cjs, eval-t6-grid-ab.png, evalbuild/index.html}`
