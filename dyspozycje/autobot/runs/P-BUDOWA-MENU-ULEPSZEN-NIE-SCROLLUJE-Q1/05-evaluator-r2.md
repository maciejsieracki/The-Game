# 05 — EVALUATOR (runda 2)

STATUS: FAIL
DOMAIN: GAME
TEMAT: `P-BUDOWA-MENU-ULEPSZEN-NIE-SCROLLUJE-Q1`
GOAL: Lista „ULEPSZENIA TERENU" ma być **w całości osiągalna i klikalna** przy każdym
realistycznym powiększeniu przeglądarki i rozmiarze okna.
(§16a pkt 9 sprawdzone — GOAL w raporcie Operatora zgodny z `00-dispatch.md`, bez przesunięcia.)

Worktree Evaluatora: `/home/user/wt-EVAL-P-BUDOWA-MENU` (detached @ `9baead5b`), **własny harness**
(`scratchpad/ev2/ev2-grid.cjs`, własne stuby ikon), własne pomiary. Raport Operatora nie był
podstawą żadnej liczby poniżej.

## Powód FAIL — panel wjeżdża pod prawy klaster HUD (z-index 320) i znika

Runda 2 dodała **dwa** człony. Podłoga `max-height` działa i jest w porządku. Drugi człon —
`top:min(90px,max(0px,calc(100% − rezerwa − 52px)))` — przesuwa panel **w górę**, w pas
zarezerwowany dla górnego HUD-u. Tam stoi `.hud-right-cluster` (chipy Armia…Religia + Civpedia +
Menu): `hud.ts:578` → `position:fixed;top:16px;right:20px;z-index:320`, wariant powiększenia UI
`right:10px` (`hud.ts:550`), emitowany bezwarunkowo (`hud.ts:1158`), nic go nie ukrywa. Ten sam
prawy brzeg co panel budowy i **wyższy z-index (320 > 311)**. Sam kod rezerwuje ten pas:
`hudLayout.ts::eventsPanelTopPx() = max(92, hudRightRailBottomPx()=68) + 10 = 102`. Stare
`top:90px` ten pas respektowało — `top` schodzące do `0px` nie.

Pomiar 60 punktów siatki łączonej ze zreplikowanym klastrem (geometria 1:1 ze źródła; szerokość
300px to **ostrożne oszacowanie w dół**, realny klaster to 5 chipów + 2 przyciski):

| stan | ostatnia pozycja NIEklikalna | panel pod klastrem | nachodzi na pasek | WYKONAJ niekliknialny | panel < 1 wiersza |
|---|---|---|---|---|---|
| PRZED `416733e1` | 29/60 | 0/60 | 60/60 | 59/60 | 0/60 |
| RUNDA 1 `d0fd2301` | 5/60 | 0/60 | 4/60 | 0/60 | 10/60 |
| **RUNDA 2 `9c2386fe`** | **4/60** | **7/60** | 0/60 | 0/60 | 0/60 |

Cztery komórki, w których lista jest **całkowicie nieosiągalna** (wolna szerokość wiersza 0%):
`BR175×UI150×640`, `BR200×UI125×640`, `BR200×UI150×768`, `BR200×UI150×640`.
Z tego **dwie to regresja wobec stanu zastanego** (PRZED klik OK → PO klik NIE):
`BR200×UI125×640` i `BR200×UI150×640`. Pierwsza z nich to **jeden z dwóch punktów, które runda 2
miała naprawić** — nie jest naprawiony, jest gorszy niż PRZED.

Dowód wizualny (żywy Chromium, `BR200×UI125×640`, `scratchpad/ev2/shot-{PRZED,R1,R2}-*.png`):
PRZED widać „Warzelnia soli / Tarasy / Fort"; R2 — **panelu nie widać wcale**, ekran to sam baner
trybu budowy, klaster HUD i stos tury.

## Dlaczego żaden test tego nie łapie

`build-panel-ulepszenia-scroll-real-render-test.cjs` montuje kanwę, dolny pasek i panel budowy —
**nie montuje `.hud-right-cluster`**. Test mierzy więc scenę bez elementu, na który poprawka
przesuwa panel. Uruchomiony przeze mnie: **30/30** — wynik prawdziwy, ale ślepy w tym miejscu.
To ta sama klasa błędu co w rundzie 1 (mierzenie osi osobno), tylko o jeden poziom wyżej.

## Co potwierdzam jako dobre (własnym pomiarem)

- Podłoga `max-height` **działa**: panel < jednego wiersza w 10/60 (R1) → **0/60** (R2), minimum 52px CSS.
- Nachodzenie na stos WYKONAJ/ZAKOŃCZ TURĘ: 4/60 → **0/60**; WYKONAJ i ZAKOŃCZ TURĘ realnie
  klikalne (nie tylko `elementFromPoint`) w 60/60.
- W kryterium testu tematu (zjazd na dół + środek wiersza, **bez** klastra) R2 daje 0/60
  nieklikalnych — twierdzenie Operatora odtworzone i prawdziwe **w jego scenie**.
