TEMAT:  R-REKRUTACJA-PODGLAD-SUROWCOW-Q1
RUNDA:  1/5
DATA:   2026-09-01
DOMAIN: GAME
ŚCIEŻKA: A (Workflow), model sędziego (R-PROC-AUTOBOT.md §3c)
MODEL + EFFORT per rola: Operator Sonnet 5 effort=medium / Evaluator Sonnet 5 effort=high

## WYZWALACZ
Właściciel, dwa zrzuty ekranu (panel budowy budynków vs panel rekrutacji
jednostek): „Kiedy jesteśmy w trybie budowy budynków w mieście, widać
podgląd na liczbę surowców. Niestety takiego podglądu nie widać w trybie
budowy rekrutacji jednostek. Oczywiście powinny być tylko informacje o
surowcach, które biorą udział w rekrutacji i utrzymaniu."

## RECON (wykonany, nie powtarzać)
Panel budowy budynków (`gra/src/ui/cityPanel.ts`, `renderBuildList` ~8321)
woła `appendCityResourceStockStrip(mount, city)` (~5923-5943) — generyczny
pasek pokazujący surowce >0 poza rdzeniem drewno+kamień.

Panel rekrutacji (`renderPurchasableUnits` ~8478) woła osobną funkcję
`appendRecruitMilitaryResourceStrip(mount, city)` (~5950-5972, wywołanie w
linii ~8511) — to jest ISTNIEJĄCY, ale WADLIWY odpowiednik: pokazuje
WYŁĄCZNIE jeden zahardkodowany „surowiec militarny epoki" (Brąz w epoce 2,
Żelazo w epoce 3) i **jawnie nic nie renderuje dla epoki Kamień**:
```
const key = epoch === 2 ? 'braz' : (epoch === 3 ? 'zelazo' : null);
if (!key) return;
```
To dokładnie tłumaczy zrzut właściciela — Wojownik/Oszczepnik to epoka
Kamień, pasek się w ogóle nie renderuje.

Dodatkowo samo założenie „tylko jeden surowiec militarny epoki" jest
nieaktualne: policzone po wszystkich 75 jednostkach w `gra/data/units.json`
(pola `Surowiec`/`Surowiec (ilość)` = koszt jednorazowy, `Utrzymanie
surowiec`/`Utrzymanie surowiec (ilość)` = utrzymanie/turę):
- Epoka Kamień: 9/10 jednostek kosztuje **Drewno** (wyjątek: Zwiadowca, brak
  surowca).
- Epoka Brąz: 35 jednostek **Brąz**, ale 5 nadal **Drewno** (Procarz, Procarz
  Huaracoc, Łucznik nubijski/akadyjski/asyryjski).
- Epoka Żelazo: wszystkie 25 **Żelazo**.
Skarbiec/Pieniądz jest już pokazywany osobno przez istniejący nagłówek
„Skarb" (`appendTabIndicators`, niezależny mechanizm, NIE dotyczy tego
tematu).

Gotowe cegiełki do ponownego użycia (nie pisać logiki liczenia kosztu/
utrzymania od zera): `unitStockCost(u)`/`unitStockCostChipsHtml(u, city)`
(~7751) i `unitResourceUpkeep(u)`/`unitResourceUpkeepChipsHtml(u)` (~7766) —
liczą klucz+ilość surowca kosztu/utrzymania per jednostka.

Brak istniejącego testu bezpośrednio pokrywającego
`appendRecruitMilitaryResourceStrip`. Uwaga: NIE naruszać
`rekrutacja-skarbiec-only-test.cjs` ani `unit-resource-upkeep-test.cjs`
(kontrakt P-REKRUTACJA-JEDNOSTEK-TYLKO-SKARBIEC-Q1/
R-REKRUTACJA-SUROWIEC-BEZ-UPKEEP-Q1) — zmiana jest WYŁĄCZNIE wizualna
(podgląd), zero zmian w logice bramkowania zakupu/rekrutacji.

## GOAL
Przebuduj `appendRecruitMilitaryResourceStrip` (albo zastąp ją nową funkcją
o jaśniejszej nazwie, jeśli Operator uzna to za czytelniejsze) tak, żeby
DYNAMICZNIE liczyła zbiór surowców faktycznie uczestniczących w koszcie i/
lub utrzymaniu WSZYSTKICH jednostek zwracanych przez `purchasableUnits(...)`
dla danego miasta/epoki — używając istniejących `unitStockCost`/
`unitResourceUpkeep` — zamiast zahardkodowanej listy Brąz/Żelazo per epoka.
Pasek ma pokazywać TYLKO te surowce (np. Drewno w epoce Kamień, Drewno+Brąz
w epoce Brąz jeśli oba faktycznie występują, Żelazo w epoce Żelazo), z
aktualnym stanem zapasu z `ownerSurowcePoolFor(city)` (ten sam wzorzec co
`appendCityResourceStockStrip`). Renderuj tym samym mechanizmem chipów
(`.civ-cs-res-chip`, `mapResourceIconSvg`) co panel budowy — spójność
wizualna.