- Mutacje odtworzone samodzielnie: **M3** (usunięcie podłogi) czerwieni C(b)/C(c)/C(d)+F — 4 asercje,
  wszystkie na osi powiększenia UI gry, więc **tak, ta oś jest realnie pokryta**. **M4** (usunięcie
  ruchomego `top`) czerwieni wyłącznie nachodzenie + klikalność WYKONAJ (2 asercje). Zbiory rozłączne.
- Warstwa suwaków budżetu automatu **nietknięta** (zero trafień w diffie), pasek akcji nieprzesunięty,
  hipoteza „kółko zoomuje mapę" nadal nie zachodzi.
- Allowlista, §9: zmienione tylko `gra/src/ui/buildModeHud.ts`, `gra/tools/*`, artefakt runu; brak
  sekretów; 4 usunięte linie, wszystkie zastąpione; `git diff --check` czysto; brak `npm run build/dev`;
  gałąź wypchnięta, **nic w `main`**.
- Bramki (własne uruchomienia): `tsc --noEmit` 0 błędów; logic 213/213; tech-tree 19/19; research 33/33;
  unit-replace 13/13; combat 6/6; `vite` binarką do `/tmp/civ-dist-eval-r2` (C-001) OK, `git status`
  po buildzie czysty. Defensywnie: lock-tip 21/21, slider-max 13/13.

## Precyzyjna poprawka na rundę 3 — jedna, wąska, ZMIERZONA

**Usunąć ruchomy człon `top` (albo ograniczyć jego dolną granicę do pasa HUD), zostawić podłogę
`max-height` bez zmian.** Zmierzyłem ten wariant (podłoga + `top:${BUILD_PANEL_TOP_PX}px`) na tej
samej siatce z klastrem:

| wariant | ostatnia NIEklikalna | pod klastrem | nachodzi na pasek | WYKONAJ niekliknialny | min. wolna szerokość wiersza |
|---|---|---|---|---|---|
| runda 2 jak jest | 4/60 | 7/60 | 0/60 | 0/60 | **0%** |
| **podłoga + `top` stałe** | **0/60** | **0/60** | 7/60 | 3/60 (PRZED: 59/60) | **100%** |

Cena — nachodzenie na stos tury w 7 komórkach i zasłonięty WYKONAJ w 3 — jest dokładnie tym, na co
korekta z rundy 1 **jawnie zezwoliła**: „w komórkach zdegenerowanych panel wróci do nachodzenia na
stos tury (jak PRZED), ale ostatnia pozycja zostanie klikalna — czyli nigdy gorzej niż stan zastany".
Lepiej, żeby panel nachodził na przycisk, niż żeby zniknął pod górnym HUD-em.

**Wiążące kryterium odbioru rundy 3:** dla każdej z 60 komórek, **przy zamontowanym
`.hud-right-cluster`**, ostatnia pozycja jest realnie klikalna, a żadna komórka nie przechodzi
z OK na NIE wobec PRZED. Test tematu ma montować ten klaster (geometria z `hudLayout.ts`/`hud.ts`,
nie z pamięci) — inaczej ta sama luka wróci. Nie poszerzać zakresu poza to.

## Uwagi drugorzędne (do rejestru, nie blokują)

- Baner trybu budowy (`.civ-build-banner`, z-index 312, `top:48px`) nachodzi na panel w 32/60 komórek
  **we wszystkich trzech stanach, także PRZED** — pre-istniejące, osobny temat, nie ta runda.
- Ikonka `.civ-build-info-ic` leży czasem dokładnie w geometrycznym środku wiersza; `elementFromPoint`
  uznaje wtedy wiersz za „klikalny", a realny klik nie wybiera ulepszenia (`stopPropagation`).
  Kryterium (c) w teście tematu jest przez to o włos za słabe — (d) to ratuje.
- Temat **nadal nie ma wpisu** w `dyspozycje/REJESTR-PROSB-I-ZADAN.md`; zgłoszony przez Operatora
  `.et-hint` też nie został zarejestrowany jako osobny temat (§3b).

ZMIANY/COMMIT: Evaluator nie zmienia kodu gry. Oceniany `9c2386fe` (raport `9baead5b`).
Ten raport: `dyspozycje/autobot/runs/P-BUDOWA-MENU-ULEPSZEN-NIE-SCROLLUJE-Q1/05-evaluator-r2.md`.
TESTY: wyniki własnych uruchomień wyżej (siatka 60 punktów × 4 warianty kodu, dwie mutacje, test
tematu 30/30, bramki, zrzuty PRZED/R1/R2).
BLOKADY: lista całkowicie nieosiągalna w 4 komórkach po zamontowaniu prawego klastra HUD, w tym
2 regresje wobec stanu zastanego (`BR200×UI125×640`, `BR200×UI150×640`).
RUNDY: 2/5.
NASTĘPNY KROK: Final Control (runda 2), następnie Operator runda 3 — poprawka z sekcji wyżej,
to samo ID, ta sama gałąź.
DEPLOY/PUSH: NIE WYKONANO.