## KRYTERIA KOŃCA — binarne PRAWDA/FAŁSZ
1. W epoce Kamień panel rekrutacji pokazuje pasek z Drewnem (aktualny stan
   zapasu) — DZIŚ nie pokazuje NIC. Realny dowód: zrzut z żywej przeglądarki
   (headless Chromium) PRZED i PO, panel rekrutacji w mieście epoki Kamień.
2. W epoce Brąz pasek pokazuje WSZYSTKIE faktycznie używane surowce
   (Brąz ORAZ Drewno, jeśli w danym mieście są dostępne do rekrutacji
   jednostki kosztujące Drewno — np. Procarz) — nie tylko Brąz.
3. W epoce Żelazo pasek pokazuje Żelazo — zachowanie niezmienione (już
   działało poprawnie, zero regresu).
4. Pasek pokazuje WYŁĄCZNIE surowce uczestniczące w koszcie/utrzymaniu
   jednostek DOSTĘPNYCH DO REKRUTACJI w danym mieście — nie wszystkie
   surowce w grze, nie surowce niezwiązane z jednostkami (np. bez gliny/
   cegły jeśli żadna jednostka ich nie używa).
5. Zero zmian w logice bramkowania zakupu/rekrutacji — `rekrutacja-skarbiec-
   only-test.cjs` i `unit-resource-upkeep-test.cjs` zielone, identyczna
   liczba asercji jak przed zmianą.
6. `tsc --noEmit` 0 błędów + wszystkie 5 bramek referencyjnych bez regresu.

## ALLOWLISTA — nic poza tym
`gra/src/ui/cityPanel.ts` (wyłącznie `appendRecruitMilitaryResourceStrip` i
bezpośrednio powiązane wywołanie w `renderPurchasableUnits`), nowy plik
testowy w `gra/tools/` jeśli Operator uzna za potrzebny (np.
`recruit-resource-strip-test.cjs`). Zakazane bezwzględnie:
`unitStockCost`/`unitResourceUpkeep`/`purchasableUnits` (czytać, nie
zmieniać), `appendCityResourceStockStrip` (panel budowy budynków, nietknięty),
`appendTabIndicators` (nagłówek Skarb/Dostępne/Kolejka, nietknięty),
`gra/data/**`, `docs/decyzje/<ID>.md`, `.git/**`, `dyspozycje/WERSJE.md`,
`gra-robocza/ROBOCZA-MANIFEST.json`, `playbook.json`.

## IZOLACJA
worktree własny, gałąź `autobot/R-REKRUTACJA-PODGLAD-SUROWCOW-Q1`, baza
JAWNIE `origin/main`. Sparse-checkout bez `gra-robocza/`, `gra-kanon/`,
`dist/`.

## REGUŁA PRZECIW SAMOOSZUKIWANIU
Zakaz uznania kryteriów 1-4 za spełnione bez realnego zrzutu z żywej,
zbudowanej gry w KAŻDEJ z trzech epok (Kamień/Brąz/Żelazo) — sam odczyt kodu
nie wystarcza, bo dokładnie taki błąd (hardkodowana lista, cichy `return`
dla Kamienia) już raz przeszedł niezauważony. Zakaz zmiany logiki
`unitStockCost`/`unitResourceUpkeep` pod pretekstem „uproszczenia" — mają
zostać wołane, nie modyfikowane.

## PROCEDURA NAPRAWCZA PRZY FAIL
Runda N+1 na TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

## GRANICE (naruszenie = FAIL)
`R-PROC-AUTOBOT.md` §9. Zakaz `npm run build`/`dev` w `gra/` (typecheck
wyłącznie `tsc --noEmit`; build produkcyjny wyłącznie
`node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-dist --emptyOutDir`
dla zrzutów w przeglądarce). Zakaz `git add -A`.

## OBIEG
Operator → Evaluator (zarzuty, lista może być pusta) → Operator (Obrona,
tylko gdy zarzuty niepuste) → Final Control (osobne wywołanie Workflow) →
orkiestrator integruje allowlist-only i cutuje kolejną FALĘ ROBOCZA.
